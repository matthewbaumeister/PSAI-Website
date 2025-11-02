# DoD Contract News Scraper - Implementation Steps

## ⚠️ **Important Note:**

Defense.gov **blocks automated scrapers** with Access Denied (403). We need to use proper headers or headless browser.

---

## 📋 **Step-by-Step Implementation:**

### **Phase 1: Database Setup (5 minutes)**

#### **Step 1: Run Migration**

1. Open Supabase SQL Editor
2. Copy entire contents of `supabase/migrations/create_dod_contract_news.sql`
3. Execute
4. Verify tables created:
   ```sql
   SELECT * FROM dod_contract_news LIMIT 1;
   SELECT * FROM dod_news_scraper_log LIMIT 1;
   ```

---

### **Phase 2: Test Site Access (10 minutes)**

#### **Step 2: Test Basic Scraping**

```bash
# Run test scraper
npx tsx test-dod-scraper.ts
```

**Expected outcomes:**
- ✅ **Success:** HTML downloaded, saved to `dod-test-output.html`
- ❌ **Access Denied:** Need to use Puppeteer (headless browser)

---

### **Phase 3A: If Basic Fetch Works** (2 hours)

Use the cheerio-based approach from research doc.

#### **Files to create:**
1. `src/lib/dod-news-scraper.ts` - Core logic
2. `src/lib/contract-text-parser.ts` - Regex extraction
3. `src/scripts/dod-news-daily.ts` - Daily scraper

---

### **Phase 3B: If Site Blocks (Likely)** (3 hours)

Use **Puppeteer** (headless browser):

#### **Step 3: Install Puppeteer**
```bash
npm install puppeteer
```

#### **Step 4: Create Puppeteer-based scraper**

```typescript
// src/lib/dod-news-scraper-puppeteer.ts
import puppeteer from 'puppeteer';

export async function fetchArticleWithBrowser(url: string) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    
    // Set realistic browser headers
    await page.setUserAgent('Mozilla/5.0...');
    
    // Navigate to page
    await page.goto(url, { waitUntil: 'networkidle0' });
    
    // Extract content
    const data = await page.evaluate(() => {
      return {
        title: document.querySelector('h1')?.textContent,
        date: document.querySelector('.published-date')?.textContent,
        body: document.querySelector('.article-body')?.innerHTML
      };
    });
    
    return data;
  } finally {
    await browser.close();
  }
}
```

---

### **Phase 4: Parse Contract Paragraphs** (2 hours)

#### **Step 5: Create text parser**

```typescript
// src/lib/contract-text-parser.ts
export function parseContractParagraph(text: string) {
  return {
    vendorName: extractVendorName(text),
    contractNumber: extractContractNumber(text),
    amount: extractAmount(text),
    location: extractLocation(text),
    // ... more fields
  };
}

function extractContractNumber(text: string): string | null {
  const patterns = [
    /\b([A-Z]{2}\d{4}-\d{2}-[A-Z]-\d{4})\b/,
    /\b(W\d{4,}[A-Z0-9\-]+)\b/,
    /\b(N\d{5}[A-Z0-9\-]+)\b/,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1];
  }
  
  return null;
}

// Similar functions for other fields...
```

---

### **Phase 5: Daily Scraper** (1 hour)

#### **Step 6: Create daily scraper script**

```typescript
// src/scripts/dod-news-daily.ts
async function scrapeDailyAwards() {
  // 1. Find today's contract awards article
  const article = await findContractAwardsArticle(new Date());
  
  // 2. Scrape article content
  const content = await scrapeArticle(article.url);
  
  // 3. Parse paragraphs
  const contracts = parseContractParagraphs(content.body);
  
  // 4. Insert to database
  await insertContracts(contracts);
  
  // 5. Link to FPDS
  await linkToFPDS();
}
```

---

### **Phase 6: Historical Backfill** (Overnight)

#### **Step 7: Backfill script**

```typescript
// src/scripts/dod-news-backfill.ts
async function backfillHistoricalData(years: number = 2) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - years);
  
  // Scrape backwards day by day
  for (let date = endDate; date >= startDate; date.setDate(date.getDate() - 1)) {
    await scrapeDayIfNotExists(date);
    await sleep(2000); // Be respectful to server
  }
}
```

---

## 🚀 **Quick Start Commands:**

### **1. Database Setup**
```sql
-- In Supabase SQL Editor
-- Paste contents of create_dod_contract_news.sql
```

### **2. Test Site Access**
```bash
npx tsx test-dod-scraper.ts
```

### **3A. If Basic Fetch Works:**
```bash
# Build cheerio-based scraper
# Follow DOD_NEWS_SCRAPER_RESEARCH.md
```

### **3B. If Site Blocks (Use Puppeteer):**
```bash
npm install puppeteer
# Build browser-based scraper
```

### **4. Test Parsing**
```bash
npx tsx test-contract-parser.ts
```

### **5. Run Daily Scraper**
```bash
npx tsx src/scripts/dod-news-daily.ts
```

### **6. Backfill Historical**
```bash
npx tsx src/scripts/dod-news-backfill.ts --years=2
```

---

## 🛠️ **Alternative Approaches:**

### **Option 1: RSS Feed** (Easiest if available)
```bash
curl "https://www.defense.gov/DesktopModules/ArticleCS/RSS.ashx?ContentType=1&Site=945"
```

### **Option 2: Bulk Download** (If available)
Check if defense.gov offers data exports or APIs

### **Option 3: Third-Party Data** (If blocked entirely)
- GovWin
- Bloomberg Government
- USASpending.gov (already have this!)

---

## 📊 **Expected Timeline:**

| Phase | Time | Task |
|-------|------|------|
| 1 | 5 min | Database setup |
| 2 | 10 min | Test site access |
| 3 | 2-3 hours | Build scraper (depends on blocking) |
| 4 | 2 hours | Build parser |
| 5 | 1 hour | Daily scraper |
| 6 | Overnight | Historical backfill |
| **Total** | **~6-7 hours** | Full implementation |

---

## ⚠️ **Key Challenges:**

1. **Site Blocking** - Defense.gov actively blocks scrapers
   - Solution: Puppeteer with realistic headers
   
2. **JavaScript Rendering** - Site may require JS to load content
   - Solution: Headless browser (Puppeteer/Playwright)
   
3. **Rate Limiting** - Too many requests = IP ban
   - Solution: Add delays (2-5 seconds between requests)
   
4. **Changing HTML** - Site structure may change
   - Solution: Multiple selector strategies, defensive coding

---

## 🎯 **Success Criteria:**

- [ ] Can fetch at least one article without 403 error
- [ ] Can extract article title and date
- [ ] Can parse at least 80% of contract fields
- [ ] Can insert data into Supabase
- [ ] Can link to FPDS contracts by contract number
- [ ] Daily scraper runs without errors
- [ ] Backfill completes 2 years of data

---

## 📞 **Next Steps (Right Now):**

1. ✅ Run `test-dod-scraper.ts` to test site access
2. ⏸️ If blocked, install Puppeteer
3. ⏸️ Inspect `dod-test-output.html` to understand HTML structure
4. ⏸️ Build parser for contract paragraphs
5. ⏸️ Test on 10-20 articles
6. ⏸️ Build daily scraper
7. ⏸️ Run backfill overnight

---

**Let's start with Step 1!** 🚀

