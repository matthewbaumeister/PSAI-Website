-- Get all column names from sbir_final table
-- Run this in Supabase SQL Editor to see exact database schema

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'sbir_final'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Alternative: Just get column names (simpler output)
-- SELECT column_name 
-- FROM information_schema.columns 
-- WHERE table_name = 'sbir_final' AND table_schema = 'public'
-- ORDER BY ordinal_position;

-- Search specifically for instruction-related columns
-- SELECT column_name, data_type
-- FROM information_schema.columns 
-- WHERE table_name = 'sbir_final' 
--   AND table_schema = 'public'
--   AND column_name LIKE '%instruction%'
-- ORDER BY column_name;

