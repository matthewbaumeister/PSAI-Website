#!/bin/bash

# ============================================
# DoD Scraper - tmux Runner
# ============================================
# Runs the year scraper in a tmux session
# Allows detaching/reattaching without stopping
# Auto-resumes on crash
# ============================================

YEAR=${1:-2025}
SESSION_NAME="dod-scraper-${YEAR}"

# Check if tmux is installed
if ! command -v tmux &> /dev/null; then
    echo "❌ tmux is not installed. Install it with:"
    echo "   brew install tmux"
    exit 1
fi

# Check if session already exists
if tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
    echo "⚠️  Session '$SESSION_NAME' already exists"
    echo ""
    echo "Options:"
    echo "  1. Attach to existing session:"
    echo "     tmux attach -t $SESSION_NAME"
    echo ""
    echo "  2. Kill existing session and start new:"
    echo "     tmux kill-session -t $SESSION_NAME"
    echo "     ./run-scraper-tmux.sh $YEAR"
    exit 1
fi

echo "🚀 Starting DoD scraper for year $YEAR in tmux session..."
echo ""
echo "Session name: $SESSION_NAME"
echo ""
echo "Commands:"
echo "  - Detach (keep running): Ctrl+B, then D"
echo "  - Reattach: tmux attach -t $SESSION_NAME"
echo "  - Kill session: tmux kill-session -t $SESSION_NAME"
echo ""
echo "Starting in 3 seconds..."
sleep 3

# Create new tmux session and run scraper
tmux new-session -d -s "$SESSION_NAME" "
echo '╔════════════════════════════════════════════╗'
echo '║  DoD Contract News Scraper                 ║'
echo '║  Year: $YEAR                                  ║'
echo '║  Session: $SESSION_NAME                     ║'
echo '╚════════════════════════════════════════════╝'
echo ''
echo '📊 Progress will be saved to: scraper-checkpoint.json'
echo '📝 Logs will be saved to: scraper.log'
echo ''
echo 'Starting scraper...'
echo ''

# Run the scraper
npx tsx scrape-dod-year.ts $YEAR

# After scraper finishes (or crashes)
echo ''
echo '════════════════════════════════════════════'
echo 'Scraper stopped. Check scraper.log for details.'
echo ''
echo 'Press Ctrl+C to exit or Ctrl+B then D to detach'
echo '════════════════════════════════════════════'

# Keep session alive
exec bash
"

# Attach to the session
tmux attach -t "$SESSION_NAME"

