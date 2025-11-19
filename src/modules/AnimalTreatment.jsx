import React, { useEffect, useState } from 'react'

const SAMPLE = [
  { id: 'TREAT-001', animalId: 'A-001', date: '2025-06-01', timestamp: '2025-06-01T10:30:00', treatmentType: 'Hoof Care', treatment: 'Hoof trim', veterinarian: 'Dr. Smith', medication: '', dosage: '', cost: 50, duration: '', nextDue: '', status: 'Completed', severity: 'Routine', notes: 'Regular maintenance' },
  { id: 'TREAT-002', animalId: 'A-002', date: '2025-05-28', timestamp: '2025-05-28T14:00:00', treatmentType: 'Vaccination', treatment: 'Annual vaccination', veterinarian: 'Dr. Wilson', medication: 'Bovine Vaccine Mix', dosage: '2ml IM', cost: 25, duration: '', nextDue: '2026-05-28', status: 'Completed', severity: 'Preventive', notes: '' }
]

const TREATMENT_TYPES = ['Vaccination', 'Medication', 'Surgery', 'Hoof Care', 'Dental', 'Wound Care', 'Parasite Control', 'Disease Treatment', 'Preventive Care', 'Emergency', 'Other']
const TREATMENT_STATUS = ['Scheduled', 'In Progress', 'Completed', 'Follow-up Required', 'Cancelled']
const SEVERITY_LEVELS = ['Routine', 'Preventive', 'Minor', 'Moderate', 'Severe', 'Critical', 'Emergency']

export default function AnimalTreatment({ animals }){
  const KEY = 'cattalytics:animal:treatment'
  const [items, setItems] = useState([])
  const [animalId, setAnimalId] = useState(animals && animals[0] ? animals[0].id : '')
  const [treatmentType, setTreatmentType] = useState('Medication')
  const [treatment, setTreatment] = useState('')
  const [veterinarian, setVeterinarian] = useState('')
  const [medication, setMedication] = useState('')
  const [dosage, setDosage] = useState('')
  const [cost, setCost] = useState('')
  const [duration, setDuration] = useState('')
  const [nextDue, setNextDue] = useState('')
  const [status, setStatus] = useState('Completed')
  const [severity, setSeverity] = useState('Routine')
  const [notes, setNotes] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [filterAnimal, setFilterAnimal] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(()=>{
    const raw = localStorage.getItem(KEY)
    if(raw) setItems(JSON.parse(raw))
    else setItems(SAMPLE)
  }, [])

  useEffect(()=> localStorage.setItem(KEY, JSON.stringify(items)), [items])

  function add(){
    if(!animalId || !treatment.trim()) {
      alert('Please select animal and enter treatment description')
      return
    }
    const id = 'TREAT-' + Math.floor(1000 + Math.random()*9000)
    const newItem = {
      id,
      animalId,
      date: new Date().toISOString().slice(0,10),
      timestamp: new Date().toISOString(),
      treatmentType,
      treatment: treatment.trim(),
      veterinarian: veterinarian.trim(),
      medication: medication.trim(),
      dosage: dosage.trim(),
      cost: parseFloat(cost) || 0,
      duration: duration.trim(),
      nextDue,
      status,
      severity,
      notes: notes.trim()
    }
    setItems([...items, newItem])
    setTreatment('')
    setVeterinarian('')
    setMedication('')
    setDosage('')
    setCost('')
    setDuration('')
    setNextDue('')
    setNotes('')
    setShowAddForm(false)
  }

  function remove(id){ if(!confirm('Delete record '+id+'?')) return; setItems(items.filter(i=>i.id!==id)) }

  const filteredItems = items.filter(item => {
    if(filterAnimal !== 'all' && item.animalId !== filterAnimal) return false
    if(filterType !== 'all' && item.treatmentType !== filterType) return false
    if(filterStatus !== 'all' && item.status !== filterStatus) return false
    return true
  })

  const totalCost = filteredItems.reduce((sum, item) => sum + (item.cost || 0), 0)
  const upcomingTreatments = filteredItems.filter(item => {
    if(!item.nextDue) return false
    const daysUntil = Math.floor((new Date(item.nextDue) - new Date()) / (1000 * 60 * 60 * 24))
    return daysUntil <= 30 && daysUntil >= 0
  })
  const criticalCases = filteredItems.filter(item => 
    item.severity === 'Critical' || item.severity === 'Emergency' || item.severity === 'Severe'
  )
  const pendingFollowups = filteredItems.filter(item => item.status === 'Follow-up Required')

  // Treatment type summary
  const treatmentSummary = {}
  filteredItems.forEach(item => {
    if(!treatmentSummary[item.treatmentType]) {
      treatmentSummary[item.treatmentType] = { count: 0, cost: 0 }
    }
    treatmentSummary[item.treatmentType].count += 1
    treatmentSummary[item.treatmentType].cost += item.cost || 0
  })

  return (
    <section>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3>💊 Treatments & Medical Records</h3>
        <button onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? '✕ Cancel' : '+ Add Treatment Record'}
        </button>
      </div>

      {/* Summary Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 20 }}>
        <div className="card" style={{ padding: 16, background: '#f0fdf4' }}>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Total Treatments</div>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#059669' }}>{filteredItems.length}</div>
        </div>
        <div className="card" style={{ padding: 16, background: '#fee2e2' }}>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Critical Cases</div>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#dc2626' }}>{criticalCases.length}</div>
        </div>
        <div className="card" style={{ padding: 16, background: '#fef3c7' }}>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Upcoming (30 days)</div>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#f59e0b' }}>{upcomingTreatments.length}</div>
        </div>
        <div className="card" style={{ padding: 16, background: '#e0f2fe' }}>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Pending Follow-ups</div>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#0284c7' }}>{pendingFollowups.length}</div>
        </div>
        <div className="card" style={{ padding: 16, background: '#eff6ff' }}>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Total Cost</div>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#2563eb' }}>${totalCost.toFixed(2)}</div>
        </div>
      </div>

      {/* Alerts */}
      {(upcomingTreatments.length > 0 || pendingFollowups.length > 0 || criticalCases.length > 0) && (
        <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {criticalCases.filter(item => item.status !== 'Completed').length > 0 && (
            <div className="card" style={{ padding: 16, background: '#fee2e2', borderLeft: '4px solid #dc2626' }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#7f1d1d' }}>🚨 Critical Cases Requiring Attention</h4>
              {criticalCases.filter(item => item.status !== 'Completed').map(item => {
                const animal = (animals||[]).find(a => a.id === item.animalId)
                return (
                  <div key={item.id} style={{ padding: '8px 0', borderBottom: '1px solid #fecaca' }}>
                    <strong>{animal?.name || animal?.tag || item.animalId}</strong> - {item.treatment} ({item.severity})
                  </div>
                )
              })}
            </div>
          )}
          
          {upcomingTreatments.length > 0 && (
            <div className="card" style={{ padding: 16, background: '#fef3c7', borderLeft: '4px solid #f59e0b' }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#92400e' }}>⚠️ Upcoming Treatments</h4>
              {upcomingTreatments.map(item => {
                const animal = (animals||[]).find(a => a.id === item.animalId)
                const daysUntil = Math.floor((new Date(item.nextDue) - new Date()) / (1000 * 60 * 60 * 24))
                return (
                  <div key={item.id} style={{ padding: '8px 0', borderBottom: '1px solid #fbbf24' }}>
                    <strong>{animal?.name || animal?.tag || item.animalId}</strong> - {item.treatment} (Due in {daysUntil} days - {new Date(item.nextDue).toLocaleDateString()})
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Add Form */}
      {showAddForm && (
        <div className="card" style={{ padding: 20, marginBottom: 20 }}>
          <h4 style={{ marginTop: 0 }}>Add Treatment Record</h4>
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
              <label>Treatment Type *</label>
              <select value={treatmentType} onChange={e => setTreatmentType(e.target.value)}>
                {TREATMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label>Severity Level</label>
              <select value={severity} onChange={e => setSeverity(e.target.value)}>
                {SEVERITY_LEVELS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: 'span 3' }}>
              <label>Treatment Description *</label>
              <input value={treatment} onChange={e => setTreatment(e.target.value)} placeholder="e.g., Administered antibiotic for respiratory infection" />
            </div>
            <div>
              <label>Veterinarian/Handler</label>
              <input value={veterinarian} onChange={e => setVeterinarian(e.target.value)} placeholder="Dr. Smith" />
            </div>
            <div>
              <label>Medication</label>
              <input value={medication} onChange={e => setMedication(e.target.value)} placeholder="e.g., Penicillin" />
            </div>
            <div>
              <label>Dosage</label>
              <input value={dosage} onChange={e => setDosage(e.target.value)} placeholder="e.g., 5ml IM" />
            </div>
            <div>
              <label>Cost ($)</label>
              <input type="number" step="0.01" value={cost} onChange={e => setCost(e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <label>Treatment Duration</label>
              <input value={duration} onChange={e => setDuration(e.target.value)} placeholder="e.g., 7 days" />
            </div>
            <div>
              <label>Next Due Date</label>
              <input type="date" value={nextDue} onChange={e => setNextDue(e.target.value)} />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label>Status</label>
              <select value={status} onChange={e => setStatus(e.target.value)}>
                {TREATMENT_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: 'span 3' }}>
              <label>Notes</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Additional medical notes, observations, or instructions..." />
            </div>
          </div>
          <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
            <button onClick={add}>Add Treatment Record</button>
            <button onClick={() => setShowAddForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <select value={filterAnimal} onChange={e => setFilterAnimal(e.target.value)}>
          <option value="all">All Animals</option>
          {(animals||[]).map(a => <option key={a.id} value={a.id}>{a.name || a.tag}</option>)}
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="all">All Types</option>
          {TREATMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="all">All Statuses</option>
          {TREATMENT_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {(filterAnimal !== 'all' || filterType !== 'all' || filterStatus !== 'all') && (
          <button onClick={() => { setFilterAnimal('all'); setFilterType('all'); setFilterStatus('all') }}>Clear Filters</button>
        )}
      </div>

      {/* Treatment Summary */}
      {Object.keys(treatmentSummary).length > 0 && (
        <div className="card" style={{ padding: 16, marginBottom: 16, background: '#f9fafb' }}>
          <h4 style={{ margin: '0 0 12px 0' }}>Treatment Summary by Type</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            {Object.entries(treatmentSummary).map(([type, data]) => (
              <div key={type} style={{ padding: 12, background: 'white', borderRadius: 6 }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{type}</div>
                <div style={{ fontSize: 13, color: '#666' }}>
                  {data.count} treatments • ${data.cost.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Records List */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {filteredItems.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>💊</div>
            <h4>No treatment records yet</h4>
            <p style={{ color: '#666' }}>Add your first treatment record to start tracking</p>
          </div>
        ) : (
          <div style={{ maxHeight: 600, overflowY: 'auto' }}>
            {filteredItems.sort((a, b) => new Date(b.timestamp || b.date) - new Date(a.timestamp || a.date)).map(item => {
              const animal = (animals||[]).find(a => a.id === item.animalId)
              const severityColor = item.severity === 'Critical' || item.severity === 'Emergency' ? '#dc2626' : 
                                   item.severity === 'Severe' ? '#f59e0b' : 
                                   item.severity === 'Preventive' ? '#059669' : '#6b7280'
              
              return (
                <div key={item.id} style={{ padding: 16, borderBottom: '1px solid #eee', borderLeft: `4px solid ${severityColor}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 600, fontSize: 16 }}>{item.treatment}</span>
                        <span className="badge" style={{ background: '#e0f2fe' }}>{item.treatmentType}</span>
                        <span className="badge" style={{ 
                          background: item.status === 'Completed' ? '#d1fae5' : 
                                     item.status === 'Follow-up Required' ? '#fef3c7' : 
                                     item.status === 'In Progress' ? '#dbeafe' : '#f3f4f6',
                          color: item.status === 'Completed' ? '#059669' :
                                item.status === 'Follow-up Required' ? '#f59e0b' :
                                item.status === 'In Progress' ? '#0284c7' : '#6b7280'
                        }}>{item.status}</span>
                        <span className="badge" style={{ background: '#fee2e2', color: severityColor }}>{item.severity}</span>
                        {item.cost > 0 && <span className="badge" style={{ background: '#d1fae5' }}>${item.cost.toFixed(2)}</span>}
                      </div>
                      <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>
                        <strong>{animal?.name || animal?.tag || item.animalId}</strong> • {new Date(item.timestamp || item.date).toLocaleDateString()}
                        {item.veterinarian && ` • ${item.veterinarian}`}
                      </div>
                      {item.medication && (
                        <div style={{ fontSize: 13, color: '#666', marginBottom: 4 }}>
                          <strong>Medication:</strong> {item.medication} {item.dosage && `(${item.dosage})`}
                        </div>
                      )}
                      {item.duration && (
                        <div style={{ fontSize: 13, color: '#666', marginBottom: 4 }}>
                          <strong>Duration:</strong> {item.duration}
                        </div>
                      )}
                      {item.nextDue && (
                        <div style={{ fontSize: 13, color: '#059669', marginBottom: 4 }}>
                          <strong>Next Due:</strong> {new Date(item.nextDue).toLocaleDateString()}
                        </div>
                      )}
                      {item.notes && (
                        <div style={{ fontSize: 13, color: '#888', marginTop: 8, padding: 8, background: '#f9fafb', borderRadius: 4 }}>
                          {item.notes}
                        </div>
                      )}
                    </div>
                    <button className="tab-btn" style={{ color: '#dc2626' }} onClick={() => remove(item.id)}>🗑️</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
