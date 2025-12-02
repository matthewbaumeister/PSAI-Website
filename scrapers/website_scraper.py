"""
Company Website Scraper

Scrapes company websites for:
- Leadership/team information
- Contact information (emails, phones)
- Office locations
- Certifications
- Service offerings
- Email patterns
"""

import re
import time
import requests
from typing import Dict, List, Optional
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
from loguru import logger
from config import (
    WEBSITE_MAX_DEPTH,
    WEBSITE_TIMEOUT,
    WEBSITE_MAX_PAGES_PER_SITE,
    WEBSITE_RATE_LIMIT
)


class WebsiteScraper:
    """Company website scraper"""
    
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        })
        
        self.pages_scraped = 0
        self.emails_found = set()
    
    def scrape_company_website(
        self, 
        website_url: str, 
        max_depth: int = WEBSITE_MAX_DEPTH
    ) -> Optional[Dict]:
        """
        Scrape company website for all relevant data
        
        Args:
            website_url: Company website URL
            max_depth: Maximum depth to crawl (default 3)
            
        Returns:
            Dict with scraped website data or None if failed
        """
        # Normalize URL - add http:// if missing
        if website_url and not website_url.startswith(('http://', 'https://')):
            website_url = 'https://' + website_url
        
        logger.info(f"Scraping website: {website_url}")
        
        self.pages_scraped = 0
        self.emails_found = set()
        
        data = {
            'website_url': website_url,
            'leadership_team': [],
            'discovered_emails': [],
            'office_locations': [],
            'service_offerings': [],
            'certifications': [],
        }
        
        try:
            # Scrape homepage
            homepage = self.fetch_page(website_url)
            if not homepage:
                logger.warning(f"Failed to fetch homepage: {website_url}")
                return None
            
            # Find key pages
            key_pages = self._find_key_pages(homepage, website_url)
            logger.info(f"Found key pages: {list(key_pages.keys())}")
            
            # Scrape about page
            if key_pages.get('about'):
                logger.debug(f"Scraping about page: {key_pages['about']}")
                about_data = self._scrape_about_page(key_pages['about'])
                if about_data:
                    data.update(about_data)
            
            # Scrape team/leadership page
            if key_pages.get('team'):
                logger.debug(f"Scraping team page: {key_pages['team']}")
                team_data = self._scrape_team_page(key_pages['team'])
                if team_data:
                    data['leadership_team'] = team_data.get('leadership', [])
                    data['executive_count'] = len(data['leadership_team'])
            
            # Scrape contact page
            if key_pages.get('contact'):
                logger.debug(f"Scraping contact page: {key_pages['contact']}")
                contact_data = self._scrape_contact_page(key_pages['contact'])
                if contact_data:
                    if contact_data.get('email'):
                        data['general_email'] = contact_data['email']
                    if contact_data.get('phone'):
                        data['general_phone'] = contact_data['phone']
                    if contact_data.get('locations'):
                        data['office_locations'] = contact_data['locations']
            
            # Extract emails from all visited pages
            all_pages = [homepage]
            for page_url in key_pages.values():
                soup = self.fetch_page(page_url)
                if soup:
                    all_pages.append(soup)
            
            for soup in all_pages:
                self.emails_found.update(self._extract_emails(soup))
            
            data['discovered_emails'] = list(self.emails_found)
            
            # Infer email pattern
            data['email_pattern'] = self._infer_email_pattern(data['discovered_emails'])
            
            # Extract common email domains
            if data['discovered_emails']:
                domains = [email.split('@')[1] for email in data['discovered_emails']]
                data['common_email_domains'] = list(set(domains))
            
            # Extract social links from homepage
            social_links = self._extract_social_links(homepage)
            if social_links.get('linkedin'):
                data['linkedin_url'] = social_links['linkedin']
            if social_links.get('twitter'):
                data['twitter_url'] = social_links['twitter']
            if social_links.get('facebook'):
                data['facebook_url'] = social_links['facebook']
            if social_links.get('youtube'):
                data['youtube_url'] = social_links['youtube']
            if social_links.get('github'):
                data['github_url'] = social_links['github']
            
            # Extract certifications and credentials
            cert_keywords = [
                'ISO', 'CMMI', 'ITAR', 'SOC 2', 'FedRAMP', 'NIST', 
                'Capability Maturity', 'DCAA', 'SAM.gov'
            ]
            
            homepage_text = homepage.get_text().lower()
            found_certs = []
            for keyword in cert_keywords:
                if keyword.lower() in homepage_text:
                    found_certs.append(keyword)
            
            data['certifications'] = found_certs if found_certs else []
            
            # Extract security clearances mentioned
            clearances = []
            clearance_patterns = [
                r'\b(secret clearance|top secret|ts/sci|ts clearance)\b',
                r'\bsecurity clearance\b'
            ]
            
            for pattern in clearance_patterns:
                matches = re.findall(pattern, homepage_text, re.IGNORECASE)
                if matches:
                    clearances.extend(matches)
            
            data['security_clearances'] = list(set(clearances)) if clearances else []
            
            # Calculate content richness score
            data['content_richness_score'] = self._calculate_richness_score(data)
            data['scrape_depth'] = self.pages_scraped
            
            logger.info(f"Successfully scraped {website_url}: {len(data['leadership_team'])} leaders, {len(data['discovered_emails'])} emails")
            
            return data
            
        except Exception as e:
            logger.error(f"Error scraping website {website_url}: {e}")
            return None
    
    def fetch_page(self, url: str) -> Optional[BeautifulSoup]:
        """
        Fetch and parse a web page
        
        Args:
            url: Page URL
            
        Returns:
            BeautifulSoup object or None if failed
        """
        if self.pages_scraped >= WEBSITE_MAX_PAGES_PER_SITE:
            logger.warning(f"Max pages limit reached ({WEBSITE_MAX_PAGES_PER_SITE})")
            return None
        
        try:
            # Rate limiting
            time.sleep(WEBSITE_RATE_LIMIT)
            
            response = self.session.get(url, timeout=WEBSITE_TIMEOUT)
            response.raise_for_status()
            
            self.pages_scraped += 1
            
            return BeautifulSoup(response.text, 'html.parser')
            
        except requests.exceptions.Timeout:
            logger.warning(f"Timeout fetching {url}")
        except requests.exceptions.RequestException as e:
            logger.warning(f"Error fetching {url}: {e}")
        except Exception as e:
            logger.error(f"Unexpected error fetching {url}: {e}")
        
        return None
    
    def _find_key_pages(self, soup: BeautifulSoup, base_url: str) -> Dict[str, str]:
        """
        Find key pages (about, team, contact) from homepage
        
        Args:
            soup: Homepage BeautifulSoup
            base_url: Base URL
            
        Returns:
            Dict mapping page types to URLs
        """
        key_pages = {}
        
        # Define keyword patterns for each page type
        patterns = {
            'about': ['about', 'company', 'who-we-are', 'about-us'],
            'team': ['team', 'leadership', 'management', 'our-team', 'people', 'executive'],
            'contact': ['contact', 'contact-us', 'get-in-touch'],
            'careers': ['careers', 'jobs', 'join-us', 'employment'],
        }
        
        # Find links matching patterns
        for link in soup.find_all('a', href=True):
            href = link['href'].lower()
            text = link.get_text().lower()
            
            for page_type, keywords in patterns.items():
                if page_type not in key_pages:
                    if any(kw in href or kw in text for kw in keywords):
                        full_url = urljoin(base_url, link['href'])
                        key_pages[page_type] = full_url
                        break
        
        return key_pages
    
    def _scrape_about_page(self, about_url: str) -> Optional[Dict]:
        """Scrape about page for company description"""
        soup = self.fetch_page(about_url)
        if not soup:
            return None
        
        # Find main content area
        content_selectors = [
            'main',
            '.content',
            '.about-content',
            '#about',
            'article',
            '.main-content'
        ]
        
        content_elem = None
        for selector in content_selectors:
            content_elem = soup.select_one(selector)
            if content_elem:
                break
        
        # Fallback to body if no content area found
        if not content_elem:
            content_elem = soup.body
        
        if content_elem:
            # Extract text and clean it
            about_text = content_elem.get_text(separator=' ', strip=True)
            
            # Clean up excessive whitespace
            about_text = re.sub(r'\s+', ' ', about_text)
            
            return {
                'about_text': about_text[:5000],  # Limit to 5000 chars
                'about_url': about_url
            }
        
        return None
    
    def _scrape_team_page(self, team_url: str) -> Optional[Dict]:
        """Scrape team/leadership page for people"""
        soup = self.fetch_page(team_url)
        if not soup:
            return None
        
        leadership = []
        
        # Common patterns for team member cards
        member_selectors = [
            '[class*="team-member"]',
            '[class*="person"]',
            '[class*="executive"]',
            '[class*="leader"]',
            '[class*="staff"]',
            '.bio',
            '.profile'
        ]
        
        team_members = []
        for selector in member_selectors:
            team_members = soup.select(selector)
            if len(team_members) > 0:
                break
        
        logger.debug(f"Found {len(team_members)} potential team member elements")
        
        for member in team_members[:50]:  # Limit to 50
            person = {}
            
            # Extract name (usually in h2, h3, h4, or strong)
            name_elem = member.find(['h2', 'h3', 'h4', 'h5', 'strong', 'b'])
            if name_elem:
                name = name_elem.get_text(strip=True)
                # Skip if name is too long (probably not a name)
                if len(name) < 50 and len(name) > 3:
                    person['name'] = name
            
            # Extract title
            title_patterns = [
                '[class*="title"]',
                '[class*="position"]',
                '[class*="role"]',
                'p',
                'span'
            ]
            
            for pattern in title_patterns:
                title_elem = member.select_one(pattern)
                if title_elem and title_elem != name_elem:
                    title = title_elem.get_text(strip=True)
                    # Check if this looks like a title (contains common keywords)
                    title_keywords = [
                        'ceo', 'cto', 'cfo', 'coo', 'president', 'vice', 'director', 
                        'manager', 'officer', 'executive', 'head', 'chief', 'founder'
                    ]
                    if any(kw in title.lower() for kw in title_keywords):
                        person['title'] = title
                        break
            
            # Extract bio/description
            bio_elem = member.find(['p', 'div'], class_=re.compile(r'bio|description|about'))
            if bio_elem:
                bio = bio_elem.get_text(strip=True)
                if len(bio) > 20 and len(bio) < 1000:
                    person['bio'] = bio
            
            # Extract email
            email_link = member.find('a', href=re.compile(r'mailto:'))
            if email_link:
                email = email_link['href'].replace('mailto:', '')
                person['email'] = email
            
            # Extract LinkedIn URL
            linkedin_link = member.find('a', href=re.compile(r'linkedin\.com'))
            if linkedin_link:
                person['linkedin_url'] = linkedin_link['href']
            
            # Only add if we have at least a name
            if person.get('name'):
                leadership.append(person)
        
        logger.info(f"Extracted {len(leadership)} team members from {team_url}")
        
        return {'leadership': leadership}
    
    def _scrape_contact_page(self, contact_url: str) -> Optional[Dict]:
        """Scrape contact page for emails, phones, addresses"""
        soup = self.fetch_page(contact_url)
        if not soup:
            return None
        
        contact_info = {}
        page_text = soup.get_text()
        
        # Extract phone numbers
        phone_patterns = [
            r'\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}',  # US format
            r'\+\d{1,3}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}'  # International
        ]
        
        for pattern in phone_patterns:
            match = re.search(pattern, page_text)
            if match:
                contact_info['phone'] = match.group()
                break
        
        # Extract emails
        emails = self._extract_emails(soup)
        if emails:
            contact_info['email'] = list(emails)[0]  # First email found
        
        # Extract office locations
        locations = self._extract_locations(soup)
        if locations:
            contact_info['locations'] = locations
        
        return contact_info
    
    def _extract_emails(self, soup: BeautifulSoup) -> set:
        """Extract all emails from page"""
        emails = set()
        
        # Method 1: Find mailto: links
        for link in soup.find_all('a', href=re.compile(r'mailto:')):
            email = link['href'].replace('mailto:', '').split('?')[0]
            if self._is_valid_email(email):
                emails.add(email.lower())
        
        # Method 2: Find email patterns in text
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        text = soup.get_text()
        found_emails = re.findall(email_pattern, text)
        
        for email in found_emails:
            if self._is_valid_email(email):
                emails.add(email.lower())
        
        # Filter out common junk emails
        junk_keywords = [
            'example', 'domain', 'email', 'yourcompany', 'test', 'sample',
            'placeholder', 'name@', 'username@'
        ]
        
        filtered_emails = set()
        for email in emails:
            if not any(junk in email.lower() for junk in junk_keywords):
                filtered_emails.add(email)
        
        return filtered_emails
    
    def _is_valid_email(self, email: str) -> bool:
        """Check if email is valid"""
        pattern = r'^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'
        return bool(re.match(pattern, email))
    
    def _extract_locations(self, soup: BeautifulSoup) -> List[Dict]:
        """Extract office locations from page"""
        locations = []
        
        # Look for address patterns
        address_pattern = r'\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Way|Court|Ct)'
        
        text = soup.get_text()
        addresses = re.findall(address_pattern, text, re.IGNORECASE)
        
        for address in addresses:
            locations.append({'address': address.strip()})
        
        return locations[:5]  # Limit to 5 locations
    
    def _extract_social_links(self, soup: BeautifulSoup) -> Dict[str, str]:
        """Extract social media links"""
        social = {}
        
        social_patterns = {
            'linkedin': r'linkedin\.com/company/',
            'twitter': r'(twitter\.com|x\.com)/',
            'facebook': r'facebook\.com/',
            'youtube': r'youtube\.com/',
            'github': r'github\.com/',
            'instagram': r'instagram\.com/'
        }
        
        for link in soup.find_all('a', href=True):
            href = link['href']
            for platform, pattern in social_patterns.items():
                if re.search(pattern, href):
                    social[platform] = href
                    break
        
        return social
    
    def _infer_email_pattern(self, emails: List[str]) -> Optional[str]:
        """
        Infer email naming pattern from discovered emails
        
        Returns pattern like: 'first.last@', 'firstl@', 'flast@', etc.
        """
        if not emails or len(emails) < 2:
            return None
        
        patterns = {
            'first.last': 0,
            'first_last': 0,
            'firstlast': 0,
            'flast': 0,
            'firstl': 0,
            'last.first': 0
        }
        
        for email in emails:
            local = email.split('@')[0].lower()
            
            # Count pattern occurrences
            if '.' in local and len(local.split('.')) == 2:
                parts = local.split('.')
                if len(parts[0]) > 2 and len(parts[1]) > 2:
                    patterns['first.last'] += 1
            elif '_' in local and len(local.split('_')) == 2:
                patterns['first_last'] += 1
            elif len(local) > 8 and '.' not in local and '_' not in local:
                patterns['firstlast'] += 1
            elif len(local) < 8:
                if local[0].isalpha() and local[-1].isalpha():
                    patterns['flast'] += 1
        
        # Return most common pattern
        if max(patterns.values()) > 0:
            return max(patterns, key=patterns.get)
        
        return None
    
    def _calculate_richness_score(self, data: Dict) -> int:
        """Calculate content richness score (0-100)"""
        score = 0
        
        # Leadership data (30 points)
        if data.get('leadership_team'):
            score += min(len(data['leadership_team']) * 5, 30)
        
        # Email data (20 points)
        if data.get('discovered_emails'):
            score += min(len(data['discovered_emails']) * 4, 20)
        
        # Contact info (15 points)
        if data.get('general_email'):
            score += 5
        if data.get('general_phone'):
            score += 5
        if data.get('office_locations'):
            score += 5
        
        # Social links (10 points)
        social_count = sum([
            1 for key in ['linkedin_url', 'twitter_url', 'facebook_url', 'youtube_url', 'github_url']
            if data.get(key)
        ])
        score += social_count * 2
        
        # About text (10 points)
        if data.get('about_text'):
            score += 10
        
        # Office locations (10 points)
        if data.get('office_locations'):
            score += min(len(data['office_locations']) * 3, 10)
        
        # Certifications (5 points)
        if data.get('certifications'):
            score += min(len(data['certifications']), 5)
        
        return min(score, 100)


# Example usage
def main():
    scraper = WebsiteScraper()
    
    # Test website scraping
    test_url = "https://www.lockheedmartin.com"
    
    data = scraper.scrape_company_website(test_url)
    
    if data:
        print("Website Data:")
        print(f"  Leadership Team: {len(data['leadership_team'])} members")
        print(f"  Emails Found: {len(data['discovered_emails'])}")
        print(f"  Email Pattern: {data.get('email_pattern')}")
        social_links = [k.replace('_url', '') for k in ['linkedin_url', 'twitter_url', 'facebook_url'] if data.get(k)]
        print(f"  Social Links: {social_links}")
        print(f"  Certifications: {data['certifications']}")
        print(f"  Richness Score: {data['content_richness_score']}/100")
        
        if data['leadership_team']:
            print("\n  Top Leaders:")
            for leader in data['leadership_team'][:5]:
                print(f"    - {leader.get('name')}: {leader.get('title')}")


if __name__ == '__main__':
    main()

