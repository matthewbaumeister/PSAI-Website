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
    
    // Delete the test user and related data
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('email', email)
    
    if (deleteError) {
      console.error('Error deleting user:', deleteError)
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to delete user',
        error: deleteError.message
      }, { status: 500 })
    }

    // Also clean up any related records
    await supabase
      .from('email_verifications')
      .delete()
      .eq('email', email)
    
    await supabase
      .from('password_resets')
      .delete()
      .eq('email', email)
    
    await supabase
      .from('user_sessions')
      .delete()
      .eq('user_email', email)

    return NextResponse.json({
      success: true,
      message: `Test user ${email} has been reset successfully. You can now create a new account.`
    })

  } catch (error) {
    console.error('Reset test user error:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({
      success: false,
      message: 'Failed to reset test user',
      error: errorMessage
    }, { status: 500 })
  }
}
