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
        content: `You are an expert AI assistant helping users understand SBIR/STTR opportunities. You have detailed information about a specific opportunity and should answer questions accurately and helpfully.

INSTRUCTIONS:
- Answer questions directly using the provided opportunity data
- Be concise but thorough
- If asked about something not in the data, clearly state that
- Format dates in a readable way (e.g., "January 15, 2026")
- When discussing funding, include both phase amounts if available
- Cite specific sections when relevant (e.g., "According to the Phase 1 description...")
- If asked about submission requirements, reference both component and BAA instructions
- Be encouraging and helpful in tone

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
      max_tokens: 800
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

  // Instructions
  if (data.component_instructions_download) {
    sections.push(`\nCOMPONENT INSTRUCTIONS: Available (PDF)`);
  }
  if (data.solicitation_instructions_download) {
    sections.push(`BAA INSTRUCTIONS: Available (PDF)`);
  }
  if (data.instructions_plain_text) {
    sections.push(`\nCONSOLIDATED INSTRUCTIONS SUMMARY:\n${data.instructions_plain_text.substring(0, 2000)}${data.instructions_plain_text.length > 2000 ? '...' : ''}`);
  }

  // Direct to Phase II
  if (data.is_direct_to_phase_ii === 'Yes') {
    sections.push(`\nNOTE: This is a Direct to Phase II opportunity`);
  }

  return sections.join('\n');
}

