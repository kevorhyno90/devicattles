import React, { useEffect, useRef, useState } from 'react'
// Pest and Disease Management submodules
import { useEffect as useNotificationEffect } from 'react'
import { exportToCSV, exportToExcel, exportToJSON, importFromCSV, importFromJSON } from '../lib/exportImport'
import CropCV from '../components/crop/CropCV'

const SAMPLE = [
  {
    id: 'C-001',
    name: 'Premium Alfalfa',
    variety: 'Vernal',
    planted: '2025-03-15',
    expectedHarvest: '2025-07-15',
    actualHarvest: '',
    area: 5.2,
    field: 'North Field A',
    status: 'Growing',
    soilType: 'Clay Loam',
    irrigationType: 'Sprinkler',
    seedCost: 450,
    notes: 'Premium alfalfa field with excellent soil conditions',
    cropType: 'Forage',
    certificationLevel: 'Certified Organic',
    marketDestination: 'Local Dairy Farms'
  },
  {
    id: 'C-002',
    name: 'Field Corn',
    variety: 'Pioneer 1234',
    planted: '2025-04-20',
    expectedHarvest: '2025-09-15',
    actualHarvest: '',
    area: 12.8,
    field: 'South Field B',
    status: 'Planted',
    soilType: 'Sandy Loam',
    irrigationType: 'Center Pivot',
    seedCost: 2800,
    notes: '',
    cropType: 'Grain',
    certificationLevel: 'Conventional',
    marketDestination: 'Grain Elevator'
  }
]

const CROP_TYPES = ['Grain', 'Forage', 'Vegetable', 'Fruit', 'Cover Crop', 'Other']
const SOIL_TYPES = ['Clay', 'Clay Loam', 'Loam', 'Sandy Loam', 'Sand', 'Silt', 'Silt Loam']
const IRRIGATION_TYPES = ['Dryland', 'Sprinkler', 'Drip', 'Center Pivot', 'Flood', 'Furrow', 'Drip Irrigation']
const VEGETABLE_TYPES = ['Tomato', 'Onion', 'Cabbage', 'Carrot', 'Spinach', 'Pepper', 'Lettuce', 'Other']
const CROP_STATUS = ['Planned', 'Planted', 'Germinating', 'Growing', 'Flowering', 'Mature', 'Harvested', 'Failed']
const CERTIFICATION_LEVELS = ['Conventional', 'Certified Organic', 'Transitional Organic', 'Non-GMO']

const PLANT_RECORD_CATALOG = {
  banana: {
    Establishment: ['Planting Materials', 'Sucker Selection', 'Field Layout', 'Plant Density', 'Planting Date'],
    Agronomy: ['Mulching Logs', 'Desuckering', 'Deleafing', 'Propping', 'Bunch Management'],
    Nutrition: ['Fertilizer Plan', 'Manure Inputs', 'Micronutrients', 'Soil Test Results', 'Leaf Tissue Analysis'],
    Protection: ['Sigatoka Monitoring', 'Banana Weevil Control', 'Nematode Management', 'IPM Activities', 'Spray Records'],
    Harvest: ['Bunch Counts', 'Grade by Size', 'Maturity Index', 'Harvest Dates', 'Loss Records']
  },
  sweetBanana: {
    Establishment: ['Tissue Culture Batches', 'Plot Mapping', 'Planting Schedule', 'Stand Count'],
    Quality: ['Sugar/Brix Readings', 'Fruit Appearance Scores', 'Ripening Stages', 'Consumer Preference Notes'],
    PostHarvest: ['Handling Practices', 'Packhouse Records', 'Crate Tracking', 'Damage Reports'],
    Market: ['Local Market Lots', 'Wholesale Pricing', 'Buyer Feedback', 'Daily Sales Volume']
  },
  vegetables: {
    Planning: ['Crop Calendar', 'Nursery Batches', 'Transplant Dates', 'Bed Preparation', 'Rotation Plan'],
    Inputs: ['Seed Lots', 'Fertilizer Application', 'Irrigation Events', 'Mulch Usage', 'Labour Logs'],
    Health: ['Pest Scouting', 'Disease Scouting', 'Treatment Actions', 'PHI Tracking', 'Re-entry Intervals'],
    Harvest: ['Harvest Windows', 'Yield by Plot', 'Grade-Out', 'Post-Harvest Wash Logs', 'Cold Storage Logs']
  },
  herbs: {
    Production: ['Propagation Records', 'Cutting Cycles', 'Biomass Yield', 'Essential Oil Yield', 'Dry Matter %'],
    Quality: ['Aroma Profile', 'Moisture Test', 'Cleanliness Checks', 'Foreign Matter %', 'Lab Certificates'],
    Compliance: ['Organic Input Logs', 'Traceability Batches', 'Certification Audits', 'Buyer Specs']
  },
  tea: {
    FieldOps: ['Plucking Rounds', 'Shoot Standards', 'Pruning Schedule', 'Skiffing Records', 'Shade Management'],
    Agronomy: ['Soil Acidity', 'Fertilizer Program', 'Weed Control', 'Drainage Maintenance', 'Rainfall Logs'],
    FactoryLink: ['Leaf Delivery Weights', 'Factory Rejections', 'Quality Deductions', 'Payment Slips']
  },
  avocadoExport: {
    Orchard: ['Tree Registry', 'Flowering Intensity', 'Fruit Set Counts', 'Canopy Management', 'Irrigation Scheduling'],
    Compliance: ['MRL Compliance', 'GlobalG.A.P. Checks', 'Phytosanitary Records', 'Residue Tests', 'Packhouse Audits'],
    Export: ['Export Lots', 'Container Loading', 'Destination Market', 'Incoterms', 'Shipment Tracking', 'Claims & Returns']
  },
  fruits: {
    OrchardRecords: ['Variety Blocks', 'Phenology Stage', 'Fruit Thinning', 'Fruit Bagging', 'Sunburn Control'],
    Quality: ['Brix/Acidity', 'Size Grading', 'Color Index', 'Defect Rates', 'Shelf-life Tests'],
    Commercial: ['Contract Sales', 'Spot Sales', 'Value Addition', 'Processing Batches', 'Revenue by Variety']
  }
}

const PLANT_SUBMODULE_META = {
  banana: { icon: '🍌', label: 'Bananas', aliases: ['banana'] },
  sweetBanana: { icon: '🍯', label: 'Sweet Banana', aliases: ['sweet banana', 'dessert banana'] },
  vegetables: { icon: '🥬', label: 'Vegetables', aliases: ['vegetable', 'greens'] },
  herbs: { icon: '🌿', label: 'Herbs', aliases: ['herb', 'medicinal'] },
  tea: { icon: '🍃', label: 'Tea Plantation', aliases: ['tea', 'tea plantation'] },
  avocadoExport: { icon: '🥑', label: 'Export Avocado', aliases: ['avocado', 'export avocado'] },
  fruits: { icon: '🍎', label: 'Fruits', aliases: ['fruit', 'orchard fruits'] }
}

const DAY_MS = 24 * 60 * 60 * 1000
const ALERT_SEVERITY_RANK = { critical: 0, warning: 1, info: 2 }
const ALERT_THEME = {
  critical: { background: '#fef2f2', border: '#fecaca', text: '#991b1b', badgeBackground: '#dc2626', badgeText: '#ffffff' },
  warning: { background: '#fff7ed', border: '#fdba74', text: '#9a3412', badgeBackground: '#f59e0b', badgeText: '#ffffff' },
  info: { background: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8', badgeBackground: '#2563eb', badgeText: '#ffffff' }
}

const parseDateValue = (value) => {
  const timestamp = Date.parse(value || '')
  return Number.isNaN(timestamp) ? null : timestamp
}

const formatCurrency = (value) => `KES ${(Number(value) || 0).toFixed(2)}`

export default function Crops({ initialTab = 'list', initialPlantSubmodule = 'all', recordSource = null }) {
  // Azolla state
  const KEY = 'cattalytics:crops'
  const YIELD_KEY = 'cattalytics:crops:yields'
  const SALES_KEY = 'cattalytics:crops:sales'
  const TREATMENT_KEY = 'cattalytics:crops:treatments'
  const COST_KEY = 'cattalytics:crops:costs'
  
  const [tab, setTab] = useState('list')
  const [pestRecords, setPestRecords] = useState([])
  const [diseaseRecords, setDiseaseRecords] = useState([])
  const [reminders, setReminders] = useState([])
  const [showPestForm, setShowPestForm] = useState(false)
  const [showDiseaseForm, setShowDiseaseForm] = useState(false)
  const [pestForm, setPestForm] = useState({ cropId: '', date: '', pest: '', severity: '', action: '', notes: '' })
  const [diseaseForm, setDiseaseForm] = useState({ cropId: '', date: '', disease: '', severity: '', action: '', notes: '' })
  const [reminderForm, setReminderForm] = useState({ cropId: '', date: '', message: '' })
  const [crops, setCrops] = useState([])
  const [yieldRecords, setYieldRecords] = useState([])
  const [salesRecords, setSalesRecords] = useState([])
  const [treatmentRecords, setTreatmentRecords] = useState([])
  const [costRecords, setCostRecords] = useState([])
  const [plantSubmodule, setPlantSubmodule] = useState('all')
  const [filter, setFilter] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [sortBy, setSortBy] = useState('planted')
  
  // Inline edit state
  const [inlineEditId, setInlineEditId] = useState(null)
  const [inlineData, setInlineData] = useState({})
  const [inlineType, setInlineType] = useState(null) // 'crop', 'pest', 'disease'
  const [toast, setToast] = useState(null)
  const [lastChange, setLastChange] = useState(null)
  const [showYieldForm, setShowYieldForm] = useState(false)
  const [showSalesForm, setShowSalesForm] = useState(false)
  const [showTreatmentForm, setShowTreatmentForm] = useState(false)
  const [showCostForm, setShowCostForm] = useState(false)

  const [yieldForm, setYieldForm] = useState({
    cropId: '',
    plantSubmodule: '',
    date: '',
    quantity: '',
    unit: 'kg',
    grade: 'A',
    qualityNote: '',
    losses: '',
    notes: ''
  })

  const [salesForm, setSalesForm] = useState({
    cropId: '',
    plantSubmodule: '',
    date: '',
    buyer: '',
    market: '',
    quantity: '',
    unit: 'kg',
    unitPrice: '',
    totalValue: '',
    channel: 'Local',
    notes: ''
  })

  const [treatmentForm, setTreatmentForm] = useState({
    cropId: '',
    plantSubmodule: '',
    date: '',
    category: 'Fertilizer',
    inputName: '',
    dosage: '',
    method: 'Foliar',
    reason: '',
    cost: '',
    withholdingDays: '',
    notes: ''
  })

  const [costForm, setCostForm] = useState({
    cropId: '',
    plantSubmodule: '',
    date: '',
    category: 'Labor',
    amount: '',
    vendor: '',
    reference: '',
    notes: ''
  })
  
  const emptyCrop = {
    plantSubmodule: '',
    name: '',
    variety: '',
    field: '',
    area: '',
    planted: '',
    expectedHarvest: '',
    actualHarvest: '',
    soilType: 'Loam',
    irrigationType: 'Sprinkler',
    status: 'Planned',
    cropType: 'Grain',
    vegetableType: '',
    rowSpacing: '',
    plantSpacing: '',
    irrigationReminder: '',
    certificationLevel: 'Conventional',
    marketDestination: '',
    seedCost: '',
    notes: ''
  }
  
  const [form, setForm] = useState(emptyCrop)
  const [editingId, setEditingId] = useState(null)
  const [errors, setErrors] = useState({})
  const lastRouteSyncRef = useRef({ tab: null, submodule: null })

  useEffect(() => {
    const allowedTabs = new Set(['list', 'addCrop', 'yields', 'sales', 'treatments', 'pests', 'diseases', 'reminders', 'alerts', 'profitability', 'cv'])
    if (allowedTabs.has(initialTab) && lastRouteSyncRef.current.tab !== initialTab) {
      setTab(initialTab)
      lastRouteSyncRef.current.tab = initialTab
    }
  }, [initialTab])

  useEffect(() => {
    const allowedSubmodules = new Set(['all', ...Object.keys(PLANT_SUBMODULE_META)])
    if (allowedSubmodules.has(initialPlantSubmodule) && lastRouteSyncRef.current.submodule !== initialPlantSubmodule) {
      setPlantSubmodule(initialPlantSubmodule)
      lastRouteSyncRef.current.submodule = initialPlantSubmodule
    }
  }, [initialPlantSubmodule])

  useEffect(() => {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      try {
        setCrops(JSON.parse(raw))
      } catch (e) {
        setCrops(SAMPLE)
      }
    } else {
      setCrops(SAMPLE)
    }
  }, [])

  useEffect(() => {
    if (crops.length > 0) {
      localStorage.setItem(KEY, JSON.stringify(crops))
    }
  }, [crops])

  useEffect(() => {
    try {
      const rawYields = localStorage.getItem(YIELD_KEY)
      const rawSales = localStorage.getItem(SALES_KEY)
      const rawTreatments = localStorage.getItem(TREATMENT_KEY)
      const rawCosts = localStorage.getItem(COST_KEY)
      setYieldRecords(rawYields ? JSON.parse(rawYields) : [])
      setSalesRecords(rawSales ? JSON.parse(rawSales) : [])
      setTreatmentRecords(rawTreatments ? JSON.parse(rawTreatments) : [])
      setCostRecords(rawCosts ? JSON.parse(rawCosts) : [])
    } catch {
      setYieldRecords([])
      setSalesRecords([])
      setTreatmentRecords([])
      setCostRecords([])
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(YIELD_KEY, JSON.stringify(yieldRecords))
  }, [yieldRecords])

  useEffect(() => {
    localStorage.setItem(SALES_KEY, JSON.stringify(salesRecords))
  }, [salesRecords])

  useEffect(() => {
    localStorage.setItem(TREATMENT_KEY, JSON.stringify(treatmentRecords))
  }, [treatmentRecords])

  useEffect(() => {
    localStorage.setItem(COST_KEY, JSON.stringify(costRecords))
  }, [costRecords])

  function validateCrop(c) {
    const e = {}
    if (!c.name || !c.name.trim()) e.name = 'Crop name is required'
    if (!c.area || Number(c.area) <= 0) e.area = 'Area must be greater than 0'
    if (c.planted) {
      const d = Date.parse(c.planted)
      if (Number.isNaN(d)) e.planted = 'Invalid planting date'
    }
    return e
  }

  function resetForm() {
    setForm(emptyCrop)
    setEditingId(null)
    setErrors({})
  }

  function saveCrop(e) {
    e && e.preventDefault()
    const candidate = { ...form }
    const eobj = validateCrop(candidate)
    setErrors(eobj)
    if (Object.keys(eobj).length) return

    if (editingId) {
      setCrops(crops.map(c => c.id === editingId ? { ...c, ...candidate } : c))
    } else {
      const id = 'C-' + Math.floor(1000 + Math.random() * 9000)
      setCrops([...crops, { ...candidate, id }])
    }
    resetForm()
    setTab('list')
  }

  function startEditCrop(c) {
    setForm(c)
    setEditingId(c.id)
    setTab('addCrop')
  }

  function deleteCrop(id) {
    if (!window.confirm('Delete crop ' + id + '?')) return
    setCrops(crops.filter(c => c.id !== id))
  }

  function deletePestRecord(id) {
    if (!window.confirm('Delete this pest record?')) return
    setPestRecords(pestRecords.filter(p => p.id !== id))
    setToast({ type: 'success', message: '✓ Pest record deleted' })
    setTimeout(() => setToast(null), 3000)
  }

  function deleteDiseaseRecord(id) {
    if (!window.confirm('Delete this disease record?')) return
    setDiseaseRecords(diseaseRecords.filter(d => d.id !== id))
    setToast({ type: 'success', message: '✓ Disease record deleted' })
    setTimeout(() => setToast(null), 3000)
  }

  // Inline edit functions
  function startInlineEdit(item, type = 'crop') {
    setInlineEditId(item.id)
    setInlineData({ ...item })
    setInlineType(type)
    setLastChange({ item, type })
  }

  function saveInlineEdit() {
    if (inlineType === 'crop') {
      if (!inlineData.name || !inlineData.name.trim()) {
        setToast({ type: 'error', message: 'Name is required' })
        return
      }
      setCrops(crops.map(c => c.id === inlineEditId ? inlineData : c))
    } else if (inlineType === 'pest') {
      if (!inlineData.pest || !inlineData.severity) {
        setToast({ type: 'error', message: 'Pest and severity are required' })
        return
      }
      setPestRecords(pestRecords.map(p => p.id === inlineEditId ? inlineData : p))
    } else if (inlineType === 'disease') {
      if (!inlineData.disease || !inlineData.severity) {
        setToast({ type: 'error', message: 'Disease and severity are required' })
        return
      }
      setDiseaseRecords(diseaseRecords.map(d => d.id === inlineEditId ? inlineData : d))
    }
    
    setToast({ type: 'success', message: '✓ Updated', showUndo: true })
    setInlineEditId(null)
    setInlineType(null)
    setTimeout(() => setToast(null), 3000)
  }

  function cancelInlineEdit() {
    setInlineEditId(null)
    setInlineData({})
    setInlineType(null)
    setToast(null)
  }

  function undoLastChange() {
    if (!lastChange) return
    if (lastChange.type === 'crop') {
      setCrops(crops.map(c => c.id === lastChange.item.id ? lastChange.item : c))
    } else if (lastChange.type === 'pest') {
      setPestRecords(pestRecords.map(p => p.id === lastChange.item.id ? lastChange.item : p))
    } else if (lastChange.type === 'disease') {
      setDiseaseRecords(diseaseRecords.map(d => d.id === lastChange.item.id ? lastChange.item : d))
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

  const q = filter.trim().toLowerCase()
  const plantMatches = (crop) => {
    if (plantSubmodule === 'all') return true
    const direct = String(crop.plantSubmodule || '').toLowerCase()
    if (direct === String(plantSubmodule).toLowerCase()) return true
    const name = String(crop.name || '').toLowerCase()
    const type = String(crop.cropType || '').toLowerCase()
    const aliases = (PLANT_SUBMODULE_META[plantSubmodule]?.aliases || [])
    if (aliases.some(alias => name.includes(alias))) return true
    if (plantSubmodule === 'vegetables' && (type === 'vegetable' || String(crop.vegetableType || '').trim())) return true
    if (plantSubmodule === 'fruits' && type === 'fruit') return true
    return false
  }

  const mapDomainToTab = (domain) => {
    const d = String(domain || '').toLowerCase()
    if (d.includes('protection') || d.includes('health')) return 'pests'
    if (d.includes('compliance') || d.includes('quality')) return 'diseases'
    if (d.includes('harvest') || d.includes('production') || d.includes('orchardrecords') || d.includes('factorylink')) return 'yields'
    if (d.includes('export') || d.includes('commercial') || d.includes('market')) return 'sales'
    if (d.includes('nutrition') || d.includes('input') || d.includes('agronomy') || d.includes('fieldops') || d.includes('establishment') || d.includes('planning')) return 'treatments'
    return 'list'
  }

  const inferPlantSubmodule = (crop) => {
    const direct = String(crop?.plantSubmodule || '').trim()
    if (direct && PLANT_SUBMODULE_META[direct]) return direct

    const cropName = String(crop?.name || '').toLowerCase()
    const cropType = String(crop?.cropType || '').toLowerCase()
    for (const [key, meta] of Object.entries(PLANT_SUBMODULE_META)) {
      if ((meta.aliases || []).some(alias => cropName.includes(alias))) return key
    }
    if (String(crop?.vegetableType || '').trim() || cropType === 'vegetable') return 'vegetables'
    if (cropType === 'fruit') return 'fruits'
    return ''
  }

  const createRecordId = (prefix) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`

  const resetYieldForm = () => setYieldForm({ cropId: '', plantSubmodule: '', date: '', quantity: '', unit: 'kg', grade: 'A', qualityNote: '', losses: '', notes: '' })
  const resetSalesForm = () => setSalesForm({ cropId: '', plantSubmodule: '', date: '', buyer: '', market: '', quantity: '', unit: 'kg', unitPrice: '', totalValue: '', channel: 'Local', notes: '' })
  const resetTreatmentForm = () => setTreatmentForm({ cropId: '', plantSubmodule: '', date: '', category: 'Fertilizer', inputName: '', dosage: '', method: 'Foliar', reason: '', cost: '', withholdingDays: '', notes: '' })
  const resetCostForm = () => setCostForm({ cropId: '', plantSubmodule: '', date: '', category: 'Labor', amount: '', vendor: '', reference: '', notes: '' })

  const setRecordSubmoduleFromCrop = (cropId, setter, currentForm) => {
    const crop = crops.find(c => c.id === cropId)
    const plantModule = inferPlantSubmodule(crop)
    setter({ ...currentForm, cropId, plantSubmodule: plantModule })
  }

  const saveYieldRecord = (e) => {
    e.preventDefault()
    if (!yieldForm.cropId || !yieldForm.date || !yieldForm.quantity) {
      setToast({ type: 'error', message: 'Crop, date, and quantity are required for yield records.' })
      return
    }
    const rec = { ...yieldForm, id: createRecordId('YLD') }
    setYieldRecords(prev => [rec, ...prev])
    resetYieldForm()
    setShowYieldForm(false)
    setToast({ type: 'success', message: '✓ Yield record added' })
    setTimeout(() => setToast(null), 2500)
  }

  const saveSalesRecord = (e) => {
    e.preventDefault()
    if (!salesForm.cropId || !salesForm.date || !salesForm.quantity || !salesForm.unitPrice) {
      setToast({ type: 'error', message: 'Crop, date, quantity, and unit price are required for sales records.' })
      return
    }
    const totalValue = salesForm.totalValue || (Number(salesForm.quantity) * Number(salesForm.unitPrice)).toFixed(2)
    const rec = { ...salesForm, totalValue, id: createRecordId('SAL') }
    setSalesRecords(prev => [rec, ...prev])
    resetSalesForm()
    setShowSalesForm(false)
    setToast({ type: 'success', message: '✓ Sales record added' })
    setTimeout(() => setToast(null), 2500)
  }

  const saveTreatmentRecord = (e) => {
    e.preventDefault()
    if (!treatmentForm.cropId || !treatmentForm.date || !treatmentForm.inputName) {
      setToast({ type: 'error', message: 'Crop, date, and input name are required for treatment records.' })
      return
    }
    const rec = { ...treatmentForm, id: createRecordId('TRT') }
    setTreatmentRecords(prev => [rec, ...prev])
    resetTreatmentForm()
    setShowTreatmentForm(false)
    setToast({ type: 'success', message: '✓ Treatment record added' })
    setTimeout(() => setToast(null), 2500)
  }

  const saveCostRecord = (e) => {
    e.preventDefault()
    if (!costForm.cropId || !costForm.date || !costForm.amount) {
      setToast({ type: 'error', message: 'Crop, date, and amount are required for cost records.' })
      return
    }
    const rec = { ...costForm, id: createRecordId('CST') }
    setCostRecords(prev => [rec, ...prev])
    resetCostForm()
    setShowCostForm(false)
    setToast({ type: 'success', message: '✓ Cost record added' })
    setTimeout(() => setToast(null), 2500)
  }

  const deleteYieldRecord = (id) => {
    if (!window.confirm('Delete this yield record?')) return
    setYieldRecords(prev => prev.filter(r => r.id !== id))
  }

  const deleteSalesRecord = (id) => {
    if (!window.confirm('Delete this sales record?')) return
    setSalesRecords(prev => prev.filter(r => r.id !== id))
  }

  const deleteTreatmentRecord = (id) => {
    if (!window.confirm('Delete this treatment record?')) return
    setTreatmentRecords(prev => prev.filter(r => r.id !== id))
  }

  const deleteCostRecord = (id) => {
    if (!window.confirm('Delete this cost record?')) return
    setCostRecords(prev => prev.filter(r => r.id !== id))
  }

  const openPlantRecord = (moduleKey, domain) => {
    setPlantSubmodule(moduleKey)
    setTab(mapDomainToTab(domain))
  }

  const openAlertContext = (alert) => {
    if (alert?.plantSubmodule) {
      setPlantSubmodule(alert.plantSubmodule)
    }
    setTab(alert?.relatedTab || 'list')
  }

  const activePlantCatalog = plantSubmodule === 'all' ? {} : (PLANT_RECORD_CATALOG[plantSubmodule] || {})
  const activePlantDomainCount = Object.keys(activePlantCatalog).length
  const activePlantRecordCount = Object.values(activePlantCatalog).reduce((acc, list) => acc + list.length, 0)

  const recordMatchesPlantModule = (record) => {
    if (plantSubmodule === 'all') return true
    return String(record?.plantSubmodule || '') === String(plantSubmodule)
  }

  const visibleYieldRecords = yieldRecords.filter(recordMatchesPlantModule)
  const visibleSalesRecords = salesRecords.filter(recordMatchesPlantModule)
  const visibleTreatmentRecords = treatmentRecords.filter(recordMatchesPlantModule)
  const visibleCostRecords = costRecords.filter(recordMatchesPlantModule)

  const filtered = crops.filter(crop => {
    if (!plantMatches(crop)) return false
    if (q) {
      const matchesText = (crop.name || '').toLowerCase().includes(q) ||
                         (crop.variety || '').toLowerCase().includes(q) ||
                         (crop.field || '').toLowerCase().includes(q) ||
                         (crop.id || '').toLowerCase().includes(q)
      if (!matchesText) return false
    }
    if (filterStatus !== 'all' && crop.status !== filterStatus) return false
    return true
  }).sort((a, b) => {
    if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '')
    if (sortBy === 'area') return (b.area || 0) - (a.area || 0)
    if (sortBy === 'planted') return new Date(b.planted || '1900-01-01') - new Date(a.planted || '1900-01-01')
    return 0
  })

  const profitabilityByCrop = filtered.map(crop => {
    const salesTotal = salesRecords
      .filter(r => r.cropId === crop.id)
      .reduce((sum, r) => sum + (Number(r.totalValue) || (Number(r.quantity) * Number(r.unitPrice)) || 0), 0)

    const treatmentCost = treatmentRecords
      .filter(r => r.cropId === crop.id)
      .reduce((sum, r) => sum + (Number(r.cost) || 0), 0)

    const ledgerCost = costRecords
      .filter(r => r.cropId === crop.id)
      .reduce((sum, r) => sum + (Number(r.amount) || 0), 0)

    const seedCost = Number(crop.seedCost) || 0
    const totalCost = seedCost + treatmentCost + ledgerCost
    const margin = salesTotal - totalCost
    const marginPct = salesTotal > 0 ? (margin / salesTotal) * 100 : 0

    return {
      crop,
      salesTotal,
      totalCost,
      margin,
      marginPct,
      treatmentCost,
      ledgerCost,
      seedCost
    }
  })

  const profitabilitySummary = profitabilityByCrop.reduce((acc, row) => {
    acc.revenue += row.salesTotal
    acc.cost += row.totalCost
    acc.margin += row.margin
    return acc
  }, { revenue: 0, cost: 0, margin: 0 })

  const nowTimestamp = Date.now()
  const cropAlerts = filtered.flatMap(crop => {
    const alerts = []
    const profitabilityRow = profitabilityByCrop.find(row => row.crop.id === crop.id)
    const cropModule = inferPlantSubmodule(crop)
    const treatmentRows = treatmentRecords.filter(r => r.cropId === crop.id)
    const cropSales = salesRecords.filter(r => r.cropId === crop.id)
    const cropYieldRows = yieldRecords.filter(r => r.cropId === crop.id)

    if (profitabilityRow) {
      if (profitabilityRow.salesTotal > 0 && profitabilityRow.margin < 0) {
        alerts.push({
          id: `margin-${crop.id}`,
          cropId: crop.id,
          cropName: crop.name,
          plantSubmodule: cropModule,
          severity: 'critical',
          category: 'margin',
          title: 'Negative crop margin detected',
          message: `${crop.name} is running at ${profitabilityRow.marginPct.toFixed(1)}% margin with ${formatCurrency(profitabilityRow.salesTotal)} in revenue against ${formatCurrency(profitabilityRow.totalCost)} in costs.`,
          relatedTab: 'profitability',
          actionLabel: 'Open Profitability'
        })
      } else if (profitabilityRow.salesTotal > 0 && profitabilityRow.marginPct < 15) {
        alerts.push({
          id: `low-margin-${crop.id}`,
          cropId: crop.id,
          cropName: crop.name,
          plantSubmodule: cropModule,
          severity: 'warning',
          category: 'margin',
          title: 'Low crop margin trending down',
          message: `${crop.name} margin is ${profitabilityRow.marginPct.toFixed(1)}%. Review costs before the next harvest or sale cycle compresses returns further.`,
          relatedTab: 'profitability',
          actionLabel: 'Review Margin'
        })
      }
    }

    const actualHarvestAt = parseDateValue(crop.actualHarvest)
    const expectedHarvestAt = parseDateValue(crop.expectedHarvest)
    const latestYieldAt = cropYieldRows.reduce((latest, row) => {
      const recordAt = parseDateValue(row.date)
      return recordAt && recordAt > latest ? recordAt : latest
    }, 0)
    const harvestAnchor = actualHarvestAt || (String(crop.status) === 'Harvested' ? expectedHarvestAt : null)
    const anchorDate = harvestAnchor || latestYieldAt || null

    if (anchorDate) {
      const salesAfterAnchor = cropSales.filter(row => {
        const saleAt = parseDateValue(row.date)
        return saleAt && saleAt >= anchorDate
      })
      const ageDays = Math.floor((nowTimestamp - anchorDate) / DAY_MS)
      if (ageDays >= 14 && salesAfterAnchor.length === 0) {
        const fromHarvest = Boolean(harvestAnchor)
        alerts.push({
          id: `sales-gap-${crop.id}`,
          cropId: crop.id,
          cropName: crop.name,
          plantSubmodule: cropModule,
          severity: ageDays >= 30 ? 'critical' : 'warning',
          category: 'sales-gap',
          title: fromHarvest ? 'Harvest recorded without follow-up sale' : 'Yield recorded without follow-up sale',
          message: `${crop.name} has no sales logged ${ageDays} days after the latest ${fromHarvest ? 'harvest' : 'yield'} milestone. Confirm buyer delivery, pricing, or unlogged sales.`,
          relatedTab: 'sales',
          actionLabel: 'Open Sales Ledger'
        })
      }
    }

    const recentWindowStart = nowTimestamp - (30 * DAY_MS)
    const previousWindowStart = nowTimestamp - (60 * DAY_MS)
    const recentTreatmentCost = treatmentRows.reduce((sum, row) => {
      const recordAt = parseDateValue(row.date)
      if (!recordAt || recordAt < recentWindowStart) return sum
      return sum + (Number(row.cost) || 0)
    }, 0)
    const previousTreatmentCost = treatmentRows.reduce((sum, row) => {
      const recordAt = parseDateValue(row.date)
      if (!recordAt || recordAt < previousWindowStart || recordAt >= recentWindowStart) return sum
      return sum + (Number(row.cost) || 0)
    }, 0)

    const treatmentCostSpike = previousTreatmentCost > 0
      ? recentTreatmentCost >= previousTreatmentCost * 1.5 && recentTreatmentCost - previousTreatmentCost >= 500
      : recentTreatmentCost >= 1500

    if (treatmentCostSpike) {
      alerts.push({
        id: `treatment-spike-${crop.id}`,
        cropId: crop.id,
        cropName: crop.name,
        plantSubmodule: cropModule,
        severity: recentTreatmentCost >= Math.max(previousTreatmentCost * 2, 2500) ? 'critical' : 'warning',
        category: 'treatment-cost',
        title: 'Treatment cost spike detected',
        message: previousTreatmentCost > 0
          ? `${crop.name} treatment spend rose from ${formatCurrency(previousTreatmentCost)} to ${formatCurrency(recentTreatmentCost)} over the last 30 days.`
          : `${crop.name} has ${formatCurrency(recentTreatmentCost)} in treatment spend over the last 30 days with no comparable prior baseline.`,
        relatedTab: 'treatments',
        actionLabel: 'Review Treatments'
      })
    }

    return alerts
  }).sort((left, right) => {
    const severityDelta = ALERT_SEVERITY_RANK[left.severity] - ALERT_SEVERITY_RANK[right.severity]
    if (severityDelta !== 0) return severityDelta
    return String(left.cropName || '').localeCompare(String(right.cropName || ''))
  })

  const alertSummary = cropAlerts.reduce((acc, alert) => {
    acc.total += 1
    acc[alert.severity] += 1
    return acc
  }, { total: 0, critical: 0, warning: 0, info: 0 })

  const stats = {
    total: crops.length,
    totalArea: crops.reduce((sum, c) => sum + (Number(c.area) || 0), 0),
    active: crops.filter(c => !['Harvested', 'Failed'].includes(c.status)).length,
    harvested: crops.filter(c => c.status === 'Harvested').length
  }

  // Notification effect: schedule reminders
  useNotificationEffect(() => {
    reminders.forEach(rem => {
      const now = new Date()
      const remDate = new Date(rem.date)
      if (remDate > now) {
        // Schedule notification (placeholder, integrate with actual notification system)
        setTimeout(() => {
          window.alert(`Reminder: ${rem.message} for crop ${rem.cropId} on ${rem.date}`)
        }, remDate - now)
      }
    })
  }, [reminders])

  function savePestRecord(e) {
    e.preventDefault()
    setPestRecords([...pestRecords, { ...pestForm, id: Date.now() }])
    setShowPestForm(false)
    setPestForm({ cropId: '', date: '', pest: '', severity: '', action: '', notes: '' })
  }
  function saveDiseaseRecord(e) {
    e.preventDefault()
    setDiseaseRecords([...diseaseRecords, { ...diseaseForm, id: Date.now() }])
    setShowDiseaseForm(false)
    setDiseaseForm({ cropId: '', date: '', disease: '', severity: '', action: '', notes: '' })
  }
  function saveReminder(e) {
    e.preventDefault()
    setReminders([...reminders, { ...reminderForm, id: Date.now() }])
    setReminderForm({ cropId: '', date: '', message: '' })
  }

  return (
    <section>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ margin: 0 }}>Crop Management</h2>
          {tab === 'list' && (
            <button
              onClick={() => {
                if (plantSubmodule !== 'all') {
                  setForm(prev => ({ ...prev, plantSubmodule }))
                }
                setTab('addCrop')
              }}
              style={{ background: 'var(--green)', color: '#fff', padding: '10px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
            >
              Add New Crop
            </button>
          )}
        </div>

        {recordSource?.domain && recordSource?.item && (
          <div style={{ marginBottom: '12px', fontSize: '12px', fontWeight: 700, color: '#065f46', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '999px', display: 'inline-flex', padding: '4px 10px' }}>
            Opened from Record Coverage: {recordSource.domain} / {recordSource.item}
          </div>
        )}

        <div style={{ marginBottom: '20px', padding: '14px', borderRadius: '10px', border: '1px solid #d1fae5', background: '#f8fffb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#065f46' }}>Plant Submodules</div>
            <div style={{ fontSize: 12, color: '#0f766e', fontWeight: 700 }}>
              {Object.keys(PLANT_SUBMODULE_META).length} modules
              {plantSubmodule !== 'all' ? ` • ${activePlantDomainCount} domains • ${activePlantRecordCount} records` : ''}
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: plantSubmodule === 'all' ? 0 : 10 }}>
            <button
              onClick={() => setPlantSubmodule('all')}
              style={{ padding: '6px 10px', borderRadius: 999, border: `1px solid ${plantSubmodule === 'all' ? '#059669' : '#d1fae5'}`, background: plantSubmodule === 'all' ? '#ecfdf5' : '#ffffff', color: '#065f46', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
            >
              🌱 All Plants
            </button>
            {Object.entries(PLANT_SUBMODULE_META).map(([key, meta]) => (
              <button
                key={key}
                onClick={() => setPlantSubmodule(key)}
                style={{ padding: '6px 10px', borderRadius: 999, border: `1px solid ${plantSubmodule === key ? '#059669' : '#d1fae5'}`, background: plantSubmodule === key ? '#ecfdf5' : '#ffffff', color: '#065f46', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
              >
                {meta.icon} {meta.label}
              </button>
            ))}
          </div>

          {plantSubmodule !== 'all' && (
            <div style={{ display: 'grid', gap: 8 }}>
              {Object.entries(activePlantCatalog).map(([domain, items]) => (
                <div key={domain} style={{ border: '1px solid #e2f6ea', borderRadius: 10, padding: '8px 10px', background: '#ffffff' }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#047857', marginBottom: 6 }}>{domain}</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {items.map(item => (
                      <button
                        key={item}
                        onClick={() => openPlantRecord(plantSubmodule, domain)}
                        title={`Open ${PLANT_SUBMODULE_META[plantSubmodule]?.label} → ${item}`}
                        style={{ padding: '4px 9px', borderRadius: 999, background: '#ffffff', border: '1px solid #d1fae5', color: '#065f46', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '20px' }}>
          <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--green)' }}>{stats.total}</div>
            <div style={{ fontSize: '14px', color: 'var(--muted)' }}>Total Crops</div>
          </div>
          <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#f59e0b' }}>{stats.totalArea.toFixed(1)}</div>
            <div style={{ fontSize: '14px', color: 'var(--muted)' }}>Total Acres</div>
          </div>
          <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#059669' }}>{stats.active}</div>
            <div style={{ fontSize: '14px', color: 'var(--muted)' }}>Active Crops</div>
          </div>
          <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#6b7280' }}>{stats.harvested}</div>
            <div style={{ fontSize: '14px', color: 'var(--muted)' }}>Harvested</div>
          </div>
        </div>

        <div style={{ marginBottom: '20px', padding: '14px 16px', borderRadius: '10px', border: `1px solid ${alertSummary.critical > 0 ? '#fecaca' : alertSummary.warning > 0 ? '#fdba74' : '#a7f3d0'}`, background: alertSummary.total > 0 ? (alertSummary.critical > 0 ? '#fef2f2' : '#fff7ed') : '#f0fdf4', display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: alertSummary.critical > 0 ? '#991b1b' : alertSummary.warning > 0 ? '#9a3412' : '#166534' }}>Smart Crop Alerts</div>
            <div style={{ fontSize: 13, color: '#475569', marginTop: 4 }}>
              {alertSummary.total > 0
                ? `${alertSummary.total} active alerts: ${alertSummary.critical} critical and ${alertSummary.warning} warning signals from margin, sales follow-up, and treatment trends.`
                : 'No active smart alerts for the current crop portfolio.'}
            </div>
          </div>
          <button onClick={() => setTab('alerts')} style={{ padding: '8px 12px', borderRadius: 6, border: 'none', background: alertSummary.critical > 0 ? '#b91c1c' : '#047857', color: '#fff', cursor: 'pointer', fontWeight: 700 }}>
            {alertSummary.total > 0 ? 'Review Alerts' : 'Open Alerts'}
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{ borderBottom: '2px solid #e5e7eb', marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            <button onClick={() => setTab('list')} style={{ padding: '12px 20px', border: 'none', borderBottom: tab === 'list' ? '3px solid var(--green)' : '3px solid transparent', background: tab === 'list' ? '#f0fdf4' : 'transparent', color: tab === 'list' ? 'var(--green)' : '#6b7280', fontWeight: tab === 'list' ? '600' : '400', cursor: 'pointer' }}>📋 Crop List</button>
            <button onClick={() => setTab('yields')} style={{ padding: '12px 20px', border: 'none', borderBottom: tab === 'yields' ? '3px solid var(--green)' : '3px solid transparent', background: tab === 'yields' ? '#f0fdf4' : 'transparent', color: tab === 'yields' ? 'var(--green)' : '#6b7280', fontWeight: tab === 'yields' ? '600' : '400', cursor: 'pointer' }}>🌾 Yields & Harvest</button>
            <button onClick={() => setTab('sales')} style={{ padding: '12px 20px', border: 'none', borderBottom: tab === 'sales' ? '3px solid var(--green)' : '3px solid transparent', background: tab === 'sales' ? '#f0fdf4' : 'transparent', color: tab === 'sales' ? 'var(--green)' : '#6b7280', fontWeight: tab === 'sales' ? '600' : '400', cursor: 'pointer' }}>💰 Sales & Revenue</button>
            <button onClick={() => setTab('treatments')} style={{ padding: '12px 20px', border: 'none', borderBottom: tab === 'treatments' ? '3px solid var(--green)' : '3px solid transparent', background: tab === 'treatments' ? '#f0fdf4' : 'transparent', color: tab === 'treatments' ? 'var(--green)' : '#6b7280', fontWeight: tab === 'treatments' ? '600' : '400', cursor: 'pointer' }}>🧪 Treatments & Inputs</button>
            <button onClick={() => setTab('pests')} style={{ padding: '12px 20px', border: 'none', borderBottom: tab === 'pests' ? '3px solid #f59e0b' : '3px solid transparent', background: tab === 'pests' ? '#fff7ed' : 'transparent', color: tab === 'pests' ? '#f59e0b' : '#6b7280', fontWeight: tab === 'pests' ? '600' : '400', cursor: 'pointer' }}>🐛 Pest Management</button>
            <button onClick={() => setTab('diseases')} style={{ padding: '12px 20px', border: 'none', borderBottom: tab === 'diseases' ? '3px solid #dc2626' : '3px solid transparent', background: tab === 'diseases' ? '#fef2f2' : 'transparent', color: tab === 'diseases' ? '#dc2626' : '#6b7280', fontWeight: tab === 'diseases' ? '600' : '400', cursor: 'pointer' }}>🦠 Disease Management</button>
            <button onClick={() => setTab('reminders')} style={{ padding: '12px 20px', border: 'none', borderBottom: tab === 'reminders' ? '3px solid #059669' : '3px solid transparent', background: tab === 'reminders' ? '#f0fdf4' : 'transparent', color: tab === 'reminders' ? '#059669' : '#6b7280', fontWeight: tab === 'reminders' ? '600' : '400', cursor: 'pointer' }}>🔔 Reminders</button>
            <button onClick={() => setTab('alerts')} style={{ padding: '12px 20px', border: 'none', borderBottom: tab === 'alerts' ? '3px solid #dc2626' : '3px solid transparent', background: tab === 'alerts' ? '#fef2f2' : 'transparent', color: tab === 'alerts' ? '#dc2626' : '#6b7280', fontWeight: tab === 'alerts' ? '600' : '400', cursor: 'pointer' }}>🚨 Smart Alerts ({alertSummary.total})</button>
            <button onClick={() => setTab('profitability')} style={{ padding: '12px 20px', border: 'none', borderBottom: tab === 'profitability' ? '3px solid #1d4ed8' : '3px solid transparent', background: tab === 'profitability' ? '#eff6ff' : 'transparent', color: tab === 'profitability' ? '#1d4ed8' : '#6b7280', fontWeight: tab === 'profitability' ? '600' : '400', cursor: 'pointer' }}>📈 Profitability</button>
            <button onClick={() => setTab('cv')} style={{ padding: '12px 20px', border: 'none', borderBottom: tab === 'cv' ? '3px solid #0f766e' : '3px solid transparent', background: tab === 'cv' ? '#ecfeff' : 'transparent', color: tab === 'cv' ? '#0f766e' : '#6b7280', fontWeight: tab === 'cv' ? '600' : '400', cursor: 'pointer' }}>📄 Crop CV Report</button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      {tab === 'list' && (
        <div>
          {/* Filters */}
          <div className="card" style={{ marginBottom: '20px', padding: '16px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="🔍 Search crops..."
                value={filter}
                onChange={e => setFilter(e.target.value)}
                style={{ flex: '1 1 200px', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db' }}
              />
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db' }}
              >
                <option value="all">All Status</option>
                {CROP_STATUS.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db' }}
              >
                <option value="planted">Sort by Planted Date</option>
                <option value="name">Sort by Name</option>
                <option value="area">Sort by Area</option>
              </select>
              <select
                value={plantSubmodule}
                onChange={e => setPlantSubmodule(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db' }}
              >
                <option value="all">All Plant Submodules</option>
                {Object.entries(PLANT_SUBMODULE_META).map(([key, meta]) => (
                  <option key={key} value={key}>{meta.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Crop List */}
          <div style={{ display: 'grid', gap: '12px' }}>
            {filtered.length === 0 && (
              <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                No crops found. Add your first crop to get started!
              </div>
            )}
            {filtered.map(crop => (
              <div key={crop.id} className="card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      <h3 style={{ margin: 0 }}>{crop.name}</h3>
                      <span
                        className="badge"
                        style={{
                          background: crop.status === 'Harvested' ? '#dcfce7' : crop.status === 'Failed' ? '#fee2e2' : '#dbeafe',
                          color: crop.status === 'Harvested' ? '#15803d' : crop.status === 'Failed' ? '#dc2626' : '#1e40af',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}
                      >
                        {crop.status}
                      </span>
                      <span className="badge" style={{ background: '#f3f4f6', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>
                        {crop.irrigationType}
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '12px' }}>
                      <div>
                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '2px' }}>Variety</div>
                        <div style={{ fontWeight: '500' }}>{crop.variety || 'Not specified'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '2px' }}>Field</div>
                        <div style={{ fontWeight: '500' }}>{crop.field || 'Not specified'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '2px' }}>Area</div>
                        <div style={{ fontWeight: '500' }}>{crop.area} acres</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '2px' }}>Soil Type</div>
                        <div style={{ fontWeight: '500' }}>{crop.soilType}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '20px', fontSize: '14px', color: '#666' }}>
                      <span>📅 Planted: {crop.planted || 'Not set'}</span>
                      <span>🌾 Expected: {crop.expectedHarvest || 'Not set'}</span>
                      {crop.actualHarvest && <span>✅ Harvested: {crop.actualHarvest}</span>}
                    </div>
                  </div>
                  <div className="controls" style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => startInlineEdit(crop, 'crop')} style={{ background: '#ffffcc', border: '1px solid #ffdd00', padding: '8px 12px', borderRadius: '6px' }}>⚡ Quick</button>
                    <button onClick={() => startEditCrop(crop)}>Edit</button>
                    <button onClick={() => deleteCrop(crop.id)}>Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'addCrop' && (
        <div className="card" style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3>{editingId ? 'Edit Crop' : 'Add New Crop'}</h3>
            <button onClick={() => { resetForm(); setTab('list') }} style={{ background: '#6b7280', color: '#fff', padding: '8px 16px', borderRadius: '6px', border: 'none' }}>
              Cancel
            </button>
          </div>

          <form onSubmit={saveCrop}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Plant Submodule</label>
                <select
                  value={form.plantSubmodule}
                  onChange={e => setForm({ ...form, plantSubmodule: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                >
                  <option value="">-- select plant module --</option>
                  {Object.entries(PLANT_SUBMODULE_META).map(([key, meta]) => (
                    <option key={key} value={key}>{meta.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Crop Name *</label>
                <input
                  type="text"
                  id="crop-name"
                  name="cropName"
                  placeholder="e.g., Premium Alfalfa"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: errors.name ? '2px solid #dc2626' : '1px solid #d1d5db' }}
                />
                {errors.name && <div style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px' }}>{errors.name}</div>}
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Variety/Cultivar</label>
                <input
                  type="text"
                  id="crop-variety"
                  name="variety"
                  placeholder="e.g., Pioneer 1234"
                  value={form.variety}
                  onChange={e => setForm({ ...form, variety: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Field Location</label>
                <input
                  type="text"
                  id="crop-field-location"
                  name="field"
                  placeholder="e.g., North Field A"
                  value={form.field}
                  onChange={e => setForm({ ...form, field: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Area (acres) *</label>
                <input
                  type="number"
                  step="0.1"
                  id="crop-area"
                  name="area"
                  placeholder="0.0"
                  value={form.area}
                  onChange={e => setForm({ ...form, area: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: errors.area ? '2px solid #dc2626' : '1px solid #d1d5db' }}
                />
                {errors.area && <div style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px' }}>{errors.area}</div>}
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Crop Type</label>
                <select
                  value={form.cropType}
                  onChange={e => setForm({ ...form, cropType: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                >
                  {CROP_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              {form.cropType === 'Vegetable' && (
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Vegetable Type</label>
                  <select
                    value={form.vegetableType}
                    onChange={e => setForm({ ...form, vegetableType: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                  >
                    <option value="">-- select vegetable --</option>
                    {VEGETABLE_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              )}
              {form.cropType === 'Vegetable' && (
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Row Spacing (cm)</label>
                    <input type="number" value={form.rowSpacing} onChange={e => setForm({ ...form, rowSpacing: e.target.value })} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Plant Spacing (cm)</label>
                    <input type="number" value={form.plantSpacing} onChange={e => setForm({ ...form, plantSpacing: e.target.value })} />
                  </div>
                </div>
              )}

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Status</label>
                <select
                  value={form.status}
                  onChange={e => setForm({ ...form, status: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                >
                  {CROP_STATUS.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Planting Date</label>
                <input
                  type="date"
                  value={form.planted}
                  onChange={e => setForm({ ...form, planted: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Expected Harvest</label>
                <input
                  type="date"
                  value={form.expectedHarvest}
                  onChange={e => setForm({ ...form, expectedHarvest: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Soil Type</label>
                <select
                  value={form.soilType}
                  onChange={e => setForm({ ...form, soilType: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                >
                  {SOIL_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Irrigation Type</label>
                <select
                  value={form.irrigationType}
                  onChange={e => setForm({ ...form, irrigationType: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                >
                  {IRRIGATION_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Irrigation Reminder</label>
                <input
                  type="date"
                  id="crop-irrigation-reminder"
                  name="irrigationReminder"
                  value={form.irrigationReminder}
                  onChange={e => setForm({ ...form, irrigationReminder: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                />
                <small>Set a reminder for next irrigation</small>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Certification Level</label>
                <select
                  value={form.certificationLevel}
                  onChange={e => setForm({ ...form, certificationLevel: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                >
                  {CERTIFICATION_LEVELS.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Seed Cost (KES)</label>
                <input
                  type="number"
                  step="0.01"
                  id="crop-seed-cost"
                  name="seedCost"
                  placeholder="0.00"
                  value={form.seedCost}
                  onChange={e => setForm({ ...form, seedCost: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Market Destination</label>
                <input
                  type="text"
                  id="crop-market-destination"
                  name="marketDestination"
                  placeholder="e.g., Local Dairy Farms, Grain Elevator"
                  value={form.marketDestination}
                  onChange={e => setForm({ ...form, marketDestination: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Notes</label>
                <textarea
                  placeholder="Additional crop details..."
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                />
              </div>
            </div>

            <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
              <button
                type="submit"
                style={{ background: 'var(--green)', color: '#fff', padding: '12px 24px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
              >
                {editingId ? 'Update Crop' : 'Add Crop'}
              </button>
              <button
                type="button"
                onClick={() => { resetForm(); setTab('list') }}
                style={{ background: '#6b7280', color: '#fff', padding: '12px 24px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {tab === 'yields' && (
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ marginTop: 0 }}>Yields & Harvest Records</h3>
          <p style={{ color: '#64748b', marginTop: 0 }}>
            Track maturity, projected harvest, and completed harvest records for each plant submodule.
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            <button onClick={() => setShowYieldForm(v => !v)} style={{ padding: '8px 12px', borderRadius: 6, border: 'none', background: '#059669', color: '#fff', cursor: 'pointer' }}>
              {showYieldForm ? 'Cancel' : '+ Add Yield Record'}
            </button>
            <button onClick={() => exportToJSON(visibleYieldRecords, `crop_yields_${new Date().toISOString().slice(0, 10)}.json`)} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer' }}>
              Export JSON
            </button>
            <button onClick={() => exportToCSV(visibleYieldRecords, `crop_yields_${new Date().toISOString().slice(0, 10)}.csv`)} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer' }}>
              Export CSV
            </button>
          </div>

          {showYieldForm && (
            <form onSubmit={saveYieldRecord} style={{ marginBottom: 14, border: '1px solid #d1fae5', borderRadius: 8, padding: 12, background: '#f8fffb' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10 }}>
                <select value={yieldForm.cropId} onChange={e => setRecordSubmoduleFromCrop(e.target.value, setYieldForm, yieldForm)} required>
                  <option value="">Select Crop</option>
                  {crops.map(c => <option key={c.id} value={c.id}>{c.name} ({c.id})</option>)}
                </select>
                <input type="date" value={yieldForm.date} onChange={e => setYieldForm({ ...yieldForm, date: e.target.value })} required />
                <input type="number" step="0.01" placeholder="Quantity" value={yieldForm.quantity} onChange={e => setYieldForm({ ...yieldForm, quantity: e.target.value })} required />
                <select value={yieldForm.unit} onChange={e => setYieldForm({ ...yieldForm, unit: e.target.value })}>
                  <option value="kg">kg</option>
                  <option value="tons">tons</option>
                  <option value="crates">crates</option>
                  <option value="bunches">bunches</option>
                </select>
                <select value={yieldForm.grade} onChange={e => setYieldForm({ ...yieldForm, grade: e.target.value })}>
                  <option value="A">Grade A</option>
                  <option value="B">Grade B</option>
                  <option value="C">Grade C</option>
                  <option value="Mixed">Mixed</option>
                </select>
                <input type="number" step="0.01" placeholder="Losses" value={yieldForm.losses} onChange={e => setYieldForm({ ...yieldForm, losses: e.target.value })} />
                <input placeholder="Quality note" value={yieldForm.qualityNote} onChange={e => setYieldForm({ ...yieldForm, qualityNote: e.target.value })} />
                <input placeholder="Notes" value={yieldForm.notes} onChange={e => setYieldForm({ ...yieldForm, notes: e.target.value })} />
              </div>
              <button type="submit" style={{ marginTop: 10, padding: '8px 12px', borderRadius: 6, border: 'none', background: '#047857', color: '#fff', cursor: 'pointer' }}>Save Yield Record</button>
            </form>
          )}

          <div style={{ display: 'grid', gap: 12 }}>
            {visibleYieldRecords.map(rec => {
              const crop = crops.find(c => c.id === rec.cropId)
              return (
                <div key={rec.id} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, background: '#ffffff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                    <div style={{ fontWeight: 700 }}>{crop?.name || rec.cropId} • {rec.quantity} {rec.unit}</div>
                    <button onClick={() => deleteYieldRecord(rec.id)} style={{ border: '1px solid #fecaca', background: '#fee2e2', color: '#991b1b', borderRadius: 6, padding: '4px 9px', cursor: 'pointer' }}>Delete</button>
                  </div>
                  <div style={{ marginTop: 8, fontSize: 13, color: '#475569', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8 }}>
                    <div>Date: {rec.date}</div>
                    <div>Grade: {rec.grade}</div>
                    <div>Losses: {rec.losses || '0'}</div>
                    <div>Plant Module: {PLANT_SUBMODULE_META[rec.plantSubmodule]?.label || 'Unassigned'}</div>
                  </div>
                  {(rec.qualityNote || rec.notes) && (
                    <div style={{ marginTop: 8, fontSize: 13, color: '#334155' }}>
                      {rec.qualityNote ? <div><strong>Quality:</strong> {rec.qualityNote}</div> : null}
                      {rec.notes ? <div><strong>Notes:</strong> {rec.notes}</div> : null}
                    </div>
                  )}
                </div>
              )
            })}
            {visibleYieldRecords.length === 0 && <div style={{ color: '#6b7280' }}>No yield records yet for this submodule filter.</div>}
          </div>
        </div>
      )}

      {tab === 'sales' && (
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ marginTop: 0 }}>Sales & Revenue Records</h3>
          <p style={{ color: '#64748b', marginTop: 0 }}>
            Capture market destination, certification, and commercial movement for local and export crop value chains.
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            <button onClick={() => setShowSalesForm(v => !v)} style={{ padding: '8px 12px', borderRadius: 6, border: 'none', background: '#2563eb', color: '#fff', cursor: 'pointer' }}>
              {showSalesForm ? 'Cancel' : '+ Add Sales Record'}
            </button>
            <button onClick={() => exportToJSON(visibleSalesRecords, `crop_sales_${new Date().toISOString().slice(0, 10)}.json`)} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer' }}>
              Export JSON
            </button>
            <button onClick={() => exportToCSV(visibleSalesRecords, `crop_sales_${new Date().toISOString().slice(0, 10)}.csv`)} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer' }}>
              Export CSV
            </button>
          </div>

          {showSalesForm && (
            <form onSubmit={saveSalesRecord} style={{ marginBottom: 14, border: '1px solid #dbeafe', borderRadius: 8, padding: 12, background: '#f8fbff' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10 }}>
                <select value={salesForm.cropId} onChange={e => setRecordSubmoduleFromCrop(e.target.value, setSalesForm, salesForm)} required>
                  <option value="">Select Crop</option>
                  {crops.map(c => <option key={c.id} value={c.id}>{c.name} ({c.id})</option>)}
                </select>
                <input type="date" value={salesForm.date} onChange={e => setSalesForm({ ...salesForm, date: e.target.value })} required />
                <input placeholder="Buyer" value={salesForm.buyer} onChange={e => setSalesForm({ ...salesForm, buyer: e.target.value })} />
                <input placeholder="Market / Destination" value={salesForm.market} onChange={e => setSalesForm({ ...salesForm, market: e.target.value })} />
                <input type="number" step="0.01" placeholder="Quantity" value={salesForm.quantity} onChange={e => setSalesForm({ ...salesForm, quantity: e.target.value })} required />
                <select value={salesForm.unit} onChange={e => setSalesForm({ ...salesForm, unit: e.target.value })}>
                  <option value="kg">kg</option>
                  <option value="tons">tons</option>
                  <option value="crates">crates</option>
                  <option value="bunches">bunches</option>
                </select>
                <input type="number" step="0.01" placeholder="Unit Price" value={salesForm.unitPrice} onChange={e => setSalesForm({ ...salesForm, unitPrice: e.target.value })} required />
                <input type="number" step="0.01" placeholder="Total Value (auto if blank)" value={salesForm.totalValue} onChange={e => setSalesForm({ ...salesForm, totalValue: e.target.value })} />
                <select value={salesForm.channel} onChange={e => setSalesForm({ ...salesForm, channel: e.target.value })}>
                  <option value="Local">Local</option>
                  <option value="Export">Export</option>
                  <option value="Wholesale">Wholesale</option>
                  <option value="Retail">Retail</option>
                </select>
                <input placeholder="Notes" value={salesForm.notes} onChange={e => setSalesForm({ ...salesForm, notes: e.target.value })} />
              </div>
              <button type="submit" style={{ marginTop: 10, padding: '8px 12px', borderRadius: 6, border: 'none', background: '#1d4ed8', color: '#fff', cursor: 'pointer' }}>Save Sales Record</button>
            </form>
          )}

          <div style={{ display: 'grid', gap: 12 }}>
            {visibleSalesRecords.map(rec => {
              const crop = crops.find(c => c.id === rec.cropId)
              return (
                <div key={rec.id} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, background: '#ffffff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                    <div style={{ fontWeight: 700 }}>{crop?.name || rec.cropId} • KES {rec.totalValue}</div>
                    <button onClick={() => deleteSalesRecord(rec.id)} style={{ border: '1px solid #fecaca', background: '#fee2e2', color: '#991b1b', borderRadius: 6, padding: '4px 9px', cursor: 'pointer' }}>Delete</button>
                  </div>
                  <div style={{ marginTop: 8, fontSize: 13, color: '#475569', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8 }}>
                    <div>Date: {rec.date}</div>
                    <div>Quantity: {rec.quantity} {rec.unit}</div>
                    <div>Unit Price: KES {rec.unitPrice}</div>
                    <div>Channel: {rec.channel}</div>
                    <div>Buyer: {rec.buyer || 'N/A'}</div>
                    <div>Market: {rec.market || 'N/A'}</div>
                    <div>Plant Module: {PLANT_SUBMODULE_META[rec.plantSubmodule]?.label || 'Unassigned'}</div>
                  </div>
                  {rec.notes && <div style={{ marginTop: 8, fontSize: 13, color: '#334155' }}><strong>Notes:</strong> {rec.notes}</div>}
                </div>
              )
            })}
            {visibleSalesRecords.length === 0 && <div style={{ color: '#6b7280' }}>No sales records yet for this submodule filter.</div>}
          </div>
        </div>
      )}

      {tab === 'treatments' && (
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ marginTop: 0 }}>Treatments & Input Records</h3>
          <p style={{ color: '#64748b', marginTop: 0 }}>
            Maintain agronomy and input references including irrigation, soil profile, spacing, and field handling notes.
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            <button onClick={() => setShowTreatmentForm(v => !v)} style={{ padding: '8px 12px', borderRadius: 6, border: 'none', background: '#7c3aed', color: '#fff', cursor: 'pointer' }}>
              {showTreatmentForm ? 'Cancel' : '+ Add Treatment Record'}
            </button>
            <button onClick={() => exportToJSON(visibleTreatmentRecords, `crop_treatments_${new Date().toISOString().slice(0, 10)}.json`)} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer' }}>
              Export JSON
            </button>
            <button onClick={() => exportToCSV(visibleTreatmentRecords, `crop_treatments_${new Date().toISOString().slice(0, 10)}.csv`)} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer' }}>
              Export CSV
            </button>
          </div>

          {showTreatmentForm && (
            <form onSubmit={saveTreatmentRecord} style={{ marginBottom: 14, border: '1px solid #ede9fe', borderRadius: 8, padding: 12, background: '#faf8ff' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10 }}>
                <select value={treatmentForm.cropId} onChange={e => setRecordSubmoduleFromCrop(e.target.value, setTreatmentForm, treatmentForm)} required>
                  <option value="">Select Crop</option>
                  {crops.map(c => <option key={c.id} value={c.id}>{c.name} ({c.id})</option>)}
                </select>
                <input type="date" value={treatmentForm.date} onChange={e => setTreatmentForm({ ...treatmentForm, date: e.target.value })} required />
                <select value={treatmentForm.category} onChange={e => setTreatmentForm({ ...treatmentForm, category: e.target.value })}>
                  <option value="Fertilizer">Fertilizer</option>
                  <option value="Pesticide">Pesticide</option>
                  <option value="Fungicide">Fungicide</option>
                  <option value="Biostimulant">Biostimulant</option>
                  <option value="Irrigation">Irrigation</option>
                  <option value="Other">Other</option>
                </select>
                <input placeholder="Input Name" value={treatmentForm.inputName} onChange={e => setTreatmentForm({ ...treatmentForm, inputName: e.target.value })} required />
                <input placeholder="Dosage" value={treatmentForm.dosage} onChange={e => setTreatmentForm({ ...treatmentForm, dosage: e.target.value })} />
                <input placeholder="Method" value={treatmentForm.method} onChange={e => setTreatmentForm({ ...treatmentForm, method: e.target.value })} />
                <input placeholder="Reason" value={treatmentForm.reason} onChange={e => setTreatmentForm({ ...treatmentForm, reason: e.target.value })} />
                <input type="number" step="0.01" placeholder="Cost" value={treatmentForm.cost} onChange={e => setTreatmentForm({ ...treatmentForm, cost: e.target.value })} />
                <input type="number" placeholder="Withholding Days" value={treatmentForm.withholdingDays} onChange={e => setTreatmentForm({ ...treatmentForm, withholdingDays: e.target.value })} />
                <input placeholder="Notes" value={treatmentForm.notes} onChange={e => setTreatmentForm({ ...treatmentForm, notes: e.target.value })} />
              </div>
              <button type="submit" style={{ marginTop: 10, padding: '8px 12px', borderRadius: 6, border: 'none', background: '#6d28d9', color: '#fff', cursor: 'pointer' }}>Save Treatment Record</button>
            </form>
          )}

          <div style={{ display: 'grid', gap: 12 }}>
            {visibleTreatmentRecords.map(rec => {
              const crop = crops.find(c => c.id === rec.cropId)
              return (
                <div key={rec.id} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, background: '#ffffff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                    <div style={{ fontWeight: 700 }}>{crop?.name || rec.cropId} • {rec.category}</div>
                    <button onClick={() => deleteTreatmentRecord(rec.id)} style={{ border: '1px solid #fecaca', background: '#fee2e2', color: '#991b1b', borderRadius: 6, padding: '4px 9px', cursor: 'pointer' }}>Delete</button>
                  </div>
                  <div style={{ marginTop: 8, fontSize: 13, color: '#475569', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8 }}>
                    <div>Date: {rec.date}</div>
                    <div>Input: {rec.inputName}</div>
                    <div>Dosage: {rec.dosage || 'N/A'}</div>
                    <div>Method: {rec.method || 'N/A'}</div>
                    <div>Reason: {rec.reason || 'N/A'}</div>
                    <div>Cost: {rec.cost ? `KES ${rec.cost}` : 'N/A'}</div>
                    <div>Withholding: {rec.withholdingDays || 'N/A'} days</div>
                    <div>Plant Module: {PLANT_SUBMODULE_META[rec.plantSubmodule]?.label || 'Unassigned'}</div>
                  </div>
                  {rec.notes && <div style={{ marginTop: 8, fontSize: 13, color: '#334155' }}><strong>Notes:</strong> {rec.notes}</div>}
                </div>
              )
            })}
            {visibleTreatmentRecords.length === 0 && <div style={{ color: '#6b7280' }}>No treatment records yet for this submodule filter.</div>}
          </div>
        </div>
      )}
      {tab === 'pests' && (
        <div>
          <h3>Pest Management</h3>
          <button onClick={() => setShowPestForm(true)} style={{ marginBottom: '12px' }}>Add Pest Record</button>
          {showPestForm && (
            <form onSubmit={savePestRecord} style={{ marginBottom: '20px', background: '#fff7ed', padding: '16px', borderRadius: '8px' }}>
              <label>Crop ID</label>
              <input type="text" value={pestForm.cropId} onChange={e => setPestForm({ ...pestForm, cropId: e.target.value })} required />
              <label>Date</label>
              <input type="date" value={pestForm.date} onChange={e => setPestForm({ ...pestForm, date: e.target.value })} required />
              <label>Pest</label>
              <input type="text" value={pestForm.pest} onChange={e => setPestForm({ ...pestForm, pest: e.target.value })} required />
              <label>Severity</label>
              <input type="text" value={pestForm.severity} onChange={e => setPestForm({ ...pestForm, severity: e.target.value })} required />
              <label>Action</label>
              <input type="text" value={pestForm.action} onChange={e => setPestForm({ ...pestForm, action: e.target.value })} />
              <label>Notes</label>
              <textarea value={pestForm.notes} onChange={e => setPestForm({ ...pestForm, notes: e.target.value })} />
              <button type="submit">Save Pest Record</button>
              <button type="button" onClick={() => setShowPestForm(false)}>Cancel</button>
            </form>
          )}
          <ul>
            {pestRecords.map(rec => {
              const crop = crops.find(c => c.id === rec.cropId)
              return (
                <li key={rec.id} style={{ listStyle: 'none', padding: 0, marginBottom: '12px' }}>
                  <div className="card" style={{ padding: '16px' }}>
                    {inlineEditId === rec.id && inlineType === 'pest' ? (
                      <div onKeyDown={handleKeyDown} style={{ display: 'grid', gap: '12px' }}>
                        <input type="text" placeholder="Pest Name" value={inlineData.pest || ''} onChange={e => setInlineData({ ...inlineData, pest: e.target.value })} style={{ padding: '8px', border: '1px solid #ddd', borderRadius: 4 }} />
                        <select value={inlineData.severity || 'Mild'} onChange={e => setInlineData({ ...inlineData, severity: e.target.value })} style={{ padding: '8px', border: '1px solid #ddd', borderRadius: 4 }}>
                          <option value="Mild">Mild</option>
                          <option value="Moderate">Moderate</option>
                          <option value="Severe">Severe</option>
                          <option value="Critical">Critical</option>
                        </select>
                        <input type="text" placeholder="Action Taken" value={inlineData.action || ''} onChange={e => setInlineData({ ...inlineData, action: e.target.value })} style={{ padding: '8px', border: '1px solid #ddd', borderRadius: 4 }} />
                        <textarea placeholder="Notes" value={inlineData.notes || ''} onChange={e => setInlineData({ ...inlineData, notes: e.target.value })} rows={2} style={{ padding: '8px', border: '1px solid #ddd', borderRadius: 4 }} />
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button type="button" onClick={saveInlineEdit} style={{ padding: '8px 16px', background: '#059669', color: '#fff', borderRadius: 4, cursor: 'pointer', flex: 1 }}>Save</button>
                          <button type="button" onClick={cancelInlineEdit} style={{ padding: '8px 16px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: 4, cursor: 'pointer', flex: 1 }}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', fontWeight: '600' }}>{rec.pest}</h4>
                          <div style={{ fontSize: '0.9rem', color: '#666', display: 'grid', gap: '4px' }}>
                            <div><strong>Crop:</strong> {crop?.name || rec.cropId} | <strong>Date:</strong> {rec.date}</div>
                            <div><strong>Severity:</strong> <span style={{ padding: '2px 8px', borderRadius: '4px', background: rec.severity === 'Critical' ? '#fee2e2' : rec.severity === 'Severe' ? '#fed7aa' : rec.severity === 'Moderate' ? '#fef3c7' : '#d1fae5', color: rec.severity === 'Critical' ? '#991b1b' : rec.severity === 'Severe' ? '#9a3412' : rec.severity === 'Moderate' ? '#92400e' : '#065f46' }}>{rec.severity}</span></div>
                            {rec.action && <div><strong>Action:</strong> {rec.action}</div>}
                            {rec.notes && <div><strong>Notes:</strong> {rec.notes}</div>}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => startInlineEdit(rec, 'pest')} style={{ padding: '6px 12px', fontSize: '0.85rem', background: '#ffffcc', border: '1px solid #ffdd00', borderRadius: '6px', cursor: 'pointer' }}>⚡ Quick</button>
                          <button onClick={() => deletePestRecord(rec.id)} style={{ padding: '6px 12px', fontSize: '0.85rem', background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca', borderRadius: '6px', cursor: 'pointer' }}>🗑️ Delete</button>
                        </div>
                      </div>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}
      {tab === 'diseases' && (
        <div>
          <h3>Disease Management</h3>
          <button onClick={() => setShowDiseaseForm(true)} style={{ marginBottom: '12px' }}>Add Disease Record</button>
          {showDiseaseForm && (
            <form onSubmit={saveDiseaseRecord} style={{ marginBottom: '20px', background: '#fef2f2', padding: '16px', borderRadius: '8px' }}>
              <label>Crop ID</label>
              <input type="text" value={diseaseForm.cropId} onChange={e => setDiseaseForm({ ...diseaseForm, cropId: e.target.value })} required />
              <label>Date</label>
              <input type="date" value={diseaseForm.date} onChange={e => setDiseaseForm({ ...diseaseForm, date: e.target.value })} required />
              <label>Disease</label>
              <input type="text" value={diseaseForm.disease} onChange={e => setDiseaseForm({ ...diseaseForm, disease: e.target.value })} required />
              <label>Severity</label>
              <input type="text" value={diseaseForm.severity} onChange={e => setDiseaseForm({ ...diseaseForm, severity: e.target.value })} required />
              <label>Action</label>
              <input type="text" value={diseaseForm.action} onChange={e => setDiseaseForm({ ...diseaseForm, action: e.target.value })} />
              <label>Notes</label>
              <textarea value={diseaseForm.notes} onChange={e => setDiseaseForm({ ...diseaseForm, notes: e.target.value })} />
              <button type="submit">Save Disease Record</button>
              <button type="button" onClick={() => setShowDiseaseForm(false)}>Cancel</button>
            </form>
          )}
          <ul>
            {diseaseRecords.map(rec => {
              const crop = crops.find(c => c.id === rec.cropId)
              return (
                <li key={rec.id} style={{ listStyle: 'none', padding: 0, marginBottom: '12px' }}>
                  <div className="card" style={{ padding: '16px' }}>
                    {inlineEditId === rec.id && inlineType === 'disease' ? (
                      <div onKeyDown={handleKeyDown} style={{ display: 'grid', gap: '12px' }}>
                        <input type="text" placeholder="Disease Name" value={inlineData.disease || ''} onChange={e => setInlineData({ ...inlineData, disease: e.target.value })} style={{ padding: '8px', border: '1px solid #ddd', borderRadius: 4 }} />
                        <select value={inlineData.severity || 'Mild'} onChange={e => setInlineData({ ...inlineData, severity: e.target.value })} style={{ padding: '8px', border: '1px solid #ddd', borderRadius: 4 }}>
                          <option value="Mild">Mild</option>
                          <option value="Moderate">Moderate</option>
                          <option value="Severe">Severe</option>
                          <option value="Critical">Critical</option>
                        </select>
                        <input type="text" placeholder="Action Taken" value={inlineData.action || ''} onChange={e => setInlineData({ ...inlineData, action: e.target.value })} style={{ padding: '8px', border: '1px solid #ddd', borderRadius: 4 }} />
                        <textarea placeholder="Notes" value={inlineData.notes || ''} onChange={e => setInlineData({ ...inlineData, notes: e.target.value })} rows={2} style={{ padding: '8px', border: '1px solid #ddd', borderRadius: 4 }} />
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button type="button" onClick={saveInlineEdit} style={{ padding: '8px 16px', background: '#059669', color: '#fff', borderRadius: 4, cursor: 'pointer', flex: 1 }}>Save</button>
                          <button type="button" onClick={cancelInlineEdit} style={{ padding: '8px 16px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: 4, cursor: 'pointer', flex: 1 }}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', fontWeight: '600' }}>{rec.disease}</h4>
                          <div style={{ fontSize: '0.9rem', color: '#666', display: 'grid', gap: '4px' }}>
                            <div><strong>Crop:</strong> {crop?.name || rec.cropId} | <strong>Date:</strong> {rec.date}</div>
                            <div><strong>Severity:</strong> <span style={{ padding: '2px 8px', borderRadius: '4px', background: rec.severity === 'Critical' ? '#fee2e2' : rec.severity === 'Severe' ? '#fed7aa' : rec.severity === 'Moderate' ? '#fef3c7' : '#d1fae5', color: rec.severity === 'Critical' ? '#991b1b' : rec.severity === 'Severe' ? '#9a3412' : rec.severity === 'Moderate' ? '#92400e' : '#065f46' }}>{rec.severity}</span></div>
                            {rec.action && <div><strong>Action:</strong> {rec.action}</div>}
                            {rec.notes && <div><strong>Notes:</strong> {rec.notes}</div>}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => startInlineEdit(rec, 'disease')} style={{ padding: '6px 12px', fontSize: '0.85rem', background: '#ffffcc', border: '1px solid #ffdd00', borderRadius: '6px', cursor: 'pointer' }}>⚡ Quick</button>
                          <button onClick={() => deleteDiseaseRecord(rec.id)} style={{ padding: '6px 12px', fontSize: '0.85rem', background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca', borderRadius: '6px', cursor: 'pointer' }}>🗑️ Delete</button>
                        </div>
                      </div>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}
      {tab === 'reminders' && (
        <div>
          <h3>Reminders & Notifications</h3>
          <form onSubmit={saveReminder} style={{ marginBottom: '20px', background: '#f0fdf4', padding: '16px', borderRadius: '8px' }}>
            <label>Crop ID</label>
            <input type="text" value={reminderForm.cropId} onChange={e => setReminderForm({ ...reminderForm, cropId: e.target.value })} required />
            <label>Date</label>
            <input type="date" value={reminderForm.date} onChange={e => setReminderForm({ ...reminderForm, date: e.target.value })} required />
            <label>Message</label>
            <input type="text" value={reminderForm.message} onChange={e => setReminderForm({ ...reminderForm, message: e.target.value })} required />
            <button type="submit">Add Reminder</button>
          </form>
          <ul>
            {reminders.map(rem => (
              <li key={rem.id}>
                <strong>{rem.cropId}</strong> | {rem.date} | {rem.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === 'alerts' && (
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ marginTop: 0 }}>Smart Crop Alerts</h3>
          <p style={{ color: '#64748b', marginTop: 0 }}>
            Automatically surfaces low margins, missing post-harvest sales, and unusual treatment-cost spikes for the current crop filter.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 12 }}>
            <div className="card" style={{ padding: 12, background: '#fef2f2', border: '1px solid #fecaca' }}>
              <div style={{ fontSize: 12, color: '#991b1b' }}>Critical Alerts</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#b91c1c' }}>{alertSummary.critical}</div>
            </div>
            <div className="card" style={{ padding: 12, background: '#fff7ed', border: '1px solid #fdba74' }}>
              <div style={{ fontSize: 12, color: '#9a3412' }}>Warning Alerts</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#c2410c' }}>{alertSummary.warning}</div>
            </div>
            <div className="card" style={{ padding: 12, background: '#eff6ff', border: '1px solid #bfdbfe' }}>
              <div style={{ fontSize: 12, color: '#1d4ed8' }}>Info Alerts</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#1d4ed8' }}>{alertSummary.info}</div>
            </div>
            <div className="card" style={{ padding: 12, background: '#f8fafc', border: '1px solid #cbd5e1' }}>
              <div style={{ fontSize: 12, color: '#475569' }}>Current Plant Scope</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>{plantSubmodule === 'all' ? 'All Plants' : (PLANT_SUBMODULE_META[plantSubmodule]?.label || plantSubmodule)}</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            <button onClick={() => exportToJSON(cropAlerts, `crop_smart_alerts_${new Date().toISOString().slice(0, 10)}.json`)} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer' }}>
              Export Alerts JSON
            </button>
            <button onClick={() => exportToCSV(cropAlerts, `crop_smart_alerts_${new Date().toISOString().slice(0, 10)}.csv`)} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer' }}>
              Export Alerts CSV
            </button>
          </div>

          <div style={{ display: 'grid', gap: 10 }}>
            {cropAlerts.map(alert => {
              const theme = ALERT_THEME[alert.severity] || ALERT_THEME.info
              return (
                <div key={alert.id} style={{ border: `1px solid ${theme.border}`, borderRadius: 10, padding: 12, background: theme.background }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 800, color: theme.text }}>{alert.title}</div>
                      <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>
                        {alert.cropName} ({alert.cropId}) • {PLANT_SUBMODULE_META[alert.plantSubmodule]?.label || 'Unassigned'}
                      </div>
                    </div>
                    <div style={{ padding: '4px 8px', borderRadius: 999, background: theme.badgeBackground, color: theme.badgeText, fontSize: 11, fontWeight: 800 }}>
                      {alert.severity.toUpperCase()}
                    </div>
                  </div>
                  <div style={{ marginTop: 8, fontSize: 13, color: '#334155', lineHeight: 1.5 }}>{alert.message}</div>
                  <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ fontSize: 12, color: '#64748b' }}>Signal: {alert.category} • Route: {alert.relatedTab}</div>
                    <button onClick={() => openAlertContext(alert)} style={{ padding: '6px 10px', borderRadius: 6, border: 'none', background: theme.badgeBackground, color: '#fff', cursor: 'pointer', fontWeight: 700 }}>
                      {alert.actionLabel}
                    </button>
                  </div>
                </div>
              )
            })}
            {cropAlerts.length === 0 && <div style={{ color: '#6b7280' }}>No smart alerts were generated for the current plant filter.</div>}
          </div>
        </div>
      )}

      {tab === 'profitability' && (
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ marginTop: 0 }}>Profitability Dashboard</h3>
          <p style={{ color: '#64748b', marginTop: 0 }}>
            Full cost accounting and margin analysis by crop and plant submodule.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 12 }}>
            <div className="card" style={{ padding: 12, background: '#ecfeff', border: '1px solid #a5f3fc' }}>
              <div style={{ fontSize: 12, color: '#155e75' }}>Total Revenue</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#0f766e' }}>KES {profitabilitySummary.revenue.toFixed(2)}</div>
            </div>
            <div className="card" style={{ padding: 12, background: '#fff7ed', border: '1px solid #fdba74' }}>
              <div style={{ fontSize: 12, color: '#9a3412' }}>Total Cost</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#c2410c' }}>KES {profitabilitySummary.cost.toFixed(2)}</div>
            </div>
            <div className="card" style={{ padding: 12, background: profitabilitySummary.margin >= 0 ? '#ecfdf5' : '#fef2f2', border: profitabilitySummary.margin >= 0 ? '1px solid #86efac' : '1px solid #fecaca' }}>
              <div style={{ fontSize: 12, color: profitabilitySummary.margin >= 0 ? '#166534' : '#991b1b' }}>Net Margin</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: profitabilitySummary.margin >= 0 ? '#15803d' : '#dc2626' }}>KES {profitabilitySummary.margin.toFixed(2)}</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            <button onClick={() => setShowCostForm(v => !v)} style={{ padding: '8px 12px', borderRadius: 6, border: 'none', background: '#1d4ed8', color: '#fff', cursor: 'pointer' }}>
              {showCostForm ? 'Cancel' : '+ Add Cost Entry'}
            </button>
            <button onClick={() => exportToJSON(visibleCostRecords, `crop_costs_${new Date().toISOString().slice(0, 10)}.json`)} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer' }}>
              Export Cost JSON
            </button>
            <button onClick={() => exportToCSV(visibleCostRecords, `crop_costs_${new Date().toISOString().slice(0, 10)}.csv`)} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer' }}>
              Export Cost CSV
            </button>
          </div>

          {showCostForm && (
            <form onSubmit={saveCostRecord} style={{ marginBottom: 14, border: '1px solid #dbeafe', borderRadius: 8, padding: 12, background: '#f8fbff' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10 }}>
                <select value={costForm.cropId} onChange={e => setRecordSubmoduleFromCrop(e.target.value, setCostForm, costForm)} required>
                  <option value="">Select Crop</option>
                  {crops.map(c => <option key={c.id} value={c.id}>{c.name} ({c.id})</option>)}
                </select>
                <input type="date" value={costForm.date} onChange={e => setCostForm({ ...costForm, date: e.target.value })} required />
                <select value={costForm.category} onChange={e => setCostForm({ ...costForm, category: e.target.value })}>
                  <option value="Labor">Labor</option>
                  <option value="Transport">Transport</option>
                  <option value="Packing">Packing</option>
                  <option value="Certification">Certification</option>
                  <option value="Storage">Storage</option>
                  <option value="Utilities">Utilities</option>
                  <option value="Other">Other</option>
                </select>
                <input type="number" step="0.01" placeholder="Amount" value={costForm.amount} onChange={e => setCostForm({ ...costForm, amount: e.target.value })} required />
                <input placeholder="Vendor" value={costForm.vendor} onChange={e => setCostForm({ ...costForm, vendor: e.target.value })} />
                <input placeholder="Reference" value={costForm.reference} onChange={e => setCostForm({ ...costForm, reference: e.target.value })} />
                <input placeholder="Notes" value={costForm.notes} onChange={e => setCostForm({ ...costForm, notes: e.target.value })} />
              </div>
              <button type="submit" style={{ marginTop: 10, padding: '8px 12px', borderRadius: 6, border: 'none', background: '#1e40af', color: '#fff', cursor: 'pointer' }}>Save Cost Entry</button>
            </form>
          )}

          <div style={{ display: 'grid', gap: 10, marginBottom: 14 }}>
            {profitabilityByCrop.map(row => (
              <div key={row.crop.id} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, background: '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                  <div style={{ fontWeight: 700 }}>{row.crop.name} ({row.crop.id})</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: row.margin >= 0 ? '#15803d' : '#dc2626' }}>
                    Margin {row.marginPct.toFixed(1)}%
                  </div>
                </div>
                <div style={{ marginTop: 8, fontSize: 13, color: '#475569', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 8 }}>
                  <div>Revenue: KES {row.salesTotal.toFixed(2)}</div>
                  <div>Total Cost: KES {row.totalCost.toFixed(2)}</div>
                  <div>Seed Cost: KES {row.seedCost.toFixed(2)}</div>
                  <div>Treatment Cost: KES {row.treatmentCost.toFixed(2)}</div>
                  <div>Ledger Cost: KES {row.ledgerCost.toFixed(2)}</div>
                  <div>Net Margin: <span style={{ color: row.margin >= 0 ? '#15803d' : '#dc2626', fontWeight: 700 }}>KES {row.margin.toFixed(2)}</span></div>
                </div>
              </div>
            ))}
            {profitabilityByCrop.length === 0 && <div style={{ color: '#6b7280' }}>No crops available for profitability analysis.</div>}
          </div>

          <div style={{ display: 'grid', gap: 8 }}>
            {visibleCostRecords.map(rec => {
              const crop = crops.find(c => c.id === rec.cropId)
              return (
                <div key={rec.id} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 10, background: '#fff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                    <div style={{ fontWeight: 600 }}>{crop?.name || rec.cropId} • {rec.category} • KES {Number(rec.amount || 0).toFixed(2)}</div>
                    <button onClick={() => deleteCostRecord(rec.id)} style={{ border: '1px solid #fecaca', background: '#fee2e2', color: '#991b1b', borderRadius: 6, padding: '4px 9px', cursor: 'pointer' }}>Delete</button>
                  </div>
                  <div style={{ marginTop: 6, fontSize: 12, color: '#64748b' }}>
                    {rec.date} • {rec.vendor || 'No vendor'} • {rec.reference || 'No reference'} • {PLANT_SUBMODULE_META[rec.plantSubmodule]?.label || 'Unassigned'}
                  </div>
                  {rec.notes && <div style={{ marginTop: 4, fontSize: 12, color: '#334155' }}>{rec.notes}</div>}
                </div>
              )
            })}
            {visibleCostRecords.length === 0 && <div style={{ color: '#6b7280' }}>No additional cost entries yet for this plant filter.</div>}
          </div>
        </div>
      )}

      {tab === 'cv' && (
        <CropCV
          crops={crops}
          yieldRecords={yieldRecords}
          salesRecords={salesRecords}
          treatmentRecords={treatmentRecords}
          costRecords={costRecords}
          pestRecords={pestRecords}
          diseaseRecords={diseaseRecords}
          reminders={reminders}
          plantSubmodule={plantSubmodule}
          plantMeta={PLANT_SUBMODULE_META}
        />
      )}
      {/* Azolla ponds tab removed as requested */}

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
          gap: 12
        }}>
          <div>{toast.message}</div>
          {toast.showUndo && <button onClick={undoLastChange} style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', fontWeight: 600 }}>↶ Undo</button>}
        </div>
      )}
    </section>
  )
}
