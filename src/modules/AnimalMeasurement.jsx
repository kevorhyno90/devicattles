import React, { useEffect, useState } from 'react'
import { exportToCSV, exportToExcel, exportToJSON, exportToPDF } from '../lib/exportImport'

const SAMPLE = [
  { id: 'MEAS-001', animalId: 'A-001', date: '2025-06-02', timestamp: '2025-06-02T10:00:00', type: 'Weight', value: 450, unit: 'kg', bcs: 3.5, height: null, length: null, girth: null, condition: 'Good', measuredBy: 'Farm Staff', notes: 'Regular check' },
  { id: 'MEAS-002', animalId: 'A-002', date: '2025-06-01', timestamp: '2025-06-01T09:30:00', type: 'Weight', value: 380, unit: 'kg', bcs: 3.0, height: 145, length: null, girth: null, condition: 'Good', measuredBy: 'Farm Staff', notes: '' }
]

const MEASUREMENT_TYPES = ['Weight', 'Height', 'Length', 'Girth', 'Body Condition Score', 'Temperature', 'Heart Rate', 'Respiratory Rate', 'Multiple']
const UNITS = {
  'Weight': ['kg', 'lbs'],
  'Height': ['cm', 'inches'],
  'Length': ['cm', 'inches'],
  'Girth': ['cm', 'inches'],
  'Temperature': ['°C', '°F'],
  'Heart Rate': ['bpm'],
  'Respiratory Rate': ['breaths/min']
}
const BODY_CONDITIONS = ['1.0 - Emaciated', '1.5', '2.0 - Thin', '2.5', '3.0 - Ideal', '3.5', '4.0 - Fat', '4.5', '5.0 - Obese']
const CONDITIONS = ['Excellent', 'Good', 'Fair', 'Poor', 'Concern']

export default function AnimalMeasurement({ animals }){
  const KEY = 'cattalytics:animal:measurement'
  const [items, setItems] = useState([])
  const [animalId, setAnimalId] = useState(animals && animals[0] ? animals[0].id : '')
  const [type, setType] = useState('Weight')
  const [value, setValue] = useState('')
  const [unit, setUnit] = useState('kg')
  const [bcs, setBcs] = useState('')
  const [height, setHeight] = useState('')
  const [length, setLength] = useState('')
  const [girth, setGirth] = useState('')
  const [condition, setCondition] = useState('Good')
  const [measuredBy, setMeasuredBy] = useState('')
  const [notes, setNotes] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [filterAnimal, setFilterAnimal] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [viewMode, setViewMode] = useState('list')
  const [editingId, setEditingId] = useState(null)

  useEffect(()=>{
    const raw = localStorage.getItem(KEY)
    if(raw) setItems(JSON.parse(raw))
    else setItems(SAMPLE)
  }, [])

  useEffect(()=> localStorage.setItem(KEY, JSON.stringify(items)), [items])

  function add(){
    if(!animalId || (!value && !bcs && !height && !length && !girth)) {
      alert('Please select animal and enter at least one measurement')
      return
    }
    
    if(editingId) {
      // Update existing record
      setItems(items.map(item => 
        item.id === editingId 
          ? {
              ...item,
              animalId,
              type,
              value: parseFloat(value) || null,
              unit,
              bcs: parseFloat(bcs) || null,
              height: parseFloat(height) || null,
              length: parseFloat(length) || null,
              girth: parseFloat(girth) || null,
              condition,
              measuredBy: measuredBy.trim(),
              notes: notes.trim()
            }
          : item
      ))
      setEditingId(null)
    } else {
      // Create new record
      const id = 'MEAS-' + Math.floor(1000 + Math.random()*9000)
      const newItem = {
        id,
        animalId,
        date: new Date().toISOString().slice(0,10),
        timestamp: new Date().toISOString(),
        type,
        value: parseFloat(value) || null,
        unit,
        bcs: parseFloat(bcs) || null,
        height: parseFloat(height) || null,
        length: parseFloat(length) || null,
        girth: parseFloat(girth) || null,
        condition,
        measuredBy: measuredBy.trim(),
        notes: notes.trim()
      }
      setItems([...items, newItem])
    }
    
    setValue('')
    setBcs('')
    setHeight('')
    setLength('')
    setGirth('')
    setMeasuredBy('')
    setNotes('')
    setShowAddForm(false)
  }

  function remove(id){ if(!confirm('Delete record '+id+'?')) return; setItems(items.filter(i=>i.id!==id)) }

  function startEdit(item){
    setEditingId(item.id)
    setAnimalId(item.animalId)
    setType(item.type)
    setValue(item.value ? String(item.value) : '')
    setUnit(item.unit)
    setBcs(item.bcs ? String(item.bcs) : '')
    setHeight(item.height ? String(item.height) : '')
    setLength(item.length ? String(item.length) : '')
    setGirth(item.girth ? String(item.girth) : '')
    setCondition(item.condition)
    setMeasuredBy(item.measuredBy || '')
    setNotes(item.notes || '')
    setShowAddForm(true)
  }

  function cancelEdit(){
    setEditingId(null)
    setValue('')
    setBcs('')
    setHeight('')
    setLength('')
    setGirth('')
    setMeasuredBy('')
    setNotes('')
    setShowAddForm(false)
    if(animals && animals[0]) setAnimalId(animals[0].id)
  }

  const filteredItems = items.filter(item => {
    if(filterAnimal !== 'all' && item.animalId !== filterAnimal) return false
    if(filterType !== 'all' && item.type !== filterType) return false
    return true
  })

  // Calculate statistics per animal
  const animalStats = {}
  filteredItems.forEach(item => {
    if(!animalStats[item.animalId]) {
      animalStats[item.animalId] = {
        weights: [],
        latestWeight: null,
        firstWeight: null,
        avgWeight: 0,
        weightGain: 0,
        latestBCS: null,
        measurements: []
      }
    }
    if(item.type === 'Weight' && item.value) {
      animalStats[item.animalId].weights.push({ date: item.date, value: item.value })
    }
    animalStats[item.animalId].measurements.push(item)
  })

  // Calculate weight statistics
  Object.keys(animalStats).forEach(aId => {
    const stats = animalStats[aId]
    if(stats.weights.length > 0) {
      stats.weights.sort((a, b) => new Date(a.date) - new Date(b.date))
      stats.firstWeight = stats.weights[0].value
      stats.latestWeight = stats.weights[stats.weights.length - 1].value
      stats.avgWeight = stats.weights.reduce((sum, w) => sum + w.value, 0) / stats.weights.length
      stats.weightGain = stats.latestWeight - stats.firstWeight
    }
    const bcsItems = stats.measurements.filter(m => m.bcs)
    if(bcsItems.length > 0) {
      stats.latestBCS = bcsItems[bcsItems.length - 1].bcs
    }
  })

  // Export functions
  const handleExportCSV = () => {
    const data = filteredItems.map(item => ({
      ID: item.id,
      Date: item.date,
      Animal: animals?.find(a => a.id === item.animalId)?.name || item.animalId,
      Type: item.type,
      Value: item.value || 'N/A',
      Unit: item.unit || '',
      BCS: item.bcs || 'N/A',
      Condition: item.condition,
      MeasuredBy: item.measuredBy || 'N/A',
      Notes: item.notes || ''
    }))
    exportToCSV(data, 'animal_measurements.csv')
  }

  const handleExportPDF = () => {
    const data = filteredItems.map(item => ({
      Date: item.date,
      Animal: animals?.find(a => a.id === item.animalId)?.name || item.animalId,
      Type: item.type,
      Value: item.value ? `${item.value} ${item.unit}` : 'N/A',
      BCS: item.bcs || 'N/A',
      Condition: item.condition
    }))
    exportToPDF(data, 'animal_measurements', 'Animal Measurements & Growth')
  }

  return (
    <section>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3>📏 Animal Measurements & Growth</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleExportCSV} title="Export to CSV" style={{ fontSize: 12 }}>📊 CSV</button>
          <button onClick={() => exportToExcel(filteredItems, 'measurements.csv')} title="Export to Excel" style={{ fontSize: 12 }}>📈 Excel</button>
          <button onClick={handleExportPDF} title="Export to PDF" style={{ fontSize: 12 }}>📕 PDF</button>
          <button onClick={() => exportToJSON(filteredItems, 'measurements.json')} title="Export to JSON" style={{ fontSize: 12 }}>📄 JSON</button>
          <button className={viewMode === 'list' ? 'tab-btn active' : 'tab-btn'} onClick={() => setViewMode('list')}>List</button>
          <button className={viewMode === 'growth' ? 'tab-btn active' : 'tab-btn'} onClick={() => setViewMode('growth')}>Growth Tracking</button>
          <button onClick={() => setShowAddForm(!showAddForm)}>
            {showAddForm ? (editingId ? 'Cancel Edit' : '✕ Cancel') : '+ Add Measurement'}
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 20 }}>
        <div className="card" style={{ padding: 16, background: '#f0fdf4' }}>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Total Measurements</div>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#059669' }}>{filteredItems.length}</div>
        </div>
        <div className="card" style={{ padding: 16, background: '#eff6ff' }}>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Animals Tracked</div>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#2563eb' }}>{Object.keys(animalStats).length}</div>
        </div>
        <div className="card" style={{ padding: 16, background: '#fef3c7' }}>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Weight Records</div>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#f59e0b' }}>
            {filteredItems.filter(i => i.type === 'Weight' && i.value).length}
          </div>
        </div>
        <div className="card" style={{ padding: 16, background: '#e0f2fe' }}>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>BCS Records</div>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#0284c7' }}>
            {filteredItems.filter(i => i.bcs).length}
          </div>
        </div>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="card" style={{ padding: 20, marginBottom: 20 }}>
          <h4 style={{ marginTop: 0 }}>{editingId ? 'Edit Measurement Record' : 'Add Measurement Record'}</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <div>
              <label>Animal *</label>
              <select value={animalId} onChange={e => setAnimalId(e.target.value)}>
                <option value="">-- Select Animal --</option>
                {(animals||[]).map(a => (
                  <option key={a.id} value={a.id}>{a.name || a.tag} ({a.breed})</option>
                ))}
              </select>
            </div>
            <div>
              <label>Measurement Type</label>
              <select value={type} onChange={e => {
                setType(e.target.value)
                setUnit(UNITS[e.target.value]?.[0] || '')
              }}>
                {MEASUREMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label>Overall Condition</label>
              <select value={condition} onChange={e => setCondition(e.target.value)}>
                {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            {type !== 'Multiple' && type !== 'Body Condition Score' && (
              <>
                <div>
                  <label>{type} Value</label>
                  <input type="number" step="0.1" value={value} onChange={e => setValue(e.target.value)} placeholder="0.0" />
                </div>
                <div>
                  <label>Unit</label>
                  <select value={unit} onChange={e => setUnit(e.target.value)}>
                    {(UNITS[type] || ['unit']).map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </>
            )}
            {type === 'Multiple' && (
              <>
                <div>
                  <label>Weight (kg)</label>
                  <input type="number" step="0.1" value={value} onChange={e => setValue(e.target.value)} placeholder="0.0" />
                </div>
                <div>
                  <label>Height (cm)</label>
                  <input type="number" step="0.1" value={height} onChange={e => setHeight(e.target.value)} placeholder="0.0" />
                </div>
                <div>
                  <label>Length (cm)</label>
                  <input type="number" step="0.1" value={length} onChange={e => setLength(e.target.value)} placeholder="0.0" />
                </div>
                <div>
                  <label>Girth (cm)</label>
                  <input type="number" step="0.1" value={girth} onChange={e => setGirth(e.target.value)} placeholder="0.0" />
                </div>
              </>
            )}
            <div>
              <label>Body Condition Score (1-5)</label>
              <select value={bcs} onChange={e => setBcs(e.target.value)}>
                <option value="">-- Not Scored --</option>
                {BODY_CONDITIONS.map(b => <option key={b} value={b.split(' -')[0]}>{b}</option>)}
              </select>
            </div>
            <div>
              <label>Measured By</label>
              <input value={measuredBy} onChange={e => setMeasuredBy(e.target.value)} placeholder="Person's name" />
            </div>
            <div style={{ gridColumn: 'span 3' }}>
              <label>Notes</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Additional observations or comments..." />
            </div>
          </div>
          <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
            <button onClick={add}>{editingId ? 'Save Changes' : 'Add Measurement'}</button>
            {editingId && <button onClick={cancelEdit}>Cancel Edit</button>}
            <button onClick={() => setShowAddForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <select value={filterAnimal} onChange={e => setFilterAnimal(e.target.value)}>
          <option value="all">All Animals</option>
          {(animals||[]).map(a => <option key={a.id} value={a.id}>{a.name || a.tag}</option>)}
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="all">All Types</option>
          {MEASUREMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        {(filterAnimal !== 'all' || filterType !== 'all') && (
          <button onClick={() => { setFilterAnimal('all'); setFilterType('all') }}>Clear Filters</button>
        )}
      </div>

      {/* Growth Tracking View */}
      {viewMode === 'growth' && (
        <div style={{ display: 'grid', gap: 16 }}>
          {Object.entries(animalStats).map(([aId, stats]) => {
            const animal = (animals||[]).find(a => a.id === aId)
            return (
              <div key={aId} className="card" style={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div>
                    <h4 style={{ margin: 0, marginBottom: 4 }}>{animal?.name || animal?.tag || aId}</h4>
                    <div style={{ fontSize: 13, color: '#666' }}>{animal?.breed} • {animal?.sex === 'F' ? 'Female' : 'Male'}</div>
                  </div>
                  {stats.latestWeight && (
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 24, fontWeight: 'bold', color: '#059669' }}>{stats.latestWeight.toFixed(1)} kg</div>
                      <div style={{ fontSize: 12, color: '#666' }}>Current Weight</div>
                    </div>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 16 }}>
                  {stats.firstWeight && (
                    <div className="card" style={{ padding: 12, background: '#f9fafb' }}>
                      <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>Starting Weight</div>
                      <div style={{ fontSize: 18, fontWeight: 600 }}>{stats.firstWeight.toFixed(1)} kg</div>
                    </div>
                  )}
                  {stats.avgWeight > 0 && (
                    <div className="card" style={{ padding: 12, background: '#f9fafb' }}>
                      <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>Average Weight</div>
                      <div style={{ fontSize: 18, fontWeight: 600 }}>{stats.avgWeight.toFixed(1)} kg</div>
                    </div>
                  )}
                  {stats.weightGain !== 0 && (
                    <div className="card" style={{ padding: 12, background: stats.weightGain > 0 ? '#d1fae5' : '#fee2e2' }}>
                      <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>Weight Gain/Loss</div>
                      <div style={{ fontSize: 18, fontWeight: 600, color: stats.weightGain > 0 ? '#059669' : '#dc2626' }}>
                        {stats.weightGain > 0 ? '+' : ''}{stats.weightGain.toFixed(1)} kg
                      </div>
                    </div>
                  )}
                  {stats.latestBCS && (
                    <div className="card" style={{ padding: 12, background: '#fef3c7' }}>
                      <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>Latest BCS</div>
                      <div style={{ fontSize: 18, fontWeight: 600 }}>{stats.latestBCS.toFixed(1)}</div>
                    </div>
                  )}
                  <div className="card" style={{ padding: 12, background: '#e0f2fe' }}>
                    <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>Total Measurements</div>
                    <div style={{ fontSize: 18, fontWeight: 600 }}>{stats.measurements.length}</div>
                  </div>
                </div>

                {/* Weight Progress Chart (simplified) */}
                {stats.weights.length > 1 && (
                  <div style={{ marginTop: 16 }}>
                    <h5 style={{ margin: '0 0 12px 0', fontSize: 14 }}>Weight Progress</h5>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {stats.weights.map((w, idx) => {
                        const percent = ((w.value - stats.firstWeight) / stats.firstWeight * 100)
                        return (
                          <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12 }}>
                            <div style={{ width: 100, color: '#666' }}>{new Date(w.date).toLocaleDateString()}</div>
                            <div style={{ flex: 1, background: '#f3f4f6', borderRadius: 4, height: 20, position: 'relative', overflow: 'hidden' }}>
                              <div style={{ 
                                position: 'absolute', 
                                left: 0, 
                                top: 0, 
                                height: '100%', 
                                width: `${Math.max(5, Math.min(100, (w.value / stats.latestWeight * 100)))}%`,
                                background: 'linear-gradient(90deg, #059669, #10b981)',
                                transition: 'width 0.3s'
                              }} />
                              <div style={{ position: 'relative', padding: '2px 8px', fontWeight: 600 }}>{w.value.toFixed(1)} kg</div>
                            </div>
                            {percent !== 0 && (
                              <div style={{ width: 60, textAlign: 'right', color: percent > 0 ? '#059669' : '#dc2626', fontWeight: 600 }}>
                                {percent > 0 ? '+' : ''}{percent.toFixed(1)}%
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Records List View */}
      {viewMode === 'list' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {filteredItems.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📏</div>
              <h4>No measurement records yet</h4>
              <p style={{ color: '#666' }}>Add your first measurement to start tracking growth</p>
            </div>
          ) : (
            <div style={{ maxHeight: 600, overflowY: 'auto' }}>
              {filteredItems.sort((a, b) => new Date(b.timestamp || b.date) - new Date(a.timestamp || a.date)).map(item => {
                const animal = (animals||[]).find(a => a.id === item.animalId)
                
                return (
                  <div key={item.id} style={{ padding: 16, borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 600, fontSize: 16 }}>{item.type}</span>
                        {item.value && <span style={{ fontSize: 18, color: '#059669', fontWeight: 'bold' }}>{item.value} {item.unit}</span>}
                        <span className="badge" style={{ background: item.condition === 'Excellent' ? '#d1fae5' : item.condition === 'Good' ? '#e0f2fe' : item.condition === 'Fair' ? '#fef3c7' : '#fee2e2' }}>
                          {item.condition}
                        </span>
                        {item.bcs && <span className="badge" style={{ background: '#fef3c7' }}>BCS: {item.bcs}</span>}
                      </div>
                      <div style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>
                        <strong>{animal?.name || animal?.tag || item.animalId}</strong> • {new Date(item.timestamp || item.date).toLocaleDateString()}
                        {item.measuredBy && ` • ${item.measuredBy}`}
                      </div>
                      {(item.height || item.length || item.girth) && (
                        <div style={{ fontSize: 13, color: '#666', marginBottom: 4 }}>
                          {item.height && `Height: ${item.height}cm • `}
                          {item.length && `Length: ${item.length}cm • `}
                          {item.girth && `Girth: ${item.girth}cm`}
                        </div>
                      )}
                      {item.notes && (
                        <div style={{ fontSize: 13, color: '#888', marginTop: 8, padding: 8, background: '#f9fafb', borderRadius: 4 }}>
                          {item.notes}
                        </div>
                      )}
                    </div>
                    <div style={{display:'flex',gap:4}}>
                      <button className="tab-btn" onClick={() => startEdit(item)}>✏️</button>
                      <button className="tab-btn" style={{ color: '#dc2626' }} onClick={() => remove(item.id)}>🗑️</button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
