'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import type { Publication } from '@/data/publications'

export default function PublicationsManagementPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  
  const [publications, setPublications] = useState<Publication[]>([])
  const [isLoadingPublications, setIsLoadingPublications] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'author'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error' | 'warning'>('success')
  
  // Edit/Add modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPublication, setEditingPublication] = useState<Publication | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    date: '',
    readTime: '',
    excerpt: '',
    tags: '',
    category: 'Research & Insights',
    featured: false,
    content: '',
    sources: ''
  })

  // Check if user is authenticated and is admin
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login')
    } else if (user && !user.isAdmin) {
      router.push('/dashboard')
    } else if (user && user.isAdmin) {
      loadPublications()
    }
  }, [user, isLoading, router])

  const loadPublications = async () => {
    try {
      setIsLoadingPublications(true)
      const response = await fetch('/api/admin/publications')
      if (response.ok) {
        const data = await response.json()
        setPublications(data.publications || [])
      } else {
        setMessage('Failed to load publications')
        setMessageType('error')
      }
    } catch (error) {
      console.error('Error loading publications:', error)
      setMessage('Error loading publications')
      setMessageType('error')
    } finally {
      setIsLoadingPublications(false)
    }
  }

  const handleEdit = (publication: Publication) => {
    setEditingPublication(publication)
    setFormData({
      title: publication.title,
      author: publication.author,
      date: publication.date,
      readTime: publication.readTime,
      excerpt: publication.excerpt,
      tags: publication.tags.join(', '),
      category: publication.category,
      featured: publication.featured,
      content: publication.content,
      sources: publication.sources ? JSON.stringify(publication.sources, null, 2) : ''
    })
    setIsModalOpen(true)
  }

  const handleAddNew = () => {
    setEditingPublication(null)
    setFormData({
      title: '',
      author: '',
      date: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      readTime: '5 min read',
      excerpt: '',
      tags: '',
      category: 'Research & Insights',
      featured: false,
      content: '',
      sources: ''
    })
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    if (!formData.title || !formData.author || !formData.content) {
      setMessage('Title, author, and content are required')
      setMessageType('error')
      return
    }

    try {
      setIsSaving(true)
      
      const publicationData = {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        sources: formData.sources ? JSON.parse(formData.sources) : []
      }

      const url = editingPublication 
        ? `/api/admin/publications` 
        : `/api/admin/publications`
      
      const method = editingPublication ? 'PUT' : 'POST'
      
      const body = editingPublication 
        ? { id: editingPublication.id, ...publicationData }
        : publicationData

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      })

      if (response.ok) {
        const data = await response.json()
        setMessage(editingPublication ? 'Publication updated successfully' : 'Publication created successfully')
        setMessageType('success')
        setIsModalOpen(false)
        loadPublications()
      } else {
        const errorData = await response.json()
        setMessage(errorData.error || 'Failed to save publication')
        setMessageType('error')
      }
    } catch (error) {
      console.error('Error saving publication:', error)
      setMessage('Error saving publication')
      setMessageType('error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (publication: Publication) => {
    if (!confirm(`Are you sure you want to delete "${publication.title}"? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/publications?id=${publication.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setMessage('Publication deleted successfully')
        setMessageType('success')
        loadPublications()
      } else {
        const errorData = await response.json()
        setMessage(errorData.error || 'Failed to delete publication')
        setMessageType('error')
      }
    } catch (error) {
      console.error('Error deleting publication:', error)
      setMessage('Error deleting publication')
      setMessageType('error')
    }
  }

  const handleFormChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Filter and sort publications
  const filteredPublications = publications
    .filter(pub => {
      const matchesSearch = pub.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           pub.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           pub.excerpt.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesCategory = selectedCategory === 'All' || pub.category === selectedCategory
      
      return matchesSearch && matchesCategory
    })
    .sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title)
          break
        case 'author':
          comparison = a.author.localeCompare(b.author)
          break
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime()
          break
        default:
          comparison = 0
      }
      
      return sortOrder === 'asc' ? comparison : -comparison
    })

  const categories = ['All', ...Array.from(new Set(publications.map(p => p.category)))]

  if (isLoading || isLoadingPublications) {
    return (
      <div className="publications-management-page loading">
        <div className="container">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading publications...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="publications-management-page">
      <div className="container">
        <div className="page-header" style={{ marginBottom: '32px' }}>
          <button
            onClick={() => router.back()}
            className="back-button"
            style={{
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(148, 163, 184, 0.3)',
              borderRadius: '8px',
              padding: '8px 12px',
              color: '#cbd5e1',
              fontSize: '14px',
              cursor: 'pointer',
              marginBottom: '20px'
            }}
          >
            Back
          </button>
          <h1 style={{ color: '#ffffff', marginBottom: '8px' }}>Publications Management</h1>
          <p style={{ color: '#cbd5e1', margin: 0 }}>Manage all publications on the website. Edit, add, or remove publications.</p>
        </div>

        {message && (
          <div className={`message ${messageType}`} style={{
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '24px',
            background: messageType === 'success' ? 'rgba(34, 197, 94, 0.1)' : 
                       messageType === 'error' ? 'rgba(239, 68, 68, 0.1)' : 
                       'rgba(251, 191, 36, 0.1)',
            border: `1px solid ${messageType === 'success' ? 'rgba(34, 197, 94, 0.3)' : 
                               messageType === 'error' ? 'rgba(239, 68, 68, 0.3)' : 
                               'rgba(251, 191, 36, 0.3)'}`,
            color: messageType === 'success' ? '#22c55e' : 
                   messageType === 'error' ? '#ef4444' : 
                   '#fbbf24'
          }}>
            {message}
          </div>
        )}

        {/* Controls */}
        <div className="controls-section" style={{
          background: 'rgba(30, 41, 59, 0.6)',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px',
          border: '1px solid rgba(148, 163, 184, 0.2)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ color: '#ffffff', margin: 0, fontSize: '24px' }}>Publications ({publications.length})</h2>
            <button
              onClick={handleAddNew}
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 24px',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              Add New Publication
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', color: '#cbd5e1', fontSize: '14px', marginBottom: '8px' }}>
                Search Publications
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by title, author, or content..."
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(148, 163, 184, 0.3)',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '14px'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', color: '#cbd5e1', fontSize: '14px', marginBottom: '8px' }}>
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(148, 163, 184, 0.3)',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '14px'
                }}
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', color: '#cbd5e1', fontSize: '14px', marginBottom: '8px' }}>
                Sort By
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'date' | 'title' | 'author')}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(148, 163, 184, 0.3)',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '14px'
                  }}
                >
                  <option value="date">Date</option>
                  <option value="title">Title</option>
                  <option value="author">Author</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  style={{
                    padding: '12px',
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(148, 163, 184, 0.3)',
                    borderRadius: '8px',
                    color: '#cbd5e1',
                    cursor: 'pointer'
                  }}
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Publications List */}
        <div className="publications-list">
          {filteredPublications.map(publication => (
            <div key={publication.id} className="publication-item" style={{
              background: 'rgba(30, 41, 59, 0.6)',
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '20px',
              border: '1px solid rgba(148, 163, 184, 0.2)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <h3 style={{ color: '#ffffff', margin: 0, fontSize: '20px', lineHeight: '1.3' }}>{publication.title}</h3>
                    {publication.featured && (
                      <span style={{
                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                        color: '#ffffff',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '600',
                        whiteSpace: 'nowrap'
                      }}>
                        Featured
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '16px', color: '#94a3b8', fontSize: '14px', marginBottom: '12px', flexWrap: 'wrap' }}>
                    <span>By {publication.author}</span>
                    <span>{publication.date}</span>
                    <span>{publication.readTime}</span>
                    <span>{publication.category}</span>
                  </div>
                  <p style={{ color: '#cbd5e1', fontSize: '14px', lineHeight: '1.5', marginBottom: '12px' }}>
                    {publication.excerpt}
                  </p>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {publication.tags.slice(0, 5).map(tag => (
                      <span key={tag} style={{
                        background: 'rgba(59, 130, 246, 0.1)',
                        color: '#93c5fd',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px'
                      }}>
                        {tag}
                      </span>
                    ))}
                    {publication.tags.length > 5 && (
                      <span style={{ color: '#94a3b8', fontSize: '12px' }}>
                        +{publication.tags.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                  <button
                    onClick={() => handleEdit(publication)}
                    style={{
                      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      color: '#ffffff',
                      fontSize: '12px',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => window.open(`/publications/${publication.slug}`, '_blank')}
                    style={{
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      color: '#ffffff',
                      fontSize: '12px',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleDelete(publication)}
                    style={{
                      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      color: '#ffffff',
                      fontSize: '12px',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          {filteredPublications.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '48px',
              color: '#94a3b8'
            }}>
              <p>No publications found matching your criteria.</p>
            </div>
          )}
        </div>

        {/* Edit/Add Modal */}
        {isModalOpen && (
          <div className="modal-overlay" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}>
            <div className="modal-content" style={{
              background: 'rgba(15, 23, 42, 0.95)',
              borderRadius: '12px',
              padding: '32px',
              maxWidth: '900px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <h2 style={{ color: '#ffffff', margin: 0, fontSize: '24px' }}>
                  {editingPublication ? 'Edit Publication' : 'Add New Publication'}
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    fontSize: '24px',
                    cursor: 'pointer',
                    padding: '4px',
                    borderRadius: '4px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(148, 163, 184, 0.1)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'none'
                  }}
                >
                  ×
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', color: '#cbd5e1', fontSize: '14px', marginBottom: '8px', fontWeight: '500' }}>
                      Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => handleFormChange('title', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: 'rgba(15, 23, 42, 0.6)',
                        border: '1px solid rgba(148, 163, 184, 0.3)',
                        borderRadius: '8px',
                        color: '#ffffff',
                        fontSize: '14px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#cbd5e1', fontSize: '14px', marginBottom: '8px', fontWeight: '500' }}>
                      Author *
                    </label>
                    <input
                      type="text"
                      value={formData.author}
                      onChange={(e) => handleFormChange('author', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: 'rgba(15, 23, 42, 0.6)',
                        border: '1px solid rgba(148, 163, 184, 0.3)',
                        borderRadius: '8px',
                        color: '#ffffff',
                        fontSize: '14px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', color: '#cbd5e1', fontSize: '14px', marginBottom: '8px', fontWeight: '500' }}>
                      Date
                    </label>
                    <input
                      type="text"
                      value={formData.date}
                      onChange={(e) => handleFormChange('date', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: 'rgba(15, 23, 42, 0.6)',
                        border: '1px solid rgba(148, 163, 184, 0.3)',
                        borderRadius: '8px',
                        color: '#ffffff',
                        fontSize: '14px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#cbd5e1', fontSize: '14px', marginBottom: '8px', fontWeight: '500' }}>
                      Read Time
                    </label>
                    <input
                      type="text"
                      value={formData.readTime}
                      onChange={(e) => handleFormChange('readTime', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: 'rgba(15, 23, 42, 0.6)',
                        border: '1px solid rgba(148, 163, 184, 0.3)',
                        borderRadius: '8px',
                        color: '#ffffff',
                        fontSize: '14px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', color: '#cbd5e1', fontSize: '14px', marginBottom: '8px' }}>
                    Excerpt
                  </label>
                  <textarea
                    value={formData.excerpt}
                    onChange={(e) => handleFormChange('excerpt', e.target.value)}
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid rgba(148, 163, 184, 0.3)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '14px',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', color: '#cbd5e1', fontSize: '14px', marginBottom: '8px' }}>
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => handleFormChange('category', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: 'rgba(15, 23, 42, 0.6)',
                        border: '1px solid rgba(148, 163, 184, 0.3)',
                        borderRadius: '8px',
                        color: '#ffffff',
                        fontSize: '14px'
                      }}
                    >
                      <option value="Research & Insights">Research & Insights</option>
                      <option value="Industry News">Industry News</option>
                      <option value="Compliance">Compliance</option>
                      <option value="Technology">Technology</option>
                      <option value="Training">Training</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#cbd5e1', fontSize: '14px', marginBottom: '8px' }}>
                      Tags (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={formData.tags}
                      onChange={(e) => handleFormChange('tags', e.target.value)}
                      placeholder="Tag1, Tag2, Tag3"
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: 'rgba(15, 23, 42, 0.6)',
                        border: '1px solid rgba(148, 163, 184, 0.3)',
                        borderRadius: '8px',
                        color: '#ffffff',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#cbd5e1', fontSize: '14px' }}>
                    <input
                      type="checkbox"
                      checked={formData.featured}
                      onChange={(e) => handleFormChange('featured', e.target.checked)}
                      style={{ margin: 0 }}
                    />
                    Featured Publication
                  </label>
                </div>

                <div>
                  <label style={{ display: 'block', color: '#cbd5e1', fontSize: '14px', marginBottom: '8px' }}>
                    Content * (HTML)
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => handleFormChange('content', e.target.value)}
                    rows={10}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid rgba(148, 163, 184, 0.3)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '14px',
                      resize: 'vertical',
                      fontFamily: 'monospace'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', color: '#cbd5e1', fontSize: '14px', marginBottom: '8px' }}>
                    Sources (JSON format)
                  </label>
                  <textarea
                    value={formData.sources}
                    onChange={(e) => handleFormChange('sources', e.target.value)}
                    rows={5}
                    placeholder='[{"name": "Source Title", "url": "https://example.com", "category": "government"}]'
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid rgba(148, 163, 184, 0.3)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '14px',
                      resize: 'vertical',
                      fontFamily: 'monospace'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSaving}
                  style={{
                    background: 'rgba(148, 163, 184, 0.1)',
                    border: '1px solid rgba(148, 163, 184, 0.3)',
                    borderRadius: '8px',
                    padding: '12px 24px',
                    color: '#cbd5e1',
                    fontSize: '14px',
                    cursor: isSaving ? 'not-allowed' : 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px 24px',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: isSaving ? 'not-allowed' : 'pointer',
                    opacity: isSaving ? 0.6 : 1
                  }}
                >
                  {isSaving ? 'Saving...' : editingPublication ? 'Update Publication' : 'Create Publication'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
