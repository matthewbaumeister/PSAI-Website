"use client"

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'

export function Header() {
  const [showUserMenu, setShowUserMenu] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showUserMenu])

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
          <div className="dropdown">
            <Link href="/solutions" className="nav-link">Solutions</Link>
            <ul className="dropdown-menu">
              <li><Link href="/small-business" className="dropdown-link">Small Business</Link></li>
              <li><Link href="/search" className="dropdown-link">PS.AI Search</Link></li>
              <li><Link href="/compliance" className="dropdown-link">PS.AI Compliance</Link></li>
              <li><Link href="/market-research" className="dropdown-link">PS.AI Market Research</Link></li>
              <li><Link href="/write" className="dropdown-link">PS.AI Write</Link></li>
              <li><Link href="/crm" className="dropdown-link">PS.AI CRM</Link></li>
            </ul>
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
