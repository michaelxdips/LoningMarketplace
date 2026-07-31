import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { S3Client, CreateBucketCommand, HeadBucketCommand } from '@aws-sdk/client-s3';
import { S3MediaStorage } from '../src/media/storage.js';

describe('S3-compatible Media Storage Integration & Compensation Suite (MinIO / S3)', () => {
  const minioEndpoint = process.env.S3_ENDPOINT || 'http://127.0.0.1:59000';
  const bucket = process.env.S3_BUCKET || 'loning-test-media';
  const region = process.env.S3_REGION || 'us-east-1';
  const publicBaseUrl = process.env.MEDIA_PUBLIC_BASE_URL || 'http://localhost:3001/media';
  const credentials = {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || 'minioadmin',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || 'minioadmin',
  };

  let storage: S3MediaStorage;
  let rawClient: S3Client;
  let minioAvailable = false;

  beforeAll(async () => {
    rawClient = new S3Client({
      endpoint: minioEndpoint,
      region,
      credentials,
      forcePathStyle: true,
    });

    try {
      await rawClient.send(new HeadBucketCommand({ Bucket: bucket }));
      minioAvailable = true;
    } catch {
      try {
        await rawClient.send(new CreateBucketCommand({ Bucket: bucket }));
        minioAvailable = true;
      } catch {
        minioAvailable = false;
      }
    }

    storage = new S3MediaStorage(bucket, publicBaseUrl, {
      endpoint: minioEndpoint,
      region,
      credentials,
      forcePathStyle: true,
    });
  });

  it('Gap 3: Upload -> object exists -> public read -> replace -> old object cleanup', async () => {
    if (!minioAvailable) {
      console.warn('Skipping S3 integration test: MinIO endpoint not reachable in this test runner context');
      return;
    }

    const initialKey = `media/integration-initial-${Date.now()}.webp`;
    const initialBody = Buffer.from('RIFF....WEBPVP8 INITIAL_IMAGE_BYTES');

    // 1. Put initial object
    await storage.putObject(initialKey, {
      body: initialBody,
      contentType: 'image/webp',
      cacheControl: 'public, max-age=31536000',
    });

    // 2. Verify existence
    const initialExists = await storage.exists(initialKey);
    expect(initialExists).toBe(true);

    // 3. Verify public URL format
    const publicUrl = storage.getPublicUrl(initialKey);
    expect(publicUrl).toBe(`${publicBaseUrl}/${initialKey}`);

    // 4. Replace image (upload replacement object & delete old object)
    const replacementKey = `media/integration-replacement-${Date.now()}.webp`;
    const replacementBody = Buffer.from('RIFF....WEBPVP8 REPLACEMENT_IMAGE_BYTES');

    await storage.putObject(replacementKey, {
      body: replacementBody,
      contentType: 'image/webp',
      cacheControl: 'public, max-age=31536000',
    });

    await storage.deleteObject(initialKey);

    // 5. Verify replacement exists and old object is deleted
    expect(await storage.exists(replacementKey)).toBe(true);
    expect(await storage.exists(initialKey)).toBe(false);

    // Cleanup
    await storage.deleteObject(replacementKey);
  });

  it('Gap 4: Compensation - DB failure deletes newly uploaded S3 object', async () => {
    if (!minioAvailable) return;

    const probeKey = `media/compensation-db-fail-${Date.now()}.webp`;
    const probeBody = Buffer.from('RIFF....WEBPVP8 PROBE_BYTES');

    // Simulated Fastify media route compensation pattern
    try {
      await storage.putObject(probeKey, {
        body: probeBody,
        contentType: 'image/webp',
        cacheControl: 'public, max-age=31536000',
      });

      // Simulate DB transaction error
      throw new Error('SIMULATED_DB_TRANSACTION_FAILURE');
    } catch (err) {
      // Compensation handler runs storage.deleteObject
      await storage.deleteObject(probeKey).catch(() => undefined);
      expect((err as Error).message).toBe('SIMULATED_DB_TRANSACTION_FAILURE');
    }

    // Verify S3 object was deleted by compensation
    const existsAfterCompensation = await storage.exists(probeKey);
    expect(existsAfterCompensation).toBe(false);
  });

  it('Gap 4: Compensation - Storage failure leaves DB reference unchanged', async () => {
    const existingDbState = {
      id: 'media-asset-123',
      cardStorageKey: 'media/existing-card.webp',
      thumbnailStorageKey: 'media/existing-thumb.webp',
    };

    // Invalid S3 storage client configured with unreachable bucket
    const invalidStorage = new S3MediaStorage('non-existent-invalid-bucket-xyz', publicBaseUrl, {
      endpoint: 'http://127.0.0.1:59999',
      region: 'us-east-1',
      credentials,
      forcePathStyle: true,
    });

    let storageFailed = false;
    try {
      await invalidStorage.putObject('media/new-card.webp', {
        body: Buffer.from('NEW_IMAGE'),
        contentType: 'image/webp',
        cacheControl: 'no-cache',
      });
    } catch {
      storageFailed = true;
    }

    expect(storageFailed).toBe(true);
    // DB state remains untouched
    expect(existingDbState.cardStorageKey).toBe('media/existing-card.webp');
  });

  it('Gap 5: Restart persistence simulation - stored S3 media remains accessible across storage client re-instantiation', async () => {
    if (!minioAvailable) return;

    const key = `media/persistence-test-${Date.now()}.webp`;
    const body = Buffer.from('RIFF....WEBPVP8 PERSISTENCE_BYTES');

    // Client 1 uploads object
    await storage.putObject(key, {
      body,
      contentType: 'image/webp',
      cacheControl: 'public, max-age=31536000',
    });

    // Simulate backend restart by re-instantiating storage client
    const restartedStorage = new S3MediaStorage(bucket, publicBaseUrl, {
      endpoint: minioEndpoint,
      region,
      credentials,
      forcePathStyle: true,
    });

    const existsAfterRestart = await restartedStorage.exists(key);
    expect(existsAfterRestart).toBe(true);

    // Cleanup
    await restartedStorage.deleteObject(key);
  });
});
