# Instruction Generation Pipeline
## End-to-End Guide for Building Consolidated Instructions

---

## 📊 Current State Check

### Step 1: Run Coverage Check SQL
Run `CHECK_INSTRUCTION_COVERAGE.sql` in Supabase SQL Editor to see:

```sql
-- Shows:
1. Total active opportunities
2. How many have component instruction URLs
3. How many have solicitation instruction URLs  
4. How many have BOTH URLs
5. How many have consolidated instructions generated
6. List of 50 opportunities missing instructions
```

**Expected Output Example:**
```
Total Active Opportunities: 250
Active with Component Instructions URL: 200
Active with Solicitation Instructions URL: 180
Active with BOTH URLs: 150
Active with Consolidated Instructions Generated: 1 (just A254-P039 for now)
```

---

## 🔧 Current Architecture

### Data Flow:
```
┌─────────────────────────────────────────────────────────────┐
│  1. DSIP Scraper (runs daily via cron)                     │
│     - Fetches all active opportunities from DSIP API        │
│     - Extracts componentInstructionsUrl                     │
│     - Extracts solicitationInstructionsUrl                  │
│     - Saves to sbir_final table                             │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  2. Instruction URLs in Database (sbir_final table)         │
│     - component_instructions_download (PDF URL)             │
│     - solicitation_instructions_download (PDF URL)          │
│     - These are CAPTURED but not yet downloaded/parsed      │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  3. Manual Trigger (NEEDS TO BE RUN)                        │
│     - API: /api/admin/generate-all-instructions             │
│     - Downloads PDFs from URLs                               │
│     - Extracts plain text using unpdf                        │
│     - Merges component + BAA instructions                    │
│     - Saves to database:                                     │
│       * instructions_plain_text (full text)                 │
│       * consolidated_instructions_url (PDF link)            │
│       * instructions_generated_at (timestamp)               │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  4. Opportunity Pages Display                                │
│     - URL: /opportunities/[topicNumber]                     │
│     - Shows all opportunity details                          │
│     - Collapsible instructions section (plain text)         │
│     - Download topic PDF button                              │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  5. LLM Parser (READY TO INTEGRATE)                         │
│     - Takes instructions_plain_text                          │
│     - Uses GPT-4 to extract:                                 │
│       * Structured volumes (Volume 1, 2, 3...)               │
│       * Requirements per volume                              │
│       * Compliance checklist                                 │
│       * Superseding rules                                    │
│       * Source attribution (component vs BAA)                │
│     - Saves structured JSON to:                              │
│       * instructions_volume_structure                        │
│       * instructions_checklist                               │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  6. Beautiful Structured UI (NEXT STEP)                     │
│     - Replace plain text wall with:                          │
│       * Accordion for each volume                            │
│       * Color-coded source badges                            │
│       * Interactive checklist                                │
│       * Superseding rules highlights                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Action Plan

### Phase 1: Backfill All Active Opportunities (DO THIS FIRST)

**Run the bulk generation API:**

```bash
curl -X POST https://www.prop-shop.ai/api/admin/generate-all-instructions \
  -H "Authorization: Bearer YOUR_SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "onlyMissing": true,
    "limit": 50,
    "forceRegenerate": false
  }'
```

**What this does:**
- Finds all active opportunities with instruction URLs
- Downloads component + BAA PDFs
- Extracts plain text using `unpdf`
- Merges the two documents
- Saves `instructions_plain_text` to database
- Generates a basic PDF (for now)
- Processes 50 at a time (run multiple times if needed)

**Expected Results:**
```json
{
  "success": true,
  "total": 50,
  "processed": 50,
  "succeeded": 45,
  "failed": 5,
  "skipped": 0,
  "errors": [...]
}
```

**Run this multiple times until all active opportunities are covered.**

---

### Phase 2: Verify Coverage

**Run CHECK_INSTRUCTION_COVERAGE.sql again:**

You should see:
```
Active with Consolidated Instructions Generated: 150+ (up from 1)
```

**Check a few opportunity pages:**
- https://prop-shop.ai/opportunities/A254-P039
- https://prop-shop.ai/opportunities/[another-topic-number]
- Click "Consolidated Instructions" dropdown
- Should see plain text (not empty)

---

### Phase 3: Integrate LLM Parser (NEXT)

**Option A: Parse all existing instructions (one-time)**
1. Create API endpoint: `/api/admin/parse-all-instructions`
2. Loops through all opportunities with `instructions_plain_text`
3. Calls `llmParser.parseInstructions(plainText, topicNumber)`
4. Saves structured JSON to `instructions_volume_structure` and `instructions_checklist`

**Option B: Parse on-demand (per opportunity page view)**
1. Check if `instructions_volume_structure` exists
2. If not, call LLM parser on first page load
3. Cache result in database
4. Display structured UI

**Recommended: Option A** - Parse everything upfront so pages load fast.

---

### Phase 4: Build Structured UI

**Replace the plain text wall with:**

```tsx
{/* Beautiful Structured Instructions */}
{data.instructions_volume_structure && (
  <div>
    {/* Volume Accordions */}
    {data.instructions_volume_structure.volumes.map((volume, idx) => (
      <Accordion key={idx}>
        <AccordionHeader>
          <VolumeIcon />
          {volume.volumeName}
          <Badge>{volume.isRequired ? 'Required' : 'Optional'}</Badge>
          {volume.pageLimit && <PageLimit>{volume.pageLimit}</PageLimit>}
        </AccordionHeader>
        <AccordionContent>
          <p>{volume.description}</p>
          
          {/* Requirements List */}
          <RequirementsList>
            {volume.requirements.map(req => (
              <Requirement key={req.id}>
                <SourceBadge source={req.source}>
                  {req.source === 'component' ? '🟢 Component' : 
                   req.source === 'baa' ? '🔵 BAA' : 
                   '🟣 Both'}
                </SourceBadge>
                <Text>{req.text}</Text>
                {req.isOptional && <OptionalTag>Optional</OptionalTag>}
              </Requirement>
            ))}
          </RequirementsList>
        </AccordionContent>
      </Accordion>
    ))}

    {/* Compliance Checklist */}
    <ChecklistSection>
      <h3>📋 Submission Checklist</h3>
      {data.instructions_checklist.map(item => (
        <ChecklistItem key={item.id} category={item.category}>
          <Checkbox />
          <Text>{item.text}</Text>
          <SourceBadge source={item.source} />
        </ChecklistItem>
      ))}
    </ChecklistSection>

    {/* Superseding Rules */}
    {data.instructions_volume_structure.supersedingRules.length > 0 && (
      <SupersedingSection>
        <h3>⚠️ Important: Superseding Rules</h3>
        {data.instructions_volume_structure.supersedingRules.map((rule, idx) => (
          <SupersedingRule key={idx}>
            <PrecedenceBadge precedence={rule.precedence}>
              {rule.precedence === 'component' ? 'Component Takes Precedence' : 'BAA Takes Precedence'}
            </PrecedenceBadge>
            <RuleText>{rule.rule}</RuleText>
            <Context>{rule.context}</Context>
          </SupersedingRule>
        ))}
      </SupersedingSection>
    )}
  </div>
)}
```

---

### Phase 5: Auto-Generate on Scrape (FUTURE)

**Hook into scraper:**

In `src/app/api/cron/sbir-scraper/route.ts`, after the database upsert:

```typescript
// Step 4: Generate instructions for new/updated opportunities
log(` Step 4/4: Generating instructions for active opportunities...`);
const instructionService = new InstructionDocumentService();

const newlyActiveTopics = processedTopics.filter(topic => 
  ['Open', 'Prerelease', 'Active'].includes(topic.topicStatus) &&
  (topic.componentInstructionsUrl || topic.solicitationInstructionsUrl)
);

log(`   Found ${newlyActiveTopics.length} active topics with instruction URLs`);

let instructionsGenerated = 0;
for (const topic of newlyActiveTopics) {
  try {
    // Check if already has instructions (skip regeneration)
    const existing = await supabase
      .from('sbir_final')
      .select('consolidated_instructions_url')
      .eq('topic_id', topic.topicId)
      .single();
    
    if (existing.data?.consolidated_instructions_url) {
      log(`   ⏭️  ${topic.topicCode} already has instructions`);
      continue;
    }

    // Generate instructions
    const result = await instructionService.generateForOpportunity(topic.topicId);
    if (result.success) {
      instructionsGenerated++;
      log(`   ✅ Generated instructions for ${topic.topicCode}`);
    }
  } catch (error) {
    log(`   ⚠️  Failed to generate instructions for ${topic.topicCode}: ${error}`);
  }
}

log(`   Generated ${instructionsGenerated} new instruction documents`);
```

---

## 📝 Summary

### What We Have Now:
- ✅ Scraper captures instruction URLs
- ✅ `/opportunities/[topicNumber]` pages are live
- ✅ Q&A section is clickable/expandable
- ✅ Bulk generation API ready to use
- ✅ LLM parser ready to integrate

### What You Need to Do:
1. **Run CHECK_INSTRUCTION_COVERAGE.sql** - See current state
2. **Run bulk generation API** - Backfill all active opportunities
3. **Verify coverage** - Check a few opportunity pages
4. **Decision point:** Hard-code structured UI OR use LLM parser?
   - **Hard-code**: Faster, deterministic, but less flexible
   - **LLM**: Smarter, adapts to different formats, but costs $$ per parse

### My Recommendation:
**Use LLM parser** - The instruction documents vary significantly between components and BAA versions. Hard-coding will break often. LLM can intelligently handle:
- Different volume structures
- Varying page limit formats
- Component-specific quirks
- Superseding language detection
- Cross-reference resolution

---

## 💰 Cost Estimate (LLM Parsing)

- **Average instruction text**: ~100k characters = ~25k tokens
- **GPT-4 Turbo cost**: $0.01 per 1k input tokens + $0.03 per 1k output tokens
- **Per opportunity**: ~$0.25 input + ~$0.10 output = **$0.35 per parse**
- **For 200 active opportunities**: ~**$70 one-time cost**
- **Monthly updates**: ~10 new/updated opportunities = **$3.50/month**

**This is very reasonable for the intelligence gained.**

---

## 🎯 Next Command to Run

```bash
# 1. Check coverage
# Run CHECK_INSTRUCTION_COVERAGE.sql in Supabase

# 2. Backfill all active opportunities
curl -X POST https://www.prop-shop.ai/api/admin/generate-all-instructions \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{"onlyMissing": true, "limit": 50}'

# 3. Check stats
curl https://www.prop-shop.ai/api/admin/generate-all-instructions \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

Let me know what the coverage stats show and we'll proceed! 🚀

