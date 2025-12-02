'use client'

import { useState } from 'react'
import { Opportunity } from '@/types/opportunity'
import { useCrm } from '@/contexts/CrmContext'

interface OpportunityDetailPanelProps {
  opportunity: Opportunity | null
  onClose?: () => void
}

export function OpportunityDetailPanel({ opportunity, onClose }: OpportunityDetailPanelProps) {
  const { addOpportunity, updateOpportunityNotes, getOpportunityById } = useCrm()
  const [notes, setNotes] = useState(opportunity?.internalNotes || '')
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)

  if (!opportunity) {
    return (
      <div style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'rgba(255, 255, 255, 0.4)',
        fontSize: '0.95rem'
      }}>
        Select an opportunity to view details
      </div>
    )
  }

  const handleAddToCrm = () => {
    addOpportunity(opportunity, 'Inbox')
    setShowSuccessMessage(true)
    setTimeout(() => setShowSuccessMessage(false), 3000)
  }

  const handleSaveNotes = () => {
    updateOpportunityNotes(opportunity.id, notes)
    const updated = getOpportunityById(opportunity.id)
    if (updated) {
      setShowSuccessMessage(true)
      setTimeout(() => setShowSuccessMessage(false), 2000)
    }
  }

  const formatCurrency = (value: number | null) => {
    if (!value) return 'Not disclosed'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div style={{
      height: '100%',
      overflow: 'auto',
      padding: '1.5rem',
      background: 'rgba(11, 18, 32, 0.6)',
      borderLeft: '1px solid rgba(255, 255, 255, 0.1)'
    }}>
      {/* Header with close button */}
      {onClose && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: '1.5rem',
              cursor: 'pointer',
              padding: '0.25rem'
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Title */}
      <h2 style={{
        fontSize: '1.25rem',
        fontWeight: '600',
        color: '#ffffff',
        marginBottom: '1rem',
        lineHeight: '1.4'
      }}>
        {opportunity.title}
      </h2>

      {/* Status Badge */}
      <div style={{ marginBottom: '1.5rem' }}>
        <span style={{
          display: 'inline-block',
          padding: '0.25rem 0.75rem',
          borderRadius: '6px',
          fontSize: '0.875rem',
          fontWeight: '500',
          background: opportunity.status === 'Active' ? 'rgba(154, 242, 58, 0.2)' : 'rgba(255, 255, 255, 0.1)',
          color: opportunity.status === 'Active' ? '#9AF23A' : 'rgba(255, 255, 255, 0.7)',
          border: `1px solid ${opportunity.status === 'Active' ? 'rgba(154, 242, 58, 0.3)' : 'rgba(255, 255, 255, 0.2)'}`
        }}>
          {opportunity.status}
        </span>
      </div>

      {/* Key Metadata */}
      <div style={{ marginBottom: '1.5rem' }}>
        <MetadataRow label="External ID" value={opportunity.externalId} />
        <MetadataRow label="Agency" value={opportunity.agency} />
        <MetadataRow label="Customer" value={opportunity.customer} />
        <MetadataRow label="Contract Vehicle" value={opportunity.contractVehicle} />
        <MetadataRow label="Estimated Value" value={formatCurrency(opportunity.estimatedValue)} />
        <MetadataRow label="Release Date" value={formatDate(opportunity.releaseDate)} />
        <MetadataRow label="Due Date" value={formatDate(opportunity.dueDate)} />
        <MetadataRow label="NAICS" value={opportunity.naics.join(', ')} />
        <MetadataRow label="PSC" value={opportunity.psc.join(', ')} />
      </div>

      {/* Summary */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h3 style={{
          fontSize: '0.875rem',
          fontWeight: '600',
          color: 'rgba(255, 255, 255, 0.9)',
          marginBottom: '0.5rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          Summary
        </h3>
        <p style={{
          fontSize: '0.95rem',
          color: 'rgba(255, 255, 255, 0.8)',
          lineHeight: '1.6'
        }}>
          {opportunity.summary}
        </p>
      </div>

      {/* Tags */}
      {opportunity.tags.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{
            fontSize: '0.875rem',
            fontWeight: '600',
            color: 'rgba(255, 255, 255, 0.9)',
            marginBottom: '0.5rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Tags
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {opportunity.tags.map((tag, idx) => (
              <span
                key={idx}
                style={{
                  padding: '0.25rem 0.75rem',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  background: 'rgba(45, 91, 255, 0.15)',
                  color: 'rgba(45, 91, 255, 1)',
                  border: '1px solid rgba(45, 91, 255, 0.3)'
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Source URLs */}
      {opportunity.sourceUrls.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{
            fontSize: '0.875rem',
            fontWeight: '600',
            color: 'rgba(255, 255, 255, 0.9)',
            marginBottom: '0.5rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Data Sources
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {opportunity.sourceUrls.map((url, idx) => (
              <a
                key={idx}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: 'rgba(45, 91, 255, 1)',
                  fontSize: '0.875rem',
                  textDecoration: 'none',
                  wordBreak: 'break-all'
                }}
              >
                {url}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Internal Notes */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h3 style={{
          fontSize: '0.875rem',
          fontWeight: '600',
          color: 'rgba(255, 255, 255, 0.9)',
          marginBottom: '0.5rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          Internal Notes
        </h3>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add your notes here..."
          style={{
            width: '100%',
            minHeight: '100px',
            padding: '0.75rem',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            background: 'rgba(255, 255, 255, 0.05)',
            color: '#ffffff',
            fontSize: '0.95rem',
            fontFamily: 'inherit',
            resize: 'vertical',
            outline: 'none'
          }}
        />
        <button
          onClick={handleSaveNotes}
          style={{
            marginTop: '0.5rem',
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            border: 'none',
            background: 'rgba(45, 91, 255, 0.2)',
            color: '#ffffff',
            fontSize: '0.875rem',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          Save Notes
        </button>
      </div>

      {/* Add to CRM Button */}
      <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <button
          onClick={handleAddToCrm}
          style={{
            width: '100%',
            padding: '0.875rem',
            borderRadius: '8px',
            border: 'none',
            background: 'rgba(45, 91, 255, 1)',
            color: '#ffffff',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          Add to CRM
        </button>
        
        {showSuccessMessage && (
          <div style={{
            marginTop: '0.75rem',
            padding: '0.75rem',
            borderRadius: '8px',
            background: 'rgba(154, 242, 58, 0.15)',
            border: '1px solid rgba(154, 242, 58, 0.3)',
            color: '#9AF23A',
            fontSize: '0.875rem',
            textAlign: 'center'
          }}>
            Added to CRM successfully
          </div>
        )}
      </div>
    </div>
  )
}

function MetadataRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      padding: '0.5rem 0',
      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
      fontSize: '0.875rem'
    }}>
      <span style={{ color: 'rgba(255, 255, 255, 0.6)', fontWeight: '500' }}>
        {label}
      </span>
      <span style={{ color: 'rgba(255, 255, 255, 0.9)', textAlign: 'right', maxWidth: '60%' }}>
        {value}
      </span>
    </div>
  )
}

