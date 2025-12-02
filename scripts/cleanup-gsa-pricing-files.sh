#!/bin/bash

# GSA Pricing Files Cleanup
# Deletes local Excel and JSON files after successful import to Supabase

echo "============================================================"
echo "GSA PRICING FILES CLEANUP"
echo "============================================================"
echo ""
echo "This will delete local files after successful import:"
echo "  - Downloaded Excel files (*.xlsx)"
echo "  - Parsed JSON files (*.json)"
echo ""
echo "The data is safely stored in Supabase."
echo ""

# Check what files exist
EXCEL_COUNT=$(find data/gsa_pricing -maxdepth 1 -name "*.xlsx" 2>/dev/null | wc -l | tr -d ' ')
JSON_COUNT=$(find data/gsa_pricing/parsed -name "*.json" 2>/dev/null | wc -l | tr -d ' ')

echo "Files found:"
echo "  Excel files: $EXCEL_COUNT"
echo "  JSON files:  $JSON_COUNT"
echo ""

# Calculate approximate size
if [ -d "data/gsa_pricing" ]; then
    SIZE=$(du -sh data/gsa_pricing 2>/dev/null | cut -f1)
    echo "Total size: $SIZE"
    echo ""
fi

# Confirm deletion
read -p "Delete all local pricing files? (y/n): " CONFIRM

if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
    echo "Cleanup cancelled. Files retained."
    exit 0
fi

echo ""
echo "Deleting files..."

# Delete Excel files
if [ $EXCEL_COUNT -gt 0 ]; then
    rm -f data/gsa_pricing/*.xlsx
    echo "✓ Deleted $EXCEL_COUNT Excel files"
fi

# Delete JSON files
if [ $JSON_COUNT -gt 0 ]; then
    rm -f data/gsa_pricing/parsed/*.json
    echo "✓ Deleted $JSON_COUNT JSON files"
fi

# Keep the directory structure
echo "✓ Kept directory structure for future runs"

echo ""
echo "============================================================"
echo "CLEANUP COMPLETE"
echo "============================================================"
echo ""
echo "Local files deleted. Data remains in Supabase."
echo "To re-download: Run the complete pipeline again"
echo ""

