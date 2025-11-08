import React, { useEffect, useState } from 'react'

const SAMPLE = [
  { id: 'A-001', name: 'Bessie', breed: 'Holstein', dob: '2019-05-10', status: 'Active' },
  { id: 'A-002', name: 'Molly', breed: 'Jersey', dob: '2020-03-22', status: 'Active' }
]

export default function Animals(){
  const KEY = 'cattalytics:animals'
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
    const id = 'A-' + Math.floor(1000 + Math.random()*9000)
    setItems([...items, { id, name: newName.trim(), breed: 'Unknown', dob: new Date().toISOString().slice(0,10), status: 'Active' }])
    setNewName('')
  }

  function remove(id){
    if(!confirm('Delete animal '+id+'?')) return
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
      <h2>Animals</h2>
      <div className="add-row">
        <input placeholder="New animal name" value={newName} onChange={e=>setNewName(e.target.value)} />
        <button onClick={add}>Add</button>
      </div>

      <table>
        <thead><tr><th>ID</th><th>Name</th><th>Breed</th><th>DOB</th><th>Status</th><th/></tr></thead>
        <tbody>
          {items.map(a=> (
            <tr key={a.id}>
              <td>{a.id}</td>
              <td>{editingId===a.id ? <input value={editValues.name||''} onChange={e=>setEditValues({...editValues, name: e.target.value})} /> : a.name}</td>
              <td>{editingId===a.id ? <input value={editValues.breed||''} onChange={e=>setEditValues({...editValues, breed: e.target.value})} /> : a.breed}</td>
              <td>{editingId===a.id ? <input type="date" value={editValues.dob||''} onChange={e=>setEditValues({...editValues, dob: e.target.value})} /> : a.dob}</td>
              <td>{editingId===a.id ? <select value={editValues.status||''} onChange={e=>setEditValues({...editValues, status: e.target.value})}><option>Active</option><option>Sold</option><option>Retired</option></select> : a.status}</td>
              <td style={{width:180}}>
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
