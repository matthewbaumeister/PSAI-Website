'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  companyName?: string
  companySize?: string
  phone?: string
  isAdmin: boolean
  emailVerified: boolean
  isActive: boolean
  lastLoginAt?: string
  createdAt?: string
  updatedAt?: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string, rememberMe?: boolean) => Promise<boolean>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
  refreshToken: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check authentication status on mount
  useEffect(() => {
    checkAuth()
  }, [])

  // Set up auto-refresh token
  useEffect(() => {
    if (user) {
      const interval = setInterval(() => {
        refreshToken()
      }, 25 * 60 * 1000) // Refresh every 25 minutes (before 30-minute expiry)

      return () => clearInterval(interval)
    }
  }, [user])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const userData = await response.json()
        setUser(userData.user)
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string, rememberMe = false): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, rememberMe }),
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        return true
      } else {
        const errorData = await response.json()
        console.error('Login failed:', errorData.message)
        return false
      }
    } catch (error) {
      console.error('Login error:', error)
      return false
    }
  }

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setUser(null)
    }
  }

  const refreshToken = async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/refresh-token', { method: 'POST' })
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        return true
      } else {
        // Token refresh failed, user needs to log in again
        setUser(null)
        return false
      }
    } catch (error) {
      console.error('Token refresh failed:', error)
      setUser(null)
      return false
    }
  }

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    logout,
    checkAuth,
    refreshToken,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
