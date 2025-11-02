# 🎯 RUN THIS SQL NOW

## Step 1: Open Supabase SQL Editor

Go to your Supabase project → SQL Editor

---

## Step 2: Copy This File

**File to run:**
```
supabase/migrations/add_all_missing_fields.sql
```

**Quick copy command:**
```bash
cat supabase/migrations/add_all_missing_fields.sql | pbcopy
```

Then **paste and run** in Supabase SQL Editor.

---

## Step 3: Then Run Second Migration

**File to run:**
```
supabase/migrations/add_team_members_table.sql
```

**Quick copy command:**
```bash
cat supabase/migrations/add_team_members_table.sql | pbcopy
```

Then **paste and run** in Supabase SQL Editor.

---

## Step 4: Clear Data & Re-Scrape

```sql
-- In Supabase SQL Editor
TRUNCATE TABLE dod_contract_news RESTART IDENTITY CASCADE;
```

```bash
# In terminal
npx tsx test-dod-single-article.ts
```

---

## ✅ That's It!

These 2 migrations will:
- Add `team_work_share` column
- Add 40+ other enhanced fields
- Create `dod_contract_team_members` table
- Add 5 analytics views
- Set up all triggers

**Total time: 3 minutes**

