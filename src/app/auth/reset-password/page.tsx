'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

interface ResetPasswordForm {
  password: string
  confirmPassword: string
}

function ResetPasswordPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  
  const [formData, setFormData] = useState<ResetPasswordForm>({
    password: '',
    confirmPassword: ''
  })
  const [errors, setErrors] = useState<Partial<ResetPasswordForm>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [tokenStatus, setTokenStatus] = useState<'validating' | 'valid' | 'invalid'>('validating')
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [submitMessage, setSubmitMessage] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (token) {
      validateToken(token)
    } else {
      setTokenStatus('invalid')
    }
  }, [token])

  const validateToken = async (resetToken: string) => {
    try {
      const response = await fetch(`/api/auth/reset-password?token=${resetToken}`)
      const data = await response.json()

      if (response.ok) {
        setTokenStatus('valid')
        setMessage('Token is valid. Please enter your new password.')
      } else {
        setTokenStatus('invalid')
        setMessage(data.message || 'Reset token is invalid or expired.')
      }
    } catch (error) {
      setTokenStatus('invalid')
      setMessage('Failed to validate reset token. Please try again.')
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear error when user starts typing
    if (errors[name as keyof ResetPasswordForm]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<ResetPasswordForm> = {}

    if (!formData.password) newErrors.password = 'Password is required'
    else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long'
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm() || !token) return

    setIsSubmitting(true)
    setSubmitStatus('idle')
    setSubmitMessage('')

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: token,
          newPassword: formData.password
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSubmitStatus('success')
        setSubmitMessage('Password reset successfully! You can now log in with your new password.')
        // Redirect to login after 3 seconds
        setTimeout(() => router.push('/auth/login'), 3000)
      } else {
        setSubmitStatus('error')
        setSubmitMessage(data.message || 'Failed to reset password. Please try again.')
      }
    } catch (error) {
      setSubmitStatus('error')
      setSubmitMessage('An unexpected error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (tokenStatus === 'validating') {
    return (
      <div className="contact-form-section">
        <div className="form-header">
          <h2>Validating Reset Token</h2>
          <p>Please wait while we verify your reset link...</p>
        </div>
        
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Validating reset token...</p>
        </div>
      </div>
    )
  }

  if (tokenStatus === 'invalid') {
    return (
      <div className="contact-form-section">
        <div className="form-header">
          <h2>Invalid Reset Link</h2>
          <p>The password reset link may have expired or is invalid.</p>
        </div>
        
        <div className="text-center space-y-4">
          <p className="text-white opacity-80 mb-6">
            {message}
          </p>
          
          <Link 
            href="/auth/forgot-password" 
            className="submit-btn inline-block"
          >
            Request New Reset Link
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="contact-form-section">
      <div className="form-header">
        <h2>Reset Your Password</h2>
        <p>Enter your new password below</p>
      </div>

      {submitStatus === 'success' && (
        <div className="success-message">
          {submitMessage}
        </div>
      )}

      {submitStatus === 'error' && (
        <div className="error-message">
          {submitMessage}
        </div>
      )}

      <form className="contact-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="password">New Password *</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            required
            placeholder="••••••••"
          />
          {errors.password && (
            <p className="error-message">
              {errors.password}
            </p>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm New Password *</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            required
            placeholder="••••••••"
          />
          {errors.confirmPassword && (
            <p className="error-message">
              {errors.confirmPassword}
            </p>
          )}
        </div>

        <button type="submit" className="submit-btn" disabled={isSubmitting}>
          {isSubmitting ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Resetting Password...
            </div>
          ) : (
            'Reset Password'
          )}
        </button>
      </form>

      <div className="signup-section">
        <p>Remember your password?</p>
        <Link href="/auth/login" className="signup-link">
          Sign in here
        </Link>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="contact-form-section">
        <div className="form-header">
          <h2>Loading...</h2>
          <p>Please wait while we load the reset password page...</p>
        </div>
        
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Loading...</p>
        </div>
      </div>
    }>
      <ResetPasswordPageContent />
    </Suspense>
  )
}
