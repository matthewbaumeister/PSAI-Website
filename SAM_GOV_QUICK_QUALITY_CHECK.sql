-- ============================================
-- SAM.gov Data Quality - Single Table Output
-- ============================================
-- Run this ONE query to see complete quality overview
-- ============================================

WITH 
-- Calculate overall stats
overall_stats AS (
  SELECT 
    COUNT(*) as total_opportunities,
    COUNT(DISTINCT notice_id) as unique_notices,
    COUNT(DISTINCT solicitation_number) as unique_solicitations,
    MIN(posted_date)::date as earliest_posted,
    MAX(posted_date)::date as latest_posted,
    MIN(last_scraped)::date as first_scrape,
    MAX(last_scraped)::date as latest_scrape
  FROM sam_gov_opportunities
),

-- Field completeness
field_stats AS (
  SELECT 
    COUNT(*) as total,
    COUNT(notice_id) as has_notice_id,
    COUNT(title) as has_title,
    COUNT(solicitation_number) as has_solicitation_number,
    COUNT(CASE WHEN description IS NOT NULL AND LENGTH(description) > 50 THEN 1 END) as has_good_description,
    COUNT(posted_date) as has_posted_date,
    COUNT(response_deadline) as has_deadline,
    COUNT(naics_code) as has_naics,
    COUNT(department) as has_department,
    COUNT(primary_contact) as has_primary_contact,
    COUNT(secondary_contact) as has_secondary_contact,
    COUNT(attachments) as has_attachments,
    COUNT(ui_link) as has_ui_link
  FROM sam_gov_opportunities
),

-- Data source breakdown
data_sources AS (
  SELECT 
    data_source,
    COUNT(*) as count,
    ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 1) as percentage
  FROM sam_gov_opportunities
  GROUP BY data_source
),

-- Quality score calculation
quality_score AS (
  SELECT 
    COUNT(*) as total,
    ROUND((100.0 * COUNT(notice_id) / NULLIF(COUNT(*), 0))::numeric, 1) as notice_id_pct,
    ROUND((100.0 * COUNT(title) / NULLIF(COUNT(*), 0))::numeric, 1) as title_pct,
    ROUND((100.0 * COUNT(CASE WHEN description IS NOT NULL AND LENGTH(description) > 50 THEN 1 END) / NULLIF(COUNT(*), 0))::numeric, 1) as description_pct,
    ROUND((100.0 * COUNT(posted_date) / NULLIF(COUNT(*), 0))::numeric, 1) as posted_date_pct,
    ROUND((100.0 * COUNT(ui_link) / NULLIF(COUNT(*), 0))::numeric, 1) as ui_link_pct,
    ROUND((100.0 * COUNT(primary_contact) / NULLIF(COUNT(*), 0))::numeric, 1) as contact_pct,
    ROUND((100.0 * COUNT(attachments) / NULLIF(COUNT(*), 0))::numeric, 1) as attachments_pct,
    ROUND((
      (COUNT(notice_id) + COUNT(title) + 
       COUNT(CASE WHEN description IS NOT NULL AND LENGTH(description) > 50 THEN 1 END) +
       COUNT(posted_date) + COUNT(ui_link) +
       COUNT(primary_contact) + COUNT(attachments))::numeric / 
      (7.0 * NULLIF(COUNT(*), 0)) * 100
    )::numeric, 1) as overall_quality_pct
  FROM sam_gov_opportunities
),

-- Recent activity (last 7 days)
recent_activity AS (
  SELECT 
    DATE(last_scraped) as scrape_date,
    COUNT(*) as records_scraped
  FROM sam_gov_opportunities
  WHERE last_scraped >= CURRENT_DATE - INTERVAL '7 days'
  GROUP BY DATE(last_scraped)
  ORDER BY scrape_date DESC
  LIMIT 7
),

-- Top departments
top_departments AS (
  SELECT 
    COALESCE(department, 'Unknown') as department,
    COUNT(*) as count
  FROM sam_gov_opportunities
  GROUP BY department
  ORDER BY count DESC
  LIMIT 5
),

-- FPDS linking
fpds_linking AS (
  SELECT 
    COUNT(*) as total_opportunities,
    COUNT(fpds_contract_id) as linked_to_fpds,
    ROUND(100.0 * COUNT(fpds_contract_id) / NULLIF(COUNT(*), 0), 1) as link_percentage
  FROM sam_gov_opportunities
)

-- Combine everything into one result
SELECT 
  1 as sort_order,
  '=== OVERALL STATISTICS ===' as section,
  'Total Opportunities' as metric,
  total_opportunities::text as value,
  '' as percentage,
  '' as notes
FROM overall_stats

UNION ALL SELECT 1, '', 'Unique Notices', unique_notices::text, '', '' FROM overall_stats
UNION ALL SELECT 1, '', 'Unique Solicitations', unique_solicitations::text, '', '' FROM overall_stats
UNION ALL SELECT 1, '', 'Date Range', earliest_posted::text || ' to ' || latest_posted::text, '', '' FROM overall_stats
UNION ALL SELECT 1, '', 'Last Scraped', latest_scrape::text, '', '' FROM overall_stats

UNION ALL SELECT 1, '', '', '', '', ''

UNION ALL SELECT 
  2,
  '=== DATA SOURCES ===' as section,
  data_source as metric,
  count::text as value,
  percentage::text || '%' as percentage,
  CASE 
    WHEN data_source = 'sam.gov-api-full' THEN 'Full details ✓'
    WHEN data_source = 'sam.gov-api-search' THEN 'Search only'
    ELSE ''
  END as notes
FROM data_sources

UNION ALL SELECT 2, '', '', '', '', ''

UNION ALL SELECT 
  3,
  '=== FIELD COMPLETENESS ===' as section,
  'Notice ID (required)' as metric,
  has_notice_id::text as value,
  ROUND(100.0 * has_notice_id / NULLIF(total, 0), 1)::text || '%' as percentage,
  CASE WHEN has_notice_id = total THEN '✓' ELSE '!' END as notes
FROM field_stats

UNION ALL SELECT 3, '', 'Title (required)', has_title::text, ROUND(100.0 * has_title / NULLIF(total, 0), 1)::text || '%', CASE WHEN has_title = total THEN '✓' ELSE '!' END FROM field_stats
UNION ALL SELECT 3, '', 'Description (required)', has_good_description::text, ROUND(100.0 * has_good_description / NULLIF(total, 0), 1)::text || '%', CASE WHEN has_good_description::float / NULLIF(total, 0) > 0.8 THEN '✓' ELSE '!' END FROM field_stats
UNION ALL SELECT 3, '', 'Posted Date (required)', has_posted_date::text, ROUND(100.0 * has_posted_date / NULLIF(total, 0), 1)::text || '%', CASE WHEN has_posted_date = total THEN '✓' ELSE '!' END FROM field_stats
UNION ALL SELECT 3, '', 'UI Link (required)', has_ui_link::text, ROUND(100.0 * has_ui_link / NULLIF(total, 0), 1)::text || '%', CASE WHEN has_ui_link = total THEN '✓' ELSE '!' END FROM field_stats
UNION ALL SELECT 3, '', 'Solicitation Number', has_solicitation_number::text, ROUND(100.0 * has_solicitation_number / NULLIF(total, 0), 1)::text || '%', '' FROM field_stats
UNION ALL SELECT 3, '', 'Response Deadline', has_deadline::text, ROUND(100.0 * has_deadline / NULLIF(total, 0), 1)::text || '%', '' FROM field_stats
UNION ALL SELECT 3, '', 'NAICS Code', has_naics::text, ROUND(100.0 * has_naics / NULLIF(total, 0), 1)::text || '%', '' FROM field_stats
UNION ALL SELECT 3, '', 'Department', has_department::text, ROUND(100.0 * has_department / NULLIF(total, 0), 1)::text || '%', '' FROM field_stats
UNION ALL SELECT 3, '', 'Primary Contact', has_primary_contact::text, ROUND(100.0 * has_primary_contact / NULLIF(total, 0), 1)::text || '%', '' FROM field_stats
UNION ALL SELECT 3, '', 'Secondary Contact', has_secondary_contact::text, ROUND(100.0 * has_secondary_contact / NULLIF(total, 0), 1)::text || '%', '' FROM field_stats
UNION ALL SELECT 3, '', 'Attachments', has_attachments::text, ROUND(100.0 * has_attachments / NULLIF(total, 0), 1)::text || '%', '' FROM field_stats

UNION ALL SELECT 3, '', '', '', '', ''

UNION ALL SELECT 
  4,
  '=== QUALITY SCORE ===' as section,
  'Required Fields Score' as metric,
  '' as value,
  ROUND((notice_id_pct + title_pct + description_pct + posted_date_pct + ui_link_pct) / 5, 1)::text || '%' as percentage,
  CASE 
    WHEN (notice_id_pct + title_pct + description_pct + posted_date_pct + ui_link_pct) / 5 >= 95 THEN 'Excellent ✓'
    WHEN (notice_id_pct + title_pct + description_pct + posted_date_pct + ui_link_pct) / 5 >= 80 THEN 'Good'
    WHEN (notice_id_pct + title_pct + description_pct + posted_date_pct + ui_link_pct) / 5 >= 60 THEN 'Fair !'
    ELSE 'Poor !!'
  END as notes
FROM quality_score

UNION ALL SELECT 4, '', 'Optional Fields Score', '', ROUND((contact_pct + attachments_pct) / 2, 1)::text || '%', '' FROM quality_score
UNION ALL SELECT 4, '', 'OVERALL QUALITY SCORE', '', overall_quality_pct::text || '%', 
  CASE 
    WHEN overall_quality_pct >= 95 THEN 'Excellent ✓✓✓'
    WHEN overall_quality_pct >= 80 THEN 'Good ✓✓'
    WHEN overall_quality_pct >= 60 THEN 'Fair ✓'
    ELSE 'Needs Work'
  END 
FROM quality_score

UNION ALL SELECT 4, '', '', '', '', ''

UNION ALL SELECT 
  5,
  '=== RECENT ACTIVITY (Last 7 Days) ===' as section,
  scrape_date::text as metric,
  records_scraped::text || ' records' as value,
  '' as percentage,
  '' as notes
FROM recent_activity

UNION ALL SELECT 5, '', '', '', '', ''

UNION ALL SELECT 
  6,
  '=== TOP 5 DEPARTMENTS ===' as section,
  department as metric,
  count::text || ' opportunities' as value,
  '' as percentage,
  '' as notes
FROM top_departments

UNION ALL SELECT 6, '', '', '', '', ''

UNION ALL SELECT 
  7,
  '=== FPDS LINKING ===' as section,
  'Linked to FPDS Contracts' as metric,
  linked_to_fpds::text || ' / ' || total_opportunities::text as value,
  link_percentage::text || '%' as percentage,
  CASE 
    WHEN link_percentage > 50 THEN 'Excellent'
    WHEN link_percentage > 20 THEN 'Good'
    WHEN link_percentage > 0 THEN 'Some links'
    ELSE 'None yet'
  END as notes
FROM fpds_linking

ORDER BY sort_order, metric;

-- ============================================
-- INTERPRETATION GUIDE
-- ============================================
--
-- OVERALL QUALITY SCORE:
-- 95-100%: Excellent - Data is complete and rich ✓✓✓
-- 80-94%:  Good - Most data present ✓✓
-- 60-79%:  Fair - Some gaps ✓
-- <60%:    Needs improvement
--
-- DATA SOURCES:
-- 'sam.gov-api-full': Complete data (descriptions, contacts, attachments)
-- 'sam.gov-api-search': Basic data only (may need re-scraping)
--
-- REQUIRED FIELDS (must be 100%):
-- - notice_id
-- - title
-- - description (>50 chars)
-- - posted_date
-- - ui_link
--
-- ============================================

