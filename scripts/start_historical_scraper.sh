#!/bin/bash
# Quick start script for historical scraper in tmux

set -e

SESSION_NAME="military-scraper"

# Check if tmux session already exists
if tmux has-session -t $SESSION_NAME 2>/dev/null; then
    echo "Session '$SESSION_NAME' already exists!"
    echo "Options:"
    echo "  1. Attach to existing session: tmux a -t $SESSION_NAME"
    echo "  2. Kill and restart: tmux kill-session -t $SESSION_NAME && $0"
    exit 1
fi

echo "Creating tmux session: $SESSION_NAME"

# Create new tmux session in detached mode
tmux new-session -d -s $SESSION_NAME

# Set up environment
tmux send-keys -t $SESSION_NAME "cd /Users/matthewbaumeister/Documents/PropShop_AI_Website" C-m
tmux send-keys -t $SESSION_NAME "source venv/bin/activate" C-m
tmux send-keys -t $SESSION_NAME "export SUPABASE_URL='https://reprsoqodhmpdoiajhst.supabase.co'" C-m
tmux send-keys -t $SESSION_NAME "export SUPABASE_SERVICE_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlcHJzb3FvZGhtcGRvaWFqaHN0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTUxNjU0OCwiZXhwIjoyMDcxMDkyNTQ4fQ.J7bBpqSN4uL4D_Wp4e4pRPdOzGrbgBb0Uyia1fGdq1o'" C-m

# Split window horizontally
tmux split-window -h -t $SESSION_NAME

# Top pane: Start scraper
tmux select-pane -t $SESSION_NAME:0.0
tmux send-keys -t $SESSION_NAME "echo 'Starting historical scraper...'" C-m
tmux send-keys -t $SESSION_NAME "echo 'Scraping ALL DVIDS articles from 2015 to present'" C-m
tmux send-keys -t $SESSION_NAME "echo ''" C-m
tmux send-keys -t $SESSION_NAME "python3 scripts/military_news_historical_full.py --source dvids --start-year 2015 --delay 2.0" C-m

# Bottom pane: Monitor checkpoint
tmux select-pane -t $SESSION_NAME:0.1
tmux send-keys -t $SESSION_NAME "cd /Users/matthewbaumeister/Documents/PropShop_AI_Website" C-m
tmux send-keys -t $SESSION_NAME "echo 'Monitoring scraper progress...'" C-m
tmux send-keys -t $SESSION_NAME "echo 'Checkpoint file updates every 10 articles'" C-m
tmux send-keys -t $SESSION_NAME "echo ''" C-m
tmux send-keys -t $SESSION_NAME "sleep 5 && watch -n 10 'cat data/military_news_checkpoint.json 2>/dev/null | python3 -m json.tool 2>/dev/null || echo \"Waiting for first checkpoint...\"'" C-m

echo ""
echo "✅ Tmux session '$SESSION_NAME' created and scraper started!"
echo ""
echo "Commands:"
echo "  Attach to session:  tmux a -t $SESSION_NAME"
echo "  Detach from session: Press Ctrl+B then D"
echo "  Kill session:       tmux kill-session -t $SESSION_NAME"
echo ""
echo "The scraper is now running in the background."
echo "Attach to see progress: tmux a -t $SESSION_NAME"

