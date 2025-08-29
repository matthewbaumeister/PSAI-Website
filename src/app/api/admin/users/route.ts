import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase'
import { requireAdmin } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  try {
    // Check if user is admin
    const authResult = await requireAdmin(request)
    if (!authResult.success) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Admin access required' },
        { status: 401 }
      )
    }

    const supabase = createAdminSupabaseClient()
    
    // Get all users with their details
    const { data: users, error } = await supabase
      .from('users')
      .select(`
        id,
        email,
        first_name,
        last_name,
        company_name,
        company_size,
        email_verified_at,
        is_admin,
        is_active,
        last_login_at,
        created_at
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching users:', error)
      return NextResponse.json(
        { error: 'Failed to fetch users', message: 'Database error occurred' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      users: users || []
    })

  } catch (error) {
    console.error('Admin users fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
