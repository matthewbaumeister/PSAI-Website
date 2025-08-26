import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'PS.AI CRM - Customer Relationship Management Platform',
  description: 'Streamline your procurement business with PS.AI CRM. Manage leads, track opportunities, and automate customer relationships.',
}

export default function CRMPage() {
  return (
    <main className="solution-page">
      <div className="container">
        <div className="page-header">
          <div className="badge">Customer Relationship Management</div>
          <h1>PS.AI CRM</h1>
          <p className="subtitle">
            The intelligent CRM platform built specifically for procurement professionals. 
            Manage leads, track opportunities, and automate customer relationships with AI-powered insights.
          </p>
        </div>

        <div className="hero-section">
          <div className="hero-content">
            <h2>Transform Your Procurement Business</h2>
            <p>
              PS.AI CRM goes beyond traditional customer management. It's designed specifically for 
              government contractors, procurement professionals, and businesses competing for federal opportunities.
            </p>
            <div className="hero-features">
              <div className="feature">
                <div className="feature-icon">🎯</div>
                <h3>Lead Intelligence</h3>
                <p>AI-powered lead scoring and qualification for procurement opportunities</p>
              </div>
              <div className="feature">
                <div className="feature-icon">📊</div>
                <h3>Pipeline Management</h3>
                <p>Track opportunities from initial contact to contract award</p>
              </div>
              <div className="feature">
                <div className="feature-icon">🤖</div>
                <h3>Automation</h3>
                <p>Automate follow-ups, reminders, and customer communications</p>
              </div>
            </div>
          </div>
        </div>

        <div className="content-section">
          <h2>Why PS.AI CRM for Procurement?</h2>
          <div className="benefits-grid">
            <div className="benefit-card">
              <h3>Government Contract Focus</h3>
              <p>
                Built specifically for federal contracting workflows, compliance requirements, 
                and opportunity tracking that traditional CRMs can't handle.
              </p>
            </div>
            <div className="benefit-card">
              <h3>AI-Powered Insights</h3>
              <p>
                Machine learning algorithms analyze your pipeline data to predict win probability, 
                identify bottlenecks, and suggest next best actions.
              </p>
            </div>
            <div className="benefit-card">
              <h3>Compliance Integration</h3>
              <p>
                Seamlessly integrate with PS.AI Compliance to ensure all customer interactions 
                meet federal contracting requirements.
              </p>
            </div>
            <div className="benefit-card">
              <h3>Opportunity Tracking</h3>
              <p>
                Track government opportunities, set-aside requirements, and competitive intelligence 
                all in one unified platform.
              </p>
            </div>
          </div>
        </div>

        <div className="content-section">
          <h2>Key Features</h2>
          <div className="features-list">
            <div className="feature-item">
              <h3>Lead Management</h3>
              <ul>
                <li>AI-powered lead scoring and qualification</li>
                <li>Automated lead capture from multiple sources</li>
                <li>Intelligent lead routing and assignment</li>
                <li>Lead nurturing workflows and campaigns</li>
              </ul>
            </div>
            <div className="feature-item">
              <h3>Opportunity Tracking</h3>
              <ul>
                <li>Government contract opportunity management</li>
                <li>Pipeline visualization and forecasting</li>
                <li>Win probability analysis and scoring</li>
                <li>Competitive intelligence tracking</li>
              </ul>
            </div>
            <div className="feature-item">
              <h3>Customer Communication</h3>
              <ul>
                <li>Automated email campaigns and follow-ups</li>
                <li>Meeting scheduling and calendar integration</li>
                <li>Document sharing and collaboration tools</li>
                <li>Communication history and audit trails</li>
              </ul>
            </div>
            <div className="feature-item">
              <h3>Analytics & Reporting</h3>
              <ul>
                <li>Real-time pipeline analytics</li>
                <li>Performance metrics and KPIs</li>
                <li>Forecasting and revenue projections</li>
                <li>Custom dashboards and reports</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="content-section">
          <h2>Integration Ecosystem</h2>
          <p>
            PS.AI CRM integrates seamlessly with other Prop Shop AI tools and popular business applications:
          </p>
          <div className="integrations-grid">
            <div className="integration">
              <h4>PS.AI Search</h4>
              <p>Automatically create leads from opportunity searches</p>
            </div>
            <div className="integration">
              <h4>PS.AI Compliance</h4>
              <p>Ensure all customer interactions meet compliance standards</p>
            </div>
            <div className="integration">
              <h4>PS.AI Write</h4>
              <p>Generate proposals and documents directly from CRM data</p>
            </div>
            <div className="integration">
              <h4>Email & Calendar</h4>
              <p>Sync with Outlook, Gmail, and calendar applications</p>
            </div>
            <div className="integration">
              <h4>Accounting Systems</h4>
              <p>Connect with QuickBooks, Xero, and other financial tools</p>
            </div>
            <div className="integration">
              <h4>Project Management</h4>
              <p>Integrate with Asana, Trello, and project tracking tools</p>
            </div>
          </div>
        </div>

        <div className="content-section">
          <h2>Pricing & Plans</h2>
          <div className="pricing-grid">
            <div className="pricing-card">
              <h3>Starter</h3>
              <div className="price">$49<span>/month</span></div>
              <ul>
                <li>Up to 1,000 contacts</li>
                <li>Basic lead management</li>
                <li>Email automation</li>
                <li>Standard reporting</li>
                <li>Email support</li>
              </ul>
              <a href="/contact" className="btn btn-primary">Get Started</a>
            </div>
            <div className="pricing-card featured">
              <div className="featured-badge">Most Popular</div>
              <h3>Professional</h3>
              <div className="price">$99<span>/month</span></div>
              <ul>
                <li>Up to 10,000 contacts</li>
                <li>Advanced lead scoring</li>
                <li>Pipeline management</li>
                <li>AI-powered insights</li>
                <li>Priority support</li>
                <li>Custom integrations</li>
              </ul>
              <a href="/contact" className="btn btn-primary">Get Started</a>
            </div>
            <div className="pricing-card">
              <h3>Enterprise</h3>
              <div className="price">Custom</div>
              <ul>
                <li>Unlimited contacts</li>
                <li>Advanced analytics</li>
                <li>Custom workflows</li>
                <li>Dedicated support</li>
                <li>On-premise options</li>
                <li>Custom development</li>
              </ul>
              <a href="/contact" className="btn btn-primary">Contact Sales</a>
            </div>
          </div>
        </div>

        <div className="cta-section">
          <h2>Ready to Transform Your Customer Relationships?</h2>
          <p>
            Join procurement professionals who are already using PS.AI CRM to win more contracts 
            and build stronger customer relationships.
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
