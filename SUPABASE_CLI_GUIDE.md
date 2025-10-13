# Supabase CLI Setup Guide - Fix SBIR Database Without Timeouts

The Supabase SQL Editor has timeout limits. Use the CLI for direct database access with no timeouts.

## Option 1: Supabase CLI (Recommended)

### Step 1: Install Supabase CLI

**macOS (Homebrew):**
```bash
brew install supabase/tap/supabase
```

**Or using npm:**
```bash
npm install -g supabase
```

### Step 2: Login to Supabase
```bash
supabase login
```
This will open a browser window for authentication.

### Step 3: Get Your Project Reference ID

1. Go to your Supabase dashboard: https://app.supabase.com
2. Select your project
3. Go to Settings → General
4. Copy the "Reference ID" (looks like: `abcdefghijklmnop`)

### Step 4: Link Your Project
```bash
supabase link --project-ref YOUR_PROJECT_REF
```
Replace `YOUR_PROJECT_REF` with your actual project reference ID.

### Step 5: Run the Complete Fix Script
```bash
supabase db execute -f SBIR_COMPLETE_FIX.sql
```

This will:
- ✅ Clean all corrupted data
- ✅ Standardize text fields
- ✅ Fix dates and timestamps
- ✅ Remove duplicates
- ✅ Add all necessary indexes
- ✅ No timeout issues

Expected runtime: 2-5 minutes depending on table size.

---

## Option 2: Direct PostgreSQL Connection

If you prefer psql or another database tool:

### Get Connection String

1. Go to Supabase Dashboard → Settings → Database
2. Copy the "Connection string" (Direct connection)
3. Replace `[YOUR-PASSWORD]` with your database password

### Connect and Run
```bash
psql "YOUR_CONNECTION_STRING" -f SBIR_COMPLETE_FIX.sql
```

---

## Option 3: Manual Steps via SQL Editor (If CLI Not Available)

If you can't use CLI, run these smaller batches one at a time in Supabase SQL Editor:

### Batch 1: Delete Invalid Records
```sql
DELETE FROM sbir_final
WHERE (topic_number IS NULL OR topic_number = '')
  OR (title IS NULL OR title = '' OR LENGTH(title) < 5);
```

### Batch 2: Clean Text Fields
```sql
UPDATE sbir_final 
SET 
    topic_number = TRIM(topic_number),
    title = TRIM(title),
    status = TRIM(status)
WHERE topic_number IS NOT NULL;
```

### Batch 3: Standardize Status
```sql
UPDATE sbir_final 
SET status = CASE 
    WHEN LOWER(status) IN ('open', 'active') THEN 'Open'
    WHEN LOWER(status) IN ('closed', 'expired') THEN 'Closed'
    WHEN LOWER(status) IN ('pre-release', 'prerelease') THEN 'Pre-Release'
    ELSE status
END;
```

### Batch 4: Add Most Critical Index (Title Search)
```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX CONCURRENTLY idx_sbir_title_gin 
ON sbir_final USING gin (title gin_trgm_ops);
```

### Batch 5: Add Status Index
```sql
CREATE INDEX CONCURRENTLY idx_sbir_status ON sbir_final (status);
```

### Batch 6: Add Component Index
```sql
CREATE INDEX CONCURRENTLY idx_sbir_component ON sbir_final (component);
```

---

## Verification

After running the fix, verify in Supabase SQL Editor:

```sql
-- Check data quality
SELECT 
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE status IN ('Open', 'Closed', 'Pre-Release')) as clean_status,
    COUNT(*) FILTER (WHERE keywords IS NOT NULL AND keywords != '') as has_keywords
FROM sbir_final;

-- Check indexes
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'sbir_final' 
  AND indexname LIKE 'idx_sbir%';
```

---

## Troubleshooting

### "supabase: command not found"
- Make sure you installed the CLI correctly
- Try restarting your terminal
- For npm install: make sure npm global bin is in your PATH

### "Project not linked"
- Run `supabase link --project-ref YOUR_REF` again
- Make sure you're logged in: `supabase login`

### "Permission denied"
- Make sure you're the owner of the Supabase project
- Or ask the project owner to give you database access

---

## Expected Results

After running SBIR_COMPLETE_FIX.sql:

✅ All invalid records deleted  
✅ Text fields trimmed and standardized  
✅ Status values normalized (Open/Closed/Pre-Release)  
✅ Dates fixed and timestamps regenerated  
✅ Component names standardized  
✅ Duplicates removed  
✅ Keywords generated for all records  
✅ 10 indexes created for fast search  

**Search should be 100x faster after this!**

