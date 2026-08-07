import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseEnv } from '../src/config/env.js';

const repositoryRoot = resolve(import.meta.dirname, '../..');
const readRepositoryFile = (path: string) => readFile(resolve(repositoryRoot, path), 'utf8');

function renderEnvironmentEntry(source: string, key: string) {
  const block = source.match(new RegExp(`^\\s*- key: ${key}\\r?\\n((?:\\s{8,}[^\\r\\n]+\\r?\\n?)*)`, 'm'))?.[1] ?? '';
  return {
    value: block.match(/^\s+value: ([^\r\n]+)$/m)?.[1]?.trim(),
    sync: block.match(/^\s+sync: (true|false)$/m)?.[1],
  };
}

const productionS3Environment = (overrides: NodeJS.ProcessEnv = {}): NodeJS.ProcessEnv => ({
  NODE_ENV: 'production',
  DATABASE_URL: 'postgresql://test:password@db.example.test/loning',
  CORS_ORIGIN: 'https://app.example.test',
  PUBLIC_SITE_URL: 'https://app.example.test',
  COOKIE_SECURE: 'true',
  MEDIA_STORAGE_DRIVER: 's3',
  MEDIA_PUBLIC_BASE_URL: 'https://media.example.test',
  S3_BUCKET: 'loning-test-media',
  S3_REGION: 'ap-southeast-1',
  ...overrides,
});

describe('deployment configuration', () => {
  it('uses the public API health route on Render', async () => {
    const render = await readRepositoryFile('render.yaml');

    expect(render).toMatch(/^\s*healthCheckPath: \/api\/health$/m);
  });

  it('migrates without seed or bootstrap on deployment restart and keeps automatic deploy disabled', async () => {
    const render = await readRepositoryFile('render.yaml');
    expect(render).toMatch(/^\s*startCommand: npm run db:migrate --workspace=backend && npm start --workspace=backend$/m);
    expect(render).not.toMatch(/^startCommand:.*(?:db:seed|db:bootstrap-admin|admin:create)/m);
    expect(render).toMatch(/^\s*autoDeploy: (?:true|false)$/m);
  });

  it('declares the complete Render S3 contract without literal credentials', async () => {
    const render = await readRepositoryFile('render.yaml');
    const requiredExternalValues = ['DATABASE_URL', 'CORS_ORIGIN', 'MEDIA_PUBLIC_BASE_URL', 'S3_BUCKET', 'S3_REGION'];
    const optionalExternalValues = ['S3_ENDPOINT', 'S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY'];

    expect(renderEnvironmentEntry(render, 'NODE_ENV').value).toBe('production');
    expect(renderEnvironmentEntry(render, 'MEDIA_STORAGE_DRIVER').value).toBe('s3');
    expect(renderEnvironmentEntry(render, 'MEDIA_STORAGE_DRIVER').value).not.toBe('filesystem');
    for (const key of [...requiredExternalValues, ...optionalExternalValues]) {
      expect(renderEnvironmentEntry(render, key)).toEqual({ value: undefined, sync: 'false' });
    }
    expect(renderEnvironmentEntry(render, 'S3_FORCE_PATH_STYLE').value).toBe('"false"');
    expect(render).not.toMatch(/^\s*- key: MEDIA_FILESYSTEM_ROOT\s*$/m);
  });

  it('accepts a valid production S3 environment using the real parser', () => {
    const parsed = parseEnv(productionS3Environment());

    expect(parsed).toMatchObject({
      NODE_ENV: 'production',
      COOKIE_SECURE: true,
      MEDIA_STORAGE_DRIVER: 's3',
      MEDIA_PUBLIC_BASE_URL: 'https://media.example.test',
      S3_BUCKET: 'loning-test-media',
      S3_REGION: 'ap-southeast-1',
    });
  });

  it.each([
    ['filesystem storage', { MEDIA_STORAGE_DRIVER: 'filesystem' }, 'MEDIA_STORAGE_DRIVER must be s3 in production'],
    ['missing bucket', { S3_BUCKET: undefined }, 'S3_BUCKET and S3_REGION are required for S3 storage'],
    ['missing region', { S3_REGION: undefined }, 'S3_BUCKET and S3_REGION are required for S3 storage'],
    ['missing public media URL', { MEDIA_PUBLIC_BASE_URL: undefined }, 'MEDIA_PUBLIC_BASE_URL is required in production'],
    ['invalid public media URL', { MEDIA_PUBLIC_BASE_URL: 'not-a-url' }, 'Invalid environment configuration'],
    ['unpaired access key', { S3_ACCESS_KEY_ID: 'test-access-key', S3_SECRET_ACCESS_KEY: undefined }, 'Both S3 credential fields must be provided together'],
    ['unpaired secret key', { S3_ACCESS_KEY_ID: undefined, S3_SECRET_ACCESS_KEY: 'test-secret-key' }, 'Both S3 credential fields must be provided together'],
  ])('rejects %s using the real parser', (_name, overrides, message) => {
    expect(() => parseEnv(productionS3Environment(overrides))).toThrow(message);
  });

  it('allows omitted credentials for the AWS default credential provider chain', () => {
    const parsed = parseEnv(productionS3Environment({ S3_ACCESS_KEY_ID: undefined, S3_SECRET_ACCESS_KEY: undefined }));

    expect(parsed.S3_ACCESS_KEY_ID).toBeUndefined();
    expect(parsed.S3_SECRET_ACCESS_KEY).toBeUndefined();
  });
});
