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
        setSubmitMessage('Account created successfully! Please check your email to verify your account.')
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
    <div 
      className="bg-white border border-gray-200 rounded-xl shadow-lg p-8"
      style={{
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
        padding: '2rem'
      }}
    >
      <div className="text-center mb-8">
        <h2 
          className="text-3xl font-bold mb-3"
          style={{ color: '#111827', fontSize: '1.875rem', fontWeight: '700' }}
        >
          Create Your Account
        </h2>
        <p 
          className="text-lg"
          style={{ color: '#6b7280', fontSize: '1.125rem' }}
        >
          Join Prop Shop AI and level the playing field in government contracting
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name Fields */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label 
              htmlFor="firstName" 
              className="block text-sm font-medium mb-2"
              style={{ color: '#374151', fontSize: '0.875rem', fontWeight: '500' }}
            >
              First Name *
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              style={{
                border: errors.firstName ? '1px solid #fca5a5' : '1px solid #d1d5db',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                fontSize: '1rem',
                color: '#111827',
                backgroundColor: 'white'
              }}
              placeholder="John"
            />
            {errors.firstName && (
              <p className="mt-2 text-sm" style={{ color: '#dc2626' }}>
                {errors.firstName}
              </p>
            )}
          </div>
          
          <div>
            <label 
              htmlFor="lastName" 
              className="block text-sm font-medium mb-2"
              style={{ color: '#374151', fontSize: '0.875rem', fontWeight: '500' }}
            >
              Last Name *
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              style={{
                border: errors.lastName ? '1px solid #fca5a5' : '1px solid #d1d5db',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                fontSize: '1rem',
                color: '#111827',
                backgroundColor: 'white'
              }}
              placeholder="Doe"
            />
            {errors.lastName && (
              <p className="mt-2 text-sm" style={{ color: '#dc2626' }}>
                {errors.lastName}
              </p>
            )}
          </div>
        </div>

        {/* Email */}
        <div>
          <label 
            htmlFor="email" 
            className="block text-sm font-medium mb-2"
            style={{ color: '#374151', fontSize: '0.875rem', fontWeight: '500' }}
          >
            Email Address *
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            style={{
              border: errors.email ? '1px solid #fca5a5' : '1px solid #d1d5db',
              borderRadius: '8px',
              padding: '0.75rem 1rem',
              fontSize: '1rem',
              color: '#111827',
              backgroundColor: 'white'
            }}
            placeholder="john@company.com"
          />
          {errors.email && (
            <p className="mt-2 text-sm" style={{ color: '#dc2626' }}>
              {errors.email}
            </p>
          )}
        </div>

        {/* Password Fields */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label 
              htmlFor="password" 
              className="block text-sm font-medium mb-2"
              style={{ color: '#374151', fontSize: '0.875rem', fontWeight: '500' }}
            >
              Password *
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              style={{
                border: errors.password ? '1px solid #fca5a5' : '1px solid #d1d5db',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                fontSize: '1rem',
                color: '#111827',
                backgroundColor: 'white'
              }}
              placeholder="••••••••"
            />
            {errors.password && (
              <p className="mt-2 text-sm" style={{ color: '#dc2626' }}>
                {errors.password}
              </p>
            )}
          </div>
          
          <div>
            <label 
              htmlFor="confirmPassword" 
              className="block text-sm font-medium mb-2"
              style={{ color: '#374151', fontSize: '0.875rem', fontWeight: '500' }}
            >
              Confirm Password *
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              style={{
                border: errors.confirmPassword ? '1px solid #fca5a5' : '1px solid #d1d5db',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                fontSize: '1rem',
                color: '#111827',
                backgroundColor: 'white'
              }}
              placeholder="••••••••"
            />
            {errors.confirmPassword && (
              <p className="mt-2 text-sm" style={{ color: '#dc2626' }}>
                {errors.confirmPassword}
              </p>
            )}
          </div>
        </div>

        {/* Company Fields */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
              Company Name *
            </label>
            <input
              type="text"
              id="companyName"
              name="companyName"
              value={formData.companyName}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 ${
                errors.companyName ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Your Company Inc."
            />
            {errors.companyName && <p className="mt-1 text-sm text-red-600">{errors.companyName}</p>}
          </div>
          
          <div>
            <label htmlFor="companySize" className="block text-sm font-medium text-gray-700 mb-2">
              Company Size *
            </label>
            <select
              id="companySize"
              name="companySize"
              value={formData.companySize}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 ${
                errors.companySize ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <option value="">Select size</option>
              <option value="1-10">1-10 employees</option>
              <option value="11-50">11-50 employees</option>
              <option value="51-200">51-200 employees</option>
              <option value="201-500">201-500 employees</option>
              <option value="500+">500+ employees</option>
            </select>
            {errors.companySize && <p className="mt-1 text-sm text-red-600">{errors.companySize}</p>}
          </div>
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
            placeholder="(555) 123-4567"
          />
        </div>

        {/* Terms */}
        <div className="flex items-start space-x-3">
          <input
            type="checkbox"
            id="acceptTerms"
            name="acceptTerms"
            checked={formData.acceptTerms}
            onChange={handleInputChange}
            className="mt-1 w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
          />
          <label htmlFor="acceptTerms" className="text-sm text-gray-700">
            I agree to the{' '}
            <Link href="/terms" className="text-blue-600 hover:text-blue-500 underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-blue-600 hover:text-blue-500 underline">
              Privacy Policy
            </Link> *
          </label>
        </div>
        {errors.acceptTerms && <p className="text-sm text-red-600">{errors.acceptTerms}</p>}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-md shadow-sm transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
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
          <div className="p-4 bg-green-50 border border-green-200 rounded-md text-green-800 text-center">
            {submitMessage}
          </div>
        )}
        
        {submitStatus === 'error' && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-800 text-center">
            {submitMessage}
          </div>
        )}

        {/* Sign In Link */}
        <div className="text-center">
          <p className="text-gray-600">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-blue-600 hover:text-blue-500 font-medium underline">
              Sign in here
            </Link>
          </p>
        </div>
      </form>
    </div>
  )
}
