-- Check if contractors have multiple SINs (proving aggregation works)

SELECT 
  'Contractors with Multiple SINs' as metric,
  COUNT(*) as count
FROM gsa_schedule_holders
WHERE array_length(sin_codes, 1) > 1;

-- Show examples of contractors on multiple SINs
SELECT 
  company_name,
  contract_number,
  company_state,
  array_length(sin_codes, 1) as num_sins,
  sin_codes
FROM gsa_schedule_holders
WHERE array_length(sin_codes, 1) > 3
ORDER BY array_length(sin_codes, 1) DESC
LIMIT 10;

-- Average SINs per contractor
SELECT 
  'Average SINs per contractor' as metric,
  ROUND(AVG(array_length(sin_codes, 1)), 2) as avg_sins
FROM gsa_schedule_holders;

