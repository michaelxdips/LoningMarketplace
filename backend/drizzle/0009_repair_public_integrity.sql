DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM products WHERE slug IS NULL OR btrim(slug) = '' OR char_length(slug) > 96)
    THEN RAISE EXCEPTION 'Cannot finalize product slug integrity: invalid product rows exist'; END IF;
  IF EXISTS (SELECT 1 FROM umkms WHERE slug IS NULL OR btrim(slug) = '' OR char_length(slug) > 96)
    THEN RAISE EXCEPTION 'Cannot finalize UMKM slug integrity: invalid UMKM rows exist'; END IF;
  IF EXISTS (SELECT 1 FROM umkms WHERE phone !~ '^628[0-9]{7,12}$')
    THEN RAISE EXCEPTION 'Cannot validate WhatsApp integrity: invalid UMKM contacts exist'; END IF;
END $$;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "slug" TYPE varchar(96);--> statement-breakpoint
ALTER TABLE "umkms" ALTER COLUMN "slug" TYPE varchar(96);--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "slug" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "umkms" ALTER COLUMN "slug" SET NOT NULL;--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_slug_nonempty_check') THEN
    ALTER TABLE "products" ADD CONSTRAINT "products_slug_nonempty_check" CHECK (btrim("slug") <> '');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'umkms_slug_nonempty_check') THEN
    ALTER TABLE "umkms" ADD CONSTRAINT "umkms_slug_nonempty_check" CHECK (btrim("slug") <> '');
  END IF;
END $$;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "products_slug_unique" ON "products" ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "umkms_slug_unique" ON "umkms" ("slug");--> statement-breakpoint
ALTER TABLE "umkms" VALIDATE CONSTRAINT "umkms_phone_normalized_check";--> statement-breakpoint
ALTER TABLE "umkms" VALIDATE CONSTRAINT "umkms_published_phone_ready_check";