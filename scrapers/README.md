# Company Enrichment Scrapers

Comprehensive LinkedIn and company website scraping system for enriching contractor data with employee information, leadership teams, and company intelligence.

## Overview

This scraper system collects:
- **LinkedIn Data**: Company profiles, employee counts, followers, industry info
- **Employee Data**: Names, titles, LinkedIn profiles, employment history
- **Website Data**: Leadership teams, contact info, emails, office locations, certifications
- **Relationship Tracking**: Employee movement between companies

## Architecture

```
scrapers/
├── config.py               # Configuration and settings
├── database.py             # Database operations
├── linkedin_scraper.py     # LinkedIn scraping with Playwright
├── website_scraper.py      # Company website scraping
├── build_queue.py          # Build prioritized scraper queue
├── historical_scraper.py   # Historical batch scraper
├── daily_scraper.py        # Daily incremental scraper
└── README.md               # This file
```

## Setup

### 1. Install Dependencies

```bash
pip install -r requirements-scraper.txt
playwright install chromium
```

### 2. Environment Variables

Create a `.env` file in the project root:

```bash
# Required
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key

# Optional
USE_PROXY=false
PROXY_URL=http://user:pass@proxy:port
LOG_LEVEL=INFO
```

### 3. Database Setup

Run the migration to create scraper tables:

```bash
# In Supabase SQL Editor
supabase/migrations/create_company_enrichment_scraper_tables.sql
```

## Usage

### Phase 1: Historical Scraping

#### Step 1: Build the Queue

Populate the queue with all companies, prioritized by contract value and activity:

```bash
cd scrapers
python build_queue.py
```

This will:
- Fetch all companies from `company_intelligence` table
- Calculate priority scores based on contract value, recent activity, and data gaps
- Insert ~350K companies into `company_public_info_scraper_queue`
- Skip companies scraped in the last 90 days (unless `force_refresh=True`)

#### Step 2: Run Historical Scraper

Run the historical scraper to process the queue:

```bash
# Default: 200 companies per day, batch size 10
python historical_scraper.py

# Custom limits
python historical_scraper.py 500 20  # 500 per day, batch size 20
```

**Timeline**: At 200 companies/day, scraping 350K companies will take ~1,750 days (~5 years). Consider:
- Running multiple instances with different IP addresses
- Using proxy services (Bright Data, ScraperAPI)
- Increasing to 500-1000/day with proper proxies

**Rate Limiting**:
- LinkedIn: 1 request per 5 seconds (0.2 req/s)
- Website: 1 request per second
- Automatic backoff on errors

### Phase 2: Daily Incremental Scraper

#### GitHub Action (Recommended)

The daily scraper runs automatically via GitHub Actions at 2 AM UTC:

```yaml
# .github/workflows/daily-company-enrichment.yml
# Runs daily, scrapes up to 100 companies
```

To trigger manually:
1. Go to Actions tab in GitHub
2. Select "Daily Company Enrichment Scraper"
3. Click "Run workflow"

#### Manual Execution

```bash
cd scrapers
python daily_scraper.py
```

This will:
1. Queue new companies added in the last 24 hours (Priority 9)
2. Queue stale companies not scraped in 90+ days (Priority 6)
3. Scrape up to 100 companies total
4. Update employee data

## Monitoring

### View Queue Status

```sql
-- Queue summary
SELECT * FROM scraper_queue_summary;

-- Pending items by priority
SELECT priority, COUNT(*) 
FROM company_public_info_scraper_queue 
WHERE status = 'pending' 
GROUP BY priority 
ORDER BY priority DESC;

-- Failed items
SELECT company_name, last_error, attempt_count
FROM company_public_info_scraper_queue
WHERE status = 'failed'
ORDER BY priority DESC;
```

### View Run Logs

```sql
-- Recent runs
SELECT * FROM company_scraper_run_log 
ORDER BY started_at DESC 
LIMIT 10;

-- Run statistics
SELECT 
  run_type,
  AVG(companies_successful) as avg_successful,
  AVG(companies_failed) as avg_failed,
  AVG(duration_seconds / 60.0) as avg_duration_minutes
FROM company_scraper_run_log
WHERE status = 'completed'
GROUP BY run_type;
```

### View Enriched Data

```sql
-- Companies with LinkedIn data
SELECT * FROM companies_with_linkedin
ORDER BY employees_tracked DESC
LIMIT 20;

-- Companies with website data
SELECT * FROM companies_with_website_data
ORDER BY content_richness_score DESC
LIMIT 20;

-- Recent employee movements
SELECT * FROM recent_employee_movements
ORDER BY detected_at DESC
LIMIT 50;
```

## Priority System

Companies are prioritized 1-10 (10 = highest):

| Priority | Criteria |
|----------|----------|
| 10 | Contract value > $10M |
| 8 | Contract value > $1M |
| 6 | Contract value > $100K OR stale data |
| +3 | Contract in last 30 days |
| +2 | Contract in last 180 days OR small business |
| +1 | High contract volume (>50 contracts) |
| -1 | No website URL |

## Error Handling

### Automatic Retries

Failed scrapes are automatically retried with exponential backoff:
- Max 3 attempts per company
- Backoff: 2^attempt seconds
- After 3 failures, marked as `failed` in queue

### Manual Retry

```sql
-- Retry failed items
UPDATE company_public_info_scraper_queue
SET status = 'pending', attempt_count = 0, last_error = NULL
WHERE status = 'failed' AND attempt_count < 3;
```

### Skip Problem Companies

```sql
-- Skip companies that consistently fail
UPDATE company_public_info_scraper_queue
SET status = 'skipped'
WHERE attempt_count >= 3 AND status = 'failed';
```

## Anti-Bot Measures

### LinkedIn
- Playwright with stealth mode
- Random delays (2-5 seconds)
- Realistic browser fingerprint
- User-agent rotation
- Respects robots.txt

### Websites
- Rate limiting (1 req/sec)
- Respects robots.txt
- Timeout after 30 seconds
- Max 10 pages per site

### Recommendations for Scale
1. **Use Residential Proxies**: Bright Data, Oxylabs, SmartProxy
2. **Rate Limiting**: Stay under 200 companies/day per IP
3. **Rotating IPs**: Use different IPs for different batches
4. **Human-like Patterns**: Add random delays and variation

## Legal & Ethical Considerations

### LinkedIn
- **Warning**: LinkedIn TOS prohibits scraping
- **Risk**: Account bans, IP blocks, legal action
- **Recommendation**: Use official LinkedIn API or third-party services (Bright Data, PhantomBuster)
- **Alternative**: Manual enrichment for high-priority targets

### Websites
- **Legal**: Scraping public websites is generally legal (hiQ Labs v. LinkedIn 2019)
- **Best Practice**: Respect robots.txt, rate limits, and TOS
- **Data**: Only collect publicly available information

### Privacy
- **GDPR**: Only public professional data (no personal data)
- **Opt-out**: Provide mechanism for companies to opt out
- **Transparency**: Disclose data collection practices

## Troubleshooting

### Playwright Errors

```bash
# Reinstall browsers
playwright install chromium --force

# Install system dependencies
playwright install-deps chromium
```

### Database Connection Errors

```python
# Test connection
from scrapers.database import ScraperDatabase
db = ScraperDatabase()
print("Connected!" if db.client else "Failed")
```

### Rate Limiting Errors

Increase delays in `config.py`:

```python
LINKEDIN_RATE_LIMIT = 0.1  # 1 request per 10 seconds
WEBSITE_RATE_LIMIT = 0.5   # 1 request per 2 seconds
```

## Performance Optimization

### Speed up Scraping
1. Increase batch size (but watch memory)
2. Use multiple workers (parallel instances)
3. Skip employee scraping for low-priority companies
4. Cache DNS lookups
5. Use HTTP/2 for websites

### Reduce Costs
1. Skip LinkedIn scraping (website only)
2. Use cached data (90-day refresh cycle)
3. Prioritize high-value targets only
4. Use free proxy rotation

## Roadmap

- [x] Database schema
- [x] LinkedIn scraper
- [x] Website scraper  
- [x] Historical scraper
- [x] Daily scraper
- [x] GitHub Action
- [ ] Proxy rotation
- [ ] Employee deep scraping (full profiles)
- [ ] Email verification
- [ ] Relationship graph analysis
- [ ] Admin UI for monitoring

## Support

For issues or questions:
1. Check logs: `logs/scraper.log`
2. Check queue status in database
3. Review run logs for error patterns
4. Test scrapers individually

## Cost Estimates

### Infrastructure
- **Proxies** (optional): $50-500/month
- **GitHub Actions**: Free (2,000 min/month)
- **Storage**: ~$5/month (350K companies)

### Total: $0-500/month

### Compare to Alternatives
- Crunchbase: $60K/year
- ZoomInfo: $15K/year
- LinkedIn Sales Navigator: $1.5K/year (limited)

## Examples

### Test LinkedIn Scraper

```bash
cd scrapers
python linkedin_scraper.py
```

### Test Website Scraper

```bash
cd scrapers
python website_scraper.py
```

### Process Specific Company

```sql
-- Add high-priority company to queue
INSERT INTO company_public_info_scraper_queue (
  company_intelligence_id,
  company_name,
  website_url,
  scrape_type,
  priority,
  priority_reason,
  status
) VALUES (
  12345,
  'Acme Corp',
  'https://acme.com',
  'full',
  10,
  'Manual priority',
  'pending'
);
```

Then run the scraper.

---

Built with Python, Playwright, BeautifulSoup, and Supabase.

