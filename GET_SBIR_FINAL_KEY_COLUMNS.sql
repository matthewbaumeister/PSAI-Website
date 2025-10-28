-- Get key columns we need for the instruction generator
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'sbir_final'
  AND table_schema = 'public'
  AND (
    column_name LIKE '%topic%' 
    OR column_name LIKE '%status%' 
    OR column_name LIKE '%title%'
    OR column_name LIKE '%component%'
    OR column_name LIKE '%program%'
    OR column_name LIKE '%phase%'
    OR column_name LIKE '%open_date%'
    OR column_name LIKE '%close_date%'
  )
ORDER BY column_name;

