-- =====================================================
-- Check SAM.gov Opportunities Data Quality
-- =====================================================

-- Step 1: Overall Statistics
SELECT 
  COUNT(*) as total_opportunities,
  COUNT(DISTINCT notice_id) as unique_notices,
  COUNT(DISTINCT solicitation_number) as with_solicitation_number,
  COUNT(fpds_contract_id) as linked_to_fpds,
  COUNT(*) FILTER (WHERE active = true) as active_opportunities,
  MIN(posted_date) as earliest_date,
  MAX(posted_date) as latest_date
FROM sam_gov_opportunities;

-- Step 2: Test Direct Links (Get 5 to test)
SELECT 
  notice_id,
  title,
  solicitation_number,
  posted_date,
  ui_link
FROM sam_gov_opportunities
ORDER BY posted_date DESC
LIMIT 5;

-- Step 3: Opportunities by Type
SELECT 
  notice_type,
  COUNT(*) as count
FROM sam_gov_opportunities
GROUP BY notice_type
ORDER BY count DESC;

-- Step 4: Check Set-Asides
SELECT 
  type_of_set_aside_description,
  COUNT(*) as count
FROM sam_gov_opportunities
WHERE type_of_set_aside_description IS NOT NULL
GROUP BY type_of_set_aside_description
ORDER BY count DESC
LIMIT 10;

-- Step 5: Top Departments
SELECT 
  department,
  COUNT(*) as opportunities
FROM sam_gov_opportunities
WHERE department IS NOT NULL
GROUP BY department
ORDER BY opportunities DESC
LIMIT 15;

-- Step 6: Opportunities with Awards (already awarded)
SELECT 
  notice_id,
  title,
  award_number,
  awardee_name,
  award_dollars,
  award_date
FROM sam_gov_opportunities
WHERE award_number IS NOT NULL
ORDER BY award_date DESC
LIMIT 10;

-- Step 7: Data Completeness Check
SELECT 
  COUNT(*) as total,
  COUNT(title) as has_title,
  COUNT(description) as has_description,
  COUNT(solicitation_number) as has_sol_number,
  COUNT(naics_code) as has_naics,
  COUNT(department) as has_department,
  COUNT(ui_link) as has_link,
  ROUND(100.0 * COUNT(title) / COUNT(*), 1) as title_pct,
  ROUND(100.0 * COUNT(solicitation_number) / COUNT(*), 1) as sol_num_pct,
  ROUND(100.0 * COUNT(naics_code) / COUNT(*), 1) as naics_pct
FROM sam_gov_opportunities;

-- Step 8: Recent Opportunities (Last 3 Days Detail)
SELECT 
  TO_CHAR(posted_date, 'YYYY-MM-DD') as date,
  COUNT(*) as opportunities,
  COUNT(DISTINCT department) as departments,
  COUNT(solicitation_number) as with_sol_number,
  COUNT(DISTINCT naics_code) as unique_naics
FROM sam_gov_opportunities
WHERE posted_date >= CURRENT_DATE - INTERVAL '3 days'
GROUP BY TO_CHAR(posted_date, 'YYYY-MM-DD')
ORDER BY date DESC;

-- Step 9: Opportunities with Potential FPDS Matches
-- (These SHOULD link but haven't yet)
SELECT 
  s.notice_id,
  s.title,
  s.solicitation_number,
  COUNT(f.piid) as potential_fpds_matches
FROM sam_gov_opportunities s
LEFT JOIN fpds_contracts f ON s.solicitation_number = f.solicitation_id
WHERE s.solicitation_number IS NOT NULL
  AND s.solicitation_number != ''
GROUP BY s.notice_id, s.title, s.solicitation_number
HAVING COUNT(f.piid) > 0
LIMIT 20;

-- Step 10: Active Opportunities Closing Soon
SELECT 
  notice_id,
  title,
  department,
  response_deadline,
  response_deadline - NOW() as time_remaining,
  ui_link
FROM sam_gov_opportunities
WHERE active = true
  AND response_deadline > NOW()
  AND response_deadline < NOW() + INTERVAL '30 days'
ORDER BY response_deadline
LIMIT 10;

