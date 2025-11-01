#!/bin/bash
# ============================================
# FPDS Auto-Retry Scraper - Parameterized
# ============================================
# Usage: bash run-fpds-year.sh 2025 2025-01-01 2025-10-31
# Or:    bash run-fpds-year.sh 2024 2024-01-01 2024-12-31

if [ $# -lt 3 ]; then
    echo "Usage: bash run-fpds-year.sh <year> <start-date> <end-date>"
    echo "Example: bash run-fpds-year.sh 2025 2025-01-01 2025-10-31"
    exit 1
fi

YEAR=$1
START_DATE=$2
END_DATE=$3
RETRY_DELAY=30 # seconds

# Ensure npx and tsx are available
if ! command -v npx &> /dev/null
then
    echo "npx could not be found, please install Node.js and npm."
    exit 1
fi

SCRAPER_COMMAND="npx tsx src/scripts/fpds-full-load-date-range.ts --start=$START_DATE --end=$END_DATE"

echo "╔════════════════════════════════════════════╗"
echo "║   FPDS Year $YEAR Scraper - Auto-Retry     ║"
echo "╚════════════════════════════════════════════╝"
echo "Date Range: $START_DATE to $END_DATE"
echo "Command: $SCRAPER_COMMAND"
echo "Retry Delay: ${RETRY_DELAY}s"
echo "To stop, press Ctrl+C (in tmux: Ctrl+B, then type ':kill-session')"
echo ""

ATTEMPT=1
while true; do
    echo "════════════════════════════════════════════"
    echo "🚀 Attempt #${ATTEMPT} - Starting Year $YEAR scraper..."
    echo "════════════════════════════════════════════"
    
    # Run the scraper command
    $SCRAPER_COMMAND
    EXIT_CODE=$?

    if [ $EXIT_CODE -eq 0 ]; then
        echo "✅ Year $YEAR scraper completed successfully!"
        echo "💡 Data may still have gaps from transient errors."
        echo "⏳ Waiting ${RETRY_DELAY}s before restarting to catch any gaps..."
        sleep $RETRY_DELAY
        echo "🔄 Restarting to fill any remaining gaps..."
    else
        echo "💥 Year $YEAR scraper crashed (exit code: ${EXIT_CODE})."
        echo "⏳ Waiting ${RETRY_DELAY} seconds before retry..."
        sleep $RETRY_DELAY
    fi
    
    ATTEMPT=$((ATTEMPT + 1))
done

