import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'PS.AI Search - DoD-Wide Government Contract Search Platform',
  description: 'Comprehensive DoD-wide search tool for government contracting opportunities. Find new work across all Department of Defense agencies and commands.',
}

export default function SearchPage() {
  return (
    <main className="solution-page">
      <div className="container">
        <div className="page-header">
          <div className="badge">DoD-Wide Search Platform</div>
          <h1>PS.AI Search</h1>
          <p className="subtitle">
            Our comprehensive DoD-wide search tool for government contracting opportunities. 
            Find new work across all Department of Defense agencies, commands, and contracting activities.
          </p>
        </div>

        <div className="hero-section">
          <div className="hero-content">
            <h2>DoD-Wide Contract Intelligence</h2>
            <p>
              PS.AI Search is our Department of Defense focused search platform, designed to help 
              contractors find new work across all DoD agencies, commands, and contracting activities. 
              Similar to Procurement Sciences' government contracting platform, but specialized for DoD opportunities.
            </p>
            <div className="hero-features">
              <div className="feature">
                <div className="feature-icon">🛡️</div>
                <h3>DoD-Focused Search</h3>
                <p>Comprehensive coverage of all Department of Defense contracting opportunities</p>
              </div>
              <div className="feature">
                <div className="feature-icon">🔍</div>
                <h3>Multi-Agency Coverage</h3>
                <p>Search across Army, Navy, Air Force, Marines, and all DoD agencies</p>
              </div>
              <div className="feature">
                <div className="feature-icon">📊</div>
                <h3>Contract Intelligence</h3>
                <p>Real-time tracking and analysis of DoD contracting activities</p>
              </div>
            </div>
          </div>
        </div>

        <div className="content-section">
          <h2>Why PS.AI Search for DoD?</h2>
          <div className="benefits-grid">
            <div className="benefit-card">
              <h3>DoD Specialization</h3>
              <p>
                Built specifically for Department of Defense contracting, with deep understanding 
                of military requirements, regulations, and contracting processes.
              </p>
            </div>
            <div className="benefit-card">
              <h3>Comprehensive Coverage</h3>
              <p>
                Search across all DoD agencies including Army, Navy, Air Force, Marines, 
                Space Force, and all major commands and contracting activities.
              </p>
            </div>
            <div className="benefit-card">
              <h3>Military Contract Intelligence</h3>
              <p>
                Specialized tracking of military contracts, IDIQs, task orders, and 
                other DoD-specific contracting vehicles and opportunities.
              </p>
            </div>
            <div className="benefit-card">
              <h3>Defense Industry Focus</h3>
              <p>
                Designed for defense contractors, aerospace companies, and businesses 
                serving the military and defense markets.
              </p>
            </div>
          </div>
        </div>

        <div className="content-section">
          <h2>DoD Agency Coverage</h2>
          <div className="dod-agencies">
            <div className="agency">
              <h4>U.S. Army</h4>
              <p>All Army commands, installations, and contracting activities</p>
            </div>
            <div className="agency">
              <h4>U.S. Navy</h4>
              <p>Navy commands, shipyards, and maritime contracting</p>
            </div>
            <div className="agency">
              <h4>U.S. Air Force</h4>
              <p>Air Force bases, commands, and aerospace contracting</p>
            </div>
            <div className="agency">
              <h4>U.S. Marine Corps</h4>
              <p>Marine Corps installations and expeditionary contracting</p>
            </div>
            <div className="agency">
              <h4>U.S. Space Force</h4>
              <p>Space operations and space-related contracting</p>
            </div>
            <div className="agency">
              <h4>Defense Agencies</h4>
              <p>DLA, DARPA, DTRA, and other defense agencies</p>
            </div>
          </div>
        </div>

        <div className="content-section">
          <h2>Key Features</h2>
          <div className="features-list">
            <div className="feature-item">
              <h3>DoD Opportunity Search</h3>
              <ul>
                <li>Comprehensive DoD contract opportunity database</li>
                <li>Real-time updates and notifications</li>
                <li>Advanced filtering by agency, command, and contract type</li>
                <li>Historical contract data and analysis</li>
              </ul>
            </div>
            <div className="feature-item">
              <h3>Military Contract Intelligence</h3>
              <ul>
                <li>IDIQ and task order tracking</li>
                <li>Contract vehicle analysis and optimization</li>
                <li>Past performance and incumbent tracking</li>
                <li>Contract modification and recompete alerts</li>
              </ul>
            </div>
            <div className="feature-item">
              <h3>Defense Market Analysis</h3>
              <ul>
                <li>DoD spending trends and analysis</li>
                <li>Competitive intelligence for defense contractors</li>
                <li>Market opportunity identification</li>
                <li>Strategic planning and forecasting</li>
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
          <h2>Contract Types Covered</h2>
          <div className="contract-types">
            <div className="contract-type">
              <h4>IDIQs & Task Orders</h4>
              <p>Indefinite Delivery, Indefinite Quantity contracts and task order opportunities</p>
            </div>
            <div className="contract-type">
              <h4>Fixed-Price Contracts</h4>
              <p>Firm fixed-price, fixed-price with economic price adjustment</p>
            </div>
            <div className="contract-type">
              <h4>Cost-Reimbursement</h4>
              <p>Cost-plus-fixed-fee, cost-plus-incentive-fee contracts</p>
            </div>
            <div className="contract-type">
              <h4>Time & Materials</h4>
              <p>Labor hour and time and materials contracts</p>
            </div>
            <div className="contract-type">
              <h4>GSA Schedules</h4>
              <p>GSA Schedule opportunities and task orders</p>
            </div>
            <div className="contract-type">
              <h4>Set-Aside Opportunities</h4>
              <p>Small business, veteran-owned, and other set-aside contracts</p>
            </div>
          </div>
        </div>

        <div className="cta-section">
          <h2>Ready to Dominate DoD Contracting?</h2>
          <p>
            Join defense contractors who are already using PS.AI Search to find and win 
            Department of Defense contracts across all agencies and commands.
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
