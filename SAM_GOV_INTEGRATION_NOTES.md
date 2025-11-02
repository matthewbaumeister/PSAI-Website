# SAM.gov Integration - Why Not Implemented (Yet)

## 📋 Current Status: **NOT INTEGRATED**

We have a SAM.gov API key but **did NOT integrate it**. Instead, we're using **USASpending.gov** for FPDS contract data.

---

## 🤔 Why USASpending.gov Instead of SAM.gov?

### **We Chose USASpending.gov Because:**

1. **Single Source for Everything**
   - USASpending.gov has **FPDS contract data** (100+ fields)
   - It ALSO has **awards data** (SBIR/STTR grants)
   - It ALSO has **entity information** (companies, agencies)
   - **SAM.gov** = Just contract data (FPDS), no awards

2. **Better API Documentation**
   - USASpending.gov has clear REST API docs
   - Comprehensive field mappings
   - Well-documented endpoints for search + details

3. **More Complete Data**
   - USASpending.gov aggregates data from multiple sources
   - Includes FPDS + award data + spending trends
   - Historical data back to 2000

4. **No Additional Integration Needed**
   - We already built the full scraper for USASpending.gov
   - Adding SAM.gov would be redundant for FPDS data
   - Not worth the extra complexity

---

## 🔑 What We Have Ready

### **SAM.gov API Key:**
```
Key: SAM-dafe1914-cd36-489d-ae93-c332b6e4df2c
Stored in Vercel: SAM_GOV_API_KEY
```

### **What SAM.gov IS Good For (Future Use Cases):**

1. **Entity Registration Data**
   - Detailed company registration info
   - Cage codes, DUNS, UEI
   - Contractor capability statements
   - Small business certifications

2. **Exclusion Records**
   - Debarred contractors
   - Suspended entities
   - Ineligibility records

3. **Wage Determinations**
   - Labor standards data
   - Prevailing wage info

4. **Federal Hierarchy**
   - Agency organizational structure
   - Sub-agency relationships

---

## 🚀 When to Add SAM.gov Integration

### **Use Case 1: Entity Enrichment**
**Scenario:** User searches for a company in our database  
**SAM.gov adds:**
- Current registration status
- Active certifications (8(a), HUBZone, WOSB, etc.)
- Cage code validation
- Points of contact
- Past performance ratings

### **Use Case 2: Compliance Checking**
**Scenario:** Checking if a contractor is eligible  
**SAM.gov adds:**
- Real-time exclusion status
- Active registrations only
- Expiration dates

### **Use Case 3: Market Research**
**Scenario:** Finding all companies with specific capabilities  
**SAM.gov adds:**
- NAICS code expertise
- Geographic presence
- Company size classifications

---

## 📦 What It Would Take to Integrate

### **Estimated Effort: 2-3 days**

### **Step 1: New Table Schema** (~2 hours)
```sql
CREATE TABLE sam_entities (
  id BIGSERIAL PRIMARY KEY,
  uei VARCHAR(12) UNIQUE NOT NULL,
  legal_business_name TEXT,
  dba_name TEXT,
  cage_code VARCHAR(5),
  registration_status VARCHAR(50),
  registration_date DATE,
  expiration_date DATE,
  
  -- Small Business Classifications
  is_small_business BOOLEAN,
  is_8a_certified BOOLEAN,
  is_hubzone_certified BOOLEAN,
  is_woman_owned BOOLEAN,
  is_veteran_owned BOOLEAN,
  
  -- Contact Info
  physical_address JSONB,
  mailing_address JSONB,
  point_of_contact JSONB,
  
  -- Capabilities
  naics_codes JSONB,
  psc_codes JSONB,
  
  -- Metadata
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  data_source TEXT DEFAULT 'sam.gov'
);
```

### **Step 2: API Integration** (~1 day)
Create `src/lib/sam-gov-scraper.ts`:
- Entity search endpoint
- Entity details endpoint
- Exclusion check endpoint
- Rate limiting (1000 calls/day on free tier)

### **Step 3: Linking to Existing Data** (~4 hours)
- Match SAM entities to FPDS contracts by UEI
- Enrich company profiles with SAM data
- Add "Active Registration" badge to UI

### **Step 4: Daily Updates** (~2 hours)
- Check for expired registrations
- Update certification statuses
- Pull new exclusions

---

## 🔗 Dependencies for SAM.gov Integration

### **No Blockers!** We can add it anytime.

**What's Already Ready:**
- ✅ API key (in Vercel environment)
- ✅ Database infrastructure (Supabase)
- ✅ Scraper patterns (from FPDS work)
- ✅ UEI field in contracts (for linking)

**What We'd Need:**
- 📝 Review SAM.gov API docs: https://open.gsa.gov/api/entity-api/
- 📝 Design entity enrichment UI
- 📝 Decide which SAM fields to prioritize
- 📝 Plan entity matching strategy (UEI vs CAGE vs DUNS)

---

## 🎯 Recommendation

### **Current Priority: NO**
**Reason:** USASpending.gov gives us all contract data we need

### **Future Priority: MEDIUM**
**When:** After we have:
1. ✅ Complete FPDS database (2000-2025)
2. ✅ Company profile pages working
3. ✅ Basic search functionality live
4. **THEN** add SAM.gov for enrichment

### **The Value Add:**
SAM.gov won't give us MORE contracts, but it WILL give us:
- Richer company profiles
- Real-time certification status
- Compliance checking
- Enhanced market research

---

## 📚 Useful Resources

- **SAM.gov API Docs:** https://open.gsa.gov/api/entity-api/
- **SAM.gov Entity Search:** https://sam.gov/content/entity-information
- **Our API Key Location:** Vercel → Settings → Environment Variables → `SAM_GOV_API_KEY`

---

## 💡 Quick Start (When Ready)

1. Read SAM.gov Entity API docs
2. Test API with our key:
   ```bash
   curl "https://api.sam.gov/entity-information/v2/entities?api_key=SAM-dafe1914-cd36-489d-ae93-c332b6e4df2c&uei=ABC123456789"
   ```
3. Create `sam_entities` table
4. Build `sam-gov-scraper.ts`
5. Add enrichment to company pages

---

**Last Updated:** Nov 2, 2025  
**Next Review:** After FPDS scraping completes (Jan 2026?)

