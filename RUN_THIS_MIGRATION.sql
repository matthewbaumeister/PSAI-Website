-- ========================================
-- ADD INSTRUCTION COLUMNS TO SBIR_FINAL
-- ========================================

-- Add columns
ALTER TABLE sbir_final 
ADD COLUMN IF NOT EXISTS consolidated_instructions_url TEXT,
ADD COLUMN IF NOT EXISTS instructions_plain_text TEXT,
ADD COLUMN IF NOT EXISTS instructions_generated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS instructions_volume_structure JSONB,
ADD COLUMN IF NOT EXISTS instructions_checklist JSONB;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_sbir_final_instructions_generated 
  ON sbir_final(instructions_generated_at) 
  WHERE consolidated_instructions_url IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_sbir_final_active_with_instructions 
  ON sbir_final(status, consolidated_instructions_url) 
  WHERE status IN ('Open', 'Prerelease', 'Active');

-- Add comments
COMMENT ON COLUMN sbir_final.consolidated_instructions_url IS 'URL to pre-generated consolidated instruction PDF in Supabase Storage';
COMMENT ON COLUMN sbir_final.instructions_plain_text IS 'Full plain text archive of all instruction documents for historical preservation';
COMMENT ON COLUMN sbir_final.instructions_generated_at IS 'Timestamp when instruction document was generated';
COMMENT ON COLUMN sbir_final.instructions_volume_structure IS 'JSON structure of volume requirements (Volume 1, 2, 3, etc.)';
COMMENT ON COLUMN sbir_final.instructions_checklist IS 'JSON array of checklist items extracted from instructions';

