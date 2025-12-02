#!/usr/bin/env python3
"""
Military Times Historical Scraper - Date-Based
==============================================

Scrapes by YEAR to get ALL historical Military Times data.

Usage:
  python3 scripts/military_times_by_year.py --start-year 2015 --end-year 2025
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

class MilitaryTimesByYearScraper:
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
    
    def scrape_outlet_year(self, outlet, year):
        """Scrape one outlet for one year"""
        
        # Military Times uses Archive pages
        # Format: https://www.armytimes.com/arc/outboundfeeds/news/?outputType=xml&from=2020-01-01&to=2020-12-31
        
        base_urls = {
            'armytimes': 'https://www.armytimes.com',
            'navytimes': 'https://www.navytimes.com',
            'airforcetimes': 'https://www.airforcetimes.com',
            'marinecorpstimes': 'https://www.marinecorpstimes.com',
        }
        
        base_url = base_urls.get(outlet)
        
        print(f"\n{'='*70}")
        print(f"📰 {outlet.upper()} - {year}")
        print(f"{'='*70}\n")
        
        year_stats = {'new': 0, 'existing': 0, 'errors': 0}
        
        # Try searching by year in their search/archive
        # Most Military Times sites have a search function
        for month in range(1, 13):
            try:
                # Search URL format (may need adjustment based on actual site)
                search_url = f"{base_url}/search/?q=*&d1={year}-{month:02d}-01&d2={year}-{month:02d}-28"
                
                print(f"📅 {year}-{month:02d}", end=" ")
                
                self.page.goto(search_url, wait_until='domcontentloaded', timeout=30000)
                time.sleep(3)
                
                soup = BeautifulSoup(self.page.content(), 'html.parser')
                
                # Find article links
                article_links = soup.find_all('a', href=re.compile(r'/news/.*\d{4}/\d{2}/\d{2}/'))
                
                if not article_links:
                    print("(no articles)")
                    continue
                
                urls = list(set([link['href'] if link['href'].startswith('http') else f"{base_url}{link['href']}" for link in article_links]))
                print(f"- {len(urls)} articles")
                
                for url in urls:
                    if self.article_exists(url):
                        year_stats['existing'] += 1
                        continue
                    
                    article = self.extract_article(url, outlet)
                    if article and self.save_article(article):
                        year_stats['new'] += 1
                    else:
                        year_stats['errors'] += 1
                    
                    time.sleep(1.5)
                
            except Exception as e:
                print(f"❌ Error: {str(e)[:50]}")
                continue
        
        print(f"\n✅ {outlet} {year}: {year_stats['new']} new, {year_stats['existing']} existing\n")
        
        self.stats['new'] += year_stats['new']
        self.stats['existing'] += year_stats['existing']
        self.stats['errors'] += year_stats['errors']
        
        return year_stats
    
    def scrape_all(self, start_year, end_year):
        """Scrape all outlets for all years"""
        
        outlets = ['armytimes', 'navytimes', 'airforcetimes', 'marinecorpstimes']
        
        print(f"\n{'='*70}")
        print(f"🎖️  MILITARY TIMES HISTORICAL SCRAPER (BY YEAR)")
        print(f"{'='*70}")
        print(f"Years: {start_year} to {end_year}")
        print(f"Outlets: {len(outlets)}")
        print(f"{'='*70}\n")
        
        for year in range(start_year, end_year + 1):
            # Restart browser every year to prevent memory leaks
            if year > start_year:
                print(f"\n🔄 Restarting browser...")
                self.stop_browser()
                time.sleep(3)
                self.start_browser()
            
            for outlet in outlets:
                self.scrape_outlet_year(outlet, year)
                
                # Progress report
                elapsed = (datetime.now() - self.start_time).total_seconds() / 60
                print(f"\n{'='*70}")
                print(f"📊 PROGRESS: {outlet} {year}")
                print(f"Total new: {self.stats['new']}")
                print(f"Total existing: {self.stats['existing']}")
                print(f"Runtime: {elapsed:.1f} minutes")
                print(f"{'='*70}\n")
        
        elapsed = (datetime.now() - self.start_time).total_seconds() / 60
        print(f"\n{'='*70}")
        print(f"✅ COMPLETE")
        print(f"{'='*70}")
        print(f"Total new articles: {self.stats['new']}")
        print(f"Total existing: {self.stats['existing']}")
        print(f"Total runtime: {elapsed:.1f} minutes")
        print(f"{'='*70}\n")

def main():
    import argparse
    
    parser = argparse.ArgumentParser()
    parser.add_argument('--start-year', type=int, default=2015)
    parser.add_argument('--end-year', type=int, default=datetime.now().year)
    
    args = parser.parse_args()
    
    scraper = MilitaryTimesByYearScraper()
    
    try:
        scraper.start_browser()
        scraper.scrape_all(args.start_year, args.end_year)
    finally:
        scraper.stop_browser()

if __name__ == '__main__':
    main()


