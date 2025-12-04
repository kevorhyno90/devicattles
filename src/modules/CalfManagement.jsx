import React, { useState, useEffect } from 'react'
import { formatCurrency } from '../lib/currency'
import { addMilkExpense, getMilkTotals } from '../lib/finance'
import { getMilkExpenses } from '../lib/finance'

const SAMPLE_CALVES = [
  // 25 sample dairy cows
  ...Array.from({ length: 25 }).map((_, i) => {
    let status = '';
    if (i < 7) status = 'Incalf';
    else if (i < 17) status = 'Heifer';
    else status = 'Dry';
    return {
      id: `COW-${(i+1).toString().padStart(3, '0')}`,
      tag: `COW-${(100+i+1).toString().padStart(3, '0')}`,
      name: `Sample Cow ${i+1}`,
      damId: `DAM-${(i+1).toString().padStart(3, '0')}`,
      damName: `Dam ${i+1}`,
      sireId: `SIRE-${(i+1).toString().padStart(3, '0')}`,
      sireName: `Sire ${i+1}`,
      dob: `2025-${String(Math.floor(Math.random()*12+1)).padStart(2,'0')}-${String(Math.floor(Math.random()*28+1)).padStart(2,'0')}`,
      sex: 'F',
      breed: ['Holstein', 'Jersey', 'Guernsey', 'Ayrshire', 'Brown Swiss'][i%5],
      birthWeight: Math.floor(Math.random()*10+30),
      currentWeight: Math.floor(Math.random()*100+400),
      weaningDate: '',
      weaningWeight: '',
      healthStatus: 'Healthy',
      housingType: ['Individual Pen', 'Group Pen', 'Barn'][i%3],
      notes: '',
      colostrumIntake: 'Adequate',
      navelTreatment: 'Done',
      vaccination: [],
      dehorning: '',
      castration: 'N/A',
      status
    }
  })
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
    // Sample feeding records for demo
    const SAMPLE_FEEDING = [
      {
        id: 'FEED-001', calfId: 'CALF-001', date: '2025-11-28', feedType: 'Milk', quantityKg: 1.2, quantityLiters: 1.2, pricePerKg: 50, reason: 'Morning feeding', method: 'Bottle', temperature: 38, isWarm: true, isColostrum: false, notes: 'Fed well', timestamp: '2025-11-28T06:00:00'
      },
      {
        id: 'FEED-002', calfId: 'CALF-002', date: '2025-11-28', feedType: 'Milk', quantityKg: 1.5, quantityLiters: 1.5, pricePerKg: 50, reason: 'Kicked bucket', method: 'Bucket', temperature: 37, isWarm: true, isColostrum: false, notes: 'Lost some milk', timestamp: '2025-11-28T10:00:00'
      },
      {
        id: 'FEED-003', calfId: 'CALF-003', date: '2025-11-28', feedType: 'Milk', quantityKg: 1.0, quantityLiters: 1.0, pricePerKg: 50, reason: 'Fed to worker', method: 'Bottle', temperature: 38, isWarm: true, isColostrum: false, notes: 'Worker requested', timestamp: '2025-11-28T14:00:00'
      }
    ]
  const [healthRecords, setHealthRecords] = useState([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedCalf, setSelectedCalf] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [editingCalfId, setEditingCalfId] = useState(null)
  const [editingFeedingId, setEditingFeedingId] = useState(null)
  const [editingHealthId, setEditingHealthId] = useState(null)
  
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
    feedType: 'Milk', quantityKg: '', quantityLiters: '', pricePerKg: '', reason: '', method: 'Bottle',
    temperature: '', notes: '',
    isWarm: true, isColostrum: false,
    autoKg: false,
    buyerName: '', buyerContact: '', buyerType: '', buyerNotes: '',
    paymentMode: '', amountFedToCalves: '', amountConsumed: ''
  })
  // Auto-calculate kg from liters (1L ≈ 1.03kg)
  useEffect(() => {
    if (feedingForm.quantityLiters && (!feedingForm.quantityKg || feedingForm.autoKg)) {
      const kg = (parseFloat(feedingForm.quantityLiters) * 1.03).toFixed(2)
      setFeedingForm(f => ({ ...f, quantityKg: kg, autoKg: true }))
    }
    // If user edits kg manually, stop autoKg
    if (feedingForm.quantityKg && feedingForm.autoKg && feedingForm.quantityLiters === '') {
      setFeedingForm(f => ({ ...f, autoKg: false }))
    }
  }, [feedingForm.quantityLiters])
  
  // Health form
  const [healthForm, setHealthForm] = useState({
    calfId: '', date: new Date().toISOString().slice(0, 10),
    type: 'Vaccination', treatment: '', diagnosis: '',
    medication: '', dosage: '', veterinarian: '', cost: '', nextVisit: '', notes: ''
  })

  // Inline edit state
  const [inlineEditId, setInlineEditId] = useState(null)
  const [inlineData, setInlineData] = useState({})
  const [toast, setToast] = useState(null)
  const [lastChange, setLastChange] = useState(null)

  useEffect(() => {
    const raw = localStorage.getItem(KEY)
    if (raw) setCalves(JSON.parse(raw))
    else setCalves(SAMPLE_CALVES)

    const feedingRaw = localStorage.getItem(FEEDING_KEY)
    if (feedingRaw) setFeedingRecords(JSON.parse(feedingRaw))
    else setFeedingRecords(SAMPLE_FEEDING)
    
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
    
    if(editingCalfId) {
      // Update existing calf
      setCalves(calves.map(c => c.id === editingCalfId ? { ...c, ...formData } : c))
      setEditingCalfId(null)
    } else {
      // Add new calf
      const id = 'CALF-' + Date.now()
      const newCalf = { ...formData, id, vaccination: formData.vaccination || [] }
      setCalves([...calves, newCalf])
    }
    
    resetForm()
    setShowAddForm(false)
  }

  function startEditCalf(calf) {
    setEditingCalfId(calf.id)
    setFormData({ ...calf })
    setShowAddForm(true)
  }

  function cancelEditCalf() {
    setEditingCalfId(null)
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

  // Inline edit functions
  function startInlineEdit(item) {
    setInlineEditId(item.id)
    setInlineData({ ...item })
    setLastChange({ item })
  }

  function saveInlineEdit() {
    if (!inlineData.name || !inlineData.name.trim()) {
      setToast({ type: 'error', message: 'Name is required' })
      return
    }
    
    setCalves(calves.map(c => c.id === inlineEditId ? inlineData : c))
    setToast({ type: 'success', message: '✓ Updated', showUndo: true })
    setInlineEditId(null)
    setTimeout(() => setToast(null), 3000)
  }

  function cancelInlineEdit() {
    setInlineEditId(null)
    setInlineData({})
    setToast(null)
  }

  function undoLastChange() {
    if (!lastChange) return
    setCalves(calves.map(c => c.id === inlineEditId ? lastChange.item : c))
    setToast(null)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault()
      saveInlineEdit()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      cancelInlineEdit()
    }
  }

  function addFeeding() {
    if (!feedingForm.calfId || (!feedingForm.quantityKg && !feedingForm.quantityLiters)) {
      alert('Please select calf and enter quantity (kg or liters)')
      return
    }
    // Best practice validation
    const calf = calves.find(c => c.id === feedingForm.calfId)
    const quantityKg = parseFloat(feedingForm.quantityKg) || 0
    const quantityLiters = parseFloat(feedingForm.quantityLiters) || quantityKg
    const ageDays = calf ? Math.floor((new Date() - new Date(calf.dob)) / (1000 * 60 * 60 * 24)) : 0
    let warnings = []
    if (quantityLiters > 1.5) warnings.push('Recommended max milk per feeding is 1.5L.')
    if (feedingForm.isWarm !== true) warnings.push('Milk should be warm.')
    if (feedingForm.isColostrum && ageDays > 2) warnings.push('Colostrum should be fed only in first 36 hours.')
    if (calf) {
      if (calf.sex === 'F' && ageDays > 120) warnings.push('Milk feeding for heifers should be gradually withdrawn after 4 months.')
      if (calf.sex === 'M' && ageDays > 90) warnings.push('Milk feeding for bulls should be gradually withdrawn after 3 months.')
      if (ageDays < 7 && feedingForm.feedType !== 'Milk' && !feedingForm.isColostrum) warnings.push('Other feeds should be introduced after 1 week, ad libitum.')
    }
    if (warnings.length) alert(warnings.join('\n'))
    // Record to feeding
    const feedingRecord = {
      ...feedingForm,
      quantityKg,
      quantityLiters,
      id: editingFeedingId ? editingFeedingId : 'FEED-' + Date.now(),
      timestamp: new Date().toISOString()
    }
    if(editingFeedingId) {
      setFeedingRecords(feedingRecords.map(f => f.id === editingFeedingId ? feedingRecord : f))
      setEditingFeedingId(null)
    } else {
      setFeedingRecords([...feedingRecords, feedingRecord])
    }
    // Record to finance if price is set
    if (feedingForm.pricePerKg && quantityKg > 0) {
      addMilkExpense({
        date: feedingForm.date,
        calfId: feedingForm.calfId,
        quantityKg,
        quantityLiters,
        pricePerKg: parseFloat(feedingForm.pricePerKg),
        reason: feedingForm.reason || feedingForm.notes || feedingForm.feedType,
        buyerName: feedingForm.buyerName,
        buyerContact: feedingForm.buyerContact,
        buyerType: feedingForm.buyerType,
        buyerNotes: feedingForm.buyerNotes
      })
    }
    setFeedingForm({
      ...feedingForm,
      quantityKg: '', quantityLiters: '', pricePerKg: '', reason: '', notes: '',
      buyerName: '', buyerContact: '', buyerType: '', buyerNotes: ''
    })
  }

  function startEditFeeding(record) {
    setEditingFeedingId(record.id)
    setFeedingForm({ ...record })
  }

  function cancelEditFeeding() {
    setEditingFeedingId(null)
    setFeedingForm({ calfId: '', date: new Date().toISOString().slice(0, 10), feedType: 'Milk Replacer', quantity: '', method: 'Bottle', temperature: '', notes: '' })
  }

  function addHealth() {
    if (!healthForm.calfId || !healthForm.type) {
      alert('Please select calf and type')
      return
    }
    
    if(editingHealthId) {
      setHealthRecords(healthRecords.map(h => h.id === editingHealthId ? { ...h, ...healthForm } : h))
      setEditingHealthId(null)
    } else {
      const id = 'HEALTH-' + Date.now()
      setHealthRecords([...healthRecords, { ...healthForm, id, timestamp: new Date().toISOString() }])
    }
    
    setHealthForm({ ...healthForm, treatment: '', medication: '', dosage: '', cost: '', notes: '' })
  }

  function startEditHealth(record) {
    setEditingHealthId(record.id)
    setHealthForm({ ...record })
  }

  function cancelEditHealth() {
    setEditingHealthId(null)
    setHealthForm({ calfId: '', date: new Date().toISOString().slice(0, 10), type: 'Vaccination', treatment: '', diagnosis: '', medication: '', dosage: '', veterinarian: '', cost: '', nextVisit: '', notes: '' })
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
            <button onClick={addCalf}>{editingCalfId ? 'Update Calf' : 'Add Calf'}</button>
            {editingCalfId ? (
              <button onClick={cancelEditCalf} style={{ background: '#6b7280' }}>Cancel Edit</button>
            ) : (
              <button onClick={() => setShowAddForm(false)} style={{ background: '#6b7280' }}>Cancel</button>
            )}
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
                    {inlineEditId === calf.id ? (
                      <div onKeyDown={handleKeyDown} style={{ display: 'grid', gap: '12px' }}>
                        <input type="text" placeholder="Calf Name" value={inlineData.name || ''} onChange={e => setInlineData({ ...inlineData, name: e.target.value })} style={{ padding: '8px', border: '1px solid #ddd', borderRadius: 4 }} />
                        <input type="text" placeholder="Tag" value={inlineData.tag || ''} onChange={e => setInlineData({ ...inlineData, tag: e.target.value })} style={{ padding: '8px', border: '1px solid #ddd', borderRadius: 4 }} />
                        <input type="text" placeholder="Breed" value={inlineData.breed || ''} onChange={e => setInlineData({ ...inlineData, breed: e.target.value })} style={{ padding: '8px', border: '1px solid #ddd', borderRadius: 4 }} />
                        <input type="number" placeholder="Current Weight (kg)" value={inlineData.currentWeight || ''} onChange={e => setInlineData({ ...inlineData, currentWeight: e.target.value })} style={{ padding: '8px', border: '1px solid #ddd', borderRadius: 4 }} />
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button type="button" onClick={saveInlineEdit} style={{ padding: '8px 16px', background: '#059669', color: '#fff', borderRadius: 4, cursor: 'pointer', flex: 1 }}>Save</button>
                          <button type="button" onClick={cancelInlineEdit} style={{ padding: '8px 16px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: 4, cursor: 'pointer', flex: 1 }}>Cancel</button>
                        </div>
                      </div>
                    ) : (
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
                          <button onClick={() => startInlineEdit(calf)} style={{ fontSize: 12, padding: '4px 8px', background: '#ffffcc', border: '1px solid #ffdd00' }}>⚡ Quick</button>
                          <button onClick={() => startEditCalf(calf)} style={{ fontSize: 12, padding: '4px 8px', background: '#3b82f6' }}>✏️ Edit</button>
                          <button onClick={() => deleteCalf(calf.id)} style={{ fontSize: 12, padding: '4px 8px', background: '#dc2626' }}>🗑️ Delete</button>
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

      {/* Feeding Records Tab */}
      {activeTab === 'feeding' && (
        <div>
          <div className="card" style={{ padding: 20, marginBottom: 18, background: '#f8fafc', borderRadius: 10, boxShadow: '0 2px 8px #e0e7ef' }}>
            <h3 style={{ marginTop: 0, color: '#2563eb' }}>Add Milk Feeding Record</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
              <div>
                <label><strong>Animal *</strong></label>
                <select value={feedingForm.calfId} onChange={e => setFeedingForm({ ...feedingForm, calfId: e.target.value })} style={{ width: '100%', padding: 6 }}>
                  <option value="">-- Select Animal --</option>
                  {(animals || []).map(a => (
                    <option key={a.id} value={a.id}>{a.name || a.tag} ({a.breed || a.type || ''})</option>
                  ))}
                </select>
              <div>
                <label><strong>Notes</strong></label>
                <input value={feedingForm.notes} onChange={e => setFeedingForm({ ...feedingForm, notes: e.target.value })} style={{ width: '100%', padding: 6 }} />
              </div>
              <div style={{ gridColumn: '1 / -1', marginTop: 10, background: '#e0f2fe', padding: 10, borderRadius: 8 }}>
                <label style={{ fontWeight: 600, color: '#2563eb' }}>Milk Buyer & Payment Details</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginTop: 6 }}>
                  <div>
                    <label>Name</label>
                    <input value={feedingForm.buyerName} onChange={e => setFeedingForm({ ...feedingForm, buyerName: e.target.value })} style={{ width: '100%', padding: 6 }} placeholder="Buyer name" />
                  </div>
                  <div>
                    <label>Contact</label>
                    <input value={feedingForm.buyerContact} onChange={e => setFeedingForm({ ...feedingForm, buyerContact: e.target.value })} style={{ width: '100%', padding: 6 }} placeholder="Phone or email" />
                  </div>
                  <div>
                    <label>Type</label>
                    <select value={feedingForm.buyerType} onChange={e => setFeedingForm({ ...feedingForm, buyerType: e.target.value })} style={{ width: '100%', padding: 6 }}>
                      <option value="">-- Select --</option>
                      <option value="Individual">Individual</option>
                      <option value="Dairy">Dairy</option>
                      <option value="Cooperative">Cooperative</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label>Buyer Notes</label>
                    <input value={feedingForm.buyerNotes} onChange={e => setFeedingForm({ ...feedingForm, buyerNotes: e.target.value })} style={{ width: '100%', padding: 6 }} placeholder="Special instructions, etc." />
                  </div>
                  <div>
                    <label>Payment Mode</label>
                    <select value={feedingForm.paymentMode} onChange={e => setFeedingForm({ ...feedingForm, paymentMode: e.target.value })} style={{ width: '100%', padding: 6 }}>
                      <option value="">-- Select --</option>
                      <option value="Cash">Cash</option>
                      <option value="Mpesa">Mpesa</option>
                    </select>
                  </div>
                  <div>
                    <label>Amount Fed to Calves</label>
                    <input type="number" step="0.01" value={feedingForm.amountFedToCalves} onChange={e => setFeedingForm({ ...feedingForm, amountFedToCalves: e.target.value })} style={{ width: '100%', padding: 6 }} placeholder="Amount" />
                  </div>
                  <div>
                    <label>Amount Consumed</label>
                    <input type="number" step="0.01" value={feedingForm.amountConsumed} onChange={e => setFeedingForm({ ...feedingForm, amountConsumed: e.target.value })} style={{ width: '100%', padding: 6 }} placeholder="Amount" />
                  </div>
                  <div>
                    <label>Reason</label>
                    <input value={feedingForm.reason} onChange={e => setFeedingForm({ ...feedingForm, reason: e.target.value })} style={{ width: '100%', padding: 6 }} placeholder="Reason for transaction" />
                  </div>
                </div>
              </div>
              </div>
              <div>
                <label><strong>Feed Type</strong></label>
                <select value={feedingForm.feedType} onChange={e => setFeedingForm({ ...feedingForm, feedType: e.target.value })} style={{ width: '100%', padding: 6 }}>
                  <option value="Milk">Milk</option>
                  <option value="Colostrum">Colostrum (first 36hrs)</option>
                  <option value="Milk Replacer">Milk Replacer</option>
                  <option value="Starter Feed">Starter Feed</option>
                  <option value="Hay">Hay</option>
                  <option value="Concentrates">Concentrates</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label><strong>Quantity (liters)</strong></label>
                <input type="number" step="0.01" value={feedingForm.quantityLiters} onChange={e => setFeedingForm({ ...feedingForm, quantityLiters: e.target.value })} min="0" style={{ width: '100%', padding: 6 }} />
                <span style={{ fontSize: 12, color: '#666' }}>Auto-calculates kg</span>
              </div>
              <div>
                <label><strong>Quantity (kg)</strong></label>
                <input type="number" step="0.01" value={feedingForm.quantityKg} onChange={e => setFeedingForm({ ...feedingForm, quantityKg: e.target.value, autoKg: false })} min="0" style={{ width: '100%', padding: 6, background: feedingForm.autoKg ? '#e0f2fe' : undefined }} />
                {feedingForm.autoKg && <span style={{ fontSize: 12, color: '#059669' }}>Auto from liters</span>}
              </div>
              <div>
                <label><strong>Price per kg (milk)</strong></label>
                <input type="number" step="0.01" value={feedingForm.pricePerKg} onChange={e => setFeedingForm({ ...feedingForm, pricePerKg: e.target.value })} min="0" style={{ width: '100%', padding: 6 }} />
              </div>
              <div>
                <label><strong>Reason/Use</strong></label>
                <input value={feedingForm.reason} onChange={e => setFeedingForm({ ...feedingForm, reason: e.target.value })} style={{ width: '100%', padding: 6 }} />
              </div>
              <div>
                <label><strong>Method</strong></label>
                <select value={feedingForm.method} onChange={e => setFeedingForm({ ...feedingForm, method: e.target.value })} style={{ width: '100%', padding: 6 }}>
                  {FEEDING_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label><strong>Milk Temperature (°C)</strong></label>
                <input type="number" step="0.1" value={feedingForm.temperature} onChange={e => setFeedingForm({ ...feedingForm, temperature: e.target.value })} style={{ width: '60%', padding: 6 }} />
                <label style={{ marginLeft: 8 }}>
                  <input type="checkbox" checked={feedingForm.isWarm} onChange={e => setFeedingForm({ ...feedingForm, isWarm: e.target.checked })} /> Warm Milk
                </label>
              </div>
              <div>
                <label><strong>Colostrum</strong></label>
                <input type="checkbox" checked={feedingForm.isColostrum} onChange={e => setFeedingForm({ ...feedingForm, isColostrum: e.target.checked })} />
                <span style={{ fontSize: 12, color: '#666', marginLeft: 8 }}>(First 36 hours only)</span>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label><strong>Notes</strong></label>
                <input value={feedingForm.notes} onChange={e => setFeedingForm({ ...feedingForm, notes: e.target.value })} style={{ width: '100%', padding: 6 }} />
              </div>
            </div>
            <div style={{ marginTop: 14, fontSize: 14, color: '#059669', background: '#f0fdf4', padding: 10, borderRadius: 8, lineHeight: 1.7 }}>
              <strong>Feeding Guidance:</strong><br />
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                <li>1.5L per feeding, every 4 hours</li>
                <li>Milk should be warm (38°C)</li>
                <li>Colostrum in first 36 hours</li>
                <li>Milk for 4 months (heifers), 3 months (bulls)</li>
                <li>Gradual withdrawal after recommended period</li>
                <li>Introduce other feeds at 1 week</li>
                <li>Ad libitum increase as calf grows</li>
                <li>Track feeding history for each calf</li>
              </ul>
            </div>
            <button onClick={addFeeding} style={{ marginTop: 16, background: '#2563eb', color: '#fff', padding: '8px 18px', borderRadius: 6, fontWeight: 600, fontSize: 15 }}>Add Feeding Record</button>
          </div>

          <div className="card" style={{ padding: 0 }}>
            {feedingRecords.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center' }}>
                <h4>No milk records yet</h4>
              </div>
            ) : (
              <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#e0f2fe' }}>
                      <th style={{ padding: '6px', border: '1px solid #e5e7eb' }}>Date</th>
                      <th style={{ padding: '6px', border: '1px solid #e5e7eb' }}>Calf</th>
                      <th style={{ padding: '6px', border: '1px solid #e5e7eb' }}>Feed Type</th>
                      <th style={{ padding: '6px', border: '1px solid #e5e7eb' }}>Kg</th>
                      <th style={{ padding: '6px', border: '1px solid #e5e7eb' }}>Liters</th>
                      <th style={{ padding: '6px', border: '1px solid #e5e7eb' }}>Method</th>
                      <th style={{ padding: '6px', border: '1px solid #e5e7eb' }}>Price/kg</th>
                      <th style={{ padding: '6px', border: '1px solid #e5e7eb' }}>Amount</th>
                      <th style={{ padding: '6px', border: '1px solid #e5e7eb' }}>Reason/Use</th>
                      <th style={{ padding: '6px', border: '1px solid #e5e7eb' }}>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {feedingRecords.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).map(record => {
                      const calf = calves.find(c => c.id === record.calfId)
                      const amount = record.pricePerKg && record.quantityKg ? parseFloat(record.pricePerKg) * parseFloat(record.quantityKg) : '';
                      return (
                        <tr key={record.id}>
                          <td style={{ padding: '6px', border: '1px solid #e5e7eb' }}>{new Date(record.date).toLocaleDateString()}</td>
                          <td style={{ padding: '6px', border: '1px solid #e5e7eb' }}>{calf?.name || calf?.tag || record.calfId}</td>
                          <td style={{ padding: '6px', border: '1px solid #e5e7eb' }}>{record.feedType}</td>
                          <td style={{ padding: '6px', border: '1px solid #e5e7eb' }}>{record.quantityKg}</td>
                          <td style={{ padding: '6px', border: '1px solid #e5e7eb' }}>{record.quantityLiters}</td>
                          <td style={{ padding: '6px', border: '1px solid #e5e7eb' }}>{record.method}</td>
                          <td style={{ padding: '6px', border: '1px solid #e5e7eb' }}>{record.pricePerKg ? formatCurrency(record.pricePerKg) : '-'}</td>
                          <td style={{ padding: '6px', border: '1px solid #e5e7eb' }}>{amount ? formatCurrency(amount) : '-'}</td>
                          <td style={{ padding: '6px', border: '1px solid #e5e7eb' }}>{record.reason || '-'}</td>
                          <td style={{ padding: '6px', border: '1px solid #e5e7eb' }}>{record.notes || '-'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          {/* Milk Totals */}
          <div className="card" style={{ marginTop: 16, padding: 16, background: '#f0fdf4' }}>
            <h4 style={{ marginTop: 0 }}>Milk Consumption Totals</h4>
            {(() => {
              const { daily, monthly } = getMilkTotals();
              return (
                <div>
                  <div style={{ marginBottom: 8 }}>
                    <strong>Daily Totals:</strong>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 8 }}>
                      <thead>
                        <tr style={{ background: '#e0f2fe' }}>
                          <th style={{ padding: '6px', border: '1px solid #e5e7eb' }}>Date</th>
                          <th style={{ padding: '6px', border: '1px solid #e5e7eb' }}>Total Kg</th>
                          <th style={{ padding: '6px', border: '1px solid #e5e7eb' }}>Total Liters</th>
                          <th style={{ padding: '6px', border: '1px solid #e5e7eb' }}>Total Amount</th>
                          <th style={{ padding: '6px', border: '1px solid #e5e7eb' }}>Fed to Calves</th>
                          <th style={{ padding: '6px', border: '1px solid #e5e7eb' }}>Consumed</th>
                          <th style={{ padding: '6px', border: '1px solid #e5e7eb' }}>Loss/Spoiled</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(daily).map(([day, t]) => (
                          <tr key={day}>
                            <td style={{ padding: '6px', border: '1px solid #e5e7eb' }}>{day}</td>
                            <td style={{ padding: '6px', border: '1px solid #e5e7eb' }}>{t.totalKg.toFixed(2)}</td>
                            <td style={{ padding: '6px', border: '1px solid #e5e7eb' }}>{t.totalLiters.toFixed(2)}</td>
                            <td style={{ padding: '6px', border: '1px solid #e5e7eb' }}>{formatCurrency(t.totalAmount)}</td>
                            <td style={{ padding: '6px', border: '1px solid #e5e7eb' }}>{t.totalFedToCalves.toFixed(2)}</td>
                            <td style={{ padding: '6px', border: '1px solid #e5e7eb' }}>{t.totalConsumed.toFixed(2)}</td>
                            <td style={{ padding: '6px', border: '1px solid #e5e7eb' }}>{t.totalLoss.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <strong>Monthly Totals:</strong>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 8 }}>
                      <thead>
                        <tr style={{ background: '#e0f2fe' }}>
                          <th style={{ padding: '6px', border: '1px solid #e5e7eb' }}>Month</th>
                          <th style={{ padding: '6px', border: '1px solid #e5e7eb' }}>Total Kg</th>
                          <th style={{ padding: '6px', border: '1px solid #e5e7eb' }}>Total Liters</th>
                          <th style={{ padding: '6px', border: '1px solid #e5e7eb' }}>Total Amount</th>
                          <th style={{ padding: '6px', border: '1px solid #e5e7eb' }}>Fed to Calves</th>
                          <th style={{ padding: '6px', border: '1px solid #e5e7eb' }}>Consumed</th>
                          <th style={{ padding: '6px', border: '1px solid #e5e7eb' }}>Loss/Spoiled</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(monthly).map(([month, t]) => (
                          <tr key={month}>
                            <td style={{ padding: '6px', border: '1px solid #e5e7eb' }}>{month}</td>
                            <td style={{ padding: '6px', border: '1px solid #e5e7eb' }}>{t.totalKg.toFixed(2)}</td>
                            <td style={{ padding: '6px', border: '1px solid #e5e7eb' }}>{t.totalLiters.toFixed(2)}</td>
                            <td style={{ padding: '6px', border: '1px solid #e5e7eb' }}>{formatCurrency(t.totalAmount)}</td>
                            <td style={{ padding: '6px', border: '1px solid #e5e7eb' }}>{t.totalFedToCalves.toFixed(2)}</td>
                            <td style={{ padding: '6px', border: '1px solid #e5e7eb' }}>{t.totalConsumed.toFixed(2)}</td>
                            <td style={{ padding: '6px', border: '1px solid #e5e7eb' }}>{t.totalLoss.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div>
                    <strong>All Milk Finance Records:</strong>
                    {(() => {
                      // Show all milk records, including buyer details
                      const milkRecords = getMilkExpenses();
                      if (!milkRecords.length) return <div style={{ color: '#888', marginTop: 8 }}>No milk finance records found.</div>;
                      return (
                        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
                          <thead>
                            <tr style={{ background: '#e0f2fe' }}>
                              <th style={{ padding: '6px', border: '1px solid #e5e7eb' }}>Date</th>
                              <th style={{ padding: '6px', border: '1px solid #e5e7eb' }}>Calf</th>
                              <th style={{ padding: '6px', border: '1px solid #e5e7eb' }}>Kg</th>
                              <th style={{ padding: '6px', border: '1px solid #e5e7eb' }}>Liters</th>
                              <th style={{ padding: '6px', border: '1px solid #e5e7eb' }}>Price/kg</th>
                              <th style={{ padding: '6px', border: '1px solid #e5e7eb' }}>Amount</th>
                              <th style={{ padding: '6px', border: '1px solid #e5e7eb' }}>Reason/Use</th>
                              <th style={{ padding: '6px', border: '1px solid #e5e7eb' }}>Buyer Name</th>
                              <th style={{ padding: '6px', border: '1px solid #e5e7eb' }}>Buyer Contact</th>
                              <th style={{ padding: '6px', border: '1px solid #e5e7eb' }}>Buyer Type</th>
                              <th style={{ padding: '6px', border: '1px solid #e5e7eb' }}>Buyer Notes</th>
                              <th style={{ padding: '6px', border: '1px solid #e5e7eb' }}>Payment Mode</th>
                              <th style={{ padding: '6px', border: '1px solid #e5e7eb' }}>Amount Fed to Calves</th>
                              <th style={{ padding: '6px', border: '1px solid #e5e7eb' }}>Amount Consumed</th>
                            </tr>
                          </thead>
                          <tbody>
                            {milkRecords.map((rec, idx) => {
                              const calf = calves.find(c => c.id === rec.calfId);
                              return (
                                <tr key={rec.id || idx}>
                                  <td style={{ padding: '6px', border: '1px solid #e5e7eb' }}>{rec.date}</td>
                                  <td style={{ padding: '6px', border: '1px solid #e5e7eb' }}>{calf?.name || calf?.tag || rec.calfId || '-'}</td>
                                  <td style={{ padding: '6px', border: '1px solid #e5e7eb' }}>{rec.quantityKg}</td>
                                  <td style={{ padding: '6px', border: '1px solid #e5e7eb' }}>{rec.quantityLiters}</td>
                                  <td style={{ padding: '6px', border: '1px solid #e5e7eb' }}>{rec.pricePerKg ? formatCurrency(rec.pricePerKg) : '-'}</td>
                                  <td style={{ padding: '6px', border: '1px solid #e5e7eb' }}>{rec.amount ? formatCurrency(rec.amount) : '-'}</td>
                                  <td style={{ padding: '6px', border: '1px solid #e5e7eb' }}>{rec.reason || '-'}</td>
                                  <td style={{ padding: '6px', border: '1px solid #e5e7eb' }}>{rec.buyerName || '-'}</td>
                                  <td style={{ padding: '6px', border: '1px solid #e5e7eb' }}>{rec.buyerContact || '-'}</td>
                                  <td style={{ padding: '6px', border: '1px solid #e5e7eb' }}>{rec.buyerType || '-'}</td>
                                  <td style={{ padding: '6px', border: '1px solid #e5e7eb' }}>{rec.buyerNotes || '-'}</td>
                                  <td style={{ padding: '6px', border: '1px solid #e5e7eb' }}>{rec.paymentMode || '-'}</td>
                                  <td style={{ padding: '6px', border: '1px solid #e5e7eb' }}>{rec.amountFedToCalves || '-'}</td>
                                  <td style={{ padding: '6px', border: '1px solid #e5e7eb' }}>{rec.amountConsumed || '-'}</td>
                                </tr>
                              );
                            })}
                            {/* Summary row for totals */}
                            {milkRecords.length > 0 && (() => {
                              const totalKg = milkRecords.reduce((sum, r) => sum + (parseFloat(r.quantityKg) || 0), 0);
                              const totalLiters = milkRecords.reduce((sum, r) => sum + (parseFloat(r.quantityLiters) || 0), 0);
                              const totalAmount = milkRecords.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
                              const totalFedToCalves = milkRecords.reduce((sum, r) => sum + (parseFloat(r.amountFedToCalves) || 0), 0);
                              const totalConsumed = milkRecords.reduce((sum, r) => sum + (parseFloat(r.amountConsumed) || 0), 0);
                              const totalLoss = milkRecords.reduce((sum, r) => sum + (parseFloat(r.amountLoss) || 0), 0);
                              return (
                                <tr style={{ background: '#e0f2fe', fontWeight: 600 }}>
                                  <td colSpan={2} style={{ padding: '6px', border: '1px solid #e5e7eb' }}>TOTAL</td>
                                  <td style={{ padding: '6px', border: '1px solid #e5e7eb' }}>{totalKg.toFixed(2)}</td>
                                  <td style={{ padding: '6px', border: '1px solid #e5e7eb' }}>{totalLiters.toFixed(2)}</td>
                                  <td style={{ padding: '6px', border: '1px solid #e5e7eb' }}>-</td>
                                  <td style={{ padding: '6px', border: '1px solid #e5e7eb' }}>{formatCurrency(totalAmount)}</td>
                                  <td style={{ padding: '6px', border: '1px solid #e5e7eb' }}>-</td>
                                  <td style={{ padding: '6px', border: '1px solid #e5e7eb' }}>-</td>
                                  <td style={{ padding: '6px', border: '1px solid #e5e7eb' }}>-</td>
                                  <td style={{ padding: '6px', border: '1px solid #e5e7eb' }}>-</td>
                                  <td style={{ padding: '6px', border: '1px solid #e5e7eb' }}>-</td>
                                  <td style={{ padding: '6px', border: '1px solid #e5e7eb' }}>{totalFedToCalves.toFixed(2)}</td>
                                  <td style={{ padding: '6px', border: '1px solid #e5e7eb' }}>{totalConsumed.toFixed(2)}</td>
                                </tr>
                              );
                            })()}
                          </tbody>
                        </table>
                      );
                    })()}
                  </div>
                </div>
              );
            })()}
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

      {toast && (
        <div style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          padding: '12px 20px',
          borderRadius: 8,
          background: toast.type === 'error' ? '#fee2e2' : '#d1fae5',
          color: toast.type === 'error' ? '#991b1b' : '#065f46',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 10000,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          maxWidth: 300
        }}>
          <div>{toast.message}</div>
          {toast.showUndo && <button onClick={undoLastChange} style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', fontWeight: 600 }}>↶ Undo</button>}
        </div>
      )}
    </div>
  )
}

