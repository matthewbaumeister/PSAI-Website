'use client';

import { useState } from 'react';
import { InstructionAnalysisResult } from '@/lib/llm-instruction-analyzer';

interface AIInstructionAnalysisProps {
  opportunityId: string | number;
  topicNumber: string;
  hasInstructions: boolean;
}

export default function AIInstructionAnalysis({
  opportunityId,
  topicNumber,
  hasInstructions
}: AIInstructionAnalysisProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<InstructionAnalysisResult | null>(null);
  const [expanded, setExpanded] = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/analyze-instructions/${opportunityId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to analyze instructions');
      }

      setResult(data.analysis);
      setExpanded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!hasInstructions) {
    return null;
  }

  return (
    <div style={{
      background: 'rgba(30, 41, 59, 0.6)',
      border: '1px solid rgba(71, 85, 105, 0.4)',
      borderRadius: '12px',
      padding: '24px',
      marginBottom: '24px'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <div style={{
            padding: '10px',
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.3) 0%, rgba(59, 130, 246, 0.3) 100%)',
            borderRadius: '8px'
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
              <path d="M2 17l10 5 10-5"></path>
              <path d="M2 12l10 5 10-5"></path>
            </svg>
          </div>
          <div>
            <h3 style={{ 
              color: '#e2e8f0', 
              fontSize: '20px', 
              fontWeight: '700', 
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              AI Instruction Analysis
              <span style={{
                padding: '4px 10px',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                BETA
              </span>
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '14px', margin: '4px 0 0 0' }}>
              GPT-4o-mini powered compliance analysis with superseding guidance detection
            </p>
          </div>
        </div>
      </div>

      {/* Action Button */}
      {!result && (
        <button
          onClick={handleAnalyze}
          disabled={loading}
          style={{
            width: '100%',
            padding: '16px 24px',
            background: loading 
              ? 'rgba(100, 116, 139, 0.2)' 
              : 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
            border: 'none',
            borderRadius: '8px',
            color: '#ffffff',
            fontSize: '15px',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px'
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 16px rgba(139, 92, 246, 0.4)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          {loading ? (
            <>
              <div style={{
                width: '20px',
                height: '20px',
                border: '3px solid rgba(255, 255, 255, 0.3)',
                borderTopColor: '#ffffff',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              Analyzing Instructions with AI...
            </>
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                <path d="M2 17l10 5 10-5"></path>
                <path d="M2 12l10 5 10-5"></path>
              </svg>
              Analyze Instructions with AI
            </>
          )}
        </button>
      )}

      {/* Error Display */}
      {error && (
        <div style={{
          padding: '16px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          borderRadius: '8px',
          marginTop: '16px'
        }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'start' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
            <div>
              <h4 style={{ color: '#fca5a5', fontSize: '14px', fontWeight: '600', margin: '0 0 4px 0' }}>
                Analysis Failed
              </h4>
              <p style={{ color: '#fecaca', fontSize: '13px', margin: 0 }}>
                {error}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Results Display */}
      {result && (
        <div style={{ marginTop: '20px' }}>
          {/* Collapsible Header */}
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              width: '100%',
              padding: '16px 20px',
              background: 'rgba(139, 92, 246, 0.15)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: expanded ? '16px' : '0'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                padding: '6px',
                background: 'rgba(139, 92, 246, 0.3)',
                borderRadius: '6px'
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c4b5fd" strokeWidth="2">
                  <path d="M9 11l3 3L22 4"></path>
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                </svg>
              </div>
              <div style={{ textAlign: 'left' }}>
                <h4 style={{ color: '#e2e8f0', fontSize: '16px', fontWeight: '600', margin: 0 }}>
                  Analysis Complete
                </h4>
                <p style={{ color: '#94a3b8', fontSize: '13px', margin: '2px 0 0 0' }}>
                  {result.compliance_checklist.length} requirements found • {result.conflicts_detected.length} conflicts detected
                </p>
              </div>
            </div>
            <svg 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="#cbd5e1" 
              strokeWidth="2"
              style={{
                transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s'
              }}
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>

          {/* Expanded Content */}
          {expanded && (
            <div style={{
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(71, 85, 105, 0.4)',
              borderRadius: '8px',
              padding: '24px'
            }}>
              {/* Superseding Notes */}
              {result.superseding_notes.length > 0 && (
                <div style={{ marginBottom: '28px' }}>
                  <h4 style={{ 
                    color: '#fbbf24', 
                    fontSize: '16px', 
                    fontWeight: '700', 
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                      <line x1="12" y1="9" x2="12" y2="13"></line>
                      <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                    Superseding Guidance Notes
                  </h4>
                  {result.superseding_notes.map((note, index) => (
                    <div 
                      key={index}
                      style={{
                        padding: '14px',
                        background: 'rgba(251, 191, 36, 0.1)',
                        border: '1px solid rgba(251, 191, 36, 0.3)',
                        borderRadius: '6px',
                        marginBottom: '10px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'start', gap: '10px' }}>
                        <span style={{
                          padding: '4px 8px',
                          background: note.superseding_document === 'Component' 
                            ? 'rgba(139, 92, 246, 0.3)' 
                            : note.superseding_document === 'BAA'
                            ? 'rgba(59, 130, 246, 0.3)'
                            : 'rgba(34, 197, 94, 0.3)',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '700',
                          color: '#fcd34d',
                          textTransform: 'uppercase',
                          flexShrink: 0
                        }}>
                          {note.superseding_document}
                        </span>
                        <div style={{ flex: 1 }}>
                          <p style={{ color: '#fde68a', fontSize: '14px', fontWeight: '600', margin: '0 0 6px 0' }}>
                            {note.category}: {note.rule}
                          </p>
                          {note.explanation && (
                            <p style={{ color: '#fef3c7', fontSize: '13px', margin: '0 0 8px 0' }}>
                              {note.explanation}
                            </p>
                          )}
                          <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#d97706' }}>
                            {note.component_reference && (
                              <span>Component: {note.component_reference}</span>
                            )}
                            {note.baa_reference && (
                              <span>BAA: {note.baa_reference}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Conflicts Detected */}
              {result.conflicts_detected.length > 0 && (
                <div style={{ marginBottom: '28px' }}>
                  <h4 style={{ 
                    color: '#f87171', 
                    fontSize: '16px', 
                    fontWeight: '700', 
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="15" y1="9" x2="9" y2="15"></line>
                      <line x1="9" y1="9" x2="15" y2="15"></line>
                    </svg>
                    Conflicts Detected ({result.conflicts_detected.length})
                  </h4>
                  {result.conflicts_detected.map((conflict, index) => (
                    <div 
                      key={index}
                      style={{
                        padding: '16px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '6px',
                        marginBottom: '12px'
                      }}
                    >
                      <h5 style={{ color: '#fca5a5', fontSize: '14px', fontWeight: '700', margin: '0 0 10px 0' }}>
                        {conflict.topic}
                      </h5>
                      <div style={{ marginBottom: '8px' }}>
                        <span style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600' }}>Component says:</span>
                        <p style={{ color: '#fecaca', fontSize: '13px', margin: '4px 0', fontStyle: 'italic' }}>
                          "{conflict.component_says}"
                        </p>
                        <span style={{ color: '#7c2d12', fontSize: '11px' }}>{conflict.component_citation}</span>
                      </div>
                      <div style={{ marginBottom: '8px' }}>
                        <span style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600' }}>BAA says:</span>
                        <p style={{ color: '#fecaca', fontSize: '13px', margin: '4px 0', fontStyle: 'italic' }}>
                          "{conflict.baa_says}"
                        </p>
                        <span style={{ color: '#7c2d12', fontSize: '11px' }}>{conflict.baa_citation}</span>
                      </div>
                      <div style={{
                        padding: '10px',
                        background: 'rgba(34, 197, 94, 0.1)',
                        borderRadius: '4px',
                        marginTop: '10px'
                      }}>
                        <span style={{ color: '#86efac', fontSize: '12px', fontWeight: '600' }}>Resolution:</span>
                        <p style={{ color: '#bbf7d0', fontSize: '13px', margin: '4px 0 0 0' }}>
                          {conflict.resolution}
                        </p>
                        <span style={{
                          display: 'inline-block',
                          marginTop: '6px',
                          padding: '3px 8px',
                          background: 'rgba(34, 197, 94, 0.2)',
                          borderRadius: '4px',
                          fontSize: '11px',
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
              {result.compliance_checklist.length > 0 && (
                <div>
                  <h4 style={{ 
                    color: '#60a5fa', 
                    fontSize: '16px', 
                    fontWeight: '700', 
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 11l3 3L22 4"></path>
                      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                    </svg>
                    Compliance Checklist ({result.compliance_checklist.length} requirements)
                  </h4>
                  {/* Group by volume */}
                  {Array.from(new Set(result.compliance_checklist.map(item => item.volume)))
                    .sort()
                    .map((volume) => (
                      <div key={volume} style={{ marginBottom: '20px' }}>
                        <h5 style={{ 
                          color: '#93c5fd', 
                          fontSize: '15px', 
                          fontWeight: '700', 
                          marginBottom: '12px',
                          paddingBottom: '8px',
                          borderBottom: '1px solid rgba(59, 130, 246, 0.3)'
                        }}>
                          {volume}
                        </h5>
                        {result.compliance_checklist
                          .filter(item => item.volume === volume)
                          .map((item, index) => (
                            <div 
                              key={index}
                              style={{
                                padding: '12px',
                                background: 'rgba(59, 130, 246, 0.05)',
                                border: '1px solid rgba(59, 130, 246, 0.2)',
                                borderRadius: '6px',
                                marginBottom: '8px'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'start', gap: '10px' }}>
                                <span style={{
                                  width: '20px',
                                  height: '20px',
                                  borderRadius: '4px',
                                  border: '2px solid rgba(59, 130, 246, 0.5)',
                                  flexShrink: 0,
                                  marginTop: '2px'
                                }} />
                                <div style={{ flex: 1 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                    <span style={{ color: '#93c5fd', fontSize: '13px', fontWeight: '600' }}>
                                      {item.section}
                                    </span>
                                    <span style={{
                                      padding: '2px 6px',
                                      background: item.priority === 'Critical' 
                                        ? 'rgba(239, 68, 68, 0.3)'
                                        : item.priority === 'Required'
                                        ? 'rgba(59, 130, 246, 0.3)'
                                        : 'rgba(100, 116, 139, 0.3)',
                                      borderRadius: '4px',
                                      fontSize: '10px',
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
                                  <p style={{ color: '#e2e8f0', fontSize: '14px', margin: '0 0 8px 0' }}>
                                    {item.requirement}
                                  </p>
                                  <div style={{ display: 'flex', gap: '12px', fontSize: '12px' }}>
                                    <span style={{ color: '#64748b' }}>
                                      Source: <span style={{ color: '#94a3b8', fontWeight: '600' }}>{item.source_document}</span>
                                    </span>
                                    <span style={{ color: '#64748b' }}>
                                      Citation: <span style={{ color: '#94a3b8' }}>{item.citation}</span>
                                    </span>
                                  </div>
                                  {item.notes && (
                                    <p style={{ 
                                      color: '#fbbf24', 
                                      fontSize: '12px', 
                                      margin: '6px 0 0 0',
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
              <div style={{
                marginTop: '24px',
                padding: '14px',
                background: 'rgba(100, 116, 139, 0.1)',
                borderRadius: '6px',
                borderLeft: '3px solid rgba(100, 116, 139, 0.5)'
              }}>
                <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0 }}>
                  <strong>Analyzed:</strong> {new Date(result.analysis_metadata.analyzed_at).toLocaleString()} • 
                  <strong> Model:</strong> {result.analysis_metadata.model_used} • 
                  <strong> Requirements:</strong> {result.analysis_metadata.total_requirements_found} • 
                  <strong> Conflicts:</strong> {result.analysis_metadata.conflicts_found}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

