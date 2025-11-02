-- =====================================================
-- CHECK TEAMING DETAILS - What do we have?
-- =====================================================

-- 1. Show the 2 teaming contracts we found
SELECT 
  '1. TEAMING CONTRACTS FOUND' as section,
  vendor_name,
  is_teaming,
  prime_contractor,
  team_members,
  subcontractors,
  award_amount,
  SUBSTRING(raw_paragraph, 1, 500) as paragraph_sample
FROM dod_contract_news
WHERE is_teaming = true
ORDER BY award_amount DESC;

-- 2. Check if work share percentages are mentioned in text
SELECT 
  '2. CONTRACTS WITH PERCENTAGE KEYWORDS' as section,
  vendor_name,
  is_teaming,
  SUBSTRING(raw_paragraph, 1, 400) as sample
FROM dod_contract_news
WHERE raw_paragraph ~* 'percent|%|\bshare\b|portion|split'
  AND (is_teaming = true OR raw_paragraph ~* 'team|subcontractor|prime')
LIMIT 5;

-- 3. Check performance_location_breakdown for work share examples
SELECT 
  '3. PERFORMANCE LOCATION BREAKDOWN (has percentages)' as section,
  vendor_name,
  performance_location_breakdown
FROM dod_contract_news
WHERE performance_location_breakdown IS NOT NULL
  AND jsonb_array_length(performance_location_breakdown) > 0
LIMIT 3;

