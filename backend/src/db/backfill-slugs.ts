import { asc, eq, sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from './schema.js';
import { slugify, withCollisionSuffix } from '../lib/slug.js';

const allocate = (base: string, used: Set<string>) => { for (let attempt = 1; attempt <= 10_000; attempt += 1) { const candidate = withCollisionSuffix(base, attempt); if (!used.has(candidate)) { used.add(candidate); return candidate; } } throw new Error(`Unable to allocate slug for ${base}`); };

export async function backfillSlugs(db: PostgresJsDatabase<typeof schema>) {
  await db.transaction(async (tx) => {
    const umkms = await tx.select({ id: schema.umkms.id, name: schema.umkms.name, slug: schema.umkms.slug }).from(schema.umkms).orderBy(asc(schema.umkms.createdAt), asc(schema.umkms.id));
    const usedUmkm = new Set<string>();
    for (const row of umkms) { const slug = row.slug || allocate(slugify(row.name, 'umkm'), usedUmkm); usedUmkm.add(slug); if (row.slug !== slug) await tx.update(schema.umkms).set({ slug }).where(eq(schema.umkms.id, row.id)); }
    const products = await tx.select({ id: schema.products.id, name: schema.products.name, slug: schema.products.slug }).from(schema.products).orderBy(asc(schema.products.createdAt), asc(schema.products.id));
    const usedProduct = new Set<string>();
    for (const row of products) { const slug = row.slug || allocate(slugify(row.name, 'produk'), usedProduct); usedProduct.add(slug); if (row.slug !== slug) await tx.update(schema.products).set({ slug }).where(eq(schema.products.id, row.id)); }
    await tx.execute(sql`ALTER TABLE "umkms" ALTER COLUMN "slug" TYPE varchar(96)`);
    await tx.execute(sql`ALTER TABLE "products" ALTER COLUMN "slug" TYPE varchar(96)`);
    await tx.execute(sql`ALTER TABLE "umkms" ALTER COLUMN "slug" SET NOT NULL`);
    await tx.execute(sql`ALTER TABLE "products" ALTER COLUMN "slug" SET NOT NULL`);
    await tx.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS "umkms_slug_unique" ON "umkms" ("slug")`);
    await tx.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS "products_slug_unique" ON "products" ("slug")`);
  });
}
