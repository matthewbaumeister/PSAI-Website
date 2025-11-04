-- ============================================
-- Check Data Quality - Which Fields Are Actually Populated
-- ============================================

-- Total bills
SELECT COUNT(*) as total_bills FROM congressional_bills;

-- Check each important field
SELECT 
  COUNT(*) as total_bills,
  COUNT(title) as has_title,
  COUNT(short_title) as has_short_title,
  COUNT(official_title) as has_official_title,
  COUNT(summary) as has_summary,
  COUNT(purpose) as has_purpose,
  COUNT(status) as has_status,
  COUNT(policy_area) as has_policy_area,
  COUNT(sponsor_name) as has_sponsor,
  COUNT(CASE WHEN cosponsor_count > 0 THEN 1 END) as has_cosponsors,
  COUNT(CASE WHEN cosponsors IS NOT NULL THEN 1 END) as has_cosponsor_data,
  COUNT(CASE WHEN action_count > 0 THEN 1 END) as has_actions,
  COUNT(CASE WHEN actions IS NOT NULL AND jsonb_typeof(actions) = 'array' THEN 1 END) as has_action_array,
  COUNT(CASE WHEN amendment_count > 0 THEN 1 END) as has_amendments,
  COUNT(CASE WHEN amendments IS NOT NULL THEN 1 END) as has_amendment_data,
  COUNT(CASE WHEN text_versions IS NOT NULL THEN 1 END) as has_text_versions,
  COUNT(CASE WHEN related_bills IS NOT NULL THEN 1 END) as has_related_bills,
  COUNT(CASE WHEN array_length(committees, 1) > 0 THEN 1 END) as has_committees,
  COUNT(pdf_url) as has_pdf_url
FROM congressional_bills;

-- Show some examples of what's in actions, amendments, text_versions
SELECT 
  congress,
  bill_type,
  bill_number,
  title,
  action_count,
  CASE 
    WHEN actions IS NULL THEN 'NULL'
    WHEN jsonb_typeof(actions) = 'object' THEN 'Reference Object (needs fix)'
    WHEN jsonb_typeof(actions) = 'array' THEN 'Array (' || jsonb_array_length(actions) || ' items)'
    ELSE 'Unknown type'
  END as actions_status,
  CASE 
    WHEN amendments IS NULL THEN 'NULL'
    WHEN jsonb_typeof(amendments) = 'object' THEN 'Reference Object (needs fix)'
    WHEN jsonb_typeof(amendments) = 'array' THEN 'Array (' || jsonb_array_length(amendments) || ' items)'
    ELSE 'Unknown type'
  END as amendments_status,
  CASE 
    WHEN text_versions IS NULL THEN 'NULL'
    WHEN jsonb_typeof(text_versions) = 'object' THEN 'Reference Object (needs fix)'
    WHEN jsonb_typeof(text_versions) = 'array' THEN 'Array (' || jsonb_array_length(text_versions) || ' items)'
    ELSE 'Unknown type'
  END as text_versions_status
FROM congressional_bills
ORDER BY action_count DESC
LIMIT 10;

-- Check if we have reference objects instead of actual data
SELECT 
  COUNT(*) FILTER (WHERE actions::text LIKE '%"url":%') as actions_broken,
  COUNT(*) FILTER (WHERE amendments::text LIKE '%"url":%') as amendments_broken,
  COUNT(*) FILTER (WHERE text_versions::text LIKE '%"url":%') as text_versions_broken,
  COUNT(*) FILTER (WHERE cosponsors::text LIKE '%"url":%') as cosponsors_broken
FROM congressional_bills;

