"use client"

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '@/contexts/AuthContext'

export function Header() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const [isSolutionsDropdownOpen, setIsSolutionsDropdownOpen] = useState(false)
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false)
  const [isAdminDropdownOpen, setIsAdminDropdownOpen] = useState(false)
  const [solutionsDropdownPosition, setSolutionsDropdownPosition] = useState({ top: 0, left: 0 })
  const [userDropdownPosition, setUserDropdownPosition] = useState({ top: 0, left: 0 })
  const [adminDropdownPosition, setAdminDropdownPosition] = useState({ top: 0, left: 0 })
  const solutionsDropdownRef = useRef<HTMLDivElement>(null)
  const userDropdownRef = useRef<HTMLDivElement>(null)
  const adminDropdownRef = useRef<HTMLDivElement>(null)
  const solutionsButtonRef = useRef<HTMLButtonElement>(null)
  const userButtonRef = useRef<HTMLButtonElement>(null)
  const adminButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (solutionsDropdownRef.current && !solutionsDropdownRef.current.contains(event.target as Node)) {
        setIsSolutionsDropdownOpen(false)
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false)
      }
      if (adminDropdownRef.current && !adminDropdownRef.current.contains(event.target as Node)) {
        setIsAdminDropdownOpen(false)
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
    setIsAdminDropdownOpen(false) // Close admin dropdown when opening solutions
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
    setIsAdminDropdownOpen(false) // Close admin dropdown when opening user
  }

  const toggleAdminDropdown = () => {
    if (!isAdminDropdownOpen && adminButtonRef.current) {
      const rect = adminButtonRef.current.getBoundingClientRect()
      setAdminDropdownPosition({
        top: rect.bottom + 8,
        left: rect.left
      })
    }
    setIsAdminDropdownOpen(!isAdminDropdownOpen)
    setIsSolutionsDropdownOpen(false) // Close solutions dropdown when opening admin
    setIsUserDropdownOpen(false) // Close user dropdown when opening admin
  }

  const closeDropdowns = () => {
    setIsSolutionsDropdownOpen(false)
    setIsUserDropdownOpen(false)
    setIsAdminDropdownOpen(false)
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
        <div className="dropdown-divider"></div>
        <button onClick={handleLogout} className="dropdown-link logout-button">
          Sign Out
        </button>
      </div>
    )

    return createPortal(dropdownContent, document.body)
  }

  const renderAdminDropdown = () => {
    if (!isAdminDropdownOpen || !user?.isAdmin) return null

    const dropdownContent = (
      <div 
        className="dropdown-content-portal"
        style={{
          position: 'fixed',
          top: `${adminDropdownPosition.top}px`,
          left: `${adminDropdownPosition.left}px`,
          zIndex: 999999,
          minWidth: '200px',
          background: 'rgba(11, 18, 32, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '0.75rem',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
          padding: '0.5rem 0',
          animation: 'dropdownSlideIn 0.2s ease-out'
        }}
        ref={adminDropdownRef}
      >
        <div className="dropdown-header">
          <div className="user-info">
            <div className="user-name">Admin Panel</div>
            <div className="user-email">System Administration</div>
          </div>
        </div>
        <div className="dropdown-divider"></div>
        <Link href="/admin" className="dropdown-link" onClick={closeDropdowns}>
          Dashboard
        </Link>
        <Link href="/admin/users" className="dropdown-link" onClick={closeDropdowns}>
          User Management
        </Link>
        <Link href="/admin/invitations" className="dropdown-link" onClick={closeDropdowns}>
          Admin Invitations
        </Link>
        <Link href="/admin/settings" className="dropdown-link" onClick={closeDropdowns}>
          System Settings
        </Link>
        <div className="dropdown-divider"></div>
        <Link href="/admin/logs" className="dropdown-link" onClick={closeDropdowns}>
          System Logs
        </Link>
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
          <div className="action-buttons">
            <Link href="/book-demo" className="btn btn-primary">Book Demo</Link>
            {!user && (
              <Link href="/auth/login" className="btn btn-secondary">Sign In</Link>
            )}
          </div>
          
          {user && (
            <>
              {/* PS.AI Platform Access Button */}
              <button
                onClick={() => router.push('/platform')}
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '10px 20px',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
                  marginRight: '16px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.3)';
                }}
              >
                🚀 PS.AI Platform Access
              </button>
              
              <div className="header-divider"></div>
              <div className="user-dropdown-container">
                <button ref={userButtonRef} className="user-dropdown-trigger" onClick={toggleUserDropdown} aria-expanded={isUserDropdownOpen}>
                  <div className="user-avatar">{user.firstName?.charAt(0) || user.email.charAt(0).toUpperCase()}</div>
                  <span className="user-name-text">{user.firstName || 'User'}</span>
                  <span className="dropdown-arrow">▼</span>
                </button>
              </div>
              
              {user.isAdmin && (
                <>
                  <div className="header-divider"></div>
                  <div className="admin-dropdown-container">
                    <button ref={adminButtonRef} className="admin-dropdown-trigger" onClick={toggleAdminDropdown} aria-expanded={isAdminDropdownOpen}>
                      <span className="admin-text">Admin</span>
                      <span className="dropdown-arrow">▼</span>
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
      
      {renderSolutionsDropdown()}
      {renderUserDropdown()}
      {renderAdminDropdown()}
    </header>
  )
}
