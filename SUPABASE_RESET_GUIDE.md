# Supabase Backup & Reset Guide

## For: Billow LLC (dba prop-shop.ai)

This guide helps you safely backup your current Supabase data and reset the database for the new propshop.ai application.

---

## Step 1: Backup Current Data

### Method A: Using the Backup Script (Recommended)

```bash
# Run the automated backup script
tsx scripts/backup-supabase.ts
```

This will create a `backups/backup_YYYY-MM-DD/` directory with:
- JSON files for each table
- Metadata file with backup info

### Method B: Using Supabase CLI

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Create full SQL dump
supabase db dump -f backup_$(date +%Y%m%d).sql
```

**Find your project ref:** Supabase Dashboard → Settings → General → Reference ID

### Method C: Manual Export via Dashboard

1. Go to Supabase Dashboard
2. Navigate to Database → Table Editor
3. For each important table:
   - Select the table
   - Click "..." menu
   - Choose "Export to CSV"
   - Save the file

**Important tables to backup:**
- `users`
- `opportunities`
- `sbir_final`
- `fpds_contracts`
- `dod_news`
- `congressional_trades`
- `army_innovation`
- `mantech_articles`
- `dsip_opportunities`
- `gsa_gwac_holders`
- `gsa_mas_pricing`
- `publications`
- `scraper_logs`

---

## Step 2: Verify Your Backup

Before proceeding, verify your backup:

```bash
# Check the backup directory
ls -lh backups/backup_*/

# Verify JSON files contain data
cat backups/backup_*/users.json | head -20
```

**Checklist:**
- [ ] All important tables backed up
- [ ] JSON/CSV files contain data
- [ ] Backup stored in safe location (copy to external drive or cloud)
- [ ] SQL dump created (if using CLI method)

---

## Step 3: Reset Supabase Database

### ⚠️ WARNING: THIS IS DESTRUCTIVE

This will delete all tables, views, and functions in your Supabase project. Make sure you have a backup!

### Option A: Using SQL Script (Recommended)

1. Go to Supabase Dashboard → SQL Editor
2. Open `scripts/reset-supabase.sql` in your code editor
3. Copy the entire script
4. Paste into SQL Editor
5. **Review the script carefully**
6. Click "Run"

### Option B: Manual Reset

1. Go to Database → Table Editor
2. For each table:
   - Click "..." menu
   - Choose "Delete table"
   - Confirm deletion

### Option C: Drop All Tables via SQL

Run this in SQL Editor:

```sql
-- Drop all tables in public schema
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') 
    LOOP
        EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
END $$;

-- Verify
SELECT tablename FROM pg_tables WHERE schemaname = 'public';
-- Should return 0 rows
```

---

## Step 4: Reset Auth Users (Optional)

If you want to delete all users and start fresh:

⚠️ **Warning:** This will log out all users and delete all accounts!

```sql
-- Run in SQL Editor
TRUNCATE auth.users CASCADE;
TRUNCATE auth.identities CASCADE;
TRUNCATE auth.sessions CASCADE;
TRUNCATE auth.refresh_tokens CASCADE;
```

---

## Step 5: Clean Storage Buckets (Optional)

If you want to delete all uploaded files:

```sql
-- Run in SQL Editor
DELETE FROM storage.objects;
DELETE FROM storage.buckets;
```

---

## Step 6: Create New propshop.ai Schema

Once your database is clean, you're ready to create the new schema for propshop.ai.

### New Schema for propshop.ai

```sql
-- =================================
-- PROPSHOP.AI DATABASE SCHEMA
-- For: Billow LLC
-- =================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =================================
-- 1. OPPORTUNITIES TABLE
-- =================================
CREATE TABLE opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  external_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  agency TEXT NOT NULL,
  customer TEXT NOT NULL,
  naics TEXT[] DEFAULT '{}',
  psc TEXT[] DEFAULT '{}',
  contract_vehicle TEXT,
  release_date DATE,
  due_date DATE,
  estimated_value BIGINT,
  status TEXT NOT NULL DEFAULT 'Active',
  summary TEXT,
  tags TEXT[] DEFAULT '{}',
  source_urls TEXT[] DEFAULT '{}',
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_opportunities_status ON opportunities(status);
CREATE INDEX idx_opportunities_agency ON opportunities(agency);
CREATE INDEX idx_opportunities_due_date ON opportunities(due_date);
CREATE INDEX idx_opportunities_external_id ON opportunities(external_id);

-- =================================
-- 2. USER CRM DATA
-- =================================
CREATE TABLE user_opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  crm_stage TEXT NOT NULL DEFAULT 'Inbox',
  internal_notes TEXT,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  stage_changed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, opportunity_id)
);

CREATE INDEX idx_user_opps_user ON user_opportunities(user_id);
CREATE INDEX idx_user_opps_stage ON user_opportunities(crm_stage);

-- =================================
-- 3. CHAT HISTORY (for future RAG)
-- =================================
CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  opportunity_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =================================
-- 4. EMBEDDINGS (for future RAG)
-- =================================
CREATE TABLE opportunity_embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  embedding vector(1536), -- OpenAI embedding dimension
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =================================
-- 5. ROW LEVEL SECURITY (RLS)
-- =================================

-- Enable RLS on user tables
ALTER TABLE user_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Users can only see their own CRM data
CREATE POLICY "Users can view own opportunities"
  ON user_opportunities FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own opportunities"
  ON user_opportunities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own opportunities"
  ON user_opportunities FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own opportunities"
  ON user_opportunities FOR DELETE
  USING (auth.uid() = user_id);

-- Chat sessions and messages
CREATE POLICY "Users can view own chat sessions"
  ON chat_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own chat messages"
  ON chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chat_sessions
      WHERE chat_sessions.id = chat_messages.session_id
      AND chat_sessions.user_id = auth.uid()
    )
  );

-- Opportunities table is public read (no RLS needed for search)
-- But could add RLS later if needed for private opportunities

-- =================================
-- 6. FUNCTIONS
-- =================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_opportunities_updated_at
  BEFORE UPDATE ON opportunities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_sessions_updated_at
  BEFORE UPDATE ON chat_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =================================
-- SUCCESS
-- =================================
SELECT 'propshop.ai schema created successfully!' AS message;
```

---

## Step 7: Verify New Schema

```sql
-- Check tables
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- Check row counts (should all be 0)
SELECT 
  'opportunities' as table_name, 
  COUNT(*) as row_count 
FROM opportunities
UNION ALL
SELECT 'user_opportunities', COUNT(*) FROM user_opportunities
UNION ALL
SELECT 'chat_sessions', COUNT(*) FROM chat_sessions
UNION ALL
SELECT 'chat_messages', COUNT(*) FROM chat_messages;
```

---

## Step 8: Update Environment Variables

Make sure your `.env.local` has the correct Supabase credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## Checklist

- [ ] Backup completed and verified
- [ ] Backup stored in safe location
- [ ] Old database reset (all tables dropped)
- [ ] New schema created
- [ ] RLS policies applied
- [ ] Environment variables updated
- [ ] Test connection from app

---

## Need to Restore Old Data?

If you need to restore from your backup:

### From JSON Backup:
```bash
# Create a restore script (scripts/restore-from-backup.ts)
# Import the JSON files back into corresponding tables
```

### From SQL Dump:
```bash
# Restore from SQL dump
supabase db reset
psql "your-connection-string" < backup_YYYYMMDD.sql
```

---

## Questions or Issues?

If you encounter any issues during the reset process:

1. **Check Supabase Dashboard Logs:** Database → Logs
2. **Verify RLS policies:** Make sure they're not blocking your queries
3. **Test connection:** Run a simple query in SQL Editor
4. **Review error messages:** They usually point to the issue

---

**Remember:** This is for Billow LLC (dba prop-shop.ai). Make sure all legal documentation, billing, and contracts reference the correct entity.

