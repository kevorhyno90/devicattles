import React, { useEffect, useState } from 'react'

export default function CanineManagement({ animals, setAnimals }) {
  const canines = animals.filter(a => a.groupId === 'G-004')
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    breed: '',
    role: 'Guard Dog',
    workType: 'Herding',
    trainingLevel: 'Basic',
    healthStatus: 'Healthy',
    vaccinated: false,
    lastVetCheckup: '',
    notes: ''
  })
  const [editingId, setEditingId] = useState(null)

  const roles = ['Guard Dog', 'Herding Dog', 'Working Dog', 'Family Dog', 'Breeding Female', 'Breeding Male']
  const workTypes = ['Herding', 'Protection', 'Tracking', 'Patrol', 'Farm Work', 'None']
  const trainingLevels = ['None', 'Basic', 'Intermediate', 'Advanced', 'Professional']

  const addCanine = () => {
    if (!formData.name.trim()) return
    
    const animal = animals.find(a => a.id === editingId)
    const updatedData = {
      ...formData,
      groupId: 'G-004',
      type: 'Canine',
      lactationStatus: 'NA',
      pregnancyStatus: 'NA'
    }

    if (editingId && animal) {
      setAnimals(animals.map(a => a.id === editingId ? { ...a, ...updatedData } : a))
      setEditingId(null)
    } else {
      const newCanine = {
        id: 'C-' + Math.floor(10000 + Math.random() * 90000),
        tag: formData.name.substring(0, 3).toUpperCase() + '-' + Date.now().toString().slice(-4),
        breed: formData.breed || 'Mixed',
        sex: 'M',
        dob: '',
        weight: '',
        status: 'Active',
        owner: 'Farm Owner',
        registrationNumber: '',
        photos: [],
        vaccineRecords: [],
        medicalHistory: [],
        performanceNotes: [],
        ...updatedData
      }
      setAnimals([...animals, newCanine])
    }

    setFormData({
      name: '',
      breed: '',
      role: 'Guard Dog',
      workType: 'Herding',
      trainingLevel: 'Basic',
      healthStatus: 'Healthy',
      vaccinated: false,
      lastVetCheckup: '',
      notes: ''
    })
    setShowForm(false)
  }

  const deleteCanine = (id) => {
    if (window.confirm('Delete this canine?')) {
      setAnimals(animals.filter(a => a.id !== id))
    }
  }

  const editCanine = (canine) => {
    setFormData({
      name: canine.name,
      breed: canine.breed,
      role: canine.role || 'Guard Dog',
      workType: canine.workType || 'Herding',
      trainingLevel: canine.trainingLevel || 'Basic',
      healthStatus: canine.healthStatus || 'Healthy',
      vaccinated: canine.vaccinated || false,
      lastVetCheckup: canine.lastVetCheckup || '',
      notes: canine.notes || ''
    })
    setEditingId(canine.id)
    setShowForm(true)
  }

  const updateHealthStatus = (id, status) => {
    setAnimals(animals.map(a => 
      a.id === id ? { ...a, healthStatus: status } : a
    ))
  }

  const recordVaccine = (id) => {
    const date = new Date().toISOString().split('T')[0]
    setAnimals(animals.map(a =>
      a.id === id ? {
        ...a,
        vaccineRecords: [...(a.vaccineRecords || []), { date, type: 'Annual Checkup' }],
        vaccinated: true,
        lastVetCheckup: date
      } : a
    ))
  }

  return (
    <div style={{ padding: '20px', background: '#f9fafb', borderRadius: '8px' }}>
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ marginTop: 0 }}>🐕 Canine Management</h3>
        <p style={{ color: '#666', fontSize: '14px' }}>Track dogs, guard dogs, herding dogs, and working canines on your farm</p>
      </div>

      {canines.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {canines.map(dog => (
              <div key={dog.id} style={{
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '16px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', color: '#1f2937' }}>{dog.name}</h4>
                    <p style={{ margin: '0', fontSize: '13px', color: '#666' }}>{dog.breed}</p>
                  </div>
                  <span style={{
                    background: dog.healthStatus === 'Healthy' ? '#d1fae5' : '#fee2e2',
                    color: dog.healthStatus === 'Healthy' ? '#065f46' : '#991b1b',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}>
                    {dog.healthStatus || 'Healthy'}
                  </span>
                </div>

                <div style={{ fontSize: '13px', color: '#666', marginBottom: '12px', lineHeight: '1.6' }}>
                  <div><strong>Role:</strong> {dog.role || 'Guard Dog'}</div>
                  <div><strong>Work:</strong> {dog.workType || 'Herding'}</div>
                  <div><strong>Training:</strong> {dog.trainingLevel || 'Basic'}</div>
                  <div><strong>Last Vet:</strong> {dog.lastVetCheckup || 'Not recorded'}</div>
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => editCanine(dog)}
                    style={{
                      flex: 1,
                      minWidth: '70px',
                      padding: '6px 12px',
                      background: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => recordVaccine(dog.id)}
                    style={{
                      flex: 1,
                      minWidth: '70px',
                      padding: '6px 12px',
                      background: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}
                  >
                    💉 Vaccine
                  </button>
                  <button
                    onClick={() => deleteCanine(dog.id)}
                    style={{
                      flex: 1,
                      minWidth: '70px',
                      padding: '6px 12px',
                      background: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {canines.length === 0 && !showForm && (
        <div style={{
          background: 'white',
          border: '2px dashed #d1d5db',
          borderRadius: '8px',
          padding: '40px 20px',
          textAlign: 'center',
          marginBottom: '20px'
        }}>
          <div style={{ fontSize: '32px', marginBottom: '10px' }}>🐕</div>
          <p style={{ margin: '0', color: '#666' }}>No canines registered yet</p>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#999' }}>Add your first canine to get started</p>
        </div>
      )}

      {showForm && (
        <div style={{
          background: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '20px'
        }}>
          <h4>{editingId ? 'Edit Canine' : 'Add New Canine'}</h4>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <input
              type="text"
              placeholder="Dog name"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
            />
            <input
              type="text"
              placeholder="Breed"
              value={formData.breed}
              onChange={e => setFormData({...formData, breed: e.target.value})}
              style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
            />
            
            <select
              value={formData.role}
              onChange={e => setFormData({...formData, role: e.target.value})}
              style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
            >
              {roles.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            
            <select
              value={formData.workType}
              onChange={e => setFormData({...formData, workType: e.target.value})}
              style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
            >
              {workTypes.map(w => <option key={w} value={w}>{w}</option>)}
            </select>

            <select
              value={formData.trainingLevel}
              onChange={e => setFormData({...formData, trainingLevel: e.target.value})}
              style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
            >
              {trainingLevels.map(t => <option key={t} value={t}>{t}</option>)}
            </select>

            <input
              type="date"
              placeholder="Last vet checkup"
              value={formData.lastVetCheckup}
              onChange={e => setFormData({...formData, lastVetCheckup: e.target.value})}
              style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
            />
          </div>

          <textarea
            placeholder="Notes about this canine (temperament, duties, special needs, etc.)"
            value={formData.notes}
            onChange={e => setFormData({...formData, notes: e.target.value})}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              minHeight: '80px',
              marginBottom: '12px',
              fontFamily: 'inherit'
            }}
          />

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <input
              type="checkbox"
              checked={formData.vaccinated}
              onChange={e => setFormData({...formData, vaccinated: e.target.checked})}
            />
            <span>Vaccinated</span>
          </label>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={addCanine}
              style={{
                flex: 1,
                padding: '10px 16px',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              {editingId ? 'Update Canine' : 'Add Canine'}
            </button>
            <button
              onClick={() => {
                setShowForm(false)
                setEditingId(null)
                setFormData({
                  name: '',
                  breed: '',
                  role: 'Guard Dog',
                  workType: 'Herding',
                  trainingLevel: 'Basic',
                  healthStatus: 'Healthy',
                  vaccinated: false,
                  lastVetCheckup: '',
                  notes: ''
                })
              }}
              style={{
                flex: 1,
                padding: '10px 16px',
                background: '#e5e7eb',
                color: '#374151',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          style={{
            width: '100%',
            padding: '12px 16px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600'
          }}
        >
          + Add Canine
        </button>
      )}
    </div>
  )
}
