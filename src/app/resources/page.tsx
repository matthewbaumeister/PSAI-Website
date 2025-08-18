'use client'

import Link from 'next/link'

export default function ResourcesPage() {
  const resources = [
    {
      category: 'Getting Started',
      items: [
        {
          title: 'Government Contracting 101',
          description: 'Essential guide for first-time government contractors',
          link: '/guides/getting-started',
          icon: '📚'
        },
        {
          title: 'Small Business Certification',
          description: 'Steps to get certified as a small business',
          link: '/guides/small-business',
          icon: '🏢'
        },
        {
          title: 'SAM Registration Guide',
          description: 'Complete System for Award Management registration',
          link: '/guides/sam-registration',
          icon: '📋'
        }
      ]
    },
    {
      category: 'Proposal Development',
      items: [
        {
          title: 'RFP Analysis Framework',
          description: 'How to analyze and respond to RFPs effectively',
          link: '/guides/rfp-analysis',
          icon: '🔍'
        },
        {
          title: 'Technical Proposal Writing',
          description: 'Best practices for technical proposal sections',
          link: '/guides/technical-proposals',
          icon: '✍️'
        },
        {
          title: 'Cost Proposal Strategies',
          description: 'Pricing strategies for competitive proposals',
          link: '/guides/cost-proposals',
          icon: '💰'
        }
      ]
    },
    {
      category: 'Compliance & Regulations',
      items: [
        {
          title: 'FAR Compliance Guide',
          description: 'Federal Acquisition Regulation compliance',
          link: '/guides/far-compliance',
          icon: '⚖️'
        },
        {
          title: 'Cybersecurity Requirements',
          description: 'CMMC and cybersecurity compliance for contractors',
          link: '/guides/cybersecurity',
          icon: '🔒'
        },
        {
          title: 'Labor Laws & Regulations',
          description: 'Davis-Bacon Act and prevailing wage requirements',
          link: '/guides/labor-laws',
          icon: '👷'
        }
      ]
    },
    {
      category: 'Tools & Templates',
      items: [
        {
          title: 'Proposal Templates',
          description: 'Ready-to-use proposal templates and examples',
          link: '/templates/proposals',
          icon: '📄'
        },
        {
          title: 'Cost Estimation Tools',
          description: 'Spreadsheets and calculators for cost proposals',
          link: '/tools/cost-estimation',
          icon: '🧮'
        },
        {
          title: 'Compliance Checklists',
          description: 'Checklists for various compliance requirements',
          link: '/tools/checklists',
          icon: '✅'
        }
      ]
    }
  ]

  return (
    <div className="page-content" style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0B1220 0%, #1E293B 100%)',
      padding: '2rem 1rem'
    }}>
      {/* Background Flare */}
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '800px',
        height: '800px',
        background: 'radial-gradient(circle, rgba(154, 242, 58, 0.1) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <div style={{
            display: 'inline-block',
            padding: '0.5rem 1rem',
            background: 'rgba(154, 242, 58, 0.1)',
            border: '1px solid rgba(154, 242, 58, 0.3)',
            borderRadius: '2rem',
            marginBottom: '1rem'
          }}>
            <span style={{ color: '#9AF23A', fontSize: '0.875rem', fontWeight: 600 }}>
              RESOURCES
            </span>
          </div>
          <h1 style={{
            fontSize: '3rem',
            fontWeight: 700,
            color: 'white',
            marginBottom: '1rem',
            lineHeight: '1.2'
          }}>
            Government Contracting Resources
          </h1>
          <p style={{
            fontSize: '1.25rem',
            color: '#9CA3AF',
            maxWidth: '600px',
            margin: '0 auto',
            lineHeight: '1.6'
          }}>
            Everything you need to find, win, and deliver government contracts. 
            From beginner guides to advanced strategies.
          </p>
        </div>

        {/* Resources Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '2rem',
          marginBottom: '4rem'
        }}>
          {resources.map((category, categoryIndex) => (
            <div key={categoryIndex} style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '1rem',
              padding: '2rem',
              backdropFilter: 'blur(10px)'
            }}>
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: 600,
                color: '#9AF23A',
                marginBottom: '1.5rem',
                textAlign: 'center'
              }}>
                {category.category}
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {category.items.map((item, itemIndex) => (
                  <Link 
                    key={itemIndex} 
                    href={item.link}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      padding: '1rem',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '0.75rem',
                      textDecoration: 'none',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(154, 242, 58, 0.1)'
                      e.currentTarget.style.borderColor = 'rgba(154, 242, 58, 0.3)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    <div style={{
                      fontSize: '2rem',
                      width: '48px',
                      textAlign: 'center'
                    }}>
                      {item.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h4 style={{
                        fontSize: '1rem',
                        fontWeight: 600,
                        color: 'white',
                        marginBottom: '0.25rem'
                      }}>
                        {item.title}
                      </h4>
                      <p style={{
                        fontSize: '0.875rem',
                        color: '#9CA3AF',
                        lineHeight: '1.4'
                      }}>
                        {item.description}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div style={{
          textAlign: 'center',
          background: 'rgba(154, 242, 58, 0.1)',
          border: '1px solid rgba(154, 242, 58, 0.3)',
          borderRadius: '1rem',
          padding: '3rem 2rem'
        }}>
          <h2 style={{
            fontSize: '2rem',
            fontWeight: 600,
            color: 'white',
            marginBottom: '1rem'
          }}>
            Ready to Get Started?
          </h2>
          <p style={{
            fontSize: '1.125rem',
            color: '#9CA3AF',
            marginBottom: '2rem',
            maxWidth: '500px',
            margin: '0 auto 2rem'
          }}>
            Join thousands of contractors who are winning government contracts with Prop Shop AI.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/auth/signup" style={{
              padding: '1rem 2rem',
              background: 'linear-gradient(135deg, #2D5BFF, #9AF23A)',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '0.75rem',
              fontWeight: 600,
              fontSize: '1rem',
              transition: 'transform 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              Get Started Free
            </Link>
            <Link href="/book-demo" style={{
              padding: '1rem 2rem',
              background: 'transparent',
              color: '#9AF23A',
              textDecoration: 'none',
              borderRadius: '0.75rem',
              fontWeight: 600,
              fontSize: '1rem',
              border: '2px solid #9AF23A',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#9AF23A'
              e.currentTarget.style.color = '#0B1220'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = '#9AF23A'
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
