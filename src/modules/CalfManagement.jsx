  // Export to CSV (simple placeholder)
  function exportToCSV(type) {
    let rows = []
    let headers = []
    if (type === 'calves') {
      headers = Object.keys(calves[0] || {})
      rows = calves
    } else if (type === 'feeding') {
      headers = Object.keys(feedingRecords[0] || {})
      rows = feedingRecords
    } else if (type === 'health') {
      headers = Object.keys(healthRecords[0] || {})
      rows = healthRecords
    }
    if (!rows.length) return alert('No data to export')
    const csv = [headers.join(',')].concat(rows.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(','))).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${type}_export_${new Date().toISOString().slice(0,10)}.csv`
    document.body.appendChild(a)
    a.click()
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url) }, 100)
  }
import React, { useState, useEffect } from 'react'
import DataLayer from '../lib/dataLayer'
import ErrorBoundary from '../components/ErrorBoundary'
import { formatCurrency } from '../lib/currency'
import { addMilkExpense, getMilkTotals } from '../lib/finance'
import { getMilkExpenses } from '../lib/finance'
import CalfOverviewRow from './CalfOverviewRow'
import { LineChart, BarChart } from '../components/Charts'

const HEALTH_STATUS = ['Healthy', 'Sick', 'Under Treatment', 'Quarantine', 'Recovered']
const HOUSING_TYPES = ['Individual Pen', 'Group Pen', 'Hutch', 'Barn', 'Free Range']
const COLOSTRUM_INTAKE = ['Adequate', 'Insufficient', 'Unknown', 'Bottle Fed', 'Tube Fed']
const FEEDING_METHODS = ['Bottle', 'Bucket', 'Nursing', 'Automatic Feeder']

function CalfManagement({ animals }) {
  // DataLayer keys
  const [calves, setCalves] = useState([])
  const [feedingRecords, setFeedingRecords] = useState([])
  const [healthRecords, setHealthRecords] = useState([])
  const [search, setSearch] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  // Batch selection state
  const [batchMode, setBatchMode] = useState(false)
  const [selectedBatchIds, setSelectedBatchIds] = useState([])
  const [selectedCalf, setSelectedCalf] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [editingCalfId, setEditingCalfId] = useState(null)
  const [editingFeedingId, setEditingFeedingId] = useState(null)
  const [editingHealthId, setEditingHealthId] = useState(null)
  const [toast, setToast] = useState(null)
  const [lastChange, setLastChange] = useState(null)

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
    medication: '', dosage: '', veterinarian: '', cost: '', nextVisit: '', notes: '',
    recurring: false, recurrenceInterval: '', recurrenceUnit: 'days',
    vaccinationSchedule: '', alertBeforeDays: 2
  })

  // Inline edit state
  const [inlineEditId, setInlineEditId] = useState(null)
  const [inlineData, setInlineData] = useState({})

  const [error, setError] = useState(null)
  useEffect(() => {
    async function fetchCalves() {
      try {
        if (search.trim()) {
          const results = await DataLayer.createEntity('cattalytics:calf:management', 'Calf').search(search, ['name', 'tag', 'breed', 'status'])
          setCalves(results)
        } else {
          const all = await DataLayer.createEntity('cattalytics:calf:management', 'Calf').getAll()
          setCalves(all)
        }
        setError(null)
      } catch (err) {
        setError(err.message || String(err))
        setCalves([])
        // Also log to console for debugging
        console.error('CalfManagement fetchCalves error:', err)
      }
    }
    fetchCalves()
  }, [search])

  useEffect(() => {
    async function fetchFeeding() {
      try {
        const all = await DataLayer.createEntity('cattalytics:calf:feeding', 'Feeding').getAll()
        setFeedingRecords(all)
      } catch (err) {
        setError(err.message || String(err))
        setFeedingRecords([])
        console.error('CalfManagement fetchFeeding error:', err)
      }
    }
    fetchFeeding()
  }, [])

  useEffect(() => {
    async function fetchHealth() {
      try {
        const all = await DataLayer.createEntity('cattalytics:calf:health', 'Health').getAll()
        setHealthRecords(all)
      } catch (err) {
        setError(err.message || String(err))
        setHealthRecords([])
        console.error('CalfManagement fetchHealth error:', err)
      }
    }
    fetchHealth()
  }, [])

  async function addCalf(formData) {
    await DataLayer.createEntity('cattalytics:calf:management', 'Calf').create(formData)
    setCalves(await DataLayer.createEntity('cattalytics:calf:management', 'Calf').getAll())
  }

  async function updateCalf(id, updates) {
    await DataLayer.createEntity('cattalytics:calf:management', 'Calf').update(id, updates)
    setCalves(await DataLayer.createEntity('cattalytics:calf:management', 'Calf').getAll())
  }

  async function deleteCalf(id) {
    await DataLayer.createEntity('cattalytics:calf:management', 'Calf').delete(id)
    setCalves(await DataLayer.createEntity('cattalytics:calf:management', 'Calf').getAll())
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

  const activeCalves = calves.filter(c => !c.weaningDate || new Date(c.weaningDate) > new Date())
  const weanedCalves = calves.filter(c => c.weaningDate && new Date(c.weaningDate) <= new Date())
  const avgBirthWeight = calves.length ? calves.reduce((sum, c) => sum + (parseFloat(c.birthWeight) || 0), 0) / calves.length : 0
  const sickCalves = calves.filter(c => c.healthStatus === 'Sick' || c.healthStatus === 'Under Treatment')

  // Batch select handlers
  function toggleBatchMode() {
    setBatchMode(!batchMode)
    setSelectedBatchIds([])
  }
  function handleBatchSelect(id) {
    setSelectedBatchIds(ids => ids.includes(id) ? ids.filter(i => i !== id) : [...ids, id])
  }
  function handleBatchSelectAll() {
    if (selectedBatchIds.length === calves.length) setSelectedBatchIds([])
    else setSelectedBatchIds(calves.map(c => c.id))
  }
  function handleBatchDelete() {
    if (!window.confirm('Delete selected calves?')) return
    setCalves(calves.filter(c => !selectedBatchIds.includes(c.id)))
    setSelectedBatchIds([])
  }
  // Batch edit placeholder (could open a modal for batch editing fields)
  function handleBatchEdit() {
    alert('Batch edit not implemented yet. This would open a modal to edit fields for all selected calves.')
  }
  return (
    <ErrorBoundary>
      <section>
        <h2>Calf Management</h2>
        {error && (
          <div style={{ color: 'crimson', margin: '12px 0', fontWeight: 600 }}>
            Error: {error}
          </div>
        )}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <button onClick={() => setActiveTab('overview')} className={activeTab === 'overview' ? 'active' : ''}>Overview</button>
          <button onClick={() => setActiveTab('add')} className={activeTab === 'add' ? 'active' : ''}>Add Calf</button>
          <button onClick={() => setActiveTab('feeding')} className={activeTab === 'feeding' ? 'active' : ''}>Feeding</button>
          <button onClick={() => setActiveTab('health')} className={activeTab === 'health' ? 'active' : ''}>Health</button>
        </div>
        {activeTab === 'overview' && (
          <>
            <div style={{marginTop:12, marginBottom:8, display:'flex', alignItems:'center', gap:8}}>
              <input
                type="text"
                placeholder="Search calves by name, tag, breed, status..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', padding: '6px 10px', borderRadius: 4, border: '1px solid #ddd' }}
              />
              <button onClick={toggleBatchMode} style={{marginLeft:8}}>{batchMode ? 'Cancel Batch' : 'Batch Ops'}</button>
            </div>
            {/* Analytics section for big farm: growth, feeding, health summaries */}
            <div style={{display:'flex',gap:24,marginBottom:16,flexWrap:'wrap'}}>
              <div style={{background:'#f3f4f6',padding:12,borderRadius:8,minWidth:220,position:'relative'}}>
                <strong>Total Calves:</strong> {calves.length}<br/>
                <button style={{position:'absolute',top:8,right:8,fontSize:12}} onClick={() => exportToCSV('calves')}>Export CSV</button>
                <strong>Weaned:</strong> {weanedCalves.length}<br/>
                <strong>Sick:</strong> {sickCalves.length}<br/>
                <strong>Avg Birth Wt:</strong> {avgBirthWeight.toFixed(2)} kg
              </div>
              <div style={{background:'#f3f4f6',padding:12,borderRadius:8,minWidth:220,position:'relative'}}>
                <strong>Feeding Records:</strong> {feedingRecords.length}<br/>
                <button style={{position:'absolute',top:8,right:8,fontSize:12}} onClick={() => exportToCSV('feeding')}>Export CSV</button>
                <div style={{marginTop:8}}>
                  <BarChart
                    data={feedingRecords.map(r => ({ label: r.date, value: parseFloat(r.quantityKg) || 0 }))}
                    title="Milk/Feed Quantity (kg)"
                    xLabel="Date"
                    yLabel="Quantity (kg)"
                    color="#059669"
                    height={180}
                  />
                </div>
              </div>
              <div style={{background:'#f3f4f6',padding:12,borderRadius:8,minWidth:220,position:'relative'}}>
                <strong>Health Records:</strong> {healthRecords.length}<br/>
                <button style={{position:'absolute',top:8,right:8,fontSize:12}} onClick={() => exportToCSV('health')}>Export CSV</button>
                <div style={{marginTop:8}}>
                  <BarChart
                    data={healthRecords.map(r => ({ label: r.date, value: r.cost ? parseFloat(r.cost) : 0 }))}
                    title="Health Costs (KSH)"
                    xLabel="Date"
                    yLabel="Cost (KSH)"
                    color="#ef4444"
                    height={180}
                  />
                </div>
              </div>
            </div>
            {batchMode && (
              <div style={{marginBottom:8, display:'flex', gap:8}}>
                <button onClick={handleBatchSelectAll}>{selectedBatchIds.length === calves.length ? 'Unselect All' : 'Select All'}</button>
                <button onClick={handleBatchEdit} disabled={selectedBatchIds.length === 0}>Batch Edit</button>
                <button onClick={handleBatchDelete} disabled={selectedBatchIds.length === 0} style={{color:'crimson'}}>Batch Delete</button>
                <span style={{marginLeft:8}}>{selectedBatchIds.length} selected</span>
              </div>
            )}
            <div style={{marginTop:12, maxHeight:400, overflowY:'auto'}}>
              {calves.length === 0 ? (
                <div style={{ color: '#888', textAlign: 'center', padding: 32 }}>No calves found. Click "Add Calf" to create your first record.</div>
              ) : (
                calves.map(calf => (
                  <CalfOverviewRow key={calf.id} calf={calf} batchMode={batchMode} selected={selectedBatchIds.includes(calf.id)} onBatchSelect={() => handleBatchSelect(calf.id)} />
                ))
              )}
            </div>

          </>
        )}
        {activeTab === 'add' && (
          <form onSubmit={e => { e.preventDefault(); addCalf(formData); setActiveTab('overview'); }} style={{ background: '#f0fdf4', padding: 16, borderRadius: 8, marginTop: 16 }}>
            <h3>Add New Calf</h3>
            <label>Name</label>
            <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
            <label>Tag</label>
            <input type="text" value={formData.tag} onChange={e => setFormData({ ...formData, tag: e.target.value })} required />
            <label>Date of Birth</label>
            <input type="date" value={formData.dob} onChange={e => setFormData({ ...formData, dob: e.target.value })} required />
            <label>Breed</label>
            <input type="text" value={formData.breed} onChange={e => setFormData({ ...formData, breed: e.target.value })} />
            <label>Sex</label>
            <select value={formData.sex} onChange={e => setFormData({ ...formData, sex: e.target.value })}>
              <option value="F">Female</option>
              <option value="M">Male</option>
            </select>
            <label>Birth Weight (kg)</label>
            <input type="number" value={formData.birthWeight} onChange={e => setFormData({ ...formData, birthWeight: e.target.value })} />
            <label>Notes</label>
            <textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
            <button type="submit" style={{ marginTop: 12, background: '#22c55e', color: 'white', padding: '8px 16px', border: 'none', borderRadius: 4 }}>Save Calf</button>
          </form>
        )}
        {activeTab === 'feeding' && (
          <div style={{ marginTop: 16 }}>
            <h3>Feeding Records</h3>
            <form onSubmit={e => { e.preventDefault(); addFeeding(); }} style={{ background: '#f0fdf4', padding: 16, borderRadius: 8, marginBottom: 24 }}>
              <label>Calf</label>
              <select value={feedingForm.calfId} onChange={e => setFeedingForm({ ...feedingForm, calfId: e.target.value })} required>
                <option value="">Select Calf</option>
                {calves.map(calf => (
                  <option key={calf.id} value={calf.id}>{calf.name} ({calf.tag})</option>
                ))}
              </select>
              <label>Date</label>
              <input type="date" value={feedingForm.date} onChange={e => setFeedingForm({ ...feedingForm, date: e.target.value })} required />
              <label>Feed Type</label>
              <input type="text" value={feedingForm.feedType} onChange={e => setFeedingForm({ ...feedingForm, feedType: e.target.value })} />
              <label>Quantity (kg)</label>
              <input type="number" value={feedingForm.quantityKg} onChange={e => setFeedingForm({ ...feedingForm, quantityKg: e.target.value })} />
              <label>Quantity (liters)</label>
              <input type="number" value={feedingForm.quantityLiters} onChange={e => setFeedingForm({ ...feedingForm, quantityLiters: e.target.value })} />
              <label>Method</label>
              <select value={feedingForm.method} onChange={e => setFeedingForm({ ...feedingForm, method: e.target.value })}>
                {FEEDING_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <label>Notes</label>
              <input type="text" value={feedingForm.notes} onChange={e => setFeedingForm({ ...feedingForm, notes: e.target.value })} />
              <button type="submit" style={{ marginTop: 12, background: '#22c55e', color: 'white', padding: '8px 16px', border: 'none', borderRadius: 4 }}>{editingFeedingId ? 'Update' : 'Add'} Feeding</button>
              {editingFeedingId && <button type="button" onClick={cancelEditFeeding} style={{ marginLeft: 8 }}>Cancel</button>}
            </form>
            <div style={{ maxHeight: 300, overflowY: 'auto' }}>
              {feedingRecords.length === 0 ? (
                <div style={{ color: '#888', textAlign: 'center', padding: 32 }}>No feeding records found.</div>
              ) : (
                feedingRecords.map(record => {
                  const calf = calves.find(c => c.id === record.calfId)
                  return (
                    <div key={record.id} style={{ borderBottom: '1px solid #eee', padding: 12 }}>
                      <strong>{calf ? calf.name : 'Unknown Calf'}</strong> | {record.date} | {record.feedType} | {record.quantityKg} kg / {record.quantityLiters} L | {record.method}
                      <span style={{ marginLeft: 8, color: '#888' }}>{record.notes}</span>
                      <button style={{ marginLeft: 12 }} onClick={() => startEditFeeding(record)}>Edit</button>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}
        {activeTab === 'health' && (
          <div style={{ marginTop: 16 }}>
            <h3>Health Records</h3>
            <form onSubmit={e => { e.preventDefault(); addHealth(); }} style={{ background: '#f0fdf4', padding: 16, borderRadius: 8, marginBottom: 24 }}>
              <label>Calf</label>
              <select value={healthForm.calfId} onChange={e => setHealthForm({ ...healthForm, calfId: e.target.value })} required>
                <option value="">Select Calf</option>
                {calves.map(calf => (
                  <option key={calf.id} value={calf.id}>{calf.name} ({calf.tag})</option>
                ))}
              </select>
              <label>Date</label>
              <input type="date" value={healthForm.date} onChange={e => setHealthForm({ ...healthForm, date: e.target.value })} required />
              <label>Type</label>
              <input type="text" value={healthForm.type} onChange={e => setHealthForm({ ...healthForm, type: e.target.value })} />
              <label>Treatment</label>
              <input type="text" value={healthForm.treatment} onChange={e => setHealthForm({ ...healthForm, treatment: e.target.value })} />
              <label>Diagnosis</label>
              <input type="text" value={healthForm.diagnosis} onChange={e => setHealthForm({ ...healthForm, diagnosis: e.target.value })} />
              <label>Medication</label>
              <input type="text" value={healthForm.medication} onChange={e => setHealthForm({ ...healthForm, medication: e.target.value })} />
              <label>Dosage</label>
              <input type="text" value={healthForm.dosage} onChange={e => setHealthForm({ ...healthForm, dosage: e.target.value })} />
              <label>Veterinarian</label>
              <input type="text" value={healthForm.veterinarian} onChange={e => setHealthForm({ ...healthForm, veterinarian: e.target.value })} />
              <label>Cost</label>
              <input type="number" value={healthForm.cost} onChange={e => setHealthForm({ ...healthForm, cost: e.target.value })} />
              <label>Notes</label>
              <input type="text" value={healthForm.notes} onChange={e => setHealthForm({ ...healthForm, notes: e.target.value })} />
              <div style={{display:'flex',gap:8,marginTop:8}}>
                <label><input type="checkbox" checked={healthForm.recurring} onChange={e => setHealthForm(f => ({...f, recurring: e.target.checked}))}/> Recurring</label>
                {healthForm.recurring && (
                  <>
                    <input type="number" min="1" placeholder="Interval" value={healthForm.recurrenceInterval} onChange={e => setHealthForm(f => ({...f, recurrenceInterval: e.target.value}))} style={{width:60}} />
                    <select value={healthForm.recurrenceUnit} onChange={e => setHealthForm(f => ({...f, recurrenceUnit: e.target.value}))}>
                      <option value="days">Days</option>
                      <option value="weeks">Weeks</option>
                      <option value="months">Months</option>
                    </select>
                  </>
                )}
                <input type="text" placeholder="Vaccination Schedule (e.g. FMD, BQ)" value={healthForm.vaccinationSchedule} onChange={e => setHealthForm(f => ({...f, vaccinationSchedule: e.target.value}))} />
                <input type="number" min="0" placeholder="Alert Before (days)" value={healthForm.alertBeforeDays} onChange={e => setHealthForm(f => ({...f, alertBeforeDays: e.target.value}))} style={{width:80}} />
              </div>
              <button type="submit" style={{ marginTop: 12, background: '#22c55e', color: 'white', padding: '8px 16px', border: 'none', borderRadius: 4 }}>{editingHealthId ? 'Update' : 'Add'} Health</button>
              {editingHealthId && <button type="button" onClick={cancelEditHealth} style={{ marginLeft: 8 }}>Cancel</button>}
            </form>
            <div style={{ maxHeight: 300, overflowY: 'auto' }}>
              {healthRecords.length === 0 ? (
                <div style={{ color: '#888', textAlign: 'center', padding: 32 }}>No health records found.</div>
              ) : (
                healthRecords.map(record => {
                  const calf = calves.find(c => c.id === record.calfId)
                  return (
                    <div key={record.id} style={{ borderBottom: '1px solid #eee', padding: 12 }}>
                      <strong>{calf ? calf.name : 'Unknown Calf'}</strong> | {record.date} | {record.type} | {record.treatment} | {record.diagnosis}
                      {record.recurring && <span style={{marginLeft:8,color:'#0a0'}}>Recurring: every {record.recurrenceInterval} {record.recurrenceUnit}</span>}
                      {record.vaccinationSchedule && <span style={{marginLeft:8,color:'#06c'}}>Vaccine: {record.vaccinationSchedule}</span>}
                      {record.alertBeforeDays ? <span style={{marginLeft:8,color:'#c60'}}>Alert {record.alertBeforeDays}d before</span> : null}
                      <span style={{ marginLeft: 8, color: '#888' }}>{record.notes}</span>
                      <button style={{ marginLeft: 12 }} onClick={() => startEditHealth(record)}>Edit</button>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}
      </section>
    </ErrorBoundary>
  )
}

export default CalfManagement

