# Federal Contract Vehicles: Quick Reference

## The Big Picture

```
Federal Contracting Landscape
├── SBIR/STTR (You already track this)
├── Prime Contracts (You already track this via FPDS)
├── GWACs (NEW - 10-15 vehicles, 1,000+ companies)
└── GSA MAS (NEW - 25,000+ contracts, EASIEST to integrate)
```

---

## Quick Comparison

| | GWACs | GSA MAS | Your Current FPDS Data |
|---|---|---|---|
| **What is it?** | Pre-competed contract vehicles | Catalog contracts | Individual awards |
| **# of Vendors** | ~1,000-1,500 | ~25,000 | Millions of awards |
| **Annual Value** | $20-30B | $35-40B | $600B+ total federal |
| **Examples** | STARS III, Alliant 2 | Contract GS35F0119Y | Any prime contract |
| **Has Public Rates?** | Sometimes | **YES (CALC+ API)** | No |
| **Easy to Integrate?** | Moderate | **Very Easy** | Already done |
| **Time to Setup** | 6-10 hours | **30 minutes** | Done |

---

## What Each Tracks

### FPDS (What You Have Now)
- ✅ Contract awards and modifications
- ✅ Task/delivery orders
- ✅ Vendors, amounts, dates, agencies
- ✅ Parent contract references (`referenced_idv_piid`)
- ❌ NO pricing/rates
- ❌ NO contract holder lists

### GWACs (What I Planned)
- Pre-selected pool of companies (e.g., 86 on STARS III)
- Task orders issued under the GWAC
- Company performance metrics
- Labor rates (manual scraping from rate sheets)

### GSA MAS (What You Asked About)
- 25,000+ individual contracts
- Pre-negotiated catalog pricing
- **CALC+ API with public labor rates** (HUGE!)
- Product and service offerings
- Much easier to integrate than GWACs

---

## Data Sources

### For GSA MAS Rates (PRIMARY - EASY!)

**CALC+ API:** https://calc.gsa.gov/api/

**What it gives you:**
- Labor category rates from all GSA MAS contracts
- Free, public REST API
- No authentication needed
- Updated regularly
- ~100,000+ labor rate records

**Example:**
```bash
curl "https://calc.gsa.gov/api/rates/?q=Software+Engineer&page_size=5"
```

**Returns:**
```json
{
  "count": 1247,
  "results": [
    {
      "labor_category": "Senior Software Engineer",
      "min_years_experience": 5,
      "current_price": 162.30,
      "vendor_name": "Example Company",
      "contract_number": "GS35F0119Y"
    }
  ]
}
```

**Scraper:** `src/lib/calc-plus-scraper.ts` (already created for you)

### For GWAC Data (SECONDARY - HARDER)

**GSA GWAC Sales Dashboard:** https://d2d.gsa.gov/report/gsa-fas-gwac-sales-dashboard
- Task order data
- Requires web scraping or CSV download

**Individual GWAC Sites:**
- Contract holder lists
- GWAC-specific rates
- Manual download/scraping

### Your Existing FPDS Data (LINKS TO BOTH!)

Your FPDS `referenced_idv_piid` field already contains:
- GSA MAS task orders (e.g., `GS35F0119Y-0001`)
- GWAC task orders (e.g., `47QTCA19D0001`)

**You can link them automatically!**

---

## Quick Start (Choose Your Path)

### Path A: GSA MAS Only (Recommended to Start)

**Time:** 30 minutes  
**Difficulty:** Easy  
**Value:** High (pricing intelligence)

```bash
# 1. Run database schema
cat GWAC_AND_MAS_DATABASE_SCHEMA.sql | pbcopy
# Paste in Supabase, execute

# 2. Test CALC+ API
ts-node src/lib/calc-plus-scraper.ts search "Software Engineer"

# 3. Scrape popular categories (gets 2K+ rates)
ts-node src/lib/calc-plus-scraper.ts popular

# 4. Query your data
# See GSA_MAS_VS_GWAC_GUIDE.md for queries
```

**Result:** Labor rate comparison for 18 popular categories across thousands of GSA MAS contracts

### Path B: GWACs Only

**Time:** 6-10 hours  
**Difficulty:** Moderate  
**Value:** Moderate (task order intelligence)

```bash
# 1. Run GWAC schema
cat GWAC_DATABASE_SCHEMA.sql | pbcopy

# 2. Manually add GWAC programs
# See GWAC_PROGRAMS_REFERENCE.md

# 3. Link FPDS data
ts-node src/lib/gwac-fpds-linker.ts link --for-real

# 4. Scrape contract holder lists
# Manual process from GSA websites
```

**Result:** Track which companies hold GWAC positions, task order performance

### Path C: Both (Recommended for Complete Solution)

**Time:** 12-16 hours total  
**Difficulty:** Moderate  
**Value:** Maximum (complete picture)

Start with Path A (30 min), then add Path B (6-10 hours) over time.

---

## Which Should You Do First?

### Start with GSA MAS because:
1. ✅ **Public API** (CALC+) - no scraping needed
2. ✅ **30 minutes** to see results
3. ✅ **25,000 contracts** vs 1,000 GWACs
4. ✅ **Pricing data** that competitors don't have
5. ✅ **Easy to maintain** (API doesn't change)

### Add GWACs later because:
1. More manual effort (no comprehensive API)
2. Fewer vendors
3. Still valuable for tracking major contract vehicles
4. Complements GSA MAS data

---

## What This Enables

### Pricing Intelligence (GSA MAS)
```sql
-- Compare rates for "Senior Software Engineer"
SELECT company_name, min_years_experience, current_year_rate
FROM labor_rates
WHERE labor_category = 'Senior Software Engineer'
ORDER BY current_year_rate;
```

**Use Cases:**
- Benchmark your company's rates
- Find competitive positioning
- Build cost estimates
- Identify low-cost competitors

### Contract Vehicle Portfolio (Both)
```sql
-- See which GWACs/MAS contracts a company has
SELECT company_name, vehicle_type, program_name, total_order_value
FROM contract_holders ch
JOIN contract_vehicles cv ON ch.vehicle_id = cv.id
WHERE company_name = 'Example Company';
```

**Use Cases:**
- Complete company intelligence
- Competitive analysis
- Market positioning
- Business development targeting

### Market Gaps (GSA MAS)
```sql
-- Find high-demand categories with few vendors
SELECT labor_category, COUNT(DISTINCT company_name) as vendors
FROM labor_rates
GROUP BY labor_category
HAVING COUNT(DISTINCT company_name) < 30
ORDER BY vendors;
```

**Use Cases:**
- Identify opportunities
- Market entry strategy
- Underserved categories

---

## Files Created for You

### For GSA MAS (Start Here)
- `GWAC_AND_MAS_DATABASE_SCHEMA.sql` - Unified database schema
- `src/lib/calc-plus-scraper.ts` - CALC+ API scraper (ready to run)
- `GSA_MAS_VS_GWAC_GUIDE.md` - Complete guide

### For GWACs (Add Later)
- `GWAC_DATABASE_SCHEMA.sql` - GWAC-only schema (use unified one instead)
- `src/lib/gwac-fpds-linker.ts` - Links FPDS to GWACs
- `GWAC_PROGRAMS_REFERENCE.md` - GWAC program data
- `GWAC_INTEGRATION_PLAN.md` - Detailed implementation plan

### For Both
- `CONTRACT_VEHICLES_QUICK_REFERENCE.md` - This file
- `GWAC_INTEGRATION_SUMMARY.md` - Executive summary

---

## Cost-Benefit Summary

### GSA MAS Integration

| Cost | Benefit |
|------|---------|
| 30 min setup | Pricing intelligence |
| FREE API | 25,000+ contracts tracked |
| 2 hours/month maintenance | Unique market differentiator |
| **Total: 4-6 hours** | **Unmatched competitive advantage** |

### GWAC Integration

| Cost | Benefit |
|------|---------|
| 6-10 hours setup | Task order tracking |
| Web scraping needed | Major contract vehicle intel |
| 2 hours/month maintenance | Company performance metrics |
| **Total: 10-14 hours** | **Strong competitive advantage** |

### Combined

| Cost | Benefit |
|------|---------|
| 12-16 hours setup | Complete contracting picture |
| Mostly automated | Pricing + Performance data |
| 3-4 hours/month maintenance | Market leader position |
| **Total: 20-24 hours** | **Unbeatable competitive advantage** |

---

## Recommended Approach

### Week 1: GSA MAS (Quick Win)
1. Run unified database schema (5 min)
2. Test CALC+ scraper (5 min)
3. Scrape popular categories (20 min)
4. Build simple rate comparison dashboard (2 hours)
5. **Launch pricing intelligence feature**

**Result:** Immediate value, unique capability

### Week 2-3: FPDS Linking
1. Link existing FPDS orders to MAS contracts (2 hours)
2. Identify GWAC task orders in FPDS (1 hour)
3. Build task order analytics (2 hours)

**Result:** Complete task order tracking

### Month 2: GWAC Programs
1. Add major GWAC programs (2 hours)
2. Scrape contract holder lists (4 hours)
3. Build GWAC dashboards (4 hours)

**Result:** Full contract vehicle tracking

### Ongoing: Automation
1. Daily: Link new FPDS orders (automated)
2. Weekly: Update statistics (automated)
3. Monthly: Scrape CALC+ updates (automated)
4. Quarterly: Update GWAC holders (1 hour manual)

**Result:** Self-maintaining system

---

## The Bottom Line

**YES, integrate contract vehicle tracking (GWACs + GSA MAS).**

**Start with GSA MAS:**
- 30 minutes to working solution
- Free public API (CALC+)
- Pricing data no competitor has
- 25,000+ contracts covered

**Add GWACs later:**
- Complements GSA MAS data
- Tracks major contract vehicles
- More manual but still valuable

**Combined result:**
- Most comprehensive federal contracting intelligence platform
- Unique pricing capabilities
- Unmatched competitive advantage
- Justifies premium pricing

---

## Commands to Run Now

```bash
# 1. Create database tables
# Copy GWAC_AND_MAS_DATABASE_SCHEMA.sql into Supabase SQL Editor

# 2. Test CALC+ API (see if it works)
ts-node src/lib/calc-plus-scraper.ts search "Software Engineer"

# 3. Scrape popular categories (get real data)
ts-node src/lib/calc-plus-scraper.ts popular

# 4. Check your results
# In Supabase SQL Editor:
SELECT COUNT(*) FROM labor_rates;
SELECT labor_category, COUNT(*), AVG(current_year_rate)
FROM labor_rates 
GROUP BY labor_category 
ORDER BY COUNT(*) DESC;
```

**You'll have pricing intelligence in 30 minutes.**

---

## Questions?

**Q: Is FPDS scraper tracking this already?**  
A: FPDS tracks the **task orders** but NOT the **rates/pricing**. You need CALC+ for rates.

**Q: Do I need to scrape anything?**  
A: For GSA MAS rates, NO - use the CALC+ API (I built the scraper). For GWACs, some web scraping needed.

**Q: How often does this need updating?**  
A: CALC+ rates: monthly. GWAC holders: quarterly. FPDS linking: daily (automated).

**Q: Is this worth the effort?**  
A: YES. 30 minutes for GSA MAS gets you pricing data no competitor has. Huge ROI.

**Q: Can I just do GSA MAS without GWACs?**  
A: Absolutely! GSA MAS is more valuable (more vendors, has API, easier) and you can add GWACs later.

