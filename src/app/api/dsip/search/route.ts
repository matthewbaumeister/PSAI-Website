import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    
    // Extract search parameters
    const query = searchParams.get('q') || ''
    const status = searchParams.get('status')?.split(',') || null
    const component = searchParams.get('component')?.split(',') || null
    const program = searchParams.get('program')?.split(',') || null
    const phase = searchParams.get('phase')?.split(',') || null
    const technologyAreas = searchParams.get('technologyAreas')?.split(',') || null
    const keywords = searchParams.get('keywords')?.split(',') || null
    const itar = searchParams.get('itar') === 'true' ? true : searchParams.get('itar') === 'false' ? false : null
    const isXtech = searchParams.get('isXtech') === 'true' ? true : searchParams.get('isXtech') === 'false' ? false : null
    const minFunding = searchParams.get('minFunding') ? parseFloat(searchParams.get('minFunding')!) : null
    const maxFunding = searchParams.get('maxFunding') ? parseFloat(searchParams.get('maxFunding')!) : null
    const openDateFrom = searchParams.get('openDateFrom') || null
    const openDateTo = searchParams.get('openDateTo') || null
    const closeDateFrom = searchParams.get('closeDateFrom') || null
    const closeDateTo = searchParams.get('closeDateTo') || null
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100) // Max 100 per page
    const offset = (page - 1) * limit

    const supabase = createAdminSupabaseClient()

    // Build the search query using the database function
    const { data: opportunities, error } = await supabase.rpc('search_dsip_opportunities', {
      search_query: query,
      status_filter: status,
      component_filter: component,
      program_filter: program,
      phase_filter: phase,
      technology_areas_filter: technologyAreas,
      keywords_filter: keywords,
      itar_filter: itar,
      is_xtech_filter: isXtech,
      min_funding: minFunding,
      max_funding: maxFunding,
      open_date_from: openDateFrom,
      open_date_to: openDateTo,
      close_date_from: closeDateFrom,
      close_date_to: closeDateTo,
      limit_count: limit,
      offset_count: offset
    })

    if (error) {
      console.error('Error searching DSIP opportunities:', error)
      return NextResponse.json({ message: 'Failed to search opportunities' }, { status: 500 })
    }

    // Get total count for pagination
    let totalCount = 0
    if (opportunities && opportunities.length > 0) {
      const { count } = await supabase
        .from('dsip_opportunities')
        .select('*', { count: 'exact', head: true })
        .or(`status.eq.${status?.join(',') || ''}`)
        .or(`component.eq.${component?.join(',') || ''}`)
        .or(`program.eq.${program?.join(',') || ''}`)
        .or(`phase.eq.${phase?.join(',') || ''}`)
      
      totalCount = count || 0
    }

    return NextResponse.json({
      opportunities: opportunities || [],
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    })

  } catch (error) {
    console.error('Error in DSIP search:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
