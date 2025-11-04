-- ====================================
-- DELETE ALL CONGRESSIONAL BILLS DATA
-- ====================================
-- This will clear all bills so you can re-import with the fixed scraper

-- ⚠️ WARNING: This deletes ALL congressional bills data!

TRUNCATE TABLE congressional_bills CASCADE;

-- Verify deletion
SELECT 
  'DATA CLEARED' as status,
  COUNT(*) as remaining_bills,
  'Ready for fresh import!' as message
FROM congressional_bills;

-- Check other tables (should be empty if CASCADE worked)
SELECT 
  'LINKED DATA' as status,
  COUNT(*) as contract_links
FROM congressional_contract_links;

