'use client'

import { useState, useMemo } from 'react'
import type { Metadata } from 'next'
import { publications, type Publication } from '@/data/publications'

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
      title: publication.title,
      text: publication.excerpt,
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
      const shareText = `${publication.title}\n\n${publication.excerpt}\n\nRead more: ${window.location.href}`
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

  // Check if we're in search mode
  const isSearchMode = searchTerm.trim() !== '' || selectedCategory !== 'All' || selectedTag !== 'All'

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

  // In search mode, show all publications as equal cards
  // In normal mode, separate featured and regular publications
  const featuredPublication = !isSearchMode ? publications.find(pub => pub.featured) : null
  const regularPublications = isSearchMode ? filteredPublications : filteredPublications.filter(pub => !pub.featured)
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
          <div className="search-section">
            <div className="search-bar">
              <input
                type="text"
                placeholder="Search publications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              <div className="search-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 21L16.514 16.506L21 21ZM19 10.5C19 15.194 15.194 19 10.5 19C5.806 19 2 15.194 2 10.5C2 5.806 5.806 2 10.5 2C15.194 2 19 5.806 19 10.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
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

        {/* Featured Publication Header */}
        {featuredPublication && !isSearchMode && (
          <div className="featured-section-header">
            <h2>Featured Article</h2>
            <p>Our latest research and insights</p>
          </div>
        )}

        {/* Featured Publication */}
        {featuredPublication && !isSearchMode && (
          <div className="featured-article">
            <div className="article-header">
              <div className="article-badge">{featuredPublication.category}</div>
              <h2>{featuredPublication.title}</h2>
              <div className="article-meta">
                <span className="author">By {featuredPublication.author}</span>
                <span className="date">{featuredPublication.date}</span>
                <span className="read-time">{featuredPublication.readTime}</span>
              </div>
              <p className="article-excerpt">
                {featuredPublication.excerpt}
              </p>
              <div className="article-tags">
                {featuredPublication.tags.slice(0, 5).map(tag => (
                  <span key={tag} className="tag">{tag}</span>
                ))}
              </div>
              <div className="featured-actions">
                <button 
                  className="read-more-btn"
                  onClick={() => handleReadMore(featuredPublication)}
                >
                  Read Full Article
                </button>
                <button 
                  className="share-btn"
                  onClick={() => handleShare(featuredPublication)}
                >
                  Share
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Publication Modal/Overlay */}
        {selectedPublication && (
          <div className="publication-modal">
            <div className="modal-overlay" onClick={closePublication}></div>
            <div className="modal-content">
              <div className="modal-header">
                <h2>{selectedPublication.title}</h2>
                <button className="close-btn" onClick={closePublication}>×</button>
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
          {!isSearchMode && <h2>All Publications</h2>}
          <div className={`publications-${viewMode}`}>
            {regularPublications.map(publication => (
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
          
          {regularPublications.length === 0 && (
            <div className="no-results">
              <h3>No publications found</h3>
              <p>Try adjusting your search criteria or filters</p>
            </div>
          )}
        </div>

        {/* Hide boilerplate content when searching */}
        {!isSearchMode && (
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
        )}

        {!isSearchMode && (
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
        )}

        {!isSearchMode && (
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
        )}

        {!isSearchMode && (
          <>
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
          </>
        )}
      </div>
    </main>
  )
}
