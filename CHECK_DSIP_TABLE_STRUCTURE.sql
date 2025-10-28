-- Check what DSIP-related tables exist
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND (table_name LIKE '%dsip%' OR table_name LIKE '%sbir%')
ORDER BY table_name;

-- If dsip_opportunities exists, show its columns
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'dsip_opportunities'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if there are any status-related columns
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name LIKE '%status%'
  AND table_name LIKE '%dsip%'
ORDER BY table_name, column_name;

