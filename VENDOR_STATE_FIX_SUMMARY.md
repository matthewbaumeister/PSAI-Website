# Vendor State NULL Issue - FIXED

## Problem Summary
`vendor_state` was being set to NULL in the database despite being extracted correctly by the scraper.

## Root Cause
Found in `supabase/migrations/create_dod_contract_news.sql`:

The `auto_extract_location_fields()` trigger was **overwriting** the scraper's `vendor_state` values with NULL because:

1. **Scraper extracts:** Full state names (e.g., "Ohio", "Michigan") 
2. **Trigger's `extract_state()` function expected:** 2-letter abbreviations (e.g., "OH", "MI")
3. **Result:** Function returned NULL, overwriting the correct value

### The Problematic Code
```sql
CREATE OR REPLACE FUNCTION extract_state(location TEXT) 
RETURNS VARCHAR(2) AS $$
BEGIN
  -- This only matches 2-letter abbreviations!
  RETURN SUBSTRING(location FROM ', ([A-Z]{2})$');
END;
```

### The Trigger
```sql
CREATE OR REPLACE FUNCTION auto_extract_location_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.vendor_location IS NOT NULL THEN
    -- This was ALWAYS overwriting, even if scraper already set the values!
    NEW.vendor_city := extract_city(NEW.vendor_location);
    NEW.vendor_state := extract_state(NEW.vendor_location);  -- Returns NULL for "Ohio"
  END IF;
  RETURN NEW;
END;
```

## The Fix

### Part 1: Update `extract_state()` to handle both formats
```sql
CREATE OR REPLACE FUNCTION extract_state(location TEXT) 
RETURNS VARCHAR(50) AS $$
DECLARE
  state_abbrev TEXT;
  full_state TEXT;
BEGIN
  -- First try 2-letter abbreviation
  state_abbrev := SUBSTRING(location FROM ', ([A-Z]{2})$');
  IF state_abbrev IS NOT NULL THEN
    RETURN state_abbrev;
  END IF;
  
  -- Fallback: extract full state name
  full_state := TRIM(SUBSTRING(location FROM ',\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)$'));
  RETURN full_state;
END;
```

### Part 2: Respect scraper-provided values
```sql
CREATE OR REPLACE FUNCTION auto_extract_location_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Only extract if NOT already set by scraper
  IF NEW.vendor_location IS NOT NULL THEN
    IF NEW.vendor_city IS NULL THEN
      NEW.vendor_city := extract_city(NEW.vendor_location);
    END IF;
    IF NEW.vendor_state IS NULL THEN
      NEW.vendor_state := extract_state(NEW.vendor_location);
    END IF;
  END IF;
  RETURN NEW;
END;
```

## How to Apply the Fix

### Option 1: Run SQL directly (Recommended)
1. Open Supabase Dashboard → SQL Editor
2. Run the file: `FIX_VENDOR_STATE_NOW.sql`
3. This will:
   - Fix the functions
   - Backfill existing NULL values
   - Recalculate quality scores
   - Verify the fix worked

### Option 2: Apply migration
```bash
npx supabase db push
```

## Verification

After applying the fix, run this query:
```sql
SELECT 
  COUNT(*) as total_contracts,
  COUNT(vendor_state) as with_state,
  COUNT(*) FILTER (WHERE vendor_state IS NULL) as missing_state,
  ROUND(100.0 * COUNT(vendor_state) / COUNT(*), 2) as state_coverage_pct
FROM dod_contract_news;
```

You should see `state_coverage_pct` close to 100%.

## Sample Data Check
```sql
SELECT 
  vendor_name,
  vendor_location,
  vendor_city,
  vendor_state,
  data_quality_score
FROM dod_contract_news
WHERE vendor_state IS NOT NULL
ORDER BY scraped_at DESC
LIMIT 20;
```

Should show:
- `vendor_location`: "Kettering, Ohio"
- `vendor_city`: "Kettering"
- `vendor_state`: "Ohio" ✅ (Previously NULL)

## Impact
- Existing records: ~100+ records will be backfilled with correct state values
- New scrapes: Will preserve full state names from scraper
- Quality scores: Will improve for records with complete vendor info
- Search/filtering: Now works correctly by state

## Files Modified
1. `supabase/migrations/create_dod_contract_news.sql` - Updated base migration
2. `supabase/migrations/fix_vendor_state_extraction.sql` - New migration
3. `FIX_VENDOR_STATE_NOW.sql` - Quick-apply SQL script

## Prevention
The trigger now checks if the scraper already set the values before attempting to extract them, preventing future overwrites.

