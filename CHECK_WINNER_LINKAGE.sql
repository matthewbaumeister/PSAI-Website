-- Verify winners are properly linked to competitions

-- Show winners with their competition details
SELECT 
  s.company_name,
  s.submission_status,
  s.award_amount,
  o.opportunity_title as competition_won,
  o.total_prize_pool as competition_total_prize,
  o.open_date,
  o.close_date,
  o.status
FROM army_innovation_submissions s
JOIN army_innovation_opportunities o ON s.opportunity_id = o.id
WHERE s.submission_status = 'Winner'
ORDER BY o.opportunity_title, s.company_name
LIMIT 20;

-- Count winners per competition
SELECT 
  o.opportunity_title,
  o.total_prize_pool,
  COUNT(s.id) as winner_count,
  o.number_of_awards
FROM army_innovation_opportunities o
LEFT JOIN army_innovation_submissions s ON o.id = s.opportunity_id AND s.submission_status = 'Winner'
GROUP BY o.id, o.opportunity_title, o.total_prize_pool, o.number_of_awards
HAVING COUNT(s.id) > 0
ORDER BY winner_count DESC;

