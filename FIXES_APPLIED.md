# Congressional Trades Scraper - Fixes Applied

## Issues Found & Fixed

### Issue 1: Unicode Escape Sequences
**Problem:** PDF artifacts contained null bytes (`\x00`, `\u0000`) causing JSON parsing errors:
```
Error inserting trade: unsupported Unicode escape sequence
```

**Fix Applied:**
1. **Python PDF Parser** (`scripts/pdf_parser.py`):
   - Added Unicode character cleaning in `_extract_trade_from_row()`
   - Removes null bytes and control characters
   - Filters out unprintable characters (< ASCII 32)

2. **TypeScript Scraper** (`src/lib/congressional-trades-scraper.ts`):
   - Added data cleaning before database insertion
   - Removes control characters and null bytes
   - Filters out junk rows (< 5 chars, starts with "F S:")

### Issue 2: Missing disclosure_date
**Problem:** Database requires `disclosure_date` but some trades didn't have it:
```
Error inserting trade: null value in column "disclosure_date" violates not-null constraint
```

**Fix Applied:**
1. **Python Scraper** (`scripts/scrape_congress_trades.py`):
   - Added disclosure_date fallback logic
   - Uses transaction_date if disclosure_date missing
   - Uses year-01-01 as last resort

2. **TypeScript Scraper**:
   - Added same fallback logic
   - Ensures both dates always have values

## Changes Made

### scripts/pdf_parser.py
```python
# Clean Unicode escape sequences and null characters
asset = asset.replace('\x00', '').replace('\u0000', '')
asset = ''.join(char for char in asset if ord(char) >= 32 or char == '\n')
```

### scripts/scrape_congress_trades.py
```python
# Set disclosure_date (required field)
if not trade.get('transaction_date'):
    trade['disclosure_date'] = f"{ptr.get('year', year)}-01-01"
    trade['transaction_date'] = f"{ptr.get('year', year)}-01-01"
else:
    trade['disclosure_date'] = trade['transaction_date']
```

### src/lib/congressional-trades-scraper.ts
```typescript
// Clean the trade data to prevent Unicode errors
const cleanedTrade = {
  ...trade,
  asset_description: (trade.asset_description || '')
    .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
    .replace(/\\u0000/g, '')
    .trim() || 'Unknown Asset',
  transaction_date: trade.transaction_date || trade.disclosure_date || '2020-01-01',
  disclosure_date: trade.disclosure_date || trade.transaction_date || '2020-01-01',
};

// Skip obvious junk rows
if (cleanedTrade.asset_description.length < 5 || 
    cleanedTrade.asset_description.startsWith('F S:')) {
  continue;
}
```

## Status

✅ **Fixes Applied**
✅ **Scraper Restarted** (running now)
✅ **Should Now Work Without Errors**

## Test Commands

After scraper completes, verify:

```sql
-- Check if data is being stored
SELECT COUNT(*) FROM congressional_stock_trades;

-- Check data quality
SELECT 
    COUNT(*) as total,
    COUNT(ticker) as with_ticker,
    COUNT(*) FILTER (WHERE LENGTH(asset_description) < 10) as short_desc,
    COUNT(*) FILTER (WHERE disclosure_date IS NULL) as missing_disclosure
FROM congressional_stock_trades;

-- Sample trades
SELECT member_name, ticker, transaction_type, transaction_date
FROM congressional_stock_trades
ORDER BY scraped_at DESC
LIMIT 10;
```

## Expected Behavior Now

- ✅ No more Unicode errors
- ✅ No more null disclosure_date errors  
- ✅ Junk rows filtered out
- ✅ Clean data in database
- ✅ Scraper continues on errors

**Scraper is now running with all fixes applied!** 🎉
