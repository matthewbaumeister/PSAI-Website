import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parse filters from query params
    const searchQuery = searchParams.get('q') || ''
    const agencies = searchParams.get('agencies')?.split(',').filter(Boolean) || []
    const statuses = searchParams.get('statuses')?.split(',').filter(Boolean) || []
    const minValue = searchParams.get('minValue') ? parseFloat(searchParams.get('minValue')!) : null
    const maxValue = searchParams.get('maxValue') ? parseFloat(searchParams.get('maxValue')!) : null
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    
    // Start building query
    let query = supabase
      .from('opportunity_master')
      .select(`
        *,
        source_count:opportunity_sources(count)
      `)
      .order('publication_date', { ascending: false })
      .range(offset, offset + limit - 1)
    
    // Apply filters
    if (searchQuery) {
      query = query.or(`title.ilike.%${searchQuery}%,full_description.ilike.%${searchQuery}%,short_description.ilike.%${searchQuery}%`)
    }
    
    if (agencies.length > 0) {
      query = query.in('customer_agency', agencies)
    }
    
    if (statuses.length > 0) {
      query = query.in('status', statuses)
    }
    
    if (minValue !== null) {
      query = query.gte('estimated_value', minValue)
    }
    
    if (maxValue !== null) {
      query = query.lte('estimated_value', maxValue)
    }
    
    const { data, error, count } = await query
    
    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch opportunities', details: error.message },
        { status: 500 }
      )
    }
    
    // Transform to match our Opportunity type
    const opportunities = (data || []).map((opp: any) => ({
      id: opp.id.toString(),
      title: opp.title,
      description: opp.full_description || opp.short_description || '',
      summary: opp.short_description || opp.llm_summary || '',
      agency: opp.customer_agency || 'Unknown Agency',
      department: opp.customer_department || 'Federal',
      office: opp.customer_office || '',
      type: opp.opportunity_type || 'contract_award',
      status: opp.status || 'unknown',
      postedDate: opp.publication_date || opp.created_at,
      dueDate: opp.due_date,
      awardDate: opp.award_date,
      value: opp.estimated_value || opp.ceiling_value || null,
      contractVehicle: opp.vehicle_type || 'Unknown',
      naicsCodes: opp.naics_codes || [],
      keywords: opp.keywords || [],
      setAside: opp.set_aside_type || null,
      placeOfPerformance: opp.customer_location || null,
      
      // Source tracking
      sources: opp.source_attributes || {},
      sourceCount: Array.isArray(opp.source_count) ? opp.source_count.length : (opp.source_count || 1),
      
      // Additional metadata
      contractType: opp.contract_type,
      competitionType: opp.competition_type,
      vendors: opp.prime_recipients || [],
      
      // User notes (will be joined from user_opportunities later)
      internalNotes: '',
    }))
    
    return NextResponse.json({
      opportunities,
      total: count || data?.length || 0,
      limit,
      offset
    })
    
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

