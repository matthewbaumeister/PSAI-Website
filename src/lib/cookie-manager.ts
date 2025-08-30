export interface CookiePreferences {
  essential: boolean
  analytics: boolean
  marketing: boolean
  functional: boolean
}

export class CookieManager {
  private static instance: CookieManager
  private preferences: CookiePreferences | null = null

  private constructor() {
    this.loadPreferences()
  }

  public static getInstance(): CookieManager {
    if (!CookieManager.instance) {
      CookieManager.instance = new CookieManager()
    }
    return CookieManager.instance
  }

  private loadPreferences(): void {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('cookieConsent')
        if (saved) {
          this.preferences = JSON.parse(saved)
        }
      } catch (error) {
        console.error('Error loading cookie preferences:', error)
      }
    }
  }

  public setPreferences(preferences: CookiePreferences): void {
    this.preferences = preferences
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('cookieConsent', JSON.stringify(preferences))
      localStorage.setItem('cookieConsentDate', new Date().toISOString())
    }

    // Apply preferences to actual cookies
    this.applyPreferences()
  }

  public getPreferences(): CookiePreferences | null {
    return this.preferences
  }

  public hasConsent(): boolean {
    return this.preferences !== null
  }

  private applyPreferences(): void {
    if (!this.preferences) return

    // Essential cookies are always set (authentication, etc.)
    // These are set by your API routes and are necessary for functionality

    // Analytics cookies
    if (this.preferences.analytics) {
      this.setAnalyticsCookies()
    } else {
      this.removeAnalyticsCookies()
    }

    // Marketing cookies
    if (this.preferences.marketing) {
      this.setMarketingCookies()
    } else {
      this.removeMarketingCookies()
    }

    // Functional cookies
    if (this.preferences.functional) {
      this.setFunctionalCookies()
    } else {
      this.removeFunctionalCookies()
    }
  }

  private setAnalyticsCookies(): void {
    // Set Google Analytics or other analytics cookies
    // Example: _ga, _gid, _gat
    this.setCookie('_ga', this.generateAnalyticsId(), 365)
    this.setCookie('_gid', this.generateAnalyticsId(), 1)
    this.setCookie('_gat', '1', 1)
  }

  private removeAnalyticsCookies(): void {
    // Remove analytics cookies
    this.removeCookie('_ga')
    this.removeCookie('_gid')
    this.removeCookie('_gat')
    this.removeCookie('_ga_')
  }

  private setMarketingCookies(): void {
    // Set marketing/tracking cookies
    // Example: Facebook pixel, Google Ads, etc.
    this.setCookie('fbp', this.generateMarketingId(), 90)
    this.setCookie('_fbp', this.generateMarketingId(), 90)
  }

  private removeMarketingCookies(): void {
    // Remove marketing cookies
    this.removeCookie('fbp')
    this.removeCookie('_fbp')
  }

  private setFunctionalCookies(): void {
    // Set functional cookies for enhanced features
    // Example: user preferences, theme settings, etc.
    this.setCookie('user_theme', 'dark', 365)
    this.setCookie('language', 'en', 365)
  }

  private removeFunctionalCookies(): void {
    // Remove functional cookies
    this.removeCookie('user_theme')
    this.removeCookie('language')
  }

  private setCookie(name: string, value: string, days: number): void {
    if (typeof window === 'undefined') return

    const expires = new Date()
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000))
    
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`
  }

  private removeCookie(name: string): void {
    if (typeof window === 'undefined') return

    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`
  }

  private generateAnalyticsId(): string {
    return 'GA1.2.' + Math.random().toString(36).substr(2, 9) + '.' + Math.floor(Date.now() / 1000)
  }

  private generateMarketingId(): string {
    return 'fb.' + Math.random().toString(36).substr(2, 9) + '.' + Math.floor(Date.now() / 1000)
  }

  // Method to check if a specific cookie type is allowed
  public isAllowed(cookieType: keyof CookiePreferences): boolean {
    if (!this.preferences) return false
    return this.preferences[cookieType]
  }

  // Method to get all current cookies
  public getAllCookies(): Record<string, string> {
    if (typeof window === 'undefined') return {}

    const cookies: Record<string, string> = {}
    document.cookie.split(';').forEach(cookie => {
      const [name, value] = cookie.trim().split('=')
      if (name && value) {
        cookies[name] = value
      }
    })
    return cookies
  }

  // Method to clear all non-essential cookies
  public clearNonEssentialCookies(): void {
    if (!this.preferences) return

    const allCookies = this.getAllCookies()
    
    Object.keys(allCookies).forEach(cookieName => {
      // Don't remove essential cookies (auth, session, etc.)
      if (!this.isEssentialCookie(cookieName)) {
        this.removeCookie(cookieName)
      }
    })
  }

  private isEssentialCookie(name: string): boolean {
    const essentialCookieNames = [
      'access_token',
      'session_token', 
      'auth_status',
      'csrf_token',
      'sessionid'
    ]
    return essentialCookieNames.some(essential => name.includes(essential))
  }
}

// Export singleton instance
export const cookieManager = CookieManager.getInstance()
