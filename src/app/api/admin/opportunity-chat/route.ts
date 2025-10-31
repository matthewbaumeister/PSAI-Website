import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

// Function definitions for OpenAI function calling
const CHAT_FUNCTIONS = [
  {
    name: 'search_similar_opportunities',
    description: 'Search for similar SBIR/STTR opportunities based on keywords, technology areas, or objectives. Use this when the user asks about related work, similar opportunities, or what else aligns with the current opportunity.',
    parameters: {
      type: 'object',
      properties: {
        keywords: {
          type: 'string',
          description: 'Keywords or phrases to search for (e.g., "AI machine learning", "hypersonic weapons")'
        },
        component: {
          type: 'string',
          description: 'Specific DoD component to filter by (e.g., "Air Force", "Navy", "Army"). Leave empty to search all.'
        },
        status: {
          type: 'string',
          enum: ['Open', 'Closed', 'Prerelease', 'Active', 'All'],
          description: 'Filter by status. Default is "All".'
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results to return (default: 5, max: 10)'
        }
      },
      required: ['keywords']
    }
  },
  {
    name: 'get_opportunity_details',
    description: 'Get detailed information about a specific opportunity by topic number. Use this when the user asks about a specific topic or wants more details about an opportunity from search results.',
    parameters: {
      type: 'object',
      properties: {
        topic_number: {
          type: 'string',
          description: 'The topic number (e.g., "CBD254-011", "A254-P039")'
        }
      },
      required: ['topic_number']
    }
  }
];

// Search for similar opportunities
async function searchSimilarOpportunities(params: {
  keywords: string;
  component?: string;
  status?: string;
  limit?: number;
}) {
  const { keywords, component, status = 'All', limit = 5 } = params;
  
  try {
    let query = supabase
      .from('sbir_final')
      .select('topic_number, title, status, sponsor_component, close_date, phase_1_award_amount, phase_2_award_amount, technology_areas, keywords, objectives')
      .limit(Math.min(limit, 10));

    // Apply filters
    if (status !== 'All') {
      query = query.ilike('status', status);
    }
    
    if (component) {
      query = query.ilike('sponsor_component', `%${component}%`);
    }

    // Search across multiple fields
    const searchTerms = keywords.toLowerCase();
    query = query.or(`title.ilike.%${searchTerms}%,keywords.ilike.%${searchTerms}%,technology_areas.ilike.%${searchTerms}%,objectives.ilike.%${searchTerms}%,description.ilike.%${searchTerms}%`);

    const { data, error } = await query;

    if (error) throw error;

    return {
      success: true,
      results: data || [],
      count: data?.length || 0
    };
  } catch (error) {
    console.error('[Search Similar] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to search opportunities',
      results: [],
      count: 0
    };
  }
}

// Get specific opportunity details
async function getOpportunityDetails(topicNumber: string) {
  try {
    const { data, error } = await supabase
      .from('sbir_final')
      .select('*')
      .eq('topic_number', topicNumber)
      .single();

    if (error) throw error;

    return {
      success: true,
      opportunity: data
    };
  } catch (error) {
    console.error('[Get Opportunity] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch opportunity',
      opportunity: null
    };
  }
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

AVAILABLE TOOLS:
You can search for similar opportunities in the database when users ask:
- "What other opportunities are related to this?"
- "Find similar work in [technology area]"
- "What else aligns with this opportunity?"
- "Show me other [component] opportunities about [topic]"
Use the search_similar_opportunities function to help users discover related work.

RESPONSE STYLE:
- Use citations: "According to [Source §X, p.Y]..."
- Quote exact requirements: "The instructions state: '[exact quote]'"
- Provide page limits, font sizes, and formatting details with sources
- If referencing volumes or sections, use exact numbering from instructions
- For DP2 opportunities, clearly distinguish between 2A (Feasibility) and 2B (Technical)
- When showing similar opportunities, include topic numbers, titles, status, and key details

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

    // Call OpenAI with function calling
    const client = getOpenAI();
    let completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: messages,
      functions: CHAT_FUNCTIONS as any,
      function_call: 'auto',
      temperature: 0.7,
      max_tokens: 2000 // Increased for detailed responses with citations
    });

    let responseMessage = completion.choices[0]?.message;

    // Handle function calls
    if (responseMessage?.function_call) {
      const functionName = responseMessage.function_call.name;
      const functionArgs = JSON.parse(responseMessage.function_call.arguments || '{}');

      console.log(`[Opportunity Chat] Function call: ${functionName}`, functionArgs);

      // Execute the function
      let functionResult: any;
      if (functionName === 'search_similar_opportunities') {
        functionResult = await searchSimilarOpportunities(functionArgs);
      } else if (functionName === 'get_opportunity_details') {
        functionResult = await getOpportunityDetails(functionArgs.topic_number);
      } else {
        functionResult = { success: false, error: 'Unknown function' };
      }

      // Add function call and result to messages
      messages.push({
        role: 'assistant',
        content: null,
        function_call: responseMessage.function_call
      } as any);

      messages.push({
        role: 'function',
        name: functionName,
        content: JSON.stringify(functionResult)
      } as any);

      // Call OpenAI again with function result
      completion = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: messages,
        temperature: 0.7,
        max_tokens: 2000
      });

      responseMessage = completion.choices[0]?.message;
    }

    const answer = responseMessage?.content || 'Sorry, I could not generate a response.';

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

