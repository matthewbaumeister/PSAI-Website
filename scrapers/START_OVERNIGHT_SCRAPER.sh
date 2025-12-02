#!/bin/bash

# Company Public Info Scraper - Overnight Run Script
# Safe to run overnight - includes monitoring and automatic recovery

echo "=========================================="
echo "Company Public Info Scraper - Overnight Run"
echo "=========================================="
echo ""

# Configuration
BATCH_SIZE=20
MAX_COMPANIES=500
LOG_FILE="scraper_overnight_$(date +%Y%m%d_%H%M%S).log"

# Check environment
echo "Checking environment..."
cd /Users/matthewbaumeister/Documents/PropShop_AI_Website

if [ ! -d "venv" ]; then
    echo "ERROR: Virtual environment not found!"
    exit 1
fi

if [ ! -f "scrapers/.env" ]; then
    echo "ERROR: scrapers/.env not found!"
    exit 1
fi

echo "✓ Environment OK"
echo ""

# Activate virtual environment
source venv/bin/activate

# Display configuration
echo "Configuration:"
echo "  Batch Size: $BATCH_SIZE companies per batch"
echo "  Max Companies: $MAX_COMPANIES"
echo "  Log File: $LOG_FILE"
echo ""

# Show queue status
echo "Current Queue Status:"
python3 << 'EOF'
from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv("scrapers/.env")
supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_KEY"))

queue = supabase.table('company_public_info_scraper_queue').select('status').execute()
counts = {}
for item in queue.data:
    status = item['status']
    counts[status] = counts.get(status, 0) + 1

for status, count in sorted(counts.items()):
    print(f"  {status}: {count}")
EOF

echo ""
echo "Starting scraper in 5 seconds..."
echo "Press Ctrl+C to cancel"
sleep 5

# Run scraper
echo ""
echo "=========================================="
echo "Scraper Started: $(date)"
echo "Log: $LOG_FILE"
echo "=========================================="
echo ""

nohup python3 scrapers/historical_scraper.py \
    --batch-size $BATCH_SIZE \
    --max-per-day $MAX_COMPANIES \
    > "$LOG_FILE" 2>&1 &

SCRAPER_PID=$!

echo "Scraper running in background (PID: $SCRAPER_PID)"
echo ""
echo "Monitor progress:"
echo "  tail -f $LOG_FILE"
echo ""
echo "Check status:"
echo "  ps aux | grep $SCRAPER_PID"
echo ""
echo "Stop scraper:"
echo "  kill $SCRAPER_PID"
echo ""

# Show initial output
echo "Initial output:"
sleep 3
tail -20 "$LOG_FILE"

echo ""
echo "=========================================="
echo "Scraper is running!"
echo "Check $LOG_FILE for progress"
echo "=========================================="


