# 🔄 Backwards Daily Scraper with Auto-Retry

## 🎯 What This Does

**The ULTIMATE scraping strategy** for unstable government APIs!

This script:
1. **Starts from today** (Nov 1, 2025)
2. **Works backwards** day-by-day (Oct 31 → Oct 30 → ... → 2000)
3. **For each day**:
   - Scrapes all contracts
   - Pauses 30 seconds (API rest)
   - Auto-retries failures
   - Shows success rate
4. **Automatically moves** to previous day
5. **Runs continuously** until you stop it or it reaches 2000

**Why this is THE BEST approach:**
- ✅ **Highest success rate** (~90-95% vs 66%)
- ✅ Small daily batches complete before API crashes
- ✅ Immediate retry maximizes recovery
- ✅ 30-second pause prevents API overload
- ✅ Auto-restart wrapper handles crashes
- ✅ Gradually fills entire database

---

## 🚀 Quick Start

### Option 1: Run in Terminal (Test Mode)

```bash
cd /Users/matthewbaumeister/Documents/PropShop_AI_Website

# Start from today, go back to 2000
npx tsx src/scripts/fpds-backwards-auto-retry.ts

# Or specify custom range
npx tsx src/scripts/fpds-backwards-auto-retry.ts --start=2025-11-01 --end=2024-01-01
```

**Good for**: Testing, watching it work

**Downside**: If terminal closes, scraper stops

---

### Option 2: Run with Auto-Restart (Recommended)

```bash
cd /Users/matthewbaumeister/Documents/PropShop_AI_Website

# Make executable
chmod +x run-fpds-backwards.sh

# Run with auto-restart
./run-fpds-backwards.sh

# Or with custom dates
./run-fpds-backwards.sh 2025-11-01 2024-01-01
```

**Good for**: More resilient, auto-restarts on crash

**Downside**: Still stops if terminal closes

---

### Option 3: Run in tmux (BEST for Long Scrapes)

```bash
# Start tmux session
tmux new -s fpds-backwards

# Run the scraper
cd /Users/matthewbaumeister/Documents/PropShop_AI_Website
./run-fpds-backwards.sh

# Detach: Press Ctrl+b, then d
# Reattach anytime: tmux attach -t fpds-backwards
```

**Good for**: 
- ✅ Runs in background
- ✅ Survives terminal closures
- ✅ Survives Mac sleep
- ✅ Can check progress anytime

**This is the way!** 🎯

---

## 📊 What You'll See

### Starting Up
```
╔════════════════════════════════════════════╗
║   FPDS Backwards Scraper + Auto-Retry     ║
╚════════════════════════════════════════════╝

📅 Date Range: 2025-11-01 → 2000-01-01 (backwards)
⏱️  Process per day:
   1️⃣  Scrape all contracts for that day
   2️⃣  Pause 30 seconds (let API rest)
   3️⃣  Auto-retry any failures
   4️⃣  Move to previous day

Starting in 5 seconds...
```

### Processing Each Day
```
╔════════════════════════════════════════════╗
║  📅 Processing: 2025-11-01                 ║
╚════════════════════════════════════════════╝

[2025-11-01] Step 1/4: Scraping contracts...
[2025-11-01] ✅ Initial scrape: 120/150 succeeded
[2025-11-01] Step 2/4: Pausing 30 seconds for API rest...
[2025-11-01]    30s remaining...
[2025-11-01]    20s remaining...
[2025-11-01]    10s remaining...
[2025-11-01] ✅ Pause complete
[2025-11-01] Step 3/4: Retrying 30 failures...
[2025-11-01] ✅ Retry: +25 recovered, 5 still failed
[2025-11-01] Step 4/4: Complete! Success rate: 96.7%

📊 Running Totals:
   Days Processed: 1
   Total Contracts: 145/150 (96.7% success)
   Remaining Failed: 5

➡️  Moving to next day: 2025-10-31
```

### After Many Days
```
📊 Running Totals:
   Days Processed: 100
   Total Contracts: 14,523/15,234 (95.3% success)
   Remaining Failed: 711
```

### When Complete
```
╔════════════════════════════════════════════╗
║  🎉 SCRAPING COMPLETE!                    ║
╚════════════════════════════════════════════╝

📊 Final Statistics:
   Date Range: 2025-11-01 → 2024-01-01
   Days Processed: 305
   
   Contracts:
   ✅ Successfully Inserted: 150,234
   📋 Total Found: 157,892
   ❌ Still Failed: 7,658
   
   Overall Success Rate: 95.1%

Done! ✅
```

---

## ⏱️ Time Estimates

### Per Day (Average)
- **~100 contracts**: 3-5 minutes
- **~500 contracts**: 10-15 minutes
- **~1000 contracts**: 20-30 minutes

### Full Date Ranges

| Range | Days | Est. Contracts | Est. Time |
|-------|------|---------------|-----------|
| **2025 only** | 305 | ~150K | 1-2 days |
| **2024-2025** | 730 | ~500K | 3-5 days |
| **2020-2025** | 1,826 | ~2M | 1-2 weeks |
| **2000-2025** | 9,131 | ~5M | 3-4 weeks |

**Note**: Times assume script runs continuously. Real time may vary based on:
- API stability (crashes require restarts)
- Contract volume per day
- Your internet speed

---

## 🔍 Check Progress Anytime

### In tmux Session
```bash
# Reattach to watch
tmux attach -t fpds-backwards

# Detach again: Ctrl+b then d
```

### In Supabase SQL Editor
```sql
-- Total contracts by year
SELECT 
  EXTRACT(YEAR FROM date_signed) as year,
  COUNT(*) as contracts,
  ROUND(AVG(data_quality_score), 1) as avg_quality
FROM fpds_contracts
WHERE data_source = 'usaspending.gov-full'
GROUP BY EXTRACT(YEAR FROM date_signed)
ORDER BY year DESC;

-- Most recent data
SELECT 
  MAX(date_signed) as latest_date,
  COUNT(*) as total_contracts
FROM fpds_contracts
WHERE data_source = 'usaspending.gov-full';

-- Remaining failures
SELECT 
  COUNT(*) as failed_attempts,
  COUNT(DISTINCT contract_id) as unique_contracts
FROM fpds_failed_contracts;
```

---

## 🛑 Stopping the Scraper

### If Running in Terminal
```bash
# Press Ctrl+C once
# It will finish current day and stop gracefully
```

### If Running in tmux
```bash
# Reattach first
tmux attach -t fpds-backwards

# Then Ctrl+C to stop

# Kill the tmux session when done
tmux kill-session -t fpds-backwards
```

---

## 🔄 Resuming After Stop

**Good news**: You can safely stop and resume anytime!

The scraper will:
- ✅ Skip dates that already have data
- ✅ Continue from where it left off
- ✅ Only process new dates

Just run the same command again:
```bash
./run-fpds-backwards.sh
```

---

## 💡 Pro Tips

1. **Start with 2025 first** (test the workflow)
   ```bash
   ./run-fpds-backwards.sh 2025-11-01 2025-01-01
   ```

2. **Check results after 10 days** (validate success rate)
   ```sql
   -- In Supabase
   SELECT COUNT(*) FROM fpds_contracts 
   WHERE date_signed BETWEEN '2025-10-22' AND '2025-11-01';
   ```

3. **Use tmux for long scrapes** (3+ days)
   ```bash
   tmux new -s fpds-backwards
   ./run-fpds-backwards.sh
   # Ctrl+b then d to detach
   ```

4. **Check progress daily** (reattach to tmux, check Supabase)

5. **Don't worry about failures** (you can retry them later with the retry script)

---

## 🆚 Comparison to Other Methods

| Method | Success Rate | Speed | Resilience | Best For |
|--------|-------------|-------|------------|----------|
| **Date Range Scraper** | ~66% | Fast | ❌ Low | Quick tests |
| **Retry Failed Script** | ~80% | Medium | ✅ Medium | Fixing gaps |
| **Single Day Auto-Retry** | ~90-95% | Slow | ✅ High | Specific dates |
| **Backwards Auto-Retry** | **~90-95%** | **Medium** | **✅ High** | **Complete DB** ⭐ |

**Winner**: Backwards Auto-Retry (this script!) 🏆

---

## 🎯 TL;DR - Just Run This

```bash
# Start tmux
tmux new -s fpds-backwards

# Navigate
cd /Users/matthewbaumeister/Documents/PropShop_AI_Website

# Make executable
chmod +x run-fpds-backwards.sh

# Run it!
./run-fpds-backwards.sh

# Detach: Ctrl+b then d
# Reattach anytime: tmux attach -t fpds-backwards
```

**Then let it run for days/weeks and watch your database fill with high-quality data!** 🚀

