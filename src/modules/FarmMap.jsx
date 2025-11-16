import React, { useEffect, useState, useRef } from 'react'

const SAMPLE_ZONES = [
  { id: 'Z-001', name: 'North Pasture', type: 'Pasture', area: 12.5, color: '#86efac', x: 50, y: 50, width: 200, height: 150, notes: 'Prime grazing area' },
  { id: 'Z-002', name: 'South Field', type: 'Crop Field', area: 8.3, color: '#fde047', x: 300, y: 100, width: 180, height: 120, notes: 'Corn field' },
  { id: 'Z-003', name: 'East Barn', type: 'Building', area: 0.5, color: '#f87171', x: 550, y: 150, width: 80, height: 60, notes: 'Main livestock barn' },
  { id: 'Z-004', name: 'Equipment Shed', type: 'Building', area: 0.3, color: '#94a3b8', x: 100, y: 250, width: 70, height: 50, notes: 'Tool storage' }
]

const SAMPLE_ASSETS = [
  { id: 'A-001', name: 'Water Tank #1', type: 'Water', zoneId: 'Z-001', x: 120, y: 120, icon: '💧' },
  { id: 'A-002', name: 'Feed Station', type: 'Equipment', zoneId: 'Z-003', x: 580, y: 170, icon: '🌾' },
  { id: 'A-003', name: 'Tractor', type: 'Vehicle', zoneId: 'Z-004', x: 130, y: 270, icon: '🚜' }
]

export default function FarmMap(){
  const KEY_ZONES = 'cattalytics:farmmap:zones'
  const KEY_ASSETS = 'cattalytics:farmmap:assets'
  const [zones, setZones] = useState([])
  const [assets, setAssets] = useState([])
  const [selectedZone, setSelectedZone] = useState(null)
  const [selectedAsset, setSelectedAsset] = useState(null)
  const [tool, setTool] = useState('select') // select, zone, asset, measure
  const [drawing, setDrawing] = useState(false)
  const [drawStart, setDrawStart] = useState(null)
  const [measurements, setMeasurements] = useState([])
  const [mapCenter, setMapCenter] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const canvasRef = useRef(null)

  useEffect(()=>{
    const rawZones = localStorage.getItem(KEY_ZONES)
    const rawAssets = localStorage.getItem(KEY_ASSETS)
    if(rawZones) setZones(JSON.parse(rawZones))
    else setZones(SAMPLE_ZONES)
    if(rawAssets) setAssets(JSON.parse(rawAssets))
    else setAssets(SAMPLE_ASSETS)
  }, [])

  useEffect(()=> localStorage.setItem(KEY_ZONES, JSON.stringify(zones)), [zones])
  useEffect(()=> localStorage.setItem(KEY_ASSETS, JSON.stringify(assets)), [assets])

  function addZone(){
    const name = prompt('Zone name:')
    if(!name) return
    const type = prompt('Type (Pasture/Crop Field/Building/Storage):', 'Pasture')
    const colors = { Pasture: '#86efac', 'Crop Field': '#fde047', Building: '#f87171', Storage: '#94a3b8' }
    setZones([...zones, {
      id: 'Z-' + Date.now(),
      name,
      type: type || 'Pasture',
      area: 0,
      color: colors[type] || '#86efac',
      x: 50 + zones.length * 30,
      y: 50 + zones.length * 20,
      width: 150,
      height: 100,
      notes: ''
    }])
  }

  function addAsset(){
    const name = prompt('Asset name:')
    if(!name) return
    const type = prompt('Type (Water/Equipment/Vehicle/Gate):', 'Equipment')
    const icons = { Water: '💧', Equipment: '🔧', Vehicle: '🚜', Gate: '🚪' }
    setAssets([...assets, {
      id: 'A-' + Date.now(),
      name,
      type: type || 'Equipment',
      zoneId: zones[0]?.id || null,
      x: 100,
      y: 100,
      icon: icons[type] || '📍'
    }])
  }

  function deleteZone(id){
    if(!confirm('Delete this zone?')) return
    setZones(zones.filter(z => z.id !== id))
    setAssets(assets.filter(a => a.zoneId !== id))
    setSelectedZone(null)
  }

  function deleteAsset(id){
    if(!confirm('Delete this asset?')) return
    setAssets(assets.filter(a => a.id !== id))
    setSelectedAsset(null)
  }

  function handleCanvasClick(e){
    const rect = canvasRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / zoom
    const y = (e.clientY - rect.top) / zoom

    if(tool === 'select'){
      // Check if clicked on zone
      const clickedZone = zones.find(z => 
        x >= z.x && x <= z.x + z.width &&
        y >= z.y && y <= z.y + z.height
      )
      if(clickedZone){
        setSelectedZone(clickedZone)
        setSelectedAsset(null)
        return
      }
      
      // Check if clicked on asset
      const clickedAsset = assets.find(a =>
        Math.abs(x - a.x) < 15 && Math.abs(y - a.y) < 15
      )
      if(clickedAsset){
        setSelectedAsset(clickedAsset)
        setSelectedZone(null)
        return
      }
      
      setSelectedZone(null)
      setSelectedAsset(null)
    } else if(tool === 'measure'){
      if(!drawing){
        setDrawStart({ x, y })
        setDrawing(true)
      } else {
        const distance = Math.sqrt(Math.pow(x - drawStart.x, 2) + Math.pow(y - drawStart.y, 2))
        setMeasurements([...measurements, { from: drawStart, to: { x, y }, distance: (distance * 0.1).toFixed(1) }])
        setDrawing(false)
        setDrawStart(null)
      }
    }
  }

  const totalArea = zones.reduce((sum, z) => sum + (z.area || 0), 0)
  const zoneTypes = [...new Set(zones.map(z => z.type))]

  return (
    <section>
      <div className="health-header">
        <div>
          <h2 style={{ margin: 0 }}>🗺️ Farm Map</h2>
          <div style={{ fontSize: '14px', color: '#64748b' }}>Interactive farm layout and asset tracking</div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className={tool === 'select' ? 'tab-btn-active' : 'tab-btn'} onClick={() => setTool('select')}>🖱️ Select</button>
          <button className='tab-btn' onClick={addZone}>➕ Add Zone</button>
          <button className='tab-btn' onClick={addAsset}>📍 Add Asset</button>
          <button className={tool === 'measure' ? 'tab-btn-active' : 'tab-btn'} onClick={() => setTool('measure')}>📏 Measure</button>
          <button className='tab-btn' onClick={() => setZoom(Math.min(2, zoom + 0.1))}>🔍 Zoom In</button>
          <button className='tab-btn' onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}>🔍 Zoom Out</button>
        </div>
      </div>

      {/* Farm Statistics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--green)' }}>{totalArea.toFixed(1)}</div>
          <div style={{ fontSize: '14px', color: '#64748b' }}>Total Acres</div>
        </div>
        <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--green)' }}>{zones.length}</div>
          <div style={{ fontSize: '14px', color: '#64748b' }}>Zones</div>
        </div>
        <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--green)' }}>{assets.length}</div>
          <div style={{ fontSize: '14px', color: '#64748b' }}>Assets</div>
        </div>
        <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--green)' }}>{zoneTypes.length}</div>
          <div style={{ fontSize: '14px', color: '#64748b' }}>Zone Types</div>
        </div>
      </div>

      {/* Map Canvas */}
      <div style={{ display: 'flex', gap: '20px' }}>
        <div style={{ flex: 1 }}>
          <div className="card" style={{ padding: '12px' }}>
            <canvas
              ref={canvasRef}
              width={700}
              height={500}
              onClick={handleCanvasClick}
              style={{
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                cursor: tool === 'select' ? 'pointer' : 'crosshair',
                transform: `scale(${zoom})`,
                transformOrigin: 'top left',
                background: '#f8fafc'
              }}
            >
              {/* Canvas will be drawn using useEffect */}
            </canvas>
          </div>
          
          {/* Legend */}
          <div className="card" style={{ padding: '16px', marginTop: '16px' }}>
            <h4 style={{ margin: '0 0 12px 0' }}>🎨 Legend</h4>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              {zoneTypes.map(type => {
                const zone = zones.find(z => z.type === type)
                return (
                  <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '20px', height: '20px', background: zone?.color, borderRadius: '4px', border: '1px solid #ccc' }} />
                    <span>{type}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Details Panel */}
        <div style={{ width: '300px' }}>
          {selectedZone && (
            <div className="card" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ margin: 0 }}>📍 Zone Details</h4>
                <button onClick={() => deleteZone(selectedZone.id)} style={{ background: '#ef4444', color: '#fff', padding: '4px 8px', fontSize: '12px' }}>Delete</button>
              </div>
              <div style={{ fontSize: '14px' }}>
                <div style={{ marginBottom: '8px' }}>
                  <strong>Name:</strong>
                  <input
                    value={selectedZone.name}
                    onChange={e => setZones(zones.map(z => z.id === selectedZone.id ? {...z, name: e.target.value} : z))}
                    style={{ width: '100%', marginTop: '4px' }}
                  />
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <strong>Type:</strong>
                  <select
                    value={selectedZone.type}
                    onChange={e => setZones(zones.map(z => z.id === selectedZone.id ? {...z, type: e.target.value} : z))}
                    style={{ width: '100%', marginTop: '4px' }}
                  >
                    <option>Pasture</option>
                    <option>Crop Field</option>
                    <option>Building</option>
                    <option>Storage</option>
                    <option>Water</option>
                    <option>Road</option>
                  </select>
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <strong>Area (acres):</strong>
                  <input
                    type="number"
                    step="0.1"
                    value={selectedZone.area || 0}
                    onChange={e => setZones(zones.map(z => z.id === selectedZone.id ? {...z, area: parseFloat(e.target.value) || 0} : z))}
                    style={{ width: '100%', marginTop: '4px' }}
                  />
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <strong>Notes:</strong>
                  <textarea
                    value={selectedZone.notes || ''}
                    onChange={e => setZones(zones.map(z => z.id === selectedZone.id ? {...z, notes: e.target.value} : z))}
                    style={{ width: '100%', marginTop: '4px', minHeight: '60px' }}
                  />
                </div>
                <div>
                  <strong>Position:</strong> X: {selectedZone.x.toFixed(0)}, Y: {selectedZone.y.toFixed(0)}
                </div>
                <div>
                  <strong>Size:</strong> {selectedZone.width} × {selectedZone.height}
                </div>
              </div>
            </div>
          )}

          {selectedAsset && (
            <div className="card" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ margin: 0 }}>📍 Asset Details</h4>
                <button onClick={() => deleteAsset(selectedAsset.id)} style={{ background: '#ef4444', color: '#fff', padding: '4px 8px', fontSize: '12px' }}>Delete</button>
              </div>
              <div style={{ fontSize: '14px' }}>
                <div style={{ marginBottom: '8px' }}>
                  <strong>Name:</strong>
                  <input
                    value={selectedAsset.name}
                    onChange={e => setAssets(assets.map(a => a.id === selectedAsset.id ? {...a, name: e.target.value} : a))}
                    style={{ width: '100%', marginTop: '4px' }}
                  />
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <strong>Type:</strong>
                  <select
                    value={selectedAsset.type}
                    onChange={e => setAssets(assets.map(a => a.id === selectedAsset.id ? {...a, type: e.target.value} : a))}
                    style={{ width: '100%', marginTop: '4px' }}
                  >
                    <option>Water</option>
                    <option>Equipment</option>
                    <option>Vehicle</option>
                    <option>Gate</option>
                    <option>Fence</option>
                    <option>Feed Station</option>
                  </select>
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <strong>Zone:</strong>
                  <select
                    value={selectedAsset.zoneId || ''}
                    onChange={e => setAssets(assets.map(a => a.id === selectedAsset.id ? {...a, zoneId: e.target.value} : a))}
                    style={{ width: '100%', marginTop: '4px' }}
                  >
                    <option value="">No Zone</option>
                    {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                  </select>
                </div>
                <div>
                  <strong>Position:</strong> X: {selectedAsset.x.toFixed(0)}, Y: {selectedAsset.y.toFixed(0)}
                </div>
              </div>
            </div>
          )}

          {!selectedZone && !selectedAsset && (
            <div className="card" style={{ padding: '16px', textAlign: 'center', color: '#94a3b8' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>🗺️</div>
              <p>Click on a zone or asset to view details</p>
              <p style={{ fontSize: '12px' }}>Use the tools above to add zones, assets, or take measurements</p>
            </div>
          )}

          {measurements.length > 0 && (
            <div className="card" style={{ padding: '16px', marginTop: '16px' }}>
              <h4 style={{ margin: '0 0 12px 0' }}>📏 Measurements</h4>
              {measurements.map((m, i) => (
                <div key={i} style={{ fontSize: '14px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Line {i + 1}</span>
                  <span style={{ fontWeight: 'bold' }}>{m.distance} ft</span>
                </div>
              ))}
              <button onClick={() => setMeasurements([])} style={{ marginTop: '8px', fontSize: '12px' }}>Clear All</button>
            </div>
          )}
        </div>
      </div>

      {/* Draw on canvas */}
      {useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        
        // Draw grid
        ctx.strokeStyle = '#e2e8f0'
        ctx.lineWidth = 1
        for (let i = 0; i < canvas.width; i += 50) {
          ctx.beginPath()
          ctx.moveTo(i, 0)
          ctx.lineTo(i, canvas.height)
          ctx.stroke()
        }
        for (let i = 0; i < canvas.height; i += 50) {
          ctx.beginPath()
          ctx.moveTo(0, i)
          ctx.lineTo(canvas.width, i)
          ctx.stroke()
        }
        
        // Draw zones
        zones.forEach(zone => {
          ctx.fillStyle = zone.color + '80'
          ctx.strokeStyle = zone.color
          ctx.lineWidth = 2
          ctx.fillRect(zone.x, zone.y, zone.width, zone.height)
          ctx.strokeRect(zone.x, zone.y, zone.width, zone.height)
          
          // Draw zone label
          ctx.fillStyle = '#000'
          ctx.font = '12px Arial'
          ctx.fillText(zone.name, zone.x + 5, zone.y + 15)
          
          // Highlight selected zone
          if (selectedZone?.id === zone.id) {
            ctx.strokeStyle = '#3b82f6'
            ctx.lineWidth = 3
            ctx.strokeRect(zone.x - 2, zone.y - 2, zone.width + 4, zone.height + 4)
          }
        })
        
        // Draw assets
        assets.forEach(asset => {
          ctx.font = '24px Arial'
          ctx.fillText(asset.icon, asset.x - 12, asset.y + 8)
          
          // Highlight selected asset
          if (selectedAsset?.id === asset.id) {
            ctx.strokeStyle = '#3b82f6'
            ctx.lineWidth = 2
            ctx.beginPath()
            ctx.arc(asset.x, asset.y, 20, 0, 2 * Math.PI)
            ctx.stroke()
          }
        })
        
        // Draw measurements
        ctx.strokeStyle = '#ef4444'
        ctx.lineWidth = 2
        ctx.setLineDash([5, 5])
        measurements.forEach(m => {
          ctx.beginPath()
          ctx.moveTo(m.from.x, m.from.y)
          ctx.lineTo(m.to.x, m.to.y)
          ctx.stroke()
          
          // Draw distance label
          const midX = (m.from.x + m.to.x) / 2
          const midY = (m.from.y + m.to.y) / 2
          ctx.fillStyle = '#ef4444'
          ctx.font = '12px Arial'
          ctx.fillText(m.distance + ' ft', midX, midY)
        })
        ctx.setLineDash([])
        
        // Draw current measurement line
        if (drawing && drawStart) {
          ctx.strokeStyle = '#fbbf24'
          ctx.lineWidth = 2
          ctx.setLineDash([5, 5])
          ctx.beginPath()
          ctx.moveTo(drawStart.x, drawStart.y)
          // This would need mouse position tracking to show live line
          ctx.stroke()
          ctx.setLineDash([])
        }
      }, [zones, assets, selectedZone, selectedAsset, measurements, drawing, drawStart])}
    </section>
  )
}
