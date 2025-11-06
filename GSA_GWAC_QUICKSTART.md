# GSA/GWAC Data Collection - Quick Start

## Overview

This guide walks you through collecting GSA Multiple Award Schedule and GWAC holder data to supplement your FPDS contract information.

## Why You Want This

You're already scraping FPDS to see what contracts were awarded. This adds:
- **Who can bid**: Companies pre-qualified on GSA schedules and GWACs
- **Pricing data**: GSA schedules include rates per FTE and service pricing
- **Market positioning**: See all companies positioned to compete before awards happen

## Step 1: Create Database Tables (5 minutes)

```bash
# Navigate to your project directory
cd /Users/matthewbaumeister/Documents/PropShop_AI_Website

# Run the migration
# Option 1: Via Supabase CLI
supabase db push

# Option 2: Via psql
psql $DATABASE_URL -f supabase/migrations/create_gsa_gwac_tables.sql

# Option 3: Via Supabase Dashboard
# Copy/paste the SQL from the migration file
```

**What this creates**:
- `gsa_schedule_holders` - Companies on GSA MAS
- `gwac_holders` - Companies holding GWACs
- `gsa_sin_catalog` - Reference table for SINs
- `gwac_catalog` - Reference table for GWACs (pre-seeded)
- `gsa_gwac_scraper_log` - Tracking table

## Step 2: Install Python Dependencies (2 minutes)

```bash
pip install pandas openpyxl pdfplumber requests beautifulsoup4 supabase
```

Or update your requirements.txt:
```txt
pandas>=2.0.0
openpyxl>=3.1.0
pdfplumber>=0.10.0
requests>=2.31.0
beautifulsoup4>=4.12.0
supabase>=2.0.0
```

## Step 3: Manual Data Collection (First Time - 2-3 hours)

Since GSA eLibrary and GWAC sites require interactive downloads, start with manual collection:

### 3A. Download GSA Schedules

1. Visit GSA eLibrary: https://www.gsaelibrary.gsa.gov

2. For each SIN you care about (start with these top 5):
   - **54151S** - IT Professional Services
   - **541519ICAM** - Identity, Credentialing, and Access Management  
   - **541330** - Engineering Services
   - **541611** - Management and Financial Consulting
   - **541715** - Research and Development

3. Search for the SIN code

4. On the SIN details page, click "Download Contractors (Excel)"

5. Save each file as: `GSA_MAS_[SIN]_[DATE].xlsx`
   - Example: `GSA_MAS_54151S_20241105.xlsx`

6. Place files in: `data/gsa_schedules/`

**Result**: 5 Excel files with ~1,000-3,000 companies each

### 3B. Download GWAC Holder Lists

These are typically PDF or web pages. Download and save manually:

#### Alliant 2
- Visit: https://www.gsa.gov/technology/technology-purchasing-programs/governmentwide-acquisition-contracts/alliant-2
- Look for "Contract Holders" link
- Download PDF or copy table to CSV
- Save as: `data/gwac_holders/alliant2_sb.csv` and `alliant2.csv`

#### OASIS
- Visit: https://www.gsa.gov/technology/technology-purchasing-programs/governmentwide-acquisition-contracts/oasis
- Find "Contract Holders" section  
- Download or copy to CSV
- Save as: `data/gwac_holders/oasis_sb.csv` and `oasis.csv`

#### 8(a) STARS III
- Visit: https://www.gsa.gov/technology/technology-purchasing-programs/governmentwide-acquisition-contracts/8a-stars-iii
- Find contract holders list
- Save as: `data/gwac_holders/stars3.csv`

#### NITAAC (CIO-SP3, CIO-SP4)
- Visit: https://nitaac.nih.gov/resources/frequently-asked-questions/there-way-see-which-contract-holders-are-each-gwac
- Use filters to show each GWAC
- Copy to CSV or download
- Save as: `data/gwac_holders/ciosp3_sb.csv`, `ciosp3.csv`, etc.

**CSV Format** (create these manually if needed):
```csv
Company Name,Contract Number,DUNS,UEI,CAGE,Address,City,State,ZIP,Website,Small Business
ABC Corporation,GS-35F-0001A,123456789,ABC123DEF456,12345,123 Main St,Arlington,VA,22201,www.abc.com,Yes
XYZ Inc,GS-35F-0002B,987654321,XYZ789GHI012,67890,456 Oak Ave,Reston,VA,20190,www.xyz.com,Yes
```

**Result**: 5-10 CSV/PDF files with GWAC holders

## Step 4: Parse and Import Data (30 minutes)

### 4A. Parse GSA Schedules

```bash
cd scripts
python3 gsa-schedule-scraper.py
```

This will:
1. Find Excel files in `data/gsa_schedules/`
2. Parse company information
3. Create JSON files for import

Or parse manually with pandas:
```python
import pandas as pd

df = pd.read_excel('data/gsa_schedules/GSA_MAS_54151S_20241105.xlsx')
print(df.head())
print(df.columns)
# Extract needed columns and convert to JSON
```

### 4B. Parse GWAC Holders

```bash
python3 gwac-scraper.py
```

This will:
1. Find CSV/PDF files in `data/gwac_holders/`
2. Parse company information
3. Create JSON files for import

### 4C. Import to Database

```bash
# Set environment variables
export NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Run importer
python3 import-gsa-gwac-data.py
```

This will:
1. Read JSON files from data directories
2. Upsert to `gsa_schedule_holders` and `gwac_holders` tables
3. Log operations in `gsa_gwac_scraper_log`
4. Report statistics

**Expected Results**:
- 5,000-15,000 GSA schedule holders imported
- 500-1,000 GWAC holders imported
- Zero duplicate records (upsert logic)

## Step 5: Link to Existing Data (5 minutes)

### Link to Company Intelligence

```sql
-- Add contract vehicle arrays to company intelligence
ALTER TABLE company_intelligence 
  ADD COLUMN IF NOT EXISTS gsa_schedules TEXT[],
  ADD COLUMN IF NOT EXISTS gwacs TEXT[],
  ADD COLUMN IF NOT EXISTS total_contract_vehicles INTEGER;

-- Populate the data
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
      COALESCE(COUNT(DISTINCT gsh.contract_number), 0) + 
      COALESCE(COUNT(DISTINCT gh.contract_number), 0)
    FROM gsa_schedule_holders gsh
    FULL OUTER JOIN gwac_holders gh 
      ON gsh.vendor_uei = gh.vendor_uei
    WHERE (gsh.vendor_uei = ci.vendor_uei OR gh.vendor_uei = ci.vendor_uei)
      AND (gsh.is_active = true OR gh.is_active = true)
  )
WHERE ci.vendor_uei IS NOT NULL;
```

## Step 6: Verify and Query (10 minutes)

### Check Import Stats

```sql
-- How many GSA schedule holders?
SELECT COUNT(*) as total_gsa_holders,
       COUNT(DISTINCT company_name) as unique_companies,
       COUNT(*) FILTER (WHERE small_business = true) as small_businesses
FROM gsa_schedule_holders
WHERE is_active = true;

-- How many GWAC holders?
SELECT gwac_name, 
       COUNT(*) as holder_count,
       COUNT(*) FILTER (WHERE small_business = true) as sb_count
FROM gwac_holders
WHERE is_active = true
GROUP BY gwac_name
ORDER BY holder_count DESC;

-- Top companies by contract vehicles
SELECT company_name, 
       gsa_schedules_count,
       gwac_count,
       total_vehicles
FROM company_vehicle_summary
ORDER BY total_vehicles DESC
LIMIT 20;
```

### Example Queries

```sql
-- Companies with Alliant 2 but no recent FPDS contracts
SELECT 
  gh.company_name,
  gh.contract_number,
  gh.gwac_name,
  COALESCE(fc.contract_count, 0) as recent_contracts
FROM gwac_holders gh
LEFT JOIN (
  SELECT vendor_name, COUNT(*) as contract_count
  FROM fpds_contracts
  WHERE fiscal_year >= EXTRACT(YEAR FROM CURRENT_DATE) - 2
  GROUP BY vendor_name
) fc ON gh.company_name = fc.vendor_name
WHERE gh.gwac_name LIKE 'Alliant 2%'
  AND gh.is_active = true
  AND COALESCE(fc.contract_count, 0) < 5
ORDER BY recent_contracts;

-- Small businesses on GSA Schedule 70 (IT)
SELECT company_name, 
       contract_number,
       primary_sin,
       company_state,
       website
FROM gsa_schedule_holders
WHERE schedule_number = 'MAS'
  AND '54151S' = ANY(sin_codes)
  AND small_business = true
  AND is_active = true
ORDER BY company_name;

-- Companies on both GSA schedules and GWACs
SELECT 
  cv.company_name,
  cv.vendor_uei,
  cv.gsa_schedules_count,
  cv.gwac_count,
  cv.gsa_schedules,
  cv.gwacs
FROM company_vehicle_summary cv
WHERE cv.gsa_schedules_count > 0 
  AND cv.gwac_count > 0
ORDER BY cv.total_vehicles DESC;
```

## Step 7: Ongoing Updates (Monthly)

Set up a monthly process to refresh the data:

1. **Re-download updated lists** (manual, 1 hour)
   - GSA eLibrary for top SINs
   - GWAC websites for holder updates
   
2. **Run import scripts** (automated, 10 minutes)
   - Parse new files
   - Import to database
   - Upsert will handle updates
   
3. **Review changes** (10 minutes)
   - Check scraper logs
   - Review new holders
   - Identify expired contracts

**Schedule**: First Tuesday of each month
**Effort**: 1-2 hours/month

## Use Cases

### 1. Market Intelligence Dashboard
Show statistics like:
- Total companies on each GWAC
- GSA schedule penetration by state
- Small business representation
- Companies with multiple vehicles

### 2. Company Profiles
On each company detail page, show:
- GSA Schedules held (with SINs)
- GWACs held (with contract numbers)
- Expiration dates
- Vehicle count vs competitors

### 3. Competitive Analysis
- "Who else is on OASIS Small Business?"
- "Which Alliant 2 holders have won the most contracts?"
- "Companies with vehicles but low utilization"

### 4. Business Development
- Find companies with expiring contracts (re-compete opportunities)
- Identify gaps (companies on schedule but not winning)
- Target partners (complementary vehicles)

## Troubleshooting

### Import Errors

**Problem**: "DUNS/UEI not matching existing records"
- **Solution**: Many companies don't include UEI in GSA data yet. That's OK. We match by name as fallback.

**Problem**: "Duplicate key violation"
- **Solution**: Upsert logic should handle this. Check that contract_number + company_name are both present.

**Problem**: "Column not found in Excel"
- **Solution**: GSA eLibrary Excel formats vary by SIN. Adjust parser to match actual columns.

### Data Quality

**Problem**: Company names don't match across sources
- **Solution**: Normalize company names (remove "Inc", "LLC", etc.) or use UEI matching

**Problem**: Missing UEI/DUNS
- **Solution**: Look up in SAM.gov API or manually add

**Problem**: Expired contracts still showing as active
- **Solution**: Check expiration dates and update `is_active` flag

## Cost Analysis

### One-Time Setup
- Database migration: Free
- Initial data collection: 2-3 hours labor
- Script development: Provided (free)
- **Total**: ~$200-400 labor (if outsourced)

### Ongoing Maintenance  
- Monthly updates: 1-2 hours
- **Annual cost**: ~$1,000-2,000 labor

### Data Costs
- GSA eLibrary: **FREE**
- GWAC websites: **FREE**  
- No API keys required
- **Total**: $0/year

Compare to:
- GovWin: $10,000-50,000/year
- Bloomberg Government: $8,000-15,000/year
- Deltek: $5,000-20,000/year

**You're collecting the same source data for free!**

## Next Steps

1. **Week 1**: Run migration, download 3-5 SINs as proof of concept
2. **Week 2**: Import data, verify in database, test queries
3. **Week 3**: Add more SINs and GWACs, build up coverage
4. **Week 4**: Integrate with frontend, show on company pages

## Questions?

- **"How often should I update?"** - Monthly for most SINs, quarterly for GWACs
- **"Which SINs should I prioritize?"** - IT services (54151S) and your target industries
- **"Do I need all SINs?"** - No, start with 5-10 most relevant to your users
- **"Can I automate downloads?"** - Partially. GSA eLibrary needs Selenium for full automation
- **"How do I handle company name variations?"** - UEI matching is best, name normalization as fallback

This public data complements your FPDS scraping perfectly. You now see:
- **Past** (FPDS): What contracts were won
- **Present** (GSA/GWAC): Who is positioned to compete  
- **Future** (Expiration dates): What's coming up for re-compete

