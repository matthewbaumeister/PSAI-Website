#!/bin/bash
# ============================================
# FPDS Page-Level Scraper - Auto-Retry Wrapper
# ============================================
# 
# Runs the page-level scraper with auto-restart on crash
# Use with tmux for long-running scrapes
#
# Usage:
#   ./run-fpds-page-level.sh
#   ./run-fpds-page-level.sh 2025-10-30 2024-01-01

START_DATE=${1:-$(date +%Y-%m-%d)}
END_DATE=${2:-"2000-01-01"}

echo "╔════════════════════════════════════════════╗"
echo "║  FPDS Page-Level Scraper (Auto-Restart)   ║"
echo "╚════════════════════════════════════════════╝"
echo ""
echo "📅 Start Date: $START_DATE (working backwards)"
echo "📅 End Date:   $END_DATE"
echo "📄 Granularity: PAGE-LEVEL"
echo "🔄 Auto-restart: ENABLED"
echo ""
echo "✨ This is the MOST RESILIENT scraper!"
echo "   - Saves after each page"
echo "   - Resumes from exact page"
echo "   - Never loses progress"
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
  npx tsx src/scripts/fpds-page-level-scraper.ts --start=$START_DATE --end=$END_DATE
  
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
  fi
done

