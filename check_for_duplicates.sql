-- ============================================
-- Check for Duplicate Contracts
-- ============================================
-- This checks if UPSERT is working correctly
-- (there should be NO duplicates!)
-- ============================================

-- 1. Check for any duplicates
SELECT 
  transaction_number,
  COUNT(*) as duplicate_count,
  STRING_AGG(id::text, ', ') as duplicate_ids
FROM fpds_contracts
GROUP BY transaction_number
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC
LIMIT 50;

-- If this returns EMPTY = GOOD! No duplicates.
-- If this returns rows = BAD! UPSERT is broken.

-- 2. Summary stats
SELECT 
  COUNT(*) as total_rows,
  COUNT(DISTINCT transaction_number) as unique_contracts,
  COUNT(*) - COUNT(DISTINCT transaction_number) as duplicate_rows
FROM fpds_contracts;

-- 3. Check specific date for duplicates
SELECT 
  DATE(date_signed) as date,
  COUNT(*) as total_records,
  COUNT(DISTINCT transaction_number) as unique_contracts,
  COUNT(*) - COUNT(DISTINCT transaction_number) as duplicates
FROM fpds_contracts
WHERE date_signed >= '2025-10-31'
  AND date_signed < '2025-11-01'
GROUP BY DATE(date_signed);
