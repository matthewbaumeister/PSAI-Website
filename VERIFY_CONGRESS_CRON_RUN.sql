-- ====================================
-- VERIFY CONGRESS.GOV CRON RUN
-- ====================================
-- Single query to verify the daily cron job worked
-- Shows all results in one table

-- 1. OVERALL DATABASE STATUS
SELECT 
  '1. DATABASE STATUS' as check_section,
  COUNT(*)::text as total_bills,
  COUNT(*) FILTER (WHERE is_defense_related = true)::text as defense_bills,
  COUNT(DISTINCT congress)::text as congresses,
  MAX(last_scraped)::text as most_recent_scrape,
  NULL::text as extra_info

FROM congressional_bills

UNION ALL

-- 2. COUNT OF BILLS UPDATED IN LAST HOUR
SELECT 
  '2. CRON RUN SUMMARY' as check_section,
  COUNT(*)::text as bills_updated_last_hour,
  MIN(last_scraped)::text as first_update,
  MAX(last_scraped)::text as last_update,
  COUNT(*) FILTER (WHERE is_defense_related = true)::text as defense_bills_updated,
  NULL::text as extra
FROM congressional_bills
WHERE last_scraped > NOW() - INTERVAL '1 hour'

UNION ALL

-- 3. SAMPLE BILLS FROM CRON RUN (5 most recent)
SELECT * FROM (
  SELECT 
    '3. SAMPLE RECENT BILLS' as check_section,
    (bill_type || ' ' || bill_number)::text as bill_id,
    LEFT(title, 40)::text as title_preview,
    is_defense_related::text as is_defense,
    action_count::text as actions,
    last_scraped::text as scraped_at
  FROM congressional_bills
  WHERE last_scraped > NOW() - INTERVAL '1 hour'
  ORDER BY last_scraped DESC
  LIMIT 5
) sample_bills

UNION ALL

-- 4. DATA COMPLETENESS CHECK (bills from last hour)
SELECT 
  '4. DATA COMPLETENESS' as check_section,
  COUNT(*)::text as total_in_last_hour,
  COUNT(actions) FILTER (WHERE jsonb_typeof(actions) = 'array')::text as has_actions_array,
  COUNT(cosponsors) FILTER (WHERE jsonb_typeof(cosponsors) = 'array')::text as has_cosponsors_array,
  COUNT(amendments) FILTER (WHERE jsonb_typeof(amendments) = 'array')::text as has_amendments_array,
  COUNT(text_versions) FILTER (WHERE jsonb_typeof(text_versions) = 'array')::text as has_text_versions_array
FROM congressional_bills
WHERE last_scraped > NOW() - INTERVAL '1 hour'

UNION ALL

-- 5. SAMPLE DATA QUALITY (bill with most data)
SELECT * FROM (
  SELECT 
    '5. RICHEST BILL SAMPLE' as check_section,
    (bill_type || ' ' || bill_number)::text as bill_id,
    action_count::text as actions_count,
    cosponsor_count::text as cosponsors_count,
    CASE WHEN amendments IS NOT NULL THEN jsonb_array_length(amendments)::text ELSE '0' END as amendments_count,
    CASE WHEN text_versions IS NOT NULL THEN jsonb_array_length(text_versions)::text ELSE '0' END as text_versions_count
  FROM congressional_bills
  WHERE last_scraped > NOW() - INTERVAL '1 hour'
    AND action_count > 0
  ORDER BY action_count DESC
  LIMIT 1
) richest_bill;

