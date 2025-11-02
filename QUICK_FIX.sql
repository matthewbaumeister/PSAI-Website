-- =====================================================
-- QUICK FIX: Update weighted values manually
-- Run this if trigger didn't fire on existing data
-- =====================================================

-- 1. Fix performance locations
UPDATE dod_contract_performance_locations
SET weighted_award_amount = (award_amount * (work_percentage / 100.0))::NUMERIC(15,2)
WHERE work_percentage IS NOT NULL;

-- 2. Fix team members
UPDATE dod_contract_team_members
SET weighted_award_amount = (award_amount * (work_share_percentage / 100.0))::NUMERIC(15,2)
WHERE work_share_percentage IS NOT NULL;

-- 3. Verify
SELECT 
  'Performance Locations' as table_name,
  COUNT(*) FILTER (WHERE weighted_award_amount IS NOT NULL) as with_weighted_value,
  SUM(weighted_award_amount)::NUMERIC(15,2) as total_value
FROM dod_contract_performance_locations
UNION ALL
SELECT 
  'Team Members' as table_name,
  COUNT(*) FILTER (WHERE weighted_award_amount IS NOT NULL) as with_weighted_value,
  SUM(weighted_award_amount)::NUMERIC(15,2) as total_value
FROM dod_contract_team_members;

-- 4. Show results
SELECT 
  location_state,
  location_city,
  work_percentage,
  weighted_award_amount
FROM dod_contract_performance_locations
WHERE weighted_award_amount IS NOT NULL
ORDER BY weighted_award_amount DESC
LIMIT 10;

