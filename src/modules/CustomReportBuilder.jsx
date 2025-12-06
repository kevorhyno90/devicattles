import React, { useState, useEffect } from 'react'
import { loadData } from '../lib/storage'
import { exportToCSV, exportToPDF, exportToExcel } from '../lib/exportImport'

// Report Templates
const REPORT_TEMPLATES = {
  animalInventory: {
    id: 'animalInventory',
    name: 'Animal Inventory Report',
    description: 'Complete listing of all animals with key details',
    icon: '🐄',
    category: 'Animals',
    dataSource: 'cattalytics:animals',
    defaultFields: ['tagNumber', 'name', 'species', 'breed', 'status', 'birthDate', 'weight'],
    filters: ['species', 'breed', 'status'],
    groupBy: ['species', 'breed', 'status']
  },
  
  financialSummary: {
    id: 'financialSummary',
    name: 'Financial Summary Report',
    description: 'Income, expenses, and profit analysis',
    icon: '💰',
    category: 'Finance',
    dataSource: 'cattalytics:finance',
    defaultFields: ['date', 'type', 'category', 'subcategory', 'amount', 'description'],
    filters: ['type', 'category', 'paymentMethod'],
    groupBy: ['category', 'subcategory', 'type'],
    aggregations: ['sum', 'avg', 'count']
  },
  
  milkProduction: {
    id: 'milkProduction',
    name: 'Milk Production Report',
    description: 'Daily milk yield tracking and trends',
    icon: '🥛',
    category: 'Production',
    dataSource: 'cattalytics:milk-yield',
    defaultFields: ['date', 'animalId', 'quantity', 'quality', 'temperature'],
    filters: ['quality'],
    groupBy: ['animalId', 'date'],
    aggregations: ['sum', 'avg']
  },
  
  cropYield: {
    id: 'cropYield',
    name: 'Crop Yield Report',
    description: 'Harvest quantities and revenue',
    icon: '🌾',
    category: 'Crops',
    dataSource: 'cattalytics:crop:yield',
    defaultFields: ['date', 'cropId', 'quantity', 'pricePerUnit', 'totalPrice', 'buyer'],
    filters: ['sold'],
    groupBy: ['cropId'],
    aggregations: ['sum', 'avg', 'count']
  },
  
  healthRecords: {
    id: 'healthRecords',
    name: 'Health Records Report',
    description: 'Animal health history and treatments',
    icon: '💊',
    category: 'Health',
    dataSource: 'cattalytics:health:patients',
    defaultFields: ['name', 'animalId', 'status', 'notes'],
    filters: ['status'],
    groupBy: ['status']
  },
  
  taskCompletion: {
    id: 'taskCompletion',
    name: 'Task Completion Report',
    description: 'Task status and completion rates',
    icon: '✅',
    category: 'Tasks',
    dataSource: 'cattalytics:tasks',
    defaultFields: ['title', 'priority', 'status', 'dueDate', 'assignedTo'],
    filters: ['status', 'priority'],
    groupBy: ['status', 'priority'],
    aggregations: ['count']
  },
  
  breedingHistory: {
    id: 'breedingHistory',
    name: 'Breeding History Report',
    description: 'Breeding events and outcomes',
    icon: '🐮',
    category: 'Breeding',
    dataSource: 'cattalytics:breeding',
    defaultFields: ['date', 'motherId', 'fatherId', 'status', 'expectedDate', 'actualDate'],
    filters: ['status', 'method'],
    groupBy: ['status', 'method']
  },
  
  inventoryStatus: {
    id: 'inventoryStatus',
    name: 'Inventory Status Report',
    description: 'Current stock levels and alerts',
    icon: '📦',
    category: 'Inventory',
    dataSource: 'cattalytics:inventory',
    defaultFields: ['name', 'category', 'quantity', 'unit', 'reorderPoint', 'cost'],
    filters: ['category'],
    groupBy: ['category'],
    aggregations: ['sum', 'count']
  },
  
  feedingSchedule: {
    id: 'feedingSchedule',
    name: 'Feeding Schedule Report',
    description: 'Feed types, quantities, and costs',
    icon: '🌾',
    category: 'Feeding',
    dataSource: 'cattalytics:feeding',
    defaultFields: ['date', 'animalId', 'feedType', 'quantity', 'cost'],
    filters: ['feedType'],
    groupBy: ['feedType', 'animalId'],
    aggregations: ['sum', 'avg']
  },
  
  customReport: {
    id: 'customReport',
    name: 'Custom Report',
    description: 'Build your own report from scratch',
    icon: '🎨',
    category: 'Custom',
    dataSource: null,
    defaultFields: [],
    filters: [],
    groupBy: []
  }
}

// Available data sources
const DATA_SOURCES = {
  'cattalytics:animals': {
    name: 'Animals',
    fields: ['id', 'tagNumber', 'name', 'species', 'breed', 'status', 'birthDate', 'weight', 'gender', 'color', 'location']
  },
  'cattalytics:finance': {
    name: 'Finance',
    fields: ['id', 'date', 'type', 'category', 'subcategory', 'amount', 'description', 'paymentMethod', 'vendor']
  },
  'cattalytics:milk-yield': {
    name: 'Milk Production',
    fields: ['id', 'date', 'animalId', 'quantity', 'quality', 'temperature', 'session']
  },
  'cattalytics:crop:yield': {
    name: 'Crop Yield',
    fields: ['id', 'date', 'cropId', 'quantity', 'pricePerUnit', 'totalPrice', 'buyer', 'sold']
  },
  'cattalytics:tasks': {
    name: 'Tasks',
    fields: ['id', 'title', 'description', 'priority', 'status', 'dueDate', 'assignedTo', 'category']
  },
  'cattalytics:breeding': {
    name: 'Breeding',
    fields: ['id', 'date', 'motherId', 'fatherId', 'status', 'method', 'expectedDate', 'actualDate', 'offspring']
  },
  'cattalytics:inventory': {
    name: 'Inventory',
    fields: ['id', 'name', 'category', 'quantity', 'unit', 'reorderPoint', 'cost', 'supplier']
  },
  'cattalytics:feeding': {
    name: 'Feeding',
    fields: ['id', 'date', 'animalId', 'feedType', 'quantity', 'unit', 'cost', 'notes']
  },
  'cattalytics:crops:v2': {
    name: 'Crops',
    fields: ['id', 'name', 'variety', 'plantDate', 'harvestDate', 'area', 'status', 'fieldLocation']
  }
}

export default function CustomReportBuilder() {
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [reportConfig, setReportConfig] = useState({
    name: '',
    dataSource: null,
    fields: [],
    filters: {},
    groupBy: null,
    sortBy: null,
    sortDirection: 'asc',
    aggregations: [],
    dateRange: { start: '', end: '' }
  })
  const [reportData, setReportData] = useState([])
  const [generatedReport, setGeneratedReport] = useState(null)
  const [savedReports, setSavedReports] = useState([])

  useEffect(() => {
    loadSavedReports()
  }, [])

  const loadSavedReports = () => {
    try {
      const saved = JSON.parse(localStorage.getItem('cattalytics:custom-reports') || '[]')
      setSavedReports(saved)
    } catch (error) {
      console.error('Error loading saved reports:', error)
    }
  }

  const saveReport = () => {
    if (!reportConfig.name) {
      alert('Please enter a report name')
      return
    }

    const newReport = {
      id: Date.now().toString(),
      ...reportConfig,
      createdDate: new Date().toISOString()
    }

    const updated = [...savedReports, newReport]
    localStorage.setItem('cattalytics:custom-reports', JSON.stringify(updated))
    setSavedReports(updated)
    alert('✅ Report saved successfully!')
  }

  const loadReport = (report) => {
    setReportConfig(report)
    setSelectedTemplate(null)
  }

  const deleteReport = (reportId) => {
    if (confirm('Delete this saved report?')) {
      const updated = savedReports.filter(r => r.id !== reportId)
      localStorage.setItem('cattalytics:custom-reports', JSON.stringify(updated))
      setSavedReports(updated)
    }
  }

  const selectTemplate = (template) => {
    setSelectedTemplate(template)
    setReportConfig({
      name: template.name,
      dataSource: template.dataSource,
      fields: [...template.defaultFields],
      filters: {},
      groupBy: null,
      sortBy: template.defaultFields[0],
      sortDirection: 'asc',
      aggregations: template.aggregations || [],
      dateRange: { start: '', end: '' }
    })
  }

  const generateReport = () => {
    if (!reportConfig.dataSource) {
      alert('Please select a data source')
      return
    }

    if (reportConfig.fields.length === 0) {
      alert('Please select at least one field')
      return
    }

    try {
      let data = loadData(reportConfig.dataSource, [])

      // Apply filters
      if (Object.keys(reportConfig.filters).length > 0) {
        data = data.filter(item => {
          return Object.entries(reportConfig.filters).every(([field, value]) => {
            if (value === '' || value === null) return true
            return item[field] === value || item[field]?.toString().toLowerCase().includes(value.toLowerCase())
          })
        })
      }

      // Apply date range filter
      if (reportConfig.dateRange.start || reportConfig.dateRange.end) {
        data = data.filter(item => {
          const itemDate = item.date || item.createdAt || ''
          if (reportConfig.dateRange.start && itemDate < reportConfig.dateRange.start) return false
          if (reportConfig.dateRange.end && itemDate > reportConfig.dateRange.end) return false
          return true
        })
      }

      // Sort data
      if (reportConfig.sortBy) {
        data = [...data].sort((a, b) => {
          const aVal = a[reportConfig.sortBy]
          const bVal = b[reportConfig.sortBy]
          
          if (aVal === bVal) return 0
          const comparison = aVal > bVal ? 1 : -1
          return reportConfig.sortDirection === 'asc' ? comparison : -comparison
        })
      }

      // Project fields
      const projected = data.map(item => {
        const projected = {}
        reportConfig.fields.forEach(field => {
          projected[field] = item[field]
        })
        return projected
      })

      // Calculate aggregations if groupBy is specified
      let result = projected
      if (reportConfig.groupBy) {
        const grouped = {}
        projected.forEach(item => {
          const key = item[reportConfig.groupBy] || 'Uncategorized'
          if (!grouped[key]) grouped[key] = []
          grouped[key].push(item)
        })

        result = Object.entries(grouped).map(([group, items]) => {
          const summary = { [reportConfig.groupBy]: group, count: items.length }
          
          // Calculate aggregations
          reportConfig.fields.forEach(field => {
            if (field === reportConfig.groupBy) return
            
            const values = items.map(i => i[field]).filter(v => typeof v === 'number')
            if (values.length > 0) {
              summary[`${field}_sum`] = values.reduce((a, b) => a + b, 0)
              summary[`${field}_avg`] = summary[`${field}_sum`] / values.length
              summary[`${field}_min`] = Math.min(...values)
              summary[`${field}_max`] = Math.max(...values)
            }
          })
          
          return summary
        })
      }

      setReportData(projected)
      setGeneratedReport({
        config: reportConfig,
        data: result,
        rawData: projected,
        generatedAt: new Date().toISOString(),
        totalRecords: projected.length
      })
    } catch (error) {
      console.error('Error generating report:', error)
      alert('Error generating report: ' + error.message)
    }
  }

  const exportReport = (format) => {
    if (!generatedReport) {
      alert('Please generate a report first')
      return
    }

    const filename = `${reportConfig.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`

    try {
      switch (format) {
        case 'csv':
          exportToCSV(generatedReport.data, `${filename}.csv`)
          break
        case 'excel':
          exportToExcel(generatedReport.data, `${filename}.xlsx`)
          break
        case 'pdf':
          exportToPDF(generatedReport.data, `${filename}.pdf`, reportConfig.name)
          break
        case 'json':
          const json = JSON.stringify(generatedReport, null, 2)
          const blob = new Blob([json], { type: 'application/json' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `${filename}.json`
          a.click()
          break
      }
      alert(`✅ Report exported as ${format.toUpperCase()}`)
    } catch (error) {
      console.error('Export error:', error)
      alert('Error exporting report: ' + error.message)
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: 24,
        borderRadius: 12,
        marginBottom: 24
      }}>
        <h1 style={{ margin: 0, fontSize: 28 }}>📊 Custom Report Builder</h1>
        <p style={{ margin: '8px 0 0 0', opacity: 0.9 }}>
          Create custom reports from your farm data with filters, grouping, and aggregations
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 24 }}>
        {/* Sidebar */}
        <div>
          {/* Report Templates */}
          <div style={{
            background: 'white',
            borderRadius: 8,
            padding: 16,
            marginBottom: 16,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: 16 }}>📋 Templates</h3>
            {Object.values(REPORT_TEMPLATES).map(template => (
              <button
                key={template.id}
                onClick={() => selectTemplate(template)}
                style={{
                  width: '100%',
                  padding: 12,
                  marginBottom: 8,
                  background: selectedTemplate?.id === template.id ? '#ede9fe' : '#f9fafb',
                  border: selectedTemplate?.id === template.id ? '2px solid #8b5cf6' : '1px solid #e5e7eb',
                  borderRadius: 6,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ fontSize: 20, marginBottom: 4 }}>{template.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 'bold', marginBottom: 2 }}>{template.name}</div>
                <div style={{ fontSize: 11, color: '#6b7280' }}>{template.category}</div>
              </button>
            ))}
          </div>

          {/* Saved Reports */}
          <div style={{
            background: 'white',
            borderRadius: 8,
            padding: 16,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: 16 }}>💾 Saved Reports</h3>
            {savedReports.length === 0 ? (
              <div style={{ fontSize: 13, color: '#6b7280', textAlign: 'center', padding: 16 }}>
                No saved reports yet
              </div>
            ) : (
              savedReports.map(report => (
                <div key={report.id} style={{
                  padding: 10,
                  background: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: 6,
                  marginBottom: 8,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ flex: 1, fontSize: 13, cursor: 'pointer' }} onClick={() => loadReport(report)}>
                    {report.name}
                  </div>
                  <button onClick={() => deleteReport(report.id)} style={{
                    padding: '4px 8px',
                    background: '#fee2e2',
                    border: '1px solid #fecaca',
                    borderRadius: 4,
                    cursor: 'pointer',
                    fontSize: 11
                  }}>
                    🗑️
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Main Content */}
        <div>
          {/* Report Configuration */}
          <div style={{
            background: 'white',
            borderRadius: 8,
            padding: 24,
            marginBottom: 24,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ margin: '0 0 20px 0' }}>⚙️ Report Configuration</h3>

            {/* Report Name */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold', fontSize: 14 }}>
                Report Name
              </label>
              <input
                type="text"
                value={reportConfig.name}
                onChange={e => setReportConfig({ ...reportConfig, name: e.target.value })}
                placeholder="Enter report name"
                style={{
                  width: '100%',
                  padding: 10,
                  border: '1px solid #d1d5db',
                  borderRadius: 6,
                  fontSize: 14
                }}
              />
            </div>

            {/* Data Source */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold', fontSize: 14 }}>
                Data Source
              </label>
              <select
                value={reportConfig.dataSource || ''}
                onChange={e => setReportConfig({ ...reportConfig, dataSource: e.target.value, fields: [] })}
                style={{
                  width: '100%',
                  padding: 10,
                  border: '1px solid #d1d5db',
                  borderRadius: 6,
                  fontSize: 14
                }}
              >
                <option value="">Select data source...</option>
                {Object.entries(DATA_SOURCES).map(([key, source]) => (
                  <option key={key} value={key}>{source.name}</option>
                ))}
              </select>
            </div>

            {/* Fields Selection */}
            {reportConfig.dataSource && (
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold', fontSize: 14 }}>
                  Fields to Include
                </label>
                <div style={{
                  border: '1px solid #d1d5db',
                  borderRadius: 6,
                  padding: 12,
                  maxHeight: 200,
                  overflowY: 'auto'
                }}>
                  {DATA_SOURCES[reportConfig.dataSource].fields.map(field => (
                    <label key={field} style={{
                      display: 'block',
                      padding: '6px 0',
                      fontSize: 13,
                      cursor: 'pointer'
                    }}>
                      <input
                        type="checkbox"
                        checked={reportConfig.fields.includes(field)}
                        onChange={e => {
                          if (e.target.checked) {
                            setReportConfig({
                              ...reportConfig,
                              fields: [...reportConfig.fields, field]
                            })
                          } else {
                            setReportConfig({
                              ...reportConfig,
                              fields: reportConfig.fields.filter(f => f !== field)
                            })
                          }
                        }}
                        style={{ marginRight: 8 }}
                      />
                      {field}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Date Range Filter */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold', fontSize: 14 }}>
                Date Range (optional)
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <input
                    type="date"
                    value={reportConfig.dateRange.start}
                    onChange={e => setReportConfig({
                      ...reportConfig,
                      dateRange: { ...reportConfig.dateRange, start: e.target.value }
                    })}
                    style={{
                      width: '100%',
                      padding: 10,
                      border: '1px solid #d1d5db',
                      borderRadius: 6,
                      fontSize: 14
                    }}
                  />
                  <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>Start date</div>
                </div>
                <div>
                  <input
                    type="date"
                    value={reportConfig.dateRange.end}
                    onChange={e => setReportConfig({
                      ...reportConfig,
                      dateRange: { ...reportConfig.dateRange, end: e.target.value }
                    })}
                    style={{
                      width: '100%',
                      padding: 10,
                      border: '1px solid #d1d5db',
                      borderRadius: 6,
                      fontSize: 14
                    }}
                  />
                  <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>End date</div>
                </div>
              </div>
            </div>

            {/* Group By */}
            {reportConfig.dataSource && (
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold', fontSize: 14 }}>
                  Group By (optional)
                </label>
                <select
                  value={reportConfig.groupBy || ''}
                  onChange={e => setReportConfig({ ...reportConfig, groupBy: e.target.value || null })}
                  style={{
                    width: '100%',
                    padding: 10,
                    border: '1px solid #d1d5db',
                    borderRadius: 6,
                    fontSize: 14
                  }}
                >
                  <option value="">No grouping</option>
                  {reportConfig.fields.map(field => (
                    <option key={field} value={field}>{field}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Sort Options */}
            {reportConfig.fields.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold', fontSize: 14 }}>
                  Sort By
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
                  <select
                    value={reportConfig.sortBy || ''}
                    onChange={e => setReportConfig({ ...reportConfig, sortBy: e.target.value })}
                    style={{
                      padding: 10,
                      border: '1px solid #d1d5db',
                      borderRadius: 6,
                      fontSize: 14
                    }}
                  >
                    {reportConfig.fields.map(field => (
                      <option key={field} value={field}>{field}</option>
                    ))}
                  </select>
                  <select
                    value={reportConfig.sortDirection}
                    onChange={e => setReportConfig({ ...reportConfig, sortDirection: e.target.value })}
                    style={{
                      padding: 10,
                      border: '1px solid #d1d5db',
                      borderRadius: 6,
                      fontSize: 14
                    }}
                  >
                    <option value="asc">Ascending</option>
                    <option value="desc">Descending</option>
                  </select>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <button onClick={generateReport} style={{
                flex: 1,
                padding: '12px 24px',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: 14
              }}>
                📊 Generate Report
              </button>
              <button onClick={saveReport} style={{
                padding: '12px 24px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: 14
              }}>
                💾 Save
              </button>
            </div>
          </div>

          {/* Report Results */}
          {generatedReport && (
            <div style={{
              background: 'white',
              borderRadius: 8,
              padding: 24,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 20
              }}>
                <div>
                  <h3 style={{ margin: 0 }}>📈 Report Results</h3>
                  <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
                    {generatedReport.totalRecords} records • Generated {new Date(generatedReport.generatedAt).toLocaleString()}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => exportReport('csv')} style={exportButtonStyle}>CSV</button>
                  <button onClick={() => exportReport('excel')} style={exportButtonStyle}>Excel</button>
                  <button onClick={() => exportReport('pdf')} style={exportButtonStyle}>PDF</button>
                  <button onClick={() => exportReport('json')} style={exportButtonStyle}>JSON</button>
                </div>
              </div>

              {/* Data Table */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: 13
                }}>
                  <thead>
                    <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                      {Object.keys(generatedReport.data[0] || {}).map(key => (
                        <th key={key} style={{
                          padding: 12,
                          textAlign: 'left',
                          fontWeight: 'bold',
                          color: '#374151'
                        }}>
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {generatedReport.data.slice(0, 100).map((row, index) => (
                      <tr key={index} style={{
                        borderBottom: '1px solid #e5e7eb',
                        background: index % 2 === 0 ? 'white' : '#f9fafb'
                      }}>
                        {Object.values(row).map((value, i) => (
                          <td key={i} style={{ padding: 12 }}>
                            {typeof value === 'number' ? value.toFixed(2) : String(value || '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {generatedReport.data.length > 100 && (
                  <div style={{
                    padding: 16,
                    textAlign: 'center',
                    color: '#6b7280',
                    fontSize: 13
                  }}>
                    Showing first 100 of {generatedReport.data.length} records. Export to see all data.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const exportButtonStyle = {
  padding: '8px 16px',
  background: '#8b5cf6',
  color: 'white',
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer',
  fontSize: 12,
  fontWeight: 'bold'
}
