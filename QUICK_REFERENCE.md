# Congressional Trades - Quick Reference

## 🎯 Current Status

**✅ COMPLETE:** House trades scraper (511 trades in database)  
**⏳ TODO:** Senate trades scraper (HTML-based, see SENATE_SCRAPER_PROMPT.md)

## 📊 Check Database

```sql
SELECT COUNT(*) FROM congressional_stock_trades;
-- Should show: 511
```

## 🚀 Run Scrapers

**House (daily updates):**
```bash
npm run scrape:congress-trades:daily
```

**House (historical - already done):**
```bash
npm run scrape:congress-trades:historical
```

**Check status:**
```bash
npm run check:congress-trades
```

## 📁 Key Files

| File | Purpose |
|------|---------|
| `scripts/scrape_congress_trades.py` | Main Python scraper |
| `scripts/pdf_parser.py` | PDF parsing logic |
| `scripts/pdf_downloader.py` | PDF download & caching |
| `src/lib/congressional-trades-scraper.ts` | TypeScript wrapper |
| `supabase/migrations/create_congressional_trades.sql` | Database schema |

## 🔍 Useful Queries

**All trades:**
```sql
SELECT * FROM congressional_stock_trades ORDER BY transaction_date DESC LIMIT 10;
```

**Defense trades:**
```sql
SELECT * FROM defense_stock_trades LIMIT 10;
```

**Member stats:**
```sql
SELECT * FROM get_congressional_trades_stats();
```

**Trades before contracts:**
```sql
SELECT * FROM find_trades_before_contracts(30);
```

## 📝 npm Commands

```bash
npm run scrape:congress-trades:historical  # Full 2012-2025 scrape
npm run scrape:congress-trades:daily       # Just current year
npm run check:congress-trades              # Check status
```

## 🐛 Troubleshooting

**No data appearing?**
- Check logs: `tail -f logs/congress-trades-*.log`
- Verify PDFs being downloaded: `ls pdf_cache/`
- Run test: `python3 scripts/pdf_parser.py`

**Unicode errors?**
- Already fixed in current version
- Data cleaning applied automatically

**Want to re-scrape?**
- Delete cache: `rm -rf pdf_cache/`
- Run scraper again: `npm run scrape:congress-trades:historical`

## 🎯 Next Steps

To add Senate trades, start a new Cursor conversation with the prompt in:
**`SENATE_SCRAPER_PROMPT.md`**

## 📚 Documentation

- `HOUSE_TRADES_COMPLETE.md` - Full summary of what was built
- `CONGRESSIONAL_TRADES_README.md` - Complete documentation
- `PDF_PARSER_SUCCESS.md` - Implementation details
- `SENATE_SCRAPER_PROMPT.md` - Prompt for new conversation to build Senate scraper


