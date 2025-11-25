import React, { useState } from 'react'

export default function CropAdd({ onAdd }){
  const [name, setName] = useState('')
  const [planted, setPlanted] = useState('')
  const [area, setArea] = useState('')

  function save(){
    if(!name.trim()) return
    const id = 'C-' + Math.floor(1000 + Math.random()*9000)
    onAdd({ id, name: name.trim(), planted: planted||'', area: Number(area)||0 })
    setName(''); setPlanted(''); setArea('')
  }

  return (
    <div style={{marginBottom:12}}>
      <div style={{display:'flex',gap:8,alignItems:'center'}}>
        <input placeholder="Crop name" value={name} onChange={e=>setName(e.target.value)} />
        <label style={{marginRight:4}}>Planted Date:</label>
        <input type="date" value={planted} onChange={e=>setPlanted(e.target.value)} />
        <input placeholder="Area (ha)" value={area} onChange={e=>setArea(e.target.value)} style={{width:120}} />
        <button onClick={save}>Save crop</button>
      </div>
    </div>
  )
}
