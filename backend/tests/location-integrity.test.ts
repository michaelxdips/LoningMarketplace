import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { LOCATION_CONSTRAINTS, formatLocationIntegrityFailures } from '../src/db/location-integrity.js';

const backendDirectory = resolve(import.meta.dirname, '..');

describe('business location runtime integrity', () => {
  it('declares the three exact constraint names', () => {
    expect(LOCATION_CONSTRAINTS).toEqual(['umkms_location_pair_check', 'umkms_latitude_range_check', 'umkms_longitude_range_check']);
  });

  it('checks persisted partial pairs, ranges, column types, and validated constraint definitions', async () => {
    const source = await readFile(resolve(backendDirectory, 'src/db/location-integrity.ts'), 'utf8');
    for (const check of [
      'partial coordinate pairs', 'latitude outside range', 'longitude outside range',
      'latitude column numeric(9,6) nullable', 'longitude column numeric(9,6) nullable',
      'umkms_location_pair_check definition', 'umkms_latitude_range_check definition', 'umkms_longitude_range_check definition',
    ]) expect(source).toContain(check);
    expect(source).toContain('pg_get_constraintdef');
    expect(source).toContain('convalidated');
    expect(source).toContain('numeric_precision = 9');
    expect(source).toContain('numeric_scale = 6');
    expect(source).toContain('assertBusinessLocationIntegrity');
    // rounding/serialization belong to the domain module, not the integrity module
    expect(source).not.toContain('Math.round');
    expect(source).not.toContain('parsePgNumeric');
  });

  it('formats startup failures clearly', () => {
    expect(formatLocationIntegrityFailures([{ check: 'umkms_location_pair_check', failures: 1 }])).toBe('umkms_location_pair_check=1');
  });

  it('wires assertion into migration startup after assertPublicIntegrity and the DB audit', async () => {
    const [migrate, audit] = await Promise.all([
      readFile(resolve(backendDirectory, 'src/db/migrate.ts'), 'utf8'),
      readFile(resolve(backendDirectory, 'src/scripts/db-audit.ts'), 'utf8'),
    ]);
    expect(migrate).toMatch(/assertPublicIntegrity[\s\S]*assertBusinessLocationIntegrity/);
    expect(migrate).toContain('0010_umkm_business_location');
    expect(audit).toContain('collectLocationIntegrityFailures');
    // published UMKMs may legally keep null coordinates: no check forbids that state
    const integrity = await readFile(resolve(backendDirectory, 'src/db/location-integrity.ts'), 'utf8');
    expect(integrity).not.toMatch(/publication_status\s*=\s*'published'[\s\S]{0,120}IS NOT NULL/);
  });
});
