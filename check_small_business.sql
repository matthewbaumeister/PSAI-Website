-- Check small business flags from CONTRACTS vs SAM.gov

-- From FPDS contracts (ground truth)
SELECT 
  'From Contract Data (FPDS)' as source,
  company_name,
  small_business as is_small_business,
  total_contracts,
  TO_CHAR(total_value, '$999,999,999,999') as total_value
FROM fpds_company_stats
WHERE company_name IN (
  'THE BOEING COMPANY',
  'NATIONAL TECHNOLOGY & ENGINEERING SOLUTIONS OF SANDIA LLC',
  'LAWRENCE LIVERMORE NATIONAL SECURITY LLC',
  'TRIAD NATIONAL SECURITY LLC'
)
ORDER BY total_value DESC;

-- From SAM.gov enrichment
SELECT 
  'From SAM.gov Enrichment' as source,
  company_name,
  is_small_business,
  null::integer as total_contracts,
  null::text as total_value
FROM company_intelligence
WHERE company_name IN (
  'THE BOEING COMPANY',
  'NATIONAL TECHNOLOGY & ENGINEERING SOLUTIONS OF SANDIA LLC',
  'LAWRENCE LIVERMORE NATIONAL SECURITY LLC',
  'TRIAD NATIONAL SECURITY LLC'
)
ORDER BY id;
