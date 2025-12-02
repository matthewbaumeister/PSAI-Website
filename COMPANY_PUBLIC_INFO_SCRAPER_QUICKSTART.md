# Company Public Info Scraper - Quick Start Testing Guide

## Overview
Test the LinkedIn and company website public data scraper on your local machine before running at scale.

---

## Prerequisites

- Python 3.11+
- Access to Supabase (URL + Service Key)
- Internet connection
- ~5-10 minutes for testing

---

## Step-by-Step Testing Instructions

### Step 1: Install Python Dependencies

```bash
# Navigate to project root
cd /Users/matthewbaumeister/Documents/PropShop_AI_Website

# Install Python packages
pip install -r requirements-scraper.txt

# Install Playwright browser
playwright install chromium

# Install system dependencies (if needed)
playwright install-deps chromium
```

**Expected output**: All packages installed successfully

---

### Step 2: Set Up Environment Variables

Create a `.env` file in the project root:

```bash
# Create .env file
cat > .env << 'EOF'
# Supabase Configuration (REQUIRED)
SUPABASE_URL=your_supabase_project_url_here
SUPABASE_SERVICE_KEY=your_service_role_key_here

# Optional Settings
USE_PROXY=false
LOG_LEVEL=INFO
EOF
```

**Replace** `your_supabase_project_url_here` and `your_service_role_key_here` with your actual credentials.

To find these in Supabase:
1. Go to your Supabase project dashboard
2. Click Settings → API
3. Copy "Project URL" and "service_role key"

---

### Step 3: Run Database Migration

In Supabase SQL Editor, run:

```sql
-- Copy and paste the entire contents of:
supabase/migrations/create_company_enrichment_scraper_tables.sql
```

**Expected output**:
```
NOTICE: Company Public Info Scraper Tables Created!
✓ 6 tables created
✓ 5 views created
✓ 2 functions created
```

**Verify tables were created**:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%linkedin%' OR table_name LIKE '%public_info%';
```

You should see:
- `company_linkedin_profiles`
- `company_employees`
- `employee_movement_tracking`
- `company_website_data`
- `company_public_info_scraper_queue`
- `company_public_info_scraper_run_log`

---

### Step 4: Test the Scrapers (Dry Run)

```bash
cd scrapers

# Run the test suite
python test_scrapers.py
```

**What this does**:
- Tests LinkedIn scraper on 2 companies (Lockheed Martin, Raytheon)
- Tests website scraper on 3 companies
- Runs full pipeline test on 1 company
- **NOTE**: Browser will open (set `headless=True` in code to hide)

**Expected output**:
```
=== Testing LinkedIn Scraper ===
Testing: Lockheed Martin
✓ Company Profile Scraped
  - Name: Lockheed Martin
  - Industry: Defense & Space
  - Size: 10,001+ employees
  - Followers: 2.5M
✓ Found 10 employees

=== Website Scraper Test ===
Testing: Lockheed Martin
✓ Website Scraped
  - Leadership: 15 members
  - Emails: 3
  - Richness Score: 75/100

=== Final Summary ===
Overall: 5/6 tests passed (83%)
✓ Test suite PASSED - Ready for production!
```

**If tests fail**:
- Check internet connection
- Verify LinkedIn/website URLs are accessible
- Check error messages in output
- See troubleshooting section below

---

### Step 5: Test Database Connection

```bash
# Test Supabase connection
python -c "
from scrapers.database import ScraperDatabase
db = ScraperDatabase()
print('✓ Database connected successfully!')
companies = db.get_all_companies_for_queue()
print(f'✓ Found {len(companies)} companies in database')
"
```

**Expected output**:
```
✓ Database connected successfully!
✓ Found 1234 companies in database
```

---

### Step 6: Build Test Queue (10 Companies)

```bash
# Build queue with just 10 companies for testing
python -c "
from scrapers.build_queue import QueueBuilder
builder = QueueBuilder()

# Get first 10 companies
companies = builder.db.get_all_companies_for_queue()[:10]
queue_items = []

for company in companies:
    stats = builder.db.get_company_stats(company['id'])
    priority, reason = builder._calculate_priority(company, stats)
    
    queue_items.append({
        'company_intelligence_id': company['id'],
        'company_name': company['company_name'],
        'website_url': company.get('website'),
        'linkedin_url': None,
        'scrape_type': 'full',
        'priority': priority,
        'priority_reason': reason,
        'status': 'pending'
    })

inserted = builder.db.bulk_insert_queue(queue_items)
print(f'✓ Added {inserted} companies to test queue')
"
```

**Expected output**:
```
✓ Added 10 companies to test queue
```

**Verify in database**:
```sql
SELECT * FROM company_public_info_scraper_queue 
ORDER BY priority DESC 
LIMIT 10;
```

---

### Step 7: Run Historical Scraper (Test Mode)

```bash
# Scrape just 3 companies as a test
python historical_scraper.py 3
```

**What this does**:
- Fetches 3 highest-priority companies from queue
- Scrapes LinkedIn profiles (if URL available)
- Scrapes company websites
- Saves all data to database
- Takes ~2-5 minutes

**Expected output**:
```
=== Starting Historical Scraper ===
Max per day: 3, Batch size: 10

=== Processing batch of 3 companies ===

--- Processing: Acme Corp (Priority: 8) ---
✓ Acme Corp: LinkedIn ✓, 15 employees ✓, Website ✓

--- Processing: Widget Inc (Priority: 7) ---
✓ Widget Inc: Website ✓

--- Processing: Tech Solutions (Priority: 6) ---
✓ Tech Solutions: LinkedIn ✓, 8 employees ✓

=== Historical Scraper Complete ===
Total companies: 3
Successful: 3
Failed: 0
LinkedIn profiles: 2
Employees found: 23
Websites scraped: 3
Duration: 145 seconds
```

---

### Step 8: Verify Results in Database

```sql
-- Check scraper run log
SELECT * FROM company_public_info_scraper_run_log 
ORDER BY started_at DESC 
LIMIT 1;

-- Check queue status
SELECT * FROM company_public_info_queue_summary;

-- Check LinkedIn profiles scraped
SELECT 
  company_name, 
  industry, 
  company_size, 
  employee_count_linkedin,
  follower_count
FROM company_linkedin_profiles
ORDER BY last_scraped DESC
LIMIT 5;

-- Check employees found
SELECT 
  company_name,
  full_name,
  current_title,
  linkedin_url
FROM company_employees
ORDER BY created_at DESC
LIMIT 10;

-- Check website data
SELECT 
  company_name,
  executive_count,
  array_length(discovered_emails, 1) as email_count,
  email_pattern,
  content_richness_score
FROM company_website_data
ORDER BY last_scraped DESC
LIMIT 5;

-- Summary view
SELECT * FROM companies_with_linkedin LIMIT 5;
SELECT * FROM companies_with_website_data LIMIT 5;
```

**Expected results**:
- Run log shows "completed" status
- Queue summary shows 3 "completed" items
- LinkedIn profiles table has 1-2 new rows
- Employees table has 10-30 new rows
- Website data table has 2-3 new rows

---

## Troubleshooting

### Issue: "ModuleNotFoundError: No module named 'playwright'"

**Solution**:
```bash
pip install playwright
playwright install chromium
```

### Issue: "Cannot connect to Supabase"

**Check**:
1. `.env` file exists and has correct credentials
2. `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` are correct
3. Internet connection is working

**Test connection**:
```bash
python -c "
import os
from dotenv import load_dotenv
load_dotenv()
print('URL:', os.getenv('SUPABASE_URL'))
print('Key:', os.getenv('SUPABASE_SERVICE_KEY')[:20] + '...')
"
```

### Issue: "LinkedIn scraping fails"

**Common causes**:
- LinkedIn changed their HTML structure
- IP blocked by LinkedIn (use proxy)
- Rate limiting (add delays)

**Solutions**:
1. Skip LinkedIn for now: Set `linkedin_url=None` in queue
2. Increase delays in `config.py`: `LINKEDIN_RATE_LIMIT = 0.1` (10 sec delay)
3. Use website scraping only

### Issue: "Website scraping fails"

**Check**:
1. Website URL is accessible in browser
2. Website doesn't block bots (check robots.txt)
3. Timeout is sufficient (increase in `config.py`)

### Issue: "Browser doesn't open"

**If you want to see the browser**:
In `test_scrapers.py`, change:
```python
await scraper.init_browser(headless=False)  # Set to False to see browser
```

### Issue: "Tables already exist error"

**Solution**:
Drop existing tables:
```sql
DROP TABLE IF EXISTS company_public_info_scraper_run_log CASCADE;
DROP TABLE IF EXISTS company_public_info_scraper_queue CASCADE;
DROP TABLE IF EXISTS company_website_data CASCADE;
DROP TABLE IF EXISTS employee_movement_tracking CASCADE;
DROP TABLE IF EXISTS company_employees CASCADE;
DROP TABLE IF EXISTS company_linkedin_profiles CASCADE;

-- Then re-run the migration
```

---

## Next Steps After Testing

### If Tests Pass (70%+ success rate):

**Option 1: Small Scale Test (50 companies)**
```bash
python historical_scraper.py 50
```

**Option 2: Build Full Queue**
```bash
python build_queue.py  # Adds all companies
```

**Option 3: Daily Production Run (200/day)**
```bash
# Edit config.py to set MAX_COMPANIES_PER_DAY = 200
python historical_scraper.py 200
```

**Option 4: Set Up GitHub Action**
- Add secrets to GitHub repo:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_KEY`
- GitHub Action will run automatically daily at 2 AM UTC

---

## Test Success Criteria

✓ **Database migration runs without errors**
✓ **Environment variables loaded correctly**
✓ **Test suite passes with >70% success rate**
✓ **Database connection successful**
✓ **Queue building works**
✓ **Historical scraper completes 3 companies**
✓ **Data appears in database tables**

If all 7 criteria pass → **Ready for production!**

---

## Quick Reference Commands

```bash
# Full test sequence
cd /Users/matthewbaumeister/Documents/PropShop_AI_Website
pip install -r requirements-scraper.txt
playwright install chromium
cd scrapers
python test_scrapers.py
python historical_scraper.py 3

# Check results
# (Run SQL queries above in Supabase)

# Scale up
python historical_scraper.py 50   # Test with 50
python build_queue.py             # Build full queue
python historical_scraper.py 200  # Production (200/day)
```

---

## Support

**Logs location**: `logs/scraper.log`

**Check run history**:
```sql
SELECT * FROM company_public_info_scraper_run_log 
ORDER BY started_at DESC;
```

**Check failed items**:
```sql
SELECT company_name, last_error 
FROM company_public_info_scraper_queue 
WHERE status = 'failed';
```

**Retry failed items**:
```sql
UPDATE company_public_info_scraper_queue
SET status = 'pending', attempt_count = 0
WHERE status = 'failed' AND attempt_count < 3;
```

---

## Estimated Testing Time

- **Step 1-2** (Setup): 5 minutes
- **Step 3** (Database): 2 minutes
- **Step 4** (Test scrapers): 5-10 minutes
- **Step 5-6** (Database test): 2 minutes
- **Step 7** (Scrape 3 companies): 3-5 minutes
- **Step 8** (Verify): 2 minutes

**Total: ~20-30 minutes for complete testing**

---

## Ready to Go!

Once all tests pass, you have a **production-ready scraper** that can:
- Scrape 350K+ companies
- Track millions of employees
- Discover leadership teams
- Find email patterns
- Monitor employee movements

**Cost**: $0-500/month (vs $60K/year for commercial solutions)

Start scraping! 🚀


