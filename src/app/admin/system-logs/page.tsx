'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface SystemLog {
  id: string
  level: 'info' | 'warning' | 'error' | 'critical'
  category: string
  message: string
  timestamp: string
  userId?: string
  userEmail?: string
  ipAddress?: string
  userAgent?: string
  metadata?: any
}

export default function SystemLogsPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [logs, setLogs] = useState<SystemLog[]>([])
  const [isLoadingLogs, setIsLoadingLogs] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterLevel, setFilterLevel] = useState<'all' | 'info' | 'warning' | 'error' | 'critical'>('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [dateRange, setDateRange] = useState('24h')
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')

  // Check if user is authenticated and is admin
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login')
    } else if (user && !user.isAdmin) {
      router.push('/dashboard')
    } else if (user && user.isAdmin) {
      loadLogs()
    }
  }, [user, isLoading, router])

  const loadLogs = async () => {
    try {
      const response = await fetch('/api/admin/logs')
      if (response.ok) {
        const data = await response.json()
        setLogs(data.logs || [])
      } else {
        setMessage('Failed to load system logs')
        setMessageType('error')
      }
    } catch (error) {
      setMessage('Error loading system logs')
      setMessageType('error')
    } finally {
      setIsLoadingLogs(false)
    }
  }

  const clearLogs = async () => {
    if (!confirm('Are you sure you want to clear all logs? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch('/api/admin/logs/clear', {
        method: 'DELETE'
      })

      if (response.ok) {
        setMessage('System logs cleared successfully')
        setMessageType('success')
        loadLogs() // Refresh the list
      } else {
        const data = await response.json()
        setMessage(data.message || 'Failed to clear logs')
        setMessageType('error')
      }
    } catch (error) {
      setMessage('Error clearing system logs')
      setMessageType('error')
    }
  }

  const exportLogs = async () => {
    try {
      const response = await fetch('/api/admin/logs/export')
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `system-logs-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        setMessage('Logs exported successfully')
        setMessageType('success')
      } else {
        setMessage('Failed to export logs')
        setMessageType('error')
      }
    } catch (error) {
      setMessage('Error exporting logs')
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
          <p style={{ color: '#c4b5fd', fontSize: '18px' }}>Loading System Logs...</p>
        </div>
      </div>
    )
  }

  if (!user || !user.isAdmin) {
    return null // Will redirect
  }

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.userEmail?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesLevel = filterLevel === 'all' || log.level === filterLevel
    const matchesCategory = filterCategory === 'all' || log.category === filterCategory
    
    return matchesSearch && matchesLevel && matchesCategory
  })

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'info': return { bg: 'rgba(59, 130, 246, 0.2)', color: '#93c5fd' }
      case 'warning': return { bg: 'rgba(245, 158, 11, 0.2)', color: '#fcd34d' }
      case 'error': return { bg: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5' }
      case 'critical': return { bg: 'rgba(127, 29, 29, 0.2)', color: '#fecaca' }
      default: return { bg: 'rgba(148, 163, 184, 0.2)', color: '#cbd5e1' }
    }
  }

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'info': return (
        <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
      case 'warning': return (
        <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      )
      case 'error': return (
        <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      )
      case 'critical': return (
        <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      )
      default: return (
        <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  }

  const categories = Array.from(new Set(logs.map(log => log.category)))
  const levelCounts = {
    info: logs.filter(log => log.level === 'info').length,
    warning: logs.filter(log => log.level === 'warning').length,
    error: logs.filter(log => log.level === 'error').length,
    critical: logs.filter(log => log.level === 'critical').length
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
                System Logs
              </h1>
              <p style={{
                color: '#cbd5e1',
                marginTop: '8px',
                fontSize: '18px'
              }}>
                Monitor system activity, errors, and user actions.
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p style={{
                  color: '#94a3b8',
                  fontSize: '14px',
                  margin: '0 0 4px 0'
                }}>
                  Total Logs
                </p>
                <p style={{
                  color: '#ffffff',
                  fontSize: '32px',
                  fontWeight: '700',
                  margin: 0
                }}>
                  {logs.length}
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
                background: 'linear-gradient(135deg, #59b3f6, #3b82f6)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg style={{ width: '24px', height: '24px', color: '#ffffff' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p style={{
                  color: '#94a3b8',
                  fontSize: '14px',
                  margin: '0 0 4px 0'
                }}>
                  Info Logs
                </p>
                <p style={{
                  color: '#ffffff',
                  fontSize: '32px',
                  fontWeight: '700',
                  margin: 0
                }}>
                  {levelCounts.info}
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <p style={{
                  color: '#94a3b8',
                  fontSize: '14px',
                  margin: '0 0 4px 0'
                }}>
                  Warnings
                </p>
                <p style={{
                  color: '#ffffff',
                  fontSize: '32px',
                  fontWeight: '700',
                  margin: 0
                }}>
                  {levelCounts.warning}
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <p style={{
                  color: '#94a3b8',
                  fontSize: '14px',
                  margin: '0 0 4px 0'
                }}>
                  Errors
                </p>
                <p style={{
                  color: '#ffffff',
                  fontSize: '32px',
                  fontWeight: '700',
                  margin: 0
                }}>
                  {levelCounts.error + levelCounts.critical}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Actions */}
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
            flexWrap: 'wrap',
            marginBottom: '24px'
          }}>
            <div style={{ flex: 1, minWidth: '300px' }}>
              <label style={{
                display: 'block',
                color: '#cbd5e1',
                fontWeight: '500',
                marginBottom: '8px',
                fontSize: '14px'
              }}>
                Search Logs
              </label>
              <input
                type="text"
                placeholder="Search by message, category, or user..."
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
                Log Level
              </label>
              <select
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value as any)}
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
                <option value="all">All Levels</option>
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label style={{
                display: 'block',
                color: '#cbd5e1',
                fontWeight: '500',
                marginBottom: '8px',
                fontSize: '14px'
              }}>
                Category
              </label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
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
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{
                display: 'block',
                color: '#cbd5e1',
                fontWeight: '500',
                marginBottom: '8px',
                fontSize: '14px'
              }}>
                Time Range
              </label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
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
                <option value="1h">Last Hour</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="all">All Time</option>
              </select>
            </div>
          </div>

          <div style={{
            display: 'flex',
            gap: '16px',
            justifyContent: 'flex-end'
          }}>
            <button
              onClick={exportLogs}
              style={{
                padding: '12px 24px',
                background: 'rgba(59, 130, 246, 0.2)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '8px',
                color: '#93c5fd',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.3)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              Export Logs
            </button>
            <button
              onClick={clearLogs}
              style={{
                padding: '12px 24px',
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                color: '#fca5a5',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(239, 68, 68, 0.3)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              Clear All Logs
            </button>
          </div>
        </div>

        {/* Logs Table */}
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
            System Logs ({filteredLogs.length} logs)
          </h3>
          
          {isLoadingLogs ? (
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
              Loading system logs...
            </div>
          ) : filteredLogs.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '48px',
              color: '#94a3b8'
            }}>
              No logs found matching your criteria.
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
                      Level
                    </th>
                    <th style={{
                      textAlign: 'left',
                      padding: '16px',
                      color: '#cbd5e1',
                      fontWeight: '500',
                      fontSize: '14px'
                    }}>
                      Category
                    </th>
                    <th style={{
                      textAlign: 'left',
                      padding: '16px',
                      color: '#cbd5e1',
                      fontWeight: '500',
                      fontSize: '14px'
                    }}>
                      Message
                    </th>
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
                      Timestamp
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => {
                    const levelColors = getLevelColor(log.level)
                    return (
                      <tr key={log.id} style={{
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
                            background: levelColors.bg,
                            color: levelColors.color,
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '500',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            textTransform: 'capitalize'
                          }}>
                            {getLevelIcon(log.level)}
                            {log.level}
                          </span>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <span style={{
                            color: '#cbd5e1',
                            fontSize: '14px',
                            fontWeight: '500'
                          }}>
                            {log.category}
                          </span>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <span style={{
                            color: '#ffffff',
                            fontSize: '14px',
                            maxWidth: '400px',
                            display: 'block',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {log.message}
                          </span>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <span style={{
                            color: '#94a3b8',
                            fontSize: '14px'
                          }}>
                            {log.userEmail || 'System'}
                          </span>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <span style={{
                            color: '#94a3b8',
                            fontSize: '14px'
                          }}>
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
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
