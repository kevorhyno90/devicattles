import React, { useEffect, useState } from 'react'

const SAMPLE = [
  { id: 'F-001', date: '2025-01-12', amount: 120.00, category: 'Vet', notes: 'Vaccines' },
  { id: 'F-002', date: '2025-02-05', amount: 45.50, category: 'Feed', notes: 'Hay' }
]

export default function Finance(){
  const KEY = 'cattalytics:finance'
  const [items, setItems] = useState([])
  const [newAmount, setNewAmount] = useState('')
  const [newCategory, setNewCategory] = useState('')
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
    const amt = parseFloat(newAmount||0)
    if(!newCategory.trim() || !amt) return
    const id = 'F-' + Math.floor(1000 + Math.random()*9000)
    setItems([...items, { id, date: new Date().toISOString().slice(0,10), amount: amt, category: newCategory.trim(), notes: '' }])
    setNewAmount('')
    setNewCategory('')
  }

  function remove(id){
    if(!confirm('Delete finance entry '+id+'?')) return
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
      <h2>Finance</h2>
      <div className="add-row">
        <input placeholder="Amount" value={newAmount} onChange={e=>setNewAmount(e.target.value)} />
        <input placeholder="Category" value={newCategory} onChange={e=>setNewCategory(e.target.value)} />
        <button onClick={add}>Add</button>
      </div>

      <table>
        <thead><tr><th>ID</th><th>Date</th><th>Amount</th><th>Category</th><th>Notes</th><th/></tr></thead>
        <tbody>
          {items.map(a=> (
            <tr key={a.id}>
              <td>{a.id}</td>
              <td>{editingId===a.id ? <input type="date" value={editValues.date||''} onChange={e=>setEditValues({...editValues, date: e.target.value})} /> : a.date}</td>
              <td>{editingId===a.id ? <input value={editValues.amount||0} onChange={e=>setEditValues({...editValues, amount: parseFloat(e.target.value||0)})} /> : a.amount}</td>
              <td>{editingId===a.id ? <input value={editValues.category||''} onChange={e=>setEditValues({...editValues, category: e.target.value})} /> : a.category}</td>
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
