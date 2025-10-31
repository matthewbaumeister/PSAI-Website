# FPDS Full Details Scraper Guide

## Overview

The **Full Details Scraper** fetches **100+ fields** for each federal contract, giving you the most comprehensive dataset possible!

### Basic vs Full Scraper Comparison

| Feature | Basic Scraper | Full Details Scraper |
|---------|---------------|----------------------|
| **Fields per contract** | ~15 | ~100+ |
| **Speed** | 100K in 2-4 hours | 100K in 15-30 hours |
| **Rate** | ~10 contracts/sec | ~2 contracts/sec |
| **API Calls** | 1 per 100 contracts | 101 per 100 contracts (1 search + 100 details) |
| **Data richness** | Basic info only | Everything! |
| **Use case** | Quick lists, basic stats | Deep analysis, research |

---

## 🎯 What You Get With Full Details

### Additional Fields (vs Basic)

**Recipient Details:**
- ✅ Full business address
- ✅ Parent company information
- ✅ CAGE codes
- ✅ Business type descriptions

**Socioeconomic Flags:**
- ✅ Small business (accurate!)
- ✅ Woman-owned
- ✅ Veteran-owned
- ✅ Service-disabled veteran
- ✅ HUBZone
- ✅ 8(a) participant
- ✅ Historically Black College/University

**Classification:**
- ✅ NAICS codes & descriptions
- ✅ PSC codes & descriptions
- ✅ Contract type
- ✅ Pricing type

**Competition:**
- ✅ Extent competed
- ✅ Number of offers received
- ✅ Solicitation ID
- ✅ Set-aside type
- ✅ Fair opportunity details

**Location:**
- ✅ Place of performance (city, state, zip, country)
- ✅ Congressional district
- ✅ Vendor address

**Dates:**
- ✅ Effective date
- ✅ Ultimate completion date
- ✅ Period of performance start/end
- ✅ Last modified date

**R&D Specific:**
- ✅ Research type flag
- ✅ R&D classification

**Agency Details:**
- ✅ Funding agency (vs awarding agency)
- ✅ Contracting office details
- ✅ Agency IDs and codes

---

## 🚀 Quick Start

### 1. Test the Scraper (30 seconds)

```bash
npx tsx test-full-scraper.ts
```

This will:
- Fetch 10 contracts with full details
- Show you the rich data
- Insert to database
- Verify everything works

### 2. Small Test Run (1-2 minutes)

```bash
npx tsx src/scripts/fpds-full-load.ts --year=2024 --max=100
```

Gets 100 contracts with full details to verify the system.

### 3. Medium Run (~10 minutes)

```bash
npx tsx src/scripts/fpds-full-load.ts --year=2024 --max=1000
```

Gets 1,000 contracts - good for testing queries and UI.

### 4. Large Run (~1.5 hours)

```bash
npx tsx src/scripts/fpds-full-load.ts --year=2024 --max=10000
```

Gets 10,000 contracts - solid dataset for analysis.

### 5. Full Load (~15-30 hours)

```bash
npx tsx src/scripts/fpds-full-load.ts --year=2024 --max=100000
```

Gets 100,000 contracts - comprehensive research database!

---

## ⏱️ Time Estimates

| Contracts | Time | Recommended For |
|-----------|------|-----------------|
| 100 | 1 minute | Quick test |
| 1,000 | 10 minutes | UI development |
| 10,000 | 1.5 hours | Initial analysis |
| 25,000 | 3.5 hours | Good dataset |
| 50,000 | 7 hours | Comprehensive |
| 100,000 | 15 hours | Full research database |
| 200,000+ | 30+ hours | Everything! |

**Pro Tip:** Run overnight! The scraper is resumable by quarter.

---

## 📊 Example Queries You Can Run

With full details, you can answer questions like:

```sql
-- Find all woman-owned small businesses that got DOD contracts
SELECT 
  vendor_name,
  SUM(current_total_value_of_award) as total_value,
  COUNT(*) as contract_count
FROM fpds_contracts
WHERE woman_owned_small_business = true
  AND contracting_agency_id = 'DOD'
  AND fiscal_year = 2024
GROUP BY vendor_name
ORDER BY total_value DESC
LIMIT 20;

-- Find R&D contracts in AI/ML (NAICS 541715)
SELECT 
  vendor_name,
  description_of_requirement,
  current_total_value_of_award,
  date_signed
FROM fpds_contracts
WHERE naics_code = '541715'
  AND is_research = true
  AND fiscal_year = 2024
ORDER BY current_total_value_of_award DESC;

-- Find contracts in your state
SELECT 
  vendor_name,
  vendor_city,
  current_total_value_of_award,
  contracting_agency_name,
  description_of_requirement
FROM fpds_contracts
WHERE vendor_state = 'CA'
  AND small_business = true
  AND fiscal_year = 2024
ORDER BY current_total_value_of_award DESC
LIMIT 50;

-- Find contracts with lots of competition
SELECT 
  description_of_requirement,
  vendor_name,
  number_of_offers_received,
  current_total_value_of_award
FROM fpds_contracts
WHERE number_of_offers_received > 10
  AND fiscal_year = 2024
ORDER BY number_of_offers_received DESC;
```

---

## 🔧 Technical Details

### How It Works

1. **Search Phase** (fast)
   - Fetches lists of contract IDs
   - 100 contracts per API call
   - ~200ms per call

2. **Details Phase** (slow)
   - Fetches full details for each contract
   - 1 contract per API call
   - ~500ms per call (rate limited)

3. **Normalize Phase**
   - Converts API format to our schema
   - Handles ~100 fields
   - Smart defaults and data cleaning

4. **Insert Phase**
   - Batch inserts (250 at a time)
   - Upserts (updates existing records)
   - Error tracking

### Resume Capability

The scraper works by quarters:
- Q1: Jan-Mar
- Q2: Apr-Jun
- Q3: Jul-Sep
- Q4: Oct-Dec

If it fails mid-quarter, you can resume by:
1. Checking which quarter failed
2. Running just that quarter manually
3. Or re-running the whole year (it will upsert, not duplicate)

---

## 💡 Pro Tips

### 1. Run Overnight
The full scraper takes 15-30 hours for 100K contracts. Start it before bed!

### 2. Start with a Test
Always run `test-full-scraper.ts` first to make sure everything works.

### 3. Scale Gradually
- Day 1: Get 1,000 contracts (~10 min)
- Day 2: Get 10,000 contracts (~1.5 hours)
- Day 3: Get 100,000 contracts (~15 hours)

### 4. Use `tmux` or `screen`
Keep your scraper running even if you disconnect:

```bash
# Start a tmux session
tmux new -s fpds-scraper

# Run your scraper
npx tsx src/scripts/fpds-full-load.ts --year=2024 --max=100000

# Detach: Ctrl+B, then D
# Reattach later: tmux attach -t fpds-scraper
```

### 5. Monitor Progress
The scraper prints progress every 10 contracts and summary after each batch of 100.

---

## 🎬 Recommended Workflow

### Day 1: Setup & Test
```bash
# Test the scraper
npx tsx test-full-scraper.ts

# Small test run (100 contracts)
npx tsx src/scripts/fpds-full-load.ts --year=2024 --max=100

# Verify in Supabase
```

### Day 2: Medium Load
```bash
# Get 10K contracts (~1.5 hours)
npx tsx src/scripts/fpds-full-load.ts --year=2024 --max=10000

# Build some queries
# Test UI components
```

### Day 3: Full Load
```bash
# Start overnight (~15 hours)
npx tsx src/scripts/fpds-full-load.ts --year=2024 --max=100000

# Wake up to a comprehensive database!
```

---

## 🐛 Troubleshooting

### "supabaseUrl is required"
Add `.env.local` with:
```
NEXT_PUBLIC_SUPABASE_URL=your_url
SUPABASE_SERVICE_ROLE_KEY=your_key
```

### Slow Performance
That's normal! Full details scraper is 10x slower than basic, but gets 6x more data.

### API Rate Limits
The scraper has built-in rate limiting (2 details/sec). Don't change it!

### Connection Errors
The scraper will log errors but continue. Check the error count at the end.

### Out of Memory
If scraping >100K contracts, increase Node memory:
```bash
NODE_OPTIONS=--max_old_space_size=4096 npx tsx src/scripts/fpds-full-load.ts
```

---

## 📈 What's Next?

After you have your rich dataset:

1. **Build Aggregations**
   - Company stats
   - NAICS stats
   - Agency stats
   - PSC stats

2. **Create UI Components**
   - Contract browser
   - Company profiles
   - Market intelligence

3. **Link to SBIR**
   - Match companies
   - Find past performance
   - Analyze win rates

4. **Advanced Analytics**
   - Winning proposal patterns
   - Competition analysis
   - Pricing insights
   - Geographic trends

---

## 🎉 You're All Set!

You now have the most comprehensive federal contract scraper possible!

**Start with:**
```bash
npx tsx test-full-scraper.ts
```

Then scale up as needed. Happy scraping! 🚀

