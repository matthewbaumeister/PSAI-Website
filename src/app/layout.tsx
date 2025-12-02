import type { Metadata } from 'next'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { AuthProvider } from '@/contexts/AuthContext'
import { CrmProvider } from '@/contexts/CrmContext'
import { CookieConsent } from '@/components/CookieConsent'
import './globals.css'

export const metadata: Metadata = {
  title: 'Prop Shop AI - Procurement Intelligence Platform',
  description: 'Where innovation meets compliance. Find, win, and deliver government contracts without the gatekeepers.',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: '/favicon.svg',
  },
  openGraph: {
    title: 'Prop Shop AI - Procurement Intelligence Platform',
    description: 'Where innovation meets compliance. Find, win, and deliver government contracts without the gatekeepers.',
    url: 'https://prop-shop.ai',
    siteName: 'Prop Shop AI',
    images: [
      {
        url: '/og-image.svg',
        width: 1200,
        height: 630,
        alt: 'Prop Shop AI - Procurement Intelligence Platform',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Prop Shop AI - Procurement Intelligence Platform',
    description: 'Where innovation meets compliance. Find, win, and deliver government contracts without the gatekeepers.',
    images: ['/og-image.svg'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>
          <CrmProvider>
            {/* Clean, Subtle Background Animations */}
            <div className="animated-bg"></div>
            <div className="bg-grid-overlay"></div>
            <div className="bg-dots"></div>
            <div className="floating-elements"></div>
            
            <Header />
            {children}
            <Footer />
            <CookieConsent />
          </CrmProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
