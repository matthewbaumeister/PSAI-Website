#!/usr/bin/env python3
"""
============================================
Senate Page Scraper
============================================

Downloads and extracts HTML content from Senate eFiling pages.

Features:
- HTTP requests-based fetching (faster than browser automation)
- Rate limiting to respect Senate servers
- Error handling and retries
- HTML content extraction

Senate eFiling URL format:
https://efdsearch.senate.gov/search/view/ptr/[uuid]/
============================================
"""

import sys
import time
import requests
from typing import Optional
from pathlib import Path

class SenatePageScraper:
    """Scrapes HTML content from Senate eFiling pages"""
    
    def __init__(self, delay_seconds: float = 2.0):
        """
        Initialize scraper
        
        Args:
            delay_seconds: Delay between requests to avoid rate limiting
        """
        self.delay_seconds = delay_seconds
        self.pages_downloaded = 0
        self.errors = 0
        self.last_request_time = 0
        
        # Set up session with headers
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Connection': 'keep-alive',
        })
    
    def fetch_page_html(self, url: str, scraper_page=None, retries: int = 3) -> Optional[str]:
        """
        Fetch HTML content from Senate eFiling page
        
        Args:
            url: Senate eFiling PTR URL
            scraper_page: Playwright page from capitolgains scraper (authenticated)
            retries: Number of retry attempts on failure
            
        Returns:
            HTML content as string, or None on failure
        """
        # Rate limiting
        self._enforce_rate_limit()
        
        # If we have an authenticated scraper page, use it (preferred)
        if scraper_page is not None:
            for attempt in range(retries):
                try:
                    print(f"  Fetching (authenticated): {url}", file=sys.stderr)
                    
                    # Use the authenticated Playwright page
                    scraper_page.goto(url, wait_until="networkidle", timeout=30000)
                    html_content = scraper_page.content()
                    
                    self.pages_downloaded += 1
                    print(f"    Success: {len(html_content)} bytes", file=sys.stderr)
                    
                    return html_content
                    
                except Exception as e:
                    print(f"    Error (attempt {attempt + 1}/{retries}): {str(e)}", file=sys.stderr)
                    self.errors += 1
                    if attempt < retries - 1:
                        time.sleep(2 ** attempt)
                        continue
                    return None
        
        # Fallback: use requests (may not work for pages requiring authentication)
        for attempt in range(retries):
            try:
                print(f"  Fetching: {url}", file=sys.stderr)
                
                # Make request with timeout
                response = self.session.get(url, timeout=30)
                
                if response.status_code != 200:
                    print(f"    Warning: HTTP {response.status_code}", file=sys.stderr)
                    if attempt < retries - 1:
                        time.sleep(2 ** attempt)  # Exponential backoff
                        continue
                    return None
                
                html_content = response.text
                
                self.pages_downloaded += 1
                print(f"    Success: {len(html_content)} bytes", file=sys.stderr)
                
                return html_content
                
            except requests.Timeout as e:
                print(f"    Timeout error (attempt {attempt + 1}/{retries})", file=sys.stderr)
                self.errors += 1
                if attempt < retries - 1:
                    time.sleep(2 ** attempt)
                    continue
                return None
                
            except Exception as e:
                print(f"    Error (attempt {attempt + 1}/{retries}): {str(e)}", file=sys.stderr)
                self.errors += 1
                if attempt < retries - 1:
                    time.sleep(2 ** attempt)
                    continue
                return None
        
        return None
    
    def _enforce_rate_limit(self):
        """Enforce delay between requests"""
        current_time = time.time()
        time_since_last = current_time - self.last_request_time
        
        if time_since_last < self.delay_seconds:
            sleep_time = self.delay_seconds - time_since_last
            time.sleep(sleep_time)
        
        self.last_request_time = time.time()
    
    def print_stats(self):
        """Print scraper statistics"""
        print(f"\n📊 Page Scraper Stats:", file=sys.stderr)
        print(f"  Pages downloaded: {self.pages_downloaded}", file=sys.stderr)
        print(f"  Errors: {self.errors}", file=sys.stderr)


# Test function
if __name__ == "__main__":
    print("Testing Senate Page Scraper...\n", file=sys.stderr)
    
    # Test with a sample URL
    test_url = "https://efdsearch.senate.gov/search/view/ptr/fb8e7c07-ad6c-48e0-a6af-de9bf58827d6/"
    
    scraper = SenatePageScraper(delay_seconds=1.0)
    html = scraper.fetch_page_html(test_url)
    
    if html:
        print(f"\n{'='*60}", file=sys.stderr)
        print(f"Success: Downloaded {len(html)} bytes", file=sys.stderr)
        print(f"{'='*60}", file=sys.stderr)
        
        # Check for transaction tables
        if 'transaction' in html.lower() or 'asset' in html.lower():
            print("\nFound transaction-related content in HTML", file=sys.stderr)
        
        # Show first 500 chars
        print(f"\nFirst 500 characters:", file=sys.stderr)
        print(html[:500], file=sys.stderr)
    else:
        print("\nFailed to download page", file=sys.stderr)
    
    scraper.print_stats()

