import React, { useState, useEffect } from 'react'
import { formatCurrency } from '../lib/currency'

const SAMPLE_CALVES = [
  { id: 'CALF-001', tag: 'CALF-101', name: 'Daisy Jr.', damId: 'A-001', damName: 'Bessie', sireId: 'S-101', sireName: 'Premium Bull', dob: '2025-10-15', sex: 'F', breed: 'Holstein', birthWeight: 38, currentWeight: 45, weaningDate: '', weaningWeight: '', healthStatus: 'Healthy', housingType: 'Individual Pen', notes: '', colostrumIntake: 'Adequate', navelTreatment: 'Done', vaccination: [], dehorning: '', castration: 'N/A' },
  { id: 'CALF-002', tag: 'CALF-102', name: 'Thunder', damId: 'A-002', damName: 'Molly', sireId: 'S-100', sireName: 'Duke', dob: '2025-09-20', sex: 'M', breed: 'Jersey', birthWeight: 32, currentWeight: 55, weaningDate: '2025-11-20', weaningWeight: 75, healthStatus: 'Healthy', housingType: 'Group Pen', notes: 'Strong calf', colostrumIntake: 'Adequate', navelTreatment: 'Done', vaccination: ['Brucella'], dehorning: '2025-10-05', castration: '2025-10-10' }
]

const HEALTH_STATUS = ['Healthy', 'Sick', 'Under Treatment', 'Quarantine', 'Recovered']
const HOUSING_TYPES = ['Individual Pen', 'Group Pen', 'Hutch', 'Barn', 'Free Range']
const COLOSTRUM_INTAKE = ['Adequate', 'Insufficient', 'Unknown', 'Bottle Fed', 'Tube Fed']
const FEEDING_METHODS = ['Bottle', 'Bucket', 'Nursing', 'Automatic Feeder']

export default function CalfManagement({ animals }) {
  const KEY = 'cattalytics:calf:management'
  const FEEDING_KEY = 'cattalytics:calf:feeding'
  const HEALTH_KEY = 'cattalytics:calf:health'
  
  const [calves, setCalves] = useState([])
  const [feedingRecords, setFeedingRecords] = useState([])
  const [healthRecords, setHealthRecords] = useState([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedCalf, setSelectedCalf] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  
  // Form states
  const [formData, setFormData] = useState({
    tag: '', name: '', damId: '', damName: '', sireId: '', sireName: '',
    dob: '', sex: 'F', breed: '', birthWeight: '', currentWeight: '',
    weaningDate: '', weaningWeight: '', healthStatus: 'Healthy',
    housingType: 'Individual Pen', colostrumIntake: 'Adequate',
    navelTreatment: '', vaccination: [], dehorning: '', castration: 'N/A',
    notes: ''
  })
  
  // Feeding form
  const [feedingForm, setFeedingForm] = useState({
    calfId: '', date: new Date().toISOString().slice(0, 10),
    feedType: 'Milk Replacer', quantity: '', method: 'Bottle',
    temperature: '', notes: ''
  })
  
  // Health form
  const [healthForm, setHealthForm] = useState({
    calfId: '', date: new Date().toISOString().slice(0, 10),
    type: 'Vaccination', treatment: '', diagnosis: '',
    medication: '', dosage: '', veterinarian: '', cost: '', nextVisit: '', notes: ''
  })

  useEffect(() => {
    const raw = localStorage.getItem(KEY)
    if (raw) setCalves(JSON.parse(raw))
    else setCalves(SAMPLE_CALVES)
    
    const feedingRaw = localStorage.getItem(FEEDING_KEY)
    if (feedingRaw) setFeedingRecords(JSON.parse(feedingRaw))
    
    const healthRaw = localStorage.getItem(HEALTH_KEY)
    if (healthRaw) setHealthRecords(JSON.parse(healthRaw))
  }, [])

  useEffect(() => localStorage.setItem(KEY, JSON.stringify(calves)), [calves])
  useEffect(() => localStorage.setItem(FEEDING_KEY, JSON.stringify(feedingRecords)), [feedingRecords])
  useEffect(() => localStorage.setItem(HEALTH_KEY, JSON.stringify(healthRecords)), [healthRecords])

  function addCalf() {
    if (!formData.tag || !formData.dob) {
      alert('Please provide tag and date of birth')
      return
    }
    const id = 'CALF-' + Date.now()
    const newCalf = { ...formData, id, vaccination: formData.vaccination || [] }
    setCalves([...calves, newCalf])
    resetForm()
    setShowAddForm(false)
  }

  function updateCalf(id, updates) {
    setCalves(calves.map(c => c.id === id ? { ...c, ...updates } : c))
  }

  function deleteCalf(id) {
    if (!confirm('Delete this calf record?')) return
    setCalves(calves.filter(c => c.id !== id))
    if (selectedCalf?.id === id) setSelectedCalf(null)
  }

  function addFeeding() {
    if (!feedingForm.calfId || !feedingForm.quantity) {
      alert('Please select calf and enter quantity')
      return
    }
    const id = 'FEED-' + Date.now()
    setFeedingRecords([...feedingRecords, { ...feedingForm, id, timestamp: new Date().toISOString() }])
    setFeedingForm({ ...feedingForm, quantity: '', notes: '' })
  }

  function addHealth() {
    if (!healthForm.calfId || !healthForm.type) {
      alert('Please select calf and type')
      return
    }
    const id = 'HEALTH-' + Date.now()
    setHealthRecords([...healthRecords, { ...healthForm, id, timestamp: new Date().toISOString() }])
    setHealthForm({ ...healthForm, treatment: '', medication: '', dosage: '', cost: '', notes: '' })
  }

  function resetForm() {
    setFormData({
      tag: '', name: '', damId: '', damName: '', sireId: '', sireName: '',
      dob: '', sex: 'F', breed: '', birthWeight: '', currentWeight: '',
      weaningDate: '', weaningWeight: '', healthStatus: 'Healthy',
      housingType: 'Individual Pen', colostrumIntake: 'Adequate',
      navelTreatment: '', vaccination: [], dehorning: '', castration: 'N/A',
      notes: ''
    })
  }

  const activeCalves = calves.filter(c => !c.weaningDate || new Date(c.weaningDate) > new Date())
  const weanedCalves = calves.filter(c => c.weaningDate && new Date(c.weaningDate) <= new Date())
  const avgBirthWeight = calves.length ? calves.reduce((sum, c) => sum + (parseFloat(c.birthWeight) || 0), 0) / calves.length : 0
  const sickCalves = calves.filter(c => c.healthStatus === 'Sick' || c.healthStatus === 'Under Treatment')

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3>🐮 Calf Management System</h3>
        <button onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? '✕ Cancel' : '+ Add Calf'}
        </button>
      </div>

      {/* Summary Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 20 }}>
        <div className="card" style={{ padding: 16, background: '#f0fdf4' }}>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Active Calves</div>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#059669' }}>{activeCalves.length}</div>
        </div>
        <div className="card" style={{ padding: 16, background: '#eff6ff' }}>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Weaned Calves</div>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#2563eb' }}>{weanedCalves.length}</div>
        </div>
        <div className="card" style={{ padding: 16, background: '#fee2e2' }}>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Sick/Under Treatment</div>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#dc2626' }}>{sickCalves.length}</div>
        </div>
        <div className="card" style={{ padding: 16, background: '#fef3c7' }}>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Avg Birth Weight</div>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#f59e0b' }}>{avgBirthWeight.toFixed(1)} kg</div>
        </div>
      </div>

      {/* Add Calf Form */}
      {showAddForm && (
        <div className="card" style={{ padding: 20, marginBottom: 20 }}>
          <h4 style={{ marginTop: 0 }}>Add New Calf</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <div>
              <label>Tag/ID *</label>
              <input value={formData.tag} onChange={e => setFormData({ ...formData, tag: e.target.value })} placeholder="CALF-101" />
            </div>
            <div>
              <label>Name</label>
              <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Calf name" />
            </div>
            <div>
              <label>Date of Birth *</label>
              <input type="date" value={formData.dob} onChange={e => setFormData({ ...formData, dob: e.target.value })} />
            </div>
            <div>
              <label>Sex</label>
              <select value={formData.sex} onChange={e => setFormData({ ...formData, sex: e.target.value })}>
                <option value="F">Female</option>
                <option value="M">Male</option>
              </select>
            </div>
            <div>
              <label>Breed</label>
              <input value={formData.breed} onChange={e => setFormData({ ...formData, breed: e.target.value })} placeholder="Holstein" />
            </div>
            <div>
              <label>Birth Weight (kg)</label>
              <input type="number" step="0.1" value={formData.birthWeight} onChange={e => setFormData({ ...formData, birthWeight: e.target.value })} />
            </div>
            <div>
              <label>Dam (Mother)</label>
              <select value={formData.damId} onChange={e => {
                const dam = animals?.find(a => a.id === e.target.value)
                setFormData({ ...formData, damId: e.target.value, damName: dam?.name || dam?.tag || '' })
              }}>
                <option value="">-- Select Dam --</option>
                {(animals || []).filter(a => a.sex === 'F').map(a => (
                  <option key={a.id} value={a.id}>{a.name || a.tag} ({a.breed})</option>
                ))}
              </select>
            </div>
            <div>
              <label>Sire ID</label>
              <input value={formData.sireId} onChange={e => setFormData({ ...formData, sireId: e.target.value })} placeholder="S-101" />
            </div>
            <div>
              <label>Sire Name</label>
              <input value={formData.sireName} onChange={e => setFormData({ ...formData, sireName: e.target.value })} placeholder="Bull name" />
            </div>
            <div>
              <label>Health Status</label>
              <select value={formData.healthStatus} onChange={e => setFormData({ ...formData, healthStatus: e.target.value })}>
                {HEALTH_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label>Housing Type</label>
              <select value={formData.housingType} onChange={e => setFormData({ ...formData, housingType: e.target.value })}>
                {HOUSING_TYPES.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            <div>
              <label>Colostrum Intake</label>
              <select value={formData.colostrumIntake} onChange={e => setFormData({ ...formData, colostrumIntake: e.target.value })}>
                {COLOSTRUM_INTAKE.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label>Navel Treatment Date</label>
              <input type="date" value={formData.navelTreatment} onChange={e => setFormData({ ...formData, navelTreatment: e.target.value })} />
            </div>
            <div>
              <label>Dehorning Date</label>
              <input type="date" value={formData.dehorning} onChange={e => setFormData({ ...formData, dehorning: e.target.value })} />
            </div>
            <div>
              <label>Castration Date (if applicable)</label>
              <input type="date" value={formData.castration} onChange={e => setFormData({ ...formData, castration: e.target.value })} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label>Notes</label>
              <textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} rows={2} />
            </div>
          </div>
          <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
            <button onClick={addCalf}>Add Calf</button>
            <button onClick={() => setShowAddForm(false)} style={{ background: '#6b7280' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ marginBottom: 16, borderBottom: '2px solid #e5e7eb' }}>
        <button 
          onClick={() => setActiveTab('overview')} 
          style={{ 
            padding: '8px 16px', 
            border: 'none', 
            background: activeTab === 'overview' ? '#059669' : 'transparent',
            color: activeTab === 'overview' ? '#fff' : '#666',
            borderBottom: activeTab === 'overview' ? '2px solid #059669' : 'none',
            cursor: 'pointer'
          }}
        >Calves Overview</button>
        <button 
          onClick={() => setActiveTab('feeding')} 
          style={{ 
            padding: '8px 16px', 
            border: 'none', 
            background: activeTab === 'feeding' ? '#059669' : 'transparent',
            color: activeTab === 'feeding' ? '#fff' : '#666',
            borderBottom: activeTab === 'feeding' ? '2px solid #059669' : 'none',
            cursor: 'pointer'
          }}
        >Feeding Records</button>
        <button 
          onClick={() => setActiveTab('health')} 
          style={{ 
            padding: '8px 16px', 
            border: 'none', 
            background: activeTab === 'health' ? '#059669' : 'transparent',
            color: activeTab === 'health' ? '#fff' : '#666',
            borderBottom: activeTab === 'health' ? '2px solid #059669' : 'none',
            cursor: 'pointer'
          }}
        >Health Records</button>
      </div>

      {/* Calves Overview Tab */}
      {activeTab === 'overview' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {calves.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🐮</div>
              <h4>No calves recorded yet</h4>
              <p style={{ color: '#666' }}>Add your first calf to start tracking</p>
            </div>
          ) : (
            <div style={{ maxHeight: 600, overflowY: 'auto' }}>
              {calves.map(calf => {
                const ageInDays = Math.floor((new Date() - new Date(calf.dob)) / (1000 * 60 * 60 * 24))
                const ageInWeeks = Math.floor(ageInDays / 7)
                const isWeaned = calf.weaningDate && new Date(calf.weaningDate) <= new Date()
                
                return (
                  <div key={calf.id} style={{ padding: 16, borderBottom: '1px solid #eee' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 600, fontSize: 16 }}>{calf.name || calf.tag}</span>
                          <span className="badge">{calf.sex === 'F' ? '♀ Female' : '♂ Male'}</span>
                          <span className="badge" style={{ background: calf.healthStatus === 'Healthy' ? '#d1fae5' : '#fee2e2' }}>
                            {calf.healthStatus}
                          </span>
                          {isWeaned && <span className="badge" style={{ background: '#e0f2fe' }}>Weaned</span>}
                        </div>
                        <div style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>
                          <strong>Tag:</strong> {calf.tag} • <strong>Breed:</strong> {calf.breed} • <strong>Age:</strong> {ageInWeeks} weeks ({ageInDays} days)
                        </div>
                        <div style={{ fontSize: 13, color: '#666', marginBottom: 4 }}>
                          <strong>Dam:</strong> {calf.damName || calf.damId || 'Unknown'} • <strong>Sire:</strong> {calf.sireName || calf.sireId || 'Unknown'}
                        </div>
                        <div style={{ fontSize: 13, color: '#666', marginBottom: 4 }}>
                          <strong>Birth Weight:</strong> {calf.birthWeight} kg • <strong>Current Weight:</strong> {calf.currentWeight || 'Not recorded'} kg
                        </div>
                        <div style={{ fontSize: 13, color: '#666', marginBottom: 4 }}>
                          <strong>Housing:</strong> {calf.housingType} • <strong>Colostrum:</strong> {calf.colostrumIntake}
                        </div>
                        {calf.notes && (
                          <div style={{ fontSize: 13, color: '#888', marginTop: 8, fontStyle: 'italic' }}>{calf.notes}</div>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 4, flexDirection: 'column' }}>
                        <button onClick={() => setSelectedCalf(calf)} style={{ fontSize: 12, padding: '4px 8px' }}>View Details</button>
                        <button onClick={() => deleteCalf(calf.id)} style={{ fontSize: 12, padding: '4px 8px', background: '#dc2626' }}>Delete</button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Feeding Records Tab */}
      {activeTab === 'feeding' && (
        <div>
          <div className="card" style={{ padding: 16, marginBottom: 16 }}>
            <h4 style={{ marginTop: 0 }}>Add Feeding Record</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              <div>
                <label>Calf *</label>
                <select value={feedingForm.calfId} onChange={e => setFeedingForm({ ...feedingForm, calfId: e.target.value })}>
                  <option value="">-- Select Calf --</option>
                  {calves.map(c => <option key={c.id} value={c.id}>{c.name || c.tag}</option>)}
                </select>
              </div>
              <div>
                <label>Date</label>
                <input type="date" value={feedingForm.date} onChange={e => setFeedingForm({ ...feedingForm, date: e.target.value })} />
              </div>
              <div>
                <label>Feed Type</label>
                <input value={feedingForm.feedType} onChange={e => setFeedingForm({ ...feedingForm, feedType: e.target.value })} placeholder="Milk Replacer" />
              </div>
              <div>
                <label>Quantity (liters) *</label>
                <input type="number" step="0.1" value={feedingForm.quantity} onChange={e => setFeedingForm({ ...feedingForm, quantity: e.target.value })} />
              </div>
              <div>
                <label>Method</label>
                <select value={feedingForm.method} onChange={e => setFeedingForm({ ...feedingForm, method: e.target.value })}>
                  {FEEDING_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label>Temperature (°C)</label>
                <input type="number" step="0.1" value={feedingForm.temperature} onChange={e => setFeedingForm({ ...feedingForm, temperature: e.target.value })} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
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
                  const calf = calves.find(c => c.id === record.calfId)
                  return (
                    <div key={record.id} style={{ padding: 12, borderBottom: '1px solid #eee' }}>
                      <div style={{ fontWeight: 600 }}>{calf?.name || calf?.tag || record.calfId}</div>
                      <div style={{ fontSize: 13, color: '#666' }}>
                        {new Date(record.date).toLocaleDateString()} • {record.feedType} • {record.quantity}L • {record.method}
                        {record.temperature && ` • ${record.temperature}°C`}
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

      {/* Health Records Tab */}
      {activeTab === 'health' && (
        <div>
          <div className="card" style={{ padding: 16, marginBottom: 16 }}>
            <h4 style={{ marginTop: 0 }}>Add Health Record</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              <div>
                <label>Calf *</label>
                <select value={healthForm.calfId} onChange={e => setHealthForm({ ...healthForm, calfId: e.target.value })}>
                  <option value="">-- Select Calf --</option>
                  {calves.map(c => <option key={c.id} value={c.id}>{c.name || c.tag}</option>)}
                </select>
              </div>
              <div>
                <label>Date</label>
                <input type="date" value={healthForm.date} onChange={e => setHealthForm({ ...healthForm, date: e.target.value })} />
              </div>
              <div>
                <label>Type *</label>
                <select value={healthForm.type} onChange={e => setHealthForm({ ...healthForm, type: e.target.value })}>
                  <option value="Vaccination">Vaccination</option>
                  <option value="Treatment">Treatment</option>
                  <option value="Checkup">Checkup</option>
                  <option value="Deworming">Deworming</option>
                </select>
              </div>
              <div>
                <label>Treatment/Vaccine</label>
                <input value={healthForm.treatment} onChange={e => setHealthForm({ ...healthForm, treatment: e.target.value })} />
              </div>
              <div>
                <label>Diagnosis</label>
                <input value={healthForm.diagnosis} onChange={e => setHealthForm({ ...healthForm, diagnosis: e.target.value })} />
              </div>
              <div>
                <label>Medication</label>
                <input value={healthForm.medication} onChange={e => setHealthForm({ ...healthForm, medication: e.target.value })} />
              </div>
              <div>
                <label>Dosage</label>
                <input value={healthForm.dosage} onChange={e => setHealthForm({ ...healthForm, dosage: e.target.value })} />
              </div>
              <div>
                <label>Veterinarian</label>
                <input value={healthForm.veterinarian} onChange={e => setHealthForm({ ...healthForm, veterinarian: e.target.value })} />
              </div>
              <div>
                <label>Cost</label>
                <input type="number" step="0.01" value={healthForm.cost} onChange={e => setHealthForm({ ...healthForm, cost: e.target.value })} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label>Notes</label>
                <input value={healthForm.notes} onChange={e => setHealthForm({ ...healthForm, notes: e.target.value })} />
              </div>
            </div>
            <button onClick={addHealth} style={{ marginTop: 12 }}>Add Health Record</button>
          </div>

          <div className="card" style={{ padding: 0 }}>
            {healthRecords.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center' }}>
                <h4>No health records yet</h4>
              </div>
            ) : (
              <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                {healthRecords.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).map(record => {
                  const calf = calves.find(c => c.id === record.calfId)
                  return (
                    <div key={record.id} style={{ padding: 12, borderBottom: '1px solid #eee' }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ fontWeight: 600 }}>{calf?.name || calf?.tag || record.calfId}</span>
                        <span className="badge">{record.type}</span>
                        {record.cost && <span className="badge" style={{ background: '#d1fae5' }}>{formatCurrency(parseFloat(record.cost))}</span>}
                      </div>
                      <div style={{ fontSize: 13, color: '#666' }}>
                        {new Date(record.date).toLocaleDateString()} 
                        {record.treatment && ` • ${record.treatment}`}
                        {record.diagnosis && ` • ${record.diagnosis}`}
                      </div>
                      {record.medication && (
                        <div style={{ fontSize: 13, color: '#666' }}>
                          Medication: {record.medication} {record.dosage && `(${record.dosage})`}
                        </div>
                      )}
                      {record.veterinarian && <div style={{ fontSize: 12, color: '#888' }}>Vet: {record.veterinarian}</div>}
                      {record.notes && <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>{record.notes}</div>}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Calf Details Modal */}
      {selectedCalf && (
        <div className="drawer-overlay" onClick={() => setSelectedCalf(null)}>
          <div className="drawer" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3>{selectedCalf.name || selectedCalf.tag}</h3>
              <button onClick={() => setSelectedCalf(null)}>Close</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
              <div>
                <strong>Tag:</strong> {selectedCalf.tag}
              </div>
              <div>
                <strong>Sex:</strong> {selectedCalf.sex === 'F' ? 'Female' : 'Male'}
              </div>
              <div>
                <strong>Breed:</strong> {selectedCalf.breed}
              </div>
              <div>
                <strong>Date of Birth:</strong> {new Date(selectedCalf.dob).toLocaleDateString()}
              </div>
              <div>
                <strong>Dam:</strong> {selectedCalf.damName || selectedCalf.damId || 'Unknown'}
              </div>
              <div>
                <strong>Sire:</strong> {selectedCalf.sireName || selectedCalf.sireId || 'Unknown'}
              </div>
              <div>
                <strong>Birth Weight:</strong> {selectedCalf.birthWeight} kg
              </div>
              <div>
                <strong>Current Weight:</strong> {selectedCalf.currentWeight || 'Not recorded'} kg
              </div>
              <div>
                <strong>Health Status:</strong> {selectedCalf.healthStatus}
              </div>
              <div>
                <strong>Housing:</strong> {selectedCalf.housingType}
              </div>
              <div>
                <strong>Colostrum Intake:</strong> {selectedCalf.colostrumIntake}
              </div>
              <div>
                <strong>Navel Treatment:</strong> {selectedCalf.navelTreatment ? new Date(selectedCalf.navelTreatment).toLocaleDateString() : 'Not done'}
              </div>
              {selectedCalf.dehorning && (
                <div>
                  <strong>Dehorning:</strong> {new Date(selectedCalf.dehorning).toLocaleDateString()}
                </div>
              )}
              {selectedCalf.castration && selectedCalf.castration !== 'N/A' && (
                <div>
                  <strong>Castration:</strong> {new Date(selectedCalf.castration).toLocaleDateString()}
                </div>
              )}
              {selectedCalf.weaningDate && (
                <div>
                  <strong>Weaning Date:</strong> {new Date(selectedCalf.weaningDate).toLocaleDateString()}
                </div>
              )}
              {selectedCalf.weaningWeight && (
                <div>
                  <strong>Weaning Weight:</strong> {selectedCalf.weaningWeight} kg
                </div>
              )}
            </div>
            {selectedCalf.notes && (
              <div style={{ marginTop: 16 }}>
                <strong>Notes:</strong>
                <p style={{ color: '#666', marginTop: 8 }}>{selectedCalf.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
