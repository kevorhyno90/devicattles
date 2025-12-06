import React, { useState, useEffect, useRef } from 'react'
import {
  savePhoto,
  getAllPhotos,
  searchPhotos,
  getPhotosByCategory,
  getPhotosByTag,
  deletePhoto,
  updatePhotoMetadata,
  getPhotoStats,
  getAllTags,
  exportPhotoMetadata,
  compressImage
} from '../lib/photoAnalysis'

/**
 * Advanced Photo Gallery with AI Tagging
 */
export default function PhotoGalleryAdvanced() {
  const [photos, setPhotos] = useState([])
  const [filteredPhotos, setFilteredPhotos] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedTag, setSelectedTag] = useState(null)
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [stats, setStats] = useState({})
  const [allTags, setAllTags] = useState([])
  const [uploading, setUploading] = useState(false)
  const [viewMode, setViewMode] = useState('grid') // grid, list
  const fileInputRef = useRef(null)

  useEffect(() => {
    loadPhotos()
  }, [])

  useEffect(() => {
    filterPhotos()
  }, [photos, searchQuery, selectedCategory, selectedTag])

  const loadPhotos = () => {
    const allPhotos = getAllPhotos()
    setPhotos(allPhotos)
    setStats(getPhotoStats())
    setAllTags(getAllTags())
  }

  const filterPhotos = () => {
    let filtered = photos

    // Filter by search query
    if (searchQuery) {
      filtered = searchPhotos(searchQuery)
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === selectedCategory)
    }

    // Filter by tag
    if (selectedTag) {
      filtered = filtered.filter(p => p.tags && p.tags.includes(selectedTag))
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => 
      new Date(b.metadata.uploadDate) - new Date(a.metadata.uploadDate)
    )

    setFilteredPhotos(filtered)
  }

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    setUploading(true)

    try {
      for (const file of files) {
        // Compress image first
        const compressed = await compressImage(file, 1200, 0.8)
        
        // Save with metadata
        await savePhoto(compressed, {
          category: selectedCategory !== 'all' ? selectedCategory : 'general'
        })
      }

      loadPhotos()
      alert(`Successfully uploaded ${files.length} photo(s)`)
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload photos. Please try again.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDeletePhoto = (photoId) => {
    if (confirm('Are you sure you want to delete this photo?')) {
      deletePhoto(photoId)
      loadPhotos()
      setSelectedPhoto(null)
    }
  }

  const handleExport = () => {
    const data = exportPhotoMetadata()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `photo-metadata-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const categories = ['all', 'animals', 'crops', 'equipment', 'facilities', 'products', 'general']

  return (
    <div style={{ padding: '20px', maxWidth: '1600px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: 'bold' }}>
          📸 Photo Gallery
        </h2>
        <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
          Smart photo management with AI-powered tagging
        </p>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div style={{ background: 'white', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Total Photos</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#3b82f6' }}>{stats.total || 0}</div>
        </div>
        <div style={{ background: 'white', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Categories</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#059669' }}>
            {stats.byCategory ? Object.keys(stats.byCategory).length : 0}
          </div>
        </div>
        <div style={{ background: 'white', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Unique Tags</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#8b5cf6' }}>{allTags.length}</div>
        </div>
        <div style={{ background: 'white', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Filtered</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#f59e0b' }}>{filteredPhotos.length}</div>
        </div>
      </div>

      {/* Controls */}
      <div style={{
        background: 'white',
        padding: '16px',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
          {/* Upload button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            style={{
              padding: '10px 20px',
              background: uploading ? '#9ca3af' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: uploading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            {uploading ? '⏳ Uploading...' : '📤 Upload Photos'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />

          {/* Export button */}
          <button
            onClick={handleExport}
            style={{
              padding: '10px 20px',
              background: '#059669',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            📥 Export Metadata
          </button>

          {/* View mode */}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setViewMode('grid')}
              style={{
                padding: '8px 16px',
                background: viewMode === 'grid' ? '#3b82f6' : '#f3f4f6',
                color: viewMode === 'grid' ? 'white' : '#1f2937',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              🔲 Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              style={{
                padding: '8px 16px',
                background: viewMode === 'list' ? '#3b82f6' : '#f3f4f6',
                color: viewMode === 'list' ? 'white' : '#1f2937',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              📋 List
            </button>
          </div>
        </div>

        {/* Search */}
        <div style={{ marginBottom: '16px' }}>
          <input
            type="text"
            placeholder="🔍 Search photos by tags, filename, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 16px',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              fontSize: '14px'
            }}
          />
        </div>

        {/* Category filters */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat)
                setSelectedTag(null)
              }}
              style={{
                padding: '6px 14px',
                background: selectedCategory === cat ? '#3b82f6' : '#f3f4f6',
                color: selectedCategory === cat ? 'white' : '#1f2937',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                textTransform: 'capitalize'
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Top tags */}
        {stats.topTags && stats.topTags.length > 0 && (
          <div>
            <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '8px' }}>Popular Tags:</div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {stats.topTags.map(([tag, count]) => (
                <button
                  key={tag}
                  onClick={() => {
                    setSelectedTag(selectedTag === tag ? null : tag)
                    setSelectedCategory('all')
                  }}
                  style={{
                    padding: '4px 10px',
                    background: selectedTag === tag ? '#8b5cf6' : '#f3f4f6',
                    color: selectedTag === tag ? 'white' : '#6b7280',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '11px'
                  }}
                >
                  #{tag} ({count})
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Photos Grid/List */}
      {filteredPhotos.length === 0 ? (
        <div style={{
          background: 'white',
          padding: '60px 20px',
          borderRadius: '8px',
          textAlign: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>📷</div>
          <div style={{ fontSize: '18px', color: '#1f2937', marginBottom: '8px' }}>No photos found</div>
          <div style={{ fontSize: '14px', color: '#6b7280' }}>
            {searchQuery || selectedTag ? 'Try adjusting your filters' : 'Upload your first photo to get started'}
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '16px'
        }}>
          {filteredPhotos.map(photo => (
            <div
              key={photo.id}
              onClick={() => setSelectedPhoto(photo)}
              style={{
                background: 'white',
                borderRadius: '8px',
                overflow: 'hidden',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                cursor: 'pointer',
                transition: 'transform 0.2s',
                ':hover': { transform: 'scale(1.05)' }
              }}
            >
              <img
                src={photo.base64}
                alt={photo.filename}
                style={{
                  width: '100%',
                  height: '200px',
                  objectFit: 'cover'
                }}
              />
              <div style={{ padding: '12px' }}>
                <div style={{ fontSize: '13px', fontWeight: '500', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {photo.filename}
                </div>
                <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '8px', textTransform: 'capitalize' }}>
                  {photo.category}
                </div>
                {photo.tags && photo.tags.length > 0 && (
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {photo.tags.slice(0, 3).map(tag => (
                      <span
                        key={tag}
                        style={{
                          fontSize: '10px',
                          padding: '2px 6px',
                          background: '#f3f4f6',
                          borderRadius: '3px',
                          color: '#6b7280'
                        }}
                      >
                        #{tag}
                      </span>
                    ))}
                    {photo.tags.length > 3 && (
                      <span style={{ fontSize: '10px', color: '#6b7280' }}>
                        +{photo.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          {filteredPhotos.map((photo, index) => (
            <div
              key={photo.id}
              onClick={() => setSelectedPhoto(photo)}
              style={{
                display: 'flex',
                gap: '16px',
                padding: '16px',
                borderBottom: index < filteredPhotos.length - 1 ? '1px solid #e5e7eb' : 'none',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
            >
              <img
                src={photo.base64}
                alt={photo.filename}
                style={{
                  width: '80px',
                  height: '80px',
                  objectFit: 'cover',
                  borderRadius: '6px'
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                  {photo.filename}
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                  {photo.analysis.width} × {photo.analysis.height} • {(photo.analysis.size / 1024).toFixed(0)} KB • {photo.category}
                </div>
                {photo.tags && photo.tags.length > 0 && (
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {photo.tags.map(tag => (
                      <span
                        key={tag}
                        style={{
                          fontSize: '11px',
                          padding: '2px 8px',
                          background: '#f3f4f6',
                          borderRadius: '4px',
                          color: '#6b7280'
                        }}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ fontSize: '11px', color: '#6b7280' }}>
                {new Date(photo.metadata.uploadDate).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Photo Detail Modal */}
      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: '12px',
              maxWidth: '900px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '20px',
              borderBottom: '1px solid #e5e7eb'
            }}>
              <h3 style={{ margin: 0, fontSize: '18px' }}>{selectedPhoto.filename}</h3>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => handleDeletePhoto(selectedPhoto.id)}
                  style={{
                    padding: '6px 12px',
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px'
                  }}
                >
                  🗑️ Delete
                </button>
                <button
                  onClick={() => setSelectedPhoto(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '24px',
                    cursor: 'pointer',
                    color: '#6b7280'
                  }}
                >
                  ×
                </button>
              </div>
            </div>

            {/* Image */}
            <div style={{ padding: '20px', background: '#f9fafb' }}>
              <img
                src={selectedPhoto.base64}
                alt={selectedPhoto.filename}
                style={{
                  width: '100%',
                  maxHeight: '500px',
                  objectFit: 'contain',
                  borderRadius: '8px'
                }}
              />
            </div>

            {/* Details */}
            <div style={{ padding: '20px' }}>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', fontWeight: '500' }}>
                  Image Properties
                </div>
                <div style={{ fontSize: '13px', lineHeight: '1.8' }}>
                  <div>📐 Dimensions: {selectedPhoto.analysis.width} × {selectedPhoto.analysis.height}px</div>
                  <div>💾 Size: {(selectedPhoto.analysis.size / 1024).toFixed(1)} KB</div>
                  <div>📊 Aspect Ratio: {selectedPhoto.analysis.aspectRatio}</div>
                  <div>💡 Brightness: {selectedPhoto.analysis.brightness}/255</div>
                  <div>📅 Upload Date: {new Date(selectedPhoto.metadata.uploadDate).toLocaleString()}</div>
                </div>
              </div>

              {selectedPhoto.analysis.dominantColors && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', fontWeight: '500' }}>
                    Dominant Colors
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {selectedPhoto.analysis.dominantColors.map((color, i) => (
                      <div
                        key={i}
                        style={{
                          width: '60px',
                          height: '60px',
                          background: color.hex,
                          borderRadius: '8px',
                          border: '2px solid #e5e7eb',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10px',
                          color: color.r + color.g + color.b > 380 ? '#000' : '#fff',
                          fontWeight: '500'
                        }}
                      >
                        {color.hex}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedPhoto.tags && selectedPhoto.tags.length > 0 && (
                <div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', fontWeight: '500' }}>
                    AI Tags ({selectedPhoto.tags.length})
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {selectedPhoto.tags.map(tag => (
                      <span
                        key={tag}
                        style={{
                          padding: '4px 10px',
                          background: '#f3f4f6',
                          borderRadius: '6px',
                          fontSize: '12px',
                          color: '#1f2937'
                        }}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
