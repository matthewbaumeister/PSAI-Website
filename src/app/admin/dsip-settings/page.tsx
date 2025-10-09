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
  
  // Supabase test state
  const [supabaseTestResults, setSupabaseTestResults] = useState<any>(null)
  const [isTestingSupabase, setIsTestingSupabase] = useState(false)
  const [supabaseData, setSupabaseData] = useState<any[]>([])
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [selectedTable, setSelectedTable] = useState<string>('')
  const [dataSearchQuery, setDataSearchQuery] = useState('')
  
  // SendGrid test state
  const [sendgridConfig, setSendgridConfig] = useState<any>(null)
  const [isTestingSendgrid, setIsTestingSendgrid] = useState(false)
  const [testEmail, setTestEmail] = useState('')
  const [resendEmail, setResendEmail] = useState('')
  
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
      testSendgridConfig()
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

  const testSupabaseDatabase = async () => {
    try {
      setIsTestingSupabase(true)
      setMessage('🗄️ Testing Supabase database connection...')
      
      const response = await fetch('/api/admin/supabase-test')
      if (response.ok) {
        const data = await response.json()
        console.log('Supabase Test Results:', data)
        
        if (data.success) {
          setSupabaseTestResults(data.results)
          
          let message = '🗄️ Supabase Database Test Results:\n'
          message += `🔗 Connection: ${data.results.connection.success ? '✅ Connected' : '❌ Failed'}\n`
          message += `📊 Total Records: ${data.results.totalRecords.toLocaleString()}\n\n`
          message += '📋 Tables Status:\n'
          
          Object.entries(data.results.tables).forEach(([tableName, tableInfo]: [string, any]) => {
            const status = tableInfo.exists ? '✅' : '❌'
            const count = tableInfo.exists ? `(${tableInfo.count} records)` : '(missing)'
            message += `${status} ${tableName}: ${count}\n`
          })
          
          setMessage(message)
        } else {
          setMessage('❌ Supabase test failed: ' + data.error)
        }
      } else {
        setMessage('❌ Failed to test Supabase database')
      }
    } catch (error) {
      setMessage('❌ Error testing Supabase database')
      console.error('Supabase test error:', error)
    } finally {
      setIsTestingSupabase(false)
    }
  }
  
  const loadSupabaseData = async (tableName: string, searchQuery: string = '') => {
    if (!tableName) return
    
    try {
      setIsLoadingData(true)
      const response = await fetch('/api/admin/supabase-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'search_data',
          tableName,
          searchQuery,
          limit: 50
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setSupabaseData(data.data)
        } else {
          setMessage('❌ Failed to load data: ' + data.error)
        }
      } else {
        setMessage('❌ Failed to load data')
      }
    } catch (error) {
      setMessage('❌ Error loading data')
      console.error('Data loading error:', error)
    } finally {
      setIsLoadingData(false)
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
  
  const testSendgridConfig = async () => {
    try {
      const response = await fetch('/api/admin/test-sendgrid')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setSendgridConfig(data.config)
        }
      }
    } catch (error) {
      console.error('SendGrid config test error:', error)
    }
  }
  
  const sendTestEmail = async () => {
    if (!testEmail.trim()) {
      setMessage('Please enter a test email address')
      return
    }
    
    try {
      setIsTestingSendgrid(true)
      setMessage('📧 Sending test email...')
      
      const response = await fetch('/api/admin/test-sendgrid', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'send_test_email',
          testEmail: testEmail.trim()
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setMessage(`✅ Test email sent successfully to ${testEmail}! Check your inbox.`)
        } else {
          let errorMsg = '❌ Failed to send test email: ' + data.error
          if (data.config) {
            errorMsg += `\n\nConfiguration:\n- API Key: ${data.config.hasApiKey ? 'Present' : 'Missing'}\n- From Email: ${data.config.fromEmail || 'Not set'}\n- API Key Length: ${data.config.apiKeyLength}`
          }
          setMessage(errorMsg)
        }
      } else {
        setMessage('❌ Failed to send test email - Server error')
      }
    } catch (error) {
      setMessage('❌ Error sending test email')
      console.error('Test email error:', error)
    } finally {
      setIsTestingSendgrid(false)
    }
  }
  
  const resendVerificationEmail = async () => {
    if (!resendEmail.trim()) {
      setMessage('Please enter the user email address')
      return
    }
    
    try {
      setIsTestingSendgrid(true)
      setMessage('📧 Resending verification email...')
      
      const response = await fetch('/api/admin/test-sendgrid', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'resend_verification',
          userEmail: resendEmail.trim()
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setMessage(`✅ Verification email resent successfully to ${resendEmail}!`)
        } else {
          setMessage('❌ Failed to resend verification email: ' + data.error)
        }
      } else {
        setMessage('❌ Failed to resend verification email')
      }
    } catch (error) {
      setMessage('❌ Error resending verification email')
      console.error('Resend verification error:', error)
    } finally {
      setIsTestingSendgrid(false)
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

        {/* SendGrid Email Test Section */}
        <div className="settings-section">
          <h2>📧 SendGrid Email Testing</h2>
          <p>Test SendGrid email delivery and resend verification emails to users who didn't receive them.</p>
          
          <div style={{
            background: 'rgba(30, 41, 59, 0.6)',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            marginBottom: '24px'
          }}>
            <h3 style={{ color: '#ffffff', marginBottom: '16px', fontSize: '18px' }}>🔧 SendGrid Configuration</h3>
            
            {sendgridConfig && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                <div style={{
                  background: sendgridConfig.hasApiKey ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  border: `1px solid ${sendgridConfig.hasApiKey ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                  borderRadius: '8px',
                  padding: '16px'
                }}>
                  <div style={{ color: sendgridConfig.hasApiKey ? '#22c55e' : '#ef4444', fontSize: '24px', fontWeight: 'bold' }}>
                    {sendgridConfig.hasApiKey ? '✅' : '❌'}
                  </div>
                  <div style={{ color: sendgridConfig.hasApiKey ? '#86efac' : '#fca5a5', fontSize: '12px' }}>
                    API Key
                  </div>
                </div>
                
                <div style={{
                  background: sendgridConfig.hasFromEmail ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  border: `1px solid ${sendgridConfig.hasFromEmail ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                  borderRadius: '8px',
                  padding: '16px'
                }}>
                  <div style={{ color: sendgridConfig.hasFromEmail ? '#22c55e' : '#ef4444', fontSize: '24px', fontWeight: 'bold' }}>
                    {sendgridConfig.hasFromEmail ? '✅' : '❌'}
                  </div>
                  <div style={{ color: sendgridConfig.hasFromEmail ? '#86efac' : '#fca5a5', fontSize: '12px' }}>
                    From Email
                  </div>
                </div>
                
                <div style={{
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: '8px',
                  padding: '16px'
                }}>
                  <div style={{ color: '#3b82f6', fontSize: '14px', fontWeight: 'bold', wordBreak: 'break-all' }}>
                    {sendgridConfig.fromEmail}
                  </div>
                  <div style={{ color: '#93c5fd', fontSize: '12px' }}>
                    Sender Address
                  </div>
                </div>
              </div>
            )}
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              {/* Test Email */}
              <div>
                <h4 style={{ color: '#ffffff', marginBottom: '12px', fontSize: '16px' }}>🧪 Send Test Email</h4>
                <p style={{ color: '#cbd5e1', fontSize: '14px', marginBottom: '16px' }}>
                  Send a test email to verify SendGrid is working
                </p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <input
                    type="email"
                    placeholder="test@example.com"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    style={{
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid rgba(148, 163, 184, 0.3)',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      color: '#ffffff',
                      fontSize: '14px',
                      flex: '1',
                      minWidth: '200px'
                    }}
                  />
                  <button
                    onClick={sendTestEmail}
                    disabled={isTestingSendgrid || !testEmail.trim()}
                    style={{
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '8px 16px',
                      color: '#ffffff',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: isTestingSendgrid ? 'not-allowed' : 'pointer',
                      opacity: isTestingSendgrid ? 0.6 : 1
                    }}
                  >
                    {isTestingSendgrid ? '🔄 Sending...' : '📧 Send Test'}
                  </button>
                </div>
              </div>
              
              {/* Resend Verification */}
              <div>
                <h4 style={{ color: '#ffffff', marginBottom: '12px', fontSize: '16px' }}>🔄 Resend Verification Email</h4>
                <p style={{ color: '#cbd5e1', fontSize: '14px', marginBottom: '16px' }}>
                  Resend verification email to a user who didn't receive it
                </p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <input
                    type="email"
                    placeholder="user@example.com"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    style={{
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid rgba(148, 163, 184, 0.3)',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      color: '#ffffff',
                      fontSize: '14px',
                      flex: '1',
                      minWidth: '200px'
                    }}
                  />
                  <button
                    onClick={resendVerificationEmail}
                    disabled={isTestingSendgrid || !resendEmail.trim()}
                    style={{
                      background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '8px 16px',
                      color: '#ffffff',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: isTestingSendgrid ? 'not-allowed' : 'pointer',
                      opacity: isTestingSendgrid ? 0.6 : 1
                    }}
                  >
                    {isTestingSendgrid ? '🔄 Sending...' : '🔄 Resend'}
                  </button>
                </div>
              </div>
            </div>
            
            <div style={{
              background: 'rgba(15, 23, 42, 0.4)',
              borderRadius: '8px',
              padding: '16px',
              marginTop: '20px',
              border: '1px solid rgba(148, 163, 184, 0.2)'
            }}>
              <h4 style={{ color: '#ffffff', marginBottom: '8px', fontSize: '14px' }}>📋 Current SendGrid Configuration:</h4>
              <div style={{ color: '#cbd5e1', fontSize: '13px', lineHeight: '1.5' }}>
                <div><strong>Sender Email:</strong> {sendgridConfig?.fromEmail || 'Not configured'}</div>
                <div><strong>Sender Name:</strong> {sendgridConfig?.fromName || 'Not configured'}</div>
                <div><strong>API Key:</strong> {sendgridConfig?.hasApiKey ? '✅ Configured' : '❌ Missing'}</div>
                <div><strong>From Email:</strong> {sendgridConfig?.hasFromEmail ? '✅ Configured' : '❌ Missing'}</div>
                <div style={{ marginTop: '8px', fontSize: '12px', color: '#94a3b8' }}>
                  Note: This shows your current configuration. Make sure your sender email matches one of your verified senders in SendGrid.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Supabase Database Test Section */}
        <div className="settings-section">
          <h2>🗄️ Supabase Database Test</h2>
          <p>Test your Supabase database connection and view actual data from your tables.</p>
          
          <div className="database-test-actions" style={{ marginBottom: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              className="btn btn-primary"
              onClick={testSupabaseDatabase}
              disabled={isTestingSupabase}
              style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                color: 'white',
                padding: '12px 24px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: isTestingSupabase ? 'not-allowed' : 'pointer',
                opacity: isTestingSupabase ? 0.6 : 1
              }}
            >
              {isTestingSupabase ? '🔄 Testing...' : '🧪 Test Supabase Connection'}
            </button>
            
            {supabaseTestResults && (
              <button
                className="btn btn-outline"
                onClick={testDatabase}
                style={{
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  color: '#93c5fd',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                🔍 Test DSIP Tables
              </button>
            )}
          </div>

          {supabaseTestResults && (
            <div style={{
              background: 'rgba(30, 41, 59, 0.6)',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              marginBottom: '24px'
            }}>
              <h3 style={{ color: '#ffffff', marginBottom: '16px', fontSize: '18px' }}>📊 Database Status</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div style={{
                  background: supabaseTestResults.connection.success ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  border: `1px solid ${supabaseTestResults.connection.success ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                  borderRadius: '8px',
                  padding: '16px'
                }}>
                  <div style={{ color: supabaseTestResults.connection.success ? '#22c55e' : '#ef4444', fontSize: '24px', fontWeight: 'bold' }}>
                    {supabaseTestResults.connection.success ? '✅' : '❌'}
                  </div>
                  <div style={{ color: supabaseTestResults.connection.success ? '#86efac' : '#fca5a5', fontSize: '12px' }}>
                    Connection Status
                  </div>
                </div>
                
                <div style={{
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: '8px',
                  padding: '16px'
                }}>
                  <div style={{ color: '#3b82f6', fontSize: '24px', fontWeight: 'bold' }}>
                    {supabaseTestResults.totalRecords.toLocaleString()}
                  </div>
                  <div style={{ color: '#93c5fd', fontSize: '12px' }}>
                    Total Records
                  </div>
                </div>
              </div>
              
              <div style={{ marginTop: '16px' }}>
                <h4 style={{ color: '#ffffff', marginBottom: '12px', fontSize: '14px' }}>📋 Tables Status:</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '8px' }}>
                  {Object.entries(supabaseTestResults.tables).map(([tableName, tableInfo]: [string, any]) => (
                    <div key={tableName} style={{
                      background: 'rgba(15, 23, 42, 0.4)',
                      borderRadius: '6px',
                      padding: '12px',
                      border: `1px solid ${tableInfo.exists ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
                    }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        color: '#ffffff',
                        fontSize: '13px',
                        fontWeight: '500'
                      }}>
                        <span>{tableName}</span>
                        <span style={{ color: tableInfo.exists ? '#22c55e' : '#ef4444' }}>
                          {tableInfo.exists ? '✅' : '❌'} {tableInfo.exists ? tableInfo.count : 'Missing'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Database Data Viewer Section */}
        {supabaseTestResults && (
          <div className="settings-section">
            <h2>📊 Database Data Viewer</h2>
            <p>Browse and search actual data from your Supabase tables.</p>
            
            <div style={{
              background: 'rgba(30, 41, 59, 0.6)',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              marginBottom: '24px'
            }}>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
                <select
                  value={selectedTable}
                  onChange={(e) => setSelectedTable(e.target.value)}
                  style={{
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(148, 163, 184, 0.3)',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    color: '#ffffff',
                    fontSize: '14px',
                    minWidth: '200px'
                  }}
                >
                  <option value="">Select a table...</option>
                  {Object.entries(supabaseTestResults.tables)
                    .filter(([_, tableInfo]: [string, any]) => tableInfo.exists)
                    .map(([tableName, tableInfo]: [string, any]) => (
                      <option key={tableName} value={tableName}>
                        {tableName} ({tableInfo.count} records)
                      </option>
                    ))}
                </select>
                
                <input
                  type="text"
                  placeholder="Search in data..."
                  value={dataSearchQuery}
                  onChange={(e) => setDataSearchQuery(e.target.value)}
                  style={{
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(148, 163, 184, 0.3)',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    color: '#ffffff',
                    fontSize: '14px',
                    minWidth: '200px'
                  }}
                />
                
                <button
                  onClick={() => loadSupabaseData(selectedTable, dataSearchQuery)}
                  disabled={!selectedTable || isLoadingData}
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 16px',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: isLoadingData ? 'not-allowed' : 'pointer',
                    opacity: isLoadingData ? 0.6 : 1
                  }}
                >
                  {isLoadingData ? '🔄 Loading...' : '🔍 Load Data'}
                </button>
              </div>
              
              {supabaseData.length > 0 && (
                <div style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: '8px',
                  padding: '16px',
                  maxHeight: '400px',
                  overflowY: 'auto'
                }}>
                  <h4 style={{ color: '#ffffff', marginBottom: '12px', fontSize: '14px' }}>
                    📋 Data from {selectedTable} ({supabaseData.length} records shown)
                  </h4>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      fontSize: '12px'
                    }}>
                      <thead>
                        <tr style={{ background: 'rgba(15, 23, 42, 0.8)' }}>
                          {Object.keys(supabaseData[0] || {}).slice(0, 8).map((key) => (
                            <th key={key} style={{
                              padding: '8px',
                              textAlign: 'left',
                              color: '#cbd5e1',
                              fontWeight: '600',
                              borderBottom: '1px solid rgba(148, 163, 184, 0.2)'
                            }}>
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {supabaseData.slice(0, 10).map((row, index) => (
                          <tr key={index} style={{
                            borderBottom: '1px solid rgba(148, 163, 184, 0.1)'
                          }}>
                            {Object.values(row).slice(0, 8).map((value, i) => (
                              <td key={i} style={{
                                padding: '8px',
                                color: '#e2e8f0',
                                maxWidth: '200px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}>
                                {typeof value === 'object' ? JSON.stringify(value) : String(value || '')}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {supabaseData.length > 10 && (
                    <p style={{ color: '#94a3b8', fontSize: '12px', marginTop: '8px' }}>
                      Showing first 10 records of {supabaseData.length} total
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

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
            {/* Scraper Status */}
            <div style={{
              background: 'rgba(30, 41, 59, 0.5)',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid rgba(148, 163, 184, 0.2)'
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 16px 0' }}>Scraper Status</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8', fontSize: '14px' }}>Current Status:</span>
                  <span style={{ 
                    color: scraperStatus === 'running' ? '#fbbf24' : scraperStatus === 'completed' ? '#10b981' : scraperStatus === 'failed' ? '#ef4444' : '#94a3b8', 
                    fontWeight: '600' 
                  }}>
                    {scraperStatus === 'running' ? '🔄 Running' : scraperStatus === 'completed' ? '✅ Completed' : scraperStatus === 'failed' ? '❌ Failed' : '⏸️ Idle'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8', fontSize: '14px' }}>Is Running:</span>
                  <span style={{ color: isScraperRunning ? '#10b981' : '#ef4444', fontWeight: '600' }}>
                    {isScraperRunning ? 'Yes' : 'No'}
                  </span>
                </div>
                {currentScrapingJob && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94a3b8', fontSize: '14px' }}>Current Job:</span>
                    <span style={{ color: '#ffffff', fontWeight: '600', fontSize: '12px' }}>
                      {currentScrapingJob.type || 'Unknown'}
                    </span>
                  </div>
                )}
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
