import React, { useState, useEffect } from 'react'
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, HeadingLevel } from 'docx'
import { calculateFeedEfficiency, calculateAnimalROI, comparePerformanceByPeriod, getTopPerformers } from '../lib/advancedAnalytics'
import { formatCurrency } from '../lib/currency'
import { exportAnimalProfitReport, exportVaccinationRecords, exportBreedingRecords, exportCropYieldReport, exportFinancialSummary, exportInventoryReport } from '../lib/pdfExport'

function downloadJson(obj, filename='export.json'){ try{ const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); }catch(e){ console.error(e) } }

function downloadXml(obj, filename='export.xml'){ 
  try{ 
    const xmlString = jsonToXml(obj, 'root')
    const blob = new Blob([xmlString], { type: 'application/xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }catch(e){ console.error(e) } 
}

function jsonToXml(obj, rootName = 'data') {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
  
  function buildXml(data, nodeName) {
    if (Array.isArray(data)) {
      return data.map((item, index) => buildXml(item, nodeName.replace(/s$/, '') || 'item')).join('')
    } else if (typeof data === 'object' && data !== null) {
      let content = ''
      for (let key in data) {
        content += buildXml(data[key], key)
      }
      return `<${nodeName}>${content}</${nodeName}>`
    } else {
      const value = data === null || data === undefined ? '' : String(data).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      return `<${nodeName}>${value}</${nodeName}>`
    }
  }
  
  return xml + buildXml(obj, rootName)
}

async function downloadDocx(data, filename='export.docx', title='Report', section='data') {
  try {
    const sections = []
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    
    // Header: JR FARM
    sections.push(
      new Paragraph({
        text: 'JR FARM',
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 }
      })
    )
    
    sections.push(
      new Paragraph({
        text: title,
        alignment: AlignmentType.CENTER,
        spacing: { after: 50 }
      })
    )
    
    sections.push(
      new Paragraph({
        text: `Date: ${today}`,
        alignment: AlignmentType.CENTER,
        spacing: { after: 50 }
      })
    )
    
    sections.push(
      new Paragraph({
        children: [
          new TextRun({ text: 'Made by Dr. Devin Omwenga', italics: true, color: '666666' })
        ],
        alignment: AlignmentType.RIGHT,
        spacing: { after: 300 }
      })
    )
    
    // Summary section
    if (Array.isArray(data) && data.length > 0) {
      sections.push(
        new Paragraph({
          text: 'Summary',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 }
        })
      )
      
      sections.push(
        new Paragraph({
          text: `Total Records: ${data.length}`,
          spacing: { after: 200 }
        })
      )
      
      // Add section-specific summaries
      if (section === 'finance') {
        const income = data.filter(i => i.type === 'income' || i.amount > 0).reduce((sum, i) => sum + Math.abs(i.amount || 0), 0)
        const expenses = data.filter(i => i.type === 'expense' || i.amount < 0).reduce((sum, i) => sum + Math.abs(i.amount || 0), 0)
        const balance = income - expenses
        
        sections.push(
          new Paragraph({
            children: [
              new TextRun({ text: 'Total Income: ', bold: true }),
              new TextRun({ text: `$${income.toFixed(2)}` })
            ],
            spacing: { after: 100 }
          })
        )
        sections.push(
          new Paragraph({
            children: [
              new TextRun({ text: 'Total Expenses: ', bold: true }),
              new TextRun({ text: `$${expenses.toFixed(2)}` })
            ],
            spacing: { after: 100 }
          })
        )
        sections.push(
          new Paragraph({
            children: [
              new TextRun({ text: 'Net Balance: ', bold: true }),
              new TextRun({ text: `$${balance.toFixed(2)}`, color: balance >= 0 ? '059669' : 'dc2626' })
            ],
            spacing: { after: 300 }
          })
        )
      } else if (section === 'animals') {
        const active = data.filter(a => a.status === 'Active').length
        const breeds = [...new Set(data.map(a => a.breed))].filter(Boolean)
        
        sections.push(
          new Paragraph({
            children: [
              new TextRun({ text: 'Active Animals: ', bold: true }),
              new TextRun({ text: `${active}` })
            ],
            spacing: { after: 100 }
          })
        )
        sections.push(
          new Paragraph({
            children: [
              new TextRun({ text: 'Breeds: ', bold: true }),
              new TextRun({ text: breeds.join(', ') })
            ],
            spacing: { after: 300 }
          })
        )
      } else if (section === 'crops') {
        const totalArea = data.reduce((sum, c) => sum + (c.area || 0), 0)
        const activeGrowing = data.filter(c => ['Planted', 'Growing', 'Flowering', 'Filling'].includes(c.status)).length
        
        sections.push(
          new Paragraph({
            children: [
              new TextRun({ text: 'Total Area: ', bold: true }),
              new TextRun({ text: `${totalArea.toFixed(1)} acres` })
            ],
            spacing: { after: 100 }
          })
        )
        sections.push(
          new Paragraph({
            children: [
              new TextRun({ text: 'Active Crops: ', bold: true }),
              new TextRun({ text: `${activeGrowing}` })
            ],
            spacing: { after: 300 }
          })
        )
      } else if (section === 'tasks') {
        const completed = data.filter(t => t.done).length
        const pending = data.filter(t => !t.done).length
        const highPriority = data.filter(t => !t.done && (t.priority === 'High' || t.priority === 'Critical')).length
        
        sections.push(
          new Paragraph({
            children: [
              new TextRun({ text: 'Completed Tasks: ', bold: true }),
              new TextRun({ text: `${completed}` })
            ],
            spacing: { after: 100 }
          })
        )
        sections.push(
          new Paragraph({
            children: [
              new TextRun({ text: 'Pending Tasks: ', bold: true }),
              new TextRun({ text: `${pending}` })
            ],
            spacing: { after: 100 }
          })
        )
        sections.push(
          new Paragraph({
            children: [
              new TextRun({ text: 'High Priority Pending: ', bold: true }),
              new TextRun({ text: `${highPriority}` })
            ],
            spacing: { after: 300 }
          })
        )
      }
    }
    
    // Detailed records
    sections.push(
      new Paragraph({
        text: 'Detailed Records',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 200 }
      })
    )
    
    // Process data
    if (Array.isArray(data)) {
      data.forEach((item, index) => {
        sections.push(
          new Paragraph({
            text: `Record ${index + 1}`,
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 200, after: 100 }
          })
        )
        
        Object.entries(item).forEach(([key, value]) => {
          if (typeof value !== 'object' || value === null) {
            sections.push(
              new Paragraph({
                children: [
                  new TextRun({ text: `${key}: `, bold: true }),
                  new TextRun({ text: String(value || '') })
                ],
                spacing: { after: 80 }
              })
            )
          }
        })
      })
    } else {
      Object.entries(data).forEach(([key, value]) => {
        const displayValue = typeof value === 'object' ? JSON.stringify(value) : String(value)
        sections.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${key}: `, bold: true }),
              new TextRun({ text: displayValue })
            ],
            spacing: { after: 100 }
          })
        )
      })
    }
    
    const doc = new Document({
      sections: [{
        properties: {},
        children: sections
      }]
    })
    
    const blob = await Packer.toBlob(doc)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  } catch(e) { 
    console.error(e)
    alert('Error generating DOCX: ' + e.message)
  }
}

export default function Reports(){
  const [section, setSection] = useState('animals')
  const [items, setItems] = useState([])
  const [patientFilter, setPatientFilter] = useState('')
  const [viewingData, setViewingData] = useState(null)
  const [viewTitle, setViewTitle] = useState('')
  const [viewFormat, setViewFormat] = useState('json') // json, xml, formatted

  // load relevant data from localStorage where available
    useEffect(()=>{
      try{
        const animals = JSON.parse(localStorage.getItem('cattalytics:animals') || '[]')
        const tasks = JSON.parse(localStorage.getItem('cattalytics:tasks') || '[]')
        const finance = JSON.parse(localStorage.getItem('cattalytics:finance') || '[]')
        const crops = JSON.parse(localStorage.getItem('cattalytics:crops') || '[]')
        const cropPest = JSON.parse(localStorage.getItem('cattalytics:cropPest') || '[]')
        const cropDisease = JSON.parse(localStorage.getItem('cattalytics:cropDisease') || '[]')
        const resources = JSON.parse(localStorage.getItem('devinsfarm:resources') || '[]')
        const schedules = JSON.parse(localStorage.getItem('cattalytics:schedules') || '[]')
        const groups = JSON.parse(localStorage.getItem('cattalytics:groups') || '[]')
        const pastures = JSON.parse(localStorage.getItem('cattalytics:pastures') || '[]')
        const health = JSON.parse(localStorage.getItem('cattalytics:health:patients') || '[]')
        const feeding = JSON.parse(localStorage.getItem('cattalytics:feeding') || '[]')
        const measurements = JSON.parse(localStorage.getItem('cattalytics:measurements') || '[]')
        const breeding = JSON.parse(localStorage.getItem('cattalytics:animal:breeding') || '[]')
        const milkYield = JSON.parse(localStorage.getItem('cattalytics:milk-yield') || '[]')
        const treatments = JSON.parse(localStorage.getItem('cattalytics:treatments') || '[]')
        const semen = JSON.parse(localStorage.getItem('cattalytics:semen:inventory') || '[]')
        const inventory = JSON.parse(localStorage.getItem('cattalytics:inventory') || '[]')
        const poultry = JSON.parse(localStorage.getItem('cattalytics:poultry') || '[]')
        const flocks = JSON.parse(localStorage.getItem('cattalytics:flocks') || '[]')
        const azolla = JSON.parse(localStorage.getItem('cattalytics:azolla') || '[]')
        const bsf = JSON.parse(localStorage.getItem('cattalytics:bsf') || '[]')
        const additionalReports = JSON.parse(localStorage.getItem('cattalytics:additionalReports') || '[]')
        const animalBreeding = JSON.parse(localStorage.getItem('cattalytics:animalBreeding') || '[]')
        const animalFeeding = JSON.parse(localStorage.getItem('cattalytics:animalFeeding') || '[]')
        const animalMeasurement = JSON.parse(localStorage.getItem('cattalytics:animalMeasurement') || '[]')
        const animalMilkYield = JSON.parse(localStorage.getItem('cattalytics:animalMilkYield') || '[]')
        const animalTreatment = JSON.parse(localStorage.getItem('cattalytics:animalTreatment') || '[]')
        const calfManagement = JSON.parse(localStorage.getItem('cattalytics:calfManagement') || '[]')
        const canineManagement = JSON.parse(localStorage.getItem('cattalytics:canineManagement') || '[]')
        const poultryManagement = JSON.parse(localStorage.getItem('cattalytics:poultryManagement') || '[]')
        const petManagement = JSON.parse(localStorage.getItem('cattalytics:petManagement') || '[]')
        setItems({ animals, tasks, finance, crops, cropPest, cropDisease, resources, schedules, groups, pastures, health, feeding, measurements, breeding, milkYield, treatments, semen, inventory, poultry, flocks, azolla, bsf, additionalReports, animalBreeding, animalFeeding, animalMeasurement, animalMilkYield, animalTreatment, calfManagement, canineManagement, poultryManagement, petManagement })
      }catch(e){ setItems({ animals:[], tasks:[], finance:[], crops:[], resources:[], schedules:[], groups:[], pastures:[], health:[], feeding:[], measurements:[], breeding:[], milkYield:[], treatments:[], semen:[], inventory:[], poultry:[], flocks:[], azolla:[], bsf:[], additionalReports:[], animalBreeding:[], animalFeeding:[], animalMeasurement:[], animalMilkYield:[], animalTreatment:[], calfManagement:[], canineManagement:[], poultryManagement:[], petManagement:[] }) }
    }, [])

  function getSectionItems(){
    const m = items || {}
    
    // Complete Farm Report - combines all modules
    if(section === 'completeFarm') {
      return [
        { id: 'animals-report', data: { module: 'Animals', count: (m.animals||[]).length, records: m.animals }, type: 'completeFarm' },
        { id: 'crops-report', data: { module: 'Crops', count: (m.crops||[]).length, records: m.crops }, type: 'completeFarm' },
        { id: 'poultry-report', data: { module: 'Poultry', count: (m.poultry||[]).length, records: m.poultry }, type: 'completeFarm' },
        { id: 'calves-report', data: { module: 'Calves', count: (m.calfManagement||[]).length, records: m.calfManagement }, type: 'completeFarm' },
        { id: 'canines-report', data: { module: 'Canines', count: (m.canineManagement||[]).length, records: m.canineManagement }, type: 'completeFarm' },
        { id: 'pets-report', data: { module: 'Pets', count: (m.petManagement||[]).length, records: m.petManagement }, type: 'completeFarm' },
        { id: 'azolla-report', data: { module: 'Azolla Farming', count: (m.azolla||[]).length, records: m.azolla }, type: 'completeFarm' },
        { id: 'bsf-report', data: { module: 'BSF Farming', count: (m.bsf||[]).length, records: m.bsf }, type: 'completeFarm' },
        { id: 'pastures-report', data: { module: 'Pastures', count: (m.pastures||[]).length, records: m.pastures }, type: 'completeFarm' },
        { id: 'breeding-report', data: { module: 'Breeding', count: (m.breeding||[]).length, records: m.breeding }, type: 'completeFarm' },
        { id: 'feeding-report', data: { module: 'Feeding', count: (m.feeding||[]).length, records: m.feeding }, type: 'completeFarm' },
        { id: 'treatments-report', data: { module: 'Treatments', count: (m.treatments||[]).length, records: m.treatments }, type: 'completeFarm' },
        { id: 'measurements-report', data: { module: 'Measurements', count: (m.measurements||[]).length, records: m.measurements }, type: 'completeFarm' },
        { id: 'milk-report', data: { module: 'Milk Yield', count: (m.milkYield||[]).length, records: m.milkYield }, type: 'completeFarm' },
        { id: 'finance-report', data: { module: 'Finance', count: (m.finance||[]).length, records: m.finance }, type: 'completeFarm' },
        { id: 'inventory-report', data: { module: 'Inventory', count: (m.inventory||[]).length, records: m.inventory }, type: 'completeFarm' },
        { id: 'tasks-report', data: { module: 'Tasks', count: (m.tasks||[]).length, records: m.tasks }, type: 'completeFarm' },
        { id: 'schedules-report', data: { module: 'Schedules', count: (m.schedules||[]).length, records: m.schedules }, type: 'completeFarm' },
        { id: 'groups-report', data: { module: 'Groups', count: (m.groups||[]).length, records: m.groups }, type: 'completeFarm' }
      ]
    }
    
    if(section === 'animals') return (m.animals||[]).map(a=> ({ id: a.id || a.tag || a.name, data: a, type:'animal' }))
    if(section === 'tasks') return (m.tasks||[]).map(t=> ({ id: t.id || t.title || Math.random().toString(36).slice(2,8), data: t, type:'task' }))
    if(section === 'finance') return (m.finance||[]).map(f=> ({ id: f.id || Math.random().toString(36).slice(2,8), data: f, type:'finance' }))
    if(section === 'crops') return (m.crops||[]).map(c=> ({ id: c.id || c.name || Math.random().toString(36).slice(2,8), data: c, type:'crop' }))
    if(section === 'cropPest') return (m.cropPest||[]).map(p=> ({ id: p.id || p.cropId || Math.random().toString(36).slice(2,8), data: p, type:'cropPest' }))
    if(section === 'cropDisease') return (m.cropDisease||[]).map(d=> ({ id: d.id || d.cropId || Math.random().toString(36).slice(2,8), data: d, type:'cropDisease' }))
    if(section === 'resources') return (m.resources||[]).map(r=> ({ id: r.id || r.name || Math.random().toString(36).slice(2,8), data: r, type:'resource' }))
    if(section === 'schedules') return (m.schedules||[]).map(s=> ({ id: s.id || s.title || Math.random().toString(36).slice(2,8), data: s, type:'schedule' }))
    if(section === 'groups') return (m.groups||[]).map(g=> ({ id: g.id || g.name || Math.random().toString(36).slice(2,8), data: g, type:'group' }))
    if(section === 'pastures') return (m.pastures||[]).map(p=> ({ id: p.id || p.name || Math.random().toString(36).slice(2,8), data: p, type:'pasture' }))
    if(section === 'health') return (m.health||[]).map(h=> ({ id: h.id || h.name || Math.random().toString(36).slice(2,8), data: h, type:'health' }))
    if(section === 'feeding') return (m.feeding||[]).map(f=> ({ id: f.id || Math.random().toString(36).slice(2,8), data: f, type:'feeding' }))
    if(section === 'measurements') return (m.measurements||[]).map(m=> ({ id: m.id || Math.random().toString(36).slice(2,8), data: m, type:'measurement' }))
    if(section === 'breeding') return (m.breeding||[]).map(b=> ({ id: b.id || Math.random().toString(36).slice(2,8), data: b, type:'breeding' }))
    if(section === 'milkYield') return (m.milkYield||[]).map(my=> ({ id: my.id || Math.random().toString(36).slice(2,8), data: my, type:'milkYield' }))
    if(section === 'treatments') return (m.treatments||[]).map(t=> ({ id: t.id || Math.random().toString(36).slice(2,8), data: t, type:'treatment' }))
    if(section === 'semen') return (m.semen||[]).map(s=> ({ id: s.id || Math.random().toString(36).slice(2,8), data: s, type:'semen' }))
    if(section === 'inventory') return (m.inventory||[]).map(i=> ({ id: i.id || Math.random().toString(36).slice(2,8), data: i, type:'inventory' }))
    if(section === 'poultry') return (m.poultry||[]).map(p=> ({ id: p.id || Math.random().toString(36).slice(2,8), data: p, type:'poultry' }))
    if(section === 'flocks') return (m.flocks||[]).map(f=> ({ id: f.id || Math.random().toString(36).slice(2,8), data: f, type:'flock' }))
    if(section === 'azolla') return (m.azolla||[]).map(a=> ({ id: a.id || a.name || Math.random().toString(36).slice(2,8), data: a, type:'azolla' }))
    if(section === 'bsf') return (m.bsf||[]).map(b=> ({ id: b.id || b.name || Math.random().toString(36).slice(2,8), data: b, type:'bsf' }))
    if(section === 'additionalReports') return (m.additionalReports||[]).map(r=> ({ id: r.id || r.name || Math.random().toString(36).slice(2,8), data: r, type:'additionalReports' }))
    if(section === 'animalBreeding') return (m.animalBreeding||[]).map(a=> ({ id: a.id || a.name || Math.random().toString(36).slice(2,8), data: a, type:'animalBreeding' }))
    if(section === 'animalFeeding') return (m.animalFeeding||[]).map(a=> ({ id: a.id || a.name || Math.random().toString(36).slice(2,8), data: a, type:'animalFeeding' }))
    if(section === 'animalMeasurement') return (m.animalMeasurement||[]).map(a=> ({ id: a.id || a.name || Math.random().toString(36).slice(2,8), data: a, type:'animalMeasurement' }))
    if(section === 'animalMilkYield') return (m.animalMilkYield||[]).map(a=> ({ id: a.id || a.name || Math.random().toString(36).slice(2,8), data: a, type:'animalMilkYield' }))
    if(section === 'animalTreatment') return (m.animalTreatment||[]).map(a=> ({ id: a.id || a.name || Math.random().toString(36).slice(2,8), data: a, type:'animalTreatment' }))
    if(section === 'calfManagement') return (m.calfManagement||[]).map(a=> ({ id: a.id || a.name || Math.random().toString(36).slice(2,8), data: a, type:'calfManagement' }))
    if(section === 'canineManagement') return (m.canineManagement||[]).map(a=> ({ id: a.id || a.name || Math.random().toString(36).slice(2,8), data: a, type:'canineManagement' }))
    if(section === 'poultryManagement') return (m.poultryManagement||[]).map(a=> ({ id: a.id || a.name || Math.random().toString(36).slice(2,8), data: a, type:'poultryManagement' }))
    if(section === 'petManagement') return (m.petManagement||[]).map(a=> ({ id: a.id || a.name || Math.random().toString(36).slice(2,8), data: a, type:'petManagement' }))
    return []
  }

  const list = getSectionItems()
  
  // Calculate summary stats
  const getSummaryStats = () => {
    const m = items || {}
    const stats = { count: list.length }
    
    if (section === 'completeFarm') {
      // Complete farm overview stats
      stats.totalModules = 19
      stats.totalAnimals = (m.animals||[]).length + (m.poultry||[]).length + (m.calfManagement||[]).length + (m.canineManagement||[]).length + (m.petManagement||[]).length
      stats.totalCrops = (m.crops||[]).length
      stats.totalTasks = (m.tasks||[]).length
      stats.totalRecords = Object.values(m).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0)
      const income = (m.finance || []).filter(i => i.type === 'income' || i.amount > 0).reduce((sum, i) => sum + Math.abs(i.amount || 0), 0)
      const expenses = (m.finance || []).filter(i => i.type === 'expense' || i.amount < 0).reduce((sum, i) => sum + Math.abs(i.amount || 0), 0)
      stats.totalRevenue = income
      stats.totalExpenses = expenses
      stats.netProfit = income - expenses
    } else if (section === 'finance') {
      const income = (m.finance || []).filter(i => i.type === 'income' || i.amount > 0).reduce((sum, i) => sum + Math.abs(i.amount || 0), 0)
      const expenses = (m.finance || []).filter(i => i.type === 'expense' || i.amount < 0).reduce((sum, i) => sum + Math.abs(i.amount || 0), 0)
      stats.income = income
      stats.expenses = expenses
      stats.balance = income - expenses
    } else if (section === 'animals') {
      stats.active = (m.animals || []).filter(a => a.status === 'Active').length
      stats.breeds = [...new Set((m.animals || []).map(a => a.breed))].filter(Boolean).length
    } else if (section === 'crops') {
      stats.totalArea = (m.crops || []).reduce((sum, c) => sum + (c.area || 0), 0)
      stats.activeGrowing = (m.crops || []).filter(c => ['Planted', 'Growing', 'Flowering', 'Filling'].includes(c.status)).length
    } else if (section === 'tasks') {
      stats.completed = (m.tasks || []).filter(t => t.done).length
      stats.pending = (m.tasks || []).filter(t => !t.done).length
      stats.highPriority = (m.tasks || []).filter(t => !t.done && (t.priority === 'High' || t.priority === 'Critical')).length
    }
    
    return stats
  }
  
  const summaryStats = getSummaryStats()

  return (
    <div>
      <div className="health-header">
        <div>
          <h3 className="health-title">Reports</h3>
          <div className="muted">Central report hub — export and preview datasets</div>
        </div>
        <div className="health-toolbar" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <strong>Report Module:</strong>
            <select 
              value={section}
              onChange={(e) => setSection(e.target.value)}
              style={{ padding: '8px 12px', fontSize: '14px', minWidth: '220px' }}
            >
              <optgroup label="📋 Complete Reports">
                <option value="completeFarm">🌾 Complete Farm Report (All Modules)</option>
              </optgroup>
              <optgroup label="Livestock">
                <option value="animals">Animals</option>
                <option value="calfManagement">Calf Management</option>
                <option value="canineManagement">Canine Management</option>
                <option value="petManagement">Pet Management</option>
                <option value="breeding">Breeding Records</option>
                <option value="semen">Semen Inventory</option>
                <option value="poultry">Poultry</option>
                <option value="flocks">Flocks</option>
                <option value="feeding">Feeding</option>
                <option value="milkYield">Milk Yield</option>
                <option value="treatments">Treatments</option>
                <option value="measurements">Measurements</option>
              </optgroup>
              <optgroup label="Crops & Land">
                <option value="crops">Crops</option>
                <option value="cropAdd">Crop Add</option>
                <option value="cropSales">Crop Sales</option>
                <option value="cropTreatment">Crop Treatment</option>
                <option value="cropYield">Crop Yield</option>
                <option value="cropPest">Crop Pest Management</option>
                <option value="cropDisease">Crop Disease Management</option>
                <option value="pastures">Pastures</option>
                <option value="azolla">Azolla Farming</option>
                <option value="bsf">BSF Farming</option>
              </optgroup>
              <optgroup label="Management">
                <option value="finance">Finance</option>
                <option value="inventory">Inventory</option>
                <option value="tasks">Tasks</option>
                <option value="schedules">Schedules</option>
                <option value="groups">Groups</option>
                <option value="audit">Audit Log</option>
                <option value="backup">Backup & Restore</option>
                <option value="bulk">Bulk Operations</option>
              </optgroup>
              <optgroup label="Health & Resources">
                <option value="health">Health System</option>
                <option value="resources">Resources</option>
              </optgroup>
              <optgroup label="Other Modules">
                <option value="calendar">Calendar</option>
                <option value="photoGallery">Photo Gallery</option>
                <option value="voiceInput">Voice Input</option>
                <option value="advancedAnalytics">Advanced Analytics</option>
                <option value="additionalReports">Additional Reports</option>
              </optgroup>
            </select>
          </label>
          <button className={`tab-btn ${section==='analytics'? 'active' : ''}`} onClick={()=>setSection('analytics')} style={{background: 'linear-gradient(135deg, var(--accent1), var(--accent2))', color: '#fff', fontWeight: '600'}}>📊 Advanced Analytics</button>
        </div>
      </div>

      <div className="panel">
        {/* Summary Stats Card */}
        <div className="card" style={{ marginBottom: '20px', padding: '20px', background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', color: '#fff' }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#fff' }}>{section === 'completeFarm' ? '🌾 Complete Farm Overview' : section.charAt(0).toUpperCase() + section.slice(1)} Summary</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
            {section === 'completeFarm' ? (
              <>
                <div>
                  <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{summaryStats.totalModules}</div>
                  <div style={{ fontSize: '14px', opacity: 0.9 }}>Active Modules</div>
                </div>
                <div>
                  <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{summaryStats.totalRecords}</div>
                  <div style={{ fontSize: '14px', opacity: 0.9 }}>Total Records</div>
                </div>
                <div>
                  <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{summaryStats.totalAnimals}</div>
                  <div style={{ fontSize: '14px', opacity: 0.9 }}>Total Animals</div>
                </div>
                <div>
                  <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{summaryStats.totalCrops}</div>
                  <div style={{ fontSize: '14px', opacity: 0.9 }}>Total Crops</div>
                </div>
                <div>
                  <div style={{ fontSize: '32px', fontWeight: 'bold' }}>KES {summaryStats.totalRevenue?.toFixed(0) || 0}</div>
                  <div style={{ fontSize: '14px', opacity: 0.9 }}>Total Revenue</div>
                </div>
                <div>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: summaryStats.netProfit >= 0 ? '#d1fae5' : '#fecaca' }}>
                    KES {summaryStats.netProfit?.toFixed(0) || 0}
                  </div>
                  <div style={{ fontSize: '14px', opacity: 0.9 }}>Net Profit</div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{summaryStats.count}</div>
                  <div style={{ fontSize: '14px', opacity: 0.9 }}>Total Records</div>
                </div>
              </>
            )}
            
            {section === 'finance' && (
              <>
                <div>
                  <div style={{ fontSize: '32px', fontWeight: 'bold' }}>${summaryStats.income?.toFixed(0) || 0}</div>
                  <div style={{ fontSize: '14px', opacity: 0.9 }}>Total Income</div>
                </div>
                <div>
                  <div style={{ fontSize: '32px', fontWeight: 'bold' }}>${summaryStats.expenses?.toFixed(0) || 0}</div>
                  <div style={{ fontSize: '14px', opacity: 0.9 }}>Total Expenses</div>
                </div>
                <div>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: summaryStats.balance >= 0 ? '#d1fae5' : '#fecaca' }}>
                    ${summaryStats.balance?.toFixed(0) || 0}
                  </div>
                  <div style={{ fontSize: '14px', opacity: 0.9 }}>Net Balance</div>
                </div>
              </>
            )}
            
            {section === 'animals' && (
              <>
                <div>
                  <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{summaryStats.active || 0}</div>
                  <div style={{ fontSize: '14px', opacity: 0.9 }}>Active Animals</div>
                </div>
                <div>
                  <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{summaryStats.breeds || 0}</div>
                  <div style={{ fontSize: '14px', opacity: 0.9 }}>Breeds</div>
                </div>
              </>
            )}
            
            {section === 'crops' && (
              <>
                <div>
                  <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{summaryStats.totalArea?.toFixed(1) || 0}</div>
                  <div style={{ fontSize: '14px', opacity: 0.9 }}>Total Acres</div>
                </div>
                <div>
                  <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{summaryStats.activeGrowing || 0}</div>
                  <div style={{ fontSize: '14px', opacity: 0.9 }}>Active Crops</div>
                </div>
              </>
            )}
            
            {section === 'tasks' && (
              <>
                <div>
                  <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{summaryStats.completed || 0}</div>
                  <div style={{ fontSize: '14px', opacity: 0.9 }}>Completed</div>
                </div>
                <div>
                  <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{summaryStats.pending || 0}</div>
                  <div style={{ fontSize: '14px', opacity: 0.9 }}>Pending</div>
                </div>
                <div>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: summaryStats.highPriority > 0 ? '#fecaca' : '#d1fae5' }}>
                    {summaryStats.highPriority || 0}
                  </div>
                  <div style={{ fontSize: '14px', opacity: 0.9 }}>High Priority</div>
                </div>
              </>
            )}
          </div>
        </div>
        
        {/* Advanced Analytics Section */}
        {section === 'analytics' && <AdvancedAnalyticsSection />}
        
        {section !== 'analytics' && (
        <>
        <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:12, flexWrap: 'wrap' }}>
          <select value={section} onChange={e=>setSection(e.target.value)} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', minWidth: '220px' }}>
            <optgroup label="Livestock">
              <option value="animals">Animals</option>
              <option value="breeding">Breeding Records</option>
              <option value="semen">Semen Inventory</option>
              <option value="poultry">Poultry</option>
              <option value="flocks">Flocks</option>
              <option value="feeding">Feeding</option>
              <option value="milkYield">Milk Yield</option>
              <option value="treatments">Treatments</option>
              <option value="measurements">Measurements</option>
            </optgroup>
            <optgroup label="Crops & Land">
              <option value="crops">Crops</option>
              <option value="cropPest">Crop Pest Management</option>
              <option value="cropDisease">Crop Disease Management</option>
              <option value="pastures">Pastures</option>
            </optgroup>
            <optgroup label="Management">
              <option value="finance">Finance</option>
              <option value="inventory">Inventory</option>
              <option value="tasks">Tasks</option>
              <option value="schedules">Schedules</option>
              <option value="groups">Groups</option>
            </optgroup>
            <optgroup label="Health & Resources">
              <option value="health">Health System</option>
              <option value="resources">Resources</option>
            </optgroup>
          </select>
          <button className="tab-btn" onClick={()=> {
            setViewingData(list.map(i=> i.data))
            setViewTitle(`${section.charAt(0).toUpperCase() + section.slice(1)} - Full Report`)
            setViewFormat('formatted')
          }}>📊 View Full Report ({list.length})</button>
          
          {/* PDF Export Buttons */}
          {section === 'animals' && (
            <button className="tab-btn" style={{ background: '#ef4444', color: 'white' }} onClick={()=> {
              const today = new Date().toISOString().slice(0, 10)
              const sixMonthsAgo = new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString().slice(0, 10)
              exportAnimalProfitReport(items.animals || [], sixMonthsAgo, today)
            }}>📕 PDF: Profit Report</button>
          )}
          {section === 'breeding' && (
            <button className="tab-btn" style={{ background: '#ec4899', color: 'white' }} onClick={()=> {
              const pets = JSON.parse(localStorage.getItem('cattalytics:pets') || '[]')
              exportBreedingRecords(items.animals || [], pets)
            }}>📕 PDF: Breeding Records</button>
          )}
          {section === 'crops' && (
            <button className="tab-btn" style={{ background: '#059669', color: 'white' }} onClick={()=> {
              const today = new Date().toISOString().slice(0, 10)
              const oneYearAgo = new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().slice(0, 10)
              exportCropYieldReport(items.crops || [], oneYearAgo, today)
            }}>📕 PDF: Yield Report</button>
          )}
          {section === 'finance' && (
            <button className="tab-btn" style={{ background: '#3b82f6', color: 'white' }} onClick={()=> {
              const today = new Date().toISOString().slice(0, 10)
              const threeMonthsAgo = new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString().slice(0, 10)
              exportFinancialSummary(items.finance || [], threeMonthsAgo, today)
            }}>📕 PDF: Financial Summary</button>
          )}
          {section === 'inventory' && (
            <button className="tab-btn" style={{ background: '#8b5cf6', color: 'white' }} onClick={()=> {
              exportInventoryReport(items.inventory || [])
            }}>📕 PDF: Inventory Report</button>
          )}
          
          <button className="tab-btn" onClick={()=> downloadDocx(list.map(i=> i.data), `${section}-report-${new Date().toISOString().slice(0,10)}.docx`, `${section.charAt(0).toUpperCase() + section.slice(1)} Report`, section)}>📄 DOCX Report</button>
          <button className="tab-btn" onClick={()=> {
            import('../lib/exportImport').then(mod => {
              mod.exportToPDF(list.map(i=> i.data), `${section}-report-${new Date().toISOString().slice(0,10)}`, `${section.charAt(0).toUpperCase() + section.slice(1)} Report`)
            })
          }}>📕 PDF Report</button>
          <button className="tab-btn" onClick={()=> setViewFormat('table')}>📋 Table View</button>
          <button className="tab-btn" onClick={()=> downloadJson(list.map(i=> i.data), `${section}-export.json`)}>JSON</button>
          <button className="tab-btn" onClick={()=> downloadXml(list.map(i=> i.data), `${section}-export.xml`)}>XML</button>
        </div>

        <div>
          {list.length===0 ? <div className="muted">No records for selected section.</div> : list.map(it=> (
            <div key={it.id} className="card" style={{ marginBottom:8 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <div style={{ fontWeight:600 }}>
                    {it.type === 'completeFarm' ? `📦 ${it.data.module}` :
                     it.type === 'animal' ? (it.data.name || it.data.tag || it.id) : 
                     it.type === 'crop' ? (it.data.name || it.id) :
                     it.type === 'task' ? (it.data.title || it.id) :
                     it.type === 'finance' ? (it.data.description || it.id) :
                     it.type === 'pasture' ? (it.data.name || it.id) :
                     it.type === 'schedule' ? (it.data.title || it.id) :
                     it.type === 'resource' ? (it.data.name || it.id) :
                     it.type === 'group' ? (it.data.name || it.id) :
                     it.type === 'health' ? (it.data.name || it.data.tag || it.id) :
                     `${it.type} ${it.id}`}
                  </div>
                  <div className="muted">
                    {it.type === 'completeFarm' ? `${it.data.count} records in ${it.data.module}` : `${it.type} • ${it.id}`}
                  </div>
                </div>
                <div>
                  <button className="tab-btn" onClick={()=> {
                    setViewingData(it.data)
                    setViewTitle(it.type === 'completeFarm' ? `${it.data.module} Module Report` : `${it.type} - ${it.id}`)
                    setViewFormat('formatted')
                  }}>👁️ View</button>
                  <button className="tab-btn" onClick={()=> downloadDocx(it.data, `${it.type}-${it.id}.docx`, it.type === 'completeFarm' ? `${it.data.module} Report` : `${it.type} ${it.id}`, section)}>📄 DOCX</button>
                  <button className="tab-btn" onClick={()=> downloadJson(it.data, `${it.type}-${it.id}.json`)}>JSON</button>
                </div>
              </div>
            </div>
          ))}
        </div>
        </>
        )}
      </div>

      {/* Data Viewer Modal */}
      {viewingData && (
        <div className="drawer-overlay" onClick={() => setViewingData(null)}>
          <div className="drawer" onClick={e => e.stopPropagation()} style={{ maxWidth: '1000px', width: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3>{viewTitle}</h3>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <select value={viewFormat} onChange={e => setViewFormat(e.target.value)} style={{ padding: '6px 10px' }}>
                  <option value="formatted">Formatted View</option>
                  <option value="table">Table View</option>
                  <option value="excel">Excel View</option>
                  <option value="json">JSON</option>
                  <option value="xml">XML</option>
                  <option value="docx">DOCX Preview</option>
                </select>
                <button onClick={() => downloadJson(viewingData, `${viewTitle.replace(/ /g, '-')}.json`)}>JSON</button>
                <button onClick={() => downloadXml(viewingData, `${viewTitle.replace(/ /g, '-')}.xml`)}>XML</button>
                <button onClick={() => downloadDocx(viewingData, `${viewTitle.replace(/ /g, '-')}.docx`, viewTitle)}>DOCX</button>
                <button onClick={() => setViewingData(null)}>Close</button>
              </div>
            </div>
            
            <div style={{ 
              background: '#fff', 
              padding: '20px', 
              borderRadius: '8px', 
              maxHeight: '70vh', 
              overflowY: 'auto'
            }}>
              {viewFormat === 'formatted' && (
                <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '16px' }}>
                  {/* Report Header */}
                  <div style={{ 
                    background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', 
                    color: '#fff', 
                    padding: '32px', 
                    borderRadius: '12px', 
                    marginBottom: '32px',
                    textAlign: 'center'
                  }}>
                    <h1 style={{ margin: '0 0 12px 0', fontSize: '32px', fontWeight: 'bold' }}>
                      {section === 'animals' ? '🐄 Animal Records' :
                       section === 'crops' ? '🌾 Crop Records' :
                       section === 'finance' ? '💰 Money Records' :
                       section === 'tasks' ? '📋 Task List' :
                       section === 'pastures' ? '🌱 Pasture Records' :
                       section === 'health' ? '🏥 Health Records' :
                       `📊 ${section.charAt(0).toUpperCase() + section.slice(1)} Records`}
                    </h1>
                    <div style={{ fontSize: '18px', opacity: 0.95 }}>
                      {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                    <div style={{ fontSize: '16px', opacity: 0.9, marginTop: '4px' }}>
                      {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  
                  {Array.isArray(viewingData) ? (
                    <>
                      {/* Summary Section */}
                      <div style={{ 
                        background: '#fffbeb', 
                        padding: '28px', 
                        borderRadius: '12px',
                        marginBottom: '32px',
                        border: '3px solid #fbbf24'
                      }}>
                        <h2 style={{ margin: '0 0 20px 0', color: '#92400e', fontSize: '24px' }}>📊 Quick Summary</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px' }}>
                          <div style={{ textAlign: 'center', padding: '16px', background: '#fff', borderRadius: '8px' }}>
                            <div style={{ fontSize: '14px', color: '#78716c', marginBottom: '8px', textTransform: 'uppercase', fontWeight: 'bold' }}>Total Records</div>
                            <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#059669' }}>{viewingData.length}</div>
                          </div>
                          
                          {section === 'finance' && (
                            <>
                              <div style={{ textAlign: 'center', padding: '16px', background: '#fff', borderRadius: '8px' }}>
                                <div style={{ fontSize: '14px', color: '#78716c', marginBottom: '8px', textTransform: 'uppercase', fontWeight: 'bold' }}>Money In</div>
                                <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#059669' }}>
                                  ${viewingData.filter(i => i.type === 'income' || i.amount > 0).reduce((sum, i) => sum + Math.abs(i.amount || 0), 0).toFixed(2)}
                                </div>
                              </div>
                              <div style={{ textAlign: 'center', padding: '16px', background: '#fff', borderRadius: '8px' }}>
                                <div style={{ fontSize: '14px', color: '#78716c', marginBottom: '8px', textTransform: 'uppercase', fontWeight: 'bold' }}>Money Out</div>
                                <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#dc2626' }}>
                                  ${viewingData.filter(i => i.type === 'expense' || i.amount < 0).reduce((sum, i) => sum + Math.abs(i.amount || 0), 0).toFixed(2)}
                                </div>
                              </div>
                              <div style={{ textAlign: 'center', padding: '16px', background: '#fff', borderRadius: '8px' }}>
                                <div style={{ fontSize: '14px', color: '#78716c', marginBottom: '8px', textTransform: 'uppercase', fontWeight: 'bold' }}>Balance</div>
                                <div style={{ fontSize: '36px', fontWeight: 'bold', color: (viewingData.filter(i => i.type === 'income' || i.amount > 0).reduce((sum, i) => sum + Math.abs(i.amount || 0), 0) - viewingData.filter(i => i.type === 'expense' || i.amount < 0).reduce((sum, i) => sum + Math.abs(i.amount || 0), 0)) >= 0 ? '#059669' : '#dc2626' }}>
                                  ${(viewingData.filter(i => i.type === 'income' || i.amount > 0).reduce((sum, i) => sum + Math.abs(i.amount || 0), 0) - viewingData.filter(i => i.type === 'expense' || i.amount < 0).reduce((sum, i) => sum + Math.abs(i.amount || 0), 0)).toFixed(2)}
                                </div>
                              </div>
                            </>
                          )}
                          
                          {section === 'animals' && (
                            <>
                              <div style={{ textAlign: 'center', padding: '16px', background: '#fff', borderRadius: '8px' }}>
                                <div style={{ fontSize: '14px', color: '#78716c', marginBottom: '8px', textTransform: 'uppercase', fontWeight: 'bold' }}>Active Animals</div>
                                <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#059669' }}>
                                  {viewingData.filter(a => a.status === 'Active').length}
                                </div>
                              </div>
                              <div style={{ textAlign: 'center', padding: '16px', background: '#fff', borderRadius: '8px' }}>
                                <div style={{ fontSize: '14px', color: '#78716c', marginBottom: '8px', textTransform: 'uppercase', fontWeight: 'bold' }}>Different Breeds</div>
                                <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#059669' }}>
                                  {[...new Set(viewingData.map(a => a.breed))].filter(Boolean).length}
                                </div>
                              </div>
                            </>
                          )}
                          
                          {section === 'crops' && (
                            <>
                              <div style={{ textAlign: 'center', padding: '16px', background: '#fff', borderRadius: '8px' }}>
                                <div style={{ fontSize: '14px', color: '#78716c', marginBottom: '8px', textTransform: 'uppercase', fontWeight: 'bold' }}>Total Acres</div>
                                <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#059669' }}>
                                  {viewingData.reduce((sum, c) => sum + (c.area || 0), 0).toFixed(1)}
                                </div>
                              </div>
                              <div style={{ textAlign: 'center', padding: '16px', background: '#fff', borderRadius: '8px' }}>
                                <div style={{ fontSize: '14px', color: '#78716c', marginBottom: '8px', textTransform: 'uppercase', fontWeight: 'bold' }}>Growing Now</div>
                                <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#059669' }}>
                                  {viewingData.filter(c => ['Planted', 'Growing', 'Flowering', 'Filling'].includes(c.status)).length}
                                </div>
                              </div>
                            </>
                          )}
                          
                          {section === 'tasks' && (
                            <>
                              <div style={{ textAlign: 'center', padding: '16px', background: '#fff', borderRadius: '8px' }}>
                                <div style={{ fontSize: '14px', color: '#78716c', marginBottom: '8px', textTransform: 'uppercase', fontWeight: 'bold' }}>Done</div>
                                <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#059669' }}>
                                  {viewingData.filter(t => t.done).length}
                                </div>
                              </div>
                              <div style={{ textAlign: 'center', padding: '16px', background: '#fff', borderRadius: '8px' }}>
                                <div style={{ fontSize: '14px', color: '#78716c', marginBottom: '8px', textTransform: 'uppercase', fontWeight: 'bold' }}>To Do</div>
                                <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#f59e0b' }}>
                                  {viewingData.filter(t => !t.done).length}
                                </div>
                              </div>
                              <div style={{ textAlign: 'center', padding: '16px', background: '#fff', borderRadius: '8px' }}>
                                <div style={{ fontSize: '14px', color: '#78716c', marginBottom: '8px', textTransform: 'uppercase', fontWeight: 'bold' }}>Urgent</div>
                                <div style={{ fontSize: '36px', fontWeight: 'bold', color: viewingData.filter(t => !t.done && (t.priority === 'High' || t.priority === 'Critical')).length > 0 ? '#dc2626' : '#059669' }}>
                                  {viewingData.filter(t => !t.done && (t.priority === 'High' || t.priority === 'Critical')).length}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                      
                      {/* Records */}
                      <h2 style={{ margin: '0 0 20px 0', color: '#374151', fontSize: '24px' }}>📋 All Records</h2>
                      {viewingData.map((item, index) => {
                        // Simplify field names for farmers
                        const simplifyLabel = (key) => {
                          const simpleNames = {
                            'id': 'ID Number',
                            'tag': 'Tag Number',
                            'name': 'Name',
                            'breed': 'Breed',
                            'sex': 'Gender',
                            'dob': 'Birth Date',
                            'weight': 'Weight (lbs)',
                            'status': 'Status',
                            'amount': 'Amount ($)',
                            'date': 'Date',
                            'type': 'Type',
                            'category': 'Category',
                            'description': 'Details',
                            'vendor': 'Vendor/Store',
                            'area': 'Acres',
                            'planted': 'Planted Date',
                            'expectedHarvest': 'Expected Harvest',
                            'variety': 'Variety',
                            'soilType': 'Soil Type',
                            'irrigationType': 'Watering Method',
                            'field': 'Field Location',
                            'title': 'Title',
                            'assignedTo': 'Assigned To',
                            'due': 'Due Date',
                            'priority': 'Priority',
                            'done': 'Completed',
                            'notes': 'Notes',
                            'color': 'Color',
                            'groupId': 'Group',
                            'owner': 'Owner',
                            'sire': 'Father',
                            'dam': 'Mother'
                          }
                          return simpleNames[key] || key.replace(/([A-Z])/g, ' $1').trim()
                        }
                        
                        return (
                          <div key={index} style={{ 
                            background: '#fff', 
                            padding: '24px', 
                            marginBottom: '20px', 
                            borderRadius: '12px',
                            border: '2px solid #e5e7eb',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                          }}>
                            <div style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'center',
                              marginBottom: '20px',
                              paddingBottom: '16px',
                              borderBottom: '3px solid #10b981'
                            }}>
                              <h3 style={{ margin: 0, color: '#10b981', fontSize: '22px', fontWeight: 'bold' }}>
                                {item.name || item.title || item.description?.substring(0, 50) || `Record #${index + 1}`}
                              </h3>
                              <span style={{ 
                                background: '#10b981', 
                                color: '#fff', 
                                padding: '8px 16px', 
                                borderRadius: '20px',
                                fontSize: '14px',
                                fontWeight: 'bold'
                              }}>
                                {item.id || `#${index + 1}`}
                              </span>
                            </div>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                              {Object.entries(item).map(([key, value]) => {
                                if (key === 'notes' || key === 'photo' || key === 'photos' || key === 'treatments' || key === 'healthMonitoring') return null
                                return (
                                  <div key={key} style={{ 
                                    padding: '16px',
                                    background: '#f9fafb',
                                    borderRadius: '8px',
                                    border: '1px solid #e5e7eb'
                                  }}>
                                    <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '6px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                                      {simplifyLabel(key)}
                                    </div>
                                    <div style={{ fontSize: '17px', color: '#111827', fontWeight: '600', lineHeight: '1.4' }}>
                                      {typeof value === 'boolean' ? (
                                        <span style={{ color: value ? '#059669' : '#dc2626', fontWeight: 'bold' }}>
                                          {value ? '✓ Yes' : '✗ No'}
                                        </span>
                                      ) : typeof value === 'object' && value !== null ? (
                                        <span style={{ color: '#6b7280', fontSize: '14px' }}>See full details</span>
                                      ) : value === null || value === undefined || value === '' ? (
                                        <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>—</span>
                                      ) : key === 'amount' || key.toLowerCase().includes('price') || key.toLowerCase().includes('cost') ? (
                                        <span style={{ color: parseFloat(value) >= 0 ? '#059669' : '#dc2626', fontWeight: 'bold' }}>
                                          ${Math.abs(parseFloat(value) || 0).toFixed(2)}
                                        </span>
                                      ) : (
                                        String(value)
                                      )}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })}
                    </>
                  ) : (
                    <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '2px solid #e5e7eb' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                        {Object.entries(viewingData).map(([key, value]) => {
                          const simplifyLabel = (key) => {
                            const simpleNames = {
                              'id': 'ID Number',
                              'tag': 'Tag Number',
                              'name': 'Name',
                              'breed': 'Breed',
                              'sex': 'Gender',
                              'dob': 'Birth Date',
                              'weight': 'Weight (lbs)',
                              'status': 'Status',
                              'amount': 'Amount ($)',
                              'date': 'Date',
                              'type': 'Type',
                              'category': 'Category',
                              'description': 'Details',
                              'vendor': 'Vendor/Store'
                            }
                            return simpleNames[key] || key.replace(/([A-Z])/g, ' $1').trim()
                          }
                          
                          return (
                            <div key={key} style={{ 
                              padding: '16px',
                              background: '#f9fafb',
                              borderRadius: '8px',
                              border: '1px solid #e5e7eb'
                            }}>
                              <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '6px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                                {simplifyLabel(key)}
                              </div>
                              <div style={{ fontSize: '17px', color: '#111827', fontWeight: '600' }}>
                                {typeof value === 'object' && value !== null ? (
                                  <span style={{ color: '#6b7280', fontSize: '14px' }}>See full details</span>
                                ) : (
                                  String(value || '—')
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {viewFormat === 'json' && (
                <pre style={{ 
                  margin: 0,
                  fontFamily: 'monospace',
                  fontSize: '13px',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}>
                  {JSON.stringify(viewingData, null, 2)}
                </pre>
              )}

              {viewFormat === 'docx' && (
                <div style={{ margin: '16px 0', padding: '16px', background: '#f3f4f6', borderRadius: '8px', color: '#374151' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>DOCX Preview (Text Only)</div>
                  <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '15px', whiteSpace: 'pre-wrap' }}>
                    {/* Render a text-based preview of the DOCX content */}
                    {Array.isArray(viewingData)
                      ? viewingData.map((row, idx) => (
                          <div key={idx} style={{ marginBottom: '12px', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px' }}>
                            {Object.entries(row).map(([key, value]) => (
                              <div key={key} style={{ marginBottom: '4px' }}>
                                <span style={{ fontWeight: 'bold', color: '#059669' }}>{key}:</span> {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                              </div>
                            ))}
                          </div>
                        ))
                      : Object.entries(viewingData).map(([key, value]) => (
                          <div key={key} style={{ marginBottom: '4px' }}>
                            <span style={{ fontWeight: 'bold', color: '#059669' }}>{key}:</span> {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </div>
                        ))}
                  </div>
                  <div style={{ marginTop: '12px' }}>
                    <button style={{ background: '#059669', color: '#fff', padding: '8px 16px', border: 'none', borderRadius: '6px' }} onClick={() => downloadDocx(viewingData, `${viewTitle.replace(/ /g, '-')}.docx`, viewTitle)}>
                      Download DOCX
                    </button>
                  </div>
                </div>
              )}

                {viewFormat === 'table' && Array.isArray(viewingData) && viewingData.length > 0 && (
                  <div style={{ overflowX: 'auto', marginTop: '16px' }}>
                    {(() => {
                      // Collect all unique keys from all records
                      const allKeys = Array.from(new Set(viewingData.flatMap(obj => Object.keys(obj))));
                      return (
                        <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '15px', background: '#fff' }}>
                          <thead>
                            <tr>
                              {allKeys.map(key => (
                                <th key={key} style={{ border: '1px solid #e5e7eb', padding: '8px', background: '#e0f2fe', color: '#0ea5e9', fontWeight: 'bold' }}>{key}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {viewingData.map((row, idx) => (
                              <tr key={idx}>
                                {allKeys.map((key, vidx) => (
                                  <td key={vidx} style={{ border: '1px solid #e5e7eb', padding: '8px', color: '#374151', background: idx % 2 === 0 ? '#f1f5f9' : '#fff' }}>{typeof row[key] === 'object' ? JSON.stringify(row[key]) : String(row[key] ?? '')}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      );
                    })()}
                  </div>
                )}
              {viewFormat === 'excel' && Array.isArray(viewingData) && viewingData.length > 0 && (
                <div style={{ overflowX: 'auto', marginTop: '16px' }}>
                  {(() => {
                    // Collect all unique keys from all records
                    const allKeys = Array.from(new Set(viewingData.flatMap(obj => Object.keys(obj))));
                    return (
                      <>
                        <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '15px', background: '#fff' }}>
                          <thead>
                            <tr>
                              {allKeys.map(key => (
                                <th key={key} style={{ border: '1px solid #e5e7eb', padding: '8px', background: '#e0f2fe', color: '#0ea5e9', fontWeight: 'bold' }}>{key}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {viewingData.map((row, idx) => (
                              <tr key={idx}>
                                {allKeys.map((key, vidx) => (
                                  <td key={vidx} style={{ border: '1px solid #e5e7eb', padding: '8px', color: '#374151', background: idx % 2 === 0 ? '#f1f5f9' : '#fff' }}>{typeof row[key] === 'object' ? JSON.stringify(row[key]) : String(row[key] ?? '')}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <button style={{ marginTop: '12px', background: '#0ea5e9', color: '#fff', padding: '8px 16px', border: 'none', borderRadius: '6px' }} onClick={() => {
                          import('../lib/exportImport').then(mod => {
                            mod.exportToExcel(viewingData, `${viewTitle.replace(/ /g, '-')}.csv`, allKeys);
                          });
                        }}>Download as Excel CSV</button>
                      </>
                    );
                  })()}
                </div>
              )}
                  <div style={{ overflowX: 'auto', marginTop: '16px' }}>
                    {(() => {
                      // Collect all unique keys from all records
                      const allKeys = Array.from(new Set(viewingData.flatMap(obj => Object.keys(obj))));
                      return (
                        <>
                          <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '15px', background: '#fff' }}>
                            <thead>
                              <tr>
                                {allKeys.map(key => (
                                  <th key={key} style={{ border: '1px solid #e5e7eb', padding: '8px', background: '#f3f4f6', color: '#059669', fontWeight: 'bold' }}>{key}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {viewingData.map((row, idx) => (
                                <tr key={idx}>
                                  {allKeys.map((key, vidx) => (
                                    <td key={vidx} style={{ border: '1px solid #e5e7eb', padding: '8px', color: '#374151' }}>{typeof row[key] === 'object' ? JSON.stringify(row[key]) : String(row[key] ?? '')}</td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          <button style={{ marginTop: '12px', background: '#059669', color: '#fff', padding: '8px 16px', border: 'none', borderRadius: '6px' }} onClick={() => {
                            const csv = [allKeys.join(','), ...viewingData.map(row => allKeys.map(key => {
                              const val = row[key];
                              return typeof val === 'object' ? JSON.stringify(val) : String(val ?? '');
                            }).join(',') )].join('\n');
                            const blob = new Blob([csv], { type: 'text/csv' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `${viewTitle.replace(/ /g, '-')}.csv`;
                            document.body.appendChild(a);
                            a.click();
                            a.remove();
                            URL.revokeObjectURL(url);
                          }}>Download Table as CSV</button>
                        </>
                      );
                    })()}
                  </div>
                )}
              
              {viewFormat === 'xml' && (
                <pre style={{ 
                  margin: 0,
                  fontFamily: 'monospace',
                  fontSize: '13px',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  color: '#059669'
                }}>
                  {jsonToXml(viewingData, 'data')}
                </pre>
              )}
            </div>
            
            <div style={{ marginTop: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button onClick={() => {
                const textToCopy = viewFormat === 'xml' 
                  ? jsonToXml(viewingData, 'data')
                  : JSON.stringify(viewingData, null, 2)
                navigator.clipboard.writeText(textToCopy)
                alert('Copied to clipboard!')
              }} style={{ background: '#6b7280', color: '#fff', padding: '8px 16px', border: 'none', borderRadius: '6px' }}>
                📋 Copy to Clipboard
              </button>
              <button onClick={() => downloadDocx(viewingData, `${viewTitle.replace(/ /g, '-')}.docx`, viewTitle, section)} style={{ background: 'var(--green)', color: '#fff', padding: '8px 16px', border: 'none', borderRadius: '6px' }}>
                📄 Download DOCX Report
              </button>
              <button onClick={() => downloadJson(viewingData, `${viewTitle.replace(/ /g, '-')}.json`)} style={{ background: '#3b82f6', color: '#fff', padding: '8px 16px', border: 'none', borderRadius: '6px' }}>
                Download JSON
              </button>
              <button onClick={() => downloadXml(viewingData, `${viewTitle.replace(/ /g, '-')}.xml`)} style={{ background: '#8b5cf6', color: '#fff', padding: '8px 16px', border: 'none', borderRadius: '6px' }}>
                Download XML
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Advanced Analytics Component
function AdvancedAnalyticsSection() {
  const [activeTab, setActiveTab] = useState('fer')
  const [periodType, setPeriodType] = useState('month')
  const [ferData, setFerData] = useState(null)
  const [roiData, setRoiData] = useState(null)
  const [comparisonData, setComparisonData] = useState(null)
  const [topPerformers, setTopPerformers] = useState([])

  const animals = JSON.parse(localStorage.getItem('devinsfarm:animals') || '[]')

  useEffect(() => {
    if (activeTab === 'fer') {
      setFerData(calculateFeedEfficiency(animals))
    } else if (activeTab === 'roi') {
      setRoiData(calculateAnimalROI(animals))
    } else if (activeTab === 'comparison') {
      setComparisonData(comparePerformanceByPeriod(periodType))
    } else if (activeTab === 'top') {
      setTopPerformers(getTopPerformers('roi', 10))
    }
  }, [activeTab, periodType])

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <button 
          className={`tab-btn ${activeTab === 'fer' ? 'active' : ''}`}
          onClick={() => setActiveTab('fer')}
        >
          📊 Feed Efficiency Ratio
        </button>
        <button 
          className={`tab-btn ${activeTab === 'roi' ? 'active' : ''}`}
          onClick={() => setActiveTab('roi')}
        >
          💰 ROI Analysis
        </button>
        <button 
          className={`tab-btn ${activeTab === 'comparison' ? 'active' : ''}`}
          onClick={() => setActiveTab('comparison')}
        >
          📈 Comparative Analysis
        </button>
        <button 
          className={`tab-btn ${activeTab === 'top' ? 'active' : ''}`}
          onClick={() => setActiveTab('top')}
        >
          🏆 Top Performers
        </button>
      </div>

      {/* Feed Efficiency Ratio */}
      {activeTab === 'fer' && ferData && (
        <div>
          <div className="card" style={{ marginBottom: 20, padding: 20 }}>
            <h3>Feed Efficiency Ratio (FER) Analysis</h3>
            <p className="muted">FER = Weight Gain (kg) / Feed Consumed (kg)</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16, marginTop: 20 }}>
              <div>
                <div style={{ fontSize: 32, fontWeight: 'bold', color: 'var(--accent1)' }}>
                  {ferData.averageFER.toFixed(3)}
                </div>
                <div className="muted">Average FER</div>
              </div>
              <div>
                <div style={{ fontSize: 32, fontWeight: 'bold', color: 'var(--green)' }}>
                  {ferData.analyzedAnimals}
                </div>
                <div className="muted">Animals Analyzed</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gap: 12 }}>
            {ferData.results.map(result => (
              <div key={result.animalId} className="card" style={{ padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 16 }}>{result.animalName}</div>
                    <div className="muted">
                      {result.startWeight}kg → {result.endWeight}kg over {result.days} days
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 24, fontWeight: 'bold', color: result.fer > 0.15 ? 'var(--green)' : result.fer > 0.10 ? '#f59e0b' : '#ef4444' }}>
                      {result.fer.toFixed(3)}
                    </div>
                    <div style={{ 
                      display: 'inline-block',
                      padding: '4px 12px',
                      borderRadius: 12,
                      fontSize: 12,
                      fontWeight: 600,
                      background: result.efficiency === 'Excellent' ? '#d1fae5' : 
                                  result.efficiency === 'Good' ? '#fef3c7' : 
                                  result.efficiency === 'Average' ? '#dbeafe' : '#fecaca',
                      color: result.efficiency === 'Excellent' ? '#065f46' : 
                             result.efficiency === 'Good' ? '#92400e' : 
                             result.efficiency === 'Average' ? '#1e40af' : '#991b1b'
                    }}>
                      {result.efficiency}
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 14 }}>
                  <div>Weight Gain: <strong>{result.weightGain.toFixed(1)} kg</strong></div>
                  <div>Feed Consumed: <strong>{result.feedConsumed.toFixed(1)} kg</strong></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ROI Analysis */}
      {activeTab === 'roi' && roiData && (
        <div>
          <div className="card" style={{ marginBottom: 20, padding: 20, background: 'linear-gradient(135deg, #059669, #10b981)', color: '#fff' }}>
            <h3 style={{ color: '#fff', margin: '0 0 16px 0' }}>Return on Investment (ROI) Summary</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 }}>
              <div>
                <div style={{ fontSize: 28, fontWeight: 'bold' }}>{formatCurrency(roiData.summary.totalRevenue)}</div>
                <div style={{ opacity: 0.9 }}>Total Revenue</div>
              </div>
              <div>
                <div style={{ fontSize: 28, fontWeight: 'bold' }}>{formatCurrency(roiData.summary.totalCosts)}</div>
                <div style={{ opacity: 0.9 }}>Total Costs</div>
              </div>
              <div>
                <div style={{ fontSize: 28, fontWeight: 'bold' }}>{formatCurrency(roiData.summary.totalProfit)}</div>
                <div style={{ opacity: 0.9 }}>Net Profit</div>
              </div>
              <div>
                <div style={{ fontSize: 28, fontWeight: 'bold' }}>{roiData.summary.averageROI.toFixed(1)}%</div>
                <div style={{ opacity: 0.9 }}>Average ROI</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gap: 12 }}>
            {roiData.results.map(result => (
              <div key={result.animalId} className="card" style={{ padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 16 }}>{result.animalName}</div>
                    <div className="muted">{result.animalType} - {result.status}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 24, fontWeight: 'bold', color: result.roi > 0 ? 'var(--green)' : '#ef4444' }}>
                      {result.roi.toFixed(1)}%
                    </div>
                    <div style={{ 
                      display: 'inline-block',
                      padding: '4px 12px',
                      borderRadius: 12,
                      fontSize: 12,
                      fontWeight: 600,
                      background: result.roi > 50 ? '#d1fae5' : result.roi > 20 ? '#fef3c7' : result.roi > 0 ? '#dbeafe' : '#fecaca',
                      color: result.roi > 50 ? '#065f46' : result.roi > 20 ? '#92400e' : result.roi > 0 ? '#1e40af' : '#991b1b'
                    }}>
                      {result.profitability}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, fontSize: 14 }}>
                  <div>
                    <div className="muted">Costs</div>
                    <div>Purchase: {formatCurrency(result.costs.purchase)}</div>
                    <div>Feed: {formatCurrency(result.costs.feed)}</div>
                    <div>Treatment: {formatCurrency(result.costs.treatment)}</div>
                    <div style={{ fontWeight: 600, marginTop: 4 }}>Total: {formatCurrency(result.costs.total)}</div>
                  </div>
                  <div>
                    <div className="muted">Revenue</div>
                    <div>Milk: {formatCurrency(result.revenue.milk)}</div>
                    <div>Sale: {formatCurrency(result.revenue.sale)}</div>
                    <div style={{ fontWeight: 600, marginTop: 4 }}>Total: {formatCurrency(result.revenue.total)}</div>
                    <div style={{ fontWeight: 700, fontSize: 16, color: result.profit > 0 ? 'var(--green)' : '#ef4444', marginTop: 4 }}>
                      Profit: {formatCurrency(result.profit)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comparative Analysis */}
      {activeTab === 'comparison' && comparisonData && (
        <div>
          <div style={{ marginBottom: 20, display: 'flex', gap: 10, alignItems: 'center' }}>
            <label>Period Type:</label>
            <select value={periodType} onChange={e => setPeriodType(e.target.value)} style={{ padding: '6px 12px', borderRadius: 6 }}>
              <option value="month">Monthly</option>
              <option value="quarter">Quarterly</option>
            </select>
          </div>

          <div className="card" style={{ marginBottom: 20, padding: 20 }}>
            <h3>Performance Trends</h3>
            {comparisonData.trends && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16, marginTop: 16 }}>
                <div>
                  <div className="muted">Income Change</div>
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: comparisonData.trends.incomeChange > 0 ? 'var(--green)' : '#ef4444' }}>
                    {comparisonData.trends.incomeChange > 0 ? '↑' : '↓'} {Math.abs(comparisonData.trends.incomeChange).toFixed(1)}%
                  </div>
                </div>
                <div>
                  <div className="muted">Expense Change</div>
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: comparisonData.trends.expensesChange > 0 ? '#ef4444' : 'var(--green)' }}>
                    {comparisonData.trends.expensesChange > 0 ? '↑' : '↓'} {Math.abs(comparisonData.trends.expensesChange).toFixed(1)}%
                  </div>
                </div>
                <div>
                  <div className="muted">Profit Change</div>
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: comparisonData.trends.profitChange > 0 ? 'var(--green)' : '#ef4444' }}>
                    {comparisonData.trends.profitChange > 0 ? '↑' : '↓'} {Math.abs(comparisonData.trends.profitChange).toFixed(1)}%
                  </div>
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gap: 12 }}>
            {comparisonData.periods.map((period, idx) => (
              <div key={idx} className="card" style={{ padding: 16 }}>
                <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 12 }}>{period.period}</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12, fontSize: 14 }}>
                  <div>
                    <div className="muted">Income</div>
                    <div style={{ fontWeight: 600, color: 'var(--green)' }}>{formatCurrency(period.income)}</div>
                  </div>
                  <div>
                    <div className="muted">Expenses</div>
                    <div style={{ fontWeight: 600, color: '#ef4444' }}>{formatCurrency(period.expenses)}</div>
                  </div>
                  <div>
                    <div className="muted">Profit</div>
                    <div style={{ fontWeight: 600, color: period.profit > 0 ? 'var(--green)' : '#ef4444' }}>
                      {formatCurrency(period.profit)}
                    </div>
                  </div>
                  <div>
                    <div className="muted">Milk Production</div>
                    <div style={{ fontWeight: 600 }}>{period.milkProduction.toFixed(1)} L</div>
                  </div>
                  <div>
                    <div className="muted">Feed Costs</div>
                    <div style={{ fontWeight: 600 }}>{formatCurrency(period.feedCosts)}</div>
                  </div>
                  <div>
                    <div className="muted">Profit Margin</div>
                    <div style={{ fontWeight: 600 }}>{period.profitMargin.toFixed(1)}%</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Performers */}
      {activeTab === 'top' && topPerformers && (
        <div>
          <div className="card" style={{ padding: 20, marginBottom: 20, background: 'linear-gradient(135deg, #f59e0b, #eab308)', color: '#fff' }}>
            <h3 style={{ margin: 0, color: '#fff' }}>🏆 Top 10 Performers by ROI</h3>
          </div>
          <div style={{ display: 'grid', gap: 12 }}>
            {topPerformers.map((performer, idx) => (
              <div key={performer.animalId} className="card" style={{ padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ fontSize: 28, fontWeight: 'bold', color: idx < 3 ? '#f59e0b' : 'var(--muted)' }}>
                    #{idx + 1}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 16 }}>{performer.animalName}</div>
                    <div className="muted">{performer.profitability}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: 'var(--green)' }}>
                    {performer.roi.toFixed(1)}%
                  </div>
                  <div className="muted">ROI</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

