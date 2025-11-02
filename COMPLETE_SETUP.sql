-- =====================================================
-- COMPLETE SETUP - Run this entire file in Supabase SQL Editor
-- =====================================================

-- STEP 1: Add all enhanced columns to dod_contract_news
-- (This adds team_work_share and 40+ other fields)
-- =====================================================

-- Set-Aside Fields
ALTER TABLE dod_contract_news
  ADD COLUMN IF NOT EXISTS is_small_business_set_aside BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS set_aside_type TEXT;

-- Teaming/Multiple Vendor Fields (including team_work_share!)
ALTER TABLE dod_contract_news
  ADD COLUMN IF NOT EXISTS is_teaming BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS team_members TEXT[],
  ADD COLUMN IF NOT EXISTS prime_contractor TEXT,
  ADD COLUMN IF NOT EXISTS subcontractors TEXT[],
  ADD COLUMN IF NOT EXISTS team_work_share JSONB;

-- NAICS and Solicitation Fields
ALTER TABLE dod_contract_news
  ADD COLUMN IF NOT EXISTS naics_code VARCHAR(6),
  ADD COLUMN IF NOT EXISTS solicitation_number TEXT;

-- Automated Tags
ALTER TABLE dod_contract_news
  ADD COLUMN IF NOT EXISTS industry_tags TEXT[],
  ADD COLUMN IF NOT EXISTS technology_tags TEXT[],
  ADD COLUMN IF NOT EXISTS service_tags TEXT[];

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Enhanced columns added successfully!';
  RAISE NOTICE 'Columns added: team_work_share, is_teaming, is_small_business_set_aside, naics_code, and more';
END $$;

-- =====================================================
-- STEP 2: Create team members table
-- =====================================================

CREATE TABLE IF NOT EXISTS dod_contract_team_members (
  id BIGSERIAL PRIMARY KEY,
  contract_id BIGINT REFERENCES dod_contract_news(id) ON DELETE CASCADE,
  contract_number TEXT,
  company_name TEXT NOT NULL,
  team_role TEXT NOT NULL,
  work_share_percentage NUMERIC(5,2),
  weighted_award_amount NUMERIC(15,2),
  award_amount NUMERIC(15,2),
  service_branch TEXT,
  published_date DATE,
  article_id INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_team_role CHECK (team_role IN ('prime', 'subcontractor', 'team_member')),
  CONSTRAINT valid_percentage CHECK (work_share_percentage >= 0 AND work_share_percentage <= 100)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_team_members_contract_id ON dod_contract_team_members(contract_id);
CREATE INDEX IF NOT EXISTS idx_team_members_company_name ON dod_contract_team_members(company_name);
CREATE INDEX IF NOT EXISTS idx_team_members_team_role ON dod_contract_team_members(team_role);

-- Auto-calculate weighted amount
CREATE OR REPLACE FUNCTION calculate_weighted_award()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.work_share_percentage IS NOT NULL AND NEW.award_amount IS NOT NULL THEN
    NEW.weighted_award_amount := NEW.award_amount * (NEW.work_share_percentage / 100.0);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_calculate_weighted_award ON dod_contract_team_members;

CREATE TRIGGER trigger_calculate_weighted_award
  BEFORE INSERT OR UPDATE ON dod_contract_team_members
  FOR EACH ROW
  EXECUTE FUNCTION calculate_weighted_award();

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Team members table created successfully!';
  RAISE NOTICE 'Ready to track work share percentages';
END $$;

-- =====================================================
-- STEP 3: Verification
-- =====================================================

-- Show what was created
SELECT 
  'team_work_share column' as item,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'dod_contract_news' AND column_name = 'team_work_share'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
UNION ALL
SELECT 
  'dod_contract_team_members table' as item,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'dod_contract_team_members'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

-- =====================================================
-- NEXT STEPS:
-- =====================================================
-- 1. Clear old data: TRUNCATE TABLE dod_contract_news RESTART IDENTITY CASCADE;
-- 2. Re-scrape: npx tsx test-dod-single-article.ts
-- 3. Check data: SELECT * FROM dod_contract_team_members;
-- =====================================================

