import type { Metadata } from 'next'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import './globals.css'

export const metadata: Metadata = {
  title: 'Prop Shop AI - Procurement Intelligence Platform',
  description: 'Where innovation meets compliance. Find, win, and deliver government contracts without the gatekeepers.',
  icons: {
    icon: '/favicon.svg',
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
        {/* Clean, Subtle Background Animations */}
        <div className="animated-bg"></div>
        <div className="bg-grid-overlay"></div>
        <div className="bg-dots"></div>
        <div className="floating-elements"></div>
        
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  )
}
