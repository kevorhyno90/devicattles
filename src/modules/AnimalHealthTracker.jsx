import React, { useState, useEffect } from 'react'
import { logAnimalActivity } from '../lib/activityLogger'

/**
 * Animal Health Tracker
 * Comprehensive health monitoring and disease management
 */
export default function AnimalHealthTracker({ onNavigate }) {
  const [animals, setAnimals] = useState([])
  const [selectedAnimal, setSelectedAnimal] = useState(null)
  const [healthRecords, setHealthRecords] = useState([])
  const [vaccinations, setVaccinations] = useState([])
  const [treatments, setTreatments] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [formType, setFormType] = useState('health') // health, vaccine, treatment
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all') // all, healthy, sick, treatment
  const [sortBy, setSortBy] = useState('recent') // recent, name, status

  const [formData, setFormData] = useState({
    type: 'checkup',
    date: new Date().toISOString().split('T')[0],
    condition: '',
    symptoms: '',
    diagnosis: '',
    severity: 'mild',
    treatment: '',
    medication: '',
    dosage: '',
    veterinarian: '',
    cost: '',
    notes: '',
    followUpDate: '',
    status: 'ongoing'
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    try {
      const storedAnimals = JSON.parse(localStorage.getItem('animals') || '[]')
      setAnimals(storedAnimals)
      
      const storedHealth = JSON.parse(localStorage.getItem('animalHealthRecords') || '[]')
      setHealthRecords(storedHealth)
      
      const storedVaccines = JSON.parse(localStorage.getItem('animalVaccinations') || '[]')
      setVaccinations(storedVaccines)
      
      const storedTreatments = JSON.parse(localStorage.getItem('animalTreatments') || '[]')
      setTreatments(storedTreatments)
    } catch (error) {
      console.error('Error loading health data:', error)
    }
  }

  const saveData = (healthData, vaccineData, treatmentData) => {
    localStorage.setItem('animalHealthRecords', JSON.stringify(healthData))
    localStorage.setItem('animalVaccinations', JSON.stringify(vaccineData))
    localStorage.setItem('animalTreatments', JSON.stringify(treatmentData))
  }

  const addHealthRecord = () => {
    if (!selectedAnimal || !formData.condition) return

    const newRecord = {
      id: `health-${Date.now()}`,
      animalId: selectedAnimal.id,
      animalName: selectedAnimal.name,
      timestamp: new Date().toISOString(),
      ...formData
    }

    const updated = [...healthRecords, newRecord]
    setHealthRecords(updated)
    saveData(updated, vaccinations, treatments)
    
    logAnimalActivity('health_record', selectedAnimal, {
      condition: formData.condition,
      severity: formData.severity
    })

    resetForm()
    setShowForm(false)
  }

  const addVaccination = () => {
    if (!selectedAnimal || !formData.type) return

    const newVaccine = {
      id: `vaccine-${Date.now()}`,
      animalId: selectedAnimal.id,
      animalName: selectedAnimal.name,
      timestamp: new Date().toISOString(),
      ...formData
    }

    const updated = [...vaccinations, newVaccine]
    setVaccinations(updated)
    saveData(healthRecords, updated, treatments)
    
    logAnimalActivity('vaccination', selectedAnimal, {
      vaccineType: formData.type
    })

    resetForm()
    setShowForm(false)
  }

  const addTreatment = () => {
    if (!selectedAnimal || !formData.condition) return

    const newTreatment = {
      id: `treatment-${Date.now()}`,
      animalId: selectedAnimal.id,
      animalName: selectedAnimal.name,
      timestamp: new Date().toISOString(),
      ...formData
    }

    const updated = [...treatments, newTreatment]
    setTreatments(updated)
    saveData(healthRecords, vaccinations, updated)
    
    logAnimalActivity('treatment', selectedAnimal, {
      condition: formData.condition,
      medication: formData.medication
    })

    resetForm()
    setShowForm(false)
  }

  const resetForm = () => {
    setFormData({
      type: 'checkup',
      date: new Date().toISOString().split('T')[0],
      condition: '',
      symptoms: '',
      diagnosis: '',
      severity: 'mild',
      treatment: '',
      medication: '',
      dosage: '',
      veterinarian: '',
      cost: '',
      notes: '',
      followUpDate: '',
      status: 'ongoing'
    })
  }

  const deleteRecord = (id, type) => {
    if (!window.confirm('Delete this record?')) return

    if (type === 'health') {
      const updated = healthRecords.filter(r => r.id !== id)
      setHealthRecords(updated)
      saveData(updated, vaccinations, treatments)
    } else if (type === 'vaccine') {
      const updated = vaccinations.filter(v => v.id !== id)
      setVaccinations(updated)
      saveData(healthRecords, updated, treatments)
    } else if (type === 'treatment') {
      const updated = treatments.filter(t => t.id !== id)
      setTreatments(updated)
      saveData(healthRecords, vaccinations, updated)
    }
  }

  const getAnimalHealthStatus = (animalId) => {
    const recentHealth = healthRecords
      .filter(r => r.animalId === animalId)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0]

    if (!recentHealth) return { status: 'unknown', color: '#9ca3af' }
    
    if (recentHealth.severity === 'critical') return { status: 'critical', color: '#dc2626' }
    if (recentHealth.severity === 'severe') return { status: 'severe', color: '#ea580c' }
    if (recentHealth.severity === 'moderate') return { status: 'moderate', color: '#f59e0b' }
    if (recentHealth.severity === 'mild') return { status: 'mild', color: '#84cc16' }
    return { status: 'healthy', color: '#10b981' }
  }

  const getUpcomingVaccinations = () => {
    const today = new Date()
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
    
    return vaccinations.filter(v => {
      if (!v.followUpDate) return false
      const followUp = new Date(v.followUpDate)
      return followUp >= today && followUp <= thirtyDaysFromNow
    })
  }

  const filteredAnimals = animals
    .filter(animal => {
      const matchesSearch = animal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (animal.tag || '').toLowerCase().includes(searchTerm.toLowerCase())
      
      if (filterStatus === 'all') return matchesSearch
      
      const healthStatus = getAnimalHealthStatus(animal.id).status
      if (filterStatus === 'healthy') return matchesSearch && healthStatus === 'healthy'
      if (filterStatus === 'sick') return matchesSearch && ['mild', 'moderate', 'severe', 'critical'].includes(healthStatus)
      if (filterStatus === 'treatment') {
        const hasActiveTreatment = treatments.some(t => t.animalId === animal.id && t.status === 'ongoing')
        return matchesSearch && hasActiveTreatment
      }
      
      return matchesSearch
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      if (sortBy === 'status') {
        const statusA = getAnimalHealthStatus(a.id).status
        const statusB = getAnimalHealthStatus(b.id).status
        return statusA.localeCompare(statusB)
      }
      // recent - sort by last health record
      const lastA = healthRecords.filter(r => r.animalId === a.id).sort((x, y) => new Date(y.timestamp) - new Date(x.timestamp))[0]
      const lastB = healthRecords.filter(r => r.animalId === b.id).sort((x, y) => new Date(y.timestamp) - new Date(x.timestamp))[0]
      if (!lastA && !lastB) return 0
      if (!lastA) return 1
      if (!lastB) return -1
      return new Date(lastB.timestamp) - new Date(lastA.timestamp)
    })

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#111', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          🏥 Animal Health Tracker
        </h1>
        <p style={{ color: '#666', fontSize: '14px' }}>
          Monitor animal health, vaccinations, and treatments
        </p>
      </div>

      {/* Upcoming Vaccinations Alert */}
      {getUpcomingVaccinations().length > 0 && (
        <div style={{
          background: '#fef3c7',
          border: '2px solid #f59e0b',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'start',
          gap: '12px'
        }}>
          <span style={{ fontSize: '24px' }}>⚠️</span>
          <div style={{ flex: 1 }}>
            <strong style={{ display: 'block', marginBottom: '4px' }}>Upcoming Vaccinations</strong>
            <div style={{ fontSize: '14px', color: '#92400e' }}>
              {getUpcomingVaccinations().length} vaccinations due in the next 30 days
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: selectedAnimal ? '350px 1fr' : '1fr', gap: '20px' }}>
        {/* Animal List */}
        <div>
          <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            {/* Search and Filters */}
            <div style={{ marginBottom: '16px' }}>
              <input
                type="text"
                placeholder="Search animals..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  marginBottom: '8px'
                }}
              />
              
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                {['all', 'healthy', 'sick', 'treatment'].map(status => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    style={{
                      flex: 1,
                      padding: '6px 8px',
                      background: filterStatus === status ? '#3b82f6' : '#f3f4f6',
                      color: filterStatus === status ? 'white' : '#6b7280',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      textTransform: 'capitalize'
                    }}
                  >
                    {status}
                  </button>
                ))}
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '4px',
                  fontSize: '13px'
                }}
              >
                <option value="recent">Recent Activity</option>
                <option value="name">Name</option>
                <option value="status">Health Status</option>
              </select>
            </div>

            {/* Animals */}
            <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
              {filteredAnimals.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#999' }}>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>🐄</div>
                  <div>No animals found</div>
                </div>
              ) : (
                filteredAnimals.map(animal => {
                  const healthStatus = getAnimalHealthStatus(animal.id)
                  const recordCount = healthRecords.filter(r => r.animalId === animal.id).length
                  const vaccineCount = vaccinations.filter(v => v.animalId === animal.id).length
                  
                  return (
                    <div
                      key={animal.id}
                      onClick={() => setSelectedAnimal(animal)}
                      style={{
                        padding: '12px',
                        background: selectedAnimal?.id === animal.id ? '#eff6ff' : '#f9fafb',
                        border: selectedAnimal?.id === animal.id ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                        borderRadius: '8px',
                        marginBottom: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>{animal.name}</h3>
                          <div style={{ fontSize: '12px', color: '#666' }}>{animal.tag || animal.id}</div>
                        </div>
                        <div style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          background: healthStatus.color
                        }} />
                      </div>
                      <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: '#666' }}>
                        <span>📋 {recordCount} records</span>
                        <span>💉 {vaccineCount} vaccines</span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {/* Detail Panel */}
        {selectedAnimal && (
          <div>
            <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '600' }}>{selectedAnimal.name}</h2>
                  <div style={{ fontSize: '14px', color: '#666' }}>
                    {selectedAnimal.type || 'Animal'} • {selectedAnimal.tag || selectedAnimal.id}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedAnimal(null)}
                  style={{
                    padding: '6px 12px',
                    background: '#f3f4f6',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px'
                  }}
                >
                  ✕ Close
                </button>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '20px' }}>
                <button
                  onClick={() => { setFormType('health'); setShowForm(true); resetForm(); }}
                  style={{
                    padding: '12px',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '500',
                    fontSize: '14px'
                  }}
                >
                  📋 Health Record
                </button>
                <button
                  onClick={() => { setFormType('vaccine'); setShowForm(true); resetForm(); }}
                  style={{
                    padding: '12px',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '500',
                    fontSize: '14px'
                  }}
                >
                  💉 Vaccination
                </button>
                <button
                  onClick={() => { setFormType('treatment'); setShowForm(true); resetForm(); }}
                  style={{
                    padding: '12px',
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '500',
                    fontSize: '14px'
                  }}
                >
                  💊 Treatment
                </button>
              </div>

              {/* Form */}
              {showForm && (
                <div style={{ background: '#f9fafb', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
                  <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600' }}>
                    {formType === 'health' ? '📋 New Health Record' : formType === 'vaccine' ? '💉 New Vaccination' : '💊 New Treatment'}
                  </h3>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                    />
                    
                    {formType === 'health' && (
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                      >
                        <option value="checkup">Regular Checkup</option>
                        <option value="illness">Illness</option>
                        <option value="injury">Injury</option>
                        <option value="emergency">Emergency</option>
                      </select>
                    )}

                    {formType === 'vaccine' && (
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                      >
                        <option value="">Select Vaccine Type</option>
                        <option value="FMD">Foot and Mouth Disease (FMD)</option>
                        <option value="Anthrax">Anthrax</option>
                        <option value="Rabies">Rabies</option>
                        <option value="Brucellosis">Brucellosis</option>
                        <option value="Other">Other</option>
                      </select>
                    )}
                  </div>

                  <input
                    type="text"
                    placeholder="Condition/Diagnosis"
                    value={formData.condition}
                    onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                    style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', marginBottom: '12px' }}
                  />

                  <textarea
                    placeholder="Symptoms/Notes"
                    value={formData.symptoms}
                    onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                    style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', minHeight: '80px', marginBottom: '12px', fontFamily: 'inherit' }}
                  />

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    <select
                      value={formData.severity}
                      onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                      style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                    >
                      <option value="mild">Mild</option>
                      <option value="moderate">Moderate</option>
                      <option value="severe">Severe</option>
                      <option value="critical">Critical</option>
                    </select>

                    <input
                      type="text"
                      placeholder="Medication"
                      value={formData.medication}
                      onChange={(e) => setFormData({ ...formData, medication: e.target.value })}
                      style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    <input
                      type="text"
                      placeholder="Dosage"
                      value={formData.dosage}
                      onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                      style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                    />
                    <input
                      type="text"
                      placeholder="Veterinarian"
                      value={formData.veterinarian}
                      onChange={(e) => setFormData({ ...formData, veterinarian: e.target.value })}
                      style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                    />
                    <input
                      type="number"
                      placeholder="Cost ($)"
                      value={formData.cost}
                      onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                      style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                    />
                  </div>

                  <input
                    type="date"
                    placeholder="Follow-up Date"
                    value={formData.followUpDate}
                    onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                    style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', marginBottom: '12px' }}
                  />

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={formType === 'health' ? addHealthRecord : formType === 'vaccine' ? addVaccination : addTreatment}
                      style={{
                        flex: 1,
                        padding: '10px',
                        background: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: '500'
                      }}
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setShowForm(false)}
                      style={{
                        flex: 1,
                        padding: '10px',
                        background: '#e5e7eb',
                        color: '#374151',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: '500'
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Records */}
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>📋 Health History</h3>
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {[...healthRecords.filter(r => r.animalId === selectedAnimal.id),
                    ...vaccinations.filter(v => v.animalId === selectedAnimal.id).map(v => ({ ...v, recordType: 'vaccine' })),
                    ...treatments.filter(t => t.animalId === selectedAnimal.id).map(t => ({ ...t, recordType: 'treatment' }))]
                    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                    .map(record => (
                      <div
                        key={record.id}
                        style={{
                          padding: '12px',
                          background: '#f9fafb',
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                          marginBottom: '8px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                              <span>{record.recordType === 'vaccine' ? '💉' : record.recordType === 'treatment' ? '💊' : '📋'}</span>
                              <strong style={{ fontSize: '14px' }}>{record.condition || record.type}</strong>
                              {record.severity && (
                                <span style={{
                                  padding: '2px 8px',
                                  background: record.severity === 'critical' ? '#fee2e2' : record.severity === 'severe' ? '#fed7aa' : record.severity === 'moderate' ? '#fef3c7' : '#dcfce7',
                                  color: record.severity === 'critical' ? '#991b1b' : record.severity === 'severe' ? '#9a3412' : record.severity === 'moderate' ? '#92400e' : '#166534',
                                  borderRadius: '12px',
                                  fontSize: '10px',
                                  fontWeight: '600',
                                  textTransform: 'uppercase'
                                }}>
                                  {record.severity}
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '12px', color: '#666' }}>
                              {new Date(record.timestamp).toLocaleString()}
                            </div>
                          </div>
                          <button
                            onClick={() => deleteRecord(record.id, record.recordType || 'health')}
                            style={{
                              padding: '4px 8px',
                              background: '#fee2e2',
                              color: '#991b1b',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '11px'
                            }}
                          >
                            Delete
                          </button>
                        </div>
                        
                        {record.symptoms && (
                          <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>
                            <strong>Symptoms:</strong> {record.symptoms}
                          </div>
                        )}
                        
                        {record.medication && (
                          <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>
                            <strong>Medication:</strong> {record.medication} {record.dosage && `(${record.dosage})`}
                          </div>
                        )}
                        
                        {record.veterinarian && (
                          <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>
                            <strong>Vet:</strong> {record.veterinarian}
                          </div>
                        )}
                        
                        {record.cost && (
                          <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>
                            <strong>Cost:</strong> ${record.cost}
                          </div>
                        )}
                        
                        {record.followUpDate && (
                          <div style={{ fontSize: '13px', color: '#f59e0b', marginTop: '8px', fontWeight: '500' }}>
                            ⏰ Follow-up: {new Date(record.followUpDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    ))}

                  {healthRecords.filter(r => r.animalId === selectedAnimal.id).length === 0 &&
                   vaccinations.filter(v => v.animalId === selectedAnimal.id).length === 0 &&
                   treatments.filter(t => t.animalId === selectedAnimal.id).length === 0 && (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: '#999' }}>
                      <div style={{ fontSize: '48px', marginBottom: '12px' }}>📋</div>
                      <div>No health records yet</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
