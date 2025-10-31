import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'PS.AI Small Business - SBIR/SBA Dedicated Search & Database Platform',
  description: 'Proprietary search and database function specifically designed for SBIR, SBA programs, and small business set-aside contracts.',
}

export default function SmallBusinessPage() {
  return (
    <main className="solution-page">
      <div className="container">
        <div className="page-header">
          <div className="badge">SBIR/SBA Dedicated Platform</div>
          <h1>PS.AI Small Business</h1>
          <p className="subtitle">
            Our proprietary search and database function specifically designed for SBIR, SBA programs, 
            and small business set-aside contracts. Find opportunities others miss.
          </p>
        </div>

        <div className="hero-section">
          <div className="hero-content">
            <h2>SBIR & SBA Contract Intelligence</h2>
            <p>
              PS.AI Small Business is our dedicated platform for small business contractors. 
              We've built proprietary search algorithms and databases specifically for SBIR opportunities, 
              SBA programs, and set-aside contracts that traditional tools can't find.
            </p>
            <div className="hero-features">
              <div className="feature">
                <div className="feature-icon"></div>
                <h3>Proprietary Search</h3>
                <p>Custom-built algorithms for SBIR and SBA opportunity discovery</p>
              </div>
              <div className="feature">
                <div className="feature-icon"></div>
                <h3>Dedicated Database</h3>
                <p>Specialized database tracking small business set-aside contracts</p>
              </div>
              <div className="feature">
                <div className="feature-icon"></div>
                <h3>Set-Aside Focus</h3>
                <p>Targeted tracking of SDVOSB, 8(a), WOSB, and HUBZone opportunities</p>
              </div>
            </div>
          </div>
        </div>

        <div className="content-section">
          <h2>Why PS.AI Small Business?</h2>
          <div className="benefits-grid">
            <div className="benefit-card">
              <h3>Proprietary Technology</h3>
              <p>
                Our custom-built search algorithms and databases are specifically designed for 
                small business contracting, not adapted from general-purpose tools.
              </p>
            </div>
            <div className="benefit-card">
              <h3>SBIR Specialization</h3>
              <p>
                Deep expertise in Small Business Innovation Research programs with dedicated 
                tracking and analysis tools built specifically for this market.
              </p>
            </div>
            <div className="benefit-card">
              <h3>SBA Program Focus</h3>
              <p>
                Comprehensive coverage of all SBA programs including 8(a), SDVOSB, WOSB, 
                HUBZone, and other set-aside opportunities.
              </p>
            </div>
            <div className="benefit-card">
              <h3>Set-Aside Intelligence</h3>
              <p>
                Proprietary data and tracking for small business set-aside contracts 
                that gives you a competitive advantage in these specialized markets.
              </p>
            </div>
          </div>
        </div>

        <div className="content-section">
          <h2>Core Capabilities</h2>
          <div className="capabilities">
            <div className="capability">
              <h4>SBIR Opportunity Tracking</h4>
              <p>Comprehensive tracking of SBIR/STTR opportunities across all agencies and phases</p>
            </div>
            <div className="capability">
              <h4>SBA Program Database</h4>
              <p>Dedicated database for 8(a), SDVOSB, WOSB, HUBZone, and other SBA programs</p>
            </div>
            <div className="capability">
              <h4>Set-Aside Contract Search</h4>
              <p>Proprietary search algorithms for small business set-aside opportunities</p>
            </div>
            <div className="capability">
              <h4>Proprietary Data Sources</h4>
              <p>Custom data feeds and sources not available in standard government databases</p>
            </div>
            <div className="capability">
              <h4>Small Business Intelligence</h4>
              <p>Market analysis and competitive intelligence specifically for small business contractors</p>
            </div>
            <div className="capability">
              <h4>Opportunity Forecasting</h4>
              <p>Predictive analytics for upcoming small business opportunities</p>
            </div>
          </div>
        </div>

        <div className="content-section">
          <h2>Proprietary Technology</h2>
          <div className="tech-features">
            <div className="tech-feature">
              <h4>Custom Search Algorithms</h4>
              <p>Built specifically for small business contracting, not adapted from general tools</p>
            </div>
            <div className="tech-feature">
              <h4>Dedicated Database Architecture</h4>
              <p>Specialized data structure optimized for SBIR and SBA opportunity tracking</p>
            </div>
            <div className="tech-feature">
              <h4>Proprietary Data Feeds</h4>
              <p>Custom data sources and feeds exclusive to our platform</p>
            </div>
            <div className="tech-feature">
              <h4>Small Business Intelligence Engine</h4>
              <p>AI-powered analysis specifically designed for small business market dynamics</p>
            </div>
          </div>
        </div>

        <div className="content-section">
          <h2>Target Markets</h2>
          <div className="markets">
            <div className="market">
              <h4>SBIR/STTR Programs</h4>
              <p>All phases of Small Business Innovation Research and Small Business Technology Transfer</p>
            </div>
            <div className="market">
              <h4>SBA 8(a) Business Development</h4>
              <p>Comprehensive tracking for socially and economically disadvantaged businesses</p>
            </div>
            <div className="market">
              <h4>Veteran-Owned Businesses</h4>
              <p>SDVOSB and VOSB opportunities across all federal agencies</p>
            </div>
            <div className="market">
              <h4>Women-Owned Businesses</h4>
              <p>WOSB and EDWOSB program opportunities and set-asides</p>
            </div>
            <div className="market">
              <h4>HUBZone Companies</h4>
              <p>Historically Underutilized Business Zone opportunities and compliance</p>
            </div>
            <div className="market">
              <h4>Small Business Set-Asides</h4>
              <p>All federal contracting opportunities specifically reserved for small businesses</p>
            </div>
          </div>
        </div>

        <div className="content-section">
          <h2>PS.AI Small Business Tools</h2>
          <p style={{ textAlign: 'center', marginBottom: '40px', color: '#cbd5e1', fontSize: '18px' }}>
            Choose from our suite of proprietary small business intelligence tools
          </p>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', maxWidth: '1200px', margin: '0 auto' }}>
            {/* Smart DSIP Search */}
            <div className="tool-card" style={{
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(99, 102, 241, 0.1))',
              border: '2px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '16px',
              padding: '40px',
              transition: 'all 0.3s ease',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  background: 'rgba(59, 130, 246, 0.2)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '20px',
                  fontSize: '32px'
                }}>
                  🔍
                </div>
                
                <h3 style={{ color: '#60a5fa', fontSize: '24px', fontWeight: '700', marginBottom: '12px' }}>
                  Smart DSIP Search
                </h3>
                
                <div style={{
                  display: 'inline-block',
                  background: 'rgba(34, 197, 94, 0.2)',
                  color: '#4ade80',
                  padding: '4px 12px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '600',
                  marginBottom: '16px'
                }}>
                  LIVE NOW
                </div>
                
                <p style={{ color: '#cbd5e1', fontSize: '16px', lineHeight: '1.6', marginBottom: '24px' }}>
                  Access our comprehensive DSIP (Defense SBIR/STTR Innovation Program) database with 
                  33,000+ opportunities. Advanced search, smart filters, and AI-powered matching.
                </p>
                
                <ul style={{ color: '#94a3b8', fontSize: '14px', lineHeight: '2', marginBottom: '28px', paddingLeft: '20px' }}>
                  <li>Search 33,000+ DSIP opportunities</li>
                  <li>Advanced filtering and sorting</li>
                  <li>Real-time opportunity updates</li>
                  <li>AI-powered opportunity matching</li>
                  <li>Full proposal instructions analysis</li>
                  <li>Share searches and opportunities</li>
                </ul>
                
                <a 
                  href="/small-business/dsip-search" 
                  className="btn btn-primary btn-lg"
                  style={{
                    width: '100%',
                    display: 'block',
                    textAlign: 'center',
                    background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                    border: 'none',
                    padding: '14px 28px',
                    fontSize: '16px',
                    fontWeight: '600',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  Launch Smart DSIP Search →
                </a>
                
                <p style={{ 
                  textAlign: 'center', 
                  marginTop: '12px', 
                  fontSize: '12px', 
                  color: '#64748b' 
                }}>
                  Requires free account login
                </p>
              </div>
            </div>

            {/* MATRIX-SB (Coming Soon) */}
            <div className="tool-card" style={{
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(168, 85, 247, 0.1))',
              border: '2px solid rgba(139, 92, 246, 0.3)',
              borderRadius: '16px',
              padding: '40px',
              transition: 'all 0.3s ease',
              position: 'relative',
              overflow: 'hidden',
              opacity: 0.8
            }}>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  background: 'rgba(139, 92, 246, 0.2)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '20px',
                  fontSize: '32px'
                }}>
                  📊
                </div>
                
                <h3 style={{ color: '#a78bfa', fontSize: '24px', fontWeight: '700', marginBottom: '12px' }}>
                  MATRIX-SB
                </h3>
                
                <div style={{
                  display: 'inline-block',
                  background: 'rgba(251, 191, 36, 0.2)',
                  color: '#fbbf24',
                  padding: '4px 12px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '600',
                  marginBottom: '16px'
                }}>
                  COMING SOON
                </div>
                
                <p style={{ color: '#cbd5e1', fontSize: '16px', lineHeight: '1.6', marginBottom: '24px' }}>
                  Small Business Market Research Intelligence tool. Analyze past awards, identify winning 
                  strategies, and discover opportunities others miss.
                </p>
                
                <ul style={{ color: '#94a3b8', fontSize: '14px', lineHeight: '2', marginBottom: '28px', paddingLeft: '20px' }}>
                  <li>Historical award analysis</li>
                  <li>Winning proposal patterns</li>
                  <li>Competitor intelligence</li>
                  <li>Market trend forecasting</li>
                  <li>Strategic positioning insights</li>
                  <li>SBA program analytics</li>
                </ul>
                
                <button 
                  disabled
                  style={{
                    width: '100%',
                    display: 'block',
                    textAlign: 'center',
                    background: 'rgba(139, 92, 246, 0.3)',
                    border: 'none',
                    padding: '14px 28px',
                    fontSize: '16px',
                    fontWeight: '600',
                    borderRadius: '8px',
                    cursor: 'not-allowed',
                    color: '#a78bfa'
                  }}
                >
                  Coming Q2 2025
                </button>
                
                <p style={{ 
                  textAlign: 'center', 
                  marginTop: '12px', 
                  fontSize: '12px', 
                  color: '#64748b' 
                }}>
                  Join waitlist for early access
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="cta-section">
          <h2>Ready to Access Our Proprietary Small Business Platform?</h2>
          <p>
            Join small business contractors who are already using our proprietary SBIR/SBA 
            search and database to find opportunities others miss.
          </p>
          <div className="cta-buttons">
            <a href="/contact" className="btn btn-primary btn-lg">Get Started Today</a>
            <a href="/book-demo" className="btn btn-outline btn-lg">Book a Demo</a>
          </div>
        </div>
      </div>
    </main>
  )
}
