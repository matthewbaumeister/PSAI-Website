import { Opportunity, ChatMessage, SearchFilters } from '@/types/opportunity'
import { mockOpportunities } from './opportunities'

export function searchOpportunities(filters: SearchFilters): Opportunity[] {
  let results = [...mockOpportunities]

  // Filter by query (search in title, customer, agency)
  if (filters.query.trim()) {
    const query = filters.query.toLowerCase()
    results = results.filter(opp =>
      opp.title.toLowerCase().includes(query) ||
      opp.customer.toLowerCase().includes(query) ||
      opp.agency.toLowerCase().includes(query) ||
      opp.summary.toLowerCase().includes(query) ||
      opp.tags.some(tag => tag.toLowerCase().includes(query))
    )
  }

  // Filter by agencies
  if (filters.agencies.length > 0) {
    results = results.filter(opp =>
      filters.agencies.includes(opp.agency)
    )
  }

  // Filter by contract vehicles
  if (filters.contractVehicles.length > 0) {
    results = results.filter(opp =>
      filters.contractVehicles.includes(opp.contractVehicle)
    )
  }

  // Filter by statuses
  if (filters.statuses.length > 0) {
    results = results.filter(opp =>
      filters.statuses.includes(opp.status)
    )
  }

  // Filter by date range
  if (filters.dateRange.start) {
    results = results.filter(opp =>
      opp.releaseDate >= filters.dateRange.start!
    )
  }

  if (filters.dateRange.end) {
    results = results.filter(opp =>
      opp.dueDate <= filters.dateRange.end!
    )
  }

  return results
}

export function chatWithOpportunities(query: string): {
  message: ChatMessage
  relatedOpportunities: Opportunity[]
} {
  // Simple mock chat response
  const queryLower = query.toLowerCase()
  
  let responseText = ''
  let relatedOppIds: string[] = []

  // Match query patterns to generate contextual responses
  if (queryLower.includes('cloud') || queryLower.includes('infrastructure')) {
    responseText = 'I found several cloud and infrastructure modernization opportunities. The Army has a major cloud migration project (W912CG-25-R-0023) worth $12.5M, and there\'s also network modernization work at the Air Force. These opportunities require experience with DoD security frameworks and cloud-native architectures.'
    relatedOppIds = ['opp-001', 'opp-018']
  } else if (queryLower.includes('ai') || queryLower.includes('ml') || queryLower.includes('artificial intelligence')) {
    responseText = 'There are several AI/ML opportunities currently available. The most significant is a $45M DIA project for intelligence analysis support. There\'s also sensor fusion work through an SBIR Phase II program. Both require strong ML engineering and security clearances.'
    relatedOppIds = ['opp-002', 'opp-007']
  } else if (queryLower.includes('cyber') || queryLower.includes('security')) {
    responseText = 'I found multiple cybersecurity opportunities across DoD. The Air Force has a $28M CSOC support contract, the Army has a $35M zero trust implementation, and CISA has upcoming threat intelligence work. Most require experience with DoD cybersecurity frameworks and active clearances.'
    relatedOppIds = ['opp-003', 'opp-006', 'opp-016']
  } else if (queryLower.includes('software') || queryLower.includes('development') || queryLower.includes('agile')) {
    responseText = 'Several software development opportunities are available. The Navy has an $18.5M agile development contract for mission planning systems, and there\'s mobile app development work at USACE worth $6.8M. DevSecOps experience is highly valued across these opportunities.'
    relatedOppIds = ['opp-004', 'opp-017']
  } else if (queryLower.includes('data') || queryLower.includes('analytics')) {
    responseText = 'I found data and analytics opportunities at DLA and DFAS. The DLA logistics optimization platform is valued at $8.2M, and DFAS has RPA work for financial systems at $9.5M. Both emphasize automation and data-driven decision making.'
    relatedOppIds = ['opp-005', 'opp-012']
  } else if (queryLower.includes('space') || queryLower.includes('satellite')) {
    responseText = 'The Space Force has a major SATCOM modernization opportunity worth $67M. This includes ground systems, network operations, and cybersecurity for satellite communications infrastructure. It\'s one of the largest opportunities currently available.'
    relatedOppIds = ['opp-010']
  } else if (queryLower.includes('sbir') || queryLower.includes('research')) {
    responseText = 'There are several R&D opportunities including an SBIR Phase II for sensor fusion technology ($1.5M) and a DARPA quantum computing research program ($25M). DARPA work typically requires innovative technical approaches and strong research credentials.'
    relatedOppIds = ['opp-007', 'opp-009']
  } else if (queryLower.includes('navy') || queryLower.includes('naval')) {
    responseText = 'The Navy has multiple active opportunities including agile software development for mission planning ($18.5M), supply chain blockchain solutions ($11M), and unmanned systems command and control ($42M archived). SeaPort-NxG is a common vehicle for Navy work.'
    relatedOppIds = ['opp-004', 'opp-014', 'opp-013']
  } else if (queryLower.includes('army')) {
    responseText = 'The Army has numerous opportunities across cloud infrastructure, zero trust security, unmanned systems, and training simulations. Total value exceeds $100M across active opportunities. Most require experience with Army-specific security requirements and certification processes.'
    relatedOppIds = ['opp-001', 'opp-006', 'opp-013', 'opp-015']
  } else {
    // Default response
    responseText = `I found ${mockOpportunities.filter(o => o.status === 'Active').length} active opportunities in the database. The opportunities span cloud computing, AI/ML, cybersecurity, software development, and data analytics. Total estimated value exceeds $450M. Would you like me to filter by a specific agency, technology area, or contract vehicle?`
    relatedOppIds = ['opp-001', 'opp-002', 'opp-003']
  }

  const message: ChatMessage = {
    id: `msg-${Date.now()}`,
    role: 'assistant',
    content: responseText,
    opportunityIds: relatedOppIds,
    timestamp: new Date()
  }

  const relatedOpportunities = mockOpportunities.filter(opp =>
    relatedOppIds.includes(opp.id)
  )

  return {
    message,
    relatedOpportunities
  }
}

export function getOpportunityById(id: string): Opportunity | undefined {
  return mockOpportunities.find(opp => opp.id === id)
}

export function getAllAgencies(): string[] {
  return [...new Set(mockOpportunities.map(opp => opp.agency))].sort()
}

export function getAllContractVehicles(): string[] {
  return [...new Set(mockOpportunities.map(opp => opp.contractVehicle))].sort()
}

export function getAllStatuses(): string[] {
  return ['Active', 'Archived', 'Draft', 'Upcoming']
}

