import React, { useEffect, useState, useRef } from 'react'
import { exportToCSV, exportToExcel, exportToJSON, exportToPDF, importFromCSV, importFromJSON, batchPrint } from '../lib/exportImport'
import { getVeterinaryInventory, useInventoryItem, recordExpense } from '../lib/moduleIntegration'
import AnimalCV from '../components/animal/AnimalCV'
import { recordClick } from '../lib/clickDB'
import { logActivity } from '../lib/activityLogger'
import { NOTIFICATION_TYPES, PRIORITIES } from '../lib/notifications'
import { validateTreatmentInput, scheduleLivestockReminder, getTreatmentPhase2Insights } from '../lib/livestockPhase1'

const SAMPLE = [
  { id: 'TREAT-001', animalId: 'A-001', date: '2025-06-01', timestamp: '2025-06-01T10:30:00', treatmentType: 'Hoof Care', treatment: 'Hoof trim', veterinarian: 'Dr. Smith', medication: '', dosage: '', cost: 50, duration: '', nextDue: '', status: 'Completed', severity: 'Routine', notes: 'Regular maintenance' },
  { id: 'TREAT-002', animalId: 'A-002', date: '2025-05-28', timestamp: '2025-05-28T14:00:00', treatmentType: 'Vaccination', treatment: 'Annual vaccination', veterinarian: 'Dr. Wilson', medication: 'Bovine Vaccine Mix', dosage: '2ml IM', cost: 25, duration: '', nextDue: '2026-05-28', status: 'Completed', severity: 'Preventive', notes: '' }
]

const TREATMENT_TYPES = ['Vaccination', 'Medication', 'Surgery', 'Hoof Care', 'Dental', 'Wound Care', 'Parasite Control', 'Disease Treatment', 'Preventive Care', 'Emergency', 'Other']
const TREATMENT_STATUS = ['Scheduled', 'In Progress', 'Completed', 'Follow-up Required', 'Cancelled']
const SEVERITY_LEVELS = ['Routine', 'Preventive', 'Minor', 'Moderate', 'Severe', 'Critical', 'Emergency']

export default function AnimalTreatment({ animals }){
  const KEY = 'cattalytics:animal:treatment'
  const [items, setItems] = useState([])
  const [animalId, setAnimalId] = useState(animals && animals[0] ? animals[0].id : '')
  const [treatmentType, setTreatmentType] = useState('Medication')
  const [treatment, setTreatment] = useState('')
  const [veterinarian, setVeterinarian] = useState('')
  const [medication, setMedication] = useState('')
  const [dosage, setDosage] = useState('')
  const [cost, setCost] = useState('')
  const [duration, setDuration] = useState('')
  const [nextDue, setNextDue] = useState('')
  const [status, setStatus] = useState('Completed')
  const [severity, setSeverity] = useState('Routine')
  const [notes, setNotes] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [filterAnimal, setFilterAnimal] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterDue, setFilterDue] = useState('all')
  const [vetInventory, setVetInventory] = useState([])
  const [selectedInventoryItem, setSelectedInventoryItem] = useState('')

  // Inline edit state
  const [inlineEditId, setInlineEditId] = useState(null)
  const [inlineData, setInlineData] = useState({ treatment: '', status: 'Completed', severity: 'Routine' })
  const [toast, setToast] = useState(null)
  const [lastChange, setLastChange] = useState(null)
  const [showAnimalCV, setShowAnimalCV] = useState(null)

  useEffect(()=>{
    const raw = localStorage.getItem(KEY)
    if(raw) setItems(JSON.parse(raw))
    else setItems(SAMPLE)
    // Load vet inventory
    setVetInventory(getVeterinaryInventory())
  }, [])

  useEffect(()=> localStorage.setItem(KEY, JSON.stringify(items)), [items])

  function add(){
    const treatmentCost = parseFloat(cost) || 0
    const validation = validateTreatmentInput({
      animalId,
      treatment: treatment.trim(),
      cost: treatmentCost,
      nextDue
    })

    if(!validation.valid) {
      alert(validation.errors.join('\n'))
      return
    }

    const animalName = animals?.find(a => a.id === animalId)?.name || animalId
    
    if(editingId) {
      // Update existing treatment
      setItems(items.map(i => i.id === editingId ? {
        ...i,
        animalId,
        treatmentType,
        treatment: treatment.trim(),
        veterinarian: veterinarian.trim(),
        medication: medication.trim(),
        dosage: dosage.trim(),
        cost: treatmentCost,
        duration: duration.trim(),
        nextDue,
        status,
        severity,
        notes: notes.trim()
      } : i))

      logActivity('health', 'treatment_updated', `Updated treatment for ${animalName}`, {
        treatmentId: editingId,
        animalId,
        treatmentType,
        status,
        severity,
        nextDue
      })

      setEditingId(null)
    } else {
      // Add new treatment
      const id = 'TREAT-' + Math.floor(1000 + Math.random()*9000)
    
    const newItem = {
      id,
      animalId,
      date: new Date().toISOString().slice(0,10),
      timestamp: new Date().toISOString(),
      treatmentType,
      treatment: treatment.trim(),
      veterinarian: veterinarian.trim(),
      medication: medication.trim(),
      dosage: dosage.trim(),
      cost: treatmentCost,
      duration: duration.trim(),
      nextDue,
      status,
      severity,
      notes: notes.trim()
    }
    
    // Use inventory item if selected
    if(selectedInventoryItem) {
      const doseQty = parseFloat(dosage) || 1
      const inventoryResult = useInventoryItem(selectedInventoryItem, doseQty, animalName, `Treatment: ${treatment}`)
      if(!inventoryResult?.success) {
        alert('Failed to deduct from inventory. Please check stock levels.')
        return
      }
    }
    
    // Auto-record treatment expense
    if(treatmentCost > 0) {
      recordExpense({
        amount: treatmentCost,
        category: 'Veterinary',
        subcategory: treatmentType,
        description: `${treatmentType} for ${animalName}: ${treatment}`,
        vendor: veterinarian || 'Vet Service',
        source: 'Animal Treatment',
        linkedId: id
      })
    }
    
    setItems([...items, newItem])

    if (newItem.nextDue) {
      scheduleLivestockReminder({
        type: NOTIFICATION_TYPES.TREATMENT,
        title: `Treatment due: ${newItem.treatmentType}`,
        body: `Follow-up for ${animalName} (${newItem.treatment}).`,
        dueDate: newItem.nextDue,
        entityId: newItem.id,
        entityType: 'treatment',
        priority: PRIORITIES.HIGH
      })
    }

    logActivity('health', 'treatment_created', `Treatment recorded for ${animalName}`, {
      treatmentId: newItem.id,
      animalId,
      treatmentType,
      status,
      severity,
      nextDue: newItem.nextDue
    })
    }
    
    setTreatment('')
    setVeterinarian('')
    setMedication('')
    setDosage('')
    setCost('')
    setDuration('')
    setNextDue('')
    setNotes('')
    setSelectedInventoryItem('')
    setShowAddForm(false)
    // Refresh inventory
    setVetInventory(getVeterinaryInventory())
  }

  function startEdit(item) {
    setAnimalId(item.animalId)
    setTreatmentType(item.treatmentType)
    setTreatment(item.treatment)
    setVeterinarian(item.veterinarian || '')
    setMedication(item.medication || '')
    setDosage(item.dosage || '')
    setCost(item.cost || '')
    setDuration(item.duration || '')
    setNextDue(item.nextDue || '')
    setStatus(item.status)
    setSeverity(item.severity)
    setNotes(item.notes || '')
    setEditingId(item.id)
    setShowAddForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelEdit() {
    setTreatment('')
    setVeterinarian('')
    setMedication('')
    setDosage('')
    setCost('')
    setDuration('')
    setNextDue('')
    setNotes('')
    setSelectedInventoryItem('')
    setEditingId(null)
    setShowAddForm(false)
  }

  function remove(id){ if(!confirm('Delete record '+id+'?')) return; setItems(items.filter(i=>i.id!==id)) }

  function startInlineEdit(item) {
    setInlineEditId(item.id)
    setInlineData({ treatment: item.treatment, status: item.status, severity: item.severity })
  }

  function saveInlineEdit() {
    if (!inlineData.treatment.trim()) {
      setToast({ message: 'Treatment description required', type: 'error' })
      setTimeout(() => setToast(null), 3000)
      return
    }
    const oldItem = items.find(i => i.id === inlineEditId)
    setLastChange({ action: 'edit', item: oldItem })
    setItems(items.map(i => i.id === inlineEditId ? { ...i, treatment: inlineData.treatment, status: inlineData.status, severity: inlineData.severity } : i))
    setInlineEditId(null)
    setToast({ message: '✓ Updated', type: 'success', showUndo: true })
    setTimeout(() => setToast(null), 5000)
  }

  function cancelInlineEdit() {
    setInlineEditId(null)
    setInlineData({ treatment: '', status: 'Completed', severity: 'Routine' })
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && e.ctrlKey) saveInlineEdit()
    if (e.key === 'Escape') cancelInlineEdit()
  }

  function undoLastChange() {
    if (!lastChange) return
    if (lastChange.action === 'edit') {
      setItems(items.map(i => i.id === lastChange.item.id ? lastChange.item : i))
    }
    setToast(null)
    setLastChange(null)
  }

  const filteredItems = items.filter(item => {
    if(filterAnimal !== 'all' && item.animalId !== filterAnimal) return false
    if(filterType !== 'all' && item.treatmentType !== filterType) return false
    if(filterStatus !== 'all' && item.status !== filterStatus) return false
    if (filterDue !== 'all') {
      const dueDate = item.nextDue ? new Date(item.nextDue) : null
      const today = new Date()
      const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      if (filterDue === 'none' && dueDate) return false
      if (filterDue === 'overdue' && (!dueDate || dueDate >= startToday)) return false
      if (filterDue === 'next7') {
        if (!dueDate) return false
        const daysUntil = Math.floor((dueDate - startToday) / (1000 * 60 * 60 * 24))
        if (daysUntil < 0 || daysUntil > 7) return false
      }
      if (filterDue === 'next30') {
        if (!dueDate) return false
        const daysUntil = Math.floor((dueDate - startToday) / (1000 * 60 * 60 * 24))
        if (daysUntil < 0 || daysUntil > 30) return false
      }
    }
    return true
  })

  const phase2Insights = getTreatmentPhase2Insights(filteredItems)
  const overdueTreatments = phase2Insights.overdue
  const dueIn7Days = phase2Insights.dueIn7Days
  const vaccinationDueSoon = phase2Insights.vaccinationDueSoon

  const totalCost = filteredItems.reduce((sum, item) => sum + (item.cost || 0), 0)
  const upcomingTreatments = filteredItems.filter(item => {
    if(!item.nextDue) return false
    const daysUntil = Math.floor((new Date(item.nextDue) - new Date()) / (1000 * 60 * 60 * 24))
    return daysUntil <= 30 && daysUntil >= 0
  })
  const criticalCases = filteredItems.filter(item => 
    item.severity === 'Critical' || item.severity === 'Emergency' || item.severity === 'Severe'
  )
  const pendingFollowups = filteredItems.filter(item => item.status === 'Follow-up Required')

  // Treatment type summary
  const treatmentSummary = {}
  filteredItems.forEach(item => {
    if(!treatmentSummary[item.treatmentType]) {
      treatmentSummary[item.treatmentType] = { count: 0, cost: 0 }
    }
    treatmentSummary[item.treatmentType].count += 1
    treatmentSummary[item.treatmentType].cost += item.cost || 0
  })

  const fileInputRef = useRef(null)

  function handleExportCSV() {
    const data = filteredItems.map(t => {
      const animal = (animals||[]).find(a => a.id === t.animalId)
      return {
        id: t.id,
        animalTag: animal?.tag || t.animalId,
        animalName: animal?.name || '',
        date: t.date,
        treatmentType: t.treatmentType,
        treatment: t.treatment,
        veterinarian: t.veterinarian,
        medication: t.medication,
        dosage: t.dosage,
        cost: t.cost,
        status: t.status,
        severity: t.severity,
        nextDue: t.nextDue,
        notes: t.notes
      }
    })
    exportToCSV(data, 'treatment_records.csv')
  }

  function handleExportExcel() {
    const data = filteredItems.map(t => {
      const animal = (animals||[]).find(a => a.id === t.animalId)
      return {
        id: t.id,
        animalTag: animal?.tag || t.animalId,
        animalName: animal?.name || '',
        date: t.date,
        treatmentType: t.treatmentType,
        treatment: t.treatment,
        veterinarian: t.veterinarian,
        medication: t.medication,
        dosage: t.dosage,
        cost: t.cost,
        status: t.status,
        severity: t.severity,
        nextDue: t.nextDue,
        notes: t.notes
      }
    })
    exportToExcel(data, 'treatment_records_export.csv')
  }

  function handleExportJSON() {
    exportToJSON(filteredItems, 'treatment_records.json')
  }

  function handleExportPDF() {
    const data = filteredItems.map(item => ({
      ID: item.id,
      Date: item.date,
      Animal: animals?.find(a => a.id === item.animalId)?.name || item.animalId,
      Type: item.treatmentType,
      Treatment: item.treatment,
      Veterinarian: item.veterinarian,
      Medication: item.medication || 'N/A',
      Cost: `KES ${item.cost}`,
      Status: item.status,
      Severity: item.severity,
      Notes: item.notes || ''
    }))
    exportToPDF(data, 'treatment_records', 'Animal Treatment Records')
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
        if (confirm(`Import ${data.length} treatment records? This will merge with existing data.`)) {
          const imported = data.map(t => ({
            ...t,
            id: t.id || 'TREAT-' + Math.floor(1000 + Math.random()*9000)
          }))
          setItems([...items, ...imported])
          alert(`Imported ${imported.length} treatment records`)
        }
      })
    } else if (ext === 'csv') {
      importFromCSV(file, (data, error) => {
        if (error) {
          alert('Import failed: ' + error.message)
          return
        }
        if (confirm(`Import ${data.length} treatment records? This will merge with existing data.`)) {
          const imported = data.map(t => ({
            id: t.id || 'TREAT-' + Math.floor(1000 + Math.random()*9000),
            animalId: t.animalId || '',
            date: t.date || new Date().toISOString().slice(0,10),
            timestamp: t.timestamp || new Date().toISOString(),
            treatmentType: t.treatmentType || 'Other',
            treatment: t.treatment || '',
            veterinarian: t.veterinarian || '',
            medication: t.medication || '',
            dosage: t.dosage || '',
            cost: t.cost ? Number(t.cost) : 0,
            duration: t.duration || '',
            nextDue: t.nextDue || '',
            status: t.status || 'Completed',
            severity: t.severity || 'Routine',
            notes: t.notes || ''
          }))
          setItems([...items, ...imported])
          alert(`Imported ${imported.length} treatment records`)
        }
      })
    } else {
      alert('Unsupported file type. Use CSV or JSON.')
    }

    e.target.value = ''
  }

  function handleBatchPrint() {
    if (filteredItems.length === 0) {
      alert('No treatment records to print')
      return
    }

    batchPrint(filteredItems, (item) => {
      const animal = (animals||[]).find(a => a.id === item.animalId)
      return `
        <div style="padding: 20px; border: 2px solid #000;">
          <h2 style="margin-top: 0;">💊 Treatment Record: ${item.id}</h2>
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <tr>
              <th style="text-align: left; width: 150px; border: 1px solid #000; padding: 8px;">Animal:</th>
              <td style="border: 1px solid #000; padding: 8px;">${animal?.tag || item.animalId} - ${animal?.name || 'N/A'}</td>
            </tr>
            <tr>
              <th style="text-align: left; border: 1px solid #000; padding: 8px;">Date:</th>
              <td style="border: 1px solid #000; padding: 8px;">${item.date}</td>
            </tr>
            <tr>
              <th style="text-align: left; border: 1px solid #000; padding: 8px;">Treatment Type:</th>
              <td style="border: 1px solid #000; padding: 8px;">${item.treatmentType}</td>
            </tr>
            <tr>
              <th style="text-align: left; border: 1px solid #000; padding: 8px;">Treatment:</th>
              <td style="border: 1px solid #000; padding: 8px;">${item.treatment}</td>
            </tr>
            <tr>
              <th style="text-align: left; border: 1px solid #000; padding: 8px;">Veterinarian:</th>
              <td style="border: 1px solid #000; padding: 8px;">${item.veterinarian || 'N/A'}</td>
            </tr>
            <tr>
              <th style="text-align: left; border: 1px solid #000; padding: 8px;">Medication:</th>
              <td style="border: 1px solid #000; padding: 8px;">${item.medication || 'N/A'}</td>
            </tr>
            <tr>
              <th style="text-align: left; border: 1px solid #000; padding: 8px;">Dosage:</th>
              <td style="border: 1px solid #000; padding: 8px;">${item.dosage || 'N/A'}</td>
            </tr>
            <tr>
              <th style="text-align: left; border: 1px solid #000; padding: 8px;">Status:</th>
              <td style="border: 1px solid #000; padding: 8px;">${item.status}</td>
            </tr>
            <tr>
              <th style="text-align: left; border: 1px solid #000; padding: 8px;">Severity:</th>
              <td style="border: 1px solid #000; padding: 8px;">${item.severity}</td>
            </tr>
            <tr>
              <th style="text-align: left; border: 1px solid #000; padding: 8px;">Cost:</th>
              <td style="border: 1px solid #000; padding: 8px;">$${item.cost || 0}</td>
            </tr>
            ${item.nextDue ? `
            <tr>
              <th style="text-align: left; border: 1px solid #000; padding: 8px;">Next Due:</th>
              <td style="border: 1px solid #000; padding: 8px;">${item.nextDue}</td>
            </tr>
            ` : ''}
            ${item.notes ? `
            <tr>
              <th style="text-align: left; border: 1px solid #000; padding: 8px;">Notes:</th>
              <td style="border: 1px solid #000; padding: 8px;">${item.notes}</td>
            </tr>
            ` : ''}
          </table>
        </div>
      `
    }, 'Treatment Records', 'Animal Treatment Records')
  }

  return (
    <section>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <h3>💊 Treatments & Medical Records</h3>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={handleExportCSV} title="Export to CSV" style={{ fontSize: 12 }}>📊 CSV</button>
          <button onClick={handleExportExcel} title="Export to Excel" style={{ fontSize: 12 }}>📈 Excel</button>
          <button onClick={handleExportPDF} title="Export to PDF" style={{ fontSize: 12 }}>📕 PDF</button>
          <button onClick={handleExportJSON} title="Export to JSON" style={{ fontSize: 12 }}>📄 JSON</button>
          <button onClick={handleImportClick} title="Import from file" style={{ fontSize: 12 }}>📥 Import</button>
          <button onClick={handleBatchPrint} title="Print all records" style={{ fontSize: 12 }}>🖨️ Print</button>
          <input 
            ref={fileInputRef}
            type="file" 
            accept=".csv,.json" 
            style={{ display: 'none' }} 
            onChange={handleImportFile}
          />
          <button onClick={() => setShowAddForm(!showAddForm)}>
            {showAddForm ? (editingId ? 'Cancel Edit' : '✕ Cancel') : '+ Add Treatment Record'}
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 20 }}>
        <div className="card" style={{ padding: 16, background: '#f0fdf4' }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>Total Treatments</div>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#059669' }}>{filteredItems.length}</div>
        </div>
        <div className="card" style={{ padding: 16, background: '#fee2e2' }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>Critical Cases</div>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#dc2626' }}>{criticalCases.length}</div>
        </div>
        <div className="card" style={{ padding: 16, background: '#fef3c7' }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>Upcoming (30 days)</div>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#f59e0b' }}>{upcomingTreatments.length}</div>
        </div>
        <div className="card" style={{ padding: 16, background: '#e0f2fe' }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>Pending Follow-ups</div>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#0284c7' }}>{pendingFollowups.length}</div>
        </div>
        <div className="card" style={{ padding: 16, background: '#eff6ff' }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>Total Cost</div>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#2563eb' }}>${totalCost.toFixed(2)}</div>
        </div>
        <div className="card" style={{ padding: 16, background: '#fff1f2' }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>Overdue Follow-ups</div>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#be123c' }}>{overdueTreatments.length}</div>
        </div>
        <div className="card" style={{ padding: 16, background: '#f0f9ff' }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>Vaccines Due (30d)</div>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#0369a1' }}>{vaccinationDueSoon.length}</div>
        </div>
      </div>

      {/* Alerts */}
      {(upcomingTreatments.length > 0 || pendingFollowups.length > 0 || criticalCases.length > 0) && (
        <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {criticalCases.filter(item => item.status !== 'Completed').length > 0 && (
            <div className="card" style={{ padding: 16, background: '#fee2e2', borderLeft: '4px solid #dc2626' }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#7f1d1d' }}>🚨 Critical Cases Requiring Attention</h4>
              {criticalCases.filter(item => item.status !== 'Completed').map(item => {
                const animal = (animals||[]).find(a => a.id === item.animalId)
                return (
                  <div key={item.id} style={{ padding: '8px 0', borderBottom: '1px solid #fecaca' }}>
                    <strong>{animal?.name || animal?.tag || item.animalId}</strong> - {item.treatment} ({item.severity})
                  </div>
                )
              })}
            </div>
          )}
          
          {upcomingTreatments.length > 0 && (
            <div className="card" style={{ padding: 16, background: '#fef3c7', borderLeft: '4px solid #f59e0b' }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#92400e' }}>⚠️ Upcoming Treatments</h4>
              {upcomingTreatments.map(item => {
                const animal = (animals||[]).find(a => a.id === item.animalId)
                const daysUntil = Math.floor((new Date(item.nextDue) - new Date()) / (1000 * 60 * 60 * 24))
                return (
                  <div key={item.id} style={{ padding: '8px 0', borderBottom: '1px solid #fbbf24' }}>
                    <strong>{animal?.name || animal?.tag || item.animalId}</strong> - {item.treatment} (Due in {daysUntil} days - {new Date(item.nextDue).toLocaleDateString()})
                  </div>
                )
              })}
            </div>
          )}

          {overdueTreatments.length > 0 && (
            <div className="card" style={{ padding: 16, background: '#fff1f2', borderLeft: '4px solid #be123c' }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#9f1239' }}>⛔ Overdue Treatments</h4>
              {overdueTreatments.slice(0, 8).map(item => {
                const animal = (animals||[]).find(a => a.id === item.animalId)
                return (
                  <div key={item.id} style={{ padding: '8px 0', borderBottom: '1px solid #fecdd3' }}>
                    <strong>{animal?.name || animal?.tag || item.animalId}</strong> - {item.treatment} (Due {new Date(item.nextDue).toLocaleDateString()})
                  </div>
                )
              })}
            </div>
          )}

          {dueIn7Days.length > 0 && (
            <div className="card" style={{ padding: 16, background: '#ecfeff', borderLeft: '4px solid #0891b2' }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#0e7490' }}>📅 Due In Next 7 Days</h4>
              {dueIn7Days.slice(0, 8).map(item => {
                const animal = (animals||[]).find(a => a.id === item.animalId)
                return (
                  <div key={item.id} style={{ padding: '8px 0', borderBottom: '1px solid #bae6fd' }}>
                    <strong>{animal?.name || animal?.tag || item.animalId}</strong> - {item.treatment} ({new Date(item.nextDue).toLocaleDateString()})
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Add Form */}
      {showAddForm && (
        <div className="card" style={{ padding: 20, marginBottom: 20 }}>
          <h4 style={{ marginTop: 0 }}>{editingId ? 'Edit Treatment Record' : 'Add Treatment Record'}</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <div>
              <label>Animal *</label>
              <select id="treatment-animal" name="animalId" value={animalId} onChange={e => setAnimalId(e.target.value)}>
                <option value="">-- Select Animal --</option>
                {(animals||[]).map(a => (
                  <option key={a.id} value={a.id}>{a.name || a.tag} ({a.breed})</option>
                ))}
              </select>
            </div>
            <div>
              <label>Treatment Type *</label>
              <select id="treatment-type" name="treatmentType" value={treatmentType} onChange={e => setTreatmentType(e.target.value)}>
                {TREATMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label>Severity Level</label>
              <select id="treatment-severity" name="severity" value={severity} onChange={e => setSeverity(e.target.value)}>
                {SEVERITY_LEVELS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: 'span 3' }}>
              <label>Treatment Description *</label>
              <input id="treatment-description" name="treatment" value={treatment} onChange={e => setTreatment(e.target.value)} placeholder="e.g., Administered antibiotic for respiratory infection" />
            </div>
            <div>
              <label>Veterinarian/Handler</label>
              <input id="treatment-veterinarian" name="veterinarian" value={veterinarian} onChange={e => setVeterinarian(e.target.value)} placeholder="Dr. Smith" />
            </div>
            <div>
              <label>Medication</label>
              <input id="treatment-medication" name="medication" value={medication} onChange={e => setMedication(e.target.value)} placeholder="e.g., Penicillin" />
            </div>
            <div>
              <label>Dosage</label>
              <input id="treatment-dosage" name="dosage" value={dosage} onChange={e => setDosage(e.target.value)} placeholder="e.g., 5ml IM" />
            </div>
            <div>
              <label>Cost (KSH)</label>
              <input id="treatment-cost" name="cost" type="number" step="0.01" value={cost} onChange={e => setCost(e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <label>Treatment Duration</label>
              <input id="treatment-duration" name="duration" value={duration} onChange={e => setDuration(e.target.value)} placeholder="e.g., 7 days" />
            </div>
            <div>
              <label>Next Due Date</label>
              <input id="treatment-next-due" name="nextDue" type="date" value={nextDue} onChange={e => setNextDue(e.target.value)} />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label>Status</label>
              <select id="treatment-status" name="status" value={status} onChange={e => setStatus(e.target.value)}>
                {TREATMENT_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: 'span 3' }}>
              <label>Notes</label>
              <textarea id="treatment-notes" name="notes" value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Additional medical notes, observations, or instructions..." />
            </div>
          </div>
          <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
            <button onClick={add}>{editingId ? 'Save Changes' : 'Add Treatment'}</button>
            <button onClick={cancelEdit} className="secondary">Cancel</button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <select id="filter-animal" name="filterAnimal" value={filterAnimal} onChange={e => setFilterAnimal(e.target.value)}>
          <option value="all">All Animals</option>
          {(animals||[]).map(a => <option key={a.id} value={a.id}>{a.name || a.tag}</option>)}
        </select>
        <select id="filter-type" name="filterType" value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="all">All Types</option>
          {TREATMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select id="filter-status" name="filterStatus" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="all">All Statuses</option>
          {TREATMENT_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select id="filter-due" name="filterDue" value={filterDue} onChange={e => setFilterDue(e.target.value)}>
          <option value="all">All Due Dates</option>
          <option value="overdue">Overdue</option>
          <option value="next7">Due in 7 days</option>
          <option value="next30">Due in 30 days</option>
          <option value="none">No due date</option>
        </select>
        {(filterAnimal !== 'all' || filterType !== 'all' || filterStatus !== 'all' || filterDue !== 'all') && (
          <button onClick={() => { setFilterAnimal('all'); setFilterType('all'); setFilterStatus('all'); setFilterDue('all') }}>Clear Filters</button>
        )}
      </div>

      {/* Treatment Summary */}
      {Object.keys(treatmentSummary).length > 0 && (
        <div className="card" style={{ padding: 16, marginBottom: 16, background: 'var(--bg-secondary)' }}>
          <h4 style={{ margin: '0 0 12px 0' }}>Treatment Summary by Type</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            {Object.entries(treatmentSummary).map(([type, data]) => (
              <div key={type} style={{ padding: 12, background: 'var(--bg-elevated)', borderRadius: 6 }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{type}</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  {data.count} treatments • ${data.cost.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Records List */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {filteredItems.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>💊</div>
            <h4>No treatment records yet</h4>
            <p style={{ color: 'var(--text-secondary)' }}>Add your first treatment record to start tracking</p>
          </div>
        ) : (
          <div style={{ maxHeight: 600, overflowY: 'auto' }}>
            {filteredItems.sort((a, b) => new Date(b.timestamp || b.date) - new Date(a.timestamp || a.date)).map(item => {
              const animal = (animals||[]).find(a => a.id === item.animalId)
              const severityColor = item.severity === 'Critical' || item.severity === 'Emergency' ? '#dc2626' : 
                                   item.severity === 'Severe' ? '#f59e0b' : 
                                   item.severity === 'Preventive' ? '#059669' : '#6b7280'
              
              return (
                <div key={item.id} style={{ padding: 16, borderBottom: '1px solid #eee', borderLeft: `4px solid ${severityColor}` }}>
                  {inlineEditId === item.id ? (
                    <div onKeyDown={handleKeyDown} style={{display:'flex',flexDirection:'column',gap:12}}>
                      <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
                        <input id="inline-treatment" name="inlineTreatment" value={inlineData.treatment} onChange={e=>setInlineData({...inlineData,treatment:e.target.value})} placeholder="Treatment" style={{flex:1,minWidth:200}} autoFocus />
                        <select id="inline-status" name="inlineStatus" value={inlineData.status} onChange={e=>setInlineData({...inlineData,status:e.target.value})} style={{width:150}}>
                          {TREATMENT_STATUS.map(s=><option key={s}>{s}</option>)}
                        </select>
                        <select id="inline-severity" name="inlineSeverity" value={inlineData.severity} onChange={e=>setInlineData({...inlineData,severity:e.target.value})} style={{width:120}}>
                          {SEVERITY_LEVELS.map(s=><option key={s}>{s}</option>)}
                        </select>
                        <button onClick={saveInlineEdit} style={{background:'#10b981',color:'#fff',padding:'6px 12px',border:'none',borderRadius:4}}>✓ Save</button>
                        <button onClick={cancelInlineEdit} style={{background:'#ef4444',color:'#fff',padding:'6px 12px',border:'none',borderRadius:4}}>✕ Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 600, fontSize: 16 }}>{item.treatment}</span>
                        <span className="badge" style={{ background: '#e0f2fe' }}>{item.treatmentType}</span>
                        <span className="badge" style={{ 
                          background: item.status === 'Completed' ? '#d1fae5' : 
                                     item.status === 'Follow-up Required' ? '#fef3c7' : 
                                     item.status === 'In Progress' ? '#dbeafe' : '#f3f4f6',
                          color: item.status === 'Completed' ? '#059669' :
                                item.status === 'Follow-up Required' ? '#f59e0b' :
                                item.status === 'In Progress' ? '#0284c7' : '#6b7280'
                        }}>{item.status}</span>
                        <span className="badge" style={{ background: '#fee2e2', color: severityColor }}>{item.severity}</span>
                        <button onClick={() => { const a = (animals||[]).find(x => x.id === item.animalId); if (a) { setShowAnimalCV(a); recordClick('animal', a.id, 'view_cv') } }} style={{ marginLeft: 8, padding: '6px 10px', background: '#059669', color: 'white', border: 'none', borderRadius: 6 }}>👁️ View CV</button>
                        {item.cost > 0 && <span className="badge" style={{ background: '#d1fae5' }}>KSH {Number(item.cost).toLocaleString()}</span>}
                      </div>
                      <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>
                        <strong>{animal?.name || animal?.tag || item.animalId}</strong> • {new Date(item.timestamp || item.date).toLocaleDateString()}
                        {item.veterinarian && ` • ${item.veterinarian}`}
                      </div>
                      {item.medication && (
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>
                          <strong>Medication:</strong> {item.medication} {item.dosage && `(${item.dosage})`}
                        </div>
                      )}
                      {item.duration && (
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>
                          <strong>Duration:</strong> {item.duration}
                        </div>
                      )}
                      {item.nextDue && (
                        <div style={{ fontSize: 13, color: '#059669', marginBottom: 4 }}>
                          <strong>Next Due:</strong> {new Date(item.nextDue).toLocaleDateString()}
                        </div>
                      )}
                      {item.notes && (
                        <div style={{ fontSize: 13, color: '#888', marginTop: 8, padding: 8, background: 'var(--bg-secondary)', borderRadius: 4 }}>
                          {item.notes}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '4px', flexDirection: 'column' }}>
                      <button className="tab-btn" style={{background:'#3b82f6',color:'#fff',padding:'4px 8px'}} onClick={()=>startInlineEdit(item)}>⚡ Quick</button>
                      <button className="tab-btn" onClick={() => startEdit(item)}>✏️</button>
                      <button className="tab-btn" style={{ color: '#dc2626' }} onClick={() => remove(item.id)}>🗑️</button>
                    </div>
                  </div>
                )}
                </div>
              )
            })}
          </div>
        )}
      </div>
      {toast && (
        <div style={{position:'fixed',bottom:20,right:20,padding:'12px 20px',background:toast.type==='error'?'#ef4444':'#10b981',color:'#fff',borderRadius:8,boxShadow:'0 4px 12px rgba(0,0,0,0.15)',zIndex:10000,display:'flex',gap:12}}>
          <span>{toast.message}</span>
          {toast.showUndo && <button onClick={undoLastChange} style={{background:'rgba(255,255,255,0.2)',border:'1px solid rgba(255,255,255,0.3)',color:'#fff',padding:'4px 12px',borderRadius:4,cursor:'pointer'}}>↶ Undo</button>}
        </div>
      )}
      {showAnimalCV && (
        <AnimalCV
          animal={showAnimalCV}
          groups={JSON.parse(localStorage.getItem('cattalytics:groups') || '[]')}
          onClose={() => setShowAnimalCV(null)}
          onDownloadJSON={() => exportToJSON(showAnimalCV, `${(showAnimalCV.tag||showAnimalCV.id)}_record.json`)}
        />
      )}
    </section>
  )
}
