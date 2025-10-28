import Link from 'next/link'

export function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <div className="footer-brand">
              <div className="logo-placeholder">PS</div>
              <span className="brand-name">Prop Shop AI</span>
            </div>
            <p className="footer-description">
              The procurement intelligence platform that levels the playing field for challengers and incumbents alike.
            </p>
          </div>

          <div className="footer-section">
            <h3>Solutions</h3>
            <ul>
              <li><Link href="/small-business">Small Business</Link></li>
              <li><Link href="/matrix">MATRIX</Link></li>
              <li><Link href="/compliance">PS.AI Compliance</Link></li>
              <li><Link href="/write">PS.AI Write</Link></li>
            </ul>
          </div>

          <div className="footer-section">
            <h3>Company</h3>
            <ul>
              <li><Link href="/about">About</Link></li>
              <li><Link href="/careers">Careers</Link></li>
              <li><Link href="/contact">Contact</Link></li>
              <li><Link href="/blog">Blog</Link></li>
            </ul>
          </div>

          <div className="footer-section">
            <h3>Resources</h3>
            <ul>
              <li><Link href="/publications">Publications</Link></li>
              <li><Link href="/guides">Guides</Link></li>
              <li><Link href="/documentation">Documentation</Link></li>
              <li><Link href="/faq">FAQ</Link></li>
            </ul>
          </div>

          <div className="footer-section">
            <h3>Legal</h3>
            <ul>
              <li><Link href="/privacy">Privacy Policy</Link></li>
              <li><Link href="/terms">Terms of Service</Link></li>
              <li><Link href="/security">Security</Link></li>
            </ul>
          </div>
        </div>

        <div className="footer-divider"></div>

        <div className="footer-bottom">
          <div className="footer-copyright">
            © 2025 Make Ready Consulting, dba. Prop Shop AI. All rights reserved.
          </div>
          <div className="footer-social">
            <a href="#" className="social-link">LinkedIn</a>
            <a href="#" className="social-link">Twitter</a>
            <a href="#" className="social-link">GitHub</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
