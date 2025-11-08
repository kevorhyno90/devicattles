import React, { useEffect, useState } from 'react'

const SAMPLE = [
  { id: 'BREED-001', animalId: 'A-002', date: '2025-05-20', event: 'Inseminated', notes: 'AI - bull S-101' }
]

export default function AnimalBreeding({ animals }){
  const KEY = 'cattalytics:animal:breeding'
  const [items, setItems] = useState([])
  const [animalId, setAnimalId] = useState(animals && animals[0] ? animals[0].id : '')
  const [event, setEvent] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(()=>{
    const raw = localStorage.getItem(KEY)
    if(raw) setItems(JSON.parse(raw))
    else setItems(SAMPLE)
  }, [])

  useEffect(()=> localStorage.setItem(KEY, JSON.stringify(items)), [items])

  function add(){
    if(!animalId || !event.trim()) return
    const id = 'BREED-' + Math.floor(1000 + Math.random()*9000)
    setItems([...items, { id, animalId, date: new Date().toISOString().slice(0,10), event: event.trim(), notes: notes.trim() }])
    setEvent(''); setNotes('')
  }

  function remove(id){ if(!confirm('Delete record '+id+'?')) return; setItems(items.filter(i=>i.id!==id)) }

  return (
    <section>
      <h3>Breeding</h3>
      <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:12}}>
        <select value={animalId} onChange={e=>setAnimalId(e.target.value)}>
          <option value="">-- select animal --</option>
          {(animals||[]).map(a=> <option key={a.id} value={a.id}>{a.name} ({a.id})</option>)}
        </select>
        <input placeholder="Event (e.g., Inseminated)" value={event} onChange={e=>setEvent(e.target.value)} />
        <input placeholder="Notes" value={notes} onChange={e=>setNotes(e.target.value)} />
        <button onClick={add}>Add</button>
      </div>
      <ul style={{listStyle:'none',padding:0}}>
        {items.map(it => (
          <li key={it.id} style={{padding:8,borderBottom:'1px solid #eee',display:'flex',justifyContent:'space-between'}}>
            <div>
              <div style={{fontWeight:600}}>{it.event} <small style={{color:'#666'}}>({it.id})</small></div>
              <div style={{fontSize:13,color:'#666'}}>{it.date} • {it.animalId}</div>
              <div style={{fontSize:13,color:'#666'}}>{it.notes}</div>
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
