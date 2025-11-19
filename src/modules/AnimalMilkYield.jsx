import React, { useEffect, useState } from 'react'

const SAMPLE = [
  { id: 'MILK-001', animalId: 'A-001', date: '2025-06-02', timestamp: '2025-06-02T06:30:00', session: 'Morning', liters: 18.5, fatContent: 3.8, proteinContent: 3.2, scc: 150000, temp: 37.5, quality: 'Grade A', notes: 'Normal milking' },
  { id: 'MILK-002', animalId: 'A-001', date: '2025-06-02', timestamp: '2025-06-02T18:00:00', session: 'Evening', liters: 16.2, fatContent: 4.0, proteinContent: 3.3, scc: 145000, temp: 37.2, quality: 'Grade A', notes: '' }
]

const MILKING_SESSIONS = ['Morning', 'Midday', 'Evening', 'Night']
const QUALITY_GRADES = ['Grade A', 'Grade B', 'Grade C', 'Premium', 'Standard', 'Below Standard']

export default function AnimalMilkYield({ animals }){
  const KEY = 'cattalytics:animal:milkyield'
  const [items, setItems] = useState([])
  const [animalId, setAnimalId] = useState(animals && animals[0] ? animals[0].id : '')
  const [session, setSession] = useState('Morning')
  const [liters, setLiters] = useState('')
  const [fatContent, setFatContent] = useState('')
  const [proteinContent, setProteinContent] = useState('')
  const [scc, setScc] = useState('')
  const [temp, setTemp] = useState('')
  const [quality, setQuality] = useState('Grade A')
  const [notes, setNotes] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [filterAnimal, setFilterAnimal] = useState('all')
  const [filterDate, setFilterDate] = useState('')
  const [viewMode, setViewMode] = useState('list')

  useEffect(()=>{
    const raw = localStorage.getItem(KEY)
    if(raw) setItems(JSON.parse(raw))
    else setItems(SAMPLE)
  }, [])

  useEffect(()=> localStorage.setItem(KEY, JSON.stringify(items)), [items])

  function add(){
    if(!animalId || !liters) {
      alert('Please select animal and enter milk quantity')
      return
    }
    const id = 'MILK-' + Math.floor(1000 + Math.random()*9000)
    const newItem = {
      id,
      animalId,
      date: new Date().toISOString().slice(0,10),
      timestamp: new Date().toISOString(),
      session,
      liters: parseFloat(liters),
      fatContent: parseFloat(fatContent) || null,
      proteinContent: parseFloat(proteinContent) || null,
      scc: parseInt(scc) || null,
      temp: parseFloat(temp) || null,
      quality,
      notes: notes.trim()
    }
    setItems([...items, newItem])
    setLiters('')
    setFatContent('')
    setProteinContent('')
    setScc('')
    setTemp('')
    setNotes('')
    setShowAddForm(false)
  }

  function remove(id){ if(!confirm('Delete record '+id+'?')) return; setItems(items.filter(i=>i.id!==id)) }

  const filteredItems = items.filter(item => {
    if(filterAnimal !== 'all' && item.animalId !== filterAnimal) return false
    if(filterDate && item.date !== filterDate) return false
    return true
  })

  // Calculate statistics
  const totalMilk = filteredItems.reduce((sum, item) => sum + (item.liters || 0), 0)
  const avgDaily = filteredItems.length > 0 ? totalMilk / new Set(filteredItems.map(i => i.date)).size : 0
  const avgFat = filteredItems.filter(i => i.fatContent).length > 0 
    ? filteredItems.reduce((sum, i) => sum + (i.fatContent || 0), 0) / filteredItems.filter(i => i.fatContent).length 
    : 0
  const avgProtein = filteredItems.filter(i => i.proteinContent).length > 0
    ? filteredItems.reduce((sum, i) => sum + (i.proteinContent || 0), 0) / filteredItems.filter(i => i.proteinContent).length
    : 0
  const avgSCC = filteredItems.filter(i => i.scc).length > 0
    ? filteredItems.reduce((sum, i) => sum + (i.scc || 0), 0) / filteredItems.filter(i => i.scc).length
    : 0

  // Animal production summary
  const animalProduction = {}
  filteredItems.forEach(item => {
    if(!animalProduction[item.animalId]) {
      animalProduction[item.animalId] = { total: 0, count: 0, sessions: {} }
    }
    animalProduction[item.animalId].total += item.liters || 0
    animalProduction[item.animalId].count += 1
    if(!animalProduction[item.animalId].sessions[item.session]) {
      animalProduction[item.animalId].sessions[item.session] = 0
    }
    animalProduction[item.animalId].sessions[item.session] += item.liters || 0
  })

  return (
    <section>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3>🥛 Milk Production</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className={viewMode === 'list' ? 'tab-btn active' : 'tab-btn'} onClick={() => setViewMode('list')}>List</button>
          <button className={viewMode === 'summary' ? 'tab-btn active' : 'tab-btn'} onClick={() => setViewMode('summary')}>Summary</button>
          <button onClick={() => setShowAddForm(!showAddForm)}>
            {showAddForm ? '✕ Cancel' : '+ Add Milk Record'}
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
        <div className="card" style={{ padding: 16, background: '#f0fdf4' }}>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Total Production</div>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#059669' }}>{totalMilk.toFixed(1)} L</div>
        </div>
        <div className="card" style={{ padding: 16, background: '#eff6ff' }}>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Avg Daily</div>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#2563eb' }}>{avgDaily.toFixed(1)} L</div>
        </div>
        <div className="card" style={{ padding: 16, background: '#fef3c7' }}>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Avg Fat Content</div>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#f59e0b' }}>{avgFat > 0 ? avgFat.toFixed(1) + '%' : 'N/A'}</div>
        </div>
        <div className="card" style={{ padding: 16, background: '#e0f2fe' }}>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Avg Protein</div>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#0284c7' }}>{avgProtein > 0 ? avgProtein.toFixed(1) + '%' : 'N/A'}</div>
        </div>
        {avgSCC > 0 && (
          <div className="card" style={{ padding: 16, background: avgSCC < 200000 ? '#d1fae5' : avgSCC < 400000 ? '#fef3c7' : '#fee2e2' }}>
            <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Avg SCC</div>
            <div style={{ fontSize: 20, fontWeight: 'bold', color: avgSCC < 200000 ? '#059669' : avgSCC < 400000 ? '#f59e0b' : '#dc2626' }}>
              {(avgSCC / 1000).toFixed(0)}k
            </div>
          </div>
        )}
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="card" style={{ padding: 20, marginBottom: 20 }}>
          <h4 style={{ marginTop: 0 }}>Add Milk Production Record</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <div>
              <label>Animal *</label>
              <select value={animalId} onChange={e => setAnimalId(e.target.value)}>
                <option value="">-- Select Animal --</option>
                {(animals||[]).filter(a => a.sex === 'F' && (a.lactationStatus === 'Lactating' || !a.lactationStatus)).map(a => (
                  <option key={a.id} value={a.id}>{a.name || a.tag} ({a.breed})</option>
                ))}
              </select>
            </div>
            <div>
              <label>Milking Session *</label>
              <select value={session} onChange={e => setSession(e.target.value)}>
                {MILKING_SESSIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label>Quantity (Liters) *</label>
              <input type="number" step="0.1" value={liters} onChange={e => setLiters(e.target.value)} placeholder="0.0" />
            </div>
            <div>
              <label>Fat Content (%)</label>
              <input type="number" step="0.1" value={fatContent} onChange={e => setFatContent(e.target.value)} placeholder="e.g., 3.8" />
            </div>
            <div>
              <label>Protein Content (%)</label>
              <input type="number" step="0.1" value={proteinContent} onChange={e => setProteinContent(e.target.value)} placeholder="e.g., 3.2" />
            </div>
            <div>
              <label>SCC (cells/mL)</label>
              <input type="number" value={scc} onChange={e => setScc(e.target.value)} placeholder="e.g., 150000" />
            </div>
            <div>
              <label>Temperature (°C)</label>
              <input type="number" step="0.1" value={temp} onChange={e => setTemp(e.target.value)} placeholder="e.g., 37.5" />
            </div>
            <div>
              <label>Quality Grade</label>
              <select value={quality} onChange={e => setQuality(e.target.value)}>
                {QUALITY_GRADES.map(q => <option key={q} value={q}>{q}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: 'span 3' }}>
              <label>Notes</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Additional notes about this milking session..." />
            </div>
          </div>
          <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
            <button onClick={add}>Add Milk Record</button>
            <button onClick={() => setShowAddForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <select value={filterAnimal} onChange={e => setFilterAnimal(e.target.value)}>
          <option value="all">All Animals</option>
          {(animals||[]).filter(a => a.sex === 'F').map(a => <option key={a.id} value={a.id}>{a.name || a.tag}</option>)}
        </select>
        <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} placeholder="Filter by date" />
        {(filterAnimal !== 'all' || filterDate) && (
          <button onClick={() => { setFilterAnimal('all'); setFilterDate('') }}>Clear Filters</button>
        )}
      </div>

      {/* Animal Production Summary View */}
      {viewMode === 'summary' && (
        <div className="card" style={{ padding: 20 }}>
          <h4 style={{ marginTop: 0 }}>Production Summary by Animal</h4>
          <div style={{ display: 'grid', gap: 16 }}>
            {Object.entries(animalProduction).map(([aId, data]) => {
              const animal = (animals||[]).find(a => a.id === aId)
              const avgPerSession = data.total / data.count
              return (
                <div key={aId} className="card" style={{ padding: 16, background: '#f9fafb' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div>
                      <h4 style={{ margin: 0, marginBottom: 4 }}>{animal?.name || animal?.tag || aId}</h4>
                      <div style={{ fontSize: 13, color: '#666' }}>{animal?.breed}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 24, fontWeight: 'bold', color: '#059669' }}>{data.total.toFixed(1)} L</div>
                      <div style={{ fontSize: 12, color: '#666' }}>{data.count} sessions</div>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8 }}>
                    <div style={{ padding: 8, background: 'white', borderRadius: 4 }}>
                      <div style={{ fontSize: 11, color: '#666' }}>Avg/Session</div>
                      <div style={{ fontSize: 16, fontWeight: 600 }}>{avgPerSession.toFixed(1)} L</div>
                    </div>
                    {Object.entries(data.sessions).map(([sess, amt]) => (
                      <div key={sess} style={{ padding: 8, background: 'white', borderRadius: 4 }}>
                        <div style={{ fontSize: 11, color: '#666' }}>{sess}</div>
                        <div style={{ fontSize: 16, fontWeight: 600 }}>{amt.toFixed(1)} L</div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Records List View */}
      {viewMode === 'list' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {filteredItems.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🥛</div>
              <h4>No milk production records yet</h4>
              <p style={{ color: '#666' }}>Add your first milk record to start tracking</p>
            </div>
          ) : (
            <div style={{ maxHeight: 600, overflowY: 'auto' }}>
              {filteredItems.sort((a, b) => new Date(b.timestamp || b.date) - new Date(a.timestamp || a.date)).map(item => {
                const animal = (animals||[]).find(a => a.id === item.animalId)
                const sccStatus = item.scc ? (item.scc < 200000 ? 'good' : item.scc < 400000 ? 'warning' : 'poor') : null
                
                return (
                  <div key={item.id} style={{ padding: 16, borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 600, fontSize: 18, color: '#059669' }}>{item.liters.toFixed(1)} L</span>
                        <span className="badge" style={{ background: '#e0f2fe' }}>{item.session}</span>
                        <span className="badge" style={{ background: '#f3e8ff' }}>{item.quality}</span>
                        {item.fatContent && <span className="badge" style={{ background: '#fef3c7' }}>Fat: {item.fatContent}%</span>}
                        {item.proteinContent && <span className="badge" style={{ background: '#dbeafe' }}>Protein: {item.proteinContent}%</span>}
                        {sccStatus && (
                          <span className="badge" style={{ 
                            background: sccStatus === 'good' ? '#d1fae5' : sccStatus === 'warning' ? '#fef3c7' : '#fee2e2',
                            color: sccStatus === 'good' ? '#059669' : sccStatus === 'warning' ? '#f59e0b' : '#dc2626'
                          }}>
                            SCC: {(item.scc / 1000).toFixed(0)}k
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>
                        <strong>{animal?.name || animal?.tag || item.animalId}</strong> • {new Date(item.timestamp || item.date).toLocaleString()}
                      </div>
                      {item.temp && (
                        <div style={{ fontSize: 13, color: '#888' }}>Temperature: {item.temp}°C</div>
                      )}
                      {item.notes && (
                        <div style={{ fontSize: 13, color: '#888', marginTop: 8 }}>{item.notes}</div>
                      )}
                    </div>
                    <button className="tab-btn" style={{ color: '#dc2626' }} onClick={() => remove(item.id)}>🗑️</button>
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
