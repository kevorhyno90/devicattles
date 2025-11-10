import React, { useEffect, useState } from 'react'
import Pastures from './Pastures'
import HealthSystem from './HealthSystem'
import AnimalFeeding from './AnimalFeeding'
import AnimalMeasurement from './AnimalMeasurement'
import AnimalBreeding from './AnimalBreeding'
import AnimalMilkYield from './AnimalMilkYield'
import { fileToDataUrl, estimateDataUrlSize, uid } from '../lib/image'

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
    { id: 'A-001', tag: 'TAG1001', name: 'Bessie', breed: 'Holstein', sex: 'F', color: 'Black/White', dob: '2019-05-10', weight: 450, sire: 'S-100', dam: 'D-200', groupId: 'G-001', status: 'Active', notes: 'High producing cow', owner: 'Farm Owner', registration: 'REG-9001', tattoo: 'T-01', purchaseDate: '2019-06-01', purchasePrice: 1200, vendor: 'Local Auction', tags: ['dairy','priority'], photo: '', pregnancyStatus: 'Not Pregnant', expectedDue: '', parity: 3, lactationStatus: 'Lactating' },
    { id: 'A-002', tag: 'TAG1002', name: 'Molly', breed: 'Jersey', sex: 'F', color: 'Brown', dob: '2020-03-22', weight: 380, sire: 'S-101', dam: 'D-201', groupId: 'G-001', status: 'Active', notes: '', owner: '', registration: '', tattoo: '', purchaseDate: '', purchasePrice: '', vendor: '', tags: [], photo: '', pregnancyStatus: 'Unknown', expectedDue: '', parity: 1, lactationStatus: 'Dry' },
    { id: 'A-003', tag: 'TAG1003', name: 'Duke', breed: 'Angus', sex: 'M', color: 'Black', dob: '2018-11-02', weight: 620, sire: '', dam: '', groupId: 'G-002', status: 'Sold', notes: 'Sold at market', owner: '', registration: '', tattoo: '', purchaseDate: '', purchasePrice: '', vendor: '', tags: [], photo: '', pregnancyStatus: 'Not Applicable', expectedDue: '', parity: 0, lactationStatus: 'NA' }
  ]

  const [tab, setTab] = useState('list')
  const [animals, setAnimals] = useState([])
  const [groups, setGroups] = useState([])
  const [filter, setFilter] = useState('')

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
      setAnimals(animals.map(a => a.id === editingId ? { ...a, ...candidate } : a))
    } else {
      const id = 'A-' + (1000 + Math.floor(Math.random() * 900000))
      // normalize tags: accept comma-separated string or array
      if (candidate.tags && typeof candidate.tags === 'string') candidate.tags = candidate.tags.split(',').map(t => t.trim()).filter(Boolean)
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

  return (
    <section>
      <h2>Cattalytics — Livestock</h2>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button onClick={() => { resetGroupForm(); setTab('addGroup') }} disabled={tab === 'addGroup'}>Groups</button>
        <button onClick={() => { resetForm(); setTab('addAnimal') }} disabled={tab === 'addAnimal'}>Add Animal</button>
        <button onClick={() => setTab('list')} disabled={tab === 'list'}>List</button>
        <button onClick={() => setTab('pastures')} disabled={tab === 'pastures'}>Pastures</button>
        <button onClick={() => setTab('health')} disabled={tab === 'health'}>Health System</button>
        <button onClick={() => setTab('feeding')} disabled={tab === 'feeding'}>Feeding</button>
        <button onClick={() => setTab('measurement')} disabled={tab === 'measurement'}>Measurement</button>
        <button onClick={() => setTab('breeding')} disabled={tab === 'breeding'}>Breeding</button>
        <button onClick={() => setTab('milkyield')} disabled={tab === 'milkyield'}>Milk Yield</button>
        <div style={{ marginLeft: 'auto' }}>
          <input className="search-input" aria-label="Search" placeholder="Search animals/groups" value={filter} onChange={e => setFilter(e.target.value)} />
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
        <h3>Animals ({filtered.length})</h3>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {filtered.map(a => {
            const isExp = expandedIds.includes(a.id)
            const preview = (a.photos && a.photos.length) ? a.photos[0].dataUrl : (a.photo || null)
            const groupName = groups.find(g => g.id === a.groupId)?.name || 'No group'
            return (
              <li key={a.id} className="animal-card" style={{ marginBottom: 12 }}>
                <div className="animal-summary">
                  <div>
                    <div className="animal-meta"><strong>{a.name}</strong> <em>({a.id})</em> {a.tag ? <span>• {a.tag}</span> : null}</div>
                    <div className="animal-sub">{a.breed}{a.color ? ` • ${a.color}` : ''}{a.weight ? ` • ${a.weight}kg` : ''} • {groupName} • {a.status}</div>
                  </div>
                  <div className="animal-controls">
                    <button onClick={() => toggleExpand(a.id)} aria-expanded={isExp}>{isExp ? 'Close' : 'Expand'}</button>
                    <button onClick={() => startEditAnimal(a)}>Edit</button>
                    <button onClick={() => deleteAnimal(a.id)} style={{ marginLeft: 8 }}>Delete</button>
                  </div>
                </div>

                <div className={"animal-details" + (isExp ? ' expanded' : '')} aria-hidden={!isExp}>
      {/* Modal / Drawer for expansive animal view */}
      {modalOpenId && (() => {
        const a = animals.find(x => x.id === modalOpenId)
        if (!a) return null
        const gname = groups.find(g => g.id === a.groupId)?.name || 'No group'
        const preview = (a.photos && a.photos.length) ? a.photos[0].dataUrl : (a.photo || null)
        return (
          <div className="drawer-overlay" onClick={() => setModalOpenId(null)}>
            <div className="drawer" onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0 }}>{a.name} — {a.id}</h3>
                <div>
                  <button onClick={() => { startEditAnimal(a) }}>Edit full</button>
                  <button onClick={() => setModalOpenId(null)} style={{ marginLeft: 8 }}>Close</button>
                </div>
              </div>
              <div style={{ marginTop: 12 }}>
                <div style={{ display: 'flex', gap: 16 }}>
                  <div style={{ width: 280, border: '1px solid #eee', padding: 12, borderRadius: 8 }}>
                    <div style={{ width: '100%', height: 160, background: '#f3f3f3', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, marginBottom: 8 }}>
                      {preview ? <img src={preview} alt={a.name} style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: 6 }} /> : <div>Photo</div>}
                    </div>
                    <div><strong>Tag:</strong> {a.tag}</div>
                    <div style={{ marginTop: 6 }}><strong>Breed:</strong> {a.breed}</div>
                    <div style={{ marginTop: 6 }}><strong>Sex:</strong> {a.sex}</div>
                    <div style={{ marginTop: 6 }}><strong>Owner:</strong> {a.owner || '—'}</div>
                    <div style={{ marginTop: 6 }}><strong>Reg #:</strong> {a.registration || '—'}</div>
                    <div style={{ marginTop: 6 }}><strong>Group:</strong> {gname}</div>
                    <div style={{ marginTop: 6 }}><strong>Status:</strong> {a.status}</div>
                    <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                      <button onClick={() => recordWeight(a)}>Record weight</button>
                      <button onClick={() => startInlineEdit(a)}>Quick edit</button>
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div><strong>DOB</strong><div>{a.dob || '—'}</div></div>
                      <div><strong>Weight</strong><div>{a.weight ? `${a.weight} kg` : '—'}</div></div>
                      <div><strong>Sire</strong><div>{a.sire || '—'}</div></div>
                      <div><strong>Dam</strong><div>{a.dam || '—'}</div></div>
                      <div><strong>Tattoo</strong><div>{a.tattoo || '—'}</div></div>
                      <div><strong>Parity</strong><div>{a.parity !== undefined && a.parity !== '' ? a.parity : '—'}</div></div>
                    </div>

                    <div style={{ marginTop: 12 }}>
                      <strong>Notes</strong>
                      <div style={{ marginTop: 6, padding: 10, border: '1px solid #eee', borderRadius: 6 }}>{a.notes || '—'}</div>
                    </div>

                    <div style={{ marginTop: 12 }}>
                      <strong>Purchase</strong>
                      <div style={{ marginTop: 6 }}>{a.purchaseDate ? `${a.purchaseDate}` : '—'} {a.purchasePrice ? `— $${a.purchasePrice}` : ''}</div>
                      <div style={{ marginTop: 6 }}>{a.vendor || '—'}</div>
                    </div>

                    <div style={{ marginTop: 12 }}>
                      <strong>Tags</strong>
                      <div style={{ marginTop: 6 }}>{(a.tags || []).length ? (a.tags || []).join(', ') : '—'}</div>
                    </div>

                    <div style={{ marginTop: 12 }}>
                      <strong>Repro</strong>
                      <div style={{ marginTop: 6 }}>Pregnancy: {a.pregnancyStatus || '—'} {a.expectedDue ? `— due ${a.expectedDue}` : ''}</div>
                      <div style={{ marginTop: 6 }}>Lactation: {a.lactationStatus || '—'}</div>
                    </div>

                    <div style={{ marginTop: 12 }}>
                      <strong>Weight log</strong>
                      <div style={{ marginTop: 8 }}>
                        {(!a.weightLogs || !a.weightLogs.length) ? <div style={{ color: '#666' }}>No weight records</div> : (
                          <ul>
                            {(a.weightLogs || []).slice().reverse().map((w, idx) => (
                              <li key={idx}>{new Date(w.date).toLocaleString()} — {w.weight} kg</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      })()}
                  {/* Expansive layout: left column (photo + stats) right column (details, logs, actions) */}
                  <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                    <div style={{ minWidth: 180, maxWidth: 240, border: '1px solid #ddd', padding: 12, borderRadius: 8 }}>
                      <div style={{ width: '100%', height: 120, background: '#f3f3f3', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, marginBottom: 8 }}>
                        {preview ? <img src={preview} alt={a.name} style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: 6 }} /> : <div style={{ color: '#888' }}>Photo</div>}
                      </div>
                      <div style={{ fontSize: 14 }}>
                        <div><strong>{a.name}</strong> <em>({a.id})</em></div>
                        <div style={{ marginTop: 6 }}>{a.breed} • {a.color || '—'}</div>
                        <div style={{ marginTop: 6 }}>Current weight: <strong>{a.weight || '—'}</strong> kg</div>
                        <div style={{ marginTop: 6 }}>Owner: {a.owner || '—'}</div>
                        <div style={{ marginTop: 6 }}>Reg #: {a.registration || '—'}</div>
                        <div style={{ marginTop: 6 }}>Group: {groups.find(g=>g.id===a.groupId)?.name || '—'}</div>
                      </div>
                      <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                        <button onClick={() => recordWeight(a)}>Record weight</button>
                        <button onClick={() => startInlineEdit(a)}>Quick edit</button>
                      </div>
                    </div>

                    <div style={{ flex: 1 }}>
                      {inlineEditingId === a.id ? (
                        <div style={{ border: '1px solid #eee', padding: 12, borderRadius: 6 }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                            <label>Tag<input value={inlineForm.tag} onChange={e => handleInlineChange('tag', e.target.value)} /></label>
                            <label>Name<input value={inlineForm.name} onChange={e => handleInlineChange('name', e.target.value)} /></label>
                            <label>Breed<input value={inlineForm.breed} onChange={e => handleInlineChange('breed', e.target.value)} /></label>
                            <label>Color<input value={inlineForm.color} onChange={e => handleInlineChange('color', e.target.value)} /></label>
                            <label>DOB<input type="date" value={inlineForm.dob} onChange={e => handleInlineChange('dob', e.target.value)} /></label>
                            <label>Weight<input type="number" step="0.1" value={inlineForm.weight} onChange={e => handleInlineChange('weight', e.target.value)} /></label>
                            <label>Sire<input value={inlineForm.sire} onChange={e => handleInlineChange('sire', e.target.value)} /></label>
                            <label>Dam<input value={inlineForm.dam} onChange={e => handleInlineChange('dam', e.target.value)} /></label>
                          </div>
                          <div style={{ marginTop: 8 }}>
                            <button onClick={saveInlineEdit}>Save</button>
                            <button onClick={cancelInlineEdit} style={{ marginLeft: 8 }}>Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                            <label>Tag<input value={a.tag} readOnly /></label>
                            <label>Breed<input value={a.breed} readOnly /></label>
                            <label>Sex<select value={a.sex} disabled><option>F</option><option>M</option></select></label>
                            <label>Color<input value={a.color} readOnly /></label>
                            <label>DOB<input type="date" value={a.dob} readOnly /></label>
                            <label>Weight (kg)<input type="number" value={a.weight} readOnly /></label>
                            <label>Sire<input value={a.sire} readOnly /></label>
                            <label>Dam<input value={a.dam} readOnly /></label>
                            <label className="animal-notes" style={{ gridColumn: '1 / -1' }}>Notes<textarea value={a.notes} readOnly /></label>
                            <label style={{ gridColumn: '1 / -1' }}><strong>Purchase</strong><div>{a.purchaseDate || '—'} {a.purchasePrice ? ` — $${a.purchasePrice}` : ''}</div><div>{a.vendor || '—'}</div></label>
                            <label style={{ gridColumn: '1 / -1' }}><strong>Tags</strong><div>{(a.tags || []).length ? (a.tags || []).join(', ') : '—'}</div></label>
                            <label style={{ gridColumn: '1 / -1' }}><strong>Reproduction</strong><div>Pregnancy: {a.pregnancyStatus || '—'} {a.expectedDue ? `— due ${a.expectedDue}` : ''}</div><div>Lactation: {a.lactationStatus || '—'}</div></label>
                          </div>

                          <div style={{ marginTop: 12 }}>
                            <strong>Weight log</strong>
                            <div style={{ marginTop: 6 }}>
                              {(!a.weightLogs || !a.weightLogs.length) ? <div style={{ color: '#666' }}>No weight records</div> : (
                                <ul style={{ marginTop: 6 }}>
                                  {(a.weightLogs || []).slice().reverse().map((w, idx) => (
                                    <li key={idx}>{new Date(w.date).toLocaleString()} — {w.weight} kg</li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </div>

                          <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                            <button onClick={() => { startEditAnimal(a) }}>Edit full</button>
                            <button onClick={() => toggleExpand(a.id)}>Close</button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
