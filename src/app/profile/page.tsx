'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface ProfileFormData {
  firstName: string
  lastName: string
  companyName: string
  companySize: string
  phone: string
}

export default function ProfilePage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')
  
  const [formData, setFormData] = useState<ProfileFormData>({
    firstName: '',
    lastName: '',
    companyName: '',
    companySize: '',
    phone: ''
  })

  // Check if user is authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, isLoading, router])

  // Load user data when component mounts
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        companyName: user.companyName || '',
        companySize: user.companySize || '',
        phone: user.phone || ''
      })
    }
  }, [user])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-purple-200 text-base">Loading Profile...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to login
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    setMessage('')

    try {
      const response = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setMessage('Profile updated successfully!')
        setMessageType('success')
        setIsEditing(false)
        // Update the user context with new data
        // This would typically be handled by the auth context
      } else {
        const data = await response.json()
        setMessage(data.message || 'Failed to update profile')
        setMessageType('error')
      }
    } catch (error) {
      setMessage('An unexpected error occurred')
      setMessageType('error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    // Reset form data to original user data
    setFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      companyName: user.companyName || '',
      companySize: user.companySize || '',
      phone: user.phone || ''
    })
    setIsEditing(false)
    setMessage('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800/50 to-purple-800/50 backdrop-blur-sm border-b border-slate-700/50">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                Profile
              </h1>
              <p className="text-slate-300 mt-2 text-base">Manage your personal and company information</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-slate-800/50 rounded-full px-4 py-2 border border-slate-600/50">
                <span className="text-slate-300 text-sm">Logged in as: </span>
                <span className="text-white font-semibold text-sm">{user.email}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Message Display */}
        {message && (
          <div className={`mb-8 p-4 rounded-xl border backdrop-blur-sm transition-all duration-300 ${
            messageType === 'success' 
              ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-200' 
              : 'bg-red-500/20 border-red-500/30 text-red-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {messageType === 'success' ? (
                  <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                )}
                <span className="font-medium text-sm">{message}</span>
              </div>
              <button 
                onClick={() => setMessage('')}
                className="text-slate-400 hover:text-white transition-colors duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Information */}
          <div className="lg:col-span-2">
            <div className="bg-gradient-to-br from-slate-800/50 to-purple-800/20 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 hover:border-purple-500/30 transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-500/30 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-white">Personal Information</h2>
                </div>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 text-sm"
                  >
                    Edit Profile
                  </button>
                )}
              </div>

              {isEditing ? (
                <form className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="firstName" className="block text-slate-300 text-sm font-medium mb-2">
                        First Name
                      </label>
                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300 text-sm"
                        placeholder="Enter your first name"
                      />
                    </div>
                    <div>
                      <label htmlFor="lastName" className="block text-slate-300 text-sm font-medium mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300 text-sm"
                        placeholder="Enter your last name"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="companyName" className="block text-slate-300 text-sm font-medium mb-2">
                      Company Name
                    </label>
                    <input
                      type="text"
                      id="companyName"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300 text-sm"
                      placeholder="Enter your company name"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="companySize" className="block text-slate-300 text-sm font-medium mb-2">
                        Company Size
                      </label>
                      <select
                        id="companySize"
                        name="companySize"
                        value={formData.companySize}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300 text-sm"
                      >
                        <option value="">Select company size</option>
                        <option value="1-10">1-10 employees</option>
                        <option value="11-50">11-50 employees</option>
                        <option value="51-200">51-200 employees</option>
                        <option value="201-500">201-500 employees</option>
                        <option value="501-1000">501-1000 employees</option>
                        <option value="1000+">1000+ employees</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="phone" className="block text-slate-300 text-sm font-medium mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300 text-sm"
                        placeholder="Enter your phone number"
                      />
                    </div>
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={isSaving}
                      className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all duration-300 text-sm"
                    >
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors duration-200 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-300 text-sm font-medium mb-2">First Name</label>
                      <div className="px-3 py-2 bg-slate-700/30 border border-slate-600/30 rounded-lg text-white text-sm">
                        {formData.firstName || 'Not provided'}
                      </div>
                    </div>
                    <div>
                      <label className="block text-slate-300 text-sm font-medium mb-2">Last Name</label>
                      <div className="px-3 py-2 bg-slate-700/30 border border-slate-600/30 rounded-lg text-white text-sm">
                        {formData.lastName || 'Not provided'}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 text-sm font-medium mb-2">Company Name</label>
                    <div className="px-3 py-2 bg-slate-700/30 border border-slate-600/30 rounded-lg text-white text-sm">
                      {formData.companyName || 'Not provided'}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-300 text-sm font-medium mb-2">Company Size</label>
                      <div className="px-3 py-2 bg-slate-700/30 border border-slate-600/30 rounded-lg text-white text-sm">
                        {formData.companySize || 'Not specified'}
                      </div>
                    </div>
                    <div>
                      <label className="block text-slate-300 text-sm font-medium mb-2">Phone Number</label>
                      <div className="px-3 py-2 bg-slate-700/30 border border-slate-600/30 rounded-lg text-white text-sm">
                        {formData.phone || 'Not provided'}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Account Information */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-slate-800/50 to-emerald-800/20 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 hover:border-emerald-500/30 transition-all duration-300">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-emerald-500/30 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-white">Account Status</h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg border border-slate-600/30">
                  <span className="text-slate-300 text-sm">Account Status</span>
                  <span className="px-2 py-1 bg-emerald-500/20 text-emerald-300 text-xs rounded-full border border-emerald-500/30">
                    Active
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg border border-slate-600/30">
                  <span className="text-slate-300 text-sm">Email Status</span>
                  <span className={`px-2 py-1 text-xs rounded-full border ${
                    user.emailVerified 
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                      : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                  }`}>
                    {user.emailVerified ? 'Verified' : 'Pending'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg border border-slate-600/30">
                  <span className="text-slate-300 text-sm">Account Type</span>
                  <span className={`px-2 py-1 text-xs rounded-full border ${
                    user.isAdmin 
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' 
                      : 'bg-slate-600/20 text-slate-300 border-slate-600/30'
                  }`}>
                    {user.isAdmin ? 'Admin' : 'User'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg border border-slate-600/30">
                  <span className="text-slate-300 text-sm">Member Since</span>
                  <span className="text-white text-xs">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
