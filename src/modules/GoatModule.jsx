import React, { useState, useEffect, useRef, useMemo } from 'react'
import { loadData, saveData } from '../lib/storage'
import { exportToCSV, exportToExcel, exportToJSON } from '../lib/exportImport'
import { useDebounce } from '../lib/useDebounce'
import { logAnimalActivity } from '../lib/activityLogger'
import { BarChart } from '../components/Charts'
import { savePhoto, deletePhoto, getPhotosByEntity } from '../lib/photoAnalysis'

const GOAT_KEY = 'cattalytics:goats'
const HEALTH_KEY = 'cattalytics:goat_health'
const BREEDING_KEY = 'cattalytics:goat_breeding'
const KIDS_KEY = 'cattalytics:kids'
const KIDS_HEALTH_KEY = 'cattalytics:kids_health'

const GOAT_BREEDS = [
  'Alpine', 'Saanen', 'Nubian', 'Boer', 'Kiko', 'LaMancha', 'Toggenbutg', 'Oberhasli',
  'Nigerian Dwarf', 'Pygmy', 'Angora', 'Cashmere', 'Local', 'Mixed', 'Other'
]

const HEALTH_EVENT_TYPES = ['Checkup', 'Illness', 'Injury', 'Vaccination', 'Treatment', 'Deworming', 'Surgery', 'Other']
const SEVERITY_LEVELS = ['Mild', 'Moderate', 'Severe', 'Critical']
const HEALTH_STATUS = ['Healthy', 'Sick', 'Under Treatment', 'Quarantine', 'Recovered']
const HOUSING_TYPES = ['Individual Pen', 'Group Pen', 'Barn', 'Pasture', 'Free Range']
const COLOSTRUM_INTAKE = ['Adequate', 'Insufficient', 'Unknown']

export default function GoatModule() {
  const [goats, setGoats] = useState([])
  const [healthRecords, setHealthRecords] = useState([])
  const [breedingRecords, setBreedingRecords] = useState([])
  const [kids, setKids] = useState([])
  const [kidsHealthRecords, setKidsHealthRecords] = useState([])
  const [mainView, setMainView] = useState('goats') // goats, health, breeding, kids
  const [activeTab, setActiveTab] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterBreed, setFilterBreed] = useState('all')
  const [filterGender, setFilterGender] = useState('all')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [toast, setToast] = useState(null)
  
  // Health & Breeding form states
  const [showHealthForm, setShowHealthForm] = useState(false)
  const [showBreedingForm, setShowBreedingForm] = useState(false)
  const [editingHealthId, setEditingHealthId] = useState(null)
  const [editingBreedingId, setEditingBreedingId] = useState(null)
  const [selectedGoatForEvent, setSelectedGoatForEvent] = useState(null)
  const [showKidForm, setShowKidForm] = useState(false)
  const [editingKidId, setEditingKidId] = useState(null)
  const [showKidHealthForm, setShowKidHealthForm] = useState(false)
  const [editingKidHealthId, setEditingKidHealthId] = useState(null)
  const [kidSearch, setKidSearch] = useState('')
  
  // Debounce search
  const debouncedSearch = useDebounce(searchTerm, 300)
  
  // Form state
  const [formData, setFormData] = useState({
    id: '', tagNumber: '', name: '', breed: 'Local', gender: 'Female', 
    birthDate: '', weight: '', status: 'Active', notes: '', color: '', 
    purchaseDate: '', purchasePrice: '', vendor: '', sire: '', dam: '', 
    pregnancyStatus: 'Not Pregnant', expectedDue: '', lactationStatus: '', 
    production: { milk: 0, meat: 0 }, location: '', image: ''
  })

  const [healthFormData, setHealthFormData] = useState({
    id: '', goatId: '', goatName: '', date: new Date().toISOString().slice(0,10),
    eventType: 'Checkup', condition: '', symptoms: '', diagnosis: '', 
    severity: 'Mild', treatment: '', medication: '', dosage: '', 
    veterinarian: '', cost: '', notes: '', followUpDate: '', status: 'Ongoing'
  })

  const [breedingFormData, setBreedingFormData] = useState({
    id: '', goatId: '', goatName: '', date: new Date().toISOString().slice(0,10),
    eventType: 'Breeding', sire: '', sireName: '', method: 'Natural', 
    expectedDueDate: '', actualBirthDate: '', numberOfKids: '', 
    kidDetails: [], complications: '', notes: '', status: 'Confirmed'
  })

  const [kidFormData, setKidFormData] = useState({
    id: '', tag: '', name: '', damId: '', damName: '', sireId: '', sireName: '',
    dob: '', sex: 'Female', breed: '', birthWeight: '', currentWeight: '',
    weaningDate: '', weaningWeight: '', healthStatus: 'Healthy',
    housingType: 'Pasture', colostrumIntake: 'Adequate',
    navelTreatment: '', vaccination: [], dehorning: '', castration: 'N/A',
    notes: '', status: 'Active'
  })

  const [kidHealthForm, setKidHealthForm] = useState({
    id: '', kidId: '', kidName: '', date: new Date().toISOString().slice(0, 10),
    type: 'Vaccination', treatment: '', diagnosis: '',
    medication: '', dosage: '', veterinarian: '', cost: '', nextVisit: '', notes: ''
  })

  const fileInputRef = useRef(null)

  // Load goats from storage
  useEffect(() => {
    const loaded = loadData(GOAT_KEY, [])
    setGoats(loaded)
    const loadedHealth = loadData(HEALTH_KEY, [])
    setHealthRecords(loadedHealth)
    const loadedBreeding = loadData(BREEDING_KEY, [])
    setBreedingRecords(loadedBreeding)
    const loadedKids = loadData(KIDS_KEY, [])
    setKids(loadedKids)
    const loadedKidsHealth = loadData(KIDS_HEALTH_KEY, [])
    setKidsHealthRecords(loadedKidsHealth)
  }, [])

  // Auto-save whenever goats change
  useEffect(() => {
    if (goats.length > 0) {
      saveData(GOAT_KEY, goats)
    }
  }, [goats])

  // Auto-save health records
  useEffect(() => {
    if (healthRecords.length > 0) {
      saveData(HEALTH_KEY, healthRecords)
    }
  }, [healthRecords])

  // Auto-save breeding records
  useEffect(() => {
    if (breedingRecords.length > 0) {
      saveData(BREEDING_KEY, breedingRecords)
    }
  }, [breedingRecords])

  // Auto-save kids
  useEffect(() => {
    if (kids.length > 0) {
      saveData(KIDS_KEY, kids)
    }
  }, [kids])

  // Auto-save kids health records
  useEffect(() => {
    if (kidsHealthRecords.length > 0) {
      saveData(KIDS_HEALTH_KEY, kidsHealthRecords)
    }
  }, [kidsHealthRecords])

  // Filter goats
  const filteredGoats = useMemo(() => {
    return goats.filter(g => {
      const matchesSearch = !debouncedSearch || 
        g.name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        g.tagNumber?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        g.notes?.toLowerCase().includes(debouncedSearch.toLowerCase())
      
      const matchesBreed = filterBreed === 'all' || g.breed === filterBreed
      const matchesGender = filterGender === 'all' || g.gender === filterGender
      const matchesTab = activeTab === 'all' || 
        (activeTab === 'active' && g.status === 'Active') ||
        (activeTab === 'pregnant' && g.pregnancyStatus === 'Pregnant') ||
        (activeTab === 'milking' && g.lactationStatus === 'Milking')
      
      return matchesSearch && matchesBreed && matchesGender && matchesTab
    })
  }, [goats, debouncedSearch, filterBreed, filterGender, activeTab])

  // Form handlers
  const handleFormChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleAddNew = () => {
    setFormData({
      id: '', tagNumber: '', name: '', breed: 'Local', gender: 'Female', 
      birthDate: '', weight: '', status: 'Active', notes: '', color: '', 
      purchaseDate: '', purchasePrice: '', vendor: '', sire: '', dam: '', 
      pregnancyStatus: 'Not Pregnant', expectedDue: '', lactationStatus: '', 
      production: { milk: 0, meat: 0 }, location: '', image: ''
    })
    setEditingId(null)
    setShowAddForm(true)
  }

  const handleSave = async () => {
    if (!formData.tagNumber || !formData.name) {
      showToast('Tag number and name are required', 'error')
      return
    }

    let updated
    const goatId = editingId || 'G-' + Date.now()
    
    if (editingId) {
      updated = goats.map(g => g.id === editingId ? { ...formData } : g)
      logAnimalActivity('Edit', 'Goat', formData.name, `Updated goat ${formData.name}`)
      showToast(`Goat ${formData.name} updated`, 'success')
    } else {
      const newGoat = { ...formData, id: goatId }
      updated = [...goats, newGoat]
      logAnimalActivity('Create', 'Goat', formData.name, `Added new goat ${formData.name}`)
      showToast(`Goat ${formData.name} added`, 'success')
    }

    // Save photo to gallery if image exists and is base64
    if (formData.image && formData.image.startsWith('data:image')) {
      try {
        const blob = await fetch(formData.image).then(r => r.blob())
        const file = new File([blob], `${formData.name}_${formData.tagNumber}.jpg`, { type: 'image/jpeg' })
        await savePhoto(file, {
          category: 'animals',
          tags: ['goat', formData.breed.toLowerCase(), formData.gender.toLowerCase()],
          entityType: 'goat',
          entityId: goatId,
          entityName: formData.name
        })
      } catch (error) {
        console.error('Error saving photo to gallery:', error)
      }
    }

    setGoats(updated)
    setShowAddForm(false)
    setEditingId(null)
    setFormData({
      id: '', tagNumber: '', name: '', breed: 'Local', gender: 'Female', 
      birthDate: '', weight: '', status: 'Active', notes: '', color: '', 
      purchaseDate: '', purchasePrice: '', vendor: '', sire: '', dam: '', 
      pregnancyStatus: 'Not Pregnant', expectedDue: '', lactationStatus: '', 
      production: { milk: 0, meat: 0 }, location: '', image: ''
    })
  }

  const handleEdit = (goat) => {
    setFormData(goat)
    setEditingId(goat.id)
    setShowAddForm(true)
  }

  const handleDelete = (id, name) => {
    if (window.confirm(`Delete goat ${name}? This action cannot be undone.`)) {
      const updated = goats.filter(g => g.id !== id)
      setGoats(updated)
      
      // Delete associated photos from gallery
      try {
        const photos = getPhotosByEntity('goat', id)
        photos.forEach(photo => deletePhoto(photo.id))
      } catch (error) {
        console.error('Error deleting goat photos:', error)
      }
      
      logAnimalActivity('Delete', 'Goat', name, `Deleted goat ${name}`)
      showToast(`Goat ${name} deleted`, 'success')
    }
  }

  const handleCancel = () => {
    setShowAddForm(false)
    setEditingId(null)
    setFormData({
      id: '', tagNumber: '', name: '', breed: 'Local', gender: 'Female', 
      birthDate: '', weight: '', status: 'Active', notes: '', color: '', 
      purchaseDate: '', purchasePrice: '', vendor: '', sire: '', dam: '', 
      pregnancyStatus: 'Not Pregnant', expectedDue: '', lactationStatus: '', 
      production: { milk: 0, meat: 0 }, location: '', image: ''
    })
  }

  const showToast = (msg, type = 'info') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  // Health record handlers
  const handleAddHealth = (goatId, goatName) => {
    setSelectedGoatForEvent(goatId)
    setHealthFormData({
      id: '', goatId, goatName, date: new Date().toISOString().slice(0,10),
      eventType: 'Checkup', condition: '', symptoms: '', diagnosis: '', 
      severity: 'Mild', treatment: '', medication: '', dosage: '', 
      veterinarian: '', cost: '', notes: '', followUpDate: '', status: 'Ongoing'
    })
    setEditingHealthId(null)
    setShowHealthForm(true)
    setMainView('health')
  }

  const handleSaveHealth = () => {
    if (!healthFormData.goatId || !healthFormData.eventType) {
      showToast('Goat and event type are required', 'error')
      return
    }

    let updated
    if (editingHealthId) {
      updated = healthRecords.map(h => h.id === editingHealthId ? { ...healthFormData } : h)
      showToast('Health record updated', 'success')
    } else {
      const newRecord = { ...healthFormData, id: 'H-' + Date.now() }
      updated = [...healthRecords, newRecord]
      showToast('Health record added', 'success')
    }

    setHealthRecords(updated)
    setShowHealthForm(false)
    setEditingHealthId(null)
    logAnimalActivity('Health', 'Goat', healthFormData.goatName, `Health event: ${healthFormData.eventType}`)
  }

  const handleEditHealth = (record) => {
    setHealthFormData(record)
    setEditingHealthId(record.id)
    setShowHealthForm(true)
  }

  const handleDeleteHealth = (id) => {
    if (window.confirm('Delete this health record?')) {
      const updated = healthRecords.filter(h => h.id !== id)
      setHealthRecords(updated)
      showToast('Health record deleted', 'success')
    }
  }

  // Breeding/Kidding handlers
  const handleAddBreeding = (goatId, goatName) => {
    setSelectedGoatForEvent(goatId)
    // Calculate expected due date (150 days gestation for goats)
    const today = new Date()
    const dueDate = new Date(today.setDate(today.getDate() + 150))
    setBreedingFormData({
      id: '', goatId, goatName, date: new Date().toISOString().slice(0,10),
      eventType: 'Breeding', sire: '', sireName: '', method: 'Natural', 
      expectedDueDate: dueDate.toISOString().slice(0,10), actualBirthDate: '', 
      numberOfKids: '', kidDetails: [], complications: '', notes: '', status: 'Confirmed'
    })
    setEditingBreedingId(null)
    setShowBreedingForm(true)
    setMainView('breeding')
  }

  const handleSaveBreeding = () => {
    if (!breedingFormData.goatId || !breedingFormData.eventType) {
      showToast('Goat and event type are required', 'error')
      return
    }

    let updated
    if (editingBreedingId) {
      updated = breedingRecords.map(b => b.id === editingBreedingId ? { ...breedingFormData } : b)
      showToast('Breeding record updated', 'success')
    } else {
      const newRecord = { ...breedingFormData, id: 'B-' + Date.now() }
      updated = [...breedingRecords, newRecord]
      showToast('Breeding record added', 'success')
      
      // If it's a kidding event, update goat's pregnancy status
      if (breedingFormData.eventType === 'Kidding' && breedingFormData.actualBirthDate) {
        const updatedGoats = goats.map(g => 
          g.id === breedingFormData.goatId 
            ? { ...g, pregnancyStatus: 'Not Pregnant', lactationStatus: 'Milking' }
            : g
        )
        setGoats(updatedGoats)
      }
    }

    setBreedingRecords(updated)
    setShowBreedingForm(false)
    setEditingBreedingId(null)
    logAnimalActivity('Breeding', 'Goat', breedingFormData.goatName, `Breeding event: ${breedingFormData.eventType}`)
  }

  const handleEditBreeding = (record) => {
    setBreedingFormData(record)
    setEditingBreedingId(record.id)
    setShowBreedingForm(true)
  }

  const handleDeleteBreeding = (id) => {
    if (window.confirm('Delete this breeding record?')) {
      const updated = breedingRecords.filter(b => b.id !== id)
      setBreedingRecords(updated)
      showToast('Breeding record deleted', 'success')
    }
  }

  const handleHealthFormChange = (e) => {
    const { name, value } = e.target
    setHealthFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleBreedingFormChange = (e) => {
    const { name, value } = e.target
    setBreedingFormData(prev => ({ ...prev, [name]: value }))
  }

  // Kid handlers
  const handleAddKid = () => {
    setKidFormData({
      id: '', tag: '', name: '', damId: '', damName: '', sireId: '', sireName: '',
      dob: '', sex: 'Female', breed: '', birthWeight: '', currentWeight: '',
      weaningDate: '', weaningWeight: '', healthStatus: 'Healthy',
      housingType: 'Pasture', colostrumIntake: 'Adequate',
      navelTreatment: '', vaccination: [], dehorning: '', castration: 'N/A',
      notes: '', status: 'Active'
    })
    setEditingKidId(null)
    setShowKidForm(true)
  }

  const handleSaveKid = () => {
    if (!kidFormData.tag || !kidFormData.name) {
      showToast('Tag and name are required', 'error')
      return
    }

    let updated
    if (editingKidId) {
      updated = kids.map(k => k.id === editingKidId ? { ...kidFormData } : k)
      showToast(`Kid ${kidFormData.name} updated`, 'success')
      logAnimalActivity('Edit', 'Kid', kidFormData.name, `Updated kid ${kidFormData.name}`)
    } else {
      const newKid = { ...kidFormData, id: 'KID-' + Date.now() }
      updated = [...kids, newKid]
      showToast(`Kid ${kidFormData.name} added`, 'success')
      logAnimalActivity('Create', 'Kid', kidFormData.name, `Added new kid ${kidFormData.name}`)
    }

    setKids(updated)
    setShowKidForm(false)
    setEditingKidId(null)
  }

  const handleEditKid = (kid) => {
    setKidFormData(kid)
    setEditingKidId(kid.id)
    setShowKidForm(true)
  }

  const handleDeleteKid = (id, name) => {
    if (window.confirm(`Delete kid ${name}? This action cannot be undone.`)) {
      const updated = kids.filter(k => k.id !== id)
      setKids(updated)
      showToast(`Kid ${name} deleted`, 'success')
      logAnimalActivity('Delete', 'Kid', name, `Deleted kid ${name}`)
    }
  }

  const handleKidFormChange = (e) => {
    const { name, value } = e.target
    setKidFormData(prev => ({ ...prev, [name]: value }))
  }

  // Kid health handlers
  const handleAddKidHealth = (kidId, kidName) => {
    setKidHealthForm({
      kidId, kidName, date: new Date().toISOString().slice(0, 10),
      type: 'Vaccination', treatment: '', diagnosis: '',
      medication: '', dosage: '', veterinarian: '', cost: '', nextVisit: '', notes: ''
    })
    setEditingKidHealthId(null)
    setShowKidHealthForm(true)
  }

  const handleSaveKidHealth = () => {
    if (!kidHealthForm.kidId || !kidHealthForm.type) {
      showToast('Kid and type are required', 'error')
      return
    }

    let updated
    if (editingKidHealthId) {
      updated = kidsHealthRecords.map(h => h.id === editingKidHealthId ? { ...kidHealthForm } : h)
      showToast('Health record updated', 'success')
    } else {
      const newRecord = { ...kidHealthForm, id: 'KH-' + Date.now() }
      updated = [...kidsHealthRecords, newRecord]
      showToast('Health record added', 'success')
    }

    setKidsHealthRecords(updated)
    setEditingKidHealthId(null)
    setShowKidHealthForm(false)
    logAnimalActivity('Health', 'Kid', kidHealthForm.kidName, `Health event: ${kidHealthForm.type}`)
  }

  const handleEditKidHealth = (record) => {
    setKidHealthForm(record)
    setEditingKidHealthId(record.id)
    setShowKidHealthForm(true)
  }

  const handleDeleteKidHealth = (id) => {
    if (window.confirm('Delete this health record?')) {
      const updated = kidsHealthRecords.filter(h => h.id !== id)
      setKidsHealthRecords(updated)
      showToast('Health record deleted', 'success')
    }
  }

  const handleKidHealthFormChange = (e) => {
    const { name, value } = e.target
    setKidHealthForm(prev => ({ ...prev, [name]: value }))
  }

  // Export functions
  const handleExportCSV = () => {
    exportToCSV(filteredGoats, 'goats_inventory.csv')
    showToast('Exported to CSV', 'success')
  }

  const handleExportExcel = () => {
    exportToExcel(filteredGoats, 'goats_inventory.xlsx')
    showToast('Exported to Excel', 'success')
  }

  const handleExportJSON = () => {
    exportToJSON(filteredGoats, 'goats_inventory.json')
    showToast('Exported to JSON', 'success')
  }

  // Statistics
  const stats = useMemo(() => {
    return {
      total: goats.length,
      active: goats.filter(g => g.status === 'Active').length,
      pregnant: goats.filter(g => g.pregnancyStatus === 'Pregnant').length,
      milking: goats.filter(g => g.lactationStatus === 'Milking').length,
      maleCount: goats.filter(g => g.gender === 'Male').length,
      femaleCount: goats.filter(g => g.gender === 'Female').length,
      avgWeight: goats.length > 0 ? (goats.reduce((sum, g) => sum + (parseFloat(g.weight) || 0), 0) / goats.length).toFixed(1) : 0
    }
  }, [goats])

  return (
    <div style={{ padding: '24px', background: '#f9fafb', minHeight: '100vh' }}>
      {/* Toast notification */}
      {toast && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', 
          background: toast.type === 'success' ? '#10b981' : toast.type === 'error' ? '#ef4444' : '#3b82f6',
          color: 'white', padding: '12px 20px', borderRadius: '8px', 
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 1000
        }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>🐐 Goat Management</h1>
        <p style={{ color: '#6b7280', fontSize: '14px' }}>Manage your goat herd with full tracking and analytics</p>
        
        {/* Main View Navigation */}
        <div style={{ marginTop: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setMainView('goats')}
            style={{
              padding: '10px 20px',
              background: mainView === 'goats' ? '#059669' : '#e5e7eb',
              color: mainView === 'goats' ? 'white' : '#1f2937',
              border: 'none',
              borderRadius: '6px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            🐐 Goats
          </button>
          <button
            onClick={() => setMainView('health')}
            style={{
              padding: '10px 20px',
              background: mainView === 'health' ? '#10b981' : '#e5e7eb',
              color: mainView === 'health' ? 'white' : '#1f2937',
              border: 'none',
              borderRadius: '6px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            🏥 Health Records
          </button>
          <button
            onClick={() => setMainView('breeding')}
            style={{
              padding: '10px 20px',
              background: mainView === 'breeding' ? '#f59e0b' : '#e5e7eb',
              color: mainView === 'breeding' ? 'white' : '#1f2937',
              border: 'none',
              borderRadius: '6px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            👶 Breeding & Kidding
          </button>
          <button
            onClick={() => setMainView('kids')}
            style={{
              padding: '10px 20px',
              background: mainView === 'kids' ? '#8b5cf6' : '#e5e7eb',
              color: mainView === 'kids' ? 'white' : '#1f2937',
              border: 'none',
              borderRadius: '6px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            🐐 Kids
          </button>
        </div>
      </div>

      {/* Goats View */}
      {mainView === 'goats' && (
        <>
      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: 'white', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ color: '#6b7280', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Total Goats</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#059669' }}>{stats.total}</div>
        </div>
        <div style={{ background: 'white', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ color: '#6b7280', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Active</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#10b981' }}>{stats.active}</div>
        </div>
        <div style={{ background: 'white', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ color: '#6b7280', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Pregnant</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#f59e0b' }}>{stats.pregnant}</div>
        </div>
        <div style={{ background: 'white', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ color: '#6b7280', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Milking</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#8b5cf6' }}>{stats.milking}</div>
        </div>
        <div style={{ background: 'white', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ color: '#6b7280', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Avg Weight</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#3b82f6' }}>{stats.avgWeight} kg</div>
        </div>
      </div>

      {/* Tabs and Controls */}
      <div style={{ background: 'white', padding: '16px', borderRadius: '8px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '16px' }}>
          {[
            { id: 'all', label: 'All Goats', count: goats.length },
            { id: 'active', label: 'Active', count: stats.active },
            { id: 'pregnant', label: 'Pregnant', count: stats.pregnant },
            { id: 'milking', label: 'Milking', count: stats.milking }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '8px 16px',
                background: activeTab === tab.id ? '#059669' : '#e5e7eb',
                color: activeTab === tab.id ? 'white' : '#1f2937',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
          <div style={{ flex: 1 }} />
          <button
            onClick={handleAddNew}
            style={{
              padding: '8px 16px',
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            ➕ Add Goat
          </button>
        </div>

        {/* Search and Filters */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          <input
            type="text"
            placeholder="Search by name, tag, or notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px'
            }}
          />
          <select
            value={filterBreed}
            onChange={(e) => setFilterBreed(e.target.value)}
            style={{
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px'
            }}
          >
            <option value="all">All Breeds</option>
            {GOAT_BREEDS.map(breed => (
              <option key={breed} value={breed}>{breed}</option>
            ))}
          </select>
          <select
            value={filterGender}
            onChange={(e) => setFilterGender(e.target.value)}
            style={{
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px'
            }}
          >
            <option value="all">All Genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </div>

        {/* Export buttons */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
          <button
            onClick={handleExportCSV}
            style={{
              padding: '8px 12px',
              background: '#f3f4f6',
              color: '#1f2937',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            📥 CSV
          </button>
          <button
            onClick={handleExportExcel}
            style={{
              padding: '8px 12px',
              background: '#f3f4f6',
              color: '#1f2937',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            📊 Excel
          </button>
          <button
            onClick={handleExportJSON}
            style={{
              padding: '8px 12px',
              background: '#f3f4f6',
              color: '#1f2937',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            💾 JSON
          </button>
        </div>
      </div>

      {/* Goats Table */}
      <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden', marginBottom: '24px' }}>
        {filteredGoats.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#6b7280' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🐐</div>
            <p style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>No goats found</p>
            <p style={{ fontSize: '14px' }}>
              {searchTerm || filterBreed !== 'all' || filterGender !== 'all' 
                ? 'Try adjusting your filters' 
                : 'Add your first goat to get started'}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ background: '#f3f4f6', borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Tag #</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Name</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Breed</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Gender</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Weight (kg)</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Pregnancy</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredGoats.map((goat, idx) => (
                  <tr key={goat.id} style={{ borderBottom: '1px solid #e5e7eb', background: idx % 2 === 0 ? 'white' : '#f9fafb' }}>
                    <td style={{ padding: '12px', color: '#374151' }}><span style={{ background: '#dbeafe', color: '#1e40af', padding: '2px 8px', borderRadius: '4px', fontSize: '13px', fontWeight: '600' }}>{goat.tagNumber}</span></td>
                    <td style={{ padding: '12px', color: '#374151', fontWeight: '600' }}>{goat.name}</td>
                    <td style={{ padding: '12px', color: '#6b7280' }}>{goat.breed}</td>
                    <td style={{ padding: '12px', color: '#6b7280' }}>{goat.gender === 'Male' ? '♂️' : '♀️'} {goat.gender}</td>
                    <td style={{ padding: '12px', color: '#6b7280' }}>{goat.weight || '-'}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        background: goat.status === 'Active' ? '#dcfce7' : '#fee2e2',
                        color: goat.status === 'Active' ? '#166534' : '#991b1b',
                        padding: '4px 12px',
                        borderRadius: '4px',
                        fontSize: '13px',
                        fontWeight: '600'
                      }}>
                        {goat.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        background: goat.pregnancyStatus === 'Pregnant' ? '#fef3c7' : '#e5e7eb',
                        color: goat.pregnancyStatus === 'Pregnant' ? '#92400e' : '#6b7280',
                        padding: '4px 12px',
                        borderRadius: '4px',
                        fontSize: '13px',
                        fontWeight: '600'
                      }}>
                        {goat.pregnancyStatus}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => handleEdit(goat)}
                          style={{
                            padding: '4px 10px',
                            background: '#6366f1',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleAddHealth(goat.id, goat.name)}
                          style={{
                            padding: '4px 10px',
                            background: '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                          title="Record health event"
                        >
                          🏥 Health
                        </button>
                        <button
                          onClick={() => handleAddBreeding(goat.id, goat.name)}
                          style={{
                            padding: '4px 10px',
                            background: '#f59e0b',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                          title="Record breeding or kidding"
                        >
                          👶 Breeding
                        </button>
                        <button
                          onClick={() => handleDelete(goat.id, goat.name)}
                          style={{
                            padding: '4px 10px',
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Form - Full Width Below Table */}
      {showAddForm && (
        <div style={{ background: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: '#1f2937' }}>
            {editingId ? '✏️ Edit Goat' : '➕ Add New Goat'}
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>Tag Number *</label>
              <input
                type="text"
                name="tagNumber"
                value={formData.tagNumber}
                onChange={handleFormChange}
                placeholder="e.g., TAG-001"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleFormChange}
                placeholder="Goat name"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>Breed</label>
              <select
                name="breed"
                value={formData.breed}
                onChange={handleFormChange}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              >
                {GOAT_BREEDS.map(breed => (
                  <option key={breed} value={breed}>{breed}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>Gender</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleFormChange}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>Birth Date</label>
              <input
                type="date"
                name="birthDate"
                value={formData.birthDate}
                onChange={handleFormChange}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>Weight (kg)</label>
              <input
                type="number"
                name="weight"
                value={formData.weight}
                onChange={handleFormChange}
                placeholder="0"
                step="0.1"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>Color</label>
              <input
                type="text"
                name="color"
                value={formData.color}
                onChange={handleFormChange}
                placeholder="e.g., White with black patches"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleFormChange}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              >
                <option value="Active">Active</option>
                <option value="Sold">Sold</option>
                <option value="Deceased">Deceased</option>
                <option value="Quarantine">Quarantine</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>Pregnancy Status</label>
              <select
                name="pregnancyStatus"
                value={formData.pregnancyStatus}
                onChange={handleFormChange}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              >
                <option value="Not Pregnant">Not Pregnant</option>
                <option value="Pregnant">Pregnant</option>
                <option value="Nursing">Nursing</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>Expected Due Date</label>
              <input
                type="date"
                name="expectedDue"
                value={formData.expectedDue}
                onChange={handleFormChange}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>Lactation Status</label>
              <select
                name="lactationStatus"
                value={formData.lactationStatus}
                onChange={handleFormChange}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              >
                <option value="">Select status</option>
                <option value="Milking">Milking</option>
                <option value="Dry">Dry</option>
                <option value="Not Applicable">Not Applicable</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>Sire (Father)</label>
              <input
                type="text"
                name="sire"
                value={formData.sire}
                onChange={handleFormChange}
                placeholder="Father tag or name"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>Dam (Mother)</label>
              <input
                type="text"
                name="dam"
                value={formData.dam}
                onChange={handleFormChange}
                placeholder="Mother tag or name"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>Purchase Date</label>
              <input
                type="date"
                name="purchaseDate"
                value={formData.purchaseDate}
                onChange={handleFormChange}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>Purchase Price</label>
              <input
                type="number"
                name="purchasePrice"
                value={formData.purchasePrice}
                onChange={handleFormChange}
                placeholder="0"
                step="0.01"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>Vendor</label>
              <input
                type="text"
                name="vendor"
                value={formData.vendor}
                onChange={handleFormChange}
                placeholder="Seller name or farm"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleFormChange}
                placeholder="Barn, pasture, or pen"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleFormChange}
              placeholder="Add any additional notes about this goat..."
              rows="4"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box',
                fontFamily: 'inherit'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handleSave}
              style={{
                padding: '10px 20px',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              💾 Save Goat
            </button>
            <button
              onClick={handleCancel}
              style={{
                padding: '10px 20px',
                background: '#e5e7eb',
                color: '#1f2937',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              ✖️ Cancel
            </button>
          </div>
        </div>
      )}
        </>
      )}

      {/* Health Records View */}
      {mainView === 'health' && (
        <div>
          <div style={{ background: 'white', padding: '16px', borderRadius: '8px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937' }}>Health Records</h3>
              <button
                onClick={() => {
                  setShowHealthForm(true)
                  setEditingHealthId(null)
                  setHealthFormData({
                    id: '', goatId: '', goatName: '', date: new Date().toISOString().slice(0,10),
                    eventType: 'Checkup', condition: '', symptoms: '', diagnosis: '', 
                    severity: 'Mild', treatment: '', medication: '', dosage: '', 
                    veterinarian: '', cost: '', notes: '', followUpDate: '', status: 'Ongoing'
                  })
                }}
                style={{
                  padding: '8px 16px',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                ➕ Add Health Record
              </button>
            </div>

            {healthRecords.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#6b7280', padding: '40px' }}>No health records yet</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ background: '#f3f4f6', borderBottom: '1px solid #e5e7eb' }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Date</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Goat</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Event Type</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Condition</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Severity</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Status</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {healthRecords.map((record, idx) => (
                    <tr key={record.id} style={{ borderBottom: '1px solid #e5e7eb', background: idx % 2 === 0 ? 'white' : '#f9fafb' }}>
                      <td style={{ padding: '12px', color: '#374151' }}>{record.date}</td>
                      <td style={{ padding: '12px', color: '#374151', fontWeight: '600' }}>{record.goatName}</td>
                      <td style={{ padding: '12px', color: '#6b7280' }}>{record.eventType}</td>
                      <td style={{ padding: '12px', color: '#6b7280' }}>{record.condition || '-'}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          background: record.severity === 'Critical' ? '#fee2e2' : record.severity === 'Severe' ? '#fed7aa' : record.severity === 'Moderate' ? '#fef3c7' : '#dcfce7',
                          color: record.severity === 'Critical' ? '#991b1b' : record.severity === 'Severe' ? '#9a3412' : record.severity === 'Moderate' ? '#92400e' : '#166534',
                          padding: '4px 12px',
                          borderRadius: '4px',
                          fontSize: '13px',
                          fontWeight: '600'
                        }}>
                          {record.severity}
                        </span>
                      </td>
                      <td style={{ padding: '12px', color: '#6b7280' }}>{record.status}</td>
                      <td style={{ padding: '12px' }}>
                        <button
                          onClick={() => handleEditHealth(record)}
                          style={{
                            padding: '4px 10px',
                            background: '#6366f1',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            marginRight: '4px'
                          }}
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteHealth(record.id)}
                          style={{
                            padding: '4px 10px',
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Health Form */}
          {showHealthForm && (
            <div style={{ background: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: '#1f2937' }}>
                {editingHealthId ? '✏️ Edit Health Record' : '➕ Add Health Record'}
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>Goat *</label>
                  <select
                    name="goatId"
                    value={healthFormData.goatId}
                    onChange={(e) => {
                      const goat = goats.find(g => g.id === e.target.value)
                      setHealthFormData(prev => ({ ...prev, goatId: e.target.value, goatName: goat?.name || '' }))
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="">Select goat</option>
                    {goats.map(g => (
                      <option key={g.id} value={g.id}>{g.name} ({g.tagNumber})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>Date *</label>
                  <input
                    type="date"
                    name="date"
                    value={healthFormData.date}
                    onChange={handleHealthFormChange}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>Event Type *</label>
                  <select
                    name="eventType"
                    value={healthFormData.eventType}
                    onChange={handleHealthFormChange}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  >
                    {HEALTH_EVENT_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>Severity</label>
                  <select
                    name="severity"
                    value={healthFormData.severity}
                    onChange={handleHealthFormChange}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  >
                    {SEVERITY_LEVELS.map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>Condition/Disease</label>
                  <input
                    type="text"
                    name="condition"
                    value={healthFormData.condition}
                    onChange={handleHealthFormChange}
                    placeholder="e.g., Pneumonia, Worms"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>Symptoms</label>
                  <input
                    type="text"
                    name="symptoms"
                    value={healthFormData.symptoms}
                    onChange={handleHealthFormChange}
                    placeholder="e.g., Coughing, fever"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>Treatment</label>
                  <input
                    type="text"
                    name="treatment"
                    value={healthFormData.treatment}
                    onChange={handleHealthFormChange}
                    placeholder="Treatment provided"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>Medication</label>
                  <input
                    type="text"
                    name="medication"
                    value={healthFormData.medication}
                    onChange={handleHealthFormChange}
                    placeholder="Medication name"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>Dosage</label>
                  <input
                    type="text"
                    name="dosage"
                    value={healthFormData.dosage}
                    onChange={handleHealthFormChange}
                    placeholder="e.g., 5ml twice daily"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>Veterinarian</label>
                  <input
                    type="text"
                    name="veterinarian"
                    value={healthFormData.veterinarian}
                    onChange={handleHealthFormChange}
                    placeholder="Vet name"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>Cost</label>
                  <input
                    type="number"
                    name="cost"
                    value={healthFormData.cost}
                    onChange={handleHealthFormChange}
                    placeholder="0"
                    step="0.01"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>Follow-up Date</label>
                  <input
                    type="date"
                    name="followUpDate"
                    value={healthFormData.followUpDate}
                    onChange={handleHealthFormChange}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>Status</label>
                  <select
                    name="status"
                    value={healthFormData.status}
                    onChange={handleHealthFormChange}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="Ongoing">Ongoing</option>
                    <option value="Recovered">Recovered</option>
                    <option value="Monitoring">Monitoring</option>
                    <option value="Chronic">Chronic</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>Notes</label>
                <textarea
                  name="notes"
                  value={healthFormData.notes}
                  onChange={handleHealthFormChange}
                  placeholder="Additional notes..."
                  rows="4"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={handleSaveHealth}
                  style={{
                    padding: '10px 20px',
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  💾 Save Record
                </button>
                <button
                  onClick={() => {
                    setShowHealthForm(false)
                    setEditingHealthId(null)
                  }}
                  style={{
                    padding: '10px 20px',
                    background: '#e5e7eb',
                    color: '#1f2937',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  ✖️ Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Breeding & Kidding View */}
      {mainView === 'breeding' && (
        <div>
          <div style={{ background: 'white', padding: '16px', borderRadius: '8px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937' }}>Breeding & Kidding Records</h3>
              <button
                onClick={() => {
                  setShowBreedingForm(true)
                  setEditingBreedingId(null)
                  const today = new Date()
                  const dueDate = new Date(today.setDate(today.getDate() + 150))
                  setBreedingFormData({
                    id: '', goatId: '', goatName: '', date: new Date().toISOString().slice(0,10),
                    eventType: 'Breeding', sire: '', sireName: '', method: 'Natural', 
                    expectedDueDate: dueDate.toISOString().slice(0,10), actualBirthDate: '', 
                    numberOfKids: '', kidDetails: [], complications: '', notes: '', status: 'Confirmed'
                  })
                }}
                style={{
                  padding: '8px 16px',
                  background: '#f59e0b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                ➕ Add Record
              </button>
            </div>

            {breedingRecords.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#6b7280', padding: '40px' }}>No breeding records yet</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ background: '#f3f4f6', borderBottom: '1px solid #e5e7eb' }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Date</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Goat</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Event</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Sire</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Expected Due</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Birth Date</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Kids</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {breedingRecords.map((record, idx) => (
                    <tr key={record.id} style={{ borderBottom: '1px solid #e5e7eb', background: idx % 2 === 0 ? 'white' : '#f9fafb' }}>
                      <td style={{ padding: '12px', color: '#374151' }}>{record.date}</td>
                      <td style={{ padding: '12px', color: '#374151', fontWeight: '600' }}>{record.goatName}</td>
                      <td style={{ padding: '12px', color: '#6b7280' }}>{record.eventType}</td>
                      <td style={{ padding: '12px', color: '#6b7280' }}>{record.sireName || '-'}</td>
                      <td style={{ padding: '12px', color: '#6b7280' }}>{record.expectedDueDate || '-'}</td>
                      <td style={{ padding: '12px', color: '#6b7280' }}>{record.actualBirthDate || '-'}</td>
                      <td style={{ padding: '12px', color: '#6b7280' }}>{record.numberOfKids || '-'}</td>
                      <td style={{ padding: '12px' }}>
                        <button
                          onClick={() => handleEditBreeding(record)}
                          style={{
                            padding: '4px 10px',
                            background: '#6366f1',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            marginRight: '4px'
                          }}
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteBreeding(record.id)}
                          style={{
                            padding: '4px 10px',
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Breeding Form */}
          {showBreedingForm && (
            <div style={{ background: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: '#1f2937' }}>
                {editingBreedingId ? '✏️ Edit Breeding Record' : '➕ Add Breeding/Kidding Record'}
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>Goat (Dam) *</label>
                  <select
                    name="goatId"
                    value={breedingFormData.goatId}
                    onChange={(e) => {
                      const goat = goats.find(g => g.id === e.target.value)
                      setBreedingFormData(prev => ({ ...prev, goatId: e.target.value, goatName: goat?.name || '' }))
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="">Select goat</option>
                    {goats.filter(g => g.gender === 'Female').map(g => (
                      <option key={g.id} value={g.id}>{g.name} ({g.tagNumber})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>Date *</label>
                  <input
                    type="date"
                    name="date"
                    value={breedingFormData.date}
                    onChange={handleBreedingFormChange}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>Event Type *</label>
                  <select
                    name="eventType"
                    value={breedingFormData.eventType}
                    onChange={handleBreedingFormChange}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="Breeding">Breeding</option>
                    <option value="Kidding">Kidding (Birth)</option>
                    <option value="Pregnancy Check">Pregnancy Check</option>
                    <option value="Miscarriage">Miscarriage</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>Breeding Method</label>
                  <select
                    name="method"
                    value={breedingFormData.method}
                    onChange={handleBreedingFormChange}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="Natural">Natural</option>
                    <option value="Artificial Insemination">Artificial Insemination</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>Sire Tag/ID</label>
                  <input
                    type="text"
                    name="sire"
                    value={breedingFormData.sire}
                    onChange={handleBreedingFormChange}
                    placeholder="Sire tag number"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>Sire Name</label>
                  <input
                    type="text"
                    name="sireName"
                    value={breedingFormData.sireName}
                    onChange={handleBreedingFormChange}
                    placeholder="Sire name"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>Expected Due Date</label>
                  <input
                    type="date"
                    name="expectedDueDate"
                    value={breedingFormData.expectedDueDate}
                    onChange={handleBreedingFormChange}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                  <small style={{ color: '#6b7280', fontSize: '12px' }}>Goat gestation: ~150 days</small>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>Actual Birth Date</label>
                  <input
                    type="date"
                    name="actualBirthDate"
                    value={breedingFormData.actualBirthDate}
                    onChange={handleBreedingFormChange}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                  <small style={{ color: '#6b7280', fontSize: '12px' }}>Leave blank if not yet born</small>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>Number of Kids</label>
                  <input
                    type="number"
                    name="numberOfKids"
                    value={breedingFormData.numberOfKids}
                    onChange={handleBreedingFormChange}
                    placeholder="0"
                    min="0"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>Status</label>
                  <select
                    name="status"
                    value={breedingFormData.status}
                    onChange={handleBreedingFormChange}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="Confirmed">Confirmed</option>
                    <option value="Pending">Pending</option>
                    <option value="Failed">Failed</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>Complications/Notes</label>
                <textarea
                  name="complications"
                  value={breedingFormData.complications}
                  onChange={handleBreedingFormChange}
                  placeholder="Any complications or additional notes..."
                  rows="4"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={handleSaveBreeding}
                  style={{
                    padding: '10px 20px',
                    background: '#f59e0b',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  💾 Save Record
                </button>
                <button
                  onClick={() => {
                    setShowBreedingForm(false)
                    setEditingBreedingId(null)
                  }}
                  style={{
                    padding: '10px 20px',
                    background: '#e5e7eb',
                    color: '#1f2937',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  ✖️ Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Kids View */}
      {mainView === 'kids' && (
        <div>
          {/* Kids Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div style={{ background: 'white', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <div style={{ color: '#6b7280', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Total Kids</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#8b5cf6' }}>{kids.length}</div>
            </div>
            <div style={{ background: 'white', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <div style={{ color: '#6b7280', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Active</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#3b82f6' }}>{kids.filter(k => k.status === 'Active').length}</div>
            </div>
            <div style={{ background: 'white', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <div style={{ color: '#6b7280', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Healthy</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#10b981' }}>{kids.filter(k => k.healthStatus === 'Healthy').length}</div>
            </div>
            <div style={{ background: 'white', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <div style={{ color: '#6b7280', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Avg Weight</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#f59e0b' }}>
                {kids.length > 0 ? (kids.reduce((sum, k) => sum + (parseFloat(k.currentWeight) || 0), 0) / kids.length).toFixed(1) : 0} kg
              </div>
            </div>
          </div>

          {/* Kids Controls */}
          <div style={{ background: 'white', padding: '16px', borderRadius: '8px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Search kids by name, tag, or dam..."
                value={kidSearch}
                onChange={(e) => setKidSearch(e.target.value)}
                style={{
                  flex: 1,
                  minWidth: '200px',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
              <button
                onClick={handleAddKid}
                style={{
                  padding: '10px 20px',
                  background: '#8b5cf6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                ➕ Add Kid
              </button>
            </div>
          </div>

          {/* Kids Table */}
          <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden', marginBottom: '24px' }}>
            {kids.filter(k => !kidSearch || k.name?.toLowerCase().includes(kidSearch.toLowerCase()) || k.tag?.toLowerCase().includes(kidSearch.toLowerCase()) || k.damName?.toLowerCase().includes(kidSearch.toLowerCase())).length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#6b7280' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>🐐</div>
                <p style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>No kids found</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ background: '#f3f4f6', borderBottom: '1px solid #e5e7eb' }}>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Tag</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Name</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Dam</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>DOB</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Sex</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Weight (kg)</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Health</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {kids.filter(k => !kidSearch || k.name?.toLowerCase().includes(kidSearch.toLowerCase()) || k.tag?.toLowerCase().includes(kidSearch.toLowerCase()) || k.damName?.toLowerCase().includes(kidSearch.toLowerCase())).map((kid, idx) => (
                      <tr key={kid.id} style={{ borderBottom: '1px solid #e5e7eb', background: idx % 2 === 0 ? 'white' : '#f9fafb' }}>
                        <td style={{ padding: '12px', color: '#374151' }}>
                          <span style={{ background: '#ede9fe', color: '#6d28d9', padding: '2px 8px', borderRadius: '4px', fontSize: '13px', fontWeight: '600' }}>
                            {kid.tag}
                          </span>
                        </td>
                        <td style={{ padding: '12px', color: '#374151', fontWeight: '600' }}>{kid.name}</td>
                        <td style={{ padding: '12px', color: '#6b7280' }}>{kid.damName || '-'}</td>
                        <td style={{ padding: '12px', color: '#6b7280' }}>{kid.dob || '-'}</td>
                        <td style={{ padding: '12px', color: '#6b7280' }}>{kid.sex === 'Male' ? '♂️' : '♀️'}</td>
                        <td style={{ padding: '12px', color: '#6b7280' }}>{kid.currentWeight || '-'}</td>
                        <td style={{ padding: '12px' }}>
                          <span style={{
                            background: kid.healthStatus === 'Healthy' ? '#dcfce7' : '#fee2e2',
                            color: kid.healthStatus === 'Healthy' ? '#166534' : '#991b1b',
                            padding: '4px 12px',
                            borderRadius: '4px',
                            fontSize: '13px',
                            fontWeight: '600'
                          }}>
                            {kid.healthStatus}
                          </span>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            <button
                              onClick={() => handleEditKid(kid)}
                              style={{
                                padding: '4px 10px',
                                background: '#6366f1',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '12px',
                                fontWeight: '600',
                                cursor: 'pointer'
                              }}
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleAddKidHealth(kid.id, kid.name)}
                              style={{
                                padding: '4px 10px',
                                background: '#10b981',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '12px',
                                fontWeight: '600',
                                cursor: 'pointer'
                              }}
                              title="Add health record"
                            >
                              🏥
                            </button>
                            <button
                              onClick={() => handleDeleteKid(kid.id, kid.name)}
                              style={{
                                padding: '4px 10px',
                                background: '#ef4444',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '12px',
                                fontWeight: '600',
                                cursor: 'pointer'
                              }}
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Add/Edit Kid Form */}
          {showKidForm && (
            <div style={{ background: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: '#1f2937' }}>
                {editingKidId ? '✏️ Edit Kid' : '➕ Add New Kid'}
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>Tag Number *</label>
                  <input
                    type="text"
                    name="tag"
                    value={kidFormData.tag}
                    onChange={handleKidFormChange}
                    placeholder="e.g., KID-001"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={kidFormData.name}
                    onChange={handleKidFormChange}
                    placeholder="Kid name"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>Dam (Mother)</label>
                  <select
                    name="damId"
                    value={kidFormData.damId}
                    onChange={(e) => {
                      const goat = goats.find(g => g.id === e.target.value)
                      setKidFormData(prev => ({ ...prev, damId: e.target.value, damName: goat?.name || '' }))
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="">Select dam</option>
                    {goats.filter(g => g.gender === 'Female').map(g => (
                      <option key={g.id} value={g.id}>{g.name} ({g.tagNumber})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>Sire (Father)</label>
                  <input
                    type="text"
                    name="sireName"
                    value={kidFormData.sireName}
                    onChange={handleKidFormChange}
                    placeholder="Sire name or tag"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>Date of Birth</label>
                  <input
                    type="date"
                    name="dob"
                    value={kidFormData.dob}
                    onChange={handleKidFormChange}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>Sex</label>
                  <select
                    name="sex"
                    value={kidFormData.sex}
                    onChange={handleKidFormChange}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>Breed</label>
                  <input
                    type="text"
                    name="breed"
                    value={kidFormData.breed}
                    onChange={handleKidFormChange}
                    placeholder="Breed"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>Birth Weight (kg)</label>
                  <input
                    type="number"
                    name="birthWeight"
                    value={kidFormData.birthWeight}
                    onChange={handleKidFormChange}
                    placeholder="0"
                    step="0.1"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>Current Weight (kg)</label>
                  <input
                    type="number"
                    name="currentWeight"
                    value={kidFormData.currentWeight}
                    onChange={handleKidFormChange}
                    placeholder="0"
                    step="0.1"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>Health Status</label>
                  <select
                    name="healthStatus"
                    value={kidFormData.healthStatus}
                    onChange={handleKidFormChange}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  >
                    {HEALTH_STATUS.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>Housing Type</label>
                  <select
                    name="housingType"
                    value={kidFormData.housingType}
                    onChange={handleKidFormChange}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  >
                    {HOUSING_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>Colostrum Intake</label>
                  <select
                    name="colostrumIntake"
                    value={kidFormData.colostrumIntake}
                    onChange={handleKidFormChange}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  >
                    {COLOSTRUM_INTAKE.map(intake => (
                      <option key={intake} value={intake}>{intake}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>Weaning Date</label>
                  <input
                    type="date"
                    name="weaningDate"
                    value={kidFormData.weaningDate}
                    onChange={handleKidFormChange}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>Weaning Weight (kg)</label>
                  <input
                    type="number"
                    name="weaningWeight"
                    value={kidFormData.weaningWeight}
                    onChange={handleKidFormChange}
                    placeholder="0"
                    step="0.1"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>Status</label>
                  <select
                    name="status"
                    value={kidFormData.status}
                    onChange={handleKidFormChange}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="Active">Active</option>
                    <option value="Weaned">Weaned</option>
                    <option value="Sold">Sold</option>
                    <option value="Deceased">Deceased</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>Notes</label>
                <textarea
                  name="notes"
                  value={kidFormData.notes}
                  onChange={handleKidFormChange}
                  placeholder="Additional notes..."
                  rows="4"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={handleSaveKid}
                  style={{
                    padding: '10px 20px',
                    background: '#8b5cf6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  💾 Save Kid
                </button>
                <button
                  onClick={() => {
                    setShowKidForm(false)
                    setEditingKidId(null)
                  }}
                  style={{
                    padding: '10px 20px',
                    background: '#e5e7eb',
                    color: '#1f2937',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  ✖️ Cancel
                </button>
              </div>
            </div>
          )}

          {/* Kids Health Records */}
          {showKidHealthForm && (
            <div style={{ background: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: '#1f2937' }}>
                {editingKidHealthId ? '✏️ Edit Health Record' : '➕ Add Health Record'}
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>Kid *</label>
                  <select
                    name="kidId"
                    value={kidHealthForm.kidId}
                    onChange={(e) => {
                      const kid = kids.find(k => k.id === e.target.value)
                      setKidHealthForm(prev => ({ ...prev, kidId: e.target.value, kidName: kid?.name || '' }))
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="">Select kid</option>
                    {kids.map(k => (
                      <option key={k.id} value={k.id}>{k.name} ({k.tag})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>Date *</label>
                  <input
                    type="date"
                    name="date"
                    value={kidHealthForm.date}
                    onChange={handleKidHealthFormChange}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>Type *</label>
                  <select
                    name="type"
                    value={kidHealthForm.type}
                    onChange={handleKidHealthFormChange}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="Vaccination">Vaccination</option>
                    <option value="Checkup">Checkup</option>
                    <option value="Illness">Illness</option>
                    <option value="Injury">Injury</option>
                    <option value="Deworming">Deworming</option>
                    <option value="Treatment">Treatment</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>Treatment</label>
                  <input
                    type="text"
                    name="treatment"
                    value={kidHealthForm.treatment}
                    onChange={handleKidHealthFormChange}
                    placeholder="Treatment provided"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>Diagnosis</label>
                  <input
                    type="text"
                    name="diagnosis"
                    value={kidHealthForm.diagnosis}
                    onChange={handleKidHealthFormChange}
                    placeholder="Diagnosis"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>Medication</label>
                  <input
                    type="text"
                    name="medication"
                    value={kidHealthForm.medication}
                    onChange={handleKidHealthFormChange}
                    placeholder="Medication name"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>Dosage</label>
                  <input
                    type="text"
                    name="dosage"
                    value={kidHealthForm.dosage}
                    onChange={handleKidHealthFormChange}
                    placeholder="Dosage"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>Veterinarian</label>
                  <input
                    type="text"
                    name="veterinarian"
                    value={kidHealthForm.veterinarian}
                    onChange={handleKidHealthFormChange}
                    placeholder="Vet name"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>Cost</label>
                  <input
                    type="number"
                    name="cost"
                    value={kidHealthForm.cost}
                    onChange={handleKidHealthFormChange}
                    placeholder="0"
                    step="0.01"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>Next Visit</label>
                  <input
                    type="date"
                    name="nextVisit"
                    value={kidHealthForm.nextVisit}
                    onChange={handleKidHealthFormChange}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>Notes</label>
                <textarea
                  name="notes"
                  value={kidHealthForm.notes}
                  onChange={handleKidHealthFormChange}
                  placeholder="Additional notes..."
                  rows="4"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={handleSaveKidHealth}
                  style={{
                    padding: '10px 20px',
                    background: '#8b5cf6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  💾 Save Record
                </button>
                <button
                  onClick={() => {
                    setEditingKidHealthId(null)
                    setShowKidHealthForm(false)
                    setKidHealthForm({
                      id: '', kidId: '', kidName: '', date: new Date().toISOString().slice(0, 10),
                      type: 'Vaccination', treatment: '', diagnosis: '',
                      medication: '', dosage: '', veterinarian: '', cost: '', nextVisit: '', notes: ''
                    })
                  }}
                  style={{
                    padding: '10px 20px',
                    background: '#e5e7eb',
                    color: '#1f2937',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  ✖️ Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
