'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

interface DSIPOpportunity {
  id: number
  topic_number: string
  title: string
  component: string
  program: string
  status: string
  phase: string
  open_date: string
  close_date: string
  total_potential_award: number
  technology_areas: string[]
  keywords: string[]
  has_qa: boolean
  is_xtech: boolean
  requires_itar: boolean
  search_rank: number
  consolidated_instructions_url?: string
}

interface SearchFilters {
  status: string[]
  component: string[]
  program: string[]
  phase: string[]
  technologyAreas: string[]
  keywords: string[]
  itar: boolean | null
  isXtech: boolean | null
  minFunding: number | null
  maxFunding: number | null
  openDateFrom: string | null
  openDateTo: string | null
  closeDateFrom: string | null
  closeDateTo: string | null
}

export default function DSIPSearchPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  
  // Redirect to admin SBIR database (where active development is happening)
  useEffect(() => {
    if (!isLoading) {
      router.push('/admin/sbir-database');
    }
  }, [isLoading, router]);
  
  // Show loading state while redirecting
  return (
    <div style={{ 
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
    }}>
      <div style={{ textAlign: 'center', color: '#cbd5e1' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔄</div>
        <div style={{ fontSize: '18px', fontWeight: '600' }}>Redirecting to SBIR Database...</div>
      </div>
    </div>
  );
  
  // Old code below - keeping for reference when we move features back
  /*
  const [searchQuery, setSearchQuery] = useState('')
  const [opportunities, setOpportunities] = useState<DSIPOpportunity[]>([])
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalResults, setTotalResults] = useState(0)
  const [expandedCardId, setExpandedCardId] = useState<number | null>(null)
  const [activeFilters, setActiveFilters] = useState<SearchFilters>({
    status: [],
    component: [],
    program: [],
    phase: [],
    technologyAreas: [],
    keywords: [],
    itar: null,
    isXtech: null,
    minFunding: null,
    maxFunding: null,
    openDateFrom: null,
    openDateTo: null,
    closeDateFrom: null,
    closeDateTo: null
  })

  // Filter options
  const statusOptions = ['Open', 'Prerelease', 'Closed', 'Active']
  const componentOptions = ['ARMY', 'NAVY', 'AIR_FORCE', 'DARPA', 'SOCOM', 'DTRA', 'MDA']
  const programOptions = ['SBIR', 'STTR', 'xTech']
  const phaseOptions = ['Phase I', 'Phase II', 'Phase III', 'Direct to Phase II']

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, isLoading, router])

  const performSearch = async (page: number = 1) => {
    if (!user) return

    setLoading(true)
    try {
      const params = new URLSearchParams()
      
      if (searchQuery.trim()) {
        params.append('q', searchQuery.trim())
      }
      
      // Add filters
      if (activeFilters.status.length > 0) {
        params.append('status', activeFilters.status.join(','))
      }
      if (activeFilters.component.length > 0) {
        params.append('component', activeFilters.component.join(','))
      }
      if (activeFilters.program.length > 0) {
        params.append('program', activeFilters.program.join(','))
      }
      if (activeFilters.phase.length > 0) {
        params.append('phase', activeFilters.phase.join(','))
      }
      if (activeFilters.technologyAreas.length > 0) {
        params.append('technologyAreas', activeFilters.technologyAreas.join(','))
      }
      if (activeFilters.keywords.length > 0) {
        params.append('keywords', activeFilters.keywords.join(','))
      }
      if (activeFilters.itar !== null) {
        params.append('itar', activeFilters.itar.toString())
      }
      if (activeFilters.isXtech !== null) {
        params.append('isXtech', activeFilters.isXtech.toString())
      }
      if (activeFilters.minFunding !== null) {
        params.append('minFunding', activeFilters.minFunding.toString())
      }
      if (activeFilters.maxFunding !== null) {
        params.append('maxFunding', activeFilters.maxFunding.toString())
      }
      if (activeFilters.openDateFrom) {
        params.append('openDateFrom', activeFilters.openDateFrom)
      }
      if (activeFilters.openDateTo) {
        params.append('openDateTo', activeFilters.openDateTo)
      }
      if (activeFilters.closeDateFrom) {
        params.append('closeDateFrom', activeFilters.closeDateFrom)
      }
      if (activeFilters.closeDateTo) {
        params.append('closeDateTo', activeFilters.closeDateTo)
      }
      
      params.append('page', page.toString())
      params.append('limit', '50')

      const response = await fetch(`/api/dsip/search?${params}`)
      if (response.ok) {
        const data = await response.json()
        setOpportunities(data.opportunities)
        setTotalPages(data.pagination.totalPages)
        setTotalResults(data.pagination.total)
        setCurrentPage(page)
      } else {
        console.error('Search failed:', response.statusText)
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    performSearch(1)
  }

  const toggleFilter = (filterType: keyof SearchFilters, value: string | boolean) => {
    setActiveFilters(prev => {
      const current = prev[filterType]
      if (Array.isArray(current)) {
        if (current.includes(value as string)) {
          return {
            ...prev,
            [filterType]: current.filter(item => item !== value)
          }
        } else {
          return {
            ...prev,
            [filterType]: [...current, value as string]
          }
        }
      } else {
        return {
          ...prev,
          [filterType]: prev[filterType] === value ? null : value
        }
      }
    })
  }

  const clearAllFilters = () => {
    setActiveFilters({
      status: [],
      component: [],
      program: [],
      phase: [],
      technologyAreas: [],
      keywords: [],
      itar: null,
      isXtech: null,
      minFunding: null,
      maxFunding: null,
      openDateFrom: null,
      openDateTo: null,
      closeDateFrom: null,
      closeDateTo: null
    })
  }

  const formatCurrency = (amount: number) => {
    if (!amount) return 'N/A'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
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
          <p style={{ color: '#c4b5fd', fontSize: '18px' }}>Loading DSIP Search...</p>
        </div>
      </div>
    )
  }

  if (!user) {
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
                🍪 DSIP Smart Search
              </h1>
              <p style={{
                color: '#cbd5e1',
                marginTop: '8px',
                fontSize: '18px'
              }}>
                Search through 33,000+ DSIP opportunities with advanced filters and AI-powered matching
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
        {/* Search Section */}
        <div style={{
          background: 'rgba(30, 41, 59, 0.6)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(148, 163, 184, 0.2)',
          borderRadius: '20px',
          padding: '32px',
          marginBottom: '32px'
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '700',
            color: '#ffffff',
            margin: '0 0 24px 0'
          }}>
            Search DSIP Opportunities
          </h2>

          {/* Basic Search */}
          <div style={{
            display: 'flex',
            gap: '16px',
            marginBottom: '24px',
            alignItems: 'flex-end'
          }}>
            <div style={{ flex: 1 }}>
              <label style={{
                display: 'block',
                color: '#cbd5e1',
                fontWeight: '500',
                marginBottom: '8px',
                fontSize: '14px'
              }}>
                Search Query
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter keywords, technology areas, or opportunity details..."
                style={{
                  width: '100%',
                  padding: '16px 20px',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(148, 163, 184, 0.3)',
                  borderRadius: '12px',
                  color: '#ffffff',
                  fontSize: '16px',
                  transition: 'all 0.2s ease'
                }}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={loading}
              style={{
                padding: '16px 32px',
                background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                border: 'none',
                borderRadius: '12px',
                color: '#ffffff',
                fontSize: '16px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                opacity: loading ? 0.6 : 1
              }}
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>

          {/* Advanced Filters */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px',
            marginBottom: '24px'
          }}>
            {/* Status Filter */}
            <div>
              <label style={{
                display: 'block',
                color: '#cbd5e1',
                fontWeight: '500',
                marginBottom: '8px',
                fontSize: '14px'
              }}>
                Status
              </label>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px'
              }}>
                {statusOptions.map(status => (
                  <button
                    key={status}
                    onClick={() => toggleFilter('status', status)}
                    style={{
                      padding: '8px 16px',
                      background: activeFilters.status.includes(status) 
                        ? '#8b5cf6' 
                        : 'rgba(148, 163, 184, 0.1)',
                      border: '1px solid',
                      borderColor: activeFilters.status.includes(status) 
                        ? '#8b5cf6' 
                        : 'rgba(148, 163, 184, 0.3)',
                      borderRadius: '20px',
                      color: activeFilters.status.includes(status) 
                        ? '#ffffff' 
                        : '#cbd5e1',
                      fontSize: '14px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* Component Filter */}
            <div>
              <label style={{
                display: 'block',
                color: '#cbd5e1',
                fontWeight: '500',
                marginBottom: '8px',
                fontSize: '14px'
              }}>
                Component
              </label>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px'
              }}>
                {componentOptions.map(component => (
                  <button
                    key={component}
                    onClick={() => toggleFilter('component', component)}
                    style={{
                      padding: '8px 16px',
                      background: activeFilters.component.includes(component) 
                        ? '#8b5cf6' 
                        : 'rgba(148, 163, 184, 0.1)',
                      border: '1px solid',
                      borderColor: activeFilters.component.includes(component) 
                        ? '#8b5cf6' 
                        : 'rgba(148, 163, 184, 0.3)',
                      borderRadius: '20px',
                      color: activeFilters.component.includes(component) 
                        ? '#ffffff' 
                        : '#cbd5e1',
                      fontSize: '14px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {component}
                  </button>
                ))}
              </div>
            </div>

            {/* Program Filter */}
            <div>
              <label style={{
                display: 'block',
                color: '#cbd5e1',
                fontWeight: '500',
                marginBottom: '8px',
                fontSize: '14px'
              }}>
                Program Type
              </label>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px'
              }}>
                {programOptions.map(program => (
                  <button
                    key={program}
                    onClick={() => toggleFilter('program', program)}
                    style={{
                      padding: '8px 16px',
                      background: activeFilters.program.includes(program) 
                        ? '#8b5cf6' 
                        : 'rgba(148, 163, 184, 0.1)',
                      border: '1px solid',
                      borderColor: activeFilters.program.includes(program) 
                        ? '#8b5cf6' 
                        : 'rgba(148, 163, 184, 0.3)',
                      borderRadius: '20px',
                      color: activeFilters.program.includes(program) 
                        ? '#ffffff' 
                        : '#cbd5e1',
                      fontSize: '14px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {program}
                  </button>
                ))}
              </div>
            </div>

            {/* Phase Filter */}
            <div>
              <label style={{
                display: 'block',
                color: '#cbd5e1',
                fontWeight: '500',
                marginBottom: '8px',
                fontSize: '14px'
              }}>
                Phase
              </label>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px'
              }}>
                {phaseOptions.map(phase => (
                  <button
                    key={phase}
                    onClick={() => toggleFilter('phase', phase)}
                    style={{
                      padding: '8px 16px',
                      background: activeFilters.phase.includes(phase) 
                        ? '#8b5cf6' 
                        : 'rgba(148, 163, 184, 0.1)',
                      border: '1px solid',
                      borderColor: activeFilters.phase.includes(phase) 
                        ? '#8b5cf6' 
                        : 'rgba(148, 163, 184, 0.3)',
                      borderRadius: '20px',
                      color: activeFilters.phase.includes(phase) 
                        ? '#ffffff' 
                        : '#cbd5e1',
                      fontSize: '14px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {phase}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Special Filters */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px',
            marginBottom: '24px'
          }}>
            {/* ITAR Filter */}
            <div>
              <label style={{
                display: 'block',
                color: '#cbd5e1',
                fontWeight: '500',
                marginBottom: '8px',
                fontSize: '14px'
              }}>
                ITAR Requirements
              </label>
              <div style={{
                display: 'flex',
                gap: '8px'
              }}>
                <button
                  onClick={() => toggleFilter('itar', true)}
                  style={{
                    padding: '8px 16px',
                    background: activeFilters.itar === true 
                      ? '#8b5cf6' 
                      : 'rgba(148, 163, 184, 0.1)',
                    border: '1px solid',
                    borderColor: activeFilters.itar === true 
                      ? '#8b5cf6' 
                      : 'rgba(148, 163, 184, 0.3)',
                    borderRadius: '20px',
                    color: activeFilters.itar === true 
                      ? '#ffffff' 
                      : '#cbd5e1',
                    fontSize: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  ITAR Required
                </button>
                <button
                  onClick={() => toggleFilter('itar', false)}
                  style={{
                    padding: '8px 16px',
                    background: activeFilters.itar === false 
                      ? '#8b5cf6' 
                      : 'rgba(148, 163, 184, 0.1)',
                    border: '1px solid',
                    borderColor: activeFilters.itar === false 
                      ? '#8b5cf6' 
                      : 'rgba(148, 163, 184, 0.3)',
                    borderRadius: '20px',
                    color: activeFilters.itar === false 
                      ? '#ffffff' 
                      : '#cbd5e1',
                    fontSize: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  No ITAR
                </button>
              </div>
            </div>

            {/* xTech Filter */}
            <div>
              <label style={{
                display: 'block',
                color: '#cbd5e1',
                fontWeight: '500',
                marginBottom: '8px',
                fontSize: '14px'
              }}>
                xTech Competitions
              </label>
              <div style={{
                display: 'flex',
                gap: '8px'
              }}>
                <button
                  onClick={() => toggleFilter('isXtech', true)}
                  style={{
                    padding: '8px 16px',
                    background: activeFilters.isXtech === true 
                      ? '#8b5cf6' 
                      : 'rgba(148, 163, 184, 0.1)',
                    border: '1px solid',
                    borderColor: activeFilters.isXtech === true 
                      ? '#8b5cf6' 
                      : 'rgba(148, 163, 184, 0.3)',
                    borderRadius: '20px',
                    color: activeFilters.isXtech === true 
                      ? '#ffffff' 
                      : '#cbd5e1',
                    fontSize: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  xTech Only
                </button>
                <button
                  onClick={() => toggleFilter('isXtech', false)}
                  style={{
                    padding: '8px 16px',
                    background: activeFilters.isXtech === false 
                      ? '#8b5cf6' 
                      : 'rgba(148, 163, 184, 0.1)',
                    border: '1px solid',
                    borderColor: activeFilters.isXtech === false 
                      ? '#8b5cf6' 
                      : 'rgba(148, 163, 184, 0.3)',
                    borderRadius: '20px',
                    color: activeFilters.isXtech === false 
                      ? '#ffffff' 
                      : '#cbd5e1',
                    fontSize: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Exclude xTech
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            gap: '16px',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <button
              onClick={clearAllFilters}
              style={{
                padding: '12px 24px',
                background: 'transparent',
                border: '1px solid rgba(148, 163, 184, 0.3)',
                borderRadius: '8px',
                color: '#cbd5e1',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.6)'
                e.currentTarget.style.color = '#ffffff'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.3)'
                e.currentTarget.style.color = '#cbd5e1'
              }}
            >
              Clear All Filters
            </button>

            <div style={{
              display: 'flex',
              gap: '12px',
              alignItems: 'center'
            }}>
              <span style={{ color: '#94a3b8', fontSize: '14px' }}>
                Click any filter above to search the entire database
              </span>
            </div>
          </div>
        </div>

        {/* Results Section */}
        {opportunities.length > 0 && (
          <div style={{
            background: 'rgba(30, 41, 59, 0.6)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            borderRadius: '20px',
            padding: '32px',
            marginBottom: '32px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px'
            }}>
              <h2 style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#ffffff',
                margin: 0
              }}>
                Search Results
              </h2>
              <div style={{
                display: 'flex',
                gap: '16px',
                alignItems: 'center'
              }}>
                <span style={{ color: '#94a3b8', fontSize: '14px' }}>
                  {totalResults.toLocaleString()} opportunities found
                </span>
                <button
                  style={{
                    padding: '8px 16px',
                    background: 'rgba(34, 197, 94, 0.2)',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                    borderRadius: '8px',
                    color: '#86efac',
                    fontSize: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(34, 197, 94, 0.3)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(34, 197, 94, 0.2)'
                  }}
                >
                  Export Results
                </button>
              </div>
            </div>

            {/* Results List */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              {opportunities.map((opportunity) => (
                <div
                  key={opportunity.id}
                  style={{
                    padding: '24px',
                    background: 'rgba(15, 23, 42, 0.4)',
                    borderRadius: '12px',
                    border: '1px solid rgba(148, 163, 184, 0.1)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.3)'
                    e.currentTarget.style.background = 'rgba(15, 23, 42, 0.6)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.1)'
                    e.currentTarget.style.background = 'rgba(15, 23, 42, 0.4)'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '16px'
                  }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{
                        fontSize: '18px',
                        fontWeight: '600',
                        color: '#ffffff',
                        margin: '0 0 8px 0',
                        lineHeight: '1.4'
                      }}>
                        {opportunity.title}
                      </h3>
                      <div style={{
                        display: 'flex',
                        gap: '16px',
                        flexWrap: 'wrap',
                        marginBottom: '12px'
                      }}>
                        <span style={{
                          padding: '4px 12px',
                          background: 'rgba(139, 92, 246, 0.2)',
                          borderRadius: '12px',
                          color: '#c4b5fd',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          {opportunity.component}
                        </span>
                        <span style={{
                          padding: '4px 12px',
                          background: 'rgba(59, 130, 246, 0.2)',
                          borderRadius: '12px',
                          color: '#93c5fd',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          {opportunity.program}
                        </span>
                        <span style={{
                          padding: '4px 12px',
                          background: opportunity.status === 'Open' 
                            ? 'rgba(34, 197, 94, 0.2)' 
                            : 'rgba(148, 163, 184, 0.2)',
                          borderRadius: '12px',
                          color: opportunity.status === 'Open' 
                            ? '#86efac' 
                            : '#cbd5e1',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          {opportunity.status}
                        </span>
                        <span style={{
                          padding: '4px 12px',
                          background: 'rgba(168, 85, 247, 0.2)',
                          borderRadius: '12px',
                          color: '#c4b5fd',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          {opportunity.phase}
                        </span>
                      </div>
                    </div>
                    <div style={{
                      textAlign: 'right',
                      minWidth: '120px'
                    }}>
                      <div style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#10b981',
                        marginBottom: '4px'
                      }}>
                        {formatCurrency(opportunity.total_potential_award)}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: '#94a3b8'
                      }}>
                        Total Award
                      </div>
                    </div>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '16px',
                    marginBottom: '16px'
                  }}>
                    <div>
                      <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}>
                        Open Date
                      </div>
                      <div style={{ color: '#ffffff', fontSize: '14px' }}>
                        {formatDate(opportunity.open_date)}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}>
                        Close Date
                      </div>
                      <div style={{ color: '#ffffff', fontSize: '14px' }}>
                        {formatDate(opportunity.close_date)}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}>
                        Technology Areas
                      </div>
                      <div style={{ color: '#ffffff', fontSize: '14px' }}>
                        {opportunity.technology_areas?.slice(0, 3).join(', ') || 'N/A'}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}>
                        Keywords
                      </div>
                      <div style={{ color: '#ffffff', fontSize: '14px' }}>
                        {opportunity.keywords?.slice(0, 3).join(', ') || 'N/A'}
                      </div>
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    gap: '12px',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div style={{
                      display: 'flex',
                      gap: '8px'
                    }}>
                      {opportunity.has_qa && (
                        <span style={{
                          padding: '4px 8px',
                          background: 'rgba(59, 130, 246, 0.2)',
                          borderRadius: '6px',
                          color: '#93c5fd',
                          fontSize: '12px'
                        }}>
                          Q&A Available
                        </span>
                      )}
                      {opportunity.is_xtech && (
                        <span style={{
                          padding: '4px 8px',
                          background: 'rgba(168, 85, 247, 0.2)',
                          borderRadius: '6px',
                          color: '#c4b5fd',
                          fontSize: '12px'
                        }}>
                          xTech Competition
                        </span>
                      )}
                      {opportunity.requires_itar && (
                        <span style={{
                          padding: '4px 8px',
                          background: 'rgba(239, 68, 68, 0.2)',
                          borderRadius: '6px',
                          color: '#fca5a5',
                          fontSize: '12px'
                        }}>
                          ITAR Required
                        </span>
                      )}
                    </div>
                    <div style={{
                      display: 'flex',
                      gap: '8px'
                    }}>
                      <button
                        onClick={() => setExpandedCardId(expandedCardId === opportunity.id ? null : opportunity.id)}
                        style={{
                          padding: '8px 16px',
                          background: 'rgba(139, 92, 246, 0.2)',
                          border: '1px solid rgba(139, 92, 246, 0.3)',
                          borderRadius: '8px',
                          color: '#c4b5fd',
                          fontSize: '14px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(139, 92, 246, 0.3)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(139, 92, 246, 0.2)'
                        }}
                      >
                        {expandedCardId === opportunity.id ? 'Hide Details' : 'View Details'}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Details Section */}
                  {expandedCardId === opportunity.id && (
                    <div style={{
                      marginTop: '24px',
                      padding: '24px',
                      background: 'rgba(30, 41, 59, 0.5)',
                      borderRadius: '12px',
                      border: '1px solid rgba(148, 163, 184, 0.2)'
                    }}>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                        gap: '16px',
                        marginBottom: '24px'
                      }}>
                        <div>
                          <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}>Component</div>
                          <div style={{ color: '#e2e8f0', fontSize: '14px' }}>{opportunity.component}</div>
                        </div>
                        <div>
                          <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}>Program</div>
                          <div style={{ color: '#e2e8f0', fontSize: '14px' }}>{opportunity.program}</div>
                        </div>
                        <div>
                          <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}>Phase</div>
                          <div style={{ color: '#e2e8f0', fontSize: '14px' }}>{opportunity.phase}</div>
                        </div>
                        <div>
                          <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}>Award Amount</div>
                          <div style={{ color: '#e2e8f0', fontSize: '14px' }}>
                            ${opportunity.total_potential_award?.toLocaleString() || 'N/A'}
                          </div>
                        </div>
                      </div>

                      {/* Instructions Section - Only for Active Opportunities */}
                      {opportunity.consolidated_instructions_url && ['Open', 'Prerelease', 'Active'].includes(opportunity.status) && (
                        <div style={{
                          padding: '20px',
                          background: 'rgba(59, 130, 246, 0.1)',
                          border: '1px solid rgba(59, 130, 246, 0.3)',
                          borderRadius: '8px',
                          marginTop: '16px'
                        }}>
                          <h4 style={{ color: '#93c5fd', fontSize: '16px', marginBottom: '12px', fontWeight: '600' }}>
                            Submission Instructions Available
                          </h4>
                          <p style={{ color: '#cbd5e1', fontSize: '14px', marginBottom: '16px' }}>
                            Consolidated instructions with cross-reference analysis, superseding guidance, and submission checklist.
                          </p>
                          <div style={{ display: 'flex', gap: '12px' }}>
                            <a
                              href={`/dsip/instructions/${opportunity.topic_number}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                padding: '10px 20px',
                                background: 'rgba(59, 130, 246, 0.2)',
                                border: '1px solid rgba(59, 130, 246, 0.4)',
                                borderRadius: '8px',
                                color: '#93c5fd',
                                fontSize: '14px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                textDecoration: 'none',
                                display: 'inline-block',
                                fontWeight: '500'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(59, 130, 246, 0.3)'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)'
                              }}
                            >
                              View Instructions
                            </a>
                            <a
                              href={opportunity.consolidated_instructions_url}
                              download
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                padding: '10px 20px',
                                background: 'rgba(34, 197, 94, 0.2)',
                                border: '1px solid rgba(34, 197, 94, 0.4)',
                                borderRadius: '8px',
                                color: '#86efac',
                                fontSize: '14px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                textDecoration: 'none',
                                display: 'inline-block',
                                fontWeight: '500'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(34, 197, 94, 0.3)'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(34, 197, 94, 0.2)'
                              }}
                            >
                              Download PDF
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '12px',
                marginTop: '32px'
              }}>
                <button
                  onClick={() => performSearch(currentPage - 1)}
                  disabled={currentPage === 1}
                  style={{
                    padding: '8px 16px',
                    background: currentPage === 1 
                      ? 'rgba(148, 163, 184, 0.1)' 
                      : 'rgba(139, 92, 246, 0.2)',
                    border: '1px solid',
                    borderColor: currentPage === 1 
                      ? 'rgba(148, 163, 184, 0.2)' 
                      : 'rgba(139, 92, 246, 0.3)',
                    borderRadius: '8px',
                    color: currentPage === 1 
                      ? '#64748b' 
                      : '#c4b5fd',
                    fontSize: '14px',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Previous
                </button>
                
                <span style={{ color: '#cbd5e1', fontSize: '14px' }}>
                  Page {currentPage} of {totalPages}
                </span>
                
                <button
                  onClick={() => performSearch(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  style={{
                    padding: '8px 16px',
                    background: currentPage === totalPages 
                      ? 'rgba(148, 163, 184, 0.1)' 
                      : 'rgba(139, 92, 246, 0.2)',
                    border: '1px solid',
                    borderColor: currentPage === totalPages 
                      ? 'rgba(148, 163, 184, 0.2)' 
                      : 'rgba(139, 92, 246, 0.3)',
                    borderRadius: '8px',
                    color: currentPage === totalPages 
                      ? '#64748b' 
                      : '#c4b5fd',
                    fontSize: '14px',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}

        {/* No Results Message */}
        {!loading && opportunities.length === 0 && searchQuery && (
          <div style={{
            background: 'rgba(30, 41, 59, 0.6)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            borderRadius: '20px',
            padding: '32px',
            textAlign: 'center'
          }}>
            <h3 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#ffffff',
              margin: '0 0 16px 0'
            }}>
              No opportunities found
            </h3>
            <p style={{
              color: '#94a3b8',
              fontSize: '16px',
              margin: '0 0 24px 0'
            }}>
              Try adjusting your search criteria or filters to find more opportunities.
            </p>
            <button
              onClick={clearAllFilters}
              style={{
                padding: '12px 24px',
                background: 'rgba(139, 92, 246, 0.2)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: '8px',
                color: '#c4b5fd',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(139, 92, 246, 0.3)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(139, 92, 246, 0.2)'
              }}
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  )
  */
}
