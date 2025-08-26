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
                <div className="feature-icon">🔍</div>
                <h3>Proprietary Search</h3>
                <p>Custom-built algorithms for SBIR and SBA opportunity discovery</p>
              </div>
              <div className="feature">
                <div className="feature-icon">📊</div>
                <h3>Dedicated Database</h3>
                <p>Specialized database tracking small business set-aside contracts</p>
              </div>
              <div className="feature">
                <div className="feature-icon">🎯</div>
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
          <h2>Pricing & Plans</h2>
          <div className="pricing-grid">
            <div className="pricing-card">
              <h3>Small Business Starter</h3>
              <div className="price">$49<span>/month</span></div>
              <ul>
                <li>Basic SBIR opportunity search</li>
                <li>SBA program tracking</li>
                <li>Set-aside opportunity alerts</li>
                <li>Email support</li>
                <li>Perfect for businesses under $1M</li>
              </ul>
              <a href="/contact" className="btn btn-primary">Get Started</a>
            </div>
            <div className="pricing-card featured">
              <div className="featured-badge">Most Popular</div>
              <h3>Small Business Professional</h3>
              <div className="price">$99<span>/month</span></div>
              <ul>
                <li>Full proprietary search access</li>
                <li>Advanced SBIR tracking</li>
                <li>Comprehensive SBA database</li>
                <li>Set-aside intelligence</li>
                <li>Priority support</li>
                <li>API access</li>
              </ul>
              <a href="/contact" className="btn btn-primary">Get Started</a>
            </div>
            <div className="pricing-card">
              <h3>Small Business Enterprise</h3>
              <div className="price">$199<span>/month</span></div>
              <ul>
                <li>Everything in Professional</li>
                <li>Dedicated small business advisor</li>
                <li>Custom training and onboarding</li>
                <li>White-label options</li>
                <li>SLA guarantees</li>
                <li>Custom integrations</li>
              </ul>
              <a href="/contact" className="btn btn-primary">Contact Sales</a>
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
