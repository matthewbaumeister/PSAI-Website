/**
 * Q&A Content Formatter
 * Cleans HTML tags and formats Q&A content professionally
 */

import React from 'react';

interface QAPair {
  question: string;
  answer: string;
  questionNumber: number;
}

/**
 * Removes HTML tags and entities, preserves structure
 */
function stripHtml(html: string): string {
  if (!html) return '';
  
  let text = html;
  
  // Replace common HTML entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&hellip;/g, '...')
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&rdquo;/g, '"')
    .replace(/&ldquo;/g, '"');
  
  // Convert ordered/unordered lists to plain text with bullets
  text = text.replace(/<ol[^>]*>/gi, '\n');
  text = text.replace(/<\/ol>/gi, '\n');
  text = text.replace(/<ul[^>]*>/gi, '\n');
  text = text.replace(/<\/ul>/gi, '\n');
  text = text.replace(/<li[^>]*>/gi, '\n  • ');
  text = text.replace(/<\/li>/gi, '');
  
  // Convert links to readable format
  text = text.replace(/<a\s+href="([^"]+)"[^>]*>([^<]+)<\/a>/gi, '$2 ($1)');
  
  // Convert paragraphs and divs to line breaks
  text = text.replace(/<p[^>]*>/gi, '\n');
  text = text.replace(/<\/p>/gi, '\n');
  text = text.replace(/<div[^>]*>/gi, '\n');
  text = text.replace(/<\/div>/gi, '\n');
  text = text.replace(/<br\s*\/?>/gi, '\n');
  
  // Remove all remaining HTML tags
  text = text.replace(/<[^>]+>/g, '');
  
  // Clean up excessive whitespace
  text = text.replace(/\n{3,}/g, '\n\n'); // Max 2 consecutive newlines
  text = text.replace(/[ \t]+/g, ' '); // Collapse spaces/tabs
  text = text.replace(/^\s+|\s+$/gm, ''); // Trim each line
  
  return text.trim();
}

/**
 * Parse Q&A content into structured pairs
 */
export function parseQAContent(content: string): QAPair[] {
  if (!content) return [];
  
  const pairs: QAPair[] = [];
  
  // Match Q1:, Q2:, etc. patterns
  const qaPattern = /Q(\d+):\s*([\s\S]*?)(?=Q\d+:|$)/g;
  let match;
  
  while ((match = qaPattern.exec(content)) !== null) {
    const questionNumber = parseInt(match[1]);
    const rawText = match[2].trim();
    
    // Split on "A:" to separate question from answer
    const parts = rawText.split(/\nA:\s*/);
    
    if (parts.length >= 1) {
      const question = stripHtml(parts[0]).trim();
      const answer = parts.length > 1 ? stripHtml(parts[1]).trim() : 'Answer pending';
      
      if (question) {
        pairs.push({
          questionNumber,
          question,
          answer
        });
      }
    }
  }
  
  return pairs;
}

/**
 * Format Q&A content for React display
 */
export function formatQAForDisplay(content: string): React.ReactElement | null {
  const pairs = parseQAContent(content);
  
  if (pairs.length === 0) {
    return null;
  }
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {pairs.map((pair) => (
        <div 
          key={pair.questionNumber}
          style={{
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid rgba(71, 85, 105, 0.4)',
            borderRadius: '12px',
            padding: '24px',
            transition: 'all 0.2s'
          }}
        >
          {/* Question Header */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'flex-start', 
            gap: '12px',
            marginBottom: '16px'
          }}>
            <div style={{
              minWidth: '32px',
              height: '32px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '700',
              fontSize: '14px',
              color: '#fff',
              flexShrink: 0
            }}>
              Q{pair.questionNumber}
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{
                color: '#e2e8f0',
                fontSize: '16px',
                fontWeight: '600',
                margin: 0,
                lineHeight: '1.6'
              }}>
                {pair.question}
              </h3>
            </div>
          </div>
          
          {/* Answer Section */}
          <div style={{ 
            paddingLeft: '44px',
            borderLeft: '3px solid rgba(16, 185, 129, 0.3)',
            marginLeft: '16px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '12px'
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                <path d="M9 12l2 2 4-4"></path>
                <circle cx="12" cy="12" r="10"></circle>
              </svg>
              <span style={{
                color: '#10b981',
                fontSize: '13px',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Official Answer
              </span>
            </div>
            <p style={{
              color: '#cbd5e1',
              fontSize: '14px',
              lineHeight: '1.8',
              margin: 0,
              whiteSpace: 'pre-wrap'
            }}>
              {pair.answer}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Simple text-only formatter (no React elements)
 */
export function formatQAAsText(content: string): string {
  const pairs = parseQAContent(content);
  
  if (pairs.length === 0) {
    return 'No Q&A content available.';
  }
  
  return pairs.map((pair) => {
    return `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 QUESTION ${pair.questionNumber}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${pair.question}

✓ OFFICIAL ANSWER:
${pair.answer}
`;
  }).join('\n\n');
}

