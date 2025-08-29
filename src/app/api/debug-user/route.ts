import { NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json({ 
        success: false, 
        message: 'Email is required' 
      }, { status: 400 })
    }

    const supabase = createAdminSupabaseClient()
    
    // Get user details
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()
    
    if (userError) {
      return NextResponse.json({ 
        success: false, 
        message: 'User not found',
        error: userError.message
      }, { status: 404 })
    }

    // Get email verification details
    const { data: verifications, error: verError } = await supabase
      .from('email_verifications')
      .select('*')
      .eq('email', email)
      .order('created_at', { ascending: false })

    // Get any password resets
    const { data: resets, error: resetError } = await supabase
      .from('password_resets')
      .select('*')
      .eq('email', email)
      .order('created_at', { ascending: false })

    // Get any sessions
    const { data: sessions, error: sessionError } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('user_email', email)
      .order('created_at', { ascending: false })

    return NextResponse.json({
      success: true,
      user: {
        ...user,
        password: '[HIDDEN]' // Don't expose password hash
      },
      emailVerifications: verifications || [],
      passwordResets: resets || [],
      sessions: sessions || [],
      verificationCount: verifications?.length || 0,
      resetCount: resets?.length || 0,
      sessionCount: sessions?.length || 0
    })

  } catch (error) {
    console.error('Debug user error:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({
      success: false,
      message: 'Failed to debug user',
      error: errorMessage
    }, { status: 500 })
  }
}
