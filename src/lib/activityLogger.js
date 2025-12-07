/**
 * Activity Logger - Track all user actions across the farm management system
 * Stores activity history in localStorage for display in ActivityFeed
 */

const STORAGE_KEY = 'cattalytics:activities'
const MAX_ACTIVITIES = 1000 // Keep last 1000 activities

/**
 * Get current user from localStorage
 */
function getCurrentUser() {
  try {
    const authData = localStorage.getItem('cattalytics:auth')
    if (authData) {
      const parsed = JSON.parse(authData)
      return parsed.user || null
    }
  } catch (e) {
    console.error('Error getting current user:', e)
  }
  return null
}

/**
 * Log a farm activity
 * @param {string} type - Activity type: 'animal', 'task', 'crop', 'finance', 'inventory', 'health', 'user', 'system'
 * @param {string} action - Action performed: 'created', 'updated', 'deleted', 'completed', etc.
 * @param {string} description - Human-readable description of the activity
 * @param {object} metadata - Additional data (IDs, values, etc.)
 */
export function logActivity(type, action, description, metadata = {}) {
  try {
    const user = getCurrentUser()
    
    const activity = {
      id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: type.toLowerCase(),
      action: action.toLowerCase(),
      description,
      metadata,
      timestamp: new Date().toISOString(),
      user: user?.email || user?.name || 'System',
      userName: user?.name || 'System User'
    }

    // Get existing activities
    const activities = getActivities()
    
    // Add new activity to the beginning
    activities.unshift(activity)
    
    // Keep only the last MAX_ACTIVITIES
    if (activities.length > MAX_ACTIVITIES) {
      activities.splice(MAX_ACTIVITIES)
    }
    
    // Save back to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(activities))
    
    // Dispatch custom event so ActivityFeed can update in real-time
    window.dispatchEvent(new CustomEvent('activityLogged', { detail: activity }))
    
    return activity
  } catch (e) {
    console.error('Error logging activity:', e)
    return null
  }
}

/**
 * Get all activities
 */
export function getActivities() {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch (e) {
    console.error('Error getting activities:', e)
    return []
  }
}

/**
 * Get activities filtered by type
 */
export function getActivitiesByType(type) {
  const activities = getActivities()
  return type === 'all' ? activities : activities.filter(a => a.type === type)
}

/**
 * Get activities filtered by user
 */
export function getActivitiesByUser(userEmail) {
  const activities = getActivities()
  return userEmail === 'all' ? activities : activities.filter(a => a.user === userEmail)
}

/**
 * Get activities within date range
 */
export function getActivitiesInRange(startDate, endDate) {
  const activities = getActivities()
  const start = new Date(startDate).getTime()
  const end = new Date(endDate).getTime()
  
  return activities.filter(a => {
    const timestamp = new Date(a.timestamp).getTime()
    return timestamp >= start && timestamp <= end
  })
}

/**
 * Clear all activities
 */
export function clearActivities() {
  try {
    localStorage.removeItem(STORAGE_KEY)
    window.dispatchEvent(new CustomEvent('activitiesCleared'))
    return true
  } catch (e) {
    console.error('Error clearing activities:', e)
    return false
  }
}

/**
 * Get activity statistics
 */
export function getActivityStats() {
  const activities = getActivities()
  
  const stats = {
    total: activities.length,
    byType: {},
    byAction: {},
    byUser: {},
    today: 0,
    thisWeek: 0,
    thisMonth: 0
  }
  
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const weekStart = todayStart - (7 * 24 * 60 * 60 * 1000)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
  
  activities.forEach(activity => {
    // Count by type
    stats.byType[activity.type] = (stats.byType[activity.type] || 0) + 1
    
    // Count by action
    stats.byAction[activity.action] = (stats.byAction[activity.action] || 0) + 1
    
    // Count by user
    stats.byUser[activity.user] = (stats.byUser[activity.user] || 0) + 1
    
    // Count by time period
    const timestamp = new Date(activity.timestamp).getTime()
    if (timestamp >= todayStart) stats.today++
    if (timestamp >= weekStart) stats.thisWeek++
    if (timestamp >= monthStart) stats.thisMonth++
  })
  
  return stats
}

// Convenience functions for common activity types

export function logAnimalActivity(action, description, animalData) {
  return logActivity('animal', action, description, { 
    animalId: animalData.id,
    tagNumber: animalData.tagNumber,
    name: animalData.name
  })
}

export function logTaskActivity(action, description, taskData) {
  return logActivity('task', action, description, {
    taskId: taskData.id,
    title: taskData.title,
    priority: taskData.priority
  })
}

export function logCropActivity(action, description, cropData) {
  return logActivity('crop', action, description, {
    cropId: cropData.id,
    cropName: cropData.cropName,
    fieldName: cropData.fieldName
  })
}

export function logFinanceActivity(action, description, financeData) {
  return logActivity('finance', action, description, {
    transactionId: financeData.id,
    type: financeData.type,
    category: financeData.category,
    amount: financeData.amount
  })
}

export function logInventoryActivity(action, description, inventoryData) {
  return logActivity('inventory', action, description, {
    itemId: inventoryData.id,
    name: inventoryData.name,
    quantity: inventoryData.quantity
  })
}

export function logHealthActivity(action, description, healthData) {
  return logActivity('health', action, description, {
    recordId: healthData.id,
    animalId: healthData.animalId,
    type: healthData.type
  })
}

export function logUserActivity(action, description, userData = {}) {
  return logActivity('user', action, description, userData)
}

export function logSystemActivity(action, description, systemData = {}) {
  return logActivity('system', action, description, systemData)
}

// Export all functions
export default {
  logActivity,
  getActivities,
  getActivitiesByType,
  getActivitiesByUser,
  getActivitiesInRange,
  clearActivities,
  getActivityStats,
  logAnimalActivity,
  logTaskActivity,
  logCropActivity,
  logFinanceActivity,
  logInventoryActivity,
  logHealthActivity,
  logUserActivity,
  logSystemActivity
}
