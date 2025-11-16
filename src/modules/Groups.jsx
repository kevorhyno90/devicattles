import React, { useEffect, useState } from 'react'

const SAMPLE_GROUPS = [
  {
    id: 'G-001',
    name: 'Dairy Herd A',
    type: 'Dairy Cattle',
    purpose: 'Milk Production',
    animalIds: [],
    manager: 'John Smith',
    location: 'North Barn',
    status: 'Active',
    created: '2025-01-15',
    feedProgram: 'High Protein Mix',
    healthProtocol: 'Monthly check-ups',
    notes: 'Top producing herd',
    targetSize: 50,
    breedingStatus: 'Active',
    vaccinationSchedule: 'Quarterly',
    averageAge: 4.2,
    productionGoals: {
      dailyMilk: 2500,
      monthlyMilk: 75000,
      quality: 'Premium'
    },
    genetics: {
      breed: 'Holstein',
      lineage: 'Premium genetics',
      inbreeding: 'Low'
    }
  },
  {
    id: 'G-002',
    name: 'Feeder Calves',
    type: 'Beef Cattle',
    purpose: 'Beef Production',
    animalIds: [],
    manager: 'Sarah Johnson',
    location: 'South Pasture',
    status: 'Active',
    created: '2025-03-20',
    feedProgram: 'Grain Finishing',
    healthProtocol: 'Bi-weekly monitoring',
    notes: 'Ready for market in 3 months',
    targetSize: 30,
    breedingStatus: 'N/A',
    vaccinationSchedule: 'As needed',
    averageAge: 1.5,
    productionGoals: {
      targetWeight: 1200,
      marketDate: '2025-12-01',
      quality: 'Choice'
    },
    genetics: {
      breed: 'Angus Cross',
      lineage: 'Commercial',
      inbreeding: 'None'
    }
  }
]

export default function Groups({ animals = [] }) {
  const KEY = 'cattalytics:groups'
  const [groups, setGroups] = useState([])
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editValues, setEditValues] = useState({})
  const [showAddForm, setShowAddForm] = useState(false)
  const [newGroup, setNewGroup] = useState({
    name: '',
    type: 'Dairy Cattle',
    purpose: 'Milk Production',
    manager: '',
    location: '',
    feedProgram: '',
    targetSize: 0
  })

  useEffect(() => {
    const raw = localStorage.getItem(KEY)
    if (raw) setGroups(JSON.parse(raw))
    else setGroups(SAMPLE_GROUPS)
  }, [])

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(groups))
  }, [groups])

  function addGroup() {
    if (!newGroup.name.trim()) {
      alert('Group name is required')
      return
    }
    const group = {
      ...newGroup,
      id: 'G-' + Date.now(),
      animalIds: [],
      status: 'Active',
      created: new Date().toISOString().split('T')[0],
      notes: '',
      breedingStatus: 'Active',
      vaccinationSchedule: 'Quarterly',
      healthProtocol: 'Regular check-ups'
    }
    setGroups([...groups, group])
    setShowAddForm(false)
    setNewGroup({
      name: '',
      type: 'Dairy Cattle',
      purpose: 'Milk Production',
      manager: '',
      location: '',
      feedProgram: '',
      targetSize: 0
    })
  }

  function deleteGroup(id) {
    if (!confirm('Delete this group? Animals will not be deleted.')) return
    setGroups(groups.filter(g => g.id !== id))
    if (selectedGroup?.id === id) setSelectedGroup(null)
  }

  function startEdit(group) {
    setEditingId(group.id)
    setEditValues({ ...group })
  }

  function saveEdit() {
    setGroups(groups.map(g => g.id === editingId ? { ...g, ...editValues } : g))
    setEditingId(null)
    if (selectedGroup?.id === editingId) {
      setSelectedGroup({ ...selectedGroup, ...editValues })
    }
  }

  function cancelEdit() {
    setEditingId(null)
    setEditValues({})
  }

  function addAnimalToGroup(groupId, animalId) {
    setGroups(groups.map(g => {
      if (g.id === groupId) {
        if (!g.animalIds.includes(animalId)) {
          return { ...g, animalIds: [...g.animalIds, animalId] }
        }
      }
      return g
    }))
  }

  function removeAnimalFromGroup(groupId, animalId) {
    setGroups(groups.map(g => {
      if (g.id === groupId) {
        return { ...g, animalIds: g.animalIds.filter(id => id !== animalId) }
      }
      return g
    }))
  }

  const groupStats = groups.map(g => ({
    ...g,
    currentSize: g.animalIds?.length || 0,
    fillRate: g.targetSize > 0 ? ((g.animalIds?.length || 0) / g.targetSize * 100).toFixed(0) : 0
  }))

  return (
    <section>
      <div className="health-header">
        <div>
          <h2 style={{ margin: 0 }}>👥 Groups & Herds</h2>
          <div style={{ fontSize: '14px', color: '#64748b' }}>Manage animal groups, herds, and production units</div>
        </div>
        <button className="tab-btn" onClick={() => setShowAddForm(true)}>➕ Add Group</button>
      </div>

      {/* Statistics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--green)' }}>{groups.length}</div>
          <div style={{ fontSize: '14px', color: '#64748b' }}>Total Groups</div>
        </div>
        <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--green)' }}>
            {groups.filter(g => g.status === 'Active').length}
          </div>
          <div style={{ fontSize: '14px', color: '#64748b' }}>Active Groups</div>
        </div>
        <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--green)' }}>
            {groups.reduce((sum, g) => sum + (g.animalIds?.length || 0), 0)}
          </div>
          <div style={{ fontSize: '14px', color: '#64748b' }}>Total Animals in Groups</div>
        </div>
        <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--green)' }}>
            {[...new Set(groups.map(g => g.type))].length}
          </div>
          <div style={{ fontSize: '14px', color: '#64748b' }}>Group Types</div>
        </div>
      </div>

      {/* Groups Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '16px' }}>
        {groupStats.map(group => (
          <div key={group.id} className="card" style={{ padding: '16px', cursor: 'pointer' }} onClick={() => setSelectedGroup(group)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
              <div>
                <h3 style={{ margin: 0, color: 'var(--green)', fontSize: '18px' }}>{group.name}</h3>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>{group.id}</div>
              </div>
              <span style={{
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '600',
                background: group.status === 'Active' ? '#dcfce7' : '#fee2e2',
                color: group.status === 'Active' ? '#166534' : '#991b1b'
              }}>
                {group.status}
              </span>
            </div>

            <div style={{ fontSize: '14px', marginBottom: '12px' }}>
              <div style={{ marginBottom: '6px' }}>
                <span style={{ color: '#64748b' }}>Type:</span>{' '}
                <strong>{group.type}</strong>
              </div>
              <div style={{ marginBottom: '6px' }}>
                <span style={{ color: '#64748b' }}>Purpose:</span>{' '}
                <strong>{group.purpose}</strong>
              </div>
              <div style={{ marginBottom: '6px' }}>
                <span style={{ color: '#64748b' }}>Location:</span>{' '}
                {group.location || 'Not set'}
              </div>
              <div style={{ marginBottom: '6px' }}>
                <span style={{ color: '#64748b' }}>Manager:</span>{' '}
                {group.manager || 'Not assigned'}
              </div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                <span>Group Size</span>
                <span>{group.currentSize} / {group.targetSize}</span>
              </div>
              <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min(100, group.fillRate)}%`,
                  background: group.fillRate >= 100 ? '#ef4444' : group.fillRate >= 80 ? '#fbbf24' : 'var(--green)',
                  transition: 'width 0.3s'
                }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button
                onClick={(e) => { e.stopPropagation(); startEdit(group); }}
                style={{ flex: 1, padding: '6px', fontSize: '13px' }}
              >
                ✏️ Edit
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); deleteGroup(group.id); }}
                style={{ flex: 1, padding: '6px', fontSize: '13px', background: '#ef4444', color: '#fff' }}
              >
                🗑️ Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Group Modal */}
      {showAddForm && (
        <div className="drawer-overlay" onClick={() => setShowAddForm(false)}>
          <div className="drawer" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <h3>Add New Group</h3>
            <div style={{ display: 'grid', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>Group Name *</label>
                <input
                  value={newGroup.name}
                  onChange={e => setNewGroup({ ...newGroup, name: e.target.value })}
                  placeholder="e.g., Dairy Herd A"
                  style={{ width: '100%' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>Type</label>
                  <select
                    value={newGroup.type}
                    onChange={e => setNewGroup({ ...newGroup, type: e.target.value })}
                    style={{ width: '100%' }}
                  >
                    <option>Dairy Cattle</option>
                    <option>Beef Cattle</option>
                    <option>Breeding Stock</option>
                    <option>Young Stock</option>
                    <option>Dry Cows</option>
                    <option>Replacement Heifers</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>Purpose</label>
                  <select
                    value={newGroup.purpose}
                    onChange={e => setNewGroup({ ...newGroup, purpose: e.target.value })}
                    style={{ width: '100%' }}
                  >
                    <option>Milk Production</option>
                    <option>Beef Production</option>
                    <option>Breeding</option>
                    <option>Growing</option>
                    <option>Finishing</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>Manager</label>
                  <input
                    value={newGroup.manager}
                    onChange={e => setNewGroup({ ...newGroup, manager: e.target.value })}
                    placeholder="Person responsible"
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>Location</label>
                  <input
                    value={newGroup.location}
                    onChange={e => setNewGroup({ ...newGroup, location: e.target.value })}
                    placeholder="Barn, pasture, etc."
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>Feed Program</label>
                  <input
                    value={newGroup.feedProgram}
                    onChange={e => setNewGroup({ ...newGroup, feedProgram: e.target.value })}
                    placeholder="e.g., High Protein Mix"
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>Target Size</label>
                  <input
                    type="number"
                    value={newGroup.targetSize}
                    onChange={e => setNewGroup({ ...newGroup, targetSize: parseInt(e.target.value) || 0 })}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
              <button onClick={addGroup} style={{ flex: 1, background: 'var(--green)', color: '#fff' }}>
                Add Group
              </button>
              <button onClick={() => setShowAddForm(false)} style={{ flex: 1 }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Group Details Modal */}
      {selectedGroup && !editingId && (
        <div className="drawer-overlay" onClick={() => setSelectedGroup(null)}>
          <div className="drawer" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0 }}>{selectedGroup.name}</h3>
                <div style={{ fontSize: '14px', color: '#64748b' }}>{selectedGroup.id}</div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => startEdit(selectedGroup)}>✏️ Edit</button>
                <button onClick={() => setSelectedGroup(null)}>Close</button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="card" style={{ padding: '16px' }}>
                <h4 style={{ marginTop: 0 }}>📋 Basic Information</h4>
                <div style={{ fontSize: '14px', lineHeight: '1.8' }}>
                  <div><strong>Type:</strong> {selectedGroup.type}</div>
                  <div><strong>Purpose:</strong> {selectedGroup.purpose}</div>
                  <div><strong>Status:</strong> {selectedGroup.status}</div>
                  <div><strong>Created:</strong> {selectedGroup.created}</div>
                  <div><strong>Manager:</strong> {selectedGroup.manager || 'Not assigned'}</div>
                  <div><strong>Location:</strong> {selectedGroup.location || 'Not set'}</div>
                </div>
              </div>

              <div className="card" style={{ padding: '16px' }}>
                <h4 style={{ marginTop: 0 }}>📊 Group Statistics</h4>
                <div style={{ fontSize: '14px', lineHeight: '1.8' }}>
                  <div><strong>Current Size:</strong> {selectedGroup.animalIds?.length || 0} animals</div>
                  <div><strong>Target Size:</strong> {selectedGroup.targetSize}</div>
                  <div><strong>Capacity:</strong> {((selectedGroup.animalIds?.length || 0) / selectedGroup.targetSize * 100).toFixed(0)}%</div>
                  <div><strong>Breeding Status:</strong> {selectedGroup.breedingStatus || 'N/A'}</div>
                  <div><strong>Avg Age:</strong> {selectedGroup.averageAge || 'N/A'} years</div>
                </div>
              </div>

              <div className="card" style={{ padding: '16px' }}>
                <h4 style={{ marginTop: 0 }}>🍽️ Feeding & Health</h4>
                <div style={{ fontSize: '14px', lineHeight: '1.8' }}>
                  <div><strong>Feed Program:</strong> {selectedGroup.feedProgram || 'Not set'}</div>
                  <div><strong>Health Protocol:</strong> {selectedGroup.healthProtocol || 'Not set'}</div>
                  <div><strong>Vaccination Schedule:</strong> {selectedGroup.vaccinationSchedule || 'Not set'}</div>
                </div>
              </div>

              <div className="card" style={{ padding: '16px' }}>
                <h4 style={{ marginTop: 0 }}>🎯 Production Goals</h4>
                <div style={{ fontSize: '14px', lineHeight: '1.8' }}>
                  {selectedGroup.productionGoals ? (
                    <>
                      {selectedGroup.productionGoals.dailyMilk && (
                        <div><strong>Daily Milk:</strong> {selectedGroup.productionGoals.dailyMilk} lbs</div>
                      )}
                      {selectedGroup.productionGoals.monthlyMilk && (
                        <div><strong>Monthly Milk:</strong> {selectedGroup.productionGoals.monthlyMilk} lbs</div>
                      )}
                      {selectedGroup.productionGoals.targetWeight && (
                        <div><strong>Target Weight:</strong> {selectedGroup.productionGoals.targetWeight} lbs</div>
                      )}
                      {selectedGroup.productionGoals.marketDate && (
                        <div><strong>Market Date:</strong> {selectedGroup.productionGoals.marketDate}</div>
                      )}
                      {selectedGroup.productionGoals.quality && (
                        <div><strong>Quality Grade:</strong> {selectedGroup.productionGoals.quality}</div>
                      )}
                    </>
                  ) : (
                    <div style={{ color: '#64748b' }}>No production goals set</div>
                  )}
                </div>
              </div>
            </div>

            {selectedGroup.notes && (
              <div className="card" style={{ padding: '16px', marginTop: '16px' }}>
                <h4 style={{ marginTop: 0 }}>📝 Notes</h4>
                <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.6' }}>{selectedGroup.notes}</p>
              </div>
            )}

            <div className="card" style={{ padding: '16px', marginTop: '16px' }}>
              <h4 style={{ marginTop: 0 }}>🐄 Animals in Group ({selectedGroup.animalIds?.length || 0})</h4>
              {selectedGroup.animalIds?.length > 0 ? (
                <div style={{ display: 'grid', gap: '8px' }}>
                  {selectedGroup.animalIds.map(animalId => {
                    const animal = animals.find(a => a.id === animalId || a.tag === animalId)
                    return (
                      <div key={animalId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', background: '#f8fafc', borderRadius: '4px' }}>
                        <span>{animal ? `${animal.name || animal.tag} - ${animal.breed}` : animalId}</span>
                        <button
                          onClick={() => removeAnimalFromGroup(selectedGroup.id, animalId)}
                          style={{ padding: '4px 8px', fontSize: '12px', background: '#ef4444', color: '#fff' }}
                        >
                          Remove
                        </button>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p style={{ color: '#64748b', fontSize: '14px' }}>No animals in this group yet</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Group Modal */}
      {editingId && (
        <div className="drawer-overlay" onClick={cancelEdit}>
          <div className="drawer" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <h3>Edit Group</h3>
            <div style={{ display: 'grid', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>Group Name</label>
                <input
                  value={editValues.name || ''}
                  onChange={e => setEditValues({ ...editValues, name: e.target.value })}
                  style={{ width: '100%' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>Type</label>
                  <select
                    value={editValues.type || ''}
                    onChange={e => setEditValues({ ...editValues, type: e.target.value })}
                    style={{ width: '100%' }}
                  >
                    <option>Dairy Cattle</option>
                    <option>Beef Cattle</option>
                    <option>Breeding Stock</option>
                    <option>Young Stock</option>
                    <option>Dry Cows</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>Purpose</label>
                  <input
                    value={editValues.purpose || ''}
                    onChange={e => setEditValues({ ...editValues, purpose: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>Manager</label>
                  <input
                    value={editValues.manager || ''}
                    onChange={e => setEditValues({ ...editValues, manager: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>Location</label>
                  <input
                    value={editValues.location || ''}
                    onChange={e => setEditValues({ ...editValues, location: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>Status</label>
                <select
                  value={editValues.status || 'Active'}
                  onChange={e => setEditValues({ ...editValues, status: e.target.value })}
                  style={{ width: '100%' }}
                >
                  <option>Active</option>
                  <option>Inactive</option>
                  <option>Archived</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>Feed Program</label>
                <input
                  value={editValues.feedProgram || ''}
                  onChange={e => setEditValues({ ...editValues, feedProgram: e.target.value })}
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>Target Size</label>
                <input
                  type="number"
                  value={editValues.targetSize || 0}
                  onChange={e => setEditValues({ ...editValues, targetSize: parseInt(e.target.value) || 0 })}
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>Notes</label>
                <textarea
                  value={editValues.notes || ''}
                  onChange={e => setEditValues({ ...editValues, notes: e.target.value })}
                  style={{ width: '100%', minHeight: '80px' }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
              <button onClick={saveEdit} style={{ flex: 1, background: 'var(--green)', color: '#fff' }}>
                Save Changes
              </button>
              <button onClick={cancelEdit} style={{ flex: 1 }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
