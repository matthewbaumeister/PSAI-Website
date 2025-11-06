# Congressional Trades Monthly Cron Job Setup

## 📅 Schedule: 15th of Every Month at 2 AM

Updates congressional stock trades by scraping the current year + previous year (to catch late filings).

## 🚀 Quick Setup

### 1. Manual Test First

```bash
npm run test:congress-trades:monthly
```

This will:
- Scrape current year + previous year
- Update database with new trades
- Create log file in `logs/congress-monthly-*.log`
- Take ~10-20 minutes

### 2. Check Results

```sql
-- In Supabase, check for new trades
SELECT 
    COUNT(*) as total_trades,
    MAX(scraped_at) as last_update,
    COUNT(*) FILTER (WHERE scraped_at > NOW() - INTERVAL '1 hour') as new_today
FROM congressional_stock_trades;
```

### 3. Add to Crontab

```bash
crontab -e
```

Add this line:
```bash
# Congressional Trades - Monthly update on 15th at 2 AM
0 2 15 * * cd /Users/matthewbaumeister/Documents/PropShop_AI_Website && ./scripts/scrape_congress_trades_monthly.sh
```

### 4. Verify Cron Job

```bash
# List your cron jobs
crontab -l | grep congress

# Check cron logs (macOS)
log show --predicate 'process == "cron"' --info --last 1d | grep congress
```

## 📊 What It Does

**Scrapes:**
- Current year (e.g., 2025)
- Previous year (e.g., 2024)
- Only defense committee members (House)
- ~10-50 new trades per month expected

**Updates:**
- Inserts new trades
- Updates existing trades if changed
- Skips duplicates automatically
- Logs everything to `logs/congress-monthly-*.log`

## ⏱️ Timing Options

Choose the time that works best:

```bash
# 2:00 AM (recommended - low traffic)
0 2 15 * * cd /path/to/project && ./scripts/scrape_congress_trades_monthly.sh

# 8:00 AM (business hours start)
0 8 15 * * cd /path/to/project && ./scripts/scrape_congress_trades_monthly.sh

# 2:00 PM (midday)
0 14 15 * * cd /path/to/project && ./scripts/scrape_congress_trades_monthly.sh

# 8:00 PM (evening)
0 20 15 * * cd /path/to/project && ./scripts/scrape_congress_trades_monthly.sh
```

## 🔍 Monitoring

### Check Last Run

```bash
# See most recent monthly log
ls -lt logs/congress-monthly-*.log | head -1

# View last run
tail -50 logs/congress-monthly-*.log | tail -20
```

### Check Success

```bash
# Look for success message
grep "completed successfully" logs/congress-monthly-*.log | tail -1
```

### Database Check

```sql
-- Recent scrapes
SELECT 
    scrape_type,
    date_range,
    status,
    records_inserted,
    started_at
FROM congressional_trades_scraper_log
ORDER BY started_at DESC
LIMIT 5;
```

## 🚨 Error Handling

The script will:
- ✅ Continue on individual PDF failures
- ✅ Log all errors to log file
- ✅ Exit with error code if scraper fails
- ✅ Keep database in consistent state

**If it fails:**
1. Check log file: `logs/congress-monthly-*.log`
2. Run manual test: `npm run test:congress-trades:monthly`
3. Check database connection in `.env.local`

## 📧 Optional: Email Notifications

Add to the script (`scrape_congress_trades_monthly.sh`):

```bash
# On success
if [ $SCRAPER_EXIT -eq 0 ]; then
    echo "Congressional trades updated" | mail -s "✅ Congress Trades Update" you@email.com
fi

# On failure
else
    echo "Check logs at $LOG_FILE" | mail -s "❌ Congress Trades FAILED" you@email.com
fi
```

## 🔄 Integration with Other Cron Jobs

Your existing cron jobs (reference):
```bash
# FPDS contracts
0 2 * * * cd /path && ./scripts/fpds_scraper.sh

# Congressional bills/actions
0 3 * * * cd /path && ./scripts/congress_bills.sh

# Congressional trades (NEW)
0 2 15 * * cd /path && ./scripts/scrape_congress_trades_monthly.sh
```

**Timing logic:**
- FPDS: Daily at 2 AM (contracts update daily)
- Bills: Daily at 3 AM (legislation updates daily)
- **Trades: Monthly on 15th at 2 AM** (PTRs filed within 45 days)

## 📈 Expected Results

**Per month:**
- New trades: 10-50 depending on activity
- Updated trades: 5-10 (corrections/amendments)
- Duration: 10-20 minutes
- Log size: 50-200 KB

**Why 15th of month?**
- Members have 45 days to file PTRs
- Most file mid-month
- Catches previous month's late filings

## 🎯 Next Steps After Testing

1. **Test manually:**
   ```bash
   npm run test:congress-trades:monthly
   ```

2. **Verify data quality:**
   ```sql
   SELECT COUNT(*) FROM congressional_stock_trades;
   ```

3. **Add to crontab:**
   ```bash
   crontab -e
   # Add the cron line
   ```

4. **Mark calendar:**
   - Check logs on 16th of each month
   - Verify new trades were added

## 🚀 Vercel Deployment (Optional)

If you want to run this on Vercel instead of local cron:

### Option 1: Vercel Cron
Add to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/congress-trades",
    "schedule": "0 2 15 * *"
  }]
}
```

Create API route at `pages/api/cron/congress-trades.ts`:
```typescript
import { CongressionalTradesScraper } from '@/lib/congressional-trades-scraper';

export default async function handler(req, res) {
  // Verify cron secret
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const scraper = new CongressionalTradesScraper();
    const currentYear = new Date().getFullYear();
    const prevYear = currentYear - 1;
    
    // Scrape last 2 years
    await scraper.scrapeHistoricalTrades(prevYear);
    
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

### Option 2: GitHub Actions (Recommended)
Create `.github/workflows/congress-trades-monthly.yml`:
```yaml
name: Congressional Trades Monthly Update

on:
  schedule:
    - cron: '0 2 15 * *'  # 15th of month at 2 AM UTC
  workflow_dispatch:  # Manual trigger

jobs:
  update-trades:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - uses: actions/setup-python@v4
        with:
          python-version: '3.9'
      
      - name: Install dependencies
        run: |
          npm install
          pip install -r requirements.txt
          playwright install
      
      - name: Run scraper
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
        run: npm run scrape:congress-trades:monthly
```

---

## ✅ Checklist

- [ ] Test manually: `npm run test:congress-trades:monthly`
- [ ] Verify database has new data
- [ ] Check log file looks good
- [ ] Add to crontab
- [ ] Wait for 15th to verify automatic run
- [ ] (Optional) Set up email notifications
- [ ] (Optional) Deploy to Vercel/GitHub Actions

**Once tested and working, it will run automatically on the 15th of every month!**

