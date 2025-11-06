# Congressional Trades - Naming Fixed

## ✅ Issue Resolved: Naming Conflict

### Problem
You already have `congress-gov-scraper.ts` that scrapes congressional **BILLS/legislation** from congress.gov. 

The new stock trades scraper was using conflicting names:
- ❌ `npm run scrape:congress:historical` - Ambiguous! Bills or trades?
- ❌ `npm run scrape:congress:daily` - Ambiguous!
- ❌ `npm run check:congress` - Ambiguous!

### Solution: Clear Separation

**Congressional Bills (existing):**
- File: `src/lib/congress-gov-scraper.ts`
- Scrapes: Bills, resolutions, legislative actions
- Commands: (whatever you already have set up)

**Congressional Stock Trades (new):**
- File: `src/lib/congressional-trades-scraper.ts`
- Scrapes: Member stock trades from House/Senate disclosures
- Commands: Now clearly named with `-trades`

## 📝 New Command Names

### Stock Trades Commands

```bash
# Historical backfill (2012-present)
npm run scrape:congress-trades:historical

# Daily updates
npm run scrape:congress-trades:daily

# Check status
npm run check:congress-trades
```

### All Your Scrapers

```bash
# Army Innovation (XTECH competitions)
npm run scrape:army-innovation:historical
npm run scrape:army-innovation:active

# Congressional Stock Trades (NEW)
npm run scrape:congress-trades:historical
npm run scrape:congress-trades:daily
npm run check:congress-trades

# Congressional Bills (existing - via congress-gov-scraper.ts)
# Whatever commands you already have

# Company Intelligence
npm run enrich-companies
npm run update-companies:daily
```

## 🎯 Clear Naming Convention

| Scraper | Type | Historical | Daily/Active | Status |
|---------|------|------------|--------------|--------|
| Army XTECH | Competitions | `army-innovation:historical` | `army-innovation:active` | - |
| Congress Bills | Legislation | (your existing commands) | (your existing) | - |
| **Congress Trades** | **Stock Trades** | **`congress-trades:historical`** | **`congress-trades:daily`** | **`check:congress-trades`** |
| Companies | Intelligence | `enrich-companies` | `update-companies:daily` | - |

## ✅ Updated Files

All documentation now uses correct names:

1. **package.json** - NPM scripts renamed
2. **CONGRESSIONAL_TRADES_QUICKSTART.md** - All commands updated
3. **CONGRESSIONAL_TRADES_README.md** - All references updated
4. **CONGRESSIONAL_TRADES_SETUP.md** - Commands corrected
5. **CONGRESSIONAL_TRADES_COMPLETE_GUIDE.md** - Examples fixed
6. **supabase/migrations/create_congressional_trades.sql** - Instructions updated
7. **congressional-trades-cron.example** - Cron jobs updated

## 🚀 How to Use

### Initial Setup

```bash
# 1. Install dependencies
./setup-congressional-trades.sh

# 2. Apply migration
psql $DATABASE_URL -f supabase/migrations/create_congressional_trades.sql

# 3. Run historical backfill (stock trades 2012-present)
npm run scrape:congress-trades:historical
```

### Daily Automation

```bash
# Add to crontab
crontab -e

# Congressional STOCK TRADES - daily at 3 AM
0 3 * * * cd /path/to/project && npm run scrape:congress-trades:daily >> /var/log/congress-trades.log 2>&1
```

### Check Status

```bash
# Check congressional STOCK TRADES status
npm run check:congress-trades
```

## 📊 What Each System Does

### congress-gov-scraper.ts (Existing)
- **What**: Congressional bills, resolutions, legislative actions
- **Source**: congress.gov API
- **Data**: Bill text, sponsors, cosponsors, votes, status
- **Tables**: `congressional_bills`, `congressional_actions`, etc.

### congressional-trades-scraper.ts (New)
- **What**: Stock trades by members of Congress
- **Source**: House/Senate financial disclosures
- **Data**: Trades, tickers, amounts, dates, filings
- **Tables**: `congressional_stock_trades`, `congressional_members`, etc.

## 🎉 No More Confusion!

Now it's crystal clear:
- `congress` = Bills/legislation from congress.gov
- `congress-trades` = Stock trades by members
- `army-innovation` = XTECH competitions
- `companies` = Company intelligence

---

**Everything is updated and ready to use with the new names!**

