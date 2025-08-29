'use client'

import { useState } from 'react'
import { useCookieConsent, CookiePreferences } from '@/hooks/useCookieConsent'

export default function CookieConsent() {
  const { showBanner, savePreferences, acceptAll, acceptNecessary } = useCookieConsent()
  const [showPreferences, setShowPreferences] = useState(false)
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true, // Always true, can't be disabled
    analytics: false,
    marketing: false,
    functional: false
  })

  const handlePreferenceChange = (type: keyof CookiePreferences) => {
    if (type === 'necessary') return // Can't disable necessary cookies
    
    setPreferences(prev => ({
      ...prev,
      [type]: !prev[type]
    }))
  }

  if (!showBanner) return null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
      
      {/* Cookie Banner */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
        <div className="max-w-4xl mx-auto bg-gradient-to-br from-slate-800/95 to-purple-800/95 backdrop-blur-md border border-slate-700/50 rounded-2xl shadow-2xl">
          <div className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-500/30 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Cookie Preferences</h3>
                  <p className="text-slate-300 text-sm">We use cookies to enhance your experience</p>
                </div>
              </div>
              <button
                onClick={() => setShowPreferences(!showPreferences)}
                className="text-slate-400 hover:text-white transition-colors duration-200 p-2 hover:bg-slate-700/30 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {/* Main Message */}
            <div className="mb-6">
              <p className="text-slate-200 leading-relaxed">
                We use cookies and similar technologies to provide, protect, and improve our services. 
                This includes essential cookies for authentication and security, as well as optional cookies 
                for analytics and personalization. You can choose which types of cookies to allow below.
              </p>
            </div>

            {/* Cookie Preferences (Collapsible) */}
            {showPreferences && (
              <div className="mb-6 space-y-4 p-4 bg-slate-700/30 rounded-xl border border-slate-600/30">
                <h4 className="text-white font-semibold mb-3">Cookie Types</h4>
                
                {/* Necessary Cookies */}
                <div className="flex items-center justify-between p-3 bg-slate-600/20 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-white font-medium">Necessary Cookies</span>
                      <span className="px-2 py-1 bg-emerald-500/20 text-emerald-300 text-xs rounded-full border border-emerald-500/30">
                        Always Active
                      </span>
                    </div>
                    <p className="text-slate-400 text-sm mt-1">
                      Essential for the website to function properly. These cannot be disabled.
                    </p>
                  </div>
                  <div className="w-11 h-6 bg-emerald-600 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>

                {/* Analytics Cookies */}
                <div className="flex items-center justify-between p-3 bg-slate-600/20 rounded-lg">
                  <div className="flex-1">
                    <span className="text-white font-medium">Analytics Cookies</span>
                    <p className="text-slate-400 text-sm mt-1">
                      Help us understand how visitors interact with our website.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.analytics}
                      onChange={() => handlePreferenceChange('analytics')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>

                {/* Marketing Cookies */}
                <div className="flex items-center justify-between p-3 bg-slate-600/20 rounded-lg">
                  <div className="flex-1">
                    <span className="text-white font-medium">Marketing Cookies</span>
                    <p className="text-slate-400 text-sm mt-1">
                      Used to deliver personalized content and advertisements.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.marketing}
                      onChange={() => handlePreferenceChange('marketing')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>

                {/* Functional Cookies */}
                <div className="flex items-center justify-between p-3 bg-slate-600/20 rounded-lg">
                  <div className="flex-1">
                    <span className="text-white font-medium">Functional Cookies</span>
                    <p className="text-slate-400 text-sm mt-1">
                      Enable enhanced functionality and personalization.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.functional}
                      onChange={() => handlePreferenceChange('functional')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={acceptAll}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-purple-500/25"
              >
                Accept All Cookies
              </button>
              
              <button
                onClick={acceptNecessary}
                className="flex-1 px-6 py-3 bg-slate-600 text-white rounded-xl hover:bg-slate-700 font-semibold transition-all duration-300"
              >
                Necessary Only
              </button>
              
              {showPreferences && (
                <button
                  onClick={() => savePreferences(preferences)}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl hover:from-emerald-700 hover:to-emerald-800 font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-emerald-500/25"
                >
                  Save Preferences
                </button>
              )}
            </div>

            {/* Privacy Policy Link */}
            <div className="mt-4 text-center">
              <p className="text-slate-400 text-sm">
                By using our website, you agree to our{' '}
                <a href="/privacy" className="text-purple-400 hover:text-purple-300 underline transition-colors duration-200">
                  Privacy Policy
                </a>
                {' '}and{' '}
                <a href="/terms" className="text-purple-400 hover:text-purple-300 underline transition-colors duration-200">
                  Terms of Service
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
