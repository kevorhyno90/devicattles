import React, { useEffect, useState } from 'react'

const SAMPLE = [
  { id: 'S-001', title: 'Milking - Morning', time: '06:00', days: 'Daily' },
  { id: 'S-002', title: 'Feeding - Evening', time: '18:00', days: 'Daily' }
]

export default function Schedules(){
  const KEY = 'cattalytics:schedules'
  const [items, setItems] = useState([])
  const [title, setTitle] = useState('')
  const [time, setTime] = useState('')
  const [days, setDays] = useState('')

  useEffect(()=>{
    const raw = localStorage.getItem(KEY)
    if(raw) setItems(JSON.parse(raw))
    else setItems(SAMPLE)
  }, [])

  useEffect(()=> localStorage.setItem(KEY, JSON.stringify(items)), [items])

  function add(){
    if(!title.trim()) return
    const id = 'S-' + Math.floor(1000 + Math.random()*9000)
    setItems([...items, { id, title: title.trim(), time: time || '', days: days || '' }])
    setTitle(''); setTime(''); setDays('')
  }

  function remove(id){ if(!confirm('Delete schedule '+id+'?')) return; setItems(items.filter(i=>i.id!==id)) }

  return (
    <section>
      <h2>Schedules</h2>
      <div className="add-row" style={{marginBottom:12}}>
        <input placeholder="Title" value={title} onChange={e=>setTitle(e.target.value)} />
        <input type="time" value={time} onChange={e=>setTime(e.target.value)} />
        <input placeholder="Days" value={days} onChange={e=>setDays(e.target.value)} />
        <button onClick={add}>Add</button>
      </div>
      <ul style={{listStyle:'none',padding:0}}>
        {items.map(s => (
          <li key={s.id} style={{padding:10, borderBottom:'1px solid #eee', display:'flex', alignItems:'center', gap:8}}>
            <div style={{flex:1}}>
              <div style={{fontWeight:600}}>{s.title} <small style={{color:'#666'}}>({s.id})</small></div>
              <div style={{fontSize:13,color:'#666'}}>{s.time} • {s.days || '—'}</div>
            </div>
            <div style={{display:'flex',gap:8}}>
              <button onClick={()=>{ const n = prompt('Edit title', s.title); if(n!==null) setItems(items.map(i=> i.id===s.id?{...i, title:n}:i)) }}>Edit</button>
              <button onClick={()=>remove(s.id)}>Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
