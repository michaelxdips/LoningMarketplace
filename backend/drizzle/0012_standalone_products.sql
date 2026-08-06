ALTER TABLE "products" ALTER COLUMN "umkm_id" DROP NOT NULL;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "phone" text;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "seller_name" text;
ALTER TABLE "products" DROP CONSTRAINT IF EXISTS "products_phone_normalized_check";
ALTER TABLE "products" ADD CONSTRAINT "products_phone_normalized_check" CHECK ("phone" IS NULL OR "phone" ~ '^628[0-9]{7,12}$');
ALTER TABLE "products" DROP CONSTRAINT IF EXISTS "products_standalone_owner_check";
ALTER TABLE "products" ADD CONSTRAINT "products_standalone_owner_check" CHECK ("umkm_id" IS NOT NULL OR "phone" IS NOT NULL);
