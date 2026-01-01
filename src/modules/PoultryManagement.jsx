import React, { useState, useEffect } from 'react'
import { loadData, saveData } from '../lib/storage'
import { logAnimalActivity } from '../lib/activityLogger'
import { savePhoto, deletePhoto, getPhotosByEntity } from '../lib/photoAnalysis'
import { exportToCSV, exportToJSON } from '../lib/exportImport'

const POULTRY_KEY = 'cattalytics:poultry'
const FLOCK_KEY = 'cattalytics:flocks'
const EGG_KEY = 'cattalytics:egg_production'
const HEALTH_KEY = 'cattalytics:poultry_health'

const POULTRY_TYPES = ['Chicken', 'Duck', 'Turkey', 'Goose', 'Quail', 'Guinea Fowl', 'Pigeon', 'Other']
const CHICKEN_BREEDS = ['Leghorn', 'Rhode Island Red', 'Plymouth Rock', 'Sussex', 'Orpington', 'Brahma', 'Australorp', 'Silkie', 'Wyandotte', 'Cochin', 'Marans', 'Ameraucana', 'Local', 'Mixed', 'Other']
const PURPOSES = ['Layers', 'Broilers', 'Dual Purpose', 'Breeding', 'Show', 'Ornamental']
const HOUSING_TYPES = ['Free Range', 'Cage', 'Deep Litter', 'Battery', 'Barn', 'Aviary', 'Pasture']

export default function PoultryManagement() {
  const [birds, setBirds] = useState([])
  const [flocks, setFlocks] = useState([])
  const [eggRecords, setEggRecords] = useState([])
  const [healthRecords, setHealthRecords] = useState([])
  const [view, setView] = useState('flocks') // flocks, birds, eggs, health
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [toast, setToast] = useState(null)

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

  const handleSaveEgg = () => {
    if (!eggForm.flockId || !eggForm.collected) {
      showToast('Flock and collected eggs required', 'error')
      return
    }

    let updated
    if (editingId) {
      updated = eggRecords.map(e => e.id === editingId ? { ...eggForm } : e)
      showToast('Egg record updated', 'success')
    } else {
      const newRecord = { ...eggForm, id: 'EGG-' + Date.now() }
      updated = [...eggRecords, newRecord]
      showToast('Egg record added', 'success')
    }

    setEggRecords(updated)
    setShowForm(false)
    setEditingId(null)
    setEggForm({ id: '', flockId: '', date: new Date().toISOString().slice(0, 10), collected: '', broken: '', sold: '', used: '', price: '', notes: '' })
  }

  const handleSaveHealth = () => {
    if (!healthForm.flockId || !healthForm.type) {
      showToast('Flock and type required', 'error')
      return
    }

    let updated
    if (editingId) {
      updated = healthRecords.map(h => h.id === editingId ? { ...healthForm } : h)
      showToast('Health record updated', 'success')
    } else {
      const newRecord = { ...healthForm, id: 'PH-' + Date.now() }
      updated = [...healthRecords, newRecord]
      showToast('Health record added', 'success')
    }

    setHealthRecords(updated)
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

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: 'bold' }}>
          🐔 Poultry Management
        </h2>
        <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
          Manage flocks, track egg production, and monitor poultry health
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: 'white', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Total Flocks</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#3b82f6' }}>{stats.totalFlocks}</div>
        </div>
        <div style={{ background: 'white', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Live Birds</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#059669' }}>{stats.totalBirds}</div>
        </div>
        <div style={{ background: 'white', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Eggs Today</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#f59e0b' }}>{stats.totalEggsToday}</div>
        </div>
        <div style={{ background: 'white', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Eggs This Week</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#8b5cf6' }}>{stats.totalEggsWeek}</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {['flocks', 'eggs', 'health'].map(tab => (
          <button
            key={tab}
            onClick={() => { setView(tab); setShowForm(false); setEditingId(null) }}
            style={{
              padding: '10px 20px',
              background: view === tab ? '#3b82f6' : '#f3f4f6',
              color: view === tab ? 'white' : '#1f2937',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              textTransform: 'capitalize'
            }}
          >
            {tab}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button
          onClick={() => exportToJSON(view === 'flocks' ? flocks : view === 'eggs' ? eggRecords : healthRecords, `poultry_${view}_${new Date().toISOString().slice(0, 10)}.json`)}
          style={{
            padding: '10px 20px',
            background: '#059669',
            color: 'white',
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
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
            <button
              onClick={() => { setShowForm(true); setEditingId(null); setFlockForm({ id: '', name: '', type: 'Chicken', breed: 'Local', purpose: 'Layers', quantity: '', housing: 'Deep Litter', acquiredDate: '', cost: '', mortality: 0, notes: '', image: '' }) }}
              style={{
                padding: '10px 20px',
                background: '#10b981',
                color: 'white',
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
              <div key={flock.id} style={{ background: 'white', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                {flock.image && (
                  <img src={flock.image} alt={flock.name} style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '6px', marginBottom: '12px' }} />
                )}
                <h3 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>{flock.name}</h3>
                <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '12px' }}>
                  <div><strong>{flock.type}</strong> • {flock.breed} • {flock.purpose}</div>
                  <div style={{ marginTop: '4px' }}>
                    <strong>Live:</strong> {(Number(flock.quantity) || 0) - (Number(flock.mortality) || 0)} birds
                    {flock.mortality > 0 && <span style={{ color: '#ef4444', marginLeft: '8px' }}>({flock.mortality} lost)</span>}
                  </div>
                  <div><strong>Housing:</strong> {flock.housing}</div>
                  {flock.acquiredDate && <div><strong>Acquired:</strong> {flock.acquiredDate}</div>}
                </div>
                {flock.notes && (
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '12px', fontStyle: 'italic' }}>
                    {flock.notes}
                  </div>
                )}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => { setFlockForm(flock); setEditingId(flock.id); setShowForm(true) }}
                    style={{ flex: 1, padding: '8px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => handleDeleteFlock(flock.id)}
                    style={{ flex: 1, padding: '8px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredFlocks.length === 0 && (
            <div style={{ background: 'white', padding: '60px 20px', borderRadius: '8px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>🐔</div>
              <div style={{ fontSize: '18px', color: '#1f2937', marginBottom: '8px' }}>No flocks found</div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>Add your first flock to get started</div>
            </div>
          )}
        </div>
      )}

      {/* Flock Form */}
      {view === 'flocks' && showForm && (
        <div style={{ background: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ margin: '0 0 16px 0' }}>{editingId ? 'Edit Flock' : 'Add New Flock'}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600' }}>Flock Name *</label>
              <input
                type="text"
                value={flockForm.name}
                onChange={(e) => setFlockForm({ ...flockForm, name: e.target.value })}
                style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600' }}>Type</label>
              <select
                value={flockForm.type}
                onChange={(e) => setFlockForm({ ...flockForm, type: e.target.value })}
                style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }}
              >
                {POULTRY_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600' }}>Breed</label>
              <select
                value={flockForm.breed}
                onChange={(e) => setFlockForm({ ...flockForm, breed: e.target.value })}
                style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }}
              >
                {CHICKEN_BREEDS.map(breed => <option key={breed} value={breed}>{breed}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600' }}>Purpose</label>
              <select
                value={flockForm.purpose}
                onChange={(e) => setFlockForm({ ...flockForm, purpose: e.target.value })}
                style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }}
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
                style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600' }}>Mortality</label>
              <input
                type="number"
                value={flockForm.mortality}
                onChange={(e) => setFlockForm({ ...flockForm, mortality: e.target.value })}
                style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600' }}>Housing</label>
              <select
                value={flockForm.housing}
                onChange={(e) => setFlockForm({ ...flockForm, housing: e.target.value })}
                style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }}
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
                style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600' }}>Cost</label>
              <input
                type="number"
                value={flockForm.cost}
                onChange={(e) => setFlockForm({ ...flockForm, cost: e.target.value })}
                style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }}
              />
            </div>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600' }}>Notes</label>
            <textarea
              value={flockForm.notes}
              onChange={(e) => setFlockForm({ ...flockForm, notes: e.target.value })}
              rows={3}
              style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }}
            />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600' }}>Photo</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload(e, setFlockForm)}
              style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }}
            />
            {flockForm.image && (
              <img src={flockForm.image} alt="Preview" style={{ width: '200px', height: '150px', objectFit: 'cover', borderRadius: '6px', marginTop: '12px' }} />
            )}
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handleSaveFlock}
              style={{ flex: 1, padding: '12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}
            >
              💾 Save Flock
            </button>
            <button
              onClick={() => { setShowForm(false); setEditingId(null) }}
              style={{ flex: 1, padding: '12px', background: '#6b7280', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Egg Production View */}
      {view === 'eggs' && !showForm && (
        <div>
          <button
            onClick={() => { setShowForm(true); setEditingId(null); setEggForm({ id: '', flockId: '', date: new Date().toISOString().slice(0, 10), collected: '', broken: '', sold: '', used: '', price: '', notes: '' }) }}
            style={{ marginBottom: '16px', padding: '10px 20px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}
          >
            ➕ Record Eggs
          </button>

          <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
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
                    <tr key={record.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '12px', fontSize: '13px' }}>{record.date}</td>
                      <td style={{ padding: '12px', fontSize: '13px' }}>{flock?.name || 'Unknown'}</td>
                      <td style={{ padding: '12px', fontSize: '13px', textAlign: 'right' }}>{record.collected}</td>
                      <td style={{ padding: '12px', fontSize: '13px', textAlign: 'right', color: '#ef4444' }}>{record.broken || 0}</td>
                      <td style={{ padding: '12px', fontSize: '13px', textAlign: 'right' }}>{record.sold || 0}</td>
                      <td style={{ padding: '12px', fontSize: '13px', textAlign: 'right' }}>{record.used || 0}</td>
                      <td style={{ padding: '12px', fontSize: '13px', textAlign: 'right', fontWeight: '600', color: '#059669' }}>
                        {record.price ? `KES ${(Number(record.sold || 0) * Number(record.price)).toLocaleString()}` : '-'}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <button
                          onClick={() => { setEggForm(record); setEditingId(record.id); setShowForm(true) }}
                          style={{ padding: '6px 12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', marginRight: '6px' }}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => { if (confirm('Delete this record?')) setEggRecords(eggRecords.filter(e => e.id !== record.id)) }}
                          style={{ padding: '6px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
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
            <div style={{ background: 'white', padding: '60px 20px', borderRadius: '8px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginTop: '16px' }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>🥚</div>
              <div style={{ fontSize: '18px', color: '#1f2937', marginBottom: '8px' }}>No egg records</div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>Start recording daily egg production</div>
            </div>
          )}
        </div>
      )}

      {/* Egg Form */}
      {view === 'eggs' && showForm && (
        <div style={{ background: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ margin: '0 0 16px 0' }}>{editingId ? 'Edit Egg Record' : 'Record Egg Production'}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600' }}>Flock *</label>
              <select
                value={eggForm.flockId}
                onChange={(e) => setEggForm({ ...eggForm, flockId: e.target.value })}
                style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }}
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
                style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600' }}>Collected *</label>
              <input
                type="number"
                value={eggForm.collected}
                onChange={(e) => setEggForm({ ...eggForm, collected: e.target.value })}
                style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600' }}>Broken</label>
              <input
                type="number"
                value={eggForm.broken}
                onChange={(e) => setEggForm({ ...eggForm, broken: e.target.value })}
                style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600' }}>Sold</label>
              <input
                type="number"
                value={eggForm.sold}
                onChange={(e) => setEggForm({ ...eggForm, sold: e.target.value })}
                style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600' }}>Used</label>
              <input
                type="number"
                value={eggForm.used}
                onChange={(e) => setEggForm({ ...eggForm, used: e.target.value })}
                style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600' }}>Price per Egg (KES)</label>
              <input
                type="number"
                value={eggForm.price}
                onChange={(e) => setEggForm({ ...eggForm, price: e.target.value })}
                style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }}
              />
            </div>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600' }}>Notes</label>
            <textarea
              value={eggForm.notes}
              onChange={(e) => setEggForm({ ...eggForm, notes: e.target.value })}
              rows={2}
              style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handleSaveEgg}
              style={{ flex: 1, padding: '12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}
            >
              💾 Save Record
            </button>
            <button
              onClick={() => { setShowForm(false); setEditingId(null) }}
              style={{ flex: 1, padding: '12px', background: '#6b7280', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Health View */}
      {view === 'health' && !showForm && (
        <div>
          <button
            onClick={() => { setShowForm(true); setEditingId(null); setHealthForm({ id: '', flockId: '', date: new Date().toISOString().slice(0, 10), type: 'Vaccination', treatment: '', diagnosis: '', medication: '', dosage: '', cost: '', veterinarian: '', notes: '' }) }}
            style={{ marginBottom: '16px', padding: '10px 20px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}
          >
            ➕ Add Health Record
          </button>

          <div style={{ display: 'grid', gap: '16px' }}>
            {healthRecords.sort((a, b) => new Date(b.date) - new Date(a.date)).map(record => {
              const flock = flocks.find(f => f.id === record.flockId)
              return (
                <div key={record.id} style={{ background: 'white', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                    <div>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '16px' }}>{flock?.name || 'Unknown Flock'}</h4>
                      <div style={{ fontSize: '13px', color: '#6b7280' }}>{record.date} • {record.type}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => { setHealthForm(record); setEditingId(record.id); setShowForm(true) }}
                        style={{ padding: '6px 12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => { if (confirm('Delete this record?')) setHealthRecords(healthRecords.filter(h => h.id !== record.id)) }}
                        style={{ padding: '6px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
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
                    {record.notes && <div style={{ marginTop: '8px', fontStyle: 'italic', color: '#6b7280' }}>{record.notes}</div>}
                  </div>
                </div>
              )
            })}
          </div>

          {healthRecords.length === 0 && (
            <div style={{ background: 'white', padding: '60px 20px', borderRadius: '8px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>🏥</div>
              <div style={{ fontSize: '18px', color: '#1f2937', marginBottom: '8px' }}>No health records</div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>Track vaccinations, treatments, and health events</div>
            </div>
          )}
        </div>
      )}

      {/* Health Form */}
      {view === 'health' && showForm && (
        <div style={{ background: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ margin: '0 0 16px 0' }}>{editingId ? 'Edit Health Record' : 'Add Health Record'}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600' }}>Flock *</label>
              <select
                value={healthForm.flockId}
                onChange={(e) => setHealthForm({ ...healthForm, flockId: e.target.value })}
                style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }}
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
                style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600' }}>Type *</label>
              <select
                value={healthForm.type}
                onChange={(e) => setHealthForm({ ...healthForm, type: e.target.value })}
                style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }}
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
                style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600' }}>Treatment</label>
              <input
                type="text"
                value={healthForm.treatment}
                onChange={(e) => setHealthForm({ ...healthForm, treatment: e.target.value })}
                style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600' }}>Medication</label>
              <input
                type="text"
                value={healthForm.medication}
                onChange={(e) => setHealthForm({ ...healthForm, medication: e.target.value })}
                style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600' }}>Dosage</label>
              <input
                type="text"
                value={healthForm.dosage}
                onChange={(e) => setHealthForm({ ...healthForm, dosage: e.target.value })}
                style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600' }}>Veterinarian</label>
              <input
                type="text"
                value={healthForm.veterinarian}
                onChange={(e) => setHealthForm({ ...healthForm, veterinarian: e.target.value })}
                style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600' }}>Cost (KES)</label>
              <input
                type="number"
                value={healthForm.cost}
                onChange={(e) => setHealthForm({ ...healthForm, cost: e.target.value })}
                style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }}
              />
            </div>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600' }}>Notes</label>
            <textarea
              value={healthForm.notes}
              onChange={(e) => setHealthForm({ ...healthForm, notes: e.target.value })}
              rows={3}
              style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handleSaveHealth}
              style={{ flex: 1, padding: '12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}
            >
              💾 Save Record
            </button>
            <button
              onClick={() => { setShowForm(false); setEditingId(null) }}
              style={{ flex: 1, padding: '12px', background: '#6b7280', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}
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
          background: toast.type === 'error' ? '#ef4444' : toast.type === 'success' ? '#10b981' : '#3b82f6',
          color: 'white',
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
