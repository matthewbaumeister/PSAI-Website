-- Clear only the submissions (winners/finalists) to re-scrape them
-- Keep the competitions intact

DELETE FROM army_innovation_submissions;

-- Verify deletion
SELECT 
  (SELECT COUNT(*) FROM army_innovation_opportunities) as competitions_count,
  (SELECT COUNT(*) FROM army_innovation_submissions) as submissions_count;
