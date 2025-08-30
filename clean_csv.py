#!/usr/bin/env python3
"""
CSV Cleaner for DSIP Data Import
Fixes CSV formatting issues while preserving all content
"""

import csv
import re

# Increase CSV field size limit to handle very long fields
csv.field_size_limit(2147483647)  # Maximum 32-bit integer

def clean_csv(input_file, output_file):
    """Clean CSV file to fix import issues while preserving content"""
    
    print(f"🧹 Cleaning {input_file}...")
    
    with open(input_file, 'r', encoding='utf-8') as infile, \
         open(output_file, 'w', newline='', encoding='utf-8') as outfile:
        
        # Use more robust CSV reading
        reader = csv.reader(infile, quoting=csv.QUOTE_MINIMAL)
        writer = csv.writer(outfile, quoting=csv.QUOTE_ALL)  # Quote all fields to handle commas
        
        # Process header
        header = next(reader)
        writer.writerow(header)
        
        row_count = 0
        cleaned_count = 0
        
        for row in reader:
            row_count += 1
            
            # Clean each field
            cleaned_row = []
            for field in row:
                if field is None:
                    cleaned_field = ""
                else:
                    # Keep all content, just fix CSV formatting
                    cleaned_field = str(field)
                    
                    # Remove any null bytes or other problematic characters that break CSV
                    cleaned_field = cleaned_field.replace('\x00', '')
                    cleaned_field = re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]', '', cleaned_field)
                    
                    # Note: We're NOT truncating or modifying the actual content
                    # The CSV writer will handle quotes properly
                
                cleaned_row.append(cleaned_field)
            
            writer.writerow(cleaned_row)
            cleaned_count += 1
            
            if row_count % 1000 == 0:
                print(f"✅ Processed {row_count:,} rows...")
    
    print(f"🎉 Cleaning complete!")
    print(f"📊 Original rows: {row_count:,}")
    print(f"📊 Cleaned rows: {cleaned_count:,}")
    print(f"💾 Clean file saved as: {output_file}")
    print("📝 All content preserved - only fixed CSV formatting issues")

if __name__ == "__main__":
    input_file = "dod_sbir_topics_rows.csv"
    output_file = "dod_sbir_topics_rows_cleaned.csv"
    
    clean_csv(input_file, output_file)
    
    print("\n📋 Next steps:")
    print("1. Try importing the cleaned CSV file")
    print("2. The cleaned file preserves ALL your data")
    print("3. Only fixes CSV formatting issues that cause import failures")
