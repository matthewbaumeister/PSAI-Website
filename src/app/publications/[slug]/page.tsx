'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getPublicationBySlug, type Publication } from '@/data/publications'
import { useAuth } from '@/hooks/useAuth'
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
      // Create a temporary element to render the article content for PDF
      const tempElement = document.createElement('div')
      tempElement.style.position = 'absolute'
      tempElement.style.left = '-9999px'
      tempElement.style.top = '-9999px'
      tempElement.style.width = '800px'
      tempElement.style.padding = '60px'
      tempElement.style.backgroundColor = 'white'
      tempElement.style.color = '#1a1a1a'
      tempElement.style.fontFamily = 'Georgia, serif'
      tempElement.style.fontSize = '16px'
      tempElement.style.lineHeight = '1.7'
      
      // Generate current date for footer
      const currentDate = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
      
      // Create the HTML content for the PDF with professional formatting
      tempElement.innerHTML = `
        <div style="margin-bottom: 40px;">
          <!-- Header with Prop Shop AI Branding -->
          <div style="text-align: center; margin-bottom: 40px; padding-bottom: 30px; border-bottom: 3px solid #2D5BFF;">
            <div style="margin-bottom: 20px;">
              <h1 style="color: #2D5BFF; font-size: 32px; margin: 0; font-weight: 700; letter-spacing: -0.5px;">Prop Shop AI</h1>
              <p style="color: #666; font-size: 14px; margin: 5px 0 0 0; font-style: italic;">Procurement Intelligence Platform</p>
            </div>
            <h2 style="color: #1a1a1a; font-size: 28px; margin: 0; font-weight: 600; line-height: 1.3;">${publication.title}</h2>
            <div style="color: #666; font-size: 16px; margin: 20px 0 0 0;">
              <span style="color: #9AF23A; font-weight: 600;">By ${publication.author}</span> • 
              <span>${publication.date}</span> • 
              <span>${publication.readTime}</span>
            </div>
            <div style="margin-top: 20px;">
              ${publication.tags.map(tag => `<span style="background: #f8f9fa; color: #495057; padding: 6px 12px; border-radius: 20px; margin: 3px; font-size: 12px; display: inline-block; border: 1px solid #dee2e6;">${tag}</span>`).join('')}
            </div>
          </div>
          
          <!-- Executive Summary -->
          <div style="background: #f8f9fa; padding: 25px; border-left: 4px solid #2D5BFF; margin-bottom: 30px; border-radius: 0 8px 8px 0;">
            <h3 style="color: #2D5BFF; font-size: 18px; margin: 0 0 15px 0; font-weight: 600;">Executive Summary</h3>
            <p style="margin: 0; color: #495057; font-size: 15px; line-height: 1.6;">${publication.excerpt}</p>
          </div>
          
          <!-- Main Content -->
          <div style="color: #1a1a1a; line-height: 1.8; font-size: 16px;">
            ${publication.content}
          </div>
          
          <!-- References Section -->
          <div style="margin-top: 50px; padding-top: 30px; border-top: 2px solid #e9ecef;">
            <h3 style="color: #2D5BFF; font-size: 20px; margin: 0 0 25px 0; font-weight: 600;">References</h3>
            <div style="font-size: 14px; line-height: 1.6; color: #495057;">
              <p style="margin: 0 0 15px 0;"><strong>Primary Sources:</strong></p>
              <ul style="margin: 0 0 20px 0; padding-left: 20px;">
                <li style="margin-bottom: 8px;">Defense Innovation Unit. "Small Business Innovation Research (SBIR) Program." U.S. Department of Defense. Accessed ${currentDate}. <span style="color: #2D5BFF;">https://www.dodsbirsttr.mil/</span></li>
                <li style="margin-bottom: 8px;">Small Business Administration. "SBIR/STTR Programs." U.S. Small Business Administration. Accessed ${currentDate}. <span style="color: #2D5BFF;">https://www.sbir.gov/</span></li>
                <li style="margin-bottom: 8px;">Federal Procurement Data System. "Contracting Data." General Services Administration. Accessed ${currentDate}. <span style="color: #2D5BFF;">https://www.fpds.gov/</span></li>
                <li style="margin-bottom: 8px;">System for Award Management (SAM). "Contract Opportunities." General Services Administration. Accessed ${currentDate}. <span style="color: #2D5BFF;">https://sam.gov/</span></li>
              </ul>
              
              <p style="margin: 0 0 15px 0;"><strong>Additional Resources:</strong></p>
              <ul style="margin: 0 0 20px 0; padding-left: 20px;">
                <li style="margin-bottom: 8px;">Defense Innovation Unit. "Defense Innovation Portal (DSIP)." U.S. Department of Defense. Accessed ${currentDate}. <span style="color: #2D5BFF;">https://www.dodsbirsttr.mil/topics-app/</span></li>
                <li style="margin-bottom: 8px;">Federal Acquisition Regulation (FAR). "Part 19 - Small Business Programs." Code of Federal Regulations. Accessed ${currentDate}. <span style="color: #2D5BFF;">https://www.acquisition.gov/far/part-19</span></li>
                <li style="margin-bottom: 8px;">Defense Federal Acquisition Regulation Supplement (DFARS). "Part 219 - Small Business Programs." Code of Federal Regulations. Accessed ${currentDate}. <span style="color: #2D5BFF;">https://www.acquisition.gov/dfars/part-219</span></li>
              </ul>
              
              <p style="margin: 0 0 15px 0;"><strong>Methodology:</strong></p>
              <p style="margin: 0 0 20px 0; font-style: italic; color: #6c757d;">This analysis is based on publicly available data from federal contracting databases, official government websites, and regulatory documentation. All statistics and figures are current as of the publication date and are subject to change based on ongoing federal procurement activities.</p>
            </div>
          </div>
          
          <!-- Legal Footer -->
          <div style="margin-top: 50px; padding: 30px 0; border-top: 1px solid #e9ecef; text-align: center; font-size: 12px; color: #6c757d; line-height: 1.5;">
            <div style="margin-bottom: 20px;">
              <h4 style="color: #2D5BFF; font-size: 16px; margin: 0 0 10px 0; font-weight: 600;">Prop Shop AI</h4>
              <p style="margin: 0; font-size: 14px; color: #495057;">Procurement Intelligence Platform</p>
              <p style="margin: 5px 0 0 0;">www.prop-shop.ai | info@prop-shop.ai</p>
            </div>
            
            <div style="margin-bottom: 20px; font-size: 11px; line-height: 1.4;">
              <p style="margin: 0 0 10px 0;"><strong>Legal Disclaimer:</strong></p>
              <p style="margin: 0 0 10px 0;">This publication is for informational purposes only and does not constitute legal, financial, or professional advice. While we strive to provide accurate and up-to-date information, Prop Shop AI makes no representations or warranties of any kind, express or implied, about the completeness, accuracy, reliability, suitability, or availability of the information contained herein.</p>
              
              <p style="margin: 0 0 10px 0;"><strong>Copyright Notice:</strong></p>
              <p style="margin: 0 0 10px 0;">© ${new Date().getFullYear()} Make Ready Consulting, dba. Prop Shop AI. All rights reserved. This document may not be reproduced, distributed, or transmitted in any form or by any means without the prior written permission of Prop Shop AI, except for personal, non-commercial use.</p>
              
              <p style="margin: 0 0 10px 0;"><strong>Terms of Use:</strong></p>
              <p style="margin: 0;">By accessing and using this publication, you agree to be bound by our Terms of Service and Privacy Policy, available at www.prop-shop.ai/terms and www.prop-shop.ai/privacy respectively.</p>
            </div>
            
            <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #e9ecef;">
              <p style="margin: 0; font-size: 11px; color: #adb5bd;">Generated on ${currentDate} | Document ID: PS-${Date.now().toString().slice(-6)}</p>
            </div>
          </div>
        </div>
      `
      
      document.body.appendChild(tempElement)
      
      // Generate PDF using html2canvas and jsPDF
      const canvas = await html2canvas(tempElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false
      })
      
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      
      const imgWidth = 210
      const pageHeight = 295
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight
      
      let position = 0
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }
      
      // Clean up
      document.body.removeChild(tempElement)
      
      // Download the PDF with professional filename
      const fileName = publication.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 60)
      
      pdf.save(`PropShop-AI-${fileName}.pdf`)
      
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Error generating PDF. Please try again.')
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
                  onClick={() => router.push('/auth/login')}
                  className="btn btn-primary"
                >
                  Login
                </button>
                <button 
                  onClick={() => router.push('/auth/register')}
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
            <button 
              className="pdf-export-btn"
              onClick={() => handleExportPDF(publication)}
              title="Export to PDF"
            >
              📄 Export PDF
            </button>
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
