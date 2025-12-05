import React, { useEffect, useState, useRef, useMemo } from 'react'
import { exportToCSV, exportToExcel, exportToJSON, importFromCSV, importFromJSON } from '../lib/exportImport'
import { getFinancialSummary } from '../lib/moduleIntegration'
import { useDebounce } from '../lib/useDebounce'

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
  const [searchTerm, setSearchTerm] = useState('')
  
  // Debounce search for better performance
  const debouncedSearch = useDebounce(searchTerm, 300)
  
  // Inline edit state
  const [inlineEditId, setInlineEditId] = useState(null)
  const [inlineData, setInlineData] = useState({ amount: '', description: '', category: '', subcategory: '', paymentMethod: 'Cash', vendor: '', date: '' })
  const [toast, setToast] = useState(null)
  const [lastChange, setLastChange] = useState(null)
  
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

  // Inline Quick Edit Functions
  function startInlineEdit(entry) {
    setInlineEditId(entry.id)
    setInlineData({
      amount: Math.abs(entry.amount),
      description: entry.description,
      category: entry.category,
      subcategory: entry.subcategory,
      paymentMethod: entry.paymentMethod,
      vendor: entry.vendor || '',
      date: entry.date
    })
  }

  function saveInlineEdit() {
    // Validation
    if (!inlineData.description.trim()) {
      setToast({ type: 'error', message: 'Description is required' })
      setTimeout(() => setToast(null), 3000)
      return
    }
    if (!inlineData.amount || isNaN(inlineData.amount) || Number(inlineData.amount) <= 0) {
      setToast({ type: 'error', message: 'Valid amount is required' })
      setTimeout(() => setToast(null), 3000)
      return
    }

    const updated = items.map(e => {
      if (e.id === inlineEditId) {
        // Store previous state for undo
        setLastChange({ type: 'edit', entry: { ...e } })
        // Preserve income/expense type, just update amount value
        const newAmount = e.amount >= 0 ? Number(inlineData.amount) : -Number(inlineData.amount)
        return { ...e, ...inlineData, amount: newAmount }
      }
      return e
    })
    
    setItems(updated)
    localStorage.setItem(KEY, JSON.stringify(updated))
    
    setToast({ type: 'success', message: 'Transaction updated successfully', showUndo: true })
    setTimeout(() => setToast(null), 5000)
    
    setInlineEditId(null)
    setInlineData({ amount: '', description: '', category: '', subcategory: '', paymentMethod: 'Cash', vendor: '', date: '' })
  }

  function cancelInlineEdit() {
    setInlineEditId(null)
    setInlineData({ amount: '', description: '', category: '', subcategory: '', paymentMethod: 'Cash', vendor: '', date: '' })
  }

  function undoLastChange() {
    if (!lastChange) return
    
    if (lastChange.type === 'edit') {
      const updated = items.map(e => 
        e.id === lastChange.entry.id ? lastChange.entry : e
      )
      setItems(updated)
      localStorage.setItem(KEY, JSON.stringify(updated))
      setToast({ type: 'success', message: 'Change reverted' })
      setTimeout(() => setToast(null), 3000)
      setLastChange(null)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault()
      saveInlineEdit()
    } else if (e.key === 'Escape') {
      cancelInlineEdit()
    }
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

  // Filter and calculate totals with search
  const filteredItems = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase()
    
    return items.filter(entry => {
      // Text search
      if (q) {
        const matchesSearch = 
          (entry.description || '').toLowerCase().includes(q) ||
          (entry.category || '').toLowerCase().includes(q) ||
          (entry.subcategory || '').toLowerCase().includes(q) ||
          (entry.vendor || '').toLowerCase().includes(q) ||
          (entry.paymentMethod || '').toLowerCase().includes(q)
        if (!matchesSearch) return false
      }
      
      // Type filter
      if(filterType !== 'all' && entry.type !== filterType) return false
      
      // Category filter
      if(filterCategory !== 'all' && entry.category !== filterCategory) return false
      
      // Date range filter
      if(dateRange.start && entry.date < dateRange.start) return false
      if(dateRange.end && entry.date > dateRange.end) return false
      
      return true
    }).sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [items, debouncedSearch, filterType, filterCategory, dateRange])

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
        <div style={{ marginBottom: '12px' }}>
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="🔍 Search transactions (description, category, vendor)..."
            style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px' }}
          />
          {searchTerm && (
            <div style={{ marginTop: '4px', fontSize: '14px', color: '#6b7280' }}>
              Found {filteredItems.length} transaction{filteredItems.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
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
              {[...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES].map((cat, idx) => 
                <option key={`${cat.name}-${idx}`} value={cat.name}>{cat.name}</option>
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
            <button onClick={() => {setFilterType('all'); setFilterCategory('all'); setDateRange({start: '', end: ''}); setSearchTerm('')}} style={{ background: '#6b7280', color: '#fff', padding: '8px 12px', border: 'none', borderRadius: '4px' }}>Clear Filters</button>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div style={{ display: 'grid', gap: '8px' }}>
        {filteredItems.map(entry => (
          <div key={entry.id} className="card" style={{ padding: '16px', borderLeft: `4px solid ${entry.amount >= 0 ? 'var(--green)' : '#dc2626'}` }}>
            {inlineEditId === entry.id ? (
              // Inline Edit Mode
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }} onKeyDown={handleKeyDown}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600' }}>⚡ Quick Edit</h4>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={saveInlineEdit} style={{ padding: '6px 16px', fontSize: '0.85rem', background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>✓ Save</button>
                    <button onClick={cancelInlineEdit} style={{ padding: '6px 16px', fontSize: '0.85rem', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>✕ Cancel</button>
                  </div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth <= 600 ? '1fr' : 'repeat(3, 1fr)', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', marginBottom: 4 }}>Amount (KES) *</label>
                    <input
                      type="number"
                      value={inlineData.amount}
                      onChange={(e) => setInlineData({ ...inlineData, amount: e.target.value })}
                      style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px' }}
                      autoFocus
                    />
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', marginBottom: 4 }}>Date</label>
                    <input
                      type="date"
                      value={inlineData.date}
                      onChange={(e) => setInlineData({ ...inlineData, date: e.target.value })}
                      style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px' }}
                    />
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', marginBottom: 4 }}>Payment Method</label>
                    <select
                      value={inlineData.paymentMethod}
                      onChange={(e) => setInlineData({ ...inlineData, paymentMethod: e.target.value })}
                      style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px' }}
                    >
                      {PAYMENT_METHODS.map(pm => <option key={pm} value={pm}>{pm}</option>)}
                    </select>
                  </div>
                  
                  <div style={{ gridColumn: window.innerWidth <= 600 ? '1' : 'span 2' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', marginBottom: 4 }}>Description *</label>
                    <input
                      type="text"
                      value={inlineData.description}
                      onChange={(e) => setInlineData({ ...inlineData, description: e.target.value })}
                      style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px' }}
                    />
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', marginBottom: 4 }}>Vendor</label>
                    <input
                      type="text"
                      value={inlineData.vendor}
                      onChange={(e) => setInlineData({ ...inlineData, vendor: e.target.value })}
                      style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px' }}
                    />
                  </div>
                </div>
                
                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 4 }}>
                  💡 Press Enter to save, Escape to cancel
                </div>
              </div>
            ) : (
              // Display Mode
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
                    <button onClick={() => startInlineEdit(entry)} title="Quick Edit">⚡ Quick</button>
                    <button onClick={() => setModalOpenId(entry.id)}>View</button>
                    <button onClick={() => startEdit(entry)}>Full</button>
                    <button onClick={() => remove(entry.id)}>Delete</button>
                  </div>
                </div>
              </div>
            )}
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
      
      {/* Toast Notifications */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          padding: '12px 20px',
          background: toast.type === 'error' ? '#ef4444' : '#10b981',
          color: '#fff',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          maxWidth: '400px',
          animation: 'slideIn 0.3s ease-out'
        }}>
          <span>{toast.message}</span>
          {toast.showUndo && (
            <button
              onClick={undoLastChange}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: '1px solid rgba(255,255,255,0.3)',
                color: '#fff',
                padding: '4px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.85rem'
              }}
            >
              ↶ Undo
            </button>
          )}
        </div>
      )}
    </section>
  )
}
