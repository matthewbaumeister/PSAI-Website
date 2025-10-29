-- Check instruction coverage for active opportunities

-- 1. Count active opportunities
SELECT 
  'Total Active Opportunities' as metric,
  COUNT(*) as count
FROM sbir_final
WHERE status IN ('Open', 'Prerelease', 'Active');

-- 2. Count active opportunities WITH component instruction URLs
SELECT 
  'Active with Component Instructions URL' as metric,
  COUNT(*) as count
FROM sbir_final
WHERE status IN ('Open', 'Prerelease', 'Active')
  AND component_instructions_download IS NOT NULL
  AND component_instructions_download != '';

-- 3. Count active opportunities WITH solicitation instruction URLs
SELECT 
  'Active with Solicitation Instructions URL' as metric,
  COUNT(*) as count
FROM sbir_final
WHERE status IN ('Open', 'Prerelease', 'Active')
  AND solicitation_instructions_download IS NOT NULL
  AND solicitation_instructions_download != '';

-- 4. Count active opportunities WITH BOTH instruction URLs
SELECT 
  'Active with BOTH Instruction URLs' as metric,
  COUNT(*) as count
FROM sbir_final
WHERE status IN ('Open', 'Prerelease', 'Active')
  AND component_instructions_download IS NOT NULL
  AND component_instructions_download != ''
  AND solicitation_instructions_download IS NOT NULL
  AND solicitation_instructions_download != '';

-- 5. Count active opportunities WITH consolidated instructions generated
SELECT 
  'Active with Consolidated Instructions Generated' as metric,
  COUNT(*) as count
FROM sbir_final
WHERE status IN ('Open', 'Prerelease', 'Active')
  AND consolidated_instructions_url IS NOT NULL
  AND instructions_plain_text IS NOT NULL;

-- 6. List active opportunities WITHOUT consolidated instructions
SELECT 
  topic_number,
  title,
  status,
  sponsor_component,
  component_instructions_download IS NOT NULL AND component_instructions_download != '' as has_component_url,
  solicitation_instructions_download IS NOT NULL AND solicitation_instructions_download != '' as has_solicitation_url,
  consolidated_instructions_url IS NOT NULL as has_consolidated
FROM sbir_final
WHERE status IN ('Open', 'Prerelease', 'Active')
  AND (consolidated_instructions_url IS NULL OR instructions_plain_text IS NULL)
ORDER BY sponsor_component, topic_number
LIMIT 50;

-- 7. Sample of opportunities WITH instruction URLs but NO consolidated instructions
SELECT 
  topic_number,
  title,
  component_instructions_download,
  solicitation_instructions_download
FROM sbir_final
WHERE status IN ('Open', 'Prerelease', 'Active')
  AND (component_instructions_download IS NOT NULL OR solicitation_instructions_download IS NOT NULL)
  AND consolidated_instructions_url IS NULL
LIMIT 10;

