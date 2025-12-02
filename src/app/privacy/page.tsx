'use client'

import Link from 'next/link'
import { useTheme } from '@/contexts/ThemeContext'

export default function PrivacyPage() {
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
          Privacy Policy
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
          <h2 style={{ marginTop: '2rem', marginBottom: '1rem' }}>1. Information We Collect</h2>
          <p>We collect information that you provide directly to us when using prop-shop.ai, including:</p>
          <ul>
            <li>Account information (email, name)</li>
            <li>Search queries and chat interactions</li>
            <li>CRM pipeline data and notes</li>
            <li>Usage data and analytics</li>
          </ul>

          <h2 style={{ marginTop: '2rem', marginBottom: '1rem' }}>2. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul>
            <li>Provide, maintain, and improve our services</li>
            <li>Process and complete transactions</li>
            <li>Send you technical notices and support messages</li>
            <li>Respond to your comments and questions</li>
          </ul>

          <h2 style={{ marginTop: '2rem', marginBottom: '1rem' }}>3. Information Sharing</h2>
          <p>We do not share your personal information with third parties except as described in this privacy policy or with your consent.</p>

          <h2 style={{ marginTop: '2rem', marginBottom: '1rem' }}>4. Data Security</h2>
          <p>We take reasonable measures to help protect information about you from loss, theft, misuse, unauthorized access, disclosure, alteration, and destruction.</p>

          <h2 style={{ marginTop: '2rem', marginBottom: '1rem' }}>5. Data Retention</h2>
          <p>We store the information we collect for as long as is necessary for the purpose(s) for which we originally collected it.</p>

          <h2 style={{ marginTop: '2rem', marginBottom: '1rem' }}>6. Your Rights</h2>
          <p>You have the right to access, update, or delete your personal information at any time.</p>

          <h2 style={{ marginTop: '2rem', marginBottom: '1rem' }}>7. Changes to Privacy Policy</h2>
          <p>We may change this privacy policy from time to time. If we make changes, we will notify you by revising the date at the top of the policy.</p>

          <h2 style={{ marginTop: '2rem', marginBottom: '1rem' }}>8. Contact Us</h2>
          <p>If you have any questions about this Privacy Policy, please contact us at <a href="mailto:info@prop-shop.ai" style={{ color: '#A855F7' }}>info@prop-shop.ai</a></p>
        </div>
      </div>
    </div>
  )
}

