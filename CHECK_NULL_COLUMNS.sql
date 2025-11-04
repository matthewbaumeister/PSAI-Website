-- ============================================
-- Check Which Columns Are Empty (100% NULL)
-- ============================================
-- Run in Supabase SQL Editor
-- ============================================

-- Get total count first
SELECT COUNT(*) as total_bills FROM congressional_bills;

-- Check key columns for NULL values
SELECT 
  'title' as column_name,
  COUNT(*) FILTER (WHERE title IS NOT NULL) as filled,
  COUNT(*) FILTER (WHERE title IS NULL) as empty,
  ROUND(100.0 * COUNT(*) FILTER (WHERE title IS NOT NULL) / COUNT(*), 1) as percent_filled
FROM congressional_bills
UNION ALL
SELECT 'short_title', COUNT(*) FILTER (WHERE short_title IS NOT NULL), COUNT(*) FILTER (WHERE short_title IS NULL), ROUND(100.0 * COUNT(*) FILTER (WHERE short_title IS NOT NULL) / COUNT(*), 1) FROM congressional_bills
UNION ALL
SELECT 'official_title', COUNT(*) FILTER (WHERE official_title IS NOT NULL), COUNT(*) FILTER (WHERE official_title IS NULL), ROUND(100.0 * COUNT(*) FILTER (WHERE official_title IS NOT NULL) / COUNT(*), 1) FROM congressional_bills
UNION ALL
SELECT 'summary', COUNT(*) FILTER (WHERE summary IS NOT NULL), COUNT(*) FILTER (WHERE summary IS NULL), ROUND(100.0 * COUNT(*) FILTER (WHERE summary IS NOT NULL) / COUNT(*), 1) FROM congressional_bills
UNION ALL
SELECT 'purpose', COUNT(*) FILTER (WHERE purpose IS NOT NULL), COUNT(*) FILTER (WHERE purpose IS NULL), ROUND(100.0 * COUNT(*) FILTER (WHERE purpose IS NOT NULL) / COUNT(*), 1) FROM congressional_bills
UNION ALL
SELECT 'policy_area', COUNT(*) FILTER (WHERE policy_area IS NOT NULL), COUNT(*) FILTER (WHERE policy_area IS NULL), ROUND(100.0 * COUNT(*) FILTER (WHERE policy_area IS NOT NULL) / COUNT(*), 1) FROM congressional_bills
UNION ALL
SELECT 'status', COUNT(*) FILTER (WHERE status IS NOT NULL), COUNT(*) FILTER (WHERE status IS NULL), ROUND(100.0 * COUNT(*) FILTER (WHERE status IS NOT NULL) / COUNT(*), 1) FROM congressional_bills
UNION ALL
SELECT 'cosponsors', COUNT(*) FILTER (WHERE cosponsors IS NOT NULL), COUNT(*) FILTER (WHERE cosponsors IS NULL), ROUND(100.0 * COUNT(*) FILTER (WHERE cosponsors IS NOT NULL) / COUNT(*), 1) FROM congressional_bills
UNION ALL
SELECT 'actions', COUNT(*) FILTER (WHERE actions IS NOT NULL), COUNT(*) FILTER (WHERE actions IS NULL), ROUND(100.0 * COUNT(*) FILTER (WHERE actions IS NOT NULL) / COUNT(*), 1) FROM congressional_bills
UNION ALL
SELECT 'amendments', COUNT(*) FILTER (WHERE amendments IS NOT NULL), COUNT(*) FILTER (WHERE amendments IS NULL), ROUND(100.0 * COUNT(*) FILTER (WHERE amendments IS NOT NULL) / COUNT(*), 1) FROM congressional_bills
UNION ALL
SELECT 'text_versions', COUNT(*) FILTER (WHERE text_versions IS NOT NULL), COUNT(*) FILTER (WHERE text_versions IS NULL), ROUND(100.0 * COUNT(*) FILTER (WHERE text_versions IS NOT NULL) / COUNT(*), 1) FROM congressional_bills
UNION ALL
SELECT 'related_bills', COUNT(*) FILTER (WHERE related_bills IS NOT NULL), COUNT(*) FILTER (WHERE related_bills IS NULL), ROUND(100.0 * COUNT(*) FILTER (WHERE related_bills IS NOT NULL) / COUNT(*), 1) FROM congressional_bills
UNION ALL
SELECT 'committees', COUNT(*) FILTER (WHERE committees IS NOT NULL), COUNT(*) FILTER (WHERE committees IS NULL), ROUND(100.0 * COUNT(*) FILTER (WHERE committees IS NOT NULL) / COUNT(*), 1) FROM congressional_bills
UNION ALL
SELECT 'sponsor_name', COUNT(*) FILTER (WHERE sponsor_name IS NOT NULL), COUNT(*) FILTER (WHERE sponsor_name IS NULL), ROUND(100.0 * COUNT(*) FILTER (WHERE sponsor_name IS NOT NULL) / COUNT(*), 1) FROM congressional_bills
UNION ALL
SELECT 'pdf_url', COUNT(*) FILTER (WHERE pdf_url IS NOT NULL), COUNT(*) FILTER (WHERE pdf_url IS NULL), ROUND(100.0 * COUNT(*) FILTER (WHERE pdf_url IS NOT NULL) / COUNT(*), 1) FROM congressional_bills
UNION ALL
SELECT 'defense_programs_mentioned', COUNT(*) FILTER (WHERE defense_programs_mentioned IS NOT NULL), COUNT(*) FILTER (WHERE defense_programs_mentioned IS NULL), ROUND(100.0 * COUNT(*) FILTER (WHERE defense_programs_mentioned IS NOT NULL) / COUNT(*), 1) FROM congressional_bills
UNION ALL
SELECT 'contractors_mentioned', COUNT(*) FILTER (WHERE contractors_mentioned IS NOT NULL), COUNT(*) FILTER (WHERE contractors_mentioned IS NULL), ROUND(100.0 * COUNT(*) FILTER (WHERE contractors_mentioned IS NOT NULL) / COUNT(*), 1) FROM congressional_bills
ORDER BY percent_filled ASC;

-- Show only columns that are 100% empty (might need new comprehensive data)
-- These will show after you run the new comprehensive scraper

