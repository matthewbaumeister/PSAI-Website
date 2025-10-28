-- Find columns related to instructions
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'dsip_opportunities'
  AND table_schema = 'public'
  AND (column_name LIKE '%instruction%' OR column_name LIKE '%baa%')
ORDER BY column_name;

