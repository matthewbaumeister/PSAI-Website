# GSA Pricing Data Collection - Complete Guide

## Overview

This system downloads, parses, and stores **labor category pricing data** from individual GSA contractor price lists. Each contractor on GSA schedules has their own price list Excel file containing:

- Labor categories (job titles/roles)
- Hourly rates (ceiling prices)
- Education requirements
- Experience requirements
- Security clearance levels
- Additional qualifications

## What You Get

### Before: Contractor Contact Info
The GSA contractor scraper gives you:
- Company names and contact info
- Which SINs they're on
- Contract numbers and dates
- Links to their price lists

### Now: Actual Pricing Data
The pricing scraper gives you:
- Individual labor categories (e.g., "Senior Software Engineer")
- Hourly rates for each category
- Qualifications (education, experience, clearance)
- Ability to compare rates across contractors

## Database Tables

### `gsa_price_lists`
Tracks price list files and parsing status
- Links to contractors
- Download/parse status
- File locations
- Labor category counts

### `gsa_labor_categories`
Individual labor categories with rates
- Labor category name
- Hourly/daily/monthly/yearly rates
- Education level
- Years of experience
- Security clearance
- Full raw data from source

### `gsa_pricing_scraper_log`
Tracks scraping runs and statistics

### `gsa_contractors_with_pricing` (VIEW)
Easy view showing contractors with their pricing ranges

## Setup Instructions

### 1. Create Database Tables

Run this SQL in your **Supabase SQL Editor**:

```sql
-- Copy and paste contents of:
supabase/migrations/create_gsa_pricing_tables.sql
```

Or run manually:
```bash
# View the SQL file
cat supabase/migrations/create_gsa_pricing_tables.sql

# Then copy/paste into Supabase SQL Editor
```

### 2. Verify Environment Variables

Make sure these are set:
```bash
export NEXT_PUBLIC_SUPABASE_URL="https://reprsoqodhmpdoiajhst.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your_key_here"
```

### 3. Test the Setup

```bash
python3 scripts/test-gsa-pricing-pipeline.py
```

Should show:
```
✓ PASS - Database Connection
✓ PASS - Tables Exist
✓ PASS - Download Single
✓ PASS - Parse Single
✓ PASS - Import Single
```

## Running the Complete Pipeline

### Option 1: Single Command (Recommended)

```bash
./scripts/run-complete-gsa-pricing-collection.sh
```

This will:
1. Download ~3,000 price list Excel files (1-2 hours)
2. Parse labor categories from each file (30-60 minutes)
3. Import all data to Supabase (10-20 minutes)

**Total time: 2-4 hours**

### Option 2: Step by Step

**Step 1: Download Price Lists**
```bash
python3 scripts/gsa-pricing-downloader.py
```
- Downloads individual price list Excel files
- Saves to `data/gsa_pricing/`
- Tracks progress in `gsa_price_lists` table
- Can resume if interrupted

**Step 2: Parse Price Lists**
```bash
python3 scripts/gsa-pricing-parser.py
```
- Parses Excel files for labor categories
- Extracts rates, qualifications, etc.
- Saves to `data/gsa_pricing/parsed/` as JSON
- Updates `gsa_price_lists.parse_status`

**Step 3: Import to Database**
```bash
python3 scripts/gsa-pricing-importer.py
```
- Loads parsed JSON into database
- Inserts into `gsa_labor_categories` table
- Handles duplicates (upsert logic)

### Option 3: Test Mode (Recommended First Run)

To test with just 10 files:
```bash
./scripts/run-complete-gsa-pricing-collection.sh
# Answer 'y' when asked about test mode
```

## Verify the Data

After import completes, run this SQL in Supabase:

```sql
-- Overall Statistics
SELECT 
  COUNT(*) as total_labor_categories,
  COUNT(DISTINCT contractor_id) as contractors_with_pricing,
  MIN(hourly_rate) as min_hourly_rate,
  MAX(hourly_rate) as max_hourly_rate,
  AVG(hourly_rate)::numeric(10,2) as avg_hourly_rate,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY hourly_rate) as median_rate
FROM gsa_labor_categories;

-- Top 10 Most Expensive Labor Categories
SELECT 
  labor_category,
  hourly_rate,
  education_level,
  years_experience,
  security_clearance,
  contract_number
FROM gsa_labor_categories
WHERE hourly_rate IS NOT NULL
ORDER BY hourly_rate DESC
LIMIT 10;

-- Most Common Labor Categories
SELECT 
  labor_category,
  COUNT(*) as contractor_count,
  MIN(hourly_rate) as min_rate,
  MAX(hourly_rate) as max_rate,
  AVG(hourly_rate)::numeric(10,2) as avg_rate
FROM gsa_labor_categories
GROUP BY labor_category
ORDER BY contractor_count DESC
LIMIT 20;

-- Pricing by SIN
SELECT 
  c.primary_sin,
  COUNT(DISTINCT lc.contractor_id) as contractors_with_pricing,
  COUNT(*) as total_labor_categories,
  MIN(lc.hourly_rate) as min_rate,
  MAX(lc.hourly_rate) as max_rate,
  AVG(lc.hourly_rate)::numeric(10,2) as avg_rate
FROM gsa_labor_categories lc
JOIN gsa_schedule_holders c ON lc.contractor_id = c.id
WHERE lc.hourly_rate IS NOT NULL
GROUP BY c.primary_sin
ORDER BY contractors_with_pricing DESC
LIMIT 20;

-- Contractors with Most Labor Categories
SELECT 
  c.company_name,
  c.contract_number,
  c.primary_sin,
  COUNT(*) as labor_category_count,
  MIN(lc.hourly_rate) as min_rate,
  MAX(lc.hourly_rate) as max_rate
FROM gsa_labor_categories lc
JOIN gsa_schedule_holders c ON lc.contractor_id = c.id
GROUP BY c.company_name, c.contract_number, c.primary_sin
ORDER BY labor_category_count DESC
LIMIT 10;
```

## Expected Results

Based on ~14,000 contractors with ~23% having price lists:

- **Contractors with pricing**: ~3,000-3,500
- **Total labor categories**: ~100,000-200,000
- **Average categories per contractor**: 30-60
- **Hourly rate range**: $10-$400+
- **Average hourly rate**: $75-$125

## Common Issues

### Issue: "Tables do not exist"
**Solution**: Run the SQL migration file first
```bash
# View the SQL
cat supabase/migrations/create_gsa_pricing_tables.sql
# Copy/paste into Supabase SQL Editor
```

### Issue: "No contractors with price list URLs found"
**Solution**: Make sure you've run the main GSA contractor scraper first
```bash
./scripts/run-complete-gsa-collection.sh
```

### Issue: Download failures (404 errors)
**Solution**: This is normal - not all price list URLs are valid. The scraper will skip these and continue.

### Issue: Parse failures
**Solution**: Some Excel files have unusual formats. Parser skips files it can't parse. Check logs for details.

### Issue: Script interrupted
**Solution**: All scripts can be safely resumed - they skip already processed files

## File Structure

```
data/
  gsa_pricing/
    *.xlsx                          # Downloaded price list files
    parsed/
      *_parsed.json                 # Parsed labor categories

scripts/
  gsa-pricing-downloader.py         # Download price lists
  gsa-pricing-parser.py             # Parse Excel files
  gsa-pricing-importer.py           # Import to database
  test-gsa-pricing-pipeline.py     # Test all components
  run-complete-gsa-pricing-collection.sh  # Run complete pipeline

supabase/migrations/
  create_gsa_pricing_tables.sql    # Database schema
```

## Performance Notes

- **Download**: ~3,000 files × 0.5 seconds = 25 minutes
- **Parse**: ~3,000 files × 1-2 seconds = 50-100 minutes
- **Import**: ~150,000 records × 0.005 seconds = 12 minutes

Total: **~2-4 hours** for complete pipeline

## Using the Data

### Example: Find cheapest contractors for a role

```sql
SELECT 
  c.company_name,
  c.contract_number,
  c.website,
  c.primary_contact_email,
  lc.labor_category,
  lc.hourly_rate,
  lc.education_level,
  lc.years_experience
FROM gsa_labor_categories lc
JOIN gsa_schedule_holders c ON lc.contractor_id = c.id
WHERE 
  lc.labor_category ILIKE '%software engineer%'
  AND lc.hourly_rate IS NOT NULL
ORDER BY lc.hourly_rate ASC
LIMIT 20;
```

### Example: Compare rates by state

```sql
SELECT 
  c.company_state,
  COUNT(DISTINCT c.id) as contractors,
  AVG(lc.hourly_rate)::numeric(10,2) as avg_rate,
  MIN(lc.hourly_rate) as min_rate,
  MAX(lc.hourly_rate) as max_rate
FROM gsa_labor_categories lc
JOIN gsa_schedule_holders c ON lc.contractor_id = c.id
WHERE lc.hourly_rate IS NOT NULL
GROUP BY c.company_state
ORDER BY contractors DESC
LIMIT 20;
```

### Example: Small business pricing

```sql
SELECT 
  lc.labor_category,
  AVG(CASE WHEN c.small_business = true THEN lc.hourly_rate END)::numeric(10,2) as small_biz_avg,
  AVG(CASE WHEN c.small_business = false THEN lc.hourly_rate END)::numeric(10,2) as large_biz_avg,
  COUNT(*) as total_contractors
FROM gsa_labor_categories lc
JOIN gsa_schedule_holders c ON lc.contractor_id = c.id
WHERE lc.hourly_rate IS NOT NULL
GROUP BY lc.labor_category
HAVING COUNT(*) >= 10
ORDER BY total_contractors DESC
LIMIT 20;
```

## Next Steps

After collecting GSA pricing data, you can:

1. **Cross-reference with FPDS**: See which contractors win contracts and at what rates
2. **SAM.gov integration**: Add business certifications (Woman-Owned, Veteran-Owned, etc.)
3. **Competitive analysis**: Compare your rates to market rates
4. **Automated alerts**: Get notified of new contracts or rate changes
5. **API development**: Build tools for teaming partners to search pricing

## Support

If you encounter issues:
1. Check logs in terminal output
2. Run test script: `python3 scripts/test-gsa-pricing-pipeline.py`
3. Verify tables exist in Supabase
4. Check that GSA contractor data was imported first

## Summary

You now have a complete system to:
- Download all GSA contractor price lists
- Parse labor categories and rates
- Store in searchable database
- Query and analyze pricing data

This gives you unprecedented visibility into GSA pricing and competitive positioning.

