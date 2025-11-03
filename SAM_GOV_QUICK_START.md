# SAM.gov Phase 2 - Quick Start

## 🚀 Ready to Deploy in 3 Steps

### Step 1: Run Migrations (2 minutes)

Open Supabase SQL Editor and run these files **in order**:

```sql
-- First migration
supabase/migrations/create_sam_gov_opportunities.sql

-- Second migration
supabase/migrations/create_sam_fpds_linking_function.sql
```

### Step 2: Test the Scraper (5 minutes)

```bash
cd /Users/matthewbaumeister/Documents/PropShop_AI_Website

# Test with last 3 days (small test)
npx tsx scrape-sam-gov-opportunities.ts --days=3
```

Watch for:
```
✅ Inserted: X
🔗 Linked to FPDS: Y
```

### Step 3: Verify It Worked

Run in Supabase SQL Editor:

```sql
-- Check opportunities were inserted
SELECT COUNT(*) FROM sam_gov_opportunities;

-- Check linking worked
SELECT COUNT(*) FROM sam_fpds_linked;

-- Get a real SAM.gov link to test
SELECT ui_link 
FROM sam_gov_opportunities 
WHERE ui_link IS NOT NULL 
LIMIT 1;
```

Copy the `ui_link` and open in browser. Should work now!

---

## ✅ Success Criteria

You'll know it's working when:

1. **Opportunities table has data:** `SELECT COUNT(*) FROM sam_gov_opportunities;` returns > 0
2. **Links work:** Clicking a `ui_link` opens the actual opportunity on SAM.gov
3. **Linking works:** `SELECT * FROM sam_fpds_linked LIMIT 10;` shows matched records
4. **FPDS contracts updated:** Run `SELECT COUNT(*) FROM fpds_contracts WHERE sam_gov_opportunity_url LIKE '%sam.gov/opp/%';`

---

## 🎯 Next: Run Full Scrape

After testing works, scrape more data:

```bash
# Last 90 days
npx tsx scrape-sam-gov-opportunities.ts --days=90

# Entire year
npx tsx scrape-sam-gov-opportunities.ts --from=2024-01-01 --to=2024-12-31

# Run in tmux for long scrapes
tmux new -s sam-scraper
npx tsx scrape-sam-gov-opportunities.ts --from=2023-01-01 --to=2024-12-31
# Ctrl+B then D to detach
```

---

## 📊 What You Get

Now every FPDS contract can show:

**Before (What they wanted):**
- Full Statement of Work
- Technical requirements
- Evaluation criteria
- Set-aside information
- Q&A from vendors

**After (What they got):**
- Who won
- Contract value
- Modifications
- Performance data

**PropShop AI users can now understand the complete story of each contract!** 🎉

---

## Need Help?

See full documentation: `SAM_GOV_PHASE2_COMPLETE.md`

