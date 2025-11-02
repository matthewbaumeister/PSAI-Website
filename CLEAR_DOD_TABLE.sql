-- =====================================================
-- Clear DoD Contract News Table for Fresh Test
-- =====================================================
-- This will DELETE ALL data from dod_contract_news
-- Use this to test that new scrapes collect data correctly
-- =====================================================

-- Delete all records from dod_contract_news
TRUNCATE TABLE dod_contract_news RESTART IDENTITY CASCADE;

-- Verify table is empty
SELECT COUNT(*) as remaining_records FROM dod_contract_news;

-- Show table is ready for fresh scraping
SELECT 'Table cleared - ready for fresh scrape test' as status;

