// Client-side API helpers for fetching opportunities

import { Opportunity, SearchFilters } from '@/types/opportunity'

interface OpportunitiesResponse {
  opportunities: Opportunity[]
  total: number
  limit: number
  offset: number
}

interface StatsResponse {
  agencies: string[]
  statuses: string[]
  vehicles: string[]
  totalOpportunities: number
  valueRange: {
    min: number
    max: number
  }
}

/**
 * Fetch opportunities from the API
 */
export async function fetchOpportunities(filters: SearchFilters, offset = 0, limit = 50): Promise<OpportunitiesResponse> {
  try {
    const params = new URLSearchParams()
    
    if (filters.query) params.set('q', filters.query)
    if (filters.agencies && filters.agencies.length > 0) {
      params.set('agencies', filters.agencies.join(','))
    }
    if (filters.statuses && filters.statuses.length > 0) {
      params.set('statuses', filters.statuses.join(','))
    }
    if (filters.minValue !== undefined) {
      params.set('minValue', filters.minValue.toString())
    }
    if (filters.maxValue !== undefined) {
      params.set('maxValue', filters.maxValue.toString())
    }
    
    params.set('limit', limit.toString())
    params.set('offset', offset.toString())
    
    const response = await fetch(`/api/opportunities?${params.toString()}`)
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error fetching opportunities:', error)
    // Return empty result on error
    return {
      opportunities: [],
      total: 0,
      limit,
      offset
    }
  }
}

/**
 * Fetch stats for filters (agencies, statuses, etc.)
 */
export async function fetchStats(): Promise<StatsResponse> {
  try {
    const response = await fetch('/api/opportunities/stats')
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error fetching stats:', error)
    return {
      agencies: [],
      statuses: [],
      vehicles: [],
      totalOpportunities: 0,
      valueRange: { min: 0, max: 100000000 }
    }
  }
}

/**
 * Check if we have data in the database
 */
export async function checkDataAvailability(): Promise<boolean> {
  try {
    const stats = await fetchStats()
    return stats.totalOpportunities > 0
  } catch {
    return false
  }
}

