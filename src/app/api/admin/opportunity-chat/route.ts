import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import OpenAI from 'openai';

// Lazy initialize OpenAI to prevent build errors
let openai: OpenAI | null = null;
function getOpenAI() {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatRequest {
  question: string;
  opportunityData: any;
  conversationHistory?: Message[];
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await requireAuth(request);
    // If authResult is a NextResponse, it means auth failed
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body: ChatRequest = await request.json();
    const { question, opportunityData, conversationHistory = [] } = body;

    if (!question || !opportunityData) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log(`[Opportunity Chat] User ${authResult.user.email} asking about ${opportunityData.topic_number}`);

    // Build context about the opportunity
    const opportunityContext = buildOpportunityContext(opportunityData);

    // Build conversation messages for OpenAI
    const messages: any[] = [
      {
        role: 'system',
        content: `You are Make Ready MATRIX, an expert AI assistant helping users write winning SBIR/STTR proposals. You have complete access to all opportunity data, including detailed submission instructions with exact citations.

CRITICAL INSTRUCTIONS:
- ALWAYS provide citations for requirements (e.g., "According to Component §2A, p.6...")
- ALWAYS quote exact requirements word-for-word when discussing compliance
- Be extremely detailed and thorough - users need complete, actionable answers
- If a requirement references an appendix, note that and tell them to check the original PDF
- When discussing page limits, formatting, or submission rules, cite the exact source
- If asked about conflicts between documents, explain how they're resolved
- Be encouraging but precise - proposal compliance is critical
- If information isn't in the data, say so clearly

RESPONSE STYLE:
- Use citations: "According to [Source §X, p.Y]..."
- Quote exact requirements: "The instructions state: '[exact quote]'"
- Provide page limits, font sizes, and formatting details with sources
- If referencing volumes or sections, use exact numbering from instructions
- For DP2 opportunities, clearly distinguish between 2A (Feasibility) and 2B (Technical)

OPPORTUNITY DATA:
${opportunityContext}`
      }
    ];

    // Add conversation history (last 6 messages for context)
    const recentHistory = conversationHistory.slice(-6);
    recentHistory.forEach(msg => {
      messages.push({
        role: msg.role,
        content: msg.content
      });
    });

    // Add current question
    messages.push({
      role: 'user',
      content: question
    });

    // Call OpenAI
    const client = getOpenAI();
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: messages,
      temperature: 0.7,
      max_tokens: 2000 // Increased for detailed responses with citations
    });

    const answer = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';

    console.log(`[Opportunity Chat] Response generated successfully`);

    return NextResponse.json({
      success: true,
      answer: answer,
      usage: completion.usage
    });

  } catch (error) {
    console.error('[Opportunity Chat] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to process chat request'
      },
      { status: 500 }
    );
  }
}

function buildOpportunityContext(data: any): string {
  const sections: string[] = [];

  // Basic Info
  sections.push(`TOPIC NUMBER: ${data.topic_number || 'N/A'}`);
  sections.push(`TITLE: ${data.title || 'N/A'}`);
  sections.push(`STATUS: ${data.status || 'N/A'}`);
  sections.push(`COMPONENT: ${data.sponsor_component || 'N/A'}`);
  
  // Dates
  if (data.open_date) sections.push(`OPENS: ${data.open_date}`);
  if (data.close_date) sections.push(`CLOSES: ${data.close_date}`);
  
  // Funding
  if (data.phase_1_funding_max || data.phase_2_funding_max) {
    sections.push('\nFUNDING:');
    if (data.phase_1_funding_max) sections.push(`- Phase 1: Up to $${data.phase_1_funding_max.toLocaleString()}`);
    if (data.phase_1_duration_months) sections.push(`  Duration: ${data.phase_1_duration_months} months`);
    if (data.phase_2_funding_max) sections.push(`- Phase 2: Up to $${data.phase_2_funding_max.toLocaleString()}`);
    if (data.phase_2_duration_months) sections.push(`  Duration: ${data.phase_2_duration_months} months`);
  }

  // Technology Areas
  if (data.technology_areas && data.technology_areas.length > 0) {
    sections.push(`\nTECHNOLOGY AREAS: ${data.technology_areas.join(', ')}`);
  }

  // Keywords
  if (data.keywords && data.keywords.length > 0) {
    sections.push(`\nKEYWORDS: ${data.keywords.join(', ')}`);
  }

  // Objective
  if (data.objective) {
    sections.push(`\nOBJECTIVE:\n${data.objective}`);
  }

  // Description
  if (data.description) {
    sections.push(`\nDESCRIPTION:\n${data.description.substring(0, 1500)}${data.description.length > 1500 ? '...' : ''}`);
  }

  // Phase Descriptions
  if (data.phase_1_description) {
    sections.push(`\nPHASE 1 DESCRIPTION:\n${data.phase_1_description.substring(0, 1000)}${data.phase_1_description.length > 1000 ? '...' : ''}`);
  }
  if (data.phase_2_description) {
    sections.push(`\nPHASE 2 DESCRIPTION:\n${data.phase_2_description.substring(0, 1000)}${data.phase_2_description.length > 1000 ? '...' : ''}`);
  }

  // Q&A
  if (data.qa_content) {
    sections.push(`\nQ&A FROM PROGRAM OFFICE:\n${data.qa_content.substring(0, 2000)}${data.qa_content.length > 2000 ? '...' : ''}`);
  }

  // Restrictions
  if (data.restrictions) {
    sections.push(`\nRESTRICTIONS:\n${data.restrictions}`);
  }

  // Instructions - Include FULL detailed analysis if available
  if (data.instructions_checklist && typeof data.instructions_checklist === 'object') {
    const analysis = data.instructions_checklist;
    
    sections.push(`\n${'='.repeat(80)}`);
    sections.push(`DETAILED SUBMISSION INSTRUCTIONS WITH CITATIONS`);
    sections.push(`${'='.repeat(80)}`);
    
    // Proposal Phase
    if (analysis.proposal_phase) {
      sections.push(`\nPROPOSAL TYPE: ${analysis.proposal_phase}`);
    }
    
    // TOC Reconciliation
    if (analysis.toc_reconciliation) {
      sections.push(`\nTABLE OF CONTENTS RECONCILIATION:`);
      if (analysis.toc_reconciliation.baa_structure) {
        sections.push(`BAA Structure: ${analysis.toc_reconciliation.baa_structure}`);
      }
      if (analysis.toc_reconciliation.component_structure) {
        sections.push(`Component Structure: ${analysis.toc_reconciliation.component_structure}`);
      }
      if (analysis.toc_reconciliation.notes) {
        sections.push(`Notes: ${analysis.toc_reconciliation.notes}`);
      }
    }
    
    // Critical Notes
    if (analysis.critical_notes && analysis.critical_notes.length > 0) {
      sections.push(`\nCRITICAL COMPLIANCE NOTES:`);
      analysis.critical_notes.forEach((note: any, idx: number) => {
        sections.push(`\n${idx + 1}. ${note.title}`);
        sections.push(`   ${note.description}`);
        if (note.citation) sections.push(`   Citation: ${note.citation}`);
        if (note.applies_to) sections.push(`   Applies to: ${note.applies_to.join(', ')}`);
      });
    }
    
    // Quick Reference
    if (analysis.quick_reference && analysis.quick_reference.length > 0) {
      sections.push(`\nQUICK REFERENCE:`);
      analysis.quick_reference.forEach((item: any) => {
        sections.push(`- ${item.category}: ${item.value} (${item.citation})`);
      });
    }
    
    // Detailed Volumes
    if (analysis.volumes && analysis.volumes.length > 0) {
      sections.push(`\n${'='.repeat(80)}`);
      sections.push(`COMPLETE VOLUME-BY-VOLUME REQUIREMENTS`);
      sections.push(`${'='.repeat(80)}`);
      
      analysis.volumes.forEach((volume: any) => {
        sections.push(`\n${'-'.repeat(80)}`);
        sections.push(`${volume.volume_number}: ${volume.volume_title}`);
        sections.push(`Page Limit: ${volume.page_limit || 'Not specified'}`);
        sections.push(`${'-'.repeat(80)}`);
        
        if (volume.volume_description) {
          sections.push(`\nOVERVIEW:\n${volume.volume_description}`);
        }
        
        if (volume.format_requirements && volume.format_requirements.length > 0) {
          sections.push(`\nFORMAT REQUIREMENTS:`);
          volume.format_requirements.forEach((req: string) => {
            sections.push(`- ${req}`);
          });
        }
        
        if (volume.required_sections && volume.required_sections.length > 0) {
          sections.push(`\nREQUIRED SECTIONS:`);
          volume.required_sections.forEach((section: any, idx: number) => {
            sections.push(`\nSection ${idx + 1}: ${section.section_title} [${section.priority}]`);
            if (section.section_number) sections.push(`Section Number: ${section.section_number}`);
            if (section.page_allocation) sections.push(`Page Allocation: ${section.page_allocation}`);
            
            if (section.description) {
              sections.push(`\nDescription:\n${section.description}`);
            }
            
            if (section.requirements && section.requirements.length > 0) {
              sections.push(`\nREQUIREMENTS (Word-for-Word):`);
              section.requirements.forEach((req: string, reqIdx: number) => {
                sections.push(`  ${reqIdx + 1}. ${req}`);
              });
            }
            
            if (section.citation) {
              sections.push(`\nCitation: ${section.citation}`);
            }
            
            if (section.formatting_notes && section.formatting_notes.length > 0) {
              sections.push(`Formatting Notes: ${section.formatting_notes.join('; ')}`);
            }
          });
        }
        
        if (volume.submission_instructions) {
          sections.push(`\nSUBMISSION INSTRUCTIONS:\n${volume.submission_instructions}`);
        }
        
        if (volume.important_notes && volume.important_notes.length > 0) {
          sections.push(`\nIMPORTANT NOTES:`);
          volume.important_notes.forEach((note: string) => {
            sections.push(`- ${note}`);
          });
        }
      });
    }
  } else {
    // Fallback to basic instructions if detailed analysis doesn't exist
    if (data.component_instructions_download) {
      sections.push(`\nCOMPONENT INSTRUCTIONS: Available (PDF)`);
    }
    if (data.solicitation_instructions_download) {
      sections.push(`BAA INSTRUCTIONS: Available (PDF)`);
    }
    if (data.instructions_plain_text) {
      sections.push(`\nCONSOLIDATED INSTRUCTIONS SUMMARY:\n${data.instructions_plain_text.substring(0, 2000)}${data.instructions_plain_text.length > 2000 ? '...' : ''}`);
    }
  }

  // Direct to Phase II
  if (data.is_direct_to_phase_ii === 'Yes') {
    sections.push(`\nNOTE: This is a Direct to Phase II opportunity`);
  }

  return sections.join('\n');
}

