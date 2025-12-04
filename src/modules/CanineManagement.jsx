import React, { useState } from 'react'

export default function CanineManagement({ animals, setAnimals }) {
  const canines = animals.filter(a => a.groupId === 'G-004')
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

  const addCanine = () => {
    if (!formData.name.trim()) return
    
    const newCanine = {
      id: 'C-' + Math.floor(10000 + Math.random() * 90000),
      tag: formData.name.substring(0, 3).toUpperCase() + '-' + Date.now().toString().slice(-4),
      groupId: 'G-004',
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
    if (!healthForm.condition.trim()) return
    setAnimals(animals.map(a => a.id === canineId ? {
      ...a,
      healthRecords: [...(a.healthRecords || []), { ...healthForm, id: Date.now() }]
    } : a))
    setHealthForm({ condition: '', severity: 'Minor', date: new Date().toISOString().split('T')[0], treatment: '', vetNotes: '' })
  }

  const addVaccineRecord = (canineId) => {
    setAnimals(animals.map(a => a.id === canineId ? {
      ...a,
      vaccineRecords: [...(a.vaccineRecords || []), { ...vaccineForm, id: Date.now() }]
    } : a))
    setVaccineForm({ vaccineType: 'Rabies', date: new Date().toISOString().split('T')[0], vet: '', boosterDue: '', notes: '' })
  }

  const addHusbandryRecord = (canineId) => {
    setAnimals(animals.map(a => a.id === canineId ? {
      ...a,
      husbandryLog: [...(a.husbandryLog || []), { ...husbandryForm, id: Date.now(), date: new Date().toISOString().split('T')[0] }]
    } : a))
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
    <div style={{ padding: '20px', background: '#f9fafb', borderRadius: '8px' }}>
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ marginTop: 0 }}>🐕 Canine Management</h3>
        <p style={{ color: '#666', fontSize: '14px' }}>Comprehensive dog management with health, vaccination, and husbandry tracking</p>
      </div>

      {/* Top-Level Tabs */}
      <div style={{ marginBottom: '20px', borderBottom: '2px solid #e5e7eb' }}>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          <button onClick={() => setTab('list')} style={{ padding: '12px 20px', border: 'none', borderBottom: tab === 'list' ? '3px solid #3b82f6' : '3px solid transparent', background: tab === 'list' ? '#eff6ff' : 'transparent', color: tab === 'list' ? '#3b82f6' : '#6b7280', fontWeight: tab === 'list' ? '600' : '400', cursor: 'pointer' }}>
            📋 Canine List
          </button>
          <button onClick={() => setTab('health')} style={{ padding: '12px 20px', border: 'none', borderBottom: tab === 'health' ? '3px solid #3b82f6' : '3px solid transparent', background: tab === 'health' ? '#eff6ff' : 'transparent', color: tab === 'health' ? '#3b82f6' : '#6b7280', fontWeight: tab === 'health' ? '600' : '400', cursor: 'pointer' }}>
            🏥 Health Records
          </button>
          <button onClick={() => setTab('vaccines')} style={{ padding: '12px 20px', border: 'none', borderBottom: tab === 'vaccines' ? '3px solid #3b82f6' : '3px solid transparent', background: tab === 'vaccines' ? '#eff6ff' : 'transparent', color: tab === 'vaccines' ? '#3b82f6' : '#6b7280', fontWeight: tab === 'vaccines' ? '600' : '400', cursor: 'pointer' }}>
            💉 Vaccinations
          </button>
          <button onClick={() => setTab('husbandry')} style={{ padding: '12px 20px', border: 'none', borderBottom: tab === 'husbandry' ? '3px solid #3b82f6' : '3px solid transparent', background: tab === 'husbandry' ? '#eff6ff' : 'transparent', color: tab === 'husbandry' ? '#3b82f6' : '#6b7280', fontWeight: tab === 'husbandry' ? '600' : '400', cursor: 'pointer' }}>
            🍽️ Husbandry & Care
          </button>
        </div>
      </div>

      {tab === 'list' && (
        <>
          {canines.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
                {canines.map(dog => (
                  <div key={dog.id} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '14px', transition: 'all 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    {inlineEditId === dog.id ? (
                      <div onKeyDown={handleKeyDown} style={{display:'flex',flexDirection:'column',gap:8}}>
                        <input value={inlineData.name} onChange={e=>setInlineData({...inlineData,name:e.target.value})} placeholder="Name" style={{padding:'6px',border:'1px solid #d1d5db',borderRadius:4,fontSize:13}} autoFocus />
                        <select value={inlineData.role} onChange={e=>setInlineData({...inlineData,role:e.target.value})} style={{padding:'6px',border:'1px solid #d1d5db',borderRadius:4,fontSize:13}}>
                          {roles.map(r=><option key={r}>{r}</option>)}
                        </select>
                        <select value={inlineData.trainingLevel} onChange={e=>setInlineData({...inlineData,trainingLevel:e.target.value})} style={{padding:'6px',border:'1px solid #d1d5db',borderRadius:4,fontSize:13}}>
                          {trainingLevels.map(t=><option key={t}>{t}</option>)}
                        </select>
                        <input type="number" value={inlineData.weight} onChange={e=>setInlineData({...inlineData,weight:e.target.value})} placeholder="Weight (kg)" style={{padding:'6px',border:'1px solid #d1d5db',borderRadius:4,fontSize:13}} />
                        <div style={{display:'flex',gap:4}}>
                          <button onClick={saveInlineEdit} style={{flex:1,padding:'6px',background:'#10b981',color:'#fff',border:'none',borderRadius:4,fontSize:11}}>✓ Save</button>
                          <button onClick={cancelInlineEdit} style={{flex:1,padding:'6px',background:'#ef4444',color:'#fff',border:'none',borderRadius:4,fontSize:11}}>✕ Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div style={{cursor:'pointer'}} onClick={() => setSelectedCanine(dog)}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                          <div>
                        <h4 style={{ margin: '0 0 4px 0', color: '#1f2937' }}>{dog.name}</h4>
                        <p style={{ margin: '0', fontSize: '12px', color: '#666' }}>{dog.breed || 'Mixed'}</p>
                      </div>
                      <span style={{ background: '#d1fae5', color: '#065f46', padding: '3px 6px', borderRadius: '3px', fontSize: '11px', fontWeight: '500' }}>
                        {dog.role || 'Guard'}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '8px', lineHeight: '1.5' }}>
                      <div>Training: {dog.trainingLevel || 'Basic'}</div>
                      <div>Work: {dog.workType || 'Herding'}</div>
                      <div>Weight: {dog.weight || 'N/A'} kg</div>
                    </div>
                    <div style={{ marginTop: '8px', display: 'flex', gap: '4px' }}>
                      <button onClick={(e) => { e.stopPropagation(); startInlineEdit(dog); }} style={{ flex: 1, padding: '4px 8px', background: '#ffffcc', color: '#333', border: '1px solid #ffdd00', borderRadius: '3px', fontSize: '11px', cursor: 'pointer', fontWeight: '500' }}>⚡ Quick</button>
                      <button onClick={(e) => { e.stopPropagation(); editCanine(dog); }} style={{ flex: 1, padding: '4px 8px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '3px', fontSize: '11px', cursor: 'pointer' }}>✏️</button>
                      <button onClick={(e) => { e.stopPropagation(); deleteCanine(dog.id); }} style={{ flex: 1, padding: '4px 8px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '3px', fontSize: '11px', cursor: 'pointer' }}>🗑️</button>
                    </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {canines.length === 0 && !showForm && (
            <div style={{ background: 'white', border: '2px dashed #d1d5db', borderRadius: '8px', padding: '40px 20px', textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>🐕</div>
              <p style={{ margin: '0', color: '#666' }}>No canines registered yet</p>
            </div>
          )}

          {showForm && (
            <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
              <h4>{editingId ? 'Edit Canine' : 'Add New Canine'}</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <input type="text" placeholder="Dog name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }} />
                <input type="text" placeholder="Breed" value={formData.breed} onChange={e => setFormData({...formData, breed: e.target.value})} style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label htmlFor="dob" style={{ fontSize: '13px', marginBottom: '4px', fontWeight: '500' }}>Date of Birth</label>
                  <input id="dob" type="date" value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }} />
                </div>
                <input type="number" placeholder="Weight (kg)" value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }} />
                <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}>
                  {roles.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <select value={formData.workType} onChange={e => setFormData({...formData, workType: e.target.value})} style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}>
                  {workTypes.map(w => <option key={w} value={w}>{w}</option>)}
                </select>
              </div>
              <select value={formData.trainingLevel} onChange={e => setFormData({...formData, trainingLevel: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', marginBottom: '12px' }}>
                {trainingLevels.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <textarea placeholder="Notes" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', minHeight: '80px', marginBottom: '12px', fontFamily: 'inherit' }} />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={addCanine} style={{ flex: 1, padding: '10px', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '500' }}>
                  {editingId ? 'Update' : 'Add Canine'}
                </button>
                <button onClick={() => { setShowForm(false); setEditingId(null); }} style={{ flex: 1, padding: '10px', background: '#e5e7eb', color: '#374151', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '500' }}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {!showForm && (
            <button onClick={() => setShowForm(true)} style={{ width: '100%', padding: '12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
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
                  <div key={record.id} style={{ background: 'white', padding: '12px', borderRadius: '6px', border: '1px solid #e5e7eb', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                      <strong>{record.condition}</strong>
                      <span style={{ fontSize: '12px', background: record.severity === 'Critical' ? '#fee2e2' : record.severity === 'Moderate' ? '#fef3c7' : '#dbeafe', color: record.severity === 'Critical' ? '#991b1b' : record.severity === 'Moderate' ? '#92400e' : '#1e40af', padding: '2px 8px', borderRadius: '12px' }}>
                        {record.severity}
                      </span>
                    </div>
                    <div style={{ fontSize: '13px', lineHeight: '1.6', color: '#666' }}>
                      <div>📅 {record.date}</div>
                      {record.treatment && <div>💊 Treatment: {record.treatment}</div>}
                      {record.vetNotes && <div>📝 Notes: {record.vetNotes}</div>}
                    </div>
                    <button onClick={() => deleteHealthRecord(dog.id, record.id)} style={{ marginTop: '8px', padding: '4px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )
          ))}
          {canines.every(dog => !dog.healthRecords || dog.healthRecords.length === 0) && (
            <div style={{ background: 'white', border: '2px dashed #d1d5db', borderRadius: '8px', padding: '40px 20px', textAlign: 'center' }}>
              <p style={{ margin: 0, color: '#666' }}>No health records yet. Select a canine from the list to add health records.</p>
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
                  <div key={record.id} style={{ background: 'white', padding: '12px', borderRadius: '6px', border: '1px solid #e5e7eb', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                      <strong>{record.vaccineType}</strong>
                      {record.boosterDue && (
                        <span style={{ fontSize: '11px', background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: '12px' }}>
                          Booster: {record.boosterDue}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '13px', lineHeight: '1.6', color: '#666' }}>
                      <div>📅 Date: {record.date}</div>
                      {record.vet && <div>🏥 Vet: {record.vet}</div>}
                      {record.notes && <div>📝 Notes: {record.notes}</div>}
                    </div>
                    <button onClick={() => deleteVaccineRecord(dog.id, record.id)} style={{ marginTop: '8px', padding: '4px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )
          ))}
          {canines.every(dog => !dog.vaccineRecords || dog.vaccineRecords.length === 0) && (
            <div style={{ background: 'white', border: '2px dashed #d1d5db', borderRadius: '8px', padding: '40px 20px', textAlign: 'center' }}>
              <p style={{ margin: 0, color: '#666' }}>No vaccination records yet. Select a canine from the list to add vaccination records.</p>
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
                  <div key={record.id} style={{ background: 'white', padding: '12px', borderRadius: '6px', border: '1px solid #e5e7eb', marginBottom: '10px' }}>
                    <div style={{ fontSize: '13px', lineHeight: '1.6', color: '#666' }}>
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
            <div style={{ background: 'white', border: '2px dashed #d1d5db', borderRadius: '8px', padding: '40px 20px', textAlign: 'center' }}>
              <p style={{ margin: 0, color: '#666' }}>No husbandry logs yet. Select a canine from the list to add care records.</p>
            </div>
          )}
        </div>
      )}

      {selectedCanine && (
        <div>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <button onClick={() => setSelectedCanine(null)} style={{ padding: '8px 16px', background: '#e5e7eb', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '500' }}>← Back</button>
            <h3 style={{ margin: 0, flex: 1 }}>🐕 {selectedCanine.name} ({selectedCanine.breed})</h3>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '2px solid #e5e7eb' }}>
            {['info', 'health', 'vaccine', 'husbandry'].map(t => (
              <button key={t} onClick={() => setDetailTab(t)} style={{ padding: '10px 16px', border: 'none', borderBottom: detailTab === t ? '3px solid #3b82f6' : 'none', background: detailTab === t ? '#eff6ff' : 'transparent', color: detailTab === t ? '#3b82f6' : '#666', cursor: 'pointer', fontWeight: detailTab === t ? '600' : '400', fontSize: '14px' }}>
                {t === 'info' && '📋 Info'}
                {t === 'health' && '🏥 Health'}
                {t === 'vaccine' && '💉 Vaccines'}
                {t === 'husbandry' && '🍽️ Husbandry'}
              </button>
            ))}
          </div>

          {detailTab === 'info' && (
            <div style={{ background: 'white', padding: '16px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
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
              <button onClick={() => editCanine(selectedCanine)} style={{ padding: '10px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                ✏️ Edit Details
              </button>
            </div>
          )}

          {detailTab === 'health' && (
            <div>
              <div style={{ background: 'white', padding: '16px', borderRadius: '8px', border: '1px solid #e5e7eb', marginBottom: '16px' }}>
                <h4 style={{ marginTop: 0 }}>🏥 Add Health Record</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <input type="text" placeholder="Condition/Illness" value={healthForm.condition} onChange={e => setHealthForm({...healthForm, condition: e.target.value})} style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }} />
                  <select value={healthForm.severity} onChange={e => setHealthForm({...healthForm, severity: e.target.value})} style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}>
                    <option>Minor</option>
                    <option>Moderate</option>
                    <option>Severe</option>
                  </select>
                  <input type="date" value={healthForm.date} onChange={e => setHealthForm({...healthForm, date: e.target.value})} style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }} />
                  <input type="text" placeholder="Veterinarian" value={healthForm.vet} onChange={e => setHealthForm({...healthForm, vet: e.target.value})} style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }} />
                </div>
                <textarea placeholder="Treatment & Notes" value={healthForm.treatment} onChange={e => setHealthForm({...healthForm, treatment: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', minHeight: '80px', marginBottom: '12px', fontFamily: 'inherit' }} />
                <button onClick={() => addHealthRecord(selectedCanine.id)} style={{ padding: '10px 16px', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '500' }}>
                  + Record Health Issue
                </button>
              </div>

              {selectedCanine.healthRecords && selectedCanine.healthRecords.length > 0 && (
                <div>
                  <h4>📋 Health History</h4>
                  {selectedCanine.healthRecords.map(record => (
                    <div key={record.id} style={{ background: 'white', padding: '12px', borderRadius: '6px', border: '1px solid #e5e7eb', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div>
                          <strong>{record.condition}</strong> ({record.severity})
                          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
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
              <div style={{ background: 'white', padding: '16px', borderRadius: '8px', border: '1px solid #e5e7eb', marginBottom: '16px' }}>
                <h4 style={{ marginTop: 0 }}>💉 Record Vaccination</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <select value={vaccineForm.vaccineType} onChange={e => setVaccineForm({...vaccineForm, vaccineType: e.target.value})} style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}>
                    <option>Rabies</option>
                    <option>DHPP (Distemper)</option>
                    <option>Bordetella</option>
                    <option>Leptospirosis</option>
                    <option>Other</option>
                  </select>
                  <input type="date" value={vaccineForm.date} onChange={e => setVaccineForm({...vaccineForm, date: e.target.value})} style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }} />
                  <input type="text" placeholder="Veterinarian" value={vaccineForm.vet} onChange={e => setVaccineForm({...vaccineForm, vet: e.target.value})} style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }} />
                  <input type="date" placeholder="Booster Due" value={vaccineForm.boosterDue} onChange={e => setVaccineForm({...vaccineForm, boosterDue: e.target.value})} style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }} />
                </div>
                <textarea placeholder="Notes" value={vaccineForm.notes} onChange={e => setVaccineForm({...vaccineForm, notes: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', minHeight: '60px', marginBottom: '12px', fontFamily: 'inherit' }} />
                <button onClick={() => addVaccineRecord(selectedCanine.id)} style={{ padding: '10px 16px', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '500' }}>
                  + Record Vaccine
                </button>
              </div>

              {selectedCanine.vaccineRecords && selectedCanine.vaccineRecords.length > 0 && (
                <div>
                  <h4>📋 Vaccination Records</h4>
                  {selectedCanine.vaccineRecords.map(record => (
                    <div key={record.id} style={{ background: 'white', padding: '12px', borderRadius: '6px', border: '1px solid #e5e7eb', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div>
                          <strong>{record.vaccineType}</strong>
                          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
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
              <div style={{ background: 'white', padding: '16px', borderRadius: '8px', border: '1px solid #e5e7eb', marginBottom: '16px' }}>
                <h4 style={{ marginTop: 0 }}>🍽️ Husbandry Record</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <input type="text" placeholder="Feed Type" value={husbandryForm.feedType} onChange={e => setHusbandryForm({...husbandryForm, feedType: e.target.value})} style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }} />
                  <input type="text" placeholder="Quantity per meal" value={husbandryForm.quantity} onChange={e => setHusbandryForm({...husbandryForm, quantity: e.target.value})} style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }} />
                  <select value={husbandryForm.frequency} onChange={e => setHusbandryForm({...husbandryForm, frequency: e.target.value})} style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}>
                    <option>Once Daily</option>
                    <option>Twice Daily</option>
                    <option>Thrice Daily</option>
                  </select>
                  <input type="text" placeholder="Housing/Shelter" value={husbandryForm.housing} onChange={e => setHusbandryForm({...husbandryForm, housing: e.target.value})} style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }} />
                  <select value={husbandryForm.exercise} onChange={e => setHusbandryForm({...husbandryForm, exercise: e.target.value})} style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}>
                    <option>Minimal</option>
                    <option>Moderate</option>
                    <option>Active</option>
                    <option>Very Active</option>
                  </select>
                  <select value={husbandryForm.grooming} onChange={e => setHusbandryForm({...husbandryForm, grooming: e.target.value})} style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}>
                    <option>Weekly</option>
                    <option>Bi-weekly</option>
                    <option>Monthly</option>
                    <option>As needed</option>
                  </select>
                </div>
                <input type="text" placeholder="Supplements/Vitamins" value={husbandryForm.supplements} onChange={e => setHusbandryForm({...husbandryForm, supplements: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', marginBottom: '12px' }} />
                <button onClick={() => addHusbandryRecord(selectedCanine.id)} style={{ padding: '10px 16px', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '500' }}>
                  + Log Husbandry
                </button>
              </div>

              {selectedCanine.husbandryLog && selectedCanine.husbandryLog.length > 0 && (
                <div>
                  <h4>📋 Husbandry Log</h4>
                  {selectedCanine.husbandryLog.map(record => (
                    <div key={record.id} style={{ background: 'white', padding: '12px', borderRadius: '6px', border: '1px solid #e5e7eb', marginBottom: '10px' }}>
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
      {toast && (
        <div style={{position:'fixed',bottom:20,right:20,padding:'12px 20px',background:toast.type==='error'?'#ef4444':'#10b981',color:'#fff',borderRadius:8,boxShadow:'0 4px 12px rgba(0,0,0,0.15)',zIndex:10000,display:'flex',gap:12}}>
          <span>{toast.message}</span>
          {toast.showUndo && <button onClick={undoLastChange} style={{background:'rgba(255,255,255,0.2)',border:'1px solid rgba(255,255,255,0.3)',color:'#fff',padding:'4px 12px',borderRadius:4,cursor:'pointer'}}>↶ Undo</button>}
        </div>
      )}
    </div>
  )
}
