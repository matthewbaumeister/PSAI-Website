#!/usr/bin/env python3
"""
============================================
Test Senate HTML Scraper
============================================

Quick test to verify Senate HTML scraper works correctly.
Tests with a single senator for one year.

Usage:
  python3 scripts/test_senate_scraper.py
============================================
"""

import sys
import json
from datetime import datetime

try:
    from capitolgains import Senator
    from capitolgains.utils.senator_scraper import SenateDisclosureScraper
except ImportError:
    print("ERROR: capitolgains package not installed.", file=sys.stderr)
    print("Please run: pip install capitolgains && playwright install", file=sys.stderr)
    sys.exit(1)

try:
    from senate_page_scraper import SenatePageScraper
    from senate_html_parser import SenateHTMLParser
except ImportError:
    print("ERROR: Senate HTML parsing modules not found.", file=sys.stderr)
    print("Make sure senate_page_scraper.py and senate_html_parser.py are in the scripts directory.", file=sys.stderr)
    sys.exit(1)


def test_senate_scraper():
    """Test Senate scraper with a single senator"""
    print("="*60, file=sys.stderr)
    print("Testing Senate HTML Scraper", file=sys.stderr)
    print("="*60, file=sys.stderr)
    print("", file=sys.stderr)
    
    # Test with a senator known to have trades
    test_senator = {"name": "Tuberville", "state": "AL"}
    test_year = 2024
    
    trades = []
    
    # Initialize tools
    page_scraper = SenatePageScraper(delay_seconds=1.0)
    html_parser = SenateHTMLParser()
    
    print(f"Testing with: {test_senator['name']} ({test_senator['state']})", file=sys.stderr)
    print(f"Year: {test_year}", file=sys.stderr)
    print("", file=sys.stderr)
    
    try:
        with SenateDisclosureScraper() as scraper:
            senator = Senator(test_senator["name"], state=test_senator["state"])
            
            # Get disclosure URLs
            disclosures_dict = senator.get_disclosures(scraper, year=str(test_year))
            ptr_list = disclosures_dict.get('trades', []) if isinstance(disclosures_dict, dict) else []
            
            print(f"Found {len(ptr_list)} PTR(s)", file=sys.stderr)
            print("", file=sys.stderr)
            
            # Process first PTR only (for testing)
            if ptr_list:
                ptr = ptr_list[0]
                report_url = ptr.get('report_url', '') or ptr.get('filing_url', '')
                
                if report_url:
                    print(f"Processing PTR: {report_url}", file=sys.stderr)
                    print("", file=sys.stderr)
                    
                    # Fetch HTML using authenticated scraper session
                    html_content = page_scraper.fetch_page_html(report_url, scraper_page=scraper._page)
                    
                    if html_content:
                        # Parse HTML
                        parsed_trades = html_parser.parse_html(html_content, report_url)
                        
                        # Add metadata
                        for trade in parsed_trades:
                            trade['member_name'] = f"{test_senator['name']} ({test_senator['state']})"
                            trade['chamber'] = 'Senate'
                            trade['filing_url'] = report_url
                            
                            # Set disclosure_date
                            ptr_date = ptr.get('date', '')
                            if ptr_date:
                                try:
                                    disclosure_date = datetime.strptime(ptr_date, '%m/%d/%Y').strftime('%Y-%m-%d')
                                except:
                                    disclosure_date = None
                            else:
                                disclosure_date = None
                            
                            if not trade.get('transaction_date'):
                                trade['transaction_date'] = disclosure_date or f"{test_year}-01-01"
                            
                            trade['disclosure_date'] = disclosure_date or trade['transaction_date']
                            
                            trades.append(trade)
                    else:
                        print("Failed to fetch HTML", file=sys.stderr)
                else:
                    print("No report URL found", file=sys.stderr)
            else:
                print("No PTRs found for this senator/year", file=sys.stderr)
    
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        import traceback
        traceback.print_exc(file=sys.stderr)
        return []
    
    print("", file=sys.stderr)
    print("="*60, file=sys.stderr)
    print("Test Complete", file=sys.stderr)
    print("="*60, file=sys.stderr)
    
    # Print stats
    page_scraper.print_stats()
    html_parser.print_stats()
    
    print("", file=sys.stderr)
    print(f"Total trades extracted: {len(trades)}", file=sys.stderr)
    
    if trades:
        print("", file=sys.stderr)
        print("Sample trades:", file=sys.stderr)
        for i, trade in enumerate(trades[:3], 1):
            print(f"\n{i}. {trade['asset_description'][:60]}", file=sys.stderr)
            print(f"   Ticker: {trade.get('ticker') or 'N/A'}", file=sys.stderr)
            print(f"   Type: {trade['transaction_type']}", file=sys.stderr)
            print(f"   Date: {trade['transaction_date']}", file=sys.stderr)
            print(f"   Amount: {trade['amount_range']}", file=sys.stderr)
    
    return trades


if __name__ == "__main__":
    trades = test_senate_scraper()
    
    # Output JSON to stdout for integration testing
    print(json.dumps(trades, indent=2))

