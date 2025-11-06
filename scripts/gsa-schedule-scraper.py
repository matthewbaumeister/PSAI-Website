#!/usr/bin/env python3
"""
GSA Schedule Parser
Parses downloaded GSA eLibrary Excel files to extract comprehensive contractor data:
- Company information
- Contract numbers and dates
- Price lists and labor categories  
- Service descriptions
- DUNS/UEI/CAGE codes
- All available company details
"""

import os
import json
import pandas as pd
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Optional, Any
import logging
import re
import glob

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class GSAScheduleParser:
    """Parses GSA eLibrary Excel files for comprehensive contractor data"""
    
    def __init__(self, input_dir: str = "data/gsa_schedules", output_dir: str = "data/gsa_schedules/parsed"):
        self.input_dir = Path(input_dir)
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # Common column name mappings (GSA uses various naming conventions)
        # Keys must match the database column names exactly!
        self.column_mappings = {
            'company_name': ['Vendor', 'Contractor Name', 'Company Name', 'Vendor Name', 'Business Name'],
            'contract_number': ['Contract Number', 'Contract', 'Contract No', 'Contract No.', 'Contact #'],
            'vendor_duns': ['DUNS', 'DUNS Number', 'DUNS#', 'D-U-N-S', 'Duns'],
            'vendor_uei': ['UEI', 'Unique Entity ID', 'SAM UEI', 'Unique Entity Identifier'],
            'vendor_cage_code': ['CAGE Code', 'CAGE', 'Cage Code', 'Cage'],
            'company_address': ['Address', 'Street Address', 'Address Line 1', 'Address 1', 'Mailing Address'],
            'company_city': ['City'],
            'company_state': ['State', 'ST'],
            'company_zip': ['ZIP', 'Zip', 'Zip Code', 'ZIP Code', 'Postal Code'],
            'primary_contact_phone': ['Phone', 'Telephone', 'Phone Number', 'Tel', 'Business Phone'],
            'primary_contact_email': ['Email', 'E-mail', 'Email Address', 'Contact Email'],
            'website': ['Website', 'URL', 'Web Site', 'Company Website'],
            'small_business': ['Small Business', 'SB', 'Small Bus'],
            'woman_owned': ['Woman Owned', 'WOSB', 'Women-Owned Small Business'],
            'veteran_owned': ['Veteran Owned', 'VOSB', 'Veteran-Owned Small Business'],
            'service_disabled_veteran_owned': ['Service Disabled Veteran', 'SDVOSB', 'Service-Disabled Veteran-Owned'],
            'eight_a_program': ['8(a)', '8a', 'Eight A', '8(a) Program'],
            'hubzone': ['HUBZone', 'HubZone', 'Hub Zone'],
            'contract_start_date': ['Contract Start', 'Start Date', 'Contract Start Date', 'Effective Date', 'Current Option Period End Date'],
            'contract_expiration_date': ['Contract End', 'End Date', 'Contract End Date', 'Expiration Date', 'Expiration', 'Ultimate Contract End Date'],
            'company_country': ['Country'],
        }
    
    def find_column(self, df: pd.DataFrame, field_name: str) -> Optional[str]:
        """Find the actual column name in dataframe based on mapping"""
        if field_name not in self.column_mappings:
            return None
        
        for possible_name in self.column_mappings[field_name]:
            if possible_name in df.columns:
                return possible_name
        return None
    
    def parse_excel_file(self, file_path: Path) -> Dict[str, Any]:
        """Parse a GSA Excel file and extract all available data"""
        try:
            logger.info(f"Parsing file: {file_path.name}")
            
            # Extract SIN from filename (format: GSA_MAS_<SIN>_<date>.xlsx)
            sin_match = re.search(r'GSA_MAS_([^_]+)_', file_path.name)
            sin_code = sin_match.group(1) if sin_match else "UNKNOWN"
            
            # Try to read all sheets
            xl_file = pd.ExcelFile(file_path)
            logger.info(f"  Found {len(xl_file.sheet_names)} sheets: {xl_file.sheet_names}")
            
            result = {
                'sin_code': sin_code,
                'file_name': file_path.name,
                'parsed_date': datetime.now().isoformat(),
                'sheets': {},
                'contractors': []
            }
            
            # Parse each sheet
            for sheet_name in xl_file.sheet_names:
                try:
                    df = pd.read_excel(file_path, sheet_name=sheet_name)
                    
                    logger.info(f"  Sheet '{sheet_name}': {len(df)} rows, {len(df.columns)} columns")
                    logger.info(f"    Columns: {list(df.columns)[:10]}...")  # Show first 10 columns
                    
                    # Store sheet metadata
                    result['sheets'][sheet_name] = {
                        'row_count': len(df),
                        'column_count': len(df.columns),
                        'columns': list(df.columns)
                    }
                    
                    # Parse contractor data (usually in first sheet or sheet named 'Contractors')
                    if sheet_name.lower() in ['contractors', 'sheet1', 'data'] or len(result['contractors']) == 0:
                        contractors = self._parse_contractor_sheet(df, sin_code)
                        if contractors:
                            result['contractors'].extend(contractors)
                
                except Exception as e:
                    logger.error(f"  Error parsing sheet '{sheet_name}': {e}")
                    continue
            
            logger.info(f"  Total contractors parsed: {len(result['contractors'])}")
            return result
            
        except Exception as e:
            logger.error(f"Error parsing file {file_path}: {e}")
            return None
    
    def _parse_contractor_sheet(self, df: pd.DataFrame, sin_code: str) -> List[Dict]:
        """Parse contractor data from a dataframe"""
        contractors = []
        
        # Find key columns
        company_name_col = self.find_column(df, 'company_name')
        contract_number_col = self.find_column(df, 'contract_number')
        
        if not company_name_col:
            logger.warning("  Could not find company name column, trying first text column")
            # Try to find a column that looks like company names
            for col in df.columns:
                if df[col].dtype == 'object' and len(df[col].dropna()) > 0:
                    company_name_col = col
                    break
        
        if not company_name_col:
            logger.error("  Could not identify company name column")
            return []
        
        logger.info(f"  Using '{company_name_col}' as company name column")
        
        for idx, row in df.iterrows():
            try:
                contractor = {
                    'sin_codes': [sin_code] if sin_code else [],
                    'primary_sin': sin_code,
                    'schedule_number': 'MAS',
                }
                
                # Extract all mapped fields
                for field_name, possible_cols in self.column_mappings.items():
                    col_name = self.find_column(df, field_name)
                    if col_name:
                        value = row.get(col_name)
                        if pd.notna(value):
                            # Special handling for different data types
                            if field_name in ['small_business', 'woman_owned', 'veteran_owned', 
                                            'service_disabled_veteran_owned', 'eight_a_program', 'hubzone']:
                                contractor[field_name] = self._parse_boolean(value)
                            elif field_name in ['contract_start_date', 'contract_expiration_date']:
                                contractor[field_name] = self._parse_date(value)
                            elif field_name == 'company_zip':
                                contractor[field_name] = str(value).strip()
                            elif field_name == 'primary_contact_phone':
                                contractor[field_name] = self._clean_phone(value)
                            else:
                                contractor[field_name] = str(value).strip() if isinstance(value, str) else value
                
                # Also capture any columns we don't have mappings for (for maximum data capture)
                additional_data = {}
                for col in df.columns:
                    # Skip if we already mapped it
                    if not any(col in possible_cols for possible_cols in self.column_mappings.values()):
                        value = row.get(col)
                        if pd.notna(value):
                            # Clean up column name for use as key
                            clean_col = re.sub(r'[^a-zA-Z0-9_]', '_', str(col).lower().strip())
                            additional_data[clean_col] = value
                
                if additional_data:
                    contractor['additional_data'] = additional_data
                
                # Only add if we have at least a company name
                if contractor.get('company_name'):
                    contractors.append(contractor)
                
            except Exception as e:
                logger.warning(f"  Error parsing row {idx}: {e}")
                continue
        
        return contractors
    
    def _parse_boolean(self, value) -> Optional[bool]:
        """Parse various boolean representations"""
        if pd.isna(value):
            return None
        if isinstance(value, bool):
            return value
        if isinstance(value, (int, float)):
            return bool(value)
        if isinstance(value, str):
            value = value.strip().lower()
            if value in ['yes', 'y', 'true', 't', '1', 'x']:
                return True
            if value in ['no', 'n', 'false', 'f', '0', '']:
                return False
        return None
    
    def _parse_date(self, value) -> Optional[str]:
        """Parse date to ISO format string"""
        if pd.isna(value):
            return None
        if isinstance(value, datetime):
            return value.date().isoformat()
        if isinstance(value, pd.Timestamp):
            return value.date().isoformat()
        # Try to parse string dates
        if isinstance(value, str):
            try:
                dt = pd.to_datetime(value)
                return dt.date().isoformat()
            except:
                return value
        return str(value)
    
    def _parse_currency(self, value) -> Optional[float]:
        """Parse currency values"""
        if pd.isna(value):
            return None
        if isinstance(value, (int, float)):
            return float(value)
        if isinstance(value, str):
            # Remove $, commas, and other currency symbols
            cleaned = re.sub(r'[$,\s]', '', value)
            try:
                return float(cleaned)
            except:
                return None
        return None
    
    def _clean_phone(self, value) -> Optional[str]:
        """Clean phone number"""
        if pd.isna(value):
            return None
        phone = str(value).strip()
        # Remove common formatting
        phone = re.sub(r'[^\d+x]', '', phone)
        return phone if phone else None
    
    def parse_all_files(self) -> Dict[str, Any]:
        """Parse all Excel files in input directory"""
        print("=" * 70)
        print("GSA SCHEDULE PARSER")
        print("=" * 70)
        print()
        print(f"Input directory: {self.input_dir}")
        print(f"Output directory: {self.output_dir}")
        print()
        
        # Find all Excel files
        excel_files = list(self.input_dir.glob("GSA_MAS_*.xlsx"))
        
        if not excel_files:
            logger.error(f"No Excel files found in {self.input_dir}")
            print("ERROR: No GSA Excel files found!")
            print()
            print("Make sure you've downloaded the files first:")
            print("  python3 scripts/gsa-elibrary-auto-download.py")
            return None
        
        logger.info(f"Found {len(excel_files)} Excel files to parse")
        print(f"Found {len(excel_files)} Excel files to parse")
        print()
        
        all_results = {
            'parse_date': datetime.now().isoformat(),
            'total_files': len(excel_files),
            'total_contractors': 0,
            'files': [],
            'sins_processed': []
        }
        
        # Parse each file
        for i, file_path in enumerate(excel_files, 1):
            print(f"[{i}/{len(excel_files)}] Parsing {file_path.name}...")
            
            result = self.parse_excel_file(file_path)
            
            if result:
                # Save individual file results
                sin_code = result['sin_code']
                output_file = self.output_dir / f"GSA_MAS_{sin_code}_parsed.json"
                
                with open(output_file, 'w') as f:
                    json.dump(result, f, indent=2, default=str)
                
                logger.info(f"  Saved to: {output_file.name}")
                
                all_results['files'].append({
                    'sin_code': sin_code,
                    'file_name': file_path.name,
                    'contractor_count': len(result['contractors']),
                    'output_file': output_file.name
                })
                all_results['total_contractors'] += len(result['contractors'])
                all_results['sins_processed'].append(sin_code)
            
            print()
        
        # Save summary
        summary_file = self.output_dir / f"parse_summary_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(summary_file, 'w') as f:
            json.dump(all_results, f, indent=2, default=str)
        
        # Print summary
        print("=" * 70)
        print("PARSING SUMMARY")
        print("=" * 70)
        print()
        print(f"Total files parsed: {all_results['total_files']}")
        print(f"Total contractors extracted: {all_results['total_contractors']}")
        print(f"Total unique SINs: {len(set(all_results['sins_processed']))}")
        print()
        print(f"Summary saved to: {summary_file}")
        print(f"Individual files saved to: {self.output_dir}/")
        print()
        print("=" * 70)
        print("NEXT STEPS:")
        print("=" * 70)
        print()
        print("Import the parsed data into your database:")
        print("  python3 scripts/import-gsa-gwac-data.py")
        print()
        print("The parsed JSON files contain:")
        print("  - Company names and contact information")
        print("  - Contract numbers and dates")
        print("  - DUNS/UEI/CAGE codes")
        print("  - Small business certifications")
        print("  - Price data (when available)")
        print("  - All additional columns from source files")
        print()
        
        return all_results


def main():
    """Main execution"""
    parser = GSAScheduleParser()
    results = parser.parse_all_files()
    
    if results:
        print("Parsing completed successfully!")
    else:
        print("Parsing failed. Check logs for details.")


if __name__ == "__main__":
    main()
