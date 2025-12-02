'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Opportunity, ChatMessage, SearchFilters } from '@/types/opportunity'
import { searchOpportunities, chatWithOpportunities, getAllAgencies, getAllContractVehicles, getAllStatuses } from '@/mock/api'
import { OpportunityDetailPanel } from '@/components/OpportunityDetailPanel'

function SearchPageContent() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams?.get('q') || ''

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
  const [isSearching, setIsSearching] = useState(false)

  const agencies = getAllAgencies()
  const contractVehicles = getAllContractVehicles()
  const statuses = getAllStatuses()

  // Perform search when filters change
  useEffect(() => {
    setIsSearching(true)
    const results = searchOpportunities(filters)
    setSearchResults(results)
    setIsSearching(false)

    // If we have a query and no chat messages yet, send initial chat
    if (filters.query && chatMessages.length === 0) {
      const { message, relatedOpportunities } = chatWithOpportunities(filters.query)
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

  const handleOpportunityClick = (opp: Opportunity) => {
    setSelectedOpportunity(opp)
  }

  return (
    <div style={{
      height: 'calc(100vh - 73px)', // Subtract navbar height
      display: 'grid',
      gridTemplateColumns: '280px 1fr 400px',
      overflow: 'hidden'
    }}>
      {/* Left Sidebar - Filters */}
      <div style={{
        borderRight: '1px solid rgba(255, 255, 255, 0.1)',
        background: 'rgba(11, 18, 32, 0.6)',
        overflow: 'auto',
        padding: '1.5rem'
      }}>
        <h3 style={{
          fontSize: '1rem',
          fontWeight: '600',
          color: '#ffffff',
          marginBottom: '1.5rem'
        }}>
          Filters
        </h3>

        {/* Query Input */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{
            display: 'block',
            fontSize: '0.875rem',
            fontWeight: '500',
            color: 'rgba(255, 255, 255, 0.8)',
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
              border: '1px solid rgba(255, 255, 255, 0.15)',
              background: 'rgba(255, 255, 255, 0.05)',
              color: '#ffffff',
              fontSize: '0.875rem',
              outline: 'none'
            }}
          />
        </div>

        {/* Agency Filter */}
        <FilterSection
          label="Agency"
          options={agencies}
          selectedOptions={filters.agencies}
          onChange={(selected) => setFilters({ ...filters, agencies: selected })}
        />

        {/* Contract Vehicle Filter */}
        <FilterSection
          label="Contract Vehicle"
          options={contractVehicles}
          selectedOptions={filters.contractVehicles}
          onChange={(selected) => setFilters({ ...filters, contractVehicles: selected })}
        />

        {/* Status Filter */}
        <FilterSection
          label="Status"
          options={statuses}
          selectedOptions={filters.statuses}
          onChange={(selected) => setFilters({ ...filters, statuses: selected })}
        />

        {/* Clear Filters */}
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
              border: '1px solid rgba(255, 255, 255, 0.2)',
              background: 'transparent',
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '0.875rem',
              cursor: 'pointer'
            }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Center - Chat and Results */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: '#0B1220'
      }}>
        {/* Search Results Strip */}
        <div style={{
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '1rem 1.5rem',
          background: 'rgba(11, 18, 32, 0.4)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.75rem'
          }}>
            <h3 style={{
              fontSize: '0.875rem',
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.9)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Search Results
            </h3>
            <span style={{
              fontSize: '0.875rem',
              color: 'rgba(255, 255, 255, 0.6)'
            }}>
              {searchResults.length} opportunities
            </span>
          </div>

          {/* Horizontal scrollable results */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            overflowX: 'auto',
            paddingBottom: '0.5rem'
          }}>
            {searchResults.slice(0, 10).map(opp => (
              <div
                key={opp.id}
                onClick={() => handleOpportunityClick(opp)}
                style={{
                  minWidth: '280px',
                  padding: '1rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  background: selectedOpportunity?.id === opp.id ? 'rgba(45, 91, 255, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#ffffff',
                  marginBottom: '0.5rem',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {opp.title}
                </div>
                <div style={{
                  fontSize: '0.75rem',
                  color: 'rgba(255, 255, 255, 0.6)',
                  marginBottom: '0.25rem'
                }}>
                  {opp.agency}
                </div>
                <div style={{
                  fontSize: '0.75rem',
                  color: 'rgba(255, 255, 255, 0.6)'
                }}>
                  Due: {new Date(opp.dueDate).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
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
                color: 'rgba(255, 255, 255, 0.4)',
                fontSize: '0.95rem',
                textAlign: 'center'
              }}>
                <div>
                  <div style={{ marginBottom: '0.5rem' }}>Start a conversation</div>
                  <div style={{ fontSize: '0.875rem' }}>Ask about opportunities, agencies, or technologies</div>
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
                      background: msg.role === 'user' ? 'rgba(45, 91, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                      border: `1px solid ${msg.role === 'user' ? 'rgba(45, 91, 255, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
                      color: '#ffffff',
                      fontSize: '0.95rem',
                      lineHeight: '1.6'
                    }}>
                      {msg.content}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Chat Input */}
          <div style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '1.5rem',
            background: 'rgba(11, 18, 32, 0.6)'
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
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: '#ffffff',
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
                  background: chatInput.trim() ? 'rgba(45, 91, 255, 1)' : 'rgba(255, 255, 255, 0.1)',
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
}

function FilterSection({ label, options, selectedOptions, onChange }: FilterSectionProps) {
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
        color: 'rgba(255, 255, 255, 0.8)',
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
              color: 'rgba(255, 255, 255, 0.8)'
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
              color: 'rgba(45, 91, 255, 1)',
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
        color: '#ffffff'
      }}>
        Loading...
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  )
}
