import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, validateUserSession, getUserById } from './auth'

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string
    email: string
    isAdmin: boolean
    sessionId: string
  }
}

export async function authenticateRequest(
  request: NextRequest
): Promise<{ user: any; error: null } | { user: null; error: string }> {
  try {
    // Debug: Log all cookies
    console.log('🔍 Auth Middleware - All cookies:', request.cookies.getAll())
    
    // Try to get token from cookies first
    let token = request.cookies.get('access_token')?.value
    console.log('🔍 Auth Middleware - access_token cookie:', token ? 'EXISTS' : 'MISSING')
    
    // Fall back to authorization header if no cookie
    if (!token) {
      const authHeader = request.headers.get('authorization')
      console.log('🔍 Auth Middleware - Authorization header:', authHeader || 'MISSING')
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return { user: null, error: 'No authorization token provided' }
      }
      token = authHeader.substring(7) // Remove 'Bearer ' prefix
    }

    // Verify JWT token
    console.log('🔍 Auth Middleware - Token to verify:', token ? `${token.substring(0, 20)}...` : 'NULL')
    const payload = verifyToken(token)
    console.log('🔍 Auth Middleware - Token verification result:', payload ? 'SUCCESS' : 'FAILED')
    if (!payload) {
      return { user: null, error: 'Invalid or expired token' }
    }

    // Get session token from cookies for database validation
    const sessionToken = request.cookies.get('session_token')?.value
    if (!sessionToken) {
      return { user: null, error: 'Session token missing' }
    }
    
    // Validate session in database using session token (not JWT token)
    const session = await validateUserSession(sessionToken)
    if (!session) {
      return { user: null, error: 'Session expired or invalid' }
    }

    // Verify user still exists and is active
    const user = await getUserById(payload.userId)
    if (!user) {
      return { user: null, error: 'User not found or inactive' }
    }

    return {
      user: {
        id: payload.userId,
        email: payload.email,
        isAdmin: payload.isAdmin,
        sessionId: payload.sessionId
      },
      error: null
    }
  } catch (error) {
    console.error('Authentication error:', error)
    return { user: null, error: 'Authentication failed' }
  }
}

export async function requireAuth(
  request: NextRequest
): Promise<NextResponse | { user: any }> {
  const authResult = await authenticateRequest(request)
  
  if (authResult.error) {
    return NextResponse.json(
      { error: 'Unauthorized', message: authResult.error },
      { status: 401 }
    )
  }

  return { user: authResult.user }
}

export async function requireAdmin(
  request: NextRequest
): Promise<NextResponse | { user: any }> {
  const authResult = await authenticateRequest(request)
  
  if (authResult.error) {
    return NextResponse.json(
      { error: 'Unauthorized', message: authResult.error },
      { status: 401 }
    )
  }

  if (!authResult.user.isAdmin) {
    return NextResponse.json(
      { error: 'Forbidden', message: 'Admin access required' },
      { status: 403 }
    )
  }

  return { user: authResult.user }
}

// Helper function to get client IP address
export function getClientIP(request: NextRequest): string | undefined {
  // Try to get IP from various headers (for different proxy setups)
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const cfConnectingIP = request.headers.get('cf-connecting-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIP) {
    return realIP
  }
  
  if (cfConnectingIP) {
    return cfConnectingIP
  }
  
  return undefined
}

// Helper function to get user agent
export function getUserAgent(request: NextRequest): string | undefined {
  return request.headers.get('user-agent') || undefined
}
