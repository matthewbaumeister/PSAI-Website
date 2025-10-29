/**
 * LLM-Based Instruction Parser
 * 
 * Uses GPT-4 to intelligently parse consolidated instructions and create:
 * 1. Structured volume requirements
 * 2. Compliance checklist
 * 3. Key dates and deadlines
 * 4. Superseding rules and precedence notes
 */

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export interface ParsedInstruction {
  volumes: VolumeRequirement[];
  checklist: ChecklistItem[];
  keyDates: KeyDate[];
  precedenceNotes: string[];
  supersedingRules: SupersedingRule[];
}

export interface VolumeRequirement {
  volumeName: string;
  volumeNumber?: string;
  description: string;
  requirements: Requirement[];
  pageLimit?: string;
  isRequired: boolean;
}

export interface Requirement {
  id: string;
  text: string;
  source: 'component' | 'baa' | 'both';
  isOptional: boolean;
  category?: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  category: 'mandatory' | 'optional' | 'conditional';
  volume?: string;
  source: 'component' | 'baa' | 'both';
}

export interface KeyDate {
  label: string;
  date?: string;
  description: string;
}

export interface SupersedingRule {
  rule: string;
  precedence: 'component' | 'baa';
  context: string;
}

export class LLMInstructionParser {
  /**
   * Parse consolidated instructions using GPT-4
   */
  async parseInstructions(
    plainText: string,
    topicNumber: string
  ): Promise<ParsedInstruction> {
    
    if (!plainText || plainText.length < 100) {
      throw new Error('Instructions text is too short to parse');
    }

    const prompt = this.buildPrompt(plainText, topicNumber);
    
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `You are an expert SBIR/STTR proposal compliance specialist. Your job is to parse consolidated submission instructions and extract structured information that helps proposers understand requirements clearly. Always identify which source document (Component-specific vs BAA) each requirement comes from, and highlight any superseding or conflicting language.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1, // Low temperature for consistency
        response_format: { type: 'json_object' },
        max_tokens: 4000
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      const parsed = JSON.parse(content) as ParsedInstruction;
      
      // Validate and enhance the parsed data
      return this.validateAndEnhance(parsed);
      
    } catch (error) {
      console.error('LLM parsing error:', error);
      throw new Error(`Failed to parse instructions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Build the parsing prompt
   */
  private buildPrompt(plainText: string, topicNumber: string): string {
    // Truncate if too long (GPT-4 context limit)
    const maxLength = 120000; // ~30k tokens
    const truncatedText = plainText.length > maxLength 
      ? plainText.substring(0, maxLength) + '\n\n[TRUNCATED]'
      : plainText;

    return `
Parse the following SBIR/STTR consolidated submission instructions for topic ${topicNumber}.

Extract and structure the information into JSON format with the following structure:

{
  "volumes": [
    {
      "volumeName": "Volume 1: Proposal Cover Sheet",
      "volumeNumber": "1",
      "description": "Brief description of this volume",
      "requirements": [
        {
          "id": "v1-r1",
          "text": "Complete DD Form 1707",
          "source": "component" | "baa" | "both",
          "isOptional": false,
          "category": "Forms"
        }
      ],
      "pageLimit": "1 page",
      "isRequired": true
    }
  ],
  "checklist": [
    {
      "id": "c1",
      "text": "Proposal cover sheet completed",
      "category": "mandatory" | "optional" | "conditional",
      "volume": "Volume 1",
      "source": "component" | "baa" | "both"
    }
  ],
  "keyDates": [
    {
      "label": "Proposal Submission Deadline",
      "date": "2025-01-15" (if mentioned),
      "description": "Final deadline for electronic submission"
    }
  ],
  "precedenceNotes": [
    "Component-specific instructions take precedence over BAA requirements where they differ"
  ],
  "supersedingRules": [
    {
      "rule": "Phase I page limit is 15 pages (not 20 as stated in BAA)",
      "precedence": "component",
      "context": "Component instructions supersede BAA page limits"
    }
  ]
}

IMPORTANT:
- Focus on VOLUMES (especially Volume 2: Technical Volume)
- Extract ALL submission requirements and format requirements
- Identify which source document (component vs BAA) each requirement comes from
- Highlight any superseding language or conflicts
- Create a comprehensive compliance checklist
- Be specific and actionable

CONSOLIDATED INSTRUCTIONS:
${truncatedText}

Return ONLY valid JSON matching the structure above. No additional text.
`.trim();
  }

  /**
   * Validate and enhance parsed data
   */
  private validateAndEnhance(parsed: ParsedInstruction): ParsedInstruction {
    // Ensure arrays exist
    parsed.volumes = parsed.volumes || [];
    parsed.checklist = parsed.checklist || [];
    parsed.keyDates = parsed.keyDates || [];
    parsed.precedenceNotes = parsed.precedenceNotes || [];
    parsed.supersedingRules = parsed.supersedingRules || [];

    // Add IDs if missing
    parsed.volumes.forEach((vol, idx) => {
      vol.requirements = vol.requirements || [];
      vol.requirements.forEach((req, reqIdx) => {
        if (!req.id) {
          req.id = `v${idx + 1}-r${reqIdx + 1}`;
        }
      });
    });

    parsed.checklist.forEach((item, idx) => {
      if (!item.id) {
        item.id = `c${idx + 1}`;
      }
    });

    return parsed;
  }

  /**
   * Check if instructions need re-parsing (for updates/improvements)
   */
  shouldReparse(lastParsedAt: Date | null, instructionsUpdatedAt: Date): boolean {
    if (!lastParsedAt) return true;
    return instructionsUpdatedAt > lastParsedAt;
  }
}

export const llmParser = new LLMInstructionParser();

