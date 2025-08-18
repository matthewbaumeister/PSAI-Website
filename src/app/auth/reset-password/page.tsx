'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')
  const [isValidToken, setIsValidToken] = useState(false)

  useEffect(() => {
    // Check if we have the necessary parameters
    const token = searchParams.get('token')
    const type = searchParams.get('type')
    
    if (!token || type !== 'recovery') {
      setMessage('Invalid or expired password reset link. Please request a new one.')
      setMessageType('error')
      setIsValidToken(false)
    } else {
      setIsValidToken(true)
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isValidToken) {
      setMessage('Invalid reset link. Please request a new password reset.')
      setMessageType('error')
      return
    }

    if (password !== confirmPassword) {
      setMessage('Passwords do not match')
      setMessageType('error')
      return
    }

    if (password.length < 8) {
      setMessage('Password must be at least 8 characters long')
      setMessageType('error')
      return
    }

    setIsLoading(true)
    setMessage('')

    try {
      const token = searchParams.get('token')
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) {
        setMessage(error.message)
        setMessageType('error')
      } else {
        setMessage('Password updated successfully! Redirecting to sign in...')
        setMessageType('success')
        setTimeout(() => {
          router.push('/auth/signin')
        }, 2000)
      }
    } catch (error) {
      console.error('Password reset error:', error)
      setMessage('An unexpected error occurred. Please try again.')
      setMessageType('error')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isValidToken) {
    return (
      <div className="page-content" style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0B1220 0%, #1E293B 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem'
      }}>
        <div style={{ 
          maxWidth: '500px', 
          width: '100%',
          textAlign: 'center'
        }}>
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '1rem',
            padding: '2rem',
            marginBottom: '2rem'
          }}>
            <h1 style={{
              fontSize: '2rem',
              fontWeight: 600,
              color: '#FCA5A5',
              marginBottom: '1rem'
            }}>
              Invalid Reset Link
            </h1>
            <p style={{
              fontSize: '1rem',
              color: '#FCA5A5',
              marginBottom: '1.5rem',
              lineHeight: '1.5'
            }}>
              {message}
            </p>
            <Link href="/auth/forgot-password" style={{
              padding: '0.75rem 1.5rem',
              background: '#DC2626',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '0.5rem',
              fontWeight: 600,
              fontSize: '0.875rem',
              transition: 'background-color 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#B91C1C'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#DC2626'}
            >
              Request New Reset Link
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-content" style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0B1220 0%, #1E293B 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem'
    }}>
      {/* Background Flare */}
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '800px',
        height: '800px',
        background: 'radial-gradient(circle, rgba(154, 242, 58, 0.1) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      <div style={{ 
        position: 'relative', 
        zIndex: 1, 
        maxWidth: '500px', 
        width: '100%' 
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-block',
            padding: '0.5rem 1rem',
            background: 'rgba(154, 242, 58, 0.1)',
            border: '1px solid rgba(154, 242, 58, 0.3)',
            borderRadius: '2rem',
            marginBottom: '1rem'
          }}>
            <span style={{ color: '#9AF23A', fontSize: '0.875rem', fontWeight: 600 }}>
              RESET PASSWORD
            </span>
          </div>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: 700,
            color: 'white',
            marginBottom: '1rem',
            lineHeight: '1.2'
          }}>
            Set New Password
          </h1>
          <p style={{
            fontSize: '1.125rem',
            color: '#9CA3AF',
            lineHeight: '1.6'
          }}>
            Enter your new password below. Make sure it&apos;s secure and memorable.
          </p>
        </div>

        {/* Form Card */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '1rem',
          padding: '2rem',
          backdropFilter: 'blur(10px)'
        }}>
          <form onSubmit={handleSubmit}>
            {/* Password Field */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: '#9CA3AF'
              }}>
                New Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your new password"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '0.5rem',
                  color: 'white',
                  fontSize: '0.875rem',
                  transition: 'border-color 0.2s ease'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'rgba(154, 242, 58, 0.5)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                }}
                disabled={isLoading}
                minLength={8}
              />
              <p style={{
                fontSize: '0.75rem',
                color: '#6B7280',
                marginTop: '0.25rem'
              }}>
                Must be at least 8 characters long
              </p>
            </div>

            {/* Confirm Password Field */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: '#9CA3AF'
              }}>
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your new password"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '0.5rem',
                  color: 'white',
                  fontSize: '0.875rem',
                  transition: 'border-color 0.2s ease'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'rgba(154, 242, 58, 0.5)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                }}
                disabled={isLoading}
                minLength={8}
              />
            </div>

            {/* Message Display */}
            {message && (
              <div style={{
                padding: '0.75rem',
                background: messageType === 'success' 
                  ? 'rgba(34, 197, 94, 0.1)' 
                  : 'rgba(239, 68, 68, 0.1)',
                border: `1px solid ${messageType === 'success' 
                  ? 'rgba(34, 197, 94, 0.3)' 
                  : 'rgba(239, 68, 68, 0.3)'}`,
                borderRadius: '0.5rem',
                color: messageType === 'success' ? '#86EFAC' : '#FCA5A5',
                marginBottom: '1.5rem',
                fontSize: '0.875rem',
                textAlign: 'center'
              }}>
                {message}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: isLoading 
                  ? 'rgba(107, 114, 128, 0.5)' 
                  : 'linear-gradient(135deg, #2D5BFF, #9AF23A)',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                marginBottom: '1.5rem'
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.transform = 'translateY(0)'
                }
              }}
            >
              {isLoading ? 'Updating Password...' : 'Update Password'}
            </button>

            {/* Back to Sign In */}
            <div style={{ textAlign: 'center' }}>
              <Link href="/auth/signin" style={{
                color: '#9AF23A',
                textDecoration: 'none',
                fontSize: '0.875rem',
                fontWeight: 500,
                transition: 'color 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#7DD3FC'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#9AF23A'}
              >
                ← Back to Sign In
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="page-content" style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0B1220 0%, #1E293B 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '1rem',
          padding: '2rem',
          maxWidth: '500px',
          width: '100%',
          textAlign: 'center'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '3px solid rgba(154, 242, 58, 0.3)',
            borderTop: '3px solid #9AF23A',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <h1 style={{
            color: 'white',
            fontSize: '1.5rem',
            fontWeight: 700,
            marginBottom: '0.5rem'
          }}>
            Loading...
          </h1>
          <p style={{
            color: '#9CA3AF',
            fontSize: '0.875rem'
          }}>
            Preparing password reset page...
          </p>
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  )
}
