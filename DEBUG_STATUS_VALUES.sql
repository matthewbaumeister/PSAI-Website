-- Debug: Check what status values actually exist in the database

-- 1. Count all records by status
SELECT 
  status,
  COUNT(*) as count
FROM sbir_final
GROUP BY status
ORDER BY count DESC;

-- 2. Show a sample of records with each status
SELECT 
  status,
  topic_number,
  title,
  open_date,
  close_date
FROM sbir_final
ORDER BY status, topic_number
LIMIT 50;

-- 3. Check if there are records with NULL status
SELECT 
  COUNT(*) as null_status_count
FROM sbir_final
WHERE status IS NULL;

-- 4. Check for variations in status capitalization/spelling
SELECT DISTINCT
  status,
  LOWER(status) as lowercase_status,
  UPPER(status) as uppercase_status
FROM sbir_final
WHERE status IS NOT NULL
ORDER BY status;

