# Apply Scraper Log Tables Migration

## What This Does

Creates `scraper_log` tables for all cron jobs so the admin dashboard can show when each scraper last ran.

## Tables Created

1. `congress_scraper_log`
2. `dod_news_scraper_log`
3. `sam_gov_scraper_log`
4. `sbir_scraper_log`

(Note: `army_innovation_scraper_log` and `fpds_scraper_log` already exist)

## Run This Migration

### Option 1: Supabase Dashboard (Easiest)

1. Go to: https://reprsoqodhmpdoiajhst.supabase.co/project/reprsoqodhmpdoiajhst/sql/new
2. Copy and paste the contents of: `supabase/migrations/create_missing_scraper_logs.sql`
3. Click "Run"

### Option 2: Terminal (if you have Supabase CLI)

```bash
# Navigate to project directory
cd /Users/matthewbaumeister/Documents/PropShop_AI_Website

# Run the migration
supabase db push
```

## Verify It Worked

After running the migration, refresh your admin dashboard scraper page.

You should see scrapers start showing real "Last Run" times once they run again (or you can manually trigger them).

## What Changed

### Before
- Scrapers without log tables showed "NEVER-RUN" incorrectly
- FPDS had a log table but wasn't using it

### After
- All scrapers now write to their log tables on every run
- Admin dashboard shows accurate "Last Run" times
- Shows success/failure status, duration, and error messages

## Next Steps

1. Apply this migration ✅
2. Wait for cron jobs to run (or manually trigger them)
3. Refresh admin dashboard to see accurate status

Done!

