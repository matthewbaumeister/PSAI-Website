#!/bin/bash

# Check if all Congress imports are complete
# Usage: ./check-imports-complete.sh

echo "======================================"
echo "Congress Import Completion Checker"
echo "======================================"
echo ""

# Count running processes
RUNNING=$(ps aux | grep -c "[c]ongress-bulk-import")

if [ $RUNNING -eq 0 ]; then
  echo "✅ ALL IMPORTS COMPLETE! No processes running."
  echo ""
else
  echo "⏳ Still running: $RUNNING import process(es)"
  echo ""
fi

# Check each log for completion
check_completion() {
  LOG_FILE=$1
  CONGRESS_NUM=$2
  LABEL=$3
  
  if [ ! -f "$LOG_FILE" ]; then
    echo "❓ $LABEL: No log file found"
    return
  fi
  
  if grep -q "BULK IMPORT SUMMARY" "$LOG_FILE"; then
    SUCCESS=$(grep "Success:" "$LOG_FILE" | tail -1 | grep -oE '[0-9]+' | head -1)
    FAILED=$(grep "Failed:" "$LOG_FILE" | tail -1 | grep -oE '[0-9]+' | head -1)
    DURATION=$(grep "Duration:" "$LOG_FILE" | tail -1 | cut -d: -f2- | xargs)
    
    if [ -n "$SUCCESS" ]; then
      echo "✅ $LABEL: COMPLETE"
      echo "   └─ Imported: $SUCCESS bills"
      echo "   └─ Failed: $FAILED bills"
      echo "   └─ Duration: $DURATION"
    else
      echo "⏳ $LABEL: Still running..."
    fi
  else
    PROGRESS=$(grep "Progress:" "$LOG_FILE" | tail -1 | grep -oE '[0-9]+/[0-9]+' | head -1)
    if [ -n "$PROGRESS" ]; then
      echo "⏳ $LABEL: In progress ($PROGRESS bills)"
    else
      echo "🔄 $LABEL: Starting..."
    fi
  fi
}

# Check Congress 119 (might be in current terminal)
echo "=== CONGRESS 119 (Current Session) ==="
if [ $RUNNING -gt 0 ]; then
  # Check if it's running in this terminal
  if ps aux | grep -q "[c]ongress-bulk-import.*119"; then
    echo "⏳ Running in your main terminal"
  else
    echo "✅ Not running (may be complete)"
  fi
else
  echo "✅ Complete or not started"
fi
echo ""

# Check Congress 118
echo "=== CONGRESS 118 (2023-2024) ==="
check_completion "/tmp/congress-118-import.log" "118" "Congress 118"
echo ""

# Check Congress 117
echo "=== CONGRESS 117 (2021-2022) ==="
check_completion "/tmp/congress-117-import.log" "117" "Congress 117"
echo ""

echo "======================================"
if [ $RUNNING -eq 0 ]; then
  echo "🎉 All imports complete! Check data:"
  echo ""
  echo "Run this in Supabase SQL Editor:"
  echo ""
  echo "SELECT congress, COUNT(*) as bills"
  echo "FROM congressional_bills"
  echo "GROUP BY congress"
  echo "ORDER BY congress DESC;"
else
  echo "⏳ Imports still running..."
  echo "Check again in a few minutes!"
  echo ""
  echo "Or watch live:"
  echo "  tail -f /tmp/congress-118-import.log"
  echo "  tail -f /tmp/congress-117-import.log"
fi
echo "======================================"

