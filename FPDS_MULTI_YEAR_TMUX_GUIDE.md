# FPDS Multi-Year Scraping with tmux

## YES! You Can Run Multiple Years Simultaneously

Each tmux session can scrape a different year. Your Mac will handle 2-3 parallel scrapes easily.

---

## Quick Start: Scrape Multiple Years

### Step 1: Create the Auto-Restart Shell Script

We already have `run-fpds-with-retry.sh`, but let's create a flexible version:

```bash
# This script is already in your repo: run-fpds-with-retry.sh
# You can customize it per year
```

### Step 2: Start First Year (2025 - Finish What We Started)

```bash
# Create tmux session for 2025
tmux new-session -s fpds-2025 -d

# Start the scraper in that session with auto-retry
tmux send-keys -t fpds-2025 "cd /Users/matthewbaumeister/Documents/PropShop_AI_Website" C-m
tmux send-keys -t fpds-2025 "bash run-fpds-with-retry.sh" C-m

# Attach to watch progress
tmux attach-session -t fpds-2025
```

**To detach and leave it running:** Press `Ctrl+B`, then `D`

### Step 3: Start Second Year (2024 - Fresh Data)

```bash
# Create NEW tmux session for 2024
tmux new-session -s fpds-2024 -d

# Start 2024 scraper
tmux send-keys -t fpds-2024 "cd /Users/matthewbaumeister/Documents/PropShop_AI_Website" C-m
tmux send-keys -t fpds-2024 "while true; do npx tsx src/scripts/fpds-full-load-date-range.ts --start=2024-01-01 --end=2024-12-31; sleep 30; done" C-m

# Attach to watch progress
tmux attach-session -t fpds-2024
```

### Step 4: Start Third Year (2023 - If You Want)

```bash
# Create ANOTHER tmux session for 2023
tmux new-session -s fpds-2023 -d

# Start 2023 scraper
tmux send-keys -t fpds-2023 "cd /Users/matthewbaumeister/Documents/PropShop_AI_Website" C-m
tmux send-keys -t fpds-2023 "while true; do npx tsx src/scripts/fpds-full-load-date-range.ts --start=2023-01-01 --end=2023-12-31; sleep 30; done" C-m
```

---

## Managing Multiple Sessions

### List All Running Sessions
```bash
tmux list-sessions
```

### Switch Between Sessions
```bash
# Detach from current session: Ctrl+B, then D
# Attach to another session:
tmux attach-session -t fpds-2024
tmux attach-session -t fpds-2023
```

### Check Progress Without Attaching
```bash
# Peek at what's running in each session
tmux capture-pane -t fpds-2025 -p | tail -20
tmux capture-pane -t fpds-2024 -p | tail -20
tmux capture-pane -t fpds-2023 -p | tail -20
```

### Kill a Session (Stop Scraping)
```bash
tmux kill-session -t fpds-2025
tmux kill-session -t fpds-2024
```

### Kill ALL Sessions (Nuclear Option)
```bash
tmux kill-server
```

---

## Recommended Strategy

### Option A: Sequential (Safest)
1. Finish 2025 first (only ~838 contracts)
2. Then start 2024
3. Then 2023, 2022, etc.

### Option B: Parallel (Faster, More CPU)
1. Run 2025 + 2024 simultaneously
2. Wait for both to finish
3. Then run 2023 + 2022

### Option C: Aggressive (3+ years at once)
- Only if your Mac has 16GB+ RAM
- Monitor with `htop` or Activity Monitor
- May slow down all scrapes

---

## Performance Notes

**Single Year:** ~0.5 seconds per contract
- 2025 (838 contracts): ~7 minutes
- 2024 (~200k contracts): ~28 hours
- 2023 (~190k contracts): ~26 hours

**Two Years Parallel:**
- Each takes ~1.5x longer
- But you get 2 years in the time of 1.5 years

**Three Years Parallel:**
- Each takes ~2x longer
- Still faster than sequential

---

## Monitoring Progress

### In Real-Time (While Attached)
Just watch the terminal output. You'll see:
- Page numbers
- Contracts processed
- Data quality scores
- Errors (normal!)

### From Database (Run in Supabase SQL Editor)
```sql
-- See the SQL file: CHECK_FPDS_PROGRESS.sql
-- Shows contracts by year, scraper status, gaps, etc.
```

### Quick Command Line Check
```bash
# See last 50 lines of each session
tmux capture-pane -t fpds-2025 -p | tail -50
tmux capture-pane -t fpds-2024 -p | tail -50
```

---

## Troubleshooting

### Session Died / Not Running
```bash
# Check if still alive
tmux list-sessions

# If it died, just restart it
tmux new-session -s fpds-2025 -d
tmux send-keys -t fpds-2025 "cd /Users/matthewbaumeister/Documents/PropShop_AI_Website && bash run-fpds-with-retry.sh" C-m
```

### Too Many Errors
- This is NORMAL with government APIs
- The scraper will retry automatically
- Failed contracts will be picked up on next run

### Mac Overheating / Slow
```bash
# Kill one or more sessions
tmux kill-session -t fpds-2023

# Resume later when system cooler
```

### Lost Track of What's Running
```bash
# See all sessions
tmux list-sessions

# See last output of each
tmux capture-pane -t fpds-2025 -p | tail -20
tmux capture-pane -t fpds-2024 -p | tail -20
```

---

## Auto-Restart Explained

The `run-fpds-with-retry.sh` script uses:
```bash
while true; do
  npx tsx src/scripts/fpds-full-load-date-range.ts --start=2025-01-01 --end=2025-10-31
  sleep 30  # Wait 30 seconds before retry
done
```

**What This Does:**
1. Runs the scraper
2. If it crashes (API error, network drop, etc.)
3. Waits 30 seconds
4. Restarts automatically
5. Resumes from last completed page (thanks to scraper_log table)

**You Can Customize Per Year:**
```bash
# For 2024
tmux send-keys -t fpds-2024 "while true; do npx tsx src/scripts/fpds-full-load-date-range.ts --start=2024-01-01 --end=2024-12-31; sleep 30; done" C-m

# For 2023
tmux send-keys -t fpds-2023 "while true; do npx tsx src/scripts/fpds-full-load-date-range.ts --start=2023-01-01 --end=2023-12-31; sleep 30; done" C-m
```

---

## When to Stop the Auto-Restart

The scraper will mark itself as `completed` in the database when done, but the auto-restart loop will keep running. You have two options:

### Option 1: Let It Keep Running
- It will just keep updating existing records
- Uses upsert, so no duplicates
- Will catch any new contracts added to government API

### Option 2: Kill the Session When Done
```bash
# Check if complete in Supabase:
SELECT status, total_processed, total_inserted 
FROM fpds_scraper_log 
WHERE date_range LIKE '%2025%' 
ORDER BY updated_at DESC 
LIMIT 1;

# If status = 'completed', kill the session:
tmux kill-session -t fpds-2025
```

---

## Summary Commands

```bash
# START SCRAPING
tmux new-session -s fpds-2025 -d
tmux send-keys -t fpds-2025 "cd /Users/matthewbaumeister/Documents/PropShop_AI_Website && bash run-fpds-with-retry.sh" C-m
tmux attach-session -t fpds-2025

# DETACH (leave running)
# Press: Ctrl+B, then D

# REATTACH (check progress)
tmux attach-session -t fpds-2025

# LIST ALL SESSIONS
tmux list-sessions

# KILL A SESSION
tmux kill-session -t fpds-2025

# CHECK PROGRESS (SQL)
# Run: CHECK_FPDS_PROGRESS.sql in Supabase
```

---

## Ready to Start?

**Recommended First Step:**
1. Run SQL to check current state: `CHECK_FPDS_PROGRESS.sql`
2. Start 2025 scraper to finish it: `tmux new-session -s fpds-2025 -d` + auto-retry
3. Once 2025 is done (7 minutes), start 2024 in parallel session
4. Let them both run overnight!

Your data will be excellent quality and automatically resume on crashes. The scraper is bulletproof now!

