-- CHECK SAM.GOV <-> FPDS LINKING RESULTS
-- Run after executing link_sam_to_fpds() and update_fpds_with_sam_links()

-- ============================================================
-- SECTION 1: Overall Linking Statistics
-- ============================================================

SELECT 
  '=== SAM.GOV OPPORTUNITIES LINKING STATS ===' as section;

SELECT 
  COUNT(*) as total_sam_opportunities,
  COUNT(fpds_contract_id) as linked_to_fpds,
  COUNT(*) - COUNT(fpds_contract_id) as not_linked,
  ROUND(100.0 * COUNT(fpds_contract_id) / NULLIF(COUNT(*), 0), 1) as link_percentage,
  MIN(posted_date) as earliest_opportunity,
  MAX(posted_date) as latest_opportunity
FROM sam_gov_opportunities;

-- ============================================================
-- SECTION 2: FPDS Contracts with SAM Links
-- ============================================================

SELECT 
  '=== FPDS CONTRACTS WITH SAM.GOV LINKS ===' as section;

SELECT 
  COUNT(*) as total_fpds_contracts,
  COUNT(sam_gov_opportunity_url) as with_sam_url,
  COUNT(*) - COUNT(sam_gov_opportunity_url) as without_sam_url,
  ROUND(100.0 * COUNT(sam_gov_opportunity_url) / NULLIF(COUNT(*), 0), 1) as coverage_percentage
FROM fpds_contracts;

-- ============================================================
-- SECTION 3: Sample Linked Opportunities
-- ============================================================

SELECT 
  '=== SAMPLE LINKED OPPORTUNITIES (First 10) ===' as section;

SELECT 
  s.notice_id,
  s.title,
  s.solicitation_number,
  s.posted_date,
  s.response_deadline,
  f.vendor_name as awarded_to,
  f.base_and_exercised_options_value as contract_value,
  s.ui_link as sam_opportunity_link
FROM sam_gov_opportunities s
INNER JOIN fpds_contracts f ON s.fpds_contract_id = f.id
ORDER BY s.posted_date DESC
LIMIT 10;

-- ============================================================
-- SECTION 4: Opportunities by Type
-- ============================================================

SELECT 
  '=== OPPORTUNITIES BY TYPE ===' as section;

SELECT 
  type,
  COUNT(*) as count,
  COUNT(fpds_contract_id) as linked_to_fpds,
  ROUND(100.0 * COUNT(fpds_contract_id) / COUNT(*), 1) as link_pct
FROM sam_gov_opportunities
GROUP BY type
ORDER BY count DESC;

-- ============================================================
-- SECTION 5: Opportunities by Set-Aside
-- ============================================================

SELECT 
  '=== OPPORTUNITIES BY SET-ASIDE ===' as section;

SELECT 
  set_aside,
  COUNT(*) as count,
  COUNT(fpds_contract_id) as linked_to_fpds,
  ROUND(100.0 * COUNT(fpds_contract_id) / COUNT(*), 1) as link_pct
FROM sam_gov_opportunities
WHERE set_aside IS NOT NULL
GROUP BY set_aside
ORDER BY count DESC
LIMIT 10;

-- ============================================================
-- SECTION 6: Recent Opportunities (Last 7 Days)
-- ============================================================

SELECT 
  '=== RECENT OPPORTUNITIES (Last 7 Days) ===' as section;

SELECT 
  DATE(posted_date) as date,
  COUNT(*) as opportunities_posted,
  COUNT(fpds_contract_id) as already_awarded,
  COUNT(*) - COUNT(fpds_contract_id) as still_open
FROM sam_gov_opportunities
WHERE posted_date >= NOW() - INTERVAL '7 days'
GROUP BY DATE(posted_date)
ORDER BY date DESC;

-- ============================================================
-- SECTION 7: Top Agencies
-- ============================================================

SELECT 
  '=== TOP 10 AGENCIES ===' as section;

SELECT 
  department_name,
  COUNT(*) as opportunities,
  COUNT(fpds_contract_id) as linked_awards,
  ROUND(100.0 * COUNT(fpds_contract_id) / COUNT(*), 1) as award_rate_pct
FROM sam_gov_opportunities
WHERE department_name IS NOT NULL
GROUP BY department_name
ORDER BY opportunities DESC
LIMIT 10;

-- ============================================================
-- SECTION 8: Data Quality Check
-- ============================================================

SELECT 
  '=== DATA QUALITY CHECK ===' as section;

SELECT 
  COUNT(*) as total_records,
  COUNT(notice_id) as with_notice_id,
  COUNT(title) as with_title,
  COUNT(solicitation_number) as with_solicitation_number,
  COUNT(posted_date) as with_posted_date,
  COUNT(ui_link) as with_ui_link,
  COUNT(department_name) as with_department,
  ROUND(100.0 * COUNT(solicitation_number) / COUNT(*), 1) as solicitation_coverage_pct
FROM sam_gov_opportunities;

