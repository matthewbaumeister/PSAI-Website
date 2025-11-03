-- ============================================
-- Fix Status Field Length Error
-- ============================================
-- Error: "value too long for type character varying(100)"
-- Solution: Expand status field from VARCHAR(100) to TEXT

-- Run this in Supabase SQL Editor immediately to fix ongoing import

-- Fix congressional_bills status field
ALTER TABLE congressional_bills 
ALTER COLUMN status TYPE TEXT;

-- Fix congressional_amendments status field
ALTER TABLE congressional_amendments 
ALTER COLUMN status TYPE TEXT;

-- Verify the changes
SELECT 
  table_name,
  column_name,
  data_type,
  character_maximum_length
FROM information_schema.columns
WHERE table_name IN ('congressional_bills', 'congressional_amendments')
  AND column_name = 'status';

