import { describe, expect, it } from 'vitest';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { Readable } from 'node:stream';
import path from 'node:path';
import sharp from 'sharp';
import { buildPublicMediaUrl, FilesystemMediaStorage } from '../src/media/storage.js';
import { processImage, MediaProcessingError } from '../src/media/processor.js';
import type { MediaStorage, StoredObject } from '../src/media/storage.js';
import { buildApp } from '../src/app.js';
import type { Security } from '../src/auth/security.js';
import type { AppEnv } from '../src/config/env.js';
import type { Repository, SessionUser } from '../src/db/repository.js';

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
      const storage = new FilesystemMediaStorage(root, 'http://localhost:3001');
      const key = 'media/asset/card.webp';
      await storage.putObject(key, { body: Buffer.from('image'), contentType: 'image/webp', cacheControl: 'immutable' });
      expect(await storage.exists(key)).toBe(true);
      expect(await readFile(path.join(root, key), 'utf8')).toBe('image');
      expect(storage.getPublicUrl(key)).toBe('http://localhost:3001/media/asset/card.webp');
      expect(buildPublicMediaUrl('http://localhost:3001/media/', key)).toBe('http://localhost:3001/media/asset/card.webp');
      expect(storage.getPublicUrl(key)).not.toContain('/media/media/');
      await expect(storage.putObject('../escape.webp', { body: Buffer.from('x'), contentType: 'image/webp', cacheControl: 'immutable' })).rejects.toThrow('Unsafe media storage key');
      await expect(storage.putObject('media\\asset\\card.webp', { body: Buffer.from('x'), contentType: 'image/webp', cacheControl: 'immutable' })).rejects.toThrow('Unsafe media storage key');
    } finally { await rm(root, { recursive: true, force: true }); }
  });
});

it('exposes the exact management media route contract and accepts injected storage', async () => {
  const storage: MediaStorage = { putObject: async () => {}, deleteObject: async () => {}, exists: async () => true, getPublicUrl: (key) => `https://cdn.test/${key}`, stream: async () => ({ stream: Readable.from('image'), contentType: 'image/webp' }) };
  expect(storage.getPublicUrl('media/test/card.webp')).toBe('https://cdn.test/media/test/card.webp');
  expect('/api/manage/media/images/:id').toContain('/api/manage/media/images');
});

it('serves local development media with a public cross-origin resource policy', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'loning-static-media-'));
  try {
    const image = await sharp({ create: { width: 32, height: 24, channels: 3, background: '#155034' } }).webp().toBuffer();
    await mkdir(path.join(root, 'media', 'asset'), { recursive: true });
    await writeFile(path.join(root, 'media', 'asset', 'card.webp'), image);
    await writeFile(path.join(root, 'fixture.webp'), image);
    const env: AppEnv = { DATABASE_URL: 'postgresql://test:test@localhost/test', PORT: 3001, HOST: '127.0.0.1', CORS_ORIGIN: 'http://localhost:3000', NODE_ENV: 'development', SESSION_TTL_HOURS: 2, SESSION_RETENTION_DAYS: 30, SESSION_COOKIE_NAME: 'loning_session', LOGIN_MAX_ATTEMPTS: 3, LOGIN_LOCKOUT_MINUTES: 10, LOGIN_RATE_LIMIT_MAX: 10, LOGIN_RATE_LIMIT_WINDOW: '1 minute', RATE_LIMIT_MAX: 100, TRUST_PROXY: false, COOKIE_SECURE: false, MEDIA_STORAGE_DRIVER: 'filesystem', MEDIA_FILESYSTEM_ROOT: root, MEDIA_PUBLIC_BASE_URL: 'http://localhost:3001' };
    const app = await buildApp(env, {} as Repository);

    const canonical = await app.inject('/media/asset/card.webp');
    expect(canonical.statusCode).toBe(200);
    expect(canonical.headers['content-type']).toMatch(/^image\/webp/);
    expect((await sharp(canonical.rawPayload).metadata())).toMatchObject({ width: 32, height: 24, format: 'webp' });
    expect(canonical.headers['access-control-allow-origin']).toBe('http://localhost:3000');
    expect(canonical.headers['cross-origin-resource-policy']).toBe('cross-origin');
    expect(canonical.headers['cache-control']).toBe('public, max-age=3600');

    const oldPublicUrl = await app.inject('/media/media/asset/card.webp');
    expect(oldPublicUrl.statusCode).toBe(200);
    expect((await sharp(oldPublicUrl.rawPayload).metadata()).format).toBe('webp');

    const legacyKey = await app.inject('/media/fixture.webp?mode=external');
    expect(legacyKey.statusCode).toBe(200);
    expect(legacyKey.headers['content-type']).toMatch(/^image\/webp/);

    expect((await app.inject('/media/missing.webp')).statusCode).toBe(404);
    const unsafePaths = [
      '/media/',
      '/media/../.env',
      '/media/%2e%2e/.env',
      '/media/%252e%252e/.env',
      '/media/folder%2fsecret.webp',
      '/media/folder%5csecret.webp',
      '/media/folder\\secret.webp',
      '/media/file.webp%00',
      '/media/.hidden',
      `/media/${'a'.repeat(513)}.webp`,
    ];
    for (const unsafePath of unsafePaths) {
      const rejected = await app.inject(unsafePath);
      expect([400, 403, 404]).toContain(rejected.statusCode);
      expect(rejected.body).not.toMatch(/bucket|filesystem|endpoint|stack|\.env/i);
    }

    await app.close();
  } finally { await rm(root, { recursive: true, force: true }); }
});

const uploadOrigin = 'http://localhost:3000';
const uploadOwner: SessionUser = { id: '10000000-0000-4000-8000-000000000001', username: 'media-owner', displayName: 'Media Owner', role: 'pelaku_umkm', isActive: true, mustChangePassword: false };
const uploadEnv: AppEnv = { DATABASE_URL: '', PORT: 3001, HOST: 'localhost', CORS_ORIGIN: uploadOrigin, NODE_ENV: 'test', SESSION_TTL_HOURS: 2, SESSION_RETENTION_DAYS: 30, SESSION_COOKIE_NAME: 'loning_session', LOGIN_MAX_ATTEMPTS: 3, LOGIN_LOCKOUT_MINUTES: 10, LOGIN_RATE_LIMIT_MAX: 10, LOGIN_RATE_LIMIT_WINDOW: '1 minute', RATE_LIMIT_MAX: 100, TRUST_PROXY: false, COOKIE_SECURE: false, MEDIA_PUBLIC_BASE_URL: 'http://localhost:3001' };
const uploadSecurity: Security = { hashPassword: async value => value, verifyPassword: async () => true, token: () => 'token', hashToken: value => `hash:${value}` };

function multipart(buffer: Buffer) {
  const boundary = '----loning-media-regression-boundary';
  return {
    payload: Buffer.concat([
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="fresh-audit.jpg"\r\nContent-Type: image/jpeg\r\n\r\n`),
      buffer,
      Buffer.from(`\r\n--${boundary}--\r\n`),
    ]),
    contentType: `multipart/form-data; boundary=${boundary}`,
  };
}

function uploadState(options: { failStorage?: boolean; failDatabase?: boolean } = {}) {
  const objects = new Map<string, StoredObject>();
  const deleted: string[] = [];
  const created: Array<Record<string, unknown>> = [];
  const storage: MediaStorage = {
    putObject: async (key, object) => {
      if (options.failStorage) throw new Error('simulated storage outage');
      objects.set(key, object);
    },
    deleteObject: async key => { deleted.push(key); objects.delete(key); },
    exists: async key => objects.has(key),
    getPublicUrl: key => buildPublicMediaUrl(uploadEnv.MEDIA_PUBLIC_BASE_URL!, key),
    stream: async key => {
      const object = objects.get(key);
      if (!object) throw Object.assign(new Error('missing'), { code: 'ENOENT' });
      return { stream: Readable.from(object.body), contentType: object.contentType, contentLength: object.body.length, cacheControl: object.cacheControl };
    },
  };
  const repository = {
    findSession: async (tokenHash: string) => ['hash:session', 'hash:bearer'].includes(tokenHash) ? { sessionId: '20000000-0000-4000-8000-000000000001', csrfTokenHash: 'hash:csrf', user: uploadOwner } : undefined,
    revokeSession: async () => {},
    transaction: async (operation: (tx: Repository) => Promise<unknown>) => {
      if (options.failDatabase) throw new Error('simulated database outage');
      return operation(repository);
    },
    createMediaAsset: async (asset: Record<string, unknown>) => { created.push(asset); return asset; },
    addAudit: async () => {},
  } as unknown as Repository;
  return { storage, repository, objects, deleted, created };
}

async function injectUpload(app: Awaited<ReturnType<typeof buildApp>>, image: Buffer, auth: 'cookie' | 'bearer' = 'cookie') {
  const body = multipart(image);
  return app.inject({
    method: 'POST', url: '/api/manage/media/images', payload: body.payload,
    headers: { origin: uploadOrigin, 'x-csrf-token': 'csrf', 'content-type': body.contentType, ...(auth === 'cookie' ? { cookie: 'loning_session=session' } : { authorization: 'Bearer bearer' }) },
  });
}

describe('authenticated media upload route', () => {
  it('enforces CSRF, accepts cookie and bearer auth, persists metadata, and serves decodable canonical derivatives', async () => {
    const state = uploadState();
    let sequence = 0;
    const ids = ['30000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000002'];
    const app = await buildApp(uploadEnv, state.repository, { security: uploadSecurity, storage: state.storage, id: () => ids[sequence++] });
    const jpeg = await sharp({ create: { width: 96, height: 64, channels: 3, background: '#155034' } }).jpeg().toBuffer();
    const body = multipart(jpeg);
    const withoutCsrf = await app.inject({ method: 'POST', url: '/api/manage/media/images', headers: { origin: uploadOrigin, cookie: 'loning_session=session', 'content-type': body.contentType }, payload: body.payload });
    expect(withoutCsrf.statusCode).toBe(403);
    expect(withoutCsrf.json().error.code).toBe('CSRF_INVALID');

    for (const auth of ['cookie', 'bearer'] as const) {
      const response = await injectUpload(app, jpeg, auth);
      expect(response.statusCode).toBe(201);
      const asset = response.json().data;
      expect(asset.imageUrl).toBe(`http://localhost:3001/media/${asset.id}/card.webp`);
      expect(asset.thumbnailUrl).toBe(`http://localhost:3001/media/${asset.id}/thumbnail.webp`);
      expect(asset.imageUrl).not.toContain('/media/media/');
      expect(state.created.at(-1)).toMatchObject({ id: asset.id, createdByUserId: uploadOwner.id, cardStorageKey: `media/${asset.id}/card.webp`, thumbnailStorageKey: `media/${asset.id}/thumbnail.webp`, outputMimeType: 'image/webp' });
      for (const url of [asset.imageUrl, asset.thumbnailUrl]) {
        const served = await app.inject(new URL(url).pathname);
        expect(served.statusCode).toBe(200);
        expect(served.headers['content-type']).toMatch(/^image\/webp/);
        const metadata = await sharp(served.rawPayload).metadata();
        expect(metadata.format).toBe('webp');
        expect(metadata.width).toBeGreaterThan(0);
        expect(metadata.height).toBeGreaterThan(0);
      }
    }
    expect([...state.objects.keys()]).toHaveLength(4);
    await app.close();
  });

  it('returns 503 and leaves no objects when derivative storage fails', async () => {
    const state = uploadState({ failStorage: true });
    const id = '30000000-0000-4000-8000-000000000003';
    const app = await buildApp(uploadEnv, state.repository, { security: uploadSecurity, storage: state.storage, id: () => id });
    const jpeg = await sharp({ create: { width: 32, height: 32, channels: 3, background: '#155034' } }).jpeg().toBuffer();
    const response = await injectUpload(app, jpeg);
    expect(response.statusCode).toBe(503);
    expect(response.json().error.code).toBe('MEDIA_STORAGE_ERROR');
    expect(state.objects.size).toBe(0);
    expect(state.deleted).toEqual([`media/${id}/card.webp`, `media/${id}/thumbnail.webp`]);
    await app.close();
  });

  it('deletes both derivatives when the database transaction fails', async () => {
    const state = uploadState({ failDatabase: true });
    const id = '30000000-0000-4000-8000-000000000004';
    const app = await buildApp(uploadEnv, state.repository, { security: uploadSecurity, storage: state.storage, id: () => id });
    const jpeg = await sharp({ create: { width: 32, height: 32, channels: 3, background: '#155034' } }).jpeg().toBuffer();
    const response = await injectUpload(app, jpeg);
    expect(response.statusCode).toBe(500);
    expect(state.objects.size).toBe(0);
    expect(state.deleted).toEqual([`media/${id}/card.webp`, `media/${id}/thumbnail.webp`]);
    await app.close();
  });
});
