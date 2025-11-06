#!/bin/bash

# ============================================
# Run Congressional Trades Scraper in Background
# ============================================
# This script runs the scraper in tmux so you can walk away
# The scraper will continue running even if you disconnect
# ============================================

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
SESSION_NAME="congress-trades"
LOG_FILE="$SCRIPT_DIR/logs/congress-trades-$(date +%Y%m%d-%H%M%S).log"

# Create logs directory if it doesn't exist
mkdir -p "$SCRIPT_DIR/logs"

echo "============================================"
echo "Starting Congressional Trades Scraper"
echo "============================================"
echo ""
echo "Session: $SESSION_NAME"
echo "Log file: $LOG_FILE"
echo ""

# Check if tmux session already exists
if tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
    echo "⚠️  Session '$SESSION_NAME' already exists!"
    echo ""
    echo "Options:"
    echo "  1. Attach to existing session: tmux attach -t $SESSION_NAME"
    echo "  2. Kill existing session: tmux kill-session -t $SESSION_NAME"
    echo ""
    exit 1
fi

# Start tmux session in detached mode
echo "🚀 Starting scraper in tmux session..."
echo ""

tmux new-session -d -s "$SESSION_NAME" -c "$SCRIPT_DIR" \
    "npm run scrape:congress-trades:historical 2>&1 | tee '$LOG_FILE'; echo ''; echo 'Scraper finished. Press Enter to close.'; read"

echo "✅ Scraper started successfully!"
echo ""
echo "============================================"
echo "What Now?"
echo "============================================"
echo ""
echo "The scraper is running in the background."
echo "It will take 1-2 hours to complete."
echo ""
echo "📺 View progress (live):"
echo "   tmux attach -t $SESSION_NAME"
echo "   (Press Ctrl+B then D to detach)"
echo ""
echo "📄 View log file:"
echo "   tail -f $LOG_FILE"
echo ""
echo "🔍 Check status:"
echo "   tmux ls"
echo ""
echo "⏹️  Stop scraper:"
echo "   tmux kill-session -t $SESSION_NAME"
echo ""
echo "============================================"
echo ""
echo "You can close this terminal and walk away!"
echo "The scraper will keep running."
echo ""

