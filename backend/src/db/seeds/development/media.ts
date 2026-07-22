import { sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import sharp from 'sharp';
import path from 'node:path';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import * as schema from '../../schema.js';
import { USERS, mediaDeterministicId, productDeterministicId } from '../shared/ids.js';
import { SEED_DATES } from '../shared/dates.js';

const fixtures = [
  ['kuliner', 'KULINER LONING', { r: 184, g: 92, b: 59 }, 1],
  ['kerajinan', 'KERAJINAN LONING', { r: 154, g: 109, b: 62 }, 13],
  ['jasa', 'JASA LONING', { r: 57, g: 117, b: 126 }, 21],
  ['sembako', 'SEMBAKO LONING', { r: 190, g: 142, b: 49 }, 29],
  ['pertanian', 'PERTANIAN LONING', { r: 67, g: 132, b: 79 }, 41],
] as const;

export async function seedMedia(db: PostgresJsDatabase<typeof schema>) {
  const storageDir = path.resolve(process.env.MEDIA_FILESYSTEM_ROOT ?? './storage');
  await mkdir(path.join(storageDir, 'media'), { recursive: true });
  await db.delete(schema.mediaAssets).where(sql`${schema.mediaAssets.id}::text LIKE 'e4000000-%'`);
  const retired = ['card-1.webp', 'thumb-1.webp', 'card-2.webp', 'thumb-2.webp', 'card-3.webp', 'thumb-3.webp'];
  await Promise.all(retired.map((name) => rm(path.join(storageDir, 'media', name), { force: true })));

  for (const [slug, label, background, productIndex] of fixtures) {
    const cardName = `catalog-${slug}.webp`;
    const thumbName = `catalog-${slug}-thumb.webp`;
    const svg = `<svg width="1000" height="700" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="rgb(${background.r},${background.g},${background.b})"/><circle cx="850" cy="120" r="230" fill="rgba(255,255,255,.14)"/><circle cx="130" cy="620" r="300" fill="rgba(0,0,0,.10)"/><text x="70" y="300" fill="white" font-family="Arial" font-size="58" font-weight="700">${label}</text><text x="72" y="370" fill="rgba(255,255,255,.82)" font-family="Arial" font-size="28">Produk lokal pilihan warga Desa Loning</text></svg>`;
    const card = await sharp(Buffer.from(svg)).webp({ quality: 88 }).toBuffer();
    const thumb = await sharp(card).resize(240, 168, { fit: 'cover' }).webp({ quality: 82 }).toBuffer();
    await writeFile(path.join(storageDir, 'media', cardName), card);
    await writeFile(path.join(storageDir, 'media', thumbName), thumb);
    const id = mediaDeterministicId(fixtures.findIndex(([candidate]) => candidate === slug) + 1);
    await db.insert(schema.mediaAssets).values({
      id, createdByUserId: USERS.owner1, originalFilename: `${slug}.jpg`, originalMimeType: 'image/jpeg', outputMimeType: 'image/webp',
      checksumSha256: createHash('sha256').update(card).digest('hex'), cardStorageKey: `media/${cardName}`, thumbnailStorageKey: `media/${thumbName}`,
      cardWidth: 1000, cardHeight: 700, cardByteSize: card.byteLength, thumbnailWidth: 240, thumbnailHeight: 168, thumbnailByteSize: thumb.byteLength,
      altText: `Produk kategori ${label.toLowerCase()}`, orphanedAt: null, deletedAt: null, createdAt: SEED_DATES.old, updatedAt: SEED_DATES.recent,
    }).onConflictDoUpdate({ target: schema.mediaAssets.id, set: {
      checksumSha256: sql`excluded.checksum_sha256`, cardStorageKey: sql`excluded.card_storage_key`, thumbnailStorageKey: sql`excluded.thumbnail_storage_key`,
      cardByteSize: sql`excluded.card_byte_size`, thumbnailByteSize: sql`excluded.thumbnail_byte_size`, altText: sql`excluded.alt_text`, updatedAt: sql`excluded.updated_at`,
    } });
    await db.update(schema.products).set({ imageUrl: null, imageAssetId: id }).where(sql`${schema.products.id} = ${productDeterministicId(productIndex)}`);
  }

  await db.update(schema.umkms).set({ imageUrl: 'http://localhost:3001/media/media/catalog-kuliner.webp' }).where(sql`${schema.umkms.category} = 'Kuliner'`);
  await db.update(schema.umkms).set({ imageUrl: 'http://localhost:3001/media/media/catalog-kerajinan.webp' }).where(sql`${schema.umkms.category} = 'Kerajinan'`);
  await db.update(schema.umkms).set({ imageUrl: 'http://localhost:3001/media/media/catalog-jasa.webp' }).where(sql`${schema.umkms.category} = 'Jasa'`);
  await db.update(schema.umkms).set({ imageUrl: 'http://localhost:3001/media/media/catalog-sembako.webp' }).where(sql`${schema.umkms.category} = 'Sembako'`);
  await db.update(schema.umkms).set({ imageUrl: 'http://localhost:3001/media/media/catalog-pertanian.webp' }).where(sql`${schema.umkms.category} = 'Pertanian'`);
}
