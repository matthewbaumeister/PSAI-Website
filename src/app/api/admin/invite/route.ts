import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase'
import { requireAdmin } from '@/lib/auth-middleware'
import { sendAdminInvitationEmail } from '@/lib/email'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    // Check if user is admin
    const authResult = await requireAdmin(request)
    if (!authResult.success) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Admin access required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Missing email', message: 'Email address is required' },
        { status: 400 }
      )
    }

    const supabase = createAdminSupabaseClient()

    // Check if user already exists
    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('id, email, is_admin')
      .eq('email', email.toLowerCase().trim())
      .single()

    if (userError && userError.code !== 'PGRST116') {
      console.error('Error checking existing user:', userError)
      return NextResponse.json(
        { error: 'Database error', message: 'Failed to check existing user' },
        { status: 500 }
      )
    }

    if (existingUser) {
      if (existingUser.is_admin) {
        return NextResponse.json(
          { error: 'User already admin', message: 'This user is already an admin' },
          { status: 400 }
        )
      } else {
        return NextResponse.json(
          { error: 'User exists', message: 'User exists but is not an admin. You can promote them directly.' },
          { status: 400 }
        )
      }
    }

    // Check if invitation already exists
    const { data: existingInvitation, error: invitationError } = await supabase
      .from('admin_invitations')
      .select('id, status')
      .eq('email', email.toLowerCase().trim())
      .eq('status', 'pending')
      .single()

    if (invitationError && invitationError.code !== 'PGRST116') {
      console.error('Error checking existing invitation:', invitationError)
      return NextResponse.json(
        { error: 'Database error', message: 'Failed to check existing invitation' },
        { status: 500 }
      )
    }

    if (existingInvitation) {
      return NextResponse.json(
        { error: 'Invitation exists', message: 'An admin invitation is already pending for this email' },
        { status: 400 }
      )
    }

    // Create invitation token
    const invitationToken = crypto.randomUUID()
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 72) // 72 hour expiration

    // Create invitation record
    const { data: invitation, error: createError } = await supabase
      .from('admin_invitations')
      .insert({
        email: email.toLowerCase().trim(),
        invitation_token: invitationToken,
        invited_by: authResult.user.email,
        expires_at: expiresAt.toISOString(),
        status: 'pending'
      })
      .select('*')
      .single()

    if (createError) {
      console.error('Error creating invitation:', createError)
      return NextResponse.json(
        { error: 'Invitation creation failed', message: 'Failed to create admin invitation' },
        { status: 500 }
      )
    }

    // Send invitation email
    try {
      const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://prop-shop.ai'}/admin/accept-invitation?token=${invitationToken}`
      
      const emailSent = await sendAdminInvitationEmail({
        email: invitation.email,
        invitedBy: authResult.user.email,
        invitationUrl
      })

      if (!emailSent) {
        console.error('Failed to send admin invitation email to', invitation.email)
        // Delete the invitation if email fails
        await supabase
          .from('admin_invitations')
          .delete()
          .eq('id', invitation.id)
        
        return NextResponse.json(
          { error: 'Email sending failed', message: 'Failed to send admin invitation email. Please try again later.' },
          { status: 500 }
        )
      }

      console.log('Admin invitation email sent successfully to', invitation.email)
    } catch (emailError) {
      console.error('Error sending admin invitation email:', emailError)
      // Delete the invitation if email fails
      await supabase
        .from('admin_invitations')
        .delete()
        .eq('id', invitation.id)
      
      return NextResponse.json(
        { error: 'Email sending failed', message: 'Failed to send admin invitation email. Please try again later.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Admin invitation sent successfully',
      invitation: {
        id: invitation.id,
        email: invitation.email,
        expiresAt: invitation.expires_at,
        status: invitation.status
      }
    })

  } catch (error) {
    console.error('Admin invitation error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
