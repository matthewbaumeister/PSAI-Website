-- ============================================
-- FINAL ARMY XTECH DATA VERIFICATION
-- Run this after the historical scraper completes
-- ============================================

-- PART 1: OVERALL SUMMARY
-- ============================================
SELECT 
  '=== OVERALL SUMMARY ===' as report_section,
  (SELECT COUNT(*) FROM army_innovation_opportunities) as total_competitions,
  (SELECT COUNT(*) FROM army_innovation_submissions) as total_submissions,
  (SELECT COUNT(*) FROM army_innovation_submissions WHERE submission_status = 'Winner') as total_winners,
  (SELECT COUNT(*) FROM army_innovation_submissions WHERE submission_status = 'Finalist') as total_finalists,
  (SELECT COUNT(*) FROM army_innovation_submissions WHERE submission_status = 'Semi-Finalist') as total_semifinalists,
  (SELECT COUNT(DISTINCT opportunity_id) FROM army_innovation_submissions) as competitions_with_submissions,
  (SELECT COUNT(*) FROM army_innovation_opportunities 
   WHERE id NOT IN (SELECT DISTINCT opportunity_id FROM army_innovation_submissions)) as competitions_without_submissions;

-- PART 2: TOP 20 COMPETITIONS BY SUBMISSION COUNT
-- ============================================
SELECT 
  '=== TOP 20 COMPETITIONS ===' as report_section,
  o.competition_name,
  o.status,
  COUNT(s.id) as total_submissions,
  COUNT(CASE WHEN s.submission_status = 'Winner' THEN 1 END) as winners,
  COUNT(CASE WHEN s.submission_status = 'Finalist' THEN 1 END) as finalists,
  COUNT(CASE WHEN s.submission_status = 'Semi-Finalist' THEN 1 END) as semifinalists,
  o.competition_year,
  o.total_prize_pool
FROM army_innovation_opportunities o
LEFT JOIN army_innovation_submissions s ON o.id = s.opportunity_id
GROUP BY o.id, o.competition_name, o.status, o.competition_year, o.total_prize_pool
HAVING COUNT(s.id) > 0
ORDER BY COUNT(s.id) DESC
LIMIT 20;

-- PART 3: COMPETITIONS WITHOUT SUBMISSIONS (Potential Issues)
-- ============================================
SELECT 
  '=== COMPETITIONS WITHOUT SUBMISSIONS ===' as report_section,
  o.competition_name,
  o.status,
  o.competition_year,
  o.source_url
FROM army_innovation_opportunities o
LEFT JOIN army_innovation_submissions s ON o.id = s.opportunity_id
WHERE s.id IS NULL
ORDER BY o.competition_name;

-- PART 4: DATA RICHNESS CHECK
-- ============================================
SELECT 
  '=== DATA RICHNESS ===' as report_section,
  o.competition_name,
  CASE 
    WHEN LENGTH(o.description) > 0 THEN '✓' ELSE '✗' 
  END as has_description,
  CASE 
    WHEN o.total_prize_pool > 0 THEN '✓' ELSE '✗' 
  END as has_prize_pool,
  CASE 
    WHEN o.total_phases > 0 THEN '✓' ELSE '✗' 
  END as has_phases,
  CASE 
    WHEN o.open_date IS NOT NULL THEN '✓' ELSE '✗' 
  END as has_dates,
  LENGTH(o.description) as description_length,
  o.total_prize_pool,
  o.total_phases,
  COUNT(s.id) as submission_count
FROM army_innovation_opportunities o
LEFT JOIN army_innovation_submissions s ON o.id = s.opportunity_id
GROUP BY o.id, o.competition_name, o.description, o.total_prize_pool, o.total_phases, o.open_date
ORDER BY COUNT(s.id) DESC
LIMIT 30;

-- PART 5: SUBMISSION STATUS BREAKDOWN BY COMPETITION
-- ============================================
SELECT 
  '=== STATUS BREAKDOWN ===' as report_section,
  o.competition_name,
  COUNT(s.id) as total,
  COUNT(CASE WHEN s.submission_status = 'Winner' THEN 1 END) as winners,
  COUNT(CASE WHEN s.submission_status = 'Finalist' THEN 1 END) as finalists,
  COUNT(CASE WHEN s.submission_status = 'Semi-Finalist' THEN 1 END) as semifinalists,
  ROUND(
    COUNT(CASE WHEN s.submission_status = 'Winner' THEN 1 END)::NUMERIC / 
    NULLIF(COUNT(s.id), 0) * 100, 1
  ) as winner_percentage,
  ROUND(
    COUNT(CASE WHEN s.submission_status = 'Finalist' THEN 1 END)::NUMERIC / 
    NULLIF(COUNT(s.id), 0) * 100, 1
  ) as finalist_percentage
FROM army_innovation_opportunities o
INNER JOIN army_innovation_submissions s ON o.id = s.opportunity_id
GROUP BY o.id, o.competition_name
HAVING COUNT(s.id) >= 10
ORDER BY COUNT(s.id) DESC;

-- PART 6: PHASE TRACKING VERIFICATION
-- ============================================
SELECT 
  '=== PHASE TRACKING ===' as report_section,
  o.competition_name,
  o.competition_phase,
  o.current_phase_number,
  o.total_phases,
  o.phase_progress_percentage,
  o.status,
  COUNT(s.id) as submissions
FROM army_innovation_opportunities o
LEFT JOIN army_innovation_submissions s ON o.id = s.opportunity_id
WHERE o.total_phases > 0
GROUP BY o.id, o.competition_name, o.competition_phase, o.current_phase_number, 
         o.total_phases, o.phase_progress_percentage, o.status
ORDER BY o.phase_progress_percentage DESC, o.competition_name;

-- PART 7: SAMPLE COMPANIES FROM TOP COMPETITIONS
-- ============================================
SELECT 
  '=== SAMPLE COMPANIES ===' as report_section,
  o.competition_name,
  s.company_name,
  s.submission_status,
  LEFT(s.public_abstract, 100) as description_preview
FROM army_innovation_opportunities o
INNER JOIN army_innovation_submissions s ON o.id = s.opportunity_id
WHERE o.competition_name IN (
  SELECT o2.competition_name
  FROM army_innovation_opportunities o2
  INNER JOIN army_innovation_submissions s2 ON o2.id = s2.opportunity_id
  GROUP BY o2.id, o2.competition_name
  ORDER BY COUNT(s2.id) DESC
  LIMIT 5
)
ORDER BY o.competition_name, s.submission_status, s.company_name
LIMIT 50;

-- PART 8: SCRAPER LOG HISTORY
-- ============================================
SELECT 
  '=== SCRAPER LOGS ===' as report_section,
  scrape_type,
  status,
  competitions_found,
  competitions_processed,
  competitions_inserted,
  competitions_updated,
  errors_count,
  created_at
FROM army_innovation_scraper_log
ORDER BY created_at DESC
LIMIT 10;

-- PART 9: QUALITY METRICS SUMMARY
-- ============================================
SELECT 
  '=== QUALITY METRICS ===' as report_section,
  'Total Competitions' as metric,
  COUNT(*)::TEXT as value
FROM army_innovation_opportunities
UNION ALL
SELECT 
  '=== QUALITY METRICS ===' as report_section,
  'Competitions with >10 Submissions' as metric,
  COUNT(*)::TEXT
FROM (
  SELECT o.id
  FROM army_innovation_opportunities o
  INNER JOIN army_innovation_submissions s ON o.id = s.opportunity_id
  GROUP BY o.id
  HAVING COUNT(s.id) > 10
) as large_comps
UNION ALL
SELECT 
  '=== QUALITY METRICS ===' as report_section,
  'Avg Submissions per Competition' as metric,
  ROUND(AVG(sub_count), 1)::TEXT
FROM (
  SELECT COUNT(s.id) as sub_count
  FROM army_innovation_opportunities o
  INNER JOIN army_innovation_submissions s ON o.id = s.opportunity_id
  GROUP BY o.id
) as comp_counts
UNION ALL
SELECT 
  '=== QUALITY METRICS ===' as report_section,
  'Competitions with Full Data (Desc+Prize+Phases)' as metric,
  COUNT(*)::TEXT
FROM army_innovation_opportunities
WHERE LENGTH(description) > 100 
  AND total_prize_pool > 0 
  AND total_phases > 0
UNION ALL
SELECT 
  '=== QUALITY METRICS ===' as report_section,
  'Winner/Finalist Ratio' as metric,
  ROUND(
    (SELECT COUNT(*) FROM army_innovation_submissions WHERE submission_status = 'Winner')::NUMERIC /
    NULLIF((SELECT COUNT(*) FROM army_innovation_submissions WHERE submission_status = 'Finalist'), 0),
    2
  )::TEXT
UNION ALL
SELECT 
  '=== QUALITY METRICS ===' as report_section,
  'Data Completeness Score' as metric,
  ROUND(
    (COUNT(CASE WHEN LENGTH(description) > 100 THEN 1 END)::NUMERIC / COUNT(*)) * 100,
    1
  )::TEXT || '%'
FROM army_innovation_opportunities;

-- PART 10: FINAL VALIDATION
-- ============================================
SELECT 
  '=== FINAL VALIDATION ===' as report_section,
  CASE 
    WHEN (SELECT COUNT(*) FROM army_innovation_submissions) >= 200 THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as "200+ Submissions Check",
  CASE 
    WHEN (SELECT COUNT(*) FROM army_innovation_opportunities) >= 20 THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as "20+ Competitions Check",
  CASE 
    WHEN (SELECT COUNT(DISTINCT opportunity_id) FROM army_innovation_submissions)::NUMERIC / 
         NULLIF((SELECT COUNT(*) FROM army_innovation_opportunities), 0) >= 0.7 THEN '✅ PASS'
    ELSE '⚠️ WARN'
  END as "70%+ Coverage Check",
  CASE 
    WHEN (SELECT COUNT(*) FROM army_innovation_submissions WHERE submission_status NOT IN ('Winner', 'Finalist', 'Semi-Finalist')) = 0 THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as "Valid Statuses Check",
  CASE 
    WHEN (SELECT COUNT(*) FROM army_innovation_opportunities WHERE total_phases > 0)::NUMERIC / 
         NULLIF((SELECT COUNT(*) FROM army_innovation_opportunities), 0) >= 0.8 THEN '✅ PASS'
    ELSE '⚠️ WARN'
  END as "80%+ Phase Tracking Check";

