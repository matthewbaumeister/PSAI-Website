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
    
    // Try to get real users first
    let realUsers = null
    try {
      // Try to get users from a custom users table first
      const { data: customUsers, error: customError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (!customError && customUsers) {
        realUsers = customUsers
        console.log('Found users in custom users table:', customUsers.length)
      }
    } catch (error) {
      console.log('Custom users table not found, trying auth.users')
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

    // If we have real users, use them; otherwise use mock data
    if (realUsers && realUsers.length > 0) {
      const transformedUsers = realUsers.map(user => ({
        id: user.id,
        email: user.email || '',
        first_name: user.first_name || user.user_metadata?.first_name || null,
        last_name: user.last_name || user.user_metadata?.last_name || null,
        company_name: user.company_name || user.user_metadata?.company_name || null,
        company_size: user.company_size || user.user_metadata?.company_size || null,
        phone: user.phone || user.user_metadata?.phone || null,
        email_verified_at: user.email_verified_at || user.email_confirmed_at,
        created_at: user.created_at,
        updated_at: user.updated_at,
        last_login_at: user.last_login_at || user.last_sign_in_at,
        is_active: user.is_active !== false,
        is_admin: user.is_admin || user.user_metadata?.is_admin || false,
        two_factor_enabled: user.two_factor_enabled || false,
        session_timeout_minutes: user.session_timeout_minutes || 30,
        settings: {
          newsletter_subscription: user.newsletter_subscription || user.user_metadata?.newsletter_subscription || false,
          research_alerts: user.research_alerts || user.user_metadata?.research_alerts || false
        },
        session_count: 0
      }))

      return NextResponse.json({ 
        users: transformedUsers,
        total: transformedUsers.length,
        isRealData: true
      })
    }

    // Fallback to mock data
    console.log('Using mock user data - no real users found')
    const mockUsers = [
      {
        id: '1',
        email: 'admin@prop-shop.ai',
        first_name: 'Matt',
        last_name: 'Baumeister',
        company_name: 'Prop Shop AI',
        company_size: '1-10',
        phone: '+1-555-0123',
        email_verified_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_login_at: new Date().toISOString(),
        is_active: true,
        is_admin: true,
        two_factor_enabled: false,
        session_timeout_minutes: 30,
        settings: {
          newsletter_subscription: true,
          research_alerts: true
        },
        session_count: 1
      },
      {
        id: '2',
        email: 'user@example.com',
        first_name: 'John',
        last_name: 'Doe',
        company_name: 'Example Corp',
        company_size: '11-50',
        phone: '+1-555-0124',
        email_verified_at: new Date().toISOString(),
        created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        updated_at: new Date().toISOString(),
        last_login_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        is_active: true,
        is_admin: false,
        two_factor_enabled: false,
        session_timeout_minutes: 30,
        settings: {
          newsletter_subscription: true,
          research_alerts: false
        },
        session_count: 3
      }
    ]

    const transformedUsers = mockUsers

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

    return NextResponse.json({ 
      users: transformedUsers,
      total: transformedUsers.length,
      isMockData: true // Flag to indicate this is mock data
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