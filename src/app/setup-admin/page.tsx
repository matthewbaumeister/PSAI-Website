'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

export default function SetupAdminPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [isSettingUp, setIsSettingUp] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    )
  }

  if (!user) {
    router.push('/auth/login')
    return null
  }

  if (user.isAdmin) {
    router.push('/admin')
    return null
  }

  const makeAdmin = async () => {
    setIsSettingUp(true)
    setMessage('')

    try {
      const response = await fetch('/api/make-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const data = await response.json()

      if (response.ok) {
        setMessageType('success')
        setMessage('Success! You are now an admin. Redirecting to admin dashboard...')
        
        // Refresh the page to update user context
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else {
        setMessageType('error')
        setMessage(data.message || 'Failed to make user admin')
      }
    } catch (error) {
      setMessageType('error')
      setMessage('An unexpected error occurred')
    } finally {
      setIsSettingUp(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="max-w-md mx-auto px-4 text-center">
        <h1 className="text-3xl font-bold text-white mb-6">Setup Admin Access</h1>
        
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <p className="text-gray-300 mb-4">
            You are currently logged in as: <strong className="text-white">{user.email}</strong>
          </p>
          
          <p className="text-gray-400 mb-6">
            Click the button below to grant yourself admin privileges. This will allow you to access the admin dashboard and manage users.
          </p>

          {message && (
            <div className={`mb-4 p-3 rounded-lg ${
              messageType === 'success' 
                ? 'bg-green-900 border border-green-700 text-green-100' 
                : 'bg-red-900 border border-red-700 text-red-100'
            }`}>
              {message}
            </div>
          )}

          <button
            onClick={makeAdmin}
            disabled={isSettingUp}
            className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isSettingUp ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Setting up admin access...
              </div>
            ) : (
              'Make Me Admin'
            )}
          </button>
        </div>

        <div className="text-sm text-gray-500">
          <p>⚠️ This is a temporary setup page for testing purposes.</p>
          <p>Remove this page after setting up your admin account.</p>
        </div>
      </div>
    </div>
  )
}
