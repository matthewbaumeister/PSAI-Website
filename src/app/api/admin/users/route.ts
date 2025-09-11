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

    // Get all users with their settings
    const supabase = createAdminSupabaseClient()
    
    // Get users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (usersError) {
      console.error('Error fetching users:', usersError)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    // Get user settings for all users
    const userIds = users.map(user => user.id)
    const { data: settings, error: settingsError } = await supabase
      .from('user_settings')
      .select('user_id, setting_key, setting_value')
      .in('user_id', userIds)

    if (settingsError) {
      console.error('Error fetching user settings:', settingsError)
      // Continue without settings rather than failing
    }

    // Get session counts for each user
    const { data: sessions, error: sessionsError } = await supabase
      .from('user_sessions')
      .select('user_id')
      .in('user_id', userIds)

    if (sessionsError) {
      console.error('Error fetching user sessions:', sessionsError)
      // Continue without session data
    }

    // Process settings into user objects
    const usersWithSettings = users.map(user => {
      const userSettings = settings?.filter(s => s.user_id === user.id) || []
      const settingsObj = userSettings.reduce((acc, setting) => {
        acc[setting.setting_key] = setting.setting_value === 'true'
        return acc
      }, {} as Record<string, boolean>)

      const sessionCount = sessions?.filter(s => s.user_id === user.id).length || 0

      return {
        ...user,
        settings: Object.keys(settingsObj).length > 0 ? settingsObj : undefined,
        session_count: sessionCount
      }
    })

    return NextResponse.json({ 
      users: usersWithSettings,
      total: usersWithSettings.length
    })

  } catch (error) {
    console.error('Error in GET /api/admin/users:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { userId, action, value } = body

    if (!userId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = createAdminSupabaseClient()

    switch (action) {
      case 'toggle_active':
        // Toggle user active status
        const { error: toggleError } = await supabase
          .from('users')
          .update({ 
            is_active: value !== undefined ? value : !(await supabase
              .from('users')
              .select('is_active')
              .eq('id', userId)
              .single()
            ).data?.is_active
          })
          .eq('id', userId)

        if (toggleError) {
          console.error('Error toggling user active status:', toggleError)
          return NextResponse.json({ error: 'Failed to update user status' }, { status: 500 })
        }
        break

      case 'toggle_admin':
        // Toggle user admin status
        const { error: adminError } = await supabase
          .from('users')
          .update({ 
            is_admin: value !== undefined ? value : !(await supabase
              .from('users')
              .select('is_admin')
              .eq('id', userId)
              .single()
            ).data?.is_admin
          })
          .eq('id', userId)

        if (adminError) {
          console.error('Error toggling user admin status:', adminError)
          return NextResponse.json({ error: 'Failed to update admin status' }, { status: 500 })
        }
        break

      case 'delete_user':
        // Delete user and all related data
        const { error: deleteError } = await supabase
          .from('users')
          .delete()
          .eq('id', userId)

        if (deleteError) {
          console.error('Error deleting user:', deleteError)
          return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
        }
        break

      case 'reset_password':
        // This would typically send a password reset email
        // For now, we'll just log it
        console.log(`Password reset requested for user ${userId}`)
        break

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error in POST /api/admin/users:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}