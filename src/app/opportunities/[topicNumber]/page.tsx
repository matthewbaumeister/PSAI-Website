'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { formatQAForDisplay } from '@/lib/qa-formatter';
import Link from 'next/link';
import type { InstructionAnalysisResult } from '@/lib/llm-instruction-analyzer';

interface OpportunityData {
  id?: number;
  topic_id?: string;
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
  const [descriptionsExpanded, setDescriptionsExpanded] = useState(false);
  const [phasesExpanded, setPhasesExpanded] = useState(false);
  const [generatingAnalysis, setGeneratingAnalysis] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const supabase = createClient();

  // Scroll to Q&A section and expand it
  const scrollToQA = () => {
    setQaExpanded(true);
    setTimeout(() => {
      const qaSection = document.getElementById('qa-section');
      if (qaSection) {
        qaSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  // Generate AI analysis
  const handleGenerateAnalysis = async () => {
    if (!data) return;
    
    setGeneratingAnalysis(true);
    setAnalysisError(null);

    try {
      const response = await fetch(`/api/admin/analyze-instructions/${data.topic_id || data.id || data.topic_number}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to analyze instructions');
      }

      // Refresh the page data to get the updated instructions_checklist
      const { data: oppData, error } = await supabase
        .from('sbir_final')
        .select('*')
        .eq('topic_number', topicNumber)
        .single();

      if (!error && oppData) {
        setData(oppData);
        setInstructionsExpanded(true); // Auto-expand to show results
      }
    } catch (err) {
      setAnalysisError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setGeneratingAnalysis(false);
    }
  };

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

  const isActive = data.status && 
    ['open', 'prerelease', 'pre-release', 'active', 'prelease'].includes(data.status.toLowerCase());
  const isClosed = data.status && 
    ['closed', 'awarded', 'cancelled', 'canceled'].includes(data.status.toLowerCase());
  const hasInstructions = data.instructions_plain_text && data.instructions_plain_text.length > 0;

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      padding: '40px 20px'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        
        {/* Closed Opportunity Warning Banner */}
        {isClosed && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(251, 146, 60, 0.15) 0%, rgba(245, 158, 11, 0.15) 100%)',
            border: '2px solid rgba(251, 146, 60, 0.5)',
            borderRadius: '12px',
            padding: '24px 32px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '20px'
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fb923c" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <div style={{ flex: 1 }}>
              <h3 style={{ 
                color: '#fbbf24', 
                fontSize: '18px', 
                fontWeight: '700', 
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Closed Opportunity - Historical Record
              </h3>
              <p style={{ 
                color: '#fcd34d', 
                fontSize: '14px', 
                lineHeight: '1.6',
                margin: 0
              }}>
                This opportunity is no longer accepting proposals. All information shown (including submission instructions) is preserved for historical reference only and may no longer be applicable to current solicitations.
                {data.last_scraped && (
                  <span style={{ display: 'block', marginTop: '8px', fontSize: '13px', color: '#d97706' }}>
                    Last Updated: {new Date(data.last_scraped).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric', 
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                )}
              </p>
            </div>
          </div>
        )}
        
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
            <div style={{ marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ 
                padding: '8px 20px',
                background: isActive 
                  ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(16, 185, 129, 0.2) 100%)'
                  : isClosed
                  ? 'linear-gradient(135deg, rgba(251, 146, 60, 0.2) 0%, rgba(245, 158, 11, 0.2) 100%)'
                  : 'rgba(100, 116, 139, 0.2)',
                border: `1px solid ${isActive ? 'rgba(34, 197, 94, 0.4)' : isClosed ? 'rgba(251, 146, 60, 0.4)' : 'rgba(100, 116, 139, 0.4)'}`,
                borderRadius: '24px',
                color: isActive ? '#86efac' : isClosed ? '#fbbf24' : '#cbd5e1',
                fontSize: '14px',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                display: 'inline-block'
              }}>
                {isActive && '🟢 '}{isClosed && '🔒 '}{data.status}
              </span>
              {isClosed && (
                <span style={{ 
                  padding: '6px 16px',
                  background: 'rgba(120, 113, 108, 0.2)',
                  border: '1px solid rgba(168, 162, 158, 0.3)',
                  borderRadius: '16px',
                  color: '#a8a29e',
                  fontSize: '12px',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  display: 'inline-block'
                }}>
                  Historical Record
                </span>
              )}
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
                  onClick={scrollToQA}
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
                    {data.topic_question_count} • Click to View
                  </div>
                </button>
              )}
              {data.topic_question_count === 0 && (
                <div style={{
                  background: 'rgba(100, 116, 139, 0.1)',
                  border: '1px solid rgba(100, 116, 139, 0.3)',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  width: '100%'
                }}>
                  <div style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                    Q&A Status
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: '14px', fontWeight: '500' }}>
                    No Q&As available yet
                  </div>
                </div>
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
        {/* Opportunity Description - Collapsible */}
        {(data.description || data.objectives) && (
          <div style={{ 
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(168, 85, 247, 0.15) 100%)',
            border: '1px solid rgba(139, 92, 246, 0.4)',
            borderRadius: '12px',
            overflow: 'hidden',
            marginBottom: '32px'
          }}>
            {/* Collapsible Header */}
            <button
              onClick={() => setDescriptionsExpanded(!descriptionsExpanded)}
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
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  padding: '12px',
                  background: 'rgba(139, 92, 246, 0.3)',
                  borderRadius: '8px'
                }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#c4b5fd" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                  </svg>
                </div>
                <div style={{ textAlign: 'left' }}>
                  <h2 style={{ 
                    color: '#e2e8f0',
                    fontSize: '24px',
                    fontWeight: '700',
                    margin: '0 0 4px 0'
                  }}>
                    Opportunity Description
                  </h2>
                  <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>
                    Objectives and detailed description
                  </p>
                </div>
              </div>
              <div style={{
                padding: '8px',
                background: descriptionsExpanded ? 'rgba(139, 92, 246, 0.3)' : 'rgba(71, 85, 105, 0.3)',
                borderRadius: '6px',
                transition: 'all 0.2s'
              }}>
                <svg 
                  width="24" 
                  height="24" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke={descriptionsExpanded ? '#c4b5fd' : '#cbd5e1'}
                  strokeWidth="2"
                  style={{
                    transform: descriptionsExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s'
                  }}
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </div>
            </button>

            {/* Collapsible Content */}
            {descriptionsExpanded && (
              <div style={{ 
                padding: '32px',
                borderTop: '1px solid rgba(71, 85, 105, 0.3)',
                background: 'rgba(15, 23, 42, 0.4)'
              }}>
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
          </div>
        )}

        {/* Phase Descriptions - Collapsible */}
        {(data.phase_1_description || data.phase_2_description || data.phase_3_description) && (
          <div style={{ 
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(16, 185, 129, 0.15) 100%)',
            border: '1px solid rgba(59, 130, 246, 0.4)',
            borderRadius: '12px',
            overflow: 'hidden',
            marginBottom: '32px'
          }}>
            {/* Collapsible Header */}
            <button
              onClick={() => setPhasesExpanded(!phasesExpanded)}
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
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <polyline points="19 12 12 19 5 12"></polyline>
                  </svg>
                </div>
                <div style={{ textAlign: 'left' }}>
                  <h2 style={{ 
                    color: '#e2e8f0',
                    fontSize: '24px',
                    fontWeight: '700',
                    margin: '0 0 4px 0'
                  }}>
                    Phase Descriptions
                  </h2>
                  <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>
                    {[data.phase_1_description && 'Phase I', data.phase_2_description && 'Phase II', data.phase_3_description && 'Phase III'].filter(Boolean).join(', ')} details
                  </p>
                </div>
              </div>
              <div style={{
                padding: '8px',
                background: phasesExpanded ? 'rgba(59, 130, 246, 0.3)' : 'rgba(71, 85, 105, 0.3)',
                borderRadius: '6px',
                transition: 'all 0.2s'
              }}>
                <svg 
                  width="24" 
                  height="24" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke={phasesExpanded ? '#60a5fa' : '#cbd5e1'}
                  strokeWidth="2"
                  style={{
                    transform: phasesExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s'
                  }}
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </div>
            </button>

            {/* Collapsible Content */}
            {phasesExpanded && (
              <div style={{ 
                padding: '32px',
                borderTop: '1px solid rgba(71, 85, 105, 0.3)',
                background: 'rgba(15, 23, 42, 0.4)'
              }}>
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
          </div>
        )}

        {/* Q&A Section - Collapsible */}
        {/* Show if there are questions (even if content isn't loaded yet) */}
        {data.topic_question_count > 0 && (
          <div 
            id="qa-section"
            style={{ 
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%)',
              border: '1px solid rgba(59, 130, 246, 0.4)',
              borderRadius: '12px',
              overflow: 'hidden',
              marginBottom: '32px'
            }}
          >
            {/* Collapsible Header */}
            <button
              onClick={() => setQaExpanded(!qaExpanded)}
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
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                  </svg>
                </div>
                <div style={{ textAlign: 'left' }}>
                  <h2 style={{ 
                    color: '#e2e8f0',
                    fontSize: '24px',
                    fontWeight: '700',
                    margin: '0 0 4px 0'
                  }}>
                    Questions & Answers ({data.topic_question_count})
                  </h2>
                  <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>
                    Community questions and official answers from the program office
                  </p>
                </div>
              </div>
              <div style={{
                padding: '8px',
                background: qaExpanded ? 'rgba(59, 130, 246, 0.3)' : 'rgba(71, 85, 105, 0.3)',
                borderRadius: '6px',
                transition: 'all 0.2s'
              }}>
                <svg 
                  width="24" 
                  height="24" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke={qaExpanded ? '#93c5fd' : '#cbd5e1'}
                  strokeWidth="2"
                  style={{
                    transform: qaExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s'
                  }}
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </div>
            </button>

            {/* Collapsible Content */}
            {qaExpanded && (
              <div style={{ 
                padding: '32px',
                borderTop: '1px solid rgba(71, 85, 105, 0.3)',
                background: 'rgba(15, 23, 42, 0.4)'
              }}>
                <div style={{ 
                  maxHeight: '800px',
                  overflowY: 'auto',
                  paddingRight: '8px'
                }}>
                  {data.qa_content ? (
                    formatQAForDisplay(data.qa_content)
                  ) : (
                    <div style={{
                      padding: '24px',
                      textAlign: 'center',
                      background: 'rgba(100, 116, 139, 0.1)',
                      border: '1px solid rgba(100, 116, 139, 0.3)',
                      borderRadius: '8px'
                    }}>
                      <p style={{ color: '#cbd5e1', fontSize: '14px', margin: '0 0 8px 0' }}>
                        DSIP reports {data.topic_question_count} question{data.topic_question_count !== 1 ? 's' : ''} for this topic, but no Q&A content is currently available.
                      </p>
                      <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0, fontStyle: 'italic' }}>
                        This may be due to unpublished questions, draft questions, or a data inconsistency on DSIP.
                        Check the official DSIP page for this topic to verify Q&A availability.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Consolidated Instructions Section - Collapsible */}
        {/* Show if: has instructions OR is active (to show generate button) OR has instruction URLs */}
        {(hasInstructions || isActive || data.component_instructions_download || data.solicitation_instructions_download) && (
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
                {/* Historical Record Notice for Closed Opportunities */}
                {isClosed && (
                  <div style={{ 
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '2px solid rgba(239, 68, 68, 0.5)',
                    borderRadius: '10px',
                    padding: '20px',
                    marginBottom: '24px'
                  }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'start' }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" style={{ flexShrink: 0, marginTop: '2px' }}>
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
                      </svg>
                      <div>
                        <h4 style={{ color: '#fca5a5', fontSize: '16px', fontWeight: '700', marginBottom: '8px', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          No Longer Accepting Proposals
                        </h4>
                        <p style={{ color: '#fecaca', fontSize: '14px', lineHeight: '1.6', margin: '8px 0 0 0' }}>
                          This opportunity is <strong>closed</strong>. These instructions are preserved for historical reference and research purposes only. 
                          They may not reflect current requirements or policies. Do not use these instructions for active proposals.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
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
                        ⚠️ Important Notice - Always Verify Original Documents
                      </h4>
                      <p style={{ color: '#fde68a', fontSize: '14px', lineHeight: '1.6', margin: '8px 0 0 0' }}>
                        This analysis consolidates instructions from Component-specific and BAA/Solicitation documents. 
                        <strong style={{ color: '#fbbf24' }}> Always verify against original source documents below, especially:</strong>
                      </p>
                      <ul style={{ color: '#fef3c7', fontSize: '13px', lineHeight: '1.6', margin: '8px 0 0 0', paddingLeft: '20px' }}>
                        <li>Appendixes, attachments, and referenced exhibits</li>
                        <li>Exact formatting requirements (fonts, margins, spacing)</li>
                        <li>Forms and templates (download from original PDFs)</li>
                        <li>Any requirements referencing "see Appendix X" or "Attachment Y"</li>
                      </ul>
                      <p style={{ color: '#fbbf24', fontSize: '13px', fontStyle: 'italic', margin: '8px 0 0 0' }}>
                        Note: Appendixes may be truncated in AI analysis. Always consult original documents for complete details.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Source Documents */}
                {(data.component_instructions_download || data.solicitation_instructions_download) && (
                  <div style={{ 
                    marginBottom: '24px',
                    padding: '20px',
                    background: 'rgba(59, 130, 246, 0.1)',
                    border: '2px solid rgba(59, 130, 246, 0.3)',
                    borderRadius: '10px'
                  }}>
                    <h3 style={{ 
                      color: '#93c5fd', 
                      fontSize: '17px', 
                      fontWeight: '700', 
                      marginBottom: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      📄 Original Source Documents - Official Authority
                    </h3>
                    <p style={{ color: '#cbd5e1', fontSize: '13px', marginBottom: '12px' }}>
                      Download and verify all requirements, appendixes, and forms from these official documents
                    </p>
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

                {/* AI-Generated Analysis or Generate Button */}
                {/* Temporary DEBUG */}
                <div style={{ padding: '16px', background: 'rgba(255, 0, 0, 0.1)', border: '1px solid red', borderRadius: '8px', marginBottom: '16px', color: '#fff', fontSize: '12px' }}>
                  DEBUG INFO:<br/>
                  • status: {data.status || 'null'}<br/>
                  • isActive: {isActive ? 'TRUE' : 'FALSE'}<br/>
                  • hasChecklist: {data.instructions_checklist ? 'TRUE' : 'FALSE'}<br/>
                  • hasInstructionURLs: {(data.component_instructions_download || data.solicitation_instructions_download) ? 'TRUE' : 'FALSE'}<br/>
                </div>
                
                {data.instructions_checklist ? (
                  // Show LLM-generated content if it exists
                  <div>
                    {(() => {
                      const analysis = data.instructions_checklist as InstructionAnalysisResult;
                      return (
                        <>
                          {/* Superseding Notes */}
                          {analysis.superseding_notes && analysis.superseding_notes.length > 0 && (
                            <div style={{ marginBottom: '28px' }}>
                              <h4 style={{ 
                                color: '#fbbf24', 
                                fontSize: '18px', 
                                fontWeight: '700', 
                                marginBottom: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                              }}>
                                ⚠️ Superseding Guidance Notes
                              </h4>
                              {analysis.superseding_notes.map((note, index) => (
                                <div 
                                  key={index}
                                  style={{
                                    padding: '16px',
                                    background: 'rgba(251, 191, 36, 0.1)',
                                    border: '1px solid rgba(251, 191, 36, 0.3)',
                                    borderRadius: '8px',
                                    marginBottom: '12px'
                                  }}
                                >
                                  <div style={{ marginBottom: '8px' }}>
                                    <span style={{
                                      padding: '4px 10px',
                                      background: 'rgba(251, 191, 36, 0.3)',
                                      borderRadius: '4px',
                                      fontSize: '12px',
                                      fontWeight: '700',
                                      color: '#fbbf24',
                                      textTransform: 'uppercase'
                                    }}>
                                      {note.superseding_document}
                                    </span>
                                  </div>
                                  <p style={{ color: '#fde68a', fontSize: '15px', fontWeight: '600', margin: '0 0 8px 0' }}>
                                    {note.category}: {note.rule}
                                  </p>
                                  {note.explanation && (
                                    <p style={{ color: '#fef3c7', fontSize: '14px', margin: '0 0 10px 0' }}>
                                      {note.explanation}
                                    </p>
                                  )}
                                  <div style={{ fontSize: '13px', color: '#d97706' }}>
                                    {note.component_reference && <div>Component: {note.component_reference}</div>}
                                    {note.baa_reference && <div>BAA: {note.baa_reference}</div>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Conflicts */}
                          {analysis.conflicts_detected && analysis.conflicts_detected.length > 0 && (
                            <div style={{ marginBottom: '28px' }}>
                              <h4 style={{ 
                                color: '#f87171', 
                                fontSize: '18px', 
                                fontWeight: '700', 
                                marginBottom: '16px'
                              }}>
                                ❌ Conflicts Detected ({analysis.conflicts_detected.length})
                              </h4>
                              {analysis.conflicts_detected.map((conflict, index) => (
                                <div 
                                  key={index}
                                  style={{
                                    padding: '18px',
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                    borderRadius: '8px',
                                    marginBottom: '14px'
                                  }}
                                >
                                  <h5 style={{ color: '#fca5a5', fontSize: '15px', fontWeight: '700', margin: '0 0 12px 0' }}>
                                    {conflict.topic}
                                  </h5>
                                  <div style={{ marginBottom: '10px' }}>
                                    <span style={{ color: '#94a3b8', fontSize: '13px', fontWeight: '600' }}>Component says:</span>
                                    <p style={{ color: '#fecaca', fontSize: '14px', margin: '4px 0', fontStyle: 'italic' }}>
                                      "{conflict.component_says}"
                                    </p>
                                    <span style={{ color: '#7c2d12', fontSize: '12px' }}>{conflict.component_citation}</span>
                                  </div>
                                  <div style={{ marginBottom: '10px' }}>
                                    <span style={{ color: '#94a3b8', fontSize: '13px', fontWeight: '600' }}>BAA says:</span>
                                    <p style={{ color: '#fecaca', fontSize: '14px', margin: '4px 0', fontStyle: 'italic' }}>
                                      "{conflict.baa_says}"
                                    </p>
                                    <span style={{ color: '#7c2d12', fontSize: '12px' }}>{conflict.baa_citation}</span>
                                  </div>
                                  <div style={{
                                    padding: '12px',
                                    background: 'rgba(34, 197, 94, 0.15)',
                                    borderRadius: '6px',
                                    marginTop: '12px'
                                  }}>
                                    <span style={{ color: '#86efac', fontSize: '13px', fontWeight: '600' }}>Resolution:</span>
                                    <p style={{ color: '#bbf7d0', fontSize: '14px', margin: '4px 0 0 0' }}>
                                      {conflict.resolution}
                                    </p>
                                    <span style={{
                                      display: 'inline-block',
                                      marginTop: '8px',
                                      padding: '4px 10px',
                                      background: 'rgba(34, 197, 94, 0.3)',
                                      borderRadius: '4px',
                                      fontSize: '12px',
                                      color: '#4ade80',
                                      fontWeight: '700'
                                    }}>
                                      {conflict.which_supersedes} Supersedes
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Compliance Checklist */}
                          {analysis.compliance_checklist && analysis.compliance_checklist.length > 0 && (
                            <div>
                              <h4 style={{ 
                                color: '#60a5fa', 
                                fontSize: '18px', 
                                fontWeight: '700', 
                                marginBottom: '16px'
                              }}>
                                ✅ Compliance Checklist ({analysis.compliance_checklist.length} requirements)
                              </h4>
                              {Array.from(new Set(analysis.compliance_checklist.map(item => item.volume)))
                                .sort()
                                .map((volume) => (
                                  <div key={volume} style={{ marginBottom: '24px' }}>
                                    <h5 style={{ 
                                      color: '#93c5fd', 
                                      fontSize: '16px', 
                                      fontWeight: '700', 
                                      marginBottom: '14px',
                                      paddingBottom: '10px',
                                      borderBottom: '2px solid rgba(59, 130, 246, 0.3)'
                                    }}>
                                      {volume}
                                    </h5>
                                    {analysis.compliance_checklist
                                      .filter(item => item.volume === volume)
                                      .map((item, index) => (
                                        <div 
                                          key={index}
                                          style={{
                                            padding: '14px',
                                            background: 'rgba(59, 130, 246, 0.08)',
                                            border: '1px solid rgba(59, 130, 246, 0.25)',
                                            borderRadius: '6px',
                                            marginBottom: '10px'
                                          }}
                                        >
                                          <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                                            <span style={{
                                              width: '22px',
                                              height: '22px',
                                              borderRadius: '4px',
                                              border: '2px solid rgba(59, 130, 246, 0.6)',
                                              flexShrink: 0,
                                              marginTop: '2px'
                                            }} />
                                            <div style={{ flex: 1 }}>
                                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                                <span style={{ color: '#93c5fd', fontSize: '14px', fontWeight: '600' }}>
                                                  {item.section}
                                                </span>
                                                <span style={{
                                                  padding: '3px 8px',
                                                  background: item.priority === 'Critical' 
                                                    ? 'rgba(239, 68, 68, 0.3)'
                                                    : item.priority === 'Required'
                                                    ? 'rgba(59, 130, 246, 0.3)'
                                                    : 'rgba(100, 116, 139, 0.3)',
                                                  borderRadius: '4px',
                                                  fontSize: '11px',
                                                  fontWeight: '700',
                                                  color: item.priority === 'Critical'
                                                    ? '#fca5a5'
                                                    : item.priority === 'Required'
                                                    ? '#93c5fd'
                                                    : '#cbd5e1',
                                                  textTransform: 'uppercase'
                                                }}>
                                                  {item.priority}
                                                </span>
                                              </div>
                                              <p style={{ color: '#e2e8f0', fontSize: '14px', margin: '0 0 10px 0', lineHeight: '1.6' }}>
                                                {item.requirement}
                                              </p>
                                              <div style={{ fontSize: '13px', color: '#64748b' }}>
                                                <span>Source: <strong style={{ color: '#94a3b8' }}>{item.source_document}</strong></span>
                                                <span style={{ margin: '0 8px' }}>•</span>
                                                <span>Citation: {item.citation}</span>
                                              </div>
                                              {item.notes && (
                                                <p style={{ 
                                                  color: '#fbbf24', 
                                                  fontSize: '13px', 
                                                  margin: '8px 0 0 0',
                                                  fontStyle: 'italic'
                                                }}>
                                                  Note: {item.notes}
                                                </p>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                  </div>
                                ))}
                            </div>
                          )}

                          {/* Metadata */}
                          {analysis.analysis_metadata && (
                            <div style={{
                              marginTop: '24px',
                              padding: '14px',
                              background: 'rgba(100, 116, 139, 0.1)',
                              borderRadius: '6px',
                              borderLeft: '3px solid rgba(100, 116, 139, 0.5)'
                            }}>
                              <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0 }}>
                                Analyzed with {analysis.analysis_metadata.model_used} • 
                                {' '}{new Date(analysis.analysis_metadata.analyzed_at).toLocaleString()} • 
                                {' '}{analysis.analysis_metadata.total_requirements_found} requirements found • 
                                {' '}{analysis.analysis_metadata.conflicts_found} conflicts detected
                              </p>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                ) : isActive ? (
                  // Show generate button for active opportunities without analysis
                  <div style={{
                    padding: '40px',
                    textAlign: 'center',
                    background: 'rgba(15, 23, 42, 0.6)',
                    borderRadius: '8px',
                    border: '1px dashed rgba(139, 92, 246, 0.4)'
                  }}>
                    <div style={{ marginBottom: '20px' }}>
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" style={{ margin: '0 auto' }}>
                        <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                        <path d="M2 17l10 5 10-5"></path>
                        <path d="M2 12l10 5 10-5"></path>
                      </svg>
                    </div>
                    <h4 style={{ color: '#e2e8f0', fontSize: '18px', fontWeight: '600', marginBottom: '12px' }}>
                      Smart Instruction Analysis Available
                    </h4>
                    <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '24px', maxWidth: '500px', margin: '0 auto 24px' }}>
                      Generate AI-powered compliance guidance with superseding detection, conflict resolution, and comprehensive checklist
                    </p>
                    {analysisError && (
                      <div style={{
                        padding: '12px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.4)',
                        borderRadius: '6px',
                        marginBottom: '16px',
                        color: '#fca5a5',
                        fontSize: '14px'
                      }}>
                        Error: {analysisError}
                      </div>
                    )}
                    <button
                      onClick={handleGenerateAnalysis}
                      disabled={generatingAnalysis}
                      style={{
                        padding: '14px 28px',
                        background: generatingAnalysis 
                          ? 'rgba(100, 116, 139, 0.2)' 
                          : 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#ffffff',
                        fontSize: '15px',
                        fontWeight: '600',
                        cursor: generatingAnalysis ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '10px'
                      }}
                    >
                      {generatingAnalysis ? (
                        <>
                          <div style={{
                            width: '16px',
                            height: '16px',
                            border: '2px solid rgba(255, 255, 255, 0.3)',
                            borderTopColor: '#ffffff',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                          }} />
                          Analyzing... (10-30 seconds)
                        </>
                      ) : (
                        <>Generate Smart Compliance Analysis</>
                      )}
                    </button>
                  </div>
                ) : (
                  // Show plain text for non-active opportunities (or message if none available)
                  <div style={{ 
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(71, 85, 105, 0.4)',
                    borderRadius: '8px',
                    padding: '24px',
                    maxHeight: '600px',
                    overflowY: 'auto'
                  }}>
                    {data.instructions_plain_text ? (
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
                    ) : (
                      <p style={{ color: '#94a3b8', fontSize: '14px', textAlign: 'center', margin: 0 }}>
                        No consolidated instructions available for this opportunity.
                        {(data.component_instructions_download || data.solicitation_instructions_download) && 
                          ' Please refer to the original source documents above.'}
                      </p>
                    )}
                  </div>
                )}

                <style jsx>{`
                  @keyframes spin {
                    to { transform: rotate(360deg); }
                  }
                `}</style>
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

