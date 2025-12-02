'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Opportunity, ChatMessage, SearchFilters } from '@/types/opportunity'
import { searchOpportunities, chatWithOpportunities, getAllAgencies, getAllContractVehicles, getAllStatuses } from '@/mock/api'
import { OpportunityDetailPanel } from '@/components/OpportunityDetailPanel'
import { HistorySidebar } from '@/components/HistorySidebar'
import { useTheme } from '@/contexts/ThemeContext'

function SearchPageContent() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams?.get('q') || ''
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [filters, setFilters] = useState<SearchFilters>({
    query: initialQuery,
    agencies: [],
    contractVehicles: [],
    statuses: [],
    dateRange: { start: null, end: null }
  })

  const [searchResults, setSearchResults] = useState<Opportunity[]>([])
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')

  const agencies = getAllAgencies()
  const contractVehicles = getAllContractVehicles()
  const statuses = getAllStatuses()

  useEffect(() => {
    const results = searchOpportunities(filters)
    setSearchResults(results)

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
  }, [filters])

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

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{
            display: 'block',
            fontSize: '0.875rem',
            fontWeight: '500',
            color: isDark ? '#D1D5DB' : '#374151',
            marginBottom: '0.5rem'
          }}>
            Search Query
          </label>
          <input
            type="text"
            value={filters.query}
            onChange={(e) => setFilters({ ...filters, query: e.target.value })}
            placeholder="Enter keywords..."
            style={{
              width: '100%',
              padding: '0.5rem',
              borderRadius: '6px',
              border: `1px solid ${isDark ? '#374151' : '#D1D5DB'}`,
              background: isDark ? '#111827' : '#F9FAFB',
              color: isDark ? '#F9FAFB' : '#1F2937',
              fontSize: '0.875rem',
              outline: 'none'
            }}
          />
        </div>

        <FilterSection
          label="Agency"
          options={agencies}
          selectedOptions={filters.agencies}
          onChange={(selected) => setFilters({ ...filters, agencies: selected })}
          isDark={isDark}
        />

        <FilterSection
          label="Contract Vehicle"
          options={contractVehicles}
          selectedOptions={filters.contractVehicles}
          onChange={(selected) => setFilters({ ...filters, contractVehicles: selected })}
          isDark={isDark}
        />

        <FilterSection
          label="Status"
          options={statuses}
          selectedOptions={filters.statuses}
          onChange={(selected) => setFilters({ ...filters, statuses: selected })}
          isDark={isDark}
        />

        {(filters.agencies.length > 0 || filters.contractVehicles.length > 0 || filters.statuses.length > 0) && (
          <button
            onClick={() => setFilters({
              ...filters,
              agencies: [],
              contractVehicles: [],
              statuses: []
            })}
            style={{
              width: '100%',
              marginTop: '1rem',
              padding: '0.5rem',
              borderRadius: '6px',
              border: `1px solid ${isDark ? '#374151' : '#D1D5DB'}`,
              background: 'transparent',
              color: isDark ? '#9CA3AF' : '#6B7280',
              fontSize: '0.875rem',
              cursor: 'pointer'
            }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Center - Chat */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: isDark ? '#111827' : '#F9FAFB'
      }}>
        {/* Search Results Count */}
        <div style={{
          borderBottom: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
          padding: '1rem 1.5rem',
          background: isDark ? '#1F2937' : '#FFFFFF',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{
            fontSize: '0.875rem',
            fontWeight: '600',
            color: isDark ? '#F9FAFB' : '#1F2937',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Chat
          </h3>
          <span style={{
            fontSize: '0.875rem',
            color: isDark ? '#9CA3AF' : '#6B7280'
          }}>
            {searchResults.length} results
          </span>
        </div>

        {/* Messages */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '1.5rem'
        }}>
          {chatMessages.length === 0 ? (
            <div style={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center'
            }}>
              <div>
                <div style={{ 
                  fontSize: '1rem',
                  color: isDark ? '#9CA3AF' : '#6B7280',
                  marginBottom: '0.5rem'
                }}>
                  Start a conversation
                </div>
                <div style={{ fontSize: '0.875rem', color: isDark ? '#6B7280' : '#9CA3AF' }}>
                  Ask about opportunities, agencies, or technologies
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {chatMessages.map(msg => (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start'
                  }}
                >
                  <div style={{
                    maxWidth: '80%',
                    padding: '1rem',
                    borderRadius: '12px',
                    background: msg.role === 'user' 
                      ? 'linear-gradient(135deg, #A855F7 0%, #7C3AED 100%)'
                      : isDark ? '#374151' : '#FFFFFF',
                    border: msg.role === 'user' 
                      ? 'none'
                      : `1px solid ${isDark ? '#4B5563' : '#E5E7EB'}`,
                    color: msg.role === 'user' ? '#ffffff' : isDark ? '#F9FAFB' : '#1F2937',
                    fontSize: '0.95rem',
                    lineHeight: '1.6',
                    boxShadow: msg.role === 'assistant' 
                      ? isDark ? '0 1px 3px rgba(0, 0, 0, 0.3)' : '0 1px 3px rgba(0, 0, 0, 0.1)'
                      : 'none'
                  }}>
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Search Results Strip Above Input */}
        {searchResults.length > 0 && (
          <div style={{
            borderTop: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
            borderBottom: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
            padding: '1rem 1.5rem',
            background: isDark ? '#1F2937' : '#FFFFFF',
            overflowX: 'auto'
          }}>
            <div style={{
              display: 'flex',
              gap: '1rem',
              paddingBottom: '0.5rem'
            }}>
              {searchResults.slice(0, 10).map(opp => (
                <div
                  key={opp.id}
                  onClick={() => setSelectedOpportunity(opp)}
                  style={{
                    minWidth: '220px',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: selectedOpportunity?.id === opp.id 
                      ? '2px solid #A855F7'
                      : `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
                    background: selectedOpportunity?.id === opp.id 
                      ? isDark ? 'rgba(168, 85, 247, 0.15)' : 'rgba(168, 85, 247, 0.05)'
                      : isDark ? '#111827' : '#F9FAFB',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{
                    fontSize: '0.8125rem',
                    fontWeight: '600',
                    color: isDark ? '#F9FAFB' : '#1F2937',
                    marginBottom: '0.25rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {opp.title}
                  </div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: isDark ? '#9CA3AF' : '#6B7280'
                  }}>
                    {opp.agency}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Chat Input */}
        <div style={{
          borderTop: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
          padding: '1.5rem',
          background: isDark ? '#1F2937' : '#FFFFFF'
        }}>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask about opportunities..."
              style={{
                flex: 1,
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                border: `1px solid ${isDark ? '#374151' : '#D1D5DB'}`,
                background: isDark ? '#111827' : '#F9FAFB',
                color: isDark ? '#F9FAFB' : '#1F2937',
                fontSize: '0.95rem',
                outline: 'none'
              }}
            />
            <button
              onClick={handleSendMessage}
              disabled={!chatInput.trim()}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                border: 'none',
                background: chatInput.trim() 
                  ? 'linear-gradient(135deg, #A855F7 0%, #7C3AED 100%)'
                  : isDark ? '#374151' : '#E5E7EB',
                color: '#ffffff',
                fontSize: '0.95rem',
                fontWeight: '600',
                cursor: chatInput.trim() ? 'pointer' : 'not-allowed',
                opacity: chatInput.trim() ? 1 : 0.5
              }}
            >
              Send
            </button>
          </div>
        </div>
      </div>

      {/* Right Panel - Opportunity Detail */}
      <OpportunityDetailPanel opportunity={selectedOpportunity} />
    </div>
  )
}

interface FilterSectionProps {
  label: string
  options: string[]
  selectedOptions: string[]
  onChange: (selected: string[]) => void
  isDark: boolean
}

function FilterSection({ label, options, selectedOptions, onChange, isDark }: FilterSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const toggleOption = (option: string) => {
    if (selectedOptions.includes(option)) {
      onChange(selectedOptions.filter(o => o !== option))
    } else {
      onChange([...selectedOptions, option])
    }
  }

  const displayOptions = isExpanded ? options : options.slice(0, 5)

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <label style={{
        display: 'block',
        fontSize: '0.875rem',
        fontWeight: '500',
        color: isDark ? '#D1D5DB' : '#374151',
        marginBottom: '0.5rem'
      }}>
        {label}
      </label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {displayOptions.map(option => (
          <label
            key={option}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
              fontSize: '0.875rem',
              color: isDark ? '#D1D5DB' : '#374151'
            }}
          >
            <input
              type="checkbox"
              checked={selectedOptions.includes(option)}
              onChange={() => toggleOption(option)}
              style={{ cursor: 'pointer' }}
            />
            <span>{option}</span>
          </label>
        ))}
        {options.length > 5 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              textAlign: 'left',
              background: 'none',
              border: 'none',
              color: '#A855F7',
              fontSize: '0.875rem',
              cursor: 'pointer',
              padding: '0.25rem 0'
            }}
          >
            {isExpanded ? 'Show less' : `Show ${options.length - 5} more`}
          </button>
        )}
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#6B7280'
      }}>
        Loading...
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  )
}
