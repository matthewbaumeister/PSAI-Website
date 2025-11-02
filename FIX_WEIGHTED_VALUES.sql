-- =====================================================
-- FIX WEIGHTED VALUES
-- Diagnose and fix the weighted value calculation
-- =====================================================

-- Step 1: Check if percentages exist in the data
SELECT 
  'Performance Locations with %' as check_name,
  COUNT(*) as total_rows,
  COUNT(*) FILTER (WHERE work_percentage IS NOT NULL) as rows_with_percentage,
  COUNT(*) FILTER (WHERE weighted_award_amount IS NOT NULL) as rows_with_weighted_value
FROM dod_contract_performance_locations;

-- Step 2: Show raw data
SELECT 
  location_city,
  location_state,
  work_percentage,
  award_amount,
  weighted_award_amount,
  CASE 
    WHEN work_percentage IS NULL THEN '❌ No percentage'
    WHEN weighted_award_amount IS NULL THEN '❌ Calculation failed'
    ELSE '✅ OK'
  END as status
FROM dod_contract_performance_locations
LIMIT 10;

-- Step 3: Check if trigger exists
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'dod_contract_performance_locations';

-- Step 4: Manually calculate to test
SELECT 
  location_city,
  location_state,
  work_percentage,
  award_amount,
  weighted_award_amount as current_value,
  (award_amount * (work_percentage / 100.0))::NUMERIC(15,2) as should_be,
  CASE 
    WHEN weighted_award_amount IS NULL AND work_percentage IS NOT NULL 
    THEN '🔧 NEEDS FIX'
    WHEN weighted_award_amount = (award_amount * (work_percentage / 100.0))::NUMERIC(15,2)
    THEN '✅ CORRECT'
    ELSE '⚠️ CHECK'
  END as calculation_status
FROM dod_contract_performance_locations
WHERE work_percentage IS NOT NULL
LIMIT 10;

-- =====================================================
-- FIX: If trigger isn't working, manually update
-- =====================================================

-- Update all existing rows with percentages
UPDATE dod_contract_performance_locations
SET weighted_award_amount = (award_amount * (work_percentage / 100.0))::NUMERIC(15,2)
WHERE work_percentage IS NOT NULL 
  AND (weighted_award_amount IS NULL OR weighted_award_amount = 0);

-- Show results
SELECT 
  'After Manual Update' as check_name,
  COUNT(*) as total_with_percentage,
  COUNT(*) FILTER (WHERE weighted_award_amount IS NOT NULL) as now_have_weighted_value,
  SUM(weighted_award_amount)::NUMERIC(15,2) as total_weighted_value
FROM dod_contract_performance_locations
WHERE work_percentage IS NOT NULL;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Show top locations by weighted value
SELECT 
  location_state,
  location_city,
  work_percentage || '%' as percentage,
  '$' || ROUND(weighted_award_amount/1000000, 2) || 'M' as weighted_value
FROM dod_contract_performance_locations
WHERE weighted_award_amount IS NOT NULL
ORDER BY weighted_award_amount DESC
LIMIT 10;

