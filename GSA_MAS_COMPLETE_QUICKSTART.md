# GSA MAS Complete Data Collection - Quick Start

## Overview

This system will download **ALL contractor information** from **ALL GSA MAS SINs** including:
- Company names and contact information
- Contract numbers and expiration dates  
- Price lists per labor category/FTE
- DUNS/UEI/CAGE codes
- Small business certifications
- Service descriptions
- ALL available company details

## What Gets Downloaded

The GSA MAS schedule has **hundreds of SINs** across categories like:
- IT Professional Services
- Engineering Services
- Management Consulting
- Security Services
- Transportation Services
- Medical Services
- Facilities Maintenance
- And many more...

Each downloadable SIN contains detailed Excel files with:
- **Company Information**: Names, addresses, phone, email, website
- **Contract Details**: Contract numbers, start/end dates
- **Pricing**: Hourly rates, yearly rates, labor categories
- **Identifiers**: DUNS, UEI, CAGE codes
- **Certifications**: Small business status, woman-owned, veteran-owned, 8(a), HUBZone
- **Service Descriptions**: What each company offers

## Step-by-Step Instructions

### 1. Run the Database Migration (One Time Only)

```bash
# This creates the tables in Supabase
# Run this in your Supabase Dashboard SQL Editor
# File: supabase/migrations/create_gsa_gwac_tables.sql
```

Go to your Supabase Dashboard:
1. Click "SQL Editor"
2. Click "New Query"
3. Copy/paste the entire contents of `supabase/migrations/create_gsa_gwac_tables.sql`
4. Click "Run"

### 2. Download ALL GSA MAS Contractor Data

```bash
cd /Users/matthewbaumeister/Documents/PropShop_AI_Website

# This will discover ALL SINs automatically and download them
python3 scripts/gsa-elibrary-auto-download.py
```

**What this does:**
- Opens a browser window (don't close it)
- Discovers all SINs on GSA MAS schedule (hundreds of them)
- Downloads contractor Excel files for each SIN
- Takes 2-4 hours depending on how many SINs have downloadable data
- Automatically handles timeouts and errors
- Saves files to `data/gsa_schedules/`

**Expected output:**
```
GSA eLibrary Automated Full Downloader
======================================================================
Step 1: Discovering all SINs...
Found 247 SINs to process

Step 2: Downloading contractor lists...
[1/247] Processing SIN: 54151S
    Name: IT Professional Services
    Status: Downloaded
[2/247] Processing SIN: 541330
    Name: Engineering Services
    Status: Downloaded
...
```

**Note:** Not all SINs have downloadable contractor lists - this is normal! The script will mark them as "No download available" and continue.

### 3. Parse the Downloaded Excel Files

```bash
# This extracts all data from the Excel files into JSON format
python3 scripts/gsa-schedule-scraper.py
```

**What this does:**
- Reads all downloaded Excel files from `data/gsa_schedules/`
- Extracts ALL available columns and data
- Intelligently maps columns (GSA uses different names in different files)
- Captures:
  - Standard fields (company name, contract number, etc.)
  - All additional columns as `additional_data`
  - Price information when available
  - Multiple sheets if present
- Saves parsed JSON files to `data/gsa_schedules/parsed/`

**Expected output:**
```
GSA SCHEDULE PARSER
======================================================================
Found 150 Excel files to parse

[1/150] Parsing GSA_MAS_54151S_20251105.xlsx...
  Found 2 sheets: ['Contractors', 'Labor Categories']
  Sheet 'Contractors': 1,234 rows, 25 columns
  Total contractors parsed: 1,234
  Saved to: GSA_MAS_54151S_parsed.json
...

PARSING SUMMARY
======================================================================
Total files parsed: 150
Total contractors extracted: 45,678
Total unique SINs: 150
```

### 4. Import into Supabase Database

```bash
# This imports all parsed data into your database
python3 scripts/import-gsa-gwac-data.py
```

**What this does:**
- Reads all parsed JSON files
- Imports into `gsa_schedule_holders` table
- Handles duplicates automatically
- Shows progress and summary

### 5. Query Your Data

The data is now in your `gsa_schedule_holders` table in Supabase!

**Example queries:**

```sql
-- Get all contractors for a specific SIN
SELECT * FROM gsa_schedule_holders 
WHERE sin_codes @> ARRAY['54151S'];

-- Find all small businesses with IT services
SELECT company_name, contract_number, primary_contact_phone, website
FROM gsa_schedule_holders
WHERE small_business = true 
  AND sin_codes && ARRAY['54151S', '541519ICAM'];

-- Get contractors by state
SELECT company_name, company_city, contract_number
FROM gsa_schedule_holders
WHERE company_state = 'CA';

-- Find woman-owned businesses
SELECT * FROM gsa_schedule_holders
WHERE woman_owned = true;

-- Count contractors per SIN
SELECT 
  unnest(sin_codes) as sin,
  COUNT(*) as contractor_count
FROM gsa_schedule_holders
GROUP BY sin
ORDER BY contractor_count DESC;
```

## File Structure

After running all steps, you'll have:

```
data/
└── gsa_schedules/
    ├── GSA_MAS_54151S_20251105.xlsx        # Downloaded Excel files
    ├── GSA_MAS_541330_20251105.xlsx
    ├── ... (100+ more files)
    └── parsed/
        ├── GSA_MAS_54151S_parsed.json      # Parsed JSON data
        ├── GSA_MAS_541330_parsed.json
        ├── ... (100+ more files)
        └── parse_summary_20251105_143052.json
```

## Data Captured

### From Excel Files:
Each Excel file may contain (varies by SIN):

**Basic Company Info:**
- Company/Contractor Name
- Contract Number
- DUNS Number
- UEI (Unique Entity ID)
- CAGE Code
- Address, City, State, ZIP
- Phone, Email, Website

**Business Classifications:**
- Small Business
- Woman-Owned
- Veteran-Owned
- Service-Disabled Veteran-Owned
- 8(a) Program
- HUBZone

**Contract Details:**
- Contract Start Date
- Contract End/Expiration Date
- Schedule Number
- SIN Code(s)

**Pricing (when available):**
- Labor Categories
- Hourly Rates
- Annual Rates
- Service Descriptions

**Additional Data:**
- Any other columns in the Excel file are captured in `additional_data` field

## Troubleshooting

### "No Excel files found"
**Solution:** Run step 2 first to download the files

### Download script times out frequently
**Solution:** This is normal for some SINs. The script will continue automatically. SINs without downloadable data will be marked as "No download available"

### Browser closes unexpectedly
**Solution:** Restart the download script. It will re-download only what's missing

### "Could not find company name column"
**Solution:** Some Excel files may have unexpected formats. Check the specific file manually and contact support if needed

## Estimated Totals

Based on GSA MAS structure, expect:
- **200-300 SINs** with downloadable contractor lists
- **50,000-100,000+ total contractor records**
- **Multiple GB of data** in Excel format
- **Processing time:** 3-5 hours total for all steps

## Next Steps After Import

1. **Link to your existing data:**
   - Match GSA contractors to your FPDS contract data by DUNS/UEI
   - Identify which schedule holders are winning contracts

2. **Build search features:**
   - Search by SIN, location, business type
   - Filter by certifications
   - Show pricing when available

3. **Set up automated updates:**
   - Run quarterly to capture new contractors
   - Track contract expirations
   - Monitor new schedule additions

## Support Files

- **Full Documentation:** `GSA_GWAC_DATA_GUIDE.md`
- **Database Schema:** `supabase/migrations/create_gsa_gwac_tables.sql`
- **Technical Details:** `scripts/README.md`

## Questions?

Check the logs:
- Download logs: Console output during download
- Parse logs: Console output during parsing
- Import logs: Console output during import

All scripts use detailed logging to help troubleshoot issues!

