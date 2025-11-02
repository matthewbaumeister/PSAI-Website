-- ============================================
-- ENHANCE: DoD Contract News Schema
-- ============================================
-- Adds comprehensive tracking for:
-- - Cross-referencing (FPDS, SBIR, SAM.gov)
-- - Teaming arrangements & subcontractors
-- - Full categorization & classification
-- - Enhanced matching capabilities
-- ============================================

-- ============================================
-- 1. Add Cross-Reference & Matching Fields
-- ============================================

ALTER TABLE dod_contract_news ADD COLUMN IF NOT EXISTS vendor_duns TEXT;
ALTER TABLE dod_contract_news ADD COLUMN IF NOT EXISTS vendor_uei TEXT;
ALTER TABLE dod_contract_news ADD COLUMN IF NOT EXISTS vendor_cage_code TEXT;
ALTER TABLE dod_contract_news ADD COLUMN IF NOT EXISTS vendor_name_normalized TEXT;

-- Add indexes for cross-referencing
CREATE INDEX IF NOT EXISTS idx_dod_news_vendor_duns ON dod_contract_news(vendor_duns) WHERE vendor_duns IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_dod_news_vendor_uei ON dod_contract_news(vendor_uei) WHERE vendor_uei IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_dod_news_vendor_cage ON dod_contract_news(vendor_cage_code) WHERE vendor_cage_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_dod_news_vendor_normalized ON dod_contract_news(vendor_name_normalized);

-- ============================================
-- 2. Add Enhanced Categorization
-- ============================================

ALTER TABLE dod_contract_news ADD COLUMN IF NOT EXISTS naics_code TEXT;
ALTER TABLE dod_contract_news ADD COLUMN IF NOT EXISTS naics_description TEXT;
ALTER TABLE dod_contract_news ADD COLUMN IF NOT EXISTS psc_code TEXT;
ALTER TABLE dod_contract_news ADD COLUMN IF NOT EXISTS psc_description TEXT;
ALTER TABLE dod_contract_news ADD COLUMN IF NOT EXISTS contract_category TEXT; -- Research, Production, Services, etc.
ALTER TABLE dod_contract_news ADD COLUMN IF NOT EXISTS award_type TEXT; -- New Award, Modification, Task Order, etc.
ALTER TABLE dod_contract_news ADD COLUMN IF NOT EXISTS competition_type TEXT; -- Competitive, Sole Source, etc.

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_dod_news_naics ON dod_contract_news(naics_code) WHERE naics_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_dod_news_psc ON dod_contract_news(psc_code) WHERE psc_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_dod_news_category ON dod_contract_news(contract_category) WHERE contract_category IS NOT NULL;

-- ============================================
-- 3. Add SBIR/STTR Linkage
-- ============================================

ALTER TABLE dod_contract_news ADD COLUMN IF NOT EXISTS is_sbir_sttr BOOLEAN DEFAULT FALSE;
ALTER TABLE dod_contract_news ADD COLUMN IF NOT EXISTS sbir_phase TEXT; -- Phase I, Phase II, Phase III
ALTER TABLE dod_contract_news ADD COLUMN IF NOT EXISTS sbir_topic_number TEXT;
ALTER TABLE dod_contract_news ADD COLUMN IF NOT EXISTS sbir_linked_awards TEXT[]; -- Array of SBIR award IDs

CREATE INDEX IF NOT EXISTS idx_dod_news_sbir ON dod_contract_news(is_sbir_sttr) WHERE is_sbir_sttr = TRUE;

-- ============================================
-- 4. Add Full Text Storage & Search
-- ============================================

ALTER TABLE dod_contract_news ADD COLUMN IF NOT EXISTS full_article_text TEXT;
ALTER TABLE dod_contract_news ADD COLUMN IF NOT EXISTS keywords TEXT[];
ALTER TABLE dod_contract_news ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Full text search index
CREATE INDEX IF NOT EXISTS idx_dod_news_search_vector ON dod_contract_news USING gin(search_vector);
CREATE INDEX IF NOT EXISTS idx_dod_news_keywords ON dod_contract_news USING gin(keywords);

-- Auto-update search vector trigger
CREATE OR REPLACE FUNCTION dod_news_update_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.vendor_name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.contract_description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.work_description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.program_name, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(NEW.contract_number, '')), 'D');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS dod_news_search_vector_update ON dod_contract_news;
CREATE TRIGGER dod_news_search_vector_update
  BEFORE INSERT OR UPDATE ON dod_contract_news
  FOR EACH ROW
  EXECUTE FUNCTION dod_news_update_search_vector();

-- ============================================
-- 5. Add Enhanced Business Classification
-- ============================================

ALTER TABLE dod_contract_news ADD COLUMN IF NOT EXISTS is_8a BOOLEAN DEFAULT FALSE;
ALTER TABLE dod_contract_news ADD COLUMN IF NOT EXISTS is_sdvosb BOOLEAN DEFAULT FALSE;
ALTER TABLE dod_contract_news ADD COLUMN IF NOT EXISTS is_wosb BOOLEAN DEFAULT FALSE;
ALTER TABLE dod_contract_news ADD COLUMN IF NOT EXISTS is_edwosb BOOLEAN DEFAULT FALSE;
ALTER TABLE dod_contract_news ADD COLUMN IF NOT EXISTS is_vosb BOOLEAN DEFAULT FALSE;
ALTER TABLE dod_contract_news ADD COLUMN IF NOT EXISTS is_economically_disadvantaged BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_dod_news_8a ON dod_contract_news(is_8a) WHERE is_8a = TRUE;
CREATE INDEX IF NOT EXISTS idx_dod_news_sdvosb ON dod_contract_news(is_sdvosb) WHERE is_sdvosb = TRUE;

-- ============================================
-- 6. CREATE: Teaming & Subcontractor Table
-- ============================================

CREATE TABLE IF NOT EXISTS dod_contract_teams (
  id BIGSERIAL PRIMARY KEY,
  
  -- Link to main contract
  dod_contract_news_id BIGINT REFERENCES dod_contract_news(id) ON DELETE CASCADE,
  contract_number TEXT,
  
  -- Prime contractor
  prime_contractor_name TEXT NOT NULL,
  prime_contractor_duns TEXT,
  prime_contractor_uei TEXT,
  prime_contractor_location TEXT,
  
  -- Team member (sub/partner)
  team_member_name TEXT NOT NULL,
  team_member_role TEXT, -- 'subcontractor', 'partner', 'teaming_partner', 'joint_venture'
  team_member_duns TEXT,
  team_member_uei TEXT,
  team_member_location TEXT,
  team_member_city TEXT,
  team_member_state VARCHAR(2),
  
  -- Work description
  work_scope TEXT,
  estimated_value NUMERIC(15, 2),
  percentage_of_work NUMERIC(5, 2), -- 0.00-100.00%
  
  -- Classification
  is_small_business BOOLEAN DEFAULT FALSE,
  is_veteran_owned BOOLEAN DEFAULT FALSE,
  is_woman_owned BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  source_text TEXT, -- Original paragraph mentioning the team
  extracted_at TIMESTAMPTZ DEFAULT NOW(),
  confidence NUMERIC(3, 2), -- 0.00-1.00
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for teaming table
CREATE INDEX IF NOT EXISTS idx_dod_teams_contract_id ON dod_contract_teams(dod_contract_news_id);
CREATE INDEX IF NOT EXISTS idx_dod_teams_prime_name ON dod_contract_teams(prime_contractor_name);
CREATE INDEX IF NOT EXISTS idx_dod_teams_member_name ON dod_contract_teams(team_member_name);
CREATE INDEX IF NOT EXISTS idx_dod_teams_prime_duns ON dod_contract_teams(prime_contractor_duns) WHERE prime_contractor_duns IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_dod_teams_member_duns ON dod_contract_teams(team_member_duns) WHERE team_member_duns IS NOT NULL;

-- ============================================
-- 7. CREATE: Contract Modifications Table
-- ============================================

CREATE TABLE IF NOT EXISTS dod_contract_modifications (
  id BIGSERIAL PRIMARY KEY,
  
  -- Link to base contract
  base_dod_contract_id BIGINT REFERENCES dod_contract_news(id) ON DELETE SET NULL,
  base_contract_number TEXT NOT NULL,
  
  -- Modification details
  modification_number TEXT NOT NULL,
  modification_type TEXT, -- 'change_order', 'exercise_option', 'scope_change', etc.
  modification_date DATE,
  
  -- Financial changes
  previous_value NUMERIC(15, 2),
  modification_value NUMERIC(15, 2),
  new_total_value NUMERIC(15, 2),
  
  -- Scope changes
  modification_description TEXT,
  scope_added TEXT,
  scope_removed TEXT,
  
  -- Time changes
  previous_completion_date DATE,
  new_completion_date DATE,
  
  -- Source
  article_id INTEGER,
  article_url TEXT,
  published_date DATE,
  raw_paragraph TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(base_contract_number, modification_number)
);

CREATE INDEX IF NOT EXISTS idx_dod_mods_base_contract ON dod_contract_modifications(base_contract_number);
CREATE INDEX IF NOT EXISTS idx_dod_mods_date ON dod_contract_modifications(modification_date DESC);

-- ============================================
-- 8. CREATE: Cross-Reference Matching Table
-- ============================================

CREATE TABLE IF NOT EXISTS dod_contract_cross_references (
  id BIGSERIAL PRIMARY KEY,
  
  -- DoD news contract
  dod_contract_news_id BIGINT REFERENCES dod_contract_news(id) ON DELETE CASCADE,
  
  -- FPDS link
  fpds_contract_id TEXT,
  fpds_transaction_number TEXT,
  fpds_match_confidence NUMERIC(3, 2), -- 0.00-1.00
  fpds_match_method TEXT, -- 'contract_number', 'vendor_duns', 'amount_date', etc.
  fpds_matched_at TIMESTAMPTZ,
  
  -- SBIR link
  sbir_award_id TEXT,
  sbir_topic_number TEXT,
  sbir_match_confidence NUMERIC(3, 2),
  sbir_match_method TEXT,
  sbir_matched_at TIMESTAMPTZ,
  
  -- SAM.gov entity link
  sam_entity_id TEXT,
  sam_uei TEXT,
  sam_cage_code TEXT,
  sam_matched_at TIMESTAMPTZ,
  
  -- Manual verification
  manually_verified BOOLEAN DEFAULT FALSE,
  verified_by TEXT,
  verified_at TIMESTAMPTZ,
  verification_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(dod_contract_news_id)
);

CREATE INDEX IF NOT EXISTS idx_dod_xref_fpds ON dod_contract_cross_references(fpds_transaction_number) WHERE fpds_transaction_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_dod_xref_sbir ON dod_contract_cross_references(sbir_award_id) WHERE sbir_award_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_dod_xref_sam ON dod_contract_cross_references(sam_uei) WHERE sam_uei IS NOT NULL;

-- ============================================
-- 9. CREATE: Enhanced Views
-- ============================================

-- View: All contracts with cross-references
CREATE OR REPLACE VIEW dod_contracts_complete AS
SELECT 
  dcn.*,
  dxr.fpds_transaction_number,
  dxr.fpds_match_confidence,
  dxr.sbir_award_id,
  dxr.sbir_match_confidence,
  dxr.manually_verified as cross_ref_verified
FROM dod_contract_news dcn
LEFT JOIN dod_contract_cross_references dxr ON dcn.id = dxr.dod_contract_news_id;

-- View: Contracts with teams
CREATE OR REPLACE VIEW dod_contracts_with_teams AS
SELECT 
  dcn.*,
  COUNT(dct.id) as team_member_count,
  ARRAY_AGG(dct.team_member_name) FILTER (WHERE dct.team_member_name IS NOT NULL) as team_members
FROM dod_contract_news dcn
LEFT JOIN dod_contract_teams dct ON dcn.id = dct.dod_contract_news_id
GROUP BY dcn.id;

-- View: Small business contracts
CREATE OR REPLACE VIEW dod_small_business_contracts AS
SELECT *
FROM dod_contract_news
WHERE is_small_business = TRUE
   OR is_8a = TRUE
   OR is_sdvosb = TRUE
   OR is_wosb = TRUE
   OR is_hubzone = TRUE
ORDER BY published_date DESC;

-- View: Recent high-value contracts
CREATE OR REPLACE VIEW dod_high_value_contracts AS
SELECT *
FROM dod_contract_news
WHERE award_amount >= 10000000 -- $10M+
ORDER BY published_date DESC, award_amount DESC;

-- View: Contracts needing FPDS matching
CREATE OR REPLACE VIEW dod_contracts_needing_fpds_match AS
SELECT dcn.*
FROM dod_contract_news dcn
LEFT JOIN dod_contract_cross_references dxr ON dcn.id = dxr.dod_contract_news_id
WHERE dxr.fpds_transaction_number IS NULL
  AND dcn.contract_number IS NOT NULL
  AND dcn.published_date >= CURRENT_DATE - INTERVAL '90 days'
ORDER BY dcn.published_date DESC;

-- ============================================
-- 10. Helper Functions
-- ============================================

-- Function: Normalize vendor name for matching
CREATE OR REPLACE FUNCTION normalize_vendor_name(vendor_name TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN lower(
    regexp_replace(
      regexp_replace(
        vendor_name,
        '\b(inc|llc|corp|corporation|company|co|limited|ltd)\b\.?',
        '',
        'gi'
      ),
      '[^a-z0-9]',
      '',
      'g'
    )
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function: Extract contract number patterns
CREATE OR REPLACE FUNCTION extract_contract_number(text_input TEXT)
RETURNS TEXT AS $$
DECLARE
  contract_num TEXT;
BEGIN
  -- Common DoD contract number patterns
  contract_num := (regexp_matches(text_input, '\b([A-Z0-9]{4,}-[A-Z0-9-]+)\b'))[1];
  
  IF contract_num IS NULL THEN
    contract_num := (regexp_matches(text_input, '\bcontract\s+(?:number\s+)?([A-Z0-9-]+)\b', 'i'))[1];
  END IF;
  
  RETURN contract_num;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function: Match DoD contract to FPDS by contract number
CREATE OR REPLACE FUNCTION match_dod_to_fpds(dod_contract_id BIGINT)
RETURNS TABLE(
  fpds_id BIGINT,
  fpds_transaction_number TEXT,
  match_confidence NUMERIC,
  match_reason TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    fc.id,
    fc.transaction_number,
    CASE 
      WHEN dcn.contract_number = fc.transaction_number THEN 1.00
      WHEN fc.transaction_number LIKE '%' || dcn.contract_number || '%' THEN 0.90
      ELSE 0.70
    END::NUMERIC as confidence,
    CASE 
      WHEN dcn.contract_number = fc.transaction_number THEN 'exact_match'
      WHEN fc.transaction_number LIKE '%' || dcn.contract_number || '%' THEN 'partial_match'
      ELSE 'vendor_amount_date_match'
    END as reason
  FROM dod_contract_news dcn
  JOIN fpds_contracts fc ON (
    dcn.contract_number = fc.transaction_number
    OR (
      normalize_vendor_name(dcn.vendor_name) = normalize_vendor_name(fc.vendor_name)
      AND ABS(dcn.award_amount - fc.base_and_exercised_options_value) < 1000
      AND ABS(dcn.published_date - fc.date_signed) <= 7
    )
  )
  WHERE dcn.id = dod_contract_id
  ORDER BY confidence DESC
  LIMIT 5;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 11. Auto-populate normalized vendor names
-- ============================================

CREATE OR REPLACE FUNCTION dod_news_normalize_vendor_name()
RETURNS TRIGGER AS $$
BEGIN
  NEW.vendor_name_normalized := normalize_vendor_name(NEW.vendor_name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS dod_news_vendor_normalize ON dod_contract_news;
CREATE TRIGGER dod_news_vendor_normalize
  BEFORE INSERT OR UPDATE OF vendor_name ON dod_contract_news
  FOR EACH ROW
  EXECUTE FUNCTION dod_news_normalize_vendor_name();

-- ============================================
-- Success Message
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ DoD Contract News schema enhanced!';
  RAISE NOTICE '   ';
  RAISE NOTICE '📊 NEW FEATURES:';
  RAISE NOTICE '   - Cross-referencing (DUNS, UEI, CAGE codes)';
  RAISE NOTICE '   - NAICS & PSC classification';
  RAISE NOTICE '   - SBIR/STTR linkage';
  RAISE NOTICE '   - Full-text search with tsvector';
  RAISE NOTICE '   - Enhanced business classifications';
  RAISE NOTICE '   ';
  RAISE NOTICE '📋 NEW TABLES:';
  RAISE NOTICE '   - dod_contract_teams (teaming & subs)';
  RAISE NOTICE '   - dod_contract_modifications';
  RAISE NOTICE '   - dod_contract_cross_references';
  RAISE NOTICE '   ';
  RAISE NOTICE '🔍 NEW VIEWS:';
  RAISE NOTICE '   - dod_contracts_complete';
  RAISE NOTICE '   - dod_contracts_with_teams';
  RAISE NOTICE '   - dod_small_business_contracts';
  RAISE NOTICE '   - dod_high_value_contracts';
  RAISE NOTICE '   - dod_contracts_needing_fpds_match';
  RAISE NOTICE '   ';
  RAISE NOTICE '⚙️  NEW FUNCTIONS:';
  RAISE NOTICE '   - normalize_vendor_name()';
  RAISE NOTICE '   - extract_contract_number()';
  RAISE NOTICE '   - match_dod_to_fpds()';
  RAISE NOTICE '   ';
  RAISE NOTICE '🚀 Ready for comprehensive contract tracking!';
END $$;

