import React, { useState, useEffect } from 'react'
import DataLayer from '../lib/dataLayer'
import ErrorBoundary from '../components/ErrorBoundary'

export default function PoultryManagement() {
  // DataLayer keys
  const [flocks, setFlocks] = useState([])
  const [birds, setBirds] = useState([])
  const [eggRecords, setEggRecords] = useState([])
  const [vaccinations, setVaccinations] = useState([])
  const [healthRecords, setHealthRecords] = useState([])
  const [treatments, setTreatments] = useState([])
  const [search, setSearch] = useState('')

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
    async function fetchFlocks() {
      if (search.trim()) {
        const results = await DataLayer.createEntity('cattalytics:flocks', 'Flock').search(search, ['name', 'type', 'breed', 'status'])
        setFlocks(results)
      } else {
        const all = await DataLayer.createEntity('cattalytics:flocks', 'Flock').getAll()
        setFlocks(all)
      }
    }
    fetchFlocks()
  }, [search])

  useEffect(() => {
    async function fetchBirds() {
      const all = await DataLayer.createEntity('cattalytics:poultry', 'Bird').getAll()
      setBirds(all)
    }
    fetchBirds()
  }, [])

  useEffect(() => {
    async function fetchEggRecords() {
      const all = await DataLayer.createEntity('cattalytics:egg_production', 'EggRecord').getAll()
      setEggRecords(all)
    }
    fetchEggRecords()
  }, [])

  useEffect(() => {
    async function fetchVaccinations() {
      const all = await DataLayer.createEntity('cattalytics:poultry_vaccination', 'Vaccination').getAll()
      setVaccinations(all)
    }
    fetchVaccinations()
  }, [])

  useEffect(() => {
    async function fetchHealthRecords() {
      const all = await DataLayer.createEntity('cattalytics:poultry_health', 'HealthRecord').getAll()
      setHealthRecords(all)
    }
    fetchHealthRecords()
  }, [])

  useEffect(() => {
    async function fetchTreatments() {
      const all = await DataLayer.createEntity('cattalytics:poultry_treatment', 'Treatment').getAll()
      setTreatments(all)
    }
    fetchTreatments()
  }, [])

  // Flock management
  async function saveFlock(e) {
    e.preventDefault()
    if (!flockForm.name || !flockForm.breed || !flockForm.quantity) {
      alert('Please fill in all required fields')
      return
    }

    if (editingFlockId) {
      await DataLayer.createEntity('cattalytics:flocks', 'Flock').update({ ...flockForm, id: editingFlockId })
      setFlocks(flocks.map(f => f.id === editingFlockId ? { ...flockForm, id: editingFlockId } : f))
      setEditingFlockId(null)
    } else {
      const newFlock = { ...flockForm, id: `FL-${Date.now()}` }
      await DataLayer.createEntity('cattalytics:flocks', 'Flock').create(newFlock)
      setFlocks([...flocks, newFlock])
    }
    
    setFlockForm({ id: '', name: '', type: 'Layers', breed: '', quantity: '', dateStarted: '', status: 'Active', notes: '' })
  }

  function editFlock(flock) {
    setFlockForm(flock)
    setEditingFlockId(flock.id)
    setSubtab('flocks')
  }

  async function deleteFlock(id) {
    if (confirm('Delete this flock? This will also remove associated birds and egg records.')) {
      await DataLayer.createEntity('cattalytics:flocks', 'Flock').delete(id)
      setFlocks(flocks.filter(f => f.id !== id))
      setBirds(birds.filter(b => b.flockId !== id))
      setEggRecords(eggRecords.filter(e => e.flockId !== id))
    }
  }

  // Bird management
  async function saveBird(e) {
    e.preventDefault()
    if (!birdForm.flockId || !birdForm.type || !birdForm.breed) {
      alert('Please fill in all required fields')
      return
    }

    if (editingBirdId) {
      await DataLayer.createEntity('cattalytics:poultry', 'Bird').update({ ...birdForm, id: editingBirdId })
      setBirds(birds.map(b => b.id === editingBirdId ? { ...birdForm, id: editingBirdId } : b))
      setEditingBirdId(null)
    } else {
      const newBird = { ...birdForm, id: `P-${Date.now()}` }
      await DataLayer.createEntity('cattalytics:poultry', 'Bird').create(newBird)
      setBirds([...birds, newBird])
    }
    
    setBirdForm({ id: '', flockId: '', tag: '', type: 'Layer', breed: '', sex: 'F', dateOfBirth: '', weight: '', status: 'Active', notes: '' })
  }

  function editBird(bird) {
    setBirdForm(bird)
    setEditingBirdId(bird.id)
    setSubtab('birds')
  }

  async function deleteBird(id) {
    if (confirm('Delete this bird record?')) {
      await DataLayer.createEntity('cattalytics:poultry', 'Bird').delete(id)
      setBirds(birds.filter(b => b.id !== id))
    }
  }

  // Egg production management
  async function saveEggRecord(e) {
    e.preventDefault()
    if (!eggForm.date || !eggForm.flockId || !eggForm.eggsCollected) {
      alert('Please fill in all required fields')
      return
    }

    if (editingEggId) {
      await DataLayer.createEntity('cattalytics:egg_production', 'EggRecord').update({ ...eggForm, id: editingEggId })
      setEggRecords(eggRecords.map(r => r.id === editingEggId ? { ...eggForm, id: editingEggId } : r))
      setEditingEggId(null)
    } else {
      const newRecord = { ...eggForm, id: `EGG-${Date.now()}` }
      await DataLayer.createEntity('cattalytics:egg_production', 'EggRecord').create(newRecord)
      setEggRecords([...eggRecords, newRecord])
    }
    
    setEggForm({ id: '', date: new Date().toISOString().split('T')[0], flockId: '', eggsCollected: '', broken: '', dirty: '', grade: 'A', notes: '' })
  }

  function editEggRecord(record) {
    setEggForm(record)
    setEditingEggId(record.id)
    setSubtab('eggs')
  }

  async function deleteEggRecord(id) {
    if (confirm('Delete this egg production record?')) {
      await DataLayer.createEntity('cattalytics:egg_production', 'EggRecord').delete(id)
      setEggRecords(eggRecords.filter(r => r.id !== id))
    }
  }

  // Mortality tracking
  async function recordMortality(e) {
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
  async function saveVaccination(e) {
    e.preventDefault()
    if (!vaccinationForm.date || !vaccinationForm.flockId || !vaccinationForm.vaccineName) {
      alert('Please fill in all required fields')
      return
    }

    const flock = flocks.find(f => f.id === vaccinationForm.flockId)
    const isNew = !editingVaccinationId

    if (editingVaccinationId) {
      await DataLayer.createEntity('cattalytics:poultry_vaccination', 'Vaccination').update({ ...vaccinationForm, id: editingVaccinationId })
      setVaccinations(vaccinations.map(v => v.id === editingVaccinationId ? { ...vaccinationForm, id: editingVaccinationId } : v))
      setEditingVaccinationId(null)
    } else {
      const newVaccination = { ...vaccinationForm, id: `VAC-${Date.now()}` }
      await DataLayer.createEntity('cattalytics:poultry_vaccination', 'Vaccination').create(newVaccination)
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

  async function deleteVaccination(id) {
    if (confirm('Delete this vaccination record?')) {
      await DataLayer.createEntity('cattalytics:poultry_vaccination', 'Vaccination').delete(id)
      setVaccinations(vaccinations.filter(v => v.id !== id))
    }
  }

  // Health record management
  async function saveHealthRecord(e) {
    e.preventDefault()
    if (!healthForm.date || !healthForm.flockId || !healthForm.issue) {
      alert('Please fill in all required fields')
      return
    }

    const flock = flocks.find(f => f.id === healthForm.flockId)
    const isNew = !editingHealthId

    if (editingHealthId) {
      await DataLayer.createEntity('cattalytics:poultry_health', 'HealthRecord').update({ ...healthForm, id: editingHealthId })
      setHealthRecords(healthRecords.map(h => h.id === editingHealthId ? { ...healthForm, id: editingHealthId } : h))
      setEditingHealthId(null)
    } else {
      const newRecord = { ...healthForm, id: `HR-${Date.now()}` }
      await DataLayer.createEntity('cattalytics:poultry_health', 'HealthRecord').create(newRecord)
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

  async function deleteHealthRecord(id) {
    if (confirm('Delete this health record?')) {
      await DataLayer.createEntity('cattalytics:poultry_health', 'HealthRecord').delete(id)
      setHealthRecords(healthRecords.filter(h => h.id !== id))
    }
  }

  // Treatment management
  async function saveTreatment(e) {
    e.preventDefault()
    if (!treatmentForm.date || !treatmentForm.flockId || !treatmentForm.condition || !treatmentForm.medication) {
      alert('Please fill in all required fields')
      return
    }

    const flock = flocks.find(f => f.id === treatmentForm.flockId)
    const isNew = !editingTreatmentId

    if (editingTreatmentId) {
      await DataLayer.createEntity('cattalytics:poultry_treatment', 'Treatment').update({ ...treatmentForm, id: editingTreatmentId })
      setTreatments(treatments.map(t => t.id === editingTreatmentId ? { ...treatmentForm, id: editingTreatmentId } : t))
      setEditingTreatmentId(null)
    } else {
      const newTreatment = { ...treatmentForm, id: `TRT-${Date.now()}` }
      await DataLayer.createEntity('cattalytics:poultry_treatment', 'Treatment').create(newTreatment)
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

  async function deleteTreatment(id) {
    if (confirm('Delete this treatment record?')) {
      await DataLayer.createEntity('cattalytics:poultry_treatment', 'Treatment').delete(id)
      setTreatments(treatments.filter(t => t.id !== id))
    }
  }

  // Inline edit functions
  function startInlineEdit(item, type) {
    setInlineEditId(item.id)
    setInlineData({ ...item })
    setLastChange({ item, type })
  }

  async function saveInlineEdit() {
    if (!inlineData.name || !inlineData.name.trim()) {
      setToast({ type: 'error', message: 'Name is required' })
      return
    }
    
    if (lastChange?.type === 'flock') {
      await DataLayer.createEntity('cattalytics:flocks', 'Flock').update(inlineData)
      setFlocks(flocks.map(f => f.id === inlineEditId ? inlineData : f))
    } else if (lastChange?.type === 'bird') {
      await DataLayer.createEntity('cattalytics:poultry', 'Bird').update(inlineData)
      setBirds(birds.map(b => b.id === inlineEditId ? inlineData : b))
    } else if (lastChange?.type === 'egg') {
      await DataLayer.createEntity('cattalytics:egg_production', 'EggRecord').update(inlineData)
      setEggRecords(eggRecords.map(e => e.id === inlineEditId ? inlineData : e))
    } else if (lastChange?.type === 'vaccination') {
      await DataLayer.createEntity('cattalytics:poultry_vaccination', 'Vaccination').update(inlineData)
      setVaccinations(vaccinations.map(v => v.id === inlineEditId ? inlineData : v))
    } else if (lastChange?.type === 'health') {
      await DataLayer.createEntity('cattalytics:poultry_health', 'HealthRecord').update(inlineData)
      setHealthRecords(healthRecords.map(h => h.id === inlineEditId ? inlineData : h))
    } else if (lastChange?.type === 'treatment') {
      await DataLayer.createEntity('cattalytics:poultry_treatment', 'Treatment').update(inlineData)
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
    <ErrorBoundary>
      <section>
        <h2>Poultry Management</h2>
        <div style={{marginTop:12, marginBottom:8}}>
          <input
            type="text"
            placeholder="Search flocks by name, type, breed, status..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '6px 10px', borderRadius: 4, border: '1px solid #ddd' }}
          />
        </div>
        <div style={{marginTop:12, maxHeight:400, overflowY:'auto'}}>
          {flocks.map(flock => (
              <div key={flock.id} style={{borderBottom:'1px solid #eee', padding:16}}>
                <strong>{flock.name}</strong> <em>({flock.type})</em> - {flock.breed} - {flock.status}
                {/* ...existing inline edit, delete, etc. buttons... */}
              </div>
          ))}
        </div>
        {/* ...existing forms, birds, eggs, vaccinations, health, treatments, and toast logic... */}
      </section>
    </ErrorBoundary>
  )
}

