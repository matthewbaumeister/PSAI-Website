-- Check which opportunities have old analysis data without new fields
-- Run these queries in Supabase SQL Editor

-- Query 1: Count opportunities with analysis data
SELECT 
  COUNT(*) as total_with_analysis
FROM sbir_final
WHERE instructions_checklist IS NOT NULL;

-- Query 2: Check which ones are missing new fields (OLD DATA)
SELECT 
  topic_number,
  title,
  status,
  instructions_generated_at,
  CASE 
    WHEN instructions_checklist->>'proposal_phase' IS NULL THEN 'MISSING'
    ELSE instructions_checklist->>'proposal_phase'
  END as proposal_phase_status,
  CASE 
    WHEN instructions_checklist->'toc_reconciliation' IS NULL THEN 'MISSING'
    ELSE 'EXISTS'
  END as toc_reconciliation_status
FROM sbir_final
WHERE instructions_checklist IS NOT NULL
ORDER BY instructions_generated_at DESC;

-- Query 3: Count OLD vs NEW format
SELECT 
  CASE 
    WHEN instructions_checklist->>'proposal_phase' IS NULL 
      OR instructions_checklist->'toc_reconciliation' IS NULL 
    THEN 'OLD FORMAT'
    ELSE 'NEW FORMAT'
  END as format_version,
  COUNT(*) as count
FROM sbir_final
WHERE instructions_checklist IS NOT NULL
GROUP BY format_version;

-- Query 4: List only opportunities that need regeneration
SELECT 
  topic_number,
  title,
  status,
  instructions_generated_at as last_generated
FROM sbir_final
WHERE instructions_checklist IS NOT NULL
  AND (
    instructions_checklist->>'proposal_phase' IS NULL 
    OR instructions_checklist->'toc_reconciliation' IS NULL
  )
ORDER BY status, instructions_generated_at DESC;

-- Query 5: Get topic IDs for bulk regeneration API call
SELECT 
  topic_id,
  topic_number
FROM sbir_final
WHERE instructions_checklist IS NOT NULL
  AND (
    instructions_checklist->>'proposal_phase' IS NULL 
    OR instructions_checklist->'toc_reconciliation' IS NULL
  )
  AND status IN ('Open', 'Prerelease', 'Pre-Release', 'Active')
ORDER BY topic_number;

