'use client'

import { useEffect, useState, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

const INACTIVITY_TIMEOUT = 30 * 60 * 1000 // 30 minutes in milliseconds
const WARNING_TIMEOUT = 5 * 60 * 1000 // 5 minutes warning before logout

export function InactivityTimer() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [showWarning, setShowWarning] = useState(false)
  const [timeLeft, setTimeLeft] = useState(WARNING_TIMEOUT / 1000)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const warningRef = useRef<NodeJS.Timeout | null>(null)
  const countdownRef = useRef<NodeJS.Timeout | null>(null)

  const resetTimer = () => {
    // Clear existing timers
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (warningRef.current) clearTimeout(warningRef.current)
    if (countdownRef.current) clearInterval(countdownRef.current)

    // Hide warning if it was showing
    setShowWarning(false)
    setTimeLeft(WARNING_TIMEOUT / 1000)

    // Set new inactivity timer
    timeoutRef.current = setTimeout(() => {
      setShowWarning(true)
      
      // Start countdown
      countdownRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Time's up - logout
            handleLogout()
            return 0
          }
          return prev - 1
        })
      }, 1000)

      // Set final logout timer
      warningRef.current = setTimeout(() => {
        handleLogout()
      }, WARNING_TIMEOUT)
    }, INACTIVITY_TIMEOUT - WARNING_TIMEOUT)
  }

  const handleLogout = async () => {
    try {
      // Send logout notification email
      await fetch('/api/auth/inactivity-logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user?.email,
          reason: 'inactivity'
        })
      })
    } catch (error) {
      console.error('Failed to send inactivity notification:', error)
    }

    // Sign out and redirect
    await signOut()
    router.push('/auth/signin?reason=inactivity')
  }

  const handleActivity = () => {
    if (showWarning) {
      // User is active again, reset everything
      resetTimer()
    }
  }

  useEffect(() => {
    if (!user) return

    // Set up activity listeners
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    
    const activityHandler = () => {
      resetTimer()
    }

    events.forEach(event => {
      document.addEventListener(event, activityHandler, { passive: true })
    })

    // Initial timer
    resetTimer()

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, activityHandler)
      })
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (warningRef.current) clearTimeout(warningRef.current)
      if (countdownRef.current) clearInterval(countdownRef.current)
    }
  }, [user])

  // Don't render anything if no user or no warning
  if (!user || !showWarning) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '2rem'
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '1rem',
        padding: '2rem',
        maxWidth: '500px',
        width: '100%',
        textAlign: 'center',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '2px solid #EF4444',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem'
        }}>
          <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="#EF4444">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>

        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: 600,
          color: 'white',
          marginBottom: '1rem'
        }}>
          Session Timeout Warning
        </h2>

        <p style={{
          fontSize: '1rem',
          color: '#9CA3AF',
          marginBottom: '1.5rem',
          lineHeight: '1.5'
        }}>
          You have been inactive for 25 minutes. For security reasons, you will be automatically logged out in:
        </p>

        <div style={{
          fontSize: '2rem',
          fontWeight: 700,
          color: '#EF4444',
          marginBottom: '2rem',
          fontFamily: 'monospace'
        }}>
          {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
        </div>

        <p style={{
          fontSize: '0.875rem',
          color: '#9CA3AF',
          marginBottom: '2rem',
          lineHeight: '1.5'
        }}>
          Move your mouse, press a key, or click anywhere to stay logged in.
        </p>

        <button
          onClick={handleActivity}
          style={{
            padding: '0.75rem 2rem',
            background: 'linear-gradient(135deg, #2D5BFF, #9AF23A)',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'transform 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          Stay Logged In
        </button>
      </div>
    </div>
  )
}
