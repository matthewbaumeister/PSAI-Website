-- Add prize_structure_description column to army_innovation_opportunities
ALTER TABLE army_innovation_opportunities 
ADD COLUMN IF NOT EXISTS prize_structure_description TEXT;

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'army_innovation_opportunities' 
  AND column_name = 'prize_structure_description';

