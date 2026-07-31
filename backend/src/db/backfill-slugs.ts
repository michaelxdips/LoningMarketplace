import { asc, eq, sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { MigrationPreflightError } from '../errors/domain.js';
import { allocateAvailableSlug, slugify } from '../lib/slug.js';
import * as schema from './schema.js';

const PREFLIGHT_ID_LIMIT = 10;
type Database = PostgresJsDatabase<typeof schema>;
type EntityTable = 'products' | 'umkms';
type PreflightSummary = { count: number | string };
type PreflightId = { id: string };

export function formatMigrationPreflightError(message: string, count: number, ids: string[]): string {
  return `${message}: ${count} conflicting rows; IDs: ${ids.slice().sort().slice(0, PREFLIGHT_ID_LIMIT).join(', ')}`;
}

async function duplicateSlugSummary(tx: Database, table: EntityTable): Promise<{ count: number; ids: string[] }> {
  const countQuery = table === 'products'
    ? sql`SELECT count(*)::int AS count FROM products p INNER JOIN (SELECT slug FROM products WHERE slug IS NOT NULL AND btrim(slug) <> '' GROUP BY slug HAVING count(*) > 1) duplicates USING (slug)`
    : sql`SELECT count(*)::int AS count FROM umkms u INNER JOIN (SELECT slug FROM umkms WHERE slug IS NOT NULL AND btrim(slug) <> '' GROUP BY slug HAVING count(*) > 1) duplicates USING (slug)`;
  const idsQuery = table === 'products'
    ? sql`SELECT p.id::text AS id FROM products p INNER JOIN (SELECT slug FROM products WHERE slug IS NOT NULL AND btrim(slug) <> '' GROUP BY slug HAVING count(*) > 1) duplicates USING (slug) ORDER BY p.id LIMIT ${PREFLIGHT_ID_LIMIT}`
    : sql`SELECT u.id::text AS id FROM umkms u INNER JOIN (SELECT slug FROM umkms WHERE slug IS NOT NULL AND btrim(slug) <> '' GROUP BY slug HAVING count(*) > 1) duplicates USING (slug) ORDER BY u.id LIMIT ${PREFLIGHT_ID_LIMIT}`;
  const [countRows, idRows] = await Promise.all([tx.execute<PreflightSummary>(countQuery), tx.execute<PreflightId>(idsQuery)]);
  return { count: Number(countRows[0]?.count ?? 0), ids: idRows.map(({ id }) => id) };
}

async function invalidPhoneSummary(tx: Database): Promise<{ count: number; ids: string[] }> {
  const [countRows, idRows] = await Promise.all([
    tx.execute<PreflightSummary>(sql`SELECT count(*)::int AS count FROM umkms WHERE phone !~ '^628[0-9]{7,12}$'`),
    tx.execute<PreflightId>(sql`SELECT id::text AS id FROM umkms WHERE phone !~ '^628[0-9]{7,12}$' ORDER BY id LIMIT ${PREFLIGHT_ID_LIMIT}`),
  ]);
  return { count: Number(countRows[0]?.count ?? 0), ids: idRows.map(({ id }) => id) };
}

async function assertPreflight(tx: Database): Promise<void> {
  const productDuplicates = await duplicateSlugSummary(tx, 'products');
  if (productDuplicates.count) throw new MigrationPreflightError(formatMigrationPreflightError('Duplicate product slugs detected', productDuplicates.count, productDuplicates.ids));

  const umkmDuplicates = await duplicateSlugSummary(tx, 'umkms');
  if (umkmDuplicates.count) throw new MigrationPreflightError(formatMigrationPreflightError('Duplicate UMKM slugs detected', umkmDuplicates.count, umkmDuplicates.ids));

  const invalidPhones = await invalidPhoneSummary(tx);
  if (invalidPhones.count) throw new MigrationPreflightError(formatMigrationPreflightError('Invalid WhatsApp contacts detected', invalidPhones.count, invalidPhones.ids));
}

async function backfillUMKMs(tx: Database): Promise<void> {
  const rows = await tx.select({ id: schema.umkms.id, name: schema.umkms.name, slug: schema.umkms.slug })
    .from(schema.umkms)
    .orderBy(asc(schema.umkms.createdAt), asc(schema.umkms.id));
  const used = new Set(rows.flatMap(({ slug }) => slug && slug.trim() ? [slug] : []));
  for (const row of rows) {
    if (row.slug?.trim()) continue;
    const slug = allocateAvailableSlug(slugify(row.name, 'umkm'), used);
    await tx.update(schema.umkms).set({ slug }).where(eq(schema.umkms.id, row.id));
  }
}

async function backfillProducts(tx: Database): Promise<void> {
  const rows = await tx.select({ id: schema.products.id, name: schema.products.name, slug: schema.products.slug })
    .from(schema.products)
    .orderBy(asc(schema.products.createdAt), asc(schema.products.id));
  const used = new Set(rows.flatMap(({ slug }) => slug && slug.trim() ? [slug] : []));
  for (const row of rows) {
    if (row.slug?.trim()) continue;
    const slug = allocateAvailableSlug(slugify(row.name, 'produk'), used);
    await tx.update(schema.products).set({ slug }).where(eq(schema.products.id, row.id));
  }
}

export async function preparePublicIntegrity(db: Database): Promise<void> {
  await db.transaction(async (tx) => {
    const transaction = tx as unknown as Database;
    await assertPreflight(transaction);
    await backfillUMKMs(transaction);
    await backfillProducts(transaction);
  });
}

export const backfillSlugs = preparePublicIntegrity;
