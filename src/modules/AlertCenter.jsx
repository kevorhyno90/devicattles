import React, { useState, useEffect } from 'react'
import { exportToCSV, exportToJSON } from '../lib/exportImport'
import useUIStore from '../stores/uiStore'
import { 
  getAllSmartAlerts,
  getAlertsSummary,
  PRIORITY,
  CATEGORY
} from '../lib/smartAlerts'

export default function AlertCenter() {
  const [alerts, setAlerts] = useState([])
  const [filterType, setFilterType] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')
  const [showDismissed, setShowDismissed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [expandedAlert, setExpandedAlert] = useState(null)
  const [search, setSearch] = useState('')
  const [selectedAlerts, setSelectedAlerts] = useState([])
  const [notifEmail, setNotifEmail] = useState('')
  const [notifPush, setNotifPush] = useState(false)
  const showSuccess = useUIStore((state) => state.showSuccess)
  const showError = useUIStore((state) => state.showError)

  useEffect(() => {
    loadAlerts()
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(loadAlerts, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [showDismissed])

  const loadAlerts = () => {
    setLoading(true)
    
    // Get all smart alerts
    const allAlerts = getAllSmartAlerts()
    console.log('AlertCenter: getAllSmartAlerts returned', allAlerts.length, 'alerts')
    
    // Load dismissed alerts
    const dismissed = JSON.parse(localStorage.getItem('cattalytics:dismissed-alerts') || '[]')
    
    // Filter out dismissed unless showDismissed is true
    const filtered = showDismissed 
      ? allAlerts 
      : allAlerts.filter(a => !dismissed.includes(a.id))
    
    console.log('AlertCenter: After filtering dismissed, showing', filtered.length, 'alerts')
    setAlerts(filtered)
    setLoading(false)
  }

  const dismissAlert = (alertId) => {
    const dismissed = JSON.parse(localStorage.getItem('cattalytics:dismissed-alerts') || '[]')
    if (!dismissed.includes(alertId)) {
      dismissed.push(alertId)
      localStorage.setItem('cattalytics:dismissed-alerts', JSON.stringify(dismissed))
    }
    loadAlerts()
  }

  const clearDismissed = () => {
    localStorage.setItem('cattalytics:dismissed-alerts', '[]')
    loadAlerts()
  }

  const getFilteredAlerts = () => {
    let filtered = [...alerts]
    if (filterType !== 'all') {
      filtered = filtered.filter(a => a.category === filterType)
    }
    if (filterPriority !== 'all') {
      filtered = filtered.filter(a => a.priority === filterPriority)
    }
    if (search.trim()) {
      const s = search.trim().toLowerCase();
      filtered = filtered.filter(a =>
        (a.title && a.title.toLowerCase().includes(s)) ||
        (a.message && a.message.toLowerCase().includes(s))
      );
    }
    return filtered
  }

  const getPriorityColor = (priority) => {
    const colors = {
      critical: '#dc2626',
      high: '#f59e0b',
      medium: '#3b82f6',
      low: '#10b981'
    }
    return colors[priority] || '#6b7280'
  }

  const getTypeIcon = (category) => {
    const icons = {
      health: '🏥',
      breeding: '🐄',
      feeding: '🌾',
      harvest: '🌾',
      inventory: '📦',
      financial: '💰',
      maintenance: '🔧',
      weather: '🌤️'
    }
    return icons[category] || '🔔'
  }

  const filteredAlerts = getFilteredAlerts()
  const activeAlerts = filteredAlerts
  const summary = getAlertsSummary()
  const criticalCount = alerts.filter(a => a.priority === 'critical').length
  const highCount = alerts.filter(a => a.priority === 'high').length

  console.log('AlertCenter: Rendering with', alerts.length, 'total alerts,', filteredAlerts.length, 'filtered')

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
        <div>Loading alerts...</div>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: '700', color: '#111' }}>
          🔔 Alert Center
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
          <div style={{ fontSize: '28px', fontWeight: '700' }}>{criticalCount}</div>
        </div>
        
        <div style={{
          background: '#f59e0b',
          color: 'white',
          padding: '16px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '11px', opacity: 0.9, marginBottom: '4px' }}>HIGH</div>
          <div style={{ fontSize: '28px', fontWeight: '700' }}>{highCount}</div>
        </div>
        
        <div style={{
          background: '#3b82f6',
          color: 'white',
          padding: '16px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '11px', opacity: 0.9, marginBottom: '4px' }}>TOTAL</div>
          <div style={{ fontSize: '28px', fontWeight: '700' }}>{alerts.length}</div>
        </div>
        
        <div style={{
          background: '#10b981',
          color: 'white',
          padding: '16px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '11px', opacity: 0.9, marginBottom: '4px' }}>ACTIVE</div>
          <div style={{ fontSize: '28px', fontWeight: '700' }}>{filteredAlerts.length}</div>
        </div>
      </div>

      {/* Filters, Search, Export, Notification Settings, Bulk Actions */}
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
                {/* Search */}
                <input
                  type="text"
                  placeholder="Search alerts..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{
                    padding: '6px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px',
                    minWidth: 180
                  }}
                />

                {/* Export */}
                <button
                  onClick={() => {
                    if (!filteredAlerts.length) { showError('No alerts to export'); return; }
                    exportToCSV(filteredAlerts, 'alerts.csv');
                    showSuccess('Exported CSV!');
                  }}
                  style={{
                    padding: '6px 12px',
                    background: '#0ea5e9',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  ⬇️ Export CSV
                </button>
                <button
                  onClick={() => {
                    if (!filteredAlerts.length) { showError('No alerts to export'); return; }
                    exportToJSON(filteredAlerts, 'alerts.json');
                    showSuccess('Exported JSON!');
                  }}
                  style={{
                    padding: '6px 12px',
                    background: '#059669',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  ⬇️ Export JSON
                </button>

                {/* Notification Settings */}
                <input
                  type="email"
                  placeholder="Notification email"
                  value={notifEmail}
                  onChange={e => setNotifEmail(e.target.value)}
                  style={{ padding: '6px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', minWidth: 180 }}
                />
                <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <input type="checkbox" checked={notifPush} onChange={e => setNotifPush(e.target.checked)} /> Push Notifications
                </label>
                <button
                  onClick={() => {
                    if (!notifEmail && !notifPush) { showError('Set at least one notification method'); return; }
                    showSuccess('Notification settings saved! (Backend integration needed)');
                  }}
                  style={{ padding: '6px 12px', background: '#6366f1', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '500', cursor: 'pointer' }}
                >
                  💾 Save Notification Settings
                </button>

                {/* Bulk Actions */}
                <button
                  onClick={() => {
                    if (!filteredAlerts.length) { showError('No alerts to dismiss'); return; }
                    filteredAlerts.forEach(a => dismissAlert(a.id));
                    showSuccess('All filtered alerts dismissed!');
                  }}
                  style={{ padding: '6px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '500', cursor: 'pointer' }}
                >
                  ✓ Dismiss All Filtered
                </button>
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
            <option value="health">🏥 Health</option>
            <option value="breeding">🐄 Breeding</option>
            <option value="feeding">🌾 Feeding</option>
            <option value="harvest">🌾 Harvest</option>
            <option value="inventory">📦 Inventory</option>
            <option value="financial">💰 Financial</option>
            <option value="maintenance">🔧 Maintenance</option>
            <option value="weather">🌤️ Weather</option>
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
            <option value="critical">🔴 Critical</option>
            <option value="high">🟠 High</option>
            <option value="medium">🔵 Medium</option>
            <option value="low">🟢 Low</option>
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
      {filteredAlerts.length === 0 ? (
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
            {alerts.length === 0 
              ? 'No alerts generated yet. Add some animals, tasks, or inventory to generate smart alerts.'
              : 'No active alerts match your current filters'
            }
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
