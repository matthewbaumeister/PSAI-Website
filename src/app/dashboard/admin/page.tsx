'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

interface MeetingRequest {
  id: string
  name: string
  email: string
  company: string
  message: string
  created_at: string
  status: 'pending' | 'approved' | 'rejected'
}

interface User {
  id: string
  email: string
  first_name?: string
  last_name?: string
  company?: string
  role: string
  is_admin: boolean
  created_at: string
}

export default function AdminPage() {
  const { user } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [meetingRequests, setMeetingRequests] = useState<MeetingRequest[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [activeTab, setActiveTab] = useState<'overview' | 'meetings' | 'users'>('overview')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      checkAdminStatus()
    }
  }, [user])

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
        if (data.isAdmin) {
          loadAdminData()
        }
      }
    } catch (error) {
      console.error('Error checking admin status:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAdminData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      // Load meeting requests
      const meetingsResponse = await fetch('/api/admin/meetings', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      if (meetingsResponse.ok) {
        const meetingsData = await meetingsResponse.json()
        setMeetingRequests(meetingsData)
      }

      // Load users
      const usersResponse = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      if (usersResponse.ok) {
        const usersData = await usersResponse.json()
        setUsers(usersData)
      }
    } catch (error) {
      console.error('Error loading admin data:', error)
    }
  }

  const handleMeetingStatusChange = async (requestId: string, status: 'approved' | 'rejected') => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch(`/api/admin/meetings/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        setMeetingRequests(prev => 
          prev.map(req => 
            req.id === requestId ? { ...req, status } : req
          )
        )
      }
    } catch (error) {
      console.error('Error updating meeting request:', error)
    }
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white'
      }}>
        <div>Loading...</div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white'
      }}>
        <div>Access denied. Admin privileges required.</div>
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
        maxWidth: '1200px',
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
            ADMIN PANEL
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
            Admin Dashboard
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

        {/* Quick Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            padding: '1.5rem',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '1rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#9AF23A', marginBottom: '0.5rem' }}>
              {meetingRequests.length}
            </div>
            <div style={{ color: '#9CA3AF', fontSize: '0.875rem' }}>Total Meeting Requests</div>
          </div>

          <div style={{
            padding: '1.5rem',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '1rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#2D5BFF', marginBottom: '0.5rem' }}>
              {meetingRequests.filter(req => req.status === 'pending').length}
            </div>
            <div style={{ color: '#9CA3AF', fontSize: '0.875rem' }}>Pending Requests</div>
          </div>

          <div style={{
            padding: '1.5rem',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '1rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#FF7A29', marginBottom: '0.5rem' }}>
              {users.length}
            </div>
            <div style={{ color: '#9CA3AF', fontSize: '0.875rem' }}>Total Users</div>
          </div>

          <div style={{
            padding: '1.5rem',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '1rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#9AF23A', marginBottom: '0.5rem' }}>
              {users.filter(u => u.is_admin).length}
            </div>
            <div style={{ color: '#9CA3AF', fontSize: '0.875rem' }}>Admin Users</div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '2rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <button
            onClick={() => setActiveTab('overview')}
            style={{
              padding: '1rem 1.5rem',
              background: activeTab === 'overview' ? 'rgba(154, 242, 58, 0.1)' : 'transparent',
              border: 'none',
              color: activeTab === 'overview' ? '#9AF23A' : 'white',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              borderBottom: activeTab === 'overview' ? '2px solid #9AF23A' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('meetings')}
            style={{
              padding: '1rem 1.5rem',
              background: activeTab === 'meetings' ? 'rgba(154, 242, 58, 0.1)' : 'transparent',
              border: 'none',
              color: activeTab === 'meetings' ? '#9AF23A' : 'white',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              borderBottom: activeTab === 'meetings' ? '2px solid #9AF23A' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            Meeting Requests
          </button>
          <button
            onClick={() => setActiveTab('users')}
            style={{
              padding: '1rem 1.5rem',
              background: activeTab === 'users' ? 'rgba(154, 242, 58, 0.1)' : 'transparent',
              border: 'none',
              color: activeTab === 'users' ? '#9AF23A' : 'white',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              borderBottom: activeTab === 'users' ? '2px solid #9AF23A' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            User Management
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
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
              System Overview
            </h2>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '2rem'
            }}>
              <div>
                <h3 style={{ color: '#9AF23A', marginBottom: '1rem' }}>Recent Activity</h3>
                <div style={{ color: '#9CA3AF', fontSize: '0.875rem' }}>
                  <p>• {meetingRequests.filter(req => req.status === 'pending').length} pending meeting requests</p>
                  <p>• {users.length} total registered users</p>
                  <p>• System running normally</p>
                </div>
              </div>
              
              <div>
                <h3 style={{ color: '#9AF23A', marginBottom: '1rem' }}>Quick Actions</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <button
                    onClick={() => setActiveTab('meetings')}
                    style={{
                      padding: '0.75rem 1rem',
                      background: 'rgba(154, 242, 58, 0.1)',
                      border: '1px solid rgba(154, 242, 58, 0.2)',
                      borderRadius: '0.5rem',
                      color: '#9AF23A',
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    Review Meeting Requests
                  </button>
                  <button
                    onClick={() => setActiveTab('users')}
                    style={{
                      padding: '0.75rem 1rem',
                      background: 'rgba(45, 91, 255, 0.1)',
                      border: '1px solid rgba(45, 91, 255, 0.2)',
                      borderRadius: '0.5rem',
                      color: '#2D5BFF',
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    Manage Users
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'meetings' && (
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
              Meeting Requests
            </h2>

            {meetingRequests.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#9CA3AF' }}>
                <p>No meeting requests found.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {meetingRequests.map((request) => (
                  <div
                    key={request.id}
                    style={{
                      padding: '1.5rem',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '0.75rem'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '1rem'
                    }}>
                      <div>
                        <h3 style={{ color: 'white', marginBottom: '0.5rem' }}>{request.name}</h3>
                        <p style={{ color: '#9CA3AF', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                          {request.email} • {request.company}
                        </p>
                        <p style={{ color: '#9CA3AF', fontSize: '0.75rem' }}>
                          {new Date(request.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div style={{
                        padding: '0.25rem 0.75rem',
                        background: request.status === 'pending' ? 'rgba(255, 122, 41, 0.1)' : 
                                   request.status === 'approved' ? 'rgba(154, 242, 58, 0.1)' : 'rgba(255, 122, 41, 0.1)',
                        border: `1px solid ${request.status === 'pending' ? 'rgba(255, 122, 41, 0.3)' : 
                                        request.status === 'approved' ? 'rgba(154, 242, 58, 0.3)' : 'rgba(255, 122, 41, 0.3)'}`,
                        borderRadius: '0.5rem',
                        color: request.status === 'pending' ? '#FF7A29' : 
                               request.status === 'approved' ? '#9AF23A' : '#FF7A29',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        textTransform: 'uppercase'
                      }}>
                        {request.status}
                      </div>
                    </div>
                    
                    <p style={{ color: 'white', marginBottom: '1rem' }}>{request.message}</p>
                    
                    {request.status === 'pending' && (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => handleMeetingStatusChange(request.id, 'approved')}
                          style={{
                            padding: '0.5rem 1rem',
                            background: 'rgba(154, 242, 58, 0.1)',
                            border: '1px solid rgba(154, 242, 58, 0.3)',
                            borderRadius: '0.5rem',
                            color: '#9AF23A',
                            fontSize: '0.875rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(154, 242, 58, 0.2)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(154, 242, 58, 0.1)'
                          }}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleMeetingStatusChange(request.id, 'rejected')}
                          style={{
                            padding: '0.5rem 1rem',
                            background: 'rgba(255, 122, 41, 0.1)',
                            border: '1px solid rgba(255, 122, 41, 0.3)',
                            borderRadius: '0.5rem',
                            color: '#FF7A29',
                            fontSize: '0.875rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 122, 41, 0.2)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 122, 41, 0.1)'
                          }}
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'users' && (
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
              User Management
            </h2>

            {users.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#9CA3AF' }}>
                <p>No users found.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {users.map((user) => (
                  <div
                    key={user.id}
                    style={{
                      padding: '1.5rem',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '0.75rem'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <h3 style={{ color: 'white', marginBottom: '0.5rem' }}>
                          {user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.email}
                        </h3>
                        <p style={{ color: '#9CA3AF', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                          {user.email}
                        </p>
                        <p style={{ color: '#9CA3AF', fontSize: '0.75rem' }}>
                          {user.company && `${user.company} • `}{user.role} • Joined {new Date(user.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div style={{
                        padding: '0.25rem 0.75rem',
                        background: user.is_admin ? 'rgba(154, 242, 58, 0.1)' : 'rgba(45, 91, 255, 0.1)',
                        border: `1px solid ${user.is_admin ? 'rgba(154, 242, 58, 0.3)' : 'rgba(45, 91, 255, 0.3)'}`,
                        borderRadius: '0.5rem',
                        color: user.is_admin ? '#9AF23A' : '#2D5BFF',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        textTransform: 'uppercase'
                      }}>
                        {user.is_admin ? 'Admin' : 'User'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
