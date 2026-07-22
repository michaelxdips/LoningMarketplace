import { sql } from 'drizzle-orm';
import { createDatabase } from '../db/client.js';
import { mediaAssets, products, umkms, users } from '../db/schema.js';

async function audit() {
  const database = createDatabase();
  try {
    const db = database.db;
    const umkmCount = Number((await db.select({ count: sql<number>`count(*)` }).from(umkms))[0].count);
    const productCount = Number((await db.select({ count: sql<number>`count(*)` }).from(products))[0].count);
    const userCount = Number((await db.select({ count: sql<number>`count(*)` }).from(users))[0].count);
    const mediaCount = Number((await db.select({ count: sql<number>`count(*)` }).from(mediaAssets))[0].count);
    const publishedCount = Number((await db.execute(sql`SELECT count(*) FROM products WHERE publication_status = 'published'`))[0].count);
    const draftCount = Number((await db.execute(sql`SELECT count(*) FROM products WHERE publication_status = 'draft'`))[0].count);
    const archivedCount = Number((await db.execute(sql`SELECT count(*) FROM products WHERE publication_status = 'archived'`))[0].count);
    const e2eUsers = Number((await db.execute(sql`SELECT count(*) FROM users WHERE email LIKE 'e2e-%'`))[0].count);
    const devUsers = Number((await db.execute(sql`SELECT count(*) FROM users WHERE email NOT LIKE 'e2e-%'`))[0].count);

    const orphanProducts = Number((await db.execute(sql`SELECT count(*) FROM products p LEFT JOIN umkms u ON p.umkm_id = u.id WHERE u.id IS NULL`))[0].count);
    const duplicateProductNames = (await db.execute(sql`SELECT name FROM products GROUP BY name HAVING count(*) > 1`)).length;
    const duplicateUmkmNames = (await db.execute(sql`SELECT name FROM umkms GROUP BY name HAVING count(*) > 1`)).length;
    const invalidStatus = Number((await db.execute(sql`SELECT count(*) FROM products WHERE publication_status NOT IN ('draft', 'published', 'archived')`))[0].count);
    const negativePrices = Number((await db.execute(sql`SELECT count(*) FROM products WHERE price < 0`))[0].count);
    const staleE2EProducts = Number((await db.execute(sql`SELECT count(*) FROM products WHERE name LIKE '[E2E]%' OR name LIKE 'E2E Test%'`))[0].count);
    const staleE2EUmkms = Number((await db.execute(sql`SELECT count(*) FROM umkms WHERE name LIKE 'E2E Test%'`))[0].count);
    const missingRequiredProduct = Number((await db.execute(sql`SELECT count(*) FROM products WHERE name = '' OR name IS NULL OR trim(name) = ''`))[0].count);
    const referencedMediaLifecycle = Number((await db.execute(sql`SELECT count(*) FROM media_assets m WHERE (m.orphaned_at IS NOT NULL OR m.deleted_at IS NOT NULL) AND (EXISTS (SELECT 1 FROM products p WHERE p.image_asset_id = m.id) OR EXISTS (SELECT 1 FROM umkms u WHERE u.image_asset_id = m.id))`))[0].count);
    const unreferencedWithoutLifecycle = Number((await db.execute(sql`SELECT count(*) FROM media_assets m WHERE m.orphaned_at IS NULL AND m.deleted_at IS NULL AND NOT EXISTS (SELECT 1 FROM products p WHERE p.image_asset_id = m.id) AND NOT EXISTS (SELECT 1 FROM umkms u WHERE u.image_asset_id = m.id)`))[0].count);
    const expiredOrphans = Number((await db.execute(sql`SELECT count(*) FROM media_assets m WHERE (m.orphaned_at IS NOT NULL OR m.deleted_at IS NOT NULL) AND COALESCE(m.orphaned_at, m.deleted_at) <= now() - interval '24 hours' AND NOT EXISTS (SELECT 1 FROM products p WHERE p.image_asset_id = m.id) AND NOT EXISTS (SELECT 1 FROM umkms u WHERE u.image_asset_id = m.id)`))[0].count);

    console.log('--- DATABASE AUDIT ---');
    console.log(`UMKMs: ${umkmCount}`); console.log(`Products: ${productCount}`);
    console.log(`Published: ${publishedCount}`); console.log(`Draft: ${draftCount}`); console.log(`Archived: ${archivedCount}`);
    console.log(`Users (Dev): ${devUsers}`); console.log(`Users (E2E): ${e2eUsers}`); console.log(`Users (Total): ${userCount}`); console.log(`Media Assets: ${mediaCount}`);
    console.log('--- INTEGRITY CHECKS ---');
    console.log(`Orphan Products: ${orphanProducts}`); console.log(`Duplicate Product Names: ${duplicateProductNames}`); console.log(`Duplicate UMKM Names: ${duplicateUmkmNames}`);
    console.log(`Invalid Product Statuses: ${invalidStatus}`); console.log(`Negative Prices: ${negativePrices}`); console.log(`Stale E2E Products: ${staleE2EProducts}`); console.log(`Stale E2E UMKMs: ${staleE2EUmkms}`); console.log(`Whitespace/Missing Product Names: ${missingRequiredProduct}`);
    console.log(`Referenced Media With Lifecycle Marker: ${referencedMediaLifecycle}`); console.log(`Unreferenced Media Without Lifecycle Marker: ${unreferencedWithoutLifecycle}`); console.log(`Expired Unreferenced Media: ${expiredOrphans}`);

    const failures = orphanProducts + duplicateProductNames + duplicateUmkmNames + invalidStatus + negativePrices + staleE2EProducts + staleE2EUmkms + missingRequiredProduct + referencedMediaLifecycle + unreferencedWithoutLifecycle + expiredOrphans;
    console.log(`Audit Status: ${failures === 0 ? 'PASS' : 'FAIL'}`);
    console.log('--- AUDIT COMPLETE ---');
    if (failures > 0) process.exitCode = 1;
  } finally {
    await database.close();
  }
}

audit().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
