'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import type { Metadata } from 'next'
import { publications, type Publication } from '@/data/publications'
import { useAuth } from '@/contexts/AuthContext'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export default function PublicationsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedTag, setSelectedTag] = useState('All')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'readTime'>('date')

  // Button handlers

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
                    onClick={() => {
                      if (!user) {
                        localStorage.setItem('redirectAfterLogin', `/publications/${publication.slug}`)
                        router.push('/auth/login')
                      } else {
                        router.push(`/publications/${publication.slug}`)
                      }
                    }}
                  >
                    Read More
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
              <button 
                className="btn btn-outline"
                onClick={() => {
                  if (!user) {
                    // Store the intended destination in localStorage
                    localStorage.setItem('redirectAfterLogin', '/settings')
                    router.push('/auth/login')
                  } else {
                    router.push('/settings')
                  }
                }}
              >
                Subscribe Now
              </button>
            </div>
            <div className="info-card">
              <h4>Research Alerts</h4>
              <p>Receive notifications when new research reports, market analysis, and industry insights are published.</p>
              <button 
                className="btn btn-outline"
                onClick={() => {
                  if (!user) {
                    // Store the intended destination in localStorage
                    localStorage.setItem('redirectAfterLogin', '/settings')
                    router.push('/auth/login')
                  } else {
                    router.push('/settings')
                  }
                }}
              >
                Set Up Alerts
              </button>
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
