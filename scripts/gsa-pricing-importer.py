#!/usr/bin/env python3
"""
GSA Pricing Importer
Imports parsed labor category and pricing data into Supabase
"""

import os
import sys
import json
import logging
from pathlib import Path
from datetime import datetime
from typing import Optional, Dict, List
from supabase import create_client

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class GSAPricingImporter:
    def __init__(self):
        """Initialize the importer with Supabase connection"""
        self.supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
        self.supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
        
        if not self.supabase_url or not self.supabase_key:
            raise ValueError("Missing Supabase credentials in environment")
        
        self.supabase = create_client(self.supabase_url, self.supabase_key)
        
        # Setup directories
        self.parsed_dir = Path("data/gsa_pricing/parsed")
        
        if not self.parsed_dir.exists():
            raise ValueError(f"Parsed directory not found: {self.parsed_dir}")
        
        # Stats
        self.stats = {
            'total_files': 0,
            'total_categories': 0,
            'inserted': 0,
            'updated': 0,
            'errors': 0
        }
    
    def _upsert_labor_category(self, category: Dict) -> str:
        """
        Insert or update a single labor category
        Returns 'inserted', 'updated', or 'error'
        """
        try:
            # Check if already exists
            existing = self.supabase.table('gsa_labor_categories')\
                .select('id')\
                .eq('contract_number', category['contract_number'])\
                .eq('labor_category', category['labor_category'])\
                .eq('source_sheet_name', category['source_sheet_name'])\
                .eq('source_row_number', category['source_row_number'])\
                .execute()
            
            if existing.data:
                # Update existing record
                self.supabase.table('gsa_labor_categories')\
                    .update(category)\
                    .eq('id', existing.data[0]['id'])\
                    .execute()
                return 'updated'
            else:
                # Insert new record
                self.supabase.table('gsa_labor_categories')\
                    .insert(category)\
                    .execute()
                return 'inserted'
        
        except Exception as e:
            logger.error(f"Error upserting labor category: {e}")
            logger.error(f"Category: {category.get('labor_category', 'unknown')}")
            return 'error'
    
    def import_parsed_file(self, file_path: Path) -> Dict:
        """
        Import a single parsed JSON file
        Returns dict with import stats for this file
        """
        file_stats = {
            'inserted': 0,
            'updated': 0,
            'errors': 0
        }
        
        try:
            # Load JSON
            with open(file_path, 'r') as f:
                data = json.load(f)
            
            contract_number = data['contract_number']
            labor_categories = data['labor_categories']
            
            logger.info(f"  Importing {len(labor_categories)} labor categories")
            
            # Import each labor category
            for category in labor_categories:
                result = self._upsert_labor_category(category)
                
                if result == 'inserted':
                    file_stats['inserted'] += 1
                elif result == 'updated':
                    file_stats['updated'] += 1
                else:
                    file_stats['errors'] += 1
            
            return file_stats
        
        except Exception as e:
            logger.error(f"  Error importing file: {e}")
            file_stats['errors'] = 1
            return file_stats
    
    def import_all(self, limit: Optional[int] = None):
        """
        Import all parsed JSON files
        
        Args:
            limit: Maximum number of files to import (None for all)
        """
        logger.info("=" * 70)
        logger.info("GSA PRICING IMPORTER")
        logger.info("=" * 70)
        
        # Get all parsed JSON files
        json_files = list(self.parsed_dir.glob("*_parsed.json"))
        self.stats['total_files'] = len(json_files)
        
        if limit:
            json_files = json_files[:limit]
            logger.info(f"Limiting to first {limit} files")
        
        logger.info(f"Total files to import: {len(json_files)}")
        logger.info("")
        
        # Import each file
        for i, file_path in enumerate(json_files, 1):
            contract_number = file_path.stem.replace('_parsed', '')
            
            logger.info(f"[{i}/{len(json_files)}] Importing: {contract_number}")
            
            file_stats = self.import_parsed_file(file_path)
            
            # Update overall stats
            self.stats['inserted'] += file_stats['inserted']
            self.stats['updated'] += file_stats['updated']
            self.stats['errors'] += file_stats['errors']
            self.stats['total_categories'] += file_stats['inserted'] + file_stats['updated']
            
            logger.info(f"  Inserted: {file_stats['inserted']}, Updated: {file_stats['updated']}, Errors: {file_stats['errors']}")
        
        # Final summary
        logger.info("")
        logger.info("=" * 70)
        logger.info("IMPORT COMPLETE")
        logger.info("=" * 70)
        logger.info(f"Total files processed: {len(json_files)}")
        logger.info(f"Total labor categories: {self.stats['total_categories']}")
        logger.info(f"Inserted: {self.stats['inserted']}")
        logger.info(f"Updated: {self.stats['updated']}")
        logger.info(f"Errors: {self.stats['errors']}")
        logger.info("")


def main():
    """Main entry point"""
    try:
        importer = GSAPricingImporter()
        
        print("\n" + "=" * 70)
        print("GSA PRICING IMPORTER")
        print("=" * 70)
        print("\nThis will import parsed labor category data into Supabase.")
        print("")
        
        # Count files
        json_files = list(importer.parsed_dir.glob("*_parsed.json"))
        print(f"Found {len(json_files)} parsed files to import")
        print("")
        
        # Confirm
        confirm = input("Proceed with import? (y/n): ").lower().strip()
        if confirm != 'y':
            print("Import cancelled")
            return
        
        # Start import
        importer.import_all()
        
        print("\n✓ Import process completed!")
        
    except KeyboardInterrupt:
        logger.info("\nImport cancelled by user")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Fatal error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()

