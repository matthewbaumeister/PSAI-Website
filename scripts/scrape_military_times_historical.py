#!/usr/bin/env python3
"""
Military Times Historical Scraper
==================================

Scrapes all historical Military Times articles (Army, Navy, Air Force, Marine Corps)

Usage:
  python3 scripts/scrape_military_times_historical.py --source armytimes --pages 50
  python3 scripts/scrape_military_times_historical.py --source all --pages 100
"""

import os
import sys
import time
import json
import re
from datetime import datetime
from pathlib import Path

try:
    from playwright.sync_api import sync_playwright
    from bs4 import BeautifulSoup
    from supabase import create_client
except ImportError as e:
    print(f"Missing dependency: {e}")
    sys.exit(1)

class MilitaryTimesHistoricalScraper:
    def __init__(self):
        self.supabase = None
        self.checkpoint_file = Path('data/military_times_checkpoint.json')
        self.checkpoint_file.parent.mkdir(parents=True, exist_ok=True)
        
        self.stats = {
            'total_articles': 0,
            'new_articles': 0,
            'existing_articles': 0,
            'errors': 0,
            'start_time': datetime.now().isoformat(),
        }
        
        supabase_url = os.getenv('SUPABASE_URL')
        supabase_key = os.getenv('SUPABASE_SERVICE_KEY')
        
        if supabase_url and supabase_key:
            self.supabase = create_client(supabase_url, supabase_key)
            print("✅ Connected to Supabase")
        
        self.browser = None
        self.context = None
        self.page = None
    
    def start_browser(self):
        """Start browser"""
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
    
    def article_exists(self, url):
        """Check if article exists"""
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
    
    def extract_military_times_article(self, url, outlet):
        """Extract Military Times article"""
        try:
            self.page.goto(url, wait_until='domcontentloaded', timeout=30000)
            time.sleep(2)
            
            html_content = self.page.content()
            soup = BeautifulSoup(html_content, 'html.parser')
            
            service_map = {
                'armytimes': 'army',
                'navytimes': 'navy',
                'airforcetimes': 'air_force',
                'marinecorpstimes': 'marine_corps',
            }
            
            article = {
                'source': outlet,
                'source_category': 'military_times',
                'article_url': url,
                'service_branches': [service_map.get(outlet, 'unknown')],
                'primary_service_branch': service_map.get(outlet),
                'scraped_at': datetime.now().isoformat(),
            }
            
            # Title
            title = soup.find('h1') or soup.find('h1', class_='title')
            if title:
                article['title'] = title.get_text(strip=True)
            
            # Subtitle/deck/summary
            subtitle = (
                soup.find('h2', class_='deck') or
                soup.find('div', class_='subtitle') or
                soup.find('p', class_='lead') or
                soup.find('div', class_='article-dek')
            )
            if subtitle:
                article['subtitle'] = subtitle.get_text(strip=True)
                article['summary'] = subtitle.get_text(strip=True)
            
            # Author/byline
            author = (
                soup.find('span', class_='author-name') or
                soup.find('a', class_='author') or
                soup.find('div', class_='byline') or
                soup.find('span', rel='author')
            )
            if author:
                author_text = author.get_text(strip=True)
                author_text = author_text.replace('By ', '').replace('by ', '')
                article['author'] = author_text
                article['byline'] = f"By {author_text}"
            
            # Content
            content_div = (
                soup.find('div', class_='article-content') or
                soup.find('div', class_='entry-content') or
                soup.find('article') or
                soup.find('div', id='article-body')
            )
            
            if content_div:
                paragraphs = content_div.find_all('p')
                if paragraphs:
                    text_parts = [p.get_text(strip=True) for p in paragraphs if p.get_text(strip=True)]
                    article['content'] = '\n\n'.join(text_parts)
                else:
                    article['content'] = content_div.get_text(separator='\n', strip=True)
                article['raw_html'] = str(content_div)
            
            # Date
            date_elem = soup.find('time')
            if date_elem:
                date_str = date_elem.get('datetime')
                if date_str:
                    article['published_date'] = date_str
            
            # Article ID from URL
            article_id_match = re.search(r'/(\d{4}/\d{2}/\d{2})/([^/]+)/', url)
            if article_id_match:
                article['article_id'] = article_id_match.group(2)
            
            # Images
            images = soup.find_all('img', src=True)
            if images:
                img_urls = [img['src'] for img in images if 'http' in img['src'] and not 'icon' in img['src'].lower() and not 'logo' in img['src'].lower()]
                if img_urls:
                    article['image_urls'] = img_urls[:5]
            
            # Classification
            content_lower = article.get('content', '').lower()
            title_lower = article.get('title', '').lower()
            
            article_types = []
            keywords = {
                'promotion': ['promoted', 'promotion', 'promotion list', 'selected for'],
                'change_of_command': ['change of command', 'assumes command', 'takes command'],
                'assignment': ['assigned to', 'assignment', 'new position'],
                'retirement': ['retire', 'retirement', 'retiring'],
                'deployment': ['deploy', 'deployment', 'deployed'],
            }
            
            for article_type, kw_list in keywords.items():
                if any(kw in content_lower or kw in title_lower for kw in kw_list):
                    article_types.append(article_type)
            
            if article_types:
                article['article_types'] = article_types
                article['primary_article_type'] = article_types[0]
            
            return article
            
        except Exception as e:
            print(f"      ❌ Error: {str(e)[:50]}")
            return None
    
    def save_article(self, article):
        """Save article"""
        if not self.supabase:
            return False
        
        try:
            if not article.get('published_date'):
                article['published_date'] = datetime.now().isoformat()
            if not article.get('title'):
                article['title'] = f"Untitled - {article.get('article_url', 'no-url')[:50]}"
            if not article.get('content'):
                article['content'] = f"Content not extracted. Source: {article.get('article_url', 'unknown')}"
            
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
                'image_urls': article.get('image_urls'),
                'scraped_at': article.get('scraped_at'),
            }).execute()
            return True
        except Exception as e:
            print(f"      ⚠️  DB Error: {str(e)[:100]}")
            return False
    
    def scrape_outlet_historical(self, outlet, max_pages=None):
        """Scrape one Military Times outlet"""
        
        outlet_urls = {
            'armytimes': 'https://www.armytimes.com/news/your-army/',
            'navytimes': 'https://www.navytimes.com/news/your-navy/',
            'airforcetimes': 'https://www.airforcetimes.com/news/your-air-force/',
            'marinecorpstimes': 'https://www.marinecorpstimes.com/news/your-marine-corps/',
        }
        
        base_url = outlet_urls.get(outlet)
        if not base_url:
            print(f"Unknown outlet: {outlet}")
            return
        
        print(f"\n{'='*70}")
        print(f"📰 {outlet.upper()} HISTORICAL SCRAPER")
        print(f"{'='*70}")
        print(f"Max pages: {'UNLIMITED (scraping until exhausted)' if not max_pages else max_pages}")
        print(f"{'='*70}\n")
        
        page_num = 1
        consecutive_empty = 0
        
        while (not max_pages or page_num <= max_pages) and consecutive_empty < 5:
            try:
                # Restart browser every 100 pages to prevent memory leaks
                if page_num > 1 and page_num % 100 == 0:
                    print(f"\n🔄 Restarting browser (memory management)...")
                    try:
                        self.stop_browser()
                    except:
                        pass
                    time.sleep(3)
                    self.start_browser()
                
                print(f"\n📄 Page {page_num}")
                
                # Military Times pagination
                page_url = f"{base_url}?page={page_num}"
                self.page.goto(page_url, wait_until='domcontentloaded', timeout=30000)
                time.sleep(3)
                
                soup = BeautifulSoup(self.page.content(), 'html.parser')
                
                # Find article links
                article_links = soup.find_all('a', href=re.compile(r'/news/.*\d{4}/\d{2}/\d{2}/'))
                
                if not article_links:
                    consecutive_empty += 1
                    print(f"   No articles found (empty {consecutive_empty}/5)")
                    page_num += 1
                    continue
                
                # Get unique URLs
                urls = list(set([link['href'] if link['href'].startswith('http') else f"https://www.{outlet}.com{link['href']}" for link in article_links]))
                
                # Check if we're seeing all the same articles as last page (pagination stuck)
                if hasattr(self, 'last_page_urls') and set(urls) == set(self.last_page_urls):
                    consecutive_empty += 1
                    print(f"   Same articles as previous page - pagination may be exhausted ({consecutive_empty}/5)")
                    page_num += 1
                    continue
                
                self.last_page_urls = urls
                consecutive_empty = 0
                
                print(f"   Found {len(urls)} unique articles")
                
                for i, url in enumerate(urls, 1):
                    if self.article_exists(url):
                        print(f"   [{i}/{len(urls)}] ⏭️  Exists: {url[:60]}...")
                        self.stats['existing_articles'] += 1
                        continue
                    
                    print(f"   [{i}/{len(urls)}] 🔍 {url[:60]}...")
                    article = self.extract_military_times_article(url, outlet)
                    
                    if article:
                        print(f"      📝 Extracted: {article.get('title', 'No title')[:50]}...")
                        if self.save_article(article):
                            print(f"      ✅ Saved to DB")
                            self.stats['new_articles'] += 1
                        else:
                            print(f"      ❌ Failed to save to DB")
                            self.stats['errors'] += 1
                    else:
                        print(f"      ❌ Failed to extract article")
                        self.stats['errors'] += 1
                    
                    self.stats['total_articles'] += 1
                    time.sleep(2)
                
                print(f"   ✅ Page {page_num} complete")
                
                if page_num % 5 == 0:
                    elapsed = (datetime.now() - datetime.fromisoformat(self.stats['start_time'])).total_seconds() / 60
                    print(f"\n{'='*70}")
                    print(f"📊 PROGRESS: Page {page_num} | New: {self.stats['new_articles']} | Time: {elapsed:.1f}m")
                    print(f"{'='*70}\n")
                
                page_num += 1
                
            except KeyboardInterrupt:
                print("\n⚠️  Interrupted")
                break
            except Exception as e:
                print(f"   ❌ Error: {e}")
                page_num += 1
                time.sleep(5)
        
        print(f"\n{'='*70}")
        print(f"✅ {outlet.upper()} COMPLETE")
        print(f"{'='*70}")
        print(f"New articles: {self.stats['new_articles']}")
        print(f"Already existing: {self.stats['existing_articles']}")
        print(f"{'='*70}\n")

def main():
    import argparse
    
    parser = argparse.ArgumentParser()
    parser.add_argument('--source', choices=['armytimes', 'navytimes', 'airforcetimes', 'marinecorpstimes', 'all'], default='all')
    parser.add_argument('--pages', type=int, default=None, help='Max pages per outlet (default: unlimited)')
    
    args = parser.parse_args()
    
    scraper = MilitaryTimesHistoricalScraper()
    
    try:
        scraper.start_browser()
        
        outlets = ['armytimes', 'navytimes', 'airforcetimes', 'marinecorpstimes'] if args.source == 'all' else [args.source]
        
        for outlet in outlets:
            scraper.scrape_outlet_historical(outlet, max_pages=args.pages)
        
    finally:
        scraper.stop_browser()

if __name__ == '__main__':
    main()

