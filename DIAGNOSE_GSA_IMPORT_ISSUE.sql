-- Check for duplicate contract numbers (why so few made it in)
SELECT 
  'Duplicate Analysis' as check_type,
  COUNT(*) as total_records,
  COUNT(DISTINCT contract_number) as unique_contracts,
  COUNT(*) - COUNT(DISTINCT contract_number) as potential_duplicates
FROM gsa_schedule_holders;

-- Check a sample to see what business type data looks like
SELECT 
  'Sample Records' as check_type,
  company_name,
  contract_number,
  small_business,
  woman_owned,
  veteran_owned,
  CASE 
    WHEN additional_data::text ILIKE '%small%business%' THEN 'Has SB in additional_data'
    WHEN additional_data::text ILIKE '%woman%' THEN 'Has woman in additional_data'
    ELSE 'No cert data visible'
  END as cert_check
FROM gsa_schedule_holders
LIMIT 10;

-- Check what's in additional_data
SELECT 
  'Additional Data Sample' as check_type,
  company_name,
  jsonb_pretty(additional_data) as additional_data_sample
FROM gsa_schedule_holders
WHERE additional_data IS NOT NULL
LIMIT 3;

