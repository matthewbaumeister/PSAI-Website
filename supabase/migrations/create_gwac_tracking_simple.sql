-- ============================================
-- GWAC TRACKING TABLES - SIMPLIFIED VERSION
-- ============================================

-- TABLE 1: gwac_programs
CREATE TABLE IF NOT EXISTS gwac_programs (
  id BIGSERIAL PRIMARY KEY,
  gwac_key TEXT UNIQUE NOT NULL,
  gwac_name TEXT NOT NULL,
  parent_contract_id TEXT,
  managing_agency TEXT,
  gwac_type TEXT,
  business_size TEXT,
  award_date DATE,
  start_date DATE,
  end_date DATE,
  ceiling_value DECIMAL(20,2),
  status TEXT DEFAULT 'active',
  program_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_gwac_programs_key ON gwac_programs(gwac_key);
CREATE INDEX idx_gwac_programs_status ON gwac_programs(status);

-- TABLE 2: gwac_holders
CREATE TABLE IF NOT EXISTS gwac_holders (
  id BIGSERIAL PRIMARY KEY,
  gwac_program_id BIGINT REFERENCES gwac_programs(id) ON DELETE CASCADE,
  gwac_key TEXT NOT NULL,
  gwac_name TEXT NOT NULL,
  company_intelligence_id BIGINT REFERENCES company_intelligence(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  vendor_uei TEXT,
  vendor_duns TEXT,
  vendor_cage_code TEXT,
  contract_number TEXT,
  holder_status TEXT DEFAULT 'active',
  awarded_date DATE,
  start_date DATE,
  end_date DATE,
  contract_ceiling DECIMAL(20,2),
  company_city TEXT,
  company_state TEXT,
  website TEXT,
  is_small_business BOOLEAN,
  is_8a BOOLEAN,
  is_women_owned BOOLEAN,
  is_veteran_owned BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_gwac_holders_program ON gwac_holders(gwac_program_id);
CREATE INDEX idx_gwac_holders_company ON gwac_holders(company_intelligence_id);
CREATE INDEX idx_gwac_holders_uei ON gwac_holders(vendor_uei);
CREATE INDEX idx_gwac_holders_status ON gwac_holders(holder_status);

-- TABLE 3: gwac_spending_history
CREATE TABLE IF NOT EXISTS gwac_spending_history (
  id BIGSERIAL PRIMARY KEY,
  gwac_program_id BIGINT REFERENCES gwac_programs(id) ON DELETE CASCADE,
  company_intelligence_id BIGINT REFERENCES company_intelligence(id) ON DELETE SET NULL,
  gwac_holder_id BIGINT REFERENCES gwac_holders(id) ON DELETE SET NULL,
  gwac_key TEXT NOT NULL,
  gwac_name TEXT NOT NULL,
  gwac_parent_contract TEXT,
  contractor_name TEXT NOT NULL,
  contractor_uei TEXT,
  contractor_duns TEXT,
  award_id TEXT,
  award_type TEXT,
  award_description TEXT,
  award_amount DECIMAL(20,2),
  total_outlayed DECIMAL(20,2),
  award_date DATE,
  start_date DATE,
  end_date DATE,
  awarding_agency TEXT,
  awarding_sub_agency TEXT,
  contractor_city TEXT,
  contractor_state TEXT,
  data_source TEXT DEFAULT 'usaspending',
  scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_gwac_spending_program ON gwac_spending_history(gwac_program_id);
CREATE INDEX idx_gwac_spending_contractor_name ON gwac_spending_history(contractor_name);
CREATE INDEX idx_gwac_spending_uei ON gwac_spending_history(contractor_uei);
CREATE INDEX idx_gwac_spending_award_date ON gwac_spending_history(award_date DESC);
CREATE INDEX idx_gwac_spending_amount ON gwac_spending_history(award_amount DESC);

-- TABLE 4: gwac_contractor_summary
CREATE TABLE IF NOT EXISTS gwac_contractor_summary (
  id BIGSERIAL PRIMARY KEY,
  company_intelligence_id BIGINT REFERENCES company_intelligence(id) ON DELETE CASCADE,
  contractor_name TEXT NOT NULL,
  contractor_uei TEXT,
  contractor_duns TEXT,
  gwac_count INTEGER DEFAULT 0,
  gwac_list TEXT[],
  total_awards INTEGER DEFAULT 0,
  total_award_value DECIMAL(20,2) DEFAULT 0,
  total_outlayed DECIMAL(20,2) DEFAULT 0,
  earliest_award_date DATE,
  latest_award_date DATE,
  avg_award_size DECIMAL(20,2),
  utilization_rate DECIMAL(5,2),
  last_calculated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_gwac_summary_contractor_name ON gwac_contractor_summary(contractor_name);
CREATE INDEX idx_gwac_summary_uei ON gwac_contractor_summary(contractor_uei);
CREATE INDEX idx_gwac_summary_gwac_count ON gwac_contractor_summary(gwac_count DESC);
CREATE INDEX idx_gwac_summary_total_value ON gwac_contractor_summary(total_award_value DESC);

-- SEED DATA
INSERT INTO gwac_programs (gwac_key, gwac_name, parent_contract_id, managing_agency, gwac_type, business_size, award_date, start_date, status, program_url) VALUES
('alliant2', 'Alliant 2 Unrestricted', 'GS00Q17GWD2003', 'General Services Administration', 'IT Services', 'unrestricted', '2017-08-29', '2017-08-29', 'active', 'https://www.gsa.gov/technology/technology-purchasing-programs/governmentwide-acquisition-contracts/alliant-2'),
('alliant2_sb', 'Alliant 2 Small Business', 'GS00Q17GWD2015', 'General Services Administration', 'IT Services', 'small_business', '2018-01-31', '2018-01-31', 'active', 'https://www.gsa.gov/technology/technology-purchasing-programs/governmentwide-acquisition-contracts/alliant-2/alliant-2-small-business'),
('stars3', '8(a) STARS III', 'GS00Q17GWD2501', 'General Services Administration', 'IT Services', 'small_business', '2021-11-08', '2021-11-08', 'active', 'https://www.gsa.gov/technology/technology-purchasing-programs/governmentwide-acquisition-contracts/8a-stars-iii'),
('oasis', 'OASIS Unrestricted', 'GS00Q14OADU130', 'General Services Administration', 'Professional Services', 'unrestricted', '2014-09-01', '2014-09-01', 'active', 'https://www.gsa.gov/technology/technology-purchasing-programs/governmentwide-acquisition-contracts/oasis-unrestricted'),
('oasis_sb', 'OASIS Small Business', 'GS00Q14OADS226', 'General Services Administration', 'Professional Services', 'small_business', '2014-06-26', '2014-06-26', 'active', 'https://www.gsa.gov/technology/technology-purchasing-programs/governmentwide-acquisition-contracts/oasis-small-business'),
('polaris', 'Polaris', 'GS00Q23GWD0001', 'General Services Administration', 'IT Services', 'both', '2023-08-15', '2023-08-15', 'active', 'https://www.gsa.gov/technology/technology-purchasing-programs/governmentwide-acquisition-contracts/polaris'),
('cio_sp3', 'CIO-SP3', 'HHSN316201200012W', 'National Institutes of Health', 'IT Services', 'both', '2012-05-17', '2012-05-17', 'active', 'https://nitaac.nih.gov/gwacs/cio-sp3'),
('cio_sp4', 'CIO-SP4', 'HHSN316202100002W', 'National Institutes of Health', 'IT Services', 'both', '2022-04-25', '2022-04-25', 'active', 'https://nitaac.nih.gov/gwacs/cio-sp4')
ON CONFLICT (gwac_key) DO NOTHING;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'GWAC tables created successfully!';
  RAISE NOTICE 'Tables: gwac_programs, gwac_holders, gwac_spending_history, gwac_contractor_summary';
  RAISE NOTICE 'Next: Run python scripts/gwac-historical-scraper.py';
END $$;

