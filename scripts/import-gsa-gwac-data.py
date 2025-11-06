#!/usr/bin/env python3
"""
GSA/GWAC Data Importer
Imports scraped GSA Schedule and GWAC holder data into Supabase
"""

import os
import json
import sys
from pathlib import Path
from typing import List, Dict
from datetime import datetime
import logging

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

try:
    from supabase import create_client, Client
except ImportError:
    logger.error("Supabase client not installed. Install with: pip install supabase")
    sys.exit(1)


class GSAGWACImporter:
    """Imports GSA Schedule and GWAC data into Supabase"""
    
    def __init__(self):
        # Get Supabase credentials from environment
        self.supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
        self.supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
        
        if not self.supabase_url or not self.supabase_key:
            raise ValueError("Missing Supabase credentials in environment")
        
        self.supabase: Client = create_client(self.supabase_url, self.supabase_key)
        
        self.stats = {
            'gsa_inserted': 0,
            'gsa_updated': 0,
            'gsa_errors': 0,
            'gwac_inserted': 0,
            'gwac_updated': 0,
            'gwac_errors': 0,
        }
    
    def import_gsa_schedules(self, json_files: List[Path], sin_code: str):
        """Import GSA Schedule holders from JSON files"""
        logger.info(f"Importing GSA Schedule holders for SIN: {sin_code}")
        
        # Start scraper log
        log_id = self._start_scraper_log('gsa_schedule', sin_code)
        
        for json_file in json_files:
            try:
                with open(json_file, 'r') as f:
                    data = json.load(f)
                
                # Handle new parser format with 'contractors' key
                if isinstance(data, dict) and 'contractors' in data:
                    contractors = data['contractors']
                    sin_code = data.get('sin_code', sin_code)
                else:
                    contractors = data
                
                logger.info(f"Processing {len(contractors)} contractors from {json_file}")
                
                for contractor in contractors:
                    try:
                        # Add SIN code
                        if sin_code:
                            contractor['sin_codes'] = [sin_code]
                            contractor['primary_sin'] = sin_code
                        
                        # Set metadata
                        contractor['data_source'] = 'gsa_elibrary'
                        contractor['last_scraped'] = datetime.now().isoformat()
                        
                        # Upsert to database
                        result = self._upsert_gsa_holder(contractor)
                        
                        if result == 'inserted':
                            self.stats['gsa_inserted'] += 1
                        elif result == 'updated':
                            self.stats['gsa_updated'] += 1
                        
                    except Exception as e:
                        logger.error(f"Error processing contractor {contractor.get('company_name')}: {e}")
                        self.stats['gsa_errors'] += 1
                
            except Exception as e:
                logger.error(f"Error reading file {json_file}: {e}")
        
        # Complete scraper log
        self._complete_scraper_log(log_id, 'gsa_schedule')
        
        logger.info(f"GSA import completed: {self.stats['gsa_inserted']} inserted, {self.stats['gsa_updated']} updated, {self.stats['gsa_errors']} errors")
    
    def import_gwac_holders(self, json_files: List[Path]):
        """Import GWAC holders from JSON files"""
        logger.info(f"Importing GWAC holders from {len(json_files)} files")
        
        # Start scraper log
        log_id = self._start_scraper_log('gwac', 'all')
        
        for json_file in json_files:
            try:
                with open(json_file, 'r') as f:
                    holders = json.load(f)
                
                # Extract GWAC name from file or data
                gwac_name = holders[0].get('gwac_name') if holders else 'Unknown'
                logger.info(f"Processing {len(holders)} holders for {gwac_name}")
                
                for holder in holders:
                    try:
                        # Get GWAC info from catalog
                        gwac_info = self._get_gwac_info(holder['gwac_name'])
                        
                        # Add GWAC metadata
                        if gwac_info:
                            holder['gwac_type'] = gwac_info.get('gwac_type')
                            holder['managing_agency'] = gwac_info.get('managing_agency')
                        
                        # Set metadata
                        holder['data_source'] = 'gwac_website'
                        holder['last_scraped'] = datetime.now().isoformat()
                        holder['is_active'] = True
                        
                        # Upsert to database
                        result = self._upsert_gwac_holder(holder)
                        
                        if result == 'inserted':
                            self.stats['gwac_inserted'] += 1
                        elif result == 'updated':
                            self.stats['gwac_updated'] += 1
                        
                    except Exception as e:
                        logger.error(f"Error processing holder {holder.get('company_name')}: {e}")
                        self.stats['gwac_errors'] += 1
                
            except Exception as e:
                logger.error(f"Error reading file {json_file}: {e}")
        
        # Complete scraper log
        self._complete_scraper_log(log_id, 'gwac')
        
        logger.info(f"GWAC import completed: {self.stats['gwac_inserted']} inserted, {self.stats['gwac_updated']} updated, {self.stats['gwac_errors']} errors")
    
    def _upsert_gsa_holder(self, contractor: Dict) -> str:
        """Upsert GSA schedule holder to database"""
        try:
            # Check if exists - need to get full record to merge SINs
            existing = self.supabase.table('gsa_schedule_holders').select('id, sin_codes').eq(
                'contract_number', contractor.get('contract_number')
            ).eq(
                'company_name', contractor.get('company_name')
            ).execute()
            
            if existing.data:
                # MERGE SINs instead of overwriting
                existing_sins = existing.data[0].get('sin_codes', []) or []
                new_sins = contractor.get('sin_codes', [])
                
                # Combine and deduplicate SINs
                merged_sins = list(set(existing_sins + new_sins))
                contractor['sin_codes'] = merged_sins
                
                # Keep the first SIN as primary if not set
                if not contractor.get('primary_sin') and merged_sins:
                    contractor['primary_sin'] = merged_sins[0]
                
                # Update existing record with merged data
                self.supabase.table('gsa_schedule_holders').update(
                    contractor
                ).eq('id', existing.data[0]['id']).execute()
                return 'updated'
            else:
                # Insert new record
                self.supabase.table('gsa_schedule_holders').insert(
                    contractor
                ).execute()
                return 'inserted'
                
        except Exception as e:
            logger.error(f"Database error for {contractor.get('company_name')}: {e}")
            raise
    
    def _upsert_gwac_holder(self, holder: Dict) -> str:
        """Upsert GWAC holder to database"""
        try:
            # Check if exists
            existing = self.supabase.table('gwac_holders').select('id').eq(
                'gwac_name', holder.get('gwac_name')
            ).eq(
                'contract_number', holder.get('contract_number')
            ).eq(
                'company_name', holder.get('company_name')
            ).execute()
            
            if existing.data:
                # Update existing record
                self.supabase.table('gwac_holders').update(
                    holder
                ).eq('id', existing.data[0]['id']).execute()
                return 'updated'
            else:
                # Insert new record
                self.supabase.table('gwac_holders').insert(
                    holder
                ).execute()
                return 'inserted'
                
        except Exception as e:
            logger.error(f"Database error for {holder.get('company_name')}: {e}")
            raise
    
    def _get_gwac_info(self, gwac_name: str) -> Dict:
        """Get GWAC information from catalog"""
        try:
            result = self.supabase.table('gwac_catalog').select('*').eq(
                'gwac_name', gwac_name
            ).execute()
            
            if result.data:
                return result.data[0]
            return {}
            
        except Exception as e:
            logger.warning(f"Could not find GWAC info for {gwac_name}: {e}")
            return {}
    
    def _start_scraper_log(self, scrape_type: str, target: str) -> int:
        """Create scraper log entry"""
        try:
            result = self.supabase.table('gsa_gwac_scraper_log').insert({
                'scrape_type': scrape_type,
                'target': target,
                'status': 'running',
                'started_at': datetime.now().isoformat()
            }).execute()
            
            if result.data:
                return result.data[0]['id']
            return None
            
        except Exception as e:
            logger.warning(f"Could not create scraper log: {e}")
            return None
    
    def _complete_scraper_log(self, log_id: int, scrape_type: str):
        """Update scraper log with completion info"""
        if not log_id:
            return
        
        try:
            if scrape_type == 'gsa_schedule':
                records_inserted = self.stats['gsa_inserted']
                records_updated = self.stats['gsa_updated']
                records_errors = self.stats['gsa_errors']
            else:
                records_inserted = self.stats['gwac_inserted']
                records_updated = self.stats['gwac_updated']
                records_errors = self.stats['gwac_errors']
            
            self.supabase.table('gsa_gwac_scraper_log').update({
                'status': 'completed' if records_errors == 0 else 'partial',
                'records_inserted': records_inserted,
                'records_updated': records_updated,
                'records_errors': records_errors,
                'completed_at': datetime.now().isoformat()
            }).eq('id', log_id).execute()
            
        except Exception as e:
            logger.warning(f"Could not update scraper log: {e}")
    
    def link_to_company_intelligence(self):
        """Link GSA/GWAC data to company_intelligence table via UEI"""
        logger.info("Linking GSA/GWAC data to company intelligence...")
        
        try:
            # This would be done via SQL for efficiency
            # Execute the linking query
            query = """
            UPDATE company_intelligence ci
            SET 
              gsa_schedules = (
                SELECT ARRAY_AGG(DISTINCT schedule_number)
                FROM gsa_schedule_holders gsh
                WHERE gsh.vendor_uei = ci.vendor_uei
                  AND gsh.is_active = true
              ),
              gwacs = (
                SELECT ARRAY_AGG(DISTINCT gwac_name)
                FROM gwac_holders gh
                WHERE gh.vendor_uei = ci.vendor_uei
                  AND gh.is_active = true
              )
            WHERE ci.vendor_uei IS NOT NULL
            """
            
            # Note: Direct SQL execution would require psycopg2
            # For now, log the query
            logger.info("Execute this SQL to link data:")
            logger.info(query)
            
        except Exception as e:
            logger.error(f"Error linking data: {e}")


def main():
    """Main execution function"""
    print("=" * 60)
    print("GSA/GWAC Data Importer")
    print("=" * 60)
    print()
    
    # Initialize importer
    try:
        importer = GSAGWACImporter()
        logger.info("Connected to Supabase successfully")
    except Exception as e:
        logger.error(f"Failed to initialize importer: {e}")
        sys.exit(1)
    
    # Import GSA Schedules
    gsa_data_dir = Path("data/gsa_schedules/parsed")
    if gsa_data_dir.exists():
        json_files = list(gsa_data_dir.glob("GSA_MAS_*_parsed.json"))
        if json_files:
            print(f"\nFound {len(json_files)} GSA Schedule JSON files")
            response = input("Import GSA Schedule data? (y/n): ")
            if response.lower() == 'y':
                # Group files by SIN
                sin_files = {}
                for f in json_files:
                    # Extract SIN from filename: GSA_MAS_54151S_parsed.json
                    parts = f.stem.split('_')
                    if len(parts) >= 3:
                        sin = parts[2]
                        if sin not in sin_files:
                            sin_files[sin] = []
                        sin_files[sin].append(f)
                
                for sin, files in sin_files.items():
                    importer.import_gsa_schedules(files, sin)
    
    # Import GWAC Holders
    gwac_data_dir = Path("data/gwac_holders")
    if gwac_data_dir.exists():
        json_files = list(gwac_data_dir.glob("GWAC_*.json"))
        if json_files:
            print(f"\nFound {len(json_files)} GWAC JSON files")
            response = input("Import GWAC holder data? (y/n): ")
            if response.lower() == 'y':
                importer.import_gwac_holders(json_files)
    
    # Summary
    print("\n" + "=" * 60)
    print("Import Summary")
    print("=" * 60)
    print(f"GSA Schedule Holders:")
    print(f"  Inserted: {importer.stats['gsa_inserted']}")
    print(f"  Updated: {importer.stats['gsa_updated']}")
    print(f"  Errors: {importer.stats['gsa_errors']}")
    print(f"\nGWAC Holders:")
    print(f"  Inserted: {importer.stats['gwac_inserted']}")
    print(f"  Updated: {importer.stats['gwac_updated']}")
    print(f"  Errors: {importer.stats['gwac_errors']}")
    print()
    
    # Offer to link data
    if importer.stats['gsa_inserted'] > 0 or importer.stats['gwac_inserted'] > 0:
        response = input("Link to company_intelligence table? (y/n): ")
        if response.lower() == 'y':
            importer.link_to_company_intelligence()


if __name__ == "__main__":
    main()

