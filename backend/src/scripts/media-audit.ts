import { loadEnv, mediaConfig } from '../config/env.js';
import { createDatabase } from '../db/client.js';
import { mediaAssets } from '../db/schema.js';
import { createMediaStorage, FilesystemMediaStorage, S3MediaStorage } from '../media/storage.js';
import { ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3';
import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';

async function main() {
  console.log('--- READ-ONLY MEDIA INTEGRITY AUDIT ---');
  const env = loadEnv(true);
  const { db, close } = createDatabase(env.DATABASE_URL);
  const cfg = mediaConfig(env);
  const storage = createMediaStorage(cfg);

  try {
    const assets = await db.select().from(mediaAssets);
    console.log(`Total Media Assets in DB: ${assets.length}`);

    let missingCardCount = 0;
    let missingThumbCount = 0;
    let duplicateKeyCount = 0;
    let invalidKeyPatternCount = 0;

    const seenKeys = new Set<string>();

    for (const asset of assets) {
      if (seenKeys.has(asset.cardStorageKey)) duplicateKeyCount++;
      else seenKeys.add(asset.cardStorageKey);

      if (seenKeys.has(asset.thumbnailStorageKey)) duplicateKeyCount++;
      else seenKeys.add(asset.thumbnailStorageKey);

      if (!/^[a-z0-9][a-z0-9/_-]*\.[a-z0-9]+$/.test(asset.cardStorageKey)) invalidKeyPatternCount++;
      if (!/^[a-z0-9][a-z0-9/_-]*\.[a-z0-9]+$/.test(asset.thumbnailStorageKey)) invalidKeyPatternCount++;

      const cardExists = await storage.exists(asset.cardStorageKey);
      if (!cardExists) {
        console.error(`[MISSING OBJECT] Asset ID ${asset.id} card key missing: ${asset.cardStorageKey}`);
        missingCardCount++;
      }

      const thumbExists = await storage.exists(asset.thumbnailStorageKey);
      if (!thumbExists) {
        console.error(`[MISSING OBJECT] Asset ID ${asset.id} thumbnail key missing: ${asset.thumbnailStorageKey}`);
        missingThumbCount++;
      }
    }

    console.log('--- DB-TO-OBJECT VERIFICATION ---');
    console.log(`Missing Card Objects: ${missingCardCount}`);
    console.log(`Missing Thumbnail Objects: ${missingThumbCount}`);
    console.log(`Duplicate Storage Keys: ${duplicateKeyCount}`);
    console.log(`Invalid Storage Key Patterns: ${invalidKeyPatternCount}`);

    let objectToDbOrphanStatus = 'SKIPPED (ListBucket permission not executed)';
    let orphanObjectCount = 0;

    if (storage instanceof FilesystemMediaStorage) {
      try {
        const mediaDir = path.join(storage.root, 'media');
        const files = await readdir(mediaDir);
        for (const file of files) {
          const relKey = `media/${file}`;
          if (!seenKeys.has(relKey) && !file.startsWith('.')) {
            orphanObjectCount++;
          }
        }
        objectToDbOrphanStatus = `EXECUTED (Filesystem orphan count: ${orphanObjectCount})`;
      } catch {
        objectToDbOrphanStatus = 'SKIPPED (Directory read failed)';
      }
    } else if (storage instanceof S3MediaStorage && cfg.S3_BUCKET && cfg.S3_REGION) {
      try {
        const s3 = new S3Client({
          region: cfg.S3_REGION,
          endpoint: cfg.S3_ENDPOINT,
          forcePathStyle: cfg.S3_FORCE_PATH_STYLE,
          credentials: cfg.S3_ACCESS_KEY_ID && cfg.S3_SECRET_ACCESS_KEY ? { accessKeyId: cfg.S3_ACCESS_KEY_ID, secretAccessKey: cfg.S3_SECRET_ACCESS_KEY } : undefined,
        });
        const listRes = await s3.send(new ListObjectsV2Command({ Bucket: cfg.S3_BUCKET, Prefix: 'media/' }));
        const contents = listRes.Contents ?? [];
        for (const item of contents) {
          if (item.Key && !seenKeys.has(item.Key) && !item.Key.includes('precloud-check')) {
            orphanObjectCount++;
          }
        }
        objectToDbOrphanStatus = `EXECUTED (S3 ListBucket orphan count: ${orphanObjectCount})`;
      } catch (err) {
        objectToDbOrphanStatus = `SKIPPED (ListBucket not permitted or failed: ${err instanceof Error ? err.message : String(err)})`;
      }
    }

    console.log('--- OBJECT-TO-DB ORPHAN DISCOVERY ---');
    console.log(`Status: ${objectToDbOrphanStatus}`);

    if (missingCardCount > 0 || missingThumbCount > 0 || duplicateKeyCount > 0 || invalidKeyPatternCount > 0) {
      throw new Error(`Media audit FAILED: ${missingCardCount + missingThumbCount} missing objects, ${duplicateKeyCount} duplicate keys, ${invalidKeyPatternCount} invalid keys.`);
    }

    console.log('Media Integrity Audit Status: PASS');
  } finally {
    await close();
  }
}

main().catch((error) => {
  console.error(`MEDIA_AUDIT_FAILURE: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
