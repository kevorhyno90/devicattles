import React, { useState, useEffect, useRef } from 'react'
import {
  getFarmLocation,
  saveFarmLocation,
  getFieldBoundaries,
  saveFieldBoundary,
  updateFieldBoundary,
  deleteFieldBoundary,
  getAllMapMarkers,
  getMapStats,
  exportMapData,
  calculateDistance
} from '../lib/farmMapping'

/**
 * Geospatial Farm Mapping with field boundaries and GPS tracking
 * Canvas-based interactive map (no external dependencies)
 */
export default function GeospatialMap() {
  const [farmLocation, setFarmLocation] = useState({ lat: 0, lng: 0, zoom: 15 })
  const [fields, setFields] = useState([])
  const [markers, setMarkers] = useState([])
  const [stats, setStats] = useState({})
  const [selectedField, setSelectedField] = useState(null)
  const [drawingMode, setDrawingMode] = useState(false)
  const [newFieldPoints, setNewFieldPoints] = useState([])
  const [showAddFieldModal, setShowAddFieldModal] = useState(false)
  const [mapCenter, setMapCenter] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(15)
  const canvasRef = useRef(null)

  useEffect(() => {
    loadMapData()
  }, [])

  useEffect(() => {
    if (canvasRef.current) {
      renderMap()
    }
  }, [fields, markers, mapCenter, zoom, newFieldPoints, selectedField])

  const loadMapData = () => {
    const location = getFarmLocation()
    setFarmLocation(location)
    setMapCenter({ x: location.lng, y: location.lat })
    setZoom(location.zoom)
    
    setFields(getFieldBoundaries())
    setMarkers(getAllMapMarkers())
    setStats(getMapStats())
  }

  const renderMap = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const width = canvas.width
    const height = canvas.height

    // Clear canvas
    ctx.fillStyle = '#e5e7eb'
    ctx.fillRect(0, 0, width, height)

    // Draw grid
    ctx.strokeStyle = '#d1d5db'
    ctx.lineWidth = 1
    const gridSize = 50
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
    }
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }

    // Draw fields
    fields.forEach(field => {
      if (!field.coordinates || field.coordinates.length < 3) return

      const screenCoords = field.coordinates.map(coord => 
        geoToScreen(coord[0], coord[1], width, height)
      )

      // Fill
      ctx.fillStyle = field.color + '40' // 25% opacity
      ctx.beginPath()
      ctx.moveTo(screenCoords[0].x, screenCoords[0].y)
      screenCoords.forEach(coord => ctx.lineTo(coord.x, coord.y))
      ctx.closePath()
      ctx.fill()

      // Border
      ctx.strokeStyle = field.color
      ctx.lineWidth = selectedField?.id === field.id ? 3 : 2
      ctx.stroke()

      // Label
      const centerX = screenCoords.reduce((sum, c) => sum + c.x, 0) / screenCoords.length
      const centerY = screenCoords.reduce((sum, c) => sum + c.y, 0) / screenCoords.length
      
      ctx.fillStyle = '#000'
      ctx.font = 'bold 12px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(field.name, centerX, centerY)
      
      if (field.crop) {
        ctx.font = '10px Arial'
        ctx.fillText(field.crop, centerX, centerY + 14)
      }
      
      ctx.font = '9px Arial'
      ctx.fillStyle = '#6b7280'
      ctx.fillText(`${field.area} ha`, centerX, centerY + 26)
    })

    // Draw markers
    markers.forEach(marker => {
      const screen = geoToScreen(marker.lat, marker.lng, width, height)
      
      // Icon background
      ctx.fillStyle = marker.color
      ctx.beginPath()
      ctx.arc(screen.x, screen.y, 12, 0, Math.PI * 2)
      ctx.fill()
      
      // Icon
      ctx.font = '16px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(marker.icon, screen.x, screen.y)
      
      // Label
      ctx.font = '10px Arial'
      ctx.fillStyle = '#000'
      ctx.textBaseline = 'top'
      ctx.fillText(marker.name, screen.x, screen.y + 16)
    })

    // Draw new field being drawn
    if (newFieldPoints.length > 0) {
      const screenCoords = newFieldPoints.map(coord => 
        geoToScreen(coord[0], coord[1], width, height)
      )

      ctx.strokeStyle = '#3b82f6'
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])
      ctx.beginPath()
      ctx.moveTo(screenCoords[0].x, screenCoords[0].y)
      screenCoords.forEach(coord => ctx.lineTo(coord.x, coord.y))
      ctx.stroke()
      ctx.setLineDash([])

      // Draw points
      screenCoords.forEach(coord => {
        ctx.fillStyle = '#3b82f6'
        ctx.beginPath()
        ctx.arc(coord.x, coord.y, 5, 0, Math.PI * 2)
        ctx.fill()
      })
    }

    // Draw center marker
    const center = geoToScreen(farmLocation.lat, farmLocation.lng, width, height)
    ctx.fillStyle = '#ef4444'
    ctx.beginPath()
    ctx.arc(center.x, center.y, 8, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 10px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('🏠', center.x, center.y)
  }

  const geoToScreen = (lat, lng, width, height) => {
    const scale = Math.pow(2, zoom - 8)
    const x = width / 2 + (lng - mapCenter.x) * scale * 1000
    const y = height / 2 - (lat - mapCenter.y) * scale * 1000
    return { x, y }
  }

  const screenToGeo = (x, y, width, height) => {
    const scale = Math.pow(2, zoom - 8)
    const lng = mapCenter.x + (x - width / 2) / (scale * 1000)
    const lat = mapCenter.y - (y - height / 2) / (scale * 1000)
    return { lat, lng }
  }

  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    if (drawingMode) {
      // Add point to new field
      const geo = screenToGeo(x, y, canvas.width, canvas.height)
      setNewFieldPoints([...newFieldPoints, [geo.lat, geo.lng]])
    } else {
      // Check if clicked on field
      const clickedField = fields.find(field => {
        if (!field.coordinates) return false
        const screenCoords = field.coordinates.map(coord => 
          geoToScreen(coord[0], coord[1], canvas.width, canvas.height)
        )
        return isPointInPolygon(x, y, screenCoords)
      })
      
      setSelectedField(clickedField)
    }
  }

  const isPointInPolygon = (x, y, polygon) => {
    let inside = false
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x, yi = polygon[i].y
      const xj = polygon[j].x, yj = polygon[j].y
      
      const intersect = ((yi > y) !== (yj > y)) &&
        (x < (xj - xi) * (y - yi) / (yj - yi) + xi)
      if (intersect) inside = !inside
    }
    return inside
  }

  const startDrawingField = () => {
    setDrawingMode(true)
    setNewFieldPoints([])
    setSelectedField(null)
  }

  const finishDrawingField = () => {
    if (newFieldPoints.length >= 3) {
      setShowAddFieldModal(true)
    } else {
      alert('Please add at least 3 points to create a field')
      setNewFieldPoints([])
      setDrawingMode(false)
    }
  }

  const cancelDrawing = () => {
    setNewFieldPoints([])
    setDrawingMode(false)
  }

  const saveNewField = (name, crop, notes) => {
    const field = saveFieldBoundary({
      name,
      crop,
      notes,
      coordinates: newFieldPoints
    })
    
    if (field) {
      loadMapData()
      setShowAddFieldModal(false)
      setNewFieldPoints([])
      setDrawingMode(false)
      alert('Field saved successfully!')
    }
  }

  const handleDeleteField = () => {
    if (!selectedField) return
    
    if (confirm(`Delete field "${selectedField.name}"?`)) {
      deleteFieldBoundary(selectedField.id)
      loadMapData()
      setSelectedField(null)
    }
  }

  const handleExport = () => {
    const data = exportMapData()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `farm-map-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1600px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: 'bold' }}>
          🌍 Geospatial Mapping
        </h2>
        <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
          Interactive map with field boundaries, GPS tracking, and area calculations
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
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Total Fields</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#22c55e' }}>{stats.totalFields || 0}</div>
        </div>
        <div style={{ background: 'white', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Total Area</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#3b82f6' }}>{stats.totalArea || 0} ha</div>
        </div>
        <div style={{ background: 'white', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Active Fields</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#f59e0b' }}>{stats.activeFields || 0}</div>
        </div>
        <div style={{ background: 'white', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Markers</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#8b5cf6' }}>{stats.markers || 0}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '20px' }}>
        {/* Map Canvas */}
        <div style={{ flex: 1 }}>
          <div style={{
            background: 'white',
            padding: '16px',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            marginBottom: '16px'
          }}>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '12px' }}>
              {!drawingMode ? (
                <>
                  <button
                    onClick={startDrawingField}
                    style={{
                      padding: '10px 20px',
                      background: '#22c55e',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    ➕ Draw Field
                  </button>
                  <button
                    onClick={handleExport}
                    style={{
                      padding: '10px 20px',
                      background: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    📥 Export
                  </button>
                  {selectedField && (
                    <button
                      onClick={handleDeleteField}
                      style={{
                        padding: '10px 20px',
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}
                    >
                      🗑️ Delete Field
                    </button>
                  )}
                </>
              ) : (
                <>
                  <button
                    onClick={finishDrawingField}
                    disabled={newFieldPoints.length < 3}
                    style={{
                      padding: '10px 20px',
                      background: newFieldPoints.length >= 3 ? '#22c55e' : '#9ca3af',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: newFieldPoints.length >= 3 ? 'pointer' : 'not-allowed',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    ✓ Finish ({newFieldPoints.length} points)
                  </button>
                  <button
                    onClick={cancelDrawing}
                    style={{
                      padding: '10px 20px',
                      background: '#6b7280',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    ✕ Cancel
                  </button>
                </>
              )}
            </div>

            {drawingMode && (
              <div style={{
                padding: '12px',
                background: '#dbeafe',
                borderRadius: '6px',
                fontSize: '13px',
                color: '#1e40af'
              }}>
                📍 Click on the map to add boundary points. Add at least 3 points to create a field.
              </div>
            )}

            <div style={{ marginTop: '12px' }}>
              <label style={{ fontSize: '13px', color: '#6b7280', marginRight: '12px' }}>
                Zoom: {zoom}
              </label>
              <input
                type="range"
                min="10"
                max="20"
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                style={{ width: '200px' }}
              />
            </div>
          </div>

          <canvas
            ref={canvasRef}
            width={1000}
            height={700}
            onClick={handleCanvasClick}
            style={{
              width: '100%',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              cursor: drawingMode ? 'crosshair' : 'pointer',
              background: 'white'
            }}
          />
        </div>

        {/* Details Panel */}
        {selectedField && (
          <div style={{
            width: '300px',
            background: 'white',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            height: 'fit-content'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px' }}>Field Details</h3>
              <button
                onClick={() => setSelectedField(null)}
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

            <div style={{
              width: '60px',
              height: '60px',
              background: selectedField.color,
              borderRadius: '8px',
              margin: '0 auto 16px',
              border: '2px solid #e5e7eb'
            }} />

            <div style={{ fontSize: '14px', lineHeight: '1.8' }}>
              <div style={{ marginBottom: '12px' }}>
                <strong>Name:</strong> {selectedField.name}
              </div>
              <div style={{ marginBottom: '12px' }}>
                <strong>Area:</strong> {selectedField.area} hectares
              </div>
              {selectedField.crop && (
                <div style={{ marginBottom: '12px' }}>
                  <strong>Crop:</strong> {selectedField.crop}
                </div>
              )}
              {selectedField.notes && (
                <div style={{ marginBottom: '12px' }}>
                  <strong>Notes:</strong> {selectedField.notes}
                </div>
              )}
              <div style={{ marginBottom: '12px' }}>
                <strong>Boundary Points:</strong> {selectedField.coordinates?.length || 0}
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                Created: {new Date(selectedField.createdDate).toLocaleDateString()}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Field Modal */}
      {showAddFieldModal && (
        <div
          onClick={() => setShowAddFieldModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white',
              padding: '24px',
              borderRadius: '12px',
              maxWidth: '400px',
              width: '90%'
            }}
          >
            <h3 style={{ margin: '0 0 20px 0', fontSize: '20px' }}>Save New Field</h3>
            
            <form onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.target)
              saveNewField(
                formData.get('name'),
                formData.get('crop'),
                formData.get('notes')
              )
            }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                  Field Name *
                </label>
                <input
                  type="text"
                  id="field-name"
                  name="name"
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                  Crop (optional)
                </label>
                <input
                  type="text"
                  id="field-crop"
                  name="crop"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                  Notes (optional)
                </label>
                <textarea
                  id="field-notes"
                  name="notes"
                  rows="3"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: '#22c55e',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  Save Field
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddFieldModal(false)
                    cancelDrawing()
                  }}
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
