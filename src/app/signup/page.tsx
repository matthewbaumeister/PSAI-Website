'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'

export default function SignUpPage() {
  const router = useRouter()
  const { signUp } = useAuth()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)

    const { error } = await signUp(email, password, displayName)

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
            background: 'rgba(34, 197, 94, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
            fontSize: '1.5rem'
          }}>
            ✓
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
            We sent a verification link to <strong>{email}</strong>. 
            Click the link to activate your account.
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
            Go to login
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
            <div style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: isDark ? '#F9FAFB' : '#1F2937'
            }}>
              prop-shop.ai
            </div>
          </Link>
        </div>

        <h1 style={{
          fontSize: '1.25rem',
          fontWeight: '600',
          color: isDark ? '#F9FAFB' : '#1F2937',
          textAlign: 'center',
          marginBottom: '1.5rem'
        }}>
          Create your account
        </h1>

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
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: isDark ? '#D1D5DB' : '#374151',
              marginBottom: '0.5rem'
            }}>
              Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="John Doe"
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

          <div style={{ marginBottom: '1rem' }}>
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

          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: isDark ? '#D1D5DB' : '#374151',
              marginBottom: '0.5rem'
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="At least 8 characters"
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

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: isDark ? '#D1D5DB' : '#374151',
              marginBottom: '0.5rem'
            }}>
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p style={{
          marginTop: '1rem',
          fontSize: '0.75rem',
          color: isDark ? '#6B7280' : '#9CA3AF',
          textAlign: 'center'
        }}>
          By signing up, you agree to our{' '}
          <Link href="/terms" style={{ color: '#A855F7' }}>Terms of Service</Link>
          {' '}and{' '}
          <Link href="/privacy" style={{ color: '#A855F7' }}>Privacy Policy</Link>
        </p>

        <div style={{
          marginTop: '1.5rem',
          paddingTop: '1.5rem',
          borderTop: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
          textAlign: 'center'
        }}>
          <span style={{ color: isDark ? '#9CA3AF' : '#6B7280', fontSize: '0.875rem' }}>
            Already have an account?{' '}
          </span>
          <Link 
            href="/login"
            style={{
              color: '#A855F7',
              textDecoration: 'none',
              fontWeight: '500',
              fontSize: '0.875rem'
            }}
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}

