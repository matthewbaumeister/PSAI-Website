-- =====================================================
-- TRACK EVERYTHING: Team Members + Performance Locations
-- =====================================================

-- =====================================================
-- PART 1: Always populate team members (even without %)
-- =====================================================

-- We'll update the scraper to insert team members even without percentages
-- This allows tracking of prime/sub relationships

-- Add comment to clarify usage
COMMENT ON TABLE dod_contract_team_members IS 
'Team members for contracts. Includes prime/sub relationships even without work share percentages. weighted_award_amount is NULL if percentage not specified.';

-- =====================================================
-- PART 2: Create Performance Locations Table
-- =====================================================

CREATE TABLE IF NOT EXISTS dod_contract_performance_locations (
  id BIGSERIAL PRIMARY KEY,
  
  -- Link to parent contract
  contract_id BIGINT REFERENCES dod_contract_news(id) ON DELETE CASCADE,
  contract_number TEXT,
  
  -- Location details
  location_city TEXT,
  location_state TEXT,
  location_country TEXT DEFAULT 'United States',
  location_full TEXT, -- "Norfolk, Virginia"
  
  -- Work breakdown
  work_percentage NUMERIC(5,2), -- e.g., 35.00 for 35%
  weighted_award_amount NUMERIC(15,2), -- award_amount × (percentage/100)
  
  -- Contract reference data (denormalized for performance)
  award_amount NUMERIC(15,2),
  vendor_name TEXT,
  service_branch TEXT,
  published_date DATE,
  article_id INTEGER,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_work_percentage CHECK (work_percentage >= 0 AND work_percentage <= 100)
);

-- =====================================================
-- PART 3: Create Indexes for Performance
-- =====================================================

-- Primary lookup indexes
CREATE INDEX IF NOT EXISTS idx_perf_locations_contract_id ON dod_contract_performance_locations(contract_id);
CREATE INDEX IF NOT EXISTS idx_perf_locations_state ON dod_contract_performance_locations(location_state);
CREATE INDEX IF NOT EXISTS idx_perf_locations_city ON dod_contract_performance_locations(location_city);
CREATE INDEX IF NOT EXISTS idx_perf_locations_contract_number ON dod_contract_performance_locations(contract_number);

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_perf_locations_service_branch ON dod_contract_performance_locations(service_branch);
CREATE INDEX IF NOT EXISTS idx_perf_locations_published_date ON dod_contract_performance_locations(published_date DESC);
CREATE INDEX IF NOT EXISTS idx_perf_locations_vendor ON dod_contract_performance_locations(vendor_name);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_perf_locations_state_amount ON dod_contract_performance_locations(location_state, weighted_award_amount DESC);
CREATE INDEX IF NOT EXISTS idx_perf_locations_city_amount ON dod_contract_performance_locations(location_city, weighted_award_amount DESC);

-- =====================================================
-- PART 4: Auto-Calculate Weighted Amount Trigger
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_location_weighted_award()
RETURNS TRIGGER AS $$
BEGIN
  -- Automatically calculate weighted amount if percentage is set
  IF NEW.work_percentage IS NOT NULL AND NEW.award_amount IS NOT NULL THEN
    NEW.weighted_award_amount := NEW.award_amount * (NEW.work_percentage / 100.0);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_calculate_location_weighted_award ON dod_contract_performance_locations;

CREATE TRIGGER trigger_calculate_location_weighted_award
  BEFORE INSERT OR UPDATE ON dod_contract_performance_locations
  FOR EACH ROW
  EXECUTE FUNCTION calculate_location_weighted_award();

-- =====================================================
-- PART 5: Add Performance Location Breakdown to Main Table
-- =====================================================

ALTER TABLE dod_contract_news
  ADD COLUMN IF NOT EXISTS performance_location_breakdown JSONB;

COMMENT ON COLUMN dod_contract_news.performance_location_breakdown IS 
'JSONB array of performance locations with percentages: [{city, state, percentage}]';

-- =====================================================
-- PART 6: Create Analytics Views
-- =====================================================

-- View 1: Work by State
DROP VIEW IF EXISTS work_by_state CASCADE;
CREATE VIEW work_by_state AS
SELECT 
  location_state,
  COUNT(*) as contract_count,
  COUNT(DISTINCT vendor_name) as unique_vendors,
  SUM(award_amount) as total_contract_value,
  SUM(weighted_award_amount) as total_weighted_value,
  AVG(work_percentage) as avg_work_percentage,
  service_branch,
  COUNT(*) FILTER (WHERE published_date >= CURRENT_DATE - INTERVAL '90 days') as recent_contracts_90d
FROM dod_contract_performance_locations
WHERE location_state IS NOT NULL
GROUP BY location_state, service_branch
ORDER BY total_weighted_value DESC NULLS LAST;

-- View 2: Work by City
DROP VIEW IF EXISTS work_by_city CASCADE;
CREATE VIEW work_by_city AS
SELECT 
  location_city,
  location_state,
  COUNT(*) as contract_count,
  COUNT(DISTINCT vendor_name) as unique_vendors,
  SUM(award_amount) as total_contract_value,
  SUM(weighted_award_amount) as total_weighted_value,
  AVG(work_percentage) as avg_work_percentage,
  service_branch
FROM dod_contract_performance_locations
WHERE location_city IS NOT NULL
GROUP BY location_city, location_state, service_branch
ORDER BY total_weighted_value DESC NULLS LAST;

-- View 3: Top Locations by Branch
DROP VIEW IF EXISTS top_locations_by_branch CASCADE;
CREATE VIEW top_locations_by_branch AS
SELECT 
  service_branch,
  location_state,
  location_city,
  COUNT(*) as contracts,
  SUM(weighted_award_amount) as total_value,
  AVG(work_percentage) as avg_percentage,
  STRING_AGG(DISTINCT vendor_name, ', ' ORDER BY vendor_name) as vendors
FROM dod_contract_performance_locations
GROUP BY service_branch, location_state, location_city
ORDER BY service_branch, total_value DESC NULLS LAST;

-- View 4: Vendor Presence by Location
DROP VIEW IF EXISTS vendor_location_presence CASCADE;
CREATE VIEW vendor_location_presence AS
SELECT 
  vendor_name,
  location_state,
  COUNT(*) as contracts_in_state,
  SUM(weighted_award_amount) as total_value_in_state,
  AVG(work_percentage) as avg_work_percentage,
  STRING_AGG(DISTINCT location_city, ', ' ORDER BY location_city) as cities
FROM dod_contract_performance_locations
WHERE vendor_name IS NOT NULL
GROUP BY vendor_name, location_state
ORDER BY vendor_name, total_value_in_state DESC NULLS LAST;

-- View 5: Combined Contract Intelligence
DROP VIEW IF EXISTS contract_complete_breakdown CASCADE;
CREATE VIEW contract_complete_breakdown AS
SELECT 
  c.id,
  c.contract_number,
  c.vendor_name,
  c.award_amount,
  c.service_branch,
  c.is_teaming,
  
  -- Team members
  (SELECT json_agg(json_build_object(
    'company', company_name,
    'role', team_role,
    'percentage', work_share_percentage,
    'weighted_value', weighted_award_amount
  ))
  FROM dod_contract_team_members t
  WHERE t.contract_id = c.id) as team_breakdown,
  
  -- Performance locations
  (SELECT json_agg(json_build_object(
    'city', location_city,
    'state', location_state,
    'percentage', work_percentage,
    'weighted_value', weighted_award_amount
  ))
  FROM dod_contract_performance_locations p
  WHERE p.contract_id = c.id) as location_breakdown,
  
  c.published_date
FROM dod_contract_news c
ORDER BY c.award_amount DESC;

-- =====================================================
-- PART 7: Grant Permissions
-- =====================================================

GRANT SELECT ON dod_contract_performance_locations TO anon, authenticated;
GRANT SELECT ON work_by_state TO anon, authenticated;
GRANT SELECT ON work_by_city TO anon, authenticated;
GRANT SELECT ON top_locations_by_branch TO anon, authenticated;
GRANT SELECT ON vendor_location_presence TO anon, authenticated;
GRANT SELECT ON contract_complete_breakdown TO anon, authenticated;

-- =====================================================
-- PART 8: Success Message
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '====================================';
  RAISE NOTICE 'Performance Location Tracking Created!';
  RAISE NOTICE '====================================';
  RAISE NOTICE ' ';
  RAISE NOTICE 'NEW TABLE:';
  RAISE NOTICE '  - dod_contract_performance_locations';
  RAISE NOTICE ' ';
  RAISE NOTICE 'NEW VIEWS:';
  RAISE NOTICE '  - work_by_state (state-level analytics)';
  RAISE NOTICE '  - work_by_city (city-level analytics)';
  RAISE NOTICE '  - top_locations_by_branch (branch comparison)';
  RAISE NOTICE '  - vendor_location_presence (vendor footprint)';
  RAISE NOTICE '  - contract_complete_breakdown (everything in one place)';
  RAISE NOTICE ' ';
  RAISE NOTICE 'FEATURES:';
  RAISE NOTICE '  - Weighted award amounts per location';
  RAISE NOTICE '  - Automatic calculation via trigger';
  RAISE NOTICE '  - Track prime/sub relationships (even without percent)';
  RAISE NOTICE '  - Full geographic contract breakdown';
  RAISE NOTICE ' ';
  RAISE NOTICE 'NEXT: Update scraper to populate both tables';
END $$;

