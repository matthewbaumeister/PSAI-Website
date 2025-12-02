'use client'

import { useState } from 'react'
import { Opportunity, CrmStage } from '@/types/opportunity'
import { useCrm } from '@/contexts/CrmContext'
import { OpportunityDetailPanel } from '@/components/OpportunityDetailPanel'

const STAGES: CrmStage[] = ['Inbox', 'Qualified', 'Pursuing', 'Proposal', 'Submitted', 'Won', 'Lost']

export default function CrmPage() {
  const { opportunities, moveOpportunity } = useCrm()
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null)
  const [draggedItem, setDraggedItem] = useState<{ opp: Opportunity; fromStage: CrmStage } | null>(null)

  const handleDragStart = (opp: Opportunity, stage: CrmStage) => {
    setDraggedItem({ opp, fromStage: stage })
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (toStage: CrmStage) => {
    if (draggedItem && draggedItem.fromStage !== toStage) {
      moveOpportunity(draggedItem.opp.id, draggedItem.fromStage, toStage)
    }
    setDraggedItem(null)
  }

  const handleCardClick = (opp: Opportunity) => {
    setSelectedOpportunity(opp)
  }

  const formatCurrency = (value: number | null) => {
    if (!value) return 'N/A'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      notation: 'compact'
    }).format(value)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div style={{
      height: 'calc(100vh - 73px)',
      display: 'flex',
      overflow: 'hidden'
    }}>
      {/* Kanban Board */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '1.5rem',
        background: '#0B1220'
      }}>
        <div style={{
          display: 'flex',
          gap: '1rem',
          height: '100%',
          minWidth: 'min-content'
        }}>
          {STAGES.map(stage => {
            const stageOpps = opportunities.get(stage) || []
            
            return (
              <div
                key={stage}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(stage)}
                style={{
                  minWidth: '300px',
                  width: '300px',
                  display: 'flex',
                  flexDirection: 'column',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  padding: '1rem',
                  maxHeight: '100%'
                }}
              >
                {/* Column Header */}
                <div style={{
                  marginBottom: '1rem',
                  paddingBottom: '0.75rem',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <h3 style={{
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#ffffff',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '0.25rem'
                  }}>
                    {stage}
                  </h3>
                  <div style={{
                    fontSize: '0.75rem',
                    color: 'rgba(255, 255, 255, 0.5)'
                  }}>
                    {stageOpps.length} {stageOpps.length === 1 ? 'opportunity' : 'opportunities'}
                  </div>
                </div>

                {/* Cards */}
                <div style={{
                  flex: 1,
                  overflow: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}>
                  {stageOpps.length === 0 ? (
                    <div style={{
                      padding: '2rem 1rem',
                      textAlign: 'center',
                      color: 'rgba(255, 255, 255, 0.3)',
                      fontSize: '0.875rem'
                    }}>
                      No opportunities
                    </div>
                  ) : (
                    stageOpps.map(opp => (
                      <div
                        key={opp.id}
                        draggable
                        onDragStart={() => handleDragStart(opp, stage)}
                        onClick={() => handleCardClick(opp)}
                        style={{
                          padding: '1rem',
                          borderRadius: '8px',
                          background: selectedOpportunity?.id === opp.id
                            ? 'rgba(45, 91, 255, 0.15)'
                            : 'rgba(255, 255, 255, 0.05)',
                          border: selectedOpportunity?.id === opp.id
                            ? '1px solid rgba(45, 91, 255, 0.4)'
                            : '1px solid rgba(255, 255, 255, 0.1)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          if (selectedOpportunity?.id !== opp.id) {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (selectedOpportunity?.id !== opp.id) {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                          }
                        }}
                      >
                        {/* Title */}
                        <div style={{
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          color: '#ffffff',
                          marginBottom: '0.5rem',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          lineHeight: '1.4'
                        }}>
                          {opp.title}
                        </div>

                        {/* Agency / Customer */}
                        <div style={{
                          fontSize: '0.75rem',
                          color: 'rgba(255, 255, 255, 0.6)',
                          marginBottom: '0.25rem'
                        }}>
                          {opp.customer}
                        </div>

                        <div style={{
                          fontSize: '0.75rem',
                          color: 'rgba(255, 255, 255, 0.5)',
                          marginBottom: '0.75rem'
                        }}>
                          {opp.agency}
                        </div>

                        {/* Value and Due Date */}
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          paddingTop: '0.75rem',
                          borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                        }}>
                          <div style={{
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            color: '#9AF23A'
                          }}>
                            {formatCurrency(opp.estimatedValue)}
                          </div>
                          <div style={{
                            fontSize: '0.75rem',
                            color: 'rgba(255, 255, 255, 0.6)'
                          }}>
                            Due: {formatDate(opp.dueDate)}
                          </div>
                        </div>

                        {/* Status Badge */}
                        {opp.status && (
                          <div style={{ marginTop: '0.5rem' }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '0.125rem 0.5rem',
                              borderRadius: '4px',
                              fontSize: '0.625rem',
                              fontWeight: '600',
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                              background: opp.status === 'Active' ? 'rgba(154, 242, 58, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                              color: opp.status === 'Active' ? '#9AF23A' : 'rgba(255, 255, 255, 0.6)',
                              border: `1px solid ${opp.status === 'Active' ? 'rgba(154, 242, 58, 0.3)' : 'rgba(255, 255, 255, 0.15)'}`
                            }}>
                              {opp.status}
                            </span>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Detail Panel */}
      <div style={{
        width: '400px',
        borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
        overflow: 'hidden'
      }}>
        <OpportunityDetailPanel
          opportunity={selectedOpportunity}
          onClose={() => setSelectedOpportunity(null)}
        />
      </div>
    </div>
  )
}

