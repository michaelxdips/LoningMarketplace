import { sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type * as schema from './schema.js';

type Database = PostgresJsDatabase<typeof schema>;
export type IntegrityFailure = { check: string; failures: number };
type IntegrityRow = { check: string; failures: number | string };

export const formatPublicIntegrityFailures = (failures: IntegrityFailure[]): string =>
  failures.map(({ check, failures: count }) => `${check}=${count}`).join('; ');

export async function collectPublicIntegrityFailures(db: Database): Promise<IntegrityFailure[]> {
  const rows = await db.execute<IntegrityRow>(sql`
    SELECT 'null product slugs' AS check, count(*)::int AS failures FROM products WHERE slug IS NULL
    UNION ALL SELECT 'empty product slugs', count(*)::int FROM products WHERE btrim(slug) = ''
    UNION ALL SELECT 'duplicate product slugs', count(*)::int FROM (SELECT slug FROM products WHERE slug IS NOT NULL AND btrim(slug) <> '' GROUP BY slug HAVING count(*) > 1) duplicates
    UNION ALL SELECT 'product slugs longer than 96', count(*)::int FROM products WHERE char_length(slug) > 96
    UNION ALL SELECT 'null UMKM slugs', count(*)::int FROM umkms WHERE slug IS NULL
    UNION ALL SELECT 'empty UMKM slugs', count(*)::int FROM umkms WHERE btrim(slug) = ''
    UNION ALL SELECT 'duplicate UMKM slugs', count(*)::int FROM (SELECT slug FROM umkms WHERE slug IS NOT NULL AND btrim(slug) <> '' GROUP BY slug HAVING count(*) > 1) duplicates
    UNION ALL SELECT 'UMKM slugs longer than 96', count(*)::int FROM umkms WHERE char_length(slug) > 96
    UNION ALL SELECT 'invalid WhatsApp contacts', count(*)::int FROM umkms WHERE phone !~ '^628[0-9]{7,12}$'
    UNION ALL SELECT 'published UMKMs with invalid contacts', count(*)::int FROM umkms WHERE publication_status = 'published' AND phone !~ '^628[0-9]{7,12}$'
    UNION ALL SELECT 'product slug column NOT NULL', CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'slug' AND is_nullable = 'NO' AND character_maximum_length = 96) THEN 0 ELSE 1 END
    UNION ALL SELECT 'UMKM slug column NOT NULL', CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'umkms' AND column_name = 'slug' AND is_nullable = 'NO' AND character_maximum_length = 96) THEN 0 ELSE 1 END
    UNION ALL SELECT 'products_slug_unique', CASE WHEN EXISTS (SELECT 1 FROM pg_class i JOIN pg_index x ON x.indexrelid = i.oid JOIN pg_class t ON t.oid = x.indrelid JOIN pg_namespace n ON n.oid = t.relnamespace JOIN pg_attribute a ON a.attrelid = t.oid AND a.attname = 'slug' AND a.attnum = x.indkey[0] WHERE n.nspname = 'public' AND t.relname = 'products' AND i.relname = 'products_slug_unique' AND x.indisunique AND x.indisvalid AND x.indpred IS NULL AND x.indnkeyatts = 1) THEN 0 ELSE 1 END
    UNION ALL SELECT 'umkms_slug_unique', CASE WHEN EXISTS (SELECT 1 FROM pg_class i JOIN pg_index x ON x.indexrelid = i.oid JOIN pg_class t ON t.oid = x.indrelid JOIN pg_namespace n ON n.oid = t.relnamespace JOIN pg_attribute a ON a.attrelid = t.oid AND a.attname = 'slug' AND a.attnum = x.indkey[0] WHERE n.nspname = 'public' AND t.relname = 'umkms' AND i.relname = 'umkms_slug_unique' AND x.indisunique AND x.indisvalid AND x.indpred IS NULL AND x.indnkeyatts = 1) THEN 0 ELSE 1 END
    UNION ALL SELECT 'products_slug_nonempty_check', CASE WHEN EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid JOIN pg_namespace n ON n.oid = t.relnamespace WHERE n.nspname = 'public' AND t.relname = 'products' AND c.conname = 'products_slug_nonempty_check' AND c.convalidated) THEN 0 ELSE 1 END
    UNION ALL SELECT 'umkms_slug_nonempty_check', CASE WHEN EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid JOIN pg_namespace n ON n.oid = t.relnamespace WHERE n.nspname = 'public' AND t.relname = 'umkms' AND c.conname = 'umkms_slug_nonempty_check' AND c.convalidated) THEN 0 ELSE 1 END
    UNION ALL SELECT 'umkms_phone_normalized_check', CASE WHEN EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid JOIN pg_namespace n ON n.oid = t.relnamespace WHERE n.nspname = 'public' AND t.relname = 'umkms' AND c.conname = 'umkms_phone_normalized_check' AND c.convalidated AND pg_get_constraintdef(c.oid) LIKE '%^628[0-9]{7,12}$%') THEN 0 ELSE 1 END
    UNION ALL SELECT 'umkms_published_phone_ready_check', CASE WHEN EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid JOIN pg_namespace n ON n.oid = t.relnamespace WHERE n.nspname = 'public' AND t.relname = 'umkms' AND c.conname = 'umkms_published_phone_ready_check' AND c.convalidated AND pg_get_constraintdef(c.oid) LIKE '%^628[0-9]{7,12}$%') THEN 0 ELSE 1 END
  `);
  return rows.map((row) => ({ check: row.check, failures: Number(row.failures) })).filter(({ failures }) => failures > 0);
}

export async function assertPublicIntegrity(db: Database): Promise<void> {
  const failures = await collectPublicIntegrityFailures(db);
  if (failures.length) throw new Error(`Database integrity assertion failed: ${formatPublicIntegrityFailures(failures)}`);
}
