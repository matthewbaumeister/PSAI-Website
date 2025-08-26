import type { Metadata } from 'next'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'Solutions - Prop Shop AI Government Contracting Tools & Services',
  description: 'Discover our comprehensive suite of AI-powered government contracting solutions: Search, Compliance, Market Research, Writing, CRM, and Small Business tools.',
}

export default function SolutionsPage() {
  return (
    <main className="solutions-page">
      <div className="container">
        <div className="page-header">
          <div className="badge">Our Solutions</div>
          <h1>Complete Government Contracting Intelligence Platform</h1>
          <p className="subtitle">
            From opportunity discovery to proposal writing, we provide the tools and intelligence 
            that level the playing field for innovative companies competing in government contracting.
          </p>
        </div>

        <div className="hero-section">
          <div className="hero-content">
            <h2>One Platform, Six Powerful Solutions</h2>
            <p>
              We've built a comprehensive ecosystem that gives you the same capabilities that 
              established companies spend millions developing. No more playing catch-up - 
              compete on equal footing from day one.
            </p>
          </div>
        </div>

        <div className="solutions-grid">
          <div className="solution-card">
            <div className="solution-icon">
              <Image src="/icons/search-icon.svg" alt="Search Icon" width={48} height={48} />
            </div>
            <div className="solution-content">
              <h3>PS.AI Search</h3>
              <p>DoD-wide government contract search and opportunity discovery platform. Find new work opportunities across all defense agencies with our proprietary search algorithms.</p>
              <div className="solution-features">
                <span className="feature-tag">Contract Discovery</span>
                <span className="feature-tag">DoD Coverage</span>
                <span className="feature-tag">Real-time Updates</span>
              </div>
              <a href="/search" className="btn btn-primary">Learn More</a>
            </div>
          </div>

          <div className="solution-card">
            <div className="solution-icon">
              <Image src="/icons/compliance-icon.svg" alt="Compliance Icon" width={48} height={48} />
            </div>
            <div className="solution-content">
              <h3>PS.AI Compliance</h3>
              <p>Custom tailored proposal templates powered by cutting-edge AI and PhD-level writers. Create winning proposals that meet all compliance requirements.</p>
              <div className="solution-features">
                <span className="feature-tag">AI Templates</span>
                <span className="feature-tag">PhD Writers</span>
                <span className="feature-tag">Compliance Check</span>
              </div>
              <a href="/compliance" className="btn btn-primary">Learn More</a>
            </div>
          </div>

          <div className="solution-card">
            <div className="solution-icon">
              <Image src="/icons/market-research-icon.svg" alt="Market Research Icon" width={48} height={48} />
            </div>
            <div className="solution-content">
              <h3>PS.AI Market Research</h3>
              <p>Proprietary data and search platform for creating and tracking opportunities and industries. Build market intelligence that drives strategic decisions.</p>
              <div className="solution-features">
                <span className="feature-tag">Market Data</span>
                <span className="feature-tag">Opportunity Tracking</span>
                <span className="feature-tag">Strategic Insights</span>
              </div>
              <a href="/market-research" className="btn btn-primary">Learn More</a>
            </div>
          </div>

          <div className="solution-card">
            <div className="solution-icon">
              <Image src="/icons/write-icon.svg" alt="Write Icon" width={48} height={48} />
            </div>
            <div className="solution-content">
              <h3>PS.AI Write</h3>
              <p>PhD-level in-house writing service for both AI-assisted and 100% manual writing. Professional proposal writing that wins contracts.</p>
              <div className="solution-features">
                <span className="feature-tag">PhD Writers</span>
                <span className="feature-tag">AI Assisted</span>
                <span className="feature-tag">Manual Writing</span>
              </div>
              <a href="/write" className="btn btn-primary">Learn More</a>
            </div>
          </div>

          <div className="solution-card">
            <div className="solution-icon">
              <Image src="/icons/crm-icon.svg" alt="CRM Icon" width={48} height={48} />
            </div>
            <div className="solution-content">
              <h3>PS.AI CRM</h3>
              <p>Customer relationship management platform designed specifically for government contracting. Track opportunities, manage relationships, and close more deals.</p>
              <div className="solution-features">
                <span className="feature-tag">Opportunity Tracking</span>
                <span className="feature-tag">Relationship Management</span>
                <span className="feature-tag">Pipeline Analytics</span>
              </div>
              <a href="/crm" className="btn btn-primary">Learn More</a>
            </div>
          </div>

          <div className="solution-card">
            <div className="solution-icon">
              <Image src="/icons/small-business-icon.svg" alt="Small Business Icon" width={48} height={48} />
            </div>
            <div className="solution-content">
              <h3>PS.AI Small Business</h3>
              <p>SBIR/SBA dedicated proprietary search and database platform for small business set-aside contracts. Find opportunities designed specifically for your business.</p>
              <div className="solution-features">
                <span className="feature-tag">SBIR Programs</span>
                <span className="feature-tag">SBA Resources</span>
                <span className="feature-tag">Set-aside Focus</span>
              </div>
              <a href="/small-business" className="btn btn-primary">Learn More</a>
            </div>
          </div>
        </div>

        <div className="integration-section">
          <h2>Seamless Integration</h2>
          <p>
            All our solutions work together as one unified platform. Share data, insights, and 
            opportunities across your entire team. No more switching between disconnected tools.
          </p>
          <div className="integration-features">
            <div className="integration-feature">
              <div className="feature-icon">🔄</div>
              <h4>Data Sync</h4>
              <p>Information flows seamlessly between all solutions</p>
            </div>
            <div className="integration-feature">
              <div className="feature-icon">👥</div>
              <h4>Team Collaboration</h4>
              <p>Work together across all tools and platforms</p>
            </div>
            <div className="integration-feature">
              <div className="feature-icon">📊</div>
              <h4>Unified Analytics</h4>
              <p>See the full picture across all your activities</p>
            </div>
          </div>
        </div>

        <div className="cta-section">
          <h2>Ready to Level the Playing Field?</h2>
          <p>
            Get access to the same tools and intelligence that established companies use to win 
            government contracts. Start competing on equal footing today.
          </p>
          <div className="cta-buttons">
            <a href="/book-demo" className="btn btn-primary btn-lg">Book Demo</a>
            <a href="/contact" className="btn btn-outline btn-lg">Get Started</a>
          </div>
        </div>
      </div>
    </main>
  )
}
