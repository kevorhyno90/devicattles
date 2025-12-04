import React, { useEffect, useState } from 'react'
import { exportToCSV, exportToExcel, exportToJSON, exportToPDF } from '../lib/exportImport'

const SAMPLE = [ { id: 'CT-001', cropId: 'C-001', date: '2025-05-01', treatment: 'Fungicide' } ]

export default function CropTreatment({ crops, cropId: propCropId }){
  const KEY = 'cattalytics:crop:treatment'
  const [items, setItems] = useState([])
  const [cropId, setCropId] = useState(propCropId || (crops && crops[0] ? crops[0].id : ''))
  const [treatment, setTreatment] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [inlineEditId, setInlineEditId] = useState(null)
  const [inlineData, setInlineData] = useState({ treatment: '' })
  const [toast, setToast] = useState(null)
  const [lastChange, setLastChange] = useState(null)

  useEffect(()=>{
    const raw = localStorage.getItem(KEY)
    if(raw) setItems(JSON.parse(raw))
    else setItems(SAMPLE)
  }, [])

  useEffect(()=> localStorage.setItem(KEY, JSON.stringify(items)), [items])

  function add(){
    if(!cropId || !treatment.trim()) return
    
    if(editingId) {
      // Update existing record
      setItems(items.map(item => 
        item.id === editingId 
          ? { ...item, cropId, treatment: treatment.trim() }
          : item
      ))
      setEditingId(null)
      setTreatment('')
      return
    }
    
    // Create new record
    const id = 'CT-' + Math.floor(1000 + Math.random()*9000)
    setItems([...items, { id, cropId, date: new Date().toISOString().slice(0,10), treatment: treatment.trim() }])
    setTreatment('')
  }

  function remove(id){ if(!confirm('Delete record '+id+'?')) return; setItems(items.filter(i=>i.id!==id)) }

  function startEdit(item){
    setEditingId(item.id)
    setCropId(item.cropId)
    setTreatment(item.treatment)
  }

  function cancelEdit(){
    setEditingId(null)
    setTreatment('')
    if(!propCropId && crops && crops[0]) setCropId(crops[0].id)
  }

  function startInlineEdit(item) {
    setInlineEditId(item.id)
    setInlineData({ treatment: item.treatment || '' })
  }

  function saveInlineEdit() {
    if (!inlineData.treatment.trim()) {
      setToast({ type: 'error', message: 'Treatment is required' })
      setTimeout(() => setToast(null), 3000)
      return
    }
    setItems(items.map(item => {
      if (item.id === inlineEditId) {
        setLastChange({ type: 'edit', item: { ...item } })
        return { ...item, treatment: inlineData.treatment.trim() }
      }
      return item
    }))
    setToast({ type: 'success', message: 'Treatment updated', showUndo: true })
    setTimeout(() => setToast(null), 5000)
    setInlineEditId(null)
  }

  function cancelInlineEdit() {
    setInlineEditId(null)
    setInlineData({ treatment: '' })
  }

  function undoLastChange() {
    if (lastChange) {
      setItems(items.map(i => i.id === lastChange.item.id ? lastChange.item : i))
      setToast({ type: 'success', message: 'Change reverted' })
      setTimeout(() => setToast(null), 3000)
      setLastChange(null)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') { e.preventDefault(); saveInlineEdit() }
    else if (e.key === 'Escape') cancelInlineEdit()
  }

  const visible = propCropId ? items.filter(i => i.cropId === propCropId) : items

  // Export functions
  const handleExportCSV = () => {
    const data = visible.map(item => ({
      ID: item.id,
      Date: item.date,
      Crop: crops?.find(c => c.id === item.cropId)?.name || item.cropId,
      Treatment: item.treatment
    }))
    exportToCSV(data, 'crop_treatments.csv')
  }

  const handleExportPDF = () => {
    const data = visible.map(item => ({
      Date: item.date,
      Crop: crops?.find(c => c.id === item.cropId)?.name || item.cropId,
      Treatment: item.treatment
    }))
    exportToPDF(data, 'crop_treatments', 'Crop Treatment Records')
  }

  return (
    <section>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
        <h3>{editingId ? 'Edit Crop Treatment' : 'Crop treatments'}</h3>
        <div style={{display:'flex',gap:4}}>
          <button onClick={handleExportCSV} title="Export to CSV" style={{ fontSize: 11, padding: '4px 8px' }}>📊 CSV</button>
          <button onClick={() => exportToExcel(visible, 'crop_treatments.csv')} title="Export to Excel" style={{ fontSize: 11, padding: '4px 8px' }}>📈 Excel</button>
          <button onClick={handleExportPDF} title="Export to PDF" style={{ fontSize: 11, padding: '4px 8px' }}>📕 PDF</button>
          <button onClick={() => exportToJSON(visible, 'crop_treatments.json')} title="Export to JSON" style={{ fontSize: 11, padding: '4px 8px' }}>📄 JSON</button>
        </div>
      </div>
      <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:12}}>
        {!propCropId && (
          <select value={cropId} onChange={e=>setCropId(e.target.value)}>
            <option value="">-- select crop --</option>
            {(crops||[]).map(c=> <option key={c.id} value={c.id}>{c.name} ({c.id})</option>)}
          </select>
        )}
        <input placeholder="Treatment" value={treatment} onChange={e=>setTreatment(e.target.value)} />
        <button onClick={add}>{editingId ? 'Save Changes' : 'Add'}</button>
        {editingId && <button onClick={cancelEdit}>Cancel Edit</button>}
      </div>

      <ul style={{listStyle:'none',padding:0}}>
        {visible.map(it => (
          <li key={it.id} style={{padding:8,borderBottom:'1px solid #eee',display:'flex',justifyContent:'space-between'}}>
            {inlineEditId === it.id ? (
              <div onKeyDown={handleKeyDown} style={{display:'flex',gap:8,alignItems:'center',flex:1}}>
                <input
                  value={inlineData.treatment}
                  onChange={e=>setInlineData({...inlineData,treatment:e.target.value})}
                  placeholder="Treatment"
                  style={{flex:1,padding:'4px 8px'}}
                  autoFocus
                />
                <button onClick={saveInlineEdit} style={{background:'#10b981',color:'#fff',padding:'4px 12px',border:'none',borderRadius:4,cursor:'pointer'}}>✓ Save</button>
                <button onClick={cancelInlineEdit} style={{background:'#ef4444',color:'#fff',padding:'4px 12px',border:'none',borderRadius:4,cursor:'pointer'}}>✕ Cancel</button>
              </div>
            ) : (
              <>
                <div>
                  <div style={{fontWeight:600}}>{it.treatment} <small style={{color:'#666'}}>({it.id})</small></div>
                  <div style={{fontSize:13,color:'#666'}}>{it.date} {propCropId ? '' : `• ${it.cropId}`}</div>
                </div>
                <div style={{display:'flex',gap:4}}>
                  <button onClick={()=>startInlineEdit(it)} style={{background:'#3b82f6',color:'#fff',padding:'4px 8px',border:'none',borderRadius:4,cursor:'pointer'}}>⚡ Quick</button>
                  <button onClick={()=>startEdit(it)}>✏️</button>
                  <button onClick={()=>remove(it.id)}>🗑️</button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>

      {toast && (
        <div style={{position:'fixed',bottom:20,right:20,padding:'12px 20px',background:toast.type==='error'?'#ef4444':'#10b981',color:'#fff',borderRadius:8,boxShadow:'0 4px 12px rgba(0,0,0,0.15)',zIndex:10000,display:'flex',gap:12,alignItems:'center'}}>
          <span>{toast.message}</span>
          {toast.showUndo && <button onClick={undoLastChange} style={{background:'rgba(255,255,255,0.2)',border:'1px solid rgba(255,255,255,0.3)',color:'#fff',padding:'4px 12px',borderRadius:4,cursor:'pointer'}}>↶ Undo</button>}
        </div>
      )}
    </section>
  )
}
