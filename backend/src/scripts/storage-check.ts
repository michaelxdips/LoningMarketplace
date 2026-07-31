import { randomUUID } from 'node:crypto';
import { mediaConfig, loadEnv } from '../config/env.js';
import { createMediaStorage, FilesystemMediaStorage, S3MediaStorage } from '../media/storage.js';

async function main() {
  const isProbe = process.argv.includes('--probe');
  console.log(`--- MEDIA STORAGE PREFLIGHT CHECK (Mode: ${isProbe ? 'PROBE' : 'CONFIG_ONLY'}) ---`);
  const env = loadEnv(false);
  console.log(`Storage Driver: ${env.MEDIA_STORAGE_DRIVER}`);
  console.log(`Media Public Base URL: ${env.MEDIA_PUBLIC_BASE_URL}`);

  const storage = createMediaStorage(mediaConfig(env));

  if (storage instanceof FilesystemMediaStorage) {
    console.log(`Filesystem Root: ${storage.root}`);
    if (env.NODE_ENV === 'production') {
      throw new Error('PREFLIGHT_REFUSED: MEDIA_STORAGE_DRIVER must be s3 in production');
    }
    if (isProbe) {
      const probeKey = `precloud-check/${randomUUID()}.webp`;
      await storage.putObject(probeKey, { body: Buffer.from('PROBE'), contentType: 'image/webp', cacheControl: 'no-cache' });
      const exists = await storage.exists(probeKey);
      if (!exists) throw new Error('Filesystem probe object not created');
      await storage.deleteObject(probeKey);
      console.log('Filesystem probe check: PASS');
    } else {
      console.log('Filesystem config check: PASS');
    }
  } else if (storage instanceof S3MediaStorage) {
    console.log(`S3 Bucket: ${env.S3_BUCKET}`);
    console.log(`S3 Region: ${env.S3_REGION}`);
    console.log(`S3 Endpoint: ${env.S3_ENDPOINT ?? 'AWS default'}`);
    console.log(`S3 Force Path Style: ${env.S3_FORCE_PATH_STYLE}`);

    if (isProbe) {
      const uuid = randomUUID();
      const probeKey = `precloud-check/${uuid}.webp`;
      console.log(`Executing S3 storage probe with isolated key: ${probeKey}`);
      try {
        const probeData = Buffer.from('RIFF....WEBPVP8 ...', 'utf-8');
        await storage.putObject(probeKey, {
          body: probeData,
          contentType: 'image/webp',
          cacheControl: 'no-cache',
        });
        const exists = await storage.exists(probeKey);
        if (!exists) throw new Error('Probe object was not found on S3 storage after upload');
        await storage.deleteObject(probeKey);
        const existsAfterDelete = await storage.exists(probeKey);
        if (existsAfterDelete) throw new Error('Probe object cleanup failed: object still exists');
        console.log('S3-compatible storage read/write/delete probe check: PASS');
      } catch (error) {
        // Attempt cleanup on error
        await storage.deleteObject(probeKey).catch(() => undefined);
        throw new Error(`S3 preflight probe failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    } else {
      console.log('S3 storage client initialization & config check: PASS');
    }
  } else {
    throw new Error('Unknown media storage driver');
  }

  console.log('--- STORAGE PREFLIGHT COMPLETE ---');
}

main().catch((error) => {
  console.error(`STORAGE_CHECK_FAILURE: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
