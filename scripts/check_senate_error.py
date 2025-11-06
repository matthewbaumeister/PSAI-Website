#!/usr/bin/env python3
"""
Check what error the Senate website is returning
"""

import sys
from senate_page_scraper import SenatePageScraper
from bs4 import BeautifulSoup

test_url = "https://efdsearch.senate.gov/search/view/ptr/ff447117-d7c4-47fd-83c7-a34d39192b71/"

scraper = SenatePageScraper(delay_seconds=1.0)
html = scraper.fetch_page_html(test_url)

if not html:
    print("Failed to fetch", file=sys.stderr)
    sys.exit(1)

soup = BeautifulSoup(html, 'html.parser')

# Check for error messages
errors = soup.find_all(['div', 'p'], class_=lambda x: x and ('alert' in ' '.join(x) or 'error' in ' '.join(x)))

print("\n=== ERROR MESSAGES FOUND ===\n", file=sys.stderr)
for error in errors:
    text = error.get_text(strip=True)
    if text:
        print(f"ERROR: {text}\n", file=sys.stderr)

# Check page title
title = soup.find('title')
if title:
    print(f"Page title: {title.get_text()}\n", file=sys.stderr)

# Look for any text content
body = soup.find('body')
if body:
    text = body.get_text(strip=True)[:500]
    print(f"Body text (first 500 chars): {text}\n", file=sys.stderr)

