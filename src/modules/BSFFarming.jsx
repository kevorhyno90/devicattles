import React, { useState, useEffect } from 'react'
import { formatCurrency } from '../lib/currency'

const SAMPLE_COLONIES = [
  { id: 'BSF-001', name: 'Colony A', location: 'Barn 1', establishedDate: '2025-09-01', status: 'Active', population: 5000, substrate: 'Food Waste', substrateAmount: 50, temperature: 28, humidity: 70, notes: 'Good production' },
  { id: 'BSF-002', name: 'Colony B', location: 'Barn 2', establishedDate: '2025-10-15', status: 'Growing', population: 2000, substrate: 'Mixed Organic', substrateAmount: 30, temperature: 27, humidity: 65, notes: '' }
]

const SUBSTRATE_TYPES = ['Food Waste', 'Animal Manure', 'Vegetable Waste', 'Mixed Organic', 'Brewery Waste', 'Fish Waste']
const COLONY_STATUS = ['Active', 'Growing', 'Inactive', 'Harvesting', 'Maintenance']
const HARVEST_TYPES = ['Larvae', 'Prepupae', 'Adult Flies', 'Frass (Compost)']

export default function BSFFarming() {
  const KEY = 'cattalytics:bsf:colonies'
  const FEEDING_KEY = 'cattalytics:bsf:feeding'
  const HARVEST_KEY = 'cattalytics:bsf:harvest'
  
  const [colonies, setColonies] = useState([])
  const [feedingRecords, setFeedingRecords] = useState([])
  const [harvestRecords, setHarvestRecords] = useState([])
  const [showAddColony, setShowAddColony] = useState(false)
  const [activeTab, setActiveTab] = useState('colonies')
  
  const [colonyForm, setColonyForm] = useState({
    name: '', location: '', establishedDate: new Date().toISOString().slice(0, 10),
    status: 'Growing', population: '', substrate: 'Food Waste', substrateAmount: '',
    temperature: '', humidity: '', notes: ''
  })
  
  const [feedingForm, setFeedingForm] = useState({
    colonyId: '', date: new Date().toISOString().slice(0, 10),
    substrate: 'Food Waste', amount: '', cost: '', notes: ''
  })
  
  const [harvestForm, setHarvestForm] = useState({
    colonyId: '', date: new Date().toISOString().slice(0, 10),
    type: 'Larvae', quantity: '', weight: '', quality: 'Good',
    purpose: 'Animal Feed', salePrice: '', notes: ''
  })

  useEffect(() => {
    const raw = localStorage.getItem(KEY)
    if (raw) setColonies(JSON.parse(raw))
    else setColonies(SAMPLE_COLONIES)
    
    const feedingRaw = localStorage.getItem(FEEDING_KEY)
    if (feedingRaw) setFeedingRecords(JSON.parse(feedingRaw))
    
    const harvestRaw = localStorage.getItem(HARVEST_KEY)
    if (harvestRaw) setHarvestRecords(JSON.parse(harvestRaw))
  }, [])

  useEffect(() => localStorage.setItem(KEY, JSON.stringify(colonies)), [colonies])
  useEffect(() => localStorage.setItem(FEEDING_KEY, JSON.stringify(feedingRecords)), [feedingRecords])
  useEffect(() => localStorage.setItem(HARVEST_KEY, JSON.stringify(harvestRecords)), [harvestRecords])

  function addColony() {
    if (!colonyForm.name) {
      alert('Please provide colony name')
      return
    }
    const id = 'BSF-' + Date.now()
    setColonies([...colonies, { ...colonyForm, id }])
    resetColonyForm()
    setShowAddColony(false)
  }

  function deleteColony(id) {
    if (!confirm('Delete this colony?')) return
    setColonies(colonies.filter(c => c.id !== id))
  }

  function addFeeding() {
    if (!feedingForm.colonyId || !feedingForm.amount) {
      alert('Please select colony and enter amount')
      return
    }
    const id = 'FEED-' + Date.now()
    setFeedingRecords([...feedingRecords, { ...feedingForm, id, timestamp: new Date().toISOString() }])
    setFeedingForm({ ...feedingForm, amount: '', cost: '', notes: '' })
  }

  function addHarvest() {
    if (!harvestForm.colonyId || !harvestForm.quantity) {
      alert('Please select colony and enter quantity')
      return
    }
    const id = 'HARVEST-' + Date.now()
    setHarvestRecords([...harvestRecords, { ...harvestForm, id, timestamp: new Date().toISOString() }])
    setHarvestForm({ ...harvestForm, quantity: '', weight: '', salePrice: '', notes: '' })
  }

  function resetColonyForm() {
    setColonyForm({
      name: '', location: '', establishedDate: new Date().toISOString().slice(0, 10),
      status: 'Growing', population: '', substrate: 'Food Waste', substrateAmount: '',
      temperature: '', humidity: '', notes: ''
    })
  }

  const activeColonies = colonies.filter(c => c.status === 'Active')
  const totalPopulation = colonies.reduce((sum, c) => sum + (parseInt(c.population) || 0), 0)
  const totalHarvest = harvestRecords.reduce((sum, h) => sum + (parseFloat(h.weight) || 0), 0)
  const totalRevenue = harvestRecords.reduce((sum, h) => sum + (parseFloat(h.salePrice) || 0), 0)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3>🪰 BSF (Black Soldier Fly) Farming</h3>
        <button onClick={() => setShowAddColony(!showAddColony)}>
          {showAddColony ? '✕ Cancel' : '+ Add Colony'}
        </button>
      </div>

      {/* Summary Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 20 }}>
        <div className="card" style={{ padding: 16, background: '#f0fdf4' }}>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Active Colonies</div>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#059669' }}>{activeColonies.length}</div>
        </div>
        <div className="card" style={{ padding: 16, background: '#eff6ff' }}>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Total Population</div>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#2563eb' }}>{totalPopulation.toLocaleString()}</div>
        </div>
        <div className="card" style={{ padding: 16, background: '#fef3c7' }}>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Total Harvest (kg)</div>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#f59e0b' }}>{totalHarvest.toFixed(1)}</div>
        </div>
        <div className="card" style={{ padding: 16, background: '#d1fae5' }}>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Total Revenue</div>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#059669' }}>{formatCurrency(totalRevenue)}</div>
        </div>
      </div>

      {/* Add Colony Form */}
      {showAddColony && (
        <div className="card" style={{ padding: 20, marginBottom: 20 }}>
          <h4 style={{ marginTop: 0 }}>Add New BSF Colony</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <div>
              <label>Colony Name *</label>
              <input value={colonyForm.name} onChange={e => setColonyForm({ ...colonyForm, name: e.target.value })} placeholder="Colony A" />
            </div>
            <div>
              <label>Location</label>
              <input value={colonyForm.location} onChange={e => setColonyForm({ ...colonyForm, location: e.target.value })} placeholder="Barn 1" />
            </div>
            <div>
              <label>Established Date</label>
              <input type="date" value={colonyForm.establishedDate} onChange={e => setColonyForm({ ...colonyForm, establishedDate: e.target.value })} />
            </div>
            <div>
              <label>Status</label>
              <select value={colonyForm.status} onChange={e => setColonyForm({ ...colonyForm, status: e.target.value })}>
                {COLONY_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label>Initial Population</label>
              <input type="number" value={colonyForm.population} onChange={e => setColonyForm({ ...colonyForm, population: e.target.value })} placeholder="5000" />
            </div>
            <div>
              <label>Substrate Type</label>
              <select value={colonyForm.substrate} onChange={e => setColonyForm({ ...colonyForm, substrate: e.target.value })}>
                {SUBSTRATE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label>Substrate Amount (kg)</label>
              <input type="number" step="0.1" value={colonyForm.substrateAmount} onChange={e => setColonyForm({ ...colonyForm, substrateAmount: e.target.value })} />
            </div>
            <div>
              <label>Temperature (°C)</label>
              <input type="number" step="0.1" value={colonyForm.temperature} onChange={e => setColonyForm({ ...colonyForm, temperature: e.target.value })} placeholder="27-32" />
            </div>
            <div>
              <label>Humidity (%)</label>
              <input type="number" value={colonyForm.humidity} onChange={e => setColonyForm({ ...colonyForm, humidity: e.target.value })} placeholder="60-70" />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label>Notes</label>
              <textarea value={colonyForm.notes} onChange={e => setColonyForm({ ...colonyForm, notes: e.target.value })} rows={2} />
            </div>
          </div>
          <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
            <button onClick={addColony}>Add Colony</button>
            <button onClick={() => setShowAddColony(false)} style={{ background: '#6b7280' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ marginBottom: 16, borderBottom: '2px solid #e5e7eb' }}>
        <button 
          onClick={() => setActiveTab('colonies')} 
          style={{ 
            padding: '8px 16px', 
            border: 'none', 
            background: activeTab === 'colonies' ? '#059669' : 'transparent',
            color: activeTab === 'colonies' ? '#fff' : '#666',
            cursor: 'pointer'
          }}
        >Colonies</button>
        <button 
          onClick={() => setActiveTab('feeding')} 
          style={{ 
            padding: '8px 16px', 
            border: 'none', 
            background: activeTab === 'feeding' ? '#059669' : 'transparent',
            color: activeTab === 'feeding' ? '#fff' : '#666',
            cursor: 'pointer'
          }}
        >Feeding Records</button>
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

      {/* Colonies Tab */}
      {activeTab === 'colonies' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {colonies.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🪰</div>
              <h4>No BSF colonies yet</h4>
              <p style={{ color: '#666' }}>Add your first colony to start tracking</p>
            </div>
          ) : (
            <div style={{ maxHeight: 600, overflowY: 'auto' }}>
              {colonies.map(colony => {
                const daysActive = Math.floor((new Date() - new Date(colony.establishedDate)) / (1000 * 60 * 60 * 24))
                
                return (
                  <div key={colony.id} style={{ padding: 16, borderBottom: '1px solid #eee' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 600, fontSize: 16 }}>{colony.name}</span>
                          <span className="badge" style={{ 
                            background: colony.status === 'Active' ? '#d1fae5' : colony.status === 'Growing' ? '#fef3c7' : '#e5e7eb' 
                          }}>{colony.status}</span>
                        </div>
                        <div style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>
                          <strong>Location:</strong> {colony.location} • <strong>Established:</strong> {new Date(colony.establishedDate).toLocaleDateString()} ({daysActive} days ago)
                        </div>
                        <div style={{ fontSize: 13, color: '#666', marginBottom: 4 }}>
                          <strong>Population:</strong> {parseInt(colony.population || 0).toLocaleString()} • <strong>Substrate:</strong> {colony.substrate} ({colony.substrateAmount}kg)
                        </div>
                        <div style={{ fontSize: 13, color: '#666', marginBottom: 4 }}>
                          <strong>Temp:</strong> {colony.temperature}°C • <strong>Humidity:</strong> {colony.humidity}%
                        </div>
                        {colony.notes && (
                          <div style={{ fontSize: 13, color: '#888', marginTop: 8, fontStyle: 'italic' }}>{colony.notes}</div>
                        )}
                      </div>
                      <button onClick={() => deleteColony(colony.id)} style={{ fontSize: 12, padding: '4px 8px', background: '#dc2626' }}>Delete</button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Feeding Tab */}
      {activeTab === 'feeding' && (
        <div>
          <div className="card" style={{ padding: 16, marginBottom: 16 }}>
            <h4 style={{ marginTop: 0 }}>Add Feeding Record</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              <div>
                <label>Colony *</label>
                <select value={feedingForm.colonyId} onChange={e => setFeedingForm({ ...feedingForm, colonyId: e.target.value })}>
                  <option value="">-- Select Colony --</option>
                  {colonies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label>Date</label>
                <input type="date" value={feedingForm.date} onChange={e => setFeedingForm({ ...feedingForm, date: e.target.value })} />
              </div>
              <div>
                <label>Substrate Type</label>
                <select value={feedingForm.substrate} onChange={e => setFeedingForm({ ...feedingForm, substrate: e.target.value })}>
                  {SUBSTRATE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label>Amount (kg) *</label>
                <input type="number" step="0.1" value={feedingForm.amount} onChange={e => setFeedingForm({ ...feedingForm, amount: e.target.value })} />
              </div>
              <div>
                <label>Cost</label>
                <input type="number" step="0.01" value={feedingForm.cost} onChange={e => setFeedingForm({ ...feedingForm, cost: e.target.value })} />
              </div>
              <div>
                <label>Notes</label>
                <input value={feedingForm.notes} onChange={e => setFeedingForm({ ...feedingForm, notes: e.target.value })} />
              </div>
            </div>
            <button onClick={addFeeding} style={{ marginTop: 12 }}>Add Feeding Record</button>
          </div>

          <div className="card" style={{ padding: 0 }}>
            {feedingRecords.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center' }}>
                <h4>No feeding records yet</h4>
              </div>
            ) : (
              <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                {feedingRecords.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).map(record => {
                  const colony = colonies.find(c => c.id === record.colonyId)
                  return (
                    <div key={record.id} style={{ padding: 12, borderBottom: '1px solid #eee' }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ fontWeight: 600 }}>{colony?.name || record.colonyId}</span>
                        {record.cost && <span className="badge" style={{ background: '#fee2e2' }}>{formatCurrency(parseFloat(record.cost))}</span>}
                      </div>
                      <div style={{ fontSize: 13, color: '#666' }}>
                        {new Date(record.date).toLocaleDateString()} • {record.substrate} • {record.amount}kg
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
                <label>Colony *</label>
                <select value={harvestForm.colonyId} onChange={e => setHarvestForm({ ...harvestForm, colonyId: e.target.value })}>
                  <option value="">-- Select Colony --</option>
                  {colonies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label>Date</label>
                <input type="date" value={harvestForm.date} onChange={e => setHarvestForm({ ...harvestForm, date: e.target.value })} />
              </div>
              <div>
                <label>Type</label>
                <select value={harvestForm.type} onChange={e => setHarvestForm({ ...harvestForm, type: e.target.value })}>
                  {HARVEST_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label>Quantity *</label>
                <input type="number" value={harvestForm.quantity} onChange={e => setHarvestForm({ ...harvestForm, quantity: e.target.value })} placeholder="Number of units" />
              </div>
              <div>
                <label>Weight (kg)</label>
                <input type="number" step="0.1" value={harvestForm.weight} onChange={e => setHarvestForm({ ...harvestForm, weight: e.target.value })} />
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
                <input value={harvestForm.purpose} onChange={e => setHarvestForm({ ...harvestForm, purpose: e.target.value })} placeholder="Animal Feed / Sale" />
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
                  const colony = colonies.find(c => c.id === record.colonyId)
                  return (
                    <div key={record.id} style={{ padding: 12, borderBottom: '1px solid #eee' }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ fontWeight: 600 }}>{colony?.name || record.colonyId}</span>
                        <span className="badge">{record.type}</span>
                        <span className="badge" style={{ background: '#fef3c7' }}>{record.quality}</span>
                        {record.salePrice && <span className="badge" style={{ background: '#d1fae5' }}>{formatCurrency(parseFloat(record.salePrice))}</span>}
                      </div>
                      <div style={{ fontSize: 13, color: '#666' }}>
                        {new Date(record.date).toLocaleDateString()} • Qty: {record.quantity} • Weight: {record.weight}kg
                        {record.purpose && ` • ${record.purpose}`}
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
