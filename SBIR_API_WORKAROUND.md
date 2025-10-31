# SBIR Awards Data - API Access Workaround

## ⚠️ Issue: SBIR.gov API Returns "Forbidden"

The SBIR.gov public API is returning 403 Forbidden errors, which means it may now require authentication or have restricted access.

---

## ✅ Solution: Use Alternative Data Sources

### **Option 1: SBIR.gov Bulk Downloads (RECOMMENDED)**

The SBIR.gov website provides downloadable datasets that don't require API access.

#### **Step-by-Step:**

1. **Visit SBIR.gov Data Resources:**
   - Go to: https://www.sbir.gov/data-resources
   - Or: https://www.sbir.gov/awards

2. **Download Award Data:**
   - Click "Download Awards Data"
   - Select format: **JSON** or **CSV**
   - Choose: "Awards with Abstracts" (more complete data)
   - Note: Downloads are limited to 10,000 records at a time

3. **Filter and Download:**
   - Filter by: Agency (DOD, NASA, etc.)
   - Filter by: Year range (2020-2024)
   - Filter by: Phase (Phase I, Phase II)
   - Click "Download"

4. **Process the Files:**
   ```bash
   # If you downloaded JSON
   # Place files in: /data/sbir-awards/
   
   # Example structure:
   /data/sbir-awards/
     DOD_2024.json
     DOD_2023.json
     NASA_2024.json
     ...
   ```

---

### **Option 2: USASpending.gov API (Alternative Data Source)**

USASpending.gov provides federal contract award data, including SBIR awards.

#### **API Endpoint:**
```bash
# USASpending.gov is more open and doesn't require authentication
curl "https://api.usaspending.gov/api/v2/search/spending_by_award/" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "filters": {
      "keywords": ["SBIR", "Phase I"],
      "award_type_codes": ["A", "B", "C", "D"],
      "time_period": [{"start_date": "2024-01-01", "end_date": "2024-12-31"}]
    },
    "fields": ["Award ID", "Recipient Name", "Award Amount", "Description"],
    "page": 1,
    "limit": 100
  }'
```

**Pros:**
- Free, public API
- No authentication required
- More comprehensive (all federal spending)

**Cons:**
- Different data structure (requires mapping)
- May not have SBIR-specific fields (topic_number)
- More complex queries

---

### **Option 3: Request SBIR.gov API Access**

If you need real-time API access, request credentials from SBIR.gov:

1. **Contact SBIR.gov:**
   - Email: sbir@sba.gov
   - Subject: "API Access Request for Research/Application"
   - Explain your use case (research platform)

2. **Register for an Account:**
   - Visit: https://www.sbir.gov/user/register
   - Request API key/credentials
   - May take 1-2 weeks for approval

3. **Use Authenticated API:**
   ```bash
   curl "https://api.www.sbir.gov/public/api/awards?agency=DOD&year=2024" \
     -H "Authorization: Bearer YOUR_API_KEY"
   ```

---

## 🚀 Recommended Implementation Path

### **Phase 1: Use Bulk Downloads (Now)**

**Pros:**
- ✅ Works immediately
- ✅ No authentication needed
- ✅ Get large datasets quickly
- ✅ Can load historical data

**Cons:**
- ❌ Manual process (not automated)
- ❌ Limited to 10K records per download
- ❌ Need multiple downloads for all data

#### **Implementation:**

1. **Create download directory:**
   ```bash
   mkdir -p data/sbir-awards
   ```

2. **Download data manually:**
   - Go to sbir.gov/data-resources
   - Download DOD 2024 (JSON)
   - Download DOD 2023 (JSON)
   - Download NASA 2024 (JSON)
   - ... repeat for all agencies/years needed

3. **Create import script:**
   ```typescript
   // src/scripts/import-sbir-bulk.ts
   import fs from 'fs';
   import path from 'path';
   import { batchInsertAwards, normalizeAward } from '@/lib/sbir-awards-scraper';
   
   async function importBulkData() {
     const dataDir = path.join(process.cwd(), 'data/sbir-awards');
     const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));
     
     for (const file of files) {
       console.log(`Processing ${file}...`);
       const filePath = path.join(dataDir, file);
       const rawData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
       
       // Assuming the JSON structure from sbir.gov downloads
       const awards = rawData.response?.docs || rawData.docs || rawData;
       
       const normalized = awards.map(normalizeAward);
       await batchInsertAwards(normalized);
       
       console.log(`✅ Imported ${normalized.length} awards from ${file}`);
     }
   }
   
   importBulkData();
   ```

4. **Run import:**
   ```bash
   npx ts-node src/scripts/import-sbir-bulk.ts
   ```

---

### **Phase 2: Try USASpending.gov API (Backup)**

If you need automated updates and SBIR.gov API stays blocked:

1. **Test USASpending.gov API:**
   ```bash
   curl -X POST "https://api.usaspending.gov/api/v2/search/spending_by_award/" \
     -H "Content-Type: application/json" \
     -d '{"filters":{"keywords":["SBIR"],"time_period":[{"start_date":"2024-01-01","end_date":"2024-12-31"}]},"limit":10}'
   ```

2. **Create adapter:**
   ```typescript
   // src/lib/usaspending-adapter.ts
   export async function fetchFromUSASpending(year: number) {
     const response = await fetch('https://api.usaspending.gov/api/v2/search/spending_by_award/', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({
         filters: {
           keywords: ['SBIR', 'STTR'],
           time_period: [{
             start_date: `${year}-01-01`,
             end_date: `${year}-12-31`
           }]
         },
         limit: 100
       })
     });
     
     return response.json();
   }
   ```

3. **Map to SBIR format:**
   - USASpending fields → SBIR fields
   - Contract ID → contract_award_number
   - Recipient Name → company
   - Award Amount → award_amount

---

### **Phase 3: Request Official API Access (Long-term)**

For production use with daily updates:

1. **Register and request access** (see Option 3 above)
2. **Wait for approval** (1-2 weeks)
3. **Update scraper with credentials**
4. **Set up daily cron job**

---

## 📊 Data Coverage Comparison

| Source | Records | Real-time | Auth Required | SBIR-Specific |
|--------|---------|-----------|---------------|---------------|
| **SBIR.gov Bulk** | 200K+ | ❌ | ❌ | ✅ |
| **USASpending.gov** | 1M+ | ✅ | ❌ | ⚠️ (partial) |
| **SBIR.gov API** | 200K+ | ✅ | ✅ | ✅ |

---

## 🎯 Quick Start (Revised)

Since the API is blocked, here's your new path:

### **TODAY:**

1. ✅ **Run SQL migration** (create tables)
   ```sql
   -- Copy SQL from IMPLEMENTATION_STEPS.md
   -- Run in Supabase SQL Editor
   ```

2. ✅ **Download sample data**
   - Go to: https://www.sbir.gov/data-resources
   - Download: DOD 2024 (JSON, 100 records)
   - Save to: `data/sbir-awards/DOD_2024.json`

3. ✅ **Create import script**
   - I'll create this for you next
   - Run: `npx ts-node src/scripts/import-sbir-bulk.ts`

4. ✅ **Verify data imported**
   - Check Supabase: `SELECT COUNT(*) FROM sbir_awards;`
   - Should see ~100 records

### **THIS WEEK:**

1. Download more data files (10K records each):
   - DOD 2023, 2024
   - NASA 2023, 2024
   - NIH 2023, 2024
   - Total: ~60K records

2. Run bulk import for all files

3. Build UI to display awards

### **NEXT WEEK:**

1. Request SBIR.gov API access (for automated updates)
2. Or: Set up USASpending.gov integration (no auth needed)
3. Build daily scraper when API access approved

---

## 📝 Summary

**Problem:** SBIR.gov API returns "Forbidden"

**Solution:** Use bulk downloads from sbir.gov website

**Timeline:**
- ✅ **Today:** Import 100 sample records
- ✅ **This week:** Import 60K+ records (2023-2024)
- ⏳ **Next week:** Request API access for automation
- ⏳ **Week 3:** Build UI components

**Status:** Can still build full feature, just using downloads instead of live API

---

## 🆘 Need Help?

Tell me:
1. "SQL migration complete" → I'll create bulk import script
2. "Downloaded data files" → I'll help you process them
3. "Want to try USASpending API" → I'll create that adapter

Ready to continue? Let's do Step 1 (SQL migration) first!

