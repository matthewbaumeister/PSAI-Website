-- ====================================
-- DEBUG ACTIONS ISSUE - COMBINED OUTPUT
-- ====================================
-- All checks in one table

SELECT 
  '1. OVERALL STATUS' as section,
  COUNT(*) FILTER (WHERE actions IS NULL)::text as actions_null,
  COUNT(*) FILTER (WHERE actions IS NOT NULL)::text as actions_not_null,
  COUNT(*)::text as total_bills,
  NULL::text as bill_sample,
  NULL::text as action_count_sample
FROM congressional_bills

UNION ALL

-- Sample bills with their action status
SELECT * FROM (
  SELECT 
    '2. SAMPLE BILLS' as section,
    (bill_type || ' ' || bill_number)::text as bill_id,
    LEFT(title, 40)::text as title_preview,
    (actions IS NULL)::text as actions_is_null,
    action_count::text as action_count,
    introduced_date::text as introduced
  FROM congressional_bills
  ORDER BY introduced_date DESC
  LIMIT 5
) sample_bills;

