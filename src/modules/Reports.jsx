import React, { useState, useEffect } from 'react'

function downloadJson(obj, filename='export.json'){ try{ const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); }catch(e){ console.error(e) } }

export default function Reports(){
  const [section, setSection] = useState('animals')
  const [items, setItems] = useState([])
  const [patientFilter, setPatientFilter] = useState('')

  // load relevant data from localStorage where available
  useEffect(()=>{
    try{
      const animals = JSON.parse(localStorage.getItem('devinsfarm:animals') || localStorage.getItem('animals') || '[]')
      const tasks = JSON.parse(localStorage.getItem('devinsfarm:tasks') || localStorage.getItem('tasks') || '[]')
      const finance = JSON.parse(localStorage.getItem('devinsfarm:finance') || localStorage.getItem('finance') || '[]')
      const crops = JSON.parse(localStorage.getItem('devinsfarm:crops') || localStorage.getItem('crops') || '[]')
      const resources = JSON.parse(localStorage.getItem('devinsfarm:resources') || localStorage.getItem('resources') || '[]')
      setItems({ animals, tasks, finance, crops, resources })
    }catch(e){ setItems({ animals:[], patients:[], inventory:[], billing:[], appointments:[] }) }
  }, [])

  function getSectionItems(){
    const m = items || {}
    if(section === 'animals') return (m.animals||[]).map(a=> ({ id: a.id || a.tag || a.name, data: a, type:'animal' }))
    if(section === 'tasks') return (m.tasks||[]).map(t=> ({ id: t.id || t.title || Math.random().toString(36).slice(2,8), data: t, type:'task' }))
    if(section === 'finance') return (m.finance||[]).map(f=> ({ id: f.id || Math.random().toString(36).slice(2,8), data: f, type:'finance' }))
    if(section === 'crops') return (m.crops||[]).map(c=> ({ id: c.id || c.name || Math.random().toString(36).slice(2,8), data: c, type:'crop' }))
    if(section === 'resources') return (m.resources||[]).map(r=> ({ id: r.id || r.name || Math.random().toString(36).slice(2,8), data: r, type:'resource' }))
    return []
  }

  const list = getSectionItems()

  return (
    <div>
      <div className="health-header">
        <div>
          <h3 className="health-title">Reports</h3>
          <div className="muted">Central report hub — export and preview datasets</div>
        </div>
        <div className="health-toolbar">
          <button className={`tab-btn ${section==='animals'? 'active' : ''}`} onClick={()=>setSection('animals')}>Animals</button>
          <button className={`tab-btn ${section==='patients'? 'active' : ''}`} onClick={()=>setSection('patients')}>Patients</button>
          <button className={`tab-btn ${section==='appointments'? 'active' : ''}`} onClick={()=>setSection('appointments')}>Appointments</button>
          <button className={`tab-btn ${section==='inventory'? 'active' : ''}`} onClick={()=>setSection('inventory')}>Inventory</button>
          <button className={`tab-btn ${section==='billing'? 'active' : ''}`} onClick={()=>setSection('billing')}>Billing</button>
        </div>
      </div>

      <div className="panel">
        <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:12 }}>
          <select value={section} onChange={e=>setSection(e.target.value)}>
            <option value="animals">Animals</option>
            <option value="patients">Patients</option>
            <option value="appointments">Appointments</option>
            <option value="inventory">Inventory</option>
            <option value="billing">Billing</option>
          </select>
          <select value={patientFilter} onChange={e=>setPatientFilter(e.target.value)}>
            <option value=''>All</option>
            {(items.patients||[]).map(p=> <option key={p.id} value={p.id}>{p.name || p.tag || p.id}</option>)}
          </select>
          <button className="tab-btn" onClick={()=> downloadJson(list.map(i=> i.data), `${section}-export.json`)}>Download visible JSON ({list.length})</button>
          <button className="tab-btn" onClick={()=> alert('CSV export will be added')}>Download section CSV</button>
        </div>

        <div>
          {list.length===0 ? <div className="muted">No records for selected section.</div> : list.map(it=> (
            <div key={it.id} className="card" style={{ marginBottom:8 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <div style={{ fontWeight:600 }}>{it.type === 'patient' ? (it.data.name || '(unnamed)') : it.type === 'animal' ? (it.data.name || it.data.tag || it.id) : `${it.type}`}</div>
                  <div className="muted">{it.type} • {(items.patients||[]).find(p=>p.id===it.patientId)?.name || it.patientId || ''}</div>
                </div>
                <div>
                  <button className="tab-btn" onClick={()=> downloadJson(it.data, `${it.type}-${it.id}.json`)}>Download</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
