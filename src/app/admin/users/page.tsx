'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

interface UserSettings {
  newsletter_subscription: boolean
  research_alerts: boolean
  [key: string]: any
}

interface User {
  id: string
  email: string
  first_name?: string
  last_name?: string
  company_name?: string
  company_size?: string
  phone?: string
  email_verified_at?: string
  created_at: string
  updated_at: string
  last_login_at?: string
  is_active: boolean
  is_admin: boolean
  two_factor_enabled: boolean
  session_timeout_minutes: number
  settings?: UserSettings
  session_count?: number
}

export default function AdminUsersPage() {
  const { user: currentUser, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [sortBy, setSortBy] = useState<'created_at' | 'last_login' | 'email' | 'name'>('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [message, setMessage] = useState('')

  // Redirect if not admin
  useEffect(() => {
    if (!authLoading && (!currentUser || !currentUser.isAdmin)) {
      router.push('/admin')
    }
  }, [currentUser, authLoading, router])

  // Load users data
  useEffect(() => {
    if (currentUser?.isAdmin) {
      loadUsers()
    }
  }, [currentUser])

  const loadUsers = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
        if (data.message) {
          setMessage(data.message)
        } else {
          setMessage('') // Clear any previous messages
        }
      } else {
        console.error('Failed to load users:', response.status)
        setUsers([])
        setMessage('Failed to load users data')
      }
    } catch (error) {
      console.error('Failed to load users:', error)
      setUsers([])
      setMessage('Error loading users data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUserAction = async (userId: string, action: string, value?: any) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, action, value }),
      })

      if (response.ok) {
        setMessage('User updated successfully')
        loadUsers() // Reload users
        setTimeout(() => setMessage(''), 3000)
      } else {
        const errorData = await response.json()
        setMessage(`Failed to update user: ${errorData.message}`)
      }
    } catch (error) {
      console.error('Failed to update user:', error)
      setMessage('Failed to update user')
    }
  }

  const filteredAndSortedUsers = users
    .filter(user => {
      const matchesSearch = 
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = 
        filterStatus === 'all' || 
        (filterStatus === 'active' && user.is_active) ||
        (filterStatus === 'inactive' && !user.is_active)
      
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      let aValue: any, bValue: any
      
      switch (sortBy) {
        case 'created_at':
          aValue = new Date(a.created_at).getTime()
          bValue = new Date(b.created_at).getTime()
          break
        case 'last_login':
          aValue = a.last_login_at ? new Date(a.last_login_at).getTime() : 0
          bValue = b.last_login_at ? new Date(b.last_login_at).getTime() : 0
          break
        case 'email':
          aValue = a.email.toLowerCase()
          bValue = b.email.toLowerCase()
          break
        case 'name':
          aValue = `${a.first_name || ''} ${a.last_name || ''}`.toLowerCase()
          bValue = `${b.first_name || ''} ${b.last_name || ''}`.toLowerCase()
          break
        default:
          return 0
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

  if (authLoading || isLoading) {
    return (
      <div className="admin-users-page loading">
        <div className="container">
          <div className="spinner"></div>
          <p>Loading users...</p>
        </div>
      </div>
    )
  }

  if (!currentUser?.isAdmin) {
    return null // Will redirect
  }

  return (
    <div className="admin-users-page">
      <div className="container">
        <div className="page-header">
          <button 
            className="back-btn"
            onClick={() => router.push('/admin')}
          >
            ← Back to Admin Dashboard
          </button>
          <h1>User Management</h1>
          <p>Manage all users, their settings, and account details.</p>
        </div>

        {message && (
          <div className={`message ${message.includes('successfully') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        <div className="users-controls">
          <div className="search-section">
            <input
              type="text"
              placeholder="Search users by name, email, or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          <div className="filter-controls">
            <div className="filter-group">
              <label>Status:</label>
              <select 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="filter-select"
              >
                <option value="all">All Users</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>
            
            <div className="filter-group">
              <label>Sort by:</label>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value as any)}
                className="filter-select"
              >
                <option value="created_at">Created Date</option>
                <option value="last_login">Last Login</option>
                <option value="email">Email</option>
                <option value="name">Name</option>
              </select>
            </div>
            
            <div className="filter-group">
              <label>Order:</label>
              <select 
                value={sortOrder} 
                onChange={(e) => setSortOrder(e.target.value as any)}
                className="filter-select"
              >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>
            </div>
          </div>
        </div>

        <div className="users-stats">
          <div className="stat-card">
            <h3>Total Users</h3>
            <span className="stat-number">{users.length}</span>
          </div>
          <div className="stat-card">
            <h3>Active Users</h3>
            <span className="stat-number">{users.filter(u => u.is_active).length}</span>
          </div>
          <div className="stat-card">
            <h3>Admins</h3>
            <span className="stat-number">{users.filter(u => u.is_admin).length}</span>
          </div>
          <div className="stat-card">
            <h3>Verified Users</h3>
            <span className="stat-number">{users.filter(u => u.email_verified_at).length}</span>
          </div>
        </div>

        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Company</th>
                <th>Status</th>
                <th>Created</th>
                <th>Last Login</th>
                <th>Settings</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedUsers.map((user) => (
                <tr key={user.id} className={!user.is_active ? 'inactive' : ''}>
                  <td>
                    <div className="user-info">
                      <div className="user-avatar">
                        {user.first_name?.[0] || user.email[0].toUpperCase()}
                      </div>
                      <div className="user-details">
                        <div className="user-name">
                          {user.first_name && user.last_name 
                            ? `${user.first_name} ${user.last_name}`
                            : 'No name provided'
                          }
                        </div>
                        <div className="user-email">{user.email}</div>
                        {user.is_admin && <span className="admin-badge">Admin</span>}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="company-info">
                      <div className="company-name">{user.company_name || 'No company'}</div>
                      {user.company_size && (
                        <div className="company-size">{user.company_size}</div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="status-info">
                      <span className={`status-badge ${user.is_active ? 'active' : 'inactive'}`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                      {user.email_verified_at ? (
                        <span className="verified-badge">Verified</span>
                      ) : (
                        <span className="unverified-badge">Unverified</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="date-info">
                      {new Date(user.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td>
                    <div className="date-info">
                      {user.last_login_at 
                        ? new Date(user.last_login_at).toLocaleDateString()
                        : 'Never'
                      }
                    </div>
                  </td>
                  <td>
                    <div className="settings-info">
                      {user.settings ? (
                        <div className="settings-summary">
                          {user.settings.newsletter_subscription && (
                            <span className="setting-tag">Newsletter</span>
                          )}
                          {user.settings.research_alerts && (
                            <span className="setting-tag">Alerts</span>
                          )}
                        </div>
                      ) : (
                        <span className="no-settings">No settings</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="user-actions">
                      <button
                        className="action-btn view-btn"
                        onClick={() => setSelectedUser(user)}
                        title="View Details"
                      >
                        View
                      </button>
                      <button
                        className={`action-btn ${user.is_active ? 'deactivate-btn' : 'activate-btn'}`}
                        onClick={() => handleUserAction(user.id, 'toggle_active')}
                        title={user.is_active ? 'Deactivate User' : 'Activate User'}
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

        {selectedUser && (
          <div className="user-modal-overlay" onClick={() => setSelectedUser(null)}>
            <div className="user-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>User Details</h2>
                <button 
                  className="close-btn"
                  onClick={() => setSelectedUser(null)}
                >
                  ×
                </button>
              </div>
              
              <div className="modal-content">
                <div className="user-detail-section">
                  <h3>Profile Information</h3>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <label>Name:</label>
                      <span>{selectedUser.first_name && selectedUser.last_name 
                        ? `${selectedUser.first_name} ${selectedUser.last_name}`
                        : 'Not provided'
                      }</span>
                    </div>
                    <div className="detail-item">
                      <label>Email:</label>
                      <span>{selectedUser.email}</span>
                    </div>
                    <div className="detail-item">
                      <label>Phone:</label>
                      <span>{selectedUser.phone || 'Not provided'}</span>
                    </div>
                    <div className="detail-item">
                      <label>Company:</label>
                      <span>{selectedUser.company_name || 'Not provided'}</span>
                    </div>
                    <div className="detail-item">
                      <label>Company Size:</label>
                      <span>{selectedUser.company_size || 'Not provided'}</span>
                    </div>
                  </div>
                </div>

                <div className="user-detail-section">
                  <h3>Account Status</h3>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <label>Status:</label>
                      <span className={`status-badge ${selectedUser.is_active ? 'active' : 'inactive'}`}>
                        {selectedUser.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="detail-item">
                      <label>Admin:</label>
                      <span className={selectedUser.is_admin ? 'admin-badge' : 'regular-badge'}>
                        {selectedUser.is_admin ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="detail-item">
                      <label>Email Verified:</label>
                      <span className={selectedUser.email_verified_at ? 'verified-badge' : 'unverified-badge'}>
                        {selectedUser.email_verified_at ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="detail-item">
                      <label>2FA Enabled:</label>
                      <span className={selectedUser.two_factor_enabled ? 'enabled-badge' : 'disabled-badge'}>
                        {selectedUser.two_factor_enabled ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="user-detail-section">
                  <h3>Timestamps</h3>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <label>Created:</label>
                      <span>{new Date(selectedUser.created_at).toLocaleString()}</span>
                    </div>
                    <div className="detail-item">
                      <label>Last Updated:</label>
                      <span>{new Date(selectedUser.updated_at).toLocaleString()}</span>
                    </div>
                    <div className="detail-item">
                      <label>Last Login:</label>
                      <span>{selectedUser.last_login_at 
                        ? new Date(selectedUser.last_login_at).toLocaleString()
                        : 'Never'
                      }</span>
                    </div>
                    <div className="detail-item">
                      <label>Session Timeout:</label>
                      <span>{selectedUser.session_timeout_minutes} minutes</span>
                    </div>
                  </div>
                </div>

                {selectedUser.settings && (
                  <div className="user-detail-section">
                    <h3>User Settings</h3>
                    <div className="settings-details">
                      <div className="setting-item">
                        <label>Newsletter Subscription:</label>
                        <span className={selectedUser.settings.newsletter_subscription ? 'enabled-badge' : 'disabled-badge'}>
                          {selectedUser.settings.newsletter_subscription ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                      <div className="setting-item">
                        <label>Research Alerts:</label>
                        <span className={selectedUser.settings.research_alerts ? 'enabled-badge' : 'disabled-badge'}>
                          {selectedUser.settings.research_alerts ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="modal-actions">
                  <button
                    className={`btn ${selectedUser.is_active ? 'btn-warning' : 'btn-success'}`}
                    onClick={() => {
                      handleUserAction(selectedUser.id, 'toggle_active')
                      setSelectedUser(null)
                    }}
                  >
                    {selectedUser.is_active ? 'Deactivate User' : 'Activate User'}
                  </button>
                  <button
                    className="btn btn-outline"
                    onClick={() => setSelectedUser(null)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
