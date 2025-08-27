"use client"

import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'

export function Header() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close dropdown when pressing Escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen)
  }

  const closeDropdown = () => {
    setIsDropdownOpen(false)
  }

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
          <div className="dropdown-container" ref={dropdownRef}>
            <button 
              className="dropdown-trigger"
              onClick={toggleDropdown}
              aria-expanded={isDropdownOpen}
              aria-haspopup="true"
            >
              Solutions
              <span className={`dropdown-arrow ${isDropdownOpen ? 'open' : ''}`}>
                ▼
              </span>
            </button>
            
            {isDropdownOpen && (
              <div className="dropdown-menu-new">
                <div className="dropdown-content">
                  <Link href="/small-business" className="dropdown-item" onClick={closeDropdown}>
                    Small Business
                  </Link>
                  <Link href="/search" className="dropdown-item" onClick={closeDropdown}>
                    PS.AI Search
                  </Link>
                  <Link href="/compliance" className="dropdown-item" onClick={closeDropdown}>
                    PS.AI Compliance
                  </Link>
                  <Link href="/market-research" className="dropdown-item" onClick={closeDropdown}>
                    PS.AI Market Research
                  </Link>
                  <Link href="/write" className="dropdown-item" onClick={closeDropdown}>
                    PS.AI Write
                  </Link>
                  <Link href="/crm" className="dropdown-item" onClick={closeDropdown}>
                    PS.AI CRM
                  </Link>
                </div>
              </div>
            )}
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
