'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  companyName: string
  isAdmin: boolean
  emailVerified: boolean
  createdAt: string
  lastLoginAt?: string
}

export default function UserManagementPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState<'all' | 'admin' | 'user'>('all')
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')

  // Check if user is authenticated and is admin
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login')
    } else if (user && !user.isAdmin) {
      router.push('/dashboard')
    } else if (user && user.isAdmin) {
      loadUsers()
    }
  }, [user, isLoading, router])

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/admin/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      } else {
        setMessage('Failed to load users')
        setMessageType('error')
      }
    } catch (error) {
      setMessage('Error loading users')
      setMessageType('error')
    } finally {
      setIsLoadingUsers(false)
    }
  }

  const toggleAdminStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const response = await fetch('/api/admin/users/toggle-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, isAdmin: !currentStatus })
      })

      if (response.ok) {
        setMessage(`User admin status ${!currentStatus ? 'enabled' : 'disabled'} successfully`)
        setMessageType('success')
        loadUsers() // Refresh the list
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

  const deleteUser = async (userId: string, userEmail: string) => {
    if (!confirm(`Are you sure you want to delete user ${userEmail}? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch('/api/admin/users/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId })
      })

      if (response.ok) {
        setMessage('User deleted successfully')
        setMessageType('success')
        loadUsers() // Refresh the list
      } else {
        const data = await response.json()
        setMessage(data.message || 'Failed to delete user')
        setMessageType('error')
      }
    } catch (error) {
      setMessage('Error deleting user')
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
          <p style={{ color: '#c4b5fd', fontSize: '18px' }}>Loading User Management...</p>
        </div>
      </div>
    )
  }

  if (!user || !user.isAdmin) {
    return null // Will redirect
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.companyName?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesRole = filterRole === 'all' || 
                       (filterRole === 'admin' && user.isAdmin) ||
                       (filterRole === 'user' && !user.isAdmin)
    
    return matchesSearch && matchesRole
  })

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
                User Management
              </h1>
              <p style={{
                color: '#cbd5e1',
                marginTop: '8px',
                fontSize: '18px'
              }}>
                Manage user accounts, permissions, and system access.
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div>
                <p style={{
                  color: '#94a3b8',
                  fontSize: '14px',
                  margin: '0 0 4px 0'
                }}>
                  Total Users
                </p>
                <p style={{
                  color: '#ffffff',
                  fontSize: '32px',
                  fontWeight: '700',
                  margin: 0
                }}>
                  {users.length}
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p style={{
                  color: '#94a3b8',
                  fontSize: '14px',
                  margin: '0 0 4px 0'
                }}>
                  Active Users
                </p>
                <p style={{
                  color: '#ffffff',
                  fontSize: '32px',
                  fontWeight: '700',
                  margin: 0
                }}>
                  {users.filter(u => u.emailVerified).length}
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p style={{
                  color: '#94a3b8',
                  fontSize: '14px',
                  margin: '0 0 4px 0'
                }}>
                  Admin Users
                </p>
                <p style={{
                  color: '#ffffff',
                  fontSize: '32px',
                  fontWeight: '700',
                  margin: 0
                }}>
                  {users.filter(u => u.isAdmin).length}
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              </div>
              <div>
                <p style={{
                  color: '#94a3b8',
                  fontSize: '14px',
                  margin: '0 0 4px 0'
                }}>
                  Pending Verification
                </p>
                <p style={{
                  color: '#ffffff',
                  fontSize: '32px',
                  fontWeight: '700',
                  margin: 0
                }}>
                  {users.filter(u => !u.emailVerified).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div style={{
          background: 'rgba(30, 41, 59, 0.6)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(148, 163, 184, 0.2)',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '32px'
        }}>
          <div style={{
            display: 'flex',
            gap: '24px',
            alignItems: 'center',
            flexWrap: 'wrap'
          }}>
            <div style={{ flex: 1, minWidth: '300px' }}>
              <label style={{
                display: 'block',
                color: '#cbd5e1',
                fontWeight: '500',
                marginBottom: '8px',
                fontSize: '14px'
              }}>
                Search Users
              </label>
              <input
                type="text"
                placeholder="Search by email, name, or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
                Filter by Role
              </label>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value as 'all' | 'admin' | 'user')}
                style={{
                  padding: '12px 16px',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(148, 163, 184, 0.3)',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '14px',
                  minWidth: '150px'
                }}
              >
                <option value="all">All Users</option>
                <option value="admin">Admins Only</option>
                <option value="user">Regular Users</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div style={{
          background: 'rgba(30, 41, 59, 0.6)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(148, 163, 184, 0.2)',
          borderRadius: '16px',
          padding: '24px',
          overflow: 'hidden'
        }}>
          <h3 style={{
            fontSize: '20px',
            fontWeight: '600',
            color: '#ffffff',
            margin: '0 0 24px 0'
          }}>
            User List ({filteredUsers.length} users)
          </h3>
          
          {isLoadingUsers ? (
            <div style={{
              textAlign: 'center',
              padding: '48px',
              color: '#94a3b8'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                border: '3px solid #8b5cf6',
                borderTop: '3px solid transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 16px'
              }}></div>
              Loading users...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '48px',
              color: '#94a3b8'
            }}>
              No users found matching your criteria.
            </div>
          ) : (
            <div style={{
              overflowX: 'auto'
            }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse'
              }}>
                <thead>
                  <tr style={{
                    borderBottom: '1px solid rgba(148, 163, 184, 0.2)'
                  }}>
                    <th style={{
                      textAlign: 'left',
                      padding: '16px',
                      color: '#cbd5e1',
                      fontWeight: '500',
                      fontSize: '14px'
                    }}>
                      User
                    </th>
                    <th style={{
                      textAlign: 'left',
                      padding: '16px',
                      color: '#cbd5e1',
                      fontWeight: '500',
                      fontSize: '14px'
                    }}>
                      Company
                    </th>
                    <th style={{
                      textAlign: 'left',
                      padding: '16px',
                      color: '#cbd5e1',
                      fontWeight: '500',
                      fontSize: '14px'
                    }}>
                      Status
                    </th>
                    <th style={{
                      textAlign: 'left',
                      padding: '16px',
                      color: '#cbd5e1',
                      fontWeight: '500',
                      fontSize: '14px'
                    }}>
                      Joined
                    </th>
                    <th style={{
                      textAlign: 'left',
                      padding: '16px',
                      color: '#cbd5e1',
                      fontWeight: '500',
                      fontSize: '14px'
                    }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((userItem) => (
                    <tr key={userItem.id} style={{
                      borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(148, 163, 184, 0.05)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }}>
                      <td style={{ padding: '16px' }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px'
                        }}>
                          <div style={{
                            width: '40px',
                            height: '40px',
                            background: userItem.isAdmin ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#ffffff',
                            fontWeight: '600',
                            fontSize: '16px'
                          }}>
                            {userItem.firstName?.charAt(0) || userItem.email.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p style={{
                              color: '#ffffff',
                              fontWeight: '500',
                              margin: '0 0 4px 0'
                            }}>
                              {userItem.firstName} {userItem.lastName}
                            </p>
                            <p style={{
                              color: '#94a3b8',
                              fontSize: '14px',
                              margin: 0
                            }}>
                              {userItem.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span style={{
                          color: '#cbd5e1',
                          fontSize: '14px'
                        }}>
                          {userItem.companyName || 'N/A'}
                        </span>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{
                          display: 'flex',
                          gap: '8px',
                          flexWrap: 'wrap'
                        }}>
                          {userItem.isAdmin && (
                            <span style={{
                              background: 'rgba(245, 158, 11, 0.2)',
                              color: '#fcd34d',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: '500'
                            }}>
                              Admin
                            </span>
                          )}
                          {userItem.emailVerified ? (
                            <span style={{
                              background: 'rgba(34, 197, 94, 0.2)',
                              color: '#86efac',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: '500'
                            }}>
                              Verified
                            </span>
                          ) : (
                            <span style={{
                              background: 'rgba(239, 68, 68, 0.2)',
                              color: '#fca5a5',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: '500'
                            }}>
                              Pending
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span style={{
                          color: '#94a3b8',
                          fontSize: '14px'
                        }}>
                          {new Date(userItem.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{
                          display: 'flex',
                          gap: '8px'
                        }}>
                          <button
                            onClick={() => toggleAdminStatus(userItem.id, userItem.isAdmin)}
                            style={{
                              padding: '6px 12px',
                              background: userItem.isAdmin ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                              border: '1px solid rgba(148, 163, 184, 0.3)',
                              borderRadius: '6px',
                              color: userItem.isAdmin ? '#fca5a5' : '#86efac',
                              fontSize: '12px',
                              fontWeight: '500',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'scale(1.05)'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'scale(1)'
                            }}
                          >
                            {userItem.isAdmin ? 'Remove Admin' : 'Make Admin'}
                          </button>
                          <button
                            onClick={() => deleteUser(userItem.id, userItem.email)}
                            style={{
                              padding: '6px 12px',
                              background: 'rgba(239, 68, 68, 0.2)',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              borderRadius: '6px',
                              color: '#fca5a5',
                              fontSize: '12px',
                              fontWeight: '500',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'scale(1.05)'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'scale(1)'
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
