'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    if (token) {
      verifyEmail(token)
    }
  }, [token])

  useEffect(() => {
    if (verificationStatus === 'success' && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
    if (countdown === 0) {
      router.push('/auth/login')
    }
  }, [verificationStatus, countdown, router])

  const verifyEmail = async (emailToken: string) => {
    setVerificationStatus('verifying')
    setMessage('Verifying your email address...')

    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: emailToken
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setVerificationStatus('success')
        setMessage('Email verified successfully! You can now log in to your account.')
      } else {
        setVerificationStatus('error')
        setMessage(data.message || 'Email verification failed. The link may be expired or invalid.')
      }
    } catch (error) {
      setVerificationStatus('error')
      setMessage('An unexpected error occurred during verification. Please try again.')
    }
  }

  const resendVerification = async () => {
    setVerificationStatus('verifying')
    setMessage('Sending verification email...')

    try {
      // This would need a resend verification endpoint
      setMessage('Please use the original verification link from your email, or contact support if you need a new one.')
      setVerificationStatus('error')
    } catch (error) {
      setVerificationStatus('error')
      setMessage('Failed to resend verification email. Please try again.')
    }
  }

  if (!token) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Email Verification</h2>
          <p className="text-gray-600">
            Please check your email for a verification link
          </p>
        </div>
        
        <div className="text-center space-y-4">
          <p className="text-gray-600">
            If you haven't received a verification email, check your spam folder or contact support.
          </p>
          <Link 
            href="/auth/login" 
            className="inline-block bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 px-6 rounded-lg font-medium hover:from-orange-600 hover:to-orange-700 transition-all duration-200"
          >
            Back to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Email Verification</h2>
        <p className="text-gray-600">
          {verificationStatus === 'verifying' && 'Verifying your email address...'}
          {verificationStatus === 'success' && 'Verification Complete!'}
          {verificationStatus === 'error' && 'Verification Failed'}
        </p>
      </div>

      {verificationStatus === 'verifying' && (
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">{message}</p>
        </div>
      )}

      {verificationStatus === 'success' && (
        <div className="text-center space-y-4">
          <div className="text-green-500 text-6xl mb-4">✓</div>
          <p className="text-green-800 text-lg">{message}</p>
          <p className="text-gray-600">
            Redirecting to login in {countdown} seconds...
          </p>
          <Link 
            href="/auth/login" 
            className="inline-block bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 px-6 rounded-lg font-medium hover:from-orange-600 hover:to-orange-700 transition-all duration-200"
          >
            Go to Login Now
          </Link>
        </div>
      )}

      {verificationStatus === 'error' && (
        <div className="text-center space-y-4">
          <div className="text-red-500 text-6xl mb-4">✗</div>
          <p className="text-red-800 text-lg">{message}</p>
          
          <div className="space-y-3">
            <button
              onClick={resendVerification}
              className="block w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 px-6 rounded-lg font-medium hover:from-orange-600 hover:to-orange-700 transition-all duration-200"
            >
              Try Again
            </button>
            
            <Link 
              href="/auth/login" 
              className="block w-full bg-gray-500 text-white py-3 px-6 rounded-lg font-medium hover:bg-gray-600 transition-all duration-200"
            >
              Back to Login
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
