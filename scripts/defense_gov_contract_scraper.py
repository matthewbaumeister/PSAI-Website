#!/usr/bin/env python3
"""
Defense.gov Daily Contract Awards Scraper
==========================================

Scrapes daily DoD contract award announcements from defense.gov

Published daily at approximately 5 PM EST at:
https://www.defense.gov/News/Contracts/

Features:
- Historical backfill capability
- Contract extraction and parsing
- Vendor information extraction
- Financial data parsing
- Supabase integration
- Rate limiting and error handling

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

# Supabase client
try:
    from supabase import create_client, Client
except ImportError:
    print("Error: supabase-py not installed")
    print("Install with: pip install supabase")
    sys.exit(1)

class DefenseGovContractScraper:
    """Scrapes daily contract awards from defense.gov"""
    
    def __init__(self, delay_seconds: float = 2.0):
        """
        Initialize scraper
        
        Args:
            delay_seconds: Delay between requests to respect servers
        """
        self.delay_seconds = delay_seconds
        self.base_url = "https://www.defense.gov"
        self.contracts_url = f"{self.base_url}/News/Contracts/"
        
        # Statistics
        self.articles_found = 0
        self.articles_new = 0
        self.articles_updated = 0
        self.articles_skipped = 0
        self.contracts_extracted = 0
        self.contracts_failed = 0
        
        # Initialize Supabase
        supabase_url = os.environ.get("SUPABASE_URL")
        supabase_key = os.environ.get("SUPABASE_SERVICE_KEY")
        
        if not supabase_url or not supabase_key:
            print("Warning: SUPABASE_URL or SUPABASE_SERVICE_KEY not set")
            print("Articles will be saved to JSON files only")
            self.supabase = None
        else:
            self.supabase = create_client(supabase_url, supabase_key)
        
        # Set up session with headers
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
        })
    
    def fetch_contract_article(self, url: str) -> Optional[Dict]:
        """
        Fetch a contract article from defense.gov
        
        Args:
            url: Full URL to contract article
            
        Returns:
            Dict with article data or None on failure
        """
        try:
            print(f"  Fetching: {url}")
            response = self.session.get(url, timeout=30)
            
            if response.status_code != 200:
                print(f"    Error: HTTP {response.status_code}")
                return None
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Extract article metadata
            article = {
                'url': url,
                'source': 'defense.gov',
                'source_category': 'official_dod',
                'article_types': ['contract_award'],
                'primary_article_type': 'contract_award',
                'scraped_at': datetime.now().isoformat()
            }
            
            # Title
            title_elem = soup.find('h1', class_='maintitle')
            if title_elem:
                article['title'] = title_elem.get_text(strip=True)
            
            # Date (usually in title like "Contracts for December 15, 2024")
            date_match = re.search(r'Contracts for ([A-Z][a-z]+ \d{1,2}, \d{4})', article.get('title', ''))
            if date_match:
                date_str = date_match.group(1)
                article['published_date'] = datetime.strptime(date_str, '%B %d, %Y').isoformat()
            
            # Content
            content_elem = soup.find('div', class_='body')
            if content_elem:
                article['content'] = content_elem.get_text(strip=True)
                article['raw_html'] = str(content_elem)
                
                # Extract contract paragraphs
                paragraphs = content_elem.find_all('p')
                article['contract_paragraphs'] = [p.get_text(strip=True) for p in paragraphs if p.get_text(strip=True)]
            
            # Article ID from URL (e.g., /News/Contracts/Contract/Article/1234567/)
            article_id_match = re.search(r'/Article/(\d+)/', url)
            if article_id_match:
                article['article_id'] = article_id_match.group(1)
            
            self.articles_found += 1
            return article
            
        except Exception as e:
            print(f"    Error fetching article: {e}")
            return None
    
    def parse_contract_paragraph(self, paragraph: str, article_date: str, article_url: str) -> Optional[Dict]:
        """
        Parse a contract award paragraph
        
        Format typically:
        "Vendor Name, City, State, was awarded a $X.X million contract...
        The contract description goes here... Work will be performed in Location...
        The expected completion date is Month DD, YYYY. Fiscal year YYYY...
        U.S. Air Force/Army/Navy Contracting Activity, Location, is the contracting activity (Contract Number)."
        
        Args:
            paragraph: Raw paragraph text
            article_date: Date article was published
            article_url: URL of source article
            
        Returns:
            Dict with extracted contract data or None
        """
        if len(paragraph) < 100:  # Skip short paragraphs
            return None
        
        # Skip header/footer paragraphs
        skip_keywords = ['this contract', 'no contract', 'list of contracts', 'follow contracts']
        if any(keyword in paragraph.lower()[:100] for keyword in skip_keywords):
            return None
        
        try:
            contract = {
                'article_url': article_url,
                'published_date': article_date,
                'raw_paragraph': paragraph,
                'scraped_at': datetime.now().isoformat()
            }
            
            # Extract vendor name and location (typically first part before "was awarded")
            vendor_match = re.match(r'^([^,]+),\s+([^,]+),\s+([A-Z]{2}),?\s+(?:was awarded|has been awarded|received)', paragraph)
            if vendor_match:
                contract['vendor_name'] = vendor_match.group(1).strip()
                contract['vendor_city'] = vendor_match.group(2).strip()
                contract['vendor_state'] = vendor_match.group(3).strip()
                contract['vendor_location'] = f"{contract['vendor_city']}, {contract['vendor_state']}"
            else:
                # Try alternative format: "Company Name* of City, State, was awarded"
                vendor_match2 = re.match(r'^([^*]+)\*?\s+of\s+([^,]+),\s+([A-Z]{2}),?\s+(?:was awarded|has been awarded)', paragraph)
                if vendor_match2:
                    contract['vendor_name'] = vendor_match2.group(1).strip()
                    contract['vendor_city'] = vendor_match2.group(2).strip()
                    contract['vendor_state'] = vendor_match2.group(3).strip()
                    contract['vendor_location'] = f"{contract['vendor_city']}, {contract['vendor_state']}"
            
            if not contract.get('vendor_name'):
                # Last resort: take first entity before "was awarded"
                first_part = paragraph.split('was awarded')[0] if 'was awarded' in paragraph else paragraph[:200]
                if ',' in first_part:
                    contract['vendor_name'] = first_part.split(',')[0].strip()
            
            # Extract award amount
            amount_patterns = [
                r'\$(\d+(?:,\d{3})*(?:\.\d+)?)\s*(million|billion|thousand)',
                r'\$(\d+(?:,\d{3})*(?:\.\d+)?)',
                r'approximately \$(\d+(?:,\d{3})*(?:\.\d+)?)\s*(million|billion)',
            ]
            
            for pattern in amount_patterns:
                amount_match = re.search(pattern, paragraph, re.IGNORECASE)
                if amount_match:
                    amount_str = amount_match.group(1).replace(',', '')
                    multiplier = 1
                    if len(amount_match.groups()) > 1:
                        unit = amount_match.group(2).lower()
                        if unit == 'million':
                            multiplier = 1_000_000
                        elif unit == 'billion':
                            multiplier = 1_000_000_000
                        elif unit == 'thousand':
                            multiplier = 1_000
                    
                    contract['award_amount'] = float(amount_str) * multiplier
                    contract['award_amount_text'] = amount_match.group(0)
                    break
            
            # Extract contract number (usually at end in parentheses)
            contract_num_patterns = [
                r'\(([A-Z0-9\-]+)\)\.',  # (CONTRACT-123).
                r'\(Contract\s+([A-Z0-9\-]+)\)',  # (Contract ABC-123)
                r'contract\s+(?:number\s+)?([A-Z0-9\-]{8,})',  # contract number ABC-123-456
            ]
            
            for pattern in contract_num_patterns:
                contract_num_match = re.search(pattern, paragraph)
                if contract_num_match:
                    contract['contract_number'] = contract_num_match.group(1)
                    break
            
            # Extract contracting activity (usually mentions the service and location)
            contracting_patterns = [
                r'(U\.S\. (?:Army|Navy|Air Force|Marine Corps|Space Force)[^(\.]+)',
                r'(Defense [^(\.]+)',
                r'([A-Z][^\.]+Contracting (?:Activity|Office|Command)[^(\.]+)',
            ]
            
            for pattern in contracting_patterns:
                contracting_match = re.search(pattern, paragraph)
                if contracting_match:
                    contract['contracting_activity'] = contracting_match.group(1).strip()
                    
                    # Extract service branch
                    if 'Army' in contract['contracting_activity']:
                        contract['service_branch'] = 'army'
                    elif 'Navy' in contract['contracting_activity']:
                        contract['service_branch'] = 'navy'
                    elif 'Air Force' in contract['contracting_activity']:
                        contract['service_branch'] = 'air_force'
                    elif 'Marine' in contract['contracting_activity']:
                        contract['service_branch'] = 'marine_corps'
                    elif 'Space Force' in contract['contracting_activity']:
                        contract['service_branch'] = 'space_force'
                    break
            
            # Extract completion date
            completion_patterns = [
                r'expected completion date is ([A-Z][a-z]+ \d{1,2}, \d{4})',
                r'completion date of ([A-Z][a-z]+ \d{4})',
                r'work is expected to be completed by ([A-Z][a-z]+ \d{1,2}, \d{4})',
            ]
            
            for pattern in completion_patterns:
                completion_match = re.search(pattern, paragraph)
                if completion_match:
                    date_str = completion_match.group(1)
                    try:
                        if ',' in date_str:
                            contract['completion_date'] = datetime.strptime(date_str, '%B %d, %Y').date().isoformat()
                        else:
                            contract['completion_date'] = datetime.strptime(date_str, '%B %Y').date().isoformat()
                    except:
                        pass
                    break
            
            # Extract fiscal year
            fy_match = re.search(r'[Ff]iscal (?:year )?(\d{4})', paragraph)
            if fy_match:
                contract['fiscal_year'] = int(fy_match.group(1))
            
            # Extract contract type
            contract_types = ['firm-fixed-price', 'cost-plus-fixed-fee', 'cost-plus-award-fee', 
                            'time-and-materials', 'indefinite-delivery/indefinite-quantity', 'IDIQ']
            for ctype in contract_types:
                if ctype.lower() in paragraph.lower():
                    contract['contract_type'] = ctype
                    break
            
            # Small business indicators
            small_biz_keywords = {
                'small business': 'small_business',
                '8(a)': '8a',
                'service-disabled veteran-owned': 'sdvosb',
                'woman-owned small business': 'wosb',
                'HUBZone': 'hubzone'
            }
            
            for keyword, biz_type in small_biz_keywords.items():
                if keyword.lower() in paragraph.lower():
                    contract['is_small_business'] = True
                    contract['small_business_type'] = biz_type
                    break
            
            # Store full description
            contract['contract_description'] = paragraph
            
            # Calculate extraction confidence
            confidence_score = 0.0
            if contract.get('vendor_name'): confidence_score += 0.3
            if contract.get('award_amount'): confidence_score += 0.2
            if contract.get('contract_number'): confidence_score += 0.2
            if contract.get('contracting_activity'): confidence_score += 0.15
            if contract.get('service_branch'): confidence_score += 0.15
            contract['extraction_confidence'] = confidence_score
            
            # Only return if we got minimum viable data
            if contract.get('vendor_name') and contract.get('contract_description'):
                return contract
            
            return None
            
        except Exception as e:
            print(f"    Error parsing contract: {e}")
            return None
    
    def save_article_to_db(self, article: Dict) -> bool:
        """Save article to Supabase database"""
        if not self.supabase:
            return False
        
        try:
            # Check if article already exists
            result = self.supabase.table('military_news_articles')\
                .select('id')\
                .eq('article_url', article['url'])\
                .execute()
            
            if result.data:
                self.articles_skipped += 1
                return True  # Already exists
            
            # Insert article
            self.supabase.table('military_news_articles').insert({
                'source': article.get('source'),
                'source_category': article.get('source_category'),
                'article_url': article.get('url'),
                'article_id': article.get('article_id'),
                'title': article.get('title'),
                'content': article.get('content'),
                'raw_html': article.get('raw_html'),
                'published_date': article.get('published_date'),
                'article_types': article.get('article_types'),
                'primary_article_type': article.get('primary_article_type'),
                'scraped_at': article.get('scraped_at'),
            }).execute()
            
            self.articles_new += 1
            return True
            
        except Exception as e:
            print(f"    Error saving article: {e}")
            return False
    
    def save_contract_to_db(self, contract: Dict, article_id: Optional[int] = None) -> bool:
        """Save contract to Supabase database"""
        if not self.supabase:
            return False
        
        try:
            # Get article_id if not provided
            if not article_id and contract.get('article_url'):
                result = self.supabase.table('military_news_articles')\
                    .select('id')\
                    .eq('article_url', contract['article_url'])\
                    .execute()
                
                if result.data:
                    article_id = result.data[0]['id']
            
            # Insert contract
            self.supabase.table('military_contract_awards').insert({
                'article_id': article_id,
                'article_url': contract.get('article_url'),
                'published_date': contract.get('published_date'),
                'vendor_name': contract.get('vendor_name'),
                'vendor_location': contract.get('vendor_location'),
                'vendor_city': contract.get('vendor_city'),
                'vendor_state': contract.get('vendor_state'),
                'contract_number': contract.get('contract_number'),
                'award_amount': contract.get('award_amount'),
                'award_amount_text': contract.get('award_amount_text'),
                'contract_type': contract.get('contract_type'),
                'contract_description': contract.get('contract_description'),
                'completion_date': contract.get('completion_date'),
                'fiscal_year': contract.get('fiscal_year'),
                'contracting_activity': contract.get('contracting_activity'),
                'service_branch': contract.get('service_branch'),
                'small_business_type': contract.get('small_business_type'),
                'is_small_business': contract.get('is_small_business', False),
                'raw_paragraph': contract.get('raw_paragraph'),
                'extraction_confidence': contract.get('extraction_confidence'),
                'scraped_at': contract.get('scraped_at'),
            }).execute()
            
            self.contracts_extracted += 1
            return True
            
        except Exception as e:
            print(f"    Error saving contract: {e}")
            self.contracts_failed += 1
            return False
    
    def scrape_date(self, date: datetime) -> Dict:
        """
        Scrape contracts for a specific date
        
        Args:
            date: Date to scrape
            
        Returns:
            Dict with results
        """
        print(f"\n{'='*70}")
        print(f"Scraping contracts for {date.strftime('%B %d, %Y')}")
        print(f"{'='*70}")
        
        # Defense.gov URLs are formatted as:
        # https://www.defense.gov/News/Contracts/Contract/Article/[ID]/
        # We need to search for articles on this date
        
        # Strategy: Try known URL patterns first, then search
        # Most recent contracts have incrementing IDs
        
        # For now, we'll search the main contracts page and filter by date
        # In production, you'd build a date-based URL discovery system
        
        print("  Note: This is a simplified implementation.")
        print("  Full implementation requires building article URL discovery.")
        print("  Consider using sitemap.xml or API if available.")
        
        return {
            'date': date.strftime('%Y-%m-%d'),
            'articles_found': 0,
            'contracts_extracted': 0
        }
    
    def scrape_date_range(self, start_date: datetime, end_date: datetime):
        """
        Scrape contracts for a date range
        
        Args:
            start_date: Start date
            end_date: End date
        """
        print(f"\n{'='*70}")
        print(f"Defense.gov Contract Scraper - Historical Mode")
        print(f"{'='*70}")
        print(f"Date range: {start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}")
        print(f"{'='*70}\n")
        
        current_date = start_date
        while current_date <= end_date:
            self.scrape_date(current_date)
            current_date += timedelta(days=1)
            time.sleep(self.delay_seconds)
        
        self.print_stats()
    
    def print_stats(self):
        """Print scraper statistics"""
        print(f"\n{'='*70}")
        print("SCRAPING STATISTICS")
        print(f"{'='*70}")
        print(f"Articles found:      {self.articles_found}")
        print(f"Articles new:        {self.articles_new}")
        print(f"Articles skipped:    {self.articles_skipped}")
        print(f"Contracts extracted: {self.contracts_extracted}")
        print(f"Contracts failed:    {self.contracts_failed}")
        print(f"{'='*70}\n")


def main():
    """Main execution"""
    parser = argparse.ArgumentParser(description='Defense.gov Contract Scraper')
    parser.add_argument('--start-date', type=str, help='Start date (YYYY-MM-DD)')
    parser.add_argument('--end-date', type=str, help='End date (YYYY-MM-DD)')
    parser.add_argument('--days', type=int, default=7, help='Number of days back from today (default: 7)')
    parser.add_argument('--test', action='store_true', help='Test mode - scrape single article')
    
    args = parser.parse_args()
    
    scraper = DefenseGovContractScraper(delay_seconds=2.0)
    
    if args.test:
        # Test with a known article
        print("TEST MODE: Scraping sample article")
        test_url = "https://www.defense.gov/News/Contracts/Contract/Article/3628734/"
        article = scraper.fetch_contract_article(test_url)
        
        if article:
            print("\nArticle fetched successfully!")
            print(f"Title: {article.get('title')}")
            print(f"Date: {article.get('published_date')}")
            print(f"Paragraphs: {len(article.get('contract_paragraphs', []))}")
            
            # Parse first few contracts
            if article.get('contract_paragraphs'):
                print("\nParsing contracts...")
                for i, para in enumerate(article['contract_paragraphs'][:3]):
                    contract = scraper.parse_contract_paragraph(
                        para, 
                        article.get('published_date'),
                        article.get('url')
                    )
                    if contract:
                        print(f"\nContract {i+1}:")
                        print(f"  Vendor: {contract.get('vendor_name')}")
                        print(f"  Amount: ${contract.get('award_amount', 0):,.2f}")
                        print(f"  Service: {contract.get('service_branch')}")
                        print(f"  Confidence: {contract.get('extraction_confidence', 0):.2f}")
        
        return
    
    # Determine date range
    if args.start_date and args.end_date:
        start = datetime.strptime(args.start_date, '%Y-%m-%d')
        end = datetime.strptime(args.end_date, '%Y-%m-%d')
    else:
        end = datetime.now()
        start = end - timedelta(days=args.days)
    
    # Run scraper
    scraper.scrape_date_range(start, end)


if __name__ == "__main__":
    main()

