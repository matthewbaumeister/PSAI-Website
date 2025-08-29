import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      token, 
      firstName, 
      lastName, 
      password, 
      companyName, 
      companySize, 
      phone 
    } = body

    if (!token || !firstName || !lastName || !password || !companyName || !companySize) {
      return NextResponse.json(
        { error: 'Missing required fields', message: 'All required fields must be provided' },
        { status: 400 }
      )
    }

    const supabase = createAdminSupabaseClient()
    
    // Validate invitation
    const { data: invitation, error: invitationError } = await supabase
      .from('admin_invitations')
      .select('*')
      .eq('invitation_token', token)
      .eq('status', 'pending')
      .single()

    if (invitationError || !invitation) {
      return NextResponse.json(
        { error: 'Invalid invitation', message: 'Invitation is invalid or no longer pending' },
        { status: 400 }
      )
    }

    // Check if invitation is expired
    const expiresAt = new Date(invitation.expires_at)
    if (expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Expired invitation', message: 'Invitation has expired' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', invitation.email)
      .single()

    if (userError && userError.code !== 'PGRST116') {
      console.error('Error checking existing user:', userError)
      return NextResponse.json(
        { error: 'Database error', message: 'Failed to check existing user' },
        { status: 500 }
      )
    }

    if (existingUser) {
      return NextResponse.json(
        { error: 'User exists', message: 'A user with this email already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user account
    const { data: user, error: createUserError } = await supabase
      .from('users')
      .insert({
        email: invitation.email,
        first_name: firstName,
        last_name: lastName,
        password_hash: hashedPassword,
        company_name: companyName,
        company_size: companySize,
        phone: phone || null,
        is_admin: true,
        is_active: true,
        email_verified_at: new Date().toISOString() // Admin accounts are pre-verified
      })
      .select('*')
      .single()

    if (createUserError) {
      console.error('Error creating user:', createUserError)
      return NextResponse.json(
        { error: 'User creation failed', message: 'Failed to create user account' },
        { status: 500 }
      )
    }

    // Create user settings
    const { error: settingsError } = await supabase
      .from('user_settings')
      .insert({
        user_id: user.id,
        setting_key: 'email_notifications',
        setting_value: 'true',
        setting_type: 'boolean'
      })

    if (settingsError) {
      console.error('Failed to create user settings:', settingsError)
      // Don't fail the account creation if settings fail, just log it
    }

    // Mark invitation as accepted
    const { error: updateInvitationError } = await supabase
      .from('admin_invitations')
      .update({ 
        status: 'accepted',
        accepted_at: new Date().toISOString()
      })
      .eq('id', invitation.id)

    if (updateInvitationError) {
      console.error('Failed to update invitation status:', updateInvitationError)
      // Don't fail the account creation if invitation update fails, just log it
    }

    return NextResponse.json({
      success: true,
      message: 'Admin account created successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        isAdmin: user.is_admin
      }
    })

  } catch (error) {
    console.error('Accept invitation error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
