#!/usr/bin/env python3
"""
============================================
Congressional Stock Trades Scraper
============================================

Scrapes financial disclosure data from official government sources:
- House: disclosures-clerk.house.gov
- Senate: efdsearch.senate.gov

Two modes:
  - HISTORICAL: Scrape all years back to 2012
  - DAILY: Scrape only current year for updates

Uses CapitolGains package to parse official PTR filings.
============================================
"""

import json
import sys
import argparse
import re
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional

try:
    from capitolgains import Representative, Senator
    from capitolgains.utils.representative_scraper import HouseDisclosureScraper
    from capitolgains.utils.senator_scraper import SenateDisclosureScraper
except ImportError:
    print("ERROR: capitolgains package not installed.", file=sys.stderr)
    print("Please run: pip install capitolgains && playwright install", file=sys.stderr)
    sys.exit(1)

# Import PDF parsing modules (for House)
try:
    from pdf_downloader import PDFDownloader
    from pdf_parser import PTRParser
except ImportError:
    print("ERROR: PDF parsing modules not found.", file=sys.stderr)
    print("Make sure pdf_downloader.py and pdf_parser.py are in the scripts directory.", file=sys.stderr)
    sys.exit(1)

# Import HTML parsing modules (for Senate)
try:
    from senate_page_scraper import SenatePageScraper
    from senate_html_parser import SenateHTMLParser
except ImportError:
    print("ERROR: Senate HTML parsing modules not found.", file=sys.stderr)
    print("Make sure senate_page_scraper.py and senate_html_parser.py are in the scripts directory.", file=sys.stderr)
    sys.exit(1)


# ============================================
# Defense-Related Committee Members
# ============================================

def get_defense_house_members() -> List[Dict[str, str]]:
    """
    House Armed Services Committee & Defense Appropriations Subcommittee
    118th Congress (2023-2025) - Update periodically
    """
    return [
        # Armed Services Committee - Republicans
        {"name": "Rogers", "state": "AL", "district": "3"},  # Chair
        {"name": "Wittman", "state": "VA", "district": "1"},
        {"name": "Lamborn", "state": "CO", "district": "5"},
        {"name": "Wilson", "state": "SC", "district": "2"},
        {"name": "Turner", "state": "OH", "district": "10"},
        {"name": "Stefanik", "state": "NY", "district": "21"},
        {"name": "DesJarlais", "state": "TN", "district": "4"},
        {"name": "Scott", "state": "GA", "district": "8"},
        {"name": "Gaetz", "state": "FL", "district": "1"},
        {"name": "Waltz", "state": "FL", "district": "6"},
        {"name": "Hartzler", "state": "MO", "district": "4"},
        {"name": "Franklin", "state": "FL", "district": "18"},
        {"name": "Mills", "state": "FL", "district": "7"},
        {"name": "Weber", "state": "TX", "district": "14"},
        {"name": "Mast", "state": "FL", "district": "21"},
        {"name": "Bergman", "state": "MI", "district": "1"},
        {"name": "Gallagher", "state": "WI", "district": "8"},
        {"name": "Bacon", "state": "NE", "district": "2"},
        {"name": "Banks", "state": "IN", "district": "3"},
        {"name": "Cheney", "state": "WY", "district": "0"},
        {"name": "Ellzey", "state": "TX", "district": "6"},
        {"name": "Moore", "state": "AL", "district": "2"},
        {"name": "Harshbarger", "state": "TN", "district": "1"},
        {"name": "Walberg", "state": "MI", "district": "5"},
        {"name": "Carl", "state": "AL", "district": "1"},
        {"name": "James", "state": "MI", "district": "10"},
        {"name": "Ezell", "state": "MS", "district": "4"},
        
        # Armed Services - Democrats
        {"name": "Smith", "state": "WA", "district": "9"},  # Ranking
        {"name": "Courtney", "state": "CT", "district": "2"},
        {"name": "Larsen", "state": "WA", "district": "2"},
        {"name": "Cooper", "state": "TN", "district": "5"},
        {"name": "Langevin", "state": "RI", "district": "2"},
        {"name": "Garamendi", "state": "CA", "district": "8"},
        {"name": "Speier", "state": "CA", "district": "14"},
        {"name": "Gallego", "state": "AZ", "district": "3"},
        {"name": "Moulton", "state": "MA", "district": "6"},
        {"name": "Carbajal", "state": "CA", "district": "24"},
        {"name": "Brown", "state": "MD", "district": "4"},
        {"name": "Khanna", "state": "CA", "district": "17"},
        {"name": "Kim", "state": "NJ", "district": "3"},
        {"name": "Horn", "state": "OK", "district": "5"},
        {"name": "Slotkin", "state": "MI", "district": "7"},
        {"name": "Sherrill", "state": "NJ", "district": "11"},
        {"name": "Golden", "state": "ME", "district": "2"},
        {"name": "Luria", "state": "VA", "district": "2"},
        {"name": "Trahan", "state": "MA", "district": "3"},
        {"name": "Torres", "state": "CA", "district": "35"},
        {"name": "Johnson", "state": "GA", "district": "4"},
        {"name": "Jacobs", "state": "CA", "district": "51"},
        {"name": "Elzey", "state": "CA", "district": "53"},
        
        # Defense Appropriations Subcommittee
        {"name": "Calvert", "state": "CA", "district": "41"},  # Chair
        {"name": "Granger", "state": "TX", "district": "12"},
        {"name": "Carter", "state": "TX", "district": "31"},
        {"name": "Visclosky", "state": "IN", "district": "1"},  # Ranking
        {"name": "McCollum", "state": "MN", "district": "4"},
        {"name": "Ruppersberger", "state": "MD", "district": "2"},
    ]


def get_defense_senators() -> List[Dict[str, str]]:
    """
    Senate Armed Services Committee & Defense Appropriations Subcommittee
    118th Congress (2023-2025) - Update periodically
    """
    return [
        # Armed Services Committee - Republicans
        {"name": "Wicker", "state": "MS"},  # Ranking
        {"name": "Fischer", "state": "NE"},
        {"name": "Cotton", "state": "AR"},
        {"name": "Rounds", "state": "SD"},
        {"name": "Ernst", "state": "IA"},
        {"name": "Tillis", "state": "NC"},
        {"name": "Sullivan", "state": "AK"},
        {"name": "Cramer", "state": "ND"},
        {"name": "Scott", "state": "FL"},
        {"name": "Blackburn", "state": "TN"},
        {"name": "Hawley", "state": "MO"},
        {"name": "Tuberville", "state": "AL"},
        {"name": "Budd", "state": "NC"},
        {"name": "Schmitt", "state": "MO"},
        
        # Armed Services - Democrats
        {"name": "Reed", "state": "RI"},  # Chair
        {"name": "Shaheen", "state": "NH"},
        {"name": "Gillibrand", "state": "NY"},
        {"name": "Blumenthal", "state": "CT"},
        {"name": "Hirono", "state": "HI"},
        {"name": "Kaine", "state": "VA"},
        {"name": "King", "state": "ME"},
        {"name": "Warren", "state": "MA"},
        {"name": "Peters", "state": "MI"},
        {"name": "Manchin", "state": "WV"},
        {"name": "Duckworth", "state": "IL"},
        {"name": "Rosen", "state": "NV"},
        {"name": "Kelly", "state": "AZ"},
        
        # Defense Appropriations Subcommittee
        {"name": "Tester", "state": "MT"},  # Chair
        {"name": "Durbin", "state": "IL"},
        {"name": "Murray", "state": "WA"},
        {"name": "Feinstein", "state": "CA"},
        {"name": "Collins", "state": "ME"},  # Ranking
        {"name": "Shelby", "state": "AL"},
        {"name": "McConnell", "state": "KY"},
        {"name": "Graham", "state": "SC"},
        {"name": "Moran", "state": "KS"},
    ]


# ============================================
# Utility Functions
# ============================================

def extract_ticker(transaction) -> Optional[str]:
    """Extract ticker symbol from transaction"""
    ticker = getattr(transaction, 'ticker', None)
    if ticker and ticker.strip():
        return ticker.upper().strip()
    
    # Try to parse from asset description
    asset_desc = getattr(transaction, 'asset_description', '')
    if asset_desc:
        # Look for patterns like (TICKER) or [TICKER]
        match = re.search(r'[\(\[]([A-Z]{1,5})[\)\]]', asset_desc)
        if match:
            return match.group(1)
        
        # Look for standalone capital letter sequences
        match = re.search(r'\b([A-Z]{2,5})\b', asset_desc)
        if match:
            potential_ticker = match.group(1)
            # Filter out common words
            if potential_ticker not in ['INC', 'LLC', 'CORP', 'LTD', 'USA', 'ETF']:
                return potential_ticker
    
    return None


def normalize_transaction_type(txn_type: str) -> str:
    """Normalize transaction type to standard values"""
    if not txn_type:
        return 'unknown'
    
    txn_lower = txn_type.lower()
    if 'purchase' in txn_lower or 'buy' in txn_lower:
        return 'purchase'
    elif 'sale' in txn_lower or 'sell' in txn_lower:
        return 'sale'
    elif 'exchange' in txn_lower:
        return 'exchange'
    return txn_type.lower()


def safe_date(date_obj) -> str:
    """Safely convert date object to ISO string"""
    if date_obj is None:
        return None
    if isinstance(date_obj, str):
        return date_obj
    if hasattr(date_obj, 'isoformat'):
        return date_obj.isoformat()
    return str(date_obj)


# ============================================
# Main Scraping Functions
# ============================================

def scrape_house_trades(start_year: int, end_year: int, upload_per_member: bool = False) -> List[Dict[str, Any]]:
    """Scrape House financial disclosures and parse PDFs"""
    trades = []
    members = get_defense_house_members()
    
    # Initialize PDF tools
    downloader = PDFDownloader()
    parser = PTRParser()
    
    print(f"Scraping House: {len(members)} members, years {start_year}-{end_year}", 
          file=sys.stderr)
    
    with HouseDisclosureScraper() as scraper:
        for idx, member in enumerate(members, 1):
            member_name = f"{member['name']} ({member['state']}-{member['district']})"
            print(f"[{idx}/{len(members)}] House: {member_name}", file=sys.stderr)
            
            for year in range(start_year, end_year + 1):
                try:
                    rep = Representative(
                        member["name"], 
                        state=member["state"], 
                        district=member["district"]
                    )
                    
                    # Get PDF URLs from CapitolGains
                    disclosures_dict = rep.get_disclosures(scraper, year=str(year))
                    ptr_list = disclosures_dict.get('trades', []) if isinstance(disclosures_dict, dict) else []
                    
                    if ptr_list:
                        print(f"  {year}: {len(ptr_list)} PTR(s) found", file=sys.stderr)
                    
                    # Download and parse each PDF
                    for ptr in ptr_list:
                        pdf_url = ptr.get('pdf_url', '')
                        if not pdf_url:
                            continue
                        
                        # Download PDF
                        pdf_path = downloader.download_pdf(pdf_url)
                        if not pdf_path:
                            print(f"    ⚠️  Failed to download PDF", file=sys.stderr)
                            continue
                        
                        # Parse PDF to extract trades
                        parsed_trades = parser.parse_pdf(str(pdf_path))
                        
                        # Add metadata to each trade
                        for trade in parsed_trades:
                            trade['member_name'] = rep.full_name if hasattr(rep, 'full_name') else member['name']
                            trade['chamber'] = 'House'
                            trade['filing_url'] = pdf_url
                            
                            # Set disclosure_date (required field)
                            # Use transaction_date as fallback if no specific disclosure date
                            if not trade.get('transaction_date'):
                                # If no transaction date, use year from PTR as fallback
                                trade['disclosure_date'] = f"{ptr.get('year', year)}-01-01"
                                trade['transaction_date'] = f"{ptr.get('year', year)}-01-01"
                            else:
                                # Disclosure is typically same as or after transaction
                                trade['disclosure_date'] = trade['transaction_date']
                            
                            trades.append(trade)
                    
                except Exception as e:
                    print(f"  Error {year}: {str(e)}", file=sys.stderr)
                    continue
            
            # Upload this member's trades immediately
            if upload_per_member and len(trades) > 0:
                member_trades = trades[len(trades) - sum(len(t) for t in []):]  # Get recent trades
                if member_trades:
                    print(f"  📤 Uploading {len(member_trades)} trades to database...", file=sys.stderr)
                    upload_to_supabase(member_trades)
    
    print(f"House complete: {len(trades)} trades", file=sys.stderr)
    
    # Print downloader and parser stats
    downloader.print_stats()
    parser.print_stats()
    
    return trades


def scrape_senate_trades(start_year: int, end_year: int, upload_per_member: bool = False) -> List[Dict[str, Any]]:
    """Scrape Senate financial disclosures and parse HTML pages"""
    trades = []
    members = get_defense_senators()
    
    # Initialize HTML scraping tools
    page_scraper = SenatePageScraper(delay_seconds=2.0)
    html_parser = SenateHTMLParser()
    
    print(f"\nScraping Senate: {len(members)} members, years {start_year}-{end_year}", 
          file=sys.stderr)
    
    with SenateDisclosureScraper() as scraper:
        for idx, member in enumerate(members, 1):
            member_name = f"{member['name']} ({member['state']})"
            print(f"[{idx}/{len(members)}] Senate: {member_name}", file=sys.stderr)
            
            for year in range(start_year, end_year + 1):
                try:
                    senator = Senator(member["name"], state=member["state"])
                    
                    # Get disclosure URLs from CapitolGains
                    disclosures_dict = senator.get_disclosures(scraper, year=str(year))
                    ptr_list = disclosures_dict.get('trades', []) if isinstance(disclosures_dict, dict) else []
                    
                    if ptr_list:
                        print(f"  {year}: {len(ptr_list)} PTR(s) found", file=sys.stderr)
                    
                    # Process each PTR (HTML page)
                    for ptr in ptr_list:
                        # Senate PTR URLs are in 'report_url' field
                        report_url = ptr.get('report_url', '') or ptr.get('filing_url', '')
                        if not report_url:
                            continue
                        
                        # Fetch HTML content using authenticated scraper session
                        # Pass the scraper's page object for authenticated access
                        html_content = page_scraper.fetch_page_html(report_url, scraper_page=scraper._page)
                        if not html_content:
                            print(f"    Failed to fetch HTML from {report_url}", file=sys.stderr)
                            continue
                        
                        # Parse HTML to extract trades
                        parsed_trades = html_parser.parse_html(html_content, report_url)
                        
                        # Add metadata to each trade
                        for trade in parsed_trades:
                            trade['member_name'] = senator.full_name if hasattr(senator, 'full_name') else member['name']
                            trade['chamber'] = 'Senate'
                            trade['filing_url'] = report_url
                            
                            # Set disclosure_date (required field)
                            # Try to get from PTR metadata
                            ptr_date = ptr.get('date', '')
                            if ptr_date:
                                # Parse date like '08/15/2024'
                                try:
                                    disclosure_date = datetime.strptime(ptr_date, '%m/%d/%Y').strftime('%Y-%m-%d')
                                except:
                                    disclosure_date = None
                            else:
                                disclosure_date = None
                            
                            if not trade.get('transaction_date'):
                                # If no transaction date, use disclosure date or year as fallback
                                trade['transaction_date'] = disclosure_date or f"{year}-01-01"
                            
                            trade['disclosure_date'] = disclosure_date or trade['transaction_date']
                            
                            trades.append(trade)
                    
                except Exception as e:
                    print(f"  Error {year}: {str(e)}", file=sys.stderr)
                    continue
    
    print(f"\nSenate complete: {len(trades)} trades", file=sys.stderr)
    
    # Print scraper and parser stats
    page_scraper.print_stats()
    html_parser.print_stats()
    
    return trades


def scrape_all_trades(start_year: int, end_year: int) -> List[Dict[str, Any]]:
    """Scrape both House and Senate trades"""
    print(f"\n{'='*60}", file=sys.stderr)
    print(f"Congressional Trades Scraper", file=sys.stderr)
    print(f"Years: {start_year} - {end_year}", file=sys.stderr)
    print(f"{'='*60}\n", file=sys.stderr)
    
    all_trades = []
    
    # Scrape House
    try:
        house_trades = scrape_house_trades(start_year, end_year)
        all_trades.extend(house_trades)
    except Exception as e:
        print(f"ERROR scraping House: {str(e)}", file=sys.stderr)
    
    print("", file=sys.stderr)
    
    # Scrape Senate
    try:
        senate_trades = scrape_senate_trades(start_year, end_year)
        all_trades.extend(senate_trades)
    except Exception as e:
        print(f"ERROR scraping Senate: {str(e)}", file=sys.stderr)
    
    print(f"\n{'='*60}", file=sys.stderr)
    print(f"Total trades scraped: {len(all_trades)}", file=sys.stderr)
    print(f"{'='*60}\n", file=sys.stderr)
    
    return all_trades


# ============================================
# Main Entry Point
# ============================================

def main():
    parser = argparse.ArgumentParser(
        description='Scrape congressional stock trades from official sources'
    )
    parser.add_argument(
        '--start-year', 
        type=int, 
        default=2024,
        help='Start year for scraping (default: 2024)'
    )
    parser.add_argument(
        '--end-year', 
        type=int, 
        default=2024,
        help='End year for scraping (default: 2024)'
    )
    parser.add_argument(
        '--mode',
        choices=['historical', 'daily'],
        default='daily',
        help='Scraping mode: historical (2012-present) or daily (current year only)'
    )
    
    args = parser.parse_args()
    
    # Determine year range based on mode
    if args.mode == 'historical':
        start_year = args.start_year
        end_year = args.end_year
    else:
        # Daily mode: only current year
        current_year = datetime.now().year
        start_year = current_year
        end_year = current_year
    
    # Run scraper
    trades = scrape_all_trades(start_year, end_year)
    
    # Output JSON to stdout (stderr used for logging)
    print(json.dumps(trades, indent=2))


if __name__ == "__main__":
    main()

