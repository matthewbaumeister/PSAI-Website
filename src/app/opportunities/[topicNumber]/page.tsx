'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import Link from 'next/link';

interface OpportunityData {
  topic_number: string;
  title: string;
  status: string;
  sponsor_component: string;
  solicitation_branch: string;
  solicitation_title: string;
  open_date: string;
  close_date: string;
  open_datetime: string;
  close_datetime: string;
  qa_close_date: string;
  topic_question_count: number;
  phase_1_award_amount?: number;
  phase_2_award_amount?: number;
  phases_available: string;
  is_direct_to_phase_ii: string;
  phase_1_description?: string;
  phase_2_description?: string;
  phase_3_description?: string;
  keywords?: string;
  technology_areas?: string;
  objectives?: string;
  description?: string;
  topic_pdf_download?: string;
  component_instructions_download?: string;
  solicitation_instructions_download?: string;
  instructions_plain_text?: string;
  consolidated_instructions_url?: string;
  instructions_generated_at?: string;
  instructions_volume_structure?: any;
  instructions_checklist?: any;
  qa_content?: string;
  last_scraped?: string;
}

export default function OpportunityPage() {
  const params = useParams();
  const topicNumber = params.topicNumber as string;
  const [data, setData] = useState<OpportunityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [instructionsExpanded, setInstructionsExpanded] = useState(false);
  const [qaExpanded, setQaExpanded] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: oppData, error } = await supabase
          .from('sbir_final')
          .select('*')
          .eq('topic_number', topicNumber)
          .single();

        if (error) throw error;
        setData(oppData);
      } catch (error) {
        console.error('Error fetching opportunity:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [topicNumber, supabase]);

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        padding: '40px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center', color: '#cbd5e1' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
          <div style={{ fontSize: '18px' }}>Loading opportunity details...</div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        padding: '40px 20px'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ 
            background: 'rgba(30, 41, 59, 0.6)',
            border: '1px solid rgba(51, 65, 85, 0.6)',
            borderRadius: '12px',
            padding: '40px',
            textAlign: 'center'
          }}>
            <h1 style={{ color: '#e2e8f0', fontSize: '24px', marginBottom: '16px' }}>Opportunity Not Found</h1>
            <p style={{ color: '#94a3b8', marginBottom: '24px' }}>
              The opportunity with topic number <strong>{topicNumber}</strong> could not be found.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isActive = ['Open', 'Prerelease', 'Active'].includes(data.status);
  const hasInstructions = data.instructions_plain_text && data.instructions_plain_text.length > 0;

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      padding: '40px 20px'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        
        {/* Hero Section */}
        <div style={{ 
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          borderRadius: '16px',
          padding: '48px',
          marginBottom: '32px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Decorative gradient orb */}
          <div style={{
            position: 'absolute',
            top: '-100px',
            right: '-100px',
            width: '300px',
            height: '300px',
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, transparent 70%)',
            borderRadius: '50%',
            pointerEvents: 'none'
          }} />
          
          <div style={{ position: 'relative', zIndex: 1 }}>
            {/* Status Badge */}
            <div style={{ marginBottom: '20px' }}>
              <span style={{ 
                padding: '8px 20px',
                background: isActive 
                  ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(16, 185, 129, 0.2) 100%)'
                  : 'rgba(100, 116, 139, 0.2)',
                border: `1px solid ${isActive ? 'rgba(34, 197, 94, 0.4)' : 'rgba(100, 116, 139, 0.4)'}`,
                borderRadius: '24px',
                color: isActive ? '#86efac' : '#cbd5e1',
                fontSize: '14px',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                display: 'inline-block'
              }}>
                {isActive && '🟢 '}{data.status}
              </span>
            </div>

            {/* Title */}
            <h1 style={{ 
              color: '#f8fafc',
              fontSize: '42px',
              fontWeight: '800',
              marginBottom: '16px',
              lineHeight: '1.2',
              textShadow: '0 2px 4px rgba(0,0,0,0.3)'
            }}>
              {data.title}
            </h1>

            {/* Topic Number & Component */}
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginBottom: '24px' }}>
              <div>
                <span style={{ color: '#94a3b8', fontSize: '14px' }}>Topic Number</span>
                <div style={{ color: '#c4b5fd', fontSize: '20px', fontWeight: '700', marginTop: '4px' }}>
                  {data.topic_number}
                </div>
              </div>
              <div>
                <span style={{ color: '#94a3b8', fontSize: '14px' }}>Component</span>
                <div style={{ color: '#60a5fa', fontSize: '20px', fontWeight: '700', marginTop: '4px' }}>
                  {data.sponsor_component}
                </div>
              </div>
              {data.solicitation_branch && (
                <div>
                  <span style={{ color: '#94a3b8', fontSize: '14px' }}>Program</span>
                  <div style={{ color: '#a78bfa', fontSize: '20px', fontWeight: '700', marginTop: '4px' }}>
                    {data.solicitation_branch}
                  </div>
                </div>
              )}
            </div>

            {/* Key Dates */}
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '20px',
              padding: '24px',
              background: 'rgba(15, 23, 42, 0.5)',
              borderRadius: '12px',
              border: '1px solid rgba(71, 85, 105, 0.4)'
            }}>
              {data.open_date && (
                <div>
                  <div style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    Open Date
                  </div>
                  <div style={{ color: '#e2e8f0', fontSize: '16px', fontWeight: '600' }}>
                    {new Date(data.open_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
              )}
              {data.close_date && (
                <div>
                  <div style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    Close Date
                  </div>
                  <div style={{ color: isActive ? '#fbbf24' : '#e2e8f0', fontSize: '16px', fontWeight: '600' }}>
                    {new Date(data.close_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
              )}
              {data.qa_close_date && (
                <div>
                  <div style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                      <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                    Q&A Close
                  </div>
                  <div style={{ color: '#e2e8f0', fontSize: '16px', fontWeight: '600' }}>
                    {new Date(data.qa_close_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
              )}
              {data.topic_question_count > 0 && (
                <button
                  onClick={() => setQaExpanded(!qaExpanded)}
                  style={{
                    background: 'rgba(59, 130, 246, 0.2)',
                    border: '1px solid rgba(59, 130, 246, 0.4)',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    width: '100%'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.3)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)'}
                >
                  <div style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                    Questions Available
                  </div>
                  <div style={{ color: '#60a5fa', fontSize: '16px', fontWeight: '600' }}>
                    {data.topic_question_count} • Click to {qaExpanded ? 'Hide' : 'View'}
                  </div>
                </button>
              )}
            </div>

            {/* Download Buttons */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px', flexWrap: 'wrap' }}>
              {data.topic_pdf_download && (
                <a
                  href={data.topic_pdf_download}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: '14px 28px',
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                    border: 'none',
                    borderRadius: '10px',
                    color: '#ffffff',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '10px',
                    boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)',
                    transition: 'transform 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                  </svg>
                  Download Topic PDF
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '24px',
          marginBottom: '32px'
        }}>
          
          {/* Phase Information */}
          {data.phases_available && (
            <div style={{ 
              background: 'rgba(30, 41, 59, 0.6)',
              border: '1px solid rgba(51, 65, 85, 0.6)',
              borderRadius: '12px',
              padding: '28px'
            }}>
              <h2 style={{ 
                color: '#e2e8f0',
                fontSize: '20px',
                fontWeight: '700',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                Phase Information
              </h2>
              <div style={{ color: '#cbd5e1', lineHeight: '1.8' }}>
                <div style={{ marginBottom: '12px' }}>
                  <span style={{ color: '#94a3b8', fontSize: '14px' }}>Available Phases: </span>
                  <span style={{ color: '#e2e8f0', fontWeight: '600' }}>{data.phases_available}</span>
                </div>
                {data.is_direct_to_phase_ii && (
                  <div style={{ marginBottom: '12px' }}>
                    <span style={{ color: '#94a3b8', fontSize: '14px' }}>Direct to Phase II: </span>
                    <span style={{ color: '#fbbf24', fontWeight: '600' }}>{data.is_direct_to_phase_ii}</span>
                  </div>
                )}
                {data.phase_1_award_amount && (
                  <div style={{ 
                    padding: '12px',
                    background: 'rgba(59, 130, 246, 0.1)',
                    borderRadius: '8px',
                    marginTop: '12px'
                  }}>
                    <div style={{ color: '#93c5fd', fontSize: '13px', marginBottom: '4px' }}>Phase I Award</div>
                    <div style={{ color: '#60a5fa', fontSize: '22px', fontWeight: '700' }}>
                      ${data.phase_1_award_amount.toLocaleString()}
                    </div>
                  </div>
                )}
                {data.phase_2_award_amount && (
                  <div style={{ 
                    padding: '12px',
                    background: 'rgba(139, 92, 246, 0.1)',
                    borderRadius: '8px',
                    marginTop: '12px'
                  }}>
                    <div style={{ color: '#c4b5fd', fontSize: '13px', marginBottom: '4px' }}>Phase II Award</div>
                    <div style={{ color: '#a78bfa', fontSize: '22px', fontWeight: '700' }}>
                      ${data.phase_2_award_amount.toLocaleString()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Technology Areas */}
          {data.technology_areas && (
            <div style={{ 
              background: 'rgba(30, 41, 59, 0.6)',
              border: '1px solid rgba(51, 65, 85, 0.6)',
              borderRadius: '12px',
              padding: '28px'
            }}>
              <h2 style={{ 
                color: '#e2e8f0',
                fontSize: '20px',
                fontWeight: '700',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2">
                  <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                  <polyline points="2 17 12 22 22 17"></polyline>
                  <polyline points="2 12 12 17 22 12"></polyline>
                </svg>
                Technology Areas
              </h2>
              <div style={{ 
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px'
              }}>
                {data.technology_areas.split(',').map((area, idx) => (
                  <span
                    key={idx}
                    style={{
                      padding: '8px 14px',
                      background: 'rgba(59, 130, 246, 0.15)',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      borderRadius: '20px',
                      color: '#93c5fd',
                      fontSize: '13px',
                      fontWeight: '500'
                    }}
                  >
                    {area.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Keywords */}
          {data.keywords && (
            <div style={{ 
              background: 'rgba(30, 41, 59, 0.6)',
              border: '1px solid rgba(51, 65, 85, 0.6)',
              borderRadius: '12px',
              padding: '28px',
              gridColumn: 'span 1'
            }}>
              <h2 style={{ 
                color: '#e2e8f0',
                fontSize: '20px',
                fontWeight: '700',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                </svg>
                Keywords
              </h2>
              <div style={{ 
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px'
              }}>
                {data.keywords.split(',').slice(0, 20).map((keyword, idx) => (
                  <span
                    key={idx}
                    style={{
                      padding: '6px 12px',
                      background: 'rgba(251, 191, 36, 0.15)',
                      border: '1px solid rgba(251, 191, 36, 0.3)',
                      borderRadius: '16px',
                      color: '#fbbf24',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}
                  >
                    {keyword.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Description Section */}
        {(data.description || data.objectives) && (
          <div style={{ 
            background: 'rgba(30, 41, 59, 0.6)',
            border: '1px solid rgba(51, 65, 85, 0.6)',
            borderRadius: '12px',
            padding: '32px',
            marginBottom: '32px'
          }}>
            <h2 style={{ 
              color: '#e2e8f0',
              fontSize: '24px',
              fontWeight: '700',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#c4b5fd" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
              Opportunity Description
            </h2>
            {data.objectives && (
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ color: '#a78bfa', fontSize: '18px', fontWeight: '600', marginBottom: '12px' }}>
                  Objectives
                </h3>
                <p style={{ color: '#cbd5e1', fontSize: '15px', lineHeight: '1.8' }}>
                  {data.objectives}
                </p>
              </div>
            )}
            {data.description && (
              <div>
                <h3 style={{ color: '#a78bfa', fontSize: '18px', fontWeight: '600', marginBottom: '12px' }}>
                  Description
                </h3>
                <p style={{ color: '#cbd5e1', fontSize: '15px', lineHeight: '1.8', whiteSpace: 'pre-wrap' }}>
                  {data.description}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Phase Descriptions */}
        {(data.phase_1_description || data.phase_2_description || data.phase_3_description) && (
          <div style={{ 
            background: 'rgba(30, 41, 59, 0.6)',
            border: '1px solid rgba(51, 65, 85, 0.6)',
            borderRadius: '12px',
            padding: '32px',
            marginBottom: '32px'
          }}>
            <h2 style={{ 
              color: '#e2e8f0',
              fontSize: '24px',
              fontWeight: '700',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <polyline points="19 12 12 19 5 12"></polyline>
              </svg>
              Phase Descriptions
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {data.phase_1_description && (
                <div style={{
                  padding: '20px',
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: '10px'
                }}>
                  <h3 style={{ color: '#60a5fa', fontSize: '16px', fontWeight: '700', marginBottom: '10px' }}>
                    Phase I
                  </h3>
                  <p style={{ color: '#cbd5e1', fontSize: '14px', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>
                    {data.phase_1_description}
                  </p>
                </div>
              )}
              {data.phase_2_description && (
                <div style={{
                  padding: '20px',
                  background: 'rgba(139, 92, 246, 0.1)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  borderRadius: '10px'
                }}>
                  <h3 style={{ color: '#a78bfa', fontSize: '16px', fontWeight: '700', marginBottom: '10px' }}>
                    Phase II
                  </h3>
                  <p style={{ color: '#cbd5e1', fontSize: '14px', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>
                    {data.phase_2_description}
                  </p>
                </div>
              )}
              {data.phase_3_description && (
                <div style={{
                  padding: '20px',
                  background: 'rgba(236, 72, 153, 0.1)',
                  border: '1px solid rgba(236, 72, 153, 0.3)',
                  borderRadius: '10px'
                }}>
                  <h3 style={{ color: '#f472b6', fontSize: '16px', fontWeight: '700', marginBottom: '10px' }}>
                    Phase III
                  </h3>
                  <p style={{ color: '#cbd5e1', fontSize: '14px', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>
                    {data.phase_3_description}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Q&A Section - Collapsible */}
        {data.qa_content && qaExpanded && (
          <div style={{ 
            background: 'rgba(30, 41, 59, 0.6)',
            border: '1px solid rgba(59, 130, 246, 0.6)',
            borderRadius: '12px',
            padding: '32px',
            marginBottom: '32px'
          }}>
            <h2 style={{ 
              color: '#e2e8f0',
              fontSize: '24px',
              fontWeight: '700',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
              Questions & Answers ({data.topic_question_count})
            </h2>
            <div style={{ 
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(71, 85, 105, 0.4)',
              borderRadius: '8px',
              padding: '24px',
              maxHeight: '600px',
              overflowY: 'auto'
            }}>
              <pre style={{ 
                whiteSpace: 'pre-wrap',
                wordWrap: 'break-word',
                margin: 0,
                fontFamily: 'system-ui, -apple-system, sans-serif',
                fontSize: '14px',
                lineHeight: '1.8',
                color: '#cbd5e1'
              }}>
                {data.qa_content}
              </pre>
            </div>
          </div>
        )}

        {/* Consolidated Instructions Section - Collapsible */}
        {hasInstructions && (
          <div style={{ 
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%)',
            border: '1px solid rgba(59, 130, 246, 0.4)',
            borderRadius: '12px',
            overflow: 'hidden',
            marginBottom: '32px'
          }}>
            {/* Collapsible Header */}
            <button
              onClick={() => setInstructionsExpanded(!instructionsExpanded)}
              style={{
                width: '100%',
                padding: '28px 32px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  padding: '12px',
                  background: 'rgba(59, 130, 246, 0.3)',
                  borderRadius: '8px'
                }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#93c5fd" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                  </svg>
                </div>
                <div style={{ textAlign: 'left' }}>
                  <h2 style={{ 
                    color: '#e2e8f0',
                    fontSize: '24px',
                    fontWeight: '700',
                    margin: '0 0 4px 0'
                  }}>
                    Consolidated Submission Instructions
                  </h2>
                  <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>
                    Cross-reference analysis, superseding guidance, and submission checklist
                  </p>
                </div>
              </div>
              <div style={{
                padding: '8px',
                background: instructionsExpanded ? 'rgba(59, 130, 246, 0.3)' : 'rgba(71, 85, 105, 0.3)',
                borderRadius: '6px',
                transition: 'all 0.2s'
              }}>
                <svg 
                  width="24" 
                  height="24" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke={instructionsExpanded ? '#93c5fd' : '#cbd5e1'}
                  strokeWidth="2"
                  style={{
                    transform: instructionsExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s'
                  }}
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </div>
            </button>

            {/* Collapsible Content */}
            {instructionsExpanded && (
              <div style={{ 
                padding: '32px',
                borderTop: '1px solid rgba(71, 85, 105, 0.3)',
                background: 'rgba(15, 23, 42, 0.4)'
              }}>
                {/* Warning Notice */}
                <div style={{ 
                  background: 'rgba(251, 191, 36, 0.15)',
                  border: '1px solid rgba(251, 191, 36, 0.4)',
                  borderRadius: '10px',
                  padding: '20px',
                  marginBottom: '24px'
                }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'start' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" style={{ flexShrink: 0, marginTop: '2px' }}>
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                      <line x1="12" y1="9" x2="12" y2="13"></line>
                      <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                    <div>
                      <h4 style={{ color: '#fbbf24', fontSize: '16px', fontWeight: '600', marginBottom: '8px', margin: 0 }}>
                        Important Notice
                      </h4>
                      <p style={{ color: '#fde68a', fontSize: '14px', lineHeight: '1.6', margin: '8px 0 0 0' }}>
                        This document consolidates instructions from Component-specific and BAA/Solicitation documents with cross-reference analysis. 
                        Always verify requirements against the original source documents.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Source Documents */}
                {(data.component_instructions_download || data.solicitation_instructions_download) && (
                  <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ color: '#cbd5e1', fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
                      Original Source Documents
                    </h3>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      {data.component_instructions_download && (
                        <a
                          href={data.component_instructions_download}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            padding: '10px 16px',
                            background: 'rgba(34, 197, 94, 0.2)',
                            border: '1px solid rgba(34, 197, 94, 0.3)',
                            borderRadius: '6px',
                            color: '#86efac',
                            fontSize: '13px',
                            textDecoration: 'none',
                            fontWeight: '500',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                          </svg>
                          Component Instructions
                        </a>
                      )}
                      {data.solicitation_instructions_download && (
                        <a
                          href={data.solicitation_instructions_download}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            padding: '10px 16px',
                            background: 'rgba(59, 130, 246, 0.2)',
                            border: '1px solid rgba(59, 130, 246, 0.3)',
                            borderRadius: '6px',
                            color: '#93c5fd',
                            fontSize: '13px',
                            textDecoration: 'none',
                            fontWeight: '500',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                          </svg>
                          BAA/Solicitation Instructions
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Instructions Text */}
                <div style={{ 
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(71, 85, 105, 0.4)',
                  borderRadius: '8px',
                  padding: '24px',
                  maxHeight: '600px',
                  overflowY: 'auto'
                }}>
                  <pre style={{ 
                    whiteSpace: 'pre-wrap',
                    wordWrap: 'break-word',
                    margin: 0,
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                    fontSize: '13px',
                    lineHeight: '1.8',
                    color: '#cbd5e1'
                  }}>
                    {data.instructions_plain_text}
                  </pre>
                </div>

                {/* Generation Info */}
                {data.instructions_generated_at && (
                  <div style={{ 
                    marginTop: '16px',
                    fontSize: '12px',
                    color: '#64748b',
                    fontStyle: 'italic',
                    textAlign: 'center'
                  }}>
                    Instructions generated: {new Date(data.instructions_generated_at).toLocaleString()} • 
                    Length: {data.instructions_plain_text?.length?.toLocaleString() || '0'} characters
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div style={{ 
          textAlign: 'center',
          padding: '24px',
          color: '#64748b',
          fontSize: '13px'
        }}>
          {data.last_scraped && (
            <p style={{ margin: 0 }}>
              Last updated: {new Date(data.last_scraped).toLocaleString()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

