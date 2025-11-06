#!/bin/bash
#
# Congressional Trades Monthly Update Script
# Runs on 15th of each month to catch new PTR filings
# Scrapes current year + previous year (for late filings)
#

set -e  # Exit on error

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
LOG_DIR="$PROJECT_DIR/logs"
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
LOG_FILE="$LOG_DIR/congress-monthly-$TIMESTAMP.log"

# Ensure log directory exists
mkdir -p "$LOG_DIR"

# Function to log messages
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "=========================================="
log "Congressional Trades Monthly Update"
log "=========================================="
log ""

# Change to project directory
cd "$PROJECT_DIR"

# Load environment variables
if [ -f .env.local ]; then
    export $(cat .env.local | grep -v '^#' | xargs)
    log "✅ Loaded environment variables"
else
    log "❌ ERROR: .env.local not found"
    exit 1
fi

# Get current and previous year
CURRENT_YEAR=$(date +%Y)
PREV_YEAR=$((CURRENT_YEAR - 1))

log "Scraping years: $PREV_YEAR - $CURRENT_YEAR"
log ""

# Run the scraper
log "Starting Python scraper..."
python3 scripts/scrape_congress_trades.py \
    --mode historical \
    --start-year "$PREV_YEAR" \
    --end-year "$CURRENT_YEAR" 2>&1 | tee -a "$LOG_FILE"

SCRAPER_EXIT=$?

if [ $SCRAPER_EXIT -eq 0 ]; then
    log ""
    log "✅ Monthly update completed successfully"
    log "Log saved to: $LOG_FILE"
    
    # Send success notification (optional - add your notification method)
    # curl -X POST your-webhook-url -d "Congressional trades updated successfully"
    
    exit 0
else
    log ""
    log "❌ Monthly update failed with exit code $SCRAPER_EXIT"
    log "Check log file: $LOG_FILE"
    
    # Send error notification (optional - add your notification method)
    # curl -X POST your-webhook-url -d "Congressional trades update FAILED"
    
    exit 1
fi

