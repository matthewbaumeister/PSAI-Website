import { useState, useEffect } from 'react'

export interface CookiePreferences {
  necessary: boolean
  analytics: boolean
  marketing: boolean
  functional: boolean
}

export function useCookieConsent() {
  const [preferences, setPreferences] = useState<CookiePreferences | null>(null)
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    // Check if user has already made a choice
    const cookieChoice = localStorage.getItem('cookie-consent')
    if (cookieChoice) {
      try {
        const parsed = JSON.parse(cookieChoice)
        setPreferences(parsed)
        setShowBanner(false)
      } catch (error) {
        console.error('Error parsing cookie preferences:', error)
        setShowBanner(true)
      }
    } else {
      setShowBanner(true)
    }
  }, [])

  const savePreferences = (prefs: CookiePreferences) => {
    localStorage.setItem('cookie-consent', JSON.stringify(prefs))
    localStorage.setItem('cookie-consent-date', new Date().toISOString())
    
    // Set a cookie to remember the choice
    document.cookie = `cookie_consent=${JSON.stringify(prefs)}; path=/; max-age=${365 * 24 * 60 * 60}; SameSite=Lax`
    
    setPreferences(prefs)
    setShowBanner(false)
    
    // If analytics is accepted, you could initialize analytics here
    if (prefs.analytics) {
      // Initialize analytics (Google Analytics, etc.)
      console.log('Analytics cookies enabled')
    }
    
    // If marketing is accepted, you could enable marketing features
    if (prefs.marketing) {
      console.log('Marketing cookies enabled')
    }
  }

  const reopenBanner = () => {
    setShowBanner(true)
  }

  const acceptAll = () => {
    const allPreferences = {
      necessary: true,
      analytics: true,
      marketing: true,
      functional: true
    }
    savePreferences(allPreferences)
  }

  const acceptNecessary = () => {
    const necessaryOnly = {
      necessary: true,
      analytics: false,
      marketing: false,
      functional: false
    }
    savePreferences(necessaryOnly)
  }

  return {
    preferences,
    showBanner,
    savePreferences,
    reopenBanner,
    acceptAll,
    acceptNecessary,
    setShowBanner
  }
}
