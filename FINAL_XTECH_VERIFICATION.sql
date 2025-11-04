-- ============================================
-- FINAL ARMY XTECH DATA VERIFICATION
-- Run this after the historical scraper completes
-- ALL RESULTS IN ONE TABLE
-- ============================================

WITH overall_stats AS (
  SELECT 
    'OVERALL SUMMARY' as section,
    'Total Competitions' as metric,
    COUNT(*)::TEXT as value,
    NULL as detail1,
    NULL as detail2,
    NULL as detail3,
    1 as sort_order
  FROM army_innovation_opportunities
  UNION ALL
  SELECT 
    'OVERALL SUMMARY',
    'Total Submissions',
    COUNT(*)::TEXT,
    NULL, NULL, NULL, 2
  FROM army_innovation_submissions
  UNION ALL
  SELECT 
    'OVERALL SUMMARY',
    'Total Winners',
    COUNT(*)::TEXT,
    NULL, NULL, NULL, 3
  FROM army_innovation_submissions WHERE submission_status = 'Winner'
  UNION ALL
  SELECT 
    'OVERALL SUMMARY',
    'Total Finalists',
    COUNT(*)::TEXT,
    NULL, NULL, NULL, 4
  FROM army_innovation_submissions WHERE submission_status = 'Finalist'
  UNION ALL
  SELECT 
    'OVERALL SUMMARY',
    'Total Semi-Finalists',
    COUNT(*)::TEXT,
    NULL, NULL, NULL, 5
  FROM army_innovation_submissions WHERE submission_status = 'Semi-Finalist'
  UNION ALL
  SELECT 
    'OVERALL SUMMARY',
    'Competitions with Submissions',
    COUNT(DISTINCT opportunity_id)::TEXT,
    NULL, NULL, NULL, 6
  FROM army_innovation_submissions
  UNION ALL
  SELECT 
    'OVERALL SUMMARY',
    'Competitions without Submissions',
    COUNT(*)::TEXT,
    NULL, NULL, NULL, 7
  FROM army_innovation_opportunities 
  WHERE id NOT IN (SELECT DISTINCT opportunity_id FROM army_innovation_submissions)
),

top_competitions AS (
  SELECT 
    'TOP COMPETITIONS' as section,
    o.competition_name as metric,
    COUNT(s.id)::TEXT as value,
    COUNT(CASE WHEN s.submission_status = 'Winner' THEN 1 END)::TEXT as detail1,
    COUNT(CASE WHEN s.submission_status = 'Finalist' THEN 1 END)::TEXT as detail2,
    o.status as detail3,
    ROW_NUMBER() OVER (ORDER BY COUNT(s.id) DESC) + 100 as sort_order
  FROM army_innovation_opportunities o
  LEFT JOIN army_innovation_submissions s ON o.id = s.opportunity_id
  GROUP BY o.id, o.competition_name, o.status
  HAVING COUNT(s.id) > 0
  ORDER BY COUNT(s.id) DESC
  LIMIT 20
),

missing_submissions AS (
  SELECT 
    'MISSING SUBMISSIONS' as section,
    o.competition_name as metric,
    o.status as value,
    o.source_url as detail1,
    NULL as detail2,
    NULL as detail3,
    ROW_NUMBER() OVER (ORDER BY o.competition_name) + 200 as sort_order
  FROM army_innovation_opportunities o
  LEFT JOIN army_innovation_submissions s ON o.id = s.opportunity_id
  WHERE s.id IS NULL
),

data_richness AS (
  SELECT 
    'DATA RICHNESS' as section,
    o.competition_name as metric,
    COUNT(s.id)::TEXT as value,
    CASE WHEN LENGTH(o.description) > 0 THEN '✓Desc' ELSE '✗Desc' END as detail1,
    CASE WHEN o.total_prize_pool > 0 THEN '✓Prize' ELSE '✗Prize' END as detail2,
    CASE WHEN o.total_phases > 0 THEN '✓Phases' ELSE '✗Phases' END as detail3,
    ROW_NUMBER() OVER (ORDER BY COUNT(s.id) DESC) + 300 as sort_order
  FROM army_innovation_opportunities o
  LEFT JOIN army_innovation_submissions s ON o.id = s.opportunity_id
  GROUP BY o.id, o.competition_name, o.description, o.total_prize_pool, o.total_phases
  LIMIT 20
),

quality_metrics AS (
  SELECT 
    'QUALITY METRICS' as section,
    'Competitions with >10 Submissions' as metric,
    COUNT(*)::TEXT as value,
    NULL as detail1,
    NULL as detail2,
    NULL as detail3,
    401 as sort_order
  FROM (
    SELECT o.id
    FROM army_innovation_opportunities o
    INNER JOIN army_innovation_submissions s ON o.id = s.opportunity_id
    GROUP BY o.id
    HAVING COUNT(s.id) > 10
  ) as large_comps
  UNION ALL
  SELECT 
    'QUALITY METRICS',
    'Avg Submissions per Competition',
    ROUND(AVG(sub_count), 1)::TEXT,
    NULL, NULL, NULL, 402
  FROM (
    SELECT COUNT(s.id) as sub_count
    FROM army_innovation_opportunities o
    INNER JOIN army_innovation_submissions s ON o.id = s.opportunity_id
    GROUP BY o.id
  ) as comp_counts
  UNION ALL
  SELECT 
    'QUALITY METRICS',
    'Competitions with Full Data',
    COUNT(*)::TEXT,
    NULL, NULL, NULL, 403
  FROM army_innovation_opportunities
  WHERE LENGTH(description) > 100 
    AND total_prize_pool > 0 
    AND total_phases > 0
  UNION ALL
  SELECT 
    'QUALITY METRICS',
    'Data Completeness Score',
    ROUND((COUNT(CASE WHEN LENGTH(description) > 100 THEN 1 END)::NUMERIC / COUNT(*)) * 100, 1)::TEXT || '%',
    NULL, NULL, NULL, 404
  FROM army_innovation_opportunities
),

validation_checks AS (
  SELECT 
    'VALIDATION' as section,
    '200+ Submissions Check' as metric,
    CASE WHEN (SELECT COUNT(*) FROM army_innovation_submissions) >= 200 THEN '✅ PASS' ELSE '❌ FAIL' END as value,
    (SELECT COUNT(*)::TEXT FROM army_innovation_submissions) as detail1,
    NULL as detail2,
    NULL as detail3,
    501 as sort_order
  UNION ALL
  SELECT 
    'VALIDATION',
    '20+ Competitions Check',
    CASE WHEN (SELECT COUNT(*) FROM army_innovation_opportunities) >= 20 THEN '✅ PASS' ELSE '❌ FAIL' END,
    (SELECT COUNT(*)::TEXT FROM army_innovation_opportunities),
    NULL, NULL, 502
  UNION ALL
  SELECT 
    'VALIDATION',
    '70%+ Coverage Check',
    CASE 
      WHEN (SELECT COUNT(DISTINCT opportunity_id) FROM army_innovation_submissions)::NUMERIC / 
           NULLIF((SELECT COUNT(*) FROM army_innovation_opportunities), 0) >= 0.7 THEN '✅ PASS'
      ELSE '⚠️ WARN'
    END,
    ROUND((SELECT COUNT(DISTINCT opportunity_id) FROM army_innovation_submissions)::NUMERIC / 
          NULLIF((SELECT COUNT(*) FROM army_innovation_opportunities), 0) * 100, 1)::TEXT || '%',
    NULL, NULL, 503
  UNION ALL
  SELECT 
    'VALIDATION',
    'Valid Statuses Check',
    CASE WHEN (SELECT COUNT(*) FROM army_innovation_submissions WHERE submission_status NOT IN ('Winner', 'Finalist', 'Semi-Finalist')) = 0 
         THEN '✅ PASS' ELSE '❌ FAIL' END,
    NULL, NULL, NULL, 504
  UNION ALL
  SELECT 
    'VALIDATION',
    '80%+ Phase Tracking',
    CASE 
      WHEN (SELECT COUNT(*) FROM army_innovation_opportunities WHERE total_phases > 0)::NUMERIC / 
           NULLIF((SELECT COUNT(*) FROM army_innovation_opportunities), 0) >= 0.8 THEN '✅ PASS'
      ELSE '⚠️ WARN'
    END,
    ROUND((SELECT COUNT(*) FROM army_innovation_opportunities WHERE total_phases > 0)::NUMERIC / 
          NULLIF((SELECT COUNT(*) FROM army_innovation_opportunities), 0) * 100, 1)::TEXT || '%',
    NULL, NULL, 505
)

SELECT * FROM overall_stats
UNION ALL
SELECT * FROM top_competitions
UNION ALL
SELECT * FROM missing_submissions
UNION ALL
SELECT * FROM data_richness
UNION ALL
SELECT * FROM quality_metrics
UNION ALL
SELECT * FROM validation_checks
ORDER BY sort_order;

-- ============================================
-- COLUMN LEGEND:
-- section  = Category of the check
-- metric   = What is being measured
-- value    = Primary value/count
-- detail1  = Additional info (Winners/Description/etc)
-- detail2  = Additional info (Finalists/Prize/etc)  
-- detail3  = Additional info (Status/Phases/etc)
-- ============================================
