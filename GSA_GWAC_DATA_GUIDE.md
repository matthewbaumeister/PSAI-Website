# GSA Schedule & GWAC Data Collection Guide

## Overview

This system downloads and maintains lists of companies holding GSA Multiple Award Schedules (MAS) and Government-Wide Acquisition Contracts (GWACs). This supplements your FPDS contract data with pre-qualified vendor information.

## Why This Matters

### Benefits
1. **Pre-Qualified Vendors**: Companies on GSA schedules and GWACs are already approved to sell to government
2. **Pricing Intelligence**: GSA schedules include pricing per FTE, hourly rates, and service offerings
3. **Market Positioning**: Identify which companies are positioned to bid before contracts are awarded
4. **Competitive Analysis**: See all holders of major contract vehicles
5. **Company Discovery**: Find companies that haven't won recent contracts but are still positioned

### Complement to FPDS
- **FPDS**: Shows actual contract awards (what happened)
- **GSA/GWAC**: Shows who can bid (what could happen)
- Together: Complete picture of market positioning

## Data Sources

### 1. GSA eLibrary (Multiple Award Schedules)

**Source**: https://www.gsaelibrary.gsa.gov

**What it contains**:
- All GSA MAS contract holders
- Special Item Numbers (SINs) for each contractor
- Service offerings and labor categories
- Pricing data (for some schedules)
- Contract expiration dates
- Small business status

**Coverage**: ~20,000+ companies across all SINs

**Download Format**: Excel (.xls) files per SIN

**Update Frequency**: Real-time (companies added/removed as contracts awarded/expire)

**Key SINs to Track**:
- `54151S` - IT Professional Services
- `541519ICAM` - Identity, Credentialing, and Access Management
- `541330` - Engineering Services
- `541611` - Management and Financial Consulting
- `541715` - Research and Development

**How to Access**:
1. Visit GSA eLibrary
2. Search by SIN or keyword
3. Click on SIN detail page
4. Click "Download Contractors (Excel)" button
5. Repeat for each SIN of interest

### 2. GSA GWACs (Government-Wide Acquisition Contracts)

#### Alliant 2
- **Website**: https://www.gsa.gov/alliant2
- **Type**: IT Services
- **Holders**: ~61 companies (SB), ~51 companies (Unrestricted)
- **Ceiling**: $50B combined
- **Format**: PDF list on website

#### OASIS
- **Website**: https://www.gsa.gov/oasis
- **Type**: Professional Services
- **Holders**: ~135 companies (SB), ~73 companies (Unrestricted)
- **Format**: PDF list on website

#### 8(a) STARS III
- **Website**: https://www.gsa.gov/8astars3
- **Type**: IT Services (8(a) companies only)
- **Holders**: ~90 companies
- **Format**: PDF list on website

#### Polaris (New GWAC - 2024)
- **Website**: https://www.gsa.gov/polaris
- **Type**: IT Services (next generation)
- **Holders**: TBD (awards being made)
- **Format**: PDF list on website

### 3. NITAAC GWACs (NIH)

#### CIO-SP3
- **Website**: https://nitaac.nih.gov/services/cio-sp3
- **Type**: IT Services
- **Holders**: ~155 companies (SB), ~28 companies (Unrestricted)
- **Directory**: https://nitaac.nih.gov/resources/frequently-asked-questions/there-way-see-which-contract-holders-are-each-gwac
- **Format**: Web directory with filtering

#### CIO-SP4 (New - 2024)
- **Website**: https://nitaac.nih.gov/services/cio-sp4
- **Type**: IT Services (next generation)
- **Holders**: TBD (awards being made)
- **Format**: Web directory with filtering

### 4. NASA SEWP
- **Website**: https://www.sewp.nasa.gov/
- **Type**: IT Products and Solutions
- **Holders**: ~2,100+ companies
- **Format**: Online searchable database

## Database Schema

### Tables Created

1. **gsa_schedule_holders** - Companies on GSA MAS
   - Contract details, SINs, pricing, labor categories
   - 20,000+ expected records

2. **gwac_holders** - Companies holding GWACs
   - GWAC name, capabilities, task order data
   - 1,000+ expected records

3. **gsa_sin_catalog** - Reference table for all SINs
   - SIN definitions and descriptions
   - 500+ SINs

4. **gwac_catalog** - Reference table for all GWACs
   - GWAC details and requirements
   - Pre-seeded with 11 major GWACs

5. **gsa_gwac_scraper_log** - Scraping operation tracking

### Key Views

- `active_gsa_schedule_holders` - Currently active GSA contractors
- `active_gwac_holders` - Currently active GWAC holders
- `combined_contract_vehicles` - All vehicles in one view
- `company_vehicle_summary` - Count of vehicles per company

## Data Collection Strategy

### Phase 1: Initial Population (One-Time)
1. Download all major SINs from GSA eLibrary
2. Download all GWAC holder lists
3. Populate reference catalogs (SINs, GWACs)
4. Clean and normalize company names
5. Link to existing company_intelligence via UEI/DUNS

**Estimated Time**: 4-6 hours (mostly manual downloads)
**Estimated Records**: 25,000+ companies

### Phase 2: Periodic Updates (Monthly/Quarterly)
1. Re-download all SINs and GWAC lists
2. Compare against existing data
3. Mark expired contracts as inactive
4. Add new contract holders
5. Update pricing and service data

**Estimated Time**: 1-2 hours per month
**Automation Level**: Semi-automated (downloads + script)

### Phase 3: Integration (Ongoing)
1. Link GSA/GWAC data to company profiles
2. Show on company detail pages
3. Use for market intelligence reports
4. Alert on new contract vehicle awards

## Scraper Implementation

### Technical Approach

**GSA eLibrary**:
```python
# Strategy: Download Excel files per SIN
# 1. Maintain list of target SINs
# 2. For each SIN, download Excel file
# 3. Parse Excel to extract company data
# 4. Normalize and insert into database
```

**GWAC Lists**:
```python
# Strategy: Web scraping + PDF parsing
# 1. Visit each GWAC website
# 2. Download holder list (PDF/HTML)
# 3. Parse company information
# 4. Normalize and insert into database
```

**NITAAC Directory**:
```python
# Strategy: Web scraping
# 1. Load directory page
# 2. Apply filters for each GWAC
# 3. Extract company information
# 4. Insert into database
```

### Data Normalization

Key challenges:
1. **Company Name Variations**: "ABC Corp" vs "ABC Corporation"
2. **UEI/DUNS Matching**: Link to existing records
3. **Address Standardization**: Normalize addresses
4. **Date Parsing**: Handle various date formats
5. **Pricing Data**: Extract from various formats

### Deduplication Strategy

Match companies across sources using:
1. UEI (Unique Entity Identifier) - Primary
2. DUNS number - Secondary
3. Company name + address - Fallback

## Integration with Existing System

### Link to Company Intelligence

```sql
-- Add contract vehicles to company profiles
UPDATE company_intelligence ci
SET 
  gsa_schedules = (
    SELECT ARRAY_AGG(DISTINCT schedule_number)
    FROM gsa_schedule_holders gsh
    WHERE gsh.vendor_uei = ci.vendor_uei
      AND gsh.is_active = true
  ),
  gwacs = (
    SELECT ARRAY_AGG(DISTINCT gwac_name)
    FROM gwac_holders gh
    WHERE gh.vendor_uei = ci.vendor_uei
      AND gh.is_active = true
  ),
  total_contract_vehicles = (
    SELECT 
      COUNT(DISTINCT gsh.contract_number) + 
      COUNT(DISTINCT gh.contract_number)
    FROM gsa_schedule_holders gsh
    FULL OUTER JOIN gwac_holders gh 
      ON gsh.vendor_uei = gh.vendor_uei
    WHERE (gsh.vendor_uei = ci.vendor_uei OR gh.vendor_uei = ci.vendor_uei)
      AND (gsh.is_active = true OR gh.is_active = true)
  );
```

### Link to FPDS Contracts

```sql
-- Find companies with vehicles but no recent contracts
SELECT 
  cv.company_name,
  cv.gsa_schedules,
  cv.gwacs,
  COALESCE(fc.recent_contracts, 0) as recent_contracts,
  COALESCE(fc.total_value, 0) as total_value
FROM company_vehicle_summary cv
LEFT JOIN (
  SELECT 
    vendor_name,
    COUNT(*) as recent_contracts,
    SUM(base_and_exercised_options_value) as total_value
  FROM fpds_contracts
  WHERE fiscal_year >= EXTRACT(YEAR FROM CURRENT_DATE) - 2
  GROUP BY vendor_name
) fc ON cv.company_name = fc.vendor_name
WHERE COALESCE(fc.recent_contracts, 0) < 5
ORDER BY cv.total_vehicles DESC;
```

## Use Cases

### 1. Market Intelligence
- "Which companies have Alliant 2 but haven't won contracts recently?"
- "What's the average number of GWACs held by top contractors?"
- "Which small businesses are on both GSA schedules and GWACs?"

### 2. Competitive Analysis
- "Who are all the holders of OASIS Small Business?"
- "Which companies compete with us on GSA Schedule 70?"
- "What's the total market of companies on IT GWACs?"

### 3. Business Development
- "Companies on GSA schedules in cybersecurity SINs"
- "Small businesses with GWACs but low contract wins"
- "Companies with expiring GSA contracts (re-compete opportunities)"

### 4. Company Profiles
- Show all contract vehicles on company detail pages
- Display pricing information for GSA schedule holders
- Track when contracts are up for renewal

## Cost Analysis

### Data Acquisition: $0
- GSA eLibrary: FREE
- GWAC websites: FREE
- NITAAC directory: FREE
- No API keys required

### Labor Cost
- Initial setup: 8-12 hours
- Monthly maintenance: 1-2 hours
- Automation development: 20-30 hours

### Total Annual Cost: ~$2,000-$4,000 (labor only)

Compare to:
- Commercial intelligence platforms: $10,000-$50,000/year
- This is public data you're collecting directly

## Implementation Timeline

### Week 1: Database Setup
- [x] Create tables and views
- [ ] Run migration in Supabase
- [ ] Verify schema and indexes

### Week 2: Manual Data Collection
- [ ] Download top 20 SINs from GSA eLibrary
- [ ] Download all major GWAC lists
- [ ] Create CSV files for import
- [ ] Manual data cleaning and normalization

### Week 3: Initial Import
- [ ] Import GSA schedule data
- [ ] Import GWAC holder data
- [ ] Link to existing company records via UEI
- [ ] Verify data quality

### Week 4: Automation
- [ ] Build Python scraper for GSA eLibrary
- [ ] Build web scraper for GWAC sites
- [ ] Create automated import scripts
- [ ] Schedule monthly updates

## Next Steps

1. **Run the migration**:
   ```bash
   # Apply the migration to create tables
   psql $DATABASE_URL -f supabase/migrations/create_gsa_gwac_tables.sql
   ```

2. **Start with manual collection**:
   - Download top 5 SINs as proof of concept
   - Download Alliant 2 and OASIS holder lists
   - Import manually to test schema

3. **Build scrapers**:
   - Use provided Python scripts
   - Test with sample data first
   - Schedule monthly runs

4. **Integrate with UI**:
   - Show contract vehicles on company pages
   - Add filters for GSA/GWAC holders
   - Create market intelligence reports

## Resources

### GSA Resources
- GSA eLibrary: https://www.gsaelibrary.gsa.gov
- GSA Schedules Overview: https://www.gsa.gov/schedules
- GSA GWAC Overview: https://www.gsa.gov/gwacs

### NITAAC Resources
- NITAAC Home: https://nitaac.nih.gov
- Contract Holder Directory: https://nitaac.nih.gov/resources/frequently-asked-questions/there-way-see-which-contract-holders-are-each-gwac

### Other Resources
- NASA SEWP: https://www.sewp.nasa.gov/
- SAM.gov (UEI lookup): https://sam.gov

## Questions?

This is public data that complements your FPDS scraping. The combination gives you:
- **Past Performance**: FPDS contracts (what they won)
- **Current Positioning**: GSA/GWAC holders (who can bid)
- **Future Opportunities**: Expiring contracts (what's coming)

Let me know if you want me to build the scrapers or help with the initial data collection!

