# 🚀 Deploy Your Database Schema - Step by Step

## You Need Tables Before Running the Scraper!

Your Supabase is currently empty. Let's fix that in **5 minutes**.

## 📋 What You'll Create

- ✅ `opportunity_master` - Main opportunities table (100+ fields)
- ✅ `opportunity_sources` - Source tracking (multi-source consolidation)
- ✅ `user_opportunities` - CRM pipeline
- ✅ `chat_sessions` & `chat_messages` - AI chat history
- ✅ All indexes for fast queries
- ✅ All triggers for auto-updates
- ✅ All views for common queries

## 🎯 OPTION 1: Supabase Dashboard (EASIEST)

### Step 1: Open Supabase SQL Editor

1. Go to https://supabase.com
2. Sign in and open your project
3. Click **"SQL Editor"** in the left sidebar
4. Click **"New Query"** button

### Step 2: Copy the Schema

Open this file: `supabase/complete-schema.sql`

**Quick way:**
```bash
cd /Users/matthewbaumeister/Documents/PropShop_AI_Website
cat supabase/complete-schema.sql | pbcopy
```

This copies the entire schema to your clipboard!

**Or manually:**
- Open `supabase/complete-schema.sql` in your editor
- Select all (Cmd+A)
- Copy (Cmd+C)

### Step 3: Paste and Run

1. Paste into the SQL Editor (Cmd+V)
2. Click **"Run"** button (or Cmd+Enter)
3. Wait ~5-10 seconds

You should see:
```
Success. No rows returned
```

### Step 4: Verify It Worked

Run this query:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (table_name LIKE 'opportunity%' 
     OR table_name LIKE 'chat%' 
     OR table_name = 'user_opportunities');
```

You should see:
- opportunity_master
- opportunity_sources
- user_opportunities
- chat_sessions
- chat_messages

## ✅ YOU'RE DONE!

Now run the scraper:
```bash
npm run scrape:propshop
```

---

## 🎯 OPTION 2: Command Line (ADVANCED)

If you have Supabase CLI installed:

```bash
cd /Users/matthewbaumeister/Documents/PropShop_AI_Website
supabase db push --db-url "your_supabase_connection_string"
```

---

## 🐛 Troubleshooting

### "Extension vector does not exist"

This is **OK**! The vector extension is optional (for semantic search).

The script will continue and create all tables. You can add vector later if needed.

### "Permission denied"

Make sure you're:
1. Signed into the correct Supabase project
2. Have owner/admin access
3. Using the SQL Editor (not the Table Editor)

### "Relation already exists"

You already have some tables! Two options:

**A) Keep existing data:**
Skip the tables that exist, or rename them first.

**B) Start fresh:**
```sql
-- WARNING: This deletes ALL data!
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS chat_sessions CASCADE;
DROP TABLE IF EXISTS user_opportunities CASCADE;
DROP TABLE IF EXISTS opportunity_sources CASCADE;
DROP TABLE IF EXISTS opportunity_master CASCADE;
```

Then run the complete schema again.

---

## 📊 After Deployment

### Check Tables
```sql
-- Should show 5 tables
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('opportunity_master', 'opportunity_sources', 'user_opportunities', 'chat_sessions', 'chat_messages');
```

### Check Indexes
```sql
-- Should show 15+ indexes
SELECT COUNT(*) FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename LIKE 'opportunity%';
```

### Insert Test Data (Optional)
```sql
INSERT INTO opportunity_master (
    canonical_opportunity_key,
    title,
    short_description,
    opportunity_type,
    customer_department,
    customer_agency,
    status,
    publication_date,
    estimated_value,
    data_quality_score
) VALUES (
    'TEST:SAMPLE_001',
    'Test Contract - F-35 Support',
    'This is a test opportunity',
    'award',
    'Department of Defense',
    'Air Force',
    'awarded',
    NOW(),
    10000000,
    90
);

-- Verify it worked
SELECT * FROM opportunity_master;
```

---

## 🚀 Next Steps

After your tables are created:

1. **Run the scraper:**
   ```bash
   npm run scrape:propshop
   ```

2. **Check results in Supabase:**
   - Go to "Table Editor"
   - Select "opportunity_master"
   - Should see hundreds of contracts!

3. **Check results on your site:**
   - Visit `/app/search`
   - Should show real data (not mock data)
   - Multi-source badges should appear

---

## 📚 Schema Details

### Opportunity Master Fields

The `opportunity_master` table has **50+ fields** including:

**Identifiers:**
- canonical_opportunity_key (unique)
- primary_contract_number
- primary_notice_id
- primary_award_id
- parent_contract_number
- external_ids (JSONB)

**Descriptive:**
- title, short_description, full_description
- opportunity_type, domain_category, keywords

**Customer:**
- customer_department, customer_agency
- customer_office, customer_location

**Financial:**
- vehicle_type, ceiling_value, estimated_value
- obligated_value, contract_type
- set_aside_type, competition_type

**Timeline:**
- status, publication_date, due_date, award_date
- period_of_performance_start/end

**Suppliers:**
- prime_recipients, sub_recipients
- cage_codes, uei_numbers

**Source Tracking:**
- source_attributes (JSONB - stores all source data)
- source_count
- data_quality_score (0-100)

**AI/LLM:**
- llm_summary
- llm_notes
- embedding (vector for semantic search)

### Multi-Source Consolidation

The `opportunity_sources` table tracks:
- Which data sources contributed to each opportunity
- Raw source data (preserved for audit)
- Match confidence scores
- Ingestion metadata

This allows the same contract from:
- defense.gov (news article)
- FPDS (contract database)
- SAM.gov (solicitation)

To be **automatically consolidated** into one opportunity card with a source count badge: "3 sources"

---

## ✅ Ready to Rock!

Once you see tables in Supabase, you're ready to:

```bash
npm run scrape:propshop
```

And watch 2,000+ contracts flow into your database! 🎉

---

**Questions?** Check `PROPSHOP_SCRAPER_README.md` for full documentation.

