import { asc, sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import sharp from 'sharp';
import path from 'node:path';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import * as schema from '../../schema.js';
import { UMKMS, USERS, mediaDeterministicId, productDeterministicId } from '../shared/ids.js';
import { SEED_DATES } from '../shared/dates.js';

const umkmIds = [
  UMKMS.kuliner1, UMKMS.kuliner2, UMKMS.kuliner3, UMKMS.kerajinan1, UMKMS.kerajinan2,
  UMKMS.jasa1, UMKMS.jasa2, UMKMS.sembako1, UMKMS.sembako2, UMKMS.sembako3,
  UMKMS.pertanian1, UMKMS.pertanian2, UMKMS.pertanian3, UMKMS.noProducts, UMKMS.inactive,
] as const;

async function createAsset(
  db: PostgresJsDatabase<typeof schema>, storageDir: string, sourcePath: string,
  id: string, storageSlug: string, altText: string,
) {
  const source = await readFile(sourcePath);
  const card = await sharp(source).resize(1000, 700, { fit: 'cover', position: 'attention' }).webp({ quality: 88 }).toBuffer();
  const thumb = await sharp(card).resize(240, 168, { fit: 'cover' }).webp({ quality: 82 }).toBuffer();
  const cardName = `${storageSlug}.webp`;
  const thumbName = `${storageSlug}-thumb.webp`;
  await writeFile(path.join(storageDir, 'media', cardName), card);
  await writeFile(path.join(storageDir, 'media', thumbName), thumb);
  await db.insert(schema.mediaAssets).values({
    id, createdByUserId: USERS.owner1, originalFilename: path.basename(sourcePath), originalMimeType: 'image/jpeg', outputMimeType: 'image/webp',
    checksumSha256: createHash('sha256').update(card).digest('hex'), cardStorageKey: `media/${cardName}`, thumbnailStorageKey: `media/${thumbName}`,
    cardWidth: 1000, cardHeight: 700, cardByteSize: card.byteLength, thumbnailWidth: 240, thumbnailHeight: 168, thumbnailByteSize: thumb.byteLength,
    altText, orphanedAt: null, deletedAt: null, createdAt: SEED_DATES.old, updatedAt: SEED_DATES.recent,
  });
}

export async function seedMedia(db: PostgresJsDatabase<typeof schema>) {
  const storageDir = path.resolve(process.env.MEDIA_FILESYSTEM_ROOT ?? './storage');
  const sourceDir = path.resolve(process.cwd(), '../assets/seed-source');
  await mkdir(path.join(storageDir, 'media'), { recursive: true });

  // Removing deterministic media clears old references through ON DELETE SET NULL.
  await db.delete(schema.mediaAssets).where(sql`${schema.mediaAssets.id}::text LIKE 'e4000000-%'`);
  const retired = ['catalog-kuliner', 'catalog-kerajinan', 'catalog-jasa', 'catalog-sembako', 'catalog-pertanian'];
  await Promise.all(retired.flatMap((slug) => [
    rm(path.join(storageDir, 'media', `${slug}.webp`), { force: true }),
    rm(path.join(storageDir, 'media', `${slug}-thumb.webp`), { force: true }),
  ]));

  const products = await db.select({ id: schema.products.id, name: schema.products.name })
    .from(schema.products)
    .where(sql`${schema.products.id}::text LIKE 'e3000000-%'`)
    .orderBy(asc(schema.products.id));
  if (products.length !== 52) throw new Error(`Expected 52 development products, found ${products.length}`);

  for (let index = 0; index < products.length; index++) {
    const product = products[index];
    const fixtureIndex = index + 1;
    const mediaId = mediaDeterministicId(fixtureIndex);
    await createAsset(
      db, storageDir, path.join(sourceDir, `product-${String(fixtureIndex).padStart(2, '0')}.jpg`),
      mediaId, `seed-product-${String(fixtureIndex).padStart(2, '0')}`, product.name,
    );
    await db.update(schema.products).set({ imageUrl: null, imageAssetId: mediaId })
      .where(sql`${schema.products.id} = ${productDeterministicId(fixtureIndex)}`);
  }

  for (let index = 0; index < umkmIds.length; index++) {
    const fixtureIndex = index + 1;
    const mediaId = mediaDeterministicId(100 + fixtureIndex);
    const [umkm] = await db.select({ name: schema.umkms.name }).from(schema.umkms).where(sql`${schema.umkms.id} = ${umkmIds[index]}`).limit(1);
    if (!umkm) throw new Error(`Missing development UMKM ${umkmIds[index]}`);
    await createAsset(
      db, storageDir, path.join(sourceDir, `umkm-${String(fixtureIndex).padStart(2, '0')}.jpg`),
      mediaId, `seed-umkm-${String(fixtureIndex).padStart(2, '0')}`, `Profil usaha ${umkm.name}`,
    );
    await db.update(schema.umkms).set({ imageUrl: null, imageAssetId: mediaId }).where(sql`${schema.umkms.id} = ${umkmIds[index]}`);
  }
}
