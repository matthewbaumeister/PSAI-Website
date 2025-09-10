'use client'

import { useState, useMemo } from 'react'
import type { Metadata } from 'next'
import { publications, type Publication } from '@/data/publications'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export default function PublicationsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedTag, setSelectedTag] = useState('All')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'readTime'>('date')
  const [selectedPublication, setSelectedPublication] = useState<Publication | null>(null)

  // Button handlers
  const handleReadMore = (publication: Publication) => {
    setSelectedPublication(publication)
    // Scroll to top of page
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleShare = async (publication: Publication) => {
    const shareData = {
      title: `${publication.title} - Prop Shop AI`,
      text: `${publication.excerpt}\n\nFrom Prop Shop AI - Procurement Intelligence Platform`,
      url: window.location.href
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch (err) {
        console.log('Error sharing:', err)
      }
    } else {
      // Fallback: copy to clipboard
      const shareText = `${publication.title} - Prop Shop AI\n\n${publication.excerpt}\n\nRead more: ${window.location.href}\n\nFrom Prop Shop AI - Procurement Intelligence Platform`
      try {
        await navigator.clipboard.writeText(shareText)
        alert('Publication link copied to clipboard!')
      } catch (err) {
        console.log('Error copying to clipboard:', err)
      }
    }
  }

  const closePublication = () => {
    setSelectedPublication(null)
  }

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

  // Get available categories and tags based on current filters (cascading)
  const availableCategories = useMemo(() => {
    let filtered = publications
    
    // Apply search filter first
    if (searchTerm.trim() !== '') {
      filtered = filtered.filter(pub => 
        pub.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pub.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pub.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }
    
    // Apply tag filter if selected
    if (selectedTag !== 'All') {
      filtered = filtered.filter(pub => pub.tags.includes(selectedTag))
    }
    
    return ['All', ...Array.from(new Set(filtered.map(pub => pub.category)))]
  }, [searchTerm, selectedTag])

  const availableTags = useMemo(() => {
    let filtered = publications
    
    // Apply search filter first
    if (searchTerm.trim() !== '') {
      filtered = filtered.filter(pub => 
        pub.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pub.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pub.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }
    
    // Apply category filter if selected
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(pub => pub.category === selectedCategory)
    }
    
    return ['All', ...Array.from(new Set(filtered.flatMap(pub => pub.tags)))]
  }, [searchTerm, selectedCategory])

  // Filter and sort publications
  const filteredPublications = useMemo(() => {
    let filtered = publications.filter(pub => {
      const matchesSearch = searchTerm.trim() === '' || 
        pub.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pub.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pub.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      
      const matchesCategory = selectedCategory === 'All' || pub.category === selectedCategory
      const matchesTag = selectedTag === 'All' || pub.tags.includes(selectedTag)
      
      return matchesSearch && matchesCategory && matchesTag
    })

    // Sort publications
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title)
        case 'readTime':
          return parseInt(a.readTime) - parseInt(b.readTime)
        case 'date':
        default:
          return new Date(b.date).getTime() - new Date(a.date).getTime()
      }
    })

    return filtered
  }, [searchTerm, selectedCategory, selectedTag, sortBy])
  return (
    <main className="publications-page">
      <div className="container">
        <div className="page-header">
          <div className="badge">Research & Insights</div>
          <h1>Publications</h1>
          <p className="subtitle">
            Stay ahead of the curve with our latest research, market insights, and industry analysis. 
            From government contracting trends to procurement best practices, we share knowledge that drives success.
          </p>
        </div>

        {/* Search and Filter Controls */}
        <div className="publications-controls">
          <div className="search-section-full">
            <input
              type="text"
              placeholder="Search publications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input-full"
            />
          </div>
          
          <div className="filter-controls">
            <div className="filter-group">
              <label>Category:</label>
              <select 
                value={selectedCategory} 
                onChange={(e) => {
                  setSelectedCategory(e.target.value)
                  // Reset tag filter if current tag is not available in new category
                  if (e.target.value !== 'All' && !availableTags.includes(selectedTag)) {
                    setSelectedTag('All')
                  }
                }}
                className="filter-select"
              >
                {availableCategories.map(category => (
                  <option key={category} value={category}>
                    {category} {category !== 'All' && `(${publications.filter(pub => pub.category === category).length})`}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="filter-group">
              <label>Tag:</label>
              <select 
                value={selectedTag} 
                onChange={(e) => {
                  setSelectedTag(e.target.value)
                  // Reset category filter if current category is not available with new tag
                  if (e.target.value !== 'All' && !availableCategories.includes(selectedCategory)) {
                    setSelectedCategory('All')
                  }
                }}
                className="filter-select"
              >
                {availableTags.map(tag => (
                  <option key={tag} value={tag}>
                    {tag} {tag !== 'All' && `(${publications.filter(pub => pub.tags.includes(tag)).length})`}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="filter-group">
              <label>Sort by:</label>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value as 'date' | 'title' | 'readTime')}
                className="filter-select"
              >
                <option value="date">Date</option>
                <option value="title">Title</option>
                <option value="readTime">Read Time</option>
              </select>
            </div>
            
            <div className="view-controls">
              <button 
                className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
              >
                ⊞
              </button>
              <button 
                className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
              >
                ☰
              </button>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="results-summary">
          <div className="results-info">
            <p>Showing {filteredPublications.length} of {publications.length} publications</p>
            {(searchTerm || selectedCategory !== 'All' || selectedTag !== 'All') && (
              <div className="active-filters">
                {searchTerm && <span className="filter-tag">Search: "{searchTerm}"</span>}
                {selectedCategory !== 'All' && <span className="filter-tag">Category: {selectedCategory}</span>}
                {selectedTag !== 'All' && <span className="filter-tag">Tag: {selectedTag}</span>}
              </div>
            )}
          </div>
          {(searchTerm || selectedCategory !== 'All' || selectedTag !== 'All') && (
            <button 
              className="clear-filters"
              onClick={() => {
                setSearchTerm('')
                setSelectedCategory('All')
                setSelectedTag('All')
              }}
            >
              Clear All Filters
            </button>
          )}
        </div>

        {/* Publication Modal/Overlay */}
        {selectedPublication && (
          <div className="publication-modal">
            <div className="modal-overlay" onClick={closePublication}></div>
            <div className="modal-content">
              <div className="modal-header">
                <h2>{selectedPublication.title}</h2>
                <div className="modal-header-actions">
                  <button 
                    className="pdf-export-btn"
                    onClick={() => handleExportPDF(selectedPublication)}
                    title="Export to PDF"
                  >
                    📄 Export PDF
                  </button>
                  <button className="close-btn" onClick={closePublication}>×</button>
                </div>
              </div>
              <div className="modal-body">
                <div className="modal-meta">
                  <span className="author">By {selectedPublication.author}</span>
                  <span className="date">{selectedPublication.date}</span>
                  <span className="read-time">{selectedPublication.readTime}</span>
                </div>
                <div className="modal-tags">
                  {selectedPublication.tags.map(tag => (
                    <span key={tag} className="tag">{tag}</span>
                  ))}
                </div>
                <div 
                  className="modal-content-body"
                  dangerouslySetInnerHTML={{ __html: selectedPublication.content }}
                />
                <div className="modal-actions">
                  <button 
                    className="share-btn"
                    onClick={() => handleShare(selectedPublication)}
                  >
                    Share This Article
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Publications Grid/List */}
        <div className="publications-section">
          <h2>All Publications</h2>
          <div className={`publications-${viewMode}`}>
            {filteredPublications.map(publication => (
              <div key={publication.id} className="publication-card">
                <div className="publication-header">
                  <div className="publication-badges">
                    <div className="publication-category">{publication.category}</div>
                    {publication.featured && <div className="featured-badge">Featured</div>}
                  </div>
                  <div className="publication-meta">
                    <span className="author">By {publication.author}</span>
                    <span className="date">{publication.date}</span>
                    <span className="read-time">{publication.readTime}</span>
                  </div>
                </div>
                
                <h3 className="publication-title">{publication.title}</h3>
                <p className="publication-excerpt">{publication.excerpt}</p>
                
                <div className="publication-tags">
                  {publication.tags.slice(0, 4).map(tag => (
                    <span key={tag} className="tag">{tag}</span>
                  ))}
                  {publication.tags.length > 4 && (
                    <span className="tag-more">+{publication.tags.length - 4} more</span>
                  )}
                </div>
                
                <div className="publication-actions">
                  <button 
                    className="read-more-btn"
                    onClick={() => handleReadMore(publication)}
                  >
                    Read More
                  </button>
                  <button 
                    className="share-btn"
                    onClick={() => handleShare(publication)}
                  >
                    Share
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {filteredPublications.length === 0 && (
            <div className="no-results">
              <h3>No publications found</h3>
              <p>Try adjusting your search criteria or filters</p>
            </div>
          )}
        </div>

        <div className="hero-section">
          <div className="hero-content">
            <h2>Knowledge is Power in Government Contracting</h2>
            <p>
              Our team of experts continuously researches market trends, analyzes industry data, 
              and develops insights that help government contractors make informed decisions and 
              stay competitive in an ever-evolving marketplace.
            </p>
            <div className="hero-features">
              <div className="feature">
                <div className="feature-icon">📊</div>
                <h3>Market Research</h3>
                <p>Data-driven insights into government contracting trends and opportunities</p>
              </div>
              <div className="feature">
                <div className="feature-icon">📰</div>
                <h3>News & Updates</h3>
                <p>Latest developments in government contracting and procurement</p>
              </div>
              <div className="feature">
                <div className="feature-icon">🎯</div>
                <h3>Strategic Insights</h3>
                <p>Expert analysis and recommendations for contract success</p>
              </div>
            </div>
          </div>
        </div>

        <div className="content-section">
          <h2>Publication Categories</h2>
          <div className="publication-categories">
            <div className="category">
              <h4>Market Research Reports</h4>
              <p>Comprehensive analysis of government contracting markets, trends, and opportunities across different industries and agencies.</p>
            </div>
            <div className="category">
              <h4>Industry Insights</h4>
              <p>Deep dives into specific sectors including defense, healthcare, IT, infrastructure, and professional services.</p>
            </div>
            <div className="category">
              <h4>Best Practices</h4>
              <p>Proven strategies and methodologies for winning government contracts and maintaining compliance.</p>
            </div>
            <div className="category">
              <h4>Regulatory Updates</h4>
              <p>Latest changes in federal contracting regulations, policies, and compliance requirements.</p>
            </div>
            <div className="category">
              <h4>Case Studies</h4>
              <p>Real-world examples of successful government contracting strategies and implementations.</p>
            </div>
            <div className="category">
              <h4>Expert Commentary</h4>
              <p>Thought leadership and expert analysis from our team of government contracting specialists.</p>
            </div>
          </div>
        </div>

        <div className="content-section">
          <h2>Coming Soon</h2>
          <div className="coming-soon">
            <div className="coming-soon-item">
              <div className="coming-soon-badge">Q1 2025</div>
              <h3>2025 Government Contracting Market Outlook</h3>
              <p>Comprehensive analysis of emerging trends, opportunities, and challenges in government contracting for the coming year.</p>
              <div className="topics">
                <span className="topic">Market Trends</span>
                <span className="topic">Opportunity Analysis</span>
                <span className="topic">Risk Assessment</span>
              </div>
            </div>
            <div className="coming-soon-item">
              <div className="coming-soon-badge">Q1 2025</div>
              <h3>Small Business Set-Aside Opportunities Guide</h3>
              <p>In-depth guide to navigating SBIR, SBA programs, and set-aside opportunities for small business contractors.</p>
              <div className="topics">
                <span className="topic">SBIR Programs</span>
                <span className="topic">SBA Resources</span>
                <span className="topic">Set-Aside Strategies</span>
              </div>
            </div>
            <div className="coming-soon-item">
              <div className="coming-soon-badge">Q2 2025</div>
              <h3>DoD Contracting Intelligence Report</h3>
              <p>Strategic analysis of Department of Defense contracting trends, opportunities, and competitive landscape.</p>
              <div className="topics">
                <span className="topic">DoD Trends</span>
                <span className="topic">Competitive Intelligence</span>
                <span className="topic">Strategic Planning</span>
              </div>
            </div>
          </div>
        </div>

        <div className="content-section">
          <h2>Research Focus Areas</h2>
          <div className="research-areas">
            <div className="area">
              <h4>Federal Spending Analysis</h4>
              <p>Comprehensive analysis of federal spending patterns, budget trends, and procurement priorities across all agencies.</p>
            </div>
            <div className="area">
              <h4>Industry Sector Deep Dives</h4>
              <p>Detailed research into specific industries including technology, healthcare, defense, infrastructure, and professional services.</p>
            </div>
            <div className="area">
              <h4>Geographic Market Analysis</h4>
              <p>Regional analysis of government contracting opportunities and market dynamics across different geographic areas.</p>
            </div>
            <div className="area">
              <h4>Technology Trends</h4>
              <p>Research into emerging technologies and their impact on government contracting and procurement processes.</p>
            </div>
            <div className="area">
              <h4>Compliance & Regulations</h4>
              <p>Analysis of regulatory changes and compliance requirements affecting government contractors.</p>
            </div>
            <div className="area">
              <h4>Competitive Intelligence</h4>
              <p>Research into competitor strategies, market positioning, and competitive landscape analysis.</p>
            </div>
          </div>
        </div>

        <div className="content-section">
          <h2>Stay Informed</h2>
          <div className="stay-informed">
            <div className="info-card">
              <h4>Newsletter Subscription</h4>
              <p>Get our latest research and insights delivered directly to your inbox. Stay updated on market trends, regulatory changes, and strategic opportunities.</p>
              <a href="/contact" className="btn btn-outline">Subscribe Now</a>
            </div>
            <div className="info-card">
              <h4>Research Alerts</h4>
              <p>Receive notifications when new research reports, market analysis, and industry insights are published.</p>
              <a href="/contact" className="btn btn-outline">Set Up Alerts</a>
            </div>
            <div className="info-card">
              <h4>Custom Research</h4>
              <p>Need specific research or analysis for your business? Our team can conduct custom research tailored to your needs.</p>
              <a href="/contact" className="btn btn-outline">Request Research</a>
            </div>
          </div>
        </div>

        <div className="content-section">
          <h2>Our Research Team</h2>
          <div className="research-team">
            <div className="team-member">
              <h4>Market Analysts</h4>
              <p>Expert analysts specializing in government contracting markets, trends, and opportunity identification.</p>
            </div>
            <div className="team-member">
              <h4>Industry Specialists</h4>
              <p>Subject matter experts with deep knowledge of specific industries and technical domains.</p>
            </div>
            <div className="team-member">
              <h4>Data Scientists</h4>
              <p>Advanced analytics professionals who transform raw data into actionable insights and intelligence.</p>
            </div>
            <div className="team-member">
              <h4>Government Contracting Experts</h4>
              <p>Professionals with extensive experience in federal contracting, compliance, and procurement processes.</p>
            </div>
          </div>
        </div>

        <div className="cta-section">
          <h2>Ready to Access Our Research?</h2>
          <p>
            Join government contractors who rely on our research and insights to make informed decisions 
            and stay ahead of the competition.
          </p>
          <div className="cta-buttons">
            <a href="/contact" className="btn btn-primary btn-lg">Get Started Today</a>
            <a href="/book-demo" className="btn btn-outline btn-lg">Book a Demo</a>
          </div>
        </div>
      </div>
    </main>
  )
}
