-- ============================================
-- Check Army XTECH Data Quality - All Results in One Table
-- ============================================

WITH overall_stats AS (
  SELECT 
    'Overall Stats' as section,
    NULL::text as detail_1,
    NULL::text as detail_2,
    NULL::text as detail_3,
    (SELECT COUNT(*)::text FROM army_innovation_opportunities) as metric_1,
    (SELECT COUNT(*)::text FROM army_innovation_submissions) as metric_2,
    (SELECT COUNT(*)::text FROM army_innovation_submissions WHERE submission_status = 'Winner') as metric_3,
    (SELECT COUNT(*)::text FROM army_innovation_submissions WHERE submission_status = 'Finalist') as metric_4
  
  UNION ALL
  
  SELECT 
    'Header',
    'Total Competitions',
    'Total Submissions',
    'Total Winners',
    'Value ↓',
    'Value ↓',
    'Value ↓',
    'Total Finalists →'
),

competitions_with_data AS (
  SELECT 
    'Coverage Stats' as section,
    'Competitions with Submissions' as detail_1,
    COUNT(DISTINCT opportunity_id)::text as detail_2,
    NULL as detail_3,
    NULL as metric_1,
    NULL as metric_2,
    NULL as metric_3,
    NULL as metric_4
  FROM army_innovation_submissions
  
  UNION ALL
  
  SELECT 
    'Coverage Stats',
    'Competitions without Submissions',
    COUNT(*)::text,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL
  FROM army_innovation_opportunities
  WHERE id NOT IN (SELECT DISTINCT opportunity_id FROM army_innovation_submissions)
),

top_competitions AS (
  SELECT 
    'Top Competition' as section,
    o.opportunity_title as detail_1,
    o.status as detail_2,
    COUNT(s.id)::text as detail_3,
    COUNT(CASE WHEN s.submission_status = 'Winner' THEN 1 END)::text as metric_1,
    COUNT(CASE WHEN s.submission_status = 'Finalist' THEN 1 END)::text as metric_2,
    NULL as metric_3,
    NULL as metric_4
  FROM army_innovation_opportunities o
  LEFT JOIN army_innovation_submissions s ON o.id = s.opportunity_id
  GROUP BY o.id, o.opportunity_title, o.status
  HAVING COUNT(s.id) > 0
  ORDER BY COUNT(s.id) DESC
  LIMIT 10
),

data_richness AS (
  SELECT 
    'Data Richness' as section,
    opportunity_title as detail_1,
    COALESCE(LENGTH(description)::text, '0') as detail_2,
    COALESCE(total_prize_pool::text, '0') as detail_3,
    COALESCE(ARRAY_LENGTH(evaluation_stages, 1)::text, '0') as metric_1,
    CASE WHEN open_date IS NOT NULL THEN 'Yes' ELSE 'No' END as metric_2,
    CASE WHEN close_date IS NOT NULL THEN 'Yes' ELSE 'No' END as metric_3,
    CASE WHEN eligibility_requirements IS NOT NULL THEN 'Yes' ELSE 'No' END as metric_4
  FROM army_innovation_opportunities
  ORDER BY total_prize_pool DESC NULLS LAST
  LIMIT 10
)

SELECT 
  section,
  detail_1 as "Competition/Metric",
  detail_2 as "Status/Value",
  detail_3 as "Count/Prize",
  metric_1 as "Winners/Phases",
  metric_2 as "Finalists/OpenDate",
  metric_3 as "Info_3/CloseDate",
  metric_4 as "Info_4/Eligibility"
FROM (
  SELECT 1 as sort_order, * FROM overall_stats
  UNION ALL
  SELECT 2, * FROM competitions_with_data
  UNION ALL
  SELECT 3, * FROM top_competitions
  UNION ALL
  SELECT 4, * FROM data_richness
) combined
ORDER BY sort_order, section;

