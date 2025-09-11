'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getPublicationBySlug, type Publication } from '@/data/publications'
import { useAuth } from '@/contexts/AuthContext'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export default function PublicationPage() {
  const params = useParams()
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [publication, setPublication] = useState<Publication | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    if (params.slug) {
      const pub = getPublicationBySlug(params.slug as string)
      setPublication(pub || null)
    }
  }, [params.slug])

  const handleExportPDF = async (publication: Publication) => {
    try {
      // Check if we're in browser environment
      if (typeof window === 'undefined') {
        throw new Error('PDF export only available in browser')
      }

      // Check if jsPDF is available
      if (!jsPDF) {
        throw new Error('jsPDF library not available')
      }

      // Create PDF with proper 1" margins
      const pdf = new jsPDF('p', 'pt', 'letter') // 612x792 points (8.5" x 11")
      const pageWidth = 612
      const pageHeight = 792
      const margin = 72 // 1" margins
      const contentWidth = pageWidth - (margin * 2) // 468 points
      
      let yPosition = margin
      const lineHeight = 14
      const fontSize = 10
      
      // Set font
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(fontSize)
      
      // Add watermark function
      const addWatermark = () => {
        try {
          pdf.setGState({opacity: 0.15})
          pdf.setTextColor(45, 91, 255)
          pdf.setFontSize(48)
          pdf.text('PROP SHOP AI', pageWidth/2, pageHeight/2, {angle: -45, align: 'center'})
          pdf.setGState({opacity: 1})
          pdf.setTextColor(0, 0, 0)
          pdf.setFontSize(fontSize)
        } catch (error) {
          console.warn('Watermark failed:', error)
          // Continue without watermark
        }
      }
      
      // Add watermark to first page
      addWatermark()
      
      // Header
      pdf.setFontSize(16)
      pdf.setTextColor(45, 91, 255)
      pdf.text('Prop Shop AI', margin, yPosition)
      yPosition += 20
      
      pdf.setFontSize(8)
      pdf.setTextColor(100, 100, 100)
      pdf.text('Procurement Intelligence Platform', margin, yPosition)
      yPosition += 30
      
      // Title
      pdf.setFontSize(14)
      pdf.setTextColor(0, 0, 0)
      const titleLines = pdf.splitTextToSize(publication.title, contentWidth)
      pdf.text(titleLines, margin, yPosition)
      yPosition += (titleLines.length * lineHeight) + 20
      
      // Author and date
      pdf.setFontSize(10)
      pdf.setTextColor(100, 100, 100)
      pdf.text(`By ${publication.author} • ${publication.date} • ${publication.readTime}`, margin, yPosition)
      yPosition += 30
      
      // Executive Summary
      pdf.setFontSize(12)
      pdf.setTextColor(45, 91, 255)
      pdf.text('Executive Summary', margin, yPosition)
      yPosition += 20
      
      pdf.setFontSize(10)
      pdf.setTextColor(0, 0, 0)
      const excerptLines = pdf.splitTextToSize(publication.excerpt, contentWidth)
      pdf.text(excerptLines, margin, yPosition)
      yPosition += (excerptLines.length * lineHeight) + 30
      
      // Content (simplified for PDF)
      const contentText = publication.content.replace(/<[^>]*>/g, '') // Remove HTML tags
      const contentLines = pdf.splitTextToSize(contentText, contentWidth)
      
      for (let i = 0; i < contentLines.length; i++) {
        if (yPosition > pageHeight - margin - 50) {
          pdf.addPage()
          addWatermark()
          yPosition = margin
        }
        try {
          pdf.text(contentLines[i], margin, yPosition)
        } catch (error) {
          console.warn('Text rendering failed for line:', i, error)
          // Skip this line and continue
        }
        yPosition += lineHeight
      }
      
      // Add footer to last page
      yPosition = pageHeight - margin
      pdf.setFontSize(8)
      pdf.setTextColor(100, 100, 100)
      pdf.text(`© ${new Date().getFullYear()} Prop Shop AI. All rights reserved.`, margin, yPosition)
      pdf.text(`Generated on ${new Date().toLocaleDateString()}`, pageWidth - margin - 100, yPosition)
      
      // Download the PDF
      const fileName = publication.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 60)
      
      try {
        pdf.save(`PropShop-AI-${fileName}.pdf`)
      } catch (saveError) {
        console.error('Error saving PDF:', saveError)
        // Try alternative save method
        const pdfBlob = pdf.output('blob')
        const url = URL.createObjectURL(pdfBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = `PropShop-AI-${fileName}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }
      
    } catch (error) {
      console.error('Error generating PDF:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      alert(`Error generating PDF: ${errorMessage}. Please try again.`)
    }
  }

  if (!publication) {
    return (
      <main className="publication-page">
        <div className="container">
          <div className="not-found">
            <h1>Publication Not Found</h1>
            <p>The publication you're looking for doesn't exist.</p>
            <button 
              onClick={() => router.push('/publications')}
              className="btn btn-primary"
            >
              Back to Publications
            </button>
          </div>
        </div>
      </main>
    )
  }

  if (isLoading) {
    return (
      <main className="publication-page">
        <div className="container">
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading publication...</p>
          </div>
        </div>
      </main>
    )
  }

  if (!user) {
    return (
      <main className="publication-page">
        <div className="container">
          <div className="login-required">
            <div className="login-card">
              <h1>🔒 Login Required</h1>
              <p>Create a free account to access the full article:</p>
              <ul className="feature-list">
                <li>Read complete research reports</li>
                <li>Access premium publications</li>
                <li>Download PDF versions</li>
                <li>Save articles for later</li>
                <li>Get personalized recommendations</li>
              </ul>
              <div className="login-actions">
                <button 
                  onClick={() => {
                    localStorage.setItem('redirectAfterLogin', `/publications/${publication.slug}`)
                    router.push('/auth/login')
                  }}
                  className="btn btn-primary"
                >
                  Login
                </button>
                <button 
                  onClick={() => {
                    localStorage.setItem('redirectAfterLogin', `/publications/${publication.slug}`)
                    router.push('/auth/register')
                  }}
                  className="btn btn-outline"
                >
                  Sign Up Free
                </button>
              </div>
              <p className="login-note">
                Already have an account? <a href="/auth/login">Sign in here</a>
              </p>
            </div>
            
            {/* Preview of the article */}
            <div className="article-preview">
              <div className="preview-header">
                <h2>{publication.title}</h2>
                <div className="preview-meta">
                  <span className="author">By {publication.author}</span>
                  <span className="date">{publication.date}</span>
                  <span className="read-time">{publication.readTime}</span>
                </div>
                <div className="preview-tags">
                  {publication.tags.slice(0, 5).map(tag => (
                    <span key={tag} className="tag">{tag}</span>
                  ))}
                </div>
              </div>
              
              <div className="preview-content">
                <h3>Executive Summary</h3>
                <p>{publication.excerpt}</p>
                
                <div className="preview-teaser">
                  <h3>What's Inside This Article:</h3>
                  <ul>
                    <li>Comprehensive analysis and insights</li>
                    <li>Detailed implementation guidance</li>
                    <li>Real-world case studies and examples</li>
                    <li>Complete source citations and references</li>
                    <li>Professional PDF export functionality</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="publication-page">
      <div className="container">
        <div className="publication-header">
          <button 
            onClick={() => router.back()}
            className="back-btn"
          >
            ← Back
          </button>
          
          <div className="publication-meta">
            <div className="publication-badges">
              <div className="publication-category">{publication.category}</div>
              {publication.featured && <div className="featured-badge">Featured</div>}
            </div>
            
            <h1>{publication.title}</h1>
            
            <div className="publication-details">
              <span className="author">By {publication.author}</span>
              <span className="date">{publication.date}</span>
              <span className="read-time">{publication.readTime}</span>
            </div>
            
            <div className="publication-tags">
              {publication.tags.map(tag => (
                <span key={tag} className="tag">{tag}</span>
              ))}
            </div>
          </div>
          
          <div className="publication-actions">
            {user && (
              <button 
                className="pdf-export-btn"
                onClick={() => handleExportPDF(publication)}
                title="Export to PDF"
              >
                Export PDF
              </button>
            )}
            <button 
              className="share-btn"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: publication.title,
                    text: publication.excerpt,
                    url: window.location.href
                  })
                } else {
                  navigator.clipboard.writeText(window.location.href)
                  alert('Link copied to clipboard!')
                }
              }}
            >
              Share
            </button>
          </div>
        </div>

        <div className="publication-content">
          <div className="executive-summary">
            <h2>Executive Summary</h2>
            <p>{publication.excerpt}</p>
          </div>
          
          <div 
            className="article-content"
            dangerouslySetInnerHTML={{ __html: publication.content }}
          />
        </div>
      </div>
    </main>
  )
}
