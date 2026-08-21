-- 0015: Expand category enum (IDEMPOTENT — safe to re-run)
-- Each ALTER TYPE is wrapped in exception handler

DO $$ BEGIN ALTER TYPE "public"."category" ADD VALUE 'Sembako & Kebutuhan Harian'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE "public"."category" ADD VALUE 'Fashion & Konveksi'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE "public"."category" ADD VALUE 'Bahan Bangunan & Material'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE "public"."category" ADD VALUE 'Jasa & Otomotif'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE "public"."category" ADD VALUE 'Pertanian, Peternakan & Perikanan'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE "public"."category" ADD VALUE 'Ritel & Perabot'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE "public"."category" ADD VALUE 'Kerajinan & Olahan Kreatif'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE "public"."category" ADD VALUE 'Lainnya'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- PostgreSQL forbids using a freshly ADD VALUE'd enum literal in the same
-- transaction. COMMIT here so the new category values become usable below
-- (otherwise a fresh install fails with error 55P04 "unsafe use of new value").
COMMIT;

-- Migrate existing data (idempotent — no-op if already done)
UPDATE "umkms" SET category = 'Sembako & Kebutuhan Harian' WHERE category = 'Sembako';
UPDATE "umkms" SET category = 'Jasa & Otomotif' WHERE category = 'Jasa';
UPDATE "umkms" SET category = 'Pertanian, Peternakan & Perikanan' WHERE category = 'Pertanian';
UPDATE "umkms" SET category = 'Kerajinan & Olahan Kreatif' WHERE category = 'Kerajinan';

UPDATE "products" SET category = 'Sembako & Kebutuhan Harian' WHERE category = 'Sembako';
UPDATE "products" SET category = 'Jasa & Otomotif' WHERE category = 'Jasa';
UPDATE "products" SET category = 'Pertanian, Peternakan & Perikanan' WHERE category = 'Pertanian';
UPDATE "products" SET category = 'Kerajinan & Olahan Kreatif' WHERE category = 'Kerajinan';
