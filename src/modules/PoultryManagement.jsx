import React, { useState, useEffect } from 'react'
import { loadData, saveData } from '../lib/storage'
import { logAnimalActivity } from '../lib/activityLogger'
import { savePhoto, deletePhoto, getPhotosByEntity } from '../lib/photoAnalysis'
import { exportToCSV, exportToJSON } from '../lib/exportImport'
import { recordExpense, recordIncome } from '../lib/moduleIntegration'
import { NOTIFICATION_TYPES, PRIORITIES } from '../lib/notifications'
import { validatePoultryEggInput, validatePoultryHealthInput, scheduleLivestockReminder } from '../lib/livestockPhase1'

const POULTRY_KEY = 'cattalytics:poultry'
const FLOCK_KEY = 'cattalytics:flocks'
const EGG_KEY = 'cattalytics:egg_production'
const HEALTH_KEY = 'cattalytics:poultry_health'

const POULTRY_TYPES = ['Chicken', 'Duck', 'Turkey', 'Goose', 'Quail', 'Guinea Fowl', 'Pigeon', 'Other']
const CHICKEN_BREEDS = ['Leghorn', 'Rhode Island Red', 'Plymouth Rock', 'Sussex', 'Orpington', 'Brahma', 'Australorp', 'Silkie', 'Wyandotte', 'Cochin', 'Marans', 'Ameraucana', 'Local', 'Mixed', 'Other']
const PURPOSES = ['Layers', 'Broilers', 'Dual Purpose', 'Breeding', 'Show', 'Ornamental']
const HOUSING_TYPES = ['Free Range', 'Cage', 'Deep Litter', 'Battery', 'Barn', 'Aviary', 'Pasture']

export default function PoultryManagement({ initialView = 'flocks', recordSource = null }) {
  const [birds, setBirds] = useState([])
  const [flocks, setFlocks] = useState([])
  const [eggRecords, setEggRecords] = useState([])
  const [healthRecords, setHealthRecords] = useState([])
  const [view, setView] = useState('flocks') // flocks, birds, eggs, health
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [toast, setToast] = useState(null)

  useEffect(() => {
    const allowed = new Set(['flocks', 'birds', 'eggs', 'health'])
    if (allowed.has(initialView) && initialView !== view) {
      setView(initialView)
      setShowForm(false)
    }
  }, [initialView, view])

  const [flockForm, setFlockForm] = useState({
    id: '', name: '', type: 'Chicken', breed: 'Local', purpose: 'Layers',
    quantity: '', housing: 'Deep Litter', acquiredDate: '', cost: '',
    mortality: 0, notes: '', image: ''
  })

  const [birdForm, setBirdForm] = useState({
    id: '', tag: '', flockId: '', type: 'Chicken', breed: 'Local',
    sex: 'Female', hatchDate: '', weight: '', color: '', status: 'Active',
    notes: '', image: ''
  })

  const [eggForm, setEggForm] = useState({
    id: '', flockId: '', date: new Date().toISOString().slice(0, 10),
    collected: '', broken: '', sold: '', used: '', price: '', notes: ''
  })

  const [healthForm, setHealthForm] = useState({
    id: '', flockId: '', date: new Date().toISOString().slice(0, 10),
    type: 'Vaccination', treatment: '', diagnosis: '', medication: '',
    dosage: '', cost: '', veterinarian: '', notes: ''
  })

  const navTabsStyle = {
    display: 'flex',
    gap: '10px',
    marginBottom: '24px',
    flexWrap: 'wrap',
    alignItems: 'center'
  }
  const getNavTabStyle = (isActive) => ({
    padding: '12px 18px',
    background: isActive ? 'linear-gradient(135deg, #0f766e, #2563eb)' : '#f8fafc',
    color: isActive ? '#fff' : '#1f2937',
    border: isActive ? '1px solid transparent' : '1px solid #dbe4ea',
    borderRadius: '999px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '700',
    textTransform: 'capitalize',
    boxShadow: isActive ? '0 12px 24px rgba(37, 99, 235, 0.16)' : 'none'
  })

  useEffect(() => {
    setBirds(loadData(POULTRY_KEY, []))
    setFlocks(loadData(FLOCK_KEY, []))
    setEggRecords(loadData(EGG_KEY, []))
    setHealthRecords(loadData(HEALTH_KEY, []))
  }, [])

  useEffect(() => {
    saveData(POULTRY_KEY, birds)
  }, [birds])

  useEffect(() => {
    saveData(FLOCK_KEY, flocks)
  }, [flocks])

  useEffect(() => {
    saveData(EGG_KEY, eggRecords)
  }, [eggRecords])

  useEffect(() => {
    saveData(HEALTH_KEY, healthRecords)
  }, [healthRecords])

  const showToast = (msg, type = 'info') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleSaveFlock = async () => {
    if (!flockForm.name || !flockForm.quantity) {
      showToast('Name and quantity required', 'error')
      return
    }

    const flockId = editingId || 'FL-' + Date.now()
    let updated

    if (editingId) {
      updated = flocks.map(f => f.id === editingId ? { ...flockForm } : f)
      showToast('Flock updated', 'success')
      logAnimalActivity('Edit', 'Poultry Flock', flockForm.name, `Updated flock ${flockForm.name}`)
    } else {
      const newFlock = { ...flockForm, id: flockId }
      updated = [...flocks, newFlock]
      showToast('Flock added', 'success')
      logAnimalActivity('Create', 'Poultry Flock', flockForm.name, `Added flock ${flockForm.name}`)
    }

    // Sync photo to gallery
    if (flockForm.image && flockForm.image.startsWith('data:image')) {
      try {
        const blob = await fetch(flockForm.image).then(r => r.blob())
        const file = new File([blob], `${flockForm.name}_flock.jpg`, { type: 'image/jpeg' })
        await savePhoto(file, {
          category: 'animals',
          tags: ['poultry', flockForm.type.toLowerCase(), flockForm.breed.toLowerCase(), flockForm.purpose.toLowerCase()],
          entityType: 'poultry',
          entityId: flockId,
          entityName: flockForm.name
        })
      } catch (error) {
        console.error('Error saving flock photo:', error)
      }
    }

    setFlocks(updated)
    setShowForm(false)
    setEditingId(null)
    setFlockForm({ id: '', name: '', type: 'Chicken', breed: 'Local', purpose: 'Layers', quantity: '', housing: 'Deep Litter', acquiredDate: '', cost: '', mortality: 0, notes: '', image: '' })
  }

  const handleDeleteFlock = (id) => {
    const flock = flocks.find(f => f.id === id)
    if (!confirm(`Delete flock ${flock?.name}?`)) return

    setFlocks(flocks.filter(f => f.id !== id))
    setBirds(birds.filter(b => b.flockId !== id))

    // Delete gallery photos
    try {
      const photos = getPhotosByEntity('poultry', id)
      photos.forEach(photo => deletePhoto(photo.id))
    } catch (error) {
      console.error('Error deleting flock photos:', error)
    }

    showToast('Flock deleted', 'success')
    logAnimalActivity('Delete', 'Poultry Flock', flock?.name, `Deleted flock ${flock?.name}`)
  }

  const handleSaveBird = async () => {
    if (!birdForm.tag || !birdForm.flockId) {
      showToast('Bird tag and flock are required', 'error')
      return
    }

    let updated
    const birdId = editingId || `BRD-${Date.now()}`

    if (editingId) {
      updated = birds.map((b) => (b.id === editingId ? { ...birdForm } : b))
      showToast('Bird updated', 'success')
      logAnimalActivity('Edit', 'Poultry Bird', birdForm.tag, `Updated bird ${birdForm.tag}`)
    } else {
      const newBird = { ...birdForm, id: birdId }
      updated = [...birds, newBird]
      showToast('Bird added', 'success')
      logAnimalActivity('Create', 'Poultry Bird', birdForm.tag, `Added bird ${birdForm.tag}`)
    }

    if (birdForm.image && birdForm.image.startsWith('data:image')) {
      try {
        const blob = await fetch(birdForm.image).then((r) => r.blob())
        const file = new File([blob], `${birdForm.tag}_bird.jpg`, { type: 'image/jpeg' })
        await savePhoto(file, {
          category: 'animals',
          tags: ['poultry', birdForm.type.toLowerCase(), birdForm.breed.toLowerCase(), 'bird'],
          entityType: 'poultry-bird',
          entityId: birdId,
          entityName: birdForm.tag
        })
      } catch (error) {
        console.error('Error saving bird photo:', error)
      }
    }

    setBirds(updated)
    setShowForm(false)
    setEditingId(null)
    setBirdForm({
      id: '', tag: '', flockId: '', type: 'Chicken', breed: 'Local',
      sex: 'Female', hatchDate: '', weight: '', color: '', status: 'Active',
      notes: '', image: ''
    })
  }

  const handleDeleteBird = (id) => {
    const bird = birds.find((b) => b.id === id)
    if (!confirm(`Delete bird ${bird?.tag || id}?`)) return

    setBirds(birds.filter((b) => b.id !== id))

    try {
      const photos = getPhotosByEntity('poultry-bird', id)
      photos.forEach((photo) => deletePhoto(photo.id))
    } catch (error) {
      console.error('Error deleting bird photos:', error)
    }

    showToast('Bird deleted', 'success')
  }

  const handleSaveEgg = () => {
    const validation = validatePoultryEggInput({
      flockId: eggForm.flockId,
      collected: eggForm.collected,
      broken: eggForm.broken,
      sold: eggForm.sold,
      used: eggForm.used,
      price: eggForm.price
    })

    if (!validation.valid) {
      showToast(validation.errors[0], 'error')
      return
    }

    let updated
    let recordId = editingId
    if (editingId) {
      updated = eggRecords.map(e => e.id === editingId ? { ...eggForm } : e)
      showToast('Egg record updated', 'success')
    } else {
      const newRecord = { ...eggForm, id: 'EGG-' + Date.now() }
      recordId = newRecord.id
      updated = [...eggRecords, newRecord]
      showToast('Egg record added', 'success')
    }

    setEggRecords(updated)

    const soldCount = parseFloat(eggForm.sold) || 0
    const price = parseFloat(eggForm.price) || 0
    if (soldCount > 0 && price > 0) {
      recordIncome({
        amount: soldCount * price,
        category: 'Egg Sales',
        subcategory: 'Poultry Products',
        description: `Egg sales from flock ${eggForm.flockId}: ${soldCount} eggs`,
        source: 'Poultry Eggs',
        linkedId: recordId || ''
      })
    }

    setShowForm(false)
    setEditingId(null)
    setEggForm({ id: '', flockId: '', date: new Date().toISOString().slice(0, 10), collected: '', broken: '', sold: '', used: '', price: '', notes: '' })
  }

  const handleSaveHealth = () => {
    const validation = validatePoultryHealthInput({
      flockId: healthForm.flockId,
      type: healthForm.type,
      cost: healthForm.cost
    })

    if (!validation.valid) {
      showToast(validation.errors[0], 'error')
      return
    }

    let updated
    let recordId = editingId
    if (editingId) {
      updated = healthRecords.map(h => h.id === editingId ? { ...healthForm } : h)
      showToast('Health record updated', 'success')
    } else {
      const newRecord = { ...healthForm, id: 'PH-' + Date.now() }
      recordId = newRecord.id
      updated = [...healthRecords, newRecord]
      showToast('Health record added', 'success')
    }

    setHealthRecords(updated)

    const healthCost = parseFloat(healthForm.cost) || 0
    if (healthCost > 0) {
      recordExpense({
        amount: healthCost,
        category: 'Veterinary',
        subcategory: healthForm.type,
        description: `Poultry health event for flock ${healthForm.flockId}: ${healthForm.type}`,
        vendor: healthForm.veterinarian || 'Vet Service',
        source: 'Poultry Health',
        linkedId: recordId || ''
      })
    }

    scheduleLivestockReminder({
      type: NOTIFICATION_TYPES.HEALTH,
      title: `Poultry health review: ${healthForm.flockId}`,
      body: `Review flock ${healthForm.flockId} after ${healthForm.type}.`,
      dueDate: new Date(new Date(healthForm.date || new Date().toISOString()).getTime() + (72 * 60 * 60 * 1000)).toISOString(),
      entityId: healthForm.flockId,
      entityType: 'poultry-health',
      priority: PRIORITIES.MEDIUM
    })

    setShowForm(false)
    setEditingId(null)
    setHealthForm({ id: '', flockId: '', date: new Date().toISOString().slice(0, 10), type: 'Vaccination', treatment: '', diagnosis: '', medication: '', dosage: '', cost: '', veterinarian: '', notes: '' })
  }

  const handleImageUpload = (e, formSetter) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      formSetter(prev => ({ ...prev, image: event.target.result }))
    }
    reader.readAsDataURL(file)
  }

  const filteredFlocks = flocks.filter(f =>
    f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.breed.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const stats = {
    totalFlocks: flocks.length,
    totalBirds: flocks.reduce((sum, f) => sum + (Number(f.quantity) || 0) - (Number(f.mortality) || 0), 0),
    totalEggsToday: eggRecords.filter(e => e.date === new Date().toISOString().slice(0, 10)).reduce((sum, e) => sum + (Number(e.collected) || 0), 0),
    totalEggsWeek: eggRecords.filter(e => {
      const diff = new Date() - new Date(e.date)
      return diff < 7 * 24 * 60 * 60 * 1000
    }).reduce((sum, e) => sum + (Number(e.collected) || 0), 0)
  }

  const poultryPremiumStyles = `
    .poultry-premium {
      --poultry-ink: #0f172a;
      --poultry-subtle: #475569;
      font-family: "DM Sans", "Segoe UI", sans-serif;
      max-width: 1480px;
      margin: 0 auto;
      border-radius: 24px;
      border: 1px solid #dbeafe;
      background:
        radial-gradient(circle at 0 0, rgba(245, 158, 11, 0.14) 0, transparent 40%),
        radial-gradient(circle at 100% 18%, rgba(14, 165, 233, 0.14) 0, transparent 42%),
        linear-gradient(145deg, #fffbeb, #eff6ff);
      box-shadow: 0 24px 60px rgba(15, 23, 42, 0.08);
      animation: poultryFadeIn 0.55s ease-out;
    }
    @keyframes poultryFadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes poultryRise {
      from { opacity: 0; transform: translateY(10px) scale(0.986); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    .poultry-premium h1,
    .poultry-premium h2,
    .poultry-premium h3,
    .poultry-premium h4 {
      color: var(--poultry-ink);
      letter-spacing: -0.02em;
      font-family: "Chivo", "DM Sans", sans-serif;
    }
    .poultry-premium p,
    .poultry-premium label,
    .poultry-premium small {
      color: var(--poultry-subtle);
    }
    .poultry-premium input,
    .poultry-premium select,
    .poultry-premium textarea {
      border-radius: 12px;
      border: 1px solid #cbd5e1;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }
    .poultry-premium input:focus,
    .poultry-premium select:focus,
    .poultry-premium textarea:focus {
      outline: none;
      border-color: #0ea5e9;
      box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.16);
    }
    .poultry-premium .poultry-hero {
      position: relative;
      overflow: hidden;
    }
    .poultry-premium .poultry-hero::after {
      content: "";
      position: absolute;
      width: 170px;
      height: 170px;
      border-radius: 999px;
      top: -58px;
      right: -46px;
      background: radial-gradient(circle at center, rgba(251, 191, 36, 0.22), rgba(251, 191, 36, 0));
      pointer-events: none;
    }
    .poultry-premium .poultry-stat-grid > div {
      border: 1px solid #dbeafe;
      box-shadow: 0 10px 28px rgba(15, 23, 42, 0.08);
      animation: poultryRise 0.52s ease both;
    }
    .poultry-premium .poultry-stat-grid > div:nth-child(2) { animation-delay: 0.05s; }
    .poultry-premium .poultry-stat-grid > div:nth-child(3) { animation-delay: 0.1s; }
    .poultry-premium .poultry-stat-grid > div:nth-child(4) { animation-delay: 0.15s; }
    .poultry-premium button {
      min-height: 44px;
      touch-action: manipulation;
      transition: transform 0.16s ease, box-shadow 0.16s ease;
    }
    .poultry-premium button:hover {
      transform: translateY(-1px);
      box-shadow: 0 8px 20px rgba(15, 23, 42, 0.14);
    }
    @media (max-width: 768px) {
      .poultry-premium {
        padding: 14px !important;
        border-radius: 16px;
      }
      .poultry-premium .poultry-hero {
        padding: 14px !important;
      }
      .poultry-premium .poultry-stat-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        gap: 10px !important;
      }
      .poultry-premium input,
      .poultry-premium select,
      .poultry-premium textarea,
      .poultry-premium button {
        font-size: 16px;
      }
      .poultry-premium input,
      .poultry-premium select,
      .poultry-premium textarea {
        min-height: 42px;
      }
    }
    @media (max-width: 520px) {
      .poultry-premium .poultry-stat-grid {
        grid-template-columns: 1fr !important;
      }
    }
  `

  return (
    <div className="poultry-premium" style={{ padding: '20px' }}>
      <style>{poultryPremiumStyles}</style>
      <div className="poultry-hero" style={{ marginBottom: '24px', border: '1px solid var(--border-primary)', borderRadius: '18px', padding: '18px 20px', background: 'var(--bg-elevated)' }}>
        <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: 'bold' }}>
          🐔 Poultry Management
        </h2>
        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>
          Manage flocks, track egg production, and monitor poultry health
        </p>
        {recordSource?.domain && recordSource?.item && (
          <div style={{ marginTop: '10px', fontSize: '12px', fontWeight: 700, color: 'var(--action-success)', background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: '999px', display: 'inline-flex', padding: '4px 10px' }}>
            Opened from Record Coverage: {recordSource.domain} / {recordSource.item}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="poultry-stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: 'var(--bg-elevated)', padding: '16px', borderRadius: '8px', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Total Flocks</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--action-primary)' }}>{stats.totalFlocks}</div>
        </div>
        <div style={{ background: 'var(--bg-elevated)', padding: '16px', borderRadius: '8px', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Live Birds</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--action-success)' }}>{stats.totalBirds}</div>
        </div>
        <div style={{ background: 'var(--bg-elevated)', padding: '16px', borderRadius: '8px', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Eggs Today</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--action-warning)' }}>{stats.totalEggsToday}</div>
        </div>
        <div style={{ background: 'var(--bg-elevated)', padding: '16px', borderRadius: '8px', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Eggs This Week</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--action-primary)' }}>{stats.totalEggsWeek}</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={navTabsStyle}>
        {['flocks', 'birds', 'eggs', 'health'].map(tab => (
          <button
            key={tab}
            onClick={() => { setView(tab); setShowForm(false); setEditingId(null) }}
            style={getNavTabStyle(view === tab)}
          >
            {tab}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button
          onClick={() => exportToJSON(view === 'flocks' ? flocks : view === 'birds' ? birds : view === 'eggs' ? eggRecords : healthRecords, `poultry_${view}_${new Date().toISOString().slice(0, 10)}.json`)}
          style={{
            padding: '10px 20px',
            background: 'var(--action-success)',
            color: 'var(--text-inverse)',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600'
          }}
        >
          📥 Export
        </button>
      </div>

      {/* Flocks View */}
      {view === 'flocks' && !showForm && (
        <div>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
            <input
              type="text"
              placeholder="Search flocks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                flex: 1,
                padding: '10px 16px',
                border: '1px solid var(--border-secondary)',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
            <button
              onClick={() => { setShowForm(true); setEditingId(null); setFlockForm({ id: '', name: '', type: 'Chicken', breed: 'Local', purpose: 'Layers', quantity: '', housing: 'Deep Litter', acquiredDate: '', cost: '', mortality: 0, notes: '', image: '' }) }}
              style={{
                padding: '10px 20px',
                background: 'var(--action-success)',
                color: 'var(--text-inverse)',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              ➕ Add Flock
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {filteredFlocks.map(flock => (
              <div key={flock.id} style={{ background: 'var(--bg-elevated)', padding: '16px', borderRadius: '8px', boxShadow: 'var(--shadow-sm)' }}>
                {flock.image && (
                  <img src={flock.image} alt={flock.name} style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '6px', marginBottom: '12px' }} />
                )}
                <h3 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>{flock.name}</h3>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                  <div><strong>{flock.type}</strong> • {flock.breed} • {flock.purpose}</div>
                  <div style={{ marginTop: '4px' }}>
                    <strong>Live:</strong> {(Number(flock.quantity) || 0) - (Number(flock.mortality) || 0)} birds
                    {flock.mortality > 0 && <span style={{ color: 'var(--action-danger)', marginLeft: '8px' }}>({flock.mortality} lost)</span>}
                  </div>
                  <div><strong>Housing:</strong> {flock.housing}</div>
                  {flock.acquiredDate && <div><strong>Acquired:</strong> {flock.acquiredDate}</div>}
                </div>
                {flock.notes && (
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px', fontStyle: 'italic' }}>
                    {flock.notes}
                  </div>
                )}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => { setFlockForm(flock); setEditingId(flock.id); setShowForm(true) }}
                    style={{ flex: 1, padding: '8px', background: 'var(--action-primary)', color: 'var(--text-inverse)', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => handleDeleteFlock(flock.id)}
                    style={{ flex: 1, padding: '8px', background: 'var(--action-danger)', color: 'var(--text-inverse)', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredFlocks.length === 0 && (
            <div style={{ background: 'var(--bg-elevated)', padding: '60px 20px', borderRadius: '8px', textAlign: 'center', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>🐔</div>
              <div style={{ fontSize: '18px', color: 'var(--text-primary)', marginBottom: '8px' }}>No flocks found</div>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Add your first flock to get started</div>
            </div>
          )}
        </div>
      )}

      {/* Flock Form */}
      {view === 'flocks' && showForm && (
        <div style={{ background: 'var(--bg-elevated)', padding: '24px', borderRadius: '8px', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ margin: '0 0 16px 0' }}>{editingId ? 'Edit Flock' : 'Add New Flock'}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600' }}>Flock Name *</label>
              <input
                type="text"
                value={flockForm.name}
                onChange={(e) => setFlockForm({ ...flockForm, name: e.target.value })}
                style={{ width: '100%', padding: '10px', border: '1px solid var(--border-secondary)', borderRadius: '6px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600' }}>Type</label>
              <select
                value={flockForm.type}
                onChange={(e) => setFlockForm({ ...flockForm, type: e.target.value })}
                style={{ width: '100%', padding: '10px', border: '1px solid var(--border-secondary)', borderRadius: '6px' }}
              >
                {POULTRY_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600' }}>Breed</label>
              <select
                value={flockForm.breed}
                onChange={(e) => setFlockForm({ ...flockForm, breed: e.target.value })}
                style={{ width: '100%', padding: '10px', border: '1px solid var(--border-secondary)', borderRadius: '6px' }}
              >
                {CHICKEN_BREEDS.map(breed => <option key={breed} value={breed}>{breed}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600' }}>Purpose</label>
              <select
                value={flockForm.purpose}
                onChange={(e) => setFlockForm({ ...flockForm, purpose: e.target.value })}
                style={{ width: '100%', padding: '10px', border: '1px solid var(--border-secondary)', borderRadius: '6px' }}
              >
                {PURPOSES.map(purpose => <option key={purpose} value={purpose}>{purpose}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600' }}>Quantity *</label>
              <input
                type="number"
                value={flockForm.quantity}
                onChange={(e) => setFlockForm({ ...flockForm, quantity: e.target.value })}
                style={{ width: '100%', padding: '10px', border: '1px solid var(--border-secondary)', borderRadius: '6px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600' }}>Mortality</label>
              <input
                type="number"
                value={flockForm.mortality}
                onChange={(e) => setFlockForm({ ...flockForm, mortality: e.target.value })}
                style={{ width: '100%', padding: '10px', border: '1px solid var(--border-secondary)', borderRadius: '6px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600' }}>Housing</label>
              <select
                value={flockForm.housing}
                onChange={(e) => setFlockForm({ ...flockForm, housing: e.target.value })}
                style={{ width: '100%', padding: '10px', border: '1px solid var(--border-secondary)', borderRadius: '6px' }}
              >
                {HOUSING_TYPES.map(housing => <option key={housing} value={housing}>{housing}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600' }}>Acquired Date</label>
              <input
                type="date"
                value={flockForm.acquiredDate}
                onChange={(e) => setFlockForm({ ...flockForm, acquiredDate: e.target.value })}
                style={{ width: '100%', padding: '10px', border: '1px solid var(--border-secondary)', borderRadius: '6px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600' }}>Cost</label>
              <input
                type="number"
                value={flockForm.cost}
                onChange={(e) => setFlockForm({ ...flockForm, cost: e.target.value })}
                style={{ width: '100%', padding: '10px', border: '1px solid var(--border-secondary)', borderRadius: '6px' }}
              />
            </div>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600' }}>Notes</label>
            <textarea
              value={flockForm.notes}
              onChange={(e) => setFlockForm({ ...flockForm, notes: e.target.value })}
              rows={3}
              style={{ width: '100%', padding: '10px', border: '1px solid var(--border-secondary)', borderRadius: '6px' }}
            />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600' }}>Photo</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload(e, setFlockForm)}
              style={{ width: '100%', padding: '10px', border: '1px solid var(--border-secondary)', borderRadius: '6px' }}
            />
            {flockForm.image && (
              <img src={flockForm.image} alt="Preview" style={{ width: '200px', height: '150px', objectFit: 'cover', borderRadius: '6px', marginTop: '12px' }} />
            )}
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handleSaveFlock}
              style={{ flex: 1, padding: '12px', background: 'var(--action-success)', color: 'var(--text-inverse)', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}
            >
              💾 Save Flock
            </button>
            <button
              onClick={() => { setShowForm(false); setEditingId(null) }}
              style={{ flex: 1, padding: '12px', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Birds View */}
      {view === 'birds' && !showForm && (
        <div>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Search birds by tag, breed, color..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                flex: 1,
                minWidth: 220,
                padding: '10px 16px',
                border: '1px solid var(--border-secondary)',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
            <button
              onClick={() => {
                setShowForm(true)
                setEditingId(null)
                setBirdForm({ id: '', tag: '', flockId: '', type: 'Chicken', breed: 'Local', sex: 'Female', hatchDate: '', weight: '', color: '', status: 'Active', notes: '', image: '' })
              }}
              style={{
                padding: '10px 20px',
                background: 'var(--action-success)',
                color: 'var(--text-inverse)',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              ➕ Add Bird
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {birds
              .filter((bird) => {
                const q = searchTerm.toLowerCase()
                return !q ||
                  (bird.tag || '').toLowerCase().includes(q) ||
                  (bird.breed || '').toLowerCase().includes(q) ||
                  (bird.color || '').toLowerCase().includes(q)
              })
              .map((bird) => {
                const flock = flocks.find((f) => f.id === bird.flockId)
                return (
                  <div key={bird.id} style={{ background: 'var(--bg-elevated)', padding: '16px', borderRadius: '8px', boxShadow: 'var(--shadow-sm)' }}>
                    {bird.image && (
                      <img src={bird.image} alt={bird.tag} style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '6px', marginBottom: '10px' }} />
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <h3 style={{ margin: 0, fontSize: 18 }}>{bird.tag}</h3>
                      <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 999, background: bird.status === 'Active' ? 'var(--bg-secondary)' : 'var(--bg-tertiary)', color: bird.status === 'Active' ? 'var(--action-success)' : 'var(--text-secondary)', fontWeight: 700 }}>{bird.status}</span>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      <div><strong>Flock:</strong> {flock?.name || 'Unknown'}</div>
                      <div><strong>Type:</strong> {bird.type} • {bird.breed}</div>
                      <div><strong>Sex:</strong> {bird.sex} • <strong>Weight:</strong> {bird.weight || 'N/A'} kg</div>
                      {bird.hatchDate && <div><strong>Hatched:</strong> {bird.hatchDate}</div>}
                      {bird.color && <div><strong>Color:</strong> {bird.color}</div>}
                    </div>
                    {bird.notes && <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-secondary)' }}>{bird.notes}</div>}
                    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                      <button
                        onClick={() => { setBirdForm(bird); setEditingId(bird.id); setShowForm(true) }}
                        style={{ flex: 1, padding: '8px', background: 'var(--action-primary)', color: 'var(--text-inverse)', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDeleteBird(bird.id)}
                        style={{ flex: 1, padding: '8px', background: 'var(--action-danger)', color: 'var(--text-inverse)', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                )
              })}
          </div>

          {birds.length === 0 && (
            <div style={{ background: 'var(--bg-elevated)', padding: '60px 20px', borderRadius: '8px', textAlign: 'center', boxShadow: 'var(--shadow-sm)', marginTop: '16px' }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>🐤</div>
              <div style={{ fontSize: '18px', color: 'var(--text-primary)', marginBottom: '8px' }}>No birds registered</div>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Add bird-level records for complete registry coverage</div>
            </div>
          )}
        </div>
      )}

      {/* Bird Form */}
      {view === 'birds' && showForm && (
        <div style={{ background: 'var(--bg-elevated)', padding: '24px', borderRadius: '8px', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ margin: '0 0 16px 0' }}>{editingId ? 'Edit Bird' : 'Add Bird'}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600' }}>Bird Tag *</label>
              <input type="text" value={birdForm.tag} onChange={(e) => setBirdForm({ ...birdForm, tag: e.target.value })} style={{ width: '100%', padding: '10px', border: '1px solid var(--border-secondary)', borderRadius: '6px' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600' }}>Flock *</label>
              <select value={birdForm.flockId} onChange={(e) => setBirdForm({ ...birdForm, flockId: e.target.value })} style={{ width: '100%', padding: '10px', border: '1px solid var(--border-secondary)', borderRadius: '6px' }}>
                <option value="">Select Flock</option>
                {flocks.map((flock) => <option key={flock.id} value={flock.id}>{flock.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600' }}>Type</label>
              <select value={birdForm.type} onChange={(e) => setBirdForm({ ...birdForm, type: e.target.value })} style={{ width: '100%', padding: '10px', border: '1px solid var(--border-secondary)', borderRadius: '6px' }}>
                {POULTRY_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600' }}>Breed</label>
              <select value={birdForm.breed} onChange={(e) => setBirdForm({ ...birdForm, breed: e.target.value })} style={{ width: '100%', padding: '10px', border: '1px solid var(--border-secondary)', borderRadius: '6px' }}>
                {CHICKEN_BREEDS.map((breed) => <option key={breed} value={breed}>{breed}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600' }}>Sex</label>
              <select value={birdForm.sex} onChange={(e) => setBirdForm({ ...birdForm, sex: e.target.value })} style={{ width: '100%', padding: '10px', border: '1px solid var(--border-secondary)', borderRadius: '6px' }}>
                <option value="Female">Female</option>
                <option value="Male">Male</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600' }}>Hatch Date</label>
              <input type="date" value={birdForm.hatchDate} onChange={(e) => setBirdForm({ ...birdForm, hatchDate: e.target.value })} style={{ width: '100%', padding: '10px', border: '1px solid var(--border-secondary)', borderRadius: '6px' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600' }}>Weight (kg)</label>
              <input type="number" value={birdForm.weight} onChange={(e) => setBirdForm({ ...birdForm, weight: e.target.value })} style={{ width: '100%', padding: '10px', border: '1px solid var(--border-secondary)', borderRadius: '6px' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600' }}>Color</label>
              <input type="text" value={birdForm.color} onChange={(e) => setBirdForm({ ...birdForm, color: e.target.value })} style={{ width: '100%', padding: '10px', border: '1px solid var(--border-secondary)', borderRadius: '6px' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600' }}>Status</label>
              <select value={birdForm.status} onChange={(e) => setBirdForm({ ...birdForm, status: e.target.value })} style={{ width: '100%', padding: '10px', border: '1px solid var(--border-secondary)', borderRadius: '6px' }}>
                <option value="Active">Active</option>
                <option value="Sold">Sold</option>
                <option value="Dead">Dead</option>
                <option value="Culled">Culled</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600' }}>Notes</label>
            <textarea value={birdForm.notes} onChange={(e) => setBirdForm({ ...birdForm, notes: e.target.value })} rows={2} style={{ width: '100%', padding: '10px', border: '1px solid var(--border-secondary)', borderRadius: '6px' }} />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600' }}>Photo</label>
            <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, setBirdForm)} style={{ width: '100%', padding: '10px', border: '1px solid var(--border-secondary)', borderRadius: '6px' }} />
            {birdForm.image && <img src={birdForm.image} alt="Bird preview" style={{ width: '180px', height: '130px', objectFit: 'cover', borderRadius: '6px', marginTop: '12px' }} />}
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={handleSaveBird} style={{ flex: 1, padding: '12px', background: 'var(--action-success)', color: 'var(--text-inverse)', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
              💾 Save Bird
            </button>
            <button onClick={() => { setShowForm(false); setEditingId(null) }} style={{ flex: 1, padding: '12px', background: 'var(--bg-tertiary)', color: 'var(--text-inverse)', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Egg Production View */}
      {view === 'eggs' && !showForm && (
        <div>
          {flocks.length === 0 && (
            <div style={{ marginBottom: '16px', padding: '12px 14px', borderRadius: 8, border: '1px solid #f59e0b', background: '#fffbeb', color: '#92400e', fontSize: 13 }}>
              Add at least one flock before recording eggs.
              <button onClick={() => setView('flocks')} style={{ marginLeft: 10, padding: '5px 10px', border: 'none', borderRadius: 6, background: '#f59e0b', color: '#fff', fontWeight: 700 }}>
                Open Flocks
              </button>
            </div>
          )}
          <button
            onClick={() => { setShowForm(true); setEditingId(null); setEggForm({ id: '', flockId: '', date: new Date().toISOString().slice(0, 10), collected: '', broken: '', sold: '', used: '', price: '', notes: '' }) }}
            disabled={flocks.length === 0}
            style={{ marginBottom: '16px', padding: '10px 20px', background: 'var(--action-success)', color: 'var(--text-inverse)', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}
          >
            ➕ Record Eggs
          </button>

          <div style={{ background: 'var(--bg-elevated)', borderRadius: '8px', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-tertiary)', borderBottom: '2px solid var(--border-primary)' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600' }}>Date</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600' }}>Flock</th>
                  <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', fontWeight: '600' }}>Collected</th>
                  <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', fontWeight: '600' }}>Broken</th>
                  <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', fontWeight: '600' }}>Sold</th>
                  <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', fontWeight: '600' }}>Used</th>
                  <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', fontWeight: '600' }}>Revenue</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontSize: '13px', fontWeight: '600' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {eggRecords.sort((a, b) => new Date(b.date) - new Date(a.date)).map(record => {
                  const flock = flocks.find(f => f.id === record.flockId)
                  return (
                    <tr key={record.id} style={{ borderBottom: '1px solid var(--border-primary)' }}>
                      <td style={{ padding: '12px', fontSize: '13px' }}>{record.date}</td>
                      <td style={{ padding: '12px', fontSize: '13px' }}>{flock?.name || 'Unknown'}</td>
                      <td style={{ padding: '12px', fontSize: '13px', textAlign: 'right' }}>{record.collected}</td>
                      <td style={{ padding: '12px', fontSize: '13px', textAlign: 'right', color: 'var(--action-danger)' }}>{record.broken || 0}</td>
                      <td style={{ padding: '12px', fontSize: '13px', textAlign: 'right' }}>{record.sold || 0}</td>
                      <td style={{ padding: '12px', fontSize: '13px', textAlign: 'right' }}>{record.used || 0}</td>
                      <td style={{ padding: '12px', fontSize: '13px', textAlign: 'right', fontWeight: '600', color: '#059669' }}>
                        {record.price ? `KES ${(Number(record.sold || 0) * Number(record.price)).toLocaleString()}` : '-'}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <button
                          onClick={() => { setEggForm(record); setEditingId(record.id); setShowForm(true) }}
                          style={{ padding: '6px 12px', background: 'var(--action-primary)', color: 'var(--text-inverse)', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', marginRight: '6px' }}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => { if (confirm('Delete this record?')) setEggRecords(eggRecords.filter(e => e.id !== record.id)) }}
                          style={{ padding: '6px 12px', background: 'var(--action-danger)', color: 'var(--text-inverse)', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {eggRecords.length === 0 && (
            <div style={{ background: 'var(--bg-elevated)', padding: '60px 20px', borderRadius: '8px', textAlign: 'center', boxShadow: 'var(--shadow-sm)', marginTop: '16px' }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>🥚</div>
              <div style={{ fontSize: '18px', color: 'var(--text-primary)', marginBottom: '8px' }}>No egg records</div>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Start recording daily egg production</div>
            </div>
          )}
        </div>
      )}

      {/* Egg Form */}
      {view === 'eggs' && showForm && (
        <div style={{ background: 'var(--bg-elevated)', padding: '24px', borderRadius: '8px', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ margin: '0 0 16px 0' }}>{editingId ? 'Edit Egg Record' : 'Record Egg Production'}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600' }}>Flock *</label>
              <select
                value={eggForm.flockId}
                onChange={(e) => setEggForm({ ...eggForm, flockId: e.target.value })}
                style={{ width: '100%', padding: '10px', border: '1px solid var(--border-secondary)', borderRadius: '6px' }}
              >
                <option value="">Select Flock</option>
                {flocks.map(flock => <option key={flock.id} value={flock.id}>{flock.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600' }}>Date *</label>
              <input
                type="date"
                value={eggForm.date}
                onChange={(e) => setEggForm({ ...eggForm, date: e.target.value })}
                style={{ width: '100%', padding: '10px', border: '1px solid var(--border-secondary)', borderRadius: '6px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600' }}>Collected *</label>
              <input
                type="number"
                value={eggForm.collected}
                onChange={(e) => setEggForm({ ...eggForm, collected: e.target.value })}
                style={{ width: '100%', padding: '10px', border: '1px solid var(--border-secondary)', borderRadius: '6px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600' }}>Broken</label>
              <input
                type="number"
                value={eggForm.broken}
                onChange={(e) => setEggForm({ ...eggForm, broken: e.target.value })}
                style={{ width: '100%', padding: '10px', border: '1px solid var(--border-secondary)', borderRadius: '6px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600' }}>Sold</label>
              <input
                type="number"
                value={eggForm.sold}
                onChange={(e) => setEggForm({ ...eggForm, sold: e.target.value })}
                style={{ width: '100%', padding: '10px', border: '1px solid var(--border-secondary)', borderRadius: '6px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600' }}>Used</label>
              <input
                type="number"
                value={eggForm.used}
                onChange={(e) => setEggForm({ ...eggForm, used: e.target.value })}
                style={{ width: '100%', padding: '10px', border: '1px solid var(--border-secondary)', borderRadius: '6px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600' }}>Price per Egg (KES)</label>
              <input
                type="number"
                value={eggForm.price}
                onChange={(e) => setEggForm({ ...eggForm, price: e.target.value })}
                style={{ width: '100%', padding: '10px', border: '1px solid var(--border-secondary)', borderRadius: '6px' }}
              />
            </div>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600' }}>Notes</label>
            <textarea
              value={eggForm.notes}
              onChange={(e) => setEggForm({ ...eggForm, notes: e.target.value })}
              rows={2}
              style={{ width: '100%', padding: '10px', border: '1px solid var(--border-secondary)', borderRadius: '6px' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handleSaveEgg}
              style={{ flex: 1, padding: '12px', background: 'var(--action-success)', color: 'var(--text-inverse)', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}
            >
              💾 Save Record
            </button>
            <button
              onClick={() => { setShowForm(false); setEditingId(null) }}
              style={{ flex: 1, padding: '12px', background: 'var(--bg-tertiary)', color: 'var(--text-inverse)', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Health View */}
      {view === 'health' && !showForm && (
        <div>
          {flocks.length === 0 && (
            <div style={{ marginBottom: '16px', padding: '12px 14px', borderRadius: 8, border: '1px solid #f59e0b', background: '#fffbeb', color: '#92400e', fontSize: 13 }}>
              Add at least one flock before recording health events.
              <button onClick={() => setView('flocks')} style={{ marginLeft: 10, padding: '5px 10px', border: 'none', borderRadius: 6, background: '#f59e0b', color: '#fff', fontWeight: 700 }}>
                Open Flocks
              </button>
            </div>
          )}
          <button
            onClick={() => { setShowForm(true); setEditingId(null); setHealthForm({ id: '', flockId: '', date: new Date().toISOString().slice(0, 10), type: 'Vaccination', treatment: '', diagnosis: '', medication: '', dosage: '', cost: '', veterinarian: '', notes: '' }) }}
            disabled={flocks.length === 0}
            style={{ marginBottom: '16px', padding: '10px 20px', background: 'var(--action-success)', color: 'var(--text-inverse)', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}
          >
            ➕ Add Health Record
          </button>

          <div style={{ display: 'grid', gap: '16px' }}>
            {healthRecords.sort((a, b) => new Date(b.date) - new Date(a.date)).map(record => {
              const flock = flocks.find(f => f.id === record.flockId)
              return (
                <div key={record.id} style={{ background: 'var(--bg-elevated)', padding: '16px', borderRadius: '8px', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                    <div>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '16px' }}>{flock?.name || 'Unknown Flock'}</h4>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{record.date} • {record.type}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => { setHealthForm(record); setEditingId(record.id); setShowForm(true) }}
                        style={{ padding: '6px 12px', background: 'var(--action-primary)', color: 'var(--text-inverse)', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => { if (confirm('Delete this record?')) setHealthRecords(healthRecords.filter(h => h.id !== record.id)) }}
                        style={{ padding: '6px 12px', background: 'var(--action-danger)', color: 'var(--text-inverse)', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  <div style={{ fontSize: '13px', lineHeight: '1.6' }}>
                    {record.diagnosis && <div><strong>Diagnosis:</strong> {record.diagnosis}</div>}
                    {record.treatment && <div><strong>Treatment:</strong> {record.treatment}</div>}
                    {record.medication && <div><strong>Medication:</strong> {record.medication} {record.dosage && `(${record.dosage})`}</div>}
                    {record.veterinarian && <div><strong>Vet:</strong> {record.veterinarian}</div>}
                    {record.cost && <div><strong>Cost:</strong> KES {Number(record.cost).toLocaleString()}</div>}
                    {record.notes && <div style={{ marginTop: '8px', fontStyle: 'italic', color: 'var(--text-secondary)' }}>{record.notes}</div>}
                  </div>
                </div>
              )
            })}
          </div>

          {healthRecords.length === 0 && (
            <div style={{ background: 'var(--bg-elevated)', padding: '60px 20px', borderRadius: '8px', textAlign: 'center', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>🏥</div>
              <div style={{ fontSize: '18px', color: 'var(--text-primary)', marginBottom: '8px' }}>No health records</div>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Track vaccinations, treatments, and health events</div>
            </div>
          )}
        </div>
      )}

      {/* Health Form */}
      {view === 'health' && showForm && (
        <div style={{ background: 'var(--bg-elevated)', padding: '24px', borderRadius: '8px', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ margin: '0 0 16px 0' }}>{editingId ? 'Edit Health Record' : 'Add Health Record'}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600' }}>Flock *</label>
              <select
                value={healthForm.flockId}
                onChange={(e) => setHealthForm({ ...healthForm, flockId: e.target.value })}
                style={{ width: '100%', padding: '10px', border: '1px solid var(--border-secondary)', borderRadius: '6px' }}
              >
                <option value="">Select Flock</option>
                {flocks.map(flock => <option key={flock.id} value={flock.id}>{flock.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600' }}>Date *</label>
              <input
                type="date"
                value={healthForm.date}
                onChange={(e) => setHealthForm({ ...healthForm, date: e.target.value })}
                style={{ width: '100%', padding: '10px', border: '1px solid var(--border-secondary)', borderRadius: '6px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600' }}>Type *</label>
              <select
                value={healthForm.type}
                onChange={(e) => setHealthForm({ ...healthForm, type: e.target.value })}
                style={{ width: '100%', padding: '10px', border: '1px solid var(--border-secondary)', borderRadius: '6px' }}
              >
                <option>Vaccination</option>
                <option>Treatment</option>
                <option>Deworming</option>
                <option>Checkup</option>
                <option>Illness</option>
                <option>Injury</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600' }}>Diagnosis</label>
              <input
                type="text"
                value={healthForm.diagnosis}
                onChange={(e) => setHealthForm({ ...healthForm, diagnosis: e.target.value })}
                style={{ width: '100%', padding: '10px', border: '1px solid var(--border-secondary)', borderRadius: '6px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600' }}>Treatment</label>
              <input
                type="text"
                value={healthForm.treatment}
                onChange={(e) => setHealthForm({ ...healthForm, treatment: e.target.value })}
                style={{ width: '100%', padding: '10px', border: '1px solid var(--border-secondary)', borderRadius: '6px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600' }}>Medication</label>
              <input
                type="text"
                value={healthForm.medication}
                onChange={(e) => setHealthForm({ ...healthForm, medication: e.target.value })}
                style={{ width: '100%', padding: '10px', border: '1px solid var(--border-secondary)', borderRadius: '6px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600' }}>Dosage</label>
              <input
                type="text"
                value={healthForm.dosage}
                onChange={(e) => setHealthForm({ ...healthForm, dosage: e.target.value })}
                style={{ width: '100%', padding: '10px', border: '1px solid var(--border-secondary)', borderRadius: '6px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600' }}>Veterinarian</label>
              <input
                type="text"
                value={healthForm.veterinarian}
                onChange={(e) => setHealthForm({ ...healthForm, veterinarian: e.target.value })}
                style={{ width: '100%', padding: '10px', border: '1px solid var(--border-secondary)', borderRadius: '6px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600' }}>Cost (KES)</label>
              <input
                type="number"
                value={healthForm.cost}
                onChange={(e) => setHealthForm({ ...healthForm, cost: e.target.value })}
                style={{ width: '100%', padding: '10px', border: '1px solid var(--border-secondary)', borderRadius: '6px' }}
              />
            </div>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600' }}>Notes</label>
            <textarea
              value={healthForm.notes}
              onChange={(e) => setHealthForm({ ...healthForm, notes: e.target.value })}
              rows={3}
              style={{ width: '100%', padding: '10px', border: '1px solid var(--border-secondary)', borderRadius: '6px' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handleSaveHealth}
              style={{ flex: 1, padding: '12px', background: 'var(--action-success)', color: 'var(--text-inverse)', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}
            >
              💾 Save Record
            </button>
            <button
              onClick={() => { setShowForm(false); setEditingId(null) }}
              style={{ flex: 1, padding: '12px', background: 'var(--bg-tertiary)', color: 'var(--text-inverse)', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          background: toast.type === 'error' ? 'var(--action-danger)' : toast.type === 'success' ? 'var(--action-success)' : 'var(--action-primary)',
          color: 'var(--text-inverse)',
          padding: '12px 20px',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          zIndex: 1000,
          fontSize: '14px',
          fontWeight: '500'
        }}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}
