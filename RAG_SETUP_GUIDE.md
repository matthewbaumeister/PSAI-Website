# 🚀 RAG System Setup Guide

Complete setup instructions for the Document-to-SBIR matching system.

---

## **Prerequisites**

1. **Supabase Project** (you already have this)
2. **HuggingFace Account** (FREE)
3. **Node.js packages** (already installed: `pdf-parse`, `tiktoken`)

---

## **Step 1: Run Database Setup**

### **1.1 Enable pgvector in Supabase**

Go to: **Supabase Dashboard → SQL Editor**

Run this SQL:
```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;
```

### **1.2 Create RAG Tables**

Copy and paste the **entire contents** of `RAG_SYSTEM_SETUP.sql` into the SQL Editor and run it.

This creates:
- `rag_files` - Stores uploaded documents
- `rag_chunks` - Text segments (300-800 tokens each)
- `rag_embeddings` - 1024-dimensional vectors
- `rag_search_history` - Analytics
- Vector indexes for fast similarity search

**Verify it worked:**
```sql
SELECT * FROM rag_system_stats;
```

You should see all zeros (no files yet).

---

## **Step 2: Get FREE HuggingFace API Key**

### **2.1 Create Account**
1. Go to: https://huggingface.co/join
2. Sign up (free)

### **2.2 Create API Token**
1. Go to: https://huggingface.co/settings/tokens
2. Click "New token"
3. Name it: `PropShop-RAG`
4. Type: **Read** (free tier)
5. Copy the token (starts with `hf_...`)

### **2.3 Add to Environment Variables**

Create/edit `.env.local`:
```bash
# Existing Supabase keys
NEXT_PUBLIC_SUPABASE_URL=your_url
SUPABASE_SERVICE_ROLE_KEY=your_key

# NEW: HuggingFace API Key
HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxxxxxxxxxxxxxxx
```

**Important:** Never commit this file to git!

---

## **Step 3: Architecture Overview**

```
User Uploads PDF → Extract Text → Chunk (512 tokens) → Embed (NV-Embed-v2) → Store in pgvector
                                                                                     ↓
User Searches ← Rerank Top 10 ← Vector Search (Top 100) ← Embed Query ← User Query
```

---

## **Step 4: Cost Analysis**

### **FREE Tier (Recommended)**
- **HuggingFace Inference API**: FREE (rate-limited but sufficient)
- **Supabase pgvector**: Included in your plan
- **Storage**: Minimal (text chunks + vectors)

**Estimated usage:**
- 10 documents/month = FREE
- 100 searches/month = FREE
- No monthly costs

### **Paid Tier (If You Grow)**
If you hit rate limits:
- **HuggingFace Pro**: $9/month (10x more API calls)
- **Or self-host**: Run NV-Embed-v2 on your own GPU

---

## **Step 5: Testing**

### **5.1 Test Embedding Service**
```typescript
import { generateEmbedding } from '@/lib/rag-embedding';

const vector = await generateEmbedding('Test capabilities document');
console.log(`Generated ${vector.length}-dim vector`); // Should be 1024
```

### **5.2 Test PDF Extraction**
```typescript
import { extractPDFText } from '@/lib/rag-pdf';
import fs from 'fs';

const buffer = fs.readFileSync('test.pdf');
const extraction = await extractPDFText(buffer);
console.log(`Extracted ${extraction.pages.length} pages`);
```

### **5.3 Test Chunking**
```typescript
import { chunkText } from '@/lib/rag-chunking';

const chunks = chunkText(extraction.text);
console.log(`Created ${chunks.length} chunks`);
```

---

## **Step 6: Next Steps (Building API Routes)**

Now that the foundation is ready, I'll build:

1. **`/api/admin/rag/ingest`** - Upload PDF/paste text → process → store
2. **`/api/admin/rag/search`** - Query → vector search → return matches
3. **`/api/admin/rag/files`** - List/manage uploaded files
4. **Admin UI** - Upload interface + search results

---

## **Troubleshooting**

### **"pgvector extension not found"**
- Make sure you ran `CREATE EXTENSION IF NOT EXISTS vector;`
- Check Supabase plan (should be included)

### **"HuggingFace API rate limit"**
- FREE tier: ~1000 requests/month
- Wait 60 seconds between large batches
- Or upgrade to Pro ($9/month)

### **"PDF extraction failed"**
- Check if PDF is encrypted
- Try OCR for scanned PDFs (future enhancement)

---

## **Files Created**

✅ **Database**: `RAG_SYSTEM_SETUP.sql` (run this first)
✅ **Utilities**:
  - `src/lib/rag-embedding.ts` - HuggingFace NV-Embed-v2
  - `src/lib/rag-chunking.ts` - Text splitting (512 tokens, 12.5% overlap)
  - `src/lib/rag-pdf.ts` - PDF extraction

🔄 **Coming Next**:
  - API routes for ingestion + search
  - Admin UI for document management
  - Results with highlighting + scores

---

## **Questions?**

Ready to continue with the API routes and UI? 🚀

