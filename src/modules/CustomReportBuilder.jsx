import React, { useEffect, useMemo, useState } from 'react'
import { exportToCSV, exportToExcel, exportToJSON, exportToPDF, exportToDocx } from '../lib/exportImport'
import { buildProfessionalReportCatalog, buildProfessionalReportDocument } from '../lib/professionalReports'

export default function CustomReportBuilder() {
  const [catalog, setCatalog] = useState({ summary: { modules: 0, subsections: 0, totalRows: 0, generatedAt: new Date().toISOString() }, reports: [] })
  const [query, setQuery] = useState('')
  const [moduleFilter, setModuleFilter] = useState('all')
  const [selectedReportId, setSelectedReportId] = useState('')
  const [reportNotes, setReportNotes] = useState('')
  const [autoRefresh, setAutoRefresh] = useState(true)

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
    if (!autoRefresh) return undefined

    const id = setInterval(() => {
      refreshCatalog()
    }, 5000)

    return () => clearInterval(id)
  }, [autoRefresh, selectedReportId])

  const moduleOptions = useMemo(() => {
    return ['all', ...Array.from(new Set(catalog.reports.map((r) => r.module)))]
  }, [catalog])

  const visibleReports = useMemo(() => {
    return catalog.reports.filter((report) => {
      if (moduleFilter !== 'all' && report.module !== moduleFilter) return false
      if (!query.trim()) return true

      const q = query.toLowerCase()
      return (
        report.module.toLowerCase().includes(q) ||
        report.subsection.toLowerCase().includes(q) ||
        report.storageKey.toLowerCase().includes(q)
      )
    })
  }, [catalog, moduleFilter, query])

  const selectedReport = useMemo(() => {
    return visibleReports.find((r) => r.id === selectedReportId) || null
  }, [visibleReports, selectedReportId])

  useEffect(() => {
    if (selectedReport) return
    if (visibleReports.length > 0) setSelectedReportId(visibleReports[0].id)
  }, [visibleReports, selectedReport])

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

    const docRows = buildProfessionalReportDocument(selectedReport, reportNotes)

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
            Auto refresh (5s)
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
            <label style={{ fontSize: 12, color: '#475569' }}>Professional Notes (included in exports)</label>
            <input
              value={reportNotes}
              onChange={(e) => setReportNotes(e.target.value)}
              placeholder="e.g. Q1 review approved by farm manager"
            />
          </div>
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
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{report.storageKey}</div>
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
                  <button onClick={() => handleExport('csv')}>Download CSV</button>
                  <button onClick={() => handleExport('excel')}>Download Excel</button>
                  <button onClick={() => handleExport('pdf')}>Download PDF</button>
                  <button onClick={() => handleExport('docx')}>Download DOCX</button>
                  <button onClick={() => handleExport('json')}>Download JSON</button>
                </div>
              </div>

              <div style={{ overflow: 'auto', border: '1px solid #e2e8f0', borderRadius: 8, maxHeight: 560 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead style={{ position: 'sticky', top: 0, background: '#f8fafc', zIndex: 1 }}>
                    <tr>
                      {selectedReport.fields.map((field) => (
                        <th key={field} style={{ borderBottom: '1px solid #e2e8f0', padding: '8px 10px', textAlign: 'left', whiteSpace: 'nowrap' }}>
                          {field}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {selectedReport.rows.slice(0, 1000).map((row, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        {selectedReport.fields.map((field) => (
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
    </section>
  )
}
