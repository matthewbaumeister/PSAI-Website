'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { User, Session } from '@supabase/supabase-js'
import { Profile, AuthContextType, AuthState } from '@/lib/types'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  })

  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) throw error
        
        if (session?.user) {
          await fetchUserProfile(session.user)
        }
      } catch (error) {
        console.error('Error getting initial session:', error)
        setState(prev => ({ ...prev, error: 'Failed to get session', loading: false }))
      } finally {
        setState(prev => ({ ...prev, loading: false }))
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id)
        
        if (event === 'SIGNED_IN' && session?.user) {
          await fetchUserProfile(session.user)
        } else if (event === 'SIGNED_OUT') {
          setState({ user: null, loading: false, error: null })
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserProfile = async (user: User) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        // Profile doesn't exist, create it
        if (error.code === 'PGRST116') {
          await createUserProfile(user)
        } else {
          throw error
        }
      } else {
        setState(prev => ({ ...prev, user: profile, loading: false }))
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
      setState(prev => ({ ...prev, error: 'Failed to fetch user profile', loading: false }))
    }
  }

  const createUserProfile = async (user: User) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .insert([
          {
            id: user.id,
            email: user.email!,
            full_name: user.user_metadata?.full_name || '',
            company_name: user.user_metadata?.company_name || '',
          }
        ])
        .select()
        .single()

      if (error) throw error

      // Create default user settings
      await supabase
        .from('user_settings')
        .insert([
          {
            user_id: user.id,
            email_notifications: true,
            push_notifications: true,
            theme: 'light',
            language: 'en',
            timezone: 'UTC',
          }
        ])

      setState(prev => ({ ...prev, user: profile, loading: false }))
    } catch (error) {
      console.error('Error creating user profile:', error)
      setState(prev => ({ ...prev, error: 'Failed to create user profile', loading: false }))
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      if (data.user) {
        await fetchUserProfile(data.user)
      }
    } catch (error: any) {
      console.error('Sign in error:', error)
      setState(prev => ({ 
        ...prev, 
        error: error.message || 'Failed to sign in',
        loading: false 
      }))
      throw error
    }
  }

  const signUp = async (email: string, password: string, userData: Partial<Profile>) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: userData.full_name,
            company_name: userData.company_name,
          }
        }
      })

      if (error) throw error

      if (data.user) {
        // Profile will be created in the auth state change listener
        setState(prev => ({ ...prev, loading: false }))
      }
    } catch (error: any) {
      console.error('Sign up error:', error)
      setState(prev => ({ 
        ...prev, 
        error: error.message || 'Failed to sign up',
        loading: false 
      }))
      throw error
    }
  }

  const signOut = async () => {
    try {
      setState(prev => ({ ...prev, loading: true }))
      
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      setState({ user: null, loading: false, error: null })
    } catch (error: any) {
      console.error('Sign out error:', error)
      setState(prev => ({ 
        ...prev, 
        error: error.message || 'Failed to sign out',
        loading: false 
      }))
      throw error
    }
  }

  const resetPassword = async (email: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) throw error

      setState(prev => ({ ...prev, loading: false }))
    } catch (error: any) {
      console.error('Reset password error:', error)
      setState(prev => ({ 
        ...prev, 
        error: error.message || 'Failed to reset password',
        loading: false 
      }))
      throw error
    }
  }

  const updateProfile = async (data: Partial<Profile>) => {
    if (!state.user) throw new Error('No user logged in')

    try {
      setState(prev => ({ ...prev, loading: true, error: null }))
      
      const { data: updatedProfile, error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', state.user.id)
        .select()
        .single()

      if (error) throw error

      setState(prev => ({ ...prev, user: updatedProfile, loading: false }))
    } catch (error: any) {
      console.error('Update profile error:', error)
      setState(prev => ({ 
        ...prev, 
        error: error.message || 'Failed to update profile',
        loading: false 
      }))
      throw error
    }
  }

  const refreshUser = async () => {
    if (!state.user) return

    try {
      await fetchUserProfile({ id: state.user.id } as User)
    } catch (error) {
      console.error('Error refreshing user:', error)
    }
  }

  const value: AuthContextType = {
    ...state,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
    refreshUser,
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
