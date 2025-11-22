import React, { useState } from 'react'

export default function CanineManagement({ animals, setAnimals }) {
  const canines = animals.filter(a => a.groupId === 'G-004')
  const [showForm, setShowForm] = useState(false)
  const [selectedCanine, setSelectedCanine] = useState(null)
  const [activeTab, setActiveTab] = useState('list')
  const [editingId, setEditingId] = useState(null)

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
    setActiveTab('list')
  }

  return (
    <div style={{ padding: '20px', background: '#f9fafb', borderRadius: '8px' }}>
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ marginTop: 0 }}>🐕 Canine Management</h3>
        <p style={{ color: '#666', fontSize: '14px' }}>Comprehensive dog management with health, vaccination, and husbandry tracking</p>
      </div>

      {!selectedCanine ? (
        <>
          {canines.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
                {canines.map(dog => (
                  <div key={dog.id} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '14px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }} onClick={() => setSelectedCanine(dog)}>
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
                      <button onClick={(e) => { e.stopPropagation(); editCanine(dog); }} style={{ flex: 1, padding: '4px 8px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '3px', fontSize: '11px', cursor: 'pointer' }}>✏️</button>
                      <button onClick={(e) => { e.stopPropagation(); deleteCanine(dog.id); }} style={{ flex: 1, padding: '4px 8px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '3px', fontSize: '11px', cursor: 'pointer' }}>🗑️</button>
                    </div>
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
                <input type="date" value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }} />
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
      ) : (
        <div>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <button onClick={() => setSelectedCanine(null)} style={{ padding: '8px 16px', background: '#e5e7eb', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '500' }}>← Back</button>
            <h3 style={{ margin: 0, flex: 1 }}>🐕 {selectedCanine.name} ({selectedCanine.breed})</h3>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '2px solid #e5e7eb' }}>
            {['info', 'health', 'vaccine', 'husbandry'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '10px 16px', border: 'none', borderBottom: activeTab === tab ? '3px solid #3b82f6' : 'none', background: activeTab === tab ? '#eff6ff' : 'transparent', color: activeTab === tab ? '#3b82f6' : '#666', cursor: 'pointer', fontWeight: activeTab === tab ? '600' : '400', fontSize: '14px' }}>
                {tab === 'info' && '📋 Info'}
                {tab === 'health' && '🏥 Health'}
                {tab === 'vaccine' && '💉 Vaccines'}
                {tab === 'husbandry' && '🍽️ Husbandry'}
              </button>
            ))}
          </div>

          {activeTab === 'info' && (
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

          {activeTab === 'health' && (
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

          {activeTab === 'vaccine' && (
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

          {activeTab === 'husbandry' && (
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
    </div>
  )
}
