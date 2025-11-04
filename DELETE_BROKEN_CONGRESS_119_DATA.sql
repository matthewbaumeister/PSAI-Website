-- ====================================
-- DELETE ALL CONGRESS 119 DATA
-- ====================================
-- We need to re-import with the fixed code that properly fetches
-- actions, cosponsors, amendments, and text versions

-- Delete all bills from Congress 119
DELETE FROM congressional_bills 
WHERE congress = 119;

-- Verify deletion
SELECT 
  'DELETED' as status,
  COUNT(*) as remaining_bills_in_119
FROM congressional_bills
WHERE congress = 119;

-- Show what remains
SELECT 
  'REMAINING DATA' as status,
  COUNT(*) as total_bills,
  COUNT(DISTINCT congress) as congresses
FROM congressional_bills;

