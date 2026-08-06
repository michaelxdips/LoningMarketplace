ALTER TABLE "umkms" DROP CONSTRAINT IF EXISTS "umkms_image_source_check";
ALTER TABLE "umkms" ADD CONSTRAINT "umkms_image_source_check" CHECK ("image_url" IS NULL OR "image_asset_id" IS NULL);
