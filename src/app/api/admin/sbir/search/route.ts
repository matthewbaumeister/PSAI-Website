import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'
import { createAdminSupabaseClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Authenticate the request
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const { user } = authResult

    // Check if user is admin
    if (!user.is_admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const agency = searchParams.get('agency') || ''
    const topic = searchParams.get('topic') || ''
    const phase = searchParams.get('phase') || ''
    const year = searchParams.get('year') || ''
    const status = searchParams.get('status') || ''

    if (!query.trim()) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 })
    }

    const supabase = createAdminSupabaseClient()
    const offset = (page - 1) * limit

    // Build the search query
    let searchQuery = supabase
      .from('sbir_final')
      .select('*', { count: 'exact' })

    // Add text search
    if (query.trim()) {
      searchQuery = searchQuery.or(`title.ilike.%${query}%,topic_title.ilike.%${query}%,description.ilike.%${query}%,abstract.ilike.%${query}%`)
    }

    // Add filters
    if (agency) {
      searchQuery = searchQuery.ilike('agency', `%${agency}%`)
    }
    if (topic) {
      searchQuery = searchQuery.ilike('topic_title', `%${topic}%`)
    }
    if (phase) {
      searchQuery = searchQuery.eq('phase', phase)
    }
    if (year) {
      searchQuery = searchQuery.eq('year', year)
    }
    if (status) {
      searchQuery = searchQuery.ilike('status', `%${status}%`)
    }

    // Add pagination
    searchQuery = searchQuery
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false })

    const { data: results, error, count } = await searchQuery

    if (error) {
      console.error('Search error:', error)
      return NextResponse.json({ error: 'Search failed' }, { status: 500 })
    }

    return NextResponse.json({
      results: results || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    })

  } catch (error) {
    console.error('Error in GET /api/admin/sbir/search:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
