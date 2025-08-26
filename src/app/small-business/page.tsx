import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Small Business Solutions - Prop Shop AI for Small Business Contractors',
  description: 'Specialized solutions for small businesses competing in government contracting. Level the playing field with AI-powered tools and expertise.',
}

export default function SmallBusinessPage() {
  return (
    <main className="solution-page">
      <div className="container">
        <div className="page-header">
          <div className="badge">Small Business Focus</div>
          <h1>Small Business Solutions</h1>
          <p className="subtitle">
            Level the playing field with specialized solutions designed for small businesses 
            competing in government contracting. Win contracts against larger competitors.
          </p>
        </div>

        <div className="hero-section">
          <div className="hero-content">
            <h2>Small Business, Big Opportunities</h2>
            <p>
              Government contracting shouldn't be dominated by large corporations. Small businesses 
              bring innovation, agility, and local expertise that agencies need. We're here to help 
              you compete and win.
            </p>
            <div className="hero-features">
              <div className="feature">
                <div className="feature-icon">🎯</div>
                <h3>Set-Aside Expertise</h3>
                <p>Navigate SDVOSB, 8(a), WOSB, and HUBZone programs</p>
              </div>
              <div className="feature">
                <div className="feature-icon">🤝</div>
                <h3>Partnership Support</h3>
                <p>Build strategic partnerships and joint ventures</p>
              </div>
              <div className="feature">
                <div className="feature-icon">📈</div>
                <h3>Growth Strategy</h3>
                <p>Scale from small contracts to major opportunities</p>
              </div>
            </div>
          </div>
        </div>

        <div className="content-section">
          <h2>Why Small Businesses Choose Prop Shop AI</h2>
          <div className="benefits-grid">
            <div className="benefit-card">
              <h3>Level the Playing Field</h3>
              <p>
                Access the same intelligence, tools, and insights that large contractors use, 
                but designed specifically for small business needs and budgets.
              </p>
            </div>
            <div className="benefit-card">
              <h3>Set-Aside Mastery</h3>
              <p>
                Expert guidance on navigating small business programs, maintaining eligibility, 
                and maximizing your competitive advantages.
              </p>
            </div>
            <div className="benefit-card">
              <h3>Cost-Effective Solutions</h3>
              <p>
                Affordable pricing plans designed for small business budgets, with scalable 
                options that grow with your business.
              </p>
            </div>
            <div className="benefit-card">
              <h3>Personalized Support</h3>
              <p>
                Dedicated support from experts who understand small business challenges 
                and are committed to your success.
              </p>
            </div>
          </div>
        </div>

        <div className="content-section">
          <h2>Small Business Programs We Support</h2>
          <div className="programs">
            <div className="program">
              <h4>SDVOSB</h4>
              <p>Service-Disabled Veteran-Owned Small Business program support and compliance</p>
            </div>
            <div className="program">
              <h4>8(a) Business Development</h4>
              <p>Comprehensive support for socially and economically disadvantaged businesses</p>
            </div>
            <div className="program">
              <h4>WOSB/EDWOSB</h4>
              <p>Women-Owned Small Business and Economically Disadvantaged WOSB programs</p>
            </div>
            <div className="program">
              <h4>HUBZone</h4>
              <p>Historically Underutilized Business Zone program certification and compliance</p>
            </div>
            <div className="program">
              <h4>VOSB</h4>
              <p>Veteran-Owned Small Business program support and verification</p>
            </div>
            <div className="program">
              <h4>Small Business Innovation Research (SBIR)</h4>
              <p>Research and development funding opportunities for innovative small businesses</p>
            </div>
          </div>
        </div>

        <div className="content-section">
          <h2>Solutions Tailored for Small Business</h2>
          <div className="solutions">
            <div className="solution">
              <h4>PS.AI Search - Small Business Edition</h4>
              <p>Find set-aside opportunities and contracts specifically reserved for small businesses</p>
            </div>
            <div className="solution">
              <h4>PS.AI Compliance - Small Business Focus</h4>
              <p>Maintain eligibility and compliance for all small business programs</p>
            </div>
            <div className="solution">
              <h4>PS.AI Write - Small Business Templates</h4>
              <p>Proposal templates and content specifically designed for small business advantages</p>
            </div>
            <div className="solution">
              <h4>PS.AI CRM - Small Business Edition</h4>
              <p>Manage relationships with agencies, prime contractors, and partners</p>
            </div>
            <div className="solution">
              <h4>PS.AI Market Research - Small Business Insights</h4>
              <p>Market intelligence focused on small business opportunities and competitive landscape</p>
            </div>
            <div className="solution">
              <h4>Partnership Development</h4>
              <p>Build strategic partnerships and joint ventures to compete for larger contracts</p>
            </div>
          </div>
        </div>

        <div className="content-section">
          <h2>Success Strategies for Small Businesses</h2>
          <div className="strategies">
            <div className="strategy">
              <h4>Start Small, Scale Smart</h4>
              <p>Begin with smaller contracts to build experience and past performance</p>
            </div>
            <div className="strategy">
              <h4>Leverage Set-Asides</h4>
              <p>Maximize your competitive advantages in set-aside competitions</p>
            </div>
            <div className="strategy">
              <h4>Build Relationships</h4>
              <p>Develop strong relationships with contracting officers and agency personnel</p>
            </div>
            <div className="strategy">
              <h4>Partner Strategically</h4>
              <p>Form partnerships to compete for larger opportunities</p>
            </div>
            <div className="strategy">
              <h4>Focus on Quality</h4>
              <p>Deliver exceptional performance to build your reputation</p>
            </div>
            <div className="strategy">
              <h4>Continuous Learning</h4>
              <p>Stay updated on regulations, opportunities, and best practices</p>
            </div>
          </div>
        </div>

        <div className="content-section">
          <h2>Small Business Success Stories</h2>
          <div className="success-stories">
            <div className="story">
              <h4>TechStart Solutions</h4>
              <p>Went from $50K to $2M in government contracts in 18 months using our tools</p>
            </div>
            <div className="story">
              <h4>Veteran Build Co.</h4>
              <p>Successfully navigated SDVOSB certification and won multiple construction contracts</p>
            </div>
            <div className="story">
              <h4>InnovateIT</h4>
              <p>Used our market research to identify and win SBIR funding opportunities</p>
            </div>
            <div className="story">
              <h4>Local Services Inc.</h4>
              <p>Leveraged HUBZone status to win local government contracts</p>
            </div>
          </div>
        </div>

        <div className="content-section">
          <h2>Pricing & Plans</h2>
          <div className="pricing-grid">
            <div className="pricing-card">
              <h3>Small Business Starter</h3>
              <div className="price">$29<span>/month</span></div>
              <ul>
                <li>Basic opportunity search</li>
                <li>Set-aside opportunity alerts</li>
                <li>Basic compliance tracking</li>
                <li>Email support</li>
                <li>Perfect for businesses under $1M</li>
              </ul>
              <a href="/contact" className="btn btn-primary">Get Started</a>
            </div>
            <div className="pricing-card featured">
              <div className="featured-badge">Most Popular</div>
              <h3>Small Business Professional</h3>
              <div className="price">$69<span>/month</span></div>
              <ul>
                <li>Full platform access</li>
                <li>Advanced set-aside tracking</li>
                <li>Compliance automation</li>
                <li>Proposal assistance</li>
                <li>Priority support</li>
                <li>Perfect for growing businesses</li>
              </ul>
              <a href="/contact" className="btn btn-primary">Get Started</a>
            </div>
            <div className="pricing-card">
              <h3>Small Business Enterprise</h3>
              <div className="price">$149<span>/month</span></div>
              <ul>
                <li>Everything in Professional</li>
                <li>Dedicated small business advisor</li>
                <li>Custom training and onboarding</li>
                <li>Partnership development support</li>
                <li>Growth strategy consulting</li>
                <li>Perfect for established small businesses</li>
              </ul>
              <a href="/contact" className="btn btn-primary">Contact Sales</a>
            </div>
          </div>
        </div>

        <div className="cta-section">
          <h2>Ready to Level the Playing Field?</h2>
          <p>
            Join thousands of small businesses who are already using Prop Shop AI to compete 
            and win in government contracting.
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
