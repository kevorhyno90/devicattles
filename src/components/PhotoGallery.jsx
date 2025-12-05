import React, { useState, useEffect, useRef } from 'react'
import { savePhoto, getPhotosByEntity, deletePhoto } from '../lib/photoStorage'
import { fileToDataUrl } from '../lib/image'

/**
 * LazyImage Component
 * Loads images only when they become visible in viewport
 */
function LazyImage({ src, alt, style, placeholder = '#f3f4f6' }) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const imgRef = useRef(null)

  useEffect(() => {
    if (!imgRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setIsInView(true)
            observer.unobserve(entry.target)
          }
        })
      },
      {
        rootMargin: '50px' // Start loading 50px before image enters viewport
      }
    )

    observer.observe(imgRef.current)

    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current)
      }
    }
  }, [])

  return (
    <div 
      ref={imgRef}
      style={{
        ...style,
        background: isLoaded ? 'transparent' : placeholder,
        transition: 'background 0.3s'
      }}
    >
      {isInView && (
        <img
          src={src}
          alt={alt}
          onLoad={() => setIsLoaded(true)}
          style={{
            ...style,
            opacity: isLoaded ? 1 : 0,
            transition: 'opacity 0.3s'
          }}
        />
      )}
    </div>
  )
}

/**
 * Photo Gallery Component
 * Displays and manages photos for any entity (animal, crop, etc.)
 */
export default function PhotoGallery({ entityType, entityId, entityName }) {
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [caption, setCaption] = useState('')
  const [showUpload, setShowUpload] = useState(false)

  useEffect(() => {
    loadPhotos()
  }, [entityType, entityId])

  async function loadPhotos() {
    setLoading(true)
    try {
      const data = await getPhotosByEntity(entityType, entityId)
      setPhotos(data)
    } catch (error) {
      console.error('Error loading photos:', error)
    }
    setLoading(false)
  }

  async function handleFileSelect(event) {
    const file = event.target.files[0]
    if (!file) return

    setLoading(true)
    try {
      const { dataUrl } = await fileToDataUrl(file, { maxDim: 1920, quality: 0.85 })
      
      await savePhoto({
        entityType,
        entityId,
        dataUrl,
        caption: caption || `${entityName} - ${new Date().toLocaleDateString()}`,
        timestamp: Date.now()
      })

      setCaption('')
      setShowUpload(false)
      await loadPhotos()
    } catch (error) {
      alert('Error uploading photo: ' + error.message)
    }
    setLoading(false)
  }

  async function handleCameraCapture(event) {
    const file = event.target.files[0]
    if (!file) return
    await handleFileSelect(event)
  }

  async function handleDelete(photoId) {
    if (!confirm('Delete this photo?')) return

    setLoading(true)
    try {
      await deletePhoto(photoId)
      await loadPhotos()
      setSelectedPhoto(null)
    } catch (error) {
      alert('Error deleting photo: ' + error.message)
    }
    setLoading(false)
  }

  return (
    <div style={{ marginTop: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
          📸 Photos ({photos.length})
        </h3>
        <button
          onClick={() => setShowUpload(!showUpload)}
          style={{
            padding: '8px 16px',
            background: '#059669',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          {showUpload ? '✕ Cancel' : '+ Add Photo'}
        </button>
      </div>

      {/* Upload Section */}
      {showUpload && (
        <div style={{ 
          padding: '16px', 
          background: '#f9fafb', 
          borderRadius: '8px', 
          marginBottom: '16px',
          border: '2px dashed #d1d5db'
        }}>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>
              Caption (optional):
            </label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder={`Photo of ${entityName}`}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {/* Camera Capture */}
            <label style={{
              padding: '10px 20px',
              background: '#3b82f6',
              color: 'white',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              📷 Take Photo
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleCameraCapture}
                style={{ display: 'none' }}
                disabled={loading}
              />
            </label>

            {/* File Upload */}
            <label style={{
              padding: '10px 20px',
              background: '#8b5cf6',
              color: 'white',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              🖼️ Choose File
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
                disabled={loading}
              />
            </label>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>
          Loading...
        </div>
      )}

      {/* Empty State */}
      {!loading && photos.length === 0 && (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px', 
          background: '#f9fafb', 
          borderRadius: '8px',
          color: '#6b7280'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>📷</div>
          <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '4px' }}>No photos yet</div>
          <div style={{ fontSize: '14px' }}>Add photos to track visual progress</div>
        </div>
      )}

      {/* Photo Grid */}
      {!loading && photos.length > 0 && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
          gap: '12px'
        }}>
          {photos.map(photo => (
            <div
              key={photo.id}
              onClick={() => setSelectedPhoto(photo)}
              style={{
                position: 'relative',
                aspectRatio: '1',
                borderRadius: '8px',
                overflow: 'hidden',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                transition: 'transform 0.2s',
                background: '#f3f4f6'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <LazyImage
                src={photo.dataUrl}
                alt={photo.caption}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
              {photo.caption && (
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background: 'rgba(0,0,0,0.7)',
                  color: 'white',
                  padding: '6px 8px',
                  fontSize: '12px',
                  lineHeight: '1.2'
                }}>
                  {photo.caption}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Photo Lightbox */}
      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.9)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '90vw',
              maxHeight: '90vh',
              background: 'white',
              borderRadius: '12px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <img
              src={selectedPhoto.dataUrl}
              alt={selectedPhoto.caption}
              style={{
                maxWidth: '100%',
                maxHeight: '70vh',
                objectFit: 'contain'
              }}
            />
            <div style={{ padding: '16px', borderTop: '1px solid #e5e7eb' }}>
              <div style={{ marginBottom: '12px' }}>
                <strong>{selectedPhoto.caption}</strong>
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                  {new Date(selectedPhoto.timestamp).toLocaleString()}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleDelete(selectedPhoto.id)}
                  style={{
                    padding: '8px 16px',
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  🗑️ Delete
                </button>
                <button
                  onClick={() => setSelectedPhoto(null)}
                  style={{
                    padding: '8px 16px',
                    background: '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
