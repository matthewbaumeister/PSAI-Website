# GSA Pricing Data - Quick Start

## What This Does

Downloads and parses **labor category pricing** from ~3,000 GSA contractors, giving you:
- Individual labor categories (job titles)
- Hourly rates for each category  
- Qualifications (education, experience, clearance)
- Ability to search and compare rates

## Quick Start (5 minutes to start, 2-4 hours to complete)

### 1. Create Database Tables

Copy/paste this file into Supabase SQL Editor:
```
supabase/migrations/create_gsa_pricing_tables.sql
```

### 2. Set Environment Variables

```bash
export NEXT_PUBLIC_SUPABASE_URL="https://reprsoqodhmpdoiajhst.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your_key_here"
```

### 3. Run Complete Pipeline

```bash
cd /Users/matthewbaumeister/Documents/PropShop_AI_Website
./scripts/run-complete-gsa-pricing-collection.sh
```

**First time?** Answer `y` for test mode to process only 10 files.

**Production run?** Answer `n` to process all ~3,000 price lists.

### 4. Wait

- Download: 1-2 hours
- Parse: 30-60 minutes  
- Import: 10-20 minutes

**Total: 2-4 hours**

Run in `tmux` so you can disconnect:
```bash
tmux new-session -s gsa-pricing
./scripts/run-complete-gsa-pricing-collection.sh
# Ctrl+B, then D to detach
# tmux attach -t gsa-pricing to reattach
```

### 5. Verify Data

Run this SQL in Supabase:
```sql
SELECT 
  COUNT(*) as total_labor_categories,
  COUNT(DISTINCT contractor_id) as contractors_with_pricing,
  MIN(hourly_rate) as min_rate,
  MAX(hourly_rate) as max_rate,
  AVG(hourly_rate)::numeric(10,2) as avg_rate
FROM gsa_labor_categories;
```

Expected: ~100,000-200,000 labor categories from ~3,000 contractors

## What You Can Do Now

### Find Cheapest Contractors for a Role
```sql
SELECT 
  c.company_name,
  c.website,
  c.primary_contact_email,
  lc.labor_category,
  lc.hourly_rate
FROM gsa_labor_categories lc
JOIN gsa_schedule_holders c ON lc.contractor_id = c.id
WHERE 
  lc.labor_category ILIKE '%software engineer%'
  AND lc.hourly_rate IS NOT NULL
ORDER BY lc.hourly_rate ASC
LIMIT 20;
```

### Compare Your Rates
```sql
SELECT 
  labor_category,
  COUNT(*) as contractors,
  MIN(hourly_rate) as min,
  AVG(hourly_rate)::numeric(10,2) as avg,
  MAX(hourly_rate) as max
FROM gsa_labor_categories
WHERE labor_category ILIKE '%your role here%'
GROUP BY labor_category;
```

### Small Business Rates
```sql
SELECT 
  c.company_name,
  lc.labor_category,
  lc.hourly_rate
FROM gsa_labor_categories lc
JOIN gsa_schedule_holders c ON lc.contractor_id = c.id
WHERE 
  c.small_business = true
  AND lc.hourly_rate IS NOT NULL
ORDER BY lc.hourly_rate ASC;
```

## Troubleshooting

**"Tables do not exist"**  
→ Run the SQL migration file first

**"No contractors found"**  
→ Run main GSA scraper first: `./scripts/run-complete-gsa-collection.sh`

**Downloads failing**  
→ Normal - some URLs are outdated. Scraper continues.

**Want to resume?**  
→ Just re-run the script. It skips completed files.

## Files Created

```
data/gsa_pricing/*.xlsx          # Downloaded price lists
data/gsa_pricing/parsed/*.json   # Parsed data
```

## Next Steps

See `GSA_PRICING_COMPLETE_GUIDE.md` for:
- Detailed documentation
- Advanced queries
- Troubleshooting
- Integration ideas

