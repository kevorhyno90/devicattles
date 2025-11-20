import React, { useEffect, useState, useRef } from 'react'
import { exportToCSV, exportToExcel, exportToJSON, importFromCSV, importFromJSON } from '../lib/exportImport'
import { getFinancialSummary } from '../lib/moduleIntegration'

const SAMPLE = [
  { id: 'F-001', date: '2025-01-12', amount: -18000.00, type: 'expense', category: 'Veterinary', subcategory: 'Vaccines', description: 'Annual vaccination program', notes: [], paymentMethod: 'M-Pesa', vendor: 'Valley Veterinary Clinic' },
  { id: 'F-002', date: '2025-01-15', amount: -36825.00, type: 'expense', category: 'Feed', subcategory: 'Hay', description: 'Premium alfalfa hay - 50 bales', notes: [], paymentMethod: 'Bank Transfer', vendor: 'Green Valley Feed' },
  { id: 'F-003', date: '2025-01-20', amount: 187500.00, type: 'income', category: 'Milk Sales', subcategory: 'Wholesale', description: 'Weekly milk delivery to processing plant', notes: [], paymentMethod: 'Bank Transfer', vendor: 'Dairy Processors Inc' },
  { id: 'F-004', date: '2025-01-22', amount: -13499.00, type: 'expense', category: 'Equipment', subcategory: 'Maintenance', description: 'Milking equipment parts replacement', notes: [], paymentMethod: 'M-Pesa', vendor: 'Farm Equipment Supply' }
]

const EXPENSE_CATEGORIES = [
  { name: 'Feed', subcategories: ['Hay', 'Grain', 'Supplements', 'Pasture Seed'] },
  { name: 'Veterinary', subcategories: ['Vaccines', 'Treatment', 'Checkups', 'Emergency Care'] },
  { name: 'Equipment', subcategories: ['Purchase', 'Maintenance', 'Repair', 'Fuel'] },
  { name: 'Labor', subcategories: ['Wages', 'Benefits', 'Contract Work', 'Training'] },
  { name: 'Utilities', subcategories: ['Electricity', 'Water', 'Internet', 'Phone'] },
  { name: 'Insurance', subcategories: ['Liability', 'Equipment', 'Livestock', 'Property'] },
  { name: 'Transportation', subcategories: ['Fuel', 'Vehicle Maintenance', 'Delivery', 'Travel'] },
  { name: 'Other', subcategories: ['Supplies', 'Professional Services', 'Miscellaneous'] }
]

const INCOME_CATEGORIES = [
  { name: 'Milk Sales', subcategories: ['Wholesale', 'Direct Sales', 'Farmers Market'] },
  { name: 'Livestock Sales', subcategories: ['Cattle Sales', 'Breeding Stock', 'Calf Sales'] },
  { name: 'Crop Sales', subcategories: ['Hay', 'Grain', 'Silage'] },
  { name: 'Services', subcategories: ['Custom Work', 'Consulting', 'Equipment Rental'] },
  { name: 'Government', subcategories: ['Subsidies', 'Grants', 'Tax Credits'] },
  { name: 'Other', subcategories: ['Investment Income', 'Insurance Claims', 'Miscellaneous'] }
]

const PAYMENT_METHODS = ['Cash', 'M-Pesa', 'Bank Transfer', 'Credit Card', 'Debit Card', 'Check']

export default function Finance(){
  const KEY = 'cattalytics:finance'
  const [items, setItems] = useState([])
  const [activeTab, setActiveTab] = useState('all')
  const [showAddForm, setShowAddForm] = useState(false)
  const [modalOpenId, setModalOpenId] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  
  // Form states
  const [formData, setFormData] = useState({
    amount: '', type: 'expense', category: 'Feed', subcategory: 'Hay', 
    description: '', paymentMethod: 'Cash', vendor: '', date: new Date().toISOString().slice(0,10)
  })

  const fileInputRef = useRef(null)

  function handleExportCSV() {
    exportToCSV(items, 'finance_transactions.csv')
  }

  function handleExportExcel() {
    exportToExcel(items, 'finance_transactions.csv')
  }

  function handleExportJSON() {
    exportToJSON(items, 'finance_transactions.json')
  }

  function handleImportClick() {
    fileInputRef.current?.click()
  }

  function handleImportFile(e) {
    const file = e.target.files?.[0]
    if (!file) return

    const ext = file.name.split('.').pop()?.toLowerCase()

    if (ext === 'json') {
      importFromJSON(file, (data, error) => {
        if (error) {
          alert('Import failed: ' + error.message)
          return
        }
        if (confirm(`Import ${data.length} transactions? This will merge with existing data.`)) {
          setItems([...items, ...data])
          alert(`Imported ${data.length} transactions`)
        }
      })
    } else if (ext === 'csv') {
      importFromCSV(file, (data, error) => {
        if (error) {
          alert('Import failed: ' + error.message)
          return
        }
        if (confirm(`Import ${data.length} transactions? This will merge with existing data.`)) {
          const imported = data.map(t => ({
            ...t,
            amount: parseFloat(t.amount) || 0,
            notes: t.notes ? JSON.parse(t.notes) : []
          }))
          setItems([...items, ...imported])
          alert(`Imported ${imported.length} transactions`)
        }
      })
    } else {
      alert('Unsupported file type. Use CSV or JSON.')
    }

    e.target.value = ''
  }

  function addNoteToTransaction(tx){
    const note = window.prompt('Add note for transaction ' + tx.id,'')
    if(note === null) return
    const ts = new Date().toISOString()
    setItems(items.map(i => i.id === tx.id ? { ...i, notes: [...(i.notes||[]), { date: ts, text: note }] } : i ))
  }

  useEffect(()=>{
    const raw = localStorage.getItem(KEY)
    if(raw) setItems(JSON.parse(raw))
    else setItems(SAMPLE)
  }, [])

  useEffect(()=> localStorage.setItem(KEY, JSON.stringify(items)), [items])

  function add(){
    const amt = parseFloat(formData.amount || 0)
    if(!formData.description.trim() || !amt) return
    
    const finalAmount = formData.type === 'expense' ? -Math.abs(amt) : Math.abs(amt)
    const id = 'F-' + Math.floor(1000 + Math.random()*9000)
    
    const newEntry = {
      id,
      ...formData,
      amount: finalAmount,
      description: formData.description.trim(),
      notes: [],
      createdDate: new Date().toISOString()
    }
    
    setItems([...items, newEntry])
    setFormData({ amount: '', type: 'expense', category: 'Feed', subcategory: 'Hay', description: '', paymentMethod: 'Cash', vendor: '', date: new Date().toISOString().slice(0,10) })
    setShowAddForm(false)
  }

  function remove(id){
    if(!confirm('Delete financial entry '+id+'?')) return
    setItems(items.filter(i=>i.id!==id))
  }

  function addNote(entryId, noteText){
    if(!noteText.trim()) return
    setItems(items.map(i => i.id === entryId ? {
      ...i,
      notes: [...(i.notes || []), { 
        id: Date.now(), 
        text: noteText.trim(), 
        date: new Date().toISOString(),
        author: 'Current User'
      }]
    } : i))
  }

  function updateEntry(id, updates){
    setItems(items.map(i => i.id === id ? { ...i, ...updates } : i))
  }

  function startEdit(entry){
    setFormData({
      amount: Math.abs(entry.amount).toString(),
      type: entry.type,
      category: entry.category,
      subcategory: entry.subcategory || '',
      description: entry.description || '',
      paymentMethod: entry.paymentMethod || 'Cash',
      vendor: entry.vendor || '',
      date: entry.date || new Date().toISOString().slice(0,10)
    })
    setEditingId(entry.id)
    setShowAddForm(true)
  }

  function saveEdit(){
    const amt = parseFloat(formData.amount || 0)
    if(!formData.description.trim() || !amt) return
    
    const finalAmount = formData.type === 'expense' ? -Math.abs(amt) : Math.abs(amt)
    
    setItems(items.map(i => i.id === editingId ? {
      ...i,
      ...formData,
      amount: finalAmount,
      description: formData.description.trim()
    } : i))
    setFormData({ amount: '', type: 'expense', category: 'Feed', subcategory: 'Hay', description: '', paymentMethod: 'Cash', vendor: '', date: new Date().toISOString().slice(0,10) })
    setEditingId(null)
    setShowAddForm(false)
  }

  function cancelEdit(){
    setFormData({ amount: '', type: 'expense', category: 'Feed', subcategory: 'Hay', description: '', paymentMethod: 'Cash', vendor: '', date: new Date().toISOString().slice(0,10) })
    setEditingId(null)
    setShowAddForm(false)
  }

  // Filter and calculate totals
  const filteredItems = items.filter(entry => {
    if(filterType !== 'all' && entry.type !== filterType) return false
    if(filterCategory !== 'all' && entry.category !== filterCategory) return false
    if(dateRange.start && entry.date < dateRange.start) return false
    if(dateRange.end && entry.date > dateRange.end) return false
    return true
  }).sort((a, b) => new Date(b.date) - new Date(a.date))

  const currentDate = new Date()
  const currentMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString().slice(0,10)
  const currentMonthItems = items.filter(i => i.date >= currentMonthStart)

  const stats = {
    totalIncome: items.filter(i => i.amount > 0).reduce((sum, i) => sum + i.amount, 0),
    totalExpenses: items.filter(i => i.amount < 0).reduce((sum, i) => sum + Math.abs(i.amount), 0),
    monthlyIncome: currentMonthItems.filter(i => i.amount > 0).reduce((sum, i) => sum + i.amount, 0),
    monthlyExpenses: currentMonthItems.filter(i => i.amount < 0).reduce((sum, i) => sum + Math.abs(i.amount), 0),
    netProfit: items.reduce((sum, i) => sum + i.amount, 0),
    monthlyNet: currentMonthItems.reduce((sum, i) => sum + i.amount, 0)
  }
  
  // Get integrated financial summary from all modules
  const integratedSummary = getFinancialSummary()
  const profitMargin = stats.totalIncome > 0 ? ((stats.netProfit / stats.totalIncome) * 100) : 0

  const getCategoryOptions = () => {
    return formData.type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES
  }

  const getSubcategories = () => {
    const categoryObj = getCategoryOptions().find(cat => cat.name === formData.category)
    return categoryObj ? categoryObj.subcategories : []
  }

  return (
    <section>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <h2 style={{ margin: 0 }}>Financial Management</h2>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button onClick={handleExportCSV} title="Export to CSV">📊 CSV</button>
            <button onClick={handleExportExcel} title="Export to Excel">📈 Excel</button>
            <button onClick={handleExportJSON} title="Export to JSON">📄 JSON</button>
            <button onClick={handleImportClick} title="Import from file">📥 Import</button>
            <input 
              ref={fileInputRef}
              type="file" 
              accept=".csv,.json" 
              style={{ display: 'none' }} 
              onChange={handleImportFile}
            />
            <button onClick={() => setShowAddForm(!showAddForm)} style={{ background: 'var(--green)', color: '#fff', padding: '10px 16px', borderRadius: '8px', border: 'none' }}>Add Transaction</button>
          </div>
        </div>
        
        {/* Financial Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '20px' }}>
          <div className="card" style={{ padding: '20px', background: '#f0fdf4' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#15803d' }}>Total Income</h3>
            <div style={{ fontSize: '28px', fontWeight: '700', color: '#15803d' }}>KES {stats.totalIncome.toLocaleString('en-KE', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>This Month: KES {stats.monthlyIncome.toFixed(2)}</div>
          </div>
          
          <div className="card" style={{ padding: '20px', background: '#fef2f2' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#dc2626' }}>Total Expenses</h3>
            <div style={{ fontSize: '28px', fontWeight: '700', color: '#dc2626' }}>KES {stats.totalExpenses.toLocaleString('en-KE', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>This Month: KES {stats.monthlyExpenses.toFixed(2)}</div>
          </div>

          <div className="card" style={{ padding: '20px', background: stats.netProfit >= 0 ? '#ecfdf5' : '#fef2f2' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', color: stats.netProfit >= 0 ? '#059669' : '#dc2626' }}>Net Profit/Loss</h3>
            <div style={{ fontSize: '28px', fontWeight: '700', color: stats.netProfit >= 0 ? '#059669' : '#dc2626' }}>
              {stats.netProfit >= 0 ? '+' : ''}KES {stats.netProfit.toLocaleString('en-KE', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </div>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>This Month: {stats.monthlyNet >= 0 ? '+' : ''}KES {stats.monthlyNet.toFixed(2)}</div>
          </div>
          
          <div className="card" style={{ padding: '20px', background: profitMargin >= 0 ? '#eff6ff' : '#fef2f2' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', color: profitMargin >= 0 ? '#2563eb' : '#dc2626' }}>Profit Margin</h3>
            <div style={{ fontSize: '28px', fontWeight: '700', color: profitMargin >= 0 ? '#2563eb' : '#dc2626' }}>
              {profitMargin.toFixed(1)}%
            </div>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
              {profitMargin >= 20 ? '🎉 Excellent' : profitMargin >= 10 ? '👍 Good' : profitMargin >= 0 ? '⚠️ Low' : '❌ Loss'}
            </div>
          </div>
        </div>
        
        {/* Income/Expense Breakdown by Source */}
        {integratedSummary.sources.length > 0 && (
          <div className="card" style={{ padding: '20px', marginBottom: '20px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px' }}>Income & Expenses by Source</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              {integratedSummary.sources.map(source => (
                <div key={source.source} style={{ padding: '12px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                  <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '8px', color: '#374151' }}>{source.source}</div>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                    Income: <span style={{ color: '#15803d', fontWeight: '600' }}>KES {source.income.toFixed(2)}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                    Expenses: <span style={{ color: '#dc2626', fontWeight: '600' }}>KES {source.expenses.toFixed(2)}</span>
                  </div>
                  <div style={{ fontSize: '12px', borderTop: '1px solid #e5e7eb', paddingTop: '4px', marginTop: '4px' }}>
                    Net: <span style={{ color: source.net >= 0 ? '#059669' : '#dc2626', fontWeight: '700' }}>
                      {source.net >= 0 ? '+' : ''}KES {source.net.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add Transaction Form */}
      {showAddForm && (
        <div className="card" style={{ marginBottom: '20px', padding: '20px' }}>
          <h3>{editingId ? 'Edit Transaction' : 'Add New Transaction'}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Type</label>
              <select value={formData.type} onChange={e => {
                const newType = e.target.value
                setFormData({
                  ...formData, 
                  type: newType,
                  category: newType === 'expense' ? 'Feed' : 'Milk Sales',
                  subcategory: newType === 'expense' ? 'Hay' : 'Wholesale'
                })
              }}>
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Amount</label>
              <input 
                type="number" 
                step="0.01" 
                placeholder="0.00" 
                value={formData.amount} 
                onChange={e => setFormData({...formData, amount: e.target.value})} 
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Date</label>
              <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Category</label>
              <select value={formData.category} onChange={e => {
                const newCategory = e.target.value
                const subcategories = getCategoryOptions().find(cat => cat.name === newCategory)?.subcategories || []
                setFormData({...formData, category: newCategory, subcategory: subcategories[0] || ''})
              }}>
                {getCategoryOptions().map(cat => <option key={cat.name} value={cat.name}>{cat.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Subcategory</label>
              <select value={formData.subcategory} onChange={e => setFormData({...formData, subcategory: e.target.value})}>
                {getSubcategories().map(sub => <option key={sub} value={sub}>{sub}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Payment Method</label>
              <select value={formData.paymentMethod} onChange={e => setFormData({...formData, paymentMethod: e.target.value})}>
                {PAYMENT_METHODS.map(method => <option key={method} value={method}>{method}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Description</label>
              <input placeholder="Enter transaction description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Vendor/Customer</label>
              <input placeholder="Enter vendor or customer name" value={formData.vendor} onChange={e => setFormData({...formData, vendor: e.target.value})} />
            </div>
          </div>
          <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
            <button onClick={editingId ? saveEdit : add} style={{ background: 'var(--green)', color: '#fff', padding: '10px 16px', border: 'none', borderRadius: '6px' }}>{editingId ? 'Save Changes' : 'Add Transaction'}</button>
            <button onClick={editingId ? cancelEdit : () => setShowAddForm(false)} style={{ background: '#6b7280', color: '#fff', padding: '10px 16px', border: 'none', borderRadius: '6px' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card" style={{ marginBottom: '20px', padding: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Type</label>
            <select value={filterType} onChange={e => setFilterType(e.target.value)}>
              <option value="all">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expenses</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Category</label>
            <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
              <option value="all">All Categories</option>
              {[...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES].map(cat => 
                <option key={cat.name} value={cat.name}>{cat.name}</option>
              )}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Start Date</label>
            <input type="date" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>End Date</label>
            <input type="date" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} />
          </div>
          <div>
            <button onClick={() => {setFilterType('all'); setFilterCategory('all'); setDateRange({start: '', end: ''})}} style={{ background: '#6b7280', color: '#fff', padding: '8px 12px', border: 'none', borderRadius: '4px' }}>Clear Filters</button>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div style={{ display: 'grid', gap: '8px' }}>
        {filteredItems.map(entry => (
          <div key={entry.id} className="card" style={{ padding: '16px', borderLeft: `4px solid ${entry.amount >= 0 ? 'var(--green)' : '#dc2626'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                  <h4 style={{ margin: 0 }}>{entry.description}</h4>
                  <span className={`badge ${entry.amount >= 0 ? 'green' : ''}`}>{entry.category}</span>
                  <span className="badge">{entry.subcategory}</span>
                </div>
                <div style={{ display: 'flex', gap: '20px', fontSize: '14px', color: 'var(--muted)', marginBottom: '4px' }}>
                  <span>📅 {entry.date}</span>
                  <span>💳 {entry.paymentMethod}</span>
                  {entry.vendor && <span>🏪 {entry.vendor}</span>}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: entry.amount >= 0 ? 'var(--green)' : '#dc2626' }}>
                    {entry.amount >= 0 ? '+' : '-'}KES {Math.abs(entry.amount).toLocaleString('en-KE', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{entry.id}</div>
                </div>
                <div className="controls">
                  <button onClick={() => setModalOpenId(entry.id)}>View</button>
                  <button onClick={() => startEdit(entry)}>Edit</button>
                  <button onClick={() => remove(entry.id)}>Delete</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Transaction Detail Modal */}
      {modalOpenId && (() => {
        const entry = items.find(e => e.id === modalOpenId)
        if(!entry) return null
        return (
          <div className="drawer-overlay" onClick={() => setModalOpenId(null)}>
            <div className="drawer" onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3>{entry.description}</h3>
                <div>
                  <button onClick={() => { setModalOpenId(null); startEdit(entry); }}>Edit</button>
                  <button onClick={() => setModalOpenId(null)} style={{ marginLeft: '8px' }}>Close</button>
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px' }}>
                <div>
                  <div>
                    <h4>Transaction Notes</h4>
                    <div style={{ marginBottom: '12px' }}>
                      <input 
                        placeholder="Add a note..." 
                        onKeyPress={e => {
                          if(e.key === 'Enter' && e.target.value.trim()) {
                            addNote(entry.id, e.target.value)
                            e.target.value = ''
                          }
                        }}
                        style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                      />
                    </div>
                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                      {(entry.notes || []).slice().reverse().map(note => (
                        <div key={note.id} style={{ padding: '12px', background: '#f9fafb', borderRadius: '8px', marginBottom: '12px' }}>
                          <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '4px' }}>
                            {note.author} • {new Date(note.date).toLocaleString()}
                          </div>
                          <div>{note.text}</div>
                        </div>
                      ))}
                      {(!entry.notes || entry.notes.length === 0) && (
                        <div style={{ color: 'var(--muted)', fontStyle: 'italic', padding: '20px', textAlign: 'center' }}>No notes yet</div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="card" style={{ padding: '20px', height: 'fit-content' }}>
                  <h4>Transaction Details</h4>
                  <div style={{ display: 'grid', gap: '12px', fontSize: '14px' }}>
                    <div><strong>Amount:</strong> 
                      <span style={{ color: entry.amount >= 0 ? 'var(--green)' : '#dc2626', fontWeight: '700', marginLeft: '8px' }}>
                        {entry.amount >= 0 ? '+' : '-'}KES {Math.abs(entry.amount).toLocaleString('en-KE', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </span>
                    </div>
                    <div><strong>Type:</strong> <span className={`badge ${entry.amount >= 0 ? 'green' : ''}`}>{entry.type}</span></div>
                    <div><strong>Category:</strong> {entry.category}</div>
                    <div><strong>Subcategory:</strong> {entry.subcategory}</div>
                    <div><strong>Date:</strong> {entry.date}</div>
                    <div><strong>Payment Method:</strong> {entry.paymentMethod}</div>
                    {entry.vendor && <div><strong>Vendor/Customer:</strong> {entry.vendor}</div>}
                    <div><strong>Transaction ID:</strong> {entry.id}</div>
                    {entry.createdDate && <div><strong>Created:</strong> {new Date(entry.createdDate).toLocaleString()}</div>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      })()}
    </section>
  )
}
