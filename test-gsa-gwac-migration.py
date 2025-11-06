#!/usr/bin/env python3
"""
Test GSA/GWAC migration and verify tables
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv
import psycopg2
from psycopg2 import sql

# Load environment variables
load_dotenv()

def get_database_connection():
    """Get direct PostgreSQL connection"""
    # Try DATABASE_URL first
    database_url = os.getenv("DATABASE_URL")
    if database_url:
        try:
            print("Connecting via DATABASE_URL...")
            conn = psycopg2.connect(database_url)
            return conn
        except Exception as e:
            print(f"Failed with DATABASE_URL: {e}")
    
    # Try Supabase connection
    url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not url or not service_key:
        print("ERROR: Missing database credentials")
        print("Set one of these in .env.local:")
        print("  Option 1: DATABASE_URL=postgresql://...")
        print("  Option 2: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY")
        sys.exit(1)
    
    # Parse Supabase URL to get project reference
    # URL format: https://reprsoqodhmpdoiajhst.supabase.co
    host = url.replace("https://", "").replace("http://", "")
    project_ref = host.split(".")[0]
    
    # Build connection string
    # Supabase database host format: db.{project_ref}.supabase.co
    try:
        print("Connecting via Supabase credentials...")
        conn = psycopg2.connect(
            host=f"db.{project_ref}.supabase.co",
            database="postgres",
            user="postgres",
            password=service_key,
            port="5432",
            sslmode="require"
        )
        return conn
    except Exception as e:
        print(f"ERROR: Failed to connect to database: {e}")
        print(f"  Project ref: {project_ref}")
        print(f"  Host tried: db.{project_ref}.supabase.co")
        sys.exit(1)

def run_migration():
    """Run the GSA/GWAC migration SQL"""
    print("=" * 60)
    print("GSA/GWAC Migration Test")
    print("=" * 60)
    print()
    
    # Read migration file
    migration_file = Path("supabase/migrations/create_gsa_gwac_tables.sql")
    if not migration_file.exists():
        print(f"ERROR: Migration file not found: {migration_file}")
        sys.exit(1)
    
    print(f"Reading migration file: {migration_file}")
    with open(migration_file, 'r') as f:
        sql_content = f.read()
    
    print(f"Migration file size: {len(sql_content)} characters")
    print()
    
    # Connect to database
    print("Connecting to database...")
    try:
        conn = get_database_connection()
        print("✓ Connected successfully")
    except Exception as e:
        print(f"ERROR: Failed to connect: {e}")
        sys.exit(1)
    
    print()
    
    # Execute the SQL
    print("Executing migration SQL...")
    print("-" * 60)
    
    try:
        cursor = conn.cursor()
        
        # Execute the entire SQL file
        cursor.execute(sql_content)
        conn.commit()
        
        print("✓ Migration executed successfully!")
        print("-" * 60)
        
        cursor.close()
        return True
        
    except Exception as e:
        conn.rollback()
        error_msg = str(e)
        
        # Check if error is benign (already exists, etc.)
        if 'already exists' in error_msg.lower():
            print("✓ Tables already exist (migration was run before)")
            print("-" * 60)
            return True
        else:
            print(f"✗ Migration failed: {error_msg}")
            print("-" * 60)
            return False
    finally:
        if 'cursor' in locals():
            cursor.close()

def verify_tables():
    """Verify that tables were created"""
    print()
    print("=" * 60)
    print("Verifying Tables")
    print("=" * 60)
    print()
    
    conn = get_database_connection()
    cursor = conn.cursor()
    
    tables_to_check = [
        'gsa_schedule_holders',
        'gwac_holders',
        'gsa_sin_catalog',
        'gwac_catalog',
        'gsa_gwac_scraper_log'
    ]
    
    print("Checking tables...")
    all_exist = True
    
    for table in tables_to_check:
        try:
            cursor.execute(f"SELECT COUNT(*) FROM {table}")
            count = cursor.fetchone()[0]
            print(f"✓ Table exists: {table} ({count} records)")
        except Exception as e:
            print(f"✗ Table missing or error: {table} ({e})")
            all_exist = False
    
    print()
    
    # Check gwac_catalog has seed data
    try:
        cursor.execute("SELECT gwac_name FROM gwac_catalog ORDER BY gwac_name")
        rows = cursor.fetchall()
        if rows:
            print(f"✓ gwac_catalog has {len(rows)} seed records:")
            for row in rows[:5]:
                print(f"  - {row[0]}")
            if len(rows) > 5:
                print(f"  ... and {len(rows) - 5} more")
        else:
            print("⚠ gwac_catalog is empty (should have 11 seed GWACs)")
    except Exception as e:
        print(f"✗ Could not check gwac_catalog: {e}")
    
    print()
    
    # Check views
    views_to_check = [
        'active_gsa_schedule_holders',
        'active_gwac_holders',
        'combined_contract_vehicles',
        'company_vehicle_summary'
    ]
    
    print("Checking views...")
    for view in views_to_check:
        try:
            cursor.execute(f"SELECT * FROM {view} LIMIT 1")
            print(f"✓ View exists: {view}")
        except Exception as e:
            print(f"✗ View missing or error: {view}")
            all_exist = False
    
    print()
    
    cursor.close()
    conn.close()
    
    if all_exist:
        print("✓ All tables and views verified!")
    else:
        print("⚠ Some tables or views are missing")
    
    return all_exist

def main():
    print()
    print("GSA/GWAC Migration - Automatic Test")
    print()
    
    # Run migration
    migration_success = run_migration()
    
    # Verify tables
    tables_exist = verify_tables()
    
    # Summary
    print()
    print("=" * 60)
    print("Summary")
    print("=" * 60)
    print()
    
    if migration_success and tables_exist:
        print("✓ Migration completed successfully!")
        print("✓ All tables verified!")
        print()
        print("Database is ready for GSA/GWAC data collection!")
        print()
        print("Next steps:")
        print("  1. Download GSA schedule data: ./setup-gsa-gwac.sh")
        print("  2. Or manually: visit https://www.gsaelibrary.gsa.gov")
        print("  3. Run scrapers when data is ready")
        print()
        print("You can now run the scrapers!")
        return True
    else:
        print("⚠ Migration had issues")
        print()
        print("Please check the error messages above.")
        print()
        return False

if __name__ == "__main__":
    main()

