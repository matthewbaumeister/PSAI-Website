# Instruction Document Generator - Setup Guide

## Overview

The Instruction Document Generator automatically creates consolidated PDF instruction documents for all active DSIP/SBIR opportunities. It extracts Volume 2 requirements (technical write-up), all other volumes, checklists, and submission guidelines from both Component and BAA instruction documents.

## What Was Built

### 1. Database Schema
**File**: `ADD_INSTRUCTION_DOCUMENT_COLUMNS.sql`

Adds new columns to `dsip_opportunities` table:
- `consolidated_instructions_url` - URL to generated PDF in Supabase Storage
- `instructions_plain_text` - Full plain text archive for historical preservation
- `instructions_generated_at` - Timestamp of generation
- `instructions_volume_structure` - JSON structure of volumes
- `instructions_checklist` - JSON array of checklist items

### 2. PDF Parser Service
**File**: `src/lib/instruction-pdf-parser.ts`

Extracts structured data from instruction PDFs:
- Volume structures (1, 2, 3, etc.) with requirements
- Submission checklists
- Key dates and deadlines
- Contact information
- Submission guidelines

### 3. PDF Generator Service
**File**: `src/lib/instruction-pdf-generator.ts`

Creates professional multi-page PDFs with:
- Cover page with opportunity info
- Table of contents
- Quick reference guide
- All volume requirements (with Volume 2 highlighted)
- Interactive submission checklist
- Source document links

### 4. Orchestration Service
**File**: `src/lib/instruction-document-service.ts`

Main service that:
- Fetches and parses instruction PDFs
- Merges component and BAA instructions
- Generates consolidated PDF
- Uploads to Supabase Storage
- Updates database with metadata

### 5. API Endpoints

**`/api/dsip/generate-instructions` (POST)**
Generate for multiple opportunities:
```json
{
  "opportunityIds": [1, 2, 3],  // Specific IDs
  "generateAll": true            // Or all active opportunities
}
```

**`/api/dsip/generate-instructions/[opportunityId]` (GET/POST)**
Generate for single opportunity:
- GET: Redirects to PDF
- POST: Returns JSON with PDF URL

**`/api/cron/generate-instructions` (GET/POST)**
Automated cron job for daily generation

### 6. Frontend Integration
**File**: `src/app/dsip-search/page.tsx`

Added "Download Instructions" button to opportunity cards:
- Shows only when instruction document is available
- Green button with direct download link
- Opens PDF in new tab

## Setup Instructions

### Step 1: Run Database Migration

Run the SQL script in Supabase SQL Editor:

```bash
# Open Supabase Dashboard → SQL Editor
# Copy and run: ADD_INSTRUCTION_DOCUMENT_COLUMNS.sql
```

Or via Supabase CLI:
```bash
supabase db push ADD_INSTRUCTION_DOCUMENT_COLUMNS.sql
```

### Step 2: Create Storage Bucket

The bucket is auto-created on first use, but you can manually create it:

1. Go to Supabase Dashboard → Storage
2. Click "New Bucket"
3. Name: `instruction-documents`
4. Public: Yes (for download links)
5. File size limit: 50 MB
6. Allowed MIME types: `application/pdf`

### Step 3: Set Environment Variables

Verify these exist in your `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
CRON_SECRET=your_cron_secret  # For automated generation
```

### Step 4: Deploy to Vercel

The system is ready to deploy. Push to your repository and Vercel will automatically deploy:

```bash
git add .
git commit -m "Add instruction document generator"
git push origin main
```

### Step 5: Setup Cron Job (Optional but Recommended)

Add to `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/generate-instructions",
      "schedule": "0 3 * * *"
    }
  ]
}
```

This runs daily at 3 AM UTC (after the DSIP scraper).

## Usage

### Manual Generation

#### Generate for Single Opportunity
```bash
curl -X POST https://your-domain.com/api/dsip/generate-instructions/123 \
  -H "Authorization: Bearer YOUR_SERVICE_KEY"
```

#### Generate for All Active Opportunities
```bash
curl -X POST https://your-domain.com/api/dsip/generate-instructions \
  -H "Authorization: Bearer YOUR_SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"generateAll": true}'
```

### Automatic Generation

Once the cron job is set up, instruction documents are automatically generated:
1. DSIP scraper runs daily (finds new/updated opportunities)
2. Instruction generator runs 1 hour later
3. Processes all active opportunities without instruction documents
4. Saves PDFs to Supabase Storage
5. Updates database with URLs and archived text

### User Access

Users see "Download Instructions" button on opportunity cards when:
- Opportunity is Open, Prerelease, or Active
- Instruction document has been generated
- Button downloads PDF directly from Supabase Storage

## Testing

### Test Single Opportunity Generation

1. Find an opportunity ID with instruction URLs:
```sql
SELECT id, topic_number, component_instructions_url, solicitation_instructions_url
FROM dsip_opportunities
WHERE status IN ('Open', 'Prerelease', 'Active')
  AND (component_instructions_url IS NOT NULL OR solicitation_instructions_url IS NOT NULL)
  AND consolidated_instructions_url IS NULL
LIMIT 1;
```

2. Test generation via API:
```bash
curl -X POST https://your-domain.com/api/dsip/generate-instructions/[id] \
  -H "Authorization: Bearer YOUR_SERVICE_KEY"
```

3. Check result in database:
```sql
SELECT 
  topic_number,
  consolidated_instructions_url,
  instructions_generated_at,
  LENGTH(instructions_plain_text) as text_length
FROM dsip_opportunities
WHERE id = [id];
```

### Test Frontend Display

1. Go to DSIP Search page: `https://your-domain.com/dsip-search`
2. Search for opportunities
3. Look for "Download Instructions" button on opportunity cards
4. Click button to verify PDF downloads correctly

### Verify Storage

1. Go to Supabase Dashboard → Storage → instruction-documents
2. Verify PDF files are being created
3. Click a PDF to verify it opens correctly

## Monitoring

### Check Generation Status

```sql
-- Count opportunities with/without instructions
SELECT 
  COUNT(*) as total_active,
  COUNT(consolidated_instructions_url) as with_instructions,
  COUNT(*) - COUNT(consolidated_instructions_url) as missing_instructions
FROM dsip_opportunities
WHERE status_topicstatus IN ('Open', 'Prerelease', 'Active');
```

### View Recent Generations

```sql
SELECT 
  topic_number,
  title,
  instructions_generated_at,
  consolidated_instructions_url
FROM dsip_opportunities
WHERE instructions_generated_at IS NOT NULL
ORDER BY instructions_generated_at DESC
LIMIT 20;
```

### Check for Failures

Look for opportunities with instruction URLs but no generated document:
```sql
SELECT 
  id,
  topic_number,
  component_instructions_url,
  solicitation_instructions_url
FROM dsip_opportunities
WHERE status IN ('Open', 'Prerelease', 'Active')
  AND (component_instructions_url IS NOT NULL OR solicitation_instructions_url IS NOT NULL)
  AND consolidated_instructions_url IS NULL;
```

## Troubleshooting

### No PDFs Being Generated

**Check:**
1. Database columns exist: `SELECT * FROM information_schema.columns WHERE table_name = 'dsip_opportunities' AND column_name = 'consolidated_instructions_url';`
2. Storage bucket exists: Check Supabase Dashboard
3. Environment variables are set correctly
4. Service role key has proper permissions

### PDF Generation Fails

**Common Issues:**
1. **Timeout**: Increase `maxDuration` in API route (currently 300s)
2. **Memory**: Large PDFs may require more memory
3. **Invalid URLs**: Check that instruction URLs are accessible
4. **PDF Parse Error**: Some PDFs may have encoding issues

**Check Logs:**
```bash
# Vercel logs
vercel logs --follow

# Or in Vercel Dashboard
# Project → Logs → Functions
```

### Download Button Not Showing

**Check:**
1. Opportunity has `consolidated_instructions_url` in database
2. Frontend is fetching the field: Check network tab for API response
3. TypeScript interface includes the field (already done)
4. Browser console for errors

### Storage Upload Fails

**Check:**
1. Bucket exists and is public
2. Service role has storage permissions
3. File size under 50MB limit
4. Correct bucket name in code

## Performance

- **Single opportunity**: 5-10 seconds
- **Batch of 100**: 10-15 minutes
- **Full active catalog (~500)**: 1-2 hours

Rate limiting: 2 second delay between opportunities to avoid overwhelming DSIP servers.

## Architecture Diagram

```
┌─────────────────────┐
│  DSIP Scraper       │
│  (Daily Cron)       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  dsip_opportunities │
│  (New/Updated)      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────────────────────┐
│  Instruction Generator Cron         │
│  /api/cron/generate-instructions    │
└──────────┬──────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│  InstructionDocumentService         │
│  • Fetch instruction URLs           │
│  • Parse PDFs → Extract volumes     │
│  • Generate consolidated PDF        │
│  • Upload to Storage                │
│  • Update database                  │
└──────────┬──────────────────────────┘
           │
           ├─────────────┬─────────────┐
           ▼             ▼             ▼
    ┌──────────┐  ┌──────────┐  ┌──────────┐
    │  Parser  │  │Generator │  │ Storage  │
    └──────────┘  └──────────┘  └──────────┘
           │             │             │
           └─────────────┴─────────────┘
                       │
                       ▼
           ┌──────────────────────┐
           │  Database Updated    │
           │  • PDF URL           │
           │  • Plain Text        │
           │  • Volume Structure  │
           │  • Checklist         │
           └───────────┬──────────┘
                       │
                       ▼
           ┌──────────────────────┐
           │  Frontend            │
           │  Download Button     │
           └──────────────────────┘
```

## Key Features

1. **Volume 2 Focus**: Extracts and highlights technical write-up requirements
2. **Historical Archiving**: Saves plain text since DSIP URLs expire
3. **Merged Instructions**: Combines component and BAA instructions intelligently
4. **Professional PDFs**: Multi-page with table of contents, formatting
5. **Automatic Generation**: Runs daily after scraper
6. **User-Friendly**: One-click download from opportunity cards

## Future Enhancements

- [ ] AI-powered requirement extraction
- [ ] Comparison tables for different agencies
- [ ] Proposal templates based on requirements
- [ ] Email notifications when instructions available
- [ ] Version tracking for updated instructions
- [ ] Evaluation criteria extraction and scoring

## Support

For issues or questions:
1. Check application logs in Vercel
2. Check Supabase logs for database/storage errors
3. Review `INSTRUCTION_DOCUMENT_GENERATOR_README.md` for detailed documentation
4. Check generation status in database queries above

