#!/usr/bin/env python3
"""
DVIDS Deep Historical Scraper
==============================

Scrapes DVIDS by YEAR to get ALL historical data going back to 2003.
Much more efficient than pagination.

Usage:
  python3 scripts/dvids_deep_historical.py --start-year 2003 --end-year 2025
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
    sys.exit(1)

class DVIDSDeepHistoricalScraper:
    def __init__(self):
        self.supabase = None
        
        supabase_url = os.getenv('SUPABASE_URL')
        supabase_key = os.getenv('SUPABASE_SERVICE_KEY')
        
        if supabase_url and supabase_key:
            self.supabase = create_client(supabase_url, supabase_key)
            print("✅ Connected to Supabase")
        
        self.stats = {
            'total': 0,
            'new': 0,
            'existing': 0,
            'errors': 0
        }
    
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
        if self.context:
            self.context.close()
        if self.browser:
            self.browser.close()
        if hasattr(self, 'playwright'):
            self.playwright.stop()
    
    def article_exists(self, url):
        if not self.supabase:
            return False
        try:
            result = self.supabase.table('military_news_articles').select('id').eq('article_url', url).execute()
            return bool(result.data)
        except:
            return False
    
    def extract_article(self, url):
        """Extract DVIDS article"""
        try:
            self.page.goto(url, wait_until='domcontentloaded', timeout=30000)
            time.sleep(2)
            
            html = self.page.content()
            soup = BeautifulSoup(html, 'html.parser')
            
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
                    lines = [l.strip() for l in text.split('\n') if l.strip()]
                    article['content'] = '\n\n'.join(lines)
                    article['raw_html'] = str(main_p)
            
            # Metadata
            info_div = soup.find('div', class_='asset_information')
            if info_div:
                h3_tags = info_div.find_all('h3')
                if h3_tags:
                    # Location
                    location = h3_tags[0].get_text(strip=True)
                    if location and not location.startswith('Story by'):
                        article['locations'] = [location]
                        article['primary_location'] = location
                        if ',' in location:
                            parts = [p.strip() for p in location.split(',')]
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
            match = re.search(r'/news/(\d+)/', url)
            if match:
                article['article_id'] = match.group(1)
            
            # Images
            image_urls = []
            related_img = soup.find('div', class_='relatedimage')
            if related_img:
                img = related_img.find('img', src=True)
                if img:
                    image_urls.append(img['src'])
            if image_urls:
                article['image_urls'] = image_urls
            
            return article
        except Exception as e:
            return None
    
    def save_article(self, article):
        """Save to Supabase"""
        if not self.supabase:
            return False
        try:
            if not article.get('published_date'):
                article['published_date'] = datetime.now().isoformat()
            if not article.get('title'):
                article['title'] = f"Untitled"
            if not article.get('content'):
                article['content'] = f"Content not extracted"
            
            self.supabase.table('military_news_articles').insert({
                'source': article.get('source'),
                'source_category': article.get('source_category'),
                'article_url': article.get('article_url'),
                'article_id': article.get('article_id'),
                'title': article.get('title'),
                'author': article.get('author'),
                'byline': article.get('byline'),
                'content': article.get('content'),
                'raw_html': article.get('raw_html'),
                'published_date': article.get('published_date'),
                'locations': article.get('locations'),
                'primary_location': article.get('primary_location'),
                'countries': article.get('countries'),
                'states': article.get('states'),
                'units_mentioned': article.get('units_mentioned'),
                'image_urls': article.get('image_urls'),
                'scraped_at': article.get('scraped_at'),
            }).execute()
            return True
        except:
            return False
    
    def scrape_year(self, year):
        """Scrape all articles from a specific year"""
        print(f"\n{'='*70}")
        print(f"📅 SCRAPING YEAR: {year}")
        print(f"{'='*70}\n")
        
        page = 1
        year_stats = {'new': 0, 'existing': 0, 'errors': 0}
        consecutive_empty = 0
        
        while consecutive_empty < 10:
            try:
                # Restart browser every 50 pages to prevent memory leaks
                if page > 1 and page % 50 == 0:
                    print(f"\n🔄 Restarting browser (memory management)...")
                    self.stop_browser()
                    time.sleep(2)
                    self.start_browser()
                
                # DVIDS search by year
                search_url = f"https://www.dvidshub.net/search/?filter%5Btype%5D=news&filter%5Bdate_published_from%5D={year}-01-01&filter%5Bdate_published_to%5D={year}-12-31&view=grid&page={page}"
                
                print(f"📄 Year {year}, Page {page}", end=" ")
                
                self.page.goto(search_url, wait_until='domcontentloaded', timeout=30000)
                time.sleep(3)
                
                soup = BeautifulSoup(self.page.content(), 'html.parser')
                links = soup.find_all('a', href=re.compile(r'/news/\d+/'))
                
                if not links:
                    consecutive_empty += 1
                    print(f"(empty {consecutive_empty}/10)")
                    page += 1
                    continue
                
                consecutive_empty = 0
                urls = list(set([f"https://www.dvidshub.net{l['href']}" for l in links]))
                print(f"- {len(urls)} articles")
                
                for url in urls:
                    if self.article_exists(url):
                        year_stats['existing'] += 1
                        self.stats['existing'] += 1
                        continue
                    
                    article = self.extract_article(url)
                    if article and self.save_article(article):
                        year_stats['new'] += 1
                        self.stats['new'] += 1
                    else:
                        year_stats['errors'] += 1
                        self.stats['errors'] += 1
                    
                    self.stats['total'] += 1
                    time.sleep(1.5)
                
                page += 1
                
            except KeyboardInterrupt:
                print("\n⚠️  Interrupted")
                return year_stats
            except Exception as e:
                print(f"❌ Error: {e}")
                page += 1
                time.sleep(5)
        
        print(f"\n✅ {year} COMPLETE: {year_stats['new']} new, {year_stats['existing']} existing")
        return year_stats
    
    def scrape_all_years(self, start_year, end_year):
        """Scrape all years from start to end"""
        print(f"\n{'='*70}")
        print(f"🎖️  DVIDS DEEP HISTORICAL SCRAPER")
        print(f"{'='*70}")
        print(f"Years: {start_year} to {end_year}")
        print(f"{'='*70}\n")
        
        start_time = datetime.now()
        
        # Scrape oldest to newest
        for year in range(start_year, end_year + 1):
            self.scrape_year(year)
            
            # Progress report
            elapsed = (datetime.now() - start_time).total_seconds() / 60
            print(f"\n{'='*70}")
            print(f"📊 OVERALL PROGRESS")
            print(f"{'='*70}")
            print(f"Years completed: {year - start_year + 1}/{end_year - start_year + 1}")
            print(f"Total new articles: {self.stats['new']}")
            print(f"Already existing: {self.stats['existing']}")
            print(f"Errors: {self.stats['errors']}")
            print(f"Runtime: {elapsed:.1f} minutes")
            print(f"{'='*70}\n")
        
        print(f"\n{'='*70}")
        print(f"✅ ALL YEARS COMPLETE")
        print(f"{'='*70}")
        print(f"Total new articles: {self.stats['new']}")
        print(f"Total runtime: {elapsed:.1f} minutes")
        print(f"{'='*70}\n")

def main():
    import argparse
    
    parser = argparse.ArgumentParser()
    parser.add_argument('--start-year', type=int, default=2003)
    parser.add_argument('--end-year', type=int, default=datetime.now().year)
    
    args = parser.parse_args()
    
    scraper = DVIDSDeepHistoricalScraper()
    
    try:
        scraper.start_browser()
        scraper.scrape_all_years(args.start_year, args.end_year)
    finally:
        scraper.stop_browser()

if __name__ == '__main__':
    main()

