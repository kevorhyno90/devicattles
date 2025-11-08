import React, { useEffect, useState } from 'react'

const SAMPLE = [ { id: 'CY-001', cropId: 'C-001', date: '2025-09-01', quantity: 120 } ]

export default function CropYield({ crops, cropId: propCropId }){
  const KEY = 'cattalytics:crop:yield'
  const [items, setItems] = useState([])
  const [cropId, setCropId] = useState(propCropId || (crops && crops[0] ? crops[0].id : ''))
  const [quantity, setQuantity] = useState('')

  useEffect(()=>{
    const raw = localStorage.getItem(KEY)
    if(raw) setItems(JSON.parse(raw))
    else setItems(SAMPLE)
  }, [])

  useEffect(()=> localStorage.setItem(KEY, JSON.stringify(items)), [items])

  function add(){
    if(!cropId || !quantity) return
    const id = 'CY-' + Math.floor(1000 + Math.random()*9000)
    setItems([...items, { id, cropId, date: new Date().toISOString().slice(0,10), quantity: Number(quantity) }])
    setQuantity('')
  }

  function remove(id){ if(!confirm('Delete record '+id+'?')) return; setItems(items.filter(i=>i.id!==id)) }

  const visible = propCropId ? items.filter(i => i.cropId === propCropId) : items

  return (
    <section>
      <h3>Crop yield</h3>
      <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:12}}>
        {!propCropId && (
          <select value={cropId} onChange={e=>setCropId(e.target.value)}>
            <option value="">-- select crop --</option>
            {(crops||[]).map(c=> <option key={c.id} value={c.id}>{c.name} ({c.id})</option>)}
          </select>
        )}
        <input placeholder="Quantity" value={quantity} onChange={e=>setQuantity(e.target.value)} style={{width:120}} />
        <button onClick={add}>Add</button>
      </div>

      <ul style={{listStyle:'none',padding:0}}>
        {visible.map(it => (
          <li key={it.id} style={{padding:8,borderBottom:'1px solid #eee',display:'flex',justifyContent:'space-between'}}>
            <div>
              <div style={{fontWeight:600}}>{it.quantity} <small style={{color:'#666'}}>({it.id})</small></div>
              <div style={{fontSize:13,color:'#666'}}>{it.date} {propCropId ? '' : `• ${it.cropId}`}</div>
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
