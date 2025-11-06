# Apply Congressional Trades Migration - DO THIS NOW

## 🚨 Action Required

Your browser should have opened to the Supabase SQL editor. If not, click here:

**https://supabase.com/dashboard/project/reprsoqodhmpdoiajhst/sql/new**

## 📋 Steps (2 minutes)

### Step 1: Copy SQL

The SQL file is ready at:
```
TEMP_MIGRATION_TO_COPY.sql
```

**OR** copy from:
```
supabase/migrations/create_congressional_trades.sql
```

### Step 2: Paste & Run

1. Open the Supabase SQL editor (should be open in your browser)
2. Copy ALL contents of the SQL file
3. Paste into the editor
4. Click "RUN" button

### Step 3: Verify Success

You should see output like:
```
NOTICE: ============================================
NOTICE: Congressional Trades Schema Created!
NOTICE: ============================================
NOTICE:  
NOTICE: Next steps:
NOTICE: 1. Install Python dependencies:
NOTICE:    pip install -r requirements.txt
NOTICE:    playwright install
NOTICE:  
NOTICE: 2. Run historical backfill (2012-present):
NOTICE:    npm run scrape:congress-trades:historical
```

## ✅ What Gets Created

### Tables (3)
1. **congressional_stock_trades** - Main data table
2. **congressional_trades_scraper_log** - Scraper tracking
3. **defense_contractors_tickers** - Pre-loaded with 20+ defense stocks

### Views (3)
1. **defense_stock_trades** - All defense trades with details
2. **recent_defense_trades** - Last 90 days
3. **suspicious_trade_patterns** - Coordinated trading detection

### Functions (2)
1. **get_congressional_trades_stats()** - System statistics
2. **find_trades_before_contracts()** - Contract correlation

### Indexes (7+)
- Fast lookups by member, ticker, date, chamber, etc.

## 🧪 Test After Migration

Run this command to verify everything works:

```bash
npx tsx test-congressional-trades-schema.ts
```

Should show:
```
✅ Table congressional_stock_trades exists
✅ Table congressional_trades_scraper_log exists
✅ Table defense_contractors_tickers exists
   Pre-loaded tickers: 20
   Sample: LMT, RTX, BA
✅ View defense_stock_trades exists
✅ Function get_congressional_trades_stats exists
```

## 📊 Check Data Quality

After migration, run:

```bash
psql $DATABASE_URL -f CHECK_CONGRESS_DATA_QUALITY.sql
```

This will show:
- Overall stats (should be 0 initially)
- Tables structure
- Pre-loaded defense contractors

## 🚀 Next Step - Historical Scraper

Once migration is verified, you'll run:

```bash
npm run scrape:congress-trades:historical
```

This will:
- Scrape 2012-2024 (12 years)
- Take 1-2 hours
- Get 10,000-50,000 trades
- Focus on ~100 defense committee members

## ⚠️ Common Issues

### Issue: "Relation already exists"
**Solution:** Tables already created, you're good! Run test script to verify.

### Issue: "Permission denied"
**Solution:** Make sure you're logged into Supabase dashboard with admin access.

### Issue: "Syntax error"
**Solution:** Make sure you copied the ENTIRE SQL file, including the last line.

## 💡 Pro Tip

You can also view the SQL in the editor to see what it's creating before running it.

---

**Once you've run the SQL, come back here and run the test script!**

```bash
npx tsx test-congressional-trades-schema.ts
```

