import React, { useState, useEffect } from 'react'
import DataLayer from '../lib/dataLayer'
import ErrorBoundary from '../components/ErrorBoundary'
import { formatCurrency } from '../lib/currency'
import { addMilkExpense, getMilkTotals } from '../lib/finance'
import { getMilkExpenses } from '../lib/finance'

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
    medication: '', dosage: '', veterinarian: '', cost: '', nextVisit: '', notes: ''
  })

  // Inline edit state
  const [inlineEditId, setInlineEditId] = useState(null)
  const [inlineData, setInlineData] = useState({})

  useEffect(() => {
    async function fetchCalves() {
      if (search.trim()) {
        const results = await DataLayer.createEntity('cattalytics:calf:management', 'Calf').search(search, ['name', 'tag', 'breed', 'status'])
        setCalves(results)
      } else {
        const all = await DataLayer.createEntity('cattalytics:calf:management', 'Calf').getAll()
        setCalves(all)
      }
    }
    fetchCalves()
  }, [search])

  useEffect(() => {
    async function fetchFeeding() {
      const all = await DataLayer.createEntity('cattalytics:calf:feeding', 'Feeding').getAll()
      setFeedingRecords(all)
    }
    fetchFeeding()
  }, [])

  useEffect(() => {
    async function fetchHealth() {
      const all = await DataLayer.createEntity('cattalytics:calf:health', 'Health').getAll()
      setHealthRecords(all)
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

  return (
    <ErrorBoundary>
      <section>
        <h2>Calf Management</h2>
        <div style={{marginTop:12, marginBottom:8}}>
          <input
            type="text"
            placeholder="Search calves by name, tag, breed, status..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '6px 10px', borderRadius: 4, border: '1px solid #ddd' }}
          />
        </div>
        <div style={{marginTop:12, maxHeight:400, overflowY:'auto'}}>
          {calves.map(calf => (
            <div key={calf.id} style={{borderBottom:'1px solid #eee', padding:16}}>
                {/* Render calf details and inline edit logic here */}
                <strong>{calf.name}</strong> <em>({calf.tag})</em> - {calf.breed} - {calf.status}
                {/* ...existing inline edit, delete, etc. buttons... */}
              </div>
          ))}
        </div>
        {/* ...existing forms, feeding, health, and toast logic... */}
      </section>
    </ErrorBoundary>
  )
}

export default CalfManagement

