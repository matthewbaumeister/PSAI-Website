# 🚨 MISSING MIGRATIONS DETECTED

## ❌ Problem
The `team_work_share` column doesn't exist yet. You need to apply migrations in the correct order.

---

## ✅ Solution: Apply Migrations in Order

### **Step 1: Apply Enhanced Fields Migration**

Open **Supabase SQL Editor** and copy/paste the entire contents of:
```
supabase/migrations/add_all_missing_fields.sql
```

**This adds:**
- ✅ `team_work_share` (JSONB column for percentages)
- ✅ `is_small_business_set_aside`
- ✅ `set_aside_type`
- ✅ `is_teaming`
- ✅ `team_members`, `prime_contractor`, `subcontractors`
- ✅ `naics_code`, `solicitation_number`
- ✅ `industry_tags`, `technology_tags`, `service_tags`
- ✅ 40+ other enhanced fields

**Expected output:**
```
✅ Migration complete!
```

---

### **Step 2: Apply Team Members Table Migration**

Then copy/paste:
```
supabase/migrations/add_team_members_table.sql
```

**This adds:**
- ✅ New table: `dod_contract_team_members`
- ✅ 5 analytics views
- ✅ Auto-calculation trigger
- ✅ Optimized indexes

**Expected output:**
```
✅ Team Members Table Created Successfully!
```

---

### **Step 3: Clear Data & Re-Scrape**

```sql
-- In Supabase SQL Editor
TRUNCATE TABLE dod_contract_news RESTART IDENTITY CASCADE;
```

```bash
# In terminal
cd /Users/matthewbaumeister/Documents/PropShop_AI_Website
npx tsx test-dod-single-article.ts
```

**Look for:**
```
💼 Saved X team members with work share percentages
```

---

### **Step 4: Check Data Accuracy**

Run the diagnostic queries:
```sql
-- Copy and paste contents of CHECK_TEAM_DATA.sql
-- Or run each query individually
```

---

## 📋 Quick Copy Commands

```bash
# Copy migration 1 to clipboard
cat supabase/migrations/add_all_missing_fields.sql | pbcopy

# Copy migration 2 to clipboard
cat supabase/migrations/add_team_members_table.sql | pbcopy

# Copy diagnostic queries to clipboard
cat CHECK_TEAM_DATA.sql | pbcopy
```

---

## ✅ After Setup

You'll have:
- ✅ 40+ enhanced data fields
- ✅ Team members table with work share percentages
- ✅ Weighted award calculations
- ✅ 5 pre-built analytics views
- ✅ Complete teaming intelligence

---

## 🎯 Total Time: 5 minutes

1. Migration 1: 1 min
2. Migration 2: 1 min
3. Clear & scrape: 2 min
4. Verify: 1 min

**Let's do this!** 🚀

