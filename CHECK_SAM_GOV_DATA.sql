-- ============================================
-- Check SAM.gov Opportunities Data
-- ============================================
-- View and analyze your scraped SAM.gov data

-- ============================================
-- 1. Recent Opportunities (Last 7 Days)
-- ============================================
SELECT 
  notice_id,
  title,
  posted_date,
  type,
  set_aside,
  naics_code,
  office_name,
  response_deadline,
  fpds_piid  -- Link to FPDS contract
FROM sam_gov_opportunities
WHERE posted_date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY posted_date DESC
LIMIT 50;

-- ============================================
-- 2. Opportunities with Full Details
-- ============================================
-- Check which ones have descriptions and attachments
SELECT 
  notice_id,
  title,
  posted_date,
  LENGTH(description) as description_length,
  CASE 
    WHEN description IS NOT NULL AND description != '' THEN '✓ Yes'
    ELSE '✗ No'
  END as has_description,
  CASE 
    WHEN attachments IS NOT NULL THEN '✓ Yes'
    ELSE '✗ No'
  END as has_attachments,
  office_name
FROM sam_gov_opportunities
WHERE posted_date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY posted_date DESC
LIMIT 30;

-- ============================================
-- 3. Overall Statistics
-- ============================================
SELECT 
  COUNT(*) as total_opportunities,
  COUNT(DISTINCT notice_id) as unique_notices,
  MIN(posted_date) as earliest_posted,
  MAX(posted_date) as latest_posted,
  COUNT(*) FILTER (WHERE description IS NOT NULL AND description != '') as with_description,
  COUNT(*) FILTER (WHERE attachments IS NOT NULL) as with_attachments,
  COUNT(*) FILTER (WHERE fpds_piid IS NOT NULL) as linked_to_fpds,
  COUNT(*) FILTER (WHERE set_aside IS NOT NULL) as with_set_aside
FROM sam_gov_opportunities;

-- ============================================
-- 4. Opportunities by Date
-- ============================================
SELECT 
  DATE(posted_date) as posted_date,
  COUNT(*) as opportunities,
  COUNT(*) FILTER (WHERE type = 'Solicitation') as solicitations,
  COUNT(*) FILTER (WHERE type = 'Award Notice') as awards,
  COUNT(*) FILTER (WHERE set_aside IS NOT NULL) as with_set_aside
FROM sam_gov_opportunities
WHERE posted_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(posted_date)
ORDER BY posted_date DESC;

-- ============================================
-- 5. Top Agencies
-- ============================================
SELECT 
  office_name,
  COUNT(*) as opportunities,
  COUNT(*) FILTER (WHERE type = 'Solicitation') as solicitations,
  COUNT(*) FILTER (WHERE type = 'Award Notice') as awards
FROM sam_gov_opportunities
WHERE posted_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY office_name
ORDER BY opportunities DESC
LIMIT 20;

-- ============================================
-- 6. Top NAICS Codes
-- ============================================
SELECT 
  naics_code,
  COUNT(*) as opportunities,
  STRING_AGG(DISTINCT office_name, ', ') as agencies
FROM sam_gov_opportunities
WHERE posted_date >= CURRENT_DATE - INTERVAL '30 days'
  AND naics_code IS NOT NULL
GROUP BY naics_code
ORDER BY opportunities DESC
LIMIT 20;

-- ============================================
-- 7. Opportunities Linked to FPDS Contracts
-- ============================================
-- See which SAM.gov opportunities have corresponding FPDS awards
SELECT 
  s.notice_id,
  s.title as sam_title,
  s.posted_date,
  s.type,
  f.piid as fpds_contract,
  f.vendor_name,
  f.current_total_value_of_award as contract_value,
  f.date_signed
FROM sam_gov_opportunities s
INNER JOIN fpds_contracts f ON s.fpds_piid = f.piid
WHERE s.posted_date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY s.posted_date DESC
LIMIT 30;

-- ============================================
-- 8. Set-Aside Opportunities
-- ============================================
-- Small business opportunities
SELECT 
  notice_id,
  title,
  posted_date,
  set_aside,
  naics_code,
  office_name,
  response_deadline
FROM sam_gov_opportunities
WHERE set_aside IS NOT NULL
  AND posted_date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY posted_date DESC
LIMIT 50;

-- ============================================
-- 9. Opportunities with Attachments
-- ============================================
-- View opportunities that have document attachments
SELECT 
  notice_id,
  title,
  posted_date,
  office_name,
  jsonb_array_length(attachments) as attachment_count,
  attachments
FROM sam_gov_opportunities
WHERE attachments IS NOT NULL
  AND posted_date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY posted_date DESC
LIMIT 20;

-- ============================================
-- 10. Upcoming Deadlines (Next 30 Days)
-- ============================================
SELECT 
  notice_id,
  title,
  posted_date,
  response_deadline,
  response_deadline - CURRENT_DATE as days_until_deadline,
  set_aside,
  office_name
FROM sam_gov_opportunities
WHERE response_deadline BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
ORDER BY response_deadline ASC
LIMIT 50;

-- ============================================
-- 11. Full Details for Specific Opportunity
-- ============================================
-- Replace 'NOTICE_ID_HERE' with actual notice_id
/*
SELECT 
  notice_id,
  title,
  description,
  posted_date,
  response_deadline,
  type,
  set_aside,
  naics_code,
  office_name,
  attachments,
  point_of_contact,
  additional_info,
  fpds_piid
FROM sam_gov_opportunities
WHERE notice_id = 'NOTICE_ID_HERE';
*/

-- ============================================
-- 12. Data Quality Report
-- ============================================
SELECT 
  'Total Records' as metric,
  COUNT(*)::text as value
FROM sam_gov_opportunities
UNION ALL
SELECT 
  'With Full Description',
  COUNT(*)::text
FROM sam_gov_opportunities
WHERE description IS NOT NULL AND LENGTH(description) > 100
UNION ALL
SELECT 
  'With Attachments',
  COUNT(*)::text
FROM sam_gov_opportunities
WHERE attachments IS NOT NULL
UNION ALL
SELECT 
  'Linked to FPDS',
  COUNT(*)::text
FROM sam_gov_opportunities
WHERE fpds_piid IS NOT NULL
UNION ALL
SELECT 
  'With Response Deadline',
  COUNT(*)::text
FROM sam_gov_opportunities
WHERE response_deadline IS NOT NULL
UNION ALL
SELECT 
  'Active (Deadline Future)',
  COUNT(*)::text
FROM sam_gov_opportunities
WHERE response_deadline > CURRENT_DATE;

