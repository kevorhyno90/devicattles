import React, { useMemo } from 'react'
import { exportToCSV, exportToJSON, exportToPDF } from '../../lib/exportImport'

function countBy(records, cropId) {
  return records.filter(r => r.cropId === cropId).length
}

function normalizeRowsForExport(crop, bundle) {
  const rows = []

  const salesTotal = bundle.sales.reduce((sum, row) => sum + (Number(row.totalValue) || (Number(row.quantity) * Number(row.unitPrice)) || 0), 0)
  const treatmentCost = bundle.treatments.reduce((sum, row) => sum + (Number(row.cost) || 0), 0)
  const ledgerCost = bundle.costs.reduce((sum, row) => sum + (Number(row.amount) || 0), 0)
  const seedCost = Number(crop.seedCost) || 0
  const totalCost = seedCost + treatmentCost + ledgerCost
  const margin = salesTotal - totalCost
  const marginPct = salesTotal > 0 ? (margin / salesTotal) * 100 : 0

  rows.push({
    section: 'Crop Profile',
    cropId: crop.id,
    cropName: crop.name,
    date: crop.planted || '',
    item: `Variety: ${crop.variety || 'N/A'}`,
    quantity: crop.area || '',
    value: crop.status || ''
  })

  rows.push({
    section: 'Profitability',
    cropId: crop.id,
    cropName: crop.name,
    date: '',
    item: `Revenue KES ${salesTotal.toFixed(2)} | Cost KES ${totalCost.toFixed(2)}`,
    quantity: `Margin ${marginPct.toFixed(1)}%`,
    value: margin.toFixed(2)
  })

  bundle.yields.forEach(r => rows.push({
    section: 'Yields',
    cropId: crop.id,
    cropName: crop.name,
    date: r.date || '',
    item: `${r.grade || 'N/A'} yield`,
    quantity: `${r.quantity || ''} ${r.unit || ''}`.trim(),
    value: r.losses || ''
  }))

  bundle.sales.forEach(r => rows.push({
    section: 'Sales',
    cropId: crop.id,
    cropName: crop.name,
    date: r.date || '',
    item: r.buyer || r.market || 'Sale record',
    quantity: `${r.quantity || ''} ${r.unit || ''}`.trim(),
    value: r.totalValue || ''
  }))

  bundle.treatments.forEach(r => rows.push({
    section: 'Treatments',
    cropId: crop.id,
    cropName: crop.name,
    date: r.date || '',
    item: r.inputName || r.category || 'Treatment',
    quantity: r.dosage || '',
    value: r.cost || ''
  }))

  bundle.costs.forEach(r => rows.push({
    section: 'Costs',
    cropId: crop.id,
    cropName: crop.name,
    date: r.date || '',
    item: `${r.category || 'Cost'}${r.vendor ? ` - ${r.vendor}` : ''}`,
    quantity: r.reference || '',
    value: r.amount || ''
  }))

  ;(bundle.subsectionRecords || []).forEach(r => rows.push({
    section: 'Subsection Records',
    cropId: crop.id,
    cropName: crop.name,
    date: r.date || '',
    item: `${r.domain || 'General'}: ${r.subsection || 'Record'}`,
    quantity: r.quantity ? `${r.quantity || ''} ${r.unit || ''}`.trim() : (r.status || ''),
    value: r.value || r.notes || ''
  }))

  bundle.pests.forEach(r => rows.push({
    section: 'Pests',
    cropId: crop.id,
    cropName: crop.name,
    date: r.date || '',
    item: r.pest || 'Pest record',
    quantity: r.severity || '',
    value: r.action || ''
  }))

  bundle.diseases.forEach(r => rows.push({
    section: 'Diseases',
    cropId: crop.id,
    cropName: crop.name,
    date: r.date || '',
    item: r.disease || 'Disease record',
    quantity: r.severity || '',
    value: r.action || ''
  }))

  bundle.reminders.forEach(r => rows.push({
    section: 'Reminders',
    cropId: crop.id,
    cropName: crop.name,
    date: r.date || '',
    item: r.message || 'Reminder',
    quantity: '',
    value: ''
  }))

  return rows
}

export default function CropCV({
  crops,
  yieldRecords,
  salesRecords,
  treatmentRecords,
  costRecords,
  subsectionRecords = [],
  pestRecords,
  diseaseRecords,
  reminders,
  plantSubmodule,
  plantMeta
}) {
  const visibleCrops = useMemo(() => {
    if (plantSubmodule === 'all') return crops
    return crops.filter(c => c.plantSubmodule === plantSubmodule)
  }, [crops, plantSubmodule])

  const moduleLabel = plantSubmodule === 'all' ? 'All Plant Modules' : (plantMeta[plantSubmodule]?.label || plantSubmodule)

  const resolveCropModule = (crop) => {
    const direct = String(crop?.plantSubmodule || '').trim()
    if (direct && plantMeta[direct]) return direct

    const name = String(crop?.name || '').toLowerCase()
    const cropType = String(crop?.cropType || '').toLowerCase()
    for (const [key, meta] of Object.entries(plantMeta || {})) {
      if ((meta.aliases || []).some(alias => name.includes(String(alias).toLowerCase()))) return key
    }

    if (cropType === 'vegetable') return 'vegetables'
    if (cropType === 'fruit') return 'fruits'
    return ''
  }

  const buildModuleBundle = (moduleKey) => {
    const moduleCrops = crops.filter(c => resolveCropModule(c) === moduleKey)
    const cropIds = new Set(moduleCrops.map(c => c.id))
    const include = (r) => cropIds.has(r.cropId)
    return {
      moduleKey,
      module: plantMeta[moduleKey]?.label || moduleKey,
      generatedAt: new Date().toISOString(),
      crops: moduleCrops,
      yields: yieldRecords.filter(include),
      sales: salesRecords.filter(include),
      treatments: treatmentRecords.filter(include),
      costs: costRecords.filter(include),
      subsectionRecords: subsectionRecords.filter(include),
      pests: pestRecords.filter(include),
      diseases: diseaseRecords.filter(include),
      reminders: reminders.filter(include)
    }
  }

  const totals = useMemo(() => {
    const cropIds = new Set(visibleCrops.map(c => c.id))
    const include = (r) => cropIds.has(r.cropId)

    return {
      crops: visibleCrops.length,
      yields: yieldRecords.filter(include).length,
      sales: salesRecords.filter(include).length,
      treatments: treatmentRecords.filter(include).length,
      costs: costRecords.filter(include).length,
      subsectionRecords: subsectionRecords.filter(include).length,
      pests: pestRecords.filter(include).length,
      diseases: diseaseRecords.filter(include).length,
      reminders: reminders.filter(include).length,
      revenue: salesRecords.filter(include).reduce((sum, row) => sum + (Number(row.totalValue) || (Number(row.quantity) * Number(row.unitPrice)) || 0), 0),
      cost: visibleCrops.reduce((sum, crop) => {
        const treatmentCost = treatmentRecords.filter(r => r.cropId === crop.id).reduce((inner, row) => inner + (Number(row.cost) || 0), 0)
        const ledgerCost = costRecords.filter(r => r.cropId === crop.id).reduce((inner, row) => inner + (Number(row.amount) || 0), 0)
        return sum + (Number(crop.seedCost) || 0) + treatmentCost + ledgerCost
      }, 0)
    }
  }, [visibleCrops, yieldRecords, salesRecords, treatmentRecords, costRecords, subsectionRecords, pestRecords, diseaseRecords, reminders])

  const totalsWithMargin = {
    ...totals,
    margin: totals.revenue - totals.cost,
    marginPct: totals.revenue > 0 ? ((totals.revenue - totals.cost) / totals.revenue) * 100 : 0
  }

  const exportModuleJSON = () => {
    const cropIds = new Set(visibleCrops.map(c => c.id))
    const include = (r) => cropIds.has(r.cropId)
    const payload = {
      module: moduleLabel,
      generatedAt: new Date().toISOString(),
      crops: visibleCrops,
      yields: yieldRecords.filter(include),
      sales: salesRecords.filter(include),
      treatments: treatmentRecords.filter(include),
      costs: costRecords.filter(include),
      subsectionRecords: subsectionRecords.filter(include),
      pests: pestRecords.filter(include),
      diseases: diseaseRecords.filter(include),
      reminders: reminders.filter(include)
    }
    exportToJSON(payload, `crop_cv_${moduleLabel.replace(/\s+/g, '_').toLowerCase()}_${new Date().toISOString().slice(0, 10)}.json`)
  }

  const exportModuleCSV = () => {
    const rows = []
    visibleCrops.forEach(crop => {
      const bundle = {
        yields: yieldRecords.filter(r => r.cropId === crop.id),
        sales: salesRecords.filter(r => r.cropId === crop.id),
        treatments: treatmentRecords.filter(r => r.cropId === crop.id),
        costs: costRecords.filter(r => r.cropId === crop.id),
        subsectionRecords: subsectionRecords.filter(r => r.cropId === crop.id),
        pests: pestRecords.filter(r => r.cropId === crop.id),
        diseases: diseaseRecords.filter(r => r.cropId === crop.id),
        reminders: reminders.filter(r => r.cropId === crop.id)
      }
      rows.push(...normalizeRowsForExport(crop, bundle))
    })
    exportToCSV(rows, `crop_cv_${moduleLabel.replace(/\s+/g, '_').toLowerCase()}_${new Date().toISOString().slice(0, 10)}.csv`)
  }

  const exportModulePDF = () => {
    const rows = []
    visibleCrops.forEach(crop => {
      const bundle = {
        yields: yieldRecords.filter(r => r.cropId === crop.id),
        sales: salesRecords.filter(r => r.cropId === crop.id),
        treatments: treatmentRecords.filter(r => r.cropId === crop.id),
        costs: costRecords.filter(r => r.cropId === crop.id),
        subsectionRecords: subsectionRecords.filter(r => r.cropId === crop.id),
        pests: pestRecords.filter(r => r.cropId === crop.id),
        diseases: diseaseRecords.filter(r => r.cropId === crop.id),
        reminders: reminders.filter(r => r.cropId === crop.id)
      }
      rows.push(...normalizeRowsForExport(crop, bundle))
    })
    exportToPDF(rows, `crop_cv_${moduleLabel.replace(/\s+/g, '_').toLowerCase()}_${new Date().toISOString().slice(0, 10)}.pdf`, `${moduleLabel} Crop CV`)
  }

  const exportCropBundle = (crop) => {
    const bundle = {
      crop,
      yields: yieldRecords.filter(r => r.cropId === crop.id),
      sales: salesRecords.filter(r => r.cropId === crop.id),
      treatments: treatmentRecords.filter(r => r.cropId === crop.id),
      costs: costRecords.filter(r => r.cropId === crop.id),
      subsectionRecords: subsectionRecords.filter(r => r.cropId === crop.id),
      pests: pestRecords.filter(r => r.cropId === crop.id),
      diseases: diseaseRecords.filter(r => r.cropId === crop.id),
      reminders: reminders.filter(r => r.cropId === crop.id)
    }
    exportToJSON(bundle, `crop_cv_${crop.id}_${new Date().toISOString().slice(0, 10)}.json`)
  }

  const exportCropBundleCSV = (crop) => {
    const bundle = {
      yields: yieldRecords.filter(r => r.cropId === crop.id),
      sales: salesRecords.filter(r => r.cropId === crop.id),
      treatments: treatmentRecords.filter(r => r.cropId === crop.id),
      costs: costRecords.filter(r => r.cropId === crop.id),
      pests: pestRecords.filter(r => r.cropId === crop.id),
      diseases: diseaseRecords.filter(r => r.cropId === crop.id),
      reminders: reminders.filter(r => r.cropId === crop.id)
    }
    const rows = normalizeRowsForExport(crop, bundle)
    exportToCSV(rows, `crop_cv_${crop.id}_${new Date().toISOString().slice(0, 10)}.csv`)
  }

  const exportCropBundlePDF = (crop) => {
    const bundle = {
      yields: yieldRecords.filter(r => r.cropId === crop.id),
      sales: salesRecords.filter(r => r.cropId === crop.id),
      treatments: treatmentRecords.filter(r => r.cropId === crop.id),
      subsectionRecords: subsectionRecords.filter(r => r.cropId === crop.id),
      pests: pestRecords.filter(r => r.cropId === crop.id),
      diseases: diseaseRecords.filter(r => r.cropId === crop.id),
      reminders: reminders.filter(r => r.cropId === crop.id)
    }
    const rows = normalizeRowsForExport(crop, bundle)
    exportToPDF(rows, `crop_cv_${crop.id}_${new Date().toISOString().slice(0, 10)}.pdf`, `${crop.name} Crop CV`)
  }

  const exportAllModulesPack = () => {
    const stamp = new Date().toISOString().slice(0, 10)
    const moduleKeys = Object.keys(plantMeta || {})
    const manifest = []

    moduleKeys.forEach((moduleKey, index) => {
      const bundle = buildModuleBundle(moduleKey)
      const csvRows = []
      bundle.crops.forEach(crop => {
        const cropBundle = {
          yields: bundle.yields.filter(r => r.cropId === crop.id),
          sales: bundle.sales.filter(r => r.cropId === crop.id),
          treatments: bundle.treatments.filter(r => r.cropId === crop.id),
          costs: bundle.costs.filter(r => r.cropId === crop.id),
          subsectionRecords: bundle.subsectionRecords.filter(r => r.cropId === crop.id),
          pests: bundle.pests.filter(r => r.cropId === crop.id),
          diseases: bundle.diseases.filter(r => r.cropId === crop.id),
          reminders: bundle.reminders.filter(r => r.cropId === crop.id)
        }
        csvRows.push(...normalizeRowsForExport(crop, cropBundle))
      })

      manifest.push({
        moduleKey,
        module: bundle.module,
        crops: bundle.crops.length,
        yields: bundle.yields.length,
        sales: bundle.sales.length,
        treatments: bundle.treatments.length,
        costs: bundle.costs.length,
        subsectionRecords: bundle.subsectionRecords.length,
        pests: bundle.pests.length,
        diseases: bundle.diseases.length,
        reminders: bundle.reminders.length
      })

      // Stagger downloads to reduce browser blocking of multiple files.
      setTimeout(() => {
        exportToJSON(bundle, `crop_cv_pack_${moduleKey}_${stamp}.json`)
        if (csvRows.length > 0) {
          exportToCSV(csvRows, `crop_cv_pack_${moduleKey}_${stamp}.csv`)
        }
      }, index * 200)
    })

    setTimeout(() => {
      exportToJSON({ generatedAt: new Date().toISOString(), modules: manifest }, `crop_cv_pack_manifest_${stamp}.json`)
    }, moduleKeys.length * 220)
  }

  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
        <div>
          <h3 style={{ margin: '0 0 6px 0' }}>Crop CV Report Center</h3>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Comprehensive records for {moduleLabel}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={exportModuleJSON} style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #d1d5db', background: 'var(--bg-elevated)', cursor: 'pointer' }}>Export Module JSON</button>
          <button onClick={exportModuleCSV} style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #d1d5db', background: 'var(--bg-elevated)', cursor: 'pointer' }}>Export Module CSV</button>
          <button onClick={exportModulePDF} style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #d1d5db', background: 'var(--bg-elevated)', cursor: 'pointer' }}>Export Module PDF</button>
          <button onClick={exportAllModulesPack} style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #99f6e4', background: '#ecfeff', color: '#0f766e', cursor: 'pointer', fontWeight: 700 }}>Export All Modules CV Pack</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginBottom: 14 }}>
        <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 8, padding: 10 }}><strong>{totals.crops}</strong><div style={{ fontSize: 12 }}>Crops</div></div>
        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: 10 }}><strong>{totals.yields}</strong><div style={{ fontSize: 12 }}>Yield Logs</div></div>
        <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 8, padding: 10 }}><strong>{totals.sales}</strong><div style={{ fontSize: 12 }}>Sales Logs</div></div>
        <div style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 8, padding: 10 }}><strong>{totals.treatments}</strong><div style={{ fontSize: 12 }}>Treatment Logs</div></div>
        <div style={{ background: '#e0f2fe', border: '1px solid #7dd3fc', borderRadius: 8, padding: 10 }}><strong>{totals.costs}</strong><div style={{ fontSize: 12 }}>Cost Logs</div></div>
        <div style={{ background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 8, padding: 10 }}><strong>{totals.subsectionRecords}</strong><div style={{ fontSize: 12 }}>Subsection Logs</div></div>
        <div style={{ background: '#fff7ed', border: '1px solid #fdba74', borderRadius: 8, padding: 10 }}><strong>{totals.pests}</strong><div style={{ fontSize: 12 }}>Pest Logs</div></div>
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: 10 }}><strong>{totals.diseases}</strong><div style={{ fontSize: 12 }}>Disease Logs</div></div>
        <div style={{ background: '#ecfeff', border: '1px solid #a5f3fc', borderRadius: 8, padding: 10 }}><strong>KES {totalsWithMargin.revenue.toFixed(2)}</strong><div style={{ fontSize: 12 }}>Revenue</div></div>
        <div style={{ background: '#fff7ed', border: '1px solid #fdba74', borderRadius: 8, padding: 10 }}><strong>KES {totalsWithMargin.cost.toFixed(2)}</strong><div style={{ fontSize: 12 }}>Cost</div></div>
        <div style={{ background: totalsWithMargin.margin >= 0 ? '#ecfdf5' : '#fef2f2', border: totalsWithMargin.margin >= 0 ? '1px solid #86efac' : '1px solid #fecaca', borderRadius: 8, padding: 10 }}><strong>KES {totalsWithMargin.margin.toFixed(2)}</strong><div style={{ fontSize: 12 }}>Margin ({totalsWithMargin.marginPct.toFixed(1)}%)</div></div>
      </div>

      <div style={{ display: 'grid', gap: 10 }}>
        {visibleCrops.map(crop => (
          <div key={crop.id} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, background: 'var(--bg-elevated)' }}>
            {(() => {
              const salesTotal = salesRecords.filter(r => r.cropId === crop.id).reduce((sum, row) => sum + (Number(row.totalValue) || (Number(row.quantity) * Number(row.unitPrice)) || 0), 0)
              const treatmentCost = treatmentRecords.filter(r => r.cropId === crop.id).reduce((sum, row) => sum + (Number(row.cost) || 0), 0)
              const ledgerCost = costRecords.filter(r => r.cropId === crop.id).reduce((sum, row) => sum + (Number(row.amount) || 0), 0)
              const seedCost = Number(crop.seedCost) || 0
              const totalCost = seedCost + treatmentCost + ledgerCost
              const margin = salesTotal - totalCost
              const marginPct = salesTotal > 0 ? (margin / salesTotal) * 100 : 0

              return (
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontWeight: 700 }}>{crop.name} ({crop.id})</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  {plantMeta[crop.plantSubmodule]?.label || 'Unassigned'} • {crop.variety || 'No variety'} • {crop.status || 'No status'}
                </div>
                <div style={{ fontSize: 12, color: margin >= 0 ? '#15803d' : '#dc2626', fontWeight: 700, marginTop: 4 }}>
                  Revenue KES {salesTotal.toFixed(2)} • Cost KES {totalCost.toFixed(2)} • Margin KES {margin.toFixed(2)} ({marginPct.toFixed(1)}%)
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button onClick={() => exportCropBundle(crop)} style={{ padding: '6px 9px', borderRadius: 6, border: '1px solid #d1d5db', background: 'var(--bg-elevated)', cursor: 'pointer' }}>JSON</button>
                <button onClick={() => exportCropBundleCSV(crop)} style={{ padding: '6px 9px', borderRadius: 6, border: '1px solid #d1d5db', background: 'var(--bg-elevated)', cursor: 'pointer' }}>CSV</button>
                <button onClick={() => exportCropBundlePDF(crop)} style={{ padding: '6px 9px', borderRadius: 6, border: '1px solid #d1d5db', background: 'var(--bg-elevated)', cursor: 'pointer' }}>PDF</button>
              </div>
            </div>
              )
            })()}
            <div style={{ marginTop: 8, fontSize: 13, color: 'var(--text-primary)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 6 }}>
              <div>Yields: {countBy(yieldRecords, crop.id)}</div>
              <div>Sales: {countBy(salesRecords, crop.id)}</div>
              <div>Treatments: {countBy(treatmentRecords, crop.id)}</div>
              <div>Costs: {countBy(costRecords, crop.id)}</div>
              <div>Subsections: {countBy(subsectionRecords, crop.id)}</div>
              <div>Pests: {countBy(pestRecords, crop.id)}</div>
              <div>Diseases: {countBy(diseaseRecords, crop.id)}</div>
              <div>Reminders: {countBy(reminders, crop.id)}</div>
            </div>
          </div>
        ))}
        {visibleCrops.length === 0 && <div style={{ color: 'var(--text-secondary)' }}>No crops available in this plant module for CV reporting yet.</div>}
      </div>
    </div>
  )
}
