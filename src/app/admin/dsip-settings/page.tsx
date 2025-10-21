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
  
  // State for SBIR scraper
  const [isTriggeringSbirScraper, setIsTriggeringSbirScraper] = useState(false)
  const [sbirScraperResult, setSbirScraperResult] = useState<any>(null)
  const [scraperProgress, setScraperProgress] = useState(0)
  const [scraperCurrentStep, setScraperCurrentStep] = useState('')
  
  // State for real active scraper
  const [activeScraperJobId, setActiveScraperJobId] = useState<string | null>(null)
  const [activeScraperData, setActiveScraperData] = useState<any[]>([])
  const [activeScraperProgress, setActiveScraperProgress] = useState<any>(null)
  const [isScrapingActive, setIsScrapingActive] = useState(false)
  
  // State for historical scraper
  const [selectedMonthFrom, setSelectedMonthFrom] = useState<string>('')
  const [selectedYearFrom, setSelectedYearFrom] = useState<string>('')
  const [selectedMonthTo, setSelectedMonthTo] = useState<string>('')
  const [selectedYearTo, setSelectedYearTo] = useState<string>('')
  const [useToCurrent, setUseToCurrent] = useState<boolean>(false)
  const [isScrapingHistorical, setIsScrapingHistorical] = useState(false)
  const [historicalScraperResult, setHistoricalScraperResult] = useState<any>(null)
  const [historicalScraperProgress, setHistoricalScraperProgress] = useState<any>(null)
  
  // State for floating notifications
  const [notification, setNotification] = useState<{
    show: boolean
    message: string
    type: 'success' | 'error' | 'info' | 'warning'
    details?: any
  }>({
    show: false,
    message: '',
    type: 'info'
  })

  // Helper function to show notifications
  const showNotification = (message: string, type: 'success' | 'error' | 'info' | 'warning', details?: any) => {
    setNotification({ show: true, message, type, details })
    // Auto-hide after 15 seconds (or longer for notifications with lots of details)
    const timeout = details && Object.keys(details).length > 3 ? 20000 : 15000
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }))
    }, timeout)
  }
  
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
      // Add timeout to prevent hanging
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout
      
      const response = await fetch('/api/dsip/scraper', {
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (response.ok) {
        const data = await response.json()
        setIsScraperRunning(data.isRunning)
        setScraperStatus(data.status)
        setCurrentScrapingJob(data.currentJob)
      }
    } catch (error) {
      console.error('Error checking scraper status:', error)
      // Set defaults to allow page to load
      setIsScraperRunning(false)
      setScraperStatus('idle')
    }
  }

  const loadSbirStats = async () => {
    setIsLoadingStats(true)
    try {
      // Add timeout to prevent hanging
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
      
      const response = await fetch('/api/admin/sbir/stats', {
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (response.ok) {
        const data = await response.json()
        setSbirStats(data)
        setLastUpdate(data.lastUpdate || null)
      } else {
        console.warn('Failed to load SBIR statistics:', response.status)
        setMessage('Failed to load SBIR statistics')
      }
    } catch (error) {
      console.error('Failed to load SBIR stats:', error)
      setMessage('Failed to load SBIR statistics (timeout or network error)')
      // Set default stats to allow page to load
      setSbirStats({
        totalRecords: 0,
        openRecords: 0,
        recentlyUpdated: 0
      })
    } finally {
      setIsLoadingStats(false)
    }
  }

  const checkSbirScraperStatus = async () => {
    setIsLoadingScraper(true)
    try {
      // Just load the stats - the old scraper endpoint was removed
      await loadSbirStats()
      setSbirScraperStatus({ status: 'idle', message: 'Ready' })
    } catch (error) {
      console.error('Failed to check scraper status:', error)
      setSbirScraperStatus({ status: 'unknown' })
    } finally {
      setIsLoadingScraper(false)
    }
  }

  const triggerSbirScraper = async () => {
    console.log('[SBIR Scraper] Starting manual trigger...')
    setIsTriggeringSbirScraper(true)
    setSbirScraperResult(null)
    setScraperProgress(0)
    setScraperCurrentStep('Initializing scraper...')
    
    // Initialize logs array for displaying real-time progress
    const logs: string[] = ['Starting SBIR scraper...']
    setActiveScraperProgress({ phase: 'starting', processedTopics: 0, activeTopicsFound: 0, logs })
    
    showNotification(' Starting SBIR scraper...', 'info')
    
    try {
      const response = await fetch('/api/admin/sbir/trigger-scraper', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      setScraperProgress(100)
      setScraperCurrentStep(' Scraper completed!')
      
      const result = await response.json()
      console.log('[SBIR Scraper] Full Response:', JSON.stringify(result, null, 2))
      
      // Display the detailed logs from the scraper
      if (result.detailedLogs && result.detailedLogs.length > 0) {
        console.log('[SBIR Scraper] Received', result.detailedLogs.length, 'detailed log entries')
        setActiveScraperProgress({
          phase: 'completed',
          processedTopics: result.processedTopics || 0,
          activeTopicsFound: result.totalTopics || 0,
          logs: result.detailedLogs
        })
      }
      
      setSbirScraperResult(result)
      
      if (response.ok) {
        const details = result.result || {};
        const message = `
 Scraper Results:
• Total Topics Found: ${details.totalTopics || 0}
• Processed: ${details.processedTopics || 0}  
• New Records: ${details.newRecords || 0}
• Updated Records: ${details.updatedRecords || 0}
• Unchanged: ${details.skippedRecords || 0}

For detailed logs (shows each topic name, extracted fields, and step-by-step progress), check Vercel Function Logs.
        `.trim();
        
        showNotification(
          details.totalTopics > 0 
            ? ` SBIR scraper completed! Found ${details.totalTopics} active topics.`
            : ` SBIR scraper completed but found 0 active topics.`,
          details.totalTopics > 0 ? 'success' : 'warning',
          { 
            message,
            duration: 15000
          }
        )
        // Refresh stats after scraping (WITHOUT page reload)
        setTimeout(() => {
          loadSbirStats()
        }, 3000)
      } else {
        showNotification(` Failed to trigger SBIR scraper: ${result.error}`, 'error')
      }
    } catch (error) {
      console.error('[SBIR Scraper] Error:', error)
      showNotification(' Failed to trigger SBIR scraper', 'error')
    } finally {
      setIsTriggeringSbirScraper(false)
    }
  }
  
  const triggerHistoricalScraper = async () => {
    if (!selectedMonthFrom || !selectedYearFrom) {
      showNotification('Please select a start date', 'warning')
      return
    }
    
    if (!useToCurrent && (!selectedMonthTo || !selectedYearTo)) {
      showNotification('Please select an end date or check "To Current"', 'warning')
      return
    }
    
    // Get current month and year if "To Current" is checked
    const currentDate = new Date();
    const currentMonthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const currentMonth = currentMonthNames[currentDate.getMonth()];
    const currentYear = currentDate.getFullYear().toString();
    
    const monthTo = useToCurrent ? currentMonth : selectedMonthTo;
    const yearTo = useToCurrent ? currentYear : selectedYearTo;
    
    const dateRange = `${selectedMonthFrom} ${selectedYearFrom} to ${useToCurrent ? 'Current' : `${monthTo} ${yearTo}`}`;
    console.log('[Historical Scraper] Starting scrape for', dateRange)
    setIsScrapingHistorical(true)
    setHistoricalScraperResult(null)
    setScraperProgress(0)
    setScraperCurrentStep('Initializing historical scraper...')
    
    const logs: string[] = [`Starting historical scrape for ${dateRange}...`]
    setHistoricalScraperProgress({ phase: 'starting', processedTopics: 0, totalTopics: 0, logs })
    
    showNotification(` Scraping ${dateRange} opportunities...`, 'info')
    
    try {
      const response = await fetch('/api/admin/sbir/scraper-historical', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          monthFrom: selectedMonthFrom,
          yearFrom: selectedYearFrom,
          monthTo: monthTo,
          yearTo: yearTo
        })
      })
      
      setScraperProgress(100)
      setScraperCurrentStep(' Historical scrape completed!')
      
      const result = await response.json()
      console.log('[Historical Scraper] Full Response:', JSON.stringify(result, null, 2))
      
      // Display the detailed logs from the scraper
      if (result.detailedLogs && result.detailedLogs.length > 0) {
        console.log('[Historical Scraper] Received', result.detailedLogs.length, 'detailed log entries')
        setHistoricalScraperProgress({
          phase: 'completed',
          processedTopics: result.processedTopics || 0,
          totalTopics: result.totalTopics || 0,
          logs: result.detailedLogs
        })
      }
      
      setHistoricalScraperResult(result)
      
      if (response.ok) {
        const details = result.result || result;
        const message = `
 Historical Scrape Results (${dateRange}):
• Total Topics Found: ${details.totalTopics || 0}
• Processed: ${details.processedTopics || 0}
• New Records: ${details.newRecords || 0}
• Updated Records: ${details.updatedRecords || 0}
• Unchanged: ${details.skippedRecords || 0}

For detailed logs, check Vercel Function Logs.
        `
        showNotification(message, 'success', {
          totalTopics: details.totalTopics || 0,
          newRecords: details.newRecords || 0,
          updatedRecords: details.updatedRecords || 0
        })
        
        // Auto-refresh stats after scrape completes
        console.log('[Historical Scraper] Auto-refreshing statistics...')
        await loadSbirStats()
        await checkSbirScraperStatus()
      } else {
        showNotification(` Historical scrape failed: ${result.message || 'Unknown error'}`, 'error')
      }
    } catch (error) {
      console.error('[Historical Scraper] Error:', error)
      showNotification(` Historical scrape error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error')
    } finally {
      setIsScrapingHistorical(false)
    }
  }

  // Removed old startSbirScraper function - use triggerSbirScraper instead

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
        showNotification(` Scraper started successfully! ${data.message}`, 'success')
        
        // Start monitoring the scraper
        monitorScraper()
      } else {
        const errorData = await response.json()
        showNotification(` Failed to start scraper: ${errorData.error}`, 'error')
      }
    } catch (error) {
      showNotification(' Error starting scraper', 'error')
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
        showNotification(' Scraper paused successfully', 'warning')
      } else {
        showNotification(' Failed to pause scraper', 'error')
      }
    } catch (error) {
      showNotification(' Error pausing scraper', 'error')
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
        showNotification(' Scraper resumed successfully', 'success')
        
        // Start monitoring the scraper again
        monitorScraper()
      } else {
        const errorData = await response.json()
        showNotification(` Failed to resume scraper: ${errorData.error}`, 'error')
      }
    } catch (error) {
      showNotification(' Error resuming scraper', 'error')
    }
  }

  const checkActiveOpportunities = async () => {
    try {
      setIsCheckingActive(true)
      showNotification(' Checking for active opportunities...', 'info')
      
      // Query the database for active opportunities
      const response = await fetch('/api/dsip/active-opportunities')
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setActiveOpportunitiesCount(data.count)
          const notificationType = data.count === 0 ? 'warning' : 'success'
          const notificationMessage = data.count === 0 
            ? ' Database is empty - No opportunities found' 
            : ` Found ${data.count} active opportunities`
          
          showNotification(
            notificationMessage,
            notificationType,
            {
              totalCount: data.totalCount,
              activeCount: data.count,
              breakdown: data.breakdown,
              sampleOpportunities: data.sampleOpportunities,
              timestamp: data.timestamp,
              hint: data.count === 0 ? 'Click "Quick Check" or "Full Scrape" below to populate the database with DSIP opportunities' : undefined
            }
          )
        } else {
          showNotification(
            ` Failed to check opportunities: ${data.error}`,
            'error',
            data.hint ? { hint: data.hint, details: data.details } : undefined
          )
        }
      } else {
        const errorText = await response.text()
        console.error('Check opportunities error response:', errorText)
        showNotification(` Failed to check opportunities: ${response.status}`, 'error', { responseText: errorText })
      }
    } catch (error) {
      console.error('Check active opportunities error:', error)
      showNotification(` Error checking active opportunities: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error')
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
              showNotification(
                ' Scraping completed successfully!',
                'success',
                {
                  recordsProcessed: data.currentJob?.recordsProcessed,
                  newRecords: data.currentJob?.newRecordsFound,
                  updatedRecords: data.currentJob?.updatedRecords,
                  duration: data.currentJob?.duration,
                  completedAt: data.currentJob?.completedAt
                }
              )
            } else {
              showNotification(
                ` Scraping failed: ${data.currentJob?.error || 'Unknown error'}`,
                'error',
                {
                  error: data.currentJob?.error,
                  recordsProcessed: data.currentJob?.recordsProcessed,
                  startedAt: data.currentJob?.startedAt
                }
              )
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

  // Real active scraper function
  const startRealActiveScraper = async () => {
    try {
      console.log('[Active Scraper] Starting synchronous scraper...')
      setIsScrapingActive(true)
      setActiveScraperProgress({
        phase: 'starting',
        processedTopics: 0,
        activeTopicsFound: 0,
        logs: [' Starting DSIP scraper for active opportunities...', '⏳ This may take 30-60 seconds...']
      })
      showNotification(' Starting DSIP scraper - this will take 30-60 seconds...', 'info')
      
      const response = await fetch('/api/dsip/scrape-active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      console.log('[Active Scraper] Response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('[Active Scraper] Completed:', data)
        
        setIsScrapingActive(false)
        setActiveScraperData(data.data || [])
        setActiveScraperProgress(data.progress || {
          phase: 'completed',
          processedTopics: data.totalRecords,
          activeTopicsFound: data.totalRecords,
          logs: data.logs || []
        })
        
        showNotification(
          ` Scraping completed! Found ${data.totalRecords} active opportunities`,
          'success',
          {
            totalRecords: data.totalRecords,
            message: 'Data is ready to import to Supabase'
          }
        )
        
        // Auto-refresh stats after scraper completes
        console.log('[Active Scraper] Auto-refreshing statistics...')
        loadSbirStats()
        checkSbirScraperStatus()
      } else {
        const errorText = await response.text()
        console.error('[Active Scraper] Failed:', response.status, errorText)
        showNotification(` Failed to run scraper: ${response.status}`, 'error')
        setIsScrapingActive(false)
      }
    } catch (error) {
      console.error('[Active Scraper] Error:', error)
      showNotification(` Error running scraper: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error')
      setIsScrapingActive(false)
    }
  }
  
  const testScraperSystem = async () => {
    try {
      showNotification(' Testing scraper system...', 'info')
      
      let allTestsPassed = true
      const results: any = {}
      
      // Test 1: Basic system status
      const statusResponse = await fetch('/api/dsip/test-scraper')
      if (statusResponse.ok) {
        const statusData = await statusResponse.json()
        console.log('System Status Test:', statusData)
        results.systemStatus = statusData
        if (!statusData.success) allTestsPassed = false
      } else {
        allTestsPassed = false
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
        results.databaseTest = dbData
        if (!dbData.success) allTestsPassed = false
      } else {
        allTestsPassed = false
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
        results.connectionTest = connData
        if (!connData.success) allTestsPassed = false
      } else {
        allTestsPassed = false
      }
      
      // Show final result
      if (allTestsPassed) {
        showNotification(
          ' All scraper system tests passed!',
          'success',
          {
            systemStatus: results.systemStatus?.success ? ' Passed' : ' Failed',
            databaseTest: results.databaseTest?.success ? ' Passed' : ' Failed',
            connectionTest: results.connectionTest?.success ? ' Passed' : ' Failed',
            message: 'Check browser console for detailed results'
          }
        )
      } else {
        showNotification(
          ' Some scraper system tests failed',
          'warning',
          {
            systemStatus: results.systemStatus?.success ? ' Passed' : ' Failed',
            databaseTest: results.databaseTest?.success ? ' Passed' : ' Failed',
            connectionTest: results.connectionTest?.success ? ' Passed' : ' Failed',
            message: 'Check browser console for detailed error information'
          }
        )
      }
      
    } catch (error) {
      showNotification(` Test failed with error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error')
      console.error('Test error:', error)
    }
  }

  const testSupabaseDatabase = async () => {
    try {
      setIsTestingSupabase(true)
      showNotification(' Testing Supabase database connection...', 'info')
      
      const response = await fetch('/api/admin/supabase-test')
      if (response.ok) {
        const data = await response.json()
        console.log('Supabase Test Results:', data)
        
        if (data.success) {
          setSupabaseTestResults(data.results)
          
          showNotification(
            ' Supabase Connection Successful',
            'success',
            {
              connection: data.results.connection.success,
              totalRecords: data.results.totalRecords,
              tables: data.results.tables
            }
          )
        } else {
          showNotification(` Supabase test failed: ${data.error}`, 'error')
        }
      } else {
        showNotification(' Failed to test Supabase database', 'error')
      }
    } catch (error) {
      showNotification(` Error testing Supabase database: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error')
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
          setMessage(' Failed to load data: ' + data.error)
        }
      } else {
        setMessage(' Failed to load data')
      }
    } catch (error) {
      setMessage(' Error loading data')
      console.error('Data loading error:', error)
    } finally {
      setIsLoadingData(false)
    }
  }
  
  const testDatabase = async () => {
    try {
      showNotification(' Testing database connection and tables...', 'info')
      
      const response = await fetch('/api/dsip/test-database')
      if (response.ok) {
        const data = await response.json()
        console.log('Database Test Results:', data)
        
        if (data.success) {
          const status = data.databaseStatus
          showNotification(
            ' Database Test Complete',
            'success',
            {
              opportunitiesTable: {
                exists: status.opportunitiesTable.exists,
                count: status.opportunitiesTable.count
              },
              scrapingJobsTable: {
                exists: status.scrapingJobsTable.exists,
                count: status.scrapingJobsTable.count
              },
              usersTable: {
                exists: status.usersTable.exists,
                count: status.usersTable.count
              },
              canInsert: status.canInsert,
              insertError: status.insertError
            }
          )
        } else {
          showNotification(' Database test failed', 'error')
        }
      } else {
        showNotification(' Failed to test database', 'error')
      }
    } catch (error) {
      showNotification(` Error testing database: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error')
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
          <h1>Database & Scraper Management</h1>
          <p>Manage database connections, automated scrapers, and monitor system performance.</p>
        </div>

        {message && (
          <div className={`message ${message.includes('successfully') || message.includes('') || message.includes('Connected') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}


        {/* Supabase Database Test Section */}
        <div className="settings-section" style={{ display: 'none' }}>
          <h2>Supabase Database Test</h2>
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
              {isTestingSupabase ? 'Testing...' : 'Test Supabase Connection'}
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
                Test DSIP Tables
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
              <h3 style={{ color: '#ffffff', marginBottom: '16px', fontSize: '18px' }}> Database Status</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div style={{
                  background: supabaseTestResults.connection.success ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  border: `1px solid ${supabaseTestResults.connection.success ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                  borderRadius: '8px',
                  padding: '16px'
                }}>
                  <div style={{ color: supabaseTestResults.connection.success ? '#22c55e' : '#ef4444', fontSize: '24px', fontWeight: 'bold' }}>
                    {supabaseTestResults.connection.success ? '' : ''}
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
                <h4 style={{ color: '#ffffff', marginBottom: '12px', fontSize: '14px' }}> Tables Status:</h4>
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
                          {tableInfo.exists ? '' : ''} {tableInfo.exists ? tableInfo.count : 'Missing'}
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
            <h2> Database Data Viewer</h2>
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
                  {isLoadingData ? ' Loading...' : ' Load Data'}
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
                     Data from {selectedTable} ({supabaseData.length} records shown)
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

        {/* DSIP Opportunities Scraper Section */}
        <div className="settings-section" style={{ position: 'relative', display: 'none' }}>
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
               Active Opportunities Monitor
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
                {isCheckingActive ? ' Checking...' : ' Check Active Opportunities'}
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
                   Found {activeOpportunitiesCount} active opportunities
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
                    {scraperStatus === 'running' ? ' Running' : scraperStatus === 'completed' ? ' Completed' : scraperStatus === 'failed' ? ' Failed' : ' Idle'}
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
                       Full Refresh (8-12 hours)
                    </button>
                    <button
                      type="button"
                      onClick={startRealActiveScraper}
                      className="btn btn-primary"
                      disabled={isScrapingActive}
                      style={{
                        background: isScrapingActive 
                          ? 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)'
                          : 'linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%)',
                        width: '100%',
                        cursor: isScrapingActive ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {isScrapingActive ? ' Scraping Active Opportunities...' : '⚡ Scrape Active Opportunities'}
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
                         Resume Scraper
                      </button>
                    )}
                  </>
                )}
                <button
                  onClick={testScraperSystem}
                  className="btn btn-outline"
                  style={{ width: '100%' }}
                >
                   Test Scraper System
                </button>
                <button
                  onClick={testDatabase}
                  className="btn btn-outline"
                  style={{ width: '100%' }}
                >
                   Test Database
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
                     Estimated completion: {new Date(currentScrapingJob.estimatedCompletion).toLocaleString()}
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
        <div className="settings-section" style={{ display: 'none' }}>
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

        {/* SBIR Database Management Section */}
        <div className="settings-section">
          <h2>SBIR Database Management</h2>
          <p>Manage automated SBIR data scraping and database updates. The scraper runs once daily at noon to fetch active/open/pre-release opportunities.</p>
          
          <div className="sbir-management">
            {/* SBIR Statistics */}
            {sbirStats && (
              <div className="stats-grid" style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: '16px', 
                marginBottom: '24px' 
              }}>
                <div className="stat-card" style={{
                  background: 'rgba(15, 23, 42, 0.6)',
                  borderRadius: '8px',
                  padding: '16px',
                  border: '1px solid rgba(148, 163, 184, 0.2)'
                }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '600', margin: '0 0 8px 0', color: '#e2e8f0' }}>
                    Total Records
                  </h3>
                  <p style={{ fontSize: '24px', fontWeight: '700', margin: '0', color: '#3b82f6' }}>
                    {sbirStats.totalRecords?.toLocaleString() || '0'}
                  </p>
                </div>
                
                <div className="stat-card" style={{
                  background: 'rgba(15, 23, 42, 0.6)',
                  borderRadius: '8px',
                  padding: '16px',
                  border: '1px solid rgba(148, 163, 184, 0.2)'
                }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '600', margin: '0 0 8px 0', color: '#e2e8f0' }}>
                    Active Opportunities
                  </h3>
                  <p style={{ fontSize: '24px', fontWeight: '700', margin: '0', color: '#10b981' }}>
                    {sbirStats.activeOpportunities?.toLocaleString() || '0'}
                  </p>
                </div>
                
                <div className="stat-card" style={{
                  background: 'rgba(15, 23, 42, 0.6)',
                  borderRadius: '8px',
                  padding: '16px',
                  border: '1px solid rgba(148, 163, 184, 0.2)'
                }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '600', margin: '0 0 8px 0', color: '#e2e8f0' }}>
                    Last Updated
                  </h3>
                  <p style={{ fontSize: '14px', margin: '0', color: '#94a3b8' }}>
                    {lastUpdate ? new Date(lastUpdate).toLocaleString() : 'Never'}
                  </p>
                </div>
              </div>
            )}

            {/* Browse Database Button */}
            <div style={{ marginBottom: '24px' }}>
              <button
                onClick={() => router.push('/admin/sbir-database')}
                style={{
                  width: '100%',
                  padding: '16px 24px',
                  background: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#ffffff',
                  fontSize: '16px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                Browse SBIR Database
                <span style={{ 
                  fontSize: '12px', 
                  opacity: 0.9,
                  background: 'rgba(255, 255, 255, 0.2)',
                  padding: '4px 8px',
                  borderRadius: '4px'
                }}>
                  {sbirStats?.totalRecords?.toLocaleString() || '0'} records
                </span>
              </button>
            </div>

            {/* Scraper Controls */}
            <div className="scraper-controls" style={{
              background: 'rgba(15, 23, 42, 0.6)',
              borderRadius: '12px',
              padding: '24px',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              marginBottom: '24px'
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 16px 0', color: '#ffffff' }}>
                Automated Scraper Controls
              </h3>
              
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    triggerSbirScraper();
                  }}
                  disabled={isTriggeringSbirScraper}
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    padding: '12px 24px',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: isTriggeringSbirScraper ? 'not-allowed' : 'pointer',
                    opacity: isTriggeringSbirScraper ? 0.6 : 1
                  }}
                >
                  {isTriggeringSbirScraper ? ' Running Scraper...' : ' Trigger Manual Scrape'}
                </button>
                
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={loadSbirStats}
                  disabled={isLoadingStats}
                  style={{
                    color: '#3b82f6',
                    border: '1px solid #3b82f6',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: isLoadingStats ? 'not-allowed' : 'pointer',
                    opacity: isLoadingStats ? 0.6 : 1
                  }}
                >
                  {isLoadingStats ? 'Loading...' : 'Refresh Statistics'}
                </button>
              </div>

              {/* Scraper Status */}
              {sbirScraperStatus && (
                <div style={{
                  background: 'rgba(0, 0, 0, 0.2)',
                  borderRadius: '8px',
                  padding: '16px',
                  marginBottom: '16px'
                }}>
                  <h4 style={{ color: '#ffffff', margin: '0 0 8px 0', fontSize: '14px' }}>Scraper Status:</h4>
                  <p style={{ color: '#cbd5e1', margin: '4px 0', fontSize: '14px' }}>
                    Status: <span style={{ color: sbirScraperStatus.isRunning ? '#10b981' : '#94a3b8' }}>
                      {sbirScraperStatus.isRunning ? 'Running' : 'Idle'}
                    </span>
                  </p>
                  {sbirScraperStatus.lastScraped && (
                    <p style={{ color: '#cbd5e1', margin: '4px 0', fontSize: '14px' }}>
                      Last Scraped: {new Date(sbirScraperStatus.lastScraped).toLocaleString()}
                    </p>
                  )}
                  {sbirScraperStatus.totalRecords && (
                    <p style={{ color: '#cbd5e1', margin: '4px 0', fontSize: '14px' }}>
                      Total Records: {sbirScraperStatus.totalRecords.toLocaleString()}
                    </p>
                  )}
                </div>
              )}

              {/* Scraper Progress Display */}
              {isTriggeringSbirScraper && (
                <div style={{
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.2) 100%)',
                  border: '2px solid #10b981',
                  borderRadius: '16px',
                  padding: '28px',
                  marginBottom: '20px',
                  boxShadow: '0 8px 32px rgba(16, 185, 129, 0.25)',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {/* Animated background shimmer */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: '-100%',
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)',
                    animation: 'shimmer 2s infinite'
                  }} />
                  
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <h4 style={{ 
                        color: '#10b981', 
                        margin: 0, 
                        fontSize: '18px',
                        fontWeight: '700',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <span style={{ animation: 'spin 2s linear infinite', display: 'inline-block' }}></span>
                        SBIR Scraper Running
                      </h4>
                      <div style={{
                        background: 'rgba(16, 185, 129, 0.3)',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        fontWeight: '700',
                        fontSize: '20px',
                        color: '#10b981',
                        minWidth: '80px',
                        textAlign: 'center',
                        boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                      }}>
                        {scraperProgress}%
                      </div>
                    </div>

                    {/* Current Step */}
                    <p style={{ 
                      color: '#d1fae5', 
                      margin: '0 0 16px 0', 
                      fontSize: '15px',
                      fontWeight: '500'
                    }}>
                      {scraperCurrentStep}
                    </p>

                    {/* Progress Bar Container */}
                    <div style={{
                      width: '100%',
                      height: '24px',
                      background: 'rgba(15, 23, 42, 0.6)',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      border: '2px solid rgba(16, 185, 129, 0.3)',
                      position: 'relative'
                    }}>
                      {/* Animated Progress Bar */}
                      <div style={{
                        width: `${scraperProgress}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #10b981 0%, #34d399 50%, #10b981 100%)',
                        backgroundSize: '200% 100%',
                        animation: 'gradientMove 2s ease infinite',
                        transition: 'width 0.5s ease-out',
                        position: 'relative',
                        boxShadow: '0 0 20px rgba(16, 185, 129, 0.6)'
                      }}>
                        {/* Shine effect */}
                        <div style={{
                          position: 'absolute',
                          top: 0,
                          left: '-100%',
                          width: '100%',
                          height: '100%',
                          background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
                          animation: 'shine 1.5s infinite'
                        }} />
                      </div>
                      
                      {/* Progress milestones */}
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '0 2px'
                      }}>
                        {[25, 50, 75].map(milestone => (
                          <div key={milestone} style={{
                            position: 'absolute',
                            left: `${milestone}%`,
                            width: '2px',
                            height: '100%',
                            background: 'rgba(255, 255, 255, 0.2)'
                          }} />
                        ))}
                      </div>
                    </div>

                    {/* Stage Indicators */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginTop: '12px',
                      fontSize: '11px',
                      color: '#94a3b8'
                    }}>
                      <span style={{ opacity: scraperProgress >= 0 ? 1 : 0.4 }}> Init</span>
                      <span style={{ opacity: scraperProgress >= 25 ? 1 : 0.4 }}>📡 Fetch</span>
                      <span style={{ opacity: scraperProgress >= 50 ? 1 : 0.4 }}> Process</span>
                      <span style={{ opacity: scraperProgress >= 75 ? 1 : 0.4 }}> Map</span>
                      <span style={{ opacity: scraperProgress >= 90 ? 1 : 0.4 }}> Save</span>
                    </div>

                    <p style={{ 
                      color: '#cbd5e1', 
                      margin: '16px 0 0 0', 
                      fontSize: '13px',
                      textAlign: 'center',
                      fontStyle: 'italic'
                    }}>
                      Fetching active SBIR opportunities. This may take several minutes...
                    </p>
                  </div>
                </div>
              )}

              {/* Manual Trigger Results */}
              {!isTriggeringSbirScraper && sbirScraperResult && (
                <div style={{
                  background: sbirScraperResult.success ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  border: `1px solid ${sbirScraperResult.success ? '#10b981' : '#ef4444'}`,
                  borderRadius: '8px',
                  padding: '16px',
                  marginBottom: '16px'
                }}>
                  <h4 style={{ 
                    color: sbirScraperResult.success ? '#10b981' : '#ef4444', 
                    margin: '0 0 8px 0', 
                    fontSize: '14px' 
                  }}>
                    {sbirScraperResult.success ? 'Scraper Completed Successfully' : 'Scraper Failed'}
                  </h4>
                  {sbirScraperResult.result && (
                    <div style={{ color: '#cbd5e1', fontSize: '14px' }}>
                      <p style={{ margin: '4px 0' }}>
                        Total Topics: {sbirScraperResult.result.totalTopics || 0}
                      </p>
                      <p style={{ margin: '4px 0' }}>
                        Processed: {sbirScraperResult.result.processedTopics || 0}
                      </p>
                      <p style={{ margin: '4px 0' }}>
                         New Records: {sbirScraperResult.result.newRecords || 0}
                      </p>
                      <p style={{ margin: '4px 0' }}>
                         Updated Records: {sbirScraperResult.result.updatedRecords || 0}
                      </p>
                      <p style={{ margin: '4px 0' }}>
                         Unchanged: {sbirScraperResult.result.skippedRecords || 0}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div style={{ 
                background: 'rgba(59, 130, 246, 0.1)', 
                border: '1px solid rgba(59, 130, 246, 0.3)', 
                borderRadius: '8px', 
                padding: '16px' 
              }}>
                <h4 style={{ color: '#3b82f6', margin: '0 0 8px 0', fontSize: '14px' }}>
                  Automated Schedule
                </h4>
                <p style={{ color: '#cbd5e1', margin: '4px 0', fontSize: '14px' }}>
                  The SBIR scraper runs automatically once daily at 12:00 PM (noon) EST.
                </p>
                <p style={{ color: '#cbd5e1', margin: '4px 0', fontSize: '14px' }}>
                  It fetches only active, open, and pre-release opportunities to keep the database current.
                </p>
              </div>
            </div>

            {/* Historical Scraper Controls */}
            <div className="scraper-controls" style={{
              background: 'rgba(15, 23, 42, 0.6)',
              borderRadius: '12px',
              padding: '24px',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              marginTop: '24px'
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 8px 0', color: '#ffffff' }}>
                Historical Data Scraper
              </h3>
              <p style={{ color: '#94a3b8', fontSize: '14px', margin: '0 0 16px 0' }}>
                Scrape and backfill historical SBIR/STTR opportunities from any month/year. Pulls all the same detailed data as the active scraper.
              </p>
              
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: '16px' }}>
                {/* FROM date */}
                <div>
                  <label style={{ display: 'block', color: '#cbd5e1', fontSize: '12px', marginBottom: '6px' }}>
                    From Month
                  </label>
                  <select
                    value={selectedMonthFrom}
                    onChange={(e) => setSelectedMonthFrom(e.target.value)}
                    disabled={isScrapingHistorical}
                    style={{
                      minWidth: '140px',
                      padding: '10px 12px',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(148, 163, 184, 0.3)',
                      borderRadius: '6px',
                      color: '#ffffff',
                      fontSize: '14px',
                      cursor: isScrapingHistorical ? 'not-allowed' : 'pointer',
                      opacity: isScrapingHistorical ? 0.6 : 1
                    }}
                  >
                    <option value="">Month</option>
                    <option value="January">January</option>
                    <option value="February">February</option>
                    <option value="March">March</option>
                    <option value="April">April</option>
                    <option value="May">May</option>
                    <option value="June">June</option>
                    <option value="July">July</option>
                    <option value="August">August</option>
                    <option value="September">September</option>
                    <option value="October">October</option>
                    <option value="November">November</option>
                    <option value="December">December</option>
                  </select>
                </div>
                
                <div>
                  <label style={{ display: 'block', color: '#cbd5e1', fontSize: '12px', marginBottom: '6px' }}>
                    From Year
                  </label>
                  <select
                    value={selectedYearFrom}
                    onChange={(e) => setSelectedYearFrom(e.target.value)}
                    disabled={isScrapingHistorical}
                    style={{
                      minWidth: '100px',
                      padding: '10px 12px',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(148, 163, 184, 0.3)',
                      borderRadius: '6px',
                      color: '#ffffff',
                      fontSize: '14px',
                      cursor: isScrapingHistorical ? 'not-allowed' : 'pointer',
                      opacity: isScrapingHistorical ? 0.6 : 1
                    }}
                  >
                    <option value="">Year</option>
                    {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                
                <div style={{ padding: '0 8px', marginBottom: '10px', color: '#94a3b8', fontSize: '20px', fontWeight: 'bold' }}>
                  →
                </div>
                
                {/* TO date */}
                <div>
                  <label style={{ display: 'block', color: '#cbd5e1', fontSize: '12px', marginBottom: '6px' }}>
                    To Month
                  </label>
                  <select
                    value={selectedMonthTo}
                    onChange={(e) => setSelectedMonthTo(e.target.value)}
                    disabled={isScrapingHistorical || useToCurrent}
                    style={{
                      minWidth: '140px',
                      padding: '10px 12px',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(148, 163, 184, 0.3)',
                      borderRadius: '6px',
                      color: '#ffffff',
                      fontSize: '14px',
                      cursor: isScrapingHistorical || useToCurrent ? 'not-allowed' : 'pointer',
                      opacity: isScrapingHistorical || useToCurrent ? 0.6 : 1
                    }}
                  >
                    <option value="">Month</option>
                    <option value="January">January</option>
                    <option value="February">February</option>
                    <option value="March">March</option>
                    <option value="April">April</option>
                    <option value="May">May</option>
                    <option value="June">June</option>
                    <option value="July">July</option>
                    <option value="August">August</option>
                    <option value="September">September</option>
                    <option value="October">October</option>
                    <option value="November">November</option>
                    <option value="December">December</option>
                  </select>
                </div>
                
                <div>
                  <label style={{ display: 'block', color: '#cbd5e1', fontSize: '12px', marginBottom: '6px' }}>
                    To Year
                  </label>
                  <select
                    value={selectedYearTo}
                    onChange={(e) => setSelectedYearTo(e.target.value)}
                    disabled={isScrapingHistorical || useToCurrent}
                    style={{
                      minWidth: '100px',
                      padding: '10px 12px',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(148, 163, 184, 0.3)',
                      borderRadius: '6px',
                      color: '#ffffff',
                      fontSize: '14px',
                      cursor: isScrapingHistorical || useToCurrent ? 'not-allowed' : 'pointer',
                      opacity: isScrapingHistorical || useToCurrent ? 0.6 : 1
                    }}
                  >
                    <option value="">Year</option>
                    {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                
                {/* To Current Checkbox */}
                <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '10px' }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: '#cbd5e1',
                    fontSize: '14px',
                    cursor: isScrapingHistorical ? 'not-allowed' : 'pointer',
                    opacity: isScrapingHistorical ? 0.6 : 1,
                    userSelect: 'none'
                  }}>
                    <input
                      type="checkbox"
                      checked={useToCurrent}
                      onChange={(e) => {
                        setUseToCurrent(e.target.checked);
                        if (e.target.checked) {
                          // Clear manual selections when "To Current" is checked
                          setSelectedMonthTo('');
                          setSelectedYearTo('');
                        }
                      }}
                      disabled={isScrapingHistorical}
                      style={{
                        width: '18px',
                        height: '18px',
                        cursor: isScrapingHistorical ? 'not-allowed' : 'pointer',
                        accentColor: '#8b5cf6'
                      }}
                    />
                    <span style={{ fontWeight: '500' }}>To Current</span>
                  </label>
                </div>
                
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    triggerHistoricalScraper();
                  }}
                  disabled={isScrapingHistorical || !selectedMonthFrom || !selectedYearFrom || (!useToCurrent && (!selectedMonthTo || !selectedYearTo))}
                  style={{
                    background: isScrapingHistorical || !selectedMonthFrom || !selectedYearFrom || (!useToCurrent && (!selectedMonthTo || !selectedYearTo))
                      ? 'rgba(148, 163, 184, 0.3)'
                      : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                    color: 'white',
                    padding: '12px 24px',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: isScrapingHistorical || !selectedMonthFrom || !selectedYearFrom || (!useToCurrent && (!selectedMonthTo || !selectedYearTo)) ? 'not-allowed' : 'pointer',
                    opacity: isScrapingHistorical || !selectedMonthFrom || !selectedYearFrom || (!useToCurrent && (!selectedMonthTo || !selectedYearTo)) ? 0.6 : 1
                  }}
                >
                  {isScrapingHistorical ? ' Scraping Historical Data...' : ' Scrape Historical Data'}
                </button>
              </div>

              {/* Historical Scraper Live Progress */}
              {isScrapingHistorical && historicalScraperProgress && (
                <div style={{
                  background: 'rgba(139, 92, 246, 0.1)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  borderRadius: '8px',
                  padding: '20px',
                  marginTop: '16px'
                }}>
                  <h3 style={{
                    color: '#8b5cf6',
                    fontSize: '16px',
                    fontWeight: '600',
                    margin: '0 0 16px 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span>Scraping Historical Data...</span>
                    <span style={{
                      display: 'inline-block',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#8b5cf6',
                      animation: 'pulse 2s infinite'
                    }}></span>
                  </h3>
                  
                  {historicalScraperProgress.totalTopics > 0 && (
                    <>
                      <div style={{
                        width: '100%',
                        height: '16px',
                        background: 'rgba(148, 163, 184, 0.2)',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        marginBottom: '16px'
                      }}>
                        <div style={{
                          width: `${historicalScraperProgress.processedTopics && historicalScraperProgress.totalTopics 
                            ? (historicalScraperProgress.processedTopics / historicalScraperProgress.totalTopics * 100) 
                            : 10}%`,
                          height: '100%',
                          background: 'linear-gradient(90deg, #8b5cf6 0%, #7c3aed 100%)',
                          transition: 'width 0.5s ease',
                          animation: 'pulse 2s infinite'
                        }}></div>
                      </div>

                      <div style={{ color: '#cbd5e1', fontSize: '16px', lineHeight: '1.8' }}>
                        <p style={{ marginBottom: '12px' }}>
                          <strong style={{ color: '#8b5cf6' }}>Phase:</strong> {historicalScraperProgress.phase || 'Starting...'}
                        </p>
                        <p style={{ marginBottom: '12px' }}>
                          <strong style={{ color: '#8b5cf6' }}>Progress:</strong> {historicalScraperProgress.processedTopics || 0} / {historicalScraperProgress.totalTopics} topics
                        </p>
                      </div>
                    </>
                  )}
                  
                  {historicalScraperProgress.logs && historicalScraperProgress.logs.length > 0 && (
                    <div style={{
                      marginTop: '20px',
                      padding: '16px',
                      background: 'rgba(0, 0, 0, 0.4)',
                      border: '1px solid rgba(139, 92, 246, 0.3)',
                      borderRadius: '6px',
                      maxHeight: '400px',
                      overflowY: 'auto'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '12px',
                        paddingBottom: '8px',
                        borderBottom: '1px solid rgba(139, 92, 246, 0.3)'
                      }}>
                        <p style={{ color: '#8b5cf6', fontSize: '13px', fontWeight: '700', margin: 0 }}>
                          Detailed Progress Log ({historicalScraperProgress.logs.length} entries)
                        </p>
                        <span style={{ color: '#10b981', fontSize: '11px', fontWeight: '600' }}>
                          LIVE
                        </span>
                      </div>
                      {historicalScraperProgress.logs.slice(-50).reverse().map((log: string, idx: number) => {
                        const cleanLog = log.split(': ').slice(1).join(': ') || log;
                        const isProgress = cleanLog.includes('[') && cleanLog.includes('%]');
                        const isSuccess = cleanLog.includes('✓');
                        const isWarning = cleanLog.includes('⚠');

                        return (
                          <div
                            key={idx}
                            style={{
                              padding: '6px 10px',
                              marginBottom: '4px',
                              background: isProgress ? 'rgba(139, 92, 246, 0.15)' : 
                                         isSuccess ? 'rgba(16, 185, 129, 0.1)' : 
                                         isWarning ? 'rgba(251, 191, 36, 0.1)' : 
                                         'transparent',
                              borderLeft: isProgress ? '3px solid #8b5cf6' : 
                                         isSuccess ? '3px solid #10b981' : 
                                         isWarning ? '3px solid #fbbf24' : 
                                         '3px solid transparent',
                              borderRadius: '4px',
                              fontSize: '12px',
                              lineHeight: '1.6',
                              color: isProgress ? '#c4b5fd' : 
                                    isSuccess ? '#6ee7b7' : 
                                    isWarning ? '#fcd34d' : 
                                    '#94a3b8',
                              fontFamily: 'ui-monospace, monospace'
                            }}
                          >
                            {cleanLog}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Historical Scraper Results */}
              {!isScrapingHistorical && historicalScraperResult && (
                <div style={{
                  background: historicalScraperResult.success ? 'rgba(139, 92, 246, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  border: `1px solid ${historicalScraperResult.success ? '#8b5cf6' : '#ef4444'}`,
                  borderRadius: '8px',
                  padding: '16px',
                  marginTop: '16px'
                }}>
                  <h4 style={{ 
                    color: historicalScraperResult.success ? '#8b5cf6' : '#ef4444', 
                    margin: '0 0 8px 0', 
                    fontSize: '14px' 
                  }}>
                    {historicalScraperResult.success ? 'Historical Scrape Completed Successfully' : 'Historical Scrape Failed'}
                  </h4>
                  {historicalScraperResult.result && (
                    <div style={{ color: '#cbd5e1', fontSize: '14px' }}>
                      <p style={{ margin: '4px 0' }}>
                        Total Topics: {historicalScraperResult.result.totalTopics || 0}
                      </p>
                      <p style={{ margin: '4px 0' }}>
                        Processed: {historicalScraperResult.result.processedTopics || 0}
                      </p>
                      <p style={{ margin: '4px 0' }}>
                         New Records: {historicalScraperResult.result.newRecords || 0}
                      </p>
                      <p style={{ margin: '4px 0' }}>
                         Updated Records: {historicalScraperResult.result.updatedRecords || 0}
                      </p>
                      <p style={{ margin: '4px 0' }}>
                         Unchanged: {historicalScraperResult.result.skippedRecords || 0}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div style={{ 
                background: 'rgba(139, 92, 246, 0.1)', 
                border: '1px solid rgba(139, 92, 246, 0.3)', 
                borderRadius: '8px', 
                padding: '16px',
                marginTop: '16px'
              }}>
                <h4 style={{ color: '#8b5cf6', margin: '0 0 8px 0', fontSize: '14px' }}>
                  How It Works
                </h4>
                <p style={{ color: '#cbd5e1', margin: '4px 0', fontSize: '14px' }}>
                  1. Select a date range (e.g., January 2024 to December 2024)
                </p>
                <p style={{ color: '#cbd5e1', margin: '4px 0', fontSize: '14px' }}>
                  2. The scraper will fetch all opportunities from that time period
                </p>
                <p style={{ color: '#cbd5e1', margin: '4px 0', fontSize: '14px' }}>
                  3. All data is extracted (tech areas, descriptions, Q&A, TPOCs, links, etc.)
                </p>
                <p style={{ color: '#cbd5e1', margin: '4px 0', fontSize: '14px' }}>
                  4. Results are added/updated in your database automatically
                </p>
                <p style={{ color: '#cbd5e1', margin: '4px 0 8px 0', fontSize: '13px', fontStyle: 'italic', opacity: 0.8 }}>
                  Tip: Use the same from/to dates to scrape a single month, or check "To Current" for everything up until now
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Active Opportunities Scraped Data Section */}
        {(isScrapingActive || activeScraperData.length > 0) && (
          <div style={{
            background: 'rgba(30, 41, 59, 0.6)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            borderRadius: '20px',
            padding: '32px',
            marginBottom: '32px'
          }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: '#ffffff',
              margin: '0 0 24px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
               Active Opportunities Data
            </h2>

            {/* Progress Display - Modal Overlay */}
            {isScrapingActive && (
              <div style={{
                position: 'absolute',
                top: '120px',
                left: '0',
                right: '0',
                zIndex: 1000,
                padding: '0 20px',
                marginBottom: '24px'
              }}>
                <div style={{
                  background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                  border: '3px solid #4ecdc4',
                  borderRadius: '16px',
                  padding: '36px',
                  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), 0 0 100px rgba(78, 205, 196, 0.3)',
                  maxWidth: '900px',
                  margin: '0 auto'
                }}>
                  <h3 style={{ 
                    color: '#ffffff', 
                    fontSize: '24px', 
                    marginBottom: '24px',
                    textAlign: 'center'
                  }}>
                     Scraping Active Opportunities
                  </h3>
                  
                  {activeScraperProgress ? (
                    <>
                      <div style={{
                        width: '100%',
                        height: '16px',
                        background: 'rgba(148, 163, 184, 0.2)',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        marginBottom: '20px'
                      }}>
                        <div style={{
                          width: `${activeScraperProgress.processedTopics && activeScraperProgress.totalTopics 
                            ? (activeScraperProgress.processedTopics / activeScraperProgress.totalTopics * 100) 
                            : 10}%`,
                          height: '100%',
                          background: 'linear-gradient(90deg, #4ecdc4 0%, #44a08d 100%)',
                          transition: 'width 0.5s ease',
                          animation: 'pulse 2s infinite'
                        }} />
                      </div>
                      
                      <div style={{ color: '#cbd5e1', fontSize: '16px', lineHeight: '1.8' }}>
                        <p style={{ marginBottom: '12px' }}>
                          <strong style={{ color: '#4ecdc4' }}>Phase:</strong> {activeScraperProgress.phase || 'Starting...'}
                        </p>
                        {activeScraperProgress.totalTopics > 0 && (
                          <p style={{ marginBottom: '12px' }}>
                            <strong style={{ color: '#4ecdc4' }}>Progress:</strong> {activeScraperProgress.processedTopics || 0} / {activeScraperProgress.totalTopics} topics
                          </p>
                        )}
                        {activeScraperProgress.activeTopicsFound > 0 && (
                          <p style={{ marginBottom: '12px' }}>
                            <strong style={{ color: '#10b981' }}>Active Found:</strong> {activeScraperProgress.activeTopicsFound} opportunities
                          </p>
                        )}
                        {activeScraperProgress.topicsWithDetails > 0 && (
                          <p style={{ marginBottom: '12px' }}>
                            <strong style={{ color: '#4ecdc4' }}>Details Fetched:</strong> {activeScraperProgress.topicsWithDetails} topics
                          </p>
                        )}
                      </div>
                      
                      {activeScraperProgress.logs && activeScraperProgress.logs.length > 0 && (
                        <div style={{
                          marginTop: '20px',
                          padding: '16px',
                          background: 'rgba(0, 0, 0, 0.4)',
                          border: '1px solid rgba(78, 205, 196, 0.3)',
                          borderRadius: '12px',
                          maxHeight: '400px',
                          overflowY: 'auto'
                        }}>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '12px'
                          }}>
                            <p style={{ color: '#4ecdc4', fontSize: '13px', fontWeight: '700', margin: 0 }}>
                              Detailed Progress Log ({activeScraperProgress.logs.length} entries)
                            </p>
                            <span style={{ color: '#10b981', fontSize: '11px', fontWeight: '600' }}>
                              LIVE
                            </span>
                          </div>
                          {activeScraperProgress.logs.slice(-50).reverse().map((log: string, idx: number) => {
                            const cleanLog = log.split(': ').slice(1).join(': ') || log;
                            const isProgress = cleanLog.includes('[') && cleanLog.includes('%]');
                            const isSuccess = cleanLog.includes('✓');
                            const isWarning = cleanLog.includes('⚠');
                            
                            return (
                              <p key={idx} style={{ 
                                color: isSuccess ? '#10b981' : isWarning ? '#f59e0b' : '#94a3b8',
                                fontSize: isProgress ? '13px' : '12px',
                                marginBottom: '6px',
                                fontFamily: 'monospace',
                                fontWeight: isProgress ? '600' : '400',
                                lineHeight: '1.4',
                                paddingLeft: cleanLog.startsWith('      ') ? '20px' : '0'
                              }}>
                                {cleanLog}
                              </p>
                            );
                          })}
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{ textAlign: 'center', color: '#cbd5e1' }}>
                      <p style={{ fontSize: '18px', marginBottom: '16px' }}>
                         Initializing scraper...
                      </p>
                      <p style={{ fontSize: '14px', color: '#94a3b8' }}>
                        This may take a few moments
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Scraped Data Display */}
            {!isScrapingActive && activeScraperData.length > 0 && (
              <div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '20px'
                }}>
                  <div>
                    <h3 style={{ color: '#cbd5e1', fontSize: '18px', marginBottom: '8px' }}>
                       {activeScraperData.length} Active Opportunities Ready
                    </h3>
                    <p style={{ color: '#94a3b8', fontSize: '14px' }}>
                      Data includes all 159 columns from DSIP
                    </p>
                  </div>
                  <button
                    onClick={() => showNotification(' Supabase import coming soon!', 'info')}
                    style={{
                      padding: '12px 24px',
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                     Import to Supabase (Coming Soon)
                  </button>
                </div>

                {/* Data Preview Table */}
                <div style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: '12px',
                  padding: '20px',
                  maxHeight: '400px',
                  overflowY: 'auto'
                }}>
                  <h4 style={{ color: '#cbd5e1', marginBottom: '16px' }}>Data Preview (First 10 rows)</h4>
                  <table style={{ width: '100%', color: '#cbd5e1', fontSize: '13px', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.3)' }}>
                        <th style={{ padding: '12px', textAlign: 'left' }}>Topic Number</th>
                        <th style={{ padding: '12px', textAlign: 'left' }}>Title</th>
                        <th style={{ padding: '12px', textAlign: 'left' }}>Component</th>
                        <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
                        <th style={{ padding: '12px', textAlign: 'left' }}>Close Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeScraperData.slice(0, 10).map((opp, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.1)' }}>
                          <td style={{ padding: '12px' }}>{opp['Topic Number (API: topicCode)']}</td>
                          <td style={{ padding: '12px', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {opp['Title (API: topicTitle)']}
                          </td>
                          <td style={{ padding: '12px' }}>{opp['Component (API: component)']}</td>
                          <td style={{ padding: '12px' }}>{opp['Status (API: topicStatus)']}</td>
                          <td style={{ padding: '12px' }}>{opp['Close Date']}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {activeScraperData.length > 10 && (
                    <p style={{ color: '#94a3b8', marginTop: '16px', textAlign: 'center' }}>
                      ...and {activeScraperData.length - 10} more opportunities
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

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
      
      {/* Floating Notification Overlay */}
      {notification.show && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          maxWidth: '500px',
          minWidth: '300px',
          background: notification.type === 'success' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' :
                     notification.type === 'error' ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' :
                     notification.type === 'warning' ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' :
                     'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          color: '#ffffff',
          padding: '20px 24px',
          borderRadius: '16px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
          zIndex: 10000,
          animation: 'slideInFromRight 0.3s ease-out',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '16px'
          }}>
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: '16px',
                fontWeight: '600',
                marginBottom: '8px',
                lineHeight: '1.5'
              }}>
                {notification.message}
              </div>
              
              {notification.details && (
                <div style={{
                  marginTop: '12px',
                  paddingTop: '12px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.2)',
                  fontSize: '14px',
                  lineHeight: '1.6'
                }}>
                  {notification.details.totalCount !== undefined && (
                    <div> Total in DB: {notification.details.totalCount}</div>
                  )}
                  {notification.details.activeCount !== undefined && (
                    <div> Active: {notification.details.activeCount}</div>
                  )}
                  {notification.details.breakdown && (
                    <div style={{ marginTop: '8px', paddingLeft: '16px' }}>
                      <div>🟢 Open (Accepting Submissions): {notification.details.breakdown.open}</div>
                      <div>🔵 Pre-Release (Prepare Now): {notification.details.breakdown.preRelease}</div>
                    </div>
                  )}
                  {notification.details.sampleOpportunities && notification.details.sampleOpportunities.length > 0 && (
                    <div style={{ marginTop: '8px' }}>
                      <div style={{ fontWeight: '600', marginBottom: '4px' }}>Recent Opportunities:</div>
                      {notification.details.sampleOpportunities.slice(0, 3).map((opp: any, idx: number) => (
                        <div key={idx} style={{ 
                          fontSize: '13px', 
                          marginLeft: '8px',
                          opacity: 0.9,
                          marginTop: '2px'
                        }}>
                          • {opp.title || opp.topic_id}
                        </div>
                      ))}
                    </div>
                  )}
                  {notification.details.tables && (
                    <div style={{ marginTop: '12px' }}>
                      <div style={{ fontWeight: '600', marginBottom: '6px' }}> Tables:</div>
                      {Object.entries(notification.details.tables).map(([tableName, tableInfo]: [string, any]) => (
                        <div key={tableName} style={{ 
                          fontSize: '13px', 
                          marginLeft: '8px',
                          opacity: 0.9,
                          marginTop: '3px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <span>{tableInfo.exists ? '' : ''}</span>
                          <span style={{ flex: 1 }}>{tableName}</span>
                          {tableInfo.exists && (
                            <span style={{ opacity: 0.8 }}>({tableInfo.count?.toLocaleString() || 0} records)</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {(notification.details.opportunitiesTable || notification.details.scrapingJobsTable || notification.details.usersTable) && (
                    <div style={{ marginTop: '12px' }}>
                      <div style={{ fontWeight: '600', marginBottom: '6px' }}> Database Tables:</div>
                      {notification.details.opportunitiesTable && (
                        <div style={{ fontSize: '13px', marginLeft: '8px', opacity: 0.9, marginTop: '3px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>{notification.details.opportunitiesTable.exists ? '' : ''}</span>
                          <span style={{ flex: 1 }}>dsip_opportunities</span>
                          {notification.details.opportunitiesTable.exists && (
                            <span style={{ opacity: 0.8 }}>({notification.details.opportunitiesTable.count?.toLocaleString() || 0} records)</span>
                          )}
                        </div>
                      )}
                      {notification.details.scrapingJobsTable && (
                        <div style={{ fontSize: '13px', marginLeft: '8px', opacity: 0.9, marginTop: '3px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>{notification.details.scrapingJobsTable.exists ? '' : ''}</span>
                          <span style={{ flex: 1 }}>dsip_scraping_jobs</span>
                          {notification.details.scrapingJobsTable.exists && (
                            <span style={{ opacity: 0.8 }}>({notification.details.scrapingJobsTable.count?.toLocaleString() || 0} records)</span>
                          )}
                        </div>
                      )}
                      {notification.details.usersTable && (
                        <div style={{ fontSize: '13px', marginLeft: '8px', opacity: 0.9, marginTop: '3px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>{notification.details.usersTable.exists ? '' : ''}</span>
                          <span style={{ flex: 1 }}>users</span>
                          {notification.details.usersTable.exists && (
                            <span style={{ opacity: 0.8 }}>({notification.details.usersTable.count?.toLocaleString() || 0} records)</span>
                          )}
                        </div>
                      )}
                      {notification.details.canInsert !== undefined && (
                        <div style={{ marginTop: '8px', fontSize: '13px', paddingLeft: '8px' }}>
                           Can Insert: {notification.details.canInsert ? ' Yes' : ' No'}
                        </div>
                      )}
                      {notification.details.insertError && (
                        <div style={{ marginTop: '6px', fontSize: '12px', paddingLeft: '8px', color: '#fca5a5' }}>
                           Insert Error: {notification.details.insertError}
                        </div>
                      )}
                    </div>
                  )}
                  {notification.details.connection !== undefined && (
                    <div style={{ marginTop: '8px' }}>
                       Connection: {notification.details.connection ? ' Connected' : ' Failed'}
                    </div>
                  )}
                  {(notification.details.recordsProcessed !== undefined || notification.details.newRecords !== undefined) && (
                    <div style={{ marginTop: '12px' }}>
                      <div style={{ fontWeight: '600', marginBottom: '6px' }}> Scraping Results:</div>
                      {notification.details.recordsProcessed !== undefined && (
                        <div style={{ fontSize: '13px', marginLeft: '8px', opacity: 0.9 }}>
                           Records Processed: {notification.details.recordsProcessed?.toLocaleString()}
                        </div>
                      )}
                      {notification.details.newRecords !== undefined && (
                        <div style={{ fontSize: '13px', marginLeft: '8px', opacity: 0.9 }}>
                           New Records: {notification.details.newRecords?.toLocaleString()}
                        </div>
                      )}
                      {notification.details.updatedRecords !== undefined && (
                        <div style={{ fontSize: '13px', marginLeft: '8px', opacity: 0.9 }}>
                           Updated Records: {notification.details.updatedRecords?.toLocaleString()}
                        </div>
                      )}
                      {notification.details.duration && (
                        <div style={{ fontSize: '13px', marginLeft: '8px', opacity: 0.9 }}>
                           Duration: {notification.details.duration}
                        </div>
                      )}
                    </div>
                  )}
                  {notification.details.hint && (
                    <div style={{ 
                      marginTop: '12px', 
                      padding: '10px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      fontSize: '13px'
                    }}>
                       <strong>Hint:</strong> {notification.details.hint}
                    </div>
                  )}
                  {notification.details.message && (
                    <div style={{ marginTop: '8px', fontSize: '13px', fontStyle: 'italic' }}>
                       {notification.details.message}
                    </div>
                  )}
                  {notification.details.timestamp && (
                    <div style={{ marginTop: '8px', fontSize: '12px', opacity: 0.8 }}>
                      🕒 {new Date(notification.details.timestamp).toLocaleString()}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <button
              onClick={() => setNotification(prev => ({ ...prev, show: false }))}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                color: '#ffffff',
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}
      
      <style jsx global>{`
        @keyframes slideInFromRight {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes shimmer {
          0% {
            left: -100%;
          }
          100% {
            left: 100%;
          }
        }

        @keyframes gradientMove {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }

        @keyframes shine {
          0% {
            left: -100%;
          }
          50%, 100% {
            left: 100%;
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }
      `}</style>
    </div>
  )
}
