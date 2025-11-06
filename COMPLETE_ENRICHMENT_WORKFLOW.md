# Complete Company Enrichment Workflow

## 🎯 Three-Stage Process

### Stage 1: Historical Enrichment (One-Time)
### Stage 2: Daily Updates (Automated)
### Stage 3: Monthly Full Refresh (Automated)

---

## Stage 1: Historical Enrichment (Tomorrow)

### **What:** Enrich all 10,367 existing companies

### **When:** Tomorrow morning (when rate limits reset)

### **How:** Run this command locally:
```bash
cd /Users/matthewbaumeister/Documents/PropShop_AI_Website
npm run enrich-companies -- all
```

### **Duration:** 3-4 hours

### **What it does:**
- Enriches ALL companies from `fpds_company_stats`
- Uses 3 SAM.gov API keys (30,000 requests/day)
- Calls SAM.gov Entity API for business details
- Calls SEC EDGAR for public company financials
- Stores everything in `company_intelligence` table

### **Expected result:**
- ~10,000+ companies enriched (96%+)
- ~200-300 companies not found (inactive UEIs)
- ~50-100 public companies identified
- Cost: $0 (FREE!)

---

## Stage 2: Daily Updates (Automated)

### **What:** Keep enrichment up-to-date as new companies appear

### **When:** Every day at 3:30 AM UTC (after all scrapers finish)

### **How:** Automated via GitHub Actions

### **File:** `.github/workflows/company-enrichment-daily.yml`

### **What it does daily:**

```
2:00 AM → All your scrapers run (FPDS, SAM.gov, DoD, etc.)
         → Add new contracts to database
         → ~50-200 new contracts per day
         
3:30 AM → Daily Company Update runs:
         
         Step 1: Rebuild company stats
         - Aggregates contracts from last 24 hours
         - Updates existing companies
         - Adds new companies to fpds_company_stats
         - Usually 5-50 new companies per day
         
         Step 2: Enrich new companies
         - Finds companies in stats but not in company_intelligence
         - Calls SAM.gov API for each
         - Calls SEC EDGAR for public companies
         - Usually 5-50 new companies enriched
         
         Step 3: Refresh stale data (Mondays only)
         - Updates public companies >90 days old
         - Gets latest quarterly SEC filings
         - Usually 20-50 companies per week

4:00 AM → Complete! (takes 5-15 minutes)
```

### **Cost per day:** $0 (FREE APIs)

### **API usage per day:**
- SAM.gov: 5-50 requests (out of 30,000 limit)
- SEC EDGAR: 0-10 requests (no limit)

---

## Stage 3: Monthly Full Refresh (Automated)

### **What:** Re-enrich ALL companies monthly

### **When:** 28th of every month at 3 AM UTC

### **How:** Automated via GitHub Actions

### **File:** `.github/workflows/company-enrichment-monthly.yml`

### **Why monthly?**
- Companies update SAM.gov registrations
- New public companies IPO
- Business structures change
- Contact info updates
- Keeps data fresh

### **What it does:**
- Re-enriches ALL companies in database
- Updates stale data
- Finds new public companies
- Takes 3-4 hours

### **Cost per month:** $0 (FREE!)

---

## 🔐 GitHub Secrets Setup

To use the automated workflows, add these secrets to your GitHub repo:

### **Required Secrets:**

1. `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
2. `SUPABASE_SERVICE_ROLE_KEY` - Service role key (has full access)
3. `SAM_GOV_API_KEY` - First SAM.gov API key
4. `SAM_GOV_ENRICHMENT_API_KEY` - Second SAM.gov API key  
5. `SAM_GOV_THIRD_API_KEY` - Third SAM.gov API key (**NEW - need to add!**)

### **Optional (for notifications):**
6. `SENDGRID_API_KEY` - For email notifications
7. `CRON_NOTIFICATION_EMAIL` - Your email
8. `SENDGRID_FROM_EMAIL` - From address

### **How to add secrets:**

1. Go to your GitHub repo
2. Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Add each secret above

### **⚠️ ACTION REQUIRED:**

You need to add `SAM_GOV_THIRD_API_KEY`:
- Name: `SAM_GOV_THIRD_API_KEY`
- Value: `SAM-55472cb1-6fcd-417c-b3a4-c4625568371d`

---

## 📊 How It All Works Together

### **Workflow Diagram:**

```
┌─────────────────────────────────────────────────────────────┐
│ Daily (Every Day)                                            │
├─────────────────────────────────────────────────────────────┤
│ 2:00 AM  → Scrapers run (FPDS, SAM.gov, DoD, Army, etc.)   │
│            → Add ~50-200 contracts                          │
│            → Adds ~5-50 new companies                       │
│                                                              │
│ 3:30 AM  → Daily Company Update                             │
│            → Rebuild company stats (30 sec)                 │
│            → Enrich new companies (5-10 min)                │
│            → Update stale data (Mondays only)               │
│                                                              │
│ 4:00 AM  → Complete!                                        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Monthly (28th of Month)                                      │
├─────────────────────────────────────────────────────────────┤
│ 3:00 AM  → Monthly Full Refresh                             │
│            → Re-enrich ALL companies                        │
│            → Update all data                                │
│            → Find new public companies                      │
│                                                              │
│ 7:00 AM  → Complete! (takes 3-4 hours)                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 📈 Expected Growth

| Time | Companies | Enriched | Enrichment % |
|------|-----------|----------|--------------|
| **Today** | 10,367 | 6 | 0.06% |
| **Tomorrow** (after historical) | 10,367 | 10,000+ | 96%+ |
| **Week 1** | 10,400 | 10,030 | 96.5% |
| **Month 1** | 10,500 | 10,100 | 96.2% |
| **Month 3** | 11,000 | 10,600 | 96.4% |
| **Month 6** | 12,000 | 11,500 | 95.8% |

**Growth pattern:**
- Daily: +5-50 companies/day
- Monthly: +500-1,000 companies/month
- Enrichment keeps pace automatically

---

## 🎯 Action Items

### **Today:**
- [x] Fixed company stats SQL
- [x] Tested enrichment (6 companies)
- [x] Updated GitHub Actions workflows
- [ ] Add `SAM_GOV_THIRD_API_KEY` to GitHub secrets

### **Tomorrow Morning:**
- [ ] Run historical enrichment: `npm run enrich-companies -- all`
- [ ] Wait 3-4 hours
- [ ] Verify results in Supabase

### **After Historical Enrichment:**
- [ ] Add `SAM_GOV_THIRD_API_KEY` to GitHub secrets
- [ ] Test daily workflow (manual trigger)
- [ ] Verify monthly workflow is scheduled

### **Ongoing (Automated):**
- Daily at 3:30 AM: New companies enriched automatically
- Monthly on 28th: Full refresh automatically
- No manual work needed!

---

## 🔧 Manual Controls

### **Test daily update manually:**
```bash
npm run update-companies:daily
```

### **Test monthly full refresh manually:**
```bash
npm run enrich-companies -- all
```

### **Enrich specific number:**
```bash
npm run enrich-companies -- 100  # Enrich 100 companies
npm run enrich-companies -- 500  # Enrich 500 companies
```

### **Check status:**
```bash
npx tsx verify-rebuild.ts
```

### **Trigger GitHub Actions manually:**
1. Go to GitHub repo → Actions
2. Select workflow (daily or monthly)
3. Click "Run workflow"

---

## 📊 Monitoring

### **Check enrichment status:**

**In Supabase:**
```sql
-- Overall stats
SELECT 
  COUNT(*) as total_companies,
  COUNT(*) FILTER (WHERE sam_enriched = TRUE) as enriched,
  ROUND(COUNT(*) FILTER (WHERE sam_enriched = TRUE)::numeric / COUNT(*) * 100, 1) as pct_enriched,
  AVG(data_quality_score)::int as avg_quality
FROM company_intelligence;

-- Recent enrichments
SELECT 
  DATE(last_enriched) as date,
  COUNT(*) as companies_enriched
FROM company_intelligence
WHERE last_enriched > NOW() - INTERVAL '7 days'
GROUP BY DATE(last_enriched)
ORDER BY date DESC;
```

### **Check API usage:**
```sql
-- API calls in last 24 hours
SELECT 
  api_source,
  COUNT(*) as calls,
  COUNT(*) FILTER (WHERE success = FALSE) as errors,
  ROUND(COUNT(*) FILTER (WHERE success = FALSE)::numeric / COUNT(*) * 100, 1) as error_rate
FROM company_intel_api_log
WHERE called_at > NOW() - INTERVAL '24 hours'
GROUP BY api_source;
```

### **Check GitHub Actions:**
1. Go to GitHub repo → Actions
2. See recent workflow runs
3. Click on run to see logs
4. Download artifacts for detailed logs

---

## 🚨 Troubleshooting

### **Daily update not running:**
- Check GitHub Actions tab for errors
- Verify secrets are set correctly
- Check rate limits (unlikely with 3 keys)

### **Some companies not enriching:**
- Normal! ~3-5% won't have SAM.gov data
- Usually inactive companies or bad UEIs
- They'll be marked as "not_found"

### **Rate limiting errors:**
- Shouldn't happen with 3 API keys (30,000 requests/day)
- If it does, the script will skip and try next day
- Check if all 3 API keys are valid

### **Data quality low:**
- Check `data_quality_score` in company_intelligence
- Scores 60-80 are normal for private companies
- Scores 85-95 are normal for public companies
- Scores <50 mean limited data available

---

## 💰 Cost Summary

| Item | Daily Cost | Monthly Cost | Annual Cost |
|------|-----------|--------------|-------------|
| SAM.gov API | $0 | $0 | **$0** |
| SEC EDGAR | $0 | $0 | **$0** |
| GitHub Actions | $0* | $0* | **$0** |
| Supabase | $0** | $0** | **$0** |
| **TOTAL** | **$0** | **$0** | **$0/year** |

\* Free tier: 2,000 minutes/month (we use ~200 min/month)  
\** Free tier: 500MB database (we use ~100MB for company data)

Compare to Crunchbase: **$60,000-$120,000/year**

---

## 📚 Files Reference

### **GitHub Actions:**
- `.github/workflows/company-enrichment-daily.yml` - Daily updates (NEW!)
- `.github/workflows/company-enrichment-monthly.yml` - Monthly refresh (UPDATED!)

### **Scripts:**
- `enrich-companies.ts` - Main enrichment
- `cron/daily-company-update.ts` - Daily update logic
- `verify-rebuild.ts` - Status checker

### **SQL:**
- `REBUILD_COMPANIES_FIXED.sql` - Create company stats
- `VIEW_ENRICHED_SIMPLE.sql` - View enriched data

### **Documentation:**
- `ENRICHMENT_SUCCESS_AND_NEXT_STEPS.md` - Quick start
- `COMPLETE_ENRICHMENT_WORKFLOW.md` - This file
- `DAILY_UPDATE_ACTION_PLAN.md` - Daily automation details

---

## 🎉 Summary

### **What you have now:**

✅ **Historical enrichment ready** - Run tomorrow  
✅ **Daily automation ready** - Just add GitHub secret  
✅ **Monthly refresh ready** - Already scheduled  
✅ **3 SAM.gov API keys** - 30,000 requests/day  
✅ **$0 cost** - All FREE APIs  

### **What to do next:**

1. **Tomorrow:** Run `npm run enrich-companies -- all` locally
2. **Add secret:** `SAM_GOV_THIRD_API_KEY` to GitHub
3. **Done!** Everything else is automatic

### **Result:**

- 10,000+ companies enriched immediately
- New companies enriched daily (automatic)
- All data refreshed monthly (automatic)
- Zero manual work ongoing
- Zero cost

**You're all set!** 🚀

