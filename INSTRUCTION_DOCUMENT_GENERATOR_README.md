# Instruction Document Generator

## Overview

Automated system that generates consolidated instruction PDFs for all active DSIP/SBIR opportunities. Extracts Volume 2 requirements, checklists, and submission guidelines from both Component and BAA instruction documents.

## Features

- Fetches and parses Component and BAA instruction PDFs
- Extracts structured data: Volumes 1-X, Volume 2 (technical write-up), checklists
- Generates professional consolidated PDF with all requirements
- Archives plain text for historical preservation (URLs expire after solicitation closes)
- Uploads to Supabase Storage and saves metadata to database

## Architecture

### Services

#### 1. `InstructionPdfParser` (`src/lib/instruction-pdf-parser.ts`)
- Fetches PDF documents from DSIP URLs
- Extracts text content using `pdf-parse`
- Identifies Volume structures (1, 2, 3, etc.)
- Extracts requirements, checklists, key dates
- Merges component and solicitation instructions

#### 2. `InstructionPdfGenerator` (`src/lib/instruction-pdf-generator.ts`)
- Generates professional multi-page PDFs using `pdfkit`
- Sections: Cover, Table of Contents, Quick Reference, Volumes, Checklist, Sources
- Formatted with proper typography and layout
- Includes source document links

#### 3. `InstructionDocumentService` (`src/lib/instruction-document-service.ts`)
- Main orchestration service
- Handles parsing, generation, storage, database updates
- Batch processing for multiple opportunities
- Error handling and retry logic

### API Endpoints

#### `/api/dsip/generate-instructions` (POST)
Generate instructions for multiple opportunities
```json
{
  "opportunityIds": [1, 2, 3],  // Optional: specific IDs
  "generateAll": true            // Optional: all active opportunities
}
```

#### `/api/dsip/generate-instructions/[opportunityId]` (GET/POST)
Generate instruction for single opportunity
- GET: Redirects to PDF
- POST: Returns JSON with PDF URL

#### `/api/cron/generate-instructions` (GET/POST)
Automated cron job that runs daily after scraper
- Generates instructions for all active opportunities without them
- Can be triggered manually from admin UI

### Database Schema

New columns added to `dsip_opportunities`:
```sql
consolidated_instructions_url TEXT       -- URL to generated PDF
instructions_plain_text TEXT            -- Archived plain text
instructions_generated_at TIMESTAMPTZ   -- Generation timestamp
instructions_volume_structure JSONB     -- Structured volume data
instructions_checklist JSONB            -- Checklist items
```

### Supabase Storage

Bucket: `instruction-documents`
- Public read access
- PDFs stored as: `{TOPIC_NUMBER}_instructions_{TIMESTAMP}.pdf`
- 50MB file size limit

## Workflow

### Automatic Generation (Daily)
1. DSIP scraper runs (finds new/updated opportunities)
2. Instruction generator cron runs 1 hour later
3. Finds active opportunities without instruction documents
4. For each opportunity:
   - Fetches component instructions URL
   - Fetches BAA/solicitation instructions URL
   - Parses both PDFs
   - Extracts volumes, requirements, checklists
   - Generates consolidated PDF
   - Uploads to Supabase Storage
   - Saves URL and plain text to database

### Manual Generation
Admin can trigger from UI:
- Single opportunity: Click "Generate Instructions" button
- Bulk: Select opportunities and click "Generate Instructions"
- All active: Click "Generate All" button

## Document Structure

### Consolidated Instruction PDF Sections

1. **Cover Page**
   - Topic number, title, component
   - Open/close dates
   - Important notice about verification

2. **Table of Contents**
   - Quick navigation to all sections

3. **Quick Reference Guide**
   - Key dates
   - Contact information
   - Volume summary

4. **Volume Requirements**
   - Volume 1: [varies by solicitation]
   - Volume 2: Technical Proposal (MOST IMPORTANT)
     - Technical approach
     - Work plan
     - Related work
     - Personnel qualifications
   - Volume 3+: [if applicable]

5. **Submission Checklist**
   - All required documents
   - Formatting requirements
   - Interactive checkboxes

6. **Source Documents**
   - Links to original instruction PDFs
   - Disclaimer about expiring URLs

## Volume 2 Focus

Volume 2 is the technical write-up and is the most critical section:
- Technical merit and innovation
- Approach and methodology
- Work plan and timeline
- Key personnel qualifications
- Facilities and equipment
- References

The parser specifically extracts Volume 2 requirements and highlights them in the consolidated document.

## Instruction Hierarchy

When component and BAA instructions conflict:
- Generally, component instructions supersede BAA instructions
- If component instructions say "refer to BAA," follow BAA
- The generator includes both sets with clear labeling

## Historical Archiving

Problem: DSIP instruction URLs stop working after solicitation closes

Solution: We archive the full plain text in the database
- `instructions_plain_text` column stores complete text
- Can regenerate PDF from archived text if needed
- Preserves information for future reference

## Cron Schedule

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

Runs daily at 3 AM UTC (after scraper completes)

## Usage Examples

### Generate for Single Opportunity
```bash
curl -X POST https://your-domain.com/api/dsip/generate-instructions/123 \
  -H "Authorization: Bearer YOUR_SERVICE_KEY"
```

### Generate for All Active
```bash
curl -X POST https://your-domain.com/api/dsip/generate-instructions \
  -H "Authorization: Bearer YOUR_SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"generateAll": true}'
```

### Check if Regeneration Needed
```typescript
const service = new InstructionDocumentService();
const needsRegen = await service.needsRegeneration(opportunityId);
```

## Error Handling

- PDF fetch failures: Logs error, continues to next opportunity
- Parse errors: Saves whatever data was extracted
- Upload failures: Retries with exponential backoff
- Database errors: Rolls back and reports

## Performance

- Typical PDF parse time: 2-5 seconds
- PDF generation: 1-2 seconds
- Upload: 1 second
- Total per opportunity: 4-8 seconds
- Batch of 100 opportunities: ~10-15 minutes

## Monitoring

Check generation status:
```sql
SELECT 
  COUNT(*) as total_active,
  COUNT(consolidated_instructions_url) as with_instructions,
  COUNT(*) - COUNT(consolidated_instructions_url) as missing_instructions
FROM dsip_opportunities
WHERE status_topicstatus IN ('Open', 'Prerelease', 'Active');
```

## Frontend Integration

Download button added to opportunity cards:
```tsx
{opportunity.consolidated_instructions_url && (
  <a 
    href={opportunity.consolidated_instructions_url}
    download
    target="_blank"
  >
    Download Instructions
  </a>
)}
```

## Future Enhancements

- [ ] Add AI-powered checklist extraction
- [ ] Generate requirement comparison tables
- [ ] Extract evaluation criteria scoring
- [ ] Add submission timeline calculator
- [ ] Generate proposal templates
- [ ] Email notifications when instructions available

## Troubleshooting

**No instructions generated:**
- Check that opportunity has instruction URLs
- Verify URLs are accessible (not 404)
- Check logs for PDF parsing errors

**PDF generation fails:**
- Check pdfkit installation
- Verify sufficient memory
- Check for extremely long text content

**Storage upload fails:**
- Verify bucket exists and is public
- Check service role permissions
- Verify file size under 50MB limit

## Support

For issues or questions, check:
1. Application logs in Vercel dashboard
2. Supabase logs for database/storage errors
3. Generation status in `dsip_opportunities` table

