export default function CareersPage() {
  return (
    <div className="careers-page">
      <div className="container">
        <div className="page-header">
          <h1>Join Our Team</h1>
          <p className="subtitle">
            Help us level the playing field for small businesses in government contracting. 
            We're building the future of procurement intelligence.
          </p>
        </div>

        <div className="content-section">
          <h2>Our Mission</h2>
          <p>
            We're on a mission to democratize access to government contracting tools and intelligence. 
            Our team is passionate about helping small businesses compete and win against established giants.
          </p>
          
          <div className="values-grid">
            <div className="value-card">
              <h3>Innovation</h3>
              <p>We're constantly pushing the boundaries of what's possible with AI and government contracting.</p>
            </div>
            
            <div className="value-card">
              <h3>Impact</h3>
              <p>Every feature we build helps small businesses win more contracts and grow their revenue.</p>
            </div>
            
            <div className="value-card">
              <h3>Collaboration</h3>
              <p>We believe the best solutions come from diverse teams working together.</p>
            </div>
          </div>
        </div>

        <div className="content-section">
          <h2>Open Positions</h2>
          <p>We're growing our team! Check back soon for open positions in:</p>
          
          <div className="positions-grid">
            <div className="position-card">
              <h3>Engineering</h3>
              <p>Full-stack developers, AI engineers, and DevOps specialists.</p>
              <span className="coming-soon-badge">Coming Soon</span>
            </div>
            
            <div className="position-card">
              <h3>Product & Design</h3>
              <p>Product managers, UX designers, and user researchers.</p>
              <span className="coming-soon-badge">Coming Soon</span>
            </div>
            
            <div className="position-card">
              <h3>Sales & Marketing</h3>
              <p>Sales representatives, marketing specialists, and customer success managers.</p>
              <span className="coming-soon-badge">Coming Soon</span>
            </div>
            
            <div className="position-card">
              <h3>Operations</h3>
              <p>Business analysts, project managers, and operations specialists.</p>
              <span className="coming-soon-badge">Coming Soon</span>
            </div>
          </div>
        </div>

        <div className="content-section">
          <h2>Why Work With Us?</h2>
          <div className="benefits-grid">
            <div className="benefit-card">
              <h3>Remote First</h3>
              <p>Work from anywhere in the United States with flexible hours.</p>
            </div>
            
            <div className="benefit-card">
              <h3>Competitive Benefits</h3>
              <p>Health insurance, 401(k), unlimited PTO, and professional development.</p>
            </div>
            
            <div className="benefit-card">
              <h3>Growth Opportunities</h3>
              <p>Fast-paced environment with opportunities to learn and advance quickly.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
