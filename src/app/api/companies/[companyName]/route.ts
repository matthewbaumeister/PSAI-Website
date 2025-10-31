// ============================================
// API: Get Company Profile
// ============================================
// GET /api/companies/:companyName
//
// Returns company profile with award history and statistics

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyName: string }> }
) {
  try {
    const { companyName: rawCompanyName } = await params;
    const companyName = decodeURIComponent(rawCompanyName);

    console.log(`[Company API] Fetching profile for: ${companyName}`);

    // First, check if company exists in sbir_companies table
    const { data: companyProfile, error: companyError } = await supabase
      .from('sbir_companies')
      .select('*')
      .ilike('company_name', companyName)
      .single();

    // Fetch all awards for this company
    const { data: awards, error: awardsError } = await supabase
      .from('sbir_awards')
      .select('*')
      .ilike('company', companyName)
      .order('award_year', { ascending: false });

    if (awardsError) {
      console.error('[Company API] Error fetching awards:', awardsError);
    }

    // If no awards found
    if (!awards || awards.length === 0) {
      return NextResponse.json(
        { 
          error: 'Company not found or no awards available',
          company_name: companyName
        },
        { status: 404 }
      );
    }

    // Calculate statistics from awards
    const stats = {
      total_awards: awards.length,
      total_funding: awards.reduce((sum, a) => sum + (parseFloat(a.award_amount as string) || 0), 0),
      
      phase_breakdown: awards.reduce((acc: any, a) => {
        const phase = a.phase || 'Unknown';
        acc[phase] = (acc[phase] || 0) + 1;
        return acc;
      }, {}),
      
      agency_breakdown: awards.reduce((acc: any, a) => {
        const agency = a.agency_id || 'Unknown';
        acc[agency] = (acc[agency] || 0) + 1;
        return acc;
      }, {}),
      
      year_breakdown: awards.reduce((acc: any, a) => {
        const year = a.award_year || 'Unknown';
        acc[year] = (acc[year] || 0) + 1;
        return acc;
      }, {}),
      
      first_award_year: Math.min(...awards.map(a => a.award_year).filter(y => y)),
      most_recent_award_year: Math.max(...awards.map(a => a.award_year).filter(y => y)),
      
      // Phase I to Phase II conversion rate
      phase_1_count: awards.filter(a => a.phase?.includes('I') && !a.phase?.includes('II')).length,
      phase_2_count: awards.filter(a => a.phase?.includes('II')).length,
    };

    const conversionRate = stats.phase_1_count > 0 
      ? (stats.phase_2_count / stats.phase_1_count) * 100 
      : 0;

    // Get recent awards (last 10)
    const recentAwards = awards.slice(0, 10);

    // Get unique topics worked on
    const topicsWorkedOn = [...new Set(awards.map(a => a.topic_number).filter(t => t))];

    // Get technology areas
    const technologyAreas = [...new Set(
      awards
        .map(a => a.keywords || [])
        .flat()
        .filter(k => k)
    )];

    console.log(`[Company API] Found ${awards.length} awards for ${companyName}`);

    return NextResponse.json({
      company_name: companyName,
      profile: companyProfile || null,
      
      statistics: {
        ...stats,
        phase_1_to_2_conversion_rate: conversionRate.toFixed(1),
        average_award_amount: (stats.total_funding / stats.total_awards).toFixed(0)
      },
      
      recent_awards: recentAwards,
      all_awards: awards,
      
      insights: {
        topics_worked_on: topicsWorkedOn.length,
        technology_areas: technologyAreas.slice(0, 20), // Top 20 keywords
        primary_agencies: Object.entries(stats.agency_breakdown)
          .sort(([,a], [,b]) => (b as number) - (a as number))
          .slice(0, 5)
          .map(([agency]) => agency)
      }
    });

  } catch (error) {
    console.error('[Company API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

