#!/usr/bin/env python3
"""
GSA Pricing Downloader
Downloads individual contractor price list Excel files from GSA eLibrary
"""

import os
import sys
import time
import logging
import requests
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


class GSAPricingDownloader:
    def __init__(self):
        """Initialize the downloader with Supabase connection"""
        self.supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
        self.supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
        
        if not self.supabase_url or not self.supabase_key:
            raise ValueError("Missing Supabase credentials in environment")
        
        self.supabase = create_client(self.supabase_url, self.supabase_key)
        
        # Setup download directory
        self.download_dir = Path("data/gsa_pricing")
        self.download_dir.mkdir(parents=True, exist_ok=True)
        
        logger.info(f"Download directory: {self.download_dir}")
        
        # Stats
        self.stats = {
            'total': 0,
            'downloaded': 0,
            'skipped': 0,
            'failed': 0,
            'no_url': 0
        }
    
    def extract_price_list_urls(self) -> List[Dict]:
        """
        Extract price list URLs from gsa_schedule_holders table
        Returns list of contractors with their price list URLs
        """
        logger.info("Extracting price list URLs from database...")
        
        contractors_with_urls = []
        offset = 0
        batch_size = 1000
        
        while True:
            # Fetch contractors in batches
            result = self.supabase.table('gsa_schedule_holders')\
                .select('id, contract_number, company_name, additional_data')\
                .range(offset, offset + batch_size - 1)\
                .execute()
            
            if not result.data:
                break
            
            for contractor in result.data:
                # Extract Price List URL from additional_data
                additional_data = contractor.get('additional_data', {}) or {}
                price_list_url = additional_data.get('price_list')
                
                if price_list_url and isinstance(price_list_url, str):
                    # Handle relative URLs
                    if price_list_url.startswith('http'):
                        full_url = price_list_url
                    else:
                        # Some URLs might be relative, prepend base URL
                        full_url = f"https://www.gsaadvantage.gov{price_list_url}"
                    
                    contractors_with_urls.append({
                        'id': contractor['id'],
                        'contract_number': contractor['contract_number'],
                        'company_name': contractor['company_name'],
                        'price_list_url': full_url
                    })
            
            logger.info(f"Processed {offset + len(result.data)} contractors, found {len(contractors_with_urls)} with price lists")
            
            if len(result.data) < batch_size:
                break
            
            offset += batch_size
        
        logger.info(f"Total contractors with price list URLs: {len(contractors_with_urls)}")
        return contractors_with_urls
    
    def _create_price_list_record(self, contractor: Dict) -> Optional[int]:
        """Create or get existing price list record in database"""
        try:
            # Check if already exists
            existing = self.supabase.table('gsa_price_lists')\
                .select('id, parse_status')\
                .eq('contract_number', contractor['contract_number'])\
                .execute()
            
            if existing.data:
                # Already exists
                record = existing.data[0]
                # Skip if already completed
                if record['parse_status'] == 'completed':
                    return None  # Skip
                return record['id']
            
            # Create new record
            new_record = {
                'contractor_id': contractor['id'],
                'contract_number': contractor['contract_number'],
                'price_list_url': contractor['price_list_url'],
                'parse_status': 'pending'
            }
            
            result = self.supabase.table('gsa_price_lists').insert(new_record).execute()
            return result.data[0]['id']
        
        except Exception as e:
            logger.error(f"Error creating price list record: {e}")
            return None
    
    def _update_price_list_status(self, price_list_id: int, status: str, 
                                   error: Optional[str] = None,
                                   file_name: Optional[str] = None):
        """Update price list record status"""
        try:
            update_data = {
                'parse_status': status,
                'updated_at': datetime.now().isoformat()
            }
            
            if error:
                update_data['parse_error'] = error
            
            if file_name:
                update_data['file_name'] = file_name
                update_data['file_downloaded'] = True
                update_data['downloaded_at'] = datetime.now().isoformat()
            
            self.supabase.table('gsa_price_lists')\
                .update(update_data)\
                .eq('id', price_list_id)\
                .execute()
        
        except Exception as e:
            logger.error(f"Error updating price list status: {e}")
    
    def download_price_list(self, contractor: Dict, price_list_id: int) -> bool:
        """
        Download a single price list file
        Returns True if successful, False otherwise
        """
        url = contractor['price_list_url']
        contract_number = contractor['contract_number']
        
        # Create filename
        file_name = f"{contract_number}_pricelist.xlsx"
        file_path = self.download_dir / file_name
        
        # Skip if already downloaded
        if file_path.exists():
            logger.info(f"Already downloaded: {contract_number}")
            self._update_price_list_status(price_list_id, 'completed', file_name=file_name)
            self.stats['skipped'] += 1
            return True
        
        try:
            # Update status to downloading
            self._update_price_list_status(price_list_id, 'downloading')
            
            # Download the file
            logger.info(f"Downloading: {contract_number} from {url}")
            
            headers = {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            }
            
            response = requests.get(url, headers=headers, timeout=60, allow_redirects=True)
            response.raise_for_status()
            
            # Save the file
            with open(file_path, 'wb') as f:
                f.write(response.content)
            
            file_size_kb = len(response.content) / 1024
            logger.info(f"Downloaded successfully: {contract_number} ({file_size_kb:.1f} KB)")
            
            # Update status
            self._update_price_list_status(price_list_id, 'completed', file_name=file_name)
            self.stats['downloaded'] += 1
            
            return True
        
        except requests.exceptions.RequestException as e:
            error_msg = f"Download failed: {str(e)}"
            logger.error(f"{contract_number}: {error_msg}")
            self._update_price_list_status(price_list_id, 'failed', error=error_msg)
            self.stats['failed'] += 1
            return False
        
        except Exception as e:
            error_msg = f"Unexpected error: {str(e)}"
            logger.error(f"{contract_number}: {error_msg}")
            self._update_price_list_status(price_list_id, 'failed', error=error_msg)
            self.stats['failed'] += 1
            return False
    
    def download_all(self, limit: Optional[int] = None, resume: bool = True):
        """
        Download all price lists
        
        Args:
            limit: Maximum number to download (None for all)
            resume: Skip already downloaded files
        """
        logger.info("=" * 70)
        logger.info("GSA PRICING DOWNLOADER")
        logger.info("=" * 70)
        
        # Create scraper log entry
        log_entry = self.supabase.table('gsa_pricing_scraper_log').insert({
            'status': 'running',
            'started_at': datetime.now().isoformat()
        }).execute()
        log_id = log_entry.data[0]['id']
        
        try:
            # Get all contractors with price list URLs
            contractors = self.extract_price_list_urls()
            self.stats['total'] = len(contractors)
            
            if limit:
                contractors = contractors[:limit]
                logger.info(f"Limiting to first {limit} price lists")
            
            logger.info(f"Total price lists to download: {len(contractors)}")
            logger.info("")
            
            # Download each price list
            for i, contractor in enumerate(contractors, 1):
                logger.info(f"[{i}/{len(contractors)}] Processing: {contractor['company_name']}")
                
                # Create or get price list record
                price_list_id = self._create_price_list_record(contractor)
                
                if price_list_id is None:
                    logger.info(f"  Already completed, skipping")
                    self.stats['skipped'] += 1
                    continue
                
                # Download the file
                self.download_price_list(contractor, price_list_id)
                
                # Rate limiting
                time.sleep(0.5)  # Be nice to GSA servers
                
                # Progress update every 50 downloads
                if i % 50 == 0:
                    logger.info("")
                    logger.info(f"Progress: {i}/{len(contractors)}")
                    logger.info(f"Downloaded: {self.stats['downloaded']}, Skipped: {self.stats['skipped']}, Failed: {self.stats['failed']}")
                    logger.info("")
            
            # Final summary
            logger.info("")
            logger.info("=" * 70)
            logger.info("DOWNLOAD COMPLETE")
            logger.info("=" * 70)
            logger.info(f"Total: {self.stats['total']}")
            logger.info(f"Downloaded: {self.stats['downloaded']}")
            logger.info(f"Skipped: {self.stats['skipped']}")
            logger.info(f"Failed: {self.stats['failed']}")
            logger.info("")
            
            # Update scraper log
            self.supabase.table('gsa_pricing_scraper_log').update({
                'status': 'completed',
                'completed_at': datetime.now().isoformat(),
                'total_price_lists': self.stats['total'],
                'downloaded_count': self.stats['downloaded'],
                'failed_count': self.stats['failed']
            }).eq('id', log_id).execute()
        
        except Exception as e:
            logger.error(f"Download process failed: {e}")
            
            # Update scraper log
            self.supabase.table('gsa_pricing_scraper_log').update({
                'status': 'failed',
                'completed_at': datetime.now().isoformat(),
                'errors': [{'error': str(e)}]
            }).eq('id', log_id).execute()
            
            raise


def main():
    """Main entry point"""
    try:
        downloader = GSAPricingDownloader()
        
        # Ask user for download options
        print("\n" + "=" * 70)
        print("GSA PRICING DOWNLOADER")
        print("=" * 70)
        print("\nThis will download individual price list Excel files")
        print("for all GSA contractors that have pricing available.")
        print("")
        
        # Check how many have URLs
        contractors = downloader.extract_price_list_urls()
        print(f"Found {len(contractors)} contractors with price list URLs")
        print("")
        
        # Option to test with limited number
        test_mode = input("Test mode? Download only first 10? (y/n): ").lower().strip()
        
        if test_mode == 'y':
            limit = 10
        else:
            limit = None
        
        # Start download
        downloader.download_all(limit=limit)
        
        print("\n✓ Download process completed!")
        print(f"\nFiles saved to: {downloader.download_dir}")
        
    except KeyboardInterrupt:
        logger.info("\nDownload cancelled by user")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Fatal error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()

