-- Add all missing calculated field columns to sbir_final
-- Run this in Supabase SQL Editor

-- Date calculated fields
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS days_until_close INTEGER;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS days_until_close_1 TEXT;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS days_since_open INTEGER;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS duration_days INTEGER;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS pre_release_duration INTEGER;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS last_activity_date TIMESTAMPTZ;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS urgency_level TEXT;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS proposal_window_status TEXT;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS solicitation_phase TEXT;

-- Q&A calculated fields
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS days_until_qa_close INTEGER;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS qa_response_rate_percentage INTEGER;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS qa_window_active TEXT;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS qa_content_fetched TEXT;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS qa_last_updated TIMESTAMPTZ;

-- Phase information
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS phases_available TEXT;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS phase TEXT;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS phase_types TEXT[];
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS phase_count INTEGER;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- Verify columns were added
SELECT COUNT(*) as total_columns
FROM information_schema.columns
WHERE table_name = 'sbir_final';

