'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTheme } from '@/contexts/ThemeContext'

interface SearchHistory {
  id: string
  title: string
  date: string
  type: 'search' | 'chat'
}

export function HistorySidebar() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Mock history data
  const [history] = useState<SearchHistory[]>([
    { id: '1', title: 'AI/ML opportunities DoD', date: 'Today', type: 'search' },
    { id: '2', title: 'Cybersecurity SBIR Phase II', date: 'Today', type: 'chat' },
    { id: '3', title: 'Cloud infrastructure GSA MAS', date: 'Yesterday', type: 'search' },
    { id: '4', title: 'Navy contracts 2025', date: 'Yesterday', type: 'search' },
    { id: '5', title: 'IDIQ opportunities $10M+', date: 'Last 7 days', type: 'chat' },
  ])

  if (isCollapsed) {
    return (
      <div style={{
        width: '60px',
        height: '100%',
        background: isDark ? '#1F2937' : '#FFFFFF',
        borderRight: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
        display: 'flex',
        flexDirection: 'column',
        padding: '1rem 0.5rem'
      }}>
        <button
          onClick={() => setIsCollapsed(false)}
          style={{
            padding: '0.75rem',
            borderRadius: '8px',
            border: 'none',
            background: isDark ? '#374151' : '#F3F4F6',
            color: isDark ? '#F9FAFB' : '#1F2937',
            cursor: 'pointer',
            fontSize: '1.25rem',
            marginBottom: '1rem'
          }}
        >
          ☰
        </button>
      </div>
    )
  }

  return (
    <div style={{
      width: '280px',
      height: '100%',
      background: isDark ? '#1F2937' : '#FFFFFF',
      borderRight: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: '1rem',
        borderBottom: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <button
          onClick={() => setIsCollapsed(true)}
          style={{
            padding: '0.5rem',
            borderRadius: '6px',
            border: 'none',
            background: isDark ? '#374151' : '#F3F4F6',
            color: isDark ? '#F9FAFB' : '#1F2937',
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          ☰
        </button>

        <Link
          href="/app/search"
          style={{
            flex: 1,
            marginLeft: '0.75rem',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            border: 'none',
            background: 'linear-gradient(135deg, #A855F7 0%, #7C3AED 100%)',
            color: '#ffffff',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: '600',
            textDecoration: 'none',
            textAlign: 'center',
            display: 'block'
          }}
        >
          + New Search
        </Link>
      </div>

      {/* History List */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '1rem'
      }}>
        <div style={{
          fontSize: '0.75rem',
          fontWeight: '600',
          color: isDark ? '#9CA3AF' : '#6B7280',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: '0.75rem'
        }}>
          Recent Searches
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {history.map(item => (
            <button
              key={item.id}
              style={{
                padding: '0.75rem',
                borderRadius: '8px',
                border: 'none',
                background: isDark ? '#374151' : '#F3F4F6',
                color: isDark ? '#F9FAFB' : '#1F2937',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '0.875rem',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.25rem'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = isDark ? '#4B5563' : '#E5E7EB'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = isDark ? '#374151' : '#F3F4F6'
              }}
            >
              <div style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {item.title}
              </div>
              <div style={{
                fontSize: '0.75rem',
                color: isDark ? '#9CA3AF' : '#6B7280'
              }}>
                {item.date}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Actions */}
      <div style={{
        borderTop: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem'
      }}>
        <Link
          href="/app/crm"
          style={{
            padding: '0.75rem',
            borderRadius: '8px',
            border: `1px solid ${isDark ? '#374151' : '#D1D5DB'}`,
            background: 'transparent',
            color: isDark ? '#F9FAFB' : '#1F2937',
            cursor: 'pointer',
            textAlign: 'center',
            fontSize: '0.875rem',
            fontWeight: '500',
            textDecoration: 'none',
            display: 'block'
          }}
        >
          📊 CRM Pipeline
        </Link>
      </div>
    </div>
  )
}

