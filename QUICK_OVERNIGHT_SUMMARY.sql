-- ============================================
-- Quick Overnight Summary (Single Query)
-- ============================================

WITH contract_stats AS (
  SELECT 
    COUNT(*) as total_contracts,
    MIN(date_signed::date) as earliest_date,
    MAX(date_signed::date) as latest_date,
    ROUND(AVG(data_quality_score), 1) as avg_quality,
    SUM(base_and_exercised_options_value) as total_value,
    COUNT(DISTINCT vendor_name) as unique_vendors,
    COUNT(DISTINCT DATE(date_signed)) as days_with_data
  FROM fpds_contracts
  WHERE data_source = 'usaspending.gov-full'
),
failure_stats AS (
  SELECT 
    COUNT(DISTINCT contract_id) as failed_contracts
  FROM fpds_failed_contracts
),
quality_breakdown AS (
  SELECT 
    COUNT(*) FILTER (WHERE data_quality_score >= 90) as excellent,
    COUNT(*) FILTER (WHERE data_quality_score >= 70 AND data_quality_score < 90) as good,
    COUNT(*) FILTER (WHERE data_quality_score < 70) as fair_poor
  FROM fpds_contracts
  WHERE data_source = 'usaspending.gov-full'
)
SELECT 
  '📊 OVERNIGHT SCRAPE RESULTS' as "Summary",
  '' as "─────────────────────",
  cs.total_contracts::text as "✅ Total Contracts",
  cs.days_with_data::text as "📅 Days Scraped",
  cs.earliest_date::text || ' → ' || cs.latest_date::text as "📆 Date Range",
  '' as "──────────────────────",
  ROUND((cs.total_contracts::numeric / (cs.total_contracts + fs.failed_contracts) * 100), 1)::text || '%' as "🎯 Success Rate",
  fs.failed_contracts::text as "❌ Failed Contracts",
  '' as "───────────────────────",
  cs.avg_quality::text as "⭐ Avg Quality Score",
  qb.excellent::text as "🟢 Excellent (90-100)",
  qb.good::text as "🟡 Good (70-89)",
  qb.fair_poor::text as "🟠 Fair/Poor (<70)",
  '' as "────────────────────────",
  cs.unique_vendors::text as "🏢 Unique Vendors",
  ('$' || ROUND(cs.total_value/1000000, 1)::text || 'M')::text as "💰 Total Value"
FROM contract_stats cs, failure_stats fs, quality_breakdown qb;

