import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('Testing Supabase connection...')
    const supabase = createAdminSupabaseClient()
    
    // Test basic connection
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('count')
      .limit(1)
    
    console.log('Supabase test result:', { testData, testError })
    
    if (testError) {
      return NextResponse.json({
        success: false,
        error: testError.message,
        details: testError
      })
    }
    
    // Test actual user data
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, company_name, is_active, is_admin, created_at')
      .limit(5)
    
    console.log('Users query result:', { users, usersError })
    
    return NextResponse.json({
      success: true,
      testData,
      users: users || [],
      usersError: usersError?.message || null,
      message: 'Supabase connection successful'
    })
    
  } catch (error) {
    console.error('Supabase test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 })
  }
}
