// Audit trail system for tracking all data changes
// Works client-side with localStorage, can be upgraded to server-based logging

import { getCurrentSession } from './auth'

const AUDIT_KEY = 'devinsfarm:audit'
const MAX_AUDIT_ENTRIES = 1000 // Keep last 1000 entries to avoid localStorage overflow

// Action types
export const ACTIONS = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  LOGIN: 'login',
  LOGOUT: 'logout',
  EXPORT: 'export',
  IMPORT: 'import',
  PRINT: 'print'
}

// Entity types
export const ENTITIES = {
  ANIMAL: 'animal',
  TASK: 'task',
  TRANSACTION: 'transaction',
  INVENTORY: 'inventory',
  EQUIPMENT: 'equipment',
  CROP: 'crop',
  TREATMENT: 'treatment',
  MEASUREMENT: 'measurement',
  BREEDING: 'breeding',
  MILK_YIELD: 'milk_yield',
  DIET: 'diet',
  RATION: 'ration',
  USER: 'user',
  GROUP: 'group',
  SYSTEM: 'system'
}

// Log an action
export function logAction(action, entityType, entityId, details = {}) {
  try {
    const session = getCurrentSession()
    const entry = {
      id: 'audit-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      action,
      entityType,
      entityId,
      userId: session?.userId || 'anonymous',
      userName: session?.name || 'Anonymous',
      userRole: session?.role || 'guest',
      details,
      ipAddress: 'client-side', // In production: get from server
      userAgent: navigator.userAgent
    }

    const audit = getAuditLog()
    audit.unshift(entry) // Add to beginning (most recent first)

    // Keep only MAX_AUDIT_ENTRIES
    if (audit.length > MAX_AUDIT_ENTRIES) {
      audit.splice(MAX_AUDIT_ENTRIES)
    }

    localStorage.setItem(AUDIT_KEY, JSON.stringify(audit))

    return entry
  } catch (err) {
    console.error('Failed to log audit entry:', err)
    return null
  }
}

// Get audit log (optionally filtered)
export function getAuditLog(filters = {}) {
  try {
    const raw = localStorage.getItem(AUDIT_KEY)
    let audit = raw ? JSON.parse(raw) : []

    // Apply filters
    if (filters.action) {
      audit = audit.filter(e => e.action === filters.action)
    }
    if (filters.entityType) {
      audit = audit.filter(e => e.entityType === filters.entityType)
    }
    if (filters.entityId) {
      audit = audit.filter(e => e.entityId === filters.entityId)
    }
    if (filters.userId) {
      audit = audit.filter(e => e.userId === filters.userId)
    }
    if (filters.startDate) {
      audit = audit.filter(e => new Date(e.timestamp) >= new Date(filters.startDate))
    }
    if (filters.endDate) {
      audit = audit.filter(e => new Date(e.timestamp) <= new Date(filters.endDate))
    }

    return audit
  } catch (err) {
    console.error('Failed to get audit log:', err)
    return []
  }
}

// Get audit log for specific entity
export function getEntityAuditLog(entityType, entityId) {
  return getAuditLog({ entityType, entityId })
}

// Get recent activity (last N entries)
export function getRecentActivity(limit = 50) {
  const audit = getAuditLog()
  return audit.slice(0, limit)
}

// Get user activity
export function getUserActivity(userId, limit = 50) {
  const audit = getAuditLog({ userId })
  return audit.slice(0, limit)
}

// Get statistics
export function getAuditStats() {
  const audit = getAuditLog()
  
  const stats = {
    total: audit.length,
    byAction: {},
    byEntity: {},
    byUser: {},
    last24Hours: 0,
    lastWeek: 0
  }

  const now = Date.now()
  const day = 24 * 60 * 60 * 1000
  const week = 7 * day

  audit.forEach(entry => {
    // By action
    stats.byAction[entry.action] = (stats.byAction[entry.action] || 0) + 1
    
    // By entity
    stats.byEntity[entry.entityType] = (stats.byEntity[entry.entityType] || 0) + 1
    
    // By user
    stats.byUser[entry.userName] = (stats.byUser[entry.userName] || 0) + 1
    
    // Time-based
    const entryTime = new Date(entry.timestamp).getTime()
    if (now - entryTime < day) {
      stats.last24Hours++
    }
    if (now - entryTime < week) {
      stats.lastWeek++
    }
  })

  return stats
}

// Clear audit log (admin only - with confirmation)
export function clearAuditLog() {
  const session = getCurrentSession()
  if (!session || session.role !== 'MANAGER') {
    return { success: false, error: 'Permission denied' }
  }

  localStorage.removeItem(AUDIT_KEY)
  
  // Log the clearing action (in new log)
  logAction(ACTIONS.DELETE, ENTITIES.SYSTEM, 'audit-log', {
    message: 'Audit log cleared',
    previousEntries: getAuditLog().length
  })

  return { success: true }
}

// Export audit log to CSV
export function exportAuditLogCSV() {
  const audit = getAuditLog()
  
  const headers = ['Timestamp', 'Action', 'Entity Type', 'Entity ID', 'User', 'Role', 'Details']
  const rows = audit.map(e => [
    e.timestamp,
    e.action,
    e.entityType,
    e.entityId,
    e.userName,
    e.userRole,
    JSON.stringify(e.details)
  ])

  const csv = [headers, ...rows].map(row => 
    row.map(cell => {
      const str = String(cell || '')
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`
      }
      return str
    }).join(',')
  ).join('\n')

  // Log the export
  logAction(ACTIONS.EXPORT, ENTITIES.SYSTEM, 'audit-log', {
    entries: audit.length
  })

  return csv
}

// Export audit log to JSON
export function exportAuditLogJSON() {
  const audit = getAuditLog()
  
  // Log the export
  logAction(ACTIONS.EXPORT, ENTITIES.SYSTEM, 'audit-log', {
    entries: audit.length,
    format: 'json'
  })

  return audit
}

// Helper: Format audit entry for display
export function formatAuditEntry(entry) {
  const date = new Date(entry.timestamp)
  const timeStr = date.toLocaleString()
  
  let description = ''
  switch (entry.action) {
    case ACTIONS.CREATE:
      description = `Created ${entry.entityType} (${entry.entityId})`
      break
    case ACTIONS.UPDATE:
      description = `Updated ${entry.entityType} (${entry.entityId})`
      break
    case ACTIONS.DELETE:
      description = `Deleted ${entry.entityType} (${entry.entityId})`
      break
    case ACTIONS.LOGIN:
      description = 'Logged in'
      break
    case ACTIONS.LOGOUT:
      description = 'Logged out'
      break
    case ACTIONS.EXPORT:
      description = `Exported ${entry.entityType} data`
      break
    case ACTIONS.IMPORT:
      description = `Imported ${entry.entityType} data`
      break
    case ACTIONS.PRINT:
      description = `Printed ${entry.entityType} records`
      break
    default:
      description = `${entry.action} ${entry.entityType}`
  }

  return {
    time: timeStr,
    description,
    user: entry.userName,
    role: entry.userRole,
    details: entry.details
  }
}

// Auto-log common operations
export function logCreate(entityType, entityId, entity) {
  return logAction(ACTIONS.CREATE, entityType, entityId, {
    name: entity.name || entity.tag || entity.title || 'N/A'
  })
}

export function logUpdate(entityType, entityId, changes) {
  return logAction(ACTIONS.UPDATE, entityType, entityId, {
    changes: Object.keys(changes).join(', ')
  })
}

export function logDelete(entityType, entityId, entity) {
  return logAction(ACTIONS.DELETE, entityType, entityId, {
    name: entity.name || entity.tag || entity.title || 'N/A'
  })
}

export function logExport(entityType, count) {
  return logAction(ACTIONS.EXPORT, entityType, 'bulk', {
    count
  })
}

export function logImport(entityType, count) {
  return logAction(ACTIONS.IMPORT, entityType, 'bulk', {
    count
  })
}

export function logPrint(entityType, count) {
  return logAction(ACTIONS.PRINT, entityType, 'bulk', {
    count
  })
}
