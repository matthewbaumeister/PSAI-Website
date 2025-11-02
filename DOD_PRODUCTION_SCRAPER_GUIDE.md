# DoD Contract News - Production Scraper Guide

## 🚀 Overview

The production-grade DoD contract news scraper with FPDS-level redundancy and reliability.

### ✨ Key Features

- **Article-level progress tracking** - Never lose progress, resume from exact article
- **Smart upsert** - No duplicate key errors, automatically updates existing records
- **20 retry attempts** - Exponential backoff with 60s max delay
- **Date range support** - Scrape specific time periods (days, weeks, months, years)
- **Auto-resume** - Automatically resumes from where it left off
- **Comprehensive logging** - Track every article, contract, and error
- **tmux support** - Run for days/weeks without interruption

---

## 📋 Prerequisites

### 1. Database Setup

First, create the progress tracking table:

```bash
# Apply the migration in Supabase SQL Editor:
supabase/migrations/create_dod_article_progress.sql
```

Or run directly:

```sql
-- This table tracks scraping progress for each article
CREATE TABLE IF NOT EXISTS dod_article_progress (
  id BIGSERIAL PRIMARY KEY,
  article_id INTEGER NOT NULL,
  article_url TEXT NOT NULL,
  published_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  contracts_found INTEGER DEFAULT 0,
  contracts_inserted INTEGER DEFAULT 0,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_article UNIQUE (article_id, article_url)
);

CREATE INDEX idx_dod_article_progress_date ON dod_article_progress(published_date DESC);
CREATE INDEX idx_dod_article_progress_status ON dod_article_progress(status);
```

### 2. Environment Variables

Make sure `.env` exists with:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

---

## 🎯 Usage

### Quick Start

```bash
# Last 30 days (default)
./run-dod-scraper.sh

# Specific date range
./run-dod-scraper.sh 2025-11-01 2025-10-01

# Entire year (will run for days)
./run-dod-scraper.sh 2025-01-01 2024-01-01

# All available history
./run-dod-scraper.sh 2025-11-01 2000-01-01
```

### Without tmux

```bash
# Last 30 days
npx tsx scrape-dod-production.ts

# With date range
npx tsx scrape-dod-production.ts --start=2025-11-01 --end=2025-10-01
```

---

## 🎮 tmux Control

### Attach to Running Session

```bash
tmux attach -t dod-scraper
```

### Detach (Keep Running)

Inside the tmux session:
```
Ctrl+B, then press D
```

The scraper keeps running in the background!

### Stop Scraper

Inside the tmux session:
```
Ctrl+C
```

### Kill Session

```bash
tmux kill-session -t dod-scraper
```

### View All Sessions

```bash
tmux ls
```

---

## 📊 Monitoring Progress

### Check Progress in Real-Time

```sql
-- Overall progress
SELECT 
  status,
  COUNT(*) as articles,
  SUM(contracts_found) as total_contracts
FROM dod_article_progress
GROUP BY status
ORDER BY status;

-- Recent activity
SELECT 
  article_id,
  published_date,
  status,
  contracts_found,
  TO_CHAR(completed_at, 'YYYY-MM-DD HH24:MI:SS') as completed
FROM dod_article_progress
ORDER BY updated_at DESC
LIMIT 20;

-- Failed articles (need retry)
SELECT 
  article_id,
  article_url,
  error_message,
  retry_count
FROM dod_article_progress
WHERE status = 'failed'
ORDER BY published_date DESC;
```

### Daily Summary

```sql
SELECT 
  published_date,
  COUNT(*) as articles,
  COUNT(*) FILTER (WHERE status = 'completed') as completed,
  COUNT(*) FILTER (WHERE status = 'failed') as failed,
  SUM(contracts_found) as contracts
FROM dod_article_progress
GROUP BY published_date
ORDER BY published_date DESC
LIMIT 30;
```

---

## 🔄 Resume & Recovery

### Automatic Resume

The scraper automatically:
1. Checks if each article is already completed
2. Skips completed articles
3. Retries failed articles (up to 20 attempts)
4. Resumes from exactly where it left off

**Example:**

If you start scraping 2025-01-01 to 2024-01-01 and it crashes after 100 articles, just run the same command again:

```bash
./run-dod-scraper.sh 2025-01-01 2024-01-01
```

It will skip the 100 completed articles and continue with the rest!

### Manual Retry of Failed Articles

```sql
-- Reset failed articles to retry them
UPDATE dod_article_progress
SET 
  status = 'pending',
  retry_count = 0,
  error_message = NULL
WHERE status = 'failed';
```

Then re-run the scraper.

---

## 🛡️ Smart Upsert (No Duplicates)

The scraper uses **upsert** logic on the unique constraint:

```
article_id + contract_number = UNIQUE
```

This means:
- ✅ Running the same date range twice = No errors
- ✅ Overlapping date ranges = No duplicates
- ✅ Re-scraping = Updates existing records with latest data

**Example:**

```bash
# First run
./run-dod-scraper.sh 2025-11-01 2025-10-01

# Second run (overlaps) - NO ERRORS!
./run-dod-scraper.sh 2025-10-15 2025-09-01
```

---

## 📈 Performance

### Expected Speed

- **~2 seconds per article** (rate limiting)
- **~1,800 articles per hour**
- **~43,000 articles per day**

### Long-Running Jobs

For jobs that will run for days/weeks:

```bash
# Use tmux (recommended)
./run-dod-scraper.sh 2025-01-01 2000-01-01

# Detach with Ctrl+B then D
# Check back anytime with: tmux attach -t dod-scraper
```

---

## 🐛 Troubleshooting

### "supabaseUrl is required"

Missing environment variables. Check `.env` file:

```bash
cat .env | grep SUPABASE
```

### "Too many retry attempts"

API might be down. Check:

```sql
SELECT * FROM dod_article_progress WHERE status = 'failed' ORDER BY updated_at DESC LIMIT 10;
```

Wait 30 minutes and retry:

```bash
# Reset failed articles
UPDATE dod_article_progress SET status = 'pending' WHERE status = 'failed';

# Re-run scraper
./run-dod-scraper.sh
```

### Session Already Exists

```bash
# Kill the old session
tmux kill-session -t dod-scraper

# Start fresh
./run-dod-scraper.sh
```

### Slow Performance

Check your rate limits in `scrape-dod-production.ts`:

```typescript
await delay(2000); // 2 seconds between articles
```

Reduce to `1000` for faster scraping (but higher risk of blocks).

---

## 📋 Common Tasks

### Scrape Last Week

```bash
./run-dod-scraper.sh 2025-11-01 2025-10-25
```

### Scrape Last Month

```bash
./run-dod-scraper.sh 2025-11-01 2025-10-01
```

### Scrape Entire Year

```bash
# 2025
./run-dod-scraper.sh 2025-12-31 2025-01-01

# 2024
./run-dod-scraper.sh 2024-12-31 2024-01-01
```

### Scrape All Available Data

```bash
./run-dod-scraper.sh 2025-11-01 2000-01-01
```

⚠️ This will run for DAYS. Use tmux!

---

## 🎯 Best Practices

### For Long Runs

1. ✅ Use tmux (`./run-dod-scraper.sh`)
2. ✅ Monitor progress with SQL queries
3. ✅ Check back every few hours
4. ✅ Let it run overnight/weekend

### For Development/Testing

1. ✅ Use small date ranges (1-2 days)
2. ✅ Run without tmux for easier debugging
3. ✅ Check `dod_article_progress` table frequently

### For Production

1. ✅ Always use tmux
2. ✅ Set up monitoring/alerts (optional)
3. ✅ Review failed articles weekly
4. ✅ Re-run failed articles monthly

---

## 📊 Progress Queries

### Copy-Paste Ready Queries

**Overall Summary:**

```sql
SELECT 
  COUNT(*) as total_articles,
  COUNT(*) FILTER (WHERE status = 'completed') as completed,
  COUNT(*) FILTER (WHERE status = 'failed') as failed,
  COUNT(*) FILTER (WHERE status = 'processing') as in_progress,
  SUM(contracts_found) as total_contracts,
  ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'completed') / NULLIF(COUNT(*), 0), 1) || '%' as completion_rate
FROM dod_article_progress;
```

**By Date:**

```sql
SELECT 
  published_date,
  COUNT(*) as articles,
  SUM(contracts_found) as contracts,
  STRING_AGG(DISTINCT status, ', ') as statuses
FROM dod_article_progress
GROUP BY published_date
ORDER BY published_date DESC
LIMIT 30;
```

**Failed Articles:**

```sql
SELECT 
  article_id,
  article_url,
  published_date,
  error_message,
  retry_count
FROM dod_article_progress
WHERE status = 'failed'
ORDER BY retry_count DESC, published_date DESC;
```

---

## 🔥 Emergency Stop

If something goes wrong and you need to stop everything:

```bash
# Kill all tmux sessions
tmux kill-server

# Or just the dod-scraper session
tmux kill-session -t dod-scraper
```

---

## ✅ Success Checklist

Before starting a long run:

- [ ] `.env` file exists with correct Supabase credentials
- [ ] `dod_article_progress` table created
- [ ] `run-dod-scraper.sh` is executable (`chmod +x`)
- [ ] tmux is installed (`brew install tmux` on Mac)
- [ ] Date range is correct (start > end, backwards)
- [ ] Tested with small date range first

---

## 🎉 You're Ready!

```bash
# Start your first production run
./run-dod-scraper.sh 2025-11-01 2025-10-01

# Detach with: Ctrl+B then D
# Come back anytime with: tmux attach -t dod-scraper
```

Happy scraping! 🚀

