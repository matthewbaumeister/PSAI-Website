#!/usr/bin/env python3
"""
GWAC Historical Data Scraper
Scrapes historical GWAC spending and task order data from:
1. USAspending.gov API (primary source - 2007-present)
2. FPDS Atom feeds (detailed task orders)
3. GSA Dashboard (if accessible)

Output: Ready for Supabase import
"""

import requests
import json
import csv
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Dict, Optional
import logging
import time
from urllib.parse import quote

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class GWACHistoricalScraper:
    """Scrapes historical GWAC data from USAspending and FPDS"""
    
    # Major GWACs to track
    GWAC_CONTRACTS = {
        'alliant2': {
            'name': 'Alliant 2',
            'idv_piid': 'GS00Q17GWD2003',  # Parent contract ID
            'agency': 'General Services Administration',
            'type': 'IT Services',
            'start_date': '2017-08-29',
        },
        'alliant2_sb': {
            'name': 'Alliant 2 Small Business',
            'idv_piid': 'GS00Q17GWD2015',
            'agency': 'General Services Administration',
            'type': 'IT Services',
            'start_date': '2018-01-31',
        },
        'stars3': {
            'name': '8(a) STARS III',
            'idv_piid': 'GS00Q17GWD2501',
            'agency': 'General Services Administration',
            'type': 'IT Services',
            'start_date': '2021-11-08',
        },
        'oasis': {
            'name': 'OASIS Unrestricted',
            'idv_piid': 'GS00Q14OADU130',
            'agency': 'General Services Administration',
            'type': 'Professional Services',
            'start_date': '2014-09-01',
        },
        'oasis_sb': {
            'name': 'OASIS Small Business',
            'idv_piid': 'GS00Q14OADS226',
            'agency': 'General Services Administration',
            'type': 'Professional Services',
            'start_date': '2014-06-26',
        },
        'cio_sp3': {
            'name': 'CIO-SP3',
            'idv_piid': 'HHSN316201200012W',
            'agency': 'National Institutes of Health',
            'type': 'IT Services',
            'start_date': '2012-05-17',
        },
        'cio_sp4': {
            'name': 'CIO-SP4',
            'idv_piid': 'HHSN316202100002W',
            'agency': 'National Institutes of Health',
            'type': 'IT Services',
            'start_date': '2022-04-25',
        },
        'polaris': {
            'name': 'Polaris',
            'idv_piid': 'GS00Q23GWD0001',
            'agency': 'General Services Administration',
            'type': 'IT Services',
            'start_date': '2023-08-15',
        },
    }
    
    def __init__(self, output_dir: str = "data/gwac_historical"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'PropShop.AI GWAC Research Tool (contact@propshop.ai)',
            'Accept': 'application/json'
        })
    
    def scrape_usaspending_gwac(self, gwac_key: str, gwac_info: Dict, 
                                 start_date: str = None, end_date: str = None) -> List[Dict]:
        """
        Scrape GWAC spending data from USAspending.gov API
        
        API Docs: https://api.usaspending.gov/
        """
        logger.info(f"Scraping USAspending data for {gwac_info['name']}")
        
        if not start_date:
            start_date = gwac_info['start_date']
        if not end_date:
            end_date = datetime.now().strftime('%Y-%m-%d')
        
        all_awards = []
        page = 1
        has_more = True
        
        while has_more:
            url = "https://api.usaspending.gov/api/v2/search/spending_by_award/"
            
            payload = {
                "filters": {
                    "award_type_codes": ["IDV_B", "IDV_B_A", "IDV_B_B", "IDV_B_C"],  # IDVs (GWACs)
                    "award_ids": [gwac_info['idv_piid']],
                    "time_period": [{
                        "start_date": start_date,
                        "end_date": end_date,
                        "date_type": "action_date"
                    }]
                },
                "fields": [
                    "Award ID",
                    "Recipient Name", 
                    "Start Date",
                    "End Date",
                    "Award Amount",
                    "Total Outlayed Amount",
                    "Description",
                    "Awarding Agency",
                    "Awarding Sub Agency",
                    "recipient_id",
                    "Recipient UEI",
                    "Recipient DUNS",
                    "Award Type",
                    "recipient_location_country_code",
                    "recipient_location_state_code",
                    "recipient_location_city_name"
                ],
                "page": page,
                "limit": 100,
                "order": "desc",
                "sort": "Award Amount"
            }
            
            try:
                response = self.session.post(url, json=payload, timeout=30)
                response.raise_for_status()
                data = response.json()
                
                results = data.get('results', [])
                if not results:
                    has_more = False
                    break
                
                for award in results:
                    all_awards.append({
                        'gwac_key': gwac_key,
                        'gwac_name': gwac_info['name'],
                        'gwac_parent_contract': gwac_info['idv_piid'],
                        'award_id': award.get('Award ID'),
                        'recipient_name': award.get('Recipient Name'),
                        'recipient_uei': award.get('Recipient UEI'),
                        'recipient_duns': award.get('Recipient DUNS'),
                        'recipient_city': award.get('recipient_location_city_name'),
                        'recipient_state': award.get('recipient_location_state_code'),
                        'award_amount': award.get('Award Amount'),
                        'total_outlayed': award.get('Total Outlayed Amount'),
                        'start_date': award.get('Start Date'),
                        'end_date': award.get('End Date'),
                        'description': award.get('Description'),
                        'awarding_agency': award.get('Awarding Agency'),
                        'awarding_sub_agency': award.get('Awarding Sub Agency'),
                        'award_type': award.get('Award Type'),
                        'data_source': 'USAspending.gov',
                        'scraped_at': datetime.now().isoformat()
                    })
                
                logger.info(f"  Page {page}: Found {len(results)} awards (total: {len(all_awards)})")
                
                # Check if there are more pages
                if len(results) < 100:
                    has_more = False
                else:
                    page += 1
                    time.sleep(0.5)  # Rate limiting
                
            except requests.exceptions.RequestException as e:
                logger.error(f"Error fetching data: {e}")
                has_more = False
        
        logger.info(f"Total awards found for {gwac_info['name']}: {len(all_awards)}")
        return all_awards
    
    def scrape_fpds_task_orders(self, gwac_piid: str, gwac_name: str) -> List[Dict]:
        """
        Scrape FPDS Atom feed for detailed task order data
        
        FPDS provides XML feeds with detailed contract info
        """
        logger.info(f"Scraping FPDS task orders for {gwac_name}")
        
        # FPDS Atom feed URL
        # Note: FPDS limits to 10 records per request, need pagination
        base_url = "https://www.fpds.gov/ezsearch/FEEDS/ATOM"
        
        task_orders = []
        start = 0
        page_size = 10
        max_pages = 100  # Limit to prevent infinite loops
        
        try:
            from bs4 import BeautifulSoup
            
            for page in range(max_pages):
                params = {
                    'PIID': gwac_piid,
                    's': 'FPDS.GOV',
                    'templateName': '1.5.3',
                    'indexName': 'awardfull',
                    'q': f'PIID:"{gwac_piid}"',
                    'start': start
                }
                
                response = self.session.get(base_url, params=params, timeout=30)
                response.raise_for_status()
                
                soup = BeautifulSoup(response.content, 'xml')
                entries = soup.find_all('entry')
                
                if not entries:
                    break
                
                for entry in entries:
                    # Parse XML entry
                    task_order = {
                        'gwac_parent_contract': gwac_piid,
                        'gwac_name': gwac_name,
                        'title': entry.find('title').text if entry.find('title') else None,
                        'award_id': entry.find('piid').text if entry.find('piid') else None,
                        'recipient_name': entry.find('vendorName').text if entry.find('vendorName') else None,
                        'award_date': entry.find('signedDate').text if entry.find('signedDate') else None,
                        'award_amount': entry.find('dollarObligated').text if entry.find('dollarObligated') else None,
                        'description': entry.find('description').text if entry.find('description') else None,
                        'data_source': 'FPDS',
                        'scraped_at': datetime.now().isoformat()
                    }
                    task_orders.append(task_order)
                
                logger.info(f"  FPDS Page {page + 1}: Found {len(entries)} entries")
                
                if len(entries) < page_size:
                    break
                
                start += page_size
                time.sleep(1)  # Rate limiting
            
            logger.info(f"Total FPDS task orders: {len(task_orders)}")
            return task_orders
            
        except ImportError:
            logger.error("BeautifulSoup not installed. Install with: pip install beautifulsoup4 lxml")
            return []
        except Exception as e:
            logger.error(f"Error scraping FPDS: {e}")
            return []
    
    def aggregate_by_contractor(self, awards: List[Dict]) -> List[Dict]:
        """
        Aggregate spending by contractor for easy analysis
        """
        logger.info("Aggregating data by contractor")
        
        contractor_data = {}
        
        for award in awards:
            recipient = award.get('recipient_name') or 'Unknown'
            uei = award.get('recipient_uei') or award.get('vendor_uei')
            
            if recipient not in contractor_data:
                contractor_data[recipient] = {
                    'contractor_name': recipient,
                    'contractor_uei': uei,
                    'gwacs': set(),
                    'total_awards': 0,
                    'total_value': 0,
                    'earliest_award': None,
                    'latest_award': None,
                    'awards_list': []
                }
            
            # Update aggregates
            contractor_data[recipient]['gwacs'].add(award.get('gwac_name'))
            contractor_data[recipient]['total_awards'] += 1
            
            amount = award.get('award_amount') or 0
            try:
                contractor_data[recipient]['total_value'] += float(amount)
            except (ValueError, TypeError):
                pass
            
            # Track date range
            award_date = award.get('start_date') or award.get('award_date')
            if award_date:
                if not contractor_data[recipient]['earliest_award'] or award_date < contractor_data[recipient]['earliest_award']:
                    contractor_data[recipient]['earliest_award'] = award_date
                if not contractor_data[recipient]['latest_award'] or award_date > contractor_data[recipient]['latest_award']:
                    contractor_data[recipient]['latest_award'] = award_date
            
            contractor_data[recipient]['awards_list'].append(award.get('award_id'))
        
        # Convert sets to lists for JSON serialization
        aggregated = []
        for contractor, data in contractor_data.items():
            data['gwacs'] = list(data['gwacs'])
            data['gwac_count'] = len(data['gwacs'])
            aggregated.append(data)
        
        # Sort by total value
        aggregated.sort(key=lambda x: x['total_value'], reverse=True)
        
        logger.info(f"Aggregated data for {len(aggregated)} contractors")
        return aggregated
    
    def scrape_all_gwacs(self, start_date: str = None, end_date: str = None):
        """
        Scrape historical data for all GWACs
        """
        logger.info(f"Starting historical scrape for {len(self.GWAC_CONTRACTS)} GWACs")
        
        all_awards = []
        
        for gwac_key, gwac_info in self.GWAC_CONTRACTS.items():
            logger.info(f"\n{'='*60}")
            logger.info(f"Processing: {gwac_info['name']}")
            logger.info(f"{'='*60}")
            
            # Get USAspending data
            awards = self.scrape_usaspending_gwac(gwac_key, gwac_info, start_date, end_date)
            all_awards.extend(awards)
            
            # Optional: Also get FPDS data (more detailed but slower)
            # task_orders = self.scrape_fpds_task_orders(gwac_info['idv_piid'], gwac_info['name'])
            # all_awards.extend(task_orders)
            
            time.sleep(2)  # Rate limiting between GWACs
        
        logger.info(f"\n{'='*60}")
        logger.info(f"SCRAPING COMPLETE")
        logger.info(f"{'='*60}")
        logger.info(f"Total awards collected: {len(all_awards)}")
        
        # Save raw data
        self.save_to_csv(all_awards, 'gwac_historical_awards')
        
        # Save aggregated contractor data
        aggregated = self.aggregate_by_contractor(all_awards)
        self.save_to_json(aggregated, 'gwac_contractor_summary')
        
        return all_awards, aggregated
    
    def save_to_csv(self, data: List[Dict], filename: str):
        """Save data to CSV"""
        if not data:
            logger.warning("No data to save")
            return
        
        output_file = self.output_dir / f"{filename}_{datetime.now().strftime('%Y%m%d')}.csv"
        
        # Get all keys
        all_keys = set()
        for record in data:
            all_keys.update(record.keys())
        
        with open(output_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=sorted(all_keys))
            writer.writeheader()
            writer.writerows(data)
        
        file_size_mb = output_file.stat().st_size / (1024 * 1024)
        logger.info(f"Saved {len(data)} records to {output_file} ({file_size_mb:.2f} MB)")
    
    def save_to_json(self, data: List[Dict], filename: str):
        """Save data to JSON"""
        if not data:
            logger.warning("No data to save")
            return
        
        output_file = self.output_dir / f"{filename}_{datetime.now().strftime('%Y%m%d')}.json"
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, default=str)
        
        file_size_mb = output_file.stat().st_size / (1024 * 1024)
        logger.info(f"Saved {len(data)} records to {output_file} ({file_size_mb:.2f} MB)")


def main():
    """Main execution"""
    print("="*70)
    print("GWAC Historical Data Scraper")
    print("="*70)
    print(f"Data Source: USAspending.gov API")
    print(f"Coverage: 2007-Present")
    print(f"Target GWACs: {len(GWACHistoricalScraper.GWAC_CONTRACTS)}")
    print()
    
    scraper = GWACHistoricalScraper()
    
    # Option 1: Scrape all historical data (slow, comprehensive)
    print("Choose scrape mode:")
    print("1. Full historical (2007-present) - Takes 10-15 minutes")
    print("2. Last 5 years - Takes 3-5 minutes")
    print("3. Last year - Takes 1-2 minutes")
    print("4. Custom date range")
    
    choice = input("\nEnter choice (1-4): ").strip()
    
    start_date = None
    end_date = None
    
    if choice == '2':
        start_date = (datetime.now() - timedelta(days=365*5)).strftime('%Y-%m-%d')
    elif choice == '3':
        start_date = (datetime.now() - timedelta(days=365)).strftime('%Y-%m-%d')
    elif choice == '4':
        start_date = input("Start date (YYYY-MM-DD): ").strip()
        end_date = input("End date (YYYY-MM-DD): ").strip()
    
    print(f"\nStarting scrape...")
    if start_date:
        print(f"Date range: {start_date} to {end_date or 'present'}")
    else:
        print(f"Date range: Full historical")
    
    start_time = time.time()
    
    awards, aggregated = scraper.scrape_all_gwacs(start_date, end_date)
    
    elapsed = time.time() - start_time
    
    print(f"\n{'='*70}")
    print("SUMMARY")
    print(f"{'='*70}")
    print(f"Total awards scraped: {len(awards):,}")
    print(f"Unique contractors: {len(aggregated):,}")
    print(f"Runtime: {elapsed/60:.1f} minutes")
    print(f"\nTop 10 contractors by spending:")
    for i, contractor in enumerate(aggregated[:10], 1):
        print(f"  {i}. {contractor['contractor_name']}: ${contractor['total_value']:,.0f}")
    print(f"\nOutput directory: {scraper.output_dir}")


if __name__ == "__main__":
    main()

