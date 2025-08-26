import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'PS.AI Search - Intelligent Government Contract Search Platform',
  description: 'Find and track government contract opportunities with AI-powered search. Discover hidden opportunities and stay ahead of the competition.',
}

export default function SearchPage() {
  return (
    <main className="solution-page">
      <div className="container">
        <div className="page-header">
          <div className="badge">Intelligent Search Platform</div>
          <h1>PS.AI Search</h1>
          <p className="subtitle">
            Discover government contract opportunities that match your capabilities with AI-powered search. 
            Find hidden opportunities, track competitors, and never miss a relevant contract again.
          </p>
        </div>

        <div className="hero-section">
          <div className="hero-content">
            <h2>Find Opportunities Others Miss</h2>
            <p>
              Traditional government contract databases are overwhelming and often miss the best opportunities. 
              PS.AI Search uses artificial intelligence to surface the most relevant contracts for your business.
            </p>
            <div className="hero-features">
              <div className="feature">
                <div className="feature-icon">🔍</div>
                <h3>AI-Powered Search</h3>
                <p>Intelligent matching based on your capabilities and past performance</p>
              </div>
              <div className="feature">
                <div className="feature-icon">📊</div>
                <h3>Real-Time Alerts</h3>
                <p>Instant notifications when new opportunities match your criteria</p>
              </div>
              <div className="feature">
                <div className="feature-icon">🎯</div>
                <h3>Smart Filtering</h3>
                <p>Advanced filters for NAICS codes, set-asides, and contract values</p>
              </div>
            </div>
          </div>
        </div>

        <div className="content-section">
          <h2>Why PS.AI Search?</h2>
          <div className="benefits-grid">
            <div className="benefit-card">
              <h3>AI-Powered Matching</h3>
              <p>
                Our machine learning algorithms analyze your business profile and automatically 
                identify the most relevant contract opportunities.
              </p>
            </div>
            <div className="benefit-card">
              <h3>Comprehensive Coverage</h3>
              <p>
                Search across multiple databases including SAM.gov, FedBizOpps, and state/local 
                procurement portals in one unified interface.
              </p>
            </div>
            <div className="benefit-card">
              <h3>Competitive Intelligence</h3>
              <p>
                Track competitors, analyze their bidding patterns, and identify opportunities 
                where you have a competitive advantage.
              </p>
            </div>
            <div className="benefit-card">
              <h3>Automated Workflows</h3>
              <p>
                Set up automated searches, receive daily digests, and integrate with your 
                existing business processes.
              </p>
            </div>
          </div>
        </div>

        <div className="content-section">
          <h2>Key Features</h2>
          <div className="features-list">
            <div className="feature-item">
              <h3>Intelligent Search</h3>
              <ul>
                <li>AI-powered opportunity matching</li>
                <li>Natural language search queries</li>
                <li>Smart filtering and sorting</li>
                <li>Saved searches and alerts</li>
              </ul>
            </div>
            <div className="feature-item">
              <h3>Opportunity Tracking</h3>
              <ul>
                <li>Real-time opportunity updates</li>
                <li>Contract modification tracking</li>
                <li>Deadline reminders and alerts</li>
                <li>Historical opportunity data</li>
              </ul>
            </div>
            <div className="feature-item">
              <h3>Market Analysis</h3>
              <ul>
                <li>Industry trend analysis</li>
                <li>Contract value forecasting</li>
                <li>Geographic opportunity mapping</li>
                <li>Set-aside opportunity analysis</li>
              </ul>
            </div>
            <div className="feature-item">
              <h3>Integration & Automation</h3>
              <ul>
                <li>CRM system integration</li>
                <li>Automated opportunity alerts</li>
                <li>Team collaboration tools</li>
                <li>Mobile app access</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="content-section">
          <h2>Search Capabilities</h2>
          <div className="search-capabilities">
            <div className="capability">
              <h4>Contract Types</h4>
              <p>Fixed-price, cost-plus, time-and-materials, and IDIQ contracts</p>
            </div>
            <div className="capability">
              <h4>Set-Asides</h4>
              <p>SDVOSB, 8(a), WOSB, HUBZone, and other small business programs</p>
            </div>
            <div className="capability">
              <h4>NAICS Codes</h4>
              <p>Industry-specific opportunity matching and classification</p>
            </div>
            <div className="capability">
              <h4>Geographic Scope</h4>
              <p>Local, regional, national, and international opportunities</p>
            </div>
            <div className="capability">
              <h4>Contract Values</h4>
              <p>Filter by contract size and value ranges</p>
            </div>
            <div className="capability">
              <h4>Agency Focus</h4>
              <p>Department of Defense, civilian agencies, and state/local governments</p>
            </div>
          </div>
        </div>

        <div className="content-section">
          <h2>Pricing & Plans</h2>
          <div className="pricing-grid">
            <div className="pricing-card">
              <h3>Basic</h3>
              <div className="price">$29<span>/month</span></div>
              <ul>
                <li>Up to 100 searches/month</li>
                <li>Basic opportunity alerts</li>
                <li>Standard filtering</li>
                <li>Email support</li>
              </ul>
              <a href="/contact" className="btn btn-primary">Get Started</a>
            </div>
            <div className="pricing-card featured">
              <div className="featured-badge">Most Popular</div>
              <h3>Professional</h3>
              <div className="price">$79<span>/month</span></div>
              <ul>
                <li>Unlimited searches</li>
                <li>AI-powered matching</li>
                <li>Advanced analytics</li>
                <li>Competitive intelligence</li>
                <li>Priority support</li>
                <li>API access</li>
              </ul>
              <a href="/contact" className="btn btn-primary">Get Started</a>
            </div>
            <div className="pricing-card">
              <h3>Enterprise</h3>
              <div className="price">Custom</div>
              <ul>
                <li>Team collaboration tools</li>
                <li>Custom integrations</li>
                <li>Dedicated support</li>
                <li>Training and onboarding</li>
                <li>Custom reporting</li>
                <li>SLA guarantees</li>
              </ul>
              <a href="/contact" className="btn btn-primary">Contact Sales</a>
            </div>
          </div>
        </div>

        <div className="cta-section">
          <h2>Start Finding Better Opportunities Today</h2>
          <p>
            Join thousands of government contractors who are already using PS.AI Search 
            to discover and win more contracts.
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
