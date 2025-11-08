import React, { useEffect, useState } from 'react'

const SAMPLE = [
  { id: 'P-001', name: 'North Pasture', acreage: 12.5, notes: '' },
  { id: 'P-002', name: 'River Field', acreage: 7.3, notes: '' }
]

export default function Pastures(){
  const KEY = 'cattalytics:pastures'
  const [items, setItems] = useState([])
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editValues, setEditValues] = useState({})

  useEffect(()=>{
    const raw = localStorage.getItem(KEY)
    if(raw) setItems(JSON.parse(raw))
    else setItems(SAMPLE)
  }, [])

  useEffect(()=>{
    localStorage.setItem(KEY, JSON.stringify(items))
  }, [items])

  function add(){
    if(!newName.trim()) return
    const id = 'P-' + Math.floor(1000 + Math.random()*9000)
    setItems([...items, { id, name: newName.trim(), acreage: 0, notes: '' }])
    setNewName('')
  }

  function remove(id){
    if(!confirm('Delete pasture '+id+'?')) return
    setItems(items.filter(i=>i.id!==id))
  }

  function startEdit(item){
    setEditingId(item.id)
    setEditValues({...item})
  }

  function saveEdit(){
    setItems(items.map(i=> i.id===editingId ? {...i, ...editValues} : i))
    setEditingId(null)
  }

  return (
    <section>
      <h2>Pastures</h2>
      <div className="add-row">
        <input placeholder="New pasture name" value={newName} onChange={e=>setNewName(e.target.value)} />
        <button onClick={add}>Add</button>
      </div>

      <table>
        <thead><tr><th>ID</th><th>Name</th><th>Acreage</th><th>Notes</th><th/></tr></thead>
        <tbody>
          {items.map(a=> (
            <tr key={a.id}>
              <td>{a.id}</td>
              <td>{editingId===a.id ? <input value={editValues.name||''} onChange={e=>setEditValues({...editValues, name: e.target.value})} /> : a.name}</td>
              <td>{editingId===a.id ? <input type="number" step="0.1" value={editValues.acreage||0} onChange={e=>setEditValues({...editValues, acreage: parseFloat(e.target.value||0)})} /> : a.acreage}</td>
              <td>{editingId===a.id ? <input value={editValues.notes||''} onChange={e=>setEditValues({...editValues, notes: e.target.value})} /> : a.notes}</td>
              <td style={{width:160}}>
                {editingId===a.id ? (
                  <>
                    <button onClick={saveEdit}>Save</button>
                    <button onClick={()=>setEditingId(null)}>Cancel</button>
                  </>
                ) : (
                  <>
                    <button onClick={()=>startEdit(a)}>Edit</button>
                    <button onClick={()=>remove(a.id)}>Delete</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
