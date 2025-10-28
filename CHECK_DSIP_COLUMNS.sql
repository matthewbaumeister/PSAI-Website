-- Check all columns in dsip_opportunities table
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'dsip_opportunities'
  AND table_schema = 'public'
ORDER BY ordinal_position
LIMIT 50;

