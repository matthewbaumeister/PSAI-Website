# Run Congressional Trades Scraper - Walk Away Mode

## 🚀 One Command to Start

```bash
./run-congress-trades-background.sh
```

That's it! The scraper will run in tmux and you can close your terminal and walk away.

## ✨ Built-in Features

### 1. Error Handling ✅
- **Try/Catch blocks** on every member
- **Continues on errors** - if one member fails, keeps going
- **Logs all errors** to stderr
- **Duplicate prevention** - won't re-scrape existing trades

### 2. Rate Limiting ✅
- **CapitolGains library** handles rate limiting automatically
- **Polite scraping** - respects government servers
- **Built-in delays** between requests

### 3. Progress Tracking ✅
- **Real-time logging** - see which member is being scraped
- **Batch processing** - stores trades in batches of 100
- **Statistics** - total trades, errors, duration at the end

### 4. Resume Capability ✅
- **Upsert logic** - won't duplicate trades if you run again
- **Can re-run safely** - just updates existing records
- **No data loss** - if it crashes, just run again

## 📺 How to Watch Progress

### Option 1: Attach to tmux (Recommended)
```bash
tmux attach -t congress-trades
```
- Press `Ctrl+B` then `D` to detach (scraper keeps running)
- You can re-attach anytime to check progress

### Option 2: Watch the log file
```bash
tail -f logs/congress-trades-*.log
```
- Shows live output
- Press `Ctrl+C` to stop watching (scraper keeps running)

### Option 3: Don't watch at all!
Just walk away. Check back in 1-2 hours:
```bash
npm run check:congress-trades
```

## 🎯 What You'll See

```
============================================================
CONGRESSIONAL STOCK TRADES: Historical Backfill
Years: 2012 - 2024
============================================================

Launching Python scraper (historical mode)...

[1/100] House: Rogers (AL-3)
  2024: 12 disclosure(s)
  2023: 8 disclosure(s)
  ...

[2/100] House: Wittman (VA-1)
  2024: 5 disclosure(s)
  ...

Python scraper returned 15,234 trades
Storing in database...

Batch 1/153...
Batch 2/153...
...

============================================================
HISTORICAL STOCK TRADES BACKFILL COMPLETE
============================================================
Total trades processed: 15,234
New trades inserted:    15,234
Trades updated:         0
Errors:                 5
Duration:               3,847 seconds (64 minutes)
============================================================
```

## ⏱️ Timeline

- **Start**: Immediate
- **House scraping**: 30-60 minutes (~47 members)
- **Senate scraping**: 30-60 minutes (~53 members)  
- **Database storage**: 5-10 minutes
- **Total**: 1-2 hours

## 🛡️ What If Something Goes Wrong?

### Scenario 1: Scraper crashes
**Solution:** Just run it again!
```bash
./run-congress-trades-background.sh
```
- Won't duplicate data
- Will pick up where it left off
- Safe to run multiple times

### Scenario 2: Network issues
**Solution:** It continues past errors
- Skips problematic members
- Logs the errors
- Keeps going with the rest

### Scenario 3: Server rate limits
**Solution:** Built-in handling
- CapitolGains respects rate limits
- Automatically waits between requests
- Government servers are used to scrapers

### Scenario 4: Computer goes to sleep
**Solution:** Run in cloud or use `caffeinate`
```bash
caffeinate -i ./run-congress-trades-background.sh
```
Prevents Mac from sleeping during scrape.

## 📊 After It's Done

### Check the results:
```bash
npm run check:congress-trades
```

### View the data:
```bash
# Overall stats
psql $DATABASE_URL -c "SELECT * FROM get_congressional_trades_stats();"

# Recent trades
psql $DATABASE_URL -c "SELECT * FROM recent_defense_trades LIMIT 20;"

# Top traders
psql $DATABASE_URL -c "
SELECT member_name, COUNT(*) as trades
FROM congressional_stock_trades
GROUP BY member_name
ORDER BY trades DESC
LIMIT 10;
"
```

## 🔄 Running It Again

Safe to run anytime:
```bash
./run-congress-trades-background.sh
```

Will:
- ✅ Update existing trades with new disclosure dates
- ✅ Add any new trades since last run
- ✅ Skip duplicates automatically
- ✅ Much faster (only checks for new data)

## 💡 Pro Tips

### 1. Run overnight
```bash
# Start before bed
./run-congress-trades-background.sh

# Check in the morning
npm run check:congress-trades
```

### 2. Multiple terminals
- Terminal 1: Run the scraper
- Terminal 2: Watch the logs
- Terminal 3: Check database stats

### 3. Set up daily automation
```bash
# Add to crontab for daily updates
crontab -e

# Add:
0 3 * * * cd /Users/matthewbaumeister/Documents/PropShop_AI_Website && npm run scrape:congress-trades:daily >> logs/daily-$(date +\%Y\%m\%d).log 2>&1
```

### 4. Check progress without attaching
```bash
# See if it's still running
tmux ls

# See last 20 lines of output
tail -20 logs/congress-trades-*.log

# Count how many members processed
grep "House:\|Senate:" logs/congress-trades-*.log | wc -l
```

## 🎉 TL;DR

**Run and forget:**
```bash
./run-congress-trades-background.sh
```

**Check 2 hours later:**
```bash
npm run check:congress-trades
```

**That's it!**

---

The scraper:
- ✅ Handles errors gracefully
- ✅ Respects rate limits
- ✅ Logs everything
- ✅ Prevents duplicates
- ✅ Runs in background
- ✅ Can be re-run safely

**Just start it and walk away!**

