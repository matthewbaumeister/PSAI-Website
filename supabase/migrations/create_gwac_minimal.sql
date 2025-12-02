-- GWAC Tables - Minimal Version (No Foreign Keys)

-- Drop if exists to start fresh
DROP TABLE IF EXISTS gwac_contractor_summary CASCADE;
DROP TABLE IF EXISTS gwac_spending_history CASCADE;
DROP TABLE IF EXISTS gwac_holders CASCADE;
DROP TABLE IF EXISTS gwac_programs CASCADE;

-- Table 1: GWAC Programs
CREATE TABLE gwac_programs (
  id BIGSERIAL PRIMARY KEY,
  gwac_key TEXT UNIQUE NOT NULL,
  gwac_name TEXT NOT NULL,
  parent_contract_id TEXT,
  managing_agency TEXT,
  gwac_type TEXT,
  status TEXT DEFAULT 'active',
  award_date DATE,
  program_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table 2: GWAC Holders
CREATE TABLE gwac_holders (
  id BIGSERIAL PRIMARY KEY,
  gwac_key TEXT NOT NULL,
  gwac_name TEXT NOT NULL,
  company_name TEXT NOT NULL,
  vendor_uei TEXT,
  vendor_duns TEXT,
  contract_number TEXT,
  holder_status TEXT DEFAULT 'active',
  awarded_date DATE,
  is_small_business BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table 3: GWAC Spending History
CREATE TABLE gwac_spending_history (
  id BIGSERIAL PRIMARY KEY,
  gwac_key TEXT NOT NULL,
  gwac_name TEXT NOT NULL,
  gwac_parent_contract TEXT,
  contractor_name TEXT NOT NULL,
  contractor_uei TEXT,
  contractor_duns TEXT,
  award_id TEXT,
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
  scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table 4: Contractor Summary
CREATE TABLE gwac_contractor_summary (
  id BIGSERIAL PRIMARY KEY,
  contractor_name TEXT NOT NULL,
  contractor_uei TEXT,
  gwac_count INTEGER DEFAULT 0,
  gwac_list TEXT[],
  total_awards INTEGER DEFAULT 0,
  total_award_value DECIMAL(20,2) DEFAULT 0,
  total_outlayed DECIMAL(20,2) DEFAULT 0,
  earliest_award_date DATE,
  latest_award_date DATE,
  last_calculated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes (IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_gwac_programs_key ON gwac_programs(gwac_key);
CREATE INDEX IF NOT EXISTS idx_gwac_holders_uei ON gwac_holders(vendor_uei);
CREATE INDEX IF NOT EXISTS idx_gwac_spending_uei ON gwac_spending_history(contractor_uei);
CREATE INDEX IF NOT EXISTS idx_gwac_spending_date ON gwac_spending_history(award_date);
CREATE INDEX IF NOT EXISTS idx_gwac_summary_uei ON gwac_contractor_summary(contractor_uei);

-- Seed 8 major GWACs (skip if already exists)
INSERT INTO gwac_programs (gwac_key, gwac_name, parent_contract_id, managing_agency, gwac_type, award_date, status, program_url) VALUES
('alliant2', 'Alliant 2', 'GS00Q17GWD2003', 'GSA', 'IT Services', '2017-08-29', 'active', 'https://www.gsa.gov/alliant-2'),
('alliant2_sb', 'Alliant 2 SB', 'GS00Q17GWD2015', 'GSA', 'IT Services', '2018-01-31', 'active', 'https://www.gsa.gov/alliant-2-sb'),
('stars3', '8(a) STARS III', 'GS00Q17GWD2501', 'GSA', 'IT Services', '2021-11-08', 'active', 'https://www.gsa.gov/stars3'),
('oasis', 'OASIS', 'GS00Q14OADU130', 'GSA', 'Services', '2014-09-01', 'active', 'https://www.gsa.gov/oasis'),
('oasis_sb', 'OASIS SB', 'GS00Q14OADS226', 'GSA', 'Services', '2014-06-26', 'active', 'https://www.gsa.gov/oasis-sb'),
('polaris', 'Polaris', 'GS00Q23GWD0001', 'GSA', 'IT Services', '2023-08-15', 'active', 'https://www.gsa.gov/polaris'),
('cio_sp3', 'CIO-SP3', 'HHSN316201200012W', 'NIH', 'IT Services', '2012-05-17', 'active', 'https://nitaac.nih.gov/cio-sp3'),
('cio_sp4', 'CIO-SP4', 'HHSN316202100002W', 'NIH', 'IT Services', '2022-04-25', 'active', 'https://nitaac.nih.gov/cio-sp4')
ON CONFLICT (gwac_key) DO NOTHING;

-- Success
SELECT 'GWAC tables created successfully!' as message;
SELECT COUNT(*) as gwac_programs_count FROM gwac_programs;

