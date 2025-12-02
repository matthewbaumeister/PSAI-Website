'use client'

import Link from 'next/link'
import { useTheme } from '@/contexts/ThemeContext'

export function Footer() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <footer style={{
      padding: '1rem 2rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '1rem',
      opacity: 0.7
    }}>
      {/* Left: Legal links */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1.5rem',
        fontSize: '0.75rem'
      }}>
        <Link href="/terms" style={{
          color: isDark ? '#6B7280' : '#9CA3AF',
          textDecoration: 'none'
        }}>
          Terms
        </Link>
        <Link href="/privacy" style={{
          color: isDark ? '#6B7280' : '#9CA3AF',
          textDecoration: 'none'
        }}>
          Privacy
        </Link>
        <a href="mailto:info@prop-shop.ai" style={{
          color: isDark ? '#6B7280' : '#9CA3AF',
          textDecoration: 'none'
        }}>
          Contact
        </a>
      </div>

      {/* Right: Theme Toggle */}
      <button
        onClick={toggleTheme}
        style={{
          padding: '0.35rem 0.75rem',
          borderRadius: '6px',
          border: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
          background: 'transparent',
          color: isDark ? '#6B7280' : '#9CA3AF',
          fontSize: '0.75rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem'
        }}
      >
        {isDark ? 'Light' : 'Dark'}
      </button>
    </footer>
  )
}
