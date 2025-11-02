#!/bin/bash
# ============================================
# DoD Contract News Scraper - tmux Runner
# ============================================
# Run the production DoD scraper in a persistent tmux session
#
# Usage:
#   ./run-dod-scraper.sh                    # Last 30 days
#   ./run-dod-scraper.sh 2025-11-01 2025-10-01  # Specific date range
#   ./run-dod-scraper.sh 2025-01-01 2024-01-01  # Entire year
#
# Control:
#   tmux attach -t dod-scraper  # Attach to running session
#   Ctrl+B then D               # Detach (keeps running)
#   Ctrl+C                      # Stop scraper
# ============================================

START_DATE=$1
END_DATE=$2

SESSION_NAME="dod-scraper"
SCRIPT_PATH="/Users/matthewbaumeister/Documents/PropShop_AI_Website/scrape-dod-production.ts"

# Kill existing session if it exists
tmux has-session -t $SESSION_NAME 2>/dev/null
if [ $? == 0 ]; then
  echo "⚠️  Found existing session '$SESSION_NAME'"
  read -p "Kill it and start fresh? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    tmux kill-session -t $SESSION_NAME
    echo "✅ Killed existing session"
  else
    echo "❌ Aborting. Attach with: tmux attach -t $SESSION_NAME"
    exit 1
  fi
fi

# Build command
if [ -z "$START_DATE" ]; then
  CMD="npx tsx $SCRIPT_PATH"
  DATE_RANGE="Last 30 days"
else
  CMD="npx tsx $SCRIPT_PATH --start=$START_DATE --end=$END_DATE"
  DATE_RANGE="$START_DATE → $END_DATE"
fi

echo "
╔════════════════════════════════════════════╗
║   Starting DoD Contract News Scraper      ║
╚════════════════════════════════════════════╝

📅 Date Range: $DATE_RANGE
🖥️  Session: $SESSION_NAME
📁 Script: scrape-dod-production.ts

Starting tmux session in 3 seconds...
"

sleep 3

# Create new tmux session and run scraper
tmux new-session -d -s $SESSION_NAME "$CMD"

echo "
✅ Scraper session started!

📌 Commands:
   Attach:  tmux attach -t $SESSION_NAME
   Detach:  Ctrl+B then D (inside session)
   Stop:    Ctrl+C (inside session)
   Kill:    tmux kill-session -t $SESSION_NAME

🔍 Attaching to session now...
"

sleep 2
tmux attach -t $SESSION_NAME

