#!/usr/bin/env python3
"""
GSA Pricing Parser
Parses labor categories and rates from downloaded GSA price list Excel files
"""

import os
import sys
import re
import json
import logging
import pandas as pd
from pathlib import Path
from datetime import datetime
from typing import Optional, Dict, List, Any
from supabase import create_client

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class GSAPricingParser:
    def __init__(self):
        """Initialize the parser with Supabase connection"""
        self.supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
        self.supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
        
        if not self.supabase_url or not self.supabase_key:
            raise ValueError("Missing Supabase credentials in environment")
        
        self.supabase = create_client(self.supabase_url, self.supabase_key)
        
        # Setup directories
        self.download_dir = Path("data/gsa_pricing")
        self.parsed_dir = Path("data/gsa_pricing/parsed")
        self.parsed_dir.mkdir(parents=True, exist_ok=True)
        
        # Common column name mappings for labor categories
        self.column_mappings = {
            'labor_category': [
                'Labor Category', 'Labor Cat', 'Job Title', 'Title', 
                'Position', 'Position Title', 'Service', 'Service Category',
                'Labor', 'Category', 'Description', 'Role', 'Job Role'
            ],
            'hourly_rate': [
                'Hourly Rate', 'Hour Rate', 'Rate', 'Hourly', 'Price',
                'Ceiling Price', 'Government Price', 'GSA Price', 'Rate/Hour',
                'Hourly Ceiling', 'Year 1', 'Year 1 Rate', 'Current Year',
                'Price Per Hour', 'Cost Per Hour'
            ],
            'education': [
                'Education', 'Degree', 'Education Level', 'Min Education',
                'Minimum Education', 'Required Education'
            ],
            'experience': [
                'Experience', 'Years Experience', 'Years of Experience',
                'Min Experience', 'Minimum Experience', 'Required Experience',
                'Yrs Exp'
            ],
            'clearance': [
                'Security Clearance', 'Clearance', 'Security', 'Clearance Required',
                'Required Clearance'
            ]
        }
        
        # Stats
        self.stats = {
            'total_files': 0,
            'parsed': 0,
            'failed': 0,
            'labor_categories_found': 0
        }
    
    def _find_column(self, df: pd.DataFrame, possible_names: List[str]) -> Optional[str]:
        """Find a column in the DataFrame by checking possible names"""
        # First try exact match (case-insensitive)
        for col in df.columns:
            col_lower = str(col).lower().strip()
            for possible in possible_names:
                if col_lower == possible.lower():
                    return col
        
        # Then try partial match
        for col in df.columns:
            col_lower = str(col).lower().strip()
            for possible in possible_names:
                if possible.lower() in col_lower or col_lower in possible.lower():
                    return col
        
        return None
    
    def _clean_rate(self, value: Any) -> Optional[float]:
        """Clean and convert rate value to float"""
        if pd.isna(value):
            return None
        
        # Convert to string and clean
        value_str = str(value).strip()
        
        # Remove currency symbols and commas
        value_str = re.sub(r'[$,]', '', value_str)
        
        # Try to extract numeric value
        match = re.search(r'(\d+\.?\d*)', value_str)
        if match:
            try:
                rate = float(match.group(1))
                # Sanity check: hourly rates should be between $10 and $500
                if 10 <= rate <= 500:
                    return rate
            except ValueError:
                pass
        
        return None
    
    def _detect_header_row(self, df: pd.DataFrame) -> int:
        """
        Detect which row contains the actual headers
        Some Excel files have title rows before the actual data
        """
        # Check first 10 rows for headers
        for i in range(min(10, len(df))):
            row = df.iloc[i]
            row_str = ' '.join([str(val).lower() for val in row if pd.notna(val)])
            
            # Look for common keywords
            keywords = ['labor', 'category', 'rate', 'hourly', 'title', 'price']
            matches = sum(1 for keyword in keywords if keyword in row_str)
            
            if matches >= 2:
                return i
        
        return 0  # Default to first row
    
    def parse_excel_file(self, file_path: Path, contract_number: str) -> List[Dict]:
        """
        Parse a single Excel file for labor categories and rates
        Returns list of labor category dictionaries
        """
        labor_categories = []
        
        try:
            # Read Excel file
            xl = pd.ExcelFile(file_path)
            logger.info(f"  Sheets found: {xl.sheet_names}")
            
            # Process each sheet
            for sheet_name in xl.sheet_names:
                logger.info(f"  Processing sheet: {sheet_name}")
                
                # Read the sheet
                df = pd.read_excel(file_path, sheet_name=sheet_name)
                
                if df.empty:
                    continue
                
                # Detect header row
                header_row = self._detect_header_row(df)
                if header_row > 0:
                    # Re-read with correct header
                    df = pd.read_excel(file_path, sheet_name=sheet_name, header=header_row)
                
                logger.info(f"    Rows: {len(df)}, Columns: {len(df.columns)}")
                
                # Find key columns
                labor_cat_col = self._find_column(df, self.column_mappings['labor_category'])
                rate_col = self._find_column(df, self.column_mappings['hourly_rate'])
                education_col = self._find_column(df, self.column_mappings['education'])
                experience_col = self._find_column(df, self.column_mappings['experience'])
                clearance_col = self._find_column(df, self.column_mappings['clearance'])
                
                if not labor_cat_col:
                    logger.warning(f"    Could not find labor category column in sheet '{sheet_name}'")
                    continue
                
                if not rate_col:
                    logger.warning(f"    Could not find rate column in sheet '{sheet_name}'")
                    continue
                
                logger.info(f"    Found labor category: '{labor_cat_col}'")
                logger.info(f"    Found rate: '{rate_col}'")
                
                # Parse each row
                sheet_categories = 0
                for idx, row in df.iterrows():
                    labor_cat = row.get(labor_cat_col)
                    rate = row.get(rate_col)
                    
                    # Skip if no labor category or rate
                    if pd.isna(labor_cat) or pd.isna(rate):
                        continue
                    
                    # Clean labor category
                    labor_cat = str(labor_cat).strip()
                    if not labor_cat or len(labor_cat) < 3:
                        continue
                    
                    # Clean rate
                    cleaned_rate = self._clean_rate(rate)
                    if not cleaned_rate:
                        continue
                    
                    # Build labor category dict
                    category = {
                        'contract_number': contract_number,
                        'labor_category': labor_cat,
                        'hourly_rate': cleaned_rate,
                        'source_sheet_name': sheet_name,
                        'source_row_number': int(idx) + header_row + 1,  # Excel row number
                        'raw_data': {}
                    }
                    
                    # Add optional fields
                    if education_col and pd.notna(row.get(education_col)):
                        category['education_level'] = str(row.get(education_col)).strip()
                    
                    if experience_col and pd.notna(row.get(experience_col)):
                        category['years_experience'] = str(row.get(experience_col)).strip()
                    
                    if clearance_col and pd.notna(row.get(clearance_col)):
                        category['security_clearance'] = str(row.get(clearance_col)).strip()
                    
                    # Store all raw data
                    for col in df.columns:
                        val = row.get(col)
                        if pd.notna(val):
                            clean_col = re.sub(r'[^a-zA-Z0-9_]', '_', str(col).lower().strip())
                            category['raw_data'][clean_col] = str(val)
                    
                    labor_categories.append(category)
                    sheet_categories += 1
                
                logger.info(f"    Found {sheet_categories} labor categories")
        
        except Exception as e:
            logger.error(f"  Error parsing {file_path.name}: {e}")
            raise
        
        return labor_categories
    
    def parse_all_files(self, limit: Optional[int] = None):
        """
        Parse all downloaded price list files
        
        Args:
            limit: Maximum number of files to parse (None for all)
        """
        logger.info("=" * 70)
        logger.info("GSA PRICING PARSER")
        logger.info("=" * 70)
        
        # Get all Excel files
        excel_files = list(self.download_dir.glob("*_pricelist.xlsx"))
        excel_files.extend(list(self.download_dir.glob("*_pricelist.xls")))
        
        self.stats['total_files'] = len(excel_files)
        
        if limit:
            excel_files = excel_files[:limit]
            logger.info(f"Limiting to first {limit} files")
        
        logger.info(f"Total files to parse: {len(excel_files)}")
        logger.info("")
        
        # Parse each file
        for i, file_path in enumerate(excel_files, 1):
            # Extract contract number from filename
            contract_number = file_path.stem.replace('_pricelist', '')
            
            logger.info(f"[{i}/{len(excel_files)}] Parsing: {contract_number}")
            
            try:
                # Get contractor_id and price_list_id from database
                contractor_result = self.supabase.table('gsa_schedule_holders')\
                    .select('id')\
                    .eq('contract_number', contract_number)\
                    .execute()
                
                if not contractor_result.data:
                    logger.warning(f"  Contractor not found in database: {contract_number}")
                    self.stats['failed'] += 1
                    continue
                
                contractor_id = contractor_result.data[0]['id']
                
                # Get price_list_id
                price_list_result = self.supabase.table('gsa_price_lists')\
                    .select('id')\
                    .eq('contract_number', contract_number)\
                    .execute()
                
                if not price_list_result.data:
                    logger.warning(f"  Price list record not found: {contract_number}")
                    self.stats['failed'] += 1
                    continue
                
                price_list_id = price_list_result.data[0]['id']
                
                # Update status to parsing
                self.supabase.table('gsa_price_lists').update({
                    'parse_status': 'parsing',
                    'updated_at': datetime.now().isoformat()
                }).eq('id', price_list_id).execute()
                
                # Parse the file
                labor_categories = self.parse_excel_file(file_path, contract_number)
                
                if not labor_categories:
                    logger.warning(f"  No labor categories found")
                    self.supabase.table('gsa_price_lists').update({
                        'parse_status': 'completed',
                        'labor_categories_count': 0,
                        'parsed_at': datetime.now().isoformat()
                    }).eq('id', price_list_id).execute()
                    self.stats['failed'] += 1
                    continue
                
                # Add contractor_id and price_list_id to each category
                for category in labor_categories:
                    category['contractor_id'] = contractor_id
                    category['price_list_id'] = price_list_id
                
                # Save to JSON
                output_file = self.parsed_dir / f"{contract_number}_parsed.json"
                with open(output_file, 'w') as f:
                    json.dump({
                        'contract_number': contract_number,
                        'contractor_id': contractor_id,
                        'price_list_id': price_list_id,
                        'labor_categories': labor_categories,
                        'parsed_at': datetime.now().isoformat()
                    }, f, indent=2)
                
                logger.info(f"  ✓ Found {len(labor_categories)} labor categories")
                
                # Update database
                self.supabase.table('gsa_price_lists').update({
                    'parse_status': 'completed',
                    'labor_categories_count': len(labor_categories),
                    'parsed_at': datetime.now().isoformat()
                }).eq('id', price_list_id).execute()
                
                self.stats['parsed'] += 1
                self.stats['labor_categories_found'] += len(labor_categories)
            
            except Exception as e:
                logger.error(f"  Failed to parse: {e}")
                
                # Update status to failed
                try:
                    self.supabase.table('gsa_price_lists').update({
                        'parse_status': 'failed',
                        'parse_error': str(e),
                        'updated_at': datetime.now().isoformat()
                    }).eq('contract_number', contract_number).execute()
                except:
                    pass
                
                self.stats['failed'] += 1
        
        # Final summary
        logger.info("")
        logger.info("=" * 70)
        logger.info("PARSING COMPLETE")
        logger.info("=" * 70)
        logger.info(f"Total files: {self.stats['total_files']}")
        logger.info(f"Parsed successfully: {self.stats['parsed']}")
        logger.info(f"Failed: {self.stats['failed']}")
        logger.info(f"Labor categories found: {self.stats['labor_categories_found']}")
        logger.info("")


def main():
    """Main entry point"""
    try:
        parser = GSAPricingParser()
        
        print("\n" + "=" * 70)
        print("GSA PRICING PARSER")
        print("=" * 70)
        print("\nThis will parse labor categories and rates from")
        print("downloaded price list Excel files.")
        print("")
        
        # Count files
        excel_files = list(parser.download_dir.glob("*_pricelist.xlsx"))
        excel_files.extend(list(parser.download_dir.glob("*_pricelist.xls")))
        print(f"Found {len(excel_files)} price list files to parse")
        print("")
        
        # Option to test with limited number
        test_mode = input("Test mode? Parse only first 5? (y/n): ").lower().strip()
        
        if test_mode == 'y':
            limit = 5
        else:
            limit = None
        
        # Start parsing
        parser.parse_all_files(limit=limit)
        
        print("\n✓ Parsing process completed!")
        print(f"\nParsed files saved to: {parser.parsed_dir}")
        
    except KeyboardInterrupt:
        logger.info("\nParsing cancelled by user")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Fatal error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()

