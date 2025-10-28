# Instruction Document Generator - Deployment Checklist

## Pre-Deployment

### ✅ Code Complete
- [x] PDF parser service implemented
- [x] PDF generator service implemented
- [x] Orchestration service implemented
- [x] API endpoints created
- [x] Cron job endpoint created
- [x] Frontend download button added
- [x] TypeScript interfaces updated
- [x] Documentation written

### ✅ Dependencies Installed
- [x] pdfkit
- [x] @types/pdfkit
- [x] pdf-parse (already installed)

## Deployment Steps

### Step 1: Run Database Migration ⬜

**Action Required**: Run in Supabase SQL Editor

1. Open Supabase Dashboard
2. Go to SQL Editor
3. Open file: `ADD_INSTRUCTION_DOCUMENT_COLUMNS.sql`
4. Execute the script
5. Verify columns were added:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'dsip_opportunities' 
AND column_name LIKE 'instructions%';
```

**Expected Result**: 5 new columns
- `consolidated_instructions_url`
- `instructions_plain_text`
- `instructions_generated_at`
- `instructions_volume_structure`
- `instructions_checklist`

### Step 2: Create Storage Bucket ⬜

**Action Required**: Create in Supabase Dashboard (or auto-created on first use)

1. Go to Supabase Dashboard → Storage
2. Click "New Bucket"
3. Settings:
   - Name: `instruction-documents`
   - Public: ✅ Yes
   - File size limit: 50 MB
   - Allowed MIME types: `application/pdf`
4. Click "Create bucket"

**Or let it auto-create on first generation**

### Step 3: Verify Environment Variables ⬜

**Action Required**: Check `.env.local` and Vercel settings

Required variables:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_key_here
CRON_SECRET=your_cron_secret_here  # Optional for manual triggers
```

**Verify in Vercel**:
1. Go to Vercel Dashboard → Your Project
2. Settings → Environment Variables
3. Ensure all variables are set for Production

### Step 4: Deploy to Vercel ⬜

**Action Required**: Push code to repository

```bash
cd /Users/matthewbaumeister/Documents/PropShop_AI_Website

# Stage all files
git add .

# Commit with descriptive message
git commit -m "Add instruction document generator

- PDF parser service for extracting volumes and requirements
- PDF generator service for creating consolidated documents
- Instruction document orchestration service
- API endpoints for manual and automated generation
- Cron job for daily automatic generation
- Frontend download button on opportunity cards
- Database schema for storing PDFs and plain text archives
- Complete documentation"

# Push to main branch (triggers Vercel deployment)
git push origin main
```

**Monitor Deployment**:
1. Watch Vercel dashboard for deployment status
2. Check for any build errors
3. Wait for deployment to complete (~2-3 minutes)

### Step 5: Setup Cron Job (Optional but Recommended) ⬜

**Action Required**: Add cron configuration

**Option A: Via `vercel.json`** (Recommended)

Create or update `vercel.json`:
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

Then deploy:
```bash
git add vercel.json
git commit -m "Add cron job for instruction generation"
git push origin main
```

**Option B: Manual Triggers**

Skip cron setup and trigger manually via admin UI or API calls.

## Post-Deployment Testing

### Test 1: Verify API is Live ⬜

```bash
# Replace with your actual domain
curl https://your-domain.vercel.app/api/dsip/generate-instructions/route.ts

# Should return 401 Unauthorized (expected without auth header)
```

### Test 2: Find Test Opportunity ⬜

```sql
-- Find an opportunity with instruction URLs
SELECT 
  id, 
  topic_number, 
  title,
  component_instructions_url,
  solicitation_instructions_url
FROM dsip_opportunities
WHERE status_topicstatus IN ('Open', 'Prerelease', 'Active')
  AND (component_instructions_url IS NOT NULL 
       OR solicitation_instructions_url IS NOT NULL)
  AND consolidated_instructions_url IS NULL
LIMIT 1;
```

Note the `id` from the result.

### Test 3: Generate First PDF ⬜

```bash
# Replace [ID] with the id from previous query
# Replace [SERVICE_KEY] with your actual service role key

curl -X POST https://your-domain.vercel.app/api/dsip/generate-instructions/[ID] \
  -H "Authorization: Bearer [SERVICE_KEY]"
```

**Expected Response**:
```json
{
  "success": true,
  "pdfUrl": "https://...",
  "topicNumber": "...",
  "message": "Instruction document generated successfully"
}
```

### Test 4: Verify PDF in Storage ⬜

1. Go to Supabase Dashboard → Storage → instruction-documents
2. You should see a new PDF file
3. Click it to preview
4. Verify it opens and has content

### Test 5: Verify Database Update ⬜

```sql
-- Check the opportunity was updated
SELECT 
  topic_number,
  consolidated_instructions_url,
  instructions_generated_at,
  LENGTH(instructions_plain_text) as text_length,
  jsonb_array_length(instructions_checklist) as checklist_items
FROM dsip_opportunities
WHERE id = [ID];
```

**Expected Result**:
- `consolidated_instructions_url`: Should have a URL
- `instructions_generated_at`: Should have a timestamp
- `text_length`: Should be > 0
- `checklist_items`: Should be > 0

### Test 6: Verify Frontend Display ⬜

1. Go to: `https://your-domain.vercel.app/dsip-search`
2. Search for the test opportunity (by topic number)
3. Verify "Download Instructions" button appears
4. Click button
5. Verify PDF downloads and opens correctly

### Test 7: Bulk Generation (Optional) ⬜

```bash
# Generate for all active opportunities
curl -X POST https://your-domain.vercel.app/api/dsip/generate-instructions \
  -H "Authorization: Bearer [SERVICE_KEY]" \
  -H "Content-Type: application/json" \
  -d '{"generateAll": true}'
```

**Note**: This may take 10-15 minutes for 100 opportunities.

## Monitoring Setup

### Check Generation Status ⬜

```sql
-- Overall status
SELECT 
  COUNT(*) as total_active,
  COUNT(consolidated_instructions_url) as with_instructions,
  COUNT(*) - COUNT(consolidated_instructions_url) as missing_instructions,
  ROUND(100.0 * COUNT(consolidated_instructions_url) / COUNT(*), 1) as coverage_percent
FROM dsip_opportunities
WHERE status_topicstatus IN ('Open', 'Prerelease', 'Active');
```

### View Recent Generations ⬜

```sql
SELECT 
  topic_number,
  title,
  instructions_generated_at,
  consolidated_instructions_url IS NOT NULL as has_pdf
FROM dsip_opportunities
WHERE instructions_generated_at IS NOT NULL
ORDER BY instructions_generated_at DESC
LIMIT 20;
```

### Check for Failures ⬜

```sql
-- Opportunities that should have instructions but don't
SELECT 
  id,
  topic_number,
  component_instructions_url IS NOT NULL as has_component,
  solicitation_instructions_url IS NOT NULL as has_solicitation
FROM dsip_opportunities
WHERE status_topicstatus IN ('Open', 'Prerelease', 'Active')
  AND (component_instructions_url IS NOT NULL 
       OR solicitation_instructions_url IS NOT NULL)
  AND consolidated_instructions_url IS NULL;
```

### Setup Alerts (Optional) ⬜

Add to your monitoring tool:
- Alert if generation fails > 10% of attempts
- Alert if no generations in last 48 hours
- Alert if storage usage exceeds threshold

## Troubleshooting

### Issue: PDF Generation Times Out

**Solution**: Increase timeout in API route
```typescript
// In route.ts files
export const maxDuration = 300; // Already set to 5 minutes
```

Or upgrade Vercel plan for longer execution times.

### Issue: Storage Upload Fails

**Check**:
1. Bucket exists: Supabase Dashboard → Storage
2. Bucket is public: Settings → Public Access = ON
3. Service role key is correct in env vars
4. File size under 50MB

### Issue: Download Button Not Showing

**Check**:
1. Database has `consolidated_instructions_url` for opportunity
2. API is returning the field in search results
3. Frontend TypeScript interface includes the field (already done)
4. Browser console for any errors

### Issue: Cron Job Not Running

**Check**:
1. `vercel.json` is committed and deployed
2. Cron is configured in Vercel Dashboard → Settings → Cron Jobs
3. Check Vercel logs for cron executions
4. Authorization header is correct (uses cron secret)

## Success Criteria

### Minimum Viable (MVP)
- ✅ Code deployed successfully
- ⬜ Database migration run
- ⬜ At least 1 PDF generated successfully
- ⬜ Download button appears on frontend
- ⬜ PDF downloads when button clicked

### Full Production Ready
- ⬜ All active opportunities processed
- ⬜ Cron job configured and running
- ⬜ Monitoring queries set up
- ⬜ No critical errors in logs
- ⬜ PDFs quality checked by humans

## Rollback Plan

If something goes wrong:

### Rollback Code
```bash
# Revert to previous commit
git revert HEAD
git push origin main
```

### Rollback Database
```sql
-- Remove columns if needed (CAUTION)
ALTER TABLE dsip_opportunities 
DROP COLUMN IF EXISTS consolidated_instructions_url,
DROP COLUMN IF EXISTS instructions_plain_text,
DROP COLUMN IF EXISTS instructions_generated_at,
DROP COLUMN IF EXISTS instructions_volume_structure,
DROP COLUMN IF EXISTS instructions_checklist;
```

### Delete Storage Bucket
1. Supabase Dashboard → Storage
2. Select `instruction-documents` bucket
3. Delete bucket (if needed)

## Timeline

### Day 1 (Today)
- [x] Code implementation
- ⬜ Run database migration
- ⬜ Deploy to Vercel
- ⬜ Test with 1-2 opportunities

### Day 2
- ⬜ Verify test PDFs quality
- ⬜ Generate for 10-20 opportunities
- ⬜ Setup cron job
- ⬜ Monitor first automated run

### Week 1
- ⬜ Generate for all active opportunities
- ⬜ User testing and feedback
- ⬜ Fix any issues found
- ⬜ Document any parsing improvements needed

### Ongoing
- ⬜ Monitor daily generation
- ⬜ Check PDF quality periodically
- ⬜ Update parsing rules as needed
- ⬜ Add enhancements based on user feedback

## Support Resources

- **Setup Guide**: `INSTRUCTION_GENERATOR_SETUP.md`
- **Technical Docs**: `INSTRUCTION_DOCUMENT_GENERATOR_README.md`
- **Implementation Summary**: `IMPLEMENTATION_SUMMARY.md`
- **Database Migration**: `ADD_INSTRUCTION_DOCUMENT_COLUMNS.sql`

## Sign-Off

- [ ] Database migration completed
- [ ] Code deployed to production
- [ ] Initial testing successful
- [ ] Cron job configured
- [ ] Monitoring set up
- [ ] Documentation reviewed
- [ ] Ready for production use

---

**Date Completed**: _______________

**Deployed By**: _______________

**Notes**: _______________________________________________

