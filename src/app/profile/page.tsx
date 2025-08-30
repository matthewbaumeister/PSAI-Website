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
    try {
      const response = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
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
      <div className="bg-gradient-to-r from-slate-800/50 to-purple-800/50 backdrop-blur-sm border-b border-slate-700/50 sticky top-0 z-10">
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
                <span className="text-slate-300 text-sm">Signed in as </span>
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

        {/* Profile Information */}
        <div className="bg-gradient-to-br from-slate-800/50 to-blue-800/20 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500/30 to-purple-500/30 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xl">
                  {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                </span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{user.firstName} {user.lastName}</h2>
                <p className="text-slate-300">{user.email}</p>
              </div>
            </div>
            <div className="flex space-x-3">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 font-semibold transition-all duration-300 transform hover:scale-105"
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
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl hover:from-emerald-700 hover:to-emerald-800 font-semibold transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  <button
                    onClick={handleCancel}
                    className="px-6 py-3 bg-slate-600/50 text-slate-300 rounded-xl hover:bg-slate-600/70 font-semibold transition-all duration-300 border border-slate-600/50"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Profile Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                First Name *
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                disabled={!isEditing}
                className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 ${
                  isEditing 
                    ? 'bg-slate-700/50 border-slate-600/50 text-white placeholder-slate-400 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20' 
                    : 'bg-slate-800/30 border-slate-700/50 text-slate-300 cursor-not-allowed'
                }`}
                placeholder="Enter your first name"
                required
              />
            </div>

            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                Last Name *
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                disabled={!isEditing}
                className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 ${
                  isEditing 
                    ? 'bg-slate-700/50 border-slate-600/50 text-white placeholder-slate-400 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20' 
                    : 'bg-slate-800/30 border-slate-700/50 text-slate-300 cursor-not-allowed'
                }`}
                placeholder="Enter your last name"
                required
              />
            </div>

            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                Company Name
              </label>
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleInputChange}
                disabled={!isEditing}
                className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 ${
                  isEditing 
                    ? 'bg-slate-700/50 border-slate-600/50 text-white placeholder-slate-400 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20' 
                    : 'bg-slate-800/30 border-slate-700/50 text-slate-300 cursor-not-allowed'
                }`}
                placeholder="Enter your company name"
              />
            </div>

            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                Company Size
              </label>
              <select
                name="companySize"
                value={formData.companySize}
                onChange={handleInputChange}
                disabled={!isEditing}
                className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 ${
                  isEditing 
                    ? 'bg-slate-700/50 border-slate-600/50 text-white focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20' 
                    : 'bg-slate-800/30 border-slate-700/50 text-slate-300 cursor-not-allowed'
                }`}
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
              <label className="block text-slate-300 text-sm font-medium mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                disabled={!isEditing}
                className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 ${
                  isEditing 
                    ? 'bg-slate-700/50 border-slate-600/50 text-white placeholder-slate-400 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20' 
                    : 'bg-slate-800/30 border-slate-700/50 text-slate-300 cursor-not-allowed'
                }`}
                placeholder="Enter your phone number"
              />
            </div>

            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full px-4 py-3 rounded-xl bg-slate-800/30 border border-slate-700/50 text-slate-400 cursor-not-allowed"
              />
              <p className="text-slate-500 text-xs mt-1">Email cannot be changed</p>
            </div>
          </div>

          {/* Account Status */}
          <div className="mt-8 pt-8 border-t border-slate-700/50">
            <h3 className="text-lg font-semibold text-white mb-4">Account Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-700/30 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${user.emailVerified ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                  <span className="text-slate-300">Email Verification</span>
                </div>
                <p className="text-white font-medium mt-1">
                  {user.emailVerified ? 'Verified' : 'Pending'}
                </p>
              </div>
              
              <div className="bg-slate-700/30 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                  <span className="text-slate-300">Account Status</span>
                </div>
                <p className="text-white font-medium mt-1">Active</p>
              </div>
              
              <div className="bg-slate-700/30 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${user.isAdmin ? 'bg-purple-500' : 'bg-blue-500'}`}></div>
                  <span className="text-slate-300">Role</span>
                </div>
                <p className="text-white font-medium mt-1">
                  {user.isAdmin ? 'Admin' : 'User'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
