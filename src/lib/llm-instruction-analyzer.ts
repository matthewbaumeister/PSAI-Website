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
  volumes: VolumeGuide[];
  critical_notes: CriticalNote[];
  quick_reference: QuickReferenceItem[];
  analysis_metadata: AnalysisMetadata;
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
      max_tokens: 4000,
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
const SYSTEM_PROMPT = `You are an expert SBIR/STTR proposal writer creating a comprehensive submission guide. Your job is to analyze Component and BAA instruction documents and produce a SINGLE, ACTIONABLE guide that someone can follow to write their proposal.

CRITICAL RULES:
1. When Component and BAA conflict, APPLY the superseding rule and show ONLY the correct requirement
2. Extract EVERY requirement with full explanatory text (not just summaries)
3. Organize by Volume with complete descriptions of what goes in each volume
4. Include ALL formatting requirements, page limits, section orders, etc.
5. Cite EVERYTHING with section and page references
6. Make it prescriptive ("You must do X") not analytical ("Component says X, BAA says Y")

Output ONLY valid JSON matching this EXACT structure:
{
  "volumes": [
    {
      "volume_number": "Volume 1",
      "volume_title": "Proposal Cover Sheet",
      "description": "Full description of this volume's purpose and contents",
      "page_limit": "1 page" or null,
      "format_requirements": ["Single PDF", "Must include all graphics", "12pt font minimum"],
      "required_sections": [
        {
          "section_title": "Technical Abstract",
          "section_number": "1.1",
          "description": "Full description of what this section must contain",
          "requirements": [
            "Must describe the proposed R&D project",
            "Must include anticipated benefits",
            "Must discuss potential commercial applications",
            "Limit to 200 words"
          ],
          "citation": "Component §3.7(a), p.9",
          "priority": "Critical",
          "max_pages": "0.5 pages",
          "formatting_notes": ["Include as part of cover sheet", "No separate page"]
        }
      ],
      "submission_instructions": "Submit via DSIP by close date",
      "important_notes": ["This volume is required for all proposals", "Must be signed by authorized official"]
    }
  ],
  "critical_notes": [
    {
      "category": "Superseding Rules",
      "note": "Component instructions take precedence for technical volume page limits. Use 7 pages, not 15.",
      "citation": "Component §3.7(b)(2), p.10",
      "applies_to": ["Volume 2"]
    }
  ],
  "quick_reference": [
    {
      "category": "Page Limits",
      "item": "Technical Volume",
      "value": "7 pages maximum",
      "citation": "Component §3.7(b)(2), p.10"
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
Create a complete, prescriptive submission guide organized by volume. For EACH volume:

1. **Full Description**: What is this volume? What's its purpose?
2. **Page Limits**: Exact page limits (apply superseding rules if conflict exists)
3. **Format Requirements**: PDF specs, fonts, margins, graphics handling
4. **Required Sections**: For EACH section in the volume:
   - Section title and number
   - Full description of what must be included
   - Every single requirement (with full text, not summaries)
   - Exact citation (section §, page number)
   - Priority level (Critical/Required/Recommended)
   - Page allocation if specified
   - Any formatting notes specific to that section
5. **Submission Instructions**: How and when to submit
6. **Important Notes**: Critical warnings, superseding rules applied, special instructions

RESOLVE CONFLICTS AUTOMATICALLY:
- When Component and BAA conflict, APPLY the superseding rule
- Show ONLY the CORRECT requirement (not both versions)
- Add a "critical_note" explaining which rule was applied and why
- Add to "quick_reference" for easy lookup

EXTRACT EVERYTHING:
- All volumes (typically 1-7 or more)
- All sections within each volume (with descriptions AND requirements)
- All formatting rules
- All submission requirements
- All administrative requirements
- All technical content requirements
- All appendix references (note when appendixes are referenced)

FORMATTING:
- Write requirements as actions: "You must...", "Include...", "Provide..."
- Be specific and detailed
- Include word/page counts
- Include all formatting specifications
- Cite every single requirement

The output should be so comprehensive that someone could write their entire proposal using ONLY this guide.

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

