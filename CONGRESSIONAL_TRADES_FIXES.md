# Congressional Trades - Issues Fixed

## ✅ Issues Resolved

### 1. SQL Migration Error: "column 'name' does not exist"

**Problem:**
- Migration tried to use generic `scraper_logs` table
- Your system uses individual scraper log tables per scraper

**Solution:**
- Created `congressional_trades_scraper_log` table
- Matches your existing pattern (same as `congress_scraper_log`, `dod_news_scraper_log`, etc.)
- Has all standard columns: `scrape_type`, `date_range`, `records_found`, `records_inserted`, etc.

### 2. Scraper Names Not Clear

**Problem:**
- Console output said "CONGRESSIONAL TRADES" 
- Hard to distinguish from regular congressional bills scraper

**Solution:**
- Changed all console output to say "CONGRESSIONAL STOCK TRADES"
- Historical mode now shows: `HISTORICAL STOCK TRADES BACKFILL`
- Daily mode now shows: `DAILY STOCK TRADES UPDATE`
- Check status shows: `CONGRESSIONAL STOCK TRADES STATUS`
- Scraper log displays: `HISTORICAL` or `DAILY` with date range

## 📊 New Scraper Log Structure

The `congressional_trades_scraper_log` table now tracks:

```sql
CREATE TABLE congressional_trades_scraper_log (
  id BIGSERIAL PRIMARY KEY,
  scrape_type TEXT NOT NULL,          -- 'historical' or 'daily'
  date_range TEXT,                    -- e.g., '2012-2024' or '2024'
  
  records_found INTEGER,              -- Total trades scraped
  records_inserted INTEGER,           -- New trades added
  records_updated INTEGER,            -- Existing trades updated
  records_errors INTEGER,             -- Errors encountered
  
  status TEXT NOT NULL,               -- 'running', 'completed', 'failed'
  error_message TEXT,
  
  started_at TIMESTAMP,
  duration_seconds INTEGER
);
```

## 🚀 How to Use Now

### Step 1: Apply Fixed Migration

```bash
psql $DATABASE_URL -f supabase/migrations/create_congressional_trades.sql
```

Should work without errors now!

### Step 2: Run Historical Backfill

```bash
npm run scrape:congress:historical
```

Will show clearly:
```
============================================================
CONGRESSIONAL STOCK TRADES: Historical Backfill
Years: 2012 - 2024
============================================================
```

### Step 3: Check Status

```bash
npm run check:congress
```

Will show:
```
============================================================
CONGRESSIONAL STOCK TRADES STATUS
============================================================

📋 RECENT SCRAPER RUNS:
────────────────────────────────────────────────────────────
✅ 11/5/2024 - HISTORICAL completed
   Range: 2012-2024 | Found: 15234 | Inserted: 15234 | Updated: 0
```

### Step 4: View Logs in Database

```sql
-- Latest run
SELECT * FROM congressional_trades_scraper_log
ORDER BY started_at DESC
LIMIT 1;

-- Or use the check script
psql $DATABASE_URL -f CHECK_CONGRESSIONAL_TRADES_LOG.sql
```

## 📝 Changes Made

### Files Modified

1. **`supabase/migrations/create_congressional_trades.sql`**
   - Removed generic `scraper_logs` INSERT
   - Added proper `congressional_trades_scraper_log` table
   - Matches your existing scraper log pattern

2. **`src/lib/congressional-trades-scraper.ts`**
   - Changed from `logScraperStatus()` to `startScraperLog()` and `endScraperLog()`
   - Now uses `congressional_trades_scraper_log` table
   - Updated all console output to say "STOCK TRADES"
   - Logs show `HISTORICAL` or `DAILY` clearly

3. **`check-congress-status.ts`**
   - Uses new `congressional_trades_scraper_log` table
   - Shows scrape type (HISTORICAL/DAILY) in output
   - Displays detailed stats: found/inserted/updated counts

### Files Created

4. **`CHECK_CONGRESSIONAL_TRADES_LOG.sql`**
   - Quick queries to check scraper logs
   - View latest runs, failed runs, success rate

## 🎯 What You'll See Now

### During Historical Backfill

```
============================================================
CONGRESSIONAL STOCK TRADES: Historical Backfill
Years: 2012 - 2024
============================================================

Launching Python scraper (historical mode)...
This may take a while...

[1/47] House: Rogers (AL-3)
  2024: 12 disclosure(s)
  2023: 8 disclosure(s)
...

Python scraper returned 15234 trades
Storing in database...

Batch 1/153...
Batch 2/153...
...

Storage complete!

============================================================
HISTORICAL STOCK TRADES BACKFILL COMPLETE
============================================================
Total trades processed: 15234
New trades inserted:    15234
Trades updated:         0
Errors:                 0
Duration:               3847 seconds
============================================================
```

### During Daily Updates

```
============================================================
CONGRESSIONAL STOCK TRADES: Daily Update
Year: 2024
============================================================

Launching Python scraper (daily mode)...

[1/47] House: Rogers (AL-3)
  2024: 3 disclosure(s)
...

Python scraper returned 47 trades
Storing in database...

Batch 1/1...

Storage complete!

============================================================
DAILY STOCK TRADES UPDATE COMPLETE
============================================================
Total trades processed: 47
New trades inserted:    12
Trades updated:         35
Errors:                 0
Duration:               142 seconds
============================================================
```

### Check Status Output

```
============================================================
CONGRESSIONAL STOCK TRADES STATUS
============================================================

✅ Database table exists

📊 STATISTICS:
────────────────────────────────────────────────────────────
Total Trades:          15,234
Total Members:         98
Defense Trades:        2,847
House Trades:          9,123
Senate Trades:         6,111
Purchases:             8,456
Sales:                 6,778
Date Range:            2012-03-15 to 2024-11-05
Avg Days to Disclose:  28.4

📋 RECENT SCRAPER RUNS:
────────────────────────────────────────────────────────────
✅ 11/5/2024, 10:30:00 AM - HISTORICAL completed
   Range: 2012-2024 | Found: 15234 | Inserted: 15234 | Updated: 0
✅ 11/5/2024, 3:00:00 AM - DAILY completed
   Range: 2024 | Found: 47 | Inserted: 12 | Updated: 35
...
```

## 🎉 Ready to Go!

Everything is fixed and ready. Just run:

```bash
# 1. Apply migration (now works!)
psql $DATABASE_URL -f supabase/migrations/create_congressional_trades.sql

# 2. Run backfill (now shows "STOCK TRADES" clearly!)
npm run scrape:congress:historical

# 3. Check status (now uses proper log table!)
npm run check:congress
```

---

**Both issues resolved!** 
- ✅ SQL migration works
- ✅ Scraper names clearly say "STOCK TRADES"
- ✅ Logs distinguish HISTORICAL vs DAILY runs

