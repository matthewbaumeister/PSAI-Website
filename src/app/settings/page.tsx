'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

interface UserSettings {
  newsletter_subscription: boolean
  research_alerts: boolean
}

export default function SettingsPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [settings, setSettings] = useState<UserSettings>({
    newsletter_subscription: false,
    research_alerts: false
  })
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, isLoading, router])

  // Load user settings
  useEffect(() => {
    if (user) {
      loadSettings()
    }
  }, [user])

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/user/settings')
      if (response.ok) {
        const data = await response.json()
        setSettings({
          newsletter_subscription: data.newsletter_subscription || false,
          research_alerts: data.research_alerts || false
        })
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    }
  }

  const saveSettings = async () => {
    setIsSaving(true)
    setMessage('')
    
    try {
      const response = await fetch('/api/user/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      })

      if (response.ok) {
        setMessage('Settings saved successfully!')
        setTimeout(() => setMessage(''), 3000)
      } else {
        setMessage('Failed to save settings. Please try again.')
      }
    } catch (error) {
      console.error('Failed to save settings:', error)
      setMessage('Failed to save settings. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggle = (key: keyof UserSettings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  if (isLoading) {
    return (
      <div className="settings-page loading">
        <div className="container">
          <div className="spinner"></div>
          <p>Loading settings...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect
  }

  return (
    <div className="settings-page">
      <div className="container">
        <div className="settings-header">
          <button 
            className="back-btn"
            onClick={() => router.push('/publications')}
          >
            ← Back to Publications
          </button>
          <h1>Email Settings</h1>
          <p>Manage your email preferences for newsletters and research alerts.</p>
        </div>

        <div className="settings-content">
          <div className="settings-card">
            <div className="setting-item">
              <div className="setting-info">
                <h3>Newsletter Subscription</h3>
                <p>Receive our latest research and insights delivered directly to your inbox. Stay updated on market trends, regulatory changes, and strategic opportunities.</p>
              </div>
              <div className="setting-control">
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={settings.newsletter_subscription}
                    onChange={() => handleToggle('newsletter_subscription')}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <h3>Research Alerts</h3>
                <p>Get notified when new research reports, market analysis, and industry insights are published.</p>
              </div>
              <div className="setting-control">
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={settings.research_alerts}
                    onChange={() => handleToggle('research_alerts')}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>

          {message && (
            <div className={`message ${message.includes('successfully') ? 'success' : 'error'}`}>
              {message}
            </div>
          )}

          <div className="settings-actions">
            <button
              className="btn btn-primary"
              onClick={saveSettings}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
            <button
              className="btn btn-outline"
              onClick={() => router.push('/publications')}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}