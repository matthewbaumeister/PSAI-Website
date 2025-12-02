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
      padding: '2rem'
    }}>
      <div style={{
        maxWidth: '700px',
        width: '100%',
        textAlign: 'center'
      }}>
        {/* Logo/Wordmark */}
        <h1 style={{
          fontSize: '3.5rem',
          fontWeight: '700',
          marginBottom: '1rem',
          letterSpacing: '-0.02em',
          color: '#ffffff'
        }}>
          propshop.ai
        </h1>

        {/* Subtext */}
        <p style={{
          fontSize: '1rem',
          color: 'rgba(255, 255, 255, 0.6)',
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
              border: '1px solid rgba(255, 255, 255, 0.15)',
              background: 'rgba(255, 255, 255, 0.05)',
              color: '#ffffff',
              outline: 'none',
              transition: 'all 0.2s ease',
              backdropFilter: 'blur(10px)'
            }}
            onFocus={(e) => {
              e.target.style.border = '1px solid rgba(45, 91, 255, 0.5)'
              e.target.style.background = 'rgba(255, 255, 255, 0.08)'
            }}
            onBlur={(e) => {
              e.target.style.border = '1px solid rgba(255, 255, 255, 0.15)'
              e.target.style.background = 'rgba(255, 255, 255, 0.05)'
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
              background: 'rgba(45, 91, 255, 1)',
              color: '#ffffff',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 15px rgba(45, 91, 255, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(45, 91, 255, 0.9)'
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(45, 91, 255, 0.4)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(45, 91, 255, 1)'
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(45, 91, 255, 0.3)'
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
              border: '1px solid rgba(255, 255, 255, 0.2)',
              background: 'rgba(255, 255, 255, 0.05)',
              color: '#ffffff',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              backdropFilter: 'blur(10px)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'
            }}
          >
            Open CRM pipeline
          </button>
        </div>
      </div>
    </main>
  )
}
