-- ============================================
-- QUICK 2025 Data Check (Paste into Supabase)
-- ============================================

-- HOW MANY CONTRACTS DO I HAVE?
SELECT 
  COUNT(*) as "✅ Total Contracts",
  COUNT(DISTINCT vendor_name) as "🏢 Unique Vendors",
  ROUND(AVG(data_quality_score), 1) as "⭐ Avg Quality Score",
  MIN(date_signed::date) as "📅 Earliest Date",
  MAX(date_signed::date) as "📅 Latest Date",
  SUM(total_amount::numeric)::money as "💰 Total Value"
FROM fpds_contracts
WHERE data_source = 'usaspending.gov-full'
  AND date_signed >= '2025-01-01'
  AND date_signed <= '2025-10-31';

-- HOW MANY FAILED (NEED RETRY)?
SELECT 
  COUNT(*) as "❌ Total Failed",
  COUNT(DISTINCT contract_id) as "🔁 Unique IDs to Retry"
FROM fpds_failed_contracts
WHERE date_range LIKE '%2025%';

-- QUALITY BREAKDOWN
SELECT 
  CASE 
    WHEN data_quality_score >= 90 THEN '🟢 Excellent (90-100)'
    WHEN data_quality_score >= 70 THEN '🟡 Good (70-89)'
    ELSE '🔴 Needs Review (<70)'
  END as "Quality Level",
  COUNT(*) as "Contracts"
FROM fpds_contracts
WHERE data_source = 'usaspending.gov-full'
  AND date_signed >= '2025-01-01'
  AND date_signed <= '2025-10-31'
GROUP BY 
  CASE 
    WHEN data_quality_score >= 90 THEN '🟢 Excellent (90-100)'
    WHEN data_quality_score >= 70 THEN '🟡 Good (70-89)'
    ELSE '🔴 Needs Review (<70)'
  END;

-- COVERAGE BY MONTH
SELECT 
  TO_CHAR(date_signed, 'YYYY-MM') as "Month",
  COUNT(*) as "Contracts"
FROM fpds_contracts
WHERE data_source = 'usaspending.gov-full'
  AND date_signed >= '2025-01-01'
  AND date_signed <= '2025-10-31'
GROUP BY TO_CHAR(date_signed, 'YYYY-MM')
ORDER BY "Month" DESC;

