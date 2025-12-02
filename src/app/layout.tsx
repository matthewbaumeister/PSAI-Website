import type { Metadata } from 'next'
import { CrmProvider } from '@/contexts/CrmContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { AuthProvider } from '@/contexts/AuthContext'
import './globals.css'

export const metadata: Metadata = {
  title: 'prop-shop.ai - Government Contracting Intelligence',
  description: 'Search, analyze, and track government contracting opportunities.',
  icons: {
    icon: [
      { url: '/favicon.png', type: 'image/png' },
    ],
    apple: '/favicon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body style={{
        margin: 0,
        padding: 0,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        minHeight: '100vh'
      }}>
        <AuthProvider>
          <ThemeProvider>
            <CrmProvider>
              {children}
            </CrmProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
