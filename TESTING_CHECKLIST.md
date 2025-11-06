# GitHub Actions Scrapers - Testing Checklist

## Quick Start: First Test

1. **Add GitHub Secrets** (see GITHUB_ACTIONS_MIGRATION_COMPLETE.md)
2. **Push code to GitHub**
3. **Test ONE scraper** manually via GitHub UI
4. **Verify email received**
5. **Check admin dashboard**
6. **Repeat for all scrapers**

---

## Test Commands

### Push to GitHub
```bash
cd /Users/matthewbaumeister/Documents/PropShop_AI_Website
git add .
git commit -m "Migrate all scrapers to GitHub Actions"
git push origin main
```

### Check GitHub Actions
```bash
open https://github.com/matthewbaumeister/PropShop_AI_Website/actions
```

### Check Admin Dashboard
```bash
open https://prop-shop.ai/admin/scrapers
```

---

## Testing Each Scraper

### 1. FPDS Contracts
- **Manual Test**: GitHub Actions → "FPDS Contracts Daily Scraper" → Run workflow
- **Expected Duration**: 3-5 minutes
- **Expected Email**: "FPDS Contract Awards Scraper Completed Successfully"
- **Database Check**: `SELECT COUNT(*) FROM fpds_contracts;`
- **Admin Page**: Should show new contracts inserted

### 2. Congress.gov Bills  
- **Manual Test**: GitHub Actions → "Congress.gov Bills Daily Scraper" → Run workflow
- **Expected Duration**: 2-4 minutes
- **Expected Email**: "Congress.gov Legislative Scraper Completed Successfully"
- **Database Check**: `SELECT COUNT(*) FROM congressional_bills;`
- **Admin Page**: Should show bills found/processed

### 3. SAM.gov Opportunities
- **Manual Test**: GitHub Actions → "SAM.gov Opportunities Daily Scraper" → Run workflow
- **Expected Duration**: 5-10 minutes
- **Expected Email**: "SAM.gov Opportunities Scraper Completed Successfully"
- **Database Check**: `SELECT COUNT(*) FROM sam_gov_opportunities;`
- **Admin Page**: Should show new opportunities

### 4. DOD Contract News
- **Manual Test**: GitHub Actions → "DOD Contract News Daily Scraper" → Run workflow
- **Expected Duration**: 2-3 minutes
- **Expected Email**: "DOD Contract News Scraper Completed Successfully"
- **Database Check**: `SELECT COUNT(*) FROM dod_contract_news;`
- **Admin Page**: Should show articles processed

### 5. DSIP/SBIR Opportunities
- **Manual Test**: GitHub Actions → "DSIP/SBIR Opportunities Daily Scraper" → Run workflow
- **Expected Duration**: 5-10 minutes
- **Expected Email**: "DSIP Opportunities Completed Successfully"
- **Database Check**: `SELECT COUNT(*) FROM sbir_final;`
- **Admin Page**: Should show active topics

### 6. Army xTech/Innovation
- **Manual Test**: GitHub Actions → "Army xTech Innovation Daily Scraper" → Run workflow
- **Expected Duration**: 2-3 minutes
- **Expected Email**: "Army XTECH Innovation Tracker Completed Successfully"
- **Database Check**: `SELECT COUNT(*) FROM army_innovation_opportunities;`
- **Admin Page**: Should show active competitions

### 7. ManTech Projects
- **Manual Test**: GitHub Actions → "ManTech Projects Daily Scraper" → Run workflow
- **Expected Duration**: 3-5 minutes
- **Expected Email**: "DOD ManTech Projects Scraper Completed Successfully"
- **Database Check**: `SELECT COUNT(*) FROM mantech_projects;`
- **Admin Page**: Should show articles scraped

### 8. Congressional Trades (House)
- **Manual Test**: GitHub Actions → "Congressional Trades Monthly Update" → Run workflow
- **Expected Duration**: 60-90 minutes (scrapes 2 years of data)
- **Expected Email**: "Congressional Stock Trades Scraper (House) Completed Successfully"
- **Database Check**: `SELECT COUNT(*) FROM congressional_stock_trades;`
- **Admin Page**: Should show trades inserted

---

## Admin Page Testing

### Test Manual Triggers

1. Go to https://prop-shop.ai/admin/scrapers
2. Click "Trigger Manually" on any scraper
3. Should see message: "Triggering [SCRAPER] via GitHub Actions..."
4. Check GitHub Actions page - workflow should be running
5. Wait for email notification
6. Refresh admin page - stats should update

### Expected Admin Page Display

Each scraper card should show:
- ✅ **Last Run**: Time since last run
- ✅ **Duration**: How long it took
- ✅ **Processed**: Total records processed
- ✅ **Inserted**: New records added
- ✅ **Updated**: Existing records updated
- ✅ **Errors**: Number of errors
- ✅ **Total Rows in DB**: Current database count
- ✅ **Total Data Points**: Estimated total fields
- ✅ **Status Badge**: Success/Failed/Running

---

## Verification SQL Queries

Run these in Supabase SQL Editor to verify data:

```sql
-- Check FPDS
SELECT COUNT(*) as total_contracts, 
       MAX(award_date) as latest_contract 
FROM fpds_contracts;

-- Check Congress.gov
SELECT COUNT(*) as total_bills, 
       MAX(introduced_date) as latest_bill 
FROM congressional_bills;

-- Check SAM.gov
SELECT COUNT(*) as total_opps, 
       MAX(posted_date) as latest_opp 
FROM sam_gov_opportunities;

-- Check DOD News
SELECT COUNT(*) as total_contracts, 
       MAX(published_date) as latest_article 
FROM dod_contract_news;

-- Check SBIR
SELECT COUNT(*) as total_topics, 
       COUNT(DISTINCT agency) as agencies,
       MAX(open_date) as latest_open 
FROM sbir_final 
WHERE solicitation_status = 'Open';

-- Check Army xTech
SELECT COUNT(*) as total_competitions,
       COUNT(*) FILTER (WHERE status = 'Active') as active 
FROM army_innovation_opportunities;

-- Check ManTech
SELECT COUNT(*) as total_projects,
       MAX(scraped_at) as latest_scrape 
FROM mantech_projects;

-- Check Congressional Trades
SELECT COUNT(*) as total_trades,
       COUNT(DISTINCT member_name) as members,
       MAX(transaction_date) as latest_trade 
FROM congressional_stock_trades;

-- Check all scraper logs
SELECT 
  'FPDS' as scraper, status, started_at 
FROM fpds_scraper_log 
ORDER BY started_at DESC LIMIT 1

UNION ALL

SELECT 
  'Congress' as scraper, status, started_at 
FROM congress_scraper_log 
ORDER BY started_at DESC LIMIT 1

UNION ALL

SELECT 
  'SAM.gov' as scraper, status, started_at 
FROM sam_gov_scraper_log 
ORDER BY started_at DESC LIMIT 1

UNION ALL

SELECT 
  'DOD News' as scraper, status, started_at 
FROM dod_news_scraper_log 
ORDER BY started_at DESC LIMIT 1

UNION ALL

SELECT 
  'SBIR' as scraper, status, started_at 
FROM sbir_scraper_log 
ORDER BY started_at DESC LIMIT 1

UNION ALL

SELECT 
  'Army xTech' as scraper, status, started_at 
FROM army_innovation_scraper_log 
ORDER BY started_at DESC LIMIT 1

UNION ALL

SELECT 
  'ManTech' as scraper, status, started_at 
FROM mantech_scraper_log 
ORDER BY started_at DESC LIMIT 1

UNION ALL

SELECT 
  'Congressional Trades' as scraper, status, started_at 
FROM congressional_trades_scraper_log 
ORDER BY started_at DESC LIMIT 1;
```

---

## Common Issues & Solutions

### Issue: "GitHub token not configured"
- **Solution**: Add `GITHUB_TOKEN` secret to GitHub Secrets

### Issue: "Unauthorized" when triggering from admin page
- **Solution**: Make sure you're logged in as admin user

### Issue: No email received
- **Solution**: 
  1. Check spam folder
  2. Verify `SENDGRID_API_KEY` is correct
  3. Verify `CRON_NOTIFICATION_EMAIL` is set to `matt@make-ready-consulting.com`

### Issue: Workflow fails with "secrets not found"
- **Solution**: Double-check all secrets are added to GitHub (case-sensitive)

### Issue: Database not updating
- **Solution**: 
  1. Check Supabase is accessible
  2. Verify `SUPABASE_SERVICE_ROLE_KEY` is correct
  3. Check scraper logs for SQL errors

---

## Success Criteria

After testing all 8 scrapers, you should have:

- ✅ 8 successful workflow runs in GitHub Actions
- ✅ 8 success emails received
- ✅ All `*_scraper_log` tables show `status = 'completed'`
- ✅ New data in all main tables
- ✅ Admin dashboard shows all scrapers with recent timestamps
- ✅ Manual triggers work from admin page
- ✅ "View GitHub Actions" button opens correct URL

---

## Testing Order (Recommended)

1. **Start Small**: Test DOD News first (fastest, simplest)
2. **Test API-based**: Congress.gov, SBIR (no browser needed)
3. **Test Browser-based**: Army xTech, ManTech (uses Playwright)
4. **Test Large Datasets**: FPDS, SAM.gov (take longer)
5. **Test Monthly**: Congressional Trades (takes 60-90 minutes)

---

## Daily Monitoring

Once all scrapers are working, monitor daily:

1. **Check inbox** for any failure emails
2. **Visit admin page** once per day to verify all green
3. **Check GitHub Actions** if you see failures
4. **Review Supabase** for data growth trends

---

## Next Steps After Testing

1. ✅ All 8 scrapers tested and working
2. ✅ Email notifications verified
3. ✅ Admin dashboard verified
4. 🎉 Let them run automatically!
5. 🗑️ (Optional) Clean up old Vercel cron endpoints

---

**Ready to test?** Start here: https://github.com/matthewbaumeister/PropShop_AI_Website/actions

