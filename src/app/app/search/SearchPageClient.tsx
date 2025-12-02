'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Opportunity, ChatMessage, SearchFilters } from '@/types/opportunity'
import { OpportunityDetailPanel } from '@/components/OpportunityDetailPanel'
import { HistorySidebar } from '@/components/HistorySidebar'
import { useTheme } from '@/contexts/ThemeContext'
import { fetchOpportunities, fetchStats } from '@/lib/api-client'
import { searchOpportunities, chatWithOpportunities } from '@/mock/api'

interface SearchPageClientProps {
  initialHasData: boolean
}

export function SearchPageClient({ initialHasData }: SearchPageClientProps) {
  const searchParams = useSearchParams()
  const initialQuery = searchParams?.get('q') || ''
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [hasData, setHasData] = useState(initialHasData)
  const [loading, setLoading] = useState(false)
  const [agencies, setAgencies] = useState<string[]>([])
  const [statuses, setStatuses] = useState<string[]>([])
  const [vehicles, setVehicles] = useState<string[]>([])

  const [filters, setFilters] = useState<SearchFilters>({
    query: initialQuery,
    agencies: [],
    contractVehicles: [],
    statuses: [],
    dateRange: { start: null, end: null }
  })

  const [searchResults, setSearchResults] = useState<Opportunity[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')

  // Load stats for filters
  useEffect(() => {
    const loadStats = async () => {
      const stats = await fetchStats()
      setAgencies(stats.agencies)
      setStatuses(stats.statuses)
      setVehicles(stats.vehicles)
      setHasData(stats.totalOpportunities > 0)
    }
    loadStats()
  }, [])

  // Load opportunities when filters change
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      
      if (hasData) {
        // Use real API
        const response = await fetchOpportunities(filters)
        setSearchResults(response.opportunities)
        setTotalCount(response.total)
      } else {
        // Fallback to mock data
        const results = searchOpportunities(filters)
        setSearchResults(results)
        setTotalCount(results.length)
      }
      
      setLoading(false)

      // Initialize chat if query is present
      if (filters.query && chatMessages.length === 0) {
        const { message } = chatWithOpportunities(filters.query)
        setChatMessages([
          {
            id: `msg-user-${Date.now()}`,
            role: 'user',
            content: filters.query,
            timestamp: new Date()
          },
          message
        ])
      }
    }
    loadData()
  }, [filters, hasData])

  const handleSendMessage = () => {
    if (!chatInput.trim()) return

    const userMessage: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      role: 'user',
      content: chatInput,
      timestamp: new Date()
    }

    const { message: assistantMessage } = chatWithOpportunities(chatInput)

    setChatMessages(prev => [...prev, userMessage, assistantMessage])
    setChatInput('')
  }

  return (
    <div style={{
      height: 'calc(100vh - 73px)',
      display: 'grid',
      gridTemplateColumns: '280px 280px 1fr 400px',
      overflow: 'hidden'
    }}>
      {/* Left Sidebar - History/Nav */}
      <HistorySidebar />

      {/* Filters Panel */}
      <div style={{
        borderRight: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
        background: isDark ? '#1F2937' : '#FFFFFF',
        overflow: 'auto',
        padding: '1.5rem'
      }}>
        <h3 style={{
          fontSize: '1rem',
          fontWeight: '600',
          color: isDark ? '#F9FAFB' : '#1F2937',
          marginBottom: '1.5rem'
        }}>
          Filters
        </h3>

        {/* Data source indicator */}
        {!hasData && (
          <div style={{
            marginBottom: '1rem',
            padding: '0.75rem',
            background: isDark ? 'rgba(251, 191, 36, 0.1)' : 'rgba(251, 191, 36, 0.1)',
            border: `1px solid ${isDark ? 'rgba(251, 191, 36, 0.3)' : 'rgba(251, 191, 36, 0.3)'}`,
            borderRadius: '6px',
            fontSize: '0.75rem',
            color: isDark ? '#FCD34D' : '#D97706'
          }}>
            Using demo data - run scrapers to populate
          </div>
        )}

        {/* Agencies */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{
            display: 'block',
            fontSize: '0.875rem',
            fontWeight: '500',
            color: isDark ? '#D1D5DB' : '#374151',
            marginBottom: '0.5rem'
          }}>
            Agency
          </label>
          <select
            multiple
            value={filters.agencies}
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions, opt => opt.value)
              setFilters({ ...filters, agencies: selected })
            }}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: `1px solid ${isDark ? '#374151' : '#D1D5DB'}`,
              borderRadius: '6px',
              background: isDark ? '#111827' : '#FFFFFF',
              color: isDark ? '#F9FAFB' : '#1F2937',
              fontSize: '0.875rem'
            }}
          >
            {agencies.map(agency => (
              <option key={agency} value={agency}>{agency}</option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{
            display: 'block',
            fontSize: '0.875rem',
            fontWeight: '500',
            color: isDark ? '#D1D5DB' : '#374151',
            marginBottom: '0.5rem'
          }}>
            Status
          </label>
          <select
            multiple
            value={filters.statuses}
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions, opt => opt.value)
              setFilters({ ...filters, statuses: selected })
            }}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: `1px solid ${isDark ? '#374151' : '#D1D5DB'}`,
              borderRadius: '6px',
              background: isDark ? '#111827' : '#FFFFFF',
              color: isDark ? '#F9FAFB' : '#1F2937',
              fontSize: '0.875rem'
            }}
          >
            {statuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>

        {/* Clear filters */}
        <button
          onClick={() => setFilters({
            query: '',
            agencies: [],
            contractVehicles: [],
            statuses: [],
            dateRange: { start: null, end: null }
          })}
          style={{
            width: '100%',
            padding: '0.5rem',
            background: isDark ? '#374151' : '#E5E7EB',
            color: isDark ? '#F9FAFB' : '#1F2937',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.875rem'
          }}
        >
          Clear Filters
        </button>
      </div>

      {/* Center - Search Results & Chat */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: isDark ? '#111827' : '#F9FAFB'
      }}>
        {/* Search Results */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '1.5rem'
        }}>
          <div style={{
            marginBottom: '1rem',
            color: isDark ? '#9CA3AF' : '#6B7280',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>{loading ? 'Loading...' : `${totalCount} opportunities`}</span>
            {hasData && searchResults.length > 0 && searchResults.some(o => o.sourceCount && o.sourceCount > 1) && (
              <span style={{ fontSize: '0.875rem', opacity: 0.8 }}>
                Multi-source data
              </span>
            )}
          </div>

          {searchResults.map((opp) => (
            <div
              key={opp.id}
              onClick={() => setSelectedOpportunity(opp)}
              style={{
                padding: '1rem',
                marginBottom: '0.75rem',
                background: isDark ? '#1F2937' : '#FFFFFF',
                border: `1px solid ${selectedOpportunity?.id === opp.id ? '#7C3AED' : (isDark ? '#374151' : '#E5E7EB')}`,
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              <div style={{
                fontWeight: '600',
                color: isDark ? '#F9FAFB' : '#1F2937',
                marginBottom: '0.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start'
              }}>
                <span>{opp.title}</span>
                {opp.sourceCount && opp.sourceCount > 1 && (
                  <span style={{
                    fontSize: '0.75rem',
                    padding: '0.125rem 0.5rem',
                    borderRadius: '4px',
                    background: 'rgba(147, 51, 234, 0.2)',
                    color: '#D8B4FE'
                  }}>
                    {opp.sourceCount} sources
                  </span>
                )}
              </div>
              <div style={{
                fontSize: '0.875rem',
                color: isDark ? '#9CA3AF' : '#6B7280',
                marginBottom: '0.5rem'
              }}>
                {opp.agency} • {opp.value ? `$${(opp.value / 1000000).toFixed(1)}M` : 'Value TBD'}
              </div>
              <div style={{
                fontSize: '0.875rem',
                color: isDark ? '#D1D5DB' : '#4B5563',
                lineHeight: '1.4'
              }}>
                {opp.summary?.substring(0, 150)}...
              </div>
            </div>
          ))}
        </div>

        {/* Chat Interface */}
        <div style={{
          borderTop: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
          padding: '1rem',
          background: isDark ? '#1F2937' : '#FFFFFF'
        }}>
          <div style={{
            maxHeight: '200px',
            overflow: 'auto',
            marginBottom: '1rem'
          }}>
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  marginBottom: '0.75rem',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  background: msg.role === 'user'
                    ? (isDark ? '#374151' : '#E5E7EB')
                    : (isDark ? '#1F2937' : '#F3F4F6'),
                  color: isDark ? '#F9FAFB' : '#1F2937'
                }}
              >
                <div style={{
                  fontWeight: '600',
                  fontSize: '0.75rem',
                  marginBottom: '0.25rem',
                  color: msg.role === 'user' ? '#7C3AED' : '#3B82F6'
                }}>
                  {msg.role === 'user' ? 'You' : 'AI Assistant'}
                </div>
                <div style={{ fontSize: '0.875rem' }}>{msg.content}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask about opportunities..."
              style={{
                flex: 1,
                padding: '0.75rem',
                border: `1px solid ${isDark ? '#374151' : '#D1D5DB'}`,
                borderRadius: '6px',
                background: isDark ? '#111827' : '#FFFFFF',
                color: isDark ? '#F9FAFB' : '#1F2937'
              }}
            />
            <button
              onClick={handleSendMessage}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'linear-gradient(135deg, #A855F7, #7C3AED)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Send
            </button>
          </div>
        </div>
      </div>

      {/* Right Panel - Opportunity Details */}
      <OpportunityDetailPanel opportunity={selectedOpportunity} />
    </div>
  )
}

