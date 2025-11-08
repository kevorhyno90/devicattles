import React, { useEffect, useState } from 'react'

const SAMPLE = [
  { id: 'P-001', name: 'North Pasture', acreage: 12.5, notes: '' },
  { id: 'P-002', name: 'River Field', acreage: 7.3, notes: '' }
]

export default function Pastures(){
  const KEY = 'cattalytics:pastures'
  const [items, setItems] = useState([])
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editValues, setEditValues] = useState({})
  const [modalOpenId, setModalOpenId] = useState(null)

  // Each pasture can have usage logs saved alongside it
  function recordUsage(item){
    const note = window.prompt('Add usage note for ' + item.id, '')
    if(note === null) return
    const ts = new Date().toISOString()
    setItems(items.map(i => i.id === item.id ? { ...i, usageLogs: [...(i.usageLogs||[]), { date: ts, note }] } : i ))
  }

  useEffect(()=>{
    const raw = localStorage.getItem(KEY)
    if(raw) setItems(JSON.parse(raw))
    else setItems(SAMPLE)
  }, [])

  useEffect(()=>{
    localStorage.setItem(KEY, JSON.stringify(items))
  }, [items])

  function add(){
    if(!newName.trim()) return
    const id = 'P-' + Math.floor(1000 + Math.random()*9000)
    setItems([...items, { id, name: newName.trim(), acreage: 0, notes: '' }])
    setNewName('')
  }

  function remove(id){
    if(!confirm('Delete pasture '+id+'?')) return
    setItems(items.filter(i=>i.id!==id))
  }

  function startEdit(item){
    setEditingId(item.id)
    setEditValues({...item})
  }

  function saveEdit(){
    setItems(items.map(i=> i.id===editingId ? {...i, ...editValues} : i))
    setEditingId(null)
  }

  return (
    <section>
      <h2>Pastures</h2>
      <div className="add-row">
        <input placeholder="New pasture name" value={newName} onChange={e=>setNewName(e.target.value)} />
        <button onClick={add}>Add</button>
      </div>

      <table>
        <thead><tr><th>ID</th><th>Name</th><th>Acreage</th><th>Notes</th><th/></tr></thead>
        <tbody>
          {items.map(a=> (
            <tr key={a.id}>
              <td>{a.id}</td>
              <td>{editingId===a.id ? <input value={editValues.name||''} onChange={e=>setEditValues({...editValues, name: e.target.value})} /> : a.name}</td>
              <td>{editingId===a.id ? <input type="number" step="0.1" value={editValues.acreage||0} onChange={e=>setEditValues({...editValues, acreage: parseFloat(e.target.value||0)})} /> : a.acreage}</td>
              <td>{editingId===a.id ? <input value={editValues.notes||''} onChange={e=>setEditValues({...editValues, notes: e.target.value})} /> : a.notes}</td>
              <td style={{width:160}}>
                {editingId===a.id ? (
                  <>
                    <button onClick={saveEdit}>Save</button>
                    <button onClick={()=>setEditingId(null)}>Cancel</button>
                  </>
                ) : (
                  <>
                    <button onClick={()=>{ setModalOpenId(a.id); }}>{'Expand'}</button>
                    <button onClick={()=>startEdit(a)}>Edit</button>
                    <button onClick={()=>remove(a.id)}>Delete</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Drawer for expansive pasture view */}
      {modalOpenId && (() => {
        const p = items.find(x => x.id === modalOpenId)
        if(!p) return null
        return (
          <div className="drawer-overlay" onClick={() => setModalOpenId(null)}>
            <div className="drawer" onClick={e => e.stopPropagation()}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <h3 style={{margin:0}}>{p.name} — {p.id}</h3>
                <div>
                  <button onClick={() => { setModalOpenId(null); startEdit(p); }}>Edit full</button>
                  <button onClick={() => setModalOpenId(null)} style={{marginLeft:8}}>Close</button>
                </div>
              </div>
              <div style={{marginTop:12, display:'flex', gap:16}}>
                <div style={{width:280, border:'1px solid #eee', padding:12, borderRadius:8}}>
                  <div style={{fontSize:14}}>
                    <div><strong>Area</strong> {p.acreage} acres</div>
                    <div style={{marginTop:6}}><strong>Notes</strong><div style={{marginTop:6}}>{p.notes || '—'}</div></div>
                  </div>
                  <div style={{marginTop:10, display:'flex', gap:8}}>
                    <button onClick={() => recordUsage(p)}>Record usage</button>
                  </div>
                </div>
                <div style={{flex:1}}>
                  <div><strong>Recent usage</strong></div>
                  <div style={{marginTop:8}}>
                    {(!p.usageLogs || !p.usageLogs.length) ? <div style={{color:'#666'}}>No usage records</div> : (
                      <ul>
                        {(p.usageLogs||[]).slice().reverse().map((u, idx) => (
                          <li key={idx}>{new Date(u.date).toLocaleString()} — {u.note}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      })()}
    </section>
  )
}
