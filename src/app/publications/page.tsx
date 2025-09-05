'use client'

import { useState, useMemo } from 'react'
import type { Metadata } from 'next'

// Publication data structure
interface Publication {
  id: string
  title: string
  author: string
  date: string
  readTime: string
  excerpt: string
  tags: string[]
  category: string
  featured: boolean
  content: string
}

// Sample publications data
const publications: Publication[] = [
  {
    id: '1',
    title: 'Complete Guide to Small Business Federal Contracting: From Formation to Award 2024-2025',
    author: 'MB',
    date: 'January 2025',
    readTime: '25 min read',
    excerpt: 'Comprehensive roadmap for companies with no government contracting experience to pursue small business set-aside contracts across all federal agencies.',
    tags: ['Federal Contracting', 'Small Business', 'SAM.gov', 'CAGE Code', 'Set-Asides', '8(a)', 'HUBZone', 'WOSB', 'VOSB', 'GSA Schedule'],
    category: 'Research & Insights',
    featured: true,
    content: 'full-content-here'
  },
  {
    id: '2',
    title: 'Air Force and Space Force Extend Critical STRATFI/TACFI Bridge Funding Deadline to October 2025',
    author: 'MB',
    date: 'January 2025',
    readTime: '15 min read',
    excerpt: 'Historic funding levels and extended deadlines signal unprecedented commitment to closing the valley of death for small defense contractors.',
    tags: ['STRATFI', 'TACFI', 'SBIR', 'Defense Innovation', 'Government Contracting', 'AFWERX', 'SpaceWERX'],
    category: 'Funding Opportunities',
    featured: false,
    content: 'full-content-here'
  }
]

export default function PublicationsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedTag, setSelectedTag] = useState('All')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'readTime'>('date')

  // Get unique categories and tags
  const categories = ['All', ...Array.from(new Set(publications.map(pub => pub.category)))]
  const allTags = Array.from(new Set(publications.flatMap(pub => pub.tags)))
  const tags = ['All', ...allTags]

  // Filter and sort publications
  const filteredPublications = useMemo(() => {
    let filtered = publications.filter(pub => {
      const matchesSearch = pub.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
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

  const featuredPublication = publications.find(pub => pub.featured)
  const regularPublications = filteredPublications.filter(pub => !pub.featured)
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
              <div className="search-icon">🔍</div>
            </div>
          </div>
          
          <div className="filter-controls">
            <div className="filter-group">
              <label>Category:</label>
              <select 
                value={selectedCategory} 
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="filter-select"
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            
            <div className="filter-group">
              <label>Tag:</label>
              <select 
                value={selectedTag} 
                onChange={(e) => setSelectedTag(e.target.value)}
                className="filter-select"
              >
                {tags.map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
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
          <p>Showing {filteredPublications.length} of {publications.length} publications</p>
          {(searchTerm || selectedCategory !== 'All' || selectedTag !== 'All') && (
            <button 
              className="clear-filters"
              onClick={() => {
                setSearchTerm('')
                setSelectedCategory('All')
                setSelectedTag('All')
              }}
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Featured Publication */}
        {featuredPublication && (
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
            </div>
          </div>
        )}

        {/* Publications Grid/List */}
        <div className="publications-section">
          <h2>All Publications</h2>
          <div className={`publications-${viewMode}`}>
            {regularPublications.map(publication => (
              <div key={publication.id} className="publication-card">
                <div className="publication-header">
                  <div className="publication-category">{publication.category}</div>
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
                  <button className="read-more-btn">Read More</button>
                  <button className="share-btn">Share</button>
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
