'use client'

import Link from 'next/link'
import { useTheme } from '@/contexts/ThemeContext'

export const dynamic = 'force-dynamic'

export default function AboutPage() {
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
          marginBottom: '2rem'
        }}>
          About prop-shop.ai
        </h1>

        <div style={{
          color: isDark ? '#D1D5DB' : '#374151',
          lineHeight: '1.8',
          fontSize: '1rem'
        }}>
          <p>prop-shop.ai is an AI-powered platform for government contracting intelligence, built by Billow LLC.</p>

          <h2 style={{ marginTop: '2rem', marginBottom: '1rem', color: isDark ? '#F9FAFB' : '#1F2937' }}>Our Mission</h2>
          <p>We're building intelligent tools to help businesses discover, analyze, and win government contracting opportunities. Our platform combines comprehensive opportunity data with AI-powered chat and pipeline management.</p>

          <h2 style={{ marginTop: '2rem', marginBottom: '1rem', color: isDark ? '#F9FAFB' : '#1F2937' }}>What We Offer</h2>
          <ul>
            <li><strong>Opportunity Search:</strong> Search across multiple government contracting data sources</li>
            <li><strong>AI Chat:</strong> Ask questions about opportunities, agencies, and requirements</li>
            <li><strong>CRM Pipeline:</strong> Track and manage opportunities through your pipeline</li>
            <li><strong>Smart Insights:</strong> Get AI-powered recommendations and analysis</li>
          </ul>

          <h2 style={{ marginTop: '2rem', marginBottom: '1rem', color: isDark ? '#F9FAFB' : '#1F2937' }}>About Billow LLC</h2>
          <p>Billow LLC is the company behind prop-shop.ai. We're focused on building modern tools for the government contracting industry.</p>

          <h2 style={{ marginTop: '2rem', marginBottom: '1rem', color: isDark ? '#F9FAFB' : '#1F2937' }}>Contact</h2>
          <p>Have questions or feedback? Reach out to us at <a href="mailto:info@prop-shop.ai" style={{ color: '#A855F7', textDecoration: 'none' }}>info@prop-shop.ai</a></p>
        </div>
      </div>
    </div>
  )
}

