import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const drizzleDirectory = resolve(import.meta.dirname, '../drizzle');
const journalPath = resolve(drizzleDirectory, 'meta/_journal.json');
const backendDirectory = resolve(import.meta.dirname, '..');

const canonical = async (file: string) => (await readFile(resolve(drizzleDirectory, file), 'utf8')).replace(/\r\n?/g, '\n');

describe('business location migration 0010', () => {
  it('registers 0010 after 0009 in the journal without touching history', async () => {
    const files = (await readdir(drizzleDirectory)).filter((file) => /^00(0[89]|10)_.*\.sql$/.test(file));
    expect(files).toEqual(['0008_finalize_public_integrity.sql', '0009_repair_public_integrity.sql', '0010_umkm_business_location.sql']);

    const journal = JSON.parse(await readFile(journalPath, 'utf8')) as { entries: Array<{ idx: number; tag: string }> };
    const indexes = journal.entries.map(({ idx }) => idx);
    const tags = journal.entries.map(({ tag }) => tag);
    expect(new Set(indexes).size).toBe(indexes.length);
    expect(tags.indexOf('0010_umkm_business_location')).toBe(tags.indexOf('0009_repair_public_integrity') + 1);
    expect(journal.entries.find(({ tag }) => tag === '0010_umkm_business_location')?.idx).toBe(10);
    expect(tags.slice(0, 10)).toEqual([
      '0000_great_frog_thor', '0001_white_paper_doll', '0002_keen_edwin_jarvis', '0003_workable_captain_cross',
      '0004_auth_identifier_roles', '0005_trusted_inquiry', '0006_direct_route_event_sources', '0007_public_slugs',
      '0008_finalize_public_integrity', '0009_repair_public_integrity',
    ]);
  });

  it('adds only nullable numeric(9,6) coordinate columns without backfill', async () => {
    const sql = await canonical('0010_umkm_business_location.sql');
    expect(sql).toMatch(/ALTER TABLE "umkms" ADD COLUMN "latitude" numeric\(9,6\)/i);
    expect(sql).toMatch(/ALTER TABLE "umkms" ADD COLUMN "longitude" numeric\(9,6\)/i);
    expect(sql).not.toMatch(/numeric\(9,6\)\s*NOT NULL/i);
    expect(sql).not.toMatch(/\b(?:UPDATE|INSERT|DELETE|TRUNCATE|DROP)\b/i);
    expect((sql.match(/ADD COLUMN/gi) ?? []).length).toBe(2);
  });

  it('declares the three exact check constraints with required semantics', async () => {
    const sql = await canonical('0010_umkm_business_location.sql');
    expect(sql).toMatch(/ADD CONSTRAINT "umkms_location_pair_check" CHECK \(\s*\("latitude" IS NULL AND "longitude" IS NULL\)\s*OR\s*\("latitude" IS NOT NULL AND "longitude" IS NOT NULL\)\s*\)/i);
    expect(sql).toMatch(/ADD CONSTRAINT "umkms_latitude_range_check" CHECK \(\s*"latitude" IS NULL\s*OR "latitude" BETWEEN -90 AND 90\s*\)/i);
    expect(sql).toMatch(/ADD CONSTRAINT "umkms_longitude_range_check" CHECK \(\s*"longitude" IS NULL\s*OR "longitude" BETWEEN -180 AND 180\s*\)/i);
  });

  it('aligns the Drizzle schema with columns and exact constraint names', async () => {
    const schema = await readFile(resolve(backendDirectory, 'src/db/schema.ts'), 'utf8');
    expect(schema).toMatch(/numeric\('latitude', \{ precision: 9, scale: 6 \}\)/);
    expect(schema).toMatch(/numeric\('longitude', \{ precision: 9, scale: 6 \}\)/);
    for (const name of ['umkms_location_pair_check', 'umkms_latitude_range_check', 'umkms_longitude_range_check']) expect(schema).toContain(name);
  });

  it('keeps historical migrations 0005-0009 content unchanged', async () => {
    const hashes = await Promise.all([
      '0005_trusted_inquiry.sql', '0006_direct_route_event_sources.sql', '0007_public_slugs.sql',
      '0008_finalize_public_integrity.sql', '0009_repair_public_integrity.sql',
    ].map(async (file) => createHash('sha256').update(await canonical(file), 'utf8').digest('hex')));
    expect(hashes).toEqual([
      'e7069badcc4e6a1105edc5c9ea70cee7730b974e0e9a9d1a748339848582d1c4',
      'cc244ac3cc9f40640b3190a9fe9eb035007888282498e6d54698a84b1b82355a',
      '1f5e22d2eb0f428ca263296ef2d20b00435d5f927fa5f1cc7f31e753ae985511',
      '4b0f0d02af74e6206da91396b6677fb0ae546e36cbf888ffe093f705e5309021',
      '8e3b8d88dedb21345682f62fc7e4a7f68be96f851eb1911d9e11340126b6773e',
    ]);
  });
});
