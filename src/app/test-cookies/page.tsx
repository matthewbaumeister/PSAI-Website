'use client'

import { useState, useEffect } from 'react'
import { cookieManager } from '@/lib/cookie-manager'

export default function TestCookiesPage() {
  const [currentCookies, setCurrentCookies] = useState<Record<string, string>>({})
  const [preferences, setPreferences] = useState(cookieManager.getPreferences())

  useEffect(() => {
    updateCookieDisplay()
  }, [])

  const updateCookieDisplay = () => {
    setCurrentCookies(cookieManager.getAllCookies())
    setPreferences(cookieManager.getPreferences())
  }

  const testAnalyticsCookies = () => {
    if (preferences?.analytics) {
      cookieManager.setPreferences({
        ...preferences,
        analytics: true
      })
    } else {
      alert('Please enable Analytics cookies first in your preferences')
    }
    updateCookieDisplay()
  }

  const testMarketingCookies = () => {
    if (preferences?.marketing) {
      cookieManager.setPreferences({
        ...preferences,
        marketing: true
      })
    } else {
      alert('Please enable Marketing cookies first in your preferences')
    }
    updateCookieDisplay()
  }

  const testFunctionalCookies = () => {
    if (preferences?.functional) {
      cookieManager.setPreferences({
        ...preferences,
        functional: true
      })
    } else {
      alert('Please enable Functional cookies first in your preferences')
    }
    updateCookieDisplay()
  }

  const clearNonEssential = () => {
    cookieManager.clearNonEssentialCookies()
    updateCookieDisplay()
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
      color: '#f8fafc',
      padding: '32px 24px'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <h1 style={{
          fontSize: '48px',
          fontWeight: '800',
          background: 'linear-gradient(135deg, #ffffff 0%, #c4b5fd 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          margin: '0 0 32px 0'
        }}>
          🍪 Cookie Test Page
        </h1>

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
            Current Cookie Preferences
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '24px'
          }}>
            <div style={{
              padding: '16px',
              background: 'rgba(15, 23, 42, 0.4)',
              borderRadius: '8px',
              border: '1px solid rgba(148, 163, 184, 0.1)'
            }}>
              <div style={{ color: '#94a3b8', fontSize: '14px' }}>Essential</div>
              <div style={{ color: '#ffffff', fontWeight: '600' }}>
                {preferences?.essential ? '✅ Enabled' : '❌ Disabled'}
              </div>
            </div>
            
            <div style={{
              padding: '16px',
              background: 'rgba(15, 23, 42, 0.4)',
              borderRadius: '8px',
              border: '1px solid rgba(148, 163, 184, 0.1)'
            }}>
              <div style={{ color: '#94a3b8', fontSize: '14px' }}>Analytics</div>
              <div style={{ color: '#ffffff', fontWeight: '600' }}>
                {preferences?.analytics ? '✅ Enabled' : '❌ Disabled'}
              </div>
            </div>
            
            <div style={{
              padding: '16px',
              background: 'rgba(15, 23, 42, 0.4)',
              borderRadius: '8px',
              border: '1px solid rgba(148, 163, 184, 0.1)'
            }}>
              <div style={{ color: '#94a3b8', fontSize: '14px' }}>Marketing</div>
              <div style={{ color: '#ffffff', fontWeight: '600' }}>
                {preferences?.marketing ? '✅ Enabled' : '❌ Disabled'}
              </div>
            </div>
            
            <div style={{
              padding: '16px',
              background: 'rgba(15, 23, 42, 0.4)',
              borderRadius: '8px',
              border: '1px solid rgba(148, 163, 184, 0.1)'
            }}>
              <div style={{ color: '#94a3b8', fontSize: '14px' }}>Functional</div>
              <div style={{ color: '#ffffff', fontWeight: '600' }}>
                {preferences?.functional ? '✅ Enabled' : '❌ Disabled'}
              </div>
            </div>
          </div>

          <div style={{
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={testAnalyticsCookies}
              style={{
                padding: '10px 20px',
                background: 'rgba(34, 197, 94, 0.2)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                borderRadius: '8px',
                color: '#86efac',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(34, 197, 94, 0.3)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(34, 197, 94, 0.2)'
              }}
            >
              Test Analytics Cookies
            </button>
            
            <button
              onClick={testMarketingCookies}
              style={{
                padding: '10px 20px',
                background: 'rgba(59, 130, 246, 0.2)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '8px',
                color: '#93c5fd',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(59, 130, 246, 0.3)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)'
              }}
            >
              Test Marketing Cookies
            </button>
            
            <button
              onClick={testFunctionalCookies}
              style={{
                padding: '10px 20px',
                background: 'rgba(168, 85, 247, 0.2)',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                borderRadius: '8px',
                color: '#c4b5fd',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(168, 85, 247, 0.3)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(168, 85, 247, 0.2)'
              }}
            >
              Test Functional Cookies
            </button>
            
            <button
              onClick={clearNonEssential}
              style={{
                padding: '10px 20px',
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                color: '#fca5a5',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'
              }}
            >
              Clear Non-Essential
            </button>
            
            <button
              onClick={updateCookieDisplay}
              style={{
                padding: '10px 20px',
                background: 'rgba(148, 163, 184, 0.2)',
                border: '1px solid rgba(148, 163, 184, 0.3)',
                borderRadius: '8px',
                color: '#cbd5e1',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(148, 163, 184, 0.3)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(148, 163, 184, 0.2)'
              }}
            >
              Refresh Display
            </button>
          </div>
        </div>

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
            margin: '0 0 24px 0'
          }}>
            Current Cookies in Browser
          </h2>
          
          {Object.keys(currentCookies).length === 0 ? (
            <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>
              No cookies found in browser
            </p>
          ) : (
            <div style={{
              display: 'grid',
              gap: '12px'
            }}>
              {Object.entries(currentCookies).map(([name, value]) => (
                <div key={name} style={{
                  padding: '16px',
                  background: 'rgba(15, 23, 42, 0.4)',
                  borderRadius: '8px',
                  border: '1px solid rgba(148, 163, 184, 0.1)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ color: '#ffffff', fontWeight: '600', fontSize: '14px' }}>
                      {name}
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: '12px', fontFamily: 'monospace' }}>
                      {value.length > 50 ? value.substring(0, 50) + '...' : value}
                    </div>
                  </div>
                  <div style={{
                    padding: '4px 8px',
                    background: 'rgba(139, 92, 246, 0.2)',
                    borderRadius: '4px',
                    fontSize: '12px',
                    color: '#c4b5fd'
                  }}>
                    {cookieManager.isAllowed('essential') && name.includes('auth') ? 'Essential' :
                     cookieManager.isAllowed('analytics') && name.startsWith('_g') ? 'Analytics' :
                     cookieManager.isAllowed('marketing') && name.startsWith('fb') ? 'Marketing' :
                     cookieManager.isAllowed('functional') && (name.includes('theme') || name.includes('lang')) ? 'Functional' :
                     'Unknown'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
