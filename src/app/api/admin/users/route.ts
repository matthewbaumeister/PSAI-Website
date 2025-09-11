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
    if (!user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Get all users with their settings
    const supabase = createAdminSupabaseClient()
    
    // Try to get real users first
    let realUsers = null
    try {
      console.log('Attempting to fetch from users table...')
      // Try to get users from a custom users table first
      const { data: customUsers, error: customError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
      
      console.log('Users table query result:', { customUsers, customError })
      
      if (!customError && customUsers) {
        realUsers = customUsers
        console.log('Found users in custom users table:', customUsers.length)
      } else {
        console.log('Error fetching from users table:', customError)
      }
    } catch (error) {
      console.log('Exception fetching from users table:', error)
    }

    // If no custom users table, try auth.users
    if (!realUsers) {
      try {
        const { data: authUsers, error: authError } = await supabase
          .from('auth.users')
          .select('*')
          .order('created_at', { ascending: false })
        
        if (!authError && authUsers) {
          realUsers = authUsers
          console.log('Found users in auth.users table:', authUsers.length)
        }
      } catch (error) {
        console.log('auth.users table not accessible')
      }
    }

    // Always use real data - no mock data fallback
    if (!realUsers || realUsers.length === 0) {
      console.log('No users found in database')
      return NextResponse.json({ 
        users: [],
        total: 0,
        isRealData: true,
        message: 'No users found in database'
      })
    }

    console.log('Processing real users:', realUsers.length)
    console.log('First user sample:', JSON.stringify(realUsers[0], null, 2))
    
    const transformedUsers = realUsers.map(user => ({
      id: user.id,
      email: user.email || '',
      first_name: user.first_name || null,
      last_name: user.last_name || null,
      company_name: user.company_name || null,
      company_size: user.company_size || null,
      phone: user.phone || null,
      email_verified_at: user.email_verified_at || null,
      created_at: user.created_at,
      updated_at: user.updated_at || user.created_at,
      last_login_at: user.last_login_at || null,
      is_active: user.is_active !== false,
      is_admin: user.is_admin || false,
      two_factor_enabled: user.two_factor_enabled || false,
      session_timeout_minutes: user.session_timeout_minutes || 30,
      settings: {
        newsletter_subscription: user.newsletter_subscription || false,
        research_alerts: user.research_alerts || false
      },
      session_count: 0
    }))

    // Try to get user settings from user_settings table if it exists
    try {
      const userIds = transformedUsers.map(user => user.id)
      const { data: settings, error: settingsError } = await supabase
        .from('user_settings')
        .select('user_id, setting_key, setting_value')
        .in('user_id', userIds)

      if (!settingsError && settings) {
        // Merge settings into user objects
        transformedUsers.forEach(user => {
          const userSettings = settings.filter(s => s.user_id === user.id)
          const settingsObj = userSettings.reduce((acc, setting) => {
            acc[setting.setting_key] = setting.setting_value === 'true'
            return acc
          }, {} as Record<string, boolean>)
          
          if (Object.keys(settingsObj).length > 0) {
            user.settings = { ...user.settings, ...settingsObj }
          }
        })
      }
    } catch (error) {
      console.log('user_settings table not found, using default settings')
    }

    // Try to get session counts if user_sessions table exists
    try {
      const userIds = transformedUsers.map(user => user.id)
      const { data: sessions, error: sessionsError } = await supabase
        .from('user_sessions')
        .select('user_id')
        .in('user_id', userIds)

      if (!sessionsError && sessions) {
        transformedUsers.forEach(user => {
          user.session_count = sessions.filter(s => s.user_id === user.id).length
        })
      }
    } catch (error) {
      console.log('user_sessions table not found, using default session count')
    }

    console.log('Transformed users:', transformedUsers.length)
    console.log('First transformed user:', JSON.stringify(transformedUsers[0], null, 2))

    return NextResponse.json({ 
      users: transformedUsers,
      total: transformedUsers.length,
      isRealData: true
    })

  } catch (error) {
    console.error('Error in GET /api/admin/users:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      users: [],
      total: 0,
      isRealData: true
    }, { status: 500 })
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
    if (!user.isAdmin) {
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
        // Toggle user active status using Supabase auth admin
        const { error: toggleError } = await supabase.auth.admin.updateUserById(userId, {
          ban_duration: value === false ? '876000h' : 'none' // 100 years for ban, none for unban
        })

        if (toggleError) {
          console.error('Error toggling user active status:', toggleError)
          return NextResponse.json({ error: 'Failed to update user status' }, { status: 500 })
        }
        break

      case 'toggle_admin':
        // Toggle user admin status by updating user metadata
        const { data: currentUser } = await supabase.auth.admin.getUserById(userId)
        if (currentUser.user) {
          const newAdminStatus = value !== undefined ? value : !currentUser.user.user_metadata?.is_admin
          const { error: adminError } = await supabase.auth.admin.updateUserById(userId, {
            user_metadata: {
              ...currentUser.user.user_metadata,
              is_admin: newAdminStatus
            }
          })

          if (adminError) {
            console.error('Error toggling user admin status:', adminError)
            return NextResponse.json({ error: 'Failed to update admin status' }, { status: 500 })
          }
        }
        break

      case 'delete_user':
        // Delete user using Supabase auth admin
        const { error: deleteError } = await supabase.auth.admin.deleteUser(userId)

        if (deleteError) {
          console.error('Error deleting user:', deleteError)
          return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
        }
        break

      case 'reset_password':
        // Send password reset email using Supabase auth
        const { error: resetError } = await supabase.auth.admin.generateLink({
          type: 'recovery',
          email: (await supabase.auth.admin.getUserById(userId)).data.user?.email || ''
        })

        if (resetError) {
          console.error('Error sending password reset:', resetError)
          return NextResponse.json({ error: 'Failed to send password reset' }, { status: 500 })
        }
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