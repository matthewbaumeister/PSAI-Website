#!/usr/bin/env python3
"""
SBIR TEST SCRAPER - Quick test of 100 topics
Tests the scraper logic before running full bulk scrape
"""

import subprocess
import sys

print("="*70)
print("🧪 SBIR TEST SCRAPER")
print("="*70)
print("This will scrape ONLY 100 topics to test the logic")
print("Estimated time: ~2-3 minutes")
print("="*70)

# Modify the main scraper to only fetch 100 topics
with open('sbir_historical_bulk_scraper.py', 'r') as f:
    script = f.read()

# Change max pages and size for testing
test_script = script.replace(
    'size = 2000  # Large page size for efficiency\nmax_pages = 20  # Safety limit',
    'size = 100  # Test with small batches\nmax_pages = 1  # Only 1 page for testing'
)

# Change output filename
test_script = test_script.replace(
    'output_file = f"sbir_historical_bulk_{now_eastern.strftime(\'%Y%m%d_%H%M%S\')}.csv"',
    'output_file = f"sbir_TEST_100topics_{now_eastern.strftime(\'%Y%m%d_%H%M%S\')}.csv"'
)

# Execute the modified script
exec(test_script)

