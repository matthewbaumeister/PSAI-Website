#!/usr/bin/env python3
"""
Simple DOD SBIR database import to Supabase
"""

import pandas as pd
import os
from supabase import create_client, Client
from dotenv import load_dotenv
import time

# Load environment variables
load_dotenv()

def get_supabase_client():
    """Initialize Supabase client"""
    url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    key = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    
    if not url or not key:
        raise ValueError("Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env file")
    
    return create_client(url, key)

def clean_column_name(col_name):
    """Clean column names for database compatibility"""
    cleaned = col_name.replace(' ', '_').replace('(', '').replace(')', '').replace('-', '_')
    cleaned = cleaned.replace('__', '_').strip('_')
    return cleaned.lower()

def create_smaller_chunks(csv_path, chunk_size=1000):
    """Create smaller, properly formatted CSV chunks"""
    
    print(f"Creating smaller chunks from: {csv_path}")
    
    # Read the full CSV
    df = pd.read_csv(csv_path, low_memory=False)
    print(f"Total rows: {len(df)}")
    print(f"Total columns: {len(df.columns)}")
    
    # Clean column names
    df.columns = [clean_column_name(col) for col in df.columns]
    
    # Clean data
    print("Cleaning data...")
    df = df.replace([float('inf'), float('-inf')], '')
    df = df.fillna('')
    df = df.astype(str)
    
    # Create chunks
    chunks = []
    for i in range(0, len(df), chunk_size):
        chunk = df.iloc[i:i+chunk_size].copy()
        chunk_file = f"/Users/matthewbaumeister/Downloads/sbir_chunk_{i//chunk_size + 1:03d}.csv"
        chunk.to_csv(chunk_file, index=False)
        chunks.append(chunk_file)
        print(f"Created chunk {i//chunk_size + 1}: {len(chunk)} rows -> {chunk_file}")
    
    return chunks

def import_chunk_to_supabase(supabase, chunk_file, table_name="sbir_database"):
    """Import a single chunk to Supabase"""
    
    print(f"Importing {chunk_file}...")
    
    try:
        # Read the chunk
        df = pd.read_csv(chunk_file, low_memory=False)
        
        # Convert to records
        records = df.to_dict('records')
        
        # Import to Supabase
        result = supabase.table(table_name).insert(records).execute()
        
        print(f"✅ Successfully imported {len(records)} records from {chunk_file}")
        return len(records)
        
    except Exception as e:
        print(f"❌ Error importing {chunk_file}: {e}")
        return 0

def main():
    """Main function"""
    
    csv_path = "/Users/matthewbaumeister/Downloads/SBIR_DATABASE_CLEANED.csv"
    table_name = "sbir_database"
    
    print("DOD SBIR Database Simple Import to Supabase")
    print("=" * 50)
    
    # Check if CSV file exists
    if not os.path.exists(csv_path):
        print(f"Error: CSV file not found at {csv_path}")
        exit(1)
    
    # Initialize Supabase client
    try:
        supabase = get_supabase_client()
        print("✅ Connected to Supabase successfully!")
    except Exception as e:
        print(f"❌ Error connecting to Supabase: {e}")
        exit(1)
    
    # Create smaller chunks
    print("\n📦 Creating smaller chunks...")
    chunk_files = create_smaller_chunks(csv_path, chunk_size=500)  # Smaller chunks
    
    # Import each chunk
    print(f"\n📥 Importing {len(chunk_files)} chunks to table '{table_name}'...")
    
    total_imported = 0
    for i, chunk_file in enumerate(chunk_files, 1):
        print(f"\nProcessing chunk {i}/{len(chunk_files)}...")
        imported = import_chunk_to_supabase(supabase, chunk_file, table_name)
        total_imported += imported
        
        # Small delay between chunks
        time.sleep(1)
    
    print(f"\n🎉 Import completed!")
    print(f"Total records imported: {total_imported}")
    print(f"Table: {table_name}")
    
    # Clean up chunk files
    print("\n🧹 Cleaning up temporary files...")
    for chunk_file in chunk_files:
        try:
            os.remove(chunk_file)
            print(f"Removed {chunk_file}")
        except:
            pass

if __name__ == "__main__":
    main()
