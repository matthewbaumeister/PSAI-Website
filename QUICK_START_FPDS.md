# ✅ FPDS Scraper - Quick Start Checklist

## Step 1: Check Current Data in Supabase (Optional)

### Go to Supabase SQL Editor:
1. Open https://supabase.com
2. Navigate to your project
3. Click "SQL Editor" in sidebar

### Copy/paste this quick check:
```sql
-- See what data you have already
SELECT 
  calendar_year,
  COUNT(*) as contracts,
  ROUND(AVG(data_quality_score), 1) as avg_quality
FROM fpds_contracts
WHERE calendar_year IS NOT NULL
GROUP BY calendar_year
ORDER BY calendar_year DESC;
```

**Expected Result:**
- If empty: You're starting fresh (good!)
- If has data: You'll see what years you already have

---

## Step 2: Start the Auto-Scraper

### Copy/paste this ONE command into your Mac terminal:

```bash
tmux new-session -s fpds-2025 -d && tmux send-keys -t fpds-2025 "cd /Users/matthewbaumeister/Documents/PropShop_AI_Website && bash run-fpds-year.sh 2025 2025-01-01 2025-10-31" C-m && sleep 2 && tmux attach-session -t fpds-2025
```

**What you'll see:**
```
╔════════════════════════════════════════════╗
║   FPDS Year 2025 Scraper - Auto-Retry     ║
╚════════════════════════════════════════════╝
Date Range: 2025-01-01 to 2025-10-31
...

🚀 Attempt #1 - Starting Year 2025 scraper...
════════════════════════════════════════════

[FPDS Full] Starting FULL scrape: 2025-01-01 to 2025-10-31
[FPDS Full] Searching contracts: 2025-01-01 to 2025-10-31, page 1
[FPDS Full] Page 1: Found 100 contracts
[FPDS Full] Fetching full details...
[FPDS Full]   Fetched 10/100 details...
[FPDS Full]   Fetched 20/100 details...
...
[FPDS Full] Data Quality: 89.7/100 avg score
[FPDS Full] Inserting 100 cleaned contracts...
```

### ✅ Good Signs:
- Page numbers increasing
- "Fetched X/100 details..."
- "Inserting X cleaned contracts..."
- "Data Quality: 89.7/100 avg score"

### ⚠️ Normal Errors (Don't Worry!):
- "Error fetching details for CONT_AWD_..."
- "fetch failed"
- "SocketError: other side closed"
- "Details API error: 500"

These are NORMAL with government APIs! The scraper will skip them and you can re-run later to fill gaps.

---

## Step 3: Detach and Let It Run

### To leave it running in background:
1. Press `Ctrl+B` (hold both keys)
2. Release both keys
3. Press `D` (just the D key)

You'll see: `[detached (from session fpds-2025)]`

**The scraper is now running in the background!** You can close the terminal window if you want.

---

## Step 4: Check Progress Later

### To reconnect and see progress:
```bash
tmux attach-session -t fpds-2025
```

### To see all running sessions:
```bash
tmux list-sessions
```

### To see last 30 lines without attaching:
```bash
tmux capture-pane -t fpds-2025 -p | tail -30
```

---

## Step 5: Stop the Scraper (When You Want)

### To kill the session:
```bash
tmux kill-session -t fpds-2025
```

This will stop the scraper completely.

---

## Step 6: Verify Data in Supabase

### Run this in Supabase SQL Editor:
```sql
-- Check your new data
SELECT 
  COUNT(*) as total_contracts,
  ROUND(AVG(data_quality_score), 1) as avg_quality,
  MIN(date_signed)::date as earliest,
  MAX(date_signed)::date as latest
FROM fpds_contracts;

-- Contracts by year
SELECT 
  calendar_year,
  COUNT(*) as contracts
FROM fpds_contracts
GROUP BY calendar_year
ORDER BY calendar_year DESC;
```

---

## What to Expect

### Year 2025 (~838 contracts)
- **Time:** 7-10 minutes
- **Errors:** Some (normal!)
- **Quality:** 89-90/100
- **Auto-restarts:** Yes

### After 2025 Completes

You can start additional years in parallel:

**For 2024:**
```bash
tmux new-session -s fpds-2024 -d && tmux send-keys -t fpds-2024 "cd /Users/matthewbaumeister/Documents/PropShop_AI_Website && bash run-fpds-year.sh 2024 2024-01-01 2024-12-31" C-m && sleep 2 && tmux attach-session -t fpds-2024
```

**For 2023:**
```bash
tmux new-session -s fpds-2023 -d && tmux send-keys -t fpds-2023 "cd /Users/matthewbaumeister/Documents/PropShop_AI_Website && bash run-fpds-year.sh 2023 2023-01-01 2023-12-31" C-m && sleep 2 && tmux attach-session -t fpds-2023
```

Each runs in its own session and they won't interfere with each other!

---

## Troubleshooting

### "command not found: tmux"
```bash
brew install tmux
```

### "no server running"
No sessions exist. Just run the "Start Auto-Scraper" command above.

### Session died / not responding
```bash
# Kill it
tmux kill-session -t fpds-2025

# Restart it
tmux new-session -s fpds-2025 -d && tmux send-keys -t fpds-2025 "cd /Users/matthewbaumeister/Documents/PropShop_AI_Website && bash run-fpds-year.sh 2025 2025-01-01 2025-10-31" C-m && sleep 2 && tmux attach-session -t fpds-2025
```

It will automatically resume from where it left off!

---

## Summary

1. ✅ **Start scraper:** Copy/paste the tmux command
2. ✅ **Watch it run:** See contracts being inserted
3. ✅ **Detach:** Press `Ctrl+B`, then `D`
4. ✅ **Check later:** `tmux attach-session -t fpds-2025`
5. ✅ **Verify in Supabase:** Run the SQL queries

**The scraper will auto-restart on crashes and resume from last page!**

You're all set! 🚀

