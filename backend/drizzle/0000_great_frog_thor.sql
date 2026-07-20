CREATE TYPE "public"."category" AS ENUM('Kuliner', 'Kerajinan', 'Jasa', 'Sembako', 'Pertanian');--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY NOT NULL,
	"umkm_id" uuid NOT NULL,
	"name" text NOT NULL,
	"price" integer,
	"description" text NOT NULL,
	"category" "category" NOT NULL,
	"image_url" text NOT NULL,
	"is_available" boolean DEFAULT true NOT NULL,
	"unit" text,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "products_price_check" CHECK ("products"."price" IS NULL OR "products"."price" >= 0),
	CONSTRAINT "products_display_order_check" CHECK ("products"."display_order" >= 0)
);
--> statement-breakpoint
CREATE TABLE "umkms" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"owner" text NOT NULL,
	"description" text NOT NULL,
	"phone" text NOT NULL,
	"category" "category" NOT NULL,
	"image_url" text NOT NULL,
	"address" text NOT NULL,
	"working_hours" text,
	"owner_user_id" uuid,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "umkms_phone_digits_check" CHECK ("umkms"."phone" ~ '^[0-9]+$'),
	CONSTRAINT "umkms_display_order_check" CHECK ("umkms"."display_order" >= 0)
);
--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_umkm_id_umkms_id_fk" FOREIGN KEY ("umkm_id") REFERENCES "public"."umkms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "products_umkm_id_idx" ON "products" USING btree ("umkm_id");--> statement-breakpoint
CREATE INDEX "products_category_idx" ON "products" USING btree ("category");--> statement-breakpoint
CREATE INDEX "products_display_order_idx" ON "products" USING btree ("display_order");--> statement-breakpoint
CREATE INDEX "umkms_category_idx" ON "umkms" USING btree ("category");--> statement-breakpoint
CREATE INDEX "umkms_display_order_idx" ON "umkms" USING btree ("display_order");