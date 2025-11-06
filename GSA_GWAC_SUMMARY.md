# GSA Schedule & GWAC Data Collection - Implementation Summary

## What This Is

A complete system for downloading, parsing, and storing company lists from:
1. **GSA Multiple Award Schedules (MAS)** - Companies pre-qualified to sell to government
2. **Government-Wide Acquisition Contracts (GWACs)** - Companies holding major contract vehicles

This supplements your existing FPDS contract scraping with pre-qualification data.

## What Was Created

### Database Infrastructure
- **Migration file**: `supabase/migrations/create_gsa_gwac_tables.sql`
  - 5 tables: schedule holders, GWAC holders, SIN catalog, GWAC catalog, scraper log
  - 6 views: active holders, small business filtering, combined vehicles, company summary
  - Pre-seeded with 11 major GWACs

### Python Scripts
1. **`scripts/gsa-schedule-scraper.py`**
   - Downloads/parses GSA eLibrary contractor lists
   - Exports to JSON for import
   - Handles 15+ target SINs

2. **`scripts/gwac-scraper.py`**
   - Parses GWAC holder lists (CSV/PDF)
   - Supports 7+ major GWACs
   - Exports to JSON for import

3. **`scripts/import-gsa-gwac-data.py`**
   - Imports parsed data to Supabase
   - Upsert logic (no duplicates)
   - Links to company intelligence
   - Tracks operations in scraper log

### Documentation
1. **`GSA_GWAC_DATA_GUIDE.md`** (Comprehensive 500+ line guide)
   - Full overview of data sources
   - Database schema documentation
   - Data collection strategy
   - Integration instructions
   - Use cases and queries

2. **`GSA_GWAC_QUICKSTART.md`** (Step-by-step guide)
   - 7 steps from setup to production
   - Practical examples
   - Copy-paste commands
   - Troubleshooting tips

3. **`scripts/README.md`** (Scripts documentation)
   - How to use each script
   - Installation instructions
   - Common workflows
   - Configuration options

### Setup Tools
- **`setup-gsa-gwac.sh`** - Interactive setup script
  - Checks prerequisites
  - Creates directories
  - Installs dependencies
  - Guides through data collection
  - Runs import process

- **`requirements.txt`** - Updated with dependencies
  - pandas, openpyxl, pdfplumber
  - beautifulsoup4, supabase, lxml

## Why This Matters

### Current State (FPDS Only)
You scrape FPDS to see what contracts were **actually awarded**.
- Shows past performance
- Limited to companies that won
- Historical data only

### New State (FPDS + GSA/GWAC)
Now you also see who **can bid** on contracts.
- Pre-qualified vendor lists
- Companies positioned to compete
- Forward-looking intelligence

### Combined Power
- **Past**: FPDS contracts (what happened)
- **Present**: GSA/GWAC holders (who can bid)
- **Future**: Expiring contracts (what's coming)

## Data Coverage

### GSA Schedules
- **Source**: GSA eLibrary (https://www.gsaelibrary.gsa.gov)
- **Companies**: 20,000+ across all schedules
- **Data includes**: 
  - Contract numbers and expiration dates
  - Special Item Numbers (SINs)
  - Pricing per FTE and labor categories
  - Small business certifications
  - Contact information

### GWACs
- **Sources**: GSA, NITAAC, NASA websites
- **Companies**: 1,000+ holders across major GWACs
- **Major GWACs covered**:
  - Alliant 2 (IT - Small Business & Unrestricted)
  - OASIS (Professional Services - SB & Unrestricted)
  - 8(a) STARS III (IT for 8(a) companies)
  - Polaris (Next-gen IT)
  - CIO-SP3/SP4 (NIH IT services)
  - SEWP (NASA IT products)

## Cost Analysis

### Your Cost
- Database: $0 (existing Supabase)
- Data collection: $0 (all public sources)
- Scripts: $0 (provided)
- Labor (initial): 2-3 hours
- Labor (monthly): 1-2 hours
- **Total annual: ~$1,000-2,000** (labor only)

### Commercial Alternatives
- GovWin: $10,000-50,000/year
- Bloomberg Government: $8,000-15,000/year
- Deltek: $5,000-20,000/year
- **You're collecting the same data for free!**

## Implementation Path

### Quick Start (1 week)
**Day 1**: Database setup
- Run migration
- Verify tables created

**Day 2-3**: Manual data collection
- Download 5 popular SINs from GSA eLibrary
- Download 3-5 GWAC holder lists
- Create CSV files

**Day 4**: Import data
- Run parsers
- Import to database
- Verify ~5,000-10,000 records

**Day 5**: Test queries
- Run sample queries
- Link to company intelligence
- Verify data quality

### Full Implementation (1 month)
**Week 1**: Same as quick start

**Week 2**: Expand coverage
- Add more SINs (10-15 total)
- Add more GWACs (all major ones)
- Refine parsing logic

**Week 3**: Integration
- Link to company profiles
- Add to frontend
- Build queries and views

**Week 4**: Automation
- Set up monthly update process
- Document workflows
- Train team

## Key Features

### Smart Matching
- Links via UEI/DUNS to existing company records
- Handles company name variations
- No duplicates (upsert logic)

### Comprehensive Coverage
- 15+ target SINs for GSA schedules
- 11+ major GWACs pre-configured
- Expandable to any SIN or GWAC

### Full Tracking
- Scraper logs track all operations
- Records inserted/updated/errors
- Timestamp tracking
- File tracking

### Ready-to-Use Views
- Active holders only
- Small business filtering
- Combined vehicles view
- Company summary with counts

## Use Cases

### 1. Market Intelligence
```sql
-- Companies with multiple contract vehicles
SELECT * FROM company_vehicle_summary
WHERE total_vehicles >= 3
ORDER BY total_vehicles DESC;
```

### 2. Competitive Analysis
```sql
-- All Alliant 2 Small Business holders
SELECT company_name, contract_number, company_state
FROM gwac_holders
WHERE gwac_name = 'Alliant 2 Small Business'
  AND is_active = true;
```

### 3. Business Development
```sql
-- Companies with vehicles but low FPDS wins
SELECT cv.company_name, cv.total_vehicles, 
       COALESCE(fc.contracts, 0) as recent_wins
FROM company_vehicle_summary cv
LEFT JOIN (
  SELECT vendor_name, COUNT(*) as contracts
  FROM fpds_contracts
  WHERE fiscal_year >= 2023
  GROUP BY vendor_name
) fc ON cv.company_name = fc.vendor_name
WHERE cv.total_vehicles >= 2
  AND COALESCE(fc.contracts, 0) < 10
ORDER BY cv.total_vehicles DESC;
```

### 4. Company Profiles
Show on each company page:
- GSA Schedules held (with SINs)
- GWACs held (with contract numbers)
- Contract expiration dates
- Comparison to competitors

## Data Quality

### Validation
- UEI matching to existing records
- Contract number format validation
- Date range checks
- Duplicate prevention

### Maintenance
- Monthly updates recommended
- Mark expired contracts inactive
- Add new holders
- Update pricing data

### Accuracy
- Source: Official government websites
- Same data federal buyers use
- Updated regularly at source
- No third-party intermediaries

## Integration Points

### With Company Intelligence
```sql
-- Add fields to company_intelligence
ALTER TABLE company_intelligence 
  ADD COLUMN gsa_schedules TEXT[],
  ADD COLUMN gwacs TEXT[];

-- Populate via UEI matching
UPDATE company_intelligence ci
SET gsa_schedules = (...), gwacs = (...);
```

### With FPDS Contracts
```sql
-- Join to see vehicle holders and their wins
SELECT gsh.company_name, gsh.schedule_number,
       COUNT(fc.id) as contracts,
       SUM(fc.dollars_obligated) as total_value
FROM gsa_schedule_holders gsh
LEFT JOIN fpds_contracts fc 
  ON gsh.vendor_uei = fc.vendor_uei
GROUP BY gsh.company_name, gsh.schedule_number;
```

### With Frontend
- Display vehicles on company cards
- Filter by contract vehicle type
- Show expiration alerts
- Market positioning metrics

## Next Actions

### Immediate (Today)
1. Review the documentation:
   - Read `GSA_GWAC_QUICKSTART.md`
   - Scan `GSA_GWAC_DATA_GUIDE.md`

2. Run the migration:
   ```bash
   psql $DATABASE_URL -f supabase/migrations/create_gsa_gwac_tables.sql
   ```

### This Week
3. Collect initial data:
   - Download 3-5 SINs from GSA eLibrary
   - Download 2-3 GWAC lists
   - Run: `./setup-gsa-gwac.sh` (guides you through process)

4. Import and verify:
   ```bash
   python3 scripts/gsa-schedule-scraper.py
   python3 scripts/gwac-scraper.py
   python3 scripts/import-gsa-gwac-data.py
   ```

### This Month
5. Expand coverage to all major SINs and GWACs
6. Integrate with company intelligence table
7. Add to frontend UI
8. Set up monthly update process

## Support Resources

### Documentation
- **Overview**: `GSA_GWAC_DATA_GUIDE.md` (comprehensive)
- **Quick start**: `GSA_GWAC_QUICKSTART.md` (step-by-step)
- **Scripts**: `scripts/README.md` (technical details)
- **This file**: `GSA_GWAC_SUMMARY.md` (executive overview)

### Data Sources
- GSA eLibrary: https://www.gsaelibrary.gsa.gov
- GSA GWACs: https://www.gsa.gov/gwacs
- NITAAC: https://nitaac.nih.gov

### Files Created
```
supabase/migrations/
  └── create_gsa_gwac_tables.sql      # Database schema

scripts/
  ├── gsa-schedule-scraper.py         # GSA scraper
  ├── gwac-scraper.py                 # GWAC scraper
  ├── import-gsa-gwac-data.py         # Database importer
  └── README.md                        # Scripts documentation

Documentation/
  ├── GSA_GWAC_DATA_GUIDE.md          # Comprehensive guide
  ├── GSA_GWAC_QUICKSTART.md          # Quick start guide
  └── GSA_GWAC_SUMMARY.md             # This file

Tools/
  ├── setup-gsa-gwac.sh               # Interactive setup
  └── requirements.txt                # Updated dependencies
```

## Questions & Answers

**Q: Is this data actually free?**
A: Yes! It's all from public government websites. No API keys, no subscriptions.

**Q: How often should I update?**
A: Monthly for GSA schedules, quarterly for GWACs.

**Q: Can I automate the downloads?**
A: Partially. GSA eLibrary would need Selenium for full automation. Start with manual + automation of parsing/import.

**Q: Which SINs should I prioritize?**
A: Start with IT services (54151S), engineering (541330), and R&D (541715). Add others based on your users' interests.

**Q: Will this link to my existing company data?**
A: Yes! It links via UEI/DUNS to your company_intelligence table.

**Q: What about data quality?**
A: This is the same data federal buyers use. It's authoritative and updated regularly.

## Bottom Line

You now have a complete system to collect 20,000+ pre-qualified government vendors at zero cost. This complements your FPDS contract scraping and gives you a comprehensive view of the government contracting market.

The entire setup takes 1 week, costs nothing but labor, and gives you data that commercial providers charge $10,000-50,000/year for.

**Ready to start?** Run: `./setup-gsa-gwac.sh`

