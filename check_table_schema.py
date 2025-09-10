#!/usr/bin/env python3
"""
Check the actual table schema in Supabase
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

def check_table_schema():
    """Check what columns actually exist in the table"""
    
    try:
        supabase = get_supabase_client()
        print("✅ Connected to Supabase successfully!")
        
        # Try to get a sample record to see the schema
        result = supabase.table("sbir_database").select("*").limit(1).execute()
        
        if result.data:
            print("\n📋 Current table columns:")
            print("=" * 50)
            for i, column in enumerate(result.data[0].keys(), 1):
                print(f"{i:3d}. {column}")
            
            print(f"\nTotal columns in table: {len(result.data[0].keys())}")
        else:
            print("❌ No data found in table. Table might be empty or doesn't exist.")
            
    except Exception as e:
        print(f"❌ Error checking table schema: {e}")

def check_csv_columns():
    """Check what columns are in the CSV"""
    
    csv_path = "/Users/matthewbaumeister/Downloads/sbir_dashboard_chunk_01.csv"
    
    if not os.path.exists(csv_path):
        print(f"❌ CSV file not found: {csv_path}")
        return
    
    print("\n📋 CSV columns:")
    print("=" * 50)
    
    df = pd.read_csv(csv_path, nrows=1)
    for i, column in enumerate(df.columns, 1):
        print(f"{i:3d}. {column}")
    
    print(f"\nTotal columns in CSV: {len(df.columns)}")

if __name__ == "__main__":
    print("Checking Table Schema vs CSV Columns")
    print("=" * 50)
    
    check_table_schema()
    check_csv_columns()
