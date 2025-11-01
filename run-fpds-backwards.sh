#!/bin/bash
# ============================================
# FPDS Backwards Scraper - Auto-Retry Wrapper
# ============================================
# 
# Runs the backwards daily scraper with auto-restart on crash
# Use with tmux for long-running scrapes
#
# Usage:
#   ./run-fpds-backwards.sh
#   ./run-fpds-backwards.sh 2025-11-01 2024-01-01

START_DATE=${1:-$(date +%Y-%m-%d)}  # Default to today
END_DATE=${2:-"2000-01-01"}         # Default to year 2000

echo "╔════════════════════════════════════════════╗"
echo "║  FPDS Backwards Scraper (Auto-Restart)    ║"
echo "╚════════════════════════════════════════════╝"
echo ""
echo "📅 Start Date: $START_DATE (working backwards)"
echo "📅 End Date:   $END_DATE"
echo "🔄 Auto-restart: ENABLED"
echo ""
echo "Starting in 3 seconds..."
echo "Press Ctrl+C to stop permanently"
echo ""
sleep 3

ATTEMPT=1

while true; do
  echo ""
  echo "╔════════════════════════════════════════════╗"
  echo "║  Attempt #$ATTEMPT                          "
  echo "╚════════════════════════════════════════════╝"
  echo ""
  
  # Run the scraper
  npx tsx src/scripts/fpds-backwards-auto-retry.ts --start=$START_DATE --end=$END_DATE
  
  EXIT_CODE=$?
  
  if [ $EXIT_CODE -eq 0 ]; then
    echo ""
    echo "✅ Scraper completed successfully!"
    echo "   Reached end date: $END_DATE"
    exit 0
  else
    echo ""
    echo "⚠️  Scraper stopped with exit code: $EXIT_CODE"
    echo "   Restarting in 10 seconds..."
    echo "   (Press Ctrl+C now to stop)"
    sleep 10
    
    ATTEMPT=$((ATTEMPT + 1))
    
    # Continue with same dates - the scraper will resume from where it left off
    # (it skips dates that already have data)
  fi
done

