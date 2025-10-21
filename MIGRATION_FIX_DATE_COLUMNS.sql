-- ========================================
-- MIGRATION: Fix Date Columns to Use Proper Types
-- ========================================
-- 
-- PROBLEM: Dates stored as TEXT make queries slow and require ::date casting
-- SOLUTION: Add proper DATE/TIMESTAMP columns and populate from existing TEXT columns
--
-- RUN TIME: ~30 seconds for 280 records
-- SAFE: Adds new columns, doesn't delete anything until you verify
-- ========================================

-- STEP 1: Add new properly-typed date columns
ALTER TABLE sbir_final 
  ADD COLUMN IF NOT EXISTS open_date_proper DATE,
  ADD COLUMN IF NOT EXISTS close_date_proper DATE,
  ADD COLUMN IF NOT EXISTS open_datetime_proper TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS close_datetime_proper TIMESTAMP WITH TIME ZONE;

-- STEP 2: Populate from existing _ts columns
-- Format is "2025-06-25 16:00:00+00" (space, not T)
-- Since columns are already TIMESTAMP type, just cast to date
UPDATE sbir_final 
SET 
  open_date_proper = open_date_ts::date,
  open_datetime_proper = open_date_ts
WHERE open_date_ts IS NOT NULL;

UPDATE sbir_final 
SET 
  close_date_proper = close_date_ts::date,
  close_datetime_proper = close_date_ts
WHERE close_date_ts IS NOT NULL;

-- STEP 3: Verify the migration worked
SELECT 
  'open_date (TEXT)' as column_name,
  COUNT(*) as total,
  COUNT(CASE WHEN open_date IS NOT NULL AND open_date != '' THEN 1 END) as populated
FROM sbir_final

UNION ALL

SELECT 
  'open_date_proper (DATE)',
  COUNT(*),
  COUNT(open_date_proper)
FROM sbir_final

UNION ALL

SELECT 
  'close_date (TEXT)',
  COUNT(*),
  COUNT(CASE WHEN close_date IS NOT NULL AND close_date != '' THEN 1 END)
FROM sbir_final

UNION ALL

SELECT 
  'close_date_proper (DATE)',
  COUNT(*),
  COUNT(close_date_proper)
FROM sbir_final;

-- STEP 4: Test queries with proper date types (NO CASTING NEEDED!)
SELECT 
  COUNT(*) as records_with_future_close_dates,
  MIN(close_date_proper) as earliest_future_date,
  MAX(close_date_proper) as latest_future_date
FROM sbir_final
WHERE close_date_proper >= CURRENT_DATE;  -- ✅ No ::date casting!

-- STEP 5: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_sbir_final_open_date_proper 
  ON sbir_final(open_date_proper);

CREATE INDEX IF NOT EXISTS idx_sbir_final_close_date_proper 
  ON sbir_final(close_date_proper);

CREATE INDEX IF NOT EXISTS idx_sbir_final_close_datetime_proper 
  ON sbir_final(close_datetime_proper);

-- ========================================
-- AFTER VERIFYING EVERYTHING WORKS:
-- Run this to clean up old TEXT columns (OPTIONAL - saves space)
-- ========================================

-- Uncomment these when you're ready to remove old TEXT columns:
-- ALTER TABLE sbir_final DROP COLUMN open_date;
-- ALTER TABLE sbir_final DROP COLUMN close_date;
-- ALTER TABLE sbir_final DROP COLUMN open_datetime;
-- ALTER TABLE sbir_final DROP COLUMN close_datetime;
-- ALTER TABLE sbir_final DROP COLUMN open_date_ts;
-- ALTER TABLE sbir_final DROP COLUMN close_date_ts;

-- Then rename new columns to replace old ones:
-- ALTER TABLE sbir_final RENAME COLUMN open_date_proper TO open_date;
-- ALTER TABLE sbir_final RENAME COLUMN close_date_proper TO close_date;
-- ALTER TABLE sbir_final RENAME COLUMN open_datetime_proper TO open_datetime;
-- ALTER TABLE sbir_final RENAME COLUMN close_datetime_proper TO close_datetime;

