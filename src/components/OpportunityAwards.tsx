'use client';

// ============================================
// Opportunity Awards Component
// ============================================
// Displays historical awards for a specific opportunity

import React, { useState, useEffect } from 'react';

interface Award {
  id: number;
  contract_award_number: string;
  company: string;
  award_title: string;
  phase: string;
  program: string;
  award_amount: number;
  award_year: number;
  award_date?: string;
  agency: string;
  woman_owned: boolean;
  hubzone_owned: boolean;
  firm_state?: string;
  firm_website?: string;
  abstract?: string;
}

interface AwardsData {
  topic_number: string;
  awards: Award[];
  total_awards: number;
  total_funding: number;
  phase_breakdown: Record<string, number>;
  unique_companies: number;
  message?: string;
}

interface OpportunityAwardsProps {
  topicNumber: string;
}

export default function OpportunityAwards({ topicNumber }: OpportunityAwardsProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AwardsData | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [selectedAward, setSelectedAward] = useState<Award | null>(null);

  useEffect(() => {
    fetchAwards();
  }, [topicNumber]);

  const fetchAwards = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/opportunities/${topicNumber}/awards`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch awards');
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error('[OpportunityAwards] Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load awards');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        padding: '30px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '12px',
        color: '#ffffff',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '16px', opacity: 0.9 }}>
          Loading historical awards...
        </div>
      </div>
    );
  }

  if (error) {
    return null; // Silently fail if awards can't be loaded
  }

  if (!data || data.total_awards === 0) {
    return (
      <div style={{
        padding: '20px',
        background: 'rgba(0, 0, 0, 0.02)',
        borderRadius: '12px',
        border: '1px solid rgba(0, 0, 0, 0.1)',
        textAlign: 'center',
        color: '#666'
      }}>
        <p style={{ margin: 0, fontSize: '14px' }}>
          No historical awards found for this topic
        </p>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div style={{
      marginTop: '30px',
      padding: '30px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      borderRadius: '12px',
      color: '#ffffff'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '25px' }}>
        <h3 style={{ 
          margin: '0 0 10px 0', 
          fontSize: '24px', 
          fontWeight: 'bold' 
        }}>
          Historical Awards
        </h3>
        <p style={{ 
          margin: 0, 
          fontSize: '14px', 
          opacity: 0.9 
        }}>
          Past winners and funding for this opportunity
        </p>
      </div>

      {/* Statistics Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '15px',
        marginBottom: '25px'
      }}>
        <div style={{
          padding: '20px',
          background: 'rgba(255, 255, 255, 0.15)',
          borderRadius: '10px',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '5px' }}>
            {data.total_awards}
          </div>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>
            Total Awards
          </div>
        </div>

        <div style={{
          padding: '20px',
          background: 'rgba(255, 255, 255, 0.15)',
          borderRadius: '10px',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '5px' }}>
            {formatCurrency(data.total_funding)}
          </div>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>
            Total Funding
          </div>
        </div>

        <div style={{
          padding: '20px',
          background: 'rgba(255, 255, 255, 0.15)',
          borderRadius: '10px',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '5px' }}>
            {data.unique_companies}
          </div>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>
            Unique Winners
          </div>
        </div>

        <div style={{
          padding: '20px',
          background: 'rgba(255, 255, 255, 0.15)',
          borderRadius: '10px',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '5px' }}>
            {formatCurrency(data.total_funding / data.total_awards)}
          </div>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>
            Avg. Award
          </div>
        </div>
      </div>

      {/* Phase Breakdown */}
      {Object.keys(data.phase_breakdown).length > 0 && (
        <div style={{
          padding: '20px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '10px',
          marginBottom: '20px'
        }}>
          <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px', opacity: 0.9 }}>
            Phase Breakdown:
          </div>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            {Object.entries(data.phase_breakdown).map(([phase, count]) => (
              <div key={phase} style={{ fontSize: '14px' }}>
                <span style={{ fontWeight: 'bold' }}>{phase}:</span> {count} {count === 1 ? 'award' : 'awards'}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* View Awards Button */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: '100%',
          padding: '15px',
          background: 'rgba(255, 255, 255, 0.2)',
          border: 'none',
          borderRadius: '10px',
          color: '#ffffff',
          fontSize: '16px',
          fontWeight: 'bold',
          cursor: 'pointer',
          transition: 'all 0.2s',
          backdropFilter: 'blur(10px)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
        }}
      >
        {expanded ? 'Hide Award Details' : `View All ${data.total_awards} Awards`}
      </button>

      {/* Awards List */}
      {expanded && (
        <div style={{
          marginTop: '20px',
          maxHeight: '600px',
          overflowY: 'auto',
          background: 'rgba(0, 0, 0, 0.2)',
          borderRadius: '10px',
          padding: '20px'
        }}>
          {data.awards.map((award) => (
            <div
              key={award.id}
              style={{
                padding: '20px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                marginBottom: '15px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onClick={() => setSelectedAward(selectedAward?.id === award.id ? null : award)}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              }}
            >
              {/* Award Header */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'flex-start',
                marginBottom: '10px'
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '5px' }}>
                    {award.company}
                  </div>
                  <div style={{ fontSize: '14px', opacity: 0.8, marginBottom: '8px' }}>
                    {award.award_title}
                  </div>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <span style={{
                      padding: '4px 10px',
                      background: 'rgba(255, 255, 255, 0.2)',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      {award.phase}
                    </span>
                    <span style={{
                      padding: '4px 10px',
                      background: 'rgba(255, 255, 255, 0.2)',
                      borderRadius: '6px',
                      fontSize: '12px'
                    }}>
                      {award.award_year}
                    </span>
                    {award.woman_owned && (
                      <span style={{
                        padding: '4px 10px',
                        background: 'rgba(255, 100, 200, 0.3)',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        Woman-Owned
                      </span>
                    )}
                    {award.firm_state && (
                      <span style={{
                        padding: '4px 10px',
                        background: 'rgba(255, 255, 255, 0.2)',
                        borderRadius: '6px',
                        fontSize: '12px'
                      }}>
                        {award.firm_state}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ 
                  fontSize: '20px', 
                  fontWeight: 'bold', 
                  textAlign: 'right',
                  minWidth: '120px'
                }}>
                  {formatCurrency(award.award_amount)}
                </div>
              </div>

              {/* Expanded Details */}
              {selectedAward?.id === award.id && award.abstract && (
                <div style={{
                  marginTop: '15px',
                  paddingTop: '15px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.2)',
                  fontSize: '13px',
                  lineHeight: '1.6',
                  opacity: 0.9
                }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Abstract:</div>
                  <div>{award.abstract}</div>
                  {award.firm_website && (
                    <div style={{ marginTop: '10px' }}>
                      <a 
                        href={award.firm_website}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: '#ffffff',
                          textDecoration: 'underline',
                          fontWeight: 'bold'
                        }}
                      >
                        Visit Company Website →
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

