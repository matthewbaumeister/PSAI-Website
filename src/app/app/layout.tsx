'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user } = useAuth()

  const isActive = (path: string) => pathname?.startsWith(path)

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: '#0B1220'
    }}>
      {/* Top Navigation Bar */}
      <nav style={{
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        background: 'rgba(11, 18, 32, 0.8)',
        backdropFilter: 'blur(10px)',
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
                fontSize: '1.25rem',
                fontWeight: '700',
                color: '#ffffff',
                textDecoration: 'none',
                letterSpacing: '-0.01em'
              }}
            >
              propshop.ai
            </Link>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Link
                href="/app/search"
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  fontSize: '0.95rem',
                  fontWeight: '500',
                  color: isActive('/app/search') ? '#ffffff' : 'rgba(255, 255, 255, 0.7)',
                  background: isActive('/app/search') ? 'rgba(45, 91, 255, 0.2)' : 'transparent',
                  border: isActive('/app/search') ? '1px solid rgba(45, 91, 255, 0.4)' : '1px solid transparent',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isActive('/app/search')) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
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
                  color: isActive('/app/crm') ? '#ffffff' : 'rgba(255, 255, 255, 0.7)',
                  background: isActive('/app/crm') ? 'rgba(45, 91, 255, 0.2)' : 'transparent',
                  border: isActive('/app/crm') ? '1px solid rgba(45, 91, 255, 0.4)' : '1px solid transparent',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isActive('/app/crm')) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
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
            background: 'rgba(45, 91, 255, 0.3)',
            border: '1px solid rgba(45, 91, 255, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.875rem',
            fontWeight: '600',
            color: '#ffffff',
            cursor: 'pointer'
          }}>
            {user?.firstName?.charAt(0) || 'U'}
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

