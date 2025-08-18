'use client'

export default function HowItWorksPage() {
  return (
    <div className="page-content" style={{
      minHeight: '100vh',
      color: 'var(--text-primary)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      {/* Hero Section */}
      <div style={{
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
            How It Works
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
            See the Magic Happen
          </h1>
          
          <p style={{
            fontSize: '1.5rem',
            color: 'var(--text-secondary)',
            marginBottom: '2rem',
            maxWidth: '800px',
            marginLeft: 'auto',
            marginRight: 'auto'
          }}>
            Watch how Prop Shop AI transforms raw data into winning opportunities through our intelligent procurement funnel.
          </p>
        </div>
      </div>

      {/* Data Sources Explanation */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '4rem 1rem'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '1rem',
          padding: '2rem',
          backdropFilter: 'blur(10px)'
        }}>
          <h3 style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            marginBottom: '1.5rem',
            color: 'var(--text-primary)',
            textAlign: 'center'
          }}>
            Comprehensive Data Ingestion Sources
          </h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1.5rem'
          }}>
            <div>
              <h4 style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                marginBottom: '1rem',
                color: 'var(--accent-primary)'
              }}>Government Procurement</h4>
              <ul style={{
                listStyle: 'none',
                padding: 0,
                color: 'var(--text-secondary)',
                lineHeight: 1.6
              }}>
                <li>• SAM.gov - Entity registration & certifications</li>
                <li>• USASpending - Federal spending data</li>
                <li>• FPDS - Federal procurement data system</li>
                <li>• FedBizOpps - Contract opportunities</li>
                <li>• eBuy - GSA procurement platform</li>
                <li>• GSA Schedules - Pre-approved vendors</li>
                <li>• CPARS - Contractor performance ratings</li>
                <li>• PPIRS - Past performance information</li>
              </ul>
            </div>
            
            <div>
              <h4 style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                marginBottom: '1rem',
                color: 'var(--accent-secondary)'
              }}>Business Intelligence</h4>
              <ul style={{
                listStyle: 'none',
                padding: 0,
                color: 'var(--text-secondary)',
                lineHeight: 1.6
              }}>
                <li>• Crunchbase - Company & funding data</li>
                <li>• D&B Hoovers - Business information</li>
                <li>• PitchBook - Financial & company data</li>
                <li>• Bloomberg Gov - Government market intelligence</li>
                <li>• Deltek - Government contracting software</li>
                <li>• GovWin - Market research & intelligence</li>
                <li>• Market research reports</li>
                <li>• Industry trend analysis</li>
              </ul>
            </div>
            
            <div>
              <h4 style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                marginBottom: '1rem',
                color: '#10b981'
              }}>Performance & Capability</h4>
              <ul style={{
                listStyle: 'none',
                padding: 0,
                color: 'var(--text-secondary)',
                lineHeight: 1.6
              }}>
                <li>• Past performance records</li>
                <li>• Winning proposal analysis</li>
                <li>• Team member capabilities</li>
                <li>• Product specifications</li>
                <li>• Technical expertise mapping</li>
                <li>• Competitive positioning</li>
                <li>• Risk assessment data</li>
                <li>• Compliance requirements</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Sales Content Section */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '4rem 1rem'
      }}>
        <div style={{
          textAlign: 'center',
          marginBottom: '4rem'
        }}>
          <h2 style={{
            fontSize: '3rem',
            fontWeight: '700',
            marginBottom: '1.5rem',
            color: 'var(--text-primary)'
          }}>
            From Data to Victory
          </h2>
          <p style={{
            fontSize: '1.25rem',
            color: 'var(--text-secondary)',
            maxWidth: '800px',
            margin: '0 auto'
          }}>
            Our intelligent funnel processes millions of data points to identify, qualify, and capture the opportunities that matter most to your business.
          </p>
        </div>

        {/* Feature Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '2rem',
          marginBottom: '4rem'
        }}>
          {[
            {
              title: 'Intelligent Discovery',
              description: 'AI-powered algorithms scan government databases, past performance records, and market intelligence to identify high-probability opportunities.',
              color: 'linear-gradient(135deg, #8b5cf6, #7c3aed)'
            },
            {
              title: 'Smart Qualification',
              description: 'Automated scoring systems evaluate opportunities based on your capabilities, past performance, and competitive positioning.',
              color: 'linear-gradient(135deg, #10b981, #059669)'
            },
            {
              title: 'Data-Driven Insights',
              description: 'Real-time analytics provide actionable intelligence on market trends, competitor analysis, and win probability factors.',
              color: 'linear-gradient(135deg, #3b82f6, #1d4ed8)'
            },
            {
              title: 'Automated Workflows',
              description: 'Streamlined processes from opportunity identification to proposal submission, reducing manual effort by 80%.',
              color: 'linear-gradient(135deg, #f59e0b, #d97706)'
            },
            {
              title: 'Proven Results',
              description: 'Our clients see 3x increase in win rates and 60% reduction in proposal development time.',
              color: 'linear-gradient(135deg, #14b8a6, #0d9488)'
            },
            {
              title: 'Continuous Learning',
              description: 'Machine learning algorithms continuously improve based on outcomes, making each opportunity more likely to succeed.',
              color: 'linear-gradient(135deg, #6366f1, #4f46e5)'
            }
          ].map((feature, index) => (
            <div key={index} style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '1rem',
              padding: '2rem',
              transition: 'all 0.3s ease',
              cursor: 'pointer',
              backdropFilter: 'blur(10px)'
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
            }}
            >
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                marginBottom: '1rem',
                color: 'var(--text-primary)'
              }}>{feature.title}</h3>
              <p style={{
                color: 'var(--text-secondary)',
                lineHeight: 1.6
              }}>{feature.description}</p>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '1rem',
          backdropFilter: 'blur(10px)'
        }}>
          <h2 style={{
            fontSize: '2.5rem',
            fontWeight: '700',
            marginBottom: '1rem',
            color: 'var(--text-primary)'
          }}>
            Ready to See It in Action?
          </h2>
          <p style={{
            color: 'var(--text-secondary)',
            fontSize: '1.125rem',
            marginBottom: '2rem',
            maxWidth: '600px',
            marginLeft: 'auto',
            marginRight: 'auto'
          }}>
            Experience the power of our intelligent procurement funnel with a personalized demo.
          </p>
          <div style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <a href="/book-demo" style={{
              padding: '1rem 2rem',
              background: 'linear-gradient(135deg, #2D5BFF, #9AF23A)',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '0.5rem',
              fontWeight: '600',
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
              Book a Demo
            </a>
            <a href="/contact" style={{
              padding: '1rem 2rem',
              background: 'transparent',
              color: 'var(--accent-primary)',
              textDecoration: 'none',
              borderRadius: '0.5rem',
              fontWeight: '600',
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
              Contact Us
            </a>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}
