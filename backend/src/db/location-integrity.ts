import { sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type * as schema from './schema.js';

type Database = PostgresJsDatabase<typeof schema>;
export type LocationIntegrityFailure = { check: string; failures: number };
type IntegrityRow = { check: string; failures: number | string };

export const LOCATION_CONSTRAINTS = ['umkms_location_pair_check', 'umkms_latitude_range_check', 'umkms_longitude_range_check'] as const;

export const formatLocationIntegrityFailures = (failures: LocationIntegrityFailure[]): string =>
  failures.map(({ check, failures: count }) => `${check}=${count}`).join('; ');

const constraintPresence = LOCATION_CONSTRAINTS.map((name) => sql`
    UNION ALL SELECT ${name}, CASE WHEN EXISTS (
      SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid JOIN pg_namespace n ON n.oid = t.relnamespace
      WHERE n.nspname = 'public' AND t.relname = 'umkms' AND c.conname = ${name} AND c.convalidated
    ) THEN 0 ELSE 1 END`);

export async function collectLocationIntegrityFailures(db: Database): Promise<LocationIntegrityFailure[]> {
  const rows = await db.execute<IntegrityRow>(sql`
    SELECT 'partial coordinate pairs' AS check, count(*)::int AS failures FROM umkms
      WHERE (latitude IS NULL) <> (longitude IS NULL)
    UNION ALL SELECT 'latitude outside range', count(*)::int FROM umkms
      WHERE latitude IS NOT NULL AND latitude NOT BETWEEN -90 AND 90
    UNION ALL SELECT 'longitude outside range', count(*)::int FROM umkms
      WHERE longitude IS NOT NULL AND longitude NOT BETWEEN -180 AND 180
    UNION ALL SELECT 'latitude column numeric(9,6) nullable', CASE WHEN EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'umkms' AND column_name = 'latitude'
        AND is_nullable = 'YES' AND data_type = 'numeric' AND numeric_precision = 9 AND numeric_scale = 6
    ) THEN 0 ELSE 1 END
    UNION ALL SELECT 'longitude column numeric(9,6) nullable', CASE WHEN EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'umkms' AND column_name = 'longitude'
        AND is_nullable = 'YES' AND data_type = 'numeric' AND numeric_precision = 9 AND numeric_scale = 6
    ) THEN 0 ELSE 1 END
    UNION ALL SELECT 'umkms_location_pair_check definition', CASE WHEN EXISTS (
      SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid JOIN pg_namespace n ON n.oid = t.relnamespace
      WHERE n.nspname = 'public' AND t.relname = 'umkms' AND c.conname = 'umkms_location_pair_check' AND c.convalidated
        AND pg_get_constraintdef(c.oid) LIKE '%IS NULL%IS NULL%IS NOT NULL%IS NOT NULL%'
    ) THEN 0 ELSE 1 END
    UNION ALL SELECT 'umkms_latitude_range_check definition', CASE WHEN EXISTS (
      SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid JOIN pg_namespace n ON n.oid = t.relnamespace
      WHERE n.nspname = 'public' AND t.relname = 'umkms' AND c.conname = 'umkms_latitude_range_check' AND c.convalidated
        AND pg_get_constraintdef(c.oid) LIKE '%IS NULL%' AND pg_get_constraintdef(c.oid) LIKE '%-90%90%'
    ) THEN 0 ELSE 1 END
    UNION ALL SELECT 'umkms_longitude_range_check definition', CASE WHEN EXISTS (
      SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid JOIN pg_namespace n ON n.oid = t.relnamespace
      WHERE n.nspname = 'public' AND t.relname = 'umkms' AND c.conname = 'umkms_longitude_range_check' AND c.convalidated
        AND pg_get_constraintdef(c.oid) LIKE '%IS NULL%' AND pg_get_constraintdef(c.oid) LIKE '%-180%180%'
    ) THEN 0 ELSE 1 END
    ${sql.join(constraintPresence, sql``)}
  `);
  return rows.map((row) => ({ check: row.check, failures: Number(row.failures) })).filter(({ failures }) => failures > 0);
}

export async function assertBusinessLocationIntegrity(db: Database): Promise<void> {
  const failures = await collectLocationIntegrityFailures(db);
  if (failures.length) throw new Error(`Business location integrity assertion failed: ${formatLocationIntegrityFailures(failures)}`);
}
