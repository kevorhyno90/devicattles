
import React, { useState, useEffect } from 'react'

const FORAGE_TYPES = ['Mixed Grass', 'Fescue', 'Ryegrass', 'Timothy', 'Orchardgrass', 'Alfalfa', 'Clover', 'Bermuda', 'Bluegrass', 'Native Prairie']
const SOIL_TYPES = ['Loam', 'Clay Loam', 'Sandy Loam', 'Silt Loam', 'Clay', 'Sandy', 'Silty', 'Rocky']
const STATUSES = ['Active Grazing', 'Resting', 'Planned', 'Maintenance', 'Renovation', 'Establishing', 'Dormant']
const FENCE_TYPES = ['Electric', 'Barbed Wire', 'High Tensile', 'Wood Rail', 'Woven Wire', 'Pipe', 'Combination']
const WATER_SOURCES = ['Tank', 'Stream', 'Pond', 'Well', 'River Access', 'Automatic Waterer', 'Stream + Tank', 'Multiple']

export default function Pastures() {
  const KEY = 'cattalytics:pastures:v2'
  const [items, setItems] = useState([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  
  // Inline edit state
  const [inlineEditId, setInlineEditId] = useState(null)
  const [inlineData, setInlineData] = useState({ name: '', acreage: '', status: 'Active Grazing', forage: 'Mixed Grass' })
  const [toast, setToast] = useState(null)
  const [lastChange, setLastChange] = useState(null)
  
  const [formData, setFormData] = useState({
    name: '', acreage: '', forage: 'Mixed Grass', soilType: 'Loam', soilPH: 7.0,
    status: 'Planned', carryingCapacity: '', fencing: 'Electric', fenceCondition: 'Good',
    waterSource: 'Tank', shade: false, shelter: false, notes: '',
    harvestType: '', harvestTechnique: '', harvestQuantity: '', harvestUnit: 'bales', harvestQuality: 'Good', harvestStorage: '', harvestCost: ''
  })
  
  useEffect(() => {
    const raw = localStorage.getItem(KEY)
    if (raw) setItems(JSON.parse(raw))
  }, [])
  
  useEffect(() => {
    if (items.length > 0) localStorage.setItem(KEY, JSON.stringify(items))
  }, [items])


  function resetForm() {
    setFormData({
      name: '', acreage: '', forage: 'Mixed Grass', soilType: 'Loam', soilPH: 7.0,
      status: 'Planned', carryingCapacity: '', fencing: 'Electric', fenceCondition: 'Good',
      waterSource: 'Tank', shade: false, shelter: false, notes: '',
      harvestType: '', harvestTechnique: '', harvestQuantity: '', harvestUnit: 'bales', harvestQuality: 'Good', harvestStorage: '', harvestCost: ''
    })
    setEditingId(null)
  }

  function add() {
    if (!formData.name.trim() || !formData.acreage) return

    let harvestRecord = null
    if (formData.harvestType && formData.harvestQuantity) {
      harvestRecord = {
        id: Date.now(),
        date: new Date().toISOString().slice(0, 10),
        type: formData.harvestType,
        technique: formData.harvestTechnique,
        quantity: parseFloat(formData.harvestQuantity),
        unit: formData.harvestUnit,
        quality: formData.harvestQuality,
        stored: formData.harvestStorage,
        cost: parseFloat(formData.harvestCost) || 0,
        moisture: 0,
        price: 0
      }
    }

    if (editingId) {
      // Update existing pasture
      setItems(items.map(item => item.id === editingId ? {
        ...item,
        ...formData,
        acreage: parseFloat(formData.acreage),
        soilPH: parseFloat(formData.soilPH),
        carryingCapacity: parseFloat(formData.carryingCapacity) || 0,
        harvests: harvestRecord ? [...(item.harvests || []), harvestRecord] : item.harvests || []
      } : item))
      setToast({ type: 'success', message: 'Pasture updated!' })
    } else {
      // Create new pasture
      const id = 'P-' + Math.floor(1000 + Math.random() * 9000)
      setItems([...items, {
        id,
        ...formData,
        acreage: parseFloat(formData.acreage),
        soilPH: parseFloat(formData.soilPH),
        carryingCapacity: parseFloat(formData.carryingCapacity) || 0,
        currentOccupancy: 0,
        planted: new Date().toISOString().slice(0, 10),
        grazingHistory: [],
        soilTests: [],
        improvements: [],
        harvests: harvestRecord ? [harvestRecord] : [],
        fertilizations: [],
        pestControl: [],
        maintenanceSchedule: [],
        biodiversity: 'Medium',
        weedPressure: 'Low',
        erosionRisk: 'Low'
      }])
      setToast({ type: 'success', message: 'Pasture added!' })
    }
    
    setTimeout(() => setToast(null), 3000)
    resetForm()
    setShowAddForm(false)
  }
  
  function remove(id) {
    if (!confirm('Delete this pasture?')) return
    setItems(items.filter(i => i.id !== id))
    setToast({ type: 'success', message: 'Pasture deleted!' })
    setTimeout(() => setToast(null), 3000)
  }
  
  function startEdit(item) {
    setEditingId(item.id)
    setFormData({
      name: item.name,
      acreage: item.acreage,
      forage: item.forage,
      soilType: item.soilType,
      soilPH: item.soilPH,
      status: item.status,
      carryingCapacity: item.carryingCapacity || '',
      fencing: item.fencing,
      fenceCondition: item.fenceCondition,
      waterSource: item.waterSource,
      shade: item.shade || false,
      shelter: item.shelter || false,
      notes: item.notes || '',
      harvestType: '',
      harvestTechnique: '',
      harvestQuantity: '',
      harvestUnit: 'bales',
      harvestQuality: 'Good',
      harvestStorage: '',
      harvestCost: ''
    })
    setShowAddForm(true)
  }
  
  // Inline Quick Edit Functions
  function startInlineEdit(item) {
    setInlineEditId(item.id)
    setInlineData({
      name: item.name || '',
      acreage: item.acreage || '',
      status: item.status || 'Active Grazing',
      forage: item.forage || 'Mixed Grass'
    })
  }

  function saveInlineEdit() {
    if (!inlineData.name.trim() || !inlineData.acreage) {
      setToast({ type: 'error', message: 'Name and acreage are required' })
      setTimeout(() => setToast(null), 3000)
      return
    }
    
    const oldItem = items.find(i => i.id === inlineEditId)
    setLastChange({ id: inlineEditId, item: oldItem })
    
    setItems(items.map(item => item.id === inlineEditId ? {
      ...item,
      name: inlineData.name,
      acreage: parseFloat(inlineData.acreage),
      status: inlineData.status,
      forage: inlineData.forage
    } : item))
    
    setToast({ type: 'success', message: '✓ Saved!' })
    setTimeout(() => setToast(null), 3000)
    setInlineEditId(null)
  }

  function cancelInlineEdit() {
    setInlineEditId(null)
  }

  function undoLastChange() {
    if (!lastChange) return
    setItems(items.map(i => i.id === lastChange.id ? lastChange.item : i))
    setToast({ type: 'success', message: '↶ Undone!' })
    setTimeout(() => setToast(null), 3000)
    setLastChange(null)
  }



  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '900', margin: 0 }}>🌱 Pastures</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          {lastChange && (
            <button onClick={undoLastChange} style={{ padding: '8px 16px', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
              ↶ Undo
            </button>
          )}
          <button onClick={() => setShowAddForm(!showAddForm)} style={{ padding: '8px 16px', background: '#059669', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: '600' }}>
            {showAddForm ? '✕ Cancel' : '+ Add Pasture'}
          </button>
        </div>
      </div>
      
      {toast && (
        <div style={{ padding: 12, marginBottom: 16, background: toast.type === 'error' ? '#fee' : '#efe', border: `1px solid ${toast.type === 'error' ? '#fcc' : '#cfc'}`, borderRadius: 6, color: toast.type === 'error' ? '#c00' : '#060' }}>
          {toast.message}
        </div>
      )}
      
      {showAddForm && (
        <form className="card" style={{ padding: '32px', borderRadius: 16, boxShadow: '0 2px 8px #e5e7eb', background: '#fff', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: 24 }} onSubmit={e => { e.preventDefault(); add(); }}>
          <div>
            <label>Pasture Name *</label>
            <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
          </div>
          <div>
            <label>Acreage *</label>
            <input type="number" step="0.1" value={formData.acreage} onChange={e => setFormData({ ...formData, acreage: e.target.value })} required />
          </div>
          <div>
            <label>Status</label>
            <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label>Primary Forage</label>
            <select value={formData.forage} onChange={e => setFormData({ ...formData, forage: e.target.value })}>
              {FORAGE_TYPES.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div>
            <label>Soil Type</label>
            <select value={formData.soilType} onChange={e => setFormData({ ...formData, soilType: e.target.value })}>
              {SOIL_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label>Soil pH</label>
            <input type="number" step="0.1" value={formData.soilPH} onChange={e => setFormData({ ...formData, soilPH: e.target.value })} />
          </div>
          <div>
            <label>Carrying Capacity (head)</label>
            <input type="number" value={formData.carryingCapacity} onChange={e => setFormData({ ...formData, carryingCapacity: e.target.value })} />
          </div>
          <div>
            <label>Fencing Type</label>
            <select value={formData.fencing} onChange={e => setFormData({ ...formData, fencing: e.target.value })}>
              {FENCE_TYPES.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div>
            <label>Fence Condition</label>
            <select value={formData.fenceCondition} onChange={e => setFormData({ ...formData, fenceCondition: e.target.value })}>
              <option>Excellent</option>
              <option>Good</option>
              <option>Fair</option>
              <option>Poor</option>
              <option>Needs Repair</option>
            </select>
          </div>
          <div>
            <label>Water Source</label>
            <select value={formData.waterSource} onChange={e => setFormData({ ...formData, waterSource: e.target.value })}>
              {WATER_SOURCES.map(w => <option key={w} value={w}>{w}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="checkbox" checked={formData.shade} onChange={e => setFormData({ ...formData, shade: e.target.checked })} />
              Shade Available
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="checkbox" checked={formData.shelter} onChange={e => setFormData({ ...formData, shelter: e.target.checked })} />
              Shelter Available
            </label>
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <label>Notes</label>
            <textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} rows={2} />
          </div>
          {/* Harvest Record Fields - merged inline */}
          <div>
            <label>Harvest Type</label>
            <input value={formData.harvestType} onChange={e => setFormData({ ...formData, harvestType: e.target.value })} placeholder="e.g. Hay - First Cut" />
          </div>
          <div>
            <label>Technique</label>
            <input value={formData.harvestTechnique} onChange={e => setFormData({ ...formData, harvestTechnique: e.target.value })} placeholder="Tractor/Mower/Manual" />
          </div>
          <div>
            <label>Quantity</label>
            <input type="number" value={formData.harvestQuantity} onChange={e => setFormData({ ...formData, harvestQuantity: e.target.value })} placeholder="e.g. 100" />
          </div>
          <div>
            <label>Unit</label>
            <input value={formData.harvestUnit} onChange={e => setFormData({ ...formData, harvestUnit: e.target.value })} placeholder="bales/tons" />
          </div>
          <div>
            <label>Quality</label>
            <input value={formData.harvestQuality} onChange={e => setFormData({ ...formData, harvestQuality: e.target.value })} placeholder="Premium/Good/Fair" />
          </div>
          <div>
            <label>Storage</label>
            <input value={formData.harvestStorage} onChange={e => setFormData({ ...formData, harvestStorage: e.target.value })} placeholder="Barn A" />
          </div>
          <div>
            <label>Cost (KSH)</label>
            <input type="number" value={formData.harvestCost} onChange={e => setFormData({ ...formData, harvestCost: e.target.value })} placeholder="e.g. 1200" />
          </div>
          <div style={{ gridColumn: 'span 3', marginTop: '16px', textAlign: 'right' }}>
            <button type="submit" style={{ background: '#059669', color: '#fff', fontWeight: '700', padding: '14px 32px', borderRadius: 8, fontSize: '1.1rem', border: 'none', cursor: 'pointer' }}>
              {editingId ? 'Update Pasture' : 'Save Pasture'}
            </button>
          </div>
        </form>
      )}
      
      {/* Pastures List */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 16 }}>
        {items.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#999', gridColumn: '1 / -1' }}>
            No pastures yet. Click "Add Pasture" to create one.
          </div>
        ) : (
          items.map(item => (
            <div key={item.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              {inlineEditId === item.id ? (
                <div style={{ marginBottom: 12 }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '1rem', fontWeight: '600', color: '#059669' }}>⚡ Quick Edit</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <input 
                      value={inlineData.name} 
                      onChange={e => setInlineData({ ...inlineData, name: e.target.value })} 
                      placeholder="Pasture Name"
                      style={{ padding: 8, border: '1px solid #d1d5db', borderRadius: 4 }}
                    />
                    <input 
                      type="number"
                      step="0.1"
                      value={inlineData.acreage} 
                      onChange={e => setInlineData({ ...inlineData, acreage: e.target.value })} 
                      placeholder="Acreage"
                      style={{ padding: 8, border: '1px solid #d1d5db', borderRadius: 4 }}
                    />
                    <select 
                      value={inlineData.status} 
                      onChange={e => setInlineData({ ...inlineData, status: e.target.value })}
                      style={{ padding: 8, border: '1px solid #d1d5db', borderRadius: 4 }}
                    >
                      {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <select 
                      value={inlineData.forage} 
                      onChange={e => setInlineData({ ...inlineData, forage: e.target.value })}
                      style={{ padding: 8, border: '1px solid #d1d5db', borderRadius: 4 }}
                    >
                      {FORAGE_TYPES.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <button onClick={saveInlineEdit} style={{ flex: 1, padding: 8, background: '#059669', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: '600' }}>Save</button>
                      <button onClick={cancelInlineEdit} style={{ flex: 1, padding: 8, background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: 4, cursor: 'pointer' }}>Cancel</button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: '#111' }}>{item.name}</h3>
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.875rem', color: '#666' }}>{item.id}</p>
                    </div>
                    <span style={{ 
                      padding: '4px 12px', 
                      background: item.status === 'Active Grazing' ? '#dcfce7' : item.status === 'Resting' ? '#fef3c7' : '#e5e7eb',
                      color: item.status === 'Active Grazing' ? '#166534' : item.status === 'Resting' ? '#92400e' : '#374151',
                      borderRadius: 12, 
                      fontSize: '0.75rem', 
                      fontWeight: '600' 
                    }}>
                      {item.status}
                    </span>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: '0.875rem', marginBottom: 12 }}>
                    <div><strong>Acreage:</strong> {item.acreage} acres</div>
                    <div><strong>Forage:</strong> {item.forage}</div>
                    <div><strong>Capacity:</strong> {item.carryingCapacity || 0} head</div>
                    <div><strong>Fencing:</strong> {item.fencing}</div>
                    <div><strong>Water:</strong> {item.waterSource}</div>
                    <div><strong>Soil:</strong> pH {item.soilPH}</div>
                  </div>
                  
                  {item.notes && (
                    <p style={{ margin: '8px 0', padding: 8, background: '#f9fafb', borderRadius: 4, fontSize: '0.875rem', color: '#555' }}>
                      {item.notes}
                    </p>
                  )}
                  
                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    <button onClick={() => startInlineEdit(item)} style={{ padding: '6px 12px', background: '#ffffcc', border: '1px solid #ffdd00', borderRadius: 4, cursor: 'pointer', fontSize: '0.875rem', fontWeight: '600' }}>
                      ⚡ Quick
                    </button>
                    <button onClick={() => startEdit(item)} style={{ padding: '6px 12px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '0.875rem' }}>
                      Edit
                    </button>
                    <button onClick={() => remove(item.id)} style={{ padding: '6px 12px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '0.875rem' }}>
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}