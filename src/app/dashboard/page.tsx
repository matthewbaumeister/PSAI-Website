'use client'

import { DashboardLayout } from "@/components/layout/dashboard-layout"

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div style={{
        minHeight: '100vh',
        color: 'white',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        lineHeight: 1.6,
        margin: 0,
        padding: 0,
        boxSizing: 'border-box'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '4rem 1rem'
        }}>
          {/* Header Section */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              height: '1px',
              width: '48px',
              background: 'linear-gradient(to right, #9AF23A, #2D5BFF)'
            }}></div>
            <span style={{
              fontSize: '0.875rem',
              fontWeight: 500,
              color: '#9AF23A',
              textTransform: 'uppercase',
              letterSpacing: '0.1em'
            }}>
              DASHBOARD
            </span>
          </div>
          
          <h1 style={{
            fontSize: '3.5rem',
            fontWeight: 800,
            lineHeight: 1.1,
            marginBottom: '1.5rem',
            color: 'white'
          }}>
            Welcome to your
            <span style={{
              background: 'linear-gradient(to right, #2D5BFF, #9AF23A, #2D5BFF)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              display: 'block'
            }}>
              Prop Shop AI Dashboard
            </span>
          </h1>
          
          <p style={{
            color: '#9CA3AF',
            fontSize: '1.125rem',
            lineHeight: 1.75,
            marginBottom: '3rem'
          }}>
            Here&apos;s your proposal generation overview and AI insights. Get ready to win more contracts.
          </p>

          {/* Stats Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem',
            marginBottom: '3rem'
          }}>
            {/* Active Proposals Card */}
            <div style={{
              padding: '2rem',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '1rem',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)'
              e.currentTarget.style.borderColor = 'rgba(154, 242, 58, 0.3)'
              e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.3)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
              e.currentTarget.style.boxShadow = 'none'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                marginBottom: '1rem'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '0.75rem',
                  background: 'linear-gradient(135deg, rgba(45, 91, 255, 0.2), rgba(154, 242, 58, 0.2))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem'
                }}>📋</div>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#9CA3AF', margin: 0 }}>Active Proposals</h3>
                  <p style={{ fontSize: '2.5rem', fontWeight: 800, color: 'white', margin: 0 }}>-</p>
                </div>
              </div>
              <div style={{
                padding: '0.5rem 1rem',
                background: 'rgba(154, 242, 58, 0.1)',
                border: '1px solid rgba(154, 242, 58, 0.2)',
                borderRadius: '0.5rem',
                textAlign: 'center'
              }}>
                <span style={{ color: '#9AF23A', fontSize: '0.875rem', fontWeight: 500 }}>No data yet</span>
              </div>
            </div>

            {/* Win Rate Card */}
            <div style={{
              padding: '2rem',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '1rem',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)'
              e.currentTarget.style.borderColor = 'rgba(154, 242, 58, 0.3)'
              e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.3)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
              e.currentTarget.style.boxShadow = 'none'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                marginBottom: '1rem'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '0.75rem',
                  background: 'linear-gradient(135deg, rgba(154, 242, 58, 0.2), rgba(45, 91, 255, 0.2))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem'
                }}>🎯</div>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#9CA3AF', margin: 0 }}>Win Rate</h3>
                  <p style={{ fontSize: '2.5rem', fontWeight: 800, color: 'white', margin: 0 }}>-</p>
                </div>
              </div>
              <div style={{
                padding: '0.5rem 1rem',
                background: 'rgba(154, 242, 58, 0.1)',
                border: '1px solid rgba(154, 242, 58, 0.2)',
                borderRadius: '0.5rem',
                textAlign: 'center'
              }}>
                <span style={{ color: '#9AF23A', fontSize: '0.875rem', fontWeight: 500 }}>No data yet</span>
              </div>
            </div>

            {/* Contract Value Card */}
            <div style={{
              padding: '2rem',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '1rem',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)'
              e.currentTarget.style.borderColor = 'rgba(154, 242, 58, 0.3)'
              e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.3)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
              e.currentTarget.style.boxShadow = 'none'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                marginBottom: '1rem'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '0.75rem',
                  background: 'linear-gradient(135deg, rgba(45, 91, 255, 0.2), rgba(154, 242, 58, 0.2))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem'
                }}>💰</div>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#9CA3AF', margin: 0 }}>Contract Value</h3>
                  <p style={{ fontSize: '2.5rem', fontWeight: 800, color: 'white', margin: 0 }}>-</p>
                </div>
              </div>
              <div style={{
                padding: '0.5rem 1rem',
                background: 'rgba(154, 242, 58, 0.1)',
                border: '1px solid rgba(154, 242, 58, 0.2)',
                borderRadius: '0.5rem',
                textAlign: 'center'
              }}>
                <span style={{ color: '#9AF23A', fontSize: '0.875rem', fontWeight: 500 }}>No data yet</span>
              </div>
            </div>

            {/* Compliance Score Card */}
            <div style={{
              padding: '2rem',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '1rem',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)'
              e.currentTarget.style.borderColor = 'rgba(154, 242, 58, 0.3)'
              e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.3)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
              e.currentTarget.style.boxShadow = 'none'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                marginBottom: '1rem'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '0.75rem',
                  background: 'linear-gradient(135deg, rgba(154, 242, 58, 0.2), rgba(45, 91, 255, 0.2))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem'
                }}>✅</div>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#9CA3AF', margin: 0 }}>Compliance Score</h3>
                  <p style={{ fontSize: '2.5rem', fontWeight: 800, color: 'white', margin: 0 }}>-</p>
                </div>
              </div>
              <div style={{
                padding: '0.5rem 1rem',
                background: 'rgba(154, 242, 58, 0.1)',
                border: '1px solid rgba(154, 242, 58, 0.2)',
                borderRadius: '0.5rem',
                textAlign: 'center'
              }}>
                <span style={{ color: '#9AF23A', fontSize: '0.875rem', fontWeight: 500 }}>No data yet</span>
              </div>
            </div>
          </div>

          {/* Content Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
            gap: '2rem',
            marginBottom: '3rem'
          }}>
            {/* Recent Proposals Card */}
            <div style={{
              padding: '2rem',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '1rem',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)'
              e.currentTarget.style.borderColor = 'rgba(154, 242, 58, 0.3)'
              e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.3)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
              e.currentTarget.style.boxShadow = 'none'
            }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'white', marginBottom: '1.5rem' }}>Recent Proposals</h3>
              <div style={{
                textAlign: 'center',
                padding: '3rem 1rem',
                color: '#9CA3AF'
              }}>
                <p style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>No proposals yet</p>
                <p style={{ fontSize: '0.875rem' }}>Create your first proposal to get started</p>
              </div>
            </div>

            {/* AI Insights Card */}
            <div style={{
              padding: '2rem',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '1rem',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)'
              e.currentTarget.style.borderColor = 'rgba(154, 242, 58, 0.3)'
              e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.3)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
              e.currentTarget.style.boxShadow = 'none'
            }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'white', marginBottom: '1.5rem' }}>AI Insights</h3>
              <div style={{
                textAlign: 'center',
                padding: '3rem 1rem',
                color: '#9CA3AF'
              }}>
                <p style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>No insights yet</p>
                <p style={{ fontSize: '0.875rem' }}>AI insights will appear as you use the platform</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{
            padding: '2rem',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '1rem',
            backdropFilter: 'blur(10px)'
          }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'white', marginBottom: '2rem' }}>Quick Actions</h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem'
            }}>
              <button style={{
                padding: '1.5rem',
                background: 'rgba(45, 91, 255, 0.1)',
                border: '1px solid rgba(45, 91, 255, 0.2)',
                borderRadius: '0.75rem',
                color: 'white',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.75rem'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.borderColor = 'rgba(45, 91, 255, 0.4)'
                e.currentTarget.style.background = 'rgba(45, 91, 255, 0.15)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.borderColor = 'rgba(45, 91, 255, 0.2)'
                e.currentTarget.style.background = 'rgba(45, 91, 255, 0.1)'
              }}>
                <span style={{ fontSize: '2rem' }}>📝</span>
                <span>New Proposal</span>
              </button>

              <button style={{
                padding: '1.5rem',
                background: 'rgba(154, 242, 58, 0.1)',
                border: '1px solid rgba(154, 242, 58, 0.2)',
                borderRadius: '0.75rem',
                color: 'white',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.75rem'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.borderColor = 'rgba(154, 242, 58, 0.4)'
                e.currentTarget.style.background = 'rgba(154, 242, 58, 0.15)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.borderColor = 'rgba(154, 242, 58, 0.2)'
                e.currentTarget.style.background = 'rgba(154, 242, 58, 0.1)'
              }}>
                <span style={{ fontSize: '2rem' }}>🔍</span>
                <span>Search Contracts</span>
              </button>

              <button style={{
                padding: '1.5rem',
                background: 'rgba(45, 91, 255, 0.1)',
                border: '1px solid rgba(45, 91, 255, 0.2)',
                borderRadius: '0.75rem',
                color: 'white',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.75rem'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.borderColor = 'rgba(45, 91, 255, 0.4)'
                e.currentTarget.style.background = 'rgba(45, 91, 255, 0.15)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.borderColor = 'rgba(45, 91, 255, 0.2)'
                e.currentTarget.style.background = 'rgba(45, 91, 255, 0.1)'
              }}>
                <span style={{ fontSize: '2rem' }}>📊</span>
                <span>Analytics</span>
              </button>

                             <button style={{
                 padding: '1.5rem',
                 background: 'rgba(154, 242, 58, 0.1)',
                 border: '1px solid rgba(154, 242, 58, 0.2)',
                 borderRadius: '0.75rem',
                 color: 'white',
                 fontSize: '1rem',
                 fontWeight: 600,
                 cursor: 'pointer',
                 transition: 'all 0.3s ease',
                 display: 'flex',
                 flexDirection: 'column',
                 alignItems: 'center',
                 gap: '0.75rem'
               }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.borderColor = 'rgba(154, 242, 58, 0.4)'
                e.currentTarget.style.background = 'rgba(154, 242, 58, 0.15)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.borderColor = 'rgba(154, 242, 58, 0.2)'
                e.currentTarget.style.background = 'rgba(154, 242, 58, 0.1)'
              }}>
                <span style={{ fontSize: '2rem' }}>⚙️</span>
                <span>Settings</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
