# Schema Deployment Guide

## Overview

This guide explains how to deploy the master opportunities schema to your Supabase database.

## Quick Deploy

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy the entire contents of `supabase/schema.sql`
5. Paste into the SQL editor
6. Click **Run**

The schema will create:
- `opportunity_master` table (main opportunities table)
- `opportunity_sources` junction table (tracks data provenance)
- `user_opportunities` table (CRM tracking)
- `chat_sessions` and `chat_messages` tables (AI chat history)
- All necessary indexes, triggers, and RLS policies

### Option 2: Command Line (Supabase CLI)

If you have Supabase CLI installed and configured:

```bash
supabase db push
```

## What Gets Created

### Tables

1. **opportunity_master**
   - Central table for all opportunities from all sources
   - Includes fields for contracts, solicitations, SBIR, grants, etc.
   - Tracks financial data, timelines, customers, and more
   - Supports vector embeddings for semantic search

2. **opportunity_sources**
   - Tracks which data sources contributed to each opportunity
   - Preserves raw source records for audit
   - Enables multi-source consolidation

3. **user_opportunities**
   - User-specific CRM tracking
   - Stage management (discovery, qualified, proposal, etc.)
   - Personal notes and tags

4. **chat_sessions & chat_messages**
   - AI chat history
   - Context tracking for conversations
   - Filter state preservation

### Views

- `opportunities_enriched`: Opportunities with source counts
- `user_crm_pipeline`: User's CRM with opportunity details

## Data Population

After deploying the schema, run your scrapers to populate data:

### Current Scrapers

1. **DOD Contract News**: Already configured to save to `opportunity_master`
   - File: `src/lib/dod-news-scraper-direct-to-master.ts`
   - Function: `saveContractToOpportunityMaster()`

2. **SBIR Topics**: Needs adapter (coming soon)
3. **FPDS Contracts**: Needs adapter (coming soon)
4. **ManTech Projects**: Needs adapter (coming soon)

### Example: Run DOD scraper

```bash
npm run scrape:dod
```

## Verification

After deployment and data loading, verify:

```sql
-- Check table exists and has data
SELECT COUNT(*) FROM opportunity_master;

-- Check source tracking
SELECT source_name, COUNT(*) 
FROM opportunity_sources 
GROUP BY source_name;

-- View consolidated opportunities
SELECT * FROM opportunities_enriched LIMIT 10;
```

## API Access

The app includes API routes that automatically query this schema:

- `/api/opportunities` - Search and filter opportunities
- `/api/opportunities/stats` - Get filter options and stats

## Troubleshooting

### Error: Table already exists

If you get this error, it means some tables already exist. You can:

1. Drop the old table: `DROP TABLE opportunity_master CASCADE;`
2. Or modify the schema to use `ALTER TABLE` instead of `CREATE TABLE`

### Error: Extension not found

Some extensions may need to be enabled:

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
```

### RLS Policies Blocking Access

If you can't read data, temporarily disable RLS for testing:

```sql
ALTER TABLE opportunity_master DISABLE ROW LEVEL SECURITY;
```

(Re-enable it once auth is properly configured)

## Next Steps

After schema deployment:

1. Run scrapers to populate data
2. Test the search page at `/app/search`
3. Verify multi-source consolidation is working
4. Configure authentication for RLS policies
5. Set up vector embeddings for semantic search

## Schema Updates

To update the schema later:

1. Edit `supabase/schema.sql`
2. Re-run through Supabase SQL Editor
3. Or use migrations for production environments

## Support

For issues or questions:
- Check Supabase logs in dashboard
- Review `SUPABASE_RESET_GUIDE.md` for database management
- Contact: info@prop-shop.ai

