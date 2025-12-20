import React, { useState, useEffect } from 'react'
import { formatCurrency } from '../lib/currency'

const SAMPLE_PONDS = [
  { id: 'AZ-001', name: 'Pond 1', size: 10, location: 'North Field', setupDate: '2025-08-01', status: 'Active', yieldPerWeek: 15, waterTemp: 25, pH: 6.5, nutrients: 'NPK Solution', notes: 'High yield' },
  { id: 'AZ-002', name: 'Pond 2', size: 8, location: 'South Field', setupDate: '2025-09-15', status: 'Active', yieldPerWeek: 12, waterTemp: 24, pH: 6.8, nutrients: 'Cow Dung', notes: '' }
]

const POND_STATUS = ['Active', 'Inactive', 'Maintenance', 'Harvesting', 'Contaminated']
const NUTRIENT_TYPES = ['NPK Solution', 'Cow Dung', 'Chicken Manure', 'Pig Manure', 'Biogas Slurry', 'Mixed Organic']
const HARVEST_PURPOSE = ['Animal Feed', 'Fertilizer', 'Sale', 'Seed Stock', 'Research']

export default function AzollaFarming() {
  const KEY = 'cattalytics:azolla:ponds'
  const MAINTENANCE_KEY = 'cattalytics:azolla:maintenance'
  const HARVEST_KEY = 'cattalytics:azolla:harvest'
  
  const [ponds, setPonds] = useState([])
  const [maintenanceRecords, setMaintenanceRecords] = useState([])
  const [harvestRecords, setHarvestRecords] = useState([])
  const [showAddPond, setShowAddPond] = useState(false)
  const [activeTab, setActiveTab] = useState('ponds')
  
  const [pondForm, setPondForm] = useState({
    name: '', size: '', location: '', setupDate: new Date().toISOString().slice(0, 10),
    status: 'Active', yieldPerWeek: '', waterTemp: '', pH: '',
    nutrients: 'NPK Solution', notes: ''
  })
  
  const [maintenanceForm, setMaintenanceForm] = useState({
    pondId: '', date: new Date().toISOString().slice(0, 10),
    activity: 'Water Change', nutrients: '', nutrientAmount: '',
    waterTemp: '', pH: '', cost: '', notes: ''
  })
  
  const [harvestForm, setHarvestForm] = useState({
    pondId: '', date: new Date().toISOString().slice(0, 10),
    quantity: '', weight: '', moisture: '', quality: 'Good',
    purpose: 'Animal Feed', usedFor: '', salePrice: '', notes: ''
  })

  // Inline edit state
  const [inlineEditId, setInlineEditId] = useState(null)
  const [inlineData, setInlineData] = useState({ name: '', size: '', location: '', status: 'Active' })
  const [toast, setToast] = useState(null)
  const [lastChange, setLastChange] = useState(null)

  useEffect(() => {
    const raw = localStorage.getItem(KEY)
    if (raw) setPonds(JSON.parse(raw))
    else setPonds(SAMPLE_PONDS)
    
    const maintRaw = localStorage.getItem(MAINTENANCE_KEY)
    if (maintRaw) setMaintenanceRecords(JSON.parse(maintRaw))
    
    const harvestRaw = localStorage.getItem(HARVEST_KEY)
    if (harvestRaw) setHarvestRecords(JSON.parse(harvestRaw))
  }, [])

  useEffect(() => localStorage.setItem(KEY, JSON.stringify(ponds)), [ponds])
  useEffect(() => localStorage.setItem(MAINTENANCE_KEY, JSON.stringify(maintenanceRecords)), [maintenanceRecords])
  useEffect(() => localStorage.setItem(HARVEST_KEY, JSON.stringify(harvestRecords)), [harvestRecords])

  function addPond() {
    if (!pondForm.name || !pondForm.size) {
      alert('Please provide pond name and size')
      return
    }
    const id = 'AZ-' + Date.now()
    setPonds([...ponds, { ...pondForm, id }])
    resetPondForm()
    setShowAddPond(false)
  }

  function deletePond(id) {
    if (!confirm('Delete this pond?')) return
    setPonds(ponds.filter(p => p.id !== id))
  }

  // Inline Quick Edit Functions
  function startInlineEdit(pond) {
    setInlineEditId(pond.id)
    setInlineData({ 
      name: pond.name || '', 
      size: String(pond.size || ''), 
      location: pond.location || '', 
      status: pond.status || 'Active' 
    })
  }

  function saveInlineEdit() {
    if (!inlineData.name.trim()) {
      setToast({ type: 'error', message: 'Pond name is required' })
      setTimeout(() => setToast(null), 3000)
      return
    }
    if (!inlineData.size || isNaN(inlineData.size) || Number(inlineData.size) <= 0) {
      setToast({ type: 'error', message: 'Valid size is required' })
      setTimeout(() => setToast(null), 3000)
      return
    }
    const updated = ponds.map(pond => {
      if (pond.id === inlineEditId) {
        setLastChange({ type: 'edit', item: { ...pond } })
        return { 
          ...pond, 
          name: inlineData.name.trim(), 
          size: parseFloat(inlineData.size),
          location: inlineData.location.trim(),
          status: inlineData.status
        }
      }
      return pond
    })
    setPonds(updated)
    setToast({ type: 'success', message: 'Pond updated', showUndo: true })
    setTimeout(() => setToast(null), 5000)
    setInlineEditId(null)
  }

  function cancelInlineEdit() {
    setInlineEditId(null)
    setInlineData({ name: '', size: '', location: '', status: 'Active' })
  }

  function undoLastChange() {
    if (lastChange) {
      setPonds(ponds.map(p => p.id === lastChange.item.id ? lastChange.item : p))
      setToast({ type: 'success', message: 'Change reverted' })
      setTimeout(() => setToast(null), 3000)
      setLastChange(null)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') { e.preventDefault(); saveInlineEdit() }
    else if (e.key === 'Escape') cancelInlineEdit()
  }

  function addMaintenance() {
    if (!maintenanceForm.pondId || !maintenanceForm.activity) {
      alert('Please select pond and activity')
      return
    }
    const id = 'MAINT-' + Date.now()
    setMaintenanceRecords([...maintenanceRecords, { ...maintenanceForm, id, timestamp: new Date().toISOString() }])
    setMaintenanceForm({ ...maintenanceForm, nutrients: '', nutrientAmount: '', cost: '', notes: '' })
  }

  function addHarvest() {
    if (!harvestForm.pondId || !harvestForm.weight) {
      alert('Please select pond and enter weight')
      return
    }
    const id = 'HARVEST-' + Date.now()
    setHarvestRecords([...harvestRecords, { ...harvestForm, id, timestamp: new Date().toISOString() }])
    setHarvestForm({ ...harvestForm, quantity: '', weight: '', salePrice: '', notes: '' })
  }

  function resetPondForm() {
    setPondForm({
      name: '', size: '', location: '', setupDate: new Date().toISOString().slice(0, 10),
      status: 'Active', yieldPerWeek: '', waterTemp: '', pH: '',
      nutrients: 'NPK Solution', notes: ''
    })
  }

  const activePonds = ponds.filter(p => p.status === 'Active')
  const totalSize = ponds.reduce((sum, p) => sum + (parseFloat(p.size) || 0), 0)
  const totalYield = ponds.reduce((sum, p) => sum + (parseFloat(p.yieldPerWeek) || 0), 0)
  const totalHarvest = harvestRecords.reduce((sum, h) => sum + (parseFloat(h.weight) || 0), 0)
  const totalRevenue = harvestRecords.reduce((sum, h) => sum + (parseFloat(h.salePrice) || 0), 0)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3>🌿 Azolla Farming System</h3>
        <button onClick={() => setShowAddPond(!showAddPond)}>
          {showAddPond ? '✕ Cancel' : '+ Add Pond'}
        </button>
      </div>

      {/* Summary Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 20 }}>
        <div className="card" style={{ padding: 16, background: '#f0fdf4' }}>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Active Ponds</div>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#059669' }}>{activePonds.length}</div>
        </div>
        <div className="card" style={{ padding: 16, background: '#eff6ff' }}>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Total Area (m²)</div>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#2563eb' }}>{totalSize.toFixed(1)}</div>
        </div>
        <div className="card" style={{ padding: 16, background: '#fef3c7' }}>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Weekly Yield (kg)</div>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#f59e0b' }}>{totalYield.toFixed(1)}</div>
        </div>
        <div className="card" style={{ padding: 16, background: '#d1fae5' }}>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Total Harvest (kg)</div>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#059669' }}>{totalHarvest.toFixed(1)}</div>
        </div>
      </div>

      {/* Info Card */}
      <div className="card" style={{ padding: 16, marginBottom: 20, background: '#e0f2fe', borderLeft: '4px solid #0ea5e9' }}>
        <h4 style={{ margin: '0 0 8px 0', color: '#075985' }}>💡 Azolla Farming Tips</h4>
        <ul style={{ margin: 0, paddingLeft: 20, color: '#666', fontSize: 14 }}>
          <li>Optimal water temperature: 20-28°C</li>
          <li>pH range: 5.5-7.0 (ideal: 6.5)</li>
          <li>Doubles biomass every 3-5 days under ideal conditions</li>
          <li>Rich in protein (25-35%), excellent for livestock feed</li>
          <li>Harvest when coverage reaches 80-90% of pond surface</li>
        </ul>
      </div>

      {/* Add Pond Form */}
      {showAddPond && (
        <div className="card" style={{ padding: 20, marginBottom: 20 }}>
          <h4 style={{ marginTop: 0 }}>Add New Azolla Pond</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <div>
              <label>Pond Name *</label>
              <input id="pond-name" name="pondName" value={pondForm.name} onChange={e => setPondForm({ ...pondForm, name: e.target.value })} placeholder="Pond 1" />
            </div>
            <div>
              <label>Size (m²) *</label>
              <input type="number" step="0.1" id="pond-size" name="size" value={pondForm.size} onChange={e => setPondForm({ ...pondForm, size: e.target.value })} placeholder="10" />
            </div>
            <div>
              <label>Location</label>
              <input id="pond-location" name="location" value={pondForm.location} onChange={e => setPondForm({ ...pondForm, location: e.target.value })} placeholder="North Field" />
            </div>
            <div>
              <label>Setup Date</label>
              <input type="date" id="pond-setup-date" name="setupDate" value={pondForm.setupDate} onChange={e => setPondForm({ ...pondForm, setupDate: e.target.value })} />
            </div>
            <div>
              <label>Status</label>
              <select value={pondForm.status} onChange={e => setPondForm({ ...pondForm, status: e.target.value })}>
                {POND_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label>Expected Yield/Week (kg)</label>
              <input type="number" step="0.1" id="pond-yield-per-week" name="yieldPerWeek" value={pondForm.yieldPerWeek} onChange={e => setPondForm({ ...pondForm, yieldPerWeek: e.target.value })} />
            </div>
            <div>
              <label>Water Temperature (°C)</label>
              <input type="number" step="0.1" id="pond-water-temp" name="waterTemp" value={pondForm.waterTemp} onChange={e => setPondForm({ ...pondForm, waterTemp: e.target.value })} placeholder="25" />
            </div>
            <div>
              <label>pH Level</label>
              <input type="number" step="0.1" id="pond-ph" name="pH" value={pondForm.pH} onChange={e => setPondForm({ ...pondForm, pH: e.target.value })} placeholder="6.5" />
            </div>
            <div>
              <label>Nutrient Source</label>
              <select value={pondForm.nutrients} onChange={e => setPondForm({ ...pondForm, nutrients: e.target.value })}>
                {NUTRIENT_TYPES.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label>Notes</label>
              <textarea value={pondForm.notes} onChange={e => setPondForm({ ...pondForm, notes: e.target.value })} rows={2} />
            </div>
          </div>
          <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
            <button onClick={addPond}>Add Pond</button>
            <button onClick={() => setShowAddPond(false)} style={{ background: '#6b7280' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ marginBottom: 16, borderBottom: '2px solid #e5e7eb' }}>
        <button 
          onClick={() => setActiveTab('ponds')} 
          style={{ 
            padding: '8px 16px', 
            border: 'none', 
            background: activeTab === 'ponds' ? '#059669' : 'transparent',
            color: activeTab === 'ponds' ? '#fff' : '#666',
            cursor: 'pointer'
          }}
        >Ponds</button>
        <button 
          onClick={() => setActiveTab('maintenance')} 
          style={{ 
            padding: '8px 16px', 
            border: 'none', 
            background: activeTab === 'maintenance' ? '#059669' : 'transparent',
            color: activeTab === 'maintenance' ? '#fff' : '#666',
            cursor: 'pointer'
          }}
        >Maintenance</button>
        <button 
          onClick={() => setActiveTab('harvest')} 
          style={{ 
            padding: '8px 16px', 
            border: 'none', 
            background: activeTab === 'harvest' ? '#059669' : 'transparent',
            color: activeTab === 'harvest' ? '#fff' : '#666',
            cursor: 'pointer'
          }}
        >Harvest Records</button>
      </div>

      {/* Ponds Tab */}
      {activeTab === 'ponds' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {ponds.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🌿</div>
              <h4>No azolla ponds yet</h4>
              <p style={{ color: '#666' }}>Add your first pond to start tracking</p>
            </div>
          ) : (
            <div style={{ maxHeight: 600, overflowY: 'auto' }}>
              {ponds.map(pond => {
                const daysActive = Math.floor((new Date() - new Date(pond.setupDate)) / (1000 * 60 * 60 * 24))
                
                return (
                  <div key={pond.id} style={{ padding: 16, borderBottom: '1px solid #eee' }}>
                    {inlineEditId === pond.id ? (
                      <div onKeyDown={handleKeyDown} style={{display:'flex',flexDirection:'column',gap:12}}>
                        <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
                          <input value={inlineData.name} onChange={e=>setInlineData({...inlineData,name:e.target.value})} placeholder="Pond Name" style={{width:150}} autoFocus />
                          <input type="number" value={inlineData.size} onChange={e=>setInlineData({...inlineData,size:e.target.value})} placeholder="Size (m²)" style={{width:100}} />
                          <input value={inlineData.location} onChange={e=>setInlineData({...inlineData,location:e.target.value})} placeholder="Location" style={{width:120}} />
                          <select value={inlineData.status} onChange={e=>setInlineData({...inlineData,status:e.target.value})} style={{width:120}}>
                            {POND_STATUS.map(s=><option key={s}>{s}</option>)}
                          </select>
                          <button onClick={saveInlineEdit} style={{background:'#10b981',color:'#fff',padding:'6px 12px',border:'none',borderRadius:4}}>✓ Save</button>
                          <button onClick={cancelInlineEdit} style={{background:'#ef4444',color:'#fff',padding:'6px 12px',border:'none',borderRadius:4}}>✕ Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 600, fontSize: 16 }}>{pond.name}</span>
                            <span className="badge" style={{ 
                              background: pond.status === 'Active' ? '#d1fae5' : pond.status === 'Maintenance' ? '#fef3c7' : '#fee2e2' 
                            }}>{pond.status}</span>
                          </div>
                          <div style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>
                            <strong>Size:</strong> {pond.size}m² • <strong>Location:</strong> {pond.location} • <strong>Setup:</strong> {new Date(pond.setupDate).toLocaleDateString()} ({daysActive} days)
                          </div>
                          <div style={{ fontSize: 13, color: '#666', marginBottom: 4 }}>
                            <strong>Yield:</strong> {pond.yieldPerWeek}kg/week • <strong>Temp:</strong> {pond.waterTemp}°C • <strong>pH:</strong> {pond.pH}
                          </div>
                          <div style={{ fontSize: 13, color: '#666', marginBottom: 4 }}>
                            <strong>Nutrients:</strong> {pond.nutrients}
                          </div>
                          {pond.notes && (
                            <div style={{ fontSize: 13, color: '#888', marginTop: 8, fontStyle: 'italic' }}>{pond.notes}</div>
                          )}
                        </div>
                        <div style={{display:'flex',gap:4,flexDirection:'column'}}>
                          <button onClick={()=>startInlineEdit(pond)} style={{fontSize:12,padding:'4px 8px',background:'#3b82f6',color:'#fff'}}>⚡ Quick</button>
                          <button onClick={() => deletePond(pond.id)} style={{ fontSize: 12, padding: '4px 8px', background: '#dc2626',color:'#fff' }}>Delete</button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Maintenance Tab */}
      {activeTab === 'maintenance' && (
        <div>
          <div className="card" style={{ padding: 16, marginBottom: 16 }}>
            <h4 style={{ marginTop: 0 }}>Add Maintenance Record</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              <div>
                <label>Pond *</label>
                <select value={maintenanceForm.pondId} onChange={e => setMaintenanceForm({ ...maintenanceForm, pondId: e.target.value })}>
                  <option value="">-- Select Pond --</option>
                  {ponds.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label>Date</label>
                <input type="date" value={maintenanceForm.date} onChange={e => setMaintenanceForm({ ...maintenanceForm, date: e.target.value })} />
              </div>
              <div>
                <label>Activity *</label>
                <select value={maintenanceForm.activity} onChange={e => setMaintenanceForm({ ...maintenanceForm, activity: e.target.value })}>
                  <option value="Water Change">Water Change</option>
                  <option value="Nutrient Addition">Nutrient Addition</option>
                  <option value="pH Adjustment">pH Adjustment</option>
                  <option value="Cleaning">Cleaning</option>
                  <option value="Thinning">Thinning</option>
                  <option value="Pest Control">Pest Control</option>
                </select>
              </div>
              <div>
                <label>Nutrient Type</label>
                <select value={maintenanceForm.nutrients} onChange={e => setMaintenanceForm({ ...maintenanceForm, nutrients: e.target.value })}>
                  <option value="">-- Select --</option>
                  {NUTRIENT_TYPES.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div>
                <label>Nutrient Amount (kg)</label>
                <input type="number" step="0.1" value={maintenanceForm.nutrientAmount} onChange={e => setMaintenanceForm({ ...maintenanceForm, nutrientAmount: e.target.value })} />
              </div>
              <div>
                <label>Water Temp (°C)</label>
                <input type="number" step="0.1" value={maintenanceForm.waterTemp} onChange={e => setMaintenanceForm({ ...maintenanceForm, waterTemp: e.target.value })} />
              </div>
              <div>
                <label>pH Level</label>
                <input type="number" step="0.1" value={maintenanceForm.pH} onChange={e => setMaintenanceForm({ ...maintenanceForm, pH: e.target.value })} />
              </div>
              <div>
                <label>Cost</label>
                <input type="number" step="0.01" value={maintenanceForm.cost} onChange={e => setMaintenanceForm({ ...maintenanceForm, cost: e.target.value })} />
              </div>
              <div>
                <label>Notes</label>
                <input value={maintenanceForm.notes} onChange={e => setMaintenanceForm({ ...maintenanceForm, notes: e.target.value })} />
              </div>
            </div>
            <button onClick={addMaintenance} style={{ marginTop: 12 }}>Add Maintenance Record</button>
          </div>

          <div className="card" style={{ padding: 0 }}>
            {maintenanceRecords.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center' }}>
                <h4>No maintenance records yet</h4>
              </div>
            ) : (
              <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                {maintenanceRecords.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).map(record => {
                  const pond = ponds.find(p => p.id === record.pondId)
                  return (
                    <div key={record.id} style={{ padding: 12, borderBottom: '1px solid #eee' }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ fontWeight: 600 }}>{pond?.name || record.pondId}</span>
                        <span className="badge">{record.activity}</span>
                        {record.cost && <span className="badge" style={{ background: '#fee2e2' }}>{formatCurrency(parseFloat(record.cost))}</span>}
                      </div>
                      <div style={{ fontSize: 13, color: '#666' }}>
                        {new Date(record.date).toLocaleDateString()}
                        {record.nutrients && ` • ${record.nutrients}`}
                        {record.nutrientAmount && ` (${record.nutrientAmount}kg)`}
                        {record.waterTemp && ` • Temp: ${record.waterTemp}°C`}
                        {record.pH && ` • pH: ${record.pH}`}
                      </div>
                      {record.notes && <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>{record.notes}</div>}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Harvest Tab */}
      {activeTab === 'harvest' && (
        <div>
          <div className="card" style={{ padding: 16, marginBottom: 16 }}>
            <h4 style={{ marginTop: 0 }}>Add Harvest Record</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              <div>
                <label>Pond *</label>
                <select value={harvestForm.pondId} onChange={e => setHarvestForm({ ...harvestForm, pondId: e.target.value })}>
                  <option value="">-- Select Pond --</option>
                  {ponds.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label>Date</label>
                <input type="date" value={harvestForm.date} onChange={e => setHarvestForm({ ...harvestForm, date: e.target.value })} />
              </div>
              <div>
                <label>Fresh Weight (kg) *</label>
                <input type="number" step="0.1" value={harvestForm.weight} onChange={e => setHarvestForm({ ...harvestForm, weight: e.target.value })} />
              </div>
              <div>
                <label>Moisture Content (%)</label>
                <input type="number" step="0.1" value={harvestForm.moisture} onChange={e => setHarvestForm({ ...harvestForm, moisture: e.target.value })} placeholder="90-95" />
              </div>
              <div>
                <label>Quality</label>
                <select value={harvestForm.quality} onChange={e => setHarvestForm({ ...harvestForm, quality: e.target.value })}>
                  <option value="Excellent">Excellent</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                  <option value="Poor">Poor</option>
                </select>
              </div>
              <div>
                <label>Purpose</label>
                <select value={harvestForm.purpose} onChange={e => setHarvestForm({ ...harvestForm, purpose: e.target.value })}>
                  {HARVEST_PURPOSE.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label>Used For</label>
                <input value={harvestForm.usedFor} onChange={e => setHarvestForm({ ...harvestForm, usedFor: e.target.value })} placeholder="e.g., Dairy cows, Pigs" />
              </div>
              <div>
                <label>Sale Price</label>
                <input type="number" step="0.01" value={harvestForm.salePrice} onChange={e => setHarvestForm({ ...harvestForm, salePrice: e.target.value })} />
              </div>
              <div>
                <label>Notes</label>
                <input value={harvestForm.notes} onChange={e => setHarvestForm({ ...harvestForm, notes: e.target.value })} />
              </div>
            </div>
            <button onClick={addHarvest} style={{ marginTop: 12 }}>Add Harvest Record</button>
          </div>

          <div className="card" style={{ padding: 0 }}>
            {harvestRecords.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center' }}>
                <h4>No harvest records yet</h4>
              </div>
            ) : (
              <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                {harvestRecords.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).map(record => {
                  const pond = ponds.find(p => p.id === record.pondId)
                  return (
                    <div key={record.id} style={{ padding: 12, borderBottom: '1px solid #eee' }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ fontWeight: 600 }}>{pond?.name || record.pondId}</span>
                        <span className="badge" style={{ background: '#fef3c7' }}>{record.quality}</span>
                        <span className="badge">{record.purpose}</span>
                        {record.salePrice && <span className="badge" style={{ background: '#d1fae5' }}>{formatCurrency(parseFloat(record.salePrice))}</span>}
                      </div>
                      <div style={{ fontSize: 13, color: '#666' }}>
                        {new Date(record.date).toLocaleDateString()} • Weight: {record.weight}kg
                        {record.moisture && ` • Moisture: ${record.moisture}%`}
                        {record.usedFor && ` • For: ${record.usedFor}`}
                      </div>
                      {record.notes && <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>{record.notes}</div>}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
      {toast && (
        <div style={{position:'fixed',bottom:20,right:20,padding:'12px 20px',background:toast.type==='error'?'#ef4444':'#10b981',color:'#fff',borderRadius:8,boxShadow:'0 4px 12px rgba(0,0,0,0.15)',zIndex:10000,display:'flex',gap:12}}>
          <span>{toast.message}</span>
          {toast.showUndo && <button onClick={undoLastChange} style={{background:'rgba(255,255,255,0.2)',border:'1px solid rgba(255,255,255,0.3)',color:'#fff',padding:'4px 12px',borderRadius:4,cursor:'pointer'}}>↶ Undo</button>}
        </div>
      )}
    </div>
  )
}
