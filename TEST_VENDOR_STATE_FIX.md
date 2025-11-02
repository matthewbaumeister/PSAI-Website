# Testing vendor_state Fix - Complete Guide

## Step 1: Clear the Table

Run this in **Supabase SQL Editor**:

```sql
-- Delete all records from dod_contract_news
TRUNCATE TABLE dod_contract_news RESTART IDENTITY CASCADE;

-- Verify table is empty
SELECT COUNT(*) as remaining_records FROM dod_contract_news;
```

Expected result: `remaining_records: 0`

---

## Step 2: Run Test Scraper

In your terminal:

```bash
cd /Users/matthewbaumeister/Documents/PropShop_AI_Website
npx tsx test-dod-single-article.ts
```

This will scrape one recent contract announcements article and save contracts to the database.

---

## Step 3: Verify vendor_state is Populated

Run this in **Supabase SQL Editor**:

```sql
-- Check that vendor_state is populated correctly
SELECT 
  vendor_name,
  vendor_location,
  vendor_city,
  vendor_state,
  data_quality_score
FROM dod_contract_news
ORDER BY scraped_at DESC
LIMIT 20;
```

**Expected Results:**
- `vendor_location`: "City, State" format (e.g., "Kettering, Ohio")
- `vendor_city`: City name extracted (e.g., "Kettering")
- `vendor_state`: Full state name (e.g., "Ohio") ✅ **NOT NULL**
- `data_quality_score`: Should be high (80-100) for complete records

---

## Step 4: Check Quality Metrics

```sql
-- Overall quality check
SELECT 
  COUNT(*) as total_contracts,
  COUNT(vendor_state) as with_state,
  COUNT(*) FILTER (WHERE vendor_state IS NULL) as missing_state,
  ROUND(100.0 * COUNT(vendor_state) / NULLIF(COUNT(*), 0), 2) as state_coverage_pct,
  ROUND(AVG(data_quality_score), 2) as avg_quality_score
FROM dod_contract_news;
```

**Expected Results:**
- `state_coverage_pct`: Should be close to 100%
- `avg_quality_score`: Should be 80+ (high quality)

---

## What to Look For

### PASS Criteria
- All contracts have `vendor_state` populated (not NULL)
- `vendor_state` contains full state names like "Ohio", "Michigan", "California"
- Quality scores are 80-100 for contracts with complete info
- No "needs_review" flags due to missing vendor_state

### FAIL Criteria
- `vendor_state` is NULL for any records
- Quality scores are low (<70) due to missing location data
- Records are flagged for review due to missing vendor location

---

## Troubleshooting

### If vendor_state is still NULL:

1. **Check the migration was applied:**
```sql
-- Verify the extract_state function handles full state names
SELECT extract_state('Kettering, Ohio');
-- Should return: "Ohio"

SELECT extract_state('Washington, DC');
-- Should return: "DC"
```

2. **Check the trigger:**
```sql
-- Verify trigger exists
SELECT tgname, tgenabled 
FROM pg_trigger 
WHERE tgname = 'extract_dod_news_locations';
```

3. **Check scraper logs:**
Look for debug messages like:
```
[DEBUG] Extracted - City: Kettering | State: Ohio
[DEBUG] Inserting to DB - vendor_city: Kettering | vendor_state: Ohio
```

---

## Success!

If all checks pass, the fix is working correctly and you can:
1. Keep the test data, OR
2. Clear the table again and run a full scrape
3. Deploy to production

The `vendor_state` field will now be populated correctly for all future scrapes.

