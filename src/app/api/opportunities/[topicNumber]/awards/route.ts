// ============================================
// API: Get Awards for Specific Opportunity
// ============================================
// GET /api/opportunities/:topicNumber/awards
//
// Returns all historical awards for a specific topic number

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: { topicNumber: string } }
) {
  try {
    const { topicNumber } = params;

    console.log(`[Awards API] Fetching awards for topic: ${topicNumber}`);

    // Fetch awards from sbir_awards table
    const { data: awards, error, count } = await supabase
      .from('sbir_awards')
      .select('*', { count: 'exact' })
      .eq('topic_number', topicNumber)
      .order('award_year', { ascending: false });

    if (error) {
      console.error('[Awards API] Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch awards', details: error.message },
        { status: 500 }
      );
    }

    // If no awards found, check if topic exists in sbir_final
    if (!awards || awards.length === 0) {
      const { data: topic } = await supabase
        .from('sbir_final')
        .select('topic_number, title')
        .eq('topic_number', topicNumber)
        .single();

      if (!topic) {
        return NextResponse.json(
          { error: 'Topic not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        topic_number: topicNumber,
        title: topic.title,
        awards: [],
        total_awards: 0,
        total_funding: 0,
        message: 'No historical awards found for this topic'
      });
    }

    // Calculate summary statistics
    const totalFunding = awards.reduce((sum, award) => {
      return sum + (parseFloat(award.award_amount as string) || 0);
    }, 0);

    const phaseBreakdown = awards.reduce((acc: any, award) => {
      const phase = award.phase || 'Unknown';
      acc[phase] = (acc[phase] || 0) + 1;
      return acc;
    }, {});

    console.log(`[Awards API] Found ${awards.length} awards for ${topicNumber}`);

    return NextResponse.json({
      topic_number: topicNumber,
      awards,
      total_awards: count || awards.length,
      total_funding: totalFunding,
      phase_breakdown: phaseBreakdown,
      unique_companies: [...new Set(awards.map(a => a.company))].length
    });

  } catch (error) {
    console.error('[Awards API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

