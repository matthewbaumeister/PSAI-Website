#!/usr/bin/env python3
"""
Generate SQL that matches the cleaned CSV column names
"""

import pandas as pd

def clean_column_name(col_name):
    """Clean column names for database compatibility"""
    cleaned = col_name.replace(' ', '_').replace('(', '').replace(')', '').replace('-', '_')
    cleaned = cleaned.replace('__', '_').strip('_')
    return cleaned.lower()

def generate_matching_sql():
    """Generate SQL that matches the cleaned CSV column names"""
    
    # Read the CSV to get original column names
    csv_path = "/Users/matthewbaumeister/Downloads/COMPLETE_DOD_SBIR_DATABASE_20250809_132938.csv"
    df = pd.read_csv(csv_path, nrows=1)
    
    print(f"Original CSV has {len(df.columns)} columns")
    
    # Get the original column names and clean them
    original_columns = list(df.columns)
    cleaned_columns = [clean_column_name(col) for col in original_columns]
    
    print(f"Cleaned column names: {len(cleaned_columns)} columns")
    
    # Create SQL column definitions using cleaned names
    sql_columns = []
    for i, col in enumerate(cleaned_columns, 1):
        # Escape column names that have special characters
        escaped_col = f'"{col}"'
        sql_columns.append(f'    {escaped_col} TEXT')
        print(f"{i:3d}. {col}")
    
    # Generate the complete SQL
    columns_sql = ',\n'.join(sql_columns)
    
    create_sql = f"""-- Drop existing table if it exists
DROP TABLE IF EXISTS sbir_database;

-- Create table with cleaned CSV column names
CREATE TABLE sbir_database (
    id SERIAL PRIMARY KEY,
{columns_sql},
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for common queries
CREATE INDEX idx_sbir_topic_number ON sbir_database ("topic_number_api:_topiccode");
CREATE INDEX idx_sbir_topic_id ON sbir_database ("topic_id_api:_topicid");
CREATE INDEX idx_sbir_status ON sbir_database ("status_api:_topicstatus");
CREATE INDEX idx_sbir_component ON sbir_database ("component_api:_component");
CREATE INDEX idx_sbir_program ON sbir_database ("program_api:_program");
CREATE INDEX idx_sbir_open_date ON sbir_database ("open_date_api:_topicstartdate_converted_to_mm/dd/yyyy");
CREATE INDEX idx_sbir_close_date ON sbir_database ("close_date_api:_topicenddate_converted_to_mm/dd/yyyy");
"""
    
    # Save the SQL to a file
    sql_file = "/Users/matthewbaumeister/Downloads/create_matching_sbir_table.sql"
    with open(sql_file, 'w') as f:
        f.write(create_sql)
    
    print(f"\n✅ Generated matching SQL: {sql_file}")
    print(f"📋 Total columns: {len(cleaned_columns)}")
    
    return sql_file, cleaned_columns

if __name__ == "__main__":
    print("Generating SQL with Cleaned Column Names")
    print("=" * 50)
    
    sql_file, columns = generate_matching_sql()
    
    print(f"\n📋 Next Steps:")
    print("1. Go to your Supabase dashboard")
    print("2. Navigate to SQL Editor")
    print(f"3. Copy and paste the SQL from: {sql_file}")
    print("4. Click Run to create the table")
    print("5. Then upload your existing CSV chunk files")
    
    print(f"\n🎯 The SQL will create a table with exactly {len(columns)} columns")
    print("matching your cleaned CSV column names perfectly!")
