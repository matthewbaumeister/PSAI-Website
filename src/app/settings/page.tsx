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
  newsletter: boolean
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
    newsletter: false,
    productUpdates: true,
    securityAlerts: true
  })

  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isSavingPreferences, setIsSavingPreferences] = useState(false)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Check if user is authenticated and load preferences
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login')
    } else if (user) {
      // Load user preferences
      loadUserPreferences()
    }
  }, [user, isLoading, router])

  const loadUserPreferences = async () => {
    try {
      const response = await fetch('/api/user/preferences')
      if (response.ok) {
        const preferences = await response.json()
        setEmailPreferences(preferences)
      }
    } catch (error) {
      console.error('Failed to load preferences:', error)
    }
  }

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
      const response = await fetch('/api/user/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailPreferences)
      })

      if (response.ok) {
        setMessage('Email preferences saved successfully!')
        setMessageType('success')
      } else {
        const errorData = await response.json()
        setMessage(errorData.message || 'Failed to save preferences')
        setMessageType('error')
      }
    } catch (error) {
      setMessage('An error occurred while saving preferences')
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
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #581c87 50%, #0f172a 100%)',
      color: 'white',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
      {/* Modern Header */}
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: '0 24px', 
        paddingTop: '48px', 
        paddingBottom: '48px' 
      }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          {/* Icon */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.3) 0%, rgba(59, 130, 246, 0.3) 100%)',
            borderRadius: '16px',
            marginBottom: '24px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            border: '1px solid rgba(147, 51, 234, 0.3)'
          }}>
            <svg style={{ width: '40px', height: '40px', color: '#c4b5fd' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          
          {/* Title */}
          <h1 style={{ 
            fontSize: '48px', 
            fontWeight: '700', 
            marginBottom: '16px',
            color: 'white',
            margin: '0 0 16px 0'
          }}>
            Settings
          </h1>
          
          {/* Subtitle */}
          <p style={{ 
            fontSize: '18px', 
            color: '#cbd5e1', 
            marginBottom: '24px', 
            maxWidth: '600px', 
            margin: '0 auto 24px auto',
            lineHeight: '1.6'
          }}>
            Customize your experience, manage security, and control your account preferences
          </p>
          
          {/* User Status */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '12px',
            background: 'rgba(30, 41, 59, 0.5)',
            border: '1px solid rgba(71, 85, 105, 0.5)',
            borderRadius: '9999px',
            padding: '12px 24px'
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              backgroundColor: '#10b981',
              borderRadius: '50%',
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
            }}></div>
            <span style={{ color: '#cbd5e1' }}>Signed in as</span>
            <span style={{ color: 'white', fontWeight: '600' }}>{user.email}</span>
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

        {/* Modern Tab Navigation */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '48px' }}>
          <div style={{
            background: 'rgba(30, 41, 59, 0.5)',
            border: '1px solid rgba(71, 85, 105, 0.5)',
            borderRadius: '12px',
            padding: '8px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
          }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setActiveTab('password')}
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontWeight: '500',
                  transition: 'all 0.2s ease',
                  border: 'none',
                  cursor: 'pointer',
                  background: activeTab === 'password' ? '#2563eb' : 'transparent',
                  color: activeTab === 'password' ? 'white' : '#94a3b8'
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== 'password') {
                    (e.target as HTMLElement).style.background = 'rgba(71, 85, 105, 0.5)';
                    (e.target as HTMLElement).style.color = 'white';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== 'password') {
                    (e.target as HTMLElement).style.background = 'transparent';
                    (e.target as HTMLElement).style.color = '#94a3b8';
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span>Password</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('preferences')}
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontWeight: '500',
                  transition: 'all 0.2s ease',
                  border: 'none',
                  cursor: 'pointer',
                  background: activeTab === 'preferences' ? '#059669' : 'transparent',
                  color: activeTab === 'preferences' ? 'white' : '#94a3b8'
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== 'preferences') {
                    (e.target as HTMLElement).style.background = 'rgba(71, 85, 105, 0.5)';
                    (e.target as HTMLElement).style.color = 'white';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== 'preferences') {
                    (e.target as HTMLElement).style.background = 'transparent';
                    (e.target as HTMLElement).style.color = '#94a3b8';
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Preferences</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('account')}
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontWeight: '500',
                  transition: 'all 0.2s ease',
                  border: 'none',
                  cursor: 'pointer',
                  background: activeTab === 'account' ? '#7c3aed' : 'transparent',
                  color: activeTab === 'password' ? 'white' : '#94a3b8'
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== 'account') {
                    (e.target as HTMLElement).style.background = 'rgba(71, 85, 105, 0.5)';
                    (e.target as HTMLElement).style.color = 'white';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== 'account') {
                    (e.target as HTMLElement).style.background = 'transparent';
                    (e.target as HTMLElement).style.color = '#94a3b8';
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Account</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Password Change Tab - Modern Design */}
        {activeTab === 'password' && (
          <div style={{
            background: 'rgba(30, 41, 59, 0.5)',
            border: '1px solid rgba(71, 85, 105, 0.5)',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: 'rgba(59, 130, 246, 0.3)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg style={{ width: '24px', height: '24px', color: '#93c5fd' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'white', margin: '0 0 4px 0' }}>Change Password</h2>
                <p style={{ color: '#cbd5e1', margin: '0' }}>Keep your account secure</p>
              </div>
            </div>
            
            <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <label style={{ display: 'block', color: '#cbd5e1', fontWeight: '500', marginBottom: '8px' }}>Current Password</label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'rgba(51, 65, 85, 0.5)',
                    border: '1px solid rgba(71, 85, 105, 0.5)',
                    borderRadius: '12px',
                    color: 'white',
                    fontSize: '16px',
                    outline: 'none',
                    transition: 'all 0.2s ease'
                  }}
                  placeholder="Enter your current password"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', color: '#cbd5e1', fontWeight: '500', marginBottom: '8px' }}>New Password</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'rgba(51, 65, 85, 0.5)',
                    border: '1px solid rgba(71, 85, 105, 0.5)',
                    borderRadius: '12px',
                    color: 'white',
                    fontSize: '16px',
                    outline: 'none',
                    transition: 'all 0.2s ease'
                  }}
                  placeholder="Enter your new password"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', color: '#cbd5e1', fontWeight: '500', marginBottom: '8px' }}>Confirm New Password</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'rgba(51, 65, 85, 0.5)',
                    border: '1px solid rgba(71, 85, 105, 0.5)',
                    borderRadius: '12px',
                    color: 'white',
                    fontSize: '16px',
                    outline: 'none',
                    transition: 'all 0.2s ease'
                  }}
                  placeholder="Confirm your new password"
                  required
                />
                <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '8px', margin: '8px 0 0 0' }}>Password must be at least 8 characters long</p>
              </div>

              <button
                type="submit"
                disabled={isChangingPassword}
                style={{
                  width: '100%',
                  padding: '12px 24px',
                  background: '#2563eb',
                  color: 'white',
                  borderRadius: '12px',
                  fontWeight: '600',
                  fontSize: '16px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  opacity: isChangingPassword ? '0.5' : '1'
                }}
                onMouseEnter={(e) => {
                  if (!isChangingPassword) {
                    (e.target as HTMLElement).style.background = '#1d4ed8';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isChangingPassword) {
                    (e.target as HTMLElement).style.background = '#2563eb';
                  }
                }}
              >
                {isChangingPassword ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid white',
                      borderTop: '2px solid transparent',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
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
          <div style={{
            background: 'rgba(30, 41, 59, 0.5)',
            border: '1px solid rgba(71, 85, 105, 0.5)',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: 'rgba(16, 185, 129, 0.3)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg style={{ width: '24px', height: '24px', color: '#6ee7b7' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'white', margin: '0 0 4px 0' }}>Email Preferences</h2>
                <p style={{ color: '#cbd5e1', margin: '0' }}>Manage your notification settings</p>
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{
                padding: '20px',
                background: 'rgba(51, 65, 85, 0.3)',
                borderRadius: '12px',
                border: '1px solid rgba(71, 85, 105, 0.3)'
              }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'white', margin: '0 0 16px 0' }}>Marketing Communications</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <input 
                    type="checkbox" 
                    id="marketing" 
                    checked={emailPreferences.marketingEmails}
                    onChange={(e) => setEmailPreferences(prev => ({ ...prev, marketingEmails: e.target.checked }))}
                    style={{ width: '18px', height: '18px' }} 
                  />
                  <label htmlFor="marketing" style={{ color: '#cbd5e1', cursor: 'pointer' }}>
                    Receive updates about new features and services
                  </label>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input 
                    type="checkbox" 
                    id="newsletter" 
                    checked={emailPreferences.newsletter}
                    onChange={(e) => setEmailPreferences(prev => ({ ...prev, newsletter: e.target.checked }))}
                    style={{ width: '18px', height: '18px' }} 
                  />
                  <label htmlFor="newsletter" style={{ color: '#cbd5e1', cursor: 'pointer' }}>
                    Subscribe to our monthly newsletter
                  </label>
                </div>
              </div>

              <div style={{
                padding: '20px',
                background: 'rgba(51, 65, 85, 0.3)',
                border: '1px solid rgba(71, 85, 105, 0.3)',
                borderRadius: '12px'
              }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'white', margin: '0 0 16px 0' }}>System Notifications</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <input 
                    type="checkbox" 
                    id="security" 
                    checked={emailPreferences.securityAlerts}
                    onChange={(e) => setEmailPreferences(prev => ({ ...prev, securityAlerts: e.target.checked }))}
                    style={{ width: '18px', height: '18px' }} 
                  />
                  <label htmlFor="security" style={{ color: '#cbd5e1', cursor: 'pointer' }}>
                    Security alerts and login notifications
                  </label>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input 
                    type="checkbox" 
                    id="updates" 
                    checked={emailPreferences.productUpdates}
                    onChange={(e) => setEmailPreferences(prev => ({ ...prev, productUpdates: e.target.checked }))}
                    style={{ width: '18px', height: '18px' }} 
                  />
                  <label htmlFor="newsletter" style={{ color: '#cbd5e1', cursor: 'pointer' }}>
                    System updates and maintenance notices
                  </label>
                </div>
              </div>

              <button
                onClick={handleSavePreferences}
                disabled={isSavingPreferences}
                style={{
                  width: '100%',
                  padding: '12px 24px',
                  background: isSavingPreferences ? '#6b7280' : '#059669',
                  color: 'white',
                  borderRadius: '12px',
                  fontWeight: '600',
                  fontSize: '16px',
                  border: 'none',
                  cursor: isSavingPreferences ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  opacity: isSavingPreferences ? 0.7 : 1
                }}
                onMouseEnter={(e) => {
                  if (!isSavingPreferences) {
                    (e.target as HTMLElement).style.background = '#047857';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSavingPreferences) {
                    (e.target as HTMLElement).style.background = '#059669';
                  }
                }}
              >
                {isSavingPreferences ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid white',
                      borderTop: '2px solid transparent',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
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
          <div style={{
            background: 'rgba(30, 41, 59, 0.5)',
            border: '1px solid rgba(71, 85, 105, 0.5)',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: 'rgba(124, 58, 237, 0.3)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg style={{ width: '24px', height: '24px', color: '#c4b5fd' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'white', margin: '0 0 4px 0' }}>Account Management</h2>
                <p style={{ color: '#cbd5e1', margin: '0' }}>Manage your account settings and data</p>
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{
                padding: '20px',
                background: 'rgba(51, 65, 85, 0.3)',
                borderRadius: '12px',
                border: '1px solid rgba(71, 85, 105, 0.3)'
              }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'white', margin: '0 0 16px 0' }}>Account Information</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  <div>
                    <p style={{ color: '#94a3b8', fontSize: '14px', margin: '0 0 4px 0' }}>Email</p>
                    <p style={{ color: 'white', fontWeight: '500', margin: '0' }}>{user.email}</p>
                  </div>
                  <div>
                    <p style={{ color: '#94a3b8', fontSize: '14px', margin: '0 0 4px 0' }}>Member Since</p>
                    <p style={{ color: 'white', fontWeight: '500', margin: '0' }}>2025</p>
                  </div>
                  <div>
                    <p style={{ color: '#94a3b8', fontSize: '14px', margin: '0 0 4px 0' }}>Account Status</p>
                    <p style={{ color: 'white', fontWeight: '500', margin: '0' }}>Active</p>
                  </div>
                  <div>
                    <p style={{ color: '#94a3b8', fontSize: '14px', margin: '0 0 4px 0' }}>Role</p>
                    <p style={{ color: 'white', fontWeight: '500', margin: '0' }}>{user.isAdmin ? 'Admin' : 'User'}</p>
                  </div>
                </div>
              </div>

              <div style={{
                padding: '20px',
                background: 'rgba(239, 68, 68, 0.1)',
                borderRadius: '12px',
                border: '1px solid rgba(239, 68, 68, 0.2)'
              }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#fca5a5', margin: '0 0 16px 0' }}>Danger Zone</h3>
                <p style={{ color: '#fecaca', margin: '0 0 16px 0', fontSize: '14px' }}>
                  Once you delete your account, there is no going back. Please be certain.
                </p>
                <button
                  style={{
                    padding: '8px 16px',
                    background: '#dc2626',
                    color: 'white',
                    borderRadius: '8px',
                    fontWeight: '500',
                    fontSize: '14px',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    (e.target as HTMLElement).style.background = '#b91c1c';
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLElement).style.background = '#dc2626';
                  }}
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
