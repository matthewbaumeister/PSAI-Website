export interface Opportunity {
  id: string
  title: string
  externalId: string
  agency: string
  customer: string
  naics: string[]
  psc: string[]
  contractVehicle: string
  releaseDate: string
  dueDate: string
  estimatedValue: number | null
  value?: number | null // Alias for estimatedValue (for compatibility)
  status: 'Active' | 'Archived' | 'Draft' | 'Upcoming'
  summary: string
  tags: string[]
  sourceUrls: string[]
  internalNotes: string
  crmStage?: 'Inbox' | 'Qualified' | 'Pursuing' | 'Proposal' | 'Submitted' | 'Won' | 'Lost'
  
  // Source tracking (from hybrid schema)
  sources?: string[] // ['defense_gov', 'fpds', 'sam_gov']
  sourceCount?: number // Number of sources that contributed data
  primarySource?: string
  fieldSources?: Record<string, string> // Which source provided which field
  
  // Additional enrichment fields
  contractTypes?: string[]
  competitionType?: string
  isSmallBusiness?: boolean
  isSmallBusinessSetAside?: boolean
  setAsideType?: string
  isSBIR?: boolean
  isSTTR?: boolean
  isFMS?: boolean
  dataQualityScore?: number
  parsingConfidence?: number
  completenessScore?: number
  domainCategory?: string
  industryTags?: string[]
  technologyTags?: string[]
  serviceTags?: string[]
  keywords?: string[]
}

export type CrmStage = 'Inbox' | 'Qualified' | 'Pursuing' | 'Proposal' | 'Submitted' | 'Won' | 'Lost'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  opportunityIds?: string[]
  timestamp: Date
}

export interface SearchFilters {
  query: string
  agencies: string[]
  contractVehicles: string[]
  statuses: string[]
  naicsCodes?: string[]
  minValue?: number
  maxValue?: number
  dateRange: {
    start: string | null
    end: string | null
  }
}

