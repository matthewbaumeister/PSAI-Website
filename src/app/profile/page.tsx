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

  // Initialize form data when user loads
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
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-purple-200 text-lg">Loading Profile...</p>
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
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setMessage('First name and last name are required')
      setMessageType('error')
      return
    }

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
        // Refresh user data
        window.location.reload()
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
    // Reset form data to current user data
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
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                Profile
              </h1>
              <p className="text-slate-300 mt-2 text-lg">Manage your personal information</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-slate-800/50 rounded-full px-4 py-2 border border-slate-600/50">
                <span className="text-slate-300 text-sm">Logged in as: </span>
                <span className="text-white font-semibold">{user.email}</span>
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
                <span className="font-medium">{message}</span>
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

        {/* Profile Form */}
        <div className="bg-gradient-to-br from-slate-800/50 to-purple-800/20 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 hover:border-purple-500/30 transition-all duration-300">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-purple-500/30 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white">Personal Information</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* First Name */}
            <div>
              <label htmlFor="firstName" className="block text-slate-300 text-sm font-medium mb-2">
                First Name *
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Enter your first name"
                required
              />
            </div>

            {/* Last Name */}
            <div>
              <label htmlFor="lastName" className="block text-slate-300 text-sm font-medium mb-2">
                Last Name *
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Enter your last name"
                required
              />
            </div>

            {/* Company Name */}
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
                disabled={!isEditing}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Enter your company name"
              />
            </div>

            {/* Company Size */}
            <div>
              <label htmlFor="companySize" className="block text-slate-300 text-sm font-medium mb-2">
                Company Size
              </label>
              <select
                id="companySize"
                name="companySize"
                value={formData.companySize}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
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

            {/* Phone */}
            <div className="md:col-span-2">
              <label htmlFor="phone" className="block text-slate-300 text-sm font-medium mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Enter your phone number"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 mt-8">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-purple-500/25"
              >
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>Edit Profile</span>
                </div>
              </button>
            ) : (
              <>
                <button
                  onClick={handleCancel}
                  className="px-6 py-3 bg-slate-600 text-white rounded-xl hover:bg-slate-700 font-semibold transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl hover:from-emerald-700 hover:to-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-emerald-500/25"
                >
                  {isSaving ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span>Saving...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Save Changes</span>
                    </div>
                  )}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Account Information */}
        <div className="bg-gradient-to-br from-slate-800/50 to-blue-800/20 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 mt-8 hover:border-blue-500/30 transition-all duration-300">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-blue-500/30 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white">Account Information</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">Email Address</label>
              <div className="px-4 py-3 bg-slate-700/30 border border-slate-600/30 rounded-xl text-white">
                {user.email}
              </div>
            </div>

            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">Account Status</label>
              <div className="px-4 py-3 bg-slate-700/30 border border-slate-600/30 rounded-xl">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  user.isAdmin ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-slate-600/20 text-slate-300 border border-slate-600/30'
                }`}>
                  {user.isAdmin ? 'Admin' : 'User'}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">Email Verification</label>
              <div className="px-4 py-3 bg-slate-700/30 border border-slate-600/30 rounded-xl">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  user.emailVerified ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  {user.emailVerified ? 'Verified' : 'Pending Verification'}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">Member Since</label>
              <div className="px-4 py-3 bg-slate-700/30 border border-slate-600/30 rounded-xl text-white">
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
