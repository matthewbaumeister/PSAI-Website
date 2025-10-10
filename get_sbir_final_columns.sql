-- Get all column names from sbir_final table
SELECT column_name, data_type, ordinal_position
FROM information_schema.columns 
WHERE table_name = 'sbir_final'
  AND table_schema = 'public'
ORDER BY ordinal_position;

