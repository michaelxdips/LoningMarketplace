import { createReadStream } from 'node:fs';
import { mkdir, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { Readable } from 'node:stream';
import { DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client, type S3ClientConfig } from '@aws-sdk/client-s3';
import type { MediaConfig } from '../config/env.js';

export type StoredObject = { body: Buffer; contentType: string; cacheControl: string };
export type MediaStream = { stream: Readable; contentType?: string; contentLength?: number; etag?: string; cacheControl?: string };
export interface MediaStorage {
  putObject(key: string, object: StoredObject): Promise<void>;
  deleteObject(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  getPublicUrl(key: string): string;
  /** Open a read stream for the object. Must reject (not return null) when the object is missing. */
  stream(key: string): Promise<MediaStream>;
}

// Canonical object-key rule: lowercase path segments, no traversal, no absolute paths,
// no null bytes, ends with an extension. Max length guards against abuse.
const safeKey = (key: string) => {
  if (key.length > 512 || !/^[a-z0-9][a-z0-9/_-]*\.[a-z0-9]+$/.test(key) || key.includes('..') || key.includes('\0') || path.isAbsolute(key)) throw new Error('Unsafe media storage key');
  return key;
};
const baseUrl = (value: string) => value.replace(/\/+$/, '').replace(/\/media$/, '');

// Canonical public URL builder. Object keys keep their media/ namespace in storage,
// while public URLs expose that namespace exactly once via the /media/* route.
// Transitional compatibility: a configured base ending in /media is normalized.
export const buildPublicMediaUrl = (publicBaseUrl: string, key: string) => {
  const publicKey = safeKey(key).replace(/^media\//, '');
  return `${baseUrl(publicBaseUrl)}/media/${publicKey.split('/').map(encodeURIComponent).join('/')}`;
};

export class FilesystemMediaStorage implements MediaStorage {
  readonly root: string;
  constructor(root: string, private readonly publicBaseUrl: string) { this.root = path.resolve(root); }
  private resolve(key: string) { const target = path.resolve(this.root, safeKey(key)); if (target !== this.root && !target.startsWith(`${this.root}${path.sep}`)) throw new Error('Unsafe media storage path'); return target; }
  async putObject(key: string, object: StoredObject) { const target = this.resolve(key); await mkdir(path.dirname(target), { recursive: true }); await writeFile(target, object.body, { flag: 'wx' }); }
  async deleteObject(key: string) { await rm(this.resolve(key), { force: true }); }
  async exists(key: string) { try { return (await stat(this.resolve(key))).isFile(); } catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false; throw error; } }
  getPublicUrl(key: string) { return buildPublicMediaUrl(this.publicBaseUrl, key); }
  async stream(key: string) { const target = this.resolve(key); const info = await stat(target); if (!info.isFile()) throw Object.assign(new Error('Media object not found'), { code: 'ENOENT' }); return { stream: createReadStream(target), contentLength: info.size }; }
}

export class S3MediaStorage implements MediaStorage {
  private readonly client: S3Client;
  constructor(private readonly bucket: string, private readonly publicBaseUrl: string, options: S3ClientConfig) { this.client = new S3Client(options); }
  async putObject(key: string, object: StoredObject) { await this.client.send(new PutObjectCommand({ Bucket: this.bucket, Key: safeKey(key), Body: object.body, ContentType: object.contentType, CacheControl: object.cacheControl })); }
  async deleteObject(key: string) { await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: safeKey(key) })); }
  async exists(key: string) { try { await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: safeKey(key) })); return true; } catch (error) { if (isNotFound(error)) return false; throw error; } }
  getPublicUrl(key: string) { return buildPublicMediaUrl(this.publicBaseUrl, key); }
  async get(key: string) { return this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: safeKey(key) })); }
  async stream(key: string): Promise<MediaStream> {
    try {
      const out = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: safeKey(key) }));
      return { stream: out.Body as Readable, contentType: out.ContentType, contentLength: out.ContentLength, etag: out.ETag, cacheControl: out.CacheControl };
    } catch (error) {
      if (isNotFound(error)) throw Object.assign(new Error('Media object not found'), { code: 'ENOENT' });
      throw error;
    }
  }
}

const isNotFound = (error: unknown) => {
  const status = (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode;
  const name = (error as { name?: string }).name;
  return status === 404 || name === 'NoSuchKey' || name === 'NotFound';
};

export function createMediaStorage(config: MediaConfig): MediaStorage {
  if (config.MEDIA_STORAGE_DRIVER === 'filesystem') return new FilesystemMediaStorage(config.MEDIA_FILESYSTEM_ROOT, config.MEDIA_PUBLIC_BASE_URL);
  const credentials = config.S3_ACCESS_KEY_ID && config.S3_SECRET_ACCESS_KEY ? { accessKeyId: config.S3_ACCESS_KEY_ID, secretAccessKey: config.S3_SECRET_ACCESS_KEY } : undefined;
  return new S3MediaStorage(config.S3_BUCKET!, config.MEDIA_PUBLIC_BASE_URL, { region: config.S3_REGION!, endpoint: config.S3_ENDPOINT, forcePathStyle: config.S3_FORCE_PATH_STYLE, credentials });
}
