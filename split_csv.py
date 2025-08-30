#!/usr/bin/env python3
"""
CSV Splitter for DSIP Data Import
Automatically splits large CSV files into manageable chunks for Supabase import
"""

import csv
import os
import math

# Increase CSV field size limit to handle large fields
csv.field_size_limit(2147483647)  # Maximum 32-bit integer

def split_csv(input_file, chunk_size=1000):
    """Split CSV file into chunks"""
    
    # Count total rows
    with open(input_file, 'r', encoding='utf-8') as f:
        total_rows = sum(1 for line in f) - 1  # Subtract header
    
    print(f"Total rows: {total_rows:,}")
    print(f"Chunk size: {chunk_size:,}")
    
    # Calculate number of chunks
    num_chunks = math.ceil(total_rows / chunk_size)
    print(f"Number of chunks: {num_chunks}")
    
    # Read header
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        header = next(reader)
    
    # Create chunks
    chunk_num = 1
    row_count = 0
    
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        next(reader)  # Skip header
        
        current_chunk = []
        
        for row in reader:
            current_chunk.append(row)
            row_count += 1
            
            # Write chunk when it reaches the target size
            if len(current_chunk) >= chunk_size:
                chunk_filename = f"chunk_{chunk_num:02d}.csv"
                write_chunk(chunk_filename, header, current_chunk)
                print(f"Created {chunk_filename} with {len(current_chunk):,} rows")
                
                current_chunk = []
                chunk_num += 1
        
        # Write final chunk if there are remaining rows
        if current_chunk:
            chunk_filename = f"chunk_{chunk_num:02d}.csv"
            write_chunk(chunk_filename, header, current_chunk)
            print(f"Created {chunk_filename} with {len(current_chunk):,} rows")
    
    print(f"\n✅ Split complete! Created {chunk_num} chunk files.")
    print("You can now import these chunks one by one in Supabase.")

def write_chunk(filename, header, rows):
    """Write a chunk to a CSV file"""
    with open(filename, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(header)
        writer.writerows(rows)

def create_import_script():
    """Create a shell script to automate the import process"""
    script_content = """#!/bin/bash
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
    # psql "your_connection_string" -c "\\COPY dsip_opportunities FROM '$chunk' WITH (FORMAT csv, HEADER true);"
    
    echo "✅ $chunk imported successfully"
    echo "---"
done

echo "🎉 All chunks imported successfully!"
"""
    
    with open('import_chunks.sh', 'w') as f:
        f.write(script_content)
    
    os.chmod('import_chunks.sh', 0o755)
    print("📝 Created import_chunks.sh script")

if __name__ == "__main__":
    input_file = "dod_sbir_topics_rows.csv"
    
    if not os.path.exists(input_file):
        print(f"❌ Error: {input_file} not found!")
        print("Make sure the CSV file is in the current directory.")
        exit(1)
    
    print("🔧 DSIP CSV Splitter")
    print("=" * 40)
    
    # Split the CSV
    split_csv(input_file, chunk_size=1000)
    
    # Create import script
    create_import_script()
    
    print("\n📋 Next steps:")
    print("1. Import the chunk files one by one in Supabase")
    print("2. Or use the import_chunks.sh script if you have direct database access")
    print("3. Monitor progress in Supabase dashboard")
