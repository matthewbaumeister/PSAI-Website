'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface SBIRRecord {
  // Core identification
  topic_number: string;
  topic_id: string;
  title: string;
  sponsor_component: string;
  status: string;
  solicitation_branch: string;
  
  // Dates
  open_date: string;
  close_date: string;
  pre_release_start?: string;
  pre_release_end?: string;
  modified_date: string;
  
  // Descriptions
  description: string;
  objective?: string;
  description_3?: string; // Phase I description
  description_4?: string; // Phase II description
  description_5?: string; // Phase III description
  
  // Technology & Keywords
  keywords: string;
  technology_areas: string;
  modernization_priorities?: string;
  primary_technology_area?: string;
  
  // TPOC (Technical Point of Contact)
  tpoc_names?: string;
  tpoc_emails?: string;
  tpoc_centers?: string;
  tpoc_count?: string;
  
  // Q&A
  total_questions?: string;
  published_questions?: string;
  qa_start?: string;
  qanda_status_topicqastatus?: string;
  
  // Security
  itar_controlled?: string;
  security_export?: string;
  
  // References & Resources
  references_data?: string;
  reference_count?: string;
  topic_pdf_download?: string;
  solicitation_instructions_download?: string;
  component_instructions_download?: string;
  
  // Consolidated Instructions
  consolidated_instructions_url?: string;
  instructions_plain_text?: string;
  instructions_generated_at?: string;
  
  // Q&A
  qa_content?: string;
  qa_status?: string;
  
  // Solicitation info
  cycle_name?: string;
  release_number?: string;
  solicitation_number?: string;
  
  // xTech
  is_xtech_xtech_keyword_search_duplicate?: string;
  prize_gating?: string;
  
  // Ownership
  owner?: string;
  internal_lead?: string;
}

interface FilterOptions {
  components: string[];
  statuses: string[];
  programTypes: string[];
}

export default function SBIRDatabaseBrowser() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  
  const [records, setRecords] = useState<SBIRRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedComponent, setSelectedComponent] = useState('all');
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedProgramType, setSelectedProgramType] = useState('all');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    components: [],
    statuses: [],
    programTypes: []
  });
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('last_scraped');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Smart search state
  const [smartSearchInput, setSmartSearchInput] = useState('');
  const [smartSearchMode, setSmartSearchMode] = useState<'query' | 'doc' | null>(null);
  const [smartSearchProcessing, setSmartSearchProcessing] = useState(false);
  
  // File upload state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileProcessing, setFileProcessing] = useState(false);
  const [filePreview, setFilePreview] = useState<string>('');
  
  // Find Similar state
  const [showSimilarOptions, setShowSimilarOptions] = useState<string | null>(null);
  const [findingSimilar, setFindingSimilar] = useState(false);
  
  // Share Search state
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);
  
  // Results per page
  const [pageSize, setPageSize] = useState(25);

  // Authentication check and redirect with return URL
  useEffect(() => {
    if (!authLoading && !user) {
      // Check if there are search params (shared search)
      const currentUrl = window.location.href;
      const hasSearchParams = window.location.search.length > 0;
      
      if (hasSearchParams) {
        // Redirect to login with return URL for shared search
        const returnUrl = encodeURIComponent(currentUrl);
        router.push(`/auth/login?returnUrl=${returnUrl}`);
      } else {
        // Regular redirect to login
        router.push('/auth/login');
      }
    }
  }, [user, authLoading, router]);

  // Load shared search from URL parameters on mount
  useEffect(() => {
    // Only load shared search if user is authenticated
    if (!user) return;
    
    const urlParams = new URLSearchParams(window.location.search);
    const sharedSearch = urlParams.get('search');
    const sharedComponent = urlParams.get('component');
    const sharedStatuses = urlParams.get('statuses');
    const sharedProgramType = urlParams.get('program');
    const sharedPage = urlParams.get('page');
    const sharedPageSize = urlParams.get('pageSize');
    const sharedSortBy = urlParams.get('sortBy');
    const sharedSortOrder = urlParams.get('sortOrder');
    
    // Check if this is a shared search (has any search params)
    const isSharedSearch = sharedSearch || sharedComponent || sharedStatuses || sharedProgramType;
    
    if (isSharedSearch) {
      // Apply shared search parameters
      if (sharedSearch) setSearchText(sharedSearch);
      if (sharedComponent && sharedComponent !== 'all') setSelectedComponent(sharedComponent);
      if (sharedStatuses) {
        try {
          const statusArray = JSON.parse(decodeURIComponent(sharedStatuses));
          setSelectedStatuses(statusArray);
        } catch (e) {
          console.error('Failed to parse statuses:', e);
        }
      }
      if (sharedProgramType && sharedProgramType !== 'all') setSelectedProgramType(sharedProgramType);
      if (sharedPage) setCurrentPage(parseInt(sharedPage));
      if (sharedPageSize && ['25', '50', '100'].includes(sharedPageSize)) {
        setPageSize(parseInt(sharedPageSize));
      }
      if (sharedSortBy) setSortBy(sharedSortBy);
      if (sharedSortOrder === 'asc' || sharedSortOrder === 'desc') setSortOrder(sharedSortOrder);
    }
  }, [user]); // Only run when user is loaded

  // Detect smart search intent
  useEffect(() => {
    if (!smartSearchInput.trim()) {
      setSmartSearchMode(null);
      return;
    }
    
    const wordCount = smartSearchInput.trim().split(/\s+/).length;
    setSmartSearchMode(wordCount > 50 ? 'doc' : 'query');
  }, [smartSearchInput]);

  // Fetch data when filters, page, sort, or page size changes
  useEffect(() => {
    fetchRecords();
  }, [currentPage, selectedComponent, selectedStatuses, selectedProgramType, sortBy, sortOrder, pageSize]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/sbir/browse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          searchText,
          component: selectedComponent,
          statuses: selectedStatuses, // Send array of statuses
          programType: selectedProgramType,
          page: currentPage,
          pageSize,
          sortBy,
          sortOrder
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setRecords(result.data);
        setTotalRecords(result.total);
        setTotalPages(result.totalPages);
        setFilterOptions(result.filterOptions);
      }
    } catch (error) {
      console.error('Error fetching records:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(0); // Reset to first page on new search
    fetchRecords();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const resetFilters = () => {
    setSearchText('');
    setSelectedComponent('all');
    setSelectedStatuses([]);
    setSelectedProgramType('all');
    setCurrentPage(0);
  };

  const toggleStatus = (status: string) => {
    if (status === 'Closed') {
      // If clicking Closed, toggle it and remove Open/Pre-Release
      if (selectedStatuses.includes('Closed')) {
        setSelectedStatuses([]);
      } else {
        setSelectedStatuses(['Closed']);
      }
    } else {
      // For Open/Pre-Release
      const newStatuses = [...selectedStatuses];
      
      // Remove Closed if present
      const closedIndex = newStatuses.indexOf('Closed');
      if (closedIndex > -1) {
        newStatuses.splice(closedIndex, 1);
      }
      
      // Toggle the clicked status
      const statusIndex = newStatuses.indexOf(status);
      if (statusIndex > -1) {
        newStatuses.splice(statusIndex, 1);
      } else {
        newStatuses.push(status);
      }
      
      setSelectedStatuses(newStatuses);
    }
    setCurrentPage(0); // Reset to first page when filter changes
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      // Toggle order if clicking same column
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // New column, default to descending
      setSortBy(column);
      setSortOrder('desc');
    }
    setCurrentPage(0); // Reset to first page on sort change
  };

  const getSortIcon = (column: string) => {
    if (sortBy !== column) return ' ⇅';
    return sortOrder === 'asc' ? ' ▲' : ' ▼';
  };

  const toggleRow = (topicId: string) => {
    setExpandedRow(expandedRow === topicId ? null : topicId);
  };

  // Active filters state
  const [activeFilters, setActiveFilters] = useState<Array<{type: string; value: string; label: string}>>([]);

  // Handle clicking on a value to add it as a search filter
  const handleClickToSearch = (value: string, labelPrefix: string) => {
    if (!value || value === 'N/A') return;
    
    // Add the value to search
    setSearchText(value);
    setCurrentPage(0);
    
    // Add to active filters with the actual value in the label
    const newFilter = { type: 'search', value, label: `${labelPrefix}: ${value}` };
    setActiveFilters(prev => {
      // Remove duplicates
      const filtered = prev.filter(f => !(f.type === 'search' && f.value === value));
      return [...filtered, newFilter];
    });
    
    // Trigger new search
    fetchRecords();
    
    // Scroll to top to see results
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Helper function to strip HTML tags and decode HTML entities
  const stripHtmlAndDecode = (html: string): string => {
    if (!html) return '';
    
    // First decode HTML entities
    const textarea = document.createElement('textarea');
    textarea.innerHTML = html;
    let decoded = textarea.value;
    
    // Then strip HTML tags
    const tmp = document.createElement('div');
    tmp.innerHTML = decoded;
    return tmp.textContent || tmp.innerText || '';
  };

  // Find similar records based on key details
  const handleFindSimilar = async (record: SBIRRecord, includeClosedRecords: boolean) => {
    setFindingSimilar(true);
    setShowSimilarOptions(null);
    
    try {
      // Build search query from key details
      const searchTerms: string[] = [];
      
      // Extract top keywords (limit to avoid too broad search)
      if (record.keywords) {
        const keywords = record.keywords.split(/[;,]/).slice(0, 5).map(k => k.trim()).filter(Boolean);
        searchTerms.push(...keywords);
      }
      
      // Extract top technology areas
      if (record.technology_areas) {
        const techAreas = record.technology_areas.split(',').slice(0, 3).map(t => t.trim()).filter(Boolean);
        searchTerms.push(...techAreas);
      }
      
      // Add modernization priorities
      if (record.modernization_priorities) {
        const modPriorities = record.modernization_priorities.split('|').slice(0, 2).map(m => m.trim()).filter(Boolean);
        searchTerms.push(...modPriorities);
      }
      
      // Join search terms
      const searchQuery = searchTerms.join(' ');
      
      // Set search text
      setSearchText(searchQuery);
      
      // Set status filter
      if (includeClosedRecords) {
        setSelectedStatuses([]); // All statuses
      } else {
        setSelectedStatuses(['Open', 'Pre-Release']); // Only open
      }
      
      // Reset other filters
      setSelectedComponent('all');
      setSelectedProgramType('all');
      setCurrentPage(0);
      
      // Add to active filters
      setActiveFilters([
        { type: 'search', value: searchQuery, label: `Similar to: ${record.topic_number}` }
      ]);
      
      // Fetch results
      await fetchRecords();
      
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      // Close expanded row
      setExpandedRow(null);
      
    } catch (error) {
      console.error('Find similar error:', error);
      alert('Failed to find similar records. Please try again.');
    } finally {
      setFindingSimilar(false);
    }
  };

  // Generate shareable URL with current search parameters
  const generateShareUrl = () => {
    const baseUrl = window.location.origin + window.location.pathname;
    const params = new URLSearchParams();
    
    // Add search parameters
    if (searchText) params.append('search', searchText);
    if (selectedComponent !== 'all') params.append('component', selectedComponent);
    if (selectedStatuses.length > 0) {
      params.append('statuses', encodeURIComponent(JSON.stringify(selectedStatuses)));
    }
    if (selectedProgramType !== 'all') params.append('program', selectedProgramType);
    if (currentPage > 0) params.append('page', currentPage.toString());
    if (pageSize !== 25) params.append('pageSize', pageSize.toString());
    if (sortBy !== 'last_scraped') params.append('sortBy', sortBy);
    if (sortOrder !== 'desc') params.append('sortOrder', sortOrder);
    
    const queryString = params.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  };

  // Handle sharing the current search
  const handleShareSearch = () => {
    const url = generateShareUrl();
    
    // Debug log to console (you can remove this later)
    console.log('Share Search - Current State:', {
      searchText,
      selectedComponent,
      selectedStatuses,
      selectedProgramType,
      currentPage,
      pageSize,
      sortBy,
      sortOrder
    });
    console.log('Generated URL:', url);
    
    setShareUrl(url);
    setShowShareModal(true);
    setCopiedToClipboard(false);
  };

  // Copy share URL to clipboard
  const copyShareUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedToClipboard(true);
      setTimeout(() => setCopiedToClipboard(false), 3000);
    } catch (error) {
      console.error('Failed to copy:', error);
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = shareUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedToClipboard(true);
      setTimeout(() => setCopiedToClipboard(false), 3000);
    }
  };

  // Handle clicking on component badge
  const handleClickComponent = (component: string) => {
    if (!component) return;
    setSelectedComponent(component);
    setCurrentPage(0);
    setActiveFilters(prev => {
      const filtered = prev.filter(f => f.type !== 'component');
      return [...filtered, { type: 'component', value: component, label: `Component: ${component}` }];
    });
    fetchRecords();
  };

  // Handle clicking on status badge
  const handleClickStatus = (status: string) => {
    if (!status) return;
    setSelectedStatuses([status]);
    setCurrentPage(0);
    setActiveFilters(prev => {
      const filtered = prev.filter(f => f.type !== 'status');
      return [...filtered, { type: 'status', value: status, label: `Status: ${status}` }];
    });
    fetchRecords();
  };

  // Remove active filter
  const removeFilter = (filter: {type: string; value: string}) => {
    if (filter.type === 'search') {
      setSearchText('');
    } else if (filter.type === 'component') {
      setSelectedComponent('all');
    } else if (filter.type === 'status') {
      setSelectedStatuses([]);
    }
    
    setActiveFilters(prev => prev.filter(f => !(f.type === filter.type && f.value === filter.value)));
    setCurrentPage(0);
    fetchRecords();
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearchText('');
    setSelectedComponent('all');
    setSelectedStatuses([]);
    setSelectedProgramType('all');
    setActiveFilters([]);
    setCurrentPage(0);
    fetchRecords();
  };

  // Handle smart search
  const handleSmartSearch = async () => {
    if (!smartSearchInput.trim()) return;

    setSmartSearchProcessing(true);
    
    try {
      if (smartSearchMode === 'doc') {
        // Extract keywords from pasted doc
        const keywords = extractKeywords(smartSearchInput);
        setSearchText(keywords.join(' '));
      } else {
        // Direct query
        setSearchText(smartSearchInput.trim());
      }
      
      // Reset filters and trigger search
      setCurrentPage(0);
      setSelectedStatuses([]);
      setSelectedComponent('all');
      setSelectedProgramType('all');
      
      // Fetch with new search text
      await fetchRecords();
      
      // Clear smart search input
      setSmartSearchInput('');
      
    } catch (error) {
      console.error('Smart search error:', error);
      alert('Search failed. Please try again.');
    } finally {
      setSmartSearchProcessing(false);
    }
  };

  // Simple keyword extraction from capabilities doc
  const extractKeywords = (text: string): string[] => {
    // Remove common words and extract technical terms
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'we', 'our', 'us', 'you', 'your', 'they', 'their', 'them', 'it', 'its', 'which', 'who', 'what', 'when', 'where', 'how', 'why']);
    
    // Split into words and filter
    const words = text.toLowerCase()
      .replace(/[^\w\s-]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopWords.has(word));
    
    // Count frequency
    const freq: Record<string, number> = {};
    words.forEach(word => {
      freq[word] = (freq[word] || 0) + 1;
    });
    
    // Get top keywords by frequency
    const sorted = Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
    
    return sorted;
  };

  // Handle file upload and processing
  const handleFileUpload = async () => {
    if (!uploadedFile) return;

    // File size validation (5MB limit for Vercel)
    const maxSizeMB = 5;
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    
    if (uploadedFile.size > maxSizeBytes) {
      alert(`File too large. Maximum size: ${maxSizeMB}MB\n\nYour file: ${(uploadedFile.size / 1024 / 1024).toFixed(2)}MB\n\nTip: Compress images or reduce PDF quality before uploading.`);
      return;
    }

    setFileProcessing(true);
    setFilePreview('');

    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);

      console.log('Uploading file:', uploadedFile.name, `(${(uploadedFile.size / 1024).toFixed(0)}KB)`);

      const response = await fetch('/api/admin/sbir/extract-file', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        // Set preview
        setFilePreview(`File: ${data.filename} (${data.fileType})\nExtracted: ${data.stats.characterCount} chars, ${data.stats.wordCount} words\nKeywords: ${data.keywords.join(', ')}`);
        
        // Set search text with keywords
        setSearchText(data.keywords.join(' '));
        
        // Reset filters and trigger search
        setCurrentPage(0);
        setSelectedStatuses([]);
        setSelectedComponent('all');
        setSelectedProgramType('all');
        
        // Fetch with new keywords
        await fetchRecords();
        
        // Clear file input
        setUploadedFile(null);
        
      } else {
        alert(`File processing failed: ${data.error}`);
      }

    } catch (error) {
      console.error('File processing error:', error);
      alert('File processing failed. Please try again.');
    } finally {
      setFileProcessing(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(to bottom, #0a0f1e, #1a1f2e)',
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
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              marginBottom: '15px'
            }}
          >
            ← Back to Admin Dashboard
          </Link>
          
          <h1 style={{ 
            fontSize: '32px', 
            fontWeight: '700', 
            color: '#ffffff',
            marginBottom: '10px'
          }}>
            SBIR Database Browser
          </h1>
          
          <p style={{ 
            color: '#94a3b8', 
            fontSize: '16px'
          }}>
            Search and explore {totalRecords.toLocaleString()} SBIR/STTR opportunities
          </p>
        </div>

        {/* Smart Search Section */}
        <div style={{ 
          background: 'rgba(16, 185, 129, 0.1)',
          border: '2px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <h2 style={{ 
              fontSize: '20px', 
              fontWeight: '600',
              color: '#10b981',
              margin: 0
            }}>
              Smart Search
            </h2>
            <div style={{
              padding: '4px 10px',
              background: 'rgba(16, 185, 129, 0.2)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: '600',
              color: '#10b981'
            }}>
              NEW
            </div>
          </div>

          <div style={{
            padding: '12px',
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '8px',
            marginBottom: '16px',
            fontSize: '13px',
            color: '#fbbf24',
            lineHeight: '1.5'
          }}>
            <strong>EPHEMERAL MODE:</strong> Documents processed in temporary storage only. Original text never stored. Auto-deleted after search or in 1 hour.
          </div>

          <p style={{ 
            color: '#94a3b8', 
            fontSize: '14px',
            marginBottom: '16px'
          }}>
            Type a short query OR paste your capabilities document (50+ words) - we'll extract keywords automatically
          </p>

          <textarea
            value={smartSearchInput}
            onChange={(e) => setSmartSearchInput(e.target.value)}
            placeholder="Enter search query (e.g. 'AI machine learning defense') OR paste capabilities document...

Example doc:
Our company specializes in artificial intelligence and machine learning for defense applications. We develop autonomous systems, computer vision, natural language processing, and cybersecurity solutions for government contracts."
            disabled={smartSearchProcessing}
            style={{
              width: '100%',
              minHeight: '120px',
              padding: '14px',
              background: 'rgba(15, 23, 42, 0.6)',
              border: '2px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '8px',
              color: '#ffffff',
              fontSize: '14px',
              fontFamily: 'inherit',
              resize: 'vertical',
              marginBottom: '12px'
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                handleSmartSearch();
              }
            }}
          />

          {smartSearchMode && (
            <div style={{
              padding: '10px 14px',
              background: smartSearchMode === 'doc' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)',
              border: `1px solid ${smartSearchMode === 'doc' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(59, 130, 246, 0.4)'}`,
              borderRadius: '6px',
              fontSize: '13px',
              color: smartSearchMode === 'doc' ? '#10b981' : '#60a5fa',
              marginBottom: '12px'
            }}>
              {smartSearchMode === 'doc' 
                ? `${smartSearchInput.trim().split(/\s+/).length} words detected - Will extract keywords from document`
                : `${smartSearchInput.trim().split(/\s+/).length} words - Quick search mode`
              }
            </div>
          )}

          <button
            onClick={handleSmartSearch}
            disabled={smartSearchProcessing || !smartSearchInput.trim()}
            style={{
              padding: '12px 24px',
              background: smartSearchProcessing || !smartSearchInput.trim()
                ? 'rgba(100, 116, 139, 0.3)'
                : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: 'none',
              borderRadius: '8px',
              color: '#ffffff',
              fontSize: '15px',
              fontWeight: '600',
              cursor: smartSearchProcessing || !smartSearchInput.trim() ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
            }}
          >
            {smartSearchProcessing ? 'Processing...' : smartSearchMode === 'doc' ? 'Extract Keywords & Search' : 'Search SBIR Database'}
          </button>

          <div style={{
            marginTop: '12px',
            fontSize: '12px',
            color: '#64748b'
          }}>
            Tip: Press Cmd/Ctrl + Enter to search • Paste 50+ words for auto keyword extraction
          </div>

          {/* OR Divider */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginTop: '24px',
            marginBottom: '16px'
          }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(148, 163, 184, 0.2)' }} />
            <div style={{ padding: '0 16px', color: '#64748b', fontSize: '13px', fontWeight: '600' }}>
              OR
            </div>
            <div style={{ flex: 1, height: '1px', background: 'rgba(148, 163, 184, 0.2)' }} />
          </div>

          {/* File Upload Section */}
          <div>
            <label style={{
              display: 'block',
              color: '#cbd5e1',
              fontSize: '14px',
              fontWeight: '600',
              marginBottom: '10px'
            }}>
              Upload Capabilities Document
            </label>
            <p style={{ 
              color: '#94a3b8', 
              fontSize: '13px',
              marginBottom: '12px'
            }}>
              Supported: PDF, DOCX, PPTX, Images (PNG/JPG), TXT, HTML, CSV, and 40+ more formats
            </p>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.md,.odt,.odp,.rtf,.html,.htm,.png,.jpg,.jpeg,.gif,.tiff,.bmp,.webp,.csv,.xlsx,.xls"
                onChange={(e) => setUploadedFile(e.target.files?.[0] || null)}
                disabled={fileProcessing}
                style={{
                  flex: 1,
                  minWidth: '250px',
                  padding: '10px',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(71, 85, 105, 0.5)',
                  borderRadius: '6px',
                  color: '#ffffff',
                  fontSize: '13px',
                  cursor: fileProcessing ? 'not-allowed' : 'pointer'
                }}
              />
              <button
                onClick={handleFileUpload}
                disabled={fileProcessing || !uploadedFile}
                style={{
                  padding: '10px 20px',
                  background: fileProcessing || !uploadedFile
                    ? 'rgba(100, 116, 139, 0.3)'
                    : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: fileProcessing || !uploadedFile ? 'not-allowed' : 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {fileProcessing ? 'Processing...' : 'Extract & Search'}
              </button>
            </div>

            {filePreview && (
              <div style={{
                marginTop: '12px',
                padding: '12px',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '6px',
                fontSize: '12px',
                color: '#10b981',
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap'
              }}>
                {filePreview}
              </div>
            )}
          </div>
        </div>

        {/* Search and Filters */}
        <div style={{ 
          background: 'rgba(30, 41, 59, 0.5)',
          border: '1px solid rgba(51, 65, 85, 0.6)',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px'
        }}>
          {/* Smart Search Bar */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              color: '#cbd5e1', 
              fontSize: '15px', 
              fontWeight: '600',
              marginBottom: '8px',
              fontStyle: 'italic'
            }}>
              Filter By
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Search by title, description, topic number, or keywords..."
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(71, 85, 105, 0.5)',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '15px',
                  outline: 'none'
                }}
              />
              <button
                onClick={handleSearch}
                style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(to right, #3b82f6, #2563eb)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '15px'
                }}
              >
                Search
              </button>
              <button
                onClick={resetFilters}
                style={{
                  padding: '12px 20px',
                  background: 'rgba(100, 116, 139, 0.2)',
                  border: '1px solid rgba(100, 116, 139, 0.3)',
                  borderRadius: '8px',
                  color: '#cbd5e1',
                  fontWeight: '500',
                  cursor: 'pointer',
                  fontSize: '15px'
                }}
              >
                Reset
              </button>
            </div>
          </div>

          {/* Status Filter Buttons (DSIP-style) */}
          <div style={{ marginTop: '24px' }}>
            <label style={{ 
              display: 'block', 
              color: '#cbd5e1', 
              fontSize: '14px', 
              fontWeight: '600',
              marginBottom: '10px',
              fontStyle: 'italic'
            }}>
              Topic Status:
            </label>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                onClick={() => {
                  setSelectedStatuses([]);
                  setCurrentPage(0);
                }}
                style={{
                  padding: '8px 16px',
                  background: selectedStatuses.length === 0 ? '#3b82f6' : 'rgba(59, 130, 246, 0.2)',
                  border: `1px solid ${selectedStatuses.length === 0 ? '#3b82f6' : 'rgba(59, 130, 246, 0.4)'}`,
                  borderRadius: '6px',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                All Statuses
              </button>
              <button
                onClick={() => toggleStatus('Open')}
                style={{
                  padding: '8px 16px',
                  background: selectedStatuses.includes('Open') ? '#10b981' : 'rgba(16, 185, 129, 0.2)',
                  border: `1px solid ${selectedStatuses.includes('Open') ? '#10b981' : 'rgba(16, 185, 129, 0.4)'}`,
                  borderRadius: '6px',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Open
              </button>
              <button
                onClick={() => toggleStatus('Pre-Release')}
                style={{
                  padding: '8px 16px',
                  background: selectedStatuses.includes('Pre-Release') ? '#f59e0b' : 'rgba(245, 158, 11, 0.2)',
                  border: `1px solid ${selectedStatuses.includes('Pre-Release') ? '#f59e0b' : 'rgba(245, 158, 11, 0.4)'}`,
                  borderRadius: '6px',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Pre-Release
              </button>
              <button
                onClick={() => toggleStatus('Closed')}
                style={{
                  padding: '8px 16px',
                  background: selectedStatuses.includes('Closed') ? '#ef4444' : 'rgba(239, 68, 68, 0.2)',
                  border: `1px solid ${selectedStatuses.includes('Closed') ? '#ef4444' : 'rgba(239, 68, 68, 0.4)'}`,
                  borderRadius: '6px',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Closed
              </button>
            </div>
          </div>

          {/* Filter Dropdowns */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '16px',
            marginTop: '20px'
          }}>
            {/* Component Filter */}
            <div>
              <label style={{ 
                display: 'block', 
                color: '#cbd5e1', 
                fontSize: '13px', 
                fontWeight: '500',
                marginBottom: '6px'
              }}>
                Component
              </label>
              <select
                value={selectedComponent}
                onChange={(e) => {
                  setSelectedComponent(e.target.value);
                  setCurrentPage(0);
                }}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(71, 85, 105, 0.5)',
                  borderRadius: '6px',
                  color: '#ffffff',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                <option value="all">All Components</option>
                {filterOptions.components.map(comp => (
                  <option key={comp} value={comp}>{comp}</option>
                ))}
              </select>
            </div>

            {/* Program Type Filter */}
            <div>
              <label style={{ 
                display: 'block', 
                color: '#cbd5e1', 
                fontSize: '13px', 
                fontWeight: '500',
                marginBottom: '6px'
              }}>
                Program Type
              </label>
              <select
                value={selectedProgramType}
                onChange={(e) => {
                  setSelectedProgramType(e.target.value);
                  setCurrentPage(0);
                }}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(71, 85, 105, 0.5)',
                  borderRadius: '6px',
                  color: '#ffffff',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                <option value="all">All Programs</option>
                {filterOptions.programTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        {/* Active Filters Badges */}
        {activeFilters.length > 0 && (
          <div style={{
            marginBottom: '20px',
            padding: '16px',
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '8px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px'
            }}>
              <span style={{ color: '#60a5fa', fontSize: '14px', fontWeight: '600' }}>
                Active Filters ({activeFilters.length})
              </span>
              <button
                onClick={clearAllFilters}
                style={{
                  padding: '6px 12px',
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  borderRadius: '6px',
                  color: '#ef4444',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
              >
                Clear All
              </button>
            </div>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {activeFilters.map((filter, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    background: 'rgba(59, 130, 246, 0.15)',
                    border: '1px solid rgba(59, 130, 246, 0.4)',
                    borderRadius: '6px',
                    color: '#60a5fa',
                    fontSize: '13px'
                  }}
                >
                  <span>{filter.label}</span>
                  <button
                    onClick={() => removeFilter(filter)}
                    style={{
                      background: 'rgba(59, 130, 246, 0.3)',
                      border: 'none',
                      borderRadius: '50%',
                      width: '20px',
                      height: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.5)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.3)'}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '16px',
          color: '#94a3b8',
          fontSize: '14px',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>
            {loading ? 'Loading...' : `Showing ${records.length} of ${totalRecords.toLocaleString()} results`}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={handleShareSearch}
              style={{
                padding: '8px 16px',
                background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
                border: 'none',
                borderRadius: '6px',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s',
                boxShadow: '0 2px 8px rgba(6, 182, 212, 0.3)'
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="18" cy="5" r="3"></circle>
                <circle cx="6" cy="12" r="3"></circle>
                <circle cx="18" cy="19" r="3"></circle>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
              </svg>
              Share Search
            </button>
            <div>
              Page {currentPage + 1} of {totalPages || 1}
            </div>
          </div>
        </div>

        {/* Results Table */}
        <div style={{ 
          background: 'rgba(30, 41, 59, 0.5)',
          border: '1px solid rgba(51, 65, 85, 0.6)',
          borderRadius: '12px',
          overflow: 'hidden'
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ 
                  background: 'rgba(15, 23, 42, 0.6)',
                  borderBottom: '1px solid rgba(71, 85, 105, 0.5)'
                }}>
                  <th style={headerStyle}>
                    <button 
                      onClick={() => handleSort('topic_number')}
                      style={sortButtonStyle}
                    >
                      Topic #{getSortIcon('topic_number')}
                    </button>
                  </th>
                  <th style={headerStyle}>
                    <button 
                      onClick={() => handleSort('title')}
                      style={sortButtonStyle}
                    >
                      Title{getSortIcon('title')}
                    </button>
                  </th>
                  <th style={headerStyle}>
                    <button 
                      onClick={() => handleSort('component')}
                      style={sortButtonStyle}
                    >
                      Component{getSortIcon('component')}
                    </button>
                  </th>
                  <th style={headerStyle}>
                    <button 
                      onClick={() => handleSort('status')}
                      style={sortButtonStyle}
                    >
                      Status{getSortIcon('status')}
                    </button>
                  </th>
                  <th style={headerStyle}>
                    <button 
                      onClick={() => handleSort('program_type')}
                      style={sortButtonStyle}
                    >
                      Program{getSortIcon('program_type')}
                    </button>
                  </th>
                  <th style={headerStyle}>
                    <button 
                      onClick={() => handleSort('close_date')}
                      style={sortButtonStyle}
                    >
                      Close Date{getSortIcon('close_date')}
                    </button>
                  </th>
                  <th style={headerStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} style={{ 
                      padding: '40px', 
                      textAlign: 'center', 
                      color: '#94a3b8' 
                    }}>
                      Loading...
                    </td>
                  </tr>
                ) : records.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ 
                      padding: '40px', 
                      textAlign: 'center', 
                      color: '#94a3b8' 
                    }}>
                      No records found. Try adjusting your filters.
                    </td>
                  </tr>
                ) : (
                  records.map((record) => (
                    <>
                      <tr 
                        key={record.topic_id}
                        style={{ 
                          borderBottom: '1px solid rgba(51, 65, 85, 0.3)',
                          cursor: 'pointer',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(51, 65, 85, 0.3)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        onClick={() => toggleRow(record.topic_id)}
                      >
                        <td style={cellStyle}>{record.topic_number}</td>
                        <td style={{...cellStyle, maxWidth: '400px'}}>
                          <div style={{ 
                            overflow: 'hidden', 
                            textOverflow: 'ellipsis', 
                            whiteSpace: 'nowrap',
                            fontWeight: '500'
                          }}>
                            {record.title}
                          </div>
                        </td>
                        <td style={cellStyle}>
                          <span 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleClickComponent(record.sponsor_component);
                            }}
                            style={{
                              padding: '4px 10px',
                              background: 'rgba(59, 130, 246, 0.2)',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: '500',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.3)'}
                            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)'}
                            title="Click to filter by this component"
                          >
                            {record.sponsor_component}
                          </span>
                        </td>
                        <td style={cellStyle}>
                          <span 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleClickStatus(record.status);
                            }}
                            style={{
                              padding: '4px 10px',
                              background: getStatusColor(record.status),
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: '500',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              opacity: 0.9
                            }}
                            onMouseOver={(e) => e.currentTarget.style.opacity = '1'}
                            onMouseOut={(e) => e.currentTarget.style.opacity = '0.9'}
                            title="Click to filter by this status"
                          >
                            {record.status}
                          </span>
                        </td>
                        <td style={cellStyle}>{record.solicitation_branch || 'N/A'}</td>
                        <td style={cellStyle}>{record.close_date || 'N/A'}</td>
                        <td style={cellStyle}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleRow(record.topic_id);
                            }}
                            style={{
                              padding: '6px 12px',
                              background: 'rgba(59, 130, 246, 0.2)',
                              border: '1px solid rgba(59, 130, 246, 0.3)',
                              borderRadius: '4px',
                              color: '#60a5fa',
                              fontSize: '12px',
                              cursor: 'pointer',
                              fontWeight: '500'
                            }}
                          >
                            {expandedRow === record.topic_id ? 'Hide' : 'Details'}
                          </button>
                        </td>
                      </tr>
                      {expandedRow === record.topic_id && (
                        <tr>
                          <td colSpan={7} style={{ 
                            padding: '20px', 
                            background: 'rgba(15, 23, 42, 0.4)',
                            borderBottom: '1px solid rgba(51, 65, 85, 0.3)'
                          }}>
                            <div style={{ color: '#cbd5e1', lineHeight: '1.6' }}>
                              {/* Find Similar Button Section */}
                              <div style={{ 
                                marginBottom: '24px',
                                paddingBottom: '16px',
                                borderBottom: '1px solid rgba(71, 85, 105, 0.3)'
                              }}>
                                <div style={{ position: 'relative', display: 'inline-block' }}>
                                  <button
                                    onClick={() => setShowSimilarOptions(showSimilarOptions === record.topic_id ? null : record.topic_id)}
                                    disabled={findingSimilar}
                                    style={{
                                      padding: '10px 20px',
                                      background: findingSimilar 
                                        ? 'rgba(100, 116, 139, 0.3)'
                                        : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                                      border: 'none',
                                      borderRadius: '8px',
                                      color: '#ffffff',
                                      fontSize: '14px',
                                      fontWeight: '600',
                                      cursor: findingSimilar ? 'not-allowed' : 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '8px',
                                      boxShadow: '0 2px 8px rgba(139, 92, 246, 0.3)',
                                      transition: 'all 0.2s'
                                    }}
                                    onMouseOver={(e) => !findingSimilar && (e.currentTarget.style.transform = 'translateY(-2px)')}
                                    onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                                  >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <circle cx="11" cy="11" r="8"></circle>
                                      <path d="m21 21-4.35-4.35"></path>
                                    </svg>
                                    {findingSimilar ? 'Finding Similar...' : 'Find Similar Topics'}
                                  </button>
                                  
                                  {/* Dropdown Options */}
                                  {showSimilarOptions === record.topic_id && !findingSimilar && (
                                    <div style={{
                                      position: 'absolute',
                                      top: '100%',
                                      left: 0,
                                      marginTop: '8px',
                                      background: 'rgba(15, 23, 42, 0.95)',
                                      border: '1px solid rgba(139, 92, 246, 0.4)',
                                      borderRadius: '8px',
                                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
                                      minWidth: '220px',
                                      zIndex: 1000,
                                      overflow: 'hidden'
                                    }}>
                                      <div style={{ padding: '8px 0' }}>
                                        <button
                                          onClick={() => handleFindSimilar(record, false)}
                                          style={{
                                            width: '100%',
                                            padding: '12px 16px',
                                            background: 'transparent',
                                            border: 'none',
                                            color: '#10b981',
                                            fontSize: '13px',
                                            fontWeight: '500',
                                            cursor: 'pointer',
                                            textAlign: 'left',
                                            transition: 'background 0.2s',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px'
                                          }}
                                          onMouseOver={(e) => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)'}
                                          onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                                        >
                                          <div style={{
                                            width: '8px',
                                            height: '8px',
                                            borderRadius: '50%',
                                            background: '#10b981'
                                          }}></div>
                                          Open Only
                                        </button>
                                        <button
                                          onClick={() => handleFindSimilar(record, true)}
                                          style={{
                                            width: '100%',
                                            padding: '12px 16px',
                                            background: 'transparent',
                                            border: 'none',
                                            color: '#60a5fa',
                                            fontSize: '13px',
                                            fontWeight: '500',
                                            cursor: 'pointer',
                                            textAlign: 'left',
                                            transition: 'background 0.2s',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px'
                                          }}
                                          onMouseOver={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'}
                                          onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                                        >
                                          <div style={{
                                            width: '8px',
                                            height: '8px',
                                            borderRadius: '50%',
                                            background: '#60a5fa'
                                          }}></div>
                                          Open and Closed
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                                <p style={{ 
                                  marginTop: '8px',
                                  fontSize: '12px',
                                  color: '#94a3b8',
                                  fontStyle: 'italic'
                                }}>
                                  Search for topics with similar keywords, technology areas, and modernization priorities
                                </p>
                              </div>

                              {/* Instructions Section - Only for Active Opportunities */}
                              {record.consolidated_instructions_url && record.status && ['open', 'prerelease', 'pre-release', 'active', 'prerelease'].includes(record.status.toLowerCase()) && (
                                <div style={{
                                  padding: '20px',
                                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%)',
                                  border: '1px solid rgba(59, 130, 246, 0.4)',
                                  borderRadius: '8px',
                                  marginBottom: '24px'
                                }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                    <div style={{
                                      padding: '8px',
                                      background: 'rgba(59, 130, 246, 0.3)',
                                      borderRadius: '6px'
                                    }}>
                                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#93c5fd" strokeWidth="2">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                        <polyline points="14 2 14 8 20 8"></polyline>
                                        <line x1="16" y1="13" x2="8" y2="13"></line>
                                        <line x1="16" y1="17" x2="8" y2="17"></line>
                                      </svg>
                                    </div>
                                    <div>
                                      <h4 style={{ color: '#93c5fd', fontSize: '16px', fontWeight: '600', margin: '0 0 4px 0' }}>
                                        Consolidated Submission Instructions
                                      </h4>
                                      <p style={{ color: '#cbd5e1', fontSize: '13px', margin: 0 }}>
                                        Cross-reference analysis, superseding guidance, and submission checklist
                                      </p>
                                    </div>
                                  </div>
                                  
                                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                    <a
                                      href={`/opportunities/${record.topic_number}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{
                                        padding: '12px 20px',
                                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                        border: 'none',
                                        borderRadius: '8px',
                                        color: '#ffffff',
                                        fontSize: '14px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        textDecoration: 'none',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        fontWeight: '600',
                                        boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)'
                                      }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)';
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.3)';
                                      }}
                                    >
                                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                        <polyline points="15 3 21 3 21 9"></polyline>
                                        <line x1="10" y1="14" x2="21" y2="3"></line>
                                      </svg>
                                      View Opportunity Details
                                    </a>
                                    <a
                                      href={record.consolidated_instructions_url}
                                      download
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{
                                        padding: '12px 20px',
                                        background: 'rgba(34, 197, 94, 0.2)',
                                        border: '1px solid rgba(34, 197, 94, 0.4)',
                                        borderRadius: '8px',
                                        color: '#86efac',
                                        fontSize: '14px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        textDecoration: 'none',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        fontWeight: '500'
                                      }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'rgba(34, 197, 94, 0.3)';
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'rgba(34, 197, 94, 0.2)';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                      }}
                                    >
                                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                        <polyline points="7 10 12 15 17 10"></polyline>
                                        <line x1="12" y1="15" x2="12" y2="3"></line>
                                      </svg>
                                      Download PDF
                                    </a>
                                  </div>
                                </div>
                              )}

                              {/* Organized multi-section detailed view */}
                              <div style={{ 
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
                                gap: '24px'
                              }}>
                                
                                {/* LEFT COLUMN */}
                                <div>
                                  {/* Descriptions Section */}
                                  <div style={{ marginBottom: '20px' }}>
                                    <h4 style={{ color: '#60a5fa', marginBottom: '12px', fontSize: '15px', fontWeight: '600' }}>Descriptions</h4>
                                    
                                    {record.objective && (
                                      <div style={{ marginBottom: '12px' }}>
                                        <strong style={{ color: '#ffffff', fontSize: '13px' }}>Objective:</strong>
                                        <p style={{ marginTop: '4px', color: '#94a3b8', fontSize: '13px' }}>
                                          {record.objective.substring(0, 300)}
                                          {record.objective.length > 300 && '...'}
                                        </p>
                                      </div>
                                    )}
                                    
                                    <div style={{ marginBottom: '12px' }}>
                                      <strong style={{ color: '#ffffff', fontSize: '13px' }}>Description:</strong>
                                      <p style={{ marginTop: '4px', color: '#94a3b8', fontSize: '13px' }}>
                                        {record.description?.substring(0, 400) || 'No description available'}
                                        {record.description?.length > 400 && '...'}
                                      </p>
                                    </div>
                                    
                                    {record.description_3 && (
                                      <div style={{ marginBottom: '12px' }}>
                                        <strong style={{ color: '#ffffff', fontSize: '13px' }}>Phase I:</strong>
                                        <p style={{ marginTop: '4px', color: '#94a3b8', fontSize: '13px' }}>
                                          {record.description_3.substring(0, 200)}
                                          {record.description_3.length > 200 && '...'}
                                        </p>
                                      </div>
                                    )}
                                  </div>

                                  {/* Technology & Keywords Section */}
                                  <div style={{ marginBottom: '20px' }}>
                                    <h4 style={{ color: '#60a5fa', marginBottom: '12px', fontSize: '15px', fontWeight: '600' }}>Technology & Keywords</h4>
                                    
                                    {record.technology_areas && (
                                      <div style={{ marginBottom: '10px' }}>
                                        <strong style={{ color: '#ffffff', fontSize: '13px' }}>Technology Areas:</strong>
                                        <div style={{ marginTop: '6px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                          {record.technology_areas.split(',').slice(0, 5).map((area, idx) => (
                                            <span 
                                              key={idx}
                                              onClick={() => handleClickToSearch(area.trim(), 'Technology Area')}
                                              style={{ 
                                                padding: '4px 10px',
                                                background: 'rgba(16, 185, 129, 0.1)',
                                                border: '1px solid rgba(16, 185, 129, 0.3)',
                                                borderRadius: '4px',
                                                fontSize: '12px',
                                                color: '#10b981',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                              }}
                                              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)'}
                                              onMouseOut={(e) => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)'}
                                            >
                                              {area.trim()}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    
                                    {record.modernization_priorities && (
                                      <div style={{ marginBottom: '10px' }}>
                                        <strong style={{ color: '#ffffff', fontSize: '13px' }}>Modernization:</strong>
                                        <div style={{ marginTop: '6px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                          {record.modernization_priorities.split('|').slice(0, 3).map((pri, idx) => (
                                            <span 
                                              key={idx}
                                              onClick={() => handleClickToSearch(pri.trim(), 'Modernization')}
                                              style={{ 
                                                padding: '4px 10px',
                                                background: 'rgba(168, 85, 247, 0.1)',
                                                border: '1px solid rgba(168, 85, 247, 0.3)',
                                                borderRadius: '4px',
                                                fontSize: '12px',
                                                color: '#a855f7',
                                                cursor: 'pointer'
                                              }}
                                            >
                                              {pri.trim()}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    
                                    {record.keywords && (
                                      <div style={{ marginBottom: '10px' }}>
                                        <strong style={{ color: '#ffffff', fontSize: '13px' }}>Keywords:</strong>
                                        <div style={{ marginTop: '6px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                          {record.keywords.split(/[;,]/).slice(0, 10).map((kw, idx) => kw.trim()).filter(Boolean).map((kw, idx) => (
                                            <span
                                              key={idx}
                                              onClick={() => handleClickToSearch(kw, 'Keyword')}
                                              style={{
                                                padding: '4px 10px',
                                                background: 'rgba(59, 130, 246, 0.1)',
                                                border: '1px solid rgba(59, 130, 246, 0.3)',
                                                borderRadius: '4px',
                                                fontSize: '12px',
                                                color: '#60a5fa',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                              }}
                                              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)'}
                                              onMouseOut={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'}
                                            >
                                              {kw}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  {/* TPOC Section */}
                                  {(record.tpoc_names || record.tpoc_emails) && (
                                    <div style={{ marginBottom: '20px' }}>
                                      <h4 style={{ color: '#60a5fa', marginBottom: '12px', fontSize: '15px', fontWeight: '600' }}>Technical Point of Contact (TPOC)</h4>
                                      
                                      {record.tpoc_names && (
                                        <div style={{ marginBottom: '8px' }}>
                                          <strong style={{ color: '#ffffff', fontSize: '13px' }}>Names:</strong>
                                          <div style={{ marginTop: '4px' }}>
                                            {record.tpoc_names.split(',').map((name, idx) => (
                                              <span 
                                                key={idx}
                                                onClick={() => handleClickToSearch(name.trim(), 'TPOC')}
                                                style={{ 
                                                  display: 'inline-block',
                                                  marginRight: '8px',
                                                  marginBottom: '6px',
                                                  padding: '3px 8px',
                                                  background: 'rgba(251, 191, 36, 0.1)',
                                                  border: '1px solid rgba(251, 191, 36, 0.3)',
                                                  borderRadius: '4px',
                                                  fontSize: '12px',
                                                  color: '#fbbf24',
                                                  cursor: 'pointer'
                                                }}
                                              >
                                                {name.trim()}
                                              </span>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                      
                                      {record.tpoc_emails && (
                                        <div style={{ marginBottom: '8px' }}>
                                          <strong style={{ color: '#ffffff', fontSize: '13px' }}>Email:</strong>
                                          <p style={{ marginTop: '4px', color: '#94a3b8', fontSize: '12px', wordBreak: 'break-all' }}>
                                            {record.tpoc_emails}
                                          </p>
                                        </div>
                                      )}
                                      
                                      {record.tpoc_centers && (
                                        <div style={{ marginBottom: '8px' }}>
                                          <strong style={{ color: '#ffffff', fontSize: '13px' }}>Centers:</strong>
                                          <p style={{ marginTop: '4px', color: '#94a3b8', fontSize: '12px' }}>
                                            {record.tpoc_centers}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>

                                {/* RIGHT COLUMN */}
                                <div>
                                  {/* Dates & Timeline */}
                                  <div style={{ marginBottom: '20px' }}>
                                    <h4 style={{ color: '#60a5fa', marginBottom: '12px', fontSize: '15px', fontWeight: '600' }}>Dates & Timeline</h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px' }}>
                                      <div>
                                        <strong style={{ color: '#ffffff' }}>Open:</strong>
                                        <p style={{ color: '#94a3b8' }}>{record.open_date || 'N/A'}</p>
                                      </div>
                                      <div>
                                        <strong style={{ color: '#ffffff' }}>Close:</strong>
                                        <p style={{ color: '#94a3b8' }}>{record.close_date || 'N/A'}</p>
                                      </div>
                                      {record.pre_release_start && (
                                        <div>
                                          <strong style={{ color: '#ffffff' }}>Pre-Release Start:</strong>
                                          <p style={{ color: '#94a3b8' }}>{record.pre_release_start}</p>
                                        </div>
                                      )}
                                      {record.pre_release_end && (
                                        <div>
                                          <strong style={{ color: '#ffffff' }}>Pre-Release End:</strong>
                                          <p style={{ color: '#94a3b8' }}>{record.pre_release_end}</p>
                                        </div>
                                      )}
                                      {record.qa_start && (
                                        <div>
                                          <strong style={{ color: '#ffffff' }}>Q&A Start:</strong>
                                          <p style={{ color: '#94a3b8' }}>{record.qa_start}</p>
                                        </div>
                                      )}
                                      <div>
                                        <strong style={{ color: '#ffffff' }}>Modified:</strong>
                                        <p style={{ color: '#94a3b8' }}>{record.modified_date || 'N/A'}</p>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Security & Compliance */}
                                  {(record.itar_controlled || record.is_xtech_xtech_keyword_search_duplicate) && (
                                    <div style={{ marginBottom: '20px' }}>
                                      <h4 style={{ color: '#60a5fa', marginBottom: '12px', fontSize: '15px', fontWeight: '600' }}>Security & Special Programs</h4>
                                      {record.itar_controlled && (
                                        <div style={{ marginBottom: '8px' }}>
                                          <strong style={{ color: '#ffffff', fontSize: '13px' }}>ITAR Controlled:</strong>
                                          <span style={{ 
                                            marginLeft: '8px',
                                            padding: '3px 10px',
                                            background: record.itar_controlled === 'Yes' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                                            border: record.itar_controlled === 'Yes' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(34, 197, 94, 0.3)',
                                            borderRadius: '4px',
                                            fontSize: '12px',
                                            color: record.itar_controlled === 'Yes' ? '#ef4444' : '#22c55e'
                                          }}>
                                            {record.itar_controlled}
                                          </span>
                                        </div>
                                      )}
                                      {record.is_xtech_xtech_keyword_search_duplicate && (
                                        <div style={{ marginBottom: '8px' }}>
                                          <strong style={{ color: '#ffffff', fontSize: '13px' }}>xTech:</strong>
                                          <span style={{ 
                                            marginLeft: '8px',
                                            padding: '3px 10px',
                                            background: 'rgba(99, 102, 241, 0.2)',
                                            border: '1px solid rgba(99, 102, 241, 0.3)',
                                            borderRadius: '4px',
                                            fontSize: '12px',
                                            color: '#6366f1'
                                          }}>
                                            {record.is_xtech_xtech_keyword_search_duplicate}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* Q&A Engagement */}
                                  {(record.total_questions || record.published_questions) && (
                                    <div style={{ marginBottom: '20px' }}>
                                      <h4 style={{ color: '#60a5fa', marginBottom: '12px', fontSize: '15px', fontWeight: '600' }}>Q&A Engagement</h4>
                                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px' }}>
                                        {record.total_questions && (
                                          <div>
                                            <strong style={{ color: '#ffffff' }}>Total Questions:</strong>
                                            <p style={{ color: '#94a3b8' }}>{record.total_questions}</p>
                                          </div>
                                        )}
                                        {record.published_questions && (
                                          <div>
                                            <strong style={{ color: '#ffffff' }}>Published:</strong>
                                            <p style={{ color: '#94a3b8' }}>{record.published_questions}</p>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {/* Downloads Section */}
                                  {(record.topic_id || record.solicitation_instructions_download || record.component_instructions_download) && (
                                    <div style={{ marginBottom: '20px' }}>
                                      <h4 style={{ color: '#60a5fa', marginBottom: '12px', fontSize: '15px', fontWeight: '600' }}>Downloads</h4>
                                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                        {record.topic_id && (
                                          <a 
                                            href={`https://www.dodsbirsttr.mil/topics/api/public/topics/${record.topic_id}/download/PDF`}
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            style={{ 
                                              display: 'inline-flex',
                                              alignItems: 'center',
                                              gap: '8px',
                                              padding: '10px 16px',
                                              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                              border: 'none',
                                              borderRadius: '6px',
                                              color: '#ffffff',
                                              fontSize: '13px',
                                              fontWeight: '600',
                                              textDecoration: 'none',
                                              cursor: 'pointer',
                                              transition: 'all 0.2s',
                                              boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)'
                                            }}
                                            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                                          >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                              <polyline points="14 2 14 8 20 8"></polyline>
                                              <line x1="16" y1="13" x2="8" y2="13"></line>
                                              <line x1="16" y1="17" x2="8" y2="17"></line>
                                              <polyline points="10 9 9 9 8 9"></polyline>
                                            </svg>
                                            Topic PDF
                                          </a>
                                        )}
                                        {record.solicitation_instructions_download && (
                                          <a 
                                            href={record.solicitation_instructions_download} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            style={{ 
                                              display: 'inline-flex',
                                              alignItems: 'center',
                                              gap: '8px',
                                              padding: '10px 16px',
                                              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                              border: 'none',
                                              borderRadius: '6px',
                                              color: '#ffffff',
                                              fontSize: '13px',
                                              fontWeight: '600',
                                              textDecoration: 'none',
                                              cursor: 'pointer',
                                              transition: 'all 0.2s',
                                              boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)'
                                            }}
                                            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                                          >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                              <polyline points="14 2 14 8 20 8"></polyline>
                                            </svg>
                                            Solicitation Instructions
                                          </a>
                                        )}
                                        {record.component_instructions_download && (
                                          <a 
                                            href={record.component_instructions_download} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            style={{ 
                                              display: 'inline-flex',
                                              alignItems: 'center',
                                              gap: '8px',
                                              padding: '10px 16px',
                                              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                              border: 'none',
                                              borderRadius: '6px',
                                              color: '#ffffff',
                                              fontSize: '13px',
                                              fontWeight: '600',
                                              textDecoration: 'none',
                                              cursor: 'pointer',
                                              transition: 'all 0.2s',
                                              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                                            }}
                                            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                                          >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                              <polyline points="14 2 14 8 20 8"></polyline>
                                            </svg>
                                            Component Instructions
                                          </a>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {/* Q&A Section */}
                                  {record.qa_content && (
                                    <div style={{ marginBottom: '20px' }}>
                                      <h4 style={{ color: '#60a5fa', marginBottom: '12px', fontSize: '15px', fontWeight: '600' }}>Questions & Answers</h4>
                                      <div style={{
                                        padding: '16px',
                                        background: 'rgba(59, 130, 246, 0.05)',
                                        border: '1px solid rgba(59, 130, 246, 0.2)',
                                        borderRadius: '8px',
                                        maxHeight: '400px',
                                        overflowY: 'auto'
                                      }}>
                                        <pre style={{
                                          color: '#cbd5e1',
                                          fontSize: '12px',
                                          lineHeight: '1.6',
                                          whiteSpace: 'pre-wrap',
                                          wordWrap: 'break-word',
                                          margin: 0,
                                          fontFamily: 'inherit'
                                        }}>
                                          {stripHtmlAndDecode(record.qa_content)}
                                        </pre>
                                      </div>
                                      {record.qa_status && (
                                        <div style={{ marginTop: '8px', fontSize: '12px', color: '#94a3b8' }}>
                                          Status: {record.qa_status}
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* References */}
                                  {record.references_data && (
                                    <div style={{ marginBottom: '20px' }}>
                                      <h4 style={{ color: '#60a5fa', marginBottom: '12px', fontSize: '15px', fontWeight: '600' }}>References</h4>
                                      <p style={{ color: '#94a3b8', fontSize: '12px', lineHeight: '1.6' }}>
                                        {record.references_data}
                                      </p>
                                    </div>
                                  )}

                                  {/* Metadata */}
                                  <div style={{ marginBottom: '20px' }}>
                                    <h4 style={{ color: '#60a5fa', marginBottom: '12px', fontSize: '15px', fontWeight: '600' }}>Metadata</h4>
                                    <div style={{ fontSize: '13px' }}>
                                      {record.cycle_name && (
                                        <div style={{ marginBottom: '6px' }}>
                                          <strong style={{ color: '#ffffff' }}>Cycle:</strong>
                                          <span style={{ marginLeft: '8px', color: '#94a3b8' }}>{record.cycle_name}</span>
                                        </div>
                                      )}
                                      {record.solicitation_number && (
                                        <div style={{ marginBottom: '6px' }}>
                                          <strong style={{ color: '#ffffff' }}>Solicitation #:</strong>
                                          <span style={{ marginLeft: '8px', color: '#94a3b8' }}>{record.solicitation_number}</span>
                                        </div>
                                      )}
                                      {record.release_number && (
                                        <div style={{ marginBottom: '6px' }}>
                                          <strong style={{ color: '#ffffff' }}>Release #:</strong>
                                          <span style={{ marginLeft: '8px', color: '#94a3b8' }}>{record.release_number}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination and Results Per Page */}
        <div style={{
          marginTop: '24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px'
        }}>
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              gap: '8px' 
            }}>
              <button
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0 || loading}
                style={{
                  padding: '10px 16px',
                  background: currentPage === 0 ? 'rgba(51, 65, 85, 0.3)' : 'rgba(59, 130, 246, 0.2)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: '6px',
                  color: currentPage === 0 ? '#64748b' : '#60a5fa',
                  fontWeight: '500',
                  cursor: currentPage === 0 ? 'not-allowed' : 'pointer',
                  fontSize: '14px'
                }}
              >
                Previous
              </button>
              <div style={{ 
                padding: '10px 16px', 
                color: '#cbd5e1',
                display: 'flex',
                alignItems: 'center',
                fontSize: '14px'
              }}>
                Page {currentPage + 1} of {totalPages}
              </div>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                disabled={currentPage >= totalPages - 1 || loading}
                style={{
                  padding: '10px 16px',
                  background: currentPage >= totalPages - 1 ? 'rgba(51, 65, 85, 0.3)' : 'rgba(59, 130, 246, 0.2)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: '6px',
                  color: currentPage >= totalPages - 1 ? '#64748b' : '#60a5fa',
                  fontWeight: '500',
                  cursor: currentPage >= totalPages - 1 ? 'not-allowed' : 'pointer',
                  fontSize: '14px'
                }}
              >
                Next
              </button>
            </div>
          )}

          {/* Results Per Page Selector */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: '#94a3b8',
            fontSize: '14px'
          }}>
            <span style={{ fontWeight: '500' }}>Results per page:</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[25, 50, 100].map((size) => (
                <button
                  key={size}
                  onClick={() => {
                    setPageSize(size);
                    setCurrentPage(0); // Reset to first page
                  }}
                  disabled={loading}
                  style={{
                    padding: '8px 16px',
                    background: pageSize === size 
                      ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
                      : 'rgba(100, 116, 139, 0.2)',
                    border: `1px solid ${pageSize === size ? 'rgba(139, 92, 246, 0.5)' : 'rgba(100, 116, 139, 0.3)'}`,
                    borderRadius: '6px',
                    color: pageSize === size ? '#ffffff' : '#cbd5e1',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: pageSize === size ? '0 2px 8px rgba(139, 92, 246, 0.3)' : 'none'
                  }}
                  onMouseOver={(e) => {
                    if (pageSize !== size && !loading) {
                      e.currentTarget.style.background = 'rgba(139, 92, 246, 0.2)';
                      e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.4)';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (pageSize !== size) {
                      e.currentTarget.style.background = 'rgba(100, 116, 139, 0.2)';
                      e.currentTarget.style.borderColor = 'rgba(100, 116, 139, 0.3)';
                    }
                  }}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Share Search Modal */}
        {showShareModal && (
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '20px'
            }}
            onClick={() => setShowShareModal(false)}
          >
            <div 
              style={{
                background: 'linear-gradient(to bottom, #1e293b, #0f172a)',
                border: '2px solid rgba(6, 182, 212, 0.4)',
                borderRadius: '16px',
                padding: '32px',
                maxWidth: '600px',
                width: '100%',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ 
                  color: '#06b6d4', 
                  fontSize: '24px', 
                  fontWeight: '700',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="18" cy="5" r="3"></circle>
                    <circle cx="6" cy="12" r="3"></circle>
                    <circle cx="18" cy="19" r="3"></circle>
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                  </svg>
                  Share This Search
                </h3>
                <button
                  onClick={() => setShowShareModal(false)}
                  style={{
                    background: 'rgba(100, 116, 139, 0.2)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#cbd5e1',
                    fontSize: '20px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'rgba(100, 116, 139, 0.2)'}
                >
                  ×
                </button>
              </div>

              <p style={{ 
                color: '#94a3b8', 
                fontSize: '14px', 
                lineHeight: '1.6',
                marginBottom: '16px'
              }}>
                Share this search with colleagues or save it for later. Anyone with this link will be prompted to sign in before viewing the results.
              </p>

              {/* Show what's being captured */}
              <div style={{
                marginBottom: '16px',
                padding: '12px',
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '8px'
              }}>
                <div style={{ 
                  fontSize: '12px', 
                  fontWeight: '600', 
                  color: '#60a5fa', 
                  marginBottom: '8px' 
                }}>
                  Included in this link:
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: '1.6' }}>
                  {searchText && <div>• Search: "{searchText}"</div>}
                  {selectedComponent !== 'all' && <div>• Component: {selectedComponent}</div>}
                  {selectedStatuses.length > 0 && <div>• Status: {selectedStatuses.join(', ')}</div>}
                  {selectedProgramType !== 'all' && <div>• Program: {selectedProgramType}</div>}
                  {pageSize !== 25 && <div>• Results per page: {pageSize}</div>}
                  {currentPage > 0 && <div>• Page: {currentPage + 1}</div>}
                  {sortBy !== 'last_scraped' && <div>• Sorted by: {sortBy} ({sortOrder})</div>}
                  {!searchText && selectedComponent === 'all' && selectedStatuses.length === 0 && 
                   selectedProgramType === 'all' && pageSize === 25 && currentPage === 0 && 
                   sortBy === 'last_scraped' && (
                    <div style={{ color: '#f59e0b', fontStyle: 'italic' }}>
                      No filters applied - sharing default view
                    </div>
                  )}
                </div>
              </div>

              <div style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(71, 85, 105, 0.5)',
                borderRadius: '8px',
                padding: '14px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    color: '#e2e8f0',
                    fontSize: '13px',
                    outline: 'none',
                    fontFamily: 'monospace'
                  }}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={copyShareUrl}
                  style={{
                    flex: 1,
                    padding: '12px 20px',
                    background: copiedToClipboard 
                      ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                      : 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.2s',
                    boxShadow: copiedToClipboard
                      ? '0 4px 12px rgba(16, 185, 129, 0.4)'
                      : '0 4px 12px rgba(6, 182, 212, 0.4)'
                  }}
                  onMouseOver={(e) => !copiedToClipboard && (e.currentTarget.style.transform = 'translateY(-2px)')}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  {copiedToClipboard ? (
                    <>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      Copied to Clipboard
                    </>
                  ) : (
                    <>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                      </svg>
                      Copy Link
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowShareModal(false)}
                  style={{
                    padding: '12px 20px',
                    background: 'rgba(100, 116, 139, 0.2)',
                    border: '1px solid rgba(100, 116, 139, 0.3)',
                    borderRadius: '8px',
                    color: '#cbd5e1',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(100, 116, 139, 0.3)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'rgba(100, 116, 139, 0.2)'}
                >
                  Close
                </button>
              </div>

              <div style={{
                marginTop: '20px',
                padding: '12px',
                background: 'rgba(6, 182, 212, 0.1)',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#06b6d4',
                lineHeight: '1.5'
              }}>
                <strong>Note:</strong> Recipients will need to sign in to view the search results. If they don't have an account, they'll be prompted to create one and then automatically redirected to this search.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const headerStyle: React.CSSProperties = {
  padding: '14px 16px',
  textAlign: 'left',
  color: '#cbd5e1',
  fontSize: '13px',
  fontWeight: '600',
  textTransform: 'uppercase',
  letterSpacing: '0.5px'
};

const sortButtonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#cbd5e1',
  fontSize: '13px',
  fontWeight: '600',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  cursor: 'pointer',
  padding: 0,
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  transition: 'color 0.2s ease',
  width: '100%',
  textAlign: 'left'
};

const cellStyle: React.CSSProperties = {
  padding: '14px 16px',
  color: '#e2e8f0',
  fontSize: '14px'
};

function getStatusColor(status: string): string {
  switch (status?.toLowerCase()) {
    case 'open':
      return 'rgba(34, 197, 94, 0.2)';
    case 'pre-release':
      return 'rgba(234, 179, 8, 0.2)';
    case 'closed':
      return 'rgba(239, 68, 68, 0.2)';
    default:
      return 'rgba(100, 116, 139, 0.2)';
  }
}

