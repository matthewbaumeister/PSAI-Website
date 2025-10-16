'use client'

import { useState } from 'react'
import Link from 'next/link'

interface SignupForm {
  firstName: string
  lastName: string
  email: string
  password: string
  confirmPassword: string
  companyName: string
  companySize: string
  phone: string
  acceptTerms: boolean
}

export default function SignupPage() {
  const [formData, setFormData] = useState<SignupForm>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    companySize: '',
    phone: '',
    acceptTerms: false
  })

  const [errors, setErrors] = useState<Partial<Record<keyof SignupForm, string>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [submitMessage, setSubmitMessage] = useState('')

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    
    // Clear error when user starts typing
    if (errors[name as keyof SignupForm]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof SignupForm, string>> = {}

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required'
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required'
    if (!formData.email.trim()) newErrors.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Please enter a valid email'
    
    if (!formData.password) newErrors.password = 'Password is required'
    else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters'
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }
    
    if (!formData.companyName.trim()) newErrors.companyName = 'Company name is required'
    if (!formData.companySize) newErrors.companySize = 'Please select company size'
    if (!formData.acceptTerms) newErrors.acceptTerms = 'You must accept the terms and conditions'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsSubmitting(true)
    setSubmitStatus('idle')
    
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      const result = await response.json()
      
      if (response.ok) {
        setSubmitStatus('success')
        setSubmitMessage('Account created successfully! Please check your email to verify your account. Redirecting to login page in 3 seconds...')
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          confirmPassword: '',
          companyName: '',
          companySize: '',
          phone: '',
          acceptTerms: false
        })
        
        // Check for returnUrl parameter to pass along to login page
        const urlParams = new URLSearchParams(window.location.search)
        const returnUrl = urlParams.get('returnUrl')
        
        // Redirect to login page after 3 seconds
        setTimeout(() => {
          if (returnUrl) {
            window.location.href = `/auth/login?returnUrl=${encodeURIComponent(returnUrl)}`
          } else {
            window.location.href = '/auth/login'
          }
        }, 3000)
      } else {
        setSubmitStatus('error')
        setSubmitMessage(result.error || 'Failed to create account. Please try again.')
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
        <h2>Create Your Account</h2>
        <p>Join Prop Shop AI and level the playing field in government contracting</p>
      </div>

      <form className="contact-form" onSubmit={handleSubmit}>
        {/* Name Fields */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="firstName">First Name *</label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              required
              placeholder="John"
            />
            {errors.firstName && (
              <p className="error-message">
                {errors.firstName}
              </p>
            )}
          </div>
          
          <div className="form-group">
            <label htmlFor="lastName">Last Name *</label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              required
              placeholder="Doe"
            />
            {errors.lastName && (
              <p className="error-message">
                {errors.lastName}
              </p>
            )}
          </div>
        </div>

        {/* Email Field */}
        <div className="form-group full-width">
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

        {/* Password Fields */}
        <div className="form-row">
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
          
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password *</label>
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
        </div>

        {/* Company Fields */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="companyName">Company Name *</label>
            <input
              type="text"
              id="companyName"
              name="companyName"
              value={formData.companyName}
              onChange={handleInputChange}
              required
              placeholder="Your Company"
            />
            {errors.companyName && (
              <p className="error-message">
                {errors.companyName}
              </p>
            )}
          </div>
          
          <div className="form-group">
            <label htmlFor="companySize">Company Size *</label>
            <select
              id="companySize"
              name="companySize"
              value={formData.companySize}
              onChange={handleInputChange}
              required
              className="form-select"
            >
              <option value="">Select size</option>
              <option value="1-10">1-10 employees</option>
              <option value="11-50">11-50 employees</option>
              <option value="51-200">51-200 employees</option>
              <option value="201-500">201-500 employees</option>
              <option value="500+">500+ employees</option>
            </select>
            {errors.companySize && (
              <p className="error-message">
                {errors.companySize}
              </p>
            )}
          </div>
        </div>

        {/* Phone Field */}
        <div className="form-group full-width">
          <label htmlFor="phone">Phone Number</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            placeholder="(555) 123-4567"
          />
        </div>

        {/* Terms Checkbox */}
        <div className="checkbox-group">
          <div className="checkbox-item">
            <input
              type="checkbox"
              id="acceptTerms"
              name="acceptTerms"
              checked={formData.acceptTerms}
              onChange={handleInputChange}
            />
            <label htmlFor="acceptTerms">
              I agree to the Terms of Service and Privacy Policy *
            </label>
          </div>
          {errors.acceptTerms && (
            <p className="error-message">
              {errors.acceptTerms}
            </p>
          )}
        </div>

        <button type="submit" className="submit-btn" disabled={isSubmitting}>
          {isSubmitting ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Creating Account...
            </div>
          ) : (
            'Create Account'
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

        {/* Sign In Section */}
        <div className="signup-section">
          <p>Already have an account?</p>
          <Link href="/auth/login" className="signup-link">
            Sign in here
          </Link>
        </div>
      </form>
    </div>
  )
}
