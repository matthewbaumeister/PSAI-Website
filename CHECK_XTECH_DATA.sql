-- Check Army XTECH data collection results

-- 1. Total competitions scraped
SELECT 
  'Total Competitions' as metric,
  COUNT(*) as count
FROM army_innovation_opportunities;

-- 2. Total winners captured
SELECT 
  'Total Winners' as metric,
  COUNT(*) as count
FROM army_innovation_winners;

-- 3. Total finalists captured
SELECT 
  'Total Finalists' as metric,
  COUNT(*) as count
FROM army_innovation_finalists;

-- 4. Sample data completeness - check key fields
SELECT 
  COUNT(*) as total_records,
  COUNT(description) as has_description,
  COUNT(problem_statement) as has_problem_statement,
  COUNT(eligibility_requirements) as has_eligibility,
  COUNT(total_prize_pool) as has_prize_pool,
  COUNT(max_award_amount) as has_max_award,
  COUNT(evaluation_stages) as has_phases,
  COUNT(submission_format) as has_submission_format,
  COUNT(page_limit) as has_page_limit,
  COUNT(open_date) as has_open_date,
  COUNT(close_date) as has_close_date,
  COUNT(winner_announcement_date) as has_winner_date,
  COUNT(actual_participants) as has_participant_count,
  COUNT(CASE WHEN description IS NOT NULL AND LENGTH(description) > 100 THEN 1 END) as has_substantial_description
FROM army_innovation_opportunities;

-- 5. Show a sample record with all its data
SELECT 
  id,
  opportunity_title,
  status,
  description,
  eligibility_requirements,
  total_prize_pool,
  max_award_amount,
  number_of_awards,
  evaluation_stages,
  submission_format,
  page_limit,
  open_date,
  close_date,
  winner_announcement_date,
  actual_participants,
  opportunity_url
FROM army_innovation_opportunities
WHERE opportunity_title LIKE '%xTechCounter Strike%'
LIMIT 1;

-- 6. Show competitions by status
SELECT 
  status,
  COUNT(*) as count
FROM army_innovation_opportunities
GROUP BY status
ORDER BY count DESC;

-- 7. Show competitions with most winners
SELECT 
  o.opportunity_title,
  o.status,
  COUNT(w.id) as winner_count
FROM army_innovation_opportunities o
LEFT JOIN army_innovation_winners w ON o.id = w.opportunity_id
GROUP BY o.id, o.opportunity_title, o.status
HAVING COUNT(w.id) > 0
ORDER BY winner_count DESC
LIMIT 10;

-- 8. Show competitions with most finalists
SELECT 
  o.opportunity_title,
  o.status,
  COUNT(f.id) as finalist_count
FROM army_innovation_opportunities o
LEFT JOIN army_innovation_finalists f ON o.id = f.opportunity_id
GROUP BY o.id, o.opportunity_title, o.status
HAVING COUNT(f.id) > 0
ORDER BY finalist_count DESC
LIMIT 10;

