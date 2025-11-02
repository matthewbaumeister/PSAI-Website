-- =====================================================
-- QUICK SUMMARY: What's Being Captured
-- =====================================================

WITH stats AS (
  SELECT 
    COUNT(*) as total,
    
    -- Coverage Percentages
    ROUND(100.0 * COUNT(vendor_state) / COUNT(*), 1) as vendor_state_pct,
    ROUND(100.0 * COUNT(contract_types) / COUNT(*), 1) as contract_types_pct,
    ROUND(100.0 * COUNT(cumulative_value_with_options) / COUNT(*), 1) as cumulative_value_pct,
    ROUND(100.0 * COUNT(performance_location_breakdown) / COUNT(*), 1) as perf_breakdown_pct,
    ROUND(100.0 * COUNT(funding_sources) / COUNT(*), 1) as funding_sources_pct,
    
    -- Type Counts
    COUNT(*) FILTER (WHERE is_idiq = true) as idiq_count,
    COUNT(*) FILTER (WHERE is_fms = true) as fms_count,
    COUNT(*) FILTER (WHERE is_competed = false) as sole_source_count,
    COUNT(*) FILTER (WHERE is_sbir = true) as sbir_count,
    COUNT(*) FILTER (WHERE has_options = true) as has_options_count,
    COUNT(*) FILTER (WHERE is_modification = true) as modification_count,
    
    -- Value Stats
    SUM(award_amount) as total_award_amount,
    SUM(cumulative_value_with_options) as total_with_options,
    AVG(data_quality_score) as avg_quality_score
  FROM dod_contract_news
)
SELECT 
  '📊 TOTAL CONTRACTS' as metric,
  total::text as value
FROM stats

UNION ALL

SELECT '═══════════════════════════', '═══════════════'

UNION ALL

SELECT '✅ Vendor State Coverage', vendor_state_pct::text || '%'
FROM stats

UNION ALL

SELECT '✅ Contract Types Extracted', contract_types_pct::text || '%'
FROM stats

UNION ALL

SELECT '✅ Cumulative Values Calculated', cumulative_value_pct::text || '%'
FROM stats

UNION ALL

SELECT '✅ Performance Breakdowns', perf_breakdown_pct::text || '%'
FROM stats

UNION ALL

SELECT '✅ Funding Sources', funding_sources_pct::text || '%'
FROM stats

UNION ALL

SELECT '═══════════════════════════', '═══════════════'

UNION ALL

SELECT '📋 IDIQ Contracts', idiq_count::text
FROM stats

UNION ALL

SELECT '🌍 FMS Contracts', fms_count::text
FROM stats

UNION ALL

SELECT '🔒 Sole Source Contracts', sole_source_count::text
FROM stats

UNION ALL

SELECT '🔬 SBIR Contracts', sbir_count::text
FROM stats

UNION ALL

SELECT '📈 Contracts with Options', has_options_count::text
FROM stats

UNION ALL

SELECT '📝 Modifications', modification_count::text
FROM stats

UNION ALL

SELECT '═══════════════════════════', '═══════════════'

UNION ALL

SELECT '💰 Total Award Amount', '$' || ROUND(total_award_amount/1000000, 1)::text || 'B'
FROM stats

UNION ALL

SELECT '💰 Total with Options', '$' || ROUND(COALESCE(total_with_options, 0)/1000000, 1)::text || 'B'
FROM stats

UNION ALL

SELECT '⭐ Avg Quality Score', ROUND(avg_quality_score, 1)::text || '/100'
FROM stats;

