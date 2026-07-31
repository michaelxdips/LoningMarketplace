ALTER TABLE "umkms" ADD COLUMN "latitude" numeric(9,6);--> statement-breakpoint
ALTER TABLE "umkms" ADD COLUMN "longitude" numeric(9,6);--> statement-breakpoint
ALTER TABLE "umkms" ADD CONSTRAINT "umkms_location_pair_check" CHECK (
  ("latitude" IS NULL AND "longitude" IS NULL)
  OR
  ("latitude" IS NOT NULL AND "longitude" IS NOT NULL)
);--> statement-breakpoint
ALTER TABLE "umkms" ADD CONSTRAINT "umkms_latitude_range_check" CHECK (
  "latitude" IS NULL
  OR "latitude" BETWEEN -90 AND 90
);--> statement-breakpoint
ALTER TABLE "umkms" ADD CONSTRAINT "umkms_longitude_range_check" CHECK (
  "longitude" IS NULL
  OR "longitude" BETWEEN -180 AND 180
);