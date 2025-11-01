#!/bin/bash
# ============================================
# FPDS Daily Scraper - Auto-Retry Wrapper
# ============================================
# Scrapes one day at a time, going backwards from today
# Auto-restarts on crashes

SCRAPER_COMMAND="npx tsx src/scripts/fpds-daily-scraper.ts"
RETRY_DELAY=30 # seconds

echo "╔════════════════════════════════════════════╗"
echo "║   FPDS Daily Scraper - Auto-Retry Mode    ║"
echo "╚════════════════════════════════════════════╝"
echo "Command: $SCRAPER_COMMAND"
echo "Strategy: One day at a time, backwards from today"
echo "Retry Delay: ${RETRY_DELAY}s"
echo "To stop, press Ctrl+C (in tmux: Ctrl+B, then ':kill-session')"
echo ""

ATTEMPT=1
while true; do
    echo "════════════════════════════════════════════"
    echo "🚀 Attempt #${ATTEMPT} - Starting daily scraper..."
    echo "════════════════════════════════════════════"
    
    # Run the scraper command
    $SCRAPER_COMMAND
    EXIT_CODE=$?

    if [ $EXIT_CODE -eq 0 ]; then
        echo "✅ Daily scraper completed successfully!"
        echo "🎯 All requested days processed."
        break # Exit the loop if scraper finishes without error
    else
        echo "💥 Daily scraper crashed (exit code: ${EXIT_CODE})."
        echo "⏳ Waiting ${RETRY_DELAY} seconds before retry..."
        sleep $RETRY_DELAY
    fi
    
    ATTEMPT=$((ATTEMPT + 1))
done

