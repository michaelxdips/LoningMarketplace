import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const drizzleDirectory = resolve(import.meta.dirname, '../drizzle');
const journalPath = resolve(drizzleDirectory, 'meta/_journal.json');
const backendDirectory = resolve(import.meta.dirname, '..');

const migrationFiles = async () => (await readdir(drizzleDirectory)).filter((file) => /^000[89]_.*\.sql$/.test(file));

describe('public integrity migrations', () => {
  it('keeps 0008 historical and registers one forward repair after it', async () => {
    const files = await migrationFiles();
    expect(files).toEqual(['0008_finalize_public_integrity.sql', '0009_repair_public_integrity.sql']);

    const journal = JSON.parse(await readFile(journalPath, 'utf8')) as { entries: Array<{ idx: number; tag: string }> };
    const indexes = journal.entries.map(({ idx }) => idx);
    const tags = journal.entries.map(({ tag }) => tag);
    expect(new Set(indexes).size).toBe(indexes.length);
    expect(new Set(tags).size).toBe(tags.length);
    expect(tags.indexOf('0008_finalize_public_integrity')).toBe(tags.indexOf('0007_public_slugs') + 1);
    expect(journal.entries.find(({ tag }) => tag === '0008_finalize_public_integrity')?.idx).toBe(8);
    expect(journal.entries.find(({ tag }) => tag === '0009_repair_public_integrity')?.idx).toBe(9);
  });

  it('contains the required non-destructive preflight checks', async () => {
    const [file] = await migrationFiles();
    const sql = await readFile(resolve(drizzleDirectory, file!), 'utf8');

    expect(sql).toMatch(/FROM "products"[\s\S]*"slug" IS NOT NULL[\s\S]*btrim\("slug"\) <> ''[\s\S]*GROUP BY "slug"[\s\S]*HAVING count\(\*\) > 1[\s\S]*Duplicate product slugs detected/i);
    expect(sql).toMatch(/FROM "umkms"[\s\S]*"slug" IS NOT NULL[\s\S]*btrim\("slug"\) <> ''[\s\S]*GROUP BY "slug"[\s\S]*HAVING count\(\*\) > 1[\s\S]*Duplicate UMKM slugs detected/i);
    expect(sql).toMatch(/FROM "umkms"[\s\S]*"phone" !~ '\^628\[0-9\]\{7,12\}\$'[\s\S]*Invalid WhatsApp contacts detected/i);
    expect(sql).toMatch(/LIMIT 10/i);
    expect(sql).not.toMatch(/\b(?:DELETE|TRUNCATE|UPDATE|INSERT)\b/i);
    expect(sql).not.toMatch(/\bTODO\b|placeholder|dummy/i);
    expect(sql).not.toMatch(/^\s*SELECT\s+1\s*;?\s*$/im);
  });

  it('enforces the final slug and WhatsApp schema contract', async () => {
    const [file] = await migrationFiles();
    const sql = await readFile(resolve(drizzleDirectory, file!), 'utf8');
    expect(sql).toMatch(/ALTER TABLE "products" ALTER COLUMN "slug" SET NOT NULL/i);
    expect(sql).toMatch(/ALTER TABLE "umkms" ALTER COLUMN "slug" SET NOT NULL/i);
    expect(sql).toMatch(/products_slug_nonempty_check[\s\S]*btrim\("slug"\) <> ''/i);
    expect(sql).toMatch(/umkms_slug_nonempty_check[\s\S]*btrim\("slug"\) <> ''/i);
    expect(sql).toMatch(/CREATE UNIQUE INDEX IF NOT EXISTS "products_slug_unique" ON "products" \("slug"\)/i);
    expect(sql).toMatch(/CREATE UNIQUE INDEX IF NOT EXISTS "umkms_slug_unique" ON "umkms" \("slug"\)/i);
    expect(sql).toMatch(/VALIDATE CONSTRAINT "umkms_phone_normalized_check"/i);
    expect(sql).toMatch(/VALIDATE CONSTRAINT "umkms_published_phone_ready_check"/i);
  });

  it('keeps historical migrations content unchanged across checkout line endings', async () => {
    const hashes = await Promise.all(['0005_trusted_inquiry.sql', '0007_public_slugs.sql'].map(async (file) => {
      const canonicalContent = (await readFile(resolve(drizzleDirectory, file), 'utf8')).replace(/\r\n?/g, '\n');
      return createHash('sha256').update(canonicalContent, 'utf8').digest('hex');
    }));
    expect(hashes).toEqual([
      'e7069badcc4e6a1105edc5c9ea70cee7730b974e0e9a9d1a748339848582d1c4',
      '1f5e22d2eb0f428ca263296ef2d20b00435d5f927fa5f1cc7f31e753ae985511',
    ]);
  });

  it('wires preparation, final-state assertion, schema alignment, audit checks, and runtime fixtures', async () => {
    const [migrate, schema, audit, integrity, harness] = await Promise.all([
      readFile(resolve(backendDirectory, 'src/db/migrate.ts'), 'utf8'),
      readFile(resolve(backendDirectory, 'src/db/schema.ts'), 'utf8'),
      readFile(resolve(backendDirectory, 'src/scripts/db-audit.ts'), 'utf8'),
      readFile(resolve(backendDirectory, 'src/db/public-integrity.ts'), 'utf8'),
      readFile(resolve(backendDirectory, '../scripts/run-isolated.mjs'), 'utf8'),
    ]);
    expect(migrate).toMatch(/preparePublicIntegrity[\s\S]*0008_finalize_public_integrity[\s\S]*assertPublicIntegrity/);
    expect(schema).toMatch(/umkms_phone_normalized_check[\s\S]*\^628\[0-9\]\{7,12\}\$/);
    expect(schema).toMatch(/umkms_slug_nonempty_check[\s\S]*products_slug_nonempty_check/);
    expect(audit).toContain('collectPublicIntegrityFailures');
    for (const check of ['null product slugs', 'empty product slugs', 'duplicate product slugs', 'product slugs longer than 96', 'null UMKM slugs', 'empty UMKM slugs', 'duplicate UMKM slugs', 'UMKM slugs longer than 96', 'invalid WhatsApp contacts', 'published UMKMs with invalid contacts', 'products_slug_unique', 'umkms_slug_unique', 'umkms_phone_normalized_check']) {
      expect(integrity).toContain(check);
    }
    for (const scenario of ['null and empty slugs', 'Unicode and collision fallback', 'failure after committed preparation', 'preparation persists after migration failure', 'migration 0008 remains unrecorded after failure', 'recovery rerun preserves canonical slugs', 'duplicate product slug refusal', 'duplicate UMKM slug refusal', 'invalid WhatsApp refusal', 'idempotent rerun']) {
      expect(harness).toContain(scenario);
    }
  });
});
