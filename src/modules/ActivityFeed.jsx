import React, { useState, useEffect } from 'react'
import { exportToCSV, exportToJSON } from '../lib/exportImport'
import { useUIStore } from '../stores/uiStore'
import { getActivities, getActivityStats } from '../lib/activityLogger'

export default function ActivityFeed() {
  const [activities, setActivities] = useState([])
  const [filter, setFilter] = useState('all') // all, animal, task, finance, inventory, crop, health
  const [timeRange, setTimeRange] = useState('all') // today, week, month, all
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [displayCount, setDisplayCount] = useState(20)
  const [search, setSearch] = useState('')
  const showSuccess = useUIStore((state) => state.showSuccess)
  const showError = useUIStore((state) => state.showError)

  useEffect(() => {
    loadActivities()
    
    // Listen for real-time activity updates
    const handleActivityLogged = (e) => {
      loadActivities()
    }
    
    window.addEventListener('activityLogged', handleActivityLogged)
    window.addEventListener('activitiesCleared', loadActivities)
    
    return () => {
      window.removeEventListener('activityLogged', handleActivityLogged)
      window.removeEventListener('activitiesCleared', loadActivities)
    }
  }, [])

  const loadActivities = () => {
    setLoading(true)
    
    try {
      // Get activities from new activity logger
      const allActivities = getActivities()
      
      // Also get legacy audit log entries and convert them
      const auditLog = JSON.parse(localStorage.getItem('cattalytics:audit-log') || '[]')
      const legacyActivities = auditLog.map(entry => ({
        id: entry.id || `legacy_${Date.now()}_${Math.random()}`,
        type: entry.action.includes('animal') ? 'animal' : 
              entry.action.includes('task') ? 'task' :
              entry.action.includes('transaction') ? 'finance' :
              entry.action.includes('inventory') ? 'inventory' :
              entry.action.includes('crop') ? 'crop' : 'system',
        action: entry.action,
        description: `${entry.action} - ${entry.details || ''}`,
        user: entry.user || 'System',
        userName: entry.user || 'System',
        timestamp: entry.timestamp,
        metadata: { details: entry.details, legacy: true }
      }))
      
      // Combine both sources
      const combined = [...allActivities, ...legacyActivities]
      
      // Sort by timestamp (newest first)
      combined.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      
      setActivities(combined)
      setStats(getActivityStats())
    } catch (error) {
      console.error('Error loading activities:', error)
      setActivities([])
    }
    
    setLoading(false)
  }

  const getActivityIcon = (activity) => {
    const action = activity.action || ''
    const type = activity.type || ''
    
    // Type-based icons
    if (type === 'animal') return '🐄'
    if (type === 'task') return '📋'
    if (type === 'finance') return '💰'
    if (type === 'inventory') return '📦'
    if (type === 'crop') return '🌾'
    if (type === 'health') return '🏥'
    if (type === 'user') return '👤'
    
    // Action-based icons
    if (action.includes('create') || action.includes('add')) return '➕'
    if (action.includes('update') || action.includes('edit')) return '✏️'
    if (action.includes('delete') || action.includes('remove')) return '🗑️'
    if (action.includes('complete')) return '✅'
    if (action.includes('export')) return '📤'
    if (action.includes('import')) return '📥'
    if (action.includes('backup')) return '💾'
    if (action.includes('restore')) return '🔄'
    return '📝'
  }

  const getFilteredActivities = () => {
    let filtered = activities
    // Filter by type
    if (filter !== 'all') {
      filtered = filtered.filter(a => a.type === filter)
    }
    // Filter by time range
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    if (timeRange !== 'all') {
      filtered = filtered.filter(a => {
        const activityDate = new Date(a.timestamp)
        if (timeRange === 'today') return activityDate >= today
        if (timeRange === 'week') return activityDate >= weekAgo
        if (timeRange === 'month') return activityDate >= monthAgo
        return true
      })
    }
    // Search filter
    if (search.trim()) {
      const s = search.trim().toLowerCase();
      filtered = filtered.filter(a =>
        (a.description && a.description.toLowerCase().includes(s)) ||
        (a.action && a.action.toLowerCase().includes(s)) ||
        (a.userName && a.userName.toLowerCase().includes(s))
      );
    }
    return filtered
  }

  const groupByDate = (activities) => {
    const groups = {}
    activities.forEach(activity => {
      const date = new Date(activity.timestamp).toLocaleDateString()
      if (!groups[date]) groups[date] = []
      groups[date].push(activity)
    })
    return groups
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now - date

    // Less than 1 minute
    if (diff < 60000) return 'Just now'
    // Less than 1 hour
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    // Less than 1 day
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    // Less than 1 week
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`
    
    return date.toLocaleDateString()
  }

  const getTypeColor = (type) => {
    const colors = {
      animal: '#10b981',
      task: '#3b82f6',
      finance: '#f59e0b',
      inventory: '#8b5cf6',
      crop: '#059669',
      health: '#ef4444',
      user: '#6366f1',
      system: '#6b7280'
    }
    return colors[type] || colors.system
  }

  const filteredActivities = getFilteredActivities().slice(0, displayCount)
  const groupedActivities = groupByDate(filteredActivities)
  const hasMore = getFilteredActivities().length > displayCount

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
        <p>Loading activity feed...</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#111', marginBottom: '8px' }}>
          📊 Activity Feed
        </h1>
        <p style={{ color: '#666', fontSize: '14px' }}>
          Real-time updates and activity history across your farm
        </p>
      </div>

      {/* Filters & Actions */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        padding: '16px',
        marginBottom: '24px',
        display: 'flex',
        gap: '12px',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
                {/* Search */}
                <input
                  type="text"
                  placeholder="Search activities..."
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
                    const filtered = getFilteredActivities();
                    if (!filtered.length) { showError('No activities to export'); return; }
                    exportToCSV(filtered, 'activity-feed.csv');
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
                    const filtered = getFilteredActivities();
                    if (!filtered.length) { showError('No activities to export'); return; }
                    exportToJSON(filtered, 'activity-feed.json');
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
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', fontWeight: '600', color: '#555' }}>Type:</span>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{
              padding: '6px 12px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            <option value="all">All Activities</option>
            <option value="animal">🐄 Animals</option>
            <option value="task">✅ Tasks</option>
            <option value="finance">💰 Finance</option>
            <option value="inventory">📦 Inventory</option>
            <option value="crop">🌾 Crops</option>
            <option value="health">🏥 Health</option>
            <option value="user">👤 User</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', fontWeight: '600', color: '#555' }}>Time:</span>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            style={{
              padding: '6px 12px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="all">All Time</option>
          </select>
        </div>

        <button
          onClick={loadActivities}
          style={{
            padding: '6px 16px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            marginLeft: 'auto'
          }}
        >
          🔄 Refresh
        </button>
      </div>

      {/* Summary Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '12px',
        marginBottom: '24px'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          padding: '16px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#111' }}>
            {filteredActivities.length}
          </div>
          <div style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase' }}>
            Total Activities
          </div>
        </div>
        <div style={{
          background: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          padding: '16px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#10b981' }}>
            {filteredActivities.filter(a => a.icon === '➕').length}
          </div>
          <div style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase' }}>
            Added
          </div>
        </div>
        <div style={{
          background: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          padding: '16px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#3b82f6' }}>
            {filteredActivities.filter(a => a.icon === '✏️').length}
          </div>
          <div style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase' }}>
            Updated
          </div>
        </div>
        <div style={{
          background: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          padding: '16px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#ef4444' }}>
            {filteredActivities.filter(a => a.icon === '🗑️').length}
          </div>
          <div style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase' }}>
            Deleted
          </div>
        </div>
      </div>

      {/* Activity Timeline */}
      {Object.keys(groupedActivities).length === 0 ? (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          padding: '60px 20px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>📭</div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '600' }}>
            No Activities Found
          </h3>
          <p style={{ color: '#666', margin: 0 }}>
            Try adjusting your filters or start using the system
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {Object.entries(groupedActivities).map(([date, dayActivities]) => (
            <div key={date}>
              {/* Date Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '12px'
              }}>
                <div style={{
                  padding: '6px 16px',
                  background: '#f3f4f6',
                  borderRadius: '20px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  {date}
                </div>
                <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
              </div>

              {/* Activities for this date */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {dayActivities.map(activity => (
                  <div
                    key={activity.id}
                    style={{
                      background: 'white',
                      borderRadius: '8px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                      padding: '16px',
                      borderLeft: `4px solid ${getTypeColor(activity.type)}`,
                      display: 'flex',
                      gap: '12px',
                      alignItems: 'flex-start',
                      transition: 'transform 0.2s',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(4px)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(0)'}
                  >
                    {/* Icon */}
                    <div style={{
                      fontSize: '24px',
                      width: '40px',
                      height: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: `${getTypeColor(activity.type)}15`,
                      borderRadius: '8px'
                    }}>
                      {getActivityIcon(activity)}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontWeight: '600', fontSize: '14px', color: '#111' }}>
                          {activity.description || activity.action}
                        </span>
                        <span style={{
                          padding: '2px 8px',
                          background: `${getTypeColor(activity.type)}20`,
                          color: getTypeColor(activity.type),
                          borderRadius: '12px',
                          fontSize: '10px',
                          fontWeight: '600',
                          textTransform: 'uppercase'
                        }}>
                          {activity.type}
                        </span>
                      </div>
                      {activity.metadata && Object.keys(activity.metadata).length > 0 && !activity.metadata.legacy && (
                        <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>
                          {Object.entries(activity.metadata).slice(0, 3).map(([key, val]) => (
                            <span key={key} style={{ marginRight: '12px' }}>
                              <strong>{key}:</strong> {String(val).substring(0, 30)}
                            </span>
                          ))}
                        </div>
                      )}
                      <div style={{ fontSize: '12px', color: '#999' }}>
                        👤 {activity.userName || activity.user} • {formatTime(activity.timestamp)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          
          {/* Load More Button */}
          {hasMore && (
            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <button
                onClick={() => setDisplayCount(prev => prev + 20)}
                style={{
                  padding: '12px 24px',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                Load More Activities
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
