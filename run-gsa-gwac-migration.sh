#!/bin/bash

# ============================================
# Run GSA/GWAC Migration via Supabase CLI
# ============================================

set -e

echo "============================================"
echo "GSA/GWAC Migration Runner"
echo "============================================"
echo ""

# Check if supabase CLI is installed
if command -v supabase &> /dev/null; then
    echo "Using Supabase CLI..."
    echo ""
    
    # Check if linked to project
    if [ -f ".supabase/config.toml" ]; then
        echo "Running migration..."
        supabase db push
        
        if [ $? -eq 0 ]; then
            echo ""
            echo "✓ Migration completed via Supabase CLI!"
            
            # Verify tables
            echo ""
            echo "Verifying tables..."
            supabase db execute --sql "SELECT COUNT(*) as gsa_holders FROM gsa_schedule_holders;" --output table
            supabase db execute --sql "SELECT COUNT(*) as gwac_holders FROM gwac_holders;" --output table
            supabase db execute --sql "SELECT COUNT(*) as gwacs FROM gwac_catalog;" --output table
            
            echo ""
            echo "✓ Tables verified!"
            echo ""
            echo "Database is ready for GSA/GWAC data collection!"
            exit 0
        else
            echo "✗ Migration failed"
            exit 1
        fi
    else
        echo "Project not linked. Run: supabase link"
        exit 1
    fi
else
    echo "Supabase CLI not found."
    echo ""
    echo "Option 1: Install Supabase CLI"
    echo "  brew install supabase/tap/supabase"
    echo "  supabase link"
    echo "  supabase db push"
    echo ""
    echo "Option 2: Use Supabase Dashboard"
    echo "  1. Go to https://supabase.com/dashboard"
    echo "  2. Open SQL Editor"
    echo "  3. Copy/paste from: supabase/migrations/create_gsa_gwac_tables.sql"
    echo "  4. Click 'Run'"
    echo ""
    echo "Option 3: Use psql (if you have database connection string)"
    echo "  psql 'your-connection-string' -f supabase/migrations/create_gsa_gwac_tables.sql"
    echo ""
fi

