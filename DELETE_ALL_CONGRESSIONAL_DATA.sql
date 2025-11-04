-- ====================================
-- DELETE ALL CONGRESSIONAL DATA
-- ====================================
-- Fresh start - removes ALL bills from database

-- Delete all bills
TRUNCATE TABLE congressional_bills CASCADE;

-- Verify it's empty
SELECT COUNT(*) as remaining_bills FROM congressional_bills;

-- Show message
SELECT 'All congressional data deleted - ready for fresh import!' as status;

