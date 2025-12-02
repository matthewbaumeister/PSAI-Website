import type { Metadata } from 'next'
import { CrmProvider } from '@/contexts/CrmContext'
import './globals.css'

export const metadata: Metadata = {
  title: 'propshop.ai - Government Contracting Intelligence',
  description: 'Search, analyze, and track government contracting opportunities.',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: '/favicon.svg',
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
        background: '#E5E7EB',
        color: '#1F2937',
        minHeight: '100vh'
      }}>
        <CrmProvider>
          {children}
        </CrmProvider>
      </body>
    </html>
  )
}
