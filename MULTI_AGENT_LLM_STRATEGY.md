# Multi-Agent LLM Strategy for Instruction Analysis

## Current Single-Agent Approach

**Model:** GPT-4o-mini  
**Process:** One API call analyzes BOTH documents and generates ALL volumes  
**Output Limit:** 16K tokens (~12,500 words)  
**Cost:** ~$0.01 per opportunity  

**Pros:**
- Simple, fast, cheap
- One coherent analysis
- Handles cross-references between volumes
- 12,500 words is MORE than enough for most opportunities

**Cons:**
- If we need >12,500 words, it truncates
- Single point of failure

---

## Multi-Agent Approach (If Needed)

### Strategy: One Agent Per Volume

**Agent 1: TOC Reconciliation & Metadata**
- Input: Both Component + BAA docs (full)
- Task: Extract complete TOC from both, identify differences, extract metadata
- Output: TOC reconciliation + discovered_metadata (~2K words)
- Cost: ~$0.003

**Agent 2: Volume 2A (DP2 Feasibility)**
- Input: Component doc (focused on Volume 2A section)
- Task: Deep dive on feasibility requirements
- Output: Complete Volume 2A guide (~3K-5K words)
- Cost: ~$0.004

**Agent 3: Volume 2B Part 1 (Technical Approach)**
- Input: Both docs (focused on technical sections 1-6)
- Task: Extract sections 1-6 exhaustively
- Output: Sections 1-6 (~4K-6K words)
- Cost: ~$0.005

**Agent 4: Volume 2B Part 2 (Key Personnel, Facilities, etc.)**
- Input: Both docs (focused on sections D-G)
- Task: Extract sections D-G exhaustively
- Output: Sections D-G (~3K-5K words)
- Cost: ~$0.004

**Agent 5: Merge & Conflicts**
- Input: All previous agent outputs
- Task: Merge into single coherent guide, resolve conflicts
- Output: Final merged analysis
- Cost: ~$0.003

**Total Cost:** ~$0.02-$0.03 per opportunity (2-3x current)  
**Total Output:** Can exceed 20K+ words (no limit!)  
**Processing Time:** ~90-150 seconds (parallel execution)

---

## Recommendation

### Start with Single Agent (Current)

**Why:**
1. 12,500 words is HUGE - most opportunities won't need more
2. 10x cheaper
3. Simpler, faster, more reliable
4. Easy to monitor and debug

**Upgrade to Multi-Agent IF:**
- Users report truncated outputs
- Opportunities consistently need >12,500 words
- We want to go even deeper (20K+ words per opportunity)

### Hybrid Approach (Smart Upgrade)

Add a **failsafe** to the current system:

```typescript
// After generation, check if output was truncated
if (analysisResult.analysis_metadata.output_truncated) {
  console.log('[LLM] Output was truncated, triggering multi-agent fallback');
  analysisResult = await multiAgentAnalysis(componentText, baaText, opportunityContext);
}
```

This way:
- 95% of opportunities use cheap single-agent
- 5% that need more depth automatically trigger multi-agent
- Best of both worlds!

---

## Model Comparison

| Model | Context Window | Output Limit | Cost per Opp | Quality |
|-------|---------------|--------------|-------------|---------|
| GPT-4o-mini | 128K tokens | 16K tokens (~12,500 words) | $0.01 | Very Good |
| GPT-4o | 128K tokens | 16K tokens (~12,500 words) | $0.50 | Excellent |
| GPT-4o-mini (Multi-Agent) | 128K × 5 agents | 80K tokens (~60,000 words) | $0.03 | Very Good |
| GPT-4o (Multi-Agent) | 128K × 5 agents | 80K tokens (~60,000 words) | $1.50 | Excellent |

---

## My Recommendation

**Phase 1 (Current):** Stick with GPT-4o-mini single agent
- Test with real opportunities (SF254-D1205)
- Monitor output length
- Check if users report missing info

**Phase 2 (If Needed):** Add multi-agent fallback
- Detect truncation
- Automatically switch to multi-agent for complex opportunities
- 95% stay cheap, 5% get deep dive

**Phase 3 (Future):** Optional GPT-4o upgrade
- Only if quality issues with mini
- Or for premium feature ("Ultra-Detailed Analysis")

---

## Cost Projection

For 1,000 active opportunities:

| Approach | Cost per Opp | Total Cost | Notes |
|----------|-------------|------------|-------|
| GPT-4o-mini (current) | $0.01 | $10 | Regenerate all opportunities |
| GPT-4o-mini (multi-agent) | $0.03 | $30 | If all need deep dive |
| GPT-4o | $0.50 | $500 | 50x more expensive |
| Hybrid (95% mini, 5% multi) | $0.011 | $11 | Smart fallback |

**Current monthly scraping:** ~100 new/updated opportunities
**Monthly LLM cost:** $1-3 (negligible!)

