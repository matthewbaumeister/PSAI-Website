'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { createClient, User, Session } from '@supabase/supabase-js'

// Create Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Types
export type UserRole = 'user' | 'admin' | 'superadmin'

export interface UserProfile {
  id: string
  role: UserRole
  display_name?: string
  company?: string
  job_title?: string
  email_notifications: boolean
  subscription_tier: string
  created_at: string
  last_login_at?: string
}

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  session: Session | null
  loading: boolean
  isAdmin: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: Error | null }>
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: Error | null }>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch user profile from database
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        return null
      }

      return data as UserProfile
    } catch (error) {
      console.error('Error fetching profile:', error)
      return null
    }
  }

  // Update last login time
  const updateLastLogin = async (userId: string) => {
    await supabase
      .from('user_profiles')
      .update({ 
        last_login_at: new Date().toISOString(),
        login_count: profile?.login_count ? profile.login_count + 1 : 1
      })
      .eq('id', userId)
  }

  // Initialize auth state
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      
      if (session?.user) {
        const userProfile = await fetchProfile(session.user.id)
        setProfile(userProfile)
      }
      
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      setUser(session?.user ?? null)

      if (event === 'SIGNED_IN' && session?.user) {
        const userProfile = await fetchProfile(session.user.id)
        setProfile(userProfile)
        await updateLastLogin(session.user.id)
      } else if (event === 'SIGNED_OUT') {
        setProfile(null)
      }

      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Sign in with email/password
  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      return { error }
    } catch (error) {
      return { error: error as Error }
    }
  }

  // Sign up with email/password
  const signUp = async (email: string, password: string, displayName?: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName
          }
        }
      })
      return { error }
    } catch (error) {
      return { error: error as Error }
    }
  }

  // Sign out
  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setSession(null)
  }

  // Reset password
  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })
      return { error }
    } catch (error) {
      return { error: error as Error }
    }
  }

  // Update profile
  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return { error: new Error('Not authenticated') }

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', user.id)

      if (!error) {
        setProfile(prev => prev ? { ...prev, ...updates } : null)
      }

      return { error }
    } catch (error) {
      return { error: error as Error }
    }
  }

  // Refresh profile
  const refreshProfile = async () => {
    if (user) {
      const userProfile = await fetchProfile(user.id)
      setProfile(userProfile)
    }
  }

  // Check if user is admin
  const isAdmin = profile?.role === 'admin' || profile?.role === 'superadmin'

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      session,
      loading,
      isAdmin,
      signIn,
      signUp,
      signOut,
      resetPassword,
      updateProfile,
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

// Hook for requiring auth
export function useRequireAuth(redirectTo = '/login') {
  const { user, loading } = useAuth()
  
  useEffect(() => {
    if (!loading && !user) {
      window.location.href = redirectTo
    }
  }, [user, loading, redirectTo])

  return { user, loading }
}

// Hook for requiring admin
export function useRequireAdmin(redirectTo = '/') {
  const { user, isAdmin, loading } = useAuth()
  
  useEffect(() => {
    if (!loading) {
      if (!user) {
        window.location.href = '/login'
      } else if (!isAdmin) {
        window.location.href = redirectTo
      }
    }
  }, [user, isAdmin, loading, redirectTo])

  return { user, isAdmin, loading }
}

