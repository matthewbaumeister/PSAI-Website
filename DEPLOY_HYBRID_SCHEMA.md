# 🚀 Deploy Hybrid Schema - The Best of Both Worlds

## What You're Getting

**ONE row per contract** (LLM-friendly, clean queries)
**+ Field-level provenance** (know exactly where each field came from)
**+ Full source preservation** (complete audit trail)

This is the **perfect architecture** for your needs!

## 🎯 Quick Deploy (2 Minutes)

### Step 1: Open Supabase SQL Editor

1. Go to https://supabase.com
2. Open your project
3. Click **SQL Editor** → **New Query**

### Step 2: Copy & Run

```bash
# Copy the schema to clipboard
cd /Users/matthewbaumeister/Documents/PropShop_AI_Website
cat supabase/hybrid-schema.sql | pbcopy
```

Then:
1. Paste into SQL Editor
2. Click **Run**
3. Wait ~5 seconds

Done! ✅

### Step 3: Verify

```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'opportunities';
```

Should return: `opportunities` ✅

## 📊 How It Works

### When First Source (defense.gov) Scrapes

```sql
INSERT INTO opportunities VALUES (
  contract_number: 'W31P4Q-20-C-0123',
  vendor_name: 'Lockheed Martin',
  award_amount: 1200000000,
  
  sources: ['defense_gov'],
  source_count: 1,
  
  field_sources: {
    "vendor_name": "defense_gov",
    "award_amount": "defense_gov",
    "description": "defense_gov"
  },
  
  source_data: {
    "defense_gov": {
      "url": "https://defense.gov/...",
      "scraped_at": "2024-12-02T10:00:00Z",
      "vendor": "Lockheed Martin",
      "amount": 1200000000,
      "raw_text": "full paragraph from article..."
    }
  }
);
```

### When Second Source (FPDS) Finds Same Contract

```sql
UPDATE opportunities SET
  -- Add new fields from FPDS
  naics_code: '336411',
  psc_code: 'R425',
  
  -- Update source tracking
  sources: ['defense_gov', 'fpds'],
  source_count: 2,
  
  -- Track which source added which field
  field_sources: {
    "vendor_name": "defense_gov",
    "award_amount": "defense_gov",
    "description": "defense_gov",
    "naics_code": "fpds",  -- NEW from FPDS
    "psc_code": "fpds"     -- NEW from FPDS
  },
  
  -- Preserve raw FPDS data
  source_data: {
    "defense_gov": { ... },
    "fpds": {  -- ADDED
      "url": "https://fpds.gov/...",
      "scraped_at": "2024-12-02T11:00:00Z",
      "vendor": "LOCKHEED MARTIN CORPORATION",
      "amount": 1200000000,
      "naics": "336411",
      "psc": "R425"
    }
  }
WHERE contract_number = 'W31P4Q-20-C-0123';
```

### When Third Source (SAM.gov) Finds It

```sql
UPDATE opportunities SET
  -- Add solicitation details from SAM
  solicitation_number: 'W31P4Q-20-R-0123',
  due_date: '2024-01-15',
  
  sources: ['defense_gov', 'fpds', 'sam_gov'],
  source_count: 3,  -- Badge shows "3 sources"!
  
  field_sources: {
    "vendor_name": "defense_gov",
    "award_amount": "defense_gov",
    "naics_code": "fpds",
    "psc_code": "fpds",
    "solicitation_number": "sam_gov",  -- NEW
    "due_date": "sam_gov"              -- NEW
  },
  
  source_data: {
    "defense_gov": { ... },
    "fpds": { ... },
    "sam_gov": { ... }  -- ADDED
  }
WHERE contract_number = 'W31P4Q-20-C-0123';
```

## 🎨 What the LLM Sees

**Query:**
```sql
SELECT * FROM opportunities WHERE contract_number = 'W31P4Q-20-C-0123';
```

**Returns ONE row with:**
```
contract_number: W31P4Q-20-C-0123
vendor_name: Lockheed Martin
award_amount: $1,200,000,000
naics_code: 336411
psc_code: R425
solicitation_number: W31P4Q-20-R-0123
due_date: 2024-01-15
sources: [defense_gov, fpds, sam_gov]
source_count: 3

field_sources: {
  "vendor_name": "defense_gov",
  "award_amount": "defense_gov",
  "naics_code": "fpds",
  "psc_code": "fpds",
  "solicitation_number": "sam_gov",
  "due_date": "sam_gov"
}

source_data: {
  "defense_gov": { full raw data },
  "fpds": { full raw data },
  "sam_gov": { full raw data }
}
```

**Perfect for LLM!** ✅
- ONE clear answer
- Can trace each field to its source
- Full audit trail preserved

## 🎯 What the UI Shows

**Opportunity Card:**
```
┌─────────────────────────────────────────┐
│ Lockheed Martin                    [3 sources] │
│ $1.2B • Air Force • W31P4Q-20-C-0123    │
│                                         │
│ F-35 Lightning II Maintenance Services  │
│                                         │
│ Badge: "3 sources" (clickable)         │
└─────────────────────────────────────────┘
```

**Click "3 sources" badge:**
```
Sources:
✓ defense.gov - Award announcement
  ├─ vendor_name
  ├─ award_amount
  └─ description
  
✓ FPDS - Contract details
  ├─ naics_code: 336411
  └─ psc_code: R425
  
✓ SAM.gov - Solicitation info
  ├─ solicitation_number
  └─ due_date
```

## 📚 Example Queries

### Find multi-source opportunities
```sql
SELECT 
  contract_number,
  vendor_name,
  award_amount,
  sources,
  source_count
FROM opportunities
WHERE source_count > 1
ORDER BY source_count DESC;
```

### See field provenance
```sql
SELECT 
  contract_number,
  vendor_name,
  field_sources
FROM opportunities
WHERE contract_number = 'W31P4Q-20-C-0123';
```

### Get raw data from specific source
```sql
SELECT 
  contract_number,
  source_data->'defense_gov' as defense_data,
  source_data->'fpds' as fpds_data
FROM opportunities
WHERE contract_number = 'W31P4Q-20-C-0123';
```

### Search (LLM-friendly)
```sql
SELECT * FROM search_opportunities('artificial intelligence', 20);
```

## 🚀 Now Update the Scraper

The scraper needs to be updated to:
1. Check if contract exists (by contract_number)
2. If exists: UPDATE and merge data
3. If new: INSERT new record

Want me to update the scraper for this new schema?

## ✅ Benefits

**For LLM:**
- ✅ ONE row per contract (no confusion)
- ✅ Complete data in one place
- ✅ Simple queries

**For You:**
- ✅ Know exactly where each field came from
- ✅ Full audit trail (raw source data preserved)
- ✅ Quality tracking per source
- ✅ Easy to add more sources later

**For UI:**
- ✅ Clean display (one card per opportunity)
- ✅ Source badges with counts
- ✅ Clickable provenance details

**For Data Quality:**
- ✅ Best value wins (can implement conflict resolution)
- ✅ Completeness scores
- ✅ Quality scores per source
- ✅ Can detect conflicts between sources

## 🎉 Perfect Architecture!

This gives you:
- Simple LLM queries ✅
- Full provenance tracking ✅
- Multi-source consolidation ✅
- Clean UI display ✅
- Audit trail ✅
- Scalability ✅

**Ready to deploy?** Just run the SQL above and then I'll update the scraper!

