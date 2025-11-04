# Congress.gov Data Quality Verification Guide

## 🎯 How to Verify You Got EVERYTHING

After all imports complete, run this SQL script in Supabase:

```
VERIFY_COMPLETE_CONGRESS_IMPORT.sql
```

## ✅ What "Complete" Looks Like

### 1. OVERALL SUMMARY
**Expected:**
- Congress 119: ~250 bills
- Congress 118: ~250 bills  
- Congress 117: ~250 bills
- **Total: ~750 bills**

### 2. DATA COMPLETENESS
**Expected Percentages:**

| Field | Congress 119 | Congress 118/117 |
|-------|-------------|------------------|
| **Title** | 100% | 100% |
| **Bill Type** | 100% | 100% |
| **Bill Number** | 100% | 100% |
| **Summary** | 60-80% | 80-95% |
| **Actions** | 90-95% | 95-100% |
| **Cosponsors** | 30-50% | 50-70% |
| **Amendments** | 5-15% | 10-30% |
| **Text Versions** | 80-90% | 90-100% |
| **Committees** | 85-95% | 90-100% |

**Why some are lower:**
- **Cosponsors:** Not all bills have cosponsors (some have 0 legitimately)
- **Amendments:** Rare - only major bills get amendments
- **Summary:** New bills (119) may not have summaries yet

### 3. DATA RICHNESS (Averages)

**Congress 119 (New Session):**
- Avg Actions: 2-5
- Avg Cosponsors: 1-3
- Avg Amendments: 0-1
- Max Actions: 20-30
- Max Amendments: 5-10

**Congress 118/117 (Complete Sessions):**
- Avg Actions: 10-20
- Avg Cosponsors: 5-15
- Avg Amendments: 2-5
- **Max Actions: 50-200+**
- **Max Amendments: 50-300+** (NDAA bills!)

### 4. POTENTIAL DATA ISSUES

**Expected:** 
- **0 rows** showing bills with `action_count > 0` but `actions = NULL`

**If you see rows here:** Something went wrong! These bills need to be re-imported.

### 5. RICHEST BILLS (Top 10)

**What to Look For:**

Congress 118 should show:
- **HR 2670** (NDAA FY2024): 100+ actions, 50+ amendments
- Bills with 10+ cosponsors
- Bills with 5+ text versions

Congress 117 should show:
- **HR 7900** (NDAA FY2023): 150+ actions, 100+ amendments
- Major defense authorization bills
- Appropriations bills with rich histories

**If top bills have < 10 actions:** Data might be incomplete.

### 6. DEFENSE-RELATED BILLS

**Expected Distribution:**

| Score Range | Percentage | Examples |
|------------|-----------|----------|
| **High (30+)** | 10-20% | NDAA, Military Pay Acts |
| **Medium (10-29)** | 20-30% | Defense-related appropriations |
| **Low (5-9)** | 40-50% | Tangentially related |
| **Very Low (0-4)** | 20-30% | Minimal defense connection |

### 7. BROKEN REFERENCE CHECK

**Expected:** 
- **All 0** for broken references

**If you see numbers > 0:**
```
broken_actions: 5      ← BAD! 
broken_cosponsors: 10  ← BAD!
broken_amendments: 3   ← BAD!
```

This means we stored API reference objects instead of actual data. Need to re-import!

### 8. KEY BILLS VERIFICATION

**Must-Have Bills (Should appear with rich data):**

**Congress 118 (2023-2024):**
- HR 2670 - National Defense Authorization Act FY2024
  - Expected: 100+ actions, 50+ amendments
  
**Congress 117 (2021-2022):**
- HR 7900 - NDAA FY2023
  - Expected: 150+ actions, 100+ amendments
- S 1605 - Uyghur Forced Labor Prevention Act
  - Expected: 50+ actions (became law)

**If these are missing or have < 20 actions:** Major problem!

### 9. FINAL SUMMARY

**Expected:**
```
congresses_imported: 3
total_bills_imported: ~750
bills_with_valid_actions: ~650-700 (85-95%)
bills_with_issues: 0-50 (< 5%)
data_quality_percentage: > 90%
```

**Quality Thresholds:**
- ✅ **Excellent:** > 95% data quality
- ✅ **Good:** 90-95% data quality  
- ⚠️ **Acceptable:** 85-90% data quality
- ❌ **Poor:** < 85% data quality (re-import needed)

### 10. IMPORT SUCCESS RATE

**Expected:**
```
Congress 119: 250 bills → ✓ Complete
Congress 118: 250 bills → ✓ Complete
Congress 117: 250 bills → ✓ Complete
```

**If any show < 240 bills:** Some failed to import. Check import logs.

## 🚨 Red Flags

### CRITICAL Issues (Re-import Required):
1. ❌ **Any broken reference objects** (Check 7)
2. ❌ **Bills with action_count > 0 but actions = NULL** (Check 4)
3. ❌ **Missing NDAA bills** (Check 8)
4. ❌ **< 240 bills per Congress** (Check 10)
5. ❌ **Data quality < 85%** (Check 9)

### WARNING Issues (Investigate):
1. ⚠️ **< 90% have actions** for Congress 118/117
2. ⚠️ **< 80% have text_versions** for Congress 118/117
3. ⚠️ **Top 10 richest bills have < 20 actions** for Congress 118/117
4. ⚠️ **Max amendments < 50** for Congress 118/117

## 📊 Sample "Perfect" Results

### Check 2: Data Completeness (Congress 118)
```
total_bills: 250
has_title: 250 (100%)
has_actions: 245 (98%)
has_cosponsors: 150 (60%)
has_amendments: 45 (18%)
has_text_versions: 240 (96%)
```

### Check 3: Data Richness (Congress 118)
```
avg_actions: 15.3
avg_cosponsors: 8.2
avg_amendments: 3.5
max_actions: 187
max_amendments: 243
```

### Check 5: Richest Bills (Sample)
```
HR 2670 | National Defense Authorization... | 187 actions | 56 cosponsors | 243 amendments
S 4638  | Military Construction Veteran... | 92 actions  | 23 cosponsors | 18 amendments
HR 8245 | Department of Defense Appropri... | 78 actions  | 34 cosponsors | 45 amendments
```

### Check 7: Broken References
```
broken_actions: 0
broken_cosponsors: 0
broken_amendments: 0
broken_text_versions: 0
```

### Check 9: Final Summary
```
congresses_imported: 3
total_bills_imported: 750
bills_with_valid_actions: 715
bills_with_issues: 0
data_quality_percentage: 95.3%
```

## 🎯 Quick Validation Checklist

After running `VERIFY_COMPLETE_CONGRESS_IMPORT.sql`, check:

- [ ] **Check 10:** All 3 Congresses show "✓ Complete"
- [ ] **Check 7:** All broken reference counts = 0
- [ ] **Check 4:** No rows returned (no incomplete bills)
- [ ] **Check 8:** NDAA bills present with 100+ actions
- [ ] **Check 9:** Data quality > 90%
- [ ] **Check 3:** Max amendments > 50 for Congress 118/117
- [ ] **Check 5:** Top bills have rich data (50+ actions)

**If ALL boxes checked:** 🎉 **YOU GOT EVERYTHING!**

## 🔄 What to Do If Data Is Incomplete

### Minor Issues (90-95% quality):
- Some bills legitimately have no cosponsors/amendments
- This is normal and expected

### Major Issues (< 90% quality):
1. Check import logs for errors
2. Re-run specific failed bills
3. Delete and re-import affected Congress

### Delete & Re-import Command:
```sql
-- Delete Congress 118 data
DELETE FROM congressional_bills WHERE congress = 118;

-- Then re-run:
npx tsx src/scripts/congress-bulk-import.ts --congress=118
```

## 📈 Expected Import Times

- **Per Congress:** 12-15 minutes
- **250 bills × 3 seconds/bill** = ~12.5 minutes
- **All 3 Congresses in parallel:** ~15 minutes total

---

**Run verification after imports complete!**  
**Script:** `VERIFY_COMPLETE_CONGRESS_IMPORT.sql`

