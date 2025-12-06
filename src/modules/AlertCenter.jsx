import React, { useState, useEffect } from 'react'
import { 
  generateAllAlerts,
  getActiveAlerts,
  getAlertsByType,
  getAlertsByPriority,
  getAlertCounts,
  dismissAlert,
  snoozeAlert,
  AlertType,
  AlertPriority
} from '../lib/smartAlerts'

export default function AlertCenter() {
  const [alerts, setAlerts] = useState([])
  const [activeAlerts, setActiveAlerts] = useState([])
  const [filterType, setFilterType] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')
  const [showDismissed, setShowDismissed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [expandedAlert, setExpandedAlert] = useState(null)

  useEffect(() => {
    loadAlerts()
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(loadAlerts, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    applyFilters()
  }, [alerts, filterType, filterPriority, showDismissed])

  const loadAlerts = () => {
    setLoading(true)
    
    // Load all data
    const animals = JSON.parse(localStorage.getItem('cattalytics:animals') || '[]')
    const finances = JSON.parse(localStorage.getItem('cattalytics:finance') || '[]')
    const tasks = JSON.parse(localStorage.getItem('cattalytics:tasks') || '[]')
    const inventory = JSON.parse(localStorage.getItem('cattalytics:inventory') || '[]')
    
    // Generate all alerts
    const allAlerts = generateAllAlerts({
      animals,
      finances,
      tasks,
      inventory
    })
    
    setAlerts(allAlerts)
    setActiveAlerts(getActiveAlerts(allAlerts))
    setLoading(false)
  }

  const applyFilters = () => {
    let filtered = showDismissed ? [...alerts] : [...activeAlerts]
    
    if (filterType !== 'all') {
      filtered = getAlertsByType(filtered, filterType)
    }
    
    if (filterPriority !== 'all') {
      filtered = getAlertsByPriority(filtered, filterPriority)
    }
    
    setActiveAlerts(filtered)
  }

  const handleDismiss = (alertId) => {
    dismissAlert(alertId)
    loadAlerts()
  }

  const handleSnooze = (alertId, hours) => {
    snoozeAlert(alertId, hours)
    loadAlerts()
  }

  const getPriorityColor = (priority) => {
    const colors = {
      urgent: '#dc2626',
      high: '#f59e0b',
      medium: '#3b82f6',
      low: '#10b981'
    }
    return colors[priority] || '#6b7280'
  }

  const getTypeIcon = (type) => {
    const icons = {
      health_critical: '🚨',
      health_warning: '🏥',
      financial: '💰',
      breeding: '🐄',
      feed: '🌾',
      task: '✅',
      weather: '🌤️',
      inventory: '📦',
      milestone: '🎉',
      reminder: '⏰'
    }
    return icons[type] || '📢'
  }

  const counts = getAlertCounts(activeAlerts)

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📢</div>
        <div>Loading alerts...</div>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: '700', color: '#111' }}>
          📢 Alert Center
        </h1>
        <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
          Real-time notifications and alerts for your farm
        </p>
      </div>

      {/* Alert Summary */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
        gap: '12px',
        marginBottom: '24px'
      }}>
        <div style={{
          background: '#dc2626',
          color: 'white',
          padding: '16px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '11px', opacity: 0.9, marginBottom: '4px' }}>URGENT</div>
          <div style={{ fontSize: '28px', fontWeight: '700' }}>{counts.urgent}</div>
        </div>
        
        <div style={{
          background: '#f59e0b',
          color: 'white',
          padding: '16px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '11px', opacity: 0.9, marginBottom: '4px' }}>HIGH</div>
          <div style={{ fontSize: '28px', fontWeight: '700' }}>{counts.high}</div>
        </div>
        
        <div style={{
          background: '#3b82f6',
          color: 'white',
          padding: '16px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '11px', opacity: 0.9, marginBottom: '4px' }}>MEDIUM</div>
          <div style={{ fontSize: '28px', fontWeight: '700' }}>{counts.medium}</div>
        </div>
        
        <div style={{
          background: '#10b981',
          color: 'white',
          padding: '16px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '11px', opacity: 0.9, marginBottom: '4px' }}>LOW</div>
          <div style={{ fontSize: '28px', fontWeight: '700' }}>{counts.low}</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ 
        background: 'white', 
        padding: '16px', 
        borderRadius: '8px', 
        marginBottom: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        display: 'flex',
        gap: '12px',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', fontWeight: '600', color: '#555' }}>Type:</span>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{
              padding: '6px 12px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            <option value="all">All Types</option>
            <option value={AlertType.HEALTH_CRITICAL}>🚨 Critical Health</option>
            <option value={AlertType.HEALTH_WARNING}>🏥 Health Warning</option>
            <option value={AlertType.FINANCIAL}>💰 Financial</option>
            <option value={AlertType.BREEDING}>🐄 Breeding</option>
            <option value={AlertType.FEED}>🌾 Feed</option>
            <option value={AlertType.TASK}>✅ Tasks</option>
            <option value={AlertType.MILESTONE}>🎉 Milestones</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', fontWeight: '600', color: '#555' }}>Priority:</span>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            style={{
              padding: '6px 12px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            <option value="all">All Priorities</option>
            <option value={AlertPriority.URGENT}>🔴 Urgent</option>
            <option value={AlertPriority.HIGH}>🟠 High</option>
            <option value={AlertPriority.MEDIUM}>🔵 Medium</option>
            <option value={AlertPriority.LOW}>🟢 Low</option>
          </select>
        </div>

        <label style={{ display: 'flex', gap: '8px', alignItems: 'center', cursor: 'pointer', fontSize: '14px' }}>
          <input
            type="checkbox"
            checked={showDismissed}
            onChange={(e) => setShowDismissed(e.target.checked)}
            style={{ cursor: 'pointer' }}
          />
          Show dismissed
        </label>

        <button
          onClick={loadAlerts}
          style={{
            marginLeft: 'auto',
            padding: '6px 16px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          🔄 Refresh
        </button>
      </div>

      {/* Alerts List */}
      {activeAlerts.length === 0 ? (
        <div style={{
          background: 'white',
          padding: '60px 20px',
          borderRadius: '12px',
          textAlign: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>✨</div>
          <h3 style={{ margin: '0 0 8px 0', color: '#111' }}>All Clear!</h3>
          <p style={{ margin: 0, color: '#666' }}>
            No active alerts at the moment
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {activeAlerts.map(alert => (
            <div
              key={alert.id}
              style={{
                background: 'white',
                borderRadius: '12px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                overflow: 'hidden',
                borderLeft: `4px solid ${getPriorityColor(alert.priority)}`,
                transition: 'all 0.2s'
              }}
            >
              {/* Alert Header */}
              <div
                onClick={() => setExpandedAlert(expandedAlert === alert.id ? null : alert.id)}
                style={{
                  padding: '16px 20px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <div style={{ fontSize: '32px' }}>
                  {getTypeIcon(alert.type)}
                </div>
                
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#111' }}>
                      {alert.title}
                    </h3>
                    <span style={{
                      padding: '2px 8px',
                      background: getPriorityColor(alert.priority),
                      color: 'white',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: '600',
                      textTransform: 'uppercase'
                    }}>
                      {alert.priority}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                    {alert.message}
                  </p>
                </div>

                <div style={{ fontSize: '20px', color: '#999' }}>
                  {expandedAlert === alert.id ? '▼' : '▶'}
                </div>
              </div>

              {/* Expanded Details */}
              {expandedAlert === alert.id && (
                <div style={{
                  padding: '0 20px 20px 20px',
                  borderTop: '1px solid #f0f0f0'
                }}>
                  <div style={{ 
                    background: '#f9fafb', 
                    padding: '16px', 
                    borderRadius: '8px',
                    marginTop: '16px',
                    marginBottom: '16px'
                  }}>
                    <div style={{ marginBottom: '8px' }}>
                      <strong style={{ fontSize: '13px', color: '#555' }}>Recommended Action:</strong>
                      <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#333' }}>
                        {alert.action}
                      </p>
                    </div>

                    {alert.dueDate && (
                      <div>
                        <strong style={{ fontSize: '13px', color: '#555' }}>Due Date:</strong>
                        <span style={{ marginLeft: '8px', fontSize: '14px', color: '#333' }}>
                          {new Date(alert.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div style={{ 
                    display: 'flex', 
                    gap: '8px',
                    flexWrap: 'wrap'
                  }}>
                    <button
                      onClick={() => handleDismiss(alert.id)}
                      style={{
                        padding: '8px 16px',
                        background: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}
                    >
                      ✓ Dismiss
                    </button>
                    
                    <button
                      onClick={() => handleSnooze(alert.id, 1)}
                      style={{
                        padding: '8px 16px',
                        background: '#6b7280',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}
                    >
                      ⏰ Snooze 1h
                    </button>
                    
                    <button
                      onClick={() => handleSnooze(alert.id, 24)}
                      style={{
                        padding: '8px 16px',
                        background: '#6b7280',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}
                    >
                      ⏰ Snooze 24h
                    </button>

                    {alert.animalId && (
                      <button
                        onClick={() => window.location.hash = `#/animals/${alert.animalId}`}
                        style={{
                          padding: '8px 16px',
                          background: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: '500'
                        }}
                      >
                        👁️ View Animal
                      </button>
                    )}

                    {alert.taskId && (
                      <button
                        onClick={() => window.location.hash = `#/tasks/${alert.taskId}`}
                        style={{
                          padding: '8px 16px',
                          background: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: '500'
                        }}
                      >
                        👁️ View Task
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
