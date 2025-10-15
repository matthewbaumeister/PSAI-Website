-- Add component_instructions_download column if missing
-- Run this in Supabase SQL Editor

ALTER TABLE sbir_final 
ADD COLUMN IF NOT EXISTS component_instructions_download TEXT;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- Verify
SELECT COUNT(*) as total_columns
FROM information_schema.columns
WHERE table_name = 'sbir_final';

