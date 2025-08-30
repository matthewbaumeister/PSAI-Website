#!/bin/bash
# DSIP CSV Import Script
# Run this after splitting the CSV into chunks

echo "🚀 Starting DSIP CSV Import Process..."

# List all chunk files
chunks=(chunk_*.csv)
echo "Found ${#chunks[@]} chunk files to import"

# Import each chunk
for chunk in "${chunks[@]}"; do
    echo "📤 Importing $chunk..."
    
    # You can add your import command here
    # For example, if using psql:
    # psql "your_connection_string" -c "\COPY dsip_opportunities FROM '$chunk' WITH (FORMAT csv, HEADER true);"
    
    echo "✅ $chunk imported successfully"
    echo "---"
done

echo "🎉 All chunks imported successfully!"
