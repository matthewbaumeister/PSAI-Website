import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service - Prop Shop AI',
  description: 'Read the terms and conditions for using Prop Shop AI services.',
}

export default function TermsPage() {
  return (
    <main className="legal-page">
      <div className="container">
        <div className="page-header">
          <h1>Terms of Service</h1>
          <p className="last-updated">Last updated: January 2025</p>
        </div>

        <div className="content-section">
          <h2>Agreement to Terms</h2>
          <p>
            These Terms of Service ("Terms") govern your use of Prop Shop AI's procurement intelligence platform and related services. By accessing or using our services, you agree to be bound by these Terms.
          </p>
        </div>

        <div className="content-section">
          <h2>Description of Services</h2>
          <p>Prop Shop AI provides:</p>
          <ul>
            <li>Procurement intelligence and market research tools</li>
            <li>Compliance automation and proposal generation</li>
            <li>Government contract opportunity tracking</li>
            <li>Business development and competitive analysis</li>
            <li>Training and consulting services</li>
          </ul>
        </div>

        <div className="content-section">
          <h2>User Accounts and Registration</h2>
          <p>To access certain features, you must create an account. You agree to:</p>
          <ul>
            <li>Provide accurate and complete information</li>
            <li>Maintain the security of your account credentials</li>
            <li>Accept responsibility for all activities under your account</li>
            <li>Notify us immediately of any unauthorized use</li>
          </ul>
        </div>

        <div className="content-section">
          <h2>Acceptable Use</h2>
          <p>You agree to use our services only for lawful purposes and in accordance with these Terms. You agree not to:</p>
          <ul>
            <li>Violate any applicable laws or regulations</li>
            <li>Infringe on intellectual property rights</li>
            <li>Attempt to gain unauthorized access to our systems</li>
            <li>Interfere with the proper functioning of our services</li>
            <li>Use our services for competitive intelligence against us</li>
          </ul>
        </div>

        <div className="content-section">
          <h2>Intellectual Property</h2>
          <p>Our services and content are protected by intellectual property laws. You retain ownership of your data, but we retain rights to:</p>
          <ul>
            <li>Our platform, software, and technology</li>
            <li>Proprietary algorithms and methodologies</li>
            <li>Brand names, logos, and trademarks</li>
            <li>Aggregated and anonymized data</li>
          </ul>
        </div>

        <div className="content-section">
          <h2>Payment Terms</h2>
          <p>For paid services:</p>
          <ul>
            <li>Fees are billed in advance on a recurring basis</li>
            <li>All fees are non-refundable except as required by law</li>
            <li>We may change our pricing with 30 days notice</li>
            <li>Late payments may result in service suspension</li>
          </ul>
        </div>

        <div className="content-section">
          <h2>Privacy and Data Protection</h2>
          <p>Your privacy is important to us. Our collection and use of personal information is governed by our Privacy Policy, which is incorporated into these Terms.</p>
        </div>

        <div className="content-section">
          <h2>Limitation of Liability</h2>
          <p>To the maximum extent permitted by law, Prop Shop AI shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of our services.</p>
        </div>

        <div className="content-section">
          <h2>Termination</h2>
          <p>We may terminate or suspend your access to our services at any time, with or without cause. Upon termination, your right to use our services will cease immediately.</p>
        </div>

        <div className="content-section">
          <h2>Governing Law</h2>
          <p>These Terms are governed by the laws of the United States and the state where Make Ready Consulting is incorporated.</p>
        </div>

        <div className="content-section">
          <h2>Contact Information</h2>
          <p>For questions about these Terms, please contact us at:</p>
          <div className="contact-info">
            <p><strong>Email:</strong> legal@prop-shop.ai</p>
            <p><strong>Address:</strong> Make Ready Consulting, dba. Prop Shop AI</p>
          </div>
        </div>
      </div>
    </main>
  )
}
