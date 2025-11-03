-- ============================================
-- Contract Modifications Analysis
-- ============================================
-- Analyze relationships between base contracts and modifications

-- ============================================
-- 1. Find Contracts with Multiple Modifications
-- ============================================
-- See which contracts have the most mods
SELECT 
  piid as contract_id,
  vendor_name,
  COUNT(*) as total_modifications,
  STRING_AGG(mod_number, ', ' ORDER BY mod_number) as all_mods,
  MIN(date_signed) as original_date,
  MAX(date_signed) as latest_mod_date,
  MIN(current_total_value_of_award::numeric) as original_value,
  MAX(current_total_value_of_award::numeric) as current_value,
  MAX(current_total_value_of_award::numeric) - MIN(current_total_value_of_award::numeric) as value_increase
FROM fpds_contracts
WHERE last_modified_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY piid, vendor_name
HAVING COUNT(*) > 1
ORDER BY total_modifications DESC
LIMIT 20;

-- ============================================
-- 2. Track Contract Value Growth Over Mods
-- ============================================
-- See how contract values change with each modification
SELECT 
  piid,
  vendor_name,
  mod_number,
  date_signed,
  current_total_value_of_award,
  LAG(current_total_value_of_award::numeric) OVER (
    PARTITION BY piid 
    ORDER BY COALESCE(mod_number, '0')
  ) as previous_value,
  current_total_value_of_award::numeric - LAG(current_total_value_of_award::numeric) OVER (
    PARTITION BY piid 
    ORDER BY COALESCE(mod_number, '0')
  ) as value_change
FROM fpds_contracts
WHERE piid IN (
  SELECT piid 
  FROM fpds_contracts 
  WHERE last_modified_date >= CURRENT_DATE - INTERVAL '30 days'
  GROUP BY piid 
  HAVING COUNT(*) > 1
)
ORDER BY piid, COALESCE(mod_number, '0');

-- ============================================
-- 3. Find Base Contracts (No Mods)
-- ============================================
-- Contracts without modifications
SELECT 
  piid,
  vendor_name,
  contracting_agency_name,
  current_total_value_of_award,
  date_signed,
  mod_number
FROM fpds_contracts
WHERE (mod_number IS NULL OR mod_number = '' OR mod_number = '0')
  AND last_modified_date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY date_signed DESC
LIMIT 20;

-- ============================================
-- 4. Modification Statistics
-- ============================================
-- Overall mod stats
SELECT 
  COUNT(DISTINCT piid) as total_unique_contracts,
  COUNT(*) as total_transactions,
  COUNT(*) - COUNT(DISTINCT piid) as total_modifications,
  ROUND(100.0 * (COUNT(*) - COUNT(DISTINCT piid)) / COUNT(DISTINCT piid), 2) as avg_mods_per_contract,
  COUNT(*) FILTER (WHERE mod_number IS NOT NULL AND mod_number != '' AND mod_number != '0') as contracts_with_mods,
  COUNT(*) FILTER (WHERE mod_number IS NULL OR mod_number = '' OR mod_number = '0') as contracts_without_mods
FROM fpds_contracts
WHERE last_modified_date >= CURRENT_DATE - INTERVAL '30 days';

-- ============================================
-- 5. Task Orders (Parent-Child Relationships)
-- ============================================
-- Find task orders linked to parent IDVs
SELECT 
  c.piid as task_order_id,
  c.referenced_idv_piid as parent_contract_id,
  c.vendor_name,
  c.current_total_value_of_award as task_order_value,
  p.current_total_value_of_award as parent_contract_value,
  c.date_signed as task_order_date,
  p.date_signed as parent_contract_date
FROM fpds_contracts c
LEFT JOIN fpds_contracts p ON c.referenced_idv_piid = p.piid
WHERE c.referenced_idv_piid IS NOT NULL
  AND c.last_modified_date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY c.date_signed DESC
LIMIT 20;

-- ============================================
-- 6. DoD Contract News - Check for Updates
-- ============================================
-- See if DoD news articles get updated (since Sep 30 shutdown)
SELECT 
  DATE(published_date) as publication_date,
  COUNT(DISTINCT article_url) as unique_articles,
  COUNT(*) as total_contracts,
  MAX(scraped_at) as first_scraped,
  MAX(updated_at) as last_updated
FROM dod_contract_news
WHERE published_date >= '2024-09-01'
GROUP BY DATE(published_date)
ORDER BY publication_date DESC
LIMIT 30;

-- ============================================
-- 7. Find Contracts Modified After Original Award
-- ============================================
-- Detect contracts that were updated later
-- Version A: Only recently scraped data (last 60 days)
SELECT 
  piid,
  vendor_name,
  MIN(date_signed) as original_award_date,
  MAX(date_signed) as latest_modification_date,
  MAX(date_signed) - MIN(date_signed) as days_between,
  COUNT(*) as number_of_mods,
  STRING_AGG(COALESCE(mod_number, 'BASE'), ' -> ' ORDER BY date_signed) as modification_sequence,
  MAX(last_modified_date) as last_scraped
FROM fpds_contracts
WHERE last_modified_date >= CURRENT_DATE - INTERVAL '60 days'
GROUP BY piid, vendor_name
HAVING COUNT(*) > 1 AND MAX(date_signed) - MIN(date_signed) > 30  -- DATE subtraction returns integer days
ORDER BY days_between DESC
LIMIT 20;

-- Version B: ALL contracts with modifications (no date filter)
SELECT 
  piid,
  vendor_name,
  MIN(date_signed) as original_award_date,
  MAX(date_signed) as latest_modification_date,
  MAX(date_signed) - MIN(date_signed) as days_between,
  COUNT(*) as number_of_mods,
  STRING_AGG(COALESCE(mod_number, 'BASE'), ' -> ' ORDER BY date_signed) as modification_sequence,
  MAX(last_modified_date) as last_scraped
FROM fpds_contracts
GROUP BY piid, vendor_name
HAVING COUNT(*) > 1 AND MAX(date_signed) - MIN(date_signed) > 30
ORDER BY days_between DESC
LIMIT 50;

-- ============================================
-- 8. Cross-Reference FPDS with DoD News
-- ============================================
-- See if DoD news contracts match FPDS records
SELECT 
  d.vendor_name as dod_news_vendor,
  d.award_amount_text as dod_news_value,
  d.published_date,
  f.piid as fpds_contract_id,
  f.current_total_value_of_award as fpds_value,
  f.mod_number,
  f.date_signed as fpds_date,
  ABS(d.published_date - f.date_signed) as days_apart
FROM dod_contract_news d
LEFT JOIN fpds_contracts f 
  ON LOWER(d.vendor_name) = LOWER(f.vendor_name)
  AND ABS(d.published_date - f.date_signed) < 7  -- Within 7 days (DATE - DATE = integer)
WHERE d.published_date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY d.published_date DESC
LIMIT 20;

