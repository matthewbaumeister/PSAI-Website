"use client"

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'

export default function PlatformPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '64px',
            height: '64px',
            border: '4px solid #8b5cf6',
            borderTop: '4px solid transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p style={{ color: '#c4b5fd', fontSize: '18px' }}>Loading Platform...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
      color: '#f8fafc'
    }}>
      {/* Header */}
      <div style={{
        background: 'rgba(30, 41, 59, 0.8)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(148, 163, 184, 0.2)',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '24px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px'
            }}>
              <Link href="/" style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '12px',
                padding: '12px 20px',
                color: '#ffffff',
                textDecoration: 'none',
                fontWeight: '600',
                fontSize: '16px',
                transition: 'all 0.2s ease'
              }}>
                ← Back to Main Site
              </Link>
              <h1 style={{
                fontSize: '32px',
                fontWeight: '700',
                background: 'linear-gradient(135deg, #ffffff 0%, #c4b5fd 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                margin: 0
              }}>
                PS.AI Platform
              </h1>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px'
            }}>
              <span style={{
                color: '#94a3b8',
                fontSize: '14px'
              }}>
                Welcome, {user.firstName}!
              </span>
              <Link href="/" style={{
                background: 'rgba(148, 163, 184, 0.1)',
                border: '1px solid rgba(148, 163, 184, 0.3)',
                borderRadius: '8px',
                padding: '8px 16px',
                color: '#cbd5e1',
                textDecoration: 'none',
                fontSize: '14px',
                transition: 'all 0.2s ease'
              }}>
                Sign Out
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '48px 24px'
      }}>
        {/* Hero Section */}
        <div style={{
          textAlign: 'center',
          marginBottom: '64px'
        }}>
          <h2 style={{
            fontSize: '48px',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #ffffff 0%, #c4b5fd 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: '0 0 24px 0',
            lineHeight: '1.2'
          }}>
            Welcome to the Future of Defense Intelligence
          </h2>
          <p style={{
            fontSize: '20px',
            color: '#cbd5e1',
            maxWidth: '600px',
            margin: '0 auto 32px',
            lineHeight: '1.6'
          }}>
            Access cutting-edge AI-powered tools and comprehensive defense opportunity databases to accelerate your success in government contracting.
          </p>
        </div>

        {/* Tools Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '32px',
          marginBottom: '64px'
        }}>
          {/* DSIP Smart Search Tool */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
            borderRadius: '20px',
            padding: '32px',
            border: '1px solid rgba(102, 126, 234, 0.2)',
            transition: 'all 0.3s ease',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-8px)';
            e.currentTarget.style.boxShadow = '0 20px 40px rgba(102, 126, 234, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
          onClick={() => router.push('/dsip-search')}
          >
            <div style={{
              width: '64px',
              height: '64px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '24px',
              fontSize: '28px'
            }}>
              🔍
            </div>
            <h3 style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#ffffff',
              margin: '0 0 16px 0'
            }}>
              DSIP Smart Search
            </h3>
            <p style={{
              color: '#cbd5e1',
              fontSize: '16px',
              lineHeight: '1.6',
              margin: '0 0 24px 0'
            }}>
              Access over 33,000 defense SBIR/STTR opportunities with AI-powered search, advanced filtering, and real-time updates.
            </p>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              marginBottom: '24px'
            }}>
              <span style={{
                background: 'rgba(102, 126, 234, 0.2)',
                color: '#a5b4fc',
                padding: '6px 12px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: '500'
              }}>
                AI Search
              </span>
              <span style={{
                background: 'rgba(118, 75, 162, 0.2)',
                color: '#c4b5fd',
                padding: '6px 12px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: '500'
              }}>
                Real-time Data
              </span>
              <span style={{
                background: 'rgba(34, 197, 94, 0.2)',
                color: '#86efac',
                padding: '6px 12px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: '500'
              }}>
                Advanced Filters
              </span>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              color: '#a5b4fc',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              Launch Tool →
            </div>
          </div>

          {/* Coming Soon Tools */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(148, 163, 184, 0.1) 0%, rgba(71, 85, 105, 0.1) 100%)',
            borderRadius: '20px',
            padding: '32px',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            opacity: 0.6
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              background: 'rgba(148, 163, 184, 0.2)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '24px',
              fontSize: '28px'
            }}>
              🚧
            </div>
            <h3 style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#94a3b8',
              margin: '0 0 16px 0'
            }}>
              AI Contract Analyzer
            </h3>
            <p style={{
              color: '#94a3b8',
              fontSize: '16px',
              lineHeight: '1.6',
              margin: '0 0 24px 0'
            }}>
              Coming soon: AI-powered contract analysis and opportunity matching based on your company's capabilities and past performance.
            </p>
            <div style={{
              background: 'rgba(148, 163, 184, 0.1)',
              color: '#94a3b8',
              padding: '8px 16px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '500',
              textAlign: 'center'
            }}>
              Coming Q1 2025
            </div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, rgba(148, 163, 184, 0.1) 0%, rgba(71, 85, 105, 0.1) 100%)',
            borderRadius: '20px',
            padding: '32px',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            opacity: 0.6
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              background: 'rgba(148, 163, 184, 0.2)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '24px',
              fontSize: '28px'
            }}>
              🚧
            </div>
            <h3 style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#94a3b8',
              margin: '0 0 16px 0'
            }}>
              Proposal Generator
            </h3>
            <p style={{
              color: '#94a3b8',
              fontSize: '16px',
              lineHeight: '1.6',
              margin: '0 0 24px 0'
            }}>
              Coming soon: AI-assisted proposal generation with templates, compliance checking, and automated formatting for government contracts.
            </p>
            <div style={{
              background: 'rgba(148, 163, 184, 0.1)',
              color: '#94a3b8',
              padding: '8px 16px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '500',
              textAlign: 'center'
            }}>
              Coming Q2 2025
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
          borderRadius: '20px',
          padding: '48px',
          border: '1px solid rgba(102, 126, 234, 0.2)',
          textAlign: 'center'
        }}>
          <h3 style={{
            fontSize: '32px',
            fontWeight: '700',
            color: '#ffffff',
            margin: '0 0 32px 0'
          }}>
            Platform Statistics
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '32px'
          }}>
            <div>
              <div style={{
                fontSize: '48px',
                fontWeight: '800',
                color: '#a5b4fc',
                marginBottom: '8px'
              }}>
                33,000+
              </div>
              <div style={{
                color: '#cbd5e1',
                fontSize: '16px'
              }}>
                Defense Opportunities
              </div>
            </div>
            <div>
              <div style={{
                fontSize: '48px',
                fontWeight: '800',
                color: '#a5b4fc',
                marginBottom: '8px'
              }}>
                24/7
              </div>
              <div style={{
                color: '#cbd5e1',
                fontSize: '16px'
              }}>
                Data Updates
              </div>
            </div>
            <div>
              <div style={{
                fontSize: '48px',
                fontWeight: '800',
                color: '#a5b4fc',
                marginBottom: '8px'
              }}>
                AI-Powered
              </div>
              <div style={{
                color: '#cbd5e1',
                fontSize: '16px'
              }}>
                Search & Analysis
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
