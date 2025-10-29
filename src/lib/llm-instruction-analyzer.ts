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

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface InstructionAnalysisResult {
  superseding_notes: SupersedingNote[];
  compliance_checklist: ComplianceChecklistItem[];
  conflicts_detected: ConflictDetection[];
  analysis_metadata: AnalysisMetadata;
}

export interface SupersedingNote {
  category: string;
  rule: string;
  superseding_document: 'Component' | 'BAA' | 'Both Agree';
  component_reference?: string;
  baa_reference?: string;
  explanation: string;
}

export interface ComplianceChecklistItem {
  volume: string;
  section: string;
  requirement: string;
  source_document: 'Component' | 'BAA' | 'Both';
  citation: string;
  priority: 'Critical' | 'Required' | 'Recommended';
  notes?: string;
}

export interface ConflictDetection {
  topic: string;
  component_says: string;
  component_citation: string;
  baa_says: string;
  baa_citation: string;
  resolution: string;
  which_supersedes: 'Component' | 'BAA' | 'Ambiguous';
}

export interface AnalysisMetadata {
  analyzed_at: string;
  model_used: string;
  component_doc_length: number;
  baa_doc_length: number;
  total_requirements_found: number;
  conflicts_found: number;
}

/**
 * Analyze instruction documents using GPT-4o-mini
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
      total_requirements_found: result.compliance_checklist.length,
      conflicts_found: result.conflicts_detected.length,
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
const SYSTEM_PROMPT = `You are an expert SBIR/STTR proposal compliance analyst. Your job is to analyze instruction documents from two sources:
1. Component-specific instructions (e.g., Army, Navy, Air Force)
2. BAA/Solicitation-level instructions

Your analysis must:
- Identify which document supersedes the other for each requirement
- Extract all compliance requirements with precise citations
- Detect conflicts and resolve them based on superseding language
- Provide a structured compliance checklist organized by volume
- Include section numbers and page references for all citations

Output ONLY valid JSON matching this exact structure:
{
  "superseding_notes": [
    {
      "category": "string",
      "rule": "string",
      "superseding_document": "Component|BAA|Both Agree",
      "component_reference": "string (optional)",
      "baa_reference": "string (optional)",
      "explanation": "string"
    }
  ],
  "compliance_checklist": [
    {
      "volume": "string (e.g., 'Volume 1', 'Volume 2')",
      "section": "string (e.g., '1.1 Cover Sheet')",
      "requirement": "string (clear, actionable requirement)",
      "source_document": "Component|BAA|Both",
      "citation": "string (e.g., 'Component §2.1, p.5')",
      "priority": "Critical|Required|Recommended",
      "notes": "string (optional, for superseding info)"
    }
  ],
  "conflicts_detected": [
    {
      "topic": "string",
      "component_says": "string",
      "component_citation": "string",
      "baa_says": "string",
      "baa_citation": "string",
      "resolution": "string",
      "which_supersedes": "Component|BAA|Ambiguous"
    }
  ]
}

Common superseding patterns to look for:
- "Component instructions supersede BAA for..."
- "Except as noted in Component guidance..."
- "Follows Component-specific requirements..."
- "BAA requirements take precedence over..."
- "Unless otherwise specified in..."

Be thorough, precise, and cite everything with section/page numbers.`;

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
  
  // Truncate if needed (GPT-4o-mini has 128K context, but we'll be conservative)
  const maxLength = 30000; // ~30K chars per doc = ~60K total
  const truncatedComponent = componentText.length > maxLength 
    ? componentText.substring(0, maxLength) + '\n\n[TRUNCATED - DOCUMENT CONTINUES]'
    : componentText;
  
  const truncatedBaa = baaText.length > maxLength
    ? baaText.substring(0, maxLength) + '\n\n[TRUNCATED - DOCUMENT CONTINUES]'
    : baaText;

  return `Analyze these SBIR instruction documents for:

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

ANALYSIS TASKS:
1. Extract ALL submission requirements organized by volume (Volume 1, Volume 2, etc.)
2. For EACH requirement, cite the exact section and page from the source document
3. Identify which document supersedes for each requirement (look for explicit superseding language)
4. Detect conflicts where Component and BAA say different things
5. Resolve conflicts and explain which document takes precedence

Focus on:
- Page limits
- Format requirements (PDF, font, margins)
- Required sections and their order
- Budget/cost proposal requirements
- Administrative requirements (cover sheets, forms)
- Technical content requirements
- Submission deadlines and methods

Return ONLY the JSON structure defined in the system prompt. No additional text.`;
}

/**
 * Format the analysis result for display in the UI
 */
export function formatAnalysisForDisplay(result: InstructionAnalysisResult): string {
  let output = '';

  // Superseding notes
  if (result.superseding_notes.length > 0) {
    output += '📌 SUPERSEDING GUIDANCE NOTES\n';
    output += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
    
    const componentSupersedes = result.superseding_notes.filter(n => n.superseding_document === 'Component');
    const baaSupersedes = result.superseding_notes.filter(n => n.superseding_document === 'BAA');
    const bothAgree = result.superseding_notes.filter(n => n.superseding_document === 'Both Agree');
    
    if (componentSupersedes.length > 0) {
      output += '⚠️ Component instructions supersede BAA for:\n';
      componentSupersedes.forEach(note => {
        output += `   • ${note.rule}\n`;
        if (note.component_reference) output += `     Source: ${note.component_reference}\n`;
        if (note.explanation) output += `     Note: ${note.explanation}\n`;
      });
      output += '\n';
    }
    
    if (baaSupersedes.length > 0) {
      output += '⚠️ BAA instructions supersede Component for:\n';
      baaSupersedes.forEach(note => {
        output += `   • ${note.rule}\n`;
        if (note.baa_reference) output += `     Source: ${note.baa_reference}\n`;
        if (note.explanation) output += `     Note: ${note.explanation}\n`;
      });
      output += '\n';
    }
    
    if (bothAgree.length > 0) {
      output += '✅ Both documents agree on:\n';
      bothAgree.forEach(note => {
        output += `   • ${note.rule}\n`;
      });
      output += '\n';
    }
  }

  // Conflicts
  if (result.conflicts_detected.length > 0) {
    output += '\n⚠️ CONFLICTS DETECTED\n';
    output += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
    result.conflicts_detected.forEach((conflict, index) => {
      output += `${index + 1}. ${conflict.topic}\n`;
      output += `   Component says: "${conflict.component_says}" (${conflict.component_citation})\n`;
      output += `   BAA says: "${conflict.baa_says}" (${conflict.baa_citation})\n`;
      output += `   Resolution: ${conflict.resolution}\n`;
      output += `   Superseding: ${conflict.which_supersedes}\n\n`;
    });
  }

  // Compliance checklist
  if (result.compliance_checklist.length > 0) {
    output += '\n🔗 COMPLIANCE CHECKLIST\n';
    output += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
    
    // Group by volume
    const volumes = Array.from(new Set(result.compliance_checklist.map(item => item.volume)));
    volumes.sort();
    
    volumes.forEach(volume => {
      output += `${volume}:\n`;
      const items = result.compliance_checklist.filter(item => item.volume === volume);
      items.forEach(item => {
        const priorityIcon = item.priority === 'Critical' ? '🔴' : item.priority === 'Required' ? '🔵' : '⚪';
        output += `${priorityIcon} [ ] ${item.section}: ${item.requirement}\n`;
        output += `       Source: ${item.source_document} (${item.citation})\n`;
        if (item.notes) output += `       Note: ${item.notes}\n`;
      });
      output += '\n';
    });
  }

  // Metadata
  output += '\n📊 ANALYSIS METADATA\n';
  output += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
  output += `Generated: ${new Date(result.analysis_metadata.analyzed_at).toLocaleString()}\n`;
  output += `Model: ${result.analysis_metadata.model_used}\n`;
  output += `Requirements Found: ${result.analysis_metadata.total_requirements_found}\n`;
  output += `Conflicts Detected: ${result.analysis_metadata.conflicts_found}\n`;

  return output;
}

