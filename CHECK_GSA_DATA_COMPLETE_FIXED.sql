-- ============================================
-- GSA MAS DATA VERIFICATION - ONE QUERY
-- Shows everything in a single output table
-- ============================================

WITH stats AS (
  SELECT 
    COUNT(*) as total_contractors,
    COUNT(DISTINCT primary_sin) as unique_sins,
    COUNT(DISTINCT company_state) as states_covered,
    COUNT(DISTINCT contract_number) as unique_contracts,
    COUNT(vendor_uei) as has_uei,
    COUNT(website) as has_website,
    COUNT(primary_contact_email) as has_email,
    COUNT(additional_data) as has_additional_data,
    COUNT(CASE WHEN small_business = true THEN 1 END) as small_businesses,
    COUNT(CASE WHEN woman_owned = true THEN 1 END) as woman_owned,
    COUNT(CASE WHEN veteran_owned = true THEN 1 END) as veteran_owned,
    COUNT(CASE WHEN eight_a_program = true THEN 1 END) as eight_a,
    COUNT(CASE WHEN contract_expiration_date > CURRENT_DATE THEN 1 END) as active_contracts
  FROM gsa_schedule_holders
),
top_sins AS (
  SELECT 
    unnest(sin_codes) as sin,
    COUNT(*) as contractor_count
  FROM gsa_schedule_holders
  GROUP BY sin
  ORDER BY contractor_count DESC
  LIMIT 10
),
state_breakdown AS (
  SELECT 
    company_state,
    COUNT(*) as contractors
  FROM gsa_schedule_holders
  WHERE company_state IS NOT NULL
  GROUP BY company_state
  ORDER BY contractors DESC
  LIMIT 10
),
all_data AS (
  SELECT 1 as sort_order, 'OVERALL TOTALS' as section, 'Total Contractors' as metric, total_contractors::text as value FROM stats
  UNION ALL SELECT 1, 'OVERALL TOTALS', 'Unique SINs', unique_sins::text FROM stats
  UNION ALL SELECT 1, 'OVERALL TOTALS', 'Unique Contracts', unique_contracts::text FROM stats
  UNION ALL SELECT 1, 'OVERALL TOTALS', 'States Covered', states_covered::text FROM stats
  UNION ALL SELECT 1, 'OVERALL TOTALS', 'Active Contracts', active_contracts::text FROM stats
  UNION ALL SELECT 1.5, '', '', ''
  UNION ALL SELECT 2, 'DATA COMPLETENESS', 'Has UEI', has_uei::text FROM stats
  UNION ALL SELECT 2, 'DATA COMPLETENESS', 'Has Website', has_website::text FROM stats
  UNION ALL SELECT 2, 'DATA COMPLETENESS', 'Has Email', has_email::text FROM stats
  UNION ALL SELECT 2, 'DATA COMPLETENESS', 'Has Pricing Data', has_additional_data::text FROM stats
  UNION ALL SELECT 2.5, '', '', ''
  UNION ALL SELECT 3, 'BUSINESS TYPES', 'Small Business', small_businesses::text FROM stats
  UNION ALL SELECT 3, 'BUSINESS TYPES', 'Woman Owned', woman_owned::text FROM stats
  UNION ALL SELECT 3, 'BUSINESS TYPES', 'Veteran Owned', veteran_owned::text FROM stats
  UNION ALL SELECT 3, 'BUSINESS TYPES', '8(a) Program', eight_a::text FROM stats
  UNION ALL SELECT 3.5, '', '', ''
  UNION ALL SELECT 4, 'TOP 10 SINs BY CONTRACTORS', sin, contractor_count::text FROM top_sins
  UNION ALL SELECT 4.5, '', '', ''
  UNION ALL SELECT 5, 'TOP 10 STATES BY CONTRACTORS', company_state, contractors::text FROM state_breakdown
)

SELECT section, metric, value
FROM all_data
ORDER BY sort_order, metric;

