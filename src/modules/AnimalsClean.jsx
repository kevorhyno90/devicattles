import React, { useEffect, useState } from 'react'

export default function Animals(){
  const KEY = 'cattalytics:animals'
  const [animals, setAnimals] = useState([])
  const [name, setName] = useState('')

  useEffect(()=>{
    const raw = localStorage.getItem(KEY)
    if(raw) setAnimals(JSON.parse(raw))
    else setAnimals([])
  }, [])

  useEffect(()=> localStorage.setItem(KEY, JSON.stringify(animals)), [animals])

  function add(){
    if(!name.trim()) return
    const id = 'A-' + Math.floor(1000 + Math.random()*9000)
    setAnimals([...animals, { id, name: name.trim(), breed: '', dob: '', status: 'Active' }])
    setName('')
  }

  function remove(id){ if(!confirm('Delete '+id+'?')) return; setAnimals(animals.filter(a=>a.id!==id)) }

  return (
    <section>
      <h2>Livestock</h2>
      <div style={{display:'flex',gap:8,alignItems:'center'}}>
        <input placeholder="Animal name" value={name} onChange={e=>setName(e.target.value)} />
        <button onClick={add}>Add Animal</button>
      </div>

      <ul style={{marginTop:12}}>
        {animals.map(a=> (
          <li key={a.id} style={{marginBottom:6}}>
            <strong>{a.name}</strong> <em>({a.id})</em>
            <button style={{marginLeft:8}} onClick={()=>remove(a.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </section>
  )
}
