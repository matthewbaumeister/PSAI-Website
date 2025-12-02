'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await resetPassword(email)

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
    }
  }

  if (success) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: isDark ? '#111827' : '#F9FAFB',
        padding: '2rem'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '400px',
          background: isDark ? '#1F2937' : '#FFFFFF',
          borderRadius: '12px',
          padding: '2rem',
          textAlign: 'center',
          boxShadow: isDark 
            ? '0 4px 20px rgba(0, 0, 0, 0.3)' 
            : '0 4px 20px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'rgba(59, 130, 246, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
            fontSize: '1.5rem'
          }}>
            ✉️
          </div>
          
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: isDark ? '#F9FAFB' : '#1F2937',
            marginBottom: '1rem'
          }}>
            Check your email
          </h2>
          
          <p style={{
            color: isDark ? '#9CA3AF' : '#6B7280',
            fontSize: '0.875rem',
            marginBottom: '1.5rem'
          }}>
            We sent a password reset link to <strong>{email}</strong>. 
            Click the link to reset your password.
          </p>
          
          <Link 
            href="/login"
            style={{
              display: 'inline-block',
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, #A855F7 0%, #7C3AED 100%)',
              color: '#FFFFFF',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: '500'
            }}
          >
            Back to login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: isDark ? '#111827' : '#F9FAFB',
      padding: '2rem'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        background: isDark ? '#1F2937' : '#FFFFFF',
        borderRadius: '12px',
        padding: '2rem',
        boxShadow: isDark 
          ? '0 4px 20px rgba(0, 0, 0, 0.3)' 
          : '0 4px 20px rgba(0, 0, 0, 0.1)'
      }}>
        {/* Logo */}
        <div style={{
          textAlign: 'center',
          marginBottom: '2rem'
        }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <img 
              src="/logo.png" 
              alt="PropShop.ai" 
              style={{ height: '60px', marginBottom: '1rem' }}
            />
          </Link>
        </div>

        <h1 style={{
          fontSize: '1.25rem',
          fontWeight: '600',
          color: isDark ? '#F9FAFB' : '#1F2937',
          textAlign: 'center',
          marginBottom: '0.5rem'
        }}>
          Reset your password
        </h1>

        <p style={{
          fontSize: '0.875rem',
          color: isDark ? '#9CA3AF' : '#6B7280',
          textAlign: 'center',
          marginBottom: '1.5rem'
        }}>
          Enter your email and we'll send you a reset link
        </p>

        {error && (
          <div style={{
            padding: '0.75rem',
            marginBottom: '1rem',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            color: '#EF4444',
            fontSize: '0.875rem'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: isDark ? '#D1D5DB' : '#374151',
              marginBottom: '0.5rem'
            }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                fontSize: '1rem',
                borderRadius: '8px',
                border: `1px solid ${isDark ? '#374151' : '#D1D5DB'}`,
                background: isDark ? '#111827' : '#FFFFFF',
                color: isDark ? '#F9FAFB' : '#1F2937',
                outline: 'none'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.875rem',
              fontSize: '1rem',
              fontWeight: '600',
              borderRadius: '8px',
              border: 'none',
              background: loading 
                ? '#6B7280' 
                : 'linear-gradient(135deg, #A855F7 0%, #7C3AED 100%)',
              color: '#FFFFFF',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {loading ? 'Sending...' : 'Send reset link'}
          </button>
        </form>

        <div style={{
          marginTop: '1.5rem',
          textAlign: 'center'
        }}>
          <Link 
            href="/login"
            style={{
              fontSize: '0.875rem',
              color: '#A855F7',
              textDecoration: 'none'
            }}
          >
            ← Back to login
          </Link>
        </div>
      </div>
    </div>
  )
}

