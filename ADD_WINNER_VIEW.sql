-- Create a convenient view to see winners with their competition details

CREATE OR REPLACE VIEW army_innovation_winners_with_details AS
SELECT 
  s.id as submission_id,
  s.company_name,
  s.company_location,
  s.submission_status,
  s.award_amount as individual_award,
  s.phase,
  s.public_abstract,
  
  -- Competition details
  o.id as opportunity_id,
  o.opportunity_title as competition_title,
  o.competition_name,
  o.competition_year,
  o.competition_phase,
  o.status as competition_status,
  o.total_prize_pool as competition_total_prize,
  o.max_award_amount as competition_max_award,
  o.number_of_awards as competition_total_awards,
  o.open_date,
  o.close_date,
  o.winner_announcement_date,
  o.opportunity_url as competition_url,
  
  -- Metadata
  s.created_at as winner_recorded_at
FROM army_innovation_submissions s
JOIN army_innovation_opportunities o ON s.opportunity_id = o.id
WHERE s.submission_status = 'Winner'
ORDER BY o.opportunity_title, s.company_name;

-- Create view for finalists too
CREATE OR REPLACE VIEW army_innovation_finalists_with_details AS
SELECT 
  s.id as submission_id,
  s.company_name,
  s.company_location,
  s.submission_status,
  s.phase,
  s.public_abstract,
  
  -- Competition details
  o.id as opportunity_id,
  o.opportunity_title as competition_title,
  o.competition_name,
  o.competition_year,
  o.competition_phase,
  o.status as competition_status,
  o.total_prize_pool as competition_total_prize,
  o.open_date,
  o.close_date,
  o.opportunity_url as competition_url,
  
  -- Metadata
  s.created_at as finalist_recorded_at
FROM army_innovation_submissions s
JOIN army_innovation_opportunities o ON s.opportunity_id = o.id
WHERE s.submission_status = 'Finalist'
ORDER BY o.opportunity_title, s.company_name;

-- Now you can easily query:
-- SELECT * FROM army_innovation_winners_with_details;
-- SELECT * FROM army_innovation_finalists_with_details;

-- Example: Find all winners for a specific competition
-- SELECT company_name, individual_award, competition_title 
-- FROM army_innovation_winners_with_details 
-- WHERE competition_title LIKE '%xTechSearch 8%';

