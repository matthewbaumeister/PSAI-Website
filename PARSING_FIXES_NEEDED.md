# Critical Parsing Fixes Needed

## Issues Identified:

### 1. ✅ **Full Text Storage - ALREADY WORKING!**

**Status:** ✅ Working correctly

We're already capturing the full text in `raw_paragraph` field:
- Every contract has the full paragraph text
- This is stored for every contract
- Can be used for re-parsing or manual review

**No action needed** - this is already implemented!

---

### 2. 🔴 **FMS Countries Parsing - BROKEN**

**Problem:** The regex is too greedy and captures random text fragments.

**Example from your data:**
```
fms_countries: ["be completed by September"]
fms_countries: ["the United Kingdom"]  ✅ CORRECT
fms_countries: ["United Kingdom","Poland",...36 countries] ❌ TOO MANY (likely wrong)
```

**Root Cause:** The regex pattern is matching too broadly:

```typescript
// CURRENT (BROKEN):
const countryPattern = /Foreign Military Sale.*?to\s+((?:[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:,\s*)?)+)/i;
```

This matches any capitalized words after "to", including phrases like "be completed by September".

**Fixed Version:**

```typescript
function extractFMSInfo(text: string): {
  isFMS: boolean;
  countries: string[];
  amount: number | null;
  percentage: number | null;
} {
  let isFMS = false;
  const countries: string[] = [];
  let amount: number | null = null;
  let percentage: number | null = null;
  
  // Check for FMS indicators
  if (/Foreign Military Sale|FMS/i.test(text)) {
    isFMS = true;
    
    // Extract countries - IMPROVED PATTERNS
    // Pattern 1: "Foreign Military Sales to [country/countries]"
    const fmsToPattern = /Foreign Military Sales?\s+to\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:,\s*(?:and\s+)?[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)*)/i;
    let countryMatch = text.match(fmsToPattern);
    
    if (countryMatch) {
      // Split by comma and "and"
      const countryList = countryMatch[1]
        .split(/,\s*(?:and\s+)?|and\s+/)
        .map(c => c.trim())
        .filter(c => {
          // Filter out invalid entries
          if (c.length < 3) return false;  // Too short
          if (c.includes('will be')) return false;  // Sentence fragment
          if (c.includes('completed')) return false;  // Sentence fragment
          if (c.includes('Dec')) return false;  // Date fragment
          if (/\d/.test(c)) return false;  // Contains numbers
          return true;
        });
      
      countries.push(...countryList);
    }
    
    // Pattern 2: "for [country]" (when single country mentioned)
    if (countries.length === 0) {
      const forCountryPattern = /\bfor\s+(the\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:Foreign Military Sales|FMS)/i;
      countryMatch = text.match(forCountryPattern);
      if (countryMatch) {
        countries.push(countryMatch[2].trim());
      }
    }
    
    // Pattern 3: Country list in parentheses or brackets
    const bracketPattern = /\(([A-Z][a-z]+(?:,\s*[A-Z][a-z]+)+)\)/;
    if (countries.length === 0) {
      countryMatch = text.match(bracketPattern);
      if (countryMatch) {
        const countryList = countryMatch[1]
          .split(/,\s*/)
          .map(c => c.trim())
          .filter(c => c.length > 2 && !/\d/.test(c));
        countries.push(...countryList);
      }
    }
    
    // Extract FMS funding
    const fmsAmountPattern = /funding from foreign partners.*?\$(\d+(?:,\d{3})*)\s*\((\d+)%\)/i;
    const fmsMatch = text.match(fmsAmountPattern);
    if (fmsMatch) {
      amount = parseFloat(fmsMatch[1].replace(/,/g, ''));
      percentage = parseInt(fmsMatch[2]);
    }
  }
  
  return { 
    isFMS, 
    countries: countries.length > 0 ? countries : [], 
    amount, 
    percentage 
  };
}
```

---

### 3. 🔴 **Teaming/Multiple Vendors - NOT CAPTURED**

**Problem:** We're not tracking when multiple companies work together.

**Examples from DoD contracts:**
```
"Lockheed Martin Corp. (prime contractor), teaming with Northrop Grumman..."
"BAE Systems, in partnership with General Dynamics..."
"Raytheon Co., along with subcontractors Boeing and L3Harris..."
```

**Missing Fields:**
- Team members
- Prime vs subcontractor roles
- Joint venture partnerships

**Proposed Schema Addition:**

```sql
ALTER TABLE dod_contract_news
  ADD COLUMN IF NOT EXISTS is_teaming BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS team_members TEXT[],
  ADD COLUMN IF NOT EXISTS prime_contractor TEXT,
  ADD COLUMN IF NOT EXISTS subcontractors TEXT[];
```

**Extraction Function:**

```typescript
function extractTeamingInfo(text: string, primaryVendor: string): {
  isTeaming: boolean;
  teamMembers: string[];
  primeContractor: string | null;
  subcontractors: string[];
} {
  const isTeaming = /team(?:ing)?\s+with|in partnership with|along with|joint venture|subcontractor|prime contractor/i.test(text);
  
  const teamMembers: string[] = [];
  let primeContractor: string | null = null;
  const subcontractors: string[] = [];
  
  if (!isTeaming) {
    return { isTeaming: false, teamMembers: [], primeContractor: null, subcontractors: [] };
  }
  
  // Extract prime contractor
  const primePattern = /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:\s+(?:Corp\.|Co\.|Inc\.|LLC))?)(?:\s+\(prime contractor\)|,\s+as\s+prime)/i;
  const primeMatch = text.match(primePattern);
  if (primeMatch) {
    primeContractor = primeMatch[1].trim();
  } else {
    primeContractor = primaryVendor;  // Assume first vendor is prime
  }
  
  // Extract team members
  const teamPattern = /team(?:ing)?\s+with\s+([^.]+)/i;
  const teamMatch = text.match(teamPattern);
  if (teamMatch) {
    const members = teamMatch[1]
      .split(/,\s*(?:and\s+)?|and\s+/)
      .map(m => m.trim())
      .filter(m => m.length > 3 && /[A-Z]/.test(m));
    teamMembers.push(...members);
  }
  
  // Extract subcontractors
  const subPattern = /subcontractor[s]?\s+(?:include\s+)?([^.]+)/i;
  const subMatch = text.match(subPattern);
  if (subMatch) {
    const subs = subMatch[1]
      .split(/,\s*(?:and\s+)?|and\s+/)
      .map(s => s.trim())
      .filter(s => s.length > 3 && /[A-Z]/.test(s));
    subcontractors.push(...subs);
  }
  
  return { isTeaming, teamMembers, primeContractor, subcontractors };
}
```

---

### 4. 🟡 **Keywords/Tags - NOT AUTOMATED**

**Problem:** No automated keyword extraction from contract descriptions.

**What we need:**
- Industry tags (aerospace, cybersecurity, IT services, etc.)
- Technology tags (AI, cloud, software, hardware, etc.)
- Service type tags (maintenance, R&D, training, logistics, etc.)

**Proposed Schema:**

```sql
ALTER TABLE dod_contract_news
  ADD COLUMN IF NOT EXISTS industry_tags TEXT[],
  ADD COLUMN IF NOT EXISTS technology_tags TEXT[],
  ADD COLUMN IF NOT EXISTS service_tags TEXT[];
```

**Keyword Extraction Function:**

```typescript
function extractKeywords(description: string, contractTypes: string[]): {
  industryTags: string[];
  technologyTags: string[];
  serviceTags: string[];
} {
  const industryTags: string[] = [];
  const technologyTags: string[] = [];
  const serviceTags: string[] = [];
  
  const text = description.toLowerCase();
  
  // Industry patterns
  const industries = [
    { pattern: /aircraft|aviation|aerospace|fighter|bomber/i, tag: 'aerospace' },
    { pattern: /ship|vessel|naval|submarine|maritime/i, tag: 'maritime' },
    { pattern: /cyber|information security|network security/i, tag: 'cybersecurity' },
    { pattern: /software|application|system development/i, tag: 'software' },
    { pattern: /ammunition|weapon|missile|ordnance/i, tag: 'munitions' },
    { pattern: /vehicle|truck|transport|JLTV/i, tag: 'ground_vehicles' },
    { pattern: /satellite|space|orbital/i, tag: 'space' },
    { pattern: /construction|facility|infrastructure/i, tag: 'construction' },
    { pattern: /medical|healthcare|hospital/i, tag: 'medical' },
    { pattern: /training|education|instruction/i, tag: 'training' }
  ];
  
  // Technology patterns
  const technologies = [
    { pattern: /artificial intelligence|AI|machine learning|ML/i, tag: 'ai_ml' },
    { pattern: /cloud|AWS|Azure|GCP/i, tag: 'cloud' },
    { pattern: /radar|sensor|detection/i, tag: 'sensors' },
    { pattern: /communication|radio|datalink/i, tag: 'communications' },
    { pattern: /autonomous|unmanned|drone|UAV|UAS/i, tag: 'autonomous' },
    { pattern: /blockchain|distributed ledger/i, tag: 'blockchain' },
    { pattern: /quantum/i, tag: 'quantum' },
    { pattern: /propulsion|engine|turbine/i, tag: 'propulsion' }
  ];
  
  // Service patterns
  const services = [
    { pattern: /maintenance|repair|overhaul|MRO/i, tag: 'maintenance' },
    { pattern: /research|development|R&D|RDT&E/i, tag: 'research' },
    { pattern: /logistics|supply chain|distribution/i, tag: 'logistics' },
    { pattern: /engineering|design|technical/i, tag: 'engineering' },
    { pattern: /consulting|advisory|analysis/i, tag: 'consulting' },
    { pattern: /training|instruction|education/i, tag: 'training' },
    { pattern: /support|sustainment|operations/i, tag: 'support' },
    { pattern: /integration|installation|implementation/i, tag: 'integration' }
  ];
  
  // Extract matches
  for (const industry of industries) {
    if (industry.pattern.test(text)) {
      industryTags.push(industry.tag);
    }
  }
  
  for (const tech of technologies) {
    if (tech.pattern.test(text)) {
      technologyTags.push(tech.tag);
    }
  }
  
  for (const service of services) {
    if (service.pattern.test(text)) {
      serviceTags.push(service.tag);
    }
  }
  
  return { industryTags, technologyTags, serviceTags };
}
```

---

### 5. 🟡 **Other Parsing Issues to Check**

Run `CHECK_PARSING_ISSUES.sql` to identify:
- Contracts with abnormally long FMS country lists
- FMS countries with invalid characters
- Teaming keywords without proper extraction
- Missing keywords/tags

---

## 🎯 Priority Fixes

### 🔥 **CRITICAL (Fix Immediately)**

1. **Fix FMS Countries Parsing**
   - Current: Broken, capturing sentence fragments
   - Impact: 17 FMS contracts affected
   - Effort: 30 minutes

### 🟡 **HIGH (Fix Soon)**

2. **Add Teaming/Multiple Vendor Tracking**
   - Current: Not captured at all
   - Value: High for subcontracting opportunities
   - Effort: 2 hours

3. **Add Keyword/Tag Extraction**
   - Current: Not automated
   - Value: High for search and filtering
   - Effort: 2 hours

### 🟢 **MEDIUM (Nice to Have)**

4. **Improve Contract Description Quality**
   - Current: Basic extraction
   - Could: Extract better summary text
   - Effort: 1 hour

---

## 📝 Implementation Plan

### Phase 1: Critical Fixes (30 minutes)
```bash
1. Fix FMS countries extraction
2. Add validation filters
3. Re-scrape test data
4. Verify fixes
```

### Phase 2: Teaming Tracking (2 hours)
```bash
1. Add schema columns
2. Create extraction function
3. Integrate into scraper
4. Test with sample data
```

### Phase 3: Keywords/Tags (2 hours)
```bash
1. Add schema columns
2. Create keyword extraction
3. Build tag dictionaries
4. Integrate and test
```

---

## 🧪 Testing Commands

```sql
-- Check FMS parsing
\i CHECK_PARSING_ISSUES.sql

-- Verify raw_paragraph storage
SELECT vendor_name, LENGTH(raw_paragraph) as text_length
FROM dod_contract_news
ORDER BY text_length DESC
LIMIT 10;

-- Check for teaming keywords
SELECT vendor_name, contract_description
FROM dod_contract_news
WHERE raw_paragraph ~* 'team|subcontractor|prime'
LIMIT 10;
```

---

## 🚀 Ready to Fix?

Want me to implement:
1. **Fix FMS countries parsing** (30 min) ← Do this first!
2. **Add teaming tracking** (2 hours)
3. **Add keyword extraction** (2 hours)

Let me know which to prioritize!

