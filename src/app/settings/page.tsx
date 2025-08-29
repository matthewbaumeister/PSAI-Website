'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface PasswordFormData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

interface EmailPreferences {
  marketingEmails: boolean
  productUpdates: boolean
  securityAlerts: boolean
  weeklyDigest: boolean
}

export default function SettingsPage() {
  const { user, isLoading, logout } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'password' | 'email' | 'account'>('password')
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isUpdatingPreferences, setIsUpdatingPreferences] = useState(false)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')
  
  const [passwordData, setPasswordData] = useState<PasswordFormData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const [emailPreferences, setEmailPreferences] = useState<EmailPreferences>({
    marketingEmails: true,
    productUpdates: true,
    securityAlerts: true,
    weeklyDigest: false
  })

  // Check if user is authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-purple-200 text-lg">Loading Settings...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to login
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage('New passwords do not match')
      setMessageType('error')
      return
    }

    if (passwordData.newPassword.length < 8) {
      setMessage('New password must be at least 8 characters long')
      setMessageType('error')
      return
    }

    setIsChangingPassword(true)
    setMessage('')

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        }),
      })

      if (response.ok) {
        setMessage('Password changed successfully!')
        setMessageType('success')
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
      } else {
        const data = await response.json()
        setMessage(data.message || 'Failed to change password')
        setMessageType('error')
      }
    } catch (error) {
      setMessage('An unexpected error occurred')
      setMessageType('error')
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleEmailPreferencesUpdate = async () => {
    setIsUpdatingPreferences(true)
    setMessage('')

    try {
      const response = await fetch('/api/auth/email-preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailPreferences),
      })

      if (response.ok) {
        setMessage('Email preferences updated successfully!')
        setMessageType('success')
      } else {
        const data = await response.json()
        setMessage(data.message || 'Failed to update email preferences')
        setMessageType('error')
      }
    } catch (error) {
      setMessage('An unexpected error occurred')
      setMessageType('error')
    } finally {
      setIsUpdatingPreferences(false)
    }
  }

  const handleAccountDeletion = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return
    }

    setIsDeletingAccount(true)
    setMessage('')

    try {
      const response = await fetch('/api/auth/delete-account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        setMessage('Account deleted successfully. Redirecting to home page...')
        setMessageType('success')
        setTimeout(() => {
          logout()
          router.push('/')
        }, 2000)
      } else {
        const data = await response.json()
        setMessage(data.message || 'Failed to delete account')
        setMessageType('error')
      }
    } catch (error) {
      setMessage('An unexpected error occurred')
      setMessageType('error')
    } finally {
      setIsDeletingAccount(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    if (type === 'checkbox') {
      setEmailPreferences(prev => ({
        ...prev,
        [name]: checked
      }))
    } else {
      setPasswordData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800/50 to-purple-800/50 backdrop-blur-sm border-b border-slate-700/50">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                Settings
              </h1>
              <p className="text-slate-300 mt-2 text-lg">Manage your account preferences and security</p>
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

        {/* Settings Navigation */}
        <div className="bg-gradient-to-br from-slate-800/50 to-purple-800/20 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-2 mb-8">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('password')}
              className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                activeTab === 'password'
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/30'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Password</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('email')}
              className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                activeTab === 'email'
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/30'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>Email</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('account')}
              className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                activeTab === 'account'
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/30'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>Account</span>
              </div>
            </button>
          </div>
        </div>

        {/* Password Settings */}
        {activeTab === 'password' && (
          <div className="bg-gradient-to-br from-slate-800/50 to-purple-800/20 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 hover:border-purple-500/30 transition-all duration-300">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-purple-500/30 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white">Change Password</h2>
            </div>

            <form onSubmit={handlePasswordChange} className="space-y-6">
              <div>
                <label htmlFor="currentPassword" className="block text-slate-300 text-sm font-medium mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  id="currentPassword"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300"
                  placeholder="Enter your current password"
                />
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-slate-300 text-sm font-medium mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300"
                  placeholder="Enter your new password"
                />
                <p className="text-slate-400 text-sm mt-1">Password must be at least 8 characters long</p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-slate-300 text-sm font-medium mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300"
                  placeholder="Confirm your new password"
                />
              </div>

              <button
                type="submit"
                disabled={isChangingPassword}
                className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-purple-500/25"
              >
                {isChangingPassword ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Changing Password...</span>
                  </div>
                ) : (
                  <span>Change Password</span>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Email Preferences */}
        {activeTab === 'email' && (
          <div className="bg-gradient-to-br from-slate-800/50 to-emerald-800/20 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 hover:border-emerald-500/30 transition-all duration-300">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-emerald-500/30 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white">Email Preferences</h2>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl border border-slate-600/30">
                <div>
                  <h3 className="text-white font-medium">Marketing Emails</h3>
                  <p className="text-slate-400 text-sm">Receive emails about new features and promotions</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="marketingEmails"
                    checked={emailPreferences.marketingEmails}
                    onChange={handleInputChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl border border-slate-600/30">
                <div>
                  <h3 className="text-white font-medium">Product Updates</h3>
                  <p className="text-slate-400 text-sm">Get notified about new features and improvements</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="productUpdates"
                    checked={emailPreferences.productUpdates}
                    onChange={handleInputChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl border border-slate-600/30">
                <div>
                  <h3 className="text-white font-medium">Security Alerts</h3>
                  <p className="text-slate-400 text-sm">Important security notifications and account alerts</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="securityAlerts"
                    checked={emailPreferences.securityAlerts}
                    onChange={handleInputChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl border border-slate-600/30">
                <div>
                  <h3 className="text-white font-medium">Weekly Digest</h3>
                  <p className="text-slate-400 text-sm">Weekly summary of your activity and insights</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="weeklyDigest"
                    checked={emailPreferences.weeklyDigest}
                    onChange={handleInputChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>

              <button
                onClick={handleEmailPreferencesUpdate}
                disabled={isUpdatingPreferences}
                className="w-full px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl hover:from-emerald-700 hover:to-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-emerald-500/25"
              >
                {isUpdatingPreferences ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Updating Preferences...</span>
                  </div>
                ) : (
                  <span>Save Email Preferences</span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Account Settings */}
        {activeTab === 'account' && (
          <div className="bg-gradient-to-br from-slate-800/50 to-red-800/20 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 hover:border-red-500/30 transition-all duration-300">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-red-500/30 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white">Account Management</h2>
            </div>

            <div className="space-y-6">
              {/* Account Information */}
              <div className="bg-slate-700/30 rounded-xl p-6 border border-slate-600/30">
                <h3 className="text-white font-medium mb-4">Account Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-300 text-sm font-medium mb-2">Email Address</label>
                    <div className="px-4 py-3 bg-slate-600/30 border border-slate-500/30 rounded-lg text-white">
                      {user.email}
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-300 text-sm font-medium mb-2">Account Type</label>
                    <div className="px-4 py-3 bg-slate-600/30 border border-slate-500/30 rounded-lg">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        user.isAdmin ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-slate-600/20 text-slate-300 border border-slate-600/30'
                      }`}>
                        {user.isAdmin ? 'Admin' : 'User'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="bg-red-500/10 rounded-xl p-6 border border-red-500/30">
                <h3 className="text-red-400 font-medium mb-4">Danger Zone</h3>
                <p className="text-slate-300 text-sm mb-6">
                  These actions are irreversible. Please proceed with caution.
                </p>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-red-500/20 rounded-lg border border-red-500/30">
                    <div>
                      <h4 className="text-red-300 font-medium">Delete Account</h4>
                      <p className="text-red-200 text-sm">Permanently delete your account and all data</p>
                    </div>
                    <button
                      onClick={handleAccountDeletion}
                      disabled={isDeletingAccount}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      {isDeletingAccount ? 'Deleting...' : 'Delete Account'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
