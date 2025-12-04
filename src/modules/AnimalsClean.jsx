import React, { useEffect, useState } from 'react'

export default function Animals(){
  const KEY = 'cattalytics:animals'
  const [animals, setAnimals] = useState([])
  const [name, setName] = useState('')
  
  // Inline edit state
  const [inlineEditId, setInlineEditId] = useState(null)
  const [inlineData, setInlineData] = useState({})
  const [toast, setToast] = useState(null)
  const [lastChange, setLastChange] = useState(null)

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

  // Inline edit functions
  function startInlineEdit(item) {
    setInlineEditId(item.id)
    setInlineData({ ...item })
    setLastChange({ item })
  }

  function saveInlineEdit() {
    if (!inlineData.name || !inlineData.name.trim()) {
      setToast({ type: 'error', message: 'Name is required' })
      return
    }
    
    setAnimals(animals.map(a => a.id === inlineEditId ? inlineData : a))
    setToast({ type: 'success', message: '✓ Updated', showUndo: true })
    setInlineEditId(null)
    setTimeout(() => setToast(null), 3000)
  }

  function cancelInlineEdit() {
    setInlineEditId(null)
    setInlineData({})
    setToast(null)
  }

  function undoLastChange() {
    if (!lastChange) return
    setAnimals(animals.map(a => a.id === inlineEditId ? lastChange.item : a))
    setToast(null)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault()
      saveInlineEdit()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      cancelInlineEdit()
    }
  }

  return (
    <section>
      <h2>Livestock</h2>
      <div style={{display:'flex',gap:8,alignItems:'center'}}>
        <input id="animal-name" name="animal-name" placeholder="Animal name" value={name} onChange={e=>setName(e.target.value)} />
        <button onClick={add}>Add Animal</button>
      </div>

      <ul style={{marginTop:12}}>
        {animals.map(a=> (
          <li key={a.id} style={{marginBottom:6}}>
            {inlineEditId === a.id ? (
              <div onKeyDown={handleKeyDown} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input type="text" value={inlineData.name || ''} onChange={e => setInlineData({ ...inlineData, name: e.target.value })} style={{ flex: 1, padding: '4px 8px', border: '1px solid #ddd', borderRadius: 4 }} />
                <button onClick={saveInlineEdit} style={{ padding: '4px 12px', background: '#059669', color: '#fff', borderRadius: 4, cursor: 'pointer' }}>Save</button>
                <button onClick={cancelInlineEdit} style={{ padding: '4px 12px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: 4, cursor: 'pointer' }}>Cancel</button>
              </div>
            ) : (
              <>
                <strong>{a.name}</strong> <em>({a.id})</em>
                <button style={{marginLeft:8, background: '#ffffcc', border: '1px solid #ffdd00', borderRadius: 4, cursor: 'pointer'}} onClick={()=>startInlineEdit(a)}>⚡ Quick</button>
                <button style={{marginLeft:4}} onClick={()=>remove(a.id)}>Delete</button>
              </>
            )}
          </li>
        ))}
      </ul>

      {toast && (
        <div style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          padding: '12px 20px',
          borderRadius: 8,
          background: toast.type === 'error' ? '#fee2e2' : '#d1fae5',
          color: toast.type === 'error' ? '#991b1b' : '#065f46',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 10000,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12
        }}>
          <div>{toast.message}</div>
          {toast.showUndo && <button onClick={undoLastChange} style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', fontWeight: 600 }}>↶ Undo</button>}
        </div>
      )}
    </section>
  )
}
