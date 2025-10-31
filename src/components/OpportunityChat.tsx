'use client';

import React, { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface OpportunityChatProps {
  isOpen: boolean;
  onClose: () => void;
  opportunityData: any;
}

// Simple markdown renderer for chat messages
function renderMarkdown(text: string) {
  // Split by lines for proper list rendering
  const lines = text.split('\n');
  const elements: JSX.Element[] = [];
  let inList = false;
  let listItems: string[] = [];

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} style={{ margin: '8px 0', paddingLeft: '24px' }}>
          {listItems.map((item, idx) => (
            <li key={idx} dangerouslySetInnerHTML={{ __html: formatInline(item) }} />
          ))}
        </ul>
      );
      listItems = [];
    }
  };

  const formatInline = (line: string) => {
    return line
      // Bold: **text** or __text__
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/__(.+?)__/g, '<strong>$1</strong>')
      // Italic: *text* or _text_
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/_(.+?)_/g, '<em>$1</em>')
      // Code: `text`
      .replace(/`(.+?)`/g, '<code style="background: rgba(59, 130, 246, 0.2); padding: 2px 6px; border-radius: 4px; font-family: monospace;">$1</code>');
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    
    // Bullet points: - item or • item or * item
    if (trimmed.match(/^[-•\*]\s+/)) {
      const content = trimmed.replace(/^[-•\*]\s+/, '');
      listItems.push(content);
      inList = true;
    } else {
      // Flush any pending list
      if (inList) {
        flushList();
        inList = false;
      }
      
      // Regular paragraph
      if (trimmed) {
        elements.push(
          <p
            key={index}
            style={{ margin: '0 0 8px 0' }}
            dangerouslySetInnerHTML={{ __html: formatInline(trimmed) }}
          />
        );
      } else if (elements.length > 0) {
        // Empty line = spacing
        elements.push(<div key={`space-${index}`} style={{ height: '8px' }} />);
      }
    }
  });

  // Flush any remaining list
  flushList();

  return <div>{elements}</div>;
}

export default function OpportunityChat({ isOpen, onClose, opportunityData }: OpportunityChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hi! I'm your AI assistant for this opportunity. I can answer questions about:\n\n• Submission requirements and deadlines\n• Funding amounts and phases\n• Technical focus areas\n• Eligibility and restrictions\n• Q&A from the program office\n• Any other details about this opportunity\n\nWhat would you like to know?`,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/admin/opportunity-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          question: userMessage.content,
          opportunityData: opportunityData,
          conversationHistory: messages
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to get response');
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: result.answer,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          zIndex: 999,
          animation: 'fadeIn 0.2s ease-out'
        }}
      />

      {/* Chat Modal */}
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '90%',
        maxWidth: '800px',
        height: '80vh',
        maxHeight: '700px',
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        borderRadius: '16px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        animation: 'slideUp 0.3s ease-out'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid rgba(59, 130, 246, 0.2)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h3 style={{
              color: '#ffffff',
              fontSize: '18px',
              fontWeight: '600',
              margin: '0 0 4px 0'
            }}>
              AI Opportunity Assistant
            </h3>
            <p style={{
              color: '#94a3b8',
              fontSize: '13px',
              margin: 0
            }}>
              {opportunityData.topic_number} - {opportunityData.title?.substring(0, 60)}...
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              padding: '8px 12px',
              color: '#ef4444',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
            }}
          >
            Close
          </button>
        </div>

        {/* Messages Container */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          {messages.map((message, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start'
              }}
            >
              <div style={{
                maxWidth: '75%',
                background: message.role === 'user' 
                  ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                  : 'rgba(30, 41, 59, 0.8)',
                border: message.role === 'user'
                  ? '1px solid rgba(59, 130, 246, 0.5)'
                  : '1px solid rgba(148, 163, 184, 0.2)',
                borderRadius: '12px',
                padding: '12px 16px',
                color: '#ffffff',
                fontSize: '14px',
                lineHeight: '1.6'
              }}>
                {renderMarkdown(message.content)}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div style={{
                background: 'rgba(30, 41, 59, 0.8)',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                borderRadius: '12px',
                padding: '12px 16px',
                display: 'flex',
                gap: '8px',
                alignItems: 'center'
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#60a5fa',
                  animation: 'pulse 1.5s ease-in-out infinite'
                }} />
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#60a5fa',
                  animation: 'pulse 1.5s ease-in-out infinite 0.2s'
                }} />
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#60a5fa',
                  animation: 'pulse 1.5s ease-in-out infinite 0.4s'
                }} />
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} style={{
          padding: '20px 24px',
          borderTop: '1px solid rgba(59, 130, 246, 0.2)',
          display: 'flex',
          gap: '12px'
        }}>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about this opportunity..."
            disabled={isLoading}
            style={{
              flex: 1,
              background: 'rgba(30, 41, 59, 0.6)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '8px',
              padding: '12px 16px',
              color: '#ffffff',
              fontSize: '14px',
              outline: 'none',
              transition: 'all 0.2s'
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.6)';
              e.currentTarget.style.background = 'rgba(30, 41, 59, 0.8)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)';
              e.currentTarget.style.background = 'rgba(30, 41, 59, 0.6)';
            }}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            style={{
              background: input.trim() && !isLoading
                ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                : 'rgba(71, 85, 105, 0.3)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '8px',
              padding: '12px 24px',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: '600',
              cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (input.trim() && !isLoading) {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            Send
          </button>
        </form>
      </div>

      {/* Animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translate(-50%, -45%);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%);
          }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.4; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </>
  );
}

