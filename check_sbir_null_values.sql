-- Check SBIR Final Table for NULL values in key fields
-- Run this in Supabase SQL Editor

-- 1. Count total records
SELECT 'Total Records' as check_type, COUNT(*) as count
FROM sbir_final
UNION ALL

-- 2. Check NULL counts for instruction URLs (the fields we just added)
SELECT 'NULL solicitation_instructions_download' as check_type, 
       COUNT(*) as count
FROM sbir_final 
WHERE solicitation_instructions_download IS NULL OR solicitation_instructions_download = ''
UNION ALL

SELECT 'NULL component_instructions_download' as check_type, 
       COUNT(*) as count
FROM sbir_final 
WHERE component_instructions_download IS NULL OR component_instructions_download = ''
UNION ALL

-- 3. Check NULL counts for other important fields
SELECT 'NULL topic_number' as check_type, COUNT(*) as count
FROM sbir_final WHERE topic_number IS NULL OR topic_number = ''
UNION ALL

SELECT 'NULL title' as check_type, COUNT(*) as count
FROM sbir_final WHERE title IS NULL OR title = ''
UNION ALL

SELECT 'NULL topic_pdf_download' as check_type, COUNT(*) as count
FROM sbir_final WHERE topic_pdf_download IS NULL OR topic_pdf_download = ''
UNION ALL

SELECT 'NULL description' as check_type, COUNT(*) as count
FROM sbir_final WHERE description IS NULL OR description = ''
UNION ALL

SELECT 'NULL objective' as check_type, COUNT(*) as count
FROM sbir_final WHERE objective IS NULL OR objective = ''
UNION ALL

SELECT 'NULL technology_areas' as check_type, COUNT(*) as count
FROM sbir_final WHERE technology_areas IS NULL OR technology_areas = ''
UNION ALL

SELECT 'NULL keywords' as check_type, COUNT(*) as count
FROM sbir_final WHERE keywords IS NULL OR keywords = ''
UNION ALL

SELECT 'NULL tpoc_names' as check_type, COUNT(*) as count
FROM sbir_final WHERE tpoc_names IS NULL OR tpoc_names = ''
UNION ALL

SELECT 'NULL qa_content' as check_type, COUNT(*) as count
FROM sbir_final WHERE qa_content IS NULL OR qa_content = '';


-- 4. Show sample of records with instruction URLs
SELECT 
  topic_number,
  title,
  CASE 
    WHEN solicitation_instructions_download IS NOT NULL AND solicitation_instructions_download != '' 
    THEN '✓ Has URL' 
    ELSE '✗ Missing' 
  END as sol_instructions,
  CASE 
    WHEN component_instructions_download IS NOT NULL AND component_instructions_download != '' 
    THEN '✓ Has URL' 
    ELSE '✗ Missing' 
  END as comp_instructions,
  LEFT(solicitation_instructions_download, 60) as sol_url_preview,
  LEFT(component_instructions_download, 60) as comp_url_preview
FROM sbir_final
ORDER BY topic_number DESC
LIMIT 10;


-- 5. Count records WITH instruction URLs
SELECT 
  COUNT(*) FILTER (WHERE solicitation_instructions_download IS NOT NULL AND solicitation_instructions_download != '') as has_solicitation_url,
  COUNT(*) FILTER (WHERE component_instructions_download IS NOT NULL AND component_instructions_download != '') as has_component_url,
  COUNT(*) as total_records
FROM sbir_final;


-- 6. Show all column names and null counts
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'sbir_final'
ORDER BY ordinal_position;

