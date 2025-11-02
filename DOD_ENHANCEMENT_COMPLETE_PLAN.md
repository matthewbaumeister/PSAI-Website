# DoD Contract Scraper - Complete Enhancement Plan
## Extract EVERYTHING from Contract Announcements

Based on analysis of actual DoD contract articles, here's the complete implementation plan to extract **ALL** available data.

---

## Phase 1: Database Schema Updates

### New Tables & Columns

```sql
-- =====================================================
-- Step 1: Add Contract Structure Fields
-- =====================================================
ALTER TABLE dod_contract_news 
  -- Contract Types (can have multiple)
  ADD COLUMN contract_types TEXT[], -- ['firm-fixed-price', 'cost-plus-fixed-fee', 'IDIQ']
  ADD COLUMN is_idiq BOOLEAN DEFAULT FALSE,
  ADD COLUMN is_multiple_award BOOLEAN DEFAULT FALSE,
  ADD COLUMN is_hybrid_contract BOOLEAN DEFAULT FALSE,
  
  -- Options & Cumulative Value
  ADD COLUMN has_options BOOLEAN DEFAULT FALSE,
  ADD COLUMN base_contract_value NUMERIC(15,2), -- Original award amount
  ADD COLUMN options_value NUMERIC(15,2), -- Additional if options exercised
  ADD COLUMN cumulative_value_with_options NUMERIC(15,2), -- Total possible value
  ADD COLUMN options_period_end_date DATE, -- "through August 2033"
  
  -- Modifications
  ADD COLUMN is_modification BOOLEAN DEFAULT FALSE,
  ADD COLUMN modification_number TEXT, -- "PZ0001", "P00022"
  ADD COLUMN base_contract_number TEXT, -- Parent contract being modified
  ADD COLUMN is_option_exercise BOOLEAN DEFAULT FALSE,
  ADD COLUMN modification_type TEXT, -- 'option exercise', 'scope change', 'funding increase'
  
  -- Foreign Military Sales
  ADD COLUMN is_fms BOOLEAN DEFAULT FALSE,
  ADD COLUMN fms_countries TEXT[], -- ['United Kingdom', 'Australia']
  ADD COLUMN fms_amount NUMERIC(15,2),
  ADD COLUMN fms_percentage NUMERIC(5,2),
  
  -- Competition
  ADD COLUMN is_competed BOOLEAN,
  ADD COLUMN competition_type TEXT, -- 'full and open', 'sole source', 'limited competition'
  ADD COLUMN number_of_offers_received INTEGER,
  ADD COLUMN non_compete_authority TEXT, -- '10 U.S. Code 2304(c)(1)'
  ADD COLUMN non_compete_justification TEXT,
  
  -- SBIR/STTR Enhanced
  ADD COLUMN is_sbir BOOLEAN DEFAULT FALSE,
  ADD COLUMN sbir_phase TEXT, -- 'Phase I', 'Phase II', 'Phase III'
  ADD COLUMN is_sbir_sole_source BOOLEAN DEFAULT FALSE,
  
  -- Multiple Award Info
  ADD COLUMN number_of_awardees INTEGER, -- For multiple award contracts
  ADD COLUMN is_combined_announcement BOOLEAN DEFAULT FALSE, -- "along with several other vendors"
  ADD COLUMN original_announcement_date DATE, -- "originally announced on Sept. 2, 2025"
  
  -- Performance Locations (Enhanced with percentages)
  ADD COLUMN performance_location_breakdown JSONB,
  -- Format: [{"location": "Norfolk, Virginia", "percentage": 35, "city": "Norfolk", "state": "Virginia"}, ...]
  
  -- Funding Breakdown
  ADD COLUMN funding_sources JSONB,
  -- Format: [{"fiscal_year": 2025, "type": "weapons procurement (Navy)", "amount": 120400000, "percentage": 65}, ...]
  ADD COLUMN total_obligated_amount NUMERIC(15,2),
  ADD COLUMN funds_expire BOOLEAN,
  ADD COLUMN funds_expire_date DATE,
  
  -- Small Business Type (Enhanced)
  ADD COLUMN is_small_business_set_aside BOOLEAN DEFAULT FALSE,
  ADD COLUMN set_aside_type TEXT; -- '8(a)', 'SDVOSB', 'HUBZone', 'WOSB'

-- =====================================================
-- Step 2: Add Indexes for Performance
-- =====================================================
CREATE INDEX idx_dod_contract_types ON dod_contract_news USING GIN(contract_types);
CREATE INDEX idx_dod_is_idiq ON dod_contract_news(is_idiq) WHERE is_idiq = TRUE;
CREATE INDEX idx_dod_is_fms ON dod_contract_news(is_fms) WHERE is_fms = TRUE;
CREATE INDEX idx_dod_is_modification ON dod_contract_news(is_modification) WHERE is_modification = TRUE;
CREATE INDEX idx_dod_sbir_phase ON dod_contract_news(sbir_phase) WHERE sbir_phase IS NOT NULL;
CREATE INDEX idx_dod_funding_sources ON dod_contract_news USING GIN(funding_sources);
CREATE INDEX idx_dod_performance_breakdown ON dod_contract_news USING GIN(performance_location_breakdown);

-- =====================================================
-- Step 3: Add Comments for Documentation
-- =====================================================
COMMENT ON COLUMN dod_contract_news.contract_types IS 'Array of contract types: FFP, CPFF, CPIF, IDIQ, etc.';
COMMENT ON COLUMN dod_contract_news.cumulative_value_with_options IS 'Total contract value if all options are exercised';
COMMENT ON COLUMN dod_contract_news.performance_location_breakdown IS 'JSONB array with locations and percentages';
COMMENT ON COLUMN dod_contract_news.funding_sources IS 'JSONB array with fiscal year, type, amount, percentage';
COMMENT ON COLUMN dod_contract_news.is_fms IS 'TRUE if contract includes Foreign Military Sales';
COMMENT ON COLUMN dod_contract_news.non_compete_authority IS 'Legal authority for sole source procurement';
```

---

## Phase 2: Extraction Functions

### 1. Contract Types Extractor

```typescript
function extractContractTypes(text: string): {
  types: string[];
  isIDIQ: boolean;
  isMultipleAward: boolean;
  isHybrid: boolean;
} {
  const types: string[] = [];
  let isIDIQ = false;
  let isMultipleAward = false;
  let isHybrid = false;
  
  // Contract type patterns
  const typePatterns = {
    'firm-fixed-price': /\bfirm-fixed-price\b/i,
    'cost-plus-fixed-fee': /\bcost-plus-fixed-fee\b/i,
    'cost-plus-incentive-fee': /\bcost-plus-incentive-fee\b/i,
    'fixed-price-incentive-fee': /\bfixed-price-incentive-fee\b/i,
    'cost-reimbursable': /\bcost-reimbursable\b/i,
    'cost-only': /\bcost-only\b/i,
    'time-and-materials': /\btime-and-materials\b/i,
  };
  
  // Check for each type
  for (const [type, pattern] of Object.entries(typePatterns)) {
    if (pattern.test(text)) {
      types.push(type);
    }
  }
  
  // Check for IDIQ
  if (/indefinite-delivery\/indefinite-quantity|IDIQ/i.test(text)) {
    types.push('IDIQ');
    isIDIQ = true;
  }
  
  // Check for multiple award
  if (/multiple award/i.test(text)) {
    isMultipleAward = true;
  }
  
  // Check if hybrid (more than one type)
  if (/hybrid/i.test(text) || types.length > 2) {
    isHybrid = true;
  }
  
  return { types, isIDIQ, isMultipleAward, isHybrid };
}
```

### 2. Options & Cumulative Value Extractor

```typescript
function extractOptionsInfo(text: string, baseAmount: number): {
  hasOptions: boolean;
  optionsValue: number | null;
  cumulativeValue: number | null;
  optionsPeriodEndDate: Date | null;
} {
  let hasOptions = false;
  let optionsValue: number | null = null;
  let cumulativeValue: number | null = null;
  let optionsPeriodEndDate: Date | null = null;
  
  // Check for options
  if (/includes options|optional line items|if exercised/i.test(text)) {
    hasOptions = true;
  }
  
  // Extract cumulative value
  // "would bring the cumulative value to $1,906,010,000"
  // "could increase the amount to $745,678,290"
  const cumulativePattern = /(?:cumulative value|increase.*?to|total value).*?\$(\d+(?:,\d{3})*(?:\.\d+)?)/i;
  const cumulativeMatch = text.match(cumulativePattern);
  if (cumulativeMatch) {
    cumulativeValue = parseFloat(cumulativeMatch[1].replace(/,/g, ''));
    if (baseAmount) {
      optionsValue = cumulativeValue - baseAmount;
    }
  }
  
  // Extract options period end date
  // "If all options are exercised, work will continue through August 2033"
  const optionsDatePattern = /options are exercised.*?(?:through|until)\s+(\w+\s+\d{4})/i;
  const optionsDateMatch = text.match(optionsDatePattern);
  if (optionsDateMatch) {
    optionsPeriodEndDate = new Date(optionsDateMatch[1]);
  }
  
  return { hasOptions, optionsValue, cumulativeValue, optionsPeriodEndDate };
}
```

### 3. Performance Locations with Percentages

```typescript
function extractPerformanceLocations(text: string): {
  locations: string[];
  cities: string[];
  states: string[];
  breakdown: Array<{location: string; city: string; state: string; percentage: number}>;
} {
  const locations: string[] = [];
  const cities: string[] = [];
  const states: string[] = [];
  const breakdown: Array<{location: string; city: string; state: string; percentage: number}> = [];
  
  // "Work will be performed in Norfolk, Virginia (35%); Bremerton, Washington (25%); ..."
  const workLocationPattern = /Work will be performed in ([^.]+?)(?:,\s*and is expected|\.|;and)/i;
  const workMatch = text.match(workLocationPattern);
  
  if (workMatch) {
    const locationText = workMatch[1];
    
    // Match each location with percentage
    // "Norfolk, Virginia (35%)"
    const locationRegex = /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*\((\d+(?:\.\d+)?)%\)/g;
    let match;
    
    while ((match = locationRegex.exec(locationText)) !== null) {
      const city = match[1].trim();
      const state = match[2].trim();
      const percentage = parseFloat(match[3]);
      const location = `${city}, ${state}`;
      
      locations.push(location);
      cities.push(city);
      states.push(state);
      breakdown.push({ location, city, state, percentage });
    }
    
    // Also match locations without specific percentages
    // "various locations outside the continental U.S. (13%)"
    const genericPattern = /([^;,]+?)\s*\((\d+(?:\.\d+)?)%\)/g;
    while ((match = genericPattern.exec(locationText)) !== null) {
      const location = match[1].trim();
      const percentage = parseFloat(match[2]);
      
      if (!locations.includes(location) && !location.match(/^[A-Z][a-z]+,/)) {
        breakdown.push({ location, city: '', state: '', percentage });
      }
    }
  }
  
  return { locations, cities, states, breakdown };
}
```

### 4. Funding Sources Extractor

```typescript
function extractFundingSources(text: string): {
  sources: Array<{fiscal_year: number; type: string; amount: number; percentage: number}>;
  totalObligated: number;
  fundsExpire: boolean;
} {
  const sources: Array<{fiscal_year: number; type: string; amount: number; percentage: number}> = [];
  let totalObligated = 0;
  let fundsExpire = true; // Default assumption
  
  // "Fiscal 2025 weapons procurement (Navy) funds in the amount of $120,400,000 (65%)"
  const fundingPattern = /Fiscal\s+(\d{4})\s+([^)]+)\)\s+funds\s+in\s+the\s+amount\s+of\s+\$(\d+(?:,\d{3})*)\s*(?:\((\d+)%\))?/gi;
  let match;
  
  while ((match = fundingPattern.exec(text)) !== null) {
    const fiscal_year = parseInt(match[1]);
    const type = match[2].trim();
    const amount = parseFloat(match[3].replace(/,/g, ''));
    const percentage = match[4] ? parseInt(match[4]) : 0;
    
    sources.push({ fiscal_year, type, amount, percentage });
    totalObligated += amount;
  }
  
  // Check if funds expire
  if (/will not expire at the end of the current fiscal year/i.test(text)) {
    fundsExpire = false;
  }
  
  return { sources, totalObligated, fundsExpire };
}
```

### 5. Foreign Military Sales Extractor

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
  
  // Check for FMS
  if (/Foreign Military Sale|FMS/i.test(text)) {
    isFMS = true;
  }
  
  // Extract countries
  // "benefits a Foreign Military Sale to the United Kingdom"
  const countryPattern = /Foreign Military Sale.*?to\s+((?:[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:,\s*)?)+)/i;
  const countryMatch = text.match(countryPattern);
  if (countryMatch) {
    const countryList = countryMatch[1].split(/,\s*(?:and\s+)?/);
    countries.push(...countryList.map(c => c.trim()));
  }
  
  // Extract FMS funding
  // "funding from foreign partners in the amount of $73,218,476 (30%)"
  const fmsAmountPattern = /funding from foreign partners.*?\$(\d+(?:,\d{3})*)\s*\((\d+)%\)/i;
  const fmsMatch = text.match(fmsAmountPattern);
  if (fmsMatch) {
    amount = parseFloat(fmsMatch[1].replace(/,/g, ''));
    percentage = parseInt(fmsMatch[2]);
  }
  
  return { isFMS, countries, amount, percentage };
}
```

### 6. Competition Info Extractor

```typescript
function extractCompetitionInfo(text: string): {
  isCompeted: boolean | null;
  competitionType: string | null;
  numberOfOffers: number | null;
  nonCompeteAuthority: string | null;
  nonCompeteJustification: string | null;
} {
  let isCompeted: boolean | null = null;
  let competitionType: string | null = null;
  let numberOfOffers: number | null = null;
  let nonCompeteAuthority: string | null = null;
  let nonCompeteJustification: string | null = null;
  
  // Check if not competed
  if (/contract was not competed|not competitively procured|sole-source|sole source/i.test(text)) {
    isCompeted = false;
    competitionType = 'sole source';
    
    // Extract authority
    // "under the authority of 10 U.S. Code 2304(c)(1)"
    const authorityPattern = /authority of\s+([^,\.]+)/i;
    const authorityMatch = text.match(authorityPattern);
    if (authorityMatch) {
      nonCompeteAuthority = authorityMatch[1].trim();
    }
    
    // Extract justification
    const justPattern = /as implemented by\s+([^,\.]+)/i;
    const justMatch = text.match(justPattern);
    if (justMatch) {
      nonCompeteJustification = justMatch[1].trim();
    }
  } else if (/full and open/i.test(text)) {
    isCompeted = true;
    competitionType = 'full and open';
  }
  
  // Extract number of offers
  // "with one offer received"
  const offersPattern = /(\w+)\s+offers?\s+received/i;
  const offersMatch = text.match(offersPattern);
  if (offersMatch) {
    const numberWord = offersMatch[1].toLowerCase();
    const numberMap: {[key: string]: number} = {
      'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
      'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10
    };
    numberOfOffers = numberMap[numberWord] || parseInt(numberWord);
  }
  
  return { isCompeted, competitionType, numberOfOffers, nonCompeteAuthority, nonCompeteJustification };
}
```

### 7. Modification Info Extractor

```typescript
function extractModificationInfo(text: string): {
  isModification: boolean;
  modificationNumber: string | null;
  baseContractNumber: string | null;
  isOptionExercise: boolean;
  modificationType: string | null;
} {
  let isModification = false;
  let modificationNumber: string | null = null;
  let baseContractNumber: string | null = null;
  let isOptionExercise = false;
  let modificationType: string | null = null;
  
  // Check if modification
  if (/modification.*?to previously awarded|contract modification/i.test(text)) {
    isModification = true;
    
    // Extract modification number
    // "modification (PZ0001)"
    const modNumPattern = /modification\s*\(([A-Z0-9]+)\)/i;
    const modNumMatch = text.match(modNumPattern);
    if (modNumMatch) {
      modificationNumber = modNumMatch[1];
    }
    
    // Extract base contract number
    // "to previously awarded contract (N00024-23-C-6411)"
    const basePattern = /previously awarded.*?contract\s*\(([A-Z0-9-]+)\)/i;
    const baseMatch = text.match(basePattern);
    if (baseMatch) {
      baseContractNumber = baseMatch[1];
    }
    
    // Check if option exercise
    if (/to exercise options/i.test(text)) {
      isOptionExercise = true;
      modificationType = 'option exercise';
    } else if (/scope change/i.test(text)) {
      modificationType = 'scope change';
    } else if (/funding increase/i.test(text)) {
      modificationType = 'funding increase';
    } else {
      modificationType = 'other modification';
    }
  }
  
  return { isModification, modificationNumber, baseContractNumber, isOptionExercise, modificationType };
}
```

### 8. SBIR/STTR Enhanced Extractor

```typescript
function extractSBIRInfo(text: string): {
  isSBIR: boolean;
  sbirPhase: string | null;
  isSBIRSoleSource: boolean;
} {
  let isSBIR = false;
  let sbirPhase: string | null = null;
  let isSBIRSoleSource = false;
  
  // Check for SBIR/STTR
  if (/SBIR|STTR|Small Business Innovative Research|Small Business Technology Transfer/i.test(text)) {
    isSBIR = true;
    
    // Extract phase
    const phasePattern = /(?:SBIR|STTR)\s+Phase\s+(I{1,3})/i;
    const phaseMatch = text.match(phasePattern);
    if (phaseMatch) {
      sbirPhase = `Phase ${phaseMatch[1]}`;
    }
    
    // Check if sole source
    if (/sole-source.*?SBIR|SBIR.*?sole-source/i.test(text)) {
      isSBIRSoleSource = true;
    }
  }
  
  return { isSBIR, sbirPhase, isSBIRSoleSource };
}
```

---

## Phase 3: Integration into Main Scraper

Update `src/lib/dod-news-scraper.ts`:

1. Import all extraction functions
2. Call each extractor in `extractContractData()`
3. Add fields to the database insert in `saveContractToDatabase()`
4. Update the `ExtractedContract` interface with all new fields

---

## Phase 4: Testing & Validation

1. Test with Article 4319114 (has rich examples)
2. Verify all extraction functions work
3. Check data quality scores improve
4. Validate JSONB fields are properly formatted

---

## Expected Data Quality Improvement

**Before Enhancement:**
- Core fields: 100%
- Optional fields: ~10%
- **Overall: ~40% of available data**

**After Enhancement:**
- Core fields: 100%
- Optional fields: ~80%
- **Overall: ~90% of available data**

---

## Priority Order

1. ✅ **Phase 1 (Complete):** vendor_state fix
2. 🟡 **Phase 2 (High Priority):**
   - Contract types & IDIQ
   - Options & cumulative value
   - Performance locations with percentages
   - Modifications
3. 🟢 **Phase 3 (Medium Priority):**
   - Funding breakdown
   - FMS tracking
   - Competition info
4. 🔵 **Phase 4 (Nice to Have):**
   - Enhanced SBIR tracking
   - Multiple award details

**Ready to implement! Say "go" and I'll start coding the enhanced scraper!**

