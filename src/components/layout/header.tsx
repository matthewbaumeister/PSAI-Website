"use client"

import Link from 'next/link'

export function Header() {
  return (
    <header className="header">
      <div className="container">
        <Link href="/" className="brand no-underline">
          <div className="logo-icon">
            <div className="logo-placeholder">
              PS
            </div>
          </div>
          <span className="logo-text text-white no-underline">
            Prop Shop AI
          </span>
        </Link>

        <nav className="nav">
          <div className="simple-dropdown">
            <button className="dropdown-btn">
              Solutions
              <span className="arrow">▼</span>
            </button>
            <div className="dropdown-panel">
              <Link href="/small-business" className="dropdown-link">Small Business</Link>
              <Link href="/search" className="dropdown-link">PS.AI Search</Link>
              <Link href="/compliance" className="dropdown-link">PS.AI Compliance</Link>
              <Link href="/market-research" className="dropdown-link">PS.AI Market Research</Link>
              <Link href="/write" className="dropdown-link">PS.AI Write</Link>
              <Link href="/crm" className="dropdown-link">PS.AI CRM</Link>
            </div>
          </div>
          
          <Link href="/publications" className="nav-link">Publications</Link>
          <Link href="/resources" className="nav-link">Resources</Link>
          <Link href="/about" className="nav-link">About</Link>
        </nav>

        <div className="header-actions">
          <Link href="/contact" className="btn btn-secondary">
            Contact Us
          </Link>
          <Link href="/book-demo" className="btn btn-primary">
            Book Demo
          </Link>
        </div>
      </div>
    </header>
  )
}
