import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Security - Prop Shop AI',
  description: 'Learn about Prop Shop AI\'s security measures and data protection practices.',
}

export default function SecurityPage() {
  return (
    <main className="legal-page">
      <div className="container">
        <div className="page-header">
          <h1>Security</h1>
          <p className="subtitle">Protecting your data and maintaining trust</p>
        </div>

        <div className="content-section">
          <h2>Our Security Commitment</h2>
          <p>
            At Prop Shop AI, we understand that security is paramount when dealing with procurement intelligence and sensitive business data. We implement industry-leading security measures to protect your information and maintain the highest standards of data protection.
          </p>
        </div>

        <div className="content-section">
          <h2>Data Protection Standards</h2>
          
          <h3>Encryption</h3>
          <p>We use enterprise-grade encryption to protect your data:</p>
          <ul>
            <li>AES-256 encryption for data at rest</li>
            <li>TLS 1.3 encryption for data in transit</li>
            <li>End-to-end encryption for sensitive communications</li>
            <li>Secure key management and rotation</li>
          </ul>

          <h3>Access Controls</h3>
          <p>Strict access controls ensure only authorized personnel can access your data:</p>
          <ul>
            <li>Multi-factor authentication (MFA) for all accounts</li>
            <li>Role-based access control (RBAC)</li>
            <li>Principle of least privilege</li>
            <li>Regular access reviews and audits</li>
          </ul>
        </div>

        <div className="content-section">
          <h2>Infrastructure Security</h2>
          
          <h3>Cloud Security</h3>
          <p>Our infrastructure is built on secure, enterprise-grade cloud platforms:</p>
          <ul>
            <li>ISO 27001 certified data centers</li>
            <li>SOC 2 Type II compliance</li>
            <li>Regular security assessments and penetration testing</li>
            <li>24/7 security monitoring and incident response</li>
          </ul>

          <h3>Network Security</h3>
          <p>Advanced network security measures protect against threats:</p>
          <ul>
            <li>DDoS protection and mitigation</li>
            <li>Web application firewall (WAF)</li>
            <li>Intrusion detection and prevention systems</li>
            <li>Regular vulnerability scanning and patching</li>
          </ul>
        </div>

        <div className="content-section">
          <h2>Compliance and Certifications</h2>
          <p>We maintain compliance with industry standards and regulations:</p>
          <ul>
            <li>GDPR compliance for European users</li>
            <li>CCPA compliance for California residents</li>
            <li>FedRAMP authorization for government customers</li>
            <li>Regular third-party security audits</li>
          </ul>
        </div>

        <div className="content-section">
          <h2>Incident Response</h2>
          <p>Our security team is prepared to respond to any security incidents:</p>
          <ul>
            <li>24/7 security operations center</li>
            <li>Incident response playbooks and procedures</li>
            <li>Regular security training for all employees</li>
            <li>Customer notification procedures</li>
          </ul>
        </div>

        <div className="content-section">
          <h2>Data Privacy and Retention</h2>
          <p>We follow strict data privacy and retention policies:</p>
          <ul>
            <li>Data minimization principles</li>
            <li>Automated data retention and deletion</li>
            <li>Regular data privacy impact assessments</li>
            <li>Transparent data handling practices</li>
          </ul>
        </div>

        <div className="content-section">
          <h2>Security Best Practices</h2>
          <p>We recommend the following security practices for our users:</p>
          <ul>
            <li>Use strong, unique passwords</li>
            <li>Enable multi-factor authentication</li>
            <li>Regular security updates for devices</li>
            <li>Be cautious of phishing attempts</li>
            <li>Report suspicious activity immediately</li>
          </ul>
        </div>

        <div className="content-section">
          <h2>Security Contact</h2>
          <p>For security-related questions or to report security concerns:</p>
          <div className="contact-info">
            <p><strong>Security Email:</strong> security@prop-shop.ai</p>
            <p><strong>Security Hotline:</strong> Available to enterprise customers</p>
            <p><strong>Address:</strong> Make Ready Consulting, dba. Prop Shop AI</p>
          </div>
        </div>
      </div>
    </main>
  )
}
