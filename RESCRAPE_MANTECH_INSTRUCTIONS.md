# ManTech Historical Rescrape Instructions

## What's Been Fixed

The ManTech scraper extraction has been improved to capture:

1. **Better Date Extraction**: Multiple patterns, meta tags, and validation
2. **DOD Component Detection**: Automatically detects Army, Navy, Air Force, etc. from content
3. **Improved Company Extraction**: More conservative patterns to avoid false positives
4. **Enhanced Weapon Systems**: 40+ weapon system patterns (F-35, Virginia Class, etc.)
5. **Better State/Location Detection**: All 50 states + city/state patterns
6. **Content Cleaning**: Removes metadata and navigation elements

## How to Rescrape All Data

### Option 1: Delete existing data and rescrape everything

```bash
# 1. Delete all existing ManTech data
psql $DATABASE_URL -c "DELETE FROM mantech_projects;"

# 2. Run historical scraper (will fetch ~297 articles)
npm run scrape:mantech:historical
```

### Option 2: Update existing records with better extraction

```bash
# 1. Just run the historical scraper again
# It will use smart upsert to update existing articles with improved extraction
npm run scrape:mantech:historical
```

### Option 3: Run in background with tmux

```bash
# 1. Create tmux session
tmux new -s mantech-rescrape

# 2. Run the scraper
npm run scrape:mantech:historical

# 3. Detach from tmux (Ctrl+B, then D)

# 4. Later, reattach to check progress
tmux attach -t mantech-rescrape

# 5. When done, kill the session
tmux kill-session -t mantech-rescrape
```

## Expected Results

- **Duration**: 30-40 minutes (297 articles × ~7 seconds each)
- **Articles**: ~295-297 saved
- **Success Rate**: ~98-99%

## Data Quality Check After Rescrape

Run this SQL to check the improved data quality:

```sql
SELECT 
  'Total Projects' as metric,
  COUNT(*)::text as value
FROM mantech_projects

UNION ALL

SELECT 
  'With Published Date',
  COUNT(*)::text
FROM mantech_projects 
WHERE published_date IS NOT NULL

UNION ALL

SELECT 
  'With DOD Component',
  COUNT(*)::text
FROM mantech_projects 
WHERE mantech_component IS NOT NULL 
  AND mantech_component != 'News'

UNION ALL

SELECT 
  'With Companies',
  COUNT(*)::text
FROM mantech_projects 
WHERE companies_involved IS NOT NULL 
  AND array_length(companies_involved, 1) > 0

UNION ALL

SELECT 
  'With Weapon Systems',
  COUNT(*)::text
FROM mantech_projects 
WHERE weapon_systems IS NOT NULL 
  AND array_length(weapon_systems, 1) > 0

UNION ALL

SELECT 
  'With States',
  COUNT(*)::text
FROM mantech_projects 
WHERE states IS NOT NULL 
  AND array_length(states, 1) > 0

UNION ALL

SELECT 
  'With Technology Focus',
  COUNT(*)::text
FROM mantech_projects 
WHERE technology_focus IS NOT NULL 
  AND array_length(technology_focus, 1) > 0

UNION ALL

SELECT 
  'Avg Confidence Score',
  ROUND(AVG(parsing_confidence) * 100, 1)::text || '%'
FROM mantech_projects;
```

## Test Commands

```bash
# Test extraction on single article
npm run test:mantech:extraction

# Test saving to database
npm run test:mantech:save

# Check what was saved
npm run check:test-article

# Check overall ManTech status
npm run check:mantech
```

## What to Do After Rescraping

1. Run the data quality check SQL above
2. Share the results so we can verify the improvements
3. If needed, we can fine-tune the extraction patterns further

