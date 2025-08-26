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
        {/* Test Background - Very Visible */}
        <div className="test-bg"></div>
        
        {/* Test Inline Background */}
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'linear-gradient(45deg, rgba(154, 242, 58, 0.4) 25%, transparent 25%, transparent 50%, rgba(154, 242, 58, 0.4) 50%, rgba(154, 242, 58, 0.4) 75%, transparent 75%, transparent)',
          backgroundSize: '50px 50px',
          animation: 'test-move 5s linear infinite',
          zIndex: -50,
          pointerEvents: 'none'
        }}></div>
        
        {/* Enhanced Background Elements */}
        <div className="bg-grid-overlay"></div>
        <div className="bg-dots"></div>
        
        {/* Animated Background */}
        <div className="animated-bg"></div>
        
        {/* Floating Particles Background */}
        <div className="floating-particles">
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
        </div>
        
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  )
}
