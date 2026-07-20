import { createReadStream } from 'node:fs';
import { mkdir, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client, type S3ClientConfig } from '@aws-sdk/client-s3';
import type { MediaConfig } from '../config/env.js';

export type StoredObject = { body: Buffer; contentType: string; cacheControl: string };
export interface MediaStorage {
  putObject(key: string, object: StoredObject): Promise<void>;
  deleteObject(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  getPublicUrl(key: string): string;
}

const safeKey = (key: string) => {
  if (!/^[a-z0-9][a-z0-9/_-]*\.[a-z0-9]+$/.test(key) || key.includes('..') || path.isAbsolute(key)) throw new Error('Unsafe media storage key');
  return key;
};
const baseUrl = (value: string) => value.replace(/\/+$/, '');

export class FilesystemMediaStorage implements MediaStorage {
  readonly root: string;
  constructor(root: string, private readonly publicBaseUrl: string) { this.root = path.resolve(root); }
  private resolve(key: string) { const target = path.resolve(this.root, safeKey(key)); if (target !== this.root && !target.startsWith(`${this.root}${path.sep}`)) throw new Error('Unsafe media storage path'); return target; }
  async putObject(key: string, object: StoredObject) { const target = this.resolve(key); await mkdir(path.dirname(target), { recursive: true }); await writeFile(target, object.body, { flag: 'wx' }); }
  async deleteObject(key: string) { await rm(this.resolve(key), { force: true }); }
  async exists(key: string) { try { return (await stat(this.resolve(key))).isFile(); } catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false; throw error; } }
  getPublicUrl(key: string) { return `${baseUrl(this.publicBaseUrl)}/${safeKey(key).split('/').map(encodeURIComponent).join('/')}`; }
  stream(key: string) { return createReadStream(this.resolve(key)); }
}

export class S3MediaStorage implements MediaStorage {
  private readonly client: S3Client;
  constructor(private readonly bucket: string, private readonly publicBaseUrl: string, options: S3ClientConfig) { this.client = new S3Client(options); }
  async putObject(key: string, object: StoredObject) { await this.client.send(new PutObjectCommand({ Bucket: this.bucket, Key: safeKey(key), Body: object.body, ContentType: object.contentType, CacheControl: object.cacheControl })); }
  async deleteObject(key: string) { await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: safeKey(key) })); }
  async exists(key: string) { try { await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: safeKey(key) })); return true; } catch (error) { const status = (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode; if (status === 404) return false; throw error; } }
  getPublicUrl(key: string) { return `${baseUrl(this.publicBaseUrl)}/${safeKey(key).split('/').map(encodeURIComponent).join('/')}`; }
  async get(key: string) { return this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: safeKey(key) })); }
}

export function createMediaStorage(config: MediaConfig): MediaStorage {
  if (config.MEDIA_STORAGE_DRIVER === 'filesystem') return new FilesystemMediaStorage(config.MEDIA_FILESYSTEM_ROOT, config.MEDIA_PUBLIC_BASE_URL);
  const credentials = config.S3_ACCESS_KEY_ID && config.S3_SECRET_ACCESS_KEY ? { accessKeyId: config.S3_ACCESS_KEY_ID, secretAccessKey: config.S3_SECRET_ACCESS_KEY } : undefined;
  return new S3MediaStorage(config.S3_BUCKET!, config.MEDIA_PUBLIC_BASE_URL, { region: config.S3_REGION!, endpoint: config.S3_ENDPOINT, forcePathStyle: config.S3_FORCE_PATH_STYLE, credentials });
}
