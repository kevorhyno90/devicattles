import React, { useEffect, useState } from 'react'

const SAMPLE = [
  { id: 'BREED-001', animalId: 'A-002', date: '2025-05-20', event: 'AI', sire: 'S-101', sireName: 'Premium Bull', method: 'Artificial Insemination', technician: 'Dr. Smith', expectedDue: '2026-02-15', cost: 150, notes: 'First breeding attempt', status: 'Confirmed' },
  { id: 'BREED-002', animalId: 'A-001', date: '2025-04-10', event: 'Natural Breeding', sire: 'S-100', sireName: 'Duke', method: 'Natural', technician: '', expectedDue: '2026-01-05', cost: 0, notes: '', status: 'Confirmed' }
]

const BREEDING_EVENTS = ['AI', 'Natural Breeding', 'Embryo Transfer', 'Heat Detection', 'Pregnancy Check', 'Calving', 'Abortion', 'Not Pregnant']
const BREEDING_METHODS = ['Artificial Insemination', 'Natural', 'Embryo Transfer', 'IVF']
const BREEDING_STATUS = ['Scheduled', 'Completed', 'Confirmed', 'Failed', 'Pending Confirmation']

// Heat cycle data by breed (in days)
const HEAT_CYCLE_DAYS = {
  // Cattle breeds
  'Holstein': 21,
  'Friesian': 21,
  'Jersey': 21,
  'Guernsey': 21,
  'Ayrshire': 21,
  'Brown Swiss': 21,
  'Angus': 21,
  'Hereford': 21,
  'Simmental': 21,
  'Charolais': 21,
  'Limousin': 21,
  // Pigs
  'Large White': 21,
  'Landrace': 21,
  'Duroc': 21,
  'Hampshire': 21,
  'Yorkshire': 21,
  'Berkshire': 21,
  'Chester White': 21,
  'Pietrain': 21,
  // Sheep
  'Merino': 17,
  'Dorper': 17,
  'Suffolk': 17,
  'Hampshire (Sheep)': 17,
  'Rambouillet': 17,
  'Katahdin': 17,
  // Goats
  'Boer': 21,
  'Saanen': 21,
  'Alpine': 21,
  'Nubian': 21,
  'Toggenburg': 21,
  'LaMancha': 21,
  // Default
  'default': 21
}

// Gestation period by species (in days)
const GESTATION_DAYS = {
  'Holstein': 280,
  'Friesian': 280,
  'Jersey': 279,
  'Guernsey': 283,
  'Ayrshire': 279,
  'Brown Swiss': 290,
  'Angus': 283,
  'Hereford': 285,
  'Simmental': 289,
  'Charolais': 289,
  'Limousin': 289,
  // Pigs
  'Large White': 114,
  'Landrace': 114,
  'Duroc': 114,
  'Hampshire': 114,
  'Yorkshire': 114,
  'Berkshire': 114,
  'Chester White': 114,
  'Pietrain': 114,
  // Sheep
  'Merino': 150,
  'Dorper': 150,
  'Suffolk': 147,
  'Hampshire (Sheep)': 147,
  'Rambouillet': 150,
  'Katahdin': 152,
  // Goats
  'Boer': 150,
  'Saanen': 150,
  'Alpine': 150,
  'Nubian': 150,
  'Toggenburg': 150,
  'LaMancha': 145,
  // Default cattle
  'default': 283
}

export default function AnimalBreeding({ animals }){
  const KEY = 'cattalytics:animal:breeding'
  const [items, setItems] = useState([])
  const [animalId, setAnimalId] = useState(animals && animals[0] ? animals[0].id : '')
  const [event, setEvent] = useState('AI')
  const [sire, setSire] = useState('')
  const [sireName, setSireName] = useState('')
  const [method, setMethod] = useState('Artificial Insemination')
  const [technician, setTechnician] = useState('')
  const [expectedDue, setExpectedDue] = useState('')
  const [returnToHeat, setReturnToHeat] = useState('')
  const [cost, setCost] = useState('')
  const [status, setStatus] = useState('Completed')
  const [notes, setNotes] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [filterAnimal, setFilterAnimal] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  // Calculate return to heat and due date when animal or event changes
  useEffect(() => {
    if (animalId && animals) {
      const animal = animals.find(a => a.id === animalId)
      if (animal && (event === 'AI' || event === 'Natural Breeding' || event === 'Heat Detection')) {
        calculateDates(animal.breed)
      }
    }
  }, [animalId, event, animals])

  function calculateDates(breed) {
    const today = new Date()
    
    // Calculate return to heat date
    const heatCycleDays = HEAT_CYCLE_DAYS[breed] || HEAT_CYCLE_DAYS['default']
    const returnDate = new Date(today)
    returnDate.setDate(returnDate.getDate() + heatCycleDays)
    setReturnToHeat(returnDate.toISOString().slice(0, 10))
    
    // Calculate expected due date for breeding events
    if (event === 'AI' || event === 'Natural Breeding') {
      const gestationDays = GESTATION_DAYS[breed] || GESTATION_DAYS['default']
      const dueDate = new Date(today)
      dueDate.setDate(dueDate.getDate() + gestationDays)
      setExpectedDue(dueDate.toISOString().slice(0, 10))
    }
  }

  useEffect(()=>{
    const raw = localStorage.getItem(KEY)
    if(raw) setItems(JSON.parse(raw))
    else setItems(SAMPLE)
  }, [])

  useEffect(()=> localStorage.setItem(KEY, JSON.stringify(items)), [items])

  function add(){
    if(!animalId || !event) {
      alert('Please select animal and breeding event')
      return
    }
    const id = 'BREED-' + Math.floor(1000 + Math.random()*9000)
    const newItem = {
      id,
      animalId,
      date: new Date().toISOString().slice(0,10),
      timestamp: new Date().toISOString(),
      event,
      sire: sire.trim(),
      sireName: sireName.trim(),
      method,
      technician: technician.trim(),
      expectedDue,
      returnToHeat,
      cost: parseFloat(cost) || 0,
      status,
      notes: notes.trim()
    }
    setItems([...items, newItem])
    setSire('')
    setSireName('')
    setTechnician('')
    setExpectedDue('')
    setReturnToHeat('')
    setCost('')
    setNotes('')
    setShowAddForm(false)
  }

  function remove(id){ if(!confirm('Delete record '+id+'?')) return; setItems(items.filter(i=>i.id!==id)) }

  const filteredItems = items.filter(item => {
    if(filterAnimal !== 'all' && item.animalId !== filterAnimal) return false
    if(filterStatus !== 'all' && item.status !== filterStatus) return false
    return true
  })

  const totalCost = filteredItems.reduce((sum, item) => sum + (item.cost || 0), 0)
  const pregnantAnimals = filteredItems.filter(item => 
    (item.status === 'Confirmed' || item.event === 'AI' || item.event === 'Natural Breeding') && 
    item.expectedDue && new Date(item.expectedDue) > new Date()
  )
  const upcomingCalvings = pregnantAnimals.filter(item => {
    const daysUntilDue = Math.floor((new Date(item.expectedDue) - new Date()) / (1000 * 60 * 60 * 24))
    return daysUntilDue <= 30 && daysUntilDue >= 0
  })

  return (
    <section>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3>🐑 Breeding & Reproduction</h3>
        <button onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? '✕ Cancel' : '+ Add Breeding Record'}
        </button>
      </div>

      {/* Summary Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 20 }}>
        <div className="card" style={{ padding: 16, background: '#f0fdf4' }}>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Total Breeding Events</div>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#059669' }}>{filteredItems.length}</div>
        </div>
        <div className="card" style={{ padding: 16, background: '#fef3c7' }}>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Pregnant Animals</div>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#f59e0b' }}>{pregnantAnimals.length}</div>
        </div>
        <div className="card" style={{ padding: 16, background: '#fee2e2' }}>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Due Within 30 Days</div>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#dc2626' }}>{upcomingCalvings.length}</div>
        </div>
        <div className="card" style={{ padding: 16, background: '#eff6ff' }}>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Total Cost</div>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#2563eb' }}>${totalCost.toFixed(2)}</div>
        </div>
      </div>

      {/* Upcoming Calvings Alert */}
      {upcomingCalvings.length > 0 && (
        <div className="card" style={{ padding: 16, marginBottom: 16, background: '#fef3c7', borderLeft: '4px solid #f59e0b' }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#92400e' }}>⚠️ Upcoming Calvings</h4>
          {upcomingCalvings.map(item => {
            const animal = (animals||[]).find(a => a.id === item.animalId)
            const daysUntilDue = Math.floor((new Date(item.expectedDue) - new Date()) / (1000 * 60 * 60 * 24))
            return (
              <div key={item.id} style={{ padding: '8px 0', borderBottom: '1px solid #fbbf24' }}>
                <strong>{animal?.name || animal?.tag || item.animalId}</strong> - Due in {daysUntilDue} days ({new Date(item.expectedDue).toLocaleDateString()})
                {item.sireName && <span style={{ color: '#666' }}> • Sire: {item.sireName}</span>}
              </div>
            )
          })}
        </div>
      )}

      {/* Upcoming Return to Heat Alert */}
      {(() => {
        const upcomingHeat = filteredItems.filter(item => {
          if (!item.returnToHeat) return false
          const daysUntilHeat = Math.floor((new Date(item.returnToHeat) - new Date()) / (1000 * 60 * 60 * 24))
          return daysUntilHeat >= 0 && daysUntilHeat <= 7
        })
        
        if (upcomingHeat.length === 0) return null
        
        return (
          <div className="card" style={{ padding: 16, marginBottom: 16, background: '#e0f2fe', borderLeft: '4px solid #0ea5e9' }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#075985' }}>🔔 Return to Heat Alert (Next 7 Days)</h4>
            {upcomingHeat.map(item => {
              const animal = (animals||[]).find(a => a.id === item.animalId)
              const daysUntilHeat = Math.floor((new Date(item.returnToHeat) - new Date()) / (1000 * 60 * 60 * 24))
              return (
                <div key={item.id} style={{ padding: '8px 0', borderBottom: '1px solid #7dd3fc' }}>
                  <strong>{animal?.name || animal?.tag || item.animalId}</strong> ({animal?.breed}) - 
                  {daysUntilHeat === 0 ? ' Today!' : ` in ${daysUntilHeat} day${daysUntilHeat > 1 ? 's' : ''}`} 
                  ({new Date(item.returnToHeat).toLocaleDateString()})
                </div>
              )
            })}
          </div>
        )
      })()}

      {/* Add Form */}
      {showAddForm && (
        <div className="card" style={{ padding: 20, marginBottom: 20 }}>
          <h4 style={{ marginTop: 0 }}>Add Breeding Record</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            <div>
              <label>Animal *</label>
              <select value={animalId} onChange={e => setAnimalId(e.target.value)}>
                <option value="">-- Select Animal --</option>
                {(animals||[]).filter(a => a.sex === 'F').map(a => (
                  <option key={a.id} value={a.id}>{a.name || a.tag} ({a.breed})</option>
                ))}
              </select>
            </div>
            <div>
              <label>Event Type *</label>
              <select value={event} onChange={e => setEvent(e.target.value)}>
                {BREEDING_EVENTS.map(evt => <option key={evt} value={evt}>{evt}</option>)}
              </select>
            </div>
            <div>
              <label>Sire ID</label>
              <input value={sire} onChange={e => setSire(e.target.value)} placeholder="e.g., S-101" />
            </div>
            <div>
              <label>Sire Name</label>
              <input value={sireName} onChange={e => setSireName(e.target.value)} placeholder="Bull name" />
            </div>
            <div>
              <label>Method</label>
              <select value={method} onChange={e => setMethod(e.target.value)}>
                {BREEDING_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label>Technician/Handler</label>
              <input value={technician} onChange={e => setTechnician(e.target.value)} placeholder="Name" />
            </div>
            <div>
              <label>Expected Due Date {(event === 'AI' || event === 'Natural Breeding') && '(Auto-calculated)'}</label>
              <input 
                type="date" 
                value={expectedDue} 
                onChange={e => setExpectedDue(e.target.value)} 
                title={animalId && animals ? `Based on ${animals.find(a => a.id === animalId)?.breed || 'breed'} gestation period` : ''}
              />
            </div>
            <div>
              <label>Return to Heat Date (Auto-calculated)</label>
              <input 
                type="date" 
                value={returnToHeat} 
                onChange={e => setReturnToHeat(e.target.value)}
                style={{ background: '#f0fdf4' }}
                title={animalId && animals ? `Based on ${animals.find(a => a.id === animalId)?.breed || 'breed'} heat cycle (${HEAT_CYCLE_DAYS[animals.find(a => a.id === animalId)?.breed] || HEAT_CYCLE_DAYS['default']} days)` : ''}
              />
            </div>
            <div>
              <label>Cost ($)</label>
              <input type="number" step="0.01" value={cost} onChange={e => setCost(e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <label>Status</label>
              <select value={status} onChange={e => setStatus(e.target.value)}>
                {BREEDING_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label>Notes</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Additional breeding notes..." />
            </div>
          </div>
          <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
            <button onClick={add}>Add Breeding Record</button>
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
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="all">All Statuses</option>
          {BREEDING_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {(filterAnimal !== 'all' || filterStatus !== 'all') && (
          <button onClick={() => { setFilterAnimal('all'); setFilterStatus('all') }}>Clear Filters</button>
        )}
      </div>

      {/* Records List */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {filteredItems.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🐑</div>
            <h4>No breeding records yet</h4>
            <p style={{ color: '#666' }}>Add your first breeding record to start tracking</p>
          </div>
        ) : (
          <div style={{ maxHeight: 600, overflowY: 'auto' }}>
            {filteredItems.sort((a, b) => new Date(b.timestamp || b.date) - new Date(a.timestamp || a.date)).map(item => {
              const animal = (animals||[]).find(a => a.id === item.animalId)
              const daysUntilDue = item.expectedDue ? Math.floor((new Date(item.expectedDue) - new Date()) / (1000 * 60 * 60 * 24)) : null
              const isPregnant = item.status === 'Confirmed' && daysUntilDue && daysUntilDue > 0
              
              return (
                <div key={item.id} style={{ padding: 16, borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 600, fontSize: 16 }}>{item.event}</span>
                      <span className="badge" style={{ background: item.status === 'Confirmed' ? '#d1fae5' : item.status === 'Failed' ? '#fee2e2' : '#e0f2fe' }}>{item.status}</span>
                      {isPregnant && <span className="badge" style={{ background: '#fef3c7' }}>🤰 Pregnant</span>}
                      {item.method && <span className="badge" style={{ background: '#f3e8ff' }}>{item.method}</span>}
                      {item.cost > 0 && <span className="badge" style={{ background: '#d1fae5' }}>${item.cost.toFixed(2)}</span>}
                    </div>
                    <div style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>
                      <strong>{animal?.name || animal?.tag || item.animalId}</strong> • {new Date(item.timestamp || item.date).toLocaleDateString()}
                    </div>
                    {item.sireName && (
                      <div style={{ fontSize: 13, color: '#666', marginBottom: 4 }}>
                        Sire: <strong>{item.sireName}</strong> {item.sire && `(${item.sire})`}
                      </div>
                    )}
                    {item.expectedDue && (
                      <div style={{ fontSize: 13, color: isPregnant ? '#059669' : '#666', marginBottom: 4 }}>
                        Expected Due: <strong>{new Date(item.expectedDue).toLocaleDateString()}</strong>
                        {daysUntilDue !== null && daysUntilDue > 0 && ` (${daysUntilDue} days)`}
                        {daysUntilDue !== null && daysUntilDue <= 0 && ' (Past due)'}
                      </div>
                    )}
                    {item.returnToHeat && (
                      <div style={{ fontSize: 13, color: '#666', marginBottom: 4 }}>
                        Return to Heat: <strong>{new Date(item.returnToHeat).toLocaleDateString()}</strong>
                        {(() => {
                          const daysUntilHeat = Math.floor((new Date(item.returnToHeat) - new Date()) / (1000 * 60 * 60 * 24))
                          if (daysUntilHeat > 0) return ` (in ${daysUntilHeat} days)`
                          if (daysUntilHeat === 0) return ' (Today!)'
                          return ' (Past due)'
                        })()}
                      </div>
                    )}
                    {item.technician && (
                      <div style={{ fontSize: 13, color: '#888' }}>Technician: {item.technician}</div>
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
    </section>
  )
}
