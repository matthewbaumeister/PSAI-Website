# PropShop AI - Data Collection Scripts

This directory contains Python scripts for collecting data from various government sources.

## Scripts Overview

### GSA Schedule & GWAC Scripts

#### `gsa-schedule-scraper.py`
Downloads and parses GSA Multiple Award Schedule (MAS) contractor lists.

**What it does**:
- Downloads Excel files from GSA eLibrary for specified SINs
- Parses contractor information (company name, contact info, certifications)
- Exports to JSON for database import

**Usage**:
```bash
python3 gsa-schedule-scraper.py
```

**Output**: JSON files in `data/gsa_schedules/`

**Note**: May require manual downloads from GSA eLibrary initially, then use the parser.

---

#### `gwac-scraper.py`
Downloads and parses GWAC holder lists from various sources.

**What it does**:
- Parses GWAC holder lists from CSV or PDF files
- Extracts company and contract information
- Exports to JSON for database import

**Supported GWACs**:
- Alliant 2 (Small Business & Unrestricted)
- OASIS (Small Business & Unrestricted)
- 8(a) STARS III
- Polaris (Small Business & Unrestricted)
- NITAAC CIO-SP3/SP4

**Usage**:
```bash
# First, manually download holder lists to data/gwac_holders/
# Then run the parser:
python3 gwac-scraper.py
```

**Output**: JSON files in `data/gwac_holders/`

---

#### `import-gsa-gwac-data.py`
Imports parsed GSA and GWAC data into Supabase database.

**What it does**:
- Reads JSON files from data directories
- Upserts to `gsa_schedule_holders` and `gwac_holders` tables
- Links to existing company records via UEI/DUNS
- Logs operations in `gsa_gwac_scraper_log`

**Usage**:
```bash
# Set environment variables first
export NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Run importer
python3 import-gsa-gwac-data.py
```

**Output**: Data in Supabase tables + import summary report

---

## Installation

### Prerequisites
- Python 3.8 or higher
- Access to Supabase database

### Install Dependencies

```bash
# From project root
pip install -r requirements.txt

# Or install manually
pip install pandas openpyxl pdfplumber requests beautifulsoup4 supabase
```

## Data Flow

```
1. GSA eLibrary / GWAC Websites
   ↓ (manual download)
   
2. Excel/PDF/CSV files
   ↓ (parse with scrapers)
   
3. JSON files (data/gsa_schedules/, data/gwac_holders/)
   ↓ (import with importer)
   
4. Supabase Database Tables
   - gsa_schedule_holders
   - gwac_holders
   - gsa_gwac_scraper_log
```

## Directory Structure

```
scripts/
├── README.md                    # This file
├── gsa-schedule-scraper.py     # GSA MAS scraper
├── gwac-scraper.py             # GWAC holder scraper
└── import-gsa-gwac-data.py     # Database importer

data/
├── gsa_schedules/              # GSA Excel files & parsed JSON
│   ├── GSA_MAS_54151S_20241105.xlsx
│   └── GSA_MAS_54151S_parsed_20241105.json
│
└── gwac_holders/               # GWAC CSV/PDF & parsed JSON
    ├── alliant2_sb.csv
    └── GWAC_alliant2_sb_20241105.json
```

## Common Workflows

### Initial Setup (First Time)

1. **Create database tables**:
```bash
psql $DATABASE_URL -f supabase/migrations/create_gsa_gwac_tables.sql
```

2. **Download GSA schedules manually**:
   - Visit https://www.gsaelibrary.gsa.gov
   - Search for SIN codes (e.g., "54151S")
   - Download Excel files
   - Place in `data/gsa_schedules/`

3. **Download GWAC lists manually**:
   - Visit GWAC websites
   - Download holder lists (PDF/Excel)
   - Convert to CSV if needed
   - Place in `data/gwac_holders/`

4. **Parse and import**:
```bash
# Parse files
python3 gsa-schedule-scraper.py
python3 gwac-scraper.py

# Import to database
python3 import-gsa-gwac-data.py
```

### Monthly Updates

1. **Re-download updated lists** (manual)
2. **Run scrapers** to parse new files
3. **Run importer** to update database
4. **Review logs** in `gsa_gwac_scraper_log` table

## Configuration

### GSA Schedule SINs

Edit `gsa-schedule-scraper.py` to add/remove SINs:

```python
self.target_sins = [
    "54151S",      # IT Professional Services
    "541519ICAM",  # Identity, Credentialing, and Access Management
    # Add more SINs here
]
```

### GWAC List

Edit `gwac-scraper.py` to add/remove GWACs:

```python
self.gwacs = {
    'new_gwac': {
        'name': 'New GWAC Name',
        'url': 'https://...',
        'type': 'IT',
        'managing_agency': 'GSA',
        'method': 'manual',
    }
}
```

## Troubleshooting

### "Module not found" errors
```bash
pip install -r requirements.txt
```

### "Supabase connection failed"
Check environment variables:
```bash
echo $NEXT_PUBLIC_SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY
```

### "File not found" errors
Create data directories:
```bash
mkdir -p data/gsa_schedules data/gwac_holders
```

### Excel parsing errors
GSA eLibrary Excel formats vary. Check column names in the file and update parser accordingly.

### PDF parsing not working
Install pdfplumber:
```bash
pip install pdfplumber
```

## Data Sources

### GSA eLibrary
- **URL**: https://www.gsaelibrary.gsa.gov
- **Cost**: Free
- **Format**: Excel downloads per SIN
- **Update Frequency**: Real-time

### GSA GWACs
- **Alliant 2**: https://www.gsa.gov/technology/technology-purchasing-programs/governmentwide-acquisition-contracts/alliant-2
- **OASIS**: https://www.gsa.gov/technology/technology-purchasing-programs/governmentwide-acquisition-contracts/oasis
- **8(a) STARS III**: https://www.gsa.gov/technology/technology-purchasing-programs/governmentwide-acquisition-contracts/8a-stars-iii
- **Polaris**: https://www.gsa.gov/technology/technology-purchasing-programs/governmentwide-acquisition-contracts/polaris
- **Cost**: Free
- **Format**: PDF or web pages
- **Update Frequency**: Varies (quarterly to annually)

### NITAAC GWACs
- **URL**: https://nitaac.nih.gov
- **Directory**: https://nitaac.nih.gov/resources/frequently-asked-questions/there-way-see-which-contract-holders-are-each-gwac
- **Cost**: Free
- **Format**: Web directory with filtering
- **Update Frequency**: Real-time

## Database Tables

### `gsa_schedule_holders`
Stores GSA MAS contract holders with:
- Contract details and SIN codes
- Company information and contact
- Business classifications (small business, woman-owned, etc.)
- Service offerings and pricing data (JSONB)

### `gwac_holders`
Stores GWAC contract holders with:
- GWAC name and contract details
- Company information and contact
- Capabilities and technical areas (JSONB)
- Task order statistics

### `gsa_sin_catalog`
Reference table for Special Item Numbers (SINs)

### `gwac_catalog`
Reference table for GWACs (pre-seeded with major GWACs)

### `gsa_gwac_scraper_log`
Tracks all scraping operations with:
- Scrape type and target
- Records found/inserted/updated/errors
- File tracking
- Timestamps and duration

## Performance

### GSA Schedule Scraping
- **Time per SIN**: 2-5 minutes (download + parse)
- **Records per SIN**: 500-3,000 companies
- **Initial load (20 SINs)**: 1-2 hours

### GWAC Scraping
- **Time per GWAC**: 5-10 minutes (download + parse)
- **Records per GWAC**: 25-200 companies
- **Initial load (10 GWACs)**: 1 hour

### Import
- **Time**: 10-30 seconds per 1,000 records
- **Initial import (20K records)**: 3-5 minutes

## Automation

These scripts can be automated for monthly updates:

```bash
#!/bin/bash
# monthly-gsa-gwac-update.sh

# 1. Manual step: Re-download files to data directories
echo "Download updated GSA and GWAC lists, then press Enter"
read

# 2. Parse files
python3 scripts/gsa-schedule-scraper.py
python3 scripts/gwac-scraper.py

# 3. Import to database
python3 scripts/import-gsa-gwac-data.py

# 4. Generate report
echo "Update completed at $(date)"
```

**Note**: Full automation would require Selenium for GSA eLibrary downloads.

## Support

For issues or questions:
1. Check the main documentation: `GSA_GWAC_DATA_GUIDE.md`
2. Review the quick start: `GSA_GWAC_QUICKSTART.md`
3. Check database tables: `supabase/migrations/create_gsa_gwac_tables.sql`

## Future Enhancements

- [ ] Selenium-based automated downloads from GSA eLibrary
- [ ] Web scraper for NITAAC directory (JavaScript-rendered)
- [ ] Automated company name normalization and matching
- [ ] Integration with SAM.gov API for UEI lookups
- [ ] Pricing data extraction and analysis
- [ ] Email alerts for new contract holders or expirations
- [ ] Schedule a cron job for monthly updates

