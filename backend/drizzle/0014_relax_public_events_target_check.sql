-- Relax target check to allow orphaned events after entity deletion.
-- ON DELETE SET NULL on umkm_id/product_id FKs nullifies the target,
-- but the existing CHECK required at least one non-null target.
-- Orphaned analytics data is preserved for historical records.

ALTER TABLE "public_events" DROP CONSTRAINT IF EXISTS "public_events_target_check";

-- Allow NULL/NULL for events whose target entity was deleted
ALTER TABLE "public_events" ADD CONSTRAINT "public_events_target_check"
  CHECK (("umkm_id" IS NOT NULL AND "product_id" IS NULL)
      OR ("product_id" IS NOT NULL)
      OR ("umkm_id" IS NULL AND "product_id" IS NULL));
