import { NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase'

export async function GET() {
  try {
    const supabase = createAdminSupabaseClient()
    
    // Test basic connection
    const { data: connectionTest, error: connectionError } = await supabase
      .from('users')
      .select('count')
      .limit(1)
    
    if (connectionError) {
      throw connectionError
    }

    // Test table existence
    const tables = [
      'users',
      'user_sessions', 
      'email_verifications',
      'password_resets',
      'admin_invitations',
      'user_settings'
    ]

    const tableResults = {}
    
    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })
        
        if (error) {
          tableResults[table] = { exists: false, error: error.message }
        } else {
          tableResults[table] = { exists: true, count: count || 0 }
        }
      } catch (err) {
        tableResults[table] = { exists: false, error: err.message }
      }
    }

    // Test admin user
    const { data: adminUser, error: adminError } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, is_admin, email_verified_at')
      .eq('email', 'admin@propshop.ai')
      .single()

    // Test RLS policies
    const { data: rlsStatus, error: rlsError } = await supabase
      .rpc('get_rls_status', {})
      .catch(() => ({ data: null, error: 'RPC function not available' }))

    return NextResponse.json({
      success: true,
      message: 'Database connection test completed',
      timestamp: new Date().toISOString(),
      connection: {
        status: 'connected',
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'configured' : 'missing',
        serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'configured' : 'missing'
      },
      tables: tableResults,
      adminUser: adminUser || { error: adminError?.message },
      rlsStatus: rlsStatus || { error: rlsError?.message },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
      }
    })

  } catch (error) {
    console.error('Database test error:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Database connection test failed',
      error: error.message,
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
      }
    }, { status: 500 })
  }
}
