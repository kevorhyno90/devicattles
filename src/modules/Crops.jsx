import React, { useEffect, useState } from 'react'

const SAMPLE = [
  {
    id: 'C-001', 
    name: 'Premium Alfalfa', 
    variety: 'Vernal',
    planted: '2025-03-15', 
    plantDate: '2025-03-15',
    expectedHarvest: '2025-07-15',
    area: 5.2, 
    field: 'North Field A',
    status: 'Growing',
    soilType: 'Clay Loam',
    irrigationType: 'Sprinkler',
    irrigationMethod: 'Sprinkler',
    seedCost: 450,
    actualHarvest: '',
    notes: 'Premium alfalfa field with excellent soil conditions and irrigation system.',
    healthScore: 90,
    stressLevel: 'Low',
    diseaseRisk: 'Low',
    pestPressure: 'Low',
    treatments: [
      { id: 1, date: '2025-04-01', type: 'Fertilizer', product: 'NPK 20-10-10', amount: '150 lbs/acre', cost: 89.50, applicator: 'John Smith', weather: 'Clear, 65°F', notes: 'Spring fertilization' }
    ],
    yieldRecords: [],
    soilTests: [
      { id: 1, date: '2025-02-15', ph: 6.8, nitrogen: 45, phosphorus: 38, potassium: 165, organicMatter: 3.2, recommendations: 'Good soil health, maintain current practices', labName: 'Farm Lab', testCost: 35 }
    ],
    irrigationRecords: [
      { id: 1, date: '2025-05-10', duration: 4.5, amount: 1.2, type: 'Sprinkler', pressure: 35, efficiency: 85, cost: 15.20 }
    ],
    pestManagement: [],
    fieldOperations: [
      { id: 1, date: '2025-03-10', operation: 'Tillage', equipment: 'Disc Harrow', depth: 4, hours: 2.5, fuel: 12.3, operator: 'Mike Johnson' }
    ],
    healthMonitoring: [
      { id: 1, date: '2024-04-15', type: 'Visual Inspection', healthScore: 92, leafColor: 'Dark Green', plantHeight: 8, standCount: 95000, diseasePresent: false, pestDamage: false, nutrientDeficiency: 'None', weatherStress: 'None', notes: 'Excellent germination and early vigor' },
      { id: 2, date: '2024-05-20', type: 'Drone Survey', healthScore: 88, leafColor: 'Green', plantHeight: 24, standCount: 94500, diseasePresent: false, pestDamage: false, nutrientDeficiency: 'None', weatherStress: 'Light', notes: 'Good growth, some moisture stress visible in corners' }
    ],
    scoutingReports: [
      { id: 1, date: '2024-05-10', scoutName: 'Sarah Miller', quadrant: 'NE', weedPressure: 'Low', insectCount: 3, diseaseSymptoms: 'None', soilMoisture: 'Adequate', plantVigor: 'Excellent', recommendations: 'Continue current management', gpsLocation: '40.7128, -74.0060' }
    ],
    diseaseMonitoring: [
      { id: 1, date: '2024-05-15', disease: 'None', severity: 0, coverage: 0, treatment: 'None', effectiveness: 'N/A', cost: 0, weatherConditions: 'Dry, sunny', humidity: 45, temperature: 72, notes: 'Clean field, no disease pressure detected' }
    ],
    weatherData: [
      { id: 1, date: '2024-04-01', temperature: 65, humidity: 60, rainfall: 0.5, windSpeed: 8, growingDegreeDays: 15, stressFactors: 'None', irrigationNeeded: false },
      { id: 2, date: '2024-05-15', temperature: 78, humidity: 45, rainfall: 0.0, windSpeed: 12, growingDegreeDays: 28, stressFactors: 'Mild Drought', irrigationNeeded: true }
    ],
    complianceRecords: [
      { id: 1, date: '2024-04-05', type: 'Organic Certification', product: 'Alfalfa Seed', certification: 'OMRI Listed', recordKeeping: 'Complete', bufferZones: 'Maintained' }
    ],
    sustainabilityMetrics: {
      carbonFootprint: 1.8,
      waterUsageEfficiency: 90,
      soilHealthScore: 85,
      biodiversityIndex: 78,
      energyUsage: 25,
      nutrientUseEfficiency: 88,
      erosionControl: 'Excellent',
      pollinatorSupport: 'Excellent'
    },
    riskAssessment: {
      weatherRisk: 'Low',
      diseaseRisk: 'Low',
      pestRisk: 'Low',
      marketRisk: 'Low',
      yieldRisk: 'Low',
      qualityRisk: 'Low',
      mitigationStrategies: ['Organic certification premium', 'Diverse harvest windows', 'Local market contracts']
    },
    gpsCoordinates: { lat: 40.7128, lng: -74.0060 },
    seedingRate: 25,
    rowSpacing: 7,
    plantingDepth: 0.5,
    cultivar: 'Vernal',
    certificationLevel: 'Certified Organic',
    marketDestination: 'Local Dairy Farms',
    contractPrice: 0,
    insuranceCoverage: true
  },
  { 
    id: 'C-002', 
    name: 'Field Corn', 
    variety: 'Pioneer 1234',
    planted: '2025-04-20', 
    plantDate: '2025-04-20',
    expectedHarvest: '2025-09-15',
    area: 12.8, 
    field: 'South Field B',
    status: 'Planted',
    seedCost: 2800,
    healthScore: 85,
    stressLevel: 'Low',
    diseaseRisk: 'Medium',
    pestPressure: 'Low',
    soilType: 'Sandy Loam',
    irrigationType: 'Center Pivot',
    actualHarvest: '',
    notes: [],
    treatments: [],
    yieldRecords: [],
    soilTests: [],
    irrigation: [],
    pestManagement: [],
    fieldOperations: [],
    gpsCoordinates: { lat: 40.7200, lng: -74.0100 },
    seedingRate: 32000,
    rowSpacing: 30,
    plantingDepth: 2,
    cultivar: 'Pioneer 1234',
    certificationLevel: 'Conventional',
    marketDestination: 'Grain Elevator',
    contractPrice: 4.85,
    insuranceCoverage: true,
    weatherData: []
  },
  { 
    id: 'C-003', 
    name: 'Winter Wheat', 
    variety: 'Hard Red Winter',
    planted: '2024-10-15', 
    plantDate: '2024-10-15',
    expectedHarvest: '2025-06-15',
    area: 8.5, 
    field: 'East Field C',
    status: 'Mature',
    seedCost: 1200,
    healthScore: 95,
    stressLevel: 'None',
    diseaseRisk: 'Low',
    pestPressure: 'Low',
    soilType: 'Silt Loam',
    irrigationType: 'Dryland',
    actualHarvest: '2025-06-18',
    notes: [],
    treatments: [],
    yields: [],
    yieldRecords: [
      { id: 1, date: '2025-06-18', amount: 55.2, unit: 'bushels/acre', quality: 'Premium', moisture: 12.5, testWeight: 60.1, protein: 13.2, price: 6.25, totalValue: 2784.50 }
    ],
    soilTests: [],
    irrigation: [],
    pestManagement: [],
    fieldOperations: [],
    gpsCoordinates: { lat: 40.7050, lng: -74.0200 },
    seedingRate: 90,
    rowSpacing: 7.5,
    plantingDepth: 1.5,
    cultivar: 'Hard Red Winter',
    certificationLevel: 'Conventional',
    marketDestination: 'Flour Mill',
    contractPrice: 6.25,
    insuranceCoverage: true,
    weatherData: []
  }
]

const CROP_TYPES = [
  'Alfalfa', 'Corn', 'Wheat', 'Soybeans', 'Barley', 'Oats', 'Rye', 'Sorghum', 
  'Cotton', 'Rice', 'Sunflower', 'Canola', 'Hay', 'Pasture Grass', 'Sugar Beets',
  'Potatoes', 'Onions', 'Carrots', 'Tomatoes', 'Lettuce', 'Spinach', 'Broccoli',
  'Apples', 'Grapes', 'Strawberries', 'Blueberries', 'Other'
]

const SOIL_TYPES = ['Clay', 'Clay Loam', 'Loam', 'Sandy Loam', 'Sand', 'Silt', 'Silt Loam', 'Peat', 'Muck']
const IRRIGATION_TYPES = ['Dryland', 'Sprinkler', 'Drip', 'Center Pivot', 'Flood', 'Furrow', 'Micro-sprinkler', 'Subsurface Drip']
const CROP_STATUS = ['Planned', 'Planted', 'Germinating', 'Growing', 'Flowering', 'Filling', 'Mature', 'Harvested', 'Failed', 'Dormant']
const CERTIFICATION_LEVELS = ['Conventional', 'Certified Organic', 'Transitional Organic', 'Non-GMO', 'Sustainable', 'Biodynamic']
const TREATMENT_TYPES = ['Fertilizer', 'Herbicide', 'Insecticide', 'Fungicide', 'Growth Regulator', 'Micronutrients', 'Organic Amendment', 'Lime', 'Other']
const EQUIPMENT_TYPES = ['Tractor', 'Combine', 'Planter', 'Cultivator', 'Disc Harrow', 'Chisel Plow', 'Sprayer', 'Spreader', 'Mower', 'Other']
const OPERATION_TYPES = ['Tillage', 'Planting', 'Cultivation', 'Spraying', 'Fertilizing', 'Harvesting', 'Mowing', 'Baling', 'Transportation', 'Other']
const HEALTH_MONITORING_TYPES = ['Visual Inspection', 'Drone Survey', 'Satellite Imagery', 'Tissue Test', 'Soil Test', 'Weather Station', 'IoT Sensors', 'Lab Analysis']
const DISEASE_TYPES = ['Fungal', 'Bacterial', 'Viral', 'Nematode', 'Nutrient Deficiency', 'Weather Stress', 'Mechanical Damage', 'Herbicide Injury']
const PEST_CATEGORIES = ['Insects', 'Weeds', 'Diseases', 'Rodents', 'Birds', 'Nematodes', 'Mites', 'Slugs']
const STRESS_LEVELS = ['None', 'Low', 'Medium', 'High', 'Severe']
const RISK_LEVELS = ['Very Low', 'Low', 'Medium', 'High', 'Very High']
const COMPLIANCE_TYPES = ['Pesticide Application', 'Fertilizer Application', 'Organic Certification', 'GAP Compliance', 'Worker Safety', 'Environmental Protection']
const SUSTAINABILITY_METRICS = ['Carbon Footprint', 'Water Usage', 'Soil Health', 'Biodiversity', 'Energy Usage', 'Nutrient Efficiency', 'Erosion Control', 'Pollinator Support']

export default function Crops(){
  const KEY = 'cattalytics:crops:v2' // Changed key to force reload of new data
  const [items, setItems] = useState([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [modalOpenId, setModalOpenId] = useState(null)
  const [activeTab, setActiveTab] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [sortBy, setSortBy] = useState('planted')
  
  const [formData, setFormData] = useState({
    name: '', variety: '', field: '', area: '', planted: '', expectedHarvest: '',
    soilType: 'Loam', irrigationType: 'Sprinkler', status: 'Planned', certificationLevel: 'Conventional',
    seedingRate: '', rowSpacing: '', plantingDepth: '', marketDestination: '', contractPrice: '',
    insuranceCoverage: false, gpsLat: '', gpsLng: ''
  })

  useEffect(()=>{
    // Force clear old data and load new comprehensive sample data
    localStorage.removeItem('cattalytics:crops')
    localStorage.removeItem('cattalytics:crops:v2')
    console.log('Loading comprehensive crop data with health monitoring...', SAMPLE)
    setItems(SAMPLE)
  }, [])

  useEffect(()=> localStorage.setItem(KEY, JSON.stringify(items)), [items])

  function add(){
    if(!formData.name.trim() || !formData.area) return
    const id = 'C-' + Math.floor(1000 + Math.random()*9000)
    const newCrop = {
      id,
      ...formData,
      name: formData.name.trim(),
      area: Number(formData.area),
      seedingRate: Number(formData.seedingRate) || 0,
      rowSpacing: Number(formData.rowSpacing) || 0,
      plantingDepth: Number(formData.plantingDepth) || 0,
      contractPrice: Number(formData.contractPrice) || 0,
      gpsCoordinates: formData.gpsLat && formData.gpsLng ? 
        { lat: Number(formData.gpsLat), lng: Number(formData.gpsLng) } : null,
      notes: formData.notes || '',
      treatments: [],
      yieldRecords: [],
      soilTests: [],
      irrigationRecords: [],
      pestManagement: [],
      fieldOperations: [],
      weatherData: [],
      actualHarvest: '',
      cultivar: formData.variety
    }
    setItems([...items, newCrop])
    setFormData({ 
      name: '', variety: '', field: '', area: '', planted: '', expectedHarvest: '',
      soilType: 'Loam', irrigationType: 'Sprinkler', status: 'Planned', certificationLevel: 'Conventional',
      seedingRate: '', rowSpacing: '', plantingDepth: '', marketDestination: '', contractPrice: '',
      insuranceCoverage: false, gpsLat: '', gpsLng: ''
    })
    setShowAddForm(false)
  }

  function remove(id){ 
    if(!confirm('Delete crop '+id+'?')) return
    setItems(items.filter(i=>i.id!==id)) 
  }

  function addNote(cropId, noteText){
    if(!noteText.trim()) return
    setItems(items.map(i => i.id === cropId ? {
      ...i,
      notes: [...(i.notes || []), { 
        id: Date.now(), 
        text: noteText.trim(), 
        date: new Date().toISOString(),
        author: 'Current User'
      }]
    } : i))
  }

  function updateCrop(id, updates){
    setItems(items.map(i => i.id === id ? { ...i, ...updates } : i))
  }

  function addTreatment(cropId, treatment){
    setItems(items.map(i => i.id === cropId ? {
      ...i,
      treatments: [...(i.treatments || []), { 
        id: Date.now(), 
        ...treatment,
        date: new Date().toISOString().slice(0,10)
      }]
    } : i))
  }

  function addYield(cropId, yieldData){
    setItems(items.map(i => i.id === cropId ? {
      ...i,
      yieldRecords: [...(i.yieldRecords || []), { 
        id: Date.now(), 
        ...yieldData,
        date: new Date().toISOString().slice(0,10)
      }]
    } : i))
  }

  function addSoilTest(cropId, testData){
    setItems(items.map(i => i.id === cropId ? {
      ...i,
      soilTests: [...(i.soilTests || []), { 
        id: Date.now(), 
        ...testData,
        date: new Date().toISOString().slice(0,10),
        labName: 'Farm Lab',
        testCost: 35
      }]
    } : i))
  }

  function addIrrigation(cropId, irrigationData){
    setItems(items.map(i => i.id === cropId ? {
      ...i,
      irrigationRecords: [...(i.irrigationRecords || []), { 
        id: Date.now(), 
        ...irrigationData,
        date: new Date().toISOString().slice(0,10)
      }]
    } : i))
  }

  function addFieldOperation(cropId, operationData){
    setItems(items.map(i => i.id === cropId ? {
      ...i,
      fieldOperations: [...(i.fieldOperations || []), { 
        id: Date.now(), 
        ...operationData,
        date: new Date().toISOString().slice(0,10)
      }]
    } : i))
  }

  function addPestManagement(cropId, pestData){
    setItems(items.map(i => i.id === cropId ? {
      ...i,
      pestManagement: [...(i.pestManagement || []), { 
        id: Date.now(), 
        ...pestData,
        date: new Date().toISOString().slice(0,10)
      }]
    } : i))
  }

  function calculateTotalCost(crop){
    const seedCost = crop.seedCost || 0
    const treatmentCost = crop.treatments?.reduce((sum, t) => sum + (t.cost || 0), 0) || 0
    const operationCost = crop.fieldOperations?.reduce((sum, op) => sum + (op.fuel || 0), 0) || 0
    const irrigationCost = crop.irrigationRecords?.reduce((sum, ir) => sum + (ir.cost || 0), 0) || 0
    return seedCost + treatmentCost + operationCost + irrigationCost
  }

  function calculateProfit(crop){
    const totalCost = calculateTotalCost(crop)
    const revenue = crop.yieldRecords?.reduce((sum, y) => sum + (y.totalValue || 0), 0) || 0
    return revenue - totalCost
  }

  function addHealthMonitoring(cropId, healthData){
    setItems(items.map(i => i.id === cropId ? {
      ...i,
      healthMonitoring: [...(i.healthMonitoring || []), { 
        id: Date.now(), 
        ...healthData,
        date: new Date().toISOString().slice(0,10)
      }]
    } : i))
  }

  function addScoutingReport(cropId, scoutData){
    setItems(items.map(i => i.id === cropId ? {
      ...i,
      scoutingReports: [...(i.scoutingReports || []), { 
        id: Date.now(), 
        ...scoutData,
        date: new Date().toISOString().slice(0,10)
      }]
    } : i))
  }

  function addDiseaseMonitoring(cropId, diseaseData){
    setItems(items.map(i => i.id === cropId ? {
      ...i,
      diseaseMonitoring: [...(i.diseaseMonitoring || []), { 
        id: Date.now(), 
        ...diseaseData,
        date: new Date().toISOString().slice(0,10)
      }]
    } : i))
  }

  function addWeatherData(cropId, weatherData){
    setItems(items.map(i => i.id === cropId ? {
      ...i,
      weatherData: [...(i.weatherData || []), { 
        id: Date.now(), 
        ...weatherData,
        date: new Date().toISOString().slice(0,10)
      }]
    } : i))
  }

  function addComplianceRecord(cropId, complianceData){
    setItems(items.map(i => i.id === cropId ? {
      ...i,
      complianceRecords: [...(i.complianceRecords || []), { 
        id: Date.now(), 
        ...complianceData,
        date: new Date().toISOString().slice(0,10)
      }]
    } : i))
  }

  function calculateHealthScore(crop){
    const recent = crop.healthMonitoring?.slice(-3) || []
    if(recent.length === 0) return 0
    return Math.round(recent.reduce((sum, h) => sum + (h.healthScore || 0), 0) / recent.length)
  }

  function assessRiskLevel(crop){
    const health = calculateHealthScore(crop)
    const diseases = crop.diseaseMonitoring?.filter(d => d.severity > 2).length || 0
    const pests = crop.pestManagement?.filter(p => p.severity > 3).length || 0
    
    if(health > 85 && diseases === 0 && pests === 0) return 'Low'
    if(health > 70 && diseases <= 1 && pests <= 1) return 'Medium'
    return 'High'
  }

  function addSoilTest(cropId, testData){
    setItems(items.map(i => i.id === cropId ? {
      ...i,
      soilTests: [...(i.soilTests || []), { 
        id: Date.now(), 
        ...testData,
        date: new Date().toISOString().slice(0,10)
      }]
    } : i))
  }

  function addIrrigation(cropId, irrigationData){
    setItems(items.map(i => i.id === cropId ? {
      ...i,
      irrigation: [...(i.irrigation || []), { 
        id: Date.now(), 
        ...irrigationData,
        date: new Date().toISOString().slice(0,10)
      }]
    } : i))
  }

  function addFieldOperation(cropId, operationData){
    setItems(items.map(i => i.id === cropId ? {
      ...i,
      fieldOperations: [...(i.fieldOperations || []), { 
        id: Date.now(), 
        ...operationData,
        date: new Date().toISOString().slice(0,10)
      }]
    } : i))
  }

  function addPestManagement(cropId, pestData){
    setItems(items.map(i => i.id === cropId ? {
      ...i,
      pestManagement: [...(i.pestManagement || []), { 
        id: Date.now(), 
        ...pestData,
        date: new Date().toISOString().slice(0,10)
      }]
    } : i))
  }

  function calculateHealthScore(crop){
    const recent = crop.healthMonitoring?.slice(-3) || []
    if(recent.length === 0) return 0
    return Math.round(recent.reduce((sum, h) => sum + (h.healthScore || 0), 0) / recent.length)
  }

  function assessRiskLevel(crop){
    const health = calculateHealthScore(crop)
    const diseases = crop.diseaseMonitoring?.filter(d => d.severity > 2).length || 0
    const pests = crop.pestManagement?.filter(p => p.severity > 3).length || 0
    
    if(health > 85 && diseases === 0 && pests === 0) return 'Low'
    if(health > 70 && diseases <= 1 && pests <= 1) return 'Medium'
    return 'High'
  }

  // Filter and sort crops
  const filteredItems = items.filter(crop => {
    if(filterStatus !== 'all' && crop.status !== filterStatus) return false
    if(activeTab === 'active' && ['Harvested', 'Failed'].includes(crop.status)) return false
    if(activeTab === 'completed' && !['Harvested', 'Failed'].includes(crop.status)) return false
    return true
  }).sort((a, b) => {
    if(sortBy === 'planted') return new Date(b.planted || '1900-01-01') - new Date(a.planted || '1900-01-01')
    if(sortBy === 'area') return b.area - a.area
    if(sortBy === 'name') return a.name.localeCompare(b.name)
    return 0
  })

  const stats = {
    total: items.length,
    totalArea: items.reduce((sum, crop) => sum + crop.area, 0),
    active: items.filter(c => !['Harvested', 'Failed'].includes(c.status)).length,
    harvested: items.filter(c => c.status === 'Harvested').length
  }

  return (
    <section>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ margin: 0 }}>Crop Management</h2>
          <button onClick={() => setShowAddForm(!showAddForm)} style={{ background: 'var(--green)', color: '#fff', padding: '10px 16px', borderRadius: '8px', border: 'none' }}>Add New Crop</button>
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
      </div>

      {/* Add Crop Form */}
      {showAddForm && (
        <div className="card" style={{ marginBottom: '20px', padding: '20px' }}>
          <h3>Add New Crop</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Crop Name</label>
              <input placeholder="e.g., Premium Alfalfa" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Variety/Cultivar</label>
              <input placeholder="e.g., Vernal, Pioneer 1234" value={formData.variety} onChange={e => setFormData({...formData, variety: e.target.value})} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Field Location</label>
              <input placeholder="e.g., North Field A" value={formData.field} onChange={e => setFormData({...formData, field: e.target.value})} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Area (acres)</label>
              <input type="number" step="0.1" placeholder="0.0" value={formData.area} onChange={e => setFormData({...formData, area: e.target.value})} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Planting Date</label>
              <input type="date" value={formData.planted} onChange={e => setFormData({...formData, planted: e.target.value})} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Expected Harvest</label>
              <input type="date" value={formData.expectedHarvest} onChange={e => setFormData({...formData, expectedHarvest: e.target.value})} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Seeding Rate</label>
              <input type="number" placeholder="lbs/acre or seeds/acre" value={formData.seedingRate} onChange={e => setFormData({...formData, seedingRate: e.target.value})} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Row Spacing (inches)</label>
              <input type="number" step="0.1" placeholder="7.5" value={formData.rowSpacing} onChange={e => setFormData({...formData, rowSpacing: e.target.value})} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Planting Depth (inches)</label>
              <input type="number" step="0.1" placeholder="1.5" value={formData.plantingDepth} onChange={e => setFormData({...formData, plantingDepth: e.target.value})} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Soil Type</label>
              <select value={formData.soilType} onChange={e => setFormData({...formData, soilType: e.target.value})}>
                {SOIL_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Irrigation</label>
              <select value={formData.irrigationType} onChange={e => setFormData({...formData, irrigationType: e.target.value})}>
                {IRRIGATION_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Status</label>
              <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                {CROP_STATUS.map(status => <option key={status} value={status}>{status}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Certification Level</label>
              <select value={formData.certificationLevel} onChange={e => setFormData({...formData, certificationLevel: e.target.value})}>
                {CERTIFICATION_LEVELS.map(cert => <option key={cert} value={cert}>{cert}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Market Destination</label>
              <input placeholder="e.g., Local Dairy Farms, Grain Elevator" value={formData.marketDestination} onChange={e => setFormData({...formData, marketDestination: e.target.value})} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Contract Price ($/unit)</label>
              <input type="number" step="0.01" placeholder="0.00" value={formData.contractPrice} onChange={e => setFormData({...formData, contractPrice: e.target.value})} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" checked={formData.insuranceCoverage} onChange={e => setFormData({...formData, insuranceCoverage: e.target.checked})} />
                <span style={{ fontWeight: '500' }}>Crop Insurance Coverage</span>
              </label>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>GPS Latitude</label>
              <input type="number" step="any" placeholder="40.7128" value={formData.gpsLat} onChange={e => setFormData({...formData, gpsLat: e.target.value})} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>GPS Longitude</label>
              <input type="number" step="any" placeholder="-74.0060" value={formData.gpsLng} onChange={e => setFormData({...formData, gpsLng: e.target.value})} />
            </div>
          </div>
          <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
            <button onClick={add} style={{ background: 'var(--green)', color: '#fff', padding: '10px 16px', border: 'none', borderRadius: '6px' }}>Add Crop</button>
            <button onClick={() => setShowAddForm(false)} style={{ background: '#6b7280', color: '#fff', padding: '10px 16px', border: 'none', borderRadius: '6px' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card" style={{ marginBottom: '20px', padding: '16px' }}>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['all', 'active', 'completed'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`tab-btn ${activeTab === tab ? 'active' : ''}`}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="all">All Status</option>
            {CROP_STATUS.map(status => <option key={status} value={status}>{status}</option>)}
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="planted">Sort by Planted Date</option>
            <option value="area">Sort by Area</option>
            <option value="name">Sort by Name</option>
          </select>
        </div>
      </div>

      {/* Crops Grid */}
      <div style={{ display: 'grid', gap: '12px' }}>
        {filteredItems.map(crop => (
          <div key={crop.id} className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <h3 style={{ margin: 0 }}>{crop.name}</h3>
                  <span className={`badge ${crop.status === 'Harvested' ? 'green' : crop.status === 'Failed' ? 'flag' : ''}`}>{crop.status}</span>
                  <span className="badge">{crop.irrigationType}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '2px' }}>Variety</div>
                    <div style={{ fontWeight: '500' }}>{crop.variety || 'Not specified'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '2px' }}>Field</div>
                    <div style={{ fontWeight: '500' }}>{crop.field || 'Not specified'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '2px' }}>Area</div>
                    <div style={{ fontWeight: '500' }}>{crop.area} acres</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '2px' }}>Soil Type</div>
                    <div style={{ fontWeight: '500' }}>{crop.soilType}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '20px', fontSize: '14px', color: 'var(--muted)' }}>
                  <span>📅 Planted: {crop.planted || 'Not set'}</span>
                  <span>🌾 Expected Harvest: {crop.expectedHarvest || 'Not set'}</span>
                  <span>💧 {crop.irrigationType}</span>
                </div>
              </div>
              <div className="controls">
                <button onClick={() => setModalOpenId(crop.id)}>View Details</button>
                <button onClick={() => remove(crop.id)}>Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Crop Detail Modal */}
      {modalOpenId && (() => {
        const crop = items.find(c => c.id === modalOpenId)
        if(!crop) return null
        return (
          <div className="drawer-overlay" onClick={() => setModalOpenId(null)}>
            <div className="drawer" onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3>{crop.name} ({crop.id})</h3>
                <div>
                  <button onClick={() => {
                    const newStatus = prompt('Update status:', crop.status)
                    if(newStatus) updateCrop(crop.id, { status: newStatus })
                  }}>Update Status</button>
                  <button onClick={() => setModalOpenId(null)} style={{ marginLeft: '8px' }}>Close</button>
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px' }}>
                <div>
                  <div style={{ marginBottom: '24px' }}>
                    <h4>Quick Actions</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '16px' }}>
                      <button onClick={() => {
                        const type = prompt('Treatment type:')
                        const product = prompt('Product name:')
                        const amount = prompt('Amount/Rate:')
                        const cost = prompt('Cost:')
                        if(type && product) addTreatment(crop.id, { type, product, amount, cost: Number(cost) || 0, applicator: 'Current User', weather: '', notes: '' })
                      }} style={{ padding: '8px 12px', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '14px' }}>
                        Add Treatment
                      </button>
                      <button onClick={() => {
                        const amount = prompt('Yield amount:')
                        const unit = prompt('Unit (tons/acre, bushels/acre):')
                        const quality = prompt('Quality grade:')
                        if(amount && unit) addYield(crop.id, { amount: Number(amount), unit, quality, moisture: 0, testWeight: 0, protein: 0, price: 0, totalValue: 0 })
                      }} style={{ padding: '8px 12px', background: 'var(--green)', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '14px' }}>
                        Record Yield
                      </button>
                      <button onClick={() => {
                        const ph = prompt('Soil pH:')
                        const nitrogen = prompt('Nitrogen (ppm):')
                        const phosphorus = prompt('Phosphorus (ppm):')
                        const potassium = prompt('Potassium (ppm):')
                        if(ph) addSoilTest(crop.id, { ph: Number(ph), nitrogen: Number(nitrogen) || 0, phosphorus: Number(phosphorus) || 0, potassium: Number(potassium) || 0, organicMatter: 0, recommendations: '' })
                      }} style={{ padding: '8px 12px', background: '#8b5cf6', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '14px' }}>
                        Soil Test
                      </button>
                      <button onClick={() => {
                        const duration = prompt('Irrigation duration (hours):')
                        const amount = prompt('Water amount (inches):')
                        const type = prompt('Irrigation type:')
                        if(duration && amount) addIrrigation(crop.id, { duration: Number(duration), amount: Number(amount), type, pressure: 0, efficiency: 0, cost: 0 })
                      }} style={{ padding: '8px 12px', background: '#06b6d4', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '14px' }}>
                        Log Irrigation
                      </button>
                      <button onClick={() => {
                        const operation = prompt('Field operation:')
                        const equipment = prompt('Equipment used:')
                        const hours = prompt('Hours worked:')
                        if(operation && equipment) addFieldOperation(crop.id, { operation, equipment, hours: Number(hours) || 0, depth: 0, fuel: 0, operator: 'Current User' })
                      }} style={{ padding: '8px 12px', background: '#84cc16', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '14px' }}>
                        Field Operation
                      </button>
                      <button onClick={() => {
                        const pestType = prompt('Pest/Disease type:')
                        const treatment = prompt('Treatment applied:')
                        const severity = prompt('Severity (1-10):')
                        if(pestType && treatment) addPestManagement(crop.id, { pestType, treatment, severity: Number(severity) || 0, area: crop.area, effectiveness: '', notes: '' })
                      }} style={{ padding: '8px 12px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '14px' }}>
                        Pest Management
                      </button>
                      <button onClick={() => {
                        const type = prompt('Monitoring type (Visual, Drone, Tissue Test):')
                        const healthScore = prompt('Health score (1-100):')
                        const notes = prompt('Observations:')
                        if(type && healthScore) addHealthMonitoring(crop.id, { type, healthScore: Number(healthScore), notes, plantVigor: 'Good', diseasePresent: false, pestDamage: false })
                      }} style={{ padding: '8px 12px', background: '#059669', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '14px' }}>
                        Health Check
                      </button>
                      <button onClick={() => {
                        const scoutName = prompt('Scout name:')
                        const quadrant = prompt('Field quadrant:')
                        const weedPressure = prompt('Weed pressure (Low/Medium/High):')
                        const recommendations = prompt('Recommendations:')
                        if(scoutName && quadrant) addScoutingReport(crop.id, { scoutName, quadrant, weedPressure, recommendations, insectCount: 0, diseaseSymptoms: 'None' })
                      }} style={{ padding: '8px 12px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '14px' }}>
                        Scout Report
                      </button>
                      <button onClick={() => {
                        const disease = prompt('Disease name:')
                        const severity = prompt('Severity (1-10):')
                        const coverage = prompt('Field coverage %:')
                        const treatment = prompt('Treatment applied:')
                        if(disease && severity) addDiseaseMonitoring(crop.id, { disease, severity: Number(severity), coverage: Number(coverage) || 0, treatment, effectiveness: '', cost: 0 })
                      }} style={{ padding: '8px 12px', background: '#ea580c', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '14px' }}>
                        Disease Log
                      </button>
                      <button onClick={() => {
                        const scoutName = prompt('Scout name:')
                        const quadrant = prompt('Field quadrant:')
                        const weedPressure = prompt('Weed pressure (Low/Medium/High):')
                        const recommendations = prompt('Recommendations:')
                        if(scoutName && quadrant) addScoutingReport(crop.id, { scoutName, quadrant, weedPressure, recommendations, insectCount: 0, diseaseSymptoms: 'None' })
                      }} style={{ padding: '8px 12px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '14px' }}>
                        Scout Report
                      </button>
                      <button onClick={() => {
                        const disease = prompt('Disease name:')
                        const severity = prompt('Severity (1-10):')
                        const coverage = prompt('Field coverage %:')
                        const treatment = prompt('Treatment applied:')
                        if(disease && severity) addDiseaseMonitoring(crop.id, { disease, severity: Number(severity), coverage: Number(coverage) || 0, treatment, effectiveness: '', cost: 0 })
                      }} style={{ padding: '8px 12px', background: '#ea580c', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '14px' }}>
                        Disease Log
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <h4>Crop Notes</h4>
                    <div style={{ marginBottom: '12px' }}>
                      <input 
                        placeholder="Add a note about this crop..." 
                        onKeyPress={e => {
                          if(e.key === 'Enter' && e.target.value.trim()) {
                            addNote(crop.id, e.target.value)
                            e.target.value = ''
                          }
                        }}
                        style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                      />
                    </div>
                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                      {(crop.notes || []).slice().reverse().map(note => (
                        <div key={note.id} style={{ padding: '12px', background: '#f9fafb', borderRadius: '8px', marginBottom: '8px' }}>
                          <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '4px' }}>
                            {note.author} • {new Date(note.date).toLocaleString()}
                          </div>
                          <div>{note.text}</div>
                        </div>
                      ))}
                      {(!crop.notes || crop.notes.length === 0) && (
                        <div style={{ color: 'var(--muted)', fontStyle: 'italic' }}>No notes yet</div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="card" style={{ padding: '16px', marginBottom: '16px' }}>
                    <h4 style={{ marginBottom: '16px', color: 'var(--green)' }}>Health Dashboard</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' }}>
                      <div style={{ textAlign: 'center', padding: '12px', background: calculateHealthScore(crop) > 80 ? '#dcfce7' : calculateHealthScore(crop) > 60 ? '#fef3cd' : '#fee2e2', borderRadius: '8px' }}>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: calculateHealthScore(crop) > 80 ? '#166534' : calculateHealthScore(crop) > 60 ? '#92400e' : '#dc2626' }}>{calculateHealthScore(crop)}</div>
                        <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Health Score</div>
                      </div>
                      <div style={{ textAlign: 'center', padding: '12px', background: (crop.riskAssessment?.weatherRisk === 'Low' ? '#dcfce7' : crop.riskAssessment?.weatherRisk === 'Medium' ? '#fef3cd' : '#fee2e2'), borderRadius: '8px' }}>
                        <div style={{ fontSize: '14px', fontWeight: 'bold', color: (crop.riskAssessment?.weatherRisk === 'Low' ? '#166534' : crop.riskAssessment?.weatherRisk === 'Medium' ? '#92400e' : '#dc2626') }}>{crop.riskAssessment?.weatherRisk || 'Unknown'}</div>
                        <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Stress Level</div>
                      </div>
                      <div style={{ textAlign: 'center', padding: '12px', background: (crop.riskAssessment?.diseaseRisk === 'Low' ? '#dcfce7' : crop.riskAssessment?.diseaseRisk === 'Medium' ? '#fef3cd' : '#fee2e2'), borderRadius: '8px' }}>
                        <div style={{ fontSize: '14px', fontWeight: 'bold', color: (crop.riskAssessment?.diseaseRisk === 'Low' ? '#166534' : crop.riskAssessment?.diseaseRisk === 'Medium' ? '#92400e' : '#dc2626') }}>{crop.riskAssessment?.diseaseRisk || 'Unknown'}</div>
                        <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Disease Risk</div>
                      </div>
                      <div style={{ textAlign: 'center', padding: '12px', background: assessRiskLevel(crop) === 'Low' ? '#dcfce7' : assessRiskLevel(crop) === 'Medium' ? '#fef3cd' : '#fee2e2', borderRadius: '8px' }}>
                        <div style={{ fontSize: '14px', fontWeight: 'bold', color: assessRiskLevel(crop) === 'Low' ? '#166534' : assessRiskLevel(crop) === 'Medium' ? '#92400e' : '#dc2626' }}>{assessRiskLevel(crop)}</div>
                        <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Overall Risk</div>
                      </div>
                    </div>
                  </div>

                  <div className="card" style={{ padding: '16px', marginBottom: '16px' }}>
                    <h4 style={{ marginBottom: '16px', color: 'var(--green)' }}>Crop Details</h4>
                    <div style={{ display: 'grid', gap: '8px', fontSize: '14px' }}>
                      <div><strong>Field:</strong> {crop.field}</div>
                      <div><strong>Area:</strong> {crop.area} acres</div>
                      <div><strong>Plant Date:</strong> {new Date(crop.plantDate).toLocaleDateString()}</div>
                      <div><strong>Expected Harvest:</strong> {new Date(crop.expectedHarvest).toLocaleDateString()}</div>
                      <div><strong>Variety:</strong> {crop.variety}</div>
                      <div><strong>Seeding Rate:</strong> {crop.seedingRate}</div>
                      <div><strong>Row Spacing:</strong> {crop.rowSpacing}"</div>
                      <div><strong>Planting Depth:</strong> {crop.plantingDepth}"</div>
                      <div><strong>Soil Type:</strong> {crop.soilType}</div>
                      <div><strong>Irrigation Method:</strong> {crop.irrigationMethod}</div>
                      <div><strong>Status:</strong> <span style={{ color: getStatusColor(crop.status) }}>{crop.status}</span></div>
                      <div><strong>Contract Price:</strong> ${crop.contractPrice}/unit</div>
                      <div><strong>Insurance Coverage:</strong> ${crop.insuranceCoverage}</div>
                      <div><strong>Certification:</strong> {crop.certificationLevel}</div>
                      <div><strong>Market Destination:</strong> {crop.marketDestination}</div>
                      {crop.gpsCoordinates && <div><strong>GPS:</strong> {crop.gpsCoordinates}</div>}
                      <div style={{ marginTop: '12px' }}><strong>Notes:</strong> {crop.notes}</div>
                    </div>
                  </div>

                  <div className="card" style={{ padding: '16px', marginBottom: '16px' }}>
                    <h4 style={{ marginBottom: '16px', color: 'var(--green)' }}>Financial Summary</h4>
                    <div style={{ display: 'grid', gap: '8px', fontSize: '14px' }}>
                      <div><strong>Seed Cost:</strong> ${crop.seedCost}</div>
                      <div><strong>Fertilizer Cost:</strong> ${(crop.treatments?.filter(t => t.type?.toLowerCase().includes('fertilizer')).reduce((sum, t) => sum + (t.cost || 0), 0) || 0).toFixed(2)}</div>
                      <div><strong>Chemical Cost:</strong> ${(crop.treatments?.filter(t => !t.type?.toLowerCase().includes('fertilizer')).reduce((sum, t) => sum + (t.cost || 0), 0) || 0).toFixed(2)}</div>
                      <div><strong>Field Operations:</strong> ${(crop.fieldOperations?.reduce((sum, op) => sum + (op.fuel || 0), 0) || 0).toFixed(2)}</div>
                      <div><strong>Irrigation Cost:</strong> ${(crop.irrigationRecords?.reduce((sum, ir) => sum + (ir.cost || 0), 0) || 0).toFixed(2)}</div>
                      <div style={{ borderTop: '1px solid #e5e5e5', paddingTop: '8px', marginTop: '8px' }}>
                        <strong>Total Input Cost:</strong> ${calculateTotalCost(crop).toFixed(2)}
                      </div>
                      <div><strong>Revenue:</strong> ${(crop.yieldRecords?.reduce((sum, y) => sum + (y.totalValue || 0), 0) || 0).toFixed(2)}</div>
                      <div style={{ borderTop: '1px solid #e5e5e5', paddingTop: '8px', marginTop: '8px', fontWeight: 'bold' }}>
                        <strong>Net Profit:</strong> ${calculateProfit(crop).toFixed(2)}
                      </div>
                      <div><strong>Profit per Acre:</strong> ${(calculateProfit(crop) / crop.area).toFixed(2)}</div>
                    </div>
                  </div>

                  <div className="card" style={{ padding: '16px', marginBottom: '16px' }}>
                    <h4>Soil Tests</h4>
                    <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                      {(crop.soilTests || []).slice(-3).map(test => (
                        <div key={test.id} style={{ padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
                          <div style={{ fontWeight: '500' }}>pH: {test.ph} | N: {test.nitrogen}ppm | P: {test.phosphorus}ppm | K: {test.potassium}ppm</div>
                          <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{test.date} • {test.labName}</div>
                          {test.recommendations && <div style={{ fontSize: '12px', color: 'var(--primary)' }}>{test.recommendations}</div>}
                        </div>
                      ))}
                      {(!crop.soilTests || crop.soilTests.length === 0) && (
                        <div style={{ color: 'var(--muted)', fontSize: '14px' }}>No soil tests recorded</div>
                      )}
                    </div>
                  </div>

                  <div className="card" style={{ padding: '16px', marginBottom: '16px' }}>
                    <h4>Recent Treatments</h4>
                    <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                      {(crop.treatments || []).slice(-3).map(treatment => (
                        <div key={treatment.id} style={{ padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
                          <div style={{ fontWeight: '500' }}>{treatment.type} - {treatment.product}</div>
                          <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{treatment.date} • {treatment.amount} • ${treatment.cost}</div>
                          <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Applied by: {treatment.applicator}</div>
                        </div>
                      ))}
                      {(!crop.treatments || crop.treatments.length === 0) && (
                        <div style={{ color: 'var(--muted)', fontSize: '14px' }}>No treatments recorded</div>
                      )}
                    </div>
                  </div>

                  <div className="card" style={{ padding: '16px', marginBottom: '16px' }}>
                    <h4>Field Operations</h4>
                    <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                      {(crop.fieldOperations || []).slice(-3).map(operation => (
                        <div key={operation.id} style={{ padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
                          <div style={{ fontWeight: '500' }}>{operation.operation} - {operation.equipment}</div>
                          <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{operation.date} • {operation.hours}h • {operation.operator}</div>
                        </div>
                      ))}
                      {(!crop.fieldOperations || crop.fieldOperations.length === 0) && (
                        <div style={{ color: 'var(--muted)', fontSize: '14px' }}>No field operations recorded</div>
                      )}
                    </div>
                  </div>

                  <div className="card" style={{ padding: '16px', marginBottom: '16px' }}>
                    <h4>Irrigation Records</h4>
                    <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                      {(crop.irrigationRecords || []).slice(-3).map(irrigation => (
                        <div key={irrigation.id} style={{ padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
                          <div style={{ fontWeight: '500' }}>{irrigation.amount}" water • {irrigation.duration}h</div>
                          <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{irrigation.date} • {irrigation.type}</div>
                        </div>
                      ))}
                      {(!crop.irrigationRecords || crop.irrigationRecords.length === 0) && (
                        <div style={{ color: 'var(--muted)', fontSize: '14px' }}>No irrigation records</div>
                      )}
                    </div>
                  </div>

                  <div className="card" style={{ padding: '16px', marginBottom: '16px' }}>
                    <h4>Health Monitoring</h4>
                    <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                      {(crop.healthMonitoring || []).slice(-3).map(health => (
                        <div key={health.id} style={{ padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
                          <div style={{ fontWeight: '500' }}>{health.type} - Score: {health.healthScore}</div>
                          <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{health.date} • Height: {health.plantHeight}" • Stand: {health.standCount}</div>
                          <div style={{ fontSize: '12px', color: health.diseasePresent ? '#dc2626' : '#059669' }}>Disease: {health.diseasePresent ? 'Present' : 'None'} • Pest Damage: {health.pestDamage ? 'Yes' : 'No'}</div>
                        </div>
                      ))}
                      {(!crop.healthMonitoring || crop.healthMonitoring.length === 0) && (
                        <div style={{ color: 'var(--muted)', fontSize: '14px' }}>No health monitoring records</div>
                      )}
                    </div>
                  </div>

                  <div className="card" style={{ padding: '16px', marginBottom: '16px' }}>
                    <h4>Scouting Reports</h4>
                    <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                      {(crop.scoutingReports || []).slice(-3).map(scout => (
                        <div key={scout.id} style={{ padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
                          <div style={{ fontWeight: '500' }}>{scout.scoutName} - {scout.quadrant}</div>
                          <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{scout.date} • Weeds: {scout.weedPressure} • Insects: {scout.insectCount}</div>
                          <div style={{ fontSize: '12px', color: 'var(--primary)' }}>{scout.recommendations}</div>
                        </div>
                      ))}
                      {(!crop.scoutingReports || crop.scoutingReports.length === 0) && (
                        <div style={{ color: 'var(--muted)', fontSize: '14px' }}>No scouting reports</div>
                      )}
                    </div>
                  </div>

                  <div className="card" style={{ padding: '16px', marginBottom: '16px' }}>
                    <h4>Disease Monitoring</h4>
                    <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                      {(crop.diseaseMonitoring || []).slice(-3).map(disease => (
                        <div key={disease.id} style={{ padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
                          <div style={{ fontWeight: '500' }}>{disease.disease} - Severity: {disease.severity}/10</div>
                          <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{disease.date} • Coverage: {disease.coverage}% • ${disease.cost}</div>
                          <div style={{ fontSize: '12px', color: 'var(--primary)' }}>Treatment: {disease.treatment} • Effectiveness: {disease.effectiveness}</div>
                        </div>
                      ))}
                      {(!crop.diseaseMonitoring || crop.diseaseMonitoring.length === 0) && (
                        <div style={{ color: 'var(--muted)', fontSize: '14px' }}>No disease monitoring records</div>
                      )}
                    </div>
                  </div>

                  <div className="card" style={{ padding: '16px', marginBottom: '16px' }}>
                    <h4>Weather Impact</h4>
                    <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                      {(crop.weatherData || []).slice(-3).map(weather => (
                        <div key={weather.id} style={{ padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
                          <div style={{ fontWeight: '500' }}>{weather.temperature}°F • {weather.humidity}% RH • {weather.rainfall}"</div>
                          <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{weather.date} • GDD: {weather.growingDegreeDays} • Wind: {weather.windSpeed}mph</div>
                          <div style={{ fontSize: '12px', color: weather.stressFactors !== 'None' ? '#dc2626' : '#059669' }}>Stress: {weather.stressFactors} • Irrigation: {weather.irrigationNeeded ? 'Needed' : 'Not Needed'}</div>
                        </div>
                      ))}
                      {(!crop.weatherData || crop.weatherData.length === 0) && (
                        <div style={{ color: 'var(--muted)', fontSize: '14px' }}>No weather data</div>
                      )}
                    </div>
                  </div>

                  <div className="card" style={{ padding: '16px', marginBottom: '16px' }}>
                    <h4>Sustainability Metrics</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', fontSize: '14px' }}>
                      {crop.sustainabilityMetrics && Object.entries(crop.sustainabilityMetrics).map(([key, value]) => (
                        <div key={key}><strong>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</strong> {typeof value === 'number' ? value.toFixed(1) : value}</div>
                      ))}
                      {!crop.sustainabilityMetrics && (
                        <div style={{ color: 'var(--muted)', fontSize: '14px' }}>No sustainability data available</div>
                      )}
                    </div>
                  </div>

                  <div className="card" style={{ padding: '16px', marginBottom: '16px' }}>
                    <h4>Compliance Records</h4>
                    <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                      {(crop.complianceRecords || []).slice(-3).map(compliance => (
                        <div key={compliance.id} style={{ padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
                          <div style={{ fontWeight: '500' }}>{compliance.type} - {compliance.product}</div>
                          <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{compliance.date} • Rate: {compliance.rate}</div>
                          <div style={{ fontSize: '12px', color: 'var(--primary)' }}>Certification: {compliance.certification || 'Standard'}</div>
                        </div>
                      ))}
                      {(!crop.complianceRecords || crop.complianceRecords.length === 0) && (
                        <div style={{ color: 'var(--muted)', fontSize: '14px' }}>No compliance records</div>
                      )}
                    </div>
                  </div>

                  <div className="card" style={{ padding: '16px', marginBottom: '16px' }}>
                    <h4>Health Monitoring</h4>
                    <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                      {(crop.healthMonitoring || []).slice(-3).map(health => (
                        <div key={health.id} style={{ padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
                          <div style={{ fontWeight: '500' }}>{health.type} - Score: {health.healthScore}</div>
                          <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{health.date} • Height: {health.plantHeight}" • Stand: {health.standCount}</div>
                          <div style={{ fontSize: '12px', color: health.diseasePresent ? '#dc2626' : '#059669' }}>Disease: {health.diseasePresent ? 'Present' : 'None'} • Pest Damage: {health.pestDamage ? 'Yes' : 'No'}</div>
                        </div>
                      ))}
                      {(!crop.healthMonitoring || crop.healthMonitoring.length === 0) && (
                        <div style={{ color: 'var(--muted)', fontSize: '14px' }}>No health monitoring records</div>
                      )}
                    </div>
                  </div>

                  <div className="card" style={{ padding: '16px', marginBottom: '16px' }}>
                    <h4>Scouting Reports</h4>
                    <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                      {(crop.scoutingReports || []).slice(-3).map(scout => (
                        <div key={scout.id} style={{ padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
                          <div style={{ fontWeight: '500' }}>{scout.scoutName} - {scout.quadrant}</div>
                          <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{scout.date} • Weeds: {scout.weedPressure} • Insects: {scout.insectCount}</div>
                          <div style={{ fontSize: '12px', color: 'var(--primary)' }}>{scout.recommendations}</div>
                        </div>
                      ))}
                      {(!crop.scoutingReports || crop.scoutingReports.length === 0) && (
                        <div style={{ color: 'var(--muted)', fontSize: '14px' }}>No scouting reports</div>
                      )}
                    </div>
                  </div>

                  <div className="card" style={{ padding: '16px', marginBottom: '16px' }}>
                    <h4>Disease Monitoring</h4>
                    <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                      {(crop.diseaseMonitoring || []).slice(-3).map(disease => (
                        <div key={disease.id} style={{ padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
                          <div style={{ fontWeight: '500' }}>{disease.disease} - Severity: {disease.severity}/10</div>
                          <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{disease.date} • Coverage: {disease.coverage}% • ${disease.cost}</div>
                          <div style={{ fontSize: '12px', color: 'var(--primary)' }}>Treatment: {disease.treatment} • Effectiveness: {disease.effectiveness}</div>
                        </div>
                      ))}
                      {(!crop.diseaseMonitoring || crop.diseaseMonitoring.length === 0) && (
                        <div style={{ color: 'var(--muted)', fontSize: '14px' }}>No disease monitoring records</div>
                      )}
                    </div>
                  </div>

                  <div className="card" style={{ padding: '16px', marginBottom: '16px' }}>
                    <h4>Weather Impact</h4>
                    <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                      {(crop.weatherData || []).slice(-3).map(weather => (
                        <div key={weather.id} style={{ padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
                          <div style={{ fontWeight: '500' }}>{weather.temperature}°F • {weather.humidity}% RH • {weather.rainfall}"</div>
                          <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{weather.date} • GDD: {weather.growingDegreeDays} • Wind: {weather.windSpeed}mph</div>
                          <div style={{ fontSize: '12px', color: weather.stressFactors !== 'None' ? '#dc2626' : '#059669' }}>Stress: {weather.stressFactors} • Irrigation: {weather.irrigationNeeded ? 'Needed' : 'Not Needed'}</div>
                        </div>
                      ))}
                      {(!crop.weatherData || crop.weatherData.length === 0) && (
                        <div style={{ color: 'var(--muted)', fontSize: '14px' }}>No weather data</div>
                      )}
                    </div>
                  </div>

                  <div className="card" style={{ padding: '16px', marginBottom: '16px' }}>
                    <h4>Sustainability Metrics</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', fontSize: '14px' }}>
                      {crop.sustainabilityMetrics && Object.entries(crop.sustainabilityMetrics).map(([key, value]) => (
                        <div key={key}><strong>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</strong> {typeof value === 'number' ? value.toFixed(1) : value}</div>
                      ))}
                      {!crop.sustainabilityMetrics && (
                        <div style={{ color: 'var(--muted)', fontSize: '14px' }}>No sustainability data available</div>
                      )}
                    </div>
                  </div>

                  <div className="card" style={{ padding: '16px' }}>
                    <h4>Yield Records</h4>
                    <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                      {(crop.yieldRecords || []).slice(-3).map(yieldRecord => (
                        <div key={yieldRecord.id} style={{ padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
                          <div style={{ fontWeight: '500' }}>{yieldRecord.amount} {yieldRecord.unit}</div>
                          <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{yieldRecord.date} • {yieldRecord.quality} • ${yieldRecord.totalValue}</div>
                          <div style={{ fontSize: '12px', color: 'var(--primary)' }}>Moisture: {yieldRecord.moisture}% • Protein: {yieldRecord.protein}%</div>
                        </div>
                      ))}
                      {(!crop.yieldRecords || crop.yieldRecords.length === 0) && (
                        <div style={{ color: 'var(--muted)', fontSize: '14px' }}>No yields recorded</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      })()}
    </section>
  )
}
