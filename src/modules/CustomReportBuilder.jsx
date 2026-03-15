import React, { useEffect, useMemo, useState } from 'react'
import { exportToCSV, exportToExcel, exportToJSON, exportToPDF, exportToDocx } from '../lib/exportImport'
import { buildProfessionalReportCatalog, buildProfessionalReportDocument } from '../lib/professionalReports'

const REPORT_DRAFTS_KEY = 'cattalytics:reports:native-drafts'

const MASTER_SCOPE = {
  visible: 'visible',
  all: 'all',
  module: 'module'
}

const REPORT_SECTION_HELP = {
  'Livestock - Dairy::Animal Registry': 'Master cattle register with base identification and profile attributes.',
  'Livestock - Dairy::Animal Groups': 'Animal grouping and classification used for herd-level planning.',
  'Livestock - Dairy::Measurements': 'Body measurements and growth tracking entries.',
  'Livestock - Dairy::Treatment Log': 'Clinical treatment interventions and care actions.',
  'Livestock - Dairy::Breeding Records': 'Breeding events, outcomes, and reproductive tracking.',
  'Livestock - Dairy::Milk Yield': 'Milk production records for yield analysis.',
  'Livestock - Dairy::Diet Plans': 'Nutritional plans and feed strategy records.',
  'Livestock - Dairy::Ration Logs': 'Daily ration and feeding execution logs.',
  'Livestock - Goat::Goat Registry': 'Core goat profile and registry records.',
  'Livestock - Goat::Health Records': 'Goat health incidents, treatments, and follow-ups.',
  'Livestock - Goat::Breeding Records': 'Goat breeding lifecycle entries.',
  'Livestock - Goat::Kids Registry': 'Kid inventory and identity records.',
  'Livestock - Goat::Kids Health': 'Kid-specific health and intervention records.',
  'Livestock - Poultry::Flocks': 'Flock-level organization and production grouping.',
  'Livestock - Poultry::Bird Registry': 'Individual/aggregate bird inventory records.',
  'Livestock - Poultry::Egg Production': 'Egg production monitoring and performance logs.',
  'Livestock - Poultry::Health Records': 'Poultry treatment and health management records.',
  'Livestock - Canine::Canine Registry': 'Farm canine inventory derived from animal records.',
  'Livestock - Canine::Health Records': 'Canine health events extracted from dog profiles.',
  'Livestock - Canine::Vaccination Records': 'Canine vaccine schedules and booster tracking.',
  'Livestock - Canine::Husbandry Log': 'Canine feeding, housing, exercise, and grooming logs.',
  'Livestock - BSF::Colonies': 'Black Soldier Fly colony stock records.',
  'Livestock - BSF::Feeding Log': 'BSF feeding and substrate management logs.',
  'Livestock - BSF::Harvest Log': 'BSF harvest records and output tracking.',
  'Crops::Crop Registry': 'Primary crop records across all crop families.',
  'Crops::Yield Ledger': 'Crop yield entries for productivity analysis.',
  'Crops::Sales Ledger': 'Crop sales records for revenue tracking.',
  'Crops::Treatment Ledger': 'Crop treatment and protection operations.',
  'Crops::Cost Ledger': 'Crop cost entries for margin and efficiency analysis.',
  'Employment::Employee Registry': 'Employee master records and role assignments.',
  'Employment::Off Planner': 'Staff off-days and scheduling plan.',
  'Employment::Leave Management': 'Leave requests, status, and approvals.',
  'Employment::Attendance Log': 'Employee attendance and presence entries.'
}

function getSectionHelp(moduleName, subsectionName) {
  const key = `${moduleName}::${subsectionName}`
  return REPORT_SECTION_HELP[key] || 'Operational subsection report generated from indexed records.'
}

function safeParse(raw, fallback) {
  try {
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : fallback
  } catch {
    return fallback
  }
}

function computeReportMetrics(report) {
  const rows = report?.rows || []
  const fields = report?.fields || []
  const totalCells = rows.length * fields.length

  if (!rows.length || !fields.length) {
    return {
      rowCount: rows.length,
      fieldCount: fields.length,
      fillRate: 0,
      emptyRate: 100,
      sampleFieldCoverage: []
    }
  }

  let populated = 0
  fields.forEach((field) => {
    rows.forEach((row) => {
      if (String(row[field] ?? '').trim() !== '') {
        populated += 1
      }
    })
  })

  const sampleFieldCoverage = fields.slice(0, 8).map((field) => {
    const withValue = rows.filter((row) => String(row[field] ?? '').trim() !== '').length
    return {
      field,
      withValue,
      coveragePct: Math.round((withValue / rows.length) * 100)
    }
  })

  const fillRate = Math.round((populated / totalCells) * 100)
  return {
    rowCount: rows.length,
    fieldCount: fields.length,
    fillRate,
    emptyRate: Math.max(0, 100 - fillRate),
    sampleFieldCoverage
  }
}

function buildAutoNarrative(report, metrics) {
  const generatedAt = new Date().toLocaleString()
  const topCoverage = (metrics.sampleFieldCoverage || [])
    .slice(0, 4)
    .map((f) => `${f.field}: ${f.coveragePct}%`)
    .join(', ')

  const nativeSummary = `${report.module} / ${report.subsection} currently holds ${metrics.rowCount} records across ${metrics.fieldCount} indexed fields. The data profile indicates ${metrics.fillRate}% field utilization, showing the operational depth captured in this section.`

  const detailedTechnicalReport = `Technical profile generated at ${generatedAt}. Source key ${report.storageKey} was scanned and normalized into a structured matrix for analytics and export. Primary populated fields include ${topCoverage || 'core fields pending stronger input coverage'}. This section is suitable for periodic compliance review, trend monitoring, and cross-module comparison.`

  const operationalRisks = metrics.fillRate < 65
    ? 'Data completeness is below 65%, which may affect audit reliability and downstream analytics confidence. Missing values should be backfilled before external reporting.'
    : 'Current data completeness is within acceptable operating range. Continue periodic validation to prevent stale or partial records from reducing report quality.'

  const correctiveActions = 'Recommended actions: enforce mandatory fields for critical events, schedule weekly data quality checks, and align subsection capture templates with operational SOPs.'

  return {
    nativeSummary,
    detailedTechnicalReport,
    operationalRisks,
    correctiveActions,
    editorNotes: '',
    updatedAt: new Date().toISOString()
  }
}

export default function CustomReportBuilder({ onOpenSection = null }) {
  const [catalog, setCatalog] = useState({ summary: { modules: 0, subsections: 0, totalRows: 0, generatedAt: new Date().toISOString() }, reports: [] })
  const [query, setQuery] = useState('')
  const [moduleFilter, setModuleFilter] = useState('all')
  const [subsectionFilter, setSubsectionFilter] = useState('all')
  const [selectedReportId, setSelectedReportId] = useState('')
  const [reportNotes, setReportNotes] = useState('')
  const [drafts, setDrafts] = useState({})
  const [masterScope, setMasterScope] = useState(MASTER_SCOPE.visible)
  const [masterTitle, setMasterTitle] = useState('Farm Master Technical Report')
  const [masterAudience, setMasterAudience] = useState('Management, Compliance, and Operations')
  const [autoRefresh, setAutoRefresh] = useState(false)

  const refreshCatalog = () => {
    const next = buildProfessionalReportCatalog()
    setCatalog(next)

    if (!selectedReportId && next.reports.length > 0) {
      setSelectedReportId(next.reports[0].id)
    }
  }

  useEffect(() => {
    refreshCatalog()
  }, [])

  useEffect(() => {
    const raw = localStorage.getItem(REPORT_DRAFTS_KEY)
    if (!raw) return
    setDrafts(safeParse(raw, {}))
  }, [])

  useEffect(() => {
    localStorage.setItem(REPORT_DRAFTS_KEY, JSON.stringify(drafts))
  }, [drafts])

  useEffect(() => {
    if (!autoRefresh) return undefined

    const id = setInterval(() => {
      refreshCatalog()
    }, 30000)

    return () => clearInterval(id)
  }, [autoRefresh, selectedReportId])

  const moduleOptions = useMemo(() => {
    return ['all', ...Array.from(new Set(catalog.reports.map((r) => r.module)))]
  }, [catalog])

  const subsectionOptions = useMemo(() => {
    const scoped = moduleFilter === 'all'
      ? catalog.reports
      : catalog.reports.filter((r) => r.module === moduleFilter)

    return ['all', ...Array.from(new Set(scoped.map((r) => r.subsection)))]
  }, [catalog, moduleFilter])

  const visibleReports = useMemo(() => {
    return catalog.reports.filter((report) => {
      if (moduleFilter !== 'all' && report.module !== moduleFilter) return false
      if (subsectionFilter !== 'all' && report.subsection !== subsectionFilter) return false
      if (!query.trim()) return true

      const q = query.toLowerCase()
      return (
        report.module.toLowerCase().includes(q) ||
        report.subsection.toLowerCase().includes(q) ||
        report.storageKey.toLowerCase().includes(q)
      )
    })
  }, [catalog, moduleFilter, subsectionFilter, query])

  const selectedReport = useMemo(() => {
    const fromVisible = visibleReports.find((r) => r.id === selectedReportId)
    if (fromVisible) return fromVisible
    return catalog.reports.find((r) => r.id === selectedReportId) || null
  }, [visibleReports, catalog, selectedReportId])

  const selectedReportHelp = useMemo(() => {
    if (!selectedReport) return ''
    return getSectionHelp(selectedReport.module, selectedReport.subsection)
  }, [selectedReport])

  useEffect(() => {
    if (selectedReport) return
    if (visibleReports.length > 0) setSelectedReportId(visibleReports[0].id)
  }, [visibleReports, selectedReport])

  const selectedDraft = useMemo(() => {
    if (!selectedReport) return null
    const existing = drafts[selectedReport.id]
    if (existing) return existing
    return buildAutoNarrative(selectedReport, computeReportMetrics(selectedReport))
  }, [drafts, selectedReport])

  const reportsForMaster = useMemo(() => {
    if (masterScope === MASTER_SCOPE.all) return catalog.reports
    if (masterScope === MASTER_SCOPE.module && selectedReport) {
      return catalog.reports.filter((r) => r.module === selectedReport.module)
    }
    return visibleReports
  }, [masterScope, visibleReports, catalog, selectedReport])

  const masterSections = useMemo(() => {
    return reportsForMaster.map((report) => {
      const metrics = computeReportMetrics(report)
      const draft = drafts[report.id] || buildAutoNarrative(report, metrics)
      return {
        id: report.id,
        module: report.module,
        subsection: report.subsection,
        storageKey: report.storageKey,
        rowCount: metrics.rowCount,
        fieldCount: metrics.fieldCount,
        fillRate: metrics.fillRate,
        nativeSummary: draft.nativeSummary || '',
        detailedTechnicalReport: draft.detailedTechnicalReport || '',
        operationalRisks: draft.operationalRisks || '',
        correctiveActions: draft.correctiveActions || '',
        editorNotes: draft.editorNotes || '',
        updatedAt: draft.updatedAt || new Date().toISOString()
      }
    })
  }, [reportsForMaster, drafts])

  const handleDraftFieldChange = (field, value) => {
    if (!selectedReport) return
    setDrafts((prev) => {
      const current = prev[selectedReport.id] || buildAutoNarrative(selectedReport, computeReportMetrics(selectedReport))
      return {
        ...prev,
        [selectedReport.id]: {
          ...current,
          [field]: value,
          updatedAt: new Date().toISOString()
        }
      }
    })
  }

  const regenerateSelectedNarrative = () => {
    if (!selectedReport) return
    const auto = buildAutoNarrative(selectedReport, computeReportMetrics(selectedReport))
    setDrafts((prev) => ({ ...prev, [selectedReport.id]: auto }))
  }

  const seedVisibleNarratives = () => {
    if (!visibleReports.length) return
    setDrafts((prev) => {
      const next = { ...prev }
      visibleReports.forEach((report) => {
        if (!next[report.id]) {
          next[report.id] = buildAutoNarrative(report, computeReportMetrics(report))
        }
      })
      return next
    })
  }

  const handleExport = async (format) => {
    if (!selectedReport) {
      alert('Select a report first.')
      return
    }

    const timestamp = new Date().toISOString().slice(0, 10)
    const base = `${selectedReport.module}-${selectedReport.subsection}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    const draft = drafts[selectedReport.id] || buildAutoNarrative(selectedReport, computeReportMetrics(selectedReport))
    const narrative = [
      `Native Summary: ${draft.nativeSummary || ''}`,
      `Detailed Technical Report: ${draft.detailedTechnicalReport || ''}`,
      `Operational Risks: ${draft.operationalRisks || ''}`,
      `Corrective Actions: ${draft.correctiveActions || ''}`,
      `Editor Notes: ${draft.editorNotes || ''}`,
      reportNotes ? `Professional Notes: ${reportNotes}` : ''
    ].filter(Boolean).join(' | ')

    const docRows = buildProfessionalReportDocument(selectedReport, narrative)

    if (format === 'csv') {
      exportToCSV(docRows, `${base}-professional-report-${timestamp}.csv`)
      return
    }

    if (format === 'excel') {
      exportToExcel(docRows, `${base}-professional-report-${timestamp}.xlsx`)
      return
    }

    if (format === 'json') {
      exportToJSON({
        meta: {
          module: selectedReport.module,
          subsection: selectedReport.subsection,
          storageKey: selectedReport.storageKey,
          generatedAt: new Date().toISOString(),
          notes: reportNotes
        },
        fields: selectedReport.fields,
        rows: docRows
      }, `${base}-professional-report-${timestamp}.json`)
      return
    }

    if (format === 'pdf') {
      exportToPDF(docRows, `${base}-professional-report-${timestamp}.pdf`, `${selectedReport.module} - ${selectedReport.subsection} Professional Report`)
      return
    }

    if (format === 'docx') {
      await exportToDocx(docRows, `${base}-professional-report-${timestamp}.docx`, `${selectedReport.module} - ${selectedReport.subsection} Professional Report`)
    }
  }

  const handleExportMaster = async (format) => {
    if (!masterSections.length) {
      alert('No sections available for master export under current filters.')
      return
    }

    const timestamp = new Date().toISOString().slice(0, 10)
    const filenameBase = `master-report-${timestamp}`

    const payload = {
      meta: {
        title: masterTitle,
        audience: masterAudience,
        generatedAt: new Date().toISOString(),
        scope: masterScope,
        sectionCount: masterSections.length,
        indexedRows: masterSections.reduce((sum, s) => sum + s.rowCount, 0)
      },
      sections: masterSections
    }

    if (format === 'json') {
      exportToJSON(payload, `${filenameBase}.json`)
      return
    }

    const rows = masterSections.map((section, index) => ({
      sectionNo: index + 1,
      module: section.module,
      subsection: section.subsection,
      storageKey: section.storageKey,
      rowCount: section.rowCount,
      fieldCount: section.fieldCount,
      fillRatePct: section.fillRate,
      nativeSummary: section.nativeSummary,
      detailedTechnicalReport: section.detailedTechnicalReport,
      operationalRisks: section.operationalRisks,
      correctiveActions: section.correctiveActions,
      editorNotes: section.editorNotes,
      updatedAt: section.updatedAt
    }))

    if (format === 'csv') {
      exportToCSV(rows, `${filenameBase}.csv`)
      return
    }

    if (format === 'excel') {
      exportToExcel(rows, `${filenameBase}.xlsx`)
      return
    }

    if (format === 'pdf') {
      exportToPDF(rows, `${filenameBase}.pdf`, `${masterTitle} - Master Technical Report`)
      return
    }

    if (format === 'docx') {
      await exportToDocx(rows, `${filenameBase}.docx`, `${masterTitle} - Master Technical Report`)
    }
  }

  const openSectionFromReport = (report) => {
    if (!report || typeof onOpenSection !== 'function') return
    onOpenSection(report)
  }

  return (
    <section>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0 }}>Professional Reports Center</h2>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
            Comprehensive reports for every module and nested subsection. Reports update automatically after record edits.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />
            Auto refresh (30s)
          </label>
          <button onClick={refreshCatalog}>Refresh Now</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 16 }}>
        <div className="card" style={{ padding: 14, background: '#f0fdf4' }}>
          <div style={{ fontSize: 12, color: '#166534' }}>Modules</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#166534' }}>{catalog.summary.modules}</div>
        </div>
        <div className="card" style={{ padding: 14, background: '#eff6ff' }}>
          <div style={{ fontSize: 12, color: '#1d4ed8' }}>Subsection Reports</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#1d4ed8' }}>{catalog.summary.subsections}</div>
        </div>
        <div className="card" style={{ padding: 14, background: '#fff7ed' }}>
          <div style={{ fontSize: 12, color: '#9a3412' }}>Total Records Indexed</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#9a3412' }}>{catalog.summary.totalRows}</div>
        </div>
        <div className="card" style={{ padding: 14, background: '#f8fafc' }}>
          <div style={{ fontSize: 12, color: '#475569' }}>Last Scan</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#334155' }}>{new Date(catalog.summary.generatedAt).toLocaleString()}</div>
        </div>
      </div>

      <div className="card" style={{ padding: 14, marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
          <div>
            <label style={{ fontSize: 12, color: '#475569' }}>Search Reports</label>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by module, subsection, key..."
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#475569' }}>Module</label>
            <select value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)}>
              {moduleOptions.map((m) => (
                <option key={m} value={m}>{m === 'all' ? 'All Modules' : m}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#475569' }}>Subsection (Dropdown)</label>
            <select value={subsectionFilter} onChange={(e) => setSubsectionFilter(e.target.value)}>
              {subsectionOptions.map((s) => (
                <option key={s} value={s}>{s === 'all' ? 'All Subsections' : s}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#475569' }}>Select Detailed Section</label>
            <select value={selectedReportId} onChange={(e) => setSelectedReportId(e.target.value)}>
              {visibleReports.map((r) => (
                <option key={r.id} value={r.id}>{r.module} - {r.subsection}</option>
              ))}
            </select>
            {!!selectedReportHelp && (
              <div style={{ marginTop: 6, fontSize: 11, color: '#64748b' }}>
                {selectedReportHelp}
              </div>
            )}
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#475569' }}>Professional Notes (included in exports)</label>
            <input
              value={reportNotes}
              onChange={(e) => setReportNotes(e.target.value)}
              placeholder="e.g. Q1 review approved by farm manager"
            />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
          <button onClick={seedVisibleNarratives}>Auto Generate Narratives for Visible Sections</button>
        </div>
      </div>

      <div className="card" style={{ padding: 14, marginBottom: 16 }}>
        <h3 style={{ marginTop: 0, marginBottom: 8 }}>Master Report Builder</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
          <div>
            <label style={{ fontSize: 12, color: '#475569' }}>Master Title</label>
            <input value={masterTitle} onChange={(e) => setMasterTitle(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#475569' }}>Audience</label>
            <input value={masterAudience} onChange={(e) => setMasterAudience(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#475569' }}>Scope</label>
            <select value={masterScope} onChange={(e) => setMasterScope(e.target.value)}>
              <option value={MASTER_SCOPE.visible}>Visible Sections</option>
              <option value={MASTER_SCOPE.module}>Current Module ({selectedReport?.module || 'N/A'})</option>
              <option value={MASTER_SCOPE.all}>All Indexed Sections</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#475569' }}>Master Coverage</label>
            <div style={{ marginTop: 8, fontSize: 13, color: '#334155' }}>
              {masterSections.length} sections | {masterSections.reduce((sum, s) => sum + s.rowCount, 0)} records
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
          <button onClick={() => handleExportMaster('csv')}>Download Master CSV</button>
          <button onClick={() => handleExportMaster('excel')}>Download Master Excel</button>
          <button onClick={() => handleExportMaster('pdf')}>Download Master PDF</button>
          <button onClick={() => handleExportMaster('docx')}>Download Master DOCX</button>
          <button onClick={() => handleExportMaster('json')}>Download Master JSON</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 38%) 1fr', gap: 16 }}>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '12px 14px', borderBottom: '1px solid #e2e8f0', fontWeight: 700 }}>
            Report Catalog ({visibleReports.length})
          </div>
          <div style={{ maxHeight: 600, overflowY: 'auto' }}>
            {visibleReports.length === 0 && (
              <div style={{ padding: 16, color: '#64748b' }}>No reports found for current filters.</div>
            )}
            {visibleReports.map((report) => {
              const active = report.id === selectedReportId
              return (
                <button
                  key={report.id}
                  onClick={() => setSelectedReportId(report.id)}
                  style={{
                    width: '100%',
                    border: 'none',
                    borderBottom: '1px solid #f1f5f9',
                    textAlign: 'left',
                    background: active ? '#ecfeff' : '#ffffff',
                    padding: '12px 14px',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{report.module} - {report.subsection}</div>
                  <div style={{ fontSize: 12, color: '#475569', marginTop: 3 }}>{report.rowCount} records</div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{getSectionHelp(report.module, report.subsection)}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{report.storageKey}</div>
                  <div style={{ marginTop: 8 }}>
                    <span
                      onClick={(event) => {
                        event.stopPropagation()
                        openSectionFromReport(report)
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          openSectionFromReport(report)
                        }
                      }}
                      style={{
                        display: 'inline-flex',
                        padding: '4px 10px',
                        borderRadius: 999,
                        fontSize: 11,
                        fontWeight: 700,
                        background: '#ecfdf5',
                        color: '#047857',
                        border: '1px solid #a7f3d0',
                        cursor: 'pointer'
                      }}
                    >
                      Open Real Section
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div className="card" style={{ padding: 14 }}>
          {!selectedReport && (
            <div style={{ color: '#64748b' }}>Select a report on the left to preview full records.</div>
          )}

          {selectedReport && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
                <div>
                  <h3 style={{ margin: 0 }}>{selectedReport.module} - {selectedReport.subsection}</h3>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                    Source key: {selectedReport.storageKey} | Rows: {selectedReport.rowCount} | Fields: {selectedReport.fields.length}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button onClick={() => openSectionFromReport(selectedReport)} style={{ background: '#0f766e', color: '#fff', border: 'none' }}>Open Real Section</button>
                  <button onClick={() => handleExport('csv')}>Download CSV</button>
                  <button onClick={() => handleExport('excel')}>Download Excel</button>
                  <button onClick={() => handleExport('pdf')}>Download PDF</button>
                  <button onClick={() => handleExport('docx')}>Download DOCX</button>
                  <button onClick={() => handleExport('json')}>Download JSON</button>
                </div>
              </div>

              <div className="card" style={{ padding: 12, marginBottom: 10, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 8, flexWrap: 'wrap' }}>
                  <strong>Native + Detailed Technical Narrative (Editable)</strong>
                  <button onClick={regenerateSelectedNarrative}>Regenerate Auto Narrative</button>
                </div>
                <div style={{ display: 'grid', gap: 8 }}>
                  <div>
                    <label style={{ fontSize: 12, color: '#475569' }}>Native Summary</label>
                    <textarea
                      rows={2}
                      value={selectedDraft?.nativeSummary || ''}
                      onChange={(e) => handleDraftFieldChange('nativeSummary', e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: '#475569' }}>Detailed Technical Report</label>
                    <textarea
                      rows={3}
                      value={selectedDraft?.detailedTechnicalReport || ''}
                      onChange={(e) => handleDraftFieldChange('detailedTechnicalReport', e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: '#475569' }}>Operational Risks</label>
                    <textarea
                      rows={2}
                      value={selectedDraft?.operationalRisks || ''}
                      onChange={(e) => handleDraftFieldChange('operationalRisks', e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: '#475569' }}>Corrective Actions</label>
                    <textarea
                      rows={2}
                      value={selectedDraft?.correctiveActions || ''}
                      onChange={(e) => handleDraftFieldChange('correctiveActions', e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: '#475569' }}>Editor Notes</label>
                    <textarea
                      rows={2}
                      value={selectedDraft?.editorNotes || ''}
                      onChange={(e) => handleDraftFieldChange('editorNotes', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {selectedReport.rows.length === 0 && (
                <div style={{ marginBottom: 10, padding: 10, borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#475569', fontSize: 13 }}>
                  No records in this section yet. Open the real section to add or sync records.
                </div>
              )}

              <div style={{ overflow: 'auto', border: '1px solid #e2e8f0', borderRadius: 8, maxHeight: 560 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead style={{ position: 'sticky', top: 0, background: '#f8fafc', zIndex: 1 }}>
                    <tr>
                      {(selectedReport.fields.length ? selectedReport.fields : ['status']).map((field) => (
                        <th key={field} style={{ borderBottom: '1px solid #e2e8f0', padding: '8px 10px', textAlign: 'left', whiteSpace: 'nowrap' }}>
                          {field}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedReport.rows.length ? selectedReport.rows.slice(0, 1000) : [{ status: 'No records yet' }]).map((row, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        {(selectedReport.fields.length ? selectedReport.fields : ['status']).map((field) => (
                          <td key={field} style={{ padding: '7px 10px', verticalAlign: 'top' }}>
                            {String(row[field] ?? '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {selectedReport.rows.length > 1000 && (
                <div style={{ marginTop: 8, fontSize: 12, color: '#b45309' }}>
                  Preview capped at first 1000 rows for performance. Full dataset is included in downloads.
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="card" style={{ padding: 14, marginTop: 16 }}>
        <h3 style={{ marginTop: 0 }}>Master Report Preview</h3>
        <div style={{ fontSize: 13, color: '#475569', marginBottom: 10 }}>
          Title: {masterTitle} | Audience: {masterAudience} | Sections: {masterSections.length}
        </div>
        <div style={{ maxHeight: 380, overflowY: 'auto', display: 'grid', gap: 10 }}>
          {masterSections.map((section, index) => (
            <div key={section.id} style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 10, background: '#fff' }}>
              <div style={{ fontWeight: 700, color: '#0f172a' }}>{index + 1}. {section.module} - {section.subsection}</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                Rows: {section.rowCount} | Fields: {section.fieldCount} | Fill Rate: {section.fillRate}%
              </div>
              <div style={{ marginTop: 6 }}>
                <button
                  onClick={() => openSectionFromReport(section)}
                  style={{ padding: '4px 10px', borderRadius: 999, border: '1px solid #a7f3d0', background: '#ecfdf5', color: '#047857', fontWeight: 700, fontSize: 11 }}
                >
                  Open Real Section
                </button>
              </div>
              <div style={{ marginTop: 6, fontSize: 13 }}><strong>Native:</strong> {section.nativeSummary}</div>
              <div style={{ marginTop: 6, fontSize: 13 }}><strong>Technical:</strong> {section.detailedTechnicalReport}</div>
            </div>
          ))}
          {masterSections.length === 0 && (
            <div style={{ color: '#64748b' }}>No sections available for current scope.</div>
          )}
        </div>
      </div>
    </section>
  )
}
