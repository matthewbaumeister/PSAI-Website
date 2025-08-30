'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface ProfileFormData {
  firstName: string
  lastName: string
  companyName: string
  companySize: string
  phone: string
}

export default function ProfilePage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')
  
  const [formData, setFormData] = useState<ProfileFormData>({
    firstName: '',
    lastName: '',
    companyName: '',
    companySize: '',
    phone: ''
  })

  // Check if user is authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, isLoading, router])

  // Initialize form data when user loads
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        companyName: user.companyName || '',
        companySize: user.companySize || '',
        phone: user.phone || ''
      })
    }
  }, [user])

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
          <p style={{ color: '#c4b5fd', fontSize: '18px' }}>Loading Profile...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to login
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSave = async () => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setMessage('First name and last name are required')
      setMessageType('error')
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setMessage('Profile updated successfully!')
        setMessageType('success')
        setIsEditing(false)
        // Refresh user data
        window.location.reload()
      } else {
        const data = await response.json()
        setMessage(data.message || 'Failed to update profile')
        setMessageType('error')
      }
    } catch (error) {
      setMessage('An error occurred while updating profile')
      setMessageType('error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      companyName: user.companyName || '',
      companySize: user.companySize || '',
      phone: user.phone || ''
    })
    setIsEditing(false)
    setMessage('')
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
              <h1 style={{
                fontSize: '48px',
                fontWeight: '800',
                background: 'linear-gradient(135deg, #ffffff 0%, #c4b5fd 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                margin: 0
              }}>
                Profile
              </h1>
              <p style={{
                color: '#cbd5e1',
                marginTop: '8px',
                fontSize: '18px'
              }}>
                Manage your personal information and account details.
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

        {/* Profile Card */}
        <div style={{
          background: 'rgba(30, 41, 59, 0.6)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(148, 163, 184, 0.2)',
          borderRadius: '20px',
          padding: '32px',
          marginBottom: '32px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '24px',
            marginBottom: '32px'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontWeight: '700',
              fontSize: '32px',
              boxShadow: '0 8px 32px rgba(139, 92, 246, 0.3)',
              border: '2px solid rgba(139, 92, 246, 0.5)'
            }}>
              {user.firstName?.charAt(0) || user.email.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 style={{
                fontSize: '28px',
                fontWeight: '700',
                color: '#ffffff',
                margin: '0 0 8px 0'
              }}>
                {user.firstName} {user.lastName}
              </h2>
              <p style={{
                color: '#94a3b8',
                fontSize: '16px',
                margin: 0
              }}>
                {user.email}
              </p>
            </div>
          </div>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '24px'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '24px'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  color: '#cbd5e1',
                  fontWeight: '500',
                  marginBottom: '8px',
                  fontSize: '14px'
                }}>
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  style={{
                    width: '100%',
                    padding: '16px 20px',
                    background: isEditing ? 'rgba(15, 23, 42, 0.6)' : 'rgba(15, 23, 42, 0.3)',
                    border: '1px solid rgba(148, 163, 184, 0.3)',
                    borderRadius: '12px',
                    color: '#ffffff',
                    fontSize: '16px',
                    transition: 'all 0.2s ease',
                    opacity: isEditing ? 1 : 0.7
                  }}
                  onFocus={(e) => {
                    if (isEditing) {
                      e.target.style.borderColor = 'rgba(139, 92, 246, 0.5)'
                      e.target.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)'
                    }
                  }}
                  onBlur={(e) => {
                    if (isEditing) {
                      e.target.style.borderColor = 'rgba(148, 163, 184, 0.3)'
                      e.target.style.boxShadow = 'none'
                    }
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
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  style={{
                    width: '100%',
                    padding: '16px 20px',
                    background: isEditing ? 'rgba(15, 23, 42, 0.6)' : 'rgba(15, 23, 42, 0.3)',
                    border: '1px solid rgba(148, 163, 184, 0.3)',
                    borderRadius: '12px',
                    color: '#ffffff',
                    fontSize: '16px',
                    transition: 'all 0.2s ease',
                    opacity: isEditing ? 1 : 0.7
                  }}
                  onFocus={(e) => {
                    if (isEditing) {
                      e.target.style.borderColor = 'rgba(139, 92, 246, 0.5)'
                      e.target.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)'
                    }
                  }}
                  onBlur={(e) => {
                    if (isEditing) {
                      e.target.style.borderColor = 'rgba(148, 163, 184, 0.3)'
                      e.target.style.boxShadow = 'none'
                    }
                  }}
                />
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '24px'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  color: '#cbd5e1',
                  fontWeight: '500',
                  marginBottom: '8px',
                  fontSize: '14px'
                }}>
                  Company Name
                </label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  style={{
                    width: '100%',
                    padding: '16px 20px',
                    background: isEditing ? 'rgba(15, 23, 42, 0.6)' : 'rgba(15, 23, 42, 0.3)',
                    border: '1px solid rgba(148, 163, 184, 0.3)',
                    borderRadius: '12px',
                    color: '#ffffff',
                    fontSize: '16px',
                    transition: 'all 0.2s ease',
                    opacity: isEditing ? 1 : 0.7
                  }}
                  onFocus={(e) => {
                    if (isEditing) {
                      e.target.style.borderColor = 'rgba(139, 92, 246, 0.5)'
                      e.target.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)'
                    }
                  }}
                  onBlur={(e) => {
                    if (isEditing) {
                      e.target.style.borderColor = 'rgba(148, 163, 184, 0.3)'
                      e.target.style.boxShadow = 'none'
                    }
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
                  Company Size
                </label>
                <select
                  name="companySize"
                  value={formData.companySize}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  style={{
                    width: '100%',
                    padding: '16px 20px',
                    background: isEditing ? 'rgba(15, 23, 42, 0.6)' : 'rgba(15, 23, 42, 0.3)',
                    border: '1px solid rgba(148, 163, 184, 0.3)',
                    borderRadius: '12px',
                    color: '#ffffff',
                    fontSize: '16px',
                    transition: 'all 0.2s ease',
                    opacity: isEditing ? 1 : 0.7
                  }}
                  onFocus={(e) => {
                    if (isEditing) {
                      e.target.style.borderColor = 'rgba(139, 92, 246, 0.5)'
                      e.target.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)'
                    }
                  }}
                  onBlur={(e) => {
                    if (isEditing) {
                      e.target.style.borderColor = 'rgba(148, 163, 184, 0.3)'
                      e.target.style.boxShadow = 'none'
                    }
                  }}
                >
                  <option value="">Select company size</option>
                  <option value="1-10">1-10 employees</option>
                  <option value="11-50">11-50 employees</option>
                  <option value="51-200">51-200 employees</option>
                  <option value="201-500">201-500 employees</option>
                  <option value="501-1000">501-1000 employees</option>
                  <option value="1000+">1000+ employees</option>
                </select>
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr',
              gap: '24px'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  color: '#cbd5e1',
                  fontWeight: '500',
                  marginBottom: '8px',
                  fontSize: '14px'
                }}>
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  style={{
                    width: '100%',
                    maxWidth: '400px',
                    padding: '16px 20px',
                    background: isEditing ? 'rgba(15, 23, 42, 0.6)' : 'rgba(15, 23, 42, 0.3)',
                    border: '1px solid rgba(148, 163, 184, 0.3)',
                    borderRadius: '12px',
                    color: '#ffffff',
                    fontSize: '16px',
                    transition: 'all 0.2s ease',
                    opacity: isEditing ? 1 : 0.7
                  }}
                  onFocus={(e) => {
                    if (isEditing) {
                      e.target.style.borderColor = 'rgba(139, 92, 246, 0.5)'
                      e.target.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)'
                    }
                  }}
                  onBlur={(e) => {
                    if (isEditing) {
                      e.target.style.borderColor = 'rgba(148, 163, 184, 0.3)'
                      e.target.style.boxShadow = 'none'
                    }
                  }}
                />
              </div>
            </div>
          </div>

          <div style={{
            display: 'flex',
            gap: '16px',
            marginTop: '32px'
          }}>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                style={{
                  padding: '16px 32px',
                  background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#ffffff',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(139, 92, 246, 0.3)'
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
                  onClick={handleSave}
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
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={handleCancel}
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
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>

        {/* Account Status */}
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
            Account Status
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px'
          }}>
            <div style={{
              padding: '20px',
              background: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid rgba(34, 197, 94, 0.2)',
              borderRadius: '16px',
              textAlign: 'center'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: 'rgba(34, 197, 94, 0.2)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px'
              }}>
                <svg style={{ width: '24px', height: '24px', color: '#86efac' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p style={{
                color: '#86efac',
                fontSize: '14px',
                fontWeight: '500',
                margin: '0 0 4px 0'
              }}>
                Account Status
              </p>
              <p style={{
                color: '#ffffff',
                fontSize: '18px',
                fontWeight: '600',
                margin: 0
              }}>
                Active
              </p>
            </div>

            <div style={{
              padding: '20px',
              background: 'rgba(139, 92, 246, 0.1)',
              border: '1px solid rgba(139, 92, 246, 0.2)',
              borderRadius: '16px',
              textAlign: 'center'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: 'rgba(139, 92, 246, 0.2)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px'
              }}>
                <svg style={{ width: '24px', height: '24px', color: '#c4b5fd' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a0 0 0 00-7-7z" />
                </svg>
              </div>
              <p style={{
                color: '#c4b5fd',
                fontSize: '14px',
                fontWeight: '500',
                margin: '0 0 4px 0'
              }}>
                Member Since
              </p>
              <p style={{
                color: '#ffffff',
                fontSize: '18px',
                fontWeight: '600',
                margin: 0
              }}>
                2025
              </p>
            </div>

            <div style={{
              padding: '20px',
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              borderRadius: '16px',
              textAlign: 'center'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: 'rgba(59, 130, 246, 0.2)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px'
              }}>
                <svg style={{ width: '24px', height: '24px', color: '#93c5fd' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p style={{
                color: '#93c5fd',
                fontSize: '14px',
                fontWeight: '500',
                margin: '0 0 4px 0'
              }}>
                Email Verified
              </p>
              <p style={{
                color: '#ffffff',
                fontSize: '18px',
                fontWeight: '600',
                margin: 0
              }}>
                {user.emailVerified ? 'Yes' : 'No'}
              </p>
            </div>

            {user.isAdmin && (
              <div style={{
                padding: '20px',
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.2)',
                borderRadius: '16px',
                textAlign: 'center'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  background: 'rgba(245, 158, 11, 0.2)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px'
                }}>
                  <svg style={{ width: '24px', height: '24px', color: '#fcd34d' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p style={{
                  color: '#fcd34d',
                  fontSize: '14px',
                  fontWeight: '500',
                  margin: '0 0 4px 0'
                }}>
                  Admin Access
                </p>
                <p style={{
                  color: '#ffffff',
                  fontSize: '18px',
                  fontWeight: '600',
                  margin: 0
                }}>
                  Enabled
                </p>
              </div>
            )}
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
