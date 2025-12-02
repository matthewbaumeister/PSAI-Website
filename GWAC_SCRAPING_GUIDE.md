# GWAC Historical Scraping Guide

## Overview

This system scrapes **historical GWAC (Government-Wide Acquisition Contract)** data from public sources to give you competitive intelligence on:
- Which companies hold GWAC positions
- Historical spending by contractor
- Task order activity over time
- Multi-GWAC holders (strongest players)

## Why This Matters

**GWAC data is NOT just FPDS records.** GWACs are special because:

1. **Pre-vetted contractors** - Holding a GWAC = already passed rigorous evaluation
2. **Fast-track task orders** - No new competition required for orders
3. **Multi-year visibility** - See who's winning work consistently
4. **Small business tracking** - Identify emerging competitors
5. **Cross-GWAC analysis** - Companies on multiple GWACs are major players

## Data Sources

### 1. **USAspending.gov API** (Primary - Historical)
- **Coverage**: 2007-present
- **Data**: Every task order, modification, and obligation
- **Rate**: Free, no auth required
- **Historical**: Complete records back to 2007
- **Quality**: Official government data

### 2. **FPDS Atom Feeds** (Detailed - Historical)
- **Coverage**: 2004-present
- **Data**: Detailed contract metadata
- **Rate**: Slower (10 records per request)
- **Historical**: Complete archive
- **Quality**: Most detailed source

### 3. **GSA FAS GWAC Dashboard** (Quarterly - Limited Historical)
- **Coverage**: Last 3-5 years
- **Data**: Quarterly spending aggregates
- **Rate**: Tableau dashboard (requires scraping)
- **Historical**: Limited
- **Quality**: Summary level only

### 4. **NITAAC/GSA Holder Lists** (Current - No Historical)
- **Coverage**: Current contractors only
- **Data**: Who holds GWAC positions now
- **Rate**: PDFs/web pages
- **Historical**: No time-series
- **Quality**: Current snapshot

## Architecture

```
┌─────────────────────────────────────────────────────┐
│           GWAC Data Collection System               │
└─────────────────────────────────────────────────────┘

1. HISTORICAL SCRAPING (Once/Quarterly)
   ├── Python: gwac-historical-scraper.py
   ├── Source: USAspending.gov API
   ├── Output: CSV → gwac_spending_history table
   └── Runtime: 10-15 minutes for full history

2. HOLDER LISTS (Manual + Scraping)
   ├── Python: gwac-scraper.py (existing)
   ├── Source: GSA PDFs, NITAAC web pages
   ├── Output: JSON → gwac_holders table
   └── Frequency: Quarterly or when GWACs updated

3. AGGREGATION (Automatic)
   ├── SQL Function: refresh_gwac_contractor_summaries()
   ├── Creates: gwac_contractor_summary table
   └── Shows: Multi-GWAC holders, top spenders, trends
```

## Setup Instructions

### 1. Run Database Migration

```bash
# In Supabase SQL Editor, run:
supabase/migrations/create_gwac_tracking_tables.sql
```

This creates:
- `gwac_programs` - Master GWAC list (8 major GWACs pre-loaded)
- `gwac_holders` - Current/historical GWAC contractors
- `gwac_spending_history` - Every task order (USAspending data)
- `gwac_contractor_summary` - Aggregated contractor metrics

### 2. Install Python Dependencies

```bash
pip install requests beautifulsoup4 lxml
```

### 3. Run Historical Scraper

```bash
python scripts/gwac-historical-scraper.py
```

**Choose scrape mode:**
1. **Full historical** (2007-present) - Takes 10-15 minutes
2. **Last 5 years** - Takes 3-5 minutes (recommended first run)
3. **Last year** - Takes 1-2 minutes (quick test)
4. **Custom date range**

**Output:**
- `data/gwac_historical/gwac_historical_awards_YYYYMMDD.csv`
- `data/gwac_historical/gwac_contractor_summary_YYYYMMDD.json`

### 4. Import to Supabase

**Option A: Supabase Table Editor**
1. Open Supabase → Table Editor → `gwac_spending_history`
2. Click "Import data via CSV"
3. Upload `gwac_historical_awards_YYYYMMDD.csv`
4. Map columns (auto-detected)
5. Import

**Option B: SQL COPY (faster for large files)**
```sql
COPY gwac_spending_history (
  gwac_key, gwac_name, gwac_parent_contract,
  contractor_name, contractor_uei, contractor_duns,
  award_id, award_amount, total_outlayed,
  award_date, start_date, end_date,
  awarding_agency, awarding_sub_agency,
  contractor_city, contractor_state,
  data_source, scraped_at
)
FROM '/path/to/gwac_historical_awards_YYYYMMDD.csv'
DELIMITER ',' CSV HEADER;
```

### 5. Refresh Aggregated Summaries

```sql
-- Run in Supabase SQL Editor
SELECT refresh_gwac_contractor_summaries();

-- Check results
SELECT * FROM gwac_contractor_summary
ORDER BY total_award_value DESC
LIMIT 20;
```

## What You Get

### 1. Contractor GWAC Profiles

```sql
-- See all GWACs a company holds
SELECT * FROM gwac_contractor_summary
WHERE contractor_name ILIKE '%Booz Allen%';

-- Result:
-- gwac_count: 4
-- gwac_list: ['Alliant 2', 'OASIS', 'CIO-SP3', '8(a) STARS III']
-- total_awards: 1,247
-- total_award_value: $2,456,789,012
-- earliest_award_date: 2014-03-15
-- latest_award_date: 2024-11-01
```

### 2. Multi-GWAC Holders (Strongest Players)

```sql
-- Companies on 3+ GWACs = major players
SELECT 
  contractor_name,
  gwac_count,
  total_award_value,
  gwac_list
FROM gwac_contractor_summary
WHERE gwac_count >= 3
ORDER BY total_award_value DESC
LIMIT 25;
```

### 3. Recent Activity

```sql
-- Who's winning GWAC work right now?
SELECT * FROM recent_gwac_activity
WHERE award_date >= NOW() - INTERVAL '30 days'
ORDER BY award_amount DESC;
```

### 4. Historical Trends

```sql
-- Spending trends by contractor
SELECT 
  DATE_TRUNC('quarter', award_date) as quarter,
  contractor_name,
  COUNT(*) as task_orders,
  SUM(award_amount) as total_value
FROM gwac_spending_history
WHERE contractor_uei = 'ABC123XYZ456'
  AND award_date >= NOW() - INTERVAL '3 years'
GROUP BY quarter, contractor_name
ORDER BY quarter DESC;
```

### 5. Competitive Intelligence

```sql
-- Who are our competitors on shared GWACs?
WITH my_gwacs AS (
  SELECT gwac_key FROM gwac_holders
  WHERE company_name = 'Your Company Name'
)
SELECT DISTINCT
  gh.company_name,
  gh.gwac_name,
  gcs.total_awards,
  gcs.total_award_value
FROM gwac_holders gh
INNER JOIN my_gwacs mg ON gh.gwac_key = mg.gwac_key
LEFT JOIN gwac_contractor_summary gcs ON gh.vendor_uei = gcs.contractor_uei
WHERE gh.company_name != 'Your Company Name'
  AND gh.holder_status = 'active'
ORDER BY gcs.total_award_value DESC;
```

## Scraping Schedule

### Initial Setup
1. **Week 1**: Run full historical scrape (2007-present)
2. **Week 1**: Manually add current holder lists
3. **Week 1**: Import and verify data

### Ongoing Maintenance
1. **Monthly**: Scrape last 90 days (captures new task orders)
2. **Quarterly**: Scrape last 6 months (catches modifications)
3. **Annually**: Full historical refresh (data quality check)

### Automation Options

**Option 1: Cron Job**
```bash
# Add to crontab
0 2 1 * * /path/to/venv/bin/python /path/to/gwac-historical-scraper.py --mode last-quarter
```

**Option 2: GitHub Actions**
```yaml
# .github/workflows/gwac-scraper.yml
name: GWAC Monthly Scrape
on:
  schedule:
    - cron: '0 2 1 * *'  # First of month, 2 AM
  workflow_dispatch:

jobs:
  scrape:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: pip install requests beautifulsoup4
      - run: python scripts/gwac-historical-scraper.py --mode last-quarter
      - run: python scripts/upload-to-supabase.py
```

**Option 3: Vercel Cron** (like your SBIR scraper)
- Create API route: `/api/cron/gwac-scraper`
- Add to `vercel.json` crons
- Trigger monthly

## GWACs Tracked

The system tracks these major GWACs:

| GWAC | Type | Agency | Status | Start Date |
|------|------|--------|--------|------------|
| Alliant 2 | IT | GSA | Active | 2017 |
| Alliant 2 SB | IT | GSA | Active | 2018 |
| 8(a) STARS III | IT | GSA | Active | 2021 |
| OASIS | Prof Services | GSA | Active | 2014 |
| OASIS SB | Prof Services | GSA | Active | 2014 |
| Polaris | IT | GSA | Active | 2023 |
| CIO-SP3 | IT | NIH | Active | 2012 |
| CIO-SP4 | IT | NIH | Active | 2022 |

**To add more GWACs:**
```sql
INSERT INTO gwac_programs (
  gwac_key, gwac_name, parent_contract_id,
  managing_agency, gwac_type, award_date
) VALUES (
  'sewp_v', 'SEWP V', 'NNG15SD01B',
  'NASA', 'IT Products', '2015-07-01'
);
```

Then update `GWAC_CONTRACTS` dict in `gwac-historical-scraper.py`.

## API Rate Limits

### USAspending.gov
- **Rate**: No official limit
- **Recommended**: 1 request/0.5 seconds (built into scraper)
- **Timeout**: 30 seconds
- **Retry**: 3 attempts with backoff

### FPDS
- **Rate**: No official limit
- **Recommended**: 1 request/second (built into scraper)
- **Pagination**: 10 records max per page
- **Note**: Slower than USAspending

## Troubleshooting

### "No data returned"
- Check if GWAC parent contract ID is correct
- USAspending might not have task orders for very new GWACs
- Try FPDS as alternative source

### "Import failed: column mismatch"
- CSV columns don't match table schema
- Update scraper or add columns to table manually

### "Rate limited"
- USAspending rarely rate limits
- If it happens, increase sleep time in scraper
- Try smaller date ranges

### "Duplicate key error"
- Scraper already imported this data
- Use `ON CONFLICT DO UPDATE` instead of insert
- Or delete existing records first

## Advanced: Link to Company Intelligence

Once imported, link GWAC data to your existing company records:

```sql
-- Link by UEI
UPDATE gwac_spending_history gs
SET company_intelligence_id = ci.id
FROM company_intelligence ci
WHERE gs.contractor_uei = ci.vendor_uei
  AND gs.company_intelligence_id IS NULL;

-- Link by name matching (fuzzy)
UPDATE gwac_spending_history gs
SET company_intelligence_id = ci.id
FROM company_intelligence ci
WHERE similarity(gs.contractor_name, ci.company_name) > 0.85
  AND gs.company_intelligence_id IS NULL;
```

## ROI: Why This Data is Valuable

1. **Sales Intelligence**
   - See which companies are actively winning GWAC work
   - Identify hot GWACs with high task order activity
   - Target agencies that frequently use specific GWACs

2. **Competitive Analysis**
   - Benchmark against competitors on shared GWACs
   - Identify companies winning on multiple vehicles
   - Track competitor growth/decline over time

3. **Teaming Intelligence**
   - Find successful GWAC contractors for partnerships
   - See who's winning the types of work you do
   - Identify complementary capabilities

4. **Business Development**
   - Qualify leads based on GWAC participation
   - Prioritize outreach to multi-GWAC holders
   - Understand customer's preferred contract vehicles

5. **Market Analysis**
   - Track GWAC utilization trends
   - Identify growing vs declining GWACs
   - See agency preferences for IT vs services

## Next Steps

1. ✅ Run database migration
2. ✅ Install Python dependencies
3. ✅ Run historical scraper (start with "Last year" mode)
4. ✅ Import CSV to Supabase
5. ✅ Run aggregation function
6. ✅ Query `gwac_contractor_summary` to see results
7. ⬜ Set up monthly cron job
8. ⬜ Add GWAC data to company profiles in UI
9. ⬜ Build GWAC analytics dashboard

## Questions?

- **How often to refresh?** Monthly for task orders, quarterly for holder lists
- **How far back?** Start with 5 years, then full history if needed
- **Cost?** Free - all public APIs, no authentication required
- **Legal?** Yes - all public government data, proper attribution provided

