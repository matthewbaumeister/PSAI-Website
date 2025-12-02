'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()
  const [query, setQuery] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/app/search?q=${encodeURIComponent(query)}`)
    } else {
      router.push('/app/search')
    }
  }

  return (
    <main style={{
      minHeight: '80vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      background: '#F9FAFB'
    }}>
      <div style={{
        maxWidth: '700px',
        width: '100%',
        textAlign: 'center'
      }}>
        {/* Logo + Domain */}
        <div style={{
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1.5rem'
        }}>
          <img 
            src="/logo.svg" 
            alt="PropShop.ai" 
            style={{
              height: '80px'
            }}
          />
          <div style={{
            fontSize: '2.5rem',
            fontWeight: '700',
            color: '#1F2937',
            letterSpacing: '-0.02em'
          }}>
            prop-shop.ai
          </div>
        </div>

        {/* Subtext */}
        <p style={{
          fontSize: '1rem',
          color: '#6B7280',
          marginBottom: '3rem',
          fontWeight: '400'
        }}>
          Search, analyze, and track opportunities in one workspace.
        </p>

        {/* Search Input */}
        <form onSubmit={handleSearch} style={{ marginBottom: '2rem' }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search or ask about government opportunities..."
            style={{
              width: '100%',
              padding: '1rem 1.5rem',
              fontSize: '1rem',
              borderRadius: '12px',
              border: '2px solid #D1D5DB',
              background: '#FFFFFF',
              color: '#1F2937',
              outline: 'none',
              transition: 'all 0.2s ease',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}
            onFocus={(e) => {
              e.target.style.border = '2px solid #A855F7'
              e.target.style.boxShadow = '0 0 0 3px rgba(168, 85, 247, 0.1)'
            }}
            onBlur={(e) => {
              e.target.style.border = '2px solid #D1D5DB'
              e.target.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}
          />
        </form>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => router.push('/app/search')}
            style={{
              padding: '0.875rem 2rem',
              fontSize: '1rem',
              fontWeight: '600',
              borderRadius: '10px',
              border: 'none',
              background: 'linear-gradient(135deg, #A855F7 0%, #7C3AED 100%)',
              color: '#ffffff',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 15px rgba(168, 85, 247, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(168, 85, 247, 0.4)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(168, 85, 247, 0.3)'
            }}
          >
            Search opportunities
          </button>

          <button
            onClick={() => router.push('/app/crm')}
            style={{
              padding: '0.875rem 2rem',
              fontSize: '1rem',
              fontWeight: '600',
              borderRadius: '10px',
              border: '2px solid #D1D5DB',
              background: '#FFFFFF',
              color: '#1F2937',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#F9FAFB'
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#FFFFFF'
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}
          >
            Open CRM pipeline
          </button>
        </div>
      </div>
    </main>
  )
}
