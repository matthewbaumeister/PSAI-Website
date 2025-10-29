'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  })
  
  const [errors, setErrors] = useState<Partial<typeof formData>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [submitMessage, setSubmitMessage] = useState('')
  
  const { login } = useAuth()
  const router = useRouter()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    
    // Clear error when user starts typing
    if (errors[name as keyof typeof formData]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<typeof formData> = {}

    if (!formData.email.trim()) newErrors.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Please enter a valid email'
    
    if (!formData.password) newErrors.password = 'Password is required'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsSubmitting(true)
    setSubmitStatus('idle')
    
    try {
      const result = await login(formData.email, formData.password, formData.rememberMe)
      
      if (result.success) {
        setSubmitStatus('success')
        setSubmitMessage('Login successful! Redirecting...')
        
        // Check for returnUrl parameter (priority 1: URL param, priority 2: localStorage)
        const urlParams = new URLSearchParams(window.location.search)
        const returnUrlFromParam = urlParams.get('returnUrl')
        const returnUrlFromStorage = localStorage.getItem('redirectAfterLogin')
        
        // Clear localStorage redirect after reading
        if (returnUrlFromStorage) {
          localStorage.removeItem('redirectAfterLogin')
        }
        
        const finalReturnUrl = returnUrlFromParam || returnUrlFromStorage
        
        setTimeout(() => {
          if (finalReturnUrl) {
            // Redirect to the return URL (previous page)
            window.location.href = decodeURIComponent(finalReturnUrl)
          } else {
            // Default redirect to home
            router.push('/')
          }
        }, 1500)
      } else {
        setSubmitStatus('error')
        // Display the specific error message from the backend
        setSubmitMessage(result.message || 'Invalid email or password. Please try again.')
        
        // If email verification is required, add additional help
        if (result.requiresVerification) {
          setSubmitMessage(result.message + ' Check your email for the verification link.')
        }
      }
    } catch (error) {
      setSubmitStatus('error')
      setSubmitMessage('An error occurred during login. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="contact-form-section">
      <div className="form-header">
        <h2>Welcome Back</h2>
        <p>Sign in to your Prop Shop AI account</p>
      </div>

      <form className="contact-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email Address *</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            required
            placeholder="john@company.com"
          />
          {errors.email && (
            <p className="error-message">
              {errors.email}
            </p>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="password">Password *</label>
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

        <div className="form-row">
          <div className="checkbox-group">
            <div className="checkbox-item">
              <input
                type="checkbox"
                id="rememberMe"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleInputChange}
              />
              <label htmlFor="rememberMe">
                Remember me for 7 days
              </label>
            </div>
          </div>
          
          <div className="forgot-password">
            <Link href="/auth/forgot-password">
              Forgot password?
            </Link>
          </div>
        </div>

        <button type="submit" className="submit-btn" disabled={isSubmitting}>
          {isSubmitting ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Signing In...
            </div>
          ) : (
            'Sign In'
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

        {/* Sign Up Section */}
        <div className="signup-section">
          <p>Don't have an account?</p>
          <Link href="/auth/signup" className="signup-link">
            Create Account
          </Link>
        </div>
      </form>
    </div>
  )
}
