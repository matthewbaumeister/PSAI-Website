# DoD Military News Scraper - Comprehensive Plan

## Overview
Build a comprehensive scraper to track ALL publicly available military and DoD news including:
- DoD contracting data and awards announcements
- Change of command ceremonies
- Promotions and promotion lists (general/flag officers and all ranks)
- Unit placements and deployments
- Personnel movements and assignments
- Training exercises and events
- Military operations and activities
- Equipment and technology developments
- Policy announcements
- Budget and appropriations news

## Data Sources

### 1. Official DoD Sources
#### Defense.gov
- **URL**: https://www.defense.gov/News/
- **RSS Feeds**: https://www.defense.gov/DesktopModules/ArticleCS/RSS.ashx?ContentType=1&Site=945
- **Content**: Official DoD press releases, contract awards, transcripts, advisories
- **Daily Contract Awards**: Published daily around 5 PM EST
- **API Access**: RSS feeds available
- **Historical Data**: Archives available going back years

#### DVIDS (Defense Visual Information Distribution Service)
- **URL**: https://www.dvidshub.net/
- **API**: https://www.dvidshub.net/api (documented API available)
- **Content**: Unit-level news, photos, videos, graphics from all military units worldwide
- **Coverage**: Comprehensive coverage of all services and components
- **API Features**:
  - Unit search
  - News stories search
  - Image/video metadata
  - Geographic tagging
  - Unit identification
- **Historical Data**: Extensive archives

### 2. Military Times Properties (Same parent company - Sightline Media Group)
#### Army Times
- **URL**: https://www.armytimes.com/
- **Sections**:
  - News > Your Army
  - Careers
  - Pay & Benefits
  - Education & Transition
- **Content**: Personnel news, promotions, assignments, policy changes

#### Navy Times
- **URL**: https://www.navytimes.com/
- **Coverage**: Navy and Coast Guard personnel news

#### Air Force Times
- **URL**: https://www.airforcetimes.com/
- **Coverage**: Air Force and Space Force news

#### Marine Corps Times
- **URL**: https://www.marinecorpstimes.com/
- **Coverage**: Marine Corps personnel and operations news

#### Military Times
- **URL**: https://www.militarytimes.com/
- **Coverage**: Cross-service news, benefits, veterans

**Scraping Strategy for Military Times Properties**:
- Check for RSS feeds: `/arc/outboundfeeds/rss/`
- Sitemap: `/sitemap.xml`
- URL pattern: `/{outlet}/news/{year}/{month}/{day}/{slug}/`
- Historical access via URL manipulation
- Rate limiting: 1-2 seconds between requests
- User-Agent: Standard browser UA

### 3. Service-Specific Official Sources

#### U.S. Army
- **Army.mil**: https://www.army.mil/news/
- **RSS**: Multiple feeds by topic
- **Content**: Official Army news, assignments, promotions
- **Army Human Resources Command**: https://www.hrc.army.mil/
  - Promotion lists
  - Assignment orders (redacted public versions)

#### U.S. Navy
- **Navy.mil**: https://www.navy.mil/Press-Office/News-Stories/
- **RSS**: Available
- **Content**: Fleet news, assignments, change of commands
- **Naval Personnel Command**: https://www.mynavyhr.navy.mil/
  - Promotion results
  - Selection boards

#### U.S. Air Force
- **AF.mil**: https://www.af.mil/News/
- **RSS**: Available
- **Content**: Air Force news, assignments, promotions
- **Air Force Personnel Center**: https://www.afpc.af.mil/
  - Promotion statistics
  - Assignment information

#### U.S. Marine Corps
- **Marines.mil**: https://www.marines.mil/News/
- **RSS**: Available
- **Content**: Marine Corps news, operations, training

#### U.S. Space Force
- **SpaceForce.mil**: https://www.spaceforce.mil/News/
- **Content**: Space Force operations, personnel, technology

#### U.S. Coast Guard
- **USCG.mil**: https://www.uscg.mil/News/
- **Content**: Coast Guard operations, personnel

### 4. Additional Important Sources

#### Military.com
- **URL**: https://www.military.com/daily-news
- **Content**: Independent military news, benefits, transition
- **Value**: Good aggregator of personnel news

#### Defense News
- **URL**: https://www.defensenews.com/
- **Content**: Industry news, procurement, policy
- **RSS**: Available

#### Stars and Stripes
- **URL**: https://www.stripes.com/
- **Content**: Independent military news organization
- **Coverage**: News from military communities worldwide

#### C4ISRNET
- **URL**: https://www.c4isrnet.com/
- **Content**: Command, control, communications, computers, cyber

#### Federal News Network
- **URL**: https://federalnewsnetwork.com/category/defense-main/
- **Content**: Federal workforce including DoD civilians

## Database Schema Design

### Main Tables

#### 1. `military_news_articles`
Core table for all military news articles from all sources.

```sql
CREATE TABLE military_news_articles (
  id BIGSERIAL PRIMARY KEY,
  
  -- Source identification
  source TEXT NOT NULL, -- 'defense.gov', 'army.mil', 'armytimes', 'dvids', etc.
  source_category TEXT, -- 'official_dod', 'service_branch', 'military_times', 'dvids', 'independent'
  article_url TEXT UNIQUE NOT NULL,
  article_id TEXT, -- Source's internal ID if available
  
  -- Article metadata
  title TEXT NOT NULL,
  subtitle TEXT,
  author TEXT,
  byline TEXT,
  
  -- Content
  summary TEXT,
  content TEXT NOT NULL, -- Full article text
  raw_html TEXT, -- Original HTML for re-parsing
  
  -- Dates
  published_date TIMESTAMPTZ NOT NULL,
  updated_date TIMESTAMPTZ,
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  last_checked_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Classification (can be multiple)
  article_types TEXT[], -- ['contract_award', 'promotion', 'change_of_command', 'training_exercise', etc.]
  primary_article_type TEXT,
  
  -- Service/Component
  service_branches TEXT[], -- ['army', 'navy', 'air_force', 'marine_corps', 'space_force', 'coast_guard']
  primary_service_branch TEXT,
  dod_components TEXT[], -- ['DARPA', 'DLA', 'DISA', etc.]
  
  -- Geographic
  locations TEXT[], -- Extracted locations
  primary_location TEXT,
  countries TEXT[],
  states TEXT[],
  bases TEXT[], -- Military installations mentioned
  
  -- Personnel (extracted from content)
  personnel_mentioned TEXT[], -- Names extracted
  ranks_mentioned TEXT[], -- Ranks extracted
  units_mentioned TEXT[], -- Unit names
  
  -- Multimedia
  image_urls TEXT[],
  video_urls TEXT[],
  document_urls TEXT[],
  
  -- Engagement/Metadata
  view_count INTEGER,
  has_comments BOOLEAN DEFAULT FALSE,
  
  -- Full-text search
  search_vector tsvector,
  
  -- Data quality
  extraction_quality_score INTEGER CHECK (extraction_quality_score >= 0 AND extraction_quality_score <= 100),
  needs_review BOOLEAN DEFAULT FALSE,
  reviewed_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 2. `military_contract_awards`
Detailed contract award information extracted from articles and DoD releases.

```sql
CREATE TABLE military_contract_awards (
  id BIGSERIAL PRIMARY KEY,
  
  -- Link to source article
  article_id BIGINT REFERENCES military_news_articles(id),
  article_url TEXT,
  published_date DATE NOT NULL,
  
  -- Vendor information
  vendor_name TEXT NOT NULL,
  vendor_location TEXT,
  vendor_city TEXT,
  vendor_state VARCHAR(2),
  vendor_country VARCHAR(2) DEFAULT 'US',
  
  -- Contract details
  contract_number TEXT,
  modification_number TEXT,
  parent_contract TEXT,
  contract_type TEXT, -- 'FFP', 'CPFF', 'T&M', 'IDIQ', etc.
  
  -- Financial
  award_amount NUMERIC(15, 2),
  award_amount_text TEXT,
  obligated_amount NUMERIC(15, 2),
  ceiling_value NUMERIC(15, 2),
  
  -- Description
  contract_description TEXT NOT NULL,
  work_description TEXT,
  program_name TEXT,
  platform TEXT, -- Weapon system/platform name
  
  -- Performance
  performance_locations TEXT[],
  completion_date DATE,
  start_date DATE,
  option_periods TEXT,
  
  -- Funding
  fiscal_year INTEGER,
  funding_type TEXT,
  
  -- Government
  contracting_activity TEXT NOT NULL,
  contracting_office TEXT,
  service_branch TEXT,
  
  -- Competition
  number_of_offers_received INTEGER,
  competed BOOLEAN,
  
  -- Small business
  small_business_type TEXT,
  is_small_business BOOLEAN DEFAULT FALSE,
  is_8a BOOLEAN DEFAULT FALSE,
  is_sdvosb BOOLEAN DEFAULT FALSE,
  is_wosb BOOLEAN DEFAULT FALSE,
  is_hubzone BOOLEAN DEFAULT FALSE,
  
  -- Raw data
  raw_paragraph TEXT NOT NULL,
  
  -- Cross-references
  fpds_contract_id TEXT,
  sam_gov_opportunity_id TEXT,
  
  -- Metadata
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(article_id, contract_number, vendor_name)
);
```

#### 3. `military_personnel_changes`
Track promotions, assignments, retirements, change of commands.

```sql
CREATE TABLE military_personnel_changes (
  id BIGSERIAL PRIMARY KEY,
  
  -- Link to source
  article_id BIGINT REFERENCES military_news_articles(id),
  article_url TEXT,
  announced_date DATE NOT NULL,
  
  -- Change type
  change_type TEXT NOT NULL, -- 'promotion', 'assignment', 'retirement', 'change_of_command', 'selection'
  
  -- Personnel information
  person_name TEXT NOT NULL,
  rank_from TEXT, -- Starting rank
  rank_to TEXT, -- New rank (for promotions)
  current_rank TEXT,
  
  -- Position
  position_from TEXT, -- Previous position
  position_to TEXT, -- New position
  current_position TEXT,
  
  -- Unit/Organization
  unit_from TEXT,
  unit_to TEXT,
  current_unit TEXT,
  command_level TEXT, -- 'brigade', 'division', 'corps', 'army', 'joint', etc.
  
  -- Service
  service_branch TEXT NOT NULL,
  component TEXT, -- 'active', 'reserve', 'guard'
  
  -- Geographic
  location_from TEXT,
  location_to TEXT,
  base_from TEXT,
  base_to TEXT,
  
  -- Dates
  effective_date DATE,
  ceremony_date DATE,
  
  -- Promotion specific
  promotion_list_name TEXT, -- e.g., "FY24 Colonel Promotion List"
  promotion_sequence_number TEXT,
  date_of_rank DATE,
  
  -- Change of command specific
  outgoing_commander TEXT,
  incoming_commander TEXT,
  ceremony_location TEXT,
  
  -- Additional context
  biography_url TEXT,
  photo_url TEXT,
  description TEXT,
  
  -- Raw data
  raw_text TEXT,
  
  -- Metadata
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(person_name, change_type, announced_date, current_position)
);
```

#### 4. `military_units`
Track military units, their locations, and activities.

```sql
CREATE TABLE military_units (
  id BIGSERIAL PRIMARY KEY,
  
  -- Unit identification
  unit_name TEXT NOT NULL,
  unit_designation TEXT, -- e.g., "3rd Infantry Division", "USS Ronald Reagan (CVN-76)"
  unit_type TEXT, -- 'division', 'brigade', 'battalion', 'ship', 'squadron', etc.
  
  -- Service
  service_branch TEXT NOT NULL,
  component TEXT, -- 'active', 'reserve', 'guard'
  
  -- Hierarchy
  parent_unit TEXT,
  subordinate_units TEXT[],
  
  -- Location
  home_station TEXT,
  base_name TEXT,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'US',
  
  -- Current status
  current_location TEXT, -- May differ from home station if deployed
  deployment_status TEXT, -- 'home', 'deployed', 'training', 'en_route'
  
  -- Commander
  current_commander TEXT,
  current_commander_rank TEXT,
  
  -- URLs
  official_website TEXT,
  social_media JSONB, -- {'facebook': 'url', 'twitter': 'url', etc.}
  
  -- DVIDS
  dvids_unit_id TEXT,
  
  -- Activity tracking
  last_activity_date DATE,
  last_mentioned_date DATE,
  mention_count INTEGER DEFAULT 0,
  
  -- Metadata
  first_seen TIMESTAMPTZ DEFAULT NOW(),
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(unit_designation, service_branch)
);
```

#### 5. `military_training_exercises`
Track training exercises, drills, operations.

```sql
CREATE TABLE military_training_exercises (
  id BIGSERIAL PRIMARY KEY,
  
  -- Link to source
  article_id BIGINT REFERENCES military_news_articles(id),
  article_url TEXT,
  announced_date DATE,
  
  -- Exercise details
  exercise_name TEXT NOT NULL,
  exercise_type TEXT, -- 'training', 'drill', 'wargame', 'joint_exercise', etc.
  exercise_code_name TEXT,
  
  -- Dates
  start_date DATE,
  end_date DATE,
  duration_days INTEGER,
  
  -- Participants
  participating_services TEXT[], -- ['army', 'navy', 'air_force']
  participating_units TEXT[],
  participating_countries TEXT[], -- For international exercises
  number_of_personnel INTEGER,
  
  -- Location
  location TEXT,
  base TEXT,
  country TEXT,
  geographic_region TEXT, -- 'EUCOM', 'INDOPACOM', 'CENTCOM', etc.
  
  -- Details
  description TEXT,
  objectives TEXT,
  capabilities_exercised TEXT[], -- ['amphibious assault', 'air defense', etc.]
  
  -- Equipment
  equipment_involved TEXT[], -- Types of equipment/platforms used
  
  -- Scale
  scale TEXT, -- 'small', 'medium', 'large', 'major'
  
  -- Classification
  is_recurring BOOLEAN DEFAULT FALSE,
  frequency TEXT, -- 'annual', 'biannual', 'quarterly'
  
  -- Metadata
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(exercise_name, start_date)
);
```

#### 6. `military_deployments`
Track unit deployments and movements.

```sql
CREATE TABLE military_deployments (
  id BIGSERIAL PRIMARY KEY,
  
  -- Link to source
  article_id BIGINT REFERENCES military_news_articles(id),
  article_url TEXT,
  announced_date DATE NOT NULL,
  
  -- Unit
  unit_name TEXT NOT NULL,
  unit_designation TEXT,
  service_branch TEXT NOT NULL,
  
  -- Deployment details
  deployment_type TEXT, -- 'deployment', 'redeployment', 'rotation', 'extension'
  
  -- Locations
  deploying_from TEXT,
  deploying_to TEXT,
  home_station TEXT,
  
  -- Dates
  deployment_date DATE,
  expected_return_date DATE,
  actual_return_date DATE,
  deployment_duration_months INTEGER,
  
  -- Size
  number_of_personnel INTEGER,
  equipment_description TEXT,
  
  -- Mission
  mission_description TEXT,
  operation_name TEXT,
  combatant_command TEXT, -- 'CENTCOM', 'EUCOM', etc.
  
  -- Status
  deployment_status TEXT, -- 'announced', 'in_progress', 'completed', 'extended'
  
  -- Metadata
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 7. `military_news_scraper_log`
Track scraping progress and status.

```sql
CREATE TABLE military_news_scraper_log (
  id BIGSERIAL PRIMARY KEY,
  
  -- Scraper info
  scraper_name TEXT NOT NULL, -- 'defense_gov_daily', 'army_times_historical', etc.
  scrape_type TEXT NOT NULL, -- 'historical', 'daily', 'backfill'
  source TEXT NOT NULL,
  
  -- Date range
  date_from DATE,
  date_to DATE,
  
  -- Results
  articles_found INTEGER DEFAULT 0,
  articles_new INTEGER DEFAULT 0,
  articles_updated INTEGER DEFAULT 0,
  articles_skipped INTEGER DEFAULT 0,
  articles_failed INTEGER DEFAULT 0,
  
  -- Extracted entities
  contracts_extracted INTEGER DEFAULT 0,
  personnel_changes_extracted INTEGER DEFAULT 0,
  units_identified INTEGER DEFAULT 0,
  exercises_found INTEGER DEFAULT 0,
  deployments_found INTEGER DEFAULT 0,
  
  -- Status
  status TEXT NOT NULL, -- 'running', 'completed', 'failed', 'partial'
  error_message TEXT,
  errors TEXT[], -- Array of error messages
  
  -- Performance
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Supporting Tables

#### 8. `military_bases`
Reference table for military installations.

```sql
CREATE TABLE military_bases (
  id BIGSERIAL PRIMARY KEY,
  
  base_name TEXT NOT NULL,
  base_full_name TEXT,
  base_type TEXT, -- 'army_post', 'naval_station', 'air_force_base', etc.
  
  service_branch TEXT NOT NULL,
  
  city TEXT,
  state VARCHAR(2),
  country VARCHAR(2) DEFAULT 'US',
  
  -- Location
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  
  -- Status
  status TEXT, -- 'active', 'closed', 'realigned'
  
  -- Units
  major_units TEXT[], -- Major units stationed there
  
  -- Metadata
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(base_name, state, country)
);
```

#### 9. `military_ranks`
Reference table for military ranks across services.

```sql
CREATE TABLE military_ranks (
  id BIGSERIAL PRIMARY KEY,
  
  service_branch TEXT NOT NULL,
  rank_name TEXT NOT NULL,
  rank_abbreviation TEXT,
  pay_grade TEXT, -- 'E-1', 'O-6', etc.
  rank_order INTEGER, -- For sorting
  
  is_officer BOOLEAN DEFAULT FALSE,
  is_enlisted BOOLEAN DEFAULT FALSE,
  is_warrant BOOLEAN DEFAULT FALSE,
  is_flag_officer BOOLEAN DEFAULT FALSE, -- General/Admiral ranks
  
  UNIQUE(service_branch, rank_name)
);
```

## Indexes and Performance

```sql
-- military_news_articles indexes
CREATE INDEX idx_mil_news_source ON military_news_articles(source);
CREATE INDEX idx_mil_news_published ON military_news_articles(published_date DESC);
CREATE INDEX idx_mil_news_types ON military_news_articles USING GIN(article_types);
CREATE INDEX idx_mil_news_services ON military_news_articles USING GIN(service_branches);
CREATE INDEX idx_mil_news_url ON military_news_articles(article_url);
CREATE INDEX idx_mil_news_search ON military_news_articles USING GIN(search_vector);

-- military_contract_awards indexes
CREATE INDEX idx_mil_contracts_vendor ON military_contract_awards(vendor_name);
CREATE INDEX idx_mil_contracts_date ON military_contract_awards(published_date DESC);
CREATE INDEX idx_mil_contracts_amount ON military_contract_awards(award_amount DESC NULLS LAST);
CREATE INDEX idx_mil_contracts_service ON military_contract_awards(service_branch);

-- military_personnel_changes indexes
CREATE INDEX idx_mil_personnel_name ON military_personnel_changes(person_name);
CREATE INDEX idx_mil_personnel_type ON military_personnel_changes(change_type);
CREATE INDEX idx_mil_personnel_date ON military_personnel_changes(announced_date DESC);
CREATE INDEX idx_mil_personnel_service ON military_personnel_changes(service_branch);
CREATE INDEX idx_mil_personnel_rank_to ON military_personnel_changes(rank_to);

-- military_units indexes
CREATE INDEX idx_mil_units_name ON military_units(unit_name);
CREATE INDEX idx_mil_units_designation ON military_units(unit_designation);
CREATE INDEX idx_mil_units_service ON military_units(service_branch);
CREATE INDEX idx_mil_units_base ON military_units(base_name);

-- military_training_exercises indexes
CREATE INDEX idx_mil_exercises_name ON military_training_exercises(exercise_name);
CREATE INDEX idx_mil_exercises_start ON military_training_exercises(start_date DESC);
CREATE INDEX idx_mil_exercises_location ON military_training_exercises(country);

-- military_deployments indexes
CREATE INDEX idx_mil_deployments_unit ON military_deployments(unit_name);
CREATE INDEX idx_mil_deployments_date ON military_deployments(announced_date DESC);
CREATE INDEX idx_mil_deployments_status ON military_deployments(deployment_status);
```

## Scraper Architecture

### Phase 1: Historical Scraper (Build First)

#### Priority Order for Historical Scraping:
1. **Defense.gov Contract Awards** (Highest value, structured data)
2. **DVIDS API** (Best API, comprehensive coverage)
3. **Service Branch Official Sites** (Army.mil, Navy.mil, etc.)
4. **Military Times Properties** (Army Times, Navy Times, etc.)
5. **Secondary Sources** (Defense News, Stars & Stripes)

#### Implementation Approach:

```python
# scripts/military_news_historical_scraper.py

"""
Military News Historical Scraper
Scrapes historical articles from all military news sources
Follows pattern from existing scrapers (SBIR, Senate, GSA)
"""

import requests
import time
from datetime import datetime, timedelta
from bs4 import BeautifulSoup
import json
from typing import List, Dict, Optional
import os
from pathlib import Path
```

### Scraper Components:

#### 1. Defense.gov Scraper
- Parse daily contract awards (published ~5 PM EST daily)
- Historical: Iterate through archive URLs
- Format: Structured press releases
- Extraction: Parse contract paragraphs using regex and NLP

#### 2. DVIDS API Scraper
- Use official API: https://www.dvidshub.net/api
- Endpoints:
  - `/api/v2/resources/` - Search news stories
  - `/api/v2/units/` - Get unit information
  - `/api/v2/images/` - Get images with metadata
- Historical: Pagination through date ranges
- Rate limit: 1 request per second

#### 3. Military Times Scraper
- No official API - web scraping required
- Strategy:
  - Check sitemap.xml for article URLs
  - Parse article pages using BeautifulSoup
  - Extract: Title, date, author, content, tags
- Historical: Iterate through archive pages or date-based URLs
- Rate limit: 2-3 seconds between requests
- User-Agent rotation

#### 4. Service Branch Scrapers
- Each service (Army, Navy, AF, Marines, Coast Guard) has RSS feeds
- Parse RSS for article URLs
- Scrape full article content
- Extract entity information (personnel, units, locations)

### Natural Language Processing (NLP) Extraction

Use spaCy or similar for entity extraction:
- **Named Entity Recognition (NER)**:
  - PERSON → Personnel names
  - ORG → Units, commands, contractors
  - GPE → Locations, bases
  - DATE → Event dates
  - MONEY → Contract values

- **Custom patterns**:
  - Rank detection: Regex for "Gen.", "Adm.", "Col.", etc.
  - Unit designation: Pattern matching for unit formats
  - Contract numbers: Regex for contract IDs
  - Base names: Dictionary matching

### Data Flow:

```
1. Scraper fetches article → 
2. Parse HTML/JSON → 
3. Extract structured data → 
4. NLP entity extraction → 
5. Classify article type → 
6. Insert into military_news_articles → 
7. Extract entities to specialized tables → 
8. Log scraper progress
```

## Phase 2: Daily Scraper (Build After Testing Historical)

### Daily Scraper Strategy:
- Run via cron at specific times:
  - Defense.gov: 5:30 PM EST (after daily contract awards)
  - DVIDS: Every 6 hours (high volume source)
  - Military Times: 3x daily (morning, midday, evening)
  - Service branches: 2x daily
  
### Incremental Scraping:
- Track last scraped date per source
- Only fetch articles published since last run
- Update existing articles if content changed
- Detect and log changes to existing articles

### Change Detection:
- Compare article content hash
- Log modifications
- Track version history for important articles

## Data Quality & Analysis

### Quality Scoring:
```python
def calculate_article_quality_score(article):
    score = 0
    # Base fields
    if article.title: score += 10
    if article.content and len(article.content) > 500: score += 20
    if article.published_date: score += 10
    
    # Extracted entities
    if article.personnel_mentioned: score += 15
    if article.units_mentioned: score += 15
    if article.locations: score += 10
    
    # Classification
    if article.article_types: score += 10
    if article.service_branches: score += 10
    
    return min(score, 100)
```

### Analysis Views:
- Daily contract award summaries
- Promotion tracking by service/rank
- Unit activity heat maps
- Deployment tracking dashboards
- Training exercise calendars
- Change of command timelines

## Technology Stack

### Core Technologies:
- **Python 3.11+**
- **Requests** - HTTP requests
- **BeautifulSoup4** - HTML parsing
- **spaCy** - NLP and entity extraction
- **python-dateutil** - Date parsing
- **Supabase Python client** - Database operations

### Optional/Advanced:
- **Playwright** - For JavaScript-heavy sites
- **Scrapy** - For large-scale scraping (if needed)
- **Apache Airflow** - Workflow orchestration (future)
- **Redis** - Caching and rate limiting
- **Celery** - Distributed task queue (for scale)

## Testing Strategy

### Historical Scraper Testing:
1. Start with 1 week of data per source
2. Validate data quality
3. Check entity extraction accuracy
4. Review edge cases
5. Expand to 1 month
6. Full historical backfill

### Validation Checks:
- Article count matches expected volume
- No duplicate articles
- Valid dates (no future dates)
- Entity extraction success rate > 70%
- Contract amounts within reasonable ranges
- Personnel names properly formatted

## Deployment Plan

### Phase 1: Historical Scraping (Weeks 1-2)
1. Build database schema
2. Build Defense.gov contract scraper (Day 1-2)
3. Build DVIDS API scraper (Day 3-4)
4. Build service branch scrapers (Day 5-6)
5. Build Military Times scraper (Day 7-8)
6. Test with sample data (Day 9-10)
7. Run full historical scrape (Day 11-14)

### Phase 2: Daily Scraper (Week 3)
1. Build daily scraper framework
2. Add incremental update logic
3. Set up cron jobs
4. Monitor for 1 week
5. Fix any issues

### Phase 3: Enhancement (Week 4+)
1. Improve entity extraction
2. Add more sources
3. Build analysis dashboards
4. Optimize performance
5. Add alerts for important events

## Legal & Ethical Considerations

### Compliance:
- Respect robots.txt
- Implement rate limiting
- Use appropriate User-Agent strings
- Only collect public information
- Respect copyright (don't republish full articles)

### Data Retention:
- Store metadata and extracted facts
- Link to original sources
- Consider fair use for analysis purposes

### Rate Limiting Guidelines:
- Defense.gov: 1 request per 2 seconds
- DVIDS: 1 request per 1 second (API)
- Military Times: 1 request per 2-3 seconds
- Service branches: 1 request per 2 seconds

## Success Metrics

### Coverage:
- 95%+ of daily DoD contract awards captured
- 90%+ of change of command ceremonies tracked
- 85%+ of flag officer promotions captured
- 80%+ of major training exercises tracked
- 75%+ of unit deployments tracked

### Data Quality:
- 85%+ articles with extracted entities
- 90%+ articles properly classified
- 95%+ valid dates
- 90%+ valid contract amounts
- <5% duplicate articles

### Performance:
- Historical scrape completes in <48 hours
- Daily scrape completes in <1 hour per source
- <1% error rate
- 99%+ uptime for daily scrapers

## Future Enhancements

### Advanced Features:
1. **AI-Powered Classification**
   - Use GPT-4 to classify articles
   - Extract complex entity relationships
   - Generate summaries

2. **Correlation Analysis**
   - Link contract awards to prior opportunities
   - Connect personnel to previous assignments
   - Track unit movement patterns

3. **Predictive Analytics**
   - Predict future contract awards
   - Forecast promotion timelines
   - Anticipate deployment patterns

4. **Alert System**
   - Real-time notifications for high-value contracts
   - Track specific units or personnel
   - Monitor competitor activity

5. **API Development**
   - Build public API for data access
   - Provide webhooks for updates
   - Enable third-party integrations

6. **Data Enrichment**
   - Link to company databases
   - Add unit history and lineage
   - Include equipment databases

## Conclusion

This comprehensive military news scraper will provide unprecedented visibility into DoD activities, personnel changes, contracting, and operations. By following this phased approach, we'll build a robust, reliable system that captures and structures vast amounts of public military information for analysis and insight.

The key to success is starting with high-value, well-structured sources (Defense.gov contracts, DVIDS API) and progressively expanding to more challenging sources (Military Times, service branches) while continuously improving entity extraction and data quality.

