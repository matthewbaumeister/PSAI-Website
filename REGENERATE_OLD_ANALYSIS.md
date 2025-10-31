# Regenerate Old Analysis Data

## Step 1: Check Which Need Regeneration

Run the SQL queries in `CHECK_OLD_ANALYSIS_DATA.sql` in Supabase SQL Editor.

**Key queries:**
- Query 3: Shows count of OLD vs NEW format
- Query 4: Lists all opportunities needing regeneration

## Step 2: Option A - Manual Regeneration (Small Number)

If only a few opportunities need regeneration:

1. Visit each opportunity page
2. Click the "Regenerate" button in the blue banner
3. Wait 60-120 seconds per opportunity

**Opportunities to check:**
- CBD254-011 (already tested)
- (Add others from Query 4 results)

## Step 3: Option B - Bulk API Regeneration (Many Opportunities)

If many need regeneration, use the existing bulk API:

### Get Active Opportunities with Old Data

```sql
-- Run in Supabase SQL Editor
SELECT 
  topic_id
FROM sbir_final
WHERE instructions_checklist IS NOT NULL
  AND (
    instructions_checklist->>'proposal_phase' IS NULL 
    OR instructions_checklist->'toc_reconciliation' IS NULL
  )
  AND status IN ('Open', 'Prerelease', 'Pre-Release', 'Active');
```

### Call Bulk Generation API

**Option 1: Regenerate ALL active opportunities (recommended)**

```bash
curl -X POST https://prop-shop.ai/api/admin/generate-all-instructions
```

This will:
- Find all active opportunities
- Regenerate instructions for ALL of them (including old data)
- Return summary of successes/failures
- Takes: ~5-10 minutes for 28 opportunities

**Option 2: Manual bulk call (if you have specific IDs)**

```bash
# Create a file with topic IDs
echo "topic_id1
topic_id2
topic_id3" > topic_ids.txt

# Call API for each
while read topic_id; do
  echo "Generating for $topic_id..."
  curl -X POST https://prop-shop.ai/api/admin/analyze-instructions/$topic_id
  sleep 2  # Wait between calls
done < topic_ids.txt
```

## Step 4: Verify Regeneration

Run Query 3 again to check:

```sql
SELECT 
  CASE 
    WHEN instructions_checklist->>'proposal_phase' IS NULL 
      OR instructions_checklist->'toc_reconciliation' IS NULL 
    THEN 'OLD FORMAT'
    ELSE 'NEW FORMAT'
  END as format_version,
  COUNT(*) as count
FROM sbir_final
WHERE instructions_checklist IS NOT NULL
GROUP BY format_version;
```

Should show:
- OLD FORMAT: 0
- NEW FORMAT: X (all of them)

## Step 5: Check Results on Website

Visit a regenerated opportunity:
1. https://prop-shop.ai/opportunities/CBD254-011
2. Should see:
   - ✅ Purple "Direct to Phase II (DP2)" badge
   - ✅ TOC Reconciliation section
   - ✅ Collapsible volumes
   - ✅ No blue "Updated Analysis Available" banner

## Estimated Time & Cost

**For 28 active opportunities:**
- Time: ~5-10 minutes (parallel processing)
- Cost: ~$0.42 (28 × $0.015 each)
- Benefit: All get new detailed format

**Recommendation:**
Run the bulk API once to regenerate all active opportunities. This ensures:
- No old data
- All have new format
- Consistent user experience
- All future visitors see best version

## Troubleshooting

**If bulk API fails:**
- Check Vercel function logs
- Verify OpenAI API key is active
- Check rate limits (shouldn't be an issue for 28)
- Retry individual failures manually

**If some still show old format:**
- Hard refresh page (Cmd+Shift+R)
- Check database to confirm new data was saved
- Regenerate that specific one manually

