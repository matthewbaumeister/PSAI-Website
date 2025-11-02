# Remaining 10% Analysis: What Else Can We Capture?

## 📊 Current Coverage Status

**Overall Data Extraction: 90%**

### What We're Capturing Well (90-100%):
✅ Vendor information (name, city, state, location)
✅ Contract amounts
✅ Contract types (91.7%)
✅ Service branches
✅ Quality scores

### What We're Partially Capturing (25-50%):
⚠️ Performance location breakdowns (25%)
⚠️ Funding sources (43.8%)
⚠️ Completion dates (45.8%)

### What We're Missing (0-10%):
❌ Contracting activity/office (6.25%)
❌ Start dates (0%)
❌ NAICS codes (0%)
❌ PSC codes (0%)
❌ POC information (0%)
❌ Program names (0%)
❌ Small business set-aside types (0%)

---

## 🎯 The Remaining 10%: What to Build Next

### 1. **NAICS Codes** (High Value, Common in Contracts)

**What it is:** North American Industry Classification System codes identify the type of work.

**Example patterns in contracts:**
```
"...under NAICS code 336411..."
"...NAICS 541330 (engineering services)..."
"...This contract was competitively procured via SAM.gov under solicitation number N0002425R0004, NAICS code 541715..."
```

**Extraction strategy:**
```typescript
function extractNAICS(text: string): string | null {
  // Pattern: NAICS followed by 6-digit code
  const naicsMatch = text.match(/NAICS\s+(?:code\s+)?(\d{6})/i);
  if (naicsMatch) {
    return naicsMatch[1];
  }
  return null;
}
```

**Estimated coverage if implemented:** 30-50% of contracts

---

### 2. **Set-Aside Types** (High Value for Small Business Tracking)

**What it is:** Identifies which small business program was used.

**Example patterns:**
```
"This contract was a small business set-aside."
"This contract was competitively procured via SAM.gov under a 100% small business set-aside."
"woman-owned small business set-aside"
"service-disabled veteran-owned small business set-aside"
"8(a) sole source"
"HUBZone set-aside"
```

**Common types:**
- Small Business Set-Aside (SBSA)
- 8(a) Business Development
- HUBZone
- Service-Disabled Veteran-Owned Small Business (SDVOSB)
- Woman-Owned Small Business (WOSB)
- Economically Disadvantaged Woman-Owned Small Business (EDWOSB)

**Extraction strategy:**
```typescript
function extractSetAsideType(text: string): string | null {
  const patterns = [
    { regex: /8\(a\)\s+(?:sole\s+source|set-?aside)/i, type: '8(a)' },
    { regex: /HUBZone\s+set-?aside/i, type: 'HUBZone' },
    { regex: /service-disabled\s+veteran-owned\s+small\s+business/i, type: 'SDVOSB' },
    { regex: /woman-owned\s+small\s+business/i, type: 'WOSB' },
    { regex: /economically\s+disadvantaged\s+woman-owned/i, type: 'EDWOSB' },
    { regex: /small\s+business\s+set-?aside/i, type: 'Small Business Set-Aside' },
    { regex: /total\s+small\s+business/i, type: 'Total Small Business' }
  ];
  
  for (const pattern of patterns) {
    if (pattern.regex.test(text)) {
      return pattern.type;
    }
  }
  return null;
}
```

**Estimated coverage if implemented:** 40-60% of contracts

---

### 3. **Contracting Office/Activity** (Medium Value)

**What it is:** The specific military office that awarded the contract.

**Current status:** Only 6.25% captured (3 of 48 contracts)

**Example patterns:**
```
"The contracting activity is Naval Surface Warfare Center, Dahlgren Division, Dahlgren, Virginia."
"Naval Air Warfare Center Aircraft Division, Patuxent River, Maryland, is the contracting activity."
"The Air Force Installation Contracting Center, MacDill Air Force Base, Florida, is the contracting activity."
```

**Why low coverage?** Our current extraction is too narrow. The pattern varies significantly.

**Improved extraction strategy:**
```typescript
function extractContractingActivity(text: string): string | null {
  // Pattern 1: "The contracting activity is..."
  let match = text.match(/[Tt]he\s+contracting\s+activity\s+is\s+([^.]+)/);
  if (match) {
    return match[1].trim();
  }
  
  // Pattern 2: "..., [Location], is the contracting activity"
  match = text.match(/([^,]+,\s+[^,]+),\s+is\s+the\s+contracting\s+activity/);
  if (match) {
    return match[1].trim();
  }
  
  // Pattern 3: End of paragraph with location
  match = text.match(/\(([^)]+)\s+is\s+the\s+contracting\s+activity\)/);
  if (match) {
    return match[1].trim();
  }
  
  return null;
}
```

**Estimated coverage if improved:** 60-80% of contracts

---

### 4. **Award Dates / Start Dates** (Medium Value)

**What it is:** When the contract was actually awarded (vs. published).

**Current status:** 0% captured (schema exists but not populated)

**Example patterns:**
```
"The contract was awarded on Nov. 30, 2024."
"This award was signed on December 1, 2024."
"...awarded [date]..."
```

**Extraction strategy:**
```typescript
function extractAwardDate(text: string, publishedDate: Date): Date | null {
  const patterns = [
    /awarded\s+(?:on\s+)?([A-Z][a-z]+\.?\s+\d{1,2},?\s+\d{4})/i,
    /signed\s+(?:on\s+)?([A-Z][a-z]+\.?\s+\d{1,2},?\s+\d{4})/i,
    /effective\s+(?:date\s+)?([A-Z][a-z]+\.?\s+\d{1,2},?\s+\d{4})/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return parseDate(match[1]);
    }
  }
  
  // Default: assume published date is award date
  return publishedDate;
}
```

**Estimated coverage if implemented:** 20-40% of contracts

---

### 5. **Solicitation Numbers** (Medium-High Value)

**What it is:** The original RFP/solicitation number.

**Example patterns:**
```
"This contract was competitively procured via SAM.gov under solicitation number N0002425R0004..."
"...solicitation FA8611-24-R-0001..."
"...RFP number W912GB-24-R-0001..."
```

**Extraction strategy:**
```typescript
function extractSolicitationNumber(text: string): string | null {
  const match = text.match(/solicitation\s+(?:number\s+)?([A-Z0-9-]+)/i);
  if (match) {
    return match[1];
  }
  
  const rfpMatch = text.match(/RFP\s+(?:number\s+)?([A-Z0-9-]+)/i);
  if (rfpMatch) {
    return rfpMatch[1];
  }
  
  return null;
}
```

**Estimated coverage if implemented:** 40-60% of contracts

---

### 6. **Program Names / Weapon Systems** (High Value)

**What it is:** The specific military program or weapon system.

**Current status:** 0% captured

**Example patterns:**
```
"...for the F-35 Joint Strike Fighter program..."
"...in support of the MQ-9 Reaper..."
"...for the Littoral Combat Ship (LCS)..."
"...Arleigh Burke-class destroyer..."
"...Virginia-class submarine..."
```

**Extraction strategy:**
```typescript
function extractProgramName(text: string): string | null {
  // Common weapon systems
  const weaponSystems = [
    /F-\d+[A-Z]?\s+[A-Za-z\s]+/,  // F-35 Lightning II
    /MQ-\d+\s+[A-Za-z]+/,          // MQ-9 Reaper
    /\b[A-Z][a-z]+-class\s+\w+/,   // Virginia-class submarine
    /Joint Strike Fighter/i,
    /JLTV/i,  // Joint Light Tactical Vehicle
  ];
  
  for (const pattern of weaponSystems) {
    const match = text.match(pattern);
    if (match) {
      return match[0].trim();
    }
  }
  
  // Generic program extraction
  const programMatch = text.match(/for\s+the\s+([A-Z][^,.]+(?:program|system|aircraft|ship|submarine))/i);
  if (programMatch) {
    return programMatch[1].trim();
  }
  
  return null;
}
```

**Estimated coverage if implemented:** 30-50% of contracts

---

### 7. **Delivery/Performance Period** (Medium Value)

**What it is:** When the work will be performed (vs. when contract ends).

**Example patterns:**
```
"Work will be performed through November 2027."
"The period of performance is 60 months."
"Work is expected to be completed by [date]."
"...with a base period of 12 months and four 12-month option periods..."
```

**We currently capture `completion_date` at 45.8% coverage.**

**Improvement strategy:**
```typescript
function extractPerformancePeriod(text: string): {
  startDate?: Date;
  endDate?: Date;
  durationMonths?: number;
} {
  const result: any = {};
  
  // Duration extraction
  const durationMatch = text.match(/period\s+of\s+(?:performance\s+is\s+)?(\d+)\s+months?/i);
  if (durationMatch) {
    result.durationMonths = parseInt(durationMatch[1]);
  }
  
  // End date extraction (improved)
  const endPatterns = [
    /completed?\s+(?:by|in)\s+([A-Z][a-z]+\.?\s+\d{1,2},?\s+\d{4})/i,
    /(?:through|until)\s+([A-Z][a-z]+\.?\s+\d{4})/i,
    /completion\s+date\s+is\s+([A-Z][a-z]+\.?\s+\d{1,2},?\s+\d{4})/i
  ];
  
  for (const pattern of endPatterns) {
    const match = text.match(pattern);
    if (match) {
      result.endDate = parseDate(match[1]);
      break;
    }
  }
  
  return result;
}
```

**Estimated coverage if improved:** 60-80% of contracts

---

## 🔍 Mods vs New Work Tracking

### Current Status: ✅ GOOD

**We are tracking:**
- ✅ `is_modification` - Boolean flag
- ✅ `modification_number` - Mod number (e.g., "P00022")
- ✅ `base_contract_number` - Parent contract reference
- ✅ `modification_type` - "option exercise", "other modification"
- ✅ `is_option_exercise` - Specific flag for option exercises

### What We Could Improve:

#### 1. **Distinguish More Mod Types**

Current: "option exercise" or "other modification"

Could add:
```typescript
type ModificationType = 
  | 'option_exercise'
  | 'scope_change'
  | 'funding_modification'
  | 'administrative'
  | 'termination'
  | 'extension'
  | 'other';
```

#### 2. **Track Cumulative Mod Value**

For contracts with multiple modifications, track:
- Original base value
- Sum of all modifications
- Cumulative total

**Schema addition needed:**
```sql
ALTER TABLE dod_contract_news
  ADD COLUMN IF NOT EXISTS cumulative_mods_value NUMERIC(15, 2),
  ADD COLUMN IF NOT EXISTS mod_history JSONB; -- Array of previous mods
```

#### 3. **Better Parent Contract Linking**

Currently we extract `base_contract_number` but don't link to existing records.

**Could add:**
```sql
ALTER TABLE dod_contract_news
  ADD COLUMN IF NOT EXISTS parent_contract_id UUID REFERENCES dod_contract_news(id);
```

---

## 📋 Priority Recommendations

### 🔥 **HIGH PRIORITY** (Implement Next)

1. **Set-Aside Types** (40-60% coverage potential)
   - High business value
   - Clear patterns
   - Easy to extract

2. **NAICS Codes** (30-50% coverage potential)
   - Industry classification
   - Common in contracts
   - Standardized format

3. **Improved Contracting Activity** (60-80% coverage potential)
   - Currently only 6.25%
   - Clear patterns exist
   - Just need better regex

### 🟡 **MEDIUM PRIORITY**

4. **Program Names** (30-50% coverage potential)
   - High value for defense tracking
   - Moderate complexity

5. **Solicitation Numbers** (40-60% coverage potential)
   - Links to original RFPs
   - Easy to extract

6. **Performance Period Improvements** (from 45% to 70%)
   - Better date extraction
   - Duration tracking

### 🟢 **LOW PRIORITY** (Nice to Have)

7. **Award Dates** (20-40% coverage potential)
   - Usually same as publish date
   - Low differentiation value

8. **POC Information** (5-10% coverage potential)
   - Rarely included in announcements
   - Privacy concerns

---

## 💡 Quick Win: Null Reduction Strategy

### Fields to Focus On:

1. **`completion_date`** (45.8% → 70%)
   - Improve date extraction patterns
   - Add "through [Month] [Year]" pattern
   - Extract from "...months after award" language

2. **`contracting_activity`** (6.25% → 70%)
   - Fix regex patterns (see above)
   - Handle more variations

3. **`performance_location_breakdown`** (25% → 40%)
   - Currently only extracts when percentages are explicit
   - Could infer from "primarily in [location]" language

4. **`funding_sources`** (43.8% → 60%)
   - Better fiscal year extraction
   - Handle combined funding sources

---

## 🎯 Summary: The Remaining 10%

The remaining 10% consists of:

### Fields Not Currently Populated:
- NAICS codes (0%)
- Set-aside types (0%)
- Program names (0%)
- Solicitation numbers (0%)
- Award dates (0%)
- POC information (0%)

### Fields Needing Improvement:
- Contracting activity (6.25% → 70% potential)
- Completion dates (45.8% → 70% potential)
- Performance breakdowns (25% → 40% potential)
- Funding sources (43.8% → 60% potential)

### **Recommended Next Phase:**

**Phase 1: Quick Wins (1-2 hours)**
- ✅ Fix contracting activity extraction
- ✅ Improve completion date patterns
- ✅ Add NAICS code extraction
- ✅ Add set-aside type extraction

**Expected coverage increase: 90% → 93%**

**Phase 2: Medium Effort (3-4 hours)**
- Add program name extraction
- Add solicitation number extraction
- Improve performance period tracking
- Add more detailed modification type tracking

**Expected coverage increase: 93% → 95%**

**Phase 3: Diminishing Returns**
- POC extraction (low value, rarely present)
- Award date vs publish date (usually same)
- Additional edge cases

**Expected coverage increase: 95% → 96%**

---

## 🚀 Quick Implementation

Want me to implement Phase 1 (quick wins) now?

1. Fix contracting activity (6% → 70%)
2. Add NAICS extraction (0% → 40%)
3. Add set-aside types (0% → 50%)
4. Improve completion dates (45% → 65%)

**This would take us from 90% → 93% coverage in about 1-2 hours of work.**

