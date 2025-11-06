-- ============================================
-- GSA PRICING TABLES
-- Stores labor categories and pricing from individual contractor price lists
-- ============================================

-- ============================================
-- TABLE 1: gsa_price_lists
-- Tracks price list files and scraping status
-- ============================================
CREATE TABLE IF NOT EXISTS gsa_price_lists (
  id BIGSERIAL PRIMARY KEY,
  
  -- Link to contractor
  contractor_id BIGINT REFERENCES gsa_schedule_holders(id) ON DELETE CASCADE,
  contract_number TEXT NOT NULL,
  
  -- Price list source
  price_list_url TEXT,
  file_name TEXT,
  file_downloaded BOOLEAN DEFAULT false,
  
  -- Parsing status
  parse_status TEXT DEFAULT 'pending', -- 'pending', 'downloading', 'parsing', 'completed', 'failed'
  parse_error TEXT,
  
  -- Metadata
  sheets_found TEXT[], -- List of sheet names in the Excel file
  labor_categories_count INTEGER DEFAULT 0,
  
  -- Timestamps
  downloaded_at TIMESTAMP WITH TIME ZONE,
  parsed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(contract_number)
);

CREATE INDEX IF NOT EXISTS idx_gsa_price_lists_contractor ON gsa_price_lists(contractor_id);
CREATE INDEX IF NOT EXISTS idx_gsa_price_lists_status ON gsa_price_lists(parse_status);
CREATE INDEX IF NOT EXISTS idx_gsa_price_lists_contract ON gsa_price_lists(contract_number);

-- ============================================
-- TABLE 2: gsa_labor_categories
-- Stores individual labor categories and their rates
-- ============================================
CREATE TABLE IF NOT EXISTS gsa_labor_categories (
  id BIGSERIAL PRIMARY KEY,
  
  -- Link to price list and contractor
  price_list_id BIGINT REFERENCES gsa_price_lists(id) ON DELETE CASCADE,
  contractor_id BIGINT REFERENCES gsa_schedule_holders(id) ON DELETE CASCADE,
  contract_number TEXT NOT NULL,
  
  -- Labor category details
  labor_category TEXT NOT NULL, -- e.g., "Senior Software Engineer"
  labor_category_code TEXT, -- Some contractors use codes
  
  -- Pricing
  hourly_rate DECIMAL(10,2),
  daily_rate DECIMAL(10,2),
  weekly_rate DECIMAL(10,2),
  monthly_rate DECIMAL(10,2),
  yearly_rate DECIMAL(15,2),
  
  -- Qualifications
  education_level TEXT, -- e.g., "Bachelor's Degree", "Master's Degree"
  years_experience TEXT, -- e.g., "5-7 years", "10+ years"
  security_clearance TEXT, -- e.g., "Secret", "Top Secret"
  
  -- Additional details
  description TEXT,
  duties TEXT,
  skills_required TEXT,
  certifications TEXT,
  
  -- Location-based pricing (if applicable)
  location TEXT, -- Some contracts have location-specific pricing
  
  -- Raw data from source
  source_sheet_name TEXT, -- Which sheet in the Excel file
  source_row_number INTEGER, -- Which row for debugging
  raw_data JSONB, -- Store all original columns for reference
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gsa_labor_categories_price_list ON gsa_labor_categories(price_list_id);
CREATE INDEX IF NOT EXISTS idx_gsa_labor_categories_contractor ON gsa_labor_categories(contractor_id);
CREATE INDEX IF NOT EXISTS idx_gsa_labor_categories_contract ON gsa_labor_categories(contract_number);
CREATE INDEX IF NOT EXISTS idx_gsa_labor_categories_category ON gsa_labor_categories(labor_category);
CREATE INDEX IF NOT EXISTS idx_gsa_labor_categories_hourly_rate ON gsa_labor_categories(hourly_rate);

-- ============================================
-- TABLE 3: gsa_pricing_scraper_log
-- Tracks scraping runs
-- ============================================
CREATE TABLE IF NOT EXISTS gsa_pricing_scraper_log (
  id BIGSERIAL PRIMARY KEY,
  
  -- Run details
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'running', -- 'running', 'completed', 'failed'
  
  -- Statistics
  total_price_lists INTEGER DEFAULT 0,
  downloaded_count INTEGER DEFAULT 0,
  parsed_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  labor_categories_found INTEGER DEFAULT 0,
  
  -- Error tracking
  errors JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- VIEW: gsa_contractors_with_pricing
-- Easy view of contractors with their pricing data
-- ============================================
CREATE OR REPLACE VIEW gsa_contractors_with_pricing AS
SELECT 
  c.id as contractor_id,
  c.company_name,
  c.contract_number,
  c.primary_sin,
  c.sin_codes,
  c.website,
  c.company_state,
  pl.price_list_url,
  pl.parse_status,
  pl.labor_categories_count,
  pl.parsed_at,
  COUNT(lc.id) as actual_labor_categories,
  MIN(lc.hourly_rate) as min_hourly_rate,
  MAX(lc.hourly_rate) as max_hourly_rate,
  AVG(lc.hourly_rate) as avg_hourly_rate
FROM gsa_schedule_holders c
LEFT JOIN gsa_price_lists pl ON c.id = pl.contractor_id
LEFT JOIN gsa_labor_categories lc ON c.id = lc.contractor_id
GROUP BY 
  c.id, c.company_name, c.contract_number, c.primary_sin, 
  c.sin_codes, c.website, c.company_state,
  pl.price_list_url, pl.parse_status, pl.labor_categories_count, pl.parsed_at;

COMMENT ON VIEW gsa_contractors_with_pricing IS 'Shows contractors with their pricing status and rate ranges';

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE gsa_price_lists IS 'Tracks GSA contractor price list files and parsing status';
COMMENT ON TABLE gsa_labor_categories IS 'Stores individual labor categories and rates from GSA price lists';
COMMENT ON TABLE gsa_pricing_scraper_log IS 'Logs pricing scraper runs';

COMMENT ON COLUMN gsa_labor_categories.hourly_rate IS 'Government ceiling price per hour';
COMMENT ON COLUMN gsa_labor_categories.labor_category IS 'Job title or labor category name';
COMMENT ON COLUMN gsa_labor_categories.raw_data IS 'All original columns from price list for reference';

