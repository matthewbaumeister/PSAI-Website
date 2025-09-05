// Publications data structure and content
export interface Publication {
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
  slug: string
  publishedAt: Date
  updatedAt?: Date
}

// This is where you would store your publications data
// For now, we'll keep it simple, but this can be expanded to:
// - Load from a CMS (Contentful, Strapi, etc.)
// - Load from a database
// - Load from markdown files
// - Load from an API

export const publications: Publication[] = [
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
    content: `
      <h2>Executive Summary</h2>
      <p>This comprehensive guide provides a step-by-step roadmap for small businesses with no government contracting experience to successfully pursue and win federal contracts. The guide covers everything from initial business formation to contract award, including critical compliance requirements, registration processes, and strategic positioning.</p>
      
      <h2>Table of Contents</h2>
      <ul>
        <li>Business Formation & Legal Structure</li>
        <li>Federal Registration Requirements</li>
        <li>Small Business Set-Aside Programs</li>
        <li>Contracting Opportunities & Platforms</li>
        <li>Proposal Development & Submission</li>
        <li>Compliance & Ongoing Requirements</li>
        <li>Success Strategies & Best Practices</li>
      </ul>

      <h2>1. Business Formation & Legal Structure</h2>
      <p>Before pursuing federal contracts, ensure your business is properly structured and legally compliant:</p>
      
      <h3>1.1 Business Entity Selection</h3>
      <p><strong>Recommended Structures:</strong></p>
      <ul>
        <li><strong>LLC (Limited Liability Company):</strong> Flexible, pass-through taxation, limited liability protection</li>
        <li><strong>S-Corporation:</strong> Pass-through taxation, limited liability, potential tax benefits</li>
        <li><strong>C-Corporation:</strong> Unlimited growth potential, easier to raise capital, but double taxation</li>
      </ul>

      <h3>1.2 State Registration</h3>
      <p>Register your business in your state of operation and any states where you plan to do business. Most states require:</p>
      <ul>
        <li>Articles of Incorporation/Organization</li>
        <li>Business license</li>
        <li>Tax identification number</li>
        <li>Registered agent designation</li>
      </ul>

      <h2>2. Federal Registration Requirements</h2>
      <p>Federal contractors must complete several mandatory registrations:</p>

      <h3>2.1 SAM.gov Registration</h3>
      <p><strong>System for Award Management (SAM)</strong> is the primary database for federal contractors:</p>
      <ul>
        <li>Free registration required for all federal contractors</li>
        <li>Must be renewed annually</li>
        <li>Provides unique entity identifier (UEI)</li>
        <li>Enables access to federal contracting opportunities</li>
      </ul>

      <h3>2.2 CAGE Code</h3>
      <p><strong>Commercial and Government Entity (CAGE) Code</strong> is a unique identifier:</p>
      <ul>
        <li>Automatically assigned during SAM registration</li>
        <li>Required for all federal contracts</li>
        <li>Used for security clearances and facility access</li>
      </ul>

      <h3>2.3 DUNS Number (Legacy)</h3>
      <p>While DUNS numbers are being phased out, some systems may still require them. The UEI now serves as the primary identifier.</p>

      <h2>3. Small Business Set-Aside Programs</h2>
      <p>Small businesses can qualify for various set-aside programs that provide competitive advantages:</p>

      <h3>3.1 8(a) Business Development Program</h3>
      <p><strong>Eligibility Requirements:</strong></p>
      <ul>
        <li>At least 51% owned by socially and economically disadvantaged individuals</li>
        <li>Net worth under $750,000 (excluding primary residence and business equity)</li>
        <li>Average annual gross receipts under $4.5 million over 3 years</li>
        <li>U.S. citizen ownership</li>
      </ul>
      <p><strong>Benefits:</strong></p>
      <ul>
        <li>Set-aside contracts up to $4.5 million</li>
        <li>Mentor-protégé relationships</li>
        <li>Business development assistance</li>
        <li>9-year program participation</li>
      </ul>

      <h3>3.2 HUBZone Program</h3>
      <p><strong>Historically Underutilized Business Zone (HUBZone)</strong> program:</p>
      <ul>
        <li>Business must be located in a HUBZone</li>
        <li>At least 35% of employees must live in HUBZone</li>
        <li>Set-aside contracts up to $4.5 million</li>
        <li>Price evaluation preference in full and open competitions</li>
      </ul>

      <h3>3.3 Women-Owned Small Business (WOSB)</h3>
      <p><strong>Eligibility Requirements:</strong></p>
      <ul>
        <li>At least 51% owned by women</li>
        <li>Women must manage day-to-day operations</li>
        <li>Must be certified by SBA or approved third party</li>
      </ul>

      <h3>3.4 Veteran-Owned Small Business (VOSB)</h3>
      <p><strong>Eligibility Requirements:</strong></p>
      <ul>
        <li>At least 51% owned by veterans</li>
        <li>Veterans must control management and daily operations</li>
        <li>Must be verified by VA</li>
      </ul>

      <h2>4. Contracting Opportunities & Platforms</h2>
      <p>Several platforms provide access to federal contracting opportunities:</p>

      <h3>4.1 SAM.gov</h3>
      <p>Primary platform for federal contracting:</p>
      <ul>
        <li>Contract opportunities search</li>
        <li>Contractor performance information</li>
        <li>Wage determination data</li>
        <li>Entity management</li>
      </ul>

      <h3>4.2 GSA Schedule (Multiple Award Schedule)</h3>
      <p><strong>General Services Administration Schedule:</strong></p>
      <ul>
        <li>Pre-negotiated contracts for commercial products and services</li>
        <li>Streamlined procurement process</li>
        <li>Access to government-wide contracts</li>
        <li>Competitive pricing and terms</li>
      </ul>

      <h3>4.3 GSA eBuy</h3>
      <p>Electronic marketplace for GSA Schedule holders to receive quotes and proposals.</p>

      <h2>5. Proposal Development & Submission</h2>
      <p>Winning federal contracts requires strategic proposal development:</p>

      <h3>5.1 Proposal Components</h3>
      <ul>
        <li><strong>Technical Proposal:</strong> Demonstrates understanding and approach</li>
        <li><strong>Past Performance:</strong> Relevant experience and references</li>
        <li><strong>Cost Proposal:</strong> Competitive pricing and cost breakdown</li>
        <li><strong>Management Approach:</strong> Project management and team structure</li>
      </ul>

      <h3>5.2 Key Success Factors</h3>
      <ul>
        <li>Thoroughly read and understand the solicitation</li>
        <li>Address all evaluation criteria</li>
        <li>Provide clear, concise responses</li>
        <li>Include relevant past performance</li>
        <li>Ensure compliance with all requirements</li>
      </ul>

      <h2>6. Compliance & Ongoing Requirements</h2>
      <p>Federal contractors must maintain ongoing compliance:</p>

      <h3>6.1 Annual Requirements</h3>
      <ul>
        <li>SAM.gov registration renewal</li>
        <li>Financial statements submission</li>
        <li>Compliance certifications</li>
        <li>Performance evaluations</li>
      </ul>

      <h3>6.2 Reporting Obligations</h3>
      <ul>
        <li>Subcontracting reports</li>
        <li>Labor reporting (if applicable)</li>
        <li>Security clearance maintenance</li>
        <li>Insurance requirements</li>
      </ul>

      <h2>7. Success Strategies & Best Practices</h2>
      <p>Maximize your chances of success in federal contracting:</p>

      <h3>7.1 Market Research</h3>
      <ul>
        <li>Identify target agencies and programs</li>
        <li>Analyze past contract awards</li>
        <li>Understand agency needs and priorities</li>
        <li>Track upcoming opportunities</li>
      </ul>

      <h3>7.2 Relationship Building</h3>
      <ul>
        <li>Attend industry events and conferences</li>
        <li>Network with agency personnel</li>
        <li>Join relevant trade associations</li>
        <li>Participate in industry working groups</li>
      </ul>

      <h3>7.3 Continuous Improvement</h3>
      <ul>
        <li>Learn from past proposals</li>
        <li>Seek feedback from contracting officers</li>
        <li>Invest in team training and development</li>
        <li>Stay updated on regulatory changes</li>
      </ul>

      <h2>Conclusion</h2>
      <p>Successfully pursuing federal contracts requires careful planning, compliance with regulations, and strategic execution. By following this comprehensive guide, small businesses can position themselves for success in the federal marketplace. Remember that persistence, continuous learning, and relationship building are key to long-term success in government contracting.</p>

      <h2>Additional Resources</h2>
      <ul>
        <li><a href="https://www.sam.gov" target="_blank">SAM.gov</a> - System for Award Management</li>
        <li><a href="https://www.sba.gov" target="_blank">SBA.gov</a> - Small Business Administration</li>
        <li><a href="https://www.gsa.gov" target="_blank">GSA.gov</a> - General Services Administration</li>
        <li><a href="https://www.fbo.gov" target="_blank">FBO.gov</a> - Federal Business Opportunities</li>
      </ul>
    `,
    slug: 'complete-guide-small-business-federal-contracting-2024-2025',
    publishedAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01')
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
    content: `
      <h2>Executive Summary</h2>
      <p>The U.S. Air Force and Space Force have announced a historic extension of the STRATFI/TACFI bridge funding deadline to October 2025, providing unprecedented opportunities for small defense contractors to access critical funding for technology development and commercialization.</p>

      <h2>Key Announcements</h2>
      <ul>
        <li><strong>Extended Deadline:</strong> October 2025 (previously March 2025)</li>
        <li><strong>Funding Levels:</strong> $60 million available across both programs</li>
        <li><strong>Eligibility:</strong> Small businesses with Phase II SBIR/STTR awards</li>
        <li><strong>Focus Areas:</strong> Critical defense technologies and dual-use applications</li>
      </ul>

      <h2>STRATFI Program Details</h2>
      <p><strong>Strategic Technology Funding Initiative (STRATFI)</strong> provides bridge funding for:</p>
      <ul>
        <li>Technology maturation and demonstration</li>
        <li>Commercialization pathway development</li>
        <li>Market validation and customer engagement</li>
        <li>Intellectual property protection and licensing</li>
      </ul>

      <h3>STRATFI Funding Tiers</h3>
      <ul>
        <li><strong>Tier 1:</strong> Up to $1.5 million for 18 months</li>
        <li><strong>Tier 2:</strong> Up to $3 million for 24 months</li>
        <li><strong>Tier 3:</strong> Up to $5 million for 36 months</li>
      </ul>

      <h2>TACFI Program Details</h2>
      <p><strong>Tactical Technology Funding Initiative (TACFI)</strong> focuses on:</p>
      <ul>
        <li>Rapid prototyping and testing</li>
        <li>Field demonstration and validation</li>
        <li>Operational integration planning</li>
        <li>Transition to production contracts</li>
      </ul>

      <h3>TACFI Funding Tiers</h3>
      <ul>
        <li><strong>Tier 1:</strong> Up to $1 million for 12 months</li>
        <li><strong>Tier 2:</strong> Up to $2 million for 18 months</li>
        <li><strong>Tier 3:</strong> Up to $3 million for 24 months</li>
      </ul>

      <h2>Eligibility Requirements</h2>
      <p>To qualify for STRATFI/TACFI funding, companies must:</p>
      <ul>
        <li>Have completed Phase II SBIR/STTR awards</li>
        <li>Demonstrate technology readiness level (TRL) 6-7</li>
        <li>Show clear commercialization pathway</li>
        <li>Have strong intellectual property position</li>
        <li>Demonstrate market demand and customer interest</li>
      </ul>

      <h2>Application Process</h2>
      <p>The application process includes:</p>
      <ul>
        <li><strong>Pre-application:</strong> Submit concept paper and technology summary</li>
        <li><strong>Full Application:</strong> Detailed technical and business proposal</li>
        <li><strong>Review Process:</strong> Technical and business evaluation</li>
        <li><strong>Award Decision:</strong> Notification within 90 days</li>
      </ul>

      <h2>Success Strategies</h2>
      <p>To maximize chances of success:</p>
      <ul>
        <li><strong>Early Engagement:</strong> Start application process immediately</li>
        <li><strong>Strong Partnerships:</strong> Collaborate with industry and academic partners</li>
        <li><strong>Clear Value Proposition:</strong> Demonstrate clear defense and commercial value</li>
        <li><strong>Market Validation:</strong> Show customer interest and market demand</li>
        <li><strong>Technical Excellence:</strong> Demonstrate advanced technology readiness</li>
      </ul>

      <h2>Impact on Defense Innovation</h2>
      <p>This extension represents a significant commitment to:</p>
      <ul>
        <li>Closing the "valley of death" for defense technologies</li>
        <li>Accelerating technology transition to operational use</li>
        <li>Supporting small business innovation and growth</li>
        <li>Maintaining technological superiority in critical areas</li>
      </ul>

      <h2>Next Steps for Applicants</h2>
      <p>Companies interested in applying should:</p>
      <ul>
        <li>Review program guidelines and requirements</li>
        <li>Prepare technology and business summaries</li>
        <li>Identify potential partners and customers</li>
        <li>Begin application process immediately</li>
        <li>Engage with AFWERX and SpaceWERX teams</li>
      </ul>

      <h2>Conclusion</h2>
      <p>The STRATFI/TACFI deadline extension provides a unique opportunity for small defense contractors to access critical funding and accelerate their technology development. With $60 million available and extended timelines, this represents an unprecedented commitment to supporting defense innovation and small business growth.</p>

      <h2>Additional Resources</h2>
      <ul>
        <li><a href="https://www.afwerx.af.mil" target="_blank">AFWERX</a> - Air Force innovation hub</li>
        <li><a href="https://www.spacewerx.us" target="_blank">SpaceWERX</a> - Space Force innovation hub</li>
        <li><a href="https://www.sbir.gov" target="_blank">SBIR.gov</a> - Small Business Innovation Research</li>
        <li><a href="https://www.defense.gov" target="_blank">Defense.gov</a> - Department of Defense</li>
      </ul>
    `,
    slug: 'air-force-space-force-stratfi-tacfi-bridge-funding-deadline-october-2025',
    publishedAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01')
  }
]

// Helper functions for scalability
export const getPublicationBySlug = (slug: string): Publication | undefined => {
  return publications.find(pub => pub.slug === slug)
}

export const getPublicationsByCategory = (category: string): Publication[] => {
  return publications.filter(pub => pub.category === category)
}

export const getFeaturedPublications = (): Publication[] => {
  return publications.filter(pub => pub.featured)
}

export const getRecentPublications = (limit: number = 5): Publication[] => {
  return publications
    .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
    .slice(0, limit)
}

export const searchPublications = (query: string): Publication[] => {
  const lowercaseQuery = query.toLowerCase()
  return publications.filter(pub => 
    pub.title.toLowerCase().includes(lowercaseQuery) ||
    pub.excerpt.toLowerCase().includes(lowercaseQuery) ||
    pub.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
  )
}

// For future scalability, you could add:
// - Database integration
// - CMS integration
// - API endpoints
// - Caching
// - Pagination
// - Full-text search
// - Content management
