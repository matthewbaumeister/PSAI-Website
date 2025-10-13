'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface UploadedFile {
  id: string;
  filename: string;
  fileType: string;
  status: string;
  uploadedAt: string;
  stats: {
    chunkCount: number;
    embeddingCount: number;
    characterCount: number;
  };
}

interface SearchResult {
  chunkId: string;
  fileId: string;
  filename: string;
  content: string;
  similarity: number;
  pageNumber?: number;
  sectionHeader?: string;
}

export default function RAGSearchPage() {
  const router = useRouter();
  
  // Unified input state
  const [inputText, setInputText] = useState('');
  const [processing, setProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  
  // Intent detection
  const [detectedIntent, setDetectedIntent] = useState<'search' | 'index' | 'ambiguous' | null>(null);
  
  // Files state
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(true);
  
  // Search results state
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchStats, setSearchStats] = useState<any>(null);
  const [lastIndexedFileId, setLastIndexedFileId] = useState<string | null>(null);

  // Load uploaded files
  useEffect(() => {
    loadFiles();
  }, []);

  // Detect intent as user types
  useEffect(() => {
    if (!inputText.trim()) {
      setDetectedIntent(null);
      return;
    }

    const wordCount = inputText.trim().split(/\s+/).length;
    const charCount = inputText.trim().length;

    if (wordCount < 10 || charCount < 50) {
      setDetectedIntent('search');
    } else if (wordCount > 150 || charCount > 800) {
      setDetectedIntent('index');
    } else {
      setDetectedIntent('ambiguous');
    }
  }, [inputText]);

  const loadFiles = async () => {
    try {
      setLoadingFiles(true);
      const response = await fetch('/api/admin/rag/files');
      const data = await response.json();
      
      if (data.success) {
        setUploadedFiles(data.files);
      }
    } catch (error) {
      console.error('Error loading files:', error);
    } finally {
      setLoadingFiles(false);
    }
  };

  const handleSmartAnalyze = async (forceMode?: 'search' | 'index') => {
    if (!inputText.trim()) {
      alert('Please enter text');
      return;
    }

    const mode = forceMode || detectedIntent;

    if (mode === 'search' || mode === 'ambiguous') {
      await handleSearch();
    } else if (mode === 'index') {
      await handleIndex();
    }
  };

  const handleSearch = async () => {
    try {
      setProcessing(true);
      setProcessingStatus('Searching database...');
      
      const response = await fetch('/api/admin/rag/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: inputText.trim(),
          // No fileId = search ALL documents
          matchThreshold: 0.5,
          matchCount: 20
        })
      });

      const data = await response.json();

      if (data.success) {
        setSearchResults(data.results);
        setSearchStats(data.stats);
        setProcessingStatus('');
        
        // Reload files list (files may have been deleted after search)
        await loadFiles();
        
      } else {
        alert(`Search failed: ${data.error}`);
        setProcessingStatus('');
      }

    } catch (error) {
      console.error('Search error:', error);
      alert('Search failed');
      setProcessingStatus('');
    } finally {
      setProcessing(false);
    }
  };

  const handleIndex = async () => {
    try {
      setProcessing(true);
      setProcessingStatus('Indexing document...');

      const response = await fetch('/api/admin/rag/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: inputText,
          filename: `doc-${Date.now()}.txt`,
          type: 'paste'
        })
      });

      const data = await response.json();

      if (data.success) {
        const expiresAt = data.security?.expiresAt 
          ? new Date(data.security.expiresAt).toLocaleTimeString() 
          : '1 hour';
        
        setProcessingStatus(
          `Indexed! ${data.stats.chunkCount} chunks, ${data.stats.embeddingCount} embeddings. ` +
          `EPHEMERAL: Auto-deletes after search or at ${expiresAt}`
        );
        
        setLastIndexedFileId(data.fileId);
        
        // Clear input
        setInputText('');
        
        // Reload files
        await loadFiles();
        
        // Clear status after 8 seconds
        setTimeout(() => {
          setProcessingStatus('');
        }, 8000);
      } else {
        alert(`Indexing failed: ${data.error}`);
        setProcessingStatus('');
      }

    } catch (error) {
      console.error('Indexing error:', error);
      alert('Indexing failed');
      setProcessingStatus('');
    } finally {
      setProcessing(false);
    }
  };

  const handleSearchLastIndexed = async () => {
    if (!lastIndexedFileId) return;

    try {
      setProcessing(true);
      setProcessingStatus('Searching last indexed document...');
      
      const response = await fetch('/api/admin/rag/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: undefined,
          fileId: lastIndexedFileId,
          matchThreshold: 0.5,
          matchCount: 20
        })
      });

      const data = await response.json();

      if (data.success) {
        setSearchResults(data.results);
        setSearchStats(data.stats);
        setProcessingStatus('');
        setLastIndexedFileId(null); // File was deleted
        await loadFiles();
      } else {
        alert(`Search failed: ${data.error}`);
        setProcessingStatus('');
      }

    } catch (error) {
      console.error('Search error:', error);
      alert('Search failed');
      setProcessingStatus('');
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm('Delete this file and all its data?')) return;

    try {
      const response = await fetch(`/api/admin/rag/files?id=${fileId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        await loadFiles();
      } else {
        alert(`Delete failed: ${data.error}`);
      }

    } catch (error) {
      console.error('Delete error:', error);
      alert('Delete failed');
    }
  };

  // Get smart button label
  const getButtonLabel = () => {
    if (processing) return processingStatus || 'Processing...';
    if (!inputText.trim()) return 'Enter text to analyze';
    
    if (detectedIntent === 'search') return 'Search Database';
    if (detectedIntent === 'index') return 'Index Document';
    if (detectedIntent === 'ambiguous') return 'Analyze';
    
    return 'Analyze';
  };

  // Get intent hint
  const getIntentHint = () => {
    if (!inputText.trim()) return null;
    
    const wordCount = inputText.trim().split(/\s+/).length;
    
    if (detectedIntent === 'search') {
      return { color: '#60a5fa', text: `${wordCount} words - Will search existing documents` };
    }
    if (detectedIntent === 'index') {
      return { color: '#10b981', text: `${wordCount} words - Will index as new document` };
    }
    if (detectedIntent === 'ambiguous') {
      return { color: '#fbbf24', text: `${wordCount} words - Ambiguous length. Choose action:` };
    }
    
    return null;
  };

  const intentHint = getIntentHint();

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      color: '#ffffff',
      padding: '40px 20px'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '30px' }}>
          <Link
            href="/admin"
            style={{
              color: '#60a5fa',
              textDecoration: 'none',
              fontSize: '14px',
              display: 'inline-block',
              marginBottom: '15px'
            }}
          >
            ← Back to Admin Dashboard
          </Link>
          
          <h1 style={{ 
            fontSize: '32px', 
            fontWeight: '700', 
            marginBottom: '10px'
          }}>
            Document Intelligence Search
          </h1>
          
          <p style={{ color: '#94a3b8', fontSize: '16px', marginBottom: '16px' }}>
            Smart search that auto-detects: Search queries, new documents to index, or uploaded files
          </p>

          {/* SECURITY WARNING */}
          <div style={{
            background: 'rgba(245, 158, 11, 0.1)',
            border: '2px solid rgba(245, 158, 11, 0.4)',
            borderRadius: '12px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px'
          }}>
            <div>
              <div style={{ 
                color: '#fbbf24', 
                fontWeight: '600', 
                fontSize: '15px',
                marginBottom: '6px'
              }}>
                EPHEMERAL MODE - Maximum Security
              </div>
              <div style={{ color: '#fcd34d', fontSize: '13px', lineHeight: '1.5' }}>
                • Documents processed in temporary storage only<br/>
                • Original text NEVER stored<br/>
                • Auto-deleted after search OR in 1 hour<br/>
                • No search history or user tracking
              </div>
            </div>
          </div>
        </div>

        {/* Unified Smart Search */}
        <div style={{
          background: 'rgba(30, 41, 59, 0.5)',
          border: '1px solid rgba(51, 65, 85, 0.6)',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px'
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>
            Smart Search & Index
          </h2>

          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Enter search query (short) or paste document to index (long)...

Examples:
• 'artificial intelligence defense' - Searches existing documents
• Paste 500+ word capabilities doc - Indexes for future search"
            disabled={processing}
            style={{
              width: '100%',
              minHeight: '200px',
              padding: '16px',
              background: 'rgba(15, 23, 42, 0.6)',
              border: '2px solid rgba(71, 85, 105, 0.5)',
              borderRadius: '8px',
              color: '#ffffff',
              fontSize: '15px',
              fontFamily: 'inherit',
              resize: 'vertical',
              marginBottom: '12px'
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                handleSmartAnalyze();
              }
            }}
          />

          {/* Intent hint */}
          {intentHint && (
            <div style={{
              padding: '10px 14px',
              background: `rgba(${intentHint.color === '#60a5fa' ? '59, 130, 246' : intentHint.color === '#10b981' ? '16, 185, 129' : '245, 158, 11'}, 0.15)`,
              border: `1px solid ${intentHint.color}40`,
              borderRadius: '6px',
              fontSize: '13px',
              color: intentHint.color,
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span>{intentHint.text}</span>
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {detectedIntent === 'ambiguous' ? (
              <>
                <button
                  onClick={() => handleSmartAnalyze('search')}
                  disabled={processing || !inputText.trim()}
                  style={{
                    flex: 1,
                    padding: '14px 24px',
                    background: processing ? 'rgba(100, 116, 139, 0.3)' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: processing ? 'not-allowed' : 'pointer'
                  }}
                >
                  Search Database
                </button>
                <button
                  onClick={() => handleSmartAnalyze('index')}
                  disabled={processing || !inputText.trim()}
                  style={{
                    flex: 1,
                    padding: '14px 24px',
                    background: processing ? 'rgba(100, 116, 139, 0.3)' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: processing ? 'not-allowed' : 'pointer'
                  }}
                >
                  Index Document
                </button>
              </>
            ) : (
              <button
                onClick={() => handleSmartAnalyze()}
                disabled={processing || !inputText.trim()}
                style={{
                  flex: 1,
                  padding: '14px 24px',
                  background: processing 
                    ? 'rgba(100, 116, 139, 0.3)' 
                    : detectedIntent === 'index'
                    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                    : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: processing || !inputText.trim() ? 'not-allowed' : 'pointer'
                }}
              >
                {getButtonLabel()}
              </button>
            )}
          </div>

          {processingStatus && (
            <div style={{
              marginTop: '12px',
              padding: '12px',
              background: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              borderRadius: '6px',
              fontSize: '13px',
              color: '#22c55e'
            }}>
              {processingStatus}
            </div>
          )}

          {/* Follow-up search for last indexed doc */}
          {lastIndexedFileId && (
            <div style={{
              marginTop: '16px',
              padding: '16px',
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '8px'
            }}>
              <p style={{ fontSize: '14px', marginBottom: '10px', color: '#94a3b8' }}>
                Document indexed! Want to search it?
              </p>
              <button
                onClick={handleSearchLastIndexed}
                disabled={processing}
                style={{
                  padding: '10px 20px',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Search This Document
              </button>
            </div>
          )}

          <div style={{
            marginTop: '16px',
            fontSize: '12px',
            color: '#64748b',
            textAlign: 'center'
          }}>
            Tip: Press Cmd/Ctrl + Enter to analyze
          </div>
        </div>

        {/* Optional PDF Upload (Disabled) */}
        <div style={{
          background: 'rgba(30, 41, 59, 0.3)',
          border: '1px solid rgba(51, 65, 85, 0.4)',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '24px',
          opacity: 0.6
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '10px' }}>
            Upload PDF (Coming Soon)
          </h3>
          <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '10px' }}>
            PDF upload temporarily disabled. Use text paste above.
          </p>
          <input
            type="file"
            accept=".pdf"
            disabled
            style={{
              padding: '10px',
              background: 'rgba(15, 23, 42, 0.4)',
              border: '1px solid rgba(71, 85, 105, 0.3)',
              borderRadius: '6px',
              color: '#64748b',
              cursor: 'not-allowed'
            }}
          />
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div style={{
            background: 'rgba(30, 41, 59, 0.5)',
            border: '1px solid rgba(51, 65, 85, 0.6)',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px'
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px' }}>
              Search Results ({searchResults.length})
            </h2>

            {searchStats && (
              <div style={{ 
                padding: '10px 14px',
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '6px',
                fontSize: '12px',
                color: '#94a3b8',
                marginBottom: '16px'
              }}>
                Found in {searchStats.responseTimeMs}ms • Avg similarity: {(searchStats.avgSimilarity * 100).toFixed(1)}%
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {searchResults.map((result, index) => (
                <div
                  key={result.chunkId}
                  style={{
                    padding: '16px',
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(71, 85, 105, 0.3)',
                    borderRadius: '8px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <span style={{ 
                        padding: '4px 10px',
                        background: 'rgba(34, 197, 94, 0.2)',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: '#22c55e'
                      }}>
                        #{index + 1} • {(result.similarity * 100).toFixed(1)}% match
                      </span>
                      {result.sectionHeader && (
                        <span style={{ 
                          marginLeft: '8px',
                          fontSize: '12px',
                          color: '#94a3b8'
                        }}>
                          {result.sectionHeader}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                      {result.filename} {result.pageNumber && `• Page ${result.pageNumber}`}
                    </div>
                  </div>
                  <div style={{ 
                    fontSize: '14px',
                    lineHeight: '1.7',
                    color: '#cbd5e1'
                  }}>
                    {result.content}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Indexed Documents */}
        <div style={{
          background: 'rgba(30, 41, 59, 0.5)',
          border: '1px solid rgba(51, 65, 85, 0.6)',
          borderRadius: '12px',
          padding: '24px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600' }}>
              Indexed Documents ({uploadedFiles.length})
            </h2>
            <div style={{
              padding: '6px 12px',
              background: 'rgba(245, 158, 11, 0.2)',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              borderRadius: '6px',
              fontSize: '11px',
              color: '#fbbf24',
              fontWeight: '600'
            }}>
              Auto-delete in 1hr or after search
            </div>
          </div>

          {loadingFiles ? (
            <p style={{ color: '#94a3b8', textAlign: 'center', padding: '20px' }}>Loading...</p>
          ) : uploadedFiles.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '32px',
              color: '#94a3b8'
            }}>
              <p>No documents indexed yet.</p>
              <p style={{ fontSize: '13px', marginTop: '8px', color: '#64748b' }}>
                Paste a long document above to index it for search
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {uploadedFiles.map(file => (
                <div
                  key={file.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '14px',
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(71, 85, 105, 0.3)',
                    borderRadius: '8px'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '500', fontSize: '14px' }}>{file.filename}</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                      {file.stats.chunkCount} chunks • {file.stats.embeddingCount} embeddings • {file.status}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteFile(file.id)}
                    style={{
                      padding: '6px 12px',
                      background: 'rgba(239, 68, 68, 0.2)',
                      border: '1px solid rgba(239, 68, 68, 0.4)',
                      borderRadius: '4px',
                      color: '#f87171',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
