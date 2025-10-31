/**
 * LLM Instruction Analyzer Service
 * 
 * Uses GPT-4o-mini to analyze instruction documents and generate:
 * - Superseding guidance notes
 * - Compliance checklist with citations
 * - Conflict resolution
 * - Cross-reference annotations
 */

import OpenAI from 'openai';

// Lazy initialization - only create client when needed
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

export interface InstructionAnalysisResult {
  proposal_phase: 'Phase I' | 'Direct to Phase II (DP2)' | 'Phase II';
  toc_reconciliation: TOCReconciliation;
  volumes: VolumeGuide[];
  critical_notes: CriticalNote[];
  quick_reference: QuickReferenceItem[];
  analysis_metadata: AnalysisMetadata;
}

export interface TOCReconciliation {
  baa_structure: string[];
  component_structure: string[];
  notes: string;
}

export interface VolumeGuide {
  volume_number: string;
  volume_title: string;
  description: string;
  page_limit?: string;
  format_requirements: string[];
  required_sections: RequiredSection[];
  submission_instructions: string;
  important_notes: string[];
}

export interface RequiredSection {
  section_title: string;
  section_number?: string;
  description: string;
  requirements: string[];
  citation: string;
  priority: 'Critical' | 'Required' | 'Recommended';
  max_pages?: string;
  formatting_notes?: string[];
}

export interface CriticalNote {
  category: string;
  note: string;
  citation: string;
  applies_to: string[];
}

export interface QuickReferenceItem {
  category: string;
  item: string;
  value: string;
  citation: string;
}

export interface AnalysisMetadata {
  analyzed_at: string;
  model_used: string;
  component_doc_length: number;
  baa_doc_length: number;
  total_volumes: number;
  total_requirements: number;
}

/**
 * Analyze instruction documents using GPT-4o-mini
 * 
 * CAPACITY NOTES:
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * - GPT-4o-mini context window: 128K tokens (~500K characters)
 * - Current limit: 100K chars per doc = 200K total = ~50K tokens
 * - This uses only ~40% of available capacity
 * - Handles documents up to ~40 pages each (80 pages total analyzed)
 * - Response needs ~4K tokens, system prompt ~4K tokens
 * - Total usage: ~58K / 128K tokens (45% capacity)
 * 
 * FUTURE EXPANSION (if needed for 100+ page documents):
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Could implement chunking strategy:
 * 1. Analyze main body + appendixes separately
 * 2. Merge results with conflict detection
 * 3. Cost: 2x API calls per opportunity (~$0.02 instead of ~$0.01)
 * 
 * COST ESTIMATES:
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * GPT-4o-mini pricing: $0.150 per 1M input tokens, $0.600 per 1M output
 * - Current (50K input + 4K output): ~$0.0099 per opportunity
 * - With chunking (2x calls): ~$0.0198 per opportunity
 */
export async function analyzeInstructionDocuments(
  componentText: string,
  baaText: string,
  opportunityContext: {
    topic_number: string;
    title: string;
    component: string;
  }
): Promise<InstructionAnalysisResult> {
  
  const prompt = buildAnalysisPrompt(componentText, baaText, opportunityContext);
  
  try {
    const openai = getOpenAIClient();
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1, // Low temperature for consistency
      response_format: { type: 'json_object' },
      max_tokens: 12000, // Increased for detailed multi-paragraph responses
    });

    const responseText = completion.choices[0].message.content;
    if (!responseText) {
      throw new Error('No response from OpenAI');
    }

    const result = JSON.parse(responseText) as InstructionAnalysisResult;
    
    // Add metadata
    result.analysis_metadata = {
      analyzed_at: new Date().toISOString(),
      model_used: 'gpt-4o-mini',
      component_doc_length: componentText.length,
      baa_doc_length: baaText.length,
      total_volumes: result.volumes.length,
      total_requirements: result.volumes.reduce((sum, vol) => 
        sum + vol.required_sections.reduce((secSum, sec) => secSum + sec.requirements.length, 0), 0
      ),
    };

    return result;
    
  } catch (error) {
    console.error('Error analyzing instructions with LLM:', error);
    throw new Error(`Failed to analyze instructions: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * System prompt that defines the AI's role and output format
 */
const SYSTEM_PROMPT = `You are an expert SBIR/STTR proposal writer creating COMPREHENSIVE submission guides. Your job is to analyze Component and BAA instruction documents and produce DETAILED, ACTIONABLE guides.

CRITICAL RULES:
1. DETECT proposal type: Standard Phase I, Direct to Phase II (DP2), or Phase II Only
2. For DP2: Recognize Volume 2A (Feasibility) + Volume 2B (Technical) structure
3. Extract 3-5 PARAGRAPHS of explanation per section (not 1-2 sentences!)
4. When Component and BAA conflict, APPLY the superseding rule and show ONLY the correct requirement
5. Include COMPLETE text of requirements (word-for-word from documents where possible)
6. Build a TOC reconciliation showing how Component modifies BAA structure
7. Cite EVERYTHING with section § and page references
8. Make it prescriptive ("You must do X") not analytical ("Component says X, BAA says Y")

Output ONLY valid JSON matching this EXACT structure:
{
  "proposal_phase": "Phase I" or "Direct to Phase II (DP2)" or "Phase II",
  "toc_reconciliation": {
    "baa_structure": ["1. Problem/Opportunity", "2. Technical Objectives", "3. SOW"...],
    "component_structure": ["2A. Feasibility Documentation", "2B Part 1. Technical Approach"...],
    "notes": "Component splits Volume 2 into 2A (Feasibility, 5 pages) and 2B (Technical, 20 pages). 2A is NEW for DP2. 2B follows standard BAA structure with modifications."
  },
  "volumes": [
    {
      "volume_number": "Volume 2A",
      "volume_title": "Feasibility Documentation (DP2 Only)",
      "description": "3-5 paragraph description of this volume's purpose, what makes it unique, when it's required, and what success looks like",
      "page_limit": "5 pages",
      "format_requirements": ["Single PDF", "Must include all graphics", "12pt font minimum", "References count toward limit"],
      "required_sections": [
        {
          "section_title": "Scientific and Technical Merit Documentation",
          "section_number": "2A.1",
          "description": "3-4 paragraph description of what this section requires, why it's important, and what evaluators will look for. Include COMPLETE explanation from source documents.",
          "requirements": [
            "You must provide documentation substantiating that the scientific and technical merit described in the Phase I section of this topic has been met",
            "You must describe any potential commercial application of the technology",
            "You must include all relevant information including but not limited to: technical reports (summary and citation), test data, prototype designs/models, and performance goals/results",
            "Work submitted must have been substantially performed by your firm",
            "Feasibility documentation CANNOT be based upon any prior or ongoing federally funded SBIR or STTR work",
            "You must own IP or have obtained license rights to all technology referenced"
          ],
          "citation": "Component §2A, pp.6-7",
          "priority": "Critical",
          "max_pages": "5 pages (includes references)",
          "formatting_notes": ["References count toward total page limit", "Include works cited as last page"]
        }
      ],
      "submission_instructions": "Submit as separate PDF via DSIP by close date. File naming: [Company]_[Topic]_Vol2A.pdf",
      "important_notes": [
        "DP2 ONLY - Not required for standard Phase I proposals",
        "If you fail to demonstrate Phase I-equivalent feasibility, entire proposal will be deemed unresponsive",
        "Work must be substantially performed by proposer/PI",
        "Cannot extend from prior federal SBIR/STTR work"
      ]
    }
  ],
  "critical_notes": [
    {
      "category": "DP2 Structure",
      "note": "For Direct to Phase II proposals, Volume 2 is split into TWO sub-volumes: 2A (Feasibility Documentation, 5 pages) and 2B (Technical Proposal, 20 pages). This differs from standard Phase I which has a single Volume 2.",
      "citation": "Component §2A-2B, pp.6-8",
      "applies_to": ["Volume 2A", "Volume 2B"]
    }
  ],
  "quick_reference": [
    {
      "category": "DP2 Structure",
      "item": "Volume 2A (Feasibility)",
      "value": "5 pages max (includes references)",
      "citation": "Component §2A, p.6"
    },
    {
      "category": "DP2 Structure",
      "item": "Volume 2B (Technical)",
      "value": "20 pages max",
      "citation": "Component §2B, p.6"
    }
  ]
}

When conflicts exist:
- Apply the superseding rule
- Show ONLY the correct requirement
- Add a critical_note explaining the superseding rule
- Add to quick_reference for easy lookup

Be comprehensive - this guide should be the ONLY document needed to write the proposal.`;

/**
 * Build the user prompt with context
 */
function buildAnalysisPrompt(
  componentText: string,
  baaText: string,
  opportunityContext: {
    topic_number: string;
    title: string;
    component: string;
  }
): string {
  
  // Truncate if needed (GPT-4o-mini has 128K token context = ~500K chars capacity)
  // Allow up to 100K chars per doc = ~200K total = ~50K tokens (only 40% of capacity)
  // This covers documents up to ~40 pages each (80 pages total)
  const maxLength = 100000;
  const truncatedComponent = componentText.length > maxLength 
    ? componentText.substring(0, maxLength) + '\n\n[TRUNCATED - DOCUMENT CONTINUES - SOME APPENDIXES MAY BE CUT OFF]'
    : componentText;
  
  const truncatedBaa = baaText.length > maxLength
    ? baaText.substring(0, maxLength) + '\n\n[TRUNCATED - DOCUMENT CONTINUES - SOME APPENDIXES MAY BE CUT OFF]'
    : baaText;

  return `Create a comprehensive SBIR proposal submission guide for:

OPPORTUNITY CONTEXT:
- Topic: ${opportunityContext.topic_number}
- Title: ${opportunityContext.title}
- Component: ${opportunityContext.component}

COMPONENT-SPECIFIC INSTRUCTIONS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${truncatedComponent}

BAA/SOLICITATION INSTRUCTIONS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${truncatedBaa}

YOUR TASK:
Create COMPREHENSIVE submission guides. Follow these steps:

STEP 1: DETECT PROPOSAL TYPE
Look for keywords: "Direct to Phase II", "DP2", "Feasibility Documentation", "Phase I", "Phase II Only"
Set proposal_phase field accordingly.

STEP 2: BUILD TOC RECONCILIATION
Compare BAA table of contents with Component table of contents.
Note differences, additions, modifications.
Example: "BAA lists Volume 2 as single entity. Component splits it into 2A (Feasibility) and 2B (Technical, Part 1 and Part 2)."

STEP 3: EXTRACT EACH VOLUME WITH EXTREME DETAIL
For EACH volume, extract:

A. **Volume Description** (3-5 PARAGRAPHS minimum):
   - What is this volume's purpose?
   - When is it required? (e.g., "DP2 only", "All proposals")
   - What makes it unique?
   - What are evaluators looking for?
   - How does it fit into the overall proposal?

B. **Page Limits** (exact numbers, apply superseding rules)

C. **Format Requirements** (comprehensive list):
   - File format (PDF, Word, etc.)
   - Font face and size
   - Line spacing
   - Margins
   - Graphics handling
   - Reference counting
   - File naming conventions

D. **Required Sections** (for EACH section):
   
   i. **Section Description** (3-4 PARAGRAPHS):
      - Extract the COMPLETE explanation from source documents
      - Don't summarize - include full details
      - Explain what evaluators will assess
      - Provide context and examples if given
   
   ii. **Requirements List** (word-for-word extraction):
      - Copy EXACT language from documents whenever possible
      - Convert to prescriptive format: "You must...", "Include...", "Provide..."
      - Include ALL requirements (major AND minor)
      - Include word/page counts
      - Include format specifications
      - Include exclusions ("cannot include...", "must not...")
   
   iii. **Citation**: Exact section § and page number
   
   iv. **Priority**: Critical (rejection if missing), Required (needed for completion), Recommended (improves score)
   
   v. **Formatting Notes**: Section-specific format requirements

E. **Submission Instructions**: How, when, where, file naming

F. **Important Notes**: 
   - Critical warnings
   - Common mistakes to avoid
   - Superseding rules applied
   - Special phase-specific notes

STEP 4: EXTRACT CRITICAL NOTES
Create critical_notes for:
- Superseding rules (Component overrides BAA)
- DP2-specific requirements
- Exclusions and prohibitions
- High-risk requirements

STEP 5: BUILD QUICK REFERENCE
Extract for quick lookup:
- All page limits
- All deadlines
- All format specs
- All word/character counts
- Key dates

CRITICAL REQUIREMENTS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Write 3-5 PARAGRAPHS for volume descriptions (not 1-2 sentences!)
✅ Write 3-4 PARAGRAPHS for section descriptions (not 1-2 sentences!)
✅ Extract 5-15 requirements per section (not just 2-3!)
✅ Use word-for-word text from documents (not summaries!)
✅ Detect DP2 structure (Volume 2A + 2B)
✅ Build complete TOC reconciliation
✅ Handle Phase I, DP2, and Phase II variations

The output should be SO DETAILED that someone could write their entire proposal using ONLY this guide without reading the original 80-page documents.

Return ONLY the JSON structure defined in the system prompt. No additional text.`;
}

/**
 * Format the analysis result for display in the UI (simplified - UI components handle rendering)
 */
export function formatAnalysisForDisplay(result: InstructionAnalysisResult): string {
  let output = '📋 COMPREHENSIVE SUBMISSION GUIDE\n';
  output += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
  
  // Volumes
  result.volumes.forEach((volume, index) => {
    output += `${volume.volume_number}: ${volume.volume_title}\n`;
    output += `Page Limit: ${volume.page_limit || 'Not specified'}\n`;
    output += `\n${volume.description}\n\n`;
    
    if (volume.format_requirements.length > 0) {
      output += 'Format Requirements:\n';
      volume.format_requirements.forEach(req => output += `  • ${req}\n`);
      output += '\n';
    }
    
    output += 'Required Sections:\n';
    volume.required_sections.forEach(section => {
      const priorityIcon = section.priority === 'Critical' ? '🔴' : section.priority === 'Required' ? '🔵' : '⚪';
      output += `\n${priorityIcon} ${section.section_title}${section.section_number ? ` (§${section.section_number})` : ''}\n`;
      output += `   ${section.description}\n`;
      section.requirements.forEach(req => output += `   • ${req}\n`);
      output += `   Citation: ${section.citation}\n`;
    });
    
    output += '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
  });

  // Critical notes
  if (result.critical_notes.length > 0) {
    output += '\n⚠️  CRITICAL NOTES\n';
    output += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
    result.critical_notes.forEach(note => {
      output += `${note.category}: ${note.note}\n`;
      output += `Citation: ${note.citation}\n`;
      output += `Applies to: ${note.applies_to.join(', ')}\n\n`;
    });
  }

  // Metadata
  output += '\n📊 Analysis Metadata\n';
  output += `Generated: ${new Date(result.analysis_metadata.analyzed_at).toLocaleString()}\n`;
  output += `Model: ${result.analysis_metadata.model_used}\n`;
  output += `Total Volumes: ${result.analysis_metadata.total_volumes}\n`;
  output += `Total Requirements: ${result.analysis_metadata.total_requirements}\n`;

  return output;
}

