"use client"

import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

export function Header() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 })
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggleDropdown = () => {
    console.log('Toggle dropdown clicked, current state:', isDropdownOpen)
    if (!isDropdownOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setDropdownPosition({
        top: rect.bottom + 8,
        left: rect.left
      })
    }
    setIsDropdownOpen(!isDropdownOpen)
  }

  const closeDropdown = () => {
    console.log('Closing dropdown')
    setIsDropdownOpen(false)
  }

  // Log dropdown state changes
  useEffect(() => {
    console.log('Dropdown state changed to:', isDropdownOpen)
  }, [isDropdownOpen])

  // Render dropdown using portal to bypass stacking context issues
  const renderDropdown = () => {
    if (!isDropdownOpen) return null

    const dropdownContent = (
      <div 
        className="dropdown-content-portal"
        style={{
          position: 'fixed',
          top: `${dropdownPosition.top}px`,
          left: `${dropdownPosition.left}px`,
          zIndex: 999999,
          minWidth: '220px',
          border: '2px solid red',
          background: 'rgba(255, 0, 0, 0.9)',
          borderRadius: '0.75rem',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
          padding: '0.5rem 0',
          animation: 'dropdownSlideIn 0.2s ease-out'
        }}
        ref={dropdownRef}
      >
        <Link href="/small-business" className="dropdown-link" onClick={closeDropdown}>
          Small Business
        </Link>
        <Link href="/search" className="dropdown-link" onClick={closeDropdown}>
          PS.AI Search
        </Link>
        <Link href="/compliance" className="dropdown-link" onClick={closeDropdown}>
          PS.AI Compliance
        </Link>
        <Link href="/market-research" className="dropdown-link" onClick={closeDropdown}>
          PS.AI Market Research
        </Link>
        <Link href="/write" className="dropdown-link" onClick={closeDropdown}>
          PS.AI Write
        </Link>
        <Link href="/crm" className="dropdown-link" onClick={closeDropdown}>
          PS.AI CRM
        </Link>
      </div>
    )

    // Use portal to render outside normal DOM flow
    return createPortal(dropdownContent, document.body)
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
          <div className="dropdown-container">
            <button 
              ref={buttonRef}
              className="dropdown-trigger"
              onClick={toggleDropdown}
              aria-expanded={isDropdownOpen}
            >
              Solutions
              <span className={`dropdown-arrow ${isDropdownOpen ? 'open' : ''}`}>
                ▼
              </span>
            </button>
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
      
      {/* Render dropdown using portal */}
      {renderDropdown()}
    </header>
  )
}
