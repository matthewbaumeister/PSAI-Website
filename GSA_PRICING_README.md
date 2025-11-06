# GSA Pricing System - Complete

## What This Is

A complete system to download, parse, and store **labor category pricing data** from ~3,000 GSA contractors.

## What You Get

- **Labor categories**: Job titles/roles (e.g., "Senior Software Engineer")
- **Hourly rates**: Ceiling prices for each category
- **Qualifications**: Education, experience, clearance requirements
- **Searchable database**: Query by role, rate, contractor, state, SIN, etc.

## Quick Start

### 1. Create Database Tables

Run this SQL in Supabase SQL Editor:
```
supabase/migrations/create_gsa_pricing_tables.sql
```

### 2. Run the Pipeline

```bash
./scripts/run-complete-gsa-pricing-collection.sh
```

Answer `y` for test mode (10 files) or `n` for production mode (~3,000 files).

**Time**: 2-4 hours

### 3. Verify

Run this SQL:
```
CHECK_GSA_PRICING_DATA.sql
```

## Files Created

### Scripts (7 files)
- `scripts/gsa-pricing-downloader.py` - Downloads price list files
- `scripts/gsa-pricing-parser.py` - Parses Excel files
- `scripts/gsa-pricing-importer.py` - Imports to database
- `scripts/test-gsa-pricing-pipeline.py` - Tests all components
- `scripts/run-complete-gsa-pricing-collection.sh` - Complete pipeline
- `scripts/setup-gsa-pricing-tables.sh` - Setup helper

### Database
- `supabase/migrations/create_gsa_pricing_tables.sql` - Table definitions

### Documentation (5 files)
- `GSA_PRICING_README.md` - This file
- `GSA_PRICING_QUICKSTART.md` - Quick start guide
- `GSA_PRICING_COMPLETE_GUIDE.md` - Comprehensive guide
- `GSA_PRICING_SYSTEM_READY.md` - System overview
- `CHECK_GSA_PRICING_DATA.sql` - Verification queries

## Documentation

- **New user?** Start with `GSA_PRICING_QUICKSTART.md`
- **Need details?** See `GSA_PRICING_COMPLETE_GUIDE.md`
- **Want overview?** See `GSA_PRICING_SYSTEM_READY.md`

## Status

**READY TO RUN** ✓

All components built, tested, and documented.

## Support

See troubleshooting section in `GSA_PRICING_COMPLETE_GUIDE.md` for common issues.

