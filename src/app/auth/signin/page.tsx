'use client'

import { useState, useEffect, Suspense } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

function SignInContent() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [inactivityMessage, setInactivityMessage] = useState('')
  
  const { signIn } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const reason = searchParams.get('reason')
    if (reason === 'inactivity') {
      setInactivityMessage('Your session expired due to inactivity. Please sign in again.')
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { error } = await signIn(formData.email, formData.password)

      if (error) {
        setError(error.message)
      } else {
        // Redirect to dashboard on successful login
        router.push('/dashboard')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <div className="page-content" style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        borderRadius: '1rem',
        padding: '2rem',
        maxWidth: '400px',
        width: '100%'
      }}>
        <div style={{
          textAlign: 'center',
          marginBottom: '2rem'
        }}>
          <h1 style={{
            color: 'white',
            fontSize: '2rem',
            fontWeight: 700,
            marginBottom: '0.5rem'
          }}>Welcome Back</h1>
          <p style={{
            color: '#9CA3AF'
          }}>Sign in to your Prop Shop AI account</p>
        </div>

        {/* Inactivity Message */}
        {inactivityMessage && (
          <div style={{
            padding: '0.75rem',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '0.5rem',
            color: '#FCA5A5',
            marginBottom: '1.5rem',
            fontSize: '0.875rem',
            textAlign: 'center'
          }}>
            {inactivityMessage}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: 'white',
              fontSize: '0.875rem',
              fontWeight: 500
            }}>
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '0.5rem',
                color: 'white',
                fontSize: '1rem'
              }}
              placeholder="Enter your email"
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: 'white',
              fontSize: '0.875rem',
              fontWeight: 500
            }}>
              Password *
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '0.5rem',
                color: 'white',
                fontSize: '1rem'
              }}
              placeholder="Enter your password"
            />
          </div>

          {error && (
            <div style={{
              padding: '0.75rem',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '0.5rem',
              color: '#FCA5A5',
              marginBottom: '1rem',
              fontSize: '0.875rem'
            }}>
              {error}
              {error.includes('deleted') && (
                <div style={{
                  marginTop: '0.75rem',
                  paddingTop: '0.75rem',
                  borderTop: '1px solid rgba(239, 68, 68, 0.2)'
                }}>
                  <p style={{ marginBottom: '0.5rem' }}>
                    Need a new account?{' '}
                    <Link href="/auth/signup" style={{
                      color: '#9AF23A',
                      textDecoration: 'none',
                      fontWeight: 600
                    }}>
                      Click here to Sign Up
                    </Link>
                  </p>
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: loading ? 'rgba(255, 255, 255, 0.1)' : 'linear-gradient(to right, #2D5BFF, #9AF23A)',
              border: 'none',
              borderRadius: '0.5rem',
              color: 'white',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div style={{
          textAlign: 'center',
          marginTop: '1.5rem',
          paddingTop: '1.5rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <p style={{
            color: '#9CA3AF',
            fontSize: '0.875rem',
            marginBottom: '0.5rem'
          }}>
            <Link href="/auth/forgot-password" style={{
              color: '#9AF23A',
              textDecoration: 'none',
              fontWeight: 500
            }}>
              Forgot your password?
            </Link>
          </p>
          <p style={{
            color: '#9CA3AF',
            fontSize: '0.875rem'
          }}>
            Don&apos;t have an account?{' '}
            <Link href="/auth/signup" style={{
              color: '#9AF23A',
              textDecoration: 'none',
              fontWeight: 500
            }}>
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function SignInPage() {
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
          maxWidth: '400px',
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
            Preparing sign in page...
          </p>
        </div>
      </div>
    }>
      <SignInContent />
    </Suspense>
  )
}
