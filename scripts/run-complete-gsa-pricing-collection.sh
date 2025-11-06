#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

echo "============================================================"
echo "GSA PRICING DATA COLLECTION PIPELINE"
echo "============================================================"
echo ""
echo "This pipeline will:"
echo "  1. Download individual price list Excel files (~3,000 files)"
echo "  2. Parse labor categories and rates from each file"
echo "  3. Import all pricing data into Supabase"
echo ""
echo "Estimated time: 2-4 hours"
echo ""

# Check if tables exist
echo "Checking database setup..."
python3 << 'EOF'
import os
import sys
from supabase import create_client

try:
    supabase = create_client(
        os.getenv('NEXT_PUBLIC_SUPABASE_URL'),
        os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    )
    
    # Check for pricing tables
    result = supabase.table('gsa_price_lists').select('id').limit(1).execute()
    print("✓ Database tables found")
except Exception as e:
    print("\n✗ ERROR: Pricing tables do not exist!")
    print("\nPlease run this SQL file in Supabase SQL Editor first:")
    print("  supabase/migrations/create_gsa_pricing_tables.sql")
    print("")
    sys.exit(1)
EOF

if [ $? -ne 0 ]; then
    exit 1
fi

echo ""
echo "============================================================"
echo "STEP 1/3: DOWNLOADING PRICE LIST FILES (1-2 hours)"
echo "============================================================"
echo ""

# Ask for test mode
read -p "Test mode? Download only 10 files? (y/n): " TEST_MODE

if [ "$TEST_MODE" = "y" ] || [ "$TEST_MODE" = "Y" ]; then
    echo "y" | python3 scripts/gsa-pricing-downloader.py
else
    echo "n" | python3 scripts/gsa-pricing-downloader.py
fi

echo ""
echo "============================================================"
echo "DOWNLOADS COMPLETE! Proceeding to parsing."
echo "============================================================"
echo ""

# Step 2: Parse Downloaded Files
echo "============================================================"
echo "STEP 2/3: PARSING PRICE LIST FILES (30-60 minutes)"
echo "============================================================"
echo ""

if [ "$TEST_MODE" = "y" ] || [ "$TEST_MODE" = "Y" ]; then
    echo "y" | python3 scripts/gsa-pricing-parser.py
else
    echo "n" | python3 scripts/gsa-pricing-parser.py
fi

echo ""
echo "============================================================"
echo "PARSING COMPLETE! Proceeding to database import."
echo "============================================================"
echo ""

# Step 3: Import to Supabase
echo "============================================================"
echo "STEP 3/3: IMPORTING TO SUPABASE (10-20 minutes)"
echo "============================================================"
echo ""

echo "y" | python3 scripts/gsa-pricing-importer.py

echo ""
echo "============================================================"
echo "COMPLETE PIPELINE FINISHED!"
echo "============================================================"
echo ""
echo "Check your Supabase database for pricing data:"
echo "  - gsa_price_lists: Track of all price list files"
echo "  - gsa_labor_categories: Individual labor categories with rates"
echo ""
echo "To verify the data, run this SQL query in Supabase:"
echo ""
echo "SELECT COUNT(*) as total_labor_categories,"
echo "       COUNT(DISTINCT contractor_id) as contractors_with_pricing,"
echo "       MIN(hourly_rate) as min_rate,"
echo "       MAX(hourly_rate) as max_rate,"
echo "       AVG(hourly_rate)::numeric(10,2) as avg_rate"
echo "FROM gsa_labor_categories;"
echo ""

