import React, { useEffect, useState, useRef } from 'react'
import Pastures from './Pastures'
import HealthSystem from './HealthSystem'
import AnimalFeeding from './AnimalFeeding'
import AnimalMeasurement from './AnimalMeasurement'
import AnimalBreeding from './AnimalBreeding'
import AnimalMilkYield from './AnimalMilkYield'
import AnimalTreatment from './AnimalTreatment'
import CalfManagement from './CalfManagement'
import BSFFarming from './BSFFarming'
import AzollaFarming from './AzollaFarming'
import PoultryManagement from './PoultryManagement'
import CanineManagement from './CanineManagement'
import PhotoGallery from '../components/PhotoGallery'
import { fileToDataUrl, estimateDataUrlSize, uid } from '../lib/image'
import { exportToCSV, exportToExcel, exportToJSON, importFromCSV, importFromJSON, batchPrint } from '../lib/exportImport'
import { generateQRCodeDataURL, printQRTag, batchPrintQRTags } from '../lib/qrcode'

// Realized Animals component: HTML5 controls, inline validation, unique tag checks,
// realistic sample data, and non-placeholder behavior.
export default function Animals() {
  const AKEY = 'cattalytics:animals'
  const GKEY = 'cattalytics:groups'

  const SAMPLE_GROUPS = [
    { id: 'G-001', name: 'Bovine', desc: 'Cattle and dairy herd' },
    { id: 'G-002', name: 'Porcine', desc: 'Pigs and swine' },
    { id: 'G-003', name: 'Avians', desc: 'Poultry - chickens, turkeys, ducks' },
    { id: 'G-004', name: 'Canines', desc: 'Dogs and working canines' }
  ]

  const SAMPLE_ANIMALS = [
    { id: 'A-001', tag: 'TAG1001', name: 'Bessie', breed: 'Holstein', sex: 'F', color: 'Black/White', dob: '2019-05-10', weight: 450, sire: 'S-100', dam: 'D-200', groupId: 'G-001', status: 'Active', notes: 'High producing cow', owner: 'Farm Owner', registration: 'REG-9001', tattoo: 'T-01', purchaseDate: '2019-06-01', purchasePrice: 180000, vendor: 'Local Auction', tags: ['dairy','priority'], photo: '', pregnancyStatus: 'Not Pregnant', expectedDue: '', parity: 3, lactationStatus: 'Lactating' },
    { id: 'A-002', tag: 'TAG1002', name: 'Molly', breed: 'Jersey', sex: 'F', color: 'Brown', dob: '2020-03-22', weight: 380, sire: 'S-101', dam: 'D-201', groupId: 'G-001', status: 'Active', notes: '', owner: '', registration: '', tattoo: '', purchaseDate: '', purchasePrice: '', vendor: '', tags: [], photo: '', pregnancyStatus: 'Unknown', expectedDue: '', parity: 1, lactationStatus: 'Dry' },
    { id: 'A-003', tag: 'TAG1003', name: 'Duke', breed: 'Angus', sex: 'M', color: 'Black', dob: '2018-11-02', weight: 620, sire: '', dam: '', groupId: 'G-002', status: 'Sold', notes: 'Sold at market', owner: '', registration: '', tattoo: '', purchaseDate: '', purchasePrice: '', vendor: '', tags: [], photo: '', pregnancyStatus: 'Not Applicable', expectedDue: '', parity: 0, lactationStatus: 'NA' }
  ]

  const [tab, setTab] = useState('list')
  const [animals, setAnimals] = useState([])
  const [groups, setGroups] = useState([])
  const [filter, setFilter] = useState('')
  const [filterGroup, setFilterGroup] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterSex, setFilterSex] = useState('all')
  const [sortBy, setSortBy] = useState('name')

  const emptyAnimal = { id: '', tag: '', name: '', breed: '', sex: 'F', color: '', dob: '', weight: '', sire: '', dam: '', groupId: '', status: 'Active', notes: '', owner: '', registration: '', tattoo: '', purchaseDate: '', purchasePrice: '', vendor: '', tags: [], photo: '', photos: [], pregnancyStatus: 'Unknown', expectedDue: '', parity: '', lactationStatus: 'NA' }
  const [form, setForm] = useState(emptyAnimal)
  const [editingId, setEditingId] = useState(null)
  const [errors, setErrors] = useState({})

  const [groupName, setGroupName] = useState('')
  const [groupDesc, setGroupDesc] = useState('')
  const [editingGroupId, setEditingGroupId] = useState(null)

  useEffect(() => {
    try {
      const rawA = localStorage.getItem(AKEY)
      const rawG = localStorage.getItem(GKEY)
      setAnimals(rawA ? JSON.parse(rawA) : SAMPLE_ANIMALS)
      setGroups(rawG ? JSON.parse(rawG) : SAMPLE_GROUPS)
    } catch (err) {
      console.error('Failed parsing stored data', err)
      setAnimals(SAMPLE_ANIMALS)
      setGroups(SAMPLE_GROUPS)
    }
  }, [])

  useEffect(() => localStorage.setItem(AKEY, JSON.stringify(animals)), [animals])
  useEffect(() => localStorage.setItem(GKEY, JSON.stringify(groups)), [groups])

  function validateAnimal(a) {
    const e = {}
    if (!a.name || !a.name.trim()) e.name = 'Name is required'
    if (a.dob) {
      const d = Date.parse(a.dob)
      if (Number.isNaN(d)) e.dob = 'Invalid date'
    }
    if (a.weight) {
      const w = Number(a.weight)
      if (Number.isNaN(w) || w < 0) e.weight = 'Weight must be a positive number'
    }
    if (a.purchaseDate) {
      const pd = Date.parse(a.purchaseDate)
      if (Number.isNaN(pd)) e.purchaseDate = 'Invalid purchase date'
    }
    if (a.purchasePrice) {
      const p = Number(a.purchasePrice)
      if (Number.isNaN(p) || p < 0) e.purchasePrice = 'Purchase price must be a positive number'
    }
    // tag uniqueness
    if (a.tag && animals.some(x => x.tag === a.tag && x.id !== a.id)) e.tag = 'Tag must be unique'
    return e
  }

  function resetForm() { setForm(emptyAnimal); setEditingId(null); setErrors({}) }

  const MAX_PHOTOS = 5
  const MAX_PHOTO_BYTES = 2 * 1024 * 1024 // 2 MB
  const MAX_DIM = 1024
  const JPG_QUALITY = 0.8

  async function handleFiles(selectedFiles) {
    if (!selectedFiles || !selectedFiles.length) return
    const current = Array.isArray(form.photos) ? [...form.photos] : []
    for (let i = 0; i < selectedFiles.length; i++) {
      if (current.length >= MAX_PHOTOS) break
      const f = selectedFiles[i]
      try {
        const { dataUrl, mime, size } = await fileToDataUrl(f, { maxDim: MAX_DIM, quality: JPG_QUALITY })
        if (size > MAX_PHOTO_BYTES) {
          window.alert(`${f.name} is too large after compression (${Math.round(size/1024)} KB). Skipping.`)
          continue
        }
        current.push({ id: uid('p-'), dataUrl, filename: f.name, mime, size, createdAt: new Date().toISOString() })
      } catch (err) {
        console.error('Failed processing image', err)
        window.alert('Failed to process ' + f.name)
      }
    }
    setForm(f => ({ ...f, photos: current }))
  }

  function handleFileInput(e){
    const files = e.target.files
    handleFiles(files)
    // reset input value so same file can be picked again
    e.target.value = ''
  }

  function removePhoto(photoId){
    setForm(f => ({ ...f, photos: (f.photos || []).filter(p => p.id !== photoId) }))
  }

  function saveAnimal(e) {
    e && e.preventDefault()
    const candidate = { ...form }
    if (!candidate.tag || !candidate.tag.trim()) candidate.tag = 'TAG' + (1000 + Math.floor(Math.random() * 9000))
    const eobj = validateAnimal(candidate)
    setErrors(eobj)
    if (Object.keys(eobj).length) return

    if (editingId) {
      // Update existing animal - regenerate QR code with updated data
      const updatedAnimal = { 
        ...candidate,
        id: editingId  // Preserve the ID
      }
      const qrData = {
        type: 'animal',
        id: editingId,
        name: updatedAnimal.name,
        tag: updatedAnimal.tag,
        breed: updatedAnimal.breed
      }
      updatedAnimal.qrCode = generateQRCodeDataURL(JSON.stringify(qrData))
      
      // Update the animal in the array, preserving fields not in the form
      setAnimals(animals.map(a => a.id === editingId ? { ...a, ...updatedAnimal } : a))
    } else {
      // Create new animal - generate ID and QR code
      const id = 'A-' + (1000 + Math.floor(Math.random() * 900000))
      // normalize tags: accept comma-separated string or array
      if (candidate.tags && typeof candidate.tags === 'string') candidate.tags = candidate.tags.split(',').map(t => t.trim()).filter(Boolean)
      
      // Generate QR code automatically
      const qrData = {
        type: 'animal',
        id: id,
        name: candidate.name,
        tag: candidate.tag,
        breed: candidate.breed
      }
      candidate.qrCode = generateQRCodeDataURL(JSON.stringify(qrData))
      
      setAnimals([...animals, { ...candidate, id }])
    }
    resetForm()
    setTab('list')
  }

  function startEditAnimal(a) {
    // Merge animal data with emptyAnimal to ensure all fields have values
    setForm({ ...emptyAnimal, ...a })
    setEditingId(a.id)
    setTab('addAnimal')
  }
  function deleteAnimal(id) { if (!window.confirm('Delete animal ' + id + '?')) return; setAnimals(animals.filter(a => a.id !== id)) }

  function resetGroupForm() { setGroupName(''); setGroupDesc(''); setEditingGroupId(null) }

  function saveGroup(e) {
    e && e.preventDefault()
    if (!groupName.trim()) return
    if (editingGroupId) {
      setGroups(groups.map(g => g.id === editingGroupId ? { ...g, name: groupName.trim(), desc: groupDesc } : g))
    } else {
      const id = 'G-' + (1000 + Math.floor(Math.random() * 900000))
      setGroups([...groups, { id, name: groupName.trim(), desc: groupDesc }])
    }
    resetGroupForm()
    setTab('list')
  }

  function startEditGroup(g) { setEditingGroupId(g.id); setGroupName(g.name); setGroupDesc(g.desc); setTab('addGroup') }
  function deleteGroup(id) {
    if (!window.confirm('Delete group ' + id + '?')) return
    setGroups(groups.filter(g => g.id !== id))
    setAnimals(animals.map(a => a.groupId === id ? { ...a, groupId: '' } : a))
  }

  const q = filter.trim().toLowerCase()
  const filtered = animals.filter(a => {
    // Text search
    if (q) {
      const groupName = groups.find(g => g.id === a.groupId)?.name || ''
      const matchesText = (a.id || '').toLowerCase().includes(q) || 
                         (a.tag || '').toLowerCase().includes(q) || 
                         (a.name || '').toLowerCase().includes(q) || 
                         (a.breed || '').toLowerCase().includes(q) || 
                         groupName.toLowerCase().includes(q)
      if (!matchesText) return false
    }
    
    // Group filter
    if (filterGroup !== 'all') {
      if (filterGroup === 'ungrouped' && a.groupId) return false
      if (filterGroup !== 'ungrouped' && a.groupId !== filterGroup) return false
    }
    
    // Status filter
    if (filterStatus !== 'all' && a.status !== filterStatus) return false
    
    // Sex filter
    if (filterSex !== 'all' && a.sex !== filterSex) return false
    
    return true
  })

  // Sort animals
  const sortedAnimals = [...filtered].sort((a, b) => {
    switch(sortBy) {
      case 'name': return (a.name || '').localeCompare(b.name || '')
      case 'tag': return (a.tag || '').localeCompare(b.tag || '')
      case 'breed': return (a.breed || '').localeCompare(b.breed || '')
      case 'dob': return (a.dob || '').localeCompare(b.dob || '')
      case 'weight': return (parseFloat(b.weight) || 0) - (parseFloat(a.weight) || 0)
      case 'status': return (a.status || '').localeCompare(b.status || '')
      default: return 0
    }
  })
  const [expandedIds, setExpandedIds] = useState([])
  const [inlineEditingId, setInlineEditingId] = useState(null)
  const [inlineForm, setInlineForm] = useState(emptyAnimal)
  const [modalOpenId, setModalOpenId] = useState(null)

  function toggleExpand(id){
    // Open modal-like expansive view for a single animal to mimic Farmbrite
    if (modalOpenId === id) {
      setModalOpenId(null)
      setExpandedIds(prev => prev.filter(x => x !== id))
    } else {
      setModalOpenId(id)
      setExpandedIds([id])
    }
  }

  function startInlineEdit(a){
    setInlineEditingId(a.id)
    setInlineForm({ ...a })
  }

  function saveInlineEdit(){
    if(!inlineEditingId) return
    setAnimals(animals.map(x => x.id === inlineEditingId ? { ...x, ...inlineForm } : x))
    setInlineEditingId(null)
  }

  function cancelInlineEdit(){ setInlineEditingId(null) }

  function handleInlineChange(field, value){ setInlineForm(f => ({ ...f, [field]: value })) }

  function recordWeight(a){
    const input = window.prompt('Enter new weight (kg)', a.weight || '')
    if (input === null) return
    const w = Number(input)
    if (Number.isNaN(w)) { window.alert('Invalid number'); return }
    const ts = new Date().toISOString()
    setAnimals(animals.map(x => x.id === a.id ? { ...x, weight: w, weightLogs: [...(x.weightLogs||[]), { weight: w, date: ts }] } : x))
  }

  // Export functions
  const fileInputRef = useRef(null)

  function handleExportCSV() {
    const exportData = animals.map(a => ({
      id: a.id,
      tag: a.tag,
      name: a.name,
      species: a.species,
      breed: a.breed,
      sex: a.sex,
      dob: a.dob,
      age: a.age || '',
      weight: a.weight || '',
      group: a.group || '',
      status: a.status,
      sire: a.sire || '',
      dam: a.dam || '',
      notes: a.notes || ''
    }))
    exportToCSV(exportData, 'animals.csv')
  }

  function handleExportExcel() {
    const exportData = animals.map(a => ({
      id: a.id,
      tag: a.tag,
      name: a.name,
      species: a.species,
      breed: a.breed,
      sex: a.sex,
      dob: a.dob,
      age: a.age || '',
      weight: a.weight || '',
      group: a.group || '',
      status: a.status,
      sire: a.sire || '',
      dam: a.dam || '',
      notes: a.notes || ''
    }))
    exportToExcel(exportData, 'animals_export.csv')
  }

  function handleExportJSON() {
    exportToJSON(animals, 'animals.json')
  }

  function handleImportClick() {
    fileInputRef.current?.click()
  }

  function handleImportFile(e) {
    const file = e.target.files?.[0]
    if (!file) return

    const ext = file.name.split('.').pop()?.toLowerCase()

    if (ext === 'json') {
      importFromJSON(file, (data, error) => {
        if (error) {
          alert('Import failed: ' + error.message)
          return
        }
        if (confirm(`Import ${data.length} animals? This will merge with existing data.`)) {
          const imported = data.map(a => ({
            ...a,
            id: a.id || uid()
          }))
          setAnimals([...animals, ...imported])
          alert(`Imported ${imported.length} animals`)
        }
      })
    } else if (ext === 'csv') {
      importFromCSV(file, (data, error) => {
        if (error) {
          alert('Import failed: ' + error.message)
          return
        }
        if (confirm(`Import ${data.length} animals? This will merge with existing data.`)) {
          const imported = data.map(a => ({
            id: a.id || uid(),
            tag: a.tag || '',
            name: a.name || '',
            species: a.species || '',
            breed: a.breed || '',
            sex: a.sex || '',
            dob: a.dob || '',
            age: a.age || '',
            weight: a.weight ? Number(a.weight) : 0,
            group: a.group || '',
            status: a.status || 'active',
            sire: a.sire || '',
            dam: a.dam || '',
            notes: a.notes || ''
          }))
          setAnimals([...animals, ...imported])
          alert(`Imported ${imported.length} animals`)
        }
      })
    } else {
      alert('Unsupported file type. Use CSV or JSON.')
    }

    e.target.value = '' // Reset input
  }

  function handleBatchPrint() {
    const filtered = animals.filter(filterAnimal)
    if (filtered.length === 0) {
      alert('No animals to print')
      return
    }

    batchPrint(filtered, (animal) => `
      <div style="padding: 20px; border: 2px solid #000; margin-bottom: 20px;">
        <h2 style="margin-top: 0;">Animal Record: ${animal.tag || animal.name}</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><th style="text-align: left; width: 150px;">Tag:</th><td>${animal.tag || 'N/A'}</td></tr>
          <tr><th style="text-align: left;">Name:</th><td>${animal.name}</td></tr>
          <tr><th style="text-align: left;">Species:</th><td>${animal.species}</td></tr>
          <tr><th style="text-align: left;">Breed:</th><td>${animal.breed || 'N/A'}</td></tr>
          <tr><th style="text-align: left;">Sex:</th><td>${animal.sex}</td></tr>
          <tr><th style="text-align: left;">Date of Birth:</th><td>${animal.dob || 'N/A'}</td></tr>
          <tr><th style="text-align: left;">Age:</th><td>${animal.age || 'N/A'}</td></tr>
          <tr><th style="text-align: left;">Weight:</th><td>${animal.weight ? animal.weight + ' kg' : 'N/A'}</td></tr>
          <tr><th style="text-align: left;">Group:</th><td>${animal.group || 'N/A'}</td></tr>
          <tr><th style="text-align: left;">Status:</th><td>${animal.status}</td></tr>
          <tr><th style="text-align: left;">Sire:</th><td>${animal.sire || 'N/A'}</td></tr>
          <tr><th style="text-align: left;">Dam:</th><td>${animal.dam || 'N/A'}</td></tr>
          <tr><th style="text-align: left;">Notes:</th><td>${animal.notes || 'N/A'}</td></tr>
        </table>
      </div>
    `, 'Animal Records')
  }

  return (
    <section>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '8px', color: 'inherit' }}>🐄 Livestock Management</h2>
        <p style={{ color: 'var(--muted)', margin: 0 }}>Comprehensive livestock tracking and management system</p>
      </div>

      {/* Statistics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--green)' }}>{animals.length}</div>
          <div style={{ fontSize: '14px', color: 'var(--muted)' }}>Total Animals</div>
        </div>
        <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#3b82f6' }}>{animals.filter(a => a.status === 'Active').length}</div>
          <div style={{ fontSize: '14px', color: 'var(--muted)' }}>Active</div>
        </div>
        <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#ec4899' }}>{animals.filter(a => a.sex === 'F').length}</div>
          <div style={{ fontSize: '14px', color: 'var(--muted)' }}>Female</div>
        </div>
        <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#6b7280' }}>{groups.length}</div>
          <div style={{ fontSize: '14px', color: 'var(--muted)' }}>Groups</div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ borderBottom: '2px solid #e5e7eb', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', overflowX: 'auto' }}>
          <button
            onClick={() => setTab('list')}
            style={{
              padding: '12px 20px',
              border: 'none',
              borderBottom: tab === 'list' ? '3px solid var(--green)' : '3px solid transparent',
              background: tab === 'list' ? '#f0fdf4' : 'transparent',
              color: tab === 'list' ? 'var(--green)' : '#6b7280',
              fontWeight: tab === 'list' ? '600' : '400',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            📋 Animal List
          </button>
          <button
            onClick={() => setTab('feeding')}
            style={{
              padding: '12px 20px',
              border: 'none',
              borderBottom: tab === 'feeding' ? '3px solid var(--green)' : '3px solid transparent',
              background: tab === 'feeding' ? '#f0fdf4' : 'transparent',
              color: tab === 'feeding' ? 'var(--green)' : '#6b7280',
              fontWeight: tab === 'feeding' ? '600' : '400',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🌾 Feeding
          </button>
          <button
            onClick={() => setTab('health')}
            style={{
              padding: '12px 20px',
              border: 'none',
              borderBottom: tab === 'health' ? '3px solid var(--green)' : '3px solid transparent',
              background: tab === 'health' ? '#f0fdf4' : 'transparent',
              color: tab === 'health' ? 'var(--green)' : '#6b7280',
              fontWeight: tab === 'health' ? '600' : '400',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🏥 Health System
          </button>
          <button
            onClick={() => setTab('treatment')}
            style={{
              padding: '12px 20px',
              border: 'none',
              borderBottom: tab === 'treatment' ? '3px solid var(--green)' : '3px solid transparent',
              background: tab === 'treatment' ? '#f0fdf4' : 'transparent',
              color: tab === 'treatment' ? 'var(--green)' : '#6b7280',
              fontWeight: tab === 'treatment' ? '600' : '400',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            💊 Treatment
          </button>
          <button
            onClick={() => setTab('breeding')}
            style={{
              padding: '12px 20px',
              border: 'none',
              borderBottom: tab === 'breeding' ? '3px solid var(--green)' : '3px solid transparent',
              background: tab === 'breeding' ? '#f0fdf4' : 'transparent',
              color: tab === 'breeding' ? 'var(--green)' : '#6b7280',
              fontWeight: tab === 'breeding' ? '600' : '400',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🤰 Breeding
          </button>
          <button
            onClick={() => setTab('milkyield')}
            style={{
              padding: '12px 20px',
              border: 'none',
              borderBottom: tab === 'milkyield' ? '3px solid var(--green)' : '3px solid transparent',
              background: tab === 'milkyield' ? '#f0fdf4' : 'transparent',
              color: tab === 'milkyield' ? 'var(--green)' : '#6b7280',
              fontWeight: tab === 'milkyield' ? '600' : '400',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🥛 Milk Yield
          </button>
          <button
            onClick={() => setTab('measurement')}
            style={{
              padding: '12px 20px',
              border: 'none',
              borderBottom: tab === 'measurement' ? '3px solid var(--green)' : '3px solid transparent',
              background: tab === 'measurement' ? '#f0fdf4' : 'transparent',
              color: tab === 'measurement' ? 'var(--green)' : '#6b7280',
              fontWeight: tab === 'measurement' ? '600' : '400',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            📏 Measurement
          </button>
          <button
            onClick={() => setTab('calf')}
            style={{
              padding: '12px 20px',
              border: 'none',
              borderBottom: tab === 'calf' ? '3px solid var(--green)' : '3px solid transparent',
              background: tab === 'calf' ? '#f0fdf4' : 'transparent',
              color: tab === 'calf' ? 'var(--green)' : '#6b7280',
              fontWeight: tab === 'calf' ? '600' : '400',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🐮 Calf Mgmt
          </button>
          <button
            onClick={() => setTab('pastures')}
            style={{
              padding: '12px 20px',
              border: 'none',
              borderBottom: tab === 'pastures' ? '3px solid var(--green)' : '3px solid transparent',
              background: tab === 'pastures' ? '#f0fdf4' : 'transparent',
              color: tab === 'pastures' ? 'var(--green)' : '#6b7280',
              fontWeight: tab === 'pastures' ? '600' : '400',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🌱 Pastures
          </button>
          <button
            onClick={() => setTab('bsf')}
            style={{
              padding: '12px 20px',
              border: 'none',
              borderBottom: tab === 'bsf' ? '3px solid var(--green)' : '3px solid transparent',
              background: tab === 'bsf' ? '#f0fdf4' : 'transparent',
              color: tab === 'bsf' ? 'var(--green)' : '#6b7280',
              fontWeight: tab === 'bsf' ? '600' : '400',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🪰 BSF Farm
          </button>
          <button
            onClick={() => setTab('azolla')}
            style={{
              padding: '12px 20px',
              border: 'none',
              borderBottom: tab === 'azolla' ? '3px solid var(--green)' : '3px solid transparent',
              background: tab === 'azolla' ? '#f0fdf4' : 'transparent',
              color: tab === 'azolla' ? 'var(--green)' : '#6b7280',
              fontWeight: tab === 'azolla' ? '600' : '400',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🌿 Azolla
          </button>
          <button
            onClick={() => setTab('poultry')}
            style={{
              padding: '12px 20px',
              border: 'none',
              borderBottom: tab === 'poultry' ? '3px solid var(--green)' : '3px solid transparent',
              background: tab === 'poultry' ? '#f0fdf4' : 'transparent',
              color: tab === 'poultry' ? 'var(--green)' : '#6b7280',
              fontWeight: tab === 'poultry' ? '600' : '400',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🐔 Poultry
          </button>
          <button
            onClick={() => setTab('canine')}
            style={{
              padding: '12px 20px',
              border: 'none',
              borderBottom: tab === 'canine' ? '3px solid var(--green)' : '3px solid transparent',
              background: tab === 'canine' ? '#f0fdf4' : 'transparent',
              color: tab === 'canine' ? 'var(--green)' : '#6b7280',
              fontWeight: tab === 'canine' ? '600' : '400',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🐕 Canines
          </button>
          <button
            onClick={() => { resetGroupForm(); setTab('addGroup') }}
            style={{
              padding: '12px 20px',
              border: 'none',
              borderBottom: tab === 'addGroup' ? '3px solid var(--green)' : '3px solid transparent',
              background: tab === 'addGroup' ? '#f0fdf4' : 'transparent',
              color: tab === 'addGroup' ? 'var(--green)' : '#6b7280',
              fontWeight: tab === 'addGroup' ? '600' : '400',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            👥 Groups
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {tab === 'list' && (
        <div>
          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button 
              onClick={() => { resetForm(); setTab('addAnimal') }}
              style={{ 
                background: 'var(--green)', 
                color: '#fff', 
                padding: '10px 20px', 
                border: 'none', 
                borderRadius: '6px', 
                cursor: 'pointer', 
                fontWeight: '600',
                fontSize: '14px'
              }}
            >
              ➕ Add Animal
            </button>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button onClick={handleExportCSV} style={{ padding: '8px 16px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>📊 CSV</button>
              <button onClick={handleExportExcel} style={{ padding: '8px 16px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>📈 Excel</button>
              <button onClick={handleExportJSON} style={{ padding: '8px 16px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>📄 JSON</button>
              <button onClick={handleImportClick} style={{ padding: '8px 16px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>📥 Import</button>
              <button onClick={handleBatchPrint} style={{ padding: '8px 16px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>🖨️ Print</button>
              <button onClick={() => batchPrintQRTags(sortedAnimals, 'animal')} style={{ padding: '8px 16px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}>📱 Print QR Tags</button>
              <input 
                ref={fileInputRef}
                type="file" 
                accept=".csv,.json" 
                style={{ display: 'none' }} 
                onChange={handleImportFile}
              />
            </div>
          </div>

          {/* Filters */}
          <div className="card" style={{ marginBottom: '20px', padding: '16px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="🔍 Search animals..."
                value={filter}
                onChange={e => setFilter(e.target.value)}
                style={{ flex: '1 1 200px', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db' }}
              />
              <select
                value={filterGroup}
                onChange={e => setFilterGroup(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db' }}
              >
                <option value="all">All Groups</option>
                <option value="ungrouped">Ungrouped</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db' }}
              >
                <option value="all">All Status</option>
                <option value="Active">Active</option>
                <option value="Sold">Sold</option>
                <option value="Deceased">Deceased</option>
              </select>
              <select
                value={filterSex}
                onChange={e => setFilterSex(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db' }}
              >
                <option value="all">All</option>
                <option value="F">Female</option>
                <option value="M">Male</option>
              </select>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db' }}
              >
                <option value="name">Sort by Name</option>
                <option value="tag">Sort by Tag</option>
                <option value="breed">Sort by Breed</option>
                <option value="dob">Sort by DOB</option>
                <option value="weight">Sort by Weight</option>
                <option value="status">Sort by Status</option>
              </select>
            </div>
          </div>

          {/* Animal List */}
          <h3 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '16px', color: 'inherit' }}>Animals ({sortedAnimals.length})</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {sortedAnimals.map(a => {
              const isExp = expandedIds.includes(a.id)
              const preview = (a.photos && a.photos.length) ? a.photos[0].dataUrl : (a.photo || null)
              const groupName = groups.find(g => g.id === a.groupId)?.name || 'No group'
              return (
                <li key={a.id} className="card" style={{ marginBottom: 12, padding: 16 }}>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                    {preview && (
                      <img src={preview} alt={a.name} style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600' }}>
                            {a.name}
                            {a.qrCode && <span style={{ marginLeft: 8, fontSize: '0.8rem', color: '#8b5cf6' }} title="QR Code generated">📱</span>}
                          </h4>
                          <div style={{ fontSize: '0.9rem', color: '#666', marginTop: 4 }}>
                            {a.tag && <span style={{ marginRight: 12 }}>🏷️ {a.tag}</span>}
                            <span style={{ marginRight: 12 }}>{a.sex === 'F' ? '♀' : '♂'} {a.breed}</span>
                            <span>📊 {a.status}</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => startEditAnimal(a)} style={{ padding: '6px 12px', fontSize: '0.85rem' }}>✏️ Edit</button>
                          <button onClick={() => deleteAnimal(a.id)} style={{ padding: '6px 12px', fontSize: '0.85rem', background: '#fee', color: '#c00' }}>🗑️</button>
                        </div>
                      </div>
                      
                      {isExp && (
                        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #e5e7eb', fontSize: '0.9rem' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                            {a.dob && <div><strong>DOB:</strong> {a.dob}</div>}
                            {a.weight && <div><strong>Weight:</strong> {a.weight} kg</div>}
                            {a.color && <div><strong>Color:</strong> {a.color}</div>}
                            {groupName && <div><strong>Group:</strong> {groupName}</div>}
                            {a.sire && <div><strong>Sire:</strong> {a.sire}</div>}
                            {a.dam && <div><strong>Dam:</strong> {a.dam}</div>}
                            {a.owner && <div><strong>Owner:</strong> {a.owner}</div>}
                            {a.registration && <div><strong>Registration:</strong> {a.registration}</div>}
                            {a.tattoo && <div><strong>Tattoo:</strong> {a.tattoo}</div>}
                            {a.purchaseDate && <div><strong>Purchase Date:</strong> {a.purchaseDate}</div>}
                            {a.purchasePrice && <div><strong>Purchase Price:</strong> KSH {Number(a.purchasePrice).toLocaleString()}</div>}
                            {a.vendor && <div><strong>Vendor:</strong> {a.vendor}</div>}
                            {a.pregnancyStatus && a.pregnancyStatus !== 'Not Pregnant' && (
                              <div><strong>Pregnancy:</strong> {a.pregnancyStatus}</div>
                            )}
                            {a.expectedDue && <div><strong>Expected Due:</strong> {a.expectedDue}</div>}
                            {a.parity > 0 && <div><strong>Parity:</strong> {a.parity}</div>}
                            {a.lactationStatus && <div><strong>Lactation:</strong> {a.lactationStatus}</div>}
                          </div>
                          {a.notes && (
                            <div style={{ marginTop: 12, padding: 12, background: '#f9fafb', borderRadius: 6 }}>
                              <strong>Notes:</strong> {a.notes}
                            </div>
                          )}
                          {a.photos && a.photos.length > 1 && (
                            <div style={{ marginTop: 12 }}>
                              <strong>Photos:</strong>
                              <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                                {a.photos.map((p, idx) => (
                                  <img key={p.id || idx} src={p.dataUrl} alt={`${a.name} ${idx+1}`} style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 6 }} />
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Photo Gallery with IndexedDB storage */}
                          <PhotoGallery 
                            entityType="animal" 
                            entityId={a.id} 
                            entityName={a.name}
                          />
                          
                          {/* QR Code Display and Print */}
                          <div style={{ marginTop: 16, padding: 12, background: '#f9fafb', borderRadius: 8, border: '1px solid #e5e7eb' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                              <div>
                                <img 
                                  src={a.qrCode || generateQRCodeDataURL(JSON.stringify({ type: 'animal', id: a.id, name: a.name, tag: a.tag, breed: a.breed }))} 
                                  alt={`QR Code for ${a.name}`}
                                  style={{ width: 120, height: 120, border: '2px solid #8b5cf6', borderRadius: 8 }}
                                />
                              </div>
                              <div style={{ flex: 1 }}>
                                <h4 style={{ margin: '0 0 8px 0', fontSize: '0.95rem', fontWeight: '600', color: '#8b5cf6' }}>
                                  📱 QR Tag {a.qrCode && <span style={{ fontSize: '0.75rem', color: '#10b981', marginLeft: 8 }}>✓ Auto-generated</span>}
                                </h4>
                                <p style={{ margin: '0 0 12px 0', fontSize: '0.85rem', color: '#666' }}>
                                  Scan this QR code to quickly access {a.name}'s records
                                </p>
                                <button 
                                  onClick={() => printQRTag({ type: 'animal', id: a.id, name: a.name, tag: a.tag })}
                                  style={{ 
                                    padding: '8px 16px', 
                                    background: '#8b5cf6', 
                                    color: 'white', 
                                    border: 'none', 
                                    borderRadius: '6px', 
                                    cursor: 'pointer', 
                                    fontSize: '0.85rem',
                                    fontWeight: '500'
                                  }}
                                >
                                  🖨️ Print QR Tag
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <button 
                        onClick={() => setExpandedIds(prev => isExp ? prev.filter(id => id !== a.id) : [...prev, a.id])}
                        style={{ marginTop: 12, padding: '6px 12px', fontSize: '0.85rem', background: '#f3f4f6', border: '1px solid #d1d5db' }}
                      >
                        {isExp ? '▲ Show Less' : '▼ Show More'}
                      </button>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {/* Add/Edit Animal Form */}
      {tab === 'addAnimal' && (
        <div>
          <h3 style={{ fontSize: '1.3rem', fontWeight: '600', marginBottom: '20px', color: 'inherit' }}>
            {editingId ? '✏️ Edit Animal [v2.0]' : '➕ Add New Animal [v2.0]'}
          </h3>
          
          <form onSubmit={saveAnimal} style={{ marginBottom: 16 }} noValidate>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <label>
                Tag
                <input value={form.tag} onChange={e => setForm({ ...form, tag: e.target.value })} />
                {errors.tag && <div style={{ color: 'crimson' }}>{errors.tag}</div>}
              </label>

              <label>
                Name *
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                {errors.name && <div style={{ color: 'crimson' }}>{errors.name}</div>}
              </label>

              <label>
                Breed
                <input value={form.breed} onChange={e => setForm({ ...form, breed: e.target.value })} />
              </label>

              <label>
                Color
                <input value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} />
              </label>

              <label>
                DOB
                <input type="date" value={form.dob} onChange={e => setForm({ ...form, dob: e.target.value })} />
                {errors.dob && <div style={{ color: 'crimson' }}>{errors.dob}</div>}
              </label>

              <label>
                Weight (kg)
                <input type="number" step="0.1" value={form.weight} onChange={e => setForm({ ...form, weight: e.target.value })} />
                {errors.weight && <div style={{ color: 'crimson' }}>{errors.weight}</div>}
              </label>

              <label>
                Sire
                <input value={form.sire} onChange={e => setForm({ ...form, sire: e.target.value })} />
              </label>

              <label>
                Dam
                <input value={form.dam} onChange={e => setForm({ ...form, dam: e.target.value })} />
              </label>

              <label>
                Sex
                <select value={form.sex} onChange={e => setForm({ ...form, sex: e.target.value })}>
                  <option value="F">Female</option>
                  <option value="M">Male</option>
                </select>
              </label>

              <label>
                Status
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                  <option>Active</option>
                  <option>Sold</option>
                  <option>Deceased</option>
                </select>
              </label>

              <label>
                Group
                <select value={form.groupId} onChange={e => setForm({ ...form, groupId: e.target.value })}>
                  <option value="">-- No group --</option>
                  {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </label>

              <label>
                Owner
                <input value={form.owner} onChange={e => setForm({ ...form, owner: e.target.value })} />
              </label>

              <label>
                Registration #
                <input value={form.registration} onChange={e => setForm({ ...form, registration: e.target.value })} />
              </label>

              <label>
                Tattoo / ID
                <input value={form.tattoo} onChange={e => setForm({ ...form, tattoo: e.target.value })} />
              </label>

              <label>
                Purchase date
                <input type="date" value={form.purchaseDate} onChange={e => setForm({ ...form, purchaseDate: e.target.value })} />
                {errors.purchaseDate && <div style={{ color: 'crimson' }}>{errors.purchaseDate}</div>}
              </label>

              <label>
                Purchase price
                <input type="number" step="0.01" value={form.purchasePrice} onChange={e => setForm({ ...form, purchasePrice: e.target.value })} />
                {errors.purchasePrice && <div style={{ color: 'crimson' }}>{errors.purchasePrice}</div>}
              </label>

              <label>
                Vendor
                <input value={form.vendor} onChange={e => setForm({ ...form, vendor: e.target.value })} />
              </label>

              <label>
                Tags (comma separated)
                <input value={typeof form.tags === 'string' ? form.tags : (form.tags || []).join(', ')} onChange={e => setForm({ ...form, tags: e.target.value })} />
              </label>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', marginBottom: 6 }}>Photos (up to 5, each ≤ 2 MB)</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                  <input type="file" accept="image/*" multiple onChange={handleFileInput} />
                  <small style={{ color: '#666' }}>Files will be resized to {MAX_DIM}px and compressed.</small>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {(form.photos || []).map((p, idx) => (
                    <div key={p.id} style={{ width: 120, border: '1px solid #ddd', padding: 6, borderRadius: 6, textAlign: 'center' }}>
                      <img src={p.dataUrl} alt={`preview ${idx+1}`} style={{ width: '100%', height: 72, objectFit: 'cover', borderRadius: 4 }} />
                      <div style={{ fontSize: 12, marginTop: 6 }}>{p.filename || 'photo'}</div>
                      <div style={{ fontSize: 11, color: '#666' }}>{Math.round((p.size||0)/1024)} KB</div>
                      <button type="button" onClick={() => removePhoto(p.id)} aria-label={`Remove photo ${idx+1}`} style={{ marginTop: 6 }}>Remove</button>
                    </div>
                  ))}
                </div>
              </div>
              <label>
                Photo URL
                <input value={form.photo} onChange={e => setForm({ ...form, photo: e.target.value })} />
              </label>

              <label>
                Pregnancy status
                <select value={form.pregnancyStatus} onChange={e => setForm({ ...form, pregnancyStatus: e.target.value })}>
                  <option>Not Pregnant</option>
                  <option>Pregnant</option>
                  <option>Unknown</option>
                  <option>Not Applicable</option>
                </select>
              </label>

              <label>
                Expected due
                <input type="date" value={form.expectedDue} onChange={e => setForm({ ...form, expectedDue: e.target.value })} />
              </label>

              <label>
                Parity
                <input type="number" min="0" value={form.parity} onChange={e => setForm({ ...form, parity: e.target.value })} />
              </label>

              <label>
                Lactation status
                <select value={form.lactationStatus} onChange={e => setForm({ ...form, lactationStatus: e.target.value })}>
                  <option>Lactating</option>
                  <option>Dry</option>
                  <option>NA</option>
                </select>
              </label>

              <label style={{ gridColumn: '1 / -1' }}>
                Notes
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
              </label>
            </div>
            <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
              <button type="submit" style={{ background: 'var(--green)', color: '#fff', padding: '10px 20px', fontWeight: 'bold', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                {editingId ? 'Update Animal' : 'Add Animal'}
              </button>
              <button type="button" onClick={resetForm} style={{ padding: '10px 20px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer' }}>Reset</button>
              {editingId && <button type="button" onClick={() => { resetForm(); setTab('list') }} style={{ padding: '10px 20px', background: '#666', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>}
            </div>
          </form>
        </div>
      )}

      {tab === 'addGroup' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3>🏷️ Animal Groups</h3>
          </div>

          {/* Summary Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 20 }}>
            <div className="card" style={{ padding: 16, background: '#f0fdf4' }}>
              <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Total Groups</div>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#059669' }}>{groups.length}</div>
            </div>
            <div className="card" style={{ padding: 16, background: '#eff6ff' }}>
              <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Total Animals</div>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#2563eb' }}>{animals.length}</div>
            </div>
            <div className="card" style={{ padding: 16, background: '#fef3c7' }}>
              <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Ungrouped</div>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#f59e0b' }}>{animals.filter(a => !a.groupId).length}</div>
            </div>
          </div>

          {/* Add/Edit Form */}
          <div className="card" style={{ padding: 20, marginBottom: 20 }}>
            <h4 style={{ marginTop: 0 }}>{editingGroupId ? 'Edit Group' : 'Add New Group'}</h4>
            <form onSubmit={saveGroup}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
                <div>
                  <label>Group Name *</label>
                  <input placeholder="e.g., Dairy Herd A" value={groupName} onChange={e => setGroupName(e.target.value)} required />
                </div>
                <div>
                  <label>Description</label>
                  <input placeholder="Brief description of the group" value={groupDesc} onChange={e => setGroupDesc(e.target.value)} />
                </div>
              </div>
              <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                <button type="submit">{editingGroupId ? 'Update Group' : 'Create Group'}</button>
                <button type="button" onClick={() => { resetGroupForm() }}>Reset</button>
                {editingGroupId && (
                  <button type="button" onClick={() => { resetGroupForm() }} style={{ marginLeft: 'auto' }}>Cancel Edit</button>
                )}
              </div>
            </form>
          </div>

          {/* Groups List */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: 16, borderBottom: '1px solid #eee', background: '#f9fafb' }}>
              <h4 style={{ margin: 0 }}>Existing Groups ({groups.length})</h4>
            </div>
            {groups.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🏷️</div>
                <h4>No groups yet</h4>
                <p style={{ color: '#666' }}>Create your first group to organize animals</p>
              </div>
            ) : (
              <div style={{ maxHeight: 500, overflowY: 'auto' }}>
                {groups.map(g => {
                  const groupAnimals = animals.filter(a => a.groupId === g.id)
                  const femaleCount = groupAnimals.filter(a => a.sex === 'F').length
                  const maleCount = groupAnimals.filter(a => a.sex === 'M').length
                  
                  return (
                    <div key={g.id} style={{ padding: 16, borderBottom: '1px solid #eee' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                            <h4 style={{ margin: 0 }}>{g.name}</h4>
                            <span className="badge" style={{ background: '#e0f2fe' }}>{groupAnimals.length} animals</span>
                            {femaleCount > 0 && <span className="badge" style={{ background: '#fce7f3' }}>{femaleCount} ♀</span>}
                            {maleCount > 0 && <span className="badge" style={{ background: '#dbeafe' }}>{maleCount} ♂</span>}
                          </div>
                          <p style={{ margin: '4px 0 0 0', color: '#666', fontSize: 14 }}>{g.desc || 'No description'}</p>
                          
                          {groupAnimals.length > 0 && (
                            <div style={{ marginTop: 12, padding: 12, background: '#f9fafb', borderRadius: 6 }}>
                              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Animals in this group:</div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {groupAnimals.slice(0, 10).map(a => (
                                  <span key={a.id} style={{ fontSize: 12, padding: '4px 8px', background: 'white', borderRadius: 4, border: '1px solid #e5e7eb' }}>
                                    {a.name || a.tag || a.id}
                                  </span>
                                ))}
                                {groupAnimals.length > 10 && (
                                  <span style={{ fontSize: 12, padding: '4px 8px', color: '#666' }}>+{groupAnimals.length - 10} more</span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginLeft: 16 }}>
                          <button className="tab-btn" onClick={() => startEditGroup(g)}>✏️ Edit</button>
                          <button className="tab-btn" style={{ color: '#dc2626' }} onClick={() => deleteGroup(g.id)}>🗑️ Delete</button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Ungrouped Animals Warning */}
          {animals.filter(a => !a.groupId).length > 0 && (
            <div className="card" style={{ padding: 16, marginTop: 16, background: '#fef3c7', borderLeft: '4px solid #f59e0b' }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#92400e' }}>⚠️ Ungrouped Animals</h4>
              <p style={{ margin: '0 0 8px 0', color: '#78350f' }}>
                {animals.filter(a => !a.groupId).length} animal(s) are not assigned to any group.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                {animals.filter(a => !a.groupId).map(a => (
                  <span key={a.id} style={{ fontSize: 12, padding: '4px 8px', background: 'white', borderRadius: 4, border: '1px solid #fbbf24' }}>
                    {a.name || a.tag || a.id}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div>
        {tab === 'pastures' && (
          <div style={{ marginBottom: 16 }}>
            <Pastures />
          </div>
        )}

        {tab === 'health' && (
          <div style={{ marginBottom: 16 }}>
            <HealthSystem animals={animals} setAnimals={setAnimals} groups={groups} />
          </div>
        )}

        {tab === 'feeding' && (
          <div style={{ marginBottom: 16 }}>
            <AnimalFeeding animals={animals} />
          </div>
        )}

        {tab === 'measurement' && (
          <div style={{ marginBottom: 16 }}>
            <AnimalMeasurement animals={animals} />
          </div>
        )}

        {tab === 'breeding' && (
          <div style={{ marginBottom: 16 }}>
            <AnimalBreeding animals={animals} />
          </div>
        )}

        {tab === 'milkyield' && (
          <div style={{ marginBottom: 16 }}>
            <AnimalMilkYield animals={animals} />
          </div>
        )}

        {tab === 'treatment' && (
          <div style={{ marginBottom: 16 }}>
            <AnimalTreatment animals={animals} />
          </div>
        )}

        {tab === 'calf' && (
          <div style={{ marginBottom: 16 }}>
            <CalfManagement animals={animals} />
          </div>
        )}

        {tab === 'bsf' && (
          <div style={{ marginBottom: 16 }}>
            <BSFFarming />
          </div>
        )}

        {tab === 'azolla' && (
          <div style={{ marginBottom: 16 }}>
            <AzollaFarming />
          </div>
        )}

        {tab === 'poultry' && (
          <div style={{ marginBottom: 16 }}>
            <PoultryManagement />
          </div>
        )}

        {tab === 'canine' && (
          <div style={{ marginBottom: 16 }}>
            <CanineManagement animals={animals} setAnimals={setAnimals} />
          </div>
        )}
      </div>
    </section>
  )
}
