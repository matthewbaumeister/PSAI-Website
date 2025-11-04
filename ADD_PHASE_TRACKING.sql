-- ============================================
-- Add Enhanced Phase Tracking to Army Innovation
-- ============================================

-- Add new columns for phase tracking
ALTER TABLE army_innovation_opportunities
ADD COLUMN IF NOT EXISTS current_phase_number INTEGER,
ADD COLUMN IF NOT EXISTS total_phases INTEGER,
ADD COLUMN IF NOT EXISTS phase_progress_percentage NUMERIC(5,2);

-- Add comments
COMMENT ON COLUMN army_innovation_opportunities.competition_phase IS 'Current phase name (e.g., "Phase 2: Technology Pitches")';
COMMENT ON COLUMN army_innovation_opportunities.current_phase_number IS 'Current phase number (1, 2, 3, etc.)';
COMMENT ON COLUMN army_innovation_opportunities.total_phases IS 'Total number of phases in competition';
COMMENT ON COLUMN army_innovation_opportunities.phase_progress_percentage IS 'Progress through competition (0-100)';
COMMENT ON COLUMN army_innovation_opportunities.evaluation_stages IS 'Array of all phase descriptions';

-- Create view for phase progress
CREATE OR REPLACE VIEW army_innovation_phase_progress AS
SELECT 
  id,
  opportunity_title,
  status,
  competition_phase,
  current_phase_number,
  total_phases,
  phase_progress_percentage,
  evaluation_stages,
  CASE 
    WHEN current_phase_number IS NOT NULL AND total_phases IS NOT NULL 
    THEN 'Phase ' || current_phase_number || ' of ' || total_phases
    ELSE competition_phase
  END as phase_display,
  CASE
    WHEN status = 'Closed' THEN 'Complete'
    WHEN status = 'Active' AND current_phase_number = total_phases THEN 'Final Phase'
    WHEN status = 'Active' AND current_phase_number < total_phases THEN 'In Progress'
    ELSE 'Unknown'
  END as phase_status,
  close_date,
  submission_deadline
FROM army_innovation_opportunities
ORDER BY 
  CASE status 
    WHEN 'Active' THEN 1 
    WHEN 'Open' THEN 2 
    ELSE 3 
  END,
  close_date DESC NULLS LAST;

-- Sample query to check phase tracking
SELECT 
  opportunity_title,
  status,
  phase_display,
  phase_status,
  evaluation_stages,
  close_date
FROM army_innovation_phase_progress
WHERE status IN ('Active', 'Open')
ORDER BY close_date;

