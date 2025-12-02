#!/usr/bin/env python3
"""
DVIDS + Military Times Focused Scraper
========================================

Focused on:
- DVIDS: Unit news, training exercises, deployments, operations
- Military Times: Personnel news, promotions, assignments, change of commands

Usage:
  python3 scripts/scrape_dvids_and_military_times.py --source dvids --days 30
  python3 scripts/scrape_dvids_and_military_times.py --source army-times --days 30
  python3 scripts/scrape_dvids_and_military_times.py --source all --days 30
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
    print("\nInstall with:")
    print("  pip install playwright beautifulsoup4 supabase")
    print("  playwright install chromium")
    sys.exit(1)

import argparse


class DVIDSMilitaryTimesScraper:
    """Focused scraper for DVIDS and Military Times"""
    
    def __init__(self, headless=True, delay=3.0):
        self.headless = headless
        self.delay = delay
        
        # Stats
        self.stats = {
            'dvids_articles': 0,
            'military_times_articles': 0,
            'exercises_found': 0,
            'personnel_changes_found': 0,
            'units_identified': 0,
        }
        
        # Supabase
        supabase_url = os.environ.get("SUPABASE_URL")
        supabase_key = os.environ.get("SUPABASE_SERVICE_KEY")
        
        if supabase_url and supabase_key:
            self.supabase = create_client(supabase_url, supabase_key)
        else:
            print("⚠️  No Supabase credentials - saving to JSON only")
            self.supabase = None
        
        # Output
        self.output_dir = Path('data/military_news_focused')
        self.output_dir.mkdir(parents=True, exist_ok=True)
    
    def start_browser(self):
        """Start browser"""
        print("🌐 Starting browser...")
        self.playwright = sync_playwright().start()
        self.browser = self.playwright.chromium.launch(
            headless=self.headless,
            args=['--disable-blink-features=AutomationControlled']
        )
        self.context = self.browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        )
        self.page = self.context.new_page()
        print("✅ Browser ready\n")
    
    def stop_browser(self):
        """Stop browser"""
        if self.context:
            self.context.close()
        if self.browser:
            self.browser.close()
        if self.playwright:
            self.playwright.stop()
    
    # ========================================
    # DVIDS SCRAPER
    # ========================================
    
    def scrape_dvids(self, days_back=30, max_articles=200):
        """
        Scrape DVIDS news
        
        Focus: Unit news, training exercises, deployments, operations
        """
        print(f"\n{'='*70}")
        print("🎖️  DVIDS NEWS SCRAPER")
        print(f"{'='*70}")
        print(f"Target: {max_articles} articles from last {days_back} days")
        print(f"Focus: Unit news, exercises, deployments, operations")
        print(f"{'='*70}\n")
        
        search_url = "https://www.dvidshub.net/search/?q=&filter%5Btype%5D=news&sort=date"
        
        try:
            print(f"📡 Loading DVIDS search page...")
            self.page.goto(search_url, wait_until='domcontentloaded', timeout=60000)
            time.sleep(3)
            
            articles_collected = 0
            page_num = 1
            
            while articles_collected < max_articles:
                print(f"\n📄 Page {page_num}")
                
                # Scroll to load more content
                self.page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
                time.sleep(2)
                
                # Find article cards/links
                article_elements = self.page.locator('[class*="search-result"], [class*="article"], a[href*="/news/"]').all()
                
                print(f"   Found {len(article_elements)} potential articles")
                
                # Extract URLs
                urls = set()
                for elem in article_elements:
                    try:
                        href = elem.get_attribute('href')
                        if href and '/news/' in href and '/search/' not in href:
                            full_url = href if href.startswith('http') else f"https://www.dvidshub.net{href}"
                            urls.add(full_url)
                    except:
                        continue
                
                urls = list(urls)[:20]  # Limit per page
                print(f"   Processing {len(urls)} unique articles...")
                
                for i, url in enumerate(urls, 1):
                    if articles_collected >= max_articles:
                        break
                    
                    try:
                        print(f"   [{i}/{len(urls)}] {url[:60]}...")
                        
                        self.page.goto(url, wait_until='domcontentloaded', timeout=30000)
                        time.sleep(self.delay)
                        
                        article = self.extract_dvids_article(url)
                        if article:
                            self.save_article(article)
                            articles_collected += 1
                            self.stats['dvids_articles'] += 1
                            
                            # Track article types
                            if article.get('article_types'):
                                if 'training_exercise' in article['article_types']:
                                    self.stats['exercises_found'] += 1
                                if 'change_of_command' in article['article_types']:
                                    self.stats['personnel_changes_found'] += 1
                            
                            if article.get('units_mentioned'):
                                self.stats['units_identified'] += len(article['units_mentioned'])
                    
                    except Exception as e:
                        print(f"      ⚠️  Error: {str(e)[:50]}")
                        continue
                
                # Try next page
                try:
                    # Look for pagination
                    next_buttons = self.page.locator('a.next, a[rel="next"], button:has-text("Next")').all()
                    if next_buttons and next_buttons[0].is_visible():
                        next_buttons[0].click()
                        time.sleep(3)
                        page_num += 1
                    else:
                        print("\n   No more pages")
                        break
                except:
                    break
            
            print(f"\n✅ DVIDS complete: {articles_collected} articles collected")
            
        except Exception as e:
            print(f"\n❌ DVIDS error: {e}")
    
    def extract_dvids_article(self, url):
        """Extract DVIDS article data"""
        try:
            html_content = self.page.content()
            soup = BeautifulSoup(html_content, 'html.parser')
            
            article = {
                'source': 'dvids',
                'source_category': 'dvids',
                'article_url': url,
                'scraped_at': datetime.now().isoformat(),
            }
            
            # Title - DVIDS uses h1.asset-title
            title = soup.find('h1', class_='asset-title') or soup.find('h1')
            if title:
                article['title'] = title.get_text(strip=True)
            
            # Content - DVIDS uses div.asset_container > p
            content_div = soup.find('div', class_=['asset_container', 'asset_news_container'])
            if content_div:
                # Find the main article paragraph (not captions)
                main_p = content_div.find('p', recursive=False)  # Direct child only
                if main_p:
                    # Clean up <br> tags and get text
                    text = main_p.get_text(separator='\n')
                    # Remove multiple blank lines
                    lines = [line.strip() for line in text.split('\n') if line.strip()]
                    article['content'] = '\n\n'.join(lines)
                    article['raw_html'] = str(main_p)
            
            # Metadata section - div.asset_information
            info_div = soup.find('div', class_='asset_information')
            if info_div:
                h3_tags = info_div.find_all('h3')
                if len(h3_tags) >= 3:
                    # First h3: Location (e.g., "ALBANY , NEW YORK, UNITED STATES")
                    location_text = h3_tags[0].get_text(strip=True)
                    if location_text and not location_text.startswith('Story by'):
                        article['locations'] = [location_text]
                        article['primary_location'] = location_text
                        # Parse state/country
                        if ',' in location_text:
                            parts = [p.strip() for p in location_text.split(',')]
                            if len(parts) >= 2:
                                # Check for state abbreviation
                                for part in parts:
                                    if len(part) == 2 and part.isupper():
                                        article['states'] = [part]
                                    elif len(part) > 2:
                                        if not article.get('countries'):
                                            article['countries'] = [parts[-1]]
                    
                    # Second h3: Date
                    # Third h3: Author - "Story by [Name]"
                    for h3 in h3_tags:
                        h3_text = h3.get_text(strip=True)
                        if 'Story by' in h3_text or 'Photo By' in h3_text:
                            author_link = h3.find('a')
                            if author_link:
                                author_name = author_link.get_text(strip=True)
                                article['author'] = author_name
                                article['byline'] = f"Story by {author_name}"
                    
                    # Unit - h3.the_unit
                    unit_h3 = info_div.find('h3', class_='the_unit')
                    if unit_h3:
                        unit_link = unit_h3.find('a')
                        if unit_link:
                            article['units_mentioned'] = [unit_link.get_text(strip=True)]
            
            # Date
            date_elem = soup.find('time') or soup.find(class_='date')
            if date_elem:
                date_str = date_elem.get('datetime') or date_elem.get_text()
                try:
                    article['published_date'] = datetime.fromisoformat(date_str.replace('Z', '+00:00')).isoformat()
                except:
                    pass
            
            # Fallback: use current date if no date found
            if not article.get('published_date'):
                article['published_date'] = datetime.now().isoformat()
            
            # Article ID from URL (e.g., /news/550717/)
            article_id_match = re.search(r'/news/(\d+)/', url)
            if article_id_match:
                article['article_id'] = article_id_match.group(1)
            
            # Unit info
            unit_elem = soup.find(class_='unit') or soup.find('a', href=lambda x: x and '/unit/' in str(x))
            if unit_elem:
                article['units_mentioned'] = [unit_elem.get_text(strip=True)]
            
            # Location
            location_elem = soup.find(class_='location') or soup.find('span', class_='location')
            if location_elem:
                location_text = location_elem.get_text(strip=True)
                article['locations'] = [location_text]
                article['primary_location'] = location_text
                
                # Try to extract state/country
                if ', ' in location_text:
                    parts = location_text.split(', ')
                    if len(parts) >= 2:
                        # Check if last part is a state (2 letters)
                        if len(parts[-1]) == 2:
                            article['states'] = [parts[-1]]
                        # Check if it's a country
                        elif len(parts[-1]) > 2:
                            article['countries'] = [parts[-1]]
            
            # Images - from relatedimage div and asset_container
            image_urls = []
            related_img_div = soup.find('div', class_='relatedimage')
            if related_img_div:
                img = related_img_div.find('img', src=True)
                if img and img.get('src'):
                    image_urls.append(img['src'])
            
            # Additional images in content
            if content_div:
                other_imgs = content_div.find_all('img', src=True)
                for img in other_imgs:
                    if img.get('src') and 'dvidshub.net' in img['src'] and img['src'] not in image_urls:
                        image_urls.append(img['src'])
            
            if image_urls:
                article['image_urls'] = image_urls[:10]
            
            # Audio
            audio_player = soup.find('div', class_='inline-audio-player')
            if audio_player:
                audio = audio_player.find('source', src=True)
                if audio:
                    article['video_urls'] = [audio['src']]  # Store audio in video_urls
            
            # Documents/PDFs
            docs = soup.find_all('a', href=lambda x: x and ('.pdf' in str(x).lower() or '/document/' in str(x)))
            if docs:
                article['document_urls'] = [d['href'] for d in docs[:5]]
            
            # Classify article type based on content
            article_types = []
            content_lower = article.get('content', '').lower()
            title_lower = article.get('title', '').lower()
            
            if 'exercise' in content_lower or 'training' in content_lower:
                article_types.append('training_exercise')
            if 'change of command' in content_lower or 'change of command' in title_lower:
                article_types.append('change_of_command')
            if 'deploy' in content_lower:
                article_types.append('deployment')
            if 'promotion' in content_lower or 'promoted' in content_lower:
                article_types.append('promotion')
            
            if article_types:
                article['article_types'] = article_types
                article['primary_article_type'] = article_types[0]
            
            # Service branch detection
            services = []
            for service, keywords in {
                'army': ['army', 'soldier'],
                'navy': ['navy', 'sailor', 'ship'],
                'air_force': ['air force', 'airman'],
                'marine_corps': ['marine', 'marines'],
                'coast_guard': ['coast guard'],
            }.items():
                if any(kw in content_lower for kw in keywords):
                    services.append(service)
            
            if services:
                article['service_branches'] = services
                article['primary_service_branch'] = services[0]
            
            return article
            
        except Exception as e:
            print(f"      Error extracting: {e}")
            return None
    
    # ========================================
    # MILITARY TIMES SCRAPER
    # ========================================
    
    def scrape_military_times(self, outlet='armytimes', days_back=30, max_articles=100):
        """
        Scrape Military Times
        
        Focus: Personnel news, promotions, assignments, change of commands
        
        Args:
            outlet: 'armytimes', 'navytimes', 'airforcetimes', 'marinecorpstimes'
        """
        print(f"\n{'='*70}")
        print(f"📰 {outlet.upper()} SCRAPER")
        print(f"{'='*70}")
        print(f"Target: {max_articles} articles from last {days_back} days")
        print(f"Focus: Personnel news, promotions, assignments")
        print(f"{'='*70}\n")
        
        base_url = f"https://www.{outlet}.com"
        
        # Try news sections focused on personnel
        sections = [
            '/news/your-army/',  # Personnel-focused
            '/news/your-navy/',
            '/news/your-air-force/',
            '/news/your-marine-corps/',
            '/careers/',
            '/pay-benefits/',
        ]
        
        articles_collected = 0
        
        for section in sections:
            if articles_collected >= max_articles:
                break
            
            section_url = f"{base_url}{section}"
            
            try:
                print(f"\n📂 Section: {section}")
                self.page.goto(section_url, wait_until='domcontentloaded', timeout=60000)
                time.sleep(3)
                
                # Find article links
                links = self.page.locator('a[href*="/news/"], a[href*="/careers/"]').all()
                
                urls = set()
                for link in links:
                    try:
                        href = link.get_attribute('href')
                        if href:
                            full_url = href if href.startswith('http') else base_url + href
                            if outlet in full_url:
                                urls.add(full_url)
                    except:
                        continue
                
                urls = list(urls)[:20]
                print(f"   Found {len(urls)} article links")
                
                for i, url in enumerate(urls, 1):
                    if articles_collected >= max_articles:
                        break
                    
                    try:
                        print(f"   [{i}/{len(urls)}] {url[:60]}...")
                        
                        self.page.goto(url, wait_until='domcontentloaded', timeout=30000)
                        time.sleep(self.delay)
                        
                        article = self.extract_military_times_article(url, outlet)
                        if article:
                            self.save_article(article)
                            articles_collected += 1
                            self.stats['military_times_articles'] += 1
                            
                            if article.get('article_types'):
                                if 'promotion' in article['article_types'] or 'change_of_command' in article['article_types']:
                                    self.stats['personnel_changes_found'] += 1
                    
                    except Exception as e:
                        print(f"      ⚠️  Error: {str(e)[:50]}")
                        continue
            
            except Exception as e:
                print(f"   ⚠️  Section error: {e}")
                continue
        
        print(f"\n✅ {outlet} complete: {articles_collected} articles collected")
    
    def extract_military_times_article(self, url, outlet):
        """Extract Military Times article"""
        try:
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
                # Clean up common prefixes
                author_text = author_text.replace('By ', '').replace('by ', '')
                article['author'] = author_text
                article['byline'] = f"By {author_text}"
            
            # Content - try multiple selectors
            content_div = (
                soup.find('div', class_='article-content') or
                soup.find('div', class_='entry-content') or
                soup.find('article') or
                soup.find('div', id='article-body')
            )
            
            if content_div:
                # Get all paragraphs
                paragraphs = content_div.find_all('p')
                if paragraphs:
                    text_parts = [p.get_text(strip=True) for p in paragraphs if p.get_text(strip=True)]
                    article['content'] = '\n\n'.join(text_parts)
                else:
                    article['content'] = content_div.get_text(separator='\n', strip=True)
                
                # Save raw HTML
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
                article['article_id'] = article_id_match.group(2)  # Use the slug
            
            # Images
            images = soup.find_all('img', src=True)
            if images:
                img_urls = [img['src'] for img in images if 'http' in img['src'] and not 'icon' in img['src'].lower() and not 'logo' in img['src'].lower()]
                if img_urls:
                    article['image_urls'] = img_urls[:5]
            
            # Videos
            videos = soup.find_all('video', src=True) or soup.find_all('iframe', src=lambda x: x and 'video' in str(x).lower())
            if videos:
                article['video_urls'] = [v.get('src') for v in videos if v.get('src')][:3]
            
            # Documents
            docs = soup.find_all('a', href=lambda x: x and '.pdf' in str(x).lower())
            if docs:
                article['document_urls'] = [d['href'] for d in docs[:5]]
            
            # Classify based on content
            article_types = []
            content_lower = article.get('content', '').lower()
            title_lower = article.get('title', '').lower()
            
            keywords = {
                'promotion': ['promoted', 'promotion', 'promotion list', 'selected for'],
                'change_of_command': ['change of command', 'assumes command', 'takes command'],
                'assignment': ['assigned to', 'assignment', 'new position'],
                'retirement': ['retire', 'retirement'],
                'policy': ['new policy', 'regulation', 'rule change'],
            }
            
            for type_name, kws in keywords.items():
                if any(kw in content_lower or kw in title_lower for kw in kws):
                    article_types.append(type_name)
            
            if article_types:
                article['article_types'] = article_types
                article['primary_article_type'] = article_types[0]
            
            return article
            
        except Exception as e:
            return None
    
    # ========================================
    # SAVE FUNCTIONS
    # ========================================
    
    def save_article(self, article):
        """Save article to database and JSON"""
        try:
            # Ensure required fields have defaults (NOT NULL in database)
            if not article.get('published_date'):
                article['published_date'] = datetime.now().isoformat()
            if not article.get('title'):
                article['title'] = f"Untitled - {article.get('article_url', 'no-url')[:50]}"
            if not article.get('content'):
                article['content'] = f"Content not extracted. Source: {article.get('article_url', 'unknown')}"
            if not article.get('source'):
                article['source'] = 'unknown'
            
            # JSON backup
            date_str = datetime.now().strftime('%Y%m%d')
            json_file = self.output_dir / f"{article['source']}_{date_str}.jsonl"
            
            with open(json_file, 'a') as f:
                f.write(json.dumps(article) + '\n')
            
            # Supabase
            if self.supabase and article.get('article_url'):
                try:
                    result = self.supabase.table('military_news_articles')\
                        .select('id')\
                        .eq('article_url', article['article_url'])\
                        .execute()
                    
                    if not result.data:
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
                        print("      ✅ Saved to DB")
                    else:
                        print("      ⏭️  Exists")
                except Exception as e:
                    print(f"      ⚠️  DB: {str(e)[:30]}")
            
            return True
        except Exception as e:
            return False
    
    def print_stats(self):
        """Print statistics"""
        print(f"\n{'='*70}")
        print("📊 STATISTICS")
        print(f"{'='*70}")
        for key, value in self.stats.items():
            print(f"{key.replace('_', ' ').title():40} {value:>10,}")
        print(f"{'='*70}\n")


def main():
    parser = argparse.ArgumentParser(description='DVIDS + Military Times Focused Scraper')
    parser.add_argument('--source', required=True,
                       choices=['dvids', 'army-times', 'navy-times', 'air-force-times', 'marine-times', 'all-times', 'all'],
                       help='Source to scrape')
    parser.add_argument('--days', type=int, default=30, help='Days back (default: 30)')
    parser.add_argument('--max-articles', type=int, default=200, help='Max articles (default: 200)')
    parser.add_argument('--headless', action='store_true', help='Headless mode')
    parser.add_argument('--delay', type=float, default=3.0, help='Delay between requests')
    
    args = parser.parse_args()
    
    scraper = DVIDSMilitaryTimesScraper(headless=args.headless, delay=args.delay)
    
    try:
        scraper.start_browser()
        
        if args.source == 'dvids':
            scraper.scrape_dvids(days_back=args.days, max_articles=args.max_articles)
        
        elif args.source == 'army-times':
            scraper.scrape_military_times('armytimes', days_back=args.days, max_articles=args.max_articles)
        
        elif args.source == 'navy-times':
            scraper.scrape_military_times('navytimes', days_back=args.days, max_articles=args.max_articles)
        
        elif args.source == 'air-force-times':
            scraper.scrape_military_times('airforcetimes', days_back=args.days, max_articles=args.max_articles)
        
        elif args.source == 'marine-times':
            scraper.scrape_military_times('marinecorpstimes', days_back=args.days, max_articles=args.max_articles)
        
        elif args.source == 'all-times':
            for outlet in ['armytimes', 'navytimes', 'airforcetimes', 'marinecorpstimes']:
                scraper.scrape_military_times(outlet, days_back=args.days, max_articles=args.max_articles // 4)
        
        elif args.source == 'all':
            scraper.scrape_dvids(days_back=args.days, max_articles=args.max_articles // 2)
            for outlet in ['armytimes', 'navytimes']:
                scraper.scrape_military_times(outlet, days_back=args.days, max_articles=args.max_articles // 8)
        
        scraper.print_stats()
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        scraper.stop_browser()


if __name__ == "__main__":
    main()

