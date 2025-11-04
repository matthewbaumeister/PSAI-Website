# 🚀 Dual Congress.gov Scraper Setup

**2x Speed with Two API Keys!**

---

## 📋 **What This Does:**

- **Scraper 1** (Forward): Congress 119 → 1 (newest to oldest)
- **Scraper 2** (Reverse): Congress 1 → 119 (oldest to newest)
- **They meet in the middle** for maximum efficiency!

---

## ✅ **Prerequisites:**

1. ✅ Add second API key to `.env`:
```bash
CONGRESS_SECOND_API_KEY=MRW0jJV8wZwkSutsHsfmLvGxrdAIqkqxji6QqhYd
```

2. ✅ **Already added to Vercel** (you're done with this!)

---

## 🚀 **Running Both Scrapers:**

### Option A: Two Terminal Windows (Easiest)

**Terminal 1:**
```bash
cd /Users/matthewbaumeister/Documents/PropShop_AI_Website

# Forward scraper (newest → oldest)
caffeinate -i npx tsx src/scripts/congress-complete-scraper.ts --all
```

**Terminal 2:**
```bash
cd /Users/matthewbaumeister/Documents/PropShop_AI_Website

# Reverse scraper (oldest → newest)  
caffeinate -i npx tsx src/scripts/congress-reverse-scraper.ts
```

---

### Option B: Two tmux Sessions (Best for Long Runs)

```bash
# Start forward scraper in tmux
tmux new -s congress-forward
caffeinate -i npx tsx src/scripts/congress-complete-scraper.ts --all
# Press Ctrl+B, then D to detach

# Start reverse scraper in tmux
tmux new -s congress-reverse
caffeinate -i npx tsx src/scripts/congress-reverse-scraper.ts
# Press Ctrl+B, then D to detach
```

**Monitor both:**
```bash
# Check forward scraper
tmux attach -t congress-forward

# Check reverse scraper  
tmux attach -t congress-reverse
```

---

## 📊 **Monitor Progress:**

Run this in Supabase to see both scrapers working:

```sql
SELECT 
  COUNT(*) as total_bills,
  COUNT(DISTINCT congress) as congresses_scraped,
  MAX(congress) as newest_congress,
  MIN(congress) as oldest_congress,
  MAX(last_scraped) as most_recent_update
FROM congressional_bills;
```

---

## ⏸️ **Pause/Resume:**

Both scrapers save state independently:

**Forward Scraper:**
- State file: `.congress-scraper-state.json`
- Resume: `npx tsx src/scripts/congress-complete-scraper.ts --resume`

**Reverse Scraper:**
- State file: `.congress-reverse-scraper-state.json`
- Resume: `npx tsx src/scripts/congress-reverse-scraper.ts --resume`

---

## 🎯 **What to Expect:**

### Speed Comparison:

| Setup | Time to Complete |
|-------|------------------|
| Single Scraper | ~5-7 days |
| **Dual Scrapers** | **~2.5-3.5 days** |

### Progress Example:

```
Forward Scraper:  Congress 119 → 110 (9 done)
Reverse Scraper:  Congress 1 → 15 (15 done)
Total: 24 Congresses completed!
```

They'll meet around Congress 60!

---

## ⚠️ **Important Notes:**

1. **Different API Keys**: Each scraper uses its own key (4500 req/hour each)
2. **Different State Files**: They won't conflict with each other
3. **Same Database**: Both save to the same table (Supabase handles conflicts)
4. **Rate Limiting**: Each scraper respects its own 4500/hour limit

---

## 🛑 **Stop Both Scrapers:**

```bash
# If using tmux
tmux kill-session -t congress-forward
tmux kill-session -t congress-reverse

# If using terminal windows
# Press Ctrl+C in each window
```

---

## 📧 **Email Notifications:**

Only the **daily cron job** sends emails (runs at 11:30 AM UTC).

The long-running scrapers are **silent** but save state after every bill.

---

## ✅ **Ready to Start!**

Just run both commands and let them go! 🚀

Check back in a few hours to see both sides making progress.

