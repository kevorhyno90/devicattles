import React, { useState, useEffect, useRef } from 'react'
import {
  generateFarmObjects,
  updateAnimalPositions,
  getFarmStats,
  OBJECT_TYPES,
  DEFAULT_FARM_SIZE
} from '../lib/farmVisualization'

/**
 * Simple Canvas-based 3D Farm Visualization
 * Uses 2.5D isometric projection (no Three.js dependency needed)
 */
export default function Farm3D() {
  const canvasRef = useRef(null)
  const [objects, setObjects] = useState([])
  const [selectedObject, setSelectedObject] = useState(null)
  const [stats, setStats] = useState({})
  const [viewAngle, setViewAngle] = useState(45)
  const [zoom, setZoom] = useState(1)
  const [animating, setAnimating] = useState(true)
  const [showLabels, setShowLabels] = useState(true)
  const animationRef = useRef(null)

  useEffect(() => {
    loadFarmData()
  }, [])

  useEffect(() => {
    if (animating && objects.length > 0) {
      animationRef.current = setInterval(() => {
        setObjects(prevObjects => updateAnimalPositions([...prevObjects]))
      }, 2000)
    }
    return () => {
      if (animationRef.current) {
        clearInterval(animationRef.current)
      }
    }
  }, [animating, objects.length])

  useEffect(() => {
    if (canvasRef.current) {
      renderFarm()
    }
  }, [objects, viewAngle, zoom, showLabels])

  const loadFarmData = () => {
    const farmObjects = generateFarmObjects()
    setObjects(farmObjects)
    setStats(getFarmStats())
  }

  const renderFarm = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const width = canvas.width
    const height = canvas.height

    // Clear canvas
    ctx.fillStyle = '#87CEEB' // Sky blue
    ctx.fillRect(0, 0, width, height)

    // Draw ground
    ctx.fillStyle = '#90EE90'
    ctx.fillRect(0, height * 0.4, width, height * 0.6)

    // Calculate center point
    const centerX = width / 2
    const centerY = height / 2

    // Sort objects by z-position (painter's algorithm)
    const sortedObjects = [...objects].sort((a, b) => {
      const aZ = a.position?.z || 0
      const bZ = b.position?.z || 0
      return aZ - bZ
    })

    // Draw each object
    sortedObjects.forEach(obj => {
      if (!obj.position) return

      const screenPos = projectToScreen(
        obj.position.x,
        obj.position.y,
        obj.position.z,
        centerX,
        centerY,
        viewAngle,
        zoom
      )

      ctx.save()

      switch (obj.type) {
        case OBJECT_TYPES.ANIMAL:
          drawAnimal(ctx, screenPos, obj)
          break
        case OBJECT_TYPES.BUILDING:
          drawBuilding(ctx, screenPos, obj)
          break
        case OBJECT_TYPES.FIELD:
          drawField(ctx, screenPos, obj)
          break
        case OBJECT_TYPES.TREE:
          drawTree(ctx, screenPos, obj)
          break
        case OBJECT_TYPES.WATER:
          drawWater(ctx, screenPos, obj)
          break
        case OBJECT_TYPES.FENCE:
          drawFence(ctx, screenPos, obj)
          break
      }

      // Draw label
      if (showLabels && obj.name) {
        ctx.fillStyle = '#000000'
        ctx.font = '10px Arial'
        ctx.textAlign = 'center'
        ctx.fillText(obj.name, screenPos.x, screenPos.y - 15)
      }

      // Highlight selected
      if (selectedObject?.id === obj.id) {
        ctx.strokeStyle = '#FFD700'
        ctx.lineWidth = 2
        ctx.strokeRect(screenPos.x - 15, screenPos.y - 15, 30, 30)
      }

      ctx.restore()
    })

    // Draw grid
    drawGrid(ctx, centerX, centerY, viewAngle, zoom)
  }

  const projectToScreen = (x, y, z, centerX, centerY, angle, scale) => {
    const rad = (angle * Math.PI) / 180
    const cos = Math.cos(rad)
    const sin = Math.sin(rad)

    // Isometric projection
    const screenX = centerX + (x * cos - z * sin) * scale * 0.5
    const screenY = centerY + (x * sin + z * cos) * scale * 0.25 - y * scale * 0.5

    return { x: screenX, y: screenY }
  }

  const drawAnimal = (ctx, pos, obj) => {
    const size = 8
    
    // Body
    ctx.fillStyle = obj.color
    ctx.beginPath()
    ctx.arc(pos.x, pos.y, size, 0, Math.PI * 2)
    ctx.fill()

    // Health indicator
    if (obj.health === 'sick') {
      ctx.fillStyle = '#FF0000'
      ctx.beginPath()
      ctx.arc(pos.x + size, pos.y - size, 3, 0, Math.PI * 2)
      ctx.fill()
    }

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)'
    ctx.beginPath()
    ctx.ellipse(pos.x, pos.y + size + 2, size, size * 0.5, 0, 0, Math.PI * 2)
    ctx.fill()
  }

  const drawBuilding = (ctx, pos, obj) => {
    const w = (obj.size?.width || 20) * zoom * 0.5
    const h = (obj.size?.height || 15) * zoom * 0.5
    const d = (obj.size?.depth || 20) * zoom * 0.5

    // Front face
    ctx.fillStyle = obj.color
    ctx.fillRect(pos.x - w / 2, pos.y - h, w, h)

    // Roof
    ctx.fillStyle = '#8B0000'
    ctx.beginPath()
    ctx.moveTo(pos.x - w / 2 - 5, pos.y - h)
    ctx.lineTo(pos.x, pos.y - h - 10)
    ctx.lineTo(pos.x + w / 2 + 5, pos.y - h)
    ctx.closePath()
    ctx.fill()

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)'
    ctx.fillRect(pos.x - w / 2, pos.y, w + 10, 5)
  }

  const drawField = (ctx, pos, obj) => {
    const w = (obj.size?.width || 30) * zoom * 0.5
    const d = (obj.size?.depth || 30) * zoom * 0.5

    // Field
    ctx.fillStyle = obj.color
    ctx.fillRect(pos.x - w / 2, pos.y - d / 2, w, d)

    // Border
    ctx.strokeStyle = '#654321'
    ctx.lineWidth = 1
    ctx.strokeRect(pos.x - w / 2, pos.y - d / 2, w, d)

    // Crop rows
    ctx.strokeStyle = 'rgba(0,0,0,0.1)'
    for (let i = 1; i < 5; i++) {
      const y = pos.y - d / 2 + (d / 5) * i
      ctx.beginPath()
      ctx.moveTo(pos.x - w / 2, y)
      ctx.lineTo(pos.x + w / 2, y)
      ctx.stroke()
    }
  }

  const drawTree = (ctx, pos, obj) => {
    // Trunk
    ctx.fillStyle = '#8B4513'
    ctx.fillRect(pos.x - 2, pos.y - 10, 4, 10)

    // Foliage
    ctx.fillStyle = obj.color
    ctx.beginPath()
    ctx.arc(pos.x, pos.y - 15, 10, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(pos.x - 5, pos.y - 10, 8, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(pos.x + 5, pos.y - 10, 8, 0, Math.PI * 2)
    ctx.fill()
  }

  const drawWater = (ctx, pos, obj) => {
    const w = (obj.size?.width || 20) * zoom * 0.5
    const d = (obj.size?.depth || 20) * zoom * 0.5

    // Water
    ctx.fillStyle = obj.color
    ctx.beginPath()
    ctx.ellipse(pos.x, pos.y, w / 2, d / 2, 0, 0, Math.PI * 2)
    ctx.fill()

    // Ripples
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'
    ctx.lineWidth = 1
    for (let i = 1; i < 3; i++) {
      ctx.beginPath()
      ctx.ellipse(pos.x, pos.y, (w / 2) * (0.3 * i), (d / 2) * (0.3 * i), 0, 0, Math.PI * 2)
      ctx.stroke()
    }
  }

  const drawFence = (ctx, pos, obj) => {
    const len = (pos.length || 50) * zoom * 0.25
    ctx.strokeStyle = obj.color
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(pos.x - len / 2, pos.y)
    ctx.lineTo(pos.x + len / 2, pos.y)
    ctx.stroke()

    // Posts
    for (let i = 0; i <= 4; i++) {
      const x = pos.x - len / 2 + (len / 4) * i
      ctx.fillStyle = obj.color
      ctx.fillRect(x - 1, pos.y - 5, 2, 5)
    }
  }

  const drawGrid = (ctx, centerX, centerY, angle, scale) => {
    ctx.strokeStyle = 'rgba(0,0,0,0.1)'
    ctx.lineWidth = 0.5

    const gridSize = 20
    const gridCount = 10

    for (let i = -gridCount; i <= gridCount; i++) {
      // Horizontal lines
      const start1 = projectToScreen(i * gridSize, 0, -gridCount * gridSize, centerX, centerY, angle, scale)
      const end1 = projectToScreen(i * gridSize, 0, gridCount * gridSize, centerX, centerY, angle, scale)
      ctx.beginPath()
      ctx.moveTo(start1.x, start1.y)
      ctx.lineTo(end1.x, end1.y)
      ctx.stroke()

      // Vertical lines
      const start2 = projectToScreen(-gridCount * gridSize, 0, i * gridSize, centerX, centerY, angle, scale)
      const end2 = projectToScreen(gridCount * gridSize, 0, i * gridSize, centerX, centerY, angle, scale)
      ctx.beginPath()
      ctx.moveTo(start2.x, start2.y)
      ctx.lineTo(end2.x, end2.y)
      ctx.stroke()
    }
  }

  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Find clicked object
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2

    for (const obj of objects) {
      if (!obj.position) continue
      const screenPos = projectToScreen(
        obj.position.x,
        obj.position.y,
        obj.position.z,
        centerX,
        centerY,
        viewAngle,
        zoom
      )

      const distance = Math.sqrt(Math.pow(x - screenPos.x, 2) + Math.pow(y - screenPos.y, 2))
      if (distance < 15) {
        setSelectedObject(obj)
        return
      }
    }

    setSelectedObject(null)
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#f9fafb' }}>
      {/* Canvas */}
      <div style={{ flex: 1, position: 'relative' }}>
        <canvas
          ref={canvasRef}
          width={1200}
          height={800}
          onClick={handleCanvasClick}
          style={{
            width: '100%',
            height: '100%',
            cursor: 'pointer',
            border: '1px solid #e5e7eb'
          }}
        />

        {/* Controls */}
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          background: 'white',
          padding: '16px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '16px' }}>🗺️ Farm View</h3>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>
              Rotation: {viewAngle}°
            </label>
            <input
              type="range"
              min="0"
              max="360"
              value={viewAngle}
              onChange={(e) => setViewAngle(Number(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>
              Zoom: {zoom.toFixed(1)}x
            </label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', fontSize: '12px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={showLabels}
                onChange={(e) => setShowLabels(e.target.checked)}
                style={{ marginRight: '8px' }}
              />
              Show Labels
            </label>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', fontSize: '12px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={animating}
                onChange={(e) => setAnimating(e.target.checked)}
                style={{ marginRight: '8px' }}
              />
              Animate Animals
            </label>
          </div>

          <button
            onClick={loadFarmData}
            style={{
              width: '100%',
              padding: '8px',
              background: '#059669',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            🔄 Refresh
          </button>
        </div>

        {/* Stats */}
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          background: 'white',
          padding: '16px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          minWidth: '200px'
        }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '16px' }}>📊 Farm Stats</h3>
          <div style={{ fontSize: '13px', lineHeight: '1.8' }}>
            <div>🐄 Animals: {stats.totalAnimals}</div>
            <div>💚 Healthy: {stats.healthyAnimals}</div>
            <div>🌾 Fields: {stats.totalFields}</div>
            <div>🌱 Active: {stats.activeFields}</div>
            <div>📏 Size: {stats.farmSize}</div>
          </div>
        </div>
      </div>

      {/* Details Panel */}
      {selectedObject && (
        <div style={{
          width: '300px',
          background: 'white',
          borderLeft: '1px solid #e5e7eb',
          padding: '20px',
          overflowY: 'auto'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '18px' }}>Details</h3>
            <button
              onClick={() => setSelectedObject(null)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer',
                color: '#6b7280'
              }}
            >
              ×
            </button>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <div style={{
              width: '60px',
              height: '60px',
              background: selectedObject.color,
              borderRadius: '8px',
              margin: '0 auto 12px'
            }} />
            <h4 style={{ margin: '0 0 8px 0', textAlign: 'center', fontSize: '16px' }}>
              {selectedObject.name || 'Unnamed'}
            </h4>
            <p style={{ margin: 0, textAlign: 'center', color: '#6b7280', fontSize: '13px', textTransform: 'capitalize' }}>
              {selectedObject.type}
            </p>
          </div>

          {selectedObject.data && (
            <div style={{ fontSize: '13px', lineHeight: '1.8' }}>
              {selectedObject.type === OBJECT_TYPES.ANIMAL && (
                <>
                  <div><strong>Species:</strong> {selectedObject.data.species}</div>
                  <div><strong>Tag:</strong> {selectedObject.data.tag}</div>
                  <div><strong>Breed:</strong> {selectedObject.data.breed}</div>
                  <div><strong>Health:</strong> {selectedObject.data.healthStatus || 'Unknown'}</div>
                  <div><strong>Weight:</strong> {selectedObject.data.weight || 'N/A'}</div>
                </>
              )}
              {selectedObject.type === OBJECT_TYPES.FIELD && (
                <>
                  <div><strong>Crop:</strong> {selectedObject.data.cropName}</div>
                  <div><strong>Stage:</strong> {selectedObject.data.stage}</div>
                  <div><strong>Area:</strong> {selectedObject.data.area || 'N/A'}</div>
                  <div><strong>Planted:</strong> {selectedObject.data.plantingDate ? new Date(selectedObject.data.plantingDate).toLocaleDateString() : 'N/A'}</div>
                </>
              )}
            </div>
          )}

          {selectedObject.position && (
            <div style={{ marginTop: '16px', padding: '12px', background: '#f9fafb', borderRadius: '4px', fontSize: '11px', color: '#6b7280' }}>
              <div><strong>Position:</strong></div>
              <div>X: {selectedObject.position.x.toFixed(1)}m</div>
              <div>Y: {selectedObject.position.y.toFixed(1)}m</div>
              <div>Z: {selectedObject.position.z.toFixed(1)}m</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
