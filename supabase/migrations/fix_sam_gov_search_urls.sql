-- =====================================================
-- Fix SAM.gov URLs - Use Search URLs Instead
-- =====================================================
-- Problem: Direct links don't work because SAM.gov uses 
-- internal Notice IDs, not solicitation numbers
-- 
-- Solution: Create search URLs that find the opportunity
-- =====================================================

-- Step 1: Drop old function
DROP FUNCTION IF EXISTS generate_sam_gov_url(TEXT);

-- Step 2: Create new search URL function
CREATE OR REPLACE FUNCTION generate_sam_gov_search_url(solicitation_id TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Return NULL if no solicitation_id
  IF solicitation_id IS NULL OR solicitation_id = '' THEN
    RETURN NULL;
  END IF;
  
  -- SAM.gov search URL format
  -- Searches for the solicitation number in opportunities
  -- Format: https://sam.gov/search/?index=opp&q={solicitation_id}
  RETURN 'https://sam.gov/search/?index=opp&q=' || solicitation_id;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Step 3: Update ALL existing records with search URLs
UPDATE fpds_contracts
SET sam_gov_opportunity_url = generate_sam_gov_search_url(solicitation_id)
WHERE solicitation_id IS NOT NULL
  AND solicitation_id != '';

-- Step 4: Update comment
COMMENT ON COLUMN fpds_contracts.sam_gov_opportunity_url IS 
  'Search link to find the solicitation on SAM.gov. Not a direct link because SAM.gov uses internal Notice IDs. Users can click to search and find the opportunity.';

-- Step 5: Show updated stats
DO $$
DECLARE
  total_contracts INTEGER;
  with_search_url INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_contracts FROM fpds_contracts;
  SELECT COUNT(*) INTO with_search_url FROM fpds_contracts WHERE sam_gov_opportunity_url IS NOT NULL;
  
  RAISE NOTICE '=================================================';
  RAISE NOTICE 'SAM.gov Search URLs Updated';
  RAISE NOTICE '=================================================';
  RAISE NOTICE 'Total contracts: %', total_contracts;
  RAISE NOTICE 'With SAM.gov search URLs: % (% %%)', with_search_url, ROUND(100.0 * with_search_url / NULLIF(total_contracts, 0), 1);
  RAISE NOTICE '=================================================';
  RAISE NOTICE 'Test a link: SELECT sam_gov_opportunity_url FROM fpds_contracts WHERE sam_gov_opportunity_url IS NOT NULL LIMIT 1;';
  RAISE NOTICE '=================================================';
END $$;

