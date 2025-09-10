#!/usr/bin/env python3
"""
Generate exact SQL that matches the CSV structure
"""

import pandas as pd

def generate_exact_sql():
    """Generate SQL that exactly matches the CSV columns"""
    
    # Read the CSV to get exact column names
    csv_path = "/Users/matthewbaumeister/Downloads/COMPLETE_DOD_SBIR_DATABASE_20250809_132938.csv"
    df = pd.read_csv(csv_path, nrows=1)
    
    print(f"CSV has {len(df.columns)} columns")
    
    # Get the exact column names from the CSV
    original_columns = list(df.columns)
    
    # Create SQL column definitions
    sql_columns = []
    for i, col in enumerate(original_columns, 1):
        # Escape column names that have special characters
        escaped_col = f'"{col}"'
        sql_columns.append(f'    {escaped_col} TEXT')
        print(f"{i:3d}. {col}")
    
    # Generate the complete SQL
    columns_sql = ',\n'.join(sql_columns)
    
    create_sql = f"""-- Drop existing table if it exists
DROP TABLE IF EXISTS sbir_database;

-- Create table with exact CSV structure
CREATE TABLE sbir_database (
    id SERIAL PRIMARY KEY,
{columns_sql},
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for common queries
CREATE INDEX idx_sbir_topic_number ON sbir_database ("Topic Number (API: topicCode)");
CREATE INDEX idx_sbir_topic_id ON sbir_database ("Topic ID (API: topicId)");
CREATE INDEX idx_sbir_status ON sbir_database ("Status (API: topicStatus)");
CREATE INDEX idx_sbir_component ON sbir_database ("Component (API: component)");
CREATE INDEX idx_sbir_program ON sbir_database ("Program (API: program)");
CREATE INDEX idx_sbir_open_date ON sbir_database ("Open Date (API: topicStartDate converted to MM/DD/YYYY)");
CREATE INDEX idx_sbir_close_date ON sbir_database ("Close Date (API: topicEndDate converted to MM/DD/YYYY)");
"""
    
    # Save the SQL to a file
    sql_file = "/Users/matthewbaumeister/Downloads/create_exact_sbir_table.sql"
    with open(sql_file, 'w') as f:
        f.write(create_sql)
    
    print(f"\n✅ Generated exact SQL: {sql_file}")
    print(f"📋 Total columns: {len(original_columns)}")
    
    return sql_file, original_columns

if __name__ == "__main__":
    print("Generating Exact SQL for CSV Structure")
    print("=" * 50)
    
    sql_file, columns = generate_exact_sql()
    
    print(f"\n📋 Next Steps:")
    print("1. Go to your Supabase dashboard")
    print("2. Navigate to SQL Editor")
    print(f"3. Copy and paste the SQL from: {sql_file}")
    print("4. Click Run to create the table")
    print("5. Then upload your CSV files through Table Editor")
    
    print(f"\n🎯 The SQL will create a table with exactly {len(columns)} columns")
    print("matching your CSV structure perfectly!")
