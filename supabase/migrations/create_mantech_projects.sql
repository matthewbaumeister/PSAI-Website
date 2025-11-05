-- ============================================
-- DOD ManTech Projects - Database Schema
-- ============================================
-- This table stores manufacturing technology projects and news
-- scraped from dodmantech.mil across all military branches
-- ============================================

CREATE TABLE mantech_projects (
  id BIGSERIAL PRIMARY KEY,
  
  -- Article/News metadata
  article_id INTEGER NOT NULL,
  article_url TEXT NOT NULL UNIQUE,
  article_title TEXT NOT NULL,
  published_date DATE,
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- ManTech Component (which branch/organization)
  mantech_component TEXT NOT NULL, -- 'Army', 'Navy', 'Air Force', 'DLA', 'OSD', 'JDMTP'
  component_url TEXT, -- URL to component-specific page
  
  -- Project Information
  project_name TEXT,
  project_id TEXT, -- If available from article
  project_description TEXT NOT NULL, -- Main content
  project_status TEXT, -- 'active', 'completed', 'transition', 'demonstration', etc.
  
  -- Technology Areas
  technology_focus TEXT[], -- Array of tech areas: ['additive manufacturing', 'composites', etc.]
  manufacturing_processes TEXT[], -- Specific processes involved
  technology_readiness_level INTEGER CHECK (technology_readiness_level BETWEEN 1 AND 9), -- TRL 1-9
  manufacturing_readiness_level INTEGER CHECK (manufacturing_readiness_level BETWEEN 1 AND 10), -- MRL 1-10
  
  -- Industry Partners & Companies
  companies_involved TEXT[], -- Array of company names mentioned
  prime_contractor TEXT,
  industry_partners TEXT[], -- Partners, collaborators
  academic_partners TEXT[], -- Universities, research institutions
  manufacturing_innovation_institutes TEXT[], -- MIIs involved (America Makes, etc.)
  
  -- Transition Information
  transition_stage TEXT, -- 'research', 'development', 'prototype', 'production', 'fielded'
  transition_from TEXT, -- Where tech is transitioning from (e.g., 'SBIR Phase II')
  transition_to TEXT, -- Where tech is transitioning to (e.g., 'Program of Record')
  program_of_record TEXT, -- If transitioning to specific program
  
  -- Funding & Value
  funding_amount NUMERIC(15, 2),
  funding_amount_text TEXT, -- "$5 million investment"
  fiscal_year INTEGER,
  investment_type TEXT, -- 'RDT&E', 'Procurement', 'O&M', etc.
  cost_savings_estimated NUMERIC(15, 2),
  cost_savings_text TEXT,
  
  -- Impact & Metrics
  capability_improvement TEXT, -- Description of capability improvement
  readiness_impact TEXT, -- Impact on readiness
  industrial_base_impact TEXT, -- Impact on industrial base
  jobs_created_supported INTEGER,
  production_rate_improvement TEXT, -- "50% faster production"
  
  -- Geographic Information
  locations TEXT[], -- Where work is performed
  states TEXT[], -- States involved
  facility_names TEXT[], -- Specific facilities/plants mentioned
  
  -- Weapon Systems & Platforms
  weapon_systems TEXT[], -- Systems that benefit from this tech
  platforms TEXT[], -- Platforms (F-35, Virginia Class, etc.)
  
  -- Collaboration & Programs
  collaborative_programs TEXT[], -- Joint programs, partnerships
  related_initiatives TEXT[], -- Related DoD initiatives
  
  -- Keywords & Tags (for search/filtering)
  keywords TEXT[], -- Extracted keywords
  technology_tags TEXT[], -- Technology classification tags
  industry_tags TEXT[], -- Industry sector tags
  
  -- Points of Contact
  poc_name TEXT,
  poc_title TEXT,
  poc_organization TEXT,
  poc_email TEXT,
  poc_phone TEXT,
  
  -- Raw Data
  raw_content TEXT NOT NULL, -- Full article text
  raw_html TEXT, -- Original HTML (optional, for debugging)
  
  -- Cross-References
  sbir_linked BOOLEAN DEFAULT FALSE,
  sbir_company_name TEXT,
  sbir_topic_number TEXT,
  
  contract_linked BOOLEAN DEFAULT FALSE,
  related_contract_numbers TEXT[], -- Link to contracts table
  
  -- Data Quality
  parsing_confidence NUMERIC(3, 2), -- 0.00-1.00
  data_quality_score INTEGER CHECK (data_quality_score >= 0 AND data_quality_score <= 100),
  extraction_issues TEXT[], -- Any parsing warnings
  needs_review BOOLEAN DEFAULT FALSE,
  reviewed_at TIMESTAMPTZ,
  reviewed_by TEXT,
  
  -- Media & Resources
  image_urls TEXT[],
  video_urls TEXT[],
  document_urls TEXT[], -- PDFs, reports, etc.
  
  -- Source Tracking
  source_type TEXT DEFAULT 'news_article', -- 'news_article', 'project_page', 'report', etc.
  source_url TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Indexes for Performance
-- ============================================

CREATE INDEX idx_mantech_published_date ON mantech_projects(published_date DESC NULLS LAST);
CREATE INDEX idx_mantech_component ON mantech_projects(mantech_component);
CREATE INDEX idx_mantech_article_id ON mantech_projects(article_id);
CREATE INDEX idx_mantech_project_status ON mantech_projects(project_status) WHERE project_status IS NOT NULL;
CREATE INDEX idx_mantech_transition_stage ON mantech_projects(transition_stage) WHERE transition_stage IS NOT NULL;
CREATE INDEX idx_mantech_fiscal_year ON mantech_projects(fiscal_year) WHERE fiscal_year IS NOT NULL;
CREATE INDEX idx_mantech_sbir_linked ON mantech_projects(sbir_linked) WHERE sbir_linked = TRUE;
CREATE INDEX idx_mantech_contract_linked ON mantech_projects(contract_linked) WHERE contract_linked = TRUE;
CREATE INDEX idx_mantech_needs_review ON mantech_projects(needs_review) WHERE needs_review = TRUE;

-- Array search indexes (GIN)
CREATE INDEX idx_mantech_companies ON mantech_projects USING gin(companies_involved);
CREATE INDEX idx_mantech_tech_focus ON mantech_projects USING gin(technology_focus);
CREATE INDEX idx_mantech_keywords ON mantech_projects USING gin(keywords);
CREATE INDEX idx_mantech_weapon_systems ON mantech_projects USING gin(weapon_systems);

-- Full-text search
CREATE INDEX idx_mantech_title_fts ON mantech_projects USING gin(to_tsvector('english', article_title));
CREATE INDEX idx_mantech_description_fts ON mantech_projects USING gin(to_tsvector('english', project_description));
CREATE INDEX idx_mantech_content_fts ON mantech_projects USING gin(to_tsvector('english', raw_content));

-- Trigram search for company names (fuzzy matching)
CREATE INDEX idx_mantech_prime_contractor_trgm ON mantech_projects USING gin(prime_contractor gin_trgm_ops) WHERE prime_contractor IS NOT NULL;

-- ============================================
-- Company Mentions Table (Many-to-Many)
-- ============================================

CREATE TABLE mantech_company_mentions (
  id BIGSERIAL PRIMARY KEY,
  project_id BIGINT REFERENCES mantech_projects(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  mention_type TEXT, -- 'prime', 'partner', 'subcontractor', 'supplier', 'collaborator'
  role_description TEXT,
  location TEXT,
  company_normalized TEXT, -- Normalized company name for matching
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(project_id, company_name, mention_type)
);

CREATE INDEX idx_mantech_mentions_project ON mantech_company_mentions(project_id);
CREATE INDEX idx_mantech_mentions_company ON mantech_company_mentions(company_name);
CREATE INDEX idx_mantech_mentions_normalized ON mantech_company_mentions(company_normalized);
CREATE INDEX idx_mantech_mentions_type ON mantech_company_mentions(mention_type);

-- ============================================
-- Scraper Progress Tracking
-- ============================================

CREATE TABLE mantech_scraper_log (
  id BIGSERIAL PRIMARY KEY,
  scrape_type TEXT NOT NULL, -- 'news', 'army', 'navy', 'air_force', 'dla', 'osd', 'full'
  scrape_date DATE NOT NULL,
  component TEXT, -- Which component was scraped
  status TEXT NOT NULL, -- 'pending', 'running', 'completed', 'failed'
  
  -- Statistics
  articles_found INTEGER DEFAULT 0,
  articles_scraped INTEGER DEFAULT 0,
  articles_failed INTEGER DEFAULT 0,
  projects_created INTEGER DEFAULT 0,
  projects_updated INTEGER DEFAULT 0,
  companies_extracted INTEGER DEFAULT 0,
  
  -- Error tracking
  error_message TEXT,
  error_details JSONB,
  
  -- Timing
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  
  -- Metadata
  triggered_by TEXT, -- 'cron', 'manual', 'api'
  user_email TEXT,
  
  UNIQUE(scrape_date, scrape_type, component)
);

CREATE INDEX idx_mantech_log_date ON mantech_scraper_log(scrape_date DESC);
CREATE INDEX idx_mantech_log_status ON mantech_scraper_log(status);
CREATE INDEX idx_mantech_log_component ON mantech_scraper_log(component);

-- ============================================
-- Views for Common Queries
-- ============================================

-- Recent ManTech projects
CREATE VIEW mantech_recent_projects AS
SELECT 
  id,
  article_title,
  mantech_component,
  project_name,
  technology_focus,
  companies_involved,
  prime_contractor,
  transition_stage,
  funding_amount,
  published_date,
  article_url
FROM mantech_projects
WHERE published_date >= CURRENT_DATE - INTERVAL '90 days'
  OR (published_date IS NULL AND scraped_at >= NOW() - INTERVAL '90 days')
ORDER BY COALESCE(published_date, scraped_at::date) DESC;

-- Projects by component
CREATE VIEW mantech_by_component AS
SELECT 
  mantech_component,
  COUNT(*) as total_projects,
  COUNT(*) FILTER (WHERE transition_stage = 'production') as in_production,
  COUNT(*) FILTER (WHERE sbir_linked = TRUE) as sbir_linked_projects,
  COUNT(DISTINCT prime_contractor) FILTER (WHERE prime_contractor IS NOT NULL) as unique_contractors,
  SUM(funding_amount) as total_funding
FROM mantech_projects
GROUP BY mantech_component
ORDER BY total_projects DESC;

-- Technology transition pipeline
CREATE VIEW mantech_transition_pipeline AS
SELECT 
  transition_stage,
  mantech_component,
  COUNT(*) as projects,
  COUNT(DISTINCT prime_contractor) as companies,
  AVG(technology_readiness_level) as avg_trl,
  AVG(manufacturing_readiness_level) as avg_mrl
FROM mantech_projects
WHERE transition_stage IS NOT NULL
GROUP BY transition_stage, mantech_component
ORDER BY 
  CASE transition_stage
    WHEN 'research' THEN 1
    WHEN 'development' THEN 2
    WHEN 'prototype' THEN 3
    WHEN 'production' THEN 4
    WHEN 'fielded' THEN 5
    ELSE 6
  END,
  mantech_component;

-- Top companies in ManTech
CREATE VIEW mantech_top_companies AS
SELECT 
  company_name,
  COUNT(DISTINCT cm.project_id) as projects_involved,
  COUNT(*) FILTER (WHERE mention_type = 'prime') as prime_contracts,
  COUNT(*) FILTER (WHERE mention_type = 'partner') as partnerships,
  STRING_AGG(DISTINCT m.mantech_component, ', ') as components_worked_with
FROM mantech_company_mentions cm
JOIN mantech_projects m ON cm.project_id = m.id
GROUP BY company_name
ORDER BY projects_involved DESC
LIMIT 100;

-- ManTech to SBIR linkage (complete view with all available columns)
CREATE VIEW mantech_sbir_transitions AS
SELECT 
  -- ManTech project info
  m.id as mantech_project_id,
  m.article_title as mantech_article_title,
  m.mantech_component,
  m.sbir_company_name,
  m.sbir_topic_number as mantech_sbir_topic_ref,
  m.technology_focus as mantech_technology_focus,
  m.transition_stage,
  m.published_date as mantech_published_date,
  m.funding_amount as mantech_funding,
  m.prime_contractor,
  m.weapon_systems,
  m.platforms,
  
  -- SBIR topic info (from sbir_final - using actual column names)
  s.id as sbir_id,
  s.topic_number as sbir_topic_number,
  s.topic_id as sbir_topic_id,
  s.cycle_name as sbir_cycle_name,
  s.title as sbir_topic_title,
  s.status as sbir_status,
  s.sponsor_component as sbir_component,
  s.solicitation_branch as sbir_solicitation_branch,
  s.open_date as sbir_open_date,
  s.close_date as sbir_close_date,
  s.technology_areas as sbir_technology_areas,
  s.keywords as sbir_keywords,
  s.description as sbir_description,
  s.objective as sbir_objective,
  s.phases_available as sbir_phases,
  s.is_xtech as sbir_is_xtech,
  s.urgency_level as sbir_urgency,
  s.proposal_window_status as sbir_proposal_status,
  s.has_awards as sbir_has_awards,
  s.total_awards as sbir_total_awards,
  s.total_award_funding as sbir_total_funding
FROM mantech_projects m
LEFT JOIN sbir_final s 
  ON m.sbir_topic_number = s.topic_number
WHERE m.sbir_linked = TRUE
ORDER BY m.published_date DESC;

-- ============================================
-- Helper Functions
-- ============================================

-- Calculate data quality score
CREATE OR REPLACE FUNCTION calculate_mantech_quality(record mantech_projects)
RETURNS INTEGER AS $$
DECLARE
  score INTEGER := 0;
BEGIN
  -- Essential fields (40 points)
  IF record.article_title IS NOT NULL AND LENGTH(record.article_title) > 10 THEN score := score + 10; END IF;
  IF record.project_description IS NOT NULL AND LENGTH(record.project_description) > 100 THEN score := score + 10; END IF;
  IF record.mantech_component IS NOT NULL THEN score := score + 10; END IF;
  IF record.published_date IS NOT NULL THEN score := score + 10; END IF;
  
  -- Important fields (30 points)
  IF record.companies_involved IS NOT NULL AND array_length(record.companies_involved, 1) > 0 THEN score := score + 10; END IF;
  IF record.technology_focus IS NOT NULL AND array_length(record.technology_focus, 1) > 0 THEN score := score + 10; END IF;
  IF record.transition_stage IS NOT NULL THEN score := score + 10; END IF;
  
  -- Enhanced fields (30 points)
  IF record.funding_amount IS NOT NULL THEN score := score + 10; END IF;
  IF record.weapon_systems IS NOT NULL AND array_length(record.weapon_systems, 1) > 0 THEN score := score + 5; END IF;
  IF record.poc_name IS NOT NULL THEN score := score + 5; END IF;
  IF record.sbir_linked = TRUE THEN score := score + 5; END IF;
  IF record.contract_linked = TRUE THEN score := score + 5; END IF;
  
  RETURN score;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Normalize company name for matching
CREATE OR REPLACE FUNCTION normalize_company_name(company_name TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN LOWER(
    TRIM(
      REGEXP_REPLACE(
        REGEXP_REPLACE(company_name, '\s+(Inc\.|LLC|Corp\.|Co\.|Ltd\.)$', '', 'i'),
        '\s+', ' ', 'g'
      )
    )
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- Triggers
-- ============================================

-- Auto-update timestamp
CREATE TRIGGER update_mantech_updated_at 
  BEFORE UPDATE ON mantech_projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-calculate quality score on insert/update
CREATE OR REPLACE FUNCTION auto_calculate_mantech_quality()
RETURNS TRIGGER AS $$
BEGIN
  NEW.data_quality_score := calculate_mantech_quality(NEW);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_mantech_quality_trigger
  BEFORE INSERT OR UPDATE ON mantech_projects
  FOR EACH ROW
  EXECUTE FUNCTION auto_calculate_mantech_quality();

-- Auto-populate company mentions table
CREATE OR REPLACE FUNCTION auto_populate_company_mentions()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert prime contractor
  IF NEW.prime_contractor IS NOT NULL THEN
    INSERT INTO mantech_company_mentions (project_id, company_name, mention_type, company_normalized)
    VALUES (NEW.id, NEW.prime_contractor, 'prime', normalize_company_name(NEW.prime_contractor))
    ON CONFLICT (project_id, company_name, mention_type) DO NOTHING;
  END IF;
  
  -- Insert companies_involved array
  IF NEW.companies_involved IS NOT NULL THEN
    INSERT INTO mantech_company_mentions (project_id, company_name, mention_type, company_normalized)
    SELECT NEW.id, unnest(NEW.companies_involved), 'partner', normalize_company_name(unnest(NEW.companies_involved))
    ON CONFLICT (project_id, company_name, mention_type) DO NOTHING;
  END IF;
  
  -- Insert industry partners
  IF NEW.industry_partners IS NOT NULL THEN
    INSERT INTO mantech_company_mentions (project_id, company_name, mention_type, company_normalized)
    SELECT NEW.id, unnest(NEW.industry_partners), 'collaborator', normalize_company_name(unnest(NEW.industry_partners))
    ON CONFLICT (project_id, company_name, mention_type) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER populate_company_mentions_trigger
  AFTER INSERT OR UPDATE ON mantech_projects
  FOR EACH ROW
  EXECUTE FUNCTION auto_populate_company_mentions();

-- ============================================
-- Sample Queries (Commented)
-- ============================================

-- Top technologies in ManTech
-- SELECT unnest(technology_focus) as technology, COUNT(*) as projects
-- FROM mantech_projects
-- GROUP BY technology
-- ORDER BY projects DESC
-- LIMIT 20;

-- Projects with highest readiness levels
-- SELECT article_title, mantech_component, technology_readiness_level, manufacturing_readiness_level, prime_contractor
-- FROM mantech_projects
-- WHERE technology_readiness_level >= 7 AND manufacturing_readiness_level >= 7
-- ORDER BY published_date DESC;

-- Cost savings by component
-- SELECT mantech_component, COUNT(*) as projects, SUM(cost_savings_estimated) as total_savings
-- FROM mantech_projects
-- WHERE cost_savings_estimated IS NOT NULL
-- GROUP BY mantech_component
-- ORDER BY total_savings DESC;

-- SBIR to ManTech transition tracking
-- SELECT m.sbir_company_name, m.technology_focus, m.transition_stage, s.phase
-- FROM mantech_projects m
-- JOIN sbir_final s ON LOWER(m.sbir_company_name) = LOWER(s.company_name)
-- WHERE m.sbir_linked = TRUE
-- ORDER BY m.published_date DESC;

