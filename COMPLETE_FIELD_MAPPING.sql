-- Get ALL columns in sbir_final with their data types
-- Run this in Supabase to see the complete structure

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'sbir_final'
ORDER BY ordinal_position;

-- Then run this to see which fields are populated vs empty
SELECT 
    column_name,
    COUNT(*) - COUNT(CASE WHEN column_name IS NULL OR column_name = '' THEN 1 END) as populated_count,
    COUNT(*) as total_count,
    ROUND(100.0 * (COUNT(*) - COUNT(CASE WHEN column_name IS NULL OR column_name = '' THEN 1 END)) / COUNT(*), 1) as fill_percentage
FROM information_schema.columns
WHERE table_name = 'sbir_final'
GROUP BY column_name
ORDER BY fill_percentage DESC;

