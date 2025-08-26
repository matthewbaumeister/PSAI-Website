import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'PS.AI Compliance - Automated Government Contract Compliance Platform',
  description: 'Ensure your government contracts meet all compliance requirements with AI-powered automation. Stay compliant and avoid costly penalties.',
}

export default function CompliancePage() {
  return (
    <main className="solution-page">
      <div className="container">
        <div className="page-header">
          <div className="badge">Compliance Automation</div>
          <h1>PS.AI Compliance</h1>
          <p className="subtitle">
            Automate government contract compliance with AI-powered tools. Stay compliant with 
            federal regulations, track requirements, and avoid costly penalties.
          </p>
        </div>

        <div className="hero-section">
          <div className="hero-content">
            <h2>Stay Compliant, Stay Competitive</h2>
            <p>
              Government contract compliance is complex and constantly changing. PS.AI Compliance 
              automates the process, ensuring you meet all requirements while focusing on winning contracts.
            </p>
            <div className="hero-features">
              <div className="feature">
                <div className="feature-icon">✅</div>
                <h3>Automated Checks</h3>
                <p>AI-powered compliance validation and requirement tracking</p>
              </div>
              <div className="feature">
                <div className="feature-icon">📋</div>
                <h3>Requirement Management</h3>
                <p>Centralized tracking of all compliance obligations</p>
              </div>
              <div className="feature">
                <div className="feature-icon">🔔</div>
                <h3>Smart Alerts</h3>
                <p>Proactive notifications for upcoming deadlines and changes</p>
              </div>
            </div>
          </div>
        </div>

        <div className="content-section">
          <h2>Why PS.AI Compliance?</h2>
          <div className="benefits-grid">
            <div className="benefit-card">
              <h3>Automated Compliance</h3>
              <p>
                Reduce manual compliance work by 80% with AI-powered automation that 
                continuously monitors and validates your compliance status.
              </p>
            </div>
            <div className="benefit-card">
              <h3>Real-Time Monitoring</h3>
              <p>
                Get instant alerts when compliance requirements change, deadlines approach, 
                or new regulations affect your contracts.
              </p>
            </div>
            <div className="benefit-card">
              <h3>Risk Mitigation</h3>
              <p>
                Identify compliance risks before they become problems and maintain 
                a clean compliance record for future contract opportunities.
              </p>
            </div>
            <div className="benefit-card">
              <h3>Cost Savings</h3>
              <p>
                Avoid costly penalties, contract terminations, and legal fees by 
                maintaining proactive compliance management.
              </p>
            </div>
          </div>
        </div>

        <div className="content-section">
          <h2>Compliance Areas Covered</h2>
          <div className="compliance-areas">
            <div className="area">
              <h4>Small Business Programs</h4>
              <p>SDVOSB, 8(a), WOSB, HUBZone, and other set-aside compliance</p>
            </div>
            <div className="area">
              <h4>Labor Standards</h4>
              <p>Davis-Bacon Act, Service Contract Act, and prevailing wage requirements</p>
            </div>
            <div className="area">
              <h4>Contractor Qualifications</h4>
              <p>Past performance, financial capacity, and technical capability requirements</p>
            </div>
            <div className="area">
              <h4>Reporting Requirements</h4>
              <p>Subcontracting plans, utilization reports, and compliance certifications</p>
            </div>
            <div className="area">
              <h4>Security Clearances</h4>
              <p>Facility clearances, personnel clearances, and security requirements</p>
            </div>
            <div className="area">
              <h4>Environmental Compliance</h4>
              <p>Environmental impact assessments and sustainability requirements</p>
            </div>
          </div>
        </div>

        <div className="content-section">
          <h2>Key Features</h2>
          <div className="features-list">
            <div className="feature-item">
              <h3>Compliance Dashboard</h3>
              <ul>
                <li>Real-time compliance status overview</li>
                <li>Risk assessment and scoring</li>
                <li>Compliance trend analysis</li>
                <li>Custom compliance metrics</li>
              </ul>
            </div>
            <div className="feature-item">
              <h3>Requirement Tracking</h3>
              <ul>
                <li>Automated requirement identification</li>
                <li>Deadline tracking and reminders</li>
                <li>Compliance validation workflows</li>
                <li>Document management and storage</li>
              </ul>
            </div>
            <div className="feature-item">
              <h3>Automated Monitoring</h3>
              <ul>
                <li>Regulatory change detection</li>
                <li>Compliance gap analysis</li>
                <li>Automated compliance checks</li>
                <li>Real-time status updates</li>
              </ul>
            </div>
            <div className="feature-item">
              <h3>Reporting & Analytics</h3>
              <ul>
                <li>Compliance audit reports</li>
                <li>Performance analytics</li>
                <li>Risk assessment reports</li>
                <li>Executive dashboards</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="content-section">
          <h2>Integration Benefits</h2>
          <div className="integration-benefits">
            <div className="benefit">
              <h4>PS.AI Search</h4>
              <p>Automatically validate compliance requirements for new opportunities</p>
            </div>
            <div className="benefit">
              <h4>PS.AI CRM</h4>
              <p>Track compliance status alongside customer relationships</p>
            </div>
            <div className="benefit">
              <h4>PS.AI Write</h4>
              <p>Generate compliance documentation and reports automatically</p>
            </div>
            <div className="benefit">
              <h4>Government Systems</h4>
              <p>Direct integration with SAM.gov and other federal databases</p>
            </div>
          </div>
        </div>

        <div className="content-section">
          <h2>Pricing & Plans</h2>
          <div className="pricing-grid">
            <div className="pricing-card">
              <h3>Basic</h3>
              <div className="price">$39<span>/month</span></div>
              <ul>
                <li>Up to 5 active contracts</li>
                <li>Basic compliance tracking</li>
                <li>Email alerts</li>
                <li>Standard reporting</li>
                <li>Email support</li>
              </ul>
              <a href="/contact" className="btn btn-primary">Get Started</a>
            </div>
            <div className="pricing-card featured">
              <div className="featured-badge">Most Popular</div>
              <h3>Professional</h3>
              <div className="price">$89<span>/month</span></div>
              <ul>
                <li>Up to 25 active contracts</li>
                <li>AI-powered compliance automation</li>
                <li>Advanced risk assessment</li>
                <li>Custom workflows</li>
                <li>Priority support</li>
                <li>API access</li>
              </ul>
              <a href="/contact" className="btn btn-primary">Get Started</a>
            </div>
            <div className="pricing-card">
              <h3>Enterprise</h3>
              <div className="price">Custom</div>
              <ul>
                <li>Unlimited contracts</li>
                <li>Custom compliance rules</li>
                <li>Dedicated compliance manager</li>
                <li>Training and onboarding</li>
                <li>SLA guarantees</li>
                <li>Custom integrations</li>
              </ul>
              <a href="/contact" className="btn btn-primary">Contact Sales</a>
            </div>
          </div>
        </div>

        <div className="cta-section">
          <h2>Protect Your Business with Smart Compliance</h2>
          <p>
            Join government contractors who trust PS.AI Compliance to keep them 
            compliant and competitive in the federal marketplace.
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
