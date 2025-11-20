import React, { useEffect, useState } from 'react'
import CropYield from './CropYield'
import CropSales from './CropSales'
import CropTreatment from './CropTreatment'
import { exportToCSV, exportToExcel, exportToJSON, importFromCSV, importFromJSON } from '../lib/exportImport'

const SAMPLE = [
  {
    id: 'C-001',
    name: 'Premium Alfalfa',
    variety: 'Vernal',
    planted: '2025-03-15',
    expectedHarvest: '2025-07-15',
    actualHarvest: '',
    area: 5.2,
    field: 'North Field A',
    status: 'Growing',
    soilType: 'Clay Loam',
    irrigationType: 'Sprinkler',
    seedCost: 450,
    notes: 'Premium alfalfa field with excellent soil conditions',
    cropType: 'Forage',
    certificationLevel: 'Certified Organic',
    marketDestination: 'Local Dairy Farms'
  },
  {
    id: 'C-002',
    name: 'Field Corn',
    variety: 'Pioneer 1234',
    planted: '2025-04-20',
    expectedHarvest: '2025-09-15',
    actualHarvest: '',
    area: 12.8,
    field: 'South Field B',
    status: 'Planted',
    soilType: 'Sandy Loam',
    irrigationType: 'Center Pivot',
    seedCost: 2800,
    notes: '',
    cropType: 'Grain',
    certificationLevel: 'Conventional',
    marketDestination: 'Grain Elevator'
  }
]

const CROP_TYPES = ['Grain', 'Forage', 'Vegetable', 'Fruit', 'Cover Crop', 'Other']
const SOIL_TYPES = ['Clay', 'Clay Loam', 'Loam', 'Sandy Loam', 'Sand', 'Silt', 'Silt Loam']
const IRRIGATION_TYPES = ['Dryland', 'Sprinkler', 'Drip', 'Center Pivot', 'Flood', 'Furrow']
const CROP_STATUS = ['Planned', 'Planted', 'Germinating', 'Growing', 'Flowering', 'Mature', 'Harvested', 'Failed']
const CERTIFICATION_LEVELS = ['Conventional', 'Certified Organic', 'Transitional Organic', 'Non-GMO']

export default function Crops() {
  const KEY = 'cattalytics:crops'
  
  const [tab, setTab] = useState('list')
  const [crops, setCrops] = useState([])
  const [filter, setFilter] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [sortBy, setSortBy] = useState('planted')
  
  const emptyCrop = {
    name: '',
    variety: '',
    field: '',
    area: '',
    planted: '',
    expectedHarvest: '',
    actualHarvest: '',
    soilType: 'Loam',
    irrigationType: 'Sprinkler',
    status: 'Planned',
    cropType: 'Grain',
    certificationLevel: 'Conventional',
    marketDestination: '',
    seedCost: '',
    notes: ''
  }
  
  const [form, setForm] = useState(emptyCrop)
  const [editingId, setEditingId] = useState(null)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      try {
        setCrops(JSON.parse(raw))
      } catch (e) {
        console.log('Loading sample data')
        setCrops(SAMPLE)
      }
    } else {
      setCrops(SAMPLE)
    }
  }, [])

  useEffect(() => {
    if (crops.length > 0) {
      localStorage.setItem(KEY, JSON.stringify(crops))
    }
  }, [crops])

  function validateCrop(c) {
    const e = {}
    if (!c.name || !c.name.trim()) e.name = 'Crop name is required'
    if (!c.area || Number(c.area) <= 0) e.area = 'Area must be greater than 0'
    if (c.planted) {
      const d = Date.parse(c.planted)
      if (Number.isNaN(d)) e.planted = 'Invalid planting date'
    }
    return e
  }

  function resetForm() {
    setForm(emptyCrop)
    setEditingId(null)
    setErrors({})
  }

  function saveCrop(e) {
    e && e.preventDefault()
    const candidate = { ...form }
    const eobj = validateCrop(candidate)
    setErrors(eobj)
    if (Object.keys(eobj).length) return

    if (editingId) {
      setCrops(crops.map(c => c.id === editingId ? { ...c, ...candidate } : c))
    } else {
      const id = 'C-' + Math.floor(1000 + Math.random() * 9000)
      setCrops([...crops, { ...candidate, id }])
    }
    resetForm()
    setTab('list')
  }

  function startEditCrop(c) {
    setForm(c)
    setEditingId(c.id)
    setTab('addCrop')
  }

  function deleteCrop(id) {
    if (!window.confirm('Delete crop ' + id + '?')) return
    setCrops(crops.filter(c => c.id !== id))
  }

  const q = filter.trim().toLowerCase()
  const filtered = crops.filter(crop => {
    if (q) {
      const matchesText = (crop.name || '').toLowerCase().includes(q) ||
                         (crop.variety || '').toLowerCase().includes(q) ||
                         (crop.field || '').toLowerCase().includes(q) ||
                         (crop.id || '').toLowerCase().includes(q)
      if (!matchesText) return false
    }
    if (filterStatus !== 'all' && crop.status !== filterStatus) return false
    return true
  }).sort((a, b) => {
    if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '')
    if (sortBy === 'area') return (b.area || 0) - (a.area || 0)
    if (sortBy === 'planted') return new Date(b.planted || '1900-01-01') - new Date(a.planted || '1900-01-01')
    return 0
  })

  const stats = {
    total: crops.length,
    totalArea: crops.reduce((sum, c) => sum + (Number(c.area) || 0), 0),
    active: crops.filter(c => !['Harvested', 'Failed'].includes(c.status)).length,
    harvested: crops.filter(c => c.status === 'Harvested').length
  }

  return (
    <section>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ margin: 0 }}>Crop Management</h2>
          {tab === 'list' && (
            <button
              onClick={() => setTab('addCrop')}
              style={{ background: 'var(--green)', color: '#fff', padding: '10px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
            >
              Add New Crop
            </button>
          )}
        </div>

        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '20px' }}>
          <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--green)' }}>{stats.total}</div>
            <div style={{ fontSize: '14px', color: 'var(--muted)' }}>Total Crops</div>
          </div>
          <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#f59e0b' }}>{stats.totalArea.toFixed(1)}</div>
            <div style={{ fontSize: '14px', color: 'var(--muted)' }}>Total Acres</div>
          </div>
          <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#059669' }}>{stats.active}</div>
            <div style={{ fontSize: '14px', color: 'var(--muted)' }}>Active Crops</div>
          </div>
          <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#6b7280' }}>{stats.harvested}</div>
            <div style={{ fontSize: '14px', color: 'var(--muted)' }}>Harvested</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ borderBottom: '2px solid #e5e7eb', marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setTab('list')}
              style={{
                padding: '12px 20px',
                border: 'none',
                borderBottom: tab === 'list' ? '3px solid var(--green)' : '3px solid transparent',
                background: tab === 'list' ? '#f0fdf4' : 'transparent',
                color: tab === 'list' ? 'var(--green)' : '#6b7280',
                fontWeight: tab === 'list' ? '600' : '400',
                cursor: 'pointer'
              }}
            >
              📋 Crop List
            </button>
            <button
              onClick={() => setTab('yields')}
              style={{
                padding: '12px 20px',
                border: 'none',
                borderBottom: tab === 'yields' ? '3px solid var(--green)' : '3px solid transparent',
                background: tab === 'yields' ? '#f0fdf4' : 'transparent',
                color: tab === 'yields' ? 'var(--green)' : '#6b7280',
                fontWeight: tab === 'yields' ? '600' : '400',
                cursor: 'pointer'
              }}
            >
              🌾 Yields & Harvest
            </button>
            <button
              onClick={() => setTab('sales')}
              style={{
                padding: '12px 20px',
                border: 'none',
                borderBottom: tab === 'sales' ? '3px solid var(--green)' : '3px solid transparent',
                background: tab === 'sales' ? '#f0fdf4' : 'transparent',
                color: tab === 'sales' ? 'var(--green)' : '#6b7280',
                fontWeight: tab === 'sales' ? '600' : '400',
                cursor: 'pointer'
              }}
            >
              💰 Sales & Revenue
            </button>
            <button
              onClick={() => setTab('treatments')}
              style={{
                padding: '12px 20px',
                border: 'none',
                borderBottom: tab === 'treatments' ? '3px solid var(--green)' : '3px solid transparent',
                background: tab === 'treatments' ? '#f0fdf4' : 'transparent',
                color: tab === 'treatments' ? 'var(--green)' : '#6b7280',
                fontWeight: tab === 'treatments' ? '600' : '400',
                cursor: 'pointer'
              }}
            >
              🧪 Treatments & Inputs
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      {tab === 'list' && (
        <div>
          {/* Filters */}
          <div className="card" style={{ marginBottom: '20px', padding: '16px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="🔍 Search crops..."
                value={filter}
                onChange={e => setFilter(e.target.value)}
                style={{ flex: '1 1 200px', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db' }}
              />
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db' }}
              >
                <option value="all">All Status</option>
                {CROP_STATUS.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db' }}
              >
                <option value="planted">Sort by Planted Date</option>
                <option value="name">Sort by Name</option>
                <option value="area">Sort by Area</option>
              </select>
            </div>
          </div>

          {/* Crop List */}
          <div style={{ display: 'grid', gap: '12px' }}>
            {filtered.length === 0 && (
              <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                No crops found. Add your first crop to get started!
              </div>
            )}
            {filtered.map(crop => (
              <div key={crop.id} className="card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      <h3 style={{ margin: 0 }}>{crop.name}</h3>
                      <span
                        className="badge"
                        style={{
                          background: crop.status === 'Harvested' ? '#dcfce7' : crop.status === 'Failed' ? '#fee2e2' : '#dbeafe',
                          color: crop.status === 'Harvested' ? '#15803d' : crop.status === 'Failed' ? '#dc2626' : '#1e40af',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}
                      >
                        {crop.status}
                      </span>
                      <span className="badge" style={{ background: '#f3f4f6', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>
                        {crop.irrigationType}
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '12px' }}>
                      <div>
                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '2px' }}>Variety</div>
                        <div style={{ fontWeight: '500' }}>{crop.variety || 'Not specified'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '2px' }}>Field</div>
                        <div style={{ fontWeight: '500' }}>{crop.field || 'Not specified'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '2px' }}>Area</div>
                        <div style={{ fontWeight: '500' }}>{crop.area} acres</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '2px' }}>Soil Type</div>
                        <div style={{ fontWeight: '500' }}>{crop.soilType}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '20px', fontSize: '14px', color: '#666' }}>
                      <span>📅 Planted: {crop.planted || 'Not set'}</span>
                      <span>🌾 Expected: {crop.expectedHarvest || 'Not set'}</span>
                      {crop.actualHarvest && <span>✅ Harvested: {crop.actualHarvest}</span>}
                    </div>
                  </div>
                  <div className="controls" style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => startEditCrop(crop)}>Edit</button>
                    <button onClick={() => deleteCrop(crop.id)}>Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'addCrop' && (
        <div className="card" style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3>{editingId ? 'Edit Crop' : 'Add New Crop'}</h3>
            <button onClick={() => { resetForm(); setTab('list') }} style={{ background: '#6b7280', color: '#fff', padding: '8px 16px', borderRadius: '6px', border: 'none' }}>
              Cancel
            </button>
          </div>

          <form onSubmit={saveCrop}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Crop Name *</label>
                <input
                  type="text"
                  placeholder="e.g., Premium Alfalfa"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: errors.name ? '2px solid #dc2626' : '1px solid #d1d5db' }}
                />
                {errors.name && <div style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px' }}>{errors.name}</div>}
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Variety/Cultivar</label>
                <input
                  type="text"
                  placeholder="e.g., Pioneer 1234"
                  value={form.variety}
                  onChange={e => setForm({ ...form, variety: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Field Location</label>
                <input
                  type="text"
                  placeholder="e.g., North Field A"
                  value={form.field}
                  onChange={e => setForm({ ...form, field: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Area (acres) *</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="0.0"
                  value={form.area}
                  onChange={e => setForm({ ...form, area: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: errors.area ? '2px solid #dc2626' : '1px solid #d1d5db' }}
                />
                {errors.area && <div style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px' }}>{errors.area}</div>}
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Crop Type</label>
                <select
                  value={form.cropType}
                  onChange={e => setForm({ ...form, cropType: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                >
                  {CROP_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Status</label>
                <select
                  value={form.status}
                  onChange={e => setForm({ ...form, status: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                >
                  {CROP_STATUS.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Planting Date</label>
                <input
                  type="date"
                  value={form.planted}
                  onChange={e => setForm({ ...form, planted: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Expected Harvest</label>
                <input
                  type="date"
                  value={form.expectedHarvest}
                  onChange={e => setForm({ ...form, expectedHarvest: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Soil Type</label>
                <select
                  value={form.soilType}
                  onChange={e => setForm({ ...form, soilType: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                >
                  {SOIL_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Irrigation Type</label>
                <select
                  value={form.irrigationType}
                  onChange={e => setForm({ ...form, irrigationType: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                >
                  {IRRIGATION_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Certification Level</label>
                <select
                  value={form.certificationLevel}
                  onChange={e => setForm({ ...form, certificationLevel: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                >
                  {CERTIFICATION_LEVELS.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Seed Cost (KES)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={form.seedCost}
                  onChange={e => setForm({ ...form, seedCost: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Market Destination</label>
                <input
                  type="text"
                  placeholder="e.g., Local Dairy Farms, Grain Elevator"
                  value={form.marketDestination}
                  onChange={e => setForm({ ...form, marketDestination: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Notes</label>
                <textarea
                  placeholder="Additional crop details..."
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                />
              </div>
            </div>

            <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
              <button
                type="submit"
                style={{ background: 'var(--green)', color: '#fff', padding: '12px 24px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
              >
                {editingId ? 'Update Crop' : 'Add Crop'}
              </button>
              <button
                type="button"
                onClick={() => { resetForm(); setTab('list') }}
                style={{ background: '#6b7280', color: '#fff', padding: '12px 24px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {tab === 'yields' && (
        <div>
          <CropYield crops={crops} />
        </div>
      )}

      {tab === 'sales' && (
        <div>
          <CropSales crops={crops} />
        </div>
      )}

      {tab === 'treatments' && (
        <div>
          <CropTreatment crops={crops} />
        </div>
      )}
    </section>
  )
}
