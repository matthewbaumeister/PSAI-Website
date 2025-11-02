# DoD Contract News Scraper - Quick Start Guide

## 🎯 **What This Scraper Does:**

Scrapes **daily DoD contract award announcements** from defense.gov and extracts:
- Vendor names & locations
- Contract numbers & amounts
- Detailed descriptions (better than FPDS!)
- POC names & phone numbers
- Performance locations
- Teaming arrangements

---

## 📊 **Value Proposition:**

| Data Source | What It Has | What It's Missing |
|-------------|-------------|-------------------|
| **FPDS** | Structured data, 100+ fields | Human-readable descriptions, POCs, context |
| **DoD News** | Rich descriptions, POCs, context | Structured fields, historical depth |
| **BOTH TOGETHER** | **Complete picture!** | Nothing! |

---

## 🚀 **Quick Implementation Plan:**

### **Step 1: Test Scraping (30 min)**
```bash
# Create test script
npx tsx test-dod-news-scraper.ts

# Manually scrape one article
# Validate HTML structure
# Test paragraph extraction
```

### **Step 2: Create Database (1 hour)**
```sql
-- Run migration
CREATE TABLE dod_contract_news (
  -- See DOD_NEWS_SCRAPER_RESEARCH.md for full schema
);
```

### **Step 3: Build Parser (4 hours)**
```typescript
// src/lib/dod-news-scraper.ts
export async function scrapeDailyAwards(date: Date) {
  // 1. Find article for date
  // 2. Scrape content
  // 3. Parse paragraphs
  // 4. Insert to database
}
```

### **Step 4: Run Backfill (overnight)**
```bash
# Scrape last 2 years
npx tsx src/scripts/dod-news-backfill.ts --years=2

# Let it run in tmux
```

### **Step 5: Daily Automation**
```bash
# Add to cron
0 18 * * 1-5 npx tsx src/scripts/dod-news-daily.ts
```

---

## 🔍 **Key Challenges:**

### **Challenge 1: No API**
**Solution:** HTML scraping with fallback strategies
- Check RSS feed first
- Fall back to archive crawling
- Use multiple selectors (defensive coding)

### **Challenge 2: Free Text Parsing**
**Solution:** Regex + validation
- Multiple patterns for each field
- Confidence scoring
- Manual review for low-confidence

### **Challenge 3: Linking to FPDS**
**Solution:** Contract number matching
```sql
UPDATE dod_contract_news 
SET fpds_contract_id = fpds.transaction_number
FROM fpds_contracts fpds
WHERE dod_news.contract_number = fpds.piid;
```

---

## 📦 **Files to Create:**

```
src/lib/dod-news-scraper.ts          # Core scraper
src/lib/contract-text-parser.ts      # Regex extraction
src/scripts/dod-news-daily.ts        # Daily runner
src/scripts/dod-news-backfill.ts     # Historical scraper
supabase/migrations/create_dod_news.sql  # Database
test-dod-news.ts                     # Manual test
```

---

## 🎯 **Extraction Accuracy Goals:**

| Field | Target Accuracy |
|-------|----------------|
| Vendor Name | 95%+ |
| Contract Number | 90%+ |
| Award Amount | 90%+ |
| Location | 85%+ |
| Description | 100% (it's the whole paragraph) |
| POC | 70%+ (not always present) |

---

## 💡 **Sample Output:**

### **Input (DoD News Paragraph):**
```
Lockheed Martin Corp., Fort Worth, Texas, has been awarded a $45,000,000 
cost-plus-fixed-fee modification (P00011) to previously awarded contract 
FA8615-19-C-6058 for F-35 Lightning II Joint Strike Fighter. Work will be 
performed at Fort Worth, Texas, and is expected to be completed by Dec. 31, 
2025. Air Force Life Cycle Management Center, Wright-Patterson Air Force 
Base, Ohio, is the contracting activity. (Contact: John Smith, 555-1234)
```

### **Output (Structured Data):**
```typescript
{
  vendor_name: "Lockheed Martin Corp.",
  vendor_location: "Fort Worth, Texas",
  contract_number: "FA8615-19-C-6058",
  modification_number: "P00011",
  award_amount: 45000000,
  contract_type: "cost-plus-fixed-fee",
  program_name: "F-35 Lightning II Joint Strike Fighter",
  performance_locations: ["Fort Worth, Texas"],
  completion_date: "2025-12-31",
  contracting_activity: "Air Force Life Cycle Management Center",
  contracting_office_location: "Wright-Patterson Air Force Base, Ohio",
  poc_name: "John Smith",
  poc_phone: "555-1234",
  service_branch: "Air Force",
  confidence: 0.95,
  raw_paragraph: "..."
}
```

---

## 🔗 **Cross-Reference Example:**

```sql
-- Get complete contract picture
SELECT 
  news.vendor_name,
  news.contract_description as "DoD Announcement",
  news.poc_name as "Contact Person",
  news.poc_phone as "Phone",
  fpds.base_and_exercised_options_value as "FPDS Value",
  fpds.naics_description as "Industry",
  fpds.small_business_competitiveness_demonstration_program as "Small Biz?"
FROM dod_contract_news news
LEFT JOIN fpds_contracts fpds 
  ON news.contract_number = fpds.piid
WHERE news.published_date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY news.award_amount DESC
LIMIT 20;
```

---

## ⏱️ **Timeline:**

| Task | Time | When |
|------|------|------|
| Research & validate site | 30 min | Now |
| Create database schema | 1 hour | Today |
| Build core scraper | 4 hours | Tomorrow |
| Build text parser | 4 hours | Tomorrow |
| Test & refine | 2 hours | Day 3 |
| Historical backfill | Overnight | Day 3 |
| **Total** | **~12 hours** | **3 days** |

---

## 🎯 **Success Criteria:**

- ✅ Scrapes 100+ contracts per day
- ✅ 90%+ extraction accuracy
- ✅ Links to 80%+ of FPDS contracts
- ✅ Runs daily without errors
- ✅ Catches up on 2 years of historical data

---

## 📞 **Next Steps:**

1. **Validate URL:** Confirm defense.gov structure hasn't changed
2. **Test One Article:** Manually scrape to understand HTML
3. **Build PoC:** Simple script that parses 10 articles
4. **Full Implementation:** Once PoC works, build full system

---

**Status:** Planned & Documented ✅  
**Priority:** Medium (run alongside FPDS scraper)  
**Estimated Start:** After FPDS scraper is stable

