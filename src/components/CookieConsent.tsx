'use client'

import { useState, useEffect } from 'react'
import { cookieManager, CookiePreferences } from '@/lib/cookie-manager'

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false)
  const [showPreferences, setShowPreferences] = useState(false)
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true, // Always required
    analytics: false,
    marketing: false,
    functional: false
  })

  useEffect(() => {
    // Check if user has already made a cookie choice
    if (!cookieManager.hasConsent()) {
      setShowBanner(true)
    } else {
      // Load saved preferences
      const savedPreferences = cookieManager.getPreferences()
      if (savedPreferences) {
        setPreferences(savedPreferences)
      }
    }
  }, [])

  const handleAcceptAll = () => {
    const allAccepted: CookiePreferences = {
      essential: true,
      analytics: true,
      marketing: true,
      functional: true
    }
    setPreferences(allAccepted)
    savePreferences(allAccepted)
    setShowBanner(false)
  }

  const handleAcceptEssential = () => {
    const essentialOnly: CookiePreferences = {
      essential: true,
      analytics: false,
      marketing: false,
      functional: false
    }
    setPreferences(essentialOnly)
    savePreferences(essentialOnly)
    setShowBanner(false)
  }

  const handleSavePreferences = () => {
    savePreferences(preferences)
    setShowBanner(false)
    setShowPreferences(false)
  }

  const savePreferences = (prefs: CookiePreferences) => {
    // Use the cookie manager to save preferences and apply them
    cookieManager.setPreferences(prefs)
  }

  const togglePreference = (key: keyof CookiePreferences) => {
    if (key === 'essential') return // Essential cookies cannot be disabled
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  if (!showBanner) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: 'rgba(15, 23, 42, 0.95)',
      backdropFilter: 'blur(20px)',
      borderTop: '1px solid rgba(148, 163, 184, 0.2)',
      padding: '24px',
      zIndex: 9999,
      boxShadow: '0 -10px 25px rgba(0, 0, 0, 0.3)'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        {/* Main Banner */}
        {!showPreferences && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '24px',
            flexWrap: 'wrap'
          }}>
            <div style={{ flex: 1, minWidth: '300px' }}>
              <h3 style={{
                color: '#ffffff',
                fontSize: '18px',
                fontWeight: '600',
                margin: '0 0 8px 0'
              }}>
                🍪 We use cookies to enhance your experience
              </h3>
              <p style={{
                color: '#cbd5e1',
                fontSize: '14px',
                margin: 0,
                lineHeight: '1.5'
              }}>
                We use essential cookies for authentication and security. You can choose to accept additional cookies for analytics and improved functionality.
              </p>
            </div>
            
            <div style={{
              display: 'flex',
              gap: '12px',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={() => setShowPreferences(true)}
                style={{
                  padding: '10px 20px',
                  background: 'transparent',
                  border: '1px solid rgba(148, 163, 184, 0.3)',
                  borderRadius: '8px',
                  color: '#cbd5e1',
                  fontSize: '14px',
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
                Customize
              </button>
              
              <button
                onClick={handleAcceptEssential}
                style={{
                  padding: '10px 20px',
                  background: 'rgba(148, 163, 184, 0.1)',
                  border: '1px solid rgba(148, 163, 184, 0.3)',
                  borderRadius: '8px',
                  color: '#cbd5e1',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(148, 163, 184, 0.2)'
                  e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.5)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(148, 163, 184, 0.1)'
                  e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.3)'
                }}
              >
                Essential Only
              </button>
              
              <button
                onClick={handleAcceptAll}
                style={{
                  padding: '10px 20px',
                  background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)'
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(139, 92, 246, 0.4)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(139, 92, 246, 0.3)'
                }}
              >
                Accept All
              </button>
            </div>
          </div>
        )}

        {/* Detailed Preferences */}
        {showPreferences && (
          <div style={{
            background: 'rgba(30, 41, 59, 0.6)',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid rgba(148, 163, 184, 0.2)'
          }}>
            <h4 style={{
              color: '#ffffff',
              fontSize: '16px',
              fontWeight: '600',
              margin: '0 0 20px 0'
            }}>
              Cookie Preferences
            </h4>
            
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              marginBottom: '24px'
            }}>
              {/* Essential Cookies */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px',
                background: 'rgba(15, 23, 42, 0.4)',
                borderRadius: '8px',
                border: '1px solid rgba(148, 163, 184, 0.1)'
              }}>
                <div>
                  <div style={{
                    color: '#ffffff',
                    fontWeight: '600',
                    marginBottom: '4px'
                  }}>
                    Essential Cookies
                  </div>
                  <div style={{
                    color: '#94a3b8',
                    fontSize: '14px'
                  }}>
                    Required for authentication and security. Cannot be disabled.
                  </div>
                </div>
                <div style={{
                  width: '20px',
                  height: '20px',
                  background: '#8b5cf6',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontSize: '12px',
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
                padding: '16px',
                background: 'rgba(15, 23, 42, 0.4)',
                borderRadius: '8px',
                border: '1px solid rgba(148, 163, 184, 0.1)'
              }}>
                <div>
                  <div style={{
                    color: '#ffffff',
                    fontWeight: '600',
                    marginBottom: '4px'
                  }}>
                    Analytics Cookies
                  </div>
                  <div style={{
                    color: '#94a3b8',
                    fontSize: '14px'
                  }}>
                    Help us understand how visitors interact with our website.
                  </div>
                </div>
                <button
                  onClick={() => togglePreference('analytics')}
                  style={{
                    width: '44px',
                    height: '24px',
                    background: preferences.analytics ? '#8b5cf6' : 'rgba(148, 163, 184, 0.3)',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{
                    position: 'absolute',
                    top: '2px',
                    left: preferences.analytics ? '22px' : '2px',
                    width: '20px',
                    height: '20px',
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
                padding: '16px',
                background: 'rgba(15, 23, 42, 0.4)',
                borderRadius: '8px',
                border: '1px solid rgba(148, 163, 184, 0.1)'
              }}>
                <div>
                  <div style={{
                    color: '#ffffff',
                    fontWeight: '600',
                    marginBottom: '4px'
                  }}>
                    Marketing Cookies
                  </div>
                  <div style={{
                    color: '#94a3b8',
                    fontSize: '14px'
                  }}>
                    Used to deliver personalized content and advertisements.
                  </div>
                </div>
                <button
                  onClick={() => togglePreference('marketing')}
                  style={{
                    width: '44px',
                    height: '24px',
                    background: preferences.marketing ? '#8b5cf6' : 'rgba(148, 163, 184, 0.3)',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{
                    position: 'absolute',
                    top: '2px',
                    left: preferences.marketing ? '22px' : '2px',
                    width: '20px',
                    height: '20px',
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
                padding: '16px',
                background: 'rgba(15, 23, 42, 0.4)',
                borderRadius: '8px',
                border: '1px solid rgba(148, 163, 184, 0.1)'
              }}>
                <div>
                  <div style={{
                    color: '#ffffff',
                    fontWeight: '600',
                    marginBottom: '4px'
                  }}>
                    Functional Cookies
                  </div>
                  <div style={{
                    color: '#94a3b8',
                    fontSize: '14px'
                  }}>
                    Enable enhanced functionality and personalization.
                  </div>
                </div>
                <button
                  onClick={() => togglePreference('functional')}
                  style={{
                    width: '44px',
                    height: '24px',
                    background: preferences.functional ? '#8b5cf6' : 'rgba(148, 163, 184, 0.3)',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{
                    position: 'absolute',
                    top: '2px',
                    left: preferences.functional ? '22px' : '2px',
                    width: '20px',
                    height: '20px',
                    background: '#ffffff',
                    borderRadius: '50%',
                    transition: 'all 0.2s ease'
                  }} />
                </button>
              </div>
            </div>

            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setShowPreferences(false)}
                style={{
                  padding: '10px 20px',
                  background: 'transparent',
                  border: '1px solid rgba(148, 163, 184, 0.3)',
                  borderRadius: '8px',
                  color: '#cbd5e1',
                  fontSize: '14px',
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
                Back
              </button>
              
              <button
                onClick={handleSavePreferences}
                style={{
                  padding: '10px 20px',
                  background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)'
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(139, 92, 246, 0.4)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(139, 92, 246, 0.3)'
                }}
              >
                Save Preferences
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
