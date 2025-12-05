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

/**
 * Generate sample audit logs for demonstration
 * Creates realistic activity patterns for a farm operation
 */
export function generateSampleAuditLogs() {
  const now = Date.now()
  const day = 24 * 60 * 60 * 1000
  
  const users = [
    { name: 'John Kamau', role: 'MANAGER' },
    { name: 'Mary Wanjiru', role: 'WORKER' },
    { name: 'Peter Omondi', role: 'WORKER' }
  ]
  
  const samples = [
    // Recent activity (today)
    { hours: 2, action: ACTIONS.UPDATE, entity: ENTITIES.MILK_YIELD, id: 'milk_001', user: 1, details: { volume: '18.5 liters', animal: 'Bessie #101' } },
    { hours: 3, action: ACTIONS.CREATE, entity: ENTITIES.TASK, id: 'task_201', user: 0, details: { title: 'Fence repair - North paddock' } },
    { hours: 4, action: ACTIONS.UPDATE, entity: ENTITIES.ANIMAL, id: 'cattle_005', user: 1, details: { changes: 'health status, weight' } },
    { hours: 5, action: ACTIONS.CREATE, entity: ENTITIES.TRANSACTION, id: 'tx_145', user: 0, details: { type: 'income', amount: 'KES 15,000', category: 'Milk sales' } },
    { hours: 6, action: ACTIONS.UPDATE, entity: ENTITIES.INVENTORY, id: 'inv_dairy_meal', user: 2, details: { quantity: '-50kg', operation: 'feeding' } },
    
    // Yesterday
    { hours: 20, action: ACTIONS.CREATE, entity: ENTITIES.TREATMENT, id: 'treat_089', user: 1, details: { animal: 'Daisy #203', type: 'vaccination', medicine: 'FMD vaccine' } },
    { hours: 22, action: ACTIONS.UPDATE, entity: ENTITIES.CROP, id: 'crop_maize_02', user: 2, details: { stage: 'flowering', notes: 'Applied fertilizer' } },
    { hours: 24, action: ACTIONS.DELETE, entity: ENTITIES.TASK, id: 'task_198', user: 0, details: { title: 'Clean dairy shed - completed' } },
    { hours: 26, action: ACTIONS.CREATE, entity: ENTITIES.MEASUREMENT, id: 'meas_067', user: 1, details: { animal: 'Bull #305', weight: '485kg', type: 'weight' } },
    { hours: 28, action: ACTIONS.UPDATE, entity: ENTITIES.MILK_YIELD, id: 'milk_002', user: 1, details: { volume: '20.2 liters', animal: 'Rosie #104' } },
    
    // 2 days ago
    { hours: 44, action: ACTIONS.CREATE, entity: ENTITIES.BREEDING, id: 'breed_034', user: 0, details: { cow: 'Bella #107', bull: 'Champion #301', method: 'Natural' } },
    { hours: 46, action: ACTIONS.UPDATE, entity: ENTITIES.EQUIPMENT, id: 'eq_tractor_01', user: 2, details: { maintenance: 'Oil change', hours: '520' } },
    { hours: 48, action: ACTIONS.CREATE, entity: ENTITIES.TRANSACTION, id: 'tx_144', user: 0, details: { type: 'expense', amount: 'KES 8,500', category: 'Feed purchase' } },
    { hours: 50, action: ACTIONS.EXPORT, entity: ENTITIES.ANIMAL, id: 'bulk', user: 0, details: { count: 45, format: 'CSV' } },
    
    // 3 days ago
    { hours: 68, action: ACTIONS.CREATE, entity: ENTITIES.ANIMAL, id: 'cattle_045', user: 0, details: { name: 'Luna', tag: '#209', breed: 'Friesian', gender: 'Female' } },
    { hours: 70, action: ACTIONS.UPDATE, entity: ENTITIES.DIET, id: 'diet_dairy_01', user: 1, details: { changes: 'Added mineral supplement' } },
    { hours: 72, action: ACTIONS.CREATE, entity: ENTITIES.TASK, id: 'task_200', user: 0, details: { title: 'Apply pesticide - Tomato field', due: 'Tomorrow' } },
    { hours: 74, action: ACTIONS.UPDATE, entity: ENTITIES.INVENTORY, id: 'inv_hay', user: 2, details: { quantity: '+200 bales', operation: 'stock received' } },
    
    // 4 days ago
    { hours: 92, action: ACTIONS.CREATE, entity: ENTITIES.TREATMENT, id: 'treat_088', user: 1, details: { animal: 'Molly #206', type: 'deworming', medicine: 'Albendazole' } },
    { hours: 94, action: ACTIONS.UPDATE, entity: ENTITIES.CROP, id: 'crop_beans_01', user: 2, details: { stage: 'harvesting', yield: '12 bags' } },
    { hours: 96, action: ACTIONS.CREATE, entity: ENTITIES.TRANSACTION, id: 'tx_143', user: 0, details: { type: 'income', amount: 'KES 25,000', category: 'Crop sales' } },
    
    // 5 days ago
    { hours: 116, action: ACTIONS.UPDATE, entity: ENTITIES.ANIMAL, id: 'cattle_012', user: 1, details: { changes: 'status: breeding', notes: 'Heat detected' } },
    { hours: 118, action: ACTIONS.CREATE, entity: ENTITIES.MILK_YIELD, id: 'milk_003', user: 1, details: { volume: '19.8 liters', animal: 'Bessie #101' } },
    { hours: 120, action: ACTIONS.UPDATE, entity: ENTITIES.TASK, id: 'task_195', user: 2, details: { status: 'completed', notes: 'Water troughs cleaned' } },
    
    // 6 days ago
    { hours: 140, action: ACTIONS.CREATE, entity: ENTITIES.RATION, id: 'ration_034', user: 0, details: { group: 'Dairy cows', formula: 'High protein mix' } },
    { hours: 142, action: ACTIONS.UPDATE, entity: ENTITIES.INVENTORY, id: 'inv_maize_germ', user: 2, details: { quantity: '-30kg', operation: 'feeding' } },
    { hours: 144, action: ACTIONS.CREATE, entity: ENTITIES.TRANSACTION, id: 'tx_142', user: 0, details: { type: 'expense', amount: 'KES 12,000', category: 'Veterinary services' } },
    
    // 1 week ago
    { hours: 164, action: ACTIONS.IMPORT, entity: ENTITIES.ANIMAL, id: 'bulk', user: 0, details: { count: 15, source: 'CSV file', notes: 'New cattle batch' } },
    { hours: 166, action: ACTIONS.CREATE, entity: ENTITIES.TREATMENT, id: 'treat_087', user: 1, details: { animal: 'Group: Calves', type: 'vaccination', medicine: 'Multivaccine' } },
    { hours: 168, action: ACTIONS.UPDATE, entity: ENTITIES.CROP, id: 'crop_maize_01', user: 2, details: { stage: 'mature', notes: 'Ready for harvest next week' } }
  ]
  
  const audit = []
  
  samples.forEach(sample => {
    const user = users[sample.user]
    const timestamp = new Date(now - (sample.hours * 60 * 60 * 1000))
    
    const entry = {
      id: 'audit-' + timestamp.getTime() + '-' + Math.random().toString(36).substr(2, 9),
      timestamp: timestamp.toISOString(),
      action: sample.action,
      entityType: sample.entity,
      entityId: sample.id,
      userId: `user_${sample.user}`,
      userName: user.name,
      userRole: user.role,
      details: sample.details,
      ipAddress: '192.168.1.' + (10 + sample.user),
      userAgent: 'Mozilla/5.0 (Mobile) Farm Management App'
    }
    
    audit.push(entry)
  })
  
  // Add to existing log
  const existing = getAuditLog()
  const combined = [...audit, ...existing]
  
  // Keep only MAX_AUDIT_ENTRIES
  if (combined.length > MAX_AUDIT_ENTRIES) {
    combined.splice(MAX_AUDIT_ENTRIES)
  }
  
  localStorage.setItem(AUDIT_KEY, JSON.stringify(combined))
  
  return {
    success: true,
    generated: audit.length,
    total: combined.length
  }
}

// Quick shorthand for common logging
export function logActivity(action, description, metadata = {}) {
  return logAction(action, ENTITIES.SYSTEM, 'activity', {
    description,
    ...metadata
  })
}
