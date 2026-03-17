import React, { useEffect, useState, useRef, useMemo } from 'react'
const Pastures = React.lazy(() => import('./Pastures'))
const HealthSystem = React.lazy(() => import('./HealthSystem'))
const AnimalFeeding = React.lazy(() => import('./AnimalFeeding'))
import AnimalMeasurement from './AnimalMeasurement'
// Removed: import AnimalBreeding from './AnimalBreeding' (for startup perf)
const AnimalBreeding = React.lazy(() => import('./AnimalBreeding'))
const AnimalMilkYield = React.lazy(() => import('./AnimalMilkYield'))
const AnimalTreatment = React.lazy(() => import('./AnimalTreatment'))
const CalfManagement = React.lazy(() => import('./CalfManagement'))
const BSFFarming = React.lazy(() => import('./BSFFarming'))
const AzollaFarming = React.lazy(() => import('./AzollaFarming'))
const PoultryManagement = React.lazy(() => import('./PoultryManagement'))
const CanineManagement = React.lazy(() => import('./CanineManagement'))
import PhotoGallery from '../components/PhotoGallery'
import AnimalCV from '../components/animal/AnimalCV'
import { fileToDataUrl, estimateDataUrlSize, uid } from '../lib/image'
import { logAnimalActivity } from '../lib/activityLogger'
import { exportToCSV, exportToExcel, exportToJSON, importFromCSV, importFromJSON, batchPrint } from '../lib/exportImport'
import { savePhoto, deletePhoto, getPhotosByEntity } from '../lib/photoAnalysis'
import { generateQRCodeDataURL, printQRTag, batchPrintQRTags } from '../lib/qrcode'
import { useDebounce } from '../lib/useDebounce'
import { perfMonitor } from '../lib/performanceUtils'
import VirtualizedList from '../components/VirtualizedList'
import { LineChart } from '../components/Charts'

// Realized Animals component: HTML5 controls, inline validation, unique tag checks,
// realistic sample data, and non-placeholder behavior.
export default function Animals({ section = 'all', initialTab = 'list', recordSource = null }) {
  const isDairySection = section === 'dairy'
  const dairyGroupId = 'G-001'
  const dairyFallbackGroup = { id: dairyGroupId, name: 'Bovine', desc: 'Cattle, dairy cows, beef cattle, and related breeds.' }
  const DAIRY_LIFECYCLE_STAGES = [
    'Fresh (0-21 DIM)',
    'Early Lactation (22-100 DIM)',
    'Mid Lactation (101-200 DIM)',
    'Late Lactation (201+ DIM)',
    'Dry (Far-Off)',
    'Close-Up Dry',
    'Transition',
    'Heifer',
    'Pregnant Heifer',
    'Pre-Weaned Calf',
    'Post-Weaned Heifer',
    'Not Applicable'
  ]

  function isAnimalInScope(animal) {
    return !isDairySection || animal?.groupId === dairyGroupId
  }

  function isGroupInScope(group) {
    return !isDairySection || group?.id === dairyGroupId
  }

  // Track expanded/collapsed state for group details
  const [expandedGroups, setExpandedGroups] = useState([])
  const AKEY = 'cattalytics:animals'
  const GKEY = 'cattalytics:groups'
  const DAIRY_SETTINGS_KEY = 'cattalytics:dairy:kpi:settings'
  const DAIRY_CUSTOM_PRESETS_KEY = 'cattalytics:dairy:kpi:custom-presets'
  const DAIRY_PRESET_META_KEY = 'cattalytics:dairy:kpi:preset-meta'
  const DAIRY_PRESET_SCHEMA_VERSION = 2
  const defaultDairyKpiSettings = {
    milkingTargetPct: 55,
    dryTargetPct: 18,
    heiferTargetPct: 22,
    pregnantTargetPct: 35,
    freshTargetPct: 10,
    dryMaxPct: 35,
    milkingMinPct: 45,
    unknownMaxCount: 0,
    avgDimWarnAbove: 220,
    requireCloseUpForPregnant: true
  }
  const dairyKpiPresets = {
    conservative: {
      label: 'Conservative',
      description: 'Prioritizes safety margins, stronger dry-cow coverage, and tighter alert controls.',
      settings: {
        milkingTargetPct: 50,
        freshTargetPct: 8,
        dryTargetPct: 22,
        heiferTargetPct: 24,
        pregnantTargetPct: 40,
        dryMaxPct: 32,
        milkingMinPct: 48,
        unknownMaxCount: 0,
        avgDimWarnAbove: 205,
        requireCloseUpForPregnant: true
      }
    },
    balanced: {
      label: 'Balanced',
      description: 'Default operating profile with moderate targets and general-purpose herd thresholds.',
      settings: {
        milkingTargetPct: 55,
        freshTargetPct: 10,
        dryTargetPct: 18,
        heiferTargetPct: 22,
        pregnantTargetPct: 35,
        dryMaxPct: 35,
        milkingMinPct: 45,
        unknownMaxCount: 0,
        avgDimWarnAbove: 220,
        requireCloseUpForPregnant: true
      }
    },
    aggressive: {
      label: 'Aggressive',
      description: 'Pushes for higher milking share and leaner dry periods for tighter throughput management.',
      settings: {
        milkingTargetPct: 62,
        freshTargetPct: 12,
        dryTargetPct: 14,
        heiferTargetPct: 18,
        pregnantTargetPct: 30,
        dryMaxPct: 30,
        milkingMinPct: 52,
        unknownMaxCount: 0,
        avgDimWarnAbove: 235,
        requireCloseUpForPregnant: false
      }
    }
  }

  // Default groups for first load, but allow adding/removing
  const DEFAULT_GROUPS = [
    { id: 'G-001', name: 'Bovine', desc: 'Cattle, dairy cows, beef cattle, and related breeds.' },
    { id: 'G-002', name: 'Porcine', desc: 'Pigs, hogs, swine, and related breeds.' },
    { id: 'G-003', name: 'Caprine', desc: 'Goats, dairy goats, meat goats, and related breeds.' },
    { id: 'G-004', name: 'Ovine', desc: 'Sheep, lambs, wool sheep, and related breeds.' },
    { id: 'G-005', name: 'Equine', desc: 'Horses, donkeys, mules, ponies, and related breeds.' },
    { id: 'G-006', name: 'Camelids', desc: 'Camels, alpacas, llamas, and related breeds.' },
    { id: 'G-007', name: 'Avians', desc: 'Poultry: chickens, turkeys, ducks, geese, quail, and other birds.' },
    { id: 'G-008', name: 'Canines', desc: 'Dogs, working canines, guard dogs, and related breeds.' },
    { id: 'G-009', name: 'Aquaculture', desc: 'Fish, shrimp, and other aquatic livestock.' },
    { id: 'G-010', name: 'Insects', desc: 'Bees, black soldier flies, and other farmed insects.' }
  ]

  const SAMPLE_ANIMALS = [
    // Minimal sample data for performance - just 2 examples
    { id: 'A-001', tag: 'TAG1001', name: 'Daisy', breed: 'Holstein', sex: 'F', color: 'Black/White', dob: '2024-03-15', weight: 320, sire: 'S-100', dam: 'D-200', groupId: 'G-001', status: 'Active', notes: 'Healthy heifer', owner: 'Farm Owner', registration: 'REG-1001', tattoo: 'H-01', purchaseDate: '2024-03-20', purchasePrice: 85000, vendor: 'Valley Farms', tags: ['heifer'], photo: '', photos: [], pregnancyStatus: 'Not Pregnant', expectedDue: '', parity: 0, lactationStatus: 'Heifer',
      daysInMilk: '', lastCalvingDate: '',
      production: { eggs: 0, meat: 0 },
      genetics: { pedigree: '', dnaMarkers: '' },
      location: { barn: '', pen: '', pasture: '' },
      events: []
    },
    { id: 'A-002', tag: 'TAG1002', name: 'Bessie', breed: 'Jersey', sex: 'F', color: 'Brown', dob: '2021-05-10', weight: 480, sire: 'S-101', dam: 'D-201', groupId: 'G-001', status: 'Active', notes: 'Pregnant cow', owner: 'Farm Owner', registration: 'REG-1002', tattoo: 'C-01', purchaseDate: '2020-09-10', purchasePrice: 145000, vendor: 'Green Pastures', tags: ['pregnant'], photo: '', pregnancyStatus: 'Pregnant', expectedDue: '2026-02-20', parity: 2, lactationStatus: 'Dry',
      daysInMilk: 248, lastCalvingDate: '2025-07-10',
      production: { eggs: 0, meat: 0 },
      genetics: { pedigree: '', dnaMarkers: '' },
      location: { barn: '', pen: '', pasture: '' },
      events: []
    },
    { id: 'A-003', tag: 'DOG-001', name: 'Max', breed: 'German Shepherd', sex: 'M', color: 'Black/Tan', dob: '2022-04-15', weight: 38, sire: '', dam: '', groupId: 'G-008', status: 'Active', notes: 'Guard dog', owner: 'Farm Owner', registration: 'CAN-2022-001', tattoo: '', purchaseDate: '2022-06-01', purchasePrice: 25000, vendor: 'Working Dogs Kenya', tags: ['guard','trained'], photo: '', pregnancyStatus: 'Not Applicable', expectedDue: '', parity: 0, lactationStatus: 'NA',
      daysInMilk: '', lastCalvingDate: '',
      production: { work: '' },
      genetics: { pedigree: '' },
      location: { pen: '' },
      events: []
    }
  ]

  const [tab, setTab] = useState(isDairySection ? 'addGroup' : 'list')
  const [formTab, setFormTab] = useState('basic') // New: for multi-tab animal form
  const [animals, setAnimals] = useState([])
  const [groups, setGroups] = useState([])
  const [filter, setFilter] = useState('')
  const [filterGroup, setFilterGroup] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterSex, setFilterSex] = useState('all')
  const [sortBy, setSortBy] = useState('name')
  
  // Debounce filter for better performance
  const debouncedFilter = useDebounce(filter, 300)

  const emptyAnimal = { 
    id: '', tag: '', name: '', breed: '', sex: 'F', color: '', dob: '', weight: '', sire: '', dam: '', groupId: isDairySection ? dairyGroupId : '', status: 'Active', notes: '', owner: '', registration: '', tattoo: '', purchaseDate: '', purchasePrice: '', vendor: '', tags: [], photo: '', photos: [], 
    pregnancyStatus: 'Unknown', expectedDue: '', parity: '', lactationStatus: 'NA',
    // Production Metrics
    production: {
      milk: { totalLifetime: 0, currentLactation: 0, peakYield: 0, averageDaily: 0, lastRecorded: '' },
      eggs: { totalLifetime: 0, currentYear: 0, averageDaily: 0, lastRecorded: '' },
      meat: { expectedYield: 0, dressedWeight: 0, gradingScore: '' },
      wool: { totalLifetime: 0, lastShearing: '', averageYield: 0, quality: '' },
      work: { hoursWorked: 0, tasksCompleted: 0, efficiency: '' },
      offspring: { totalBorn: 0, totalWeaned: 0, totalSurvived: 0 }
    },
    // Genetics & Breeding
    genetics: { 
      pedigree: '', 
      sireLineage: '',
      damLineage: '',
      dnaMarkers: '', 
      breedingValue: '',
      geneticDefects: [],
      inbreedingCoefficient: 0,
      expectedProgenyDifference: {},
      genomicEvaluation: ''
    },
    // Location & Facilities
    location: { 
      barn: '',
      pen: '', 
      pasture: '',
      stall: '',
      paddock: '',
      lastMoved: '',
      preferredLocation: ''
    },
    // Health Records
    health: {
      vaccinations: [],
      treatments: [],
      diagnoses: [],
      allergies: [],
      chronicConditions: [],
      lastVetVisit: '',
      nextVetVisit: '',
      bodyConditionScore: 0,
      healthStatus: 'Healthy',
      quarantineStatus: 'None'
    },
    // Financial Tracking
    financial: {
      acquisitionCost: 0,
      currentValue: 0,
      insuranceValue: 0,
      maintenanceCost: 0,
      productionRevenue: 0,
      feedCost: 0,
      veterinaryCost: 0,
      roi: 0,
      profitLoss: 0
    },
    // Insurance & Documentation
    documentation: {
      insurancePolicy: '',
      insuranceProvider: '',
      insuranceExpiry: '',
      microchipId: '',
      passportNumber: '',
      healthCertificate: '',
      importExportPermits: [],
      birthCertificate: '',
      registrationPapers: []
    },
    // Certifications & Awards
    certifications: {
      organic: false,
      freeRange: false,
      grassFed: false,
      animalWelfare: '',
      showAwards: [],
      breedingCertifications: [],
      qualityGrades: []
    },
    // Behavior & Temperament
    behavior: {
      temperament: 'Calm',
      trainingLevel: 'None',
      specialNeeds: [],
      behaviorNotes: '',
      handlingDifficulty: 'Easy',
      socialization: 'Good'
    },
    // Feeding & Nutrition
    nutrition: {
      currentDiet: '',
      feedingSchedule: '',
      specialDiet: '',
      supplements: [],
      waterIntake: '',
      nutritionNotes: ''
    },
    // Performance Metrics
    performance: {
      growthRate: 0,
      feedConversionRatio: 0,
      reproductiveEfficiency: 0,
      productionEfficiency: 0,
      overallScore: 0
    },
    // Event History
    events: []
  }
  const [form, setForm] = useState(emptyAnimal)
  const [editingId, setEditingId] = useState(null)
  const [errors, setErrors] = useState({})

  const [groupCategory, setGroupCategory] = useState('');
  const [customGroupName, setCustomGroupName] = useState('');
  const [groupName, setGroupName] = useState('');
  // Auto-fill group name when category changes, except for 'Other'
  useEffect(() => {
    if (groupCategory && groupCategory !== 'Other') {
      setGroupName(groupCategory);
    } else if (groupCategory === 'Other') {
      setGroupName(customGroupName);
    }
  }, [groupCategory, customGroupName]);
  const [groupDesc, setGroupDesc] = useState('')
  const [groupDateCreated, setGroupDateCreated] = useState('')
  const [groupDateUpdated, setGroupDateUpdated] = useState('')
  const [groupStartDate, setGroupStartDate] = useState('')
  const [groupEndDate, setGroupEndDate] = useState('')
  const [editingGroupId, setEditingGroupId] = useState(null)
  const [dairyGroupingFilter, setDairyGroupingFilter] = useState('')
  const [dairyLifecycleFilter, setDairyLifecycleFilter] = useState('all')
  const [selectedDairyAnimalIds, setSelectedDairyAnimalIds] = useState([])
  const [bulkLifecycleStage, setBulkLifecycleStage] = useState('')
  const [dairyKpiSettings, setDairyKpiSettings] = useState(defaultDairyKpiSettings)
  const [selectedDairyPreset, setSelectedDairyPreset] = useState('balanced')
  const [customDairyPresets, setCustomDairyPresets] = useState({})
  const [customPresetName, setCustomPresetName] = useState('')
  const [customPresetNotes, setCustomPresetNotes] = useState('')
  const [isEditingSelectedPresetNote, setIsEditingSelectedPresetNote] = useState(false)
  const [selectedPresetNoteDraft, setSelectedPresetNoteDraft] = useState('')
  const [lastAppliedPreset, setLastAppliedPreset] = useState({ name: 'balanced', at: '' })
  const [pendingPresetImport, setPendingPresetImport] = useState(null)
  const presetImportInputRef = useRef(null)
  const selectedPresetNoteEditorRef = useRef(null)
  const scopedAnimals = useMemo(() => animals.filter(isAnimalInScope), [animals, isDairySection])
  const visibleGroups = useMemo(() => groups.filter(isGroupInScope), [groups, isDairySection])
  const isPresetLocked = !selectedDairyPreset.startsWith('custom::')

  function ensureDairyGroup(groupList) {
    const list = Array.isArray(groupList) ? groupList : []
    if (!isDairySection) return list
    if (list.some(g => g?.id === dairyGroupId)) return list
    return [dairyFallbackGroup, ...list]
  }

  const groupOptionsForForm = useMemo(() => {
    if (!isDairySection) return visibleGroups
    const dairyGroup =
      visibleGroups.find(g => g.id === dairyGroupId) ||
      groups.find(g => g.id === dairyGroupId) ||
      dairyFallbackGroup
    return [dairyGroup]
  }, [groups, isDairySection, visibleGroups])

  function getPresetOptionMeta(presetKey) {
    if (presetKey.startsWith('custom::')) {
      const name = presetKey.replace('custom::', '')
      const preset = customDairyPresets[name]
      return {
        label: name,
        description: preset?.notes || 'Custom preset',
        settings: preset?.settings || defaultDairyKpiSettings
      }
    }
    return dairyKpiPresets[presetKey] || {
      label: presetKey,
      description: '',
      settings: defaultDairyKpiSettings
    }
  }

  const selectedPresetMeta = getPresetOptionMeta(selectedDairyPreset)

  useEffect(() => {
    setIsEditingSelectedPresetNote(false)
    setSelectedPresetNoteDraft('')
  }, [selectedDairyPreset])

  useEffect(() => {
    if (!isEditingSelectedPresetNote) return
    if (!selectedPresetNoteEditorRef.current) return
    const ta = selectedPresetNoteEditorRef.current
    ta.style.height = 'auto'
    ta.style.height = `${Math.max(96, ta.scrollHeight)}px`
  }, [isEditingSelectedPresetNote, selectedPresetNoteDraft])

  function renderPresetNoteContent(noteText) {
    const text = String(noteText || '').trim()
    if (!text) return <span>No note yet.</span>
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
    if (!lines.length) return <span>{text}</span>

    const allBullets = lines.every(l => /^[-*]\s+/.test(l))
    if (allBullets) {
      return (
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          {lines.map((line, idx) => (
            <li key={idx}>{line.replace(/^[-*]\s+/, '')}</li>
          ))}
        </ul>
      )
    }

    return (
      <div style={{ whiteSpace: 'pre-wrap' }}>
        {text}
      </div>
    )
  }

  function clampPercent(v, fallback) {
    const n = Number(v)
    if (Number.isNaN(n)) return fallback
    return Math.max(0, Math.min(100, Math.round(n)))
  }

  function clampNonNegativeInt(v, fallback) {
    const n = Number(v)
    if (Number.isNaN(n)) return fallback
    return Math.max(0, Math.round(n))
  }

  function sanitizeDairyKpiSettings(settings) {
    const s = settings && typeof settings === 'object' ? settings : {}
    return {
      milkingTargetPct: clampPercent(s.milkingTargetPct, defaultDairyKpiSettings.milkingTargetPct),
      dryTargetPct: clampPercent(s.dryTargetPct, defaultDairyKpiSettings.dryTargetPct),
      heiferTargetPct: clampPercent(s.heiferTargetPct, defaultDairyKpiSettings.heiferTargetPct),
      pregnantTargetPct: clampPercent(s.pregnantTargetPct, defaultDairyKpiSettings.pregnantTargetPct),
      freshTargetPct: clampPercent(s.freshTargetPct, defaultDairyKpiSettings.freshTargetPct),
      dryMaxPct: clampPercent(s.dryMaxPct, defaultDairyKpiSettings.dryMaxPct),
      milkingMinPct: clampPercent(s.milkingMinPct, defaultDairyKpiSettings.milkingMinPct),
      unknownMaxCount: clampNonNegativeInt(s.unknownMaxCount, defaultDairyKpiSettings.unknownMaxCount),
      avgDimWarnAbove: clampNonNegativeInt(s.avgDimWarnAbove, defaultDairyKpiSettings.avgDimWarnAbove),
      requireCloseUpForPregnant: typeof s.requireCloseUpForPregnant === 'boolean'
        ? s.requireCloseUpForPregnant
        : defaultDairyKpiSettings.requireCloseUpForPregnant
    }
  }

  function sanitizePresetName(name) {
    return String(name || '')
      .trim()
      .replace(/\s+/g, ' ')
      .slice(0, 50)
  }

  function sanitizeCustomPresetMap(raw) {
    if (!raw || typeof raw !== 'object') return {}
    const out = {}
    Object.entries(raw).forEach(([name, presetValue]) => {
      const safeName = sanitizePresetName(name)
      if (!safeName) return
      const wrapped = presetValue && typeof presetValue === 'object' && ('settings' in presetValue || 'notes' in presetValue)
      const settings = wrapped ? presetValue.settings : presetValue
      const notes = wrapped ? String(presetValue.notes || '').trim().slice(0, 240) : ''
      out[safeName] = {
        settings: sanitizeDairyKpiSettings(settings),
        notes
      }
    })
    return out
  }

  function migratePresetPayload(parsed) {
    if (!parsed || typeof parsed !== 'object') {
      return {
        version: DAIRY_PRESET_SCHEMA_VERSION,
        customPresets: {},
        currentSettings: null,
        selectedDairyPreset: 'balanced',
        lastAppliedPreset: null
      }
    }

    const version = Number(parsed.version || 0)

    if (version >= 1) {
      return {
        version,
        customPresets: sanitizeCustomPresetMap(parsed.customPresets),
        currentSettings: parsed.currentSettings ? sanitizeDairyKpiSettings(parsed.currentSettings) : null,
        selectedDairyPreset: typeof parsed.selectedDairyPreset === 'string' ? parsed.selectedDairyPreset : 'balanced',
        lastAppliedPreset: parsed.lastAppliedPreset && typeof parsed.lastAppliedPreset === 'object'
          ? {
              name: String(parsed.lastAppliedPreset.name || 'balanced'),
              at: String(parsed.lastAppliedPreset.at || '')
            }
          : null
      }
    }

    return {
      version: DAIRY_PRESET_SCHEMA_VERSION,
      customPresets: sanitizeCustomPresetMap(parsed),
      currentSettings: null,
      selectedDairyPreset: 'balanced',
      lastAppliedPreset: null
    }
  }

  function getAnimalDIM(animal) {
    const dim = Number(animal?.daysInMilk)
    if (!Number.isNaN(dim) && dim >= 0) return Math.round(dim)
    if (!animal?.lastCalvingDate) return null
    const calvingTs = Date.parse(animal.lastCalvingDate)
    if (Number.isNaN(calvingTs)) return null
    const days = Math.floor((Date.now() - calvingTs) / (24 * 60 * 60 * 1000))
    return days >= 0 ? days : null
  }

  function suggestDairyLifecycleStage(animal) {
    const parity = Number(animal?.parity || 0)
    const pregnancy = (animal?.pregnancyStatus || '').toLowerCase()
    const isPregnant = pregnancy === 'pregnant'
    const dim = getAnimalDIM(animal)

    if (animal?.sex === 'M') {
      return { stage: 'Not Applicable', reason: 'Male animal', confidence: 'high' }
    }

    if (parity === 0) {
      if (isPregnant) return { stage: 'Pregnant Heifer', reason: 'Parity 0 and pregnant', confidence: 'high' }
      return { stage: 'Heifer', reason: 'Parity 0 and not pregnant', confidence: 'high' }
    }

    if (dim === null) {
      if (isPregnant) return { stage: 'Transition', reason: 'Pregnant with missing DIM', confidence: 'medium' }
      return { stage: 'Mid Lactation (101-200 DIM)', reason: 'Missing DIM, fallback stage', confidence: 'low' }
    }

    if (dim <= 21) return { stage: 'Fresh (0-21 DIM)', reason: `DIM ${dim}`, confidence: 'high' }
    if (dim <= 100) return { stage: 'Early Lactation (22-100 DIM)', reason: `DIM ${dim}`, confidence: 'high' }
    if (dim <= 200) return { stage: 'Mid Lactation (101-200 DIM)', reason: `DIM ${dim}`, confidence: 'high' }
    if (dim <= 305) return { stage: 'Late Lactation (201+ DIM)', reason: `DIM ${dim}`, confidence: 'high' }
    if (isPregnant) return { stage: 'Close-Up Dry', reason: `DIM ${dim} and pregnant`, confidence: 'medium' }
    return { stage: 'Dry (Far-Off)', reason: `DIM ${dim}`, confidence: 'medium' }
  }

  const dairyStageSummary = useMemo(() => {
    const summary = {}
    for (const stage of DAIRY_LIFECYCLE_STAGES) summary[stage] = 0
    for (const a of scopedAnimals) {
      const key = DAIRY_LIFECYCLE_STAGES.includes(a?.lactationStatus) ? a.lactationStatus : 'Not Applicable'
      summary[key] = (summary[key] || 0) + 1
    }
    return summary
  }, [scopedAnimals])

  const dairyGroupingRows = useMemo(() => {
    const q = dairyGroupingFilter.trim().toLowerCase()
    return scopedAnimals.filter(a => {
      if (dairyLifecycleFilter !== 'all' && (a?.lactationStatus || 'Not Applicable') !== dairyLifecycleFilter) return false
      if (!q) return true
      const searchable = [a?.name, a?.tag, a?.id, a?.breed, a?.lactationStatus, a?.pregnancyStatus]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return searchable.includes(q)
    })
  }, [dairyGroupingFilter, dairyLifecycleFilter, scopedAnimals])

  const dairyKPIs = useMemo(() => {
    const total = scopedAnimals.length
    const milkingStages = new Set([
      'Fresh (0-21 DIM)',
      'Early Lactation (22-100 DIM)',
      'Mid Lactation (101-200 DIM)',
      'Late Lactation (201+ DIM)'
    ])
    const dryStages = new Set(['Dry (Far-Off)', 'Close-Up Dry'])
    const heiferStages = new Set(['Heifer', 'Pregnant Heifer', 'Post-Weaned Heifer', 'Pre-Weaned Calf'])

    const milking = scopedAnimals.filter(a => milkingStages.has(a?.lactationStatus)).length
    const fresh = scopedAnimals.filter(a => a?.lactationStatus === 'Fresh (0-21 DIM)').length
    const dry = scopedAnimals.filter(a => dryStages.has(a?.lactationStatus)).length
    const heifers = scopedAnimals.filter(a => heiferStages.has(a?.lactationStatus)).length
    const pregnant = scopedAnimals.filter(a => (a?.pregnancyStatus || '').toLowerCase() === 'pregnant').length
    const unknown = scopedAnimals.filter(a => !a?.lactationStatus || a.lactationStatus === 'Not Applicable').length

    const dimValues = scopedAnimals.map(getAnimalDIM).filter(v => typeof v === 'number')
    const avgDIM = dimValues.length ? Math.round(dimValues.reduce((s, v) => s + v, 0) / dimValues.length) : null

    const pct = (n) => total ? Math.round((n / total) * 100) : 0
    const alerts = []
    const targets = {
      milking: Number(dairyKpiSettings.milkingTargetPct) || 0,
      dry: Number(dairyKpiSettings.dryTargetPct) || 0,
      heifers: Number(dairyKpiSettings.heiferTargetPct) || 0,
      pregnant: Number(dairyKpiSettings.pregnantTargetPct) || 0,
      fresh: Number(dairyKpiSettings.freshTargetPct) || 0
    }

    if (unknown > (Number(dairyKpiSettings.unknownMaxCount) || 0)) {
      alerts.push({ level: 'warning', text: `${unknown} animal(s) still have uncategorized lifecycle stage.` })
    }
    if (pct(dry) > (Number(dairyKpiSettings.dryMaxPct) || 0)) {
      alerts.push({ level: 'warning', text: `Dry cows are ${pct(dry)}% of herd. Review dry-off plan.` })
    }
    if (pct(milking) < (Number(dairyKpiSettings.milkingMinPct) || 0) && total > 4) {
      alerts.push({ level: 'info', text: `Milking stages are only ${pct(milking)}%. Check transition pipeline.` })
    }
    if (pregnant > 0 && dairyStageSummary['Close-Up Dry'] === 0 && dairyKpiSettings.requireCloseUpForPregnant) {
      alerts.push({ level: 'warning', text: 'Pregnant cows detected with zero close-up dry cows.' })
    }
    if (avgDIM !== null && avgDIM > (Number(dairyKpiSettings.avgDimWarnAbove) || 0)) {
      alerts.push({ level: 'info', text: `Average DIM is ${avgDIM}. Monitor late-lactation performance.` })
    }

    if (Math.abs(pct(milking) - targets.milking) > 10) {
      alerts.push({ level: 'info', text: `Milking ratio ${pct(milking)}% is off target ${targets.milking}%.` })
    }
    if (Math.abs(pct(dry) - targets.dry) > 10) {
      alerts.push({ level: 'info', text: `Dry ratio ${pct(dry)}% is off target ${targets.dry}%.` })
    }
    if (Math.abs(pct(heifers) - targets.heifers) > 12) {
      alerts.push({ level: 'info', text: `Heifer ratio ${pct(heifers)}% is off target ${targets.heifers}%.` })
    }
    if (Math.abs(pct(pregnant) - targets.pregnant) > 15) {
      alerts.push({ level: 'info', text: `Pregnancy ratio ${pct(pregnant)}% is off target ${targets.pregnant}%.` })
    }
    if (Math.abs(pct(fresh) - targets.fresh) > 8) {
      alerts.push({ level: 'info', text: `Fresh cow ratio ${pct(fresh)}% is off target ${targets.fresh}%.` })
    }

    return { total, milking, fresh, dry, heifers, pregnant, unknown, avgDIM, alerts, pct, targets }
  }, [dairyKpiSettings, dairyStageSummary, scopedAnimals])

  useEffect(() => {
    try {
      // Support legacy storage key used in some installs (devinsfarm:animals)
      const LEGACY_KEY = 'devinsfarm:animals'

      const rawPrimary = localStorage.getItem(AKEY)
      const rawLegacy = localStorage.getItem(LEGACY_KEY)

      const parseSafe = (s) => {
        try {
          const v = JSON.parse(s)
          return Array.isArray(v) ? v : []
        } catch (e) { return [] }
      }

      const primaryList = parseSafe(rawPrimary)
      const legacyList = parseSafe(rawLegacy)

      // Merge arrays deduping by `id` then `tag`.
      const mergedMap = new Map()
      const pushToMap = (item) => {
        if (!item || typeof item !== 'object') return
        const key = item.id || item.tag || JSON.stringify(item)
        if (!mergedMap.has(key)) mergedMap.set(key, item)
      }

      // Preference: keep primaryList items first, then legacy (so newer entries stay)
      primaryList.forEach(pushToMap)
      legacyList.forEach(pushToMap)

      let animalsList = Array.from(mergedMap.values())

      // If no data at all, seed with SAMPLE_ANIMALS
      if (!animalsList || animalsList.length === 0) {
        animalsList = SAMPLE_ANIMALS
      }

      // Persist merged list to both keys for compatibility across installs
      try {
        localStorage.setItem(AKEY, JSON.stringify(animalsList))
        localStorage.setItem(LEGACY_KEY, JSON.stringify(animalsList))
      } catch (e) {
        console.warn('Failed to persist merged animals list', e)
      }

      setAnimals(animalsList)

      const rawG = localStorage.getItem(GKEY)
      setGroups(ensureDairyGroup(rawG ? JSON.parse(rawG) : DEFAULT_GROUPS))
    } catch (err) {
      console.error('Failed parsing stored data', err)
      setAnimals(SAMPLE_ANIMALS)
      setGroups(ensureDairyGroup(DEFAULT_GROUPS))
    }
  }, [])

  useEffect(() => localStorage.setItem(AKEY, JSON.stringify(animals)), [animals])
  useEffect(() => localStorage.setItem(GKEY, JSON.stringify(groups)), [groups])
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DAIRY_SETTINGS_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed === 'object') {
        setDairyKpiSettings(sanitizeDairyKpiSettings(parsed))
      }
    } catch (e) {
      // Ignore settings load errors.
    }
  }, [])
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DAIRY_CUSTOM_PRESETS_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed === 'object') {
        setCustomDairyPresets(sanitizeCustomPresetMap(parsed))
      }
    } catch (e) {
      // Ignore custom preset load errors.
    }
  }, [])
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DAIRY_PRESET_META_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed === 'object') {
        if (parsed.lastAppliedPreset) setLastAppliedPreset(parsed.lastAppliedPreset)
        if (parsed.selectedDairyPreset && typeof parsed.selectedDairyPreset === 'string') {
          setSelectedDairyPreset(parsed.selectedDairyPreset)
        }
      }
    } catch (e) {
      // Ignore preset meta load errors.
    }
  }, [])
  useEffect(() => {
    try {
      localStorage.setItem(DAIRY_SETTINGS_KEY, JSON.stringify(dairyKpiSettings))
    } catch (e) {
      // Ignore settings save errors.
    }
  }, [dairyKpiSettings])
  useEffect(() => {
    try {
      localStorage.setItem(DAIRY_CUSTOM_PRESETS_KEY, JSON.stringify(customDairyPresets))
    } catch (e) {
      // Ignore custom preset save errors.
    }
  }, [customDairyPresets])
  useEffect(() => {
    try {
      localStorage.setItem(DAIRY_PRESET_META_KEY, JSON.stringify({ selectedDairyPreset, lastAppliedPreset }))
    } catch (e) {
      // Ignore preset meta save errors.
    }
  }, [lastAppliedPreset, selectedDairyPreset])
  useEffect(() => {
    if (!isDairySection) return
    if (['bsf', 'poultry', 'canine'].includes(tab)) setTab('addGroup')
    if (filterGroup === 'ungrouped') setFilterGroup('all')
  }, [filterGroup, isDairySection, tab])

  useEffect(() => {
    const allowedTabs = new Set([
      'list',
      'addGroup',
      'feeding',
      'health',
      'treatment',
      'breeding',
      'milkyield',
      'measurement',
      'calf',
      'pastures',
      'azolla',
      'poultry',
      'canine',
      'bsf'
    ])
    const defaultTab = isDairySection ? 'addGroup' : 'list'
    const nextTab = allowedTabs.has(initialTab) ? initialTab : defaultTab
    setTab(prev => (prev === nextTab ? prev : nextTab))
  }, [initialTab, isDairySection])

  function updateDairyLifecycle(animalId, updates) {
    setAnimals(prev => prev.map(a => (a.id === animalId ? { ...a, ...updates } : a)))
  }

  function toggleDairySelection(animalId) {
    setSelectedDairyAnimalIds(prev => prev.includes(animalId) ? prev.filter(id => id !== animalId) : [...prev, animalId])
  }

  function selectAllFilteredDairy() {
    setSelectedDairyAnimalIds(dairyGroupingRows.map(a => a.id))
  }

  function clearSelectedDairy() {
    setSelectedDairyAnimalIds([])
  }

  function applyBulkLifecycleStage() {
    if (!bulkLifecycleStage || selectedDairyAnimalIds.length === 0) return
    setAnimals(prev => prev.map(a => selectedDairyAnimalIds.includes(a.id) ? { ...a, lactationStatus: bulkLifecycleStage } : a))
    setBulkLifecycleStage('')
  }

  function applyAutoSuggestionToIds(ids) {
    if (!ids.length) return
    setAnimals(prev => prev.map(a => {
      if (!ids.includes(a.id)) return a
      const suggested = suggestDairyLifecycleStage(a)
      return { ...a, lactationStatus: suggested.stage }
    }))
  }

  function updateDairyKpiSetting(field, value) {
    if (isPresetLocked) return
    const numericFields = new Set([
      'milkingTargetPct',
      'dryTargetPct',
      'heiferTargetPct',
      'pregnantTargetPct',
      'freshTargetPct',
      'dryMaxPct',
      'milkingMinPct',
      'unknownMaxCount',
      'avgDimWarnAbove'
    ])
    if (numericFields.has(field)) {
      const next = Number(value)
      setDairyKpiSettings(prev => ({ ...prev, [field]: Number.isNaN(next) ? 0 : next }))
      return
    }
    setDairyKpiSettings(prev => ({ ...prev, [field]: value }))
  }

  function applyDairyPreset(presetKey) {
    const preset = presetKey.startsWith('custom::')
      ? customDairyPresets[presetKey.replace('custom::', '')]
      : dairyKpiPresets[presetKey]
    if (!preset) return
    setDairyKpiSettings({ ...(preset.settings || preset) })
    setSelectedDairyPreset(presetKey)
    setLastAppliedPreset({ name: presetKey, at: new Date().toISOString() })
  }

  function resetDairyKpiSettings() {
    setDairyKpiSettings({ ...defaultDairyKpiSettings })
    setSelectedDairyPreset('balanced')
    setLastAppliedPreset({ name: 'balanced', at: new Date().toISOString() })
  }

  function saveCustomDairyPreset() {
    const name = sanitizePresetName(customPresetName)
    if (!name) {
      window.alert('Enter a preset name before saving.')
      return
    }
    setCustomDairyPresets(prev => ({
      ...prev,
      [name]: {
        settings: sanitizeDairyKpiSettings(dairyKpiSettings),
        notes: String(customPresetNotes || '').trim().slice(0, 240)
      }
    }))
    setSelectedDairyPreset(`custom::${name}`)
    setLastAppliedPreset({ name: `custom::${name}`, at: new Date().toISOString() })
    setCustomPresetName('')
    setCustomPresetNotes('')
  }

  function deleteSelectedCustomPreset() {
    if (!selectedDairyPreset.startsWith('custom::')) return
    const name = selectedDairyPreset.replace('custom::', '')
    if (!window.confirm(`Delete custom preset "${name}"?`)) return
    setCustomDairyPresets(prev => {
      const next = { ...prev }
      delete next[name]
      return next
    })
    setSelectedDairyPreset('balanced')
    setLastAppliedPreset({ name: 'balanced', at: new Date().toISOString() })
  }

  function startInlineEditSelectedCustomPresetNote() {
    if (!selectedDairyPreset.startsWith('custom::')) return
    const name = selectedDairyPreset.replace('custom::', '')
    const existing = customDairyPresets[name]?.notes || ''
    setSelectedPresetNoteDraft(existing)
    setIsEditingSelectedPresetNote(true)
  }

  function saveInlineSelectedCustomPresetNote() {
    if (!selectedDairyPreset.startsWith('custom::')) return
    const name = selectedDairyPreset.replace('custom::', '')
    const safeNote = String(selectedPresetNoteDraft || '').trim().slice(0, 240)
    setCustomDairyPresets(prev => {
      const preset = prev[name]
      if (!preset) return prev
      return {
        ...prev,
        [name]: {
          ...preset,
          notes: safeNote
        }
      }
    })
    setIsEditingSelectedPresetNote(false)
    if (!customPresetNotes.trim()) {
      setCustomPresetNotes(safeNote)
    }
  }

  function cancelInlineSelectedCustomPresetNote() {
    setIsEditingSelectedPresetNote(false)
    setSelectedPresetNoteDraft('')
  }

  function makeEditableCustomFromCurrent() {
    const defaultName = selectedDairyPreset.startsWith('custom::')
      ? selectedDairyPreset.replace('custom::', '')
      : `${selectedDairyPreset}-copy`
    const name = window.prompt('Name for editable custom preset', defaultName)
    if (!name || !name.trim()) return
    const trimmed = sanitizePresetName(name)
    setCustomDairyPresets(prev => ({
      ...prev,
      [trimmed]: {
        settings: sanitizeDairyKpiSettings(dairyKpiSettings),
        notes: selectedPresetMeta.description || ''
      }
    }))
    setSelectedDairyPreset(`custom::${trimmed}`)
    setLastAppliedPreset({ name: `custom::${trimmed}`, at: new Date().toISOString() })
  }

  function exportDairyPresets() {
    const payload = {
      version: DAIRY_PRESET_SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      selectedDairyPreset,
      lastAppliedPreset,
      customPresets: customDairyPresets,
      currentSettings: sanitizeDairyKpiSettings(dairyKpiSettings)
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'dairy-kpi-presets.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  function importDairyPresetsFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || '{}'))
        const migrated = migratePresetPayload(parsed)
        const importedCustom = migrated.customPresets || {}

        if (Object.keys(importedCustom).length === 0 && !migrated.currentSettings) {
          throw new Error('No valid presets found in file')
        }
        const importedNames = Object.keys(importedCustom)
        const existingNames = new Set(Object.keys(customDairyPresets))
        const newNames = importedNames.filter(name => !existingNames.has(name))
        const overwriteNames = importedNames.filter(name => existingNames.has(name))

        setPendingPresetImport({
          importedCustom,
          currentSettings: migrated.currentSettings,
          importedNames,
          newNames,
          overwriteNames,
          fileName: file.name,
          importedAt: new Date().toISOString()
        })
      } catch (err) {
        window.alert('Failed to import presets: ' + (err?.message || err))
      } finally {
        e.target.value = ''
      }
    }
    reader.readAsText(file)
  }

  function cancelPresetImportPreview() {
    setPendingPresetImport(null)
  }

  function applyPresetImport({ applyImportedSettings = false } = {}) {
    if (!pendingPresetImport) return
    const { importedCustom, currentSettings, importedNames } = pendingPresetImport

    setCustomDairyPresets(prev => ({ ...prev, ...importedCustom }))

    if (applyImportedSettings && currentSettings && typeof currentSettings === 'object') {
      setDairyKpiSettings(sanitizeDairyKpiSettings(currentSettings))
      setSelectedDairyPreset('balanced')
      setLastAppliedPreset({ name: 'balanced', at: new Date().toISOString() })
    }

    setPendingPresetImport(null)
    window.alert(`Presets imported successfully (${importedNames.length} custom preset(s)).`)
  }

  function getKpiStatusStyle(actualPct, targetPct, tolerance = 8) {
    const delta = Math.abs((actualPct || 0) - (targetPct || 0))
    if (delta <= tolerance / 2) {
      return {
        label: 'On target',
        bg: '#ecfdf5',
        border: '#10b981',
        color: '#065f46'
      }
    }
    if (delta <= tolerance) {
      return {
        label: 'Near target',
        bg: '#fffbeb',
        border: '#f59e0b',
        color: '#92400e'
      }
    }
    return {
      label: 'Off target',
      bg: '#fef2f2',
      border: '#ef4444',
      color: '#991b1b'
    }
  }

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

  async function saveAnimal(e) {
    e && e.preventDefault()
    const candidate = { ...form }
    if (isDairySection) candidate.groupId = dairyGroupId
    if (!candidate.tag || !candidate.tag.trim()) candidate.tag = 'TAG' + (1000 + Math.floor(Math.random() * 9000))
    const eobj = validateAnimal(candidate)
    setErrors(eobj)
    if (Object.keys(eobj).length) return

    const animalId = editingId || 'A-' + (1000 + Math.floor(Math.random() * 900000))
    const groupName = groups.find(g => g.id === candidate.groupId)?.name || 'livestock'

    if (editingId) {
      // Update existing animal - regenerate QR code with updated data
      const updatedAnimal = { 
        ...candidate,
        id: editingId  // Preserve the ID
      }
      const qrData = {
        type: 'animal',
        id: editingId,
        name: updatedAnimal.name,
        tag: updatedAnimal.tag,
        breed: updatedAnimal.breed
      }
      updatedAnimal.qrCode = generateQRCodeDataURL(JSON.stringify(qrData))
      
      // Update the animal in the array, preserving fields not in the form
      setAnimals(animals.map(a => a.id === editingId ? { ...a, ...updatedAnimal } : a))
      
      // Log activity
      logAnimalActivity('updated', `Updated animal: ${updatedAnimal.name || updatedAnimal.tag}`, updatedAnimal)
    } else {
      // Create new animal - generate ID and QR code
      const id = animalId
      // normalize tags: accept comma-separated string or array
      if (candidate.tags && typeof candidate.tags === 'string') candidate.tags = candidate.tags.split(',').map(t => t.trim()).filter(Boolean)
      
      // Generate QR code automatically
      const qrData = {
        type: 'animal',
        id: id,
        name: candidate.name,
        tag: candidate.tag,
        breed: candidate.breed
      }
      candidate.qrCode = generateQRCodeDataURL(JSON.stringify(qrData))
      
      const newAnimal = { ...candidate, id }
      setAnimals([...animals, newAnimal])
      
      // Log activity
      logAnimalActivity('created', `Added new animal: ${newAnimal.name || newAnimal.tag}`, newAnimal)
    }

    // Sync photos to gallery
    try {
      // Sync main photo
      if (candidate.photo && candidate.photo.startsWith('data:image')) {
        const blob = await fetch(candidate.photo).then(r => r.blob())
        const file = new File([blob], `${candidate.name || candidate.tag}_main.jpg`, { type: 'image/jpeg' })
        await savePhoto(file, {
          category: 'animals',
          tags: [groupName.toLowerCase(), (candidate.breed || '').toLowerCase(), (candidate.sex || '').toLowerCase()].filter(Boolean),
          entityType: groupName.toLowerCase(),
          entityId: animalId,
          entityName: candidate.name || candidate.tag
        })
      }

      // Sync additional photos array
      if (candidate.photos && Array.isArray(candidate.photos)) {
        for (const photo of candidate.photos) {
          if (photo.dataUrl && photo.dataUrl.startsWith('data:image')) {
            const blob = await fetch(photo.dataUrl).then(r => r.blob())
            const file = new File([blob], photo.filename || `${candidate.name}_${photo.id}.jpg`, { type: 'image/jpeg' })
            await savePhoto(file, {
              category: 'animals',
              tags: [groupName.toLowerCase(), (candidate.breed || '').toLowerCase(), photo.filename].filter(Boolean),
              entityType: groupName.toLowerCase(),
              entityId: animalId,
              entityName: candidate.name || candidate.tag
            })
          }
        }
      }
    } catch (error) {
      console.error('Error syncing photos to gallery:', error)
    }

    resetForm()
    setTab('list')
  }

  function startEditAnimal(a) {
    // Merge animal data with emptyAnimal to ensure all fields have values
    setForm({ ...emptyAnimal, ...a })
    setEditingId(a.id)
    setTab('addAnimal')
  }
  function deleteAnimal(id) { 
    const animal = animals.find(a => a.id === id)
    if (!window.confirm('Delete animal ' + id + '?')) return
    
    setAnimals(animals.filter(a => a.id !== id))
    
    // Delete associated photos from gallery
    try {
      const groupName = groups.find(g => g.id === animal?.groupId)?.name || 'livestock'
      const photos = getPhotosByEntity(groupName.toLowerCase(), id)
      photos.forEach(photo => deletePhoto(photo.id))
    } catch (error) {
      console.error('Error deleting animal photos:', error)
    }
    
    // Log activity
    if (animal) {
      logAnimalActivity('deleted', `Deleted animal: ${animal.name || animal.tag}`, animal)
    }
  }

  function resetGroupForm() {
    setGroupCategory('');
    setCustomGroupName('');
    setGroupDesc('');
    setGroupDateCreated(new Date().toISOString().slice(0,10));
    setGroupDateUpdated('');
    setGroupStartDate('');
    setGroupEndDate('');
    setEditingGroupId(null);
    setTab('addGroup');
  }

  function saveGroup(e) {
    e && e.preventDefault()
    let name = groupCategory !== 'Other' ? groupCategory : customGroupName.trim();
    if (!name) return;
    const now = new Date().toISOString().slice(0,10);
    if (editingGroupId) {
      setGroups(groups.map(g => g.id === editingGroupId ? {
        ...g,
        name,
        desc: groupDesc,
        dateCreated: g.dateCreated || groupDateCreated || now,
        dateUpdated: now,
        startDate: groupStartDate,
        endDate: groupEndDate
      } : g))
    } else {
      const id = 'G-' + (1000 + Math.floor(Math.random() * 900000));
      setGroups([...groups, {
        id,
        name,
        desc: groupDesc,
        dateCreated: groupDateCreated || now,
        dateUpdated: '',
        startDate: groupStartDate,
        endDate: groupEndDate
      }])
    }
    resetGroupForm();
    setTab('list');
  }

  function startEditGroup(g) { setEditingGroupId(g.id); setGroupName(g.name); setGroupDesc(g.desc); setTab('addGroup') }
  function deleteGroup(id) {
    if (!window.confirm('Delete group ' + id + '?')) return
    setGroups(groups.filter(g => g.id !== id))
    setAnimals(animals.map(a => a.groupId === id ? { ...a, groupId: '' } : a))
  }

  // Use debounced filter for better performance with large datasets
  const q = debouncedFilter.trim().toLowerCase()
  
  // Memoize filtering for better performance
  const filtered = useMemo(() => {
    perfMonitor.start('Filter Animals')
    
    const result = scopedAnimals.filter(a => {
      // Text search
      if (q) {
        const groupName = visibleGroups.find(g => g.id === a.groupId)?.name || ''
        const matchesText = (a.id || '').toLowerCase().includes(q) || 
                           (a.tag || '').toLowerCase().includes(q) || 
                           (a.name || '').toLowerCase().includes(q) || 
                           (a.breed || '').toLowerCase().includes(q) || 
                           groupName.toLowerCase().includes(q)
        if (!matchesText) return false
      }
      
      // Group filter
      if (filterGroup !== 'all') {
        if (filterGroup === 'ungrouped' && a.groupId) return false
        if (filterGroup !== 'ungrouped' && a.groupId !== filterGroup) return false
      }
      
      // Status filter
      if (filterStatus !== 'all' && a.status !== filterStatus) return false
      
      // Sex filter
      if (filterSex !== 'all' && a.sex !== filterSex) return false
      
      return true
    })
    
    perfMonitor.end('Filter Animals')
    return result
  }, [debouncedFilter, filterGroup, filterStatus, filterSex, scopedAnimals, visibleGroups])

  // Sort animals
  const sortedAnimals = [...filtered].sort((a, b) => {
    switch(sortBy) {
      case 'name': return (a.name || '').localeCompare(b.name || '')
      case 'tag': return (a.tag || '').localeCompare(b.tag || '')
      case 'breed': return (a.breed || '').localeCompare(b.breed || '')
      case 'dob': return (a.dob || '').localeCompare(b.dob || '')
      case 'weight': return (parseFloat(b.weight) || 0) - (parseFloat(a.weight) || 0)
      case 'status': return (a.status || '').localeCompare(b.status || '')
      default: return 0
    }
  })
  const [expandedIds, setExpandedIds] = useState([])
  const [inlineEditingId, setInlineEditingId] = useState(null)
  const [inlineForm, setInlineForm] = useState(emptyAnimal)
  const [modalOpenId, setModalOpenId] = useState(null)

  function toggleExpand(id){
    // Open modal-like expansive view for a single animal to mimic Farmbrite
    setExpandedIds(prev => {
      const isExpanded = prev.includes(id)
      if (isExpanded) return prev.filter(x => x !== id)
      return [id]
    })
    setModalOpenId(prev => prev === id ? null : id)
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

  // Export functions
  const fileInputRef = useRef(null)

  function handleExportCSV() {
    const exportData = scopedAnimals.map(a => ({
      id: a.id,
      tag: a.tag,
      name: a.name,
      species: a.species,
      breed: a.breed,
      sex: a.sex,
      dob: a.dob,
      age: a.age || '',
      weight: a.weight || '',
      group: a.group || '',
      status: a.status,
      sire: a.sire || '',
      dam: a.dam || '',
      notes: a.notes || ''
    }))
    exportToCSV(exportData, 'animals.csv')
  }

  function handleExportExcel() {
    const exportData = scopedAnimals.map(a => ({
      id: a.id,
      tag: a.tag,
      name: a.name,
      species: a.species,
      breed: a.breed,
      sex: a.sex,
      dob: a.dob,
      age: a.age || '',
      weight: a.weight || '',
      group: a.group || '',
      status: a.status,
      sire: a.sire || '',
      dam: a.dam || '',
      notes: a.notes || ''
    }))
    exportToExcel(exportData, 'animals_export.csv')
  }

  function handleExportJSON() {
    exportToJSON(scopedAnimals, 'animals.json')
  }

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
        if (confirm(`Import ${data.length} animals? This will merge with existing data.`)) {
          const imported = data.map(a => ({
            ...a,
            id: a.id || uid()
          }))
          setAnimals([...animals, ...imported])
          alert(`Imported ${imported.length} animals`)
        }
      })
    } else if (ext === 'csv') {
      importFromCSV(file, (data, error) => {
        if (error) {
          alert('Import failed: ' + error.message)
          return
        }
        if (confirm(`Import ${data.length} animals? This will merge with existing data.`)) {
          const imported = data.map(a => ({
            id: a.id || uid(),
            tag: a.tag || '',
            name: a.name || '',
            species: a.species || '',
            breed: a.breed || '',
            sex: a.sex || '',
            dob: a.dob || '',
            age: a.age || '',
            weight: a.weight ? Number(a.weight) : 0,
            group: a.group || '',
            status: a.status || 'active',
            sire: a.sire || '',
            dam: a.dam || '',
            notes: a.notes || ''
          }))
          setAnimals([...animals, ...imported])
          alert(`Imported ${imported.length} animals`)
        }
      })
    } else {
      alert('Unsupported file type. Use CSV or JSON.')
    }

    e.target.value = '' // Reset input
  }

  // Dev helper: print or download first N animals for debugging
  function devDumpAnimals(n = 20) {
    try {
      const raw = localStorage.getItem(AKEY) || localStorage.getItem('devinsfarm:animals') || '[]'
      const list = JSON.parse(raw || '[]')
      console.log('DEV DUMP animals (first', n, ')', list.slice(0, n))
      // also trigger download for convenience
      try {
        exportToJSON(list.slice(0, n), `animals_dump_${n}.json`)
      } catch (e) {
        console.warn('Export failed', e)
      }
      alert(`Logged and downloaded first ${Math.min(n, list.length)} animals to console/download.`)
    } catch (err) {
      console.error('Dev dump failed', err)
      alert('Failed to dump animals: ' + (err.message || err))
    }
  }

  function handleBatchPrint() {
    const filtered = sortedAnimals
    if (filtered.length === 0) {
      alert('No animals to print')
      return
    }

    batchPrint(filtered, (animal) => `
      <div style="padding: 20px; border: 2px solid #000; margin-bottom: 20px;">
        <h2 style="margin-top: 0;">Animal Record: ${animal.tag || animal.name}</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><th style="text-align: left; width: 150px;">Tag:</th><td>${animal.tag || 'N/A'}</td></tr>
          <tr><th style="text-align: left;">Name:</th><td>${animal.name}</td></tr>
          <tr><th style="text-align: left;">Species:</th><td>${animal.species}</td></tr>
          <tr><th style="text-align: left;">Breed:</th><td>${animal.breed || 'N/A'}</td></tr>
          <tr><th style="text-align: left;">Sex:</th><td>${animal.sex}</td></tr>
          <tr><th style="text-align: left;">Date of Birth:</th><td>${animal.dob || 'N/A'}</td></tr>
          <tr><th style="text-align: left;">Age:</th><td>${animal.age || 'N/A'}</td></tr>
          <tr><th style="text-align: left;">Weight:</th><td>${animal.weight ? animal.weight + ' kg' : 'N/A'}</td></tr>
          <tr><th style="text-align: left;">Group:</th><td>${animal.group || 'N/A'}</td></tr>
          <tr><th style="text-align: left;">Status:</th><td>${animal.status}</td></tr>
          <tr><th style="text-align: left;">Sire:</th><td>${animal.sire || 'N/A'}</td></tr>
          <tr><th style="text-align: left;">Dam:</th><td>${animal.dam || 'N/A'}</td></tr>
          <tr><th style="text-align: left;">Notes:</th><td>${animal.notes || 'N/A'}</td></tr>
        </table>
      </div>
    `, 'Animal Records')
  }

  // Download single animal full record (JSON/CSV/Excel)
  function getFlattenedAnimal(a) {
    const groupName = visibleGroups.find(g => g.id === a.groupId)?.name || ''
    return {
      id: a.id || '',
      tag: a.tag || '',
      name: a.name || '',
      breed: a.breed || '',
      sex: a.sex || '',
      dob: a.dob || '',
      weight: a.weight || '',
      owner: a.owner || '',
      registration: a.registration || '',
      tattoo: a.tattoo || '',
      purchaseDate: a.purchaseDate || '',
      purchasePrice: a.purchasePrice || '',
      vendor: a.vendor || '',
      group: groupName,
      status: a.status || '',
      notes: a.notes || '',
      photosCount: (a.photos || []).length || 0,
      production: JSON.stringify(a.production || {}),
      genetics: JSON.stringify(a.genetics || {}),
      health: JSON.stringify(a.health || {}),
      financial: JSON.stringify(a.financial || {}),
      documentation: JSON.stringify(a.documentation || {}),
      certifications: JSON.stringify(a.certifications || {}),
      behavior: JSON.stringify(a.behavior || {}),
      location: JSON.stringify(a.location || {}),
      events: JSON.stringify(a.events || [])
    }
  }

  function handleDownloadAnimalJSON(a) {
    exportToJSON(a, `${(a.tag||a.id||'animal')}_record.json`)
  }

  function handleDownloadAnimalCSV(a) {
    // Download the animal CV (HTML) instead of a flattened CSV so the user
    // receives the full CV record. Save as .html which can be opened in browser
    // or imported into Excel if needed.
    exportAnimalCVAsFile(a, `${(a.tag||a.id||'animal')}_cv.html`)
  }

  function handleDownloadAnimalExcel(a) {
    // For Excel requests, also provide the CV HTML (Excel can open HTML files).
    exportAnimalCVAsFile(a, `${(a.tag||a.id||'animal')}_cv.html`)
  }

  function exportAnimalCVAsFile(a, filename = 'animal_cv.html') {
    try {
      const groupName = visibleGroups.find(g => g.id === a.groupId)?.name || ''
      const title = `${a.name || a.tag || a.id} — Animal CV`

      const photoHtml = (a.photos && a.photos.length)
        ? `<img src="${a.photos[0].dataUrl}" alt="${escapeHtml(a.name||'photo')}" style="width:240px;height:200px;object-fit:cover;border-radius:8px;"/>`
        : (a.photo ? `<img src="${a.photo}" alt="${escapeHtml(a.name||'photo')}" style="width:240px;height:200px;object-fit:cover;border-radius:8px;"/>` : `<div style="width:240px;height:200px;background:#f3f4f6;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#9ca3af;">No photo</div>`)

      const sections = [
        { title: 'Basic Information', content: {
          Tag: a.tag || '', Name: a.name || '', Breed: a.breed || '', Sex: a.sex || '', DOB: a.dob || '', Weight: a.weight || '', Color: a.color || '', Group: groupName || '', Owner: a.owner || '', Registration: a.registration || '', Tattoo: a.tattoo || '', Notes: a.notes || ''
        }},
        { title: 'Production', content: a.production || {} },
        { title: 'Health', content: a.health || {} },
        { title: 'Genetics', content: a.genetics || {} },
        { title: 'Financial', content: a.financial || {} },
        { title: 'Location', content: a.location || {} },
        { title: 'Behavior', content: a.behavior || {} },
        { title: 'Documentation', content: a.documentation || {} },
        { title: 'Events', content: a.events || [] }
      ]

      const sectionHtml = sections.map(s => `
        <section style="margin-bottom:18px">
          <h3 style="margin:6px 0;color:#111827">${escapeHtml(s.title)}</h3>
          <pre style="background:#f9fafb;padding:10px;border-radius:6px;overflow:auto">${escapeHtml(JSON.stringify(s.content, null, 2))}</pre>
        </section>
      `).join('\n')

      const html = `<!doctype html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(title)}</title>
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <style>
          body{font-family:Arial,Helvetica,sans-serif;color:#111827;padding:20px}
          .header{display:flex;gap:16px;align-items:center}
          h1{margin:0}
          h2{margin:4px 0;color:#6b7280}
        </style>
      </head>
      <body>
        <div class="header">
          <div>${photoHtml}</div>
          <div>
            <h1>${escapeHtml(a.name || a.tag || a.id)}</h1>
            <h2>${escapeHtml(a.tag || '')} • ${escapeHtml(a.breed || '')} • ${escapeHtml(a.sex || '')}</h2>
            <div style="margin-top:10px"><strong>Group:</strong> ${escapeHtml(groupName || '—')}</div>
            <div style="margin-top:6px"><strong>Status:</strong> ${escapeHtml(a.status || '—')}</div>
          </div>
        </div>
        <hr style="margin:18px 0" />
        ${sectionHtml}
      </body>
      </html>`

      const blob = new Blob([html], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Export CV failed', err)
      alert('Failed to export CV: ' + (err.message || err))
    }
  }

  function escapeHtml(text) {
    if (text === null || text === undefined) return ''
    return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  }

  // Render nested sections in expanded view with headings/subheadings
  function renderSection(title, obj) {
    if (obj === null || obj === undefined) return null
    const isEmptyArray = Array.isArray(obj) && obj.length === 0
    const isEmptyObject = typeof obj === 'object' && !Array.isArray(obj) && Object.keys(obj).length === 0
    if (isEmptyArray || isEmptyObject) return null

    function renderValue(val) {
      if (val === null || val === undefined || val === '') return <span style={{ color: '#4b5563' }}>—</span>
      if (Array.isArray(val)) {
        if (val.length === 0) return <span style={{ color: '#4b5563' }}>None</span>
        return (
          <ul style={{ margin: '6px 0 0 18px', padding: 0 }}>
            {val.map((it, i) => (
              <li key={i} style={{ marginBottom: 6 }}>{typeof it === 'object' ? <pre style={{ margin: 0 }}>{JSON.stringify(it, null, 2)}</pre> : String(it)}</li>
            ))}
          </ul>
        )
      }
      if (typeof val === 'object') {
        return (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8 }}>
            {Object.entries(val).map(([k, v]) => (
              <div key={k} style={{ background: '#fff', padding: 8, borderRadius: 6, border: '1px solid #eef2f7' }}>
                <div style={{ fontSize: '0.85rem', color: '#374151' }}><strong>{k}</strong></div>
                <div style={{ marginTop: 6, fontSize: '0.85rem', color: '#374151' }}>{typeof v === 'object' ? <pre style={{ margin: 0 }}>{JSON.stringify(v, null, 2)}</pre> : String(v ?? '—')}</div>
              </div>
            ))}
          </div>
        )
      }
      return <span style={{ color: '#111827' }}>{String(val)}</span>
    }

    // Top-level rendering
    return (
      <div style={{ marginTop: 12 }}>
        <h4 style={{ margin: '6px 0', color: '#111827' }}>{title}</h4>
        {typeof obj === 'object' && !Array.isArray(obj) ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            {Object.entries(obj).map(([k, v]) => (
              <div key={k} style={{ background: '#f9fafb', padding: 10, borderRadius: 6, border: '1px solid #eef2f7' }}>
                <div style={{ fontSize: '0.9rem', color: '#374151' }}><strong>{k}</strong></div>
                <div style={{ marginTop: 8 }}>{renderValue(v)}</div>
              </div>
            ))}
          </div>
        ) : (
          renderValue(obj)
        )}
      </div>
    )
  }

  // Responsive styles for mobile
  const mobileStyle = {
    '@media (max-width: 600px)': {
      section: { padding: '8px' },
      card: { padding: '12px', fontSize: '15px' },
      tabNav: { fontSize: '16px', minWidth: '120px' },
      tabBtn: { fontSize: '15px', padding: '14px 10px' },
      grid: { gridTemplateColumns: '1fr', gap: '12px' },
      animalList: { flexDirection: 'column' },
      animalCard: { flexDirection: 'column', alignItems: 'center' },
      img: { width: '100%', height: 'auto', maxWidth: '180px' },
    }
  }

  return (
    <section style={{ padding: '16px', ...mobileStyle.section }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '8px', color: 'inherit' }}>🐄 Livestock Management</h2>
        <p style={{ color: 'var(--muted)', margin: 0 }}>Comprehensive livestock tracking and management system</p>
        {recordSource?.domain && recordSource?.item && (
          <div style={{ marginTop: '10px', fontSize: '12px', fontWeight: 700, color: '#065f46', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '999px', display: 'inline-flex', padding: '4px 10px' }}>
            Opened from Record Coverage: {recordSource.domain} / {recordSource.item}
          </div>
        )}
      </div>

      {/* Statistics Cards - stack vertically on mobile */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px', ...(window.innerWidth <= 600 ? { gridTemplateColumns: '1fr', gap: '12px' } : {}) }}>
        <div className="card" style={{ padding: '16px', textAlign: 'center', ...mobileStyle.card }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--green)' }}>{scopedAnimals.length}</div>
          <div style={{ fontSize: '14px', color: 'var(--muted)' }}>Total Animals</div>
        </div>
        <div className="card" style={{ padding: '16px', textAlign: 'center', ...mobileStyle.card }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#3b82f6' }}>{scopedAnimals.filter(a => a.status === 'Active').length}</div>
          <div style={{ fontSize: '14px', color: 'var(--muted)' }}>Active</div>
        </div>
        <div className="card" style={{ padding: '16px', textAlign: 'center', ...mobileStyle.card }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#ec4899' }}>{scopedAnimals.filter(a => a.sex === 'F').length}</div>
          <div style={{ fontSize: '14px', color: 'var(--muted)' }}>Female</div>
        </div>
        <div className="card" style={{ padding: '16px', textAlign: 'center', ...mobileStyle.card }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#4b5563' }}>{visibleGroups.length}</div>
          <div style={{ fontSize: '14px', color: 'var(--muted)' }}>Groups</div>
        </div>
      </div>

      {/* Tab Navigation - scrollable, larger touch targets on mobile */}
      <div style={{ borderBottom: '2px solid #e5e7eb', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'nowrap', overflowX: 'auto', scrollbarWidth: 'thin', WebkitOverflowScrolling: 'touch' }}>
          {isDairySection && (
            <button
              onClick={() => setTab('addGroup')}
              style={{
                padding: window.innerWidth <= 600 ? '14px 10px' : '12px 20px',
                minWidth: window.innerWidth <= 600 ? '120px' : 'auto',
                border: 'none',
                borderBottom: tab === 'addGroup' ? '3px solid var(--green)' : '3px solid transparent',
                background: tab === 'addGroup' ? '#f0fdf4' : 'transparent',
                color: tab === 'addGroup' ? 'var(--green)' : '#6b7280',
                fontWeight: tab === 'addGroup' ? '600' : '400',
                cursor: 'pointer',
                fontSize: window.innerWidth <= 600 ? '15px' : '14px'
              }}
            >
              🥛 Dairy Groups
            </button>
          )}
          <button
            onClick={() => setTab('list')}
            style={{
              padding: window.innerWidth <= 600 ? '14px 10px' : '12px 20px',
              minWidth: window.innerWidth <= 600 ? '120px' : 'auto',
              border: 'none',
              borderBottom: tab === 'list' ? '3px solid var(--green)' : '3px solid transparent',
              background: tab === 'list' ? '#f0fdf4' : 'transparent',
              color: tab === 'list' ? 'var(--green)' : '#6b7280',
              fontWeight: tab === 'list' ? '600' : '400',
              cursor: 'pointer',
              fontSize: window.innerWidth <= 600 ? '15px' : '14px'
            }}
          >
            📋 Animal List
          </button>
          {!isDairySection && (
            <button
              onClick={() => { resetGroupForm(); setTab('addGroup') }}
              style={{
                padding: window.innerWidth <= 600 ? '14px 10px' : '12px 20px',
                minWidth: window.innerWidth <= 600 ? '120px' : 'auto',
                border: 'none',
                borderBottom: tab === 'addGroup' ? '3px solid var(--green)' : '3px solid transparent',
                background: tab === 'addGroup' ? '#f0fdf4' : 'transparent',
                color: tab === 'addGroup' ? 'var(--green)' : '#6b7280',
                fontWeight: tab === 'addGroup' ? '600' : '400',
                cursor: 'pointer',
                fontSize: window.innerWidth <= 600 ? '15px' : '14px'
              }}
            >
              👥 Groups
            </button>
          )}
          <button
            onClick={() => setTab('feeding')}
            style={{
              padding: '12px 20px',
              border: 'none',
              borderBottom: tab === 'feeding' ? '3px solid var(--green)' : '3px solid transparent',
              background: tab === 'feeding' ? '#f0fdf4' : 'transparent',
              color: tab === 'feeding' ? 'var(--green)' : '#6b7280',
              fontWeight: tab === 'feeding' ? '600' : '400',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🌾 Feeding
          </button>
          <button
            onClick={() => setTab('health')}
            style={{
              padding: '12px 20px',
              border: 'none',
              borderBottom: tab === 'health' ? '3px solid var(--green)' : '3px solid transparent',
              background: tab === 'health' ? '#f0fdf4' : 'transparent',
              color: tab === 'health' ? 'var(--green)' : '#6b7280',
              fontWeight: tab === 'health' ? '600' : '400',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🏥 Health System
          </button>
          <button
            onClick={() => setTab('treatment')}
            style={{
              padding: '12px 20px',
              border: 'none',
              borderBottom: tab === 'treatment' ? '3px solid var(--green)' : '3px solid transparent',
              background: tab === 'treatment' ? '#f0fdf4' : 'transparent',
              color: tab === 'treatment' ? 'var(--green)' : '#6b7280',
              fontWeight: tab === 'treatment' ? '600' : '400',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            💊 Treatment
          </button>
          <button
            onClick={() => setTab('breeding')}
            style={{
              padding: '12px 20px',
              border: 'none',
              borderBottom: tab === 'breeding' ? '3px solid var(--green)' : '3px solid transparent',
              background: tab === 'breeding' ? '#f0fdf4' : 'transparent',
              color: tab === 'breeding' ? 'var(--green)' : '#6b7280',
              fontWeight: tab === 'breeding' ? '600' : '400',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🤰 Breeding
          </button>
          <button
            onClick={() => setTab('milkyield')}
            style={{
              padding: '12px 20px',
              border: 'none',
              borderBottom: tab === 'milkyield' ? '3px solid var(--green)' : '3px solid transparent',
              background: tab === 'milkyield' ? '#f0fdf4' : 'transparent',
              color: tab === 'milkyield' ? 'var(--green)' : '#6b7280',
              fontWeight: tab === 'milkyield' ? '600' : '400',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🥛 Milk Yield
          </button>
          <button
            onClick={() => setTab('measurement')}
            style={{
              padding: '12px 20px',
              border: 'none',
              borderBottom: tab === 'measurement' ? '3px solid var(--green)' : '3px solid transparent',
              background: tab === 'measurement' ? '#f0fdf4' : 'transparent',
              color: tab === 'measurement' ? 'var(--green)' : '#6b7280',
              fontWeight: tab === 'measurement' ? '600' : '400',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            📏 Measurement
          </button>
          <button
            onClick={() => setTab('calf')}
            style={{
              padding: '12px 20px',
              border: 'none',
              borderBottom: tab === 'calf' ? '3px solid var(--green)' : '3px solid transparent',
              background: tab === 'calf' ? '#f0fdf4' : 'transparent',
              color: tab === 'calf' ? 'var(--green)' : '#6b7280',
              fontWeight: tab === 'calf' ? '600' : '400',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🐮 Calf Mgmt
          </button>
          <button
            onClick={() => setTab('pastures')}
            style={{
              padding: '12px 20px',
              border: 'none',
              borderBottom: tab === 'pastures' ? '3px solid var(--green)' : '3px solid transparent',
              background: tab === 'pastures' ? '#f0fdf4' : 'transparent',
              color: tab === 'pastures' ? 'var(--green)' : '#6b7280',
              fontWeight: tab === 'pastures' ? '600' : '400',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🌱 Pastures
          </button>
          {!isDairySection && (
            <button
              onClick={() => setTab('bsf')}
              style={{
                padding: '12px 20px',
                border: 'none',
                borderBottom: tab === 'bsf' ? '3px solid var(--green)' : '3px solid transparent',
                background: tab === 'bsf' ? '#f0fdf4' : 'transparent',
                color: tab === 'bsf' ? 'var(--green)' : '#6b7280',
                fontWeight: tab === 'bsf' ? '600' : '400',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              🪰 BSF Farm
            </button>
          )}
          <button
            onClick={() => setTab('azolla')}
            style={{
              padding: '12px 20px',
              border: 'none',
              borderBottom: tab === 'azolla' ? '3px solid var(--green)' : '3px solid transparent',
              background: tab === 'azolla' ? '#f0fdf4' : 'transparent',
              color: tab === 'azolla' ? 'var(--green)' : '#6b7280',
              fontWeight: tab === 'azolla' ? '600' : '400',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🌿 Azolla
          </button>
          {!isDairySection && (
            <>
              <button
                onClick={() => setTab('poultry')}
                style={{
                  padding: '12px 20px',
                  border: 'none',
                  borderBottom: tab === 'poultry' ? '3px solid var(--green)' : '3px solid transparent',
                  background: tab === 'poultry' ? '#f0fdf4' : 'transparent',
                  color: tab === 'poultry' ? 'var(--green)' : '#6b7280',
                  fontWeight: tab === 'poultry' ? '600' : '400',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                🐔 Poultry
              </button>
              <button
                onClick={() => setTab('canine')}
                style={{
                  padding: '12px 20px',
                  border: 'none',
                  borderBottom: tab === 'canine' ? '3px solid var(--green)' : '3px solid transparent',
                  background: tab === 'canine' ? '#f0fdf4' : 'transparent',
                  color: tab === 'canine' ? 'var(--green)' : '#6b7280',
                  fontWeight: tab === 'canine' ? '600' : '400',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                🐕 Canines
              </button>
              <button
                onClick={() => { resetGroupForm(); setTab('addGroup') }}
                style={{
                  padding: '12px 20px',
                  border: 'none',
                  borderBottom: tab === 'addGroup' ? '3px solid var(--green)' : '3px solid transparent',
                  background: tab === 'addGroup' ? '#f0fdf4' : 'transparent',
                  color: tab === 'addGroup' ? 'var(--green)' : '#6b7280',
                  fontWeight: tab === 'addGroup' ? '600' : '400',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                👥 Groups
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tab Content */}
      {tab === 'list' && (
        <div>
          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: window.innerWidth <= 600 ? 'wrap' : 'nowrap', alignItems: 'center' }}>
            <button 
              onClick={() => { resetForm(); setTab('addAnimal') }}
              style={{ 
                background: 'var(--green)', 
                color: '#fff', 
                padding: '10px 20px', 
                border: 'none', 
                borderRadius: '6px', 
                cursor: 'pointer', 
                fontWeight: '600',
                fontSize: '14px'
              }}
            >
              ➕ Add Animal
            </button>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button onClick={handleExportCSV} style={{ padding: '8px 16px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>📊 CSV</button>
              <button onClick={handleExportExcel} style={{ padding: '8px 16px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>📈 Excel</button>
              <button onClick={handleExportJSON} style={{ padding: '8px 16px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>📄 JSON</button>
              <button onClick={() => devDumpAnimals(20)} style={{ padding: '8px 16px', background: '#111827', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>DEV: Dump 20</button>
              <button onClick={handleImportClick} style={{ padding: '8px 16px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>📥 Import</button>
              <button onClick={handleBatchPrint} style={{ padding: '8px 16px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>🖨️ Print</button>
              <button onClick={() => batchPrintQRTags(sortedAnimals, 'animal')} style={{ padding: '8px 16px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}>📱 Print QR Tags</button>
              <input 
                ref={fileInputRef}
                type="file" 
                accept=".csv,.json" 
                style={{ display: 'none' }} 
                onChange={handleImportFile}
              />
            </div>
          </div>

          {/* Filters */}
          <div className="card" style={{ marginBottom: '20px', padding: '16px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="🔍 Search animals..."
                value={filter}
                onChange={e => setFilter(e.target.value)}
                style={{ flex: '1 1 200px', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db' }}
              />
              <select
                value={filterGroup}
                onChange={e => setFilterGroup(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db' }}
              >
                <option value="all">All Groups</option>
                <option value="ungrouped">Ungrouped</option>
                {visibleGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db' }}
              >
                <option value="all">All Status</option>
                <option value="Active">Active</option>
                <option value="Sold">Sold</option>
                <option value="Deceased">Deceased</option>
              </select>
              <select
                value={filterSex}
                onChange={e => setFilterSex(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db' }}
              >
                <option value="all">All</option>
                <option value="F">Female</option>
                <option value="M">Male</option>
              </select>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db' }}
              >
                <option value="name">Sort by Name</option>
                <option value="tag">Sort by Tag</option>
                <option value="breed">Sort by Breed</option>
                <option value="dob">Sort by DOB</option>
                <option value="weight">Sort by Weight</option>
                <option value="status">Sort by Status</option>
              </select>
            </div>
          </div>

          {/* Animal List - stack vertically, collapsible details on mobile */}
          <h3 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '16px', color: 'inherit' }}>Animals ({sortedAnimals.length})</h3>
          
          {/* Use VirtualizedList for better performance with large herds */}
          <VirtualizedList
            items={sortedAnimals}
            itemHeight={expandedIds.length > 0 ? 600 : 150}
            height={Math.min(600, sortedAnimals.length * 150)}
            renderItem={(a, index) => {
              const isExp = expandedIds.includes(a.id)
              const preview = (a.photos && a.photos.length) ? a.photos[0].dataUrl : (a.photo || null)
              const groupName = visibleGroups.find(g => g.id === a.groupId)?.name || 'No group'
              return (
                <div className="card" style={{ marginBottom: 12, padding: 16, ...(window.innerWidth <= 600 ? { padding: '12px' } : {}) }}>
                  <div style={{ display: 'flex', gap: 16, alignItems: window.innerWidth <= 600 ? 'center' : 'flex-start', flexDirection: window.innerWidth <= 600 ? 'column' : 'row' }}>
                    {preview && (
                      <img src={preview} alt={a.name} style={{ width: window.innerWidth <= 600 ? '100%' : 80, height: window.innerWidth <= 600 ? 'auto' : 80, objectFit: 'cover', borderRadius: 8, flexShrink: 0, maxWidth: window.innerWidth <= 600 ? '180px' : undefined }} />
                    )}
                    <div style={{ flex: 1, width: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600' }}>
                            {a.name}
                            {a.qrCode && <span style={{ marginLeft: 8, fontSize: '0.8rem', color: '#8b5cf6' }} title="QR Code generated">📱</span>}
                          </h4>
                          <div style={{ fontSize: '0.9rem', color: '#4b5563', marginTop: 4 }}>
                            {a.tag && <span style={{ marginRight: 12 }}>🏷️ {a.tag}</span>}
                            <span style={{ marginRight: 12 }}>{a.sex === 'F' ? '♀' : '♂'} {a.breed}</span>
                            <span>📊 {a.status}</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => startInlineEdit(a)} style={{ padding: '6px 12px', fontSize: '0.85rem', background: '#ffffcc', border: '1px solid #ffdd00', color: '#333', fontWeight: '500' }}>⚡ Quick</button>
                          <button onClick={() => startEditAnimal(a)} style={{ padding: '6px 12px', fontSize: '0.85rem' }}>✏️ Edit</button>
                          <button onClick={() => deleteAnimal(a.id)} style={{ padding: '6px 12px', fontSize: '0.85rem', background: '#fee', color: '#c00' }}>🗑️</button>
                        </div>
                      </div>
                      
                      {/* Inline Quick Edit */}
                      {inlineEditingId === a.id && (
                        <div style={{ marginTop: 12, padding: 12, background: '#fff7ed', borderRadius: 8, border: '1px solid #fde68a' }}>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                            <input placeholder="Name" value={inlineForm.name || ''} onChange={e => handleInlineChange('name', e.target.value)} style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #e5e7eb' }} />
                            <input placeholder="Tag" value={inlineForm.tag || ''} onChange={e => handleInlineChange('tag', e.target.value)} style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #e5e7eb' }} />
                            <input placeholder="Weight (kg)" value={inlineForm.weight || ''} onChange={e => handleInlineChange('weight', e.target.value)} style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #e5e7eb', width: 120 }} />
                            <select value={inlineForm.groupId || ''} onChange={e => handleInlineChange('groupId', e.target.value)} style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #e5e7eb' }}>
                              <option value="">-- No group --</option>
                              {groupOptionsForForm.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                            </select>
                            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                              <button onClick={saveInlineEdit} style={{ padding: '8px 12px', background: 'var(--green)', color: '#fff', border: 'none', borderRadius: 6 }}>Save</button>
                              <button onClick={cancelInlineEdit} style={{ padding: '8px 12px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: 6 }}>Cancel</button>
                            </div>
                          </div>
                        </div>
                      )}

                      {isExp && (
                        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #e5e7eb', fontSize: '0.9rem' }}>
                          {/* Weight Trend Chart */}
                          <div style={{ marginBottom: 16 }}>
                            <LineChart
                              data={(a.weightHistory || [
                                { date: '2025-01-01', value: a.weight ? a.weight - 10 : 0 },
                                { date: '2025-02-01', value: a.weight ? a.weight - 5 : 0 },
                                { date: '2025-03-01', value: a.weight || 0 }
                              ]).map(w => ({ label: w.date, value: w.value }))}
                              width={350}
                              height={120}
                              title="Weight Trend"
                              xLabel="Date"
                              yLabel="Weight (kg)"
                              color="#3b82f6"
                            />
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                            {a.dob && <div><strong>DOB:</strong> {a.dob}</div>}
                            {a.weight && <div><strong>Weight:</strong> {a.weight} kg</div>}
                            {a.color && <div><strong>Color:</strong> {a.color}</div>}
                            {groupName && <div><strong>Group:</strong> {groupName}</div>}
                            {a.sire && <div><strong>Sire:</strong> {a.sire}</div>}
                            {a.dam && <div><strong>Dam:</strong> {a.dam}</div>}
                            {a.owner && <div><strong>Owner:</strong> {a.owner}</div>}
                            {a.registration && <div><strong>Registration:</strong> {a.registration}</div>}
                            {a.tattoo && <div><strong>Tattoo:</strong> {a.tattoo}</div>}
                            {a.purchaseDate && <div><strong>Purchase Date:</strong> {a.purchaseDate}</div>}
                            {a.purchasePrice && <div><strong>Purchase Price:</strong> KSH {Number(a.purchasePrice).toLocaleString()}</div>}
                            {a.vendor && <div><strong>Vendor:</strong> {a.vendor}</div>}
                            {a.pregnancyStatus && a.pregnancyStatus !== 'Not Pregnant' && (
                              <div><strong>Pregnancy:</strong> {a.pregnancyStatus}</div>
                            )}
                            {a.expectedDue && <div><strong>Expected Due:</strong> {a.expectedDue}</div>}
                            {a.parity > 0 && <div><strong>Parity:</strong> {a.parity}</div>}
                            {a.lactationStatus && <div><strong>Lactation:</strong> {a.lactationStatus}</div>}
                          </div>
                          {a.notes && (
                            <div style={{ marginTop: 12, padding: 12, background: '#f9fafb', borderRadius: 6 }}>
                              <strong>Notes:</strong> {a.notes}
                            </div>
                          )}
                          {a.photos && a.photos.length > 1 && (
                            <div style={{ marginTop: 12 }}>
                              <strong>Photos:</strong>
                              <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                                {a.photos.map((p, idx) => (
                                  <img key={p.id || idx} src={p.dataUrl} alt={`${a.name} ${idx+1}`} style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 6 }} />
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Photo Gallery with IndexedDB storage */}
                          <PhotoGallery 
                            entityType="animal" 
                            entityId={a.id} 
                            entityName={a.name}
                          />
                          
                          {/* QR Code Display and Print */}
                          <div style={{ marginTop: 16, padding: 12, background: '#f9fafb', borderRadius: 8, border: '1px solid #e5e7eb' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                              <div>
                                <img 
                                  src={a.qrCode || generateQRCodeDataURL(JSON.stringify({ type: 'animal', id: a.id, name: a.name, tag: a.tag, breed: a.breed }))} 
                                  alt={`QR Code for ${a.name}`}
                                  style={{ width: 120, height: 120, border: '2px solid #8b5cf6', borderRadius: 8 }}
                                />
                              </div>
                              <div style={{ flex: 1 }}>
                                <h4 style={{ margin: '0 0 8px 0', fontSize: '0.95rem', fontWeight: '600', color: '#8b5cf6' }}>
                                  📱 QR Tag {a.qrCode && <span style={{ fontSize: '0.75rem', color: '#10b981', marginLeft: 8 }}>✓ Auto-generated</span>}
                                </h4>
                                <p style={{ margin: '0 0 12px 0', fontSize: '0.85rem', color: '#4b5563' }}>
                                  Scan this QR code to quickly access {a.name}'s records
                                </p>
                                <button 
                                  onClick={() => printQRTag({ type: 'animal', id: a.id, name: a.name, tag: a.tag })}
                                  style={{ 
                                    padding: '8px 16px', 
                                    background: '#8b5cf6', 
                                    color: 'white', 
                                    border: 'none', 
                                    borderRadius: '6px', 
                                    cursor: 'pointer', 
                                    fontSize: '0.85rem',
                                    fontWeight: '500'
                                  }}
                                >
                                  🖨️ Print QR Tag
                                </button>
                                <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                  <button onClick={() => handleDownloadAnimalJSON(a)} style={{ padding: '8px 12px', background: '#111827', color: 'white', border: 'none', borderRadius: 6, fontSize: '0.85rem' }}>⬇️ JSON</button>
                                  <button onClick={() => handleDownloadAnimalCSV(a)} style={{ padding: '8px 12px', background: '#059669', color: 'white', border: 'none', borderRadius: 6, fontSize: '0.85rem' }}>⬇️ CSV</button>
                                  <button onClick={() => handleDownloadAnimalExcel(a)} style={{ padding: '8px 12px', background: '#0ea5e9', color: 'white', border: 'none', borderRadius: 6, fontSize: '0.85rem' }}>⬇️ Excel</button>
                                </div>
                              </div>
                            </div>
                          </div>
                          {renderSection('Production', a.production)}
                          {renderSection('Health', a.health)}
                          {renderSection('Genetics', a.genetics)}
                          {renderSection('Financial', a.financial)}
                          {renderSection('Documentation', a.documentation)}
                          {renderSection('Behavior', a.behavior)}
                          {renderSection('Location', a.location)}
                          {renderSection('Events', a.events)}
                        </div>
                      )}
                      
                      <button 
                        onClick={() => toggleExpand(a.id)}
                        style={{ marginTop: 12, padding: window.innerWidth <= 600 ? '10px 16px' : '6px 12px', fontSize: window.innerWidth <= 600 ? '1rem' : '0.85rem', background: '#f3f4f6', border: '1px solid #d1d5db', width: window.innerWidth <= 600 ? '100%' : 'auto' }}
                      >
                        {isExp ? '▲ Show Less' : '▼ Show More'}
                      </button>
                    </div>
                  </div>
                </div>
              )
            }}
          />
        </div>
      )}

      {/* Modal full CV view for selected animal */}
      {modalOpenId && (() => {
        const animal = scopedAnimals.find(x => x.id === modalOpenId)
        if (!animal) return null
        return (
          <AnimalCV
            animal={animal}
            groups={visibleGroups}
            onClose={() => setModalOpenId(null)}
            onDownloadJSON={() => handleDownloadAnimalJSON(animal)}
            onDownloadCSV={() => handleDownloadAnimalCSV(animal)}
            onDownloadExcel={() => handleDownloadAnimalExcel(animal)}
          />
        )
      })()}

      {/* Add/Edit Animal Form - single column on mobile */}
      {tab === 'addAnimal' && (
        <div>
          <h3 style={{ fontSize: '1.3rem', fontWeight: '600', marginBottom: '20px', color: 'inherit' }}>
            {editingId ? '✏️ Edit Animal [v2.0]' : '➕ Add New Animal [v2.0]'}
          </h3>
          
          {/* Form Section Tabs */}
          <div style={{ borderBottom: '2px solid #e5e7eb', marginBottom: '20px' }}>
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {[
                { id: 'basic', label: '📋 Basic Info', icon: '📋' },
                { id: 'production', label: '📊 Production', icon: '📊' },
                { id: 'genetics', label: '🧬 Genetics', icon: '🧬' },
                { id: 'health', label: '🏥 Health', icon: '🏥' },
                { id: 'financial', label: '💰 Financial', icon: '💰' },
                { id: 'location', label: '📍 Location', icon: '📍' },
                { id: 'behavior', label: '🎭 Behavior', icon: '🎭' },
                { id: 'documentation', label: '📄 Docs', icon: '📄' }
              ].map(section => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setFormTab(section.id)}
                  style={{
                    padding: '10px 16px',
                    border: 'none',
                    borderBottom: formTab === section.id ? '3px solid var(--green)' : '3px solid transparent',
                    background: formTab === section.id ? '#f0fdf4' : 'transparent',
                    color: formTab === section.id ? 'var(--green)' : '#6b7280',
                    fontWeight: formTab === section.id ? '600' : '400',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  {section.label}
                </button>
              ))}
            </div>
          </div>
          
          <form onSubmit={saveAnimal} style={{ marginBottom: 16 }} noValidate>
            
            {/* BASIC INFO TAB */}
            {formTab === 'basic' && (
            <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth <= 600 ? '1fr' : '1fr 1fr', gap: window.innerWidth <= 600 ? 12 : 8 }}>
              <label>
                Tag
                <input id="animal-tag" name="tag" value={form.tag} onChange={e => setForm({ ...form, tag: e.target.value })} />
                {errors.tag && <div style={{ color: 'crimson' }}>{errors.tag}</div>}
              </label>

              <label>
                Name *
                <input id="animal-name" name="name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                {errors.name && <div style={{ color: 'crimson' }}>{errors.name}</div>}
              </label>

              <label>
                Breed
                <input id="animal-breed" name="breed" value={form.breed} onChange={e => setForm({ ...form, breed: e.target.value })} />
              </label>

              <label>
                Color
                <input id="animal-color" name="color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} />
              </label>

              <label>
                DOB
                <input id="animal-dob" name="dob" type="date" value={form.dob} onChange={e => setForm({ ...form, dob: e.target.value })} />
                {errors.dob && <div style={{ color: 'crimson' }}>{errors.dob}</div>}
              </label>

              <label>
                Weight (kg)
                <input id="animal-weight" name="weight" type="number" step="0.1" value={form.weight} onChange={e => setForm({ ...form, weight: e.target.value })} />
                {errors.weight && <div style={{ color: 'crimson' }}>{errors.weight}</div>}
              </label>

              <label>
                Sire
                <input id="animal-sire" name="sire" value={form.sire} onChange={e => setForm({ ...form, sire: e.target.value })} />
              </label>

              <label>
                Dam
                <input id="animal-dam" name="dam" value={form.dam} onChange={e => setForm({ ...form, dam: e.target.value })} />
              </label>

              <label>
                Sex
                <select id="animal-sex" name="sex" value={form.sex} onChange={e => setForm({ ...form, sex: e.target.value })}>
                  <option value="F">Female</option>
                  <option value="M">Male</option>
                </select>
              </label>

              <label>
                Status
                <select id="animal-status" name="status" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                  <option>Active</option>
                  <option>Sold</option>
                  <option>Deceased</option>
                </select>
              </label>

              <label>
                Group
                <select id="animal-group" name="groupId" value={form.groupId} onChange={e => setForm({ ...form, groupId: e.target.value })}>
                  <option value="">-- No group --</option>
                  {groupOptionsForForm.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </label>

              <label>
                Owner
                <input id="animal-owner" name="owner" value={form.owner} onChange={e => setForm({ ...form, owner: e.target.value })} />
              </label>

              <label>
                Registration #
                <input id="animal-registration" name="registration" value={form.registration} onChange={e => setForm({ ...form, registration: e.target.value })} />
              </label>

              <label>
                Tattoo / ID
                <input id="animal-tattoo" name="tattoo" value={form.tattoo} onChange={e => setForm({ ...form, tattoo: e.target.value })} />
              </label>

              <label>
                Purchase date
                <input id="animal-purchase-date" name="purchaseDate" type="date" value={form.purchaseDate} onChange={e => setForm({ ...form, purchaseDate: e.target.value })} />
                {errors.purchaseDate && <div style={{ color: 'crimson' }}>{errors.purchaseDate}</div>}
              </label>

              <label>
                Purchase price
                <input id="animal-purchase-price" name="purchasePrice" type="number" step="0.01" value={form.purchasePrice} onChange={e => setForm({ ...form, purchasePrice: e.target.value })} />
                {errors.purchasePrice && <div style={{ color: 'crimson' }}>{errors.purchasePrice}</div>}
              </label>

              <label>
                Vendor
                <input id="animal-vendor" name="vendor" value={form.vendor} onChange={e => setForm({ ...form, vendor: e.target.value })} />
              </label>

              <label>
                Tags (comma separated)
                <input id="animal-tags" name="tags" value={typeof form.tags === 'string' ? form.tags : (form.tags || []).join(', ')} onChange={e => setForm({ ...form, tags: e.target.value })} />
              </label>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', marginBottom: 6 }}>Photos (up to 5, each ≤ 2 MB)</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                  <input id="animal-photos" name="photos" type="file" accept="image/*" multiple onChange={handleFileInput} />
                  <small style={{ color: '#4b5563' }}>Files will be resized to {MAX_DIM}px and compressed.</small>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {(form.photos || []).map((p, idx) => (
                    <div key={p.id} style={{ width: 120, border: '1px solid #ddd', padding: 6, borderRadius: 6, textAlign: 'center' }}>
                      <img src={p.dataUrl} alt={`preview ${idx+1}`} style={{ width: '100%', height: 72, objectFit: 'cover', borderRadius: 4 }} />
                      <div style={{ fontSize: 12, marginTop: 6 }}>{p.filename || 'photo'}</div>
                      <div style={{ fontSize: 11, color: '#4b5563' }}>{Math.round((p.size||0)/1024)} KB</div>
                      <button type="button" onClick={() => removePhoto(p.id)} aria-label={`Remove photo ${idx+1}`} style={{ marginTop: 6 }}>Remove</button>
                    </div>
                  ))}
                </div>
              </div>
              <label>
                Photo URL
                <input id="animal-photo-url" name="photo" value={form.photo} onChange={e => setForm({ ...form, photo: e.target.value })} />
              </label>

              <label>
                Pregnancy status
                <select id="animal-pregnancy-status" name="pregnancyStatus" value={form.pregnancyStatus} onChange={e => setForm({ ...form, pregnancyStatus: e.target.value })}>
                  <option>Not Pregnant</option>
                  <option>Pregnant</option>
                  <option>Unknown</option>
                  <option>Not Applicable</option>
                </select>
              </label>

              <label>
                Days in Milk (DIM)
                <input id="animal-dim" name="daysInMilk" type="number" min="0" value={form.daysInMilk ?? ''} onChange={e => setForm({ ...form, daysInMilk: e.target.value })} />
              </label>

              <label>
                Last calving date
                <input id="animal-last-calving-date" name="lastCalvingDate" type="date" value={form.lastCalvingDate || ''} onChange={e => setForm({ ...form, lastCalvingDate: e.target.value })} />
              </label>

              <label>
                Expected due
                <input id="animal-expected-due" name="expectedDue" type="date" value={form.expectedDue} onChange={e => setForm({ ...form, expectedDue: e.target.value })} />
              </label>

              <label>
                Parity
                <input id="animal-parity" name="parity" type="number" min="0" value={form.parity} onChange={e => setForm({ ...form, parity: e.target.value })} />
              </label>

              <label>
                Lactation status
                <select id="animal-lactation-status" name="lactationStatus" value={form.lactationStatus} onChange={e => setForm({ ...form, lactationStatus: e.target.value })}>
                  {DAIRY_LIFECYCLE_STAGES.map(stage => <option key={stage}>{stage}</option>)}
                </select>
              </label>

              <label style={{ gridColumn: '1 / -1' }}>
                Notes
                <textarea id="animal-notes" name="notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3} />
              </label>
            </div>
            )}

            {/* PRODUCTION TAB */}
            {formTab === 'production' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <h4 style={{ gridColumn: '1 / -1', color: '#059669', marginBottom: 8 }}>📊 Production Metrics</h4>
              
              <h5 style={{ gridColumn: '1 / -1', fontSize: '14px', color: '#4b5563', marginTop: 12 }}>Milk Production</h5>
              <label>Total Lifetime (L)<input id="milk-total-lifetime" name="milkTotalLifetime" type="number" step="0.1" value={form.production?.milk?.totalLifetime || ''} onChange={e => setForm({ ...form, production: { ...form.production, milk: { ...form.production?.milk, totalLifetime: e.target.value } } })} /></label>
              <label>Current Lactation (L)<input type="number" step="0.1" value={form.production?.milk?.currentLactation || ''} onChange={e => setForm({ ...form, production: { ...form.production, milk: { ...form.production?.milk, currentLactation: e.target.value } } })} /></label>
              <label>Peak Yield (L/day)<input type="number" step="0.1" value={form.production?.milk?.peakYield || ''} onChange={e => setForm({ ...form, production: { ...form.production, milk: { ...form.production?.milk, peakYield: e.target.value } } })} /></label>
              <label>Average Daily (L)<input type="number" step="0.1" value={form.production?.milk?.averageDaily || ''} onChange={e => setForm({ ...form, production: { ...form.production, milk: { ...form.production?.milk, averageDaily: e.target.value } } })} /></label>
              
              <h5 style={{ gridColumn: '1 / -1', fontSize: '14px', color: '#4b5563', marginTop: 12 }}>Egg Production</h5>
              <label>Total Lifetime<input type="number" value={form.production?.eggs?.totalLifetime || ''} onChange={e => setForm({ ...form, production: { ...form.production, eggs: { ...form.production?.eggs, totalLifetime: e.target.value } } })} /></label>
              <label>Current Year<input type="number" value={form.production?.eggs?.currentYear || ''} onChange={e => setForm({ ...form, production: { ...form.production, eggs: { ...form.production?.eggs, currentYear: e.target.value } } })} /></label>
              <label>Average Daily<input type="number" step="0.1" value={form.production?.eggs?.averageDaily || ''} onChange={e => setForm({ ...form, production: { ...form.production, eggs: { ...form.production?.eggs, averageDaily: e.target.value } } })} /></label>
              <label>Last Recorded<input type="date" value={form.production?.eggs?.lastRecorded || ''} onChange={e => setForm({ ...form, production: { ...form.production, eggs: { ...form.production?.eggs, lastRecorded: e.target.value } } })} /></label>
              
              <h5 style={{ gridColumn: '1 / -1', fontSize: '14px', color: '#4b5563', marginTop: 12 }}>Meat/Wool/Work</h5>
              <label>Expected Meat Yield (kg)<input type="number" step="0.1" value={form.production?.meat?.expectedYield || ''} onChange={e => setForm({ ...form, production: { ...form.production, meat: { ...form.production?.meat, expectedYield: e.target.value } } })} /></label>
              <label>Grading Score<input value={form.production?.meat?.gradingScore || ''} onChange={e => setForm({ ...form, production: { ...form.production, meat: { ...form.production?.meat, gradingScore: e.target.value } } })} /></label>
              <label>Wool Yield (kg)<input type="number" step="0.1" value={form.production?.wool?.averageYield || ''} onChange={e => setForm({ ...form, production: { ...form.production, wool: { ...form.production?.wool, averageYield: e.target.value } } })} /></label>
              <label>Wool Quality<input value={form.production?.wool?.quality || ''} onChange={e => setForm({ ...form, production: { ...form.production, wool: { ...form.production?.wool, quality: e.target.value } } })} /></label>
              
              <h5 style={{ gridColumn: '1 / -1', fontSize: '14px', color: '#4b5563', marginTop: 12 }}>Offspring</h5>
              <label>Total Born<input type="number" value={form.production?.offspring?.totalBorn || ''} onChange={e => setForm({ ...form, production: { ...form.production, offspring: { ...form.production?.offspring, totalBorn: e.target.value } } })} /></label>
              <label>Total Weaned<input type="number" value={form.production?.offspring?.totalWeaned || ''} onChange={e => setForm({ ...form, production: { ...form.production, offspring: { ...form.production?.offspring, totalWeaned: e.target.value } } })} /></label>
              <label>Total Survived<input type="number" value={form.production?.offspring?.totalSurvived || ''} onChange={e => setForm({ ...form, production: { ...form.production, offspring: { ...form.production?.offspring, totalSurvived: e.target.value } } })} /></label>
            </div>
            )}

            {/* GENETICS TAB */}
            {formTab === 'genetics' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
              <h4 style={{ color: '#3b82f6', marginBottom: 8 }}>🧬 Genetics & Breeding</h4>
              <label>Pedigree<textarea rows={2} value={form.genetics?.pedigree || ''} onChange={e => setForm({ ...form, genetics: { ...form.genetics, pedigree: e.target.value } })} placeholder="Full pedigree information" /></label>
              <label>Sire Lineage<input value={form.genetics?.sireLineage || ''} onChange={e => setForm({ ...form, genetics: { ...form.genetics, sireLineage: e.target.value } })} /></label>
              <label>Dam Lineage<input value={form.genetics?.damLineage || ''} onChange={e => setForm({ ...form, genetics: { ...form.genetics, damLineage: e.target.value } })} /></label>
              <label>DNA Markers<input value={form.genetics?.dnaMarkers || ''} onChange={e => setForm({ ...form, genetics: { ...form.genetics, dnaMarkers: e.target.value } })} placeholder="e.g., A2A2, BB, Polled carrier" /></label>
              <label>Breeding Value<input value={form.genetics?.breedingValue || ''} onChange={e => setForm({ ...form, genetics: { ...form.genetics, breedingValue: e.target.value } })} placeholder="e.g., +2850 NM$" /></label>
              <label>Inbreeding Coefficient<input type="number" step="0.01" value={form.genetics?.inbreedingCoefficient || ''} onChange={e => setForm({ ...form, genetics: { ...form.genetics, inbreedingCoefficient: e.target.value } })} /></label>
              <label>Genomic Evaluation<textarea rows={2} value={form.genetics?.genomicEvaluation || ''} onChange={e => setForm({ ...form, genetics: { ...form.genetics, genomicEvaluation: e.target.value } })} placeholder="e.g., TPI: 2750, NM$: 850" /></label>
              <label>Genetic Defects<textarea rows={2} value={(form.genetics?.geneticDefects || []).join(', ')} onChange={e => setForm({ ...form, genetics: { ...form.genetics, geneticDefects: e.target.value.split(',').map(s => s.trim()) } })} placeholder="Comma-separated list" /></label>
            </div>
            )}

            {/* HEALTH TAB */}
            {formTab === 'health' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <h4 style={{ gridColumn: '1 / -1', color: '#dc2626', marginBottom: 8 }}>🏥 Health Records</h4>
              <label>Health Status<select id="health-status" name="healthStatus" value={form.health?.healthStatus || 'Healthy'} onChange={e => setForm({ ...form, health: { ...form.health, healthStatus: e.target.value } })}>
                <option>Excellent</option>
                <option>Healthy</option>
                <option>Fair</option>
                <option>Sick</option>
                <option>Recovering</option>
                <option>Critical</option>
              </select></label>
              <label>Body Condition Score (1-5)<input id="health-body-condition" name="bodyConditionScore" type="number" step="0.5" min="1" max="5" value={form.health?.bodyConditionScore || ''} onChange={e => setForm({ ...form, health: { ...form.health, bodyConditionScore: e.target.value } })} /></label>
              <label>Last Vet Visit<input type="date" value={form.health?.lastVetVisit || ''} onChange={e => setForm({ ...form, health: { ...form.health, lastVetVisit: e.target.value } })} /></label>
              <label>Next Vet Visit<input type="date" value={form.health?.nextVetVisit || ''} onChange={e => setForm({ ...form, health: { ...form.health, nextVetVisit: e.target.value } })} /></label>
              <label>Quarantine Status<select id="health-quarantine" name="quarantineStatus" value={form.health?.quarantineStatus || 'None'} onChange={e => setForm({ ...form, health: { ...form.health, quarantineStatus: e.target.value } })}>
                <option>None</option>
                <option>Quarantined</option>
                <option>Isolation</option>
                <option>Observation</option>
              </select></label>
              <label style={{ gridColumn: '1 / -1' }}>Allergies<input value={(form.health?.allergies || []).join(', ')} onChange={e => setForm({ ...form, health: { ...form.health, allergies: e.target.value.split(',').map(s => s.trim()) } })} placeholder="Comma-separated list" /></label>
              <label style={{ gridColumn: '1 / -1' }}>Chronic Conditions<input value={(form.health?.chronicConditions || []).join(', ')} onChange={e => setForm({ ...form, health: { ...form.health, chronicConditions: e.target.value.split(',').map(s => s.trim()) } })} placeholder="Comma-separated list" /></label>
            </div>
            )}

            {/* FINANCIAL TAB */}
            {formTab === 'financial' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <h4 style={{ gridColumn: '1 / -1', color: '#f59e0b', marginBottom: 8 }}>💰 Financial Tracking</h4>
              <label>Acquisition Cost (KES)<input type="number" step="0.01" value={form.financial?.acquisitionCost || form.purchasePrice || ''} onChange={e => setForm({ ...form, financial: { ...form.financial, acquisitionCost: e.target.value } })} /></label>
              <label>Current Value (KES)<input type="number" step="0.01" value={form.financial?.currentValue || ''} onChange={e => setForm({ ...form, financial: { ...form.financial, currentValue: e.target.value } })} /></label>
              <label>Insurance Value (KES)<input type="number" step="0.01" value={form.financial?.insuranceValue || ''} onChange={e => setForm({ ...form, financial: { ...form.financial, insuranceValue: e.target.value } })} /></label>
              <label>Maintenance Cost (KES)<input type="number" step="0.01" value={form.financial?.maintenanceCost || ''} onChange={e => setForm({ ...form, financial: { ...form.financial, maintenanceCost: e.target.value } })} /></label>
              <label>Feed Cost (KES)<input type="number" step="0.01" value={form.financial?.feedCost || ''} onChange={e => setForm({ ...form, financial: { ...form.financial, feedCost: e.target.value } })} /></label>
              <label>Veterinary Cost (KES)<input type="number" step="0.01" value={form.financial?.veterinaryCost || ''} onChange={e => setForm({ ...form, financial: { ...form.financial, veterinaryCost: e.target.value } })} /></label>
              <label>Production Revenue (KES)<input type="number" step="0.01" value={form.financial?.productionRevenue || ''} onChange={e => setForm({ ...form, financial: { ...form.financial, productionRevenue: e.target.value } })} /></label>
              <label>ROI (%)<input type="number" step="0.01" value={form.financial?.roi || ''} onChange={e => setForm({ ...form, financial: { ...form.financial, roi: e.target.value } })} /></label>
            </div>
            )}

            {/* LOCATION TAB */}
            {formTab === 'location' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <h4 style={{ gridColumn: '1 / -1', color: '#8b5cf6', marginBottom: 8 }}>📍 Location & Facilities</h4>
              <label>Barn<input value={form.location?.barn || ''} onChange={e => setForm({ ...form, location: { ...form.location, barn: e.target.value } })} /></label>
              <label>Pen<input value={form.location?.pen || ''} onChange={e => setForm({ ...form, location: { ...form.location, pen: e.target.value } })} /></label>
              <label>Pasture<input value={form.location?.pasture || ''} onChange={e => setForm({ ...form, location: { ...form.location, pasture: e.target.value } })} /></label>
              <label>Stall<input value={form.location?.stall || ''} onChange={e => setForm({ ...form, location: { ...form.location, stall: e.target.value } })} /></label>
              <label>Paddock<input value={form.location?.paddock || ''} onChange={e => setForm({ ...form, location: { ...form.location, paddock: e.target.value } })} /></label>
              <label>Last Moved<input type="date" value={form.location?.lastMoved || ''} onChange={e => setForm({ ...form, location: { ...form.location, lastMoved: e.target.value } })} /></label>
              <label style={{ gridColumn: '1 / -1' }}>Preferred Location<input value={form.location?.preferredLocation || ''} onChange={e => setForm({ ...form, location: { ...form.location, preferredLocation: e.target.value } })} placeholder="e.g., Shaded area, near water" /></label>
            </div>
            )}

            {/* BEHAVIOR TAB */}
            {formTab === 'behavior' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <h4 style={{ gridColumn: '1 / -1', color: '#ec4899', marginBottom: 8 }}>🎭 Behavior & Temperament</h4>
              <label>Temperament<select id="behavior-temperament" name="temperament" value={form.behavior?.temperament || 'Calm'} onChange={e => setForm({ ...form, behavior: { ...form.behavior, temperament: e.target.value } })}>
                <option>Calm</option>
                <option>Friendly</option>
                <option>Nervous</option>
                <option>Aggressive</option>
                <option>Docile</option>
              </select></label>
              <label>Handling Difficulty<select id="behavior-handling" name="handlingDifficulty" value={form.behavior?.handlingDifficulty || 'Easy'} onChange={e => setForm({ ...form, behavior: { ...form.behavior, handlingDifficulty: e.target.value } })}>
                <option>Easy</option>
                <option>Moderate</option>
                <option>Difficult</option>
                <option>Expert Only</option>
              </select></label>
              <label>Training Level<input value={form.behavior?.trainingLevel || ''} onChange={e => setForm({ ...form, behavior: { ...form.behavior, trainingLevel: e.target.value } })} placeholder="e.g., Halter trained, saddle broke" /></label>
              <label>Socialization<select value={form.behavior?.socialization || 'Good'} onChange={e => setForm({ ...form, behavior: { ...form.behavior, socialization: e.target.value } })}>
                <option>Excellent</option>
                <option>Good</option>
                <option>Fair</option>
                <option>Poor</option>
                <option>Isolated</option>
              </select></label>
              <label style={{ gridColumn: '1 / -1' }}>Special Needs<input value={(form.behavior?.specialNeeds || []).join(', ')} onChange={e => setForm({ ...form, behavior: { ...form.behavior, specialNeeds: e.target.value.split(',').map(s => s.trim()) } })} placeholder="Comma-separated list" /></label>
              <label style={{ gridColumn: '1 / -1' }}>Behavior Notes<textarea rows={3} value={form.behavior?.behaviorNotes || ''} onChange={e => setForm({ ...form, behavior: { ...form.behavior, behaviorNotes: e.target.value } })} /></label>
            </div>
            )}

            {/* DOCUMENTATION TAB */}
            {formTab === 'documentation' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <h4 style={{ gridColumn: '1 / -1', color: '#0ea5e9', marginBottom: 8 }}>📄 Documentation & Certifications</h4>
              <label>Insurance Policy #<input value={form.documentation?.insurancePolicy || ''} onChange={e => setForm({ ...form, documentation: { ...form.documentation, insurancePolicy: e.target.value } })} /></label>
              <label>Insurance Provider<input value={form.documentation?.insuranceProvider || ''} onChange={e => setForm({ ...form, documentation: { ...form.documentation, insuranceProvider: e.target.value } })} /></label>
              <label>Insurance Expiry<input type="date" value={form.documentation?.insuranceExpiry || ''} onChange={e => setForm({ ...form, documentation: { ...form.documentation, insuranceExpiry: e.target.value } })} /></label>
              <label>Microchip ID<input value={form.documentation?.microchipId || ''} onChange={e => setForm({ ...form, documentation: { ...form.documentation, microchipId: e.target.value } })} /></label>
              <label>Passport Number<input value={form.documentation?.passportNumber || ''} onChange={e => setForm({ ...form, documentation: { ...form.documentation, passportNumber: e.target.value } })} /></label>
              <label>Health Certificate<input value={form.documentation?.healthCertificate || ''} onChange={e => setForm({ ...form, documentation: { ...form.documentation, healthCertificate: e.target.value } })} /></label>
              <label>Birth Certificate<input value={form.documentation?.birthCertificate || ''} onChange={e => setForm({ ...form, documentation: { ...form.documentation, birthCertificate: e.target.value } })} /></label>
              <h5 style={{ gridColumn: '1 / -1', fontSize: '14px', color: '#4b5563', marginTop: 12 }}>Certifications</h5>
              <label>Organic Certified<input type="checkbox" checked={form.certifications?.organic || false} onChange={e => setForm({ ...form, certifications: { ...form.certifications, organic: e.target.checked } })} /></label>
              <label>Free Range<input type="checkbox" checked={form.certifications?.freeRange || false} onChange={e => setForm({ ...form, certifications: { ...form.certifications, freeRange: e.target.checked } })} /></label>
              <label>Grass Fed<input type="checkbox" checked={form.certifications?.grassFed || false} onChange={e => setForm({ ...form, certifications: { ...form.certifications, grassFed: e.target.checked } })} /></label>
              <label style={{ gridColumn: '1 / -1' }}>Animal Welfare Standard<input value={form.certifications?.animalWelfare || ''} onChange={e => setForm({ ...form, certifications: { ...form.certifications, animalWelfare: e.target.value } })} placeholder="e.g., Gold Standard" /></label>
            </div>
            )}

            {/* Submit Buttons - Always visible */}
            <div style={{ marginTop: 24, padding: '16px 0', borderTop: '2px solid #e5e7eb', display: 'flex', gap: 8 }}>
              <button type="submit" style={{ background: 'var(--green)', color: '#fff', padding: '12px 24px', fontWeight: 'bold', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '15px' }}>
                {editingId ? '✓ Update Animal' : '+ Add Animal'}
              </button>
              <button type="button" onClick={resetForm} style={{ padding: '12px 24px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', fontSize: '15px' }}>Reset</button>
              {editingId && <button type="button" onClick={() => { resetForm(); setTab('list') }} style={{ padding: '12px 24px', background: '#666', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '15px' }}>Cancel</button>}
            </div>
          </form>
        </div>
      )}

      {isDairySection && tab === 'addGroup' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: '1.7rem', fontWeight: '700', color: '#059669', margin: 0 }}>🥛 Dairy Lifecycle Grouping</h2>
            <div style={{ color: '#475569', fontSize: 14 }}>Set each cow stage: fresh, early/mid/late lactation, dry, heifer, transition, and more.</div>
          </div>

          <div className="card" style={{ padding: 14, marginBottom: 14, borderLeft: '4px solid #0ea5e9' }}>
            <div style={{ fontWeight: 700, marginBottom: 10, color: '#0f172a' }}>Herd Targets & Alert Thresholds</div>
            <div style={{ fontSize: 12, color: '#475569', marginBottom: 8 }}>
              Last applied preset: {lastAppliedPreset.name} {lastAppliedPreset.at ? `at ${new Date(lastAppliedPreset.at).toLocaleString()}` : ''}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth <= 900 ? '1fr' : '1fr auto auto', gap: 10, alignItems: 'end', marginBottom: 10 }}>
              <label style={{ margin: 0 }}>
                Profile Preset
                <select value={selectedDairyPreset} onChange={e => applyDairyPreset(e.target.value)} style={{ width: '100%' }}>
                  <option value="conservative">Conservative</option>
                  <option value="balanced">Balanced</option>
                  <option value="aggressive">Aggressive</option>
                  {Object.keys(customDairyPresets).map(name => (
                    <option key={name} value={`custom::${name}`}>
                      Custom: {name}{customDairyPresets[name]?.notes ? ' [note]' : ''}
                    </option>
                  ))}
                </select>
              </label>
              <button type="button" onClick={() => applyDairyPreset(selectedDairyPreset)} style={{ padding: '9px 12px', background: '#e0f2fe', border: '1px solid #7dd3fc', borderRadius: 6, cursor: 'pointer', color: '#075985' }}>
                Re-apply Preset
              </button>
              <button type="button" onClick={resetDairyKpiSettings} style={{ padding: '9px 12px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer' }}>
                Reset Defaults
              </button>
            </div>
            <div style={{ fontSize: 13, color: '#475569', marginTop: -4, marginBottom: 10 }}>
              {selectedPresetMeta.description}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth <= 900 ? '1fr' : '1.2fr 1.3fr auto auto', gap: 10, alignItems: 'end', marginBottom: 10 }}>
              <label style={{ margin: 0 }}>
                Save Current as Custom Preset
                <input
                  type="text"
                  value={customPresetName}
                  onChange={e => setCustomPresetName(e.target.value)}
                  placeholder="e.g., Rainy Season Plan"
                  style={{ width: '100%' }}
                />
              </label>
              <label style={{ margin: 0 }}>
                Preset Notes
                <input
                  type="text"
                  value={customPresetNotes}
                  onChange={e => setCustomPresetNotes(e.target.value)}
                  placeholder="Short note about when to use this preset"
                  style={{ width: '100%' }}
                />
              </label>
              <button type="button" onClick={saveCustomDairyPreset} style={{ padding: '9px 12px', background: '#dcfce7', border: '1px solid #86efac', borderRadius: 6, cursor: 'pointer', color: '#166534' }}>
                Save Custom
              </button>
              <button type="button" onClick={deleteSelectedCustomPreset} disabled={!selectedDairyPreset.startsWith('custom::')} style={{ padding: '9px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, cursor: selectedDairyPreset.startsWith('custom::') ? 'pointer' : 'not-allowed', color: '#991b1b', opacity: selectedDairyPreset.startsWith('custom::') ? 1 : 0.6 }}>
                Delete Custom
              </button>
            </div>
            {selectedDairyPreset.startsWith('custom::') && (
              <div style={{ marginTop: -2, marginBottom: 10, border: '1px solid #fcd34d', borderRadius: 8, background: '#fffbeb', padding: 10 }}>
                {!isEditingSelectedPresetNote ? (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <div style={{ fontSize: 12, color: '#92400e' }}>
                      <strong>Selected Note:</strong>
                      <div style={{ marginTop: 4 }}>
                        {renderPresetNoteContent(selectedPresetMeta.description)}
                      </div>
                    </div>
                    <button type="button" onClick={startInlineEditSelectedCustomPresetNote} style={{ padding: '7px 10px', background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 6, cursor: 'pointer', color: '#92400e', fontSize: 12 }}>
                      Edit Note For Selected Custom Preset
                    </button>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: 12, color: '#92400e', marginBottom: 6 }}>Editing note for {selectedPresetMeta.label}</div>
                    <textarea
                      ref={selectedPresetNoteEditorRef}
                      value={selectedPresetNoteDraft}
                      onChange={e => setSelectedPresetNoteDraft(e.target.value)}
                      onInput={e => {
                        e.currentTarget.style.height = 'auto'
                        e.currentTarget.style.height = `${Math.max(96, e.currentTarget.scrollHeight)}px`
                      }}
                      rows={3}
                      maxLength={240}
                      style={{ width: '100%', resize: 'none', overflow: 'hidden', minHeight: 96 }}
                    />
                    <div style={{ marginTop: 6, marginBottom: 6, fontSize: 12, color: '#92400e' }}>
                      Tip: start lines with `- ` or `* ` to create bullet notes.
                    </div>
                    <div style={{ marginTop: 4, marginBottom: 8, padding: 8, borderRadius: 6, border: '1px solid #fde68a', background: '#fffef7', fontSize: 12, color: '#78350f' }}>
                      <strong>Preview</strong>
                      <div style={{ marginTop: 4 }}>
                        {renderPresetNoteContent(selectedPresetNoteDraft)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, gap: 8, flexWrap: 'wrap' }}>
                      <div style={{ fontSize: 12, color: '#92400e' }}>{String(selectedPresetNoteDraft || '').length}/240</div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button type="button" onClick={saveInlineSelectedCustomPresetNote} style={{ padding: '7px 10px', background: '#16a34a', border: 'none', borderRadius: 6, cursor: 'pointer', color: '#fff', fontSize: 12 }}>
                          Save Note
                        </button>
                        <button type="button" onClick={cancelInlineSelectedCustomPresetNote} style={{ padding: '7px 10px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', color: '#334155', fontSize: 12 }}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth <= 900 ? '1fr' : 'auto auto auto', gap: 10, alignItems: 'center', marginBottom: 10 }}>
              <button type="button" onClick={exportDairyPresets} style={{ padding: '8px 12px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 6, cursor: 'pointer', color: '#0c4a6e' }}>
                Export Presets JSON
              </button>
              <button type="button" onClick={() => presetImportInputRef.current?.click()} style={{ padding: '8px 12px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 6, cursor: 'pointer', color: '#0c4a6e' }}>
                Import Presets JSON
              </button>
              <input ref={presetImportInputRef} type="file" accept=".json,application/json" style={{ display: 'none' }} onChange={importDairyPresetsFile} />
            </div>
            {pendingPresetImport && (
              <div style={{ marginBottom: 10, padding: '12px 14px', borderRadius: 8, border: '1px solid #bfdbfe', background: '#eff6ff' }}>
                <div style={{ fontWeight: 700, color: '#1d4ed8', marginBottom: 8 }}>Import Preview</div>
                <div style={{ fontSize: 13, color: '#334155', marginBottom: 6 }}>
                  File: {pendingPresetImport.fileName} • {pendingPresetImport.importedNames.length} preset(s) • {pendingPresetImport.newNames.length} new • {pendingPresetImport.overwriteNames.length} overwrite
                </div>
                {pendingPresetImport.currentSettings && (
                  <div style={{ fontSize: 13, color: '#334155', marginBottom: 6 }}>
                    File also contains current settings that can be applied.
                  </div>
                )}
                {pendingPresetImport.newNames.length > 0 && (
                  <div style={{ fontSize: 13, marginBottom: 4, color: '#166534' }}>
                    New: {pendingPresetImport.newNames.join(', ')}
                  </div>
                )}
                {pendingPresetImport.overwriteNames.length > 0 && (
                  <div style={{ fontSize: 13, marginBottom: 8, color: '#92400e' }}>
                    Overwrite: {pendingPresetImport.overwriteNames.join(', ')}
                  </div>
                )}
                {pendingPresetImport.importedNames.length > 0 && (
                  <div style={{ fontSize: 12, color: '#475569', marginBottom: 8 }}>
                    {pendingPresetImport.importedNames.slice(0, 3).map(name => {
                      const note = pendingPresetImport.importedCustom?.[name]?.notes
                      return `${name}${note ? `: ${note}` : ''}`
                    }).join(' | ')}
                    {pendingPresetImport.importedNames.length > 3 ? ' ...' : ''}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button type="button" onClick={() => applyPresetImport({ applyImportedSettings: false })} style={{ padding: '8px 12px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
                    Import Presets Only
                  </button>
                  {pendingPresetImport.currentSettings && (
                    <button type="button" onClick={() => applyPresetImport({ applyImportedSettings: true })} style={{ padding: '8px 12px', background: '#059669', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
                      Import And Apply Settings
                    </button>
                  )}
                  <button type="button" onClick={cancelPresetImportPreview} style={{ padding: '8px 12px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer' }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
            {isPresetLocked && (
              <div style={{ marginBottom: 10, padding: '10px 12px', borderRadius: 6, border: '1px solid #fcd34d', background: '#fffbeb', color: '#92400e', display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <span>Built-in presets are locked to avoid accidental edits. Create a custom preset to edit targets.</span>
                <button type="button" onClick={makeEditableCustomFromCurrent} style={{ padding: '8px 12px', background: '#fde68a', border: '1px solid #f59e0b', borderRadius: 6, cursor: 'pointer', color: '#78350f', fontWeight: 600 }}>
                  Make Editable Copy
                </button>
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth <= 900 ? '1fr 1fr' : 'repeat(5, minmax(110px, 1fr))', gap: 10, marginBottom: 10 }}>
              <label style={{ margin: 0 }}>
                Milking %
                <input disabled={isPresetLocked} type="number" min="0" max="100" value={dairyKpiSettings.milkingTargetPct} onChange={e => updateDairyKpiSetting('milkingTargetPct', e.target.value)} style={{ width: '100%' }} />
              </label>
              <label style={{ margin: 0 }}>
                Fresh %
                <input disabled={isPresetLocked} type="number" min="0" max="100" value={dairyKpiSettings.freshTargetPct} onChange={e => updateDairyKpiSetting('freshTargetPct', e.target.value)} style={{ width: '100%' }} />
              </label>
              <label style={{ margin: 0 }}>
                Dry %
                <input disabled={isPresetLocked} type="number" min="0" max="100" value={dairyKpiSettings.dryTargetPct} onChange={e => updateDairyKpiSetting('dryTargetPct', e.target.value)} style={{ width: '100%' }} />
              </label>
              <label style={{ margin: 0 }}>
                Heifer %
                <input disabled={isPresetLocked} type="number" min="0" max="100" value={dairyKpiSettings.heiferTargetPct} onChange={e => updateDairyKpiSetting('heiferTargetPct', e.target.value)} style={{ width: '100%' }} />
              </label>
              <label style={{ margin: 0 }}>
                Pregnant %
                <input disabled={isPresetLocked} type="number" min="0" max="100" value={dairyKpiSettings.pregnantTargetPct} onChange={e => updateDairyKpiSetting('pregnantTargetPct', e.target.value)} style={{ width: '100%' }} />
              </label>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth <= 900 ? '1fr 1fr' : 'repeat(5, minmax(110px, 1fr))', gap: 10, alignItems: 'end' }}>
              <label style={{ margin: 0 }}>
                Max Dry % Alert
                <input disabled={isPresetLocked} type="number" min="0" max="100" value={dairyKpiSettings.dryMaxPct} onChange={e => updateDairyKpiSetting('dryMaxPct', e.target.value)} style={{ width: '100%' }} />
              </label>
              <label style={{ margin: 0 }}>
                Min Milking % Alert
                <input disabled={isPresetLocked} type="number" min="0" max="100" value={dairyKpiSettings.milkingMinPct} onChange={e => updateDairyKpiSetting('milkingMinPct', e.target.value)} style={{ width: '100%' }} />
              </label>
              <label style={{ margin: 0 }}>
                Max Unknown Count
                <input disabled={isPresetLocked} type="number" min="0" value={dairyKpiSettings.unknownMaxCount} onChange={e => updateDairyKpiSetting('unknownMaxCount', e.target.value)} style={{ width: '100%' }} />
              </label>
              <label style={{ margin: 0 }}>
                Avg DIM Warn Above
                <input disabled={isPresetLocked} type="number" min="0" value={dairyKpiSettings.avgDimWarnAbove} onChange={e => updateDairyKpiSetting('avgDimWarnAbove', e.target.value)} style={{ width: '100%' }} />
              </label>
              <label style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 6 }}>
                <input disabled={isPresetLocked} type="checkbox" checked={dairyKpiSettings.requireCloseUpForPregnant} onChange={e => updateDairyKpiSetting('requireCloseUpForPregnant', e.target.checked)} />
                Require close-up for pregnant
              </label>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginBottom: 14 }}>
            <div className="card" style={{ padding: 12, background: getKpiStatusStyle(dairyKPIs.pct(dairyKPIs.milking), dairyKPIs.targets.milking).bg, borderLeft: `4px solid ${getKpiStatusStyle(dairyKPIs.pct(dairyKPIs.milking), dairyKPIs.targets.milking).border}` }}>
              <div style={{ fontSize: 12, color: '#475569' }}>Milking Cows</div>
              <div style={{ fontSize: 23, fontWeight: 700, color: '#065f46' }}>{dairyKPIs.milking}</div>
              <div style={{ fontSize: 12, color: '#475569' }}>{dairyKPIs.pct(dairyKPIs.milking)}% of herd • target {dairyKPIs.targets.milking}%</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: getKpiStatusStyle(dairyKPIs.pct(dairyKPIs.milking), dairyKPIs.targets.milking).color }}>{getKpiStatusStyle(dairyKPIs.pct(dairyKPIs.milking), dairyKPIs.targets.milking).label}</div>
            </div>
            <div className="card" style={{ padding: 12, background: getKpiStatusStyle(dairyKPIs.pct(dairyKPIs.fresh), dairyKPIs.targets.fresh).bg, borderLeft: `4px solid ${getKpiStatusStyle(dairyKPIs.pct(dairyKPIs.fresh), dairyKPIs.targets.fresh).border}` }}>
              <div style={{ fontSize: 12, color: '#475569' }}>Fresh Cows</div>
              <div style={{ fontSize: 23, fontWeight: 700, color: '#0369a1' }}>{dairyKPIs.fresh}</div>
              <div style={{ fontSize: 12, color: '#475569' }}>{dairyKPIs.pct(dairyKPIs.fresh)}% of herd • target {dairyKPIs.targets.fresh}%</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: getKpiStatusStyle(dairyKPIs.pct(dairyKPIs.fresh), dairyKPIs.targets.fresh).color }}>{getKpiStatusStyle(dairyKPIs.pct(dairyKPIs.fresh), dairyKPIs.targets.fresh).label}</div>
            </div>
            <div className="card" style={{ padding: 12, background: getKpiStatusStyle(dairyKPIs.pct(dairyKPIs.dry), dairyKPIs.targets.dry).bg, borderLeft: `4px solid ${getKpiStatusStyle(dairyKPIs.pct(dairyKPIs.dry), dairyKPIs.targets.dry).border}` }}>
              <div style={{ fontSize: 12, color: '#475569' }}>Dry Cows</div>
              <div style={{ fontSize: 23, fontWeight: 700, color: '#9a3412' }}>{dairyKPIs.dry}</div>
              <div style={{ fontSize: 12, color: '#475569' }}>{dairyKPIs.pct(dairyKPIs.dry)}% of herd • target {dairyKPIs.targets.dry}%</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: getKpiStatusStyle(dairyKPIs.pct(dairyKPIs.dry), dairyKPIs.targets.dry).color }}>{getKpiStatusStyle(dairyKPIs.pct(dairyKPIs.dry), dairyKPIs.targets.dry).label}</div>
            </div>
            <div className="card" style={{ padding: 12, background: getKpiStatusStyle(dairyKPIs.pct(dairyKPIs.heifers), dairyKPIs.targets.heifers, 12).bg, borderLeft: `4px solid ${getKpiStatusStyle(dairyKPIs.pct(dairyKPIs.heifers), dairyKPIs.targets.heifers, 12).border}` }}>
              <div style={{ fontSize: 12, color: '#475569' }}>Heifers/Youngstock</div>
              <div style={{ fontSize: 23, fontWeight: 700, color: '#1d4ed8' }}>{dairyKPIs.heifers}</div>
              <div style={{ fontSize: 12, color: '#475569' }}>{dairyKPIs.pct(dairyKPIs.heifers)}% of herd • target {dairyKPIs.targets.heifers}%</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: getKpiStatusStyle(dairyKPIs.pct(dairyKPIs.heifers), dairyKPIs.targets.heifers, 12).color }}>{getKpiStatusStyle(dairyKPIs.pct(dairyKPIs.heifers), dairyKPIs.targets.heifers, 12).label}</div>
            </div>
            <div className="card" style={{ padding: 12, background: getKpiStatusStyle(dairyKPIs.pct(dairyKPIs.pregnant), dairyKPIs.targets.pregnant, 15).bg, borderLeft: `4px solid ${getKpiStatusStyle(dairyKPIs.pct(dairyKPIs.pregnant), dairyKPIs.targets.pregnant, 15).border}` }}>
              <div style={{ fontSize: 12, color: '#475569' }}>Pregnant</div>
              <div style={{ fontSize: 23, fontWeight: 700, color: '#be185d' }}>{dairyKPIs.pregnant}</div>
              <div style={{ fontSize: 12, color: '#475569' }}>Avg DIM: {dairyKPIs.avgDIM ?? 'N/A'} • target {dairyKPIs.targets.pregnant}%</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: getKpiStatusStyle(dairyKPIs.pct(dairyKPIs.pregnant), dairyKPIs.targets.pregnant, 15).color }}>{getKpiStatusStyle(dairyKPIs.pct(dairyKPIs.pregnant), dairyKPIs.targets.pregnant, 15).label}</div>
            </div>
          </div>

          {dairyKPIs.alerts.length > 0 && (
            <div className="card" style={{ marginBottom: 14, padding: 12, borderLeft: '4px solid #f59e0b', background: '#fffbeb' }}>
              <div style={{ fontWeight: 700, marginBottom: 8, color: '#92400e' }}>Stage Alerts</div>
              {dairyKPIs.alerts.map((a, idx) => (
                <div key={idx} style={{ fontSize: 13, color: a.level === 'warning' ? '#92400e' : '#1e3a8a', marginBottom: 4 }}>
                  • {a.text}
                </div>
              ))}
            </div>
          )}

          <div className="card" style={{ padding: 16, marginBottom: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth <= 600 ? '1fr' : '2fr 1fr', gap: 12 }}>
              <input
                type="text"
                placeholder="Search by name, tag, breed, stage..."
                value={dairyGroupingFilter}
                onChange={e => setDairyGroupingFilter(e.target.value)}
                style={{ padding: '9px 12px', borderRadius: 6, border: '1px solid #d1d5db' }}
              />
              <select
                value={dairyLifecycleFilter}
                onChange={e => setDairyLifecycleFilter(e.target.value)}
                style={{ padding: '9px 12px', borderRadius: 6, border: '1px solid #d1d5db' }}
              >
                <option value="all">All Lifecycle Stages</option>
                {DAIRY_LIFECYCLE_STAGES.map(stage => <option key={stage} value={stage}>{stage}</option>)}
              </select>
            </div>
            <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: window.innerWidth <= 900 ? '1fr' : '1.3fr 1fr 1fr 1fr', gap: 10 }}>
              <select
                value={bulkLifecycleStage}
                onChange={e => setBulkLifecycleStage(e.target.value)}
                style={{ padding: '9px 12px', borderRadius: 6, border: '1px solid #d1d5db' }}
              >
                <option value="">Bulk: choose lifecycle stage</option>
                {DAIRY_LIFECYCLE_STAGES.map(stage => <option key={stage} value={stage}>{stage}</option>)}
              </select>
              <button type="button" onClick={applyBulkLifecycleStage} disabled={!bulkLifecycleStage || selectedDairyAnimalIds.length === 0} style={{ padding: '9px 12px', background: '#059669', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', opacity: (!bulkLifecycleStage || selectedDairyAnimalIds.length === 0) ? 0.6 : 1 }}>
                Apply to selected ({selectedDairyAnimalIds.length})
              </button>
              <button type="button" onClick={() => applyAutoSuggestionToIds(selectedDairyAnimalIds)} disabled={selectedDairyAnimalIds.length === 0} style={{ padding: '9px 12px', background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', opacity: selectedDairyAnimalIds.length === 0 ? 0.6 : 1 }}>
                Auto-suggest selected
              </button>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={selectAllFilteredDairy} style={{ flex: 1, padding: '9px 12px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer' }}>
                  Select all filtered
                </button>
                <button type="button" onClick={clearSelectedDairy} style={{ flex: 1, padding: '9px 12px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer' }}>
                  Clear
                </button>
              </div>
            </div>
            <div style={{ marginTop: 8, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button type="button" onClick={() => applyAutoSuggestionToIds(dairyGroupingRows.map(a => a.id))} style={{ padding: '8px 12px', background: '#eff6ff', border: '1px solid #93c5fd', borderRadius: 6, cursor: 'pointer', color: '#1e40af' }}>
                Auto-suggest all filtered ({dairyGroupingRows.length})
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10, marginBottom: 18 }}>
            {DAIRY_LIFECYCLE_STAGES.map(stage => (
              <div key={stage} className="card" style={{ padding: 10, borderLeft: '4px solid #059669' }}>
                <div style={{ fontSize: 12, color: '#475569', minHeight: 34 }}>{stage}</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#065f46' }}>{dairyStageSummary[stage] || 0}</div>
              </div>
            ))}
          </div>

          <div className="card" style={{ padding: 12 }}>
            <div style={{ display: 'grid', gap: 10 }}>
              {dairyGroupingRows.length === 0 && (
                <div style={{ color: '#475569', padding: 14 }}>No animals match this filter.</div>
              )}
              {dairyGroupingRows.map(a => (
                <div key={a.id} style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, background: '#fff' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth <= 900 ? '1fr' : '1.3fr 1fr 1fr 0.8fr', gap: 10, alignItems: 'center' }}>
                    <div>
                      <div style={{ marginBottom: 4 }}>
                        <input
                          type="checkbox"
                          checked={selectedDairyAnimalIds.includes(a.id)}
                          onChange={() => toggleDairySelection(a.id)}
                        />
                        <span style={{ marginLeft: 8, fontSize: 12, color: '#334155' }}>Select</span>
                      </div>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{a.name || a.tag || a.id}</div>
                      <div style={{ fontSize: 13, color: '#475569' }}>{a.tag || a.id} • {a.breed || 'No breed'} • {a.sex === 'F' ? 'Female' : 'Male'} • DIM: {getAnimalDIM(a) ?? 'N/A'}</div>
                      <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>
                        Suggestion: {suggestDairyLifecycleStage(a).stage} ({suggestDairyLifecycleStage(a).confidence})
                      </div>
                    </div>
                    <label style={{ margin: 0 }}>
                      Lifecycle group
                      <select
                        value={a.lactationStatus || 'Not Applicable'}
                        onChange={e => updateDairyLifecycle(a.id, { lactationStatus: e.target.value })}
                        style={{ width: '100%', marginTop: 4 }}
                      >
                        {DAIRY_LIFECYCLE_STAGES.map(stage => <option key={stage} value={stage}>{stage}</option>)}
                      </select>
                    </label>
                    <label style={{ margin: 0 }}>
                      Pregnancy
                      <select
                        value={a.pregnancyStatus || 'Unknown'}
                        onChange={e => updateDairyLifecycle(a.id, { pregnancyStatus: e.target.value })}
                        style={{ width: '100%', marginTop: 4 }}
                      >
                        <option>Not Pregnant</option>
                        <option>Pregnant</option>
                        <option>Unknown</option>
                        <option>Not Applicable</option>
                      </select>
                    </label>
                    <label style={{ margin: 0 }}>
                      Parity
                      <input
                        type="number"
                        min="0"
                        value={a.parity ?? ''}
                        onChange={e => updateDairyLifecycle(a.id, { parity: e.target.value })}
                        style={{ width: '100%', marginTop: 4 }}
                      />
                    </label>
                  </div>
                  <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: window.innerWidth <= 900 ? '1fr' : '1fr 1fr auto', gap: 10 }}>
                    <label style={{ margin: 0 }}>
                      DIM
                      <input
                        type="number"
                        min="0"
                        value={a.daysInMilk ?? ''}
                        onChange={e => updateDairyLifecycle(a.id, { daysInMilk: e.target.value })}
                        style={{ width: '100%', marginTop: 4 }}
                      />
                    </label>
                    <label style={{ margin: 0 }}>
                      Last calving date
                      <input
                        type="date"
                        value={a.lastCalvingDate || ''}
                        onChange={e => updateDairyLifecycle(a.id, { lastCalvingDate: e.target.value })}
                        style={{ width: '100%', marginTop: 4 }}
                      />
                    </label>
                    <button type="button" onClick={() => updateDairyLifecycle(a.id, { lactationStatus: suggestDairyLifecycleStage(a).stage })} style={{ alignSelf: 'end', padding: '9px 12px', background: '#e0f2fe', border: '1px solid #7dd3fc', borderRadius: 6, cursor: 'pointer', color: '#075985' }}>
                      Apply suggestion
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {!isDairySection && tab === 'addGroup' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h2 style={{ fontSize: '2rem', fontWeight: '700', color: '#059669', margin: 0 }}>👥 Livestock Groups</h2>
            <button onClick={() => { resetGroupForm(); setTab('addGroup'); setGroupName(''); setGroupDesc(''); setEditingGroupId(null); }} style={{ background: '#059669', color: '#fff', padding: '10px 20px', border: 'none', borderRadius: '6px', fontWeight: '600', fontSize: '1rem', cursor: 'pointer' }}>➕ Add Group</button>
          </div>

          {/* Filter/Search Bar */}
          <div style={{ marginBottom: 20, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="🔍 Search groups..."
              value={filter}
              onChange={e => setFilter(e.target.value)}
              style={{ flex: '1 1 200px', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '1rem' }}
            />
          </div>

          {/* Add/Edit Group Modal - always show when tab is 'addGroup' */}
          <div className="card" style={{ padding: 24, marginBottom: 24, background: '#f0fdf4', border: '2px solid #059669', borderRadius: 8 }}>
            <h3 style={{ marginTop: 0 }}>{editingGroupId ? 'Edit Group' : 'Add New Group'}</h3>
            <form onSubmit={saveGroup}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16 }}>
                <div>
                  <label style={{ fontWeight: 600 }}>Group Name *</label>
                  <input placeholder="e.g., Dairy Herd A" value={groupName} onChange={e => setGroupName(e.target.value)} required style={{ width: '100%', padding: '8px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: '1rem' }} />
                  <div style={{ marginTop: 12 }}>
                    <label style={{ fontWeight: 600 }}>Category *</label>
                    <select value={groupCategory} onChange={e => setGroupCategory(e.target.value)} required style={{ width: '100%', padding: '8px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: '1rem' }}>
                      <option value="">Select animal category...</option>
                      <option value="Bovine">Bovine (Cattle, dairy cows, beef cattle)</option>
                      <option value="Porcine">Porcine (Pigs, hogs, swine)</option>
                      <option value="Caprine">Caprine (Goats, dairy goats, meat goats)</option>
                      <option value="Ovine">Ovine (Sheep, lambs, wool sheep)</option>
                      <option value="Equine">Equine (Horses, donkeys, mules, ponies)</option>
                      <option value="Camelids">Camelids (Camels, alpacas, llamas)</option>
                      <option value="Avians">Avians (Poultry: chickens, turkeys, ducks, geese, quail, other birds)</option>
                      <option value="Canines">Canines (Dogs, working canines, guard dogs)</option>
                      <option value="Aquaculture">Aquaculture (Fish, shrimp, aquatic livestock)</option>
                      <option value="Insects">Insects (Bees, black soldier flies, farmed insects)</option>
                      <option value="Other">Other (Custom category)</option>
                    </select>
                    {groupCategory === 'Other' && (
                      <input type="text" placeholder="Custom group name" value={customGroupName} onChange={e => setCustomGroupName(e.target.value)} required style={{ width: '100%', marginTop: 8, padding: '8px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: '1rem' }} />
                    )}
                  </div>
                </div>
                <div>
                  <label style={{ fontWeight: 600 }}>Description</label>
                  <input placeholder="Brief description of the group" value={groupDesc} onChange={e => setGroupDesc(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: '1rem' }} />
                  <label style={{ fontWeight: 600, marginTop: 12 }}>Date Created</label>
                  <input type="date" value={groupDateCreated} onChange={e => setGroupDateCreated(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: '1rem' }} />
                  <label style={{ fontWeight: 600, marginTop: 12 }}>Date Updated</label>
                  <input type="date" value={groupDateUpdated} onChange={e => setGroupDateUpdated(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: '1rem' }} />
                  <label style={{ fontWeight: 600, marginTop: 12 }}>Start Date (optional)</label>
                  <input type="date" value={groupStartDate} onChange={e => setGroupStartDate(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: '1rem' }} />
                  <label style={{ fontWeight: 600, marginTop: 12 }}>End Date (optional)</label>
                  <input type="date" value={groupEndDate} onChange={e => setGroupEndDate(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: '1rem' }} />
                </div>
              </div>
              <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
                <button type="submit" style={{ background: '#059669', color: '#fff', padding: '10px 20px', border: 'none', borderRadius: '6px', fontWeight: '600', fontSize: '1rem', cursor: 'pointer' }}>{editingGroupId ? 'Update Group' : 'Create Group'}</button>
                <button type="button" onClick={() => { resetGroupForm(); setTab('addGroup'); }} style={{ padding: '10px 20px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '1rem' }}>Cancel</button>
              </div>
            </form>
          </div>

          {/* Responsive Group Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth <= 600 ? '1fr' : 'repeat(auto-fit, minmax(340px, 1fr))', gap: 24 }}>
            {visibleGroups.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', background: '#f0fdf4', borderRadius: 8 }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🏷️</div>
                <h3>No groups yet</h3>
                <p style={{ color: '#4b5563' }}>Create your first group to organize animals</p>
              </div>
            ) : (
              visibleGroups.filter(g => g.name.toLowerCase().includes(filter.toLowerCase())).map(g => {
                const groupAnimals = scopedAnimals.filter(a => a.groupId === g.id)
                const femaleCount = groupAnimals.filter(a => a.sex === 'F').length
                const maleCount = groupAnimals.filter(a => a.sex === 'M').length
                const breedBreakdown = Object.entries(groupAnimals.reduce((acc, a) => {
                  acc[a.breed] = (acc[a.breed] || 0) + 1; return acc;
                }, {})).map(([breed, count]) => `${breed}: ${count}`).join(', ')
                const avgWeight = groupAnimals.length ? (groupAnimals.reduce((sum, a) => sum + (parseFloat(a.weight) || 0), 0) / groupAnimals.length).toFixed(1) : 'N/A'
                const ageRange = (() => {
                  const ages = groupAnimals.map(a => {
                    if (!a.dob) return null;
                    const dob = new Date(a.dob);
                    if (isNaN(dob)) return null;
                    const age = ((Date.now() - dob.getTime()) / (365.25*24*3600*1000));
                    return age;
                  }).filter(Boolean);
                  if (!ages.length) return 'N/A';
                  return `${Math.floor(Math.min(...ages))} - ${Math.ceil(Math.max(...ages))} yrs`;
                })()
                return (
                  <div key={g.id} className="card" style={{ padding: 24, background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px #e5e7eb', border: '2px solid #059669', position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <h3 style={{ margin: 0, fontWeight: '700', color: '#059669' }}>{g.name}</h3>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => startEditGroup(g)} style={{ background: '#f3f4f6', color: '#059669', border: '1px solid #059669', borderRadius: 6, padding: '6px 12px', fontWeight: '600', cursor: 'pointer' }}>✏️ Edit</button>
                        <button onClick={() => deleteGroup(g.id)} style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #dc2626', borderRadius: 6, padding: '6px 12px', fontWeight: '600', cursor: 'pointer' }}>🗑️ Delete</button>
                      </div>
                    </div>
                    <p style={{ color: '#4b5563', fontSize: 15, marginBottom: 12 }}>{g.desc || 'No description'}</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12, marginBottom: 16 }}>
                      <div style={{ background: '#f0fdf4', borderRadius: 6, padding: 10, textAlign: 'center' }}>
                        <div style={{ fontSize: 18, fontWeight: '700', color: '#059669' }}>{groupAnimals.length}</div>
                        <div style={{ fontSize: 13, color: '#4b5563' }}>Total</div>
                      </div>
                      <div style={{ background: '#eff6ff', borderRadius: 6, padding: 10, textAlign: 'center' }}>
                        <div style={{ fontSize: 18, fontWeight: '700', color: '#2563eb' }}>{groupAnimals.filter(a => a.status === 'Active').length}</div>
                        <div style={{ fontSize: 13, color: '#4b5563' }}>Active</div>
                      </div>
                      <div style={{ background: '#fce7f3', borderRadius: 6, padding: 10, textAlign: 'center' }}>
                        <div style={{ fontSize: 18, fontWeight: '700', color: '#db2777' }}>{femaleCount}</div>
                        <div style={{ fontSize: 13, color: '#4b5563' }}>Female</div>
                      </div>
                      <div style={{ background: '#dbeafe', borderRadius: 6, padding: 10, textAlign: 'center' }}>
                        <div style={{ fontSize: 18, fontWeight: '700', color: '#2563eb' }}>{maleCount}</div>
                        <div style={{ fontSize: 13, color: '#4b5563' }}>Male</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 14, marginBottom: 10 }}>
                      <strong>Breed Breakdown:</strong> {breedBreakdown || 'N/A'}<br/>
                      <strong>Average Weight:</strong> {avgWeight} kg<br/>
                      <strong>Age Range:</strong> {ageRange}
                    </div>
                    <div style={{ fontSize: 14, marginBottom: 10 }}>
                      <strong>Status:</strong> Active: {groupAnimals.filter(a => a.status === 'Active').length}, Sold: {groupAnimals.filter(a => a.status === 'Sold').length}, Deceased: {groupAnimals.filter(a => a.status === 'Deceased').length}
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Animals in this group:</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                      {groupAnimals.length === 0 ? (
                        <span style={{ color: '#4b5563', fontSize: 13 }}>No animals in this group.</span>
                      ) : (
                        groupAnimals.slice(0, 10).map(a => (
                          <span key={a.id} style={{ fontSize: 13, padding: '6px 12px', background: '#f3f4f6', borderRadius: 6, border: '1px solid #e5e7eb', marginBottom: '4px' }}>
                            {a.name || a.tag || a.id}
                          </span>
                        ))
                      )}
                      {groupAnimals.length > 10 && (
                        <span style={{ fontSize: 13, padding: '6px 12px', color: '#4b5563' }}>+{groupAnimals.length - 10} more</span>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Ungrouped Animals Warning */}
          {scopedAnimals.filter(a => !a.groupId).length > 0 && (
            <div className="card" style={{ padding: 20, marginTop: 24, background: '#fef3c7', borderLeft: '6px solid #f59e0b', borderRadius: 8 }}>
              <h3 style={{ margin: '0 0 8px 0', color: '#92400e' }}>⚠️ Ungrouped Animals</h3>
              <p style={{ margin: '0 0 8px 0', color: '#78350f', fontSize: 15 }}>
                {scopedAnimals.filter(a => !a.groupId).length} animal(s) are not assigned to any group.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                {scopedAnimals.filter(a => !a.groupId).map(a => (
                  <span key={a.id} style={{ fontSize: 13, padding: '6px 12px', background: 'white', borderRadius: 6, border: '1px solid #fbbf24' }}>
                    {a.name || a.tag || a.id}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div>
        {/* Submodules - single column on mobile */}
        {tab === 'pastures' && (
          <div style={{ marginBottom: 16, width: '100%' }}>
            <React.Suspense fallback={<div>Loading...</div>}>
              <Pastures />
            </React.Suspense>
          </div>
        )}

        {tab === 'health' && (
          <div style={{ marginBottom: 16, width: '100%' }}>
            <React.Suspense fallback={<div>Loading...</div>}>
              <HealthSystem animals={scopedAnimals} setAnimals={setAnimals} groups={visibleGroups} />
            </React.Suspense>
          </div>
        )}

        {tab === 'feeding' && (
          <div style={{ marginBottom: 16, width: '100%' }}>
            <React.Suspense fallback={<div>Loading...</div>}>
              <AnimalFeeding animals={scopedAnimals} />
            </React.Suspense>
          </div>
        )}

        {tab === 'measurement' && (
          <div style={{ marginBottom: 16, width: '100%' }}>
            <React.Suspense fallback={<div>Loading...</div>}>
              <AnimalMeasurement animals={scopedAnimals} />
            </React.Suspense>
          </div>
        )}

        {tab === 'breeding' && (
          <div style={{ marginBottom: 16, width: '100%' }}>
            <React.Suspense fallback={<div>Loading...</div>}>
              <AnimalBreeding animals={scopedAnimals} />
            </React.Suspense>
          </div>
        )}

        {tab === 'milkyield' && (
          <div style={{ marginBottom: 16, width: '100%' }}>
            <React.Suspense fallback={<div>Loading...</div>}>
              <AnimalMilkYield animals={scopedAnimals} />
            </React.Suspense>
          </div>
        )}

        {tab === 'treatment' && (
          <div style={{ marginBottom: 16, width: '100%' }}>
            <React.Suspense fallback={<div>Loading...</div>}>
              <AnimalTreatment animals={scopedAnimals} />
            </React.Suspense>
          </div>
        )}

        {tab === 'calf' && (
          <div style={{ marginBottom: 16, width: '100%' }}>
            <React.Suspense fallback={<div>Loading...</div>}>
              <CalfManagement animals={scopedAnimals} />
            </React.Suspense>
          </div>
        )}

        {!isDairySection && tab === 'bsf' && (
          <div style={{ marginBottom: 16, width: '100%' }}>
            <React.Suspense fallback={<div>Loading...</div>}>
              <BSFFarming />
            </React.Suspense>
          </div>
        )}

        {tab === 'azolla' && (
          <div style={{ marginBottom: 16, width: '100%' }}>
            <React.Suspense fallback={<div>Loading...</div>}>
              <AzollaFarming />
            </React.Suspense>
          </div>
        )}

        {!isDairySection && tab === 'poultry' && (
          <div style={{ marginBottom: 16, width: '100%' }}>
            <React.Suspense fallback={<div>Loading...</div>}>
              <PoultryManagement />
            </React.Suspense>
          </div>
        )}

        {!isDairySection && tab === 'canine' && (
          <div style={{ marginBottom: 16, width: '100%' }}>
            <React.Suspense fallback={<div>Loading...</div>}>
              <CanineManagement animals={animals} setAnimals={setAnimals} />
            </React.Suspense>
          </div>
        )}
      </div>
    </section>
  )
}
