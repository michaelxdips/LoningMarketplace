CREATE TABLE IF NOT EXISTS "product_images" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "product_id" uuid NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
  "media_asset_id" uuid NOT NULL REFERENCES "media_assets"("id") ON DELETE RESTRICT,
  "display_order" integer NOT NULL DEFAULT 0,
  "alt_text" text,
  "is_primary" boolean NOT NULL DEFAULT false,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "product_images_product_id_idx" ON "product_images"("product_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_images_media_asset_id_idx" ON "product_images"("media_asset_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_images_display_order_idx" ON "product_images"("product_id", "display_order");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "product_images_product_media_unique" ON "product_images"("product_id", "media_asset_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "product_images_primary_unique" ON "product_images"("product_id") WHERE "is_primary" = true;
--> statement-breakpoint

ALTER TABLE "product_images" ADD CONSTRAINT "product_images_display_order_check" CHECK ("display_order" >= 0);
--> statement-breakpoint
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_alt_text_check" CHECK ("alt_text" IS NULL OR char_length("alt_text") <= 500);
--> statement-breakpoint

-- Backfill existing product images into the gallery
INSERT INTO "product_images" ("id", "product_id", "media_asset_id", "display_order", "alt_text", "is_primary")
SELECT
  gen_random_uuid(),
  p."id",
  p."image_asset_id",
  0,
  ma."alt_text",
  true
FROM "products" p
JOIN "media_assets" ma ON ma."id" = p."image_asset_id"
WHERE p."image_asset_id" IS NOT NULL
  AND ma."deleted_at" IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM "product_images" pi WHERE pi."product_id" = p."id" AND pi."media_asset_id" = p."image_asset_id"
  );
