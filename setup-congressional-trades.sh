#!/bin/bash

# ============================================
# Congressional Trades Setup Script
# ============================================
# 
# Sets up the congressional stock trades tracking system
# Run this ONCE to install dependencies and set up the database
#
# ============================================

set -e  # Exit on error

echo "============================================"
echo "Congressional Trades Setup"
echo "============================================"
echo ""

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python 3 is not installed"
    echo "Please install Python 3.8+ and try again"
    exit 1
fi

echo "Python version: $(python3 --version)"
echo ""

# Install Python dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt

echo ""
echo "Installing Playwright browsers..."
playwright install

echo ""
echo "Testing Python dependencies..."
python3 -c "from capitolgains import Representative; print('CapitolGains: OK')"
python3 -c "import playwright; print('Playwright: OK')"

echo ""
echo "============================================"
echo "Setup Complete!"
echo "============================================"
echo ""
echo "Next steps:"
echo ""
echo "1. Apply database migration:"
echo "   psql \$DATABASE_URL -f supabase/migrations/create_congressional_trades.sql"
echo ""
echo "2. Run historical backfill (will take 1-2 hours):"
echo "   npm run scrape:congress:historical"
echo ""
echo "3. Set up daily cron job:"
echo "   crontab -e"
echo "   Add: 0 3 * * * cd $(pwd) && npm run scrape:congress:daily >> /var/log/congress-trades.log 2>&1"
echo ""
echo "============================================"

