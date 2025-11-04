#!/bin/bash

# Monitor all Congress.gov bulk imports
# Usage: ./monitor-congress-imports.sh

echo "======================================"
echo "Congress.gov Bulk Import Monitor"
echo "======================================"
echo ""

# Check running processes
RUNNING=$(ps aux | grep -c "[c]ongress-bulk-import")
echo "Running imports: $RUNNING"
echo ""

# Check Congress 119 (running in foreground terminal)
echo "=== CONGRESS 119 (Current Session) ==="
echo "Check your main terminal for progress"
echo ""

# Check Congress 118
if [ -f /tmp/congress-118-import.log ]; then
  echo "=== CONGRESS 118 (2023-2024) ==="
  tail -5 /tmp/congress-118-import.log | grep -E "Progress|✓" | tail -2
  echo ""
fi

# Check Congress 117
if [ -f /tmp/congress-117-import.log ]; then
  echo "=== CONGRESS 117 (2021-2022) ==="
  tail -5 /tmp/congress-117-import.log | grep -E "Progress|✓" | tail -2
  echo ""
fi

echo "======================================"
echo "Live monitoring commands:"
echo "  Congress 118: tail -f /tmp/congress-118-import.log"
echo "  Congress 117: tail -f /tmp/congress-117-import.log"
echo ""
echo "Kill all imports:"
echo "  pkill -9 -f congress-bulk-import"
echo "======================================"

