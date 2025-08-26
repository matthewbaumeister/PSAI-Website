import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'PS.AI Write - AI-Powered Proposal and Document Generation Platform',
  description: 'Generate winning proposals, compliance documents, and business content with AI-powered writing assistance. Save time and improve quality.',
}

export default function WritePage() {
  return (
    <main className="solution-page">
      <div className="container">
        <div className="page-header">
          <div className="badge">AI Writing Platform</div>
          <h1>PS.AI Write</h1>
          <p className="subtitle">
            Generate winning proposals, compliance documents, and business content with AI-powered 
            writing assistance. Save time, improve quality, and win more contracts.
          </p>
        </div>

        <div className="hero-section">
          <div className="hero-content">
            <h2>Write Like a Pro, Win Like a Champion</h2>
            <p>
              Government proposals and business documents require precision, clarity, and compliance. 
              PS.AI Write helps you create compelling content that meets all requirements and wins contracts.
            </p>
            <div className="hero-features">
              <div className="feature">
                <div className="feature-icon">✍️</div>
                <h3>AI Writing Assistant</h3>
                <p>Intelligent content generation and writing guidance</p>
              </div>
              <div className="feature">
                <div className="feature-icon">📋</div>
                <h3>Proposal Templates</h3>
                <p>Industry-specific templates and best practices</p>
              </div>
              <div className="feature">
                <div className="feature-icon">✅</div>
                <h3>Compliance Checker</h3>
                <p>Ensure all content meets regulatory requirements</p>
              </div>
            </div>
          </div>
        </div>

        <div className="content-section">
          <h2>Why PS.AI Write?</h2>
          <div className="benefits-grid">
            <div className="benefit-card">
              <h3>Save Time</h3>
              <p>
                Reduce proposal writing time by 60% with AI-powered content generation, 
                smart templates, and automated compliance checking.
              </p>
            </div>
            <div className="benefit-card">
              <h3>Improve Quality</h3>
              <p>
                Generate professional, compelling content that meets industry standards 
                and government requirements.
              </p>
            </div>
            <div className="benefit-card">
              <h3>Ensure Compliance</h3>
              <p>
                Built-in compliance checking ensures all content meets federal regulations, 
                agency requirements, and industry standards.
              </p>
            </div>
            <div className="benefit-card">
              <h3>Win More Contracts</h3>
              <p>
                Professional, compliant content increases your win rate and helps you 
                stand out from the competition.
              </p>
            </div>
          </div>
        </div>

        <div className="content-section">
          <h2>Document Types Supported</h2>
          <div className="document-types">
            <div className="doc-type">
              <h4>Government Proposals</h4>
              <p>RFPs, RFQs, RFIs, and other government solicitation responses</p>
            </div>
            <div className="doc-type">
              <h4>Compliance Documents</h4>
              <p>Subcontracting plans, utilization reports, and compliance certifications</p>
            </div>
            <div className="doc-type">
              <h4>Business Documents</h4>
              <p>Capability statements, past performance narratives, and technical approaches</p>
            </div>
            <div className="doc-type">
              <h4>Marketing Content</h4>
              <p>Company descriptions, service offerings, and value propositions</p>
            </div>
            <div className="doc-type">
              <h4>Technical Content</h4>
              <p>Technical approaches, methodologies, and implementation plans</p>
            </div>
            <div className="doc-type">
              <h4>Executive Summaries</h4>
              <p>Compelling executive summaries and abstracts</p>
            </div>
          </div>
        </div>

        <div className="content-section">
          <h2>Key Features</h2>
          <div className="features-list">
            <div className="feature-item">
              <h3>AI Writing Assistant</h3>
              <ul>
                <li>Intelligent content generation and suggestions</li>
                <li>Context-aware writing assistance</li>
                <li>Grammar and style improvement</li>
                <li>Industry-specific terminology</li>
              </ul>
            </div>
            <div className="feature-item">
              <h3>Smart Templates</h3>
              <ul>
                <li>Industry-specific proposal templates</li>
                <li>Customizable document structures</li>
                <li>Best practice guidelines</li>
                <li>Version control and collaboration</li>
              </ul>
            </div>
            <div className="feature-item">
              <h3>Compliance Engine</h3>
              <ul>
                <li>Automated compliance checking</li>
                <li>Regulatory requirement validation</li>
                <li>Content quality scoring</li>
                <li>Compliance audit trails</li>
              </ul>
            </div>
            <div className="feature-item">
              <h3>Content Management</h3>
              <ul>
                <li>Centralized content library</li>
                <li>Reusable content components</li>
                <li>Content versioning and tracking</li>
                <li>Team collaboration tools</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="content-section">
          <h2>Writing Workflows</h2>
          <div className="workflows">
            <div className="workflow">
              <h4>1. Content Planning</h4>
              <p>Define requirements, outline structure, and plan content strategy</p>
            </div>
            <div className="workflow">
              <h4>2. AI Generation</h4>
              <p>Generate initial content using AI-powered writing assistance</p>
            </div>
            <div className="workflow">
              <h4>3. Content Refinement</h4>
              <p>Review, edit, and refine content for clarity and impact</p>
            </div>
            <div className="workflow">
              <h4>4. Compliance Check</h4>
              <p>Automated compliance validation and quality assurance</p>
            </div>
            <div className="workflow">
              <h4>5. Final Review</h4>
              <p>Team review, approval, and final document preparation</p>
            </div>
            <div className="workflow">
              <h4>6. Submission</h4>
              <p>Export in required formats and prepare for submission</p>
            </div>
          </div>
        </div>

        <div className="content-section">
          <h2>Industry Specializations</h2>
          <div className="industries">
            <div className="industry">
              <h4>Information Technology</h4>
              <p>Software development, cloud services, cybersecurity, and IT consulting</p>
            </div>
            <div className="industry">
              <h4>Defense & Aerospace</h4>
              <p>Military contracts, defense systems, aerospace technology, and security</p>
            </div>
            <div className="industry">
              <h4>Healthcare</h4>
              <p>Medical services, healthcare IT, research, and clinical support</p>
            </div>
            <div className="industry">
              <h4>Construction</h4>
              <p>Infrastructure, building construction, renovation, and maintenance</p>
            </div>
            <div className="industry">
              <h4>Professional Services</h4>
              <p>Consulting, training, research, and administrative support</p>
            </div>
            <div className="industry">
              <h4>Manufacturing</h4>
              <p>Product manufacturing, supply chain, and industrial services</p>
            </div>
          </div>
        </div>

        <div className="content-section">
          <h2>Pricing & Plans</h2>
          <div className="pricing-grid">
            <div className="pricing-card">
              <h3>Starter</h3>
              <div className="price">$39<span>/month</span></div>
              <ul>
                <li>Up to 5 documents/month</li>
                <li>Basic AI writing assistance</li>
                <li>Standard templates</li>
                <li>Basic compliance checking</li>
                <li>Email support</li>
              </ul>
              <a href="/contact" className="btn btn-primary">Get Started</a>
            </div>
            <div className="pricing-card featured">
              <div className="featured-badge">Most Popular</div>
              <h3>Professional</h3>
              <div className="price">$79<span>/month</span></div>
              <ul>
                <li>Unlimited documents</li>
                <li>Advanced AI writing assistance</li>
                <li>Premium templates</li>
                <li>Advanced compliance checking</li>
                <li>Team collaboration</li>
                <li>Priority support</li>
              </ul>
              <a href="/contact" className="btn btn-primary">Get Started</a>
            </div>
            <div className="pricing-card">
              <h3>Enterprise</h3>
              <div className="price">Custom</div>
              <ul>
                <li>Custom templates and workflows</li>
                <li>Dedicated writing support</li>
                <li>Training and onboarding</li>
                <li>Custom integrations</li>
                <li>SLA guarantees</li>
                <li>White-label options</li>
              </ul>
              <a href="/contact" className="btn btn-primary">Contact Sales</a>
            </div>
          </div>
        </div>

        <div className="cta-section">
          <h2>Start Writing Winning Content Today</h2>
          <p>
            Join government contractors who use PS.AI Write to create compelling proposals 
            and win more contracts.
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
