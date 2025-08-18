import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { Opportunity, OpportunityForm } from '@/lib/types'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    let query = supabase
      .from('opportunities')
      .select('*, companies(name, industry)', { count: 'exact' })
      .eq('user_id', user.id)

    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    // Order by created_at desc
    query = query.order('created_at', { ascending: false })

    const { data: opportunities, error, count } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch opportunities' },
        { status: 500 }
      )
    }

    const totalPages = Math.ceil((count || 0) / limit)

    return NextResponse.json({
      success: true,
      data: {
        data: opportunities || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages,
        },
      }
    })
  } catch (error) {
    console.error('Opportunities GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body: OpportunityForm = await request.json()
    const { title, description, company_id, status, value, currency, due_date, source } = body

    // Validate required fields
    if (!title || !company_id) {
      return NextResponse.json(
        { success: false, error: 'Title and company are required' },
        { status: 400 }
      )
    }

    // Create opportunity
    const { data: opportunity, error } = await supabase
      .from('opportunities')
      .insert([
        {
          title,
          description,
          company_id,
          user_id: user.id,
          status: status || 'open',
          value,
          currency: currency || 'USD',
          due_date,
          source
        }
      ])
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to create opportunity' },
        { status: 500 }
      )
    }

    // Log activity
    await supabase
      .from('activity_log')
      .insert([
        {
          user_id: user.id,
          action: 'opportunity_created',
          entity_type: 'opportunity',
          entity_id: opportunity.id,
          details: { title, status: opportunity.status }
        }
      ])

    return NextResponse.json(
      { success: true, data: opportunity, message: 'Opportunity created successfully' },
      { status: 201 }
    )
  } catch (error) {
    console.error('Opportunities POST error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
