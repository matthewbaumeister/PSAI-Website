export default function CompliancePage() {
  return (
    <div className="min-h-screen bg-[#0B1220] text-white">
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-[#2D5BFF] to-[#9AF23A] bg-clip-text text-transparent">
            Compliance
          </h1>
          
          <div className="prose prose-invert max-w-none">
            <p className="text-gray-300 mb-8">
              Prop Shop AI is committed to maintaining the highest standards of compliance for government contracting and procurement intelligence services.
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-white">Federal Acquisition Regulation (FAR) Compliance</h2>
              <div className="bg-white/5 p-6 rounded-lg">
                <p className="text-gray-300 mb-4">
                  Our platform and services are designed to support compliance with Federal Acquisition Regulations:
                </p>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-xl font-semibold mb-3 text-white">FAR Requirements</h3>
                    <ul className="text-gray-300 space-y-2">
                      <li>• FAR Part 15 - Contracting by Negotiation</li>
                      <li>• FAR Part 19 - Small Business Programs</li>
                      <li>• FAR Part 52 - Solicitation Provisions</li>
                      <li>• FAR Part 53 - Forms</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-3 text-white">Compliance Features</h3>
                    <ul className="text-gray-300 space-y-2">
                      <li>• Automated FAR clause tracking</li>
                      <li>• Compliance checklist generation</li>
                      <li>• Regulatory update notifications</li>
                      <li>• Audit trail documentation</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-white">Defense Federal Acquisition Regulation Supplement (DFARS)</h2>
              <div className="bg-white/5 p-6 rounded-lg">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-xl font-semibold mb-3 text-white">DFARS Requirements</h3>
                    <ul className="text-gray-300 space-y-2">
                      <li>• DFARS 252.204-7012 - Safeguarding Covered Defense Information</li>
                      <li>• DFARS 252.204-7019 - Notice of NIST SP 800-171 DoD Assessment</li>
                      <li>• DFARS 252.204-7020 - NIST SP 800-171 DoD Assessment Requirements</li>
                      <li>• DFARS 252.204-7021 - Cybersecurity Maturity Model Certification</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-3 text-white">CMMC Support</h3>
                    <ul className="text-gray-300 space-y-2">
                      <li>• CMMC Level 2 readiness assessment</li>
                      <li>• NIST SP 800-171 compliance tracking</li>
                      <li>• Security control implementation guidance</li>
                      <li>• Documentation and evidence management</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-white">Small Business Programs</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white/5 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-3 text-white">Certification Support</h3>
                  <ul className="text-gray-300 space-y-2">
                    <li>• 8(a) Business Development Program</li>
                    <li>• Women-Owned Small Business (WOSB)</li>
                    <li>• Service-Disabled Veteran-Owned Small Business (SDVOSB)</li>
                    <li>• HUBZone Program</li>
                    <li>• Economically Disadvantaged WOSB (EDWOSB)</li>
                  </ul>
                </div>
                <div className="bg-white/5 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-3 text-white">Compliance Tools</h3>
                  <ul className="text-gray-300 space-y-2">
                    <li>• Certification status tracking</li>
                    <li>• Eligibility verification</li>
                    <li>• Set-aside opportunity identification</li>
                    <li>• Annual certification renewal reminders</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-white">Data Privacy and Security Compliance</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white/5 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-3 text-white">Privacy Regulations</h3>
                  <ul className="text-gray-300 space-y-2">
                    <li>• General Data Protection Regulation (GDPR)</li>
                    <li>• California Consumer Privacy Act (CCPA)</li>
                    <li>• Virginia Consumer Data Protection Act (VCDPA)</li>
                    <li>• State-specific privacy laws</li>
                  </ul>
                </div>
                <div className="bg-white/5 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-3 text-white">Security Standards</h3>
                  <ul className="text-gray-300 space-y-2">
                    <li>• NIST Cybersecurity Framework</li>
                    <li>• ISO 27001 Information Security</li>
                    <li>• SOC 2 Type II Compliance</li>
                    <li>• FedRAMP Authorization (in progress)</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-white">Export Control and ITAR</h2>
              <div className="bg-white/5 p-6 rounded-lg">
                <p className="text-gray-300 mb-4">
                  Our platform supports compliance with export control regulations:
                </p>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-xl font-semibold mb-3 text-white">Export Control</h3>
                    <ul className="text-gray-300 space-y-2">
                      <li>• Export Administration Regulations (EAR)</li>
                      <li>• International Traffic in Arms Regulations (ITAR)</li>
                      <li>• Deemed export controls</li>
                      <li>• Technology transfer restrictions</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-3 text-white">Compliance Features</h3>
                    <ul className="text-gray-300 space-y-2">
                      <li>• Export classification assistance</li>
                      <li>• License requirement identification</li>
                      <li>• Restricted party screening</li>
                      <li>• Documentation and recordkeeping</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-white">Audit and Documentation</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white/5 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-3 text-white">Audit Support</h3>
                  <ul className="text-gray-300 space-y-2">
                    <li>• DCAA audit preparation</li>
                    <li>• DCMA compliance reviews</li>
                    <li>• Third-party certification audits</li>
                    <li>• Internal compliance assessments</li>
                  </ul>
                </div>
                <div className="bg-white/5 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-3 text-white">Documentation</h3>
                  <ul className="text-gray-300 space-y-2">
                    <li>• Automated compliance reporting</li>
                    <li>• Audit trail maintenance</li>
                    <li>• Policy and procedure management</li>
                    <li>• Training and certification tracking</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-white">Regulatory Updates and Monitoring</h2>
              <div className="bg-white/5 p-6 rounded-lg">
                <p className="text-gray-300 mb-4">
                  We continuously monitor regulatory changes and update our platform accordingly:
                </p>
                <ul className="text-gray-300 space-y-2 ml-4">
                  <li>• Real-time regulatory change notifications</li>
                  <li>• Impact analysis and assessment tools</li>
                  <li>• Compliance roadmap planning</li>
                  <li>• Expert consultation and guidance</li>
                  <li>• Training and awareness programs</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-white">Contact Our Compliance Team</h2>
              <div className="bg-white/5 p-6 rounded-lg">
                <p className="text-gray-300 mb-4">
                  For questions about our compliance programs or to request specific compliance documentation:
                </p>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-xl font-semibold mb-3 text-white">Compliance Contact</h3>
                    <p className="text-gray-300">
                      <strong>Email:</strong> compliance@prop-shop.ai<br />
                      <strong>Response Time:</strong> Within 24 hours<br />
                      <strong>Hours:</strong> Monday-Friday, 9:00 AM - 5:00 PM EST
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-3 text-white">General Contact</h3>
                    <p className="text-gray-300">
                      <strong>Email:</strong> info@prop-shop.ai<br />
                      <strong>Hours:</strong> Monday-Friday, 9:00 AM - 5:00 PM EST
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
