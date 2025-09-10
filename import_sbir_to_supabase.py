#!/usr/bin/env python3
"""
Script to import DOD SBIR database CSV to Supabase
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

def import_csv_to_supabase(csv_path, table_name="sbir_database", batch_size=1000):
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
    df = df.astype(str)  # Convert all data to strings to avoid JSON issues
    
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
            print(f"Imported batch {i//batch_size + 1}: {len(batch)} records (Total: {total_imported})")
            
            # Small delay to avoid rate limiting
            time.sleep(0.1)
            
        except Exception as e:
            print(f"Error importing batch {i//batch_size + 1}: {e}")
            print("Continuing with next batch...")
            continue
    
    print(f"Import completed! Total records imported: {total_imported}")
    return True

def create_table_schema():
    """Create the table schema in Supabase"""
    schema_sql = """
    CREATE TABLE IF NOT EXISTS sbir_database (
        id SERIAL PRIMARY KEY,
        topic_number_api_topiccode TEXT,
        topic_id_api_topicid TEXT,
        title_api_topictitle TEXT,
        short_title_derived_first_50_chars_of_topictitle TEXT,
        component_api_component TEXT,
        component_full_name_derived_expanded_from_component_abbreviation TEXT,
        command_api_command TEXT,
        program_api_program TEXT,
        program_type_derived_extracted_from_program_field TEXT,
        solicitation_api_solicitationtitle TEXT,
        solicitation_number_api_solicitationnumber TEXT,
        cycle_name_api_cyclename TEXT,
        release_number_api_releasenumber TEXT,
        solicitation_phase_derived_extracted_from_cyclename_using_regex TEXT,
        status_api_topicstatus TEXT,
        topic_status_api_topicstatus_duplicate TEXT,
        proposal_window_status_calculated_based_on_current_date_vs_start_end_dates TEXT,
        days_until_close_calculated_topicenddate_current_date INTEGER,
        days_since_open_calculated_current_date_topicstartdate INTEGER,
        urgency_level_calculated_based_on_days_until_close_thresholds TEXT,
        open_date_api_topicstartdate_converted_to_mm_dd_yyyy TEXT,
        close_date_api_topicenddate_converted_to_mm_dd_yyyy TEXT,
        open_datetime_api_topicstartdate_duplicate TEXT,
        close_datetime_api_topicenddate_duplicate TEXT,
        duration_days_calculated_topicenddate_topicstartdate INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    """
    return schema_sql

if __name__ == "__main__":
    csv_path = "/Users/matthewbaumeister/Downloads/COMPLETE_DOD_SBIR_DATABASE_20250809_132938.csv"
    
    print("DOD SBIR Database Import to Supabase")
    print("=" * 50)
    
    # Check if CSV file exists
    if not os.path.exists(csv_path):
        print(f"Error: CSV file not found at {csv_path}")
        exit(1)
    
    # Import the data
    success = import_csv_to_supabase(csv_path)
    
    if success:
        print("\n✅ Import completed successfully!")
        print("You can now query your data in the Supabase dashboard.")
    else:
        print("\n❌ Import failed. Please check the error messages above.")
