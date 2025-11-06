-- Check what's in the fpds_contracts table for values

-- 1. Check if base_and_exercised_options_value exists and has data
SELECT 
  'Total contracts' as metric,
  COUNT(*)::text as value
FROM fpds_contracts
UNION ALL
SELECT 
  'With base_and_exercised_options_value NOT NULL',
  COUNT(*)::text
FROM fpds_contracts
WHERE base_and_exercised_options_value IS NOT NULL
UNION ALL
SELECT 
  'With base_and_exercised_options_value > 0',
  COUNT(*)::text
FROM fpds_contracts
WHERE base_and_exercised_options_value > 0
UNION ALL
SELECT 
  'With dollars_obligated > 0',
  COUNT(*)::text
FROM fpds_contracts
WHERE dollars_obligated > 0;

-- 2. Show sample values
SELECT 
  vendor_name,
  base_and_exercised_options_value,
  dollars_obligated,
  action_obligation,
  date_signed
FROM fpds_contracts
WHERE vendor_name IS NOT NULL
LIMIT 20;

-- 3. Check column names (might be different)
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'fpds_contracts'
  AND column_name ILIKE '%value%' OR column_name ILIKE '%amount%' OR column_name ILIKE '%oblig%'
ORDER BY column_name;
