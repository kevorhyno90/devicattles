import React, { useState, useEffect } from 'react'

export default function PoultryManagement() {
  const POULTRY_KEY = 'cattalytics:poultry'
  const EGG_PRODUCTION_KEY = 'cattalytics:egg_production'
  const FLOCK_KEY = 'cattalytics:flocks'
  const POULTRY_HEALTH_KEY = 'cattalytics:poultry_health'
  const POULTRY_VACCINATION_KEY = 'cattalytics:poultry_vaccination'
  const POULTRY_TREATMENT_KEY = 'cattalytics:poultry_treatment'

  const SAMPLE_FLOCKS = [
    { id: 'FL-001', name: 'Layer Flock A', type: 'Layers', breed: 'ISA Brown', quantity: 500, dateStarted: '2024-01-15', status: 'Active', notes: 'Main egg production flock' },
    { id: 'FL-002', name: 'Broiler Batch 1', type: 'Broilers', breed: 'Cobb 500', quantity: 1000, dateStarted: '2024-10-01', status: 'Active', notes: 'Ready for market in 3 weeks' }
  ]

  const SAMPLE_VACCINATIONS = [
    { id: 'VAC-001', date: '2024-01-20', flockId: 'FL-001', vaccineName: 'Newcastle Disease', method: 'Drinking Water', dosage: '1000 doses', administeredBy: 'Dr. Smith', nextDueDate: '2024-04-20', notes: 'All birds vaccinated successfully' },
    { id: 'VAC-002', date: '2024-10-05', flockId: 'FL-002', vaccineName: 'Infectious Bronchitis', method: 'Spray', dosage: '1000 doses', administeredBy: 'Farm Staff', nextDueDate: '2024-11-05', notes: '' }
  ]

  const SAMPLE_HEALTH_RECORDS = [
    { id: 'HR-001', date: '2024-11-15', flockId: 'FL-001', issue: 'Respiratory symptoms', affectedBirds: 15, severity: 'Moderate', action: 'Isolated affected birds, consulted vet', status: 'Under Treatment', notes: 'Monitoring closely' }
  ]

  const SAMPLE_TREATMENTS = [
    { id: 'TRT-001', date: '2024-11-16', flockId: 'FL-001', condition: 'Respiratory infection', medication: 'Tylosin', dosage: '50mg/L in water', duration: '5 days', administeredBy: 'Farm Staff', cost: 2500, notes: 'Treatment ongoing' }
  ]

  const SAMPLE_BIRDS = [
    { id: 'P-001', flockId: 'FL-001', tag: 'L-001', type: 'Layer', breed: 'ISA Brown', sex: 'F', dateOfBirth: '2023-12-01', weight: 1.8, status: 'Active', notes: 'High producer' },
    { id: 'P-002', flockId: 'FL-002', tag: 'B-001', type: 'Broiler', breed: 'Cobb 500', sex: 'M', dateOfBirth: '2024-10-01', weight: 2.5, status: 'Active', notes: '' }
  ]

  const SAMPLE_EGG_RECORDS = [
    { id: 'EGG-001', date: '2024-11-20', flockId: 'FL-001', eggsCollected: 450, broken: 5, dirty: 10, grade: 'A', notes: 'Good production day' },
    { id: 'EGG-002', date: '2024-11-19', flockId: 'FL-001', eggsCollected: 440, broken: 8, dirty: 12, grade: 'A', notes: '' }
  ]

  const [subtab, setSubtab] = useState('flocks')
  const [flocks, setFlocks] = useState([])
  const [birds, setBirds] = useState([])
  const [eggRecords, setEggRecords] = useState([])
  const [vaccinations, setVaccinations] = useState([])
  const [healthRecords, setHealthRecords] = useState([])
  const [treatments, setTreatments] = useState([])
  
  // Flock form
  const [flockForm, setFlockForm] = useState({
    id: '', name: '', type: 'Layers', breed: '', quantity: '', dateStarted: '', status: 'Active', notes: ''
  })
  const [editingFlockId, setEditingFlockId] = useState(null)

  // Bird form
  const [birdForm, setBirdForm] = useState({
    id: '', flockId: '', tag: '', type: 'Layer', breed: '', sex: 'F', dateOfBirth: '', weight: '', status: 'Active', notes: ''
  })
  const [editingBirdId, setEditingBirdId] = useState(null)

  // Egg production form
  const [eggForm, setEggForm] = useState({
    id: '', date: new Date().toISOString().split('T')[0], flockId: '', eggsCollected: '', broken: '', dirty: '', grade: 'A', notes: ''
  })
  const [editingEggId, setEditingEggId] = useState(null)

  // Mortality tracking
  const [mortalityForm, setMortalityForm] = useState({
    date: new Date().toISOString().split('T')[0], flockId: '', count: '', cause: '', notes: ''
  })

  // Vaccination form
  const [vaccinationForm, setVaccinationForm] = useState({
    id: '', date: new Date().toISOString().split('T')[0], flockId: '', vaccineName: '', method: 'Drinking Water', 
    dosage: '', administeredBy: '', nextDueDate: '', cost: '', notes: ''
  })
  const [editingVaccinationId, setEditingVaccinationId] = useState(null)

  // Health record form
  const [healthForm, setHealthForm] = useState({
    id: '', date: new Date().toISOString().split('T')[0], flockId: '', issue: '', affectedBirds: '', 
    severity: 'Moderate', action: '', status: 'Under Observation', cost: '', notes: ''
  })
  const [editingHealthId, setEditingHealthId] = useState(null)

  // Treatment form
  const [treatmentForm, setTreatmentForm] = useState({
    id: '', date: new Date().toISOString().split('T')[0], flockId: '', condition: '', medication: '', 
    dosage: '', duration: '', administeredBy: '', cost: '', notes: ''
  })
  const [editingTreatmentId, setEditingTreatmentId] = useState(null)

  // Inline edit state
  const [inlineEditId, setInlineEditId] = useState(null)
  const [inlineData, setInlineData] = useState({})
  const [toast, setToast] = useState(null)
  const [lastChange, setLastChange] = useState(null)

  // Load data
  useEffect(() => {
    try {
      const storedFlocks = localStorage.getItem(FLOCK_KEY)
      const storedBirds = localStorage.getItem(POULTRY_KEY)
      const storedEggs = localStorage.getItem(EGG_PRODUCTION_KEY)
      const storedVaccinations = localStorage.getItem(POULTRY_VACCINATION_KEY)
      const storedHealth = localStorage.getItem(POULTRY_HEALTH_KEY)
      const storedTreatments = localStorage.getItem(POULTRY_TREATMENT_KEY)
      
      setFlocks(storedFlocks ? JSON.parse(storedFlocks) : SAMPLE_FLOCKS)
      setBirds(storedBirds ? JSON.parse(storedBirds) : SAMPLE_BIRDS)
      setEggRecords(storedEggs ? JSON.parse(storedEggs) : SAMPLE_EGG_RECORDS)
      setVaccinations(storedVaccinations ? JSON.parse(storedVaccinations) : SAMPLE_VACCINATIONS)
      setHealthRecords(storedHealth ? JSON.parse(storedHealth) : SAMPLE_HEALTH_RECORDS)
      setTreatments(storedTreatments ? JSON.parse(storedTreatments) : SAMPLE_TREATMENTS)
    } catch (err) {
      setFlocks(SAMPLE_FLOCKS)
      setBirds(SAMPLE_BIRDS)
      setEggRecords(SAMPLE_EGG_RECORDS)
      setVaccinations(SAMPLE_VACCINATIONS)
      setHealthRecords(SAMPLE_HEALTH_RECORDS)
      setTreatments(SAMPLE_TREATMENTS)
    }
  }, [])

  // Save data
  useEffect(() => localStorage.setItem(FLOCK_KEY, JSON.stringify(flocks)), [flocks])
  useEffect(() => localStorage.setItem(POULTRY_KEY, JSON.stringify(birds)), [birds])
  useEffect(() => localStorage.setItem(EGG_PRODUCTION_KEY, JSON.stringify(eggRecords)), [eggRecords])
  useEffect(() => localStorage.setItem(POULTRY_VACCINATION_KEY, JSON.stringify(vaccinations)), [vaccinations])
  useEffect(() => localStorage.setItem(POULTRY_HEALTH_KEY, JSON.stringify(healthRecords)), [healthRecords])
  useEffect(() => localStorage.setItem(POULTRY_TREATMENT_KEY, JSON.stringify(treatments)), [treatments])

  // Flock management
  function saveFlock(e) {
    e.preventDefault()
    if (!flockForm.name || !flockForm.breed || !flockForm.quantity) {
      alert('Please fill in all required fields')
      return
    }

    if (editingFlockId) {
      setFlocks(flocks.map(f => f.id === editingFlockId ? { ...flockForm, id: editingFlockId } : f))
      setEditingFlockId(null)
    } else {
      const newFlock = { ...flockForm, id: `FL-${Date.now()}` }
      setFlocks([...flocks, newFlock])
    }
    
    setFlockForm({ id: '', name: '', type: 'Layers', breed: '', quantity: '', dateStarted: '', status: 'Active', notes: '' })
  }

  function editFlock(flock) {
    setFlockForm(flock)
    setEditingFlockId(flock.id)
    setSubtab('flocks')
  }

  function deleteFlock(id) {
    if (confirm('Delete this flock? This will also remove associated birds and egg records.')) {
      setFlocks(flocks.filter(f => f.id !== id))
      setBirds(birds.filter(b => b.flockId !== id))
      setEggRecords(eggRecords.filter(e => e.flockId !== id))
    }
  }

  // Bird management
  function saveBird(e) {
    e.preventDefault()
    if (!birdForm.flockId || !birdForm.type || !birdForm.breed) {
      alert('Please fill in all required fields')
      return
    }

    if (editingBirdId) {
      setBirds(birds.map(b => b.id === editingBirdId ? { ...birdForm, id: editingBirdId } : b))
      setEditingBirdId(null)
    } else {
      const newBird = { ...birdForm, id: `P-${Date.now()}` }
      setBirds([...birds, newBird])
    }
    
    setBirdForm({ id: '', flockId: '', tag: '', type: 'Layer', breed: '', sex: 'F', dateOfBirth: '', weight: '', status: 'Active', notes: '' })
  }

  function editBird(bird) {
    setBirdForm(bird)
    setEditingBirdId(bird.id)
    setSubtab('birds')
  }

  function deleteBird(id) {
    if (confirm('Delete this bird record?')) {
      setBirds(birds.filter(b => b.id !== id))
    }
  }

  // Egg production management
  function saveEggRecord(e) {
    e.preventDefault()
    if (!eggForm.date || !eggForm.flockId || !eggForm.eggsCollected) {
      alert('Please fill in all required fields')
      return
    }

    if (editingEggId) {
      setEggRecords(eggRecords.map(r => r.id === editingEggId ? { ...eggForm, id: editingEggId } : r))
      setEditingEggId(null)
    } else {
      const newRecord = { ...eggForm, id: `EGG-${Date.now()}` }
      setEggRecords([...eggRecords, newRecord])
    }
    
    setEggForm({ id: '', date: new Date().toISOString().split('T')[0], flockId: '', eggsCollected: '', broken: '', dirty: '', grade: 'A', notes: '' })
  }

  function editEggRecord(record) {
    setEggForm(record)
    setEditingEggId(record.id)
    setSubtab('eggs')
  }

  function deleteEggRecord(id) {
    if (confirm('Delete this egg production record?')) {
      setEggRecords(eggRecords.filter(r => r.id !== id))
    }
  }

  // Mortality tracking
  function recordMortality(e) {
    e.preventDefault()
    if (!mortalityForm.flockId || !mortalityForm.count) {
      alert('Please select a flock and enter mortality count')
      return
    }

    const flock = flocks.find(f => f.id === mortalityForm.flockId)
    if (flock) {
      const newQuantity = Math.max(0, Number(flock.quantity) - Number(mortalityForm.count))
      setFlocks(flocks.map(f => f.id === mortalityForm.flockId ? { ...f, quantity: newQuantity } : f))
      
      alert(`Mortality recorded. ${flock.name} updated: ${flock.quantity} → ${newQuantity} birds`)
      setMortalityForm({ date: new Date().toISOString().split('T')[0], flockId: '', count: '', cause: '', notes: '' })
    }
  }

  // Vaccination management
  function saveVaccination(e) {
    e.preventDefault()
    if (!vaccinationForm.date || !vaccinationForm.flockId || !vaccinationForm.vaccineName) {
      alert('Please fill in all required fields')
      return
    }

    const flock = flocks.find(f => f.id === vaccinationForm.flockId)
    const isNew = !editingVaccinationId

    if (editingVaccinationId) {
      setVaccinations(vaccinations.map(v => v.id === editingVaccinationId ? { ...vaccinationForm, id: editingVaccinationId } : v))
      setEditingVaccinationId(null)
    } else {
      const newVaccination = { ...vaccinationForm, id: `VAC-${Date.now()}` }
      setVaccinations([...vaccinations, newVaccination])
    }

    // Add to Finance if there's a cost
    if (isNew && vaccinationForm.cost && Number(vaccinationForm.cost) > 0) {
      try {
        const financeRecords = JSON.parse(localStorage.getItem('cattalytics:finance') || '[]')
        const newExpense = {
          id: `FIN-VAC-${Date.now()}`,
          date: vaccinationForm.date,
          type: 'Expense',
          category: 'Poultry Health',
          subcategory: 'Vaccination',
          amount: Number(vaccinationForm.cost),
          description: `${vaccinationForm.vaccineName} vaccination for ${flock?.name || 'flock'} (${vaccinationForm.method})`,
          paymentMethod: 'Cash',
          notes: vaccinationForm.notes || ''
        }
        financeRecords.push(newExpense)
        localStorage.setItem('cattalytics:finance', JSON.stringify(financeRecords))
        window.dispatchEvent(new Event('financeUpdated'))
      } catch (err) {
        console.error('Failed to add vaccination cost to finance:', err)
      }
    }
    
    setVaccinationForm({ id: '', date: new Date().toISOString().split('T')[0], flockId: '', vaccineName: '', method: 'Drinking Water', dosage: '', administeredBy: '', nextDueDate: '', cost: '', notes: '' })
  }

  function editVaccination(vaccination) {
    setVaccinationForm(vaccination)
    setEditingVaccinationId(vaccination.id)
  }

  function deleteVaccination(id) {
    if (confirm('Delete this vaccination record?')) {
      setVaccinations(vaccinations.filter(v => v.id !== id))
    }
  }

  // Health record management
  function saveHealthRecord(e) {
    e.preventDefault()
    if (!healthForm.date || !healthForm.flockId || !healthForm.issue) {
      alert('Please fill in all required fields')
      return
    }

    const flock = flocks.find(f => f.id === healthForm.flockId)
    const isNew = !editingHealthId

    if (editingHealthId) {
      setHealthRecords(healthRecords.map(h => h.id === editingHealthId ? { ...healthForm, id: editingHealthId } : h))
      setEditingHealthId(null)
    } else {
      const newRecord = { ...healthForm, id: `HR-${Date.now()}` }
      setHealthRecords([...healthRecords, newRecord])
    }

    // Add to Finance if there's a cost
    if (isNew && healthForm.cost && Number(healthForm.cost) > 0) {
      try {
        const financeRecords = JSON.parse(localStorage.getItem('cattalytics:finance') || '[]')
        const newExpense = {
          id: `FIN-HR-${Date.now()}`,
          date: healthForm.date,
          type: 'Expense',
          category: 'Poultry Health',
          subcategory: 'Health Monitoring',
          amount: Number(healthForm.cost),
          description: `Health issue: ${healthForm.issue} in ${flock?.name || 'flock'} (${healthForm.affectedBirds || 'multiple'} birds affected)`,
          paymentMethod: 'Cash',
          notes: healthForm.notes || ''
        }
        financeRecords.push(newExpense)
        localStorage.setItem('cattalytics:finance', JSON.stringify(financeRecords))
        window.dispatchEvent(new Event('financeUpdated'))
      } catch (err) {
        console.error('Failed to add health cost to finance:', err)
      }
    }
    
    setHealthForm({ id: '', date: new Date().toISOString().split('T')[0], flockId: '', issue: '', affectedBirds: '', severity: 'Moderate', action: '', status: 'Under Observation', cost: '', notes: '' })
  }

  function editHealthRecord(record) {
    setHealthForm(record)
    setEditingHealthId(record.id)
  }

  function deleteHealthRecord(id) {
    if (confirm('Delete this health record?')) {
      setHealthRecords(healthRecords.filter(h => h.id !== id))
    }
  }

  // Treatment management
  function saveTreatment(e) {
    e.preventDefault()
    if (!treatmentForm.date || !treatmentForm.flockId || !treatmentForm.condition || !treatmentForm.medication) {
      alert('Please fill in all required fields')
      return
    }

    const flock = flocks.find(f => f.id === treatmentForm.flockId)
    const isNew = !editingTreatmentId

    if (editingTreatmentId) {
      setTreatments(treatments.map(t => t.id === editingTreatmentId ? { ...treatmentForm, id: editingTreatmentId } : t))
      setEditingTreatmentId(null)
    } else {
      const newTreatment = { ...treatmentForm, id: `TRT-${Date.now()}` }
      setTreatments([...treatments, newTreatment])
    }

    // Add to Finance if there's a cost
    if (isNew && treatmentForm.cost && Number(treatmentForm.cost) > 0) {
      try {
        const financeRecords = JSON.parse(localStorage.getItem('cattalytics:finance') || '[]')
        const newExpense = {
          id: `FIN-TRT-${Date.now()}`,
          date: treatmentForm.date,
          type: 'Expense',
          category: 'Poultry Health',
          subcategory: 'Treatment',
          amount: Number(treatmentForm.cost),
          description: `Treatment: ${treatmentForm.medication} for ${treatmentForm.condition} in ${flock?.name || 'flock'}`,
          paymentMethod: 'Cash',
          notes: treatmentForm.notes || ''
        }
        financeRecords.push(newExpense)
        localStorage.setItem('cattalytics:finance', JSON.stringify(financeRecords))
        window.dispatchEvent(new Event('financeUpdated'))
      } catch (err) {
        console.error('Failed to add treatment cost to finance:', err)
      }
    }
    
    setTreatmentForm({ id: '', date: new Date().toISOString().split('T')[0], flockId: '', condition: '', medication: '', dosage: '', duration: '', administeredBy: '', cost: '', notes: '' })
  }

  function editTreatment(treatment) {
    setTreatmentForm(treatment)
    setEditingTreatmentId(treatment.id)
  }

  function deleteTreatment(id) {
    if (confirm('Delete this treatment record?')) {
      setTreatments(treatments.filter(t => t.id !== id))
    }
  }

  // Inline edit functions
  function startInlineEdit(item, type) {
    setInlineEditId(item.id)
    setInlineData({ ...item })
    setLastChange({ item, type })
  }

  function saveInlineEdit() {
    if (!inlineData.name || !inlineData.name.trim()) {
      setToast({ type: 'error', message: 'Name is required' })
      return
    }
    
    if (lastChange?.type === 'flock') {
      setFlocks(flocks.map(f => f.id === inlineEditId ? inlineData : f))
    } else if (lastChange?.type === 'bird') {
      setBirds(birds.map(b => b.id === inlineEditId ? inlineData : b))
    } else if (lastChange?.type === 'egg') {
      setEggRecords(eggRecords.map(e => e.id === inlineEditId ? inlineData : e))
    } else if (lastChange?.type === 'vaccination') {
      setVaccinations(vaccinations.map(v => v.id === inlineEditId ? inlineData : v))
    } else if (lastChange?.type === 'health') {
      setHealthRecords(healthRecords.map(h => h.id === inlineEditId ? inlineData : h))
    } else if (lastChange?.type === 'treatment') {
      setTreatments(treatments.map(t => t.id === inlineEditId ? inlineData : t))
    }
    
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
    
    if (lastChange.type === 'flock') {
      setFlocks(flocks.map(f => f.id === inlineEditId ? lastChange.item : f))
    } else if (lastChange.type === 'bird') {
      setBirds(birds.map(b => b.id === inlineEditId ? lastChange.item : b))
    } else if (lastChange.type === 'egg') {
      setEggRecords(eggRecords.map(e => e.id === inlineEditId ? lastChange.item : e))
    } else if (lastChange.type === 'vaccination') {
      setVaccinations(vaccinations.map(v => v.id === inlineEditId ? lastChange.item : v))
    } else if (lastChange.type === 'health') {
      setHealthRecords(healthRecords.map(h => h.id === inlineEditId ? lastChange.item : h))
    } else if (lastChange.type === 'treatment') {
      setTreatments(treatments.map(t => t.id === inlineEditId ? lastChange.item : t))
    }
    
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

  // Statistics calculations
  const totalBirds = flocks.reduce((sum, f) => sum + Number(f.quantity || 0), 0)
  const activeFlocks = flocks.filter(f => f.status === 'Active').length
  const totalEggsToday = eggRecords
    .filter(r => r.date === new Date().toISOString().split('T')[0])
    .reduce((sum, r) => sum + Number(r.eggsCollected || 0), 0)
  const avgEggProduction = eggRecords.length > 0
    ? Math.round(eggRecords.reduce((sum, r) => sum + Number(r.eggsCollected || 0), 0) / eggRecords.length)
    : 0

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '8px', color: 'inherit' }}>🐔 Poultry Management</h3>
        <p style={{ color: 'var(--muted)', margin: 0 }}>Comprehensive flock management, egg production tracking, and health monitoring</p>
      </div>

      {/* Statistics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '16px', textAlign: 'center', background: '#fef3c7' }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#f59e0b' }}>{totalBirds}</div>
          <div style={{ fontSize: '14px', color: '#92400e' }}>Total Birds</div>
        </div>
        <div className="card" style={{ padding: '16px', textAlign: 'center', background: '#dbeafe' }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#2563eb' }}>{activeFlocks}</div>
          <div style={{ fontSize: '14px', color: '#1e3a8a' }}>Active Flocks</div>
        </div>
        <div className="card" style={{ padding: '16px', textAlign: 'center', background: '#fce7f3' }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#ec4899' }}>{totalEggsToday}</div>
          <div style={{ fontSize: '14px', color: '#831843' }}>Eggs Today</div>
        </div>
        <div className="card" style={{ padding: '16px', textAlign: 'center', background: '#f0fdf4' }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#059669' }}>{avgEggProduction}</div>
          <div style={{ fontSize: '14px', color: '#065f46' }}>Avg. Daily Eggs</div>
        </div>
      </div>

      {/* Sub-tabs */}
      <div style={{ borderBottom: '2px solid #e5e7eb', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {[
            { key: 'flocks', label: '🐓 Flocks', color: '#fbbf24' },
            { key: 'birds', label: '🐤 Individual Birds', color: '#60a5fa' },
            { key: 'eggs', label: '🥚 Egg Production', color: '#f472b6' },
            { key: 'health', label: '🏥 Health System', color: '#10b981' },
            { key: 'vaccinations', label: '💉 Vaccinations', color: '#8b5cf6' },
            { key: 'treatments', label: '💊 Treatments', color: '#f59e0b' },
            { key: 'mortality', label: '💀 Mortality', color: '#ef4444' }
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setSubtab(t.key)}
              style={{
                padding: '12px 20px',
                border: 'none',
                borderBottom: subtab === t.key ? `3px solid ${t.color}` : '3px solid transparent',
                background: subtab === t.key ? `${t.color}20` : 'transparent',
                color: subtab === t.key ? t.color : '#6b7280',
                fontWeight: subtab === t.key ? '600' : '400',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Flock Management */}
      {subtab === 'flocks' && (
        <div>
          <div className="card" style={{ padding: '20px', marginBottom: '20px' }}>
            <h4 style={{ marginTop: 0, marginBottom: '16px' }}>{editingFlockId ? 'Edit Flock' : 'Add New Flock'}</h4>
            <form onSubmit={saveFlock}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <label>
                  Flock Name *
                  <input
                    value={flockForm.name}
                    onChange={e => setFlockForm({ ...flockForm, name: e.target.value })}
                    placeholder="e.g., Layer Flock A"
                    required
                  />
                </label>
                <label>
                  Type *
                  <select
                    value={flockForm.type}
                    onChange={e => setFlockForm({ ...flockForm, type: e.target.value })}
                    required
                  >
                    <option value="Layers">Layers (Egg Production)</option>
                    <option value="Broilers">Broilers (Meat Production)</option>
                    <option value="Breeders">Breeders</option>
                    <option value="Mixed">Mixed</option>
                  </select>
                </label>
                <label>
                  Breed *
                  <input
                    value={flockForm.breed}
                    onChange={e => setFlockForm({ ...flockForm, breed: e.target.value })}
                    placeholder="e.g., ISA Brown, Cobb 500"
                    required
                  />
                </label>
                <label>
                  Quantity (Number of Birds) *
                  <input
                    type="number"
                    value={flockForm.quantity}
                    onChange={e => setFlockForm({ ...flockForm, quantity: e.target.value })}
                    min="1"
                    required
                  />
                </label>
                <label>
                  Date Started
                  <input
                    type="date"
                    value={flockForm.dateStarted}
                    onChange={e => setFlockForm({ ...flockForm, dateStarted: e.target.value })}
                  />
                </label>
                <label>
                  Status
                  <select
                    value={flockForm.status}
                    onChange={e => setFlockForm({ ...flockForm, status: e.target.value })}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Sold">Sold</option>
                    <option value="Culled">Culled</option>
                  </select>
                </label>
                <label style={{ gridColumn: '1 / -1' }}>
                  Notes
                  <textarea
                    value={flockForm.notes}
                    onChange={e => setFlockForm({ ...flockForm, notes: e.target.value })}
                    rows={2}
                  />
                </label>
              </div>
              <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                <button type="submit" style={{ background: '#fbbf24', color: '#fff', padding: '10px 20px', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>
                  {editingFlockId ? 'Update Flock' : 'Add Flock'}
                </button>
                {editingFlockId && (
                  <button
                    type="button"
                    onClick={() => {
                      setFlockForm({ id: '', name: '', type: 'Layers', breed: '', quantity: '', dateStarted: '', status: 'Active', notes: '' })
                      setEditingFlockId(null)
                    }}
                    style={{ padding: '10px 20px', background: '#6b7280', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Flock List */}
          <h4 style={{ marginBottom: '16px' }}>Flocks ({flocks.length})</h4>
          <div style={{ display: 'grid', gap: '12px' }}>
            {flocks.map(flock => (
              <div key={flock.id} className="card" style={{ padding: '16px' }}>
                {inlineEditId === flock.id ? (
                  <div onKeyDown={handleKeyDown} style={{ display: 'grid', gap: '12px' }}>
                    <input type="text" placeholder="Flock Name" value={inlineData.name || ''} onChange={e => setInlineData({ ...inlineData, name: e.target.value })} style={{ padding: '8px', border: '1px solid #ddd', borderRadius: 4 }} />
                    <input type="text" placeholder="Breed" value={inlineData.breed || ''} onChange={e => setInlineData({ ...inlineData, breed: e.target.value })} style={{ padding: '8px', border: '1px solid #ddd', borderRadius: 4 }} />
                    <input type="number" placeholder="Quantity" value={inlineData.quantity || ''} onChange={e => setInlineData({ ...inlineData, quantity: e.target.value })} style={{ padding: '8px', border: '1px solid #ddd', borderRadius: 4 }} />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button type="button" onClick={saveInlineEdit} style={{ padding: '8px 16px', background: '#059669', color: '#fff', borderRadius: 4, cursor: 'pointer', flex: 1 }}>Save</button>
                      <button type="button" onClick={cancelInlineEdit} style={{ padding: '8px 16px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: 4, cursor: 'pointer', flex: 1 }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', fontWeight: '600' }}>
                        {flock.name} ({flock.type})
                      </h4>
                      <div style={{ fontSize: '0.9rem', color: '#666', display: 'grid', gap: '4px' }}>
                        <div><strong>Breed:</strong> {flock.breed}</div>
                        <div><strong>Quantity:</strong> {flock.quantity} birds</div>
                        <div><strong>Started:</strong> {flock.dateStarted || 'N/A'}</div>
                        <div><strong>Status:</strong> <span style={{ 
                          padding: '2px 8px', 
                          borderRadius: '4px', 
                          fontSize: '12px',
                          background: flock.status === 'Active' ? '#d1fae5' : '#fee2e2',
                          color: flock.status === 'Active' ? '#065f46' : '#991b1b'
                        }}>{flock.status}</span></div>
                        {flock.notes && <div><strong>Notes:</strong> {flock.notes}</div>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => startInlineEdit(flock, 'flock')}
                        style={{ padding: '6px 12px', fontSize: '0.85rem', background: '#ffffcc', border: '1px solid #ffdd00', borderRadius: '6px', cursor: 'pointer' }}
                      >
                        ⚡ Quick
                      </button>
                      <button
                        onClick={() => editFlock(flock)}
                        style={{ padding: '6px 12px', fontSize: '0.85rem', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer' }}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => deleteFlock(flock.id)}
                        style={{ padding: '6px 12px', fontSize: '0.85rem', background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca', borderRadius: '6px', cursor: 'pointer' }}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Individual Birds */}
      {subtab === 'birds' && (
        <div>
          <div className="card" style={{ padding: '20px', marginBottom: '20px' }}>
            <h4 style={{ marginTop: 0, marginBottom: '16px' }}>{editingBirdId ? 'Edit Bird' : 'Add Individual Bird'}</h4>
            <form onSubmit={saveBird}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <label>
                  Flock *
                  <select
                    value={birdForm.flockId}
                    onChange={e => setBirdForm({ ...birdForm, flockId: e.target.value })}
                    required
                  >
                    <option value="">Select Flock</option>
                    {flocks.map(f => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Tag/ID
                  <input
                    value={birdForm.tag}
                    onChange={e => setBirdForm({ ...birdForm, tag: e.target.value })}
                    placeholder="e.g., L-001"
                  />
                </label>
                <label>
                  Type *
                  <select
                    value={birdForm.type}
                    onChange={e => setBirdForm({ ...birdForm, type: e.target.value })}
                    required
                  >
                    <option value="Layer">Layer</option>
                    <option value="Broiler">Broiler</option>
                    <option value="Breeder">Breeder</option>
                  </select>
                </label>
                <label>
                  Breed *
                  <input
                    value={birdForm.breed}
                    onChange={e => setBirdForm({ ...birdForm, breed: e.target.value })}
                    placeholder="e.g., ISA Brown"
                    required
                  />
                </label>
                <label>
                  Sex
                  <select
                    value={birdForm.sex}
                    onChange={e => setBirdForm({ ...birdForm, sex: e.target.value })}
                  >
                    <option value="F">Female</option>
                    <option value="M">Male</option>
                  </select>
                </label>
                <label>
                  Date of Birth
                  <input
                    type="date"
                    value={birdForm.dateOfBirth}
                    onChange={e => setBirdForm({ ...birdForm, dateOfBirth: e.target.value })}
                  />
                </label>
                <label>
                  Weight (kg)
                  <input
                    type="number"
                    step="0.1"
                    value={birdForm.weight}
                    onChange={e => setBirdForm({ ...birdForm, weight: e.target.value })}
                  />
                </label>
                <label>
                  Status
                  <select
                    value={birdForm.status}
                    onChange={e => setBirdForm({ ...birdForm, status: e.target.value })}
                  >
                    <option value="Active">Active</option>
                    <option value="Sold">Sold</option>
                    <option value="Deceased">Deceased</option>
                    <option value="Culled">Culled</option>
                  </select>
                </label>
                <label style={{ gridColumn: '1 / -1' }}>
                  Notes
                  <textarea
                    value={birdForm.notes}
                    onChange={e => setBirdForm({ ...birdForm, notes: e.target.value })}
                    rows={2}
                  />
                </label>
              </div>
              <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                <button type="submit" style={{ background: '#60a5fa', color: '#fff', padding: '10px 20px', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>
                  {editingBirdId ? 'Update Bird' : 'Add Bird'}
                </button>
                {editingBirdId && (
                  <button
                    type="button"
                    onClick={() => {
                      setBirdForm({ id: '', flockId: '', tag: '', type: 'Layer', breed: '', sex: 'F', dateOfBirth: '', weight: '', status: 'Active', notes: '' })
                      setEditingBirdId(null)
                    }}
                    style={{ padding: '10px 20px', background: '#6b7280', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Bird List */}
          <h4 style={{ marginBottom: '16px' }}>Individual Birds ({birds.length})</h4>
          <div style={{ display: 'grid', gap: '12px' }}>
            {birds.map(bird => {
              const flock = flocks.find(f => f.id === bird.flockId)
              return (
                <div key={bird.id} className="card" style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', fontWeight: '600' }}>
                        {bird.tag || bird.id} - {bird.type} ({bird.sex === 'F' ? '♀' : '♂'})
                      </h4>
                      <div style={{ fontSize: '0.9rem', color: '#666', display: 'grid', gap: '4px' }}>
                        <div><strong>Flock:</strong> {flock?.name || 'Unknown'}</div>
                        <div><strong>Breed:</strong> {bird.breed}</div>
                        {bird.dateOfBirth && <div><strong>DOB:</strong> {bird.dateOfBirth}</div>}
                        {bird.weight && <div><strong>Weight:</strong> {bird.weight} kg</div>}
                        <div><strong>Status:</strong> {bird.status}</div>
                        {bird.notes && <div><strong>Notes:</strong> {bird.notes}</div>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => editBird(bird)}
                        style={{ padding: '6px 12px', fontSize: '0.85rem', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer' }}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => deleteBird(bird.id)}
                        style={{ padding: '6px 12px', fontSize: '0.85rem', background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca', borderRadius: '6px', cursor: 'pointer' }}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Egg Production */}
      {subtab === 'eggs' && (
        <div>
          <div className="card" style={{ padding: '20px', marginBottom: '20px' }}>
            <h4 style={{ marginTop: 0, marginBottom: '16px' }}>{editingEggId ? 'Edit Egg Record' : 'Record Egg Production'}</h4>
            <form onSubmit={saveEggRecord}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <label>
                  Date *
                  <input
                    type="date"
                    value={eggForm.date}
                    onChange={e => setEggForm({ ...eggForm, date: e.target.value })}
                    required
                  />
                </label>
                <label>
                  Flock *
                  <select
                    value={eggForm.flockId}
                    onChange={e => setEggForm({ ...eggForm, flockId: e.target.value })}
                    required
                  >
                    <option value="">Select Flock</option>
                    {flocks.filter(f => f.type === 'Layers' || f.type === 'Breeders').map(f => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Eggs Collected *
                  <input
                    type="number"
                    value={eggForm.eggsCollected}
                    onChange={e => setEggForm({ ...eggForm, eggsCollected: e.target.value })}
                    min="0"
                    required
                  />
                </label>
                <label>
                  Broken Eggs
                  <input
                    type="number"
                    value={eggForm.broken}
                    onChange={e => setEggForm({ ...eggForm, broken: e.target.value })}
                    min="0"
                  />
                </label>
                <label>
                  Dirty Eggs
                  <input
                    type="number"
                    value={eggForm.dirty}
                    onChange={e => setEggForm({ ...eggForm, dirty: e.target.value })}
                    min="0"
                  />
                </label>
                <label>
                  Grade
                  <select
                    value={eggForm.grade}
                    onChange={e => setEggForm({ ...eggForm, grade: e.target.value })}
                  >
                    <option value="A">Grade A (Excellent)</option>
                    <option value="B">Grade B (Good)</option>
                    <option value="C">Grade C (Fair)</option>
                  </select>
                </label>
                <label style={{ gridColumn: '1 / -1' }}>
                  Notes
                  <textarea
                    value={eggForm.notes}
                    onChange={e => setEggForm({ ...eggForm, notes: e.target.value })}
                    rows={2}
                  />
                </label>
              </div>
              <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                <button type="submit" style={{ background: '#f472b6', color: '#fff', padding: '10px 20px', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>
                  {editingEggId ? 'Update Record' : 'Save Record'}
                </button>
                {editingEggId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEggForm({ id: '', date: new Date().toISOString().split('T')[0], flockId: '', eggsCollected: '', broken: '', dirty: '', grade: 'A', notes: '' })
                      setEditingEggId(null)
                    }}
                    style={{ padding: '10px 20px', background: '#6b7280', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Egg Production List */}
          <h4 style={{ marginBottom: '16px' }}>Production Records ({eggRecords.length})</h4>
          <div style={{ display: 'grid', gap: '12px' }}>
            {eggRecords.sort((a, b) => new Date(b.date) - new Date(a.date)).map(record => {
              const flock = flocks.find(f => f.id === record.flockId)
              const usableEggs = Number(record.eggsCollected) - Number(record.broken || 0) - Number(record.dirty || 0)
              return (
                <div key={record.id} className="card" style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', fontWeight: '600' }}>
                        {record.date} - {flock?.name || 'Unknown Flock'}
                      </h4>
                      <div style={{ fontSize: '0.9rem', color: '#666', display: 'grid', gap: '4px' }}>
                        <div><strong>Collected:</strong> {record.eggsCollected} eggs</div>
                        <div><strong>Broken:</strong> {record.broken || 0} | <strong>Dirty:</strong> {record.dirty || 0}</div>
                        <div><strong>Usable:</strong> {usableEggs} eggs</div>
                        <div><strong>Grade:</strong> {record.grade}</div>
                        {record.notes && <div><strong>Notes:</strong> {record.notes}</div>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => editEggRecord(record)}
                        style={{ padding: '6px 12px', fontSize: '0.85rem', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer' }}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => deleteEggRecord(record.id)}
                        style={{ padding: '6px 12px', fontSize: '0.85rem', background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca', borderRadius: '6px', cursor: 'pointer' }}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Health System */}
      {subtab === 'health' && (
        <div>
          <div className="card" style={{ padding: '20px', marginBottom: '20px' }}>
            <h4 style={{ marginTop: 0, marginBottom: '16px' }}>{editingHealthId ? 'Edit Health Record' : 'Record Health Issue'}</h4>
            <form onSubmit={saveHealthRecord}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <label>
                  Date *
                  <input
                    type="date"
                    value={healthForm.date}
                    onChange={e => setHealthForm({ ...healthForm, date: e.target.value })}
                    required
                  />
                </label>
                <label>
                  Flock *
                  <select
                    value={healthForm.flockId}
                    onChange={e => setHealthForm({ ...healthForm, flockId: e.target.value })}
                    required
                  >
                    <option value="">Select Flock</option>
                    {flocks.map(f => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </label>
                <label style={{ gridColumn: '1 / -1' }}>
                  Health Issue *
                  <input
                    value={healthForm.issue}
                    onChange={e => setHealthForm({ ...healthForm, issue: e.target.value })}
                    placeholder="e.g., Respiratory symptoms, Lethargy, Diarrhea"
                    required
                  />
                </label>
                <label>
                  Affected Birds
                  <input
                    type="number"
                    value={healthForm.affectedBirds}
                    onChange={e => setHealthForm({ ...healthForm, affectedBirds: e.target.value })}
                    min="1"
                    placeholder="Number of birds affected"
                  />
                </label>
                <label>
                  Severity
                  <select
                    value={healthForm.severity}
                    onChange={e => setHealthForm({ ...healthForm, severity: e.target.value })}
                  >
                    <option value="Mild">Mild</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Severe">Severe</option>
                    <option value="Critical">Critical</option>
                  </select>
                </label>
                <label style={{ gridColumn: '1 / -1' }}>
                  Action Taken
                  <textarea
                    value={healthForm.action}
                    onChange={e => setHealthForm({ ...healthForm, action: e.target.value })}
                    rows={2}
                    placeholder="Describe actions taken (isolation, vet consultation, medication, etc.)"
                  />
                </label>
                <label>
                  Status
                  <select
                    value={healthForm.status}
                    onChange={e => setHealthForm({ ...healthForm, status: e.target.value })}
                  >
                    <option value="Under Observation">Under Observation</option>
                    <option value="Under Treatment">Under Treatment</option>
                    <option value="Recovering">Recovering</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Escalated">Escalated</option>
                  </select>
                </label>
                <label>
                  Cost (KSH)
                  <input
                    type="number"
                    step="0.01"
                    value={healthForm.cost}
                    onChange={e => setHealthForm({ ...healthForm, cost: e.target.value })}
                    placeholder="Diagnostic/consultation cost"
                  />
                </label>
                <label style={{ gridColumn: '1 / -1' }}>
                  Notes
                  <textarea
                    value={healthForm.notes}
                    onChange={e => setHealthForm({ ...healthForm, notes: e.target.value })}
                    rows={2}
                  />
                </label>
              </div>
              <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                <button type="submit" style={{ background: '#10b981', color: '#fff', padding: '10px 20px', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>
                  {editingHealthId ? 'Update Record' : 'Save Record'}
                </button>
                {editingHealthId && (
                  <button
                    type="button"
                    onClick={() => {
                      setHealthForm({ id: '', date: new Date().toISOString().split('T')[0], flockId: '', issue: '', affectedBirds: '', severity: 'Moderate', action: '', status: 'Under Observation', cost: '', notes: '' })
                      setEditingHealthId(null)
                    }}
                    style={{ padding: '10px 20px', background: '#6b7280', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Health Records List */}
          <h4 style={{ marginBottom: '16px' }}>Health Records ({healthRecords.length})</h4>
          <div style={{ display: 'grid', gap: '12px' }}>
            {healthRecords.sort((a, b) => new Date(b.date) - new Date(a.date)).map(record => {
              const flock = flocks.find(f => f.id === record.flockId)
              const severityColors = {
                'Mild': { bg: '#d1fae5', text: '#065f46' },
                'Moderate': { bg: '#fef3c7', text: '#92400e' },
                'Severe': { bg: '#fed7aa', text: '#9a3412' },
                'Critical': { bg: '#fee2e2', text: '#991b1b' }
              }
              const statusColors = {
                'Under Observation': { bg: '#dbeafe', text: '#1e3a8a' },
                'Under Treatment': { bg: '#fef3c7', text: '#92400e' },
                'Recovering': { bg: '#e0e7ff', text: '#3730a3' },
                'Resolved': { bg: '#d1fae5', text: '#065f46' },
                'Escalated': { bg: '#fee2e2', text: '#991b1b' }
              }
              return (
                <div key={record.id} className="card" style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', fontWeight: '600' }}>
                        {record.issue}
                      </h4>
                      <div style={{ fontSize: '0.9rem', color: '#666', display: 'grid', gap: '6px' }}>
                        <div><strong>Date:</strong> {record.date} | <strong>Flock:</strong> {flock?.name || 'Unknown'}</div>
                        <div><strong>Affected Birds:</strong> {record.affectedBirds || 'Not specified'}</div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <strong>Severity:</strong>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '600',
                            background: severityColors[record.severity]?.bg || '#f3f4f6',
                            color: severityColors[record.severity]?.text || '#374151'
                          }}>
                            {record.severity}
                          </span>
                          <strong>Status:</strong>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '600',
                            background: statusColors[record.status]?.bg || '#f3f4f6',
                            color: statusColors[record.status]?.text || '#374151'
                          }}>
                            {record.status}
                          </span>
                        </div>
                        {record.action && <div><strong>Action:</strong> {record.action}</div>}
                        {record.cost && <div><strong>Cost:</strong> KSH {Number(record.cost).toLocaleString()}</div>}
                        {record.notes && <div><strong>Notes:</strong> {record.notes}</div>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => editHealthRecord(record)}
                        style={{ padding: '6px 12px', fontSize: '0.85rem', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer' }}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => deleteHealthRecord(record.id)}
                        style={{ padding: '6px 12px', fontSize: '0.85rem', background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca', borderRadius: '6px', cursor: 'pointer' }}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Health Tips */}
          <div className="card" style={{ padding: '20px', marginTop: '20px', background: '#f0fdf4', border: '1px solid #86efac' }}>
            <h4 style={{ marginTop: 0, color: '#065f46' }}>🩺 Health Monitoring Tips</h4>
            <ul style={{ fontSize: '14px', color: '#065f46', margin: 0, paddingLeft: '20px' }}>
              <li>Check birds daily for signs of illness (lethargy, reduced appetite, abnormal droppings)</li>
              <li>Isolate sick birds immediately to prevent disease spread</li>
              <li>Maintain proper ventilation and clean housing conditions</li>
              <li>Keep detailed records of all health issues and treatments</li>
              <li>Consult a veterinarian for serious or recurring health problems</li>
            </ul>
          </div>
        </div>
      )}

      {/* Vaccinations */}
      {subtab === 'vaccinations' && (
        <div>
          <div className="card" style={{ padding: '20px', marginBottom: '20px' }}>
            <h4 style={{ marginTop: 0, marginBottom: '16px' }}>{editingVaccinationId ? 'Edit Vaccination Record' : 'Record Vaccination'}</h4>
            <form onSubmit={saveVaccination}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <label>
                  Date *
                  <input
                    type="date"
                    value={vaccinationForm.date}
                    onChange={e => setVaccinationForm({ ...vaccinationForm, date: e.target.value })}
                    required
                  />
                </label>
                <label>
                  Flock *
                  <select
                    value={vaccinationForm.flockId}
                    onChange={e => setVaccinationForm({ ...vaccinationForm, flockId: e.target.value })}
                    required
                  >
                    <option value="">Select Flock</option>
                    {flocks.map(f => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Vaccine Name *
                  <input
                    value={vaccinationForm.vaccineName}
                    onChange={e => setVaccinationForm({ ...vaccinationForm, vaccineName: e.target.value })}
                    placeholder="e.g., Newcastle Disease, Marek's Disease"
                    required
                  />
                </label>
                <label>
                  Method
                  <select
                    value={vaccinationForm.method}
                    onChange={e => setVaccinationForm({ ...vaccinationForm, method: e.target.value })}
                  >
                    <option value="Drinking Water">Drinking Water</option>
                    <option value="Spray">Spray</option>
                    <option value="Eye Drop">Eye Drop</option>
                    <option value="Injection">Injection (IM/SC)</option>
                    <option value="Wing Web">Wing Web</option>
                  </select>
                </label>
                <label>
                  Dosage
                  <input
                    value={vaccinationForm.dosage}
                    onChange={e => setVaccinationForm({ ...vaccinationForm, dosage: e.target.value })}
                    placeholder="e.g., 1000 doses, 0.5ml per bird"
                  />
                </label>
                <label>
                  Administered By
                  <input
                    value={vaccinationForm.administeredBy}
                    onChange={e => setVaccinationForm({ ...vaccinationForm, administeredBy: e.target.value })}
                    placeholder="e.g., Dr. Smith, Farm Staff"
                  />
                </label>
                <label>
                  Next Due Date
                  <input
                    type="date"
                    value={vaccinationForm.nextDueDate}
                    onChange={e => setVaccinationForm({ ...vaccinationForm, nextDueDate: e.target.value })}
                  />
                </label>
                <label>
                  Cost (KSH)
                  <input
                    type="number"
                    step="0.01"
                    value={vaccinationForm.cost}
                    onChange={e => setVaccinationForm({ ...vaccinationForm, cost: e.target.value })}
                    placeholder="Vaccination cost"
                  />
                </label>
                <label style={{ gridColumn: '1 / -1' }}>
                  Notes
                  <textarea
                    value={vaccinationForm.notes}
                    onChange={e => setVaccinationForm({ ...vaccinationForm, notes: e.target.value })}
                    rows={2}
                    placeholder="Any observations or special notes"
                  />
                </label>
              </div>
              <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                <button type="submit" style={{ background: '#8b5cf6', color: '#fff', padding: '10px 20px', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>
                  {editingVaccinationId ? 'Update Record' : 'Save Record'}
                </button>
                {editingVaccinationId && (
                  <button
                    type="button"
                    onClick={() => {
                      setVaccinationForm({ id: '', date: new Date().toISOString().split('T')[0], flockId: '', vaccineName: '', method: 'Drinking Water', dosage: '', administeredBy: '', nextDueDate: '', cost: '', notes: '' })
                      setEditingVaccinationId(null)
                    }}
                    style={{ padding: '10px 20px', background: '#6b7280', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Vaccination List */}
          <h4 style={{ marginBottom: '16px' }}>Vaccination Records ({vaccinations.length})</h4>
          <div style={{ display: 'grid', gap: '12px' }}>
            {vaccinations.sort((a, b) => new Date(b.date) - new Date(a.date)).map(vac => {
              const flock = flocks.find(f => f.id === vac.flockId)
              const isDue = vac.nextDueDate && new Date(vac.nextDueDate) <= new Date()
              return (
                <div key={vac.id} className="card" style={{ padding: '16px', borderLeft: isDue ? '4px solid #ef4444' : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', fontWeight: '600' }}>
                        {vac.vaccineName}
                        {isDue && <span style={{ marginLeft: '8px', padding: '2px 8px', background: '#fee2e2', color: '#991b1b', borderRadius: '4px', fontSize: '12px', fontWeight: '600' }}>⚠️ Due</span>}
                      </h4>
                      <div style={{ fontSize: '0.9rem', color: '#666', display: 'grid', gap: '4px' }}>
                        <div><strong>Date:</strong> {vac.date} | <strong>Flock:</strong> {flock?.name || 'Unknown'}</div>
                        <div><strong>Method:</strong> {vac.method} | <strong>Dosage:</strong> {vac.dosage || 'N/A'}</div>
                        {vac.administeredBy && <div><strong>Administered By:</strong> {vac.administeredBy}</div>}
                        {vac.nextDueDate && <div><strong>Next Due:</strong> {vac.nextDueDate}</div>}
                        {vac.cost && <div><strong>Cost:</strong> KSH {Number(vac.cost).toLocaleString()}</div>}
                        {vac.notes && <div><strong>Notes:</strong> {vac.notes}</div>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => editVaccination(vac)}
                        style={{ padding: '6px 12px', fontSize: '0.85rem', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer' }}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => deleteVaccination(vac.id)}
                        style={{ padding: '6px 12px', fontSize: '0.85rem', background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca', borderRadius: '6px', cursor: 'pointer' }}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Vaccination Schedule Info */}
          <div className="card" style={{ padding: '20px', marginTop: '20px', background: '#ede9fe', border: '1px solid #c4b5fd' }}>
            <h4 style={{ marginTop: 0, color: '#5b21b6' }}>💉 Common Poultry Vaccination Schedule</h4>
            <div style={{ fontSize: '14px', color: '#5b21b6' }}>
              <p style={{ margin: '0 0 8px 0' }}><strong>Layers:</strong></p>
              <ul style={{ margin: '0 0 12px 0', paddingLeft: '20px' }}>
                <li>Day 1: Marek's Disease</li>
                <li>Day 7: Newcastle Disease + Infectious Bronchitis</li>
                <li>Day 14: Gumboro Disease</li>
                <li>Week 6-8: Newcastle (booster)</li>
                <li>Week 16: Fowl Pox, Fowl Cholera</li>
              </ul>
              <p style={{ margin: '0 0 8px 0' }}><strong>Broilers:</strong></p>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                <li>Day 1: Marek's Disease</li>
                <li>Day 7: Newcastle + IB</li>
                <li>Day 14: Gumboro</li>
                <li>Day 21: Newcastle (booster)</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Treatments */}
      {subtab === 'treatments' && (
        <div>
          <div className="card" style={{ padding: '20px', marginBottom: '20px' }}>
            <h4 style={{ marginTop: 0, marginBottom: '16px' }}>{editingTreatmentId ? 'Edit Treatment Record' : 'Record Treatment'}</h4>
            <form onSubmit={saveTreatment}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <label>
                  Date *
                  <input
                    type="date"
                    value={treatmentForm.date}
                    onChange={e => setTreatmentForm({ ...treatmentForm, date: e.target.value })}
                    required
                  />
                </label>
                <label>
                  Flock *
                  <select
                    value={treatmentForm.flockId}
                    onChange={e => setTreatmentForm({ ...treatmentForm, flockId: e.target.value })}
                    required
                  >
                    <option value="">Select Flock</option>
                    {flocks.map(f => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Condition/Disease *
                  <input
                    value={treatmentForm.condition}
                    onChange={e => setTreatmentForm({ ...treatmentForm, condition: e.target.value })}
                    placeholder="e.g., Coccidiosis, Respiratory infection"
                    required
                  />
                </label>
                <label>
                  Medication *
                  <input
                    value={treatmentForm.medication}
                    onChange={e => setTreatmentForm({ ...treatmentForm, medication: e.target.value })}
                    placeholder="e.g., Amprolium, Tylosin"
                    required
                  />
                </label>
                <label>
                  Dosage
                  <input
                    value={treatmentForm.dosage}
                    onChange={e => setTreatmentForm({ ...treatmentForm, dosage: e.target.value })}
                    placeholder="e.g., 50mg/L in water"
                  />
                </label>
                <label>
                  Duration
                  <input
                    value={treatmentForm.duration}
                    onChange={e => setTreatmentForm({ ...treatmentForm, duration: e.target.value })}
                    placeholder="e.g., 5 days, 1 week"
                  />
                </label>
                <label>
                  Administered By
                  <input
                    value={treatmentForm.administeredBy}
                    onChange={e => setTreatmentForm({ ...treatmentForm, administeredBy: e.target.value })}
                    placeholder="e.g., Farm Staff, Veterinarian"
                  />
                </label>
                <label>
                  Cost (KES)
                  <input
                    type="number"
                    step="0.01"
                    value={treatmentForm.cost}
                    onChange={e => setTreatmentForm({ ...treatmentForm, cost: e.target.value })}
                    placeholder="Treatment cost"
                  />
                </label>
                <label style={{ gridColumn: '1 / -1' }}>
                  Notes
                  <textarea
                    value={treatmentForm.notes}
                    onChange={e => setTreatmentForm({ ...treatmentForm, notes: e.target.value })}
                    rows={2}
                    placeholder="Treatment details, withdrawal period, response, etc."
                  />
                </label>
              </div>
              <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                <button type="submit" style={{ background: '#f59e0b', color: '#fff', padding: '10px 20px', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>
                  {editingTreatmentId ? 'Update Record' : 'Save Record'}
                </button>
                {editingTreatmentId && (
                  <button
                    type="button"
                    onClick={() => {
                      setTreatmentForm({ id: '', date: new Date().toISOString().split('T')[0], flockId: '', condition: '', medication: '', dosage: '', duration: '', administeredBy: '', cost: '', notes: '' })
                      setEditingTreatmentId(null)
                    }}
                    style={{ padding: '10px 20px', background: '#6b7280', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Treatment List */}
          <h4 style={{ marginBottom: '16px' }}>Treatment Records ({treatments.length})</h4>
          <div style={{ display: 'grid', gap: '12px' }}>
            {treatments.sort((a, b) => new Date(b.date) - new Date(a.date)).map(treatment => {
              const flock = flocks.find(f => f.id === treatment.flockId)
              return (
                <div key={treatment.id} className="card" style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', fontWeight: '600' }}>
                        {treatment.condition} - {treatment.medication}
                      </h4>
                      <div style={{ fontSize: '0.9rem', color: '#666', display: 'grid', gap: '4px' }}>
                        <div><strong>Date:</strong> {treatment.date} | <strong>Flock:</strong> {flock?.name || 'Unknown'}</div>
                        <div><strong>Dosage:</strong> {treatment.dosage || 'N/A'} | <strong>Duration:</strong> {treatment.duration || 'N/A'}</div>
                        {treatment.administeredBy && <div><strong>Administered By:</strong> {treatment.administeredBy}</div>}
                        {treatment.cost && <div><strong>Cost:</strong> KES {Number(treatment.cost).toLocaleString()}</div>}
                        {treatment.notes && <div><strong>Notes:</strong> {treatment.notes}</div>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => editTreatment(treatment)}
                        style={{ padding: '6px 12px', fontSize: '0.85rem', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer' }}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => deleteTreatment(treatment.id)}
                        style={{ padding: '6px 12px', fontSize: '0.85rem', background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca', borderRadius: '6px', cursor: 'pointer' }}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Treatment Tips */}
          <div className="card" style={{ padding: '20px', marginTop: '20px', background: '#fef3c7', border: '1px solid #fde68a' }}>
            <h4 style={{ marginTop: 0, color: '#92400e' }}>💊 Treatment Best Practices</h4>
            <ul style={{ fontSize: '14px', color: '#92400e', margin: 0, paddingLeft: '20px' }}>
              <li>Always follow veterinarian prescriptions and dosage instructions</li>
              <li>Complete the full treatment course even if birds appear recovered</li>
              <li>Observe withdrawal periods before selling eggs or meat</li>
              <li>Keep accurate records of all medications used</li>
              <li>Store medications properly according to label instructions</li>
              <li>Monitor birds closely during and after treatment</li>
            </ul>
          </div>
        </div>
      )}

      {/* Mortality Tracking */}
      {subtab === 'mortality' && (
        <div>
          <div className="card" style={{ padding: '20px', marginBottom: '20px' }}>
            <h4 style={{ marginTop: 0, marginBottom: '16px' }}>Record Mortality</h4>
            <form onSubmit={recordMortality}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <label>
                  Date *
                  <input
                    type="date"
                    value={mortalityForm.date}
                    onChange={e => setMortalityForm({ ...mortalityForm, date: e.target.value })}
                    required
                  />
                </label>
                <label>
                  Flock *
                  <select
                    value={mortalityForm.flockId}
                    onChange={e => setMortalityForm({ ...mortalityForm, flockId: e.target.value })}
                    required
                  >
                    <option value="">Select Flock</option>
                    {flocks.map(f => (
                      <option key={f.id} value={f.id}>{f.name} ({f.quantity} birds)</option>
                    ))}
                  </select>
                </label>
                <label>
                  Number of Deaths *
                  <input
                    type="number"
                    value={mortalityForm.count}
                    onChange={e => setMortalityForm({ ...mortalityForm, count: e.target.value })}
                    min="1"
                    required
                  />
                </label>
                <label>
                  Cause
                  <input
                    value={mortalityForm.cause}
                    onChange={e => setMortalityForm({ ...mortalityForm, cause: e.target.value })}
                    placeholder="e.g., Disease, Predator, Unknown"
                  />
                </label>
                <label style={{ gridColumn: '1 / -1' }}>
                  Notes
                  <textarea
                    value={mortalityForm.notes}
                    onChange={e => setMortalityForm({ ...mortalityForm, notes: e.target.value })}
                    rows={2}
                    placeholder="Additional details about the mortality incident"
                  />
                </label>
              </div>
              <div style={{ marginTop: '16px' }}>
                <button type="submit" style={{ background: '#ef4444', color: '#fff', padding: '10px 20px', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>
                  Record Mortality
                </button>
              </div>
            </form>
          </div>

          <div className="card" style={{ padding: '20px', background: '#fef2f2' }}>
            <h4 style={{ marginTop: 0, color: '#991b1b' }}>💡 Mortality Tracking Info</h4>
            <p style={{ fontSize: '14px', color: '#7f1d1d', margin: 0 }}>
              When you record mortality, the flock quantity will automatically be reduced. 
              This helps maintain accurate bird counts and track mortality rates over time.
            </p>
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

