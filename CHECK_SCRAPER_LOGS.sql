-- ============================================
-- Check All Scraper Log Tables
-- ============================================
-- Run this to see what's actually in the scraper_log tables

-- Army Innovation (XTECH)
SELECT 'Army Innovation' as scraper, started_at, status, duration_seconds, records_found, records_inserted, records_updated
FROM army_innovation_scraper_log
ORDER BY started_at DESC
LIMIT 1;

-- SAM.gov
SELECT 'SAM.gov' as scraper, started_at, status, duration_seconds, records_found, records_inserted, records_updated
FROM sam_gov_scraper_log
ORDER BY started_at DESC
LIMIT 1;

-- FPDS
SELECT 'FPDS' as scraper, started_at, status, duration_seconds, records_found, records_inserted, records_updated
FROM fpds_scraper_log
ORDER BY started_at DESC
LIMIT 1;

-- Congress.gov
SELECT 'Congress' as scraper, started_at, status, duration_seconds, records_found, records_inserted, records_updated
FROM congress_scraper_log
ORDER BY started_at DESC
LIMIT 1;

-- DoD Contract News
SELECT 'DoD News' as scraper, started_at, status, duration_seconds, records_found, records_inserted, records_updated
FROM dod_news_scraper_log
ORDER BY started_at DESC
LIMIT 1;

-- SBIR/STTR
SELECT 'SBIR' as scraper, started_at, status, duration_seconds, records_found, records_inserted, records_updated
FROM sbir_scraper_log
ORDER BY started_at DESC
LIMIT 1;

