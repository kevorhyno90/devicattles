import React, { useState, useRef } from 'react'
import { importFromCSV, importFromJSON, exportToCSV, exportToJSON } from '../lib/exportImport'

export default function BulkOperations() {
  const [activeTab, setActiveTab] = useState('animals')
  const [bulkData, setBulkData] = useState([])
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef(null)

  // Bulk animal operations
  const handleBulkAnimalImport = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setLoading(true)
    const ext = file.name.split('.').pop()?.toLowerCase()
    
    if (ext === 'json') {
      importFromJSON(file, (data, error) => {
        setLoading(false)
        if (error) {
          alert('Import failed: ' + error.message)
          return
        }
        setPreview(data)
        setBulkData(data)
      })
    } else if (ext === 'csv') {
      importFromCSV(file, (data, error) => {
        setLoading(false)
        if (error) {
          alert('Import failed: ' + error.message)
          return
        }
        setPreview(data)
        setBulkData(data)
      })
    }
  }

  const confirmBulkImport = () => {
    if (!bulkData.length) return
    
    const storageKey = activeTab === 'animals' ? 'cattalytics:animals' : activeTab === 'expenses' ? 'cattalytics:finance' : 'cattalytics:tasks'
    const existing = JSON.parse(localStorage.getItem(storageKey) || '[]')
    
    // Merge with existing data
    const merged = [...existing, ...bulkData]
    localStorage.setItem(storageKey, JSON.stringify(merged))
    
    alert(`✅ Successfully imported ${bulkData.length} records!`)
    setBulkData([])
    setPreview(null)
    fileInputRef.current.value = ''
    window.location.reload()
  }

  // Bulk edit animals
  const handleBulkEditAnimals = () => {
    const storageKey = 'cattalytics:animals'
    const animals = JSON.parse(localStorage.getItem(storageKey) || '[]')
    
    if (!animals.length) {
      alert('No animals to edit')
      return
    }

    const action = prompt('Bulk action:\n1. Update status to "Sold"\n2. Update status to "Inactive"\n3. Clear health alerts\n4. Add tag\nEnter number:')
    
    if (!action) return

    let updated = [...animals]
    
    if (action === '1') {
      const confirm = window.confirm(`Mark ${animals.length} animals as Sold?`)
      if (!confirm) return
      updated = animals.map(a => ({ ...a, status: 'Sold' }))
    } else if (action === '2') {
      const confirm = window.confirm(`Mark ${animals.length} animals as Inactive?`)
      if (!confirm) return
      updated = animals.map(a => ({ ...a, status: 'Inactive' }))
    } else if (action === '3') {
      updated = animals.map(a => ({ ...a, healthAlerts: [] }))
    } else if (action === '4') {
      const tag = prompt('Enter tag to add to all animals:')
      if (!tag) return
      updated = animals.map(a => ({ ...a, tags: [...(a.tags || []), tag] }))
    }
    
    localStorage.setItem(storageKey, JSON.stringify(updated))
    alert(`✅ Updated ${updated.length} animals!`)
    window.location.reload()
  }

  // Bulk edit expenses
  const handleBulkEditExpenses = () => {
    const storageKey = 'cattalytics:finance'
    const expenses = JSON.parse(localStorage.getItem(storageKey) || '[]')
    
    if (!expenses.length) {
      alert('No transactions to edit')
      return
    }

    const action = prompt('Bulk action:\n1. Recategorize all\n2. Change payment method\nEnter number:')
    
    if (!action) return
    let updated = [...expenses]
    
    if (action === '1') {
      const category = prompt('New category:')
      const subcategory = prompt('New subcategory:')
      if (category) {
        updated = expenses.map(e => ({ ...e, category, subcategory }))
      }
    } else if (action === '2') {
      const method = prompt('New payment method:')
      if (method) {
        updated = expenses.map(e => ({ ...e, paymentMethod: method }))
      }
    }
    
    localStorage.setItem(storageKey, JSON.stringify(updated))
    alert(`✅ Updated ${updated.length} transactions!`)
    window.location.reload()
  }

  // Bulk delete
  const handleBulkDelete = () => {
    const storageKey = activeTab === 'animals' ? 'cattalytics:animals' : activeTab === 'expenses' ? 'cattalytics:finance' : 'cattalytics:tasks'
    const data = JSON.parse(localStorage.getItem(storageKey) || '[]')
    
    const filter = prompt(`Filter ${activeTab} to delete (e.g., status=Sold for animals):\nLeave blank to delete ALL`)
    if (filter === null) return
    
    let toDelete = data
    if (filter) {
      const [key, value] = filter.split('=')
      toDelete = data.filter(item => item[key.trim()] === value.trim())
    }
    
    if (!confirm(`Delete ${toDelete.length} records? This cannot be undone!`)) return
    
    const updated = data.filter(item => !toDelete.includes(item))
    localStorage.setItem(storageKey, JSON.stringify(updated))
    alert(`✅ Deleted ${toDelete.length} records!`)
    window.location.reload()
  }

  // Bulk export
  const handleBulkExport = () => {
    const storageKey = activeTab === 'animals' ? 'cattalytics:animals' : activeTab === 'expenses' ? 'cattalytics:finance' : 'cattalytics:tasks'
    const data = JSON.parse(localStorage.getItem(storageKey) || '[]')
    
    if (!data.length) {
      alert('No data to export')
      return
    }
    
    const format = prompt('Export format:\n1. JSON\n2. CSV\nEnter number:', '1')
    
    if (format === '1') {
      exportToJSON(data, `${activeTab}_export.json`)
    } else if (format === '2') {
      exportToCSV(data, `${activeTab}_export.csv`)
    }
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
      <h2>⚡ Bulk Operations</h2>
      <p style={{ color: '#666', marginBottom: '20px' }}>Manage multiple records at once with batch import, edit, and delete operations.</p>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', borderBottom: '2px solid #e5e7eb' }}>
        {['animals', 'expenses', 'tasks'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 20px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab ? '3px solid #059669' : '3px solid transparent',
              cursor: 'pointer',
              fontWeight: activeTab === tab ? '600' : '400',
              color: activeTab === tab ? '#059669' : '#666',
              marginBottom: '-2px'
            }}
          >
            {tab === 'animals' ? '🐄 Animals' : tab === 'expenses' ? '💰 Expenses' : '✅ Tasks'}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '30px' }}>
        <div style={{ background: '#f0fdf4', padding: '16px', borderRadius: '8px', border: '1px solid #86efac' }}>
          <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>📥 Import Records</div>
          <p style={{ fontSize: '12px', color: '#666', margin: '0 0 12px 0' }}>Add multiple {activeTab} at once from CSV or JSON</p>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            style={{
              width: '100%',
              padding: '8px 12px',
              background: '#22c55e',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: '600',
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? '⏳ Loading...' : 'Choose File'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.json"
            onChange={handleBulkAnimalImport}
            style={{ display: 'none' }}
          />
        </div>

        <div style={{ background: '#fef3c7', padding: '16px', borderRadius: '8px', border: '1px solid #fcd34d' }}>
          <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>✏️ Bulk Edit</div>
          <p style={{ fontSize: '12px', color: '#666', margin: '0 0 12px 0' }}>Update status, tags, or other fields for all</p>
          <button
            onClick={activeTab === 'animals' ? handleBulkEditAnimals : handleBulkEditExpenses}
            style={{
              width: '100%',
              padding: '8px 12px',
              background: '#f59e0b',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Edit All {activeTab}
          </button>
        </div>

        <div style={{ background: '#fecaca', padding: '16px', borderRadius: '8px', border: '1px solid #fca5a5' }}>
          <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>🗑️ Bulk Delete</div>
          <p style={{ fontSize: '12px', color: '#666', margin: '0 0 12px 0' }}>Remove multiple records with optional filter</p>
          <button
            onClick={handleBulkDelete}
            style={{
              width: '100%',
              padding: '8px 12px',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Delete Selected
          </button>
        </div>

        <div style={{ background: '#dbeafe', padding: '16px', borderRadius: '8px', border: '1px solid #93c5fd' }}>
          <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>📤 Export All</div>
          <p style={{ fontSize: '12px', color: '#666', margin: '0 0 12px 0' }}>Download all {activeTab} as CSV or JSON</p>
          <button
            onClick={handleBulkExport}
            style={{
              width: '100%',
              padding: '8px 12px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Export All
          </button>
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button
                onClick={() => {
                  const storageKey = activeTab === 'animals' ? 'cattalytics:animals' : activeTab === 'expenses' ? 'cattalytics:finance' : 'cattalytics:tasks';
                  const data = JSON.parse(localStorage.getItem(storageKey) || '[]');
                  if (!data.length) {
                    alert('No data to export');
                    return;
                  }
                  import('../lib/exportImport').then(mod => {
                    mod.exportToPDF(data, `${activeTab}_export`, `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Export Report`);
                  });
                }}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  background: '#6366f1',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Export PDF
              </button>
              <button
                onClick={() => {
                  const storageKey = activeTab === 'animals' ? 'cattalytics:animals' : activeTab === 'expenses' ? 'cattalytics:finance' : 'cattalytics:tasks';
                  const data = JSON.parse(localStorage.getItem(storageKey) || '[]');
                  if (!data.length) {
                    alert('No data to export');
                    return;
                  }
                  import('../lib/exportImport').then(mod => {
                    mod.exportToDocx(data, `${activeTab}_export.docx`, `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Export Report`);
                  });
                }}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  background: '#0ea5e9',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Export Word
              </button>
            </div>
        </div>
      </div>

      {preview && (
        <div style={{ background: '#f9fafb', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0 }}>📋 Preview ({bulkData.length} records)</h3>
            <button
              onClick={() => {
                setPreview(null)
                setBulkData([])
              }}
              style={{
                padding: '6px 12px',
                background: '#e5e7eb',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
          
          <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '16px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ background: '#e5e7eb' }}>
                  {bulkData.length > 0 && Object.keys(bulkData[0]).slice(0, 6).map(key => (
                    <th key={key} style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #d1d5db' }}>
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bulkData.slice(0, 10).map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    {Object.values(row).slice(0, 6).map((val, vidx) => (
                      <td key={vidx} style={{ padding: '8px', color: '#666' }}>
                        {typeof val === 'object' ? JSON.stringify(val) : String(val).substring(0, 30)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {bulkData.length > 10 && (
              <div style={{ textAlign: 'center', padding: '12px', color: '#666', fontSize: '12px' }}>
                +{bulkData.length - 10} more records
              </div>
            )}
          </div>

          <button
            onClick={confirmBulkImport}
            style={{
              width: '100%',
              padding: '12px',
              background: '#059669',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px'
            }}
          >
            ✅ Confirm Import {bulkData.length} Records
          </button>
        </div>
      )}

      <div style={{ background: '#f0f9ff', padding: '16px', borderRadius: '8px', border: '1px solid #bae6fd' }}>
        <h4 style={{ margin: '0 0 12px 0' }}>💡 Tips</h4>
        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: '#666' }}>
          <li>Use CSV or JSON format for imports</li>
          <li>Export first to see the exact format needed</li>
          <li>Bulk edits apply to all records without filter</li>
          <li>Always backup data before bulk delete</li>
          <li>Maximum 1000 records per import recommended</li>
        </ul>
      </div>
    </div>
  )
}
