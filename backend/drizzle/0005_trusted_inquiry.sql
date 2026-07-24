CREATE TYPE "public"."public_event_type" AS ENUM('umkm_view', 'product_view', 'inquiry_started', 'message_copied', 'whatsapp_opened');--> statement-breakpoint
ALTER TABLE "umkms" ADD COLUMN "contact_verified_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "umkms" ADD COLUMN "catalog_updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
UPDATE "umkms" SET "phone" = CASE
  WHEN regexp_replace("phone", '[^0-9]', '', 'g') ~ '^08[0-9]{8,13}$' THEN '62' || substring(regexp_replace("phone", '[^0-9]', '', 'g') from 2)
  WHEN regexp_replace("phone", '[^0-9]', '', 'g') ~ '^628[0-9]{7,12}$' THEN regexp_replace("phone", '[^0-9]', '', 'g')
  ELSE "phone"
END
WHERE "phone" ~ '^[+0-9 ().-]+$';--> statement-breakpoint
ALTER TABLE "umkms" DROP CONSTRAINT IF EXISTS "umkms_phone_digits_check";--> statement-breakpoint
ALTER TABLE "umkms" ADD CONSTRAINT "umkms_phone_normalized_check" CHECK ("phone" ~ '^628[0-9]{7,12}$') NOT VALID;--> statement-breakpoint
ALTER TABLE "umkms" ADD CONSTRAINT "umkms_published_phone_ready_check" CHECK ("publication_status" <> 'published' OR "phone" ~ '^628[0-9]{7,12}$') NOT VALID;--> statement-breakpoint
CREATE TABLE "public_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "event_type" "public_event_type" NOT NULL,
  "umkm_id" uuid,
  "product_id" uuid,
  "source" text NOT NULL,
  "anonymous_session_id" uuid NOT NULL,
  "event_version" integer DEFAULT 1 NOT NULL,
  "dedupe_bucket" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "public_events_target_check" CHECK (("umkm_id" IS NOT NULL AND "product_id" IS NULL) OR "product_id" IS NOT NULL),
  CONSTRAINT "public_events_source_check" CHECK ("source" IN ('homepage_featured','homepage_catalog','umkm_detail','product_detail','search_results')),
  CONSTRAINT "public_events_version_check" CHECK ("event_version" = 1)
);--> statement-breakpoint
ALTER TABLE "public_events" ADD CONSTRAINT "public_events_umkm_id_umkms_id_fk" FOREIGN KEY ("umkm_id") REFERENCES "public"."umkms"("id") ON DELETE set null;--> statement-breakpoint
ALTER TABLE "public_events" ADD CONSTRAINT "public_events_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null;--> statement-breakpoint
CREATE INDEX "public_events_created_at_idx" ON "public_events" ("created_at");--> statement-breakpoint
CREATE INDEX "public_events_type_created_idx" ON "public_events" ("event_type", "created_at");--> statement-breakpoint
CREATE INDEX "public_events_umkm_id_idx" ON "public_events" ("umkm_id");--> statement-breakpoint
CREATE INDEX "public_events_product_id_idx" ON "public_events" ("product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "public_events_umkm_dedupe_unique" ON "public_events" ("anonymous_session_id", "event_type", "umkm_id", "source", "dedupe_bucket") WHERE "umkm_id" IS NOT NULL AND "product_id" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "public_events_product_dedupe_unique" ON "public_events" ("anonymous_session_id", "event_type", "product_id", "source", "dedupe_bucket") WHERE "product_id" IS NOT NULL;

-- Audit after migration; returns IDs only and never changes ambiguous records:
-- SELECT id FROM umkms WHERE phone !~ '^628[0-9]{7,12}$' ORDER BY id;
-- After cleanup: ALTER TABLE umkms VALIDATE CONSTRAINT umkms_phone_normalized_check;
--                ALTER TABLE umkms VALIDATE CONSTRAINT umkms_published_phone_ready_check;