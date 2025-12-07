/**
 * Real-Time Activity Feed & Collaboration System
 * Tracks all user actions and provides activity history
 */

import { logAudit } from './audit'

// Activity types
export const ACTIVITY_TYPES = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  VIEW: 'view',
  EXPORT: 'export',
  IMPORT: 'import',
  TASK_COMPLETE: 'task_complete',
  PAYMENT: 'payment',
  ALERT: 'alert'
}

// Entity types
export const ENTITY_TYPES = {
  ANIMAL: 'animal',
  TASK: 'task',
  CROP: 'crop',
  FINANCE: 'finance',
  INVENTORY: 'inventory',
  GROUP: 'group',
  PASTURE: 'pasture',
  HEALTH: 'health',
  BREEDING: 'breeding',
  FEEDING: 'feeding',
  TREATMENT: 'treatment',
  MEASUREMENT: 'measurement'
}

/**
 * Log an activity to the feed
 */
export function logActivity(activity) {
  const timestamp = new Date().toISOString()
  const currentUser = JSON.parse(localStorage.getItem('cattalytics:current-user') || '{}')
  
  const activityEntry = {
    id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp,
    user: currentUser.username || 'System',
    userId: currentUser.id || 'system',
    type: activity.type,
    entityType: activity.entityType,
    entityId: activity.entityId,
    entityName: activity.entityName,
    action: activity.action,
    description: activity.description,
    metadata: activity.metadata || {},
    importance: activity.importance || 'normal', // low, normal, high, critical
    icon: getActivityIcon(activity.type, activity.entityType)
  }

  // Store in activity feed
  const activities = getActivities()
  activities.unshift(activityEntry) // Add to beginning
  
  // Keep only last 1000 activities
  if (activities.length > 1000) {
    activities.splice(1000)
  }
  
  localStorage.setItem('cattalytics:activities', JSON.stringify(activities))
  
  // Also log to audit if it's a significant action
  if (['create', 'update', 'delete', 'payment'].includes(activity.type)) {
    logAudit(activity.action, activity.entityType, activity.metadata)
  }
  
  // Trigger custom event for real-time updates
  window.dispatchEvent(new CustomEvent('activity-logged', { detail: activityEntry }))
  
  return activityEntry
}

/**
 * Get all activities
 */
export function getActivities(filters = {}) {
  const activities = JSON.parse(localStorage.getItem('cattalytics:activities') || '[]')
  
  let filtered = activities
  
  // Filter by date range
  if (filters.startDate) {
    filtered = filtered.filter(a => new Date(a.timestamp) >= new Date(filters.startDate))
  }
  if (filters.endDate) {
    filtered = filtered.filter(a => new Date(a.timestamp) <= new Date(filters.endDate))
  }
  
  // Filter by user
  if (filters.userId) {
    filtered = filtered.filter(a => a.userId === filters.userId)
  }
  
  // Filter by entity type
  if (filters.entityType) {
    filtered = filtered.filter(a => a.entityType === filters.entityType)
  }
  
  // Filter by activity type
  if (filters.activityType) {
    filtered = filtered.filter(a => a.type === filters.activityType)
  }
  
  // Filter by importance
  if (filters.importance) {
    filtered = filtered.filter(a => a.importance === filters.importance)
  }
  
  // Search in description
  if (filters.search) {
    const searchLower = filters.search.toLowerCase()
    filtered = filtered.filter(a => 
      a.description.toLowerCase().includes(searchLower) ||
      a.entityName?.toLowerCase().includes(searchLower) ||
      a.action.toLowerCase().includes(searchLower)
    )
  }
  
  // Limit results
  if (filters.limit) {
    filtered = filtered.slice(0, filters.limit)
  }
  
  return filtered
}

/**
 * Get activity summary statistics
 */
export function getActivitySummary(days = 7) {
  const activities = getActivities()
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  
  const recentActivities = activities.filter(a => new Date(a.timestamp) >= cutoff)
  
  const summary = {
    total: recentActivities.length,
    byType: {},
    byEntityType: {},
    byUser: {},
    byDay: {},
    topEntities: []
  }
  
  // Count by type
  recentActivities.forEach(activity => {
    summary.byType[activity.type] = (summary.byType[activity.type] || 0) + 1
    summary.byEntityType[activity.entityType] = (summary.byEntityType[activity.entityType] || 0) + 1
    summary.byUser[activity.user] = (summary.byUser[activity.user] || 0) + 1
    
    // Count by day
    const day = activity.timestamp.split('T')[0]
    summary.byDay[day] = (summary.byDay[day] || 0) + 1
  })
  
  // Find most active entities
  const entityCounts = {}
  recentActivities.forEach(activity => {
    if (activity.entityId) {
      const key = `${activity.entityType}:${activity.entityId}`
      entityCounts[key] = (entityCounts[key] || 0) + 1
    }
  })
  
  summary.topEntities = Object.entries(entityCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([key, count]) => {
      const [type, id] = key.split(':')
      const activity = recentActivities.find(a => a.entityId === id && a.entityType === type)
      return {
        type,
        id,
        name: activity?.entityName || id,
        count
      }
    })
  
  return summary
}

/**
 * Get recent activity for a specific entity
 */
export function getEntityActivity(entityType, entityId, limit = 10) {
  return getActivities({
    entityType,
    limit
  }).filter(a => a.entityId === entityId)
}

/**
 * Get user activity history
 */
export function getUserActivity(userId, limit = 50) {
  return getActivities({ userId, limit })
}

/**
 * Clear old activities (older than specified days)
 */
export function clearOldActivities(days = 90) {
  const activities = getActivities()
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  
  const filtered = activities.filter(a => new Date(a.timestamp) >= cutoff)
  localStorage.setItem('cattalytics:activities', JSON.stringify(filtered))
  
  return activities.length - filtered.length // Number of activities removed
}

/**
 * Export activities to JSON
 */
export function exportActivities(filters = {}) {
  const activities = getActivities(filters)
  const blob = new Blob([JSON.stringify(activities, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `activities-${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * Get activity icon based on type and entity
 */
function getActivityIcon(type, entityType) {
  const icons = {
    // Activity types
    create: '➕',
    update: '✏️',
    delete: '🗑️',
    view: '👁️',
    export: '📤',
    import: '📥',
    task_complete: '✅',
    payment: '💳',
    alert: '🔔',
    
    // Entity types
    animal: '🐄',
    task: '✅',
    crop: '🌾',
    finance: '💰',
    inventory: '📦',
    group: '👥',
    pasture: '🌱',
    health: '🏥',
    breeding: '🐄',
    feeding: '🌾',
    treatment: '💉',
    measurement: '📏'
  }
  
  return icons[entityType] || icons[type] || '📝'
}

/**
 * Get activity color based on importance
 */
export function getActivityColor(importance) {
  const colors = {
    low: '#6b7280',
    normal: '#3b82f6',
    high: '#f59e0b',
    critical: '#ef4444'
  }
  return colors[importance] || colors.normal
}

/**
 * Format activity description for display
 */
export function formatActivityDescription(activity) {
  const templates = {
    create: `Created ${activity.entityType} "${activity.entityName}"`,
    update: `Updated ${activity.entityType} "${activity.entityName}"`,
    delete: `Deleted ${activity.entityType} "${activity.entityName}"`,
    view: `Viewed ${activity.entityType} "${activity.entityName}"`,
    export: `Exported ${activity.entityType} data`,
    import: `Imported ${activity.entityType} data`,
    task_complete: `Completed task "${activity.entityName}"`,
    payment: `Recorded ${activity.metadata?.type} payment: $${activity.metadata?.amount}`,
    alert: activity.description
  }
  
  return templates[activity.type] || activity.description || activity.action
}

/**
 * Get relative time string
 */
export function getRelativeTime(timestamp) {
  const now = new Date()
  const then = new Date(timestamp)
  const diffMs = now - then
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  
  return then.toLocaleDateString()
}

/**
 * Watch for activity changes in real-time
 */
export function watchActivities(callback) {
  const handler = (event) => {
    callback(event.detail)
  }
  
  window.addEventListener('activity-logged', handler)
  
  // Return unsubscribe function
  return () => window.removeEventListener('activity-logged', handler)
}
