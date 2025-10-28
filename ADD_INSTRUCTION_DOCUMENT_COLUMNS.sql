-- ========================================
-- ADD INSTRUCTION DOCUMENT COLUMNS
-- ========================================
-- Adds columns to store pre-generated consolidated instruction documents
-- for SBIR/STTR opportunities with historical archival

-- Add columns for consolidated instruction documents
ALTER TABLE dsip_opportunities 
ADD COLUMN IF NOT EXISTS consolidated_instructions_url TEXT,
ADD COLUMN IF NOT EXISTS instructions_plain_text TEXT,
ADD COLUMN IF NOT EXISTS instructions_generated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS instructions_volume_structure JSONB,
ADD COLUMN IF NOT EXISTS instructions_checklist JSONB;

-- Create index for quick lookup of generated instructions
CREATE INDEX IF NOT EXISTS idx_dsip_opportunities_instructions_generated 
  ON dsip_opportunities(instructions_generated_at) 
  WHERE consolidated_instructions_url IS NOT NULL;

-- Create index for status + instruction availability
-- Using the actual column name from your table: status_topicstatus
CREATE INDEX IF NOT EXISTS idx_dsip_opportunities_active_with_instructions 
  ON dsip_opportunities(status_topicstatus, consolidated_instructions_url) 
  WHERE status_topicstatus IN ('Open', 'Prerelease', 'Active');

-- Add comments
COMMENT ON COLUMN dsip_opportunities.consolidated_instructions_url IS 'URL to pre-generated consolidated instruction PDF in Supabase Storage';
COMMENT ON COLUMN dsip_opportunities.instructions_plain_text IS 'Full plain text archive of all instruction documents for historical preservation';
COMMENT ON COLUMN dsip_opportunities.instructions_generated_at IS 'Timestamp when instruction document was generated';
COMMENT ON COLUMN dsip_opportunities.instructions_volume_structure IS 'JSON structure of volume requirements (Volume 1, 2, 3, etc.)';
COMMENT ON COLUMN dsip_opportunities.instructions_checklist IS 'JSON array of checklist items extracted from instructions';
