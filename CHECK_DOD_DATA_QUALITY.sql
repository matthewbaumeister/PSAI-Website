-- ============================================
-- DoD Contract News Data Quality Check - Single Query
-- ============================================
-- Comprehensive data quality analysis in one query
-- Compatible with Supabase SQL editor

WITH 
-- Overall Stats
overall_stats AS (
    SELECT 
        COUNT(*) as total_contracts,
        COUNT(DISTINCT article_id) as unique_articles,
        COUNT(DISTINCT vendor_name) as unique_vendors,
        MIN(published_date) as earliest_date,
        MAX(published_date) as latest_date,
        COUNT(DISTINCT published_date) as days_covered,
        MAX(scraped_at) as last_scrape_time
    FROM dod_contract_news
),

-- Last Gov Update
last_update AS (
    SELECT 
        MAX(published_date) as last_gov_updated_date,
        COUNT(*) as contracts_on_last_date
    FROM dod_contract_news
    WHERE published_date = (SELECT MAX(published_date) FROM dod_contract_news)
),

-- Recent Contracts by Date
recent_by_date AS (
    SELECT 
        json_agg(
            json_build_object(
                'date', published_date,
                'contracts', contracts,
                'vendors', vendors,
                'with_amount', with_amount,
                'avg_amount', avg_amount
            ) ORDER BY published_date DESC
        ) as recent_dates
    FROM (
        SELECT 
            published_date,
            COUNT(*) as contracts,
            COUNT(DISTINCT vendor_name) as vendors,
            SUM(CASE WHEN award_amount IS NOT NULL THEN 1 ELSE 0 END) as with_amount,
            ROUND(AVG(CASE WHEN award_amount IS NOT NULL THEN award_amount END)) as avg_amount
        FROM dod_contract_news
        WHERE published_date >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY published_date
        ORDER BY published_date DESC
        LIMIT 30
    ) t
),

-- Data Completeness
completeness AS (
    SELECT 
        COUNT(*) as total_contracts,
        ROUND(100.0 * COUNT(vendor_name) / COUNT(*), 1) as pct_has_vendor_name,
        ROUND(100.0 * COUNT(vendor_city) / COUNT(*), 1) as pct_has_vendor_city,
        ROUND(100.0 * COUNT(vendor_state) / COUNT(*), 1) as pct_has_vendor_state,
        ROUND(100.0 * COUNT(contract_number) / COUNT(*), 1) as pct_has_contract_number,
        ROUND(100.0 * COUNT(award_amount) / COUNT(*), 1) as pct_has_award_amount,
        ROUND(100.0 * COUNT(service_branch) / COUNT(*), 1) as pct_has_service_branch,
        ROUND(100.0 * COUNT(contracting_activity) / COUNT(*), 1) as pct_has_contracting_activity,
        ROUND(100.0 * COUNT(completion_date) / COUNT(*), 1) as pct_has_completion_date,
        ROUND(AVG(parsing_confidence), 3) as avg_parsing_confidence,
        ROUND(AVG(data_quality_score), 1) as avg_quality_score
    FROM dod_contract_news
),

-- Service Branch Breakdown
service_branches AS (
    SELECT 
        json_agg(
            json_build_object(
                'service_branch', service_branch,
                'contracts', contracts,
                'pct_of_total', pct_of_total,
                'total_value', total_value,
                'unique_vendors', unique_vendors
            ) ORDER BY contracts DESC
        ) as branch_data
    FROM (
        SELECT 
            COALESCE(service_branch, 'Unknown') as service_branch,
            COUNT(*) as contracts,
            ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 1) as pct_of_total,
            ROUND(SUM(CASE WHEN award_amount IS NOT NULL THEN award_amount ELSE 0 END)) as total_value,
            COUNT(DISTINCT vendor_name) as unique_vendors
        FROM dod_contract_news
        GROUP BY service_branch
        ORDER BY contracts DESC
    ) t
),

-- Top Vendors
top_vendors AS (
    SELECT 
        json_agg(
            json_build_object(
                'vendor_name', vendor_name,
                'contracts', contracts,
                'total_value', total_value,
                'first_contract', first_contract,
                'last_contract', last_contract
            ) ORDER BY contracts DESC
        ) as vendor_data
    FROM (
        SELECT 
            vendor_name,
            COUNT(*) as contracts,
            ROUND(SUM(CASE WHEN award_amount IS NOT NULL THEN award_amount ELSE 0 END)) as total_value,
            MIN(published_date) as first_contract,
            MAX(published_date) as last_contract
        FROM dod_contract_news
        WHERE published_date >= CURRENT_DATE - INTERVAL '90 days'
        GROUP BY vendor_name
        ORDER BY contracts DESC
        LIMIT 10
    ) t
),

-- Contract Types
contract_types AS (
    SELECT 
        SUM(CASE WHEN is_modification = true THEN 1 ELSE 0 END) as modifications,
        SUM(CASE WHEN is_modification = false OR is_modification IS NULL THEN 1 ELSE 0 END) as new_awards,
        SUM(CASE WHEN is_option_exercise = true THEN 1 ELSE 0 END) as option_exercises,
        SUM(CASE WHEN is_idiq = true THEN 1 ELSE 0 END) as idiq_contracts,
        SUM(CASE WHEN is_multiple_award = true THEN 1 ELSE 0 END) as multiple_award,
        SUM(CASE WHEN is_small_business = true THEN 1 ELSE 0 END) as small_business,
        SUM(CASE WHEN is_fms = true THEN 1 ELSE 0 END) as foreign_military_sales
    FROM dod_contract_news
),

-- Award Statistics
award_stats AS (
    SELECT 
        COUNT(award_amount) as contracts_with_amount,
        ROUND(AVG(award_amount)) as avg_amount,
        ROUND(MIN(award_amount)) as min_amount,
        ROUND(MAX(award_amount)) as max_amount,
        ROUND(SUM(award_amount)) as total_value,
        ROUND(PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY award_amount)) as p25_amount,
        ROUND(PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY award_amount)) as median_amount,
        ROUND(PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY award_amount)) as p75_amount,
        ROUND(PERCENTILE_CONT(0.90) WITHIN GROUP (ORDER BY award_amount)) as p90_amount
    FROM dod_contract_news
    WHERE award_amount IS NOT NULL
),

-- Quality Metrics
quality_metrics AS (
    SELECT 
        COUNT(*) as total_contracts,
        SUM(CASE WHEN parsing_confidence >= 0.8 THEN 1 ELSE 0 END) as high_confidence,
        SUM(CASE WHEN parsing_confidence >= 0.6 AND parsing_confidence < 0.8 THEN 1 ELSE 0 END) as medium_confidence,
        SUM(CASE WHEN parsing_confidence < 0.6 THEN 1 ELSE 0 END) as low_confidence,
        ROUND(AVG(parsing_confidence), 3) as avg_confidence,
        SUM(CASE WHEN data_quality_score >= 80 THEN 1 ELSE 0 END) as excellent_quality,
        SUM(CASE WHEN data_quality_score >= 60 AND data_quality_score < 80 THEN 1 ELSE 0 END) as good_quality,
        SUM(CASE WHEN data_quality_score < 60 THEN 1 ELSE 0 END) as needs_improvement
    FROM dod_contract_news
),

-- Top States
top_states AS (
    SELECT 
        json_agg(
            json_build_object(
                'state', state,
                'contracts', contracts,
                'pct_of_total', pct_of_total,
                'unique_vendors', unique_vendors,
                'total_value', total_value
            ) ORDER BY contracts DESC
        ) as state_data
    FROM (
        SELECT 
            COALESCE(vendor_state, 'Unknown') as state,
            COUNT(*) as contracts,
            ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 1) as pct_of_total,
            COUNT(DISTINCT vendor_name) as unique_vendors,
            ROUND(SUM(CASE WHEN award_amount IS NOT NULL THEN award_amount ELSE 0 END)) as total_value
        FROM dod_contract_news
        GROUP BY vendor_state
        ORDER BY contracts DESC
        LIMIT 15
    ) t
),

-- Enhanced Fields
enhanced_fields AS (
    SELECT 
        COUNT(*) as total_contracts,
        SUM(CASE WHEN is_fms = true THEN 1 ELSE 0 END) as fms_contracts,
        SUM(CASE WHEN fms_countries IS NOT NULL THEN 1 ELSE 0 END) as has_fms_countries,
        SUM(CASE WHEN is_competed = true THEN 1 ELSE 0 END) as competed,
        SUM(CASE WHEN is_competed = false THEN 1 ELSE 0 END) as sole_source,
        SUM(CASE WHEN is_small_business_set_aside = true THEN 1 ELSE 0 END) as set_aside_contracts,
        SUM(CASE WHEN is_teaming = true THEN 1 ELSE 0 END) as teaming_contracts,
        SUM(CASE WHEN is_sbir = true THEN 1 ELSE 0 END) as sbir_contracts,
        SUM(CASE WHEN performance_locations IS NOT NULL THEN 1 ELSE 0 END) as has_performance_locations
    FROM dod_contract_news
),

-- Largest Recent Contracts
largest_contracts AS (
    SELECT 
        json_agg(
            json_build_object(
                'published_date', published_date,
                'vendor_name', vendor_name,
                'vendor_state', vendor_state,
                'award_amount', award_amount,
                'description_preview', description_preview,
                'service_branch', service_branch,
                'is_modification', is_modification
            ) ORDER BY award_amount DESC
        ) as largest_data
    FROM (
        SELECT 
            published_date,
            vendor_name,
            vendor_state,
            ROUND(award_amount) as award_amount,
            LEFT(contract_description, 100) as description_preview,
            service_branch,
            is_modification
        FROM dod_contract_news
        WHERE published_date >= CURRENT_DATE - INTERVAL '30 days'
            AND award_amount IS NOT NULL
        ORDER BY award_amount DESC
        LIMIT 10
    ) t
),

-- Health Status
health_status AS (
    SELECT 
        CASE 
            WHEN MAX(published_date) >= CURRENT_DATE - INTERVAL '7 days' THEN 'HEALTHY - Recent data available'
            WHEN MAX(published_date) >= CURRENT_DATE - INTERVAL '14 days' THEN 'WARNING - Data is 7-14 days old'
            ELSE 'ALERT - Data is stale (>14 days old)'
        END as status,
        MAX(published_date) as last_gov_update,
        MAX(scraped_at) as last_scrape,
        COUNT(*) as total_contracts,
        ROUND(AVG(data_quality_score), 1) as avg_quality_score
    FROM dod_contract_news
)

-- Final Combined Results
SELECT 
    json_build_object(
        'overall_statistics', json_build_object(
            'total_contracts', os.total_contracts,
            'unique_articles', os.unique_articles,
            'unique_vendors', os.unique_vendors,
            'earliest_date', os.earliest_date,
            'latest_date', os.latest_date,
            'days_covered', os.days_covered,
            'last_scrape_time', os.last_scrape_time
        ),
        'last_gov_update', json_build_object(
            'last_gov_updated_date', lu.last_gov_updated_date,
            'contracts_on_last_date', lu.contracts_on_last_date
        ),
        'recent_contracts_by_date', rbd.recent_dates,
        'data_completeness', json_build_object(
            'total_contracts', c.total_contracts,
            'pct_has_vendor_name', c.pct_has_vendor_name,
            'pct_has_vendor_city', c.pct_has_vendor_city,
            'pct_has_vendor_state', c.pct_has_vendor_state,
            'pct_has_contract_number', c.pct_has_contract_number,
            'pct_has_award_amount', c.pct_has_award_amount,
            'pct_has_service_branch', c.pct_has_service_branch,
            'pct_has_contracting_activity', c.pct_has_contracting_activity,
            'pct_has_completion_date', c.pct_has_completion_date,
            'avg_parsing_confidence', c.avg_parsing_confidence,
            'avg_quality_score', c.avg_quality_score
        ),
        'service_branches', sb.branch_data,
        'top_vendors_90days', tv.vendor_data,
        'contract_types', json_build_object(
            'modifications', ct.modifications,
            'new_awards', ct.new_awards,
            'option_exercises', ct.option_exercises,
            'idiq_contracts', ct.idiq_contracts,
            'multiple_award', ct.multiple_award,
            'small_business', ct.small_business,
            'foreign_military_sales', ct.foreign_military_sales
        ),
        'award_statistics', json_build_object(
            'contracts_with_amount', aws.contracts_with_amount,
            'avg_amount', aws.avg_amount,
            'min_amount', aws.min_amount,
            'max_amount', aws.max_amount,
            'total_value', aws.total_value,
            'p25_amount', aws.p25_amount,
            'median_amount', aws.median_amount,
            'p75_amount', aws.p75_amount,
            'p90_amount', aws.p90_amount
        ),
        'quality_metrics', json_build_object(
            'total_contracts', qm.total_contracts,
            'high_confidence', qm.high_confidence,
            'medium_confidence', qm.medium_confidence,
            'low_confidence', qm.low_confidence,
            'avg_confidence', qm.avg_confidence,
            'excellent_quality', qm.excellent_quality,
            'good_quality', qm.good_quality,
            'needs_improvement', qm.needs_improvement
        ),
        'top_15_states', ts.state_data,
        'enhanced_fields_utilization', json_build_object(
            'total_contracts', ef.total_contracts,
            'fms_contracts', ef.fms_contracts,
            'has_fms_countries', ef.has_fms_countries,
            'competed', ef.competed,
            'sole_source', ef.sole_source,
            'set_aside_contracts', ef.set_aside_contracts,
            'teaming_contracts', ef.teaming_contracts,
            'sbir_contracts', ef.sbir_contracts,
            'has_performance_locations', ef.has_performance_locations
        ),
        'largest_contracts_30days', lc.largest_data,
        'health_status', json_build_object(
            'status', hs.status,
            'last_gov_update', hs.last_gov_update,
            'last_scrape', hs.last_scrape,
            'total_contracts', hs.total_contracts,
            'avg_quality_score', hs.avg_quality_score
        )
    ) as dod_data_quality_report
FROM overall_stats os
CROSS JOIN last_update lu
CROSS JOIN recent_by_date rbd
CROSS JOIN completeness c
CROSS JOIN service_branches sb
CROSS JOIN top_vendors tv
CROSS JOIN contract_types ct
CROSS JOIN award_stats aws
CROSS JOIN quality_metrics qm
CROSS JOIN top_states ts
CROSS JOIN enhanced_fields ef
CROSS JOIN largest_contracts lc
CROSS JOIN health_status hs;
