import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { createAdminSupabaseClient } from './supabase'

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-change-in-production'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '30m'
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d'

// Build-time safe environment variable check
if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
  // Only log warnings in production, don't throw errors
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'fallback-secret-key-change-in-production') {
    console.warn('  JWT_SECRET environment variable is not set. Authentication will not work.')
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('  SUPABASE_SERVICE_ROLE_KEY environment variable is not set. Database operations will fail.')
  }
}

// JWT_SECRET validation function (called at runtime)
function validateJWTSecret(): string {
  if (!JWT_SECRET || JWT_SECRET === 'fallback-secret-key-change-in-production') {
    throw new Error('JWT_SECRET environment variable must be set in production')
  }
  return JWT_SECRET
}

// Session Configuration
const SESSION_TIMEOUT_MINUTES = parseInt(process.env.SESSION_TIMEOUT_MINUTES || '30')

export interface JWTPayload {
  userId: string
  email: string
  isAdmin: boolean
  sessionId: string
  iat: number
  exp: number
}

export interface UserSession {
  id: string
  user_id: string
  session_token: string
  expires_at: Date
  last_activity_at: Date
  ip_address?: string
  user_agent?: string
}

export interface AuthUser {
  id: string
  email: string
  first_name?: string
  last_name?: string
  company_name?: string
  company_size?: string
  phone?: string
  is_admin: boolean
  email_verified_at?: Date
  is_active: boolean
  password_hash?: string
  last_login_at?: Date
  created_at?: Date
  updated_at?: Date
}

// Password hashing utilities
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12
  return bcrypt.hash(password, saltRounds)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

// JWT token utilities
export function generateAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  const now = Math.floor(Date.now() / 1000)
  const exp = now + (parseInt(JWT_EXPIRES_IN) * 60) // Convert minutes to seconds
  const tokenPayload = { ...payload, iat: now, exp }
  return jwt.sign(tokenPayload, validateJWTSecret())
}

export function generateRefreshToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  const now = Math.floor(Date.now() / 1000)
  const exp = now + (parseInt(JWT_REFRESH_EXPIRES_IN) * 24 * 60 * 60) // Convert days to seconds
  const tokenPayload = { ...payload, iat: now, exp }
  return jwt.sign(tokenPayload, validateJWTSecret())
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, validateJWTSecret()) as JWTPayload
    return decoded
  } catch (error) {
    return null
  }
}

// Session management utilities
export async function createUserSession(
  userId: string, 
  sessionToken: string, 
  ipAddress?: string, 
  userAgent?: string
): Promise<void> {
  const supabase = createAdminSupabaseClient()
  const expiresAt = new Date()
  expiresAt.setMinutes(expiresAt.getMinutes() + SESSION_TIMEOUT_MINUTES)

  const { error } = await supabase
    .from('user_sessions')
    .insert({
      user_id: userId,
      session_token: sessionToken,
      expires_at: expiresAt.toISOString(),
      last_activity_at: new Date().toISOString(),
      ip_address: ipAddress,
      user_agent: userAgent
    })

  if (error) {
    throw new Error(`Failed to create user session: ${error.message}`)
  }
}

export async function validateUserSession(sessionToken: string): Promise<UserSession | null> {
  const supabase = createAdminSupabaseClient()
  
  const { data, error } = await supabase
    .from('user_sessions')
    .select('*')
    .eq('session_token', sessionToken)
          .gt('expires_at', new Date().toISOString())
    .single()

  if (error || !data) {
    return null
  }

  // Update last activity
  await supabase
    .from('user_sessions')
    .update({ last_activity_at: new Date().toISOString() })
    .eq('id', data.id)

  return data
}

export async function deleteUserSession(sessionToken: string): Promise<void> {
  const supabase = createAdminSupabaseClient()
  
  const { error } = await supabase
    .from('user_sessions')
    .delete()
    .eq('session_token', sessionToken)

  if (error) {
    throw new Error(`Failed to delete user session: ${error.message}`)
  }
}

export async function cleanupExpiredSessions(): Promise<void> {
  const supabase = createAdminSupabaseClient()
  
  const { error } = await supabase
    .from('user_sessions')
    .delete()
    .lt('expires_at', new Date().toISOString())

  if (error) {
    console.error('Failed to cleanup expired sessions:', error)
  }
}

// User utilities
export async function getUserById(userId: string): Promise<AuthUser | null> {
  const supabase = createAdminSupabaseClient()
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .eq('is_active', true)
    .single()

  if (error || !data) {
    return null
  }

  return data
}

export async function getUserByEmail(email: string): Promise<AuthUser | null> {
  const supabase = createAdminSupabaseClient()
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .eq('is_active', true)
    .single()

  if (error || !data) {
    return null
  }

  return data
}

// Password validation
export function validatePassword(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  const minLength = parseInt(process.env.PASSWORD_MIN_LENGTH || '8')
  const requireUppercase = process.env.PASSWORD_REQUIRE_UPPERCASE === 'true'
  const requireLowercase = process.env.PASSWORD_REQUIRE_LOWERCASE === 'true'
  const requireNumbers = process.env.PASSWORD_REQUIRE_NUMBERS === 'true'
  const requireSpecialChars = process.env.PASSWORD_REQUIRE_SPECIAL_CHARS === 'true'

  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters long`)
  }

  if (requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }

  if (requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }

  if (requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number')
  }

  if (requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// Email validation
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Rate limiting utilities (basic implementation)
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>()
const MAX_LOGIN_ATTEMPTS = parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5')
const LOGIN_ATTEMPT_TIMEOUT = parseInt(process.env.LOGIN_ATTEMPT_TIMEOUT_MINUTES || '15') * 60 * 1000

export function checkRateLimit(email: string): { allowed: boolean; remainingAttempts: number; timeUntilReset: number } {
  const now = Date.now()
  const attempts = loginAttempts.get(email)

  if (!attempts) {
    return { allowed: true, remainingAttempts: MAX_LOGIN_ATTEMPTS, timeUntilReset: 0 }
  }

  // Reset if timeout has passed
  if (now - attempts.lastAttempt > LOGIN_ATTEMPT_TIMEOUT) {
    loginAttempts.delete(email)
    return { allowed: true, remainingAttempts: MAX_LOGIN_ATTEMPTS, timeUntilReset: 0 }
  }

  const remainingAttempts = Math.max(0, MAX_LOGIN_ATTEMPTS - attempts.count)
  const timeUntilReset = LOGIN_ATTEMPT_TIMEOUT - (now - attempts.lastAttempt)

  return {
    allowed: remainingAttempts > 0,
    remainingAttempts,
    timeUntilReset
  }
}

export function recordLoginAttempt(email: string): void {
  const attempts = loginAttempts.get(email) || { count: 0, lastAttempt: 0 }
  attempts.count += 1
  attempts.lastAttempt = Date.now()
  loginAttempts.set(email, attempts)
}

export function clearLoginAttempts(email: string): void {
  loginAttempts.delete(email)
}
