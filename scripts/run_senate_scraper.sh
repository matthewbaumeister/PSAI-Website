#!/bin/bash
# Quick script to run Senate scraper and save to Supabase

echo "=========================================="
echo "Senate Congressional Trades Scraper"
echo "=========================================="
echo ""

# Check if mode argument provided
MODE=${1:-daily}

if [ "$MODE" == "test" ]; then
    echo "MODE: Test (single senator)"
    echo "Running test scraper..."
    echo ""
    cd "$(dirname "$0")"
    python3 test_senate_scraper.py
    
elif [ "$MODE" == "daily" ]; then
    echo "MODE: Daily (current year only)"
    echo "This will scrape 2024 Senate trades"
    echo "Estimated time: 10-15 minutes"
    echo ""
    read -p "Continue? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        npm run scrape:congress-trades:daily
    fi
    
elif [ "$MODE" == "historical" ]; then
    echo "MODE: Historical (2012-present)"
    echo "This will scrape ALL years for Senate"
    echo "Estimated time: 2-4 hours"
    echo ""
    read -p "Continue? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        npm run scrape:congress-trades:historical
    fi
    
else
    echo "Unknown mode: $MODE"
    echo ""
    echo "Usage:"
    echo "  ./scripts/run_senate_scraper.sh test       # Test with single senator"
    echo "  ./scripts/run_senate_scraper.sh daily      # Scrape current year"
    echo "  ./scripts/run_senate_scraper.sh historical # Scrape 2012-present"
    echo ""
    exit 1
fi

echo ""
echo "=========================================="
echo "Scraper Complete"
echo "=========================================="
echo ""
echo "Check results in Supabase:"
echo "  SELECT COUNT(*) FROM congressional_stock_trades WHERE chamber='Senate';"
echo ""

