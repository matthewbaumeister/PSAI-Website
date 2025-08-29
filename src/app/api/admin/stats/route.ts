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
    
    // Get user statistics
    const { count: totalUsers, error: usersError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })

    if (usersError) {
      console.error('Error counting users:', usersError)
      return NextResponse.json(
        { error: 'Failed to get user stats', message: 'Database error occurred' },
        { status: 500 }
      )
    }

    // Get verified users count
    const { count: verifiedUsers, error: verifiedError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .not('email_verified_at', 'is', null)

    if (verifiedError) {
      console.error('Error counting verified users:', verifiedError)
    }

    // Get admin users count
    const { count: adminUsers, error: adminError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('is_admin', true)

    if (adminError) {
      console.error('Error counting admin users:', adminError)
    }

    // Get active users count
    const { count: activeUsers, error: activeError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    if (activeError) {
      console.error('Error counting active users:', activeError)
    }

    // Get active sessions count
    const { count: totalSessions, error: sessionsError } = await supabase
      .from('user_sessions')
      .select('*', { count: 'exact', head: true })
      .gt('expires_at', new Date().toISOString())

    if (sessionsError) {
      console.error('Error counting active sessions:', sessionsError)
    }

    const stats = {
      totalUsers: totalUsers || 0,
      verifiedUsers: verifiedUsers || 0,
      adminUsers: adminUsers || 0,
      activeUsers: activeUsers || 0,
      totalSessions: totalSessions || 0
    }

    return NextResponse.json({
      success: true,
      stats
    })

  } catch (error) {
    console.error('Admin stats fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
