-- 0017: Enforce unique (product_id, display_order) in product_images
-- Prevents the addProductImage display-order race from producing duplicate
-- ordering values. Safe to re-run (idempotent): drops the plain index if it
-- still exists, then creates the unique index.

DROP INDEX IF EXISTS "product_images_display_order_idx";
DROP INDEX IF EXISTS "product_images_product_display_order_unique";

CREATE UNIQUE INDEX "product_images_product_display_order_unique"
  ON "product_images" ("product_id", "display_order");
