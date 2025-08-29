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
      const success = await login(formData.email, formData.password, formData.rememberMe)
      
      if (success) {
        setSubmitStatus('success')
        setSubmitMessage('Login successful! Redirecting...')
        setTimeout(() => router.push('/'), 1500)
      } else {
        setSubmitStatus('error')
        setSubmitMessage('Invalid email or password. Please try again.')
      }
    } catch (error) {
      setSubmitStatus('error')
      setSubmitMessage('An error occurred during login. Please try again.')
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
          Welcome Back
        </h2>
        <p 
          className="text-lg"
          style={{ color: '#6b7280', fontSize: '1.125rem' }}
        >
          Sign in to your Prop Shop AI account
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email Field */}
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

        {/* Password Field */}
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

        {/* Remember Me & Forgot Password */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="rememberMe"
              name="rememberMe"
              checked={formData.rememberMe}
              onChange={handleInputChange}
              className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
            />
            <label 
              htmlFor="rememberMe" 
              className="text-sm"
              style={{ color: '#374151' }}
            >
              Remember me for 7 days
            </label>
          </div>
          
          <Link 
            href="/auth/forgot-password" 
            className="text-sm underline transition-colors duration-200"
            style={{ color: '#2563eb' }}
          >
            Forgot password?
          </Link>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full font-medium py-3 px-4 rounded-lg shadow-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: '#2563eb',
            color: 'white',
            fontSize: '1rem',
            fontWeight: '500',
            padding: '0.75rem 1rem',
            borderRadius: '8px'
          }}
        >
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
          <div 
            className="p-4 border rounded-lg text-center"
            style={{
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              color: '#166534'
            }}
          >
            {submitMessage}
          </div>
        )}
        
        {submitStatus === 'error' && (
          <div 
            className="p-4 border rounded-lg text-center"
            style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626'
            }}
          >
            {submitMessage}
          </div>
        )}

        {/* Sign Up Section */}
        <div className="text-center pt-4 border-t border-gray-200">
          <p 
            className="text-gray-600 mb-4"
            style={{ color: '#6b7280' }}
          >
            Don't have an account?
          </p>
          <Link 
            href="/auth/signup" 
            className="inline-block font-medium py-2.5 px-6 rounded-lg transition-colors duration-200"
            style={{
              backgroundColor: '#f3f4f6',
              color: '#374151',
              border: '1px solid #d1d5db'
            }}
          >
            Create Account
          </Link>
        </div>
      </form>
    </div>
  )
}
