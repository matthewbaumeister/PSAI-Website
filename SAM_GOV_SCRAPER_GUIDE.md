# SAM.gov Opportunities Scraper Guide

Complete guide for scraping SAM.gov contract opportunities with full details and attachments.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Two Scraping Modes](#two-scraping-modes)
3. [Usage Examples](#usage-examples)
4. [Rate Limits](#rate-limits)
5. [Data Quality](#data-quality)
6. [Linking to FPDS](#linking-to-fpds)

---

## Quick Start

```bash
# Last 7 days with FULL details (recommended for testing)
npx tsx scrape-sam-gov-opportunities.ts --days=7 --full-details

# Last 30 days in fast mode
npx tsx scrape-sam-gov-opportunities.ts --days=30

# Specific date range with full details
npx tsx scrape-sam-gov-opportunities.ts --from=2024-01-01 --to=2024-01-31 --full-details
```

---

## Two Scraping Modes

### ⚡ Fast Mode (Default)

**What it does:**
- Uses only the search API
- Gets basic info for each opportunity
- Very fast (~2 seconds per 100 opportunities)

**What you get:**
- Title, dates, agency, NAICS
- Truncated descriptions (may be API links instead of text)
- Basic attachments list
- UI links to SAM.gov pages

**When to use:**
- Bulk scraping large date ranges
- Just need basic metadata
- Want to stay within rate limits

**Example:**
```bash
# Fast: scrape entire year in ~10 minutes
npx tsx scrape-sam-gov-opportunities.ts --from=2024-01-01 --to=2024-12-31
```

---

### 🔍 Full Details Mode (`--full-details`)

**What it does:**
- Fetches search results PLUS individual details for each opportunity
- Makes additional API call per opportunity
- Slower but much more complete data

**What you get:**
- ✅ **Full description text** (complete HTML/markdown)
- ✅ **All attachments** with download URLs
- ✅ **Complete requirements** and evaluation criteria
- ✅ **Primary AND secondary contacts**
- ✅ **Amendment history**
- ✅ **All related documents**

**When to use:**
- Important date ranges (recent opportunities you want full info on)
- Need complete description text for AI/analysis
- Need all attachment links
- Want complete contact information

**Example:**
```bash
# Full details: scrape last week with all information
npx tsx scrape-sam-gov-opportunities.ts --days=7 --full-details
```

---

## Usage Examples

### Daily Scraping (Recommended)

Run this every day to keep your database updated:

```bash
# Get yesterday's opportunities with full details
npx tsx scrape-sam-gov-opportunities.ts --days=1 --full-details
```

Set up a cron job:
```bash
# Add to crontab (run at 6 AM daily)
0 6 * * * cd /path/to/PropShop_AI_Website && npx tsx scrape-sam-gov-opportunities.ts --days=1 --full-details
```

---

### Historical Backfill

Use the weekly script to backfill historical data without hitting rate limits:

```bash
# Scrape 2024 in weekly chunks (safe mode)
./run-sam-gov-weekly.sh 2024-01-01 2024-12-31

# Scrape specific month
npx tsx scrape-sam-gov-opportunities.ts --from=2024-06-01 --to=2024-06-30
```

**Note:** Large date ranges use fast mode by default. Add `--full-details` only for small, important ranges.

---

### Testing & Validation

```bash
# Test with 3 days (fast mode)
npx tsx scrape-sam-gov-opportunities.ts --days=3

# Test with 3 days (full details mode)
npx tsx scrape-sam-gov-opportunities.ts --days=3 --full-details
```

---

## Rate Limits

### SAM.gov API Limits

- **Daily Quota:** ~1,000 requests per day per API key
- **Resets:** Midnight UTC every day
- **Search calls:** 1 request per 100 opportunities
- **Details calls:** 1 request per opportunity

### Calculating API Usage

**Fast Mode:**
```
100 opportunities = 1 search call
1,000 opportunities = 10 search calls
10,000 opportunities = 100 search calls ✅ Within daily limit
```

**Full Details Mode:**
```
100 opportunities = 1 search call + 100 detail calls = 101 total
1,000 opportunities = 10 search calls + 1,000 detail calls = 1,010 total ⚠️ OVER limit!
```

### Staying Within Limits

**Strategy 1: Daily incremental scraping**
```bash
# Every day, scrape yesterday with full details (~50-200 opportunities)
npx tsx scrape-sam-gov-opportunities.ts --days=1 --full-details
```

**Strategy 2: Weekly chunks**
```bash
# Use the weekly script for large date ranges
./run-sam-gov-weekly.sh 2024-01-01 2024-12-31
```

**Strategy 3: Fast mode for historical, full mode for recent**
```bash
# Historical data (fast)
npx tsx scrape-sam-gov-opportunities.ts --from=2020-01-01 --to=2023-12-31

# Recent data (full details)
npx tsx scrape-sam-gov-opportunities.ts --days=30 --full-details
```

---

## Data Quality

### Check What You Have

Run in Supabase SQL Editor:

```sql
-- Overall stats
SELECT 
  COUNT(*) as total_opportunities,
  COUNT(DISTINCT notice_id) as unique_notices,
  COUNT(*) FILTER (WHERE description IS NOT NULL AND description NOT LIKE 'https://%') as with_real_descriptions,
  COUNT(*) FILTER (WHERE data_source = 'sam.gov-api-full') as fetched_full_details,
  MIN(posted_date) as earliest,
  MAX(posted_date) as latest
FROM sam_gov_opportunities;
```

### Upgrading Existing Records to Full Details

Already have data in fast mode? Upgrade specific records:

```bash
# Re-scrape important date range with full details
npx tsx scrape-sam-gov-opportunities.ts --from=2025-10-01 --to=2025-11-03 --full-details
```

The scraper will update existing records with full details (upsert).

### Find Records Missing Descriptions

```sql
-- Find opportunities with broken/missing descriptions
SELECT 
  notice_id,
  title,
  posted_date,
  description,
  ui_link
FROM sam_gov_opportunities
WHERE description IS NULL 
   OR description LIKE 'https://api.sam.gov%'
ORDER BY posted_date DESC
LIMIT 20;
```

---

## Linking to FPDS

After scraping SAM.gov opportunities, link them to FPDS awarded contracts:

### Run Linking Functions

```sql
-- Link opportunities to contracts by solicitation number
SELECT link_sam_to_fpds();

-- Update FPDS contracts with SAM.gov URLs
SELECT update_fpds_with_sam_links();
```

### Check Linking Results

```sql
-- See link statistics
SELECT 
  COUNT(*) as total_opportunities,
  COUNT(fpds_contract_id) as linked_to_awards,
  ROUND(100.0 * COUNT(fpds_contract_id) / COUNT(*), 1) as link_percentage
FROM sam_gov_opportunities;

-- See actual linked records
SELECT 
  s.title as opportunity_title,
  s.solicitation_number,
  s.posted_date,
  s.response_deadline,
  f.vendor_name as winner,
  f.base_and_exercised_options_value as contract_value,
  s.ui_link as opportunity_link
FROM sam_gov_opportunities s
INNER JOIN fpds_contracts f ON s.solicitation_number = f.solicitation_id
LIMIT 20;
```

---

## Troubleshooting

### Error: "Missing Supabase credentials"

Make sure `.env` file has:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SAM_GOV_API_KEY=SAM-your-api-key
```

### Error: "You have exceeded your quota"

Your daily API limit is reached. Solutions:
1. Wait until midnight UTC (quota resets)
2. Use fast mode instead of full details
3. Scrape smaller date ranges

### Descriptions are still API links

You're looking at old data scraped in fast mode. Re-scrape with `--full-details`:
```bash
npx tsx scrape-sam-gov-opportunities.ts --from=2025-10-31 --to=2025-11-03 --full-details
```

---

## Best Practices

1. **Daily incremental scraping** (full details mode)
   - Keeps your data fresh
   - Stays within rate limits
   - Gets complete information

2. **Historical backfill** (fast mode first, then upgrade important dates)
   - Fast mode for bulk coverage
   - Full details for high-value opportunities

3. **Run linking daily**
   - After scraping, always run linking functions
   - Connects new opportunities to awarded contracts

4. **Monitor data quality**
   - Check `data_source` column (`sam.gov-api-full` vs `sam.gov-api-search`)
   - Verify descriptions are real text, not links

---

## Summary

| Mode | Speed | Description Quality | Attachments | API Calls | Best For |
|------|-------|-------------------|-------------|-----------|----------|
| **Fast** | ⚡⚡⚡ | Basic (may be links) | Basic list | 1 per 100 opps | Historical backfill |
| **Full Details** | 🐢 | Complete HTML/text | All with URLs | 1 per opp | Recent/important data |

**Recommended Strategy:**
- **Daily:** `--days=1 --full-details` (complete recent data)
- **Historical:** `--from=YYYY-MM-DD --to=YYYY-MM-DD` fast mode (broad coverage)
- **Linking:** Run after every scrape to connect to FPDS contracts

