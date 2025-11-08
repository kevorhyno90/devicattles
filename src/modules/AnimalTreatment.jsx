import React, { useEffect, useState } from 'react'

const SAMPLE = [
  { id: 'TREAT-001', animalId: 'A-001', date: '2025-06-01', treatment: 'Hoof trim' }
]

export default function AnimalTreatment({ animals }){
  const KEY = 'cattalytics:animal:treatment'
  const [items, setItems] = useState([])
  const [animalId, setAnimalId] = useState(animals && animals[0] ? animals[0].id : '')
  const [treatment, setTreatment] = useState('')

  useEffect(()=>{
    const raw = localStorage.getItem(KEY)
    if(raw) setItems(JSON.parse(raw))
    else setItems(SAMPLE)
  }, [])

  useEffect(()=> localStorage.setItem(KEY, JSON.stringify(items)), [items])

  function add(){
    if(!animalId || !treatment.trim()) return
    const id = 'TREAT-' + Math.floor(1000 + Math.random()*9000)
    setItems([...items, { id, animalId, date: new Date().toISOString().slice(0,10), treatment: treatment.trim() }])
    setTreatment('')
  }

  function remove(id){ if(!confirm('Delete record '+id+'?')) return; setItems(items.filter(i=>i.id!==id)) }

  return (
    <section>
      <h3>Treatments</h3>
      <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:12}}>
        <select value={animalId} onChange={e=>setAnimalId(e.target.value)}>
          <option value="">-- select animal --</option>
          {(animals||[]).map(a=> <option key={a.id} value={a.id}>{a.name} ({a.id})</option>)}
        </select>
        <input placeholder="Treatment" value={treatment} onChange={e=>setTreatment(e.target.value)} />
        <button onClick={add}>Add</button>
      </div>
      <ul style={{listStyle:'none',padding:0}}>
        {items.map(it => (
          <li key={it.id} style={{padding:8,borderBottom:'1px solid #eee',display:'flex',justifyContent:'space-between'}}>
            <div>
              <div style={{fontWeight:600}}>{it.treatment} <small style={{color:'#666'}}>({it.id})</small></div>
              <div style={{fontSize:13,color:'#666'}}>{it.date} • {it.animalId}</div>
            </div>
            <div>
              <button onClick={()=>remove(it.id)}>Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
