-- =====================================================
-- ADD ALL MISSING FIELDS TO dod_contract_news
-- Phase 2: Complete Package with All Features
-- =====================================================

-- =====================================================
-- Step 1: Add Set-Aside Fields
-- =====================================================
ALTER TABLE dod_contract_news
  ADD COLUMN IF NOT EXISTS is_small_business_set_aside BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS set_aside_type TEXT;

COMMENT ON COLUMN dod_contract_news.is_small_business_set_aside IS 'True if contract used any small business set-aside';
COMMENT ON COLUMN dod_contract_news.set_aside_type IS 'Type of set-aside: Small Business, 8(a), HUBZone, SDVOSB, WOSB, EDWOSB, etc.';

-- =====================================================
-- Step 2: Add Teaming/Multiple Vendor Fields
-- =====================================================
ALTER TABLE dod_contract_news
  ADD COLUMN IF NOT EXISTS is_teaming BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS team_members TEXT[],
  ADD COLUMN IF NOT EXISTS prime_contractor TEXT,
  ADD COLUMN IF NOT EXISTS subcontractors TEXT[],
  ADD COLUMN IF NOT EXISTS team_work_share JSONB;

COMMENT ON COLUMN dod_contract_news.is_teaming IS 'True if multiple vendors are working together';
COMMENT ON COLUMN dod_contract_news.team_members IS 'Array of all team member company names';
COMMENT ON COLUMN dod_contract_news.prime_contractor IS 'Prime contractor name (if teaming)';
COMMENT ON COLUMN dod_contract_news.subcontractors IS 'Array of subcontractor company names';
COMMENT ON COLUMN dod_contract_news.team_work_share IS 'JSONB array of team members with work share percentages: [{company, role, percentage}]';

-- =====================================================
-- Step 3: Add NAICS and Solicitation Fields
-- =====================================================
ALTER TABLE dod_contract_news
  ADD COLUMN IF NOT EXISTS naics_code VARCHAR(6),
  ADD COLUMN IF NOT EXISTS solicitation_number TEXT;

COMMENT ON COLUMN dod_contract_news.naics_code IS '6-digit NAICS industry classification code';
COMMENT ON COLUMN dod_contract_news.solicitation_number IS 'Original RFP/solicitation number';

-- =====================================================
-- Step 4: Add Keyword/Tag Fields
-- =====================================================
ALTER TABLE dod_contract_news
  ADD COLUMN IF NOT EXISTS industry_tags TEXT[],
  ADD COLUMN IF NOT EXISTS technology_tags TEXT[],
  ADD COLUMN IF NOT EXISTS service_tags TEXT[];

COMMENT ON COLUMN dod_contract_news.industry_tags IS 'Industry classifications: aerospace, maritime, cybersecurity, etc.';
COMMENT ON COLUMN dod_contract_news.technology_tags IS 'Technology keywords: ai_ml, cloud, sensors, autonomous, etc.';
COMMENT ON COLUMN dod_contract_news.service_tags IS 'Service type tags: maintenance, research, logistics, engineering, etc.';

-- =====================================================
-- Step 5: Create Indexes for Performance
-- =====================================================

-- Set-aside indexes
CREATE INDEX IF NOT EXISTS idx_dod_set_aside ON dod_contract_news(is_small_business_set_aside) WHERE is_small_business_set_aside = true;
CREATE INDEX IF NOT EXISTS idx_dod_set_aside_type ON dod_contract_news(set_aside_type) WHERE set_aside_type IS NOT NULL;

-- Teaming indexes
CREATE INDEX IF NOT EXISTS idx_dod_teaming ON dod_contract_news(is_teaming) WHERE is_teaming = true;

-- NAICS index
CREATE INDEX IF NOT EXISTS idx_dod_naics ON dod_contract_news(naics_code) WHERE naics_code IS NOT NULL;

-- Tag indexes (GIN for array search)
CREATE INDEX IF NOT EXISTS idx_dod_industry_tags ON dod_contract_news USING GIN(industry_tags) WHERE industry_tags IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_dod_technology_tags ON dod_contract_news USING GIN(technology_tags) WHERE technology_tags IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_dod_service_tags ON dod_contract_news USING GIN(service_tags) WHERE service_tags IS NOT NULL;

-- =====================================================
-- Step 6: Create Analysis Views
-- =====================================================

-- Set-Aside Contracts View
CREATE OR REPLACE VIEW dod_set_aside_contracts AS
SELECT 
  contract_number,
  vendor_name,
  vendor_state,
  award_amount,
  set_aside_type,
  is_small_business,
  service_branch,
  published_date
FROM dod_contract_news
WHERE is_small_business_set_aside = TRUE
ORDER BY award_amount DESC NULLS LAST;

-- Teaming Contracts View
CREATE OR REPLACE VIEW dod_teaming_contracts AS
SELECT 
  contract_number,
  vendor_name as primary_vendor,
  prime_contractor,
  team_members,
  subcontractors,
  award_amount,
  service_branch,
  published_date
FROM dod_contract_news
WHERE is_teaming = TRUE
ORDER BY award_amount DESC NULLS LAST;

-- Contracts by Industry View
CREATE OR REPLACE VIEW dod_contracts_by_industry AS
SELECT 
  UNNEST(industry_tags) as industry,
  COUNT(*) as contract_count,
  SUM(award_amount) as total_value,
  AVG(award_amount) as avg_value
FROM dod_contract_news
WHERE industry_tags IS NOT NULL AND array_length(industry_tags, 1) > 0
GROUP BY industry
ORDER BY total_value DESC NULLS LAST;

-- Contracts by Technology View
CREATE OR REPLACE VIEW dod_contracts_by_technology AS
SELECT 
  UNNEST(technology_tags) as technology,
  COUNT(*) as contract_count,
  SUM(award_amount) as total_value,
  AVG(award_amount) as avg_value
FROM dod_contract_news
WHERE technology_tags IS NOT NULL AND array_length(technology_tags, 1) > 0
GROUP BY technology
ORDER BY total_value DESC NULLS LAST;

-- =====================================================
-- Step 7: Grant Permissions
-- =====================================================
GRANT SELECT ON dod_set_aside_contracts TO anon, authenticated;
GRANT SELECT ON dod_teaming_contracts TO anon, authenticated;
GRANT SELECT ON dod_contracts_by_industry TO anon, authenticated;
GRANT SELECT ON dod_contracts_by_technology TO anon, authenticated;

-- =====================================================
-- Step 8: Success Message
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE 'All missing fields added successfully!';
  RAISE NOTICE ' ';
  RAISE NOTICE 'NEW FIELDS ADDED:';
  RAISE NOTICE '   - Set-Aside tracking (is_small_business_set_aside, set_aside_type)';
  RAISE NOTICE '   - Teaming/Multiple Vendors (is_teaming, team_members, prime_contractor, subcontractors)';
  RAISE NOTICE '   - NAICS codes (naics_code)';
  RAISE NOTICE '   - Solicitation numbers (solicitation_number)';
  RAISE NOTICE '   - Keywords/Tags (industry_tags, technology_tags, service_tags)';
  RAISE NOTICE ' ';
  RAISE NOTICE 'NEW VIEWS CREATED:';
  RAISE NOTICE '   - dod_set_aside_contracts';
  RAISE NOTICE '   - dod_teaming_contracts';
  RAISE NOTICE '   - dod_contracts_by_industry';
  RAISE NOTICE '   - dod_contracts_by_technology';
  RAISE NOTICE ' ';
  RAISE NOTICE 'Ready for testing!';
END $$;

