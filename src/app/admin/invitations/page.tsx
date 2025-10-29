'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Invitation {
  id: string
  email: string
  invitedBy: string
  status: 'pending' | 'accepted' | 'expired'
  createdAt: string
  expiresAt: string
}

export default function AdminInvitationsPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [isLoadingInvitations, setIsLoadingInvitations] = useState(true)
  const [newInvitationEmail, setNewInvitationEmail] = useState('')
  const [isSendingInvitation, setIsSendingInvitation] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')

  // Check if user is authenticated and is admin
  useEffect(() => {
    if (!isLoading && !user) {
      const returnUrl = encodeURIComponent('/admin/invitations')
      router.push(`/auth/login?returnUrl=${returnUrl}`)
    } else if (user && !user.isAdmin) {
      router.push('/dashboard')
    } else if (user && user.isAdmin) {
      loadInvitations()
    }
  }, [user, isLoading, router])

  const loadInvitations = async () => {
    try {
      const response = await fetch('/api/admin/invitations')
      if (response.ok) {
        const data = await response.json()
        setInvitations(data.invitations || [])
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

  const sendInvitation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newInvitationEmail.trim()) return

    setIsSendingInvitation(true)
    try {
      const response = await fetch('/api/admin/invitations/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: newInvitationEmail.trim() })
      })

      if (response.ok) {
        setMessage('Admin invitation sent successfully!')
        setMessageType('success')
        setNewInvitationEmail('')
        loadInvitations() // Refresh the list
      } else {
        const data = await response.json()
        setMessage(data.message || 'Failed to send invitation')
        setMessageType('error')
      }
    } catch (error) {
      setMessage('Error sending invitation')
      setMessageType('error')
    } finally {
      setIsSendingInvitation(false)
    }
  }

  const resendInvitation = async (invitationId: string) => {
    try {
      const response = await fetch('/api/admin/invitations/resend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ invitationId })
      })

      if (response.ok) {
        setMessage('Invitation resent successfully!')
        setMessageType('success')
        loadInvitations() // Refresh the list
      } else {
        const data = await response.json()
        setMessage(data.message || 'Failed to resend invitation')
        setMessageType('error')
      }
    } catch (error) {
      setMessage('Error resending invitation')
      setMessageType('error')
    }
  }

  const cancelInvitation = async (invitationId: string) => {
    if (!confirm('Are you sure you want to cancel this invitation?')) {
      return
    }

    try {
      const response = await fetch('/api/admin/invitations/cancel', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ invitationId })
      })

      if (response.ok) {
        setMessage('Invitation cancelled successfully')
        setMessageType('success')
        loadInvitations() // Refresh the list
      } else {
        const data = await response.json()
        setMessage(data.message || 'Failed to cancel invitation')
        setMessageType('error')
      }
    } catch (error) {
      setMessage('Error cancelling invitation')
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
          <p style={{ color: '#c4b5fd', fontSize: '18px' }}>Loading Admin Invitations...</p>
        </div>
      </div>
    )
  }

  if (!user || !user.isAdmin) {
    return null // Will redirect
  }

  const pendingInvitations = invitations.filter(inv => inv.status === 'pending')
  const acceptedInvitations = invitations.filter(inv => inv.status === 'accepted')
  const expiredInvitations = invitations.filter(inv => inv.status === 'expired')

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
                Admin Invitations
              </h1>
              <p style={{
                color: '#cbd5e1',
                marginTop: '8px',
                fontSize: '18px'
              }}>
                Send and manage admin invitations for new team members.
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p style={{
                  color: '#94a3b8',
                  fontSize: '14px',
                  margin: '0 0 4px 0'
                }}>
                  Total Invitations
                </p>
                <p style={{
                  color: '#ffffff',
                  fontSize: '32px',
                  fontWeight: '700',
                  margin: 0
                }}>
                  {invitations.length}
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p style={{
                  color: '#94a3b8',
                  fontSize: '14px',
                  margin: '0 0 4px 0'
                }}>
                  Pending
                </p>
                <p style={{
                  color: '#ffffff',
                  fontSize: '32px',
                  fontWeight: '700',
                  margin: 0
                }}>
                  {pendingInvitations.length}
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
                  Accepted
                </p>
                <p style={{
                  color: '#ffffff',
                  fontSize: '32px',
                  fontWeight: '700',
                  margin: 0
                }}>
                  {acceptedInvitations.length}
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div>
                <p style={{
                  color: '#94a3b8',
                  fontSize: '14px',
                  margin: '0 0 4px 0'
                }}>
                  Expired
                </p>
                <p style={{
                  color: '#ffffff',
                  fontSize: '32px',
                  fontWeight: '700',
                  margin: 0
                }}>
                  {expiredInvitations.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Send New Invitation */}
        <div style={{
          background: 'rgba(30, 41, 59, 0.6)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(148, 163, 184, 0.2)',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '32px'
        }}>
          <h3 style={{
            fontSize: '20px',
            fontWeight: '600',
            color: '#ffffff',
            margin: '0 0 20px 0'
          }}>
            Send New Admin Invitation
          </h3>
          <form onSubmit={sendInvitation} style={{
            display: 'flex',
            gap: '16px',
            alignItems: 'flex-end',
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
                Email Address
              </label>
              <input
                type="email"
                placeholder="Enter email address to invite..."
                value={newInvitationEmail}
                onChange={(e) => setNewInvitationEmail(e.target.value)}
                required
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
            <button
              type="submit"
              disabled={isSendingInvitation || !newInvitationEmail.trim()}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                border: 'none',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: '600',
                cursor: isSendingInvitation || !newInvitationEmail.trim() ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                opacity: isSendingInvitation || !newInvitationEmail.trim() ? 0.6 : 1
              }}
              onMouseEnter={(e) => {
                if (!isSendingInvitation && newInvitationEmail.trim()) {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(139, 92, 246, 0.3)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isSendingInvitation && newInvitationEmail.trim()) {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }
              }}
            >
              {isSendingInvitation ? 'Sending...' : 'Send Invitation'}
            </button>
          </form>
        </div>

        {/* Invitations List */}
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
            Invitation History ({invitations.length} invitations)
          </h3>
          
          {isLoadingInvitations ? (
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
              Loading invitations...
            </div>
          ) : invitations.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '48px',
              color: '#94a3b8'
            }}>
              No invitations found. Send your first admin invitation above.
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
                      Email
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
                      Invited By
                    </th>
                    <th style={{
                      textAlign: 'left',
                      padding: '16px',
                      color: '#cbd5e1',
                      fontWeight: '500',
                      fontSize: '14px'
                    }}>
                      Sent
                    </th>
                    <th style={{
                      textAlign: 'left',
                      padding: '16px',
                      color: '#cbd5e1',
                      fontWeight: '500',
                      fontSize: '14px'
                    }}>
                      Expires
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
                  {invitations.map((invitation) => (
                    <tr key={invitation.id} style={{
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
                        <span style={{
                          color: '#ffffff',
                          fontWeight: '500',
                          fontSize: '14px'
                        }}>
                          {invitation.email}
                        </span>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span style={{
                          background: invitation.status === 'pending' ? 'rgba(245, 158, 11, 0.2)' : 
                                     invitation.status === 'accepted' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                          color: invitation.status === 'pending' ? '#fcd34d' : 
                                 invitation.status === 'accepted' ? '#86efac' : '#fca5a5',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '500',
                          textTransform: 'capitalize'
                        }}>
                          {invitation.status}
                        </span>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span style={{
                          color: '#94a3b8',
                          fontSize: '14px'
                        }}>
                          {invitation.invitedBy}
                        </span>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span style={{
                          color: '#94a3b8',
                          fontSize: '14px'
                        }}>
                          {new Date(invitation.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span style={{
                          color: '#94a3b8',
                          fontSize: '14px'
                        }}>
                          {new Date(invitation.expiresAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{
                          display: 'flex',
                          gap: '8px'
                        }}>
                          {invitation.status === 'pending' && (
                            <>
                              <button
                                onClick={() => resendInvitation(invitation.id)}
                                style={{
                                  padding: '6px 12px',
                                  background: 'rgba(59, 130, 246, 0.2)',
                                  border: '1px solid rgba(59, 130, 246, 0.3)',
                                  borderRadius: '6px',
                                  color: '#93c5fd',
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
                                Resend
                              </button>
                              <button
                                onClick={() => cancelInvitation(invitation.id)}
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
                                Cancel
                              </button>
                            </>
                          )}
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
