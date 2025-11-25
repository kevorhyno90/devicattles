import React, { useState, useEffect } from 'react'
import { exportVaccinationRecords } from '../lib/pdfExport'

// Lazy load Chart.js to prevent blocking module load on mobile
let Line = null
let ChartJS = null
let chartJSInitialized = false

const initChartJS = async () => {
  if (chartJSInitialized) return true
  try {
    const chartModule = await import('react-chartjs-2')
    const chartJSModule = await import('chart.js')
    Line = chartModule.Line
    ChartJS = chartJSModule.Chart
    ChartJS.register(
      chartJSModule.CategoryScale,
      chartJSModule.LinearScale,
      chartJSModule.PointElement,
      chartJSModule.LineElement,
      chartJSModule.Title,
      chartJSModule.Tooltip,
      chartJSModule.Legend
    )
    chartJSInitialized = true
    return true
  } catch (error) {
    console.error('Failed to load Chart.js:', error)
    return false
  }
}

const VACCINE_TYPES = {
  dog: ['Rabies', 'DHPP (Distemper/Parvo)', 'Bordetella', 'Leptospirosis', 'Lyme Disease', 'Influenza'],
  cat: ['FVRCP (Distemper)', 'Rabies', 'FeLV (Feline Leukemia)', 'FIV Test', 'Bordetella']
}

const SAMPLE_PETS = [
  {
    id: 'P-001',
    name: 'Max',
    species: 'Dog',
    breed: 'German Shepherd',
    dob: '2020-03-15',
    sex: 'M',
    microchip: 'MC123456789',
    weight: 35,
    color: 'Black/Tan',
    status: 'Active',
    vaccinations: [
      { id: 'V1', type: 'Rabies', date: '2024-03-15', vet: 'City Vet Clinic', nextDue: '2027-03-15', notes: '3-year vaccine' }
    ],
    healthRecords: [],
    medications: [],
    feedingSchedule: { food: 'Premium Dog Food', portions: '2 cups', frequency: 'Twice Daily' },
    breedingRecords: [],
    groomingLog: [],
    notes: 'Guard dog, well-trained'
  }
]

export default function PetManagement() {
  const KEY = 'cattalytics:pets'
  const [pets, setPets] = useState([])
  const [tab, setTab] = useState('list')
  const [selectedPet, setSelectedPet] = useState(null)
  const [detailTab, setDetailTab] = useState('info')
  const [filter, setFilter] = useState({ species: 'all', search: '' })

  const emptyPet = {
    name: '', species: 'Dog', breed: '', dob: '', sex: 'M', microchip: '',
    weight: '', color: '', status: 'Active', vaccinations: [], healthRecords: [],
    medications: [], feedingSchedule: { food: '', portions: '', frequency: 'Twice Daily' },
    breedingRecords: [], groomingLog: [], weightHistory: [], trainingLog: [], notes: ''
  }

  const [form, setForm] = useState(emptyPet)
  const [editingId, setEditingId] = useState(null)

  const [vaccineForm, setVaccineForm] = useState({
    type: 'Rabies', date: new Date().toISOString().slice(0, 10),
    vet: '', nextDue: '', notes: ''
  })

  const [healthForm, setHealthForm] = useState({
    date: new Date().toISOString().slice(0, 10), diagnosis: '', treatment: '',
    vet: '', medications: '', followUp: '', notes: ''
  })

  const [medicationForm, setMedicationForm] = useState({
    name: '', dosage: '', frequency: '', startDate: new Date().toISOString().slice(0, 10),
    endDate: '', notes: ''
  })

  const [breedingForm, setBreedingForm] = useState({
    type: 'Heat Cycle', date: new Date().toISOString().slice(0, 10),
    partner: '', notes: '', dueDate: ''
  })

  const [groomingForm, setGroomingForm] = useState({
    date: new Date().toISOString().slice(0, 10), service: 'Bath', cost: '', groomer: '', notes: ''
  })

  const [trainingForm, setTrainingForm] = useState({
    date: new Date().toISOString().slice(0, 10), session: '', command: '', progress: 'Learning',
    duration: '', trainer: '', notes: ''
  })

  const [weightForm, setWeightForm] = useState({
    date: new Date().toISOString().slice(0, 10), weight: '', unit: 'kg', notes: ''
  })

  useEffect(() => {
    const raw = localStorage.getItem(KEY)
    setPets(raw ? JSON.parse(raw) : SAMPLE_PETS)
  }, [])

  useEffect(() => {
    if (pets.length > 0) localStorage.setItem(KEY, JSON.stringify(pets))
  }, [pets])

  const savePet = () => {
    if (!form.name.trim()) return
    
    if (editingId) {
      setPets(pets.map(p => p.id === editingId ? { ...p, ...form } : p))
      setEditingId(null)
    } else {
      const id = 'P-' + Math.floor(1000 + Math.random() * 9000)
      setPets([...pets, { ...form, id }])
    }
    setForm(emptyPet)
  }

  const deletePet = (id) => {
    if (window.confirm('Delete this pet?')) {
      setPets(pets.filter(p => p.id !== id))
      setSelectedPet(null)
    }
  }

  const addVaccination = (petId) => {
    if (!vaccineForm.type) return
    const newVaccine = { ...vaccineForm, id: 'V' + Date.now() }
    setPets(pets.map(p => p.id === petId ? {
      ...p, vaccinations: [...(p.vaccinations || []), newVaccine]
    } : p))
    setVaccineForm({ type: 'Rabies', date: new Date().toISOString().slice(0, 10), vet: '', nextDue: '', notes: '' })
  }

  const addHealthRecord = (petId) => {
    if (!healthForm.diagnosis.trim()) return
    const newRecord = { ...healthForm, id: 'H' + Date.now() }
    setPets(pets.map(p => p.id === petId ? {
      ...p, healthRecords: [...(p.healthRecords || []), newRecord]
    } : p))
    setHealthForm({ date: new Date().toISOString().slice(0, 10), diagnosis: '', treatment: '', vet: '', medications: '', followUp: '', notes: '' })
  }

  const addMedication = (petId) => {
    if (!medicationForm.name.trim()) return
    const newMed = { ...medicationForm, id: 'M' + Date.now() }
    setPets(pets.map(p => p.id === petId ? {
      ...p, medications: [...(p.medications || []), newMed]
    } : p))
    setMedicationForm({ name: '', dosage: '', frequency: '', startDate: new Date().toISOString().slice(0, 10), endDate: '', notes: '' })
  }

  const addBreedingRecord = (petId) => {
    const newRecord = { ...breedingForm, id: 'B' + Date.now() }
    setPets(pets.map(p => p.id === petId ? {
      ...p, breedingRecords: [...(p.breedingRecords || []), newRecord]
    } : p))
    setBreedingForm({ type: 'Heat Cycle', date: new Date().toISOString().slice(0, 10), partner: '', notes: '', dueDate: '' })
  }

  const addGroomingLog = (petId) => {
    const newLog = { ...groomingForm, id: 'G' + Date.now() }
    setPets(pets.map(p => p.id === petId ? {
      ...p, groomingLog: [...(p.groomingLog || []), newLog]
    } : p))
    setGroomingForm({ date: new Date().toISOString().slice(0, 10), service: 'Bath', cost: '', groomer: '', notes: '' })
  }

  const addTrainingLog = (petId) => {
    if (!trainingForm.session.trim()) return
    const newLog = { ...trainingForm, id: 'T' + Date.now() }
    setPets(pets.map(p => p.id === petId ? {
      ...p, trainingLog: [...(p.trainingLog || []), newLog]
    } : p))
    setTrainingForm({ date: new Date().toISOString().slice(0, 10), session: '', command: '', progress: 'Learning', duration: '', trainer: '', notes: '' })
  }

  const addWeightRecord = (petId) => {
    if (!weightForm.weight) return
    const newRecord = { ...weightForm, id: 'W' + Date.now() }
    setPets(pets.map(p => p.id === petId ? {
      ...p, 
      weightHistory: [...(p.weightHistory || []), newRecord],
      weight: parseFloat(weightForm.weight) // Update current weight
    } : p))
    setWeightForm({ date: new Date().toISOString().slice(0, 10), weight: '', unit: 'kg', notes: '' })
  }

  const deleteRecord = (petId, recordType, recordId) => {
    setPets(pets.map(p => p.id === petId ? {
      ...p, [recordType]: (p[recordType] || []).filter(r => r.id !== recordId)
    } : p))
  }

  const filtered = pets.filter(p => {
    if (filter.species !== 'all' && p.species !== filter.species) return false
    if (filter.search) {
      const q = filter.search.toLowerCase()
      return p.name.toLowerCase().includes(q) || p.breed.toLowerCase().includes(q)
    }
    return true
  })

  const upcomingVaccines = pets.flatMap(p => 
    (p.vaccinations || [])
      .filter(v => v.nextDue)
      .map(v => ({ ...v, petName: p.name, petId: p.id, isDue: new Date(v.nextDue) <= new Date(Date.now() + 30*24*60*60*1000) }))
  ).filter(v => v.isDue).sort((a, b) => new Date(a.nextDue) - new Date(b.nextDue))

  return (
    <div style={{ padding: '20px', background: '#f9fafb', minHeight: '100vh' }}>
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ marginTop: 0 }}>🐾 Pet Management</h3>
        <p style={{ color: '#666', fontSize: '14px' }}>Comprehensive pet care system for dogs and cats</p>
      </div>

      {/* Top-Level Tabs */}
      <div style={{ marginBottom: '20px', borderBottom: '2px solid #e5e7eb' }}>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          <button onClick={() => setTab('list')} style={{ padding: '12px 20px', border: 'none', borderBottom: tab === 'list' ? '3px solid #8b5cf6' : '3px solid transparent', background: tab === 'list' ? '#f5f3ff' : 'transparent', color: tab === 'list' ? '#8b5cf6' : '#6b7280', fontWeight: tab === 'list' ? '600' : '400', cursor: 'pointer' }}>
            📋 Pet List
          </button>
          <button onClick={() => setTab('vaccinations')} style={{ padding: '12px 20px', border: 'none', borderBottom: tab === 'vaccinations' ? '3px solid #8b5cf6' : '3px solid transparent', background: tab === 'vaccinations' ? '#f5f3ff' : 'transparent', color: tab === 'vaccinations' ? '#8b5cf6' : '#6b7280', fontWeight: tab === 'vaccinations' ? '600' : '400', cursor: 'pointer' }}>
            💉 Vaccinations ({upcomingVaccines.length})
          </button>
          <button onClick={() => setTab('health')} style={{ padding: '12px 20px', border: 'none', borderBottom: tab === 'health' ? '3px solid #8b5cf6' : '3px solid transparent', background: tab === 'health' ? '#f5f3ff' : 'transparent', color: tab === 'health' ? '#8b5cf6' : '#6b7280', fontWeight: tab === 'health' ? '600' : '400', cursor: 'pointer' }}>
            🏥 Health Records
          </button>
          <button onClick={() => setTab('feeding')} style={{ padding: '12px 20px', border: 'none', borderBottom: tab === 'feeding' ? '3px solid #8b5cf6' : '3px solid transparent', background: tab === 'feeding' ? '#f5f3ff' : 'transparent', color: tab === 'feeding' ? '#8b5cf6' : '#6b7280', fontWeight: tab === 'feeding' ? '600' : '400', cursor: 'pointer' }}>
            🍽️ Feeding
          </button>
          <button onClick={() => setTab('breeding')} style={{ padding: '12px 20px', border: 'none', borderBottom: tab === 'breeding' ? '3px solid #8b5cf6' : '3px solid transparent', background: tab === 'breeding' ? '#f5f3ff' : 'transparent', color: tab === 'breeding' ? '#8b5cf6' : '#6b7280', fontWeight: tab === 'breeding' ? '600' : '400', cursor: 'pointer' }}>
            🐣 Breeding
          </button>
          <button onClick={() => setTab('grooming')} style={{ padding: '12px 20px', border: 'none', borderBottom: tab === 'grooming' ? '3px solid #8b5cf6' : '3px solid transparent', background: tab === 'grooming' ? '#f5f3ff' : 'transparent', color: tab === 'grooming' ? '#8b5cf6' : '#6b7280', fontWeight: tab === 'grooming' ? '600' : '400', cursor: 'pointer' }}>
            ✂️ Grooming
          </button>
          <button onClick={() => setTab('training')} style={{ padding: '12px 20px', border: 'none', borderBottom: tab === 'training' ? '3px solid #8b5cf6' : '3px solid transparent', background: tab === 'training' ? '#f5f3ff' : 'transparent', color: tab === 'training' ? '#8b5cf6' : '#6b7280', fontWeight: tab === 'training' ? '600' : '400', cursor: 'pointer' }}>
            🎓 Training
          </button>
        </div>
      </div>

      {tab === 'list' && !selectedPet && (
        <div>
          {/* Filters */}
          <div style={{ background: 'white', padding: '16px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <input 
                type="text" 
                placeholder="🔍 Search pets..." 
                value={filter.search}
                onChange={e => setFilter({...filter, search: e.target.value})}
                style={{ flex: 1, minWidth: '200px', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px' }}
              />
              <select value={filter.species} onChange={e => setFilter({...filter, species: e.target.value})} style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px' }}>
                <option value="all">All Species</option>
                <option value="Dog">🐕 Dogs</option>
                <option value="Cat">🐈 Cats</option>
              </select>
            </div>
          </div>

          {/* Pet Grid */}
          {filtered.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', marginBottom: '20px' }}>
              {filtered.map(pet => (
                <div key={pet.id} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }} onClick={() => setSelectedPet(pet)} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)' }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                    <div>
                      <h4 style={{ margin: '0 0 4px 0', color: '#1f2937' }}>{pet.species === 'Dog' ? '🐕' : '🐈'} {pet.name}</h4>
                      <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>{pet.breed || 'Mixed'}</p>
                    </div>
                    <span style={{ background: pet.status === 'Active' ? '#d1fae5' : '#fee2e2', color: pet.status === 'Active' ? '#065f46' : '#991b1b', padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '500' }}>
                      {pet.status}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#666', lineHeight: '1.6' }}>
                    <div>📅 DOB: {pet.dob || 'N/A'}</div>
                    <div>⚖️ Weight: {pet.weight || 'N/A'} kg</div>
                    <div>💉 Vaccines: {(pet.vaccinations || []).length}</div>
                  </div>
                  <div style={{ marginTop: '12px', display: 'flex', gap: '6px' }}>
                    <button onClick={(e) => { e.stopPropagation(); setForm(pet); setEditingId(pet.id) }} style={{ flex: 1, padding: '6px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}>Edit</button>
                    <button onClick={(e) => { e.stopPropagation(); deletePet(pet.id) }} style={{ flex: 1, padding: '6px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {filtered.length === 0 && (
            <div style={{ background: 'white', border: '2px dashed #d1d5db', borderRadius: '8px', padding: '40px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '10px' }}>🐾</div>
              <p style={{ margin: 0, color: '#666' }}>No pets found</p>
            </div>
          )}

          {/* Add/Edit Form */}
          {(editingId || form.name) && (
            <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '20px', marginTop: '20px' }}>
              <h4 style={{ marginTop: 0 }}>{editingId ? 'Edit Pet' : 'Add New Pet'}</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <input type="text" placeholder="Pet name *" value={form.name} onChange={e => setForm({...form, name: e.target.value})} style={{ padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }} />
                <select value={form.species} onChange={e => setForm({...form, species: e.target.value})} style={{ padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }}>
                  <option value="Dog">🐕 Dog</option>
                  <option value="Cat">🐈 Cat</option>
                </select>
                <input type="text" placeholder="Breed" value={form.breed} onChange={e => setForm({...form, breed: e.target.value})} style={{ padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }} />
                <div style={{display:'flex',flexDirection:'column'}}>
                  <label style={{marginBottom:2}}>Date of Birth:</label>
                  <input type="date" value={form.dob} onChange={e => setForm({...form, dob: e.target.value})} style={{ padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }} />
                </div>
                <select value={form.sex} onChange={e => setForm({...form, sex: e.target.value})} style={{ padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }}>
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                </select>
                <input type="text" placeholder="Microchip #" value={form.microchip} onChange={e => setForm({...form, microchip: e.target.value})} style={{ padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }} />
                <input type="number" placeholder="Weight (kg)" value={form.weight} onChange={e => setForm({...form, weight: e.target.value})} style={{ padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }} />
                <input type="text" placeholder="Color" value={form.color} onChange={e => setForm({...form, color: e.target.value})} style={{ padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }} />
              </div>
              <textarea placeholder="Notes" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', minHeight: '80px', fontFamily: 'inherit', marginBottom: '12px' }} />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={savePet} style={{ flex: 1, padding: '12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>
                  {editingId ? 'Update' : 'Add'} Pet
                </button>
                <button onClick={() => { setForm(emptyPet); setEditingId(null) }} style={{ flex: 1, padding: '12px', background: '#e5e7eb', color: '#374151', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {!editingId && !form.name && (
            <button onClick={() => setForm({...emptyPet, name: ' '})} style={{ width: '100%', padding: '14px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', marginTop: '20px' }}>
              + Add New Pet
            </button>
          )}
        </div>
      )}

      {tab === 'vaccinations' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0 }}>Vaccination Records</h3>
            <button onClick={() => exportVaccinationRecords(pets)} style={{ padding: '8px 16px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>
              📕 Export PDF
            </button>
          </div>
          
          {upcomingVaccines.length > 0 && (
            <div style={{ background: '#fef3c7', border: '1px solid #fbbf24', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
              <h4 style={{ margin: '0 0 12px 0', color: '#92400e' }}>⚠️ Upcoming Vaccinations (Next 30 Days)</h4>
              {upcomingVaccines.map(v => (
                <div key={v.id} style={{ background: 'white', padding: '10px', borderRadius: '6px', marginBottom: '8px' }}>
                  <div style={{ fontWeight: '600' }}>{v.petName} - {v.type}</div>
                  <div style={{ fontSize: '13px', color: '#666' }}>Due: {v.nextDue}</div>
                </div>
              ))}
            </div>
          )}

          <h4>All Vaccination Records</h4>
          {pets.map(pet => (
            pet.vaccinations && pet.vaccinations.length > 0 && (
              <div key={pet.id} style={{ marginBottom: '24px' }}>
                <h5 style={{ margin: '0 0 12px 0' }}>{pet.species === 'Dog' ? '🐕' : '🐈'} {pet.name}</h5>
                {pet.vaccinations.map(v => (
                  <div key={v.id} style={{ background: 'white', padding: '14px', borderRadius: '6px', border: '1px solid #e5e7eb', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <strong>{v.type}</strong>
                      {v.nextDue && <span style={{ fontSize: '12px', color: '#666' }}>Next: {v.nextDue}</span>}
                    </div>
                    <div style={{ fontSize: '13px', color: '#666', lineHeight: '1.6' }}>
                      <div>📅 Date: {v.date}</div>
                      {v.vet && <div>🏥 Vet: {v.vet}</div>}
                      {v.notes && <div>📝 {v.notes}</div>}
                    </div>
                    <button onClick={() => deleteRecord(pet.id, 'vaccinations', v.id)} style={{ marginTop: '8px', padding: '4px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>Delete</button>
                  </div>
                ))}
              </div>
            )
          ))}
          {pets.every(p => !p.vaccinations || p.vaccinations.length === 0) && (
            <div style={{ background: 'white', border: '2px dashed #d1d5db', borderRadius: '8px', padding: '40px 20px', textAlign: 'center' }}>
              <p style={{ margin: 0, color: '#666' }}>No vaccination records yet</p>
            </div>
          )}
        </div>
      )}

      {tab === 'health' && (
        <div>
          <h4>Health Records</h4>
          {pets.map(pet => (
            pet.healthRecords && pet.healthRecords.length > 0 && (
              <div key={pet.id} style={{ marginBottom: '24px' }}>
                <h5 style={{ margin: '0 0 12px 0' }}>{pet.species === 'Dog' ? '🐕' : '🐈'} {pet.name}</h5>
                {pet.healthRecords.map(h => (
                  <div key={h.id} style={{ background: 'white', padding: '14px', borderRadius: '6px', border: '1px solid #e5e7eb', marginBottom: '10px' }}>
                    <div style={{ fontWeight: '600', marginBottom: '8px' }}>{h.diagnosis}</div>
                    <div style={{ fontSize: '13px', color: '#666', lineHeight: '1.6' }}>
                      <div>📅 {h.date}</div>
                      {h.treatment && <div>💊 Treatment: {h.treatment}</div>}
                      {h.vet && <div>🏥 Vet: {h.vet}</div>}
                      {h.followUp && <div>📆 Follow-up: {h.followUp}</div>}
                      {h.notes && <div>📝 {h.notes}</div>}
                    </div>
                    <button onClick={() => deleteRecord(pet.id, 'healthRecords', h.id)} style={{ marginTop: '8px', padding: '4px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>Delete</button>
                  </div>
                ))}
              </div>
            )
          ))}
          {pets.every(p => !p.healthRecords || p.healthRecords.length === 0) && (
            <div style={{ background: 'white', border: '2px dashed #d1d5db', borderRadius: '8px', padding: '40px 20px', textAlign: 'center' }}>
              <p style={{ margin: 0, color: '#666' }}>No health records yet</p>
            </div>
          )}
        </div>
      )}

      {tab === 'feeding' && (
        <div>
          <h4>Feeding Schedules</h4>
          {pets.map(pet => (
            <div key={pet.id} style={{ background: 'white', padding: '16px', borderRadius: '8px', border: '1px solid #e5e7eb', marginBottom: '12px' }}>
              <h5 style={{ margin: '0 0 8px 0' }}>{pet.species === 'Dog' ? '🐕' : '🐈'} {pet.name}</h5>
              <div style={{ fontSize: '14px', color: '#666', lineHeight: '1.8' }}>
                <div>🍽️ Food: {pet.feedingSchedule?.food || 'Not set'}</div>
                <div>📏 Portions: {pet.feedingSchedule?.portions || 'Not set'}</div>
                <div>⏰ Frequency: {pet.feedingSchedule?.frequency || 'Not set'}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'breeding' && (
        <div>
          <h4>Breeding Records</h4>
          {pets.map(pet => (
            pet.breedingRecords && pet.breedingRecords.length > 0 && (
              <div key={pet.id} style={{ marginBottom: '24px' }}>
                <h5 style={{ margin: '0 0 12px 0' }}>{pet.species === 'Dog' ? '🐕' : '🐈'} {pet.name}</h5>
                {pet.breedingRecords.map(b => (
                  <div key={b.id} style={{ background: 'white', padding: '14px', borderRadius: '6px', border: '1px solid #e5e7eb', marginBottom: '10px' }}>
                    <div style={{ fontWeight: '600', marginBottom: '8px' }}>{b.type}</div>
                    <div style={{ fontSize: '13px', color: '#666', lineHeight: '1.6' }}>
                      <div>📅 Date: {b.date}</div>
                      {b.partner && <div>💑 Partner: {b.partner}</div>}
                      {b.dueDate && <div>🍼 Due Date: {b.dueDate}</div>}
                      {b.notes && <div>📝 {b.notes}</div>}
                    </div>
                    <button onClick={() => deleteRecord(pet.id, 'breedingRecords', b.id)} style={{ marginTop: '8px', padding: '4px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>Delete</button>
                  </div>
                ))}
              </div>
            )
          ))}
          {pets.every(p => !p.breedingRecords || p.breedingRecords.length === 0) && (
            <div style={{ background: 'white', border: '2px dashed #d1d5db', borderRadius: '8px', padding: '40px 20px', textAlign: 'center' }}>
              <p style={{ margin: 0, color: '#666' }}>No breeding records yet</p>
            </div>
          )}
        </div>
      )}

      {tab === 'grooming' && (
        <div>
          <h4>Grooming Logs</h4>
          {pets.map(pet => (
            pet.groomingLog && pet.groomingLog.length > 0 && (
              <div key={pet.id} style={{ marginBottom: '24px' }}>
                <h5 style={{ margin: '0 0 12px 0' }}>{pet.species === 'Dog' ? '🐕' : '🐈'} {pet.name}</h5>
                {pet.groomingLog.map(g => (
                  <div key={g.id} style={{ background: 'white', padding: '14px', borderRadius: '6px', border: '1px solid #e5e7eb', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <strong>{g.service}</strong>
                      {g.cost && <span style={{ color: '#059669', fontWeight: '600' }}>${g.cost}</span>}
                    </div>
                    <div style={{ fontSize: '13px', color: '#666', lineHeight: '1.6' }}>
                      <div>📅 {g.date}</div>
                      {g.groomer && <div>✂️ Groomer: {g.groomer}</div>}
                      {g.notes && <div>📝 {g.notes}</div>}
                    </div>
                    <button onClick={() => deleteRecord(pet.id, 'groomingLog', g.id)} style={{ marginTop: '8px', padding: '4px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>Delete</button>
                  </div>
                ))}
              </div>
            )
          ))}
          {pets.every(p => !p.groomingLog || p.groomingLog.length === 0) && (
            <div style={{ background: 'white', border: '2px dashed #d1d5db', borderRadius: '8px', padding: '40px 20px', textAlign: 'center' }}>
              <p style={{ margin: 0, color: '#666' }}>No grooming logs yet</p>
            </div>
          )}
        </div>
      )}

      {tab === 'training' && (
        <div>
          <h4>Training Sessions</h4>
          {pets.map(pet => (
            pet.trainingLog && pet.trainingLog.length > 0 && (
              <div key={pet.id} style={{ marginBottom: '24px' }}>
                <h5 style={{ margin: '0 0 12px 0' }}>{pet.species === 'Dog' ? '🐕' : '🐈'} {pet.name}</h5>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                  <div style={{ background: '#dbeafe', padding: '10px', borderRadius: '6px', textAlign: 'center' }}>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: '#1e40af' }}>{pet.trainingLog.length}</div>
                    <div style={{ fontSize: '11px', color: '#1e3a8a' }}>Sessions</div>
                  </div>
                  <div style={{ background: '#d1fae5', padding: '10px', borderRadius: '6px', textAlign: 'center' }}>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: '#065f46' }}>
                      {pet.trainingLog.filter(t => t.progress === 'Mastered').length}
                    </div>
                    <div style={{ fontSize: '11px', color: '#064e3b' }}>Mastered</div>
                  </div>
                </div>
                {pet.trainingLog.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5).map(t => (
                  <div key={t.id} style={{ background: 'white', padding: '14px', borderRadius: '6px', border: '1px solid #e5e7eb', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
                      <strong>{t.session}</strong>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '10px',
                        fontSize: '10px',
                        fontWeight: '600',
                        background: t.progress === 'Mastered' ? '#d1fae5' : t.progress === 'Improving' ? '#dbeafe' : '#fef3c7',
                        color: t.progress === 'Mastered' ? '#065f46' : t.progress === 'Improving' ? '#1e40af' : '#92400e'
                      }}>
                        {t.progress}
                      </span>
                    </div>
                    <div style={{ fontSize: '13px', color: '#666', lineHeight: '1.6' }}>
                      <div>📅 {t.date}</div>
                      {t.command && <div>🎯 Command: {t.command}</div>}
                      {t.trainer && <div>👤 Trainer: {t.trainer}</div>}
                    </div>
                    <button onClick={() => deleteRecord(pet.id, 'trainingLog', t.id)} style={{ marginTop: '8px', padding: '4px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>Delete</button>
                  </div>
                ))}
              </div>
            )
          ))}
          {pets.every(p => !p.trainingLog || p.trainingLog.length === 0) && (
            <div style={{ background: 'white', border: '2px dashed #d1d5db', borderRadius: '8px', padding: '40px 20px', textAlign: 'center' }}>
              <p style={{ margin: 0, color: '#666' }}>No training sessions yet</p>
            </div>
          )}
        </div>
      )}

      {/* Selected Pet Detail View */}
      {selectedPet && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }} onClick={() => setSelectedPet(null)}>
          <div style={{ background: 'white', borderRadius: '12px', maxWidth: '900px', width: '100%', maxHeight: '90vh', overflow: 'auto', padding: '24px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>{selectedPet.species === 'Dog' ? '🐕' : '🐈'} {selectedPet.name}</h3>
              <button onClick={() => setSelectedPet(null)} style={{ padding: '8px 16px', background: '#e5e7eb', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Close</button>
            </div>

            {/* Detail Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '2px solid #e5e7eb', flexWrap: 'wrap' }}>
              {['info', 'vaccinations', 'health', 'medications', 'breeding', 'grooming', 'training', 'weight'].map(t => (
                <button key={t} onClick={() => setDetailTab(t)} style={{ padding: '10px 16px', border: 'none', borderBottom: detailTab === t ? '3px solid #8b5cf6' : 'none', background: detailTab === t ? '#f5f3ff' : 'transparent', color: detailTab === t ? '#8b5cf6' : '#666', cursor: 'pointer', fontWeight: detailTab === t ? '600' : '400', fontSize: '14px', textTransform: 'capitalize' }}>
                  {t === 'weight' ? '⚖️ Weight' : t === 'training' ? '🎓 Training' : t}
                </button>
              ))}
            </div>

            {detailTab === 'info' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div><strong>Breed:</strong> {selectedPet.breed || 'Mixed'}</div>
                <div><strong>DOB:</strong> {selectedPet.dob || 'N/A'}</div>
                <div><strong>Sex:</strong> {selectedPet.sex === 'M' ? 'Male' : 'Female'}</div>
                <div><strong>Weight:</strong> {selectedPet.weight || 'N/A'} kg</div>
                <div><strong>Microchip:</strong> {selectedPet.microchip || 'N/A'}</div>
                <div><strong>Color:</strong> {selectedPet.color || 'N/A'}</div>
                {selectedPet.notes && <div style={{ gridColumn: '1 / -1' }}><strong>Notes:</strong> {selectedPet.notes}</div>}
              </div>
            )}

            {detailTab === 'vaccinations' && (
              <div>
                <div style={{ background: '#f9fafb', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
                  <h5 style={{ marginTop: 0 }}>Add Vaccination</h5>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <select value={vaccineForm.type} onChange={e => setVaccineForm({...vaccineForm, type: e.target.value})} style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}>
                      {VACCINE_TYPES[selectedPet.species.toLowerCase()].map(v => <option key={v}>{v}</option>)}
                    </select>
                    <input type="date" value={vaccineForm.date} onChange={e => setVaccineForm({...vaccineForm, date: e.target.value})} style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }} />
                    <input type="text" placeholder="Vet clinic" value={vaccineForm.vet} onChange={e => setVaccineForm({...vaccineForm, vet: e.target.value})} style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }} />
                    <input type="date" placeholder="Next due date" value={vaccineForm.nextDue} onChange={e => setVaccineForm({...vaccineForm, nextDue: e.target.value})} style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }} />
                  </div>
                  <textarea placeholder="Notes" value={vaccineForm.notes} onChange={e => setVaccineForm({...vaccineForm, notes: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', marginTop: '12px', minHeight: '60px', fontFamily: 'inherit' }} />
                  <button onClick={() => addVaccination(selectedPet.id)} style={{ marginTop: '12px', padding: '10px 16px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>Add Vaccination</button>
                </div>

                {selectedPet.vaccinations && selectedPet.vaccinations.length > 0 ? (
                  selectedPet.vaccinations.map(v => (
                    <div key={v.id} style={{ background: '#f9fafb', padding: '14px', borderRadius: '6px', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <strong>{v.type}</strong>
                        <button onClick={() => deleteRecord(selectedPet.id, 'vaccinations', v.id)} style={{ padding: '4px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>Delete</button>
                      </div>
                      <div style={{ fontSize: '13px', color: '#666' }}>
                        <div>Date: {v.date}</div>
                        {v.vet && <div>Vet: {v.vet}</div>}
                        {v.nextDue && <div>Next Due: {v.nextDue}</div>}
                        {v.notes && <div>Notes: {v.notes}</div>}
                      </div>
                    </div>
                  ))
                ) : <p style={{ color: '#666', textAlign: 'center' }}>No vaccinations recorded</p>}
              </div>
            )}

            {detailTab === 'health' && (
              <div>
                <div style={{ background: '#f9fafb', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
                  <h5 style={{ marginTop: 0 }}>Add Health Record</h5>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <input type="date" value={healthForm.date} onChange={e => setHealthForm({...healthForm, date: e.target.value})} style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }} />
                    <input type="text" placeholder="Diagnosis *" value={healthForm.diagnosis} onChange={e => setHealthForm({...healthForm, diagnosis: e.target.value})} style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }} />
                    <input type="text" placeholder="Treatment" value={healthForm.treatment} onChange={e => setHealthForm({...healthForm, treatment: e.target.value})} style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }} />
                    <input type="text" placeholder="Veterinarian" value={healthForm.vet} onChange={e => setHealthForm({...healthForm, vet: e.target.value})} style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }} />
                    <input type="date" placeholder="Follow-up date" value={healthForm.followUp} onChange={e => setHealthForm({...healthForm, followUp: e.target.value})} style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }} />
                  </div>
                  <textarea placeholder="Notes" value={healthForm.notes} onChange={e => setHealthForm({...healthForm, notes: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', marginTop: '12px', minHeight: '60px', fontFamily: 'inherit' }} />
                  <button onClick={() => addHealthRecord(selectedPet.id)} style={{ marginTop: '12px', padding: '10px 16px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>Add Health Record</button>
                </div>

                {selectedPet.healthRecords && selectedPet.healthRecords.length > 0 ? (
                  selectedPet.healthRecords.map(h => (
                    <div key={h.id} style={{ background: '#f9fafb', padding: '14px', borderRadius: '6px', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <strong>{h.diagnosis}</strong>
                        <button onClick={() => deleteRecord(selectedPet.id, 'healthRecords', h.id)} style={{ padding: '4px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>Delete</button>
                      </div>
                      <div style={{ fontSize: '13px', color: '#666', lineHeight: '1.6' }}>
                        <div>Date: {h.date}</div>
                        {h.treatment && <div>Treatment: {h.treatment}</div>}
                        {h.vet && <div>Vet: {h.vet}</div>}
                        {h.followUp && <div>Follow-up: {h.followUp}</div>}
                        {h.notes && <div>Notes: {h.notes}</div>}
                      </div>
                    </div>
                  ))
                ) : <p style={{ color: '#666', textAlign: 'center' }}>No health records</p>}
              </div>
            )}

            {detailTab === 'medications' && (
              <div>
                <div style={{ background: '#f9fafb', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
                  <h5 style={{ marginTop: 0 }}>Add Medication</h5>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <input type="text" placeholder="Medication name *" value={medicationForm.name} onChange={e => setMedicationForm({...medicationForm, name: e.target.value})} style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }} />
                    <input type="text" placeholder="Dosage" value={medicationForm.dosage} onChange={e => setMedicationForm({...medicationForm, dosage: e.target.value})} style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }} />
                    <input type="text" placeholder="Frequency" value={medicationForm.frequency} onChange={e => setMedicationForm({...medicationForm, frequency: e.target.value})} style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }} />
                    <input type="date" placeholder="Start date" value={medicationForm.startDate} onChange={e => setMedicationForm({...medicationForm, startDate: e.target.value})} style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }} />
                    <input type="date" placeholder="End date" value={medicationForm.endDate} onChange={e => setMedicationForm({...medicationForm, endDate: e.target.value})} style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }} />
                  </div>
                  <textarea placeholder="Notes" value={medicationForm.notes} onChange={e => setMedicationForm({...medicationForm, notes: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', marginTop: '12px', minHeight: '60px', fontFamily: 'inherit' }} />
                  <button onClick={() => addMedication(selectedPet.id)} style={{ marginTop: '12px', padding: '10px 16px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>Add Medication</button>
                </div>

                {selectedPet.medications && selectedPet.medications.length > 0 ? (
                  selectedPet.medications.map(m => (
                    <div key={m.id} style={{ background: '#f9fafb', padding: '14px', borderRadius: '6px', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <strong>{m.name}</strong>
                        <button onClick={() => deleteRecord(selectedPet.id, 'medications', m.id)} style={{ padding: '4px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>Delete</button>
                      </div>
                      <div style={{ fontSize: '13px', color: '#666', lineHeight: '1.6' }}>
                        <div>Dosage: {m.dosage}</div>
                        <div>Frequency: {m.frequency}</div>
                        <div>Period: {m.startDate} to {m.endDate || 'Ongoing'}</div>
                        {m.notes && <div>Notes: {m.notes}</div>}
                      </div>
                    </div>
                  ))
                ) : <p style={{ color: '#666', textAlign: 'center' }}>No active medications</p>}
              </div>
            )}

            {detailTab === 'breeding' && (
              <div>
                <div style={{ background: '#f9fafb', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
                  <h5 style={{ marginTop: 0 }}>Add Breeding Record</h5>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <select value={breedingForm.type} onChange={e => setBreedingForm({...breedingForm, type: e.target.value})} style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}>
                      <option>Heat Cycle</option>
                      <option>Breeding</option>
                      <option>Pregnancy</option>
                      <option>Birth</option>
                    </select>
                    <input type="date" value={breedingForm.date} onChange={e => setBreedingForm({...breedingForm, date: e.target.value})} style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }} />
                    <input type="text" placeholder="Partner name" value={breedingForm.partner} onChange={e => setBreedingForm({...breedingForm, partner: e.target.value})} style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }} />
                    <input type="date" placeholder="Due/birth date" value={breedingForm.dueDate} onChange={e => setBreedingForm({...breedingForm, dueDate: e.target.value})} style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }} />
                  </div>
                  <textarea placeholder="Notes" value={breedingForm.notes} onChange={e => setBreedingForm({...breedingForm, notes: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', marginTop: '12px', minHeight: '60px', fontFamily: 'inherit' }} />
                  <button onClick={() => addBreedingRecord(selectedPet.id)} style={{ marginTop: '12px', padding: '10px 16px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>Add Record</button>
                </div>

                {selectedPet.breedingRecords && selectedPet.breedingRecords.length > 0 ? (
                  selectedPet.breedingRecords.map(b => (
                    <div key={b.id} style={{ background: '#f9fafb', padding: '14px', borderRadius: '6px', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <strong>{b.type}</strong>
                        <button onClick={() => deleteRecord(selectedPet.id, 'breedingRecords', b.id)} style={{ padding: '4px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>Delete</button>
                      </div>
                      <div style={{ fontSize: '13px', color: '#666', lineHeight: '1.6' }}>
                        <div>Date: {b.date}</div>
                        {b.partner && <div>Partner: {b.partner}</div>}
                        {b.dueDate && <div>Due/Birth Date: {b.dueDate}</div>}
                        {b.notes && <div>Notes: {b.notes}</div>}
                      </div>
                    </div>
                  ))
                ) : <p style={{ color: '#666', textAlign: 'center' }}>No breeding records</p>}
              </div>
            )}

            {detailTab === 'grooming' && (
              <div>
                <div style={{ background: '#f9fafb', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
                  <h5 style={{ marginTop: 0 }}>Add Grooming Log</h5>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <select value={groomingForm.service} onChange={e => setGroomingForm({...groomingForm, service: e.target.value})} style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}>
                      <option>Bath</option>
                      <option>Haircut</option>
                      <option>Nail Trim</option>
                      <option>Full Grooming</option>
                      <option>Teeth Cleaning</option>
                    </select>
                    <input type="date" value={groomingForm.date} onChange={e => setGroomingForm({...groomingForm, date: e.target.value})} style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }} />
                    <input type="text" placeholder="Groomer" value={groomingForm.groomer} onChange={e => setGroomingForm({...groomingForm, groomer: e.target.value})} style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }} />
                    <input type="number" placeholder="Cost" value={groomingForm.cost} onChange={e => setGroomingForm({...groomingForm, cost: e.target.value})} style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }} />
                  </div>
                  <textarea placeholder="Notes" value={groomingForm.notes} onChange={e => setGroomingForm({...groomingForm, notes: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', marginTop: '12px', minHeight: '60px', fontFamily: 'inherit' }} />
                  <button onClick={() => addGroomingLog(selectedPet.id)} style={{ marginTop: '12px', padding: '10px 16px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>Add Log</button>
                </div>

                {selectedPet.groomingLog && selectedPet.groomingLog.length > 0 ? (
                  selectedPet.groomingLog.map(g => (
                    <div key={g.id} style={{ background: '#f9fafb', padding: '14px', borderRadius: '6px', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <strong>{g.service}</strong>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                          {g.cost && <span style={{ color: '#059669', fontWeight: '600' }}>${g.cost}</span>}
                          <button onClick={() => deleteRecord(selectedPet.id, 'groomingLog', g.id)} style={{ padding: '4px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>Delete</button>
                        </div>
                      </div>
                      <div style={{ fontSize: '13px', color: '#666', lineHeight: '1.6' }}>
                        <div>Date: {g.date}</div>
                        {g.groomer && <div>Groomer: {g.groomer}</div>}
                        {g.notes && <div>Notes: {g.notes}</div>}
                      </div>
                    </div>
                  ))
                ) : <p style={{ color: '#666', textAlign: 'center' }}>No grooming logs</p>}
              </div>
            )}

            {detailTab === 'training' && (
              <div>
                <div style={{ background: '#f9fafb', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
                  <h5 style={{ marginTop: 0 }}>Add Training Session</h5>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <input type="text" placeholder="Session name" value={trainingForm.session} onChange={e => setTrainingForm({...trainingForm, session: e.target.value})} style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }} />
                    <input type="date" value={trainingForm.date} onChange={e => setTrainingForm({...trainingForm, date: e.target.value})} style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }} />
                    <input type="text" placeholder="Command learned" value={trainingForm.command} onChange={e => setTrainingForm({...trainingForm, command: e.target.value})} style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }} />
                    <select value={trainingForm.progress} onChange={e => setTrainingForm({...trainingForm, progress: e.target.value})} style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}>
                      <option>Learning</option>
                      <option>Improving</option>
                      <option>Mastered</option>
                      <option>Needs Review</option>
                    </select>
                    <input type="text" placeholder="Duration (e.g., 30min)" value={trainingForm.duration} onChange={e => setTrainingForm({...trainingForm, duration: e.target.value})} style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }} />
                    <input type="text" placeholder="Trainer" value={trainingForm.trainer} onChange={e => setTrainingForm({...trainingForm, trainer: e.target.value})} style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }} />
                  </div>
                  <textarea placeholder="Notes & observations" value={trainingForm.notes} onChange={e => setTrainingForm({...trainingForm, notes: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', marginTop: '12px', minHeight: '60px', fontFamily: 'inherit' }} />
                  <button onClick={() => addTrainingLog(selectedPet.id)} style={{ marginTop: '12px', padding: '10px 16px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>Add Session</button>
                </div>

                {/* Training Summary */}
                {selectedPet.trainingLog && selectedPet.trainingLog.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ background: '#dbeafe', padding: '12px', borderRadius: '6px', textAlign: 'center' }}>
                      <div style={{ fontSize: '24px', fontWeight: '700', color: '#1e40af' }}>{selectedPet.trainingLog.length}</div>
                      <div style={{ fontSize: '12px', color: '#1e3a8a' }}>Total Sessions</div>
                    </div>
                    <div style={{ background: '#d1fae5', padding: '12px', borderRadius: '6px', textAlign: 'center' }}>
                      <div style={{ fontSize: '24px', fontWeight: '700', color: '#065f46' }}>
                        {selectedPet.trainingLog.filter(t => t.progress === 'Mastered').length}
                      </div>
                      <div style={{ fontSize: '12px', color: '#064e3b' }}>Commands Mastered</div>
                    </div>
                    <div style={{ background: '#fef3c7', padding: '12px', borderRadius: '6px', textAlign: 'center' }}>
                      <div style={{ fontSize: '24px', fontWeight: '700', color: '#92400e' }}>
                        {selectedPet.trainingLog.filter(t => t.progress === 'Learning').length}
                      </div>
                      <div style={{ fontSize: '12px', color: '#78350f' }}>In Progress</div>
                    </div>
                  </div>
                )}

                {selectedPet.trainingLog && selectedPet.trainingLog.length > 0 ? (
                  selectedPet.trainingLog.sort((a, b) => new Date(b.date) - new Date(a.date)).map(t => (
                    <div key={t.id} style={{ background: '#f9fafb', padding: '14px', borderRadius: '6px', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'start' }}>
                        <div>
                          <strong style={{ fontSize: '15px' }}>{t.session}</strong>
                          <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>{t.date}</div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: '600',
                            background: t.progress === 'Mastered' ? '#d1fae5' : t.progress === 'Improving' ? '#dbeafe' : t.progress === 'Learning' ? '#fef3c7' : '#fee2e2',
                            color: t.progress === 'Mastered' ? '#065f46' : t.progress === 'Improving' ? '#1e40af' : t.progress === 'Learning' ? '#92400e' : '#991b1b'
                          }}>
                            {t.progress}
                          </span>
                          <button onClick={() => deleteRecord(selectedPet.id, 'trainingLog', t.id)} style={{ padding: '4px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>Delete</button>
                        </div>
                      </div>
                      <div style={{ fontSize: '13px', color: '#666', lineHeight: '1.6' }}>
                        {t.command && <div><strong>Command:</strong> {t.command}</div>}
                        {t.duration && <div><strong>Duration:</strong> {t.duration}</div>}
                        {t.trainer && <div><strong>Trainer:</strong> {t.trainer}</div>}
                        {t.notes && <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px solid #e5e7eb' }}>{t.notes}</div>}
                      </div>
                    </div>
                  ))
                ) : <p style={{ color: '#666', textAlign: 'center' }}>No training sessions recorded</p>}
              </div>
            )}

            {detailTab === 'weight' && (
              <div>
                <div style={{ background: '#f9fafb', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
                  <h5 style={{ marginTop: 0 }}>Add Weight Record</h5>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    <input type="date" value={weightForm.date} onChange={e => setWeightForm({...weightForm, date: e.target.value})} style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }} />
                    <input type="number" step="0.1" placeholder="Weight" value={weightForm.weight} onChange={e => setWeightForm({...weightForm, weight: e.target.value})} style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }} />
                    <select value={weightForm.unit} onChange={e => setWeightForm({...weightForm, unit: e.target.value})} style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}>
                      <option>kg</option>
                      <option>lbs</option>
                    </select>
                  </div>
                  <textarea placeholder="Notes" value={weightForm.notes} onChange={e => setWeightForm({...weightForm, notes: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', marginTop: '12px', minHeight: '60px', fontFamily: 'inherit' }} />
                  <button onClick={() => addWeightRecord(selectedPet.id)} style={{ marginTop: '12px', padding: '10px 16px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>Add Record</button>
                </div>

                {/* Weight Chart */}
                {selectedPet.weightHistory && selectedPet.weightHistory.length > 0 && (
                  <div style={{ background: 'white', padding: '20px', borderRadius: '8px', marginBottom: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <h5 style={{ marginTop: 0, marginBottom: '16px' }}>Weight Trend</h5>
                    <Line
                      data={{
                        labels: selectedPet.weightHistory.sort((a, b) => new Date(a.date) - new Date(b.date)).map(w => w.date),
                        datasets: [{
                          label: `Weight (${selectedPet.weightHistory[0]?.unit || 'kg'})`,
                          data: selectedPet.weightHistory.sort((a, b) => new Date(a.date) - new Date(b.date)).map(w => parseFloat(w.weight)),
                          borderColor: '#8b5cf6',
                          backgroundColor: 'rgba(139, 92, 246, 0.1)',
                          tension: 0.4,
                          fill: true,
                          pointRadius: 5,
                          pointHoverRadius: 7
                        }]
                      }}
                      options={{
                        responsive: true,
                        plugins: {
                          legend: { display: true, position: 'top' },
                          tooltip: { mode: 'index', intersect: false }
                        },
                        scales: {
                          y: {
                            beginAtZero: false,
                            title: { display: true, text: `Weight (${selectedPet.weightHistory[0]?.unit || 'kg'})` }
                          },
                          x: {
                            title: { display: true, text: 'Date' }
                          }
                        }
                      }}
                    />
                  </div>
                )}

                {/* Weight Statistics */}
                {selectedPet.weightHistory && selectedPet.weightHistory.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ background: '#dbeafe', padding: '12px', borderRadius: '6px', textAlign: 'center' }}>
                      <div style={{ fontSize: '24px', fontWeight: '700', color: '#1e40af' }}>
                        {selectedPet.weight} {selectedPet.weightHistory[0]?.unit || 'kg'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#1e3a8a' }}>Current Weight</div>
                    </div>
                    <div style={{ background: '#d1fae5', padding: '12px', borderRadius: '6px', textAlign: 'center' }}>
                      <div style={{ fontSize: '24px', fontWeight: '700', color: '#065f46' }}>
                        {Math.max(...selectedPet.weightHistory.map(w => parseFloat(w.weight)))} {selectedPet.weightHistory[0]?.unit || 'kg'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#064e3b' }}>Peak Weight</div>
                    </div>
                    <div style={{ background: '#fef3c7', padding: '12px', borderRadius: '6px', textAlign: 'center' }}>
                      <div style={{ fontSize: '24px', fontWeight: '700', color: '#92400e' }}>
                        {(selectedPet.weightHistory.length > 1 ? (
                          parseFloat(selectedPet.weightHistory[selectedPet.weightHistory.length - 1].weight) - 
                          parseFloat(selectedPet.weightHistory[0].weight)
                        ).toFixed(1) : 0)} {selectedPet.weightHistory[0]?.unit || 'kg'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#78350f' }}>Total Change</div>
                    </div>
                  </div>
                )}

                {/* Weight History Table */}
                {selectedPet.weightHistory && selectedPet.weightHistory.length > 0 ? (
                  selectedPet.weightHistory.sort((a, b) => new Date(b.date) - new Date(a.date)).map(w => (
                    <div key={w.id} style={{ background: '#f9fafb', padding: '14px', borderRadius: '6px', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <strong>{w.weight} {w.unit}</strong>
                        <button onClick={() => deleteRecord(selectedPet.id, 'weightHistory', w.id)} style={{ padding: '4px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>Delete</button>
                      </div>
                      <div style={{ fontSize: '13px', color: '#666', lineHeight: '1.6' }}>
                        <div>Date: {w.date}</div>
                        {w.notes && <div>Notes: {w.notes}</div>}
                      </div>
                    </div>
                  ))
                ) : <p style={{ color: '#666', textAlign: 'center' }}>No weight records</p>}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
