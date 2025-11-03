-- ============================================
-- Check FPDS Contract Modification Data
-- ============================================
-- Diagnose why mod_number might be null and how much data exists

-- ============================================
-- 1. Overall FPDS Data Statistics
-- ============================================
SELECT 
  COUNT(*) as total_fpds_contracts,
  COUNT(DISTINCT piid) as unique_base_contracts,
  COUNT(*) - COUNT(DISTINCT piid) as total_modifications,
  MIN(last_modified_date) as earliest_scrape,
  MAX(last_modified_date) as latest_scrape,
  MIN(date_signed) as earliest_contract,
  MAX(date_signed) as latest_contract
FROM fpds_contracts;

-- ============================================
-- 2. Check mod_number Population
-- ============================================
SELECT 
  COUNT(*) as total_contracts,
  COUNT(*) FILTER (WHERE mod_number IS NOT NULL AND mod_number != '' AND mod_number != '0') as has_mod_number,
  COUNT(*) FILTER (WHERE mod_number IS NULL OR mod_number = '' OR mod_number = '0') as no_mod_number,
  ROUND(100.0 * COUNT(*) FILTER (WHERE mod_number IS NOT NULL AND mod_number != '' AND mod_number != '0') / COUNT(*), 2) as pct_with_mod_number
FROM fpds_contracts;

-- ============================================
-- 3. Contracts Scraped in Last 60 Days
-- ============================================
SELECT 
  DATE(last_modified_date) as scrape_date,
  COUNT(*) as contracts_scraped,
  COUNT(DISTINCT piid) as unique_contracts
FROM fpds_contracts
WHERE last_modified_date >= CURRENT_DATE - INTERVAL '60 days'
GROUP BY DATE(last_modified_date)
ORDER BY scrape_date DESC;

-- ============================================
-- 4. Find Contracts with Multiple Transactions (ANY TIME)
-- ============================================
-- Remove the 60-day filter to see all contracts with mods
SELECT 
  piid,
  vendor_name,
  COUNT(*) as transaction_count,
  MIN(date_signed) as first_transaction,
  MAX(date_signed) as latest_transaction,
  MAX(date_signed) - MIN(date_signed) as days_between,
  STRING_AGG(DISTINCT mod_number, ', ' ORDER BY mod_number) as all_mod_numbers,
  MIN(last_modified_date) as first_scraped,
  MAX(last_modified_date) as last_scraped
FROM fpds_contracts
GROUP BY piid, vendor_name
HAVING COUNT(*) > 1
ORDER BY transaction_count DESC
LIMIT 50;

-- ============================================
-- 5. Sample of Contracts WITH mod_number
-- ============================================
SELECT 
  piid,
  mod_number,
  vendor_name,
  date_signed,
  current_total_value_of_award,
  last_modified_date
FROM fpds_contracts
WHERE mod_number IS NOT NULL 
  AND mod_number != '' 
  AND mod_number != '0'
ORDER BY last_modified_date DESC
LIMIT 20;

-- ============================================
-- 6. Check Recent Contracts for Mods (Last 7 Days of Scraping)
-- ============================================
SELECT 
  piid,
  COUNT(*) as versions,
  STRING_AGG(COALESCE(mod_number, 'NULL'), ' | ' ORDER BY date_signed) as mod_sequence,
  MIN(date_signed) as first_date,
  MAX(date_signed) as latest_date,
  vendor_name
FROM fpds_contracts
WHERE last_modified_date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY piid, vendor_name
HAVING COUNT(*) > 1
ORDER BY versions DESC
LIMIT 30;

-- ============================================
-- 7. Contracts by Date Signed (Recent Awards)
-- ============================================
-- Check if you have recent contract awards (2024-2025)
SELECT 
  DATE_TRUNC('month', date_signed)::date as contract_month,
  COUNT(*) as contracts,
  COUNT(DISTINCT piid) as unique_contracts,
  COUNT(*) FILTER (WHERE mod_number IS NOT NULL AND mod_number != '' AND mod_number != '0') as with_mods
FROM fpds_contracts
WHERE date_signed >= '2024-01-01'
GROUP BY DATE_TRUNC('month', date_signed)
ORDER BY contract_month DESC;

-- ============================================
-- 8. Check for PIID Duplicates (Same Contract, Multiple Records)
-- ============================================
-- These SHOULD have different mod_numbers if they're true modifications
SELECT 
  piid,
  COUNT(*) as duplicate_count,
  STRING_AGG(DISTINCT COALESCE(mod_number, 'NULL'), ', ') as mod_numbers,
  STRING_AGG(DISTINCT transaction_number, ', ') as transaction_numbers
FROM fpds_contracts
GROUP BY piid
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC
LIMIT 30;

