import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import { exportToCSV, exportToExcel, exportToJSON, importFromCSV, importFromJSON } from '../lib/exportImport'
import { useDebounce } from '../lib/useDebounce'
import RecordCV from '../components/RecordCV'
import VirtualizedList from '../components/VirtualizedList'
import { logCropActivity } from '../lib/activityLogger'
import { savePhoto, deletePhoto, getPhotosByEntity } from '../lib/photoAnalysis'
import { LineChart } from '../components/Charts'
import { getCurrentWeather } from '../lib/weatherApi'

const SAMPLE = [
  { id: 'C-001', name: 'Premium Alfalfa', variety: 'Vernal', planted: '2025-03-15', plantDate: '2025-03-15', expectedHarvest: '2025-07-15', area: 5.2, field: 'North Field A', status: 'Growing', soilType: 'Clay Loam', irrigationType: 'Sprinkler', seedCost: 450, actualHarvest: '', notes: '', healthScore: 90, stressLevel: 'Low', diseaseRisk: 'Low', pestPressure: 'Low', treatments: [], yieldRecords: [], soilTests: [], irrigationRecords: [], pestManagement: [], fieldOperations: [], healthMonitoring: [], scoutingReports: [], diseaseMonitoring: [], weatherData: [], complianceRecords: [], sustainabilityMetrics: {}, riskAssessment: {}, gpsCoordinates: { lat: 40.7128, lng: -74.0060 }, seedingRate: 25, rowSpacing: 7, plantingDepth: 0.5, cultivar: 'Vernal', certificationLevel: 'Certified Organic', marketDestination: 'Local Dairy Farms', contractPrice: 0, insuranceCoverage: true },
  { id: 'C-002', name: 'Field Corn', variety: 'Pioneer 1234', planted: '2025-04-20', plantDate: '2025-04-20', expectedHarvest: '2025-09-15', area: 12.8, field: 'South Field B', status: 'Planted', seedCost: 2800, healthScore: 85, stressLevel: 'Low', diseaseRisk: 'Medium', pestPressure: 'Low', soilType: 'Sandy Loam', irrigationType: 'Center Pivot', actualHarvest: '', notes: [], treatments: [], yieldRecords: [], soilTests: [], irrigationRecords: [], pestManagement: [], fieldOperations: [], gpsCoordinates: { lat: 40.7200, lng: -74.0100 }, seedingRate: 32000, rowSpacing: 30, plantingDepth: 2, cultivar: 'Pioneer 1234', certificationLevel: 'Conventional', marketDestination: 'Grain Elevator', contractPrice: 4.85, insuranceCoverage: true, weatherData: [] },
  { id: 'C-003', name: 'Winter Wheat', variety: 'Hard Red Winter', planted: '2024-10-15', plantDate: '2024-10-15', expectedHarvest: '2025-06-15', area: 8.5, field: 'East Field C', status: 'Mature', seedCost: 1200, healthScore: 95, stressLevel: 'None', diseaseRisk: 'Low', pestPressure: 'Low', soilType: 'Silt Loam', irrigationType: 'Dryland', actualHarvest: '2025-06-18', notes: [], treatments: [], yieldRecords: [], soilTests: [], irrigationRecords: [], pestManagement: [], fieldOperations: [], gpsCoordinates: { lat: 40.7050, lng: -74.0200 }, seedingRate: 90, rowSpacing: 7.5, plantingDepth: 1.5, cultivar: 'Hard Red Winter', certificationLevel: 'Conventional', marketDestination: 'Flour Mill', contractPrice: 6.25, insuranceCoverage: true, weatherData: [] }
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
const HEALTH_MONITORING_TYPES = ['Visual Inspection', 'Drone Survey', 'Satellite Imagery', 'Tissue Test', 'Soil Test', 'Weather Station', 'Lab Analysis']
const DISEASE_TYPES = ['Fungal', 'Bacterial', 'Viral', 'Nematode', 'Nutrient Deficiency', 'Weather Stress', 'Mechanical Damage', 'Herbicide Injury']
const PEST_CATEGORIES = ['Insects', 'Weeds', 'Diseases', 'Rodents', 'Birds', 'Nematodes', 'Mites', 'Slugs']
const STRESS_LEVELS = ['None', 'Low', 'Medium', 'High', 'Severe']
const RISK_LEVELS = ['Very Low', 'Low', 'Medium', 'High', 'Very High']
const COMPLIANCE_TYPES = ['Pesticide Application', 'Fertilizer Application', 'Organic Certification', 'GAP Compliance', 'Worker Safety', 'Environmental Protection']
const SUSTAINABILITY_METRICS = ['Carbon Footprint', 'Water Usage', 'Soil Health', 'Biodiversity', 'Energy Usage', 'Nutrient Efficiency', 'Erosion Control', 'Pollinator Support']
const WORKSPACE_VIEWS = [
  { id: 'portfolio', label: 'Portfolio', icon: '🌾', description: 'Crop registry, area coverage, and stage mix.' },
  { id: 'planning', label: 'Planning', icon: '🗓️', description: 'Planting pipeline, harvest outlook, and seasonal execution.' },
  { id: 'operations', label: 'Operations', icon: '🛠️', description: 'Treatments, irrigation, field work, and crop care logs.' },
  { id: 'finance', label: 'Finance', icon: '💹', description: 'Input spend, revenue, gross margin, and value per acre.' },
  { id: 'field-intel', label: 'Field Intel', icon: '🛰️', description: 'Health, scouting, disease pressure, and operational risk.' },
  { id: 'compliance', label: 'Compliance', icon: '✅', description: 'Insurance, certification, soil testing, and audit readiness.' },
  { id: 'treatments', label: 'Treatments', icon: '🧪', description: 'Input applications, spray logs, and treatment spend.' },
  { id: 'sales', label: 'Sales', icon: '💰', description: 'Yield sales, realized value, and market delivery records.' },
  { id: 'soil', label: 'Soil', icon: '🧫', description: 'Soil test capture and fertility recommendations.' },
  { id: 'irrigation', label: 'Irrigation', icon: '💧', description: 'Water events, duration, and irrigation cost logs.' },
  { id: 'field-ops', label: 'Field Ops', icon: '🚜', description: 'Field operations, equipment use, labor, and fuel.' },
  { id: 'disease', label: 'Disease', icon: '🦠', description: 'Disease surveillance, severity tracking, and response logs.' },
  { id: 'pests', label: 'Pests', icon: '🐛', description: 'Pest events, pressure trends, and intervention history.' },
  { id: 'health', label: 'Health', icon: '🩺', description: 'Crop health checks, vigor scoring, and stress observations.' },
  { id: 'scouting', label: 'Scouting', icon: '🔎', description: 'Scout observations, weed pressure, and field recommendations.' }
]
const INITIAL_TAB_MAP = {
  portfolio: 'portfolio',
  all: 'portfolio',
  reports: 'finance',
  profitability: 'finance',
  sales: 'sales',
  treatments: 'treatments',
  soil: 'soil',
  irrigation: 'irrigation',
  health: 'health',
  scouting: 'scouting',
  disease: 'disease',
  pests: 'pests',
  routines: 'treatments',
  yields: 'sales',
  subsections: 'compliance'
}

const getTodayDate = () => new Date().toISOString().slice(0, 10)

const INITIAL_TREATMENT_FORM = { editId: '', cropId: '', date: getTodayDate(), type: TREATMENT_TYPES[0], product: '', amount: '', cost: '', applicator: 'Current User', notes: '' }
const INITIAL_SALES_FORM = { editId: '', cropId: '', date: getTodayDate(), amount: '', unit: 'kg', quality: '', price: '', totalValue: '' }
const INITIAL_SOIL_FORM = { editId: '', cropId: '', date: getTodayDate(), ph: '', nitrogen: '', phosphorus: '', potassium: '', recommendations: '' }
const INITIAL_IRRIGATION_FORM = { editId: '', cropId: '', date: getTodayDate(), type: IRRIGATION_TYPES[0], duration: '', amount: '', cost: '' }
const INITIAL_FIELD_OP_FORM = { editId: '', cropId: '', date: getTodayDate(), operation: OPERATION_TYPES[0], equipment: EQUIPMENT_TYPES[0], hours: '', fuel: '', operator: 'Current User' }
const INITIAL_PEST_FORM = { editId: '', cropId: '', date: getTodayDate(), pestType: '', treatment: '', severity: '', area: '', effectiveness: '', notes: '' }
const INITIAL_HEALTH_FORM = { editId: '', cropId: '', date: getTodayDate(), type: HEALTH_MONITORING_TYPES[0], healthScore: '', plantVigor: 'Good', notes: '', diseasePresent: false, pestDamage: false }
const INITIAL_SCOUTING_FORM = { editId: '', cropId: '', date: getTodayDate(), scoutName: '', quadrant: '', weedPressure: 'Low', insectCount: '', diseaseSymptoms: 'None', recommendations: '' }
const INITIAL_DISEASE_FORM = { editId: '', cropId: '', date: getTodayDate(), disease: '', severity: '', coverage: '', treatment: '', effectiveness: '', cost: '' }
const CROP_RECORD_ARRAY_KEYS = ['treatments', 'yieldRecords', 'soilTests', 'irrigationRecords', 'pestManagement', 'fieldOperations', 'healthMonitoring', 'scoutingReports', 'diseaseMonitoring', 'weatherData', 'complianceRecords']

// Memoized Crop Card Component for better performance
const CropCard = React.memo(({ crop, onViewDetails, onDelete }) => {
  const [weather, setWeather] = useState(null)

  useEffect(() => {
    if (crop.gpsCoordinates?.lat && crop.gpsCoordinates?.lng) {
      getCurrentWeather(`${crop.gpsCoordinates.lat},${crop.gpsCoordinates.lng}`).then(setWeather)
      return
    }

    if (crop.field) {
      getCurrentWeather(crop.field).then(setWeather)
    }
  }, [crop.gpsCoordinates, crop.field])

  const healthTrend = (crop.healthMonitoring?.length
    ? crop.healthMonitoring
    : [
        { date: crop.planted, value: crop.healthScore || 80 },
        { date: crop.expectedHarvest || crop.planted, value: crop.healthScore || 80 }
      ]
  ).map((entry) => ({ label: entry.date, value: entry.value }))

  const yieldTrend = (crop.yieldRecords?.length
    ? crop.yieldRecords
    : [
        { date: crop.planted, value: 0 },
        { date: crop.expectedHarvest || crop.planted, value: Number(crop.actualHarvest) || 0 }
      ]
  ).map((entry) => ({ label: entry.date, value: entry.value }))

  return (
    <div className="card" style={{ padding: '20px' }}>
      {crop.sustainabilityMetrics && Object.keys(crop.sustainabilityMetrics).length > 0 && (
        <div style={{ marginBottom: 8, fontSize: 13, color: '#059669' }}>
          <strong>🌱 Sustainability:</strong>
          {Object.entries(crop.sustainabilityMetrics).map(([metric, value]) => (
            <span key={metric} style={{ marginLeft: 8 }}>{metric}: {value}</span>
          ))}
        </div>
      )}

      {crop.gpsCoordinates?.lat && crop.gpsCoordinates?.lng && (
        <div style={{ marginBottom: 8 }}>
          <iframe
            title="Field Map"
            width="100%"
            height="120"
            style={{ border: 0, borderRadius: 8 }}
            loading="lazy"
            allowFullScreen
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${crop.gpsCoordinates.lng - 0.002},${crop.gpsCoordinates.lat - 0.002},${crop.gpsCoordinates.lng + 0.002},${crop.gpsCoordinates.lat + 0.002}&layer=mapnik&marker=${crop.gpsCoordinates.lat},${crop.gpsCoordinates.lng}`}
          ></iframe>
        </div>
      )}

      {weather && (
        <div style={{ marginBottom: 8, fontSize: 13, color: '#2563eb', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>🌦️ <strong>Weather:</strong> {weather.weather?.[0]?.description || 'N/A'}, {weather.main?.temp}°C</span>
        </div>
      )}

      <div style={{ marginBottom: 12 }}>
        <LineChart
          data={healthTrend}
          width={300}
          height={100}
          title="Health Trend"
          xLabel="Date"
          yLabel="Score"
          color="#059669"
        />
      </div>

      <div style={{ marginBottom: 12 }}>
        <LineChart
          data={yieldTrend}
          width={300}
          height={100}
          title="Yield Trend"
          xLabel="Date"
          yLabel="Yield"
          color="#f59e0b"
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
            <h3 style={{ margin: 0 }}>{crop.name}</h3>
            <span className={`badge ${crop.status === 'Harvested' ? 'green' : crop.status === 'Failed' ? 'flag' : ''}`}>{crop.status}</span>
            <span className="badge">{crop.irrigationType}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '16px', marginBottom: '12px' }}>
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

          <div style={{ display: 'flex', gap: '20px', fontSize: '14px', color: 'var(--muted)', flexWrap: 'wrap' }}>
            <span>📅 Planted: {crop.planted || 'Not set'}</span>
            <span>🌾 Expected Harvest: {crop.expectedHarvest || 'Not set'}</span>
            <span>💧 {crop.irrigationType}</span>
          </div>
        </div>

        <div className="controls">
          <button onClick={onViewDetails}>View Details</button>
          <button onClick={onDelete}>Delete</button>
        </div>
      </div>
    </div>
  )
})

export default function Crops({ initialTab, recordSource } = {}){
  const KEY = 'cattalytics:crops:v2' // Changed key to force reload of new data
  const [items, setItems] = useState([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [modalOpenId, setModalOpenId] = useState(null)
  const [showRecordCV, setShowRecordCV] = useState(null)
  const [workspaceView, setWorkspaceView] = useState(INITIAL_TAB_MAP[initialTab] || 'portfolio')
  const [activeTab, setActiveTab] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [sortBy, setSortBy] = useState('planted')
  const [searchTerm, setSearchTerm] = useState('')
  
  // Debounce search for better performance
  const debouncedSearch = useDebounce(searchTerm, 300)
  
  const [formData, setFormData] = useState({
    name: '', variety: '', field: '', area: '', planted: '', expectedHarvest: '',
    soilType: 'Loam', irrigationType: 'Sprinkler', status: 'Planned', certificationLevel: 'Conventional',
    seedingRate: '', rowSpacing: '', plantingDepth: '', marketDestination: '', contractPrice: '',
    insuranceCoverage: false, gpsLat: '', gpsLng: '', photos: []
  })

  const normalizeCrop = useCallback((crop) => {
    const normalizedNotes = Array.isArray(crop?.notes)
      ? crop.notes
      : (typeof crop?.notes === 'string' && crop.notes.trim()
        ? [{ id: `legacy-note-${crop.id || Date.now()}`, text: crop.notes.trim(), date: crop.planted || getTodayDate(), author: 'Legacy Record' }]
        : [])

    const normalized = {
      ...crop,
      notes: normalizedNotes,
      irrigationMethod: crop?.irrigationMethod || crop?.irrigationType || ''
    }

    CROP_RECORD_ARRAY_KEYS.forEach((key) => {
      normalized[key] = Array.isArray(crop?.[key]) ? crop[key] : []
    })

    return normalized
  }, [])

  useEffect(()=>{
    // Load from localStorage or use sample data
    const saved = localStorage.getItem(KEY)
    if(saved) {
      try {
        const parsed = JSON.parse(saved)
        setItems(Array.isArray(parsed) ? parsed.map(normalizeCrop) : SAMPLE.map(normalizeCrop))
      } catch(e) {
        setItems(SAMPLE.map(normalizeCrop))
      }
    } else {
      setItems(SAMPLE.map(normalizeCrop))
    }
  }, [normalizeCrop])

  useEffect(()=> {
    if(items.length > 0) {
      localStorage.setItem(KEY, JSON.stringify(items))
    }
  }, [items])

  useEffect(() => {
    if (initialTab) {
      setWorkspaceView(INITIAL_TAB_MAP[initialTab] || 'portfolio')
    }
  }, [initialTab])

  async function add(){
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
      notes: [],
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
    setItems([...items, normalizeCrop(newCrop)])
    logCropActivity('created', `Planted ${newCrop.name} in ${newCrop.field} (${newCrop.area} acres)`, newCrop)

    // Sync photos to gallery
    try {
      if (formData.photos && Array.isArray(formData.photos)) {
        for (const photoData of formData.photos) {
          if (photoData && photoData.startsWith('data:image')) {
            const blob = await fetch(photoData).then(r => r.blob())
            const file = new File([blob], `${newCrop.name}_${newCrop.field}.jpg`, { type: 'image/jpeg' })
            await savePhoto(file, {
              category: 'crops',
              tags: [newCrop.name.toLowerCase(), newCrop.variety.toLowerCase(), newCrop.field.toLowerCase(), newCrop.status.toLowerCase()].filter(Boolean),
              entityType: 'crop',
              entityId: id,
              entityName: `${newCrop.name} - ${newCrop.field}`
            })
          }
        }
      }
    } catch (error) {
      console.error('Error syncing crop photos to gallery:', error)
    }

    setFormData({ 
      name: '', variety: '', field: '', area: '', planted: '', expectedHarvest: '',
      soilType: 'Loam', irrigationType: 'Sprinkler', status: 'Planned', certificationLevel: 'Conventional',
      seedingRate: '', rowSpacing: '', plantingDepth: '', marketDestination: '', contractPrice: '',
      insuranceCoverage: false, gpsLat: '', gpsLng: '', photos: []
    })
    setShowAddForm(false)
  }

  function remove(id){ 
    if(!confirm('Delete crop '+id+'?')) return
    const crop = items.find(i => i.id === id)
    setItems(items.filter(i=>i.id!==id))

    // Delete associated photos from gallery
    try {
      const photos = getPhotosByEntity('crop', id)
      photos.forEach(photo => deletePhoto(photo.id))
    } catch (error) {
      console.error('Error deleting crop photos:', error)
    }

    if(crop) {
      logCropActivity('deleted', `Removed crop: ${crop.name} from ${crop.field}`, crop)
    }
  }

  function addNote(cropId, noteText){
    if(!noteText.trim()) return
    setItems(items.map(i => i.id === cropId ? {
      ...i,
      notes: [...(Array.isArray(i.notes) ? i.notes : []), { 
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
        date: treatment.date || getTodayDate()
      }]
    } : i))
  }

  function addYield(cropId, yieldData){
    setItems(items.map(i => i.id === cropId ? {
      ...i,
      yieldRecords: [...(i.yieldRecords || []), { 
        id: Date.now(), 
        ...yieldData,
        date: yieldData.date || getTodayDate()
      }]
    } : i))
  }

  function addSoilTest(cropId, testData){
    setItems(items.map(i => i.id === cropId ? {
      ...i,
      soilTests: [...(i.soilTests || []), { 
        id: Date.now(), 
        ...testData,
        date: testData.date || getTodayDate(),
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
        date: irrigationData.date || getTodayDate()
      }]
    } : i))
  }

  function addFieldOperation(cropId, operationData){
    setItems(items.map(i => i.id === cropId ? {
      ...i,
      fieldOperations: [...(i.fieldOperations || []), { 
        id: Date.now(), 
        ...operationData,
        date: operationData.date || getTodayDate()
      }]
    } : i))
  }

  function addPestManagement(cropId, pestData){
    setItems(items.map(i => i.id === cropId ? {
      ...i,
      pestManagement: [...(i.pestManagement || []), { 
        id: Date.now(), 
        ...pestData,
        date: pestData.date || getTodayDate()
      }]
    } : i))
  }

  const calculateTotalCost = useCallback((crop) => {
    const seedCost = crop.seedCost || 0
    const treatmentCost = crop.treatments?.reduce((sum, t) => sum + (t.cost || 0), 0) || 0
    const operationCost = crop.fieldOperations?.reduce((sum, op) => sum + (op.fuel || 0), 0) || 0
    const irrigationCost = crop.irrigationRecords?.reduce((sum, ir) => sum + (ir.cost || 0), 0) || 0
    return seedCost + treatmentCost + operationCost + irrigationCost
  }, [])

  const calculateProfit = useCallback((crop) => {
    const totalCost = calculateTotalCost(crop)
    const revenue = crop.yieldRecords?.reduce((sum, y) => sum + (y.totalValue || 0), 0) || 0
    return revenue - totalCost
  }, [calculateTotalCost])

  function addHealthMonitoring(cropId, healthData){
    setItems(items.map(i => i.id === cropId ? {
      ...i,
      healthMonitoring: [...(i.healthMonitoring || []), { 
        id: Date.now(), 
        ...healthData,
        date: healthData.date || getTodayDate()
      }]
    } : i))
  }

  function addScoutingReport(cropId, scoutData){
    setItems(items.map(i => i.id === cropId ? {
      ...i,
      scoutingReports: [...(i.scoutingReports || []), { 
        id: Date.now(), 
        ...scoutData,
        date: scoutData.date || getTodayDate()
      }]
    } : i))
  }

  function addDiseaseMonitoring(cropId, diseaseData){
    setItems(items.map(i => i.id === cropId ? {
      ...i,
      diseaseMonitoring: [...(i.diseaseMonitoring || []), { 
        id: Date.now(), 
        ...diseaseData,
        date: diseaseData.date || getTodayDate()
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

  function getCropComprehensiveRecords(crop) {
    const toRecord = (type, icon, entries, titleBuilder, detailBuilder) =>
      (entries || []).map((entry) => ({
        id: `${type}-${entry.id || Math.random()}`,
        recordId: entry.id || '',
        type,
        icon,
        date: entry.date || '',
        title: titleBuilder(entry),
        detail: detailBuilder(entry),
        raw: entry
      }))

    const notes = Array.isArray(crop.notes)
      ? crop.notes.map((note, idx) => ({
          id: note.id || `note-${idx}`,
          date: note.date || '',
          text: note.text || '',
          author: note.author || 'Unknown'
        }))
      : (typeof crop.notes === 'string' && crop.notes.trim()
        ? [{ id: 'note-text', date: crop.planted || '', text: crop.notes, author: 'Crop Record' }]
        : [])

    const records = [
      ...toRecord('Note', '📝', notes, (entry) => `Note by ${entry.author}`, (entry) => entry.text || 'No note text'),
      ...toRecord('Treatment', '🧪', crop.treatments, (entry) => `${entry.type || 'Treatment'} • ${entry.product || 'No product'}`, (entry) => `${entry.amount || 'No amount'} • KSH ${Number(entry.cost || 0).toLocaleString()}`),
      ...toRecord('Sales', '💰', crop.yieldRecords, (entry) => `${entry.amount || 0} ${entry.unit || 'units'}`, (entry) => `${entry.quality || 'No quality'} • KSH ${Number(entry.totalValue || 0).toLocaleString()}`),
      ...toRecord('Soil Test', '🧫', crop.soilTests, (entry) => `pH ${entry.ph || 0}`, (entry) => `N ${entry.nitrogen || 0} • P ${entry.phosphorus || 0} • K ${entry.potassium || 0}`),
      ...toRecord('Irrigation', '💧', crop.irrigationRecords, (entry) => `${entry.type || 'Irrigation'} event`, (entry) => `${entry.amount || 0}" • ${entry.duration || 0}h • KSH ${Number(entry.cost || 0).toLocaleString()}`),
      ...toRecord('Field Operation', '🚜', crop.fieldOperations, (entry) => entry.operation || 'Field operation', (entry) => `${entry.equipment || 'No equipment'} • ${entry.hours || 0}h • ${entry.operator || 'No operator'}`),
      ...toRecord('Pest', '🐛', crop.pestManagement, (entry) => entry.pestType || 'Pest activity', (entry) => `Severity ${entry.severity || 0} • ${entry.treatment || 'No treatment'}`),
      ...toRecord('Health', '🩺', crop.healthMonitoring, (entry) => entry.type || 'Health check', (entry) => `Score ${entry.healthScore || 0} • Vigor ${entry.plantVigor || 'N/A'}`),
      ...toRecord('Scouting', '🔎', crop.scoutingReports, (entry) => `${entry.scoutName || 'Scout'} • ${entry.quadrant || 'Field'}`, (entry) => entry.recommendations || 'No recommendation'),
      ...toRecord('Disease', '🦠', crop.diseaseMonitoring, (entry) => entry.disease || 'Disease report', (entry) => `Severity ${entry.severity || 0} • ${entry.treatment || 'No treatment'}`),
      ...toRecord('Weather', '🌦️', crop.weatherData, (entry) => `${entry.temperature || '-'}° • RH ${entry.humidity || '-'}%`, (entry) => `Rain ${entry.rainfall || '-'} • Stress ${entry.stressFactors || 'None'}`),
      ...toRecord('Compliance', '✅', crop.complianceRecords, (entry) => entry.type || 'Compliance log', (entry) => `${entry.product || 'No product'} • ${entry.rate || 'No rate'}`)
    ]

    return records.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())
  }

  function handleDownloadCropRecord(crop, format = 'json') {
    const comprehensiveRecords = getCropComprehensiveRecords(crop)
    const payload = {
      generatedAt: new Date().toISOString(),
      crop: {
        id: crop.id,
        name: crop.name,
        variety: crop.variety,
        field: crop.field,
        area: crop.area,
        status: crop.status,
        planted: crop.planted,
        expectedHarvest: crop.expectedHarvest,
        actualHarvest: crop.actualHarvest,
        soilType: crop.soilType,
        irrigationType: crop.irrigationType
      },
      summary: {
        totalRecords: comprehensiveRecords.length,
        treatments: crop.treatments?.length || 0,
        sales: crop.yieldRecords?.length || 0,
        soilTests: crop.soilTests?.length || 0,
        irrigationRecords: crop.irrigationRecords?.length || 0,
        fieldOperations: crop.fieldOperations?.length || 0,
        pestManagement: crop.pestManagement?.length || 0,
        healthMonitoring: crop.healthMonitoring?.length || 0,
        scoutingReports: crop.scoutingReports?.length || 0,
        diseaseMonitoring: crop.diseaseMonitoring?.length || 0,
        weatherData: crop.weatherData?.length || 0,
        complianceRecords: crop.complianceRecords?.length || 0
      },
      timeline: comprehensiveRecords,
      fullRecord: crop
    }

    if (format === 'csv') {
      const rows = comprehensiveRecords.map((entry) => ({
        cropId: crop.id,
        cropName: crop.name,
        recordType: entry.type,
        date: entry.date,
        title: entry.title,
        detail: entry.detail
      }))
      exportToCSV(rows, `${crop.id}_full_record.csv`)
      flashToast('success', `Downloaded ${crop.name} full record (CSV)`)
      return
    }

    exportToJSON(payload, `${crop.id}_full_record.json`)
    flashToast('success', `Downloaded ${crop.name} full record (JSON)`)
  }

  function handlePrintCropRecord(crop) {
    const comprehensiveRecords = getCropComprehensiveRecords(crop)
    const escapeHtml = (value) => String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')

    const reportWindow = window.open('', '_blank', 'width=1024,height=768')
    if (!reportWindow) {
      flashToast('error', 'Popup blocked. Allow popups to print report.')
      return
    }

    const timelineRows = comprehensiveRecords.length
      ? comprehensiveRecords.map((entry, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>${escapeHtml(entry.date || 'No date')}</td>
            <td>${escapeHtml(entry.type)}</td>
            <td>${escapeHtml(entry.title)}</td>
            <td>${escapeHtml(entry.detail)}</td>
          </tr>
        `).join('')
      : '<tr><td colspan="5">No records captured yet for this crop.</td></tr>'

    const summary = {
      totalRecords: comprehensiveRecords.length,
      treatments: crop.treatments?.length || 0,
      sales: crop.yieldRecords?.length || 0,
      soilTests: crop.soilTests?.length || 0,
      irrigation: crop.irrigationRecords?.length || 0,
      fieldOps: crop.fieldOperations?.length || 0,
      pests: crop.pestManagement?.length || 0,
      health: crop.healthMonitoring?.length || 0,
      scouting: crop.scoutingReports?.length || 0,
      disease: crop.diseaseMonitoring?.length || 0,
      weather: crop.weatherData?.length || 0,
      compliance: crop.complianceRecords?.length || 0
    }

    reportWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${escapeHtml(crop.name)} Full Crop Record</title>
          <style>
            body { font-family: "Segoe UI", Arial, sans-serif; margin: 24px; color: #111827; }
            h1 { margin: 0 0 6px 0; font-size: 24px; }
            h2 { margin: 20px 0 8px 0; font-size: 18px; }
            .meta { color: #4b5563; margin-bottom: 16px; }
            .grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; margin-bottom: 14px; }
            .card { border: 1px solid #d1d5db; border-radius: 8px; padding: 8px 10px; background: #f9fafb; font-size: 13px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { border: 1px solid #d1d5db; padding: 6px 8px; text-align: left; vertical-align: top; }
            th { background: #eef2ff; }
            .footer { margin-top: 12px; color: #6b7280; font-size: 12px; }
            @page { size: A4; margin: 14mm; }
          </style>
        </head>
        <body>
          <h1>Full Crop Record Report</h1>
          <div class="meta">Generated: ${new Date().toLocaleString()}</div>

          <h2>Crop Information</h2>
          <div class="grid">
            <div class="card"><strong>ID:</strong> ${escapeHtml(crop.id)}</div>
            <div class="card"><strong>Name:</strong> ${escapeHtml(crop.name)}</div>
            <div class="card"><strong>Variety:</strong> ${escapeHtml(crop.variety || 'N/A')}</div>
            <div class="card"><strong>Field:</strong> ${escapeHtml(crop.field || 'N/A')}</div>
            <div class="card"><strong>Area:</strong> ${escapeHtml(crop.area)} acres</div>
            <div class="card"><strong>Status:</strong> ${escapeHtml(crop.status || 'N/A')}</div>
            <div class="card"><strong>Planted:</strong> ${escapeHtml(crop.planted || 'N/A')}</div>
            <div class="card"><strong>Expected Harvest:</strong> ${escapeHtml(crop.expectedHarvest || 'N/A')}</div>
            <div class="card"><strong>Actual Harvest:</strong> ${escapeHtml(crop.actualHarvest || 'N/A')}</div>
          </div>

          <h2>Record Summary</h2>
          <div class="grid">
            <div class="card"><strong>Total Records:</strong> ${summary.totalRecords}</div>
            <div class="card"><strong>Treatments:</strong> ${summary.treatments}</div>
            <div class="card"><strong>Sales:</strong> ${summary.sales}</div>
            <div class="card"><strong>Soil Tests:</strong> ${summary.soilTests}</div>
            <div class="card"><strong>Irrigation:</strong> ${summary.irrigation}</div>
            <div class="card"><strong>Field Ops:</strong> ${summary.fieldOps}</div>
            <div class="card"><strong>Pests:</strong> ${summary.pests}</div>
            <div class="card"><strong>Health:</strong> ${summary.health}</div>
            <div class="card"><strong>Scouting:</strong> ${summary.scouting}</div>
            <div class="card"><strong>Disease:</strong> ${summary.disease}</div>
            <div class="card"><strong>Weather:</strong> ${summary.weather}</div>
            <div class="card"><strong>Compliance:</strong> ${summary.compliance}</div>
          </div>

          <h2>Comprehensive Timeline</h2>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Date</th>
                <th>Type</th>
                <th>Title</th>
                <th>Detail</th>
              </tr>
            </thead>
            <tbody>
              ${timelineRows}
            </tbody>
          </table>

          <div class="footer">Save as PDF from the print dialog to keep a portable copy.</div>
          <script>
            window.onload = function () {
              window.focus();
              window.print();
            }
          </script>
        </body>
      </html>
    `)

    reportWindow.document.close()
    flashToast('success', `Opened ${crop.name} print report`)
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

  // Memoized filter and sort with search
  const filteredItems = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase()
    
    return items.filter(crop => {
      // Text search filter
      if (q) {
        const matchesSearch = 
          (crop.name || '').toLowerCase().includes(q) ||
          (crop.variety || '').toLowerCase().includes(q) ||
          (crop.field || '').toLowerCase().includes(q) ||
          (crop.status || '').toLowerCase().includes(q) ||
          (crop.soilType || '').toLowerCase().includes(q)
        if (!matchesSearch) return false
      }
      
      // Status filter
      if(filterStatus !== 'all' && crop.status !== filterStatus) return false
      
      // Tab filter
      if(activeTab === 'active' && ['Harvested', 'Failed'].includes(crop.status)) return false
      if(activeTab === 'completed' && !['Harvested', 'Failed'].includes(crop.status)) return false
      
      return true
    }).sort((a, b) => {
      if(sortBy === 'planted') return new Date(b.planted || '1900-01-01') - new Date(a.planted || '1900-01-01')
      if(sortBy === 'area') return b.area - a.area
      if(sortBy === 'name') return a.name.localeCompare(b.name)
      return 0
    })
  }, [items, debouncedSearch, filterStatus, activeTab, sortBy])

  const stats = useMemo(() => ({
    total: items.length,
    totalArea: items.reduce((sum, crop) => sum + crop.area, 0),
    active: items.filter(c => !['Harvested', 'Failed'].includes(c.status)).length,
    harvested: items.filter(c => c.status === 'Harvested').length
  }), [items])

  const workspaceStats = useMemo(() => {
    const totalInputCost = items.reduce((sum, crop) => {
      const seedCost = Number(crop.seedCost || 0)
      const treatmentCost = (crop.treatments || []).reduce((total, treatment) => total + Number(treatment.cost || 0), 0)
      const operationsCost = (crop.fieldOperations || []).reduce((total, operation) => total + Number(operation.cost || 0), 0)
      return sum + seedCost + treatmentCost + operationsCost
    }, 0)
    const totalRevenue = items.reduce((sum, crop) => sum + (crop.yieldRecords || []).reduce((total, record) => total + Number(record.totalValue || 0), 0), 0)
    const totalMargin = totalRevenue - totalInputCost
    const totalTreatments = items.reduce((sum, crop) => sum + (crop.treatments?.length || 0), 0)
    const totalIrrigation = items.reduce((sum, crop) => sum + (crop.irrigationRecords?.length || 0), 0)
    const totalFieldOps = items.reduce((sum, crop) => sum + (crop.fieldOperations?.length || 0), 0)
    const totalHealthChecks = items.reduce((sum, crop) => sum + (crop.healthMonitoring?.length || 0), 0)
    const totalScouting = items.reduce((sum, crop) => sum + (crop.scoutingReports?.length || 0), 0)
    const totalDiseaseIncidents = items.reduce((sum, crop) => sum + (crop.diseaseMonitoring?.length || 0), 0)
    const totalSoilTests = items.reduce((sum, crop) => sum + (crop.soilTests?.length || 0), 0)
    const totalComplianceLogs = items.reduce((sum, crop) => sum + (crop.complianceRecords?.length || 0), 0)
    const insuredCrops = items.filter((crop) => crop.insuranceCoverage).length
    const certifiedCrops = items.filter((crop) => crop.certificationLevel && crop.certificationLevel !== 'Conventional').length
    const plannedCrops = items.filter((crop) => crop.status === 'Planned').length
    const avgHealth = items.length
      ? Math.round(items.reduce((sum, crop) => sum + (calculateHealthScore(crop) || crop.healthScore || 0), 0) / items.length)
      : 0
    const highRisk = items.filter((crop) => assessRiskLevel(crop) === 'High').length
    const upcomingHarvests = items.filter((crop) => {
      if (!crop.expectedHarvest) return false
      const expectedDate = new Date(crop.expectedHarvest)
      const today = new Date()
      const daysOut = Math.ceil((expectedDate - today) / (1000 * 60 * 60 * 24))
      return daysOut >= 0 && daysOut <= 30
    }).length

    return {
      totalInputCost,
      totalRevenue,
      totalMargin,
      totalTreatments,
      totalIrrigation,
      totalFieldOps,
      totalHealthChecks,
      totalScouting,
      totalDiseaseIncidents,
      totalSoilTests,
      totalComplianceLogs,
      insuredCrops,
      certifiedCrops,
      plannedCrops,
      avgHealth,
      highRisk,
      upcomingHarvests,
      marginPerAcre: stats.totalArea ? totalMargin / stats.totalArea : 0
    }
  }, [items, stats.totalArea])

  const activityBoards = useMemo(() => {
    const toDate = (value) => new Date(value || 0).getTime()
    const recentTreatments = items
      .flatMap((crop) => (crop.treatments || []).map((entry) => ({
        entryId: entry.id,
        cropId: crop.id,
        cropName: crop.name,
        date: entry.date,
        title: `${entry.type || 'Treatment'}: ${entry.product || 'No product'}`,
        detail: `KSH ${Number(entry.cost || 0).toLocaleString()}`,
        raw: entry
      })))
      .sort((a, b) => toDate(b.date) - toDate(a.date))
      .slice(0, 6)

    const recentDisease = items
      .flatMap((crop) => (crop.diseaseMonitoring || []).map((entry) => ({
        entryId: entry.id,
        cropId: crop.id,
        cropName: crop.name,
        date: entry.date,
        title: entry.disease || 'Disease record',
        detail: `Severity ${entry.severity || 0}/10`,
        raw: entry
      })))
      .sort((a, b) => toDate(b.date) - toDate(a.date))
      .slice(0, 6)

    const recentPests = items
      .flatMap((crop) => (crop.pestManagement || []).map((entry) => ({
        entryId: entry.id,
        cropId: crop.id,
        cropName: crop.name,
        date: entry.date,
        title: entry.pestType || 'Pest record',
        detail: `Severity ${entry.severity || 0}/10`,
        raw: entry
      })))
      .sort((a, b) => toDate(b.date) - toDate(a.date))
      .slice(0, 6)

    const recentSales = items
      .flatMap((crop) => (crop.yieldRecords || []).map((entry) => ({
        entryId: entry.id,
        cropId: crop.id,
        cropName: crop.name,
        date: entry.date,
        title: `${entry.amount || 0} ${entry.unit || 'units'}`,
        detail: `KSH ${Number(entry.totalValue || 0).toLocaleString()}`,
        raw: entry
      })))
      .sort((a, b) => toDate(b.date) - toDate(a.date))
      .slice(0, 6)

    const recentSoilTests = items
      .flatMap((crop) => (crop.soilTests || []).map((entry) => ({
        entryId: entry.id,
        cropId: crop.id,
        cropName: crop.name,
        date: entry.date,
        title: `pH ${entry.ph || 0}`,
        detail: `N ${entry.nitrogen || 0} • P ${entry.phosphorus || 0} • K ${entry.potassium || 0}`,
        raw: entry
      })))
      .sort((a, b) => toDate(b.date) - toDate(a.date))
      .slice(0, 6)

    const recentIrrigation = items
      .flatMap((crop) => (crop.irrigationRecords || []).map((entry) => ({
        entryId: entry.id,
        cropId: crop.id,
        cropName: crop.name,
        date: entry.date,
        title: `${entry.type || 'Irrigation'} • ${entry.amount || 0}"`,
        detail: `${entry.duration || 0}h • KSH ${Number(entry.cost || 0).toLocaleString()}`,
        raw: entry
      })))
      .sort((a, b) => toDate(b.date) - toDate(a.date))
      .slice(0, 6)

    const recentFieldOps = items
      .flatMap((crop) => (crop.fieldOperations || []).map((entry) => ({
        entryId: entry.id,
        cropId: crop.id,
        cropName: crop.name,
        date: entry.date,
        title: entry.operation || 'Field operation',
        detail: `${entry.equipment || 'No equipment'} • ${entry.hours || 0}h`,
        raw: entry
      })))
      .sort((a, b) => toDate(b.date) - toDate(a.date))
      .slice(0, 6)

    const recentHealth = items
      .flatMap((crop) => (crop.healthMonitoring || []).map((entry) => ({
        entryId: entry.id,
        cropId: crop.id,
        cropName: crop.name,
        date: entry.date,
        title: entry.type || 'Health check',
        detail: `Score ${entry.healthScore || 0}`,
        raw: entry
      })))
      .sort((a, b) => toDate(b.date) - toDate(a.date))
      .slice(0, 6)

    const recentScouting = items
      .flatMap((crop) => (crop.scoutingReports || []).map((entry) => ({
        entryId: entry.id,
        cropId: crop.id,
        cropName: crop.name,
        date: entry.date,
        title: `${entry.scoutName || 'Scout'} • ${entry.quadrant || 'Field'}`,
        detail: entry.recommendations || 'No recommendation',
        raw: entry
      })))
      .sort((a, b) => toDate(b.date) - toDate(a.date))
      .slice(0, 6)

    return {
      recentTreatments,
      recentSales,
      recentSoilTests,
      recentIrrigation,
      recentFieldOps,
      recentDisease,
      recentPests,
      recentHealth,
      recentScouting
    }
  }, [items])

  const activeWorkspaceMeta = WORKSPACE_VIEWS.find((workspace) => workspace.id === workspaceView) || WORKSPACE_VIEWS[0]
  const cropChoices = filteredItems.length ? filteredItems : items

  const fileInputRef = useRef(null)
  const [inlineEditId, setInlineEditId] = useState(null)
  const [inlineData, setInlineData] = useState({ name: '', status: 'Planted', area: 0, field: '', planted: '', expectedHarvest: '' })
  const [toast, setToast] = useState(null)
  const [treatmentForm, setTreatmentForm] = useState({ ...INITIAL_TREATMENT_FORM })
  const [salesForm, setSalesForm] = useState({ ...INITIAL_SALES_FORM })
  const [soilForm, setSoilForm] = useState({ ...INITIAL_SOIL_FORM })
  const [irrigationForm, setIrrigationForm] = useState({ ...INITIAL_IRRIGATION_FORM })
  const [fieldOpForm, setFieldOpForm] = useState({ ...INITIAL_FIELD_OP_FORM })
  const [pestForm, setPestForm] = useState({ ...INITIAL_PEST_FORM })
  const [healthForm, setHealthForm] = useState({ ...INITIAL_HEALTH_FORM })
  const [scoutingForm, setScoutingForm] = useState({ ...INITIAL_SCOUTING_FORM })
  const [diseaseForm, setDiseaseForm] = useState({ ...INITIAL_DISEASE_FORM })
  const [workflowFilters, setWorkflowFilters] = useState({ cropId: 'all', dateRange: 'all', query: '' })

  const resolveFormCropId = (cropId) => cropId || cropChoices[0]?.id || ''
  const flashToast = (type, message) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 2200)
  }
  const updateCropRecord = (cropId, recordKey, recordId, updates) => {
    setItems(items.map((item) => item.id === cropId ? {
      ...item,
      [recordKey]: (item[recordKey] || []).map((record) => record.id === recordId ? { ...record, ...updates } : record)
    } : item))
  }
  const deleteCropRecord = (cropId, recordKey, recordId) => {
    setItems(items.map((item) => item.id === cropId ? {
      ...item,
      [recordKey]: (item[recordKey] || []).filter((record) => record.id !== recordId)
    } : item))
  }
  const cropTheme = {
    surface: 'var(--bg-elevated, #ffffff)',
    surfaceAlt: 'var(--bg-secondary, #f8fafc)',
    border: 'var(--border-primary, #dbe5f1)',
    borderStrong: 'var(--border-secondary, #cbd5e1)',
    text: 'var(--text-primary, #0f172a)',
    textMuted: 'var(--text-secondary, #475569)',
    accent: 'var(--accent1, #0f766e)',
    success: 'var(--green, #059669)',
    danger: 'var(--action-danger, #dc2626)',
    warning: 'var(--action-warning, #a46d17)'
  }
  const recordActionStyle = {
    padding: '6px 10px',
    fontSize: '12px',
    borderRadius: '8px',
    border: `1px solid ${cropTheme.borderStrong}`,
    background: cropTheme.surfaceAlt,
    color: cropTheme.text
  }
  const secondaryButtonStyle = {
    padding: '10px 16px',
    borderRadius: '8px',
    border: `1px solid ${cropTheme.borderStrong}`,
    background: cropTheme.surfaceAlt,
    color: cropTheme.text,
    fontWeight: 600
  }
  const workflowCardStyle = {
    padding: '18px',
    marginBottom: '18px',
    border: `1px solid ${cropTheme.border}`,
    background: cropTheme.surface,
    color: cropTheme.text,
    boxShadow: '0 10px 28px rgba(15, 23, 42, 0.06)'
  }
  const getMetricTone = (level) => {
    if (level === 'good') {
      return {
        background: 'color-mix(in srgb, var(--green, #059669) 14%, transparent)',
        border: 'color-mix(in srgb, var(--green, #059669) 34%, transparent)',
        text: 'var(--green, #059669)'
      }
    }
    if (level === 'warning') {
      return {
        background: 'color-mix(in srgb, var(--action-warning, #a46d17) 14%, transparent)',
        border: 'color-mix(in srgb, var(--action-warning, #a46d17) 34%, transparent)',
        text: 'var(--action-warning, #a46d17)'
      }
    }
    return {
      background: 'color-mix(in srgb, var(--action-danger, #dc2626) 14%, transparent)',
      border: 'color-mix(in srgb, var(--action-danger, #dc2626) 34%, transparent)',
      text: 'var(--action-danger, #dc2626)'
    }
  }
  const getHealthScoreTone = (score) => score > 80 ? getMetricTone('good') : score > 60 ? getMetricTone('warning') : getMetricTone('danger')
  const getRiskTone = (value) => value === 'Low' ? getMetricTone('good') : value === 'Medium' ? getMetricTone('warning') : getMetricTone('danger')
  const confirmWorkflowDelete = (entry, recordKey, successMessage) => {
    if (!window.confirm(`Delete this record for ${entry.cropName}? This action cannot be undone.`)) return
    deleteCropRecord(entry.cropId, recordKey, entry.entryId)
    flashToast('success', successMessage)
  }
  const getFilteredWorkflowRecords = useCallback((records) => {
    const query = workflowFilters.query.trim().toLowerCase()
    const days = workflowFilters.dateRange === 'all' ? null : Number(workflowFilters.dateRange)
    const cutoff = days ? new Date(Date.now() - days * 24 * 60 * 60 * 1000) : null

    return records.filter((entry) => {
      if (workflowFilters.cropId !== 'all' && entry.cropId !== workflowFilters.cropId) return false
      if (cutoff && toDate(entry.date) < cutoff) return false
      if (!query) return true

      return [entry.cropName, entry.title, entry.detail, entry.date]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    })
  }, [workflowFilters])
  const renderWorkflowList = (records, onEdit, onDelete, emptyText) => {
    const visibleRecords = getFilteredWorkflowRecords(records)

    return (
      <div style={{ marginTop: '16px' }}>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '14px' }}>
          <input
            placeholder="Search crop, activity, or notes"
            value={workflowFilters.query}
            onChange={e => setWorkflowFilters({ ...workflowFilters, query: e.target.value })}
            style={{ minWidth: '220px', flex: '1 1 220px' }}
          />
          <select value={workflowFilters.cropId} onChange={e => setWorkflowFilters({ ...workflowFilters, cropId: e.target.value })}>
            <option value="all">All crops</option>
            {cropChoices.map(crop => <option key={crop.id} value={crop.id}>{crop.name} - {crop.field}</option>)}
          </select>
          <select value={workflowFilters.dateRange} onChange={e => setWorkflowFilters({ ...workflowFilters, dateRange: e.target.value })}>
            <option value="all">All dates</option>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
          <div style={{ fontSize: '13px', color: cropTheme.textMuted, fontWeight: 600 }}>{visibleRecords.length} visible records</div>
        </div>

        {visibleRecords.length ? (
          <div style={{ overflowX: 'auto', border: `1px solid ${cropTheme.border}`, borderRadius: '14px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', background: cropTheme.surface }}>
              <thead>
                <tr style={{ background: cropTheme.surfaceAlt }}>
                  <th style={{ textAlign: 'left', padding: '12px', color: cropTheme.text, borderBottom: `1px solid ${cropTheme.border}` }}>Date</th>
                  <th style={{ textAlign: 'left', padding: '12px', color: cropTheme.text, borderBottom: `1px solid ${cropTheme.border}` }}>Crop</th>
                  <th style={{ textAlign: 'left', padding: '12px', color: cropTheme.text, borderBottom: `1px solid ${cropTheme.border}` }}>Activity</th>
                  <th style={{ textAlign: 'left', padding: '12px', color: cropTheme.text, borderBottom: `1px solid ${cropTheme.border}` }}>Detail</th>
                  <th style={{ textAlign: 'left', padding: '12px', color: cropTheme.text, borderBottom: `1px solid ${cropTheme.border}` }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleRecords.map((entry) => (
                  <tr key={`${entry.cropId}-${entry.entryId}`}>
                    <td style={{ padding: '12px', color: cropTheme.textMuted, borderBottom: `1px solid ${cropTheme.border}` }}>{entry.date || 'No date'}</td>
                    <td style={{ padding: '12px', color: cropTheme.text, borderBottom: `1px solid ${cropTheme.border}`, fontWeight: 600 }}>{entry.cropName}</td>
                    <td style={{ padding: '12px', color: cropTheme.text, borderBottom: `1px solid ${cropTheme.border}` }}>{entry.title}</td>
                    <td style={{ padding: '12px', color: cropTheme.textMuted, borderBottom: `1px solid ${cropTheme.border}` }}>{entry.detail}</td>
                    <td style={{ padding: '12px', borderBottom: `1px solid ${cropTheme.border}` }}>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button onClick={() => onEdit(entry)} style={recordActionStyle}>Edit</button>
                        <button onClick={() => onDelete(entry)} style={{ ...recordActionStyle, color: cropTheme.danger }}>Delete</button>
                        <button onClick={() => setModalOpenId(entry.cropId)} style={recordActionStyle}>Open Crop</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <div style={{ color: cropTheme.textMuted }}>{emptyText}</div>}
      </div>
    )
  }

  function handleExportCSV() {
    const data = filteredItems.map(c => ({
      id: c.id,
      name: c.name,
      variety: c.variety,
      planted: c.planted,
      expectedHarvest: c.expectedHarvest,
      actualHarvest: c.actualHarvest,
      area: c.area,
      field: c.field,
      status: c.status,
      soilType: c.soilType,
      irrigationType: c.irrigationType,
      seedCost: c.seedCost,
      healthScore: c.healthScore,
      notes: c.notes
    }))
    exportToCSV(data, 'crops.csv')
  }

  function handleExportExcel() {
    const data = filteredItems.map(c => ({
      id: c.id,
      name: c.name,
      variety: c.variety,
      planted: c.planted,
      expectedHarvest: c.expectedHarvest,
      actualHarvest: c.actualHarvest,
      area: c.area,
      field: c.field,
      status: c.status,
      soilType: c.soilType,
      irrigationType: c.irrigationType,
      seedCost: c.seedCost,
      healthScore: c.healthScore,
      notes: c.notes
    }))
    exportToExcel(data, 'crops_export.csv')
  }

  function handleExportJSON() {
    exportToJSON(filteredItems, 'crops.json')
  }

  function startInlineEdit(crop){
    setInlineEditId(crop.id)
    setInlineData({
      name: crop.name || '',
      status: crop.status || 'Planted',
      area: crop.area || 0,
      field: crop.field || '',
      planted: crop.planted || '',
      expectedHarvest: crop.expectedHarvest || ''
    })
  }

  function saveInlineEdit(){
    if(!inlineEditId) return
    if(!(inlineData.name||'').trim()){
      setToast({ type:'error', message:'Crop name cannot be empty' })
      setTimeout(()=> setToast(null), 2000)
      return
    }
    if(inlineData.planted && inlineData.expectedHarvest && inlineData.expectedHarvest < inlineData.planted){
      setToast({ type:'error', message:'Expected harvest must be after planted date' })
      setTimeout(()=> setToast(null), 2500)
      return
    }
    const prev = items.find(i=> i.id === inlineEditId)
    setItems(items.map(c=> c.id===inlineEditId ? {
      ...c,
      name: inlineData.name.trim(),
      status: inlineData.status,
      area: Number(inlineData.area)||0,
      field: inlineData.field,
      planted: inlineData.planted,
      expectedHarvest: inlineData.expectedHarvest
    } : c))
    setInlineEditId(null)
    setToast({ type:'success', message:'Crop updated successfully' })
    setTimeout(()=> setToast(null), 2000)
  }

  function cancelInlineEdit(){ setInlineEditId(null) }

  function handleImportClick() {
    fileInputRef.current?.click()
  }

  function handleImportFile(e) {
    const file = e.target.files?.[0]
    if (!file) return

    const ext = file.name.split('.').pop()?.toLowerCase()

    if (ext === 'json') {
      importFromJSON(file, (data, error) => {
        if (error) {
          alert('Import failed: ' + error.message)
          return
        }
        if (confirm(`Import ${data.length} crops? This will merge with existing data.`)) {
          const imported = data.map(c => ({
            ...c,
            id: c.id || 'C-' + Math.floor(100 + Math.random()*900)
          }))
          setItems([...items, ...imported].map(normalizeCrop))
          alert(`Imported ${imported.length} crops`)
        }
      })
    } else if (ext === 'csv') {
      importFromCSV(file, (data, error) => {
        if (error) {
          alert('Import failed: ' + error.message)
          return
        }
        if (confirm(`Import ${data.length} crops? This will merge with existing data.`)) {
          const imported = data.map(c => ({
            id: c.id || 'C-' + Math.floor(100 + Math.random()*900),
            name: c.name || '',
            variety: c.variety || '',
            planted: c.planted || '',
            plantDate: c.planted || '',
            expectedHarvest: c.expectedHarvest || '',
            actualHarvest: c.actualHarvest || '',
            area: c.area ? Number(c.area) : 0,
            field: c.field || '',
            status: c.status || 'Planning',
            soilType: c.soilType || '',
            irrigationType: c.irrigationType || '',
            irrigationMethod: c.irrigationType || '',
            seedCost: c.seedCost ? Number(c.seedCost) : 0,
            healthScore: c.healthScore ? Number(c.healthScore) : 75,
            notes: c.notes || '',
            treatments: [],
            yieldRecords: [],
            soilTests: [],
            irrigationRecords: [],
            weatherEvents: []
          }))
          setItems([...items, ...imported].map(normalizeCrop))
          alert(`Imported ${imported.length} crops`)
        }
      })
    } else {
      alert('Unsupported file type. Use CSV or JSON.')
    }

    e.target.value = ''
  }

  return (
    <section>
      <div style={{ marginBottom: '24px' }}>
        <div className="card" style={{ padding: '20px', marginBottom: '18px', background: 'linear-gradient(135deg, rgba(15,118,110,0.10) 0%, rgba(37,99,235,0.08) 100%)', border: `1px solid ${cropTheme.border}`, color: cropTheme.text }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap', marginBottom: '16px' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: cropTheme.accent, marginBottom: '6px' }}>Crop OS</div>
              <h2 style={{ margin: 0, fontSize: '28px' }}>Professional Crop Operations Suite</h2>
              <p style={{ margin: '8px 0 0 0', color: cropTheme.textMuted, maxWidth: '720px', lineHeight: 1.5 }}>
                Run your crop enterprise from one workspace: planning, production operations, financial control, field intelligence, and compliance execution.
              </p>
              {recordSource?.item && (
                <div style={{ marginTop: '10px', fontSize: '13px', fontWeight: 600, color: cropTheme.accent }}>
                  Report context: {recordSource.item}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              <button onClick={handleExportCSV} title="Export to CSV" style={{ fontSize: 12 }}>📊 CSV</button>
              <button onClick={handleExportExcel} title="Export to Excel" style={{ fontSize: 12 }}>📈 Excel</button>
              <button onClick={handleExportJSON} title="Export to JSON" style={{ fontSize: 12 }}>📄 JSON</button>
              <button onClick={handleImportClick} title="Import from file" style={{ fontSize: 12 }}>📥 Import</button>
              <input 
                ref={fileInputRef}
                type="file" 
                accept=".csv,.json" 
                style={{ display: 'none' }} 
                onChange={handleImportFile}
              />
              <button onClick={() => setShowAddForm(!showAddForm)} style={{ background: 'var(--green)', color: '#fff', padding: '10px 16px', borderRadius: '8px', border: 'none' }}>Add New Crop</button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '16px' }}>
            {WORKSPACE_VIEWS.map((workspace) => (
              <button
                key={workspace.id}
                onClick={() => setWorkspaceView(workspace.id)}
                style={{
                  textAlign: 'left',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  border: workspaceView === workspace.id ? `2px solid ${cropTheme.accent}` : `1px solid ${cropTheme.borderStrong}`,
                  background: workspaceView === workspace.id ? 'rgba(15, 118, 110, 0.12)' : cropTheme.surface,
                  color: cropTheme.text,
                  cursor: 'pointer'
                }}
              >
                <div style={{ fontSize: '22px', marginBottom: '6px' }}>{workspace.icon}</div>
                <div style={{ fontWeight: 700, color: cropTheme.text, marginBottom: '4px' }}>{workspace.label}</div>
                <div style={{ fontSize: '12px', color: cropTheme.textMuted, lineHeight: 1.4 }}>{workspace.description}</div>
              </button>
            ))}
          </div>

          <div className="card" style={{ padding: '16px', background: cropTheme.surface, border: `1px solid ${cropTheme.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '14px' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: cropTheme.accent }}>{activeWorkspaceMeta.icon} {activeWorkspaceMeta.label}</div>
                <div style={{ fontSize: '14px', color: cropTheme.textMuted, marginTop: '4px' }}>{activeWorkspaceMeta.description}</div>
              </div>
              <div style={{ fontSize: '13px', color: cropTheme.textMuted, fontWeight: 600 }}>Registry: {filteredItems.length} visible crop blocks</div>
            </div>

            {workspaceView === 'portfolio' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                <div className="card" style={{ padding: '14px' }}><div style={{ fontSize: '24px', fontWeight: 700, color: '#059669' }}>{stats.total}</div><div style={{ fontSize: '13px', color: 'var(--muted)' }}>Registered crops</div></div>
                <div className="card" style={{ padding: '14px' }}><div style={{ fontSize: '24px', fontWeight: 700, color: '#d97706' }}>{stats.totalArea.toFixed(1)}</div><div style={{ fontSize: '13px', color: 'var(--muted)' }}>Managed acres</div></div>
                <div className="card" style={{ padding: '14px' }}><div style={{ fontSize: '24px', fontWeight: 700, color: '#2563eb' }}>{stats.active}</div><div style={{ fontSize: '13px', color: 'var(--muted)' }}>Active campaigns</div></div>
                <div className="card" style={{ padding: '14px' }}><div style={{ fontSize: '24px', fontWeight: 700, color: '#475569' }}>{stats.harvested}</div><div style={{ fontSize: '13px', color: 'var(--muted)' }}>Closed campaigns</div></div>
              </div>
            )}

            {workspaceView === 'planning' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                <div className="card" style={{ padding: '14px' }}><div style={{ fontSize: '24px', fontWeight: 700, color: '#7c3aed' }}>{workspaceStats.plannedCrops}</div><div style={{ fontSize: '13px', color: 'var(--muted)' }}>Planned blocks</div></div>
                <div className="card" style={{ padding: '14px' }}><div style={{ fontSize: '24px', fontWeight: 700, color: '#ea580c' }}>{workspaceStats.upcomingHarvests}</div><div style={{ fontSize: '13px', color: 'var(--muted)' }}>Harvests in 30 days</div></div>
                <div className="card" style={{ padding: '14px' }}><div style={{ fontSize: '24px', fontWeight: 700, color: '#0f766e' }}>{items.filter(crop => crop.planted).length}</div><div style={{ fontSize: '13px', color: 'var(--muted)' }}>Blocks with planting dates</div></div>
                <div className="card" style={{ padding: '14px' }}><div style={{ fontSize: '24px', fontWeight: 700, color: '#1d4ed8' }}>{items.filter(crop => crop.expectedHarvest).length}</div><div style={{ fontSize: '13px', color: 'var(--muted)' }}>Blocks with harvest targets</div></div>
              </div>
            )}

            {workspaceView === 'operations' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                <div className="card" style={{ padding: '14px' }}><div style={{ fontSize: '24px', fontWeight: 700, color: '#f59e0b' }}>{workspaceStats.totalTreatments}</div><div style={{ fontSize: '13px', color: 'var(--muted)' }}>Treatments</div></div>
                <div className="card" style={{ padding: '14px' }}><div style={{ fontSize: '24px', fontWeight: 700, color: '#06b6d4' }}>{workspaceStats.totalIrrigation}</div><div style={{ fontSize: '13px', color: 'var(--muted)' }}>Irrigation logs</div></div>
                <div className="card" style={{ padding: '14px' }}><div style={{ fontSize: '24px', fontWeight: 700, color: '#65a30d' }}>{workspaceStats.totalFieldOps}</div><div style={{ fontSize: '13px', color: 'var(--muted)' }}>Field operations</div></div>
                <div className="card" style={{ padding: '14px' }}><div style={{ fontSize: '24px', fontWeight: 700, color: '#059669' }}>{workspaceStats.totalHealthChecks}</div><div style={{ fontSize: '13px', color: 'var(--muted)' }}>Health checks</div></div>
              </div>
            )}

            {workspaceView === 'finance' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                <div className="card" style={{ padding: '14px' }}><div style={{ fontSize: '20px', fontWeight: 700, color: '#dc2626' }}>KSH {workspaceStats.totalInputCost.toLocaleString()}</div><div style={{ fontSize: '13px', color: 'var(--muted)' }}>Input cost</div></div>
                <div className="card" style={{ padding: '14px' }}><div style={{ fontSize: '20px', fontWeight: 700, color: '#2563eb' }}>KSH {workspaceStats.totalRevenue.toLocaleString()}</div><div style={{ fontSize: '13px', color: 'var(--muted)' }}>Revenue</div></div>
                <div className="card" style={{ padding: '14px' }}><div style={{ fontSize: '20px', fontWeight: 700, color: workspaceStats.totalMargin >= 0 ? '#059669' : '#dc2626' }}>KSH {workspaceStats.totalMargin.toLocaleString()}</div><div style={{ fontSize: '13px', color: 'var(--muted)' }}>Gross margin</div></div>
                <div className="card" style={{ padding: '14px' }}><div style={{ fontSize: '20px', fontWeight: 700, color: '#7c3aed' }}>KSH {workspaceStats.marginPerAcre.toFixed(0)}</div><div style={{ fontSize: '13px', color: 'var(--muted)' }}>Margin per acre</div></div>
              </div>
            )}

            {workspaceView === 'field-intel' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                <div className="card" style={{ padding: '14px' }}><div style={{ fontSize: '24px', fontWeight: 700, color: '#059669' }}>{workspaceStats.avgHealth}</div><div style={{ fontSize: '13px', color: 'var(--muted)' }}>Average health score</div></div>
                <div className="card" style={{ padding: '14px' }}><div style={{ fontSize: '24px', fontWeight: 700, color: '#dc2626' }}>{workspaceStats.highRisk}</div><div style={{ fontSize: '13px', color: 'var(--muted)' }}>High-risk blocks</div></div>
                <div className="card" style={{ padding: '14px' }}><div style={{ fontSize: '24px', fontWeight: 700, color: '#2563eb' }}>{workspaceStats.totalScouting}</div><div style={{ fontSize: '13px', color: 'var(--muted)' }}>Scouting reports</div></div>
                <div className="card" style={{ padding: '14px' }}><div style={{ fontSize: '24px', fontWeight: 700, color: '#ea580c' }}>{workspaceStats.totalDiseaseIncidents}</div><div style={{ fontSize: '13px', color: 'var(--muted)' }}>Disease incidents</div></div>
              </div>
            )}

            {workspaceView === 'compliance' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                <div className="card" style={{ padding: '14px' }}><div style={{ fontSize: '24px', fontWeight: 700, color: '#2563eb' }}>{workspaceStats.insuredCrops}</div><div style={{ fontSize: '13px', color: 'var(--muted)' }}>Insured crops</div></div>
                <div className="card" style={{ padding: '14px' }}><div style={{ fontSize: '24px', fontWeight: 700, color: '#7c3aed' }}>{workspaceStats.certifiedCrops}</div><div style={{ fontSize: '13px', color: 'var(--muted)' }}>Certified blocks</div></div>
                <div className="card" style={{ padding: '14px' }}><div style={{ fontSize: '24px', fontWeight: 700, color: '#0f766e' }}>{workspaceStats.totalSoilTests}</div><div style={{ fontSize: '13px', color: 'var(--muted)' }}>Soil tests</div></div>
                <div className="card" style={{ padding: '14px' }}><div style={{ fontSize: '24px', fontWeight: 700, color: '#475569' }}>{workspaceStats.totalComplianceLogs}</div><div style={{ fontSize: '13px', color: 'var(--muted)' }}>Compliance logs</div></div>
              </div>
            )}
          </div>
        </div>

        {workspaceView === 'treatments' && (
          <div className="card" style={workflowCardStyle}>
            <h3 style={{ marginTop: 0 }}>Treatment Entry</h3>
            <div style={{ fontSize: '13px', color: cropTheme.textMuted, marginBottom: '12px' }}>Capture applications, then edit or filter them below by crop and date window.</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '12px', marginBottom: '12px' }}>
              <select value={treatmentForm.cropId} onChange={e => setTreatmentForm({ ...treatmentForm, cropId: e.target.value })}><option value="">Select crop</option>{cropChoices.map(crop => <option key={crop.id} value={crop.id}>{crop.name} - {crop.field}</option>)}</select>
              <input type="date" value={treatmentForm.date} onChange={e => setTreatmentForm({ ...treatmentForm, date: e.target.value })} />
              <select value={treatmentForm.type} onChange={e => setTreatmentForm({ ...treatmentForm, type: e.target.value })}>{TREATMENT_TYPES.map(type => <option key={type} value={type}>{type}</option>)}</select>
              <input placeholder="Product" value={treatmentForm.product} onChange={e => setTreatmentForm({ ...treatmentForm, product: e.target.value })} />
              <input placeholder="Amount / Rate" value={treatmentForm.amount} onChange={e => setTreatmentForm({ ...treatmentForm, amount: e.target.value })} />
              <input type="number" placeholder="Cost" value={treatmentForm.cost} onChange={e => setTreatmentForm({ ...treatmentForm, cost: e.target.value })} />
              <input placeholder="Applicator" value={treatmentForm.applicator} onChange={e => setTreatmentForm({ ...treatmentForm, applicator: e.target.value })} />
              <input placeholder="Notes" value={treatmentForm.notes} onChange={e => setTreatmentForm({ ...treatmentForm, notes: e.target.value })} />
            </div>
            <button onClick={() => {
              const cropId = resolveFormCropId(treatmentForm.cropId)
              if (!cropId || !treatmentForm.product.trim()) return flashToast('error', 'Select crop and enter a treatment product')
              const payload = { date: treatmentForm.date || getTodayDate(), type: treatmentForm.type, product: treatmentForm.product.trim(), amount: treatmentForm.amount, cost: Number(treatmentForm.cost) || 0, applicator: treatmentForm.applicator || 'Current User', weather: '', notes: treatmentForm.notes }
              if (treatmentForm.editId) {
                updateCropRecord(cropId, 'treatments', treatmentForm.editId, payload)
              } else {
                addTreatment(cropId, payload)
              }
              setTreatmentForm({ ...INITIAL_TREATMENT_FORM })
              flashToast('success', treatmentForm.editId ? 'Treatment updated' : 'Treatment saved')
            }}>{treatmentForm.editId ? 'Save Changes' : 'Save Treatment'}</button>
            {treatmentForm.editId && <button onClick={() => setTreatmentForm({ ...INITIAL_TREATMENT_FORM })} style={{ ...secondaryButtonStyle, marginLeft: '10px' }}>Cancel Edit</button>}
            {renderWorkflowList(activityBoards.recentTreatments, (entry) => setTreatmentForm({ editId: entry.entryId, cropId: entry.cropId, date: entry.raw.date || getTodayDate(), type: entry.raw.type || TREATMENT_TYPES[0], product: entry.raw.product || '', amount: entry.raw.amount || '', cost: String(entry.raw.cost || ''), applicator: entry.raw.applicator || 'Current User', notes: entry.raw.notes || '' }), (entry) => confirmWorkflowDelete(entry, 'treatments', 'Treatment deleted'), 'No treatment records yet.')}
          </div>
        )}

        {workspaceView === 'sales' && (
          <div className="card" style={workflowCardStyle}>
            <h3 style={{ marginTop: 0 }}>Sales / Yield Entry</h3>
            <div style={{ fontSize: '13px', color: cropTheme.textMuted, marginBottom: '12px' }}>Track realized yield and value, then review records in a sortable operations table.</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '12px', marginBottom: '12px' }}>
              <select value={salesForm.cropId} onChange={e => setSalesForm({ ...salesForm, cropId: e.target.value })}><option value="">Select crop</option>{cropChoices.map(crop => <option key={crop.id} value={crop.id}>{crop.name} - {crop.field}</option>)}</select>
              <input type="date" value={salesForm.date} onChange={e => setSalesForm({ ...salesForm, date: e.target.value })} />
              <input type="number" placeholder="Amount" value={salesForm.amount} onChange={e => setSalesForm({ ...salesForm, amount: e.target.value })} />
              <input placeholder="Unit" value={salesForm.unit} onChange={e => setSalesForm({ ...salesForm, unit: e.target.value })} />
              <input placeholder="Quality" value={salesForm.quality} onChange={e => setSalesForm({ ...salesForm, quality: e.target.value })} />
              <input type="number" placeholder="Price per unit" value={salesForm.price} onChange={e => setSalesForm({ ...salesForm, price: e.target.value })} />
              <input type="number" placeholder="Total value" value={salesForm.totalValue} onChange={e => setSalesForm({ ...salesForm, totalValue: e.target.value })} />
            </div>
            <button onClick={() => {
              const cropId = resolveFormCropId(salesForm.cropId)
              if (!cropId || !salesForm.amount) return flashToast('error', 'Select crop and enter sale amount')
              const amount = Number(salesForm.amount) || 0
              const price = Number(salesForm.price) || 0
              const payload = { date: salesForm.date || getTodayDate(), amount, unit: salesForm.unit || 'kg', quality: salesForm.quality, moisture: 0, testWeight: 0, protein: 0, price, totalValue: Number(salesForm.totalValue) || amount * price }
              if (salesForm.editId) {
                updateCropRecord(cropId, 'yieldRecords', salesForm.editId, payload)
              } else {
                addYield(cropId, payload)
              }
              setSalesForm({ ...INITIAL_SALES_FORM })
              flashToast('success', salesForm.editId ? 'Sales record updated' : 'Sales record saved')
            }}>{salesForm.editId ? 'Save Changes' : 'Save Sales Record'}</button>
            {salesForm.editId && <button onClick={() => setSalesForm({ ...INITIAL_SALES_FORM })} style={{ ...secondaryButtonStyle, marginLeft: '10px' }}>Cancel Edit</button>}
            {renderWorkflowList(activityBoards.recentSales, (entry) => setSalesForm({ editId: entry.entryId, cropId: entry.cropId, date: entry.raw.date || getTodayDate(), amount: String(entry.raw.amount || ''), unit: entry.raw.unit || 'kg', quality: entry.raw.quality || '', price: String(entry.raw.price || ''), totalValue: String(entry.raw.totalValue || '') }), (entry) => confirmWorkflowDelete(entry, 'yieldRecords', 'Sales record deleted'), 'No sales records yet.')}
          </div>
        )}

        {workspaceView === 'soil' && (
          <div className="card" style={workflowCardStyle}>
            <h3 style={{ marginTop: 0 }}>Soil Test Entry</h3>
            <div style={{ fontSize: '13px', color: cropTheme.textMuted, marginBottom: '12px' }}>Keep lab readings and recommendations in one ledger for agronomy follow-up.</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '12px', marginBottom: '12px' }}>
              <select value={soilForm.cropId} onChange={e => setSoilForm({ ...soilForm, cropId: e.target.value })}><option value="">Select crop</option>{cropChoices.map(crop => <option key={crop.id} value={crop.id}>{crop.name} - {crop.field}</option>)}</select>
              <input type="date" value={soilForm.date} onChange={e => setSoilForm({ ...soilForm, date: e.target.value })} />
              <input type="number" step="0.1" placeholder="pH" value={soilForm.ph} onChange={e => setSoilForm({ ...soilForm, ph: e.target.value })} />
              <input type="number" placeholder="Nitrogen" value={soilForm.nitrogen} onChange={e => setSoilForm({ ...soilForm, nitrogen: e.target.value })} />
              <input type="number" placeholder="Phosphorus" value={soilForm.phosphorus} onChange={e => setSoilForm({ ...soilForm, phosphorus: e.target.value })} />
              <input type="number" placeholder="Potassium" value={soilForm.potassium} onChange={e => setSoilForm({ ...soilForm, potassium: e.target.value })} />
              <input placeholder="Recommendations" value={soilForm.recommendations} onChange={e => setSoilForm({ ...soilForm, recommendations: e.target.value })} />
            </div>
            <button onClick={() => {
              const cropId = resolveFormCropId(soilForm.cropId)
              if (!cropId || !soilForm.ph) return flashToast('error', 'Select crop and enter soil pH')
              const payload = { date: soilForm.date || getTodayDate(), ph: Number(soilForm.ph), nitrogen: Number(soilForm.nitrogen) || 0, phosphorus: Number(soilForm.phosphorus) || 0, potassium: Number(soilForm.potassium) || 0, organicMatter: 0, recommendations: soilForm.recommendations }
              if (soilForm.editId) {
                updateCropRecord(cropId, 'soilTests', soilForm.editId, payload)
              } else {
                addSoilTest(cropId, payload)
              }
              setSoilForm({ ...INITIAL_SOIL_FORM })
              flashToast('success', soilForm.editId ? 'Soil test updated' : 'Soil test saved')
            }}>{soilForm.editId ? 'Save Changes' : 'Save Soil Test'}</button>
            {soilForm.editId && <button onClick={() => setSoilForm({ ...INITIAL_SOIL_FORM })} style={{ ...secondaryButtonStyle, marginLeft: '10px' }}>Cancel Edit</button>}
            {renderWorkflowList(activityBoards.recentSoilTests, (entry) => setSoilForm({ editId: entry.entryId, cropId: entry.cropId, date: entry.raw.date || getTodayDate(), ph: String(entry.raw.ph || ''), nitrogen: String(entry.raw.nitrogen || ''), phosphorus: String(entry.raw.phosphorus || ''), potassium: String(entry.raw.potassium || ''), recommendations: entry.raw.recommendations || '' }), (entry) => confirmWorkflowDelete(entry, 'soilTests', 'Soil test deleted'), 'No soil tests yet.')}
          </div>
        )}

        {workspaceView === 'irrigation' && (
          <div className="card" style={workflowCardStyle}>
            <h3 style={{ marginTop: 0 }}>Irrigation Entry</h3>
            <div style={{ fontSize: '13px', color: cropTheme.textMuted, marginBottom: '12px' }}>Review watering frequency, costs, and water application by crop block.</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '12px', marginBottom: '12px' }}>
              <select value={irrigationForm.cropId} onChange={e => setIrrigationForm({ ...irrigationForm, cropId: e.target.value })}><option value="">Select crop</option>{cropChoices.map(crop => <option key={crop.id} value={crop.id}>{crop.name} - {crop.field}</option>)}</select>
              <input type="date" value={irrigationForm.date} onChange={e => setIrrigationForm({ ...irrigationForm, date: e.target.value })} />
              <select value={irrigationForm.type} onChange={e => setIrrigationForm({ ...irrigationForm, type: e.target.value })}>{IRRIGATION_TYPES.map(type => <option key={type} value={type}>{type}</option>)}</select>
              <input type="number" placeholder="Duration (hours)" value={irrigationForm.duration} onChange={e => setIrrigationForm({ ...irrigationForm, duration: e.target.value })} />
              <input type="number" placeholder="Water amount (inches)" value={irrigationForm.amount} onChange={e => setIrrigationForm({ ...irrigationForm, amount: e.target.value })} />
              <input type="number" placeholder="Cost" value={irrigationForm.cost} onChange={e => setIrrigationForm({ ...irrigationForm, cost: e.target.value })} />
            </div>
            <button onClick={() => {
              const cropId = resolveFormCropId(irrigationForm.cropId)
              if (!cropId || !irrigationForm.amount) return flashToast('error', 'Select crop and enter irrigation amount')
              const payload = { date: irrigationForm.date || getTodayDate(), duration: Number(irrigationForm.duration) || 0, amount: Number(irrigationForm.amount) || 0, type: irrigationForm.type, pressure: 0, efficiency: 0, cost: Number(irrigationForm.cost) || 0 }
              if (irrigationForm.editId) {
                updateCropRecord(cropId, 'irrigationRecords', irrigationForm.editId, payload)
              } else {
                addIrrigation(cropId, payload)
              }
              setIrrigationForm({ ...INITIAL_IRRIGATION_FORM })
              flashToast('success', irrigationForm.editId ? 'Irrigation log updated' : 'Irrigation log saved')
            }}>{irrigationForm.editId ? 'Save Changes' : 'Save Irrigation Log'}</button>
            {irrigationForm.editId && <button onClick={() => setIrrigationForm({ ...INITIAL_IRRIGATION_FORM })} style={{ ...secondaryButtonStyle, marginLeft: '10px' }}>Cancel Edit</button>}
            {renderWorkflowList(activityBoards.recentIrrigation, (entry) => setIrrigationForm({ editId: entry.entryId, cropId: entry.cropId, date: entry.raw.date || getTodayDate(), type: entry.raw.type || IRRIGATION_TYPES[0], duration: String(entry.raw.duration || ''), amount: String(entry.raw.amount || ''), cost: String(entry.raw.cost || '') }), (entry) => confirmWorkflowDelete(entry, 'irrigationRecords', 'Irrigation log deleted'), 'No irrigation logs yet.')}
          </div>
        )}

        {workspaceView === 'field-ops' && (
          <div className="card" style={workflowCardStyle}>
            <h3 style={{ marginTop: 0 }}>Field Operation Entry</h3>
            <div style={{ fontSize: '13px', color: cropTheme.textMuted, marginBottom: '12px' }}>Keep equipment, labor, and field activity visible in one operations queue.</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '12px', marginBottom: '12px' }}>
              <select value={fieldOpForm.cropId} onChange={e => setFieldOpForm({ ...fieldOpForm, cropId: e.target.value })}><option value="">Select crop</option>{cropChoices.map(crop => <option key={crop.id} value={crop.id}>{crop.name} - {crop.field}</option>)}</select>
              <input type="date" value={fieldOpForm.date} onChange={e => setFieldOpForm({ ...fieldOpForm, date: e.target.value })} />
              <select value={fieldOpForm.operation} onChange={e => setFieldOpForm({ ...fieldOpForm, operation: e.target.value })}>{OPERATION_TYPES.map(operation => <option key={operation} value={operation}>{operation}</option>)}</select>
              <select value={fieldOpForm.equipment} onChange={e => setFieldOpForm({ ...fieldOpForm, equipment: e.target.value })}>{EQUIPMENT_TYPES.map(equipment => <option key={equipment} value={equipment}>{equipment}</option>)}</select>
              <input type="number" placeholder="Hours" value={fieldOpForm.hours} onChange={e => setFieldOpForm({ ...fieldOpForm, hours: e.target.value })} />
              <input type="number" placeholder="Fuel / Cost" value={fieldOpForm.fuel} onChange={e => setFieldOpForm({ ...fieldOpForm, fuel: e.target.value })} />
              <input placeholder="Operator" value={fieldOpForm.operator} onChange={e => setFieldOpForm({ ...fieldOpForm, operator: e.target.value })} />
            </div>
            <button onClick={() => {
              const cropId = resolveFormCropId(fieldOpForm.cropId)
              if (!cropId) return flashToast('error', 'Select crop before saving operation')
              const payload = { date: fieldOpForm.date || getTodayDate(), operation: fieldOpForm.operation, equipment: fieldOpForm.equipment, hours: Number(fieldOpForm.hours) || 0, depth: 0, fuel: Number(fieldOpForm.fuel) || 0, operator: fieldOpForm.operator || 'Current User' }
              if (fieldOpForm.editId) {
                updateCropRecord(cropId, 'fieldOperations', fieldOpForm.editId, payload)
              } else {
                addFieldOperation(cropId, payload)
              }
              setFieldOpForm({ ...INITIAL_FIELD_OP_FORM })
              flashToast('success', fieldOpForm.editId ? 'Field operation updated' : 'Field operation saved')
            }}>{fieldOpForm.editId ? 'Save Changes' : 'Save Field Operation'}</button>
            {fieldOpForm.editId && <button onClick={() => setFieldOpForm({ ...INITIAL_FIELD_OP_FORM })} style={{ ...secondaryButtonStyle, marginLeft: '10px' }}>Cancel Edit</button>}
            {renderWorkflowList(activityBoards.recentFieldOps, (entry) => setFieldOpForm({ editId: entry.entryId, cropId: entry.cropId, date: entry.raw.date || getTodayDate(), operation: entry.raw.operation || OPERATION_TYPES[0], equipment: entry.raw.equipment || EQUIPMENT_TYPES[0], hours: String(entry.raw.hours || ''), fuel: String(entry.raw.fuel || ''), operator: entry.raw.operator || 'Current User' }), (entry) => confirmWorkflowDelete(entry, 'fieldOperations', 'Field operation deleted'), 'No field operations yet.')}
          </div>
        )}

        {workspaceView === 'pests' && (
          <div className="card" style={workflowCardStyle}>
            <h3 style={{ marginTop: 0 }}>Pest Management Entry</h3>
            <div style={{ fontSize: '13px', color: cropTheme.textMuted, marginBottom: '12px' }}>Capture pest pressure and intervention effectiveness with a searchable record table.</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '12px', marginBottom: '12px' }}>
              <select value={pestForm.cropId} onChange={e => setPestForm({ ...pestForm, cropId: e.target.value })}><option value="">Select crop</option>{cropChoices.map(crop => <option key={crop.id} value={crop.id}>{crop.name} - {crop.field}</option>)}</select>
              <input type="date" value={pestForm.date} onChange={e => setPestForm({ ...pestForm, date: e.target.value })} />
              <input placeholder="Pest type" value={pestForm.pestType} onChange={e => setPestForm({ ...pestForm, pestType: e.target.value })} />
              <input placeholder="Treatment applied" value={pestForm.treatment} onChange={e => setPestForm({ ...pestForm, treatment: e.target.value })} />
              <input type="number" placeholder="Severity (1-10)" value={pestForm.severity} onChange={e => setPestForm({ ...pestForm, severity: e.target.value })} />
              <input type="number" placeholder="Area affected" value={pestForm.area} onChange={e => setPestForm({ ...pestForm, area: e.target.value })} />
              <input placeholder="Effectiveness" value={pestForm.effectiveness} onChange={e => setPestForm({ ...pestForm, effectiveness: e.target.value })} />
              <input placeholder="Notes" value={pestForm.notes} onChange={e => setPestForm({ ...pestForm, notes: e.target.value })} />
            </div>
            <button onClick={() => {
              const cropId = resolveFormCropId(pestForm.cropId)
              if (!cropId || !pestForm.pestType.trim()) return flashToast('error', 'Select crop and enter pest type')
              const payload = { date: pestForm.date || getTodayDate(), pestType: pestForm.pestType.trim(), treatment: pestForm.treatment, severity: Number(pestForm.severity) || 0, area: Number(pestForm.area) || 0, effectiveness: pestForm.effectiveness, notes: pestForm.notes }
              if (pestForm.editId) {
                updateCropRecord(cropId, 'pestManagement', pestForm.editId, payload)
              } else {
                addPestManagement(cropId, payload)
              }
              setPestForm({ ...INITIAL_PEST_FORM })
              flashToast('success', pestForm.editId ? 'Pest record updated' : 'Pest record saved')
            }}>{pestForm.editId ? 'Save Changes' : 'Save Pest Record'}</button>
            {pestForm.editId && <button onClick={() => setPestForm({ ...INITIAL_PEST_FORM })} style={{ ...secondaryButtonStyle, marginLeft: '10px' }}>Cancel Edit</button>}
            {renderWorkflowList(activityBoards.recentPests, (entry) => setPestForm({ editId: entry.entryId, cropId: entry.cropId, date: entry.raw.date || getTodayDate(), pestType: entry.raw.pestType || '', treatment: entry.raw.treatment || '', severity: String(entry.raw.severity || ''), area: String(entry.raw.area || ''), effectiveness: entry.raw.effectiveness || '', notes: entry.raw.notes || '' }), (entry) => confirmWorkflowDelete(entry, 'pestManagement', 'Pest record deleted'), 'No pest logs yet.')}
          </div>
        )}

        {workspaceView === 'health' && (
          <div className="card" style={workflowCardStyle}>
            <h3 style={{ marginTop: 0 }}>Health Check Entry</h3>
            <div style={{ fontSize: '13px', color: cropTheme.textMuted, marginBottom: '12px' }}>Monitor vigor, risk flags, and field condition changes across the season.</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '12px', marginBottom: '12px' }}>
              <select value={healthForm.cropId} onChange={e => setHealthForm({ ...healthForm, cropId: e.target.value })}><option value="">Select crop</option>{cropChoices.map(crop => <option key={crop.id} value={crop.id}>{crop.name} - {crop.field}</option>)}</select>
              <input type="date" value={healthForm.date} onChange={e => setHealthForm({ ...healthForm, date: e.target.value })} />
              <select value={healthForm.type} onChange={e => setHealthForm({ ...healthForm, type: e.target.value })}>{HEALTH_MONITORING_TYPES.map(type => <option key={type} value={type}>{type}</option>)}</select>
              <input type="number" placeholder="Health score" value={healthForm.healthScore} onChange={e => setHealthForm({ ...healthForm, healthScore: e.target.value })} />
              <input placeholder="Plant vigor" value={healthForm.plantVigor} onChange={e => setHealthForm({ ...healthForm, plantVigor: e.target.value })} />
              <input placeholder="Notes" value={healthForm.notes} onChange={e => setHealthForm({ ...healthForm, notes: e.target.value })} />
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: cropTheme.text }}><input type="checkbox" checked={healthForm.diseasePresent} onChange={e => setHealthForm({ ...healthForm, diseasePresent: e.target.checked })} />Disease present</label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: cropTheme.text }}><input type="checkbox" checked={healthForm.pestDamage} onChange={e => setHealthForm({ ...healthForm, pestDamage: e.target.checked })} />Pest damage</label>
            </div>
            <button onClick={() => {
              const cropId = resolveFormCropId(healthForm.cropId)
              if (!cropId || !healthForm.healthScore) return flashToast('error', 'Select crop and enter health score')
              const payload = { date: healthForm.date || getTodayDate(), type: healthForm.type, healthScore: Number(healthForm.healthScore) || 0, notes: healthForm.notes, plantVigor: healthForm.plantVigor, diseasePresent: healthForm.diseasePresent, pestDamage: healthForm.pestDamage }
              if (healthForm.editId) {
                updateCropRecord(cropId, 'healthMonitoring', healthForm.editId, payload)
              } else {
                addHealthMonitoring(cropId, payload)
              }
              setHealthForm({ ...INITIAL_HEALTH_FORM })
              flashToast('success', healthForm.editId ? 'Health check updated' : 'Health check saved')
            }}>{healthForm.editId ? 'Save Changes' : 'Save Health Check'}</button>
            {healthForm.editId && <button onClick={() => setHealthForm({ ...INITIAL_HEALTH_FORM })} style={{ ...secondaryButtonStyle, marginLeft: '10px' }}>Cancel Edit</button>}
            {renderWorkflowList(activityBoards.recentHealth, (entry) => setHealthForm({ editId: entry.entryId, cropId: entry.cropId, date: entry.raw.date || getTodayDate(), type: entry.raw.type || HEALTH_MONITORING_TYPES[0], healthScore: String(entry.raw.healthScore || ''), plantVigor: entry.raw.plantVigor || 'Good', notes: entry.raw.notes || '', diseasePresent: Boolean(entry.raw.diseasePresent), pestDamage: Boolean(entry.raw.pestDamage) }), (entry) => confirmWorkflowDelete(entry, 'healthMonitoring', 'Health check deleted'), 'No health checks yet.')}
          </div>
        )}

        {workspaceView === 'scouting' && (
          <div className="card" style={workflowCardStyle}>
            <h3 style={{ marginTop: 0 }}>Scouting Report Entry</h3>
            <div style={{ fontSize: '13px', color: cropTheme.textMuted, marginBottom: '12px' }}>Store field observations and use the filters below to isolate recent scouting findings.</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '12px', marginBottom: '12px' }}>
              <select value={scoutingForm.cropId} onChange={e => setScoutingForm({ ...scoutingForm, cropId: e.target.value })}><option value="">Select crop</option>{cropChoices.map(crop => <option key={crop.id} value={crop.id}>{crop.name} - {crop.field}</option>)}</select>
              <input type="date" value={scoutingForm.date} onChange={e => setScoutingForm({ ...scoutingForm, date: e.target.value })} />
              <input placeholder="Scout name" value={scoutingForm.scoutName} onChange={e => setScoutingForm({ ...scoutingForm, scoutName: e.target.value })} />
              <input placeholder="Field quadrant" value={scoutingForm.quadrant} onChange={e => setScoutingForm({ ...scoutingForm, quadrant: e.target.value })} />
              <input placeholder="Weed pressure" value={scoutingForm.weedPressure} onChange={e => setScoutingForm({ ...scoutingForm, weedPressure: e.target.value })} />
              <input type="number" placeholder="Insect count" value={scoutingForm.insectCount} onChange={e => setScoutingForm({ ...scoutingForm, insectCount: e.target.value })} />
              <input placeholder="Disease symptoms" value={scoutingForm.diseaseSymptoms} onChange={e => setScoutingForm({ ...scoutingForm, diseaseSymptoms: e.target.value })} />
              <input placeholder="Recommendations" value={scoutingForm.recommendations} onChange={e => setScoutingForm({ ...scoutingForm, recommendations: e.target.value })} />
            </div>
            <button onClick={() => {
              const cropId = resolveFormCropId(scoutingForm.cropId)
              if (!cropId || !scoutingForm.scoutName.trim()) return flashToast('error', 'Select crop and enter scout name')
              const payload = { date: scoutingForm.date || getTodayDate(), scoutName: scoutingForm.scoutName.trim(), quadrant: scoutingForm.quadrant, weedPressure: scoutingForm.weedPressure, recommendations: scoutingForm.recommendations, insectCount: Number(scoutingForm.insectCount) || 0, diseaseSymptoms: scoutingForm.diseaseSymptoms }
              if (scoutingForm.editId) {
                updateCropRecord(cropId, 'scoutingReports', scoutingForm.editId, payload)
              } else {
                addScoutingReport(cropId, payload)
              }
              setScoutingForm({ ...INITIAL_SCOUTING_FORM })
              flashToast('success', scoutingForm.editId ? 'Scouting report updated' : 'Scouting report saved')
            }}>{scoutingForm.editId ? 'Save Changes' : 'Save Scouting Report'}</button>
            {scoutingForm.editId && <button onClick={() => setScoutingForm({ ...INITIAL_SCOUTING_FORM })} style={{ ...secondaryButtonStyle, marginLeft: '10px' }}>Cancel Edit</button>}
            {renderWorkflowList(activityBoards.recentScouting, (entry) => setScoutingForm({ editId: entry.entryId, cropId: entry.cropId, date: entry.raw.date || getTodayDate(), scoutName: entry.raw.scoutName || '', quadrant: entry.raw.quadrant || '', weedPressure: entry.raw.weedPressure || 'Low', insectCount: String(entry.raw.insectCount || ''), diseaseSymptoms: entry.raw.diseaseSymptoms || 'None', recommendations: entry.raw.recommendations || '' }), (entry) => confirmWorkflowDelete(entry, 'scoutingReports', 'Scouting report deleted'), 'No scouting reports yet.')}
          </div>
        )}

        {workspaceView === 'disease' && (
          <div className="card" style={workflowCardStyle}>
            <h3 style={{ marginTop: 0 }}>Disease Control Entry</h3>
            <div style={{ fontSize: '13px', color: cropTheme.textMuted, marginBottom: '12px' }}>Track disease severity and treatment history without losing readability in dark theme.</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '12px', marginBottom: '12px' }}>
              <select value={diseaseForm.cropId} onChange={e => setDiseaseForm({ ...diseaseForm, cropId: e.target.value })}><option value="">Select crop</option>{cropChoices.map(crop => <option key={crop.id} value={crop.id}>{crop.name} - {crop.field}</option>)}</select>
              <input type="date" value={diseaseForm.date} onChange={e => setDiseaseForm({ ...diseaseForm, date: e.target.value })} />
              <input placeholder="Disease name" value={diseaseForm.disease} onChange={e => setDiseaseForm({ ...diseaseForm, disease: e.target.value })} />
              <input type="number" placeholder="Severity (1-10)" value={diseaseForm.severity} onChange={e => setDiseaseForm({ ...diseaseForm, severity: e.target.value })} />
              <input type="number" placeholder="Coverage %" value={diseaseForm.coverage} onChange={e => setDiseaseForm({ ...diseaseForm, coverage: e.target.value })} />
              <input placeholder="Treatment" value={diseaseForm.treatment} onChange={e => setDiseaseForm({ ...diseaseForm, treatment: e.target.value })} />
              <input placeholder="Effectiveness" value={diseaseForm.effectiveness} onChange={e => setDiseaseForm({ ...diseaseForm, effectiveness: e.target.value })} />
              <input type="number" placeholder="Cost" value={diseaseForm.cost} onChange={e => setDiseaseForm({ ...diseaseForm, cost: e.target.value })} />
            </div>
            <button onClick={() => {
              const cropId = resolveFormCropId(diseaseForm.cropId)
              if (!cropId || !diseaseForm.disease.trim()) return flashToast('error', 'Select crop and enter disease name')
              const payload = { date: diseaseForm.date || getTodayDate(), disease: diseaseForm.disease.trim(), severity: Number(diseaseForm.severity) || 0, coverage: Number(diseaseForm.coverage) || 0, treatment: diseaseForm.treatment, effectiveness: diseaseForm.effectiveness, cost: Number(diseaseForm.cost) || 0 }
              if (diseaseForm.editId) {
                updateCropRecord(cropId, 'diseaseMonitoring', diseaseForm.editId, payload)
              } else {
                addDiseaseMonitoring(cropId, payload)
              }
              setDiseaseForm({ ...INITIAL_DISEASE_FORM })
              flashToast('success', diseaseForm.editId ? 'Disease record updated' : 'Disease record saved')
            }}>{diseaseForm.editId ? 'Save Changes' : 'Save Disease Record'}</button>
            {diseaseForm.editId && <button onClick={() => setDiseaseForm({ ...INITIAL_DISEASE_FORM })} style={{ ...secondaryButtonStyle, marginLeft: '10px' }}>Cancel Edit</button>}
            {renderWorkflowList(activityBoards.recentDisease, (entry) => setDiseaseForm({ editId: entry.entryId, cropId: entry.cropId, date: entry.raw.date || getTodayDate(), disease: entry.raw.disease || '', severity: String(entry.raw.severity || ''), coverage: String(entry.raw.coverage || ''), treatment: entry.raw.treatment || '', effectiveness: entry.raw.effectiveness || '', cost: String(entry.raw.cost || '') }), (entry) => confirmWorkflowDelete(entry, 'diseaseMonitoring', 'Disease record deleted'), 'No disease logs yet.')}
          </div>
        )}
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
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Contract Price (KSH/unit)</label>
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
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="🔍 Search crops (name, variety, field)..."
            style={{ flex: 1, minWidth: '200px', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px' }}
          />
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
        {searchTerm && (
          <div style={{ marginTop: '8px', fontSize: '14px', color: '#4b5563' }}>
            Found {filteredItems.length} crop{filteredItems.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Crops Grid with Inline Quick Edit */}
      <VirtualizedList
        items={filteredItems}
        itemHeight={80}
        height={Math.min(600, filteredItems.length * 80)}
        renderItem={(crop, index) => (
          <div key={crop.id} className="card" style={{ padding: '16px' }}>
            {inlineEditId === crop.id ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px 120px 1fr', gap: '8px', alignItems:'center' }} onKeyDown={e=>{ if(e.key==='Enter') saveInlineEdit(); if(e.key==='Escape') cancelInlineEdit(); }}>
                <input value={inlineData.name} onChange={e=>setInlineData({...inlineData, name: e.target.value})} placeholder="Crop name" />
                <select value={inlineData.status} onChange={e=>setInlineData({...inlineData, status: e.target.value})}>
                  {CROP_STATUS.map(s=> <option key={s} value={s}>{s}</option>)}
                </select>
                <input type="number" min="0" step="0.1" value={inlineData.area} onChange={e=>setInlineData({...inlineData, area: e.target.value})} placeholder="Area (acres)" />
                <input value={inlineData.field} onChange={e=>setInlineData({...inlineData, field: e.target.value})} placeholder="Field" />
                <input type="date" value={inlineData.planted} onChange={e=>setInlineData({...inlineData, planted: e.target.value})} />
                <input type="date" value={inlineData.expectedHarvest} onChange={e=>setInlineData({...inlineData, expectedHarvest: e.target.value})} />
                <div style={{ display:'flex', gap:'8px' }}>
                  <button className="tab-btn" onClick={saveInlineEdit}>Save</button>
                  <button className="tab-btn" onClick={cancelInlineEdit}>Cancel</button>
                </div>
              </div>
            ) : (
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <div style={{ fontWeight:600 }}>{crop.name} <span className="badge" style={{ marginLeft:8 }}>{crop.status}</span></div>
                  <div className="muted" style={{ fontSize:12 }}>Area: {crop.area} acres • Field: {crop.field} • Planted: {crop.planted || '—'} • Harvest: {crop.expectedHarvest || crop.actualHarvest || '—'}</div>
                </div>
                <div style={{ display:'flex', gap:'8px' }}>
                  <button onClick={() => setModalOpenId(crop.id)}>View</button>
                  <button onClick={() => startInlineEdit(crop)} style={{ background: '#ffffcc', border: '1px solid #ffdd00', color: '#333', fontWeight: '500' }}>⚡ Quick</button>
                  <button onClick={() => remove(crop.id)}>Delete</button>
                </div>
              </div>
            )}
          </div>
        )}
      />

      {/* Crop Detail Modal */}
      {modalOpenId && (() => {
        const crop = items.find(c => c.id === modalOpenId)
        if(!crop) return null
        const comprehensiveRecords = getCropComprehensiveRecords(crop)
        const cropNotes = Array.isArray(crop.notes) ? crop.notes : []
        const recordTypeSummary = comprehensiveRecords.reduce((acc, entry) => {
          acc[entry.type] = (acc[entry.type] || 0) + 1
          return acc
        }, {})
        const healthScore = calculateHealthScore(crop)
        const stressLevel = crop.riskAssessment?.weatherRisk || 'Unknown'
        const diseaseRisk = crop.riskAssessment?.diseaseRisk || 'Unknown'
        const overallRisk = assessRiskLevel(crop)
        const healthTone = getHealthScoreTone(healthScore)
        const stressTone = getRiskTone(stressLevel)
        const diseaseTone = getRiskTone(diseaseRisk)
        const overallTone = getRiskTone(overallRisk)
        return (
          <div className="drawer-overlay" onClick={() => setModalOpenId(null)}>
            <div
              className="drawer"
              onClick={e => e.stopPropagation()}
              style={{
                background: cropTheme.surface,
                color: cropTheme.text,
                border: `1px solid ${cropTheme.border}`,
                ['--muted']: cropTheme.textMuted,
                ['--primary']: cropTheme.accent
              }}
            >
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
                  <div className="card" style={{ padding: '14px', marginBottom: '24px', background: cropTheme.surfaceAlt, border: `1px solid ${cropTheme.border}`, color: cropTheme.text }}>
                    <h4 style={{ marginTop: 0 }}>Crop OS Workflows</h4>
                    <div style={{ fontSize: '13px', color: cropTheme.textMuted, lineHeight: 1.5 }}>
                      Quick Actions were removed from this drawer. Use the dedicated Crop OS submodules for Treatments, Sales, Soil, Irrigation, Field Ops, Pests, Health, Scouting, and Disease entry.
                    </div>
                  </div>

                  <div className="card" style={{ padding: '14px', marginBottom: '24px', background: cropTheme.surface, border: `1px solid ${cropTheme.border}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '10px' }}>
                      <h4 style={{ margin: 0 }}>Full Crop Record</h4>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button onClick={() => handleDownloadCropRecord(crop, 'json')} style={recordActionStyle}>Download JSON</button>
                        <button onClick={() => handleDownloadCropRecord(crop, 'csv')} style={recordActionStyle}>Download CSV</button>
                        <button onClick={() => handlePrintCropRecord(crop)} style={recordActionStyle}>Print / PDF</button>
                      </div>
                    </div>
                    <div style={{ fontSize: '13px', color: cropTheme.textMuted, marginBottom: '12px' }}>
                      Unified timeline of all records captured for this crop. Total entries: <strong style={{ color: cropTheme.text }}>{comprehensiveRecords.length}</strong>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                      {Object.entries(recordTypeSummary).map(([type, count]) => (
                        <span key={type} className="badge">{type}: {count}</span>
                      ))}
                      {Object.keys(recordTypeSummary).length === 0 && <span style={{ color: cropTheme.textMuted }}>No activity records yet</span>}
                    </div>
                    <div style={{ maxHeight: '340px', overflowY: 'auto', border: `1px solid ${cropTheme.border}`, borderRadius: '10px', background: cropTheme.surfaceAlt }}>
                      {comprehensiveRecords.map((entry) => (
                        <div key={entry.id} style={{ padding: '10px 12px', borderBottom: `1px solid ${cropTheme.border}` }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', alignItems: 'center' }}>
                            <div style={{ fontWeight: 600, color: cropTheme.text }}>{entry.icon} {entry.type}: {entry.title}</div>
                            <div style={{ fontSize: '12px', color: cropTheme.textMuted }}>{entry.date || 'No date'}</div>
                          </div>
                          <div style={{ fontSize: '13px', color: cropTheme.textMuted, marginTop: '4px' }}>{entry.detail}</div>
                        </div>
                      ))}
                      {comprehensiveRecords.length === 0 && (
                        <div style={{ padding: '12px', color: cropTheme.textMuted }}>No records captured yet for this crop.</div>
                      )}
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
                        style={{ width: '100%', padding: '8px', borderRadius: '4px', border: `1px solid ${cropTheme.borderStrong}`, background: cropTheme.surface, color: cropTheme.text }}
                      />
                    </div>
                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                      {cropNotes.slice().reverse().map(note => (
                        <div key={note.id} style={{ padding: '12px', background: cropTheme.surfaceAlt, border: `1px solid ${cropTheme.border}`, borderRadius: '8px', marginBottom: '8px', color: cropTheme.text }}>
                          <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '4px' }}>
                            {note.author} • {new Date(note.date).toLocaleString()}
                          </div>
                          <div>{note.text}</div>
                        </div>
                      ))}
                      {cropNotes.length === 0 && (
                        <div style={{ color: 'var(--muted)', fontStyle: 'italic' }}>No notes yet</div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="card" style={{ padding: '16px', marginBottom: '16px', background: cropTheme.surface, border: `1px solid ${cropTheme.border}`, color: cropTheme.text }}>
                    <h4 style={{ marginBottom: '16px', color: 'var(--green)' }}>Health Dashboard</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                      <div style={{ textAlign: 'center', padding: '14px 12px', background: healthTone.background, border: `1px solid ${healthTone.border}`, borderRadius: '10px', minWidth: 0 }}>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: healthTone.text, lineHeight: 1.1 }}>{healthScore}</div>
                        <div style={{ fontSize: '12px', color: cropTheme.textMuted, marginTop: '6px' }}>Health Score</div>
                      </div>
                      <div style={{ textAlign: 'center', padding: '14px 12px', background: stressTone.background, border: `1px solid ${stressTone.border}`, borderRadius: '10px', minWidth: 0 }}>
                        <div style={{ fontSize: '14px', fontWeight: 'bold', color: stressTone.text, lineHeight: 1.2, wordBreak: 'break-word' }}>{stressLevel}</div>
                        <div style={{ fontSize: '12px', color: cropTheme.textMuted, marginTop: '6px' }}>Stress Level</div>
                      </div>
                      <div style={{ textAlign: 'center', padding: '14px 12px', background: diseaseTone.background, border: `1px solid ${diseaseTone.border}`, borderRadius: '10px', minWidth: 0 }}>
                        <div style={{ fontSize: '14px', fontWeight: 'bold', color: diseaseTone.text, lineHeight: 1.2, wordBreak: 'break-word' }}>{diseaseRisk}</div>
                        <div style={{ fontSize: '12px', color: cropTheme.textMuted, marginTop: '6px' }}>Disease Risk</div>
                      </div>
                      <div style={{ textAlign: 'center', padding: '14px 12px', background: overallTone.background, border: `1px solid ${overallTone.border}`, borderRadius: '10px', minWidth: 0 }}>
                        <div style={{ fontSize: '14px', fontWeight: 'bold', color: overallTone.text, lineHeight: 1.2, wordBreak: 'break-word' }}>{overallRisk}</div>
                        <div style={{ fontSize: '12px', color: cropTheme.textMuted, marginTop: '6px' }}>Overall Risk</div>
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
                      <div><strong>Status:</strong> <span className={`badge ${crop.status === 'Harvested' ? 'green' : crop.status === 'Failed' ? 'flag' : ''}`}>{crop.status}</span></div>
                      <div><strong>Contract Price:</strong> KSH {Number(crop.contractPrice).toLocaleString()}/unit</div>
                      <div><strong>Insurance Coverage:</strong> {crop.insuranceCoverage ? 'Yes' : 'No'}</div>
                      <div><strong>Certification:</strong> {crop.certificationLevel}</div>
                      <div><strong>Market Destination:</strong> {crop.marketDestination}</div>
                      {crop.gpsCoordinates && <div><strong>GPS:</strong> {crop.gpsCoordinates.lat}, {crop.gpsCoordinates.lng}</div>}
                      <div style={{ marginTop: '12px' }}><strong>Notes:</strong> {typeof crop.notes === 'string' ? crop.notes : (crop.notes?.length > 0 ? `${crop.notes.length} notes recorded` : 'No notes')}</div>
                    </div>
                  </div>

                  <div className="card" style={{ padding: '16px', marginBottom: '16px' }}>
                    <h4 style={{ marginBottom: '16px', color: 'var(--green)' }}>Financial Summary</h4>
                    <div style={{ display: 'grid', gap: '8px', fontSize: '14px' }}>
                      <div><strong>Seed Cost:</strong> KSH {Number(crop.seedCost).toLocaleString()}</div>
                      <div><strong>Fertilizer Cost:</strong> KSH {(crop.treatments?.filter(t => t.type?.toLowerCase().includes('fertilizer')).reduce((sum, t) => sum + (t.cost || 0), 0) || 0).toLocaleString()}</div>
                      <div><strong>Chemical Cost:</strong> KSH {(crop.treatments?.filter(t => !t.type?.toLowerCase().includes('fertilizer')).reduce((sum, t) => sum + (t.cost || 0), 0) || 0).toLocaleString()}</div>
                      <div><strong>Field Operations:</strong> KSH {(crop.fieldOperations?.reduce((sum, op) => sum + (op.fuel || 0), 0) || 0).toLocaleString()}</div>
                      <div><strong>Irrigation Cost:</strong> KSH {(crop.irrigationRecords?.reduce((sum, ir) => sum + (ir.cost || 0), 0) || 0).toLocaleString()}</div>
                      <div style={{ borderTop: '1px solid #e5e5e5', paddingTop: '8px', marginTop: '8px' }}>
                        <strong>Total Input Cost:</strong> KSH {calculateTotalCost(crop).toLocaleString()}
                      </div>
                      <div><strong>Revenue:</strong> KSH {(crop.yieldRecords?.reduce((sum, y) => sum + (y.totalValue || 0), 0) || 0).toLocaleString()}</div>
                      <div style={{ borderTop: '1px solid #e5e5e5', paddingTop: '8px', marginTop: '8px', fontWeight: 'bold' }}>
                        <strong>Net Profit:</strong> KSH {calculateProfit(crop).toLocaleString()}
                      </div>
                      <div><strong>Profit per Acre:</strong> KSH {(calculateProfit(crop) / crop.area).toLocaleString()}</div>
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

        {showRecordCV && (
          <RecordCV
            entity={showRecordCV}
            title={`Crop: ${showRecordCV.name || showRecordCV.id}`}
            fields={[
              { key: 'name', label: 'Name' },
              { key: 'id', label: 'ID' },
              { key: 'cropType', label: 'Type' },
              { key: 'area', label: 'Area' },
              { key: 'yield', label: 'Yield' },
              { key: 'season', label: 'Season' }
            ]}
            onClose={() => setShowRecordCV(null)}
          />
        )}
    </section>
  )
}
