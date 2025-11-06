# Congressional Stock Trades Tracker

> Track congressional stock trades from official government sources and correlate with DoD contracts

## 🎯 What This Is

A complete system to monitor stock trades by members of Congress, with a focus on defense-related committees. Completely **FREE** using official government data sources.

## 📦 Quick Links

- **Fast Start**: [CONGRESSIONAL_TRADES_QUICKSTART.md](./CONGRESSIONAL_TRADES_QUICKSTART.md)
- **Full Setup**: [CONGRESSIONAL_TRADES_SETUP.md](./CONGRESSIONAL_TRADES_SETUP.md)
- **Complete Guide**: [CONGRESSIONAL_TRADES_COMPLETE_GUIDE.md](./CONGRESSIONAL_TRADES_COMPLETE_GUIDE.md)
- **Implementation**: [CONGRESSIONAL_TRADES_IMPLEMENTATION_SUMMARY.md](./CONGRESSIONAL_TRADES_IMPLEMENTATION_SUMMARY.md)

## 🚀 Quick Start (3 Commands)

```bash
# 1. Install dependencies
./setup-congressional-trades.sh

# 2. Set up database
psql $DATABASE_URL -f supabase/migrations/create_congressional_trades.sql

# 3. Run historical backfill (takes 1-2 hours)
npm run scrape:congress-trades:historical
```

## 📊 What You Get

### Data Coverage
- **Years**: 2012-present (electronic filing era)
- **Members**: ~100 defense-related committee members
- **Trades**: 10,000-50,000 historical transactions
- **Contractors**: 20+ major defense companies pre-loaded

### Key Features
- ✅ Historical backfill from 2012
- ✅ Daily automated updates
- ✅ STOCK Act compliance tracking
- ✅ Correlation with DoD contracts
- ✅ Suspicious pattern detection
- ✅ Pre-built analysis queries
- ✅ 100% free (no API costs)

## 📁 File Structure

```
PropShop_AI_Website/
├── scripts/
│   └── scrape_congress_trades.py        # Python scraper (400+ lines)
├── src/lib/
│   └── congressional-trades-scraper.ts  # TypeScript controller (400+ lines)
├── supabase/migrations/
│   └── create_congressional_trades.sql  # Database schema (500+ lines)
├── requirements.txt                      # Python dependencies
├── setup-congressional-trades.sh         # One-command setup
├── check-congress-status.ts              # Status checker
├── congressional-trades-cron.example     # Cron templates
├── CHECK_CONGRESS_DATA_QUALITY.sql       # Quality check queries
├── CONGRESSIONAL_TRADES_QUICKSTART.md    # 5-minute start guide
├── CONGRESSIONAL_TRADES_SETUP.md         # Full documentation
├── CONGRESSIONAL_TRADES_COMPLETE_GUIDE.md # Comprehensive guide
├── CONGRESSIONAL_TRADES_IMPLEMENTATION_SUMMARY.md # What was built
└── CONGRESSIONAL_TRADES_README.md        # This file
```

## 💻 NPM Scripts

```json
{
  "scrape:congress-trades:historical": "Full backfill (2012-present)",
  "scrape:congress-trades:daily": "Daily updates (current year only)",
  "check:congress-trades": "Status checker and stats"
}
```

## 🗄️ Database Schema

### Tables
1. **congressional_stock_trades** - Main trades data
2. **congressional_members** - Member reference
3. **defense_contractors_tickers** - 20+ defense stocks

### Views
1. **defense_stock_trades** - All defense trades with details
2. **recent_defense_trades** - Last 90 days
3. **suspicious_trade_patterns** - Coordinated trading

### Functions
1. **get_congressional_trades_stats()** - System statistics
2. **find_trades_before_contracts()** - Contract correlation

## 🔍 Top Queries

### Check Status
```bash
npm run check:congress-trades
```

### Recent Defense Trades
```sql
SELECT * FROM recent_defense_trades LIMIT 20;
```

### Trades Before Contracts
```sql
SELECT * FROM find_trades_before_contracts(90, 30) LIMIT 20;
```

### Suspicious Patterns
```sql
SELECT * FROM suspicious_trade_patterns LIMIT 10;
```

### STOCK Act Violations
```sql
SELECT * FROM congressional_stock_trades
WHERE (disclosure_date - transaction_date) > 45
ORDER BY (disclosure_date - transaction_date) DESC;
```

## 🎯 Use Cases

1. **Conflict Detection**: Identify trades by members who oversee those companies
2. **Timing Analysis**: Find trades before major contract announcements
3. **Compliance Monitoring**: Track STOCK Act violations
4. **Pattern Recognition**: Detect coordinated trading
5. **Competitive Intel**: Understand congressional interest in defense stocks

## 🛠️ Technology Stack

- **Python 3.8+**: Scraping engine
- **CapitolGains**: Official disclosure parser
- **Playwright**: Browser automation
- **TypeScript**: Controller & orchestration
- **PostgreSQL**: Data storage
- **Supabase**: Database platform

## 📈 Performance

- **Historical backfill**: 1-2 hours (one-time)
- **Daily updates**: 2-5 minutes (automated)
- **Query speed**: <100ms (simple), 200-500ms (complex)
- **Storage**: ~50-100 MB total

## 🔗 Data Sources

All data from official government sources:
- House: https://disclosures-clerk.house.gov/
- Senate: https://efdsearch.senate.gov/

No API keys required. No terms of service violations. 100% legal.

## 🐛 Troubleshooting

### Setup Issues
```bash
# Reinstall dependencies
pip install -r requirements.txt
playwright install --with-deps
```

### No Data
```bash
# Test scraper directly
python3 scripts/scrape_congress_trades.py --mode daily

# Check logs
npm run check:congress
```

### Slow Performance
```
Normal! Government sites are rate-limited.
Historical: 1-2 hours expected
Daily: 2-5 minutes expected
```

## 📚 Documentation

1. **[QUICKSTART](./CONGRESSIONAL_TRADES_QUICKSTART.md)** - Get running in 5 minutes
2. **[SETUP](./CONGRESSIONAL_TRADES_SETUP.md)** - Full technical documentation
3. **[COMPLETE GUIDE](./CONGRESSIONAL_TRADES_COMPLETE_GUIDE.md)** - All features & queries
4. **[IMPLEMENTATION](./CONGRESSIONAL_TRADES_IMPLEMENTATION_SUMMARY.md)** - What was built

## 🎉 Getting Started

1. Read [QUICKSTART](./CONGRESSIONAL_TRADES_QUICKSTART.md)
2. Run setup script
3. Apply database migration
4. Start historical backfill
5. Set up daily cron
6. Explore the data!

## 💡 Key Insights

After setup, you can:
- Find trades before contract awards
- Track STOCK Act compliance
- Identify suspicious patterns
- Monitor committee member activity
- Correlate with appropriations bills

## 🤝 Contributing

To expand coverage:
1. Edit `scripts/scrape_congress_trades.py`
2. Add members to `get_defense_house_members()` or `get_defense_senators()`
3. Add new defense contractors to `defense_contractors_tickers` table

## 📞 Support

- **Status**: `npm run check:congress`
- **Logs**: `tail -f /var/log/congress-trades.log`
- **Test**: `python3 scripts/scrape_congress_trades.py --mode daily`

## 🎯 Next Steps

1. ✅ Run setup
2. ✅ Start backfill
3. ✅ Check status
4. ✅ Explore queries
5. ✅ Set up cron
6. ✅ Integrate with UI

---

**Ready to start? See [CONGRESSIONAL_TRADES_QUICKSTART.md](./CONGRESSIONAL_TRADES_QUICKSTART.md)**

