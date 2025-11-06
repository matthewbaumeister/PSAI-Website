-- ============================================
-- FIX GSA TABLE SCHEMA
-- Add missing column needed for import
-- ============================================

-- Add additional_data column to store extra fields from GSA Excel files
ALTER TABLE gsa_schedule_holders 
ADD COLUMN IF NOT EXISTS additional_data JSONB;

COMMENT ON COLUMN gsa_schedule_holders.additional_data IS 'Stores any additional columns from GSA Excel files that dont map to standard fields';

-- Verify the schema
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'gsa_schedule_holders' 
ORDER BY ordinal_position;

