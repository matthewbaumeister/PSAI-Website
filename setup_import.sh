#!/bin/bash

echo "🚀 DOD SBIR Database Import Setup"
echo "================================="

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Creating .env file from template..."
    cp env.example .env
    echo "✅ Created .env file"
    echo ""
    echo "⚠️  IMPORTANT: You need to edit .env file with your Supabase credentials:"
    echo "   - NEXT_PUBLIC_SUPABASE_URL"
    echo "   - NEXT_PUBLIC_SUPABASE_ANON_KEY"
    echo "   - SUPABASE_SERVICE_ROLE_KEY"
    echo ""
    echo "You can find these in your Supabase project dashboard under Settings > API"
    echo ""
    read -p "Press Enter after you've updated the .env file..."
fi

# Check if environment variables are set
if grep -q "your_supabase_project_url" .env; then
    echo "❌ Please update your .env file with actual Supabase credentials first!"
    echo "Edit .env file and replace the placeholder values."
    exit 1
fi

echo "✅ Environment variables look good!"
echo ""

# Run the import
echo "Starting import process..."
python3 import_sbir_to_supabase.py
