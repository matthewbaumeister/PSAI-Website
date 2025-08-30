#!/usr/bin/env python3
"""
Convert CSV to SQL INSERT statements for direct database import
"""

import csv
import os

# Increase CSV field size limit
csv.field_size_limit(2147483647)

def csv_to_sql(input_file, output_file, batch_size=1000):
    """Convert CSV to SQL INSERT statements"""
    
    print(f"🔄 Converting {input_file} to SQL...")
    
    with open(input_file, 'r', encoding='utf-8') as infile, \
         open(output_file, 'w', encoding='utf-8') as outfile:
        
        reader = csv.reader(infile)
        header = next(reader)
        
        # Write the SQL file header
        outfile.write("-- DSIP Data Import SQL\n")
        outfile.write("-- Generated from CSV\n\n")
        outfile.write("BEGIN;\n\n")
        
        row_count = 0
        batch_count = 0
        
        for row in reader:
            if row_count % batch_size == 0:
                if batch_count > 0:
                    outfile.write(";\n\n")
                outfile.write(f"-- Batch {batch_count + 1}\n")
                outfile.write("INSERT INTO dsip_opportunities (")
                outfile.write(", ".join(header))
                outfile.write(") VALUES\n")
                batch_count += 1
            
            # Format the row values
            formatted_values = []
            for value in row:
                if value is None or value == "":
                    formatted_values.append("NULL")
                else:
                    # Escape single quotes and wrap in quotes
                    escaped_value = str(value).replace("'", "''")
                    formatted_values.append(f"'{escaped_value}'")
            
            if row_count % batch_size == 0:
                outfile.write("(" + ", ".join(formatted_values) + ")")
            else:
                outfile.write(",\n(" + ", ".join(formatted_values) + ")")
            
            row_count += 1
            
            if row_count % 1000 == 0:
                print(f"✅ Processed {row_count:,} rows...")
        
        # Close the last batch
        outfile.write(";\n\n")
        outfile.write("COMMIT;\n")
    
    print(f"🎉 Conversion complete!")
    print(f"📊 Total rows: {row_count:,}")
    print(f"📊 Batches: {batch_count}")
    print(f"💾 SQL file: {output_file}")

if __name__ == "__main__":
    input_file = "dod_sbir_topics_rows_cleaned.csv"
    output_file = "dsip_import.sql"
    
    csv_to_sql(input_file, output_file)
    
    print("\n📋 Next steps:")
    print("1. Copy the SQL file content")
    print("2. Paste into Supabase SQL Editor")
    print("3. Run the SQL to import all data")
