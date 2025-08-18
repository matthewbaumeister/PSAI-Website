'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

interface ProfileData {
  id?: string
  user_id?: string
  first_name?: string
  last_name?: string
  company?: string
  role?: string
  phone?: string
  bio?: string
  is_admin?: boolean
  theme_preference?: 'light' | 'dark'
  email_notifications?: boolean
  admin_notifications?: boolean
  meeting_notifications?: boolean
}

export default function ProfilePage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<ProfileData>({})
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    if (user) {
      fetchProfile()
      checkAdminStatus()
    }
  }, [user])

  const fetchProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch('/api/profile', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setProfile(data)
      } else {
        console.log('Profile not found, will create new one')
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  const checkAdminStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch('/api/check-admin', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setIsAdmin(data.isAdmin)
      }
    } catch (error) {
      console.error('Error checking admin status:', error)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    setSaveMessage('')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setSaveMessage('Not authenticated')
        return
      }

      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(profile),
      })

      if (response.ok) {
        setSaveMessage('Profile saved successfully!')
        setIsEditing(false)
        setTimeout(() => setSaveMessage(''), 3000)
      } else {
        setSaveMessage('Error saving profile')
      }
    } catch (error) {
      setSaveMessage('Error saving profile')
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

  if (!user) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white'
      }}>
        <div>Please sign in to view your profile.</div>
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
        maxWidth: '800px',
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
            PROFILE
          </span>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '2rem'
        }}>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: 800,
            lineHeight: 1.1,
            color: 'white',
            margin: 0
          }}>
            Profile Settings
          </h1>
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
        </div>

        {/* Save Message */}
        {saveMessage && (
          <div style={{
            padding: '1rem',
            marginBottom: '2rem',
            background: saveMessage.includes('success') ? 'rgba(154, 242, 58, 0.1)' : 'rgba(255, 122, 41, 0.1)',
            border: `1px solid ${saveMessage.includes('success') ? 'rgba(154, 242, 58, 0.3)' : 'rgba(255, 122, 41, 0.3)'}`,
            borderRadius: '0.5rem',
            color: saveMessage.includes('success') ? '#9AF23A' : '#FF7A29'
          }}>
            {saveMessage}
          </div>
        )}

        {/* Profile Form */}
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
            Personal Information
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2rem'
          }}>
            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: '#9CA3AF',
                fontSize: '0.875rem',
                fontWeight: 500
              }}>
                First Name
              </label>
              <input
                type="text"
                value={profile.first_name || ''}
                onChange={(e) => handleInputChange('first_name', e.target.value)}
                disabled={!isEditing}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '0.5rem',
                  color: 'white',
                  fontSize: '1rem',
                  transition: 'all 0.2s ease'
                }}
                onFocus={(e) => {
                  if (isEditing) {
                    e.target.style.borderColor = 'rgba(154, 242, 58, 0.5)'
                  }
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                }}
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: '#9CA3AF',
                fontSize: '0.875rem',
                fontWeight: 500
              }}>
                Last Name
              </label>
              <input
                type="text"
                value={profile.last_name || ''}
                onChange={(e) => handleInputChange('last_name', e.target.value)}
                disabled={!isEditing}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '0.5rem',
                  color: 'white',
                  fontSize: '1rem',
                  transition: 'all 0.2s ease'
                }}
                onFocus={(e) => {
                  if (isEditing) {
                    e.target.style.borderColor = 'rgba(154, 242, 58, 0.5)'
                  }
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                }}
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: '#9CA3AF',
                fontSize: '0.875rem',
                fontWeight: 500
              }}>
                Company
              </label>
              <input
                type="text"
                value={profile.company || ''}
                onChange={(e) => handleInputChange('company', e.target.value)}
                disabled={!isEditing}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '0.5rem',
                  color: 'white',
                  fontSize: '1rem',
                  transition: 'all 0.2s ease'
                }}
                onFocus={(e) => {
                  if (isEditing) {
                    e.target.style.borderColor = 'rgba(154, 242, 58, 0.5)'
                  }
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                }}
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: '#9CA3AF',
                fontSize: '0.875rem',
                fontWeight: 500
              }}>
                Phone
              </label>
              <input
                type="tel"
                value={profile.phone || ''}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                disabled={!isEditing}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '0.5rem',
                  color: 'white',
                  fontSize: '1rem',
                  transition: 'all 0.2s ease'
                }}
                onFocus={(e) => {
                  if (isEditing) {
                    e.target.style.borderColor = 'rgba(154, 242, 58, 0.5)'
                  }
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                }}
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: '#9CA3AF',
                fontSize: '0.875rem',
                fontWeight: 500
              }}>
                Role
              </label>
              <select
                value={profile.role || 'user'}
                onChange={(e) => handleInputChange('role', e.target.value)}
                disabled={!isEditing}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '0.5rem',
                  color: 'white',
                  fontSize: '1rem',
                  transition: 'all 0.2s ease'
                }}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
              </select>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: '#9CA3AF',
                fontSize: '0.875rem',
                fontWeight: 500
              }}>
                Bio
              </label>
              <textarea
                value={profile.bio || ''}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                disabled={!isEditing}
                rows={4}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '0.5rem',
                  color: 'white',
                  fontSize: '1rem',
                  resize: 'vertical',
                  transition: 'all 0.2s ease'
                }}
                onFocus={(e) => {
                  if (isEditing) {
                    e.target.style.borderColor = 'rgba(154, 242, 58, 0.5)'
                  }
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'flex-end'
          }}>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'linear-gradient(135deg, #2D5BFF, #9AF23A)',
                  border: 'none',
                  borderRadius: '0.5rem',
                  color: 'white',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(45, 91, 255, 0.3)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                Edit Profile
              </button>
            ) : (
              <>
                <button
                  onClick={() => {
                    setIsEditing(false)
                    fetchProfile() // Reset to original values
                  }}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '0.5rem',
                    color: 'white',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'linear-gradient(135deg, #2D5BFF, #9AF23A)',
                    border: 'none',
                    borderRadius: '0.5rem',
                    color: 'white',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: isSaving ? 'not-allowed' : 'pointer',
                    opacity: isSaving ? 0.6 : 1,
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSaving) {
                      e.currentTarget.style.transform = 'translateY(-1px)'
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(45, 91, 255, 0.3)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Preferences Section */}
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
            Preferences
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1.5rem'
          }}>
            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: '#9CA3AF',
                fontSize: '0.875rem',
                fontWeight: 500
              }}>
                Theme Preference
              </label>
              <select
                value={profile.theme_preference || 'dark'}
                onChange={(e) => handleInputChange('theme_preference', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '0.5rem',
                  color: 'white',
                  fontSize: '1rem'
                }}
              >
                <option value="dark">Dark</option>
                <option value="light">Light</option>
              </select>
            </div>

            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: '#9CA3AF',
                fontSize: '0.875rem',
                fontWeight: 500
              }}>
                Email Notifications
              </label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <input
                  type="checkbox"
                  checked={profile.email_notifications || false}
                  onChange={(e) => handleInputChange('email_notifications', e.target.checked)}
                  style={{
                    width: '1.25rem',
                    height: '1.25rem',
                    accentColor: '#9AF23A'
                  }}
                />
                <span style={{ color: 'white', fontSize: '0.875rem' }}>
                  Receive email notifications
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Section - Only show if user is admin */}
        {isAdmin && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '1rem',
            padding: '2rem'
          }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: 'white',
              marginBottom: '1.5rem'
            }}>
              Admin Settings
            </h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1.5rem'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  color: '#9CA3AF',
                  fontSize: '0.875rem',
                  fontWeight: 500
                }}>
                  Admin Notifications
                </label>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <input
                    type="checkbox"
                    checked={profile.admin_notifications || false}
                    onChange={(e) => handleInputChange('admin_notifications', e.target.checked)}
                    style={{
                      width: '1.25rem',
                      height: '1.25rem',
                      accentColor: '#9AF23A'
                    }}
                  />
                  <span style={{ color: 'white', fontSize: '0.875rem' }}>
                    Receive admin notifications
                  </span>
                </div>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  color: '#9CA3AF',
                  fontSize: '0.875rem',
                  fontWeight: 500
                }}>
                  Meeting Notifications
                </label>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <input
                    type="checkbox"
                    checked={profile.meeting_notifications || false}
                    onChange={(e) => handleInputChange('meeting_notifications', e.target.checked)}
                    style={{
                      width: '1.25rem',
                      height: '1.25rem',
                      accentColor: '#9AF23A'
                    }}
                  />
                  <span style={{ color: 'white', fontSize: '0.875rem' }}>
                    Receive meeting notifications
                  </span>
                </div>
              </div>
            </div>

            <div style={{
              marginTop: '1.5rem',
              padding: '1rem',
              background: 'rgba(154, 242, 58, 0.1)',
              border: '1px solid rgba(154, 242, 58, 0.2)',
              borderRadius: '0.5rem'
            }}>
              <Link href="/dashboard/admin" style={{
                color: '#9AF23A',
                textDecoration: 'none',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span>Access Admin Panel</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
