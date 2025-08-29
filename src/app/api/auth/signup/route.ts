import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase'
import { 
  hashPassword, 
  validatePassword, 
  validateEmail,
  getUserByEmail 
} from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      email, 
      password, 
      firstName, 
      lastName, 
      companyName, 
      companySize, 
      phone 
    } = body

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Missing required fields', message: 'Email, password, first name, and last name are required' },
        { status: 400 }
      )
    }

    // Validate email format
    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email format', message: 'Please provide a valid email address' },
        { status: 400 }
      )
    }

    // Validate password strength
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { 
          error: 'Password validation failed', 
          message: 'Password does not meet requirements',
          details: passwordValidation.errors
        },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await getUserByEmail(email)
    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists', message: 'A user with this email already exists' },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create user in database
    const supabase = createAdminSupabaseClient()
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        email: email.toLowerCase().trim(),
        password_hash: hashedPassword,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        company_name: companyName?.trim() || null,
        company_size: companySize?.trim() || null,
        phone: phone?.trim() || null,
        is_admin: false,
        is_active: true,
        email_verified_at: null // Will be verified via email
      })
      .select('id, email, first_name, last_name, company_name, company_size, phone, is_admin, created_at')
      .single()

    if (userError || !user) {
      console.error('Failed to create user:', userError)
      return NextResponse.json(
        { error: 'User creation failed', message: 'Failed to create user account' },
        { status: 500 }
      )
    }

    // Create default user settings
    const { error: settingsError } = await supabase
      .from('user_settings')
      .insert([
        {
          user_id: user.id,
          setting_key: 'theme',
          setting_value: 'light'
        },
        {
          user_id: user.id,
          setting_key: 'notifications_enabled',
          setting_value: 'true'
        }
      ])

    if (settingsError) {
      console.error('Failed to create user settings:', settingsError)
      // Don't fail the signup if settings fail, just log it
    }

    // Create verification token and send verification email
    const verificationToken = crypto.randomUUID()
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24) // 24 hour expiration

    // Create verification record in database
    const { error: verificationError } = await supabase
      .from('email_verifications')
      .insert({
        user_id: user.id,
        email: user.email,
        verification_token: verificationToken,
        expires_at: expiresAt.toISOString()
      })

    if (verificationError) {
      console.error('Failed to create email verification record:', verificationError)
      // Don't fail the signup if verification record fails, just log it
    }

    // Send verification email
    try {
      const { sendVerificationEmail } = await import('@/lib/email')
      
      const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://prop-shop.ai'}/auth/verify-email?token=${verificationToken}`
      
      const emailSent = await sendVerificationEmail({
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        verificationToken,
        verificationUrl
      })

      if (!emailSent) {
        console.error('Failed to send verification email to', user.email)
        // Don't fail the signup if email fails, just log it
      } else {
        console.log('Verification email sent successfully to', user.email)
      }
    } catch (emailError) {
      console.error('Error sending verification email:', emailError)
      // Don't fail the signup if email fails, just log it
    }

    // Return success response (without sensitive data)
    return NextResponse.json({
      success: true,
      message: 'User account created successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        companyName: user.company_name,
        companySize: user.company_size,
        phone: user.phone,
        isAdmin: user.is_admin,
        createdAt: user.created_at
      },
      nextSteps: [
        'Check your email for verification link',
        'Verify your email to activate your account',
        'Login after email verification'
      ]
    }, { status: 201 })

  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: 'An unexpected error occurred during signup' },
      { status: 500 }
    )
  }
}
