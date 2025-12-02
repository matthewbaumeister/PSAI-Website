"""
LinkedIn Company & Employee Scraper

Scrapes LinkedIn company profiles and employee data using Playwright
for stealth browsing and anti-bot evasion.

WARNING: LinkedIn TOS prohibits scraping. Use at your own risk.
Consider using official LinkedIn API for commercial applications.
"""

import asyncio
import random
import re
from typing import Dict, List, Optional
from playwright.async_api import async_playwright, Page, Browser
from loguru import logger
from config import (
    LINKEDIN_RATE_LIMIT,
    LINKEDIN_USER_AGENT,
    LINKEDIN_MAX_EMPLOYEES_PER_COMPANY
)


class LinkedInScraper:
    """Stealth LinkedIn scraper using Playwright"""
    
    def __init__(self):
        self.browser: Optional[Browser] = None
        self.page: Optional[Page] = None
        self.playwright = None
        
    async def init_browser(self, headless: bool = True):
        """Initialize stealth browser with anti-detection measures"""
        logger.info("Initializing browser...")
        
        self.playwright = await async_playwright().start()
        
        # Launch browser with stealth settings
        self.browser = await self.playwright.chromium.launch(
            headless=headless,
            args=[
                '--disable-blink-features=AutomationControlled',
                '--disable-dev-shm-usage',
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-web-security',
                '--disable-features=IsolateOrigins,site-per-process'
            ]
        )
        
        # Create context with realistic settings
        context = await self.browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            user_agent=LINKEDIN_USER_AGENT,
            locale='en-US',
            timezone_id='America/New_York',
            permissions=['geolocation']
        )
        
        # Add extra stealth
        await context.add_init_script("""
            // Override navigator.webdriver
            Object.defineProperty(navigator, 'webdriver', {
                get: () => false
            });
            
            // Override navigator.plugins
            Object.defineProperty(navigator, 'plugins', {
                get: () => [1, 2, 3, 4, 5]
            });
            
            // Override navigator.languages
            Object.defineProperty(navigator, 'languages', {
                get: () => ['en-US', 'en']
            });
        """)
        
        self.page = await context.new_page()
        logger.info("Browser initialized successfully")
        
    async def scrape_company_profile(self, linkedin_url: str) -> Optional[Dict]:
        """
        Scrape LinkedIn company profile
        
        Args:
            linkedin_url: LinkedIn company page URL
            
        Returns:
            Dict with company data or None if failed
        """
        if not self.page:
            raise RuntimeError("Browser not initialized. Call init_browser() first.")
        
        logger.info(f"Scraping company profile: {linkedin_url}")
        
        try:
            # Navigate to company page
            await self.page.goto(linkedin_url, wait_until='domcontentloaded', timeout=30000)
            
            # Wait for main content
            await self.page.wait_for_selector('.org-top-card', timeout=10000)
            
            # Add random human-like delay
            await self._random_delay(1, 3)
            
            # Extract company data
            company_data = {
                'linkedin_url': linkedin_url,
                'company_name': await self._extract_text('.org-top-card-summary__title'),
                'tagline': await self._extract_text('.org-top-card-summary__tagline'),
                'description': await self._extract_text('.org-about-us-organization-description__text'),
                'website': await self._extract_attribute('.org-top-card-primary-actions__inner a[data-tracking-control-name="page_member_main_nav_about_website"]', 'href'),
                'industry': await self._extract_industry(),
                'company_size': await self._extract_company_size(),
                'headquarters': await self._extract_headquarters(),
                'follower_count': await self._extract_follower_count(),
                'founded_year': await self._extract_founded_year(),
            }
            
            # Parse company size range
            if company_data.get('company_size'):
                company_data['company_size_min'], company_data['company_size_max'] = \
                    self._parse_company_size(company_data['company_size'])
            
            # Extract about section (more detailed description)
            about_section = await self._extract_about_section()
            if about_section:
                company_data['about'] = about_section
            
            # Extract specialties
            specialties = await self._extract_specialties()
            if specialties:
                company_data['specialties'] = specialties
            
            logger.info(f"Successfully scraped company: {company_data.get('company_name')}")
            
            # Add delay before next action (rate limiting)
            await self._random_delay(3, 5)
            
            return company_data
            
        except Exception as e:
            logger.error(f"Error scraping company profile {linkedin_url}: {e}")
            return None
    
    async def scrape_employees(
        self, 
        company_linkedin_url: str, 
        max_employees: int = LINKEDIN_MAX_EMPLOYEES_PER_COMPANY
    ) -> List[Dict]:
        """
        Scrape employees from company page
        
        NOTE: This is heavily protected by LinkedIn. Success rate will be low.
        Consider using LinkedIn API or third-party services for production.
        
        Args:
            company_linkedin_url: LinkedIn company page URL
            max_employees: Maximum number of employees to scrape
            
        Returns:
            List of employee dictionaries
        """
        if not self.page:
            raise RuntimeError("Browser not initialized. Call init_browser() first.")
        
        logger.info(f"Scraping employees from: {company_linkedin_url}")
        
        try:
            # Navigate to people page
            people_url = f"{company_linkedin_url}/people/"
            await self.page.goto(people_url, wait_until='domcontentloaded', timeout=30000)
            
            # Wait for employee cards to load
            await self.page.wait_for_selector('.org-people-profile-card', timeout=10000)
            
            employees = []
            
            # Scroll to load more employees (lazy loading)
            scroll_attempts = min(10, max_employees // 10)
            for i in range(scroll_attempts):
                # Scroll down
                await self.page.evaluate('window.scrollTo(0, document.body.scrollHeight)')
                
                # Random human-like delay
                await self._random_delay(1, 2)
                
                logger.debug(f"Scrolled {i+1}/{scroll_attempts} times")
            
            # Extract visible employee cards
            employee_cards = await self.page.query_selector_all('.org-people-profile-card')
            
            logger.info(f"Found {len(employee_cards)} employee cards")
            
            for card in employee_cards[:max_employees]:
                try:
                    # Extract employee data
                    name_elem = await card.query_selector('.org-people-profile-card__profile-title')
                    title_elem = await card.query_selector('.artdeco-entity-lockup__subtitle')
                    link_elem = await card.query_selector('a.app-aware-link')
                    
                    if name_elem and link_elem:
                        employee = {
                            'full_name': await name_elem.inner_text(),
                            'current_title': await title_elem.inner_text() if title_elem else None,
                            'linkedin_url': await link_elem.get_attribute('href'),
                        }
                        
                        # Clean up LinkedIn URL (remove tracking params)
                        if employee['linkedin_url']:
                            employee['linkedin_url'] = employee['linkedin_url'].split('?')[0]
                        
                        employees.append(employee)
                        
                except Exception as e:
                    logger.warning(f"Failed to extract employee card: {e}")
                    continue
            
            logger.info(f"Successfully scraped {len(employees)} employees")
            
            # Rate limiting delay
            await self._random_delay(3, 5)
            
            return employees
            
        except Exception as e:
            logger.error(f"Error scraping employees from {company_linkedin_url}: {e}")
            return []
    
    async def scrape_employee_profile(self, linkedin_url: str) -> Optional[Dict]:
        """
        Scrape individual employee profile (REQUIRES LOGIN)
        
        This method requires LinkedIn authentication and is not recommended
        for large-scale scraping due to account ban risk.
        
        Args:
            linkedin_url: Employee LinkedIn profile URL
            
        Returns:
            Dict with employee data or None if failed
        """
        logger.warning("Employee profile scraping requires LinkedIn login and has high ban risk")
        # TODO: Implement if needed
        return None
    
    # Helper methods
    
    async def _extract_text(self, selector: str) -> Optional[str]:
        """Extract text from element"""
        try:
            element = await self.page.query_selector(selector)
            if element:
                text = await element.inner_text()
                return text.strip() if text else None
        except:
            pass
        return None
    
    async def _extract_attribute(self, selector: str, attribute: str) -> Optional[str]:
        """Extract attribute from element"""
        try:
            element = await self.page.query_selector(selector)
            if element:
                return await element.get_attribute(attribute)
        except:
            pass
        return None
    
    async def _extract_industry(self) -> Optional[str]:
        """Extract industry from page"""
        # LinkedIn structure changes frequently, try multiple selectors
        selectors = [
            '.org-top-card-summary-info-list__info-item:has-text("Industry")',
            '.org-page-details__definition:has-text("Industry")',
        ]
        
        for selector in selectors:
            try:
                element = await self.page.query_selector(selector)
                if element:
                    text = await element.inner_text()
                    # Extract just the industry name
                    if '\n' in text:
                        return text.split('\n')[-1].strip()
                    return text.strip()
            except:
                continue
        
        return None
    
    async def _extract_company_size(self) -> Optional[str]:
        """Extract company size"""
        # Try to find company size in various formats
        selectors = [
            '.org-top-card-summary-info-list__info-item:has-text("employees")',
            '.org-page-details__definition:has-text("employees")',
        ]
        
        for selector in selectors:
            try:
                element = await self.page.query_selector(selector)
                if element:
                    text = await element.inner_text()
                    # Extract size range (e.g., "201-500 employees")
                    if 'employees' in text.lower():
                        return text.replace('employees', '').replace('on LinkedIn', '').strip()
            except:
                continue
        
        return None
    
    async def _extract_headquarters(self) -> Optional[str]:
        """Extract headquarters location"""
        selectors = [
            '.org-top-card-summary-info-list__info-item:has-text("Headquarters")',
            '.org-page-details__definition:has-text("Headquarters")',
        ]
        
        for selector in selectors:
            try:
                element = await self.page.query_selector(selector)
                if element:
                    text = await element.inner_text()
                    if '\n' in text:
                        return text.split('\n')[-1].strip()
                    return text.strip()
            except:
                continue
        
        return None
    
    async def _extract_follower_count(self) -> Optional[int]:
        """Extract follower count"""
        try:
            # Look for follower count
            text = await self._extract_text('.org-top-card-summary-info-list__info-item:has-text("followers")')
            if text and 'followers' in text.lower():
                # Parse number (e.g., "12,345 followers" -> 12345)
                number_str = text.split()[0].replace(',', '').replace('.', '')
                
                # Handle K, M suffixes
                if 'K' in number_str.upper():
                    return int(float(number_str.replace('K', '').replace('k', '')) * 1000)
                elif 'M' in number_str.upper():
                    return int(float(number_str.replace('M', '').replace('m', '')) * 1000000)
                else:
                    return int(number_str)
        except:
            pass
        
        return None
    
    async def _extract_founded_year(self) -> Optional[int]:
        """Extract founded year"""
        try:
            text = await self._extract_text('.org-page-details__definition:has-text("Founded")')
            if text:
                # Extract 4-digit year
                match = re.search(r'\b(19|20)\d{2}\b', text)
                if match:
                    return int(match.group())
        except:
            pass
        
        return None
    
    async def _extract_about_section(self) -> Optional[str]:
        """Extract full about section"""
        try:
            # Click "See more" button if present
            see_more = await self.page.query_selector('button.lt-line-clamp__more')
            if see_more:
                await see_more.click()
                await asyncio.sleep(0.5)
            
            return await self._extract_text('.org-about-us-organization-description__text')
        except:
            pass
        
        return None
    
    async def _extract_specialties(self) -> Optional[List[str]]:
        """Extract company specialties"""
        try:
            text = await self._extract_text('.org-page-details__definition:has-text("Specialties")')
            if text:
                # Split by comma or newline
                specialties = [s.strip() for s in re.split(r'[,\n]', text) if s.strip()]
                # Remove "Specialties" label if present
                specialties = [s for s in specialties if s.lower() != 'specialties']
                return specialties if specialties else None
        except:
            pass
        
        return None
    
    def _parse_company_size(self, size_str: str) -> tuple[Optional[int], Optional[int]]:
        """Parse company size range string into min/max integers"""
        try:
            # Examples: "11-50", "201-500", "10,001+"
            size_str = size_str.replace(',', '').strip()
            
            if '-' in size_str:
                parts = size_str.split('-')
                min_size = int(parts[0].strip())
                max_size = int(parts[1].strip().replace('+', ''))
                return min_size, max_size
            elif '+' in size_str:
                min_size = int(size_str.replace('+', '').strip())
                return min_size, None
            else:
                # Single number
                size = int(size_str)
                return size, size
        except:
            pass
        
        return None, None
    
    async def _random_delay(self, min_seconds: float = 1, max_seconds: float = 3):
        """Add random delay to mimic human behavior"""
        delay = random.uniform(min_seconds, max_seconds)
        await asyncio.sleep(delay)
    
    async def close(self):
        """Close browser"""
        if self.browser:
            await self.browser.close()
            logger.info("Browser closed")
        
        if self.playwright:
            await self.playwright.stop()


# Example usage
async def main():
    scraper = LinkedInScraper()
    await scraper.init_browser(headless=False)  # Set to True for production
    
    try:
        # Test company profile scraping
        company_url = "https://www.linkedin.com/company/lockheed-martin/"
        company_data = await scraper.scrape_company_profile(company_url)
        
        if company_data:
            print("Company Data:")
            print(company_data)
            
            # Test employee scraping
            employees = await scraper.scrape_employees(company_url, max_employees=20)
            print(f"\nFound {len(employees)} employees:")
            for emp in employees[:5]:
                print(f"  - {emp['full_name']}: {emp['current_title']}")
        
    finally:
        await scraper.close()


if __name__ == '__main__':
    asyncio.run(main())


