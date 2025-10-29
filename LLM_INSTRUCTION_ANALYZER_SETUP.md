# 🤖 LLM Instruction Analyzer - Setup Guide

## Overview

This feature uses GPT-4o-mini to analyze SBIR instruction documents and generate:
- **Superseding guidance notes** (which document takes precedence)
- **Compliance checklist** (all requirements with citations)
- **Conflict resolution** (disagreements between Component & BAA docs)

**Cost:** ~$0.005 per opportunity (~half a cent)

---

## 📋 Prerequisites

1. ✅ OpenAI account
2. ✅ OpenAI API key with GPT-4o-mini access
3. ✅ Credit card on file with OpenAI (pay-as-you-go)

---

## 🔑 Step 1: Get Your OpenAI API Key

### Option A: New OpenAI Account

1. Go to: https://platform.openai.com/signup
2. Create an account
3. Go to: https://platform.openai.com/api-keys
4. Click "Create new secret key"
5. Name it: `PropShop-AI-Production`
6. Copy the key (starts with `sk-proj-...`)
7. **IMPORTANT:** Save it now - you can't view it again!

### Option B: Existing OpenAI Account

1. Go to: https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Name it: `PropShop-AI-Production`
4. Copy the key
5. Save securely

---

## 💳 Step 2: Add Billing (Required)

1. Go to: https://platform.openai.com/settings/organization/billing/overview
2. Click "Add payment method"
3. Add credit card
4. Set usage limit (recommended: $10/month to start)

**Expected Costs:**
```
Scenario 1: 28 opportunities/month = $0.14/month
Scenario 2: 100 opportunities/month = $0.50/month
Scenario 3: 500 opportunities/month = $2.50/month
```

**Very affordable!** 🎉

---

## 🔧 Step 3: Add API Key to Vercel

### Via Vercel Dashboard:

1. Go to: https://vercel.com/your-team/psai-website/settings/environment-variables
2. Click "Add New"
3. **Key:** `OPENAI_API_KEY`
4. **Value:** `sk-proj-...` (paste your key)
5. **Environments:** Check all (Production, Preview, Development)
6. Click "Save"

### Via Vercel CLI (Alternative):

```bash
vercel env add OPENAI_API_KEY
# Paste your key when prompted
# Select: Production, Preview, Development (all)
```

---

## ✅ Step 4: Verify Setup

### Test 1: Check Environment Variable

```bash
# In terminal
curl -X POST https://www.prop-shop.ai/api/admin/analyze-instructions/29 \
  -H "Authorization: Bearer YOUR_SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "opportunity": {
    "id": 29,
    "topic_number": "A254-P039",
    "title": "..."
  },
  "analysis": {
    "superseding_notes": [...],
    "compliance_checklist": [...],
    "conflicts_detected": [...]
  },
  "formatted_display": "📌 SUPERSEDING GUIDANCE NOTES..."
}
```

**If you get an error:**
- Check API key is set in Vercel
- Redeploy app: `vercel --prod`
- Check OpenAI billing is active

---

## 🧪 Step 5: Test with Sample Opportunity

### Using curl:

```bash
curl -X POST https://www.prop-shop.ai/api/admin/analyze-instructions/29 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json"
```

### Using the Admin UI (Coming Next):

1. Go to: https://www.prop-shop.ai/admin/sbir-database
2. Click "Details" on any active opportunity with instructions
3. Click "Analyze Instructions with AI" button
4. Wait 10-30 seconds
5. See results appear

---

## 📊 API Endpoint Details

### Endpoint:
```
POST /api/admin/analyze-instructions/[opportunityId]
```

### Authentication:
```
Authorization: Bearer YOUR_SUPABASE_SERVICE_ROLE_KEY
```

### Parameters:
- `opportunityId`: Can be numeric `id` or string `topic_id`

### Response Structure:

```typescript
{
  success: boolean;
  opportunity: {
    id: number;
    topic_number: string;
    topic_id: string;
    title: string;
  };
  analysis: {
    superseding_notes: SupersedingNote[];
    compliance_checklist: ComplianceChecklistItem[];
    conflicts_detected: ConflictDetection[];
    analysis_metadata: AnalysisMetadata;
  };
  formatted_display: string; // Pretty-printed text
  metadata: {
    component_url: string;
    baa_url: string;
    component_text_length: number;
    baa_text_length: number;
    model_used: 'gpt-4o-mini';
    analyzed_at: string;
  };
}
```

---

## 💰 Cost Tracking

### Check Your Usage:

1. Go to: https://platform.openai.com/usage
2. View daily/monthly costs
3. Download CSV reports

### Set Usage Alerts:

1. Go to: https://platform.openai.com/settings/organization/billing/limits
2. Set soft limit: $5/month (alert)
3. Set hard limit: $10/month (stop)

---

## 🐛 Troubleshooting

### Error: "Unauthorized"
**Fix:** Check Authorization header has correct service role key

### Error: "No instruction documents available"
**Fix:** This opportunity doesn't have Component/BAA URLs

### Error: "Failed to extract text from instruction documents"
**Fix:** PDF URLs are invalid or inaccessible

### Error: "OpenAI API error: 401 Unauthorized"
**Fix:** API key not set or invalid. Check Vercel environment variables.

### Error: "OpenAI API error: 429 Rate limit exceeded"
**Fix:** Too many requests. Wait 1 minute or upgrade OpenAI tier.

### Error: "OpenAI API error: Insufficient funds"
**Fix:** Add payment method at https://platform.openai.com/settings/organization/billing

---

## 📈 Performance Expectations

| Metric | Expected Value |
|--------|---------------|
| Analysis Time | 10-30 seconds |
| Cost per Analysis | $0.003-0.007 (~0.5¢) |
| Success Rate | >95% (if PDFs accessible) |
| Requirements Found | 15-50 per opportunity |
| Conflicts Detected | 0-10 per opportunity |

---

## 🔄 Next Steps

After setup is complete:

1. **Test manually** on 3-5 opportunities
2. **Review quality** of generated checklists
3. **Refine prompts** if needed
4. **Build UI** to display results
5. **Integrate into daily scraper** (auto-analyze new opps)

---

## 🎯 Usage Examples

### Example 1: Single Opportunity Analysis

```bash
# Analyze opportunity A254-P039
curl -X POST https://www.prop-shop.ai/api/admin/analyze-instructions/29 \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

### Example 2: Batch Analysis (Future)

```bash
# Analyze all active opportunities without checklists
curl -X POST https://www.prop-shop.ai/api/admin/batch-analyze-instructions \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"filter": "active_without_checklist", "limit": 50}'
```

---

## 📚 Additional Resources

- **OpenAI Pricing:** https://openai.com/api/pricing/
- **OpenAI Docs:** https://platform.openai.com/docs/
- **GPT-4o-mini Info:** https://openai.com/index/gpt-4o-mini-advancing-cost-efficient-intelligence/

---

## ✅ Setup Checklist

- [ ] OpenAI account created
- [ ] API key generated
- [ ] Billing method added
- [ ] Usage limits set ($10/month recommended)
- [ ] API key added to Vercel environment
- [ ] App redeployed
- [ ] Test analysis completed successfully
- [ ] Results reviewed for quality

---

**Status:** Core infrastructure deployed ✅  
**Next:** Get OpenAI API key and test!

