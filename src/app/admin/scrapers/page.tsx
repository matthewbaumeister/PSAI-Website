'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

interface ScraperStatus {
  name: string
  displayName: string
  lastRun: string | null
  status: 'success' | 'failed' | 'running' | 'never-run'
  recordsProcessed: number
  recordsInserted: number
  recordsUpdated: number
  errors: number
  duration: number | null
  errorMessage: string | null
  cronPath: string
  testPath: string | null
  totalRowsInDb: number
  totalDataPoints: number
}

export default function ScrapersPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  
  const [scrapers, setScrapers] = useState<ScraperStatus[]>([])
  const [isLoadingScrapers, setIsLoadingScrapers] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')
  const [triggeringScrapers, setTriggeringScrapers] = useState<Set<string>>(new Set())

  // Check if user is admin
  useEffect(() => {
    if (!isLoading && (!user || !user.isAdmin)) {
      const returnUrl = encodeURIComponent('/admin/scrapers')
      router.push(`/auth/login?returnUrl=${returnUrl}`)
    }
  }, [user, isLoading, router])

  // Load scraper data
  useEffect(() => {
    if (user?.isAdmin) {
      loadScrapers()
    }
  }, [user])

  const loadScrapers = async () => {
    setIsLoadingScrapers(true)
    try {
      const response = await fetch('/api/admin/scrapers/status')
      if (response.ok) {
        const data = await response.json()
        setScrapers(data.scrapers || [])
      } else {
        setMessage('Failed to load scraper status')
        setMessageType('error')
      }
    } catch (error) {
      console.error('Error loading scrapers:', error)
      setMessage('Error loading scraper status')
      setMessageType('error')
    } finally {
      setIsLoadingScrapers(false)
    }
  }

  const triggerScraper = async (scraper: ScraperStatus) => {
    if (!scraper.testPath) {
      setMessage(`Manual trigger not available for ${scraper.displayName}`)
      setMessageType('error')
      return
    }

    setTriggeringScrapers(prev => new Set(prev).add(scraper.name))
    setMessage(`Triggering ${scraper.displayName} via GitHub Actions...`)
    setMessageType('success')

    try {
      const response = await fetch('/api/admin/scrapers/trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ scraper: scraper.name })
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(`${scraper.displayName} triggered successfully! The scraper is now running on GitHub Actions. Check your email for results.`)
        setMessageType('success')
        setTimeout(() => loadScrapers(), 3000) // Reload after 3 seconds
      } else {
        setMessage(`Failed to trigger ${scraper.displayName}: ${data.error}`)
        setMessageType('error')
      }
    } catch (error: any) {
      console.error('Error triggering scraper:', error)
      setMessage(`Error triggering ${scraper.displayName}: ${error.message}`)
      setMessageType('error')
    } finally {
      setTriggeringScrapers(prev => {
        const next = new Set(prev)
        next.delete(scraper.name)
        return next
      })
    }
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A'
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  const formatLastRun = (date: string | null) => {
    if (!date) return 'Never'
    const d = new Date(date)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return d.toLocaleDateString()
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
          <p style={{ color: '#c4b5fd', fontSize: '18px' }}>Loading...</p>
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
                Data Scrapers
              </h1>
              <p style={{
                color: '#cbd5e1',
                marginTop: '8px',
                fontSize: '18px'
              }}>
                Monitor and manage all automated data collection jobs running on GitHub Actions
              </p>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px'
            }}>
              <button
                onClick={loadScrapers}
                disabled={isLoadingScrapers}
                style={{
                  padding: '12px 24px',
                  background: 'rgba(59, 130, 246, 0.2)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: '12px',
                  color: '#93c5fd',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: isLoadingScrapers ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  opacity: isLoadingScrapers ? 0.6 : 1
                }}
              >
                {isLoadingScrapers ? 'Refreshing...' : 'Refresh Status'}
              </button>
            </div>
          </div>
          
          {/* Messages */}
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
              gap: '12px'
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
              {message}
            </div>
          )}
        </div>
      </div>

      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '32px 24px'
      }}>
        {/* Scrapers Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
          gap: '24px'
        }}>
          {scrapers.map((scraper) => {
            const statusColor = 
              scraper.status === 'success' ? { bg: 'rgba(34, 197, 94, 0.1)', border: 'rgba(34, 197, 94, 0.3)', text: '#86efac' } :
              scraper.status === 'failed' ? { bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.3)', text: '#fca5a5' } :
              scraper.status === 'running' ? { bg: 'rgba(59, 130, 246, 0.1)', border: 'rgba(59, 130, 246, 0.3)', text: '#93c5fd' } :
              { bg: 'rgba(148, 163, 184, 0.1)', border: 'rgba(148, 163, 184, 0.3)', text: '#94a3b8' }

            return (
              <div key={scraper.name} style={{
                background: 'rgba(30, 41, 59, 0.6)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                borderRadius: '20px',
                padding: '24px',
                transition: 'all 0.3s ease'
              }}>
                {/* Scraper Header */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '20px'
                }}>
                  <h3 style={{
                    fontSize: '20px',
                    fontWeight: '700',
                    color: '#ffffff',
                    margin: 0
                  }}>
                    {scraper.displayName}
                  </h3>
                  <span style={{
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '600',
                    background: statusColor.bg,
                    color: statusColor.text,
                    border: `1px solid ${statusColor.border}`
                  }}>
                    {scraper.status.toUpperCase()}
                  </span>
                </div>

                {/* Stats */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                  marginBottom: '20px'
                }}>
                  <div style={{
                    background: 'rgba(15, 23, 42, 0.6)',
                    padding: '12px',
                    borderRadius: '12px'
                  }}>
                    <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}>Last Run</div>
                    <div style={{ color: '#ffffff', fontSize: '14px', fontWeight: '600' }}>
                      {formatLastRun(scraper.lastRun)}
                    </div>
                  </div>
                  <div style={{
                    background: 'rgba(15, 23, 42, 0.6)',
                    padding: '12px',
                    borderRadius: '12px'
                  }}>
                    <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}>Duration</div>
                    <div style={{ color: '#ffffff', fontSize: '14px', fontWeight: '600' }}>
                      {formatDuration(scraper.duration)}
                    </div>
                  </div>
                  <div style={{
                    background: 'rgba(15, 23, 42, 0.6)',
                    padding: '12px',
                    borderRadius: '12px'
                  }}>
                    <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}>Processed</div>
                    <div style={{ color: '#ffffff', fontSize: '14px', fontWeight: '600' }}>
                      {scraper.recordsProcessed.toLocaleString()}
                    </div>
                  </div>
                  <div style={{
                    background: 'rgba(15, 23, 42, 0.6)',
                    padding: '12px',
                    borderRadius: '12px'
                  }}>
                    <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}>Inserted</div>
                    <div style={{ color: '#ffffff', fontSize: '14px', fontWeight: '600' }}>
                      {scraper.recordsInserted.toLocaleString()}
                    </div>
                  </div>
                  <div style={{
                    background: 'rgba(15, 23, 42, 0.6)',
                    padding: '12px',
                    borderRadius: '12px'
                  }}>
                    <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}>Updated</div>
                    <div style={{ color: '#ffffff', fontSize: '14px', fontWeight: '600' }}>
                      {scraper.recordsUpdated.toLocaleString()}
                    </div>
                  </div>
                  <div style={{
                    background: 'rgba(15, 23, 42, 0.6)',
                    padding: '12px',
                    borderRadius: '12px'
                  }}>
                    <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}>Errors</div>
                    <div style={{ color: scraper.errors > 0 ? '#fca5a5' : '#ffffff', fontSize: '14px', fontWeight: '600' }}>
                      {scraper.errors.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Database Metrics */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '12px',
                  marginTop: '16px'
                }}>
                  <div style={{
                    background: 'rgba(15, 23, 42, 0.6)',
                    padding: '12px',
                    borderRadius: '12px'
                  }}>
                    <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}>Total Rows in DB</div>
                    <div style={{ color: '#ffffff', fontSize: '14px', fontWeight: '600' }}>
                      {scraper.totalRowsInDb.toLocaleString()}
                    </div>
                  </div>
                  <div style={{
                    background: 'rgba(15, 23, 42, 0.6)',
                    padding: '12px',
                    borderRadius: '12px'
                  }}>
                    <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}>Total Data Points</div>
                    <div style={{ color: '#10b981', fontSize: '14px', fontWeight: '600' }}>
                      {scraper.totalDataPoints.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Error Message */}
                {scraper.errorMessage && (
                  <div style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '12px',
                    padding: '12px',
                    marginBottom: '16px',
                    color: '#fca5a5',
                    fontSize: '12px'
                  }}>
                    {scraper.errorMessage}
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: '12px' }}>
                  {scraper.testPath && (
                    <button
                      onClick={() => triggerScraper(scraper)}
                      disabled={triggeringScrapers.has(scraper.name)}
                      style={{
                        flex: 1,
                        padding: '12px',
                        background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                        border: 'none',
                        borderRadius: '12px',
                        color: '#ffffff',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: triggeringScrapers.has(scraper.name) ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s ease',
                        opacity: triggeringScrapers.has(scraper.name) ? 0.6 : 1
                      }}
                    >
                      {triggeringScrapers.has(scraper.name) ? 'Running...' : 'Trigger Manually'}
                    </button>
                  )}
                  <button
                    style={{
                      padding: '12px 16px',
                      background: 'rgba(59, 130, 246, 0.2)',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      borderRadius: '12px',
                      color: '#93c5fd',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onClick={() => window.open(`https://github.com/matthewbaumeister/PropShop_AI_Website/actions`, '_blank')}
                  >
                    View GitHub Actions
                  </button>
                </div>
              </div>
            )
          })}
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

