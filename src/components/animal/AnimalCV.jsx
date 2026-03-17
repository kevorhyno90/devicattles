import React, { useEffect, useRef, useState } from 'react'
import { exportToPDF } from '../../lib/exportImport'

function fmt(v, fallback = '—') {
  if (v === null || v === undefined || v === '') return fallback
  if (typeof v === 'boolean') return v ? 'Yes' : 'No'
  return String(v)
}

function fmtCurrency(v) {
  const n = parseFloat(v)
  if (isNaN(n)) return '—'
  return 'KSH ' + n.toLocaleString()
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function toCSV(rows) {
  if (!rows || rows.length === 0) return ''
  const headers = Object.keys(rows[0])
  const body = rows.map(row => headers.map(h => {
    const value = row[h] === null || row[h] === undefined ? '' : String(row[h])
    return '"' + value.replace(/"/g, '""') + '"'
  }).join(','))
  return [headers.join(','), ...body].join('\n')
}

function downloadJSON(data, filenameNoExt) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  downloadBlob(blob, filenameNoExt + '.json')
}

function downloadCSV(data, filenameNoExt) {
  const rows = Array.isArray(data) ? data : [data]
  const blob = new Blob([toCSV(rows)], { type: 'text/csv' })
  downloadBlob(blob, filenameNoExt + '.csv')
}

function normalizeForPDF(data) {
  if (Array.isArray(data)) {
    if (data.length === 0) return []
    return data.map(item => {
      if (item && typeof item === 'object' && !Array.isArray(item)) return item
      return { value: item }
    })
  }
  if (data && typeof data === 'object') return [data]
  if (data === null || data === undefined || data === '') return []
  return [{ value: data }]
}

function downloadPDF(data, filenameNoExt, title) {
  const rows = normalizeForPDF(data)
  if (!rows.length) {
    alert('No data to export')
    return
  }
  exportToPDF(rows, filenameNoExt, title)
}

function SectionActions({ name, onJSON, onCSV, onPDF }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
      <span style={{ color: '#4b5563', fontSize: '0.85rem' }}>Download {name}:</span>
      <button onClick={onJSON} style={{ padding: '5px 10px', border: 'none', borderRadius: 6, background: '#111827', color: '#fff', cursor: 'pointer' }}>JSON</button>
      <button onClick={onCSV} style={{ padding: '5px 10px', border: 'none', borderRadius: 6, background: '#059669', color: '#fff', cursor: 'pointer' }}>CSV</button>
      <button onClick={onPDF} style={{ padding: '5px 10px', border: 'none', borderRadius: 6, background: '#0ea5e9', color: '#fff', cursor: 'pointer' }}>PDF</button>
    </div>
  )
}

function InfoGrid({ items }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
      {items.map(([label, value]) => (
        <div key={label} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: 10 }}>
          <div style={{ fontSize: '0.75rem', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>{label}</div>
          <div style={{ marginTop: 5, color: '#111827', wordBreak: 'break-word' }}>{fmt(value)}</div>
        </div>
      ))}
    </div>
  )
}

function DataTable({ columns, rows, empty = 'No records found.' }) {
  if (!rows || rows.length === 0) return <div style={{ color: '#4b5563' }}>{empty}</div>
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
        <thead>
          <tr style={{ background: '#f3f4f6' }}>
            {columns.map(c => (
              <th key={c.key} style={{ padding: '8px 10px', textAlign: 'left', borderBottom: '2px solid #e5e7eb', whiteSpace: 'nowrap' }}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 ? '#fafafa' : '#fff' }}>
              {columns.map(c => (
                <td key={c.key} style={{ padding: '7px 10px', color: '#374151' }}>
                  {c.render ? c.render(row[c.key], row) : fmt(row[c.key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function SectionBasic({ animal, groupName, tag }) {
  const data = {
    tag: animal.tag,
    name: animal.name,
    breed: animal.breed,
    sex: animal.sex === 'F' ? 'Female' : animal.sex === 'M' ? 'Male' : animal.sex,
    color: animal.color,
    dob: animal.dob,
    weight: animal.weight,
    sire: animal.sire,
    dam: animal.dam,
    owner: animal.owner,
    registration: animal.registration,
    tattoo: animal.tattoo,
    group: groupName,
    status: animal.status,
    purchaseDate: animal.purchaseDate,
    purchasePrice: animal.purchasePrice,
    vendor: animal.vendor,
    pregnancyStatus: animal.pregnancyStatus,
    expectedDue: animal.expectedDue,
    parity: animal.parity,
    lactationStatus: animal.lactationStatus,
    notes: animal.notes,
  }

  return (
    <>
      <SectionActions
        name="Basic Information"
        onJSON={() => downloadJSON(data, tag + '_basic')}
        onCSV={() => downloadCSV(data, tag + '_basic')}
        onPDF={() => downloadPDF(data, tag + '_basic', 'Basic Information Record')}
      />
      <InfoGrid items={[
        ['Tag', animal.tag], ['Name', animal.name], ['Breed', animal.breed],
        ['Sex', animal.sex === 'F' ? 'Female' : animal.sex === 'M' ? 'Male' : animal.sex], ['Color', animal.color],
        ['Date of Birth', animal.dob], ['Weight', animal.weight ? animal.weight + ' kg' : ''],
        ['Sire', animal.sire], ['Dam', animal.dam], ['Owner', animal.owner],
        ['Registration', animal.registration], ['Tattoo/ID', animal.tattoo], ['Group', groupName],
        ['Status', animal.status], ['Purchase Date', animal.purchaseDate],
        ['Purchase Price', animal.purchasePrice ? fmtCurrency(animal.purchasePrice) : ''],
        ['Vendor', animal.vendor], ['Pregnancy', animal.pregnancyStatus],
        ['Expected Due', animal.expectedDue], ['Parity', animal.parity], ['Lactation', animal.lactationStatus],
      ]} />
      {animal.notes && <div style={{ marginTop: 12, padding: 10, background: '#f9fafb', borderRadius: 8, border: '1px solid #e5e7eb' }}><strong>Notes</strong><div style={{ marginTop: 6 }}>{animal.notes}</div></div>}
    </>
  )
}

function SectionProduction({ animal, tag }) {
  const p = animal.production || {}
  const milk = p.milk || {}
  const eggs = p.eggs || {}
  const meat = p.meat || {}
  const wool = p.wool || {}
  const work = p.work || {}
  const offspring = p.offspring || {}

  const rows = [
    { metric: 'Milk Total Lifetime', value: milk.totalLifetime },
    { metric: 'Milk Current Lactation', value: milk.currentLactation },
    { metric: 'Milk Peak Yield', value: milk.peakYield },
    { metric: 'Milk Average Daily', value: milk.averageDaily },
    { metric: 'Milk Last Recorded', value: milk.lastRecorded },
    { metric: 'Eggs Total Lifetime', value: eggs.totalLifetime },
    { metric: 'Eggs Current Year', value: eggs.currentYear },
    { metric: 'Eggs Average Daily', value: eggs.averageDaily },
    { metric: 'Meat Expected Yield', value: meat.expectedYield },
    { metric: 'Meat Dressed Weight', value: meat.dressedWeight },
    { metric: 'Meat Grading Score', value: meat.gradingScore },
    { metric: 'Wool Total Lifetime', value: wool.totalLifetime },
    { metric: 'Wool Last Shearing', value: wool.lastShearing },
    { metric: 'Wool Average Yield', value: wool.averageYield },
    { metric: 'Wool Quality', value: wool.quality },
    { metric: 'Work Hours', value: work.hoursWorked },
    { metric: 'Work Tasks Completed', value: work.tasksCompleted },
    { metric: 'Work Efficiency', value: work.efficiency },
    { metric: 'Offspring Total Born', value: offspring.totalBorn },
    { metric: 'Offspring Total Weaned', value: offspring.totalWeaned },
    { metric: 'Offspring Total Survived', value: offspring.totalSurvived },
  ]

  return (
    <>
      <SectionActions
        name="Production"
        onJSON={() => downloadJSON(p, tag + '_production')}
        onCSV={() => downloadCSV(rows, tag + '_production')}
        onPDF={() => downloadPDF(rows, tag + '_production', 'Production Record')}
      />
      <DataTable columns={[{ key: 'metric', label: 'Metric' }, { key: 'value', label: 'Value' }]} rows={rows} empty="No production records." />
    </>
  )
}

function SectionHealth({ animal, tag }) {
  const h = animal.health || {}
  const vaccinations = Array.isArray(h.vaccinations) ? h.vaccinations : []
  const treatments = Array.isArray(h.treatments) ? h.treatments : []
  const diagnoses = Array.isArray(h.diagnoses) ? h.diagnoses : []

  return (
    <>
      <SectionActions
        name="Health"
        onJSON={() => downloadJSON(h, tag + '_health')}
        onCSV={() => downloadCSV({
          healthStatus: h.healthStatus,
          bodyConditionScore: h.bodyConditionScore,
          lastVetVisit: h.lastVetVisit,
          nextVetVisit: h.nextVetVisit,
          quarantineStatus: h.quarantineStatus,
          allergies: JSON.stringify(h.allergies || []),
          chronicConditions: JSON.stringify(h.chronicConditions || []),
        }, tag + '_health')}
        onPDF={() => downloadPDF({
          healthStatus: h.healthStatus,
          bodyConditionScore: h.bodyConditionScore,
          lastVetVisit: h.lastVetVisit,
          nextVetVisit: h.nextVetVisit,
          quarantineStatus: h.quarantineStatus,
          allergies: JSON.stringify(h.allergies || []),
          chronicConditions: JSON.stringify(h.chronicConditions || []),
          vaccinations: JSON.stringify(vaccinations),
          treatments: JSON.stringify(treatments),
          diagnoses: JSON.stringify(diagnoses),
        }, tag + '_health', 'Health Record')}
      />
      <InfoGrid items={[
        ['Health Status', h.healthStatus], ['Body Condition Score', h.bodyConditionScore],
        ['Last Vet Visit', h.lastVetVisit], ['Next Vet Visit', h.nextVetVisit],
        ['Quarantine Status', h.quarantineStatus],
        ['Allergies', Array.isArray(h.allergies) ? h.allergies.join(', ') : h.allergies],
        ['Chronic Conditions', Array.isArray(h.chronicConditions) ? h.chronicConditions.join(', ') : h.chronicConditions],
      ]} />

      <div style={{ marginTop: 14 }}>
        <h5 style={{ margin: '0 0 6px', color: '#374151' }}>Vaccinations</h5>
        <DataTable
          columns={[{ key: 'vaccine', label: 'Vaccine' }, { key: 'date', label: 'Date' }, { key: 'nextDue', label: 'Next Due' }, { key: 'notes', label: 'Notes' }]}
          rows={vaccinations.map(v => typeof v === 'string' ? { vaccine: v } : v)}
          empty="No vaccination records."
        />
      </div>

      <div style={{ marginTop: 14 }}>
        <h5 style={{ margin: '0 0 6px', color: '#374151' }}>Treatments</h5>
        <DataTable
          columns={[{ key: 'type', label: 'Type' }, { key: 'date', label: 'Date' }, { key: 'medication', label: 'Medication' }, { key: 'dosage', label: 'Dosage' }, { key: 'notes', label: 'Notes' }]}
          rows={treatments.map(t => typeof t === 'string' ? { type: t } : t)}
          empty="No treatment records."
        />
      </div>

      <div style={{ marginTop: 14 }}>
        <h5 style={{ margin: '0 0 6px', color: '#374151' }}>Diagnoses</h5>
        <DataTable
          columns={[{ key: 'condition', label: 'Condition' }, { key: 'date', label: 'Date' }, { key: 'severity', label: 'Severity' }, { key: 'notes', label: 'Notes' }]}
          rows={diagnoses.map(d => typeof d === 'string' ? { condition: d } : d)}
          empty="No diagnosis records."
        />
      </div>
    </>
  )
}

function SectionSimpleObject({ name, data, tag }) {
  const safe = data || {}
  const rows = Object.entries(safe).map(([key, value]) => ({ field: key, value: typeof value === 'object' ? JSON.stringify(value) : value }))
  return (
    <>
      <SectionActions
        name={name}
        onJSON={() => downloadJSON(safe, tag + '_' + name.toLowerCase())}
        onCSV={() => downloadCSV(rows, tag + '_' + name.toLowerCase())}
        onPDF={() => downloadPDF(rows, tag + '_' + name.toLowerCase(), `${name} Record`)}
      />
      <DataTable columns={[{ key: 'field', label: 'Field' }, { key: 'value', label: 'Value' }]} rows={rows} empty={`No ${name.toLowerCase()} data.`} />
    </>
  )
}

function useFilteredRecords(key, animalId, predicate) {
  const [records, setRecords] = useState([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key)
      if (!raw) return setRecords([])
      const list = JSON.parse(raw)
      if (!Array.isArray(list)) return setRecords([])
      if (predicate) return setRecords(list.filter(item => predicate(item, animalId)))
      return setRecords(list.filter(item => item && item.animalId === animalId))
    } catch {
      setRecords([])
    }
  }, [key, animalId, predicate])

  return records
}

function SectionFeedingRecords({ animalId, tag }) {
  const records = useFilteredRecords('rumen8:feedingEvents', animalId)
  return (
    <>
      <SectionActions
        name="Feeding Records"
        onJSON={() => downloadJSON(records, tag + '_feeding')}
        onCSV={() => downloadCSV(records, tag + '_feeding')}
        onPDF={() => downloadPDF(records, tag + '_feeding', 'Feeding Records')}
      />
      <DataTable
        columns={[
          { key: 'date', label: 'Date' }, { key: 'feedType', label: 'Feed Type' }, { key: 'rationName', label: 'Ration' },
          { key: 'quantity', label: 'Qty' }, { key: 'session', label: 'Session' }, { key: 'fedBy', label: 'Fed By' }, { key: 'notes', label: 'Notes' },
        ]}
        rows={records}
        empty="No feeding records for this animal."
      />
    </>
  )
}

function SectionTreatmentRecords({ animalId, tag }) {
  const records = useFilteredRecords('cattalytics:animal:treatment', animalId)
  return (
    <>
      <SectionActions
        name="Treatment Records"
        onJSON={() => downloadJSON(records, tag + '_treatments')}
        onCSV={() => downloadCSV(records, tag + '_treatments')}
        onPDF={() => downloadPDF(records, tag + '_treatments', 'Treatment Records')}
      />
      <DataTable
        columns={[
          { key: 'date', label: 'Date' }, { key: 'treatmentType', label: 'Type' }, { key: 'treatment', label: 'Treatment' },
          { key: 'medication', label: 'Medication' }, { key: 'dosage', label: 'Dosage' }, { key: 'veterinarian', label: 'Vet' },
          { key: 'cost', label: 'Cost', render: v => v !== undefined && v !== null && v !== '' ? fmtCurrency(v) : '—' },
          { key: 'status', label: 'Status' }, { key: 'severity', label: 'Severity' }, { key: 'notes', label: 'Notes' },
        ]}
        rows={records}
        empty="No treatment records for this animal."
      />
    </>
  )
}

function SectionBreedingRecords({ animalId, tag }) {
  const records = useFilteredRecords('cattalytics:animal:breeding', animalId, (r, id) => r.animalId === id || r.sireId === id)
  return (
    <>
      <SectionActions
        name="Breeding Records"
        onJSON={() => downloadJSON(records, tag + '_breeding')}
        onCSV={() => downloadCSV(records, tag + '_breeding')}
        onPDF={() => downloadPDF(records, tag + '_breeding', 'Breeding Records')}
      />
      <DataTable
        columns={[
          { key: 'date', label: 'Date' }, { key: 'breedingMethod', label: 'Method' },
          { key: 'sireId', label: 'Sire ID' }, { key: 'status', label: 'Status' },
          { key: 'pregnancyConfirmed', label: 'Pregnancy' }, { key: 'expectedDue', label: 'Expected Due' },
          { key: 'calvingDate', label: 'Calving Date' }, { key: 'offspringCount', label: 'Offspring' },
          { key: 'notes', label: 'Notes' },
        ]}
        rows={records}
        empty="No breeding records for this animal."
      />
    </>
  )
}

function SectionMilkYieldRecords({ animalId, tag }) {
  const records = useFilteredRecords('cattalytics:animal:milkyield', animalId)
  const totalYield = records.reduce((sum, r) => sum + (parseFloat(r.totalYield || r.yield || 0) || 0), 0)

  return (
    <>
      <SectionActions
        name="Milk Yield Records"
        onJSON={() => downloadJSON(records, tag + '_milkyield')}
        onCSV={() => downloadCSV(records, tag + '_milkyield')}
        onPDF={() => downloadPDF(records, tag + '_milkyield', 'Milk Yield Records')}
      />
      {records.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(140px, 1fr))', gap: 10, marginBottom: 12 }}>
          <div style={{ background: '#f0f9ff', border: '1px solid #dbeafe', borderRadius: 8, padding: 10 }}>
            <div style={{ fontSize: '0.75rem', color: '#4b5563', fontWeight: 700 }}>TOTAL RECORDS</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0ea5e9' }}>{records.length}</div>
          </div>
          <div style={{ background: '#ecfdf5', border: '1px solid #d1fae5', borderRadius: 8, padding: 10 }}>
            <div style={{ fontSize: '0.75rem', color: '#4b5563', fontWeight: 700 }}>TOTAL YIELD</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#059669' }}>{totalYield.toFixed(1)} L</div>
          </div>
        </div>
      )}
      <DataTable
        columns={[
          { key: 'date', label: 'Date' }, { key: 'milkingSession', label: 'Session' },
          { key: 'yield', label: 'AM (L)' }, { key: 'pmYield', label: 'PM (L)' },
          { key: 'totalYield', label: 'Total (L)' }, { key: 'milkQuality', label: 'Quality' },
          { key: 'fatContent', label: 'Fat %' }, { key: 'proteinContent', label: 'Protein %' }, { key: 'notes', label: 'Notes' },
        ]}
        rows={records}
        empty="No milk yield records for this animal."
      />
    </>
  )
}

function SectionMeasurementRecords({ animalId, tag }) {
  const records = useFilteredRecords('cattalytics:animal:measurement', animalId)
  return (
    <>
      <SectionActions
        name="Measurement Records"
        onJSON={() => downloadJSON(records, tag + '_measurements')}
        onCSV={() => downloadCSV(records, tag + '_measurements')}
        onPDF={() => downloadPDF(records, tag + '_measurements', 'Measurement Records')}
      />
      <DataTable
        columns={[
          { key: 'date', label: 'Date' }, { key: 'weight', label: 'Weight (kg)' }, { key: 'bcs', label: 'BCS' },
          { key: 'heartGirth', label: 'Heart Girth' }, { key: 'bodyLength', label: 'Body Length' },
          { key: 'withersHeight', label: 'Withers Height' }, { key: 'hipWidth', label: 'Hip Width' },
          { key: 'measuredBy', label: 'Measured By' }, { key: 'notes', label: 'Notes' },
        ]}
        rows={records}
        empty="No measurement records for this animal."
      />
    </>
  )
}

const TABS = [
  { id: 'basic', label: 'Basic' },
  { id: 'production', label: 'Production' },
  { id: 'health', label: 'Health' },
  { id: 'genetics', label: 'Genetics' },
  { id: 'financial', label: 'Financial' },
  { id: 'documentation', label: 'Docs' },
  { id: 'certifications', label: 'Certs' },
  { id: 'behavior', label: 'Behavior' },
  { id: 'nutrition', label: 'Nutrition' },
  { id: 'performance', label: 'Performance' },
  { id: 'location', label: 'Location' },
  { id: 'events', label: 'Events' },
  { id: 'feeding', label: 'Feeding Records' },
  { id: 'treatments', label: 'Treatment Records' },
  { id: 'breeding', label: 'Breeding Records' },
  { id: 'milkyield', label: 'Milk Yield Records' },
  { id: 'measurements', label: 'Measurement Records' },
]

export default function AnimalCV({ animal = {}, groups = [], onClose = () => {}, onDownloadJSON = () => {} }) {
  const rootRef = useRef(null)
  const [tab, setTab] = useState('basic')
  const groupName = groups.find(g => g.id === animal.groupId)?.name || 'No group'
  const tag = animal.tag || animal.id || 'animal'

  function downloadRenderedCV(filename = 'animal_cv.html') {
    try {
      const node = rootRef.current
      if (!node) {
        alert('CV content not available')
        return
      }
      const css = [
        'body{font-family:Arial,Helvetica,sans-serif;color:#111827;padding:20px;max-width:1000px;margin:0 auto}',
        'table{width:100%;border-collapse:collapse}',
        'th,td{padding:7px 10px;border:1px solid #e5e7eb;text-align:left}',
        'th{background:#f3f4f6}',
        'button{display:none!important}',
      ].join('')

      const html = `<!doctype html><html><head><meta charset="utf-8"/><title>${animal.name || tag}</title><meta name="viewport" content="width=device-width,initial-scale=1"/><style>${css}</style></head><body>${node.innerHTML}</body></html>`
      const blob = new Blob([html], { type: 'text/html' })
      downloadBlob(blob, filename)
    } catch (err) {
      console.error('Download CV failed', err)
      alert('Failed to download CV: ' + (err.message || err))
    }
  }

  function downloadFullCSV() {
    const h = animal.health || {}
    const f = animal.financial || {}
    const p = animal.production || {}
    const milk = p.milk || {}

    downloadCSV({
      id: animal.id,
      tag: animal.tag,
      name: animal.name,
      breed: animal.breed,
      sex: animal.sex,
      dob: animal.dob,
      weight: animal.weight,
      group: groupName,
      status: animal.status,
      owner: animal.owner,
      healthStatus: h.healthStatus,
      bodyConditionScore: h.bodyConditionScore,
      milkLifetime: milk.totalLifetime,
      milkAverageDaily: milk.averageDaily,
      acquisitionCost: f.acquisitionCost,
      currentValue: f.currentValue,
      veterinaryCost: f.veterinaryCost,
      feedCost: f.feedCost,
      profitLoss: f.profitLoss,
      notes: animal.notes,
    }, tag + '_full_record')
  }

  function downloadFullPDF() {
    const h = animal.health || {}
    const f = animal.financial || {}
    const p = animal.production || {}
    const milk = p.milk || {}

    downloadPDF({
      id: animal.id,
      tag: animal.tag,
      name: animal.name,
      breed: animal.breed,
      sex: animal.sex,
      dob: animal.dob,
      weight: animal.weight,
      group: groupName,
      status: animal.status,
      owner: animal.owner,
      sire: animal.sire,
      dam: animal.dam,
      healthStatus: h.healthStatus,
      bodyConditionScore: h.bodyConditionScore,
      milkLifetime: milk.totalLifetime,
      milkAverageDaily: milk.averageDaily,
      acquisitionCost: f.acquisitionCost,
      currentValue: f.currentValue,
      veterinaryCost: f.veterinaryCost,
      feedCost: f.feedCost,
      profitLoss: f.profitLoss,
      notes: animal.notes,
    }, tag + '_full_record', 'Full Animal Record')
  }

  const tabButton = (id) => ({
    padding: '10px 14px',
    border: 'none',
    borderBottom: tab === id ? '3px solid #059669' : '3px solid transparent',
    background: tab === id ? '#f0fdf4' : 'transparent',
    color: tab === id ? '#059669' : '#6b7280',
    fontWeight: tab === id ? 700 : 500,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    fontSize: '13px',
  })

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
      <div ref={rootRef} style={{ width: '100%', maxWidth: 1080, maxHeight: '92vh', overflow: 'hidden', background: '#fff', borderRadius: 12, boxShadow: '0 12px 40px rgba(2,6,23,0.3)' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ margin: 0 }}>{animal.name || tag}</h2>
            <div style={{ color: '#4b5563', marginTop: 2 }}>{animal.tag} • {animal.breed} • {animal.sex === 'F' ? 'Female' : 'Male'}</div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={() => onDownloadJSON()} style={{ padding: '8px 12px', background: '#111827', color: 'white', border: 'none', borderRadius: 6 }}>JSON</button>
            <button onClick={downloadFullCSV} style={{ padding: '8px 12px', background: '#059669', color: 'white', border: 'none', borderRadius: 6 }}>CSV</button>
            <button onClick={downloadFullPDF} style={{ padding: '8px 12px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 6 }}>PDF</button>
            <button onClick={() => downloadRenderedCV(`${tag}_cv.html`)} style={{ padding: '8px 12px', background: '#0ea5e9', color: 'white', border: 'none', borderRadius: 6 }}>HTML</button>
            <button onClick={onClose} style={{ padding: '8px 12px', background: '#fee2e2', color: '#9b1c1c', border: 'none', borderRadius: 6 }}>Close</button>
          </div>
        </div>

        <div style={{ borderBottom: '1px solid #e5e7eb', overflowX: 'auto', whiteSpace: 'nowrap', background: '#fafafa' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={tabButton(t.id)}>{t.label}</button>
          ))}
        </div>

        <div style={{ padding: 16, overflow: 'auto', maxHeight: 'calc(92vh - 130px)' }}>
          {tab === 'basic' && <SectionBasic animal={animal} groupName={groupName} tag={tag} />}
          {tab === 'production' && <SectionProduction animal={animal} tag={tag} />}
          {tab === 'health' && <SectionHealth animal={animal} tag={tag} />}
          {tab === 'genetics' && <SectionSimpleObject name="Genetics" data={animal.genetics || {}} tag={tag} />}
          {tab === 'financial' && <SectionSimpleObject name="Financial" data={animal.financial || {}} tag={tag} />}
          {tab === 'documentation' && <SectionSimpleObject name="Documentation" data={animal.documentation || {}} tag={tag} />}
          {tab === 'certifications' && <SectionSimpleObject name="Certifications" data={animal.certifications || {}} tag={tag} />}
          {tab === 'behavior' && <SectionSimpleObject name="Behavior" data={animal.behavior || {}} tag={tag} />}
          {tab === 'nutrition' && <SectionSimpleObject name="Nutrition" data={animal.nutrition || {}} tag={tag} />}
          {tab === 'performance' && <SectionSimpleObject name="Performance" data={animal.performance || {}} tag={tag} />}
          {tab === 'location' && <SectionSimpleObject name="Location" data={animal.location || {}} tag={tag} />}
          {tab === 'events' && <SectionSimpleObject name="Events" data={animal.events || []} tag={tag} />}
          {tab === 'feeding' && <SectionFeedingRecords animalId={animal.id} tag={tag} />}
          {tab === 'treatments' && <SectionTreatmentRecords animalId={animal.id} tag={tag} />}
          {tab === 'breeding' && <SectionBreedingRecords animalId={animal.id} tag={tag} />}
          {tab === 'milkyield' && <SectionMilkYieldRecords animalId={animal.id} tag={tag} />}
          {tab === 'measurements' && <SectionMeasurementRecords animalId={animal.id} tag={tag} />}
        </div>
      </div>
    </div>
  )
}
