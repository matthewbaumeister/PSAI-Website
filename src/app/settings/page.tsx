'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface PasswordChangeData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

interface EmailPreferences {
  marketingEmails: boolean
  productUpdates: boolean
  securityAlerts: boolean
}

export default function SettingsPage() {
  const { user, isLoading, logout } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'password' | 'preferences' | 'account'>('password')
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')
  
  const [passwordData, setPasswordData] = useState<PasswordChangeData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const [emailPreferences, setEmailPreferences] = useState<EmailPreferences>({
    marketingEmails: true,
    productUpdates: true,
    securityAlerts: true
  })

  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isSavingPreferences, setIsSavingPreferences] = useState(false)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

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
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
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

  const handleSavePreferences = async () => {
    setIsSavingPreferences(true)
    try {
      // This would typically call an API to save preferences
      // For now, we'll just simulate success
      await new Promise(resolve => setTimeout(resolve, 1000))
      setMessage('Email preferences saved successfully!')
      setMessageType('success')
    } catch (error) {
      setMessage('Failed to save preferences')
      setMessageType('error')
    } finally {
      setIsSavingPreferences(false)
    }
  }

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true)
    try {
      const response = await fetch('/api/auth/delete-account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (response.ok) {
        setMessage('Account deleted successfully. Redirecting...')
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
      setShowDeleteConfirm(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Simple Modern Header */}
      <div className="container mx-auto px-6 py-12">
        <div className="text-center mb-12">
          {/* Simple Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500/30 to-blue-500/30 rounded-2xl mb-6 shadow-lg border border-purple-400/30">
            <svg className="w-10 h-10 text-purple-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '40px', height: '40px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          
          {/* Title */}
          <h1 className="text-5xl font-bold text-white mb-4">
            Settings
          </h1>
          
          {/* Subtitle */}
          <p className="text-slate-300 text-lg mb-6 max-w-2xl mx-auto">
            Customize your experience, manage security, and control your account preferences
          </p>
          
          {/* User Status */}
          <div className="inline-flex items-center space-x-3 bg-slate-800/50 border border-slate-700/50 rounded-full px-6 py-3">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
            <span className="text-slate-200">Signed in as</span>
            <span className="text-white font-semibold">{user.email}</span>
          </div>
        </div>
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

        {/* Simple Tab Navigation */}
        <div className="flex justify-center mb-12">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-2">
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveTab('password')}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === 'password'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '16px', height: '16px' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span>Password</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('preferences')}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === 'preferences'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '16px', height: '16px' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Preferences</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('account')}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === 'account'
                    ? 'bg-purple-600 text-white'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '16px', height: '16px' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Account</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Password Change Tab - Clean Design */}
        {activeTab === 'password' && (
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8">
            <div className="flex items-center space-x-4 mb-8">
              <div className="w-12 h-12 bg-blue-500/30 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '24px', height: '24px' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Change Password</h2>
                <p className="text-slate-300">Keep your account secure</p>
              </div>
            </div>
            
            <form onSubmit={handlePasswordChange} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-slate-200 font-medium mb-2">Current Password</label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                    placeholder="Enter your current password"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-200 font-medium mb-2">New Password</label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-200"
                    placeholder="Enter your new password"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-200 font-medium mb-2">Confirm New Password</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200"
                  placeholder="Confirm your new password"
                  required
                />
                <p className="text-slate-400 text-sm mt-2">Password must be at least 8 characters long</p>
              </div>

              <button
                type="submit"
                disabled={isChangingPassword}
                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isChangingPassword ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Changing Password...</span>
                  </div>
                ) : (
                  'Change Password'
                )}
              </button>
            </form>
          </div>
        )}

        {/* Email Preferences Tab */}
        {activeTab === 'preferences' && (
          <div className="bg-gradient-to-br from-slate-800/50 to-emerald-800/20 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 group">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500/40 to-emerald-600/40 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 border border-emerald-400/30 group-hover:from-emerald-500/50 group-hover:to-emerald-600/50 group-hover:shadow-emerald-500/30 transition-all duration-300">
                <svg className="w-6 h-6 text-emerald-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '24px', height: '24px' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 19h6l-6 6v-6zM4 13h6l-6 6v-6zM4 7h6l-6 6V7zM10 7h6l-6 6V7zM10 1h6l-6 6V1zM4 1h6l-6 6V1z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white">Email Preferences</h2>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl">
                <div>
                  <h3 className="text-white font-medium">Marketing Emails</h3>
                  <p className="text-slate-400 text-sm">Receive emails about new features and promotions</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emailPreferences.marketingEmails}
                    onChange={(e) => setEmailPreferences(prev => ({ ...prev, marketingEmails: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl">
                <div>
                  <h3 className="text-white font-medium">Product Updates</h3>
                  <p className="text-slate-400 text-sm">Get notified about new features and improvements</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emailPreferences.productUpdates}
                    onChange={(e) => setEmailPreferences(prev => ({ ...prev, productUpdates: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl">
                <div>
                  <h3 className="text-white font-medium">Security Alerts</h3>
                  <p className="text-slate-400 text-sm">Important security notifications and account updates</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emailPreferences.securityAlerts}
                    onChange={(e) => setEmailPreferences(prev => ({ ...prev, securityAlerts: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              <button
                onClick={handleSavePreferences}
                disabled={isSavingPreferences}
                className="w-full px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl hover:from-emerald-700 hover:to-emerald-800 font-semibold transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSavingPreferences ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Saving...</span>
                  </div>
                ) : (
                  'Save Preferences'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Account Management Tab */}
        {activeTab === 'account' && (
          <div className="bg-gradient-to-br from-slate-800/50 to-red-800/20 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 group">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500/40 to-red-600/40 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/20 border border-red-400/30 group-hover:from-red-500/50 group-hover:to-red-600/50 group-hover:shadow-red-500/30 transition-all duration-300">
                <svg className="w-6 h-6 text-red-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '24px', height: '24px' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white">Account Management</h2>
            </div>
            
            <div className="space-y-6">
              {/* Account Information */}
              <div className="bg-slate-700/30 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Account Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-slate-400 text-sm">Email</p>
                    <p className="text-white font-medium">{user.email}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Member Since</p>
                    <p className="text-white font-medium">2025</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Account Status</p>
                    <p className="text-white font-medium">Active</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Role</p>
                    <p className="text-white font-medium">{user.isAdmin ? 'Admin' : 'User'}</p>
                  </div>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-red-400 mb-4">Danger Zone</h3>
                <p className="text-slate-300 mb-4">
                  Once you delete your account, there is no going back. Please be certain.
                </p>
                
                {!showDeleteConfirm ? (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 font-semibold transition-all duration-300 border border-red-500/50"
                  >
                    Delete Account
                  </button>
                ) : (
                  <div className="space-y-4">
                    <p className="text-red-300 font-medium">Are you absolutely sure?</p>
                    <div className="flex space-x-3">
                      <button
                        onClick={handleDeleteAccount}
                        disabled={isDeletingAccount}
                        className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isDeletingAccount ? 'Deleting...' : 'Yes, Delete My Account'}
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="px-6 py-3 bg-slate-600 text-white rounded-xl hover:bg-slate-700 font-semibold transition-all duration-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
