"use client"

import Link from 'next/link'

interface Solution {
  id: string
  title: string
  description: string
  features: string[]
  icon: string
  color: string
  href: string
  status: 'available' | 'coming-soon'
}

const solutions: Solution[] = [
  {
    id: 'ps-ai-search',
    title: 'PS.AI Search',
    description: 'AI-powered opportunity discovery and market research platform that helps you find and analyze government contracts, RFPs, and business opportunities.',
    features: [
      'Advanced search with AI filters',
      'Real-time opportunity alerts',
      'Market analysis and insights',
      'Competitor tracking',
      'Export and reporting tools'
    ],
    icon: '🔍',
    color: 'from-blue-500 to-cyan-500',
    href: '/products/search',
    status: 'available'
  },
  {
    id: 'ps-ai-write',
    title: 'PS.AI Write',
    description: 'Expert proposal writing services built on 15+ years of federal contracting expertise. Get PhD-level responses that are proven compliant and aligned with solution intent.',
    features: [
      'Expert proposal writing',
      'Federal compliance expertise',
      'Technical approach development',
      'Past performance narratives',
      'Quality assurance review'
    ],
    icon: '✍️',
    color: 'from-green-500 to-emerald-500',
    href: '/products/write',
    status: 'available'
  },
  {
    id: 'ps-ai-compliance',
    title: 'PS.AI Compliance',
    description: 'Comprehensive compliance management system that ensures your proposals and processes meet all federal requirements and industry standards.',
    features: [
      'FAR clause integration',
      'RFP requirement mapping',
      'Compliance checklists',
      'Audit trail tracking',
      'Regulatory updates'
    ],
    icon: '✅',
    color: 'from-purple-500 to-pink-500',
    href: '/products/compliance',
    status: 'coming-soon'
  },
  {
    id: 'ps-ai-market-research',
    title: 'PS.AI Market Research',
    description: 'Data-driven market intelligence platform that provides insights into government spending patterns, competitor analysis, and market opportunities.',
    features: [
      'Government spending analysis',
      'Competitor intelligence',
      'Market trend reports',
      'Opportunity forecasting',
      'Custom research reports'
    ],
    icon: '📊',
    color: 'from-orange-500 to-red-500',
    href: '/products/market-research',
    status: 'coming-soon'
  },
  {
    id: 'ps-ai-small-business',
    title: 'PS.AI Small Business',
    description: 'Specialized platform designed for small businesses, 8(a), WOSB, HUBZone, and other set-aside programs to maximize their competitive advantage.',
    features: [
      'Set-aside opportunity alerts',
      'Small business certification support',
      'Teaming partner matching',
      'Capacity building resources',
      'Success story templates'
    ],
    icon: '🏢',
    color: 'from-indigo-500 to-blue-500',
    href: '/small-business-success-hub',
    status: 'available'
  }
]

export default function SolutionsPage() {
  return (
    <div className="page-content" style={{
      minHeight: '100vh',
      color: 'var(--text-primary)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      {/* Hero Section */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(45, 91, 255, 0.1), rgba(154, 242, 58, 0.1))',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        padding: '6rem 0 4rem 0'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 1rem',
          textAlign: 'center'
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '2rem',
            padding: '0.5rem 1rem',
            background: 'rgba(154, 242, 58, 0.1)',
            border: '1px solid rgba(154, 242, 58, 0.2)',
            borderRadius: '2rem',
            fontSize: '0.875rem',
            fontWeight: 500,
            color: 'var(--accent-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em'
          }}>
            Our Solutions
          </div>
          
          <h1 style={{
            fontSize: '4rem',
            fontWeight: 800,
            lineHeight: 1.1,
            marginBottom: '1.5rem',
            background: 'linear-gradient(to right, #ffffff, #9AF23A)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Complete Procurement Solutions
          </h1>
          
          <p style={{
            fontSize: '1.5rem',
            color: 'var(--text-secondary)',
            marginBottom: '2rem',
            maxWidth: '800px',
            marginLeft: 'auto',
            marginRight: 'auto'
          }}>
            From opportunity discovery to proposal submission, our AI-powered tools give you everything you need to win more government contracts.
          </p>
        </div>
      </div>

      {/* Solutions Grid */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '4rem 1rem'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '2rem',
          marginBottom: '4rem'
        }}>
          {solutions.map((solution) => (
            <div key={solution.id} style={{
              background: 'var(--bg-primary)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '1rem',
              padding: '2rem',
              transition: 'all 0.3s ease',
              cursor: solution.status === 'available' ? 'pointer' : 'default'
            }}
            onMouseEnter={(e) => {
              if (solution.status === 'available') {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.borderColor = 'rgba(154, 242, 58, 0.5)'
                e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.3)'
              }
            }}
            onMouseLeave={(e) => {
              if (solution.status === 'available') {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                e.currentTarget.style.boxShadow = 'none'
              }
            }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                marginBottom: '1.5rem'
              }}>
                <div style={{
                  fontSize: '2rem',
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${solution.color.includes('blue') ? '#2D5BFF' : solution.color.includes('green') ? '#9AF23A' : solution.color.includes('purple') ? '#8B5CF6' : solution.color.includes('orange') ? '#FF7A29' : '#6366F1'}, ${solution.color.includes('blue') ? '#06B6D4' : solution.color.includes('green') ? '#10B981' : solution.color.includes('purple') ? '#EC4899' : solution.color.includes('orange') ? '#EF4444' : '#3B82F6'})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 'bold'
                }}>
                  {solution.icon}
                </div>
                <div>
                  <h3 style={{
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    marginBottom: '0.25rem'
                  }}>
                    {solution.title}
                  </h3>
                  {solution.status === 'coming-soon' && (
                    <span style={{
                      background: 'rgba(154, 242, 58, 0.1)',
                      color: '#9AF23A',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '1rem',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      textTransform: 'uppercase'
                    }}>
                      Coming Soon
                    </span>
                  )}
                </div>
              </div>
              
              <p style={{
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
                marginBottom: '1.5rem'
              }}>
                {solution.description}
              </p>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'var(--accent-secondary)',
                  marginBottom: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Key Features
                </h4>
                <ul style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0
                }}>
                  {solution.features.map((feature, index) => (
                    <li key={index} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '0.5rem',
                      fontSize: '0.875rem',
                      color: 'var(--text-secondary)'
                    }}>
                      <div style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: 'var(--accent-secondary)',
                        flexShrink: 0
                      }}></div>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              
              {solution.status === 'available' ? (
                <Link href={solution.href} style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  background: 'linear-gradient(135deg, #2D5BFF, #9AF23A)',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '0.5rem',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)'
                  e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.3)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
                >
                  Learn More
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Link>
              ) : (
                <button disabled style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: 'rgba(255, 255, 255, 0.5)',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontWeight: 600,
          fontSize: '0.875rem',
          cursor: 'not-allowed'
                }}>
                  Coming Soon
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          background: 'var(--bg-primary)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '1rem'
        }}>
          <h2 style={{
            fontSize: '2rem',
            fontWeight: 700,
            marginBottom: '1rem'
          }}>
            Ready to Get Started?
          </h2>
          <p style={{
            color: 'var(--text-secondary)',
            fontSize: '1.125rem',
            marginBottom: '2rem',
            maxWidth: '600px',
            marginLeft: 'auto',
            marginRight: 'auto'
          }}>
            Choose the solution that best fits your needs, or contact our team for a personalized consultation.
          </p>
          <div style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <Link href="/contact" style={{
              padding: '1rem 2rem',
              background: 'linear-gradient(135deg, #2D5BFF, #9AF23A)',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '0.5rem',
              fontWeight: 600,
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.3)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
            }}
            >
              Contact Our Team
            </Link>
            <Link href="/book-demo" style={{
              padding: '1rem 2rem',
              background: 'transparent',
              color: 'var(--accent-primary)',
              textDecoration: 'none',
              borderRadius: '0.5rem',
              fontWeight: 600,
              border: '2px solid var(--accent-primary)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--accent-primary)'
              e.currentTarget.style.color = 'white'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = 'var(--accent-primary)'
            }}
            >
              Book a Demo
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
