import React, { useState, useEffect } from 'react'
import ErrorBoundary from '../components/ErrorBoundary'
import AnimalCV from '../components/animal/AnimalCV'
import { recordClick } from '../lib/clickDB'
import { logActivity } from '../lib/activityLogger'
import { NOTIFICATION_TYPES, PRIORITIES } from '../lib/notifications'
import { validateCanineHealthInput, validateCanineVaccineInput, validateCanineHusbandryInput, scheduleLivestockReminder } from '../lib/livestockPhase1'

export default function CanineManagement({ animals = [], setAnimals, initialTab = 'list', recordSource = null }) {
  const canines = animals.filter(a => a.groupId === 'G-008')
  const [listSearch, setListSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [selectedCanine, setSelectedCanine] = useState(null)
  const [tab, setTab] = useState('list') // Top-level tab
  const [detailTab, setDetailTab] = useState('info') // Detail view sub-tab
  const [editingId, setEditingId] = useState(null)
  
  const [inlineEditId, setInlineEditId] = useState(null)
  const [inlineData, setInlineData] = useState({ name: '', role: 'Guard Dog', trainingLevel: 'Basic', weight: '' })
  const [toast, setToast] = useState(null)
  const [lastChange, setLastChange] = useState(null)

  const [formData, setFormData] = useState({
    name: '', breed: '', dob: '', weight: '', sex: 'M',
    role: 'Guard Dog', workType: 'Herding', trainingLevel: 'Basic',
    notes: ''
  })

  const [healthForm, setHealthForm] = useState({
    condition: '', severity: 'Minor', date: new Date().toISOString().split('T')[0], 
    treatment: '', vetNotes: ''
  })

  const [vaccineForm, setVaccineForm] = useState({
    vaccineType: 'Rabies', date: new Date().toISOString().split('T')[0],
    vet: '', boosterDue: '', notes: ''
  })

  const [husbandryForm, setHusbandryForm] = useState({
    feedType: 'Commercial Dog Food', quantity: '', frequency: 'Twice Daily',
    housing: 'Farm Kennel', exercise: 'Active', grooming: 'Monthly', supplements: ''
  })

  const roles = ['Guard Dog', 'Herding Dog', 'Working Dog', 'Family Dog', 'Breeding Female', 'Breeding Male']
  const workTypes = ['Herding', 'Protection', 'Tracking', 'Patrol', 'Farm Work', 'None']
  const trainingLevels = ['None', 'Basic', 'Intermediate', 'Advanced', 'Professional']

  const navTabsStyle = {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap'
  }
  const getNavTabStyle = (isActive) => ({
    padding: '12px 18px',
    border: `1px solid ${isActive ? '#a7f3d0' : '#dbe4ea'}`,
    background: isActive ? '#ecfdf5' : '#f8fafc',
    color: isActive ? '#047857' : '#475569',
    borderRadius: '999px',
    fontWeight: '700',
    cursor: 'pointer',
    fontSize: '14px'
  })

  const [showCV, setShowCV] = useState(false)

  const filteredCanines = canines.filter((dog) => {
    const q = listSearch.trim().toLowerCase()
    const matchesSearch = !q ||
      String(dog.name || '').toLowerCase().includes(q) ||
      String(dog.breed || '').toLowerCase().includes(q) ||
      String(dog.tag || '').toLowerCase().includes(q)
    const matchesRole = roleFilter === 'all' || String(dog.role || '') === roleFilter
    return matchesSearch && matchesRole
  })

  const totalHealthRecords = canines.reduce((sum, dog) => sum + (dog.healthRecords || []).length, 0)
  const totalVaccineRecords = canines.reduce((sum, dog) => sum + (dog.vaccineRecords || []).length, 0)
  const totalHusbandryRecords = canines.reduce((sum, dog) => sum + (dog.husbandryLog || []).length, 0)

  const caninePremiumStyles = `
    .canine-premium {
      --canine-ink: #0f172a;
      --canine-subtle: #475569;
      font-family: "Nunito Sans", "Segoe UI", sans-serif;
      max-width: 1480px;
      margin: 0 auto;
      border-radius: 24px;
      border: 1px solid #dbeafe;
      background:
        radial-gradient(circle at 12% -4%, rgba(16, 185, 129, 0.14) 0, transparent 38%),
        radial-gradient(circle at 100% 0, rgba(2, 132, 199, 0.14) 0, transparent 40%),
        linear-gradient(145deg, #ecfeff, #f8fafc);
      box-shadow: 0 24px 60px rgba(15, 23, 42, 0.08);
      animation: canineFadeIn 0.52s ease-out;
    }
    @keyframes canineFadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes canineRise {
      from { opacity: 0; transform: translateY(10px) scale(0.986); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    .canine-premium h1,
    .canine-premium h2,
    .canine-premium h3,
    .canine-premium h4 {
      color: var(--canine-ink);
      letter-spacing: -0.02em;
      font-family: "M PLUS Rounded 1c", "Nunito Sans", sans-serif;
    }
    .canine-premium p,
    .canine-premium label,
    .canine-premium small {
      color: var(--canine-subtle);
    }
    .canine-premium input,
    .canine-premium select,
    .canine-premium textarea {
      border-radius: 12px;
      border: 1px solid #cbd5e1;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }
    .canine-premium input:focus,
    .canine-premium select:focus,
    .canine-premium textarea:focus {
      outline: none;
      border-color: #06b6d4;
      box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.16);
    }
    .canine-premium .canine-hero {
      position: relative;
      overflow: hidden;
      border: 1px solid #bae6fd;
      border-radius: 16px;
      padding: 14px 16px;
      background: rgba(255, 255, 255, 0.78);
    }
    .canine-premium .canine-hero::after {
      content: "";
      position: absolute;
      width: 160px;
      height: 160px;
      border-radius: 999px;
      top: -54px;
      right: -42px;
      background: radial-gradient(circle at center, rgba(6, 182, 212, 0.18), rgba(6, 182, 212, 0));
      pointer-events: none;
    }
    .canine-premium .canine-stat-grid > div {
      box-shadow: 0 10px 28px rgba(15, 23, 42, 0.08);
      animation: canineRise 0.5s ease both;
    }
    .canine-premium .canine-stat-grid > div:nth-child(2) { animation-delay: 0.05s; }
    .canine-premium .canine-stat-grid > div:nth-child(3) { animation-delay: 0.1s; }
    .canine-premium .canine-stat-grid > div:nth-child(4) { animation-delay: 0.15s; }
    .canine-premium button {
      min-height: 44px;
      touch-action: manipulation;
      transition: transform 0.16s ease, box-shadow 0.16s ease;
    }
    .canine-premium button:hover {
      transform: translateY(-1px);
      box-shadow: 0 8px 20px rgba(15, 23, 42, 0.14);
    }
    @media (max-width: 768px) {
      .canine-premium {
        padding: 14px !important;
        border-radius: 16px;
      }
      .canine-premium .canine-hero {
        padding: 12px !important;
      }
      .canine-premium .canine-stat-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        gap: 10px !important;
      }
      .canine-premium input,
      .canine-premium select,
      .canine-premium textarea,
      .canine-premium button {
        font-size: 16px;
      }
      .canine-premium input,
      .canine-premium select,
      .canine-premium textarea {
        min-height: 42px;
      }
    }
    @media (max-width: 520px) {
      .canine-premium .canine-stat-grid {
        grid-template-columns: 1fr !important;
      }
    }
  `

  useEffect(() => {
    const allowed = new Set(['list', 'health', 'vaccines', 'husbandry'])
    if (allowed.has(initialTab) && initialTab !== tab) {
      setTab(initialTab)
      if (initialTab !== 'list') {
        setSelectedCanine(null)
      }
      setShowForm(false)
    }
  }, [initialTab, tab])

  function downloadAnimalJSON(a) {
    try {
      const blob = new Blob([JSON.stringify(a || {}, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const el = document.createElement('a')
      el.href = url
      el.download = `${(a.tag || a.id || 'animal')}_data.json`
      document.body.appendChild(el)
      el.click()
      document.body.removeChild(el)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Download JSON failed', err)
      alert('Failed to download JSON')
    }
  }

  const addCanine = () => {
    if (!formData.name.trim()) return
    
    const newCanine = {
      id: 'C-' + Math.floor(10000 + Math.random() * 90000),
      tag: formData.name.substring(0, 3).toUpperCase() + '-' + Date.now().toString().slice(-4),
      groupId: 'G-008',
      type: 'Canine',
      ...formData,
      healthRecords: [],
      vaccineRecords: [],
      husbandryLog: [],
      lactationStatus: 'NA',
      pregnancyStatus: 'NA'
    }
    
    if (editingId) {
      setAnimals(animals.map(a => a.id === editingId ? { ...a, ...formData } : a))
      setEditingId(null)
    } else {
      setAnimals([...animals, newCanine])
    }

    setFormData({
      name: '', breed: '', dob: '', weight: '', sex: 'M',
      role: 'Guard Dog', workType: 'Herding', trainingLevel: 'Basic', notes: ''
    })
    setShowForm(false)
  }

  const addHealthRecord = (canineId) => {
    const validation = validateCanineHealthInput({
      canineId,
      condition: healthForm.condition,
      date: healthForm.date
    })
    if (!validation.valid) {
      setToast({ type: 'error', message: validation.errors[0] })
      setTimeout(() => setToast(null), 3000)
      return
    }

    setAnimals(animals.map(a => a.id === canineId ? {
      ...a,
      healthRecords: [...(a.healthRecords || []), { ...healthForm, id: Date.now() }]
    } : a))

    const canine = animals.find(a => a.id === canineId)
    logActivity('health', 'canine_health_added', `Health record added for ${canine?.name || canineId}`, {
      canineId,
      condition: healthForm.condition,
      severity: healthForm.severity
    })

    setHealthForm({ condition: '', severity: 'Minor', date: new Date().toISOString().split('T')[0], treatment: '', vetNotes: '' })
  }

  const addVaccineRecord = (canineId) => {
    const validation = validateCanineVaccineInput({
      canineId,
      vaccineType: vaccineForm.vaccineType,
      date: vaccineForm.date,
      boosterDue: vaccineForm.boosterDue
    })
    if (!validation.valid) {
      setToast({ type: 'error', message: validation.errors[0] })
      setTimeout(() => setToast(null), 3000)
      return
    }

    setAnimals(animals.map(a => a.id === canineId ? {
      ...a,
      vaccineRecords: [...(a.vaccineRecords || []), { ...vaccineForm, id: Date.now() }]
    } : a))

    if (vaccineForm.boosterDue) {
      const canine = animals.find(a => a.id === canineId)
      scheduleLivestockReminder({
        type: NOTIFICATION_TYPES.HEALTH,
        title: `Canine booster due: ${canine?.name || canineId}`,
        body: `${vaccineForm.vaccineType} booster is due for ${canine?.name || canineId}.`,
        dueDate: vaccineForm.boosterDue,
        entityId: canineId,
        entityType: 'canine-vaccine',
        priority: PRIORITIES.HIGH
      })
    }

    logActivity('health', 'canine_vaccine_added', `Vaccination record added`, {
      canineId,
      vaccineType: vaccineForm.vaccineType,
      boosterDue: vaccineForm.boosterDue
    })

    setVaccineForm({ vaccineType: 'Rabies', date: new Date().toISOString().split('T')[0], vet: '', boosterDue: '', notes: '' })
  }

  const addHusbandryRecord = (canineId) => {
    const validation = validateCanineHusbandryInput({
      canineId,
      feedType: husbandryForm.feedType
    })
    if (!validation.valid) {
      setToast({ type: 'error', message: validation.errors[0] })
      setTimeout(() => setToast(null), 3000)
      return
    }

    setAnimals(animals.map(a => a.id === canineId ? {
      ...a,
      husbandryLog: [...(a.husbandryLog || []), { ...husbandryForm, id: Date.now(), date: new Date().toISOString().split('T')[0] }]
    } : a))

    logActivity('animal', 'canine_husbandry_added', 'Canine husbandry record added', {
      canineId,
      feedType: husbandryForm.feedType,
      frequency: husbandryForm.frequency
    })

    setHusbandryForm({ feedType: 'Commercial Dog Food', quantity: '', frequency: 'Twice Daily', housing: 'Farm Kennel', exercise: 'Active', grooming: 'Monthly', supplements: '' })
  }

  const deleteCanine = (id) => {
    if (window.confirm('Delete this canine?')) {
      setAnimals(animals.filter(a => a.id !== id))
      setSelectedCanine(null)
    }
  }

  const startInlineEdit = (dog) => {
    setInlineEditId(dog.id)
    setInlineData({ 
      name: dog.name || '', 
      role: dog.role || 'Guard Dog',
      trainingLevel: dog.trainingLevel || 'Basic',
      weight: dog.weight || ''
    })
  }

  const saveInlineEdit = () => {
    if (!inlineData.name.trim()) {
      setToast({ type: 'error', message: 'Name is required' })
      setTimeout(() => setToast(null), 3000)
      return
    }
    setAnimals(animals.map(a => {
      if (a.id === inlineEditId) {
        setLastChange({ type: 'edit', item: { ...a } })
        return { 
          ...a, 
          name: inlineData.name.trim(),
          role: inlineData.role,
          trainingLevel: inlineData.trainingLevel,
          weight: inlineData.weight
        }
      }
      return a
    }))
    setToast({ type: 'success', message: 'Canine updated', showUndo: true })
    setTimeout(() => setToast(null), 5000)
    setInlineEditId(null)
  }

  const cancelInlineEdit = () => {
    setInlineEditId(null)
    setInlineData({ name: '', role: 'Guard Dog', trainingLevel: 'Basic', weight: '' })
  }

  const undoLastChange = () => {
    if (lastChange) {
      setAnimals(animals.map(a => a.id === lastChange.item.id ? lastChange.item : a))
      setToast({ type: 'success', message: 'Change reverted' })
      setTimeout(() => setToast(null), 3000)
      setLastChange(null)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); saveInlineEdit() }
    else if (e.key === 'Escape') cancelInlineEdit()
  }

  const deleteHealthRecord = (canineId, recordId) => {
    setAnimals(animals.map(a => a.id === canineId ? {
      ...a,
      healthRecords: (a.healthRecords || []).filter(r => r.id !== recordId)
    } : a))
  }

  const deleteVaccineRecord = (canineId, recordId) => {
    setAnimals(animals.map(a => a.id === canineId ? {
      ...a,
      vaccineRecords: (a.vaccineRecords || []).filter(r => r.id !== recordId)
    } : a))
  }

  const editCanine = (canine) => {
    setFormData({ name: canine.name, breed: canine.breed, dob: canine.dob, weight: canine.weight, sex: canine.sex, role: canine.role, workType: canine.workType, trainingLevel: canine.trainingLevel, notes: canine.notes })
    setEditingId(canine.id)
    setShowForm(true)
    setTab('list')
  }

  return (
    <div className="canine-premium" style={{ padding: '20px' }}>
        <style>{caninePremiumStyles}</style>
        <div className="canine-hero" style={{ marginBottom: '20px' }}>
          <h3 style={{ marginTop: 0 }}>🐕 Canine Management</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Comprehensive dog management with health, vaccination, and husbandry tracking</p>
          {recordSource?.domain && recordSource?.item && (
            <div style={{ marginTop: '10px', fontSize: '12px', fontWeight: 700, color: 'var(--action-success)', background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: '999px', display: 'inline-flex', padding: '4px 10px' }}>
              Opened from Record Coverage: {recordSource.domain} / {recordSource.item}
            </div>
          )}
        </div>

        <div className="canine-stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
          <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 10, padding: 12 }}>
            <div style={{ fontSize: 12, color: '#166534' }}>Registered Canines</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#166534' }}>{canines.length}</div>
          </div>
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: 12 }}>
            <div style={{ fontSize: 12, color: '#1d4ed8' }}>Health Records</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#1d4ed8' }}>{totalHealthRecords}</div>
          </div>
          <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 10, padding: 12 }}>
            <div style={{ fontSize: 12, color: '#c2410c' }}>Vaccination Records</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#c2410c' }}>{totalVaccineRecords}</div>
          </div>
          <div style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 10, padding: 12 }}>
            <div style={{ fontSize: 12, color: '#6d28d9' }}>Husbandry Logs</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#6d28d9' }}>{totalHusbandryRecords}</div>
          </div>
        </div>

        {/* Top-Level Tabs */}
        <div style={{ marginBottom: '20px' }}>
          <div style={navTabsStyle}>
            <button onClick={() => setTab('list')} style={getNavTabStyle(tab === 'list')}>
              📋 Canine List
            </button>
            <button onClick={() => setTab('health')} style={getNavTabStyle(tab === 'health')}>
              🏥 Health Records
            </button>
            <button onClick={() => setTab('vaccines')} style={getNavTabStyle(tab === 'vaccines')}>
              💉 Vaccinations
            </button>
            <button onClick={() => setTab('husbandry')} style={getNavTabStyle(tab === 'husbandry')}>
              🍽️ Husbandry & Care
            </button>
          </div>
        </div>

        {tab === 'list' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 1fr) minmax(180px, 220px)', gap: 10, marginBottom: 14 }}>
              <input
                type="text"
                value={listSearch}
                onChange={(e) => setListSearch(e.target.value)}
                placeholder="Search by name, breed, or tag..."
                style={{ padding: '10px 12px', border: '1px solid var(--border-secondary)', borderRadius: 8, fontSize: 13 }}
              />
              <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} style={{ padding: '10px 12px', border: '1px solid var(--border-secondary)', borderRadius: 8, fontSize: 13 }}>
                <option value="all">All Roles</option>
                {roles.map((role) => <option key={role} value={role}>{role}</option>)}
              </select>
            </div>

            {filteredCanines.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
                  {filteredCanines.map(dog => (
                    <div key={dog.id} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-primary)', borderRadius: '8px', padding: '14px', transition: 'all 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                      {inlineEditId === dog.id ? (
                        <div onKeyDown={handleKeyDown} style={{display:'flex',flexDirection:'column',gap:8}}>
                          <input value={inlineData.name} onChange={e=>setInlineData({...inlineData,name:e.target.value})} placeholder="Name" style={{padding:'6px',border:'1px solid var(--border-secondary)',borderRadius:4,fontSize:13}} autoFocus />
                          <select value={inlineData.role} onChange={e=>setInlineData({...inlineData,role:e.target.value})} style={{padding:'6px',border:'1px solid var(--border-secondary)',borderRadius:4,fontSize:13}}>
                            {roles.map(r=><option key={r}>{r}</option>)}
                          </select>
                          <select value={inlineData.trainingLevel} onChange={e=>setInlineData({...inlineData,trainingLevel:e.target.value})} style={{padding:'6px',border:'1px solid var(--border-secondary)',borderRadius:4,fontSize:13}}>
                            {trainingLevels.map(t=><option key={t}>{t}</option>)}
                          </select>
                          <input type="number" value={inlineData.weight} onChange={e=>setInlineData({...inlineData,weight:e.target.value})} placeholder="Weight (kg)" style={{padding:'6px',border:'1px solid var(--border-secondary)',borderRadius:4,fontSize:13}} />
                          <div style={{display:'flex',gap:4}}>
                            <button onClick={saveInlineEdit} style={{flex:1,padding:'6px',background:'var(--action-success)',color:'var(--text-inverse)',border:'none',borderRadius:4,fontSize:11}}>✓ Save</button>
                            <button onClick={cancelInlineEdit} style={{flex:1,padding:'6px',background:'var(--action-danger)',color:'var(--text-inverse)',border:'none',borderRadius:4,fontSize:11}}>✕ Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <div style={{cursor:'pointer'}} onClick={() => setSelectedCanine(dog)}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                            <div>
                        <h4 style={{ margin: '0 0 4px 0', color: '#1f2937' }}>{dog.name}</h4>
                        <p style={{ margin: '0', fontSize: '12px', color: '#4b5563' }}>{dog.breed || 'Mixed'}</p>
                      </div>
                      <span style={{ background: '#d1fae5', color: '#065f46', padding: '3px 6px', borderRadius: '3px', fontSize: '11px', fontWeight: '500' }}>
                        {dog.role || 'Guard'}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#4b5563', marginTop: '8px', lineHeight: '1.5' }}>
                      <div>Training: {dog.trainingLevel || 'Basic'}</div>
                      <div>Work: {dog.workType || 'Herding'}</div>
                      <div>Weight: {dog.weight || 'N/A'} kg</div>
                    </div>
                    <div style={{ marginTop: '8px', display: 'flex', gap: '4px' }}>
                      <button onClick={(e) => { e.stopPropagation(); startInlineEdit(dog); }} style={{ flex: 1, padding: '4px 8px', background: '#ffffcc', color: '#333', border: '1px solid #ffdd00', borderRadius: '3px', fontSize: '11px', cursor: 'pointer', fontWeight: '500' }}>⚡ Quick</button>
                      <button onClick={(e) => { e.stopPropagation(); recordClick('animal', dog.id, 'view_cv'); setSelectedCanine(dog); setShowCV(true); }} style={{ flex: 1, padding: '4px 8px', background: '#059669', color: 'var(--text-inverse)', border: 'none', borderRadius: '3px', fontSize: '11px', cursor: 'pointer' }}>👁️ View</button>
                      <button onClick={(e) => { e.stopPropagation(); editCanine(dog); }} style={{ flex: 1, padding: '4px 8px', background: 'var(--action-primary)', color: 'var(--text-inverse)', border: 'none', borderRadius: '3px', fontSize: '11px', cursor: 'pointer' }}>✏️</button>
                      <button onClick={(e) => { e.stopPropagation(); deleteCanine(dog.id); }} style={{ flex: 1, padding: '4px 8px', background: 'var(--action-danger)', color: 'var(--text-inverse)', border: 'none', borderRadius: '3px', fontSize: '11px', cursor: 'pointer' }}>🗑️</button>
                    </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {filteredCanines.length === 0 && !showForm && (
                <div style={{ background: 'var(--bg-elevated)', border: '2px dashed var(--border-secondary)', borderRadius: '8px', padding: '40px 20px', textAlign: 'center', marginBottom: '20px' }}>
                  <div style={{ fontSize: '32px', marginBottom: '10px' }}>🐕</div>
                  <p style={{ margin: '0', color: '#4b5563' }}>{canines.length === 0 ? 'No canines registered yet' : 'No canines match the current filters'}</p>
                </div>
              )}

              {showForm && (
                <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-primary)', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
                  <h4>{editingId ? 'Edit Canine' : 'Add New Canine'}</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    <input type="text" id="dog-name" name="dogName" placeholder="Dog name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={{ padding: '8px', border: '1px solid var(--border-secondary)', borderRadius: '4px' }} />
                    <input type="text" id="dog-breed" name="breed" placeholder="Breed" value={formData.breed} onChange={e => setFormData({...formData, breed: e.target.value})} style={{ padding: '8px', border: '1px solid var(--border-secondary)', borderRadius: '4px' }} />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <label htmlFor="dob" style={{ fontSize: '13px', marginBottom: '4px', fontWeight: '500' }}>Date of Birth</label>
                      <input id="dob" name="dob" type="date" value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} style={{ padding: '8px', border: '1px solid var(--border-secondary)', borderRadius: '4px' }} />
                    </div>
                    <input type="number" id="dog-weight" name="weight" placeholder="Weight (kg)" value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} style={{ padding: '8px', border: '1px solid var(--border-secondary)', borderRadius: '4px' }} />
                    <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} style={{ padding: '8px', border: '1px solid var(--border-secondary)', borderRadius: '4px' }}>
                      {roles.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                    <select value={formData.workType} onChange={e => setFormData({...formData, workType: e.target.value})} style={{ padding: '8px', border: '1px solid var(--border-secondary)', borderRadius: '4px' }}>
                      {workTypes.map(w => <option key={w} value={w}>{w}</option>)}
                    </select>
                  </div>
                  <select value={formData.trainingLevel} onChange={e => setFormData({...formData, trainingLevel: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid var(--border-secondary)', borderRadius: '4px', marginBottom: '12px' }}>
                    {trainingLevels.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <textarea placeholder="Notes" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid var(--border-secondary)', borderRadius: '4px', minHeight: '80px', marginBottom: '12px', fontFamily: 'inherit' }} />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={addCanine} style={{ flex: 1, padding: '10px', background: 'var(--action-success)', color: 'var(--text-inverse)', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '500' }}>
                      {editingId ? 'Update' : 'Add Canine'}
                    </button>
                    <button onClick={() => { setShowForm(false); setEditingId(null); }} style={{ flex: 1, padding: '10px', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)', borderRadius: '4px', cursor: 'pointer', fontWeight: '500' }}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {!showForm && (
                <button onClick={() => setShowForm(true)} style={{ width: '100%', padding: '12px', background: 'var(--action-primary)', color: 'var(--text-inverse)', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
                  + Add Canine
                </button>
              )}
            </>
          )}

          {tab === 'health' && (
            <div>
              <h4>🏥 All Health Records</h4>
              {canines.map(dog => (
                dog.healthRecords && dog.healthRecords.length > 0 && (
                  <div key={dog.id} style={{ marginBottom: '24px' }}>
                    <h5 style={{ margin: '0 0 12px 0', color: '#1f2937' }}>🐕 {dog.name}</h5>
                    {dog.healthRecords.map(record => (
                      <div key={record.id} style={{ background: 'var(--bg-elevated)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-primary)', marginBottom: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                          <strong>{record.condition}</strong>
                          <span style={{ fontSize: '12px', background: record.severity === 'Critical' ? '#fee2e2' : record.severity === 'Moderate' ? '#fef3c7' : '#dbeafe', color: record.severity === 'Critical' ? '#991b1b' : record.severity === 'Moderate' ? '#92400e' : '#1e40af', padding: '2px 8px', borderRadius: '12px' }}>
                            {record.severity}
                          </span>
                        </div>
                        <div style={{ fontSize: '13px', lineHeight: '1.6', color: '#4b5563' }}>
                          <div>📅 {record.date}</div>
                          {record.treatment && <div>💊 Treatment: {record.treatment}</div>}
                          {record.vetNotes && <div>📝 Notes: {record.vetNotes}</div>}
                        </div>
                        <button onClick={() => deleteHealthRecord(dog.id, record.id)} style={{ marginTop: '8px', padding: '4px 12px', background: 'var(--action-danger)', color: 'var(--text-inverse)', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                )
              ))}
              {canines.every(dog => !dog.healthRecords || dog.healthRecords.length === 0) && (
                <div style={{ background: 'var(--bg-elevated)', border: '2px dashed var(--border-secondary)', borderRadius: '8px', padding: '40px 20px', textAlign: 'center' }}>
                  <p style={{ margin: 0, color: '#4b5563' }}>No health records yet. Select a canine from the list to add health records.</p>
                </div>
              )}
            </div>
          )}

          {tab === 'vaccines' && (
            <div>
              <h4>💉 All Vaccination Records</h4>
              {canines.map(dog => (
                dog.vaccineRecords && dog.vaccineRecords.length > 0 && (
                  <div key={dog.id} style={{ marginBottom: '24px' }}>
                    <h5 style={{ margin: '0 0 12px 0', color: '#1f2937' }}>🐕 {dog.name}</h5>
                    {dog.vaccineRecords.map(record => (
                      <div key={record.id} style={{ background: 'var(--bg-elevated)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-primary)', marginBottom: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                          <strong>{record.vaccineType}</strong>
                          {record.boosterDue && (
                            <span style={{ fontSize: '11px', background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: '12px' }}>
                              Booster: {record.boosterDue}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '13px', lineHeight: '1.6', color: '#4b5563' }}>
                          <div>📅 Date: {record.date}</div>
                          {record.vet && <div>🏥 Vet: {record.vet}</div>}
                          {record.notes && <div>📝 Notes: {record.notes}</div>}
                        </div>
                        <button onClick={() => deleteVaccineRecord(dog.id, record.id)} style={{ marginTop: '8px', padding: '4px 12px', background: 'var(--action-danger)', color: 'var(--text-inverse)', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                )
              ))}
              {canines.every(dog => !dog.vaccineRecords || dog.vaccineRecords.length === 0) && (
                <div style={{ background: 'var(--bg-elevated)', border: '2px dashed var(--border-secondary)', borderRadius: '8px', padding: '40px 20px', textAlign: 'center' }}>
                  <p style={{ margin: 0, color: '#4b5563' }}>No vaccination records yet. Select a canine from the list to add vaccination records.</p>
                </div>
              )}
            </div>
          )}

          {tab === 'husbandry' && (
            <div>
              <h4>🍽️ All Husbandry & Care Logs</h4>
              {canines.map(dog => (
                dog.husbandryLog && dog.husbandryLog.length > 0 && (
                  <div key={dog.id} style={{ marginBottom: '24px' }}>
                    <h5 style={{ margin: '0 0 12px 0', color: '#1f2937' }}>🐕 {dog.name}</h5>
                    {dog.husbandryLog.map(record => (
                      <div key={record.id} style={{ background: 'var(--bg-elevated)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-primary)', marginBottom: '10px' }}>
                        <div style={{ fontSize: '13px', lineHeight: '1.6', color: '#4b5563' }}>
                          <strong>{record.date}</strong>
                          <div>🍽️ Feed: {record.feedType} ({record.quantity}) - {record.frequency}</div>
                          <div>🏠 Housing: {record.housing}</div>
                          <div>🏃 Exercise: {record.exercise}</div>
                          <div>🛁 Grooming: {record.grooming}</div>
                          {record.supplements && <div>💊 Supplements: {record.supplements}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ))}
              {canines.every(dog => !dog.husbandryLog || dog.husbandryLog.length === 0) && (
                <div style={{ background: 'var(--bg-elevated)', border: '2px dashed var(--border-secondary)', borderRadius: '8px', padding: '40px 20px', textAlign: 'center' }}>
                  <p style={{ margin: 0, color: '#4b5563' }}>No husbandry logs yet. Select a canine from the list to add care records.</p>
                </div>
              )}
            </div>
          )}

          {selectedCanine && (
            <div>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <button onClick={() => setSelectedCanine(null)} style={{ padding: '8px 16px', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)', borderRadius: '4px', cursor: 'pointer', fontWeight: '500' }}>← Back</button>
                <h3 style={{ margin: 0, flex: 1 }}>🐕 {selectedCanine.name} ({selectedCanine.breed})</h3>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setShowCV(true)} style={{ padding: '8px 12px', background: '#059669', color: 'var(--text-inverse)', border: 'none', borderRadius: 6, cursor: 'pointer' }}>👁️ View CV</button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                {['info', 'health', 'vaccine', 'husbandry'].map(t => (
                  <button key={t} onClick={() => setDetailTab(t)} style={getNavTabStyle(detailTab === t)}>
                    {t === 'info' && '📋 Info'}
                    {t === 'health' && '🏥 Health'}
                    {t === 'vaccine' && '💉 Vaccines'}
                    {t === 'husbandry' && '🍽️ Husbandry'}
                  </button>
                ))}
              </div>

              {detailTab === 'info' && (
                <div style={{ background: 'var(--bg-elevated)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-primary)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div><strong>Name:</strong> {selectedCanine.name}</div>
                    <div><strong>Breed:</strong> {selectedCanine.breed}</div>
                    <div><strong>Role:</strong> {selectedCanine.role}</div>
                    <div><strong>Work Type:</strong> {selectedCanine.workType}</div>
                    <div><strong>Training Level:</strong> {selectedCanine.trainingLevel}</div>
                    <div><strong>Weight:</strong> {selectedCanine.weight} kg</div>
                    <div><strong>DOB:</strong> {selectedCanine.dob || 'Not recorded'}</div>
                    <div><strong>Sex:</strong> {selectedCanine.sex}</div>
                  </div>
                  {selectedCanine.notes && (
                    <div style={{ background: '#f9fafb', padding: '12px', borderRadius: '4px', marginBottom: '16px' }}>
                      <strong>Notes:</strong> {selectedCanine.notes}
                    </div>
                  )}
                  <button onClick={() => editCanine(selectedCanine)} style={{ padding: '10px 16px', background: 'var(--action-primary)', color: 'var(--text-inverse)', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    ✏️ Edit Details
                  </button>
                </div>
              )}

              {detailTab === 'health' && (
                <div>
                  <div style={{ background: 'var(--bg-elevated)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-primary)', marginBottom: '16px' }}>
                    <h4 style={{ marginTop: 0 }}>🏥 Add Health Record</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                      <input type="text" id="health-condition" name="condition" placeholder="Condition/Illness" value={healthForm.condition} onChange={e => setHealthForm({...healthForm, condition: e.target.value})} style={{ padding: '8px', border: '1px solid var(--border-secondary)', borderRadius: '4px' }} />
                      <select value={healthForm.severity} onChange={e => setHealthForm({...healthForm, severity: e.target.value})} style={{ padding: '8px', border: '1px solid var(--border-secondary)', borderRadius: '4px' }}>
                        <option>Minor</option>
                        <option>Moderate</option>
                        <option>Severe</option>
                      </select>
                      <input type="date" id="health-date" name="healthDate" value={healthForm.date} onChange={e => setHealthForm({...healthForm, date: e.target.value})} style={{ padding: '8px', border: '1px solid var(--border-secondary)', borderRadius: '4px' }} />
                      <input type="text" id="health-vet" name="veterinarian" placeholder="Veterinarian" value={healthForm.vet} onChange={e => setHealthForm({...healthForm, vet: e.target.value})} style={{ padding: '8px', border: '1px solid var(--border-secondary)', borderRadius: '4px' }} />
                    </div>
                    <textarea placeholder="Treatment & Notes" value={healthForm.treatment} onChange={e => setHealthForm({...healthForm, treatment: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid var(--border-secondary)', borderRadius: '4px', minHeight: '80px', marginBottom: '12px', fontFamily: 'inherit' }} />
                    <button onClick={() => addHealthRecord(selectedCanine.id)} style={{ padding: '10px 16px', background: 'var(--action-success)', color: 'var(--text-inverse)', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '500' }}>
                      + Record Health Issue
                    </button>
                  </div>

                  {selectedCanine.healthRecords && selectedCanine.healthRecords.length > 0 && (
                    <div>
                      <h4>📋 Health History</h4>
                      {selectedCanine.healthRecords.map(record => (
                        <div key={record.id} style={{ background: 'var(--bg-elevated)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-primary)', marginBottom: '10px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <div>
                              <strong>{record.condition}</strong> ({record.severity})
                              <div style={{ fontSize: '12px', color: '#4b5563', marginTop: '4px' }}>
                                {record.date} {record.vet && `- Dr. ${record.vet}`}
                              </div>
                              {record.treatment && <div style={{ fontSize: '13px', marginTop: '6px', color: '#374151' }}>{record.treatment}</div>}
                            </div>
                            <button onClick={() => deleteHealthRecord(selectedCanine.id, record.id)} style={{ padding: '4px 8px', background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '12px' }}>
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {detailTab === 'vaccine' && (
                <div>
                  <div style={{ background: 'var(--bg-elevated)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-primary)', marginBottom: '16px' }}>
                    <h4 style={{ marginTop: 0 }}>💉 Record Vaccination</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                      <select value={vaccineForm.vaccineType} onChange={e => setVaccineForm({...vaccineForm, vaccineType: e.target.value})} style={{ padding: '8px', border: '1px solid var(--border-secondary)', borderRadius: '4px' }}>
                        <option>Rabies</option>
                        <option>DHPP (Distemper)</option>
                        <option>Bordetella</option>
                        <option>Leptospirosis</option>
                        <option>Other</option>
                      </select>
                      <input type="date" id="vaccine-date" name="vaccineDate" value={vaccineForm.date} onChange={e => setVaccineForm({...vaccineForm, date: e.target.value})} style={{ padding: '8px', border: '1px solid var(--border-secondary)', borderRadius: '4px' }} />
                      <input type="text" id="vaccine-vet" name="vaccineVeterinarian" placeholder="Veterinarian" value={vaccineForm.vet} onChange={e => setVaccineForm({...vaccineForm, vet: e.target.value})} style={{ padding: '8px', border: '1px solid var(--border-secondary)', borderRadius: '4px' }} />
                      <input type="date" id="vaccine-booster-due" name="boosterDue" placeholder="Booster Due" value={vaccineForm.boosterDue} onChange={e => setVaccineForm({...vaccineForm, boosterDue: e.target.value})} style={{ padding: '8px', border: '1px solid var(--border-secondary)', borderRadius: '4px' }} />
                    </div>
                    <textarea placeholder="Notes" value={vaccineForm.notes} onChange={e => setVaccineForm({...vaccineForm, notes: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid var(--border-secondary)', borderRadius: '4px', minHeight: '60px', marginBottom: '12px', fontFamily: 'inherit' }} />
                    <button onClick={() => addVaccineRecord(selectedCanine.id)} style={{ padding: '10px 16px', background: 'var(--action-success)', color: 'var(--text-inverse)', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '500' }}>
                      + Record Vaccine
                    </button>
                  </div>

                  {selectedCanine.vaccineRecords && selectedCanine.vaccineRecords.length > 0 && (
                    <div>
                      <h4>📋 Vaccination Records</h4>
                      {selectedCanine.vaccineRecords.map(record => (
                        <div key={record.id} style={{ background: 'var(--bg-elevated)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-primary)', marginBottom: '10px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <div>
                              <strong>{record.vaccineType}</strong>
                              <div style={{ fontSize: '12px', color: '#4b5563', marginTop: '4px' }}>
                                Given: {record.date} {record.vet && `by Dr. ${record.vet}`}
                              </div>
                              {record.boosterDue && <div style={{ fontSize: '12px', color: '#d97706', marginTop: '4px' }}>⚠️ Booster due: {record.boosterDue}</div>}
                            </div>
                            <button onClick={() => deleteVaccineRecord(selectedCanine.id, record.id)} style={{ padding: '4px 8px', background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '12px' }}>
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {detailTab === 'husbandry' && (
                <div>
                  <div style={{ background: 'var(--bg-elevated)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-primary)', marginBottom: '16px' }}>
                    <h4 style={{ marginTop: 0 }}>🍽️ Husbandry Record</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                      <input type="text" id="husbandry-feed-type" name="feedType" placeholder="Feed Type" value={husbandryForm.feedType} onChange={e => setHusbandryForm({...husbandryForm, feedType: e.target.value})} style={{ padding: '8px', border: '1px solid var(--border-secondary)', borderRadius: '4px' }} />
                      <input type="text" id="husbandry-quantity" name="quantity" placeholder="Quantity per meal" value={husbandryForm.quantity} onChange={e => setHusbandryForm({...husbandryForm, quantity: e.target.value})} style={{ padding: '8px', border: '1px solid var(--border-secondary)', borderRadius: '4px' }} />
                      <select value={husbandryForm.frequency} onChange={e => setHusbandryForm({...husbandryForm, frequency: e.target.value})} style={{ padding: '8px', border: '1px solid var(--border-secondary)', borderRadius: '4px' }}>
                        <option>Once Daily</option>
                        <option>Twice Daily</option>
                        <option>Thrice Daily</option>
                      </select>
                      <input type="text" id="husbandry-housing" name="housing" placeholder="Housing/Shelter" value={husbandryForm.housing} onChange={e => setHusbandryForm({...husbandryForm, housing: e.target.value})} style={{ padding: '8px', border: '1px solid var(--border-secondary)', borderRadius: '4px' }} />
                      <select value={husbandryForm.exercise} onChange={e => setHusbandryForm({...husbandryForm, exercise: e.target.value})} style={{ padding: '8px', border: '1px solid var(--border-secondary)', borderRadius: '4px' }}>
                        <option>Minimal</option>
                        <option>Moderate</option>
                        <option>Active</option>
                        <option>Very Active</option>
                      </select>
                      <select value={husbandryForm.grooming} onChange={e => setHusbandryForm({...husbandryForm, grooming: e.target.value})} style={{ padding: '8px', border: '1px solid var(--border-secondary)', borderRadius: '4px' }}>
                        <option>Weekly</option>
                        <option>Bi-weekly</option>
                        <option>Monthly</option>
                        <option>As needed</option>
                      </select>
                    </div>
                    <input type="text" id="husbandry-supplements" name="supplements" placeholder="Supplements/Vitamins" value={husbandryForm.supplements} onChange={e => setHusbandryForm({...husbandryForm, supplements: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid var(--border-secondary)', borderRadius: '4px', marginBottom: '12px' }} />
                    <button onClick={() => addHusbandryRecord(selectedCanine.id)} style={{ padding: '10px 16px', background: 'var(--action-success)', color: 'var(--text-inverse)', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '500' }}>
                      + Log Husbandry
                    </button>
                  </div>

                  {selectedCanine.husbandryLog && selectedCanine.husbandryLog.length > 0 && (
                    <div>
                      <h4>📋 Husbandry Log</h4>
                      {selectedCanine.husbandryLog.map(record => (
                        <div key={record.id} style={{ background: 'var(--bg-elevated)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-primary)', marginBottom: '10px' }}>
                          <div style={{ fontSize: '13px', lineHeight: '1.6' }}>
                            <strong>{record.date}</strong>
                            <div>🍽️ Feed: {record.feedType} ({record.quantity}) - {record.frequency}</div>
                            <div>🏠 Housing: {record.housing}</div>
                            <div>🏃 Exercise: {record.exercise}</div>
                            <div>🛁 Grooming: {record.grooming}</div>
                            {record.supplements && <div>💊 Supplements: {record.supplements}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
      {showCV && selectedCanine && (
        <AnimalCV
          animal={selectedCanine}
          groups={[{ id: 'G-008', name: 'Canines' }]}
          onClose={() => setShowCV(false)}
          onDownloadJSON={() => downloadAnimalJSON(selectedCanine)}
        />
      )}
    </div>
  );
}
