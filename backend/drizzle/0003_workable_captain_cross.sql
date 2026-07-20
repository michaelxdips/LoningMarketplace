CREATE TABLE "media_assets" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_by_user_id" uuid,
	"original_filename" text,
	"original_mime_type" text NOT NULL,
	"output_mime_type" text NOT NULL,
	"checksum_sha256" text NOT NULL,
	"card_storage_key" text NOT NULL,
	"thumbnail_storage_key" text NOT NULL,
	"card_width" integer NOT NULL,
	"card_height" integer NOT NULL,
	"card_byte_size" integer NOT NULL,
	"thumbnail_width" integer NOT NULL,
	"thumbnail_height" integer NOT NULL,
	"thumbnail_byte_size" integer NOT NULL,
	"alt_text" text,
	"orphaned_at" timestamp with time zone DEFAULT now(),
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "media_assets_dimensions_check" CHECK ("media_assets"."card_width" > 0 AND "media_assets"."card_height" > 0 AND "media_assets"."card_byte_size" > 0 AND "media_assets"."thumbnail_width" > 0 AND "media_assets"."thumbnail_height" > 0 AND "media_assets"."thumbnail_byte_size" > 0),
	CONSTRAINT "media_assets_checksum_sha256_check" CHECK ("media_assets"."checksum_sha256" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "media_assets_alt_text_check" CHECK ("media_assets"."alt_text" IS NULL OR char_length("media_assets"."alt_text") <= 500)
);
--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "image_url" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "umkms" ALTER COLUMN "image_url" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "image_asset_id" uuid;--> statement-breakpoint
ALTER TABLE "umkms" ADD COLUMN "image_asset_id" uuid;--> statement-breakpoint
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "media_assets_created_by_user_id_idx" ON "media_assets" USING btree ("created_by_user_id");--> statement-breakpoint
CREATE INDEX "media_assets_checksum_sha256_idx" ON "media_assets" USING btree ("checksum_sha256");--> statement-breakpoint
CREATE INDEX "media_assets_orphaned_at_idx" ON "media_assets" USING btree ("orphaned_at");--> statement-breakpoint
CREATE INDEX "media_assets_deleted_at_idx" ON "media_assets" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "media_assets_created_at_idx" ON "media_assets" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "media_assets_card_storage_key_unique" ON "media_assets" USING btree ("card_storage_key");--> statement-breakpoint
CREATE UNIQUE INDEX "media_assets_thumbnail_storage_key_unique" ON "media_assets" USING btree ("thumbnail_storage_key");--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_image_asset_id_media_assets_id_fk" FOREIGN KEY ("image_asset_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "umkms" ADD CONSTRAINT "umkms_image_asset_id_media_assets_id_fk" FOREIGN KEY ("image_asset_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "products_image_asset_id_idx" ON "products" USING btree ("image_asset_id");--> statement-breakpoint
CREATE INDEX "umkms_image_asset_id_idx" ON "umkms" USING btree ("image_asset_id");--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_image_source_check" CHECK ("products"."image_url" IS NOT NULL OR "products"."image_asset_id" IS NOT NULL);--> statement-breakpoint
ALTER TABLE "umkms" ADD CONSTRAINT "umkms_image_source_check" CHECK ("umkms"."image_url" IS NOT NULL OR "umkms"."image_asset_id" IS NOT NULL);