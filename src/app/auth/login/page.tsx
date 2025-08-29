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
      className="bg-white relative overflow-hidden"
      style={{
        backgroundColor: 'white !important',
        border: '1px solid #e5e7eb !important',
        borderRadius: '16px !important',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.08), 0 8px 16px rgba(0, 0, 0, 0.06) !important',
        padding: '2.5rem !important',
        position: 'relative'
      }}
    >
      {/* Clean white background - no patterns */}
      <div 
        className="relative z-10"
        style={{
          backgroundColor: 'white !important'
        }}
      >
        <div className="text-center mb-10">
          <h2 
            className="text-4xl font-bold mb-4"
            style={{ 
              color: '#111827 !important', 
              fontSize: '2.25rem !important', 
              fontWeight: '800 !important',
              letterSpacing: '-0.025em !important'
            }}
          >
            Welcome Back
          </h2>
          <p 
            className="text-xl"
            style={{ 
              color: '#6b7280 !important', 
              fontSize: '1.25rem !important',
              fontWeight: '400 !important'
            }}
          >
            Sign in to your Prop Shop AI account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Email Field */}
          <div>
            <label 
              htmlFor="email" 
              className="block font-medium mb-3"
              style={{ 
                color: '#374151 !important', 
                fontSize: '0.875rem !important', 
                fontWeight: '600 !important',
                textTransform: 'uppercase',
                letterSpacing: '0.05em !important'
              }}
            >
              Email Address *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300"
              style={{
                border: errors.email ? '2px solid #fca5a5 !important' : '2px solid #d1d5db !important',
                borderRadius: '12px !important',
                padding: '1rem 1.25rem !important',
                fontSize: '1rem !important',
                color: '#111827 !important',
                backgroundColor: 'white !important',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1) !important',
                transition: 'all 0.3s ease !important'
              }}
              placeholder="john@company.com"
            />
            {errors.email && (
              <p className="mt-3 text-sm font-medium" style={{ color: '#dc2626 !important' }}>
                {errors.email}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label 
              htmlFor="password" 
              className="block font-medium mb-3"
              style={{ 
                color: '#374151 !important', 
                fontSize: '0.875rem !important', 
                fontWeight: '600 !important',
                textTransform: 'uppercase',
                letterSpacing: '0.05em !important'
              }}
            >
              Password *
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className="w-full focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300"
              style={{
                border: errors.password ? '2px solid #fca5a5 !important' : '2px solid #d1d5db !important',
                borderRadius: '12px !important',
                padding: '1rem 1.25rem !important',
                fontSize: '1rem !important',
                color: '#111827 !important',
                backgroundColor: 'white !important',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1) !important',
                transition: 'all 0.3s ease !important'
              }}
              placeholder="••••••••"
            />
            {errors.password && (
              <p className="mt-3 text-sm font-medium" style={{ color: '#dc2626 !important' }}>
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
                className="w-5 h-5 text-orange-600 bg-white border-2 border-gray-300 rounded focus:ring-orange-500 focus:ring-2"
                style={{ 
                  borderRadius: '6px !important',
                  backgroundColor: 'white !important',
                  border: '2px solid #d1d5db !important'
                }}
              />
              <label 
                htmlFor="rememberMe" 
                className="text-sm font-medium"
                style={{ color: '#374151 !important' }}
              >
                Remember me for 7 days
              </label>
            </div>
            
            <Link 
              href="/auth/forgot-password" 
              className="text-sm font-medium underline transition-all duration-200 hover:no-underline"
              style={{ 
                color: '#FF7A29 !important',
                textDecoration: 'underline !important',
                textUnderlineOffset: '2px !important'
              }}
            >
              Forgot password?
            </Link>
          </div>

          {/* Submit Button - Brand orange */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full font-semibold py-4 px-6 rounded-xl shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl transform hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #FF7A29 0%, #FF6B1A 100%) !important',
              color: 'white !important',
              fontSize: '1.125rem !important',
              fontWeight: '600 !important',
              padding: '1rem 1.5rem !important',
              borderRadius: '12px !important',
              boxShadow: '0 10px 25px rgba(255, 122, 41, 0.3) !important',
              border: 'none !important'
            }}
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                Signing In...
              </div>
            ) : (
              'Sign In'
            )}
          </button>

          {/* Status Messages */}
          {submitStatus === 'success' && (
            <div 
              className="p-5 border rounded-xl text-center font-medium"
              style={{
                backgroundColor: '#f0fdf4 !important',
                border: '2px solid #bbf7d0 !important',
                color: '#166534 !important',
                borderRadius: '12px !important'
              }}
            >
              {submitMessage}
            </div>
          )}
          
          {submitStatus === 'error' && (
            <div 
              className="p-5 border rounded-xl text-center font-medium"
              style={{
                backgroundColor: '#fef2f2 !important',
                border: '2px solid #fecaca !important',
                color: '#dc2626 !important',
                borderRadius: '12px !important'
              }}
            >
              {submitMessage}
            </div>
          )}

          {/* Sign Up Section */}
          <div className="text-center pt-6 border-t border-gray-200">
            <p 
              className="text-gray-600 mb-5 text-lg"
              style={{ color: '#6b7280 !important', fontSize: '1.125rem !important' }}
            >
              Don't have an account?
            </p>
            <Link 
              href="/auth/signup" 
              className="inline-block font-semibold py-3 px-8 rounded-xl transition-all duration-300 hover:shadow-lg transform hover:scale-105"
              style={{
                backgroundColor: 'white !important',
                color: '#FF7A29 !important',
                border: '2px solid #FF7A29 !important',
                padding: '0.75rem 2rem !important',
                borderRadius: '12px !important',
                fontWeight: '600 !important'
              }}
            >
              Create Account
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
