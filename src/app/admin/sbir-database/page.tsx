'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface SBIRRecord {
  topic_number: string;
  topic_id: string;
  title: string;
  component: string;
  status: string;
  program_type: string;
  open_date: string;
  close_date: string;
  description: string;
  keywords: string;
  technology_areas: string;
  modified_date: string;
}

interface FilterOptions {
  components: string[];
  statuses: string[];
  programTypes: string[];
}

export default function SBIRDatabaseBrowser() {
  const [records, setRecords] = useState<SBIRRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedComponent, setSelectedComponent] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
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

  const pageSize = 25;

  // Fetch data when filters or page changes
  useEffect(() => {
    fetchRecords();
  }, [currentPage, selectedComponent, selectedStatus, selectedProgramType]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/sbir/browse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          searchText,
          component: selectedComponent,
          status: selectedStatus,
          programType: selectedProgramType,
          page: currentPage,
          pageSize,
          sortBy: 'modified_date',
          sortOrder: 'desc'
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
    setSelectedStatus('all');
    setSelectedProgramType('all');
    setCurrentPage(0);
  };

  const toggleRow = (topicId: string) => {
    setExpandedRow(expandedRow === topicId ? null : topicId);
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
              fontSize: '14px', 
              fontWeight: '500',
              marginBottom: '8px'
            }}>
              🔍 Smart Search
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

          {/* Filter Dropdowns */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '16px'
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

            {/* Status Filter */}
            <div>
              <label style={{ 
                display: 'block', 
                color: '#cbd5e1', 
                fontSize: '13px', 
                fontWeight: '500',
                marginBottom: '6px'
              }}>
                Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
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
                <option value="all">All Statuses</option>
                {filterOptions.statuses.map(status => (
                  <option key={status} value={status}>{status}</option>
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
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '16px',
          color: '#94a3b8',
          fontSize: '14px'
        }}>
          <div>
            {loading ? 'Loading...' : `Showing ${records.length} of ${totalRecords.toLocaleString()} results`}
          </div>
          <div>
            Page {currentPage + 1} of {totalPages || 1}
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
                  <th style={headerStyle}>Topic #</th>
                  <th style={headerStyle}>Title</th>
                  <th style={headerStyle}>Component</th>
                  <th style={headerStyle}>Status</th>
                  <th style={headerStyle}>Program</th>
                  <th style={headerStyle}>Close Date</th>
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
                          <span style={{
                            padding: '4px 10px',
                            background: 'rgba(59, 130, 246, 0.2)',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '500'
                          }}>
                            {record.component}
                          </span>
                        </td>
                        <td style={cellStyle}>
                          <span style={{
                            padding: '4px 10px',
                            background: getStatusColor(record.status),
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '500'
                          }}>
                            {record.status}
                          </span>
                        </td>
                        <td style={cellStyle}>{record.program_type || 'N/A'}</td>
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
                              <div style={{ marginBottom: '12px' }}>
                                <strong style={{ color: '#ffffff' }}>Description:</strong>
                                <p style={{ marginTop: '6px', color: '#94a3b8' }}>
                                  {record.description?.substring(0, 500) || 'No description available'}
                                  {record.description?.length > 500 && '...'}
                                </p>
                              </div>
                              {record.keywords && (
                                <div style={{ marginBottom: '12px' }}>
                                  <strong style={{ color: '#ffffff' }}>Keywords:</strong>
                                  <p style={{ marginTop: '6px', color: '#94a3b8' }}>
                                    {record.keywords.substring(0, 200)}
                                    {record.keywords.length > 200 && '...'}
                                  </p>
                                </div>
                              )}
                              {record.technology_areas && (
                                <div style={{ marginBottom: '12px' }}>
                                  <strong style={{ color: '#ffffff' }}>Technology Areas:</strong>
                                  <p style={{ marginTop: '6px', color: '#94a3b8' }}>
                                    {record.technology_areas}
                                  </p>
                                </div>
                              )}
                              <div style={{ 
                                display: 'flex', 
                                gap: '20px', 
                                marginTop: '16px',
                                fontSize: '14px'
                              }}>
                                <div>
                                  <strong style={{ color: '#ffffff' }}>Open:</strong>{' '}
                                  <span style={{ color: '#94a3b8' }}>{record.open_date || 'N/A'}</span>
                                </div>
                                <div>
                                  <strong style={{ color: '#ffffff' }}>Close:</strong>{' '}
                                  <span style={{ color: '#94a3b8' }}>{record.close_date || 'N/A'}</span>
                                </div>
                                <div>
                                  <strong style={{ color: '#ffffff' }}>Last Updated:</strong>{' '}
                                  <span style={{ color: '#94a3b8' }}>{record.modified_date || 'N/A'}</span>
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ 
            marginTop: '24px', 
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

