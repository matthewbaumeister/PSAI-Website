-- Check if the scraper_log tables actually have data

-- DoD Contract News
SELECT 'DoD News' as scraper, COUNT(*) as entries, MAX(started_at) as last_run
FROM dod_news_scraper_log;

-- Congress.gov
SELECT 'Congress' as scraper, COUNT(*) as entries, MAX(started_at) as last_run
FROM congress_scraper_log;

-- SAM.gov
SELECT 'SAM.gov' as scraper, COUNT(*) as entries, MAX(started_at) as last_run
FROM sam_gov_scraper_log;

-- SBIR/STTR
SELECT 'SBIR' as scraper, COUNT(*) as entries, MAX(started_at) as last_run
FROM sbir_scraper_log;

-- If all show 0 entries, the inserts are failing silently

