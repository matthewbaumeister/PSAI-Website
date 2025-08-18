import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { Proposal, ApiResponse, PaginatedResponse } from '@/lib/types'

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
      .from('proposals')
      .select('*, companies(name, industry)', { count: 'exact' })
      .eq('user_id', user.id)

    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,client_name.ilike.%${search}%`)
    }

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    // Order by created_at desc
    query = query.order('created_at', { ascending: false })

    const { data: proposals, error, count } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch proposals' },
        { status: 500 }
      )
    }

    const totalPages = Math.ceil((count || 0) / limit)

    const response: PaginatedResponse<Proposal> = {
      data: proposals || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
      },
    }

    return NextResponse.json({ success: true, data: response })
  } catch (error) {
    console.error('Proposals GET error:', error)
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

    const body = await request.json()
    const { title, description, content, client_name, client_email, client_company, value, currency, due_date } = body

    // Validate required fields
    if (!title) {
      return NextResponse.json(
        { success: false, error: 'Title is required' },
        { status: 400 }
      )
    }

    // Create proposal
    const { data: proposal, error } = await supabase
      .from('proposals')
      .insert([
        {
          title,
          description,
          content: content || {},
          user_id: user.id,
          client_name,
          client_email,
          client_company,
          value,
          currency: currency || 'USD',
          due_date,
          status: 'draft',
        }
      ])
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to create proposal' },
        { status: 500 }
      )
    }

    // Log activity
    await supabase
      .from('activity_log')
      .insert([
        {
          user_id: user.id,
          action: 'proposal_created',
          entity_type: 'proposal',
          entity_id: proposal.id,
          details: { title, status: 'draft' }
        }
      ])

    return NextResponse.json(
      { success: true, data: proposal, message: 'Proposal created successfully' },
      { status: 201 }
    )
  } catch (error) {
    console.error('Proposals POST error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
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

    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Proposal ID is required' },
        { status: 400 }
      )
    }

    // Check if user owns this proposal
    const { data: existingProposal, error: checkError } = await supabase
      .from('proposals')
      .select('id, title, status')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (checkError || !existingProposal) {
      return NextResponse.json(
        { success: false, error: 'Proposal not found or access denied' },
        { status: 404 }
      )
    }

    // Update proposal
    const { data: proposal, error } = await supabase
      .from('proposals')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to update proposal' },
        { status: 500 }
      )
    }

    // Log activity
    await supabase
      .from('activity_log')
      .insert([
        {
          user_id: user.id,
          action: 'proposal_updated',
          entity_type: 'proposal',
          entity_id: id,
          details: { title: proposal.title, status: proposal.status }
        }
      ])

    return NextResponse.json(
      { success: true, data: proposal, message: 'Proposal updated successfully' }
    )
  } catch (error) {
    console.error('Proposals PUT error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
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
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Proposal ID is required' },
        { status: 400 }
      )
    }

    // Check if user owns this proposal
    const { data: existingProposal, error: checkError } = await supabase
      .from('proposals')
      .select('id, title')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (checkError || !existingProposal) {
      return NextResponse.json(
        { success: false, error: 'Proposal not found or access denied' },
        { status: 404 }
      )
    }

    // Delete proposal
    const { error } = await supabase
      .from('proposals')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to delete proposal' },
        { status: 500 }
      )
    }

    // Log activity
    await supabase
      .from('activity_log')
      .insert([
        {
          user_id: user.id,
          action: 'proposal_deleted',
          entity_type: 'proposal',
          entity_id: id,
          details: { title: existingProposal.title }
        }
      ])

    return NextResponse.json(
      { success: true, message: 'Proposal deleted successfully' }
    )
  } catch (error) {
    console.error('Proposals DELETE error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
