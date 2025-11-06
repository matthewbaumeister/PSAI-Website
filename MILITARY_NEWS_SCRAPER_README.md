# Military News Scraper - Setup and Usage Guide

## Overview

This scraper collects comprehensive military news from multiple DoD sources including:
- DVIDS (Defense Visual Information Distribution Service)
- Military Times properties (Army/Navy/Air Force/Marine Corps Times)
- Official service branch websites (Army.mil, Navy.mil, etc.)
- Defense.gov daily contract awards

## Quick Start

### 1. Set Up Database

Run the migration to create tables:

```bash
# Navigate to your project directory
cd /path/to/PropShop_AI_Website

# Run migration in Supabase
# Option A: Through Supabase Dashboard
# - Go to SQL Editor
# - Copy contents of supabase/migrations/create_military_news_tables.sql
# - Execute

# Option B: Using Supabase CLI
supabase db push
```

### 2. Populate Reference Data

```bash
# Run the reference data population script
# Through Supabase SQL Editor, execute:
scripts/populate_military_reference_data.sql
```

This populates:
- Military ranks for all services
- Major military bases
- Reference data for entity extraction

### 3. Install Python Dependencies

```bash
# Create a virtual environment (recommended)
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install required packages
pip install -r scripts/military_news_requirements.txt
```

### 4. Configure Environment Variables

```bash
# Set Supabase credentials
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_KEY="your-service-role-key"

# Or create a .env file (recommended)
cat > .env << 'EOF'
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
EOF

# Load .env file
source .env
```

## Usage

### Historical Scraping

Start with DVIDS API (easiest and most reliable):

```bash
# Scrape DVIDS news for the last 30 days
python3 scripts/military_news_historical_scraper.py \
  --source dvids \
  --start-date 2024-11-01 \
  --end-date 2024-11-30 \
  --delay 1.0

# Scrape Army.mil RSS feed
python3 scripts/military_news_historical_scraper.py \
  --source army-rss \
  --start-date 2024-11-01

# Scrape Navy.mil RSS feed
python3 scripts/military_news_historical_scraper.py \
  --source navy-rss \
  --start-date 2024-11-01

# Scrape Air Force RSS feed
python3 scripts/military_news_historical_scraper.py \
  --source airforce-rss \
  --start-date 2024-11-01
```

### Defense.gov Contract Awards

```bash
# Test with a single article
python3 scripts/defense_gov_contract_scraper.py --test

# Scrape last 7 days
python3 scripts/defense_gov_contract_scraper.py --days 7

# Scrape specific date range
python3 scripts/defense_gov_contract_scraper.py \
  --start-date 2024-11-01 \
  --end-date 2024-11-30
```

## Data Sources

### 1. DVIDS API (Highest Priority)

**Why Start Here:**
- Official API with excellent documentation
- Comprehensive coverage of all services
- Unit-level news from deployed forces
- Rich metadata (units, locations, credits)
- Rate limit: 1 request/second

**Coverage:**
- News stories from all military units
- Photos and videos with metadata
- Unit information and locations
- Geographic tagging

**API Endpoints:**
- News: `https://www.dvidshub.net/api/v2/news`
- Images: `https://www.dvidshub.net/api/v2/images`
- Videos: `https://www.dvidshub.net/api/v2/video`
- Units: `https://www.dvidshub.net/api/v2/units`

### 2. Defense.gov Contract Awards

**Published:** Daily at ~5 PM EST

**URL:** https://www.defense.gov/News/Contracts/

**Content:**
- All DoD contract awards over $7.5M
- Vendor information
- Award amounts
- Contract descriptions
- Contracting activities

### 3. Service Branch Official Sites

#### Army.mil
- RSS: https://www.army.mil/rss/news.xml
- News: https://www.army.mil/news/
- Content: Unit news, operations, personnel

#### Navy.mil
- RSS: https://www.navy.mil/Press-Office/RSS/
- News: https://www.navy.mil/Press-Office/News-Stories/
- Content: Fleet news, ship operations, personnel

#### Air Force.mil
- RSS: https://www.af.mil/DesktopModules/ArticleCS/RSS.ashx
- News: https://www.af.mil/News/
- Content: Air operations, technology, personnel

#### Marines.mil
- RSS: https://www.marines.mil/RSS-Feeds/
- News: https://www.marines.mil/News/
- Content: Marine operations, training, personnel

### 4. Military Times Properties

**Note:** These require web scraping (no official API)

- **Army Times**: https://www.armytimes.com/
- **Navy Times**: https://www.navytimes.com/
- **Air Force Times**: https://www.airforcetimes.com/
- **Marine Corps Times**: https://www.marinecorpstimes.com/

**Scraping Strategy:**
- Check sitemap.xml for article URLs
- Use RSS feeds if available
- Parse article pages with BeautifulSoup
- Rate limit: 2-3 seconds between requests

## Recommended Scraping Order

### Phase 1: High-Value Structured Sources (Week 1)

1. **DVIDS API** - Start here
   - Official API, easiest to work with
   - Rich metadata, comprehensive coverage
   - Run for last 90 days

2. **Defense.gov Contracts** - High value
   - Daily contract awards
   - Well-structured data
   - Run for last 365 days

3. **Service Branch RSS Feeds** - Reliable
   - Official sources
   - RSS makes parsing easy
   - Run for last 180 days

### Phase 2: Secondary Sources (Week 2)

4. **Military Times Properties** - Editorial content
   - Requires web scraping
   - Good for personnel news
   - Run for last 30 days initially

5. **Stars and Stripes** - Independent coverage
   - Military community news
   - Run for last 60 days

### Phase 3: Specialized Sources (Week 3+)

6. **Defense News** - Industry focus
7. **C4ISRNET** - Technology coverage
8. **Federal News Network** - DoD civilian workforce

## Testing and Validation

### Test Individual Scrapers

```bash
# Test DVIDS API
python3 scripts/military_news_historical_scraper.py \
  --source dvids \
  --start-date 2024-11-06 \
  --end-date 2024-11-06

# Check database
psql $SUPABASE_URL -c "SELECT COUNT(*) FROM military_news_articles WHERE source = 'dvids';"
```

### Validate Data Quality

```sql
-- Check article counts by source
SELECT source, COUNT(*), MIN(published_date), MAX(published_date)
FROM military_news_articles
GROUP BY source
ORDER BY COUNT(*) DESC;

-- Check extraction quality
SELECT 
  AVG(extraction_quality_score) as avg_quality,
  COUNT(*) FILTER (WHERE extraction_quality_score >= 80) as high_quality,
  COUNT(*) FILTER (WHERE needs_review = TRUE) as needs_review
FROM military_news_articles;

-- Check contract awards
SELECT 
  COUNT(*) as total_contracts,
  COUNT(DISTINCT vendor_name) as unique_vendors,
  SUM(award_amount) as total_value,
  AVG(award_amount) as avg_value
FROM military_contract_awards
WHERE published_date >= CURRENT_DATE - INTERVAL '30 days';

-- Check personnel changes
SELECT 
  change_type,
  service_branch,
  COUNT(*) as count
FROM military_personnel_changes
GROUP BY change_type, service_branch
ORDER BY count DESC;
```

## Monitoring

### Check Scraper Logs

```sql
-- Recent scraper runs
SELECT 
  scraper_name,
  source,
  status,
  articles_found,
  articles_new,
  duration_seconds,
  started_at
FROM military_news_scraper_log
ORDER BY started_at DESC
LIMIT 20;

-- Failed runs
SELECT *
FROM military_news_scraper_log
WHERE status = 'failed'
ORDER BY started_at DESC;
```

### Data Freshness

```sql
-- Latest articles by source
SELECT 
  source,
  MAX(published_date) as latest_article,
  COUNT(*) as total_articles
FROM military_news_articles
GROUP BY source
ORDER BY latest_article DESC;
```

## Troubleshooting

### Common Issues

#### 1. Supabase Connection Errors

```bash
# Check environment variables
echo $SUPABASE_URL
echo $SUPABASE_SERVICE_KEY

# Test connection
python3 -c "
from supabase import create_client
import os
client = create_client(os.environ['SUPABASE_URL'], os.environ['SUPABASE_SERVICE_KEY'])
print('Connection successful!')
"
```

#### 2. Rate Limiting

If you're getting blocked:
- Increase delay between requests (`--delay 3.0`)
- Check robots.txt compliance
- Verify User-Agent header

#### 3. Missing Data

Check scraper logs:
```sql
SELECT error_message, errors, warnings
FROM military_news_scraper_log
WHERE status != 'completed'
ORDER BY started_at DESC;
```

## Daily Scraping (After Historical Complete)

Once historical scraping is complete and validated, set up daily scrapers:

```bash
# Create cron job for DVIDS (every 6 hours)
0 */6 * * * /path/to/venv/bin/python3 /path/to/scripts/military_news_historical_scraper.py --source dvids --start-date $(date -d "1 day ago" +\%Y-\%m-\%d) >> /var/log/military_news_dvids.log 2>&1

# Daily contract awards (5:30 PM EST)
30 17 * * * /path/to/venv/bin/python3 /path/to/scripts/defense_gov_contract_scraper.py --days 1 >> /var/log/military_news_contracts.log 2>&1

# Service branch RSS feeds (twice daily)
0 6,18 * * * /path/to/venv/bin/python3 /path/to/scripts/military_news_historical_scraper.py --source army-rss --start-date $(date -d "1 day ago" +\%Y-\%m-\%d) >> /var/log/military_news_army.log 2>&1
```

## Next Steps

1. **Start Small**: Begin with DVIDS API for 7 days
2. **Validate**: Check data quality and completeness
3. **Expand**: Add more sources incrementally
4. **Optimize**: Improve entity extraction and classification
5. **Automate**: Set up daily scrapers
6. **Monitor**: Track data quality and scraper health
7. **Enhance**: Add NLP for better entity extraction

## Support

For issues or questions:
1. Check scraper logs in database
2. Review error messages
3. Test with smaller date ranges
4. Verify API access and rate limits

## License

Internal use only. Respect source terms of service and robots.txt.

