-- ============================================
-- Military News Scraper - Database Schema
-- ============================================
-- Comprehensive tracking of military news from all DoD sources
-- Covers: Contracts, Personnel, Units, Exercises, Deployments, News
-- Sources: Defense.gov, DVIDS, Military Times, Service Branches
-- ============================================

-- ============================================
-- 1. MAIN ARTICLES TABLE
-- ============================================

CREATE TABLE military_news_articles (
  id BIGSERIAL PRIMARY KEY,
  
  -- Source identification
  source TEXT NOT NULL, -- 'defense.gov', 'army.mil', 'armytimes', 'dvids', 'defensenews', etc.
  source_category TEXT, -- 'official_dod', 'service_branch', 'military_times', 'dvids', 'independent'
  article_url TEXT UNIQUE NOT NULL,
  article_id TEXT, -- Source's internal ID if available
  
  -- Article metadata
  title TEXT NOT NULL,
  subtitle TEXT,
  author TEXT,
  byline TEXT,
  
  -- Content
  summary TEXT,
  content TEXT NOT NULL, -- Full article text
  raw_html TEXT, -- Original HTML for re-parsing
  
  -- Dates
  published_date TIMESTAMPTZ NOT NULL,
  updated_date TIMESTAMPTZ,
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  last_checked_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Classification (can be multiple)
  article_types TEXT[], -- ['contract_award', 'promotion', 'change_of_command', 'training_exercise', 'deployment', 'policy', 'operation']
  primary_article_type TEXT,
  
  -- Service/Component
  service_branches TEXT[], -- ['army', 'navy', 'air_force', 'marine_corps', 'space_force', 'coast_guard']
  primary_service_branch TEXT,
  dod_components TEXT[], -- ['DARPA', 'DLA', 'DISA', 'MDA', 'NGA', etc.]
  
  -- Geographic
  locations TEXT[], -- Extracted locations
  primary_location TEXT,
  countries TEXT[],
  states TEXT[],
  bases TEXT[], -- Military installations mentioned
  
  -- Personnel (extracted from content)
  personnel_mentioned TEXT[], -- Names extracted
  ranks_mentioned TEXT[], -- Ranks extracted
  units_mentioned TEXT[], -- Unit names
  
  -- Multimedia
  image_urls TEXT[],
  video_urls TEXT[],
  document_urls TEXT[],
  
  -- Engagement/Metadata
  view_count INTEGER,
  has_comments BOOLEAN DEFAULT FALSE,
  
  -- Full-text search
  search_vector tsvector,
  
  -- Data quality
  extraction_quality_score INTEGER CHECK (extraction_quality_score >= 0 AND extraction_quality_score <= 100),
  needs_review BOOLEAN DEFAULT FALSE,
  reviewed_at TIMESTAMPTZ,
  reviewed_by TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. CONTRACT AWARDS TABLE
-- ============================================

CREATE TABLE military_contract_awards (
  id BIGSERIAL PRIMARY KEY,
  
  -- Link to source article
  article_id BIGINT REFERENCES military_news_articles(id) ON DELETE SET NULL,
  article_url TEXT,
  published_date DATE NOT NULL,
  
  -- Vendor information
  vendor_name TEXT NOT NULL,
  vendor_location TEXT,
  vendor_city TEXT,
  vendor_state VARCHAR(2),
  vendor_country VARCHAR(2) DEFAULT 'US',
  
  -- Contract details
  contract_number TEXT,
  modification_number TEXT,
  parent_contract TEXT,
  contract_type TEXT, -- 'FFP', 'CPFF', 'T&M', 'IDIQ', etc.
  
  -- Financial
  award_amount NUMERIC(15, 2),
  award_amount_text TEXT,
  obligated_amount NUMERIC(15, 2),
  ceiling_value NUMERIC(15, 2),
  
  -- Description
  contract_description TEXT NOT NULL,
  work_description TEXT,
  program_name TEXT,
  platform TEXT, -- Weapon system/platform name
  
  -- Performance
  performance_locations TEXT[],
  completion_date DATE,
  start_date DATE,
  option_periods TEXT,
  
  -- Funding
  fiscal_year INTEGER,
  funding_type TEXT,
  
  -- Government
  contracting_activity TEXT NOT NULL,
  contracting_office TEXT,
  service_branch TEXT,
  
  -- Competition
  number_of_offers_received INTEGER,
  competed BOOLEAN,
  
  -- Small business
  small_business_type TEXT,
  is_small_business BOOLEAN DEFAULT FALSE,
  is_8a BOOLEAN DEFAULT FALSE,
  is_sdvosb BOOLEAN DEFAULT FALSE,
  is_wosb BOOLEAN DEFAULT FALSE,
  is_hubzone BOOLEAN DEFAULT FALSE,
  
  -- Raw data
  raw_paragraph TEXT NOT NULL,
  
  -- Cross-references
  fpds_contract_id TEXT,
  sam_gov_opportunity_id TEXT,
  
  -- Data quality
  extraction_confidence NUMERIC(3, 2) CHECK (extraction_confidence >= 0 AND extraction_confidence <= 1),
  needs_review BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(article_id, contract_number, vendor_name)
);

-- ============================================
-- 3. PERSONNEL CHANGES TABLE
-- ============================================

CREATE TABLE military_personnel_changes (
  id BIGSERIAL PRIMARY KEY,
  
  -- Link to source
  article_id BIGINT REFERENCES military_news_articles(id) ON DELETE SET NULL,
  article_url TEXT,
  announced_date DATE NOT NULL,
  
  -- Change type
  change_type TEXT NOT NULL CHECK (change_type IN (
    'promotion', 'assignment', 'retirement', 'change_of_command', 
    'selection', 'award', 'death', 'appointment'
  )),
  
  -- Personnel information
  person_name TEXT NOT NULL,
  rank_from TEXT, -- Starting rank
  rank_to TEXT, -- New rank (for promotions)
  current_rank TEXT,
  
  -- Position
  position_from TEXT, -- Previous position
  position_to TEXT, -- New position
  current_position TEXT,
  
  -- Unit/Organization
  unit_from TEXT,
  unit_to TEXT,
  current_unit TEXT,
  command_level TEXT, -- 'brigade', 'division', 'corps', 'army', 'joint', 'unified_command', etc.
  
  -- Service
  service_branch TEXT NOT NULL CHECK (service_branch IN (
    'army', 'navy', 'air_force', 'marine_corps', 'space_force', 'coast_guard', 'joint'
  )),
  component TEXT, -- 'active', 'reserve', 'guard', 'civilian'
  
  -- Geographic
  location_from TEXT,
  location_to TEXT,
  base_from TEXT,
  base_to TEXT,
  
  -- Dates
  effective_date DATE,
  ceremony_date DATE,
  
  -- Promotion specific
  promotion_list_name TEXT, -- e.g., "FY24 Colonel Promotion List"
  promotion_sequence_number TEXT,
  date_of_rank DATE,
  
  -- Change of command specific
  outgoing_commander TEXT,
  incoming_commander TEXT,
  ceremony_location TEXT,
  
  -- Flag/General officer tracking
  is_flag_officer BOOLEAN DEFAULT FALSE,
  is_general_officer BOOLEAN DEFAULT FALSE,
  
  -- Additional context
  biography_url TEXT,
  photo_url TEXT,
  description TEXT,
  awards_mentioned TEXT[],
  
  -- Raw data
  raw_text TEXT,
  
  -- Data quality
  extraction_confidence NUMERIC(3, 2),
  needs_review BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(person_name, change_type, announced_date, current_position)
);

-- ============================================
-- 4. MILITARY UNITS TABLE
-- ============================================

CREATE TABLE military_units (
  id BIGSERIAL PRIMARY KEY,
  
  -- Unit identification
  unit_name TEXT NOT NULL,
  unit_designation TEXT, -- e.g., "3rd Infantry Division", "USS Ronald Reagan (CVN-76)"
  unit_type TEXT, -- 'division', 'brigade', 'battalion', 'ship', 'squadron', 'wing', etc.
  unit_size TEXT, -- 'squad', 'platoon', 'company', 'battalion', 'brigade', 'division', 'corps'
  
  -- Service
  service_branch TEXT NOT NULL CHECK (service_branch IN (
    'army', 'navy', 'air_force', 'marine_corps', 'space_force', 'coast_guard'
  )),
  component TEXT, -- 'active', 'reserve', 'guard'
  
  -- Hierarchy
  parent_unit TEXT,
  subordinate_units TEXT[],
  
  -- Location
  home_station TEXT,
  base_name TEXT,
  city TEXT,
  state VARCHAR(2),
  country VARCHAR(2) DEFAULT 'US',
  
  -- Current status
  current_location TEXT, -- May differ from home station if deployed
  deployment_status TEXT, -- 'home', 'deployed', 'training', 'en_route', 'unknown'
  
  -- Commander
  current_commander TEXT,
  current_commander_rank TEXT,
  
  -- Insignia/Identification
  unit_insignia_url TEXT,
  unit_motto TEXT,
  unit_nickname TEXT,
  
  -- URLs
  official_website TEXT,
  social_media JSONB, -- {'facebook': 'url', 'twitter': 'url', 'instagram': 'url'}
  
  -- DVIDS
  dvids_unit_id TEXT,
  
  -- Activity tracking
  last_activity_date DATE,
  last_mentioned_date DATE,
  mention_count INTEGER DEFAULT 0,
  
  -- Historical
  unit_history TEXT,
  activated_date DATE,
  deactivated_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Metadata
  first_seen TIMESTAMPTZ DEFAULT NOW(),
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(unit_designation, service_branch)
);

-- ============================================
-- 5. TRAINING EXERCISES TABLE
-- ============================================

CREATE TABLE military_training_exercises (
  id BIGSERIAL PRIMARY KEY,
  
  -- Link to source
  article_id BIGINT REFERENCES military_news_articles(id) ON DELETE SET NULL,
  article_url TEXT,
  announced_date DATE,
  
  -- Exercise details
  exercise_name TEXT NOT NULL,
  exercise_type TEXT, -- 'training', 'drill', 'wargame', 'joint_exercise', 'combined_exercise', 'field_training'
  exercise_code_name TEXT,
  
  -- Dates
  start_date DATE,
  end_date DATE,
  duration_days INTEGER,
  
  -- Participants
  participating_services TEXT[], -- ['army', 'navy', 'air_force']
  participating_units TEXT[],
  participating_countries TEXT[], -- For international exercises
  number_of_personnel INTEGER,
  number_of_countries INTEGER,
  
  -- Location
  location TEXT,
  base TEXT,
  country TEXT,
  geographic_region TEXT, -- 'EUCOM', 'INDOPACOM', 'CENTCOM', 'AFRICOM', 'NORTHCOM', 'SOUTHCOM'
  combatant_command TEXT,
  
  -- Details
  description TEXT,
  objectives TEXT,
  capabilities_exercised TEXT[], -- ['amphibious assault', 'air defense', 'cyber warfare', etc.]
  
  -- Equipment
  equipment_involved TEXT[], -- Types of equipment/platforms used
  
  -- Scale
  scale TEXT CHECK (scale IN ('small', 'medium', 'large', 'major', 'unknown')),
  
  -- Classification
  is_recurring BOOLEAN DEFAULT FALSE,
  frequency TEXT, -- 'annual', 'biannual', 'quarterly'
  previous_exercise_name TEXT, -- Link to previous iteration
  
  -- Partnership
  is_nato_exercise BOOLEAN DEFAULT FALSE,
  is_bilateral BOOLEAN DEFAULT FALSE,
  is_multilateral BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(exercise_name, start_date)
);

-- ============================================
-- 6. DEPLOYMENTS TABLE
-- ============================================

CREATE TABLE military_deployments (
  id BIGSERIAL PRIMARY KEY,
  
  -- Link to source
  article_id BIGINT REFERENCES military_news_articles(id) ON DELETE SET NULL,
  article_url TEXT,
  announced_date DATE NOT NULL,
  
  -- Unit
  unit_name TEXT NOT NULL,
  unit_designation TEXT,
  unit_id BIGINT REFERENCES military_units(id) ON DELETE SET NULL,
  service_branch TEXT NOT NULL,
  
  -- Deployment details
  deployment_type TEXT, -- 'deployment', 'redeployment', 'rotation', 'extension', 'expeditionary'
  
  -- Locations
  deploying_from TEXT,
  deploying_to TEXT,
  home_station TEXT,
  
  -- Dates
  deployment_date DATE,
  expected_return_date DATE,
  actual_return_date DATE,
  deployment_duration_months INTEGER,
  
  -- Size
  number_of_personnel INTEGER,
  equipment_description TEXT,
  
  -- Mission
  mission_description TEXT,
  operation_name TEXT,
  combatant_command TEXT, -- 'CENTCOM', 'EUCOM', 'INDOPACOM', 'AFRICOM', etc.
  theater TEXT, -- 'Middle East', 'Europe', 'Pacific', 'Africa', etc.
  
  -- Support
  mission_type TEXT, -- 'combat', 'peacekeeping', 'humanitarian', 'training', 'advisory'
  supporting_operations TEXT[], -- List of operations supported
  
  -- Status
  deployment_status TEXT CHECK (deployment_status IN (
    'announced', 'preparing', 'in_transit', 'deployed', 'completed', 'extended', 'cancelled'
  )),
  
  -- Metadata
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 7. MILITARY BASES REFERENCE TABLE
-- ============================================

CREATE TABLE military_bases (
  id BIGSERIAL PRIMARY KEY,
  
  base_name TEXT NOT NULL,
  base_full_name TEXT,
  base_type TEXT, -- 'army_post', 'naval_station', 'air_force_base', 'marine_corps_base', 'coast_guard_station', 'joint_base'
  
  service_branch TEXT NOT NULL,
  
  -- Location
  city TEXT,
  state VARCHAR(2),
  country VARCHAR(2) DEFAULT 'US',
  
  -- Coordinates
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  
  -- Status
  status TEXT CHECK (status IN ('active', 'closed', 'realigned', 'planned', 'reserve')),
  
  -- Information
  major_units TEXT[], -- Major units stationed there
  base_population INTEGER,
  
  -- URLs
  website TEXT,
  
  -- Metadata
  first_seen TIMESTAMPTZ DEFAULT NOW(),
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(base_name, state, country)
);

-- ============================================
-- 8. MILITARY RANKS REFERENCE TABLE
-- ============================================

CREATE TABLE military_ranks (
  id BIGSERIAL PRIMARY KEY,
  
  service_branch TEXT NOT NULL CHECK (service_branch IN (
    'army', 'navy', 'air_force', 'marine_corps', 'space_force', 'coast_guard'
  )),
  rank_name TEXT NOT NULL,
  rank_abbreviation TEXT,
  pay_grade TEXT, -- 'E-1', 'O-6', 'W-2', etc.
  rank_order INTEGER NOT NULL, -- For sorting (higher = more senior)
  
  -- Category
  is_officer BOOLEAN DEFAULT FALSE,
  is_enlisted BOOLEAN DEFAULT FALSE,
  is_warrant BOOLEAN DEFAULT FALSE,
  is_flag_officer BOOLEAN DEFAULT FALSE, -- General/Admiral ranks (O-7 and above)
  
  -- NATO rank code
  nato_code TEXT,
  
  UNIQUE(service_branch, rank_name),
  UNIQUE(service_branch, pay_grade)
);

-- ============================================
-- 9. SCRAPER LOG TABLE
-- ============================================

CREATE TABLE military_news_scraper_log (
  id BIGSERIAL PRIMARY KEY,
  
  -- Scraper info
  scraper_name TEXT NOT NULL, -- 'defense_gov_daily', 'army_times_historical', 'dvids_api', etc.
  scrape_type TEXT NOT NULL CHECK (scrape_type IN ('historical', 'daily', 'backfill', 'update', 'test')),
  source TEXT NOT NULL,
  
  -- Date range
  date_from DATE,
  date_to DATE,
  
  -- Results
  articles_found INTEGER DEFAULT 0,
  articles_new INTEGER DEFAULT 0,
  articles_updated INTEGER DEFAULT 0,
  articles_skipped INTEGER DEFAULT 0,
  articles_failed INTEGER DEFAULT 0,
  
  -- Extracted entities
  contracts_extracted INTEGER DEFAULT 0,
  personnel_changes_extracted INTEGER DEFAULT 0,
  units_identified INTEGER DEFAULT 0,
  exercises_found INTEGER DEFAULT 0,
  deployments_found INTEGER DEFAULT 0,
  
  -- Status
  status TEXT NOT NULL CHECK (status IN ('running', 'completed', 'failed', 'partial')),
  error_message TEXT,
  errors TEXT[], -- Array of error messages
  warnings TEXT[],
  
  -- Performance
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- military_news_articles indexes
CREATE INDEX idx_mil_news_source ON military_news_articles(source);
CREATE INDEX idx_mil_news_source_cat ON military_news_articles(source_category);
CREATE INDEX idx_mil_news_published ON military_news_articles(published_date DESC);
CREATE INDEX idx_mil_news_scraped ON military_news_articles(scraped_at DESC);
CREATE INDEX idx_mil_news_types ON military_news_articles USING GIN(article_types);
CREATE INDEX idx_mil_news_services ON military_news_articles USING GIN(service_branches);
CREATE INDEX idx_mil_news_locations ON military_news_articles USING GIN(locations);
CREATE INDEX idx_mil_news_units ON military_news_articles USING GIN(units_mentioned);
CREATE INDEX idx_mil_news_needs_review ON military_news_articles(needs_review) WHERE needs_review = TRUE;

-- Full-text search on articles
CREATE INDEX idx_mil_news_search ON military_news_articles USING GIN(search_vector);
CREATE INDEX idx_mil_news_title_fts ON military_news_articles USING GIN(to_tsvector('english', title));
CREATE INDEX idx_mil_news_content_fts ON military_news_articles USING GIN(to_tsvector('english', content));

-- military_contract_awards indexes
CREATE INDEX idx_mil_contracts_vendor ON military_contract_awards(vendor_name);
CREATE INDEX idx_mil_contracts_vendor_trgm ON military_contract_awards USING gin(vendor_name gin_trgm_ops);
CREATE INDEX idx_mil_contracts_date ON military_contract_awards(published_date DESC);
CREATE INDEX idx_mil_contracts_amount ON military_contract_awards(award_amount DESC NULLS LAST);
CREATE INDEX idx_mil_contracts_service ON military_contract_awards(service_branch);
CREATE INDEX idx_mil_contracts_number ON military_contract_awards(contract_number) WHERE contract_number IS NOT NULL;
CREATE INDEX idx_mil_contracts_article ON military_contract_awards(article_id);
CREATE INDEX idx_mil_contracts_fpds ON military_contract_awards(fpds_contract_id) WHERE fpds_contract_id IS NOT NULL;

-- military_personnel_changes indexes
CREATE INDEX idx_mil_personnel_name ON military_personnel_changes(person_name);
CREATE INDEX idx_mil_personnel_type ON military_personnel_changes(change_type);
CREATE INDEX idx_mil_personnel_date ON military_personnel_changes(announced_date DESC);
CREATE INDEX idx_mil_personnel_effective ON military_personnel_changes(effective_date DESC) WHERE effective_date IS NOT NULL;
CREATE INDEX idx_mil_personnel_service ON military_personnel_changes(service_branch);
CREATE INDEX idx_mil_personnel_rank_to ON military_personnel_changes(rank_to);
CREATE INDEX idx_mil_personnel_unit_to ON military_personnel_changes(unit_to);
CREATE INDEX idx_mil_personnel_flag ON military_personnel_changes(is_flag_officer) WHERE is_flag_officer = TRUE;
CREATE INDEX idx_mil_personnel_article ON military_personnel_changes(article_id);

-- military_units indexes
CREATE INDEX idx_mil_units_name ON military_units(unit_name);
CREATE INDEX idx_mil_units_designation ON military_units(unit_designation);
CREATE INDEX idx_mil_units_service ON military_units(service_branch);
CREATE INDEX idx_mil_units_base ON military_units(base_name);
CREATE INDEX idx_mil_units_location ON military_units(current_location);
CREATE INDEX idx_mil_units_status ON military_units(deployment_status);
CREATE INDEX idx_mil_units_active ON military_units(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_mil_units_dvids ON military_units(dvids_unit_id) WHERE dvids_unit_id IS NOT NULL;

-- military_training_exercises indexes
CREATE INDEX idx_mil_exercises_name ON military_training_exercises(exercise_name);
CREATE INDEX idx_mil_exercises_start ON military_training_exercises(start_date DESC);
CREATE INDEX idx_mil_exercises_end ON military_training_exercises(end_date DESC) WHERE end_date IS NOT NULL;
CREATE INDEX idx_mil_exercises_location ON military_training_exercises(country);
CREATE INDEX idx_mil_exercises_services ON military_training_exercises USING GIN(participating_services);
CREATE INDEX idx_mil_exercises_scale ON military_training_exercises(scale);
CREATE INDEX idx_mil_exercises_article ON military_training_exercises(article_id);

-- military_deployments indexes
CREATE INDEX idx_mil_deployments_unit ON military_deployments(unit_name);
CREATE INDEX idx_mil_deployments_date ON military_deployments(announced_date DESC);
CREATE INDEX idx_mil_deployments_deployment_date ON military_deployments(deployment_date DESC) WHERE deployment_date IS NOT NULL;
CREATE INDEX idx_mil_deployments_status ON military_deployments(deployment_status);
CREATE INDEX idx_mil_deployments_service ON military_deployments(service_branch);
CREATE INDEX idx_mil_deployments_command ON military_deployments(combatant_command);
CREATE INDEX idx_mil_deployments_article ON military_deployments(article_id);

-- military_bases indexes
CREATE INDEX idx_mil_bases_name ON military_bases(base_name);
CREATE INDEX idx_mil_bases_service ON military_bases(service_branch);
CREATE INDEX idx_mil_bases_state ON military_bases(state) WHERE state IS NOT NULL;
CREATE INDEX idx_mil_bases_country ON military_bases(country);
CREATE INDEX idx_mil_bases_status ON military_bases(status);

-- military_ranks indexes
CREATE INDEX idx_mil_ranks_service ON military_ranks(service_branch);
CREATE INDEX idx_mil_ranks_pay_grade ON military_ranks(pay_grade);
CREATE INDEX idx_mil_ranks_order ON military_ranks(rank_order DESC);
CREATE INDEX idx_mil_ranks_flag ON military_ranks(is_flag_officer) WHERE is_flag_officer = TRUE;

-- military_news_scraper_log indexes
CREATE INDEX idx_mil_scraper_log_scraper ON military_news_scraper_log(scraper_name);
CREATE INDEX idx_mil_scraper_log_source ON military_news_scraper_log(source);
CREATE INDEX idx_mil_scraper_log_started ON military_news_scraper_log(started_at DESC);
CREATE INDEX idx_mil_scraper_log_status ON military_news_scraper_log(status);

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_mil_news_updated_at 
  BEFORE UPDATE ON military_news_articles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mil_contracts_updated_at 
  BEFORE UPDATE ON military_contract_awards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mil_personnel_updated_at 
  BEFORE UPDATE ON military_personnel_changes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mil_units_updated_at 
  BEFORE UPDATE ON military_units
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mil_exercises_updated_at 
  BEFORE UPDATE ON military_training_exercises
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mil_deployments_updated_at 
  BEFORE UPDATE ON military_deployments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-update search_vector for full-text search
CREATE OR REPLACE FUNCTION update_article_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.summary, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.content, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_mil_news_search_vector
  BEFORE INSERT OR UPDATE OF title, summary, content
  ON military_news_articles
  FOR EACH ROW
  EXECUTE FUNCTION update_article_search_vector();

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Calculate article quality score
CREATE OR REPLACE FUNCTION calculate_mil_news_quality(article military_news_articles)
RETURNS INTEGER AS $$
DECLARE
  score INTEGER := 0;
BEGIN
  -- Base fields (40 points)
  IF article.title IS NOT NULL THEN score := score + 10; END IF;
  IF article.content IS NOT NULL AND length(article.content) > 500 THEN score := score + 15; END IF;
  IF article.published_date IS NOT NULL THEN score := score + 10; END IF;
  IF article.source IS NOT NULL THEN score := score + 5; END IF;
  
  -- Classification (20 points)
  IF article.article_types IS NOT NULL AND array_length(article.article_types, 1) > 0 THEN score := score + 10; END IF;
  IF article.service_branches IS NOT NULL AND array_length(article.service_branches, 1) > 0 THEN score := score + 10; END IF;
  
  -- Extracted entities (30 points)
  IF article.personnel_mentioned IS NOT NULL AND array_length(article.personnel_mentioned, 1) > 0 THEN score := score + 10; END IF;
  IF article.units_mentioned IS NOT NULL AND array_length(article.units_mentioned, 1) > 0 THEN score := score + 10; END IF;
  IF article.locations IS NOT NULL AND array_length(article.locations, 1) > 0 THEN score := score + 10; END IF;
  
  -- Rich media (10 points)
  IF article.image_urls IS NOT NULL AND array_length(article.image_urls, 1) > 0 THEN score := score + 5; END IF;
  IF article.video_urls IS NOT NULL AND array_length(article.video_urls, 1) > 0 THEN score := score + 5; END IF;
  
  RETURN score;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- ANALYSIS VIEWS
-- ============================================

-- Recent military news by source
CREATE VIEW mil_recent_news AS
SELECT 
  id,
  source,
  title,
  published_date,
  primary_article_type,
  primary_service_branch,
  array_length(personnel_mentioned, 1) as personnel_count,
  array_length(units_mentioned, 1) as units_count,
  extraction_quality_score
FROM military_news_articles
WHERE published_date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY published_date DESC;

-- Recent contract awards summary
CREATE VIEW mil_recent_contracts AS
SELECT 
  id,
  vendor_name,
  award_amount,
  contract_description,
  service_branch,
  published_date,
  contracting_activity,
  is_small_business
FROM military_contract_awards
WHERE published_date >= CURRENT_DATE - INTERVAL '90 days'
ORDER BY published_date DESC, award_amount DESC NULLS LAST;

-- Flag officer changes (promotions, assignments)
CREATE VIEW mil_flag_officer_changes AS
SELECT 
  id,
  person_name,
  change_type,
  rank_from,
  rank_to,
  position_from,
  position_to,
  service_branch,
  announced_date,
  effective_date
FROM military_personnel_changes
WHERE is_flag_officer = TRUE
ORDER BY announced_date DESC;

-- Active training exercises
CREATE VIEW mil_active_exercises AS
SELECT 
  id,
  exercise_name,
  exercise_type,
  start_date,
  end_date,
  participating_services,
  participating_countries,
  location,
  number_of_personnel,
  scale
FROM military_training_exercises
WHERE start_date <= CURRENT_DATE 
  AND (end_date IS NULL OR end_date >= CURRENT_DATE)
ORDER BY start_date DESC;

-- Current deployments
CREATE VIEW mil_current_deployments AS
SELECT 
  id,
  unit_name,
  service_branch,
  deploying_to,
  deployment_date,
  expected_return_date,
  mission_description,
  combatant_command,
  deployment_status
FROM military_deployments
WHERE deployment_status IN ('deployed', 'in_transit', 'preparing')
ORDER BY deployment_date DESC;

-- Daily statistics
CREATE VIEW mil_daily_stats AS
SELECT 
  published_date::DATE,
  COUNT(*) as total_articles,
  COUNT(DISTINCT source) as sources_active,
  COUNT(*) FILTER (WHERE primary_article_type = 'contract_award') as contract_awards,
  COUNT(*) FILTER (WHERE primary_article_type = 'promotion') as promotions,
  COUNT(*) FILTER (WHERE primary_article_type = 'change_of_command') as command_changes,
  COUNT(*) FILTER (WHERE primary_article_type = 'training_exercise') as exercises,
  COUNT(*) FILTER (WHERE primary_article_type = 'deployment') as deployments
FROM military_news_articles
WHERE published_date >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY published_date::DATE
ORDER BY published_date::DATE DESC;

-- ============================================
-- COMPLETION MESSAGE
-- ============================================

DO $$ 
BEGIN 
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Military News Scraper Schema Created!';
    RAISE NOTICE '============================================';
    RAISE NOTICE ' ';
    RAISE NOTICE 'Tables created:';
    RAISE NOTICE '  - military_news_articles (main articles)';
    RAISE NOTICE '  - military_contract_awards (DoD contracts)';
    RAISE NOTICE '  - military_personnel_changes (promotions, assignments)';
    RAISE NOTICE '  - military_units (unit tracking)';
    RAISE NOTICE '  - military_training_exercises (exercises)';
    RAISE NOTICE '  - military_deployments (unit deployments)';
    RAISE NOTICE '  - military_bases (reference data)';
    RAISE NOTICE '  - military_ranks (reference data)';
    RAISE NOTICE '  - military_news_scraper_log (scraper tracking)';
    RAISE NOTICE ' ';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Populate reference tables (bases, ranks)';
    RAISE NOTICE '2. Build historical scraper';
    RAISE NOTICE '3. Test with sample data';
    RAISE NOTICE '4. Run full historical backfill';
    RAISE NOTICE '5. Deploy daily scrapers';
    RAISE NOTICE ' ';
    RAISE NOTICE 'See DOD_MILITARY_NEWS_SCRAPER_PLAN.md for details';
    RAISE NOTICE '============================================';
END $$;

