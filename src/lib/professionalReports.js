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
  const childSections = []

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

      childSections.push({
        id: `${key}::${field}`,
        storageKey: key,
        module: moduleName,
        subsection: `${subsectionName} - ${titleize(field)}`,
        sourceType: 'nested-array',
        rawRows: childRows,
        updatedAt: new Date().toISOString()
      })
    })
  })

  return childSections
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

export function buildProfessionalReportCatalog() {
  const keys = Object.keys(localStorage || {})

  const datasets = []

  keys.forEach((key) => {
    const parsed = safeParseJSON(localStorage.getItem(key))
    if (parsed == null) return

    const rows = normalizeRowsForReport(parsed)
    if (rows.length === 0) return

    const names = normalizeKeyParts(key)

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

    const child = extractChildArraySections(rows, key, names.module, names.subsection)
    child.forEach((section) => datasets.push(section))
  })

  const reports = datasets.map((d) => toReportEntry(d)).filter((r) => r.rowCount > 0)

  reports.sort((a, b) => {
    if (a.module !== b.module) return a.module.localeCompare(b.module)
    if (a.subsection !== b.subsection) return a.subsection.localeCompare(b.subsection)
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
