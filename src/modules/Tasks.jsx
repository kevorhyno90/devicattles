import React, { useEffect, useState, useRef } from 'react'
import { exportToCSV, exportToExcel, exportToJSON, importFromCSV, importFromJSON } from '../lib/exportImport'

const SAMPLE = [
  { id: 'T-001', title: 'Check water troughs', description: 'Inspect all water systems in pastures A-D', assignedTo: 'John Smith', due: '2025-11-16', priority: 'High', category: 'Maintenance', done: false, createdDate: '2025-11-15', estimatedHours: 2, notes: [], location: 'Pasture A-D' },
  { id: 'T-002', title: 'Move herd to pasture B', description: 'Rotate cattle from pasture A to pasture B for better grazing', assignedTo: 'Mike Johnson', due: '2025-11-17', priority: 'Medium', category: 'Animal Care', done: false, createdDate: '2025-11-15', estimatedHours: 4, notes: [], location: 'Pasture B' },
  { id: 'T-003', title: 'Veterinary checkup', description: 'Schedule and conduct quarterly health checks', assignedTo: 'Dr. Sarah Wilson', due: '2025-11-20', priority: 'High', category: 'Health', done: false, createdDate: '2025-11-15', estimatedHours: 6, notes: [], location: 'Clinic' }
]

const CATEGORIES = ['Animal Care', 'Maintenance', 'Health', 'Feed & Nutrition', 'Breeding', 'Equipment', 'Administrative', 'Other']
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical']
const STAFF = ['Unassigned', 'John Smith', 'Mike Johnson', 'Dr. Sarah Wilson', 'Emma Davis', 'Tom Brown']

export default function Tasks(){
  const KEY = 'cattalytics:tasks'
  const [items, setItems] = useState([])
  const [activeTab, setActiveTab] = useState('all')
  const [showAddForm, setShowAddForm] = useState(false)
  const [modalOpenId, setModalOpenId] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')
  const [sortBy, setSortBy] = useState('due')
  
  // Form states
  const [formData, setFormData] = useState({
    title: '', description: '', assignedTo: 'Unassigned', due: '', 
    priority: 'Medium', category: 'Animal Care', estimatedHours: 1, location: ''
  })

  useEffect(()=>{
    const raw = localStorage.getItem(KEY)
    if(raw) setItems(JSON.parse(raw))
    else setItems(SAMPLE)
  }, [])

  useEffect(()=> localStorage.setItem(KEY, JSON.stringify(items)), [items])

  function add(){
    if(!formData.title.trim()) return
    const id = 'T-' + Math.floor(1000 + Math.random()*9000)
    const newTask = {
      id, 
      ...formData,
      title: formData.title.trim(),
      done: false,
      createdDate: new Date().toISOString().slice(0,10),
      notes: []
    }
    setItems([...items, newTask])
    setFormData({ title: '', description: '', assignedTo: 'Unassigned', due: '', priority: 'Medium', category: 'Animal Care', estimatedHours: 1, location: '' })
    setShowAddForm(false)
  }

  function remove(id){ 
    if(!confirm('Delete task '+id+'?')) return
    setItems(items.filter(i=>i.id!==id)) 
  }

  function toggleDone(id){ 
    setItems(items.map(i=> i.id===id ? {
      ...i, 
      done: !i.done,
      completedDate: !i.done ? new Date().toISOString().slice(0,10) : null
    } : i)) 
  }

  function addNote(taskId, note){
    if(!note.trim()) return
    setItems(items.map(i => i.id === taskId ? {
      ...i,
      notes: [...(i.notes || []), { 
        id: Date.now(), 
        text: note.trim(), 
        date: new Date().toISOString(),
        author: 'Current User'
      }]
    } : i))
  }

  function updateTask(id, updates){
    setItems(items.map(i => i.id === id ? { ...i, ...updates } : i))
  }

  function startEdit(task){
    setFormData({
      title: task.title,
      description: task.description || '',
      assignedTo: task.assignedTo || 'Unassigned',
      due: task.due || '',
      priority: task.priority || 'Medium',
      category: task.category || 'Animal Care',
      estimatedHours: task.estimatedHours || 1,
      location: task.location || ''
    })
    setEditingId(task.id)
    setShowAddForm(true)
  }

  function saveEdit(){
    if(!formData.title.trim()) return
    setItems(items.map(i => i.id === editingId ? {
      ...i,
      ...formData,
      title: formData.title.trim()
    } : i))
    setFormData({ title: '', description: '', assignedTo: 'Unassigned', due: '', priority: 'Medium', category: 'Animal Care', estimatedHours: 1, location: '' })
    setEditingId(null)
    setShowAddForm(false)
  }

  function cancelEdit(){
    setFormData({ title: '', description: '', assignedTo: 'Unassigned', due: '', priority: 'Medium', category: 'Animal Care', estimatedHours: 1, location: '' })
    setEditingId(null)
    setShowAddForm(false)
  }

  // Filter and sort logic
  const filteredItems = items.filter(task => {
    if(activeTab === 'pending' && task.done) return false
    if(activeTab === 'completed' && !task.done) return false
    if(activeTab === 'overdue' && (task.done || !task.due || new Date(task.due) >= new Date())) return false
    if(filterCategory !== 'all' && task.category !== filterCategory) return false
    if(filterPriority !== 'all' && task.priority !== filterPriority) return false
    return true
  }).sort((a, b) => {
    if(sortBy === 'due') return new Date(a.due || '9999-12-31') - new Date(b.due || '9999-12-31')
    if(sortBy === 'priority') {
      const priorityOrder = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    }
    if(sortBy === 'created') return new Date(b.createdDate) - new Date(a.createdDate)
    return 0
  })

  const stats = {
    total: items.length,
    completed: items.filter(t => t.done).length,
    pending: items.filter(t => !t.done).length,
    overdue: items.filter(t => !t.done && t.due && new Date(t.due) < new Date()).length
  }

  const fileInputRef = useRef(null)

  function handleExportCSV() {
    const data = filtered.map(t => ({
      id: t.id,
      title: t.title,
      description: t.description,
      category: t.category,
      priority: t.priority,
      assignedTo: t.assignedTo,
      due: t.due,
      status: t.done ? 'Completed' : 'Pending',
      createdDate: t.createdDate,
      estimatedHours: t.estimatedHours,
      location: t.location
    }))
    exportToCSV(data, 'tasks.csv')
  }

  function handleExportExcel() {
    const data = filtered.map(t => ({
      id: t.id,
      title: t.title,
      description: t.description,
      category: t.category,
      priority: t.priority,
      assignedTo: t.assignedTo,
      due: t.due,
      status: t.done ? 'Completed' : 'Pending',
      createdDate: t.createdDate,
      estimatedHours: t.estimatedHours,
      location: t.location
    }))
    exportToExcel(data, 'tasks_export.csv')
  }

  function handleExportJSON() {
    exportToJSON(filtered, 'tasks.json')
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
        if (confirm(`Import ${data.length} tasks? This will merge with existing data.`)) {
          const imported = data.map(t => ({
            ...t,
            id: t.id || 'T-' + Math.floor(1000 + Math.random()*9000)
          }))
          setItems([...items, ...imported])
          alert(`Imported ${imported.length} tasks`)
        }
      })
    } else if (ext === 'csv') {
      importFromCSV(file, (data, error) => {
        if (error) {
          alert('Import failed: ' + error.message)
          return
        }
        if (confirm(`Import ${data.length} tasks? This will merge with existing data.`)) {
          const imported = data.map(t => ({
            id: t.id || 'T-' + Math.floor(1000 + Math.random()*9000),
            title: t.title || '',
            description: t.description || '',
            category: t.category || 'Other',
            priority: t.priority || 'Medium',
            assignedTo: t.assignedTo || 'Unassigned',
            due: t.due || '',
            done: t.status === 'Completed',
            createdDate: t.createdDate || new Date().toISOString().slice(0,10),
            estimatedHours: t.estimatedHours ? Number(t.estimatedHours) : 1,
            location: t.location || '',
            notes: []
          }))
          setItems([...items, ...imported])
          alert(`Imported ${imported.length} tasks`)
        }
      })
    } else {
      alert('Unsupported file type. Use CSV or JSON.')
    }

    e.target.value = ''
  }

  return (
    <section>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
          <h2 style={{ margin: 0 }}>Task Management</h2>
          <div style={{ display: 'flex', gap: 4 }}>
            <button onClick={handleExportCSV} title="Export to CSV" style={{ fontSize: 12 }}>📊 CSV</button>
            <button onClick={handleExportExcel} title="Export to Excel" style={{ fontSize: 12 }}>📈 Excel</button>
            <button onClick={handleExportJSON} title="Export to JSON" style={{ fontSize: 12 }}>📄 JSON</button>
            <button onClick={handleImportClick} title="Import from file" style={{ fontSize: 12 }}>📥 Import</button>
            <input 
              ref={fileInputRef}
              type="file" 
              accept=".csv,.json" 
              style={{ display: 'none' }} 
              onChange={handleImportFile}
            />
            <button onClick={() => setShowAddForm(!showAddForm)} className="add-row button" style={{ background: 'var(--green)', color: '#fff', padding: '10px 16px', borderRadius: '8px', border: 'none' }}>Add New Task</button>
          </div>
        </div>
        
        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '20px' }}>
          <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--green)' }}>{stats.total}</div>
            <div style={{ fontSize: '14px', color: 'var(--muted)' }}>Total Tasks</div>
          </div>
          <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#f59e0b' }}>{stats.pending}</div>
            <div style={{ fontSize: '14px', color: 'var(--muted)' }}>Pending</div>
          </div>
          <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--green)' }}>{stats.completed}</div>
            <div style={{ fontSize: '14px', color: 'var(--muted)' }}>Completed</div>
          </div>
          <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#dc2626' }}>{stats.overdue}</div>
            <div style={{ fontSize: '14px', color: 'var(--muted)' }}>Overdue</div>
          </div>
        </div>
      </div>

      {/* Add Task Form */}
      {showAddForm && (
        <div className="card" style={{ marginBottom: '20px', padding: '20px' }}>
          <h3>{editingId ? 'Edit Task' : 'Add New Task'}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            <input placeholder="Task title" value={formData.title} onChange={e=>setFormData({...formData, title: e.target.value})} />
            <select value={formData.category} onChange={e=>setFormData({...formData, category: e.target.value})}>
              {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            <textarea placeholder="Description" value={formData.description} onChange={e=>setFormData({...formData, description: e.target.value})} style={{ gridColumn: '1 / -1', minHeight: '80px' }}></textarea>
            <select value={formData.assignedTo} onChange={e=>setFormData({...formData, assignedTo: e.target.value})}>
              {STAFF.map(staff => <option key={staff} value={staff}>{staff}</option>)}
            </select>
            <select value={formData.priority} onChange={e=>setFormData({...formData, priority: e.target.value})}>
              {PRIORITIES.map(pri => <option key={pri} value={pri}>{pri}</option>)}
            </select>
            <input type="date" value={formData.due} onChange={e=>setFormData({...formData, due: e.target.value})} />
            <input type="number" placeholder="Est. Hours" value={formData.estimatedHours} onChange={e=>setFormData({...formData, estimatedHours: Number(e.target.value)})} />
            <input placeholder="Location" value={formData.location} onChange={e=>setFormData({...formData, location: e.target.value})} style={{ gridColumn: '1 / -1' }} />
          </div>
          <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
            <button onClick={editingId ? saveEdit : add} style={{ background: 'var(--green)', color: '#fff', padding: '10px 16px', border: 'none', borderRadius: '6px' }}>{editingId ? 'Save Changes' : 'Add Task'}</button>
            <button onClick={editingId ? cancelEdit : () => setShowAddForm(false)} style={{ background: '#6b7280', color: '#fff', padding: '10px 16px', border: 'none', borderRadius: '6px' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Filters and Tabs */}
      <div className="card" style={{ marginBottom: '20px', padding: '16px' }}>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['all', 'pending', 'completed', 'overdue'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`tab-btn ${activeTab === tab ? 'active' : ''}`}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} style={{ padding: '6px 8px', borderRadius: '4px', border: '1px solid #d1d5db' }}>
            <option value="all">All Categories</option>
            {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
          <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} style={{ padding: '6px 8px', borderRadius: '4px', border: '1px solid #d1d5db' }}>
            <option value="all">All Priorities</option>
            {PRIORITIES.map(pri => <option key={pri} value={pri}>{pri}</option>)}
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ padding: '6px 8px', borderRadius: '4px', border: '1px solid #d1d5db' }}>
            <option value="due">Sort by Due Date</option>
            <option value="priority">Sort by Priority</option>
            <option value="created">Sort by Created</option>
          </select>
        </div>
      </div>

      {/* Task List */}
      <div style={{ display: 'grid', gap: '12px' }}>
        {filteredItems.map(task => (
          <div key={task.id} className="card" style={{ padding: '16px', border: task.done ? '1px solid #d1fae5' : '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <input type="checkbox" checked={task.done} onChange={() => toggleDone(task.id)} style={{ marginTop: '4px' }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <h4 style={{ margin: 0, textDecoration: task.done ? 'line-through' : 'none' }}>{task.title}</h4>
                  <span className={`badge ${task.priority === 'Critical' ? 'flag' : task.priority === 'High' ? 'flag' : 'badge'}`}>{task.priority}</span>
                  <span className="badge">{task.category}</span>
                </div>
                <p style={{ margin: '4px 0', color: 'var(--muted)', fontSize: '14px' }}>{task.description}</p>
                <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--muted)' }}>
                  <span>👤 {task.assignedTo}</span>
                  <span>📅 {task.due ? `Due ${task.due}` : 'No due date'}</span>
                  <span>⏱️ {task.estimatedHours}h</span>
                  {task.location && <span>📍 {task.location}</span>}
                </div>
              </div>
              <div className="controls">
                <button onClick={() => setModalOpenId(task.id)}>View</button>
                <button onClick={() => startEdit(task)}>Edit</button>
                <button onClick={() => remove(task.id)}>Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>
          <h3>No tasks found</h3>
          <p>No tasks match your current filters. Try adjusting your search criteria.</p>
        </div>
      )}

      {/* Task Detail Modal */}
      {modalOpenId && (() => {
        const task = items.find(t => t.id === modalOpenId)
        if(!task) return null
        return (
          <div className="drawer-overlay" onClick={() => setModalOpenId(null)}>
            <div className="drawer" onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3>{task.title}</h3>
                <div>
                  <button onClick={() => toggleDone(task.id)}>{task.done ? 'Mark Incomplete' : 'Mark Complete'}</button>
                  <button onClick={() => { setModalOpenId(null); startEdit(task); }} style={{ marginLeft: '8px' }}>Edit</button>
                  <button onClick={() => setModalOpenId(null)} style={{ marginLeft: '8px' }}>Close</button>
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px' }}>
                <div>
                  <div style={{ marginBottom: '20px' }}>
                    <h4>Description</h4>
                    <p>{task.description || 'No description provided'}</p>
                  </div>
                  
                  <div>
                    <h4>Notes & Updates</h4>
                    <div style={{ marginBottom: '12px' }}>
                      <input 
                        placeholder="Add a note..." 
                        onKeyPress={e => {
                          if(e.key === 'Enter' && e.target.value.trim()) {
                            addNote(task.id, e.target.value)
                            e.target.value = ''
                          }
                        }}
                        style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                      />
                    </div>
                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                      {(task.notes || []).slice().reverse().map(note => (
                        <div key={note.id} style={{ padding: '8px', background: '#f9fafb', borderRadius: '4px', marginBottom: '8px' }}>
                          <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '4px' }}>
                            {note.author} • {new Date(note.date).toLocaleString()}
                          </div>
                          <div>{note.text}</div>
                        </div>
                      ))}
                      {(!task.notes || task.notes.length === 0) && (
                        <div style={{ color: 'var(--muted)', fontStyle: 'italic' }}>No notes yet</div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="card" style={{ padding: '16px', height: 'fit-content' }}>
                  <h4>Task Details</h4>
                  <div style={{ display: 'grid', gap: '12px', fontSize: '14px' }}>
                    <div><strong>Status:</strong> <span className={task.done ? 'badge green' : 'badge'}>{task.done ? 'Completed' : 'Pending'}</span></div>
                    <div><strong>Priority:</strong> <span className={`badge ${task.priority === 'Critical' || task.priority === 'High' ? 'flag' : ''}`}>{task.priority}</span></div>
                    <div><strong>Category:</strong> {task.category}</div>
                    <div><strong>Assigned to:</strong> {task.assignedTo}</div>
                    <div><strong>Due Date:</strong> {task.due || 'Not set'}</div>
                    <div><strong>Est. Hours:</strong> {task.estimatedHours}</div>
                    <div><strong>Location:</strong> {task.location || 'Not specified'}</div>
                    <div><strong>Created:</strong> {task.createdDate}</div>
                    {task.completedDate && <div><strong>Completed:</strong> {task.completedDate}</div>}
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
