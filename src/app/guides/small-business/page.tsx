'use client'

import Link from 'next/link'

export default function SmallBusinessGuidePage() {
  const sections = [
    {
      title: 'Small Business Certifications',
      content: [
        {
          subtitle: '8(a) Business Development Program',
          description: 'Nine-year program for socially and economically disadvantaged small businesses',
          details: [
            'Must be at least 51% owned by U.S. citizens who are socially and economically disadvantaged',
            'Personal net worth must be less than $750,000',
            'Average annual receipts must be less than $4.5 million',
            'Provides access to sole-source contracts up to $4.5 million for goods/services',
            'Mentor-protégé opportunities with larger companies'
          ]
        },
        {
          subtitle: 'HUBZone Program',
          description: 'Historically Underutilized Business Zone program for businesses in designated areas',
          details: [
            'Must be located in a HUBZone area',
            'At least 35% of employees must live in a HUBZone',
            'Provides price evaluation preferences in full and open competition',
            'Access to HUBZone set-aside contracts',
            'Must maintain HUBZone status throughout contract performance'
          ]
        },
        {
          subtitle: 'Service-Disabled Veteran-Owned Small Business',
          description: 'Program for businesses owned by service-disabled veterans',
          details: [
            'Must be at least 51% owned by service-disabled veterans',
            'Service-disabled veteran must manage day-to-day operations',
            'Provides 3% government-wide contracting goal',
            'Access to SDVOSB set-aside contracts',
            'Veterans must have service-connected disability rating'
          ]
        },
        {
          subtitle: 'Women-Owned Small Business',
          description: 'Program for businesses owned and controlled by women',
          details: [
            'Must be at least 51% owned by women',
            'Women must manage day-to-day operations',
            'Provides 5% government-wide contracting goal',
            'Access to WOSB set-aside contracts',
            'Must be certified by SBA-approved third-party certifiers'
          ]
        }
      ]
    },
    {
      title: 'Certification Process',
      content: [
        {
          subtitle: 'Step 1: Business Registration',
          description: 'Complete basic business registrations',
          details: [
            'Obtain DUNS number from Dun & Bradstreet',
            'Register in SAM.gov (System for Award Management)',
            'Get NAICS codes for your business activities',
            'Ensure business meets size standards for your industry',
            'Verify business structure and ownership'
          ]
        },
        {
          subtitle: 'Step 2: Documentation Preparation',
          description: 'Gather required documentation',
          details: [
            'Business formation documents (articles of incorporation, etc.)',
            'Tax returns for the past 3 years',
            'Personal financial statements',
            'Resumes for key personnel',
            'Business plan and financial projections'
          ]
        },
        {
          subtitle: 'Step 3: Application Submission',
          description: 'Submit certification applications',
          details: [
            'Complete SBA certification applications online',
            'Submit all required documentation',
            'Pay applicable fees',
            'Respond to any SBA requests for additional information',
            'Maintain communication throughout the process'
          ]
        },
        {
          subtitle: 'Step 4: Certification Review',
          description: 'SBA review and approval process',
          details: [
            'SBA reviews application and documentation',
            'May conduct site visits or interviews',
            'Verifies eligibility requirements',
            'Issues certification decision',
            'Provides guidance for maintaining certification'
          ]
        }
      ]
    },
    {
      title: 'Contracting Opportunities',
      content: [
        {
          subtitle: 'Set-Aside Contracts',
          description: 'Contracts reserved exclusively for small businesses',
          details: [
            'Small Business Set-Asides: For all small businesses',
            '8(a) Set-Asides: Exclusive to 8(a) certified businesses',
            'HUBZone Set-Asides: For businesses in HUBZone areas',
            'SDVOSB Set-Asides: For service-disabled veteran-owned businesses',
            'WOSB Set-Asides: For women-owned small businesses'
          ]
        },
        {
          subtitle: 'Contracting Goals',
          description: 'Federal government contracting goals for small businesses',
          details: [
            '23% of prime contracts to small businesses',
            '5% to women-owned small businesses',
            '3% to service-disabled veteran-owned small businesses',
            '3% to HUBZone businesses',
            '5% to 8(a) businesses'
          ]
        },
        {
          subtitle: 'Subcontracting Opportunities',
          description: 'Subcontracting with larger prime contractors',
          details: [
            'Large prime contractors must have subcontracting plans',
            'Subcontracting goals for small businesses',
            'Opportunities for specialized services',
            'Team building with other small businesses',
            'Mentor-protégé relationships'
          ]
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

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '1000px', margin: '0 auto' }}>
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
              SMALL BUSINESS GUIDE
            </span>
          </div>
          <h1 style={{
            fontSize: '3rem',
            fontWeight: 700,
            color: 'white',
            marginBottom: '1rem',
            lineHeight: '1.2'
          }}>
            Small Business Government Contracting Guide
          </h1>
          <p style={{
            fontSize: '1.25rem',
            color: '#9CA3AF',
            maxWidth: '700px',
            margin: '0 auto',
            lineHeight: '1.6'
          }}>
            Your complete guide to small business certifications, contracting opportunities, 
            and strategies for winning government contracts.
          </p>
        </div>

        {/* Navigation */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '1rem',
          padding: '1.5rem',
          marginBottom: '3rem',
          backdropFilter: 'blur(10px)'
        }}>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: 600,
            color: 'white',
            marginBottom: '1rem'
          }}>
            Quick Navigation
          </h3>
          <div style={{
            display: 'flex',
            gap: '1rem',
            flexWrap: 'wrap'
          }}>
            {sections.map((section, index) => (
              <a
                key={index}
                href={`#section-${index}`}
                style={{
                  padding: '0.5rem 1rem',
                  background: 'rgba(154, 242, 58, 0.1)',
                  border: '1px solid rgba(154, 242, 58, 0.3)',
                  borderRadius: '0.5rem',
                  color: '#9AF23A',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(154, 242, 58, 0.2)'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(154, 242, 58, 0.1)'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                {section.title}
              </a>
            ))}
          </div>
        </div>

        {/* Content Sections */}
        {sections.map((section, sectionIndex) => (
          <div key={sectionIndex} id={`section-${sectionIndex}`} style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '1rem',
            padding: '2rem',
            marginBottom: '2rem',
            backdropFilter: 'blur(10px)'
          }}>
            <h2 style={{
              fontSize: '2rem',
              fontWeight: 600,
              color: '#9AF23A',
              marginBottom: '2rem',
              borderBottom: '2px solid rgba(154, 242, 58, 0.3)',
              paddingBottom: '0.5rem'
            }}>
              {section.title}
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {section.content.map((item, itemIndex) => (
                <div key={itemIndex} style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '0.75rem',
                  padding: '1.5rem'
                }}>
                  <h3 style={{
                    fontSize: '1.25rem',
                    fontWeight: 600,
                    color: 'white',
                    marginBottom: '0.75rem'
                  }}>
                    {item.subtitle}
                  </h3>
                  <p style={{
                    fontSize: '1rem',
                    color: '#9CA3AF',
                    marginBottom: '1rem',
                    lineHeight: '1.5'
                  }}>
                    {item.description}
                  </p>
                  <ul style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: 0
                  }}>
                    {item.details.map((detail, detailIndex) => (
                      <li key={detailIndex} style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.75rem',
                        marginBottom: '0.5rem',
                        padding: '0.5rem',
                        background: 'rgba(154, 242, 58, 0.05)',
                        borderRadius: '0.5rem'
                      }}>
                        <div style={{
                          width: '8px',
                          height: '8px',
                          background: '#9AF23A',
                          borderRadius: '50%',
                          marginTop: '0.5rem',
                          flexShrink: 0
                        }} />
                        <span style={{
                          color: '#E5E7EB',
                          fontSize: '0.875rem',
                          lineHeight: '1.4'
                        }}>
                          {detail}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Call to Action */}
        <div style={{
          textAlign: 'center',
          background: 'rgba(154, 242, 58, 0.1)',
          border: '1px solid rgba(154, 242, 58, 0.3)',
          borderRadius: '1rem',
          padding: '3rem 2rem',
          marginTop: '3rem'
        }}>
          <h2 style={{
            fontSize: '2rem',
            fontWeight: 600,
            color: 'white',
            marginBottom: '1rem'
          }}>
            Ready to Get Certified?
          </h2>
          <p style={{
            fontSize: '1.125rem',
            color: '#9CA3AF',
            marginBottom: '2rem',
            maxWidth: '500px',
            margin: '0 auto 2rem'
          }}>
            Prop Shop AI can help you navigate the certification process and find 
            the right opportunities for your business.
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
              Start Your Journey
            </Link>
            <Link href="/resources" style={{
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
              More Resources
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
