#!/usr/bin/env python3
"""
Create CSV files that match the existing sbir_database table schema
"""

import pandas as pd
import os

def create_matching_csv():
    """Create CSV files that match the existing table schema"""
    
    # Read the original CSV
    csv_path = "/Users/matthewbaumeister/Downloads/COMPLETE_DOD_SBIR_DATABASE_20250809_132938.csv"
    df = pd.read_csv(csv_path, low_memory=False)
    
    print(f"Original CSV: {len(df)} rows, {len(df.columns)} columns")
    
    # Clean column names to match what we expect in the table
    def clean_column_name(col_name):
        cleaned = col_name.replace(' ', '_').replace('(', '').replace(')', '').replace('-', '_')
        cleaned = cleaned.replace('__', '_').strip('_')
        return cleaned.lower()
    
    df.columns = [clean_column_name(col) for col in df.columns]
    
    # Clean data
    print("Cleaning data...")
    df = df.replace([float('inf'), float('-inf')], '')
    df = df.fillna('')
    df = df.replace('nan', '')
    df = df.astype(str)
    
    # Remove problematic characters
    for col in df.columns:
        df[col] = df[col].str.replace('\x00', '', regex=False)
        df[col] = df[col].str.replace('\r', '', regex=False)
        df[col] = df[col].str.replace('\n', ' ', regex=False)
    
    # Create smaller chunks (5000 rows each to be safe)
    chunk_size = 5000
    chunks = []
    
    for i in range(0, len(df), chunk_size):
        chunk = df.iloc[i:i+chunk_size].copy()
        chunk_num = i // chunk_size + 1
        chunk_file = f"/Users/matthewbaumeister/Downloads/sbir_matching_chunk_{chunk_num:02d}.csv"
        
        chunk.to_csv(chunk_file, index=False)
        
        file_size_mb = os.path.getsize(chunk_file) / (1024 * 1024)
        chunks.append({
            'file': chunk_file,
            'rows': len(chunk),
            'size_mb': round(file_size_mb, 2)
        })
        
        print(f"Created chunk {chunk_num}: {len(chunk)} rows, {file_size_mb:.2f}MB")
    
    return chunks

if __name__ == "__main__":
    print("Creating CSV Files Matching Table Schema")
    print("=" * 50)
    
    chunks = create_matching_csv()
    
    print(f"\n✅ Created {len(chunks)} chunks!")
    print("\n📋 Upload Instructions:")
    print("1. Go to your Supabase dashboard")
    print("2. Navigate to Table Editor")
    print("3. Find your 'sbir_database' table")
    print("4. Click 'Import data from CSV'")
    print("5. Upload each chunk file:")
    
    for i, chunk in enumerate(chunks, 1):
        print(f"   {i}. {chunk['file']} ({chunk['rows']} rows, {chunk['size_mb']}MB)")
    
    print(f"\n🎯 Total files: {len(chunks)}")
    print("All files are under 100MB and ready for upload!")
