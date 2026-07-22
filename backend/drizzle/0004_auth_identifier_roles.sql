ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" TYPE text USING "role"::text;--> statement-breakpoint
DROP TYPE "public"."user_role";--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('superadmin', 'admin', 'perangkat_desa', 'pelaku_umkm');--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" TYPE "public"."user_role" USING (CASE WHEN "role" = 'owner' THEN 'pelaku_umkm' ELSE "role" END)::"public"."user_role";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'pelaku_umkm';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "username" text;--> statement-breakpoint
DO $$
DECLARE
  user_record RECORD;
  base_username text;
  candidate text;
  suffix_number integer;
  suffix text;
BEGIN
  FOR user_record IN
    SELECT id, email FROM users ORDER BY created_at, id
  LOOP
    base_username := lower(split_part(user_record.email, '@', 1));
    base_username := regexp_replace(base_username, '[^a-z0-9._-]+', '-', 'g');
    base_username := regexp_replace(base_username, '^[._-]+|[._-]+$', '', 'g');
    IF char_length(base_username) < 3 THEN
      base_username := CASE WHEN base_username = '' THEN 'user' ELSE 'user-' || base_username END;
    END IF;
    base_username := left(base_username, 30);
    candidate := base_username;
    suffix_number := 1;
    WHILE EXISTS (SELECT 1 FROM users WHERE lower(username) = lower(candidate)) LOOP
      suffix_number := suffix_number + 1;
      suffix := '-' || suffix_number::text;
      candidate := left(base_username, 30 - char_length(suffix)) || suffix;
    END LOOP;
    UPDATE users SET username = candidate WHERE id = user_record.id;
  END LOOP;
END $$;--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM users WHERE username IS NULL OR username !~ '^[a-z0-9._-]{3,30}$' OR username <> lower(username)) THEN
    RAISE EXCEPTION 'Username backfill produced invalid values';
  END IF;
  IF EXISTS (SELECT lower(username) FROM users GROUP BY lower(username) HAVING count(*) > 1) THEN
    RAISE EXCEPTION 'Username backfill produced duplicate values';
  END IF;
  IF EXISTS (SELECT 1 FROM users WHERE role::text = 'owner') THEN
    RAISE EXCEPTION 'Legacy owner role remains';
  END IF;
END $$;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "username" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_username_check" CHECK ("username" = lower("username") AND "username" ~ '^[a-z0-9._-]{3,30}$');--> statement-breakpoint
CREATE UNIQUE INDEX "users_username_lower_unique" ON "users" USING btree (lower("username"));
