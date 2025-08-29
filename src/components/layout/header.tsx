"use client"

import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '@/contexts/AuthContext'

export function Header() {
  const { user, logout } = useAuth()
  const [isSolutionsDropdownOpen, setIsSolutionsDropdownOpen] = useState(false)
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false)
  const [solutionsDropdownPosition, setSolutionsDropdownPosition] = useState({ top: 0, left: 0 })
  const [userDropdownPosition, setUserDropdownPosition] = useState({ top: 0, left: 0 })
  const solutionsDropdownRef = useRef<HTMLDivElement>(null)
  const userDropdownRef = useRef<HTMLDivElement>(null)
  const solutionsButtonRef = useRef<HTMLButtonElement>(null)
  const userButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (solutionsDropdownRef.current && !solutionsDropdownRef.current.contains(event.target as Node)) {
        setIsSolutionsDropdownOpen(false)
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggleSolutionsDropdown = () => {
    if (!isSolutionsDropdownOpen && solutionsButtonRef.current) {
      const rect = solutionsButtonRef.current.getBoundingClientRect()
      setSolutionsDropdownPosition({
        top: rect.bottom + 8,
        left: rect.left
      })
    }
    setIsSolutionsDropdownOpen(!isSolutionsDropdownOpen)
    setIsUserDropdownOpen(false) // Close user dropdown when opening solutions
  }

  const toggleUserDropdown = () => {
    if (!isUserDropdownOpen && userButtonRef.current) {
      const rect = userButtonRef.current.getBoundingClientRect()
      setUserDropdownPosition({
        top: rect.bottom + 8,
        left: rect.left
      })
    }
    setIsUserDropdownOpen(!isUserDropdownOpen)
    setIsSolutionsDropdownOpen(false) // Close solutions dropdown when opening user
  }

  const closeDropdowns = () => {
    setIsSolutionsDropdownOpen(false)
    setIsUserDropdownOpen(false)
  }

  const handleLogout = async () => {
    await logout()
    closeDropdowns()
  }

  const renderSolutionsDropdown = () => {
    if (!isSolutionsDropdownOpen) return null

    const dropdownContent = (
      <div 
        className="dropdown-content-portal"
        style={{
          position: 'fixed',
          top: `${solutionsDropdownPosition.top}px`,
          left: `${solutionsDropdownPosition.left}px`,
          zIndex: 999999,
          minWidth: '220px',
          background: 'rgba(11, 18, 32, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '0.75rem',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
          padding: '0.5rem 0',
          animation: 'dropdownSlideIn 0.2s ease-out'
        }}
        ref={solutionsDropdownRef}
      >
        <Link href="/small-business" className="dropdown-link" onClick={closeDropdowns}>
          Small Business
        </Link>
        <Link href="/search" className="dropdown-link" onClick={closeDropdowns}>
          PS.AI Search
        </Link>
        <Link href="/compliance" className="dropdown-link" onClick={closeDropdowns}>
          PS.AI Compliance
        </Link>
        <Link href="/market-research" className="dropdown-link" onClick={closeDropdowns}>
          PS.AI Market Research
        </Link>
        <Link href="/write" className="dropdown-link" onClick={closeDropdowns}>
          PS.AI Write
        </Link>
        <Link href="/crm" className="dropdown-link" onClick={closeDropdowns}>
          PS.AI CRM
        </Link>
      </div>
    )

    return createPortal(dropdownContent, document.body)
  }

  const renderUserDropdown = () => {
    if (!isUserDropdownOpen || !user) return null

    const dropdownContent = (
      <div 
        className="dropdown-content-portal"
        style={{
          position: 'fixed',
          top: `${userDropdownPosition.top}px`,
          left: `${userDropdownPosition.left}px`,
          zIndex: 999999,
          minWidth: '200px',
          background: 'rgba(11, 18, 32, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '0.75rem',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
          padding: '0.5rem 0',
          animation: 'dropdownSlideIn 0.2s ease-out'
        }}
        ref={userDropdownRef}
      >
        <div className="dropdown-header">
          <div className="user-info">
            <div className="user-name">
              {user.firstName} {user.lastName}
            </div>
            <div className="user-email">{user.email}</div>
          </div>
        </div>
        <div className="dropdown-divider"></div>
        <Link href="/dashboard" className="dropdown-link" onClick={closeDropdowns}>
          Dashboard
        </Link>
        <Link href="/profile" className="dropdown-link" onClick={closeDropdowns}>
          Profile
        </Link>
        <Link href="/settings" className="dropdown-link" onClick={closeDropdowns}>
          Settings
        </Link>
        {user.isAdmin && (
          <Link href="/admin" className="dropdown-link" onClick={closeDropdowns}>
            Admin Panel
          </Link>
        )}
        <div className="dropdown-divider"></div>
        <button onClick={handleLogout} className="dropdown-link logout-button">
          Sign Out
        </button>
      </div>
    )

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
              ref={solutionsButtonRef}
              className="dropdown-trigger"
              onClick={toggleSolutionsDropdown}
              aria-expanded={isSolutionsDropdownOpen}
            >
              Solutions
              <span className={`dropdown-arrow ${isSolutionsDropdownOpen ? 'open' : ''}`}>
                ▼
              </span>
            </button>
          </div>
          
          <Link href="/publications" className="nav-link">Publications</Link>
          <Link href="/resources" className="nav-link">Resources</Link>
          <Link href="/about" className="nav-link">About</Link>
        </nav>

        <div className="header-actions">
          <div className="header-divider"></div>
          
          {user ? (
            // User is logged in - show user dropdown
            <div className="user-dropdown-container">
              <button 
                ref={userButtonRef}
                className="user-dropdown-trigger"
                onClick={toggleUserDropdown}
                aria-expanded={isUserDropdownOpen}
              >
                <div className="user-avatar">
                  {user.firstName?.charAt(0) || user.email.charAt(0).toUpperCase()}
                </div>
                <span className="user-name-text">
                  {user.firstName || 'User'}
                </span>
                <span className="dropdown-arrow">▼</span>
              </button>
            </div>
          ) : (
            // User is not logged in - show auth buttons
            <div className="auth-buttons">
              <Link href="/auth/login" className="btn btn-secondary">
                Sign In
              </Link>
              <Link href="/auth/signup" className="btn btn-primary">
                Sign Up
              </Link>
            </div>
          )}
          
          <div className="header-divider"></div>
          
          <div className="action-buttons">
            <Link href="/contact" className="btn btn-secondary">
              Contact Us
            </Link>
            <Link href="/book-demo" className="btn btn-primary">
              Book Demo
            </Link>
          </div>
        </div>
      </div>
      
      {renderSolutionsDropdown()}
      {renderUserDropdown()}
    </header>
  )
}
