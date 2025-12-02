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
  status: 'Active' | 'Archived' | 'Draft' | 'Upcoming'
  summary: string
  tags: string[]
  sourceUrls: string[]
  internalNotes: string
  crmStage?: 'Inbox' | 'Qualified' | 'Pursuing' | 'Proposal' | 'Submitted' | 'Won' | 'Lost'
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
  dateRange: {
    start: string | null
    end: string | null
  }
}

