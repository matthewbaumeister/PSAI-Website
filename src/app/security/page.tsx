export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-[#0B1220] text-white">
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-[#2D5BFF] to-[#9AF23A] bg-clip-text text-transparent">
            Security
          </h1>
          
          <div className="prose prose-invert max-w-none">
            <p className="text-gray-300 mb-8">
              At Prop Shop AI, we prioritize the security of your data and our platform. This page outlines our security practices and compliance measures.
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-white">Data Protection</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white/5 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-3 text-white">Encryption</h3>
                  <ul className="text-gray-300 space-y-2">
                    <li>• AES-256 encryption for data at rest</li>
                    <li>• TLS 1.3 for data in transit</li>
                    <li>• End-to-end encryption for sensitive communications</li>
                    <li>• Encrypted backups and archives</li>
                  </ul>
                </div>
                <div className="bg-white/5 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-3 text-white">Access Controls</h3>
                  <ul className="text-gray-300 space-y-2">
                    <li>• Multi-factor authentication (MFA)</li>
                    <li>• Role-based access controls (RBAC)</li>
                    <li>• Session management and timeout</li>
                    <li>• Privileged access monitoring</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-white">Infrastructure Security</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white/5 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-3 text-white">Cloud Security</h3>
                  <ul className="text-gray-300 space-y-2">
                    <li>• AWS/Azure enterprise-grade infrastructure</li>
                    <li>• Regular security assessments and penetration testing</li>
                    <li>• Automated vulnerability scanning</li>
                    <li>• 24/7 security monitoring and alerting</li>
                  </ul>
                </div>
                <div className="bg-white/5 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-3 text-white">Network Security</h3>
                  <ul className="text-gray-300 space-y-2">
                    <li>• DDoS protection and mitigation</li>
                    <li>• Web application firewall (WAF)</li>
                    <li>• Intrusion detection and prevention</li>
                    <li>• Secure API endpoints and rate limiting</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-white">Government Contracting Compliance</h2>
              <div className="bg-white/5 p-6 rounded-lg">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-xl font-semibold mb-3 text-white">FAR/DFARS Compliance</h3>
                    <ul className="text-gray-300 space-y-2">
                      <li>• Federal Acquisition Regulation (FAR) compliance</li>
                      <li>• Defense Federal Acquisition Regulation Supplement (DFARS)</li>
                      <li>• Controlled Unclassified Information (CUI) protection</li>
                      <li>• Export control compliance</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-3 text-white">Cybersecurity Standards</h3>
                    <ul className="text-gray-300 space-y-2">
                      <li>• NIST Cybersecurity Framework alignment</li>
                      <li>• CMMC Level 2 readiness</li>
                      <li>• FedRAMP authorization path</li>
                      <li>• SOC 2 Type II compliance</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-white">Security Practices</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white/5 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-3 text-white">Development Security</h3>
                  <ul className="text-gray-300 space-y-2">
                    <li>• Secure software development lifecycle (SDLC)</li>
                    <li>• Code security reviews and static analysis</li>
                    <li>• Dependency vulnerability scanning</li>
                    <li>• Secure deployment practices</li>
                  </ul>
                </div>
                <div className="bg-white/5 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-3 text-white">Incident Response</h3>
                  <ul className="text-gray-300 space-y-2">
                    <li>• 24/7 security operations center</li>
                    <li>• Incident response procedures</li>
                    <li>• Regular security training for staff</li>
                    <li>• Customer notification protocols</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-white">Data Privacy and Retention</h2>
              <div className="bg-white/5 p-6 rounded-lg">
                <p className="text-gray-300 mb-4">
                  We implement strict data privacy controls and retention policies:
                </p>
                <ul className="text-gray-300 space-y-2 ml-4">
                  <li>• Data minimization and purpose limitation</li>
                  <li>• Automated data retention and deletion</li>
                  <li>• Right to deletion and data portability</li>
                  <li>• Regular privacy impact assessments</li>
                  <li>• GDPR and CCPA compliance</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-white">Third-Party Security</h2>
              <div className="bg-white/5 p-6 rounded-lg">
                <p className="text-gray-300 mb-4">
                  We carefully vet and monitor all third-party vendors and service providers:
                </p>
                <ul className="text-gray-300 space-y-2 ml-4">
                  <li>• Vendor security assessments and audits</li>
                  <li>• Data processing agreements (DPAs)</li>
                  <li>• Regular vendor security reviews</li>
                  <li>• Subprocessor transparency</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-white">Security Certifications</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white/5 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-3 text-white">Current Certifications</h3>
                  <ul className="text-gray-300 space-y-2">
                    <li>• ISO 27001 Information Security Management</li>
                    <li>• SOC 2 Type II (in progress)</li>
                    <li>• PCI DSS Level 1 (if applicable)</li>
                  </ul>
                </div>
                <div className="bg-white/5 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-3 text-white">Compliance Roadmap</h3>
                  <ul className="text-gray-300 space-y-2">
                    <li>• FedRAMP authorization</li>
                    <li>• CMMC Level 2 certification</li>
                    <li>• StateRAMP authorization</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-white">Reporting Security Issues</h2>
              <div className="bg-white/5 p-6 rounded-lg">
                <p className="text-gray-300 mb-4">
                  We encourage responsible disclosure of security vulnerabilities. If you discover a security issue, please contact us immediately:
                </p>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-xl font-semibold mb-3 text-white">Security Contact</h3>
                    <p className="text-gray-300">
                      <strong>Email:</strong> security@prop-shop.ai<br />
                      <strong>Response Time:</strong> Within 24 hours<br />
                      <strong>Encryption:</strong> PGP key available upon request
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
