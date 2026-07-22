import { sql } from 'drizzle-orm';
import { createDatabase } from '../db/client.js';
import { createHash } from 'node:crypto';

function normalize(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'bigint') return Number(value);
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, normalize(item)]));
  return value;
}

async function generateHash() {
  const database = createDatabase();
  try {
    const db = database.db;
    const users = await db.execute(sql`SELECT id, email, display_name, role, is_active, must_change_password, failed_login_count, locked_until, last_login_at, created_at, updated_at FROM users ORDER BY id`);
    const umkms = await db.execute(sql`SELECT id, name, owner, description, phone, category, image_url, image_asset_id, address, working_hours, owner_user_id, display_order, publication_status, published_at, created_at, updated_at FROM umkms ORDER BY id`);
    const products = await db.execute(sql`SELECT id, umkm_id, name, price, description, category, image_url, image_asset_id, is_available, unit, display_order, publication_status, published_at, created_at, updated_at FROM products ORDER BY id`);
    const media = await db.execute(sql`SELECT id, created_by_user_id, original_filename, original_mime_type, output_mime_type, checksum_sha256, card_storage_key, thumbnail_storage_key, card_width, card_height, card_byte_size, thumbnail_width, thumbnail_height, thumbnail_byte_size, alt_text, orphaned_at, deleted_at, created_at, updated_at FROM media_assets ORDER BY id`);
    const data = normalize({ users: [...users], umkms: [...umkms], products: [...products], media: [...media] });
    const counts = { users: users.length, umkms: umkms.length, products: products.length, media: media.length };
    const hash = createHash('sha256').update(JSON.stringify(data)).digest('hex');
    console.log(`Seed Row Counts: ${JSON.stringify(counts)}`);
    console.log(`Seed Content Hash: ${hash}`);
  } finally {
    await database.close();
  }
}

generateHash().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
