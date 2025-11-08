import React, { useEffect, useState } from 'react'

// Realized Animals component: HTML5 controls, inline validation, unique tag checks,
// realistic sample data, and non-placeholder behavior.
export default function Animals() {
  const AKEY = 'cattalytics:animals'
  const GKEY = 'cattalytics:groups'

  const SAMPLE_GROUPS = [
    { id: 'G-001', name: 'Herd A', desc: 'Main dairy herd' },
    { id: 'G-002', name: 'Heifer Pen', desc: 'Young stock' }
  ]

  const SAMPLE_ANIMALS = [
    { id: 'A-001', tag: 'TAG1001', name: 'Bessie', breed: 'Holstein', sex: 'F', color: 'Black/White', dob: '2019-05-10', weight: 450, sire: 'S-100', dam: 'D-200', groupId: 'G-001', status: 'Active', notes: 'High producing cow' },
    { id: 'A-002', tag: 'TAG1002', name: 'Molly', breed: 'Jersey', sex: 'F', color: 'Brown', dob: '2020-03-22', weight: 380, sire: 'S-101', dam: 'D-201', groupId: 'G-001', status: 'Active', notes: '' },
    { id: 'A-003', tag: 'TAG1003', name: 'Duke', breed: 'Angus', sex: 'M', color: 'Black', dob: '2018-11-02', weight: 620, sire: '', dam: '', groupId: 'G-002', status: 'Sold', notes: 'Sold at market' }
  ]

  const [tab, setTab] = useState('list')
  const [animals, setAnimals] = useState([])
  const [groups, setGroups] = useState([])
  const [filter, setFilter] = useState('')

  const emptyAnimal = { id: '', tag: '', name: '', breed: '', sex: 'F', color: '', dob: '', weight: '', sire: '', dam: '', groupId: '', status: 'Active', notes: '' }
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
    // tag uniqueness
    if (a.tag && animals.some(x => x.tag === a.tag && x.id !== a.id)) e.tag = 'Tag must be unique'
    return e
  }

  function resetForm() { setForm(emptyAnimal); setEditingId(null); setErrors({}) }

  function saveAnimal(e) {
    e && e.preventDefault()
    const candidate = { ...form }
    if (!candidate.tag || !candidate.tag.trim()) candidate.tag = 'TAG' + (1000 + Math.floor(Math.random() * 9000))
    const eobj = validateAnimal(candidate)
    setErrors(eobj)
    if (Object.keys(eobj).length) return

    if (editingId) {
      setAnimals(animals.map(a => a.id === editingId ? { ...a, ...candidate } : a))
    } else {
      const id = 'A-' + (1000 + Math.floor(Math.random() * 900000))
      setAnimals([...animals, { ...candidate, id }])
    }
    resetForm()
    setTab('list')
  }

  function startEditAnimal(a) { setForm(a); setEditingId(a.id); setTab('addAnimal') }
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
    if (!q) return true
    const groupName = groups.find(g => g.id === a.groupId)?.name || ''
    return (a.id || '').toLowerCase().includes(q) || (a.tag || '').toLowerCase().includes(q) || (a.name || '').toLowerCase().includes(q) || (a.breed || '').toLowerCase().includes(q) || groupName.toLowerCase().includes(q)
  })

  return (
    <section>
      <h2>Cattalytics — Livestock</h2>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button onClick={() => { resetForm(); setTab('addAnimal') }} disabled={tab === 'addAnimal'}>Add Animal</button>
        <button onClick={() => { resetGroupForm(); setTab('addGroup') }} disabled={tab === 'addGroup'}>Add Group</button>
        <button onClick={() => setTab('list')} disabled={tab === 'list'}>List</button>
        <div style={{ marginLeft: 'auto' }}>
          <input aria-label="Search" placeholder="Search animals/groups" value={filter} onChange={e => setFilter(e.target.value)} />
        </div>
      </div>

      {tab === 'addAnimal' && (
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

            <label style={{ gridColumn: '1 / -1' }}>
              Notes
              <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </label>
          </div>
          <div style={{ marginTop: 8 }}>
            <button type="submit">Save Animal</button>
            <button type="button" onClick={resetForm} style={{ marginLeft: 8 }}>Reset</button>
            {editingId && <button type="button" onClick={() => { resetForm(); setTab('list') }} style={{ marginLeft: 8 }}>Cancel</button>}
          </div>
        </form>
      )}

      {tab === 'addGroup' && (
        <form onSubmit={saveGroup} style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input placeholder="Group name" value={groupName} onChange={e => setGroupName(e.target.value)} />
            <input placeholder="Description" value={groupDesc} onChange={e => setGroupDesc(e.target.value)} />
            <button type="submit">Save Group</button>
            <button type="button" onClick={() => { resetGroupForm(); setTab('list') }} style={{ marginLeft: 8 }}>Cancel</button>
          </div>
          <div style={{ marginTop: 8 }}>
            <strong>Existing groups</strong>
            <ul>
              {groups.map(g => (
                <li key={g.id} style={{ marginBottom: 6 }}>
                  <strong>{g.name}</strong> — {g.desc}
                  <div>
                    <button onClick={() => startEditGroup(g)}>Edit</button>
                    <button onClick={() => deleteGroup(g.id)} style={{ marginLeft: 8 }}>Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </form>
      )}

      <div>
        <h3>Animals ({filtered.length})</h3>
        <ul>
          {filtered.map(a => (
            <li key={a.id} style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>{a.name}</strong> <em>({a.id})</em> {a.tag ? <span>• {a.tag}</span> : null}
                  <div style={{ fontSize: 12, color: '#444' }}>{a.breed}{a.color ? ` • ${a.color}` : ''}{a.weight ? ` • ${a.weight}kg` : ''}{a.dob ? ` • DOB: ${a.dob}` : ''}</div>
                  <div style={{ fontSize: 12, color: '#666' }}>{groups.find(g => g.id === a.groupId)?.name || 'No group'} • {a.status}</div>
                </div>
                <div>
                  <button onClick={() => startEditAnimal(a)}>Edit</button>
                  <button onClick={() => deleteAnimal(a.id)} style={{ marginLeft: 8 }}>Delete</button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
