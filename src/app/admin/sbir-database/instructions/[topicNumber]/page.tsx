'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import Link from 'next/link';

export default function InstructionsDetailPage() {
  const params = useParams();
  const router = useRouter();
  const topicNumber = params.topicNumber as string;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: oppData, error } = await supabase
          .from('sbir_final')
          .select(`
            topic_number,
            title,
            status,
            sponsor_component,
            solicitation_branch,
            open_date,
            close_date,
            instructions_plain_text,
            consolidated_instructions_url,
            instructions_generated_at,
            instructions_volume_structure,
            instructions_checklist,
            component_instructions_download,
            solicitation_instructions_download
          `)
          .eq('topic_number', topicNumber)
          .single();

        if (error) throw error;
        setData(oppData);
      } catch (error) {
        console.error('Error fetching instructions:', error);
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
        padding: '40px 20px'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center', color: '#cbd5e1' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
          <div style={{ fontSize: '18px' }}>Loading instructions...</div>
        </div>
      </div>
    );
  }

  if (!data || !data.instructions_plain_text) {
    return (
      <div style={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        padding: '40px 20px'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <Link 
            href="/admin/sbir-database"
            style={{ 
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              color: '#60a5fa',
              textDecoration: 'none',
              marginBottom: '24px',
              fontSize: '14px'
            }}
          >
            ← Back to Database
          </Link>
          <div style={{ 
            background: 'rgba(30, 41, 59, 0.6)',
            border: '1px solid rgba(51, 65, 85, 0.6)',
            borderRadius: '12px',
            padding: '40px',
            textAlign: 'center'
          }}>
            <h1 style={{ color: '#e2e8f0', fontSize: '24px', marginBottom: '16px' }}>Instructions Not Available</h1>
            <p style={{ color: '#94a3b8', marginBottom: '24px' }}>
              Instructions have not been generated for this topic yet.
            </p>
            <p style={{ color: '#64748b', fontSize: '14px' }}>
              Topic: {topicNumber}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isActive = ['Open', 'Prerelease', 'Active'].includes(data.status);

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      padding: '40px 20px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <Link 
            href="/admin/sbir-database"
            style={{ 
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              color: '#60a5fa',
              textDecoration: 'none',
              marginBottom: '24px',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            ← Back to Database
          </Link>
          
          <div style={{ 
            background: 'rgba(30, 41, 59, 0.6)',
            border: '1px solid rgba(51, 65, 85, 0.6)',
            borderRadius: '12px',
            padding: '32px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ flex: 1 }}>
                <h1 style={{ 
                  color: '#e2e8f0',
                  fontSize: '28px',
                  fontWeight: '700',
                  marginBottom: '12px',
                  lineHeight: '1.3'
                }}>
                  {data.title}
                </h1>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '14px' }}>
                  <div>
                    <span style={{ color: '#94a3b8' }}>Topic: </span>
                    <span style={{ color: '#cbd5e1', fontWeight: '600' }}>{data.topic_number}</span>
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8' }}>Status: </span>
                    <span style={{ 
                      padding: '4px 10px',
                      background: isActive ? 'rgba(34, 197, 94, 0.2)' : 'rgba(100, 116, 139, 0.2)',
                      borderRadius: '4px',
                      color: isActive ? '#86efac' : '#cbd5e1',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      {data.status}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8' }}>Component: </span>
                    <span style={{ color: '#60a5fa', fontWeight: '500' }}>{data.sponsor_component}</span>
                  </div>
                </div>
                {data.open_date && data.close_date && (
                  <div style={{ marginTop: '12px', fontSize: '13px', color: '#94a3b8' }}>
                    Open: {new Date(data.open_date).toLocaleDateString()} • Close: {new Date(data.close_date).toLocaleDateString()}
                  </div>
                )}
              </div>
              
              {data.consolidated_instructions_url && (
                <a
                  href={data.consolidated_instructions_url}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: '12px 24px',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                    transition: 'transform 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  Download PDF
                </a>
              )}
            </div>

            {data.instructions_generated_at && (
              <div style={{ 
                marginTop: '16px',
                paddingTop: '16px',
                borderTop: '1px solid rgba(71, 85, 105, 0.3)',
                fontSize: '12px',
                color: '#64748b',
                fontStyle: 'italic'
              }}>
                Instructions generated: {new Date(data.instructions_generated_at).toLocaleString()}
              </div>
            )}
          </div>
        </div>

        {/* Source Documents */}
        {(data.component_instructions_download || data.solicitation_instructions_download) && (
          <div style={{ 
            background: 'rgba(30, 41, 59, 0.6)',
            border: '1px solid rgba(51, 65, 85, 0.6)',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px'
          }}>
            <h3 style={{ color: '#e2e8f0', fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
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
                    fontWeight: '500'
                  }}
                >
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
                    fontWeight: '500'
                  }}
                >
                  BAA/Solicitation Instructions
                </a>
              )}
            </div>
          </div>
        )}

        {/* Instructions Content */}
        <div style={{ 
          background: 'rgba(30, 41, 59, 0.6)',
          border: '1px solid rgba(51, 65, 85, 0.6)',
          borderRadius: '12px',
          padding: '32px'
        }}>
          <h2 style={{ 
            color: '#e2e8f0',
            fontSize: '22px',
            fontWeight: '700',
            marginBottom: '24px'
          }}>
            Consolidated Submission Instructions
          </h2>
          
          <div style={{ 
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid rgba(71, 85, 105, 0.4)',
            borderRadius: '8px',
            padding: '24px',
            marginBottom: '24px'
          }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'start' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" style={{ flexShrink: 0, marginTop: '2px' }}>
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
              <div>
                <h4 style={{ color: '#fbbf24', fontSize: '15px', fontWeight: '600', marginBottom: '8px' }}>
                  Important Notice
                </h4>
                <p style={{ color: '#cbd5e1', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
                  This document consolidates instructions from Component-specific and BAA/Solicitation documents with cross-reference analysis. Always verify requirements against the original source documents above.
                </p>
              </div>
            </div>
          </div>

          <div style={{ 
            color: '#cbd5e1',
            fontSize: '14px',
            lineHeight: '1.8',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
          }}>
            <pre style={{ 
              whiteSpace: 'pre-wrap',
              wordWrap: 'break-word',
              margin: 0,
              fontFamily: 'inherit',
              fontSize: 'inherit',
              color: 'inherit'
            }}>
              {data.instructions_plain_text}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div style={{ 
          marginTop: '24px',
          textAlign: 'center',
          color: '#64748b',
          fontSize: '13px'
        }}>
          <p>Full text length: {data.instructions_plain_text.length.toLocaleString()} characters</p>
        </div>
      </div>
    </div>
  );
}

