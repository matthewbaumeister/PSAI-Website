#!/usr/bin/env python3
"""
Fix the table schema and create matching CSV files
"""

import pandas as pd
from supabase import create_client, Client
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

def get_supabase_client():
    """Initialize Supabase client"""
    url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    key = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    
    if not url or not key:
        raise ValueError("Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env file")
    
    return create_client(url, key)

def create_correct_table_schema():
    """Create the correct table schema with all 157 columns"""
    
    # Read the CSV to get the exact column names
    csv_path = "/Users/matthewbaumeister/Downloads/COMPLETE_DOD_SBIR_DATABASE_20250809_132938.csv"
    df = pd.read_csv(csv_path, nrows=1)
    
    # Clean column names to match what we'll use
    def clean_column_name(col_name):
        cleaned = col_name.replace(' ', '_').replace('(', '').replace(')', '').replace('-', '_')
        cleaned = cleaned.replace('__', '_').strip('_')
        return cleaned.lower()
    
    clean_columns = [clean_column_name(col) for col in df.columns]
    
    # Create SQL for table creation
    sql_columns = []
    for col in clean_columns:
        # Escape column names that have special characters
        escaped_col = f'"{col}"'
        sql_columns.append(f'{escaped_col} TEXT')
    
    columns_sql = ',\n        '.join(sql_columns)
    
    create_sql = f"""CREATE TABLE IF NOT EXISTS sbir_database (
    id SERIAL PRIMARY KEY,
    {columns_sql},
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);"""
    
    # Save the SQL to a file
    sql_file = "/Users/matthewbaumeister/Downloads/create_correct_sbir_table.sql"
    with open(sql_file, 'w') as f:
        f.write(create_sql)
    
    print(f"✅ Created correct SQL schema: {sql_file}")
    print(f"📋 Total columns: {len(clean_columns)}")
    
    return clean_columns, sql_file

def create_matching_csv_files(clean_columns):
    """Create CSV files that match the table schema exactly"""
    
    csv_path = "/Users/matthewbaumeister/Downloads/COMPLETE_DOD_SBIR_DATABASE_20250809_132938.csv"
    
    print(f"Creating matching CSV files from: {csv_path}")
    
    # Read the full CSV
    df = pd.read_csv(csv_path, low_memory=False)
    print(f"Total rows: {len(df)}")
    print(f"Total columns: {len(df.columns)}")
    
    # Clean column names to match table
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
    
    # Create chunks under 100MB
    max_size_mb = 90
    sample_size = 1000
    sample_df = df.head(sample_size)
    sample_size_bytes = sample_df.to_csv(index=False).encode('utf-8').__len__()
    bytes_per_row = sample_size_bytes / sample_size
    max_bytes = max_size_mb * 1024 * 1024
    rows_per_chunk = int(max_bytes / bytes_per_row)
    
    print(f"Creating chunks with {rows_per_chunk} rows each...")
    
    # Create chunks
    chunk_files = []
    for i in range(0, len(df), rows_per_chunk):
        chunk = df.iloc[i:i+rows_per_chunk].copy()
        chunk_num = i // rows_per_chunk + 1
        chunk_file = f"/Users/matthewbaumeister/Downloads/sbir_fixed_chunk_{chunk_num:02d}.csv"
        
        # Save chunk
        chunk.to_csv(chunk_file, index=False)
        
        # Check file size
        file_size_mb = os.path.getsize(chunk_file) / (1024 * 1024)
        
        chunk_files.append({
            'file': chunk_file,
            'rows': len(chunk),
            'size_mb': round(file_size_mb, 2)
        })
        
        print(f"Created chunk {chunk_num}: {len(chunk)} rows, {file_size_mb:.2f}MB")
    
    return chunk_files

def main():
    """Main function"""
    
    print("Fixing Table Schema and Creating Matching CSV Files")
    print("=" * 60)
    
    # Step 1: Create correct table schema
    print("\n📋 Step 1: Creating correct table schema...")
    clean_columns, sql_file = create_correct_table_schema()
    
    # Step 2: Create matching CSV files
    print("\n📁 Step 2: Creating matching CSV files...")
    chunk_files = create_matching_csv_files(clean_columns)
    
    print(f"\n✅ Successfully created {len(chunk_files)} matching chunks!")
    print("\n📋 Next Steps:")
    print("1. Go to your Supabase dashboard")
    print("2. Navigate to SQL Editor")
    print(f"3. Run the SQL from: {sql_file}")
    print("4. Go to Table Editor → Import data from CSV")
    print("5. Upload each chunk file:")
    
    for i, chunk in enumerate(chunk_files, 1):
        print(f"   {i}. {chunk['file']} ({chunk['rows']} rows, {chunk['size_mb']}MB)")
    
    print(f"\n🎯 Total files to upload: {len(chunk_files)}")
    print("All files now match the table schema exactly!")

if __name__ == "__main__":
    main()
