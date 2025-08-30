'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface SystemSettings {
  siteName: string
  siteDescription: string
  maintenanceMode: boolean
  allowNewRegistrations: boolean
  requireEmailVerification: boolean
  maxLoginAttempts: number
  sessionTimeout: number
  emailNotifications: boolean
  analyticsEnabled: boolean
  backupFrequency: string
}

export default function SystemSettingsPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [settings, setSettings] = useState<SystemSettings>({
    siteName: 'Prop Shop AI',
    siteDescription: 'AI-powered property management solutions',
    maintenanceMode: false,
    allowNewRegistrations: true,
    requireEmailVerification: true,
    maxLoginAttempts: 5,
    sessionTimeout: 24,
    emailNotifications: true,
    analyticsEnabled: true,
    backupFrequency: 'daily'
  })
  const [isLoadingSettings, setIsLoadingSettings] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')

  // Check if user is authenticated and is admin
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login')
    } else if (user && !user.isAdmin) {
      router.push('/dashboard')
    } else if (user && user.isAdmin) {
      loadSettings()
    }
  }, [user, isLoading, router])

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings')
      if (response.ok) {
        const data = await response.json()
        setSettings(data.settings || settings)
      } else {
        setMessage('Failed to load system settings')
        setMessageType('error')
      }
    } catch (error) {
      setMessage('Error loading system settings')
      setMessageType('error')
    } finally {
      setIsLoadingSettings(false)
    }
  }

  const handleSettingChange = (key: keyof SystemSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const saveSettings = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings })
      })

      if (response.ok) {
        setMessage('System settings saved successfully!')
        setMessageType('success')
      } else {
        const data = await response.json()
        setMessage(data.message || 'Failed to save settings')
        setMessageType('error')
      }
    } catch (error) {
      setMessage('Error saving system settings')
      setMessageType('error')
    } finally {
      setIsSaving(false)
    }
  }

  const resetToDefaults = () => {
    if (!confirm('Are you sure you want to reset all settings to defaults? This action cannot be undone.')) {
      return
    }
    
    const defaultSettings: SystemSettings = {
      siteName: 'Prop Shop AI',
      siteDescription: 'AI-powered property management solutions',
      maintenanceMode: false,
      allowNewRegistrations: true,
      requireEmailVerification: true,
      maxLoginAttempts: 5,
      sessionTimeout: 24,
      emailNotifications: true,
      analyticsEnabled: true,
      backupFrequency: 'daily'
    }
    
    setSettings(defaultSettings)
    setMessage('Settings reset to defaults')
    setMessageType('success')
  }

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '64px',
            height: '64px',
            border: '4px solid #8b5cf6',
            borderTop: '4px solid transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p style={{ color: '#c4b5fd', fontSize: '18px' }}>Loading System Settings...</p>
        </div>
      </div>
    )
  }

  if (!user || !user.isAdmin) {
    return null // Will redirect
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
      color: '#f8fafc'
    }}>
      {/* Header */}
      <div style={{
        background: 'rgba(30, 41, 59, 0.8)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(148, 163, 184, 0.2)',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '32px 24px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <h1 style={{
                fontSize: '48px',
                fontWeight: '800',
                background: 'linear-gradient(135deg, #ffffff 0%, #c4b5fd 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                margin: 0
              }}>
                System Settings
              </h1>
              <p style={{
                color: '#cbd5e1',
                marginTop: '8px',
                fontSize: '18px'
              }}>
                Configure system-wide settings and application behavior.
              </p>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px'
            }}>
              <div style={{
                background: 'rgba(139, 92, 246, 0.2)',
                borderRadius: '12px',
                padding: '12px 20px',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                backdropFilter: 'blur(10px)'
              }}>
                <span style={{ color: '#c4b5fd', fontSize: '14px' }}>Signed in as </span>
                <span style={{ color: '#ffffff', fontWeight: '600' }}>{user.email}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '32px 24px'
      }}>
        {/* Message */}
        {message && (
          <div style={{
            background: messageType === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${messageType === 'success' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            borderRadius: '12px',
            padding: '16px 20px',
            marginBottom: '32px',
            color: messageType === 'success' ? '#86efac' : '#fca5a5',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              background: messageType === 'success' ? '#22c55e' : '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {messageType === 'success' ? '✓' : '✕'}
            </div>
            {message}
          </div>
        )}

        {/* Quick Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '24px',
          marginBottom: '32px'
        }}>
          <div style={{
            background: 'rgba(30, 41, 59, 0.6)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            borderRadius: '16px',
            padding: '24px',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)'
            e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.3)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = 'none'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg style={{ width: '24px', height: '24px', color: '#ffffff' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <p style={{
                  color: '#94a3b8',
                  fontSize: '14px',
                  margin: '0 0 4px 0'
                }}>
                  System Status
                </p>
                <p style={{
                  color: '#ffffff',
                  fontSize: '18px',
                  fontWeight: '600',
                  margin: 0
                }}>
                  {settings.maintenanceMode ? 'Maintenance Mode' : 'Operational'}
                </p>
              </div>
            </div>
          </div>

          <div style={{
            background: 'rgba(30, 41, 59, 0.6)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            borderRadius: '16px',
            padding: '24px',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)'
            e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.3)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = 'none'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg style={{ width: '24px', height: '24px', color: '#ffffff' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <div>
                <p style={{
                  color: '#94a3b8',
                  fontSize: '14px',
                  margin: '0 0 4px 0'
                }}>
                  Registrations
                </p>
                <p style={{
                  color: '#ffffff',
                  fontSize: '18px',
                  fontWeight: '600',
                  margin: 0
                }}>
                  {settings.allowNewRegistrations ? 'Open' : 'Closed'}
                </p>
              </div>
            </div>
          </div>

          <div style={{
            background: 'rgba(30, 41, 59, 0.6)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            borderRadius: '16px',
            padding: '24px',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)'
            e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.3)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = 'none'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg style={{ width: '24px', height: '24px', color: '#ffffff' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <p style={{
                  color: '#94a3b8',
                  fontSize: '14px',
                  margin: '0 0 4px 0'
                }}>
                  Security Level
                </p>
                <p style={{
                  color: '#ffffff',
                  fontSize: '18px',
                  fontWeight: '600',
                  margin: 0
                }}>
                  {settings.requireEmailVerification ? 'High' : 'Standard'}
                </p>
              </div>
            </div>
          </div>

          <div style={{
            background: 'rgba(30, 41, 59, 0.6)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            borderRadius: '16px',
            padding: '24px',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)'
            e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.3)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = 'none'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg style={{ width: '24px', height: '24px', color: '#ffffff' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                </svg>
              </div>
              <div>
                <p style={{
                  color: '#94a3b8',
                  fontSize: '14px',
                  margin: '0 0 4px 0'
                }}>
                  Backup Frequency
                </p>
                <p style={{
                  color: '#ffffff',
                  fontSize: '18px',
                  fontWeight: '600',
                  margin: 0
                }}>
                  {settings.backupFrequency}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Settings Form */}
        <div style={{
          background: 'rgba(30, 41, 59, 0.6)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(148, 163, 184, 0.2)',
          borderRadius: '16px',
          padding: '32px',
          marginBottom: '32px'
        }}>
          <h3 style={{
            fontSize: '24px',
            fontWeight: '600',
            color: '#ffffff',
            margin: '0 0 32px 0'
          }}>
            General Settings
          </h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
            gap: '32px'
          }}>
            <div>
              <label style={{
                display: 'block',
                color: '#cbd5e1',
                fontWeight: '500',
                marginBottom: '8px',
                fontSize: '14px'
              }}>
                Site Name
              </label>
              <input
                type="text"
                value={settings.siteName}
                onChange={(e) => handleSettingChange('siteName', e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(148, 163, 184, 0.3)',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '14px'
                }}
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                color: '#cbd5e1',
                fontWeight: '500',
                marginBottom: '8px',
                fontSize: '14px'
              }}>
                Site Description
              </label>
              <input
                type="text"
                value={settings.siteDescription}
                onChange={(e) => handleSettingChange('siteDescription', e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(148, 163, 184, 0.3)',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>

          <h3 style={{
            fontSize: '24px',
            fontWeight: '600',
            color: '#ffffff',
            margin: '48px 0 32px 0'
          }}>
            System Configuration
          </h3>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
            gap: '32px'
          }}>
            <div>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                color: '#cbd5e1',
                fontWeight: '500',
                marginBottom: '8px',
                fontSize: '14px'
              }}>
                <input
                  type="checkbox"
                  checked={settings.maintenanceMode}
                  onChange={(e) => handleSettingChange('maintenanceMode', e.target.checked)}
                  style={{
                    width: '18px',
                    height: '18px',
                    accentColor: '#8b5cf6'
                  }}
                />
                Maintenance Mode
              </label>
              <p style={{
                color: '#94a3b8',
                fontSize: '12px',
                margin: '4px 0 0 0'
              }}>
                Enable maintenance mode to restrict access to administrators only
              </p>
            </div>

            <div>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                color: '#cbd5e1',
                fontWeight: '500',
                marginBottom: '8px',
                fontSize: '14px'
              }}>
                <input
                  type="checkbox"
                  checked={settings.allowNewRegistrations}
                  onChange={(e) => handleSettingChange('allowNewRegistrations', e.target.checked)}
                  style={{
                    width: '18px',
                    height: '18px',
                    accentColor: '#8b5cf6'
                  }}
                />
                Allow New Registrations
              </label>
              <p style={{
                color: '#94a3b8',
                fontSize: '12px',
                margin: '4px 0 0 0'
              }}>
                Allow new users to create accounts
              </p>
            </div>

            <div>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                color: '#cbd5e1',
                fontWeight: '500',
                marginBottom: '8px',
                fontSize: '14px'
              }}>
                <input
                  type="checkbox"
                  checked={settings.requireEmailVerification}
                  onChange={(e) => handleSettingChange('requireEmailVerification', e.target.checked)}
                  style={{
                    width: '18px',
                    height: '18px',
                    accentColor: '#8b5cf6'
                  }}
                />
                Require Email Verification
              </label>
              <p style={{
                color: '#94a3b8',
                fontSize: '12px',
                margin: '4px 0 0 0'
              }}>
                Require email verification before account activation
              </p>
            </div>

            <div>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                color: '#cbd5e1',
                fontWeight: '500',
                marginBottom: '8px',
                fontSize: '14px'
              }}>
                <input
                  type="checkbox"
                  checked={settings.emailNotifications}
                  onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                  style={{
                    width: '18px',
                    height: '18px',
                    accentColor: '#8b5cf6'
                  }}
                />
                Email Notifications
              </label>
              <p style={{
                color: '#94a3b8',
                fontSize: '12px',
                margin: '4px 0 0 0'
              }}>
                Enable system email notifications
              </p>
            </div>

            <div>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                color: '#cbd5e1',
                fontWeight: '500',
                marginBottom: '8px',
                fontSize: '14px'
              }}>
                <input
                  type="checkbox"
                  checked={settings.analyticsEnabled}
                  onChange={(e) => handleSettingChange('analyticsEnabled', e.target.checked)}
                  style={{
                    width: '18px',
                    height: '18px',
                    accentColor: '#8b5cf6'
                  }}
                />
                Analytics Enabled
              </label>
              <p style={{
                color: '#94a3b8',
                fontSize: '12px',
                margin: '4px 0 0 0'
              }}>
                Enable system analytics and tracking
              </p>
            </div>
          </div>

          <h3 style={{
            fontSize: '24px',
            fontWeight: '600',
            color: '#ffffff',
            margin: '48px 0 32px 0'
          }}>
            Security Settings
          </h3>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
            gap: '32px'
          }}>
            <div>
              <label style={{
                display: 'block',
                color: '#cbd5e1',
                fontWeight: '500',
                marginBottom: '8px',
                fontSize: '14px'
              }}>
                Max Login Attempts
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={settings.maxLoginAttempts}
                onChange={(e) => handleSettingChange('maxLoginAttempts', parseInt(e.target.value))}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(148, 163, 184, 0.3)',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '14px'
                }}
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                color: '#cbd5e1',
                fontWeight: '500',
                marginBottom: '8px',
                fontSize: '14px'
              }}>
                Session Timeout (hours)
              </label>
              <input
                type="number"
                min="1"
                max="168"
                value={settings.sessionTimeout}
                onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(148, 163, 184, 0.3)',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '14px'
                }}
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                color: '#cbd5e1',
                fontWeight: '500',
                marginBottom: '8px',
                fontSize: '14px'
              }}>
                Backup Frequency
              </label>
              <select
                value={settings.backupFrequency}
                onChange={(e) => handleSettingChange('backupFrequency', e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(148, 163, 184, 0.3)',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '14px'
                }}
              >
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>

          <div style={{
            display: 'flex',
            gap: '16px',
            marginTop: '48px'
          }}>
            <button
              onClick={saveSettings}
              disabled={isSaving}
              style={{
                padding: '16px 32px',
                background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                border: 'none',
                borderRadius: '12px',
                color: '#ffffff',
                fontSize: '16px',
                fontWeight: '600',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                opacity: isSaving ? 0.6 : 1
              }}
              onMouseEnter={(e) => {
                if (!isSaving) {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(34, 197, 94, 0.3)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isSaving) {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }
              }}
            >
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
            <button
              onClick={resetToDefaults}
              style={{
                padding: '16px 32px',
                background: 'rgba(148, 163, 184, 0.2)',
                border: '1px solid rgba(148, 163, 184, 0.3)',
                borderRadius: '12px',
                color: '#94a3b8',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(148, 163, 184, 0.3)'
                e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.5)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(148, 163, 184, 0.2)'
                e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.3)'
              }}
            >
              Reset to Defaults
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
