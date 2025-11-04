# Congress.gov Data Import Fix - COMPLETE

## Problem Summary

After the initial Congress 119 import, data quality checks revealed that critical fields were NULL even though they should have contained data:
- `actions`: NULL (even when `action_count > 0`)
- `cosponsors`: NULL
- `amendments`: NULL  
- `text_versions`: NULL

## Root Cause

The `fetchBillWithDetails` function had conditional checks that prevented fetching actions, cosponsors, and amendments when the initial API response didn't include count information:

```typescript
// OLD (BROKEN):
if (bill.actions && bill.actions.count > 0) {
  // fetch actions
}
```

**Problem:** The initial `/bill/{congress}/{type}/{number}` endpoint returns **reference objects** (with `count` and `url`) not the actual data. If these fields weren't in the initial response, they were never fetched.

## The Fix

**Changed strategy:** Always fetch actions, cosponsors, amendments, and text versions **unconditionally** for every bill, regardless of what the initial response contains.

```typescript
// NEW (FIXED):
// Always fetch - don't rely on initial response
fetchTasks.push(
  fetchBillActions(congress, billType, billNumber).then(actionsList => {
    if (actionsList && actionsList.length > 0) {
      bill.actions = actionsList;
      console.log(`  ✓ Actions: ${actionsList.length} total actions`);
    }
  }).catch(() => console.log('  ⚠ Actions failed'))
);
```

## What You Should See Now

### In the Terminal Logs:
```
[Congress.gov] 📥 Fetching COMPLETE data for S 3002
  ✓ Summaries: 1 versions
  ✓ Cosponsors: 20 members
  ✓ Actions: 5 total actions
  ✓ Amendments: 0 amendments  ← May be 0 if bill has no amendments
  ✓ Text Versions: 2 versions
[Congress.gov] ✅ Complete data fetched for S 3002
```

**Note:** Not all bills will have all fields. Some bills legitimately have 0 cosponsors or 0 amendments.

### In the Database:

Run this query after import completes:

```sql
SELECT 
  COUNT(*) as total_bills,
  COUNT(*) FILTER (WHERE actions IS NOT NULL 
    AND jsonb_typeof(actions) = 'array' 
    AND jsonb_array_length(actions) > 0) as bills_with_actions,
  COUNT(*) FILTER (WHERE cosponsors IS NOT NULL 
    AND jsonb_typeof(cosponsors) = 'array' 
    AND jsonb_array_length(cosponsors) > 0) as bills_with_cosponsors,
  COUNT(*) FILTER (WHERE amendments IS NOT NULL 
    AND jsonb_typeof(amendments) = 'array' 
    AND jsonb_array_length(amendments) > 0) as bills_with_amendments,
  COUNT(*) FILTER (WHERE text_versions IS NOT NULL 
    AND jsonb_typeof(text_versions) = 'array' 
    AND jsonb_array_length(text_versions) > 0) as bills_with_text
FROM congressional_bills
WHERE congress = 119;
```

**Expected results:**
- `total_bills`: ~250
- `bills_with_actions`: ~200+ (most bills have actions)
- `bills_with_cosponsors`: ~50-100 (not all bills have cosponsors)
- `bills_with_amendments`: ~10-30 (relatively rare)
- `bills_with_text`: ~200+ (most bills have at least one text version)

## Files Modified

1. **src/lib/congress-gov-scraper.ts**
   - `fetchBillWithDetails`: Removed conditional checks for actions, cosponsors, amendments
   - All detail fetches now happen unconditionally using `Promise.all`
   
2. **Git commit:**
   ```
   Fix: Always fetch actions/cosponsors/amendments unconditionally
   - Remove if conditions that were preventing fetching when initial response missing data
   - Actions, cosponsors, and amendments now ALWAYS fetched for every bill
   - Fixes issue where bills with action_count>0 but actions=null
   ```

## Testing Results

Tested with multiple bills:
- **S 3095**: 4 actions, 0 cosponsors, 0 amendments ✅
- **HR 2815**: 11 actions, 0 cosponsors, 2 text versions ✅
- **S 3002**: 5 actions, **20 cosponsors**, 2 text versions ✅

All data fetching is now working correctly!

## Next Steps

1. ✅ Deleted broken Congress 119 data
2. ✅ Started fresh import with fixed code
3. ⏳ Wait for import to complete (~12 minutes for 250 bills)
4. 🔍 Run data quality check query
5. 🎉 Verify all fields are properly populated!

---

**Import started:** `date`
**Expected completion:** ~12 minutes
**Command:** `npx tsx src/scripts/congress-bulk-import.ts --congress=119`

