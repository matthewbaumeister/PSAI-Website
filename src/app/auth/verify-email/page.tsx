'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/contexts/AuthContext'

function VerifyEmailContent() {
  const [verificationStatus, setVerificationStatus] = useState<'verifying' | 'success' | 'error' | 'expired'>('verifying')
  const [errorMessage, setErrorMessage] = useState('')
  const searchParams = useSearchParams()
  const router = useRouter()
  const { saveProfileAfterVerification } = useAuth()

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        // Get token and type from URL parameters
        const token = searchParams.get('token')
        const type = searchParams.get('type')

        if (!token || type !== 'signup') {
          setVerificationStatus('error')
          setErrorMessage('Invalid verification link. Please check your email for the correct link.')
          return
        }

        // Verify the email with Supabase
        const { error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: 'signup'
        })

        if (error) {
          if (error.message.includes('expired') || error.message.includes('invalid')) {
            setVerificationStatus('expired')
            setErrorMessage('This verification link has expired or is invalid.')
          } else {
            setVerificationStatus('error')
            setErrorMessage(error.message || 'Verification failed. Please try again.')
          }
        } else {
          // Get the user's profile data from metadata and save it
          const { data: { session } } = await supabase.auth.getSession()
          if (session?.user?.user_metadata?.profileData) {
            await saveProfileAfterVerification(session.user.user_metadata.profileData)
          }

          setVerificationStatus('success')
          // Redirect to dashboard after a short delay
          setTimeout(() => {
            router.push('/dashboard')
          }, 3000)
        }
      } catch (error) {
        console.error('Verification error:', error)
        setVerificationStatus('error')
        setErrorMessage('An unexpected error occurred. Please try again.')
      }
    }

    verifyEmail()
  }, [searchParams, router, saveProfileAfterVerification])

  const resendVerification = async () => {
    try {
      // Get email from URL params or prompt user
      let email = searchParams.get('email')
      
      if (!email) {
        // If no email in URL, prompt user to enter it
        email = prompt('Please enter your email address to resend verification:')
        if (!email) return
      }

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email
      })

      if (error) {
        console.error('Resend error:', error)
        setErrorMessage(`Failed to resend verification email: ${error.message}`)
      } else {
        setErrorMessage('Verification email sent! Please check your inbox.')
      }
    } catch (error) {
      console.error('Resend error:', error)
      setErrorMessage('Failed to resend verification email. Please try again.')
    }
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
        maxWidth: '500px',
        width: '100%',
        textAlign: 'center'
      }}>
        {verificationStatus === 'verifying' && (
          <>
            <div style={{
              marginBottom: '1.5rem'
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
                Verifying Your Email
              </h1>
              <p style={{
                color: '#9CA3AF',
                fontSize: '0.875rem'
              }}>
                Please wait while we verify your email address...
              </p>
            </div>
          </>
        )}

        {verificationStatus === 'success' && (
          <>
            <div style={{
              marginBottom: '1.5rem'
            }}>
              <div style={{
                width: '60px',
                height: '60px',
                background: '#9AF23A',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem',
                fontSize: '2rem',
                color: 'white'
              }}>
                ✓
              </div>
              <h1 style={{
                color: 'white',
                fontSize: '1.5rem',
                fontWeight: 700,
                marginBottom: '0.5rem'
              }}>
                Email Verified!
              </h1>
              <p style={{
                color: '#9CA3AF',
                fontSize: '0.875rem'
              }}>
                Your account has been successfully verified. Redirecting to dashboard...
              </p>
            </div>
            <Link href="/dashboard" style={{
              display: 'inline-block',
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(to right, #2D5BFF, #9AF23A)',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '0.5rem',
              fontWeight: 600
            }}>
              Go to Dashboard
            </Link>
          </>
        )}

        {verificationStatus === 'error' && (
          <>
            <div style={{
              marginBottom: '1.5rem'
            }}>
              <div style={{
                width: '60px',
                height: '60px',
                background: '#EF4444',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem',
                fontSize: '2rem',
                color: 'white'
              }}>
                ✕
              </div>
              <h1 style={{
                color: 'white',
                fontSize: '1.5rem',
                fontWeight: 700,
                marginBottom: '0.5rem'
              }}>
                Verification Failed
              </h1>
              <p style={{
                color: '#FCA5A5',
                fontSize: '0.875rem',
                marginBottom: '1rem'
              }}>
                {errorMessage}
              </p>
            </div>
            <div style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={resendVerification}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'rgba(154, 242, 58, 0.2)',
                  border: '1px solid rgba(154, 242, 58, 0.4)',
                  color: '#9AF23A',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontWeight: 500
                }}
              >
                Resend Verification
              </button>
              <Link href="/auth/signin" style={{
                padding: '0.75rem 1.5rem',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: 'white',
                borderRadius: '0.5rem',
                textDecoration: 'none',
                fontWeight: 500
              }}>
                Back to Sign In
              </Link>
            </div>
          </>
        )}

        {verificationStatus === 'expired' && (
          <>
            <div style={{
              marginBottom: '1.5rem'
            }}>
              <div style={{
                width: '60px',
                height: '60px',
                background: '#F59E0B',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem',
                fontSize: '2rem',
                color: 'white'
              }}>
                ⏰
              </div>
              <h1 style={{
                color: 'white',
                fontSize: '1.5rem',
                fontWeight: 700,
                marginBottom: '0.5rem'
              }}>
                Link Expired
              </h1>
              <p style={{
                color: '#FCD34D',
                fontSize: '0.875rem',
                marginBottom: '1rem'
              }}>
                {errorMessage}
              </p>
            </div>
            <div style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={resendVerification}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'rgba(154, 242, 58, 0.2)',
                  border: '1px solid rgba(154, 242, 58, 0.4)',
                  color: '#9AF23A',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontWeight: 500
                }}
              >
                Resend Verification
              </button>
              <Link href="/auth/signin" style={{
                padding: '0.75rem 1.5rem',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: 'white',
                borderRadius: '0.5rem',
                textDecoration: 'none',
                fontWeight: 500
              }}>
                Back to Sign In
              </Link>
            </div>
          </>
        )}

        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
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
            Preparing verification page...
          </p>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}
