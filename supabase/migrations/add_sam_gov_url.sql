-- =====================================================
-- Add SAM.gov Opportunity URL to FPDS Contracts
-- =====================================================
-- Phase 1: Add column and helper function to link to SAM.gov
-- opportunities when solicitation_id exists
-- =====================================================

-- Step 1: Add column
ALTER TABLE fpds_contracts 
  ADD COLUMN IF NOT EXISTS sam_gov_opportunity_url TEXT;

-- Step 2: Add index for quick lookups
CREATE INDEX IF NOT EXISTS idx_fpds_sam_gov_url 
  ON fpds_contracts(sam_gov_opportunity_url) 
  WHERE sam_gov_opportunity_url IS NOT NULL;

-- Step 3: Create helper function to generate SAM.gov URLs
CREATE OR REPLACE FUNCTION generate_sam_gov_url(solicitation_id TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Return NULL if no solicitation_id
  IF solicitation_id IS NULL OR solicitation_id = '' THEN
    RETURN NULL;
  END IF;
  
  -- SAM.gov opportunity URL format
  -- Format: https://sam.gov/opp/{solicitation_id}/view
  RETURN 'https://sam.gov/opp/' || solicitation_id || '/view';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Step 4: Update existing records with SAM.gov URLs
UPDATE fpds_contracts
SET sam_gov_opportunity_url = generate_sam_gov_url(solicitation_id)
WHERE solicitation_id IS NOT NULL
  AND solicitation_id != ''
  AND sam_gov_opportunity_url IS NULL;

-- Step 5: Add comment for documentation
COMMENT ON COLUMN fpds_contracts.sam_gov_opportunity_url IS 
  'Link to original contract opportunity on SAM.gov (when solicitation_id exists). Not all contracts have a public solicitation.';

-- Step 6: Show stats
DO $$
DECLARE
  total_contracts INTEGER;
  with_solicitation INTEGER;
  with_sam_url INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_contracts FROM fpds_contracts;
  SELECT COUNT(*) INTO with_solicitation FROM fpds_contracts WHERE solicitation_id IS NOT NULL AND solicitation_id != '';
  SELECT COUNT(*) INTO with_sam_url FROM fpds_contracts WHERE sam_gov_opportunity_url IS NOT NULL;
  
  RAISE NOTICE '=================================================';
  RAISE NOTICE 'SAM.gov URL Migration Complete';
  RAISE NOTICE '=================================================';
  RAISE NOTICE 'Total contracts: %', total_contracts;
  RAISE NOTICE 'With solicitation_id: % (% %%)', with_solicitation, ROUND(100.0 * with_solicitation / NULLIF(total_contracts, 0), 1);
  RAISE NOTICE 'With SAM.gov URL: % (% %%)', with_sam_url, ROUND(100.0 * with_sam_url / NULLIF(total_contracts, 0), 1);
  RAISE NOTICE '=================================================';
END $$;

