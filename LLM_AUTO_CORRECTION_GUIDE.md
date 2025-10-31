# LLM Auto-Correction of Database Metadata

## Problem Solved

**Observation:** SF254-D1205 shows "Direct to Phase II: **false**" in the database, but the instruction PDFs clearly show a DP2 structure (Volume 2A + 2B).

**Root Cause:** The scraper only looks at the DSIP topic page, which doesn't always indicate DP2 status. The **instruction PDFs** are the source of truth.

**Solution:** During LLM instruction analysis, **extract metadata** from the PDFs and **auto-correct** the database.

---

## How It Works

### Step 1: LLM Extracts Metadata

While analyzing instructions, the LLM now **also extracts**:

```json
{
  "discovered_metadata": {
    "is_direct_to_phase_ii": true,
    "phases_available": ["Phase II"],
    "phase_1_max_funding": 250000,
    "phase_1_duration_months": 6,
    "phase_2_max_funding": 1800000,
    "phase_2_duration_months": 24,
    "page_limits": [
      {"volume": "Volume 2A", "pages": 5},
      {"volume": "Volume 2B", "pages": 20}
    ],
    "submission_deadline": "2026-01-15",
    "qa_deadline": "2025-12-20",
    "key_contacts": ["Jane Smith, Program Manager"],
    "data_quality_notes": [
      "Scraped data incorrectly shows 'false' for DP2",
      "Instructions clearly indicate Volume 2A + 2B structure"
    ]
  }
}
```

### Step 2: Reconciliation

The `reconcileMetadata()` function compares:
- **Existing database values** (from scraper)
- **Discovered values** (from LLM instruction analysis)

### Step 3: Auto-Update

If discrepancies are found, the database is **automatically updated**:

```
Before: is_direct_to_phase_ii = "false"
After:  is_direct_to_phase_ii = "Yes"

Before: phases_available = "Phase I, Phase II, Phase III"
After:  phases_available = "Phase II"
```

### Step 4: Logging

All changes are logged:

```json
{
  "reconciliation": {
    "updates": {
      "is_direct_to_phase_ii": "Yes",
      "phases_available": "Phase II"
    },
    "changes": [
      "Direct to Phase II: 'false' → 'Yes' (from instruction analysis)",
      "Phases Available: 'Phase I, Phase II, Phase III' → 'Phase II' (from instruction analysis)"
    ],
    "data_quality_notes": [
      "Scraped data may incorrectly show 'false' for Direct to Phase II"
    ],
    "applied": true
  }
}
```

---

## Fields Auto-Corrected

| Field | Update Logic |
|-------|--------------|
| `is_direct_to_phase_ii` | Always update if different |
| `phases_available` | Always update if different |
| `phase_1_award_amount` | Only if existing is null/zero |
| `phase_1_duration_months` | Only if existing is null/zero |
| `phase_2_award_amount` | Only if existing is null/zero |
| `phase_2_duration_months` | Only if existing is null/zero |

**Why "only if null/zero" for some?**  
We don't want to overwrite valid scraped funding data with potentially incorrect instruction mentions. We only fill in **missing** data.

---

## Testing

### Test Case: SF254-D1205

**Before:**
1. Visit: https://prop-shop.ai/opportunities/SF254-D1205
2. Check "Phase Information" card
3. Should show: `Direct to Phase II: false`

**Trigger Analysis:**
1. Expand "Consolidated Submission Instructions"
2. Click "Generate Smart Compliance Analysis"
3. Wait 60-120 seconds

**Check Logs:**
Look for in server logs:
```
[LLM Analysis] Reconciling metadata...
[LLM Analysis] Applying 2 metadata corrections: {
  is_direct_to_phase_ii: 'Yes',
  phases_available: 'Phase II'
}
```

**Verify Update:**
1. Refresh the opportunity page
2. Check "Phase Information" card
3. Should now show: `Direct to Phase II: Yes` ✅
4. Should show: `Available Phases: Phase II` ✅

---

## Response Structure

The API now returns a `reconciliation` object:

```json
{
  "success": true,
  "opportunity": {...},
  "analysis": {...},
  "reconciliation": {
    "updates": {
      "is_direct_to_phase_ii": "Yes",
      "phases_available": "Phase II"
    },
    "changes": [
      "Direct to Phase II: 'false' → 'Yes' (from instruction analysis)",
      "Phases Available: 'Phase I, Phase II, Phase III' → 'Phase II' (from instruction analysis)"
    ],
    "data_quality_notes": [
      "Scraped data may incorrectly show 'false' for Direct to Phase II"
    ],
    "applied": true
  }
}
```

---

## Benefits

### 1. Data Quality Improvement
- **Before:** Scraper misses DP2 flags
- **After:** LLM catches and corrects them

### 2. Missing Data Population
- **Before:** Many opportunities missing funding amounts
- **After:** LLM extracts from instructions

### 3. Single Source of Truth
- Instructions are ALWAYS the authoritative source
- Database auto-corrects to match instructions
- No manual data entry needed

### 4. Audit Trail
- All changes logged
- Before/after values tracked
- Source attribution: "(from instruction analysis)"

### 5. Scalability
- Runs automatically during analysis
- No additional API calls
- Works for all 32,000+ opportunities

---

## Future Enhancements

### UI Notification
Show a banner on the opportunity page after analysis:
```
✅ Data Quality Update Applied
   • Direct to Phase II corrected: false → Yes
   • Phases Available corrected: Phase I, Phase II, Phase III → Phase II
   Source: LLM instruction analysis
```

### Bulk Correction Report
Create an admin dashboard showing:
- Total corrections applied
- Most common discrepancies
- Opportunities needing review

### Manual Review Queue
Flag certain corrections for manual review:
- Large funding discrepancies
- Major structural changes
- Unclear instruction language

---

## Cost

**No additional cost!**

Metadata extraction happens **during the existing LLM analysis**. The LLM is already reading the full instruction documents, so extracting metadata is "free" within the same API call.

---

## What Happens Next

1. **Deploy & Monitor**
   - Watch logs for reconciliation outputs
   - Verify corrections are accurate

2. **Test 10+ Opportunities**
   - Generate analysis for various opportunity types
   - Check before/after database values
   - Ensure no false positives

3. **Add UI Feedback**
   - Show reconciliation results to user
   - Let them know data was corrected
   - Build trust in the system

4. **Expand to More Fields**
   - Extract tech areas from instructions
   - Pull out key deadlines
   - Identify program manager contacts

5. **Create Admin Dashboard**
   - Show all corrections made
   - Allow manual review/revert
   - Track data quality metrics

---

## Example: SF254-D1205 Step-by-Step

### Current State (Database)
```
is_direct_to_phase_ii: "false"
phases_available: "Phase I, Phase II, Phase III"
```

### LLM Reads Instructions
```
Component PDF Section 2A: "Feasibility Documentation (DP2 Only)"
Component PDF Section 2B: "Technical Proposal (DP2 Only)"
```

### LLM Extracts Metadata
```json
{
  "is_direct_to_phase_ii": true,
  "phases_available": ["Phase II"],
  "data_quality_notes": [
    "DP2 detected from Volume 2A + 2B structure",
    "Scraped data incorrectly shows 'false'"
  ]
}
```

### Reconciliation Compares
```
Database: is_direct_to_phase_ii = "false"
LLM:      is_direct_to_phase_ii = true
MISMATCH DETECTED ❌

Database: phases_available = "Phase I, Phase II, Phase III"
LLM:      phases_available = "Phase II"
MISMATCH DETECTED ❌
```

### Database Updated
```sql
UPDATE sbir_final
SET 
  is_direct_to_phase_ii = 'Yes',
  phases_available = 'Phase II',
  instructions_checklist = {...},
  instructions_generated_at = '2025-10-31T...'
WHERE topic_id = 'sf254d1205...';
```

### Changes Logged
```
[LLM Analysis] Applying 2 metadata corrections:
  - Direct to Phase II: "false" → "Yes" (from instruction analysis)
  - Phases Available: "Phase I, Phase II, Phase III" → "Phase II" (from instruction analysis)
```

### User Sees Corrected Data
```
Phase Information
- Available Phases: Phase II ✅
- Direct to Phase II: Yes ✅
```

---

## Questions & Answers

**Q: What if the LLM is wrong?**  
A: The LLM is analyzing the official instruction PDFs, which are the source of truth. If there's an error, it would be in the instructions themselves. We also log all changes for review.

**Q: Can we revert a correction?**  
A: Yes, you can manually update the database or re-run the scraper to get the original scraped values.

**Q: Will this fix all opportunities automatically?**  
A: Only opportunities that get their instructions analyzed will be corrected. We can run bulk analysis to fix all active opportunities.

**Q: Does this slow down the analysis?**  
A: No, metadata extraction happens in the same LLM call as the instruction analysis.

**Q: What if funding amounts differ significantly?**  
A: We only fill in missing (null/zero) funding data. We don't overwrite existing valid amounts to avoid incorrect corrections.

---

## Summary

**The LLM now serves dual purpose:**
1. ✅ Analyze instructions (create submission guide)
2. ✅ Extract metadata (auto-correct database)

**Result:** Database becomes more accurate with every analysis run, automatically! 🎯

