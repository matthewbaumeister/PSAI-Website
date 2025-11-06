#!/usr/bin/env python3
"""
Military News Historical Scraper
=================================

Comprehensive scraper for military news from multiple sources:
1. DVIDS API (Defense Visual Information Distribution Service)
2. Military Times properties (Army/Navy/Air Force/Marine Corps Times)
3. Service branch official sites (Army.mil, Navy.mil, etc.)
4. Defense.gov news releases

This is the HISTORICAL scraper - designed to backfill data.
Daily scraper will be built separately after testing.

Author: PropShop AI
"""

import os
import sys
import time
import json
import re
import requests
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple
from pathlib import Path
from bs4 import BeautifulSoup
import argparse
from urllib.parse import urljoin, urlparse

# Supabase client
try:
    from supabase import create_client, Client
except ImportError:
    print("Error: supabase-py not installed")
    print("Install with: pip install supabase")
    sys.exit(1)

class MilitaryNewsHistoricalScraper:
    """
    Historical scraper for military news from multiple sources
    """
    
    def __init__(self, delay_seconds: float = 2.0):
        """Initialize scraper"""
        self.delay_seconds = delay_seconds
        
        # Statistics
        self.stats = {
            'articles_found': 0,
            'articles_new': 0,
            'articles_updated': 0,
            'articles_skipped': 0,
            'articles_failed': 0,
            'contracts_extracted': 0,
            'personnel_changes_extracted': 0,
            'units_identified': 0,
            'exercises_found': 0,
            'deployments_found': 0,
        }
        
        # Initialize Supabase
        supabase_url = os.environ.get("SUPABASE_URL")
        supabase_key = os.environ.get("SUPABASE_SERVICE_KEY")
        
        if not supabase_url or not supabase_key:
            print("Warning: SUPABASE_URL or SUPABASE_SERVICE_KEY not set")
            print("Data will be saved to JSON files only")
            self.supabase = None
        else:
            self.supabase = create_client(supabase_url, supabase_key)
        
        # Set up session
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        })
        
        # Output directory for JSON backups
        self.output_dir = Path('data/military_news_historical')
        self.output_dir.mkdir(parents=True, exist_ok=True)
    
    # ========================================
    # DVIDS API SCRAPER
    # ========================================
    
    def scrape_dvids_api(self, start_date: datetime, end_date: datetime, source_type: str = 'news'):
        """
        Scrape DVIDS using their official API
        
        API Docs: https://www.dvidshub.net/api
        
        Args:
            start_date: Start date for scraping
            end_date: End date for scraping
            source_type: 'news', 'images', or 'video'
        """
        print(f"\n{'='*70}")
        print(f"DVIDS API Scraper - {source_type.upper()}")
        print(f"{'='*70}")
        print(f"Date range: {start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}")
        print(f"{'='*70}\n")
        
        base_url = "https://www.dvidshub.net/api/v2"
        
        # DVIDS API pagination
        page = 1
        max_results = 100  # Per page
        
        while True:
            # Build API request
            params = {
                'prettyprint': 'false',
                'page': page,
                'max': max_results,
                'datestart': start_date.strftime('%Y%m%d'),
                'dateend': end_date.strftime('%Y%m%d'),
            }
            
            api_url = f"{base_url}/{source_type}"
            
            try:
                print(f"Fetching page {page}...")
                response = self.session.get(api_url, params=params, timeout=30)
                
                if response.status_code != 200:
                    print(f"  Error: HTTP {response.status_code}")
                    break
                
                data = response.json()
                
                # DVIDS returns results in 'results' array
                results = data.get('results', [])
                
                if not results:
                    print(f"  No more results")
                    break
                
                print(f"  Found {len(results)} items")
                
                # Process each item
                for item in results:
                    article = self.parse_dvids_article(item, source_type)
                    if article:
                        self.save_article(article)
                
                # Check if there are more pages
                total_results = data.get('total', 0)
                if page * max_results >= total_results:
                    break
                
                page += 1
                time.sleep(self.delay_seconds)
                
            except Exception as e:
                print(f"  Error fetching DVIDS data: {e}")
                break
        
        print(f"\nDVIDS scraping completed: {self.stats['articles_found']} articles found")
    
    def parse_dvids_article(self, item: Dict, source_type: str) -> Optional[Dict]:
        """Parse DVIDS API response into article format"""
        try:
            article = {
                'source': 'dvids',
                'source_category': 'dvids',
                'scraped_at': datetime.now().isoformat(),
            }
            
            # Basic fields
            article['article_id'] = str(item.get('id'))
            article['title'] = item.get('title')
            article['article_url'] = item.get('url')
            
            # Date
            if item.get('date_published'):
                article['published_date'] = item['date_published']
            
            # Content
            if source_type == 'news':
                article['content'] = item.get('description', '')
                article['summary'] = item.get('summary', '')
            
            # Author/Credit
            if item.get('credit'):
                article['author'] = item['credit']
            
            # Unit information
            if item.get('unit'):
                unit = item['unit']
                article['units_mentioned'] = [unit.get('name', '')]
                
                # Try to extract service branch from unit
                unit_name_lower = unit.get('name', '').lower()
                if 'army' in unit_name_lower:
                    article['service_branches'] = ['army']
                elif 'navy' in unit_name_lower or 'naval' in unit_name_lower:
                    article['service_branches'] = ['navy']
                elif 'air force' in unit_name_lower:
                    article['service_branches'] = ['air_force']
                elif 'marine' in unit_name_lower:
                    article['service_branches'] = ['marine_corps']
                elif 'coast guard' in unit_name_lower:
                    article['service_branches'] = ['coast_guard']
            
            # Location
            if item.get('location'):
                location = item['location']
                article['locations'] = [location.get('name', '')]
                article['primary_location'] = location.get('name')
            
            # Images
            if item.get('image'):
                article['image_urls'] = [item['image']]
            
            # Tags (for classification)
            if item.get('tags'):
                tags = [tag.get('tag', '') for tag in item.get('tags', []) if tag.get('tag')]
                # Use tags to classify article type
                article_types = []
                if any('training' in tag.lower() or 'exercise' in tag.lower() for tag in tags):
                    article_types.append('training_exercise')
                if any('deployment' in tag.lower() for tag in tags):
                    article_types.append('deployment')
                if any('command' in tag.lower() for tag in tags):
                    article_types.append('change_of_command')
                
                if article_types:
                    article['article_types'] = article_types
                    article['primary_article_type'] = article_types[0]
            
            self.stats['articles_found'] += 1
            return article
            
        except Exception as e:
            print(f"    Error parsing DVIDS article: {e}")
            return None
    
    # ========================================
    # MILITARY TIMES SCRAPER
    # ========================================
    
    def scrape_military_times(self, outlet: str, start_date: datetime, end_date: datetime):
        """
        Scrape Military Times properties
        
        Args:
            outlet: 'armytimes', 'navytimes', 'airforcetimes', 'marinecorpstimes'
            start_date: Start date
            end_date: End date
        """
        print(f"\n{'='*70}")
        print(f"Military Times Scraper - {outlet.upper()}")
        print(f"{'='*70}")
        print(f"Date range: {start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}")
        print(f"{'='*70}\n")
        
        base_url = f"https://www.{outlet}.com"
        
        # Strategy: Try to access articles via date-based URLs or sitemap
        # Military Times uses date-based URL structure: /news/YYYY/MM/DD/slug/
        
        current_date = start_date
        while current_date <= end_date:
            print(f"Checking {current_date.strftime('%Y-%m-%d')}...")
            
            # Try common news sections
            sections = ['news', 'careers', 'pay-benefits']
            
            for section in sections:
                # This is a simplified approach - in production, you'd:
                # 1. Use sitemap.xml to discover URLs
                # 2. Or crawl section pages
                # 3. Or use RSS feeds if available
                
                pass  # Placeholder for actual implementation
            
            current_date += timedelta(days=1)
            time.sleep(self.delay_seconds)
        
        print(f"\nNote: Military Times scraping requires full URL discovery implementation")
        print(f"Recommend using sitemap.xml or RSS feeds")
    
    # ========================================
    # SERVICE BRANCH OFFICIAL SITES
    # ========================================
    
    def scrape_service_branch_rss(self, service: str, rss_url: str):
        """
        Scrape service branch RSS feed
        
        Args:
            service: 'army', 'navy', 'air_force', etc.
            rss_url: RSS feed URL
        """
        print(f"\n{'='*70}")
        print(f"{service.upper()} RSS Feed Scraper")
        print(f"{'='*70}")
        print(f"Feed: {rss_url}")
        print(f"{'='*70}\n")
        
        try:
            response = self.session.get(rss_url, timeout=30)
            if response.status_code != 200:
                print(f"Error: HTTP {response.status_code}")
                return
            
            # Parse RSS/XML
            from xml.etree import ElementTree as ET
            root = ET.fromstring(response.content)
            
            # RSS feeds typically have <item> elements
            items = root.findall('.//item')
            print(f"Found {len(items)} articles in RSS feed")
            
            for item in items:
                article = {
                    'source': f"{service}.mil",
                    'source_category': 'service_branch',
                    'service_branches': [service],
                    'primary_service_branch': service,
                    'scraped_at': datetime.now().isoformat(),
                }
                
                # Extract RSS fields
                title_elem = item.find('title')
                if title_elem is not None:
                    article['title'] = title_elem.text
                
                link_elem = item.find('link')
                if link_elem is not None:
                    article['article_url'] = link_elem.text
                
                description_elem = item.find('description')
                if description_elem is not None:
                    article['summary'] = description_elem.text
                
                pubdate_elem = item.find('pubDate')
                if pubdate_elem is not None:
                    # Parse RSS date format
                    try:
                        from email.utils import parsedate_to_datetime
                        article['published_date'] = parsedate_to_datetime(pubdate_elem.text).isoformat()
                    except:
                        pass
                
                # Fetch full article content
                if article.get('article_url'):
                    full_article = self.fetch_article_content(article['article_url'])
                    if full_article:
                        article['content'] = full_article.get('content', '')
                        article['raw_html'] = full_article.get('raw_html', '')
                
                self.save_article(article)
                time.sleep(self.delay_seconds)
                
        except Exception as e:
            print(f"Error scraping RSS feed: {e}")
    
    def fetch_article_content(self, url: str) -> Optional[Dict]:
        """Fetch full article content from URL"""
        try:
            response = self.session.get(url, timeout=30)
            if response.status_code != 200:
                return None
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Try common article content selectors
            content_selectors = [
                'article',
                '.article-content',
                '.post-content',
                '.entry-content',
                '#article-body',
            ]
            
            content = None
            for selector in content_selectors:
                elem = soup.select_one(selector)
                if elem:
                    content = elem.get_text(separator='\n', strip=True)
                    raw_html = str(elem)
                    break
            
            if content:
                return {
                    'content': content,
                    'raw_html': raw_html
                }
            
            return None
            
        except Exception as e:
            return None
    
    # ========================================
    # DATA PERSISTENCE
    # ========================================
    
    def save_article(self, article: Dict) -> bool:
        """Save article to database and/or JSON"""
        try:
            # Save to JSON backup
            date_str = datetime.now().strftime('%Y%m%d')
            json_file = self.output_dir / f"{article.get('source', 'unknown')}_{date_str}.jsonl"
            
            with open(json_file, 'a') as f:
                f.write(json.dumps(article) + '\n')
            
            # Save to Supabase if configured
            if self.supabase:
                return self.save_article_to_db(article)
            
            self.stats['articles_new'] += 1
            return True
            
        except Exception as e:
            print(f"    Error saving article: {e}")
            self.stats['articles_failed'] += 1
            return False
    
    def save_article_to_db(self, article: Dict) -> bool:
        """Save article to Supabase database"""
        try:
            # Check if article already exists
            result = self.supabase.table('military_news_articles')\
                .select('id')\
                .eq('article_url', article.get('article_url'))\
                .execute()
            
            if result.data:
                self.stats['articles_skipped'] += 1
                return True
            
            # Insert article
            self.supabase.table('military_news_articles').insert({
                'source': article.get('source'),
                'source_category': article.get('source_category'),
                'article_url': article.get('article_url'),
                'article_id': article.get('article_id'),
                'title': article.get('title'),
                'subtitle': article.get('subtitle'),
                'author': article.get('author'),
                'summary': article.get('summary'),
                'content': article.get('content'),
                'raw_html': article.get('raw_html'),
                'published_date': article.get('published_date'),
                'article_types': article.get('article_types'),
                'primary_article_type': article.get('primary_article_type'),
                'service_branches': article.get('service_branches'),
                'primary_service_branch': article.get('primary_service_branch'),
                'locations': article.get('locations'),
                'primary_location': article.get('primary_location'),
                'units_mentioned': article.get('units_mentioned'),
                'image_urls': article.get('image_urls'),
                'scraped_at': article.get('scraped_at'),
            }).execute()
            
            self.stats['articles_new'] += 1
            return True
            
        except Exception as e:
            print(f"    Error saving article to DB: {e}")
            self.stats['articles_failed'] += 1
            return False
    
    def log_scraper_run(self, scraper_name: str, scrape_type: str, source: str, 
                       date_from: Optional[datetime] = None, date_to: Optional[datetime] = None,
                       status: str = 'completed', error_message: Optional[str] = None,
                       started_at: Optional[datetime] = None):
        """Log scraper run to database"""
        if not self.supabase:
            return
        
        try:
            completed_at = datetime.now()
            duration = None
            if started_at:
                duration = int((completed_at - started_at).total_seconds())
            
            self.supabase.table('military_news_scraper_log').insert({
                'scraper_name': scraper_name,
                'scrape_type': scrape_type,
                'source': source,
                'date_from': date_from.date() if date_from else None,
                'date_to': date_to.date() if date_to else None,
                'articles_found': self.stats['articles_found'],
                'articles_new': self.stats['articles_new'],
                'articles_updated': self.stats['articles_updated'],
                'articles_skipped': self.stats['articles_skipped'],
                'articles_failed': self.stats['articles_failed'],
                'contracts_extracted': self.stats['contracts_extracted'],
                'personnel_changes_extracted': self.stats['personnel_changes_extracted'],
                'units_identified': self.stats['units_identified'],
                'exercises_found': self.stats['exercises_found'],
                'deployments_found': self.stats['deployments_found'],
                'status': status,
                'error_message': error_message,
                'started_at': started_at.isoformat() if started_at else None,
                'completed_at': completed_at.isoformat(),
                'duration_seconds': duration,
            }).execute()
            
        except Exception as e:
            print(f"Error logging scraper run: {e}")
    
    def print_stats(self):
        """Print scraper statistics"""
        print(f"\n{'='*70}")
        print("SCRAPING STATISTICS")
        print(f"{'='*70}")
        for key, value in self.stats.items():
            print(f"{key.replace('_', ' ').title():30} {value:>10,}")
        print(f"{'='*70}\n")


def main():
    """Main execution"""
    parser = argparse.ArgumentParser(description='Military News Historical Scraper')
    parser.add_argument('--source', type=str, required=True, 
                       choices=['dvids', 'armytimes', 'navytimes', 'airforcetimes', 
                               'marinecorpstimes', 'army-rss', 'navy-rss', 'airforce-rss'],
                       help='Source to scrape')
    parser.add_argument('--start-date', type=str, required=True, help='Start date (YYYY-MM-DD)')
    parser.add_argument('--end-date', type=str, help='End date (YYYY-MM-DD), default: today')
    parser.add_argument('--delay', type=float, default=2.0, help='Delay between requests (seconds)')
    
    args = parser.parse_args()
    
    # Parse dates
    start_date = datetime.strptime(args.start_date, '%Y-%m-%d')
    end_date = datetime.strptime(args.end_date, '%Y-%m-%d') if args.end_date else datetime.now()
    
    # Initialize scraper
    scraper = MilitaryNewsHistoricalScraper(delay_seconds=args.delay)
    scraper_start = datetime.now()
    
    try:
        # Run appropriate scraper
        if args.source == 'dvids':
            scraper.scrape_dvids_api(start_date, end_date, source_type='news')
        
        elif args.source in ['armytimes', 'navytimes', 'airforcetimes', 'marinecorpstimes']:
            scraper.scrape_military_times(args.source, start_date, end_date)
        
        elif args.source == 'army-rss':
            scraper.scrape_service_branch_rss('army', 'https://www.army.mil/rss/news.xml')
        
        elif args.source == 'navy-rss':
            scraper.scrape_service_branch_rss('navy', 'https://www.navy.mil/Press-Office/RSS/')
        
        elif args.source == 'airforce-rss':
            scraper.scrape_service_branch_rss('air_force', 'https://www.af.mil/DesktopModules/ArticleCS/RSS.ashx')
        
        # Log successful run
        scraper.log_scraper_run(
            scraper_name=f"military_news_historical_{args.source}",
            scrape_type='historical',
            source=args.source,
            date_from=start_date,
            date_to=end_date,
            status='completed',
            started_at=scraper_start
        )
        
    except Exception as e:
        print(f"\nError during scraping: {e}")
        import traceback
        traceback.print_exc()
        
        # Log failed run
        scraper.log_scraper_run(
            scraper_name=f"military_news_historical_{args.source}",
            scrape_type='historical',
            source=args.source,
            date_from=start_date,
            date_to=end_date,
            status='failed',
            error_message=str(e),
            started_at=scraper_start
        )
    
    finally:
        scraper.print_stats()


if __name__ == "__main__":
    main()

