# LLM Document Analysis Capacity Reference

## 📊 Current Configuration

### GPT-4o-mini Specifications
- **Context Window:** 128,000 tokens (~500,000 characters)
- **Input Cost:** $0.150 per 1M tokens
- **Output Cost:** $0.600 per 1M tokens

### Current Limits
```
Per Document:    100,000 characters (~40 pages)
Both Documents:  200,000 characters (~80 pages)
Token Usage:     ~50,000 tokens (only 40% of capacity)
System Prompt:   ~4,000 tokens
Response:        ~4,000 tokens
─────────────────────────────────────────────────
Total Usage:     ~58,000 / 128,000 tokens (45%)
```

### Cost Per Opportunity
```
Input:   50,000 tokens × $0.150/1M  = $0.0075
Output:   4,000 tokens × $0.600/1M  = $0.0024
────────────────────────────────────────────────
Total:   ~$0.01 per opportunity analysis
```

---

## 📄 Document Coverage

| Document Length | Characters | Coverage | Notes |
|----------------|------------|----------|-------|
| 10-20 pages | ~25K-50K | ✅ 100% | Fully analyzed |
| 20-30 pages | ~50K-75K | ✅ 100% | Fully analyzed |
| 30-40 pages | ~75K-100K | ✅ 100% | Fully analyzed |
| 40-50 pages | ~100K-125K | ⚠️ 80-90% | Main body + most appendixes |
| 50+ pages | ~125K+ | ⚠️ 70-80% | Main body + some appendixes |

**Assumptions:**
- Average: 2,500 characters per page
- Page varies by font, margins, spacing
- Dense technical docs may have more chars/page

---

## 🔄 What Happens with Long Documents?

### If Document > 100K characters:

1. **First 100K characters analyzed** (main body + initial appendixes)
2. **Truncation note added** to prompt: `[TRUNCATED - DOCUMENT CONTINUES - SOME APPENDIXES MAY BE CUT OFF]`
3. **AI still extracts requirements** from analyzed portion
4. **AI notes appendix references** (e.g., "See Appendix B")
5. **User warned in UI** to verify original documents
6. **Original PDFs linked** prominently for full verification

### Example: 50-Page Document
```
Pages 1-35:  ✅ Fully analyzed (main requirements)
Pages 36-45: ✅ Partially analyzed (appendixes)
Pages 46-50: ❌ Truncated (referenced but not analyzed)

Result: AI extracts main requirements + flags appendixes
User action: Downloads original for appendix details
```

---

## 🚀 Future Expansion Options

### If We Need to Handle 100+ Page Documents:

#### Option 1: Increase Limits (Simple)
```typescript
// Could go up to ~200K chars per doc (use 80% of capacity)
const maxLength = 200000;

Pros: ✅ No code changes needed
      ✅ Covers 99% of documents
Cons: ⚠️ Same cost
      ⚠️ Very rare documents might still truncate
```

#### Option 2: Chunking Strategy (Complex)
```typescript
// Split each document into chunks, analyze separately
const chunks = splitDocument(text, 100000);
const results = await Promise.all(
  chunks.map(chunk => analyzeChunk(chunk))
);
const merged = mergeResults(results);

Pros: ✅ Handles unlimited length
      ✅ Parallel processing
Cons: ⚠️ 2-3x cost per opportunity
      ⚠️ Complex merge logic
      ⚠️ Potential conflicts in merging
```

#### Option 3: Smart Chunking (Optimal)
```typescript
// Analyze main body + appendixes separately
1. Extract main requirements (first 100K)
2. If truncated, analyze appendixes separately
3. Merge with conflict detection
4. Store combined results

Pros: ✅ Only pays extra for long docs
      ✅ Better appendix coverage
      ✅ Smart about what to chunk
Cons: ⚠️ More complex logic
      ⚠️ 2x cost only for long docs
```

---

## 📈 Real-World Usage

### Typical SBIR Instruction Documents

| Component | Typical Length | Coverage |
|-----------|---------------|----------|
| Army | 15-25 pages | ✅ 100% |
| Navy | 20-30 pages | ✅ 100% |
| Air Force | 25-35 pages | ✅ 100% |
| SOCOM | 20-30 pages | ✅ 100% |
| MDA | 15-25 pages | ✅ 100% |

| BAA Document | Typical Length | Coverage |
|--------------|---------------|----------|
| General BAA | 20-40 pages | ✅ 95-100% |
| Phase I | 15-25 pages | ✅ 100% |
| Phase II | 20-35 pages | ✅ 100% |
| Direct Phase II | 25-40 pages | ✅ 95-100% |

**Bottom Line:** Current limits handle 95%+ of documents completely.

---

## 💰 Cost Scaling

### Current: Single Analysis
```
28 active opportunities × $0.01 = $0.28 total
```

### If We Added Chunking (Worst Case)
```
28 active opportunities × $0.02 = $0.56 total
Still incredibly cheap!
```

### Monthly Estimates
```
Assuming ~50 new opportunities per month:

Current approach:    50 × $0.01 = $0.50/month
With chunking:       50 × $0.02 = $1.00/month

Annual: $12-24/year for ALL instruction analysis
```

**Conclusion:** Cost is negligible. Current approach is optimal.

---

## ✅ Recommendations

### Current Settings (100K per doc) are OPTIMAL because:

1. ✅ **Covers 95%+ of documents completely**
2. ✅ **Uses only 40% of available capacity** (room to grow)
3. ✅ **Cost is negligible** (~$0.01 per opportunity)
4. ✅ **Simple implementation** (no chunking complexity)
5. ✅ **Fast** (single API call, ~10-20 seconds)
6. ✅ **Appendix references flagged** (AI notes what's in appendixes)
7. ✅ **Original documents linked** (users verify appendixes)

### Only Change If:
- ❌ Documents regularly exceed 100 pages (RARE)
- ❌ Appendixes are critical and regularly truncated (NOT OBSERVED)
- ❌ Users request more coverage (hasn't happened)

### Monitor:
- 📊 Check if any documents are being truncated frequently
- 📊 Track if users report missing requirements
- 📊 Review if appendixes contain critical requirements (vs just forms/templates)

---

## 🎯 Best Practice

**Current approach is perfect:**

1. AI analyzes main requirements (100% coverage on 95% of docs)
2. AI flags appendix references ("See Appendix B for form")
3. UI prominently links to original documents
4. Users download originals for appendixes/forms
5. Users verify exact formatting from originals

**Result:** 
- ✅ Smart AI guidance for requirements
- ✅ Manual verification for appendixes/forms
- ✅ No transcription errors
- ✅ Low cost
- ✅ Fast performance
- ✅ Best user experience

---

## 🔧 Code Location

To adjust limits if needed:

```typescript
// File: src/lib/llm-instruction-analyzer.ts
// Line: ~207

const maxLength = 100000; // <-- Change this value

// To see full capacity documentation:
// See function comment at line ~73
```

**Don't change unless documents regularly exceed 40 pages!**

