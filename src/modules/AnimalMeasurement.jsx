import React, { useEffect, useState } from 'react'

const SAMPLE = [
  { id: 'MEAS-001', animalId: 'A-001', date: '2025-06-02', type: 'Weight', value: 450 }
]

export default function AnimalMeasurement({ animals }){
  const KEY = 'cattalytics:animal:measurement'
  const [items, setItems] = useState([])
  const [animalId, setAnimalId] = useState(animals && animals[0] ? animals[0].id : '')
  const [type, setType] = useState('Weight')
  const [value, setValue] = useState('')

  useEffect(()=>{
    const raw = localStorage.getItem(KEY)
    if(raw) setItems(JSON.parse(raw))
    else setItems(SAMPLE)
  }, [])

  useEffect(()=> localStorage.setItem(KEY, JSON.stringify(items)), [items])

  function add(){
    if(!animalId || !value) return
    const id = 'MEAS-' + Math.floor(1000 + Math.random()*9000)
    setItems([...items, { id, animalId, date: new Date().toISOString().slice(0,10), type, value: Number(value) }])
    setValue('')
  }

  function remove(id){ if(!confirm('Delete record '+id+'?')) return; setItems(items.filter(i=>i.id!==id)) }

  return (
    <section>
      <h3>Measurements</h3>
      <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:12}}>
        <select value={animalId} onChange={e=>setAnimalId(e.target.value)}>
          <option value="">-- select animal --</option>
          {(animals||[]).map(a=> <option key={a.id} value={a.id}>{a.name} ({a.id})</option>)}
        </select>
        <select value={type} onChange={e=>setType(e.target.value)}>
          <option>Weight</option>
          <option>Height</option>
          <option>Body Condition</option>
        </select>
        <input placeholder="Value" value={value} onChange={e=>setValue(e.target.value)} style={{width:120}} />
        <button onClick={add}>Add</button>
      </div>
      <ul style={{listStyle:'none',padding:0}}>
        {items.map(it => (
          <li key={it.id} style={{padding:8,borderBottom:'1px solid #eee',display:'flex',justifyContent:'space-between'}}>
            <div>
              <div style={{fontWeight:600}}>{it.type}: {it.value} <small style={{color:'#666'}}>({it.id})</small></div>
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
