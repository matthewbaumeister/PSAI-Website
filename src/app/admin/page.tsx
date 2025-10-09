'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  company_name: string
  company_size: string
  email_verified_at: string | null
  is_admin: boolean
  is_active: boolean
  last_login_at: string | null
  created_at: string
}

interface AdminInvitation {
  id: string
  email: string
  invited_by: string
  status: 'pending' | 'accepted' | 'expired'
  created_at: string
  expires_at: string
}

interface SystemStats {
  totalUsers: number
  verifiedUsers: number
  adminUsers: number
  activeUsers: number
  totalSessions: number
}

export default function AdminDashboard() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  
  const [users, setUsers] = useState<User[]>([])
  const [invitations, setInvitations] = useState<AdminInvitation[]>([])
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [isLoadingInvitations, setIsLoadingInvitations] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [isInviting, setIsInviting] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error' | 'warning'>('success')

  // SBIR Database state
  const [sbirStats, setSbirStats] = useState<any>(null)
  const [sbirScraperStatus, setSbirScraperStatus] = useState<'idle' | 'running'>('idle')
  const [isLoadingSbirStats, setIsLoadingSbirStats] = useState(false)

  // Check if user is admin
  useEffect(() => {
    if (!isLoading && (!user || !user.isAdmin)) {
      router.push('/auth/login')
    }
  }, [user, isLoading, router])

  // Load admin data
  useEffect(() => {
    if (user?.isAdmin) {
      loadUsers()
      loadInvitations()
      loadStats()
      // Load SBIR stats
      loadSbirStats()
    }
  }, [user])

  const loadUsers = async () => {
    setIsLoadingUsers(true)
    try {
      const response = await fetch('/api/admin/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
        if (data.message) {
          setMessage(data.message)
          setMessageType('warning')
        } else {
          setMessage('') // Clear any previous messages
        }
      } else {
        console.error('Failed to load users:', response.status)
        const errorData = await response.json()
        setUsers([])
        setMessage(`Failed to load users: ${errorData.details || errorData.error || 'Unknown error'}`)
        setMessageType('error')
      }
    } catch (error) {
      console.error('Error loading users:', error)
      setUsers([])
      setMessage('Error loading users data')
      setMessageType('error')
    } finally {
      setIsLoadingUsers(false)
    }
  }

  const loadInvitations = async () => {
    setIsLoadingInvitations(true)
    try {
      const response = await fetch('/api/admin/invitations')
      if (response.ok) {
        const data = await response.json()
        setInvitations(data.invitations)
      } else {
        setMessage('Failed to load invitations')
        setMessageType('error')
      }
    } catch (error) {
      setMessage('Error loading invitations')
      setMessageType('error')
    } finally {
      setIsLoadingInvitations(false)
    }
  }

  const loadStats = async () => {
    try {
      const response = await fetch('/api/admin/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail.trim()) return

    setIsInviting(true)
    try {
      const response = await fetch('/api/admin/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: inviteEmail })
      })

      if (response.ok) {
        setMessage('Admin invitation sent successfully!')
        setMessageType('success')
        setInviteEmail('')
        loadInvitations()
      } else {
        const data = await response.json()
        setMessage(data.message || 'Failed to send invitation')
        setMessageType('error')
      }
    } catch (error) {
      setMessage('Error sending invitation')
      setMessageType('error')
    } finally {
      setIsInviting(false)
    }
  }

  const handleToggleRole = async (userId: string) => {
    try {
      // First, get the current user to determine their current admin status
      const currentUser = users.find(u => u.id === userId)
      if (!currentUser) {
        setMessage('User not found')
        setMessageType('error')
        return
      }

      // Toggle the admin status
      const newAdminStatus = !currentUser.is_admin

      const response = await fetch('/api/admin/users/toggle-role', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userId,
          isAdmin: newAdminStatus
        })
      })

      if (response.ok) {
        loadUsers()
        loadStats()
        setMessage(`User ${newAdminStatus ? 'promoted to' : 'removed from'} admin successfully!`)
        setMessageType('success')
      } else {
        const data = await response.json()
        setMessage(data.message || 'Failed to update user role')
        setMessageType('error')
      }
    } catch (error) {
      setMessage('Error updating user role')
      setMessageType('error')
    }
  }

  const handleToggleStatus = async (userId: string) => {
    try {
      const response = await fetch('/api/admin/users/toggle-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId })
      })

      if (response.ok) {
        loadUsers()
        loadStats()
        setMessage('User status updated successfully!')
        setMessageType('success')
      } else {
        const data = await response.json()
        setMessage(data.message || 'Failed to update user status')
        setMessageType('error')
      }
    } catch (error) {
      setMessage('Error updating user status')
      setMessageType('error')
    }
  }

  const handleRemoveUser = async (userId: string, userEmail: string) => {
    try {
      // Confirm deletion
      if (!confirm(`Are you sure you want to remove user "${userEmail}"? This action cannot be undone.`)) {
        return
      }

      const response = await fetch('/api/admin/users/remove', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId })
      })

      if (response.ok) {
        loadUsers()
        loadStats()
        setMessage(`User "${userEmail}" removed successfully!`)
        setMessageType('success')
      } else {
        const data = await response.json()
        setMessage(data.message || 'Failed to remove user')
        setMessageType('error')
      }
    } catch (error) {
      setMessage('Error removing user')
      setMessageType('error')
    }
  }

  const handleDeleteInvitation = async (invitationId: string) => {
    try {
      const response = await fetch(`/api/admin/invitations/${invitationId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        loadInvitations()
        setMessage('Invitation deleted successfully!')
        setMessageType('success')
      } else {
        setMessage('Failed to delete invitation')
        setMessageType('error')
      }
    } catch (error) {
      setMessage('Error deleting invitation')
      setMessageType('error')
    }
  }

  // SBIR Database functions
  const loadSbirStats = async () => {
    setIsLoadingSbirStats(true)
    try {
      const response = await fetch('/api/admin/sbir/stats')
      if (response.ok) {
        const data = await response.json()
        setSbirStats(data)
      }
    } catch (error) {
      console.error('Error loading SBIR stats:', error)
    } finally {
      setIsLoadingSbirStats(false)
    }
  }

  const checkSbirScraperStatus = async () => {
    try {
      const response = await fetch('/api/admin/sbir/scraper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'check_status' })
      })
      if (response.ok) {
        const data = await response.json()
        setSbirScraperStatus(data.status)
      }
    } catch (error) {
      console.error('Error checking SBIR scraper status:', error)
    }
  }

  const startSbirScraper = async () => {
    try {
      setMessage('🚀 Starting SBIR database scraper...')
      setMessageType('success')
      
      const response = await fetch('/api/admin/sbir/scraper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start_scraper' })
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setMessage(`✅ SBIR scraper completed! Processed ${data.processed} records.`)
          setMessageType('success')
          loadSbirStats()
        } else {
          setMessage('❌ SBIR scraper failed: ' + data.error)
          setMessageType('error')
        }
      } else {
        setMessage('❌ Failed to start SBIR scraper')
        setMessageType('error')
      }
    } catch (error) {
      console.error('Error starting SBIR scraper:', error)
      setMessage('❌ Error starting SBIR scraper')
      setMessageType('error')
    }
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
          <p style={{ color: '#c4b5fd', fontSize: '18px' }}>Loading Admin Dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user || !user.isAdmin) {
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
              <h1 style={{
                fontSize: '48px',
                fontWeight: '800',
                background: 'linear-gradient(135deg, #ffffff 0%, #c4b5fd 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                margin: 0
              }}>
                Admin Dashboard
              </h1>
              <p style={{
                color: '#cbd5e1',
                marginTop: '8px',
                fontSize: '18px'
              }}>
                Welcome back, {user.firstName}! Manage your system and users.
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
          
          {/* System Messages - Always Visible on New Line */}
          {message && (
            <div style={{
              background: messageType === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              border: `1px solid ${messageType === 'success' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              borderRadius: '12px',
              padding: '16px 20px',
              marginTop: '24px',
              color: messageType === 'success' ? '#86efac' : '#fca5a5',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
              width: '100%'
            }}>
              <div style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: messageType === 'success' ? '#22c55e' : '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                {messageType === 'success' ? '✓' : '✕'}
              </div>
              <div style={{
                flex: 1,
                whiteSpace: 'pre-line',
                lineHeight: '1.5'
              }}>
                {message}
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '32px 24px'
      }}>
        {/* Message */}


        {/* System Statistics */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '24px',
          marginBottom: '48px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.05))',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            borderRadius: '20px',
            padding: '32px',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            cursor: 'pointer'
          }} onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)'
            e.currentTarget.style.boxShadow = '0 20px 40px rgba(59, 130, 246, 0.2)'
          }} onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)'
            e.currentTarget.style.boxShadow = 'none'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px'
            }}>
              <div style={{
                width: '56px',
                height: '56px',
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(59, 130, 246, 0.2))',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 32px rgba(59, 130, 246, 0.2)',
                border: '1px solid rgba(59, 130, 246, 0.3)'
              }}>
                <svg style={{ width: '28px', height: '28px', color: '#93c5fd' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ color: '#93c5fd', fontSize: '14px', fontWeight: '500', margin: 0 }}>Total Users</p>
                <p style={{ fontSize: '32px', fontWeight: '800', color: '#ffffff', margin: 0 }}>{stats?.totalUsers || 0}</p>
              </div>
            </div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(34, 197, 94, 0.05))',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(34, 197, 94, 0.2)',
            borderRadius: '20px',
            padding: '32px',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            cursor: 'pointer'
          }} onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)'
            e.currentTarget.style.boxShadow = '0 20px 40px rgba(34, 197, 94, 0.2)'
          }} onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)'
            e.currentTarget.style.boxShadow = 'none'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px'
            }}>
              <div style={{
                width: '56px',
                height: '56px',
                background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.3), rgba(34, 197, 94, 0.2))',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 32px rgba(34, 197, 94, 0.2)',
                border: '1px solid rgba(34, 197, 94, 0.3)'
              }}>
                <svg style={{ width: '28px', height: '28px', color: '#86efac' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ color: '#86efac', fontSize: '14px', fontWeight: '500', margin: 0 }}>Verified Users</p>
                <p style={{ fontSize: '32px', fontWeight: '800', color: '#ffffff', margin: 0 }}>{stats?.verifiedUsers || 0}</p>
              </div>
            </div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(139, 92, 246, 0.05))',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(139, 92, 246, 0.2)',
            borderRadius: '20px',
            padding: '32px',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            cursor: 'pointer'
          }} onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)'
            e.currentTarget.style.boxShadow = '0 20px 40px rgba(139, 92, 246, 0.2)'
          }} onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)'
            e.currentTarget.style.boxShadow = 'none'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px'
            }}>
              <div style={{
                width: '56px',
                height: '56px',
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(139, 92, 246, 0.2))',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 32px rgba(139, 92, 246, 0.2)',
                border: '1px solid rgba(139, 92, 246, 0.3)'
              }}>
                <svg style={{ width: '28px', height: '28px', color: '#c4b5fd' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ color: '#c4b5fd', fontSize: '14px', fontWeight: '500', margin: 0 }}>Admin Users</p>
                <p style={{ fontSize: '32px', fontWeight: '800', color: '#ffffff', margin: 0 }}>{stats?.adminUsers || 0}</p>
              </div>
            </div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(245, 158, 11, 0.05))',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(245, 158, 11, 0.2)',
            borderRadius: '20px',
            padding: '32px',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            cursor: 'pointer'
          }} onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)'
            e.currentTarget.style.boxShadow = '0 20px 40px rgba(245, 158, 11, 0.2)'
          }} onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)'
            e.currentTarget.style.boxShadow = 'none'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px'
            }}>
              <div style={{
                width: '56px',
                height: '56px',
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.3), rgba(245, 158, 11, 0.2))',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 32px rgba(245, 158, 11, 0.2)',
                border: '1px solid rgba(245, 158, 11, 0.3)'
              }}>
                <svg style={{ width: '28px', height: '28px', color: '#fcd34d' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ color: '#fcd34d', fontSize: '14px', fontWeight: '500', margin: 0 }}>Active Users</p>
                <p style={{ fontSize: '32px', fontWeight: '800', color: '#ffffff', margin: 0 }}>{stats?.activeUsers || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Invitation Form */}
        <div style={{
          background: 'rgba(30, 41, 59, 0.6)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(148, 163, 184, 0.2)',
          borderRadius: '20px',
          padding: '32px',
          marginBottom: '32px'
        }}>
          <h2 style={{
            fontSize: '28px',
            fontWeight: '700',
            color: '#ffffff',
            margin: '0 0 24px 0'
          }}>
            Invite New Admin
          </h2>
          <form onSubmit={handleInvite} style={{
            display: 'flex',
            gap: '20px',
            alignItems: 'flex-start'
          }}>
            <div style={{ flex: 1 }}>
              <label style={{
                display: 'block',
                color: '#cbd5e1',
                fontWeight: '500',
                marginBottom: '8px',
                fontSize: '14px'
              }}>
                Email Address
              </label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="Enter email address"
                required
                style={{
                  width: '100%',
                  padding: '16px 20px',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(148, 163, 184, 0.3)',
                  borderRadius: '12px',
                  color: '#ffffff',
                  fontSize: '16px',
                  transition: 'all 0.2s ease'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'rgba(139, 92, 246, 0.5)'
                  e.target.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(148, 163, 184, 0.3)'
                  e.target.style.boxShadow = 'none'
                }}
              />
            </div>
            <div style={{ marginTop: '24px' }}>
              <button
                type="submit"
                disabled={isInviting}
                style={{
                  padding: '16px 32px',
                  background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#ffffff',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: isInviting ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  opacity: isInviting ? 0.6 : 1,
                  minWidth: '140px'
                }}
                onMouseEnter={(e) => {
                  if (!isInviting) {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(139, 92, 246, 0.3)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isInviting) {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }
                }}
              >
                {isInviting ? 'Sending...' : 'Send Invitation'}
              </button>
            </div>
          </form>
        </div>

        {/* Users Management */}
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
            justifyContent: 'space-between',
            marginBottom: '24px'
          }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: '#ffffff',
              margin: 0
            }}>
              User Management
            </h2>
            <button
              onClick={loadUsers}
              disabled={isLoadingUsers}
              style={{
                padding: '12px 20px',
                background: 'rgba(59, 130, 246, 0.2)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '10px',
                color: '#93c5fd',
                fontSize: '14px',
                fontWeight: '500',
                cursor: isLoadingUsers ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                opacity: isLoadingUsers ? 0.6 : 1
              }}
              onMouseEnter={(e) => {
                if (!isLoadingUsers) {
                  e.currentTarget.style.background = 'rgba(59, 130, 246, 0.3)'
                  e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.5)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoadingUsers) {
                  e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)'
                  e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)'
                }
              }}
            >
              {isLoadingUsers ? 'Loading...' : 'Refresh'}
            </button>
          </div>

          <div style={{
            overflow: 'auto',
            borderRadius: '12px',
            border: '1px solid rgba(148, 163, 184, 0.2)'
          }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse'
            }}>
              <thead>
                <tr style={{
                  background: 'rgba(15, 23, 42, 0.8)',
                  borderBottom: '1px solid rgba(148, 163, 184, 0.2)'
                }}>
                  <th style={{
                    padding: '16px 20px',
                    textAlign: 'left',
                    color: '#cbd5e1',
                    fontWeight: '600',
                    fontSize: '14px'
                  }}>User</th>
                  <th style={{
                    padding: '16px 20px',
                    textAlign: 'left',
                    color: '#cbd5e1',
                    fontWeight: '600',
                    fontSize: '14px'
                  }}>Company</th>
                  <th style={{
                    padding: '16px 20px',
                    textAlign: 'left',
                    color: '#cbd5e1',
                    fontWeight: '600',
                    fontSize: '14px'
                  }}>Status</th>
                  <th style={{
                    padding: '16px 20px',
                    textAlign: 'left',
                    color: '#cbd5e1',
                    fontWeight: '600',
                    fontSize: '14px'
                  }}>Role</th>
                  <th style={{
                    padding: '16px 20px',
                    textAlign: 'left',
                    color: '#cbd5e1',
                    fontWeight: '600',
                    fontSize: '14px'
                  }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} style={{
                    borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
                    transition: 'background 0.2s ease'
                  }} onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(15, 23, 42, 0.3)'
                  }} onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                  }}>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                      }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ffffff',
                          fontWeight: '600',
                          fontSize: '16px'
                        }}>
                          {user.first_name.charAt(0)}{user.last_name.charAt(0)}
                        </div>
                        <div>
                          <div style={{
                            color: '#ffffff',
                            fontWeight: '600',
                            fontSize: '16px'
                          }}>
                            {user.first_name} {user.last_name}
                          </div>
                          <div style={{
                            color: '#94a3b8',
                            fontSize: '14px'
                          }}>
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{
                      padding: '16px 20px',
                      color: '#cbd5e1'
                    }}>
                      {user.company_name || 'N/A'}
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <span style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: user.is_active ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                        color: user.is_active ? '#86efac' : '#fca5a5',
                        border: `1px solid ${user.is_active ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                      }}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <span style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: user.is_admin ? 'rgba(139, 92, 246, 0.2)' : 'rgba(148, 163, 184, 0.2)',
                        color: user.is_admin ? '#c4b5fd' : '#94a3b8',
                        border: `1px solid ${user.is_admin ? 'rgba(139, 92, 246, 0.3)' : 'rgba(148, 163, 184, 0.3)'}`
                      }}>
                        {user.is_admin ? 'Admin' : 'User'}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{
                        display: 'flex',
                        gap: '8px'
                      }}>
                        <button
                          onClick={() => handleToggleRole(user.id)}
                          style={{
                            padding: '8px 16px',
                            background: user.is_admin ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                            border: `1px solid ${user.is_admin ? 'rgba(239, 68, 68, 0.3)' : 'rgba(34, 197, 94, 0.3)'}`,
                            borderRadius: '8px',
                            color: user.is_admin ? '#fca5a5' : '#86efac',
                            fontSize: '12px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-1px)'
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)'
                            e.currentTarget.style.boxShadow = 'none'
                          }}
                        >
                          {user.is_admin ? 'Remove Admin' : 'Make Admin'}
                        </button>
                        <button
                          onClick={() => handleRemoveUser(user.id, user.email)}
                          style={{
                            padding: '8px 16px',
                            background: 'rgba(239, 68, 68, 0.2)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: '8px',
                            color: '#fca5a5',
                            fontSize: '12px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-1px)'
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)'
                            e.currentTarget.style.boxShadow = 'none'
                          }}
                        >
                          🗑️ Remove User
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Admin Invitations */}
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
            justifyContent: 'space-between',
            marginBottom: '24px'
          }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: '#ffffff',
              margin: 0
            }}>
              Admin Invitations
            </h2>
            <button
              onClick={loadInvitations}
              disabled={isLoadingInvitations}
              style={{
                padding: '12px 20px',
                background: 'rgba(59, 130, 246, 0.2)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '10px',
                color: '#93c5fd',
                fontSize: '14px',
                fontWeight: '500',
                cursor: isLoadingInvitations ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                opacity: isLoadingInvitations ? 0.6 : 1
              }}
              onMouseEnter={(e) => {
                if (!isLoadingInvitations) {
                  e.currentTarget.style.background = 'rgba(59, 130, 246, 0.3)'
                  e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.5)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoadingInvitations) {
                  e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)'
                  e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)'
                }
              }}
            >
              {isLoadingInvitations ? 'Loading...' : 'Refresh'}
            </button>
          </div>

          <div style={{
            overflow: 'auto',
            borderRadius: '12px',
            border: '1px solid rgba(148, 163, 184, 0.2)'
          }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse'
            }}>
              <thead>
                <tr style={{
                  background: 'rgba(15, 23, 42, 0.8)',
                  borderBottom: '1px solid rgba(148, 163, 184, 0.2)'
                }}>
                  <th style={{
                    padding: '16px 20px',
                    textAlign: 'left',
                    color: '#cbd5e1',
                    fontWeight: '600',
                    fontSize: '14px'
                  }}>Email</th>
                  <th style={{
                    padding: '16px 20px',
                    textAlign: 'left',
                    color: '#cbd5e1',
                    fontWeight: '600',
                    fontSize: '14px'
                  }}>Invited By</th>
                  <th style={{
                    padding: '16px 20px',
                    textAlign: 'left',
                    color: '#cbd5e1',
                    fontWeight: '600',
                    fontSize: '14px'
                  }}>Status</th>
                  <th style={{
                    padding: '16px 20px',
                    textAlign: 'left',
                    color: '#cbd5e1',
                    fontWeight: '600',
                    fontSize: '14px'
                  }}>Expires</th>
                  <th style={{
                    padding: '16px 20px',
                    textAlign: 'left',
                    color: '#cbd5e1',
                    fontWeight: '600',
                    fontSize: '14px'
                  }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invitations.map((invitation) => (
                  <tr key={invitation.id} style={{
                    borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
                    transition: 'background 0.2s ease'
                  }} onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(15, 23, 42, 0.3)'
                  }} onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                  }}>
                    <td style={{
                      padding: '16px 20px',
                      color: '#ffffff',
                      fontWeight: '500'
                    }}>
                      {invitation.email}
                    </td>
                    <td style={{
                      padding: '16px 20px',
                      color: '#cbd5e1'
                    }}>
                      {invitation.invited_by}
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <span style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: invitation.status === 'pending' ? 'rgba(245, 158, 11, 0.2)' : 
                                   invitation.status === 'accepted' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                        color: invitation.status === 'pending' ? '#fcd34d' : 
                               invitation.status === 'accepted' ? '#86efac' : '#fca5a5',
                        border: `1px solid ${invitation.status === 'pending' ? 'rgba(245, 158, 11, 0.3)' : 
                                         invitation.status === 'accepted' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                      }}>
                        {invitation.status.charAt(0).toUpperCase() + invitation.status.slice(1)}
                      </span>
                    </td>
                    <td style={{
                      padding: '16px 20px',
                      color: '#cbd5e1',
                      fontSize: '14px'
                    }}>
                      {new Date(invitation.expires_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      {invitation.status === 'pending' && (
                        <button
                          onClick={() => handleDeleteInvitation(invitation.id)}
                          style={{
                            padding: '8px 16px',
                            background: 'rgba(239, 68, 68, 0.2)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: '8px',
                            color: '#fca5a5',
                            fontSize: '12px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-1px)'
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)'
                            e.currentTarget.style.boxShadow = 'none'
                          }}
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* DSIP & SBIR Quick Access */}
        <div style={{
          background: 'rgba(30, 41, 59, 0.6)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(148, 163, 184, 0.2)',
          borderRadius: '20px',
          padding: '32px',
          marginBottom: '32px'
        }}>
          <h2 style={{
            fontSize: '28px',
            fontWeight: '700',
            color: '#ffffff',
            margin: '0 0 24px 0'
          }}>
            🍪 DSIP & SBIR Management
          </h2>
          <p style={{
            color: '#cbd5e1',
            fontSize: '16px',
            lineHeight: '1.6',
            margin: '0 0 24px 0'
          }}>
            Quick access to DSIP scraper settings and SBIR database management tools.
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '16px'
          }}>
            <button
              onClick={() => router.push('/admin/dsip-settings')}
              style={{
                padding: '16px 20px',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                border: 'none',
                borderRadius: '12px',
                color: '#ffffff',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)',
                textAlign: 'left'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(139, 92, 246, 0.4)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(139, 92, 246, 0.3)'
              }}
            >
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>🔧</div>
              <div style={{ fontSize: '16px', fontWeight: '700', marginBottom: '4px' }}>DSIP Scraper Settings</div>
              <div style={{ fontSize: '13px', opacity: '0.9' }}>Configure and monitor the DSIP web scraper</div>
            </button>
            
            <button
              onClick={() => window.open('/dsip-search', '_blank')}
              style={{
                padding: '16px 20px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                border: 'none',
                borderRadius: '12px',
                color: '#ffffff',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
                textAlign: 'left'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.4)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.3)'
              }}
            >
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>🔍</div>
              <div style={{ fontSize: '16px', fontWeight: '700', marginBottom: '4px' }}>DSIP Search Tool</div>
              <div style={{ fontSize: '13px', opacity: '0.9' }}>Search 33,000+ defense opportunities</div>
            </button>
            
            <button
              onClick={startSbirScraper}
              style={{
                padding: '16px 20px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                border: 'none',
                borderRadius: '12px',
                color: '#ffffff',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)',
                textAlign: 'left'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.4)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(59, 130, 246, 0.3)'
              }}
            >
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>🗄️</div>
              <div style={{ fontSize: '16px', fontWeight: '700', marginBottom: '4px' }}>SBIR Database</div>
              <div style={{ fontSize: '13px', opacity: '0.9' }}>Update SBIR/STTR records</div>
            </button>
          </div>

          {/* SBIR Database Management Section */}
          <div 
            id="sbir-management-section"
            style={{
              background: 'rgba(15, 23, 42, 0.4)',
              borderRadius: '12px',
              padding: '24px',
              border: '1px solid rgba(148, 163, 184, 0.1)',
              marginTop: '24px'
            }}
          >
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#ffffff',
              margin: '0 0 16px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              🗄️ SBIR Database Overview
            </h3>
            <p style={{
              color: '#cbd5e1',
              fontSize: '14px',
              lineHeight: '1.6',
              margin: '0 0 20px 0'
            }}>
              Overview of the DoD SBIR/STTR database status and quick access to management tools.
            </p>

            {/* SBIR Stats */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              marginBottom: '24px'
            }}>
              <div style={{
                background: 'rgba(34, 197, 94, 0.1)',
                borderRadius: '8px',
                padding: '16px',
                border: '1px solid rgba(34, 197, 94, 0.2)'
              }}>
                <div style={{ color: '#22c55e', fontSize: '24px', fontWeight: 'bold' }}>
                  {sbirStats?.totalRecords?.toLocaleString() || '0'}
                </div>
                <div style={{ color: '#86efac', fontSize: '12px' }}>Total Records</div>
              </div>
              <div style={{
                background: 'rgba(59, 130, 246, 0.1)',
                borderRadius: '8px',
                padding: '16px',
                border: '1px solid rgba(59, 130, 246, 0.2)'
              }}>
                <div style={{ color: '#3b82f6', fontSize: '24px', fontWeight: 'bold' }}>
                  {sbirStats?.recentRecords?.toLocaleString() || '0'}
                </div>
                <div style={{ color: '#93c5fd', fontSize: '12px' }}>Recent Updates</div>
              </div>
              <div style={{
                background: 'rgba(139, 92, 246, 0.1)',
                borderRadius: '8px',
                padding: '16px',
                border: '1px solid rgba(139, 92, 246, 0.2)'
              }}>
                <div style={{ color: '#8b5cf6', fontSize: '24px', fontWeight: 'bold' }}>
                  {sbirStats?.components?.[0]?.component || 'N/A'}
                </div>
                <div style={{ color: '#c4b5fd', fontSize: '12px' }}>Top Component</div>
              </div>
              <div style={{
                background: 'rgba(245, 158, 11, 0.1)',
                borderRadius: '8px',
                padding: '16px',
                border: '1px solid rgba(245, 158, 11, 0.2)'
              }}>
                <div style={{ color: '#f59e0b', fontSize: '24px', fontWeight: 'bold' }}>
                  {sbirScraperStatus === 'running' ? 'Running' : 'Idle'}
                </div>
                <div style={{ color: '#fcd34d', fontSize: '12px' }}>Scraper Status</div>
              </div>
            </div>

            {/* SBIR Controls */}
            <div style={{
              display: 'flex',
              gap: '12px',
              flexWrap: 'wrap',
              marginBottom: '20px'
            }}>
              <button
                onClick={startSbirScraper}
                disabled={sbirScraperStatus === 'running'}
                style={{
                  padding: '12px 20px',
                  background: sbirScraperStatus === 'running' 
                    ? 'rgba(148, 163, 184, 0.3)' 
                    : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: sbirScraperStatus === 'running' ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: sbirScraperStatus === 'running' ? 'none' : '0 4px 15px rgba(16, 185, 129, 0.3)'
                }}
              >
                {sbirScraperStatus === 'running' ? '🔄 Running...' : '🚀 Start Daily Update'}
              </button>

              <button
                onClick={checkSbirScraperStatus}
                style={{
                  padding: '12px 20px',
                  background: 'rgba(59, 130, 246, 0.2)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: '8px',
                  color: '#93c5fd',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                🔍 Check Status
              </button>

              <button
                onClick={() => {
                  const sbirSection = document.getElementById('sbir-management-section');
                  if (sbirSection) {
                    sbirSection.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                style={{
                  padding: '12px 20px',
                  background: 'rgba(139, 92, 246, 0.2)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  borderRadius: '8px',
                  color: '#c4b5fd',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                📊 View Database
              </button>
              <button
                onClick={() => router.push('/admin/users')}
                style={{
                  padding: '12px 20px',
                  background: 'rgba(59, 130, 246, 0.2)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: '8px',
                  color: '#93c5fd',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  marginLeft: '12px'
                }}
              >
                👥 View Users
              </button>
              <button
                onClick={() => router.push('/admin/dsip-settings')}
                style={{
                  padding: '12px 20px',
                  background: 'rgba(139, 92, 246, 0.2)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  borderRadius: '8px',
                  color: '#c4b5fd',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  marginLeft: '12px'
                }}
              >
                🔍 DSIP Settings
              </button>
            </div>

            {/* SBIR Info */}
            <div style={{
              background: 'rgba(0, 0, 0, 0.2)',
              borderRadius: '8px',
              padding: '16px',
              border: '1px solid rgba(148, 163, 184, 0.1)'
            }}>
              <h4 style={{
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: '600',
                margin: '0 0 8px 0'
              }}>
                Database Information
              </h4>
              <p style={{
                color: '#cbd5e1',
                fontSize: '12px',
                lineHeight: '1.5',
                margin: '0 0 8px 0'
              }}>
                • <strong>Total Records:</strong> {sbirStats?.totalRecords?.toLocaleString() || 'Loading...'} SBIR/STTR topics
              </p>
              <p style={{
                color: '#cbd5e1',
                fontSize: '12px',
                lineHeight: '1.5',
                margin: '0 0 8px 0'
              }}>
                • <strong>Last Updated:</strong> {sbirStats?.lastUpdated ? new Date(sbirStats.lastUpdated).toLocaleString() : 'Never'}
              </p>
              <p style={{
                color: '#cbd5e1',
                fontSize: '12px',
                lineHeight: '1.5',
                margin: '0'
              }}>
                • <strong>Auto-Update:</strong> Daily at 2:00 AM EST
              </p>
            </div>
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
