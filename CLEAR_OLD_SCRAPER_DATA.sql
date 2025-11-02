-- ============================================
-- Clear Old Scraper Data (Fresh Start)
-- ============================================
-- Run this if you want to clear old error logs
-- and scraper progress from previous runs
-- before starting the new page-level scraper
-- ============================================

-- WARNING: This will delete:
-- 1. All failed contract logs
-- 2. All scraper run logs
-- 3. Page progress tracking
-- 
-- It will NOT delete actual contract data!
-- ============================================

-- STEP 1: Check what will be deleted
SELECT 'Failed Contracts' as table_name, COUNT(*) as records FROM fpds_failed_contracts
UNION ALL
SELECT 'Scraper Logs', COUNT(*) FROM fpds_scraper_log
UNION ALL
SELECT 'Page Progress', COUNT(*) FROM fpds_page_progress;

-- STEP 2: Uncomment lines below to DELETE (remove the -- from the lines)

-- DELETE FROM fpds_failed_contracts;
-- DELETE FROM fpds_scraper_log WHERE scrape_type = 'daily' OR scrape_type = 'date_range';
-- DELETE FROM fpds_page_progress;

-- STEP 3: Verify deletion
-- SELECT 'Failed Contracts' as table_name, COUNT(*) as records FROM fpds_failed_contracts
-- UNION ALL
-- SELECT 'Scraper Logs', COUNT(*) FROM fpds_scraper_log
-- UNION ALL
-- SELECT 'Page Progress', COUNT(*) FROM fpds_page_progress;

