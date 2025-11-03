# FPDS Scraper - Official Production Guide

## The Only Scraper You Need

**File:** `src/scripts/fpds-page-level-scraper.ts`

This is the **only reliable FPDS scraper**. All other scrapers have been removed.

## Why This One Works

✅ **20 retry attempts per contract** (handles API failures)  
✅ **Exponential backoff** (up to 60s between retries)  
✅ **Page-by-page progress tracking** (never lose progress)  
✅ **Smart error handling** (socket errors, timeouts, rate limits)  
✅ **Proven to work** with USASpending's unstable API

---

## Standard Commands

### Single Year (Recommended)

```bash
cd /Users/matthewbaumeister/Documents/PropShop_AI_Website

# 2025
npx tsx src/scripts/fpds-page-level-scraper.ts --start=2025-11-03 --end=2025-01-01

# 2024
npx tsx src/scripts/fpds-page-level-scraper.ts --start=2024-12-31 --end=2024-01-01

# 2023
npx tsx src/scripts/fpds-page-level-scraper.ts --start=2023-12-31 --end=2023-01-01
```

### Multiple Years in Parallel (4x Faster)

Open 4 terminal windows and run one command in each:

```bash
# Terminal 1: 2025
tmux new -s fpds-2025
cd /Users/matthewbaumeister/Documents/PropShop_AI_Website
npx tsx src/scripts/fpds-page-level-scraper.ts --start=2025-11-03 --end=2025-01-01

# Terminal 2: 2024
tmux new -s fpds-2024
cd /Users/matthewbaumeister/Documents/PropShop_AI_Website
npx tsx src/scripts/fpds-page-level-scraper.ts --start=2024-12-31 --end=2024-01-01

# Terminal 3: 2023
tmux new -s fpds-2023
cd /Users/matthewbaumeister/Documents/PropShop_AI_Website
npx tsx src/scripts/fpds-page-level-scraper.ts --start=2023-12-31 --end=2023-01-01

# Terminal 4: 2022
tmux new -s fpds-2022
cd /Users/matthewbaumeister/Documents/PropShop_AI_Website
npx tsx src/scripts/fpds-page-level-scraper.ts --start=2022-12-31 --end=2022-01-01
```

**Detach from each:** `Ctrl+B` then `D`

---

## How It Works

### Day-by-Day Processing

The scraper processes one day at a time, working **backwards** from start to end date:

```
2025-11-03 → 2025-11-02 → 2025-11-01 → ... → 2025-01-01
```

### For Each Day

1. **Search** for all contracts on that date (pages of 100)
2. **Fetch full details** for each contract (20 retry attempts each)
3. **Save to database** (upsert = no duplicates)
4. **Log progress** (can resume if crashes)
5. **Move to previous day**

### What You'll See

```
╔════════════════════════════════════════════╗
║  📅 Processing: 2025-10-26              ║
╚════════════════════════════════════════════╝

[2025-10-26:P1] 🔍 Searching page 1...
[2025-10-26:P1] Found 100 contracts
[2025-10-26:P1]   Fetched 10/100 details...
[2025-10-26:P1]   Fetched 20/100 details...
[2025-10-26:P1]   Fetched 100/100 details...
[2025-10-26:P1] ✅ Fetched 100/100 details
[2025-10-26:P1] 🔬 Quality: 99.8/100
[2025-10-26:P1] 💾 New: 95 | Updated: 5 | DB Errors: 0

[2025-10-26:P2] 🔍 Searching page 2...
```

---

## Progress Tracking

### Check Database

```sql
-- Total contracts by year
SELECT 
  EXTRACT(YEAR FROM date_signed) as year,
  COUNT(*) as contracts,
  MAX(date_signed) as latest_date,
  MIN(date_signed) as earliest_date
FROM fpds_contracts
GROUP BY EXTRACT(YEAR FROM date_signed)
ORDER BY year DESC;

-- Recent contracts
SELECT COUNT(*) 
FROM fpds_contracts 
WHERE date_signed >= '2025-01-01';
```

### Monitor tmux Sessions

```bash
# List all running scrapers
tmux ls

# Attach to watch progress
tmux attach -t fpds-2025
tmux attach -t fpds-2024
tmux attach -t fpds-2023
tmux attach -t fpds-2022

# Detach: Ctrl+B then D
```

---

## Resume After Crash

The scraper automatically resumes from where it left off:

```bash
# Just run the same command again
npx tsx src/scripts/fpds-page-level-scraper.ts --start=2025-11-03 --end=2025-01-01
```

It will:
- Check the `fpds_scraper_log` table
- Resume from last completed page
- Skip already-processed dates

---

## Features

### Automatic Retry

If a contract fails to fetch:
- Retries up to 20 times
- Exponential backoff (1s → 2s → 4s → ... → 60s)
- Logs failures for manual retry later

### Quality Scoring

Each contract is scored 0-100 based on:
- Number of fields populated
- Critical fields present (vendor, amount, dates)
- Data completeness

### Smart Upsert

Uses `transaction_number` as unique key:
- New contracts = INSERT
- Existing contracts = UPDATE
- No duplicates possible

### SAM.gov Links

Automatically adds SAM.gov opportunity links when `solicitation_id` exists.

---

## Files Kept

**Production Scraper:**
- `src/scripts/fpds-page-level-scraper.ts` - Main scraper (use this)

**Library Functions:**
- `src/lib/fpds-scraper-full.ts` - API functions
- `src/lib/fpds-data-cleaner.ts` - Data validation
- `src/lib/fpds-scraper.ts` - Base utilities

**Helper Scripts:**
- `run-fpds-page-level.sh` - tmux wrapper (optional)

**All other FPDS scrapers have been deleted** - they were unreliable or outdated.

---

## Troubleshooting

### "fetch failed" Error

This is normal with USASpending API. The scraper will:
1. Retry automatically (up to 20 times)
2. Log the failure if all retries fail
3. Continue with next contract

### "API cooldown" Messages

The scraper is backing off to let the API rest. This is intentional.

### Slow Progress

USASpending API is rate-limited and unstable. Typical speed:
- ~2 seconds per contract
- ~1,800 contracts per hour
- ~43,000 contracts per day

For large date ranges, expect **days to complete**.

---

## Summary

**Always use:** `npx tsx src/scripts/fpds-page-level-scraper.ts --start=YYYY-MM-DD --end=YYYY-MM-DD`

**Run in parallel:** Open 4 terminals, each scraping a different year

**Monitor:** Use `tmux ls` and `tmux attach -t SESSION_NAME`

**This is the only FPDS scraper you need!** 🎯

