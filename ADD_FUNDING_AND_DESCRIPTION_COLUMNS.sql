-- Add funding and consolidated description columns
-- Run this in Supabase SQL Editor

-- Keywords duplicates (for legacy compatibility)
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS keywords_2 TEXT;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS keywords_3 TEXT;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS keywords_4 TEXT;

-- Phase-specific descriptions (clearer names)
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS phase_i_description TEXT;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS phase_ii_description TEXT;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS phase_iii_dual_use TEXT;

-- Funding information (assumed amounts)
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS award_amount_phase_i DECIMAL(15,2);
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS award_amount_phase_ii DECIMAL(15,2);
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS award_duration_phase_i INTEGER;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS award_duration_phase_ii INTEGER;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS funding_max_text TEXT;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS total_potential_award DECIMAL(15,2);

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- Verify
SELECT COUNT(*) as total_columns
FROM information_schema.columns
WHERE table_name = 'sbir_final';

