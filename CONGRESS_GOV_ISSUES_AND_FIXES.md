# Congress.gov Integration - Issues & Fixes

## Current Status (Nov 3, 2025)

### What Works ✅
- API connection successful
- Rate limiting (750ms between requests)
- Bulk import script runs without crashes
- Bills are processed and defense scoring works
- Upsert logic prevents duplicates

### What's Broken ❌

#### 1. **0 Bills Imported** 
**Problem:** Bulk import shows "Success: 0" because no bills meet defense threshold (score >= 30)

**Why:** Congress 119 (current) has mostly non-defense bills. The 250 results from search were Social Security, fisheries, etc.

**Fix Options:**
- A) Lower threshold to 10 (catches more defense-adjacent bills)
- B) Import ALL bills from defense committees regardless of score
- C) Use Congress 118 which has NDAA 2024 (HR 2670)

#### 2. **No Bill Summaries**
**Problem:** All bills show `summary: null`

**Why:** Congress.gov API returns summaries as a reference, not the actual text:
```json
{
  "summaries": {
    "count": 5,
    "url": "https://api.congress.gov/v3/bill/118/hr/2670/summaries"
  }
}
```

**Fix:** Add separate API call to fetch summaries endpoint

#### 3. **Wrong URL Format**
**Problem:** Generated URLs like `https://www.congress.gov/bill/119th-congress/HR-bill/5345`

**Correct format:** `https://www.congress.gov/bill/119th-congress/house-bill/5345`

**Mapping:**
- `hr` → `house-bill`
- `s` → `senate-bill`
- `hjres` → `house-joint-resolution`
- `sjres` → `senate-joint-resolution`

#### 4. **Committees Not Arrays**
**Problem:** API returns `committees: { count: 2, url: "..." }` not an array

**Status:** ✅ Already fixed with `Array.isArray()` check

## How to Check Supabase Data

### Option 1: Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click "SQL Editor" in left sidebar
4. Run this query:

```sql
-- Check if any bills exist
SELECT COUNT(*) as total_bills FROM congressional_bills;

-- View recent bills
SELECT 
  congress,
  bill_type,
  bill_number,
  title,
  is_defense_related,
  defense_relevance_score,
  summary,
  congress_gov_url,
  created_at
FROM congressional_bills 
ORDER BY created_at DESC
LIMIT 10;

-- Check scraping logs
SELECT 
  run_date,
  bills_scraped,
  success,
  error_message
FROM congressional_scraping_logs
ORDER BY run_date DESC
LIMIT 5;
```

### Option 2: Local psql (if installed)
```bash
psql "postgresql://postgres.[PROJECT_ID].supabase.co:5432/postgres" \
  -c "SELECT COUNT(*) FROM congressional_bills;"
```

### Option 3: Check via Code
```bash
npx tsx -e "
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
(async () => {
  const { data, error } = await supabase
    .from('congressional_bills')
    .select('count');
  console.log('Total bills:', data);
})();
"
```

## Next Steps

### Immediate Fixes Needed:
1. ✅ Fix URL format (bill type mapping)
2. ✅ Add summary fetching (separate API call)
3. ✅ Lower defense threshold OR add "import all from defense committees" logic
4. Test with Congress 118 (has actual NDAA bills)

### For Complete Historical Import:
1. Add retry queue for failed bills
2. Add resume logic (save progress to track last imported Congress/bill)
3. Add API key rotation (if you have multiple keys)
4. Run in `tmux` for resilience

## Recommended Test Command

Test with Congress 118 which has actual defense bills:

```bash
# This should import ~50-100 defense bills
npx tsx src/scripts/congress-bulk-import.ts --congress=118
```

Expected output:
```
Found 250 bills in Congress 118
✓ [12/250] HR 2670: National Defense Authorization Act... (score: 100)
✓ [45/250] S 4049: Defense Appropriations... (score: 95)
...
Success: 87 bills imported
Failed: 0 bills
```

## Your Question About Robustness

> "if i run option 3, it has built in api pauses for restrictions and loss of api access etc, and no information will be skipped right?"

**Current Status:**
- ✅ Has API rate limiting (750ms between requests)
- ✅ Continues on individual bill errors
- ✅ Logs all runs to database
- ❌ Does NOT retry failed bills
- ❌ Does NOT resume from where it left off if script crashes
- ❌ Does NOT detect API key expiration

**To make it truly robust, we need:**
1. Failed bill tracking table
2. Resume logic (checkpoint system)
3. API key validation before starting
4. Exponential backoff on errors
5. Run in `tmux` for network resilience

Want me to implement these enhancements?

