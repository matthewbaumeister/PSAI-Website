export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#0B1220] text-white">
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-[#2D5BFF] to-[#9AF23A] bg-clip-text text-transparent">
            Privacy Policy
          </h1>
          
          <div className="prose prose-invert max-w-none">
            <p className="text-gray-300 mb-8">
              <strong>Last updated:</strong> August 11, 2025
            </p>
            <p className="text-gray-300 mb-8">
              <strong>Company:</strong> Make Ready Technical LLC, DBA Prop Shop AI
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-white">1. Introduction</h2>
              <p className="text-gray-300 mb-4">
                Prop Shop AI (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our procurement intelligence and compliance platform.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-white">2. Information We Collect</h2>
              
              <h3 className="text-xl font-semibold mb-3 text-white">2.1 Personal Information</h3>
              <p className="text-gray-300 mb-4">
                We may collect personal information that you provide directly to us, including:
              </p>
              <ul className="list-disc list-inside text-gray-300 mb-4 ml-4">
                <li>Name and contact information (email, phone number)</li>
                <li>Company information and job title</li>
                <li>Government contracting credentials and certifications</li>
                <li>Payment and billing information</li>
                <li>Communication preferences</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 text-white">2.2 Usage Information</h3>
              <p className="text-gray-300 mb-4">
                We automatically collect certain information about your use of our platform:
              </p>
              <ul className="list-disc list-inside text-gray-300 mb-4 ml-4">
                <li>Log data (IP address, browser type, access times)</li>
                <li>Usage patterns and feature interactions</li>
                <li>Device information and technical specifications</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-white">3. How We Use Your Information</h2>
              <p className="text-gray-300 mb-4">
                We use the information we collect to:
              </p>
              <ul className="list-disc list-inside text-gray-300 mb-4 ml-4">
                <li>Provide and maintain our procurement intelligence platform</li>
                <li>Process transactions and manage billing</li>
                <li>Send you important updates and notifications</li>
                <li>Improve our services and develop new features</li>
                <li>Comply with legal obligations and government regulations</li>
                <li>Protect against fraud and ensure platform security</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-white">4. Information Sharing and Disclosure</h2>
              <p className="text-gray-300 mb-4">
                We do not sell, trade, or rent your personal information to third parties. We may share your information in the following circumstances:
              </p>
              <ul className="list-disc list-inside text-gray-300 mb-4 ml-4">
                <li><strong>Service Providers:</strong> With trusted third-party vendors who assist in platform operations</li>
                <li><strong>Legal Requirements:</strong> When required by law or government regulations</li>
                <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
                <li><strong>Consent:</strong> With your explicit consent for specific purposes</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-white">5. Data Security</h2>
              <p className="text-gray-300 mb-4">
                We implement appropriate technical and organizational measures to protect your information:
              </p>
              <ul className="list-disc list-inside text-gray-300 mb-4 ml-4">
                <li>Encryption of data in transit and at rest</li>
                <li>Regular security assessments and updates</li>
                <li>Access controls and authentication measures</li>
                <li>Compliance with industry security standards</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-white">6. Your Rights and Choices</h2>
              <p className="text-gray-300 mb-4">
                You have the right to:
              </p>
              <ul className="list-disc list-inside text-gray-300 mb-4 ml-4">
                <li>Access and review your personal information</li>
                <li>Request correction of inaccurate data</li>
                <li>Request deletion of your information (subject to legal requirements)</li>
                <li>Opt-out of marketing communications</li>
                <li>Control cookie preferences through your browser settings</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-white">7. Government Contracting Compliance</h2>
              <p className="text-gray-300 mb-4">
                As a platform serving government contractors, we maintain compliance with:
              </p>
              <ul className="list-disc list-inside text-gray-300 mb-4 ml-4">
                <li>Federal Acquisition Regulation (FAR) requirements</li>
                <li>Defense Federal Acquisition Regulation Supplement (DFARS)</li>
                <li>Cybersecurity Maturity Model Certification (CMMC) standards</li>
                <li>Other applicable government security requirements</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-white">8. Contact Us</h2>
              <p className="text-gray-300 mb-4">
                If you have questions about this Privacy Policy or our data practices, please contact us at:
              </p>
              <div className="bg-white/5 p-4 rounded-lg">
                <p className="text-gray-300">
                  <strong>Email:</strong> info@prop-shop.ai<br />
                  <strong>Response Time:</strong> Within 24 hours<br />
                  <strong>Hours:</strong> Monday-Friday, 9:00 AM - 5:00 PM EST
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
