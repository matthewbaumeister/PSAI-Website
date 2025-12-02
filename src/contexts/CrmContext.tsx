'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Opportunity, CrmStage } from '@/types/opportunity'

interface CrmContextType {
  opportunities: Map<CrmStage, Opportunity[]>
  addOpportunity: (opportunity: Opportunity, stage: CrmStage) => void
  moveOpportunity: (opportunityId: string, fromStage: CrmStage, toStage: CrmStage) => void
  updateOpportunityNotes: (opportunityId: string, notes: string) => void
  getOpportunityById: (opportunityId: string) => Opportunity | undefined
  removeOpportunity: (opportunityId: string) => void
}

const CrmContext = createContext<CrmContextType | undefined>(undefined)

const STORAGE_KEY = 'propshop-crm-data'

const DEFAULT_STAGES: CrmStage[] = ['Inbox', 'Qualified', 'Pursuing', 'Proposal', 'Submitted', 'Won', 'Lost']

export function CrmProvider({ children }: { children: ReactNode }) {
  const [opportunities, setOpportunities] = useState<Map<CrmStage, Opportunity[]>>(() => {
    // Initialize with empty arrays for each stage
    const initialMap = new Map<CrmStage, Opportunity[]>()
    DEFAULT_STAGES.forEach(stage => {
      initialMap.set(stage, [])
    })
    return initialMap
  })

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const data = JSON.parse(stored)
        const loadedMap = new Map<CrmStage, Opportunity[]>()
        
        DEFAULT_STAGES.forEach(stage => {
          loadedMap.set(stage, data[stage] || [])
        })
        
        setOpportunities(loadedMap)
      }
    } catch (error) {
      console.error('Failed to load CRM data from localStorage:', error)
    }
  }, [])

  // Save to localStorage whenever opportunities change
  useEffect(() => {
    try {
      const data: Record<string, Opportunity[]> = {}
      DEFAULT_STAGES.forEach(stage => {
        data[stage] = opportunities.get(stage) || []
      })
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch (error) {
      console.error('Failed to save CRM data to localStorage:', error)
    }
  }, [opportunities])

  const addOpportunity = (opportunity: Opportunity, stage: CrmStage = 'Inbox') => {
    setOpportunities(prev => {
      const newMap = new Map(prev)
      const stageOpps = newMap.get(stage) || []
      
      // Check if opportunity already exists in any stage
      let alreadyExists = false
      DEFAULT_STAGES.forEach(s => {
        const opps = newMap.get(s) || []
        if (opps.some(o => o.id === opportunity.id)) {
          alreadyExists = true
        }
      })
      
      if (!alreadyExists) {
        newMap.set(stage, [...stageOpps, { ...opportunity, crmStage: stage }])
      }
      
      return newMap
    })
  }

  const moveOpportunity = (opportunityId: string, fromStage: CrmStage, toStage: CrmStage) => {
    setOpportunities(prev => {
      const newMap = new Map(prev)
      const fromOpps = newMap.get(fromStage) || []
      const toOpps = newMap.get(toStage) || []
      
      const oppIndex = fromOpps.findIndex(o => o.id === opportunityId)
      if (oppIndex === -1) return prev
      
      const opportunity = fromOpps[oppIndex]
      
      // Remove from source stage
      newMap.set(fromStage, fromOpps.filter((_, i) => i !== oppIndex))
      
      // Add to target stage
      newMap.set(toStage, [...toOpps, { ...opportunity, crmStage: toStage }])
      
      return newMap
    })
  }

  const updateOpportunityNotes = (opportunityId: string, notes: string) => {
    setOpportunities(prev => {
      const newMap = new Map(prev)
      
      DEFAULT_STAGES.forEach(stage => {
        const opps = newMap.get(stage) || []
        const oppIndex = opps.findIndex(o => o.id === opportunityId)
        
        if (oppIndex !== -1) {
          const updatedOpps = [...opps]
          updatedOpps[oppIndex] = { ...updatedOpps[oppIndex], internalNotes: notes }
          newMap.set(stage, updatedOpps)
        }
      })
      
      return newMap
    })
  }

  const getOpportunityById = (opportunityId: string): Opportunity | undefined => {
    for (const stage of DEFAULT_STAGES) {
      const opps = opportunities.get(stage) || []
      const found = opps.find(o => o.id === opportunityId)
      if (found) return found
    }
    return undefined
  }

  const removeOpportunity = (opportunityId: string) => {
    setOpportunities(prev => {
      const newMap = new Map(prev)
      
      DEFAULT_STAGES.forEach(stage => {
        const opps = newMap.get(stage) || []
        newMap.set(stage, opps.filter(o => o.id !== opportunityId))
      })
      
      return newMap
    })
  }

  return (
    <CrmContext.Provider
      value={{
        opportunities,
        addOpportunity,
        moveOpportunity,
        updateOpportunityNotes,
        getOpportunityById,
        removeOpportunity
      }}
    >
      {children}
    </CrmContext.Provider>
  )
}

export function useCrm() {
  const context = useContext(CrmContext)
  if (!context) {
    throw new Error('useCrm must be used within CrmProvider')
  }
  return context
}

