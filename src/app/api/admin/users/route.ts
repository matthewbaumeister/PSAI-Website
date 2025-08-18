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

    // Fetch all users with their profiles
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        full_name,
        company_name,
        job_title,
        is_admin,
        is_verified,
        subscription_tier,
        subscription_status,
        created_at
      `)
      .order('created_at', { ascending: false })

    if (usersError) {
      console.error('Error fetching users:', usersError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch users' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: users || []
    })
  } catch (error) {
    console.error('Admin users API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
