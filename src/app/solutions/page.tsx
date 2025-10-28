import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Solutions - Prop Shop AI Government Contracting Tools & Services',
  description: 'Discover our comprehensive suite of AI-powered government contracting solutions: MATRIX intelligence platform, Compliance, Writing, and Small Business tools.',
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
            <h2>One Platform, Powerful Solutions</h2>
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
              <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" width="64" height="64">
                <defs>
                  <linearGradient id="matrixGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{stopColor:"#3b82f6",stopOpacity:1}} />
                    <stop offset="100%" style={{stopColor:"#8b5cf6",stopOpacity:1}} />
                  </linearGradient>
                </defs>
                <circle cx="20" cy="20" r="12" stroke="url(#matrixGradient)" strokeWidth="3" fill="none"/>
                <line x1="28" y1="28" x2="38" y2="38" stroke="url(#matrixGradient)" strokeWidth="3" strokeLinecap="round"/>
                <circle cx="12" cy="12" r="2" fill="url(#matrixGradient)"/>
                <circle cx="28" cy="12" r="2" fill="url(#matrixGradient)"/>
                <circle cx="12" cy="28" r="2" fill="url(#matrixGradient)"/>
                <line x1="12" y1="12" x2="28" y2="12" stroke="url(#matrixGradient)" strokeWidth="1.5" opacity="0.6"/>
                <line x1="12" y1="12" x2="12" y2="28" stroke="url(#matrixGradient)" strokeWidth="1.5" opacity="0.6"/>
                <rect x="32" y="8" width="8" height="10" rx="1" fill="url(#matrixGradient)" opacity="0.8"/>
                <line x1="34" y1="11" x2="38" y2="11" stroke="white" strokeWidth="1"/>
                <line x1="34" y1="13" x2="38" y2="13" stroke="white" strokeWidth="1"/>
              </svg>
            </div>
            <div className="solution-content">
              <h3>MATRIX</h3>
              <p>MAKE‑READY Acquisition & Technology Readiness Intelligence eXchange - our comprehensive DoD-wide search and intelligence platform combining market research, opportunity tracking, and strategic analysis.</p>
              <div className="solution-features">
                <span className="feature-tag">DoD-Wide Search</span>
                <span className="feature-tag">Market Intelligence</span>
                <span className="feature-tag">Strategic Analysis</span>
              </div>
              <a href="/matrix" className="btn btn-primary">Learn More</a>
            </div>
          </div>

          <div className="solution-card">
            <div className="solution-icon">
              <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" width="64" height="64">
                <defs>
                  <linearGradient id="complianceGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{stopColor:"#ff6b35",stopOpacity:1}} />
                    <stop offset="100%" style={{stopColor:"#f7931e",stopOpacity:1}} />
                  </linearGradient>
                </defs>
                <circle cx="16" cy="16" r="3" fill="url(#complianceGradient)"/>
                <circle cx="32" cy="16" r="3" fill="url(#complianceGradient)"/>
                <circle cx="24" cy="24" r="3" fill="url(#complianceGradient)"/>
                <circle cx="16" cy="32" r="3" fill="url(#complianceGradient)"/>
                <circle cx="32" cy="32" r="3" fill="url(#complianceGradient)"/>
                <line x1="16" y1="16" x2="24" y2="24" stroke="url(#complianceGradient)" strokeWidth="2" opacity="0.6"/>
                <line x1="32" y1="16" x2="24" y2="24" stroke="url(#complianceGradient)" strokeWidth="2" opacity="0.6"/>
                <line x1="24" y1="24" x2="16" y2="32" stroke="url(#complianceGradient)" strokeWidth="2" opacity="0.6"/>
                <line x1="24" y1="24" x2="32" y2="32" stroke="url(#complianceGradient)" strokeWidth="2" opacity="0.6"/>
                <path d="M8 24 L12 28 L20 20" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
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
              <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" width="64" height="64">
                <defs>
                  <linearGradient id="writeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{stopColor:"#ff6b35",stopOpacity:1}} />
                    <stop offset="100%" style={{stopColor:"#f7931e",stopOpacity:1}} />
                  </linearGradient>
                </defs>
                <path d="M8 36 L36 8 L40 12 L12 40 L8 36 Z" fill="url(#writeGradient)"/>
                <path d="M36 8 L40 12 L44 8 L40 4 L36 8 Z" fill="url(#writeGradient)" opacity="0.8"/>
                <rect x="12" y="16" width="20" height="24" rx="2" fill="url(#writeGradient)" opacity="0.3"/>
                <line x1="16" y1="20" x2="28" y2="20" stroke="white" strokeWidth="1"/>
                <line x1="16" y1="24" x2="28" y2="24" stroke="white" strokeWidth="1"/>
                <line x1="16" y1="28" x2="28" y2="28" stroke="white" strokeWidth="1"/>
                <line x1="16" y1="32" x2="24" y2="32" stroke="white" strokeWidth="1"/>
                <path d="M16 20 L28 20" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M16 24 L28 24" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M16 28 L28 28" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M16 32 L24 32" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
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
              <img src="/icons/small-business-icon.svg" alt="Small Business Icon" width="64" height="64" />
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

          <div className="solution-card">
            <div className="solution-icon">
              <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" width="64" height="64">
                <defs>
                  <linearGradient id="dsipGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{stopColor:"#8b5cf6",stopOpacity:1}} />
                    <stop offset="100%" style={{stopColor:"#7c3aed",stopOpacity:1}} />
                  </linearGradient>
                </defs>
                <rect x="8" y="8" width="32" height="32" rx="6" fill="url(#dsipGradient)" opacity="0.9"/>
                <circle cx="16" cy="16" r="2" fill="white"/>
                <circle cx="32" cy="16" r="2" fill="white"/>
                <circle cx="24" cy="24" r="2" fill="white"/>
                <circle cx="16" cy="32" r="2" fill="white"/>
                <circle cx="32" cy="32" r="2" fill="white"/>
                <line x1="16" y1="16" x2="24" y2="24" stroke="white" strokeWidth="1.5" opacity="0.8"/>
                <line x1="32" y1="16" x2="24" y2="24" stroke="white" strokeWidth="1.5" opacity="0.8"/>
                <line x1="24" y1="24" x2="16" y2="32" stroke="white" strokeWidth="1.5" opacity="0.8"/>
                <line x1="24" y1="24" x2="32" y2="32" stroke="white" strokeWidth="1.5" opacity="0.8"/>
                <path d="M12 12 L20 12 L20 20 L12 20 Z" fill="white" opacity="0.6"/>
                <path d="M28 12 L36 12 L36 20 L28 20 Z" fill="white" opacity="0.6"/>
                <path d="M20 28 L28 28 L28 36 L20 36 Z" fill="white" opacity="0.6"/>
              </svg>
            </div>
            <div className="solution-content">
              <h3>DSIP Smart Search</h3>
              <p>Advanced search tool for 33,000+ DSIP opportunities with AI-powered matching, real-time updates, and comprehensive filtering across all defense agencies.</p>
              <div className="solution-features">
                <span className="feature-tag">33K+ Opportunities</span>
                <span className="feature-tag">AI Matching</span>
                <span className="feature-tag">Real-time Updates</span>
              </div>
              <a href="/dsip-search" className="btn btn-primary">Launch Tool</a>
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
              <div className="feature-icon"></div>
              <h4>Data Sync</h4>
              <p>Information flows seamlessly between all solutions</p>
            </div>
            <div className="integration-feature">
              <div className="feature-icon">👥</div>
              <h4>Team Collaboration</h4>
              <p>Work together across all tools and platforms</p>
            </div>
            <div className="integration-feature">
              <div className="feature-icon"></div>
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
