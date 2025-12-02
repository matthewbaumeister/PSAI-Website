'use client'

import Link from 'next/link'
import { useTheme } from '@/contexts/ThemeContext'

export function Footer() {
  const { theme, toggleTheme } = useTheme()

  const isDark = theme === 'dark'

  return (
    <footer style={{
      borderTop: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
      background: isDark ? '#1F2937' : '#FFFFFF',
      padding: '3rem 2rem 2rem',
      marginTop: 'auto'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '2rem',
        marginBottom: '2rem'
      }}>
        {/* Logo & About */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <img src="/logo.png" alt="PropShop.ai" style={{ height: '32px' }} />
            <span style={{
              fontSize: '1.25rem',
              fontWeight: '700',
              color: isDark ? '#F9FAFB' : '#1F2937'
            }}>
              prop-shop.ai
            </span>
          </div>
          <p style={{
            fontSize: '0.875rem',
            color: isDark ? '#9CA3AF' : '#6B7280',
            lineHeight: '1.6'
          }}>
            Search, analyze, and track government contracting opportunities with AI-powered intelligence.
          </p>
        </div>

        {/* Product */}
        <div>
          <h4 style={{
            fontSize: '0.875rem',
            fontWeight: '600',
            color: isDark ? '#F9FAFB' : '#1F2937',
            marginBottom: '1rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Product
          </h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li>
              <Link href="/app/search" style={{
                color: isDark ? '#9CA3AF' : '#6B7280',
                textDecoration: 'none',
                fontSize: '0.875rem'
              }}>
                Search Opportunities
              </Link>
            </li>
            <li>
              <Link href="/app/crm" style={{
                color: isDark ? '#9CA3AF' : '#6B7280',
                textDecoration: 'none',
                fontSize: '0.875rem'
              }}>
                CRM Pipeline
              </Link>
            </li>
          </ul>
        </div>

        {/* Company */}
        <div>
          <h4 style={{
            fontSize: '0.875rem',
            fontWeight: '600',
            color: isDark ? '#F9FAFB' : '#1F2937',
            marginBottom: '1rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Company
          </h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li>
              <Link href="/about" style={{
                color: isDark ? '#9CA3AF' : '#6B7280',
                textDecoration: 'none',
                fontSize: '0.875rem'
              }}>
                About
              </Link>
            </li>
            <li>
              <a href="mailto:info@prop-shop.ai" style={{
                color: isDark ? '#9CA3AF' : '#6B7280',
                textDecoration: 'none',
                fontSize: '0.875rem'
              }}>
                Contact Us
              </a>
            </li>
          </ul>
        </div>

        {/* Legal */}
        <div>
          <h4 style={{
            fontSize: '0.875rem',
            fontWeight: '600',
            color: isDark ? '#F9FAFB' : '#1F2937',
            marginBottom: '1rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Legal
          </h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li>
              <Link href="/terms" style={{
                color: isDark ? '#9CA3AF' : '#6B7280',
                textDecoration: 'none',
                fontSize: '0.875rem'
              }}>
                Terms of Service
              </Link>
            </li>
            <li>
              <Link href="/privacy" style={{
                color: isDark ? '#9CA3AF' : '#6B7280',
                textDecoration: 'none',
                fontSize: '0.875rem'
              }}>
                Privacy Policy
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div style={{
        borderTop: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
        paddingTop: '1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <p style={{
          fontSize: '0.875rem',
          color: isDark ? '#9CA3AF' : '#6B7280',
          margin: 0
        }}>
          © 2025 Billow LLC. All rights reserved.
        </p>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            border: `1px solid ${isDark ? '#374151' : '#D1D5DB'}`,
            background: isDark ? '#374151' : '#F9FAFB',
            color: isDark ? '#F9FAFB' : '#1F2937',
            fontSize: '0.875rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s ease'
          }}
        >
          {isDark ? '☀️' : '🌙'} {isDark ? 'Light' : 'Dark'} Mode
        </button>
      </div>
    </footer>
  )
}

