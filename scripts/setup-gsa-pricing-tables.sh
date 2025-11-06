#!/bin/bash

echo "============================================================"
echo "GSA PRICING TABLES SETUP"
echo "============================================================"
echo ""
echo "This script will create the necessary database tables for"
echo "storing GSA pricing data (labor categories and rates)."
echo ""
echo "Please run this SQL file in your Supabase SQL Editor:"
echo ""
echo "  📄 supabase/migrations/create_gsa_pricing_tables.sql"
echo ""
echo "Or copy and paste this SQL:"
echo ""
cat supabase/migrations/create_gsa_pricing_tables.sql
echo ""
echo "============================================================"
echo "After running the SQL, press Enter to continue..."
read

echo "Testing if tables were created..."

python3 << 'EOF'
import os
from supabase import create_client

supabase = create_client(
    os.getenv('NEXT_PUBLIC_SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_ROLE_KEY')
)

# Test if tables exist
try:
    result = supabase.table('gsa_price_lists').select('id').limit(1).execute()
    print("✓ gsa_price_lists table exists")
except Exception as e:
    print(f"✗ gsa_price_lists table: {e}")

try:
    result = supabase.table('gsa_labor_categories').select('id').limit(1).execute()
    print("✓ gsa_labor_categories table exists")
except Exception as e:
    print(f"✗ gsa_labor_categories table: {e}")

try:
    result = supabase.table('gsa_pricing_scraper_log').select('id').limit(1).execute()
    print("✓ gsa_pricing_scraper_log table exists")
except Exception as e:
    print(f"✗ gsa_pricing_scraper_log table: {e}")

print("\n✓ All tables created successfully!")
EOF

