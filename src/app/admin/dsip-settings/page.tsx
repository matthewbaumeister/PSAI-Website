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
    }
  }, [currentUser])

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
