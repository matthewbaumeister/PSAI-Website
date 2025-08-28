export default function FAQPage() {
  return (
    <div className="faq-page">
      <div className="container">
        <div className="page-header">
          <h1>Frequently Asked Questions</h1>
          <p className="subtitle">
            Find answers to common questions about Prop Shop AI and government contracting.
          </p>
        </div>

        <div className="content-section">
          <h2>General Questions</h2>
          <p>Common questions about our platform and services.</p>
          
          <div className="faq-grid">
            <div className="faq-card">
              <h3>What is Prop Shop AI?</h3>
              <p>Prop Shop AI is a procurement intelligence platform that levels the playing field for small businesses in government contracting.</p>
              <span className="coming-soon-badge">Coming Soon</span>
            </div>
            
            <div className="faq-card">
              <h3>How does Prop Shop AI help small businesses?</h3>
              <p>We provide the same intelligence, tools, and opportunities that big companies use to win government contracts.</p>
              <span className="coming-soon-badge">Coming Soon</span>
            </div>
            
            <div className="faq-card">
              <h3>What products do you offer?</h3>
              <p>Our platform includes PS.AI Search, Compliance, Market Research, Write, and CRM solutions.</p>
              <span className="coming-soon-badge">Coming Soon</span>
            </div>
            
            <div className="faq-card">
              <h3>How much does Prop Shop AI cost?</h3>
              <p>Pricing varies based on your needs and company size. Contact us for a personalized quote.</p>
              <span className="coming-soon-badge">Coming Soon</span>
            </div>
          </div>
        </div>

        <div className="content-section">
          <h2>Technical Questions</h2>
          <p>Questions about platform features and integration.</p>
          
          <div className="faq-grid">
            <div className="faq-card">
              <h3>Do you offer API access?</h3>
              <p>Yes, we provide comprehensive APIs for integrating Prop Shop AI into your existing systems.</p>
              <span className="coming-soon-badge">Coming Soon</span>
            </div>
            
            <div className="faq-card">
              <h3>What data sources do you use?</h3>
              <p>We aggregate data from multiple government sources including SAM.gov, beta.SAM.gov, and agency databases.</p>
              <span className="coming-soon-badge">Coming Soon</span>
            </div>
            
            <div className="faq-card">
              <h3>How often is your data updated?</h3>
              <p>Our data is updated in real-time as government agencies publish new opportunities and information.</p>
              <span className="coming-soon-badge">Coming Soon</span>
            </div>
            
            <div className="faq-card">
              <h3>Can I export data from the platform?</h3>
              <p>Yes, you can export data in multiple formats including CSV, Excel, and through our API.</p>
              <span className="coming-soon-badge">Coming Soon</span>
            </div>
          </div>
        </div>

        <div className="content-section">
          <h2>Support & Training</h2>
          <p>Get help and learn how to use our platform effectively.</p>
          
          <div className="support-grid">
            <div className="support-card">
              <h3>How do I get support?</h3>
              <p>We offer multiple support channels including email, phone, and live chat for premium customers.</p>
              <span className="coming-soon-badge">Coming Soon</span>
            </div>
            
            <div className="support-card">
              <h3>Do you provide training?</h3>
              <p>Yes, we offer comprehensive training programs and onboarding support for new customers.</p>
              <span className="coming-soon-badge">Coming Soon</span>
            </div>
            
            <div className="support-card">
              <h3>Is there a user community?</h3>
              <p>We're building a community of government contracting professionals to share best practices.</p>
              <span className="coming-soon-badge">Coming Soon</span>
            </div>
          </div>
        </div>

        <div className="content-section">
          <h2>Still Have Questions?</h2>
          <p>Can't find what you're looking for? Our team is here to help.</p>
          
          <div className="contact-options">
            <div className="contact-option">
              <h3>Email Support</h3>
              <p>support@propshop.ai</p>
            </div>
            
            <div className="contact-option">
              <h3>Schedule a Demo</h3>
              <p>See the platform in action and get your questions answered.</p>
              <a href="/book-demo" className="btn btn-primary">Book Demo</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
