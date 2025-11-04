-- Check if winners/finalists are actually in the database
SELECT 
  (SELECT COUNT(*) FROM army_innovation_opportunities) as competitions_count,
  (SELECT COUNT(*) FROM army_innovation_submissions) as submissions_count,
  (SELECT COUNT(*) FROM army_innovation_submissions WHERE submission_status = 'Winner') as winners_count,
  (SELECT COUNT(*) FROM army_innovation_submissions WHERE submission_status = 'Finalist') as finalists_count;
