'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatQAForDisplay } from '@/lib/qa-formatter';

interface OpportunityData {
  topic_number: string;
  topic_id: string;
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

interface ShareInfo {
  expiresAt: string;
  viewsCount: number;
}

export default function SharedOpportunityPage() {
  const params = useParams();
  const router = useRouter();
  const token = params?.token as string;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<OpportunityData | null>(null);
  const [shareInfo, setShareInfo] = useState<ShareInfo | null>(null);
  const [qaExpanded, setQaExpanded] = useState(false);
  const [instructionsExpanded, setInstructionsExpanded] = useState(false);
  
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

  useEffect(() => {
    if (!token) return;

    async function fetchSharedOpportunity() {
      try {
        const response = await fetch(`/api/share/opportunity?token=${token}`);
        const result = await response.json();

        if (result.success) {
          const opportunityData = result.data.opportunity;
          setData(opportunityData);
          setShareInfo(result.data.shareInfo);
          
          // Store share info for redirect after sign-in
          if (opportunityData.topic_number) {
            localStorage.setItem('share_redirect', opportunityData.topic_number);
            localStorage.setItem('share_token', token);
          }
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
  
  // Handle sign-in redirect
  const handleSignIn = () => {
    if (data?.topic_number) {
      // Redirect to login with return URL
      router.push(`/auth/login?returnTo=/opportunities/${data.topic_number}`);
    } else {
      router.push('/auth/login');
    }
  };

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
  
  // Check if opportunity is active or closed
  const isActive = data.status && ['open', 'prerelease', 'pre-release', 'active', 'prelease'].includes(data.status.toLowerCase());
  const isClosed = data.status && ['closed', 'awarded', 'cancelled', 'canceled'].includes(data.status.toLowerCase());

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
          <button
            onClick={handleSignIn}
            style={{
              padding: '8px 16px',
              background: 'rgba(59, 130, 246, 0.2)',
              border: '1px solid rgba(59, 130, 246, 0.4)',
              borderRadius: '6px',
              color: '#60a5fa',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.3)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)'}
          >
            Sign In for Full Access
          </button>
        </div>

        {/* Blocked AI Chat Feature Notice */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(124, 58, 237, 0.1) 100%)',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          borderRadius: '12px',
          padding: '16px 24px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              <path d="M12 7v6"></path>
              <circle cx="12" cy="17" r="1"></circle>
            </svg>
            <div>
              <div style={{ color: '#a78bfa', fontSize: '14px', fontWeight: '600' }}>
                AI Assistant Available with Full Access
              </div>
              <div style={{ color: '#cbd5e1', fontSize: '12px', marginTop: '2px' }}>
                Ask questions about requirements, deadlines, and submission details
              </div>
            </div>
          </div>
          <button
            onClick={handleSignIn}
            style={{
              padding: '8px 16px',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              border: '1px solid rgba(139, 92, 246, 0.4)',
              borderRadius: '6px',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)';
            }}
          >
            Sign In to Use AI Chat
          </button>
        </div>

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
              background: isActive 
                ? 'rgba(16, 185, 129, 0.2)' 
                : isClosed 
                ? 'rgba(251, 146, 60, 0.2)' 
                : 'rgba(100, 116, 139, 0.2)',
              border: `1px solid ${isActive ? 'rgba(16, 185, 129, 0.4)' : isClosed ? 'rgba(251, 146, 60, 0.4)' : 'rgba(100, 116, 139, 0.4)'}`,
              borderRadius: '6px',
              color: isActive ? '#6ee7b7' : isClosed ? '#fbbf24' : '#cbd5e1',
              fontSize: '13px',
              fontWeight: '600'
            }}>
              {isActive && '🟢 '}{isClosed && '🔒 '}{data.status}
            </span>
            {isClosed && (
              <span style={{ 
                padding: '6px 12px',
                background: 'rgba(120, 113, 108, 0.2)',
                border: '1px solid rgba(168, 162, 158, 0.3)',
                borderRadius: '6px',
                color: '#a8a29e',
                fontSize: '11px',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Historical Record
              </span>
            )}
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
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
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
                  {data.topic_question_count} Q&As
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

        </div>

        {/* Tech Areas */}
        {data.technology_areas && (
          <div style={{ 
            background: 'rgba(30, 41, 59, 0.6)',
            border: '1px solid rgba(71, 85, 105, 0.4)',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px'
          }}>
            <h2 style={{ 
              color: '#e2e8f0',
              fontSize: '20px',
              fontWeight: '600',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
              </svg>
              Technology Areas
            </h2>
            <div style={{ 
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              {data.technology_areas.split(',').map((area, index) => (
                <span key={index} style={{
                  padding: '8px 16px',
                  background: 'rgba(167, 139, 250, 0.2)',
                  border: '1px solid rgba(167, 139, 250, 0.4)',
                  borderRadius: '8px',
                  color: '#c4b5fd',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
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
            border: '1px solid rgba(71, 85, 105, 0.4)',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px'
          }}>
            <h2 style={{ 
              color: '#e2e8f0',
              fontSize: '20px',
              fontWeight: '600',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
              Keywords
            </h2>
            <div style={{ 
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              {data.keywords.split(/[;,]/).map((keyword, index) => (
                <span key={index} style={{
                  padding: '6px 12px',
                  background: 'rgba(96, 165, 250, 0.2)',
                  border: '1px solid rgba(96, 165, 250, 0.3)',
                  borderRadius: '6px',
                  color: '#93c5fd',
                  fontSize: '13px',
                  fontWeight: '500'
                }}>
                  {keyword.trim()}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Description Section */}
        {(data.objectives || data.description) && (
          <div style={{ 
            background: 'rgba(30, 41, 59, 0.6)',
            border: '1px solid rgba(71, 85, 105, 0.4)',
            borderRadius: '12px',
            padding: '28px',
            marginBottom: '24px'
          }}>
            <h2 style={{ 
              color: '#e2e8f0',
              fontSize: '20px',
              fontWeight: '600',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2">
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
            border: '1px solid rgba(71, 85, 105, 0.4)',
            borderRadius: '12px',
            padding: '28px',
            marginBottom: '24px'
          }}>
            <h2 style={{ 
              color: '#e2e8f0',
              fontSize: '20px',
              fontWeight: '600',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <polyline points="19 12 12 19 5 12"></polyline>
              </svg>
              Phase Descriptions
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {data.phase_1_description && (
                <div style={{
                  padding: '20px',
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '8px'
                }}>
                  <h3 style={{ color: '#10b981', fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
                    Phase I
                  </h3>
                  <p style={{ color: '#cbd5e1', fontSize: '14px', lineHeight: '1.7' }}>
                    {data.phase_1_description}
                  </p>
                </div>
              )}
              {data.phase_2_description && (
                <div style={{
                  padding: '20px',
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: '8px'
                }}>
                  <h3 style={{ color: '#60a5fa', fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
                    Phase II
                  </h3>
                  <p style={{ color: '#cbd5e1', fontSize: '14px', lineHeight: '1.7' }}>
                    {data.phase_2_description}
                  </p>
                </div>
              )}
              {data.phase_3_description && (
                <div style={{
                  padding: '20px',
                  background: 'rgba(139, 92, 246, 0.1)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  borderRadius: '8px'
                }}>
                  <h3 style={{ color: '#a78bfa', fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
                    Phase III
                  </h3>
                  <p style={{ color: '#cbd5e1', fontSize: '14px', lineHeight: '1.7' }}>
                    {data.phase_3_description}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Q&A Section - Collapsible */}
        {data.qa_content && data.topic_question_count > 0 && (
          <div id="qa-section" style={{ 
            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(16, 185, 129, 0.15) 100%)',
            border: '1px solid rgba(34, 197, 94, 0.4)',
            borderRadius: '12px',
            overflow: 'hidden',
            marginBottom: '32px'
          }}>
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
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(34, 197, 94, 0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  padding: '12px',
                  background: 'rgba(34, 197, 94, 0.3)',
                  borderRadius: '8px'
                }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#86efac" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
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
                    Community questions and official answers
                  </p>
                </div>
              </div>
              <div style={{
                padding: '8px',
                background: qaExpanded ? 'rgba(34, 197, 94, 0.3)' : 'rgba(71, 85, 105, 0.3)',
                borderRadius: '6px',
                transition: 'all 0.2s'
              }}>
                <svg 
                  width="24" 
                  height="24" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke={qaExpanded ? '#86efac' : '#cbd5e1'}
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
                  {formatQAForDisplay(data.qa_content || '')}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Instructions Section - Collapsible */}
        {data.instructions_plain_text && (
          <div style={{ 
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%)',
            border: '1px solid rgba(59, 130, 246, 0.4)',
            borderRadius: '12px',
            overflow: 'hidden',
            marginBottom: '32px'
          }}>
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
                    Merged component & BAA guidance with source citations
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
                
                <div style={{ 
                  maxHeight: '800px',
                  overflowY: 'auto',
                  paddingRight: '8px'
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
                    {data.instructions_plain_text}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

