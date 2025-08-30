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
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-purple-200 text-lg">Loading Dashboard...</p>
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
      <div className="bg-gradient-to-r from-slate-800/50 to-purple-800/50 backdrop-blur-sm border-b border-slate-700/50 sticky top-0 z-10">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                Dashboard
              </h1>
              <p className="text-slate-300 mt-2 text-lg">Welcome back, {user.firstName}!</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-slate-800/50 rounded-full px-4 py-2 border border-slate-600/50">
                <span className="text-slate-300 text-sm">Signed in as </span>
                <span className="text-white font-semibold">{user.email}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-sm border border-blue-500/30 rounded-2xl p-6 hover:scale-105 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500/40 to-blue-600/40 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 border border-blue-400/30 group-hover:from-blue-500/50 group-hover:to-blue-600/50 group-hover:shadow-blue-500/30 group-hover:scale-110 transition-all duration-300">
                <svg className="w-7 h-7 text-blue-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '28px', height: '28px' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-right">
                <p className="text-blue-300 text-sm font-medium">Account Status</p>
                <p className="text-xl font-bold text-white">Active</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 backdrop-blur-sm border border-emerald-500/30 rounded-2xl p-6 hover:scale-105 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500/40 to-emerald-600/40 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 border border-emerald-400/30 group-hover:from-emerald-500/50 group-hover:to-emerald-600/50 group-hover:shadow-emerald-500/30 group-hover:scale-110 transition-all duration-300">
                <svg className="w-7 h-7 text-emerald-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '28px', height: '28px' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a0 0 0 00-7-7z" />
                </svg>
              </div>
              <div className="text-right">
                <p className="text-emerald-300 text-sm font-medium">Member Since</p>
                <p className="text-xl font-bold text-white">2025</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-sm border border-purple-500/30 rounded-2xl p-6 hover:scale-105 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500/40 to-purple-600/40 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/20 border border-purple-400/30 group-hover:from-purple-500/50 group-hover:to-purple-600/50 group-hover:shadow-purple-500/30 group-hover:scale-110 transition-all duration-300">
                <svg className="w-7 h-7 text-purple-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '28px', height: '28px' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="text-right">
                <p className="text-purple-300 text-sm font-medium">Company</p>
                <p className="text-xl font-bold text-white">{user.companyName || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Coming Soon Section */}
        <div className="bg-gradient-to-br from-slate-800/50 to-amber-800/20 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-amber-500/40 to-amber-600/40 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-amber-500/20 border border-amber-400/30 hover:from-amber-500/50 hover:to-amber-600/50 hover:shadow-amber-500/30 hover:scale-105 transition-all duration-300">
            <svg className="w-12 h-12 text-amber-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '48px', height: '48px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">Dashboard Coming Soon</h2>
          <p className="text-slate-300 text-lg mb-6 max-w-2xl mx-auto">
            We're building an amazing dashboard experience for you. Soon you'll be able to track your procurement activities, 
            view analytics, and manage your projects all in one place.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <div className="bg-slate-700/30 rounded-lg px-4 py-2 border border-slate-600/30">
              <span className="text-slate-300">📊 Analytics</span>
            </div>
            <div className="bg-slate-700/30 rounded-lg px-4 py-2 border border-slate-600/30">
              <span className="text-slate-300">📈 Reports</span>
            </div>
            <div className="bg-slate-700/30 rounded-lg px-4 py-2 border border-slate-600/30">
              <span className="text-slate-300">🎯 Projects</span>
            </div>
            <div className="bg-slate-700/30 rounded-lg px-4 py-2 border border-slate-600/30">
              <span className="text-slate-300">📋 Tasks</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-slate-800/50 to-blue-800/20 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 hover:border-blue-500/30 transition-all duration-300">
            <h3 className="text-xl font-bold text-white mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full text-left p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors duration-200">
                <span className="text-slate-300">📝 Create New Project</span>
              </button>
              <button className="w-full text-left p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors duration-200">
                <span className="text-slate-300">🔍 Search Suppliers</span>
              </button>
              <button className="w-full text-left p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors duration-200">
                <span className="text-slate-300">📊 View Reports</span>
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-800/50 to-purple-800/20 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 hover:border-purple-500/30 transition-all duration-300">
            <h3 className="text-xl font-bold text-white mb-4">Recent Activity</h3>
            <div className="space-y-3">
              <div className="p-3 bg-slate-700/30 rounded-lg">
                <p className="text-slate-300 text-sm">🎉 Welcome to Prop Shop AI!</p>
                <p className="text-slate-500 text-xs">Just now</p>
              </div>
              <div className="p-3 bg-slate-700/30 rounded-lg">
                <p className="text-slate-300 text-sm">✅ Account verified successfully</p>
                <p className="text-slate-500 text-xs">Recently</p>
              </div>
              <div className="p-3 bg-slate-700/30 rounded-lg">
                <p className="text-slate-300 text-sm">🔐 Profile setup completed</p>
                <p className="text-slate-500 text-xs">Recently</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
