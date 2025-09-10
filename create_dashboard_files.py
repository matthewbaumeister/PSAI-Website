#!/usr/bin/env python3
"""
Create clean, chunked CSV files for Supabase dashboard upload
"""

import pandas as pd
import os

def clean_column_name(col_name):
    """Clean column names for database compatibility"""
    cleaned = col_name.replace(' ', '_').replace('(', '').replace(')', '').replace('-', '_')
    cleaned = cleaned.replace('__', '_').strip('_')
    return cleaned.lower()

def create_dashboard_ready_chunks(csv_path, max_size_mb=90):
    """Create chunks under the 100MB dashboard limit"""
    
    print(f"Creating dashboard-ready chunks from: {csv_path}")
    
    # Read the full CSV
    df = pd.read_csv(csv_path, low_memory=False)
    print(f"Total rows: {len(df)}")
    print(f"Total columns: {len(df.columns)}")
    
    # Clean column names
    df.columns = [clean_column_name(col) for col in df.columns]
    
    # Clean data more aggressively
    print("Cleaning data for dashboard compatibility...")
    df = df.replace([float('inf'), float('-inf')], '')  # Replace inf values
    df = df.fillna('')  # Replace NaN
    df = df.replace('nan', '')  # Replace 'nan' strings
    df = df.astype(str)  # Convert everything to strings
    
    # Remove any remaining problematic characters
    for col in df.columns:
        df[col] = df[col].str.replace('\x00', '', regex=False)  # Remove null bytes
        df[col] = df[col].str.replace('\r', '', regex=False)  # Remove carriage returns
        df[col] = df[col].str.replace('\n', ' ', regex=False)  # Replace newlines with spaces
    
    # Calculate rows per chunk based on size
    sample_size = 1000
    sample_df = df.head(sample_size)
    sample_size_bytes = sample_df.to_csv(index=False).encode('utf-8').__len__()
    bytes_per_row = sample_size_bytes / sample_size
    max_bytes = max_size_mb * 1024 * 1024  # Convert MB to bytes
    rows_per_chunk = int(max_bytes / bytes_per_row)
    
    print(f"Estimated rows per chunk: {rows_per_chunk}")
    print(f"Estimated chunks needed: {len(df) // rows_per_chunk + 1}")
    
    # Create chunks
    chunk_files = []
    for i in range(0, len(df), rows_per_chunk):
        chunk = df.iloc[i:i+rows_per_chunk].copy()
        chunk_num = i // rows_per_chunk + 1
        chunk_file = f"/Users/matthewbaumeister/Downloads/sbir_dashboard_chunk_{chunk_num:02d}.csv"
        
        # Save chunk
        chunk.to_csv(chunk_file, index=False)
        
        # Check actual file size
        file_size_mb = os.path.getsize(chunk_file) / (1024 * 1024)
        
        chunk_files.append({
            'file': chunk_file,
            'rows': len(chunk),
            'size_mb': round(file_size_mb, 2)
        })
        
        print(f"Created chunk {chunk_num}: {len(chunk)} rows, {file_size_mb:.2f}MB -> {chunk_file}")
    
    return chunk_files

def main():
    """Main function"""
    
    csv_path = "/Users/matthewbaumeister/Downloads/COMPLETE_DOD_SBIR_DATABASE_20250809_132938.csv"
    
    print("Creating Dashboard-Ready SBIR Chunks")
    print("=" * 50)
    
    # Check if CSV file exists
    if not os.path.exists(csv_path):
        print(f"Error: CSV file not found at {csv_path}")
        exit(1)
    
    # Create chunks
    chunk_files = create_dashboard_ready_chunks(csv_path, max_size_mb=90)
    
    print(f"\n✅ Successfully created {len(chunk_files)} chunks!")
    print("\n📋 Upload Instructions:")
    print("1. Go to your Supabase dashboard")
    print("2. Navigate to Table Editor")
    print("3. Find your 'sbir_database' table")
    print("4. Click 'Import data from CSV'")
    print("5. Upload each chunk file one by one:")
    
    for i, chunk in enumerate(chunk_files, 1):
        print(f"   {i}. {chunk['file']} ({chunk['rows']} rows, {chunk['size_mb']}MB)")
    
    print(f"\n🎯 Total files to upload: {len(chunk_files)}")
    print("All files are under 100MB and ready for dashboard upload!")

if __name__ == "__main__":
    main()
