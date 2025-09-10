#!/usr/bin/env python3
"""
Script to prepare DOD SBIR database for Supabase import
"""

import pandas as pd
import os

def clean_column_name(col_name):
    """Clean column names for database compatibility"""
    # Remove special characters and replace spaces with underscores
    cleaned = col_name.replace(' ', '_').replace('(', '').replace(')', '').replace('-', '_')
    cleaned = cleaned.replace('__', '_').strip('_')
    return cleaned.lower()

def prepare_csv_for_import(csv_path):
    """Prepare CSV for Supabase import"""
    
    print(f"Reading CSV file: {csv_path}")
    df = pd.read_csv(csv_path, low_memory=False)
    
    print(f"Total rows: {len(df)}")
    print(f"Total columns: {len(df.columns)}")
    
    # Clean column names
    print("Cleaning column names...")
    df.columns = [clean_column_name(col) for col in df.columns]
    
    # Clean data for JSON compatibility
    print("Cleaning data for JSON compatibility...")
    df = df.replace([float('inf'), float('-inf')], '')  # Replace inf values with empty strings
    df = df.fillna('')  # Replace NaN with empty strings
    
    # Save cleaned CSV
    output_path = "/Users/matthewbaumeister/Downloads/SBIR_DATABASE_CLEANED.csv"
    print(f"Saving cleaned CSV to: {output_path}")
    df.to_csv(output_path, index=False)
    
    print(f"✅ Cleaned CSV saved with {len(df)} rows and {len(df.columns)} columns")
    
    # Generate SQL for table creation
    print("\n📋 SQL for creating the table in Supabase:")
    print("=" * 60)
    
    sql_columns = []
    for col in df.columns:
        sql_columns.append(f'"{col}" TEXT')
    
    columns_sql = ',\n        '.join(sql_columns)
    
    create_sql = f"""CREATE TABLE sbir_database (
    id SERIAL PRIMARY KEY,
    {columns_sql},
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);"""
    
    print(create_sql)
    print("\n" + "=" * 60)
    
    # Save SQL to file
    sql_file = "/Users/matthewbaumeister/Downloads/create_sbir_table.sql"
    with open(sql_file, 'w') as f:
        f.write(create_sql)
    
    print(f"📄 SQL saved to: {sql_file}")
    
    return output_path, sql_file

if __name__ == "__main__":
    csv_path = "/Users/matthewbaumeister/Downloads/COMPLETE_DOD_SBIR_DATABASE_20250809_132938.csv"
    
    print("DOD SBIR Database Preparation for Supabase")
    print("=" * 50)
    
    # Check if CSV file exists
    if not os.path.exists(csv_path):
        print(f"Error: CSV file not found at {csv_path}")
        exit(1)
    
    # Prepare the data
    cleaned_csv, sql_file = prepare_csv_for_import(csv_path)
    
    print("\n🎯 NEXT STEPS:")
    print("1. Go to your Supabase dashboard")
    print("2. Navigate to SQL Editor")
    print("3. Run the SQL from the file above to create the table")
    print("4. Go to Table Editor → Import data from CSV")
    print(f"5. Upload the cleaned file: {cleaned_csv}")
    print("\n✅ Your data is ready for import!")
