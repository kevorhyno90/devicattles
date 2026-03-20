import React, { useState, useEffect } from 'react'
import { 
  getAllSmartAlerts, 
  getAlertsSummary, 
  getSmartRecommendations,
  PRIORITY,
  CATEGORY 
} from '../lib/smartAlerts'

/**
 * Smart Alerts Dashboard Component
 * Displays proactive alerts and recommendations
 */
export default function SmartAlerts({ onNavigate }) {
  const [alerts, setAlerts] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [summary, setSummary] = useState(null)
  const [filter, setFilter] = useState('all') // all, critical, high, medium, low
  const [categoryFilter, setCategoryFilter] = useState('all')

  useEffect(() => {
    loadAlerts()
    
    // Refresh every 5 minutes
    const interval = setInterval(loadAlerts, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const loadAlerts = () => {
    const allAlerts = getAllSmartAlerts()
    const alertSummary = getAlertsSummary()
    const recs = getSmartRecommendations()
    
    setAlerts(allAlerts)
    setSummary(alertSummary)
    setRecommendations(recs)
  }

  // Filter alerts
  const filteredAlerts = alerts.filter(alert => {
    const priorityMatch = filter === 'all' || alert.priority === filter
    const categoryMatch = categoryFilter === 'all' || alert.category === categoryFilter
    return priorityMatch && categoryMatch
  })

  // Priority styles
  const getPriorityStyle = (priority) => {
    switch (priority) {
      case PRIORITY.CRITICAL:
        return { bg: '#fee2e2', border: '#dc2626', color: '#991b1b', icon: '🚨' }
      case PRIORITY.HIGH:
        return { bg: '#fed7aa', border: '#ea580c', color: '#9a3412', icon: '⚠️' }
      case PRIORITY.MEDIUM:
        return { bg: '#fef3c7', border: '#f59e0b', color: '#92400e', icon: '⚡' }
      case PRIORITY.LOW:
        return { bg: '#dbeafe', border: '#3b82f6', color: '#1e40af', icon: 'ℹ️' }
      default:
        return { bg: '#f3f4f6', border: '#9ca3af', color: 'var(--text-secondary)', icon: '📌' }
    }
  }

  // Category icons
  const getCategoryIcon = (category) => {
    const icons = {
      [CATEGORY.HEALTH]: '🏥',
      [CATEGORY.BREEDING]: '🐄',
      [CATEGORY.FEEDING]: '🌾',
      [CATEGORY.HARVEST]: '🚜',
      [CATEGORY.INVENTORY]: '📦',
      [CATEGORY.FINANCIAL]: '💰',
      [CATEGORY.MAINTENANCE]: '🔧',
      [CATEGORY.WEATHER]: '🌤️'
    }
    return icons[category] || '📋'
  }

  const getCategoryLabel = (category) => {
    const labels = {
      [CATEGORY.HEALTH]: 'Health',
      [CATEGORY.BREEDING]: 'Breeding',
      [CATEGORY.FEEDING]: 'Feeding',
      [CATEGORY.HARVEST]: 'Harvest',
      [CATEGORY.INVENTORY]: 'Inventory',
      [CATEGORY.FINANCIAL]: 'Financial',
      [CATEGORY.MAINTENANCE]: 'Maintenance',
      [CATEGORY.WEATHER]: 'Weather'
    }
    return labels[category] || 'General'
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px', color: 'var(--text-primary)' }}>
      <h1 style={{ marginBottom: '8px' }}>🔔 Smart Alerts & Recommendations</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
        Proactive insights to help you manage your farm efficiently
      </p>

      {/* Summary Cards */}
      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div className="card" style={{ padding: '16px', background: '#fee2e2', border: '2px solid #dc2626' }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#991b1b' }}>{summary.critical}</div>
            <div style={{ color: '#991b1b', fontWeight: '600' }}>🚨 Critical</div>
          </div>
          
          <div className="card" style={{ padding: '16px', background: '#fed7aa', border: '2px solid #ea580c' }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#9a3412' }}>{summary.high}</div>
            <div style={{ color: '#9a3412', fontWeight: '600' }}>⚠️ High Priority</div>
          </div>
          
          <div className="card" style={{ padding: '16px', background: '#fef3c7', border: '2px solid #f59e0b' }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#92400e' }}>{summary.medium}</div>
            <div style={{ color: '#92400e', fontWeight: '600' }}>⚡ Medium</div>
          </div>
          
          <div className="card" style={{ padding: '16px', background: '#dbeafe', border: '2px solid #3b82f6' }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#1e40af' }}>{summary.low}</div>
            <div style={{ color: '#1e40af', fontWeight: '600' }}>ℹ️ Informational</div>
          </div>

          <div className="card" style={{ padding: '16px', background: '#f0fdf4', border: '2px solid #059669' }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#065f46' }}>{summary.total}</div>
            <div style={{ color: '#065f46', fontWeight: '600' }}>📋 Total Alerts</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card" style={{ padding: '16px', marginBottom: '20px' }}>
        <div style={{ marginBottom: '12px', fontWeight: '600' }}>Filter Alerts:</div>
        
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
          <button
            onClick={() => setFilter('all')}
            style={{
              padding: '8px 16px',
              background: filter === 'all' ? '#059669' : '#f3f4f6',
              color: filter === 'all' ? '#fff' : '#374151',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            All
          </button>
          <button
            onClick={() => setFilter(PRIORITY.CRITICAL)}
            style={{
              padding: '8px 16px',
              background: filter === PRIORITY.CRITICAL ? '#dc2626' : '#f3f4f6',
              color: filter === PRIORITY.CRITICAL ? '#fff' : '#374151',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            🚨 Critical
          </button>
          <button
            onClick={() => setFilter(PRIORITY.HIGH)}
            style={{
              padding: '8px 16px',
              background: filter === PRIORITY.HIGH ? '#ea580c' : '#f3f4f6',
              color: filter === PRIORITY.HIGH ? '#fff' : '#374151',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            ⚠️ High
          </button>
          <button
            onClick={() => setFilter(PRIORITY.MEDIUM)}
            style={{
              padding: '8px 16px',
              background: filter === PRIORITY.MEDIUM ? '#f59e0b' : '#f3f4f6',
              color: filter === PRIORITY.MEDIUM ? '#fff' : '#374151',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            ⚡ Medium
          </button>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid var(--border-primary)',
              background: 'var(--bg-elevated)',
              color: 'var(--text-primary)',
              cursor: 'pointer'
            }}
          >
            <option value="all">All Categories</option>
            <option value={CATEGORY.HEALTH}>🏥 Health</option>
            <option value={CATEGORY.BREEDING}>🐄 Breeding</option>
            <option value={CATEGORY.FEEDING}>🌾 Feeding</option>
            <option value={CATEGORY.HARVEST}>🚜 Harvest</option>
            <option value={CATEGORY.INVENTORY}>📦 Inventory</option>
            <option value={CATEGORY.FINANCIAL}>💰 Financial</option>
            <option value={CATEGORY.MAINTENANCE}>🔧 Maintenance</option>
          </select>

          <button
            onClick={loadAlerts}
            style={{
              padding: '8px 16px',
              background: '#3b82f6',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Alerts List */}
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ marginBottom: '16px' }}>
          {filteredAlerts.length} Alert{filteredAlerts.length !== 1 ? 's' : ''}
        </h3>
        
        {filteredAlerts.length === 0 ? (
          <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
            <div style={{ fontSize: '18px', fontWeight: '600', color: '#059669', marginBottom: '8px' }}>
              All Clear!
            </div>
            <div style={{ color: 'var(--text-secondary)' }}>
              No alerts match your filter criteria. Your farm is running smoothly!
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredAlerts.map(alert => {
              const style = getPriorityStyle(alert.priority)
              return (
                <div
                  key={alert.id}
                  className="card"
                  style={{
                    padding: '16px',
                    background: style.bg,
                    border: `2px solid ${style.border}`
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ fontSize: '24px' }}>
                      {getCategoryIcon(alert.category)}
                    </div>
                    
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '18px' }}>{style.icon}</span>
                        <h4 style={{ margin: 0, color: style.color }}>{alert.title}</h4>
                        <span
                          style={{
                            marginLeft: 'auto',
                            borderRadius: 999,
                            padding: '3px 8px',
                            fontSize: '12px',
                            fontWeight: 700,
                            border: `1px solid ${style.border}`,
                            background: 'rgba(255, 255, 255, 0.55)',
                            color: style.color
                          }}
                        >
                          {getCategoryLabel(alert.category)}
                        </span>
                      </div>
                      
                      <p style={{ margin: '8px 0', color: style.color }}>
                        {alert.message}
                      </p>
                      
                      {alert.actionable && (
                        <button
                          onClick={() => {
                            // Navigate to relevant module based on alert type
                            if (alert.animalId) onNavigate?.('animals')
                            else if (alert.cropId) onNavigate?.('crops')
                            else if (alert.taskId) onNavigate?.('tasks')
                            else if (alert.itemId) onNavigate?.('inventory')
                          }}
                          style={{
                            padding: '6px 12px',
                            background: style.border,
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: '500',
                            fontSize: '13px'
                          }}
                        >
                          {alert.action} →
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div>
          <h3 style={{ marginBottom: '16px' }}>💡 Smart Recommendations</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {recommendations.map(rec => (
              <div
                key={rec.id}
                className="card"
                style={{
                  padding: '16px',
                  background: '#f0f9ff',
                  border: '2px solid #3b82f6'
                }}
              >
                <h4 style={{ margin: '0 0 8px 0', color: '#1e40af' }}>{rec.title}</h4>
                <p style={{ margin: '0 0 8px 0', color: '#1e3a8a' }}>{rec.message}</p>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  <strong>Benefit:</strong> {rec.benefit}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
