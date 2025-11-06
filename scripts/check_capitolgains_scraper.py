#!/usr/bin/env python3
"""
Check what attributes the SenateDisclosureScraper has
"""

import sys
from capitolgains import Senator
from capitolgains.utils.senator_scraper import SenateDisclosureScraper

print("Checking SenateDisclosureScraper attributes...\n", file=sys.stderr)

with SenateDisclosureScraper() as scraper:
    print(f"Scraper type: {type(scraper)}", file=sys.stderr)
    print(f"\nAvailable attributes:", file=sys.stderr)
    
    for attr in dir(scraper):
        if not attr.startswith('_'):
            print(f"  - {attr}", file=sys.stderr)
    
    # Check for playwright-related attributes
    print(f"\nPlaywright-related attributes:", file=sys.stderr)
    for attr in ['page', 'browser', 'playwright', '_page', '_browser', 'driver', 'session']:
        if hasattr(scraper, attr):
            print(f"  ✓ {attr}: {type(getattr(scraper, attr))}", file=sys.stderr)
        else:
            print(f"  ✗ {attr} not found", file=sys.stderr)
    
    # Try to get a test senator's disclosures
    print(f"\nTesting with Tuberville...", file=sys.stderr)
    senator = Senator("Tuberville", state="AL")
    disclosures_dict = senator.get_disclosures(scraper, year="2024")
    ptr_list = disclosures_dict.get('trades', []) if isinstance(disclosures_dict, dict) else []
    
    if ptr_list:
        ptr = ptr_list[0]
        print(f"\nPTR object type: {type(ptr)}", file=sys.stderr)
        print(f"PTR keys: {ptr.keys() if isinstance(ptr, dict) else 'Not a dict'}", file=sys.stderr)
        
        # Check if PTR has HTML content already
        for key in ['html', 'content', 'html_content', 'page_content', 'raw_html']:
            if isinstance(ptr, dict) and key in ptr:
                print(f"  ✓ Found '{key}': {len(ptr[key])} chars", file=sys.stderr)

