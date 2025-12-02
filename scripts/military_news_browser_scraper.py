#!/usr/bin/env python3
"""
Military News Browser Scraper - Full Browser Emulation
========================================================

Uses Playwright to emulate a real browser and bypass bot detection.
Collects data from:
- Defense.gov (contract awards, news releases)
- DVIDS (military news, images, videos)
- Army.mil, Navy.mil, Air Force.mil
- Military Times properties

Install: pip install playwright && playwright install chromium
"""

import os
import sys
import time
import json
import re
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from pathlib import Path

# Playwright for browser automation
try:
    from playwright.sync_api import sync_playwright, Page, Browser
except ImportError:
    print("Error: playwright not installed")
    print("Install with: pip install playwright && playwright install chromium")
    sys.exit(1)

# Supabase
try:
    from supabase import create_client, Client
except ImportError:
    print("Error: supabase not installed")
    print("Install with: pip install supabase")
    sys.exit(1)

from bs4 import BeautifulSoup
import argparse


class MilitaryNewsBrowserScraper:
    """Browser-based scraper that bypasses bot detection"""
    
    def __init__(self, headless: bool = True, delay_seconds: float = 3.0):
        """
        Initialize browser scraper
        
        Args:
            headless: Run browser in headless mode
            delay_seconds: Delay between requests
        """
        self.headless = headless
        self.delay_seconds = delay_seconds
        
        # Stats
        self.stats = {
            'articles_found': 0,
            'articles_new': 0,
            'articles_skipped': 0,
            'contracts_extracted': 0,
        }
        
        # Initialize Supabase
        supabase_url = os.environ.get("SUPABASE_URL")
        supabase_key = os.environ.get("SUPABASE_SERVICE_KEY")
        
        if not supabase_url or not supabase_key:
            print("Warning: SUPABASE credentials not set. Data will be saved to JSON only.")
            self.supabase = None
        else:
            self.supabase = create_client(supabase_url, supabase_key)
        
        # Output directory
        self.output_dir = Path('data/military_news_browser')
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        self.browser = None
        self.page = None
    
    def start_browser(self):
        """Start Playwright browser"""
        print("Starting browser...")
        self.playwright = sync_playwright().start()
        
        # Launch browser with stealth settings
        self.browser = self.playwright.chromium.launch(
            headless=self.headless,
            args=[
                '--disable-blink-features=AutomationControlled',
                '--disable-dev-shm-usage',
                '--no-sandbox',
            ]
        )
        
        # Create context with realistic settings
        self.context = self.browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            locale='en-US',
            timezone_id='America/New_York',
        )
        
        # Create page
        self.page = self.context.new_page()
        
        # Add extra stealth
        self.page.add_init_script("""
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined
            });
        """)
        
        print("Browser started successfully!")
    
    def stop_browser(self):
        """Stop browser"""
        if self.context:
            self.context.close()
        if self.browser:
            self.browser.close()
        if self.playwright:
            self.playwright.stop()
        print("Browser stopped.")
    
    # ========================================
    # DEFENSE.GOV CONTRACT SCRAPER
    # ========================================
    
    def scrape_defense_gov_contracts(self, days_back: int = 30):
        """
        Scrape Defense.gov contract awards
        
        Args:
            days_back: Number of days back to scrape
        """
        print(f"\n{'='*70}")
        print("DEFENSE.GOV CONTRACT AWARDS")
        print(f"{'='*70}")
        print(f"Scraping last {days_back} days of contract awards")
        print(f"{'='*70}\n")
        
        base_url = "https://www.defense.gov"
        contracts_url = f"{base_url}/News/Contracts/"
        
        try:
            print(f"Loading {contracts_url}...")
            self.page.goto(contracts_url, wait_until='networkidle', timeout=60000)
            time.sleep(2)
            
            # Find contract article links
            print("Finding contract articles...")
            links = self.page.locator('a[href*="/Contract/Article/"]').all()
            
            print(f"Found {len(links)} contract article links")
            
            # Visit each article
            for i, link in enumerate(links[:days_back], 1):
                try:
                    href = link.get_attribute('href')
                    if not href:
                        continue
                    
                    article_url = href if href.startswith('http') else base_url + href
                    
                    print(f"\n[{i}/{min(len(links), days_back)}] Scraping: {article_url}")
                    
                    # Navigate to article
                    self.page.goto(article_url, wait_until='networkidle', timeout=60000)
                    time.sleep(self.delay_seconds)
                    
                    # Extract article content
                    article = self.extract_defense_gov_article()
                    if article:
                        article['article_url'] = article_url
                        self.save_article(article)
                        
                        # Extract contracts from article
                        if article.get('contract_paragraphs'):
                            for para in article['contract_paragraphs']:
                                contract = self.parse_contract_paragraph(para, article)
                                if contract:
                                    self.save_contract(contract)
                
                except Exception as e:
                    print(f"  Error scraping article: {e}")
                    continue
        
        except Exception as e:
            print(f"Error accessing Defense.gov: {e}")
    
    def extract_defense_gov_article(self) -> Optional[Dict]:
        """Extract article from current Defense.gov page"""
        try:
            content = self.page.content()
            soup = BeautifulSoup(content, 'html.parser')
            
            article = {
                'source': 'defense.gov',
                'source_category': 'official_dod',
                'article_types': ['contract_award'],
                'primary_article_type': 'contract_award',
                'scraped_at': datetime.now().isoformat(),
            }
            
            # Title
            title_elem = soup.find('h1')
            if title_elem:
                article['title'] = title_elem.get_text(strip=True)
                
                # Extract date from title "Contracts for December 15, 2024"
                date_match = re.search(r'([A-Z][a-z]+ \d{1,2}, \d{4})', article['title'])
                if date_match:
                    date_str = date_match.group(1)
                    article['published_date'] = datetime.strptime(date_str, '%B %d, %Y').isoformat()
            
            # Content
            content_elem = soup.find('div', class_='body') or soup.find('article')
            if content_elem:
                article['content'] = content_elem.get_text(strip=True)
                article['raw_html'] = str(content_elem)
                
                # Extract contract paragraphs
                paragraphs = content_elem.find_all('p')
                article['contract_paragraphs'] = [
                    p.get_text(strip=True) for p in paragraphs 
                    if len(p.get_text(strip=True)) > 100
                ]
            
            self.stats['articles_found'] += 1
            return article
            
        except Exception as e:
            print(f"  Error extracting article: {e}")
            return None
    
    def parse_contract_paragraph(self, paragraph: str, article: Dict) -> Optional[Dict]:
        """Parse contract paragraph (simplified version)"""
        if len(paragraph) < 100:
            return None
        
        try:
            contract = {
                'article_url': article.get('article_url'),
                'published_date': article.get('published_date'),
                'raw_paragraph': paragraph,
                'contract_description': paragraph,
                'scraped_at': datetime.now().isoformat(),
            }
            
            # Extract vendor name (first entity before "was awarded")
            vendor_match = re.match(r'^([^,]+),\s+([^,]+),\s+([A-Z]{2}),?\s+(?:was awarded|has been awarded)', paragraph)
            if vendor_match:
                contract['vendor_name'] = vendor_match.group(1).strip()
                contract['vendor_city'] = vendor_match.group(2).strip()
                contract['vendor_state'] = vendor_match.group(3).strip()
            
            # Extract award amount
            amount_match = re.search(r'\$(\d+(?:,\d{3})*(?:\.\d+)?)\s*(million|billion)?', paragraph)
            if amount_match:
                amount = float(amount_match.group(1).replace(',', ''))
                if amount_match.group(2) == 'million':
                    amount *= 1_000_000
                elif amount_match.group(2) == 'billion':
                    amount *= 1_000_000_000
                contract['award_amount'] = amount
            
            # Extract contract number
            contract_num_match = re.search(r'\(([A-Z0-9\-]{8,})\)', paragraph)
            if contract_num_match:
                contract['contract_number'] = contract_num_match.group(1)
            
            # Extract service branch
            if 'Army' in paragraph:
                contract['service_branch'] = 'army'
            elif 'Navy' in paragraph:
                contract['service_branch'] = 'navy'
            elif 'Air Force' in paragraph:
                contract['service_branch'] = 'air_force'
            elif 'Marine' in paragraph:
                contract['service_branch'] = 'marine_corps'
            
            if contract.get('vendor_name'):
                self.stats['contracts_extracted'] += 1
                return contract
            
            return None
            
        except Exception as e:
            return None
    
    # ========================================
    # DVIDS SCRAPER
    # ========================================
    
    def scrape_dvids_news(self, days_back: int = 7):
        """
        Scrape DVIDS news articles
        
        Args:
            days_back: Number of days back to scrape
        """
        print(f"\n{'='*70}")
        print("DVIDS NEWS SCRAPER")
        print(f"{'='*70}")
        print(f"Scraping last {days_back} days of DVIDS news")
        print(f"{'='*70}\n")
        
        base_url = "https://www.dvidshub.net"
        search_url = f"{base_url}/search/?q=&filter%5Btype%5D=news&sort=date"
        
        try:
            print(f"Loading {search_url}...")
            self.page.goto(search_url, wait_until='networkidle', timeout=60000)
            time.sleep(3)
            
            articles_collected = 0
            page_num = 1
            max_pages = days_back  # Roughly 1 page per day
            
            while page_num <= max_pages:
                print(f"\nPage {page_num}/{max_pages}")
                
                # Find article links on current page
                article_links = self.page.locator('a.article-link, a[href*="/news/"]').all()
                
                print(f"  Found {len(article_links)} article links on this page")
                
                # Collect hrefs
                hrefs = []
                for link in article_links:
                    href = link.get_attribute('href')
                    if href and '/news/' in href:
                        full_url = href if href.startswith('http') else base_url + href
                        hrefs.append(full_url)
                
                # Visit unique articles
                unique_hrefs = list(set(hrefs))
                print(f"  Processing {len(unique_hrefs)} unique articles...")
                
                for i, article_url in enumerate(unique_hrefs[:20], 1):  # Limit per page
                    try:
                        print(f"    [{i}/{min(len(unique_hrefs), 20)}] {article_url}")
                        
                        self.page.goto(article_url, wait_until='networkidle', timeout=60000)
                        time.sleep(self.delay_seconds)
                        
                        article = self.extract_dvids_article(article_url)
                        if article:
                            self.save_article(article)
                            articles_collected += 1
                    
                    except Exception as e:
                        print(f"      Error: {e}")
                        continue
                
                # Try to go to next page
                try:
                    next_button = self.page.locator('a.next, a[rel="next"]').first
                    if next_button.is_visible():
                        next_button.click()
                        time.sleep(3)
                        page_num += 1
                    else:
                        break
                except:
                    break
            
            print(f"\nCollected {articles_collected} DVIDS articles")
            
        except Exception as e:
            print(f"Error scraping DVIDS: {e}")
    
    def extract_dvids_article(self, article_url: str) -> Optional[Dict]:
        """Extract DVIDS article from current page"""
        try:
            content = self.page.content()
            soup = BeautifulSoup(content, 'html.parser')
            
            article = {
                'source': 'dvids',
                'source_category': 'dvids',
                'article_url': article_url,
                'scraped_at': datetime.now().isoformat(),
            }
            
            # Title
            title_elem = soup.find('h1')
            if title_elem:
                article['title'] = title_elem.get_text(strip=True)
            
            # Content
            content_elem = soup.find('div', class_='content') or soup.find('article')
            if content_elem:
                article['content'] = content_elem.get_text(separator='\n', strip=True)
            
            # Date
            date_elem = soup.find('time') or soup.find(class_='date')
            if date_elem:
                date_str = date_elem.get('datetime') or date_elem.get_text(strip=True)
                try:
                    article['published_date'] = datetime.fromisoformat(date_str.replace('Z', '+00:00')).isoformat()
                except:
                    pass
            
            self.stats['articles_found'] += 1
            return article
            
        except Exception as e:
            return None
    
    # ========================================
    # DATA PERSISTENCE
    # ========================================
    
    def save_article(self, article: Dict) -> bool:
        """Save article to database and JSON"""
        try:
            # Save to JSON
            date_str = datetime.now().strftime('%Y%m%d')
            json_file = self.output_dir / f"{article.get('source', 'unknown')}_{date_str}.jsonl"
            
            with open(json_file, 'a') as f:
                f.write(json.dumps(article) + '\n')
            
            # Save to Supabase
            if self.supabase and article.get('article_url'):
                try:
                    # Check if exists
                    result = self.supabase.table('military_news_articles')\
                        .select('id')\
                        .eq('article_url', article['article_url'])\
                        .execute()
                    
                    if not result.data:
                        self.supabase.table('military_news_articles').insert({
                            'source': article.get('source'),
                            'source_category': article.get('source_category'),
                            'article_url': article.get('article_url'),
                            'title': article.get('title'),
                            'content': article.get('content'),
                            'raw_html': article.get('raw_html'),
                            'published_date': article.get('published_date'),
                            'article_types': article.get('article_types'),
                            'primary_article_type': article.get('primary_article_type'),
                            'scraped_at': article.get('scraped_at'),
                        }).execute()
                        self.stats['articles_new'] += 1
                        print("    ✅ Saved to database")
                    else:
                        self.stats['articles_skipped'] += 1
                        print("    ⏭️  Already exists")
                except Exception as e:
                    print(f"    ⚠️  DB error: {e}")
            
            return True
            
        except Exception as e:
            print(f"    ❌ Save error: {e}")
            return False
    
    def save_contract(self, contract: Dict) -> bool:
        """Save contract to database"""
        if not self.supabase:
            return False
        
        try:
            self.supabase.table('military_contract_awards').insert({
                'article_url': contract.get('article_url'),
                'published_date': contract.get('published_date'),
                'vendor_name': contract.get('vendor_name'),
                'vendor_city': contract.get('vendor_city'),
                'vendor_state': contract.get('vendor_state'),
                'contract_number': contract.get('contract_number'),
                'award_amount': contract.get('award_amount'),
                'contract_description': contract.get('contract_description'),
                'service_branch': contract.get('service_branch'),
                'raw_paragraph': contract.get('raw_paragraph'),
                'scraped_at': contract.get('scraped_at'),
            }).execute()
            print(f"    💰 Contract saved: {contract.get('vendor_name')} - ${contract.get('award_amount', 0):,.0f}")
            return True
        except Exception as e:
            return False
    
    def print_stats(self):
        """Print scraping statistics"""
        print(f"\n{'='*70}")
        print("SCRAPING STATISTICS")
        print(f"{'='*70}")
        for key, value in self.stats.items():
            print(f"{key.replace('_', ' ').title():30} {value:>10,}")
        print(f"{'='*70}\n")


def main():
    """Main execution"""
    parser = argparse.ArgumentParser(description='Military News Browser Scraper (Bypasses Bot Detection)')
    parser.add_argument('--source', type=str, required=True,
                       choices=['defense-gov', 'dvids', 'all'],
                       help='Source to scrape')
    parser.add_argument('--days', type=int, default=7, help='Days back to scrape (default: 7)')
    parser.add_argument('--headless', action='store_true', help='Run browser in headless mode')
    parser.add_argument('--delay', type=float, default=3.0, help='Delay between requests (seconds)')
    
    args = parser.parse_args()
    
    scraper = MilitaryNewsBrowserScraper(headless=args.headless, delay_seconds=args.delay)
    
    try:
        scraper.start_browser()
        
        if args.source == 'defense-gov' or args.source == 'all':
            scraper.scrape_defense_gov_contracts(days_back=args.days)
        
        if args.source == 'dvids' or args.source == 'all':
            scraper.scrape_dvids_news(days_back=args.days)
        
        scraper.print_stats()
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        scraper.stop_browser()


if __name__ == "__main__":
    main()

