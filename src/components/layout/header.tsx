"use client"

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'

export function Header() {
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showSolutionsDropdown, setShowSolutionsDropdown] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const solutionsDropdownRef = useRef<HTMLDivElement>(null)

  // Debug dropdown state
  useEffect(() => {
    console.log('Solutions dropdown state:', showSolutionsDropdown)
    console.log('Current page pathname:', window.location.pathname)
    console.log('Header component mounted')
  }, [showSolutionsDropdown])

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

  // Close solutions dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (solutionsDropdownRef.current && !solutionsDropdownRef.current.contains(event.target as Node)) {
        setShowSolutionsDropdown(false)
      }
    }

    if (showSolutionsDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showSolutionsDropdown])

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
          <div className="dropdown" ref={solutionsDropdownRef}>
            <button 
              className="nav-link dropdown-toggle"
              onClick={() => {
                console.log('Dropdown toggle clicked, current state:', showSolutionsDropdown)
                setShowSolutionsDropdown(!showSolutionsDropdown)
              }}
              onMouseEnter={() => {
                console.log('Dropdown mouse enter')
                setShowSolutionsDropdown(true)
              }}
            >
              Solutions
            </button>
            <ul className={`dropdown-menu ${showSolutionsDropdown ? 'show' : ''}`}>
              <li><Link href="/small-business" className="dropdown-link" onClick={() => setShowSolutionsDropdown(false)}>Small Business</Link></li>
              <li><Link href="/search" className="dropdown-link" onClick={() => setShowSolutionsDropdown(false)}>PS.AI Search</Link></li>
              <li><Link href="/compliance" className="dropdown-link" onClick={() => setShowSolutionsDropdown(false)}>PS.AI Compliance</Link></li>
              <li><Link href="/market-research" className="dropdown-link" onClick={() => setShowSolutionsDropdown(false)}>PS.AI Market Research</Link></li>
              <li><Link href="/write" className="dropdown-link" onClick={() => setShowSolutionsDropdown(false)}>PS.AI Write</Link></li>
              <li><Link href="/crm" className="dropdown-link" onClick={() => setShowSolutionsDropdown(false)}>PS.AI CRM</Link></li>
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
