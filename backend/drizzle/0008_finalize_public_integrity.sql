DO $$
DECLARE
  conflict_count integer;
  conflict_ids text;
BEGIN
  SELECT count(*)::int INTO conflict_count
  FROM "products" p
  INNER JOIN (
    SELECT "slug" FROM "products"
    WHERE "slug" IS NOT NULL AND btrim("slug") <> ''
    GROUP BY "slug" HAVING count(*) > 1
  ) duplicates USING ("slug");
  IF conflict_count > 0 THEN
    SELECT string_agg("id"::text, ', ' ORDER BY "id") INTO conflict_ids
    FROM (
      SELECT p."id" FROM "products" p
      INNER JOIN (
        SELECT "slug" FROM "products"
        WHERE "slug" IS NOT NULL AND btrim("slug") <> ''
        GROUP BY "slug" HAVING count(*) > 1
      ) duplicates USING ("slug")
      ORDER BY p."id" LIMIT 10
    ) bounded;
    RAISE EXCEPTION 'Duplicate product slugs detected: % conflicting rows; IDs: %', conflict_count, conflict_ids;
  END IF;

  SELECT count(*)::int INTO conflict_count
  FROM "umkms" u
  INNER JOIN (
    SELECT "slug" FROM "umkms"
    WHERE "slug" IS NOT NULL AND btrim("slug") <> ''
    GROUP BY "slug" HAVING count(*) > 1
  ) duplicates USING ("slug");
  IF conflict_count > 0 THEN
    SELECT string_agg("id"::text, ', ' ORDER BY "id") INTO conflict_ids
    FROM (
      SELECT u."id" FROM "umkms" u
      INNER JOIN (
        SELECT "slug" FROM "umkms"
        WHERE "slug" IS NOT NULL AND btrim("slug") <> ''
        GROUP BY "slug" HAVING count(*) > 1
      ) duplicates USING ("slug")
      ORDER BY u."id" LIMIT 10
    ) bounded;
    RAISE EXCEPTION 'Duplicate UMKM slugs detected: % conflicting rows; IDs: %', conflict_count, conflict_ids;
  END IF;

  SELECT count(*)::int INTO conflict_count
  FROM "umkms"
  WHERE "phone" !~ '^628[0-9]{7,12}$';
  IF conflict_count > 0 THEN
    SELECT string_agg("id"::text, ', ' ORDER BY "id") INTO conflict_ids
    FROM (
      SELECT "id" FROM "umkms"
      WHERE "phone" !~ '^628[0-9]{7,12}$'
      ORDER BY "id" LIMIT 10
    ) bounded;
    RAISE EXCEPTION 'Invalid WhatsApp contacts detected: % conflicting rows; IDs: %', conflict_count, conflict_ids;
  END IF;

  IF EXISTS (SELECT 1 FROM "products" WHERE "slug" IS NULL OR btrim("slug") = '') THEN
    RAISE EXCEPTION 'Missing product slugs detected; run npm --prefix backend run db:migrate';
  END IF;
  IF EXISTS (SELECT 1 FROM "umkms" WHERE "slug" IS NULL OR btrim("slug") = '') THEN
    RAISE EXCEPTION 'Missing UMKM slugs detected; run npm --prefix backend run db:migrate';
  END IF;
END $$;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "slug" TYPE varchar(96);--> statement-breakpoint
ALTER TABLE "umkms" ALTER COLUMN "slug" TYPE varchar(96);--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "slug" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "umkms" ALTER COLUMN "slug" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_slug_nonempty_check" CHECK (btrim("slug") <> '');--> statement-breakpoint
ALTER TABLE "umkms" ADD CONSTRAINT "umkms_slug_nonempty_check" CHECK (btrim("slug") <> '');--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "products_slug_unique" ON "products" ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "umkms_slug_unique" ON "umkms" ("slug");--> statement-breakpoint
ALTER TABLE "umkms" VALIDATE CONSTRAINT "umkms_phone_normalized_check";--> statement-breakpoint
ALTER TABLE "umkms" VALIDATE CONSTRAINT "umkms_published_phone_ready_check";--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name IN ('products', 'umkms')
      AND column_name = 'slug' AND (is_nullable <> 'NO' OR character_maximum_length <> 96)
  ) THEN RAISE EXCEPTION 'Final slug column contract assertion failed'; END IF;

  IF (SELECT count(*) FROM pg_class i
      JOIN pg_index x ON x.indexrelid = i.oid
      JOIN pg_class t ON t.oid = x.indrelid
      JOIN pg_namespace n ON n.oid = t.relnamespace
      JOIN pg_attribute a ON a.attrelid = t.oid AND a.attname = 'slug' AND a.attnum = x.indkey[0]
      WHERE n.nspname = 'public' AND t.relname IN ('products', 'umkms')
        AND i.relname IN ('products_slug_unique', 'umkms_slug_unique')
        AND x.indisunique AND x.indisvalid AND x.indpred IS NULL AND x.indnkeyatts = 1) <> 2
  THEN RAISE EXCEPTION 'Final slug unique index assertion failed'; END IF;

  IF EXISTS (SELECT 1 FROM "products" WHERE "slug" IS NULL OR btrim("slug") = '' OR char_length("slug") > 96)
  THEN RAISE EXCEPTION 'Final product slug data assertion failed'; END IF;
  IF EXISTS (SELECT 1 FROM "umkms" WHERE "slug" IS NULL OR btrim("slug") = '' OR char_length("slug") > 96)
  THEN RAISE EXCEPTION 'Final UMKM slug data assertion failed'; END IF;
  IF EXISTS (SELECT "slug" FROM "products" GROUP BY "slug" HAVING count(*) > 1)
  THEN RAISE EXCEPTION 'Final product slug uniqueness assertion failed'; END IF;
  IF EXISTS (SELECT "slug" FROM "umkms" GROUP BY "slug" HAVING count(*) > 1)
  THEN RAISE EXCEPTION 'Final UMKM slug uniqueness assertion failed'; END IF;
  IF EXISTS (SELECT 1 FROM "umkms" WHERE "phone" !~ '^628[0-9]{7,12}$')
  THEN RAISE EXCEPTION 'Final WhatsApp data assertion failed'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid
    WHERE t.relname = 'umkms' AND c.conname = 'umkms_phone_normalized_check' AND c.convalidated
  ) THEN RAISE EXCEPTION 'Final WhatsApp constraint assertion failed'; END IF;
END $$;
