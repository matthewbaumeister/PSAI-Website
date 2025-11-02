-- =====================================================
-- CREATE TEAM MEMBERS TABLE
-- Best practice: Separate table for normalized design
-- =====================================================

-- =====================================================
-- Step 1: Create Team Members Table
-- =====================================================
CREATE TABLE IF NOT EXISTS dod_contract_team_members (
  id BIGSERIAL PRIMARY KEY,
  
  -- Link to parent contract
  contract_id BIGINT REFERENCES dod_contract_news(id) ON DELETE CASCADE,
  contract_number TEXT,
  
  -- Team member info
  company_name TEXT NOT NULL,
  team_role TEXT NOT NULL, -- 'prime', 'subcontractor', 'team_member'
  work_share_percentage NUMERIC(5,2), -- e.g., 35.50 for 35.5%
  
  -- Calculated weighted value
  weighted_award_amount NUMERIC(15,2), -- award_amount × (percentage/100)
  
  -- Contract reference data (denormalized for performance)
  award_amount NUMERIC(15,2),
  service_branch TEXT,
  published_date DATE,
  article_id INTEGER,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_team_role CHECK (team_role IN ('prime', 'subcontractor', 'team_member')),
  CONSTRAINT valid_percentage CHECK (work_share_percentage >= 0 AND work_share_percentage <= 100)
);

-- =====================================================
-- Step 2: Create Indexes for Performance
-- =====================================================

-- Primary lookup indexes
CREATE INDEX IF NOT EXISTS idx_team_members_contract_id ON dod_contract_team_members(contract_id);
CREATE INDEX IF NOT EXISTS idx_team_members_company_name ON dod_contract_team_members(company_name);
CREATE INDEX IF NOT EXISTS idx_team_members_contract_number ON dod_contract_team_members(contract_number);

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_team_members_team_role ON dod_contract_team_members(team_role);
CREATE INDEX IF NOT EXISTS idx_team_members_service_branch ON dod_contract_team_members(service_branch);
CREATE INDEX IF NOT EXISTS idx_team_members_published_date ON dod_contract_team_members(published_date DESC);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_team_members_company_role ON dod_contract_team_members(company_name, team_role);
CREATE INDEX IF NOT EXISTS idx_team_members_role_amount ON dod_contract_team_members(team_role, weighted_award_amount DESC);

-- =====================================================
-- Step 3: Add Comments
-- =====================================================
COMMENT ON TABLE dod_contract_team_members IS 'Team members for contracts with teaming arrangements. One row per team member per contract.';
COMMENT ON COLUMN dod_contract_team_members.team_role IS 'Role: prime (prime contractor), subcontractor, or team_member';
COMMENT ON COLUMN dod_contract_team_members.work_share_percentage IS 'Percentage of work allocated to this team member (0-100)';
COMMENT ON COLUMN dod_contract_team_members.weighted_award_amount IS 'Calculated: award_amount × (work_share_percentage/100)';

-- =====================================================
-- Step 4: Create Useful Views
-- =====================================================

-- Drop existing views if they exist (to avoid column name conflicts)
DROP VIEW IF EXISTS company_prime_contracts CASCADE;
DROP VIEW IF EXISTS company_subcontractor_performance CASCADE;
DROP VIEW IF EXISTS company_overall_performance CASCADE;
DROP VIEW IF EXISTS teaming_relationships CASCADE;
DROP VIEW IF EXISTS dod_contracts_with_teams CASCADE;

-- View 1: Company Performance as Prime
CREATE VIEW company_prime_contracts AS
SELECT 
  company_name,
  COUNT(*) as prime_contract_count,
  SUM(award_amount) as total_prime_value,
  SUM(weighted_award_amount) as total_weighted_value,
  AVG(work_share_percentage) as avg_work_share,
  service_branch,
  COUNT(*) FILTER (WHERE published_date >= CURRENT_DATE - INTERVAL '90 days') as recent_wins_90d
FROM dod_contract_team_members
WHERE team_role = 'prime'
GROUP BY company_name, service_branch
ORDER BY total_weighted_value DESC NULLS LAST;

-- View 2: Company Performance as Subcontractor
CREATE VIEW company_subcontractor_performance AS
SELECT 
  company_name,
  COUNT(*) as sub_contract_count,
  SUM(award_amount) as total_contract_value,
  SUM(weighted_award_amount) as total_sub_value,
  AVG(work_share_percentage) as avg_sub_percentage,
  service_branch
FROM dod_contract_team_members
WHERE team_role = 'subcontractor'
GROUP BY company_name, service_branch
ORDER BY total_sub_value DESC NULLS LAST;

-- View 3: Company Overall Performance (Prime + Sub)
CREATE VIEW company_overall_performance AS
SELECT 
  company_name,
  COUNT(*) as total_participations,
  COUNT(*) FILTER (WHERE team_role = 'prime') as prime_count,
  COUNT(*) FILTER (WHERE team_role = 'subcontractor') as sub_count,
  SUM(weighted_award_amount) as total_weighted_value,
  SUM(weighted_award_amount) FILTER (WHERE team_role = 'prime') as prime_value,
  SUM(weighted_award_amount) FILTER (WHERE team_role = 'subcontractor') as sub_value,
  AVG(work_share_percentage) as avg_work_share
FROM dod_contract_team_members
GROUP BY company_name
ORDER BY total_weighted_value DESC NULLS LAST;

-- View 4: Teaming Relationships (Who teams with whom?)
CREATE VIEW teaming_relationships AS
SELECT 
  p.company_name as prime_contractor,
  s.company_name as subcontractor,
  COUNT(*) as times_teamed,
  AVG(s.work_share_percentage) as avg_sub_share,
  SUM(s.weighted_award_amount) as total_sub_value
FROM dod_contract_team_members p
JOIN dod_contract_team_members s 
  ON p.contract_id = s.contract_id 
  AND p.team_role = 'prime' 
  AND s.team_role = 'subcontractor'
GROUP BY p.company_name, s.company_name
HAVING COUNT(*) > 0
ORDER BY times_teamed DESC, total_sub_value DESC;

-- View 5: Full Contract with Team (Easy Join)
CREATE VIEW dod_contracts_with_teams AS
SELECT 
  c.*,
  t.company_name as team_member_company,
  t.team_role as team_member_role,
  t.work_share_percentage,
  t.weighted_award_amount
FROM dod_contract_news c
LEFT JOIN dod_contract_team_members t ON c.id = t.contract_id
ORDER BY c.published_date DESC, c.award_amount DESC;

-- =====================================================
-- Step 5: Grant Permissions
-- =====================================================
GRANT SELECT ON dod_contract_team_members TO anon, authenticated;
GRANT SELECT ON company_prime_contracts TO anon, authenticated;
GRANT SELECT ON company_subcontractor_performance TO anon, authenticated;
GRANT SELECT ON company_overall_performance TO anon, authenticated;
GRANT SELECT ON teaming_relationships TO anon, authenticated;
GRANT SELECT ON dod_contracts_with_teams TO anon, authenticated;

-- =====================================================
-- Step 6: Add Function to Calculate Weighted Amount
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_weighted_award()
RETURNS TRIGGER AS $$
BEGIN
  -- Automatically calculate weighted amount if percentage is set
  IF NEW.work_share_percentage IS NOT NULL AND NEW.award_amount IS NOT NULL THEN
    NEW.weighted_award_amount := NEW.award_amount * (NEW.work_share_percentage / 100.0);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_weighted_award
  BEFORE INSERT OR UPDATE ON dod_contract_team_members
  FOR EACH ROW
  EXECUTE FUNCTION calculate_weighted_award();

-- =====================================================
-- Step 7: Success Message
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE 'Team Members Table Created Successfully!';
  RAISE NOTICE ' ';
  RAISE NOTICE 'NEW TABLE:';
  RAISE NOTICE '   - dod_contract_team_members (normalized team member data)';
  RAISE NOTICE ' ';
  RAISE NOTICE 'NEW VIEWS:';
  RAISE NOTICE '   - company_prime_contracts (prime contractor performance)';
  RAISE NOTICE '   - company_subcontractor_performance (subcontractor performance)';
  RAISE NOTICE '   - company_overall_performance (combined prime + sub)';
  RAISE NOTICE '   - teaming_relationships (who teams with whom)';
  RAISE NOTICE '   - dod_contracts_with_teams (easy JOIN view)';
  RAISE NOTICE ' ';
  RAISE NOTICE 'KEY FEATURES:';
  RAISE NOTICE '   - Weighted award amounts (percentage × total value)';
  RAISE NOTICE '   - Automatic calculation via trigger';
  RAISE NOTICE '   - Optimized indexes for large-scale queries';
  RAISE NOTICE '   - Normalized design for analytics';
END $$;

