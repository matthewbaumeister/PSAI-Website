# Start FPDS Scraping - Copy/Paste Commands

## Step 1: Check Current Progress (Run in Supabase SQL Editor)

Copy the contents of `CHECK_FPDS_PROGRESS.sql` and run in Supabase.

Or run this quick check:
```sql
SELECT 
  calendar_year,
  COUNT(*) as contracts,
  ROUND(AVG(data_quality_score), 1) as avg_quality
FROM fpds_contracts
GROUP BY calendar_year
ORDER BY calendar_year DESC;
```

---

## Step 2: Start Year 2025 (Finish What We Started)

**Copy/paste this entire block into your terminal:**

```bash
# Kill old session if exists
tmux kill-session -t fpds-2025 2>/dev/null

# Create new session
tmux new-session -s fpds-2025 -d

# Navigate to project
tmux send-keys -t fpds-2025 "cd /Users/matthewbaumeister/Documents/PropShop_AI_Website" C-m

# Start scraper with auto-retry
tmux send-keys -t fpds-2025 "bash run-fpds-year.sh 2025 2025-01-01 2025-10-31" C-m

# Attach to watch
tmux attach-session -t fpds-2025
```

**Once attached:**
- Watch the progress
- Press `Ctrl+B`, then `D` to detach and leave running
- It will auto-restart on crashes

---

## Step 3: Start Year 2024 (In Parallel)

**Copy/paste this entire block:**

```bash
# Create session for 2024
tmux new-session -s fpds-2024 -d

# Navigate to project
tmux send-keys -t fpds-2024 "cd /Users/matthewbaumeister/Documents/PropShop_AI_Website" C-m

# Start 2024 scraper
tmux send-keys -t fpds-2024 "bash run-fpds-year.sh 2024 2024-01-01 2024-12-31" C-m

# Attach to watch
tmux attach-session -t fpds-2024
```

---

## Step 4: Start Year 2023 (Optional, If You Want 3 at Once)

```bash
# Create session for 2023
tmux new-session -s fpds-2023 -d

# Navigate to project
tmux send-keys -t fpds-2023 "cd /Users/matthewbaumeister/Documents/PropShop_AI_Website" C-m

# Start 2023 scraper
tmux send-keys -t fpds-2023 "bash run-fpds-year.sh 2023 2023-01-01 2023-12-31" C-m

# Attach to watch
tmux attach-session -t fpds-2023
```

---

## Managing Sessions

### See All Running Sessions
```bash
tmux list-sessions
```

### Attach to a Session
```bash
tmux attach-session -t fpds-2025
tmux attach-session -t fpds-2024
tmux attach-session -t fpds-2023
```

### Detach (Leave Running)
Press: `Ctrl+B`, then `D`

### Kill a Session
```bash
tmux kill-session -t fpds-2025
tmux kill-session -t fpds-2024
tmux kill-session -t fpds-2023
```

### Peek at Progress Without Attaching
```bash
tmux capture-pane -t fpds-2025 -p | tail -30
tmux capture-pane -t fpds-2024 -p | tail -30
```

---

## What to Expect

### Year 2025 (~838 contracts)
- Time: ~7-10 minutes
- Will see some errors (normal!)
- Auto-restarts to fill gaps
- Quality score: 89-90/100

### Year 2024 (~200k contracts)
- Time: ~28-40 hours (depending on API stability)
- Will see MANY errors (totally normal!)
- Auto-restarts automatically
- Will complete eventually

### Year 2023 (~190k contracts)
- Time: ~26-38 hours
- Same behavior as 2024

---

## Troubleshooting

### "Session already exists"
```bash
# Kill it first
tmux kill-session -t fpds-2025
# Then re-run the create command
```

### "Command not found: tmux"
```bash
brew install tmux
```

### Session died / not running
```bash
# Check what's running
tmux list-sessions

# If it died, just restart with the "Start Year XXXX" commands above
```

### Want to stop everything
```bash
tmux kill-server
```

---

## Recommended Approach

1. **Start 2025 first** (it's quick, 7 minutes)
2. **Check data in Supabase** after 2025 completes
3. **Start 2024** to run overnight
4. **Tomorrow, start 2023** in parallel with 2024
5. **Let them run for 1-2 days**

You'll have 3 years of pristine FPDS data with auto-recovery from API failures!

---

## Quick Commands Summary

```bash
# START 2025
tmux new-session -s fpds-2025 -d && tmux send-keys -t fpds-2025 "cd /Users/matthewbaumeister/Documents/PropShop_AI_Website" C-m && tmux send-keys -t fpds-2025 "bash run-fpds-year.sh 2025 2025-01-01 2025-10-31" C-m && tmux attach-session -t fpds-2025

# START 2024 (after detaching from 2025)
tmux new-session -s fpds-2024 -d && tmux send-keys -t fpds-2024 "cd /Users/matthewbaumeister/Documents/PropShop_AI_Website" C-m && tmux send-keys -t fpds-2024 "bash run-fpds-year.sh 2024 2024-01-01 2024-12-31" C-m && tmux attach-session -t fpds-2024

# LIST ALL
tmux list-sessions

# CHECK PROGRESS
tmux capture-pane -t fpds-2025 -p | tail -30
```

