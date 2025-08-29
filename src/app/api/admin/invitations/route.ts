import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase'
import { requireAdmin } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  try {
    // Check if user is admin
    const authResult = await requireAdmin(request)
    
    // Check if authResult is a NextResponse (error) or user object
    if ('status' in authResult) {
      return authResult // Return the error response
    }

    const supabase = createAdminSupabaseClient()
    
    // Get all admin invitations
    const { data: invitations, error } = await supabase
      .from('admin_invitations')
      .select(`
        id,
        email,
        invited_by,
        status,
        created_at,
        expires_at
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching invitations:', error)
      return NextResponse.json(
        { error: 'Failed to fetch invitations', message: 'Database error occurred' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      invitations: invitations || []
    })

  } catch (error) {
    console.error('Admin invitations fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
