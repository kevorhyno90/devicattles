
import React, { useState } from 'react'

const FORAGE_TYPES = ['Mixed Grass', 'Fescue', 'Ryegrass', 'Timothy', 'Orchardgrass', 'Alfalfa', 'Clover', 'Bermuda', 'Bluegrass', 'Native Prairie']
const SOIL_TYPES = ['Loam', 'Clay Loam', 'Sandy Loam', 'Silt Loam', 'Clay', 'Sandy', 'Silty', 'Rocky']
const STATUSES = ['Active Grazing', 'Resting', 'Planned', 'Maintenance', 'Renovation', 'Establishing', 'Dormant']
const FENCE_TYPES = ['Electric', 'Barbed Wire', 'High Tensile', 'Wood Rail', 'Woven Wire', 'Pipe', 'Combination']
const WATER_SOURCES = ['Tank', 'Stream', 'Pond', 'Well', 'River Access', 'Automatic Waterer', 'Stream + Tank', 'Multiple']

export default function Pastures() {
  const KEY = 'cattalytics:pastures:v2'
  const [formData, setFormData] = useState({
    name: '', acreage: '', forage: 'Mixed Grass', soilType: 'Loam', soilPH: 7.0,
    status: 'Planned', carryingCapacity: '', fencing: 'Electric', fenceCondition: 'Good',
    waterSource: 'Tank', shade: false, shelter: false, notes: '',
    harvestType: '', harvestTechnique: '', harvestQuantity: '', harvestUnit: 'bales', harvestQuality: 'Good', harvestStorage: '', harvestCost: ''
  })

  function resetForm() {
    setFormData({
      name: '', acreage: '', forage: 'Mixed Grass', soilType: 'Loam', soilPH: 7.0,
      status: 'Planned', carryingCapacity: '', fencing: 'Electric', fenceCondition: 'Good',
      waterSource: 'Tank', shade: false, shelter: false, notes: '',
      harvestType: '', harvestTechnique: '', harvestQuantity: '', harvestUnit: 'bales', harvestQuality: 'Good', harvestStorage: '', harvestCost: ''
    })
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

    // Save to localStorage
    const raw = localStorage.getItem(KEY)
    const items = raw ? JSON.parse(raw) : []
    const id = 'P-' + Math.floor(1000 + Math.random() * 9000)
    items.push({
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
    })
    localStorage.setItem(KEY, JSON.stringify(items))
    resetForm()
    alert('Pasture record saved!')
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: '900', marginBottom: 24 }}>🌱 Pasture & Harvest Record</h1>
      <form className="card" style={{ padding: '32px', borderRadius: 16, boxShadow: '0 2px 8px #e5e7eb', background: '#fff', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }} onSubmit={e => { e.preventDefault(); add(); }}>
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
        <div style={{ gridColumn: 'span 3', marginTop: '32px', textAlign: 'right' }}>
          <button type="submit" style={{ background: '#059669', color: '#fff', fontWeight: '700', padding: '14px 32px', borderRadius: 8, fontSize: '1.1rem' }}>Save Pasture Record</button>
        </div>
      </form>
    </div>
  )
}
