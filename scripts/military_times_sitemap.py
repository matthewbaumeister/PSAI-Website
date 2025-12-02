#!/usr/bin/env python3
"""
Military Times Sitemap Scraper
==============================

Uses sitemap.xml files to discover ALL articles, then scrapes them.
This is the most reliable method for comprehensive historical scraping.

Usage:
  python3 scripts/military_times_sitemap.py --source all
  python3 scripts/military_times_sitemap.py --source armytimes
"""

import os
import sys
import time
import re
from datetime import datetime
from pathlib import Path
import xml.etree.ElementTree as ET

try:
    from playwright.sync_api import sync_playwright
    from bs4 import BeautifulSoup
    from supabase import create_client
    import requests
except ImportError as e:
    print(f"Missing dependency: {e}")
    print("Install: pip install requests")
    sys.exit(1)

class MilitaryTimesSitemapScraper:
    def __init__(self):
        self.supabase = None
        
        supabase_url = os.getenv('SUPABASE_URL')
        supabase_key = os.getenv('SUPABASE_SERVICE_KEY')
        
        if supabase_url and supabase_key:
            self.supabase = create_client(supabase_url, supabase_key)
            print("✅ Connected to Supabase")
        
        self.stats = {'total': 0, 'new': 0, 'existing': 0, 'errors': 0}
        self.start_time = datetime.now()
    
    def start_browser(self):
        print("🌐 Starting browser...")
        self.playwright = sync_playwright().start()
        self.browser = self.playwright.chromium.launch(headless=True)
        self.context = self.browser.new_context(
            user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        )
        self.page = self.context.new_page()
        print("✅ Browser ready\n")
    
    def stop_browser(self):
        try:
            if self.context:
                self.context.close()
            if self.browser:
                self.browser.close()
            if hasattr(self, 'playwright'):
                self.playwright.stop()
        except:
            pass
    
    def get_sitemap_urls(self, outlet):
        """Get article URLs from sitemap"""
        
        base_urls = {
            'armytimes': 'https://www.armytimes.com',
            'navytimes': 'https://www.navytimes.com',
            'airforcetimes': 'https://www.airforcetimes.com',
            'marinecorpstimes': 'https://www.marinecorpstimes.com',
        }
        
        base_url = base_urls.get(outlet)
        
        print(f"\n{'='*70}")
        print(f"📰 {outlet.upper()} - Finding Articles via Sitemap")
        print(f"{'='*70}\n")
        
        article_urls = []
        
        # Try common sitemap locations
        sitemap_urls = [
            f"{base_url}/sitemap.xml",
            f"{base_url}/sitemap_index.xml",
            f"{base_url}/news-sitemap.xml",
            f"{base_url}/arc/outboundfeeds/sitemap/",
        ]
        
        for sitemap_url in sitemap_urls:
            try:
                print(f"🔍 Checking: {sitemap_url}")
                response = requests.get(sitemap_url, timeout=10)
                
                if response.status_code == 200:
                    print(f"   ✅ Found sitemap!")
                    
                    # Parse XML
                    root = ET.fromstring(response.content)
                    
                    # Handle sitemap index (points to other sitemaps)
                    namespace = {'ns': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
                    
                    # Check if it's a sitemap index
                    sitemaps = root.findall('.//ns:sitemap/ns:loc', namespace)
                    if sitemaps:
                        print(f"   📋 Found sitemap index with {len(sitemaps)} sitemaps")
                        print(f"   🔄 Loading all sitemaps to get complete history...")
                        for idx, sitemap_loc in enumerate(sitemaps, 1):  # Load ALL sitemaps
                            try:
                                print(f"      [{idx}/{len(sitemaps)}] {sitemap_loc.text[-50:]}")
                                sub_response = requests.get(sitemap_loc.text, timeout=10)
                                if sub_response.status_code == 200:
                                    sub_root = ET.fromstring(sub_response.content)
                                    urls = sub_root.findall('.//ns:url/ns:loc', namespace)
                                    news_urls = [url.text for url in urls if '/news/' in url.text]
                                    article_urls.extend(news_urls)
                                    print(f"         ✅ {len(news_urls)} articles")
                                time.sleep(0.5)  # Be nice to their server
                            except Exception as e:
                                print(f"         ⚠️  Error: {str(e)[:40]}")
                                continue
                    else:
                        # Direct sitemap with URLs
                        urls = root.findall('.//ns:url/ns:loc', namespace)
                        news_urls = [url.text for url in urls if '/news/' in url.text]
                        article_urls.extend(news_urls)
                        print(f"   📄 Found {len(news_urls)} news articles")
                    
                    break  # Found a working sitemap
                    
            except Exception as e:
                print(f"   ⚠️  Not found or error: {str(e)[:40]}")
                continue
        
        print(f"\n✅ Total article URLs found: {len(article_urls)}")
        return list(set(article_urls))  # Remove duplicates
    
    def article_exists(self, url):
        if not self.supabase:
            return False
        try:
            result = self.supabase.table('military_news_articles').select('id').eq('article_url', url).execute()
            return bool(result.data)
        except:
            return False
    
    def extract_article(self, url, outlet):
        """Extract Military Times article"""
        try:
            self.page.goto(url, wait_until='domcontentloaded', timeout=30000)
            time.sleep(2)
            
            soup = BeautifulSoup(self.page.content(), 'html.parser')
            
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
            title = soup.find('h1')
            if title:
                article['title'] = title.get_text(strip=True)
            
            # Content
            content_div = soup.find('div', class_=['article-content', 'entry-content']) or soup.find('article')
            if content_div:
                paragraphs = content_div.find_all('p')
                if paragraphs:
                    text_parts = [p.get_text(strip=True) for p in paragraphs if p.get_text(strip=True)]
                    article['content'] = '\n\n'.join(text_parts)
                    article['raw_html'] = str(content_div)
            
            # Date
            date_elem = soup.find('time')
            if date_elem:
                date_str = date_elem.get('datetime')
                if date_str:
                    article['published_date'] = date_str
            
            # Author
            author = soup.find('span', class_='author-name') or soup.find('a', class_='author')
            if author:
                article['author'] = author.get_text(strip=True).replace('By ', '')
            
            # Images
            images = soup.find_all('img', src=True)
            if images:
                img_urls = [img['src'] for img in images if 'http' in img['src'] and 'logo' not in img['src'].lower()][:5]
                if img_urls:
                    article['image_urls'] = img_urls
            
            return article
        except Exception as e:
            return None
    
    def save_article(self, article):
        if not self.supabase:
            return False
        try:
            if not article.get('published_date'):
                article['published_date'] = datetime.now().isoformat()
            if not article.get('title'):
                article['title'] = 'Untitled'
            if not article.get('content'):
                article['content'] = 'Content not extracted'
            
            self.supabase.table('military_news_articles').insert({
                'source': article.get('source'),
                'source_category': article.get('source_category'),
                'article_url': article.get('article_url'),
                'title': article.get('title'),
                'author': article.get('author'),
                'content': article.get('content'),
                'raw_html': article.get('raw_html'),
                'published_date': article.get('published_date'),
                'service_branches': article.get('service_branches'),
                'primary_service_branch': article.get('primary_service_branch'),
                'image_urls': article.get('image_urls'),
                'scraped_at': article.get('scraped_at'),
            }).execute()
            return True
        except Exception as e:
            return False
    
    def scrape_outlet(self, outlet, max_articles=None):
        """Scrape one outlet using sitemap"""
        
        # Get all article URLs from sitemap
        article_urls = self.get_sitemap_urls(outlet)
        
        if not article_urls:
            print(f"\n⚠️  No articles found in sitemap for {outlet}")
            return
        
        # Limit if specified
        if max_articles:
            article_urls = article_urls[:max_articles]
            print(f"\n📊 Limiting to {max_articles} articles")
        
        print(f"\n🔍 Starting to scrape {len(article_urls)} articles...\n")
        
        for i, url in enumerate(article_urls, 1):
            try:
                # Restart browser every 100 articles
                if i > 1 and i % 100 == 0:
                    print(f"\n🔄 Restarting browser (article {i})...")
                    self.stop_browser()
                    time.sleep(3)
                    self.start_browser()
                
                if self.article_exists(url):
                    print(f"[{i}/{len(article_urls)}] ⏭️  Exists")
                    self.stats['existing'] += 1
                    continue
                
                print(f"[{i}/{len(article_urls)}] 🔍 {url[:70]}...")
                article = self.extract_article(url, outlet)
                
                if article and self.save_article(article):
                    print(f"   ✅ Saved")
                    self.stats['new'] += 1
                else:
                    self.stats['errors'] += 1
                
                self.stats['total'] += 1
                time.sleep(1.5)
                
                # Progress report every 50 articles
                if i % 50 == 0:
                    elapsed = (datetime.now() - self.start_time).total_seconds() / 60
                    print(f"\n{'='*70}")
                    print(f"📊 Progress: {i}/{len(article_urls)} | New: {self.stats['new']} | Time: {elapsed:.1f}m")
                    print(f"{'='*70}\n")
                
            except KeyboardInterrupt:
                print("\n⚠️  Interrupted")
                raise
            except Exception as e:
                print(f"   ❌ Error: {str(e)[:50]}")
                self.stats['errors'] += 1
                continue
        
        elapsed = (datetime.now() - self.start_time).total_seconds() / 60
        print(f"\n{'='*70}")
        print(f"✅ {outlet.upper()} COMPLETE")
        print(f"{'='*70}")
        print(f"New articles: {self.stats['new']}")
        print(f"Already existing: {self.stats['existing']}")
        print(f"Errors: {self.stats['errors']}")
        print(f"Runtime: {elapsed:.1f} minutes")
        print(f"{'='*70}\n")

def main():
    import argparse
    
    parser = argparse.ArgumentParser()
    parser.add_argument('--source', choices=['armytimes', 'navytimes', 'airforcetimes', 'marinecorpstimes', 'all'], default='all')
    parser.add_argument('--max-articles', type=int, default=None, help='Max articles per outlet (for testing)')
    
    args = parser.parse_args()
    
    scraper = MilitaryTimesSitemapScraper()
    
    try:
        scraper.start_browser()
        
        outlets = ['armytimes', 'navytimes', 'airforcetimes', 'marinecorpstimes'] if args.source == 'all' else [args.source]
        
        for outlet in outlets:
            scraper.scrape_outlet(outlet, max_articles=args.max_articles)
        
    finally:
        scraper.stop_browser()

if __name__ == '__main__':
    main()

