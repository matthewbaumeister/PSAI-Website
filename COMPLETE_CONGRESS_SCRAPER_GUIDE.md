# Complete Congress.gov Scraper Guide

## 🚀 Industrial-Strength Scraper for ALL Bills

This scraper can fetch **EVERY SINGLE BILL** from Congress.gov, not just the first 250.

### Features

✅ **Pagination** - Fetches ALL bills (10,000-17,000 per Congress)  
✅ **API Resilience** - Auto-retry with exponential backoff  
✅ **Resume Capability** - Survives crashes, power outages, interruptions  
✅ **Progress Tracking** - Saves state every 10 bills  
✅ **Rate Limiting** - Stays safely under API limits (4000/hour)  
✅ **Comprehensive Logging** - See exactly what's happening  
✅ **Error Tracking** - All failures logged to state file  

---

## ⚠️ IMPORTANT: Stop Current Imports First!

Before running this, **STOP the current limited imports**:

```bash
# Kill all running congress imports
pkill -9 -f congress-bulk-import

# Verify they're stopped
ps aux | grep congress
```

**Delete the incomplete data:**

Run this in Supabase SQL Editor:
```sql
DELETE FROM congressional_bills WHERE congress IN (117, 118, 119);
```

---

## 📊 Expected Data Volumes

| Congress | Years | Bills | Time | Database Size |
|----------|-------|-------|------|---------------|
| 119 | 2025-now | ~5,000 | 4 hours | ~500MB |
| 118 | 2023-2024 | ~15,000 | 12 hours | ~1.5GB |
| 117 | 2021-2022 | ~17,000 | 14 hours | ~1.7GB |
| 116 | 2019-2020 | ~16,000 | 13 hours | ~1.6GB |
| 115 | 2017-2018 | ~13,000 | 11 hours | ~1.3GB |

**Total for 117-119:** ~37,000 bills, ~30 hours, ~3.7GB

---

## 🎯 Usage Examples

### 1. Scrape Current Congress (119) - Recommended Start!

```bash
npx tsx src/scripts/congress-complete-scraper.ts --congress=119
```

**Time:** ~4-5 hours  
**Bills:** ~5,000  
**Good for:** Testing the system

---

### 2. Scrape Recent Complete Congresses (117-119)

```bash
npx tsx src/scripts/congress-complete-scraper.ts --start=117 --end=119
```

**Time:** ~30 hours  
**Bills:** ~37,000  
**Good for:** Most relevant recent legislation

---

### 3. Scrape Last 10 Years (115-119)

```bash
npx tsx src/scripts/congress-complete-scraper.ts --start=115 --end=119
```

**Time:** ~60 hours (2.5 days)  
**Bills:** ~66,000  
**Good for:** Comprehensive recent history

---

### 4. Scrape EVERYTHING (Congress 1-119) ⚠️

```bash
npx tsx src/scripts/congress-complete-scraper.ts --all
```

**Time:** WEEKS!  
**Bills:** ~1,000,000+  
**Database:** ~100GB+  
**Good for:** Complete historical archive (NOT RECOMMENDED initially)

---

### 5. Resume Interrupted Scrape

If the scraper crashes, loses connection, or you stop it:

```bash
npx tsx src/scripts/congress-complete-scraper.ts --resume
```

It will pick up **exactly where it left off**!

---

## 🏃 Recommended Strategy

### Phase 1: Test with Current Congress (Tonight)
```bash
# Test with Congress 119 (~4 hours)
npx tsx src/scripts/congress-complete-scraper.ts --congress=119
```

### Phase 2: Get Complete Recent Sessions (This Week)
```bash
# Scrape 117-118 (~26 hours)
npx tsx src/scripts/congress-complete-scraper.ts --start=117 --end=118
```

### Phase 3: Expand Historical (Next Week)
```bash
# Add 115-116 (~24 hours)
npx tsx src/scripts/congress-complete-scraper.ts --start=115 --end=116
```

---

## 🔧 Running in Background (For Long Scrapes)

### Method 1: tmux (Recommended)

```bash
# Start tmux session
tmux new -s congress-scraper

# Run scraper
npx tsx src/scripts/congress-complete-scraper.ts --start=117 --end=119

# Detach: Press Ctrl+B, then D

# Reattach later
tmux attach -t congress-scraper

# Check if running
tmux ls
```

### Method 2: nohup

```bash
nohup npx tsx src/scripts/congress-complete-scraper.ts --start=117 --end=119 > congress-scraper.log 2>&1 &

# Check progress
tail -f congress-scraper.log

# Find process
ps aux | grep congress-complete-scraper
```

### Method 3: screen

```bash
# Start screen session
screen -S congress

# Run scraper
npx tsx src/scripts/congress-complete-scraper.ts --start=117 --end=119

# Detach: Press Ctrl+A, then D

# Reattach
screen -r congress
```

---

## 📈 Monitoring Progress

### Real-time Progress

The scraper shows:
```
[2547/15000 - 17.0%] Processing HR 5345...
  ✅ Saved successfully
  💾 Progress saved (2500 saved, 47 failed)
```

### Check State File

```bash
cat .congress-scraper-state.json | jq
```

Shows:
- Current progress
- Success/failure counts
- All errors
- Resume point

### Database Check

```sql
SELECT 
  congress,
  COUNT(*) as bills,
  MAX(last_scraped) as last_import
FROM congressional_bills
GROUP BY congress
ORDER BY congress DESC;
```

---

## ⚠️ If Something Goes Wrong

### API Rate Limit Hit

The scraper automatically pauses if you hit 4000 requests/hour. It will:
1. Pause for 1 hour
2. Resume automatically

You'll see:
```
⚠️  Rate limit approaching (4000/5000), pausing for 1 hour...
```

### Network Connection Lost

The scraper has retry logic:
```
⚠️  Fetching HR 5345 failed (attempt 2/5), retrying in 4000ms...
    Error: Network timeout
```

After 5 failed attempts, it saves state and exits. Resume with `--resume`.

### Scraper Crashes

All progress is saved every 10 bills. Just run:
```bash
npx tsx src/scripts/congress-complete-scraper.ts --resume
```

### Mac Goes to Sleep

**Prevent sleep during long scrapes:**

```bash
# Keep Mac awake while running (in another terminal)
caffeinate -d

# Or run scraper with caffeinate
caffeinate npx tsx src/scripts/congress-complete-scraper.ts --start=117 --end=119
```

---

## 📊 Expected Output

### During Scrape

```
==========================================
SCRAPING CONGRESS 118
==========================================

📋 Found 15,234 total bills in Congress 118
⏱️  Estimated time: 13 hours

📄 Fetching bills 1-250 of 15,234...
   Found 250 bills in this page

  [1/15234 - 0.0%] Processing HR 5345...
    ✅ Saved successfully
  [2/15234 - 0.0%] Processing S 3002...
    ✅ Saved successfully
  [10/15234 - 0.1%] Processing HR 5900...
    ✅ Saved successfully
    💾 Progress saved (10 saved, 0 failed)
    
...continues for hours...

==========================================
CONGRESS 118 COMPLETE
==========================================
Total Bills: 15,234
Processed: 15,234
Saved: 15,187
Failed: 47
Duration: 12h 43m 15s
==========================================
```

### Final Summary

```
==========================================
SCRAPING COMPLETE - FINAL SUMMARY
==========================================

Congresses Scraped: 3
Total Bills Processed: 37,041
Total Saved: 36,894
Total Failed: 147
Overall Duration: 1d 6h 23m 45s

Per-Congress Summary:
--------------------
Congress 119:
  Total Bills: 5,127
  Success: 5,098
  Failed: 29
  Duration: 4h 15m 32s

Congress 118:
  Total Bills: 15,234
  Success: 15,187
  Failed: 47
  Duration: 12h 43m 15s

Congress 117:
  Total Bills: 16,680
  Success: 16,609
  Failed: 71
  Duration: 13h 24m 58s

==========================================
```

---

## 🎯 Recommended First Run

**Tonight, start with Congress 119:**

```bash
# In tmux or screen
tmux new -s congress-scraper

# Run overnight
npx tsx src/scripts/congress-complete-scraper.ts --congress=119

# Detach and let it run
# Ctrl+B, then D
```

**Tomorrow morning, check results:**

```bash
# Reattach to see completion
tmux attach -t congress-scraper

# Or check database
# Run VERIFY_COMPLETE_CONGRESS_IMPORT.sql in Supabase
```

**If successful, scale up:**

```bash
# Start the big ones
npx tsx src/scripts/congress-complete-scraper.ts --start=117 --end=118
```

---

## 💾 Disk Space Requirements

Make sure you have enough space:

```bash
# Check available space
df -h

# Need at least:
# - 5GB for 117-119
# - 10GB for 115-119
# - 100GB+ for all historical
```

---

## 🔍 Verification After Completion

Run the verification SQL:

```sql
-- Should show THOUSANDS of bills per Congress
SELECT 
  congress,
  COUNT(*) as total_bills,
  COUNT(*) FILTER (WHERE actions IS NOT NULL) as has_actions,
  AVG(jsonb_array_length(actions)) as avg_actions
FROM congressional_bills
GROUP BY congress
ORDER BY congress DESC;
```

**Expected:**
```
Congress 119: 5,000-6,000 bills
Congress 118: 14,000-16,000 bills
Congress 117: 16,000-18,000 bills
```

NOT 250 per Congress!

---

## 🚨 Critical Notes

1. **Do NOT run multiple instances** - They'll conflict
2. **Keep Mac plugged in** - This takes hours
3. **Use tmux/screen** - Don't run in regular terminal
4. **Check state file** - Shows exact progress
5. **Database size** - Each Congress is ~1GB
6. **API key** - Must be valid in `.env`

---

## 📞 Quick Reference

```bash
# Test run (current Congress, ~4 hours)
npx tsx src/scripts/congress-complete-scraper.ts

# Recent complete Congresses (~30 hours)
npx tsx src/scripts/congress-complete-scraper.ts --start=117 --end=119

# Resume interrupted
npx tsx src/scripts/congress-complete-scraper.ts --resume

# Stop scraper
pkill -f congress-complete-scraper

# Check progress
cat .congress-scraper-state.json | jq

# Keep Mac awake
caffeinate npx tsx src/scripts/congress-complete-scraper.ts --congress=119
```

---

## ✅ You'll Know It's Working When...

- Progress updates every bill: `[1243/15234 - 8.2%]`
- Success checkmarks: `✅ Saved successfully`
- Progress saves: `💾 Progress saved`
- State file updates: `.congress-scraper-state.json`
- Database grows: Watch bill counts in Supabase

---

**Start tonight with Congress 119, then scale up!** 🚀

