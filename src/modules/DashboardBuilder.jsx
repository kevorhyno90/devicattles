import React, { useState, useEffect } from 'react'

export default function DashboardBuilder() {
  const [widgets, setWidgets] = useState([])
  const [availableWidgets, setAvailableWidgets] = useState([])
  const [layout, setLayout] = useState('grid') // grid or list
  const [editMode, setEditMode] = useState(false)
  const [draggedWidget, setDraggedWidget] = useState(null)

  useEffect(() => {
    loadDashboard()
    loadAvailableWidgets()
  }, [])

  const loadDashboard = () => {
    const saved = localStorage.getItem('cattalytics:custom-dashboard')
    if (saved) {
      setWidgets(JSON.parse(saved))
    } else {
      // Default widgets
      setWidgets([
        { id: 'quick-stats', type: 'stats', title: 'Quick Stats', position: 0, size: 'large' },
        { id: 'recent-animals', type: 'animals', title: 'Recent Animals', position: 1, size: 'medium' },
        { id: 'pending-tasks', type: 'tasks', title: 'Pending Tasks', position: 2, size: 'medium' },
        { id: 'finance-summary', type: 'finance', title: 'Finance Summary', position: 3, size: 'small' }
      ])
    }
  }

  const loadAvailableWidgets = () => {
    setAvailableWidgets([
      { type: 'stats', name: '📊 Quick Statistics', description: 'Farm overview numbers' },
      { type: 'animals', name: '🐄 Animal List', description: 'Recent or filtered animals' },
      { type: 'tasks', name: '✅ Task List', description: 'Pending or upcoming tasks' },
      { type: 'finance', name: '💰 Finance Summary', description: 'Income and expenses' },
      { type: 'alerts', name: '🔔 Alert Summary', description: 'Critical notifications' },
      { type: 'weather', name: '🌤️ Weather Widget', description: 'Current weather conditions' },
      { type: 'calendar', name: '📅 Calendar View', description: 'Upcoming events' },
      { type: 'charts', name: '📈 Analytics Charts', description: 'Performance graphs' },
      { type: 'inventory', name: '📦 Inventory Status', description: 'Stock levels' },
      { type: 'health', name: '🏥 Health Alerts', description: 'Animal health issues' },
      { type: 'breeding', name: '🐄 Breeding Status', description: 'Active breeding records' },
      { type: 'milk', name: '🥛 Milk Production', description: 'Daily milk yields' },
      { type: 'crops', name: '🌾 Crop Status', description: 'Active crops' },
      { type: 'notes', name: '📝 Quick Notes', description: 'Editable note widget' }
    ])
  }

  const saveDashboard = (newWidgets) => {
    localStorage.setItem('cattalytics:custom-dashboard', JSON.stringify(newWidgets))
    setWidgets(newWidgets)
  }

  const addWidget = (widgetType) => {
    const newWidget = {
      id: `${widgetType}-${Date.now()}`,
      type: widgetType,
      title: availableWidgets.find(w => w.type === widgetType)?.name || widgetType,
      position: widgets.length,
      size: 'medium'
    }
    const updated = [...widgets, newWidget]
    saveDashboard(updated)
  }

  const removeWidget = (widgetId) => {
    const updated = widgets.filter(w => w.id !== widgetId)
    saveDashboard(updated)
  }

  const moveWidget = (widgetId, direction) => {
    const index = widgets.findIndex(w => w.id === widgetId)
    if (index === -1) return
    
    const newIndex = direction === 'up' ? Math.max(0, index - 1) : Math.min(widgets.length - 1, index + 1)
    const updated = [...widgets]
    const [moved] = updated.splice(index, 1)
    updated.splice(newIndex, 0, moved)
    
    // Update positions
    updated.forEach((w, i) => w.position = i)
    saveDashboard(updated)
  }

  const changeWidgetSize = (widgetId, size) => {
    const updated = widgets.map(w => 
      w.id === widgetId ? { ...w, size } : w
    )
    saveDashboard(updated)
  }

  const resetDashboard = () => {
    if (confirm('Reset dashboard to default layout?')) {
      localStorage.removeItem('cattalytics:custom-dashboard')
      loadDashboard()
    }
  }

  const renderWidget = (widget) => {
    const sizeClasses = {
      small: { gridColumn: 'span 1', minHeight: '200px' },
      medium: { gridColumn: 'span 2', minHeight: '300px' },
      large: { gridColumn: 'span 3', minHeight: '400px' },
      full: { gridColumn: 'span 4', minHeight: '500px' }
    }

    return (
      <div
        key={widget.id}
        style={{
          ...sizeClasses[widget.size],
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          padding: '20px',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Widget Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '16px',
          paddingBottom: '12px',
          borderBottom: '2px solid #f0f0f0'
        }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#111' }}>
            {widget.title}
          </h3>
          
          {editMode && (
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                onClick={() => moveWidget(widget.id, 'up')}
                style={{
                  padding: '4px 8px',
                  background: '#f3f4f6',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
                title="Move Up"
              >
                ↑
              </button>
              <button
                onClick={() => moveWidget(widget.id, 'down')}
                style={{
                  padding: '4px 8px',
                  background: '#f3f4f6',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
                title="Move Down"
              >
                ↓
              </button>
              <select
                value={widget.size}
                onChange={(e) => changeWidgetSize(widget.id, e.target.value)}
                style={{
                  padding: '4px 8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '11px',
                  cursor: 'pointer'
                }}
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
                <option value="full">Full</option>
              </select>
              <button
                onClick={() => removeWidget(widget.id)}
                style={{
                  padding: '4px 8px',
                  background: '#fee',
                  color: '#c00',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
                title="Remove"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Widget Content */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {renderWidgetContent(widget)}
        </div>
      </div>
    )
  }

  const renderWidgetContent = (widget) => {
    const animals = JSON.parse(localStorage.getItem('cattalytics:animals') || '[]')
    const tasks = JSON.parse(localStorage.getItem('cattalytics:tasks') || '[]')
    const transactions = JSON.parse(localStorage.getItem('cattalytics:finance') || '[]')
    const inventory = JSON.parse(localStorage.getItem('cattalytics:inventory') || '[]')

    switch (widget.type) {
      case 'stats':
        return (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            <StatCard label="Animals" value={animals.length} icon="🐄" color="#10b981" />
            <StatCard label="Active Tasks" value={tasks.filter(t => t.status !== 'Completed').length} icon="✅" color="#3b82f6" />
            <StatCard label="Inventory Items" value={inventory.length} icon="📦" color="#f59e0b" />
            <StatCard label="This Month" value={`$${transactions.filter(t => isThisMonth(t.date)).reduce((sum, t) => sum + (t.type === 'Income' ? t.amount : -t.amount), 0).toFixed(2)}`} icon="💰" color="#8b5cf6" />
          </div>
        )

      case 'animals':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {animals.slice(0, 5).map(animal => (
              <div key={animal.id} style={{ 
                padding: '12px', 
                background: '#f9fafb', 
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontWeight: '600', fontSize: '14px' }}>{animal.name || animal.tagNumber}</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>{animal.breed} • {animal.category}</div>
                </div>
                <div style={{ 
                  padding: '4px 12px', 
                  background: animal.status === 'Healthy' ? '#d1fae5' : '#fee2e2',
                  color: animal.status === 'Healthy' ? '#065f46' : '#991b1b',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: '600'
                }}>
                  {animal.status}
                </div>
              </div>
            ))}
            {animals.length === 0 && (
              <div style={{ textAlign: 'center', color: '#999', padding: '40px 20px' }}>
                No animals added yet
              </div>
            )}
          </div>
        )

      case 'tasks':
        const pendingTasks = tasks.filter(t => t.status !== 'Completed').slice(0, 5)
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {pendingTasks.map(task => (
              <div key={task.id} style={{ 
                padding: '12px', 
                background: '#f9fafb', 
                borderRadius: '8px',
                borderLeft: `4px solid ${task.priority === 'High' ? '#ef4444' : task.priority === 'Medium' ? '#f59e0b' : '#10b981'}`
              }}>
                <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '4px' }}>{task.title}</div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  {task.dueDate && `Due: ${new Date(task.dueDate).toLocaleDateString()}`}
                </div>
              </div>
            ))}
            {pendingTasks.length === 0 && (
              <div style={{ textAlign: 'center', color: '#999', padding: '40px 20px' }}>
                🎉 All tasks completed!
              </div>
            )}
          </div>
        )

      case 'finance':
        const thisMonth = transactions.filter(t => isThisMonth(t.date))
        const income = thisMonth.filter(t => t.type === 'Income').reduce((sum, t) => sum + t.amount, 0)
        const expenses = thisMonth.filter(t => t.type === 'Expense').reduce((sum, t) => sum + t.amount, 0)
        const profit = income - expenses
        
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#ecfdf5', borderRadius: '8px' }}>
              <span style={{ color: '#065f46', fontWeight: '600' }}>Income</span>
              <span style={{ color: '#065f46', fontSize: '18px', fontWeight: '700' }}>${income.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#fef2f2', borderRadius: '8px' }}>
              <span style={{ color: '#991b1b', fontWeight: '600' }}>Expenses</span>
              <span style={{ color: '#991b1b', fontSize: '18px', fontWeight: '700' }}>${expenses.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', background: profit >= 0 ? '#dbeafe' : '#fee2e2', borderRadius: '8px' }}>
              <span style={{ color: profit >= 0 ? '#1e40af' : '#991b1b', fontWeight: '700' }}>Net Profit</span>
              <span style={{ color: profit >= 0 ? '#1e40af' : '#991b1b', fontSize: '20px', fontWeight: '800' }}>
                {profit >= 0 ? '+' : '-'}${Math.abs(profit).toFixed(2)}
              </span>
            </div>
          </div>
        )

      case 'inventory':
        const lowStock = inventory.filter(item => item.quantity < item.reorderLevel)
        return (
          <div>
            {lowStock.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ color: '#dc2626', fontWeight: '600', marginBottom: '8px' }}>
                  ⚠️ {lowStock.length} items low on stock
                </div>
                {lowStock.slice(0, 5).map(item => (
                  <div key={item.id} style={{ 
                    padding: '12px', 
                    background: '#fef2f2', 
                    borderRadius: '8px',
                    borderLeft: '4px solid #dc2626'
                  }}>
                    <div style={{ fontWeight: '600', fontSize: '14px' }}>{item.name}</div>
                    <div style={{ fontSize: '12px', color: '#991b1b' }}>
                      Stock: {item.quantity} {item.unit} (Reorder at: {item.reorderLevel})
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: '#10b981', padding: '40px 20px' }}>
                ✅ All inventory items sufficiently stocked
              </div>
            )}
          </div>
        )

      case 'notes':
        const [note, setNote] = useState(localStorage.getItem(`cattalytics:note-${widget.id}`) || '')
        return (
          <textarea
            value={note}
            onChange={(e) => {
              setNote(e.target.value)
              localStorage.setItem(`cattalytics:note-${widget.id}`, e.target.value)
            }}
            placeholder="Type your notes here..."
            style={{
              width: '100%',
              height: '100%',
              minHeight: '150px',
              padding: '12px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '14px',
              fontFamily: 'inherit',
              resize: 'vertical'
            }}
          />
        )

      default:
        return (
          <div style={{ textAlign: 'center', color: '#999', padding: '40px 20px' }}>
            Widget content coming soon
          </div>
        )
    }
  }

  const StatCard = ({ label, value, icon, color }) => (
    <div style={{
      padding: '16px',
      background: 'linear-gradient(135deg, ' + color + '15 0%, ' + color + '05 100%)',
      borderRadius: '8px',
      border: `2px solid ${color}20`
    }}>
      <div style={{ fontSize: '24px', marginBottom: '8px' }}>{icon}</div>
      <div style={{ fontSize: '24px', fontWeight: '700', color: '#111', marginBottom: '4px' }}>
        {value}
      </div>
      <div style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {label}
      </div>
    </div>
  )

  const isThisMonth = (dateStr) => {
    if (!dateStr) return false
    const date = new Date(dateStr)
    const now = new Date()
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1600px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: '700', color: '#111' }}>
            📊 Dashboard Builder
          </h1>
          <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
            Customize your farm management dashboard
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setEditMode(!editMode)}
            style={{
              padding: '10px 20px',
              background: editMode ? '#10b981' : '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            {editMode ? '✓ Done Editing' : '✏️ Edit Mode'}
          </button>
          <button
            onClick={resetDashboard}
            style={{
              padding: '10px 20px',
              background: '#f3f4f6',
              color: '#374151',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            🔄 Reset
          </button>
        </div>
      </div>

      {/* Add Widget Section */}
      {editMode && (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          padding: '20px',
          marginBottom: '24px'
        }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>
            Add Widgets
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
            {availableWidgets.map(widget => (
              <button
                key={widget.type}
                onClick={() => addWidget(widget.type)}
                style={{
                  padding: '12px',
                  background: '#f9fafb',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#eff6ff'
                  e.target.style.borderColor = '#3b82f6'
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#f9fafb'
                  e.target.style.borderColor = '#e5e7eb'
                }}
              >
                <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '4px' }}>
                  {widget.name}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  {widget.description}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Dashboard Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '20px'
      }}>
        {widgets.map(widget => renderWidget(widget))}
      </div>

      {widgets.length === 0 && (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          padding: '60px 20px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>📊</div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '600' }}>
            Empty Dashboard
          </h3>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            Enable edit mode to add widgets to your custom dashboard
          </p>
          <button
            onClick={() => setEditMode(true)}
            style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            Get Started
          </button>
        </div>
      )}
    </div>
  )
}
