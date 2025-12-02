'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'

export default function LoginPage() {
  const router = useRouter()
  const { signIn } = useAuth()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await signIn(email, password)

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/app/search')
    }
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
          Sign in to your account
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

          <div style={{ marginBottom: '1.5rem' }}>
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
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div style={{
          marginTop: '1.5rem',
          textAlign: 'center'
        }}>
          <Link 
            href="/forgot-password"
            style={{
              fontSize: '0.875rem',
              color: '#A855F7',
              textDecoration: 'none'
            }}
          >
            Forgot your password?
          </Link>
        </div>

        <div style={{
          marginTop: '1.5rem',
          paddingTop: '1.5rem',
          borderTop: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
          textAlign: 'center'
        }}>
          <span style={{ color: isDark ? '#9CA3AF' : '#6B7280', fontSize: '0.875rem' }}>
            Don't have an account?{' '}
          </span>
          <Link 
            href="/signup"
            style={{
              color: '#A855F7',
              textDecoration: 'none',
              fontWeight: '500',
              fontSize: '0.875rem'
            }}
          >
            Sign up
          </Link>
        </div>
      </div>
    </div>
  )
}

