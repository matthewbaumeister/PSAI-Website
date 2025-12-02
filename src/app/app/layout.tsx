'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from '@/contexts/ThemeContext'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const isActive = (path: string) => pathname?.startsWith(path)

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: isDark ? '#111827' : '#F9FAFB'
    }}>
      {/* Top Navigation Bar */}
      <nav style={{
        borderBottom: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
        background: isDark ? '#1F2937' : '#FFFFFF',
        boxShadow: isDark ? '0 1px 3px rgba(0, 0, 0, 0.3)' : '0 1px 3px rgba(0, 0, 0, 0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{
          maxWidth: '100%',
          margin: '0 auto',
          padding: '1rem 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {/* Left: Logo and Nav Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <Link 
              href="/"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                textDecoration: 'none'
              }}
            >
              <img 
                src="/logo.png" 
                alt="PropShop.ai" 
                style={{
                  height: '40px'
                }}
              />
              <span style={{
                fontSize: '1.25rem',
                fontWeight: '700',
                color: isDark ? '#F9FAFB' : '#1F2937',
                letterSpacing: '-0.01em'
              }}>
                prop-shop.ai
              </span>
            </Link>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Link
                href="/app/search"
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  fontSize: '0.95rem',
                  fontWeight: '500',
                  color: isActive('/app/search') 
                    ? '#A855F7' 
                    : isDark ? '#9CA3AF' : '#6B7280',
                  background: isActive('/app/search') 
                    ? isDark ? 'rgba(168, 85, 247, 0.15)' : 'rgba(168, 85, 247, 0.1)' 
                    : 'transparent',
                  border: isActive('/app/search') 
                    ? '1px solid rgba(168, 85, 247, 0.3)' 
                    : '1px solid transparent',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isActive('/app/search')) {
                    e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive('/app/search')) {
                    e.currentTarget.style.background = 'transparent'
                  }
                }}
              >
                Search
              </Link>

              <Link
                href="/app/crm"
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  fontSize: '0.95rem',
                  fontWeight: '500',
                  color: isActive('/app/crm') 
                    ? '#A855F7' 
                    : isDark ? '#9CA3AF' : '#6B7280',
                  background: isActive('/app/crm') 
                    ? isDark ? 'rgba(168, 85, 247, 0.15)' : 'rgba(168, 85, 247, 0.1)' 
                    : 'transparent',
                  border: isActive('/app/crm') 
                    ? '1px solid rgba(168, 85, 247, 0.3)' 
                    : '1px solid transparent',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isActive('/app/crm')) {
                    e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive('/app/crm')) {
                    e.currentTarget.style.background = 'transparent'
                  }
                }}
              >
                CRM
              </Link>
            </div>
          </div>

          {/* Right: User Menu Placeholder */}
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #A855F7 0%, #7C3AED 100%)',
            border: '1px solid rgba(168, 85, 247, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.875rem',
            fontWeight: '600',
            color: '#ffffff',
            cursor: 'pointer'
          }}>
            U
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main style={{ flex: 1, overflow: 'hidden' }}>
        {children}
      </main>
    </div>
  )
}

