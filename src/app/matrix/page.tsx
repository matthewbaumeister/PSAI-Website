'use client'

export default function MatrixPage() {
  return (
    <main className="solution-page">
      <div className="container">
        <div className="page-header">
          <div className="badge">Proprietary Intelligence Platform</div>
          <h1>MAKE‑READY MATRIX</h1>
          <p className="subtitle" style={{ fontSize: '1.25rem', fontWeight: '500', marginTop: '1rem' }}>
            MAKE‑READY Acquisition & Technology Readiness Intelligence eXchange
          </p>
          <p className="subtitle" style={{ marginTop: '1rem' }}>
            Our comprehensive DoD-wide search and intelligence platform for tracking opportunities, 
            analyzing markets, and creating strategic intelligence across all Department of Defense 
            agencies, commands, and contracting activities.
          </p>
        </div>

        <div className="hero-section">
          <div className="hero-content">
            <h2>Unified DoD Contract Intelligence</h2>
            <p>
              MATRIX is MAKE‑READY's flagship platform that combines comprehensive DoD-wide search 
              capabilities with advanced market research and intelligence tools. Built on proprietary 
              data sources, custom databases, and advanced algorithms, MATRIX gives you the competitive 
              advantage needed to identify opportunities and make strategic decisions.
            </p>
            <div className="hero-features">
              <div className="feature">
                <div className="feature-icon"></div>
                <h3>DoD-Wide Search</h3>
                <p>Comprehensive coverage of all Department of Defense contracting opportunities across Army, Navy, Air Force, Marines, and all DoD agencies</p>
              </div>
              <div className="feature">
                <div className="feature-icon"></div>
                <h3>Proprietary Intelligence</h3>
                <p>Exclusive data sources and intelligence not available elsewhere, curated and analyzed by our expert team</p>
              </div>
              <div className="feature">
                <div className="feature-icon"></div>
                <h3>Market Analysis</h3>
                <p>Deep insights into industries, markets, and opportunities with real-time tracking and strategic analysis</p>
              </div>
            </div>
          </div>
        </div>

        <div className="content-section">
          <h2>Why MATRIX?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon-large"></div>
              <h3>Comprehensive DoD Coverage</h3>
              <p>
                Search and track opportunities across all Department of Defense agencies, commands, 
                and contracting activities. From major weapons systems to services contracts, 
                MATRIX covers the full spectrum of DoD procurement.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-large"></div>
              <h3>Proprietary Data Sources</h3>
              <p>
                Unlike aggregators that simply collect public data, MATRIX is built on exclusive 
                MAKE‑READY data sources, custom databases, and proprietary intelligence that gives 
                you insights others don't have access to.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-large"></div>
              <h3>Real-Time Intelligence</h3>
              <p>
                Stay ahead of the competition with real-time updates on new opportunities, contract 
                awards, and market movements. Our platform continuously monitors and analyzes DoD 
                contracting activities.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-large"></div>
              <h3>Strategic Market Research</h3>
              <p>
                Go beyond simple searches with advanced market research tools. Create custom market 
                intelligence, track industry trends, analyze competition, and develop strategic 
                entry plans.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-large"></div>
              <h3>Opportunity Creation</h3>
              <p>
                Don't just find existing opportunities—create new ones. Our platform helps you 
                identify gaps in the market, track emerging requirements, and position yourself 
                before solicitations are released.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-large"></div>
              <h3>Technology Readiness Assessment</h3>
              <p>
                Assess the technology readiness landscape for DoD programs and requirements. 
                Understand where the DoD is investing in technology and how your capabilities 
                align with their priorities.
              </p>
            </div>
          </div>
        </div>

        <div className="content-section">
          <h2>Platform Capabilities</h2>
          
          <div className="capability-section">
            <h3>Advanced Search & Discovery</h3>
            <ul className="feature-list">
              <li>Multi-agency DoD search across all contracting offices</li>
              <li>Advanced filters by agency, program, technology area, and more</li>
              <li>AI-powered relevance ranking and opportunity matching</li>
              <li>Custom alerts for new opportunities matching your profile</li>
              <li>Historical contract award analysis and trends</li>
            </ul>
          </div>

          <div className="capability-section">
            <h3>Market Intelligence & Analysis</h3>
            <ul className="feature-list">
              <li>Proprietary market data and competitive intelligence</li>
              <li>Industry trend analysis and forecasting</li>
              <li>Custom market reports and opportunity assessments</li>
              <li>Competitive landscape mapping and analysis</li>
              <li>Strategic planning and market entry tools</li>
            </ul>
          </div>

          <div className="capability-section">
            <h3>Technology & Acquisition Tracking</h3>
            <ul className="feature-list">
              <li>Technology readiness level (TRL) tracking across DoD programs</li>
              <li>Acquisition milestone monitoring and forecasting</li>
              <li>Program of record tracking and budget analysis</li>
              <li>Research & development investment trends</li>
              <li>Technology transition pathway analysis</li>
            </ul>
          </div>
        </div>

        <div className="content-section">
          <h2>About MAKE‑READY</h2>
          <div className="about-section">
            <p>
              MAKE‑READY is the parent company of Prop Shop AI, dedicated to leveling the playing 
              field in government contracting. Our name reflects our mission: helping organizations 
              become acquisition-ready and technology-ready for DoD opportunities.
            </p>
            <p>
              MATRIX is our flagship platform, combining years of expertise in DoD contracting, 
              proprietary data collection, and advanced AI technology to create the most comprehensive 
              procurement intelligence platform available.
            </p>
          </div>
        </div>

        <div className="cta-section">
          <h2>Ready to Get Started?</h2>
          <p>
            Join leading defense contractors who use MATRIX to find opportunities, analyze markets, 
            and make strategic decisions.
          </p>
          <div className="cta-buttons">
            <a href="/contact" className="btn btn-primary">Request Demo</a>
            <a href="/about" className="btn btn-secondary">Learn More About MAKE‑READY</a>
          </div>
        </div>

        <style jsx>{`
          .capability-section {
            margin: 2rem 0;
            padding: 2rem;
            background: rgba(255, 255, 255, 0.03);
            border-radius: 1rem;
            border: 1px solid rgba(255, 255, 255, 0.1);
          }

          .capability-section h3 {
            color: #60a5fa;
            margin-bottom: 1rem;
            font-size: 1.5rem;
          }

          .feature-list {
            list-style: none;
            padding: 0;
          }

          .feature-list li {
            padding: 0.75rem 0;
            padding-left: 2rem;
            position: relative;
            color: #cbd5e1;
            line-height: 1.6;
          }

          .feature-list li:before {
            content: '→';
            position: absolute;
            left: 0;
            color: #60a5fa;
            font-weight: bold;
          }

          .about-section {
            background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%);
            padding: 2rem;
            border-radius: 1rem;
            border: 1px solid rgba(59, 130, 246, 0.2);
          }

          .about-section p {
            color: #e2e8f0;
            line-height: 1.8;
            margin-bottom: 1rem;
          }

          .about-section p:last-child {
            margin-bottom: 0;
          }

          .cta-section {
            text-align: center;
            padding: 4rem 0;
            margin-top: 4rem;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
          }

          .cta-section h2 {
            font-size: 2.5rem;
            margin-bottom: 1rem;
            color: #ffffff;
          }

          .cta-section p {
            font-size: 1.25rem;
            color: #cbd5e1;
            margin-bottom: 2rem;
          }

          .cta-buttons {
            display: flex;
            gap: 1rem;
            justify-content: center;
            flex-wrap: wrap;
          }

          @media (max-width: 768px) {
            .capability-section {
              padding: 1.5rem;
            }

            .cta-section h2 {
              font-size: 2rem;
            }

            .cta-buttons {
              flex-direction: column;
              align-items: stretch;
            }
          }
        `}</style>
      </div>
    </main>
  )
}

