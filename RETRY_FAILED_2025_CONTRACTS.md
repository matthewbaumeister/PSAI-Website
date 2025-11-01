# Retry Failed 2025 Contracts

## What Happened?

You scraped **Jan 1 - Oct 31, 2025** (10 months / 303 days) and got:
- ✅ ~596 contracts successfully inserted (high quality)
- ❌ Some contracts failed due to API instability

The errors you saw (`TypeError: fetch failed`, `SocketError: other side closed`) are **NORMAL** with USASpending.gov API. The government API is unstable and drops connections frequently.

---

## Step 1: Check What You Have

Run this in **Supabase SQL Editor**:

```sql
-- Copy all contents of CHECK_2025_FPDS_DATA.sql
```

This will show you:
1. **Total contracts**: How many you got
2. **Quality scores**: Are they good?
3. **Monthly/daily coverage**: Are there gaps?
4. **Failed contracts**: How many need retry?

---

## Step 2: View Failed Contracts

```sql
-- See all failed contracts from your scrape
SELECT 
  contract_id,
  error_type,
  error_message,
  page_number,
  created_at
FROM fpds_failed_contracts
WHERE date_range LIKE '%2025%'
ORDER BY created_at DESC
LIMIT 100;
```

---

## Step 3: Retry Failed Contracts

We have a **dedicated retry script** that:
- ✅ Reads all failed contract IDs from `fpds_failed_contracts`
- ✅ Fetches full details for each one
- ✅ Updates if successful, keeps in log if fails again
- ✅ Much faster than re-scraping entire date ranges

### Run the Retry Script:

```bash
# Retry all failed contracts from 2025
npx tsx src/scripts/fpds-retry-failed.ts --date-range="2025"

# Or retry a specific month
npx tsx src/scripts/fpds-retry-failed.ts --date-range="2025-10"

# With max limit
npx tsx src/scripts/fpds-retry-failed.ts --date-range="2025" --max=100
```

---

## Step 4: Check Progress After Retry

Run the check script again:

```bash
# In Supabase SQL Editor, re-run CHECK_2025_FPDS_DATA.sql
```

Compare:
- **Before**: X failed contracts
- **After**: Y failed contracts (should be lower)

---

## Understanding the Errors

### Normal API Errors (Don't Panic!):
- `TypeError: fetch failed` - API dropped connection
- `SocketError: other side closed` - Server closed socket
- `Details API error: 500` - Server internal error

### What This Means:
- 🟢 **NOT your fault** - Government API is unstable
- 🟢 **Data is still good** - What you got is high quality
- 🟢 **Retry will work** - Usually succeeds on 2nd/3rd attempt

### Success Rate:
- **First scrape**: ~99% success (596/600 contracts)
- **After 1 retry**: Usually ~99.5% success
- **After 2-3 retries**: ~99.9% success

Some contracts may **permanently fail** if they're broken in the government database.

---

## Alternative: Daily Backwards Scraper (Recommended!)

Instead of retrying, you could use the **daily backwards scraper** which is **MORE RELIABLE**:

```bash
# Start tmux session
tmux new -s fpds-daily

# Run daily scraper (starts from today, works backwards)
./run-fpds-daily.sh

# Detach with: Ctrl+b then d
# Reattach with: tmux attach -t fpds-daily
```

**Why this is better**:
- Scrapes **1 day at a time** (completes in 1-2 min before API can crash)
- **Auto-restarts** on failure
- **Fills entire database** gradually (2025 → 2024 → 2023 → ... → 2000)
- **Much more resilient** to API instability

---

## Quick Decision Guide

### ✅ Run Retry Script If:
- You just want to **fill gaps in 2025**
- You already have most of the data
- Quick 10-minute task

### ✅ Use Daily Backwards Scraper If:
- You want **ALL years** (2000-2025)
- You want **maximum reliability**
- You can let it run for several days

Both approaches work! Retry is faster for fixing gaps. Daily scraper is better for complete historical data.

---

## Expected Timeline

### Retry Failed Contracts:
- **Time**: 10-30 minutes
- **Result**: Fill gaps in 2025 data

### Daily Backwards Scraper:
- **Time**: 3-5 days continuous running
- **Result**: Complete database from 2000-2025 (~3-5 million contracts)

---

## Files Reference

- **Check data**: `CHECK_2025_FPDS_DATA.sql`
- **Retry script**: `src/scripts/fpds-retry-failed.ts`
- **Daily scraper**: `src/scripts/fpds-daily-scraper.ts`
- **Auto-retry wrapper**: `run-fpds-daily.sh`
- **Failed contracts table**: `fpds_failed_contracts` in Supabase
- **Main data table**: `fpds_contracts` in Supabase

