

# 🚀 DoD Contract News - Production Scraper Setup

## ✨ Features

✅ **Year-based scraping** - Scrape all contracts from 2025 (or any year)
✅ **Auto-resume** - Crashes? No problem. Restarts from last checkpoint.
✅ **Progress tracking** - Saves progress every 5 articles
✅ **Retry logic** - 3 retries with exponential backoff
✅ **Rate limiting** - 2s between articles, 5s between pages
✅ **Error handling** - Comprehensive logging
✅ **tmux support** - Run in background, detach/reattach anytime
✅ **Detailed logging** - All activity logged to `scraper.log`

---

## 📋 Prerequisites

1. **tmux** (for background running)
   ```bash
   brew install tmux
   ```

2. **Node.js** dependencies (already installed)

3. **Environment variables** (already set in `.env`)

---

## 🎯 Quick Start

### **Option 1: Run in tmux (Recommended)**

```bash
# Make script executable (first time only)
chmod +x run-scraper-tmux.sh

# Start scraping 2025
./run-scraper-tmux.sh 2025

# Or scrape a different year
./run-scraper-tmux.sh 2024
```

**tmux Commands:**
- **Detach** (keep running): `Ctrl+B`, then `D`
- **Reattach**: `tmux attach -t dod-scraper-2025`
- **Kill session**: `tmux kill-session -t dod-scraper-2025`

### **Option 2: Run Directly** (stays in terminal)

```bash
# Scrape 2025
npx tsx scrape-dod-year.ts 2025

# Or scrape 2024
npx tsx scrape-dod-year.ts 2024
```

---

## 📊 Monitoring Progress

### **1. Check Logs (Real-time)**

```bash
# Follow log file
tail -f scraper.log

# Search for errors
grep ERROR scraper.log

# Count successes
grep "✅" scraper.log | wc -l
```

### **2. Check Checkpoint File**

```bash
# View current progress
cat scraper-checkpoint.json
```

Example output:
```json
{
  "year": 2025,
  "totalArticles": 150,
  "successfulArticles": 145,
  "failedArticles": 5,
  "lastProcessedUrl": "https://...",
  "lastUpdated": "2025-01-15T10:30:00Z"
}
```

### **3. Check Database**

```sql
-- In Supabase SQL Editor
SELECT 
  service_branch,
  COUNT(*) as contracts,
  SUM(award_amount)::NUMERIC(15,2) as total_value
FROM dod_contract_news
WHERE EXTRACT(YEAR FROM published_date) = 2025
GROUP BY service_branch;
```

---

## 🔄 Resume After Crash/Stop

**The scraper automatically resumes from the last checkpoint!**

Just run the same command again:
```bash
./run-scraper-tmux.sh 2025
```

It will:
1. Load `scraper-checkpoint.json`
2. Skip already processed articles
3. Continue from where it left off

---

## ⚙️ Configuration

Edit `scrape-dod-year.ts` to customize:

```typescript
const CONFIG = {
  // Rate limiting
  DELAY_BETWEEN_ARTICLES: 2000,  // 2 seconds
  DELAY_BETWEEN_PAGES: 5000,     // 5 seconds
  DELAY_ON_ERROR: 10000,          // 10 seconds
  
  // Retries
  MAX_RETRIES: 3,
  RETRY_DELAY: 5000,
  
  // Files
  CHECKPOINT_FILE: './scraper-checkpoint.json',
  LOG_FILE: './scraper.log'
};
```

---

## 📈 Expected Performance

| Metric | Value |
|--------|-------|
| **Articles per minute** | ~20-30 (with rate limiting) |
| **Contracts per hour** | ~1,200-1,800 |
| **Full year (2025)** | ~2-4 hours (depends on volume) |
| **Success rate** | >95% (with retries) |

---

## 🐛 Troubleshooting

### **Issue: tmux session not found**
```bash
# List all sessions
tmux ls

# Reattach to session
tmux attach -t dod-scraper-2025
```

### **Issue: Scraper stuck on one article**
```bash
# In another terminal, check logs
tail -f scraper.log

# If truly stuck, kill and restart
tmux kill-session -t dod-scraper-2025
./run-scraper-tmux.sh 2025
```

### **Issue: Too many failures**
```bash
# Check error logs
grep "ERROR\|WARN" scraper.log | tail -20

# Increase retry delay in CONFIG
# Or check if defense.gov is blocking you
```

### **Issue: Out of memory**
```bash
# The scraper automatically closes browser between batches
# If still happening, reduce batch size or restart machine
```

---

## 🔍 Advanced Usage

### **Scrape Multiple Years**

```bash
# Run in separate tmux sessions
./run-scraper-tmux.sh 2025  # Session: dod-scraper-2025
./run-scraper-tmux.sh 2024  # Session: dod-scraper-2024
./run-scraper-tmux.sh 2023  # Session: dod-scraper-2023

# List all sessions
tmux ls

# Attach to specific year
tmux attach -t dod-scraper-2024
```

### **Re-scrape Failed Articles**

```bash
# Get failed URLs from checkpoint
cat scraper-checkpoint.json | jq '.failedUrls'

# Or manually scrape a specific article
npx tsx test-dod-single-article.ts https://...
```

### **Clear Progress and Start Fresh**

```bash
# Remove checkpoint
rm scraper-checkpoint.json

# Remove logs
rm scraper.log

# Start fresh
./run-scraper-tmux.sh 2025
```

---

## 📊 Post-Scrape Verification

After scraping completes, verify data quality:

```sql
-- Copy/paste in Supabase SQL Editor
-- VERIFY_COMPLETE_DATA_CAPTURE.sql
```

Check:
- ✅ Core fields: 100%
- ✅ Locations tracked
- ✅ Team relationships
- ✅ contract_types populated
- ✅ All weighted values calculated

---

## 🎯 Production Checklist

Before large-scale scraping:

- [ ] Test with single article: `npx tsx test-dod-single-article.ts`
- [ ] Verify database migrations applied
- [ ] Check Supabase connection working
- [ ] tmux installed
- [ ] Enough disk space (logs + checkpoints)
- [ ] Stable internet connection
- [ ] Run in tmux for resilience
- [ ] Monitor first 10 articles for errors

---

## 💡 Tips

1. **Run overnight** - Large years take hours, perfect for overnight
2. **Use tmux** - You can close your laptop, scraper keeps running
3. **Check logs periodically** - `tail -f scraper.log`
4. **Don't worry about crashes** - Auto-resume handles it
5. **Rate limiting is important** - Don't reduce too much or you'll get blocked

---

## 🚀 Let's Go!

```bash
# Make executable
chmod +x run-scraper-tmux.sh

# Start scraping!
./run-scraper-tmux.sh 2025

# Detach with: Ctrl+B, then D
# Check progress with: tail -f scraper.log
# Reattach with: tmux attach -t dod-scraper-2025
```

**Happy scraping!** 🎉

