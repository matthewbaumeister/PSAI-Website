// ============================================
// API: Browse All SBIR Awards (Admin)
// ============================================
// GET /api/admin/sbir/awards
//
// Browse and filter all SBIR awards data

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const agency = searchParams.get('agency');
    const year = searchParams.get('year');
    const phase = searchParams.get('phase');
    const company = searchParams.get('company');
    const topicNumber = searchParams.get('topic_number');
    const womanOwned = searchParams.get('woman_owned');

    const offset = (page - 1) * limit;

    console.log(`[Awards Browse API] Page ${page}, Limit ${limit}, Filters:`, {
      agency, year, phase, company, topicNumber, womanOwned
    });

    // Build query
    let query = supabase
      .from('sbir_awards')
      .select('*', { count: 'exact' });

    // Apply filters
    if (agency) {
      query = query.eq('agency_id', agency.toUpperCase());
    }
    if (year) {
      query = query.eq('award_year', parseInt(year));
    }
    if (phase) {
      query = query.ilike('phase', `%${phase}%`);
    }
    if (company) {
      query = query.ilike('company', `%${company}%`);
    }
    if (topicNumber) {
      query = query.eq('topic_number', topicNumber);
    }
    if (womanOwned === 'true') {
      query = query.eq('woman_owned', true);
    }

    // Apply pagination and sorting
    const { data: awards, error, count } = await query
      .order('award_year', { ascending: false })
      .order('award_date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('[Awards Browse API] Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch awards', details: error.message },
        { status: 500 }
      );
    }

    // Get statistics
    const statsQuery = supabase
      .from('sbir_awards')
      .select('award_amount, phase, agency_id, woman_owned');

    // Apply same filters for stats
    let statsQueryFiltered = statsQuery;
    if (agency) statsQueryFiltered = statsQueryFiltered.eq('agency_id', agency.toUpperCase());
    if (year) statsQueryFiltered = statsQueryFiltered.eq('award_year', parseInt(year));
    if (phase) statsQueryFiltered = statsQueryFiltered.ilike('phase', `%${phase}%`);
    if (company) statsQueryFiltered = statsQueryFiltered.ilike('company', `%${company}%`);
    if (topicNumber) statsQueryFiltered = statsQueryFiltered.eq('topic_number', topicNumber);
    if (womanOwned === 'true') statsQueryFiltered = statsQueryFiltered.eq('woman_owned', true);

    const { data: statsData } = await statsQueryFiltered;

    const stats = statsData ? {
      total_funding: statsData.reduce((sum, a) => sum + (parseFloat(a.award_amount as string) || 0), 0),
      phase_breakdown: statsData.reduce((acc: any, a) => {
        const p = a.phase || 'Unknown';
        acc[p] = (acc[p] || 0) + 1;
        return acc;
      }, {}),
      agency_breakdown: statsData.reduce((acc: any, a) => {
        const ag = a.agency_id || 'Unknown';
        acc[ag] = (acc[ag] || 0) + 1;
        return acc;
      }, {}),
      woman_owned_count: statsData.filter(a => a.woman_owned).length
    } : null;

    console.log(`[Awards Browse API] Returning ${awards?.length || 0} of ${count || 0} awards`);

    return NextResponse.json({
      awards: awards || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limit)
      },
      filters: {
        agency,
        year,
        phase,
        company,
        topic_number: topicNumber,
        woman_owned: womanOwned
      },
      statistics: stats
    });

  } catch (error) {
    console.error('[Awards Browse API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

