import React, { useEffect, useState } from 'react'
import { recordIncome } from '../lib/moduleIntegration'
import { exportToCSV, exportToExcel, exportToJSON, exportToPDF } from '../lib/exportImport'

const SAMPLE = [ 
  { id: 'CY-001', cropId: 'C-001', date: '2025-09-01', quantity: 120, pricePerUnit: 0, totalPrice: 0, buyer: '', sold: false } 
]

export default function CropYield({ crops, cropId: propCropId }){
  const KEY = 'cattalytics:crop:yield'
  const [items, setItems] = useState([])
  const [cropId, setCropId] = useState(propCropId || (crops && crops[0] ? crops[0].id : ''))
  const [quantity, setQuantity] = useState('')
  const [pricePerUnit, setPricePerUnit] = useState('80')
  const [buyer, setBuyer] = useState('')
  const [sold, setSold] = useState(false)
  const [editingId, setEditingId] = useState(null)

  useEffect(()=>{
    const raw = localStorage.getItem(KEY)
    if(raw) setItems(JSON.parse(raw))
    else setItems(SAMPLE)
  }, [])

  useEffect(()=> localStorage.setItem(KEY, JSON.stringify(items)), [items])

  function add(){
    if(!cropId || !quantity) return
    const qty = Number(quantity)
    const price = parseFloat(pricePerUnit) || 0
    const totalPrice = qty * price
    const cropName = crops?.find(c => c.id === cropId)?.name || cropId
    
    if(editingId) {
      // Update existing record
      setItems(items.map(item => 
        item.id === editingId 
          ? { ...item, cropId, quantity: qty, pricePerUnit: price, totalPrice, buyer: buyer.trim(), sold }
          : item
      ))
      setEditingId(null)
      setQuantity('')
      setPricePerUnit('80')
      setBuyer('')
      setSold(false)
      return
    }
    
    // Create new record
    const id = 'CY-' + Math.floor(1000 + Math.random()*9000)
    
    const newItem = {
      id,
      cropId,
      date: new Date().toISOString().slice(0,10),
      quantity: qty,
      pricePerUnit: price,
      totalPrice,
      buyer: buyer.trim(),
      sold
    }
    
    // Auto-record income if sold
    if(sold && totalPrice > 0) {
      recordIncome({
        amount: totalPrice,
        category: 'Crop Sales',
        subcategory: buyer ? 'Direct Sales' : 'Market Sales',
        description: `${cropName}: ${qty} units @ ${price}/unit`,
        vendor: buyer || 'Market Buyer',
        source: 'Crop Yield',
        linkedId: id
      })
    }
    
    setItems([...items, newItem])
    setQuantity('')
    setPricePerUnit('80')
    setBuyer('')
    setSold(false)
  }

  function remove(id){ if(!confirm('Delete record '+id+'?')) return; setItems(items.filter(i=>i.id!==id)) }

  function startEdit(item){
    setEditingId(item.id)
    setCropId(item.cropId)
    setQuantity(String(item.quantity))
    setPricePerUnit(String(item.pricePerUnit))
    setBuyer(item.buyer || '')
    setSold(item.sold || false)
  }

  function cancelEdit(){
    setEditingId(null)
    setQuantity('')
    setPricePerUnit('80')
    setBuyer('')
    setSold(false)
    if(!propCropId && crops && crops[0]) setCropId(crops[0].id)
  }

  const visible = propCropId ? items.filter(i => i.cropId === propCropId) : items
  const totalRevenue = visible.filter(i => i.sold).reduce((sum, i) => sum + (i.totalPrice || 0), 0)
  const soldQuantity = visible.filter(i => i.sold).reduce((sum, i) => sum + (i.quantity || 0), 0)
  const totalQuantity = visible.reduce((sum, i) => sum + (i.quantity || 0), 0)

  // Export functions
  const handleExportCSV = () => {
    const data = visible.map(item => ({
      ID: item.id,
      Date: item.date,
      Crop: crops?.find(c => c.id === item.cropId)?.name || item.cropId,
      Quantity: item.quantity,
      PricePerUnit: item.pricePerUnit,
      TotalPrice: item.totalPrice,
      Sold: item.sold ? 'Yes' : 'No',
      Buyer: item.buyer || 'N/A'
    }))
    exportToCSV(data, 'crop_yield.csv')
  }

  const handleExportPDF = () => {
    const data = visible.map(item => ({
      Date: item.date,
      Crop: crops?.find(c => c.id === item.cropId)?.name || item.cropId,
      Quantity: item.quantity,
      'Price/Unit': `KES ${item.pricePerUnit}`,
      Total: `KES ${item.totalPrice}`,
      Sold: item.sold ? 'Yes' : 'No'
    }))
    exportToPDF(data, 'crop_yield', 'Crop Yield Records')
  }

  return (
    <section>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
        <h3>{editingId ? 'Edit Crop Yield' : 'Crop yield'}</h3>
        <div style={{display:'flex',gap:4}}>
          <button onClick={handleExportCSV} title="Export to CSV" style={{ fontSize: 11, padding: '4px 8px' }}>📊 CSV</button>
          <button onClick={() => exportToExcel(visible, 'crop_yield.csv')} title="Export to Excel" style={{ fontSize: 11, padding: '4px 8px' }}>📈 Excel</button>
          <button onClick={handleExportPDF} title="Export to PDF" style={{ fontSize: 11, padding: '4px 8px' }}>📕 PDF</button>
          <button onClick={() => exportToJSON(visible, 'crop_yield.json')} title="Export to JSON" style={{ fontSize: 11, padding: '4px 8px' }}>📄 JSON</button>
        </div>
      </div>
      
      {/* Summary Stats */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:12,marginBottom:16}}>
        <div style={{padding:12,background:'#f0f9ff',borderRadius:8}}>
          <div style={{fontSize:13,color:'#666'}}>Total Harvest</div>
          <div style={{fontSize:24,fontWeight:700,color:'#0369a1'}}>{totalQuantity}</div>
        </div>
        <div style={{padding:12,background:'#f0fdf4',borderRadius:8}}>
          <div style={{fontSize:13,color:'#666'}}>Sold Quantity</div>
          <div style={{fontSize:24,fontWeight:700,color:'#15803d'}}>{soldQuantity}</div>
        </div>
        <div style={{padding:12,background:'#fefce8',borderRadius:8}}>
          <div style={{fontSize:13,color:'#666'}}>Total Revenue</div>
          <div style={{fontSize:24,fontWeight:700,color:'#ca8a04'}}>KES {totalRevenue.toFixed(2)}</div>
        </div>
      </div>
      
      <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:12,flexWrap:'wrap'}}>
        {!propCropId && (
          <select value={cropId} onChange={e=>setCropId(e.target.value)}>
            <option value="">-- select crop --</option>
            {(crops||[]).map(c=> <option key={c.id} value={c.id}>{c.name} ({c.id})</option>)}
          </select>
        )}
        <input placeholder="Quantity" value={quantity} onChange={e=>setQuantity(e.target.value)} style={{width:100}} />
        <input placeholder="Price/Unit" value={pricePerUnit} onChange={e=>setPricePerUnit(e.target.value)} style={{width:100}} />
        <input placeholder="Buyer (optional)" value={buyer} onChange={e=>setBuyer(e.target.value)} style={{width:150}} />
        <label style={{display:'flex',alignItems:'center',gap:4}}>
          <input type="checkbox" checked={sold} onChange={e=>setSold(e.target.checked)} />
          Mark as Sold {sold && pricePerUnit && quantity ? `(KES ${(parseFloat(pricePerUnit) * parseFloat(quantity)).toFixed(2)})` : ''}
        </label>
        <button onClick={add}>{editingId ? 'Save Changes' : 'Add'}</button>
        {editingId && <button onClick={cancelEdit}>Cancel Edit</button>}
      </div>

      <ul style={{listStyle:'none',padding:0}}>
        {visible.map(it => (
          <li key={it.id} style={{padding:8,borderBottom:'1px solid #eee',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div>
              <div style={{fontWeight:600}}>
                {it.quantity} units
                {it.sold && <span style={{marginLeft:8,padding:'2px 6px',background:'#dcfce7',color:'#15803d',fontSize:11,borderRadius:4,fontWeight:600}}>✓ Sold</span>}
                {it.sold && it.totalPrice > 0 && <span style={{marginLeft:8,color:'#ca8a04',fontWeight:600}}>KES {it.totalPrice.toFixed(2)}</span>}
                <small style={{color:'#666',marginLeft:8}}>({it.id})</small>
              </div>
              <div style={{fontSize:13,color:'#666'}}>
                {it.date} {propCropId ? '' : `• ${it.cropId}`}
                {it.buyer && <span> • Buyer: {it.buyer}</span>}
                {it.pricePerUnit > 0 && <span> • @ {it.pricePerUnit}/unit</span>}
              </div>
            </div>
            <div style={{display:'flex',gap:4}}>
              <button onClick={()=>startEdit(it)}>✏️</button>
              <button onClick={()=>remove(it.id)}>🗑️</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
