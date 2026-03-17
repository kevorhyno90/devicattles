import { STORES } from './storage'

const FRIENDLY_KEY_MAP = {
  'cattalytics:animals': { module: 'Livestock - Dairy', subsection: 'Animal Registry' },
  'animals': { module: 'Livestock - Dairy', subsection: 'Animal Registry' },
  'cattalytics:groups': { module: 'Livestock - Dairy', subsection: 'Animal Groups' },
  'groups': { module: 'Livestock - Dairy', subsection: 'Animal Groups' },
  'cattalytics:measurements': { module: 'Livestock - Dairy', subsection: 'Measurements' },
  'measurements': { module: 'Livestock - Dairy', subsection: 'Measurements' },
  'cattalytics:animal:measurement': { module: 'Livestock - Dairy', subsection: 'Measurements' },
  'cattalytics:treatments': { module: 'Livestock - Dairy', subsection: 'Treatment Log' },
  'treatments': { module: 'Livestock - Dairy', subsection: 'Treatment Log' },
  'cattalytics:animal:treatment': { module: 'Livestock - Dairy', subsection: 'Treatment Log' },
  'cattalytics:breeding': { module: 'Livestock - Dairy', subsection: 'Breeding Records' },
  'breeding': { module: 'Livestock - Dairy', subsection: 'Breeding Records' },
  'cattalytics:animal:breeding': { module: 'Livestock - Dairy', subsection: 'Breeding Records' },
  'cattalytics:milkYield': { module: 'Livestock - Dairy', subsection: 'Milk Yield' },
  'milkYield': { module: 'Livestock - Dairy', subsection: 'Milk Yield' },
  'cattalytics:animal:milkyield': { module: 'Livestock - Dairy', subsection: 'Milk Yield' },
  'cattalytics:milk-yield': { module: 'Livestock - Dairy', subsection: 'Milk Yield' },
  'cattalytics:diets': { module: 'Livestock - Dairy', subsection: 'Diet Plans' },
  'diets': { module: 'Livestock - Dairy', subsection: 'Diet Plans' },
  'cattalytics:rations': { module: 'Livestock - Dairy', subsection: 'Ration Logs' },
  'rations': { module: 'Livestock - Dairy', subsection: 'Ration Logs' },
  'cattalytics:feeding': { module: 'Livestock - Dairy', subsection: 'Ration Logs' },

  'cattalytics:goats': { module: 'Livestock - Goat', subsection: 'Goat Registry' },
  'goats': { module: 'Livestock - Goat', subsection: 'Goat Registry' },
  'cattalytics:goat_health': { module: 'Livestock - Goat', subsection: 'Health Records' },
  'cattalytics:goat_breeding': { module: 'Livestock - Goat', subsection: 'Breeding Records' },
  'cattalytics:kids': { module: 'Livestock - Goat', subsection: 'Kids Registry' },
  'cattalytics:kids_health': { module: 'Livestock - Goat', subsection: 'Kids Health' },

  'cattalytics:flocks': { module: 'Livestock - Poultry', subsection: 'Flocks' },
  'flocks': { module: 'Livestock - Poultry', subsection: 'Flocks' },
  'cattalytics:poultry': { module: 'Livestock - Poultry', subsection: 'Bird Registry' },
  'poultry': { module: 'Livestock - Poultry', subsection: 'Bird Registry' },
  'cattalytics:egg_production': { module: 'Livestock - Poultry', subsection: 'Egg Production' },
  'egg_production': { module: 'Livestock - Poultry', subsection: 'Egg Production' },
  'cattalytics:poultry_health': { module: 'Livestock - Poultry', subsection: 'Health Records' },

  'cattalytics:bsf:colonies': { module: 'Livestock - BSF', subsection: 'Colonies' },
  'cattalytics:bsf:feeding': { module: 'Livestock - BSF', subsection: 'Feeding Log' },
  'cattalytics:bsf:harvest': { module: 'Livestock - BSF', subsection: 'Harvest Log' },

  'cattalytics:crops': { module: 'Crops', subsection: 'Crop Registry' },
  'cattalytics:crops:subsections': { module: 'Crops', subsection: 'Crop Subsection Records' },
  'cattalytics:crops:yields': { module: 'Crops', subsection: 'Yield Ledger' },
  'cattalytics:crops:sales': { module: 'Crops', subsection: 'Sales Ledger' },
  'cattalytics:crops:treatments': { module: 'Crops', subsection: 'Treatment Ledger' },
  'cattalytics:crops:costs': { module: 'Crops', subsection: 'Cost Ledger' },

  'cattalytics:employment:employees': { module: 'Employment', subsection: 'Employee Registry' },
  'cattalytics:employment:off': { module: 'Employment', subsection: 'Off Planner' },
  'cattalytics:employment:leaves': { module: 'Employment', subsection: 'Leave Management' },
  'cattalytics:employment:attendance': { module: 'Employment', subsection: 'Attendance Log' }
}

const REPORT_SECTION_TEMPLATES = [
  { module: 'Livestock - Dairy', subsection: 'Animal Registry', storageKey: 'cattalytics:animals' },
  { module: 'Livestock - Dairy', subsection: 'Animal Groups', storageKey: 'cattalytics:groups' },
  { module: 'Livestock - Dairy', subsection: 'Measurements', storageKey: 'cattalytics:measurements' },
  { module: 'Livestock - Dairy', subsection: 'Measurements', storageKey: 'cattalytics:animal:measurement' },
  { module: 'Livestock - Dairy', subsection: 'Treatment Log', storageKey: 'cattalytics:treatments' },
  { module: 'Livestock - Dairy', subsection: 'Treatment Log', storageKey: 'cattalytics:animal:treatment' },
  { module: 'Livestock - Dairy', subsection: 'Breeding Records', storageKey: 'cattalytics:breeding' },
  { module: 'Livestock - Dairy', subsection: 'Breeding Records', storageKey: 'cattalytics:animal:breeding' },
  { module: 'Livestock - Dairy', subsection: 'Milk Yield', storageKey: 'cattalytics:milkYield' },
  { module: 'Livestock - Dairy', subsection: 'Milk Yield', storageKey: 'cattalytics:animal:milkyield' },
  { module: 'Livestock - Dairy', subsection: 'Milk Yield', storageKey: 'cattalytics:milk-yield' },
  { module: 'Livestock - Dairy', subsection: 'Diet Plans', storageKey: 'cattalytics:diets' },
  { module: 'Livestock - Dairy', subsection: 'Ration Logs', storageKey: 'cattalytics:rations' },
  { module: 'Livestock - Dairy', subsection: 'Ration Logs', storageKey: 'cattalytics:feeding' },

  { module: 'Livestock - Goat', subsection: 'Goat Registry', storageKey: 'cattalytics:goats' },
  { module: 'Livestock - Goat', subsection: 'Health Records', storageKey: 'cattalytics:goat_health' },
  { module: 'Livestock - Goat', subsection: 'Breeding Records', storageKey: 'cattalytics:goat_breeding' },
  { module: 'Livestock - Goat', subsection: 'Kids Registry', storageKey: 'cattalytics:kids' },
  { module: 'Livestock - Goat', subsection: 'Kids Health', storageKey: 'cattalytics:kids_health' },

  { module: 'Livestock - Poultry', subsection: 'Flocks', storageKey: 'cattalytics:flocks' },
  { module: 'Livestock - Poultry', subsection: 'Bird Registry', storageKey: 'cattalytics:poultry' },
  { module: 'Livestock - Poultry', subsection: 'Egg Production', storageKey: 'cattalytics:egg_production' },
  { module: 'Livestock - Poultry', subsection: 'Health Records', storageKey: 'cattalytics:poultry_health' },

  { module: 'Livestock - Canine', subsection: 'Canine Registry', storageKey: 'cattalytics:animals' },
  { module: 'Livestock - Canine', subsection: 'Health Records', storageKey: 'cattalytics:animals' },
  { module: 'Livestock - Canine', subsection: 'Vaccination Records', storageKey: 'cattalytics:animals' },
  { module: 'Livestock - Canine', subsection: 'Husbandry Log', storageKey: 'cattalytics:animals' },

  { module: 'Livestock - BSF', subsection: 'Colonies', storageKey: 'cattalytics:bsf:colonies' },
  { module: 'Livestock - BSF', subsection: 'Feeding Log', storageKey: 'cattalytics:bsf:feeding' },
  { module: 'Livestock - BSF', subsection: 'Harvest Log', storageKey: 'cattalytics:bsf:harvest' },

  { module: 'Crops', subsection: 'Crop Registry', storageKey: 'cattalytics:crops' },
  { module: 'Crops', subsection: 'Bananas', storageKey: 'cattalytics:crops:subsections' },
  { module: 'Crops', subsection: 'Sweet Banana', storageKey: 'cattalytics:crops:subsections' },
  { module: 'Crops', subsection: 'Vegetables', storageKey: 'cattalytics:crops:subsections' },
  { module: 'Crops', subsection: 'Herbs', storageKey: 'cattalytics:crops:subsections' },
  { module: 'Crops', subsection: 'Tea Plantation', storageKey: 'cattalytics:crops:subsections' },
  { module: 'Crops', subsection: 'Export Avocado', storageKey: 'cattalytics:crops:subsections' },
  { module: 'Crops', subsection: 'Fruits', storageKey: 'cattalytics:crops:subsections' },
  { module: 'Crops', subsection: 'Yield Ledger', storageKey: 'cattalytics:crops:yields' },
  { module: 'Crops', subsection: 'Sales Ledger', storageKey: 'cattalytics:crops:sales' },
  { module: 'Crops', subsection: 'Treatment Ledger', storageKey: 'cattalytics:crops:treatments' },
  { module: 'Crops', subsection: 'Cost Ledger', storageKey: 'cattalytics:crops:costs' },

  { module: 'Employment', subsection: 'Employee Registry', storageKey: 'cattalytics:employment:employees' },
  { module: 'Employment', subsection: 'Off Planner', storageKey: 'cattalytics:employment:off' },
  { module: 'Employment', subsection: 'Leave Management', storageKey: 'cattalytics:employment:leaves' },
  { module: 'Employment', subsection: 'Attendance Log', storageKey: 'cattalytics:employment:attendance' }
]

const MODULE_ORDER = [
  'Livestock - Dairy',
  'Livestock - Goat',
  'Livestock - Poultry',
  'Livestock - Canine',
  'Livestock - BSF',
  'Crops',
  'Employment'
]

const SUBSECTION_ORDER = {
  'Livestock - Dairy': [
    'Animal Registry',
    'Animal Groups',
    'Measurements',
    'Treatment Log',
    'Breeding Records',
    'Milk Yield',
    'Diet Plans',
    'Ration Logs'
  ],
  'Livestock - Goat': [
    'Goat Registry',
    'Health Records',
    'Breeding Records',
    'Kids Registry',
    'Kids Health'
  ],
  'Livestock - Poultry': [
    'Flocks',
    'Bird Registry',
    'Egg Production',
    'Health Records'
  ],
  'Livestock - Canine': [
    'Canine Registry',
    'Health Records',
    'Vaccination Records',
    'Husbandry Log'
  ],
  'Livestock - BSF': [
    'Colonies',
    'Feeding Log',
    'Harvest Log'
  ],
  'Crops': [
    'Crop Registry',
    'Bananas',
    'Sweet Banana',
    'Vegetables',
    'Herbs',
    'Tea Plantation',
    'Export Avocado',
    'Fruits',
    'Yield Ledger',
    'Sales Ledger',
    'Treatment Ledger',
    'Cost Ledger'
  ],
  'Employment': [
    'Employee Registry',
    'Off Planner',
    'Leave Management',
    'Attendance Log'
  ]
}

const CROP_SUBMODULE_LABELS = {
  banana: 'Bananas',
  sweetBanana: 'Sweet Banana',
  vegetables: 'Vegetables',
  herbs: 'Herbs',
  tea: 'Tea Plantation',
  avocadoExport: 'Export Avocado',
  fruits: 'Fruits'
}

function safeParseJSON(raw) {
  if (typeof raw !== 'string') return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function titleize(token = '') {
  return String(token)
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim()
}

function normalizeKeyParts(storageKey = '') {
  const cleaned = String(storageKey || '')
  const noPrefix = cleaned
    .replace(/^cattalytics:/, '')
    .replace(/^devinsfarm:/, '')
  const parts = noPrefix.split(':').filter(Boolean)

  if (parts.length === 0) {
    return { module: 'General', subsection: titleize(cleaned || 'Dataset') }
  }

  const module = titleize(parts[0])
  const subsection = titleize(parts.slice(1).join(' ') || parts[0])
  return { module, subsection }
}

function getNamesForKey(storageKey = '') {
  const cleaned = String(storageKey || '').trim()
  const noPrefix = cleaned.replace(/^cattalytics:/, '').replace(/^devinsfarm:/, '')

  const direct = FRIENDLY_KEY_MAP[cleaned]
  if (direct) return direct

  const prefixed = FRIENDLY_KEY_MAP[`cattalytics:${noPrefix}`]
  if (prefixed) return prefixed

  return normalizeKeyParts(storageKey)
}

function slugify(value = '') {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function moduleSortIndex(moduleName = '') {
  const idx = MODULE_ORDER.indexOf(moduleName)
  return idx === -1 ? Number.MAX_SAFE_INTEGER : idx
}

function subsectionSortIndex(moduleName = '', subsectionName = '') {
  const ordered = SUBSECTION_ORDER[moduleName] || []
  const idx = ordered.indexOf(subsectionName)
  return idx === -1 ? Number.MAX_SAFE_INTEGER : idx
}

function isCanineAnimal(record) {
  if (!record || typeof record !== 'object') return false
  const groupId = String(record.groupId || '').toUpperCase()
  const type = String(record.type || '').toLowerCase()
  const role = String(record.role || '').toLowerCase()
  return groupId === 'G-008' || type === 'canine' || role.includes('dog')
}

function deriveCanineDatasetsFromAnimals(animals = []) {
  const canines = normalizeRowsForReport(animals).filter(isCanineAnimal)

  const baseRecord = (canine) => ({
    canineId: canine.id || '',
    canineTag: canine.tag || '',
    canineName: canine.name || '',
    breed: canine.breed || '',
    sex: canine.sex || '',
    weight: canine.weight || '',
    role: canine.role || '',
    trainingLevel: canine.trainingLevel || ''
  })

  const healthRows = canines.flatMap((canine) => {
    const records = Array.isArray(canine.healthRecords) ? canine.healthRecords : []
    return records.map((item, index) => ({
      ...baseRecord(canine),
      recordId: item?.id || `health-${index + 1}`,
      condition: item?.condition || '',
      severity: item?.severity || '',
      date: item?.date || '',
      treatment: item?.treatment || '',
      vetNotes: item?.vetNotes || ''
    }))
  })

  const vaccineRows = canines.flatMap((canine) => {
    const records = Array.isArray(canine.vaccineRecords) ? canine.vaccineRecords : []
    return records.map((item, index) => ({
      ...baseRecord(canine),
      recordId: item?.id || `vaccine-${index + 1}`,
      vaccineType: item?.vaccineType || '',
      date: item?.date || '',
      boosterDue: item?.boosterDue || '',
      vet: item?.vet || '',
      notes: item?.notes || ''
    }))
  })

  const husbandryRows = canines.flatMap((canine) => {
    const records = Array.isArray(canine.husbandryLog) ? canine.husbandryLog : []
    return records.map((item, index) => ({
      ...baseRecord(canine),
      recordId: item?.id || `husbandry-${index + 1}`,
      date: item?.date || '',
      feedType: item?.feedType || '',
      quantity: item?.quantity || '',
      frequency: item?.frequency || '',
      housing: item?.housing || '',
      exercise: item?.exercise || '',
      grooming: item?.grooming || '',
      supplements: item?.supplements || ''
    }))
  })

  return [
    {
      id: 'derived:canine:registry',
      storageKey: 'cattalytics:animals',
      module: 'Livestock - Canine',
      subsection: 'Canine Registry',
      sourceType: 'derived',
      rawRows: canines,
      updatedAt: new Date().toISOString()
    },
    {
      id: 'derived:canine:health',
      storageKey: 'cattalytics:animals',
      module: 'Livestock - Canine',
      subsection: 'Health Records',
      sourceType: 'derived',
      rawRows: healthRows,
      updatedAt: new Date().toISOString()
    },
    {
      id: 'derived:canine:vaccines',
      storageKey: 'cattalytics:animals',
      module: 'Livestock - Canine',
      subsection: 'Vaccination Records',
      sourceType: 'derived',
      rawRows: vaccineRows,
      updatedAt: new Date().toISOString()
    },
    {
      id: 'derived:canine:husbandry',
      storageKey: 'cattalytics:animals',
      module: 'Livestock - Canine',
      subsection: 'Husbandry Log',
      sourceType: 'derived',
      rawRows: husbandryRows,
      updatedAt: new Date().toISOString()
    }
  ]
}

function deriveCropSubsectionDatasets(records = [], crops = []) {
  const cropById = new Map(normalizeRowsForReport(crops).map((crop) => [crop.id, crop]))

  return Object.entries(CROP_SUBMODULE_LABELS).map(([moduleKey, subsectionLabel]) => {
    const rows = normalizeRowsForReport(records)
      .filter((record) => String(record?.plantSubmodule || '') === moduleKey)
      .map((record) => {
        const crop = cropById.get(record.cropId) || {}
        return {
          cropId: record.cropId || '',
          cropName: record.cropName || crop.name || '',
          variety: crop.variety || '',
          field: crop.field || '',
          status: record.status || crop.status || '',
          domain: record.domain || '',
          subsection: record.subsection || '',
          date: record.date || '',
          quantity: record.quantity || '',
          unit: record.unit || '',
          value: record.value || '',
          notes: record.notes || '',
          updatedAt: record.updatedAt || record.createdAt || ''
        }
      })

    return {
      id: `derived:crops:${moduleKey}:subsections`,
      storageKey: 'cattalytics:crops:subsections',
      module: 'Crops',
      subsection: subsectionLabel,
      sourceType: 'derived',
      rawRows: rows,
      updatedAt: new Date().toISOString()
    }
  })
}

function isObjectLike(value) {
  return value && typeof value === 'object' && !Array.isArray(value)
}

function flattenObject(record, prefix = '') {
  const flat = {}

  const walk = (value, path) => {
    if (Array.isArray(value)) {
      flat[path] = JSON.stringify(value)
      return
    }

    if (isObjectLike(value)) {
      const keys = Object.keys(value)
      if (keys.length === 0) {
        flat[path] = ''
        return
      }
      keys.forEach((k) => {
        const nextPath = path ? `${path}.${k}` : k
        walk(value[k], nextPath)
      })
      return
    }

    flat[path] = value == null ? '' : value
  }

  if (isObjectLike(record)) {
    Object.keys(record).forEach((k) => walk(record[k], prefix ? `${prefix}.${k}` : k))
  } else {
    walk(record, prefix || 'value')
  }

  return flat
}

function extractChildArraySections(rows = [], key, moduleName, subsectionName) {
  const childSectionMap = new Map()

  rows.forEach((row, rowIndex) => {
    if (!isObjectLike(row)) return

    Object.keys(row).forEach((field) => {
      const value = row[field]
      if (!Array.isArray(value) || value.length === 0) return
      if (!value.every((item) => isObjectLike(item))) return

      const childRows = value.map((item, childIndex) => {
        const parentRef = row.id || row.tag || row.name || `${rowIndex + 1}`
        return {
          __parent_record: parentRef,
          __parent_index: rowIndex + 1,
          __child_index: childIndex + 1,
          ...item
        }
      })

      const sectionId = `${key}::${field}`
      const existing = childSectionMap.get(sectionId)
      if (!existing) {
        childSectionMap.set(sectionId, {
          id: sectionId,
          storageKey: key,
          module: moduleName,
          subsection: `${subsectionName} - ${titleize(field)}`,
          sourceType: 'nested-array',
          rawRows: childRows,
          updatedAt: new Date().toISOString()
        })
      } else {
        existing.rawRows = existing.rawRows.concat(childRows)
        existing.updatedAt = new Date().toISOString()
      }
    })
  })

  return Array.from(childSectionMap.values())
}

function normalizeRowsForReport(raw) {
  if (Array.isArray(raw)) return raw
  if (isObjectLike(raw)) return [raw]
  return []
}

function toReportEntry(base) {
  const rows = normalizeRowsForReport(base.rawRows)
  const normalizedRows = rows.map((r) => flattenObject(r))
  const fields = Array.from(new Set(normalizedRows.flatMap((r) => Object.keys(r))))

  return {
    ...base,
    rowCount: normalizedRows.length,
    fields,
    rows: normalizedRows
  }
}

function buildExpectedReportKeys() {
  const expected = new Set()

  const fromStores = [...Object.keys(STORES || {}), ...Object.values(STORES || {})]
  fromStores.forEach((token) => {
    if (!token) return
    const key = String(token)
    expected.add(key)
    expected.add(`cattalytics:${key}`)
    expected.add(`devinsfarm:${key}`)
  })

  // Extra operational domains that are managed directly in modules.
  ;[
    'cattalytics:crops',
    'cattalytics:crops:subsections',
    'cattalytics:crops:yields',
    'cattalytics:crops:sales',
    'cattalytics:crops:treatments',
    'cattalytics:crops:costs',
    'cattalytics:goats',
    'cattalytics:animals',
    'cattalytics:groups',
    'cattalytics:animal:measurement',
    'cattalytics:animal:treatment',
    'cattalytics:animal:breeding',
    'cattalytics:animal:milkyield',
    'cattalytics:milk-yield',
    'cattalytics:feeding',
    'cattalytics:flocks',
    'cattalytics:poultry',
    'cattalytics:bsf:colonies',
    'cattalytics:bsf:feeding',
    'cattalytics:bsf:harvest',
    'cattalytics:employment:employees',
    'cattalytics:employment:off',
    'cattalytics:employment:leaves',
    'cattalytics:employment:attendance'
  ].forEach((k) => expected.add(k))

  return Array.from(expected)
}

const EXPECTED_REPORT_KEYS = buildExpectedReportKeys()

export function buildProfessionalReportCatalog() {
  const keys = Array.from(new Set([
    ...Object.keys(localStorage || {}),
    ...EXPECTED_REPORT_KEYS
  ]))

  const datasets = []

  keys.forEach((key) => {
    const names = getNamesForKey(key)
    const parsed = safeParseJSON(localStorage.getItem(key))
    const rows = parsed == null ? [] : normalizeRowsForReport(parsed)

    const root = {
      id: key,
      storageKey: key,
      module: names.module,
      subsection: names.subsection,
      sourceType: 'root',
      rawRows: rows,
      updatedAt: new Date().toISOString()
    }

    datasets.push(root)

    if (rows.length > 0) {
      const child = extractChildArraySections(rows, key, names.module, names.subsection)
      child.forEach((section) => datasets.push(section))
    }
  })

  const animalsData = safeParseJSON(localStorage.getItem('cattalytics:animals'))
  deriveCanineDatasetsFromAnimals(animalsData).forEach((dataset) => datasets.push(dataset))

  const cropSubsectionData = safeParseJSON(localStorage.getItem('cattalytics:crops:subsections'))
  const cropRegistryData = safeParseJSON(localStorage.getItem('cattalytics:crops'))
  deriveCropSubsectionDatasets(cropSubsectionData, cropRegistryData).forEach((dataset) => datasets.push(dataset))

  REPORT_SECTION_TEMPLATES.forEach((template) => {
    datasets.push({
      id: `template:${slugify(template.module)}:${slugify(template.subsection)}`,
      storageKey: template.storageKey,
      module: template.module,
      subsection: template.subsection,
      sourceType: 'template',
      rawRows: [],
      updatedAt: new Date().toISOString()
    })
  })

  const deduped = new Map()
  datasets.forEach((d) => {
    const key = `${d.module}::${d.subsection}::${d.storageKey}`
    const existing = deduped.get(key)
    if (!existing) {
      deduped.set(key, d)
      return
    }
    const existingRows = normalizeRowsForReport(existing.rawRows)
    const incomingRows = normalizeRowsForReport(d.rawRows)
    if (incomingRows.length > existingRows.length) {
      deduped.set(key, d)
    }
  })

  const reports = Array.from(deduped.values()).map((d) => toReportEntry(d))

  reports.sort((a, b) => {
    if (a.module !== b.module) {
      const modIdx = moduleSortIndex(a.module) - moduleSortIndex(b.module)
      if (modIdx !== 0) return modIdx
      return a.module.localeCompare(b.module)
    }
    if (a.subsection !== b.subsection) {
      const subIdx = subsectionSortIndex(a.module, a.subsection) - subsectionSortIndex(b.module, b.subsection)
      if (subIdx !== 0) return subIdx
      return a.subsection.localeCompare(b.subsection)
    }
    return a.id.localeCompare(b.id)
  })

  const summary = {
    modules: Array.from(new Set(reports.map((r) => r.module))).length,
    subsections: reports.length,
    totalRows: reports.reduce((sum, r) => sum + r.rowCount, 0),
    generatedAt: new Date().toISOString()
  }

  return { summary, reports }
}

export function buildProfessionalReportDocument(report, notes = '') {
  if (!report) return []

  const rows = report.rows || []
  const fields = report.fields || []

  return rows.map((row, index) => {
    const item = {
      recordNo: index + 1,
      module: report.module,
      subsection: report.subsection,
      storageKey: report.storageKey,
      generatedAt: new Date().toISOString(),
      professionalNotes: notes || ''
    }

    fields.forEach((field) => {
      item[field] = row[field] ?? ''
    })

    return item
  })
}
