'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

interface SbirRecord {
  id: string
  [key: string]: any
}

interface SearchFilters {
  agency: string
  topic: string
  phase: string
  year: string
  status: string
}

export default function DSIPSettingsPage() {
  const { user: currentUser, isLoading: authLoading } = useAuth()
  const router = useRouter()
  
  // State for DSIP management
  const [sbirStats, setSbirStats] = useState<any>(null)
  const [sbirScraperStatus, setSbirScraperStatus] = useState<any>(null)
  const [isLoadingStats, setIsLoadingStats] = useState(false)
  const [isLoadingScraper, setIsLoadingScraper] = useState(false)
  
  // DSIP Scraper state
  const [isScraperRunning, setIsScraperRunning] = useState(false)
  const [scraperStatus, setScraperStatus] = useState<'idle' | 'running' | 'completed' | 'failed' | 'paused'>('idle')
  const [currentScrapingJob, setCurrentScrapingJob] = useState<any>(null)
  const [isCheckingActive, setIsCheckingActive] = useState(false)
  const [activeOpportunitiesCount, setActiveOpportunitiesCount] = useState<number | null>(null)
  
  // State for search testing
  const [searchResults, setSearchResults] = useState<SbirRecord[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    agency: '',
    topic: '',
    phase: '',
    year: '',
    status: ''
  })
  const [totalResults, setTotalResults] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [resultsPerPage] = useState(20)
  
  // State for database management
  const [isRefreshingData, setIsRefreshingData] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<string | null>(null)
  const [message, setMessage] = useState('')

  // Redirect if not admin
  useEffect(() => {
    if (!authLoading && (!currentUser || !currentUser.isAdmin)) {
      router.push('/admin')
    }
  }, [currentUser, authLoading, router])

  // Load initial data
  useEffect(() => {
    if (currentUser?.isAdmin) {
      loadSbirStats()
      checkSbirScraperStatus()
      checkScraperStatus()
    }
  }, [currentUser])
  
  // Check scraper status on mount
  const checkScraperStatus = async () => {
    try {
      const response = await fetch('/api/dsip/scraper')
      if (response.ok) {
        const data = await response.json()
        setIsScraperRunning(data.isRunning)
        setScraperStatus(data.status)
        setCurrentScrapingJob(data.currentJob)
      }
    } catch (error) {
      console.error('Error checking scraper status:', error)
    }
  }

  const loadSbirStats = async () => {
    setIsLoadingStats(true)
    try {
      const response = await fetch('/api/admin/sbir/stats')
      if (response.ok) {
        const data = await response.json()
        setSbirStats(data)
        setLastUpdate(data.lastUpdate || null)
      } else {
        setMessage('Failed to load SBIR statistics')
      }
    } catch (error) {
      console.error('Failed to load SBIR stats:', error)
      setMessage('Failed to load SBIR statistics')
    } finally {
      setIsLoadingStats(false)
    }
  }

  const checkSbirScraperStatus = async () => {
    setIsLoadingScraper(true)
    try {
      const response = await fetch('/api/admin/sbir/scraper')
      if (response.ok) {
        const data = await response.json()
        setSbirScraperStatus(data)
      } else {
        setMessage('Failed to check scraper status')
      }
    } catch (error) {
      console.error('Failed to check scraper status:', error)
      setMessage('Failed to check scraper status')
    } finally {
      setIsLoadingScraper(false)
    }
  }

  const startSbirScraper = async () => {
    setIsRefreshingData(true)
    setMessage('')
    try {
      const response = await fetch('/api/admin/sbir/scraper', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'start' }),
      })

      if (response.ok) {
        setMessage('SBIR data refresh started successfully!')
        // Refresh stats after a short delay
        setTimeout(() => {
          loadSbirStats()
          checkSbirScraperStatus()
        }, 2000)
      } else {
        const errorData = await response.json()
        setMessage(`Failed to start scraper: ${errorData.message}`)
      }
    } catch (error) {
      console.error('Failed to start scraper:', error)
      setMessage('Failed to start scraper')
    } finally {
      setIsRefreshingData(false)
    }
  }

  const testSearch = async () => {
    if (!searchQuery.trim()) {
      setMessage('Please enter a search query')
      return
    }

    setIsSearching(true)
    setMessage('')
    try {
      const params = new URLSearchParams({
        query: searchQuery,
        page: currentPage.toString(),
        limit: resultsPerPage.toString(),
        ...Object.fromEntries(Object.entries(searchFilters).filter(([_, value]) => value))
      })

      const response = await fetch(`/api/admin/sbir/search?${params}`)
      if (response.ok) {
        const data = await response.json()
        setSearchResults(data.results || [])
        setTotalResults(data.total || 0)
      } else {
        const errorData = await response.json()
        setMessage(`Search failed: ${errorData.message}`)
      }
    } catch (error) {
      console.error('Search failed:', error)
      setMessage('Search failed')
    } finally {
      setIsSearching(false)
    }
  }

  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    setSearchFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1) // Reset to first page when filters change
  }

  const clearFilters = () => {
    setSearchFilters({
      agency: '',
      topic: '',
      phase: '',
      year: '',
      status: ''
    })
    setSearchQuery('')
    setSearchResults([])
    setTotalResults(0)
    setCurrentPage(1)
  }

  const totalPages = Math.ceil(totalResults / resultsPerPage)

  // DSIP Scraper functions
  const startScraper = async (type: 'full' | 'quick') => {
    try {
      const response = await fetch('/api/dsip/scraper', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'start', type })
      })

      if (response.ok) {
        const data = await response.json()
        setIsScraperRunning(true)
        setScraperStatus('running')
        setMessage(`Scraper started successfully! ${data.message}`)
        
        // Start monitoring the scraper
        monitorScraper()
      } else {
        const errorData = await response.json()
        setMessage(`Failed to start scraper: ${errorData.error}`)
      }
    } catch (error) {
      setMessage('Error starting scraper')
    }
  }

  const stopScraper = async () => {
    try {
      const response = await fetch('/api/dsip/scraper', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action: 'stop',
          jobId: currentScrapingJob?.id 
        })
      })

      if (response.ok) {
        setIsScraperRunning(false)
        setScraperStatus('paused')
        setMessage('Scraper paused successfully')
      } else {
        setMessage('Failed to pause scraper')
      }
    } catch (error) {
      setMessage('Error pausing scraper')
    }
  }

  const resumeScraper = async () => {
    try {
      const response = await fetch('/api/dsip/scraper', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action: 'resume',
          jobId: currentScrapingJob?.id 
        })
      })

      if (response.ok) {
        setIsScraperRunning(true)
        setScraperStatus('running')
        setMessage('Scraper resumed successfully')
        
        // Start monitoring the scraper again
        monitorScraper()
      } else {
        const errorData = await response.json()
        setMessage(`Failed to resume scraper: ${errorData.error}`)
      }
    } catch (error) {
      setMessage('Error resuming scraper')
    }
  }

  const checkActiveOpportunities = async () => {
    try {
      setIsCheckingActive(true)
      setMessage('🔍 Checking for active opportunities...')
      
      // Query the database for active opportunities
      const response = await fetch('/api/dsip/active-opportunities')
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setActiveOpportunitiesCount(data.count)
          setMessage(`✅ Found ${data.count} active opportunities in the database`)
        } else {
          setMessage(`❌ Failed to check opportunities: ${data.error}`)
        }
      } else {
        setMessage('❌ Failed to check opportunities')
      }
    } catch (error) {
      setMessage('❌ Error checking active opportunities')
    } finally {
      setIsCheckingActive(false)
    }
  }

  const monitorScraper = async () => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch('/api/dsip/scraper')
        if (response.ok) {
          const data = await response.json()
          setIsScraperRunning(data.isRunning)
          setScraperStatus(data.status)
          setCurrentScrapingJob(data.currentJob)
          
          if (data.status === 'completed' || data.status === 'failed') {
            clearInterval(interval)
            setIsScraperRunning(false)
            if (data.status === 'completed') {
              setMessage('Scraping completed successfully!')
            } else {
              setMessage(`Scraping failed: ${data.currentJob?.error || 'Unknown error'}`)
            }
          }
        }
      } catch (error) {
        console.error('Error monitoring scraper:', error)
      }
    }, 2000) // Check every 2 seconds

    // Cleanup interval on component unmount
    return () => clearInterval(interval)
  }

  const testScraperSystem = async () => {
    try {
      setMessage('🧪 Testing scraper system...')
      
      // Test 1: Basic system status
      const statusResponse = await fetch('/api/dsip/test-scraper')
      if (statusResponse.ok) {
        const statusData = await statusResponse.json()
        console.log('System Status Test:', statusData)
        
        if (statusData.success) {
          setMessage('✅ System status test passed! Check console for details.')
        } else {
          setMessage('❌ System status test failed! Check console for details.')
        }
      }
      
      // Test 2: Database operations
      const dbResponse = await fetch('/api/dsip/test-scraper', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'test-database' })
      })
      
      if (dbResponse.ok) {
        const dbData = await dbResponse.json()
        console.log('Database Test:', dbData)
        
        if (dbData.success) {
          setMessage('✅ Database test passed! Check console for details.')
        } else {
          setMessage('❌ Database test failed! Check console for details.')
        }
      }
      
      // Test 3: Connection test
      const connResponse = await fetch('/api/dsip/test-scraper', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'test-connection' })
      })
      
      if (connResponse.ok) {
        const connData = await connResponse.json()
        console.log('Connection Test:', connData)
        
        if (connData.success) {
          setMessage('✅ Connection test passed! Check console for details.')
        } else {
          setMessage('❌ Connection test failed! Check console for details.')
        }
      }
      
    } catch (error) {
      setMessage('❌ Test failed with error. Check console for details.')
      console.error('Test error:', error)
    }
  }

  const testDatabase = async () => {
    try {
      setMessage('🗄️ Testing database connection and tables...')
      
      const response = await fetch('/api/dsip/test-database')
      if (response.ok) {
        const data = await response.json()
        console.log('Database Test Results:', data)
        
        if (data.success) {
          const status = data.databaseStatus
          let message = '🗄️ Database Test Results:\n'
          message += `📊 Opportunities Table: ${status.opportunitiesTable.exists ? '✅ Exists' : '❌ Missing'} (${status.opportunitiesTable.count} records)\n`
          message += `📋 Scraping Jobs Table: ${status.scrapingJobsTable.exists ? '✅ Exists' : '❌ Missing'} (${status.scrapingJobsTable.count} records)\n`
          message += `👥 Users Table: ${status.usersTable.exists ? '✅ Exists' : '❌ Missing'} (${status.usersTable.count} records)\n`
          message += `✏️ Can Insert: ${status.canInsert ? '✅ Yes' : '❌ No'}`
          
          if (status.insertError) {
            message += `\n❌ Insert Error: ${status.insertError}`
          }
          
          setMessage(message)
        } else {
          setMessage('❌ Database test failed')
        }
      } else {
        setMessage('❌ Failed to test database')
      }
    } catch (error) {
      setMessage('❌ Error testing database')
      console.error('Database test error:', error)
    }
  }

  if (authLoading || isLoadingStats) {
    return (
      <div className="dsip-settings-page loading">
        <div className="container">
          <div className="spinner"></div>
          <p>Loading DSIP settings...</p>
        </div>
      </div>
    )
  }

  if (!currentUser?.isAdmin) {
    return null // Will redirect
  }

  return (
    <div className="dsip-settings-page">
      <div className="container">
        <div className="page-header">
          <button 
            className="back-btn"
            onClick={() => router.push('/admin')}
          >
            ← Back to Admin Dashboard
          </button>
          <h1>DSIP Search Tool Settings</h1>
          <p>Manage the DSIP search tool, test queries, and monitor database performance.</p>
        </div>

        {message && (
          <div className={`message ${message.includes('successfully') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        {/* Database Management Section */}
        <div className="settings-section">
          <h2>Database Management</h2>
          <div className="database-stats">
            {sbirStats ? (
              <div className="stats-grid">
                <div className="stat-card">
                  <h3>Total Records</h3>
                  <span className="stat-number">{sbirStats.totalRecords?.toLocaleString() || '0'}</span>
                </div>
                <div className="stat-card">
                  <h3>Last Update</h3>
                  <span className="stat-text">
                    {lastUpdate ? new Date(lastUpdate).toLocaleString() : 'Never'}
                  </span>
                </div>
                <div className="stat-card">
                  <h3>Database Size</h3>
                  <span className="stat-text">{sbirStats.databaseSize || 'Unknown'}</span>
                </div>
                <div className="stat-card">
                  <h3>Scraper Status</h3>
                  <span className={`status-badge ${sbirScraperStatus?.isRunning ? 'running' : 'stopped'}`}>
                    {sbirScraperStatus?.isRunning ? 'Running' : 'Stopped'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="loading-stats">
                <div className="spinner"></div>
                <p>Loading database statistics...</p>
              </div>
            )}
          </div>

          <div className="database-actions">
            <button
              className="btn btn-primary"
              onClick={startSbirScraper}
              disabled={isRefreshingData || sbirScraperStatus?.isRunning}
            >
              {isRefreshingData ? 'Refreshing...' : 'Refresh Database'}
            </button>
            <button
              className="btn btn-outline"
              onClick={loadSbirStats}
              disabled={isLoadingStats}
            >
              {isLoadingStats ? 'Loading...' : 'Refresh Stats'}
            </button>
          </div>
        </div>

        {/* DSIP Scraper Management Section */}
        <div className="settings-section">
          <h2>🍪 DSIP Scraper Management</h2>
          <p>Control and monitor the DSIP web scraper for real-time opportunity updates.</p>
          
          {/* Active Opportunities Checker */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%)',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            marginBottom: '24px'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#10b981',
              margin: '0 0 12px 0'
            }}>
              📊 Active Opportunities Monitor
            </h3>
            <p style={{
              color: '#6b7280',
              fontSize: '14px',
              margin: '0 0 16px 0'
            }}>
              Check DSIP for all currently active opportunities. This will scan the database and identify opportunities that are currently open for submissions.
            </p>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={checkActiveOpportunities}
                disabled={isCheckingActive}
                className="btn btn-primary"
                style={{
                  background: isCheckingActive ? 'rgba(148, 163, 184, 0.3)' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  opacity: isCheckingActive ? 0.6 : 1
                }}
              >
                {isCheckingActive ? '🔄 Checking...' : '🔍 Check Active Opportunities'}
              </button>
              
              {activeOpportunitiesCount !== null && (
                <div style={{
                  background: 'rgba(16, 185, 129, 0.2)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  color: '#10b981',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  📈 Found {activeOpportunitiesCount} active opportunities
                </div>
              )}
            </div>
          </div>

          {/* Scraper Controls Grid */}
          <div className="scraper-controls-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '24px',
            marginBottom: '24px'
          }}>
            {/* Database Status */}
            <div style={{
              background: 'rgba(30, 41, 59, 0.5)',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid rgba(148, 163, 184, 0.2)'
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 16px 0' }}>Database Status</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8', fontSize: '14px' }}>Total Opportunities:</span>
                  <span style={{ fontWeight: '600' }}>33,000+</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8', fontSize: '14px' }}>Last Updated:</span>
                  <span style={{ fontWeight: '600' }}>Today</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8', fontSize: '14px' }}>Scraper Status:</span>
                  <span style={{ 
                    color: scraperStatus === 'running' ? '#fbbf24' : scraperStatus === 'completed' ? '#10b981' : scraperStatus === 'failed' ? '#ef4444' : '#94a3b8', 
                    fontWeight: '600' 
                  }}>
                    {scraperStatus === 'running' ? '🔄 Running' : scraperStatus === 'completed' ? '✅ Completed' : scraperStatus === 'failed' ? '❌ Failed' : '⏸️ Idle'}
                  </span>
                </div>
              </div>
            </div>

            {/* Scraper Controls */}
            <div style={{
              background: 'rgba(30, 41, 59, 0.5)',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid rgba(148, 163, 184, 0.2)'
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 16px 0' }}>Scraper Controls</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {!isScraperRunning ? (
                  <>
                    <button
                      onClick={() => startScraper('full')}
                      className="btn btn-primary"
                      style={{
                        background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
                        width: '100%'
                      }}
                    >
                      🚀 Full Refresh (8-12 hours)
                    </button>
                    <button
                      onClick={() => startScraper('quick')}
                      className="btn btn-primary"
                      style={{
                        background: 'linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%)',
                        width: '100%'
                      }}
                    >
                      ⚡ Quick Check Active
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={stopScraper}
                      className="btn btn-warning"
                      style={{ width: '100%' }}
                    >
                      🛑 Pause Scraper
                    </button>
                    {currentScrapingJob?.status === 'paused' && (
                      <button
                        onClick={resumeScraper}
                        className="btn btn-primary"
                        style={{ width: '100%' }}
                      >
                        ▶️ Resume Scraper
                      </button>
                    )}
                  </>
                )}
                <button
                  onClick={testScraperSystem}
                  className="btn btn-outline"
                  style={{ width: '100%' }}
                >
                  🧪 Test Scraper System
                </button>
                <button
                  onClick={testDatabase}
                  className="btn btn-outline"
                  style={{ width: '100%' }}
                >
                  🗄️ Test Database
                </button>
              </div>
            </div>
          </div>

          {/* Scraper Status */}
          {isScraperRunning && currentScrapingJob && (
            <div style={{
              background: 'rgba(15, 23, 42, 0.6)',
              borderRadius: '12px',
              padding: '24px',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              marginBottom: '24px'
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 16px 0' }}>
                Scraping Progress - {currentScrapingJob.type === 'full' ? 'Full Refresh' : 'Quick Check'}
              </h3>
              <div style={{ marginBottom: '16px' }}>
                <div style={{
                  width: '100%',
                  height: '12px',
                  background: 'rgba(148, 163, 184, 0.2)',
                  borderRadius: '6px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${currentScrapingJob.progress}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #4ecdc4 0%, #44a08d 100%)',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
                <p style={{ color: '#94a3b8', margin: '8px 0 0 0', fontSize: '14px' }}>
                  {currentScrapingJob.progress}% complete - {currentScrapingJob.processedTopics} of {currentScrapingJob.totalTopics} topics
                </p>
                {currentScrapingJob.estimatedCompletion && (
                  <p style={{ color: '#94a3b8', margin: '4px 0 0 0', fontSize: '12px' }}>
                    ⏰ Estimated completion: {new Date(currentScrapingJob.estimatedCompletion).toLocaleString()}
                  </p>
                )}
              </div>
              <div style={{ 
                maxHeight: '200px', 
                overflowY: 'auto',
                background: 'rgba(0, 0, 0, 0.2)',
                borderRadius: '8px',
                padding: '12px'
              }}>
                <h4 style={{ color: '#ffffff', margin: '0 0 8px 0', fontSize: '14px' }}>Recent Logs:</h4>
                {currentScrapingJob.logs.slice(-8).map((log: string, index: number) => (
                  <p key={index} style={{ 
                    color: '#cbd5e1', 
                    margin: '4px 0', 
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    lineHeight: '1.4'
                  }}>
                    {log}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Search Testing Section */}
        <div className="settings-section">
          <h2>Search Tool Testing</h2>
          <p>Test the DSIP search functionality with real queries against the sbir_final database.</p>
          
          <div className="search-testing">
            <div className="search-input-section">
              <div className="search-bar">
                <input
                  type="text"
                  placeholder="Enter search query (e.g., 'artificial intelligence', 'defense', 'aerospace')"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                  onKeyPress={(e) => e.key === 'Enter' && testSearch()}
                />
                <button
                  className="btn btn-primary"
                  onClick={testSearch}
                  disabled={isSearching || !searchQuery.trim()}
                >
                  {isSearching ? 'Searching...' : 'Search'}
                </button>
              </div>
            </div>

            <div className="search-filters">
              <h3>Advanced Filters</h3>
              <div className="filters-grid">
                <div className="filter-group">
                  <label>Agency:</label>
                  <input
                    type="text"
                    placeholder="e.g., Air Force, Navy, Army"
                    value={searchFilters.agency}
                    onChange={(e) => handleFilterChange('agency', e.target.value)}
                    className="filter-input"
                  />
                </div>
                <div className="filter-group">
                  <label>Topic:</label>
                  <input
                    type="text"
                    placeholder="e.g., AI, cybersecurity, materials"
                    value={searchFilters.topic}
                    onChange={(e) => handleFilterChange('topic', e.target.value)}
                    className="filter-input"
                  />
                </div>
                <div className="filter-group">
                  <label>Phase:</label>
                  <select
                    value={searchFilters.phase}
                    onChange={(e) => handleFilterChange('phase', e.target.value)}
                    className="filter-select"
                  >
                    <option value="">All Phases</option>
                    <option value="Phase I">Phase I</option>
                    <option value="Phase II">Phase II</option>
                    <option value="Phase III">Phase III</option>
                  </select>
                </div>
                <div className="filter-group">
                  <label>Year:</label>
                  <input
                    type="number"
                    placeholder="e.g., 2024, 2025"
                    value={searchFilters.year}
                    onChange={(e) => handleFilterChange('year', e.target.value)}
                    className="filter-input"
                    min="2020"
                    max="2030"
                  />
                </div>
                <div className="filter-group">
                  <label>Status:</label>
                  <select
                    value={searchFilters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="filter-select"
                  >
                    <option value="">All Status</option>
                    <option value="Open">Open</option>
                    <option value="Closed">Closed</option>
                    <option value="Awarded">Awarded</option>
                  </select>
                </div>
                <div className="filter-group">
                  <button
                    className="btn btn-outline"
                    onClick={clearFilters}
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="search-results">
                <div className="results-header">
                  <h3>Search Results</h3>
                  <p>Found {totalResults.toLocaleString()} results (showing {searchResults.length} on page {currentPage} of {totalPages})</p>
                </div>
                
                <div className="results-table-container">
                  <table className="results-table">
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Agency</th>
                        <th>Phase</th>
                        <th>Year</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {searchResults.map((record, index) => (
                        <tr key={record.id || index}>
                          <td className="title-cell">
                            <div className="record-title">
                              {record.title || record.topic_title || 'No title available'}
                            </div>
                            <div className="record-subtitle">
                              {record.agency || 'Unknown agency'}
                            </div>
                          </td>
                          <td>{record.agency || 'N/A'}</td>
                          <td>
                            <span className="phase-badge">
                              {record.phase || 'N/A'}
                            </span>
                          </td>
                          <td>{record.year || record.fiscal_year || 'N/A'}</td>
                          <td>
                            <span className={`status-badge ${record.status?.toLowerCase() || 'unknown'}`}>
                              {record.status || 'Unknown'}
                            </span>
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-outline"
                              onClick={() => {
                                // Could open a detailed view modal here
                                console.log('View details for:', record.id)
                              }}
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="pagination">
                    <button
                      className="btn btn-outline"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </button>
                    <span className="page-info">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      className="btn btn-outline"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            )}

            {searchResults.length === 0 && searchQuery && !isSearching && (
              <div className="no-results">
                <p>No results found for your search query.</p>
                <p>Try adjusting your search terms or filters.</p>
              </div>
            )}
          </div>
        </div>

        {/* System Configuration Section */}
        <div className="settings-section">
          <h2>System Configuration</h2>
          <div className="config-options">
            <div className="config-item">
              <h3>Search Index Status</h3>
              <p>Database search indexing and optimization status</p>
              <div className="config-status">
                <span className="status-indicator active"></span>
                <span>Indexed and optimized</span>
              </div>
            </div>
            <div className="config-item">
              <h3>API Rate Limits</h3>
              <p>Current rate limiting configuration for search requests</p>
              <div className="config-status">
                <span className="status-indicator active"></span>
                <span>100 requests per minute per user</span>
              </div>
            </div>
            <div className="config-item">
              <h3>Cache Status</h3>
              <p>Search result caching for improved performance</p>
              <div className="config-status">
                <span className="status-indicator active"></span>
                <span>Enabled with 5-minute TTL</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
