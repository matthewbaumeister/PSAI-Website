#!/usr/bin/env python3
"""
Bulk import DOD SBIR database to Supabase using direct database connection
"""

import pandas as pd
import os
from supabase import create_client, Client
from dotenv import load_dotenv
import time
import psycopg2
from psycopg2.extras import execute_values

# Load environment variables
load_dotenv()

def get_supabase_client():
    """Initialize Supabase client"""
    url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    key = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    
    if not url or not key:
        raise ValueError("Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env file")
    
    return create_client(url, key)

def get_database_connection():
    """Get direct database connection using service role key"""
    # Extract database connection details from Supabase URL
    url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not url or not service_key:
        raise ValueError("Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file")
    
    # Parse URL to get connection details
    # URL format: https://reprsoqodhmpdoiajhst.supabase.co
    host = url.replace("https://", "").replace("http://", "")
    
    # Default Supabase connection details
    dbname = "postgres"
    user = "postgres"
    password = service_key  # Service role key as password
    port = "5432"
    
    try:
        conn = psycopg2.connect(
            host=host,
            database=dbname,
            user=user,
            password=password,
            port=port,
            sslmode="require"
        )
        return conn
    except Exception as e:
        print(f"Error connecting to database: {e}")
        print("Trying alternative connection method...")
        return None

def create_table_schema(conn, table_name="sbir_database"):
    """Create table schema using direct SQL"""
    
    # Read a sample to get column names
    sample_df = pd.read_csv("/Users/matthewbaumeister/Downloads/SBIR_DATABASE_CLEANED.csv", nrows=1)
    
    # Clean column names
    def clean_column_name(col_name):
        cleaned = col_name.replace(' ', '_').replace('(', '').replace(')', '').replace('-', '_')
        cleaned = cleaned.replace('__', '_').strip('_')
        return cleaned.lower()
    
    clean_columns = [clean_column_name(col) for col in sample_df.columns]
    
    # Create SQL for table creation
    sql_columns = []
    for col in clean_columns:
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
    
    try:
        cursor = conn.cursor()
        cursor.execute(create_sql)
        conn.commit()
        cursor.close()
        print(f"✅ Table '{table_name}' created successfully!")
        return True
    except Exception as e:
        print(f"Error creating table: {e}")
        return False

def bulk_import_csv(conn, csv_path, table_name="sbir_database", batch_size=1000):
    """Bulk import CSV using direct database connection"""
    
    print(f"Reading CSV file: {csv_path}")
    df = pd.read_csv(csv_path, low_memory=False)
    
    print(f"Total rows: {len(df)}")
    print(f"Total columns: {len(df.columns)}")
    
    # Clean column names
    def clean_column_name(col_name):
        cleaned = col_name.replace(' ', '_').replace('(', '').replace(')', '').replace('-', '_')
        cleaned = cleaned.replace('__', '_').strip('_')
        return cleaned.lower()
    
    df.columns = [clean_column_name(col) for col in df.columns]
    
    # Clean data
    print("Cleaning data...")
    df = df.replace([float('inf'), float('-inf')], '')
    df = df.fillna('')
    
    # Prepare data for bulk insert
    columns = list(df.columns)
    values = [tuple(row) for row in df.values]
    
    print(f"Importing {len(values)} records to table '{table_name}'...")
    print(f"Using batch size: {batch_size}")
    
    try:
        cursor = conn.cursor()
        
        # Create the INSERT statement
        placeholders = ','.join(['%s'] * len(columns))
        insert_sql = f"""
        INSERT INTO {table_name} ({','.join([f'"{col}"' for col in columns])})
        VALUES %s
        """
        
        # Import in batches
        total_imported = 0
        for i in range(0, len(values), batch_size):
            batch = values[i:i + batch_size]
            
            try:
                execute_values(cursor, insert_sql, batch, page_size=batch_size)
                conn.commit()
                total_imported += len(batch)
                print(f"✅ Imported batch {i//batch_size + 1}: {len(batch)} records (Total: {total_imported})")
                
                # Small delay to avoid overwhelming the database
                time.sleep(0.1)
                
            except Exception as e:
                print(f"❌ Error importing batch {i//batch_size + 1}: {e}")
                conn.rollback()
                continue
        
        cursor.close()
        print(f"Import completed! Total records imported: {total_imported}")
        return True
        
    except Exception as e:
        print(f"Error during bulk import: {e}")
        return False

def main():
    """Main function to handle the bulk import"""
    
    csv_path = "/Users/matthewbaumeister/Downloads/SBIR_DATABASE_CLEANED.csv"
    table_name = "sbir_database"
    
    print("DOD SBIR Database Bulk Import to Supabase")
    print("=" * 50)
    
    # Check if CSV file exists
    if not os.path.exists(csv_path):
        print(f"Error: CSV file not found at {csv_path}")
        exit(1)
    
    # Try to get database connection
    print("Connecting to Supabase database...")
    conn = get_database_connection()
    
    if not conn:
        print("❌ Could not connect to database directly.")
        print("Falling back to Supabase client method...")
        
        # Fallback to Supabase client with smaller batches
        try:
            supabase = get_supabase_client()
            
            # Create table using Supabase client
            print("Creating table using Supabase client...")
            
            # Read and process data in smaller chunks
            chunk_size = 500  # Smaller chunks for client method
            total_imported = 0
            
            for chunk_num in range(0, 32614, chunk_size):
                print(f"Processing chunk {chunk_num//chunk_size + 1}...")
                
                df_chunk = pd.read_csv(csv_path, skiprows=chunk_num, nrows=chunk_size, low_memory=False)
                
                if df_chunk.empty:
                    break
                
                # Clean data
                df_chunk = df_chunk.replace([float('inf'), float('-inf')], '')
                df_chunk = df_chunk.fillna('')
                df_chunk = df_chunk.astype(str)
                
                # Clean column names
                def clean_column_name(col_name):
                    cleaned = col_name.replace(' ', '_').replace('(', '').replace(')', '').replace('-', '_')
                    cleaned = cleaned.replace('__', '_').strip('_')
                    return cleaned.lower()
                
                df_chunk.columns = [clean_column_name(col) for col in df_chunk.columns]
                
                # Convert to records
                records = df_chunk.to_dict('records')
                
                try:
                    result = supabase.table(table_name).insert(records).execute()
                    total_imported += len(records)
                    print(f"✅ Imported chunk {chunk_num//chunk_size + 1}: {len(records)} records (Total: {total_imported})")
                    time.sleep(0.5)  # Delay between chunks
                    
                except Exception as e:
                    print(f"❌ Error importing chunk {chunk_num//chunk_size + 1}: {e}")
                    continue
            
            print(f"Import completed! Total records imported: {total_imported}")
            
        except Exception as e:
            print(f"Error with Supabase client method: {e}")
            return False
        
        return True
    
    # Direct database connection method
    try:
        # Step 1: Create table
        print("\n📋 Step 1: Creating table schema...")
        if not create_table_schema(conn, table_name):
            print("❌ Failed to create table. Exiting.")
            return False
        
        # Step 2: Bulk import data
        print(f"\n📥 Step 2: Bulk importing data to '{table_name}'...")
        success = bulk_import_csv(conn, csv_path, table_name)
        
        if success:
            print(f"\n🎉 SUCCESS! Your DOD SBIR database has been imported to table '{table_name}'")
            print("You can now query your data in the Supabase dashboard.")
        else:
            print("\n❌ Import failed. Please check the error messages above.")
        
        return success
        
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    main()
