import React, { useEffect, useState } from 'react'
import { recordIncome } from '../lib/moduleIntegration'

const SAMPLE = [
  {
    id: 'CS-001',
    cropId: 'C-001',
    date: '2025-06-20',
    quantity: 2500,
    unit: 'lbs',
    pricePerUnit: 0.35,
    totalPrice: 875.00,
    buyer: 'Local Dairy Farms',
    buyerContact: '+254 712 345 678',
    paymentMethod: 'Bank Transfer',
    paymentStatus: 'Paid',
    deliveryDate: '2025-06-20',
    deliveryMethod: 'Pickup',
    qualityGrade: 'Premium',
    moisture: 12.5,
    notes: 'Premium quality alfalfa, first cutting'
  }
]

const PAYMENT_METHODS = ['Cash', 'M-Pesa', 'Bank Transfer', 'Check', 'Credit']
const PAYMENT_STATUS = ['Pending', 'Paid', 'Partial', 'Overdue', 'Cancelled']
const DELIVERY_METHODS = ['Pickup', 'Delivery', 'Will-Call', 'Shipping']
const QUALITY_GRADES = ['Premium', 'Grade A', 'Grade B', 'Standard', 'Below Standard']

export default function CropSales({ crops, cropId: propCropId }) {
  const KEY = 'cattalytics:crop:sales'
  const [items, setItems] = useState([])
  const [showAddForm, setShowAddForm] = useState(false)
  
  // Form states
  const [cropId, setCropId] = useState(propCropId || (crops && crops[0] ? crops[0].id : ''))
  const [quantity, setQuantity] = useState('')
  const [unit, setUnit] = useState('lbs')
  const [pricePerUnit, setPricePerUnit] = useState('0.35')
  const [buyer, setBuyer] = useState('')
  const [buyerContact, setBuyerContact] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer')
  const [paymentStatus, setPaymentStatus] = useState('Paid')
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().slice(0,10))
  const [deliveryMethod, setDeliveryMethod] = useState('Pickup')
  const [qualityGrade, setQualityGrade] = useState('Premium')
  const [moisture, setMoisture] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    const raw = localStorage.getItem(KEY)
    if (raw) setItems(JSON.parse(raw))
    else setItems(SAMPLE)
  }, [])

  useEffect(() => localStorage.setItem(KEY, JSON.stringify(items)), [items])

  function add() {
    if (!cropId || !quantity || !pricePerUnit || !buyer.trim()) {
      alert('Please fill in all required fields: Crop, Quantity, Price, and Buyer')
      return
    }

    const id = 'CS-' + Math.floor(1000 + Math.random() * 9000)
    const qty = Number(quantity)
    const price = parseFloat(pricePerUnit)
    const totalPrice = qty * price
    const cropName = crops?.find(c => c.id === cropId)?.name || cropId

    const newSale = {
      id,
      cropId,
      date: new Date().toISOString().slice(0, 10),
      quantity: qty,
      unit,
      pricePerUnit: price,
      totalPrice,
      buyer: buyer.trim(),
      buyerContact: buyerContact.trim(),
      paymentMethod,
      paymentStatus,
      deliveryDate,
      deliveryMethod,
      qualityGrade,
      moisture: parseFloat(moisture) || 0,
      notes: notes.trim(),
      timestamp: new Date().toISOString()
    }

    // Auto-record income to Finance
    if (paymentStatus === 'Paid' || paymentStatus === 'Partial') {
      recordIncome({
        amount: totalPrice,
        category: 'Crop Sales',
        subcategory: qualityGrade,
        description: `${cropName}: ${qty} ${unit} @ ${price}/${unit} to ${buyer}`,
        vendor: buyer,
        source: 'Crop Sales',
        linkedId: id,
        date: newSale.date
      })
    }

    setItems([...items, newSale])
    
    // Reset form
    setQuantity('')
    setPricePerUnit('0.35')
    setBuyer('')
    setBuyerContact('')
    setDeliveryDate(new Date().toISOString().slice(0,10))
    setMoisture('')
    setNotes('')
    setShowAddForm(false)
  }

  function remove(id) {
    if (!confirm('Delete sale record ' + id + '?')) return
    setItems(items.filter(i => i.id !== id))
  }

  function updatePaymentStatus(id, newStatus) {
    const sale = items.find(i => i.id === id)
    if (!sale) return

    // If changing to Paid, record income if not already recorded
    if (newStatus === 'Paid' && sale.paymentStatus !== 'Paid') {
      const cropName = crops?.find(c => c.id === sale.cropId)?.name || sale.cropId
      recordIncome({
        amount: sale.totalPrice,
        category: 'Crop Sales',
        subcategory: sale.qualityGrade,
        description: `${cropName}: ${sale.quantity} ${sale.unit} @ ${sale.pricePerUnit}/${sale.unit} to ${sale.buyer}`,
        vendor: sale.buyer,
        source: 'Crop Sales',
        linkedId: id,
        date: sale.date
      })
    }

    setItems(items.map(i => i.id === id ? { ...i, paymentStatus: newStatus } : i))
  }

  const visible = propCropId ? items.filter(i => i.cropId === propCropId) : items
  
  // Calculate statistics
  const totalRevenue = visible.reduce((sum, i) => sum + (i.totalPrice || 0), 0)
  const paidRevenue = visible.filter(i => i.paymentStatus === 'Paid').reduce((sum, i) => sum + (i.totalPrice || 0), 0)
  const pendingRevenue = visible.filter(i => i.paymentStatus === 'Pending' || i.paymentStatus === 'Partial').reduce((sum, i) => sum + (i.totalPrice || 0), 0)
  const totalQuantity = visible.reduce((sum, i) => sum + (i.quantity || 0), 0)
  const avgPricePerUnit = totalQuantity > 0 ? totalRevenue / totalQuantity : 0

  return (
    <section>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3>Crop Sales & Revenue</h3>
        <button onClick={() => setShowAddForm(!showAddForm)} style={{ background: 'var(--green)', color: '#fff', padding: '8px 16px', borderRadius: '6px', border: 'none' }}>
          {showAddForm ? 'Cancel' : 'Record New Sale'}
        </button>
      </div>

      {/* Summary Statistics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 20 }}>
        <div style={{ padding: 16, background: '#f0fdf4', borderRadius: 8 }}>
          <div style={{ fontSize: 13, color: '#666', marginBottom: 4 }}>Total Revenue</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#15803d' }}>KES {totalRevenue.toFixed(2)}</div>
        </div>
        <div style={{ padding: 16, background: '#ecfdf5', borderRadius: 8 }}>
          <div style={{ fontSize: 13, color: '#666', marginBottom: 4 }}>Paid Amount</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#059669' }}>KES {paidRevenue.toFixed(2)}</div>
        </div>
        <div style={{ padding: 16, background: '#fef3c7', borderRadius: 8 }}>
          <div style={{ fontSize: 13, color: '#666', marginBottom: 4 }}>Pending Payment</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#d97706' }}>KES {pendingRevenue.toFixed(2)}</div>
        </div>
        <div style={{ padding: 16, background: '#eff6ff', borderRadius: 8 }}>
          <div style={{ fontSize: 13, color: '#666', marginBottom: 4 }}>Total Sold</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#2563eb' }}>{totalQuantity.toFixed(0)}</div>
        </div>
        <div style={{ padding: 16, background: '#faf5ff', borderRadius: 8 }}>
          <div style={{ fontSize: 13, color: '#666', marginBottom: 4 }}>Avg Price/Unit</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#7c3aed' }}>KES {avgPricePerUnit.toFixed(2)}</div>
        </div>
      </div>

      {/* Add Sale Form */}
      {showAddForm && (
        <div className="card" style={{ marginBottom: 20, padding: 20 }}>
          <h4 style={{ marginTop: 0 }}>Record New Sale</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {!propCropId && (
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Crop *</label>
                <select value={cropId} onChange={e => setCropId(e.target.value)}>
                  <option value="">-- select crop --</option>
                  {(crops || []).map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.id})</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Quantity *</label>
              <input
                type="number"
                step="0.1"
                placeholder="0.0"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Unit</label>
              <select value={unit} onChange={e => setUnit(e.target.value)}>
                <option value="lbs">Pounds (lbs)</option>
                <option value="kg">Kilograms (kg)</option>
                <option value="tons">Tons</option>
                <option value="bushels">Bushels</option>
                <option value="bales">Bales</option>
                <option value="bags">Bags</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Price per Unit *</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={pricePerUnit}
                onChange={e => setPricePerUnit(e.target.value)}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Total Price</label>
              <input
                type="text"
                readOnly
                value={quantity && pricePerUnit ? `KES ${(parseFloat(quantity) * parseFloat(pricePerUnit)).toFixed(2)}` : 'KES 0.00'}
                style={{ background: '#f9fafb', fontWeight: 600 }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Buyer Name *</label>
              <input
                placeholder="e.g., ABC Dairy Farm"
                value={buyer}
                onChange={e => setBuyer(e.target.value)}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Buyer Contact</label>
              <input
                placeholder="+254 712 345 678"
                value={buyerContact}
                onChange={e => setBuyerContact(e.target.value)}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Payment Method</label>
              <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                {PAYMENT_METHODS.map(method => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Payment Status</label>
              <select value={paymentStatus} onChange={e => setPaymentStatus(e.target.value)}>
                {PAYMENT_STATUS.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Delivery Date</label>
              <input
                type="date"
                value={deliveryDate}
                onChange={e => setDeliveryDate(e.target.value)}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Delivery Method</label>
              <select value={deliveryMethod} onChange={e => setDeliveryMethod(e.target.value)}>
                {DELIVERY_METHODS.map(method => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Quality Grade</label>
              <select value={qualityGrade} onChange={e => setQualityGrade(e.target.value)}>
                {QUALITY_GRADES.map(grade => (
                  <option key={grade} value={grade}>{grade}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Moisture %</label>
              <input
                type="number"
                step="0.1"
                placeholder="0.0"
                value={moisture}
                onChange={e => setMoisture(e.target.value)}
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Notes</label>
              <textarea
                placeholder="Additional sale details..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
                style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #d1d5db' }}
              />
            </div>
          </div>
          <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
            <button
              onClick={add}
              style={{ background: 'var(--green)', color: '#fff', padding: '10px 20px', border: 'none', borderRadius: 6 }}
            >
              Record Sale
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              style={{ background: '#6b7280', color: '#fff', padding: '10px 20px', border: 'none', borderRadius: 6 }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Sales List */}
      <div>
        <h4>Sales History</h4>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {visible.length === 0 && (
            <li style={{ padding: 20, textAlign: 'center', color: '#666', fontStyle: 'italic' }}>
              No sales recorded yet. Click "Record New Sale" to add your first sale.
            </li>
          )}
          {visible.map(sale => {
            const cropName = crops?.find(c => c.id === sale.cropId)?.name || sale.cropId
            return (
              <li
                key={sale.id}
                style={{
                  padding: 16,
                  borderBottom: '1px solid #e5e7eb',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>
                    {cropName} - {sale.quantity} {sale.unit}
                    <span
                      style={{
                        marginLeft: 8,
                        padding: '2px 8px',
                        background: sale.paymentStatus === 'Paid' ? '#dcfce7' : sale.paymentStatus === 'Pending' ? '#fef3c7' : '#fee2e2',
                        color: sale.paymentStatus === 'Paid' ? '#15803d' : sale.paymentStatus === 'Pending' ? '#92400e' : '#dc2626',
                        fontSize: 12,
                        borderRadius: 4,
                        fontWeight: 600
                      }}
                    >
                      {sale.paymentStatus}
                    </span>
                    <span style={{ marginLeft: 12, color: '#059669', fontWeight: 700, fontSize: 18 }}>
                      KES {sale.totalPrice.toFixed(2)}
                    </span>
                  </div>
                  <div style={{ fontSize: 14, color: '#666', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8 }}>
                    <div>📅 {sale.date} • 🚚 {sale.deliveryMethod}</div>
                    <div>👤 {sale.buyer} {sale.buyerContact && `• ${sale.buyerContact}`}</div>
                    <div>💳 {sale.paymentMethod} • ⭐ {sale.qualityGrade}</div>
                    <div>@ KES {sale.pricePerUnit}/{sale.unit} {sale.moisture > 0 && `• 💧 ${sale.moisture}%`}</div>
                  </div>
                  {sale.notes && (
                    <div style={{ fontSize: 13, color: '#666', fontStyle: 'italic', marginTop: 4 }}>
                      📝 {sale.notes}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8, flexDirection: 'column' }}>
                  {sale.paymentStatus !== 'Paid' && (
                    <button
                      onClick={() => updatePaymentStatus(sale.id, 'Paid')}
                      style={{ padding: '6px 12px', background: '#059669', color: '#fff', border: 'none', borderRadius: 4, fontSize: 12 }}
                    >
                      Mark Paid
                    </button>
                  )}
                  <button
                    onClick={() => remove(sale.id)}
                    style={{ padding: '6px 12px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 4, fontSize: 12 }}
                  >
                    Delete
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
