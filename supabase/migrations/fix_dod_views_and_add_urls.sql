-- =====================================================
-- Fix DoD Views & Add URL Tracking
-- =====================================================
-- 1. Drop all views
-- 2. Expand state columns across all tables
-- 3. Add URL/source tracking fields
-- 4. Recreate views with correct column names
-- =====================================================

-- =====================================================
-- Step 1: Drop all dependent views
-- =====================================================
DROP VIEW IF EXISTS dod_contracts_complete CASCADE;
DROP VIEW IF EXISTS dod_contracts_with_teams CASCADE;
DROP VIEW IF EXISTS dod_small_business_contracts CASCADE;
DROP VIEW IF EXISTS dod_high_value_contracts CASCADE;
DROP VIEW IF EXISTS dod_contracts_needing_fpds_match CASCADE;
DROP VIEW IF EXISTS dod_contracts_high_quality CASCADE;
DROP VIEW IF EXISTS dod_contracts_needing_review CASCADE;
DROP VIEW IF EXISTS dod_outliers_by_type CASCADE;
DROP VIEW IF EXISTS dod_quality_distribution CASCADE;

-- =====================================================
-- Step 2: Expand state columns to support full names
-- =====================================================

-- Main contracts table
ALTER TABLE dod_contract_news 
  ALTER COLUMN vendor_state TYPE VARCHAR(50);

ALTER TABLE dod_contract_news 
  ALTER COLUMN vendor_city TYPE VARCHAR(100);

-- Teams table
ALTER TABLE dod_contract_teams 
  ALTER COLUMN team_member_state TYPE VARCHAR(50);

-- =====================================================
-- Step 3: Add URL/Source tracking fields
-- =====================================================

-- Add government source URL field
ALTER TABLE dod_contract_news
  ADD COLUMN IF NOT EXISTS source_url TEXT,
  ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'dod_news',
  ADD COLUMN IF NOT EXISTS source_api_endpoint TEXT,
  ADD COLUMN IF NOT EXISTS scraped_from_url TEXT;

-- Update existing records with their article_url as source
UPDATE dod_contract_news
SET source_url = article_url,
    scraped_from_url = article_url
WHERE source_url IS NULL;

-- Add to FPDS table too (for future use)
ALTER TABLE fpds_contracts
  ADD COLUMN IF NOT EXISTS source_api_url TEXT,
  ADD COLUMN IF NOT EXISTS source_web_url TEXT,
  ADD COLUMN IF NOT EXISTS usaspending_contract_url TEXT;

-- Create index for source URLs
CREATE INDEX IF NOT EXISTS idx_dod_source_url ON dod_contract_news(source_url);
CREATE INDEX IF NOT EXISTS idx_fpds_source_url ON fpds_contracts(source_api_url);

-- =====================================================
-- Step 4: Recreate all views with CORRECT column names
-- =====================================================

-- Complete contract view with all relationships
CREATE OR REPLACE VIEW dod_contracts_complete AS
SELECT 
  c.*,
  COALESCE(
    (SELECT jsonb_agg(
      jsonb_build_object(
        'prime_contractor', t.prime_contractor_name,
        'team_member', t.team_member_name,
        'role', t.team_member_role,
        'work_scope', t.work_scope,
        'is_small_business', t.is_small_business
      )
    )
    FROM dod_contract_teams t
    WHERE t.dod_contract_news_id = c.id
    ), '[]'::jsonb
  ) as team_members,
  COALESCE(
    (SELECT jsonb_agg(
      jsonb_build_object(
        'modification_number', m.modification_number,
        'modification_date', m.modification_date,
        'value_change', m.value_change,
        'new_total_value', m.new_total_value
      )
    )
    FROM dod_contract_modifications m
    WHERE m.dod_contract_news_id = c.id
    ), '[]'::jsonb
  ) as modifications
FROM dod_contract_news c;

-- Contracts with team information
CREATE OR REPLACE VIEW dod_contracts_with_teams AS
SELECT 
  c.contract_number,
  c.vendor_name,
  c.award_amount,
  c.service_branch,
  c.published_date,
  c.source_url,
  t.prime_contractor_name,
  t.team_member_name,
  t.team_member_role,
  t.work_scope,
  t.is_small_business as team_member_is_sb
FROM dod_contract_news c
JOIN dod_contract_teams t ON c.id = t.dod_contract_news_id
ORDER BY c.award_amount DESC NULLS LAST;

-- Small business contracts
CREATE OR REPLACE VIEW dod_small_business_contracts AS
SELECT 
  contract_number,
  vendor_name,
  vendor_city,
  vendor_state,
  award_amount,
  award_amount_text,
  service_branch,
  small_business_type,
  is_8a,
  is_sdvosb,
  is_hubzone,
  is_woman_owned,
  is_veteran_owned,
  published_date,
  source_url,
  article_url
FROM dod_contract_news
WHERE is_small_business = TRUE
ORDER BY award_amount DESC NULLS LAST;

-- High value contracts
CREATE OR REPLACE VIEW dod_high_value_contracts AS
SELECT 
  contract_number,
  vendor_name,
  vendor_city,
  vendor_state,
  award_amount,
  award_amount_text,
  service_branch,
  contract_category,
  published_date,
  article_url,
  source_url
FROM dod_contract_news
WHERE award_amount >= 100000000
ORDER BY award_amount DESC;

-- Contracts needing FPDS match
CREATE OR REPLACE VIEW dod_contracts_needing_fpds_match AS
SELECT 
  c.contract_number,
  c.vendor_name,
  c.award_amount,
  c.service_branch,
  c.published_date,
  c.source_url,
  COUNT(x.id) as existing_matches
FROM dod_contract_news c
LEFT JOIN dod_contract_cross_references x 
  ON c.id = x.dod_contract_id 
  AND x.reference_type = 'fpds'
WHERE c.contract_number IS NOT NULL
  AND LENGTH(c.contract_number) >= 10
GROUP BY c.id, c.contract_number, c.vendor_name, c.award_amount, c.service_branch, c.published_date, c.source_url
HAVING COUNT(x.id) = 0
ORDER BY c.award_amount DESC NULLS LAST;

-- High-quality contracts ready for analysis
CREATE OR REPLACE VIEW dod_contracts_high_quality AS
SELECT *
FROM dod_contract_news
WHERE data_quality_score >= 80
  AND NOT needs_review
ORDER BY award_amount DESC NULLS LAST;

-- Contracts needing review
CREATE OR REPLACE VIEW dod_contracts_needing_review AS
SELECT 
  contract_number,
  vendor_name,
  vendor_city,
  vendor_state,
  award_amount_text,
  service_branch,
  data_quality_score,
  review_reasons,
  outlier_type,
  is_outlier,
  article_url,
  source_url,
  published_date
FROM dod_contract_news
WHERE needs_review = TRUE
  AND reviewed_at IS NULL
ORDER BY 
  CASE WHEN is_outlier THEN 1 ELSE 2 END,
  award_amount DESC NULLS LAST;

-- Outliers by type
CREATE OR REPLACE VIEW dod_outliers_by_type AS
SELECT 
  outlier_type,
  COUNT(*) as count,
  AVG(award_amount) as avg_amount,
  MIN(award_amount) as min_amount,
  MAX(award_amount) as max_amount,
  AVG(data_quality_score) as avg_quality_score
FROM dod_contract_news
WHERE is_outlier = TRUE
GROUP BY outlier_type
ORDER BY count DESC;

-- Quality distribution
CREATE OR REPLACE VIEW dod_quality_distribution AS
SELECT 
  CASE 
    WHEN data_quality_score >= 90 THEN '90-100 (Excellent)'
    WHEN data_quality_score >= 80 THEN '80-89 (Good)'
    WHEN data_quality_score >= 70 THEN '70-79 (Fair)'
    WHEN data_quality_score >= 60 THEN '60-69 (Low)'
    ELSE '0-59 (Poor)'
  END as quality_tier,
  COUNT(*) as contract_count,
  AVG(award_amount) as avg_award_amount,
  COUNT(*) FILTER (WHERE needs_review) as needs_review_count
FROM dod_contract_news
GROUP BY quality_tier
ORDER BY quality_tier;

-- =====================================================
-- Step 5: Add helper function to generate USASpending URLs
-- =====================================================

-- Generate USASpending.gov URL for a contract
CREATE OR REPLACE FUNCTION generate_usaspending_url(
  p_contract_number TEXT
) RETURNS TEXT AS $$
BEGIN
  IF p_contract_number IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- USASpending.gov contract search URL format
  RETURN 'https://www.usaspending.gov/search/?hash=' || 
         encode(digest(p_contract_number, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Generate defense.gov article URL (if we have article_id)
CREATE OR REPLACE FUNCTION generate_dod_article_url(
  p_article_id INTEGER
) RETURNS TEXT AS $$
BEGIN
  IF p_article_id IS NULL OR p_article_id = 0 THEN
    RETURN NULL;
  END IF;
  
  RETURN 'https://www.defense.gov/News/Contracts/Contract/Article/' || p_article_id::TEXT || '/';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- Step 6: Update existing FPDS records with source URLs
-- =====================================================

-- Populate USASpending URLs for FPDS contracts
UPDATE fpds_contracts
SET usaspending_contract_url = 
  'https://www.usaspending.gov/award/' || piid
WHERE usaspending_contract_url IS NULL
  AND piid IS NOT NULL;

-- =====================================================
-- Step 7: Grant permissions
-- =====================================================
GRANT SELECT ON dod_contracts_complete TO authenticated;
GRANT SELECT ON dod_contracts_with_teams TO authenticated;
GRANT SELECT ON dod_small_business_contracts TO anon, authenticated;
GRANT SELECT ON dod_high_value_contracts TO anon, authenticated;
GRANT SELECT ON dod_contracts_needing_fpds_match TO authenticated;
GRANT SELECT ON dod_contracts_high_quality TO anon, authenticated;
GRANT SELECT ON dod_contracts_needing_review TO authenticated;
GRANT SELECT ON dod_outliers_by_type TO authenticated;
GRANT SELECT ON dod_quality_distribution TO anon, authenticated;

-- =====================================================
-- Comments
-- =====================================================
COMMENT ON COLUMN dod_contract_news.source_url IS 'Original government source URL (defense.gov article)';
COMMENT ON COLUMN dod_contract_news.source_type IS 'Source type: dod_news, fpds, sam_gov, etc.';
COMMENT ON COLUMN dod_contract_news.source_api_endpoint IS 'API endpoint used to fetch this data (if applicable)';
COMMENT ON COLUMN dod_contract_news.scraped_from_url IS 'Actual URL scraped (may differ from source_url)';

COMMENT ON COLUMN fpds_contracts.source_api_url IS 'USASpending.gov API endpoint used to fetch this contract';
COMMENT ON COLUMN fpds_contracts.source_web_url IS 'Direct link to contract on USASpending.gov website';
COMMENT ON COLUMN fpds_contracts.usaspending_contract_url IS 'Permanent URL to this contract on USASpending.gov';

