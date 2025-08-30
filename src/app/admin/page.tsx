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
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')

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
    }
  }, [user])

  const loadUsers = async () => {
    setIsLoadingUsers(true)
    try {
      const response = await fetch('/api/admin/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users)
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

  const sendAdminInvitation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail.trim()) return

    setIsInviting(true)
    try {
      const response = await fetch('/api/admin/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail.trim() })
      })

      if (response.ok) {
        setMessage('Admin invitation sent successfully!')
        setMessageType('success')
        setInviteEmail('')
        loadInvitations() // Refresh invitations list
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

  const toggleUserRole = async (userId: string, currentRole: boolean) => {
    try {
      const response = await fetch('/api/admin/users/toggle-role', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, isAdmin: !currentRole })
      })

      if (response.ok) {
        setMessage('User role updated successfully!')
        setMessageType('success')
        loadUsers() // Refresh users list
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

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const response = await fetch('/api/admin/users/toggle-status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, isActive: !currentStatus })
      })

      if (response.ok) {
        setMessage('User status updated successfully!')
        setMessageType('success')
        loadUsers() // Refresh users list
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

  const deleteInvitation = async (invitationId: string) => {
    try {
      const response = await fetch(`/api/admin/invitations/${invitationId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setMessage('Invitation deleted successfully!')
        setMessageType('success')
        loadInvitations() // Refresh invitations list
      } else {
        const data = await response.json()
        setMessage(data.message || 'Failed to delete invitation')
        setMessageType('error')
      }
    } catch (error) {
      setMessage('Error deleting invitation')
      setMessageType('error')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-purple-200 text-lg">Loading Admin Dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/50">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-slate-300 text-lg">You don't have permission to access this page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header with gradient background */}
      <div className="bg-gradient-to-r from-slate-800/50 to-purple-800/50 backdrop-blur-sm border-b border-slate-700/50 sticky top-0 z-10">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
              <p className="text-slate-300 mt-2 text-lg">Manage users, invitations, and system settings</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-slate-800/50 rounded-full px-4 py-2 border border-slate-600/50">
                <span className="text-slate-300 text-sm">Welcome, </span>
                <span className="text-white font-semibold">{user.firstName}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Message Display */}
        {message && (
          <div className={`mb-8 p-4 rounded-xl border backdrop-blur-sm transition-all duration-300 ${
            messageType === 'success' 
              ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-200' 
              : 'bg-red-500/20 border-red-500/30 text-red-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {messageType === 'success' ? (
                  <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                )}
                <span className="font-medium">{message}</span>
              </div>
              <button 
                onClick={() => setMessage('')}
                className="text-slate-400 hover:text-white transition-colors duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* System Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-sm border border-blue-500/30 rounded-2xl p-6 hover:scale-105 transition-all duration-300 group">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-500/30 rounded-xl flex items-center justify-center group-hover:bg-blue-500/40 transition-colors duration-300">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <div className="text-right">
                  <p className="text-blue-300 text-sm font-medium">Total Users</p>
                  <p className="text-3xl font-bold text-white">{stats.totalUsers}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 backdrop-blur-sm border border-emerald-500/30 rounded-2xl p-6 hover:scale-105 transition-all duration-300 group">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-emerald-500/30 rounded-xl flex items-center justify-center group-hover:bg-emerald-500/40 transition-colors duration-300">
                  <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-right">
                  <p className="text-emerald-300 text-sm font-medium">Verified Users</p>
                  <p className="text-3xl font-bold text-white">{stats.verifiedUsers}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-sm border border-purple-500/30 rounded-2xl p-6 hover:scale-105 transition-all duration-300 group">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-500/30 rounded-xl flex items-center justify-center group-hover:bg-purple-500/40 transition-colors duration-300">
                  <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-right">
                  <p className="text-purple-300 text-sm font-medium">Admin Users</p>
                  <p className="text-3xl font-bold text-white">{stats.adminUsers}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/20 backdrop-blur-sm border border-amber-500/30 rounded-2xl p-6 hover:scale-105 transition-all duration-300 group">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-amber-500/30 rounded-xl flex items-center justify-center group-hover:bg-amber-500/40 transition-colors duration-300">
                  <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="text-right">
                  <p className="text-amber-300 text-sm font-medium">Active Users</p>
                  <p className="text-3xl font-bold text-white">{stats.activeUsers}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-500/20 to-indigo-600/20 backdrop-blur-sm border border-indigo-500/30 rounded-2xl p-6 hover:scale-105 transition-all duration-300 group">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-indigo-500/30 rounded-xl flex items-center justify-center group-hover:bg-indigo-500/40 transition-colors duration-300">
                  <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="text-right">
                  <p className="text-indigo-300 text-sm font-medium">Active Sessions</p>
                  <p className="text-3xl font-bold text-white">{stats.totalSessions}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Admin Invitation Form */}
        <div className="bg-gradient-to-br from-slate-800/50 to-purple-800/20 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 mb-8 hover:border-purple-500/30 transition-all duration-300 group">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500/40 to-purple-600/40 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/20 border border-purple-400/30 group-hover:from-purple-500/50 group-hover:to-purple-600/50 group-hover:shadow-purple-500/30 group-hover:scale-110 transition-all duration-300">
              <svg className="w-6 h-6 text-purple-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '24px', height: '24px' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white">Invite New Admin</h2>
          </div>
          <form onSubmit={sendAdminInvitation} className="flex gap-4">
            <div className="flex-1 relative">
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="Enter email address"
                className="w-full px-6 py-4 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300"
                required
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              </div>
            </div>
            <button
              type="submit"
              disabled={isInviting}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-purple-500/25"
            >
              {isInviting ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Sending...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  <span>Send Invitation</span>
                </div>
              )}
            </button>
          </form>
        </div>

        {/* Admin Invitations */}
        <div className="bg-gradient-to-br from-slate-800/50 to-amber-800/20 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 mb-8 hover:border-amber-500/30 transition-all duration-300 group">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500/40 to-amber-600/40 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20 border border-amber-400/30 group-hover:from-amber-500/50 group-hover:to-amber-600/50 group-hover:shadow-amber-500/30 group-hover:scale-110 transition-all duration-300">
              <svg className="w-6 h-6 text-amber-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '24px', height: '24px' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white">Pending Admin Invitations</h2>
          </div>
          {isLoadingInvitations ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-500 border-t-transparent mx-auto mb-4"></div>
              <p className="text-slate-300">Loading invitations...</p>
            </div>
          ) : invitations.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <p className="text-slate-400 text-lg">No pending invitations</p>
              <p className="text-slate-500">All admin invitations have been processed</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700/50">
                    <th className="pb-4 text-slate-300 font-semibold text-left">Email</th>
                    <th className="pb-4 text-slate-300 font-semibold text-left">Invited By</th>
                    <th className="pb-4 text-slate-300 font-semibold text-left">Status</th>
                    <th className="pb-4 text-slate-300 font-semibold text-left">Expires</th>
                    <th className="pb-4 text-slate-300 font-semibold text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invitations.map((invitation) => (
                    <tr key={invitation.id} className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors duration-200">
                      <td className="py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-slate-600/50 to-slate-700/50 rounded-full flex items-center justify-center shadow-sm border border-slate-500/30">
                            <svg className="w-4 h-4 text-slate-200 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '16px', height: '16px' }}>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <span className="text-white font-medium">{invitation.email}</span>
                        </div>
                      </td>
                      <td className="py-4 text-slate-300">{invitation.invited_by}</td>
                      <td className="py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          invitation.status === 'pending' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                          invitation.status === 'accepted' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                          'bg-red-500/20 text-red-300 border border-red-500/30'
                        }`}>
                          {invitation.status}
                        </span>
                      </td>
                      <td className="py-4 text-slate-300">
                        {new Date(invitation.expires_at).toLocaleDateString()}
                      </td>
                      <td className="py-4">
                        <button
                          onClick={() => deleteInvitation(invitation.id)}
                          className="text-red-400 hover:text-red-300 transition-colors duration-200 p-2 hover:bg-red-500/10 rounded-lg"
                          title="Delete invitation"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Users Management */}
        <div className="bg-gradient-to-br from-slate-800/50 to-blue-800/20 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 hover:border-blue-500/30 transition-all duration-300 group">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500/40 to-blue-600/40 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 border border-blue-400/30 group-hover:from-blue-500/50 group-hover:to-blue-600/50 group-hover:shadow-blue-500/30 group-hover:scale-110 transition-all duration-300">
              <svg className="w-6 h-6 text-blue-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '24px', height: '24px' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white">User Management</h2>
          </div>
          {isLoadingUsers ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
              <p className="text-slate-300">Loading users...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700/50">
                    <th className="pb-4 text-slate-300 font-semibold text-left">User</th>
                    <th className="pb-4 text-slate-300 font-semibold text-left">Company</th>
                    <th className="pb-4 text-slate-300 font-semibold text-left">Status</th>
                    <th className="pb-4 text-slate-300 font-semibold text-left">Role</th>
                    <th className="pb-4 text-slate-300 font-semibold text-left">Last Login</th>
                    <th className="pb-4 text-slate-300 font-semibold text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors duration-200">
                      <td className="py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500/30 to-purple-500/30 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">
                              {user.first_name.charAt(0)}{user.last_name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="text-white font-medium">{user.first_name} {user.last_name}</p>
                            <p className="text-slate-400 text-sm">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        <div className="text-slate-300">
                          {user.company_name || 'N/A'}
                          {user.company_size && (
                            <span className="text-slate-500 text-sm ml-2">({user.company_size})</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4">
                        <div className="flex flex-wrap gap-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            user.is_active ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'
                          }`}>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </span>
                          {!user.email_verified_at && (
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              Unverified
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          user.is_admin ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-slate-600/20 text-slate-300 border border-slate-600/30'
                        }`}>
                          {user.is_admin ? 'Admin' : 'User'}
                        </span>
                      </td>
                      <td className="py-4 text-slate-300">
                        {user.last_login_at 
                          ? new Date(user.last_login_at).toLocaleDateString()
                          : 'Never'
                        }
                      </td>
                      <td className="py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => toggleUserRole(user.id, user.is_admin)}
                            className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 transform hover:scale-105 ${
                              user.is_admin 
                                ? 'bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30' 
                                : 'bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30'
                            }`}
                          >
                            {user.is_admin ? 'Remove Admin' : 'Make Admin'}
                          </button>
                          <button
                            onClick={() => toggleUserStatus(user.id, user.is_active)}
                            className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 transform hover:scale-105 ${
                              user.is_active 
                                ? 'bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30' 
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30'
                            }`}
                          >
                            {user.is_active ? 'Deactivate' : 'Activate'}
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
    </div>
  )
}
