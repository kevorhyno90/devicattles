import React, { useEffect, useState } from 'react'
import CropAdd from './CropAdd'
import CropTreatment from './CropTreatment'
import CropYield from './CropYield'

const SAMPLE = [
  { id: 'C-001', name: 'Alfalfa', planted: '2025-03-15', area: 5 },
  { id: 'C-002', name: 'Corn', planted: '2025-04-20', area: 2 }
]

export default function Crops(){
  const KEY = 'cattalytics:crops'
  const [items, setItems] = useState([])
  const [name, setName] = useState('')
  const [planted, setPlanted] = useState('')
  const [area, setArea] = useState('')
  const [tab, setTab] = useState('list')
  const [detailCrop, setDetailCrop] = useState(null)

  useEffect(()=>{
    const raw = localStorage.getItem(KEY)
    if(raw) setItems(JSON.parse(raw))
    else setItems(SAMPLE)
  }, [])

  useEffect(()=> localStorage.setItem(KEY, JSON.stringify(items)), [items])

  function add(){
    if(!name.trim()) return
    const id = 'C-' + Math.floor(1000 + Math.random()*9000)
    setItems([...items, { id, name: name.trim(), planted: planted||'', area: Number(area)||0 }])
    setName(''); setPlanted(''); setArea('')
  }

  function remove(id){ if(!confirm('Delete crop '+id+'?')) return; setItems(items.filter(i=>i.id!==id)) }
  return (
    <section>
      <h2>Crops</h2>

      <div style={{display:'flex',gap:8,marginBottom:12}}>
        <button onClick={()=>setTab('addCrop')} disabled={tab==='addCrop'}>Add Crop</button>
        <button onClick={()=>setTab('treatment')} disabled={tab==='treatment'}>Treatment</button>
        <button onClick={()=>setTab('yield')} disabled={tab==='yield'}>Yield</button>
        <button onClick={()=>setTab('list')} disabled={tab==='list'}>List</button>
      </div>

      {tab === 'addCrop' && (
        <CropAdd onAdd={(c) => setItems(prev => [...prev, c])} />
      )}

      {tab === 'treatment' && (
        <CropTreatment crops={items} />
      )}

      {tab === 'yield' && (
        <CropYield crops={items} />
      )}

      {tab === 'list' && (
        <>
          {items.length === 0 ? (
            <div style={{padding:12,border:'1px dashed #ccc',borderRadius:6,marginBottom:12}}>
              <div style={{marginBottom:8}}>No crops found. You can add a crop or restore demo data.</div>
              <div style={{display:'flex',gap:8}}>
                <button onClick={()=>setTab('addCrop')}>Add crop</button>
                <button onClick={()=>{ setItems(SAMPLE); localStorage.setItem(KEY, JSON.stringify(SAMPLE)) }}>Restore demo crops</button>
              </div>
            </div>
          ) : (
            <ul style={{listStyle:'none',padding:0}}>
              {items.map(c => (
                <li key={c.id} style={{padding:10, borderBottom:'1px solid #eee', display:'flex', alignItems:'center', gap:8}}>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:600}}>{c.name} <small style={{color:'#666'}}>({c.id})</small></div>
                    <div style={{fontSize:13,color:'#666'}}>{c.planted || '-'} - {c.area} ha</div>
                  </div>

                  <div style={{display:'flex',gap:8}}>
                    <button onClick={()=>{ setDetailCrop(c); setTab('details') }}>Details</button>
                    <button onClick={()=>{ const n = prompt('Edit name', c.name); if(n!==null) setItems(items.map(i=> i.id===c.id?{...i, name:n}:i)) }}>Edit</button>
                    <button onClick={()=>remove(c.id)}>Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {tab === 'details' && detailCrop && (
        <div className="drawer-overlay" onClick={()=>{ setDetailCrop(null); setTab('list') }}>
          <div className="drawer" onClick={e=>e.stopPropagation()}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <h3 style={{margin:0}}>{detailCrop.name} - {detailCrop.id}</h3>
              <div>
                <button onClick={()=>{ setDetailCrop(null); setTab('list') }}>Close</button>
              </div>
            </div>
            <div style={{marginTop:12}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
                <div>
                  <CropTreatment crops={items} cropId={detailCrop.id} />
                </div>
                <div>
                  <CropYield crops={items} cropId={detailCrop.id} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
