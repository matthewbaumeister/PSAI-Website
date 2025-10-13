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
  
  // Upload state
  const [uploadMode, setUploadMode] = useState<'pdf' | 'paste'>('pdf');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [pasteText, setPasteText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  
  // Files state
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [cleaningUp, setCleaningUp] = useState(false);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchByFile, setSearchByFile] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchStats, setSearchStats] = useState<any>(null);

  // Load uploaded files
  useEffect(() => {
    loadFiles();
  }, []);

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

  const handleFileUpload = async () => {
    if (!uploadFile && !pasteText.trim()) {
      alert('Please select a file or paste text');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress('Uploading...');

      const formData = new FormData();
      
      if (uploadMode === 'pdf' && uploadFile) {
        formData.append('file', uploadFile);
      } else if (uploadMode === 'paste') {
        const blob = new Blob([pasteText], { type: 'text/plain' });
        formData.append('file', blob, 'pasted-text.txt');
      }

      setUploadProgress('Processing document...');
      
      const response = await fetch('/api/admin/rag/ingest', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        const expiresAt = data.security?.expiresAt 
          ? new Date(data.security.expiresAt).toLocaleTimeString() 
          : '1 hour';
        
        setUploadProgress(
          `✅ Processed! ${data.stats.chunkCount} chunks, ${data.stats.embeddingCount} embeddings\n` +
          `🔒 EPHEMERAL: Auto-deletes after search or at ${expiresAt}`
        );
        
        // Reset form
        setUploadFile(null);
        setPasteText('');
        
        // Reload files
        await loadFiles();
        
        // Clear progress after 5 seconds (longer to read security message)
        setTimeout(() => {
          setUploadProgress('');
        }, 5000);
      } else {
        alert(`Upload failed: ${data.error}`);
      }

    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() && !searchByFile) {
      alert('Please enter a search query or select a document');
      return;
    }

    try {
      setSearching(true);
      
      const response = await fetch('/api/admin/rag/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery.trim() || undefined,
          fileId: searchByFile || undefined,
          matchThreshold: 0.5,
          matchCount: 20
        })
      });

      const data = await response.json();

      if (data.success) {
        setSearchResults(data.results);
        setSearchStats(data.stats);
        
        // Reload files list (file may have been deleted if searching by document)
        await loadFiles();
        
        // Show security notification
        if (data.security?.action) {
          console.log(`🔒 EPHEMERAL MODE: ${data.security.action}`);
        }
      } else {
        alert(`Search failed: ${data.error}`);
      }

    } catch (error) {
      console.error('Search error:', error);
      alert('Search failed');
    } finally {
      setSearching(false);
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

  const handleCleanupExpired = async () => {
    if (!confirm('Delete all expired files (older than 1 hour)?')) return;

    setCleaningUp(true);
    try {
      const response = await fetch('/api/admin/rag/cleanup', {
        method: 'POST'
      });

      const data = await response.json();

      if (data.success) {
        alert(`✅ Cleanup complete: ${data.deleted} expired files deleted`);
        await loadFiles();
      } else {
        alert(`Cleanup failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Cleanup error:', error);
      alert('Cleanup failed');
    } finally {
      setCleaningUp(false);
    }
  };

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
            🔍 Document Intelligence Search
          </h1>
          
          <p style={{ color: '#94a3b8', fontSize: '16px', marginBottom: '16px' }}>
            Upload capabilities documents → Search SBIR/STTR opportunities by semantic similarity
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
            <div style={{ fontSize: '24px' }}>🔒</div>
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
                • Documents are processed in temporary storage only<br/>
                • Original text is NEVER stored<br/>
                • All data auto-deleted after search OR in 1 hour<br/>
                • No search history or user tracking<br/>
                • Compliant with ITAR and export control requirements
              </div>
            </div>
          </div>
        </div>

        {/* Upload Section */}
        <div style={{
          background: 'rgba(30, 41, 59, 0.5)',
          border: '1px solid rgba(51, 65, 85, 0.6)',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px'
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>
            📤 Upload Capabilities Document
          </h2>

          {/* Mode Selector */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
            <button
              onClick={() => setUploadMode('pdf')}
              style={{
                padding: '8px 16px',
                background: uploadMode === 'pdf' ? '#3b82f6' : 'rgba(59, 130, 246, 0.2)',
                border: `1px solid ${uploadMode === 'pdf' ? '#3b82f6' : 'rgba(59, 130, 246, 0.4)'}`,
                borderRadius: '6px',
                color: '#ffffff',
                cursor: 'pointer'
              }}
            >
              📄 Upload PDF
            </button>
            <button
              onClick={() => setUploadMode('paste')}
              style={{
                padding: '8px 16px',
                background: uploadMode === 'paste' ? '#3b82f6' : 'rgba(59, 130, 246, 0.2)',
                border: `1px solid ${uploadMode === 'paste' ? '#3b82f6' : 'rgba(59, 130, 246, 0.4)'}`,
                borderRadius: '6px',
                color: '#ffffff',
                cursor: 'pointer'
              }}
            >
              📝 Paste Text
            </button>
          </div>

          {/* Upload Area */}
          {uploadMode === 'pdf' ? (
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              disabled={uploading}
              style={{
                width: '100%',
                padding: '12px',
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(71, 85, 105, 0.5)',
                borderRadius: '6px',
                color: '#ffffff',
                marginBottom: '12px'
              }}
            />
          ) : (
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="Paste your capabilities document text here..."
              disabled={uploading}
              style={{
                width: '100%',
                minHeight: '200px',
                padding: '12px',
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(71, 85, 105, 0.5)',
                borderRadius: '6px',
                color: '#ffffff',
                fontSize: '14px',
                fontFamily: 'monospace',
                resize: 'vertical',
                marginBottom: '12px'
              }}
            />
          )}

          <button
            onClick={handleFileUpload}
            disabled={uploading || (!uploadFile && !pasteText.trim())}
            style={{
              padding: '12px 24px',
              background: uploading ? 'rgba(100, 116, 139, 0.3)' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: 'none',
              borderRadius: '8px',
              color: '#ffffff',
              fontSize: '15px',
              fontWeight: '600',
              cursor: uploading ? 'not-allowed' : 'pointer'
            }}
          >
            {uploading ? uploadProgress : '🚀 Process & Index'}
          </button>
        </div>

        {/* Uploaded Files */}
        <div style={{
          background: 'rgba(30, 41, 59, 0.5)',
          border: '1px solid rgba(51, 65, 85, 0.6)',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', gap: '12px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600' }}>
              ⏱️ Temporary Documents ({uploadedFiles.length})
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                onClick={handleCleanupExpired}
                disabled={cleaningUp}
                style={{
                  padding: '6px 12px',
                  background: cleaningUp ? 'rgba(100, 116, 139, 0.3)' : 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: '#fca5a5',
                  fontWeight: '600',
                  cursor: cleaningUp ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => !cleaningUp && (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)')}
                onMouseLeave={(e) => !cleaningUp && (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)')}
              >
                {cleaningUp ? '🗑️ Cleaning...' : '🗑️ Cleanup Expired'}
              </button>
              <div style={{
                padding: '6px 12px',
                background: 'rgba(245, 158, 11, 0.2)',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                borderRadius: '6px',
                fontSize: '12px',
                color: '#fbbf24',
                fontWeight: '600'
              }}>
                Auto-delete in 1hr or after search
              </div>
            </div>
          </div>

          {loadingFiles ? (
            <p style={{ color: '#94a3b8' }}>Loading...</p>
          ) : uploadedFiles.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '32px',
              color: '#94a3b8'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔒</div>
              <p>No temporary documents. Upload above to search.</p>
              <p style={{ fontSize: '13px', marginTop: '8px', color: '#64748b' }}>
                Documents are ephemeral - they don't persist
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {uploadedFiles.map(file => (
                <div
                  key={file.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px',
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(71, 85, 105, 0.3)',
                    borderRadius: '8px'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '500' }}>{file.filename}</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                      {file.stats.chunkCount} chunks • {file.stats.embeddingCount} embeddings • {file.status}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => {
                        setSearchByFile(file.id);
                        setSearchQuery('');
                        handleSearch();
                      }}
                      style={{
                        padding: '6px 12px',
                        background: 'rgba(59, 130, 246, 0.2)',
                        border: '1px solid rgba(59, 130, 246, 0.4)',
                        borderRadius: '4px',
                        color: '#60a5fa',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      🔍 Search
                    </button>
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
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Search Section */}
        <div style={{
          background: 'rgba(30, 41, 59, 0.5)',
          border: '1px solid rgba(51, 65, 85, 0.6)',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px'
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>
            🔍 Search SBIR Database
          </h2>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchByFile(null);
              }}
              placeholder="Describe capabilities or paste opportunity text..."
              style={{
                flex: 1,
                padding: '12px',
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(71, 85, 105, 0.5)',
                borderRadius: '6px',
                color: '#ffffff',
                fontSize: '14px'
              }}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button
              onClick={handleSearch}
              disabled={searching}
              style={{
                padding: '12px 24px',
                background: searching ? 'rgba(100, 116, 139, 0.3)' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                border: 'none',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '15px',
                fontWeight: '600',
                cursor: searching ? 'not-allowed' : 'pointer'
              }}
            >
              {searching ? '🔍 Searching...' : '🔍 Search'}
            </button>
          </div>

          {searchStats && (
            <>
              <div style={{ 
                padding: '12px',
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '8px',
                fontSize: '13px',
                color: '#94a3b8',
                marginBottom: '8px'
              }}>
                Found {searchResults.length} matches in {searchStats.responseTimeMs}ms • Avg similarity: {(searchStats.avgSimilarity * 100).toFixed(1)}%
              </div>
              <div style={{
                padding: '10px',
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: '6px',
                fontSize: '12px',
                color: '#fbbf24',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>🔒</span>
                <span>Ephemeral mode: This search was not logged. Document data will be deleted automatically.</span>
              </div>
            </>
          )}
        </div>

        {/* Results */}
        {searchResults.length > 0 && (
          <div style={{
            background: 'rgba(30, 41, 59, 0.5)',
            border: '1px solid rgba(51, 65, 85, 0.6)',
            borderRadius: '12px',
            padding: '24px'
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>
              📊 Results ({searchResults.length})
            </h2>

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
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div>
                      <span style={{ 
                        padding: '4px 8px',
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
                          fontSize: '13px',
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
                    lineHeight: '1.6',
                    color: '#cbd5e1'
                  }}>
                    {result.content}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

