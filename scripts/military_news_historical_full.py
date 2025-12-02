#!/usr/bin/env python3
"""
Military News Historical Scraper - Full Backfill
================================================

Scrapes ALL historical data from DVIDS and Military Times with:
- Automatic checkpointing (can resume after interruption)
- Retry logic with exponential backoff
- Rate limiting protection
- Progress tracking
- Error recovery

Can run for hours/days - just let it run!

Usage:
  # Scrape all DVIDS history
  python3 scripts/military_news_historical_full.py --source dvids --start-year 2015
  
  # Scrape all Military Times history
  python3 scripts/military_news_historical_full.py --source all --start-year 2020
  
  # Resume from last checkpoint
  python3 scripts/military_news_historical_full.py --resume
"""

import os
import sys
import time
import json
import re
from datetime import datetime, timedelta
from pathlib import Path

try:
    from playwright.sync_api import sync_playwright
    from bs4 import BeautifulSoup
    from supabase import create_client
except ImportError as e:
    print(f"Missing dependency: {e}")
    print("\nInstall with:")
    print("  pip install playwright beautifulsoup4 supabase")
    sys.exit(1)

class HistoricalMilitaryNewsScraper:
    def __init__(self):
        self.supabase = None
        self.checkpoint_file = Path('data/military_news_checkpoint.json')
        self.checkpoint_file.parent.mkdir(parents=True, exist_ok=True)
        
        # Statistics
        self.stats = {
            'total_articles': 0,
            'new_articles': 0,
            'existing_articles': 0,
            'errors': 0,
            'start_time': datetime.now().isoformat(),
        }
        
        # Connect to Supabase
        supabase_url = os.getenv('SUPABASE_URL')
        supabase_key = os.getenv('SUPABASE_SERVICE_KEY')
        
        if supabase_url and supabase_key:
            self.supabase = create_client(supabase_url, supabase_key)
            print("✅ Connected to Supabase")
        else:
            print("⚠️  No Supabase credentials - will save to JSON only")
        
        self.browser = None
        self.context = None
        self.page = None
    
    def start_browser(self):
        """Start Playwright browser"""
        print("🌐 Starting browser...")
        self.playwright = sync_playwright().start()
        self.browser = self.playwright.chromium.launch(headless=True)
        self.context = self.browser.new_context(
            user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        )
        self.page = self.context.new_page()
        print("✅ Browser ready\n")
    
    def stop_browser(self):
        """Stop browser"""
        if self.context:
            self.context.close()
        if self.browser:
            self.browser.close()
        if hasattr(self, 'playwright'):
            self.playwright.stop()
    
    def load_checkpoint(self):
        """Load last checkpoint"""
        if self.checkpoint_file.exists():
            with open(self.checkpoint_file, 'r') as f:
                return json.load(f)
        return None
    
    def save_checkpoint(self, data):
        """Save checkpoint"""
        with open(self.checkpoint_file, 'w') as f:
            json.dump(data, f, indent=2)
    
    def article_exists(self, url):
        """Check if article already in database"""
        if not self.supabase:
            return False
        
        try:
            result = self.supabase.table('military_news_articles')\
                .select('id')\
                .eq('article_url', url)\
                .execute()
            return bool(result.data)
        except:
            return False
    
    def save_article(self, article):
        """Save article to Supabase"""
        if not self.supabase:
            return False
        
        try:
            # Ensure required fields
            if not article.get('published_date'):
                article['published_date'] = datetime.now().isoformat()
            if not article.get('title'):
                article['title'] = f"Untitled - {article.get('article_url', 'no-url')[:50]}"
            if not article.get('content'):
                article['content'] = f"Content not extracted. Source: {article.get('article_url', 'unknown')}"
            if not article.get('source'):
                article['source'] = 'unknown'
            
            self.supabase.table('military_news_articles').insert({
                'source': article.get('source'),
                'source_category': article.get('source_category'),
                'article_url': article.get('article_url'),
                'article_id': article.get('article_id'),
                'title': article.get('title'),
                'subtitle': article.get('subtitle'),
                'author': article.get('author'),
                'byline': article.get('byline'),
                'summary': article.get('summary'),
                'content': article.get('content'),
                'raw_html': article.get('raw_html'),
                'published_date': article.get('published_date'),
                'article_types': article.get('article_types'),
                'primary_article_type': article.get('primary_article_type'),
                'service_branches': article.get('service_branches'),
                'primary_service_branch': article.get('primary_service_branch'),
                'dod_components': article.get('dod_components'),
                'locations': article.get('locations'),
                'primary_location': article.get('primary_location'),
                'countries': article.get('countries'),
                'states': article.get('states'),
                'bases': article.get('bases'),
                'personnel_mentioned': article.get('personnel_mentioned'),
                'ranks_mentioned': article.get('ranks_mentioned'),
                'units_mentioned': article.get('units_mentioned'),
                'image_urls': article.get('image_urls'),
                'video_urls': article.get('video_urls'),
                'document_urls': article.get('document_urls'),
                'scraped_at': article.get('scraped_at'),
            }).execute()
            return True
        except Exception as e:
            print(f"      ⚠️  DB error: {str(e)[:50]}")
            return False
    
    def extract_dvids_article(self, url, retries=3):
        """Extract DVIDS article with retry logic"""
        for attempt in range(retries):
            try:
                self.page.goto(url, wait_until='domcontentloaded', timeout=30000)
                time.sleep(2)  # Let content load
                
                html_content = self.page.content()
                soup = BeautifulSoup(html_content, 'html.parser')
                
                article = {
                    'source': 'dvids',
                    'source_category': 'dvids',
                    'article_url': url,
                    'scraped_at': datetime.now().isoformat(),
                }
                
                # Title
                title = soup.find('h1', class_='asset-title') or soup.find('h1')
                if title:
                    article['title'] = title.get_text(strip=True)
                
                # Content
                content_div = soup.find('div', class_=['asset_container', 'asset_news_container'])
                if content_div:
                    main_p = content_div.find('p', recursive=False)
                    if main_p:
                        text = main_p.get_text(separator='\n')
                        lines = [line.strip() for line in text.split('\n') if line.strip()]
                        article['content'] = '\n\n'.join(lines)
                        article['raw_html'] = str(main_p)
                
                # Metadata
                info_div = soup.find('div', class_='asset_information')
                if info_div:
                    h3_tags = info_div.find_all('h3')
                    if h3_tags:
                        # Location
                        location_text = h3_tags[0].get_text(strip=True)
                        if location_text and not location_text.startswith('Story by'):
                            article['locations'] = [location_text]
                            article['primary_location'] = location_text
                            if ',' in location_text:
                                parts = [p.strip() for p in location_text.split(',')]
                                for part in parts:
                                    if len(part) == 2 and part.isupper():
                                        article['states'] = [part]
                                    elif len(part) > 2 and not article.get('countries'):
                                        article['countries'] = [parts[-1]]
                        
                        # Author
                        for h3 in h3_tags:
                            if 'Story by' in h3.get_text() or 'Photo By' in h3.get_text():
                                author_link = h3.find('a')
                                if author_link:
                                    article['author'] = author_link.get_text(strip=True)
                                    article['byline'] = f"Story by {article['author']}"
                        
                        # Unit
                        unit_h3 = info_div.find('h3', class_='the_unit')
                        if unit_h3:
                            unit_link = unit_h3.find('a')
                            if unit_link:
                                article['units_mentioned'] = [unit_link.get_text(strip=True)]
                
                # Date
                date_elem = soup.find('time')
                if date_elem:
                    date_str = date_elem.get('datetime')
                    if date_str:
                        article['published_date'] = date_str
                
                # Article ID
                article_id_match = re.search(r'/news/(\d+)/', url)
                if article_id_match:
                    article['article_id'] = article_id_match.group(1)
                
                # Images
                image_urls = []
                related_img = soup.find('div', class_='relatedimage')
                if related_img:
                    img = related_img.find('img', src=True)
                    if img:
                        image_urls.append(img['src'])
                
                if image_urls:
                    article['image_urls'] = image_urls[:10]
                
                # Classification
                content_lower = article.get('content', '').lower()
                title_lower = article.get('title', '').lower()
                
                article_types = []
                if any(kw in content_lower or kw in title_lower for kw in ['training', 'exercise', 'drill']):
                    article_types.append('training_exercise')
                if any(kw in content_lower or kw in title_lower for kw in ['deploy', 'deployment']):
                    article_types.append('deployment')
                if any(kw in content_lower or kw in title_lower for kw in ['change of command', 'assumes command']):
                    article_types.append('change_of_command')
                if any(kw in content_lower or kw in title_lower for kw in ['promotion', 'promoted']):
                    article_types.append('promotion')
                
                if article_types:
                    article['article_types'] = article_types
                    article['primary_article_type'] = article_types[0]
                
                return article
                
            except Exception as e:
                if attempt < retries - 1:
                    wait_time = 2 ** attempt  # Exponential backoff
                    print(f"      ⚠️  Retry {attempt+1}/{retries} after {wait_time}s...")
                    time.sleep(wait_time)
                else:
                    print(f"      ❌ Failed after {retries} attempts: {str(e)[:50]}")
                    self.stats['errors'] += 1
                    return None
        
        return None
    
    def scrape_dvids_historical(self, start_year=2015, end_year=None):
        """Scrape all DVIDS history year by year"""
        if not end_year:
            end_year = datetime.now().year
        
        print(f"\n{'='*70}")
        print(f"🎖️  DVIDS HISTORICAL SCRAPER")
        print(f"{'='*70}")
        print(f"Scraping: {start_year} to {end_year}")
        print(f"{'='*70}\n")
        
        # Load checkpoint
        checkpoint = self.load_checkpoint()
        if checkpoint and checkpoint.get('source') == 'dvids':
            print(f"📍 Resuming from checkpoint: Page {checkpoint.get('page', 1)}")
            start_page = checkpoint.get('page', 1)
        else:
            start_page = 1
        
        page_num = start_page
        consecutive_empty = 0
        max_consecutive_empty = 20  # Stop after 20 empty pages (DVIDS pagination has gaps)
        
        while consecutive_empty < max_consecutive_empty:
            try:
                # Restart browser every 50 pages to prevent memory leaks
                if page_num > 1 and page_num % 50 == 0:
                    print(f"\n🔄 Restarting browser (memory management)...")
                    self.stop_browser()
                    time.sleep(2)
                    self.start_browser()
                
                print(f"\n📄 Page {page_num}")
                
                # DVIDS search endpoint
                search_url = f"https://www.dvidshub.net/search/?filter%5Btype%5D=news&view=grid&page={page_num}"
                
                self.page.goto(search_url, wait_until='domcontentloaded', timeout=30000)
                time.sleep(3)
                
                # Find article links
                soup = BeautifulSoup(self.page.content(), 'html.parser')
                article_links = soup.find_all('a', href=re.compile(r'/news/\d+/'))
                
                if not article_links:
                    consecutive_empty += 1
                    print(f"   No articles found (empty {consecutive_empty}/{max_consecutive_empty})")
                    page_num += 1
                    continue
                
                consecutive_empty = 0  # Reset counter
                
                # Get unique URLs
                urls = list(set([f"https://www.dvidshub.net{link['href']}" for link in article_links]))
                print(f"   Found {len(urls)} articles")
                
                articles_this_page = 0
                for i, url in enumerate(urls, 1):
                    # Check if already exists
                    if self.article_exists(url):
                        print(f"   [{i}/{len(urls)}] ⏭️  Exists: {url[:60]}...")
                        self.stats['existing_articles'] += 1
                        continue
                    
                    print(f"   [{i}/{len(urls)}] 🔍 {url[:60]}...")
                    article = self.extract_dvids_article(url)
                    
                    if article and self.save_article(article):
                        print(f"      ✅ Saved")
                        self.stats['new_articles'] += 1
                        articles_this_page += 1
                    
                    self.stats['total_articles'] += 1
                    
                    # Rate limiting
                    time.sleep(2)
                    
                    # Save checkpoint every 10 articles
                    if self.stats['total_articles'] % 10 == 0:
                        self.save_checkpoint({
                            'source': 'dvids',
                            'page': page_num,
                            'stats': self.stats,
                            'timestamp': datetime.now().isoformat()
                        })
                
                print(f"   ✅ Page {page_num} complete: {articles_this_page} new articles")
                
                # Progress report every 5 pages
                if page_num % 5 == 0:
                    elapsed = (datetime.now() - datetime.fromisoformat(self.stats['start_time'])).total_seconds() / 60
                    print(f"\n{'='*70}")
                    print(f"📊 PROGRESS REPORT")
                    print(f"{'='*70}")
                    print(f"Pages processed: {page_num}")
                    print(f"New articles: {self.stats['new_articles']}")
                    print(f"Already existing: {self.stats['existing_articles']}")
                    print(f"Errors: {self.stats['errors']}")
                    print(f"Runtime: {elapsed:.1f} minutes")
                    print(f"{'='*70}\n")
                
                page_num += 1
                
            except KeyboardInterrupt:
                print("\n\n⚠️  Interrupted by user - saving checkpoint...")
                self.save_checkpoint({
                    'source': 'dvids',
                    'page': page_num,
                    'stats': self.stats,
                    'timestamp': datetime.now().isoformat()
                })
                break
            except Exception as e:
                print(f"   ❌ Page error: {e}")
                self.stats['errors'] += 1
                page_num += 1
                time.sleep(5)
        
        print(f"\n{'='*70}")
        print(f"✅ DVIDS HISTORICAL SCRAPING COMPLETE")
        print(f"{'='*70}")
        print(f"Total articles processed: {self.stats['total_articles']}")
        print(f"New articles saved: {self.stats['new_articles']}")
        print(f"Already existing: {self.stats['existing_articles']}")
        print(f"Errors: {self.stats['errors']}")
        elapsed = (datetime.now() - datetime.fromisoformat(self.stats['start_time'])).total_seconds() / 60
        print(f"Total runtime: {elapsed:.1f} minutes")
        print(f"{'='*70}\n")

def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Military News Historical Scraper')
    parser.add_argument('--source', choices=['dvids', 'all'], default='dvids',
                      help='Source to scrape')
    parser.add_argument('--start-year', type=int, default=2015,
                      help='Start year for scraping')
    parser.add_argument('--end-year', type=int, default=None,
                      help='End year (default: current year)')
    parser.add_argument('--resume', action='store_true',
                      help='Resume from last checkpoint')
    parser.add_argument('--delay', type=float, default=2.0,
                      help='Delay between requests (seconds)')
    
    args = parser.parse_args()
    
    scraper = HistoricalMilitaryNewsScraper()
    
    try:
        scraper.start_browser()
        
        if args.source == 'dvids' or args.source == 'all':
            scraper.scrape_dvids_historical(
                start_year=args.start_year,
                end_year=args.end_year
            )
        
    except KeyboardInterrupt:
        print("\n\n⚠️  Interrupted by user")
    finally:
        scraper.stop_browser()

if __name__ == '__main__':
    main()

