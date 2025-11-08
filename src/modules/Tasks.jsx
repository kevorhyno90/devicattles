import React, { useEffect, useState } from 'react'

const SAMPLE = [
  { id: 'T-001', title: 'Check water troughs', assignedTo: '', due: '', done: false },
  { id: 'T-002', title: 'Move herd to pasture B', assignedTo: '', due: '', done: false }
]

export default function Tasks(){
  const KEY = 'cattalytics:tasks'
  const [items, setItems] = useState([])
  const [title, setTitle] = useState('')
  const [due, setDue] = useState('')

  useEffect(()=>{
    const raw = localStorage.getItem(KEY)
    if(raw) setItems(JSON.parse(raw))
    else setItems(SAMPLE)
  }, [])

  useEffect(()=> localStorage.setItem(KEY, JSON.stringify(items)), [items])

  function add(){
    if(!title.trim()) return
    const id = 'T-' + Math.floor(1000 + Math.random()*9000)
    setItems([...items, { id, title: title.trim(), assignedTo: '', due: due || '', done: false }])
    setTitle('')
    setDue('')
  }

  function remove(id){ if(!confirm('Delete task '+id+'?')) return; setItems(items.filter(i=>i.id!==id)) }

  function toggleDone(id){ setItems(items.map(i=> i.id===id ? {...i, done: !i.done} : i)) }

  function editField(id, field, value){ setItems(items.map(i=> i.id===id ? {...i, [field]: value } : i)) }

  return (
    <section>
      <h2>Tasks</h2>
      <div className="add-row" style={{marginBottom:12}}>
        <input placeholder="Task title" value={title} onChange={e=>setTitle(e.target.value)} />
        <input type="date" value={due} onChange={e=>setDue(e.target.value)} />
        <button onClick={add}>Add</button>
      </div>

      <ul style={{listStyle:'none',padding:0}}>
        {items.map(t => (
          <li key={t.id} style={{padding:10, borderBottom:'1px solid #eee', display:'flex', alignItems:'center', gap:8}}>
            <input type="checkbox" checked={t.done} onChange={()=>toggleDone(t.id)} />
            <div style={{flex:1}}>
              <div style={{fontWeight:600}}>{t.title} <small style={{color:'#666'}}>({t.id})</small></div>
              <div style={{fontSize:13,color:'#666'}}>{t.due ? `Due ${t.due}` : 'No due date'}</div>
            </div>
            <div style={{display:'flex',gap:8}}>
              <button onClick={()=>{ const n = prompt('Edit title', t.title); if(n!==null) editField(t.id,'title',n) }}>Edit</button>
              <button onClick={()=>{ const d = prompt('Set due date (YYYY-MM-DD)', t.due||''); if(d!==null) editField(t.id,'due',d) }}>Due</button>
              <button onClick={()=>remove(t.id)}>Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
