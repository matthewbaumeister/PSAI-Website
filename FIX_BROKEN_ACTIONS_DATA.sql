-- ====================================
-- FIX BROKEN ACTIONS DATA
-- ====================================
-- Delete all bills with broken reference objects (not proper arrays)
-- These were imported before the bug fix

DELETE FROM congressional_bills
WHERE 
  -- Delete bills where actions is a reference object (not an array)
  actions IS NOT NULL 
  AND jsonb_typeof(actions) != 'array';

-- Verify cleanup
SELECT 
  'Cleanup Complete' as status,
  COUNT(*) as remaining_bills,
  COUNT(*) FILTER (WHERE actions IS NOT NULL) as bills_with_actions,
  COUNT(*) FILTER (WHERE jsonb_typeof(actions) = 'array') as bills_with_action_arrays
FROM congressional_bills;

