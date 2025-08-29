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
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Reset Your Password</h2>
        <p className="text-gray-600">Enter your email address and we'll send you a link to reset your password</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email Field */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email Address *
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`w-full px-3 py-2 border rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 ${
              errors.email ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="john@company.com"
          />
          {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-md shadow-sm transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
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
          <div className="p-4 bg-green-50 border border-green-200 rounded-md text-green-800 text-center">
            {submitMessage}
          </div>
        )}
        
        {submitStatus === 'error' && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-800 text-center">
            {submitMessage}
          </div>
        )}

        {/* Back to Login */}
        <div className="text-center">
          <p className="text-gray-600">
            Remember your password?{' '}
            <Link href="/auth/login" className="text-blue-600 hover:text-blue-500 font-medium underline">
              Sign in here
            </Link>
          </p>
        </div>
      </form>
    </div>
  )
}
