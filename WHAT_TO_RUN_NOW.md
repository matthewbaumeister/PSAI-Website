# ⚡ What To Run Now - Quick Start

## 🎯 5 Commands, 10 Minutes Total

---

### ✅ **Command 1: Apply Migration** (2 min)

**Open:** Supabase SQL Editor  
**Run:**
```sql
\i supabase/migrations/add_all_missing_fields.sql
```
**Expected:** "All missing fields added successfully!"

---

### ✅ **Command 2: Clear Old Data** (30 sec)

**Stay in:** Supabase SQL Editor  
**Run:**
```sql
TRUNCATE TABLE dod_contract_news RESTART IDENTITY CASCADE;
```
**Expected:** "TRUNCATE TABLE"

---

### ✅ **Command 3: Run Scraper** (2 min)

**Open:** Terminal  
**Run:**
```bash
cd /Users/matthewbaumeister/Documents/PropShop_AI_Website
npx tsx test-dod-single-article.ts
```
**Expected:** "48 contracts found, 48 contracts saved"

---

### ✅ **Command 4: Run Tests** (2 min)

**Back to:** Supabase SQL Editor  
**Run:**
```sql
\i RUN_ALL_TESTS.sql
```
**Expected:** All tests show ✅ PASS or ⚠️ RARE

---

### ✅ **Command 5: Check Your Bug** (1 min)

**Stay in:** Supabase SQL Editor  
**Run:**
```sql
SELECT 
  vendor_name,
  is_small_business_set_aside,  
  set_aside_type,
  SUBSTRING(raw_paragraph, 1, 150) as text_sample
FROM dod_contract_news
WHERE vendor_name LIKE '%Advanced Navigation%';
```

**Expected:**
```
| vendor_name                            | is_small_business_set_aside | set_aside_type           | text_sample                                    |
|----------------------------------------|----------------------------|--------------------------|------------------------------------------------|
| Advanced Navigation and Positioning... | true                       | Small Business Set-Aside | ...This contract is a result of a small business set-aside... |
```

---

## ✅ If All Pass

You're done! Your scraper is fixed and ready for production.

**Next:** Run full scrape with `npx tsx src/lib/dod-news-scraper.ts`

---

## ❌ If Something Fails

### Test 1 Failed (Set-Aside)?
```sql
-- Debug: See what was extracted
SELECT raw_paragraph, is_small_business_set_aside, set_aside_type
FROM dod_contract_news
WHERE raw_paragraph ~* 'set-aside'
LIMIT 3;
```

### Test 2 Failed (FMS)?
```sql
-- Debug: Check FMS countries
SELECT fms_countries, raw_paragraph
FROM dod_contract_news
WHERE is_fms = true
LIMIT 3;
```

### Other Issues?
Read: `COMPLETE_FIX_TESTING_GUIDE.md` for detailed troubleshooting

---

## 📊 Quick Validation

After all 5 commands, run this to see everything at once:

```sql
SELECT 
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE is_small_business_set_aside = true) as set_aside_count,
  COUNT(*) FILTER (WHERE is_fms = true) as fms_count,
  COUNT(*) FILTER (WHERE is_teaming = true) as teaming_count,
  COUNT(naics_code) as naics_count,
  COUNT(contracting_activity) as contracting_activity_count,
  AVG(array_length(industry_tags, 1)) as avg_industry_tags
FROM dod_contract_news;
```

**Expected:**
- `total` = 48
- `set_aside_count` > 0 ✅
- `fms_count` > 0 ✅
- `contracting_activity_count` > 30 ✅ (was 3 before)
- `avg_industry_tags` > 1.5 ✅

---

## 🎉 That's It!

**5 commands, 10 minutes, everything fixed!**

See `COMPLETE_FIX_SUMMARY.md` for full details.

