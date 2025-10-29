'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface OpportunityData {
  topic_number: string;
  title: string;
  sponsor_component: string;
  status: string;
  open_date: string;
  close_date: string;
  phase_1_description: string;
  phase_2_description: string;
  phase_3_description: string;
  qa_content: string;
  topic_question_count: number;
}

interface ShareInfo {
  expiresAt: string;
  viewsCount: number;
}

export default function SharedOpportunityPage() {
  const params = useParams();
  const token = params?.token as string;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<OpportunityData | null>(null);
  const [shareInfo, setShareInfo] = useState<ShareInfo | null>(null);

  useEffect(() => {
    if (!token) return;

    async function fetchSharedOpportunity() {
      try {
        const response = await fetch(`/api/share/opportunity?token=${token}`);
        const result = await response.json();

        if (result.success) {
          setData(result.data.opportunity);
          setShareInfo(result.data.shareInfo);
        } else {
          setError(result.error || 'Failed to load opportunity');
        }
      } catch (err) {
        setError('Failed to fetch shared opportunity');
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchSharedOpportunity();
  }, [token]);

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
          <div style={{ fontSize: '18px' }}>Loading shared opportunity...</div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        padding: '40px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          maxWidth: '500px',
          textAlign: 'center',
          background: 'rgba(30, 41, 59, 0.8)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          borderRadius: '16px',
          padding: '48px 32px'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '24px' }}>🔒</div>
          <h1 style={{
            fontSize: '24px',
            fontWeight: '700',
            color: '#ef4444',
            marginBottom: '16px'
          }}>
            {error === 'Share link has expired' ? 'Link Expired' : 'Access Denied'}
          </h1>
          <p style={{
            fontSize: '16px',
            color: '#cbd5e1',
            lineHeight: '1.6',
            marginBottom: '32px'
          }}>
            {error || 'This share link is invalid or has expired. Share links are valid for 24 hours.'}
          </p>
          <Link 
            href="/auth/login"
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              color: '#fff',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: '600',
              transition: 'transform 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            Sign In to Prop Shop AI
          </Link>
        </div>
      </div>
    );
  }

  const expiresDate = shareInfo ? new Date(shareInfo.expiresAt) : null;
  const timeRemaining = expiresDate ? Math.max(0, expiresDate.getTime() - Date.now()) : 0;
  const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60));
  const minutesRemaining = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      padding: '40px 20px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Guest Access Banner */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.15) 0%, rgba(245, 158, 11, 0.15) 100%)',
          border: '1px solid rgba(245, 158, 11, 0.4)',
          borderRadius: '12px',
          padding: '16px 24px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2">
              <circle cx="18" cy="5" r="3"></circle>
              <circle cx="6" cy="12" r="3"></circle>
              <circle cx="18" cy="19" r="3"></circle>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
            </svg>
            <div>
              <div style={{ color: '#fbbf24', fontSize: '14px', fontWeight: '600' }}>
                Guest Access • Shared Link
              </div>
              <div style={{ color: '#cbd5e1', fontSize: '12px', marginTop: '2px' }}>
                Expires in {hoursRemaining}h {minutesRemaining}m • {shareInfo?.viewsCount || 0} views
              </div>
            </div>
          </div>
          <Link
            href="/auth/login"
            style={{
              padding: '8px 16px',
              background: 'rgba(59, 130, 246, 0.2)',
              border: '1px solid rgba(59, 130, 246, 0.4)',
              borderRadius: '6px',
              color: '#60a5fa',
              fontSize: '13px',
              fontWeight: '600',
              textDecoration: 'none',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.3)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)'}
          >
            Sign In for Full Access
          </Link>
        </div>

        {/* Opportunity Content - Reuse same styling as main opportunity page */}
        <div style={{
          background: 'rgba(30, 41, 59, 0.8)',
          border: '1px solid rgba(71, 85, 105, 0.6)',
          borderRadius: '16px',
          padding: '32px',
          marginBottom: '24px'
        }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: '700',
            color: '#e2e8f0',
            marginBottom: '16px',
            lineHeight: '1.2'
          }}>
            {data.title}
          </h1>

          <div style={{
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap',
            marginBottom: '24px'
          }}>
            <span style={{
              padding: '6px 12px',
              background: 'rgba(59, 130, 246, 0.2)',
              border: '1px solid rgba(59, 130, 246, 0.4)',
              borderRadius: '6px',
              color: '#93c5fd',
              fontSize: '13px',
              fontWeight: '600'
            }}>
              {data.topic_number}
            </span>
            <span style={{
              padding: '6px 12px',
              background: 'rgba(16, 185, 129, 0.2)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              borderRadius: '6px',
              color: '#6ee7b7',
              fontSize: '13px',
              fontWeight: '600'
            }}>
              {data.status}
            </span>
            {data.sponsor_component && (
              <span style={{
                padding: '6px 12px',
                background: 'rgba(139, 92, 246, 0.2)',
                border: '1px solid rgba(139, 92, 246, 0.4)',
                borderRadius: '6px',
                color: '#c4b5fd',
                fontSize: '13px',
                fontWeight: '600'
              }}>
                {data.sponsor_component}
              </span>
            )}
          </div>

          {/* Key Dates */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '32px'
          }}>
            {data.open_date && (
              <div style={{
                background: 'rgba(15, 23, 42, 0.6)',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid rgba(71, 85, 105, 0.4)'
              }}>
                <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}>Opens</div>
                <div style={{ color: '#e2e8f0', fontSize: '16px', fontWeight: '600' }}>
                  {new Date(data.open_date).toLocaleDateString()}
                </div>
              </div>
            )}
            {data.close_date && (
              <div style={{
                background: 'rgba(15, 23, 42, 0.6)',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid rgba(71, 85, 105, 0.4)'
              }}>
                <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}>Closes</div>
                <div style={{ color: '#e2e8f0', fontSize: '16px', fontWeight: '600' }}>
                  {new Date(data.close_date).toLocaleDateString()}
                </div>
              </div>
            )}
          </div>

          {/* Phase Descriptions */}
          {data.phase_1_description && (
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ color: '#e2e8f0', fontSize: '20px', fontWeight: '600', marginBottom: '12px' }}>
                Phase I Description
              </h2>
              <p style={{ color: '#cbd5e1', fontSize: '14px', lineHeight: '1.8' }}>
                {data.phase_1_description}
              </p>
            </div>
          )}

          {/* Limited Access CTA */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '12px',
            padding: '24px',
            textAlign: 'center',
            marginTop: '32px'
          }}>
            <h3 style={{
              color: '#e2e8f0',
              fontSize: '18px',
              fontWeight: '600',
              marginBottom: '12px'
            }}>
              Want Full Access?
            </h3>
            <p style={{
              color: '#94a3b8',
              fontSize: '14px',
              marginBottom: '20px',
              lineHeight: '1.6'
            }}>
              Sign in to Prop Shop AI to view complete details, Q&A, instructions, and track all opportunities.
            </p>
            <Link
              href="/auth/login"
              style={{
                display: 'inline-block',
                padding: '12px 32px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                color: '#fff',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: '600',
                fontSize: '14px',
                transition: 'transform 0.2s',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              Sign In / Create Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

