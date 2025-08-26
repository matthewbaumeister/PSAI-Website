import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy - Prop Shop AI',
  description: 'Learn how Prop Shop AI protects your privacy and handles your data.',
}

export default function PrivacyPage() {
  return (
    <main className="legal-page">
      <div className="container">
        <div className="page-header">
          <h1>Privacy Policy</h1>
          <p className="last-updated">Last updated: January 2025</p>
        </div>

        <div className="content-section">
          <h2>Introduction</h2>
          <p>
            Prop Shop AI ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our procurement intelligence platform and related services.
          </p>
        </div>

        <div className="content-section">
          <h2>Information We Collect</h2>
          
          <h3>Personal Information</h3>
          <p>We may collect personal information that you provide directly to us, including:</p>
          <ul>
            <li>Name and contact information (email address, phone number)</li>
            <li>Company information and job title</li>
            <li>Account credentials and profile information</li>
            <li>Communication preferences and marketing preferences</li>
          </ul>

          <h3>Usage Information</h3>
          <p>We automatically collect certain information about your use of our services:</p>
          <ul>
            <li>Log data and device information</li>
            <li>Usage patterns and feature interactions</li>
            <li>Performance data and error reports</li>
            <li>IP address and location data</li>
          </ul>
        </div>

        <div className="content-section">
          <h2>How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul>
            <li>Provide, maintain, and improve our services</li>
            <li>Process transactions and send related information</li>
            <li>Send technical notices and support messages</li>
            <li>Respond to your comments and questions</li>
            <li>Develop new products and services</li>
            <li>Protect against fraud and abuse</li>
          </ul>
        </div>

        <div className="content-section">
          <h2>Information Sharing and Disclosure</h2>
          <p>We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy:</p>
          <ul>
            <li>With your consent or at your direction</li>
            <li>To comply with legal obligations</li>
            <li>To protect our rights and safety</li>
            <li>In connection with a business transfer or merger</li>
          </ul>
        </div>

        <div className="content-section">
          <h2>Data Security</h2>
          <p>We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure.</p>
        </div>

        <div className="content-section">
          <h2>Your Rights and Choices</h2>
          <p>You have certain rights regarding your personal information:</p>
          <ul>
            <li>Access and review your personal information</li>
            <li>Correct inaccurate or incomplete information</li>
            <li>Request deletion of your personal information</li>
            <li>Opt-out of marketing communications</li>
            <li>Control cookie preferences</li>
          </ul>
        </div>

        <div className="content-section">
          <h2>Contact Us</h2>
          <p>If you have questions about this Privacy Policy or our privacy practices, please contact us at:</p>
          <div className="contact-info">
            <p><strong>Email:</strong> privacy@prop-shop.ai</p>
          </div>
        </div>
      </div>
    </main>
  )
}
