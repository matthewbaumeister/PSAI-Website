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
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    )
  }

  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-gray-400">You don't have permission to access this page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-gray-400">Manage users, invitations, and system settings</p>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            messageType === 'success' 
              ? 'bg-green-900 border border-green-700 text-green-100' 
              : 'bg-red-900 border border-red-700 text-red-100'
          }`}>
            {message}
            <button 
              onClick={() => setMessage('')}
              className="float-right text-gray-400 hover:text-white"
            >
              ×
            </button>
          </div>
        )}

        {/* System Statistics */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="text-gray-400 text-sm">Total Users</h3>
              <p className="text-2xl font-bold text-white">{stats.totalUsers}</p>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="text-gray-400 text-sm">Verified Users</h3>
              <p className="text-2xl font-bold text-white">{stats.verifiedUsers}</p>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="text-gray-400 text-sm">Admin Users</h3>
              <p className="text-2xl font-bold text-white">{stats.adminUsers}</p>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="text-gray-400 text-sm">Active Users</h3>
              <p className="text-2xl font-bold text-white">{stats.activeUsers}</p>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="text-gray-400 text-sm">Active Sessions</h3>
              <p className="text-2xl font-bold text-white">{stats.totalSessions}</p>
            </div>
          </div>
        )}

        {/* Admin Invitation Form */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Invite New Admin</h2>
          <form onSubmit={sendAdminInvitation} className="flex gap-4">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="Enter email address"
              className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              required
            />
            <button
              type="submit"
              disabled={isInviting}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isInviting ? 'Sending...' : 'Send Invitation'}
            </button>
          </form>
        </div>

        {/* Admin Invitations */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Pending Admin Invitations</h2>
          {isLoadingInvitations ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
            </div>
          ) : invitations.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No pending invitations</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="pb-3 text-gray-400 font-medium">Email</th>
                    <th className="pb-3 text-gray-400 font-medium">Invited By</th>
                    <th className="pb-3 text-gray-400 font-medium">Status</th>
                    <th className="pb-3 text-gray-400 font-medium">Expires</th>
                    <th className="pb-3 text-gray-400 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invitations.map((invitation) => (
                    <tr key={invitation.id} className="border-b border-gray-700">
                      <td className="py-3 text-white">{invitation.email}</td>
                      <td className="py-3 text-gray-300">{invitation.invited_by}</td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          invitation.status === 'pending' ? 'bg-yellow-900 text-yellow-200' :
                          invitation.status === 'accepted' ? 'bg-green-900 text-green-200' :
                          'bg-red-900 text-red-200'
                        }`}>
                          {invitation.status}
                        </span>
                      </td>
                      <td className="py-3 text-gray-300">
                        {new Date(invitation.expires_at).toLocaleDateString()}
                      </td>
                      <td className="py-3">
                        <button
                          onClick={() => deleteInvitation(invitation.id)}
                          className="text-red-400 hover:text-red-300 text-sm"
                        >
                          Delete
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
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">User Management</h2>
          {isLoadingUsers ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="pb-3 text-gray-400 font-medium">User</th>
                    <th className="pb-3 text-gray-400 font-medium">Company</th>
                    <th className="pb-3 text-gray-400 font-medium">Status</th>
                    <th className="pb-3 text-gray-400 font-medium">Role</th>
                    <th className="pb-3 text-gray-400 font-medium">Last Login</th>
                    <th className="pb-3 text-gray-400 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-gray-700">
                      <td className="py-3">
                        <div>
                          <p className="text-white font-medium">{user.first_name} {user.last_name}</p>
                          <p className="text-gray-400 text-sm">{user.email}</p>
                        </div>
                      </td>
                      <td className="py-3 text-gray-300">
                        {user.company_name || 'N/A'}
                        {user.company_size && <span className="text-gray-500 text-sm ml-2">({user.company_size})</span>}
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          user.is_active ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'
                        }`}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                        {!user.email_verified_at && (
                          <span className="ml-2 px-2 py-1 rounded-full text-xs bg-yellow-900 text-yellow-200">
                            Unverified
                          </span>
                        )}
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          user.is_admin ? 'bg-purple-900 text-purple-200' : 'bg-gray-700 text-gray-300'
                        }`}>
                          {user.is_admin ? 'Admin' : 'User'}
                        </span>
                      </td>
                      <td className="py-3 text-gray-300">
                        {user.last_login_at 
                          ? new Date(user.last_login_at).toLocaleDateString()
                          : 'Never'
                        }
                      </td>
                      <td className="py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => toggleUserRole(user.id, user.is_admin)}
                            className={`px-3 py-1 rounded text-xs ${
                              user.is_admin 
                                ? 'bg-red-600 hover:bg-red-700 text-white' 
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                          >
                            {user.is_admin ? 'Remove Admin' : 'Make Admin'}
                          </button>
                          <button
                            onClick={() => toggleUserStatus(user.id, user.is_active)}
                            className={`px-3 py-1 rounded text-xs ${
                              user.is_active 
                                ? 'bg-red-600 hover:bg-red-700 text-white' 
                                : 'bg-green-600 hover:bg-green-700 text-white'
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
