-- Verify the gsa_schedule_holders table has all required columns

SELECT 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'gsa_schedule_holders' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

