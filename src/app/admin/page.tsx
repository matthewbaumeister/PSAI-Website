'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth, useRequireAdmin } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface ScraperConfig {
  scraper_name: string
  display_name: string
  description: string
  is_enabled: boolean
  is_running: boolean
  schedule_description: string
  last_run_at: string | null
  last_run_status: string | null
  last_run_records: number | null
  last_run_success_rate: number | null
  total_runs: number
  total_records_scraped: number
}

interface UserStats {
  total_users: number
  active_users: number
  admin_users: number
  active_last_7_days: number
  active_last_30_days: number
  new_users_7_days: number
  new_users_30_days: number
}

export default function AdminPage() {
  const router = useRouter()
  const { user, isAdmin, loading: authLoading } = useAuth()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [scrapers, setScrapers] = useState<ScraperConfig[]>([])
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'scrapers' | 'users' | 'emails'>('scrapers')

  // Check admin access
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login')
      } else if (!isAdmin) {
        router.push('/')
      }
    }
  }, [user, isAdmin, authLoading, router])

  // Fetch scraper configs
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch scraper configs (mock data for now since table might not exist yet)
        const mockScrapers: ScraperConfig[] = [
          {
            scraper_name: 'defense_gov',
            display_name: 'Defense.gov Contracts',
            description: 'Scrapes daily contract awards from defense.gov/News/Contracts/',
            is_enabled: true,
            is_running: false,
            schedule_description: 'Daily at 9:00 AM',
            last_run_at: new Date(Date.now() - 86400000).toISOString(),
            last_run_status: 'completed',
            last_run_records: 87,
            last_run_success_rate: 98.5,
            total_runs: 245,
            total_records_scraped: 21450
          },
          {
            scraper_name: 'fpds',
            display_name: 'FPDS Contracts',
            description: 'Federal Procurement Data System contract records',
            is_enabled: true,
            is_running: false,
            schedule_description: 'Daily at 10:00 AM',
            last_run_at: new Date(Date.now() - 172800000).toISOString(),
            last_run_status: 'completed',
            last_run_records: 1250,
            last_run_success_rate: 99.2,
            total_runs: 180,
            total_records_scraped: 225000
          },
          {
            scraper_name: 'sam_gov',
            display_name: 'SAM.gov Opportunities',
            description: 'Active solicitations from SAM.gov',
            is_enabled: false,
            is_running: false,
            schedule_description: 'Daily at 8:00 AM',
            last_run_at: null,
            last_run_status: null,
            last_run_records: null,
            last_run_success_rate: null,
            total_runs: 0,
            total_records_scraped: 0
          },
          {
            scraper_name: 'sbir',
            display_name: 'SBIR/STTR Topics',
            description: 'Small Business Innovation Research topics',
            is_enabled: true,
            is_running: false,
            schedule_description: 'Weekly on Monday at 6:00 AM',
            last_run_at: new Date(Date.now() - 604800000).toISOString(),
            last_run_status: 'completed',
            last_run_records: 342,
            last_run_success_rate: 100,
            total_runs: 52,
            total_records_scraped: 17784
          }
        ]
        
        setScrapers(mockScrapers)

        // Mock user stats
        setUserStats({
          total_users: 127,
          active_users: 115,
          admin_users: 3,
          active_last_7_days: 45,
          active_last_30_days: 89,
          new_users_7_days: 12,
          new_users_30_days: 34
        })

        setLoading(false)
      } catch (error) {
        console.error('Error fetching data:', error)
        setLoading(false)
      }
    }

    if (user && isAdmin) {
      fetchData()
    }
  }, [user, isAdmin])

  // Trigger manual scrape
  const triggerScrape = async (scraperName: string) => {
    // Update UI to show running
    setScrapers(prev => prev.map(s => 
      s.scraper_name === scraperName 
        ? { ...s, is_running: true }
        : s
    ))

    // In reality, this would call an API to trigger the scraper
    alert(`Scraper "${scraperName}" triggered! (This is a demo - connect to your API)`)

    // Simulate completion after 3 seconds
    setTimeout(() => {
      setScrapers(prev => prev.map(s => 
        s.scraper_name === scraperName 
          ? { 
              ...s, 
              is_running: false, 
              last_run_at: new Date().toISOString(),
              last_run_status: 'completed'
            }
          : s
      ))
    }, 3000)
  }

  if (authLoading || loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: isDark ? '#111827' : '#F9FAFB',
        color: isDark ? '#F9FAFB' : '#1F2937'
      }}>
        Loading...
      </div>
    )
  }

  if (!user || !isAdmin) {
    return null
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: isDark ? '#111827' : '#F9FAFB'
    }}>
      {/* Header */}
      <header style={{
        background: isDark ? '#1F2937' : '#FFFFFF',
        borderBottom: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <img src="/logo.png" alt="PropShop.ai" style={{ height: '40px' }} />
          <div>
            <h1 style={{
              fontSize: '1.25rem',
              fontWeight: '700',
              color: isDark ? '#F9FAFB' : '#1F2937',
              margin: 0
            }}>
              Admin Dashboard
            </h1>
            <span style={{
              fontSize: '0.75rem',
              color: '#A855F7',
              fontWeight: '500'
            }}>
              🔒 Admin Access Only
            </span>
          </div>
        </div>

        <button
          onClick={() => router.push('/')}
          style={{
            padding: '0.5rem 1rem',
            background: 'transparent',
            border: `1px solid ${isDark ? '#374151' : '#D1D5DB'}`,
            borderRadius: '6px',
            color: isDark ? '#F9FAFB' : '#1F2937',
            cursor: 'pointer',
            fontSize: '0.875rem'
          }}
        >
          ← Back to App
        </button>
      </header>

      {/* Tabs */}
      <div style={{
        borderBottom: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
        background: isDark ? '#1F2937' : '#FFFFFF',
        padding: '0 2rem'
      }}>
        <div style={{ display: 'flex', gap: '2rem' }}>
          {(['scrapers', 'users', 'emails'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '1rem 0',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab 
                  ? '2px solid #A855F7' 
                  : '2px solid transparent',
                color: activeTab === tab 
                  ? '#A855F7' 
                  : (isDark ? '#9CA3AF' : '#6B7280'),
                fontWeight: '500',
                fontSize: '0.875rem',
                cursor: 'pointer',
                textTransform: 'capitalize'
              }}
            >
              {tab === 'scrapers' && '🔄 '}
              {tab === 'users' && '👥 '}
              {tab === 'emails' && '📧 '}
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main style={{ padding: '2rem' }}>
        {activeTab === 'scrapers' && (
          <div>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              color: isDark ? '#F9FAFB' : '#1F2937',
              marginBottom: '1.5rem'
            }}>
              Scraper Management
            </h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
              gap: '1.5rem'
            }}>
              {scrapers.map(scraper => (
                <div
                  key={scraper.scraper_name}
                  style={{
                    background: isDark ? '#1F2937' : '#FFFFFF',
                    border: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
                    borderRadius: '12px',
                    padding: '1.5rem',
                    boxShadow: isDark 
                      ? '0 2px 8px rgba(0, 0, 0, 0.2)' 
                      : '0 2px 8px rgba(0, 0, 0, 0.05)'
                  }}
                >
                  {/* Header */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '1rem'
                  }}>
                    <div>
                      <h3 style={{
                        fontSize: '1rem',
                        fontWeight: '600',
                        color: isDark ? '#F9FAFB' : '#1F2937',
                        margin: '0 0 0.25rem 0'
                      }}>
                        {scraper.display_name}
                      </h3>
                      <p style={{
                        fontSize: '0.75rem',
                        color: isDark ? '#9CA3AF' : '#6B7280',
                        margin: 0
                      }}>
                        {scraper.description}
                      </p>
                    </div>
                    
                    {/* Status badge */}
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      background: scraper.is_running
                        ? 'rgba(59, 130, 246, 0.1)'
                        : scraper.is_enabled
                          ? 'rgba(34, 197, 94, 0.1)'
                          : 'rgba(107, 114, 128, 0.1)',
                      color: scraper.is_running
                        ? '#3B82F6'
                        : scraper.is_enabled
                          ? '#22C55E'
                          : '#6B7280'
                    }}>
                      {scraper.is_running ? '● Running' : scraper.is_enabled ? '● Active' : '○ Disabled'}
                    </span>
                  </div>

                  {/* Stats */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '1rem',
                    marginBottom: '1rem',
                    padding: '1rem',
                    background: isDark ? '#111827' : '#F9FAFB',
                    borderRadius: '8px'
                  }}>
                    <div>
                      <div style={{
                        fontSize: '0.75rem',
                        color: isDark ? '#9CA3AF' : '#6B7280',
                        marginBottom: '0.25rem'
                      }}>
                        Last Run
                      </div>
                      <div style={{
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: isDark ? '#F9FAFB' : '#1F2937'
                      }}>
                        {scraper.last_run_at 
                          ? new Date(scraper.last_run_at).toLocaleDateString()
                          : 'Never'}
                      </div>
                    </div>
                    <div>
                      <div style={{
                        fontSize: '0.75rem',
                        color: isDark ? '#9CA3AF' : '#6B7280',
                        marginBottom: '0.25rem'
                      }}>
                        Success Rate
                      </div>
                      <div style={{
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: scraper.last_run_success_rate && scraper.last_run_success_rate > 90 
                          ? '#22C55E' 
                          : isDark ? '#F9FAFB' : '#1F2937'
                      }}>
                        {scraper.last_run_success_rate 
                          ? `${scraper.last_run_success_rate.toFixed(1)}%`
                          : 'N/A'}
                      </div>
                    </div>
                    <div>
                      <div style={{
                        fontSize: '0.75rem',
                        color: isDark ? '#9CA3AF' : '#6B7280',
                        marginBottom: '0.25rem'
                      }}>
                        Total Records
                      </div>
                      <div style={{
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: isDark ? '#F9FAFB' : '#1F2937'
                      }}>
                        {scraper.total_records_scraped.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Schedule */}
                  <div style={{
                    fontSize: '0.75rem',
                    color: isDark ? '#9CA3AF' : '#6B7280',
                    marginBottom: '1rem'
                  }}>
                    📅 {scraper.schedule_description}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => triggerScrape(scraper.scraper_name)}
                      disabled={scraper.is_running || !scraper.is_enabled}
                      style={{
                        flex: 1,
                        padding: '0.5rem 1rem',
                        borderRadius: '6px',
                        border: 'none',
                        background: scraper.is_running || !scraper.is_enabled
                          ? (isDark ? '#374151' : '#E5E7EB')
                          : 'linear-gradient(135deg, #A855F7 0%, #7C3AED 100%)',
                        color: scraper.is_running || !scraper.is_enabled
                          ? (isDark ? '#9CA3AF' : '#6B7280')
                          : '#FFFFFF',
                        fontWeight: '500',
                        fontSize: '0.875rem',
                        cursor: scraper.is_running || !scraper.is_enabled 
                          ? 'not-allowed' 
                          : 'pointer'
                      }}
                    >
                      {scraper.is_running ? 'Running...' : 'Run Now'}
                    </button>
                    <button
                      style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '6px',
                        border: `1px solid ${isDark ? '#374151' : '#D1D5DB'}`,
                        background: 'transparent',
                        color: isDark ? '#D1D5DB' : '#374151',
                        fontSize: '0.875rem',
                        cursor: 'pointer'
                      }}
                    >
                      Settings
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              color: isDark ? '#F9FAFB' : '#1F2937',
              marginBottom: '1.5rem'
            }}>
              User Management
            </h2>

            {/* User Stats Cards */}
            {userStats && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '1rem',
                marginBottom: '2rem'
              }}>
                <StatCard 
                  label="Total Users" 
                  value={userStats.total_users} 
                  isDark={isDark} 
                />
                <StatCard 
                  label="Active Users" 
                  value={userStats.active_users} 
                  isDark={isDark} 
                  color="#22C55E"
                />
                <StatCard 
                  label="Admins" 
                  value={userStats.admin_users} 
                  isDark={isDark} 
                  color="#A855F7"
                />
                <StatCard 
                  label="Active (7 days)" 
                  value={userStats.active_last_7_days} 
                  isDark={isDark} 
                />
                <StatCard 
                  label="New (30 days)" 
                  value={userStats.new_users_30_days} 
                  isDark={isDark} 
                  color="#3B82F6"
                />
              </div>
            )}

            <div style={{
              background: isDark ? '#1F2937' : '#FFFFFF',
              border: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
              borderRadius: '12px',
              padding: '2rem',
              textAlign: 'center',
              color: isDark ? '#9CA3AF' : '#6B7280'
            }}>
              <p>User table coming soon...</p>
              <p style={{ fontSize: '0.875rem' }}>
                Deploy the auth-schema.sql to enable user management
              </p>
            </div>
          </div>
        )}

        {activeTab === 'emails' && (
          <div>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              color: isDark ? '#F9FAFB' : '#1F2937',
              marginBottom: '1.5rem'
            }}>
              Email Management
            </h2>

            <div style={{
              background: isDark ? '#1F2937' : '#FFFFFF',
              border: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
              borderRadius: '12px',
              padding: '2rem',
              textAlign: 'center',
              color: isDark ? '#9CA3AF' : '#6B7280'
            }}>
              <p>📧 Global email system coming soon...</p>
              <p style={{ fontSize: '0.875rem' }}>
                Send announcements and updates to all users
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

function StatCard({ 
  label, 
  value, 
  isDark, 
  color 
}: { 
  label: string
  value: number
  isDark: boolean
  color?: string
}) {
  return (
    <div style={{
      background: isDark ? '#1F2937' : '#FFFFFF',
      border: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
      borderRadius: '12px',
      padding: '1.25rem'
    }}>
      <div style={{
        fontSize: '0.75rem',
        color: isDark ? '#9CA3AF' : '#6B7280',
        marginBottom: '0.5rem'
      }}>
        {label}
      </div>
      <div style={{
        fontSize: '1.5rem',
        fontWeight: '700',
        color: color || (isDark ? '#F9FAFB' : '#1F2937')
      }}>
        {value.toLocaleString()}
      </div>
    </div>
  )
}

