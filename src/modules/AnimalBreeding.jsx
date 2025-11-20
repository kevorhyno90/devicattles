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
  const SEMEN_KEY = 'cattalytics:semen:inventory'
  const [items, setItems] = useState([])
  const [semenInventory, setSemenInventory] = useState([])
  const [activeTab, setActiveTab] = useState('breeding')
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

  // Semen inventory form
  const [semenForm, setSemenForm] = useState({
    id: '', bullName: '', bullId: '', breed: '', supplier: '', 
    batchNumber: '', productionDate: '', straws: '', 
    location: 'Semen Tank', quality: 'Premium', price: '', notes: ''
  })
  const [editingSemenId, setEditingSemenId] = useState(null)
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

  // Semen inventory functions
  function syncToMainInventory() {
    try {
      const mainInventory = JSON.parse(localStorage.getItem('cattalytics:inventory') || '[]')
      
      // Remove old semen entries
      const filteredInventory = mainInventory.filter(item => item.source !== 'semen-breeding')
      
      // Add current semen inventory as supplies
      const semenSupplies = semenInventory.map(semen => ({
        id: `SEMEN-${semen.id}`,
        name: `${semen.bullName} (${semen.breed}) Semen`,
        category: 'Supplies',
        subcategory: 'Breeding',
        quantity: semen.straws || 0,
        unit: 'straws',
        unitCost: parseFloat(semen.price) || 0,
        totalValue: (semen.straws || 0) * (parseFloat(semen.price) || 0),
        location: semen.location || 'Semen Tank',
        supplier: semen.supplier || '',
        lastOrdered: semen.productionDate || '',
        reorderPoint: 10,
        reorderQuantity: 50,
        expiryDate: '',
        batchNumber: semen.batchNumber || '',
        quality: semen.quality || 'Premium',
        notes: `Bull ID: ${semen.bullId} | ${semen.notes || ''}`,
        source: 'semen-breeding'
      }))
      
      const updatedInventory = [...filteredInventory, ...semenSupplies]
      localStorage.setItem('cattalytics:inventory', JSON.stringify(updatedInventory))
      window.dispatchEvent(new Event('inventoryUpdated'))
    } catch (e) {
      console.error('Failed to sync semen inventory:', e)
    }
  }

  function saveSemen(e) {
    e.preventDefault()
    if (!semenForm.bullName || !semenForm.breed || !semenForm.straws) {
      alert('Please fill in bull name, breed, and number of straws')
      return
    }

    if (editingSemenId) {
      setSemenInventory(semenInventory.map(s => s.id === editingSemenId ? { ...semenForm, id: editingSemenId } : s))
      setEditingSemenId(null)
    } else {
      const newSemen = { ...semenForm, id: `SEM-${Date.now()}`, dateAdded: new Date().toISOString().split('T')[0] }
      setSemenInventory([...semenInventory, newSemen])
    }
    
    setSemenForm({ id: '', bullName: '', bullId: '', breed: '', supplier: '', batchNumber: '', productionDate: '', straws: '', location: 'Semen Tank', quality: 'Premium', price: '', notes: '' })
  }

  function editSemen(semen) {
    setSemenForm(semen)
    setEditingSemenId(semen.id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function deleteSemen(id) {
    if (!confirm('Delete this semen record?')) return
    setSemenInventory(semenInventory.filter(s => s.id !== id))
  }

  function useSemen(semenId, strawsUsed) {
    const used = parseInt(strawsUsed) || 1
    setSemenInventory(semenInventory.map(s => {
      if (s.id === semenId) {
        const newStraws = Math.max(0, (parseInt(s.straws) || 0) - used)
        return { ...s, straws: newStraws }
      }
      return s
    }))
  }

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
        <h2>🐄 Breeding Management</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={()=>setShowAddForm(!showAddForm)} className={showAddForm ? 'secondary' : ''} disabled={activeTab !== 'breeding'}>
            {showAddForm ? 'Cancel' : '+ Add Breeding Record'}
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '2px solid var(--border-color)', paddingBottom: '8px' }}>
        <button 
          onClick={() => setActiveTab('breeding')} 
          className={`tab-btn ${activeTab === 'breeding' ? 'active' : ''}`}
          style={{ padding: '8px 16px', background: activeTab === 'breeding' ? 'var(--green)' : 'transparent', color: activeTab === 'breeding' ? '#fff' : 'inherit' }}
        >
          🐄 Breeding Records
        </button>
        <button 
          onClick={() => setActiveTab('semen')} 
          className={`tab-btn ${activeTab === 'semen' ? 'active' : ''}`}
          style={{ padding: '8px 16px', background: activeTab === 'semen' ? 'var(--green)' : 'transparent', color: activeTab === 'semen' ? '#fff' : 'inherit' }}
        >
          🧪 Semen Inventory
        </button>
      </div>

      {/* Breeding Records Tab */}
      {activeTab === 'breeding' && (
        <>
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
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#2563eb' }}>KSH {totalCost.toLocaleString()}</div>
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
              <label>Cost (KSH)</label>
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
                      {item.cost > 0 && <span className="badge" style={{ background: '#d1fae5' }}>KSH {Number(item.cost).toLocaleString()}</span>}
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
      </>
      )}

      {/* Semen Inventory Tab */}
      {activeTab === 'semen' && (
        <>
          {/* Add/Edit Form */}
          <div className="card" style={{ padding: '16px', marginBottom: '16px' }}>
            <h3 style={{ marginBottom: '16px' }}>
              {editingSemenId ? 'Edit Semen Record' : 'Add Semen to Inventory'}
            </h3>
            <form onSubmit={saveSemen} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              <label>
                Bull Name *
                <input
                  type="text"
                  value={semenForm.bullName}
                  onChange={e => setSemenForm({ ...semenForm, bullName: e.target.value })}
                  placeholder="e.g., Prime Bull"
                  required
                />
              </label>
              <label>
                Bull ID
                <input
                  type="text"
                  value={semenForm.bullId}
                  onChange={e => setSemenForm({ ...semenForm, bullId: e.target.value })}
                  placeholder="e.g., B-001"
                />
              </label>
              <label>
                Breed *
                <input
                  type="text"
                  value={semenForm.breed}
                  onChange={e => setSemenForm({ ...semenForm, breed: e.target.value })}
                  placeholder="e.g., Holstein"
                  required
                />
              </label>
              <label>
                Supplier
                <input
                  type="text"
                  value={semenForm.supplier}
                  onChange={e => setSemenForm({ ...semenForm, supplier: e.target.value })}
                  placeholder="e.g., National Breeding Center"
                />
              </label>
              <label>
                Batch Number
                <input
                  type="text"
                  value={semenForm.batchNumber}
                  onChange={e => setSemenForm({ ...semenForm, batchNumber: e.target.value })}
                  placeholder="e.g., BATCH-2025-001"
                />
              </label>
              <label>
                Production Date
                <input
                  type="date"
                  value={semenForm.productionDate}
                  onChange={e => setSemenForm({ ...semenForm, productionDate: e.target.value })}
                />
              </label>
              <label>
                Number of Straws *
                <input
                  type="number"
                  value={semenForm.straws}
                  onChange={e => setSemenForm({ ...semenForm, straws: e.target.value })}
                  placeholder="0"
                  min="0"
                  required
                />
              </label>
              <label>
                Price per Straw (KSH)
                <input
                  type="number"
                  step="0.01"
                  value={semenForm.price}
                  onChange={e => setSemenForm({ ...semenForm, price: e.target.value })}
                  placeholder="0.00"
                  min="0"
                />
              </label>
              <label>
                Storage Location
                <select
                  value={semenForm.location}
                  onChange={e => setSemenForm({ ...semenForm, location: e.target.value })}
                >
                  <option value="Semen Tank">Semen Tank</option>
                  <option value="Liquid Nitrogen Tank 1">Liquid Nitrogen Tank 1</option>
                  <option value="Liquid Nitrogen Tank 2">Liquid Nitrogen Tank 2</option>
                  <option value="Cold Storage">Cold Storage</option>
                  <option value="Main Facility">Main Facility</option>
                </select>
              </label>
              <label>
                Quality
                <select
                  value={semenForm.quality}
                  onChange={e => setSemenForm({ ...semenForm, quality: e.target.value })}
                >
                  <option value="Premium">Premium</option>
                  <option value="Standard">Standard</option>
                  <option value="Economy">Economy</option>
                  <option value="Tested">Tested</option>
                </select>
              </label>
              <label style={{ gridColumn: '1 / -1' }}>
                Notes
                <textarea
                  value={semenForm.notes}
                  onChange={e => setSemenForm({ ...semenForm, notes: e.target.value })}
                  placeholder="Additional information about this semen..."
                  rows="2"
                />
              </label>
              <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '8px' }}>
                <button type="submit">{editingSemenId ? 'Update' : 'Add'} Semen</button>
                {editingSemenId && (
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => {
                      setSemenForm({ id: '', bullName: '', bullId: '', breed: '', supplier: '', batchNumber: '', productionDate: '', straws: '', location: 'Semen Tank', quality: 'Premium', price: '', notes: '' })
                      setEditingSemenId(null)
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Summary Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 16 }}>
            <div className="card" style={{ padding: 16, background: '#f0fdf4' }}>
              <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Total Bulls</div>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#059669' }}>{semenInventory.length}</div>
            </div>
            <div className="card" style={{ padding: 16, background: '#eff6ff' }}>
              <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Total Straws</div>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#2563eb' }}>
                {semenInventory.reduce((sum, s) => sum + (parseInt(s.straws) || 0), 0)}
              </div>
            </div>
            <div className="card" style={{ padding: 16, background: '#fef3c7' }}>
              <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Total Value</div>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#d97706' }}>
                KSH {semenInventory.reduce((sum, s) => sum + ((parseInt(s.straws) || 0) * (parseFloat(s.price) || 0)), 0).toLocaleString()}
              </div>
            </div>
            <div className="card" style={{ padding: 16, background: '#fee2e2' }}>
              <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Low Stock</div>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#dc2626' }}>
                {semenInventory.filter(s => (parseInt(s.straws) || 0) < 10).length}
              </div>
            </div>
          </div>

          {/* Inventory List */}
          <div className="card" style={{ padding: '16px' }}>
            <h3 style={{ marginBottom: '16px' }}>Semen Inventory ({semenInventory.length})</h3>
            {semenInventory.length === 0 ? (
              <div className="muted" style={{ textAlign: 'center', padding: '32px' }}>
                No semen inventory records. Add your first entry above.
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '12px' }}>
                {semenInventory.map(semen => {
                  const totalValue = (parseInt(semen.straws) || 0) * (parseFloat(semen.price) || 0)
                  const isLowStock = (parseInt(semen.straws) || 0) < 10
                  
                  return (
                    <div key={semen.id} className="card" style={{ padding: '12px', background: isLowStock ? '#fef2f2' : '#f9fafb' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                        <div>
                          <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '4px' }}>
                            {semen.bullName} {semen.bullId && `(${semen.bullId})`}
                          </div>
                          <div style={{ fontSize: '14px', color: '#666' }}>
                            {semen.breed} • Batch: {semen.batchNumber || 'N/A'}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            onClick={() => editSemen(semen)}
                            style={{ padding: '4px 8px', fontSize: '12px' }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteSemen(semen.id)}
                            className="secondary"
                            style={{ padding: '4px 8px', fontSize: '12px' }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '8px', fontSize: '13px', marginTop: '8px' }}>
                        <div>
                          <strong>Straws Available:</strong> 
                          <span style={{ marginLeft: '4px', color: isLowStock ? '#dc2626' : '#059669', fontWeight: 'bold' }}>
                            {semen.straws} {isLowStock && '⚠️'}
                          </span>
                        </div>
                        <div><strong>Location:</strong> {semen.location}</div>
                        <div><strong>Quality:</strong> {semen.quality}</div>
                        {semen.price && <div><strong>Price/Straw:</strong> KSH {parseFloat(semen.price).toLocaleString()}</div>}
                        {semen.price && <div><strong>Total Value:</strong> KSH {totalValue.toLocaleString()}</div>}
                        {semen.supplier && <div><strong>Supplier:</strong> {semen.supplier}</div>}
                        {semen.productionDate && <div><strong>Production:</strong> {semen.productionDate}</div>}
                      </div>
                      {semen.notes && (
                        <div style={{ marginTop: '8px', fontSize: '13px', color: '#666', fontStyle: 'italic' }}>
                          {semen.notes}
                        </div>
                      )}
                      <div style={{ marginTop: '12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button
                          onClick={() => {
                            const used = prompt('How many straws were used?', '1')
                            if (used && !isNaN(used)) useSemen(semen.id, used)
                          }}
                          style={{ padding: '6px 12px', fontSize: '12px', background: '#3b82f6', color: '#fff' }}
                        >
                          Use Straws
                        </button>
                        <button
                          onClick={() => {
                            const add = prompt('How many straws to add?', '10')
                            if (add && !isNaN(add)) {
                              setSemenInventory(semenInventory.map(s => 
                                s.id === semen.id ? { ...s, straws: (parseInt(s.straws) || 0) + parseInt(add) } : s
                              ))
                            }
                          }}
                          style={{ padding: '6px 12px', fontSize: '12px', background: '#059669', color: '#fff' }}
                        >
                          Restock
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}
    </section>
  )
}
