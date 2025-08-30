'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { cookieManager, CookiePreferences } from '@/lib/cookie-manager'

export default function CookieSettingsPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true,
    analytics: false,
    marketing: false,
    functional: false
  })
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login')
    } else if (user) {
      loadCookiePreferences()
    }
  }, [user, isLoading, router])

  const loadCookiePreferences = () => {
    const savedPreferences = cookieManager.getPreferences()
    if (savedPreferences) {
      setPreferences(savedPreferences)
    }
  }

  const togglePreference = (key: keyof CookiePreferences) => {
    if (key === 'essential') return // Essential cookies cannot be disabled
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Use the cookie manager to save preferences and apply them
      cookieManager.setPreferences(preferences)
      
      setMessage('Cookie preferences updated successfully!')
      setMessageType('success')
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      setMessage('Failed to update cookie preferences')
      setMessageType('error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    const defaultPreferences: CookiePreferences = {
      essential: true,
      analytics: false,
      marketing: false,
      functional: false
    }
    setPreferences(defaultPreferences)
    // Apply the reset preferences immediately
    cookieManager.setPreferences(defaultPreferences)
    setMessage('Preferences reset to default')
    setMessageType('success')
    setTimeout(() => setMessage(''), 3000)
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
          <p style={{ color: '#c4b5fd', fontSize: '18px' }}>Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
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
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '32px 24px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                marginBottom: '8px'
              }}>
                <Link href="/settings" style={{
                  color: '#94a3b8',
                  textDecoration: 'none',
                  fontSize: '14px'
                }}>
                  ← Back to Settings
                </Link>
              </div>
              <h1 style={{
                fontSize: '48px',
                fontWeight: '800',
                background: 'linear-gradient(135deg, #ffffff 0%, #c4b5fd 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                margin: 0
              }}>
                Cookie Preferences
              </h1>
              <p style={{
                color: '#cbd5e1',
                marginTop: '8px',
                fontSize: '18px'
              }}>
                Manage your cookie settings and privacy preferences.
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
        maxWidth: '800px',
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

        {/* Cookie Information */}
        <div style={{
          background: 'rgba(30, 41, 59, 0.6)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(148, 163, 184, 0.2)',
          borderRadius: '20px',
          padding: '32px',
          marginBottom: '32px'
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '700',
            color: '#ffffff',
            margin: '0 0 16px 0'
          }}>
            🍪 About Cookies
          </h2>
          <p style={{
            color: '#cbd5e1',
            fontSize: '16px',
            lineHeight: '1.6',
            margin: '0 0 20px 0'
          }}>
            Cookies are small text files that are stored on your device when you visit our website. 
            They help us provide you with a better experience and understand how you use our services.
          </p>
          
          <div style={{
            background: 'rgba(15, 23, 42, 0.4)',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid rgba(148, 163, 184, 0.1)'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#ffffff',
              margin: '0 0 12px 0'
            }}>
              Your Current Settings
            </h3>
            <p style={{
              color: '#94a3b8',
              fontSize: '14px',
              margin: 0
            }}>
              Last updated: {localStorage.getItem('cookieConsentDate') ? 
                new Date(localStorage.getItem('cookieConsentDate')!).toLocaleDateString() : 
                'Never'
              }
            </p>
          </div>
        </div>

        {/* Cookie Preferences */}
        <div style={{
          background: 'rgba(30, 41, 59, 0.6)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(148, 163, 184, 0.2)',
          borderRadius: '20px',
          padding: '32px',
          marginBottom: '32px'
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '700',
            color: '#ffffff',
            margin: '0 0 24px 0'
          }}>
            Cookie Categories
          </h2>
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            marginBottom: '32px'
          }}>
            {/* Essential Cookies */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '20px',
              background: 'rgba(15, 23, 42, 0.4)',
              borderRadius: '12px',
              border: '1px solid rgba(148, 163, 184, 0.1)'
            }}>
              <div style={{ flex: 1 }}>
                <div style={{
                  color: '#ffffff',
                  fontWeight: '600',
                  fontSize: '16px',
                  marginBottom: '8px'
                }}>
                  Essential Cookies
                </div>
                <div style={{
                  color: '#94a3b8',
                  fontSize: '14px',
                  lineHeight: '1.5'
                }}>
                  These cookies are necessary for the website to function properly. They enable basic functions like page navigation, 
                  access to secure areas, and user authentication. The website cannot function properly without these cookies.
                </div>
              </div>
              <div style={{
                width: '24px',
                height: '24px',
                background: '#8b5cf6',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: 'bold'
              }}>
                ✓
              </div>
            </div>

            {/* Analytics Cookies */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '20px',
              background: 'rgba(15, 23, 42, 0.4)',
              borderRadius: '12px',
              border: '1px solid rgba(148, 163, 184, 0.1)'
            }}>
              <div style={{ flex: 1 }}>
                <div style={{
                  color: '#ffffff',
                  fontWeight: '600',
                  fontSize: '16px',
                  marginBottom: '8px'
                }}>
                  Analytics Cookies
                </div>
                <div style={{
                  color: '#94a3b8',
                  fontSize: '14px',
                  lineHeight: '1.5'
                }}>
                  These cookies help us understand how visitors interact with our website by collecting and reporting information 
                  anonymously. This helps us improve our website and services.
                </div>
              </div>
              <button
                onClick={() => togglePreference('analytics')}
                style={{
                  width: '52px',
                  height: '28px',
                  background: preferences.analytics ? '#8b5cf6' : 'rgba(148, 163, 184, 0.3)',
                  border: 'none',
                  borderRadius: '14px',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: '2px',
                  left: preferences.analytics ? '26px' : '2px',
                  width: '24px',
                  height: '24px',
                  background: '#ffffff',
                  borderRadius: '50%',
                  transition: 'all 0.2s ease'
                }} />
              </button>
            </div>

            {/* Marketing Cookies */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '20px',
              background: 'rgba(15, 23, 42, 0.4)',
              borderRadius: '12px',
              border: '1px solid rgba(148, 163, 184, 0.1)'
            }}>
              <div style={{ flex: 1 }}>
                <div style={{
                  color: '#ffffff',
                  fontWeight: '600',
                  fontSize: '16px',
                  marginBottom: '8px'
                }}>
                  Marketing Cookies
                </div>
                <div style={{
                  color: '#94a3b8',
                  fontSize: '14px',
                  lineHeight: '1.5'
                }}>
                  These cookies are used to track visitors across websites to display relevant and engaging advertisements. 
                  They may also be used to measure the effectiveness of advertising campaigns.
                </div>
              </div>
              <button
                onClick={() => togglePreference('marketing')}
                style={{
                  width: '52px',
                  height: '28px',
                  background: preferences.marketing ? '#8b5cf6' : 'rgba(148, 163, 184, 0.3)',
                  border: 'none',
                  borderRadius: '14px',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: '2px',
                  left: preferences.marketing ? '26px' : '2px',
                  width: '24px',
                  height: '24px',
                  background: '#ffffff',
                  borderRadius: '50%',
                  transition: 'all 0.2s ease'
                }} />
              </button>
            </div>

            {/* Functional Cookies */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '20px',
              background: 'rgba(15, 23, 42, 0.4)',
              borderRadius: '12px',
              border: '1px solid rgba(148, 163, 184, 0.1)'
            }}>
              <div style={{ flex: 1 }}>
                <div style={{
                  color: '#ffffff',
                  fontWeight: '600',
                  fontSize: '16px',
                  marginBottom: '8px'
                }}>
                  Functional Cookies
                </div>
                <div style={{
                  color: '#94a3b8',
                  fontSize: '14px',
                  lineHeight: '1.5'
                }}>
                  These cookies enable the website to provide enhanced functionality and personalization. 
                  They may be set by us or by third-party providers whose services we have added to our pages.
                </div>
              </div>
              <button
                onClick={() => togglePreference('functional')}
                style={{
                  width: '52px',
                  height: '28px',
                  background: preferences.functional ? '#8b5cf6' : 'rgba(148, 163, 184, 0.3)',
                  border: 'none',
                  borderRadius: '14px',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: '2px',
                  left: preferences.functional ? '26px' : '2px',
                  width: '24px',
                  height: '24px',
                  background: '#ffffff',
                  borderRadius: '50%',
                  transition: 'all 0.2s ease'
                }} />
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            gap: '16px',
            justifyContent: 'flex-end',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={handleReset}
              style={{
                padding: '12px 24px',
                background: 'transparent',
                border: '1px solid rgba(148, 163, 184, 0.3)',
                borderRadius: '8px',
                color: '#cbd5e1',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.6)'
                e.currentTarget.style.color = '#ffffff'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.3)'
                e.currentTarget.style.color = '#cbd5e1'
              }}
            >
              Reset to Default
            </button>
            
            <button
              onClick={handleSave}
              disabled={isSaving}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                border: 'none',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: '600',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)',
                opacity: isSaving ? 0.6 : 1
              }}
              onMouseEnter={(e) => {
                if (!isSaving) {
                  e.currentTarget.style.transform = 'translateY(-1px)'
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(139, 92, 246, 0.4)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isSaving) {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(139, 92, 246, 0.3)'
                }
              }}
            >
              {isSaving ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </div>

        {/* Additional Information */}
        <div style={{
          background: 'rgba(30, 41, 59, 0.6)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(148, 163, 184, 0.2)',
          borderRadius: '20px',
          padding: '32px'
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '700',
            color: '#ffffff',
            margin: '0 0 16px 0'
          }}>
            More Information
          </h2>
          <p style={{
            color: '#cbd5e1',
            fontSize: '16px',
            lineHeight: '1.6',
            margin: '0 0 20px 0'
          }}>
            For more detailed information about how we use cookies and your privacy rights, 
            please visit our <Link href="/privacy" style={{ color: '#8b5cf6', textDecoration: 'none' }}>Privacy Policy</Link>.
          </p>
          <p style={{
            color: '#94a3b8',
            fontSize: '14px',
            margin: 0
          }}>
            You can change your cookie preferences at any time by returning to this page. 
            Your choices will be remembered for future visits to our website.
          </p>
        </div>
      </div>
    </div>
  )
}
