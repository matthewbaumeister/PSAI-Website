"use client"

import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'

export function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const toggleDropdown = () => {
    setIsOpen(!isOpen)
  }

  const closeDropdown = () => {
    setIsOpen(false)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

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
          <div className="dropdown-wrapper" ref={dropdownRef}>
            <button 
              className="dropdown-button"
              onClick={toggleDropdown}
              onMouseEnter={() => setIsOpen(true)}
            >
              Solutions
              <span className={`dropdown-icon ${isOpen ? 'open' : ''}`}>
                ▼
              </span>
            </button>
            
            {isOpen && (
              <div 
                className="dropdown-menu"
                onMouseEnter={() => setIsOpen(true)}
                onMouseLeave={() => setTimeout(() => setIsOpen(false), 100)}
              >
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
