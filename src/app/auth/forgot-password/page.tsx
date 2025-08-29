'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [submitMessage, setSubmitMessage] = useState('')
  const [errors, setErrors] = useState<{ email?: string }>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate email
    if (!email.trim()) {
      setErrors({ email: 'Email is required' })
      return
    }
    
    if (!/\S+@\S+\.\S+/.test(email)) {
      setErrors({ email: 'Please enter a valid email' })
      return
    }
    
    setErrors({})
    setIsSubmitting(true)
    setSubmitStatus('idle')
    
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      
      const result = await response.json()
      
      if (response.ok) {
        setSubmitStatus('success')
        setSubmitMessage('Password reset link sent! Please check your email for instructions.')
        setEmail('')
      } else {
        setSubmitStatus('error')
        setSubmitMessage(result.error || 'Failed to send reset link. Please try again.')
      }
    } catch (error) {
      setSubmitStatus('error')
      setSubmitMessage('Network error. Please check your connection and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="contact-form-section">
      <div className="form-header">
        <h2>Reset Your Password</h2>
        <p>Enter your email address and we'll send you a link to reset your password</p>
      </div>

      <form className="contact-form" onSubmit={handleSubmit}>
        {/* Email Field */}
        <div className="form-group full-width">
          <label htmlFor="email">Email Address *</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="john@company.com"
          />
          {errors.email && <p className="error-message">{errors.email}</p>}
        </div>

        {/* Submit Button */}
        <button type="submit" className="submit-btn" disabled={isSubmitting}>
          {isSubmitting ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Sending Reset Link...
            </div>
          ) : (
            'Send Reset Link'
          )}
        </button>

        {/* Status Messages */}
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

        {/* Back to Login */}
        <div className="signup-section">
          <p>Remember your password?</p>
          <Link href="/auth/login" className="signup-link">
            Back to Sign In
          </Link>
        </div>
      </form>
    </div>
  )
}
