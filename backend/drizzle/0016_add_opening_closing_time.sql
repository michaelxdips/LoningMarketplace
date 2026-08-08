-- Migration: Add openingTime and closingTime fields to umkms table
-- Created: 2024-08-08
-- Description: Separates working hours into structured time fields for better data management

ALTER TABLE umkms 
ADD COLUMN IF NOT EXISTS opening_time TEXT,
ADD COLUMN IF NOT EXISTS closing_time TEXT;

COMMENT ON COLUMN umkms.opening_time IS 'Opening time in HH:MM format (e.g., 08:00)';
COMMENT ON COLUMN umkms.closing_time IS 'Closing time in HH:MM format (e.g., 17:00)';
