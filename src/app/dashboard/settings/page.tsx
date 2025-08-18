'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

interface ProfileData {
  first_name?: string
  last_name?: string
  company?: string
  role?: string
  phone?: string
  bio?: string
  theme_preference?: 'light' | 'dark'
  email_notifications?: boolean
  admin_notifications?: boolean
  meeting_notifications?: boolean
}

export default function SettingsPage() {
  const { user, signOut } = useAuth()
  const [profile, setProfile] = useState<ProfileData>({})
  const [originalProfile, setOriginalProfile] = useState<ProfileData>({})
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    marketingEmails: false,
    twoFactorAuth: false,
    language: 'en',
    timezone: 'UTC'
  })
  const [originalSettings, setOriginalSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    marketingEmails: false,
    twoFactorAuth: false,
    language: 'en',
    timezone: 'UTC'
  })
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [saveMessageType, setSaveMessageType] = useState<'success' | 'error'>('success')
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'preferences' | 'security'>('profile')
  
  // 2FA Setup Modal State
  const [show2FAModal, setShow2FAModal] = useState(false)
  const [twoFASetupStep, setTwoFASetupStep] = useState<'qr' | 'verify'>('qr')
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [is2FASetupLoading, setIs2FASetupLoading] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  const [emailVerified, setEmailVerified] = useState(false)

  // Phone number formatting functions
  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const phoneNumber = value.replace(/\D/g, '')
    
    // Format based on length
    if (phoneNumber.length === 0) return ''
    if (phoneNumber.length <= 3) return `(${phoneNumber}`
    if (phoneNumber.length <= 6) return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`
    if (phoneNumber.length <= 10) return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6)}`
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`
  }

  const unformatPhoneNumber = (value: string) => {
    // Remove all non-digits for storage
    return value.replace(/\D/g, '')
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value)
    setProfile(prev => ({ ...prev, phone: formatted }))
  }

  useEffect(() => {
    if (user) {
      // Clear any old deleted records first
      clearOldDeletedRecords()
      loadProfile()
      loadSettings()
      checkEmailVerification()
    }
  }, [user])

  const clearOldDeletedRecords = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return

      // Clear any old deleted records for this user (only if tables have deleted_at column)
      try {
        await supabase
          .from('user_profiles')
          .update({ deleted_at: null })
          .eq('user_id', session.user.id)
          .not('deleted_at', 'is', null)
      } catch (error) {
        // Column might not exist yet, ignore error
        console.log('deleted_at column not available yet')
      }

      try {
        await supabase
          .from('user_settings')
          .update({ deleted_at: null })
          .eq('user_id', session.user.id)
          .not('deleted_at', 'is', null)
      } catch (error) {
        // Column might not exist yet, ignore error
        console.log('deleted_at column not available yet')
      }

    } catch (error) {
      console.error('Error clearing old deleted records:', error)
    }
  }

  const loadProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      // Try to load profile directly from Supabase first
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single()

      if (profileError) {
        console.error('Error loading profile:', profileError)
        // Try to create a default profile
        await createNewProfile()
      } else {
        console.log('Profile loaded successfully:', profile)
        // Format the phone number for display
        const formattedProfile = {
          ...profile,
          phone: profile.phone ? formatPhoneNumber(profile.phone) : ''
        }
        setProfile(formattedProfile)
        setOriginalProfile(formattedProfile) // Store original values for change detection
      }
    } catch (error) {
      console.error('Error loading profile:', error)
      // Try to create a default profile on error
      await createNewProfile()
    }
  }

  const createNewProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return

      // Try to upsert (insert or update) the profile to handle conflicts
      const profileData = {
        user_id: session.user.id,
        first_name: session.user.user_metadata?.name || session.user.user_metadata?.full_name || session.user.email!.split('@')[0],
        last_name: '',
        company: '',
        role: 'user',
        phone: '',
        bio: '',
        theme_preference: 'dark',
        email_notifications: true,
        admin_notifications: false,
        meeting_notifications: false
      }

      // Try to upsert with deleted_at first (if column exists)
      try {
        const { data: newProfile, error } = await supabase
          .from('user_profiles')
          .upsert({
            ...profileData,
            deleted_at: null
          }, {
            onConflict: 'user_id'
          })
          .select()
          .single()

        if (error) {
          console.error('Error upserting profile with deleted_at:', error)
          // Try without deleted_at field
          const { data: newProfileWithoutDeleted, error: error2 } = await supabase
            .from('user_profiles')
            .upsert(profileData, {
              onConflict: 'user_id'
            })
            .select()
            .single()

          if (error2) {
            console.error('Error upserting profile without deleted_at:', error2)
            // If there's still an error, try to get the existing profile
            const { data: existingProfile, error: fetchError } = await supabase
              .from('user_profiles')
              .select('*')
              .eq('user_id', session.user.id)
              .single()

            if (fetchError) {
              console.error('Error fetching existing profile:', fetchError)
              // Set default profile data as fallback
              const defaultProfile = {
                first_name: session.user.user_metadata?.name || session.user.user_metadata?.full_name || session.user.email!.split('@')[0],
                last_name: '',
                company: '',
                role: 'user',
                phone: '',
                bio: '',
                theme_preference: 'dark' as const,
                email_notifications: true,
                admin_notifications: false,
                meeting_notifications: false
              }
              setProfile(defaultProfile)
              setOriginalProfile(defaultProfile)
            } else {
              // Use existing profile data
              setProfile(existingProfile)
              setOriginalProfile(existingProfile)
            }
          } else {
            setProfile(newProfileWithoutDeleted)
            setOriginalProfile(newProfileWithoutDeleted)
          }
        } else {
          setProfile(newProfile)
          setOriginalProfile(newProfile)
        }
      } catch (error) {
        console.error('Error in createNewProfile:', error)
        // Set default profile data as fallback
        const defaultProfile = {
          first_name: session.user.user_metadata?.name || session.user.user_metadata?.full_name || session.user.email!.split('@')[0],
          last_name: '',
          company: '',
          role: 'user',
          phone: '',
          bio: '',
          theme_preference: 'dark' as const,
          email_notifications: true,
          admin_notifications: false,
          meeting_notifications: false
        }
        setProfile(defaultProfile)
        setOriginalProfile(defaultProfile)
      }
    } catch (error) {
      console.error('Error in createNewProfile:', error)
    }
  }

  const checkEmailVerification = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user?.email_confirmed_at) {
        setEmailVerified(true)
      } else {
        setEmailVerified(false)
      }
    } catch (error) {
      console.error('Error checking email verification:', error)
    }
  }

  const loadSettings = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch('/api/settings', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
        setOriginalSettings(data) // Store original values for change detection
      } else if (response.status === 403) {
        // Settings access denied, try to create default settings
        console.log('Settings access denied, creating default settings...')
        await createDefaultSettings()
      } else {
        console.error('Failed to load settings:', response.status)
        // Set default settings if none exist
        await createDefaultSettings()
      }
    } catch (error) {
      console.error('Error loading settings:', error)
      // Set default settings on error
      await createDefaultSettings()
    }
  }

  const createDefaultSettings = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return

      // Try to upsert default settings to handle conflicts
      const { data: newSettings, error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: session.user.id,
          email_notifications: true,
          push_notifications: false,
          marketing_emails: false,
          two_factor_auth: false,
          language: 'en',
          timezone: 'UTC',
          theme_preference: 'dark'
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single()

      if (error) {
        console.error('Error upserting default settings:', error)
        // Try to get existing settings
        const { data: existingSettings, error: fetchError } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', session.user.id)
          .single()

        if (fetchError) {
          console.error('Error fetching existing settings:', fetchError)
        } else if (existingSettings) {
          // Use existing settings data
          const mappedSettings = {
            emailNotifications: existingSettings.email_notifications || true,
            pushNotifications: existingSettings.push_notifications || false,
            marketingEmails: existingSettings.marketing_emails || false,
            twoFactorAuth: existingSettings.two_factor_auth || false,
            language: existingSettings.language || 'en',
            timezone: existingSettings.timezone || 'UTC'
          }
          setSettings(mappedSettings)
          setOriginalSettings(mappedSettings)
          return
        }
      }

      // Set default settings regardless of database creation success
      const defaultSettings = {
        emailNotifications: true,
        pushNotifications: false,
        marketingEmails: false,
        twoFactorAuth: false,
        language: 'en',
        timezone: 'UTC'
      }
      setSettings(defaultSettings)
      setOriginalSettings(defaultSettings)
    } catch (error) {
      console.error('Error in createDefaultSettings:', error)
      // Set default settings even on error
      const defaultSettings = {
        emailNotifications: true,
        pushNotifications: false,
        marketingEmails: false,
        twoFactorAuth: false,
        language: 'en',
        timezone: 'UTC'
      }
      setSettings(defaultSettings)
      setOriginalSettings(defaultSettings)
    }
  }

  const handleProfileSave = async () => {
    setIsSaving(true)
    setSaveMessage('')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setSaveMessage('Not authenticated')
        return
      }

      // Unformat the phone number before saving
      const profileToSave = {
        ...profile,
        phone: profile.phone ? unformatPhoneNumber(profile.phone) : ''
      }

      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(profileToSave),
      })

      if (response.ok) {
        setSaveMessageType('success')
        setSaveMessage('Profile updated successfully!')
        setOriginalProfile(profile) // Reset original values after successful save
        setTimeout(() => setSaveMessage(''), 3000)
      } else {
        setSaveMessageType('error')
        setSaveMessage('Error updating profile')
      }
    } catch (error) {
      setSaveMessageType('error')
      setSaveMessage('Error updating profile')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSettingsSave = async () => {
    setIsSaving(true)
    setSaveMessage('')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setSaveMessage('Not authenticated')
        return
      }

      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(settings),
      })

      if (response.ok) {
        setSaveMessageType('success')
        setSaveMessage('Settings saved successfully!')
        setOriginalSettings(settings) // Reset original values after successful save
        setTimeout(() => setSaveMessage(''), 3000)
      } else {
        setSaveMessageType('error')
        setSaveMessage('Error saving settings')
      }
    } catch (error) {
      setSaveMessageType('error')
      setSaveMessage('Error saving settings')
    } finally {
      setIsSaving(false)
    }
  }

  const handleInputChange = (field: keyof ProfileData, value: string | boolean) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSettingChange = (setting: keyof typeof settings, value: string | boolean) => {
    setSettings(prev => ({
      ...prev,
      [setting]: value
    }))
  }

  // Check if profile has changes
  const hasProfileChanges = () => {
    return Object.keys(profile).some(key => {
      const field = key as keyof ProfileData
      return profile[field] !== originalProfile[field]
    })
  }

  // Check if settings have changes
  const hasSettingsChanges = () => {
    return Object.keys(settings).some(key => {
      const field = key as keyof typeof settings
      return settings[field] !== originalSettings[field]
    })
  }

  // Check if current tab has changes
  const hasCurrentTabChanges = () => {
    switch (activeTab) {
      case 'profile':
        return hasProfileChanges()
      case 'notifications':
      case 'preferences':
      case 'security':
        return hasSettingsChanges()
      default:
        return false
    }
  }

  // 2FA Setup Functions
  const handle2FAToggle = async (enabled: boolean) => {
    if (enabled) {
      // Enable 2FA - show setup modal
      setShow2FAModal(true)
      setTwoFASetupStep('qr')
      await generate2FAQRCode()
    } else {
      // Disable 2FA
      const newSettings = { ...settings, twoFactorAuth: false }
      setSettings(newSettings)
    }
  }

  const generate2FAQRCode = async () => {
    setIs2FASetupLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      // This would call your backend to generate a 2FA secret and QR code
      // For now, we'll simulate it with a placeholder
      setQrCodeUrl('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2ZmZiIvPjx0ZXh0IHg9IjEwMCIgeT0iMTAwIiBmb250LWZtaWxseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiMwMDAiIHRleHQtYW5jaG9yPSJtaWRkbGUiPjJGQSBRUiBDb2RlPC90ZXh0Pjwvc3ZnPg==')
      setIs2FASetupLoading(false)
    } catch (error) {
      console.error('Error generating 2FA QR code:', error)
      setIs2FASetupLoading(false)
    }
  }

  const verify2FACode = async () => {
    if (!verificationCode || verificationCode.length !== 6) return
    
    setIs2FASetupLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      // This would call your backend to verify the 2FA code
      // For now, we'll simulate success
      setTimeout(() => {
        const newSettings = { ...settings, twoFactorAuth: true }
        setSettings(newSettings)
        setShow2FAModal(false)
        setVerificationCode('')
        setTwoFASetupStep('qr')
        setIs2FASetupLoading(false)
        setSaveMessageType('success')
        setSaveMessage('Two-factor authentication enabled successfully!')
        setTimeout(() => setSaveMessage(''), 3000)
      }, 1000)
    } catch (error) {
      console.error('Error verifying 2FA code:', error)
      setIs2FASetupLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
            if (!confirm('Are you absolutely sure you want to delete your account? This action cannot be undone. Your account will be completely removed and you will need to sign up again if you want to rejoin.')) {
          return
        }
    
    setIsDeletingAccount(true)
    
    try {
      // Get current session
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('No active session')
      }
      
      // Delete user profile and settings from database
      const response = await fetch('/api/profile', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      
      if (response.ok) {
        // Sign out the user
        await signOut()
        
        // Redirect to home page
        window.location.href = '/'
      } else {
        throw new Error('Failed to delete account')
      }
    } catch (error) {
      console.error('Error deleting account:', error)
      alert('Failed to delete account. Please try again.')
    } finally {
      setIsDeletingAccount(false)
      setShowDeleteModal(false)
    }
  }

  if (!user) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white'
      }}>
        <div>Please sign in to view your settings.</div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      color: 'white',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      lineHeight: 1.6,
      margin: 0,
      padding: 0,
      boxSizing: 'border-box'
    }}>
      <div style={{
        maxWidth: '1000px',
        margin: '0 auto',
        padding: '2rem 1rem'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{
            height: '1px',
            width: '48px',
            background: 'linear-gradient(to right, #9AF23A, #2D5BFF)'
          }}></div>
          <span style={{
            fontSize: '0.875rem',
            fontWeight: 500,
            color: '#9AF23A',
            textTransform: 'uppercase',
            letterSpacing: '0.1em'
          }}>
            SETTINGS
          </span>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '2rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '2rem'
          }}>
            <Link href="/dashboard" style={{
              padding: '0.75rem 1.5rem',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '0.5rem',
              color: 'white',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: 500,
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'
            }}>
              ← Back to Dashboard
            </Link>
            <h1 style={{
              fontSize: '2.5rem',
              fontWeight: 800,
              lineHeight: 1.1,
              color: 'white',
              margin: 0
            }}>
              Account Settings
            </h1>
          </div>
        </div>

        {/* Save Message */}
        {saveMessage && (
          <div style={{
            padding: '1rem',
            marginBottom: '2rem',
            background: saveMessageType === 'success' ? 'rgba(154, 242, 58, 0.1)' : 'rgba(255, 122, 41, 0.1)',
            border: `1px solid ${saveMessageType === 'success' ? 'rgba(154, 242, 58, 0.3)' : 'rgba(255, 122, 41, 0.3)'}`,
            borderRadius: '0.5rem',
            color: saveMessageType === 'success' ? '#9AF23A' : '#FF7A29',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            {saveMessageType === 'success' ? (
              <span style={{ fontSize: '1.25rem' }}>✅</span>
            ) : (
              <span style={{ fontSize: '1.25rem' }}>⚠️</span>
            )}
            {saveMessage}
          </div>
        )}

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '2rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          paddingBottom: '1rem'
        }}>
          {[
            { id: 'profile', label: 'Profile Information' },
            { id: 'notifications', label: 'Notifications' },
            { id: 'preferences', label: 'Preferences' },
            { id: 'security', label: 'Security' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'profile' | 'notifications' | 'preferences' | 'security')}
              style={{
                padding: '0.75rem 1.5rem',
                background: activeTab === tab.id ? 'rgba(154, 242, 58, 0.2)' : 'transparent',
                border: `1px solid ${activeTab === tab.id ? 'rgba(154, 242, 58, 0.4)' : 'rgba(255, 255, 255, 0.1)'}`,
                borderRadius: '0.5rem',
                color: activeTab === tab.id ? '#9AF23A' : 'white',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 500,
                transition: 'all 0.2s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Profile Information Tab */}
        {activeTab === 'profile' && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '1rem',
            padding: '2rem',
            marginBottom: '2rem'
          }}>
            {/* Email Verification Section */}
            {!emailVerified && (
              <div style={{
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '0.75rem',
                padding: '1.5rem',
                marginBottom: '2rem'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  marginBottom: '1rem'
                }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    background: '#3B82F6',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <span style={{ color: 'white', fontSize: '14px', fontWeight: 'bold' }}>!</span>
                  </div>
                  <h3 style={{
                    fontSize: '1.125rem',
                    fontWeight: 600,
                    color: '#3B82F6',
                    margin: 0
                  }}>
                    Complete Account Setup
                  </h3>
                </div>
                <p style={{
                  color: '#93C5FD',
                  fontSize: '0.875rem',
                  lineHeight: '1.5',
                  marginBottom: '1rem'
                }}>
                  Please verify your email address to complete your account setup and access all features.
                </p>
                <button
                  onClick={() => window.location.href = '/auth/verify-email'}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: '#3B82F6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#2563EB'}
                  onMouseLeave={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#3B82F6'}
                >
                  Verify Email Now
                </button>
              </div>
            )}

            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: 'white',
              marginBottom: '1.5rem'
            }}>
              Personal Information
            </h2>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1.5rem',
              marginBottom: '2rem'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: '#9CA3AF'
                }}>
                  First Name
                </label>
                <input
                  type="text"
                  value={profile.first_name || ''}
                  onChange={(e) => handleInputChange('first_name', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '0.5rem',
                    color: 'white',
                    fontSize: '0.875rem'
                  }}
                  placeholder="Enter your first name"
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: '#9CA3AF'
                }}>
                  Last Name
                </label>
                <input
                  type="text"
                  value={profile.last_name || ''}
                  onChange={(e) => handleInputChange('last_name', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '0.5rem',
                    color: 'white',
                    fontSize: '0.875rem'
                  }}
                  placeholder="Enter your last name"
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: '#9CA3AF'
                }}>
                  Company
                </label>
                <input
                  type="text"
                  value={profile.company || ''}
                  onChange={(e) => handleInputChange('company', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '0.5rem',
                    color: 'white',
                    fontSize: '0.875rem'
                  }}
                  placeholder="Enter your company name"
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: '#9CA3AF'
                }}>
                  Role
                </label>
                <input
                  type="text"
                  value={profile.role || ''}
                  onChange={(e) => handleInputChange('role', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '0.5rem',
                    color: 'white',
                    fontSize: '0.875rem'
                  }}
                  placeholder="Enter your role"
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: '#9CA3AF'
                }}>
                  Phone
                </label>
                <input
                  type="tel"
                  value={profile.phone || ''}
                  onChange={handlePhoneChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '0.5rem',
                    color: 'white',
                    fontSize: '0.875rem'
                  }}
                  placeholder="Enter your phone number"
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: '#9CA3AF'
                }}>
                  Bio
                </label>
                <textarea
                  value={profile.bio || ''}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '0.5rem',
                    color: 'white',
                    fontSize: '0.875rem',
                    resize: 'vertical'
                  }}
                  placeholder="Tell us about yourself"
                />
              </div>
            </div>

            <button
              onClick={handleProfileSave}
              disabled={isSaving || !hasProfileChanges()}
              style={{
                padding: '0.75rem 2rem',
                background: hasProfileChanges() ? 'linear-gradient(135deg, #2D5BFF, #9AF23A)' : 'rgba(128, 128, 128, 0.3)',
                border: 'none',
                borderRadius: '0.5rem',
                color: 'white',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: (isSaving || !hasProfileChanges()) ? 'not-allowed' : 'pointer',
                opacity: (isSaving || !hasProfileChanges()) ? 0.6 : 1,
                transition: 'all 0.2s ease'
              }}
            >
              {isSaving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '1rem',
            padding: '2rem',
            marginBottom: '2rem'
          }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: 'white',
              marginBottom: '1.5rem'
            }}>
              Notification Preferences
            </h2>
            
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              marginBottom: '2rem'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '0.5rem'
              }}>
                <div>
                  <h3 style={{ color: 'white', marginBottom: '0.25rem' }}>Email Notifications</h3>
                  <p style={{ color: '#9CA3AF', fontSize: '0.875rem' }}>Receive important updates via email</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.emailNotifications}
                  onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                  style={{
                    width: '1.25rem',
                    height: '1.25rem',
                    accentColor: '#9AF23A'
                  }}
                />
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '0.5rem'
              }}>
                <div>
                  <h3 style={{ color: 'white', marginBottom: '0.25rem' }}>Push Notifications</h3>
                  <p style={{ color: '#9CA3AF', fontSize: '0.875rem' }}>Get real-time alerts in your browser</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.pushNotifications}
                  onChange={(e) => handleSettingChange('pushNotifications', e.target.checked)}
                  style={{
                    width: '1.25rem',
                    height: '1.25rem',
                    accentColor: '#9AF23A'
                  }}
                />
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '0.5rem'
              }}>
                <div>
                  <h3 style={{ color: 'white', marginBottom: '0.25rem' }}>Marketing Emails</h3>
                  <p style={{ color: '#9CA3AF', fontSize: '0.875rem' }}>Receive updates about new features and offers</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.marketingEmails}
                  onChange={(e) => handleSettingChange('marketingEmails', e.target.checked)}
                  style={{
                    width: '1.25rem',
                    height: '1.25rem',
                    accentColor: '#9AF23A'
                  }}
                />
              </div>
            </div>

            <button
              onClick={handleSettingsSave}
              disabled={isSaving || !hasSettingsChanges()}
              style={{
                padding: '0.75rem 2rem',
                background: hasSettingsChanges() ? 'linear-gradient(135deg, #2D5BFF, #9AF23A)' : 'rgba(128, 128, 128, 0.3)',
                border: 'none',
                borderRadius: '0.5rem',
                color: 'white',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: (isSaving || !hasSettingsChanges()) ? 'not-allowed' : 'pointer',
                opacity: (isSaving || !hasSettingsChanges()) ? 0.6 : 1,
                transition: 'all 0.2s ease'
              }}
            >
              {isSaving ? 'Saving...' : 'Save Notifications'}
            </button>
          </div>
        )}

        {/* Preferences Tab */}
        {activeTab === 'preferences' && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '1rem',
            padding: '2rem',
            marginBottom: '2rem'
          }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: 'white',
              marginBottom: '1.5rem'
            }}>
              User Preferences
            </h2>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1.5rem',
              marginBottom: '2rem'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: '#9CA3AF'
                }}>
                  Language
                </label>
                <select
                  value={settings.language}
                  onChange={(e) => handleSettingChange('language', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '0.5rem',
                    color: 'white',
                    fontSize: '0.875rem'
                  }}
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                </select>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: '#9CA3AF'
                }}>
                  Timezone
                </label>
                <select
                  value={settings.timezone}
                  onChange={(e) => handleSettingChange('timezone', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '0.5rem',
                    color: 'white',
                    fontSize: '0.875rem'
                  }}
                >
                  <option value="UTC">UTC</option>
                  <option value="EST">Eastern Time</option>
                  <option value="CST">Central Time</option>
                  <option value="MST">Mountain Time</option>
                  <option value="PST">Pacific Time</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleSettingsSave}
              disabled={isSaving || !hasSettingsChanges()}
              style={{
                padding: '0.75rem 2rem',
                background: hasSettingsChanges() ? 'linear-gradient(135deg, #2D5BFF, #9AF23A)' : 'rgba(128, 128, 128, 0.3)',
                border: 'none',
                borderRadius: '0.5rem',
                color: 'white',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: (isSaving || !hasSettingsChanges()) ? 'not-allowed' : 'pointer',
                opacity: (isSaving || !hasSettingsChanges()) ? 0.6 : 1,
                transition: 'all 0.2s ease'
              }}
            >
              {isSaving ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '1rem',
            padding: '2rem',
            marginBottom: '2rem'
          }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: 'white',
              marginBottom: '1.5rem'
            }}>
              Security Settings
            </h2>
            
            {/* Email Verification Status */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1.5rem',
              background: emailVerified ? 'rgba(154, 242, 58, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              borderRadius: '0.5rem',
              border: `1px solid ${emailVerified ? 'rgba(154, 242, 58, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              marginBottom: '1.5rem'
            }}>
              <div>
                <h3 style={{ 
                  color: emailVerified ? '#9AF23A' : '#FCA5A5', 
                  marginBottom: '0.5rem', 
                  fontSize: '1rem', 
                  fontWeight: 600 
                }}>
                  Email Verification Status
                </h3>
                <p style={{ 
                  color: emailVerified ? '#86EFAC' : '#FCA5A5', 
                  fontSize: '0.875rem', 
                  margin: 0 
                }}>
                  {emailVerified 
                    ? 'Your email address has been verified and your account is fully active.' 
                    : 'Please verify your email address to complete your account setup and access all features.'
                  }
                </p>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  background: emailVerified ? '#9AF23A' : '#EF4444',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {emailVerified ? (
                    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span style={{ color: 'white', fontSize: '10px', fontWeight: 'bold' }}>!</span>
                  )}
                </div>
                {!emailVerified && (
                  <button
                    onClick={() => window.location.href = '/auth/verify-email'}
                    style={{
                      padding: '0.5rem 1rem',
                      background: '#EF4444',
                      border: '1px solid rgba(239, 68, 68, 0.4)',
                      borderRadius: '0.25rem',
                      color: 'white',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#DC2626'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#EF4444'}
                  >
                    Verify Now
                  </button>
                )}
              </div>
            </div>
            
            {/* Change Password Section */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1.5rem',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '0.5rem',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              marginBottom: '1.5rem'
            }}>
              <div>
                <h3 style={{ color: 'white', marginBottom: '0.5rem', fontSize: '1rem', fontWeight: 600 }}>Password</h3>
                <p style={{ color: '#9CA3AF', fontSize: '0.875rem', margin: 0 }}>Change your account password for enhanced security</p>
              </div>
              <button
                onClick={() => window.location.href = '/auth/forgot-password'}
                style={{
                  padding: '0.5rem 1rem',
                  background: 'rgba(45, 91, 255, 0.2)',
                  border: '1px solid rgba(45, 91, 255, 0.4)',
                  borderRadius: '0.25rem',
                  color: '#2D5BFF',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(45, 91, 255, 0.3)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(45, 91, 255, 0.2)'}
              >
                Change Password
              </button>
            </div>
            
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
              marginBottom: '2rem'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1.5rem',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '0.5rem',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <div>
                  <h3 style={{ color: 'white', marginBottom: '0.5rem', fontSize: '1rem', fontWeight: 600 }}>Two-Factor Authentication</h3>
                  <p style={{ color: '#9CA3AF', fontSize: '0.875rem', margin: 0 }}>Add an extra layer of security to your account</p>
                </div>
                <button
                  onClick={() => handle2FAToggle(!settings.twoFactorAuth)}
                  style={{
                    padding: '0.5rem 1rem',
                    background: settings.twoFactorAuth ? 'rgba(154, 242, 58, 0.2)' : 'rgba(45, 91, 255, 0.2)',
                    border: `1px solid ${settings.twoFactorAuth ? 'rgba(154, 242, 58, 0.4)' : 'rgba(45, 91, 255, 0.4)'}`,
                    borderRadius: '0.25rem',
                    color: settings.twoFactorAuth ? '#9AF23A' : '#2D5BFF',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    transition: 'all 0.2s ease'
                  }}
                >
                  {settings.twoFactorAuth ? 'Turn Off' : 'Turn On'}
                </button>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1.5rem',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '0.5rem',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <div>
                  <h3 style={{ color: 'white', marginBottom: '0.5rem', fontSize: '1rem', fontWeight: 600 }}>Session Management</h3>
                  <p style={{ color: '#9CA3AF', fontSize: '0.875rem', margin: 0 }}>Manage active sessions and device access</p>
                </div>
                <button
                  onClick={() => {
                    // This would typically open a modal or navigate to session management
                    alert('Session management feature coming soon!')
                  }}
                  style={{
                    padding: '0.5rem 1rem',
                    background: 'rgba(45, 91, 255, 0.2)',
                    border: '1px solid rgba(45, 91, 255, 0.4)',
                    borderRadius: '0.25rem',
                    color: '#2D5BFF',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: 500
                  }}
                >
                  Manage Sessions
                </button>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1.5rem',
                background: 'rgba(255, 122, 41, 0.1)',
                border: '1px solid rgba(255, 122, 41, 0.3)',
                borderRadius: '0.5rem',
                color: '#FF7A29'
              }}>
                <div>
                  <h4 style={{ marginBottom: '0.5rem', fontSize: '1rem', fontWeight: 600 }}>Password Change</h4>
                  <p style={{ fontSize: '0.875rem', margin: 0 }}>
                    Update your account password for enhanced security
                  </p>
                </div>
                <button
                  onClick={() => {
                    // This would typically open a password change modal or navigate to password change page
                    alert('Password change feature coming soon!')
                  }}
                  style={{
                    padding: '0.5rem 1rem',
                    background: 'rgba(255, 122, 41, 0.2)',
                    border: '1px solid rgba(255, 122, 41, 0.4)',
                    borderRadius: '0.25rem',
                    color: '#FF7A29',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: 500
                  }}
                >
                  Change Password
                </button>
              </div>
            </div>

            {/* Delete Account Section */}
            <div style={{
              marginTop: '1.5rem',
              marginBottom: '2rem',
              padding: '1.5rem',
              background: 'rgba(220, 38, 38, 0.1)',
              border: '1px solid rgba(220, 38, 38, 0.3)',
              borderRadius: '0.5rem'
            }}>
              <h3 style={{
                color: '#dc2626',
                marginBottom: '0.5rem',
                fontSize: '1rem',
                fontWeight: 600
              }}>
                Delete Account
              </h3>
              <p style={{
                color: '#fca5a5',
                fontSize: '0.875rem',
                marginBottom: '1rem',
                lineHeight: '1.5'
              }}>
                This action cannot be undone. This will permanently delete your account, 
                profile, and all associated data. You will need to sign up again if you want to rejoin. Please be certain.
              </p>
              <button
                onClick={() => setShowDeleteModal(true)}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#b91c1c'}
                onMouseLeave={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#dc2626'}
              >
                Delete My Account
              </button>
            </div>

            <button
              onClick={handleSettingsSave}
              disabled={isSaving || !hasSettingsChanges()}
              style={{
                padding: '0.75rem 2rem',
                background: hasSettingsChanges() ? 'linear-gradient(135deg, #2D5BFF, #9AF23A)' : 'rgba(128, 128, 128, 0.3)',
                border: 'none',
                borderRadius: '0.5rem',
                color: 'white',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: (isSaving || !hasSettingsChanges()) ? 'not-allowed' : 'pointer',
                opacity: (isSaving || !hasSettingsChanges()) ? 0.6 : 1,
                transition: 'all 0.2s ease'
              }}
            >
              {isSaving ? 'Saving...' : 'Save Security Settings'}
            </button>
          </div>
        )}

        {/* 2FA Setup Modal */}
        {show2FAModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: 'rgba(11, 18, 32, 0.95)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '1rem',
              padding: '2rem',
              maxWidth: '500px',
              width: '90%',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem'
              }}>
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  color: 'white',
                  margin: 0
                }}>
                  Set Up Two-Factor Authentication
                </h2>
                <button
                  onClick={() => setShow2FAModal(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#9CA3AF',
                    fontSize: '1.5rem',
                    cursor: 'pointer',
                    padding: '0.25rem'
                  }}
                >
                  ×
                </button>
              </div>

              {twoFASetupStep === 'qr' && (
                <div>
                  <p style={{ color: '#9CA3AF', marginBottom: '1.5rem' }}>
                    Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                  </p>
                  
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    marginBottom: '1.5rem'
                  }}>
                    {is2FASetupLoading ? (
                      <div style={{
                        width: '200px',
                        height: '200px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#9CA3AF'
                      }}>
                        Loading QR Code...
                      </div>
                    ) : (
                      <img 
                        src={qrCodeUrl} 
                        alt="2FA QR Code" 
                        style={{
                          width: '200px',
                          height: '200px',
                          borderRadius: '0.5rem'
                        }}
                      />
                    )}
                  </div>

                  <div style={{
                    background: 'rgba(154, 242, 58, 0.1)',
                    border: '1px solid rgba(154, 242, 58, 0.3)',
                    borderRadius: '0.5rem',
                    padding: '1rem',
                    marginBottom: '1.5rem'
                  }}>
                    <h4 style={{ color: '#9AF23A', marginBottom: '0.5rem' }}>Setup Instructions:</h4>
                    <ol style={{ color: '#9CA3AF', fontSize: '0.875rem', margin: 0, paddingLeft: '1rem' }}>
                      <li>Download an authenticator app (Google Authenticator, Authy, etc.)</li>
                      <li>Scan the QR code above</li>
                      <li>Enter the 6-digit code from your app</li>
                    </ol>
                  </div>

                  <button
                    onClick={() => setTwoFASetupStep('verify')}
                    disabled={is2FASetupLoading}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: 'linear-gradient(135deg, #2D5BFF, #9AF23A)',
                      border: 'none',
                      borderRadius: '0.5rem',
                      color: 'white',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      cursor: is2FASetupLoading ? 'not-allowed' : 'pointer',
                      opacity: is2FASetupLoading ? 0.6 : 1
                    }}
                  >
                    I&apos;ve Scanned the QR Code
                  </button>
                </div>
              )}

              {twoFASetupStep === 'verify' && (
                <div>
                  <p style={{ color: '#9CA3AF', marginBottom: '1.5rem' }}>
                    Enter the 6-digit verification code from your authenticator app
                  </p>
                  
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '0.5rem',
                      color: 'white',
                      fontSize: '1.25rem',
                      textAlign: 'center',
                      letterSpacing: '0.5rem',
                      marginBottom: '1.5rem'
                    }}
                    maxLength={6}
                  />

                  <div style={{
                    display: 'flex',
                    gap: '1rem'
                  }}>
                    <button
                      onClick={() => setTwoFASetupStep('qr')}
                      style={{
                        flex: 1,
                        padding: '0.75rem',
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '0.5rem',
                        color: 'white',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        cursor: 'pointer'
                      }}
                    >
                      Back
                    </button>
                    <button
                      onClick={verify2FACode}
                      disabled={verificationCode.length !== 6 || is2FASetupLoading}
                      style={{
                        flex: 1,
                        padding: '0.75rem',
                        background: 'linear-gradient(135deg, #2D5BFF, #9AF23A)',
                        border: 'none',
                        borderRadius: '0.5rem',
                        color: 'white',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        cursor: (verificationCode.length !== 6 || is2FASetupLoading) ? 'not-allowed' : 'pointer',
                        opacity: (verificationCode.length !== 6 || is2FASetupLoading) ? 0.6 : 1
                      }}
                    >
                      {is2FASetupLoading ? 'Verifying...' : 'Verify & Enable 2FA'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Delete Account Confirmation Modal */}
        {showDeleteModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: 'rgba(11, 18, 32, 0.95)',
              border: '1px solid rgba(220, 38, 38, 0.3)',
              borderRadius: '1rem',
              padding: '2rem',
              maxWidth: '500px',
              width: '90%',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem'
              }}>
                <h3 style={{
                  color: '#dc2626',
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  margin: 0
                }}>
                  Delete Account
                </h3>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#9CA3AF',
                    fontSize: '1.5rem',
                    cursor: 'pointer',
                    padding: '0.25rem'
                  }}
                >
                  ×
                </button>
              </div>

              <div style={{
                background: 'rgba(220, 38, 38, 0.1)',
                border: '1px solid rgba(220, 38, 38, 0.3)',
                borderRadius: '0.5rem',
                padding: '1rem',
                marginBottom: '1.5rem'
              }}>
                <p style={{
                  color: '#fca5a5',
                  fontSize: '0.875rem',
                  lineHeight: '1.6',
                  margin: 0
                }}>
                  <strong>⚠️ This action cannot be undone!</strong>
                </p>
                <p style={{
                  color: '#fca5a5',
                  fontSize: '0.875rem',
                  lineHeight: '1.6',
                  margin: '0.5rem 0 0 0'
                }}>
                  Deleting your account will permanently remove:
                </p>
                <ul style={{
                  color: '#fca5a5',
                  fontSize: '0.875rem',
                  lineHeight: '1.6',
                  margin: '0.5rem 0 0 1rem',
                  padding: 0
                }}>
                  <li>Your profile and personal information</li>
                  <li>All your settings and preferences</li>
                  <li>Account access and authentication</li>
                  <li>Any saved data or configurations</li>
                </ul>
                <div style={{
                  marginTop: '1rem',
                  padding: '0.75rem',
                  background: 'rgba(154, 242, 58, 0.1)',
                  border: '1px solid rgba(154, 242, 58, 0.3)',
                  borderRadius: '0.5rem'
                }}>
                  <p style={{
                    color: '#9AF23A',
                    fontSize: '0.875rem',
                    margin: 0,
                    fontWeight: 500
                  }}>
                    💡 <strong>Note:</strong> You can always create a new account with the same email address after deletion, but you will need to sign up again as a completely new user.
                  </p>
                </div>
              </div>

              <div style={{
                display: 'flex',
                gap: '1rem',
                justifyContent: 'flex-end'
              }}>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeletingAccount}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '0.5rem',
                    color: 'white',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    cursor: isDeletingAccount ? 'not-allowed' : 'pointer',
                    opacity: isDeletingAccount ? 0.6 : 1
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={isDeletingAccount}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: '#dc2626',
                    border: 'none',
                    borderRadius: '0.5rem',
                    color: 'white',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: isDeletingAccount ? 'not-allowed' : 'pointer',
                    opacity: isDeletingAccount ? 0.6 : 1,
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!isDeletingAccount) {
                      (e.target as HTMLButtonElement).style.backgroundColor = '#b91c1c'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isDeletingAccount) {
                      (e.target as HTMLButtonElement).style.backgroundColor = '#dc2626'
                    }
                  }}
                >
                  {isDeletingAccount ? 'Deleting...' : 'Yes, Delete My Account'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
