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
  discovered_metadata: DiscoveredMetadata; // NEW: Metadata extracted from instructions
  analysis_metadata: AnalysisMetadata;
}

// NEW: Metadata discovered by LLM from instruction documents
export interface DiscoveredMetadata {
  is_direct_to_phase_ii: boolean;
  phases_available: string[]; // e.g., ["Phase I", "Phase II", "Phase III"]
  phase_1_max_funding?: number;
  phase_1_duration_months?: number;
  phase_2_max_funding?: number;
  phase_2_duration_months?: number;
  page_limits: {
    volume: string;
    pages: number;
  }[];
  submission_deadline?: string;
  qa_deadline?: string;
  key_contacts?: string[];
  data_quality_notes: string[]; // Discrepancies or clarifications
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
      max_tokens: 16000, // High limit for exhaustive, detailed extraction (8K-15K+ words)
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

CRITICAL RULES - READ CAREFULLY:
1. DETECT proposal type: Standard Phase I, Direct to Phase II (DP2), or Phase II Only
2. For DP2: Recognize Volume 2A (Feasibility) + Volume 2B (Technical) structure
3. Extract COMPLETE, FULL text from documents - NO SUMMARIZING, NO SHORTENING
4. Copy-paste ENTIRE paragraphs of explanation (3-5+ paragraphs per section)
5. Extract EVERY requirement WORD-FOR-WORD from source documents
6. Include ALL subsections, sub-subsections, lettered items (a, b, c), and nested items (i, ii, iii)
7. Build COMPLETE TOC with EVERY numbered/lettered item from both documents
8. When Component and BAA conflict, APPLY the superseding rule and show ONLY the correct requirement
9. Cite EVERYTHING with section § and page references
10. Make it prescriptive ("You must do X") not analytical ("Component says X, BAA says Y")

DO NOT SIMPLIFY. DO NOT SHORTEN. DO NOT SUMMARIZE.
This guide must be SO DETAILED that reading the original 80-page PDFs is completely unnecessary.

Output ONLY valid JSON matching this EXACT structure:
{
  "proposal_phase": "Phase I" or "Direct to Phase II (DP2)" or "Phase II",
  "toc_reconciliation": {
    "baa_structure": [
      "1. Identification and Significance of the Problem or Opportunity",
      "2. Phase I Technical Objectives", 
      "3. Phase I Statement of Work",
      "4. Related Work",
      "5. Relationship with Future Research or Research and Development",
      "6. Commercialization Strategy",
      "7. Key Personnel",
      "8. Foreign Citizens",
      "9. Facilities/Equipment",
      "10. Subcontractors/Consultants",
      "11. Prior, Current, or Pending Support of Similar Proposals or Awards",
      "12. Identification and Assertion of Restrictions on the Government's Use, Release, or Disclosure of Technical Data or Computer Software"
    ],
    "component_structure": [
      "Volume 2A: Feasibility Documentation (5 pages)",
      "Volume 2B: Technical Proposal (20 pages)",
      "  (1) Table of Contents",
      "  (2) Glossary",
      "  (3) Milestone Identification",
      "  (4) Identification and Significance of the Problem or Opportunity",
      "  (5) Phase II Technical Objectives",
      "  (6) Work Plan",
      "    a) 1.0 - Objective",
      "    b) 2.0 - Scope",
      "    c) 3.0 - Background",
      "    d) 4.0 - Task/Technical Requirements",
      "  (7) Deliverables",
      "    a) Scientific and Technical Reports",
      "      i. Final Report",
      "      ii. Status Reports",
      "    b) Additional Reporting",
      "  (8) Related Work",
      "  (9) Commercialization Potential",
      "  (10) Relationship with Future R/R&D Efforts",
      "  D. Key Personnel",
      "  E. Facilities/Equipment",
      "  F. Consultants/Subcontractors",
      "  G. Prior, Current, or Pending Support of Similar Proposals or Awards"
    ],
    "notes": "For Direct to Phase II (DP2), Component splits Volume 2 into TWO distinct sub-volumes: 2A (Feasibility Documentation, 5 pages) proving Phase I-equivalent work was already completed, and 2B (Technical Proposal, 20 pages) following a modified BAA structure. Volume 2A is UNIQUE to DP2 and is not required for standard Phase I proposals. Volume 2B includes additional requirements: Table of Contents, Glossary, Milestone Identification (items 1-3), and uses different section numbering (4-10 then D-G) compared to standard BAA numbering (1-12). Component requires Work Plan as a separate section with specific formatting (subsections 1.0-4.0) and more detailed Deliverables section with subsections for reports and documentation. The BAA says 'Refer to the Service/Component-specific Direct to Phase II instructions' meaning Component instructions SUPERSEDE BAA for DP2 structure and requirements."
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
  ],
  "discovered_metadata": {
    "is_direct_to_phase_ii": true or false (based on instruction analysis),
    "phases_available": ["Phase I", "Phase II"] or ["Phase II"] (for DP2, list what's in the instructions),
    "phase_1_max_funding": 250000 (if mentioned in instructions, otherwise null),
    "phase_1_duration_months": 6 (if mentioned, otherwise null),
    "phase_2_max_funding": 1800000 (if mentioned, otherwise null),
    "phase_2_duration_months": 24 (if mentioned, otherwise null),
    "page_limits": [
      {"volume": "Volume 2A", "pages": 5},
      {"volume": "Volume 2B", "pages": 20}
    ],
    "submission_deadline": "Date if explicitly stated in instructions, otherwise null",
    "qa_deadline": "Date if explicitly stated, otherwise null",
    "key_contacts": ["Names/emails of program managers if mentioned", "Grant officer contact if mentioned"],
    "data_quality_notes": [
      "If DP2, note: Scraped data may incorrectly show 'false' for Direct to Phase II",
      "If page limits differ from typical, note the discrepancy",
      "Any other corrections to scraped metadata based on instruction analysis"
    ]
  }
}

When conflicts exist:
- Apply the superseding rule
- Show ONLY the correct requirement
- Add a critical_note explaining the superseding rule
- Add to quick_reference for easy lookup

METADATA EXTRACTION:
- Carefully analyze instructions to extract opportunity metadata
- If DP2 structure is detected (Volume 2A + 2B), set is_direct_to_phase_ii: true
- Extract any funding amounts, durations, deadlines mentioned in instructions
- Note discrepancies with scraped data in data_quality_notes
- This metadata will be used to auto-correct database records

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
Extract the COMPLETE, DETAILED table of contents from BOTH documents with ALL subsections.

BAA Structure: Extract ALL numbered items (1. Problem/Opportunity, 2. Technical Objectives, 3. SOW, 4. Related Work, etc.)

Component Structure: Extract the COMPLETE detailed structure with ALL subsections. For example:
- If Component has "Volume 2: Technical Volume Content" then extract ALL items under it:
  "1. Identification and Significance"
  "2. Phase II Technical Objectives" 
  "3. Phase II Statement of Work"
  "4. Related Work"
  "5. Relationship with Future R&D"
  "6. Commercialization Strategy"
  "7. Key Personnel"
  "8. Foreign Citizens"
  "9. Facilities/Equipment"
  "10. Subcontractors/Consultants"
  "11. Prior/Current/Pending Support"
  "12. Assertion of Restrictions"

- If DP2, extract BOTH Volume 2A AND the complete Volume 2B structure:
  "Volume 2A: Feasibility Documentation (5 pages)"
  "Volume 2B: Technical Proposal"
  "  (1) Table of Contents"
  "  (2) Glossary"
  "  (3) Milestone Identification"
  "  (4) Identification and Significance"
  "  (5) Phase II Technical Objectives"
  "  (6) Work Plan (with subsections 1.0-4.0)"
  "  (7) Deliverables"
  "  (8) Related Work"
  "  (9) Commercialization Potential"
  "  (10) Relationship with Future R&D"
  "  D. Key Personnel"
  "  E. Facilities/Equipment"
  "  F. Consultants/Subcontractors"
  "  G. Prior/Current/Pending Support"

DO NOT simplify to just "2B Part 1. Technical Approach" - extract ALL the detailed numbered/lettered items!

EXAMPLE OF COMPLETE EXTRACTION:
If Component says "Work Plan" with subsections:
  a) 1.0 - Objective: [3 paragraphs of explanation]
  b) 2.0 - Scope: [4 paragraphs of explanation]
  c) 3.0 - Background: [2 paragraphs of explanation]
  d) 4.0 - Task/Technical Requirements: [5 paragraphs of explanation]

Then extract ALL of this as separate component_structure items:
  "(6) Work Plan"
  "  a) 1.0 - Objective"
  "  b) 2.0 - Scope"
  "  c) 3.0 - Background"
  "  d) 4.0 - Task/Technical Requirements"

And create a separate required_section for EACH subsection (1.0, 2.0, 3.0, 4.0) with their full explanations!

Notes field: Explain how Component modifies BAA (adds sections, splits volumes, changes order, supersedes requirements, adds nested subsections)

STEP 3: EXTRACT EACH VOLUME WITH EXTREME DETAIL
For EACH volume, extract:

A. **Volume Description** (4-8 PARAGRAPHS - copy FULL text from documents):
   - Copy-paste the ENTIRE explanation from source documents
   - What is this volume's purpose? (full explanation)
   - When is it required? (e.g., "DP2 only", "All proposals")
   - What makes it unique? (complete details)
   - What are evaluators looking for? (all criteria)
   - How does it fit into the overall proposal? (full context)
   - Include ALL warnings, notes, and guidance from documents
   - If source has 6 paragraphs, extract ALL 6 paragraphs

B. **Page Limits** (exact numbers, apply superseding rules)

C. **Format Requirements** (comprehensive list):
   - File format (PDF, Word, etc.)
   - Font face and size
   - Line spacing
   - Margins
   - Graphics handling
   - Reference counting
   - File naming conventions

D. **Required Sections** (for EACH section - extract EVERYTHING):
   
   i. **Section Description** (COPY FULL TEXT - 4-8 PARAGRAPHS if available):
      - Copy-paste the ENTIRE explanation from source documents (don't paraphrase!)
      - If the document has 5 paragraphs explaining this section, include ALL 5 paragraphs
      - Include ALL details, context, examples, warnings, notes
      - Include every sentence that explains what evaluators will assess
      - Include background information, rationale, and guidance
      - DO NOT SUMMARIZE - extract the complete text
   
   ii. **Requirements List** (EXHAUSTIVE word-for-word extraction):
      - Copy EXACT language from documents word-for-word
      - Convert to prescriptive format: "You must...", "Include...", "Provide..."
      - Extract EVERY requirement mentioned (major, minor, implied)
      - Extract EVERY sub-requirement under lettered/numbered items (a, b, c, i, ii, iii)
      - Include ALL word/page/character counts
      - Include ALL format specifications (font, spacing, margins, file types)
      - Include ALL exclusions ("cannot include...", "must not...", "prohibited...")
      - Include ALL conditional requirements ("if X then Y")
      - Include ALL deliverables mentioned
      - Include ALL timeline/deadline requirements
      - Extract 10-20+ requirements per section (not just 3-5!)
   
   iii. **Citation**: Exact section § and page number from source document
   
   iv. **Priority**: Critical (rejection if missing), Required (needed for completion), Recommended (improves score)
   
   v. **Formatting Notes**: ALL section-specific format requirements, file naming, submission methods

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

CRITICAL REQUIREMENTS - CHECKLIST:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Extract COMPLETE TOC from Component with ALL numbered items (1-12), lettered items (A-G), and nested items (a, b, c, i, ii, iii)
✅ Copy-paste 4-8+ FULL PARAGRAPHS for volume descriptions (copy entire sections, don't paraphrase!)
✅ Copy-paste 4-8+ FULL PARAGRAPHS for section descriptions (include every sentence from source!)
✅ Extract 10-20+ requirements per section with EXACT wording from documents
✅ Include EVERY sub-requirement under numbered/lettered items
✅ Detect DP2 structure (Volume 2A + complete detailed 2B with items 1-10 + D-G)
✅ Build EXHAUSTIVE TOC reconciliation showing EVERY difference
✅ Handle Phase I, DP2, and Phase II variations
✅ Extract ALL formatting requirements (fonts, margins, spacing, file types, naming)
✅ Extract ALL deliverables with sub-items (reports, documentation, hardware)
✅ Extract ALL exclusions and prohibitions
✅ Extract ALL conditional requirements
✅ Copy text WORD-FOR-WORD wherever possible (don't rewrite in your own words!)

DEPTH CHECK:
- If your volume description is less than 300 words, you're summarizing (BAD) - go back and copy full text
- If your section has less than 10 requirements, you're missing details (BAD) - extract nested items
- If your TOC has less than 12 items for DP2 Volume 2B, you're missing sections (BAD) - extract complete structure
- The ENTIRE output should be 8,000-15,000+ words of detailed guidance

The output should be SO DETAILED and EXHAUSTIVE that:
1. Someone could write their entire proposal using ONLY this guide
2. Reading the original 80-page PDFs becomes completely unnecessary
3. Every requirement, sub-requirement, and formatting rule is captured
4. No information is lost from the source documents

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

