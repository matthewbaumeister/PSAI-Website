#!/usr/bin/env python3
"""
GWAC Scraper
Downloads company lists from various GWAC websites
"""

import os
import time
import json
import requests
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Optional
import logging
from bs4 import BeautifulSoup
import re

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class GWACScraper:
    """Scrapes GWAC holder lists from various sources"""
    
    def __init__(self, output_dir: str = "data/gwac_holders"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # GWAC configurations
        self.gwacs = {
            'alliant2_sb': {
                'name': 'Alliant 2 Small Business',
                'url': 'https://www.gsa.gov/technology/technology-purchasing-programs/governmentwide-acquisition-contracts/alliant-2/alliant-2-small-business',
                'type': 'IT',
                'managing_agency': 'GSA',
                'method': 'manual',  # Requires manual download
            },
            'alliant2': {
                'name': 'Alliant 2 Unrestricted',
                'url': 'https://www.gsa.gov/technology/technology-purchasing-programs/governmentwide-acquisition-contracts/alliant-2/alliant-2-unrestricted',
                'type': 'IT',
                'managing_agency': 'GSA',
                'method': 'manual',
            },
            'oasis_sb': {
                'name': 'OASIS Small Business',
                'url': 'https://www.gsa.gov/technology/technology-purchasing-programs/governmentwide-acquisition-contracts/oasis-small-business',
                'type': 'Professional Services',
                'managing_agency': 'GSA',
                'method': 'manual',
            },
            'oasis': {
                'name': 'OASIS Unrestricted',
                'url': 'https://www.gsa.gov/technology/technology-purchasing-programs/governmentwide-acquisition-contracts/oasis-unrestricted',
                'type': 'Professional Services',
                'managing_agency': 'GSA',
                'method': 'manual',
            },
            'stars3': {
                'name': '8(a) STARS III',
                'url': 'https://www.gsa.gov/technology/technology-purchasing-programs/governmentwide-acquisition-contracts/8a-stars-iii',
                'type': 'IT',
                'managing_agency': 'GSA',
                'method': 'manual',
            },
            'polaris_sb': {
                'name': 'Polaris Small Business',
                'url': 'https://www.gsa.gov/technology/technology-purchasing-programs/governmentwide-acquisition-contracts/polaris',
                'type': 'IT',
                'managing_agency': 'GSA',
                'method': 'manual',
            },
            'polaris': {
                'name': 'Polaris Unrestricted',
                'url': 'https://www.gsa.gov/technology/technology-purchasing-programs/governmentwide-acquisition-contracts/polaris',
                'type': 'IT',
                'managing_agency': 'GSA',
                'method': 'manual',
            },
        }
    
    def scrape_nitaac_gwac(self, gwac_name: str) -> List[Dict]:
        """
        Scrape NITAAC GWAC directory
        
        NITAAC provides a searchable directory at:
        https://nitaac.nih.gov/resources/frequently-asked-questions/there-way-see-which-contract-holders-are-each-gwac
        
        This would require web scraping with JavaScript execution (Selenium)
        """
        logger.info(f"Scraping NITAAC GWAC: {gwac_name}")
        
        # Placeholder - actual implementation would use Selenium
        # to interact with the NITAAC directory's filtering system
        
        logger.warning("NITAAC scraping requires Selenium - use manual download for now")
        return []
    
    def parse_gsa_gwac_pdf(self, pdf_path: Path, gwac_name: str) -> List[Dict]:
        """
        Parse GSA GWAC holder list from PDF
        
        GSA GWACs typically provide PDF lists of holders.
        This requires PDF parsing (PyPDF2 or pdfplumber)
        """
        logger.info(f"Parsing PDF for {gwac_name}: {pdf_path}")
        
        try:
            import pdfplumber
            
            holders = []
            with pdfplumber.open(pdf_path) as pdf:
                for page in pdf.pages:
                    text = page.extract_text()
                    
                    # Parse company information from text
                    # Format varies by GWAC, but typically includes:
                    # - Company name
                    # - Contract number
                    # - Address
                    # - Contact info
                    
                    # Example parsing (adjust based on actual format)
                    lines = text.split('\n')
                    current_company = {}
                    
                    for line in lines:
                        line = line.strip()
                        
                        # Detect company name (usually all caps or starts line)
                        if line and line[0].isupper() and not current_company:
                            current_company['company_name'] = line
                        
                        # Detect contract number (format: XXX-XX-XXXX-XXXX)
                        contract_match = re.search(r'\d{3}-\d{2}-\d{4}-\d{4}', line)
                        if contract_match:
                            current_company['contract_number'] = contract_match.group()
                        
                        # Detect email
                        email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', line)
                        if email_match:
                            current_company['primary_contact_email'] = email_match.group()
                        
                        # Detect phone
                        phone_match = re.search(r'\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', line)
                        if phone_match:
                            current_company['primary_contact_phone'] = phone_match.group()
                        
                        # Detect website
                        if 'www.' in line.lower() or 'http' in line.lower():
                            current_company['website'] = line
                        
                        # If we have enough info, save and reset
                        if current_company and 'contract_number' in current_company:
                            current_company['gwac_name'] = gwac_name
                            holders.append(current_company.copy())
                            current_company = {}
            
            logger.info(f"Parsed {len(holders)} holders from PDF")
            return holders
            
        except ImportError:
            logger.error("pdfplumber not installed. Install with: pip install pdfplumber")
            return []
        except Exception as e:
            logger.error(f"Error parsing PDF: {e}")
            return []
    
    def parse_manual_csv(self, csv_path: Path, gwac_name: str) -> List[Dict]:
        """Parse manually created CSV of GWAC holders"""
        import pandas as pd
        
        logger.info(f"Parsing CSV for {gwac_name}: {csv_path}")
        
        try:
            df = pd.read_csv(csv_path)
            
            holders = []
            for _, row in df.iterrows():
                holder = {
                    'gwac_name': gwac_name,
                    'company_name': row.get('Company Name') or row.get('company_name'),
                    'contract_number': row.get('Contract Number') or row.get('contract_number'),
                    'vendor_duns': row.get('DUNS') or row.get('duns'),
                    'vendor_uei': row.get('UEI') or row.get('uei'),
                    'vendor_cage_code': row.get('CAGE') or row.get('cage_code'),
                    'company_address': row.get('Address') or row.get('address'),
                    'company_city': row.get('City') or row.get('city'),
                    'company_state': row.get('State') or row.get('state'),
                    'company_zip': row.get('ZIP') or row.get('zip'),
                    'website': row.get('Website') or row.get('website'),
                    'primary_contact_email': row.get('Email') or row.get('email'),
                    'primary_contact_phone': row.get('Phone') or row.get('phone'),
                    'small_business': self._parse_boolean(row.get('Small Business')),
                }
                
                # Remove None values
                holder = {k: v for k, v in holder.items() if pd.notna(v) and v is not None}
                holders.append(holder)
            
            logger.info(f"Parsed {len(holders)} holders from CSV")
            return holders
            
        except Exception as e:
            logger.error(f"Error parsing CSV: {e}")
            return []
    
    def _parse_boolean(self, value) -> Optional[bool]:
        """Parse various boolean representations"""
        import pandas as pd
        
        if pd.isna(value):
            return None
        if isinstance(value, bool):
            return value
        if isinstance(value, str):
            value = value.strip().lower()
            if value in ['yes', 'y', 'true', 't', '1', 'x']:
                return True
            if value in ['no', 'n', 'false', 'f', '0', '']:
                return False
        return None
    
    def export_to_json(self, holders: List[Dict], gwac_key: str) -> Path:
        """Export holder data to JSON for database import"""
        output_file = self.output_dir / f"GWAC_{gwac_key}_{datetime.now().strftime('%Y%m%d')}.json"
        
        with open(output_file, 'w') as f:
            json.dump(holders, f, indent=2, default=str)
        
        logger.info(f"Exported {len(holders)} holders to {output_file}")
        return output_file
    
    def process_all_gwacs(self):
        """Process all GWACs (manual and automated)"""
        logger.info(f"Starting GWAC scraper for {len(self.gwacs)} GWACs")
        
        results = {}
        
        for gwac_key, gwac_info in self.gwacs.items():
            logger.info(f"Processing: {gwac_info['name']}")
            
            # Check for manually downloaded files
            # Look for CSV or PDF files in output directory
            csv_file = self.output_dir / f"{gwac_key}.csv"
            pdf_file = self.output_dir / f"{gwac_key}.pdf"
            
            holders = []
            
            if csv_file.exists():
                holders = self.parse_manual_csv(csv_file, gwac_info['name'])
            elif pdf_file.exists():
                holders = self.parse_gsa_gwac_pdf(pdf_file, gwac_info['name'])
            else:
                logger.warning(f"No data file found for {gwac_key}")
                logger.info(f"Download from: {gwac_info['url']}")
                continue
            
            if holders:
                json_file = self.export_to_json(holders, gwac_key)
                results[gwac_key] = {
                    'name': gwac_info['name'],
                    'count': len(holders),
                    'json_file': str(json_file)
                }
        
        # Summary report
        self._generate_summary(results)
        
        logger.info("GWAC scraping completed")
        return results
    
    def _generate_summary(self, results: Dict):
        """Generate summary report"""
        summary_file = self.output_dir / f"scrape_summary_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        
        summary = {
            'scrape_date': datetime.now().isoformat(),
            'total_gwacs_processed': len(results),
            'total_holders': sum(r['count'] for r in results.values()),
            'gwacs': results
        }
        
        with open(summary_file, 'w') as f:
            json.dump(summary, f, indent=2)
        
        logger.info(f"Summary report saved to {summary_file}")
        logger.info(f"Total GWACs processed: {summary['total_gwacs_processed']}")
        logger.info(f"Total holders found: {summary['total_holders']}")


def main():
    """Main execution function"""
    scraper = GWACScraper()
    
    print("=" * 60)
    print("GWAC Holder Scraper")
    print("=" * 60)
    print(f"Target GWACs: {len(scraper.gwacs)}")
    print(f"Output directory: {scraper.output_dir}")
    print()
    print("GWAC holder lists are typically provided as PDFs or web pages.")
    print("For best results:")
    print()
    print("1. Manually download holder lists from GWAC websites")
    print("2. Save as CSV or PDF in the output directory")
    print("3. Name files: gwac_key.csv or gwac_key.pdf")
    print()
    print("GWAC URLs:")
    for key, info in scraper.gwacs.items():
        print(f"  {key}: {info['url']}")
    print()
    
    print("Checking for existing files...")
    found = False
    for gwac_key in scraper.gwacs.keys():
        csv_file = scraper.output_dir / f"{gwac_key}.csv"
        pdf_file = scraper.output_dir / f"{gwac_key}.pdf"
        if csv_file.exists() or pdf_file.exists():
            print(f"  Found data for: {gwac_key}")
            found = True
    
    if found:
        response = input("\nProcess existing files? (y/n): ")
        if response.lower() == 'y':
            results = scraper.process_all_gwacs()
            print(f"\nCompleted! Processed {len(results)} GWACs")
    else:
        print("\nNo data files found. Download holder lists first.")


if __name__ == "__main__":
    main()

