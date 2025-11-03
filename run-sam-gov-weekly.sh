#!/bin/bash

# Run SAM.gov scraper for 1 week chunks to avoid rate limits
# Each week requires ~20-30 API calls (well within daily limit)

echo "SAM.gov Weekly Scraper - Stays within rate limits"
echo "=================================================="
echo ""

# Check if start date provided
if [ -z "$1" ]; then
  echo "Usage: ./run-sam-gov-weekly.sh START_DATE [END_DATE]"
  echo ""
  echo "Examples:"
  echo "  ./run-sam-gov-weekly.sh 2025-10-27        # Last 7 days from Oct 27"
  echo "  ./run-sam-gov-weekly.sh 2025-01-01 2025-12-31  # Full year in 7-day chunks"
  echo ""
  exit 1
fi

START_DATE=$1
END_DATE=${2:-$(date +%Y-%m-%d)}

echo "Date Range: $START_DATE → $END_DATE"
echo ""
echo "Running in 7-day chunks to stay within SAM.gov rate limits..."
echo ""

# Convert dates to timestamps
start_ts=$(date -j -f "%Y-%m-%d" "$START_DATE" "+%s")
end_ts=$(date -j -f "%Y-%m-%d" "$END_DATE" "+%s")

current_ts=$start_ts
chunk=1

while [ $current_ts -lt $end_ts ]; do
  # Calculate chunk end (7 days later or end date, whichever is sooner)
  chunk_end_ts=$((current_ts + 604800)) # 7 days in seconds
  if [ $chunk_end_ts -gt $end_ts ]; then
    chunk_end_ts=$end_ts
  fi
  
  # Convert back to dates
  chunk_start=$(date -j -f "%s" "$current_ts" "+%Y-%m-%d")
  chunk_end=$(date -j -f "%s" "$chunk_end_ts" "+%Y-%m-%d")
  
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "Chunk $chunk: $chunk_start → $chunk_end"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  
  # Run scraper for this chunk
  npx tsx scrape-sam-gov-opportunities.ts --from="$chunk_start" --to="$chunk_end"
  
  # Check if we hit rate limit
  if [ $? -ne 0 ]; then
    echo ""
    echo "⚠️  Hit rate limit or error. Resume tomorrow with:"
    echo "    ./run-sam-gov-weekly.sh $chunk_start $END_DATE"
    exit 1
  fi
  
  echo ""
  echo "✅ Chunk $chunk complete!"
  echo ""
  
  # Move to next chunk
  current_ts=$((chunk_end_ts + 1))
  chunk=$((chunk + 1))
  
  # Add delay between chunks to be safe
  if [ $current_ts -lt $end_ts ]; then
    echo "Waiting 5 seconds before next chunk..."
    sleep 5
  fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 ALL CHUNKS COMPLETE!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Next steps:"
echo "1. Run linking: SELECT link_sam_to_fpds();"
echo "2. Check results: SELECT COUNT(*) FROM sam_gov_opportunities;"

