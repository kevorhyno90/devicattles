import React, { useEffect, useState } from 'react'

const FORAGE_TYPES = ['Mixed Grass', 'Fescue', 'Ryegrass', 'Timothy', 'Orchardgrass', 'Alfalfa', 'Clover', 'Bermuda', 'Bluegrass', 'Native Prairie']
const SOIL_TYPES = ['Loam', 'Clay Loam', 'Sandy Loam', 'Silt Loam', 'Clay', 'Sandy', 'Silty', 'Rocky']
const STATUSES = ['Active Grazing', 'Resting', 'Planned', 'Maintenance', 'Renovation', 'Establishing', 'Dormant']
const FENCE_TYPES = ['Electric', 'Barbed Wire', 'High Tensile', 'Wood Rail', 'Woven Wire', 'Pipe', 'Combination']
const WATER_SOURCES = ['Tank', 'Stream', 'Pond', 'Well', 'River Access', 'Automatic Waterer', 'Stream + Tank', 'Multiple']
const IMPROVEMENT_TYPES = ['Lime Application', 'Fertilizer', 'Overseeding', 'Mowing', 'Harrowing', 'Aeration', 'Drainage', 'Fence Repair', 'Water System', 'Weed Control']
const HARVEST_TYPES = ['Hay - First Cut', 'Hay - Second Cut', 'Hay - Third Cut', 'Silage', 'Haylage', 'Baleage', 'Green Chop']

const SAMPLE = [
  { 
    id: 'P-001', 
    name: 'North Pasture', 
    acreage: 12.5, 
    notes: 'Prime grazing area with excellent drainage',
    gpsCoordinates: { lat: 40.7128, lng: -74.0060 },
    soilType: 'Loam',
    soilPH: 6.5,
    soilHealth: 'Excellent',
    forage: 'Mixed Grass',
    forageSpecies: ['Orchardgrass', 'Fescue', 'Clover'],
    planted: '2024-03-15',
    lastSoilTest: '2025-03-15',
    carryingCapacity: 25,
    currentOccupancy: 18,
    status: 'Active Grazing',
    restPeriod: 30,
    targetRestPeriod: 35,
    lastGrazed: '2025-10-15',
    nextGrazingDate: '2025-11-19',
    fencing: 'Electric',
    fenceCondition: 'Good',
    fenceLastInspected: '2025-10-01',
    waterSource: 'Stream + Tank',
    waterQuality: 'Good',
    waterLastTested: '2025-09-15',
    shade: true,
    shelter: true,
    biomass: 2800,
    forageHeight: 8,
    utilization: 60,
    grazingHistory: [
      { id: 1, date: '2025-10-15', animalCount: 18, days: 14, notes: 'Good grass recovery', entryWeight: 1200, exitWeight: 1225 },
      { id: 2, date: '2025-09-01', animalCount: 20, days: 10, notes: 'Rotated early due to weather', entryWeight: 1180, exitWeight: 1200 }
    ],
    soilTests: [
      { id: 1, date: '2025-03-15', pH: 6.5, nitrogen: 'High', phosphorus: 'Medium', potassium: 'High', organicMatter: 4.2, recommendations: 'Maintain current fertility' }
    ],
    improvements: [
      { id: 1, date: '2025-02-10', type: 'Lime Application', amount: '2 tons', cost: 450, appliedBy: 'John Smith', notes: 'Spread evenly' },
      { id: 2, date: '2024-11-20', type: 'Overseeding', seed: 'Clover Mix', amount: '15 lbs', cost: 280, appliedBy: 'Mike Johnson' }
    ],
    harvests: [
      { id: 1, date: '2025-06-15', type: 'Hay - First Cut', quantity: 145, unit: 'bales', quality: 'Premium', moisture: 12, price: 8.50, buyer: 'Green Valley Farm', stored: 'Barn A' }
    ],
    fertilizations: [
      { id: 1, date: '2025-04-10', type: 'Nitrogen', product: 'Urea', rate: '50 lbs/acre', cost: 320, appliedBy: 'Tom Brown', weather: 'Clear', notes: 'Applied before rain forecast' }
    ],
    pestControl: [
      { id: 1, date: '2025-05-20', target: 'Broadleaf Weeds', product: '2,4-D', rate: '1 qt/acre', cost: 180, effectiveness: 'Good', appliedBy: 'Spray Service Co' }
    ],
    maintenanceSchedule: [
      { id: 1, task: 'Fence Inspection', frequency: 'Monthly', lastDone: '2025-10-01', nextDue: '2025-11-01', status: 'Due Soon' },
      { id: 2, task: 'Water Quality Test', frequency: 'Quarterly', lastDone: '2025-09-15', nextDue: '2025-12-15', status: 'Scheduled' },
      { id: 3, task: 'Soil Test', frequency: 'Annually', lastDone: '2025-03-15', nextDue: '2026-03-15', status: 'Scheduled' }
    ],
    biodiversity: 'High',
    weedPressure: 'Low',
    erosionRisk: 'Low',
    dragRisk: 'Low',
    compactionRisk: 'Low'
  },
  { 
    id: 'P-002', 
    name: 'River Field', 
    acreage: 7.3, 
    notes: 'Riverside pasture with natural irrigation',
    gpsCoordinates: { lat: 40.7150, lng: -74.0080 },
    soilType: 'Clay Loam',
    soilPH: 6.8,
    soilHealth: 'Good',
    forage: 'Fescue',
    forageSpecies: ['Tall Fescue', 'Clover'],
    planted: '2023-09-10',
    lastSoilTest: '2025-04-10',
    carryingCapacity: 15,
    currentOccupancy: 0,
    status: 'Resting',
    restPeriod: 45,
    targetRestPeriod: 42,
    lastGrazed: '2025-09-20',
    nextGrazingDate: '2025-11-04',
    fencing: 'Barbed Wire',
    fenceCondition: 'Fair',
    fenceLastInspected: '2025-09-01',
    waterSource: 'River Access',
    waterQuality: 'Excellent',
    waterLastTested: '2025-08-20',
    shade: true,
    shelter: false,
    biomass: 3200,
    forageHeight: 10,
    utilization: 0,
    grazingHistory: [
      { id: 1, date: '2025-09-20', animalCount: 12, days: 21, notes: 'Full rotation completed', entryWeight: 1190, exitWeight: 1215 }
    ],
    soilTests: [
      { id: 1, date: '2025-04-10', pH: 6.8, nitrogen: 'Medium', phosphorus: 'Medium', potassium: 'Medium', organicMatter: 3.8, recommendations: 'Consider nitrogen application in spring' }
    ],
    improvements: [
      { id: 1, date: '2025-03-05', type: 'Fence Repair', amount: '300 ft', cost: 520, appliedBy: 'John Smith', notes: 'Replaced damaged posts and wire' }
    ],
    harvests: [],
    fertilizations: [],
    pestControl: [
      { id: 1, date: '2025-06-10', target: 'Thistle', product: 'Spot Treatment', rate: 'As needed', cost: 85, effectiveness: 'Excellent', appliedBy: 'Mike Johnson' }
    ],
    maintenanceSchedule: [
      { id: 1, task: 'Fence Inspection', frequency: 'Monthly', lastDone: '2025-09-01', nextDue: '2025-10-01', status: 'Overdue' },
      { id: 2, task: 'Water Quality Test', frequency: 'Quarterly', lastDone: '2025-08-20', nextDue: '2025-11-20', status: 'Upcoming' }
    ],
    biodiversity: 'Medium',
    weedPressure: 'Medium',
    erosionRisk: 'Medium',
    dragRisk: 'Low',
    compactionRisk: 'Medium'
  }
]

export default function Pastures(){
  const KEY = 'cattalytics:pastures:v2'
  const [items, setItems] = useState([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [modalOpenId, setModalOpenId] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [filterStatus, setFilterStatus] = useState('all')
  
  const [formData, setFormData] = useState({
    name: '', acreage: '', forage: 'Mixed Grass', soilType: 'Loam', soilPH: 7.0,
    status: 'Planned', carryingCapacity: '', fencing: 'Electric', fenceCondition: 'Good',
    waterSource: 'Tank', shade: false, shelter: false, notes: ''
  })

  useEffect(()=>{
    const raw = localStorage.getItem(KEY)
    if(raw) setItems(JSON.parse(raw))
    else setItems(SAMPLE)
  }, [])

  useEffect(()=> localStorage.setItem(KEY, JSON.stringify(items)), [items])

  function resetForm(){
    setFormData({
      name: '', acreage: '', forage: 'Mixed Grass', soilType: 'Loam', soilPH: 7.0,
      status: 'Planned', carryingCapacity: '', fencing: 'Electric', fenceCondition: 'Good',
      waterSource: 'Tank', shade: false, shelter: false, notes: ''
    })
    setEditingId(null)
  }

  function add(){
    if(!formData.name.trim() || !formData.acreage) return
    
    if(editingId){
      setItems(items.map(i => i.id === editingId ? {
        ...i,
        ...formData,
        acreage: parseFloat(formData.acreage),
        soilPH: parseFloat(formData.soilPH),
        carryingCapacity: parseFloat(formData.carryingCapacity) || 0
      } : i))
      setEditingId(null)
    } else {
      const id = 'P-' + Math.floor(1000 + Math.random()*9000)
      setItems([...items, {
        id,
        ...formData,
        acreage: parseFloat(formData.acreage),
        soilPH: parseFloat(formData.soilPH),
        carryingCapacity: parseFloat(formData.carryingCapacity) || 0,
        currentOccupancy: 0,
        planted: new Date().toISOString().slice(0,10),
        grazingHistory: [],
        soilTests: [],
        improvements: [],
        harvests: [],
        fertilizations: [],
        pestControl: [],
        maintenanceSchedule: [],
        biodiversity: 'Medium',
        weedPressure: 'Low',
        erosionRisk: 'Low'
      }])
    }
    
    resetForm()
    setShowAddForm(false)
  }

  function startEdit(item){
    setFormData({...item})
    setEditingId(item.id)
    setShowAddForm(true)
  }

  function remove(id){
    if(!confirm('Delete pasture? This will remove all history.')) return
    setItems(items.filter(i=>i.id!==id))
  }

  // Activity tracking functions
  function addGrazing(pastureId, grazingData){
    setItems(items.map(i => i.id === pastureId ? {
      ...i,
      grazingHistory: [...(i.grazingHistory || []), { 
        id: Date.now(), 
        date: new Date().toISOString().slice(0,10),
        ...grazingData 
      }],
      lastGrazed: new Date().toISOString().slice(0,10),
      currentOccupancy: grazingData.animalCount || 0,
      status: 'Active Grazing'
    } : i))
  }

  function endGrazing(pastureId){
    setItems(items.map(i => i.id === pastureId ? {
      ...i,
      currentOccupancy: 0,
      status: 'Resting',
      nextGrazingDate: calculateNextGrazing(i)
    } : i))
  }

  function calculateNextGrazing(pasture){
    if(!pasture.lastGrazed || !pasture.targetRestPeriod) return ''
    const lastDate = new Date(pasture.lastGrazed)
    lastDate.setDate(lastDate.getDate() + (pasture.targetRestPeriod || 35))
    return lastDate.toISOString().slice(0,10)
  }

  function addHarvest(pastureId, harvestData){
    setItems(items.map(i => i.id === pastureId ? {
      ...i,
      harvests: [...(i.harvests || []), { 
        id: Date.now(), 
        date: new Date().toISOString().slice(0,10),
        ...harvestData 
      }]
    } : i))
  }

  function addImprovement(pastureId, improvementData){
    setItems(items.map(i => i.id === pastureId ? {
      ...i,
      improvements: [...(i.improvements || []), { 
        id: Date.now(), 
        date: new Date().toISOString().slice(0,10),
        ...improvementData 
      }]
    } : i))
  }

  function addFertilization(pastureId, fertData){
    setItems(items.map(i => i.id === pastureId ? {
      ...i,
      fertilizations: [...(i.fertilizations || []), { 
        id: Date.now(), 
        date: new Date().toISOString().slice(0,10),
        ...fertData 
      }]
    } : i))
  }

  function addPestControl(pastureId, pestData){
    setItems(items.map(i => i.id === pastureId ? {
      ...i,
      pestControl: [...(i.pestControl || []), { 
        id: Date.now(), 
        date: new Date().toISOString().slice(0,10),
        ...pestData 
      }]
    } : i))
  }

  function addSoilTest(pastureId, testData){
    setItems(items.map(i => i.id === pastureId ? {
      ...i,
      soilTests: [...(i.soilTests || []), { 
        id: Date.now(), 
        date: new Date().toISOString().slice(0,10),
        ...testData 
      }],
      lastSoilTest: new Date().toISOString().slice(0,10),
      soilPH: testData.pH || i.soilPH
    } : i))
  }

  const filteredItems = items.filter(i => 
    filterStatus === 'all' || i.status === filterStatus
  )

  const totalAcres = items.reduce((sum, i) => sum + (i.acreage || 0), 0)
  const activeGrazing = items.filter(i => i.status === 'Active Grazing').length
  const resting = items.filter(i => i.status === 'Resting').length
  const overdueMaintenance = items.reduce((count, pasture) => {
    const overdue = (pasture.maintenanceSchedule || []).filter(m => m.status === 'Overdue').length
    return count + overdue
  }, 0)

  return (
    <div>
      <div className="health-header">
        <div>
          <h2>🌱 Pasture Management</h2>
          <p className="muted">Complete pasture lifecycle from planting to harvest and storage</p>
        </div>
        <button className="tab-btn" onClick={()=> setShowAddForm(!showAddForm)}>
          {showAddForm ? '✕ Cancel' : '+ Add Pasture'}
        </button>
      </div>

      {/* Summary Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '16px', background: '#f0fdf4' }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Total Acres</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#059669' }}>{totalAcres.toFixed(1)}</div>
        </div>
        <div className="card" style={{ padding: '16px', background: '#eff6ff' }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Total Pastures</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#2563eb' }}>{items.length}</div>
        </div>
        <div className="card" style={{ padding: '16px', background: '#fef3c7' }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Active Grazing</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#f59e0b' }}>{activeGrazing}</div>
        </div>
        <div className="card" style={{ padding: '16px', background: '#ede9fe' }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Resting</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#7c3aed' }}>{resting}</div>
        </div>
        {overdueMaintenance > 0 && (
          <div className="card" style={{ padding: '16px', background: '#fee2e2' }}>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Overdue Tasks</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#dc2626' }}>{overdueMaintenance}</div>
          </div>
        )}
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="card" style={{ padding: '20px', marginBottom: '24px' }}>
          <h3 style={{ marginTop: 0 }}>{editingId ? 'Edit Pasture' : 'Add New Pasture'}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            <div>
              <label>Pasture Name *</label>
              <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div>
              <label>Acreage *</label>
              <input type="number" step="0.1" value={formData.acreage} onChange={e => setFormData({...formData, acreage: e.target.value})} />
            </div>
            <div>
              <label>Status</label>
              <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label>Primary Forage</label>
              <select value={formData.forage} onChange={e => setFormData({...formData, forage: e.target.value})}>
                {FORAGE_TYPES.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label>Soil Type</label>
              <select value={formData.soilType} onChange={e => setFormData({...formData, soilType: e.target.value})}>
                {SOIL_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label>Soil pH</label>
              <input type="number" step="0.1" value={formData.soilPH} onChange={e => setFormData({...formData, soilPH: e.target.value})} />
            </div>
            <div>
              <label>Carrying Capacity (head)</label>
              <input type="number" value={formData.carryingCapacity} onChange={e => setFormData({...formData, carryingCapacity: e.target.value})} />
            </div>
            <div>
              <label>Fencing Type</label>
              <select value={formData.fencing} onChange={e => setFormData({...formData, fencing: e.target.value})}>
                {FENCE_TYPES.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label>Fence Condition</label>
              <select value={formData.fenceCondition} onChange={e => setFormData({...formData, fenceCondition: e.target.value})}>
                <option>Excellent</option>
                <option>Good</option>
                <option>Fair</option>
                <option>Poor</option>
                <option>Needs Repair</option>
              </select>
            </div>
            <div>
              <label>Water Source</label>
              <select value={formData.waterSource} onChange={e => setFormData({...formData, waterSource: e.target.value})}>
                {WATER_SOURCES.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" checked={formData.shade} onChange={e => setFormData({...formData, shade: e.target.checked})} />
                Shade Available
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" checked={formData.shelter} onChange={e => setFormData({...formData, shelter: e.target.checked})} />
                Shelter Available
              </label>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label>Notes</label>
              <textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} rows={2} />
            </div>
          </div>
          <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
            <button onClick={add}>{editingId ? 'Save Changes' : 'Add Pasture'}</button>
            <button onClick={() => { resetForm(); setShowAddForm(false) }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Filter */}
      <div style={{ marginBottom: '16px' }}>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="all">All Pastures</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Pastures Grid */}
      <div style={{ display: 'grid', gap: '16px' }}>
        {filteredItems.map(pasture => {
          const daysUntilNext = pasture.nextGrazingDate ? 
            Math.ceil((new Date(pasture.nextGrazingDate) - new Date()) / (1000 * 60 * 60 * 24)) : null
          const overdueItems = (pasture.maintenanceSchedule || []).filter(m => m.status === 'Overdue').length
          
          return (
            <div key={pasture.id} className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <h3 style={{ margin: 0 }}>{pasture.name}</h3>
                    <span className="badge" style={{ background: 
                      pasture.status === 'Active Grazing' ? '#f59e0b' :
                      pasture.status === 'Resting' ? '#7c3aed' :
                      pasture.status === 'Maintenance' ? '#dc2626' :
                      '#059669'
                    }}>{pasture.status}</span>
                    {overdueItems > 0 && <span className="badge" style={{ background: '#dc2626' }}>⚠ {overdueItems} Overdue</span>}
                  </div>
                  <div className="muted" style={{ marginTop: '4px' }}>{pasture.id} • {pasture.acreage} acres • {pasture.forage}</div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="tab-btn" onClick={() => setModalOpenId(pasture.id)}>📋 Manage</button>
                  <button className="tab-btn" onClick={() => startEdit(pasture)}>✏️ Edit</button>
                  <button className="tab-btn" style={{ color: '#dc2626' }} onClick={() => remove(pasture.id)}>🗑️</button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', fontSize: '14px' }}>
                <div>
                  <div className="muted">Occupancy</div>
                  <div style={{ fontWeight: '600' }}>{pasture.currentOccupancy || 0} / {pasture.carryingCapacity || 0}</div>
                </div>
                <div>
                  <div className="muted">Last Grazed</div>
                  <div style={{ fontWeight: '600' }}>{pasture.lastGrazed ? new Date(pasture.lastGrazed).toLocaleDateString() : 'Never'}</div>
                </div>
                {daysUntilNext !== null && (
                  <div>
                    <div className="muted">Next Grazing</div>
                    <div style={{ fontWeight: '600', color: daysUntilNext <= 7 ? '#059669' : '#6b7280' }}>
                      {daysUntilNext > 0 ? `${daysUntilNext} days` : 'Ready'}
                    </div>
                  </div>
                )}
                <div>
                  <div className="muted">Soil pH</div>
                  <div style={{ fontWeight: '600' }}>{pasture.soilPH || 'N/A'}</div>
                </div>
                <div>
                  <div className="muted">Fence</div>
                  <div style={{ fontWeight: '600' }}>{pasture.fenceCondition}</div>
                </div>
                <div>
                  <div className="muted">Water</div>
                  <div style={{ fontWeight: '600' }}>{pasture.waterSource}</div>
                </div>
              </div>

              {pasture.notes && (
                <div style={{ marginTop: '12px', padding: '12px', background: '#f9fafb', borderRadius: '6px', fontSize: '13px' }}>
                  {pasture.notes}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {filteredItems.length === 0 && (
        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🌱</div>
          <h3>No pastures found</h3>
          <p className="muted">Add your first pasture to start comprehensive management</p>
        </div>
      )}

      {/* Comprehensive Management Modal */}
      {modalOpenId && (() => {
        const p = items.find(x => x.id === modalOpenId)
        if(!p) return null
        
        return (
          <div className="drawer-overlay" onClick={() => setModalOpenId(null)}>
            <div className="drawer" onClick={e => e.stopPropagation()} style={{ maxWidth: '1200px', width: '95%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0 }}>{p.name} — Full Management</h3>
                <button onClick={() => setModalOpenId(null)}>✕ Close</button>
              </div>

              {/* Tabs */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <button className={activeTab === 'overview' ? 'tab-btn active' : 'tab-btn'} onClick={() => setActiveTab('overview')}>Overview</button>
                <button className={activeTab === 'grazing' ? 'tab-btn active' : 'tab-btn'} onClick={() => setActiveTab('grazing')}>Grazing</button>
                <button className={activeTab === 'harvests' ? 'tab-btn active' : 'tab-btn'} onClick={() => setActiveTab('harvests')}>Harvests</button>
                <button className={activeTab === 'improvements' ? 'tab-btn active' : 'tab-btn'} onClick={() => setActiveTab('improvements')}>Improvements</button>
                <button className={activeTab === 'fertility' ? 'tab-btn active' : 'tab-btn'} onClick={() => setActiveTab('fertility')}>Fertility</button>
                <button className={activeTab === 'pest' ? 'tab-btn active' : 'tab-btn'} onClick={() => setActiveTab('pest')}>Pest Control</button>
                <button className={activeTab === 'maintenance' ? 'tab-btn active' : 'tab-btn'} onClick={() => setActiveTab('maintenance')}>Maintenance</button>
              </div>

              <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div style={{ display: 'grid', gap: '16px' }}>
                    <div className="card" style={{ padding: '16px' }}>
                      <h4>Pasture Details</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', fontSize: '14px' }}>
                        <div><strong>Acreage:</strong> {p.acreage}</div>
                        <div><strong>Primary Forage:</strong> {p.forage}</div>
                        <div><strong>Planted:</strong> {p.planted ? new Date(p.planted).toLocaleDateString() : 'N/A'}</div>
                        <div><strong>Soil Type:</strong> {p.soilType}</div>
                        <div><strong>Soil pH:</strong> {p.soilPH}</div>
                        <div><strong>Soil Health:</strong> {p.soilHealth || 'Good'}</div>
                        <div><strong>Carrying Capacity:</strong> {p.carryingCapacity} head</div>
                        <div><strong>Current Occupancy:</strong> {p.currentOccupancy || 0} head</div>
                        <div><strong>Status:</strong> {p.status}</div>
                        <div><strong>Fencing:</strong> {p.fencing} ({p.fenceCondition})</div>
                        <div><strong>Water Source:</strong> {p.waterSource}</div>
                        <div><strong>Shade:</strong> {p.shade ? 'Yes' : 'No'}</div>
                        <div><strong>Shelter:</strong> {p.shelter ? 'Yes' : 'No'}</div>
                        <div><strong>Biodiversity:</strong> {p.biodiversity}</div>
                        <div><strong>Weed Pressure:</strong> {p.weedPressure}</div>
                      </div>
                    </div>

                    {p.forageSpecies && p.forageSpecies.length > 0 && (
                      <div className="card" style={{ padding: '16px' }}>
                        <h4>Forage Species</h4>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {p.forageSpecies.map(species => (
                            <span key={species} className="badge" style={{ background: 'var(--green)' }}>{species}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Grazing Tab */}
                {activeTab === 'grazing' && (
                  <div style={{ display: 'grid', gap: '16px' }}>
                    <div className="card" style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h4 style={{ margin: 0 }}>Grazing Management</h4>
                        <button onClick={() => {
                          const animalCount = parseInt(prompt('Number of animals:'))
                          const days = parseInt(prompt('Planned grazing days:'))
                          const notes = prompt('Notes (optional):') || ''
                          if(animalCount && days) {
                            addGrazing(p.id, { animalCount, days, notes, entryWeight: 0, exitWeight: 0 })
                          }
                        }}>+ Start Grazing</button>
                      </div>
                      {p.currentOccupancy > 0 && (
                        <div style={{ padding: '12px', background: '#fef3c7', borderRadius: '6px', marginBottom: '16px' }}>
                          <strong>Currently Grazing:</strong> {p.currentOccupancy} animals
                          <button onClick={() => endGrazing(p.id)} style={{ marginLeft: '16px', background: '#059669' }}>End Grazing</button>
                        </div>
                      )}
                      <div><strong>Last Grazed:</strong> {p.lastGrazed || 'Never'}</div>
                      <div><strong>Target Rest Period:</strong> {p.targetRestPeriod || 35} days</div>
                      <div><strong>Next Grazing Date:</strong> {p.nextGrazingDate || 'Not calculated'}</div>
                    </div>

                    <div className="card" style={{ padding: '16px' }}>
                      <h4>Grazing History</h4>
                      {(p.grazingHistory || []).length === 0 ? (
                        <div className="muted">No grazing history recorded</div>
                      ) : (
                        <div style={{ display: 'grid', gap: '12px' }}>
                          {(p.grazingHistory || []).map(grazing => (
                            <div key={grazing.id} style={{ padding: '12px', background: '#f9fafb', borderRadius: '6px' }}>
                              <div style={{ fontWeight: '600' }}>{grazing.date}</div>
                              <div style={{ fontSize: '14px', color: '#6b7280' }}>
                                {grazing.animalCount} animals for {grazing.days} days
                                {grazing.notes && <div>{grazing.notes}</div>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Harvests Tab */}
                {activeTab === 'harvests' && (
                  <div style={{ display: 'grid', gap: '16px' }}>
                    <div className="card" style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h4 style={{ margin: 0 }}>Hay & Forage Harvests</h4>
                        <button onClick={() => {
                          const type = prompt('Harvest type (e.g., Hay - First Cut):')
                          const quantity = parseFloat(prompt('Quantity:'))
                          const unit = prompt('Unit (bales/tons):') || 'bales'
                          const quality = prompt('Quality (Premium/Good/Fair):') || 'Good'
                          const stored = prompt('Storage location:') || ''
                          if(type && quantity) {
                            addHarvest(p.id, { type, quantity, unit, quality, stored, moisture: 0, price: 0 })
                          }
                        }}>+ Record Harvest</button>
                      </div>
                      {(p.harvests || []).length === 0 ? (
                        <div className="muted">No harvests recorded</div>
                      ) : (
                        <div style={{ display: 'grid', gap: '12px' }}>
                          {(p.harvests || []).map(harvest => (
                            <div key={harvest.id} style={{ padding: '12px', background: '#f9fafb', borderRadius: '6px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                <div>
                                  <div style={{ fontWeight: '600' }}>{harvest.type}</div>
                                  <div style={{ fontSize: '14px', color: '#6b7280' }}>
                                    {harvest.date} • {harvest.quantity} {harvest.unit} • Quality: {harvest.quality}
                                    {harvest.stored && <div>Stored: {harvest.stored}</div>}
                                  </div>
                                </div>
                                {harvest.price > 0 && (
                                  <div style={{ fontWeight: '600', color: '#059669' }}>
                                    KSH {(harvest.quantity * harvest.price).toLocaleString()}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Improvements Tab */}
                {activeTab === 'improvements' && (
                  <div style={{ display: 'grid', gap: '16px' }}>
                    <div className="card" style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h4 style={{ margin: 0 }}>Pasture Improvements</h4>
                        <button onClick={() => {
                          const type = prompt(`Improvement type (${IMPROVEMENT_TYPES.join(', ')}):`)
                          const amount = prompt('Amount/Details:')
                          const cost = parseFloat(prompt('Cost (KSH):')) || 0
                          const appliedBy = prompt('Applied by:') || ''
                          const notes = prompt('Notes:') || ''
                          if(type) {
                            addImprovement(p.id, { type, amount, cost, appliedBy, notes })
                          }
                        }}>+ Add Improvement</button>
                      </div>
                      {(p.improvements || []).length === 0 ? (
                        <div className="muted">No improvements recorded</div>
                      ) : (
                        <div style={{ display: 'grid', gap: '12px' }}>
                          {(p.improvements || []).map(imp => (
                            <div key={imp.id} style={{ padding: '12px', background: '#f9fafb', borderRadius: '6px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <div>
                                  <div style={{ fontWeight: '600' }}>{imp.type}</div>
                                  <div style={{ fontSize: '14px', color: '#6b7280' }}>
                                    {imp.date} • {imp.amount}
                                    {imp.appliedBy && ` • By: ${imp.appliedBy}`}
                                    {imp.notes && <div>{imp.notes}</div>}
                                  </div>
                                </div>
                                <div style={{ fontWeight: '600', color: '#dc2626' }}>KSH {Number(imp.cost).toLocaleString()}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Fertility Tab */}
                {activeTab === 'fertility' && (
                  <div style={{ display: 'grid', gap: '16px' }}>
                    <div className="card" style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h4 style={{ margin: 0 }}>Soil Tests</h4>
                        <button onClick={() => {
                          const pH = parseFloat(prompt('pH:'))
                          const nitrogen = prompt('Nitrogen level (Low/Medium/High):')
                          const phosphorus = prompt('Phosphorus level:')
                          const potassium = prompt('Potassium level:')
                          const organicMatter = parseFloat(prompt('Organic Matter %:'))
                          const recommendations = prompt('Recommendations:') || ''
                          if(pH) {
                            addSoilTest(p.id, { pH, nitrogen, phosphorus, potassium, organicMatter, recommendations })
                          }
                        }}>+ Add Soil Test</button>
                      </div>
                      {(p.soilTests || []).length === 0 ? (
                        <div className="muted">No soil tests recorded</div>
                      ) : (
                        <div style={{ display: 'grid', gap: '12px' }}>
                          {(p.soilTests || []).map(test => (
                            <div key={test.id} style={{ padding: '12px', background: '#f9fafb', borderRadius: '6px' }}>
                              <div style={{ fontWeight: '600', marginBottom: '8px' }}>{test.date}</div>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', fontSize: '14px' }}>
                                <div><strong>pH:</strong> {test.pH}</div>
                                <div><strong>N:</strong> {test.nitrogen}</div>
                                <div><strong>P:</strong> {test.phosphorus}</div>
                                <div><strong>K:</strong> {test.potassium}</div>
                                <div><strong>OM:</strong> {test.organicMatter}%</div>
                              </div>
                              {test.recommendations && (
                                <div style={{ marginTop: '8px', fontSize: '13px', fontStyle: 'italic' }}>
                                  {test.recommendations}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="card" style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h4 style={{ margin: 0 }}>Fertilization History</h4>
                        <button onClick={() => {
                          const type = prompt('Type (Nitrogen/Phosphorus/Potassium/Complete):')
                          const product = prompt('Product name:')
                          const rate = prompt('Application rate:')
                          const cost = parseFloat(prompt('Cost ($):')) || 0
                          const appliedBy = prompt('Applied by:') || ''
                          if(type && product) {
                            addFertilization(p.id, { type, product, rate, cost, appliedBy, weather: '' })
                          }
                        }}>+ Add Application</button>
                      </div>
                      {(p.fertilizations || []).length === 0 ? (
                        <div className="muted">No fertilizations recorded</div>
                      ) : (
                        <div style={{ display: 'grid', gap: '12px' }}>
                          {(p.fertilizations || []).map(fert => (
                            <div key={fert.id} style={{ padding: '12px', background: '#f9fafb', borderRadius: '6px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <div>
                                  <div style={{ fontWeight: '600' }}>{fert.type} - {fert.product}</div>
                                  <div style={{ fontSize: '14px', color: '#6b7280' }}>
                                    Rate: {fert.rate}
                                    {fert.appliedBy && ` • By: ${fert.appliedBy}`}
                                  </div>
                                </div>
                                <div style={{ fontWeight: '600', color: '#dc2626' }}>KSH {Number(fert.cost).toLocaleString()}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Pest Control Tab */}
                {activeTab === 'pest' && (
                  <div className="card" style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <h4 style={{ margin: 0 }}>Weed & Pest Control</h4>
                      <button onClick={() => {
                        const target = prompt('Pest/weed target:')
                        const product = prompt('Product used:')
                        const rate = prompt('Application rate:')
                        const cost = parseFloat(prompt('Cost (KSH):')) || 0
                        const effectiveness = prompt('Effectiveness (Poor/Fair/Good/Excellent):') || 'Good'
                        const appliedBy = prompt('Applied by:') || ''
                        if(target && product) {
                          addPestControl(p.id, { target, product, rate, cost, effectiveness, appliedBy })
                        }
                      }}>+ Add Treatment</button>
                    </div>
                    {(p.pestControl || []).length === 0 ? (
                      <div className="muted">No pest control recorded</div>
                    ) : (
                      <div style={{ display: 'grid', gap: '12px' }}>
                        {(p.pestControl || []).map(pest => (
                          <div key={pest.id} style={{ padding: '12px', background: '#f9fafb', borderRadius: '6px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <div>
                                <div style={{ fontWeight: '600' }}>Target: {pest.target}</div>
                                <div style={{ fontSize: '14px', color: '#6b7280' }}>
                                  {pest.date} • {pest.product} @ {pest.rate}
                                  <div>Effectiveness: {pest.effectiveness}</div>
                                  {pest.appliedBy && <div>By: {pest.appliedBy}</div>}
                                </div>
                              </div>
                              <div style={{ fontWeight: '600', color: '#dc2626' }}>KSH {Number(pest.cost).toLocaleString()}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Maintenance Tab */}
                {activeTab === 'maintenance' && (
                  <div className="card" style={{ padding: '16px' }}>
                    <h4>Maintenance Schedule</h4>
                    {(p.maintenanceSchedule || []).length === 0 ? (
                      <div className="muted">No maintenance schedule set up</div>
                    ) : (
                      <div style={{ display: 'grid', gap: '12px' }}>
                        {(p.maintenanceSchedule || []).map(maint => (
                          <div key={maint.id} style={{ 
                            padding: '12px', 
                            background: maint.status === 'Overdue' ? '#fee2e2' : '#f9fafb', 
                            borderRadius: '6px',
                            borderLeft: maint.status === 'Overdue' ? '4px solid #dc2626' : 'none'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                              <div>
                                <div style={{ fontWeight: '600' }}>{maint.task}</div>
                                <div style={{ fontSize: '14px', color: '#6b7280' }}>
                                  Frequency: {maint.frequency}
                                  <div>Last Done: {maint.lastDone || 'Never'}</div>
                                  <div>Next Due: {maint.nextDue}</div>
                                </div>
                              </div>
                              <span className="badge" style={{ 
                                background: maint.status === 'Overdue' ? '#dc2626' : 
                                           maint.status === 'Due Soon' ? '#f59e0b' : '#059669'
                              }}>
                                {maint.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
