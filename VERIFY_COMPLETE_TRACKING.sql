-- =====================================================
-- VERIFY COMPLETE TRACKING SYSTEM
-- Run after scraping to see the full picture
-- =====================================================

-- 1. Summary counts
SELECT 
  (SELECT COUNT(*) FROM dod_contract_news) as total_contracts,
  (SELECT COUNT(*) FROM dod_contract_team_members) as team_member_rows,
  (SELECT COUNT(*) FROM dod_contract_performance_locations) as location_rows,
  (SELECT COUNT(*) FROM dod_contract_team_members WHERE work_share_percentage IS NOT NULL) as team_members_with_percent,
  (SELECT COUNT(*) FROM dod_contract_performance_locations WHERE work_percentage IS NOT NULL) as locations_with_percent;

-- 2. Team members breakdown
SELECT 
  '=== TEAM MEMBERS ===' as section,
  company_name,
  team_role,
  work_share_percentage,
  award_amount,
  weighted_award_amount,
  contract_number
FROM dod_contract_team_members
ORDER BY award_amount DESC
LIMIT 10;

-- 3. Performance locations breakdown
SELECT 
  '=== PERFORMANCE LOCATIONS ===' as section,
  location_city,
  location_state,
  work_percentage,
  award_amount,
  weighted_award_amount,
  vendor_name,
  contract_number
FROM dod_contract_performance_locations
ORDER BY weighted_award_amount DESC NULLS LAST
LIMIT 10;

-- 4. Top states by value
SELECT 
  '=== TOP STATES ===' as section,
  location_state,
  COUNT(*) as contracts,
  SUM(weighted_award_amount)::NUMERIC(15,2) as total_value,
  AVG(work_percentage)::NUMERIC(5,2) as avg_percentage
FROM dod_contract_performance_locations
WHERE location_state IS NOT NULL
GROUP BY location_state
ORDER BY total_value DESC NULLS LAST
LIMIT 10;

-- 5. Company roles (prime vs sub)
SELECT 
  '=== COMPANY ROLES ===' as section,
  team_role,
  COUNT(*) as count,
  COUNT(*) FILTER (WHERE work_share_percentage IS NOT NULL) as with_percentage,
  SUM(award_amount)::NUMERIC(15,2) as total_contract_value,
  SUM(weighted_award_amount)::NUMERIC(15,2) as total_weighted_value
FROM dod_contract_team_members
GROUP BY team_role
ORDER BY count DESC;

-- 6. Sample complete breakdown
SELECT 
  '=== SAMPLE COMPLETE BREAKDOWN ===' as section,
  contract_number,
  vendor_name,
  award_amount,
  team_breakdown,
  location_breakdown
FROM contract_complete_breakdown
LIMIT 3;

-- 7. Verification checks
SELECT 
  '=== VERIFICATION ===' as section,
  CASE 
    WHEN (SELECT COUNT(*) FROM dod_contract_team_members) > 0 
    THEN '✅ Team members tracked'
    ELSE '❌ No team members'
  END as team_check,
  CASE 
    WHEN (SELECT COUNT(*) FROM dod_contract_performance_locations) > 0 
    THEN '✅ Locations tracked'
    ELSE '❌ No locations'
  END as location_check,
  CASE 
    WHEN (SELECT COUNT(*) FROM dod_contract_performance_locations WHERE weighted_award_amount IS NOT NULL) > 0 
    THEN '✅ Weighted calculations working'
    ELSE '⚠️ No weighted values'
  END as calculation_check;

-- =====================================================
-- EXPECTED RESULTS:
-- =====================================================
-- Team members: 2+ rows (G.S.E Dynamics prime + General Dynamics prime + Northrop Grumman sub)
-- Locations: 4+ rows (Norfolk, Bremerton, Kittery, Pearl Harbor from G.S.E contract)
-- Top states: Virginia, Washington, Maine, Hawaii
-- Weighted values: Calculated for all locations with percentages
-- =====================================================

