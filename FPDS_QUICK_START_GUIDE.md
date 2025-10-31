# FPDS Integration - Quick Start Guide

## 🎯 Goal
Integrate 3+ million federal contract records from SAM.gov/FPDS API into your platform.

---

## ✅ Step 1: Register for SAM.gov API Key (5 minutes)

### **Action Required (YOU):**

1. **Visit:** https://open.gsa.gov/api/sam-opportunities-public-api/
   
2. **Or Direct Registration:** https://sam.gov/content/home

3. **Sign Up Process:**
   - Click "Sign Up" or "Create Account"
   - Provide email address
   - Verify email
   - Complete profile (basic info only)

4. **Request API Key:**
   - Go to "My Account" → "API Keys"
   - Click "Request API Key"
   - Select "Public Data API"
   - Approval is **instant** for public data

5. **Save API Key:**
   - Copy the key (looks like: `abc123xyz456...`)
   - Save it securely

### **Alternative Registration Pages:**
- https://api.sam.gov/
- https://open.gsa.gov/api/
- https://data.gov/ (federated login)

### **API Key Details:**
- **Cost:** FREE (public domain data)
- **Rate Limit:** 10 requests/second (generous)
- **Approval Time:** Instant for public data
- **Expiration:** None (keys don't expire)

### **What You'll Get:**
A key that looks like: `DEMO_KEY` or `abc123def456ghi789...`

---

## ✅ Step 2: Add API Key to Environment (2 minutes)

### **Action Required (YOU):**

1. **Open:** `.env.local` file in your project root

2. **Add this line:**
```bash
SAM_GOV_API_KEY=your_actual_api_key_here
```

3. **Example:**
```bash
# SAM.gov / FPDS API Key
SAM_GOV_API_KEY=abc123def456ghi789jkl012mno345pqr678
```

4. **Restart your dev server** (if running locally)

---

## ✅ Step 3: Run Database Migration (5 minutes)

### **Action Required (YOU):**

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select your project

2. **Go to SQL Editor**
   - Click "SQL Editor" in left sidebar
   - Click "+ New query"

3. **Copy & Paste SQL**
   - Open file: `supabase/migrations/create_fpds_tables.sql`
   - Copy ALL contents (500+ lines)
   - Paste into Supabase SQL Editor

4. **Run Migration**
   - Click "Run" button (or press Ctrl+Enter)
   - Wait 5-10 seconds

5. **Verify Success**
   - Check for success message in output
   - Go to "Table Editor" → Should see new tables:
     * fpds_contracts
     * fpds_company_stats
     * fpds_naics_stats
     * fpds_psc_stats
     * fpds_agency_stats
     * fpds_scraper_log

### **Expected Output:**
```
NOTICE: ============================================
NOTICE: FPDS Tables Created Successfully!
NOTICE: ============================================
NOTICE: Tables Created:
NOTICE:   - fpds_contracts (main contracts table)
...
```

---

## ✅ Step 4: Test SAM.gov API (2 minutes)

### **Action Required (YOU):**

**Test in Terminal:**

```bash
# Replace YOUR_API_KEY with your actual key
curl -X POST "https://api.sam.gov/prod/opportunities/v2/search" \
  -H "X-Api-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "limit": 10,
    "offset": 0,
    "filters": {
      "fiscalYear": "2024",
      "contractingAgency": "DEPT OF DEFENSE",
      "smallBusiness": true
    }
  }'
```

### **Expected Response:**
```json
{
  "totalRecords": 234567,
  "limit": 10,
  "offset": 0,
  "data": [
    {
      "piid": "W912...",
      "vendor_name": "Acme Technologies LLC",
      "award_amount": "$150000",
      ...
    }
  ]
}
```

### **If You Get an Error:**
- Check API key is correct
- Make sure you're using the POST endpoint (not GET)
- Verify headers are included

---

## ✅ Step 5: AI Builds FPDS Scraper (I'll Do This)

### **What I'll Build:**

1. **FPDS Scraper Service** (`src/lib/fpds-scraper.ts`)
   - Fetch contracts from SAM.gov API
   - Handle pagination
   - Normalize data
   - Batch insert to database

2. **Test Script** (`test-fpds-scraper.ts`)
   - Test with 10 records
   - Verify API connection
   - Validate data structure

3. **Bulk Import Script** (`src/scripts/import-fpds-bulk.ts`)
   - Import by fiscal year
   - Import by agency
   - Progress tracking
   - Error handling

### **After I Build:**
You'll run test script:
```bash
npx ts-node test-fpds-scraper.ts
```

Expected output:
```
✅ Fetched 10 contracts from API
✅ Normalized data
✅ Inserted to database
```

---

## ✅ Step 6: Run Pilot Scrape (10 minutes)

### **Action Required (YOU):**

After I build the scraper, you'll run:

```bash
# Test with small dataset (NASA, FY2024, 100 records)
npx ts-node src/scripts/fpds-pilot-scrape.ts
```

This will:
- Fetch 100 NASA contracts from FY2024
- Insert into database
- Verify data quality
- Show sample records

### **Expected Results:**
```
[FPDS Pilot] Fetching NASA FY2024 contracts...
[FPDS Pilot] Found 1,234 total contracts
[FPDS Pilot] Fetching first 100...
[FPDS Pilot] ✅ Inserted 98 contracts
[FPDS Pilot] ⚠️  2 duplicates skipped
[FPDS Pilot] Total in database: 98
```

---

## ✅ Step 7: Run Full Bulk Load (2-4 hours)

### **Action Required (YOU):**

Once pilot succeeds, run full bulk load:

```bash
# Import all small business contracts from FY2024
npx ts-node src/scripts/fpds-bulk-load.ts --year 2024 --small-business
```

This will:
- Fetch ~600K-1M contracts (FY2024, small business)
- Take 2-4 hours
- Insert in batches of 1000
- Show progress every 10K records

### **Expected Results:**
```
[FPDS Bulk] Starting bulk load for FY2024
[FPDS Bulk] Filter: Small Business = TRUE
[FPDS Bulk] 
[FPDS Bulk] Fetching DOD contracts...
[FPDS Bulk] ✅ Inserted 10,000 / 234,567 (4%)
[FPDS Bulk] ✅ Inserted 20,000 / 234,567 (9%)
...
[FPDS Bulk] ✅ DOD Complete: 234,567 contracts
[FPDS Bulk] 
[FPDS Bulk] Fetching NASA contracts...
...
[FPDS Bulk] 
[FPDS Bulk] ============================================
[FPDS Bulk] Bulk Load Complete!
[FPDS Bulk] ============================================
[FPDS Bulk] Total Contracts: 687,432
[FPDS Bulk] Duration: 2h 14m
[FPDS Bulk] Average: 5,234 contracts/minute
```

---

## ✅ Step 8: Build Aggregations (30 minutes)

### **Action Required (YOU):**

After bulk load completes:

```bash
# Aggregate company statistics
npx ts-node src/scripts/fpds-aggregate-companies.ts

# Aggregate NAICS statistics
npx ts-node src/scripts/fpds-aggregate-naics.ts

# Aggregate agency statistics
npx ts-node src/scripts/fpds-aggregate-agencies.ts
```

These scripts will:
- Calculate totals per company
- Calculate industry stats (NAICS)
- Calculate agency spending
- Populate the `_stats` tables

---

## ✅ Step 9: Test in UI (15 minutes)

### **Action Required (YOU):**

After aggregations complete:

1. **View a company profile:**
   - Go to: `/api/fpds/company/YOUR_UEI`
   - Should see complete contract history

2. **Browse contracts:**
   - Go to: `/api/fpds/contracts?agency=DOD&limit=10`
   - Should see list of contracts

3. **Check industry stats:**
   - Go to: `/api/fpds/naics/541712`
   - Should see R&D industry statistics

---

## 📊 What You'll Have After This

### **Database:**
- **~687K+ contracts** (FY2024, small business)
- **~50K companies** (with stats)
- **~1,200 NAICS codes** (with stats)
- **~20 agencies** (with stats)

### **New Capabilities:**
- Complete company federal contracting history
- Industry intelligence (NAICS-based)
- Agency spending patterns
- Market research tool
- Competitive intelligence

### **Data Richness:**
- Contract values (base + options)
- Modification history
- Parent company relationships
- NAICS codes (industry)
- PSC codes (product/service)
- Competition data
- Socioeconomic flags
- Place of performance

---

## 🗓️ Timeline

| Step | Time | Who |
|------|------|-----|
| 1. Register API | 5 min | YOU |
| 2. Add to .env | 2 min | YOU |
| 3. Run migration | 5 min | YOU |
| 4. Test API | 2 min | YOU |
| 5. AI builds scraper | 30 min | AI |
| 6. Run pilot | 10 min | YOU |
| 7. Run bulk load | 2-4 hrs | YOU (automated) |
| 8. Aggregations | 30 min | YOU |
| 9. Test in UI | 15 min | YOU |
| **TOTAL** | **~5 hours** | |

---

## 💰 Cost

- **API:** FREE
- **Storage:** ~$15-25/month (700K records)
- **Compute:** Included in Vercel Pro
- **Total:** ~$20/month

---

## 🆘 Troubleshooting

### **"Invalid API Key"**
- Check key is correct in `.env.local`
- Verify no extra spaces
- Try regenerating key on SAM.gov

### **"Rate Limit Exceeded"**
- Wait 1 minute
- Our scraper has 100ms delays (well within 10 req/sec limit)
- Check you're not running multiple scrapers

### **"Database Error"**
- Verify migration ran successfully
- Check Supabase logs
- Ensure service role key is correct

### **"Network Error"**
- Check internet connection
- Verify SAM.gov API is online: https://api.sam.gov/
- Try again in a few minutes

---

## 📝 Summary

**RIGHT NOW (Steps 1-4):**
1. Register for SAM.gov API key (5 min)
2. Add key to `.env.local` (2 min)
3. Run SQL migration in Supabase (5 min)
4. Test API with curl (2 min)

**THEN TELL ME:** "API key ready, migration complete"

**I'LL BUILD:** FPDS scraper + test scripts (30 min)

**YOU'LL RUN:** Pilot test + bulk load (3-4 hours automated)

**RESULT:** 700K+ federal contracts in your database!

---

Ready to start? Do steps 1-4 above, then let me know! 🚀

