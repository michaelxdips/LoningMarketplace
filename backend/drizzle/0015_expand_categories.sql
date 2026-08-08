-- 0015: Expand category enum from 5 to 9 values
-- Adds 4 new categories and renames 4 existing via ALTER TYPE + data migration

ALTER TYPE "public"."category" ADD VALUE 'Sembako & Kebutuhan Harian';
ALTER TYPE "public"."category" ADD VALUE 'Fashion & Konveksi';
ALTER TYPE "public"."category" ADD VALUE 'Bahan Bangunan & Material';
ALTER TYPE "public"."category" ADD VALUE 'Jasa & Otomotif';
ALTER TYPE "public"."category" ADD VALUE 'Pertanian, Peternakan & Perikanan';
ALTER TYPE "public"."category" ADD VALUE 'Ritel & Perabot';
ALTER TYPE "public"."category" ADD VALUE 'Kerajinan & Olahan Kreatif';
ALTER TYPE "public"."category" ADD VALUE 'Lainnya';

-- Migrate existing data from old category names to new expanded names
UPDATE "umkms" SET category = 'Sembako & Kebutuhan Harian' WHERE category = 'Sembako';
UPDATE "umkms" SET category = 'Jasa & Otomotif' WHERE category = 'Jasa';
UPDATE "umkms" SET category = 'Pertanian, Peternakan & Perikanan' WHERE category = 'Pertanian';
UPDATE "umkms" SET category = 'Kerajinan & Olahan Kreatif' WHERE category = 'Kerajinan';

UPDATE "products" SET category = 'Sembako & Kebutuhan Harian' WHERE category = 'Sembako';
UPDATE "products" SET category = 'Jasa & Otomotif' WHERE category = 'Jasa';
UPDATE "products" SET category = 'Pertanian, Peternakan & Perikanan' WHERE category = 'Pertanian';
UPDATE "products" SET category = 'Kerajinan & Olahan Kreatif' WHERE category = 'Kerajinan';
