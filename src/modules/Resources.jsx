import React, { useEffect, useState } from 'react'

const SAMPLE = [
  { id: 'R-001', name: 'Tractor', qty: 1, condition: 'Good' },
  { id: 'R-002', name: 'ATV', qty: 2, condition: 'Fair' }
]

export default function Resources(){
  const KEY = 'cattalytics:resources'
  const [items, setItems] = useState([])
  const [name, setName] = useState('')
  const [qty, setQty] = useState(1)

  useEffect(()=>{
    const raw = localStorage.getItem(KEY)
    if(raw) setItems(JSON.parse(raw))
    else setItems(SAMPLE)
  }, [])

  useEffect(()=> localStorage.setItem(KEY, JSON.stringify(items)), [items])

  function add(){
    if(!name.trim()) return
    const id = 'R-' + Math.floor(1000 + Math.random()*9000)
    setItems([...items, { id, name: name.trim(), qty: Number(qty)||0, condition: 'Good' }])
    setName(''); setQty(1)
  }

  function remove(id){ if(!confirm('Delete resource '+id+'?')) return; setItems(items.filter(i=>i.id!==id)) }

  return (
    <section>
      <h2>Resources</h2>
      <div className="add-row" style={{marginBottom:12}}>
        <input placeholder="Resource name" value={name} onChange={e=>setName(e.target.value)} />
        <input type="number" value={qty} onChange={e=>setQty(e.target.value)} style={{width:80}} />
        <button onClick={add}>Add</button>
      </div>
      <ul style={{listStyle:'none',padding:0}}>
        {items.map(r => (
          <li key={r.id} style={{padding:10, borderBottom:'1px solid #eee', display:'flex', alignItems:'center', gap:8}}>
            <div style={{flex:1}}>
              <div style={{fontWeight:600}}>{r.name} <small style={{color:'#666'}}>({r.id})</small></div>
              <div style={{fontSize:13,color:'#666'}}>{r.qty} units • {r.condition}</div>
            </div>
            <div style={{display:'flex',gap:8}}>
              <button onClick={()=>{ const n = prompt('Edit name', r.name); if(n!==null) setItems(items.map(i=> i.id===r.id?{...i, name:n}:i)) }}>Edit</button>
              <button onClick={()=>remove(r.id)}>Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
