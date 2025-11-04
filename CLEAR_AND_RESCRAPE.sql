-- Clear all Army Innovation data and re-scrape from scratch
-- This ensures we capture all competitions, winners, and finalists

-- Step 1: Clear submissions first (foreign key constraint)
DELETE FROM army_innovation_submissions;

-- Step 2: Clear opportunities
DELETE FROM army_innovation_opportunities;

-- Step 3: Verify deletion
SELECT 
  (SELECT COUNT(*) FROM army_innovation_opportunities) as opportunities_count,
  (SELECT COUNT(*) FROM army_innovation_submissions) as submissions_count;

-- Now run: npm run scrape:army-innovation:historical

