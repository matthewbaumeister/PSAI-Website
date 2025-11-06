#!/usr/bin/env python3
"""
Quick script to inspect Senate HTML structure
"""

import sys
from senate_page_scraper import SenatePageScraper
from bs4 import BeautifulSoup

# Test URL from your output
test_url = "https://efdsearch.senate.gov/search/view/ptr/ff447117-d7c4-47fd-83c7-a34d39192b71/"

print("Fetching Senate PTR page...\n", file=sys.stderr)

scraper = SenatePageScraper(delay_seconds=1.0)
html = scraper.fetch_page_html(test_url)

if not html:
    print("Failed to fetch HTML", file=sys.stderr)
    sys.exit(1)

print(f"Got {len(html)} bytes of HTML\n", file=sys.stderr)

# Parse with BeautifulSoup
soup = BeautifulSoup(html, 'html.parser')

# Find all tables
tables = soup.find_all('table')
print(f"Found {len(tables)} <table> elements\n", file=sys.stderr)

# Look for any elements that might contain transaction data
print("Looking for transaction-related content...\n", file=sys.stderr)

# Check for specific text
if 'transaction' in html.lower():
    print("✓ Found 'transaction' in HTML", file=sys.stderr)
else:
    print("✗ No 'transaction' found", file=sys.stderr)

if 'asset' in html.lower():
    print("✓ Found 'asset' in HTML", file=sys.stderr)
else:
    print("✗ No 'asset' found", file=sys.stderr)

if 'purchase' in html.lower() or 'sale' in html.lower():
    print("✓ Found transaction types", file=sys.stderr)
else:
    print("✗ No transaction types found", file=sys.stderr)

# Check for divs with specific classes/ids
print("\nChecking page structure...", file=sys.stderr)

# Look for all divs
divs = soup.find_all('div', class_=True)
print(f"Found {len(divs)} divs with classes", file=sys.stderr)

# Sample some div class names
if divs:
    print("\nSample div classes:", file=sys.stderr)
    for div in divs[:10]:
        classes = div.get('class', [])
        if classes:
            print(f"  - {' '.join(classes)}", file=sys.stderr)

# Look for panels
panels = soup.find_all('div', class_=lambda x: x and 'panel' in ' '.join(x).lower())
print(f"\nFound {len(panels)} panel-like divs", file=sys.stderr)

# Print full HTML to stdout for inspection
print("\n" + "="*60, file=sys.stderr)
print("Full HTML (first 3000 chars):", file=sys.stderr)
print("="*60, file=sys.stderr)
print(html[:3000])

print("\n" + "="*60, file=sys.stderr)
print("Full HTML (last 3000 chars):", file=sys.stderr)
print("="*60, file=sys.stderr)
print(html[-3000:])

