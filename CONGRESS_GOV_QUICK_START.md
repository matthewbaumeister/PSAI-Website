# Congress.gov Integration - Quick Start Guide

## Get Started in 30 Minutes

This guide will get you up and running with congressional data integration for your PropShop AI platform.

---

## Prerequisites

Before starting, make sure you have:
- Access to your Supabase database
- Node.js and npm/npx installed
- Your existing `.env` file set up

---

## Step 1: Get Congress.gov API Key (5 minutes)

1. **Register for API key:**
   - Go to: https://api.congress.gov/sign-up/
   - Fill out the registration form
   - You'll receive your API key via email within a few minutes

2. **Add to environment variables:**
   
   Open your `.env` file and add:
   ```bash
   CONGRESS_GOV_API_KEY=your_api_key_here
   ```

   Also add to your `.env.local` for local development.

3. **Verify API key works:**
   ```bash
   curl "https://api.congress.gov/v3/bill?api_key=YOUR_KEY&limit=1"
   ```

   You should see JSON response with bill data.

---

## Step 2: Create Database Schema (5 minutes)

1. **Open Supabase SQL Editor:**
   - Go to your Supabase project dashboard
   - Click "SQL Editor" in the left sidebar
   - Click "New query"

2. **Run the schema creation script:**
   - Copy the entire contents of `CONGRESS_GOV_DATABASE_SCHEMA.sql`
   - Paste into the SQL editor
   - Click "Run"

3. **Verify tables were created:**
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name LIKE 'congressional_%';
   ```

   You should see 7 tables:
   - `congressional_bills`
   - `congressional_amendments`
   - `congressional_committee_reports`
   - `congressional_hearings`
   - `congressional_members`
   - `congressional_contract_links`
   - `congressional_scraping_logs`

---

## Step 3: Test the Core Library (5 minutes)

1. **Create a test script:**
   
   Create `test-congress-api.ts` in your project root:

   ```typescript
   import 'dotenv/config';
   import { fetchBill, normalizeBill } from './src/lib/congress-gov-scraper';

   async function test() {
     console.log('Testing Congress.gov API...');
     
     // Fetch the FY2024 NDAA
     const bill = await fetchBill(118, 'hr', 2670);
     
     if (bill) {
       console.log('SUCCESS!');
       console.log('Bill Title:', bill.title);
       console.log('Status:', bill.latestAction?.text);
       
       const normalized = normalizeBill(bill);
       console.log('Defense Relevance Score:', normalized.defense_relevance_score);
       console.log('Programs Mentioned:', normalized.defense_programs_mentioned);
     } else {
       console.log('FAILED: Could not fetch bill');
     }
   }

   test();
   ```

2. **Run the test:**
   ```bash
   npx tsx test-congress-api.ts
   ```

   You should see:
   ```
   Testing Congress.gov API...
   SUCCESS!
   Bill Title: National Defense Authorization Act for Fiscal Year 2024
   Status: Became Public Law No: 118-31
   Defense Relevance Score: 100
   Programs Mentioned: ['F-35', 'B-21', ...]
   ```

3. **Clean up:**
   ```bash
   rm test-congress-api.ts
   ```

---

## Step 4: Import Priority Bills (10 minutes)

1. **Run the bulk import for priority bills:**
   
   This will import ~25 key defense bills from the last 5 Congresses:

   ```bash
   npx tsx src/scripts/congress-bulk-import.ts --priority-only
   ```

2. **Monitor the output:**
   
   You should see output like:
   ```
   [Bulk Import] Importing 25 Priority Bills
   [1/25] Fetching: FY2025 National Defense Authorization Act
     ✓ Saved successfully
     Defense Relevance: 100/100
     Programs: F-35, B-21, Virginia-class
   ...
   ```

3. **Verify in database:**
   ```sql
   SELECT 
     congress, 
     bill_type, 
     bill_number, 
     title,
     defense_relevance_score,
     is_law
   FROM congressional_bills
   ORDER BY congress DESC, bill_number ASC
   LIMIT 10;
   ```

   You should see your imported bills.

---

## Step 5: Set Up Daily Scraper (5 minutes)

1. **Update `vercel.json`:**
   
   Open `vercel.json` and add the Congress.gov cron job:

   ```json
   {
     "crons": [
       {
         "path": "/api/cron/scrape-fpds",
         "schedule": "0 6 * * *"
       },
       {
         "path": "/api/cron/scrape-dod-news",
         "schedule": "30 6 * * *"
       },
       {
         "path": "/api/cron/scrape-sam-gov",
         "schedule": "0 7 * * 0"
       },
       {
         "path": "/api/cron/scrape-congress-gov",
         "schedule": "30 11 * * *"
       }
     ]
   }
   ```

   This runs daily at 6:30 AM EST (11:30 AM UTC).

2. **Deploy to Vercel:**
   ```bash
   git add .
   git commit -m "Add Congress.gov integration"
   git push
   ```

3. **Verify cron job was created:**
   - Go to Vercel dashboard
   - Click your project
   - Go to "Settings" → "Cron Jobs"
   - You should see "scrape-congress-gov" listed

4. **Test manually:**
   ```bash
   curl -X POST https://your-domain.com/api/cron/scrape-congress-gov \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
   ```

---

## Step 6: Verify Everything Works

### Test 1: Check Logs
```sql
SELECT * FROM congressional_scraping_logs ORDER BY started_at DESC LIMIT 5;
```

You should see logs from your bulk import and any scraping runs.

### Test 2: Check Bill Data
```sql
SELECT 
  COUNT(*) as total_bills,
  COUNT(*) FILTER (WHERE is_defense_related = true) as defense_bills,
  AVG(defense_relevance_score) FILTER (WHERE is_defense_related = true) as avg_score
FROM congressional_bills;
```

### Test 3: View Active Defense Bills
```sql
SELECT * FROM active_defense_bills LIMIT 10;
```

This uses the pre-built view.

---

## What's Next?

### Option A: Import More Historical Data

Import all defense bills from current Congress:
```bash
npx tsx src/scripts/congress-bulk-import.ts --congress=119
```

Import from multiple recent Congresses:
```bash
npx tsx src/scripts/congress-bulk-import.ts --congress=118
npx tsx src/scripts/congress-bulk-import.ts --congress=117
```

### Option B: Link to Existing Contracts

See `CONGRESS_GOV_INTEGRATION_RESEARCH.md` Phase 4 for:
- Automated keyword matching
- Program element code linking
- Contractor name matching
- LLM-enhanced analysis

### Option C: Build UI Components

Add legislative context to your contract detail pages:
- "Related Bills" section
- "Congressional Support" indicator
- "At Risk" warnings
- Member engagement tracking

---

## Troubleshooting

### API Key Not Working
- Check the key is correct in `.env`
- Verify you've deployed the updated `.env` to Vercel
- Make sure there are no extra spaces or quotes

### Database Errors
- Verify schema was created successfully
- Check Supabase service role key is correct
- Ensure RLS policies don't block inserts

### Rate Limit Issues
- Default rate limit: 5,000 requests/hour
- Our scraper respects this (1.3 req/sec)
- If hit, wait 1 hour or contact Congress.gov support

### Cron Job Not Running
- Verify `CRON_SECRET` is set in Vercel environment variables
- Check cron job is enabled in Vercel dashboard
- View logs in Vercel dashboard under "Functions"

---

## Daily Operations

### Morning Routine (Automated)
- 6:30 AM EST: Daily scraper runs
- Updates bills from last 3 days
- Fetches new committee reports
- Tracks upcoming hearings

### Weekly Check
```sql
-- View this week's activity
SELECT 
  scrape_type,
  status,
  records_new,
  records_updated,
  started_at
FROM congressional_scraping_logs
WHERE started_at >= NOW() - INTERVAL '7 days'
ORDER BY started_at DESC;
```

### Monthly Maintenance
- Review failed scrapes in logs
- Check for API changes (rare)
- Update priority bills list if needed
- Run bulk import for previous month

---

## Performance Expectations

**Initial Bulk Import:**
- Priority bills (25): ~20 minutes
- Full Congress (250+ bills): ~3-4 hours
- API rate limit is the bottleneck

**Daily Scraper:**
- Typical run time: 5-10 minutes
- Updates 10-30 bills per day
- ~50-100 API calls per run

**Database Size:**
- ~1 MB per 100 bills
- ~50 MB for 5 years of data
- Negligible cost impact on Supabase

---

## Support & Resources

**Documentation:**
- Full research: `CONGRESS_GOV_INTEGRATION_RESEARCH.md`
- Database schema: `CONGRESS_GOV_DATABASE_SCHEMA.sql`
- Core library: `src/lib/congress-gov-scraper.ts`

**Congress.gov Resources:**
- API Documentation: https://github.com/LibraryOfCongress/api.congress.gov
- User Guide: https://www.congress.gov/help/legislative-glossary
- API Support: https://www.congress.gov/help/contact-us

**Your Existing Infrastructure:**
- Pattern matches your FPDS/DOD scrapers
- Uses same Supabase client
- Follows same error handling patterns
- Integrates with existing cron schedule

---

## Success Checklist

- [ ] API key obtained and added to `.env`
- [ ] Database schema created (7 tables)
- [ ] Core library tested successfully
- [ ] Priority bills imported (25+ bills)
- [ ] Daily scraper configured in Vercel
- [ ] First daily scrape ran successfully
- [ ] Logs show successful operations
- [ ] Bills visible in database

**Once all checked, you're ready to build UI features!**

---

## Next Phase: Contract Linking

The real power comes from linking congressional activity to your contracts. See the research document section "Phase 4: Contract Linking & Analysis" for:

1. **Automated Linking Strategy**
   - Keyword matching
   - Program element matching
   - Contractor name matching

2. **LLM-Enhanced Analysis**
   - GPT-4 relevance scoring
   - Relationship classification
   - Context extraction

3. **UI Integration Points**
   - Contract detail pages
   - Opportunity search filters
   - Company intelligence pages
   - Predictive dashboards

---

**You now have a complete congressional data pipeline!**

