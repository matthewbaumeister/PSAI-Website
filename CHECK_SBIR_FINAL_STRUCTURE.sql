-- Check sbir_final table structure
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'sbir_final'
  AND table_schema = 'public'
ORDER BY ordinal_position
LIMIT 50;

-- Also check for instruction-related columns
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'sbir_final'
  AND table_schema = 'public'
  AND (column_name LIKE '%instruction%' 
       OR column_name LIKE '%baa%'
       OR column_name LIKE '%component%')
ORDER BY column_name;

