import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase'
import { 
  verifyPassword, 
  generateAccessToken, 
  generateRefreshToken,
  createUserSession,
  getUserByEmail,
  checkRateLimit,
  recordLoginAttempt,
  clearLoginAttempts
} from '@/lib/auth'
import { getClientIP, getUserAgent } from '@/lib/auth-middleware'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, rememberMe = false } = body

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields', message: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Check rate limiting
    const rateLimit = checkRateLimit(email)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          error: 'Rate limited', 
          message: `Too many login attempts. Try again in ${Math.ceil(rateLimit.timeUntilReset / 60000)} minutes`,
          remainingAttempts: rateLimit.remainingAttempts,
          timeUntilReset: rateLimit.timeUntilReset
        },
        { status: 429 }
      )
    }

    // Get user from database
    const user = await getUserByEmail(email)
    if (!user) {
      recordLoginAttempt(email)
      return NextResponse.json(
        { error: 'Invalid credentials', message: 'Email or password is incorrect' },
        { status: 401 }
      )
    }

    // Check if user is active
    if (!user.is_active) {
      recordLoginAttempt(email)
      return NextResponse.json(
        { error: 'Account disabled', message: 'Your account has been disabled. Please contact support.' },
        { status: 401 }
      )
    }

    // Check if email is verified (optional for now, can be made required later)
    if (!user.email_verified_at) {
      return NextResponse.json(
        { 
          error: 'Email not verified', 
          message: 'Please verify your email address before logging in',
          requiresVerification: true
        },
        { status: 401 }
      )
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password_hash || '')
    if (!isValidPassword) {
      recordLoginAttempt(email)
      return NextResponse.json(
        { error: 'Invalid credentials', message: 'Email or password is incorrect' },
        { status: 401 }
      )
    }

    // Clear login attempts on successful login
    clearLoginAttempts(email)

    // Generate session token
    const sessionToken = crypto.randomUUID()
    const sessionId = crypto.randomUUID()

    // Create user session in database
    const clientIP = getClientIP(request)
    const userAgent = getUserAgent(request)
    
    await createUserSession(user.id, sessionToken, clientIP, userAgent)

    // Generate JWT tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      isAdmin: user.is_admin,
      sessionId: sessionId
    })

    const refreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email,
      isAdmin: user.is_admin,
      sessionId: sessionId
    })

    // Update last login time
    const supabase = createAdminSupabaseClient()
    await supabase
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', user.id)

    // Set cookies for session management
    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        companyName: user.company_name,
        companySize: user.company_size,
        phone: user.phone,
        isAdmin: user.is_admin,
        emailVerified: !!user.email_verified_at
      },
      session: {
        expiresIn: rememberMe ? '7 days' : '30 minutes',
        sessionId: sessionId
      }
    })

    // Set secure cookies (making httpOnly false for debugging)
    const cookieOptions = {
      httpOnly: false, // Changed to false so JavaScript can read them
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      domain: process.env.NODE_ENV === 'production' ? '.prop-shop.ai' : undefined
    }

    // Access token cookie (short-lived)
    response.cookies.set('access_token', accessToken, {
      ...cookieOptions,
      maxAge: rememberMe ? 7 * 24 * 60 * 60 : 30 * 60 // 7 days or 30 minutes
    })

    // Refresh token cookie (longer-lived)
    response.cookies.set('refresh_token', refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 // 7 days
    })

    // Session token cookie
    response.cookies.set('session_token', sessionToken, {
      ...cookieOptions,
      maxAge: rememberMe ? 7 * 24 * 60 * 60 : 30 * 60 // 7 days or 30 minutes
    })

    // Add a readable auth status cookie for frontend
    response.cookies.set('auth_status', 'authenticated', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      domain: process.env.NODE_ENV === 'production' ? '.prop-shop.ai' : undefined,
      maxAge: rememberMe ? 7 * 24 * 60 * 60 : 30 * 60 // 7 days or 30 minutes
    })

    return response

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: 'An unexpected error occurred during login' },
      { status: 500 }
    )
  }
}
