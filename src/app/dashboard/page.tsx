'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function DashboardPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  // Check if user is authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-purple-200 text-base">Loading Dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800/50 to-purple-800/50 backdrop-blur-sm border-b border-slate-700/50">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                Dashboard
              </h1>
              <p className="text-slate-300 mt-2 text-base">Welcome back! Here's an overview of your account</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-slate-800/50 rounded-full px-4 py-2 border border-slate-600/50">
                <span className="text-slate-300 text-sm">Logged in as: </span>
                <span className="text-white font-semibold text-sm">{user.email}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Coming Soon Message */}
        <div className="bg-gradient-to-br from-slate-800/50 to-purple-800/20 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 text-center mb-8">
          <div className="w-16 h-16 bg-purple-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Dashboard Coming Soon!</h2>
          <p className="text-slate-300 text-base max-w-2xl mx-auto">
            We're working hard to build you an amazing dashboard experience. Soon you'll be able to track your 
            procurement activities, view analytics, and manage your projects all in one place.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-slate-800/50 to-blue-800/20 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:border-blue-500/30 transition-all duration-300">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-500/30 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Account Status</p>
                <p className="text-white font-semibold text-sm">Active</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-800/50 to-emerald-800/20 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:border-emerald-500/30 transition-all duration-300">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-emerald-500/30 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Email Status</p>
                <p className={`font-semibold text-sm ${
                  user.emailVerified ? 'text-emerald-300' : 'text-yellow-300'
                }`}>
                  {user.emailVerified ? 'Verified' : 'Pending'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-800/50 to-purple-800/20 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:border-purple-500/30 transition-all duration-300">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-purple-500/30 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Company</p>
                <p className="text-white font-semibold text-sm">{user.companyName || 'Not set'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-700/20 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <a href="/profile" className="flex items-center space-x-3 p-3 bg-slate-700/30 rounded-lg hover:bg-slate-600/30 transition-colors duration-200">
              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-white text-sm">Edit Profile</span>
            </a>
            
            <a href="/settings" className="flex items-center space-x-3 p-3 bg-slate-700/30 rounded-lg hover:bg-slate-600/30 transition-colors duration-200">
              <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-white text-sm">Settings</span>
            </a>
            
            {user.isAdmin && (
              <a href="/admin" className="flex items-center space-x-3 p-3 bg-slate-700/30 rounded-lg hover:bg-slate-600/30 transition-colors duration-200">
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span className="text-white text-sm">Admin Panel</span>
              </a>
            )}
            
            <a href="/book-demo" className="flex items-center space-x-3 p-3 bg-slate-700/30 rounded-lg hover:bg-slate-600/30 transition-colors duration-200">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-white text-sm">Book Demo</span>
            </a>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-700/20 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 mt-8">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 bg-slate-700/30 rounded-lg">
              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
              <span className="text-slate-300 text-sm">Profile updated successfully</span>
              <span className="text-slate-500 text-xs ml-auto">2 hours ago</span>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-slate-700/30 rounded-lg">
              <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
              <span className="text-slate-300 text-sm">Email preferences updated</span>
              <span className="text-slate-500 text-xs ml-auto">1 day ago</span>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-slate-700/30 rounded-lg">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span className="text-slate-300 text-sm">Account created</span>
              <span className="text-slate-500 text-xs ml-auto">3 days ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
