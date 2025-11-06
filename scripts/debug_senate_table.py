#!/usr/bin/env python3
"""
Debug Senate table structure to improve parsing
"""

import sys
from senate_page_scraper import SenatePageScraper
from capitolgains import Senator
from capitolgains.utils.senator_scraper import SenateDisclosureScraper
from bs4 import BeautifulSoup

with SenateDisclosureScraper() as scraper:
    senator = Senator("Tuberville", state="AL")
    disclosures_dict = senator.get_disclosures(scraper, year="2024")
    ptr_list = disclosures_dict.get('trades', []) if isinstance(disclosures_dict, dict) else []
    
    if ptr_list:
        ptr = ptr_list[0]
        report_url = ptr.get('report_url', '')
        
        page_scraper = SenatePageScraper(delay_seconds=1.0)
        html_content = page_scraper.fetch_page_html(report_url, scraper_page=scraper._page)
        
        if html_content:
            soup = BeautifulSoup(html_content, 'html.parser')
            tables = soup.find_all('table')
            
            print(f"Found {len(tables)} tables\n", file=sys.stderr)
            
            for idx, table in enumerate(tables):
                print(f"\n=== TABLE {idx + 1} ===", file=sys.stderr)
                
                rows = table.find_all('tr')
                print(f"Rows: {len(rows)}\n", file=sys.stderr)
                
                # Show first 5 rows
                for row_idx, row in enumerate(rows[:5]):
                    cells = row.find_all(['th', 'td'])
                    print(f"Row {row_idx}:", file=sys.stderr)
                    for cell_idx, cell in enumerate(cells):
                        text = cell.get_text(strip=True)
                        print(f"  Col {cell_idx}: {text[:50]}", file=sys.stderr)
                    print("", file=sys.stderr)

