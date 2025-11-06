# How to Monitor Congressional Trades Scraper Progress

## 🎯 Understanding How It Works

**Current Architecture:**
1. **Python collects ALL trades** (1-2 hours)
2. **Python outputs JSON** (at the very end)
3. **TypeScript reads JSON** and stores to database (5-10 minutes)

**Database will be empty until step 3!**

## 📊 How to Check Progress

### 1. Watch Live Extraction (Best Way)

```bash
tmux attach -t congress-trades
```

You'll see:
```
[6/56] House: Stefanik (NY-21)
  2024: 3 PTR(s) found
  ✅ Downloaded: 20024542.pdf
  ✅ Extracted 21 trade(s)
```

**This shows it's working!** Each "Extracted X trades" means data is being collected.

### 2. Check Log File

```bash
tail -f ~/Documents/PropShop_AI_Website/logs/congress-trades-*.log
```

### 3. Count Trades Being Extracted

```bash
grep "Extracted.*trade" ~/Documents/PropShop_AI_Website/logs/congress-trades-*.log | wc -l
```

This shows how many PDFs have been processed.

### 4. See Current Progress

```bash
tail -5 ~/Documents/PropShop_AI_Website/logs/congress-trades-*.log
```

Shows which member/year it's currently on.

## ⏱️ Timeline

| Time | What's Happening | Database Status |
|------|------------------|----------------|
| 0-10 min | Finding PDFs for early members | Empty (0 trades) |
| 10-30 min | Downloading & parsing PDFs | Empty (0 trades) |
| 30-60 min | Continuing through 56 House members | Empty (0 trades) |
| 60-90 min | Senate members | Empty (0 trades) |
| 90-120 min | **Python finishes, outputs JSON** | Empty (0 trades) |
| 120-130 min | **TypeScript stores to database** | **Filling up!** |
| 130+ min | **COMPLETE** | **All trades stored!** |

## 🔍 Progress Indicators

**Good signs you'll see in logs:**
- ✅ `Extracted 21 trade(s)` - Finding real trades!
- ✅ `Downloaded: 20024542.pdf` - PDFs downloading
- ✅ `[6/56] House:` - Progress through members
- ✅ `📄 Cached:` - Using cache (faster)

**What completion looks like:**
```
House complete: 15432 trades
Senate complete: 8921 trades

Python scraper returned 24353 trades
Storing in database...
Batch 1/244...
✅ Upload complete!
```

## 💾 When Will Database Have Data?

**Database fills at the VERY END** (after 2 hours).

You'll see in the tmux session:
```
Python scraper returned 24353 trades
Storing in database...
Batch 1/244...
Batch 2/244...
...
✅ Complete! Inserted 24353 trades
```

**THEN check Supabase:**
```sql
SELECT COUNT(*) FROM congressional_stock_trades;
-- Should show thousands!
```

## 🚨 If It Crashes

**Current risk:** If scraper crashes after 1.5 hours, you lose everything!

**Solution:** Let it complete once, then:
1. Daily updates only scrape recent data
2. Much faster (5-10 minutes)
3. Less risk

## 🎯 Summary

**Don't worry about empty database!** It's normal until the very end.

**Monitor progress by:**
1. Watching tmux: `tmux attach -t congress-trades`
2. Checking logs: `tail -f logs/congress-trades-*.log`
3. Counting extractions: `grep "Extracted" logs/congress-trades-*.log`

**Database will fill in final 10 minutes after 2-hour scrape completes!**

---

**Current Status Check:**
```bash
# See where scraper is now
tail -10 ~/Documents/PropShop_AI_Website/logs/congress-trades-20251105-113918.log
```

