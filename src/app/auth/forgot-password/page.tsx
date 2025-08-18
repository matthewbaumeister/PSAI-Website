'use client'

import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      setMessage('Please enter your email address')
      setMessageType('error')
      return
    }

    setIsLoading(true)
    setMessage('')

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })

      if (error) {
        setMessage(error.message)
        setMessageType('error')
      } else {
        setMessage('Password reset link sent! Check your email for instructions.')
        setMessageType('success')
        setEmail('')
      }
    } catch (error) {
      console.error('Password reset error:', error)
      setMessage('An unexpected error occurred. Please try again.')
      setMessageType('error')
    } finally {
      setIsLoading(false)
    }
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
              PASSWORD RESET
            </span>
          </div>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: 700,
            color: 'white',
            marginBottom: '1rem',
            lineHeight: '1.2'
          }}>
            Forgot Your Password?
          </h1>
          <p style={{
            fontSize: '1.125rem',
            color: '#9CA3AF',
            lineHeight: '1.6'
          }}>
            No worries! Enter your email address and we&apos;ll send you a link to reset your password.
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
            {/* Email Field */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: '#9CA3AF'
              }}>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
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
              {isLoading ? 'Sending Reset Link...' : 'Send Reset Link'}
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

        {/* Additional Help */}
        <div style={{
          textAlign: 'center',
          marginTop: '2rem',
          padding: '1.5rem',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '0.75rem'
        }}>
          <h3 style={{
            fontSize: '1rem',
            fontWeight: 600,
            color: 'white',
            marginBottom: '0.75rem'
          }}>
            Need Help?
          </h3>
          <p style={{
            fontSize: '0.875rem',
            color: '#9CA3AF',
            marginBottom: '1rem',
            lineHeight: '1.5'
          }}>
            If you&apos;re still having trouble, contact our support team.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/contact" style={{
              padding: '0.5rem 1rem',
              background: 'rgba(154, 242, 58, 0.1)',
              border: '1px solid rgba(154, 242, 58, 0.3)',
              borderRadius: '0.5rem',
              color: '#9AF23A',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: 500,
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(154, 242, 58, 0.2)'
              e.currentTarget.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(154, 242, 58, 0.1)'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
            >
              Contact Support
            </Link>
            <Link href="/auth/signup" style={{
              padding: '0.5rem 1rem',
              background: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '0.5rem',
              color: '#9CA3AF',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: 500,
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
              e.currentTarget.style.color = 'white'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = '#9CA3AF'
            }}
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
