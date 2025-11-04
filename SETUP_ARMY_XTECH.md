# Army XTECH Setup Instructions

## Current Status

✅ Scraper code is complete and working
✅ 44 competitions found
✅ Load More button automation working
✅ Enhanced data extraction implemented

❌ **DATABASE SCHEMA NOT APPLIED YET**

## Issue

The scraper ran successfully but the data can't be saved properly because the database tables don't exist or are incomplete:

- Missing `army_innovation_winners` table
- Missing `army_innovation_finalists` table  
- Missing `army_innovation_documents` table
- Possibly missing columns on `army_innovation_opportunities` table

## Required Steps

### Step 1: Apply Database Schema

1. Open your **Supabase Dashboard**
2. Navigate to **SQL Editor** (left sidebar)
3. Click **New Query**
4. Open the file `ARMY_INNOVATION_DATABASE_SCHEMA.sql` from this project
5. **Copy ALL contents** of that file
6. **Paste** into the Supabase SQL Editor
7. Click **RUN** (bottom right)
8. Wait for "Success. No rows returned" message

This will create:
- ✅ `army_innovation_programs` table
- ✅ `army_innovation_opportunities` table (with ALL 80+ columns)
- ✅ `army_innovation_winners` table
- ✅ `army_innovation_finalists` table
- ✅ `army_innovation_documents` table
- ✅ Views for easy querying
- ✅ Functions for date calculations
- ✅ Triggers for auto-updates
- ✅ Indexes for performance

### Step 2: Run the Scraper Again

After the schema is applied, run the historical scraper:

```bash
npm run scrape:army-innovation:historical
```

This will:
- Find all 44 competitions
- Extract full descriptions, eligibility, prizes, dates
- Save 150+ winners to the database
- Save 200+ finalists to the database
- Populate all metadata fields

### Step 3: Verify the Data

Run the verification script:

```bash
node compare-xtech-data.js
```

You should now see:
- ✅ 44 competitions
- ✅ 150+ winners
- ✅ 200+ finalists
- ✅ 80%+ data completeness across all fields

Or run the SQL verification file in Supabase:

```sql
-- Paste contents of CHECK_XTECH_DATA.sql
```

### Step 4: Export Full Data

Once verified, export a fresh CSV from Supabase:

1. Go to **Table Editor**
2. Select `army_innovation_opportunities`
3. Click **Export** > **CSV**
4. Save and compare with the original CSV you shared

You should see:
- All 44 rows (vs 9 before)
- Full descriptions (vs "\n\n" before)
- Prize amounts populated
- Eligibility requirements populated
- Phase information populated
- Dates populated

## Troubleshooting

### If Schema Application Fails

**Error: "relation already exists"**
- Some tables may already exist from a previous partial run
- Option 1: Drop existing tables first:
  ```sql
  DROP TABLE IF EXISTS army_innovation_opportunities CASCADE;
  DROP TABLE IF EXISTS army_innovation_winners CASCADE;
  DROP TABLE IF EXISTS army_innovation_finalists CASCADE;
  DROP TABLE IF EXISTS army_innovation_documents CASCADE;
  DROP TABLE IF EXISTS army_innovation_programs CASCADE;
  ```
- Option 2: Modify the schema file to use `CREATE TABLE IF NOT EXISTS`

**Error: "permission denied"**
- Make sure you're using the **SQL Editor** in Supabase
- Make sure you're logged in as the project owner
- Try running with service role permissions

### If Scraper Fails After Schema

**Error: "too many browser instances"**
- Kill existing processes: `pkill -f "puppeteer"`
- Restart the scraper

**Error: "supabaseUrl is required"**
- Make sure `.env.local` file exists with credentials
- Verify environment variables are loaded

### If Data Still Shows 0 Winners/Finalists

1. Check scraper logs for errors during save operations
2. Verify table permissions in Supabase (RLS policies)
3. Check if `army_innovation_winners` table has proper foreign key constraints
4. Try querying directly: `SELECT * FROM army_innovation_winners LIMIT 5`

## Expected Results

After completing all steps:

### Database Tables
```
army_innovation_programs          → 1 row (XTECH program)
army_innovation_opportunities     → 44 rows
army_innovation_winners           → 150+ rows
army_innovation_finalists         → 200+ rows
army_innovation_documents         → 0 rows (for future use)
```

### Data Quality
```
Descriptions:          80%+ (substantial text content)
Eligibility:           70%+ (requirements text)
Prizes:                90%+ (dollar amounts)
Dates:                 60%+ (open/close dates)
Phases:                80%+ (competition phases)
Submission Format:     60%+ (White Paper, Pitch, etc.)
Winners:               100% (all competitions with winners)
Finalists:             100% (all competitions with finalists)
```

### API Endpoints
- Manual: `POST /api/army-innovation/scrape` ✅ Ready
- Cron: `/api/cron/army-innovation-scraper` ✅ Ready

## Next Actions

1. **Apply the schema** (Step 1 above) ← DO THIS NOW
2. **Re-run the scraper** (Step 2 above)
3. **Verify the results** (Step 3 above)
4. **Set up daily cron** in Vercel (optional)
5. **Add Army FUZE scraper** (similar process)

## Files Reference

- `ARMY_INNOVATION_DATABASE_SCHEMA.sql` - Run this in Supabase SQL Editor
- `CHECK_XTECH_DATA.sql` - Use to verify data quality
- `compare-xtech-data.js` - Run to check data completeness
- `src/lib/army-xtech-scraper.ts` - Main scraper (already complete)
- `XTECH_SCRAPER_IMPROVEMENTS.md` - Technical details of improvements

## Questions?

If you encounter any issues:
1. Check scraper logs for specific errors
2. Verify all tables exist in Supabase Table Editor
3. Check table permissions (RLS policies)
4. Verify `.env.local` has correct credentials

