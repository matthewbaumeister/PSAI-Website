'use client'

import Link from 'next/link'
import { useTheme } from '@/contexts/ThemeContext'

export default function TermsPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <div style={{
      minHeight: '100vh',
      background: isDark ? '#111827' : '#F9FAFB',
      padding: '2rem'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        background: isDark ? '#1F2937' : '#FFFFFF',
        padding: '3rem',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        <Link href="/" style={{
          color: '#A855F7',
          textDecoration: 'none',
          fontSize: '0.875rem',
          marginBottom: '2rem',
          display: 'inline-block'
        }}>
          ← Back to Home
        </Link>

        <h1 style={{
          fontSize: '2rem',
          fontWeight: '700',
          color: isDark ? '#F9FAFB' : '#1F2937',
          marginBottom: '1rem'
        }}>
          Terms of Service
        </h1>

        <p style={{
          color: isDark ? '#9CA3AF' : '#6B7280',
          marginBottom: '2rem'
        }}>
          Last updated: December 2, 2025
        </p>

        <div style={{
          color: isDark ? '#D1D5DB' : '#374151',
          lineHeight: '1.8',
          fontSize: '1rem'
        }}>
          <h2 style={{ marginTop: '2rem', marginBottom: '1rem' }}>1. Acceptance of Terms</h2>
          <p>By accessing and using prop-shop.ai, you accept and agree to be bound by the terms and provision of this agreement.</p>

          <h2 style={{ marginTop: '2rem', marginBottom: '1rem' }}>2. Use License</h2>
          <p>Permission is granted to temporarily access the materials (information or software) on prop-shop.ai for personal, non-commercial transitory viewing only.</p>

          <h2 style={{ marginTop: '2rem', marginBottom: '1rem' }}>3. Disclaimer</h2>
          <p>The materials on prop-shop.ai are provided on an 'as is' basis. Billow LLC makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.</p>

          <h2 style={{ marginTop: '2rem', marginBottom: '1rem' }}>4. Limitations</h2>
          <p>In no event shall Billow LLC or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on prop-shop.ai.</p>

          <h2 style={{ marginTop: '2rem', marginBottom: '1rem' }}>5. Accuracy of Materials</h2>
          <p>The materials appearing on prop-shop.ai could include technical, typographical, or photographic errors. Billow LLC does not warrant that any of the materials on its website are accurate, complete, or current.</p>

          <h2 style={{ marginTop: '2rem', marginBottom: '1rem' }}>6. Links</h2>
          <p>Billow LLC has not reviewed all of the sites linked to its website and is not responsible for the contents of any such linked site.</p>

          <h2 style={{ marginTop: '2rem', marginBottom: '1rem' }}>7. Modifications</h2>
          <p>Billow LLC may revise these terms of service for its website at any time without notice.</p>

          <h2 style={{ marginTop: '2rem', marginBottom: '1rem' }}>8. Contact</h2>
          <p>For questions about these Terms of Service, please contact us at <a href="mailto:info@prop-shop.ai" style={{ color: '#A855F7' }}>info@prop-shop.ai</a></p>
        </div>
      </div>
    </div>
  )
}

