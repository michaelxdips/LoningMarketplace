-- 0016: Add opening/closing time columns (IDEMPOTENT)
DO $$ BEGIN ALTER TABLE umkms ADD COLUMN opening_time TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE umkms ADD COLUMN closing_time TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
COMMENT ON COLUMN umkms.opening_time IS 'Opening time in HH:MM format (e.g., 08:00)';
COMMENT ON COLUMN umkms.closing_time IS 'Closing time in HH:MM format (e.g., 17:00)';
