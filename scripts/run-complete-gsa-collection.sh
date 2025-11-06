#!/bin/bash
#
# Complete GSA MAS Data Collection Pipeline
# Downloads, parses, and imports all GSA contractor data automatically
#

set -e  # Exit on error

echo "========================================================================"
echo "GSA MAS COMPLETE DATA COLLECTION PIPELINE"
echo "========================================================================"
echo ""
echo "This will run all three steps:"
echo "  1. Download all GSA MAS contractor Excel files (2-4 hours)"
echo "  2. Parse all Excel files to JSON (10-20 minutes)"
echo "  3. Import all data to Supabase (5-10 minutes)"
echo ""
echo "Total time: 2-5 hours depending on number of SINs"
echo ""
echo "You can safely detach from tmux and come back later!"
echo ""
echo "========================================================================"
echo ""

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

echo "Working directory: $PROJECT_DIR"
echo ""

# Step 1: Download
echo "========================================================================"
echo "STEP 1/3: DOWNLOADING GSA MAS CONTRACTOR DATA"
echo "========================================================================"
echo ""
echo "Starting download script..."
echo "This will discover all SINs and download contractor Excel files."
echo ""

python3 scripts/gsa-elibrary-auto-download.py <<EOF
y
EOF

DOWNLOAD_EXIT_CODE=$?

if [ $DOWNLOAD_EXIT_CODE -eq 0 ]; then
    echo ""
    echo "✓ Download step completed successfully!"
    echo ""
else
    echo ""
    echo "✗ Download step had issues (exit code: $DOWNLOAD_EXIT_CODE)"
    echo "Some downloads may have failed, but continuing to parse what we got..."
    echo ""
fi

# Brief pause
sleep 3

# Step 2: Parse
echo "========================================================================"
echo "STEP 2/3: PARSING EXCEL FILES"
echo "========================================================================"
echo ""
echo "Starting parser..."
echo "This will extract all data from downloaded Excel files."
echo ""

python3 scripts/gsa-schedule-scraper.py

PARSE_EXIT_CODE=$?

if [ $PARSE_EXIT_CODE -eq 0 ]; then
    echo ""
    echo "✓ Parse step completed successfully!"
    echo ""
else
    echo ""
    echo "✗ Parse step encountered errors (exit code: $PARSE_EXIT_CODE)"
    echo "Continuing to import what was successfully parsed..."
    echo ""
fi

# Brief pause
sleep 3

# Step 3: Import
echo "========================================================================"
echo "STEP 3/3: IMPORTING TO SUPABASE"
echo "========================================================================"
echo ""
echo "Starting import..."
echo "This will load all parsed data into your Supabase database."
echo ""

python3 scripts/import-gsa-gwac-data.py

IMPORT_EXIT_CODE=$?

echo ""
echo "========================================================================"
echo "PIPELINE COMPLETE!"
echo "========================================================================"
echo ""

if [ $IMPORT_EXIT_CODE -eq 0 ]; then
    echo "✓ All steps completed successfully!"
    echo ""
    echo "Your GSA MAS contractor data is now in Supabase!"
    echo ""
    echo "Check your database:"
    echo "  Table: gsa_schedule_holders"
    echo ""
    echo "Example query:"
    echo "  SELECT COUNT(*) FROM gsa_schedule_holders;"
    echo ""
else
    echo "✗ Import step encountered errors (exit code: $IMPORT_EXIT_CODE)"
    echo ""
    echo "Check the logs above for details."
    echo ""
fi

echo "========================================================================"
echo "SUMMARY"
echo "========================================================================"
echo ""
echo "Step 1 - Download: $([ $DOWNLOAD_EXIT_CODE -eq 0 ] && echo '✓ Success' || echo '✗ Had issues')"
echo "Step 2 - Parse:    $([ $PARSE_EXIT_CODE -eq 0 ] && echo '✓ Success' || echo '✗ Had issues')"
echo "Step 3 - Import:   $([ $IMPORT_EXIT_CODE -eq 0 ] && echo '✓ Success' || echo '✗ Had issues')"
echo ""
echo "Files saved to:"
echo "  - Excel files:  data/gsa_schedules/"
echo "  - Parsed JSON:  data/gsa_schedules/parsed/"
echo ""
echo "Logs available in terminal output above."
echo ""
echo "========================================================================"
echo ""

exit $IMPORT_EXIT_CODE

