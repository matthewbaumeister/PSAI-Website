-- ============================================
-- Seed GWAC Catalog with Initial Data
-- ============================================
-- Run this in Supabase Dashboard SQL Editor

INSERT INTO gwac_catalog (gwac_name, gwac_acronym, gwac_type, managing_agency, description, website_url, holder_directory_url, is_active) VALUES
  ('Alliant 2 Small Business', 'Alliant 2 SB', 'IT', 'GSA', 'IT services and solutions for small businesses', 'https://www.gsa.gov/acquisition/purchasing-programs/gsa-contracts/governmentwide-acquisition-contracts-gwacs/alliant-2', NULL, true),
  ('Alliant 2 Unrestricted', 'Alliant 2', 'IT', 'GSA', 'IT services and solutions for all business sizes', 'https://www.gsa.gov/acquisition/purchasing-programs/gsa-contracts/governmentwide-acquisition-contracts-gwacs/alliant-2', NULL, true),
  ('OASIS Small Business', 'OASIS SB', 'Professional Services', 'GSA', 'Professional services for small businesses', 'https://www.gsa.gov/acquisition/purchasing-programs/gsa-contracts/governmentwide-acquisition-contracts-gwacs/oasis-and-oasis-small-business', NULL, true),
  ('OASIS Unrestricted', 'OASIS', 'Professional Services', 'GSA', 'Professional services for all business sizes', 'https://www.gsa.gov/acquisition/purchasing-programs/gsa-contracts/governmentwide-acquisition-contracts-gwacs/oasis-and-oasis-small-business', NULL, true),
  ('8(a) STARS III', 'STARS III', 'IT', 'GSA', 'IT services for 8(a) small businesses', 'https://www.gsa.gov/acquisition/purchasing-programs/gsa-contracts/governmentwide-acquisition-contracts-gwacs/8a-stars-iii', NULL, true),
  ('Polaris Small Business', 'Polaris SB', 'IT', 'GSA', 'Next generation IT GWAC for small businesses', 'https://www.gsa.gov/acquisition/purchasing-programs/gsa-contracts/governmentwide-acquisition-contracts-gwacs/polaris', NULL, true),
  ('Polaris Unrestricted', 'Polaris', 'IT', 'GSA', 'Next generation IT GWAC for all business sizes', 'https://www.gsa.gov/acquisition/purchasing-programs/gsa-contracts/governmentwide-acquisition-contracts-gwacs/polaris', NULL, true),
  ('CIO-SP3 Small Business', 'CIO-SP3 SB', 'IT', 'NITAAC', 'IT services and solutions for small businesses', 'https://nitaac.nih.gov/services/cio-sp3', 'https://nitaac.nih.gov/resources/frequently-asked-questions/there-way-see-which-contract-holders-are-each-gwac', true),
  ('CIO-SP3 Unrestricted', 'CIO-SP3', 'IT', 'NITAAC', 'IT services and solutions for all business sizes', 'https://nitaac.nih.gov/services/cio-sp3', 'https://nitaac.nih.gov/resources/frequently-asked-questions/there-way-see-which-contract-holders-are-each-gwac', true),
  ('CIO-SP4', 'CIO-SP4', 'IT', 'NITAAC', 'Next generation IT services GWAC', 'https://nitaac.nih.gov/services/cio-sp4', 'https://nitaac.nih.gov/resources/frequently-asked-questions/there-way-see-which-contract-holders-are-each-gwac', true),
  ('SEWP VI', 'SEWP', 'IT Products', 'NASA', 'IT products and solutions', 'https://www.sewp.nasa.gov/', NULL, true)
ON CONFLICT (gwac_name) DO NOTHING;

-- Verify
SELECT COUNT(*) as total_gwacs FROM gwac_catalog;
SELECT gwac_name, gwac_type, managing_agency FROM gwac_catalog ORDER BY gwac_name;

