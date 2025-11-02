-- =====================================================
-- FINAL VALIDATION - All Checks in One Query
-- =====================================================

WITH validation_stats AS (
  SELECT 
    COUNT(*) as total_contracts,
    COUNT(vendor_state) as has_vendor_state,
    COUNT(contract_types) as has_contract_types,
    COUNT(industry_tags) as has_industry_tags,
    COUNT(technology_tags) as has_tech_tags,
    COUNT(service_tags) as has_service_tags,
    COUNT(completion_date) as has_completion_date,
    COUNT(performance_location_breakdown) as has_perf_breakdown,
    COUNT(funding_sources) as has_funding_sources,
    COUNT(contracting_activity) as has_contracting_activity,
    COUNT(*) FILTER (WHERE is_small_business_set_aside = true) as set_aside_count,
    COUNT(*) FILTER (WHERE is_fms = true) as fms_count,
    COUNT(*) FILTER (WHERE is_teaming = true) as teaming_count,
    COUNT(*) FILTER (WHERE is_idiq = true) as idiq_count,
    COUNT(*) FILTER (WHERE has_options = true) as has_options_count,
    COUNT(*) FILTER (WHERE data_quality_score >= 90) as high_quality_count,
    COUNT(*) FILTER (WHERE parsing_confidence < 0.7) as low_confidence_count,
    ROUND(AVG(data_quality_score), 1) as avg_quality_score,
    ROUND(AVG(parsing_confidence), 3) as avg_confidence,
    ROUND(AVG(array_length(industry_tags, 1)), 1) as avg_industry_tags,
    ROUND(AVG(array_length(technology_tags, 1)), 1) as avg_tech_tags,
    ROUND(AVG(array_length(service_tags, 1)), 1) as avg_service_tags,
    SUM(award_amount) as total_award_value,
    SUM(cumulative_value_with_options) as total_with_options
  FROM dod_contract_news
)
SELECT 
  '=== OVERALL STATS ===' as category,
  'Total Contracts' as metric,
  total_contracts::text as value,
  '100%' as pct,
  '✅' as status
FROM validation_stats

UNION ALL SELECT '=== OVERALL STATS ===', 'Avg Quality Score', avg_quality_score::text, 
  ROUND(avg_quality_score, 1)::text || '%', 
  CASE WHEN avg_quality_score >= 95 THEN '✅' ELSE '⚠️' END
FROM validation_stats

UNION ALL SELECT '=== OVERALL STATS ===', 'Avg Confidence', avg_confidence::text, 
  ROUND(avg_confidence * 100, 1)::text || '%', 
  CASE WHEN avg_confidence >= 0.9 THEN '✅' ELSE '⚠️' END
FROM validation_stats

UNION ALL SELECT '=== OVERALL STATS ===', 'Total Award Value', 
  '$' || ROUND((total_award_value/1000000000)::numeric, 1)::text || 'B', 
  '', '💰'
FROM validation_stats

UNION ALL SELECT '=== BASIC FIELDS ===', 'Vendor State', has_vendor_state::text,
  ROUND(100.0 * has_vendor_state / total_contracts, 1)::text || '%',
  CASE WHEN has_vendor_state = total_contracts THEN '✅' ELSE '❌' END
FROM validation_stats

UNION ALL SELECT '=== BASIC FIELDS ===', 'Contracting Activity', has_contracting_activity::text,
  ROUND(100.0 * has_contracting_activity / total_contracts, 1)::text || '%',
  CASE WHEN 100.0 * has_contracting_activity / total_contracts > 70 THEN '✅' 
       WHEN 100.0 * has_contracting_activity / total_contracts > 40 THEN '⚠️' ELSE '❌' END
FROM validation_stats

UNION ALL SELECT '=== BASIC FIELDS ===', 'Completion Dates', has_completion_date::text,
  ROUND(100.0 * has_completion_date / total_contracts, 1)::text || '%',
  CASE WHEN 100.0 * has_completion_date / total_contracts > 40 THEN '✅' ELSE '⚠️' END
FROM validation_stats

UNION ALL SELECT '=== ENHANCED FIELDS ===', 'Contract Types', has_contract_types::text,
  ROUND(100.0 * has_contract_types / total_contracts, 1)::text || '%',
  CASE WHEN 100.0 * has_contract_types / total_contracts > 85 THEN '✅' ELSE '⚠️' END
FROM validation_stats

UNION ALL SELECT '=== ENHANCED FIELDS ===', 'Performance Breakdown', has_perf_breakdown::text,
  ROUND(100.0 * has_perf_breakdown / total_contracts, 1)::text || '%',
  CASE WHEN 100.0 * has_perf_breakdown / total_contracts > 20 THEN '✅' ELSE '⚠️' END
FROM validation_stats

UNION ALL SELECT '=== ENHANCED FIELDS ===', 'Funding Sources', has_funding_sources::text,
  ROUND(100.0 * has_funding_sources / total_contracts, 1)::text || '%',
  CASE WHEN 100.0 * has_funding_sources / total_contracts > 35 THEN '✅' ELSE '⚠️' END
FROM validation_stats

UNION ALL SELECT '=== NEW FEATURES ===', 'Set-Aside Contracts', set_aside_count::text,
  ROUND(100.0 * set_aside_count / total_contracts, 1)::text || '%',
  CASE WHEN set_aside_count > 0 THEN '✅' ELSE '❌' END
FROM validation_stats

UNION ALL SELECT '=== NEW FEATURES ===', 'FMS Contracts', fms_count::text,
  ROUND(100.0 * fms_count / total_contracts, 1)::text || '%',
  CASE WHEN fms_count > 0 THEN '✅' ELSE '⚠️' END
FROM validation_stats

UNION ALL SELECT '=== NEW FEATURES ===', 'Teaming Contracts', teaming_count::text,
  ROUND(100.0 * teaming_count / total_contracts, 1)::text || '%',
  CASE WHEN teaming_count > 0 THEN '✅' ELSE '⚠️' END
FROM validation_stats

UNION ALL SELECT '=== NEW FEATURES ===', 'IDIQ Contracts', idiq_count::text,
  ROUND(100.0 * idiq_count / total_contracts, 1)::text || '%',
  CASE WHEN idiq_count > 0 THEN '✅' ELSE '⚠️' END
FROM validation_stats

UNION ALL SELECT '=== KEYWORDS/TAGS ===', 'Industry Tags', has_industry_tags::text,
  ROUND(100.0 * has_industry_tags / total_contracts, 1)::text || '%',
  CASE WHEN 100.0 * has_industry_tags / total_contracts > 80 THEN '✅' ELSE '⚠️' END
FROM validation_stats

UNION ALL SELECT '=== KEYWORDS/TAGS ===', 'Technology Tags', has_tech_tags::text,
  ROUND(100.0 * has_tech_tags / total_contracts, 1)::text || '%',
  CASE WHEN 100.0 * has_tech_tags / total_contracts > 15 THEN '✅' ELSE '⚠️' END
FROM validation_stats

UNION ALL SELECT '=== KEYWORDS/TAGS ===', 'Service Tags', has_service_tags::text,
  ROUND(100.0 * has_service_tags / total_contracts, 1)::text || '%',
  CASE WHEN 100.0 * has_service_tags / total_contracts > 70 THEN '✅' ELSE '⚠️' END
FROM validation_stats

UNION ALL SELECT '=== KEYWORDS/TAGS ===', 'Avg Industry Tags/Contract', avg_industry_tags::text, '', 
  CASE WHEN avg_industry_tags >= 1 THEN '✅' ELSE '⚠️' END
FROM validation_stats

UNION ALL SELECT '=== KEYWORDS/TAGS ===', 'Avg Tech Tags/Contract', COALESCE(avg_tech_tags::text, '0'), '', 
  CASE WHEN avg_tech_tags >= 0.5 THEN '✅' ELSE '⚠️' END
FROM validation_stats

UNION ALL SELECT '=== KEYWORDS/TAGS ===', 'Avg Service Tags/Contract', avg_service_tags::text, '', 
  CASE WHEN avg_service_tags >= 1 THEN '✅' ELSE '⚠️' END
FROM validation_stats

UNION ALL SELECT '=== DATA QUALITY ===', 'High Quality (≥90)', high_quality_count::text,
  ROUND(100.0 * high_quality_count / total_contracts, 1)::text || '%',
  CASE WHEN 100.0 * high_quality_count / total_contracts > 80 THEN '✅' ELSE '⚠️' END
FROM validation_stats

UNION ALL SELECT '=== DATA QUALITY ===', 'Low Confidence (<70%)', low_confidence_count::text,
  ROUND(100.0 * low_confidence_count / total_contracts, 1)::text || '%',
  CASE WHEN low_confidence_count = 0 THEN '✅' ELSE '⚠️' END
FROM validation_stats

UNION ALL SELECT '=== CONTRACT VALUES ===', 'Contracts with Options', has_options_count::text,
  ROUND(100.0 * has_options_count / total_contracts, 1)::text || '%',
  CASE WHEN has_options_count > 0 THEN '✅' ELSE '⚠️' END
FROM validation_stats

UNION ALL SELECT '=== CONTRACT VALUES ===', 'Total with Options Value', 
  '$' || ROUND((COALESCE(total_with_options, 0)/1000000000)::numeric, 1)::text || 'B', '', '💰'
FROM validation_stats

ORDER BY category, metric;

