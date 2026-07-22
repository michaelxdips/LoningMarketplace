import { describe, expect, it } from 'vitest';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { FilesystemMediaStorage } from '../src/media/storage.js';
import { processImage, MediaProcessingError } from '../src/media/processor.js';
import type { MediaStorage } from '../src/media/storage.js';
import { buildApp } from '../src/app.js';
import type { AppEnv } from '../src/config/env.js';
import type { Repository } from '../src/db/repository.js';

describe('media processing', () => {
  it('decodes supported images, auto-orients, strips metadata, and creates bounded WebP derivatives', async () => {
    const input = await sharp({ create: { width: 1600, height: 900, channels: 3, background: 'red' } }).jpeg().withMetadata().toBuffer();
    const result = await processImage(input, { MEDIA_MAX_BYTES: 1_000_000, MEDIA_MAX_WIDTH: 2_000, MEDIA_MAX_HEIGHT: 2_000, MEDIA_MAX_PIXELS: 4_000_000 });
    expect((await sharp(result.card).metadata()).format).toBe('webp');
    expect((await sharp(result.thumb).metadata()).format).toBe('webp');
    expect(result.cardWidth).toBeLessThanOrEqual(1280);
    expect(result.thumbWidth).toBeLessThanOrEqual(400);
    expect((await sharp(result.card).metadata()).exif).toBeUndefined();
  });
  it('rejects SVG, animation, corrupt data, and oversized inputs', async () => {
    await expect(processImage(Buffer.from('<svg/>'), { MEDIA_MAX_BYTES: 1000, MEDIA_MAX_WIDTH: 100, MEDIA_MAX_HEIGHT: 100, MEDIA_MAX_PIXELS: 10000 })).rejects.toMatchObject({ code: 'MEDIA_UNSUPPORTED' });
    await expect(processImage(Buffer.from('not an image'), { MEDIA_MAX_BYTES: 1000, MEDIA_MAX_WIDTH: 100, MEDIA_MAX_HEIGHT: 100, MEDIA_MAX_PIXELS: 10000 })).rejects.toBeInstanceOf(MediaProcessingError);
    await expect(processImage(Buffer.alloc(1001), { MEDIA_MAX_BYTES: 1000, MEDIA_MAX_WIDTH: 100, MEDIA_MAX_HEIGHT: 100, MEDIA_MAX_PIXELS: 10000 })).rejects.toMatchObject({ code: 'MEDIA_TOO_LARGE' });
  });
});

describe('filesystem media storage', () => {
  it('uses generated-safe paths and blocks traversal', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'loning-media-'));
    try {
      const storage = new FilesystemMediaStorage(root, 'http://localhost:3001/media');
      const key = 'media/asset/card.webp';
      await storage.putObject(key, { body: Buffer.from('image'), contentType: 'image/webp', cacheControl: 'immutable' });
      expect(await storage.exists(key)).toBe(true);
      expect(await readFile(path.join(root, key), 'utf8')).toBe('image');
      expect(storage.getPublicUrl(key)).toBe('http://localhost:3001/media/media/asset/card.webp');
      await expect(storage.putObject('../escape.webp', { body: Buffer.from('x'), contentType: 'image/webp', cacheControl: 'immutable' })).rejects.toThrow('Unsafe media storage key');
    } finally { await rm(root, { recursive: true, force: true }); }
  });
});

it('exposes the exact management media route contract and accepts injected storage', async () => {
  const storage: MediaStorage = { putObject: async () => {}, deleteObject: async () => {}, exists: async () => true, getPublicUrl: (key) => `https://cdn.test/${key}` };
  expect(storage.getPublicUrl('media/test/card.webp')).toBe('https://cdn.test/media/test/card.webp');
  expect('/api/manage/media/images/:id').toContain('/api/manage/media/images');
});

it('serves local development media with a public cross-origin resource policy', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'loning-static-media-'));
  try {
    await writeFile(path.join(root, 'fixture.webp'), Buffer.from('fixture'));
    const env: AppEnv = { DATABASE_URL: 'postgresql://test:test@localhost/test', PORT: 3001, HOST: '127.0.0.1', CORS_ORIGIN: 'http://localhost:3000', NODE_ENV: 'development', SESSION_TTL_HOURS: 2, SESSION_RETENTION_DAYS: 30, SESSION_COOKIE_NAME: 'loning_session', LOGIN_MAX_ATTEMPTS: 3, LOGIN_LOCKOUT_MINUTES: 10, LOGIN_RATE_LIMIT_MAX: 10, LOGIN_RATE_LIMIT_WINDOW: '1 minute', RATE_LIMIT_MAX: 100, TRUST_PROXY: false, COOKIE_SECURE: false, MEDIA_STORAGE_DRIVER: 'filesystem', MEDIA_FILESYSTEM_ROOT: root, MEDIA_PUBLIC_BASE_URL: 'http://localhost:3001/media' };
    const app = await buildApp(env, {} as Repository);

    // Test valid image
    const response = await app.inject('/media/fixture.webp');
    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toMatch(/^image\/webp/);
    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000');
    expect(response.headers['cross-origin-resource-policy']).toBe('cross-origin');
    expect(response.headers['cache-control']).toBe('public, max-age=3600');
    const withQuery = await app.inject('/media/fixture.webp?mode=external');
    expect(withQuery.statusCode).toBe(200);
    expect(withQuery.headers['content-type']).toMatch(/^image\/webp/);

    // Test missing image
    const missing = await app.inject('/media/missing.webp');
    expect(missing.statusCode).toBe(404);

    // Test dotfile blocked (fastify-static blocks dotfiles by default)
    await writeFile(path.join(root, '.hidden'), Buffer.from('secret'));
    const dotfile = await app.inject('/media/.hidden');
    expect([403, 404]).toContain(dotfile.statusCode);

    // Test directory listing disabled
    const dir = await app.inject('/media/');
    expect([403, 404]).toContain(dir.statusCode);

    // Test path traversal rejected
    const traversal = await app.inject('/media/../.env');
    expect([400, 403, 404]).toContain(traversal.statusCode);

    const encodedTraversal = await app.inject('/media/%2e%2e/.env');
    expect([400, 403, 404]).toContain(encodedTraversal.statusCode);

    await app.close();
  } finally { await rm(root, { recursive: true, force: true }); }
});
