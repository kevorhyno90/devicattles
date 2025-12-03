import React, { useEffect, useState } from 'react'

const SAMPLE = [
  { id: 'R-001', name: 'Tractor', qty: 1, condition: 'Good' },
  { id: 'R-002', name: 'ATV', qty: 2, condition: 'Fair' }
]

export default function Resources(){
  const KEY = 'devinsfarm:resources'
  const [items, setItems] = useState([])
  const [name, setName] = useState('')
  const [qty, setQty] = useState(1)
  const [condition, setCondition] = useState('Good')
  const [editingId, setEditingId] = useState(null)
  
  // Inline edit state
  const [inlineEditId, setInlineEditId] = useState(null)
  const [inlineData, setInlineData] = useState({ name: '', qty: 1, condition: 'Good' })
  const [toast, setToast] = useState(null)
  const [lastChange, setLastChange] = useState(null)

  useEffect(()=>{
    const raw = localStorage.getItem(KEY)
    if(raw) setItems(JSON.parse(raw))
    else setItems(SAMPLE)
  }, [])

  useEffect(()=> localStorage.setItem(KEY, JSON.stringify(items)), [items])

  function add(){
    if(!name.trim()) return
    const id = 'R-' + Math.floor(1000 + Math.random()*9000)
    setItems([...items, { id, name: name.trim(), qty: Number(qty)||0, condition }])
    setName(''); setQty(1); setCondition('Good')
  }

  function remove(id){ if(!confirm('Delete resource '+id+'?')) return; setItems(items.filter(i=>i.id!==id)) }

  function startEdit(resource){
    setName(resource.name)
    setQty(resource.qty)
    setCondition(resource.condition)
    setEditingId(resource.id)
  }

  function saveEdit(){
    if(!name.trim()) return
    setItems(items.map(i => i.id === editingId ? { ...i, name: name.trim(), qty: Number(qty)||0, condition } : i))
    setName(''); setQty(1); setCondition('Good'); setEditingId(null)
  }

  function cancelEdit(){
    setName(''); setQty(1); setCondition('Good'); setEditingId(null)
  }

  // Inline Quick Edit Functions
  function startInlineEdit(resource) {
    setInlineEditId(resource.id)
    setInlineData({ name: resource.name, qty: resource.qty, condition: resource.condition })
  }

  function saveInlineEdit() {
    if (!inlineData.name.trim()) {
      setToast({ type: 'error', message: 'Resource name is required' })
      setTimeout(() => setToast(null), 3000)
      return
    }
    const updated = items.map(i => {
      if (i.id === inlineEditId) {
        setLastChange({ type: 'edit', item: { ...i } })
        return { ...i, ...inlineData, qty: Number(inlineData.qty) || 0 }
      }
      return i
    })
    setItems(updated)
    setToast({ type: 'success', message: 'Resource updated', showUndo: true })
    setTimeout(() => setToast(null), 5000)
    setInlineEditId(null)
  }

  function cancelInlineEdit() {
    setInlineEditId(null)
    setInlineData({ name: '', qty: 1, condition: 'Good' })
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

  return (
    <section>
      <h2>Resources</h2>
      <div className="add-row" style={{marginBottom:12}}>
        <input placeholder="Resource name" value={name} onChange={e=>setName(e.target.value)} />
        <input type="number" value={qty} onChange={e=>setQty(e.target.value)} style={{width:80}} />
        <select value={condition} onChange={e=>setCondition(e.target.value)} style={{width:100}}>
          <option value="Excellent">Excellent</option>
          <option value="Good">Good</option>
          <option value="Fair">Fair</option>
          <option value="Poor">Poor</option>
          <option value="Broken">Broken</option>
        </select>
        {editingId ? (
          <>
            <button onClick={saveEdit}>Save</button>
            <button onClick={cancelEdit}>Cancel</button>
          </>
        ) : (
          <button onClick={add}>Add</button>
        )}
      </div>
      <ul style={{listStyle:'none',padding:0}}>
        {items.map(r => (
          <li key={r.id} style={{padding:10, borderBottom:'1px solid #eee'}}>
            {inlineEditId === r.id ? (
              <div onKeyDown={handleKeyDown} style={{display:'flex',flexDirection:'column',gap:8}}>
                <div style={{display:'flex',gap:8,alignItems:'center'}}>
                  <input value={inlineData.name} onChange={e=>setInlineData({...inlineData,name:e.target.value})} style={{flex:1}} autoFocus />
                  <input type="number" value={inlineData.qty} onChange={e=>setInlineData({...inlineData,qty:e.target.value})} style={{width:80}} />
                  <select value={inlineData.condition} onChange={e=>setInlineData({...inlineData,condition:e.target.value})} style={{width:100}}>
                    <option>Excellent</option><option>Good</option><option>Fair</option><option>Poor</option><option>Broken</option>
                  </select>
                  <button onClick={saveInlineEdit} style={{background:'#10b981',color:'#fff'}}>✓</button>
                  <button onClick={cancelInlineEdit} style={{background:'#ef4444',color:'#fff'}}>✕</button>
                </div>
              </div>
            ) : (
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <div style={{flex:1}}>
                  <div style={{fontWeight:600}}>{r.name} <small style={{color:'#666'}}>({r.id})</small></div>
                  <div style={{fontSize:13,color:'#666'}}>{r.qty} units • {r.condition}</div>
                </div>
                <div style={{display:'flex',gap:8}}>
                  <button onClick={()=>startInlineEdit(r)}>⚡ Quick</button>
                  <button onClick={()=>startEdit(r)}>✏️ Full</button>
                  <button onClick={()=>remove(r.id)}>🗑️</button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
      {toast && (
        <div style={{position:'fixed',bottom:20,right:20,padding:'12px 20px',background:toast.type==='error'?'#ef4444':'#10b981',color:'#fff',borderRadius:8,boxShadow:'0 4px 12px rgba(0,0,0,0.15)',zIndex:10000,display:'flex',gap:12}}>
          <span>{toast.message}</span>
          {toast.showUndo && <button onClick={undoLastChange} style={{background:'rgba(255,255,255,0.2)',border:'1px solid rgba(255,255,255,0.3)',color:'#fff',padding:'4px 12px',borderRadius:4,cursor:'pointer'}}>↶ Undo</button>}
        </div>
      )}
    </section>
  )
}
