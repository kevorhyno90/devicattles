import React, { useEffect, useState } from 'react'

const SAMPLE = [
  { id: 'FEED-001', animalId: 'A-001', date: '2025-06-02', feed: 'Hay 5kg' }
]

export default function AnimalFeeding({ animals }){
  const KEY = 'cattalytics:animal:feeding'
  const [items, setItems] = useState([])
  const [animalId, setAnimalId] = useState(animals && animals[0] ? animals[0].id : '')
  const [feed, setFeed] = useState('')

  useEffect(()=>{
    const raw = localStorage.getItem(KEY)
    if(raw) setItems(JSON.parse(raw))
    else setItems(SAMPLE)
  }, [])

  useEffect(()=> localStorage.setItem(KEY, JSON.stringify(items)), [items])

  function add(){
    if(!animalId || !feed.trim()) return
    const id = 'FEED-' + Math.floor(1000 + Math.random()*9000)
    setItems([...items, { id, animalId, date: new Date().toISOString().slice(0,10), feed: feed.trim() }])
    setFeed('')
  }

  function remove(id){ if(!confirm('Delete record '+id+'?')) return; setItems(items.filter(i=>i.id!==id)) }

  return (
    <section>
      <h3>Feedings</h3>
      <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:12}}>
        <select value={animalId} onChange={e=>setAnimalId(e.target.value)}>
          <option value="">-- select animal --</option>
          {(animals||[]).map(a=> <option key={a.id} value={a.id}>{a.name} ({a.id})</option>)}
        </select>
        <input placeholder="Feed / amount" value={feed} onChange={e=>setFeed(e.target.value)} />
        <button onClick={add}>Add</button>
      </div>
      <ul style={{listStyle:'none',padding:0}}>
        {items.map(it => (
          <li key={it.id} style={{padding:8,borderBottom:'1px solid #eee',display:'flex',justifyContent:'space-between'}}>
            <div>
              <div style={{fontWeight:600}}>{it.feed} <small style={{color:'#666'}}>({it.id})</small></div>
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
