-- =====================================================
-- CHECK TEAMING DATA (Run this now!)
-- =====================================================

-- 1. Check team members table
SELECT 
  'Team Members Inserted' as check_name,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) = 0 THEN '⚠️ No team members (percentages might not be in text)'
    ELSE '✅ Team members found!'
  END as status
FROM dod_contract_team_members;

-- 2. Show team members details (if any)
SELECT 
  company_name,
  team_role,
  work_share_percentage,
  award_amount,
  weighted_award_amount,
  contract_number
FROM dod_contract_team_members
ORDER BY weighted_award_amount DESC NULLS LAST;

-- 3. Check the teaming contract (G.S.E Dynamics)
SELECT 
  vendor_name,
  award_amount,
  is_teaming,
  team_members,
  prime_contractor,
  subcontractors,
  team_work_share,
  SUBSTRING(raw_paragraph, 1, 500) as paragraph_sample
FROM dod_contract_news
WHERE is_teaming = true;

-- 4. Check if any contracts mention percentages (work share or location)
SELECT 
  vendor_name,
  award_amount,
  is_teaming,
  CASE 
    WHEN raw_paragraph ~ 'team' THEN '✅ mentions "team"'
    WHEN raw_paragraph ~ 'subcontractor' THEN '✅ mentions "subcontractor"'
    WHEN raw_paragraph ~ 'prime' THEN '✅ mentions "prime"'
    ELSE '❌ no teaming keywords'
  END as teaming_keywords,
  CASE 
    WHEN raw_paragraph ~ '\d+%' THEN '✅ has percentages'
    ELSE '❌ no percentages'
  END as has_percentages,
  SUBSTRING(raw_paragraph, 1, 300) as text_sample
FROM dod_contract_news
WHERE raw_paragraph ~ '\d+%'
ORDER BY award_amount DESC
LIMIT 10;

-- 5. Summary
SELECT 
  COUNT(*) as total_contracts,
  COUNT(*) FILTER (WHERE is_teaming = true) as teaming_contracts,
  COUNT(*) FILTER (WHERE team_work_share IS NOT NULL) as contracts_with_work_share,
  (SELECT COUNT(*) FROM dod_contract_team_members) as team_members_in_table,
  COUNT(*) FILTER (WHERE raw_paragraph ~ '\d+%') as contracts_mentioning_percentages
FROM dod_contract_news;

-- =====================================================
-- INTERPRETATION:
-- =====================================================
-- If team_members_in_table = 0:
--   → The contracts probably don't mention work share percentages
--   → Work share data might be in performance locations (e.g., "Virginia, 35%")
--   → This is EXPECTED for most DoD contracts
--
-- If team_members_in_table > 0:
--   → ✅ SUCCESS! Teaming percentages were captured
--   → Check if companies look correct (not states)
-- =====================================================

