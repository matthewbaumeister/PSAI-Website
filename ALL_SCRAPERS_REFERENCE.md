# All Scrapers - Quick Reference

Complete list of all data scrapers in your system with their commands.

## 📊 All NPM Scripts

```bash
# Army Innovation (XTECH Competitions)
npm run scrape:army-innovation:historical    # One-time: All competitions
npm run scrape:army-innovation:active        # Daily: Active competitions only

# Congressional Stock Trades
npm run scrape:congress-trades:historical    # One-time: 2012-present stock trades
npm run scrape:congress-trades:daily         # Daily: Current year stock trades
npm run check:congress-trades                # Status checker

# DOD ManTech Projects (NEW)
npm run scrape:mantech:news                  # Daily: Recent news articles
npm run scrape:mantech:historical            # One-time: Historical backfill
npm run check:mantech                        # Status checker

# Company Intelligence
npm run enrich-companies                     # Enrich company data
npm run update-companies:daily               # Daily company updates
```

## 🗄️ Database Tables by Scraper

### Congressional Bills (congress-gov-scraper.ts)
- `congressional_bills`
- `congressional_actions`
- `congressional_cosponsors`
- `congress_scraper_log`

### Congressional Stock Trades (congressional-trades-scraper.ts)
- `congressional_stock_trades`
- `congressional_members`
- `defense_contractors_tickers`
- `congressional_trades_scraper_log`

### Army Innovation (army-xtech-scraper.ts)
- `army_innovation_opportunities`
- `army_innovation_submissions`
- `army_innovation_scraper_log`

### FPDS Contracts
- `fpds_contracts`
- `fpds_scraper_log`

### SAM.gov
- `sam_gov_opportunities`
- `sam_gov_scraper_log`

### DoD News
- `dod_contract_news`
- `dod_news_scraper_log`

### DOD ManTech Projects (NEW)
- `mantech_projects`
- `mantech_company_mentions`
- `mantech_scraper_log`

### SBIR/STTR
- `sbir_final`
- `sbir_scraper_log`

## 🎯 Quick Command Cheat Sheet

| What do you want? | Command |
|-------------------|---------|
| Army XTECH competitions (all time) | `npm run scrape:army-innovation:historical` |
| Army XTECH active only | `npm run scrape:army-innovation:active` |
| Congressional stock trades (2012+) | `npm run scrape:congress-trades:historical` |
| Congressional stock trades (today) | `npm run scrape:congress-trades:daily` |
| Check stock trades status | `npm run check:congress-trades` |
| **ManTech news (recent)** | **`npm run scrape:mantech:news`** |
| **ManTech historical backfill** | **`npm run scrape:mantech:historical`** |
| **Check ManTech status** | **`npm run check:mantech`** |
| Enrich company data | `npm run enrich-companies` |
| Update companies daily | `npm run update-companies:daily` |

## 📅 Recommended Cron Schedule

```bash
# Daily at 3 AM
0 3 * * * npm run scrape:congress-trades:daily
0 3 * * * npm run scrape:army-innovation:active
0 3 * * * npm run scrape:mantech:news
0 3 * * * npm run update-companies:daily

# Weekly on Sundays
0 2 * * 0 npm run enrich-companies
```

## 🔍 Check Status Commands

```bash
# Congressional stock trades
npm run check:congress-trades

# ManTech projects
npm run check:mantech

# Or check database directly
psql $DATABASE_URL -c "SELECT * FROM congressional_trades_scraper_log ORDER BY started_at DESC LIMIT 5;"
psql $DATABASE_URL -c "SELECT * FROM mantech_scraper_log ORDER BY started_at DESC LIMIT 5;"
psql $DATABASE_URL -c "SELECT * FROM army_innovation_scraper_log ORDER BY started_at DESC LIMIT 5;"
psql $DATABASE_URL -c "SELECT * FROM congress_scraper_log ORDER BY started_at DESC LIMIT 5;"
```

## 📁 Scraper Files Location

```
src/lib/
├── army-xtech-scraper.ts                    # Army XTECH competitions
├── congress-gov-scraper.ts                  # Congressional bills/legislation
├── congressional-trades-scraper.ts          # Congressional stock trades
├── dod-news-scraper.ts                      # DoD contract news
├── dsip-scraper.ts                          # DSIP data
├── fpds-scraper.ts                          # FPDS contracts (daily)
├── fpds-scraper-full.ts                     # FPDS contracts (full)
├── fpds-transactions-scraper.ts             # FPDS modifications
├── mantech-scraper.ts                       # DOD ManTech projects (NEW)
├── sam-gov-opportunities-scraper.ts         # SAM.gov opportunities
└── sbir-awards-scraper.ts                   # SBIR/STTR awards
```

## 🎯 What's Different?

### Before (Confusing)
```bash
npm run scrape:congress:historical  # Which congress? Bills or trades?
```

### After (Clear)
```bash
npm run scrape:congress:historical        # Congressional BILLS (if you have this)
npm run scrape:congress-trades:historical # Congressional STOCK TRADES (new)
```

## 🚀 One-Time Setup Commands

```bash
# Congressional Stock Trades (NEW)
./setup-congressional-trades.sh
psql $DATABASE_URL -f supabase/migrations/create_congressional_trades.sql
npm run scrape:congress-trades:historical

# Army Innovation
# (whatever setup you already have)

# Companies
# (whatever setup you already have)
```

## 💡 Pro Tips

1. **Historical vs Daily**
   - `historical` = One-time backfill, long running
   - `daily/active` = Quick incremental updates

2. **Check Logs**
   ```bash
   # View all scraper logs
   psql $DATABASE_URL -f CHECK_SCRAPER_LOGS.sql
   
   # Check specific scraper
   psql $DATABASE_URL -f CHECK_CONGRESSIONAL_TRADES_LOG.sql
   ```

3. **Monitor Status**
   ```bash
   npm run check:congress-trades
   ```

---

**Now you have clear, non-conflicting names for all scrapers!**

