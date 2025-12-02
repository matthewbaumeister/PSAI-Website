#!/usr/bin/env python3
"""
GWAC Historical Data Scraper - AUTO MODE
Automatically scrapes last year of data (no interactive prompts)
"""

import requests
import json
import csv
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Dict
import logging
import time

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Major GWACs to track
GWAC_CONTRACTS = {
    'alliant2': {
        'name': 'Alliant 2',
        'idv_piid': 'GS00Q17GWD2003',
    },
    'alliant2_sb': {
        'name': 'Alliant 2 Small Business',
        'idv_piid': 'GS00Q17GWD2015',
    },
    'stars3': {
        'name': '8(a) STARS III',
        'idv_piid': 'GS00Q17GWD2501',
    },
    'oasis': {
        'name': 'OASIS Unrestricted',
        'idv_piid': 'GS00Q14OADU130',
    },
    'oasis_sb': {
        'name': 'OASIS Small Business',
        'idv_piid': 'GS00Q14OADS226',
    },
    'cio_sp3': {
        'name': 'CIO-SP3',
        'idv_piid': 'HHSN316201200012W',
    },
    'cio_sp4': {
        'name': 'CIO-SP4',
        'idv_piid': 'HHSN316202100002W',
    },
    'polaris': {
        'name': 'Polaris',
        'idv_piid': 'GS00Q23GWD0001',
    },
}

def scrape_usaspending_gwac(gwac_key: str, gwac_info: Dict, start_date: str, end_date: str) -> List[Dict]:
    """Scrape GWAC spending data from USAspending.gov API"""
    logger.info(f"Scraping {gwac_info['name']}...")
    
    all_awards = []
    page = 1
    has_more = True
    
    session = requests.Session()
    session.headers.update({
        'User-Agent': 'PropShop.AI GWAC Research Tool',
        'Accept': 'application/json'
    })
    
    while has_more and page <= 10:  # Limit to 10 pages per GWAC for speed
        url = "https://api.usaspending.gov/api/v2/search/spending_by_award/"
        
        payload = {
            "filters": {
                "award_type_codes": ["IDV_B", "IDV_B_A", "IDV_B_B", "IDV_B_C"],
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
                "Recipient UEI",
                "Recipient DUNS",
                "Award Type",
                "recipient_location_state_code",
                "recipient_location_city_name"
            ],
            "page": page,
            "limit": 100,
            "order": "desc",
            "sort": "Award Amount"
        }
        
        try:
            response = session.post(url, json=payload, timeout=30)
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
                    'contractor_name': award.get('Recipient Name'),
                    'contractor_uei': award.get('Recipient UEI'),
                    'contractor_duns': award.get('Recipient DUNS'),
                    'contractor_city': award.get('recipient_location_city_name'),
                    'contractor_state': award.get('recipient_location_state_code'),
                    'award_amount': award.get('Award Amount'),
                    'total_outlayed': award.get('Total Outlayed Amount'),
                    'start_date': award.get('Start Date'),
                    'end_date': award.get('End Date'),
                    'award_description': award.get('Description'),
                    'awarding_agency': award.get('Awarding Agency'),
                    'awarding_sub_agency': award.get('Awarding Sub Agency'),
                    'award_type': award.get('Award Type'),
                    'data_source': 'usaspending',
                    'scraped_at': datetime.now().isoformat()
                })
            
            logger.info(f"  Page {page}: Found {len(results)} awards (total: {len(all_awards)})")
            
            if len(results) < 100:
                has_more = False
            else:
                page += 1
                time.sleep(0.5)
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching data: {e}")
            has_more = False
    
    return all_awards

def main():
    """Main execution - automatically scrape last year"""
    print("="*70)
    print("GWAC Historical Data Scraper - AUTO MODE")
    print("="*70)
    print(f"Mode: Last 12 months")
    print(f"Target GWACs: {len(GWAC_CONTRACTS)}")
    print()
    
    # Auto-set to last year
    start_date = (datetime.now() - timedelta(days=365)).strftime('%Y-%m-%d')
    end_date = datetime.now().strftime('%Y-%m-%d')
    
    print(f"Date range: {start_date} to {end_date}")
    print(f"Starting scrape...")
    print()
    
    start_time = time.time()
    all_awards = []
    
    for gwac_key, gwac_info in GWAC_CONTRACTS.items():
        awards = scrape_usaspending_gwac(gwac_key, gwac_info, start_date, end_date)
        all_awards.extend(awards)
        time.sleep(2)
    
    elapsed = time.time() - start_time
    
    print(f"\n{'='*70}")
    print("SCRAPING COMPLETE")
    print(f"{'='*70}")
    print(f"Total awards collected: {len(all_awards):,}")
    print(f"Runtime: {elapsed/60:.1f} minutes")
    print()
    
    # Save to CSV
    output_dir = Path("data/gwac_historical")
    output_dir.mkdir(parents=True, exist_ok=True)
    output_file = output_dir / f"gwac_historical_awards_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    
    if all_awards:
        all_keys = set()
        for record in all_awards:
            all_keys.update(record.keys())
        
        with open(output_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=sorted(all_keys))
            writer.writeheader()
            writer.writerows(all_awards)
        
        file_size_mb = output_file.stat().st_size / (1024 * 1024)
        print(f"Saved to: {output_file}")
        print(f"File size: {file_size_mb:.2f} MB")
        print()
        print("Next steps:")
        print("1. Go to Supabase Table Editor")
        print("2. Open 'gwac_spending_history' table")
        print("3. Click 'Insert' -> 'Import data from CSV'")
        print("4. Upload the CSV file")
        print("5. Map columns and import")
        print()
        
        # Show top contractors
        print("Top 10 contractors by spending:")
        contractor_totals = {}
        for award in all_awards:
            name = award.get('contractor_name', 'Unknown')
            amount = award.get('award_amount', 0)
            try:
                contractor_totals[name] = contractor_totals.get(name, 0) + float(amount)
            except (ValueError, TypeError):
                pass
        
        top_contractors = sorted(contractor_totals.items(), key=lambda x: x[1], reverse=True)[:10]
        for i, (name, total) in enumerate(top_contractors, 1):
            print(f"  {i}. {name}: ${total:,.0f}")
    else:
        print("No awards found!")

if __name__ == "__main__":
    main()

