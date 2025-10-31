# SBIR.gov API Status & Implementation Strategy

## 🟡 Current Status: API Under Maintenance

**Official Message from SBIR.gov:**
> "Please be advised that the SBIR.gov APIs are currently undergoing maintenance. In the meantime, if you require assistance in obtaining your data, please contact our helpdesk."

**Support Contact:**
- Email: sba.sbir.support@reisystems
- Hours: Monday - Friday, 9:00 AM - 5:00 PM ET

---

## ✅ Solution: Two-Track Approach

### **Option A: Request Data During Maintenance (FASTEST)**

Email the SBIR support team and request bulk data export:

**Email Template:**
```
To: sba.sbir.support@reisystems
Subject: Data Request for Research Platform - SBIR Awards Data

Hello SBIR Support Team,

We are building a research platform (Prop Shop AI) to help small businesses 
discover and analyze SBIR opportunities. We noticed the API is under maintenance.

Could you please provide us with a bulk data export for the following:

1. All DOD SBIR/STTR awards from 2020-2024
2. All NASA SBIR/STTR awards from 2020-2024
3. All NIH SBIR/STTR awards from 2020-2024

Preferred format: JSON or CSV
Preferred fields: All available fields from Awards API

Our use case: Historical award analysis to help proposers understand 
competitive landscape and past winners for active opportunities.

Thank you for your assistance!

Best regards,
[Your Name]
[Your Organization]
```

**Expected Response Time:** 1-3 business days

**Advantages:**
- ✅ Get data immediately (no waiting for API)
- ✅ Likely to receive larger datasets
- ✅ Can specify exact agencies/years needed
- ✅ May get additional metadata

---

### **Option B: Wait for API to Come Back Online**

The API will be restored after maintenance. When it's back:

**API Endpoints Available:**

1. **Awards API** - `/public/api/awards`
2. **Company API** - `/public/api/firm`
3. **Solicitation API** - `/public/api/solicitations`

**Test Command (when API is back):**
```bash
curl "https://api.www.sbir.gov/public/api/awards?agency=DOD&year=2024&rows=10"
```

---

## 📊 Actual API Field Names (From Official Docs)

### **Awards API Fields:**

**Returned Fields:**
- `firm` - Company name
- `award_title` - Award title
- `agency` - Agency abbreviation (DOD, NASA, etc.)
- `branch` - Branch/component
- `phase` - Phase I, II, or III
- `program` - SBIR or STTR
- `agency_tracking_number` - Internal tracking #
- `contract` - Contract/award number
- `proposal_award_date` - Award date
- `contract_end_date` - End date
- `solicitation_number` - Solicitation #
- `solicitation_year` - Year
- `topic_code` - Topic number
- `award_year` - Year awarded
- `award_amount` - Dollar amount
- `duns` - DUNS number
- `uei` - Unique Entity ID (new)
- `hubzone_owned` - HUBZone status
- `socially_economically_disadvantaged` - Disadvantaged status
- `women_owned` - Woman-owned status
- `number_employees` - # of employees
- `company_url` - Company website
- `address1`, `address2`, `city`, `state`, `zip` - Location
- `poc_name`, `poc_title`, `poc_phone`, `poc_email` - Point of contact
- `pi_name`, `pi_phone`, `pi_email` - Principal investigator
- `ri_name`, `ri_poc_name`, `ri_poc_phone` - Research institution
- `research_area_keywords` - Keywords
- `abstract` - Project abstract
- `award_link` - Link to award page

**Query Parameters:**
- `agency` - Filter by agency (DOD, NASA, HHS, etc.)
- `year` - Filter by award year
- `firm` - Search by company name
- `ri` - Search by research institution
- `rows` - Results per page (default: 100, max: unknown)
- `start` - Pagination offset
- `format` - xml or json (default: json)

---

### **Company API Fields:**

**Returned Fields:**
- `firm_nid` - Firm node ID
- `company_name` - Company name
- `sbir_url` - SBIR.gov profile URL
- `uei` - Unique Entity ID
- `duns` - DUNS number
- `address1`, `address2`, `city`, `state`, `zip` - Location
- `company_url` - Company website
- `hubzone_owned` - HUBZone status
- `socially_economically_disadvantaged` - Disadvantaged status
- `woman_owned` - Woman-owned status
- `number_awards` - Total # of awards

**Query Parameters:**
- `keyword` - Search by keyword
- `name` - Search by company name
- `uei` - Search by UEI
- `rows` - Results per page (default: 100, max: 5000)
- `start` - Pagination offset
- `sort` - Sort by: name, uei, or state
- `format` - xml or json (default: json)

---

### **Solicitation API Fields:**

**Returned Fields:**
- `solicitation_title` - Solicitation title
- `solicitation_number` - Solicitation #
- `program` - SBIR or STTR
- `phase` - Phase I or II
- `agency` - Agency abbreviation
- `branch` - Branch/component
- `solicitation_year` - Year
- `release_date` - Release date
- `open_date` - Open date
- `close_date` - Close date
- `application_due_date` - Multiple due dates
- `occurrence_number` - Occurrence #
- `solicitation_agency_url` - Agency URL
- `current_status` - Open/Closed
- `solicitation_topics` - Array of topics

**Nested Fields (in solicitation_topics):**
- `topic_title` - Topic title
- `branch` - Branch
- `topic_number` - Topic #
- `topic_description` - Description
- `sbir_topic_link` - Link to topic
- `subtopics` - Array of subtopics

**Query Parameters:**
- `keyword` - Search in solicitation titles
- `agency` - Filter by agency
- `open=1` - Only open solicitations
- `closed=1` - Only closed solicitations
- `rows` - Results per page (default: 25, max: 50)
- `start` - Pagination offset
- `format` - xml or json (default: json)

---

## 🔄 Updated Database Schema

Based on the actual API fields, here's the corrected mapping:

### **API Field → Database Column Mapping:**

| API Field | Database Column | Type |
|-----------|-----------------|------|
| `contract` | `contract_award_number` | TEXT |
| `topic_code` | `topic_number` | TEXT |
| `award_title` | `award_title` | TEXT |
| `abstract` | `abstract` | TEXT |
| `phase` | `phase` | TEXT |
| `program` | `program` | TEXT |
| `award_amount` | `award_amount` | DECIMAL |
| `award_year` | `award_year` | INTEGER |
| `proposal_award_date` | `award_date` | DATE |
| `agency` | `agency` | TEXT |
| `agency` (mapped) | `agency_id` | TEXT |
| `branch` | `branch_of_service` | TEXT |
| `branch` | `component` | TEXT |
| `firm` | `company` | TEXT |
| `duns` | `duns` | TEXT |
| `uei` | `uei` | TEXT |
| `address1` | `firm_address` | TEXT |
| `city` | `firm_city` | TEXT |
| `state` | `firm_state` | TEXT |
| `zip` | `firm_zip` | TEXT |
| `company_url` | `firm_website` | TEXT |
| `hubzone_owned` | `hubzone_owned` | BOOLEAN |
| `women_owned` | `woman_owned` | BOOLEAN |
| `socially_economically_disadvantaged` | `socially_economically_disadvantaged` | BOOLEAN |
| `ri_name` | `research_institution` | TEXT |
| `research_area_keywords` | `keywords` | TEXT[] |

---

## 🚀 Implementation Timeline

### **THIS WEEK (Days 1-3):**

**Day 1:**
1. ✅ Email SBIR support team requesting data
2. ✅ Run SQL migration (create tables)
3. ✅ Wait for response from support

**Day 2-3:**
1. ✅ Receive data from support team
2. ✅ Create import script for their data format
3. ✅ Import initial dataset (test with 100 records)
4. ✅ Verify data quality

### **NEXT WEEK (Days 4-7):**

**Day 4-5:**
1. ✅ Import full dataset (60K+ records)
2. ✅ Create API endpoints
3. ✅ Build UI components

**Day 6-7:**
1. ✅ Display awards on opportunity pages
2. ✅ Add award badges to search
3. ✅ Test and polish

### **WEEK 2-3 (After API Maintenance):**

**When API is restored:**
1. ✅ Update scraper to use live API
2. ✅ Set up daily updates
3. ✅ Backfill any missing data
4. ✅ Enable real-time scraping

---

## 📋 Action Items for You

### **STEP 1: Email SBIR Support (5 minutes)**

Copy the email template above and send to: **sba.sbir.support@reisystems**

Request:
- DOD awards 2020-2024
- NASA awards 2020-2024
- NIH awards 2020-2024

### **STEP 2: Run SQL Migration (5 minutes)**

While waiting for their response:

1. Open `IMPLEMENTATION_STEPS.md`
2. Copy SQL from Step 1.1
3. Run in Supabase SQL Editor
4. Verify tables created

### **STEP 3: Tell Me When Done (1 minute)**

After you:
- ✅ Email sent to support
- ✅ SQL migration complete

Tell me: **"Email sent, SQL done"**

Then I'll:
- Create the data import script
- Prepare for their data format
- Set up the UI components

---

## 💡 Why This Approach Works

### **Advantages:**

1. **Faster than waiting** - Get data in 1-3 days vs. unknown API restoration time
2. **Official data source** - Directly from SBIR.gov support team
3. **Likely more complete** - May receive additional fields/metadata
4. **Build now, automate later** - Can switch to API when it's restored
5. **Support relationship** - Establishes contact with SBIR team

### **No Disadvantages:**

- You still build the same system
- You still create the same features
- You just get the data differently (temporarily)
- Once API is back, switch to automated scraping

---

## 📁 Files Updated

1. **`data/SBIR_Data_Dictionary.xlsx`** - Official field definitions (saved)
2. **`SBIR_API_STATUS_AND_SOLUTION.md`** - This file (API status & strategy)
3. **`IMPLEMENTATION_STEPS.md`** - Original implementation plan
4. **`SBIR_API_WORKAROUND.md`** - Alternative approaches
5. **`src/lib/sbir-awards-scraper.ts`** - Scraper (needs field name updates)

---

## 🎯 Bottom Line

**Current Status:** API is under maintenance (temporary)

**Best Action:** Email support team for data export

**Timeline:** 1-3 days to receive data, then proceed with implementation

**End Result:** Same feature, same data, just obtained differently during maintenance

**Future:** When API is restored, switch to automated scraping

---

## 📧 Next Steps

1. **Send email now** (copy template above)
2. **Run SQL migration** (while waiting)
3. **Tell me when done** ("Email sent, SQL done")
4. **Wait for data** (1-3 business days)
5. **I'll create import script** (when data arrives)

Ready? Send that email! 🚀

