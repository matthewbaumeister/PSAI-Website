# Test Scraper - Direct to opportunity_master

## What This Does

This test scraper:
1. Finds the 10 most recent DOD contract news articles
2. Extracts all contract data (including vehicle types!)
3. Saves **directly to `opportunity_master`** and `opportunity_sources`
4. Skips the intermediate `dod_contract_news` table

## Prerequisites

### 1. Create the Schema First

In Supabase SQL Editor, run these files in order:

```sql
-- 1. Run this first (creates tables, indexes, functions)
\i OPPORTUNITY_MASTER_SCHEMA.sql

-- 2. Run this second (creates helper functions if not already created)
\i RUN_THIS_FIRST.sql
```

Or manually run:
1. Open `/Users/matthewbaumeister/Documents/MRT_WEBSITE/OPPORTUNITY_MASTER_SCHEMA.sql`
2. Copy/paste into Supabase SQL Editor
3. Run it

### 2. Verify Schema Created

```sql
-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('opportunity_master', 'opportunity_sources');

-- Check functions exist
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('make_canonical_opportunity_key', 'safe_update_field');
```

## Run the Test

### Step 1: Navigate to PropShop_AI_Website folder

```bash
cd /Users/matthewbaumeister/Documents/PropShop_AI_Website
```

### Step 2: Install dependencies (if needed)

```bash
npm install
```

### Step 3: Set up environment variables

Make sure `.env` or `.env.local` has:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Step 4: Run the test scraper

```bash
npx tsx test-scraper-to-master.ts
```

This will:
- Find 10 most recent contract news articles
- Extract all contract data
- Save directly to `opportunity_master`
- Show progress and results

Expected output:
```
============================================================
  TEST SCRAPER - Direct to opportunity_master
============================================================

🔍 Finding 10 most recent contract news articles...

✅ Found 10 articles

────────────────────────────────────────────────────────────
📰 Article 1/10
   Title: Contracts For November 20, 2024
   Date: 2024-11-20
   URL: https://www.defense.gov/...
────────────────────────────────────────────────────────────

   📄 Found 15 contract paragraphs

[Master] ✅ Saved to opportunity_master: abc123...
[Master]   📋 Saved to opportunity_sources
[Master]   💼 Lockheed Martin Corp.
[Master]   💰 $45.2 million
[Master]   🚗 Vehicle: IDIQ
[Master]   📊 Quality: 85/100

... (more contracts)

============================================================
  SUMMARY
============================================================
  Articles processed: 10
  Contracts found: 150
  Contracts saved: 148
  Success rate: 99%
============================================================

✅ Test complete! Check opportunity_master table in Supabase.
```

## Verify Results

After running, check Supabase:

```sql
-- Check how many opportunities were created
SELECT COUNT(*) FROM opportunity_master;

-- Look at sample records
SELECT 
  id,
  title,
  opportunity_type,
  vehicle_type,  -- Should see IDIQ, Sole Source, etc!
  status,
  customer_agency,
  publication_date,
  estimated_value,
  data_quality_score
FROM opportunity_master
ORDER BY created_at DESC
LIMIT 10;

-- Check vehicle types distribution
SELECT 
  vehicle_type,
  COUNT(*) AS count
FROM opportunity_master
WHERE vehicle_type IS NOT NULL
GROUP BY vehicle_type
ORDER BY count DESC;

-- Check source records
SELECT 
  os.source_name,
  os.source_primary_key,
  os.match_confidence,
  om.title,
  om.vehicle_type
FROM opportunity_sources os
JOIN opportunity_master om ON os.opportunity_id = om.id
ORDER BY os.ingested_at DESC
LIMIT 10;
```

## Expected Results

You should see:
- ✅ 100-200 contracts from 10 articles (varies by day)
- ✅ `vehicle_type` populated (IDIQ, Sole Source, Multiple Award, etc.)
- ✅ `data_quality_score` between 60-95
- ✅ All enhanced fields captured (modifications, FMS, SBIR, etc.)
- ✅ Source records in `opportunity_sources` table

## Common Issues

### Issue: "Function make_canonical_opportunity_key does not exist"

**Solution**: Run `OPPORTUNITY_MASTER_SCHEMA.sql` first

### Issue: "Table opportunity_master does not exist"

**Solution**: Run `OPPORTUNITY_MASTER_SCHEMA.sql` first

### Issue: "Column vehicle_type does not exist"

**Solution**: The schema file includes this. Re-run schema creation.

### Issue: "Error connecting to Supabase"

**Solution**: Check `.env` file has correct credentials

### Issue: "403 Forbidden when fetching articles"

**Solution**: The scraper uses Puppeteer to bypass this. Wait a moment and try again.

## Next Steps

Once the test works:

1. **Review the data** in Supabase to verify quality
2. **Check vehicle_type** is being captured correctly
3. **Verify canonical keys** are unique and stable
4. **Run full scrape** for all 44,000 opportunities

To run full scrape, modify the test script:

```typescript
// Change this line:
const articles = await findRecentArticles(10);

// To scrape all historical:
const articles = await findAllHistoricalArticles(); // You'll need to implement this
```

Or use the existing production scraper but update it to use `saveContractToOpportunityMaster` instead of `saveContractToDatabase`.

## Files Created

1. `src/lib/dod-news-scraper-direct-to-master.ts` - Modified save function
2. `test-scraper-to-master.ts` - Test script
3. This file - Instructions

## Questions?

Check the console output for detailed logs. Each contract saved shows:
- ✅ Saved status
- 💼 Vendor name
- 💰 Amount
- 🚗 Vehicle type (KEY FIELD!)
- 📊 Quality score

