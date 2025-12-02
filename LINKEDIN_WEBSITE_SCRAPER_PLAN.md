# LinkedIn & Company Website Enrichment Scraper - Complete Plan

## Executive Summary

Build a comprehensive company enrichment system that scrapes LinkedIn and company websites to enrich all contractors in the database with employee data, leadership info, company metrics, and relationship tracking.

**Phase 1**: Historical scraper (backfill existing companies)
**Phase 2**: Daily incremental scraper (GitHub Action)

---

## Current Database Overview

### Company Sources (Tables to Scrape From):
1. **gsa_schedule_holders** - ~30K+ GSA contractors
2. **gwac_holders** - ~1K+ GWAC prime contractors
3. **fpds_contracts** - Millions of contract records (unique vendors ~300K+)
4. **fpds_company_stats** - Aggregated company stats
5. **dod_contract_news** - DoD contract announcements
6. **congressional_stock_trades** - Defense contractors (ticker-based)
7. **company_intelligence** - Existing enrichment table (SAM.gov, SEC, OpenCorporates)

### Total Unique Companies: **~350,000+** (estimated)

---

## Part 1: Database Schema Design

### New Tables

#### 1. `company_linkedin_profiles`
Stores LinkedIn company page data

```sql
CREATE TABLE company_linkedin_profiles (
  id BIGSERIAL PRIMARY KEY,
  
  -- Link to existing tables
  company_intelligence_id BIGINT REFERENCES company_intelligence(id),
  company_name TEXT NOT NULL,
  vendor_uei TEXT,
  vendor_duns TEXT,
  
  -- LinkedIn Profile
  linkedin_url TEXT UNIQUE NOT NULL,
  linkedin_company_id TEXT, -- LinkedIn's internal ID
  linkedin_vanity_name TEXT, -- URL slug
  
  -- Company Info
  tagline TEXT,
  description TEXT,
  about TEXT, -- Full "About" section
  industry TEXT,
  specialties TEXT[], -- Array of specialties
  company_size TEXT, -- '11-50', '51-200', '201-500', '501-1000', '1001-5000', '5001-10000', '10001+'
  company_size_min INTEGER, -- Parsed min
  company_size_max INTEGER, -- Parsed max
  employee_count_linkedin INTEGER, -- LinkedIn's reported count
  
  -- Location
  headquarters_city TEXT,
  headquarters_state TEXT,
  headquarters_country TEXT,
  headquarters_full TEXT, -- Full location string
  
  -- Company Details
  founded_year INTEGER,
  company_type TEXT, -- 'Public Company', 'Privately Held', 'Non-profit', etc.
  website TEXT,
  phone TEXT,
  
  -- Social Metrics
  follower_count INTEGER,
  
  -- Key People (Top 5-10 from LinkedIn)
  ceo_name TEXT,
  ceo_linkedin_url TEXT,
  leadership_team JSONB, -- Array of {name, title, linkedin_url}
  
  -- Engagement Metrics
  recent_posts_count INTEGER,
  avg_post_engagement DECIMAL(10,2),
  
  -- Data Quality
  profile_completeness_pct DECIMAL(5,2),
  last_verified_active BOOLEAN, -- Is company still active on LinkedIn?
  
  -- Scraping Metadata
  last_scraped TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  scrape_success BOOLEAN DEFAULT TRUE,
  scrape_error TEXT,
  scrape_attempts INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_linkedin_company_name ON company_linkedin_profiles(company_name);
CREATE INDEX idx_linkedin_uei ON company_linkedin_profiles(vendor_uei);
CREATE INDEX idx_linkedin_url ON company_linkedin_profiles(linkedin_url);
CREATE INDEX idx_linkedin_employee_count ON company_linkedin_profiles(employee_count_linkedin DESC NULLS LAST);
CREATE INDEX idx_linkedin_last_scraped ON company_linkedin_profiles(last_scraped);
```

#### 2. `company_employees`
Tracks individual employees found on LinkedIn

```sql
CREATE TABLE company_employees (
  id BIGSERIAL PRIMARY KEY,
  
  -- Link to Company
  company_intelligence_id BIGINT REFERENCES company_intelligence(id),
  linkedin_profile_id BIGINT REFERENCES company_linkedin_profiles(id),
  company_name TEXT NOT NULL,
  
  -- Employee Info
  full_name TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  linkedin_url TEXT UNIQUE NOT NULL,
  linkedin_profile_id_employee TEXT, -- LinkedIn's internal employee ID
  
  -- Current Position
  current_title TEXT,
  current_department TEXT, -- Engineering, Sales, Operations, etc.
  is_current_employee BOOLEAN DEFAULT TRUE,
  start_date DATE,
  end_date DATE, -- NULL if still employed
  tenure_months INTEGER,
  
  -- Contact Info (if available)
  email TEXT,
  phone TEXT,
  location TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  
  -- Profile Details
  headline TEXT,
  summary TEXT,
  profile_photo_url TEXT,
  
  -- Employment History (all companies, not just current)
  employment_history JSONB, -- Array of {company, title, start, end, description}
  total_years_experience INTEGER,
  
  -- Education
  education JSONB, -- Array of {school, degree, field, start, end}
  highest_degree TEXT, -- 'Bachelor', 'Master', 'PhD', etc.
  
  -- Skills & Certifications
  skills TEXT[], -- Top skills
  certifications JSONB, -- Array of {name, issuer, date, url}
  
  -- Seniority Level
  seniority_level TEXT, -- 'Entry Level', 'Mid-Senior', 'Director', 'Executive', 'C-Level'
  is_leadership BOOLEAN DEFAULT FALSE,
  is_executive BOOLEAN DEFAULT FALSE,
  is_founder BOOLEAN DEFAULT FALSE,
  
  -- Activity Metrics
  connections_count INTEGER,
  followers_count INTEGER,
  
  -- Scraping Metadata
  last_scraped TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  scrape_success BOOLEAN DEFAULT TRUE,
  scrape_error TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_employees_company_id ON company_employees(company_intelligence_id);
CREATE INDEX idx_employees_linkedin_profile ON company_employees(linkedin_profile_id);
CREATE INDEX idx_employees_name ON company_employees(full_name);
CREATE INDEX idx_employees_title ON company_employees(current_title);
CREATE INDEX idx_employees_is_leadership ON company_employees(is_leadership) WHERE is_leadership = TRUE;
CREATE INDEX idx_employees_is_executive ON company_employees(is_executive) WHERE is_executive = TRUE;
CREATE INDEX idx_employees_current ON company_employees(is_current_employee) WHERE is_current_employee = TRUE;
CREATE INDEX idx_employees_linkedin_url ON company_employees(linkedin_url);
```

#### 3. `employee_movement_tracking`
Track when employees change companies (critical for relationship intelligence)

```sql
CREATE TABLE employee_movement_tracking (
  id BIGSERIAL PRIMARY KEY,
  
  -- Employee
  employee_id BIGINT REFERENCES company_employees(id),
  employee_name TEXT NOT NULL,
  employee_linkedin_url TEXT NOT NULL,
  
  -- Movement
  from_company_id BIGINT REFERENCES company_intelligence(id),
  from_company_name TEXT NOT NULL,
  to_company_id BIGINT REFERENCES company_intelligence(id),
  to_company_name TEXT NOT NULL,
  
  -- Position Change
  from_title TEXT,
  to_title TEXT,
  from_department TEXT,
  to_department TEXT,
  
  -- Dates
  left_date DATE,
  joined_date DATE,
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Movement Type
  movement_type TEXT, -- 'promotion' (internal), 'lateral' (internal), 'exit' (left company), 'joined' (joined company)
  is_within_government_ecosystem BOOLEAN DEFAULT FALSE, -- Did they stay in gov contracting?
  
  -- Analysis
  title_level_change TEXT, -- 'promoted', 'lateral', 'demotion'
  salary_band_change TEXT, -- 'likely_increase', 'likely_same', 'likely_decrease' (heuristic)
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_movement_employee ON employee_movement_tracking(employee_id);
CREATE INDEX idx_movement_from_company ON employee_movement_tracking(from_company_id);
CREATE INDEX idx_movement_to_company ON employee_movement_tracking(to_company_id);
CREATE INDEX idx_movement_detected ON employee_movement_tracking(detected_at DESC);
CREATE INDEX idx_movement_type ON employee_movement_tracking(movement_type);
```

#### 4. `company_website_data`
Stores scraped data from company websites

```sql
CREATE TABLE company_website_data (
  id BIGSERIAL PRIMARY KEY,
  
  -- Link to Company
  company_intelligence_id BIGINT REFERENCES company_intelligence(id),
  company_name TEXT NOT NULL,
  website_url TEXT NOT NULL,
  
  -- Website Structure
  homepage_url TEXT,
  about_url TEXT,
  team_url TEXT,
  leadership_url TEXT,
  contact_url TEXT,
  careers_url TEXT,
  news_url TEXT,
  
  -- Scraped Content
  about_text TEXT, -- Full about page text
  mission_statement TEXT,
  company_description TEXT,
  
  -- Leadership (scraped from website)
  leadership_team JSONB, -- Array of {name, title, bio, photo_url, email, linkedin_url}
  executive_count INTEGER,
  board_members JSONB, -- Array of board members
  
  -- Contact Info
  general_email TEXT,
  general_phone TEXT,
  sales_email TEXT,
  careers_email TEXT,
  press_email TEXT,
  
  -- Email Patterns (inferred)
  email_pattern TEXT, -- 'first.last@', 'firstl@', 'flast@', 'first@'
  common_email_domains TEXT[], -- ['company.com', 'company.co']
  discovered_emails TEXT[], -- All emails found on site
  
  -- Office Locations
  office_locations JSONB, -- Array of {address, city, state, zip, country, type, phone}
  office_count INTEGER,
  
  -- Certifications & Credentials
  certifications TEXT[], -- ISO, CMMI, etc.
  security_clearances TEXT[], -- 'Secret', 'Top Secret', 'TS/SCI'
  duns_number TEXT,
  cage_code TEXT,
  
  -- Capabilities & Services
  service_offerings TEXT[], -- Parsed from site
  capabilities TEXT[],
  past_performance TEXT[], -- Project descriptions/case studies
  
  -- Technologies Used (detected)
  tech_stack JSONB, -- {frontend: [], backend: [], hosting: [], analytics: []}
  
  -- Social Links
  linkedin_url TEXT,
  twitter_url TEXT,
  facebook_url TEXT,
  youtube_url TEXT,
  github_url TEXT,
  
  -- SEO & Metadata
  meta_title TEXT,
  meta_description TEXT,
  meta_keywords TEXT[],
  
  -- Data Quality
  scrape_depth INTEGER, -- How many pages scraped
  content_richness_score INTEGER, -- 0-100
  
  -- Scraping Metadata
  last_scraped TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  scrape_success BOOLEAN DEFAULT TRUE,
  scrape_error TEXT,
  scrape_duration_seconds INTEGER,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_website_company_id ON company_website_data(company_intelligence_id);
CREATE INDEX idx_website_url ON company_website_data(website_url);
CREATE INDEX idx_website_last_scraped ON company_website_data(last_scraped);
```

#### 5. `scraper_queue`
Manages scraping queue with priority

```sql
CREATE TABLE company_scraper_queue (
  id BIGSERIAL PRIMARY KEY,
  
  -- Target Company
  company_intelligence_id BIGINT REFERENCES company_intelligence(id),
  company_name TEXT NOT NULL,
  website_url TEXT,
  linkedin_url TEXT,
  
  -- Scrape Type
  scrape_type TEXT NOT NULL, -- 'full', 'linkedin_only', 'website_only', 'refresh'
  
  -- Priority (1-10, 10=highest)
  priority INTEGER DEFAULT 5,
  priority_reason TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'failed', 'skipped'
  
  -- Progress Tracking
  linkedin_scraped BOOLEAN DEFAULT FALSE,
  linkedin_employees_scraped BOOLEAN DEFAULT FALSE,
  website_scraped BOOLEAN DEFAULT FALSE,
  
  -- Results
  linkedin_profile_id BIGINT,
  website_data_id BIGINT,
  employees_found INTEGER DEFAULT 0,
  
  -- Error Handling
  attempt_count INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  last_error TEXT,
  last_attempted_at TIMESTAMP WITH TIME ZONE,
  
  -- Rate Limiting
  next_attempt_after TIMESTAMP WITH TIME ZONE,
  backoff_seconds INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_scraper_queue_status ON company_scraper_queue(status);
CREATE INDEX idx_scraper_queue_priority ON company_scraper_queue(priority DESC, created_at);
CREATE INDEX idx_scraper_queue_next_attempt ON company_scraper_queue(next_attempt_after);
CREATE INDEX idx_scraper_queue_company_id ON company_scraper_queue(company_intelligence_id);
```

#### 6. `scraper_run_log`
Tracks scraper runs

```sql
CREATE TABLE company_scraper_run_log (
  id BIGSERIAL PRIMARY KEY,
  
  -- Run Type
  run_type TEXT NOT NULL, -- 'historical', 'daily', 'manual', 'priority'
  scrape_type TEXT NOT NULL, -- 'full', 'linkedin_only', 'website_only'
  
  -- Stats
  total_companies_queued INTEGER DEFAULT 0,
  companies_scraped INTEGER DEFAULT 0,
  companies_successful INTEGER DEFAULT 0,
  companies_failed INTEGER DEFAULT 0,
  companies_skipped INTEGER DEFAULT 0,
  
  linkedin_profiles_created INTEGER DEFAULT 0,
  employees_discovered INTEGER DEFAULT 0,
  employees_created INTEGER DEFAULT 0,
  websites_scraped INTEGER DEFAULT 0,
  
  -- Performance
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  avg_scrape_time_seconds DECIMAL(10,2),
  
  -- Status
  status TEXT DEFAULT 'running', -- 'running', 'completed', 'failed', 'paused'
  
  -- Errors
  error_count INTEGER DEFAULT 0,
  errors JSONB, -- Array of error details
  
  -- Trigger Info
  triggered_by TEXT, -- 'cron', 'admin_ui', 'api', 'github_action'
  trigger_user_id UUID,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_scraper_log_run_type ON company_scraper_run_log(run_type);
CREATE INDEX idx_scraper_log_started_at ON company_scraper_run_log(started_at DESC);
CREATE INDEX idx_scraper_log_status ON company_scraper_run_log(status);
```

---

## Part 2: Scraper Architecture

### Technology Stack

**Language**: Python (best for web scraping)
**Key Libraries**:
- `playwright` or `selenium` - Browser automation for JavaScript-heavy sites
- `beautifulsoup4` - HTML parsing
- `scrapy` - (optional) For large-scale structured scraping
- `requests` - HTTP requests
- `supabase-py` - Database operations
- `fake-useragent` - Randomize user agents
- `python-dotenv` - Environment management

### Anti-Bot Measures

LinkedIn and many corporate sites have anti-scraping protections. Here's how we handle it:

#### Option 1: Stealth Scraping (Recommended for Historical)
- Use `playwright` with stealth mode
- Rotate user agents
- Add random delays between requests (2-5 seconds)
- Respect robots.txt
- Implement exponential backoff on failures
- Use residential proxies if needed (Bright Data, Oxylabs)

#### Option 2: LinkedIn API (Limited)
- Official LinkedIn API is very restricted
- Requires company approval
- Limited to 100 requests/day on free tier
- Only basic company info, no employee lists

#### Option 3: Hybrid Approach (Best)
- Use Bright Data's LinkedIn Scraper API for company profiles
- Use Playwright for company websites (easier to scrape)
- Build our own stealth scraper with heavy rate limiting
- Fallback to manual enrichment for high-priority targets

### Rate Limiting Strategy

#### LinkedIn:
- Max 1 request per 3-5 seconds
- Max 200 profiles per day per IP
- Use proxy rotation for larger volume
- Implement smart scheduling (spread over weeks)

#### Company Websites:
- Max 1 request per 1-2 seconds per domain
- Respect `robots.txt`
- Max 10 pages deep per website
- Timeout after 30 seconds per page

### Error Handling

```python
# Retry logic with exponential backoff
MAX_RETRIES = 3
BACKOFF_FACTOR = 2

def scrape_with_retry(url, max_retries=MAX_RETRIES):
    for attempt in range(max_retries):
        try:
            response = scrape(url)
            return response
        except (ConnectionError, TimeoutError, RateLimitError) as e:
            if attempt < max_retries - 1:
                wait_time = BACKOFF_FACTOR ** attempt
                time.sleep(wait_time)
                log_error(f"Retry {attempt + 1} for {url}")
            else:
                log_error(f"Failed after {max_retries} attempts: {url}")
                raise
```

---

## Part 3: Historical Scraper Implementation

### Phase 3A: Company Prioritization

Not all 350K companies are equal. Prioritize by:

1. **Contract Value** (high = urgent)
   - Companies with >$10M total contracts: Priority 10
   - Companies with >$1M total contracts: Priority 8
   - Companies with >$100K total contracts: Priority 6
   - Rest: Priority 3

2. **Recent Activity** (active = urgent)
   - Contracts in last 6 months: +2 priority
   - Contracts in last 30 days: +3 priority

3. **Data Completeness** (gaps = urgent)
   - Missing employee count: +1 priority
   - Missing website: +1 priority
   - Missing headquarters: +1 priority

4. **Strategic Value**
   - Small businesses: +2 priority (more trackable)
   - Public companies: +1 priority (more data available)
   - Defense contractors: +2 priority

### Phase 3B: Queue Building Script

```python
# scripts/build-historical-scraper-queue.py

import asyncio
from supabase import create_client

async def build_scraper_queue():
    """
    Build prioritized queue of companies to scrape
    """
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    # Get all unique companies from all sources
    companies = await get_all_unique_companies(supabase)
    
    print(f"Found {len(companies)} unique companies")
    
    queue_items = []
    
    for company in companies:
        # Calculate priority
        priority = calculate_priority(company)
        
        # Skip if already scraped recently
        if company.get('last_scraped'):
            days_since_scrape = (datetime.now() - company['last_scraped']).days
            if days_since_scrape < 90:  # Skip if scraped in last 90 days
                continue
        
        queue_items.append({
            'company_intelligence_id': company['id'],
            'company_name': company['name'],
            'website_url': company.get('website'),
            'linkedin_url': company.get('linkedin_url'),
            'scrape_type': 'full',
            'priority': priority,
            'priority_reason': get_priority_reason(company, priority),
            'status': 'pending'
        })
    
    # Insert in batches
    batch_size = 1000
    for i in range(0, len(queue_items), batch_size):
        batch = queue_items[i:i+batch_size]
        supabase.table('company_scraper_queue').insert(batch).execute()
        print(f"Inserted batch {i//batch_size + 1}: {len(batch)} items")
    
    print(f"Queue built with {len(queue_items)} companies")

def calculate_priority(company):
    priority = 5  # Base priority
    
    # Contract value
    total_value = company.get('total_contract_value', 0)
    if total_value > 10_000_000:
        priority = 10
    elif total_value > 1_000_000:
        priority = 8
    elif total_value > 100_000:
        priority = 6
    
    # Recent activity
    if company.get('most_recent_contract_date'):
        days_since = (datetime.now() - company['most_recent_contract_date']).days
        if days_since < 30:
            priority += 3
        elif days_since < 180:
            priority += 2
    
    # Data completeness
    if not company.get('employee_count'):
        priority += 1
    if not company.get('website'):
        priority -= 1  # Lower priority if no website
    
    # Strategic value
    if company.get('is_small_business'):
        priority += 2
    if company.get('is_public_company'):
        priority += 1
    
    return min(priority, 10)  # Cap at 10

def get_all_unique_companies(supabase):
    """
    Get all unique companies from all tables
    """
    # Query company_intelligence first (main source of truth)
    companies = supabase.table('company_intelligence').select('*').execute().data
    
    # TODO: Merge with companies from other tables (fpds, gsa, etc.)
    # Use UEI/DUNS for matching
    
    return companies
```

### Phase 3C: LinkedIn Scraper

```python
# scrapers/linkedin_scraper.py

from playwright.async_api import async_playwright
import random
import time

class LinkedInScraper:
    def __init__(self):
        self.browser = None
        self.context = None
        self.page = None
        
    async def init_browser(self):
        """Initialize stealth browser"""
        playwright = await async_playwright().start()
        self.browser = await playwright.chromium.launch(
            headless=True,
            args=[
                '--disable-blink-features=AutomationControlled',
                '--disable-dev-shm-usage',
                '--no-sandbox'
            ]
        )
        
        # Create context with realistic settings
        self.context = await self.browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        )
        
        self.page = await self.context.new_page()
        
    async def scrape_company_profile(self, linkedin_url):
        """
        Scrape LinkedIn company profile
        """
        try:
            await self.page.goto(linkedin_url, wait_until='domcontentloaded')
            
            # Wait for content to load
            await self.page.wait_for_selector('.org-top-card', timeout=10000)
            
            # Extract company info
            company_data = {
                'linkedin_url': linkedin_url,
                'company_name': await self.extract_text('.org-top-card-summary__title'),
                'tagline': await self.extract_text('.org-top-card-summary__tagline'),
                'description': await self.extract_text('.org-about-us-organization-description__text'),
                'website': await self.extract_attribute('.org-top-card-primary-actions__inner a', 'href'),
                'industry': await self.extract_text('.org-top-card-summary-info-list__info-item:nth-child(1)'),
                'company_size': await self.extract_text('.org-top-card-summary-info-list__info-item:nth-child(2)'),
                'headquarters': await self.extract_text('.org-top-card-summary-info-list__info-item:nth-child(3)'),
                'follower_count': await self.extract_follower_count(),
            }
            
            # Parse company size
            company_data['company_size_min'], company_data['company_size_max'] = \
                parse_company_size(company_data['company_size'])
            
            # Add random delay (anti-bot)
            await asyncio.sleep(random.uniform(2, 5))
            
            return company_data
            
        except Exception as e:
            print(f"Error scraping {linkedin_url}: {e}")
            return None
    
    async def scrape_employees(self, company_linkedin_url, max_employees=100):
        """
        Scrape employees from company page
        This is the hard part - LinkedIn heavily protects this
        """
        # Navigate to people page
        people_url = f"{company_linkedin_url}/people/"
        await self.page.goto(people_url)
        
        employees = []
        
        # Scroll to load more (lazy loading)
        for i in range(10):  # Scroll 10 times
            await self.page.evaluate('window.scrollTo(0, document.body.scrollHeight)')
            await asyncio.sleep(random.uniform(1, 2))
        
        # Extract visible employees
        employee_cards = await self.page.query_selector_all('.org-people-profile-card')
        
        for card in employee_cards[:max_employees]:
            try:
                employee = {
                    'name': await card.query_selector('.org-people-profile-card__profile-title').inner_text(),
                    'title': await card.query_selector('.org-people-profile-card__profile-info-item').inner_text(),
                    'linkedin_url': await card.query_selector('a').get_attribute('href'),
                }
                employees.append(employee)
            except:
                continue
        
        return employees
    
    async def extract_text(self, selector):
        """Helper to extract text from selector"""
        try:
            element = await self.page.query_selector(selector)
            if element:
                return await element.inner_text()
        except:
            pass
        return None
    
    async def extract_attribute(self, selector, attribute):
        """Helper to extract attribute from selector"""
        try:
            element = await self.page.query_selector(selector)
            if element:
                return await element.get_attribute(attribute)
        except:
            pass
        return None
    
    async def extract_follower_count(self):
        """Extract follower count"""
        try:
            text = await self.extract_text('.org-top-card-summary-info-list__info-item:last-child')
            if text and 'followers' in text.lower():
                # Parse number (e.g., "12,345 followers" -> 12345)
                return int(text.split()[0].replace(',', ''))
        except:
            pass
        return None
    
    async def close(self):
        """Close browser"""
        if self.browser:
            await self.browser.close()
```

### Phase 3D: Company Website Scraper

```python
# scrapers/website_scraper.py

import requests
from bs4 import BeautifulSoup
import re
from urllib.parse import urljoin, urlparse

class WebsiteScraper:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        })
    
    def scrape_company_website(self, website_url, max_depth=3):
        """
        Scrape company website for leadership, emails, etc.
        """
        data = {
            'website_url': website_url,
            'leadership_team': [],
            'discovered_emails': [],
            'office_locations': [],
            'social_links': {},
            'contact_info': {},
        }
        
        try:
            # Scrape homepage
            homepage = self.fetch_page(website_url)
            if not homepage:
                return None
            
            # Find key pages
            about_url = self.find_page_url(homepage, website_url, ['about', 'company', 'who-we-are'])
            team_url = self.find_page_url(homepage, website_url, ['team', 'leadership', 'management', 'our-team'])
            contact_url = self.find_page_url(homepage, website_url, ['contact', 'contact-us'])
            
            # Scrape each page
            if about_url:
                about_data = self.scrape_about_page(about_url)
                data.update(about_data)
            
            if team_url:
                team_data = self.scrape_team_page(team_url)
                data['leadership_team'] = team_data.get('leadership', [])
            
            if contact_url:
                contact_data = self.scrape_contact_page(contact_url)
                data['contact_info'] = contact_data
            
            # Extract emails from all pages
            data['discovered_emails'] = self.extract_emails(homepage)
            if about_url:
                data['discovered_emails'] += self.extract_emails(self.fetch_page(about_url))
            if contact_url:
                data['discovered_emails'] += self.extract_emails(self.fetch_page(contact_url))
            
            # Deduplicate
            data['discovered_emails'] = list(set(data['discovered_emails']))
            
            # Infer email pattern
            data['email_pattern'] = self.infer_email_pattern(data['discovered_emails'])
            
            # Extract social links
            data['social_links'] = self.extract_social_links(homepage)
            
            return data
            
        except Exception as e:
            print(f"Error scraping {website_url}: {e}")
            return None
    
    def fetch_page(self, url):
        """Fetch page HTML"""
        try:
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            return BeautifulSoup(response.text, 'html.parser')
        except:
            return None
    
    def find_page_url(self, soup, base_url, keywords):
        """Find URL containing keywords"""
        for link in soup.find_all('a', href=True):
            href = link['href'].lower()
            if any(keyword in href for keyword in keywords):
                return urljoin(base_url, link['href'])
        return None
    
    def scrape_team_page(self, team_url):
        """Scrape team/leadership page"""
        soup = self.fetch_page(team_url)
        if not soup:
            return {}
        
        leadership = []
        
        # Common patterns for team members
        # Pattern 1: <div class="team-member">
        team_members = soup.find_all(['div', 'article'], class_=re.compile(r'team|member|person|executive|leader'))
        
        for member in team_members:
            person = {}
            
            # Extract name
            name_elem = member.find(['h2', 'h3', 'h4', 'p'], class_=re.compile(r'name|title'))
            if name_elem:
                person['name'] = name_elem.get_text(strip=True)
            
            # Extract title
            title_elem = member.find(['p', 'span', 'div'], class_=re.compile(r'title|position|role'))
            if title_elem:
                person['title'] = title_elem.get_text(strip=True)
            
            # Extract bio
            bio_elem = member.find(['p', 'div'], class_=re.compile(r'bio|description|about'))
            if bio_elem:
                person['bio'] = bio_elem.get_text(strip=True)
            
            # Extract email
            email_link = member.find('a', href=re.compile(r'mailto:'))
            if email_link:
                person['email'] = email_link['href'].replace('mailto:', '')
            
            # Extract LinkedIn
            linkedin_link = member.find('a', href=re.compile(r'linkedin.com'))
            if linkedin_link:
                person['linkedin_url'] = linkedin_link['href']
            
            if person.get('name'):
                leadership.append(person)
        
        return {'leadership': leadership}
    
    def scrape_about_page(self, about_url):
        """Scrape about page"""
        soup = self.fetch_page(about_url)
        if not soup:
            return {}
        
        # Extract main content
        content = soup.find(['div', 'article', 'section'], class_=re.compile(r'content|about|main'))
        
        return {
            'about_text': content.get_text(strip=True) if content else None,
            'about_url': about_url
        }
    
    def scrape_contact_page(self, contact_url):
        """Scrape contact page"""
        soup = self.fetch_page(contact_url)
        if not soup:
            return {}
        
        contact_info = {}
        
        # Extract phone
        phone_pattern = re.compile(r'\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}')
        phone_match = phone_pattern.search(soup.get_text())
        if phone_match:
            contact_info['phone'] = phone_match.group()
        
        # Extract email
        emails = self.extract_emails(soup)
        if emails:
            contact_info['email'] = emails[0]
        
        return contact_info
    
    def extract_emails(self, soup):
        """Extract all emails from page"""
        if not soup:
            return []
        
        email_pattern = re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b')
        text = soup.get_text()
        emails = email_pattern.findall(text)
        
        # Filter out common junk emails
        junk = ['example.com', 'domain.com', 'email.com', 'yourcompany.com']
        emails = [e for e in emails if not any(j in e for j in junk)]
        
        return emails
    
    def infer_email_pattern(self, emails):
        """Infer email pattern from discovered emails"""
        if not emails:
            return None
        
        # Common patterns:
        # first.last@domain.com
        # firstlast@domain.com
        # flast@domain.com
        # first_last@domain.com
        
        # This is heuristic - would need more sophisticated logic
        patterns = {}
        for email in emails:
            local = email.split('@')[0]
            if '.' in local:
                patterns['first.last'] = patterns.get('first.last', 0) + 1
            elif '_' in local:
                patterns['first_last'] = patterns.get('first_last', 0) + 1
            elif len(local.split()) == 1:
                if len(local) > 10:
                    patterns['firstlast'] = patterns.get('firstlast', 0) + 1
                else:
                    patterns['flast'] = patterns.get('flast', 0) + 1
        
        if patterns:
            return max(patterns, key=patterns.get)
        return None
    
    def extract_social_links(self, soup):
        """Extract social media links"""
        if not soup:
            return {}
        
        social = {}
        
        for link in soup.find_all('a', href=True):
            href = link['href']
            if 'linkedin.com/company' in href:
                social['linkedin'] = href
            elif 'twitter.com' in href or 'x.com' in href:
                social['twitter'] = href
            elif 'facebook.com' in href:
                social['facebook'] = href
            elif 'youtube.com' in href:
                social['youtube'] = href
            elif 'github.com' in href:
                social['github'] = href
        
        return social
```

### Phase 3E: Main Historical Scraper Orchestrator

```python
# scrapers/historical_scraper.py

import asyncio
from linkedin_scraper import LinkedInScraper
from website_scraper import WebsiteScraper
from supabase import create_client
import time

class HistoricalScraper:
    def __init__(self):
        self.supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        self.linkedin_scraper = None
        self.website_scraper = WebsiteScraper()
        
    async def run(self, batch_size=10, max_per_day=200):
        """
        Run historical scraper
        """
        # Initialize scrapers
        self.linkedin_scraper = LinkedInScraper()
        await self.linkedin_scraper.init_browser()
        
        # Create run log
        run_log = self.supabase.table('company_scraper_run_log').insert({
            'run_type': 'historical',
            'scrape_type': 'full',
            'status': 'running'
        }).execute().data[0]
        
        run_id = run_log['id']
        
        try:
            total_scraped = 0
            
            while total_scraped < max_per_day:
                # Get next batch from queue (highest priority first)
                queue_items = self.supabase.table('company_scraper_queue') \
                    .select('*') \
                    .eq('status', 'pending') \
                    .order('priority', desc=True) \
                    .order('created_at', asc=True) \
                    .limit(batch_size) \
                    .execute().data
                
                if not queue_items:
                    print("Queue empty!")
                    break
                
                # Process batch
                for item in queue_items:
                    await self.process_company(item)
                    total_scraped += 1
                    
                    # Update run log
                    self.supabase.table('company_scraper_run_log') \
                        .update({'companies_scraped': total_scraped}) \
                        .eq('id', run_id) \
                        .execute()
                    
                    # Respect rate limits
                    await asyncio.sleep(5)  # 5 seconds between companies
                
                print(f"Batch complete. Total scraped: {total_scraped}")
            
            # Complete run
            self.supabase.table('company_scraper_run_log') \
                .update({'status': 'completed', 'completed_at': 'now()'}) \
                .eq('id', run_id) \
                .execute()
            
            print(f"Historical scraper completed. Total: {total_scraped} companies")
            
        except Exception as e:
            print(f"Error: {e}")
            self.supabase.table('company_scraper_run_log') \
                .update({'status': 'failed', 'errors': [str(e)]}) \
                .eq('id', run_id) \
                .execute()
        
        finally:
            await self.linkedin_scraper.close()
    
    async def process_company(self, queue_item):
        """
        Process a single company
        """
        company_id = queue_item['company_intelligence_id']
        company_name = queue_item['company_name']
        
        print(f"Processing: {company_name}")
        
        # Mark as in progress
        self.supabase.table('company_scraper_queue') \
            .update({'status': 'in_progress', 'started_at': 'now()'}) \
            .eq('id', queue_item['id']) \
            .execute()
        
        results = {
            'linkedin_scraped': False,
            'website_scraped': False,
            'employees_found': 0
        }
        
        try:
            # Scrape LinkedIn
            if queue_item.get('linkedin_url'):
                linkedin_data = await self.linkedin_scraper.scrape_company_profile(
                    queue_item['linkedin_url']
                )
                
                if linkedin_data:
                    # Save to database
                    linkedin_profile = self.supabase.table('company_linkedin_profiles') \
                        .insert({
                            'company_intelligence_id': company_id,
                            'company_name': company_name,
                            **linkedin_data
                        }) \
                        .execute().data[0]
                    
                    results['linkedin_scraped'] = True
                    results['linkedin_profile_id'] = linkedin_profile['id']
                    
                    # Scrape employees (limited to 50 for historical)
                    employees = await self.linkedin_scraper.scrape_employees(
                        queue_item['linkedin_url'],
                        max_employees=50
                    )
                    
                    if employees:
                        # Save employees
                        for emp in employees:
                            self.supabase.table('company_employees').insert({
                                'company_intelligence_id': company_id,
                                'linkedin_profile_id': linkedin_profile['id'],
                                'company_name': company_name,
                                'full_name': emp['name'],
                                'current_title': emp['title'],
                                'linkedin_url': emp['linkedin_url'],
                                'is_current_employee': True
                            }).execute()
                        
                        results['employees_found'] = len(employees)
                        results['linkedin_employees_scraped'] = True
            
            # Scrape Website
            if queue_item.get('website_url'):
                website_data = self.website_scraper.scrape_company_website(
                    queue_item['website_url']
                )
                
                if website_data:
                    # Save to database
                    website_record = self.supabase.table('company_website_data') \
                        .insert({
                            'company_intelligence_id': company_id,
                            'company_name': company_name,
                            **website_data
                        }) \
                        .execute().data[0]
                    
                    results['website_scraped'] = True
                    results['website_data_id'] = website_record['id']
            
            # Mark as completed
            self.supabase.table('company_scraper_queue') \
                .update({
                    'status': 'completed',
                    'completed_at': 'now()',
                    **results
                }) \
                .eq('id', queue_item['id']) \
                .execute()
            
            print(f"✓ {company_name}: LinkedIn={results['linkedin_scraped']}, Website={results['website_scraped']}, Employees={results['employees_found']}")
            
        except Exception as e:
            print(f"✗ {company_name}: {e}")
            
            # Mark as failed
            self.supabase.table('company_scraper_queue') \
                .update({
                    'status': 'failed',
                    'last_error': str(e),
                    'attempt_count': queue_item['attempt_count'] + 1,
                    'last_attempted_at': 'now()'
                }) \
                .eq('id', queue_item['id']) \
                .execute()

# Run script
if __name__ == '__main__':
    scraper = HistoricalScraper()
    asyncio.run(scraper.run(batch_size=10, max_per_day=200))
```

---

## Part 4: Daily Incremental Scraper (GitHub Action)

### GitHub Action Workflow

```yaml
# .github/workflows/daily-company-scraper.yml

name: Daily Company Enrichment Scraper

on:
  schedule:
    # Run every day at 2 AM UTC
    - cron: '0 2 * * *'
  workflow_dispatch:  # Allow manual trigger

jobs:
  scrape-companies:
    runs-on: ubuntu-latest
    timeout-minutes: 360  # 6 hours max
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: |
          pip install -r requirements-scraper.txt
          playwright install chromium
      
      - name: Run daily scraper
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
          PROXY_URL: ${{ secrets.PROXY_URL }}  # Optional
        run: |
          python scrapers/daily_scraper.py
      
      - name: Upload logs
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: scraper-logs
          path: logs/
```

### Daily Scraper Script

```python
# scrapers/daily_scraper.py

"""
Daily incremental scraper
- Scrapes newly added companies
- Updates companies not scraped in 90+ days
- Detects employee movement
"""

import asyncio
from historical_scraper import HistoricalScraper

async def run_daily_scraper():
    scraper = HistoricalScraper()
    
    # Priority 1: New companies (added in last 24 hours)
    new_companies = scraper.supabase.table('company_scraper_queue') \
        .select('*') \
        .eq('status', 'pending') \
        .gte('created_at', 'now() - interval \'1 day\'') \
        .execute().data
    
    print(f"Found {len(new_companies)} new companies to scrape")
    
    # Priority 2: Stale companies (not updated in 90 days)
    stale_companies = scraper.supabase.table('company_linkedin_profiles') \
        .select('company_intelligence_id, company_name') \
        .lte('last_scraped', 'now() - interval \'90 days\'') \
        .limit(20) \
        .execute().data
    
    print(f"Found {len(stale_companies)} stale companies to refresh")
    
    # Add stale companies to queue
    for company in stale_companies:
        scraper.supabase.table('company_scraper_queue').insert({
            'company_intelligence_id': company['company_intelligence_id'],
            'company_name': company['company_name'],
            'scrape_type': 'refresh',
            'priority': 6,
            'status': 'pending'
        }).execute()
    
    # Run scraper (max 100 per day for daily run)
    await scraper.run(batch_size=10, max_per_day=100)
    
    print("Daily scraper completed!")

if __name__ == '__main__':
    asyncio.run(run_daily_scraper())
```

---

## Part 5: Implementation Timeline

### Week 1-2: Database & Infrastructure
- ✓ Create database tables
- ✓ Set up scraper queue
- ✓ Build prioritization logic
- ✓ Test database connections

### Week 3-4: LinkedIn Scraper
- Build LinkedIn scraper with Playwright
- Implement anti-bot measures
- Test on 100 companies
- Add rate limiting
- Handle errors gracefully

### Week 5-6: Website Scraper
- Build website scraper
- Implement email extraction
- Build leadership page parser
- Test on 100 companies
- Handle edge cases

### Week 7-8: Historical Orchestrator
- Build queue processor
- Implement batch processing
- Add logging and monitoring
- Test on 1,000 companies
- Optimize performance

### Week 9-10: Testing & Optimization
- Run historical scraper on 10K companies
- Monitor success rates
- Fix bugs and edge cases
- Optimize scraping speed
- Implement proxy rotation if needed

### Week 11-12: Daily Scraper
- Build daily incremental scraper
- Set up GitHub Action
- Test daily runs
- Monitor for failures
- Build alerting

### Week 13+: Production
- Run full historical scraper (350K companies)
- This will take 3-6 months at 200/day
- Monitor daily runs
- Continuously improve

---

## Part 6: Cost Estimates

### Infrastructure
- **Proxy Services** (optional): $50-200/month
  - Bright Data: $500/month for unlimited
  - SmartProxy: $75/month for 5GB
  - ScraperAPI: $29-149/month

- **Computing**: $0 (GitHub Actions free tier: 2,000 min/month)

- **Storage**: ~$5/month (350K companies x 10KB avg = 3.5GB)

### Total: $0-250/month (vs $60K/year for Crunchbase)

---

## Part 7: Legal & Ethical Considerations

### Legal Compliance
1. **Robots.txt**: Respect all robots.txt files
2. **Terms of Service**: LinkedIn TOS prohibits scraping
   - Use at your own risk
   - Consider official API for critical data
   - Use proxy services that handle legal liability

3. **GDPR/Privacy**: 
   - All data is publicly available
   - No personal data storage (only professional info)
   - Provide opt-out mechanism

### Best Practices
- Respect rate limits
- Don't overload servers
- Provide User-Agent identification
- Honor opt-out requests
- Be transparent about data usage

---

## Part 8: Success Metrics

### Data Quality KPIs
- LinkedIn profile match rate: >70%
- Employee discovery rate: >50 employees per company (avg)
- Website scrape success rate: >80%
- Email discovery rate: >60%
- Leadership identification: >80%

### Coverage KPIs
- Companies enriched: 350K (100% coverage)
- Companies with employee data: >200K (57%)
- Companies with leadership data: >150K (43%)
- Employee movement tracking: >10K movements/year

### Operational KPIs
- Daily scraper success rate: >95%
- Average scrape time: <30 seconds per company
- Error rate: <5%
- Queue processing time: <24 hours for priority items

---

## Next Steps

1. **Review & Approve Plan** ✓ (you're reading it!)
2. **Create Database Tables** - Run SQL migrations
3. **Build Historical Scraper** - Start with LinkedIn scraper
4. **Test on 100 Companies** - Validate approach
5. **Scale to 10K Companies** - Iron out issues
6. **Deploy Daily Scraper** - Set up GitHub Action
7. **Run Full Historical Scrape** - 3-6 months for 350K companies

**Ready to build?** Let's start with the database tables!


