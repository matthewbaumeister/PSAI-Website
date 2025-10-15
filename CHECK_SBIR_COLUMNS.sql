-- Check which columns currently exist in sbir_final table
-- Run this in Supabase SQL Editor to see what you have

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'sbir_final'
ORDER BY column_name;

-- Count total columns
SELECT COUNT(*) as total_columns
FROM information_schema.columns
WHERE table_name = 'sbir_final';

