-- Clear old analysis data for the 2 opportunities with outdated format
-- This will remove the old data and allow clean regeneration

-- STEP 1: Verify which ones will be cleared
SELECT 
  topic_id,
  topic_number,
  title,
  instructions_generated_at,
  CASE 
    WHEN instructions_checklist->>'proposal_phase' IS NULL THEN 'OLD (will be cleared)'
    ELSE 'NEW (will be kept)'
  END as status
FROM sbir_final
WHERE instructions_checklist IS NOT NULL
ORDER BY topic_number;

-- STEP 2: Clear the old data (run this to fix the error)
UPDATE sbir_final
SET 
  instructions_checklist = NULL,
  instructions_plain_text = NULL,
  instructions_generated_at = NULL,
  consolidated_instructions_url = NULL,
  consolidated_instructions_metadata = NULL
WHERE topic_id IN (
  '47969981acfd4adfbdfeb4cfca99c1a1_86201',  -- A254-P039
  'e3f117b663cc49da851c0d266d1f43ca_86378'   -- CBD254-011
);

-- STEP 3: Verify they were cleared
SELECT 
  topic_id,
  topic_number,
  title,
  instructions_checklist,
  instructions_generated_at
FROM sbir_final
WHERE topic_id IN (
  '47969981acfd4adfbdfeb4cfca99c1a1_86201',
  'e3f117b663cc49da851c0d266d1f43ca_86378'
);
-- Should show NULL for all instruction fields

-- STEP 4: Check overall status
SELECT 
  CASE 
    WHEN instructions_checklist IS NULL THEN 'NO ANALYSIS'
    WHEN instructions_checklist->>'proposal_phase' IS NULL THEN 'OLD FORMAT'
    ELSE 'NEW FORMAT'
  END as format_version,
  COUNT(*) as count
FROM sbir_final
WHERE status IN ('Open', 'Prerelease', 'Pre-Release', 'Active')
GROUP BY format_version
ORDER BY format_version;

