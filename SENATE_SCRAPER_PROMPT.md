# 🚀 Senate Congressional Trades Scraper - New Conversation Prompt

Copy/paste this into a new Cursor conversation:

---

## Context

I have a working House congressional stock trades scraper that parses PDFs and stores data in Supabase. It successfully extracts 511+ trades from House members.

**Problem:** Senate uses HTML web pages instead of downloadable PDFs, so I need a separate scraper.

## What I Need

Build a Senate congressional stock trades scraper that:

1. **Scrapes Senate eFiling HTML pages** (not PDFs like House)
   - Uses the `capitolgains` library to get disclosure URLs
   - URLs look like: `https://efdsearch.senate.gov/search/view/ptr/[uuid]/`
   - Example PTR structure from my test:
   ```python
   {
     'report_url': 'https://efdsearch.senate.gov/search/view/ptr/9b782ca8-bf85-4256-bada-b6cca565e20f/',
     'report_type': 'Periodic Transaction Report for 08/16/2024',
     'date': '08/15/2024'
   }
   ```

2. **Parses HTML tables to extract trades**
   - Navigate to each report_url
   - Parse the HTML table structure
   - Extract: ticker, asset description, transaction type, date, amount
   - Handle Senate-specific formatting

3. **Stores to same database schema**
   - Uses existing `congressional_stock_trades` table
   - Same fields as House scraper
   - Chamber = 'Senate'

4. **Targets defense committee senators**
   - Focus on Senate Armed Services Committee
   - Senate Appropriations Defense Subcommittee
   - Same member list as existing House scraper (`get_defense_senators()`)

5. **Historical coverage: 2012-2025**
   - Scrape all available PTRs
   - Handle changes in Senate website format over time

## Existing Infrastructure

**Database schema already exists:**
- Table: `congressional_stock_trades` with chamber column
- Located: `supabase/migrations/create_congressional_trades.sql`

**House scraper files (for reference):**
- `scripts/scrape_congress_trades.py` - Main scraper (has `scrape_senate_trades()` function that needs HTML parsing)
- `scripts/pdf_downloader.py` - Download module (you'll need similar for HTML)
- `scripts/pdf_parser.py` - PDF parser (you'll build HTML equivalent)
- `src/lib/congressional-trades-scraper.ts` - TypeScript wrapper

**Key functions in scrape_congress_trades.py:**
- `get_defense_senators()` - Returns list of Senate members to scrape
- `scrape_senate_trades(start_year, end_year)` - Currently gets URLs but doesn't parse them

## Technical Requirements

**Tools to use:**
- `capitolgains` library - Already installed, gets disclosure URLs
- `playwright` - For HTML page navigation and scraping
- `beautifulsoup4` or similar - For HTML parsing
- Same Supabase database - Use existing schema

**Data cleaning needs:**
- Remove HTML artifacts
- Normalize ticker symbols
- Handle Senate-specific transaction types
- Set disclosure_date field (required)

**Error handling:**
- Continue on individual page failures
- Log errors but don't stop scraper
- Handle timeouts (Senate site can be slow)

## Expected Output

When complete:
- ~200-500 additional Senate trades in database
- Same quality as House scraper (65%+ ticker extraction)
- Works with existing npm commands
- Can run in tmux like House scraper

## Starting Point

The `scrape_senate_trades()` function in `scripts/scrape_congress_trades.py` already:
- ✅ Gets list of Senate members
- ✅ Finds disclosure URLs using capitolgains
- ❌ Doesn't download/parse the HTML pages (THIS is what needs to be built)

## Success Criteria

1. Senate trades appear in database with chamber='Senate'
2. Ticker extraction rate similar to House (60-70%)
3. Runs without errors
4. Historical coverage back to 2012
5. Can run daily for updates

## Additional Context

**Senate eFiling differences from House:**
- House: Direct PDF downloads with tables
- Senate: HTML web pages with tables
- Senate URLs are UUIDs (not sequential like House)
- Senate site has rate limiting (need delays between requests)
- Senate reports often have more detailed information

**Defense senators to prioritize:**
- Senate Armed Services Committee members
- Appropriations Defense Subcommittee members
- ~36 senators total

## Files to Create/Modify

**New files needed:**
- `scripts/senate_html_parser.py` - HTML parsing module
- `scripts/senate_page_scraper.py` - Navigate and download HTML

**Files to modify:**
- `scripts/scrape_congress_trades.py` - Update `scrape_senate_trades()` to use HTML parser

**Keep using:**
- Same database schema
- Same TypeScript wrapper
- Same npm commands

---

## Ready to Start?

Build the Senate HTML scraper following the pattern of the House PDF scraper but adapted for HTML web pages instead of PDFs.

Focus on:
1. HTML navigation using Playwright
2. Table parsing from HTML
3. Same data quality as House scraper
4. Integration with existing infrastructure

Let me know what questions you have and let's build it!

