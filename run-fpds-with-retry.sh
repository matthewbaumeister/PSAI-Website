#!/bin/bash

# FPDS Scraper with Auto-Retry
# This script automatically retries the scraper when it crashes
# Run in tmux for best results: tmux new -s fpds-2025

echo "╔════════════════════════════════════════════╗"
echo "║   FPDS Auto-Retry Scraper (2025 Data)     ║"
echo "╚════════════════════════════════════════════╝"
echo ""
echo "This script will:"
echo "  ✅ Run the FPDS scraper"
echo "  💥 Automatically retry when it crashes"
echo "  ⏳ Wait 30 seconds between retries"
echo "  ♾️  Keep going until ALL data is scraped"
echo ""
echo "Press Ctrl+C to stop anytime"
echo ""
echo "Starting in 5 seconds..."
sleep 5

# Counter for tracking attempts
ATTEMPT=1

while true; do
  echo ""
  echo "════════════════════════════════════════════"
  echo "🚀 Attempt #$ATTEMPT - Starting scraper..."
  echo "════════════════════════════════════════════"
  echo ""
  
  # Run the scraper
  npx tsx src/scripts/fpds-full-load-date-range.ts --start=2025-01-01 --end=2025-10-31
  
  # Check exit code
  EXIT_CODE=$?
  
  if [ $EXIT_CODE -eq 0 ]; then
    echo ""
    echo "╔════════════════════════════════════════════╗"
    echo "║          ✅ SCRAPE COMPLETE!              ║"
    echo "╚════════════════════════════════════════════╝"
    echo ""
    echo "All 2025 contracts have been scraped!"
    break
  else
    echo ""
    echo "💥 Crashed (exit code: $EXIT_CODE)"
    echo "⏳ Waiting 30 seconds before retry..."
    echo ""
    sleep 30
    ATTEMPT=$((ATTEMPT + 1))
  fi
done

echo ""
echo "🎉 Script completed! Check Supabase for your data."

