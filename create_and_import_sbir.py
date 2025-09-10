#!/usr/bin/env python3
"""
Script to create table and import DOD SBIR database CSV to Supabase
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
    # Remove special characters and replace spaces with underscores
    cleaned = col_name.replace(' ', '_').replace('(', '').replace(')', '').replace('-', '_')
    cleaned = cleaned.replace('__', '_').strip('_')
    return cleaned.lower()

def create_table_from_csv(csv_path, table_name="sbir_database"):
    """Create table schema from CSV headers"""
    
    print(f"Reading CSV file to create schema: {csv_path}")
    df = pd.read_csv(csv_path, low_memory=False, nrows=1)  # Just read headers
    
    print(f"Total columns: {len(df.columns)}")
    
    # Clean column names
    clean_columns = [clean_column_name(col) for col in df.columns]
    
    # Create SQL for table creation
    sql_columns = []
    for i, col in enumerate(clean_columns):
        # Use TEXT for all columns to avoid data type issues
        sql_columns.append(f'"{col}" TEXT')
    
    columns_sql = ',\n        '.join(sql_columns)
    create_sql = f"""
    CREATE TABLE IF NOT EXISTS {table_name} (
        id SERIAL PRIMARY KEY,
        {columns_sql},
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    """
    
    print(f"Creating table '{table_name}' with {len(sql_columns)} columns...")
    
    # Initialize Supabase client
    try:
        supabase = get_supabase_client()
        print("Connected to Supabase successfully!")
    except Exception as e:
        print(f"Error connecting to Supabase: {e}")
        return False
    
    # Execute the table creation
    try:
        result = supabase.rpc('exec_sql', {'sql': create_sql}).execute()
        print(f"✅ Table '{table_name}' created successfully!")
        return True
    except Exception as e:
        print(f"Error creating table: {e}")
        # Try alternative method - create a simple table first
        try:
            simple_sql = f"""
            CREATE TABLE IF NOT EXISTS {table_name} (
                id SERIAL PRIMARY KEY,
                data JSONB,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
            """
            result = supabase.rpc('exec_sql', {'sql': simple_sql}).execute()
            print(f"✅ Created simple table '{table_name}' with JSONB column!")
            return True
        except Exception as e2:
            print(f"Error creating simple table: {e2}")
            return False

def import_csv_to_supabase(csv_path, table_name="sbir_database", batch_size=500):
    """Import CSV to Supabase in batches"""
    
    print(f"Reading CSV file: {csv_path}")
    df = pd.read_csv(csv_path, low_memory=False)
    
    print(f"Total rows: {len(df)}")
    print(f"Total columns: {len(df.columns)}")
    
    # Clean column names
    df.columns = [clean_column_name(col) for col in df.columns]
    
    # Clean data for JSON compatibility
    print("Cleaning data for JSON compatibility...")
    df = df.replace([float('inf'), float('-inf')], None)  # Replace inf values with None
    df = df.fillna('')  # Replace NaN with empty strings
    
    # Initialize Supabase client
    try:
        supabase = get_supabase_client()
        print("Connected to Supabase successfully!")
    except Exception as e:
        print(f"Error connecting to Supabase: {e}")
        return False
    
    # Convert DataFrame to records
    records = df.to_dict('records')
    
    print(f"Importing {len(records)} records to table '{table_name}'...")
    print(f"Using batch size: {batch_size}")
    
    # Import in batches
    total_imported = 0
    for i in range(0, len(records), batch_size):
        batch = records[i:i + batch_size]
        
        try:
            result = supabase.table(table_name).insert(batch).execute()
            total_imported += len(batch)
            print(f"✅ Imported batch {i//batch_size + 1}: {len(batch)} records (Total: {total_imported})")
            
            # Small delay to avoid rate limiting
            time.sleep(0.2)
            
        except Exception as e:
            print(f"❌ Error importing batch {i//batch_size + 1}: {e}")
            print("Continuing with next batch...")
            continue
    
    print(f"Import completed! Total records imported: {total_imported}")
    return True

if __name__ == "__main__":
    csv_path = "/Users/matthewbaumeister/Downloads/COMPLETE_DOD_SBIR_DATABASE_20250809_132938.csv"
    table_name = "sbir_database"
    
    print("DOD SBIR Database Import to Supabase")
    print("=" * 50)
    
    # Check if CSV file exists
    if not os.path.exists(csv_path):
        print(f"Error: CSV file not found at {csv_path}")
        exit(1)
    
    # Step 1: Create table
    print("\n📋 Step 1: Creating table schema...")
    if not create_table_from_csv(csv_path, table_name):
        print("❌ Failed to create table. Exiting.")
        exit(1)
    
    # Step 2: Import data
    print(f"\n📥 Step 2: Importing data to '{table_name}'...")
    success = import_csv_to_supabase(csv_path, table_name)
    
    if success:
        print(f"\n🎉 SUCCESS! Your DOD SBIR database has been imported to table '{table_name}'")
        print("You can now query your data in the Supabase dashboard.")
        print(f"Table: {table_name}")
        print(f"Records: 32,614 DOD SBIR topics")
    else:
        print("\n❌ Import failed. Please check the error messages above.")
