-- ============================================
-- SAM.gov Data Quality Verification Queries
-- ============================================
-- 
-- Run these queries to verify SAM.gov scraper
-- data completeness and quality
--
-- ============================================

-- 1. OVERALL STATISTICS
-- ============================================
SELECT 
  COUNT(*) as total_opportunities,
  COUNT(DISTINCT notice_id) as unique_notices,
  COUNT(DISTINCT solicitation_number) as unique_solicitations,
  MIN(posted_date) as earliest_posted,
  MAX(posted_date) as latest_posted,
  MIN(last_scraped) as first_scrape,
  MAX(last_scraped) as latest_scrape
FROM sam_gov_opportunities;

-- 2. DATA SOURCE DISTRIBUTION
-- ============================================
-- Check how many records have full details vs fast mode
SELECT 
  data_source,
  COUNT(*) as count,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) as percentage
FROM sam_gov_opportunities
GROUP BY data_source
ORDER BY count DESC;

-- 3. FIELD COMPLETENESS ANALYSIS
-- ============================================
SELECT 
  COUNT(*) as total,
  COUNT(notice_id) as has_notice_id,
  COUNT(title) as has_title,
  COUNT(solicitation_number) as has_solicitation_number,
  COUNT(CASE WHEN description IS NOT NULL AND description NOT LIKE 'https://api.sam.gov%' THEN 1 END) as has_real_description,
  COUNT(posted_date) as has_posted_date,
  COUNT(response_deadline) as has_response_deadline,
  COUNT(naics_code) as has_naics_code,
  COUNT(department) as has_department,
  COUNT(sub_tier) as has_sub_tier,
  COUNT(primary_contact) as has_primary_contact,
  COUNT(secondary_contact) as has_secondary_contact,
  COUNT(attachments) as has_attachments,
  COUNT(type_of_set_aside) as has_set_aside,
  COUNT(ui_link) as has_ui_link
FROM sam_gov_opportunities;

-- 4. FIELD COMPLETENESS PERCENTAGES
-- ============================================
WITH totals AS (
  SELECT COUNT(*) as total FROM sam_gov_opportunities
)
SELECT 
  'notice_id' as field,
  COUNT(notice_id) as filled,
  totals.total,
  ROUND(100.0 * COUNT(notice_id) / totals.total, 2) as percentage
FROM sam_gov_opportunities, totals
GROUP BY totals.total
UNION ALL
SELECT 
  'title',
  COUNT(title),
  totals.total,
  ROUND(100.0 * COUNT(title) / totals.total, 2)
FROM sam_gov_opportunities, totals
GROUP BY totals.total
UNION ALL
SELECT 
  'solicitation_number',
  COUNT(solicitation_number),
  totals.total,
  ROUND(100.0 * COUNT(solicitation_number) / totals.total, 2)
FROM sam_gov_opportunities, totals
GROUP BY totals.total
UNION ALL
SELECT 
  'real_description',
  COUNT(CASE WHEN description IS NOT NULL AND description NOT LIKE 'https://api.sam.gov%' THEN 1 END),
  totals.total,
  ROUND(100.0 * COUNT(CASE WHEN description IS NOT NULL AND description NOT LIKE 'https://api.sam.gov%' THEN 1 END) / totals.total, 2)
FROM sam_gov_opportunities, totals
GROUP BY totals.total
UNION ALL
SELECT 
  'primary_contact',
  COUNT(primary_contact),
  totals.total,
  ROUND(100.0 * COUNT(primary_contact) / totals.total, 2)
FROM sam_gov_opportunities, totals
GROUP BY totals.total
UNION ALL
SELECT 
  'attachments',
  COUNT(attachments),
  totals.total,
  ROUND(100.0 * COUNT(attachments) / totals.total, 2)
FROM sam_gov_opportunities, totals
GROUP BY totals.total
ORDER BY percentage DESC;

-- 5. RECENT SCRAPING ACTIVITY (Last 7 Days)
-- ============================================
SELECT 
  DATE(last_scraped) as scrape_date,
  COUNT(*) as records_scraped,
  COUNT(DISTINCT data_source) as data_sources_used,
  COUNT(CASE WHEN data_source = 'sam.gov-api-full' THEN 1 END) as full_details_count,
  COUNT(CASE WHEN data_source = 'sam.gov-api-search' THEN 1 END) as fast_mode_count
FROM sam_gov_opportunities
WHERE last_scraped >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(last_scraped)
ORDER BY scrape_date DESC;

-- 6. TODAY'S SCRAPING RESULTS
-- ============================================
SELECT 
  COUNT(*) as todays_records,
  COUNT(DISTINCT notice_id) as unique_notices,
  COUNT(CASE WHEN data_source = 'sam.gov-api-full' THEN 1 END) as with_full_details,
  MIN(posted_date) as earliest_posted,
  MAX(posted_date) as latest_posted
FROM sam_gov_opportunities
WHERE DATE(last_scraped) = CURRENT_DATE;

-- 7. YESTERDAY AND TODAY POSTED OPPORTUNITIES
-- ============================================
-- Check what was posted yesterday and today
SELECT 
  DATE(posted_date) as posted_date,
  COUNT(*) as opportunities,
  COUNT(DISTINCT department) as departments,
  COUNT(CASE WHEN response_deadline IS NOT NULL THEN 1 END) as with_deadline
FROM sam_gov_opportunities
WHERE posted_date >= CURRENT_DATE - INTERVAL '2 days'
GROUP BY DATE(posted_date)
ORDER BY posted_date DESC;

-- 8. DESCRIPTION QUALITY CHECK
-- ============================================
-- Find records with missing or incomplete descriptions
SELECT 
  notice_id,
  title,
  posted_date,
  CASE 
    WHEN description IS NULL THEN 'NULL'
    WHEN description LIKE 'https://api.sam.gov%' THEN 'API Link (not real description)'
    WHEN LENGTH(description) < 50 THEN 'Too Short'
    ELSE 'OK'
  END as description_status,
  LENGTH(description) as description_length,
  data_source,
  ui_link
FROM sam_gov_opportunities
WHERE 
  description IS NULL 
  OR description LIKE 'https://api.sam.gov%'
  OR LENGTH(description) < 50
ORDER BY posted_date DESC
LIMIT 20;

-- 9. DEPARTMENT DISTRIBUTION
-- ============================================
SELECT 
  COALESCE(department, 'Unknown') as department,
  COUNT(*) as count,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) as percentage
FROM sam_gov_opportunities
GROUP BY department
ORDER BY count DESC
LIMIT 20;

-- 10. SET-ASIDE DISTRIBUTION
-- ============================================
SELECT 
  COALESCE(type_of_set_aside_description, 'None') as set_aside_type,
  COUNT(*) as count,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) as percentage
FROM sam_gov_opportunities
GROUP BY type_of_set_aside_description
ORDER BY count DESC;

-- 11. NAICS CODE DISTRIBUTION (Top 20)
-- ============================================
SELECT 
  naics_code,
  COUNT(*) as count,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) as percentage
FROM sam_gov_opportunities
WHERE naics_code IS NOT NULL
GROUP BY naics_code
ORDER BY count DESC
LIMIT 20;

-- 12. OPPORTUNITIES WITH DEADLINES
-- ============================================
SELECT 
  COUNT(*) as total_opportunities,
  COUNT(response_deadline) as with_deadline,
  COUNT(CASE WHEN response_deadline > CURRENT_DATE THEN 1 END) as still_open,
  COUNT(CASE WHEN response_deadline <= CURRENT_DATE THEN 1 END) as closed,
  ROUND(100.0 * COUNT(response_deadline) / COUNT(*), 2) as deadline_percentage
FROM sam_gov_opportunities;

-- 13. CONTACTS ANALYSIS
-- ============================================
SELECT 
  COUNT(*) as total,
  COUNT(primary_contact) as has_primary_contact,
  COUNT(secondary_contact) as has_secondary_contact,
  COUNT(CASE WHEN primary_contact IS NOT NULL AND secondary_contact IS NOT NULL THEN 1 END) as has_both_contacts,
  ROUND(100.0 * COUNT(primary_contact) / COUNT(*), 2) as primary_contact_percentage,
  ROUND(100.0 * COUNT(secondary_contact) / COUNT(*), 2) as secondary_contact_percentage
FROM sam_gov_opportunities;

-- 14. ATTACHMENTS ANALYSIS
-- ============================================
SELECT 
  COUNT(*) as total_opportunities,
  COUNT(attachments) as with_attachments,
  ROUND(100.0 * COUNT(attachments) / COUNT(*), 2) as attachment_percentage
FROM sam_gov_opportunities;

-- 15. LINKING TO FPDS CONTRACTS
-- ============================================
-- Check how many opportunities are linked to awarded contracts
SELECT 
  COUNT(*) as total_opportunities,
  COUNT(fpds_contract_id) as linked_to_awards,
  ROUND(100.0 * COUNT(fpds_contract_id) / COUNT(*), 2) as link_percentage,
  COUNT(DISTINCT fpds_contract_id) as unique_contracts_linked
FROM sam_gov_opportunities;

-- 16. SAMPLE RECENT OPPORTUNITIES
-- ============================================
-- View actual recent records to verify quality
SELECT 
  notice_id,
  title,
  solicitation_number,
  department,
  posted_date,
  response_deadline,
  naics_code,
  type_of_set_aside_description,
  CASE WHEN primary_contact IS NOT NULL THEN 'Yes' ELSE 'No' END as has_primary_contact,
  CASE WHEN attachments IS NOT NULL THEN 'Yes' ELSE 'No' END as has_attachments,
  LENGTH(description) as description_length,
  data_source,
  ui_link
FROM sam_gov_opportunities
ORDER BY last_scraped DESC, posted_date DESC
LIMIT 10;

-- 17. DATA FRESHNESS
-- ============================================
-- Check when data was last updated
SELECT 
  'Last Scrape' as metric,
  MAX(last_scraped) as timestamp,
  EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - MAX(last_scraped)))/3600 as hours_ago
FROM sam_gov_opportunities
UNION ALL
SELECT 
  'Latest Posted Opportunity',
  MAX(posted_date),
  EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - MAX(posted_date)))/3600
FROM sam_gov_opportunities;

-- 18. QUALITY SCORE CALCULATION
-- ============================================
-- Overall data quality score
WITH quality_metrics AS (
  SELECT 
    COUNT(*) as total,
    COUNT(notice_id)::float / COUNT(*) as notice_id_score,
    COUNT(title)::float / COUNT(*) as title_score,
    COUNT(CASE WHEN description IS NOT NULL AND description NOT LIKE 'https://api.sam.gov%' AND LENGTH(description) > 50 THEN 1 END)::float / COUNT(*) as description_score,
    COUNT(posted_date)::float / COUNT(*) as posted_date_score,
    COUNT(ui_link)::float / COUNT(*) as ui_link_score,
    COUNT(primary_contact)::float / COUNT(*) as contact_score,
    COUNT(attachments)::float / COUNT(*) as attachments_score
  FROM sam_gov_opportunities
)
SELECT 
  total as total_records,
  ROUND((notice_id_score + title_score + description_score + posted_date_score + ui_link_score) / 5 * 100, 2) as required_fields_score,
  ROUND((contact_score + attachments_score) / 2 * 100, 2) as optional_fields_score,
  ROUND(((notice_id_score + title_score + description_score + posted_date_score + ui_link_score + contact_score + attachments_score) / 7) * 100, 2) as overall_quality_score
FROM quality_metrics;

-- ============================================
-- INTERPRETATION GUIDE
-- ============================================
--
-- Quality Score Interpretation:
-- 95-100%: Excellent - Data is complete and rich
-- 80-94%:  Good - Most data present, minor gaps
-- 60-79%:  Fair - Significant gaps, needs improvement
-- <60%:    Poor - Major data quality issues
--
-- Data Source:
-- 'sam.gov-api-full': Has full details (descriptions, attachments, contacts)
-- 'sam.gov-api-search': Only basic search results
--
-- Recommended Actions:
-- 1. If description_score < 80%, re-scrape with --full-details flag
-- 2. If data_source shows mostly 'search', use full details mode
-- 3. If quality_score < 80%, review scraper configuration
-- 4. Check DAILY_SCRAPING_SCHEDULE.md for cron job setup
--
-- ============================================

