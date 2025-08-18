import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

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

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.is_admin) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Fetch all meetings
    const { data: meetings, error: meetingsError } = await supabase
      .from('meetings')
      .select(`
        *,
        profiles!meetings_user_id_fkey(full_name, email),
        companies!meetings_company_id_fkey(name)
      `)
      .order('created_at', { ascending: false })

    if (meetingsError) {
      console.error('Error fetching meetings:', meetingsError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch meetings' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: meetings || []
    })
  } catch (error) {
    console.error('Admin meetings API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
